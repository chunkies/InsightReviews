import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 404 });

  const { data: roles, error } = await supabase
    .from('roles')
    .select('*')
    .eq('organization_id', member.organization_id)
    .order('created_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ roles });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!member || member.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can manage roles' }, { status: 403 });
  }

  const { name, permissions } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
  }

  const { data: role, error } = await supabase
    .from('roles')
    .insert({
      organization_id: member.organization_id,
      name: name.trim(),
      permissions: permissions || [],
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return NextResponse.json({ error: 'A role with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ role });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!member || member.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can manage roles' }, { status: 403 });
  }

  const { id, name, permissions } = await request.json();
  if (!id) return NextResponse.json({ error: 'Role id is required' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim();
  if (permissions !== undefined) updates.permissions = permissions;

  const { data: role, error } = await supabase
    .from('roles')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', member.organization_id)
    .select()
    .single();

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return NextResponse.json({ error: 'A role with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ role });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!member || member.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can manage roles' }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'Role id is required' }, { status: 400 });

  // Check if any members are assigned to this role
  const { count } = await supabase
    .from('organization_members')
    .select('id', { count: 'exact', head: true })
    .eq('role_id', id)
    .eq('organization_id', member.organization_id);

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${count} staff member(s) are assigned to this role. Reassign them first.` },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', id)
    .eq('organization_id', member.organization_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
