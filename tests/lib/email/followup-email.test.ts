import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendFollowupEmail, sendNegativeReviewNotification } from '@/lib/email/client';

describe('sendFollowupEmail', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54421');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn());
  });

  it('calls edge function with correct follow-up params', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    await sendFollowupEmail({
      to: 'customer@example.com',
      businessName: 'Test Cafe',
      message: 'Sorry about your experience. We want to make it right.',
      customerName: 'Mike',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://127.0.0.1:54421/functions/v1/send-email',
      expect.objectContaining({ method: 'POST' }),
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.to).toBe('customer@example.com');
    expect(body.subject).toContain('Test Cafe');
    expect(body.html).toContain('Hi Mike,');
    expect(body.html).toContain('Sorry about your experience');
    expect(body.text).toContain('Mike');
  });

  it('returns true on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    const result = await sendFollowupEmail({
      to: 'a@b.com',
      businessName: 'Biz',
      message: 'Test',
      customerName: 'Test',
    });
    expect(result).toBe(true);
  });

  it('returns false in production on failure', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const result = await sendFollowupEmail({
      to: 'a@b.com',
      businessName: 'Biz',
      message: 'Test',
      customerName: 'Test',
    });
    expect(result).toBe(false);
  });

  it('returns true in development even on failure', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const result = await sendFollowupEmail({
      to: 'a@b.com',
      businessName: 'Biz',
      message: 'Test',
      customerName: 'Test',
    });
    expect(result).toBe(true);
  });
});

describe('sendNegativeReviewNotification', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54421');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn());
  });

  it('sends notification with correct subject and content', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    await sendNegativeReviewNotification({
      to: 'owner@cafe.com',
      businessName: 'Test Cafe',
      rating: 2,
      comment: 'Bad service',
      customerName: 'Angry Customer',
      dashboardUrl: 'https://app.com/dashboard/reviews',
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.to).toBe('owner@cafe.com');
    expect(body.subject).toContain('2 star');
    expect(body.subject).toContain('Test Cafe');
    expect(body.html).toContain('Angry Customer');
    expect(body.html).toContain('Bad service');
    expect(body.html).toContain('https://app.com/dashboard/reviews');
  });

  it('handles singular star correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    await sendNegativeReviewNotification({
      to: 'owner@cafe.com',
      businessName: 'Cafe',
      rating: 1,
      comment: null,
      customerName: null,
      dashboardUrl: 'https://app.com/dashboard',
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.subject).toContain('1 star)');
    expect(body.html).toContain('A customer');
  });

  it('returns true on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    const result = await sendNegativeReviewNotification({
      to: 'a@b.com',
      businessName: 'B',
      rating: 1,
      comment: null,
      customerName: null,
      dashboardUrl: 'https://x.com',
    });
    expect(result).toBe(true);
  });

  it('returns false in production on failure', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const result = await sendNegativeReviewNotification({
      to: 'a@b.com',
      businessName: 'B',
      rating: 1,
      comment: null,
      customerName: null,
      dashboardUrl: 'https://x.com',
    });
    expect(result).toBe(false);
  });
});
