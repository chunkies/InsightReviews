import { describe, it, expect, beforeAll } from 'vitest';
import { hasValidBilling } from '@/lib/utils/admin';

beforeAll(() => {
  process.env.ADMIN_EMAILS = 'admin@test.com';
});

const future = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
const past = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

describe('Billing Flow — hasValidBilling', () => {
  const user = 'user@example.com';

  // ─── Trial states ──────────────────────────────────────────────────────
  describe('trial plan', () => {
    it('allows active trial with future expiry', () => {
      expect(hasValidBilling('trial', future(14), user)).toBe(true);
    });

    it('allows trial with 1 day remaining', () => {
      expect(hasValidBilling('trial', future(1), user)).toBe(true);
    });

    it('allows trial with no expiry date (null)', () => {
      expect(hasValidBilling('trial', null, user)).toBe(true);
    });

    it('blocks expired trial', () => {
      expect(hasValidBilling('trial', past(1), user)).toBe(false);
    });

    it('blocks trial expired weeks ago', () => {
      expect(hasValidBilling('trial', past(30), user)).toBe(false);
    });
  });

  // ─── Active states ─────────────────────────────────────────────────────
  describe('active plan', () => {
    it('allows active subscription', () => {
      expect(hasValidBilling('active', null, user)).toBe(true);
    });

    it('allows active even with stale trial_ends_at', () => {
      expect(hasValidBilling('active', past(30), user)).toBe(true);
    });
  });

  // ─── Cancelling states ─────────────────────────────────────────────────
  describe('cancelling plan', () => {
    it('allows cancelling with future subscription end', () => {
      expect(hasValidBilling('cancelling', null, user, future(15))).toBe(true);
    });

    it('allows cancelling with future trial end (trial cancellation)', () => {
      expect(hasValidBilling('cancelling', future(10), user, null)).toBe(true);
    });

    it('allows cancelling with no end dates (grace period)', () => {
      expect(hasValidBilling('cancelling', null, user, null)).toBe(true);
    });

    it('blocks cancelling with expired subscription end', () => {
      expect(hasValidBilling('cancelling', null, user, past(1))).toBe(false);
    });

    it('blocks cancelling with expired trial end (trial cancellation expired)', () => {
      expect(hasValidBilling('cancelling', past(5), user, null)).toBe(false);
    });

    it('uses subscriptionEndsAt over trialEndsAt when both present', () => {
      // subscriptionEndsAt is in the future, trialEndsAt is in the past
      expect(hasValidBilling('cancelling', past(5), user, future(10))).toBe(true);
    });

    it('blocks when both dates are expired', () => {
      expect(hasValidBilling('cancelling', past(5), user, past(1))).toBe(false);
    });
  });

  // ─── Blocked states ────────────────────────────────────────────────────
  describe('blocked plans', () => {
    it('blocks pending', () => {
      expect(hasValidBilling('pending', null, user)).toBe(false);
    });

    it('blocks cancelled', () => {
      expect(hasValidBilling('cancelled', null, user)).toBe(false);
    });

    it('blocks past_due', () => {
      expect(hasValidBilling('past_due', null, user)).toBe(false);
    });

    it('blocks null plan', () => {
      expect(hasValidBilling(null, null, user)).toBe(false);
    });

    it('blocks undefined plan', () => {
      expect(hasValidBilling(undefined, null, user)).toBe(false);
    });

    it('blocks empty string plan', () => {
      expect(hasValidBilling('', null, user)).toBe(false);
    });

    it('blocks unknown plan', () => {
      expect(hasValidBilling('free', null, user)).toBe(false);
    });
  });

  // ─── Admin bypass ──────────────────────────────────────────────────────
  describe('admin bypass', () => {
    const admin = 'admin@test.com';

    it('allows pending for admin', () => {
      expect(hasValidBilling('pending', null, admin)).toBe(true);
    });

    it('allows cancelled for admin', () => {
      expect(hasValidBilling('cancelled', null, admin)).toBe(true);
    });

    it('allows past_due for admin', () => {
      expect(hasValidBilling('past_due', null, admin)).toBe(true);
    });

    it('allows expired trial for admin', () => {
      expect(hasValidBilling('trial', past(30), admin)).toBe(true);
    });

    it('allows expired cancelling for admin', () => {
      expect(hasValidBilling('cancelling', past(30), admin, past(1))).toBe(true);
    });
  });
});

