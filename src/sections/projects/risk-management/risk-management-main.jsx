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
import TableContainer from '@mui/material/TableContainer';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import SummaryCard from '../../_components/summary-card';

const EP = endpoints.pm;

const PRIORITY_COLOR = { High: 'error', Medium: 'warning', Low: 'success' };

export default function RiskManagementPage() {
  const { data, loading, error } = useGetRequest(EP.projects);
  const { data: actData } = useGetRequest(EP.project_activities);

  const projects = useMemo(() => data?.results || data || [], [data]);
  const activities = useMemo(() => actData?.results || actData || [], [actData]);

  const risks = useMemo(() => {
    const now = new Date();
    return activities
      .filter((a) => a.status !== 'Completed' && a.due_date && new Date(a.due_date) < now)
      .map((a) => {
        const proj = projects.find((p) => p.id === a.project);
        const daysOverdue = Math.ceil((now - new Date(a.due_date)) / (1000 * 60 * 60 * 24));
        return { ...a, projectName: proj?.name || '-', daysOverdue };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [activities, projects]);

  const delayedProjects = useMemo(() => {
    const projIds = [...new Set(risks.map((r) => r.project))];
    return projIds.length;
  }, [risks]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Risk Management
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Identify and track project risks based on overdue activities
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Risks"
            value={risks.length}
            icon="solar:danger-triangle-bold-duotone"
            color="#ef4444"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="High Priority"
            value={risks.filter((r) => r.priority === 'High').length}
            icon="solar:shield-warning-bold-duotone"
            color="#dc2626"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Affected Projects"
            value={delayedProjects}
            icon="solar:folder-error-bold-duotone"
            color="#f97316"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Active Projects"
            value={projects.filter((p) => p.status === 'Active').length}
            icon="solar:folder-bold-duotone"
            color="#10b981"
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
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Overdue Activities (Risks)
          </Typography>
        </Stack>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Activity</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Days Overdue</TableCell>
                <TableCell>Responsible</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {risks.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{r.title}</Typography>
                  </TableCell>
                  <TableCell>{r.projectName}</TableCell>
                  <TableCell>
                    <Chip
                      label={r.priority || 'Medium'}
                      size="small"
                      color={PRIORITY_COLOR[r.priority] || 'default'}
                    />
                  </TableCell>
                  <TableCell>{r.due_date}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${r.daysOverdue}d`}
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{r.responsible_person || '-'}</TableCell>
                </TableRow>
              ))}
              {risks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No overdue activities found
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
