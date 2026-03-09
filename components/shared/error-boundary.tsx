'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
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
            An unexpected error occurred. Please try again, or contact support if the problem persists.
          </Typography>
          <Button variant="contained" onClick={this.handleReset} sx={{ mt: 1 }}>
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
