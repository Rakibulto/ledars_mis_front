'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Chip,
  Stack,
  Table,
  Alert,
  Button,
  Dialog,
  Divider,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TableContainer,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { extractErrorMessage } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const EP = endpoints.storeInventory;

// ── helpers ───────────────────────────────────────────────────────────────────

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtQty(v) {
  return Number(v || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 });
}

// ── row state builder ─────────────────────────────────────────────────────────

function buildRowState(lines) {
  return Object.fromEntries(
    (lines || []).map((line) => [
      line.id,
      {
        good_qty: '',
        damaged_qty: '',
      },
    ])
  );
}

// ── validation helpers ────────────────────────────────────────────────────────

function rowIsValid(row, returnQty) {
  const good = toNum(row.good_qty);
  const damaged = toNum(row.damaged_qty);
  if (good < 0 || damaged < 0) return false;
  return Math.abs(good + damaged - returnQty) < 0.0001;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function InternalTransferBackReceiveDialog({ open, transfer, onClose, onSuccess }) {
  const theme = useTheme();
  const lines = useMemo(() => (Array.isArray(transfer?.lines) ? transfer.lines : []), [transfer]);

  const [rows, setRows] = useState(() => buildRowState(lines));
  const [submitting, setSubmitting] = useState(false);

  // Re-initialise row state whenever the transfer/lines change
  useMemo(() => {
    setRows(buildRowState(lines));
  }, [lines]);

  if (!transfer) return null;

  const allValid = lines.every((line) => rowIsValid(rows[line.id] || {}, Number(line.quantity)));

  // ── per-row helpers ──────────────────────────────────────────────────────────

  const setField = (lineId, field, value) => {
    setRows((prev) => {
      const row = { ...(prev[lineId] || {}) };
      row[field] = value;

      // Auto-calculate the complementary field
      const returnQty = Number(lines.find((l) => l.id === lineId)?.quantity || 0);
      if (field === 'good_qty') {
        const good = toNum(value);
        const damaged = returnQty - good;
        row.damaged_qty = damaged >= 0 ? String(damaged) : row.damaged_qty;
      } else if (field === 'damaged_qty') {
        const damaged = toNum(value);
        const good = returnQty - damaged;
        row.good_qty = good >= 0 ? String(good) : row.good_qty;
      }

      return { ...prev, [lineId]: row };
    });
  };

  const fillAllGood = (lineId, returnQty) => {
    setRows((prev) => ({
      ...prev,
      [lineId]: { good_qty: String(returnQty), damaged_qty: '0' },
    }));
  };

  const fillAllDamaged = (lineId, returnQty) => {
    setRows((prev) => ({
      ...prev,
      [lineId]: { good_qty: '0', damaged_qty: String(returnQty) },
    }));
  };

  const resetRow = (lineId) => {
    setRows((prev) => ({
      ...prev,
      [lineId]: { good_qty: '', damaged_qty: '' },
    }));
  };

  // ── submit ───────────────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const payload = {
        lines: lines.map((line) => ({
          line_id: line.id,
          good_qty: toNum(rows[line.id]?.good_qty),
          damaged_qty: toNum(rows[line.id]?.damaged_qty),
        })),
      };
      await axiosInstance.post(EP.internal_transfer_back_receive(transfer.id), payload);
      toast.success(
        `Transfer ${transfer.transfer_number || transfer.id} — marked as Back Received.`
      );
      setRows(buildRowState(lines));
      setSubmitting(false);
      onSuccess?.();
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err) || 'Back-receive failed.');
      setSubmitting(false);
    }
  };

  // ── summary totals ────────────────────────────────────────────────────────────

  const totalReturn = lines.reduce((s, l) => s + Number(l.quantity || 0), 0);
  const totalGood = lines.reduce((s, l) => s + toNum(rows[l.id]?.good_qty), 0);
  const totalDamaged = lines.reduce((s, l) => s + toNum(rows[l.id]?.damaged_qty), 0);

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1.25}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.warning.main, 0.12),
                color: 'warning.main',
              }}
            >
              <Iconify icon="solar:arrow-left-bold-duotone" width={20} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
                Receive Returned Items
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {transfer.transfer_number || `IT-${transfer.id}`} — Enter good condition quantity;
                damaged is auto-calculated.
              </Typography>
            </Box>
          </Stack>
          <Chip
            size="small"
            label="Back Transit"
            color="warning"
            variant="soft"
            icon={<Iconify icon="solar:arrow-left-bold-duotone" width={13} />}
            sx={{ fontWeight: 700, '& .MuiChip-icon': { ml: 0.75 } }}
          />
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 2, px: 2.5 }}>
        <Stack spacing={2}>
          {/* info banner */}
          <Alert
            severity="info"
            icon={<Iconify icon="solar:info-circle-bold-duotone" width={18} />}
            sx={{ borderRadius: 2, py: 0.75 }}
          >
            <Typography variant="caption">
              <strong>Auto-Calculation:</strong> Change Good Qty → Damaged updates automatically,
              and vice versa. Use <strong>All Good</strong> / <strong>All Damaged</strong> quick
              buttons for fast entry.
            </Typography>
          </Alert>

          {/* Route: items are returning from destination back to source */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              bgcolor: alpha(theme.palette.warning.main, 0.04),
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
              color="warning.dark"
              sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}
            >
              Return Route
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              {/* Returning FROM — the destination (where goods were sent) */}
              <Stack alignItems="flex-start" spacing={0.25}>
                <Typography variant="caption" color="text.disabled" fontWeight={600}>
                  Returning From
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Iconify
                    icon="solar:buildings-2-bold-duotone"
                    width={15}
                    sx={{ color: 'warning.main' }}
                  />
                  <Typography variant="body2" fontWeight={700}>
                    {transfer.to_office_name || '—'}
                  </Typography>
                </Stack>
              </Stack>

              {/* Arrow */}
              <Iconify
                icon="solar:arrow-right-bold"
                width={18}
                sx={{ color: 'warning.main', flexShrink: 0 }}
              />

              {/* Returning TO — the source (where goods originated) */}
              <Stack alignItems="flex-start" spacing={0.25}>
                <Typography variant="caption" color="text.disabled" fontWeight={600}>
                  Returning To (Source)
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Iconify
                    icon="solar:home-smile-bold-duotone"
                    width={15}
                    sx={{ color: 'success.main' }}
                  />
                  <Typography variant="body2" fontWeight={700} color="success.dark">
                    {transfer.from_office_name || '—'}
                  </Typography>
                </Stack>
              </Stack>

              {/* Transfer date */}
              <Box sx={{ ml: 'auto' }}>
                <Typography
                  variant="caption"
                  color="text.disabled"
                  fontWeight={600}
                  display="block"
                >
                  Transfer Date
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {transfer.transfer_date
                    ? new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(
                        new Date(transfer.transfer_date)
                      )
                    : '—'}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* table */}
          <TableContainer
            sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
              overflow: 'hidden',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: alpha(theme.palette.grey[500], 0.08),
                    '& th': { fontWeight: 700, fontSize: 12, py: 1.25 },
                  }}
                >
                  <TableCell>Product</TableCell>
                  <TableCell align="center">Return Qty</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" alignItems="center" gap={0.5} justifyContent="center">
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'success.main',
                        }}
                      />
                      Good Qty
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" alignItems="center" gap={0.5} justifyContent="center">
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'error.main',
                        }}
                      />
                      Damaged Qty
                    </Stack>
                  </TableCell>
                  <TableCell align="center">Quick Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {lines.map((line) => {
                  const returnQty = Number(line.quantity || 0);
                  const row = rows[line.id] || { good_qty: '', damaged_qty: '' };
                  const valid = rowIsValid(row, returnQty);
                  const good = toNum(row.good_qty);
                  const damaged = toNum(row.damaged_qty);

                  return (
                    <TableRow
                      key={line.id}
                      sx={{
                        '&:last-child td': { border: 0 },
                        bgcolor: valid ? alpha(theme.palette.success.main, 0.03) : 'transparent',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      {/* Product */}
                      <TableCell sx={{ py: 1.25 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {line.product_name || `Item ${line.id}`}
                        </Typography>
                        {line.product_code && (
                          <Typography variant="caption" color="text.disabled">
                            {line.product_code}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Return Qty */}
                      <TableCell align="center">
                        <Chip
                          label={fmtQty(returnQty)}
                          size="small"
                          variant="soft"
                          color="default"
                          sx={{ fontWeight: 700, minWidth: 52 }}
                        />
                      </TableCell>

                      {/* Good Qty */}
                      <TableCell align="center">
                        <Stack
                          direction="row"
                          alignItems="center"
                          gap={0.5}
                          justifyContent="center"
                        >
                          <TextField
                            size="small"
                            type="number"
                            value={row.good_qty}
                            onChange={(e) => setField(line.id, 'good_qty', e.target.value)}
                            disabled={submitting}
                            inputProps={{ min: 0, max: returnQty, step: 1 }}
                            sx={{
                              width: 80,
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                                ...(valid &&
                                  good >= 0 && {
                                    '& fieldset': { borderColor: 'success.main' },
                                  }),
                              },
                            }}
                          />
                          {valid && (
                            <Iconify
                              icon="solar:check-circle-bold"
                              width={16}
                              sx={{ color: 'success.main', flexShrink: 0 }}
                            />
                          )}
                        </Stack>
                      </TableCell>

                      {/* Damaged Qty */}
                      <TableCell align="center">
                        <Stack
                          direction="row"
                          alignItems="center"
                          gap={0.5}
                          justifyContent="center"
                        >
                          <TextField
                            size="small"
                            type="number"
                            value={row.damaged_qty}
                            onChange={(e) => setField(line.id, 'damaged_qty', e.target.value)}
                            disabled={submitting}
                            inputProps={{ min: 0, max: returnQty, step: 1 }}
                            sx={{
                              width: 80,
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                                ...(damaged > 0 &&
                                  valid && {
                                    '& fieldset': { borderColor: 'error.light' },
                                  }),
                              },
                            }}
                          />
                          {damaged > 0 && valid && (
                            <Iconify
                              icon="solar:danger-circle-bold"
                              width={16}
                              sx={{ color: 'warning.main', flexShrink: 0 }}
                            />
                          )}
                          {damaged === 0 && valid && (
                            <Iconify
                              icon="solar:check-circle-bold-duotone"
                              width={16}
                              sx={{ color: 'text.disabled', flexShrink: 0 }}
                            />
                          )}
                        </Stack>
                      </TableCell>

                      {/* Quick Actions */}
                      <TableCell align="center">
                        <Stack direction="row" gap={0.5} justifyContent="center">
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            onClick={() => fillAllGood(line.id, returnQty)}
                            disabled={submitting}
                            sx={{
                              py: 0.25,
                              px: 1,
                              fontSize: 11,
                              fontWeight: 700,
                              minWidth: 0,
                              borderRadius: 1.5,
                            }}
                          >
                            All Good
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => fillAllDamaged(line.id, returnQty)}
                            disabled={submitting}
                            sx={{
                              py: 0.25,
                              px: 1,
                              fontSize: 11,
                              fontWeight: 700,
                              minWidth: 0,
                              borderRadius: 1.5,
                            }}
                          >
                            All Damaged
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* receive summary */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              sx={{ mb: 1, display: 'block' }}
            >
              RECEIVE SUMMARY
            </Typography>
            <Stack direction="row" spacing={1.5}>
              {/* Total Return */}
              <Box
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                  textAlign: 'center',
                }}
              >
                <Typography variant="h5" fontWeight={800} color="text.primary">
                  {fmtQty(totalReturn)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Return Qty
                </Typography>
              </Box>

              {/* Total Good */}
              <Box
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 2,
                  border: `1px solid ${allValid ? theme.palette.success.light : alpha(theme.palette.divider, 0.8)}`,
                  bgcolor: allValid ? alpha(theme.palette.success.main, 0.06) : 'transparent',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="center" gap={0.5}>
                  <Iconify
                    icon="solar:check-circle-bold"
                    width={16}
                    sx={{ color: allValid ? 'success.main' : 'text.disabled' }}
                  />
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    color={allValid ? 'success.main' : 'text.disabled'}
                  >
                    {fmtQty(totalGood)}
                  </Typography>
                </Stack>
                <Typography
                  variant="caption"
                  color={allValid ? 'success.dark' : 'text.secondary'}
                  fontWeight={700}
                >
                  Total Good
                </Typography>
              </Box>

              {/* Total Damaged */}
              <Box
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                  textAlign: 'center',
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="center" gap={0.5}>
                  <Iconify
                    icon="solar:danger-circle-bold-duotone"
                    width={16}
                    sx={{ color: totalDamaged > 0 ? 'warning.main' : 'text.disabled' }}
                  />
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    color={totalDamaged > 0 ? 'warning.main' : 'text.disabled'}
                  >
                    {fmtQty(totalDamaged)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Total Damaged
                </Typography>
              </Box>
            </Stack>
          </Box>

          {!allValid && lines.length > 0 && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <Typography variant="caption">
                All rows must satisfy: <strong>Good Qty + Damaged Qty = Return Qty</strong> before
                confirming.
              </Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1 }}>
        <Button variant="outlined" color="inherit" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          disabled={!allValid || submitting}
          onClick={handleConfirm}
          startIcon={
            submitting ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <Iconify icon="solar:check-circle-bold" width={18} />
            )
          }
          sx={{ fontWeight: 700 }}
        >
          {submitting ? 'Processing…' : 'Confirm Back Received'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
