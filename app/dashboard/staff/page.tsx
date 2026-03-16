import { Box } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { StaffList } from '@/components/settings/staff-list';

export default async function StaffPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role, role_id')
    .eq('user_id', user.id)
    .single();

  if (!member) redirect('/onboarding');

  const { data: members } = await supabase
    .from('organization_members')
    .select('id, organization_id, user_id, role, role_id, status, email, display_name, created_at')
    .eq('organization_id', member.organization_id)
    .order('created_at');

  const { data: roles } = await supabase
    .from('roles')
    .select('id, organization_id, name, permissions, created_at')
    .eq('organization_id', member.organization_id)
    .order('created_at');

  // Determine permissions for this user
  const isOwner = member.role === 'owner';
  let userPermissions: string[] = [];
  if (!isOwner && member.role_id) {
    const userRole = (roles ?? []).find((r) => r.id === member.role_id);
    userPermissions = (userRole?.permissions as string[]) ?? [];
  }

  // Can invite if owner OR has invite_staff permission
  const canInvite = isOwner || userPermissions.includes('invite_staff');
  // Can manage roles only if owner
  const canManageRoles = isOwner;

  return (
    <Box>
      <PageHeader
        title="Staff"
        subtitle="Manage team members who can send review requests"
      />
      <StaffList
        members={members ?? []}
        roles={roles ?? []}
        isOwner={isOwner}
        canInvite={canInvite}
        canManageRoles={canManageRoles}
        orgId={member.organization_id}
        currentUserId={user.id}
      />
    </Box>
  );
}
