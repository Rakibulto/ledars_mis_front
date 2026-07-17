'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

import { WelcomeHeaderSkeleton } from './welcome-header';

function KpiSkeleton() {
  return (
    <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack direction="row" justifyContent="space-between">
        <Box sx={{ flex: 1 }}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="45%" height={32} sx={{ mt: 0.5 }} />
        </Box>
        <Skeleton variant="rounded" width={44} height={44} />
      </Stack>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
      <Skeleton width={140} height={22} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={260} />
    </Card>
  );
}

export default function DashboardSkeleton() {
  return (
    <Stack spacing={3}>
      <WelcomeHeaderSkeleton />

      <Skeleton variant="rounded" height={44} width="100%" sx={{ maxWidth: 520, borderRadius: 2 }} />

      <Box>
        <Skeleton width={120} height={22} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {Array.from({ length: 10 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2.4 }}>
              <KpiSkeleton />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box>
        <Skeleton width={100} height={22} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, md: 6 }}>
              <ChartSkeleton />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Stack>
  );
}
