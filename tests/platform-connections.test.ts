import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════════
// Review platform connections — integration flow, role checks, data mapping
// ═══════════════════════════════════════════════════════════════════════════════

type Role = 'owner' | 'staff';
type Platform = 'google' | 'facebook' | 'yelp';

// Simulate: can user connect/disconnect platforms?
function canConnect(role: Role): boolean {
  return role === 'owner';
}

function canDisconnect(role: Role): boolean {
  return role === 'owner';
}

function canToggleReviewForm(role: Role): boolean {
  return role === 'owner';
}

// Simulate: OAuth state encoding (Google/Facebook)
function encodeOAuthState(orgId: string, redirectPath: string): string {
  return Buffer.from(JSON.stringify({ orgId, redirect: redirectPath })).toString('base64');
}

function decodeOAuthState(state: string): { orgId: string; redirect: string } {
  return JSON.parse(Buffer.from(state, 'base64').toString());
}

// Simulate: platform connection validation
interface ConnectInput {
  user: { id: string } | null;
  member: { organization_id: string; role: Role } | null;
  billingValid: boolean;
  platform: Platform;
}

function simulateConnectValidation(input: ConnectInput): { status: number; error?: string } {
  if (!input.user) return { status: 401, error: 'Unauthorized' };
  if (!input.member) return { status: 403, error: 'No organization' };
  if (input.member.role !== 'owner') return { status: 403, error: 'Only owners can connect integrations' };
  if (!input.billingValid) return { status: 403, error: 'Active billing required' };
  return { status: 200 };
}

// Simulate: disconnect removes integration and cascades external reviews
function simulateDisconnect(
  role: Role,
  integrationExists: boolean,
): { status: number; deleted: boolean } {
  if (role !== 'owner') return { status: 403, deleted: false };
  if (!integrationExists) return { status: 404, deleted: false };
  return { status: 200, deleted: true };
}

// Simulate: toggle show_on_review_form
function simulateToggle(
  role: Role,
  currentValue: boolean,
): { status: number; newValue: boolean } {
  if (role !== 'owner') return { status: 403, newValue: currentValue };
  return { status: 200, newValue: !currentValue };
}

// Simulate: onboarding manual platform insertion
interface ManualPlatformInput {
  platform: string;
  url: string | undefined;
}

function filterValidPlatforms(platforms: ManualPlatformInput[]): Array<{ platform: string; url: string; display_order: number }> {
  return platforms
    .filter((p): p is { platform: string; url: string } => !!p.url?.trim())
    .map((p, i) => ({
      platform: p.platform,
      url: p.url.trim(),
      display_order: i,
    }));
}

describe('Platform connections — role enforcement', () => {
  it('owner can connect', () => {
    expect(canConnect('owner')).toBe(true);
  });
  it('staff cannot connect', () => {
    expect(canConnect('staff')).toBe(false);
  });
  it('owner can disconnect', () => {
    expect(canDisconnect('owner')).toBe(true);
  });
  it('staff cannot disconnect', () => {
    expect(canDisconnect('staff')).toBe(false);
  });
  it('owner can toggle review form visibility', () => {
    expect(canToggleReviewForm('owner')).toBe(true);
  });
  it('staff cannot toggle review form visibility', () => {
    expect(canToggleReviewForm('staff')).toBe(false);
  });
});

