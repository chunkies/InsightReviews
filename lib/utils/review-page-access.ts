import { isAdminEmail } from './admin';

export interface ReviewPageAccessInput {
  billingPlan: string | null | undefined;
  trialEndsAt: string | null | undefined;
  subscriptionEndsAt: string | null | undefined;
  ownerEmail: string | null | undefined;
}

export type ReviewPageAccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'expired_trial' | 'expired_subscription' | 'inactive_plan' };

/**
 * Determines whether the public review form (/r/[slug]) should be shown.
 * This is the same check used by the review page, submission API, and testimonial wall.
 *
 * Admin orgs (owner email in ADMIN_EMAILS) always bypass billing checks.
 */
export function checkReviewPageAccess(input: ReviewPageAccessInput): ReviewPageAccessResult {
  const { billingPlan, trialEndsAt, subscriptionEndsAt, ownerEmail } = input;

  // Admin orgs always have access
  if (isAdminEmail(ownerEmail)) {
    return { allowed: true };
  }

  const plan = billingPlan ?? 'none';

  // Active or valid trial — allowed
  if (plan === 'active') {
    return { allowed: true };
  }

  if (plan === 'trial') {
    if (trialEndsAt && new Date(trialEndsAt) < new Date()) {
      return { allowed: false, reason: 'expired_trial' };
    }
    return { allowed: true };
  }

  if (plan === 'cancelling') {
    const endsAt = subscriptionEndsAt || trialEndsAt;
    if (endsAt && new Date(endsAt) < new Date()) {
      return { allowed: false, reason: 'expired_subscription' };
    }
    return { allowed: true };
  }

  // cancelled, past_due, none, or anything else
  return { allowed: false, reason: 'inactive_plan' };
}
