import { Box, Container, Typography, Chip, Grid } from '@mui/material';
import { LoginForm } from '@/components/auth/login-form';
import { Star, CheckCircle2, Shield, Zap } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { mode } = await searchParams;
  const isSignup = mode === 'signup';

  return (
    <Container maxWidth={isSignup ? 'md' : 'sm'}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1565c0 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Star size={20} color="#fff" fill="#fff" />
          </Box>
          <Typography variant="h5" fontWeight={800} color="primary">
            InsightReviews
          </Typography>
        </Box>

        {isSignup ? (
          <Grid container spacing={4} sx={{ mt: 2, alignItems: 'center' }}>
            {/* Left side — value props (hidden on mobile, form takes full width) */}
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
                Get more 5-star reviews starting today
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Join local businesses that use InsightReviews to turn happy customers into public reviews — and catch unhappy ones before they go online.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {[
                  { icon: Zap, title: 'Setup in 2 minutes', desc: 'Add your business, get your QR code, and start collecting reviews today.' },
                  { icon: Star, title: 'Smart review routing', desc: '4-5 stars go to Google. 1-3 stars stay private so you can follow up.' },
                  { icon: Shield, title: '14 days free, cancel anytime', desc: 'No lock-in contracts. Full access to every feature during your trial.' },
                ].map((item) => (
                  <Box key={item.title} sx={{ display: 'flex', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <item.icon size={18} color="#2563eb" />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* Social proof */}
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', gap: 0.3, mb: 0.5 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} color="#fbbf24" fill="#fbbf24" />
                  ))}
                </Box>
                <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                  &quot;A 0.5-star increase on Google correlates with 5-9% more revenue for local businesses.&quot;
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  — Harvard Business School
                </Typography>
              </Box>
            </Grid>

            {/* Right side — form */}
            <Grid size={{ xs: 12, md: 6 }}>
              {/* Mobile-only header */}
              <Box sx={{ display: { xs: 'block', md: 'none' }, textAlign: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                  Start your 14-day free trial
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  14 days free. Setup takes 2 minutes.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mb: 1 }}>
                  {['QR code at the counter', 'Positive reviews \u2192 Google', 'Negative stays private'].map((f) => (
                    <Chip
                      key={f}
                      label={f}
                      size="small"
                      icon={<CheckCircle2 size={12} color="#16a34a" />}
                      sx={{ fontSize: '0.7rem', backgroundColor: '#f0fdf4', color: '#166534' }}
                    />
                  ))}
                </Box>
                {/* Mobile testimonial */}
                <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, backgroundColor: 'action.hover', border: '1px solid', borderColor: 'divider', textAlign: 'left' }}>
                  <Box sx={{ display: 'flex', gap: 0.3, mb: 0.5 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={12} color="#fbbf24" fill="#fbbf24" />
                    ))}
                  </Box>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: '0.75rem', lineHeight: 1.5 }}>
                    &quot;We went from 3.8 to 4.6 stars on Google in 6 weeks. The QR code at the counter made it effortless.&quot;
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    — Sarah M., cafe owner, Melbourne
                  </Typography>
                </Box>
              </Box>
              <LoginForm isSignup={isSignup} />
            </Grid>
          </Grid>
        ) : (
          <>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, mt: 2 }}>
              Sign in to manage your reviews
            </Typography>
            <LoginForm isSignup={isSignup} />
          </>
        )}
      </Box>
    </Container>
  );
}
