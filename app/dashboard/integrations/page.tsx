import { Box, Typography } from '@mui/material';
import { PageHeader } from '@/components/shared/page-header';
import { Link2 } from 'lucide-react';

export default function IntegrationsPage() {
  return (
    <Box>
      <PageHeader
        title="Integrations"
        subtitle="Connect your review platforms to see all reviews in one place"
      />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 10,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #2563eb20, #7c3aed20)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Link2 size={28} color="#7c3aed" />
        </Box>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
          Coming Soon
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
          Platform integrations with Google, Yelp, Facebook, and more are on the way. Stay tuned!
        </Typography>
      </Box>
    </Box>
  );
}
