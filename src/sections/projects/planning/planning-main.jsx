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

const statusColors = {
  Active: 'success',
  Planning: 'info',
  'On Hold': 'warning',
  Completed: 'default',
};

export default function PlanningPage() {
  const { data, loading, error } = useGetRequest(EP.projects);
  const { data: actData } = useGetRequest(EP.project_activities);

  const projects = useMemo(() => data?.results || data || [], [data]);
  const activities = useMemo(() => actData?.results || actData || [], [actData]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Project Planning
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Plan and track project timelines and milestones
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
            title="Active Activities"
            value={activities.filter((a) => a.status !== 'Completed').length}
            icon="solar:graph-up-bold-duotone"
            color="#8b5cf6"
            loading={loading}
            error={error}
          />
        </Grid>
      </Grid>

      <Stack spacing={3}>
        {projects.map((project) => {
          const projActivities = activities.filter((a) => a.project === project.id);
          const progress = projActivities.length
            ? Math.round(
                projActivities.reduce((s, a) => s + (a.progress || 0), 0) / projActivities.length
              )
            : 0;

          return (
            <Card
              key={project.id}
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e5e7eb',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {project.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {project.code} • {project.start_date} → {project.end_date}
                  </Typography>
                </Box>
                <Chip
                  label={project.status}
                  color={statusColors[project.status] || 'default'}
                  size="small"
                />
              </Stack>
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption">Overall Progress</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {progress}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ height: 8, borderRadius: 1, bgcolor: '#e5e7eb' }}
                />
              </Box>
              <Grid container spacing={1}>
                {projActivities.map((a) => (
                  <Grid key={a.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Box sx={{ p: 1.5, bgcolor: '#f9fafb', borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {a.title}
                      </Typography>
                      <Stack direction="row" justifyContent="space-between" mt={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          {a.status}
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {a.progress || 0}%
                        </Typography>
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>
          );
        })}
        {!loading && projects.length === 0 && (
          <Typography color="text.secondary" textAlign="center" py={4}>
            No projects found
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
