import { Box } from '@mui/material';
import { PageHeader } from '@/components/shared/page-header';
import { CollectForm } from '@/components/collect/collect-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function CollectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!member) redirect('/onboarding');

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, sms_template')
    .eq('id', member.organization_id)
    .single();

  if (!org) redirect('/onboarding');

  return (
    <Box>
      <PageHeader
        title="Collect Reviews"
        subtitle="Enter the customer's phone number to send a review request"
      />
      <CollectForm
        orgId={org.id}
        orgName={org.name}
        orgSlug={org.slug}
      />
    </Box>
  );
}
