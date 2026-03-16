import { describe, it, expect } from 'vitest';
import { checkReviewPageAccess, type ReviewPageAccessInput } from '@/lib/utils/review-page-access';

// Set admin email for tests
process.env.ADMIN_EMAILS = 'admin@example.com';

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now
const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 1 day ago

function check(overrides: Partial<ReviewPageAccessInput>) {
  return checkReviewPageAccess({
    billingPlan: 'active',
    trialEndsAt: null,
    subscriptionEndsAt: null,
    ownerEmail: 'regular@example.com',
    ...overrides,
  });
}

describe('checkReviewPageAccess — QR code / review form access', () => {

  // ── Active subscription ──
  describe('active subscription', () => {
    it('allows access with active plan', () => {
      expect(check({ billingPlan: 'active' })).toEqual({ allowed: true });
    });
  });

  // ── Trial ──
  describe('trial plan', () => {
    it('allows access when trial is still valid', () => {
      expect(check({ billingPlan: 'trial', trialEndsAt: futureDate })).toEqual({ allowed: true });
    });

    it('blocks access when trial has expired', () => {
      const result = check({ billingPlan: 'trial', trialEndsAt: pastDate });
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('expired_trial');
    });

    it('allows access when trial has no end date', () => {
      expect(check({ billingPlan: 'trial', trialEndsAt: null })).toEqual({ allowed: true });
    });
  });

  // ── Cancelling ──
  describe('cancelling plan', () => {
    it('allows access when subscription has not yet ended', () => {
      expect(check({ billingPlan: 'cancelling', subscriptionEndsAt: futureDate })).toEqual({ allowed: true });
    });

    it('blocks access when subscription end date has passed', () => {
      const result = check({ billingPlan: 'cancelling', subscriptionEndsAt: pastDate });
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('expired_subscription');
    });

    it('falls back to trialEndsAt when subscriptionEndsAt is null', () => {
      const result = check({ billingPlan: 'cancelling', subscriptionEndsAt: null, trialEndsAt: pastDate });
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('expired_subscription');
    });

    it('allows access when cancelling with no end dates set', () => {
      expect(check({ billingPlan: 'cancelling', subscriptionEndsAt: null, trialEndsAt: null })).toEqual({ allowed: true });
    });
  });

  // ── Inactive plans ──
  describe('inactive plans', () => {
    it('blocks access for cancelled plan', () => {
      const result = check({ billingPlan: 'cancelled' });
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('inactive_plan');
    });

    it('blocks access for past_due plan', () => {
      const result = check({ billingPlan: 'past_due' });
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('inactive_plan');
    });

    it('blocks access for none plan', () => {
      const result = check({ billingPlan: 'none' });
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('inactive_plan');
    });

    it('blocks access when billing_plan is null', () => {
      const result = check({ billingPlan: null });
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('inactive_plan');
    });

    it('blocks access when billing_plan is undefined', () => {
      const result = check({ billingPlan: undefined });
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('inactive_plan');
    });

    it('blocks access for pending plan', () => {
      const result = check({ billingPlan: 'pending' });
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('inactive_plan');
    });
  });

  // ── Admin bypass ──
  describe('admin email bypass', () => {
    it('allows access for admin even with cancelled plan', () => {
      expect(check({ billingPlan: 'cancelled', ownerEmail: 'admin@example.com' })).toEqual({ allowed: true });
    });

    it('allows access for admin even with expired trial', () => {
      expect(check({ billingPlan: 'trial', trialEndsAt: pastDate, ownerEmail: 'admin@example.com' })).toEqual({ allowed: true });
    });

    it('allows access for admin with no billing plan at all', () => {
      expect(check({ billingPlan: null, ownerEmail: 'admin@example.com' })).toEqual({ allowed: true });
    });

    it('allows access for admin with past_due plan', () => {
      expect(check({ billingPlan: 'past_due', ownerEmail: 'admin@example.com' })).toEqual({ allowed: true });
    });

    it('allows access for admin with expired cancelling subscription', () => {
      expect(check({
        billingPlan: 'cancelling',
        subscriptionEndsAt: pastDate,
        ownerEmail: 'admin@example.com',
      })).toEqual({ allowed: true });
    });

    it('is case-insensitive for admin email', () => {
      expect(check({ billingPlan: 'cancelled', ownerEmail: 'ADMIN@EXAMPLE.COM' })).toEqual({ allowed: true });
    });

    it('does NOT bypass for non-admin email', () => {
      const result = check({ billingPlan: 'cancelled', ownerEmail: 'notadmin@example.com' });
      expect(result.allowed).toBe(false);
    });

    it('does NOT bypass when ownerEmail is null', () => {
      const result = check({ billingPlan: 'cancelled', ownerEmail: null });
      expect(result.allowed).toBe(false);
    });

    it('does NOT bypass when ownerEmail is undefined', () => {
      const result = check({ billingPlan: 'cancelled', ownerEmail: undefined });
      expect(result.allowed).toBe(false);
    });
  });

  // ── Edge cases: the exact scenario that broke production ──
  describe('production QR code scan scenarios', () => {
    it('QR scan works for org with active billing (normal customer flow)', () => {
      expect(check({
        billingPlan: 'active',
        ownerEmail: 'shopowner@business.com',
      })).toEqual({ allowed: true });
    });

    it('QR scan works for admin org even without subscription', () => {
      expect(check({
        billingPlan: 'none',
        trialEndsAt: null,
        subscriptionEndsAt: null,
        ownerEmail: 'admin@example.com',
      })).toEqual({ allowed: true });
    });

    it('QR scan blocked for expired trial non-admin org', () => {
      const result = check({
        billingPlan: 'trial',
        trialEndsAt: pastDate,
        ownerEmail: 'shopowner@business.com',
      });
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('expired_trial');
    });

    it('QR scan works during valid trial', () => {
      expect(check({
        billingPlan: 'trial',
        trialEndsAt: futureDate,
        ownerEmail: 'newcustomer@business.com',
      })).toEqual({ allowed: true });
    });
  });
});
