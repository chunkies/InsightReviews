import { Box } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { IntegrationsPanel } from '@/components/integrations/integrations-panel';

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!member) redirect('/onboarding');

  const { data: integrations } = await supabase
    .from('organization_integrations')
    .select('*')
    .eq('organization_id', member.organization_id);

  const { data: org } = await supabase
    .from('organizations')
    .select('name, address')
    .eq('id', member.organization_id)
    .single();

  // Count external reviews per platform
  const { data: reviewCounts } = await supabase
    .from('external_reviews')
    .select('platform')
    .eq('organization_id', member.organization_id);

  const countByPlatform: Record<string, number> = {};
  (reviewCounts || []).forEach((r: { platform: string }) => {
    countByPlatform[r.platform] = (countByPlatform[r.platform] || 0) + 1;
  });

  return (
    <Box>
      <PageHeader
        title="Integrations"
        subtitle="Connect your review platforms to see all reviews in one place"
      />
      <IntegrationsPanel
        integrations={integrations ?? []}
        reviewCounts={countByPlatform}
        isOwner={member.role === 'owner'}
        organizationId={member.organization_id}
        orgName={org?.name ?? ''}
        orgAddress={org?.address ?? ''}
      />
    </Box>
  );
}
