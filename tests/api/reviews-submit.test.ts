import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase before importing the route
const mockInsert = vi.fn().mockReturnValue({ error: null });
const mockSingle = vi.fn();
const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn((table: string) => {
  if (table === 'organizations') {
    return { select: mockSelect };
  }
  return { insert: mockInsert };
});

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    from: mockFrom,
  }),
}));

// Must import after mocks
import { POST } from '@/app/api/reviews/submit/route';
import { NextRequest } from 'next/server';

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/reviews/submit', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/reviews/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('returns success and isPositive=true for high rating', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'org-1', positive_threshold: 4 },
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
  });

  it('returns isPositive=false for low rating', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'org-1', positive_threshold: 4 },
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
      data: { id: 'org-1', positive_threshold: 4 },
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
      rating: 5,
      comment: 'Awesome',
      customer_name: 'Jane',
      is_positive: true,
      is_public: true,
      redirected_to: [],
    });
  });

  it('logs activity after review insert', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'org-1', positive_threshold: 4 },
    });

    await POST(makeRequest({ slug: 'test', rating: 5 }));

    // activity_log insert should have been called
    const activityCalls = mockFrom.mock.calls.filter(c => c[0] === 'activity_log');
    expect(activityCalls.length).toBeGreaterThan(0);
  });
});
