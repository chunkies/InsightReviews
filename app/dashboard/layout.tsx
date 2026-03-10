import { DashboardShell } from '@/components/layout/dashboard-shell';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { hasValidBilling, isAdminEmail } from '@/lib/utils/admin';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Single query: get org membership + org details in one round trip
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, organizations(id, name, billing_plan, trial_ends_at)')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!member) redirect('/onboarding');

  const org = member.organizations as unknown as {
    id: string; name: string; billing_plan: string; trial_ends_at: string | null;
  } | null;

  // Gate access: require active subscription or valid trial (admins bypass)
  if (!hasValidBilling(org?.billing_plan, org?.trial_ends_at, user.email)) {
    redirect(`/subscribe?org=${org?.id ?? ''}`);
  }

  // Admin emails always show as "Active"
  const displayPlan = isAdminEmail(user.email) ? 'active' : org?.billing_plan;
  const displayTrialEndsAt = isAdminEmail(user.email) ? null : org?.trial_ends_at;

  return (
    <DashboardShell
      orgName={org?.name}
      billingPlan={displayPlan}
      trialEndsAt={displayTrialEndsAt}
    >
      {children}
    </DashboardShell>
  );
}
