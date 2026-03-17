import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════════
// Login form — unit tests for OTP logic & UI state
// ═══════════════════════════════════════════════════════════════════════════════

// Simulate the login form's handleSubmit logic
interface OtpCallResult {
  error: { message: string } | null;
}

interface LoginFormState {
  email: string;
  loading: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
}

function simulateHandleSubmit(
  email: string,
  otpResult: OtpCallResult,
  origin: string = 'https://insightreviews.com.au',
): { state: LoginFormState; otpCalledWith: { email: string; options: { emailRedirectTo: string } } } {
  const otpCalledWith = {
    email,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  };

  let message: LoginFormState['message'] = null;

  if (otpResult.error) {
    message = { type: 'error', text: otpResult.error.message };
  } else {
    message = { type: 'success', text: 'Check your email for the login link!' };
  }

  return {
    state: { email, loading: false, message },
    otpCalledWith,
  };
}

// Simulate button disabled logic
function isSubmitDisabled(loading: boolean, email: string): boolean {
  return loading || !email;
}

// Simulate button text logic
function getButtonText(loading: boolean, isSignup: boolean): string {
  if (loading) return 'Sending...';
  return isSignup ? 'Create Account' : 'Send Magic Link';
}

describe('Login form — OTP submission logic', () => {
  describe('successful OTP request', () => {
    it('shows success message when OTP sends successfully', () => {
      const result = simulateHandleSubmit('user@example.com', { error: null });
      expect(result.state.message).toEqual({
        type: 'success',
        text: 'Check your email for the login link!',
      });
    });

    it('passes correct email to signInWithOtp', () => {
      const result = simulateHandleSubmit('test@business.com', { error: null });
      expect(result.otpCalledWith.email).toBe('test@business.com');
    });

    it('sets emailRedirectTo to /auth/confirm on production', () => {
      const result = simulateHandleSubmit('user@example.com', { error: null }, 'https://insightreviews.com.au');
      expect(result.otpCalledWith.options.emailRedirectTo).toBe('https://insightreviews.com.au/auth/confirm');
    });

    it('sets emailRedirectTo to /auth/confirm on localhost', () => {
      const result = simulateHandleSubmit('user@example.com', { error: null }, 'http://localhost:3000');
      expect(result.otpCalledWith.options.emailRedirectTo).toBe('http://localhost:3000/auth/confirm');
    });

    it('is no longer loading after submission', () => {
      const result = simulateHandleSubmit('user@example.com', { error: null });
      expect(result.state.loading).toBe(false);
    });
  });

  describe('failed OTP request', () => {
    it('shows error message when OTP fails', () => {
      const result = simulateHandleSubmit('user@example.com', {
        error: { message: 'Email rate limit exceeded' },
      });
      expect(result.state.message).toEqual({
        type: 'error',
        text: 'Email rate limit exceeded',
      });
    });

    it('shows Supabase error message verbatim', () => {
      const result = simulateHandleSubmit('bad@email', {
        error: { message: 'Unable to validate email address: invalid format' },
      });
      expect(result.state.message?.text).toBe('Unable to validate email address: invalid format');
    });

    it('sets error type on failure', () => {
      const result = simulateHandleSubmit('user@example.com', {
        error: { message: 'Some error' },
      });
      expect(result.state.message?.type).toBe('error');
    });
  });
});

describe('Login form — button state', () => {
  describe('submit button disabled logic', () => {
    it('disabled when email is empty string', () => {
      expect(isSubmitDisabled(false, '')).toBe(true);
    });

    it('disabled when loading is true', () => {
      expect(isSubmitDisabled(true, 'user@example.com')).toBe(true);
    });

    it('disabled when both loading and empty email', () => {
      expect(isSubmitDisabled(true, '')).toBe(true);
    });

    it('enabled when not loading and email is provided', () => {
      expect(isSubmitDisabled(false, 'user@example.com')).toBe(false);
    });

    it('enabled with any non-empty email string', () => {
      expect(isSubmitDisabled(false, 'a')).toBe(false);
    });
  });

  describe('button text logic', () => {
    it('shows "Send Magic Link" for sign-in mode', () => {
      expect(getButtonText(false, false)).toBe('Send Magic Link');
    });

    it('shows "Create Account" for sign-up mode', () => {
      expect(getButtonText(false, true)).toBe('Create Account');
    });

    it('shows "Sending..." when loading regardless of mode', () => {
      expect(getButtonText(true, false)).toBe('Sending...');
      expect(getButtonText(true, true)).toBe('Sending...');
    });
  });
});

