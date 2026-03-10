import { Box, Skeleton } from '@mui/material';

export default function CollectLoading() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width={180} height={36} />
        <Skeleton variant="text" width={320} height={20} />
      </Box>
      <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3, mb: 2 }} />
      <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
    </Box>
  );
}
