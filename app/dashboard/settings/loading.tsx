import { Box, Skeleton } from '@mui/material';

export default function SettingsLoading() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width={120} height={36} />
        <Skeleton variant="text" width={300} height={20} />
      </Box>
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} variant="rounded" height={180} sx={{ borderRadius: 3, mb: 2 }} />
      ))}
    </Box>
  );
}
