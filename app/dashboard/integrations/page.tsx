import { Box } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { IntegrationsPanel } from '@/components/integrations/integrations-panel';
import type { OrganizationIntegration } from '@/lib/types/database';

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

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, address')
    .eq('id', member.organization_id)
    .single();

  if (!org) redirect('/onboarding');

  const { data: integrations } = await supabase
    .from('organization_integrations')
    .select('*')
    .eq('organization_id', member.organization_id);

  // Get review counts per integration
  const integrationList = (integrations ?? []) as unknown as OrganizationIntegration[];
  const reviewCounts: Record<string, number> = {};

  if (integrationList.length > 0) {
    const { data: counts } = await supabase
      .from('external_reviews')
      .select('integration_id')
      .eq('organization_id', member.organization_id);

    if (counts) {
      for (const row of counts) {
        reviewCounts[row.integration_id] = (reviewCounts[row.integration_id] ?? 0) + 1;
      }
    }
  }

  return (
    <Box>
      <PageHeader
        title="Integrations"
        subtitle="Connect your review platforms to see all reviews in one place"
      />
      <IntegrationsPanel
        integrations={integrationList}
        reviewCounts={reviewCounts}
        isOwner={member.role === 'owner'}
        orgName={org.name}
        orgAddress={org.address ?? ''}
      />
    </Box>
  );
}
