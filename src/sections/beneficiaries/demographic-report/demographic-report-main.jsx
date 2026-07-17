'use client';

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

import { Box, Card, Grid, Typography } from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import SummaryCard from '../../_components/summary-card';

const COLORS = [
  '#2065D1',
  '#FF6384',
  '#36A2EB',
  '#FFCE56',
  '#4BC0C0',
  '#9966FF',
  '#FF9F40',
  '#EA5545',
];

export default function DemographicReportMain() {
  const { data: rawKpi, loading: kpiLoading } = useGetRequest(
    endpoints.beneficiaries.beneficiary_dashboard_kpis
  );
  const kpi = rawKpi || {};

  const { data: rawDemographics, loading: demoLoading } = useGetRequest(
    endpoints.beneficiaries.beneficiary_demographics
  );
  const DEMOGRAPHICS = rawDemographics || {};

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Demographic Report
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Comprehensive demographic breakdown of all beneficiaries
      </Typography>

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
          <SummaryCard title="Male" value={kpi.male} icon="solar:user-bold" color="info" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard title="Female" value={kpi.female} icon="solar:women-bold" color="error" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Children"
            value={kpi.children}
            icon="solar:baby-bold"
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Gender Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={DEMOGRAPHICS.by_sex}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {DEMOGRAPHICS.by_sex.map((entry, idx) => (
                    <Cell key={entry.label} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Age Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={DEMOGRAPHICS.by_age_group}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#2065D1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              By Division
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={DEMOGRAPHICS.by_division} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="label" type="category" width={90} />
                <Tooltip />
                <Bar dataKey="value" fill="#36A2EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Vulnerability Types
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={DEMOGRAPHICS.by_vulnerability} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="label" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#FF9F40" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={DEMOGRAPHICS.by_status}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {DEMOGRAPHICS.by_status.map((entry, idx) => (
                    <Cell key={entry.label} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
