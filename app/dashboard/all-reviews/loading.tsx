import { Box, Skeleton } from '@mui/material';

export default function Loading() {
  return (
    <Box>
      <Skeleton variant="text" width={200} height={40} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={350} height={24} sx={{ mb: 3 }} />
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} variant="rounded" height={100} sx={{ mb: 2, borderRadius: 3 }} />
      ))}
    </Box>
  );
}