// ─── Middleware route logic ────────────────────────────────────────────────

const publicPrefixes = ['/auth/', '/r/', '/wall/'];

function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return publicPrefixes.some(prefix => pathname.startsWith(prefix));
}

const authOnlyPrefixes = ['/onboarding', '/subscribe'];

function isAuthOnlyRoute(pathname: string): boolean {
  return authOnlyPrefixes.some(prefix => pathname.startsWith(prefix));
}

describe('Middleware — route classification', () => {
  describe('public routes (no auth needed)', () => {
    it('allows landing page', () => {
      expect(isPublicRoute('/')).toBe(true);
    });

    it('allows auth routes', () => {
      expect(isPublicRoute('/auth/login')).toBe(true);
      expect(isPublicRoute('/auth/confirm')).toBe(true);
    });

    it('allows review form', () => {
      expect(isPublicRoute('/r/my-cafe')).toBe(true);
    });

    it('allows testimonial wall', () => {
      expect(isPublicRoute('/wall/my-cafe')).toBe(true);
    });

    it('blocks dashboard', () => {
      expect(isPublicRoute('/dashboard')).toBe(false);
      expect(isPublicRoute('/dashboard/billing')).toBe(false);
    });
  });

  describe('auth-only routes (auth but no billing check)', () => {
    it('identifies onboarding as auth-only', () => {
      expect(isAuthOnlyRoute('/onboarding')).toBe(true);
    });

    it('identifies subscribe as auth-only', () => {
      expect(isAuthOnlyRoute('/subscribe')).toBe(true);
    });

    it('does not classify dashboard as auth-only', () => {
      expect(isAuthOnlyRoute('/dashboard')).toBe(false);
      expect(isAuthOnlyRoute('/dashboard/billing')).toBe(false);
    });
  });

  describe('billing=success bypass', () => {
    function shouldBypassBilling(searchParams: string): boolean {
      const params = new URLSearchParams(searchParams);
      return params.get('billing') === 'success';
    }

    it('bypasses billing check for ?billing=success', () => {
      expect(shouldBypassBilling('billing=success')).toBe(true);
    });

    it('does not bypass for other values', () => {
      expect(shouldBypassBilling('billing=failed')).toBe(false);
      expect(shouldBypassBilling('billing=pending')).toBe(false);
      expect(shouldBypassBilling('')).toBe(false);
    });

    it('does not bypass when param is absent', () => {
      expect(shouldBypassBilling('foo=bar')).toBe(false);
    });
  });
});

// ─── Subscribe page logic ──────────────────────────────────────────────────

describe('Subscribe page — isReturning logic', () => {
  function computeSubscribeState(billingPlan: string | null, trialEndsAt: string | null, subId: string | null) {
    const trialStillActive = trialEndsAt && new Date(trialEndsAt) > new Date();
    const hasActiveTrial = (billingPlan === 'trial' || billingPlan === 'cancelling') && trialStillActive;
    const hasActiveSub = billingPlan === 'active' && subId;

    if (hasActiveTrial || hasActiveSub) {
      return { redirect: '/dashboard' };
    }

    const isPending = billingPlan === 'pending';
    const isReturning = !isPending && billingPlan !== 'trial';

    return { redirect: null, isReturning, isPending };
  }

  it('redirects active trial to dashboard', () => {
    const result = computeSubscribeState('trial', future(14), null);
    expect(result.redirect).toBe('/dashboard');
  });

  it('redirects cancelling trial (still active) to dashboard', () => {
    const result = computeSubscribeState('cancelling', future(5), null);
    expect(result.redirect).toBe('/dashboard');
  });

  it('redirects active subscription to dashboard', () => {
    const result = computeSubscribeState('active', null, 'sub_123');
    expect(result.redirect).toBe('/dashboard');
  });

  it('does not redirect active plan without sub ID', () => {
    const result = computeSubscribeState('active', null, null);
    expect(result.redirect).toBeNull();
  });

  it('pending → not returning (new user)', () => {
    const result = computeSubscribeState('pending', null, null);
    expect(result.isReturning).toBe(false);
    expect(result.isPending).toBe(true);
  });

  it('cancelled → returning user', () => {
    const result = computeSubscribeState('cancelled', null, null);
    expect(result.isReturning).toBe(true);
    expect(result.isPending).toBe(false);
  });

  it('past_due → returning user', () => {
    const result = computeSubscribeState('past_due', null, 'sub_123');
    expect(result.isReturning).toBe(true);
  });

  it('cancelling with expired trial → returning user', () => {
    const result = computeSubscribeState('cancelling', past(5), null);
    expect(result.isReturning).toBe(true);
  });

  it('expired trial (plan still "trial") → not returning (edge case)', () => {
    // billing_plan is still 'trial' but trial expired — this means isReturning is false
    // because the code checks billingPlan !== 'trial'
    const result = computeSubscribeState('trial', past(1), null);
    expect(result.redirect).toBeNull();
    expect(result.isReturning).toBe(false);
  });
});

