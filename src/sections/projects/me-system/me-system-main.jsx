'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import SummaryCard from '../../_components/summary-card';

const EP = endpoints.pm;

export default function MESystemPage() {
  const { data, loading, error } = useGetRequest(EP.projects);
  const { data: actData } = useGetRequest(EP.project_activities);

  const projects = useMemo(() => data?.results || data || [], [data]);
  const activities = useMemo(() => actData?.results || actData || [], [actData]);

  const stats = useMemo(() => {
    const total = activities.length;
    const completed = activities.filter((a) => a.status === 'Completed').length;
    const inProgress = activities.filter((a) => a.status === 'In Progress').length;
    const avgProgress = total
      ? Math.round(activities.reduce((s, a) => s + (a.progress || 0), 0) / total)
      : 0;
    return { total, completed, inProgress, avgProgress };
  }, [activities]);

  const projectMetrics = useMemo(
    () =>
      projects.map((p) => {
        const pActs = activities.filter((a) => a.project === p.id);
        const done = pActs.filter((a) => a.status === 'Completed').length;
        const progress = pActs.length ? Math.round((done / pActs.length) * 100) : 0;
        return { ...p, totalActivities: pActs.length, completed: done, progress };
      }),
    [projects, activities]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        M&E System
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Monitoring & Evaluation — track project outcomes and activity progress
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Activities"
            value={stats.total}
            icon="solar:checklist-bold-duotone"
            color="#2563eb"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Completed"
            value={stats.completed}
            icon="solar:check-circle-bold-duotone"
            color="#10b981"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="In Progress"
            value={stats.inProgress}
            icon="solar:refresh-circle-bold-duotone"
            color="#f97316"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Avg Progress"
            value={`${stats.avgProgress}%`}
            icon="solar:target-bold-duotone"
            color="#8b5cf6"
            loading={loading}
            error={error}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {projectMetrics.map((pm) => (
          <Grid key={pm.id} size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e5e7eb',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {pm.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {pm.code}
                  </Typography>
                </Box>
                <Chip label={pm.status} size="small" variant="outlined" />
              </Stack>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Activities: {pm.totalActivities}</Typography>
                  <Typography variant="body2">Completed: {pm.completed}</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={pm.progress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {pm.progress}% complete
                </Typography>
              </Stack>
            </Card>
          </Grid>
        ))}
        {projectMetrics.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No projects found
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
