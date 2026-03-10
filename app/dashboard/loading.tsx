import { Box, Skeleton } from '@mui/material';

export default function DashboardLoading() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width={180} height={36} />
        <Skeleton variant="text" width={280} height={20} />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: 3 }} />
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
      </Box>
    </Box>
  );
}
