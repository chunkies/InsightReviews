'use client';

import { Box, Typography, Button } from '@mui/material';
import { AlertTriangle } from 'lucide-react';

export default function ReviewFormError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('Review form error:', error);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 2,
        p: 4,
        textAlign: 'center',
      }}
    >
      <AlertTriangle size={48} color="#f44336" />
      <Typography variant="h5" fontWeight={600}>
        Something went wrong
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480 }}>
        We couldn&apos;t load the review form. Please try again or use the link from your SMS.
      </Typography>
      <Button variant="contained" onClick={reset} sx={{ mt: 1 }}>
        Try Again
      </Button>
    </Box>
  );
}
