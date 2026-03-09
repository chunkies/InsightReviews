import { Box, Container, Typography } from '@mui/material';

export default function ReviewNotFound() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Page Not Found
          </Typography>
          <Typography variant="body1">
            This review link is no longer active or the business doesn&apos;t exist.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
