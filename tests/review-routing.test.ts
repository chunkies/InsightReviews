import { describe, it, expect } from 'vitest';
import {
  RATING_LABELS,
  RATING_COLORS,
  PLAN,
  SMS_MAX_LENGTH,
  SLUG_REGEX,
  PLATFORM_CONFIG,
} from '@/lib/utils/constants';
import { buildReviewLink, buildSmsBody } from '@/lib/twilio/client';
import { computeReviewStats, maskPhone } from '@/lib/utils/dashboard-stats';

// ──────────────────────────────────────────────────────────────────────
// Pure helper: mirrors the core routing logic from the submit API route
// rating >= positive_threshold → positive; otherwise → negative
// ──────────────────────────────────────────────────────────────────────
function classifyReview(
  rating: number,
  positiveThreshold: number,
): { isPositive: boolean; isPublic: boolean } {
  const isPositive = rating >= positiveThreshold;
  return { isPositive, isPublic: isPositive };
}

// ──────────────────────────────────────────────────────────────────────
// 1. Review Classification (core routing logic)
// ──────────────────────────────────────────────────────────────────────
describe('Review classification / routing logic', () => {
  describe('default threshold (4)', () => {
    const threshold = 4;

    it('classifies rating 1 as negative', () => {
      expect(classifyReview(1, threshold)).toEqual({ isPositive: false, isPublic: false });
    });

    it('classifies rating 2 as negative', () => {
      expect(classifyReview(2, threshold)).toEqual({ isPositive: false, isPublic: false });
    });

    it('classifies rating 3 as negative', () => {
      expect(classifyReview(3, threshold)).toEqual({ isPositive: false, isPublic: false });
    });

    it('classifies rating 4 as positive', () => {
      expect(classifyReview(4, threshold)).toEqual({ isPositive: true, isPublic: true });
    });

    it('classifies rating 5 as positive', () => {
      expect(classifyReview(5, threshold)).toEqual({ isPositive: true, isPublic: true });
    });

    it('auto-publishes positive reviews', () => {
      expect(classifyReview(5, threshold).isPublic).toBe(true);
      expect(classifyReview(4, threshold).isPublic).toBe(true);
    });

    it('keeps negative reviews private', () => {
      expect(classifyReview(1, threshold).isPublic).toBe(false);
      expect(classifyReview(3, threshold).isPublic).toBe(false);
    });
  });

  describe('custom threshold = 3 (lenient)', () => {
    const threshold = 3;

    it('classifies rating 1 as negative', () => {
      expect(classifyReview(1, threshold).isPositive).toBe(false);
    });

    it('classifies rating 2 as negative', () => {
      expect(classifyReview(2, threshold).isPositive).toBe(false);
    });

    it('classifies rating 3 as positive', () => {
      expect(classifyReview(3, threshold).isPositive).toBe(true);
    });

    it('classifies rating 4 as positive', () => {
      expect(classifyReview(4, threshold).isPositive).toBe(true);
    });

    it('classifies rating 5 as positive', () => {
      expect(classifyReview(5, threshold).isPositive).toBe(true);
    });
  });

  describe('custom threshold = 5 (strict)', () => {
    const threshold = 5;

    it('classifies rating 1-4 as negative', () => {
      for (let r = 1; r <= 4; r++) {
        expect(classifyReview(r, threshold).isPositive).toBe(false);
      }
    });

    it('classifies only rating 5 as positive', () => {
      expect(classifyReview(5, threshold).isPositive).toBe(true);
    });
  });

  describe('custom threshold = 1 (everything positive)', () => {
    const threshold = 1;

    it('classifies all ratings 1-5 as positive', () => {
      for (let r = 1; r <= 5; r++) {
        expect(classifyReview(r, threshold).isPositive).toBe(true);
      }
    });
  });

  describe('boundary behavior', () => {
    it('rating equal to threshold is positive', () => {
      expect(classifyReview(3, 3).isPositive).toBe(true);
      expect(classifyReview(4, 4).isPositive).toBe(true);
      expect(classifyReview(5, 5).isPositive).toBe(true);
    });

    it('rating one below threshold is negative', () => {
      expect(classifyReview(2, 3).isPositive).toBe(false);
      expect(classifyReview(3, 4).isPositive).toBe(false);
      expect(classifyReview(4, 5).isPositive).toBe(false);
    });
  });
});

