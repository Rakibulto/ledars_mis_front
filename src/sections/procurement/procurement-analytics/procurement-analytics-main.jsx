/* eslint-disable perfectionist/sort-named-imports */

'use client';

import { useMemo } from 'react';

import { Box, Card, CardContent, Divider, Grid, Stack, Typography } from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import SummaryCard from '../../_components/summary-card';

const EP = endpoints.procurement_management;

function formatCurrency(amount) {
  const value = Number(amount || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProcurementAnalyticsMain() {
  const {
    data: dashData,
    loading: dashLoading,
    error: dashError,
  } = useGetRequest(EP.procurement_dashboard);

  const topSuppliers = useMemo(() => {
    const suppliers = dashData?.suppliers;

    if (!suppliers) {
      return [];
    }

    return [
      { name: 'Total Suppliers', orders: suppliers.total ?? 0 },
      { name: 'Active Suppliers', orders: suppliers.active ?? 0 },
      { name: 'Average Rating', orders: Number(suppliers.avg_rating ?? 0).toFixed(1) },
    ];
  }, [dashData]);

  const procurementByCategory = useMemo(() => {
    if (!dashData) {
      return [];
    }

    return [
      { category: 'Work Orders', value: dashData.work_orders?.total_value ?? 0 },
      { category: 'Awards', value: dashData.awards?.total_value ?? 0 },
      { category: 'Payments', value: dashData.payments?.total_amount ?? 0 },
    ];
  }, [dashData]);

  const summaryCards = useMemo(
    () => ({
      totalPRs: dashData?.purchase_requisitions?.total ?? 0,
      totalPOs: dashData?.work_orders?.total ?? 0,
      procurementValue: formatCurrency(
        (dashData?.awards?.total_value ?? 0) + (dashData?.payments?.total_amount ?? 0)
      ),
      avgProcessingTime: `${dashData?.pending_approvals ?? 0} pending`,
    }),
    [dashData]
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
          Procurement Analytics
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Insights and performance metrics for procurement activities
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total PRs"
            value={summaryCards.totalPRs}
            icon="solar:cart-large-2-bold-duotone"
            color="#2563eb"
            loading={dashLoading}
            error={dashError}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total POs"
            value={summaryCards.totalPOs}
            icon="solar:chart-bold-duotone"
            color="#10b981"
            loading={dashLoading}
            error={dashError}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Procurement Value"
            value={summaryCards.procurementValue}
            icon="solar:dollar-minimalistic-bold-duotone"
            color="#8b5cf6"
            loading={dashLoading}
            error={dashError}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Avg. Processing Time"
            value={summaryCards.avgProcessingTime}
            icon="solar:graph-up-bold-duotone"
            color="#f97316"
            loading={dashLoading}
            error={dashError}
          />
        </Grid>
      </Grid>

      {/* Analytics Sections */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Top Suppliers by Volume
              </Typography>
              <Stack spacing={2}>
                {topSuppliers.map((supplier, index) => (
                  <Box key={index}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        {supplier.name}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {supplier.orders} Orders
                      </Typography>
                    </Stack>
                    {index < topSuppliers.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
                {topSuppliers.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No supplier analytics available.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Procurement by Category
              </Typography>
              <Stack spacing={2}>
                {procurementByCategory.map((item, index) => (
                  <Box key={index}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        {item.category}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(item.value)}
                      </Typography>
                    </Stack>
                    {index < procurementByCategory.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
                {procurementByCategory.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No procurement totals available.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
