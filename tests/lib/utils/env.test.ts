import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { env, envRequired } from '@/lib/utils/env';

describe('env()', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns the value when set normally', () => {
    process.env.TEST_VAR = 'hello';
    expect(env('TEST_VAR')).toBe('hello');
  });

  it('strips trailing newline (\\n)', () => {
    process.env.TEST_VAR = 'sk_test_abc123\n';
    expect(env('TEST_VAR')).toBe('sk_test_abc123');
  });

  it('strips trailing carriage return + newline (\\r\\n)', () => {
    process.env.TEST_VAR = 'sk_test_abc123\r\n';
    expect(env('TEST_VAR')).toBe('sk_test_abc123');
  });

  it('strips multiple trailing newlines', () => {
    process.env.TEST_VAR = 'value\n\n\n';
    expect(env('TEST_VAR')).toBe('value');
  });

  it('strips trailing spaces and tabs', () => {
    process.env.TEST_VAR = 'value   \t';
    expect(env('TEST_VAR')).toBe('value');
  });

  it('strips trailing whitespace + newline combo', () => {
    process.env.TEST_VAR = 'G-ZWXFZ80KN2\n';
    expect(env('TEST_VAR')).toBe('G-ZWXFZ80KN2');
  });

  it('does not strip leading whitespace', () => {
    process.env.TEST_VAR = '  value';
    expect(env('TEST_VAR')).toBe('  value');
  });

  it('returns empty string for missing var', () => {
    expect(env('NONEXISTENT_VAR')).toBe('');
  });

  it('returns empty string for undefined', () => {
    delete process.env.TEST_VAR;
    expect(env('TEST_VAR')).toBe('');
  });

  it('preserves internal newlines', () => {
    process.env.TEST_VAR = 'line1\nline2';
    expect(env('TEST_VAR')).toBe('line1\nline2');
  });

  it('handles JWT tokens with trailing newline', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.abc123';
    process.env.SUPABASE_SERVICE_ROLE_KEY = jwt + '\n';
    expect(env('SUPABASE_SERVICE_ROLE_KEY')).toBe(jwt);
  });

  it('handles URLs with trailing newline', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co\n';
    expect(env('NEXT_PUBLIC_SUPABASE_URL')).toBe('https://example.supabase.co');
  });

  it('handles Stripe webhook secret with trailing newline', () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_abc123def456\n';
    expect(env('STRIPE_WEBHOOK_SECRET')).toBe('whsec_abc123def456');
  });
});

describe('envRequired()', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns the trimmed value when set', () => {
    process.env.TEST_VAR = 'hello\n';
    expect(envRequired('TEST_VAR')).toBe('hello');
  });

  it('throws when var is missing', () => {
    expect(() => envRequired('NONEXISTENT_VAR')).toThrow(
      'Missing required environment variable: NONEXISTENT_VAR'
    );
  });

  it('throws when var is empty string', () => {
    process.env.TEST_VAR = '';
    expect(() => envRequired('TEST_VAR')).toThrow(
      'Missing required environment variable: TEST_VAR'
    );
  });

  it('throws when var is only whitespace/newlines', () => {
    process.env.TEST_VAR = '\n\n  \t\n';
    expect(() => envRequired('TEST_VAR')).toThrow(
      'Missing required environment variable: TEST_VAR'
    );
  });
});

describe('env var sanitization prevents real-world bugs', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('Supabase URL with trailing newline would break API calls', () => {
    // This is the exact bug that broke production auth
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co\n';
    const url = env('NEXT_PUBLIC_SUPABASE_URL');
    expect(url).not.toContain('\n');
    expect(url.endsWith('.co')).toBe(true);
  });

  it('API key with trailing newline would be rejected by Supabase', () => {
    // Supabase returns "Invalid API key" if the key has trailing whitespace
    const key = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.ZopqoUt20nEV9cklpv9e3yw3PVyZLmKs5qLD6nGL1SI';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = key + '\n';
    expect(env('NEXT_PUBLIC_SUPABASE_ANON_KEY')).toBe(key);
  });

  it('Stripe webhook secret with trailing newline would fail signature verification', () => {
    // Stripe constructEvent throws "No signatures found" if secret has \n
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_placeholder_secret_value\n';
    expect(env('STRIPE_WEBHOOK_SECRET')).toBe('whsec_test_placeholder_secret_value');
  });

  it('GA4 Measurement ID with trailing newline would produce invalid JavaScript', () => {
    // Template: gtag("config","G-XXX\n") — the \n makes the JS string invalid
    process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID = 'G-ZWXFZ80KN2\n';
    const id = env('NEXT_PUBLIC_GA4_MEASUREMENT_ID');
    expect(id).toBe('G-ZWXFZ80KN2');
    // Verify it's safe to embed in a JS string
    expect(() => JSON.parse(`"${id}"`)).not.toThrow();
  });
});
