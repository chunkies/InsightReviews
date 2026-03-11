import { Box, Container, Typography } from '@mui/material';
import { LoginForm } from '@/components/auth/login-form';

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
        <Typography variant="h4" fontWeight={700} gutterBottom>
          InsightReviews
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {isSignup ? 'Create your account to get started' : 'Sign in to manage your reviews'}
        </Typography>
        <LoginForm isSignup={isSignup} />
      </Box>
    </Container>
  );
}