describe('Login form — link navigation', () => {
  // Simulate the link href logic
  function getToggleLink(isSignup: boolean): { href: string; text: string } {
    if (isSignup) {
      return { href: '/auth/login', text: 'Sign in' };
    }
    return { href: '/auth/login?mode=signup', text: 'Create an account' };
  }

  it('sign-in mode links to signup', () => {
    const link = getToggleLink(false);
    expect(link.href).toBe('/auth/login?mode=signup');
    expect(link.text).toBe('Create an account');
  });

  it('sign-up mode links to sign-in', () => {
    const link = getToggleLink(true);
    expect(link.href).toBe('/auth/login');
    expect(link.text).toBe('Sign in');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Login form — full_name metadata in OTP data
// ═══════════════════════════════════════════════════════════════════════════════

// Simulate the OTP data logic from login-form.tsx
function getOtpData(fullName: string): { full_name: string } | undefined {
  return fullName.trim() ? { full_name: fullName.trim() } : undefined;
}

describe('Login form — full_name in OTP data', () => {
  it('includes full_name in data when provided in signup mode', () => {
    expect(getOtpData('Jane Doe')).toEqual({ full_name: 'Jane Doe' });
  });

  it('trims whitespace from full_name', () => {
    expect(getOtpData('  Jane Doe  ')).toEqual({ full_name: 'Jane Doe' });
  });

  it('returns undefined data when full_name is empty', () => {
    expect(getOtpData('')).toBeUndefined();
  });

  it('returns undefined data when full_name is only whitespace', () => {
    expect(getOtpData('   ')).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Onboarding wizard — name pre-fill from user metadata
// ═══════════════════════════════════════════════════════════════════════════════

describe('Onboarding wizard — initialName pre-fill', () => {
  // Simulate the logic from onboarding/page.tsx that extracts initialName
  function getInitialName(userMetadata: Record<string, string> | undefined): string {
    return userMetadata?.full_name ?? '';
  }

  it('returns full_name from user metadata when present', () => {
    expect(getInitialName({ full_name: 'Jane Doe' })).toBe('Jane Doe');
  });

  it('returns empty string when user metadata is undefined', () => {
    expect(getInitialName(undefined)).toBe('');
  });

  it('returns empty string when full_name is not in metadata', () => {
    expect(getInitialName({ some_other_key: 'value' })).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Onboarding API — full_name backfill to user metadata
// ═══════════════════════════════════════════════════════════════════════════════

describe('Onboarding API — full_name metadata backfill', () => {
  // Simulate the backfill logic from api/onboarding/create/route.ts
  function shouldBackfillName(ownerName: string | null, userMetadata: Record<string, string> | undefined): boolean {
    return !!(ownerName && !userMetadata?.full_name);
  }

  it('should backfill when ownerName provided and no existing full_name', () => {
    expect(shouldBackfillName('Jane Doe', undefined)).toBe(true);
    expect(shouldBackfillName('Jane Doe', {})).toBe(true);
  });

  it('should not backfill when full_name already exists in metadata', () => {
    expect(shouldBackfillName('Jane Doe', { full_name: 'Existing Name' })).toBe(false);
  });

  it('should not backfill when ownerName is null or empty', () => {
    expect(shouldBackfillName(null, undefined)).toBe(false);
    expect(shouldBackfillName('', undefined)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Onboarding API — display_name resolution
// ═══════════════════════════════════════════════════════════════════════════════

describe('Onboarding API — display_name resolution', () => {
  // Simulate: display_name: ownerName || user.user_metadata?.full_name || null
  function resolveDisplayName(ownerName: string | null, userMetadata: Record<string, string> | undefined): string | null {
    return ownerName || userMetadata?.full_name || null;
  }

  it('prefers ownerName from onboarding form', () => {
    expect(resolveDisplayName('Form Name', { full_name: 'Metadata Name' })).toBe('Form Name');
  });

  it('falls back to user_metadata.full_name when ownerName is empty', () => {
    expect(resolveDisplayName('', { full_name: 'Metadata Name' })).toBe('Metadata Name');
  });

  it('falls back to user_metadata.full_name when ownerName is null', () => {
    expect(resolveDisplayName(null, { full_name: 'Metadata Name' })).toBe('Metadata Name');
  });

  it('returns null when neither ownerName nor metadata available', () => {
    expect(resolveDisplayName(null, undefined)).toBeNull();
    expect(resolveDisplayName('', {})).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Auth confirm — additional tests for PKCE callback
// ═══════════════════════════════════════════════════════════════════════════════

describe('Auth confirm — emailRedirectTo configuration', () => {
  // The auth confirm route expects the callback URL to be /auth/confirm
  // This test ensures the login form and confirm route are aligned

  it('login form redirect URL matches auth confirm route path', () => {
    const origins = [
      'https://insightreviews.com.au',
      'http://localhost:3000',
      'https://preview-abc.vercel.app',
    ];

    for (const origin of origins) {
      const result = simulateHandleSubmit('user@example.com', { error: null }, origin);
      const redirectUrl = new URL(result.otpCalledWith.options.emailRedirectTo);
      expect(redirectUrl.pathname).toBe('/auth/confirm');
    }
  });

  it('redirect URL uses the same origin as the page', () => {
    const result = simulateHandleSubmit('user@example.com', { error: null }, 'https://custom-domain.com');
    expect(result.otpCalledWith.options.emailRedirectTo.startsWith('https://custom-domain.com')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Middleware matcher — static asset exclusions
// ═══════════════════════════════════════════════════════════════════════════════

describe('Middleware matcher — static assets excluded', () => {
  // The middleware config matcher pattern:
  // '/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|leave-behind\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  const matcherRegex = /^\/((?!_next\/static|_next\/image|favicon\.ico|sitemap\.xml|robots\.txt|leave-behind\.html|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)$/;

  function matchesMiddleware(path: string): boolean {
    return matcherRegex.test(path);
  }

  it('excludes _next/static assets', () => {
    expect(matchesMiddleware('/_next/static/chunks/main.js')).toBe(false);
  });

  it('excludes _next/image assets', () => {
    expect(matchesMiddleware('/_next/image?url=foo')).toBe(false);
  });

  it('excludes favicon.ico', () => {
    expect(matchesMiddleware('/favicon.ico')).toBe(false);
  });

  it('excludes sitemap.xml', () => {
    expect(matchesMiddleware('/sitemap.xml')).toBe(false);
  });

  it('excludes robots.txt', () => {
    expect(matchesMiddleware('/robots.txt')).toBe(false);
  });

  it('excludes image files (.png, .jpg, .svg, .webp)', () => {
    expect(matchesMiddleware('/logo.png')).toBe(false);
    expect(matchesMiddleware('/photo.jpg')).toBe(false);
    expect(matchesMiddleware('/icon.svg')).toBe(false);
    expect(matchesMiddleware('/hero.webp')).toBe(false);
  });

  it('includes normal page routes', () => {
    expect(matchesMiddleware('/dashboard')).toBe(true);
    expect(matchesMiddleware('/auth/login')).toBe(true);
    expect(matchesMiddleware('/r/my-business')).toBe(true);
    expect(matchesMiddleware('/')).toBe(true);
  });

  it('includes API routes', () => {
    expect(matchesMiddleware('/api/reviews/submit')).toBe(true);
    expect(matchesMiddleware('/api/stripe/webhook')).toBe(true);
  });
});
