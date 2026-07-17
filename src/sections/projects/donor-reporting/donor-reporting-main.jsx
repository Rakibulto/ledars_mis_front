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

export default function DonorReportingPage() {
  const { data, loading, error } = useGetRequest(EP.projects);
  const { data: actData } = useGetRequest(EP.project_activities);

  const projects = useMemo(() => data?.results || data || [], [data]);
  const activities = useMemo(() => actData?.results || actData || [], [actData]);

  const donorGroups = useMemo(() => {
    const groups = {};
    projects.forEach((p) => {
      const donor = p.donor || 'Unspecified';
      if (!groups[donor]) groups[donor] = { projects: [], totalBudget: 0 };
      groups[donor].projects.push(p);
      groups[donor].totalBudget += Number(p.budget) || 0;
    });
    return groups;
  }, [projects]);

  const totalBudget = useMemo(
    () => projects.reduce((s, p) => s + (Number(p.budget) || 0), 0),
    [projects]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Donor Reporting
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Donor-wise project reports & budget summaries
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Donors"
            value={Object.keys(donorGroups).length}
            icon="solar:hand-money-bold-duotone"
            color="#2563eb"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Projects"
            value={projects.length}
            icon="solar:folder-bold-duotone"
            color="#8b5cf6"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Budget"
            value={`UGX ${totalBudget.toLocaleString()}`}
            icon="solar:wallet-bold-duotone"
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

      {Object.entries(donorGroups).map(([donor, group]) => (
        <Card
          key={donor}
          sx={{
            mb: 3,
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb',
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ p: 2, borderBottom: '1px solid #f3f4f6' }}
          >
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {donor}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {group.projects.length} project(s) &bull; Budget: UGX{' '}
                {group.totalBudget.toLocaleString()}
              </Typography>
            </Box>
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Budget</TableCell>
                  <TableCell>Activities</TableCell>
                  <TableCell>Progress</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {group.projects.map((p) => {
                  const pActs = activities.filter((a) => a.project === p.id);
                  const done = pActs.filter((a) => a.status === 'Completed').length;
                  const pct = pActs.length ? Math.round((done / pActs.length) * 100) : 0;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Typography variant="subtitle2">{p.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={p.status} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        {p.budget ? `UGX ${Number(p.budget).toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>{pActs.length}</TableCell>
                      <TableCell>
                        <Stack spacing={0.5} sx={{ minWidth: 100 }}>
                          <LinearProgress variant="determinate" value={pct} />
                          <Typography variant="caption">{pct}%</Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ))}
      {Object.keys(donorGroups).length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No projects found
        </Typography>
      )}
    </Box>
  );
}
