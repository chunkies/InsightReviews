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
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!member) redirect('/onboarding');

  const { data: members } = await supabase
    .from('organization_members')
    .select('id, organization_id, user_id, role, created_at')
    .eq('organization_id', member.organization_id)
    .order('created_at');

  return (
    <Box>
      <PageHeader
        title="Staff"
        subtitle="Manage team members who can send review requests"
      />
      <StaffList
        members={members ?? []}
        isOwner={member.role === 'owner'}
        orgId={member.organization_id}
        currentUserId={user.id}
      />
    </Box>
  );
}
