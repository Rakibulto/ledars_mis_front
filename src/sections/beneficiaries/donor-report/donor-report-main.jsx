'use client';

import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  LinearProgress,
  TableContainer,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import SummaryCard from '../../_components/summary-card';

export default function DonorReportMain() {
  const { data: rawData, loading } = useGetRequest(endpoints.beneficiaries.donor_reports);
  const DONOR_REPORTS = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const totalBudget = DONOR_REPORTS.reduce((s, d) => s + d.total_budget, 0);
  const totalSpent = DONOR_REPORTS.reduce((s, d) => s + d.spent, 0);
  const avgAchievement = DONOR_REPORTS.length
    ? Math.round(DONOR_REPORTS.reduce((s, d) => s + d.achievement_pct, 0) / DONOR_REPORTS.length)
    : 0;

  const fmtCurrency = (v) => `৳${(v / 1000000).toFixed(1)}M`;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Donor Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Project-wise donor reporting and budget utilization
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Budget"
            value={fmtCurrency(totalBudget)}
            icon="solar:wallet-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Spent"
            value={fmtCurrency(totalSpent)}
            icon="solar:card-send-bold"
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Avg Achievement"
            value={`${avgAchievement}%`}
            icon="solar:chart-bold"
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Active Donors"
            value={DONOR_REPORTS.length}
            icon="solar:hand-heart-bold"
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {DONOR_REPORTS.map((d) => {
          const utilization = Math.round((d.spent / d.total_budget) * 100);
          return (
            <Grid size={{ xs: 12, md: 6 }} key={d.id}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {d.donor_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {d.project_name}
                      </Typography>
                    </Box>
                    <Chip label={d.reporting_period} size="small" />
                  </Stack>

                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Budget Utilization
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {utilization}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={utilization}
                      color={utilization > 80 ? 'warning' : 'primary'}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Spent: {fmtCurrency(d.spent)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Budget: {fmtCurrency(d.total_budget)}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Achievement
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {d.achievement_pct}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={d.achievement_pct}
                      color={d.achievement_pct >= 80 ? 'success' : 'info'}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Stack>

                  <Stack direction="row" spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Iconify
                        icon="solar:users-group-rounded-bold"
                        width={18}
                        color="primary.main"
                      />
                      <Typography variant="body2">
                        {d.beneficiaries_reached.toLocaleString()} reached
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Iconify icon="solar:calendar-bold" width={18} color="text.secondary" />
                      <Typography variant="body2">{d.reporting_period}</Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Card sx={{ mt: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Donor</TableCell>
                <TableCell>Project</TableCell>
                <TableCell align="right">Budget</TableCell>
                <TableCell align="right">Spent</TableCell>
                <TableCell align="center">Utilization</TableCell>
                <TableCell align="center">Achievement</TableCell>
                <TableCell align="center">Reached</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {DONOR_REPORTS.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Typography fontWeight="bold">{row.donor_name}</Typography>
                  </TableCell>
                  <TableCell>{row.project_name}</TableCell>
                  <TableCell align="right">{fmtCurrency(row.total_budget)}</TableCell>
                  <TableCell align="right">{fmtCurrency(row.spent)}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${Math.round((row.spent / row.total_budget) * 100)}%`}
                      size="small"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${row.achievement_pct}%`}
                      size="small"
                      color={row.achievement_pct >= 80 ? 'success' : 'info'}
                    />
                  </TableCell>
                  <TableCell align="center">{row.beneficiaries_reached.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
