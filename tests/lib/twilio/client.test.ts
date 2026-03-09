import { describe, it, expect } from 'vitest';
import { buildReviewLink, buildSmsBody } from '@/lib/twilio/client';

describe('buildReviewLink', () => {
  it('builds correct review URL', () => {
    expect(buildReviewLink('https://app.com', 'joes-cafe'))
      .toBe('https://app.com/r/joes-cafe');
  });

  it('handles localhost URLs', () => {
    expect(buildReviewLink('http://localhost:3000', 'test-biz'))
      .toBe('http://localhost:3000/r/test-biz');
  });

  it('does not add trailing slash', () => {
    const link = buildReviewLink('https://app.com', 'slug');
    expect(link.endsWith('/')).toBe(false);
  });
});

describe('buildSmsBody', () => {
  it('replaces {business_name} and {link} placeholders', () => {
    const template = 'Thanks for visiting {business_name}! Leave a review: {link}';
    const result = buildSmsBody(template, 'Joe\'s Cafe', 'https://app.com/r/joes-cafe');
    expect(result).toBe('Thanks for visiting Joe\'s Cafe! Leave a review: https://app.com/r/joes-cafe');
  });

  it('handles template with no placeholders', () => {
    const result = buildSmsBody('Static message', 'Biz', 'https://link.com');
    expect(result).toBe('Static message');
  });

  it('handles template with only business name', () => {
    const result = buildSmsBody('Visit {business_name} again!', 'Salon', 'https://link.com');
    expect(result).toBe('Visit Salon again!');
  });
});
