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

const getReasonTone = (reason) => {
  const normalized = String(reason || '').toLowerCase();
  if (normalized.includes('expired') || normalized.includes('damage')) {
    return { bgcolor: '#fee2e2', color: '#991b1b' };
  }
  if (normalized.includes('quality') || normalized.includes('breakage')) {
    return { bgcolor: '#fef3c7', color: '#92400e' };
  }
  return { bgcolor: '#dbeafe', color: '#1e40af' };
};

export default function WastageReportMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);
  const [selectedWasteId, setSelectedWasteId] = useState(null);
  const rowsPerPage = 10;

  const { data: rawData } = useGetRequest(endpoints.storeInventory.scrap_records);
  const SCRAP_RECORDS = Array.isArray(rawData) ? rawData : rawData?.results || [];
  const tableData = SCRAP_RECORDS;

  const filtered = useMemo(() => {
    if (!searchTerm) return tableData;
    return tableData.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, tableData]);

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const selectedWaste = filtered.find((row) => row.id === selectedWasteId) || filtered[0] || null;

  const wastageSummary = useMemo(
    () => ({
      totalValue: tableData.reduce((sum, row) => sum + toAmount(row.value), 0),
      damaged: tableData.filter((row) =>
        String(row.reason || '')
          .toLowerCase()
          .includes('damage')
      ).length,
      expired: tableData.filter((row) =>
        String(row.reason || '')
          .toLowerCase()
          .includes('expired')
      ).length,
    }),
    [tableData]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Wastage Report
      </Typography>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        The wastage desk should highlight the value being lost, separate avoidable damage from
        expiry-driven loss, and show which waste events need corrective action from warehouse or
        quality teams.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:trash-bin-trash-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{SCRAP_RECORDS.length}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total Wastage
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
            <Typography variant="h4">
              {`BDT ${SCRAP_RECORDS.reduce((s, r) => s + r.value, 0).toLocaleString()}`}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total Value
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
                    <TableCell>Reference</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Value (BDT)</TableCell>
                    <TableCell>Scrapped By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((row, idx) => (
                    <TableRow
                      key={row.id || idx}
                      hover
                      selected={row.id === selectedWaste?.id}
                      onClick={() => setSelectedWasteId(row.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{String(row.reference ?? '')}</TableCell>
                      <TableCell>{String(row.date ?? '')}</TableCell>
                      <TableCell>{String(row.product_name ?? '')}</TableCell>
                      <TableCell>{String(row.quantity ?? '')}</TableCell>
                      <TableCell>
                        <Chip
                          label={String(row.reason ?? 'N/A')}
                          size="small"
                          sx={{
                            bgcolor: getReasonTone(row.reason).bgcolor,
                            color: getReasonTone(row.reason).color,
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(row.value)}</TableCell>
                      <TableCell>{String(row.scrapped_by ?? '')}</TableCell>
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
                  Selected Wastage Review
                </Typography>
                {selectedWaste ? (
                  <Stack spacing={1.5}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedWaste.reference || 'Waste event'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedWaste.product_name || 'Product not captured'}
                      </Typography>
                    </Box>
                    <Chip
                      label={selectedWaste.reason || 'N/A'}
                      size="small"
                      sx={{
                        width: 'fit-content',
                        bgcolor: getReasonTone(selectedWaste.reason).bgcolor,
                        color: getReasonTone(selectedWaste.reason).color,
                        fontWeight: 700,
                      }}
                    />
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      Loss value: {formatCurrency(selectedWaste.value)}
                    </Alert>
                    <Divider />
                    <Typography variant="body2" color="text.secondary">
                      {String(selectedWaste.reason || '')
                        .toLowerCase()
                        .includes('expired')
                        ? 'This is an expiry-driven loss. Review FEFO execution and shelf-life monitoring for this product group.'
                        : 'This waste event should be reviewed for preventable handling or storage issues before loss repeats.'}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a wastage event to review loss cause and corrective follow-up.
                  </Typography>
                )}
              </Box>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Wastage Control Queue
                </Typography>
                <Stack spacing={1.5}>
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    Total loss value in view: {formatCurrency(wastageSummary.totalValue)}.
                  </Alert>
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    {wastageSummary.expired} event(s) are driven by expiry.
                  </Alert>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    {wastageSummary.damaged} event(s) are damage-related and need operational
                    review.
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
