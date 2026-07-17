/* eslint-disable perfectionist/sort-named-imports */

'use client';

import React, { useMemo, useState } from 'react';

import {
  Box,
  Card,
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
  Pagination,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import MuiAutocomplete from 'src/components/hook-form/mui-autocomplete';

import SummaryCard from '../../_components/summary-card';

export default function StockManagementMain() {
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);

  // Table state
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);

  // Fetch products from API
  const { data: rawProducts, isLoading: loading } = useGetRequest(
    endpoints.storeInventory.products
  );
  const stockItems = useMemo(
    () => (Array.isArray(rawProducts) ? rawProducts : rawProducts?.results || []),
    [rawProducts]
  );

  // Filter options
  const categoryOptions = useMemo(() => {
    const categories = [...new Set(stockItems.map((item) => item.category))];
    return categories.map((cat) => ({ id: cat, name: cat }));
  }, [stockItems]);

  const statusOptions = useMemo(
    () => [
      { id: 'Good', name: 'Good' },
      { id: 'Low', name: 'Low' },
      { id: 'Critical', name: 'Critical' },
      { id: 'Overstock', name: 'Overstock' },
    ],
    []
  );

  // Filtered and paginated data
  const filteredItems = useMemo(
    () =>
      stockItems.filter((item) => {
        const matchesSearch =
          (item.itemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.itemCode || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !filterCategory || item.category === filterCategory.id;
        const matchesStatus = !filterStatus || item.status === filterStatus.id;
        return matchesSearch && matchesCategory && matchesStatus;
      }),
    [stockItems, searchTerm, filterCategory, filterStatus]
  );

  // Pagination
  const ROWS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredItems.length / ROWS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * ROWS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredItems, page]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeDense = (event) => {
    setDense(event.target.checked);
  };

  // Statistics
  const stats = useMemo(
    () => ({
      total: stockItems.length,
      good: stockItems.filter((i) => i.status === 'Good').length,
      low: stockItems.filter((i) => i.status === 'Low').length,
      critical: stockItems.filter((i) => i.status === 'Critical').length,
    }),
    [stockItems]
  );

  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'Good':
        return { bgcolor: '#d1fae5', color: '#065f46' };
      case 'Low':
        return { bgcolor: '#fef3c7', color: '#92400e' };
      case 'Critical':
        return { bgcolor: '#fee2e2', color: '#991b1b' };
      case 'Overstock':
        return { bgcolor: '#dbeafe', color: '#1e40af' };
      default:
        return { bgcolor: '#f3f4f6', color: '#374151' };
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" color="#1a1a1a" fontWeight={700} gutterBottom>
          Stock Management
        </Typography>
        <Typography variant="body1" color="#6b7280">
          Monitor current stock levels and inventory status
        </Typography>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Items"
            value={stats.total}
            icon="solar:box-bold-duotone"
            iconColor="#2563eb"
            gradientFrom="#2563eb"
            gradientTo="#1d4ed8"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Good Stock"
            value={stats.good}
            icon="solar:chart-2-bold-duotone"
            iconColor="#10b981"
            gradientFrom="#10b981"
            gradientTo="#059669"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Low Stock"
            value={stats.low}
            icon="solar:graph-down-bold-duotone"
            iconColor="#eab308"
            gradientFrom="#eab308"
            gradientTo="#ca8a04"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Critical"
            value={stats.critical}
            icon="solar:danger-triangle-bold-duotone"
            iconColor="#ef4444"
            gradientFrom="#ef4444"
            gradientTo="#dc2626"
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3, border: '1px solid #e5e7eb', borderRadius: 2, boxShadow: 'none' }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                placeholder="Search stock items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" sx={{ color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MuiAutocomplete
                options={categoryOptions}
                value={filterCategory}
                onChange={(event, newValue) => setFilterCategory(newValue)}
                placeholder="All Categories"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MuiAutocomplete
                options={statusOptions}
                value={filterStatus}
                onChange={(event, newValue) => setFilterStatus(newValue)}
                placeholder="All Status"
              />
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Table */}
      <Card sx={{ border: '1px solid #e5e7eb', borderRadius: 2, boxShadow: 'none' }}>
        <TableContainer>
          <Table size={dense ? 'small' : 'medium'}>
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Item Details</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Current Stock
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Reorder Level
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Stock Value
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Transaction</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedItems.map((item) => (
                <TableRow
                  key={item.itemCode}
                  sx={{
                    '&:hover': {
                      bgcolor: '#f9fafb',
                    },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="#1a1a1a">
                      {item.itemName}
                    </Typography>
                    <Typography variant="caption" color="#6b7280">
                      {item.itemCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="#6b7280">
                      {item.category}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {item.currentStock} {item.unit}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="#6b7280">
                      {item.reorderLevel} {item.unit}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      ৳{item.totalValue.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="#6b7280">
                      {new Date(item.lastTransaction).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        ...getStatusColor(item.status),
                        display: 'inline-block',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 6,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      {item.status}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <FormControl>
            <FormControlLabel
              control={<Switch checked={dense} onChange={handleChangeDense} />}
              label="Dense"
            />
          </FormControl>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" color="#6b7280">
              Showing {(page - 1) * ROWS_PER_PAGE + 1}-
              {Math.min(page * ROWS_PER_PAGE, filteredItems.length)} of {filteredItems.length}
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handleChangePage}
              color="primary"
            />
          </Stack>
        </Box>
      </Card>
    </Box>
  );
}
