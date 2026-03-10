import { Box, Skeleton } from '@mui/material';

export default function ReviewsLoading() {
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Skeleton variant="text" width={140} height={36} />
          <Skeleton variant="text" width={240} height={20} />
        </Box>
        <Skeleton variant="rounded" width={120} height={40} sx={{ borderRadius: 2 }} />
      </Box>
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 3, mb: 1.5 }} />
      ))}
    </Box>
  );
}
