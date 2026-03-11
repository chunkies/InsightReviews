import { Box } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { SupportForm } from '@/components/support/support-form';

export default async function SupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!member) redirect('/onboarding');

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('organization_id', member.organization_id)
    .order('created_at', { ascending: false });

  return (
    <Box>
      <PageHeader
        title="Support"
        subtitle="Get help or share feedback with our team"
      />
      <SupportForm tickets={tickets ?? []} />
    </Box>
  );
}
