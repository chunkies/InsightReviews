import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.hoisted(() => {
  process.env.SENDGRID_API_KEY = 'test-sg-key';
  return vi.fn();
});

vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: vi.fn(),
    send: mockSend,
  },
}));

import { sendFollowupEmail, sendNegativeReviewNotification } from '@/lib/email/client';

describe('sendFollowupEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue([{ statusCode: 202 }]);
  });

  it('calls SendGrid with correct follow-up params', async () => {
    await sendFollowupEmail({
      to: 'customer@example.com',
      businessName: 'Test Cafe',
      message: 'Sorry about your experience. We want to make it right.',
      customerName: 'Mike',
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'customer@example.com',
        subject: expect.stringContaining('Test Cafe'),
      }),
    );

    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.html).toContain('Hi Mike,');
    expect(callArg.html).toContain('Sorry about your experience');
    expect(callArg.text).toContain('Mike');
  });

  it('returns true on success', async () => {
    const result = await sendFollowupEmail({
      to: 'a@b.com',
      businessName: 'Biz',
      message: 'Test',
      customerName: 'Test',
    });
    expect(result).toBe(true);
  });

  it('returns false on failure', async () => {
    mockSend.mockRejectedValue({ response: { body: 'error' } });
    const result = await sendFollowupEmail({
      to: 'a@b.com',
      businessName: 'Biz',
      message: 'Test',
      customerName: 'Test',
    });
    expect(result).toBe(false);
  });
});

describe('sendNegativeReviewNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue([{ statusCode: 202 }]);
  });

  it('sends notification with correct subject and content', async () => {
    await sendNegativeReviewNotification({
      to: 'owner@cafe.com',
      businessName: 'Test Cafe',
      rating: 2,
      comment: 'Bad service',
      customerName: 'Angry Customer',
      dashboardUrl: 'https://app.com/dashboard/reviews',
    });

    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.to).toBe('owner@cafe.com');
    expect(callArg.subject).toContain('2 star');
    expect(callArg.subject).toContain('Test Cafe');
    expect(callArg.html).toContain('Angry Customer');
    expect(callArg.html).toContain('Bad service');
    expect(callArg.html).toContain('https://app.com/dashboard/reviews');
  });

  it('handles singular star correctly', async () => {
    await sendNegativeReviewNotification({
      to: 'owner@cafe.com',
      businessName: 'Cafe',
      rating: 1,
      comment: null,
      customerName: null,
      dashboardUrl: 'https://app.com/dashboard',
    });

    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.subject).toContain('1 star)');
    expect(callArg.html).toContain('A customer');
  });

  it('returns true on success', async () => {
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

  it('returns false on failure', async () => {
    mockSend.mockRejectedValue({ response: { body: 'error' } });
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
