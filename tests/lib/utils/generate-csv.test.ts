import { describe, it, expect } from 'vitest';
import { generateReviewsCsv } from '@/lib/utils/generate-csv';
import type { Review } from '@/lib/types/database';

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: '1',
    organization_id: 'org-1',
    review_request_id: null,
    rating: 5,
    comment: 'Great place!',
    customer_name: 'Jane Doe',
    customer_phone: null,
    customer_email: null,
    is_positive: true,
    is_public: true,
    redirected_to: [],
    responded: false,
    response_notes: null,
    photo_url: null,
    created_at: '2026-03-10T10:00:00Z',
    ...overrides,
  };
}

describe('generateReviewsCsv', () => {
  it('generates CSV header row', () => {
    const csv = generateReviewsCsv([]);
    expect(csv).toBe('Date,Customer Name,Rating,Sentiment,Comment,Public');
  });

  it('generates correct CSV for a single review', () => {
    const reviews = [makeReview()];
    const csv = generateReviewsCsv(reviews);
    const lines = csv.split('\n');

    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('Jane Doe');
    expect(lines[1]).toContain('5');
    expect(lines[1]).toContain('Positive');
    expect(lines[1]).toContain('Great place!');
    expect(lines[1]).toContain('Yes');
  });

  it('handles negative reviews correctly', () => {
    const reviews = [makeReview({ rating: 2, is_positive: false, is_public: false })];
    const csv = generateReviewsCsv(reviews);
    const lines = csv.split('\n');

    expect(lines[1]).toContain('Negative');
    expect(lines[1]).toContain('No');
  });

  it('handles null comment and customer name', () => {
    const reviews = [makeReview({ comment: null, customer_name: null })];
    const csv = generateReviewsCsv(reviews);
    const lines = csv.split('\n');

    // Should have empty fields, not "null"
    expect(lines[1]).not.toContain('null');
  });

  it('escapes fields containing commas', () => {
    const reviews = [makeReview({ comment: 'Great food, great service' })];
    const csv = generateReviewsCsv(reviews);

    expect(csv).toContain('"Great food, great service"');
  });

  it('escapes fields containing double quotes', () => {
    const reviews = [makeReview({ comment: 'The "best" cafe ever' })];
    const csv = generateReviewsCsv(reviews);

    expect(csv).toContain('"The ""best"" cafe ever"');
  });

  it('generates multiple rows', () => {
    const reviews = [
      makeReview({ id: '1', customer_name: 'Alice' }),
      makeReview({ id: '2', customer_name: 'Bob', rating: 3, is_positive: false }),
      makeReview({ id: '3', customer_name: 'Charlie' }),
    ];
    const csv = generateReviewsCsv(reviews);
    const lines = csv.split('\n');

    expect(lines).toHaveLength(4); // header + 3 data rows
    expect(lines[1]).toContain('Alice');
    expect(lines[2]).toContain('Bob');
    expect(lines[3]).toContain('Charlie');
  });
});
