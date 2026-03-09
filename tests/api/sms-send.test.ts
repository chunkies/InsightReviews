import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks for dependencies — must use vi.hoisted to avoid hoisting issues
const mocks = vi.hoisted(() => {
  const mockMemberSingle = vi.fn();
  const mockOrgSingle = vi.fn();
  const mockInsertSelect = vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: { id: 'req-1' }, error: null }),
  });
  const mockInsert = vi.fn().mockReturnValue({ select: mockInsertSelect });
  const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn() });

  const mockFrom = vi.fn((table: string) => {
    if (table === 'organization_members') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockMemberSingle,
            }),
          }),
        }),
      };
    }
    if (table === 'organizations') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockOrgSingle,
          }),
        }),
      };
    }
    if (table === 'review_requests') {
      return { insert: mockInsert, update: mockUpdate };
    }
    return { insert: vi.fn().mockReturnValue({ error: null }) };
  });

  return {
    mockFrom,
    mockMemberSingle,
    mockOrgSingle,
    mockInsert,
    sendSms: vi.fn().mockResolvedValue('SM123'),
    buildReviewLink: vi.fn().mockReturnValue('https://app.com/r/test'),
    buildSmsBody: vi.fn().mockReturnValue('Review link: https://app.com/r/test'),
    sendReviewEmail: vi.fn().mockResolvedValue(true),
    logActivity: vi.fn(),
  };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      }),
    },
    from: mocks.mockFrom,
  }),
}));

vi.mock('@/lib/twilio/client', () => ({
  sendSms: mocks.sendSms,
  buildReviewLink: mocks.buildReviewLink,
  buildSmsBody: mocks.buildSmsBody,
}));

vi.mock('@/lib/email/client', () => ({
  sendReviewEmail: mocks.sendReviewEmail,
}));

vi.mock('@/lib/utils/activity-logger', () => ({
  logActivity: mocks.logActivity,
}));

import { POST } from '@/app/api/sms/send/route';

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/sms/send', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/sms/send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://app.com');

    mocks.mockMemberSingle.mockResolvedValue({ data: { id: 'member-1' } });
    mocks.mockOrgSingle.mockResolvedValue({
      data: { name: 'Test Biz', slug: 'test', sms_template: 'Review: {link}' },
    });
    mocks.sendSms.mockResolvedValue('SM123');
    mocks.sendReviewEmail.mockResolvedValue(true);
  });

  it('returns 400 when no phone or email provided', async () => {
    const res = await POST(makeRequest({ organizationId: 'org-1' }));
    expect(res.status).toBe(400);
  });

  it('returns 403 when user is not a member', async () => {
    mocks.mockMemberSingle.mockResolvedValue({ data: null });

    const res = await POST(makeRequest({
      organizationId: 'org-1',
      customerPhone: '+1234567890',
    }));
    expect(res.status).toBe(403);
  });

  it('returns 404 when org not found', async () => {
    mocks.mockOrgSingle.mockResolvedValue({ data: null });

    const res = await POST(makeRequest({
      organizationId: 'org-1',
      customerPhone: '+1234567890',
    }));
    expect(res.status).toBe(404);
  });

  it('sends SMS when contactMethod is sms', async () => {
    const res = await POST(makeRequest({
      organizationId: 'org-1',
      customerPhone: '+1234567890',
      contactMethod: 'sms',
    }));

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mocks.sendSms).toHaveBeenCalledWith('+1234567890', expect.any(String));
  });

  it('sends email when contactMethod is email', async () => {
    const res = await POST(makeRequest({
      organizationId: 'org-1',
      customerEmail: 'test@example.com',
      contactMethod: 'email',
    }));

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mocks.sendReviewEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        businessName: 'Test Biz',
      }),
    );
  });

  it('defaults to sms when contactMethod not specified', async () => {
    await POST(makeRequest({
      organizationId: 'org-1',
      customerPhone: '+1234567890',
    }));

    expect(mocks.sendSms).toHaveBeenCalled();
  });

  it('logs activity on success', async () => {
    await POST(makeRequest({
      organizationId: 'org-1',
      customerPhone: '+1234567890',
    }));

    expect(mocks.logActivity).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: 'review_request_sent',
        entityType: 'review_request',
      }),
    );
  });
});
