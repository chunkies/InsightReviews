'use client';

import { useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography, Stepper, Step, StepLabel,
  Alert,
} from '@mui/material';
import { ArrowRight, ArrowLeft, CreditCard } from 'lucide-react';
interface OnboardingWizardProps {
  userId: string;
}

const steps = ['Business Info', 'Review Platforms'];

function generateSlug(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 42);
  if (!base) return '';
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export function OnboardingWizard({ userId: _userId }: OnboardingWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Business info
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: Platforms
  const [googleUrl, setGoogleUrl] = useState('');
  const [yelpUrl, setYelpUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');

  async function handleComplete() {
    setLoading(true);
    setError(null);

    try {
      const slug = generateSlug(businessName);

      // Step 1: Create the organization
      const res = await fetch('/api/onboarding/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          slug,
          phone: phone || null,
          googleUrl,
          yelpUrl,
          facebookUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      // Step 2: Create Stripe Checkout session and redirect
      const checkoutRes = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: data.orgId }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok) {
        setError(checkoutData.error || 'Failed to start checkout. Please try again.');
        setLoading(false);
        return;
      }

      if (checkoutData.url) {
        window.location.href = checkoutData.url;
        return;
      }

      setError('No checkout URL returned. Please try again.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper sx={{ p: 4 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {activeStep === 0 && (
        <Box>
          <TextField
            fullWidth
            label="Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            autoFocus
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Business Phone (optional)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Button
            fullWidth
            variant="contained"
            endIcon={<ArrowRight size={18} />}
            disabled={!businessName.trim()}
            onClick={() => setActiveStep(1)}
            size="large"
          >
            Next
          </Button>
        </Box>
      )}

      {activeStep === 1 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add your review page URLs. Customers with positive reviews will be directed to these platforms.
            You can add more later in Settings.
          </Typography>
          <TextField
            fullWidth
            label="Google Business Review URL"
            value={googleUrl}
            onChange={(e) => setGoogleUrl(e.target.value)}
            placeholder="https://g.page/r/your-business/review"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Yelp Review URL (optional)"
            value={yelpUrl}
            onChange={(e) => setYelpUrl(e.target.value)}
            placeholder="https://www.yelp.com/writeareview/biz/your-business"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Facebook Review URL (optional)"
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
            placeholder="https://www.facebook.com/your-business/reviews"
            sx={{ mb: 3 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowLeft size={18} />}
              onClick={() => setActiveStep(0)}
            >
              Back
            </Button>
            <Button
              fullWidth
              variant="contained"
              endIcon={<CreditCard size={18} />}
              onClick={handleComplete}
              disabled={loading}
              size="large"
            >
              {loading ? 'Setting up...' : 'Start Free Trial'}
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block', textAlign: 'center' }}>
            You&apos;ll be redirected to enter your card details. No charge for 14 days.
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
