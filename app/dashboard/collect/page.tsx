import { Box } from '@mui/material';
import { PageHeader } from '@/components/shared/page-header';
import { CollectForm } from '@/components/collect/collect-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { timeAgo, maskPhone, maskEmail } from '@/lib/utils/dashboard-stats';

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

  const [orgRes, recentsRes] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, slug, sms_template')
      .eq('id', member.organization_id)
      .single(),
    supabase
      .from('review_requests')
      .select('id, customer_name, customer_phone, customer_email, contact_method, created_at')
      .eq('organization_id', member.organization_id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const org = orgRes.data;
  if (!org) redirect('/onboarding');

  const recentRequests = (recentsRes.data ?? []).map((r) => ({
    name: r.customer_name || 'Customer',
    contact:
      r.contact_method === 'sms' && r.customer_phone
        ? maskPhone(r.customer_phone)
        : r.customer_email
          ? maskEmail(r.customer_email)
          : '',
    method: r.contact_method as 'sms' | 'email',
    time: timeAgo(r.created_at),
  }));

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
        recentRequests={recentRequests}
      />
    </Box>
  );
}
