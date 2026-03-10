import {
  Box, Container, Typography, Button, Grid, Card, CardContent,
  AppBar, Toolbar, Chip, Avatar, Divider, Accordion, AccordionSummary,
  AccordionDetails, Rating,
} from '@mui/material';

import {
  Star, Send, BarChart3, Shield, ArrowRight, Zap, ChevronDown,
  CheckCircle2, MessageSquare, TrendingUp, Smartphone, Quote,
} from 'lucide-react';

const features = [
  {
    icon: Send,
    title: 'QR Code + SMS',
    description: 'Customers scan a QR code at the counter, or you can text them a review link directly.',
  },
  {
    icon: Star,
    title: 'Smart Routing',
    description: 'Positive reviews go to Google, Yelp & more. Negative feedback stays private.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Dashboard',
    description: 'See your review stats, trends, and response rates at a glance.',
  },
  {
    icon: Shield,
    title: 'Reputation Protection',
    description: 'Catch unhappy customers before they leave a public negative review.',
  },
  {
    icon: Zap,
    title: 'Fully Customisable',
    description: 'Match your review page to your brand — colours, fonts, layout. Your customers see your business, not ours.',
  },
  {
    icon: MessageSquare,
    title: 'Testimonial Wall',
    description: 'Showcase your best reviews on a beautiful public page you can share anywhere.',
  },
];

const steps = [
  {
    step: '1',
    title: 'Customer scans your QR code',
    desc: 'Place your branded QR code at the counter. Customers scan it with their phone in seconds.',
    icon: Smartphone,
  },
  {
    step: '2',
    title: 'They tap a star rating',
    desc: 'A branded review form loads instantly. One tap to rate their experience.',
    icon: Star,
  },
  {
    step: '3',
    title: 'Reviews go where they help most',
    desc: '4-5 stars get directed to Google & Yelp. 1-3 stars stay private so you can follow up.',
    icon: TrendingUp,
  },
];

const faqs = [
  {
    q: 'How does the 14-day free trial work?',
    a: 'Sign up with just your email - no credit card needed. You get full access to every feature for 14 days. If you love it (and you will), add a payment method to continue. If not, your account simply pauses.',
  },
  {
    q: 'Will this work for my type of business?',
    a: 'InsightReviews works for any business that serves customers in person — cafes, restaurants, salons, dental clinics, auto shops, gyms, retail stores, and more. If you have customers walking through your door, we can help you get more reviews.',
  },
  {
    q: 'What happens with negative reviews?',
    a: 'That\'s the magic. When a customer rates you 1-3 stars, their feedback stays completely private. You get notified immediately so you can reach out and make it right - before they ever post publicly.',
  },
  {
    q: 'How does the QR code work?',
    a: 'We generate a unique QR code for your business. Print it and place it at your counter, on tables, or in receipts. Customers scan it with their phone camera and your branded review form pops up instantly. You can also send review links via SMS or email.',
  },
  {
    q: 'Can my staff use it too?',
    a: 'Absolutely. You can invite unlimited staff members to your account. They get access to the simple review collection screen - enter a phone number, hit send. That\'s it.',
  },
  {
    q: 'Which review platforms do you support?',
    a: 'Google, Yelp, Facebook, TripAdvisor, and any custom review URL. You choose which platforms to show your happy customers, and in what order.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, no contracts, no lock-in. Cancel from your billing dashboard with one click. Your data stays available for 30 days after cancellation.',
  },
];

const testimonials = [
  {
    quote: 'We were getting maybe one Google review a month before this. Now we get 10-15 a week without even thinking about it. Honestly wish we\'d started sooner.',
    name: 'Marco Rossi',
    business: 'Rossi\'s Trattoria, Lygon St',
    rating: 5,
    avatar: 'M',
  },
  {
    quote: 'Had a client leave unhappy on a Friday — got the private alert straight away, called her back, sorted it out. She rebooked and left us a 5-star review the next week.',
    name: 'Priya Sharma',
    business: 'Luxe Hair Studio, South Yarra',
    rating: 5,
    avatar: 'P',
  },
  {
    quote: 'The girls at the front desk just pop the number in after each appointment. Dead simple. We\'ve gone from 40 Google reviews to over 200 in three months.',
    name: 'Dr. Tom Nguyen',
    business: 'Bayside Dental, Brighton',
    rating: 5,
    avatar: 'T',
  },
];

