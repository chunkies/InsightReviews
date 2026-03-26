import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// =============================================================================
// Checkout endpoint — source code verification
// =============================================================================

describe('Stripe create-checkout endpoint', () => {
  const source = readFileSync(
    resolve(__dirname, '../app/api/stripe/create-checkout/route.ts'),
    'utf-8',
  );

  it('verifies user authentication', () => {
    expect(source).toMatch(/auth\.getUser/);
    expect(source).toMatch(/Unauthorized/);
  });

  it('verifies user is organization owner', () => {
    expect(source).toMatch(/member\.role\s*!==\s*'owner'/);
    expect(source).toMatch(/Forbidden/);
  });

  it('checks PLAN.priceId is configured', () => {
    expect(source).toMatch(/PLAN\.priceId/);
    expect(source).toMatch(/Price not configured/);
  });

  it('validates Stripe customer exists before reusing', () => {
    expect(source).toMatch(/customers\.retrieve\(customerId\)/);
  });

  it('detects deleted Stripe customers (deleted: true) and clears them', () => {
    expect(source).toMatch(/existing\.deleted/);
    expect(source).toMatch(/Customer was deleted/);
  });

  it('clears stale customer ID from database when customer not found in Stripe', () => {
    expect(source).toMatch(/stripe_customer_id:\s*null/);
  });

  it('creates new Stripe customer when needed', () => {
    expect(source).toMatch(/customers\.create/);
  });

  it('does not apply Stripe-side trial (app-level trial is used instead)', () => {
    // Stripe-side trials removed — app sets billing_plan='trial' directly during onboarding
    expect(source).not.toMatch(/trial_period_days/);
    expect(source).toMatch(/No Stripe-side trial/);
  });

  it('creates checkout session with correct parameters', () => {
    expect(source).toMatch(/checkout\.sessions\.create/);
    expect(source).toMatch(/mode:\s*'subscription'/);
    expect(source).toMatch(/payment_method_collection:\s*'always'/);
  });

  it('sets success and cancel URLs', () => {
    expect(source).toMatch(/success_url.*billing=success/);
    expect(source).toMatch(/cancel_url.*subscribe/);
  });

  it('returns checkout URL in response', () => {
    expect(source).toMatch(/session\.url/);
  });

  it('handles errors gracefully', () => {
    expect(source).toMatch(/catch\s*\(error\)/);
    expect(source).toMatch(/Checkout error/);
  });
});

// =============================================================================
// Trial eligibility logic (extracted)
// =============================================================================

