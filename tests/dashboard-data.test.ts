import { describe, it, expect } from 'vitest';
import { computeReviewStats, buildDailyChartData, timeAgo, maskPhone, maskEmail } from '@/lib/utils/dashboard-stats';

// ═══════════════════════════════════════════════════════════════════════════════
// Dashboard data — stats accuracy, chart correctness, utility functions
// ═══════════════════════════════════════════════════════════════════════════════

const now = new Date('2026-03-15T12:00:00Z');
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

function makeReview(rating: number, daysBack: number) {
  return { id: `r-${rating}-${daysBack}`, rating, created_at: daysAgo(daysBack) };
}

function makeRequest(status: string) {
  return { id: `req-${status}-${Math.random()}`, status };
}

describe('Dashboard stats — computeReviewStats accuracy', () => {
  describe('average rating', () => {
    it('computes correct average for mixed ratings', () => {
      const reviews = [makeReview(5, 1), makeReview(3, 2), makeReview(4, 3)];
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.averageRating).toBe(4); // (5+3+4)/3 = 4.0
    });

    it('rounds to 1 decimal place', () => {
      const reviews = [makeReview(5, 1), makeReview(4, 2), makeReview(4, 3)];
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.averageRating).toBe(4.3); // (5+4+4)/3 = 4.333 → 4.3
    });

    it('returns 0 for no reviews', () => {
      const stats = computeReviewStats([], [], 4, now);
      expect(stats.averageRating).toBe(0);
    });

    it('handles single review', () => {
      const stats = computeReviewStats([makeReview(3, 1)], [], 4, now);
      expect(stats.averageRating).toBe(3);
    });
  });

  describe('positive percentage', () => {
    it('counts reviews at or above threshold as positive', () => {
      const reviews = [
        makeReview(5, 1), makeReview(4, 2), // positive (>=4)
        makeReview(3, 3), makeReview(2, 4), // negative (<4)
      ];
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.positivePercentage).toBe(50); // 2/4 = 50%
    });

    it('100% when all reviews are positive', () => {
      const reviews = [makeReview(5, 1), makeReview(5, 2), makeReview(4, 3)];
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.positivePercentage).toBe(100);
    });

    it('0% when all reviews are negative', () => {
      const reviews = [makeReview(1, 1), makeReview(2, 2), makeReview(3, 3)];
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.positivePercentage).toBe(0);
    });

    it('0% for empty reviews', () => {
      const stats = computeReviewStats([], [], 4, now);
      expect(stats.positivePercentage).toBe(0);
    });

    it('threshold 3 counts 3-star as positive', () => {
      const reviews = [makeReview(3, 1), makeReview(2, 2)];
      const stats = computeReviewStats(reviews, [], 3, now);
      expect(stats.positivePercentage).toBe(50);
    });
  });

  describe('response rate', () => {
    it('computes rate from completed requests', () => {
      const requests = [
        makeRequest('completed'), makeRequest('completed'),
        makeRequest('sent'), makeRequest('failed'),
      ];
      const stats = computeReviewStats([], requests, 4, now);
      expect(stats.responseRate).toBe(50); // 2/4 = 50%
    });

    it('0% when no requests are completed', () => {
      const requests = [makeRequest('sent'), makeRequest('sent')];
      const stats = computeReviewStats([], requests, 4, now);
      expect(stats.responseRate).toBe(0);
    });

    it('100% when all requests completed', () => {
      const requests = [makeRequest('completed'), makeRequest('completed')];
      const stats = computeReviewStats([], requests, 4, now);
      expect(stats.responseRate).toBe(100);
    });

    it('0% for empty requests', () => {
      const stats = computeReviewStats([], [], 4, now);
      expect(stats.responseRate).toBe(0);
    });
  });

  describe('week-over-week trends', () => {
    it('counts this week reviews (last 7 days)', () => {
      const reviews = [
        makeReview(5, 1), makeReview(4, 3), makeReview(3, 6), // this week
        makeReview(5, 8), // last week
        makeReview(5, 20), // older
      ];
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.thisWeekReviews).toBe(3);
    });

    it('counts last week reviews (8-14 days ago)', () => {
      const reviews = [
        makeReview(5, 1), // this week
        makeReview(4, 8), makeReview(3, 10), makeReview(2, 13), // last week
        makeReview(5, 20), // older
      ];
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.lastWeekReviews).toBe(3);
    });

    it('handles no reviews in either week', () => {
      const reviews = [makeReview(5, 20)]; // older than 2 weeks
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.thisWeekReviews).toBe(0);
      expect(stats.lastWeekReviews).toBe(0);
    });
  });

  describe('NPS score', () => {
    it('all 5-star = NPS 100', () => {
      const reviews = [makeReview(5, 1), makeReview(5, 2), makeReview(5, 3)];
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.npsScore).toBe(100);
    });

    it('all 1-star = NPS -100', () => {
      const reviews = [makeReview(1, 1), makeReview(1, 2), makeReview(1, 3)];
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.npsScore).toBe(-100);
    });

    it('mixed: 2 promoters, 1 detractor, 1 passive = NPS 25', () => {
      const reviews = [
        makeReview(5, 1), makeReview(5, 2), // promoters
        makeReview(4, 3), // passive
        makeReview(2, 4), // detractor
      ];
      const stats = computeReviewStats(reviews, [], 4, now);
      // (2 - 1) / 4 * 100 = 25
      expect(stats.npsScore).toBe(25);
    });

    it('null for no reviews', () => {
      const stats = computeReviewStats([], [], 4, now);
      expect(stats.npsScore).toBeNull();
    });

    it('counts correctly: 5=promoter, 4=passive, 1-3=detractor', () => {
      const reviews = [
        makeReview(5, 1), // promoter
        makeReview(4, 2), // passive
        makeReview(3, 3), // detractor
        makeReview(2, 4), // detractor
        makeReview(1, 5), // detractor
      ];
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.promoterCount).toBe(1);
      expect(stats.passiveCount).toBe(1);
      expect(stats.detractorCount).toBe(3);
      // (1 - 3) / 5 * 100 = -40
      expect(stats.npsScore).toBe(-40);
    });
  });

  describe('total counts', () => {
    it('totalReviews matches input length', () => {
      const reviews = [makeReview(5, 1), makeReview(3, 2)];
      const stats = computeReviewStats(reviews, [], 4, now);
      expect(stats.totalReviews).toBe(2);
    });

    it('totalRequests matches input length', () => {
      const requests = [makeRequest('sent'), makeRequest('completed'), makeRequest('failed')];
      const stats = computeReviewStats([], requests, 4, now);
      expect(stats.totalRequests).toBe(3);
    });
  });
});

