'use client';

import { useMemo } from 'react';
import {
  Pie,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  PieChart,
  BarChart,
  ResponsiveContainer,
} from 'recharts';

import {
  Box,
  Card,
  Grid,
  Chip,
  Alert,
  Stack,
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
  LinearProgress,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import SummaryCard from '../../_components/summary-card';

const PIE_COLORS = [
  '#2065D1',
  '#FF6384',
  '#36A2EB',
  '#FFCE56',
  '#4BC0C0',
  '#9966FF',
  '#FF9F40',
  '#EA5545',
];
const MOCK_KPI = {
  total_beneficiaries: 0,
  active_beneficiaries: 0,
  new_this_month: 0,
  graduated: 0,
  households_served: 0,
  active_cases: 0,
  pending_complaints: 0,
  satisfaction_rate: 0,
};
const MOCK_DEMOGRAPHICS = {
  by_sex: [],
  by_status: [],
  by_division: [],
  by_vulnerability: [],
};

export default function BeneficiaryDashboardMain() {
  const { data: rawKpi, loading: kpiLoading } = useGetRequest(
    endpoints.beneficiaries.beneficiary_dashboard_kpis
  );
  const kpi = rawKpi || MOCK_KPI;

  const { data: rawDemographics, loading: demoLoading } = useGetRequest(
    endpoints.beneficiaries.beneficiary_demographics
  );
  const DEMOGRAPHICS = rawDemographics || MOCK_DEMOGRAPHICS;

  const { data: rawFollowUp, loading: followUpLoading } = useGetRequest(
    endpoints.beneficiaries.follow_up_schedules
  );
  const FOLLOW_UP_SCHEDULE = Array.isArray(rawFollowUp) ? rawFollowUp : rawFollowUp?.results || [];

  const { data: rawCases, loading: casesLoading } = useGetRequest(
    endpoints.beneficiaries.case_management
  );
  const CASE_FILES = Array.isArray(rawCases) ? rawCases : rawCases?.results || [];

  const bySex = Array.isArray(DEMOGRAPHICS.by_sex) ? DEMOGRAPHICS.by_sex : [];
  const byStatus = Array.isArray(DEMOGRAPHICS.by_status) ? DEMOGRAPHICS.by_status : [];
  const byDivision = Array.isArray(DEMOGRAPHICS.by_division) ? DEMOGRAPHICS.by_division : [];
  const byVulnerability = Array.isArray(DEMOGRAPHICS.by_vulnerability)
    ? DEMOGRAPHICS.by_vulnerability
    : [];
  const usesFallbackData = !rawKpi || !rawDemographics;
  const isLoading = kpiLoading || demoLoading || followUpLoading || casesLoading;

  const overdueTasks = useMemo(
    () => FOLLOW_UP_SCHEDULE.filter((f) => f.status === 'Overdue'),
    [FOLLOW_UP_SCHEDULE]
  );

  const criticalCases = useMemo(
    () => CASE_FILES.filter((c) => c.priority === 'Critical' && c.status !== 'Resolved'),
    [CASE_FILES]
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Beneficiary Dashboard
      </Typography>

      {usesFallbackData && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Some dashboard services returned incomplete data. Charts and summary cards are showing
          safe fallback values where needed.
        </Alert>
      )}

      {isLoading && <LinearProgress sx={{ mb: 3 }} />}

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Beneficiaries"
            value={kpi.total_beneficiaries}
            icon="solar:users-group-rounded-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Active Beneficiaries"
            value={kpi.active_beneficiaries}
            icon="solar:user-check-bold"
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="New This Month"
            value={kpi.new_this_month}
            icon="solar:user-plus-bold"
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Graduated"
            value={kpi.graduated}
            icon="solar:diploma-bold"
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Households Served"
            value={kpi.households_served}
            icon="solar:home-bold"
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Active Cases"
            value={kpi.active_cases}
            icon="solar:folder-open-bold"
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Pending Complaints"
            value={kpi.pending_complaints}
            icon="solar:danger-triangle-bold"
            color="error"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Satisfaction Rate"
            value={`${kpi.satisfaction_rate}%`}
            icon="solar:like-bold"
            color="success"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Gender Distribution */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Gender Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={bySex}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {bySex.map((entry, index) => (
                    <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Status Distribution */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Status Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={byStatus}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {byStatus.map((entry, index) => (
                    <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Division Coverage */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              By Division
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byDivision} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="label" type="category" width={80} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#2065D1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Overdue Follow-ups */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Iconify icon="solar:alarm-bold" width={24} color="error.main" />
              <Typography variant="h6">Overdue Follow-ups</Typography>
            </Stack>
            {overdueTasks.length === 0 ? (
              <Typography color="text.secondary">No overdue tasks</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Beneficiary</TableCell>
                      <TableCell>Case Worker</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Priority</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {overdueTasks.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.beneficiary_name}</TableCell>
                        <TableCell>{row.case_worker}</TableCell>
                        <TableCell>{row.follow_up_date}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.priority}
                            size="small"
                            color={row.priority === 'Critical' ? 'error' : 'warning'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>

        {/* Critical Cases */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Iconify icon="solar:danger-bold" width={24} color="error.main" />
              <Typography variant="h6">Critical Cases</Typography>
            </Stack>
            {criticalCases.length === 0 ? (
              <Typography color="text.secondary">No critical cases</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Beneficiary</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Case Worker</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {criticalCases.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.beneficiary_name}</TableCell>
                        <TableCell>{row.case_type}</TableCell>
                        <TableCell>{row.case_worker}</TableCell>
                        <TableCell>
                          <Chip label={row.status} size="small" color="warning" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>

        {/* Vulnerability Distribution */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Vulnerability Types
            </Typography>
            <Grid container spacing={2}>
              {byVulnerability.map((v) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={v.label}>
                  <Stack spacing={0.5}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">{v.label}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {v.value}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={
                        kpi.total_beneficiaries ? (v.value / kpi.total_beneficiaries) * 100 : 0
                      }
                      sx={{ height: 6, borderRadius: 1 }}
                    />
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