const socialProofLogos = [
  'Rossi\'s Trattoria', 'Luxe Hair Studio', 'Bayside Dental',
  'FitZone Gym', 'Chapel St Auto', 'The Brunswick Eatery',
];

export default function LandingPage() {
  return (
    <Box sx={{ overflowX: 'hidden' }}>
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
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Star size={18} color="#fbbf24" fill="#fbbf24" />
            </Box>
            <Typography variant="h6" fontWeight={800} color="primary">
              InsightReviews
            </Typography>
          </Box>
          <Button href="/auth/login" variant="text" sx={{ mr: 1, color: 'text.secondary' }}>
            Sign In
          </Button>
          <Button
            href="/auth/login"
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
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
        {/* Background decorative elements */}
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
                label="Trusted by Melbourne businesses"
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
                Turn Every Happy Customer Into a{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  5-Star Review
                </Box>
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  mb: 4,
                  opacity: 0.8,
                  fontWeight: 400,
                  lineHeight: 1.6,
                  maxWidth: 540,
                  fontSize: { xs: '1rem', md: '1.15rem' },
                }}
              >
                Collect reviews at the counter with a simple QR code. Route happy customers to Google and Yelp.
                Catch unhappy ones privately before they post. Simple, automatic, and effective.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <Button
                  href="/auth/login"
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.6 }}>
                <CheckCircle2 size={14} />
                <Typography variant="body2">No credit card required</Typography>
                <Box sx={{ mx: 1 }}>|</Box>
                <CheckCircle2 size={14} />
                <Typography variant="body2">Setup in 2 minutes</Typography>
                <Box sx={{ mx: 1 }}>|</Box>
                <CheckCircle2 size={14} />
                <Typography variant="body2">Cancel anytime</Typography>
              </Box>
            </Grid>

            {/* Phone Mockup Area */}
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
                {/* Phone notch */}
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
                {/* Phone content */}
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
                    Rossi&apos;s Trattoria
                  </Typography>
                  <Typography
                    sx={{ color: '#64748b', fontSize: '0.75rem', mb: 2, textAlign: 'center' }}
                  >
                    How was your meal today?
                  </Typography>
                  {/* Star rating display */}
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
                      Amazing pasta, will definitely be back!
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
                  {/* Success state hint */}
                  <Box sx={{ mt: 'auto', textAlign: 'center' }}>
                    <Typography sx={{ color: '#16a34a', fontSize: '0.65rem', fontWeight: 600 }}>
                      Then redirected to Google Reviews
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Social Proof Bar */}
      <Box
        sx={{
          py: 4,
          backgroundColor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="body2"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}
          >
            Trusted by local businesses across Melbourne
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: { xs: 2, md: 5 },
              flexWrap: 'wrap',
            }}
          >
            {socialProofLogos.map((name) => (
              <Box
                key={name}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* How it Works */}
      <Box id="how-it-works" sx={{ py: { xs: 8, md: 10 }, backgroundColor: 'white' }}>
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
            Three Steps to More 5-Star Reviews
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
            {/* Connecting line */}
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

      {/* See it in action - Phone Mockup (mobile) */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          py: 8,
          background: 'linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)',
        }}
      >
        <Container maxWidth="sm">
          <Typography
            variant="overline"
            textAlign="center"
            display="block"
            sx={{ color: '#2563eb', fontWeight: 700, letterSpacing: 2, mb: 1 }}
          >
            See It In Action
          </Typography>
          <Typography
            variant="h4"
            fontWeight={800}
            textAlign="center"
            sx={{ mb: 2 }}
          >
            What Your Customers See
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 4 }}
          >
            A clean, branded review form that takes 10 seconds to complete.
          </Typography>
          {/* Simplified phone mockup for mobile */}
          <Box
            sx={{
              maxWidth: 260,
              mx: 'auto',
              borderRadius: '28px',
              border: '3px solid #e2e8f0',
              backgroundColor: 'white',
              p: 2,
              boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
            }}
          >
            <Box sx={{ borderRadius: '16px', backgroundColor: '#f8fafc', p: 2.5, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1,
                }}
              >
                <Star size={20} color="#fbbf24" fill="#fbbf24" />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.5 }}>
                Rossi&apos;s Trattoria
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.7rem', mb: 1.5 }}>
                How was your meal?
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', mb: 1.5 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={24}
                    color="#fbbf24"
                    fill={s <= 5 ? '#fbbf24' : 'none'}
                  />
                ))}
              </Box>
              <Box
                sx={{
                  py: 1,
                  borderRadius: '8px',
                  backgroundColor: '#2563eb',
                  textAlign: 'center',
                }}
              >
                <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.75rem' }}>
                  Submit Review
                </Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Product Screenshot */}
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
            Everything at a Glance
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 5, maxWidth: 520, mx: 'auto' }}
          >
            Track reviews, monitor your reputation score, and see exactly where your customers are coming from.
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/screenshots/dashboard-hero.png"
              alt="InsightReviews dashboard showing review stats, NPS score, and review funnel"
              style={{ width: '100%', display: 'block' }}
            />
          </Box>
        </Container>
      </Box>

      {/* Features */}
      <Box sx={{ backgroundColor: '#f8fafc', py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography
            variant="overline"
            textAlign="center"
            display="block"
            sx={{ color: '#2563eb', fontWeight: 700, letterSpacing: 2, mb: 1 }}
          >
            Features
          </Typography>
          <Typography
            variant="h3"
            fontWeight={800}
            textAlign="center"
            sx={{ mb: 2, fontSize: { xs: '1.8rem', md: '2.4rem' } }}
          >
            Everything You Need to Grow Your Reputation
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 6, maxWidth: 500, mx: 'auto' }}
          >
            Built specifically for local businesses. No enterprise complexity.
          </Typography>
          <Grid container spacing={3}>
            {features.map((feature) => {
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
                          width: 52,
                          height: 52,
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        <Icon size={24} color="#2563eb" />
                      </Box>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
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
        </Container>
      </Box>

      {/* Testimonials */}
      <Box sx={{ py: { xs: 8, md: 10 }, backgroundColor: 'white' }}>
        <Container maxWidth="lg">
          <Typography
            variant="overline"
            textAlign="center"
            display="block"
            sx={{ color: '#f59e0b', fontWeight: 700, letterSpacing: 2, mb: 1 }}
          >
            Testimonials
          </Typography>
          <Typography
            variant="h3"
            fontWeight={800}
            textAlign="center"
            sx={{ mb: 2, fontSize: { xs: '1.8rem', md: '2.4rem' } }}
          >
            Loved by Business Owners
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 6, maxWidth: 500, mx: 'auto' }}
          >
            See what our customers have to say about InsightReviews.
          </Typography>
          <Grid container spacing={3}>
            {testimonials.map((t) => (
              <Grid key={t.name} size={{ xs: 12, md: 4 }}>
                <Card
                  sx={{
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 'none',
                    position: 'relative',
                    overflow: 'visible',
                  }}
                >
                  <CardContent sx={{ p: 3.5 }}>
                    <Quote
                      size={28}
                      color="#e2e8f0"
                      fill="#e2e8f0"
                      style={{ marginBottom: 8 }}
                    />
                    <Rating value={t.rating} readOnly size="small" sx={{ mb: 2 }} />
                    <Typography
                      variant="body1"
                      sx={{ mb: 3, lineHeight: 1.7, color: '#334155', fontStyle: 'italic' }}
                    >
                      &ldquo;{t.quote}&rdquo;
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: '#2563eb',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                        }}
                      >
                        {t.avatar}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {t.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t.business}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Pricing */}
      <Box
        sx={{
          py: { xs: 8, md: 10 },
          background: 'linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)',
        }}
      >
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
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
            sx={{ mb: 2, fontSize: { xs: '1.8rem', md: '2.4rem' } }}
          >
            Simple, Honest Pricing
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 5 }}>
            One plan. Everything included. No hidden fees.
          </Typography>

          <Card
            sx={{
              p: { xs: 3, md: 5 },
              border: '2px solid',
              borderColor: 'primary.main',
              boxShadow: '0 12px 40px rgba(37,99,235,0.15)',
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <Chip
              label="Most Popular"
              sx={{
                position: 'absolute',
                top: -14,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.8rem',
              }}
            />

            <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1.5 }}>
              Everything Plan
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', mb: 1 }}>
              <Typography variant="h2" fontWeight={900} color="primary" sx={{ fontSize: { xs: '3rem', md: '3.5rem' } }}>
                $29
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ ml: 1 }}>
                /mo
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              per location
            </Typography>
            <Chip
              label="14 days free - no credit card"
              size="small"
              sx={{
                mb: 3,
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            />

            {/* Comparison callout */}
            <Box
              sx={{
                backgroundColor: '#f0fdf4',
                borderRadius: 2,
                p: 2,
                mb: 3,
                border: '1px solid #bbf7d0',
              }}
            >
              <Typography variant="body2" sx={{ color: '#166534', fontWeight: 600 }}>
                Save $100+/month vs. Podium, Birdeye, and other review platforms that charge $249-$499/mo
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'left', mb: 3 }}>
              {[
                'QR code + unlimited SMS review requests',
                'Smart routing to Google, Yelp, Facebook & more',
                'Real-time dashboard & analytics',
                'Public testimonial wall page',
                'Unlimited staff accounts',
                'Private negative feedback capture',
                'Fully customisable branded review page',
                'Email notifications for new reviews',
              ].map((item) => (
                <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.8 }}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Button
              href="/auth/login"
              variant="contained"
              size="large"
              fullWidth
              endIcon={<ArrowRight size={20} />}
              sx={{
                py: 1.5,
                fontSize: '1.05rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(37,99,235,0.4)',
                },
              }}
            >
              Start Your Free Trial
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
              No credit card required. Cancel anytime with one click.
            </Typography>
          </Card>
        </Container>
      </Box>

      {/* FAQ */}
      <Box sx={{ py: { xs: 8, md: 10 }, backgroundColor: 'white' }}>
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
            Ready to Get More 5-Star Reviews?
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.8, maxWidth: 420, mx: 'auto' }}>
            Join local businesses across Melbourne already using InsightReviews to build their online reputation.
          </Typography>
          <Button
            href="/auth/login"
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
            Start Free 14-Day Trial
          </Button>
          <Typography variant="body2" sx={{ mt: 2, opacity: 0.6 }}>
            No credit card required. Setup takes 2 minutes.
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
            <Typography variant="body2" color="text.secondary">
              &copy; {new Date().getFullYear()} InsightReviews. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Sticky Mobile CTA */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid',
          borderColor: 'divider',
          zIndex: 1100,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <Button
          href="/auth/login"
          variant="contained"
          fullWidth
          size="large"
          endIcon={<ArrowRight size={18} />}
          sx={{
            py: 1.3,
            fontWeight: 700,
            fontSize: '0.95rem',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            boxShadow: '0 2px 10px rgba(37,99,235,0.3)',
          }}
        >
          Start Free Trial
        </Button>
      </Box>

      {/* Spacer for sticky CTA on mobile */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, height: 72 }} />
    </Box>
  );
}