// ─── Webhook event mapping ─────────────────────────────────────────────────

describe('Webhook — subscription status mapping', () => {
  function mapStripeStatus(
    stripeStatus: string,
    cancelAtPeriodEnd: boolean,
    trialEnd: number | null,
    cancelAt: number | null,
  ) {
    const updateData: Record<string, unknown> = {};

    if (stripeStatus === 'trialing' && cancelAtPeriodEnd) {
      updateData.billing_plan = 'cancelling';
      updateData.trial_ends_at = trialEnd
        ? new Date(trialEnd * 1000).toISOString()
        : null;
    } else if (stripeStatus === 'trialing' && !cancelAtPeriodEnd) {
      updateData.billing_plan = 'trial';
      updateData.trial_ends_at = trialEnd
        ? new Date(trialEnd * 1000).toISOString()
        : null;
    } else if (stripeStatus === 'active' && cancelAtPeriodEnd) {
      updateData.billing_plan = 'cancelling';
      updateData.subscription_ends_at = cancelAt
        ? new Date(cancelAt * 1000).toISOString()
        : null;
    } else if (stripeStatus === 'active' && !cancelAtPeriodEnd) {
      updateData.billing_plan = 'active';
      updateData.subscription_ends_at = null;
      updateData.trial_ends_at = null;
    } else if (stripeStatus === 'past_due') {
      updateData.billing_plan = 'past_due';
    }

    return updateData;
  }

  it('maps trialing (active) → trial with trial_ends_at', () => {
    const trialEnd = Math.floor(Date.now() / 1000) + 14 * 86400;
    const result = mapStripeStatus('trialing', false, trialEnd, null);
    expect(result.billing_plan).toBe('trial');
    expect(result.trial_ends_at).toBeTruthy();
  });

  it('maps trialing + cancel_at_period_end → cancelling (trial cancelled)', () => {
    const trialEnd = Math.floor(Date.now() / 1000) + 10 * 86400;
    const result = mapStripeStatus('trialing', true, trialEnd, null);
    expect(result.billing_plan).toBe('cancelling');
    expect(result.trial_ends_at).toBeTruthy();
  });

  it('maps active + cancel_at_period_end → cancelling', () => {
    const cancelAt = Math.floor(Date.now() / 1000) + 30 * 86400;
    const result = mapStripeStatus('active', true, null, cancelAt);
    expect(result.billing_plan).toBe('cancelling');
    expect(result.subscription_ends_at).toBeTruthy();
  });

  it('maps active (no cancel) → active, clears dates', () => {
    const result = mapStripeStatus('active', false, null, null);
    expect(result.billing_plan).toBe('active');
    expect(result.subscription_ends_at).toBeNull();
    expect(result.trial_ends_at).toBeNull();
  });

  it('maps past_due → past_due', () => {
    const result = mapStripeStatus('past_due', false, null, null);
    expect(result.billing_plan).toBe('past_due');
  });

  it('handles trialing (active) with no trial_end', () => {
    const result = mapStripeStatus('trialing', false, null, null);
    expect(result.billing_plan).toBe('trial');
    expect(result.trial_ends_at).toBeNull();
  });

  it('handles cancelling with no cancel_at', () => {
    const result = mapStripeStatus('active', true, null, null);
    expect(result.billing_plan).toBe('cancelling');
    expect(result.subscription_ends_at).toBeNull();
  });
});

// ─── Billing page status config ────────────────────────────────────────────

