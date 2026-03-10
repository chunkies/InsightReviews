'use client';

import {
  Box, Paper, Typography, TextField, Button,
  Alert, Divider, Chip,
} from '@mui/material';
import { Copy, Star, ExternalLink, Code, QrCode, Eye, EyeOff } from 'lucide-react';
import type { Review } from '@/lib/types/database';
import { EmptyState } from '@/components/shared/empty-state';
import { useSnackbar } from '@/components/providers/snackbar-provider';

interface TestimonialManagerProps {
  reviews: Review[];
  wallUrl: string;
}

export function TestimonialManager({ reviews, wallUrl }: TestimonialManagerProps) {
  const { showSnackbar } = useSnackbar();

  const publicCount = reviews.filter((r) => r.is_public).length;
  const totalCount = reviews.length;

  const embedCode = `<iframe src="${wallUrl}" width="100%" height="600" style="border:none;border-radius:12px;" title="Customer Reviews"></iframe>`;

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    showSnackbar('Copied to clipboard!');
  }

  const publicReviews = reviews.filter((r) => r.is_public);

  return (
    <Box>
      {/* Review counts */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <Chip
          icon={<Eye size={14} />}
          label={`${publicCount} public`}
          color="success"
          variant="outlined"
        />
        <Chip
          icon={<EyeOff size={14} />}
          label={`${totalCount - publicCount} private`}
          variant="outlined"
        />
        <Chip
          label={`${totalCount} total reviews`}
          variant="outlined"
          color="default"
        />
      </Box>

      {/* Wall URL */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Your Testimonial Wall
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            value={wallUrl}
            slotProps={{ input: { readOnly: true } }}
          />
          <Button
            variant="outlined"
            startIcon={<Copy size={16} />}
            onClick={() => copyToClipboard(wallUrl)}
          >
            Copy
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExternalLink size={16} />}
            href={wallUrl}
            target="_blank"
          >
            View
          </Button>
        </Box>
        <Alert severity="info" sx={{ mt: 1 }}>
          Share this link on your website or social media. Toggle review visibility from the Reviews page.
        </Alert>
      </Paper>

      {/* Embed code */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Code size={20} />
          <Typography variant="h6">Embed on Your Website</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Copy this code and paste it into your website&apos;s HTML to display your testimonial wall.
        </Typography>
        <TextField
          fullWidth
          size="small"
          multiline
          rows={3}
          value={embedCode}
          slotProps={{
            input: {
              readOnly: true,
              sx: { fontFamily: 'monospace', fontSize: '0.8rem' },
            },
          }}
        />
        <Button
          variant="outlined"
          startIcon={<Copy size={16} />}
          onClick={() => copyToClipboard(embedCode)}
          sx={{ mt: 1.5 }}
        >
          Copy Embed Code
        </Button>
      </Paper>

      {/* QR Code hint */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <QrCode size={20} />
          <Typography variant="h6">QR Code for Your Counter</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Print a QR code that links to your testimonial wall so customers can read reviews in-store.
        </Typography>
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 1.5,
              border: '2px dashed',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <QrCode size={36} color="#94a3b8" />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Generate a free QR code at{' '}
              <Box
                component="a"
                href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(wallUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: 'primary.main', fontWeight: 600 }}
              >
                QR Server
              </Box>{' '}
              or any QR generator using your wall URL.
            </Typography>
            <Button
              variant="text"
              size="small"
              startIcon={<ExternalLink size={14} />}
              href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(wallUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Generate QR Code
            </Button>
          </Box>
        </Box>
      </Paper>

      {publicReviews.length === 0 && (
        <EmptyState
          icon={<Star size={48} />}
          title="No public testimonials yet"
          description="Mark positive reviews as public from the Reviews page to show them here."
          action={{ label: 'Go to Reviews', href: '/dashboard/reviews' }}
        />
      )}
    </Box>
  );
}
