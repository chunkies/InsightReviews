import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.hoisted(() => {
  // Set env before module loads so the top-level const captures it
  process.env.SENDGRID_API_KEY = 'test-sg-key';
  return vi.fn();
});

vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: vi.fn(),
    send: mockSend,
  },
}));

import { sendReviewEmail } from '@/lib/email/client';

describe('sendReviewEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue([{ statusCode: 202 }]);
  });

  it('calls SendGrid with correct params', async () => {
    await sendReviewEmail({
      to: 'test@example.com',
      businessName: 'Test Biz',
      reviewLink: 'https://app.com/r/test',
      customerName: 'John',
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: expect.stringContaining('Test Biz'),
      }),
    );

    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.html).toContain('Hi John,');
    expect(callArg.html).toContain('https://app.com/r/test');
    expect(callArg.text).toContain('Test Biz');
  });

  it('uses generic greeting when no customer name', async () => {
    await sendReviewEmail({
      to: 'test@example.com',
      businessName: 'Salon',
      reviewLink: 'https://app.com/r/salon',
    });

    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.html).toContain('Hi there,');
  });

  it('returns true when SendGrid succeeds', async () => {
    const result = await sendReviewEmail({
      to: 'a@b.com',
      businessName: 'B',
      reviewLink: 'https://x.com/r/b',
    });
    expect(result).toBe(true);
  });

  it('returns false when SendGrid throws an error', async () => {
    mockSend.mockRejectedValue({ response: { body: 'Unauthorized' } });

    const result = await sendReviewEmail({
      to: 'a@b.com',
      businessName: 'B',
      reviewLink: 'https://x.com/r/b',
    });
    expect(result).toBe(false);
  });
});
