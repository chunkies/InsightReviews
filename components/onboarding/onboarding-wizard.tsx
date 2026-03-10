'use client';

import { useState, useCallback } from 'react';
import {
  Box, Paper, TextField, Button, Typography, Stepper, Step, StepLabel,
  Alert, Divider,
} from '@mui/material';
import { ArrowRight, ArrowLeft, Check, Download, Printer, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SLUG_REGEX } from '@/lib/utils/constants';
import { QRCodeDisplay, generateQRDataUrl } from '@/components/shared/qr-code';
import { LogoUpload } from '@/components/shared/logo-upload';
import { useSnackbar } from '@/components/providers/snackbar-provider';

interface OnboardingWizardProps {
  userId: string;
}

const steps = ['Business Info', 'Review Platforms', 'Your QR Code'];

export function OnboardingWizard({ userId: _userId }: OnboardingWizardProps) {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Business info
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');

  // Created org
  const [orgId, setOrgId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

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

  const reviewUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${slug}`
    : '';

  async function handleComplete() {
    setLoading(true);
    setError(null);

    try {
      if (!SLUG_REGEX.test(slug)) {
        setError('Slug can only contain lowercase letters, numbers, and hyphens');
        setLoading(false);
        return;
      }

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

      setOrgId(data.orgId);
      // Move to QR code step instead of redirecting
      setActiveStep(2);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(reviewUrl);
      showSnackbar('Link copied!', 'success');
    } catch {
      showSnackbar('Failed to copy', 'error');
    }
  }, [reviewUrl, showSnackbar]);

  const handleDownloadQR = useCallback(async () => {
    try {
      const dataUrl = await generateQRDataUrl(reviewUrl, 600);
      const link = document.createElement('a');
      link.download = `${slug}-qr-code.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      showSnackbar('Failed to generate QR code', 'error');
    }
  }, [reviewUrl, slug, showSnackbar]);

  const handlePrintCard = useCallback(async () => {
    try {
      const dataUrl = await generateQRDataUrl(reviewUrl, 400);
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Review Card — ${businessName}</title>
          <style>
            @page { size: A6 landscape; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            .card {
              width: 148mm; height: 105mm;
              border: 2px dashed #ccc;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 16mm;
              gap: 12mm;
            }
            .left { text-align: center; flex-shrink: 0; }
            .left img { width: 40mm; height: 40mm; }
            .right { text-align: left; }
            .right h1 { font-size: 16pt; margin-bottom: 4mm; color: #111; }
            .right p { font-size: 11pt; color: #555; line-height: 1.5; margin-bottom: 3mm; }
            .right .url { font-size: 8pt; color: #999; word-break: break-all; }
            @media print { .card { border: none; } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="left">
              <img src="${dataUrl}" alt="QR Code" />
            </div>
            <div class="right">
              <h1>${businessName}</h1>
              <p>We'd love your feedback!<br/>Scan this code to leave us a quick review.</p>
              <div class="url">${reviewUrl}</div>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch {
      showSnackbar('Failed to open print dialog', 'error');
    }
  }, [reviewUrl, businessName, showSnackbar]);

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

      {activeStep === 2 && (
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <Check size={32} color="white" />
          </Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            You&apos;re all set!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            Here&apos;s your review QR code. Print it and place it at your checkout counter,
            on tables, or anywhere customers can see it.
          </Typography>

          {orgId && (
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              <LogoUpload
                orgId={orgId}
                orgName={businessName}
                currentLogoUrl={logoUrl}
                onLogoChange={setLogoUrl}
                size={80}
              />
            </Box>
          )}

          <Divider sx={{ mb: 3 }} />

          <QRCodeDisplay url={reviewUrl} size={220} />

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, mb: 3 }}>
            Customers scan this to leave a review
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<Printer size={18} />}
              onClick={handlePrintCard}
              size="large"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Print Counter Card
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download size={18} />}
              onClick={handleDownloadQR}
              size="large"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Download QR Code
            </Button>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              justifyContent: 'center',
              mb: 3,
              p: 1.5,
              borderRadius: 2,
              backgroundColor: 'action.hover',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {reviewUrl}
            </Typography>
            <Button size="small" startIcon={<Copy size={14} />} onClick={handleCopyLink} sx={{ textTransform: 'none', flexShrink: 0 }}>
              Copy
            </Button>
          </Box>

          <Alert severity="info" sx={{ textAlign: 'left', mb: 3 }}>
            <strong>Tip:</strong> Place the printed card next to your register or on tables.
            Customers scan the QR code with their phone camera — no app needed.
          </Alert>

          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowRight size={18} />}
            onClick={() => router.push(`/subscribe?org=${orgId}`)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1.05rem',
              py: 1.5,
              px: 5,
            }}
          >
            Start Free Trial
          </Button>
        </Box>
      )}
    </Paper>
  );
}
