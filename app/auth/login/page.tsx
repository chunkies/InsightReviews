import { Box, Container, Typography } from '@mui/material';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
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
          Sign in to manage your reviews
        </Typography>
        <LoginForm />
      </Box>
    </Container>
  );
}
