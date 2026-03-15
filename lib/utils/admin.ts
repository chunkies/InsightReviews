import { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Emails that bypass billing checks (always treated as subscribed)
// Set ADMIN_EMAILS env var as comma-separated list: "a@b.com,c@d.com"
function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? '';
  return raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export function hasValidBilling(
  billingPlan: string | null | undefined,
  trialEndsAt: string | null | undefined,
  email?: string | null,
  subscriptionEndsAt?: string | null,
): boolean {
  if (isAdminEmail(email)) return true;

  const plan = billingPlan ?? 'none';
  const validPlans = ['trial', 'active', 'cancelling'];
  if (!validPlans.includes(plan)) return false;

  if (plan === 'trial' && trialEndsAt && new Date(trialEndsAt) < new Date()) {
    return false;
  }

  if (plan === 'cancelling') {
    // Check subscription end date (paid cancellation) or trial end date (trial cancellation)
    const endsAt = subscriptionEndsAt || trialEndsAt;
    if (endsAt && new Date(endsAt) < new Date()) {
      return false;
    }
  }

  return true;
}

/**
 * API route guard: checks that the org has valid billing.
 * Returns null if billing is valid, or a NextResponse error to return early.
 */
export async function requireBilling(
  supabase: SupabaseClient,
  organizationId: string,
  userEmail?: string | null,
): Promise<NextResponse | null> {
  const { data: org } = await supabase
    .from('organizations')
    .select('billing_plan, trial_ends_at, subscription_ends_at')
    .eq('id', organizationId)
    .single();

  if (!org || !hasValidBilling(org.billing_plan, org.trial_ends_at, userEmail, org.subscription_ends_at)) {
    return NextResponse.json(
      { error: 'Active subscription required' },
      { status: 403 },
    );
  }

  return null;
}