describe('Platform connections — connect validation', () => {
  it('rejects unauthenticated user', () => {
    const result = simulateConnectValidation({ user: null, member: null, billingValid: true, platform: 'google' });
    expect(result.status).toBe(401);
  });

  it('rejects user without org', () => {
    const result = simulateConnectValidation({ user: { id: 'u-1' }, member: null, billingValid: true, platform: 'google' });
    expect(result.status).toBe(403);
  });

  it('rejects staff member', () => {
    const result = simulateConnectValidation({
      user: { id: 'u-1' },
      member: { organization_id: 'org-1', role: 'staff' },
      billingValid: true,
      platform: 'google',
    });
    expect(result.status).toBe(403);
    expect(result.error).toContain('owners');
  });

  it('rejects when billing is invalid', () => {
    const result = simulateConnectValidation({
      user: { id: 'u-1' },
      member: { organization_id: 'org-1', role: 'owner' },
      billingValid: false,
      platform: 'facebook',
    });
    expect(result.status).toBe(403);
    expect(result.error).toContain('billing');
  });

  it('allows owner with valid billing', () => {
    const result = simulateConnectValidation({
      user: { id: 'u-1' },
      member: { organization_id: 'org-1', role: 'owner' },
      billingValid: true,
      platform: 'yelp',
    });
    expect(result.status).toBe(200);
  });
});

describe('Platform connections — OAuth state encoding', () => {
  it('encodes and decodes org ID correctly', () => {
    const state = encodeOAuthState('org-123', '/dashboard/integrations');
    const decoded = decodeOAuthState(state);
    expect(decoded.orgId).toBe('org-123');
    expect(decoded.redirect).toBe('/dashboard/integrations');
  });

  it('handles special characters in org ID', () => {
    const state = encodeOAuthState('org-abc-def-123', '/settings');
    const decoded = decodeOAuthState(state);
    expect(decoded.orgId).toBe('org-abc-def-123');
  });
});

describe('Platform connections — disconnect', () => {
  it('owner can disconnect existing integration', () => {
    const result = simulateDisconnect('owner', true);
    expect(result.status).toBe(200);
    expect(result.deleted).toBe(true);
  });

  it('returns 404 for non-existent integration', () => {
    const result = simulateDisconnect('owner', false);
    expect(result.status).toBe(404);
  });

  it('staff cannot disconnect', () => {
    const result = simulateDisconnect('staff', true);
    expect(result.status).toBe(403);
    expect(result.deleted).toBe(false);
  });
});

describe('Platform connections — toggle review form visibility', () => {
  it('toggles true to false', () => {
    const result = simulateToggle('owner', true);
    expect(result.newValue).toBe(false);
  });

  it('toggles false to true', () => {
    const result = simulateToggle('owner', false);
    expect(result.newValue).toBe(true);
  });

  it('staff toggle is rejected, value unchanged', () => {
    const result = simulateToggle('staff', true);
    expect(result.status).toBe(403);
    expect(result.newValue).toBe(true); // unchanged
  });
});

describe('Platform connections — manual platform setup (onboarding)', () => {
  it('filters out empty URLs', () => {
    const result = filterValidPlatforms([
      { platform: 'google', url: 'https://google.com/review/abc' },
      { platform: 'yelp', url: '' },
      { platform: 'facebook', url: undefined },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].platform).toBe('google');
  });

  it('filters out whitespace-only URLs', () => {
    const result = filterValidPlatforms([
      { platform: 'google', url: '   ' },
    ]);
    expect(result).toHaveLength(0);
  });

  it('trims URLs', () => {
    const result = filterValidPlatforms([
      { platform: 'google', url: '  https://google.com/review  ' },
    ]);
    expect(result[0].url).toBe('https://google.com/review');
  });

  it('assigns correct display_order', () => {
    const result = filterValidPlatforms([
      { platform: 'google', url: 'https://google.com' },
      { platform: 'yelp', url: 'https://yelp.com' },
      { platform: 'facebook', url: 'https://facebook.com' },
    ]);
    expect(result[0].display_order).toBe(0);
    expect(result[1].display_order).toBe(1);
    expect(result[2].display_order).toBe(2);
  });

  it('reindexes display_order after filtering', () => {
    const result = filterValidPlatforms([
      { platform: 'google', url: '' },
      { platform: 'yelp', url: 'https://yelp.com' },
      { platform: 'facebook', url: 'https://facebook.com' },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].display_order).toBe(0); // yelp
    expect(result[1].display_order).toBe(1); // facebook
  });
});
