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

const normalizeStatus = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const getStatusTone = (status) => {
  switch (normalizeStatus(status)) {
    case 'posted':
      return { bgcolor: '#d1fae5', color: '#065f46' };
    case 'draft':
      return { bgcolor: '#f3f4f6', color: '#374151' };
    default:
      return { bgcolor: '#fef3c7', color: '#92400e' };
  }
};

export default function LandedCostReportMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const rowsPerPage = 10;

  const { data: rawData } = useGetRequest(endpoints.storeInventory.landed_costs);
  const LANDED_COSTS = Array.isArray(rawData) ? rawData : rawData?.results || [];
  const tableData = LANDED_COSTS;

  const filtered = useMemo(() => {
    if (!searchTerm) return tableData;
    return tableData.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, tableData]);

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const selectedReport = filtered.find((row) => row.id === selectedReportId) || filtered[0] || null;

  const reportSummary = useMemo(
    () => ({
      total: tableData.reduce((sum, row) => sum + toAmount(row.total_landed), 0),
      posted: tableData.filter((row) => normalizeStatus(row.status) === 'posted').length,
      pending: tableData.filter((row) => normalizeStatus(row.status) !== 'posted').length,
    }),
    [tableData]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Landed Cost Report
      </Typography>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        The landed cost report desk should make it easy to review total landed charges, isolate
        unposted sheets, and verify whether vendor-side logistics costs are flowing into inventory
        value correctly.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:calculator-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{LANDED_COSTS.length}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total Records
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
            <Typography variant="h4">{formatCurrency(reportSummary.total)}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total Landed Cost
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:documents-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{reportSummary.pending}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Unposted Sheets
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
                    <TableCell>Vendor</TableCell>
                    <TableCell>Freight</TableCell>
                    <TableCell>Customs</TableCell>
                    <TableCell>Total Landed</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((row, idx) => (
                    <TableRow
                      key={row.id || idx}
                      hover
                      selected={row.id === selectedReport?.id}
                      onClick={() => setSelectedReportId(row.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{String(row.reference ?? '')}</TableCell>
                      <TableCell>{String(row.date ?? '')}</TableCell>
                      <TableCell>{String(row.vendor ?? '')}</TableCell>
                      <TableCell>{formatCurrency(row.freight)}</TableCell>
                      <TableCell>{formatCurrency(row.customs)}</TableCell>
                      <TableCell>{formatCurrency(row.total_landed)}</TableCell>
                      <TableCell>
                        <Chip
                          label={String(row.status ?? 'Unknown')}
                          size="small"
                          sx={{
                            bgcolor: getStatusTone(row.status).bgcolor,
                            color: getStatusTone(row.status).color,
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
                  Selected Sheet Review
                </Typography>
                {selectedReport ? (
                  <Stack spacing={1.5}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedReport.reference || 'Landed cost reference'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedReport.vendor || 'Vendor not captured'}
                      </Typography>
                    </Box>

                    <Chip
                      label={selectedReport.status || 'Unknown'}
                      size="small"
                      sx={{
                        width: 'fit-content',
                        bgcolor: getStatusTone(selectedReport.status).bgcolor,
                        color: getStatusTone(selectedReport.status).color,
                        fontWeight: 700,
                      }}
                    />

                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          Freight: {formatCurrency(selectedReport.freight)}
                        </Alert>
                      </Grid>
                      <Grid item xs={6}>
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                          Customs: {formatCurrency(selectedReport.customs)}
                        </Alert>
                      </Grid>
                    </Grid>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Next control action
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {normalizeStatus(selectedReport.status) === 'posted'
                          ? 'This landed sheet is posted. Confirm the charge distribution is reflected in valuation and archive the finance review.'
                          : 'This report line still needs finance attention. Check the freight, customs, and insurance mix before it is posted into stock cost.'}
                      </Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a landed cost sheet to review its reporting posture and finance next
                    step.
                  </Typography>
                )}
              </Box>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Report Control Queue
                </Typography>
                <Stack spacing={1.5}>
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    {reportSummary.pending} landed sheet(s) remain unposted.
                  </Alert>
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    {reportSummary.posted} landed sheet(s) are already posted.
                  </Alert>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Visible landed value: {formatCurrency(reportSummary.total)}.
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
