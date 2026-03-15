import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Google OAuth credentials validation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset module cache so getCredentials picks up new env vars
    process.env.NEXT_PUBLIC_SITE_URL = 'https://insightreviews.com.au';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('throws when GOOGLE_CLIENT_ID is missing', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    // Dynamic import to pick up fresh env
    const { getCredentials } = await import('@/lib/integrations/google');
    expect(() => getCredentials()).toThrow('Google OAuth not configured');
  });

  it('throws when GOOGLE_CLIENT_SECRET is missing', async () => {
    process.env.GOOGLE_CLIENT_ID = 'some-client-id';
    delete process.env.GOOGLE_CLIENT_SECRET;

    const { getCredentials } = await import('@/lib/integrations/google');
    expect(() => getCredentials()).toThrow('Google OAuth not configured');
  });

  it('throws when NEXT_PUBLIC_SITE_URL is missing', async () => {
    process.env.GOOGLE_CLIENT_ID = 'some-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'some-secret';
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const { getCredentials } = await import('@/lib/integrations/google');
    expect(() => getCredentials()).toThrow('NEXT_PUBLIC_SITE_URL must be set');
  });

  it('returns credentials when all env vars are set', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://insightreviews.com.au';

    const { getCredentials } = await import('@/lib/integrations/google');
    const creds = getCredentials();

    expect(creds.clientId).toBe('test-client-id');
    expect(creds.clientSecret).toBe('test-client-secret');
    expect(creds.redirectUri).toBe('https://insightreviews.com.au/api/integrations/google/callback');
  });

  it('trims whitespace from NEXT_PUBLIC_SITE_URL', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.NEXT_PUBLIC_SITE_URL = '  https://insightreviews.com.au  ';

    const { getCredentials } = await import('@/lib/integrations/google');
    const creds = getCredentials();

    expect(creds.redirectUri).toBe('https://insightreviews.com.au/api/integrations/google/callback');
  });

  it('getGoogleAuthUrl includes client_id in the URL', async () => {
    process.env.GOOGLE_CLIENT_ID = 'my-test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'my-test-secret';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://insightreviews.com.au';

    const { getGoogleAuthUrl } = await import('@/lib/integrations/google');
    const url = getGoogleAuthUrl('test-state');

    expect(url).toContain('client_id=my-test-client-id');
    expect(url).toContain('redirect_uri=');
    expect(url).toContain('insightreviews.com.au');
    expect(url).toContain('state=test-state');
    expect(url).toContain('accounts.google.com');
  });

  it('getGoogleAuthUrl throws when credentials are missing', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    const { getGoogleAuthUrl } = await import('@/lib/integrations/google');
    expect(() => getGoogleAuthUrl('test-state')).toThrow('Google OAuth not configured');
  });
});
