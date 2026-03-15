import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase before importing the route
const mockReviewSingle = vi.fn().mockReturnValue({ data: { id: 'review-1' }, error: null });
const mockReviewSelect = vi.fn().mockReturnValue({ single: mockReviewSingle });
const mockInsert = vi.fn((_data: unknown) => ({ select: mockReviewSelect, error: null }));
const mockActivityInsert = vi.fn().mockReturnValue({ error: null });
const mockSingle = vi.fn();
const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockReviewRequestSingle = vi.fn().mockResolvedValue({ data: null });
const mockReviewRequestEq = vi.fn().mockReturnValue({ single: mockReviewRequestSingle });
const mockReviewRequestSelect = vi.fn().mockReturnValue({ eq: mockReviewRequestEq });
const mockReviewRequestUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ error: null }) });

const mockOwnerMemberSingle = vi.fn().mockResolvedValue({ data: { user_id: 'owner-1' } });
const mockOwnerMemberLimit = vi.fn().mockReturnValue({ maybeSingle: mockOwnerMemberSingle });
const mockOwnerMemberEq2 = vi.fn().mockReturnValue({ limit: mockOwnerMemberLimit });
const mockOwnerMemberEq1 = vi.fn().mockReturnValue({ eq: mockOwnerMemberEq2 });
const mockOwnerMemberSelect = vi.fn().mockReturnValue({ eq: mockOwnerMemberEq1 });

const mockGetUserById = vi.fn().mockResolvedValue({ data: { user: { email: 'owner@test.com' } } });

// Rate limit mock: reviews.select('id', { count: 'exact', head: true }).eq().gte()
const mockRateLimitGte = vi.fn().mockReturnValue({ count: 0 });
const mockRateLimitEq = vi.fn().mockReturnValue({ gte: mockRateLimitGte });

let reviewCallCount = 0;
const mockFrom = vi.fn((table: string) => {
  if (table === 'organizations') {
    return { select: mockSelect };
  }
  if (table === 'organization_members') {
    return { select: mockOwnerMemberSelect };
  }
  if (table === 'activity_log') {
    return { insert: mockActivityInsert };
  }
  if (table === 'review_requests') {
    return { select: mockReviewRequestSelect, update: mockReviewRequestUpdate };
  }
  if (table === 'followup_queue') {
    return { insert: vi.fn().mockReturnValue({ error: null }) };
  }
  // reviews table — first call is rate limit, subsequent calls are insert
  reviewCallCount++;
  if (reviewCallCount % 2 === 1) {
    // Rate limit check
    return { select: vi.fn().mockReturnValue({ eq: mockRateLimitEq }) };
  }
  // Insert
  return { insert: mockInsert };
});

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    from: mockFrom,
    auth: { admin: { getUserById: mockGetUserById } },
  }),
}));

// Must import after mocks
import { POST } from '@/app/api/reviews/submit/route';
import { NextRequest } from 'next/server';

let requestCounter = 0;
function makeRequest(body: Record<string, unknown>): NextRequest {
  requestCounter++;
  return new NextRequest('http://localhost:3000/api/reviews/submit', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': `10.0.0.${requestCounter}`,
    },
  });
}

describe('POST /api/reviews/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reviewCallCount = 0;
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54421');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
  });

  it('returns 400 for missing slug', async () => {
    const res = await POST(makeRequest({ rating: 5 }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing rating', async () => {
    const res = await POST(makeRequest({ slug: 'test' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for rating out of range', async () => {
    const res = await POST(makeRequest({ slug: 'test', rating: 0 }));
    expect(res.status).toBe(400);

    const res2 = await POST(makeRequest({ slug: 'test', rating: 6 }));
    expect(res2.status).toBe(400);
  });

  it('returns 404 when org not found', async () => {
    mockSingle.mockResolvedValue({ data: null });

    const res = await POST(makeRequest({ slug: 'nonexistent', rating: 5 }));
    expect(res.status).toBe(404);
  });

  it('returns success with isPositive=true and reviewId for high rating', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'org-1', positive_threshold: 4, billing_plan: 'active', trial_ends_at: null, subscription_ends_at: null },
    });

    const res = await POST(makeRequest({
      slug: 'joes-cafe',
      rating: 5,
      comment: 'Great!',
      customerName: 'John',
    }));

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.isPositive).toBe(true);
    expect(json.reviewId).toBe('review-1');
  });

  it('returns isPositive=false for low rating', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'org-1', positive_threshold: 4, billing_plan: 'active', trial_ends_at: null, subscription_ends_at: null },
    });

    const res = await POST(makeRequest({
      slug: 'joes-cafe',
      rating: 2,
    }));

    const json = await res.json();
    expect(json.isPositive).toBe(false);
  });

  it('inserts review with correct fields', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'org-1', positive_threshold: 4, billing_plan: 'active', trial_ends_at: null, subscription_ends_at: null },
    });

    await POST(makeRequest({
      slug: 'joes-cafe',
      rating: 5,
      comment: 'Awesome',
      customerName: 'Jane',
    }));

    // First call to from('reviews'), second to from('activity_log')
    const reviewInsertCall = mockInsert.mock.calls[0][0];
    expect(reviewInsertCall).toEqual({
      organization_id: 'org-1',
      review_request_id: null,
      rating: 5,
      comment: 'Awesome',
      customer_name: 'Jane',
      customer_phone: null,
      customer_email: null,
      is_positive: true,
      is_public: true,
      redirected_to: [],
      photo_url: null,
    });
  });

  it('links review to review_request when valid rid is provided', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'org-1', positive_threshold: 4, billing_plan: 'active', trial_ends_at: null, subscription_ends_at: null },
    });
    mockReviewRequestSingle.mockResolvedValue({
      data: { id: 'req-123', organization_id: 'org-1' },
    });

    await POST(makeRequest({
      slug: 'joes-cafe',
      rating: 5,
      comment: 'Great!',
      customerName: 'Jane',
      reviewRequestId: 'req-123',
    }));

    const reviewInsertCall = mockInsert.mock.calls[0][0];
    expect(reviewInsertCall.review_request_id).toBe('req-123');

    // Should update review_request status to completed
    expect(mockReviewRequestUpdate).toHaveBeenCalledWith({ status: 'completed' });
  });

  it('ignores reviewRequestId belonging to a different org', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'org-1', positive_threshold: 4, billing_plan: 'active', trial_ends_at: null, subscription_ends_at: null },
    });
    mockReviewRequestSingle.mockResolvedValue({
      data: { id: 'req-456', organization_id: 'org-other' },
    });

    await POST(makeRequest({
      slug: 'joes-cafe',
      rating: 5,
      reviewRequestId: 'req-456',
    }));

    const reviewInsertCall = mockInsert.mock.calls[0][0];
    expect(reviewInsertCall.review_request_id).toBeNull();
  });

  it('logs activity after review insert', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'org-1', name: 'Test', slug: 'test', positive_threshold: 4, billing_plan: 'active', trial_ends_at: null, subscription_ends_at: null },
    });

    const res = await POST(makeRequest({ slug: 'test', rating: 5 }));
    expect(res.status).toBe(200);

    // activity_log insert should have been called
    const activityCalls = mockFrom.mock.calls.filter((c: [string]) => c[0] === 'activity_log');
    expect(activityCalls.length).toBeGreaterThan(0);
  });
});
