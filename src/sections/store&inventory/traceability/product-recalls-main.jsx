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
  Button,
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

export default function ProductRecallsMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);
  const [selectedRecallId, setSelectedRecallId] = useState(null);
  const [recalls, setRecalls] = useState([
    {
      id: 1,
      reference: 'RCL-2025-001',
      date: '2025-03-12',
      product: 'Paracetamol 500mg',
      lot: 'LOT-2024-MED-005',
      reason: 'Expired batch detected',
      affected_qty: 10,
      status: 'In Progress',
      action: 'Scrap & replace',
      initiated_by: 'Medical Officer',
      warehouse: 'Central Medical Store',
    },
    {
      id: 2,
      reference: 'RCL-2025-002',
      date: '2025-03-18',
      product: 'Water Purification Tablet',
      lot: 'LOT-WASH-119',
      reason: 'Vendor quality deviation',
      affected_qty: 240,
      status: 'Draft',
      action: 'Hold for QA review',
      initiated_by: 'Quality Manager',
      warehouse: 'Regional Warehouse - Chittagong',
    },
  ]);
  const rowsPerPage = 10;

  const { data: rawData } = useGetRequest(endpoints.storeInventory.lot_serials);
  const lotSerialNumbers = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const filtered = useMemo(() => {
    if (!searchTerm) return recalls;
    return recalls.filter((row) =>
      Object.values(row).some((val) => normalizeText(val).includes(normalizeText(searchTerm)))
    );
  }, [recalls, searchTerm]);

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const selectedRecall = filtered.find((row) => row.id === selectedRecallId) || filtered[0] || null;

  const affectedLots = useMemo(() => {
    if (!selectedRecall) return [];
    return lotSerialNumbers.filter((row) =>
      normalizeText(row.number).includes(normalizeText(selectedRecall.lot))
    );
  }, [lotSerialNumbers, selectedRecall]);

  const recallControls = useMemo(
    () => ({
      active: recalls.filter((row) => normalizeText(row.status) === 'in progress').length,
      draft: recalls.filter((row) => normalizeText(row.status) === 'draft').length,
      closed: recalls.filter((row) => normalizeText(row.status) === 'closed').length,
      impactedQty: recalls.reduce((sum, row) => sum + Number(row.affected_qty || 0), 0),
    }),
    [recalls]
  );

  const updateRecallStatus = (status) => {
    if (!selectedRecall) return;
    setRecalls((prev) =>
      prev.map((row) => (row.id === selectedRecall.id ? { ...row, status } : row))
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Product Recalls
      </Typography>

      <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
        Recall management should connect campaigns, impacted lots, status progression, and final
        disposition in a single review workspace.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:danger-triangle-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'error.main' }}
            />
            <Typography variant="h4">{recallControls.active}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Active Recalls
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:document-text-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'warning.main' }}
            />
            <Typography variant="h4">{recallControls.draft}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Draft Campaigns
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:archive-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'success.main' }}
            />
            <Typography variant="h4">{recallControls.closed}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Closed
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify icon="solar:box-bold-duotone" width={40} sx={{ mb: 1, color: 'info.main' }} />
            <Typography variant="h4">{recallControls.impactedQty}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Impacted Qty
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
                placeholder="Search recall campaigns..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:magnifer-bold-duotone" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 320 }}
              />
            </Stack>

            <TableContainer>
              <Table size={dense ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
                    <TableCell>Reference</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Lot</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Affected Qty</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      selected={row.id === selectedRecall?.id}
                      onClick={() => setSelectedRecallId(row.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{row.reference}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.product}</TableCell>
                      <TableCell>{row.lot}</TableCell>
                      <TableCell>{row.reason}</TableCell>
                      <TableCell>{row.affected_qty}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.status}
                          size="small"
                          sx={{
                            bgcolor:
                              normalizeText(row.status) === 'closed'
                                ? '#d1fae5'
                                : normalizeText(row.status) === 'draft'
                                  ? '#fef3c7'
                                  : '#fee2e2',
                            color:
                              normalizeText(row.status) === 'closed'
                                ? '#065f46'
                                : normalizeText(row.status) === 'draft'
                                  ? '#92400e'
                                  : '#991b1b',
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell>{row.action}</TableCell>
                    </TableRow>
                  ))}
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
                  onChange={(event, value) => setPage(value)}
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
                  Recall Campaign Review
                </Typography>
                {selectedRecall ? (
                  <Stack spacing={1.5}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedRecall.reference}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedRecall.product} | {selectedRecall.warehouse}
                      </Typography>
                    </Box>
                    <Chip
                      label={selectedRecall.status}
                      size="small"
                      sx={{
                        width: 'fit-content',
                        bgcolor:
                          normalizeText(selectedRecall.status) === 'closed'
                            ? '#d1fae5'
                            : normalizeText(selectedRecall.status) === 'draft'
                              ? '#fef3c7'
                              : '#fee2e2',
                        color:
                          normalizeText(selectedRecall.status) === 'closed'
                            ? '#065f46'
                            : normalizeText(selectedRecall.status) === 'draft'
                              ? '#92400e'
                              : '#991b1b',
                        fontWeight: 700,
                      }}
                    />
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      {selectedRecall.reason}
                    </Alert>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#eff6ff' }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Affected Stock Context
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Lot: {selectedRecall.lot}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Affected Quantity: {selectedRecall.affected_qty}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Matched traceability records: {affectedLots.length}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        onClick={() => updateRecallStatus('In Progress')}
                        sx={{ textTransform: 'none' }}
                      >
                        Start Recall
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => updateRecallStatus('Closed')}
                        sx={{ textTransform: 'none' }}
                      >
                        Close Recall
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a recall campaign to review affected stock and status progression.
                  </Typography>
                )}
              </Box>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Recall Control Queue
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fef2f2' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Active Investigations
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {recallControls.active} recall campaigns are currently live and need
                      disposition tracking.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fff7ed' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Draft Campaigns
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {recallControls.draft} campaigns still need approval before warehouse action.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#eff6ff' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Impacted Quantity
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {recallControls.impactedQty} units are currently covered by recall cases.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#ecfdf5' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Matched Lots
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {affectedLots.length} traceability records match the selected recall lot
                      pattern.
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
