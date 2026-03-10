import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { AppThemeProvider } from '@/components/providers/theme-provider';
import { SnackbarProvider } from '@/components/providers/snackbar-provider';

export const metadata: Metadata = {
  title: 'InsightReviews — Smart Review Collection for Local Businesses',
  description: 'Collect customer reviews at the point of sale. Route positive reviews to Google, Yelp & more. Catch negative feedback privately.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppRouterCacheProvider>
          <AppThemeProvider>
            <SnackbarProvider>
              {children}
            </SnackbarProvider>
          </AppThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
