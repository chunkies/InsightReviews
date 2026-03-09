import { Box } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { SettingsForm } from '@/components/settings/settings-form';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role')
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

  return (
    <Box>
      <PageHeader title="Settings" subtitle="Manage your business profile and review platforms" />
      <SettingsForm
        org={org!}
        platforms={platforms ?? []}
        isOwner={member.role === 'owner'}
      />
    </Box>
  );
}
