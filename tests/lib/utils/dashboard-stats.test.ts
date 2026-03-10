import { describe, it, expect } from 'vitest';
import {
  computeReviewStats,
  timeAgo,
  maskPhone,
  maskEmail,
} from '@/lib/utils/dashboard-stats';

describe('computeReviewStats', () => {
  const now = new Date('2026-03-09T12:00:00Z');

  it('returns zeroed stats when there are no reviews or requests', () => {
    const stats = computeReviewStats([], [], 4, now);
    expect(stats).toEqual({
      totalReviews: 0,
      averageRating: 0,
      positivePercentage: 0,
      totalRequests: 0,
      responseRate: 0,
      thisWeekReviews: 0,
      lastWeekReviews: 0,
      npsScore: null,
      promoterCount: 0,
      passiveCount: 0,
      detractorCount: 0,
    });
  });

  it('computes correct totals, average, and positive percentage', () => {
    const reviews = [
      { id: '1', rating: 5, created_at: '2026-03-08T10:00:00Z' },
      { id: '2', rating: 4, created_at: '2026-03-07T10:00:00Z' },
      { id: '3', rating: 2, created_at: '2026-03-06T10:00:00Z' },
      { id: '4', rating: 3, created_at: '2026-03-05T10:00:00Z' },
    ];
    const requests = [
      { id: 'r1', status: 'completed' },
      { id: 'r2', status: 'sent' },
      { id: 'r3', status: 'completed' },
    ];

    const stats = computeReviewStats(reviews, requests, 4, now);

    expect(stats.totalReviews).toBe(4);
    expect(stats.averageRating).toBe(3.5);
    // Positive: ratings 5 and 4 => 2 out of 4 = 50%
    expect(stats.positivePercentage).toBe(50);
    expect(stats.totalRequests).toBe(3);
    // Response rate: 2 completed out of 3 => ~67%
    expect(stats.responseRate).toBe(67);
  });

  it('uses the positive threshold correctly', () => {
    const reviews = [
      { id: '1', rating: 3, created_at: '2026-03-08T10:00:00Z' },
      { id: '2', rating: 4, created_at: '2026-03-07T10:00:00Z' },
      { id: '3', rating: 5, created_at: '2026-03-06T10:00:00Z' },
    ];

    // Threshold 3: all 3 are positive
    const stats3 = computeReviewStats(reviews, [], 3, now);
    expect(stats3.positivePercentage).toBe(100);

    // Threshold 5: only 1 is positive
    const stats5 = computeReviewStats(reviews, [], 5, now);
    expect(stats5.positivePercentage).toBe(33);
  });

  it('calculates this week and last week reviews', () => {
    const reviews = [
      // This week (within 7 days of now)
      { id: '1', rating: 5, created_at: '2026-03-08T10:00:00Z' },
      { id: '2', rating: 4, created_at: '2026-03-03T10:00:00Z' },
      // Last week (7-14 days ago)
      { id: '3', rating: 3, created_at: '2026-02-25T10:00:00Z' },
      // Older than 2 weeks
      { id: '4', rating: 2, created_at: '2026-01-01T10:00:00Z' },
    ];

    const stats = computeReviewStats(reviews, [], 4, now);
    expect(stats.thisWeekReviews).toBe(2);
    expect(stats.lastWeekReviews).toBe(1);
  });

  it('calculates NPS score correctly', () => {
    const reviews = [
      { id: '1', rating: 5, created_at: '2026-03-08T10:00:00Z' }, // Promoter
      { id: '2', rating: 5, created_at: '2026-03-07T10:00:00Z' }, // Promoter
      { id: '3', rating: 4, created_at: '2026-03-06T10:00:00Z' }, // Passive
      { id: '4', rating: 2, created_at: '2026-03-05T10:00:00Z' }, // Detractor
    ];

    const stats = computeReviewStats(reviews, [], 4, now);

    expect(stats.promoterCount).toBe(2);
    expect(stats.passiveCount).toBe(1);
    expect(stats.detractorCount).toBe(1);
    // NPS = (2/4 - 1/4) * 100 = 25
    expect(stats.npsScore).toBe(25);
  });

  it('returns null NPS for zero reviews', () => {
    const stats = computeReviewStats([], [], 4, now);
    expect(stats.npsScore).toBeNull();
  });

  it('calculates NPS of 100 when all reviews are 5 stars', () => {
    const reviews = [
      { id: '1', rating: 5, created_at: '2026-03-08T10:00:00Z' },
      { id: '2', rating: 5, created_at: '2026-03-07T10:00:00Z' },
    ];

    const stats = computeReviewStats(reviews, [], 4, now);
    expect(stats.npsScore).toBe(100);
    expect(stats.promoterCount).toBe(2);
    expect(stats.passiveCount).toBe(0);
    expect(stats.detractorCount).toBe(0);
  });

  it('calculates NPS of -100 when all reviews are detractors', () => {
    const reviews = [
      { id: '1', rating: 1, created_at: '2026-03-08T10:00:00Z' },
      { id: '2', rating: 2, created_at: '2026-03-07T10:00:00Z' },
      { id: '3', rating: 3, created_at: '2026-03-06T10:00:00Z' },
    ];

    const stats = computeReviewStats(reviews, [], 4, now);
    expect(stats.npsScore).toBe(-100);
    expect(stats.promoterCount).toBe(0);
    expect(stats.detractorCount).toBe(3);
  });

  it('rounds average rating to one decimal place', () => {
    const reviews = [
      { id: '1', rating: 5, created_at: '2026-03-08T10:00:00Z' },
      { id: '2', rating: 4, created_at: '2026-03-07T10:00:00Z' },
      { id: '3', rating: 3, created_at: '2026-03-06T10:00:00Z' },
    ];

    const stats = computeReviewStats(reviews, [], 4, now);
    expect(stats.averageRating).toBe(4); // (5+4+3)/3 = 4.0
  });
});

