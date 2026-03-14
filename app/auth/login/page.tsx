import { Box, Container, Typography, Chip } from '@mui/material';
import { LoginForm } from '@/components/auth/login-form';
import { Star, CheckCircle2 } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { mode } = await searchParams;
  const isSignup = mode === 'signup';

  return (
    <Container maxWidth="sm">
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
          <>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, mt: 2 }}>
              Start your 14-day free trial
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              No card required. Setup takes 2 minutes.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center', mb: 3 }}>
              {['QR code collection', 'Smart routing', 'Dashboard & analytics'].map((f) => (
                <Chip
                  key={f}
                  label={f}
                  size="small"
                  icon={<CheckCircle2 size={12} color="#16a34a" />}
                  sx={{ fontSize: '0.7rem', backgroundColor: '#f0fdf4', color: '#166534' }}
                />
              ))}
            </Box>
          </>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, mt: 2 }}>
            Sign in to manage your reviews
          </Typography>
        )}

        <LoginForm isSignup={isSignup} />
      </Box>
    </Container>
  );
}
