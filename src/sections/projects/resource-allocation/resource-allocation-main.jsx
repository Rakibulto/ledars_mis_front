'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import SummaryCard from '../../_components/summary-card';

const EP = endpoints.pm;

export default function ResourceAllocationPage() {
  const { data, loading, error } = useGetRequest(EP.projects);
  const { data: actData } = useGetRequest(EP.project_activities);

  const projects = useMemo(() => data?.results || data || [], [data]);
  const activities = useMemo(() => actData?.results || actData || [], [actData]);

  const allocation = useMemo(
    () =>
      projects.map((p) => {
        const pActs = activities.filter((a) => a.project === p.id);
        const assignees = [...new Set(pActs.map((a) => a.responsible_person).filter(Boolean))];
        return { ...p, activityCount: pActs.length, assignees };
      }),
    [projects, activities]
  );

  const totalAssignees = useMemo(
    () => [...new Set(activities.map((a) => a.responsible_person).filter(Boolean))].length,
    [activities]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Resource Allocation
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Staff and resource assignment across projects
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Projects"
            value={projects.length}
            icon="solar:folder-bold-duotone"
            color="#2563eb"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Activities"
            value={activities.length}
            icon="solar:document-bold-duotone"
            color="#8b5cf6"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Assigned Staff"
            value={totalAssignees}
            icon="solar:users-group-rounded-bold-duotone"
            color="#10b981"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Active Projects"
            value={projects.filter((p) => p.status === 'Active').length}
            icon="solar:play-circle-bold-duotone"
            color="#f97316"
            loading={loading}
            error={error}
          />
        </Grid>
      </Grid>

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Activities</TableCell>
                <TableCell>Assigned Staff</TableCell>
                <TableCell>Budget</TableCell>
                <TableCell>Utilization</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allocation.map((row) => {
                const pActs = activities.filter((a) => a.project === row.id);
                const done = pActs.filter((a) => a.status === 'Completed').length;
                const pct = pActs.length ? Math.round((done / pActs.length) * 100) : 0;
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{row.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={row.status} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{row.activityCount}</TableCell>
                    <TableCell>{row.assignees.length}</TableCell>
                    <TableCell>
                      {row.budget ? `UGX ${Number(row.budget).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5} sx={{ minWidth: 120 }}>
                        <LinearProgress variant="determinate" value={pct} />
                        <Typography variant="caption">{pct}%</Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              {allocation.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No projects found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
