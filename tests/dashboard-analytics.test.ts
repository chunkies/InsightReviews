import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  computeReviewStats,
  buildDailyChartData,
  timeAgo,
  maskPhone,
  maskEmail,
} from '@/lib/utils/dashboard-stats';
import { generateReviewsCsv } from '@/lib/utils/generate-csv';
import { logActivity } from '@/lib/utils/activity-logger';
import type { Review } from '@/lib/types/database';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 'rev-1',
    organization_id: 'org-1',
    review_request_id: null,
    rating: 5,
    comment: 'Loved it!',
    customer_name: 'Alice',
    customer_phone: '+61400000000',
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

function makeReviewRow(id: string, rating: number, created_at: string) {
  return { id, rating, created_at };
}

function makeRequestRow(id: string, status: string) {
  return { id, status };
}

// ---------------------------------------------------------------------------
// computeReviewStats
// ---------------------------------------------------------------------------

describe('computeReviewStats — comprehensive', () => {
  const now = new Date('2026-03-15T12:00:00Z');

  it('returns zeroed stats for empty inputs', () => {
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

  it('computes average rating rounded to one decimal', () => {
    const reviews = [
      makeReviewRow('1', 5, '2026-03-14T10:00:00Z'),
      makeReviewRow('2', 4, '2026-03-14T10:00:00Z'),
      makeReviewRow('3', 1, '2026-03-14T10:00:00Z'),
    ];
    // (5+4+1)/3 = 3.333... → 3.3
    const stats = computeReviewStats(reviews, [], 4, now);
    expect(stats.averageRating).toBe(3.3);
  });

  it('rounds average rating to .0 when exact', () => {
    const reviews = [
      makeReviewRow('1', 4, '2026-03-14T10:00:00Z'),
      makeReviewRow('2', 4, '2026-03-14T10:00:00Z'),
    ];
    const stats = computeReviewStats(reviews, [], 4, now);
    expect(stats.averageRating).toBe(4);
  });

  it('computes positive percentage with default threshold 4', () => {
    const reviews = [
      makeReviewRow('1', 5, '2026-03-14T10:00:00Z'),
      makeReviewRow('2', 4, '2026-03-14T10:00:00Z'),
      makeReviewRow('3', 3, '2026-03-14T10:00:00Z'),
      makeReviewRow('4', 2, '2026-03-14T10:00:00Z'),
    ];
    // 2 of 4 >= 4 → 50%
    const stats = computeReviewStats(reviews, [], 4, now);
    expect(stats.positivePercentage).toBe(50);
  });

  it('adjusts positive percentage for threshold 3', () => {
    const reviews = [
      makeReviewRow('1', 5, '2026-03-14T10:00:00Z'),
      makeReviewRow('2', 3, '2026-03-14T10:00:00Z'),
      makeReviewRow('3', 2, '2026-03-14T10:00:00Z'),
    ];
    // 2 of 3 >= 3 → 67%
    const stats = computeReviewStats(reviews, [], 3, now);
    expect(stats.positivePercentage).toBe(67);
  });

  it('computes response rate from completed requests', () => {
    const requests = [
      makeRequestRow('r1', 'completed'),
      makeRequestRow('r2', 'sent'),
      makeRequestRow('r3', 'completed'),
      makeRequestRow('r4', 'failed'),
      makeRequestRow('r5', 'expired'),
    ];
    // 2 completed / 5 total = 40%
    const stats = computeReviewStats([], requests, 4, now);
    expect(stats.responseRate).toBe(40);
    expect(stats.totalRequests).toBe(5);
  });

  it('reports 0% response rate when there are no requests', () => {
    const stats = computeReviewStats([], [], 4, now);
    expect(stats.responseRate).toBe(0);
  });

  it('reports 100% response rate when all requests are completed', () => {
    const requests = [
      makeRequestRow('r1', 'completed'),
      makeRequestRow('r2', 'completed'),
    ];
    const stats = computeReviewStats([], requests, 4, now);
    expect(stats.responseRate).toBe(100);
  });

  describe('week-over-week comparison', () => {
    it('counts reviews from this week (last 7 days)', () => {
      // now = 2026-03-15T12:00:00Z, weekAgo = 2026-03-08T12:00:00Z
      const reviews = [
        makeReviewRow('1', 5, '2026-03-14T10:00:00Z'), // 1 day ago — this week
        makeReviewRow('2', 5, '2026-03-10T10:00:00Z'), // 5 days ago — this week
        makeReviewRow('3', 5, '2026-03-08T13:00:00Z'), // just after weekAgo boundary — this week
      ];
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.thisWeekReviews).toBe(3);
    });

    it('counts reviews from last week (7-14 days ago)', () => {
      // weekAgo = 2026-03-08T12:00:00Z, twoWeeksAgo = 2026-03-01T12:00:00Z
      const reviews = [
        makeReviewRow('1', 3, '2026-03-05T10:00:00Z'), // 10 days ago — last week
        makeReviewRow('2', 3, '2026-03-03T10:00:00Z'), // 12 days ago — last week
        makeReviewRow('3', 3, '2026-03-01T13:00:00Z'), // just after twoWeeksAgo boundary — last week
      ];
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.lastWeekReviews).toBe(3);
    });

    it('excludes reviews older than 14 days from both week buckets', () => {
      const reviews = [
        makeReviewRow('1', 4, '2026-02-01T10:00:00Z'), // > 14 days ago
      ];
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.thisWeekReviews).toBe(0);
      expect(stats.lastWeekReviews).toBe(0);
    });
  });

  describe('NPS calculation', () => {
    it('scores 100 when all reviews are 5 stars (all promoters)', () => {
      const reviews = [
        makeReviewRow('1', 5, '2026-03-14T10:00:00Z'),
        makeReviewRow('2', 5, '2026-03-14T10:00:00Z'),
        makeReviewRow('3', 5, '2026-03-14T10:00:00Z'),
      ];
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.npsScore).toBe(100);
      expect(stats.promoterCount).toBe(3);
      expect(stats.passiveCount).toBe(0);
      expect(stats.detractorCount).toBe(0);
    });

    it('scores -100 when all reviews are detractors (1-3 stars)', () => {
      const reviews = [
        makeReviewRow('1', 1, '2026-03-14T10:00:00Z'),
        makeReviewRow('2', 2, '2026-03-14T10:00:00Z'),
        makeReviewRow('3', 3, '2026-03-14T10:00:00Z'),
      ];
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.npsScore).toBe(-100);
      expect(stats.detractorCount).toBe(3);
    });

    it('scores 0 when promoters and detractors are equal', () => {
      const reviews = [
        makeReviewRow('1', 5, '2026-03-14T10:00:00Z'),
        makeReviewRow('2', 1, '2026-03-14T10:00:00Z'),
      ];
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.npsScore).toBe(0);
    });

    it('returns null NPS for zero reviews', () => {
      const stats = computeReviewStats([], [], 4, now);
      expect(stats.npsScore).toBeNull();
    });

    it('classifies rating 4 as passive, not promoter', () => {
      const reviews = [
        makeReviewRow('1', 4, '2026-03-14T10:00:00Z'),
      ];
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.promoterCount).toBe(0);
      expect(stats.passiveCount).toBe(1);
      expect(stats.detractorCount).toBe(0);
      // NPS = (0 - 0) / 1 * 100 = 0
      expect(stats.npsScore).toBe(0);
    });

    it('computes a mixed NPS correctly', () => {
      // 3 promoters, 2 passives, 1 detractor → (3-1)/6*100 = 33
      const reviews = [
        makeReviewRow('1', 5, '2026-03-14T10:00:00Z'),
        makeReviewRow('2', 5, '2026-03-14T10:00:00Z'),
        makeReviewRow('3', 5, '2026-03-14T10:00:00Z'),
        makeReviewRow('4', 4, '2026-03-14T10:00:00Z'),
        makeReviewRow('5', 4, '2026-03-14T10:00:00Z'),
        makeReviewRow('6', 2, '2026-03-14T10:00:00Z'),
      ];
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.npsScore).toBe(33);
      expect(stats.promoterCount).toBe(3);
      expect(stats.passiveCount).toBe(2);
      expect(stats.detractorCount).toBe(1);
    });
  });

  it('handles a single review correctly', () => {
    const reviews = [makeReviewRow('1', 3, '2026-03-14T10:00:00Z')];
    const stats = computeReviewStats(reviews, [], 4, now);
    expect(stats.totalReviews).toBe(1);
    expect(stats.averageRating).toBe(3);
    expect(stats.positivePercentage).toBe(0);
    expect(stats.npsScore).toBe(-100); // single detractor
    expect(stats.detractorCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// buildDailyChartData
// ---------------------------------------------------------------------------

describe('buildDailyChartData — comprehensive', () => {
  const now = new Date('2026-03-15T12:00:00Z');

  it('returns exactly 30 entries', () => {
    const result = buildDailyChartData([], [], now);
    expect(result).toHaveLength(30);
  });

  it('returns all zeros when no reviews or requests', () => {
    const result = buildDailyChartData([], [], now);
    for (const entry of result) {
      expect(entry.reviews).toBe(0);
      expect(entry.requests).toBe(0);
    }
  });

  it('aggregates multiple reviews on the same day', () => {
    const reviews = [
      { created_at: '2026-03-15T01:00:00Z' },
      { created_at: '2026-03-15T08:00:00Z' },
      { created_at: '2026-03-15T23:59:00Z' },
    ];
    const result = buildDailyChartData(reviews, [], now);
    const lastEntry = result[result.length - 1];
    expect(lastEntry.reviews).toBe(3);
  });

  it('aggregates requests on the correct day', () => {
    const requests = [
      { created_at: '2026-03-14T10:00:00Z' },
      { created_at: '2026-03-14T15:00:00Z' },
    ];
    const result = buildDailyChartData([], requests, now);
    const secondToLast = result[result.length - 2];
    expect(secondToLast.requests).toBe(2);
  });

  it('ignores data older than 30 days', () => {
    const reviews = [{ created_at: '2026-01-01T10:00:00Z' }];
    const requests = [{ created_at: '2026-01-01T10:00:00Z' }];
    const result = buildDailyChartData(reviews, requests, now);
    const totalReviews = result.reduce((s, e) => s + e.reviews, 0);
    const totalRequests = result.reduce((s, e) => s + e.requests, 0);
    expect(totalReviews).toBe(0);
    expect(totalRequests).toBe(0);
  });

  it('places reviews and requests on separate days correctly', () => {
    const reviews = [
      { created_at: '2026-03-15T10:00:00Z' },
      { created_at: '2026-03-13T10:00:00Z' },
    ];
    const requests = [
      { created_at: '2026-03-14T10:00:00Z' },
    ];
    const result = buildDailyChartData(reviews, requests, now);

    // Today (index 29)
    expect(result[29].reviews).toBe(1);
    expect(result[29].requests).toBe(0);
    // Yesterday (index 28)
    expect(result[28].reviews).toBe(0);
    expect(result[28].requests).toBe(1);
    // Two days ago (index 27)
    expect(result[27].reviews).toBe(1);
    expect(result[27].requests).toBe(0);
  });

  it('produces date labels as formatted strings', () => {
    const result = buildDailyChartData([], [], now);
    // Each entry should have a short date label (e.g. "15 Mar")
    for (const entry of result) {
      expect(typeof entry.date).toBe('string');
      expect(entry.date.length).toBeGreaterThan(0);
    }
    // The last entry should contain "15" for March 15
    expect(result[29].date).toContain('15');
  });

  it('first entry corresponds to 29 days ago', () => {
    const result = buildDailyChartData([], [], now);
    // 29 days before March 15 = Feb 14
    expect(result[0].date).toContain('14');
  });
});

// ---------------------------------------------------------------------------
// timeAgo
// ---------------------------------------------------------------------------

describe('timeAgo — comprehensive', () => {
  const now = new Date('2026-03-15T12:00:00Z');

  it('returns "just now" for < 1 minute ago', () => {
    expect(timeAgo('2026-03-15T11:59:45Z', now)).toBe('just now');
  });

  it('returns "just now" for exactly now', () => {
    expect(timeAgo('2026-03-15T12:00:00Z', now)).toBe('just now');
  });

  it('returns "1 min ago" for exactly 1 minute', () => {
    expect(timeAgo('2026-03-15T11:59:00Z', now)).toBe('1 min ago');
  });

  it('returns "5 min ago" for 5 minutes', () => {
    expect(timeAgo('2026-03-15T11:55:00Z', now)).toBe('5 min ago');
  });

  it('returns "59 min ago" for 59 minutes', () => {
    expect(timeAgo('2026-03-15T11:01:00Z', now)).toBe('59 min ago');
  });

  it('returns "1 hr ago" for exactly 1 hour (singular)', () => {
    expect(timeAgo('2026-03-15T11:00:00Z', now)).toBe('1 hr ago');
  });

  it('returns "2 hrs ago" for 2 hours (plural)', () => {
    expect(timeAgo('2026-03-15T10:00:00Z', now)).toBe('2 hrs ago');
  });

  it('returns "23 hrs ago" at boundary', () => {
    expect(timeAgo('2026-03-14T13:00:00Z', now)).toBe('23 hrs ago');
  });

  it('returns "1 day ago" for exactly 24 hours (singular)', () => {
    expect(timeAgo('2026-03-14T12:00:00Z', now)).toBe('1 day ago');
  });

  it('returns "3 days ago" for 3 days (plural)', () => {
    expect(timeAgo('2026-03-12T12:00:00Z', now)).toBe('3 days ago');
  });

  it('returns "6 days ago" at boundary before switching to locale date', () => {
    expect(timeAgo('2026-03-09T12:00:00Z', now)).toBe('6 days ago');
  });

  it('returns locale date string for >= 7 days', () => {
    const result = timeAgo('2026-03-08T12:00:00Z', now);
    expect(result).not.toContain('ago');
    expect(result).not.toContain('just now');
  });

  it('returns locale date string for very old dates', () => {
    const result = timeAgo('2020-01-01T00:00:00Z', now);
    expect(result).not.toContain('ago');
  });
});

// ---------------------------------------------------------------------------
// maskPhone
// ---------------------------------------------------------------------------

describe('maskPhone — comprehensive', () => {
  it('masks an Australian mobile number with + prefix', () => {
    expect(maskPhone('+61412345678')).toBe('+614 *** 678');
  });

  it('masks a number without + prefix', () => {
    expect(maskPhone('0412345678')).toBe('041 *** 678');
  });

  it('masks a US number', () => {
    expect(maskPhone('+12025551234')).toBe('+120 *** 234');
  });

  it('returns original for numbers with fewer than 7 digits', () => {
    expect(maskPhone('12345')).toBe('12345');
    expect(maskPhone('+1234')).toBe('+1234');
  });

  it('handles exactly 7-digit number', () => {
    expect(maskPhone('1234567')).toBe('123 *** 567');
  });

  it('handles a number with spaces and dashes (strips non-digits for masking)', () => {
    // +61 412 345 678 → digits 61412345678 → +614 *** 678
    expect(maskPhone('+61 412 345 678')).toBe('+614 *** 678');
  });
});

// ---------------------------------------------------------------------------
// maskEmail
// ---------------------------------------------------------------------------

describe('maskEmail — comprehensive', () => {
  it('masks a standard email', () => {
    expect(maskEmail('john@example.com')).toBe('j***@example.com');
  });

  it('masks a single-char local part', () => {
    expect(maskEmail('a@test.com')).toBe('a***@test.com');
  });

  it('masks a long local part', () => {
    expect(maskEmail('verylongemail@domain.org')).toBe('v***@domain.org');
  });

  it('returns original for strings without @', () => {
    expect(maskEmail('notanemail')).toBe('notanemail');
  });

  it('returns original if @ is the first character', () => {
    expect(maskEmail('@domain.com')).toBe('@domain.com');
  });
});

// ---------------------------------------------------------------------------
// generateReviewsCsv
// ---------------------------------------------------------------------------

describe('generateReviewsCsv — comprehensive', () => {
  it('generates a header-only CSV for empty reviews', () => {
    const csv = generateReviewsCsv([]);
    expect(csv).toBe('Date,Customer Name,Rating,Sentiment,Comment,Public');
  });

  it('has exactly 6 columns in the header', () => {
    const csv = generateReviewsCsv([]);
    const cols = csv.split(',');
    expect(cols).toHaveLength(6);
  });

  it('generates correct data row for a positive review', () => {
    const reviews = [makeReview({ rating: 5, is_positive: true, is_public: true })];
    const csv = generateReviewsCsv(reviews);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('5');
    expect(lines[1]).toContain('Positive');
    expect(lines[1]).toContain('Yes');
  });

  it('generates correct data for a negative, private review', () => {
    const reviews = [makeReview({ rating: 1, is_positive: false, is_public: false })];
    const csv = generateReviewsCsv(reviews);
    const lines = csv.split('\n');
    expect(lines[1]).toContain('Negative');
    expect(lines[1]).toContain('No');
  });

  it('uses empty strings for null customer_name and comment', () => {
    const reviews = [makeReview({ customer_name: null, comment: null })];
    const csv = generateReviewsCsv(reviews);
    expect(csv).not.toContain('null');
  });

  it('escapes commas in comments', () => {
    const reviews = [makeReview({ comment: 'Good food, great service' })];
    const csv = generateReviewsCsv(reviews);
    expect(csv).toContain('"Good food, great service"');
  });

  it('escapes double quotes in comments', () => {
    const reviews = [makeReview({ comment: 'Said "wow"' })];
    const csv = generateReviewsCsv(reviews);
    expect(csv).toContain('"Said ""wow"""');
  });

  it('escapes newlines in comments', () => {
    const reviews = [makeReview({ comment: 'Line1\nLine2' })];
    const csv = generateReviewsCsv(reviews);
    expect(csv).toContain('"Line1\nLine2"');
  });

  it('formats date as dd/MM/yyyy', () => {
    const reviews = [makeReview({ created_at: '2026-03-10T10:00:00Z' })];
    const csv = generateReviewsCsv(reviews);
    // 10/03/2026 in AU date format
    expect(csv).toContain('10/03/2026');
  });

  it('generates correct number of rows for multiple reviews', () => {
    const reviews = [
      makeReview({ id: '1', customer_name: 'Alice' }),
      makeReview({ id: '2', customer_name: 'Bob' }),
      makeReview({ id: '3', customer_name: 'Charlie' }),
      makeReview({ id: '4', customer_name: 'Diana' }),
    ];
    const csv = generateReviewsCsv(reviews);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(5); // header + 4 rows
  });
});

// ---------------------------------------------------------------------------
// logActivity
// ---------------------------------------------------------------------------

describe('logActivity', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  function createMockSupabase() {
    const insertFn = vi.fn().mockResolvedValue({ error: null });
    return {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
        }),
      },
      from: vi.fn().mockReturnValue({
        insert: insertFn,
      }),
      _insertFn: insertFn,
    };
  }

  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it('inserts activity log with correct organization_id and action', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await logActivity(mockSupabase as any, {
      organizationId: 'org-1',
      action: 'review.created',
      entityType: 'review',
      entityId: 'rev-1',
      details: { rating: 5 },
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('activity_log');
    expect(mockSupabase._insertFn).toHaveBeenCalledWith({
      organization_id: 'org-1',
      user_id: 'user-123',
      action: 'review.created',
      entity_type: 'review',
      entity_id: 'rev-1',
      details: { rating: 5 },
    });
  });

  it('uses null for entity_id when not provided', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await logActivity(mockSupabase as any, {
      organizationId: 'org-1',
      action: 'sms.sent',
      entityType: 'sms_log',
    });

    expect(mockSupabase._insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_id: null,
        details: {},
      }),
    );
  });

  it('uses null user_id when auth returns no user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await logActivity(mockSupabase as any, {
      organizationId: 'org-1',
      action: 'review.submitted',
      entityType: 'review',
    });

    expect(mockSupabase._insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: null,
      }),
    );
  });

  it('calls getUser to resolve the current user', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await logActivity(mockSupabase as any, {
      organizationId: 'org-1',
      action: 'test',
      entityType: 'test',
    });

    expect(mockSupabase.auth.getUser).toHaveBeenCalledOnce();
  });

  it('passes empty object for details when not provided', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await logActivity(mockSupabase as any, {
      organizationId: 'org-1',
      action: 'settings.updated',
      entityType: 'organization',
      entityId: 'org-1',
    });

    expect(mockSupabase._insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        details: {},
      }),
    );
  });
});