describe('Dashboard stats — buildDailyChartData', () => {
  it('generates exactly 30 days of data', () => {
    const data = buildDailyChartData([], [], now);
    expect(data).toHaveLength(30);
  });

  it('counts reviews on correct day', () => {
    const reviews = [
      { created_at: now.toISOString() }, // today
      { created_at: now.toISOString() }, // today
    ];
    const data = buildDailyChartData(reviews, [], now);
    const today = data[data.length - 1];
    expect(today.reviews).toBe(2);
  });

  it('counts requests on correct day', () => {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const requests = [{ created_at: yesterday }];
    const data = buildDailyChartData([], requests, now);
    const yesterdayEntry = data[data.length - 2];
    expect(yesterdayEntry.requests).toBe(1);
  });

  it('ignores reviews older than 30 days', () => {
    const oldReview = { created_at: daysAgo(31) };
    const data = buildDailyChartData([oldReview], [], now);
    const totalReviews = data.reduce((sum, d) => sum + d.reviews, 0);
    expect(totalReviews).toBe(0);
  });

  it('all days default to 0 reviews and 0 requests', () => {
    const data = buildDailyChartData([], [], now);
    for (const day of data) {
      expect(day.reviews).toBe(0);
      expect(day.requests).toBe(0);
    }
  });
});

describe('Dashboard stats — timeAgo', () => {
  it('just now for < 1 minute', () => {
    const recent = new Date(now.getTime() - 30 * 1000).toISOString();
    expect(timeAgo(recent, now)).toBe('just now');
  });

  it('minutes ago', () => {
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinAgo, now)).toBe('5 min ago');
  });

  it('hours ago (singular)', () => {
    const oneHrAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    expect(timeAgo(oneHrAgo, now)).toBe('1 hr ago');
  });

  it('hours ago (plural)', () => {
    const threeHrsAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(threeHrsAgo, now)).toBe('3 hrs ago');
  });

  it('days ago (singular)', () => {
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(oneDayAgo, now)).toBe('1 day ago');
  });

  it('days ago (plural)', () => {
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(threeDaysAgo, now)).toBe('3 days ago');
  });

  it('falls back to locale date for > 7 days', () => {
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const result = timeAgo(twoWeeksAgo, now);
    // Should be a formatted date, not "X days ago"
    expect(result).not.toContain('ago');
  });
});

describe('Dashboard stats — maskPhone', () => {
  it('masks Australian mobile', () => {
    expect(maskPhone('+61412345678')).toBe('+614 *** 678');
  });

  it('masks US number', () => {
    expect(maskPhone('+12025551234')).toBe('+120 *** 234');
  });

  it('returns original for short numbers', () => {
    expect(maskPhone('12345')).toBe('12345');
  });

  it('handles number without + prefix', () => {
    expect(maskPhone('0412345678')).toBe('041 *** 678');
  });
});

describe('Dashboard stats — maskEmail', () => {
  it('masks standard email', () => {
    expect(maskEmail('john@example.com')).toBe('j***@example.com');
  });

  it('masks single char local part', () => {
    expect(maskEmail('a@test.com')).toBe('a***@test.com');
  });

  it('returns original for no @ symbol', () => {
    expect(maskEmail('noemail')).toBe('noemail');
  });

  it('returns original for @ at start', () => {
    expect(maskEmail('@domain.com')).toBe('@domain.com');
  });
});
