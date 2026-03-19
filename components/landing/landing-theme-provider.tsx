'use client';

import { type ReactNode, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

/**
 * Forces light mode for the landing page regardless of the user's theme preference.
 * The landing page has hardcoded light backgrounds, so dark-mode text colors
 * would be unreadable (pale text on white backgrounds).
 */
export function LandingThemeProvider({ children }: { children: ReactNode }) {
  const lightTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'light',
          primary: {
            main: '#2563eb',
            light: '#60a5fa',
            dark: '#1d4ed8',
          },
          secondary: {
            main: '#f59e0b',
            light: '#fbbf24',
            dark: '#d97706',
          },
          success: {
            main: '#16a34a',
          },
          error: {
            main: '#dc2626',
          },
          background: {
            default: '#f8fafc',
            paper: '#ffffff',
          },
          divider: 'rgba(0, 0, 0, 0.12)',
          text: {
            primary: '#0f172a',
            secondary: '#64748b',
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h4: { fontWeight: 700 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 8,
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                backgroundImage: 'none',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                backgroundImage: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                borderRadius: 0,
              },
            },
          },
        },
      }),
    [],
  );

  return <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>;
}
