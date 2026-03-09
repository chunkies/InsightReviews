import { Box, Container, Typography, Button } from '@mui/material';

export default function AuthErrorPage() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography variant="h5" gutterBottom>
          Authentication Error
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Something went wrong during sign in. Please try again.
        </Typography>
        <Button href="/auth/login" variant="contained">
          Back to Login
        </Button>
      </Box>
    </Container>
  );
}
