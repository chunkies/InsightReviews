import { Box, Skeleton } from '@mui/material';

export default function TestimonialsLoading() {
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Skeleton variant="text" width={160} height={36} />
          <Skeleton variant="text" width={280} height={20} />
        </Box>
        <Skeleton variant="rounded" width={140} height={40} sx={{ borderRadius: 2 }} />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} variant="rounded" height={160} sx={{ borderRadius: 3 }} />
        ))}
      </Box>
    </Box>
  );
}