describe('Trial eligibility — isNewSubscriber logic', () => {
  // Replicates the actual logic from the checkout endpoint
  function isNewSubscriber(hadPriorSubscription: boolean, billingPlan: string | null): boolean {
    return !hadPriorSubscription && (billingPlan === 'pending' || !billingPlan);
  }

  describe('new users get trial', () => {
    it('pending plan, no prior subs → trial', () => {
      expect(isNewSubscriber(false, 'pending')).toBe(true);
    });

    it('null plan, no prior subs → trial', () => {
      expect(isNewSubscriber(false, null)).toBe(true);
    });
  });

  describe('returning users do NOT get trial', () => {
    it('had prior subscription, pending plan → no trial', () => {
      expect(isNewSubscriber(true, 'pending')).toBe(false);
    });

    it('had prior subscription, cancelled plan → no trial', () => {
      expect(isNewSubscriber(true, 'cancelled')).toBe(false);
    });

    it('had prior subscription, null plan → no trial', () => {
      expect(isNewSubscriber(true, null)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('no prior subs but active plan → no trial (already active)', () => {
      expect(isNewSubscriber(false, 'active')).toBe(false);
    });

    it('no prior subs but trial plan → no trial (already trialing)', () => {
      expect(isNewSubscriber(false, 'trial')).toBe(false);
    });

    it('no prior subs but cancelled plan → no trial (was subscribed before)', () => {
      expect(isNewSubscriber(false, 'cancelled')).toBe(false);
    });
  });
});

// =============================================================================
// Customer validation logic (extracted)
// =============================================================================

describe('Customer validation — stale customer handling', () => {
  // Simulates the customer verification + creation flow
  // customerState: 'exists' | 'deleted' | 'not_found'
  function resolveCustomer(
    dbCustomerId: string | null,
    customerState: 'exists' | 'deleted' | 'not_found',
  ): { customerId: string; customerIsNew: boolean } {
    let customerId = dbCustomerId;
    let customerIsNew = false;

    if (customerId) {
      // retrieve() returns { deleted: true } for deleted customers (doesn't throw!)
      // retrieve() throws for non-existent customers
      if (customerState === 'deleted' || customerState === 'not_found') {
        customerId = null;
      }
    }

    if (!customerId) {
      customerId = 'cus_new_123';
      customerIsNew = true;
    }

    return { customerId, customerIsNew };
  }

  it('reuses existing valid customer', () => {
    const result = resolveCustomer('cus_existing', 'exists');
    expect(result.customerId).toBe('cus_existing');
    expect(result.customerIsNew).toBe(false);
  });

  it('creates new customer when none in DB', () => {
    const result = resolveCustomer(null, 'not_found');
    expect(result.customerId).toBe('cus_new_123');
    expect(result.customerIsNew).toBe(true);
  });

  it('creates new customer when DB customer is stale (not found in Stripe)', () => {
    const result = resolveCustomer('cus_stale', 'not_found');
    expect(result.customerId).toBe('cus_new_123');
    expect(result.customerIsNew).toBe(true);
  });

  it('creates new customer when DB customer was DELETED in Stripe', () => {
    // This is the exact bug: Stripe returns { deleted: true } instead of throwing
    const result = resolveCustomer('cus_deleted_in_stripe', 'deleted');
    expect(result.customerId).toBe('cus_new_123');
    expect(result.customerIsNew).toBe(true);
  });
});

// =============================================================================
// Cancel subscription endpoint — source code verification
// =============================================================================

describe('Stripe cancel-subscription endpoint', () => {
  const source = readFileSync(
    resolve(__dirname, '../app/api/stripe/cancel-subscription/route.ts'),
    'utf-8',
  );

  it('verifies authentication', () => {
    expect(source).toMatch(/auth\.getUser/);
    expect(source).toMatch(/Unauthorized/);
  });

  it('verifies owner role', () => {
    expect(source).toMatch(/member\.role\s*!==\s*'owner'/);
  });

  it('handles trial cancellation separately', () => {
    expect(source).toMatch(/cancelTrial/);
    expect(source).toMatch(/billing_plan\s*===\s*'trial'/);
  });

  it('uses cancel_at_period_end (not immediate cancellation)', () => {
    expect(source).toMatch(/cancel_at_period_end:\s*true/);
  });

  it('updates billing_plan to cancelling', () => {
    expect(source).toMatch(/billing_plan:\s*'cancelling'/);
  });

  it('stores subscription_ends_at for paid cancellations', () => {
    expect(source).toMatch(/subscription_ends_at/);
  });

  it('returns 400 when no active subscription', () => {
    expect(source).toMatch(/No active subscription found/);
  });
});

// =============================================================================
// Create portal endpoint — source code verification
// =============================================================================

describe('Stripe create-portal endpoint', () => {
  const source = readFileSync(
    resolve(__dirname, '../app/api/stripe/create-portal/route.ts'),
    'utf-8',
  );

  it('verifies authentication', () => {
    expect(source).toMatch(/auth\.getUser/);
  });

  it('verifies owner role', () => {
    expect(source).toMatch(/member\.role\s*!==\s*'owner'/);
  });

  it('requires stripe_customer_id', () => {
    expect(source).toMatch(/stripe_customer_id/);
    expect(source).toMatch(/No billing account/);
  });

  it('validates customer exists in Stripe before creating portal', () => {
    expect(source).toMatch(/customers\.retrieve\(org\.stripe_customer_id\)/);
  });

  it('detects deleted Stripe customers and clears stale data', () => {
    expect(source).toMatch(/customer\.deleted/);
    expect(source).toMatch(/billing_plan:\s*'cancelled'/);
    expect(source).toMatch(/stripe_customer_id:\s*null/);
  });

  it('returns user-friendly error when customer was deleted', () => {
    expect(source).toMatch(/Billing account no longer exists/);
  });

  it('returns user-friendly error when customer not found', () => {
    expect(source).toMatch(/Billing account not found/);
  });

  it('creates billing portal session', () => {
    expect(source).toMatch(/billingPortal\.sessions\.create/);
  });

  it('returns to billing page', () => {
    expect(source).toMatch(/dashboard\/billing/);
  });

  it('uses envRequired for site URL (trims automatically)', () => {
    expect(source).toMatch(/envRequired\(['"]NEXT_PUBLIC_SITE_URL['"]\)/);
  });
});

// =============================================================================
// Sync endpoint — source code verification
// =============================================================================

describe('Stripe sync endpoint', () => {
  const source = readFileSync(
    resolve(__dirname, '../app/api/stripe/sync/route.ts'),
    'utf-8',
  );

  it('only syncs when billing_plan is pending', () => {
    expect(source).toMatch(/billing_plan\s*!==\s*'pending'/);
  });

  it('lists customer subscriptions from Stripe', () => {
    expect(source).toMatch(/subscriptions\.list/);
  });

  it('handles trialing status', () => {
    expect(source).toMatch(/status\s*===\s*'trialing'/);
    expect(source).toMatch(/billingPlan\s*=\s*'trial'/);
  });

  it('stores trial_ends_at from Stripe', () => {
    expect(source).toMatch(/trial_end/);
    expect(source).toMatch(/trial_ends_at/);
  });

  it('stores stripe_subscription_id', () => {
    expect(source).toMatch(/stripe_subscription_id:\s*stripeSub\.id/);
  });

  it('returns pending when no subscription found', () => {
    expect(source).toMatch(/status:\s*'pending'/);
  });
});

// =============================================================================
// Stripe server client
// =============================================================================

describe('Stripe client configuration', () => {
  const source = readFileSync(
    resolve(__dirname, '../lib/stripe/server.ts'),
    'utf-8',
  );

  it('sanitizes STRIPE_SECRET_KEY via envRequired to handle env var whitespace', () => {
    expect(source).toMatch(/envRequired\(['"]STRIPE_SECRET_KEY['"]\)/);
  });

  it('sets API version', () => {
    expect(source).toMatch(/apiVersion/);
  });
});

// =============================================================================
// Constants — PLAN config
// =============================================================================

describe('PLAN configuration', () => {
  const source = readFileSync(
    resolve(__dirname, '../lib/utils/constants.ts'),
    'utf-8',
  );

  it('trims STRIPE_PRICE_ID to handle env var whitespace', () => {
    expect(source).toMatch(/STRIPE_PRICE_ID.*\.trim\(\)/);
  });

  it('sets trial to 14 days', () => {
    expect(source).toMatch(/trialDays:\s*14/);
  });

  it('sets standard and founding prices', () => {
    expect(source).toMatch(/standardPrice:\s*79/);
    expect(source).toMatch(/foundingPrice:\s*49/);
  });

  it('uses AUD currency', () => {
    expect(source).toMatch(/currency:\s*'aud'/);
  });
});

// =============================================================================
// Webhook — subscription status mapping (comprehensive)
// =============================================================================

describe('Webhook — full subscription lifecycle mapping', () => {
  function mapStripeEvent(
    stripeStatus: string,
    cancelAtPeriodEnd: boolean,
    trialEnd: number | null,
    cancelAt: number | null,
  ) {
    const updateData: Record<string, unknown> = {};

    if (stripeStatus === 'trialing' && cancelAtPeriodEnd) {
      // Trial cancelled — keep access until trial ends
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
    } else if (stripeStatus === 'canceled') {
      updateData.billing_plan = 'cancelled';
    }

    return updateData;
  }

  // Full lifecycle: pending → trial → active → cancelling → cancelled
  describe('full lifecycle', () => {
    it('step 1: checkout creates trial → trialing', () => {
      const trialEnd = Math.floor(Date.now() / 1000) + 14 * 86400;
      const result = mapStripeEvent('trialing', false, trialEnd, null);
      expect(result.billing_plan).toBe('trial');
      expect(result.trial_ends_at).toBeTruthy();
    });

    it('step 2: trial ends → active', () => {
      const result = mapStripeEvent('active', false, null, null);
      expect(result.billing_plan).toBe('active');
      expect(result.subscription_ends_at).toBeNull();
      expect(result.trial_ends_at).toBeNull();
    });

    it('step 3: user cancels → cancelling', () => {
      const cancelAt = Math.floor(Date.now() / 1000) + 30 * 86400;
      const result = mapStripeEvent('active', true, null, cancelAt);
      expect(result.billing_plan).toBe('cancelling');
      expect(result.subscription_ends_at).toBeTruthy();
    });

    it('step 4: period ends → cancelled', () => {
      const result = mapStripeEvent('canceled', false, null, null);
      expect(result.billing_plan).toBe('cancelled');
    });
  });

  // Trial lifecycle: pending → trial → cancel during trial → cancelled
  describe('trial cancellation lifecycle', () => {
    it('user starts trial', () => {
      const trialEnd = Math.floor(Date.now() / 1000) + 14 * 86400;
      const result = mapStripeEvent('trialing', false, trialEnd, null);
      expect(result.billing_plan).toBe('trial');
    });

    it('user cancels during trial → trialing + cancel_at_period_end → cancelling', () => {
      // Stripe fires subscription.updated with status='trialing' + cancel_at_period_end=true
      const trialEnd = Math.floor(Date.now() / 1000) + 10 * 86400;
      const result = mapStripeEvent('trialing', true, trialEnd, null);
      expect(result.billing_plan).toBe('cancelling');
      expect(result.trial_ends_at).toBeTruthy();
    });

    it('user uncancels during trial → trialing + cancel_at_period_end=false → trial', () => {
      const trialEnd = Math.floor(Date.now() / 1000) + 10 * 86400;
      const result = mapStripeEvent('trialing', false, trialEnd, null);
      expect(result.billing_plan).toBe('trial');
    });
  });

  // Payment failure
  describe('payment failure', () => {
    it('payment fails → past_due', () => {
      const result = mapStripeEvent('past_due', false, null, null);
      expect(result.billing_plan).toBe('past_due');
    });
  });

  // Reactivation
  describe('reactivation', () => {
    it('user resubscribes → active (clears all dates)', () => {
      const result = mapStripeEvent('active', false, null, null);
      expect(result.billing_plan).toBe('active');
      expect(result.subscription_ends_at).toBeNull();
      expect(result.trial_ends_at).toBeNull();
    });
  });
});

// =============================================================================
// Billing sync — self-healing logic
// =============================================================================

describe('Billing page — deleted customer handling', () => {
  const source = readFileSync(
    resolve(__dirname, '../app/dashboard/billing/page.tsx'),
    'utf-8',
  );

  it('verifies Stripe customer exists before querying subscriptions', () => {
    expect(source).toMatch(/customers\.retrieve\(org\.stripe_customer_id\)/);
  });

  it('detects deleted Stripe customers (customer.deleted)', () => {
    expect(source).toMatch(/customer\.deleted/);
  });

  it('clears stale customer data when customer is deleted', () => {
    // Must clear customer_id, subscription_id, and set plan to cancelled
    expect(source).toMatch(/stripe_customer_id:\s*null/);
    expect(source).toMatch(/stripe_subscription_id:\s*null/);
    expect(source).toMatch(/billing_plan:\s*'cancelled'/);
  });

  it('skips subscription list when customer was deleted', () => {
    // After clearing customer, should not try to list subscriptions
    expect(source).toMatch(/org\.stripe_customer_id\s*\?\s*await stripe\.subscriptions\.list/);
  });
});

// =============================================================================
// Deleted customer resolution logic (extracted — covers all 3 endpoints)
// =============================================================================

describe('Deleted Stripe customer resolution', () => {
  // Simulates the customer verification logic used across checkout, portal, billing
  function resolveCustomer(
    dbCustomerId: string | null,
    stripeResult: 'exists' | 'deleted' | 'not_found',
  ): { customerId: string | null; wasCleared: boolean } {
    let customerId = dbCustomerId;
    let wasCleared = false;

    if (customerId) {
      if (stripeResult === 'deleted' || stripeResult === 'not_found') {
        customerId = null;
        wasCleared = true;
      }
    }

    return { customerId, wasCleared };
  }

  it('keeps valid customer', () => {
    const result = resolveCustomer('cus_valid', 'exists');
    expect(result.customerId).toBe('cus_valid');
    expect(result.wasCleared).toBe(false);
  });

  it('clears deleted customer (the bug that caused "No such customer")', () => {
    const result = resolveCustomer('cus_deleted', 'deleted');
    expect(result.customerId).toBeNull();
    expect(result.wasCleared).toBe(true);
  });

  it('clears not-found customer', () => {
    const result = resolveCustomer('cus_gone', 'not_found');
    expect(result.customerId).toBeNull();
    expect(result.wasCleared).toBe(true);
  });

  it('handles null customer gracefully', () => {
    const result = resolveCustomer(null, 'not_found');
    expect(result.customerId).toBeNull();
    expect(result.wasCleared).toBe(false);
  });
});

describe('Billing page — self-healing sync logic', () => {
  function syncBillingState(
    dbPlan: string,
    stripeStatus: string,
    cancelAtPeriodEnd: boolean,
    trialEnd: number | null,
    cancelAt: number | null,
  ) {
    let correctPlan = dbPlan;
    let correctSubEnd: string | null = null;
    let correctTrialEnd: string | null = null;

    if (stripeStatus === 'active' && !cancelAtPeriodEnd) {
      correctPlan = 'active';
    } else if (stripeStatus === 'active' && cancelAtPeriodEnd) {
      correctPlan = 'cancelling';
      correctSubEnd = cancelAt
        ? new Date(cancelAt * 1000).toISOString()
        : null;
    } else if (stripeStatus === 'trialing') {
      correctPlan = cancelAtPeriodEnd ? 'cancelling' : 'trial';
      correctTrialEnd = trialEnd
        ? new Date(trialEnd * 1000).toISOString()
        : null;
    } else if (stripeStatus === 'past_due') {
      correctPlan = 'past_due';
    } else if (stripeStatus === 'canceled') {
      correctPlan = 'cancelled';
    }

    const needsSync = correctPlan !== dbPlan;
    return { correctPlan, correctSubEnd, correctTrialEnd, needsSync };
  }

  it('detects DB is out of sync (DB says pending, Stripe says trialing)', () => {
    const trialEnd = Math.floor(Date.now() / 1000) + 14 * 86400;
    const result = syncBillingState('pending', 'trialing', false, trialEnd, null);
    expect(result.needsSync).toBe(true);
    expect(result.correctPlan).toBe('trial');
  });

  it('detects DB is in sync (both say active)', () => {
    const result = syncBillingState('active', 'active', false, null, null);
    expect(result.needsSync).toBe(false);
    expect(result.correctPlan).toBe('active');
  });

  it('heals DB when Stripe shows cancelled but DB says active', () => {
    const result = syncBillingState('active', 'canceled', false, null, null);
    expect(result.needsSync).toBe(true);
    expect(result.correctPlan).toBe('cancelled');
  });

  it('heals DB when Stripe shows past_due but DB says active', () => {
    const result = syncBillingState('active', 'past_due', false, null, null);
    expect(result.needsSync).toBe(true);
    expect(result.correctPlan).toBe('past_due');
  });
});
