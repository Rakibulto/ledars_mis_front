'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
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

export default function BudgetFinancePage() {
  const { data, loading, error } = useGetRequest(EP.projects);
  const projects = useMemo(() => data?.results || data || [], [data]);

  const totalBudget = useMemo(
    () => projects.reduce((s, p) => s + Number(p.budget || 0), 0),
    [projects]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Budget & Finance
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Project budget tracking and financial overview
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
            title="Total Budget"
            value={`৳${totalBudget.toLocaleString()}`}
            icon="solar:dollar-minimalistic-bold-duotone"
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
        <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb' }}>
          <Typography variant="h6" fontWeight={600}>
            Project Budgets
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 700 }}>Project</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Budget
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Donor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {p.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.code}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      ৳{Number(p.budget || 0).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{p.status}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{p.donor || '—'}</Typography>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="text.secondary">No projects found</Typography>
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
