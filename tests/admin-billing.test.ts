import { describe, it, expect, beforeAll } from 'vitest';
import { isAdminEmail, hasValidBilling } from '@/lib/utils/admin';

beforeAll(() => {
  process.env.ADMIN_EMAILS = 'sly.tristan1@gmail.com';
});

describe('isAdminEmail', () => {
  it('returns true for admin email', () => {
    expect(isAdminEmail('sly.tristan1@gmail.com')).toBe(true);
  });

  it('returns false for non-admin email', () => {
    expect(isAdminEmail('test@example.com')).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
    expect(isAdminEmail('')).toBe(false);
  });

  it('is case-insensitive (emails are case-insensitive per RFC)', () => {
    expect(isAdminEmail('Sly.Tristan1@gmail.com')).toBe(true);
    expect(isAdminEmail('SLY.TRISTAN1@GMAIL.COM')).toBe(true);
  });
});

describe('hasValidBilling', () => {
  // ========== NON-ADMIN TESTS ==========
  describe('non-admin user (test@example.com)', () => {
    const email = 'test@example.com';

    it('blocks pending billing', () => {
      expect(hasValidBilling('pending', null, email)).toBe(false);
    });

    it('blocks cancelled billing', () => {
      expect(hasValidBilling('cancelled', null, email)).toBe(false);
    });

    it('blocks past_due billing', () => {
      expect(hasValidBilling('past_due', null, email)).toBe(false);
    });

    it('blocks expired trial', () => {
      expect(hasValidBilling('trial', '2025-01-01T00:00:00Z', email)).toBe(false);
    });

    it('blocks null/undefined billing plan', () => {
      expect(hasValidBilling(null, null, email)).toBe(false);
      expect(hasValidBilling(undefined, null, email)).toBe(false);
    });

    it('blocks unknown billing plan', () => {
      expect(hasValidBilling('garbage', null, email)).toBe(false);
    });

    it('allows active billing', () => {
      expect(hasValidBilling('active', null, email)).toBe(true);
    });

    it('allows valid trial (future expiry)', () => {
      const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      expect(hasValidBilling('trial', future, email)).toBe(true);
    });

    it('allows trial with no expiry date', () => {
      expect(hasValidBilling('trial', null, email)).toBe(true);
    });
  });

  // ========== ADMIN TESTS ==========
  describe('admin user (sly.tristan1@gmail.com)', () => {
    const email = 'sly.tristan1@gmail.com';

    it('bypasses pending billing', () => {
      expect(hasValidBilling('pending', null, email)).toBe(true);
    });

    it('bypasses cancelled billing', () => {
      expect(hasValidBilling('cancelled', null, email)).toBe(true);
    });

    it('bypasses past_due billing', () => {
      expect(hasValidBilling('past_due', null, email)).toBe(true);
    });

    it('bypasses expired trial', () => {
      expect(hasValidBilling('trial', '2025-01-01T00:00:00Z', email)).toBe(true);
    });

    it('bypasses null billing plan', () => {
      expect(hasValidBilling(null, null, email)).toBe(true);
    });

    it('bypasses undefined billing plan', () => {
      expect(hasValidBilling(undefined, undefined, email)).toBe(true);
    });
  });

  // ========== NO EMAIL ==========
  describe('no email provided', () => {
    it('blocks cancelled without email', () => {
      expect(hasValidBilling('cancelled', null)).toBe(false);
      expect(hasValidBilling('cancelled', null, null)).toBe(false);
      expect(hasValidBilling('cancelled', null, undefined)).toBe(false);
    });

    it('allows active without email', () => {
      expect(hasValidBilling('active', null)).toBe(true);
    });
  });
});
