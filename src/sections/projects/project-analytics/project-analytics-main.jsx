'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import SummaryCard from '../../_components/summary-card';

const EP = endpoints.pm;

export default function ProjectAnalyticsPage() {
  const { data, loading, error } = useGetRequest(EP.projects);
  const { data: actData } = useGetRequest(EP.project_activities);

  const projects = useMemo(() => data?.results || data || [], [data]);
  const activities = useMemo(() => actData?.results || actData || [], [actData]);

  const stats = useMemo(() => {
    const byStatus = {};
    projects.forEach((p) => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    });
    const completedActs = activities.filter((a) => a.status === 'Completed').length;
    const avgProgress = activities.length
      ? Math.round(activities.reduce((s, a) => s + (a.progress || 0), 0) / activities.length)
      : 0;
    return { byStatus, completedActs, avgProgress, totalActs: activities.length };
  }, [projects, activities]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Project Analytics
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Performance insights across all projects
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Projects"
            value={projects.length}
            icon="solar:chart-2-bold-duotone"
            color="#2563eb"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Activities"
            value={stats.totalActs}
            icon="solar:graph-up-bold-duotone"
            color="#8b5cf6"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Completed Acts"
            value={stats.completedActs}
            icon="solar:check-circle-bold-duotone"
            color="#10b981"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Avg Progress"
            value={`${stats.avgProgress}%`}
            icon="solar:target-bold-duotone"
            color="#f97316"
            loading={loading}
            error={error}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={2}>
              Projects by Status
            </Typography>
            <Stack spacing={1.5}>
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <Stack key={status} direction="row" justifyContent="space-between">
                  <Typography variant="body2">{status}</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {count}
                  </Typography>
                </Stack>
              ))}
              {Object.keys(stats.byStatus).length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No data
                </Typography>
              )}
            </Stack>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={2}>
              Activity Status Breakdown
            </Typography>
            <Stack spacing={1.5}>
              {['Pending', 'In Progress', 'Completed'].map((s) => {
                const count = activities.filter((a) => a.status === s).length;
                return (
                  <Stack key={s} direction="row" justifyContent="space-between">
                    <Typography variant="body2">{s}</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {count}
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
