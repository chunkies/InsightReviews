import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { AppThemeProvider } from '@/components/providers/theme-provider';
import { SnackbarProvider } from '@/components/providers/snackbar-provider';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'InsightReviews — Get More 5-Star Reviews for Your Local Business',
  description: 'QR code on the counter. Customer scans, rates, done. Happy customers go to Google. Unhappy ones stay private. $79/mo, 14-day free trial.',
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'InsightReviews — Get More 5-Star Reviews',
    description: 'QR code on the counter. Customer scans, rates, done. Happy customers go to Google. Unhappy ones stay private. Built for local businesses.',
    url: 'https://insightreviews.com.au',
    siteName: 'InsightReviews',
    type: 'website',
    images: [
      {
        url: 'https://insightreviews.com.au/screenshots/dashboard-hero.png',
        width: 1200,
        height: 630,
        alt: 'InsightReviews dashboard showing review analytics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InsightReviews — Get More 5-Star Reviews',
    description: 'QR code on the counter. Customer scans, rates, done. Happy customers go to Google. Unhappy ones stay private.',
    images: ['https://insightreviews.com.au/screenshots/dashboard-hero.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning style={{ scrollBehavior: 'smooth' }}>
      <body>
        <AppRouterCacheProvider>
          <AppThemeProvider>
            <SnackbarProvider>
              {children}
            </SnackbarProvider>
            <Analytics />
          </AppThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
