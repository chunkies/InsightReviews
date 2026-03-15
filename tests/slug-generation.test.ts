import { describe, it, expect } from 'vitest';
import { SLUG_REGEX } from '@/lib/utils/constants';

// ═══════════════════════════════════════════════════════════════════════════════
// Slug generation — uniqueness, collision prevention, format validation
// ═══════════════════════════════════════════════════════════════════════════════

// Mirror the NEW slug generation logic from onboarding-wizard.tsx (with random suffix)
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 42);
  if (!base) return '';
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

// Extract the base portion (without random suffix)
function getSlugBase(slug: string): string {
  // Slug format: "base-xxxx" where xxxx is the 4-char random suffix
  return slug.replace(/-[a-z0-9]{4}$/, '');
}

// Simulate onboarding API collision detection
interface OnboardingSlugResult {
  status: number;
  error?: string;
}

function simulateSlugInsert(
  slug: string,
  existingSlugs: string[],
): OnboardingSlugResult {
  if (!slug) {
    return { status: 400, error: 'Business name and slug are required' };
  }
  if (existingSlugs.includes(slug)) {
    return { status: 409, error: 'This slug is already taken. Please choose a different one.' };
  }
  return { status: 200 };
}

describe('Slug generation — format with random suffix', () => {
  it('generates slug with random suffix', () => {
    const slug = generateSlug('Joes Cafe');
    expect(slug).toMatch(/^joes-cafe-[a-z0-9]{4}$/);
  });

  it('base portion is derived from name', () => {
    const slug = generateSlug('My Great Business');
    const base = getSlugBase(slug);
    expect(base).toBe('my-great-business');
  });

  it('removes special characters from base', () => {
    const slug = generateSlug("Joe's Café & Bar");
    const base = getSlugBase(slug);
    expect(base).toBe('joes-caf-bar');
  });

  it('collapses multiple hyphens in base', () => {
    const slug = generateSlug('foo - - bar');
    const base = getSlugBase(slug);
    expect(base).toBe('foo-bar');
  });

  it('truncates base to 42 chars (total ≤ 47 with suffix)', () => {
    const longName = 'A'.repeat(60);
    const slug = generateSlug(longName);
    // base max 42 + '-' + 4 suffix = 47
    expect(slug.length).toBeLessThanOrEqual(47);
  });

  it('returns empty string for empty name', () => {
    expect(generateSlug('')).toBe('');
  });

  it('returns empty for all-special-character name', () => {
    expect(generateSlug('!@#$%^&*()')).toBe('');
  });

  it('handles numbers in name', () => {
    const slug = generateSlug('Studio 54 Fitness');
    const base = getSlugBase(slug);
    expect(base).toBe('studio-54-fitness');
  });
});

describe('Slug generation — randomness prevents collisions', () => {
  it('two calls with same name produce different slugs', () => {
    const slug1 = generateSlug('Hello');
    const slug2 = generateSlug('Hello');
    // Extremely unlikely to be equal (1 in 1.6M chance)
    expect(slug1).not.toBe(slug2);
  });

  it('same base but different suffixes', () => {
    const slug1 = generateSlug('Hello');
    const slug2 = generateSlug('Hello');
    expect(getSlugBase(slug1)).toBe(getSlugBase(slug2));
    // suffixes differ
    const suffix1 = slug1.slice(-4);
    const suffix2 = slug2.slice(-4);
    expect(suffix1).not.toBe(suffix2);
  });

  it('100 slugs from same name are all unique', () => {
    const slugs = new Set<string>();
    for (let i = 0; i < 100; i++) {
      slugs.add(generateSlug('Hello'));
    }
    expect(slugs.size).toBe(100);
  });
});

describe('Slug validation — SLUG_REGEX', () => {
  it('accepts lowercase letters', () => {
    expect(SLUG_REGEX.test('joes-cafe')).toBe(true);
  });

  it('accepts numbers', () => {
    expect(SLUG_REGEX.test('cafe-123')).toBe(true);
  });

  it('accepts hyphens', () => {
    expect(SLUG_REGEX.test('my-great-biz')).toBe(true);
  });

  it('rejects uppercase', () => {
    expect(SLUG_REGEX.test('JoesCafe')).toBe(false);
  });

  it('rejects spaces', () => {
    expect(SLUG_REGEX.test('joes cafe')).toBe(false);
  });

  it('rejects special characters', () => {
    expect(SLUG_REGEX.test('joe\'s-cafe')).toBe(false);
    expect(SLUG_REGEX.test('joe@cafe')).toBe(false);
    expect(SLUG_REGEX.test('joe.cafe')).toBe(false);
  });

  it('rejects underscores', () => {
    expect(SLUG_REGEX.test('joes_cafe')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(SLUG_REGEX.test('')).toBe(false);
  });

  it('accepts generated slugs with suffix', () => {
    for (let i = 0; i < 20; i++) {
      const slug = generateSlug('Test Business');
      if (slug) {
        expect(SLUG_REGEX.test(slug)).toBe(true);
      }
    }
  });
});

describe('Slug collision — DB duplicate detection still works', () => {
  it('detects exact collision (user manually entered same slug)', () => {
    const existingSlugs = ['hello-a7x3', 'joes-cafe-b2m9'];
    const result = simulateSlugInsert('hello-a7x3', existingSlugs);
    expect(result.status).toBe(409);
  });

  it('allows unique generated slugs', () => {
    const existingSlugs = ['hello-a7x3'];
    const newSlug = generateSlug('Hello'); // will get different suffix
    const result = simulateSlugInsert(newSlug, existingSlugs);
    expect(result.status).toBe(200);
  });

  it('rejects empty slug', () => {
    const result = simulateSlugInsert('', []);
    expect(result.status).toBe(400);
  });
});

describe('Slug — review URL construction', () => {
  it('slug maps to /r/{slug} route', () => {
    const slug = generateSlug('My Business');
    const reviewUrl = `https://insightreviews.com.au/r/${slug}`;
    expect(reviewUrl).toMatch(/^https:\/\/insightreviews\.com\.au\/r\/my-business-[a-z0-9]{4}$/);
  });

  it('generated slug is URL-safe', () => {
    const names = ['Hello', "Joe's Café", 'Studio 54', 'The Best Place Ever!!!'];
    for (const name of names) {
      const slug = generateSlug(name);
      if (slug) {
        expect(SLUG_REGEX.test(slug)).toBe(true);
        expect(slug).toBe(encodeURIComponent(slug));
      }
    }
  });
});