describe('Billing page — status display logic', () => {
  function getStatusLabel(
    billingPlan: string,
    subscriptionEndsAt: string | null,
    trialEndsAt: string | null,
  ) {
    const isActive = billingPlan === 'active';
    const isTrialing = billingPlan === 'trial';
    const isPastDue = billingPlan === 'past_due';
    const isCancelled = billingPlan === 'cancelled';
    const isCancelling = billingPlan === 'cancelling';
    const isPending = billingPlan === 'pending';
    const isCancellingTrial = isCancelling && !subscriptionEndsAt && !!trialEndsAt;
    const isCancellingPaid = isCancelling && !!subscriptionEndsAt;

    if (isActive) return 'Active';
    if (isCancellingTrial) return 'Trial Cancelled';
    if (isCancellingPaid) return 'Cancelling';
    if (isTrialing) return '14-Day Free Trial';
    if (isPastDue) return 'Past Due';
    if (isPending) return 'Setup Incomplete';
    if (isCancelled) return 'Cancelled';
    return 'Inactive';
  }

  it('shows Active for active plan', () => {
    expect(getStatusLabel('active', null, null)).toBe('Active');
  });

  it('shows 14-Day Free Trial for trial plan', () => {
    expect(getStatusLabel('trial', null, future(14))).toBe('14-Day Free Trial');
  });

  it('shows Trial Cancelled for cancelling with trial_ends_at only', () => {
    expect(getStatusLabel('cancelling', null, future(10))).toBe('Trial Cancelled');
  });

  it('shows Cancelling for cancelling with subscription_ends_at', () => {
    expect(getStatusLabel('cancelling', future(30), null)).toBe('Cancelling');
  });

  it('shows Past Due', () => {
    expect(getStatusLabel('past_due', null, null)).toBe('Past Due');
  });

  it('shows Setup Incomplete for pending', () => {
    expect(getStatusLabel('pending', null, null)).toBe('Setup Incomplete');
  });

  it('shows Cancelled', () => {
    expect(getStatusLabel('cancelled', null, null)).toBe('Cancelled');
  });

  it('shows Inactive for unknown state', () => {
    expect(getStatusLabel('garbage', null, null)).toBe('Inactive');
  });
});

// ─── Billing actions button logic ──────────────────────────────────────────

describe('Billing actions — button visibility', () => {
  function getVisibleButtons(
    billingPlan: string,
    hasSubscription: boolean,
    hasActiveSubscription: boolean,
  ) {
    const buttons: string[] = [];

    if (billingPlan === 'trial') {
      if (hasSubscription) buttons.push('Manage Billing');
      buttons.push('Cancel Trial');
    }

    if (billingPlan === 'active' && hasActiveSubscription) {
      buttons.push('Manage Billing');
      buttons.push('Cancel Subscription');
    }

    if (billingPlan === 'cancelling') {
      buttons.push('Subscribe Now');
      if (hasSubscription) buttons.push('Manage Billing');
    }

    if (billingPlan === 'past_due') {
      buttons.push('Update Payment Method');
      buttons.push('Manage Billing');
    }

    if (billingPlan === 'cancelled' || billingPlan === 'pending') {
      buttons.push('Subscribe Now — $79/mo');
    }

    return buttons;
  }

  it('trial with subscription: Manage Billing + Cancel Trial', () => {
    const buttons = getVisibleButtons('trial', true, true);
    expect(buttons).toContain('Manage Billing');
    expect(buttons).toContain('Cancel Trial');
    expect(buttons).not.toContain('Subscribe Now');
  });

  it('trial without subscription: Cancel Trial only', () => {
    const buttons = getVisibleButtons('trial', false, false);
    expect(buttons).toEqual(['Cancel Trial']);
  });

  it('active: Manage Billing + Cancel Subscription', () => {
    const buttons = getVisibleButtons('active', true, true);
    expect(buttons).toContain('Manage Billing');
    expect(buttons).toContain('Cancel Subscription');
  });

  it('cancelling: Subscribe Now + Manage Billing', () => {
    const buttons = getVisibleButtons('cancelling', true, true);
    expect(buttons).toContain('Subscribe Now');
    expect(buttons).toContain('Manage Billing');
  });

  it('past_due: Update Payment Method + Manage Billing', () => {
    const buttons = getVisibleButtons('past_due', true, true);
    expect(buttons).toContain('Update Payment Method');
    expect(buttons).toContain('Manage Billing');
  });

  it('cancelled: Subscribe Now — $79/mo', () => {
    const buttons = getVisibleButtons('cancelled', false, false);
    expect(buttons).toEqual(['Subscribe Now — $79/mo']);
  });

  it('pending: Subscribe Now — $79/mo', () => {
    const buttons = getVisibleButtons('pending', false, false);
    expect(buttons).toEqual(['Subscribe Now — $79/mo']);
  });
});