describe('timeAgo', () => {
  const now = new Date('2026-03-09T12:00:00Z');

  it('returns "just now" for times less than a minute ago', () => {
    expect(timeAgo('2026-03-09T11:59:30Z', now)).toBe('just now');
  });

  it('returns minutes ago', () => {
    expect(timeAgo('2026-03-09T11:45:00Z', now)).toBe('15 min ago');
  });

  it('returns hours ago (singular)', () => {
    expect(timeAgo('2026-03-09T11:00:00Z', now)).toBe('1 hr ago');
  });

  it('returns hours ago (plural)', () => {
    expect(timeAgo('2026-03-09T09:00:00Z', now)).toBe('3 hrs ago');
  });

  it('returns days ago (singular)', () => {
    expect(timeAgo('2026-03-08T12:00:00Z', now)).toBe('1 day ago');
  });

  it('returns days ago (plural)', () => {
    expect(timeAgo('2026-03-06T12:00:00Z', now)).toBe('3 days ago');
  });

  it('returns formatted date for older than a week', () => {
    const result = timeAgo('2026-02-01T12:00:00Z', now);
    // Should be a locale date string, not a relative time
    expect(result).not.toContain('ago');
  });
});

describe('maskPhone', () => {
  it('masks a standard phone number', () => {
    expect(maskPhone('+61412345678')).toBe('+614 *** 678');
  });

  it('masks a phone without + prefix', () => {
    expect(maskPhone('0412345678')).toBe('041 *** 678');
  });

  it('returns original for very short numbers', () => {
    expect(maskPhone('12345')).toBe('12345');
  });
});

describe('maskEmail', () => {
  it('masks a standard email', () => {
    expect(maskEmail('john@example.com')).toBe('j***@example.com');
  });

  it('handles single-char local part', () => {
    expect(maskEmail('a@test.com')).toBe('a***@test.com');
  });

  it('returns original for invalid email without @', () => {
    expect(maskEmail('notanemail')).toBe('notanemail');
  });
});
