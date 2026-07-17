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

const getForecastTone = (status) => {
  switch (String(status || '').toLowerCase()) {
    case 'low':
      return { bgcolor: '#fee2e2', color: '#991b1b' };
    case 'healthy':
      return { bgcolor: '#d1fae5', color: '#065f46' };
    default:
      return { bgcolor: '#fef3c7', color: '#92400e' };
  }
};

export default function ForecastedStockMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);
  const [selectedForecastId, setSelectedForecastId] = useState(null);
  const rowsPerPage = 10;

  const { data: rawData } = useGetRequest(endpoints.storeInventory.forecasted_stock);
  const tableData = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const filtered = useMemo(() => {
    if (!searchTerm) return tableData;
    return tableData.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, tableData]);

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const selectedForecast =
    filtered.find((row) => row.id === selectedForecastId) || filtered[0] || null;

  const forecastSummary = useMemo(
    () => ({
      low: tableData.filter((row) => String(row.status || '').toLowerCase() === 'low').length,
      negativeCover: tableData.filter((row) => Number(row.days_of_stock || 0) < 7).length,
      inboundHelp: tableData.filter((row) => Number(row.incoming || 0) > 0).length,
    }),
    [tableData]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Forecasted Stock
      </Typography>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        The forecast desk should surface where incoming stock will actually relieve shortages, which
        products are at immediate cover risk, and which forecasts still require planner
        intervention.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:chart-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{tableData.length}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Products Tracked
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:danger-triangle-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">
              {tableData.filter((f) => f.status === 'Low').length}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Low Stock
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
                    <TableCell>Current</TableCell>
                    <TableCell>Incoming</TableCell>
                    <TableCell>Outgoing</TableCell>
                    <TableCell>Forecasted</TableCell>
                    <TableCell>Days of Stock</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((row, idx) => (
                    <TableRow
                      key={row.id || idx}
                      hover
                      selected={row.id === selectedForecast?.id}
                      onClick={() => setSelectedForecastId(row.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{String(row.product_name ?? '')}</TableCell>
                      <TableCell>{String(row.current_stock ?? '')}</TableCell>
                      <TableCell>{String(row.incoming ?? '')}</TableCell>
                      <TableCell>{String(row.outgoing ?? '')}</TableCell>
                      <TableCell>{String(row.forecasted ?? '')}</TableCell>
                      <TableCell>{String(row.days_of_stock ?? '')}</TableCell>
                      <TableCell>
                        <Chip
                          label={String(row.status ?? 'Unknown')}
                          size="small"
                          sx={{
                            bgcolor: getForecastTone(row.status).bgcolor,
                            color: getForecastTone(row.status).color,
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
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
                  Selected Forecast Review
                </Typography>
                {selectedForecast ? (
                  <Stack spacing={1.5}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedForecast.product_name || 'Forecasted product'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Days of stock: {selectedForecast.days_of_stock || 0}
                      </Typography>
                    </Box>
                    <Chip
                      label={selectedForecast.status || 'Unknown'}
                      size="small"
                      sx={{
                        width: 'fit-content',
                        bgcolor: getForecastTone(selectedForecast.status).bgcolor,
                        color: getForecastTone(selectedForecast.status).color,
                        fontWeight: 700,
                      }}
                    />
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      Incoming relief: {selectedForecast.incoming || 0}
                    </Alert>
                    <Divider />
                    <Typography variant="body2" color="text.secondary">
                      {Number(selectedForecast.days_of_stock || 0) < 7
                        ? 'This product is at immediate cover risk. Expedite inbound planning or trigger replenishment action now.'
                        : 'This forecast is currently stable. Continue monitoring the net effect of outgoing demand versus inbound relief.'}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a forecast line to review coverage risk and inbound relief.
                  </Typography>
                )}
              </Box>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Forecast Control Queue
                </Typography>
                <Stack spacing={1.5}>
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {forecastSummary.low} product(s) are already flagged low.
                  </Alert>
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    {forecastSummary.negativeCover} product(s) have fewer than 7 days of cover.
                  </Alert>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    {forecastSummary.inboundHelp} product(s) have incoming stock that may relieve
                    risk.
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
