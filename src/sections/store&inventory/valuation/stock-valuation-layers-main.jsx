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

const toAmount = (value) => Number(value || 0);

const formatCurrency = (value) => `BDT ${toAmount(value).toLocaleString()}`;

const getAgeDays = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
};

export default function StockValuationLayersMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const rowsPerPage = 10;

  const { data: rawData } = useGetRequest(endpoints.storeInventory.inventory_valuations);
  const INVENTORY_VALUATION = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const layers = [
    {
      id: 1,
      product: 'Rice (50kg Bag)',
      lot: 'LOT-2025-REL-001',
      date: '2025-01-15',
      qty_in: 200,
      qty_out: 100,
      remaining: 100,
      unit_cost: 2750,
      total_value: 275000,
    },
    {
      id: 2,
      product: 'Rice (50kg Bag)',
      lot: 'LOT-2025-REL-002',
      date: '2025-03-05',
      qty_in: 300,
      qty_out: 50,
      remaining: 250,
      unit_cost: 2800,
      total_value: 700000,
    },
    {
      id: 3,
      product: 'Paracetamol 500mg',
      lot: 'LOT-2025-MED-001',
      date: '2025-01-10',
      qty_in: 100,
      qty_out: 30,
      remaining: 70,
      unit_cost: 115,
      total_value: 8050,
    },
    {
      id: 4,
      product: 'Paracetamol 500mg',
      lot: 'LOT-2025-MED-002',
      date: '2025-03-05',
      qty_in: 100,
      qty_out: 0,
      remaining: 100,
      unit_cost: 120,
      total_value: 12000,
    },
    {
      id: 5,
      product: 'Hygiene Kit (Family)',
      lot: 'LOT-2025-HYG-001',
      date: '2025-02-01',
      qty_in: 150,
      qty_out: 50,
      remaining: 100,
      unit_cost: 850,
      total_value: 85000,
    },
  ];
  const tableData = layers;

  const filtered = useMemo(() => {
    if (!searchTerm) return tableData;
    return tableData.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, tableData]);

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const selectedLayer = filtered.find((row) => row.id === selectedLayerId) || filtered[0] || null;

  const layerSummary = useMemo(
    () => ({
      value: tableData.reduce((sum, row) => sum + toAmount(row.total_value), 0),
      aged: tableData.filter((row) => (getAgeDays(row.date) || 0) > 60).length,
      open: tableData.filter((row) => Number(row.remaining || 0) > 0).length,
    }),
    [tableData]
  );

  const consumptionPct = selectedLayer
    ? Math.round(
        (Number(selectedLayer.qty_out || 0) / Math.max(Number(selectedLayer.qty_in || 0), 1)) * 100
      )
    : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Stock Valuation Layers
      </Typography>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        The layer desk should show which inbound cost layers still hold value, where aged stock
        value is sitting too long, and which lots should be consumed or investigated before
        valuation drifts.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:layers-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{layers.length}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total Layers
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:wallet-money-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{formatCurrency(layerSummary.value)}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total Value
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:alarm-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{layerSummary.aged}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Aged Layers
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
                    <TableCell>Lot</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Qty In</TableCell>
                    <TableCell>Qty Out</TableCell>
                    <TableCell>Remaining</TableCell>
                    <TableCell>Unit Cost</TableCell>
                    <TableCell>Total Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((row, idx) => (
                    <TableRow
                      key={row.id || idx}
                      hover
                      selected={row.id === selectedLayer?.id}
                      onClick={() => setSelectedLayerId(row.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{String(row.product ?? '')}</TableCell>
                      <TableCell>{String(row.lot ?? '')}</TableCell>
                      <TableCell>{String(row.date ?? '')}</TableCell>
                      <TableCell>{String(row.qty_in ?? '')}</TableCell>
                      <TableCell>{String(row.qty_out ?? '')}</TableCell>
                      <TableCell>
                        <Chip
                          label={String(row.remaining ?? '')}
                          size="small"
                          sx={{
                            bgcolor: Number(row.remaining || 0) > 0 ? '#dbeafe' : '#f3f4f6',
                            color: Number(row.remaining || 0) > 0 ? '#1e40af' : '#374151',
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(row.unit_cost)}</TableCell>
                      <TableCell>{formatCurrency(row.total_value)}</TableCell>
                    </TableRow>
                  ))}
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
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
                  Selected Layer Review
                </Typography>
                {selectedLayer ? (
                  <Stack spacing={1.5}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedLayer.product}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedLayer.lot}
                      </Typography>
                    </Box>

                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          Age: {getAgeDays(selectedLayer.date) ?? 'N/A'}d
                        </Alert>
                      </Grid>
                      <Grid item xs={6}>
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                          Used: {consumptionPct}%
                        </Alert>
                      </Grid>
                    </Grid>

                    <Typography variant="body2" color="text.secondary">
                      Remaining value: {formatCurrency(selectedLayer.total_value)}
                    </Typography>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Next control action
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(getAgeDays(selectedLayer.date) || 0) > 60
                          ? 'This layer is aged. Confirm whether the remaining quantity should be consumed, discounted, or investigated for slow movement risk.'
                          : Number(selectedLayer.remaining || 0) <= 0
                            ? 'This layer is fully consumed. Validate that it can be closed cleanly in the valuation trail.'
                            : 'This layer still carries value. Track the next outbound movement and ensure the remaining balance reconciles with stock on hand.'}
                      </Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a valuation layer to review stock age, consumption, and remaining value.
                  </Typography>
                )}
              </Box>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Layer Control Queue
                </Typography>
                <Stack spacing={1.5}>
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    {layerSummary.open} valuation layer(s) still hold remaining stock value.
                  </Alert>
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    {layerSummary.aged} layer(s) are older than 60 days.
                  </Alert>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Total value held in visible layers: {formatCurrency(layerSummary.value)}.
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
