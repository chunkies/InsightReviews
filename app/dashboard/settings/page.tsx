import { Box } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { SettingsForm } from '@/components/settings/settings-form';
import { ProfileForm } from '@/components/settings/profile-form';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: member } = await supabase
    .from('organization_members')
    .select('id, organization_id, role, display_name, email')
    .eq('user_id', user.id)
    .single();

  if (!member) redirect('/onboarding');

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', member.organization_id)
    .single();

  const { data: platforms } = await supabase
    .from('review_platforms')
    .select('*')
    .eq('organization_id', member.organization_id)
    .order('display_order');

  const { data: integrations } = await supabase
    .from('organization_integrations')
    .select('*')
    .eq('organization_id', member.organization_id);

  return (
    <Box>
      <PageHeader title="Settings" subtitle="Manage your profile and business settings" />
      <ProfileForm
        memberId={member.id}
        displayName={member.display_name ?? ''}
        email={member.email ?? user.email ?? ''}
      />
      <Box sx={{ mt: 4 }}>
        <SettingsForm
          org={org!}
          platforms={platforms ?? []}
          integrations={integrations ?? []}
          isOwner={member.role === 'owner'}
        />
      </Box>
    </Box>
  );
}
