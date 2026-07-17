'use client';

import React, { useMemo } from 'react';
import {
  Bar,
  Pie,
  Cell,
  Line,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  BarChart,
  PieChart,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

import { Box, Card, Grid, Stack, Button, Typography } from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import SummaryCard from '../../_components/summary-card';

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function BeneficiaryAnalyticsMain() {
  const { data: kpiData } = useGetRequest(endpoints.beneficiaries.beneficiary_dashboard_kpis);
  const { data: demographicsData } = useGetRequest(
    endpoints.beneficiaries.beneficiary_demographics
  );
  const { data: analyticsData } = useGetRequest(endpoints.beneficiaries.beneficiary_analytics);

  const monthlyData = useMemo(() => analyticsData?.monthly_data || [], [analyticsData]);

  const demographicsPieData = useMemo(() => {
    const ageGroups = demographicsData?.by_age_group || [];
    return ageGroups.map((item, i) => ({
      name: item.label,
      value: item.value,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [demographicsData]);

  const genderData = useMemo(() => {
    const sexGroups = demographicsData?.by_sex || [];
    return sexGroups.map((item, i) => ({
      name: item.label,
      value: item.value,
      color: i === 0 ? '#8B5CF6' : '#EC4899',
    }));
  }, [demographicsData]);

  const serviceDistribution = useMemo(
    () => analyticsData?.service_distribution || [],
    [analyticsData]
  );

  const locationData = useMemo(() => analyticsData?.location_data || [], [analyticsData]);

  const totalBeneficiaries = kpiData?.total_beneficiaries ?? 0;
  const servicesDelivered = kpiData?.services_delivered_this_month ?? 0;
  const graduationRate = kpiData?.total_beneficiaries
    ? `${((kpiData?.graduated / kpiData?.total_beneficiaries) * 100).toFixed(1)}%`
    : '0%';
  const coverageAreas = kpiData?.districts_covered ?? 0;

  const handleExportDashboard = () => {
    // Implement export logic here
    console.log('Exporting dashboard...');
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      {/* Header */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="#1a1a1a" gutterBottom>
            Beneficiary Analytics & Insights
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive data analysis and visualization
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:download-bold" />}
          onClick={handleExportDashboard}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            bgcolor: '#2563eb',
            fontWeight: 600,
            px: 3,
            '&:hover': {
              bgcolor: '#1d4ed8',
            },
          }}
        >
          Export Dashboard
        </Button>
      </Stack>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Beneficiaries"
            value={totalBeneficiaries.toLocaleString()}
            icon="solar:users-group-rounded-bold-duotone"
            bgcolor="#2563eb90"
            boxShadow="0 4px 20px rgba(37, 99, 235, 0.3)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Services This Month"
            value={servicesDelivered.toLocaleString()}
            icon="solar:pulse-bold-duotone"
            bgcolor="#10b98190"
            boxShadow="0 4px 20px rgba(16, 185, 129, 0.3)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Graduation Rate"
            value={graduationRate}
            icon="solar:graph-up-bold-duotone"
            bgcolor="#8b5cf690"
            boxShadow="0 4px 20px rgba(139, 92, 246, 0.3)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Districts Covered"
            value={coverageAreas}
            icon="solar:map-point-bold-duotone"
            bgcolor="#f9731690"
            boxShadow="0 4px 20px rgba(249, 115, 22, 0.3)"
          />
        </Grid>
      </Grid>

      {/* Main Charts */}
      <Grid container spacing={3} mb={3}>
        {/* Monthly Trend - Line Chart */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
              height: '100%',
            }}
          >
            <Typography variant="h6" fontWeight={600} color="#1a1a1a" mb={3}>
              Beneficiary Growth Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '0.875rem' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '0.875rem' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
                <Line
                  type="monotone"
                  dataKey="registered"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Registered"
                  dot={{ fill: '#3B82F6', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="served"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Served"
                  dot={{ fill: '#10B981', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="graduated"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="Graduated"
                  dot={{ fill: '#F59E0B', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Service Distribution - Bar Chart */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
              height: '100%',
            }}
          >
            <Typography variant="h6" fontWeight={600} color="#1a1a1a" mb={3}>
              Service Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="service" stroke="#6b7280" style={{ fontSize: '0.875rem' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '0.875rem' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" name="Beneficiaries" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Age Demographics - Pie Chart */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
              height: '100%',
            }}
          >
            <Typography variant="h6" fontWeight={600} color="#1a1a1a" mb={3}>
              Age Demographics
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={demographicsPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {demographicsPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Gender Distribution - Pie Chart */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
              height: '100%',
            }}
          >
            <Typography variant="h6" fontWeight={600} color="#1a1a1a" mb={3}>
              Gender Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Location Distribution - Horizontal Bar Chart */}
      <Card
        sx={{
          p: 3,
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
        }}
      >
        <Typography variant="h6" fontWeight={600} color="#1a1a1a" mb={3}>
          Geographic Distribution
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={locationData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" stroke="#6b7280" style={{ fontSize: '0.875rem' }} />
            <YAxis
              dataKey="location"
              type="category"
              width={120}
              stroke="#6b7280"
              style={{ fontSize: '0.875rem' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="count" fill="#10B981" name="Beneficiaries" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </Box>
  );
}
