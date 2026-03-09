import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendReviewEmail } from '@/lib/email/client';

describe('sendReviewEmail', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54421');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn());
  });

  it('calls edge function with correct params', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    await sendReviewEmail({
      to: 'test@example.com',
      businessName: 'Test Biz',
      reviewLink: 'https://app.com/r/test',
      customerName: 'John',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://127.0.0.1:54421/functions/v1/send-email',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-key',
        }),
      }),
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.to).toBe('test@example.com');
    expect(body.subject).toContain('Test Biz');
    expect(body.html).toContain('Hi John,');
    expect(body.html).toContain('https://app.com/r/test');
    expect(body.text).toContain('Test Biz');
  });

  it('uses generic greeting when no customer name', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    await sendReviewEmail({
      to: 'test@example.com',
      businessName: 'Salon',
      reviewLink: 'https://app.com/r/salon',
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.html).toContain('Hi there,');
  });

  it('returns true when edge function succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    const result = await sendReviewEmail({
      to: 'a@b.com',
      businessName: 'B',
      reviewLink: 'https://x.com/r/b',
    });
    expect(result).toBe(true);
  });

  it('returns true in development when edge function fails', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const result = await sendReviewEmail({
      to: 'a@b.com',
      businessName: 'B',
      reviewLink: 'https://x.com/r/b',
    });
    expect(result).toBe(true);
  });

  it('returns true in development when fetch throws', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await sendReviewEmail({
      to: 'a@b.com',
      businessName: 'B',
      reviewLink: 'https://x.com/r/b',
    });
    expect(result).toBe(true);
  });

  it('returns false in production when edge function fails', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const result = await sendReviewEmail({
      to: 'a@b.com',
      businessName: 'B',
      reviewLink: 'https://x.com/r/b',
    });
    expect(result).toBe(false);
  });
});
