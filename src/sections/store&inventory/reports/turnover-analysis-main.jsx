'use client';

import React, { useMemo, useState } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Table,
  Switch,
  Divider,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Pagination,
  Typography,
  InputAdornment,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const getTurnoverTone = (category) => {
  switch (String(category || '').toLowerCase()) {
    case 'fast moving':
      return { bgcolor: '#d1fae5', color: '#065f46' };
    case 'slow moving':
      return { bgcolor: '#fee2e2', color: '#991b1b' };
    default:
      return { bgcolor: '#fef3c7', color: '#92400e' };
  }
};

export default function TurnoverAnalysisMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const rowsPerPage = 10;

  const { data: rawData } = useGetRequest(endpoints.storeInventory.products);
  const PRODUCTS = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const turnover = PRODUCTS.slice(0, 10).map((p, index) => ({
    id: p.id || index + 1,
    product: p.name,
    avg_stock: Number(p.on_hand || 0),
    annual_consumption: Number(p.on_hand || 0) * 12,
    turnover_ratio: 12.0,
    avg_days_in_stock: 30,
    category: Number(p.on_hand || 0) > 40 ? 'Fast Moving' : 'Medium Moving',
  }));
  const tableData = turnover;

  const filtered = useMemo(() => {
    if (!searchTerm) return tableData;
    return tableData.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, tableData]);

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const selectedProduct =
    filtered.find((row) => row.id === selectedProductId) || filtered[0] || null;

  const turnoverSummary = useMemo(
    () => ({
      fast: tableData.filter((row) => row.category === 'Fast Moving').length,
      slow: tableData.filter((row) => row.avg_days_in_stock > 45).length,
      averageRatio:
        tableData.length > 0
          ? (
              tableData.reduce((sum, row) => sum + Number(row.turnover_ratio || 0), 0) /
              tableData.length
            ).toFixed(1)
          : '0.0',
    }),
    [tableData]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Turnover Analysis
      </Typography>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        The turnover desk should show which products are moving quickly, which ones are tying up
        stock for too long, and where planners need to rebalance replenishment behavior.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:chart-square-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{turnover.length}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Products Analyzed
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 2, borderRadius: 3, border: '1px solid #e5e7eb' }}>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                size="small"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:magnifer-bold-duotone" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 300 }}
              />
            </Stack>

            <TableContainer>
              <Table size={dense ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Avg Stock</TableCell>
                    <TableCell>Annual Consumption</TableCell>
                    <TableCell>Turnover Ratio</TableCell>
                    <TableCell>Avg Days in Stock</TableCell>
                    <TableCell>Category</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((row, idx) => (
                    <TableRow
                      key={row.id || idx}
                      hover
                      selected={row.id === selectedProduct?.id}
                      onClick={() => setSelectedProductId(row.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{String(row.product ?? '')}</TableCell>
                      <TableCell>{String(row.avg_stock ?? '')}</TableCell>
                      <TableCell>{String(row.annual_consumption ?? '')}</TableCell>
                      <TableCell>{String(row.turnover_ratio ?? '')}</TableCell>
                      <TableCell>{String(row.avg_days_in_stock ?? '')}</TableCell>
                      <TableCell>
                        <Chip
                          label={String(row.category ?? '')}
                          size="small"
                          sx={{
                            bgcolor: getTurnoverTone(row.category).bgcolor,
                            color: getTurnoverTone(row.category).color,
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          No records found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch checked={dense} onChange={(event) => setDense(event.target.checked)} />
                }
                label="Dense"
              />

              {filtered.length > rowsPerPage && (
                <Pagination
                  count={Math.ceil(filtered.length / rowsPerPage)}
                  page={page}
                  onChange={(e, v) => setPage(v)}
                  color="primary"
                />
              )}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Selected Product Review
                </Typography>
                {selectedProduct ? (
                  <Stack spacing={1.5}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedProduct.product}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Turnover monitoring snapshot
                      </Typography>
                    </Box>
                    <Chip
                      label={selectedProduct.category}
                      size="small"
                      sx={{
                        width: 'fit-content',
                        bgcolor: getTurnoverTone(selectedProduct.category).bgcolor,
                        color: getTurnoverTone(selectedProduct.category).color,
                        fontWeight: 700,
                      }}
                    />
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      Turnover ratio: {selectedProduct.turnover_ratio}
                    </Alert>
                    <Divider />
                    <Typography variant="body2" color="text.secondary">
                      {selectedProduct.avg_days_in_stock > 45
                        ? 'This product is staying in stock too long. Review reorder timing and downstream demand assumptions.'
                        : 'This product is turning over within a healthy range. Keep replenishment cadence aligned with current consumption.'}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a product to review turnover behavior and planning follow-up.
                  </Typography>
                )}
              </Box>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Turnover Control Queue
                </Typography>
                <Stack spacing={1.5}>
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    {turnoverSummary.fast} product(s) are currently fast moving.
                  </Alert>
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    {turnoverSummary.slow} product(s) show stock staying longer than 45 days.
                  </Alert>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Average turnover ratio across visible products: {turnoverSummary.averageRatio}.
                  </Alert>
                </Stack>
              </Box>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
