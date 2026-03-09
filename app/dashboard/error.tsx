'use client';

import { Box, Typography, Button } from '@mui/material';
import { AlertTriangle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('Dashboard error:', error);

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
        We encountered an error loading the dashboard. Please try again, or contact support if the problem persists.
      </Typography>
      <Button variant="contained" onClick={reset} sx={{ mt: 1 }}>
        Try Again
      </Button>
    </Box>
  );
}
