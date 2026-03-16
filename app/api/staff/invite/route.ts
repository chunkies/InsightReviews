import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/utils/activity-logger';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Auth client to get current user
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    const { email, orgId } = body;

    if (!email || !orgId) {
      return NextResponse.json({ error: 'Email and orgId are required' }, { status: 400 });
    }

    // Service role client for admin operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }
    );

    // Verify the current user is an owner of this org
    const { data: currentMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!currentMember || currentMember.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can invite staff' }, { status: 403 });
    }

    // Check if user already exists in auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let invitedUserId: string;

    if (existingUser) {
      invitedUserId = existingUser.id;

      // Check if already a member of this org
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', orgId)
        .eq('user_id', invitedUserId)
        .maybeSingle();

      if (existingMember) {
        return NextResponse.json({ error: 'This user is already a member of your team' }, { status: 409 });
      }
    } else {
      // Invite new user via Supabase admin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        email,
        { redirectTo: `${siteUrl}/auth/confirm?next=/dashboard` }
      );

      if (inviteError || !inviteData.user) {
        console.error('Invite error:', inviteError);
        return NextResponse.json(
          { error: inviteError?.message || 'Failed to send invite' },
          { status: 500 }
        );
      }

      invitedUserId = inviteData.user.id;
    }

    // Add to organization_members as staff
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: orgId,
        user_id: invitedUserId,
        role: 'staff',
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
      details: { email, role: 'staff' },
    });

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        user_id: invitedUserId,
        role: 'staff',
        created_at: member.created_at,
        email,
      },
    });
  } catch (error) {
    console.error('Staff invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
