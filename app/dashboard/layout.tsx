import { DashboardShell } from '@/components/layout/dashboard-shell';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { hasValidBilling } from '@/lib/utils/admin';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!member) redirect('/onboarding');

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, billing_plan, trial_ends_at')
    .eq('id', member.organization_id)
    .single();

  // Gate access: require active subscription or valid trial (admins bypass)
  if (!hasValidBilling(org?.billing_plan, org?.trial_ends_at, user.email)) {
    redirect(`/subscribe?org=${org?.id ?? ''}`);
  }

  return (
    <DashboardShell
      orgName={org?.name}
      billingPlan={org?.billing_plan}
      trialEndsAt={org?.trial_ends_at}
    >
      {children}
    </DashboardShell>
  );
}
