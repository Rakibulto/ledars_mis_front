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

const getMethodTone = (method) => {
  switch (
    String(method || '')
      .trim()
      .toLowerCase()
  ) {
    case 'fifo':
      return { bgcolor: '#d1fae5', color: '#065f46' };
    case 'average cost':
    case 'average':
      return { bgcolor: '#dbeafe', color: '#1e40af' };
    default:
      return { bgcolor: '#fef3c7', color: '#92400e' };
  }
};

const isStaleDate = (value) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() > 30 * 24 * 60 * 60 * 1000;
};

export default function InventoryValuationMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);
  const [selectedValuationId, setSelectedValuationId] = useState(null);
  const rowsPerPage = 10;

  const { data: rawData } = useGetRequest(endpoints.storeInventory.inventory_valuations);
  const INVENTORY_VALUATION = Array.isArray(rawData) ? rawData : rawData?.results || [];
  const tableData = INVENTORY_VALUATION;

  const filtered = useMemo(() => {
    if (!searchTerm) return tableData;
    return tableData.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, tableData]);

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const selectedValuation =
    filtered.find((row) => row.id === selectedValuationId) || filtered[0] || null;

  const valuationSummary = useMemo(
    () => ({
      totalValue: tableData.reduce((sum, row) => sum + toAmount(row.total_value), 0),
      fifo: tableData.filter((row) => String(row.method || '').toLowerCase() === 'fifo').length,
      stale: tableData.filter((row) => isStaleDate(row.last_updated)).length,
    }),
    [tableData]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Inventory Valuation
      </Typography>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        The valuation desk should show current stock value, highlight stale valuation snapshots, and
        make it clear which cost method is controlling the product balance before finance signs off.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:wallet-money-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{formatCurrency(valuationSummary.totalValue)}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total Value
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:box-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{INVENTORY_VALUATION.length}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Products Valued
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:refresh-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{valuationSummary.stale}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Stale Snapshots
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
                    <TableCell>On Hand</TableCell>
                    <TableCell>Unit Cost</TableCell>
                    <TableCell>Total Value</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Last Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((row, idx) => (
                    <TableRow
                      key={row.id || idx}
                      hover
                      selected={row.id === selectedValuation?.id}
                      onClick={() => setSelectedValuationId(row.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{String(row.product_name ?? '')}</TableCell>
                      <TableCell>{String(row.on_hand ?? '')}</TableCell>
                      <TableCell>{formatCurrency(row.unit_cost)}</TableCell>
                      <TableCell>{formatCurrency(row.total_value)}</TableCell>
                      <TableCell>
                        <Chip
                          label={String(row.method ?? 'Unknown')}
                          size="small"
                          sx={{
                            bgcolor: getMethodTone(row.method).bgcolor,
                            color: getMethodTone(row.method).color,
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell>{String(row.last_updated ?? '')}</TableCell>
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
                  Selected Valuation Review
                </Typography>
                {selectedValuation ? (
                  <Stack spacing={1.5}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedValuation.product_name || 'Valued product'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        On hand: {selectedValuation.on_hand || 0}
                      </Typography>
                    </Box>

                    <Chip
                      label={selectedValuation.method || 'Unknown method'}
                      size="small"
                      sx={{
                        width: 'fit-content',
                        bgcolor: getMethodTone(selectedValuation.method).bgcolor,
                        color: getMethodTone(selectedValuation.method).color,
                        fontWeight: 700,
                      }}
                    />

                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          Unit: {formatCurrency(selectedValuation.unit_cost)}
                        </Alert>
                      </Grid>
                      <Grid item xs={6}>
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                          Total: {formatCurrency(selectedValuation.total_value)}
                        </Alert>
                      </Grid>
                    </Grid>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Next control action
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {isStaleDate(selectedValuation.last_updated)
                          ? 'This valuation snapshot is stale. Reconcile recent movements and refresh the cost layer before relying on it for finance reporting.'
                          : String(selectedValuation.method || '').toLowerCase() === 'fifo'
                            ? 'FIFO valuation looks current. Confirm inbound layers are still sequencing correctly against the latest issues.'
                            : 'Review whether this cost method still matches the product policy and confirm the on-hand quantity aligns with warehouse reality.'}
                      </Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a valuation row to review method, quantity, and financial follow-up.
                  </Typography>
                )}
              </Box>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Valuation Control Queue
                </Typography>
                <Stack spacing={1.5}>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    {valuationSummary.fifo} product valuation(s) are currently under FIFO.
                  </Alert>
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    {valuationSummary.stale} valuation snapshot(s) look older than 30 days.
                  </Alert>
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    Total value under control: {formatCurrency(valuationSummary.totalValue)}.
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