// ──────────────────────────────────────────────────────────────────────
// 2. Constants
// ──────────────────────────────────────────────────────────────────────
describe('Constants', () => {
  describe('RATING_LABELS', () => {
    it('maps all 5 ratings to labels', () => {
      expect(Object.keys(RATING_LABELS)).toHaveLength(5);
    });

    it('has correct label for each rating', () => {
      expect(RATING_LABELS[1]).toBe('Terrible');
      expect(RATING_LABELS[2]).toBe('Poor');
      expect(RATING_LABELS[3]).toBe('Okay');
      expect(RATING_LABELS[4]).toBe('Good');
      expect(RATING_LABELS[5]).toBe('Excellent');
    });

    it('returns undefined for out-of-range ratings', () => {
      expect(RATING_LABELS[0]).toBeUndefined();
      expect(RATING_LABELS[6]).toBeUndefined();
    });
  });

  describe('RATING_COLORS', () => {
    it('maps all 5 ratings to hex colors', () => {
      expect(Object.keys(RATING_COLORS)).toHaveLength(5);
      for (let i = 1; i <= 5; i++) {
        expect(RATING_COLORS[i]).toMatch(/^#[0-9a-f]{6}$/);
      }
    });

    it('uses red tones for low ratings and green for high', () => {
      // Rating 1 is red (#d32f2f), rating 5 is green (#2e7d32)
      expect(RATING_COLORS[1]).toBe('#d32f2f');
      expect(RATING_COLORS[5]).toBe('#2e7d32');
    });

    it('progresses from warm to cool colors', () => {
      expect(RATING_COLORS[2]).toBe('#f57c00');
      expect(RATING_COLORS[3]).toBe('#fbc02d');
      expect(RATING_COLORS[4]).toBe('#7cb342');
    });
  });

  describe('PLAN', () => {
    it('has price of 79', () => {
      expect(PLAN.price).toBe(79);
    });

    it('has 14-day trial', () => {
      expect(PLAN.trialDays).toBe(14);
    });

    it('uses AUD currency', () => {
      expect(PLAN.currency).toBe('aud');
    });

    it('is named InsightReviews', () => {
      expect(PLAN.name).toBe('InsightReviews');
    });
  });

  describe('SMS_MAX_LENGTH', () => {
    it('is 160 characters (standard SMS)', () => {
      expect(SMS_MAX_LENGTH).toBe(160);
    });
  });

  describe('SLUG_REGEX', () => {
    it('accepts lowercase letters', () => {
      expect(SLUG_REGEX.test('abcdef')).toBe(true);
    });

    it('accepts numbers', () => {
      expect(SLUG_REGEX.test('12345')).toBe(true);
    });

    it('accepts hyphens', () => {
      expect(SLUG_REGEX.test('my-cafe')).toBe(true);
    });

    it('accepts mixed lowercase letters, numbers, and hyphens', () => {
      expect(SLUG_REGEX.test('joes-cafe-123')).toBe(true);
    });

    it('rejects spaces', () => {
      expect(SLUG_REGEX.test('my cafe')).toBe(false);
    });

    it('rejects uppercase letters', () => {
      expect(SLUG_REGEX.test('MyBusiness')).toBe(false);
    });

    it('rejects special characters', () => {
      expect(SLUG_REGEX.test('cafe@town')).toBe(false);
      expect(SLUG_REGEX.test('cafe!')).toBe(false);
      expect(SLUG_REGEX.test('cafe.com')).toBe(false);
      expect(SLUG_REGEX.test('café')).toBe(false);
    });

    it('rejects underscores', () => {
      expect(SLUG_REGEX.test('my_cafe')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(SLUG_REGEX.test('')).toBe(false);
    });

    it('accepts single character', () => {
      expect(SLUG_REGEX.test('a')).toBe(true);
      expect(SLUG_REGEX.test('1')).toBe(true);
    });
  });

  describe('PLATFORM_CONFIG', () => {
    it('has entries for google, facebook, yelp, and internal', () => {
      expect(PLATFORM_CONFIG).toHaveProperty('google');
      expect(PLATFORM_CONFIG).toHaveProperty('facebook');
      expect(PLATFORM_CONFIG).toHaveProperty('yelp');
      expect(PLATFORM_CONFIG).toHaveProperty('internal');
    });

    it('each entry has required fields', () => {
      for (const key of Object.keys(PLATFORM_CONFIG)) {
        const config = PLATFORM_CONFIG[key];
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('color');
        expect(config).toHaveProperty('bgColor');
        expect(config).toHaveProperty('icon');
        expect(config).toHaveProperty('gradient');
        expect(typeof config.name).toBe('string');
        expect(config.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(config.bgColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    it('Google config is correct', () => {
      expect(PLATFORM_CONFIG.google.name).toBe('Google');
      expect(PLATFORM_CONFIG.google.color).toBe('#4285F4');
    });

    it('Facebook config is correct', () => {
      expect(PLATFORM_CONFIG.facebook.name).toBe('Facebook');
      expect(PLATFORM_CONFIG.facebook.color).toBe('#1877F2');
    });

    it('Yelp config is correct', () => {
      expect(PLATFORM_CONFIG.yelp.name).toBe('Yelp');
      expect(PLATFORM_CONFIG.yelp.color).toBe('#D32323');
    });

    it('Internal config is correct', () => {
      expect(PLATFORM_CONFIG.internal.name).toBe('InsightReviews');
      expect(PLATFORM_CONFIG.internal.color).toBe('#7c3aed');
    });
  });
});

// ──────────────────────────────────────────────────────────────────────
// 3. Positive percentage via computeReviewStats (threshold-aware)
// ──────────────────────────────────────────────────────────────────────
describe('computeReviewStats positive percentage with thresholds', () => {
  const now = new Date('2026-03-15T12:00:00Z');

  function makeReviews(ratings: number[]) {
    return ratings.map((r, i) => ({
      id: `r${i}`,
      rating: r,
      created_at: '2026-03-14T10:00:00Z',
    }));
  }

  it('default threshold 4: ratings 4-5 are positive', () => {
    const reviews = makeReviews([1, 2, 3, 4, 5]);
    const stats = computeReviewStats(reviews, [], 4, now);
    expect(stats.positivePercentage).toBe(40); // 2 out of 5
  });

  it('threshold 3: ratings 3-5 are positive', () => {
    const reviews = makeReviews([1, 2, 3, 4, 5]);
    const stats = computeReviewStats(reviews, [], 3, now);
    expect(stats.positivePercentage).toBe(60); // 3 out of 5
  });

  it('threshold 5: only 5-star is positive', () => {
    const reviews = makeReviews([1, 2, 3, 4, 5]);
    const stats = computeReviewStats(reviews, [], 5, now);
    expect(stats.positivePercentage).toBe(20); // 1 out of 5
  });

  it('threshold 1: all ratings are positive', () => {
    const reviews = makeReviews([1, 2, 3, 4, 5]);
    const stats = computeReviewStats(reviews, [], 1, now);
    expect(stats.positivePercentage).toBe(100);
  });

  it('all 5-star reviews with threshold 4 gives 100%', () => {
    const reviews = makeReviews([5, 5, 5, 5]);
    const stats = computeReviewStats(reviews, [], 4, now);
    expect(stats.positivePercentage).toBe(100);
  });

  it('all 1-star reviews with threshold 4 gives 0%', () => {
    const reviews = makeReviews([1, 1, 1]);
    const stats = computeReviewStats(reviews, [], 4, now);
    expect(stats.positivePercentage).toBe(0);
  });

  it('no reviews gives 0% positive', () => {
    const stats = computeReviewStats([], [], 4, now);
    expect(stats.positivePercentage).toBe(0);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 4. SMS link and body generation
// ──────────────────────────────────────────────────────────────────────
describe('SMS link and body generation for review requests', () => {
  describe('buildReviewLink', () => {
    it('generates correct URL for production domain', () => {
      expect(buildReviewLink('https://insightreviews.com.au', 'joes-cafe'))
        .toBe('https://insightreviews.com.au/r/joes-cafe');
    });

    it('generates correct URL for localhost', () => {
      expect(buildReviewLink('http://localhost:3000', 'test-biz'))
        .toBe('http://localhost:3000/r/test-biz');
    });

    it('trims trailing whitespace from siteUrl', () => {
      expect(buildReviewLink('https://app.com  ', 'slug'))
        .toBe('https://app.com/r/slug');
    });

    it('preserves the slug exactly as given', () => {
      expect(buildReviewLink('https://app.com', 'a-very-long-slug-123'))
        .toBe('https://app.com/r/a-very-long-slug-123');
    });
  });

  describe('buildSmsBody', () => {
    it('replaces both placeholders in the default template', () => {
      const template = 'Thanks for visiting {business_name}! Leave a review: {link}';
      const result = buildSmsBody(template, 'Joe\'s Cafe', 'https://app.com/r/joes-cafe');
      expect(result).toBe('Thanks for visiting Joe\'s Cafe! Leave a review: https://app.com/r/joes-cafe');
    });

    it('handles business names with special characters', () => {
      const template = 'Review {business_name}: {link}';
      const result = buildSmsBody(template, 'Bob & Jane\'s "Place"', 'https://app.com/r/bobs');
      expect(result).toContain('Bob & Jane\'s "Place"');
    });

    it('returns template as-is when no placeholders match', () => {
      const result = buildSmsBody('Plain message', 'Biz', 'https://link.com');
      expect(result).toBe('Plain message');
    });

    it('generates SMS body within max length for typical use', () => {
      const link = buildReviewLink('https://app.co', 'cafe');
      const body = buildSmsBody('Review {business_name}: {link}', 'Cafe', link);
      expect(body.length).toBeLessThanOrEqual(SMS_MAX_LENGTH);
    });
  });
});

// ──────────────────────────────────────────────────────────────────────
// 5. Phone masking for review request display
// ──────────────────────────────────────────────────────────────────────
describe('Phone masking for review display', () => {
  it('masks an Australian mobile number', () => {
    expect(maskPhone('+61412345678')).toBe('+614 *** 678');
  });

  it('masks a number without international prefix', () => {
    expect(maskPhone('0412345678')).toBe('041 *** 678');
  });

  it('masks a US-format number', () => {
    expect(maskPhone('+15551234567')).toBe('+155 *** 567');
  });

  it('returns original for very short numbers (< 7 digits)', () => {
    expect(maskPhone('12345')).toBe('12345');
    expect(maskPhone('123')).toBe('123');
  });

  it('masks a 7-digit number (minimum maskable length)', () => {
    const result = maskPhone('1234567');
    expect(result).toBe('123 *** 567');
  });

  it('hides the middle portion of the number', () => {
    const masked = maskPhone('+61400111222');
    expect(masked).not.toContain('001');
    expect(masked).not.toContain('112');
    expect(masked).toContain('***');
  });
});

// ──────────────────────────────────────────────────────────────────────
// 6. End-to-end routing scenarios
// ──────────────────────────────────────────────────────────────────────
describe('End-to-end review routing scenarios', () => {
  it('positive review flow: 5-star → positive, public, redirect to platforms', () => {
    const { isPositive, isPublic } = classifyReview(5, 4);
    expect(isPositive).toBe(true);
    expect(isPublic).toBe(true);

    // Positive reviews get platform buttons
    const platforms = ['google', 'facebook', 'yelp'];
    const available = platforms.filter(p => PLATFORM_CONFIG[p]);
    expect(available).toEqual(['google', 'facebook', 'yelp']);
  });

  it('negative review flow: 2-star → negative, private, no redirect', () => {
    const { isPositive, isPublic } = classifyReview(2, 4);
    expect(isPositive).toBe(false);
    expect(isPublic).toBe(false);
    // Negative reviews stay private — no platform redirect
  });

  it('boundary: 4-star at threshold 4 → positive (routed to platforms)', () => {
    const { isPositive } = classifyReview(4, 4);
    expect(isPositive).toBe(true);
  });

  it('boundary: 3-star at threshold 4 → negative (stays private)', () => {
    const { isPositive } = classifyReview(3, 4);
    expect(isPositive).toBe(false);
  });

  it('strict business (threshold 5): 4-star stays private', () => {
    const { isPositive, isPublic } = classifyReview(4, 5);
    expect(isPositive).toBe(false);
    expect(isPublic).toBe(false);
  });

  it('lenient business (threshold 3): 3-star routes to platforms', () => {
    const { isPositive, isPublic } = classifyReview(3, 3);
    expect(isPositive).toBe(true);
    expect(isPublic).toBe(true);
  });

  it('full flow: SMS link → review → classification → label', () => {
    const siteUrl = 'https://insightreviews.com.au';
    const slug = 'joes-cafe';

    // Step 1: Generate SMS link
    const link = buildReviewLink(siteUrl, slug);
    expect(link).toBe('https://insightreviews.com.au/r/joes-cafe');

    // Step 2: Build SMS body
    const body = buildSmsBody(
      'Thanks for visiting {business_name}! Review us: {link}',
      'Joe\'s Cafe',
      link,
    );
    expect(body).toContain('joes-cafe');
    expect(body).toContain('Joe\'s Cafe');

    // Step 3: Customer submits 5-star review
    const rating = 5;
    const { isPositive } = classifyReview(rating, 4);
    expect(isPositive).toBe(true);

    // Step 4: Label is correct
    expect(RATING_LABELS[rating]).toBe('Excellent');
    expect(RATING_COLORS[rating]).toBe('#2e7d32');
  });
});
