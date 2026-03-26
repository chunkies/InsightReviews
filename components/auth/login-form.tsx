'use client';

import { useState } from 'react';
import {
  Button, TextField, Alert, Paper, Typography, Link as MuiLink,
  Box, Divider,
} from '@mui/material';
import { createClient } from '@/lib/supabase/client';
import NextLink from 'next/link';
import { buildAuthRedirectUrl } from '@/lib/utils/auth-redirect';
type AuthMethod = 'password' | 'magic-link';

/* ── SVG icons for OAuth providers ── */

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function LoginForm({ isSignup = false }: { isSignup?: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');

  async function handleGoogleLogin() {
    setOauthLoading('google');
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: buildAuthRedirectUrl(window.location.origin),
        queryParams: { prompt: 'select_account' },
      },
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
      setOauthLoading(null);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();

    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: buildAuthRedirectUrl(window.location.origin),
          data: fullName.trim() ? { full_name: fullName.trim() } : undefined,
        },
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        // Supabase auto-signs in when email confirmations are disabled
        window.location.href = '/onboarding';
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          setMessage({ type: 'error', text: 'Wrong email or password. Try again or use a magic link.' });
        } else {
          setMessage({ type: 'error', text: error.message });
        }
      } else {
        window.location.href = '/dashboard';
        return;
      }
    }

    setLoading(false);
  }

  async function handleMagicLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: buildAuthRedirectUrl(window.location.origin),
        data: fullName.trim() ? { full_name: fullName.trim() } : undefined,
      },
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Check your email for the login link!' });
    }

    setLoading(false);
  }

  const handleSubmit = authMethod === 'password' ? handlePasswordSubmit : handleMagicLinkSubmit;
  const anyLoading = loading || !!oauthLoading;

  const oauthButtonSx = {
    py: 1.3,
    borderColor: 'divider',
    color: 'text.primary',
    fontWeight: 600,
    textTransform: 'none' as const,
    fontSize: '0.9rem',
    '&:hover': { borderColor: 'text.secondary', backgroundColor: 'action.hover' },
  };

  return (
    <Paper sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 400 }}>
      {/* Google OAuth */}
      <Button
        fullWidth
        variant="outlined"
        size="large"
        onClick={handleGoogleLogin}
        disabled={anyLoading}
        sx={oauthButtonSx}
      >
        <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}><GoogleIcon /></Box>
        {oauthLoading === 'google' ? 'Redirecting...' : 'Continue with Google'}
      </Button>

      <Divider sx={{ my: 2.5, fontSize: '0.8rem', color: 'text.secondary' }}>or</Divider>

      {/* Email form */}
      <form onSubmit={handleSubmit}>
        {isSignup && (
          <TextField
            fullWidth
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoFocus
            sx={{ mb: 2 }}
          />
        )}
        <TextField
          fullWidth
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus={!isSignup}
          sx={{ mb: 2 }}
        />
        {authMethod === 'password' && (
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            inputProps={{ minLength: 6 }}
            helperText={isSignup ? 'At least 6 characters' : undefined}
            sx={{ mb: 2 }}
          />
        )}

        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={anyLoading || !email || (authMethod === 'password' && !password)}
          sx={{ py: 1.3, fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' }}
        >
          {loading
            ? 'Please wait...'
            : authMethod === 'magic-link'
              ? 'Send Magic Link'
              : isSignup
                ? 'Create Account'
                : 'Sign In'
          }
        </Button>

        {isSignup && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1.5, lineHeight: 1.6 }}>
            No credit card required. $49/mo founding member rate after your 14-day trial. Cancel anytime.
          </Typography>
        )}
      </form>

      {/* Toggle between password and magic link */}
      <Box sx={{ textAlign: 'center', mt: 1.5 }}>
        <MuiLink
          component="button"
          variant="body2"
          color="text.secondary"
          onClick={() => {
            setAuthMethod(authMethod === 'password' ? 'magic-link' : 'password');
            setMessage(null);
          }}
          sx={{ cursor: 'pointer', fontSize: '0.8rem' }}
        >
          {authMethod === 'password' ? 'Use magic link instead' : 'Use password instead'}
        </MuiLink>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
        {isSignup ? (
          <>Already have an account?{' '}<MuiLink component={NextLink} href="/auth/login">Sign in</MuiLink></>
        ) : (
          <>New to InsightReviews?{' '}<MuiLink component={NextLink} href="/auth/login?mode=signup">Create an account</MuiLink></>
        )}
      </Typography>
    </Paper>
  );
}
