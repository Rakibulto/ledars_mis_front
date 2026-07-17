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

export default function MoveHistoryMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);
  const [selectedMoveId, setSelectedMoveId] = useState(null);
  const rowsPerPage = 10;

  const { data: rawData } = useGetRequest(endpoints.storeInventory.stock_moves);
  const STOCK_MOVES = Array.isArray(rawData) ? rawData : rawData?.results || [];
  const tableData = STOCK_MOVES;

  const filtered = useMemo(() => {
    if (!searchTerm) return tableData;
    return tableData.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, tableData]);

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const selectedMove = filtered.find((row) => row.id === selectedMoveId) || filtered[0] || null;

  const moveControls = useMemo(
    () => ({
      total: STOCK_MOVES.length,
      transfers: STOCK_MOVES.filter((row) => normalizeText(row.type).includes('transfer')).length,
      issues: STOCK_MOVES.filter((row) => normalizeText(row.type).includes('issue')).length,
      receipts: STOCK_MOVES.filter((row) => normalizeText(row.type).includes('receipt')).length,
    }),
    [STOCK_MOVES]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Move History / Audit Trail
      </Typography>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        The move history desk should support filters, source-document drilldown, and clear movement
        context so stock investigations can be completed without leaving the audit trail.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:transfer-horizontal-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{moveControls.total}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total Moves
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:inbox-in-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'success.main' }}
            />
            <Typography variant="h4">{moveControls.receipts}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Receipts
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:logout-2-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'warning.main' }}
            />
            <Typography variant="h4">{moveControls.issues}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Issues
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:transfer-horizontal-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'info.main' }}
            />
            <Typography variant="h4">{moveControls.transfers}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Transfers
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
                placeholder="Search move history..."
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
                    <TableCell>Date</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>UoM</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Done By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((row, idx) => (
                    <TableRow
                      key={row.id || idx}
                      hover
                      selected={row.id === selectedMove?.id}
                      onClick={() => setSelectedMoveId(row.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{String(row.date ?? '')}</TableCell>
                      <TableCell>{String(row.reference ?? '')}</TableCell>
                      <TableCell>{String(row.product_name ?? '')}</TableCell>
                      <TableCell>{String(row.from ?? '')}</TableCell>
                      <TableCell>{String(row.to ?? '')}</TableCell>
                      <TableCell>{String(row.quantity ?? '')}</TableCell>
                      <TableCell>{String(row.uom ?? '')}</TableCell>
                      <TableCell>
                        <Chip size="small" label={String(row.type ?? '')} />
                      </TableCell>
                      <TableCell>{String(row.done_by ?? '')}</TableCell>
                    </TableRow>
                  ))}
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
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
                  Selected Move Review
                </Typography>
                {selectedMove ? (
                  <Stack spacing={1.5}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedMove.reference}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedMove.product_name}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={selectedMove.type || 'Move'}
                      sx={{
                        width: 'fit-content',
                        bgcolor: '#eff6ff',
                        color: '#1d4ed8',
                        fontWeight: 700,
                      }}
                    />
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      {selectedMove.quantity} {selectedMove.uom} moved from{' '}
                      {selectedMove.from || 'N/A'} to {selectedMove.to || 'N/A'}
                    </Alert>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#ecfdf5' }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Drilldown Context
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Date: {selectedMove.date || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Executed by: {selectedMove.done_by || 'Unknown'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Use the reference as the source document pivot for further investigation.
                      </Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a move to review audit details and document context.
                  </Typography>
                )}
              </Box>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Move Control Queue
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#ecfdf5' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Receipts
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {moveControls.receipts} inbound moves are in the current history window.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fff7ed' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Issues
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {moveControls.issues} outbound moves are currently visible for audit review.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#eff6ff' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Transfers
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {moveControls.transfers} internal transfer records are currently visible.
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
