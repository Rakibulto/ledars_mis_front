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

const normalizeStatus = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const getStatusColor = (status) => {
  switch (normalizeStatus(status)) {
    case 'available':
    case 'active':
      return { bgcolor: '#d1fae5', color: '#065f46' };
    case 'reserved':
    case 'allocated':
      return { bgcolor: '#dbeafe', color: '#1e40af' };
    case 'expired':
    case 'blocked':
    case 'quarantine':
      return { bgcolor: '#fee2e2', color: '#991b1b' };
    default:
      return { bgcolor: '#f3f4f6', color: '#374151' };
  }
};

export default function LotTraceabilityMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);
  const [selectedLotId, setSelectedLotId] = useState(null);
  const rowsPerPage = 10;

  const { data: rawLotData } = useGetRequest(endpoints.storeInventory.lot_serials);
  const LOT_SERIAL_NUMBERS = Array.isArray(rawLotData) ? rawLotData : rawLotData?.results || [];
  const { data: rawMoveData } = useGetRequest(endpoints.storeInventory.stock_moves);
  const STOCK_MOVES = Array.isArray(rawMoveData) ? rawMoveData : rawMoveData?.results || [];
  const tableData = LOT_SERIAL_NUMBERS;

  const filtered = useMemo(() => {
    if (!searchTerm) return tableData;
    return tableData.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, tableData]);

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const selectedLot = filtered.find((row) => row.id === selectedLotId) || filtered[0] || null;

  const relatedMoves = useMemo(() => {
    if (!selectedLot) return [];

    const lotNumber = String(selectedLot.number || '').toLowerCase();
    const productName = String(selectedLot.product_name || '').toLowerCase();

    return STOCK_MOVES.filter((move) => {
      const haystack = Object.values(move || {})
        .map((value) => String(value || '').toLowerCase())
        .join(' ');

      return (
        (lotNumber && haystack.includes(lotNumber)) ||
        (productName && haystack.includes(productName))
      );
    }).slice(0, 5);
  }, [STOCK_MOVES, selectedLot]);

  const traceabilityControls = useMemo(
    () => ({
      available: tableData.filter((row) => normalizeStatus(row.status) === 'available').length,
      reserved: tableData.filter((row) => {
        const status = normalizeStatus(row.status);
        return status === 'reserved' || status === 'allocated';
      }).length,
      blocked: tableData.filter((row) => {
        const status = normalizeStatus(row.status);
        return status === 'expired' || status === 'blocked' || status === 'quarantine';
      }).length,
    }),
    [tableData]
  );

  const handleChangeDense = (event) => {
    setDense(event.target.checked);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Lot Traceability
      </Typography>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        The traceability desk should show where each lot stands now, what movement history is known,
        and which serials need hold, recall, or follow-up handling.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:route-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{LOT_SERIAL_NUMBERS.length}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total Tracked Items
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
                    <TableCell>Lot/Serial</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Supplier</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((row, idx) => (
                    <TableRow
                      key={row.id || idx}
                      hover
                      selected={row.id === selectedLot?.id}
                      onClick={() => setSelectedLotId(row.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{String(row.number ?? '')}</TableCell>
                      <TableCell>{String(row.product_name ?? '')}</TableCell>
                      <TableCell>{String(row.type ?? '')}</TableCell>
                      <TableCell>{String(row.quantity ?? '')}</TableCell>
                      <TableCell>
                        <Chip
                          label={String(row.status ?? 'Unknown')}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(row.status).bgcolor,
                            color: getStatusColor(row.status).color,
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell>{String(row.supplier ?? '')}</TableCell>
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
                control={<Switch checked={dense} onChange={handleChangeDense} />}
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
                  Selected Lot Review
                </Typography>
                {selectedLot ? (
                  <Stack spacing={1.5}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedLot.number || 'Lot / Serial'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedLot.product_name || 'Product not captured'}
                      </Typography>
                    </Box>

                    <Chip
                      label={selectedLot.status || 'Unknown'}
                      size="small"
                      sx={{
                        width: 'fit-content',
                        bgcolor: getStatusColor(selectedLot.status).bgcolor,
                        color: getStatusColor(selectedLot.status).color,
                        fontWeight: 700,
                      }}
                    />

                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          Qty: {selectedLot.quantity || 0}
                        </Alert>
                      </Grid>
                      <Grid item xs={6}>
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                          Moves: {relatedMoves.length}
                        </Alert>
                      </Grid>
                    </Grid>

                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Supplier
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedLot.supplier || 'Supplier not captured'}
                      </Typography>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Next control action
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {normalizeStatus(selectedLot.status) === 'expired' ||
                        normalizeStatus(selectedLot.status) === 'blocked' ||
                        normalizeStatus(selectedLot.status) === 'quarantine'
                          ? 'Keep this lot blocked, investigate the cause, and confirm whether recall or disposal is required.'
                          : normalizeStatus(selectedLot.status) === 'reserved' ||
                              normalizeStatus(selectedLot.status) === 'allocated'
                            ? 'Track the reserved quantity to its next movement and confirm the consuming document.'
                            : 'This lot is available. Confirm storage location accuracy and keep movement history intact.'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Recent movement trace
                      </Typography>
                      {relatedMoves.length ? (
                        <Stack spacing={1}>
                          {relatedMoves.map((move, index) => (
                            <Box
                              key={move.id || index}
                              sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f9fafb' }}
                            >
                              <Typography variant="caption" display="block" color="text.secondary">
                                {move.reference ||
                                  move.move_number ||
                                  move.document_number ||
                                  'Stock move'}
                              </Typography>
                              <Typography variant="body2">
                                {move.movement_type ||
                                  move.type ||
                                  move.status ||
                                  'Movement recorded'}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No linked movement records were matched for this lot yet.
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a lot or serial to review traceability status and movement context.
                  </Typography>
                )}
              </Box>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Traceability Control Queue
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#ecfdf5' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Available
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {traceabilityControls.available} tracked lots are available for normal stock
                      flow.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#eff6ff' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Reserved / allocated
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {traceabilityControls.reserved} lots need consuming-document follow-up.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fef2f2' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Blocked / expired
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {traceabilityControls.blocked} lots require recall, quarantine, or disposal
                      handling.
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
