import { Suspense } from 'react';
import { headers } from 'next/headers';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { hasValidBilling, isAdminEmail } from '@/lib/utils/admin';
import { BillingSuccessSync } from '@/components/dashboard/billing-success-sync';

// Map URL paths to permission keys
const ROUTE_PERMISSION_MAP: Record<string, string> = {
  '/dashboard/reviews': 'reviews',
  '/dashboard/collect': 'collect',
  '/dashboard/integrations': 'integrations',
  '/dashboard/staff': 'staff',
  '/dashboard/testimonials': 'customization',
  '/dashboard/billing': 'billing',
  '/dashboard/settings': 'settings',
  '/dashboard/support': 'support',
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Get org membership + org details + role permissions in one round trip
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role, role_id, organizations(id, name, billing_plan, trial_ends_at, subscription_ends_at)')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!member) redirect('/onboarding');

  // Supabase join returns an array for relations; extract the first element
  const orgs = member.organizations as {
    id: string; name: string; billing_plan: string; trial_ends_at: string | null; subscription_ends_at: string | null;
  }[] | null;
  const org = Array.isArray(orgs) ? orgs[0] ?? null : orgs;

  // Fetch role permissions if staff member has a role
  let permissions: string[] | null = null;
  if (member.role === 'staff' && member.role_id) {
    const { data: roleData } = await supabase
      .from('roles')
      .select('permissions')
      .eq('id', member.role_id)
      .single();
    if (roleData) {
      permissions = roleData.permissions as string[];
    }
  }

  // Allow billing=success through so client-side sync component can update DB
  const headersList = await headers();
  const isBillingSuccess = headersList.get('x-billing-success') === '1';

  // Route-level permission enforcement for staff members
  if (member.role === 'staff' && permissions) {
    const pathname = headersList.get('x-pathname') || '';
    // Find the matching route permission
    const matchedRoute = Object.entries(ROUTE_PERMISSION_MAP).find(
      ([path]) => pathname === path || pathname.startsWith(path + '/')
    );
    if (matchedRoute) {
      const requiredPermission = matchedRoute[1];
      if (!permissions.includes(requiredPermission)) {
        // Find the first permitted page to redirect to
        const firstPermitted = permissions[0];
        const firstRoute = Object.entries(ROUTE_PERMISSION_MAP).find(
          ([, perm]) => perm === firstPermitted
        );
        redirect(firstRoute ? firstRoute[0] : '/dashboard');
      }
    }
  }

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
      permissions={permissions}
      memberRole={member.role as 'owner' | 'staff'}
    >
      <Suspense>
        <BillingSuccessSync />
      </Suspense>
      {children}
    </DashboardShell>
  );
}
