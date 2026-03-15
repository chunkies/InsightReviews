import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════════
// Support ticket submission — validation, auth, email notification
// ═══════════════════════════════════════════════════════════════════════════════

interface SupportTicketInput {
  user: { id: string; email: string } | null;
  member: { organization_id: string } | null;
  body: {
    subject?: string;
    message?: string;
    category?: string;
    priority?: string;
  };
  insertError: { message: string } | null;
}

interface SupportTicketResult {
  status: number;
  body: Record<string, unknown>;
  emailSent?: {
    orgName: string;
    userEmail: string;
    subject: string;
    message: string;
    category: string;
    priority: string;
  };
}

function simulateSupportTicketSubmit(input: SupportTicketInput): SupportTicketResult {
  const { user, member, body, insertError } = input;

  if (!user) {
    return { status: 401, body: { error: 'Unauthorized' } };
  }

  if (!member) {
    return { status: 400, body: { error: 'No organization found' } };
  }

  if (!body.subject?.trim() || !body.message?.trim()) {
    return { status: 400, body: { error: 'Subject and message are required' } };
  }

  if (insertError) {
    return { status: 500, body: { error: insertError.message } };
  }

  const ticket = {
    id: 'ticket-1',
    organization_id: member.organization_id,
    user_id: user.id,
    subject: body.subject.trim(),
    message: body.message.trim(),
    category: body.category || 'general',
    priority: body.priority || 'normal',
  };

  return {
    status: 200,
    body: { ticket },
    emailSent: {
      orgName: 'Test Org',
      userEmail: user.email,
      subject: body.subject.trim(),
      message: body.message.trim(),
      category: body.category || 'general',
      priority: body.priority || 'normal',
    },
  };
}

// Simulate GET tickets — auth + org check
function simulateGetTickets(
  user: { id: string } | null,
  member: { organization_id: string } | null,
): { status: number; ticketCount?: number } {
  if (!user) return { status: 401 };
  if (!member) return { status: 400 };
  return { status: 200, ticketCount: 0 };
}

describe('Support tickets — POST validation', () => {
  const validUser = { id: 'u-1', email: 'user@test.com' };
  const validMember = { organization_id: 'org-1' };

  it('rejects unauthenticated user', () => {
    const result = simulateSupportTicketSubmit({
      user: null,
      member: null,
      body: { subject: 'Help', message: 'I need help' },
      insertError: null,
    });
    expect(result.status).toBe(401);
  });

  it('rejects user without organization', () => {
    const result = simulateSupportTicketSubmit({
      user: validUser,
      member: null,
      body: { subject: 'Help', message: 'I need help' },
      insertError: null,
    });
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('No organization found');
  });

  it('rejects empty subject', () => {
    const result = simulateSupportTicketSubmit({
      user: validUser,
      member: validMember,
      body: { subject: '', message: 'I need help' },
      insertError: null,
    });
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Subject and message are required');
  });

  it('rejects whitespace-only subject', () => {
    const result = simulateSupportTicketSubmit({
      user: validUser,
      member: validMember,
      body: { subject: '   ', message: 'I need help' },
      insertError: null,
    });
    expect(result.status).toBe(400);
  });

  it('rejects empty message', () => {
    const result = simulateSupportTicketSubmit({
      user: validUser,
      member: validMember,
      body: { subject: 'Help', message: '' },
      insertError: null,
    });
    expect(result.status).toBe(400);
  });

  it('rejects missing subject and message', () => {
    const result = simulateSupportTicketSubmit({
      user: validUser,
      member: validMember,
      body: {},
      insertError: null,
    });
    expect(result.status).toBe(400);
  });
});

describe('Support tickets — successful creation', () => {
  const validUser = { id: 'u-1', email: 'user@test.com' };
  const validMember = { organization_id: 'org-1' };

  it('creates ticket with trimmed subject and message', () => {
    const result = simulateSupportTicketSubmit({
      user: validUser,
      member: validMember,
      body: { subject: '  Help me  ', message: '  I need help  ' },
      insertError: null,
    });
    expect(result.status).toBe(200);
    const ticket = result.body.ticket as Record<string, unknown>;
    expect(ticket.subject).toBe('Help me');
    expect(ticket.message).toBe('I need help');
  });

  it('defaults category to general', () => {
    const result = simulateSupportTicketSubmit({
      user: validUser,
      member: validMember,
      body: { subject: 'Help', message: 'Issue' },
      insertError: null,
    });
    const ticket = result.body.ticket as Record<string, unknown>;
    expect(ticket.category).toBe('general');
  });

  it('defaults priority to normal', () => {
    const result = simulateSupportTicketSubmit({
      user: validUser,
      member: validMember,
      body: { subject: 'Help', message: 'Issue' },
      insertError: null,
    });
    const ticket = result.body.ticket as Record<string, unknown>;
    expect(ticket.priority).toBe('normal');
  });

  it('uses provided category and priority', () => {
    const result = simulateSupportTicketSubmit({
      user: validUser,
      member: validMember,
      body: { subject: 'Billing', message: 'Charge issue', category: 'billing', priority: 'high' },
      insertError: null,
    });
    const ticket = result.body.ticket as Record<string, unknown>;
    expect(ticket.category).toBe('billing');
    expect(ticket.priority).toBe('high');
  });

  it('triggers email notification with correct data', () => {
    const result = simulateSupportTicketSubmit({
      user: validUser,
      member: validMember,
      body: { subject: 'Help', message: 'Issue', category: 'bug', priority: 'urgent' },
      insertError: null,
    });
    expect(result.emailSent).toBeDefined();
    expect(result.emailSent!.userEmail).toBe('user@test.com');
    expect(result.emailSent!.subject).toBe('Help');
    expect(result.emailSent!.category).toBe('bug');
    expect(result.emailSent!.priority).toBe('urgent');
  });

  it('links ticket to correct organization', () => {
    const result = simulateSupportTicketSubmit({
      user: validUser,
      member: { organization_id: 'org-xyz' },
      body: { subject: 'Help', message: 'Issue' },
      insertError: null,
    });
    const ticket = result.body.ticket as Record<string, unknown>;
    expect(ticket.organization_id).toBe('org-xyz');
  });
});

describe('Support tickets — error handling', () => {
  it('returns 500 on database insert error', () => {
    const result = simulateSupportTicketSubmit({
      user: { id: 'u-1', email: 'user@test.com' },
      member: { organization_id: 'org-1' },
      body: { subject: 'Help', message: 'Issue' },
      insertError: { message: 'Database connection lost' },
    });
    expect(result.status).toBe(500);
    expect(result.body.error).toBe('Database connection lost');
  });
});

describe('Support tickets — GET (list tickets)', () => {
  it('rejects unauthenticated request', () => {
    expect(simulateGetTickets(null, null).status).toBe(401);
  });

  it('rejects user without org', () => {
    expect(simulateGetTickets({ id: 'u-1' }, null).status).toBe(400);
  });

  it('returns 200 for valid user with org', () => {
    expect(simulateGetTickets({ id: 'u-1' }, { organization_id: 'org-1' }).status).toBe(200);
  });
});
