import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@/components/providers/theme';
import { SnackbarProvider } from '@/components/providers/snackbar-provider';

export const metadata: Metadata = {
  title: 'InsightReviews — Smart Review Collection for Local Businesses',
  description: 'Collect customer reviews at the point of sale. Route positive reviews to Google, Yelp & more. Catch negative feedback privately.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <SnackbarProvider>
              {children}
            </SnackbarProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
