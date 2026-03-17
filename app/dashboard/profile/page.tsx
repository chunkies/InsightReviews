import { Box } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { ProfilePageForm } from '@/components/profile/profile-page-form';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: member } = await supabase
    .from('organization_members')
    .select('id, organization_id, role, display_name, email, phone, job_title, avatar_url, timezone')
    .eq('user_id', user.id)
    .single();

  if (!member) redirect('/onboarding');

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', member.organization_id)
    .single();

  return (
    <Box>
      <PageHeader title="My Profile" subtitle="Manage your personal details" />
      <ProfilePageForm
        memberId={member.id}
        displayName={member.display_name ?? ''}
        email={member.email ?? user.email ?? ''}
        phone={member.phone ?? ''}
        jobTitle={member.job_title ?? ''}
        timezone={member.timezone ?? 'Australia/Sydney'}
        role={member.role}
        orgName={org?.name ?? ''}
      />
    </Box>
  );
}
