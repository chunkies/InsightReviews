import { Box, Skeleton } from '@mui/material';

export default function StaffLoading() {
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Skeleton variant="text" width={100} height={36} />
          <Skeleton variant="text" width={220} height={20} />
        </Box>
        <Skeleton variant="rounded" width={140} height={40} sx={{ borderRadius: 2 }} />
      </Box>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: 3, mb: 1.5 }} />
      ))}
    </Box>
  );
}
