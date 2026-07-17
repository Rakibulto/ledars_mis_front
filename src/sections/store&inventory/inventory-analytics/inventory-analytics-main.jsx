/* eslint-disable perfectionist/sort-named-imports */

'use client';

import { useMemo } from 'react';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  LinearProgress,
  Divider,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import SummaryCard from '../../_components/summary-card';

export function InventoryAnalyticsMain() {
  const EP = endpoints.storeInventory;
  const { data: rawKpi, loading: kpiLoading } = useGetRequest(EP.dashboard_kpi);
  const { data: rawProducts, loading: prodLoading } = useGetRequest(EP.products);
  const { data: rawMoves, loading: movesLoading } = useGetRequest(EP.stock_moves);
  const { data: rawCategories } = useGetRequest(EP.item_category);

  const kpi = rawKpi || {};
  const products = useMemo(
    () => (Array.isArray(rawProducts) ? rawProducts : rawProducts?.results || []),
    [rawProducts]
  );
  const moves = useMemo(
    () => (Array.isArray(rawMoves) ? rawMoves : rawMoves?.results || []),
    [rawMoves]
  );
  const categories = useMemo(
    () => (Array.isArray(rawCategories) ? rawCategories : rawCategories?.results || []),
    [rawCategories]
  );

  const stockByCategory = useMemo(() => {
    if (!categories.length) return [];
    return categories.slice(0, 6).map((cat) => {
      const count = products.filter(
        (p) => p.category === cat.id || p.category_name === cat.name
      ).length;
      return { category: cat.name, value: count };
    });
  }, [categories, products]);

  const maxCategoryValue = useMemo(
    () => Math.max(...stockByCategory.map((s) => s.value), 1),
    [stockByCategory]
  );

  const recentMovements = useMemo(
    () =>
      moves.slice(0, 5).map((m) => ({
        number: m.reference || `Move #${m.id}`,
        date: m.date || m.created_at || '',
        qty: `${Number(m.quantity) >= 0 ? '+' : ''}${m.quantity} items`,
      })),
    [moves]
  );

  const loading = kpiLoading || prodLoading || movesLoading;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
          Inventory Analytics
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Insights and performance metrics for inventory management
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Stock Value"
            value={
              loading
                ? '...'
                : `৳${kpi.total_stock_value || products.reduce((s, p) => s + Number(p.unit_price || 0) * Number(p.quantity || 0), 0).toLocaleString()}`
            }
            subtitle={`Across ${products.length} items`}
            icon="solar:dollar-minimalistic-bold-duotone"
            color="#2563eb"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Stock Movements"
            value={loading ? '...' : moves.length}
            subtitle="Total recorded"
            icon="solar:graph-up-bold-duotone"
            color="#10b981"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Categories"
            value={loading ? '...' : categories.length}
            subtitle="Item categories"
            icon="solar:danger-triangle-bold-duotone"
            color="#ef4444"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Active Items"
            value={loading ? '...' : products.length}
            subtitle="In stock"
            icon="solar:box-bold-duotone"
            color="#8b5cf6"
          />
        </Grid>
      </Grid>

      {/* Analytics Sections */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Stock by Category
              </Typography>
              <Stack spacing={3}>
                {stockByCategory.map((item, index) => (
                  <Box key={index}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {item.category}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.value} items
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((item.value / maxCategoryValue) * 100, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#2563eb',
                          borderRadius: 1,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Recent Stock Movements
              </Typography>
              <Stack spacing={0}>
                {recentMovements.map((movement, index) => (
                  <Box key={index}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ py: 2 }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {movement.number}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {movement.date}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: movement.qty.startsWith('+') ? 'success.main' : 'error.main',
                        }}
                      >
                        {movement.qty}
                      </Typography>
                    </Stack>
                    {index < recentMovements.length - 1 && <Divider />}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
