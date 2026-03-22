import type { Metadata } from 'next';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent,
  AppBar, Toolbar, Chip, Accordion, AccordionSummary,
  AccordionDetails,
} from '@mui/material';

import {
  Star, Send, Shield, ArrowRight, ChevronDown,
  CheckCircle2, TrendingUp, Smartphone, QrCode,
  Palette, Globe,
  XCircle, AlertTriangle, ThumbsUp,
} from 'lucide-react';
import { ProductDemo } from '@/components/landing/product-demo';
import { LandingThemeProvider } from '@/components/landing/landing-theme-provider';

export const metadata: Metadata = {
  title: 'InsightReviews — Get More 5-Star Google Reviews for Your Local Business',
  description: 'Turn happy customers into 5-star Google reviews. QR code at the counter, SMS review requests, smart routing — positive reviews go to Google, negative ones stay private. Built for Australian cafes, salons, dentists, gyms. $79/mo, 14-day free trial.',
  keywords: ['Google reviews', 'review management', 'local business reviews', 'QR code reviews', 'review collection', 'Melbourne', 'Australia', 'smart review routing', 'get more reviews', 'customer feedback'],
  alternates: {
    canonical: 'https://insightreviews.com.au',
  },
  openGraph: {
    title: 'InsightReviews — Get More 5-Star Google Reviews',
    description: 'Turn happy customers into 5-star Google reviews. Catch unhappy ones before they post publicly. Built for Australian local businesses. $79/mo.',
    url: 'https://insightreviews.com.au',
    siteName: 'InsightReviews',
    type: 'website',
    locale: 'en_AU',
    images: [
      {
        url: 'https://insightreviews.com.au/screenshots/dashboard-hero.png',
        width: 1200,
        height: 630,
        alt: 'InsightReviews dashboard — review analytics for local businesses',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InsightReviews — Get More 5-Star Google Reviews',
    description: 'QR code at the counter. Customer scans, rates, done. Happy customers go to Google. Unhappy ones stay private. $79/mo.',
    images: ['https://insightreviews.com.au/screenshots/dashboard-hero.png'],
  },
};

const painPoints = [
  {
    icon: XCircle,
    problem: 'Happy customers leave silently',
    detail: 'They loved the experience but never think to leave a review. Meanwhile, the one unhappy customer posts a 1-star rant.',
  },
  {
    icon: AlertTriangle,
    problem: 'One bad review tanks your rating',
    detail: 'It takes roughly 20 five-star reviews to offset a single 1-star. Most businesses never recover their rating.',
  },
  {
    icon: ThumbsUp,
    problem: 'You\'re doing great work — Google doesn\'t show it',
    detail: 'Your 4.8-star service is stuck at 3.6 online because only frustrated people post. That\'s costing you customers every day.',
  },
];

const coreFeatures = [
  {
    icon: QrCode,
    title: 'QR Code at the Counter',
    description: 'Print a branded QR code. Customer scans, taps a star rating, done in under 30 seconds. No app, no login.',
  },
  {
    icon: TrendingUp,
    title: 'Smart Review Routing',
    description: 'Happy customers (4-5 stars) get directed to Google, Yelp & Facebook. Unhappy ones (1-3 stars) stay private so you can follow up.',
  },
  {
    icon: Shield,
    title: 'Catch Negatives Before They Go Public',
    description: 'Get an instant email alert when someone rates you 1-3 stars. Reach out and make it right — before it hits Google.',
  },
  {
    icon: Globe,
    title: 'All Reviews in One Dashboard',
    description: 'Google, Facebook & Yelp reviews auto-synced into one place. Weekly email digest, rating trends, and response tracking.',
  },
  {
    icon: Send,
    title: 'SMS & Email Requests',
    description: 'Staff enters a phone number, customer gets a text with your review link. Takes 5 seconds. Auto-reminders if they forget.',
  },
  {
    icon: Palette,
    title: 'Your Brand, Not Ours',
    description: 'Your logo, your colours on the review form. Plus a public testimonial wall to showcase your best reviews anywhere.',
  },
];

const extraFeatures = [
  'Staff leaderboard — see who sends the most requests',
  'Unlimited staff accounts — no per-seat charges',
  'Auto follow-up reminders for missed reviews',
  'Weekly email digest with your best and worst reviews',
  'Public testimonial wall with embed code',
  'Custom SMS templates',
  'Works with Google, Yelp, Facebook, TripAdvisor & any custom URL',
];

const steps = [
  {
    step: '1',
    title: 'Customer scans your QR code',
    desc: 'Place your branded QR code at the counter, on tables, or on receipts. Customers scan it with their phone camera.',
    icon: Smartphone,
  },
  {
    step: '2',
    title: 'They tap a star rating',
    desc: 'A branded review form loads instantly — your logo, your colours. One tap to rate, optional comment. Done in 10 seconds.',
    icon: Star,
  },
  {
    step: '3',
    title: 'Reviews go where they help most',
    desc: '4-5 stars? Directed straight to your Google or Yelp page. 1-3 stars? Stays private so you can follow up first.',
    icon: TrendingUp,
  },
];

const faqs = [
  {
    q: 'How does the 14-day free trial work?',
    a: 'Sign up, add your card details, and get full access to every feature for 14 days — QR codes, SMS, smart routing, dashboard, the lot. You won\'t be charged until the trial ends. After 14 days, your subscription begins at $79/mo.',
  },
  {
    q: 'Will this work for my type of business?',
    a: 'If customers walk through your door, InsightReviews works for you. Cafes, restaurants, salons, dental clinics, physios, auto shops, gyms, retail stores, vets — any local business that serves customers in person.',
  },
  {
    q: 'What happens with negative reviews?',
    a: 'That\'s the core of what we do. When a customer rates you 1-3 stars, their feedback stays completely private. You get an instant email alert so you can reach out and make it right — before they ever post publicly on Google.',
  },
  {
    q: 'How does the QR code work?',
    a: 'We generate a unique QR code for your business. Print it and place it at your counter, on tables, on receipts, or wherever makes sense. Customers scan it with their phone camera — no app needed — and your branded review form pops up instantly.',
  },
  {
    q: 'Can my staff use it too?',
    a: 'Absolutely. Invite unlimited staff members. They get a simple screen: enter a phone number or show the QR code. There\'s even a staff leaderboard so you can see who\'s sending the most review requests.',
  },
  {
    q: 'Which review platforms do you support?',
    a: 'Google, Yelp, Facebook, TripAdvisor, and any custom review URL. We also auto-sync your existing reviews from Google, Facebook, and Yelp so everything\'s in one dashboard.',
  },
  {
    q: 'Do you pull in my existing reviews?',
    a: 'Yes. Connect your Google Business Profile, Facebook page, or Yelp listing and we\'ll sync all your existing reviews into the dashboard automatically. Updated regularly so you always have the full picture.',
  },
  {
    q: 'Is this review gating? Is it allowed by Google?',
    a: 'No. Every customer can leave a review on any platform they choose — we never block or filter reviews. We simply make it easier for happy customers to find your Google page, and give unhappy customers a private channel to share feedback with you directly. This is fully compliant with Google\'s review policies.',
  },
  {
    q: 'What if I already have a low rating?',
    a: 'That\'s exactly who we built this for. Most businesses with a low rating aren\'t doing bad work — they just have more negative reviews than positive ones because happy customers don\'t think to post. Start collecting consistently and you\'ll see the rating shift within weeks.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, no contracts, no lock-in. Cancel from your billing dashboard with one click. Your data stays available for 30 days after cancellation.',
  },
];

const proofStats = [
  {
    stat: '<30 sec',
    label: 'Scan to review',
    detail: 'Customer scans your QR code, taps a star rating, leaves a comment if they want. No app download, no login, no friction.',
  },
  {
    stat: '5-9%',
    label: 'More revenue per 0.5-star boost',
    detail: 'Harvard Business School found that a half-star increase on review platforms drives measurably more revenue for local businesses.',
  },
  {
    stat: '95%',
    label: 'SMS open rate',
    detail: 'Compared to 20% for email. When you send a review request via SMS, it actually gets seen and acted on.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'InsightReviews',
      url: 'https://insightreviews.com.au',
      logo: 'https://insightreviews.com.au/icon.svg',
      description: 'Review collection and smart routing platform for Australian local businesses.',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Melbourne',
        addressRegion: 'VIC',
        addressCountry: 'AU',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'tristan@insightreviews.com.au',
        contactType: 'sales',
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'InsightReviews',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: 'Turn happy customers into 5-star Google reviews. QR code and SMS review collection with smart routing for local businesses.',
      url: 'https://insightreviews.com.au',
      offers: {
        '@type': 'Offer',
        price: '79',
        priceCurrency: 'AUD',
        priceValidUntil: '2027-12-31',
        availability: 'https://schema.org/InStock',
        description: '$79/month per location. 14-day free trial.',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '5',
        ratingCount: '1',
        bestRating: '5',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does the 14-day free trial work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sign up, add your card details, and get full access to every feature for 14 days. You won\'t be charged until the trial ends. After 14 days, your subscription begins at $79/mo.',
          },
        },
        {
          '@type': 'Question',
          name: 'What types of businesses is InsightReviews for?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Any local business that serves customers in person — cafes, restaurants, salons, dental clinics, physios, auto shops, gyms, retail stores, vets, and more.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does the smart review routing work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'When a customer leaves a 4 or 5-star review, they get redirected to your Google, Yelp, or Facebook page to post publicly. 1-3 star reviews stay private so you can follow up before anything goes public.',
          },
        },
        {
          '@type': 'Question',
          name: 'How much does InsightReviews cost?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '$79 per month per location with a 14-day free trial. No lock-in contracts — cancel anytime.',
          },
        },
      ],
    },
  ],
};

