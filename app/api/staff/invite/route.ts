import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/utils/activity-logger';
import { envRequired } from '@/lib/utils/env';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Auth client to get current user
    const supabaseAuth = createServerClient(
      envRequired('NEXT_PUBLIC_SUPABASE_URL'),
      envRequired('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, orgId, roleId } = body;

    if (!email || !orgId) {
      return NextResponse.json({ error: 'Email and orgId are required' }, { status: 400 });
    }

    // Service role client for admin operations
    const supabase = createServerClient(
      envRequired('NEXT_PUBLIC_SUPABASE_URL'),
      envRequired('SUPABASE_SERVICE_ROLE_KEY'),
      {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }
    );

    // Verify the current user is an owner or has invite_staff permission
    const { data: currentMember } = await supabase
      .from('organization_members')
      .select('role, role_id')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!currentMember) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
    }

    let canInvite = currentMember.role === 'owner';
    if (!canInvite && currentMember.role_id) {
      const { data: roleData } = await supabase
        .from('roles')
        .select('permissions')
        .eq('id', currentMember.role_id)
        .single();
      if (roleData && (roleData.permissions as string[]).includes('invite_staff')) {
        canInvite = true;
      }
    }

    if (!canInvite) {
      return NextResponse.json({ error: 'You do not have permission to invite staff' }, { status: 403 });
    }

    // Check if already a member by email
    const { data: existingByEmail } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgId)
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingByEmail) {
      return NextResponse.json({ error: 'This user is already a member of your team' }, { status: 409 });
    }

    // Use inviteUserByEmail — handles both new and existing auth users
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const { buildAuthRedirectUrl } = await import('@/lib/utils/auth-redirect');
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      { redirectTo: buildAuthRedirectUrl(siteUrl, '/dashboard') }
    );

    if (inviteError || !inviteData.user) {
      // If user already exists in auth, inviteUserByEmail may fail — find them by email
      // Paginate instead of loading all users to avoid OOM with large user bases
      type AuthUser = { id: string; email?: string };
      let existingUser: AuthUser | null = null;
      let page = 1;
      const perPage = 50;
      while (!existingUser) {
        const { data: pageData } = await supabase.auth.admin.listUsers({ page, perPage });
        if (!pageData?.users?.length) break;
        const match = pageData.users.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        );
        if (match) {
          existingUser = match;
          break;
        }
        if (pageData.users.length < perPage) break;
        page++;
        if (page > 20) break; // Safety limit: don't scan more than 1000 users
      }

      if (!existingUser) {
        console.error('Invite error:', inviteError);
        return NextResponse.json(
          { error: inviteError?.message || 'Failed to send invite' },
          { status: 500 }
        );
      }

      // Check if already a member by user_id
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', orgId)
        .eq('user_id', existingUser.id)
        .maybeSingle();

      if (existingMember) {
        return NextResponse.json({ error: 'This user is already a member of your team' }, { status: 409 });
      }

      // Insert as pending — they need to log in to activate
      const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: orgId,
          user_id: existingUser.id,
          role: 'staff',
          status: 'pending',
          email: email.toLowerCase(),
          role_id: roleId || null,
        })
        .select()
        .single();

      if (memberError) {
        console.error('Member insert error:', memberError);
        return NextResponse.json({ error: 'Failed to add member to organization' }, { status: 500 });
      }

      await logActivity(supabaseAuth, {
        organizationId: orgId,
        action: 'staff_invited',
        entityType: 'organization_member',
        entityId: member.id,
        details: { email, role: 'staff', roleId: roleId || null },
      });

      return NextResponse.json({
        success: true,
        member: {
          id: member.id,
          user_id: existingUser.id,
          role: 'staff',
          role_id: roleId || null,
          status: 'pending',
          email: email.toLowerCase(),
          display_name: null,
          created_at: member.created_at,
        },
      });
    }

    // New user invited — insert as pending
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: orgId,
        user_id: inviteData.user.id,
        role: 'staff',
        status: 'pending',
        email: email.toLowerCase(),
        role_id: roleId || null,
      })
      .select()
      .single();

    if (memberError) {
      console.error('Member insert error:', memberError);
      return NextResponse.json({ error: 'Failed to add member to organization' }, { status: 500 });
    }

    await logActivity(supabaseAuth, {
      organizationId: orgId,
      action: 'staff_invited',
      entityType: 'organization_member',
      entityId: member.id,
      details: { email, role: 'staff', roleId: roleId || null },
    });

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        user_id: inviteData.user.id,
        role: 'staff',
        role_id: roleId || null,
        status: 'pending',
        email: email.toLowerCase(),
        display_name: null,
        created_at: member.created_at,
      },
    });
  } catch (error) {
    console.error('Staff invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
