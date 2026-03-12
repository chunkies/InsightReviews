import { describe, it, expect } from 'vitest';
import { RATING_LABELS, RATING_COLORS, PLAN, SMS_MAX_LENGTH, SLUG_REGEX } from '@/lib/utils/constants';

describe('RATING_LABELS', () => {
  it('has labels for all 5 ratings', () => {
    expect(Object.keys(RATING_LABELS)).toHaveLength(5);
    expect(RATING_LABELS[1]).toBe('Terrible');
    expect(RATING_LABELS[5]).toBe('Excellent');
  });
});

describe('RATING_COLORS', () => {
  it('has colors for all 5 ratings', () => {
    expect(Object.keys(RATING_COLORS)).toHaveLength(5);
    for (let i = 1; i <= 5; i++) {
      expect(RATING_COLORS[i]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('PLAN', () => {
  it('has correct pricing', () => {
    expect(PLAN.price).toBe(79);
    expect(PLAN.trialDays).toBe(14);
    expect(PLAN.currency).toBe('aud');
  });
});

describe('SMS_MAX_LENGTH', () => {
  it('is 160 characters', () => {
    expect(SMS_MAX_LENGTH).toBe(160);
  });
});

describe('SLUG_REGEX', () => {
  it('accepts valid slugs', () => {
    expect(SLUG_REGEX.test('joes-cafe')).toBe(true);
    expect(SLUG_REGEX.test('glow-beauty')).toBe(true);
    expect(SLUG_REGEX.test('abc123')).toBe(true);
    expect(SLUG_REGEX.test('a')).toBe(true);
  });

  it('rejects invalid slugs', () => {
    expect(SLUG_REGEX.test('Joes Cafe')).toBe(false);
    expect(SLUG_REGEX.test('has spaces')).toBe(false);
    expect(SLUG_REGEX.test('UPPERCASE')).toBe(false);
    expect(SLUG_REGEX.test('special@chars!')).toBe(false);
    expect(SLUG_REGEX.test('')).toBe(false);
  });
});
