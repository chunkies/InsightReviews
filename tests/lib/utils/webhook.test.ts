import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireWebhook } from '@/lib/utils/webhook';

describe('fireWebhook', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('sends POST request with correct headers and JSON body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    const payload = { event: 'review.created', rating: 5 };
    await fireWebhook('https://example.com/hook', payload);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/hook',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'User-Agent': 'InsightReviews-Webhook/1.0',
        }),
        body: JSON.stringify(payload),
      }),
    );
  });

  it('returns true on successful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    const result = await fireWebhook('https://example.com/hook', { test: true });
    expect(result).toBe(true);
  });

  it('returns false on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' }),
    );
    const result = await fireWebhook('https://example.com/hook', { test: true });
    expect(result).toBe(false);
  });

  it('returns false when fetch throws a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const result = await fireWebhook('https://example.com/hook', { test: true });
    expect(result).toBe(false);
  });

  it('returns false on abort/timeout', async () => {
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));
    const result = await fireWebhook('https://example.com/hook', { test: true });
    expect(result).toBe(false);
  });

  it('uses AbortController with signal', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    await fireWebhook('https://example.com/hook', {});

    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.signal).toBeInstanceOf(AbortSignal);
  });
});
