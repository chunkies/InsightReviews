import { Box, Skeleton } from '@mui/material';

export default function Loading() {
  return (
    <Box>
      <Skeleton variant="text" width={200} height={40} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={350} height={24} sx={{ mb: 3 }} />
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" width={320} height={220} sx={{ borderRadius: 3 }} />
        ))}
      </Box>
    </Box>
  );
}
