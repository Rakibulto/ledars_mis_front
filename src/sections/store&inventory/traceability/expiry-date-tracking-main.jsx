'use client';

import React, { useMemo, useState } from 'react';

import {
  Box,
  Chip,
  Card,
  Grid,
  Alert,
  Stack,
  Table,
  Switch,
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

const normalizeText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const getUrgencyTone = (urgency) => {
  const normalized = normalizeText(urgency);

  if (normalized === 'expired') return { bgcolor: '#fee2e2', color: '#991b1b' };
  if (normalized === 'critical') return { bgcolor: '#fef3c7', color: '#92400e' };
  if (normalized === 'warning') return { bgcolor: '#dbeafe', color: '#1d4ed8' };

  return { bgcolor: '#d1fae5', color: '#065f46' };
};

export default function ExpiryDateTrackingMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const rowsPerPage = 10;

  const { data: rawData } = useGetRequest(endpoints.storeInventory.lot_serials);
  const LOT_SERIAL_NUMBERS = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const rows = LOT_SERIAL_NUMBERS.filter((l) => l.expiry_date).map((l) => {
    const days = Math.ceil((new Date(l.expiry_date) - new Date()) / 86400000);
    return {
      ...l,
      days_remaining: days,
      urgency: days < 0 ? 'Expired' : days < 30 ? 'Critical' : days < 90 ? 'Warning' : 'OK',
    };
  });
  const tableData = rows;

  const filtered = useMemo(() => {
    if (!searchTerm) return tableData;
    return tableData.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, tableData]);

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const selectedEntry = filtered.find((row) => row.id === selectedEntryId) || filtered[0] || null;

  const expiryControls = useMemo(
    () => ({
      total: rows.length,
      expired: rows.filter((row) => normalizeText(row.urgency) === 'expired').length,
      critical: rows.filter((row) => normalizeText(row.urgency) === 'critical').length,
      warning: rows.filter((row) => normalizeText(row.urgency) === 'warning').length,
    }),
    [rows]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Expiry Date Tracking
      </Typography>

      <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
        The expiry desk should prioritize FEFO action, show near-expiry exceptions, and help teams
        decide whether to issue, isolate, or scrap lots before they become losses.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:calendar-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{rows.length}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total Tracked
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
              {rows.filter((r) => r.urgency === 'Expired').length}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Expired
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:clock-circle-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">
              {rows.filter((r) => r.urgency === 'Critical' || r.urgency === 'Warning').length}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Expiring Soon
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
                placeholder="Search expiry records..."
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
                    <TableCell>Lot/Serial</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    <TableCell>Days Remaining</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Quantity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((row, idx) => (
                    <TableRow
                      key={row.id || idx}
                      hover
                      selected={row.id === selectedEntry?.id}
                      onClick={() => setSelectedEntryId(row.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{String(row.number ?? '')}</TableCell>
                      <TableCell>{String(row.product_name ?? '')}</TableCell>
                      <TableCell>{String(row.expiry_date ?? '')}</TableCell>
                      <TableCell>{String(row.days_remaining ?? '')}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={String(row.urgency ?? '')}
                          sx={{ ...getUrgencyTone(row.urgency), fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>{String(row.quantity ?? '')}</TableCell>
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
                control={<Switch checked={dense} onChange={(e) => setDense(e.target.checked)} />}
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
                  Selected FEFO Review
                </Typography>
                {selectedEntry ? (
                  <Stack spacing={1.5}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedEntry.number}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedEntry.product_name}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={selectedEntry.urgency}
                      sx={{
                        width: 'fit-content',
                        ...getUrgencyTone(selectedEntry.urgency),
                        fontWeight: 700,
                      }}
                    />
                    <Alert
                      severity={
                        normalizeText(selectedEntry.urgency) === 'expired' ? 'error' : 'warning'
                      }
                      sx={{ borderRadius: 2 }}
                    >
                      {selectedEntry.days_remaining} days remaining
                    </Alert>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#eff6ff' }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Recommended Action
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {normalizeText(selectedEntry.urgency) === 'expired'
                          ? 'Isolate immediately and trigger disposal or recall review.'
                          : normalizeText(selectedEntry.urgency) === 'critical'
                            ? 'Issue using FEFO priority or quarantine for manager review.'
                            : 'Keep on FEFO watchlist and monitor aging bands.'}
                      </Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a record to review FEFO action guidance.
                  </Typography>
                )}
              </Box>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Expiry Control Queue
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fef2f2' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Expired
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {expiryControls.expired} lots already require isolation or disposal action.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fff7ed' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Critical
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {expiryControls.critical} lots are in immediate FEFO priority range.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#eff6ff' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Warning
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {expiryControls.warning} lots should be monitored in upcoming issue planning.
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
