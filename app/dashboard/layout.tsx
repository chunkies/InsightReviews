import { Suspense } from 'react';
import { headers } from 'next/headers';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { hasValidBilling, isAdminEmail } from '@/lib/utils/admin';
import { BillingSuccessSync } from '@/components/dashboard/billing-success-sync';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Single query: get org membership + org details in one round trip
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, organizations(id, name, billing_plan, trial_ends_at, subscription_ends_at)')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!member) redirect('/onboarding');

  const org = member.organizations as unknown as {
    id: string; name: string; billing_plan: string; trial_ends_at: string | null; subscription_ends_at: string | null;
  } | null;

  // Allow billing=success through so client-side sync component can update DB
  const headersList = await headers();
  const isBillingSuccess = headersList.get('x-billing-success') === '1';

  // Gate access: require active subscription or valid trial (admins bypass)
  if (!isBillingSuccess && !hasValidBilling(org?.billing_plan, org?.trial_ends_at, user.email, org?.subscription_ends_at)) {
    redirect(`/subscribe?org=${org?.id ?? ''}`);
  }

  // Admin emails always show as "Active"
  const isAdmin = isAdminEmail(user.email);
  const displayPlan = isAdmin ? 'active' : org?.billing_plan;
  const displayTrialEndsAt = isAdmin ? null : org?.trial_ends_at;
  const displaySubEndsAt = isAdmin ? null : org?.subscription_ends_at;

  return (
    <DashboardShell
      orgName={org?.name}
      billingPlan={displayPlan}
      trialEndsAt={displayTrialEndsAt}
      subscriptionEndsAt={displaySubEndsAt}
    >
      <Suspense>
        <BillingSuccessSync />
      </Suspense>
      {children}
    </DashboardShell>
  );
}