export default function LandingPage() {
  return (
    <LandingThemeProvider>
    <Box sx={{ overflowX: 'hidden' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255,255,255,0.85)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ maxWidth: 'lg', mx: 'auto', width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1565c0 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Star size={18} color="#fff" fill="#fff" />
            </Box>
            <Typography variant="h6" fontWeight={800} color="primary">
              InsightReviews
            </Typography>
          </Box>
          <Button href="/auth/login" variant="text" sx={{ mr: 0.5, color: 'text.secondary', minWidth: 'auto', px: { xs: 1, sm: 2 } }}>
            Sign In
          </Button>
          <Button
            href="/auth/login?mode=signup"
            variant="contained"
            sx={{
              display: { xs: 'none', md: 'inline-flex' },
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
              px: 2,
            }}
          >
            Start Free Trial
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero */}
      <Box
        sx={{
          background: 'linear-gradient(150deg, #0f172a 0%, #1e3a5f 40%, #2563eb 100%)',
          color: 'white',
          pt: { xs: 8, md: 12 },
          pb: { xs: 10, md: 14 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -150,
            left: -150,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Chip
                label="Built for Australian local businesses"
                sx={{
                  mb: 3,
                  backgroundColor: 'rgba(251,191,36,0.15)',
                  color: '#fbbf24',
                  fontWeight: 600,
                  border: '1px solid rgba(251,191,36,0.3)',
                  fontSize: '0.85rem',
                }}
                icon={<CheckCircle2 size={16} color="#fbbf24" />}
              />
              <Typography
                variant="h1"
                fontWeight={900}
                sx={{
                  mb: 3,
                  fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.5rem' },
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}
              >
                Your Happy Customers Don&apos;t Leave Reviews.{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Let&apos;s Fix That.
                </Box>
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  mb: 4,
                  opacity: 0.85,
                  fontWeight: 400,
                  lineHeight: 1.6,
                  maxWidth: 560,
                  fontSize: { xs: '1rem', md: '1.15rem' },
                }}
              >
                QR code on the counter. Customer scans, rates, done. Happy customers get
                directed to Google. Unhappy ones stay private so you can follow up.
                More 5-star reviews, fewer public complaints.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <Button
                  href="/auth/login?mode=signup"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowRight size={20} />}
                  sx={{
                    py: 1.5,
                    px: 4,
                    fontSize: '1.05rem',
                    backgroundColor: '#fbbf24',
                    color: '#0f172a',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(251,191,36,0.4)',
                    '&:hover': {
                      backgroundColor: '#f59e0b',
                      boxShadow: '0 6px 20px rgba(251,191,36,0.5)',
                    },
                  }}
                >
                  Start Free 14-Day Trial
                </Button>
                <Button
                  href="#how-it-works"
                  variant="outlined"
                  size="large"
                  sx={{
                    py: 1.5,
                    px: 3,
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.3)',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.6)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                    },
                  }}
                >
                  See How It Works
                </Button>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, opacity: 0.6, flexWrap: 'wrap' }}>
                <CheckCircle2 size={14} />
                <Typography variant="body2" fontSize={{ xs: '0.75rem', sm: '0.875rem' }}>14 days free</Typography>
                <Box sx={{ mx: 0.5 }}>|</Box>
                <CheckCircle2 size={14} />
                <Typography variant="body2" fontSize={{ xs: '0.75rem', sm: '0.875rem' }}>Setup in 2 minutes</Typography>
                <Box sx={{ mx: 0.5 }}>|</Box>
                <CheckCircle2 size={14} />
                <Typography variant="body2" fontSize={{ xs: '0.75rem', sm: '0.875rem' }}>Google, Yelp, Facebook & more</Typography>
              </Box>
            </Grid>

            {/* Phone Mockup */}
            <Grid size={{ xs: 12, md: 5 }} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
              <Box
                sx={{
                  width: 280,
                  height: 560,
                  borderRadius: '36px',
                  border: '4px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 24,
                    borderRadius: '0 0 16px 16px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    mx: 'auto',
                    mb: 3,
                  }}
                />
                <Box
                  sx={{
                    flex: 1,
                    borderRadius: '20px',
                    backgroundColor: 'white',
                    p: 2.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1.5,
                    }}
                  >
                    <Star size={24} color="#fbbf24" fill="#fbbf24" />
                  </Box>
                  <Typography
                    sx={{ color: '#0f172a', fontWeight: 700, fontSize: '0.95rem', mb: 0.5 }}
                  >
                    Sage &amp; Vine Cafe
                  </Typography>
                  <Typography
                    sx={{ color: '#64748b', fontSize: '0.75rem', mb: 2, textAlign: 'center' }}
                  >
                    How was your visit today?
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Box
                        key={s}
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '8px',
                          backgroundColor: s <= 4 ? '#fbbf24' : '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Star
                          size={20}
                          color={s <= 4 ? '#ffffff' : '#94a3b8'}
                          fill={s <= 4 ? '#ffffff' : 'none'}
                        />
                      </Box>
                    ))}
                  </Box>
                  <Box
                    sx={{
                      width: '100%',
                      p: 1.5,
                      borderRadius: '10px',
                      backgroundColor: '#f1f5f9',
                      mb: 2,
                    }}
                  >
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                      Great coffee, lovely staff!
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: '100%',
                      py: 1.2,
                      borderRadius: '10px',
                      backgroundColor: '#2563eb',
                      textAlign: 'center',
                    }}
                  >
                    <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.8rem' }}>
                      Submit Review
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 'auto', textAlign: 'center' }}>
                    <Typography sx={{ color: '#16a34a', fontSize: '0.65rem', fontWeight: 600 }}>
                      ✓ 4 stars → Redirected to Google Reviews
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* The Problem */}
      <Box sx={{ py: { xs: 8, md: 10 }, backgroundColor: 'white' }}>
        <Container maxWidth="lg">
          <Typography
            variant="overline"
            textAlign="center"
            display="block"
            sx={{ color: '#dc2626', fontWeight: 700, letterSpacing: 2, mb: 1 }}
          >
            The Problem
          </Typography>
          <Typography
            variant="h3"
            fontWeight={800}
            textAlign="center"
            sx={{ mb: 2, fontSize: { xs: '1.8rem', md: '2.4rem' } }}
          >
            Your Rating Is Costing You Customers
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 6, maxWidth: 550, mx: 'auto' }}
          >
            88% of consumers check online reviews before choosing a local business.
            If your rating is below 4 stars, they&apos;re going to your competitor.
          </Typography>
          <Grid container spacing={3}>
            {painPoints.map((p) => {
              const Icon = p.icon;
              return (
                <Grid key={p.problem} size={{ xs: 12, md: 4 }}>
                  <Card
                    sx={{
                      height: '100%',
                      border: '1px solid',
                      borderColor: '#fecaca',
                      boxShadow: 'none',
                      backgroundColor: '#fef2f2',
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '12px',
                          backgroundColor: '#fee2e2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        <Icon size={24} color="#dc2626" />
                      </Box>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        {p.problem}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                        {p.detail}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* How it Works */}
      <Box id="how-it-works" sx={{ py: { xs: 8, md: 10 }, background: 'linear-gradient(180deg, #f8fafc 0%, white 100%)' }}>
        <Container maxWidth="md">
          <Typography
            variant="overline"
            textAlign="center"
            display="block"
            sx={{ color: '#2563eb', fontWeight: 700, letterSpacing: 2, mb: 1 }}
          >
            How It Works
          </Typography>
          <Typography
            variant="h3"
            fontWeight={800}
            textAlign="center"
            sx={{ mb: 2, fontSize: { xs: '1.8rem', md: '2.4rem' } }}
          >
            Three Steps. More 5-Star Reviews.
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 8, maxWidth: 500, mx: 'auto' }}
          >
            No complicated setup. No training manual. Your team can start collecting reviews in minutes.
          </Typography>

          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                display: { xs: 'none', md: 'block' },
                position: 'absolute',
                top: 44,
                left: '20%',
                right: '20%',
                height: 2,
                background: 'linear-gradient(90deg, #2563eb 0%, #fbbf24 50%, #16a34a 100%)',
                zIndex: 0,
              }}
            />
            <Grid container spacing={4}>
              {steps.map((item) => {
                const StepIcon = item.icon;
                return (
                  <Grid key={item.step} size={{ xs: 12, md: 4 }}>
                    <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                      <Box
                        sx={{
                          width: 88,
                          height: 88,
                          borderRadius: '50%',
                          background:
                            item.step === '1'
                              ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                              : item.step === '2'
                                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                : 'linear-gradient(135deg, #16a34a, #15803d)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 3,
                          boxShadow:
                            item.step === '1'
                              ? '0 8px 24px rgba(37,99,235,0.3)'
                              : item.step === '2'
                                ? '0 8px 24px rgba(245,158,11,0.3)'
                                : '0 8px 24px rgba(22,163,74,0.3)',
                        }}
                      >
                        <StepIcon size={36} color="white" />
                      </Box>
                      <Chip
                        label={`Step ${item.step}`}
                        size="small"
                        sx={{
                          mb: 1.5,
                          fontWeight: 700,
                          backgroundColor: '#f1f5f9',
                          fontSize: '0.75rem',
                        }}
                      />
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        {item.title}
                      </Typography>
                      <Typography color="text.secondary" sx={{ maxWidth: 260, mx: 'auto' }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Interactive Demo */}
      <Box sx={{ py: { xs: 8, md: 10 }, background: 'linear-gradient(180deg, white 0%, #f8fafc 100%)' }}>
        <Container maxWidth="md">
          <Typography
            variant="overline"
            textAlign="center"
            display="block"
            sx={{ color: '#2563eb', fontWeight: 700, letterSpacing: 2, mb: 1 }}
          >
            See It In Action
          </Typography>
          <Typography
            variant="h3"
            fontWeight={800}
            textAlign="center"
            sx={{ mb: 2, fontSize: { xs: '1.8rem', md: '2.4rem' } }}
          >
            Watch the Customer Experience
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 5, maxWidth: 460, mx: 'auto' }}
          >
            From QR scan to Google review in under 30 seconds. Here&apos;s exactly what your customers see.
          </Typography>
          <ProductDemo />
        </Container>
      </Box>

      {/* Stats */}
      <Box sx={{ py: { xs: 8, md: 10 }, backgroundColor: 'white' }}>
        <Container maxWidth="lg">
          <Typography
            variant="overline"
            textAlign="center"
            display="block"
            sx={{ color: '#f59e0b', fontWeight: 700, letterSpacing: 2, mb: 1 }}
          >
            The Numbers
          </Typography>
          <Typography
            variant="h3"
            fontWeight={800}
            textAlign="center"
            sx={{ mb: 2, fontSize: { xs: '1.8rem', md: '2.4rem' } }}
          >
            Why It Works
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 6, maxWidth: 550, mx: 'auto' }}
          >
            QR code on the counter or SMS after the visit. Two simple ways to collect reviews that actually get results.
          </Typography>
          <Grid container spacing={3}>
            {proofStats.map((s) => (
              <Grid key={s.label} size={{ xs: 12, md: 4 }}>
                <Card
                  sx={{
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 'none',
                    textAlign: 'center',
                  }}
                >
                  <CardContent sx={{ p: 3.5 }}>
                    <Typography
                      variant="h2"
                      fontWeight={900}
                      sx={{
                        mb: 1,
                        fontSize: { xs: '2.5rem', md: '3rem' },
                        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {s.stat}
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
                      {s.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {s.detail}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Dashboard Screenshot */}
      <Box
        sx={{
          py: { xs: 6, md: 10 },
          background: 'linear-gradient(180deg, #f8fafc 0%, #eff6ff 50%, #f8fafc 100%)',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="overline"
            textAlign="center"
            display="block"
            sx={{ color: '#2563eb', fontWeight: 700, letterSpacing: 2, mb: 1 }}
          >
            Your Dashboard
          </Typography>
          <Typography
            variant="h3"
            fontWeight={800}
            textAlign="center"
            sx={{ mb: 2, fontSize: { xs: '1.8rem', md: '2.4rem' } }}
          >
            Every Review. Every Platform. One Dashboard.
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 5, maxWidth: 560, mx: 'auto' }}
          >
            Google, Facebook, and Yelp reviews auto-synced into one place. See your rating trend, review funnel,
            staff leaderboard, and weekly performance — without logging into three different platforms.
          </Typography>
          <Box
            sx={{
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              border: '1px solid',
              borderColor: 'divider',
              mx: { xs: 0, md: 4 },
            }}
          >
            <img
              src="/screenshots/dashboard-hero.png"
              alt="InsightReviews dashboard showing review stats, rating trends, and review funnel analytics"
              style={{ width: '100%', display: 'block' }}
              loading="lazy"
            />
          </Box>
        </Container>
      </Box>

      {/* Features Grid */}
      <Box sx={{ backgroundColor: 'white', py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography
            variant="overline"
            textAlign="center"
            display="block"
            sx={{ color: '#2563eb', fontWeight: 700, letterSpacing: 2, mb: 1 }}
          >
            Everything Included
          </Typography>
          <Typography
            variant="h3"
            fontWeight={800}
            textAlign="center"
            sx={{ mb: 2, fontSize: { xs: '1.8rem', md: '2.4rem' } }}
          >
            Built for Local Businesses. Not Enterprise Complexity.
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 6, maxWidth: 540, mx: 'auto' }}
          >
            Collect reviews, protect your reputation, grow your rating. Here&apos;s what you get.
          </Typography>
          <Grid container spacing={3}>
            {coreFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Grid key={feature.title} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      height: '100%',
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                        borderColor: 'primary.light',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        <Icon size={22} color="#2563eb" />
                      </Box>
                      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ fontSize: '1rem' }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Plus everything else */}
          <Box sx={{ mt: 5, textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Plus everything else you&apos;d expect
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5, maxWidth: 700, mx: 'auto' }}>
              {extraFeatures.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  size="small"
                  sx={{
                    backgroundColor: '#f1f5f9',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                  }}
                />
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Pricing */}
      <Box id="pricing" sx={{ py: { xs: 8, md: 10 }, background: 'linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)' }}>
        <Container maxWidth="md">
          <Typography
            variant="overline"
            textAlign="center"
            display="block"
            sx={{ color: '#2563eb', fontWeight: 700, letterSpacing: 2, mb: 1 }}
          >
            Pricing
          </Typography>
          <Typography
            variant="h3"
            fontWeight={800}
            textAlign="center"
            sx={{ mb: 2, fontSize: { xs: '1.8rem', md: '2.4rem' } }}
          >
            One Plan. Everything Included.
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 1, maxWidth: 520, mx: 'auto' }}
          >
            A 0.5-star rating boost drives 5-9% more revenue. For a business doing $30K/month,
            that&apos;s $1,500-2,700/month — from a $79 investment.
          </Typography>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Chip
              label="14-day free trial — no charge until it ends"
              size="small"
              sx={{ backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 600, fontSize: '0.75rem' }}
            />
          </Box>

          <Box sx={{ maxWidth: 420, mx: 'auto' }}>
            <Card sx={{ border: '2px solid', borderColor: 'primary.main', borderRadius: 3, boxShadow: '0 12px 40px rgba(37,99,235,0.15)' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', mb: 0.5 }}>
                  <Typography variant="h2" fontWeight={900} color="primary" sx={{ fontSize: { xs: '2.5rem', md: '3rem' } }}>$79</Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ ml: 1 }}>/mo</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>per location</Typography>

                <Box sx={{ mb: 3 }}>
                  {[
                    'QR code + SMS review collection',
                    'Smart routing to Google, Yelp, Facebook & more',
                    'Auto-sync reviews from all platforms',
                    'Instant email alerts on negative reviews',
                    'Weekly performance digest',
                    'Auto follow-up reminders',
                    'Unlimited staff accounts + leaderboard',
                    'Public testimonial wall',
                    'Fully branded — your logo, your colours',
                    'Setup in 2 minutes, no contract',
                  ].map((item) => (
                    <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                      <CheckCircle2 size={14} color="#16a34a" />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{item}</Typography>
                    </Box>
                  ))}
                </Box>

                <Button
                  href="/auth/login?mode=signup"
                  variant="contained"
                  size="large"
                  fullWidth
                  endIcon={<ArrowRight size={18} />}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                    '&:hover': { boxShadow: '0 6px 20px rgba(37,99,235,0.4)' },
                  }}
                >
                  Try It Free for 14 Days
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </Box>

      {/* FAQ */}
      <Box sx={{ py: { xs: 8, md: 10 }, background: 'linear-gradient(180deg, #f8fafc 0%, white 100%)' }}>
        <Container maxWidth="md">
          <Typography
            variant="overline"
            textAlign="center"
            display="block"
            sx={{ color: '#2563eb', fontWeight: 700, letterSpacing: 2, mb: 1 }}
          >
            FAQ
          </Typography>
          <Typography
            variant="h3"
            fontWeight={800}
            textAlign="center"
            sx={{ mb: 2, fontSize: { xs: '1.8rem', md: '2.4rem' } }}
          >
            Common Questions
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 5, maxWidth: 500, mx: 'auto' }}
          >
            Everything you need to know before getting started.
          </Typography>

          <Box>
            {faqs.map((faq) => (
              <Accordion
                key={faq.q}
                disableGutters
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px !important',
                  mb: 1.5,
                  '&:before': { display: 'none' },
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary
                  expandIcon={<ChevronDown size={20} />}
                  sx={{
                    px: 3,
                    '& .MuiAccordionSummary-content': { my: 2 },
                  }}
                >
                  <Typography fontWeight={600}>{faq.q}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                  <Typography color="text.secondary" lineHeight={1.7}>
                    {faq.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Works With + Founder Trust */}
      <Box sx={{ py: { xs: 6, md: 8 }, backgroundColor: 'white' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography
            variant="body2"
            sx={{ mb: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, fontSize: '0.7rem', color: '#94a3b8' }}
          >
            Works with the platforms your customers use
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 3, md: 5 }, flexWrap: 'wrap', mb: 6 }}>
            {['Google', 'Yelp', 'Facebook', 'TripAdvisor'].map((platform) => (
              <Typography key={platform} sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '1.1rem', letterSpacing: '0.01em' }}>
                {platform}
              </Typography>
            ))}
          </Box>

          <Box sx={{
            maxWidth: 520,
            mx: 'auto',
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            backgroundColor: '#f8fafc',
            border: '1px solid',
            borderColor: 'divider',
          }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
              Built in Melbourne by Tristan
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mb: 2 }}>
              I kept seeing great local businesses — cafes, dentists, salons — stuck with 3-star ratings
              because their happy customers never thought to leave a review. The unhappy ones always did.
              I built InsightReviews to fix that imbalance. It&apos;s simple, it works, and it&apos;s priced
              for businesses that don&apos;t have enterprise budgets.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Shield size={14} color="#2563eb" />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>No contracts</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircle2 size={14} color="#2563eb" />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>Cancel anytime</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Star size={14} color="#2563eb" />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>Australian owned</Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Final CTA */}
      <Box
        sx={{
          py: { xs: 8, md: 10 },
          background: 'linear-gradient(150deg, #0f172a 0%, #1e3a5f 40%, #2563eb 100%)',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mb: 3 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={28} color="#fbbf24" fill="#fbbf24" />
            ))}
          </Box>
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{ mb: 2, fontSize: { xs: '1.6rem', md: '2.2rem' } }}
          >
            Stop Losing Customers to a Low Rating
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.85, maxWidth: 440, mx: 'auto' }}>
            Every day without review collection is another day your happy customers leave silently
            while the unhappy ones post publicly. Fix that in the next 2 minutes.
          </Typography>
          <Button
            href="/auth/login?mode=signup"
            variant="contained"
            size="large"
            endIcon={<ArrowRight size={20} />}
            sx={{
              py: 1.5,
              px: 5,
              fontSize: '1.1rem',
              backgroundColor: '#fbbf24',
              color: '#0f172a',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(251,191,36,0.4)',
              '&:hover': {
                backgroundColor: '#f59e0b',
                boxShadow: '0 6px 20px rgba(251,191,36,0.5)',
              },
            }}
          >
            Get Your First 5-Star Review This Week
          </Button>
          <Typography variant="body2" sx={{ mt: 2, opacity: 0.6 }}>
            14 days free. Setup takes 2 minutes. Cancel anytime.
          </Typography>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          py: 4,
          backgroundColor: 'white',
        }}
      >
        <Container maxWidth="lg">
          {/* Directory backlinks — required for SEO dofollow links */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>
              Featured On
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: { xs: 1.5, md: 2 }, mt: 1 }}>
              {[
                { name: 'Startup Fame', url: 'https://startupfa.me/s/insightreviews?utm_source=insightreviews.com.au' },
                { name: 'Fazier', url: 'https://fazier.com/launches/insightreviews' },
                { name: 'Findly.tools', url: 'https://findly.tools' },
                { name: 'NewTool.site', url: 'https://newtool.site' },
                { name: 'Turbo0', url: 'https://turbo0.com/item/insightreviews' },
                { name: 'Dofollow.Tools', url: 'https://dofollow.tools' },
                { name: 'FrogDR', url: 'https://frogdr.com' },
                { name: 'Stack Directory', url: 'https://stackdirectory.com' },
                { name: 'Startup Fast', url: 'https://startupfa.st' },
                { name: 'LaunchVoid', url: 'https://launchvoid.com' },
                { name: 'SaaSBison', url: 'https://saasbison.com' },
                { name: 'Startup Vessel', url: 'https://startupvessel.com' },
                { name: 'ToolPilot.ai', url: 'https://www.toolpilot.ai' },
                { name: 'Web Review', url: 'https://web-review.com' },
                { name: 'Twelve Tools', url: 'https://twelve.tools' },
                { name: 'Wired Business', url: 'https://wired.business' },
                { name: 'DeepLaunch', url: 'https://deeplaunch.io' },
              ].map((d) => (
                <Typography
                  key={d.name}
                  component="a"
                  href={d.url}
                  target="_blank"
                  rel="noopener"
                  variant="caption"
                  sx={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.7rem', '&:hover': { color: '#64748b' } }}
                >
                  {d.name}
                </Typography>
              ))}
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Star size={14} color="#fbbf24" fill="#fbbf24" />
              </Box>
              <Typography variant="body2" fontWeight={700} color="text.secondary">
                InsightReviews
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary" component="a" href="mailto:tristan@insightreviews.com.au" sx={{ textDecoration: 'none', '&:hover': { color: '#2563eb' } }}>
                Contact
              </Typography>
              <Typography variant="body2" color="text.secondary">
                &copy; {new Date().getFullYear()} InsightReviews. Melbourne, Australia.
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
    </LandingThemeProvider>
  );
}
