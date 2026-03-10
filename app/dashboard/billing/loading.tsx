import { Box, Skeleton } from '@mui/material';

export default function BillingLoading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
      <Box sx={{ width: '100%', maxWidth: 520 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Skeleton variant="text" width={100} height={36} sx={{ mx: 'auto' }} />
          <Skeleton variant="text" width={240} height={20} sx={{ mx: 'auto' }} />
        </Box>
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton variant="rounded" height={240} sx={{ borderRadius: 3 }} />
      </Box>
    </Box>
  );
}
