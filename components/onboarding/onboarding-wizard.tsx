'use client';

import { useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography, Stepper, Step, StepLabel,
  Alert,
} from '@mui/material';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { SLUG_REGEX } from '@/lib/utils/constants';

interface OnboardingWizardProps {
  userId: string;
}

const steps = ['Business Info', 'Review Platforms', 'Done'];

export function OnboardingWizard({ userId }: OnboardingWizardProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Business info
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: Platforms
  const [googleUrl, setGoogleUrl] = useState('');
  const [yelpUrl, setYelpUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);
  }

  function handleNameChange(name: string) {
    setBusinessName(name);
    if (!slug || slug === generateSlug(businessName)) {
      setSlug(generateSlug(name));
    }
  }

  async function handleComplete() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Validate slug
      if (!SLUG_REGEX.test(slug)) {
        setError('Slug can only contain lowercase letters, numbers, and hyphens');
        setLoading(false);
        return;
      }

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: businessName,
          slug,
          phone: phone || null,
        })
        .select('id')
        .single();

      if (orgError) {
        if (orgError.message.includes('duplicate') || orgError.message.includes('unique')) {
          setError('This slug is already taken. Please choose a different one.');
        } else {
          setError(orgError.message);
        }
        setLoading(false);
        return;
      }

      // Add user as owner
      await supabase.from('organization_members').insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
      });

      // Add platforms
      const platforms = [
        { platform: 'google', url: googleUrl },
        { platform: 'yelp', url: yelpUrl },
        { platform: 'facebook', url: facebookUrl },
      ].filter((p) => p.url.trim());

      if (platforms.length > 0) {
        await supabase.from('review_platforms').insert(
          platforms.map((p, i) => ({
            organization_id: org.id,
            platform: p.platform,
            url: p.url.trim(),
            display_order: i,
          }))
        );
      }

      router.push('/dashboard');
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
            onChange={(e) => handleNameChange(e.target.value)}
            required
            autoFocus
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="URL Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            helperText={slug ? `Your review link: insightreviews.com/r/${slug}` : 'Auto-generated from business name'}
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
            disabled={!businessName || !slug}
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
              endIcon={<Check size={18} />}
              onClick={handleComplete}
              disabled={loading}
              size="large"
            >
              {loading ? 'Creating...' : 'Complete Setup'}
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
