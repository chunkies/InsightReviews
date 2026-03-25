import type { Metadata } from 'next';
import { LandingThemeProvider } from '@/components/landing/landing-theme-provider';
import { InteractiveDemo } from '@/components/demo/interactive-demo';

export const metadata: Metadata = {
  title: 'Your Google Rating Is Costing You Customers — See the Fix in 60 Seconds',
  description: 'One QR code at the counter. Happy customers go to Google. Unhappy ones stay private. Try the interactive demo — no signup required. Built for cafes, salons, dentists & gyms.',
  openGraph: {
    title: 'Your Google Rating Is Costing You Customers — See the Fix',
    description: 'One QR code. Happy customers go to Google. Unhappy ones stay private. Try it now — no signup required.',
    url: 'https://insightreviews.com.au/demo',
    siteName: 'InsightReviews',
    type: 'website',
    locale: 'en_AU',
    images: [
      {
        url: 'https://insightreviews.com.au/screenshots/dashboard-hero.png',
        width: 1200,
        height: 630,
        alt: 'InsightReviews — Get more 5-star Google reviews for your business',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your Google Rating Is Costing You Customers — See the Fix',
    description: 'One QR code. Happy → Google. Unhappy → Private. Try the interactive demo free.',
    images: ['https://insightreviews.com.au/screenshots/dashboard-hero.png'],
  },
};

export default function DemoPage() {
  return (
    <LandingThemeProvider>
      <InteractiveDemo />
    </LandingThemeProvider>
  );
}
