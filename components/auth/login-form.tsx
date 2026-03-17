'use client';

import { useState } from 'react';
import { Button, TextField, Alert, Paper, Typography, Link as MuiLink } from '@mui/material';
import { createClient } from '@/lib/supabase/client';
import NextLink from 'next/link';

export function LoginForm({ isSignup = false }: { isSignup?: boolean }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
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

  return (
    <Paper sx={{ p: 4, width: '100%', maxWidth: 400 }}>
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
          disabled={loading || !email}
        >
          {loading ? 'Sending...' : isSignup ? 'Create Account' : 'Send Magic Link'}
        </Button>
      </form>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
        {isSignup ? (
          <>Already have an account?{' '}<MuiLink component={NextLink} href="/auth/login">Sign in</MuiLink></>
        ) : (
          <>New to InsightReviews?{' '}<MuiLink component={NextLink} href="/auth/login?mode=signup">Create an account</MuiLink></>
        )}
      </Typography>
    </Paper>
  );
}
