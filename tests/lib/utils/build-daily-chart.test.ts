import { describe, it, expect } from 'vitest';
import { buildDailyChartData } from '@/lib/utils/dashboard-stats';

describe('buildDailyChartData', () => {
  const now = new Date('2026-03-10T12:00:00Z');

  it('returns 30 days of data', () => {
    const result = buildDailyChartData([], [], now);
    expect(result).toHaveLength(30);
  });

  it('returns zero counts when no data exists', () => {
    const result = buildDailyChartData([], [], now);
    for (const entry of result) {
      expect(entry.reviews).toBe(0);
      expect(entry.requests).toBe(0);
    }
  });

  it('counts reviews on the correct day', () => {
    const reviews = [
      { created_at: '2026-03-10T08:00:00Z' },
      { created_at: '2026-03-10T14:00:00Z' },
      { created_at: '2026-03-09T10:00:00Z' },
    ];
    const result = buildDailyChartData(reviews, [], now);

    // Last entry should be today (March 10) with 2 reviews
    const today = result[result.length - 1];
    expect(today.reviews).toBe(2);

    // Second to last should be March 9 with 1 review
    const yesterday = result[result.length - 2];
    expect(yesterday.reviews).toBe(1);
  });

  it('counts requests on the correct day', () => {
    const requests = [
      { created_at: '2026-03-10T09:00:00Z' },
      { created_at: '2026-03-08T09:00:00Z' },
    ];
    const result = buildDailyChartData([], requests, now);

    const today = result[result.length - 1];
    expect(today.requests).toBe(1);

    const twoDaysAgo = result[result.length - 3];
    expect(twoDaysAgo.requests).toBe(1);
  });

  it('ignores data older than 30 days', () => {
    const reviews = [
      { created_at: '2026-01-01T10:00:00Z' }, // Way outside range
    ];
    const result = buildDailyChartData(reviews, [], now);
    const total = result.reduce((sum, e) => sum + e.reviews, 0);
    expect(total).toBe(0);
  });

  it('formats dates for display', () => {
    const result = buildDailyChartData([], [], now);
    // Each entry should have a formatted date string
    for (const entry of result) {
      expect(entry.date).toBeTruthy();
      expect(typeof entry.date).toBe('string');
    }
  });
});
