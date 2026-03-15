import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════════
// QR code source tracking — URL params, review storage, dashboard breakdown
// ═══════════════════════════════════════════════════════════════════════════════

// Simulate: QR URL includes ?src=qr
function buildQrUrl(baseUrl: string): string {
  return `${baseUrl}?src=qr`;
}

// Simulate: source determination from URL params
function determineSource(srcParam: string | undefined, reviewRequestId: string | undefined): string {
  if (srcParam) return srcParam;
  if (reviewRequestId) return 'sms';
  return 'direct';
}

// Simulate: source validation on API side
function validateSource(source: unknown): 'qr' | 'sms' | 'direct' {
  if (source === 'qr' || source === 'sms' || source === 'direct') return source;
  return 'direct';
}

// Simulate: funnel source breakdown
interface ReviewWithSource {
  id: string;
  review_request_id: string | null;
  source: 'qr' | 'sms' | 'direct';
}

function computeSourceBreakdown(reviews: ReviewWithSource[]) {
  const smsReviews = reviews.filter(r => r.review_request_id !== null);
  const walkInReviews = reviews.filter(r => r.review_request_id === null);
  const qrReviews = reviews.filter(r => r.source === 'qr');
  const directReviews = walkInReviews.length - qrReviews.length;

  return {
    sms: smsReviews.length,
    qr: qrReviews.length,
    direct: Math.max(0, directReviews),
    total: reviews.length,
  };
}

describe('QR source tracking — URL construction', () => {
  it('appends ?src=qr to review URL', () => {
    const url = buildQrUrl('https://insightreviews.com.au/r/hello');
    expect(url).toBe('https://insightreviews.com.au/r/hello?src=qr');
  });

  it('works with localhost', () => {
    const url = buildQrUrl('http://localhost:3000/r/my-biz');
    expect(url).toBe('http://localhost:3000/r/my-biz?src=qr');
  });

  it('QR URL is different from base review URL', () => {
    const base = 'https://insightreviews.com.au/r/hello';
    const qr = buildQrUrl(base);
    expect(qr).not.toBe(base);
    expect(qr).toContain(base);
  });
});

describe('QR source tracking — source determination', () => {
  it('src=qr param → qr source', () => {
    expect(determineSource('qr', undefined)).toBe('qr');
  });

  it('no src param + reviewRequestId → sms source', () => {
    expect(determineSource(undefined, 'req-123')).toBe('sms');
  });

  it('no src param + no reviewRequestId → direct source', () => {
    expect(determineSource(undefined, undefined)).toBe('direct');
  });

  it('src param takes precedence over reviewRequestId', () => {
    expect(determineSource('qr', 'req-123')).toBe('qr');
  });
});

describe('QR source tracking — validation', () => {
  it('accepts qr', () => {
    expect(validateSource('qr')).toBe('qr');
  });

  it('accepts sms', () => {
    expect(validateSource('sms')).toBe('sms');
  });

  it('accepts direct', () => {
    expect(validateSource('direct')).toBe('direct');
  });

  it('defaults invalid source to direct', () => {
    expect(validateSource('hacked')).toBe('direct');
    expect(validateSource('')).toBe('direct');
    expect(validateSource(undefined)).toBe('direct');
    expect(validateSource(null)).toBe('direct');
    expect(validateSource(123)).toBe('direct');
  });
});

describe('QR source tracking — dashboard breakdown', () => {
  const reviews: ReviewWithSource[] = [
    { id: '1', review_request_id: 'req-1', source: 'sms' },
    { id: '2', review_request_id: 'req-2', source: 'sms' },
    { id: '3', review_request_id: null, source: 'qr' },
    { id: '4', review_request_id: null, source: 'qr' },
    { id: '5', review_request_id: null, source: 'qr' },
    { id: '6', review_request_id: null, source: 'direct' },
  ];

  it('counts SMS reviews correctly', () => {
    const breakdown = computeSourceBreakdown(reviews);
    expect(breakdown.sms).toBe(2);
  });

  it('counts QR reviews correctly', () => {
    const breakdown = computeSourceBreakdown(reviews);
    expect(breakdown.qr).toBe(3);
  });

  it('counts direct reviews correctly', () => {
    const breakdown = computeSourceBreakdown(reviews);
    expect(breakdown.direct).toBe(1);
  });

  it('total equals sum of all sources', () => {
    const breakdown = computeSourceBreakdown(reviews);
    expect(breakdown.total).toBe(6);
  });

  it('handles empty reviews', () => {
    const breakdown = computeSourceBreakdown([]);
    expect(breakdown.sms).toBe(0);
    expect(breakdown.qr).toBe(0);
    expect(breakdown.direct).toBe(0);
    expect(breakdown.total).toBe(0);
  });

  it('handles all QR reviews', () => {
    const allQr: ReviewWithSource[] = [
      { id: '1', review_request_id: null, source: 'qr' },
      { id: '2', review_request_id: null, source: 'qr' },
    ];
    const breakdown = computeSourceBreakdown(allQr);
    expect(breakdown.qr).toBe(2);
    expect(breakdown.sms).toBe(0);
    expect(breakdown.direct).toBe(0);
  });

  it('handles all SMS reviews', () => {
    const allSms: ReviewWithSource[] = [
      { id: '1', review_request_id: 'req-1', source: 'sms' },
      { id: '2', review_request_id: 'req-2', source: 'sms' },
    ];
    const breakdown = computeSourceBreakdown(allSms);
    expect(breakdown.sms).toBe(2);
    expect(breakdown.qr).toBe(0);
    expect(breakdown.direct).toBe(0);
  });
});
