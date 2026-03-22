import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { AppThemeProvider } from '@/components/providers/theme-provider';
import { SnackbarProvider } from '@/components/providers/snackbar-provider';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { AnalyticsScripts } from '@/components/analytics/analytics-scripts';

export const metadata: Metadata = {
  title: {
    default: 'InsightReviews — Get More 5-Star Reviews for Your Local Business',
    template: '%s | InsightReviews',
  },
  description: 'Turn happy customers into 5-star Google reviews. Smart review routing for Australian local businesses. $79/mo, 14-day free trial.',
  metadataBase: new URL('https://insightreviews.com.au'),
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    siteName: 'InsightReviews',
    locale: 'en_AU',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'm4IpEgczxr-EE9dSEq8o45oUbe-yLl-WbnkqbKkn7bo',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning style={{ scrollBehavior: 'smooth' }}>
      <head />
      <body>
        <AppRouterCacheProvider>
          <AppThemeProvider>
            <SnackbarProvider>
              {children}
            </SnackbarProvider>
            <Analytics />
            <SpeedInsights />
            <AnalyticsScripts />
          </AppThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
