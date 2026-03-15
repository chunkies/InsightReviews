import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════════
// Settings updates — validation, propagation to review form & collect page
// ═══════════════════════════════════════════════════════════════════════════════

interface OrgSettings {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  sms_template: string;
  positive_threshold: number;
  webhook_url: string | null;
  webhook_enabled: boolean;
  notify_on_negative: boolean;
  digest_enabled: boolean;
}

// Simulate the settings update — mirror what settings-form.tsx does
function buildUpdatePayload(form: Partial<OrgSettings>): Partial<OrgSettings> {
  return {
    name: form.name,
    phone: form.phone || null,
    email: form.email || null,
    address: form.address || null,
    sms_template: form.sms_template,
    positive_threshold: form.positive_threshold,
    webhook_url: form.webhook_url || null,
    webhook_enabled: form.webhook_enabled ?? false,
    notify_on_negative: form.notify_on_negative ?? true,
    digest_enabled: form.digest_enabled ?? false,
  };
}

// Simulate: review URL construction from org data (collect page)
function buildReviewUrl(siteUrl: string, slug: string): string {
  return `${siteUrl}/r/${slug}`;
}

// Simulate: positive threshold affects review routing
function isPositiveReview(rating: number, threshold: number): boolean {
  return rating >= threshold;
}

// Simulate: SMS template variable replacement
function renderSmsTemplate(template: string, vars: { businessName: string; link: string }): string {
  return template
    .replace(/\{business_name\}/g, vars.businessName)
    .replace(/\{link\}/g, vars.link);
}

describe('Settings — update payload construction', () => {
  it('builds correct payload with all fields', () => {
    const payload = buildUpdatePayload({
      name: 'Joes Cafe',
      phone: '+61400000000',
      email: 'joe@cafe.com',
      address: '123 Main St',
      sms_template: 'Hi! Rate us: {link}',
      positive_threshold: 4,
      webhook_url: 'https://hooks.example.com/reviews',
      webhook_enabled: true,
      notify_on_negative: true,
      digest_enabled: true,
    });
    expect(payload.name).toBe('Joes Cafe');
    expect(payload.phone).toBe('+61400000000');
    expect(payload.webhook_enabled).toBe(true);
    expect(payload.digest_enabled).toBe(true);
  });

  it('nullifies empty phone', () => {
    const payload = buildUpdatePayload({ phone: '' });
    expect(payload.phone).toBeNull();
  });

  it('nullifies empty email', () => {
    const payload = buildUpdatePayload({ email: '' });
    expect(payload.email).toBeNull();
  });

  it('nullifies empty webhook URL', () => {
    const payload = buildUpdatePayload({ webhook_url: '' });
    expect(payload.webhook_url).toBeNull();
  });

  it('defaults webhook_enabled to false', () => {
    const payload = buildUpdatePayload({});
    expect(payload.webhook_enabled).toBe(false);
  });

  it('defaults notify_on_negative to true', () => {
    const payload = buildUpdatePayload({});
    expect(payload.notify_on_negative).toBe(true);
  });
});

describe('Settings — positive threshold propagation', () => {
  it('threshold 4: ratings 4-5 are positive, 1-3 are negative', () => {
    expect(isPositiveReview(5, 4)).toBe(true);
    expect(isPositiveReview(4, 4)).toBe(true);
    expect(isPositiveReview(3, 4)).toBe(false);
    expect(isPositiveReview(2, 4)).toBe(false);
    expect(isPositiveReview(1, 4)).toBe(false);
  });

  it('threshold 3: ratings 3-5 are positive, 1-2 are negative', () => {
    expect(isPositiveReview(5, 3)).toBe(true);
    expect(isPositiveReview(3, 3)).toBe(true);
    expect(isPositiveReview(2, 3)).toBe(false);
    expect(isPositiveReview(1, 3)).toBe(false);
  });

  it('threshold 5: only 5-star reviews are positive', () => {
    expect(isPositiveReview(5, 5)).toBe(true);
    expect(isPositiveReview(4, 5)).toBe(false);
  });

  it('threshold 1: all reviews are positive', () => {
    for (let r = 1; r <= 5; r++) {
      expect(isPositiveReview(r, 1)).toBe(true);
    }
  });
});

describe('Settings — review URL uses org slug', () => {
  it('constructs production URL from slug', () => {
    expect(buildReviewUrl('https://insightreviews.com.au', 'joes-cafe'))
      .toBe('https://insightreviews.com.au/r/joes-cafe');
  });

  it('constructs localhost URL from slug', () => {
    expect(buildReviewUrl('http://localhost:3000', 'my-biz'))
      .toBe('http://localhost:3000/r/my-biz');
  });

  it('slug propagates directly into URL path', () => {
    const url = buildReviewUrl('https://insightreviews.com.au', 'test-slug-123');
    expect(url).toContain('/r/test-slug-123');
  });
});

describe('Settings — SMS template variable replacement', () => {
  it('replaces {business_name} and {link}', () => {
    const result = renderSmsTemplate(
      'Thanks for visiting {business_name}! Leave a review: {link}',
      { businessName: 'Joes Cafe', link: 'https://insightreviews.com.au/r/joes-cafe' },
    );
    expect(result).toBe('Thanks for visiting Joes Cafe! Leave a review: https://insightreviews.com.au/r/joes-cafe');
  });

  it('handles multiple occurrences of same variable', () => {
    const result = renderSmsTemplate(
      '{business_name} wants to hear from you! - {business_name}',
      { businessName: 'Glow Salon', link: 'https://example.com' },
    );
    expect(result).toBe('Glow Salon wants to hear from you! - Glow Salon');
  });

  it('handles template with no variables', () => {
    const result = renderSmsTemplate(
      'Please leave us a review!',
      { businessName: 'Test', link: 'https://example.com' },
    );
    expect(result).toBe('Please leave us a review!');
  });

  it('handles empty business name', () => {
    const result = renderSmsTemplate('Hi from {business_name}', { businessName: '', link: '' });
    expect(result).toBe('Hi from ');
  });
});
