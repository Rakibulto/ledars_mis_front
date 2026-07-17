'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Chip,
  Alert,
  Paper,
  Stack,
  Table,
  Button,
  Dialog,
  Tooltip,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  ButtonGroup,
  DialogTitle,
  DialogActions,
  DialogContent,
  InputAdornment,
  TableContainer,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { extractErrorMessage } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const EP = endpoints.storeInventory;

export default function ReturnReceiveDialog({ open, returnDoc, onClose, onSuccess }) {
  const theme = useTheme();
  const lines = returnDoc?.lines || [];

  const [quantities, setQuantities] = useState(() =>
    Object.fromEntries(
      lines.map((l) => {
        const ret = Number(l.return_quantity || 0);
        return [l.id, { good: ret, damaged: 0 }];
      })
    )
  );
  const [submitting, setSubmitting] = useState(false);

  // Auto-calc: when good changes â†’ damaged = ret - good; clamp to [0, ret]
  const setGood = (lineId, rawVal, retQty) => {
    const good = Math.min(Math.max(Number(rawVal) || 0, 0), retQty);
    const damaged = retQty - good;
    setQuantities((prev) => ({ ...prev, [lineId]: { good, damaged } }));
  };

  // Auto-calc: when damaged changes â†’ good = ret - damaged; clamp to [0, ret]
  const setDamaged = (lineId, rawVal, retQty) => {
    const damaged = Math.min(Math.max(Number(rawVal) || 0, 0), retQty);
    const good = retQty - damaged;
    setQuantities((prev) => ({ ...prev, [lineId]: { good, damaged } }));
  };

  const setAllGood = (lineId, retQty) => {
    setQuantities((prev) => ({ ...prev, [lineId]: { good: retQty, damaged: 0 } }));
  };

  const setAllDamaged = (lineId, retQty) => {
    setQuantities((prev) => ({ ...prev, [lineId]: { good: 0, damaged: retQty } }));
  };

  // Validation: per-line and aggregate
  const lineErrors = useMemo(
    () =>
      lines.reduce((acc, l) => {
        const q = quantities[l.id] || {};
        const good = Number(q.good ?? 0);
        const damaged = Number(q.damaged ?? 0);
        const ret = Number(l.return_quantity || 0);
        if (good < 0 || damaged < 0) acc[l.id] = 'Quantities cannot be negative.';
        else if (good + damaged !== ret)
          acc[l.id] = `Good (${good}) + Damaged (${damaged}) â‰  Return Qty (${ret})`;
        return acc;
      }, {}),
    [quantities, lines]
  );

  const hasErrors = Object.keys(lineErrors).length > 0;

  // Summary totals
  const totals = useMemo(() => {
    let totalReturn = 0;
    let totalGood = 0;
    let totalDamaged = 0;
    lines.forEach((l) => {
      const q = quantities[l.id] || {};
      totalReturn += Number(l.return_quantity || 0);
      totalGood += Number(q.good ?? 0);
      totalDamaged += Number(q.damaged ?? 0);
    });
    return { totalReturn, totalGood, totalDamaged };
  }, [quantities, lines]);

  const handleSubmit = async () => {
    if (hasErrors) return;
    setSubmitting(true);
    const linesPayload = lines.map((l) => ({
      id: l.id,
      good_quantity: Number(quantities[l.id]?.good ?? 0),
      damaged_quantity: Number(quantities[l.id]?.damaged ?? 0),
    }));
    try {
      await axiosInstance.post(EP.return_management_receive(returnDoc.id), { lines: linesPayload });
      toast.success('Return received and inventory updated.');
      onSuccess?.();
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err) || 'Failed to receive return.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {/* â”€â”€ Title â”€â”€ */}
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.success.main, 0.12),
            }}
          >
            <Iconify icon="solar:box-bold-duotone" width={22} sx={{ color: 'success.main' }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Receive Returned Items
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {returnDoc?.return_number} â€” Enter good condition quantity; damaged is
              auto-calculated.
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ ml: 'auto' }}>
            <Iconify icon="solar:close-bold" width={18} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Instruction banner */}
        <Box
          sx={{
            px: 3,
            py: 1.5,
            bgcolor: alpha(theme.palette.info.main, 0.06),
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify
              icon="solar:info-circle-bold-duotone"
              width={18}
              sx={{ color: 'info.main', flexShrink: 0 }}
            />
            <Typography variant="caption" color="text.secondary">
              <strong>Auto-Calculation:</strong> Change Good Qty â†’ Damaged updates automatically,
              and vice versa. Use <strong>All Good</strong> / <strong>All Damaged</strong> quick
              buttons for fast entry.
            </Typography>
          </Stack>
        </Box>

        {/* Items table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Return Qty
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, color: 'success.dark', minWidth: 140 }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="flex-end"
                    spacing={0.5}
                  >
                    <Iconify
                      icon="solar:check-circle-bold"
                      width={14}
                      sx={{ color: 'success.main' }}
                    />
                    <span>Good Qty</span>
                  </Stack>
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, color: 'error.dark', minWidth: 140 }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="flex-end"
                    spacing={0.5}
                  >
                    <Iconify icon="solar:danger-bold" width={14} sx={{ color: 'error.main' }} />
                    <span>Damaged Qty</span>
                  </Stack>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Quick Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((line) => {
                const ret = Number(line.return_quantity || 0);
                const q = quantities[line.id] || { good: ret, damaged: 0 };
                const good = Number(q.good ?? 0);
                const damaged = Number(q.damaged ?? 0);
                const hasError = !!lineErrors[line.id];

                return (
                  <TableRow
                    key={line.id}
                    sx={{
                      bgcolor: hasError ? 'error.lighter' : 'transparent',
                      verticalAlign: 'top',
                    }}
                  >
                    {/* Product */}
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {line.item_name || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                        {line.item_code || line.source_document_number || 'â€”'}
                      </Typography>
                      {hasError && (
                        <Typography
                          variant="caption"
                          color="error.main"
                          display="block"
                          sx={{ mt: 0.3 }}
                        >
                          {lineErrors[line.id]}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Return Qty */}
                    <TableCell align="right" sx={{ py: 1.5 }}>
                      <Chip
                        size="small"
                        label={ret}
                        color="primary"
                        variant="soft"
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>

                    {/* Good Qty */}
                    <TableCell align="right" sx={{ py: 1.5 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={good}
                        onChange={(e) => setGood(line.id, e.target.value, ret)}
                        inputProps={{
                          min: 0,
                          max: ret,
                          style: { textAlign: 'right', fontWeight: 700 },
                        }}
                        error={hasError}
                        sx={{
                          width: 100,
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: hasError ? 'error.main' : 'success.light',
                            },
                            '&:hover fieldset': { borderColor: 'success.main' },
                            '&.Mui-focused fieldset': { borderColor: 'success.main' },
                          },
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Iconify
                                icon="solar:check-circle-bold"
                                width={14}
                                sx={{ color: 'success.main' }}
                              />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </TableCell>

                    {/* Damaged Qty */}
                    <TableCell align="right" sx={{ py: 1.5 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={damaged}
                        onChange={(e) => setDamaged(line.id, e.target.value, ret)}
                        inputProps={{
                          min: 0,
                          max: ret,
                          style: { textAlign: 'right', fontWeight: 700 },
                        }}
                        error={hasError}
                        sx={{
                          width: 100,
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: hasError
                                ? 'error.main'
                                : damaged > 0
                                  ? 'error.light'
                                  : 'divider',
                            },
                            '&:hover fieldset': { borderColor: 'error.main' },
                            '&.Mui-focused fieldset': { borderColor: 'error.main' },
                          },
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Iconify
                                icon="solar:danger-bold"
                                width={14}
                                sx={{ color: damaged > 0 ? 'error.main' : 'text.disabled' }}
                              />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </TableCell>

                    {/* Quick Actions */}
                    <TableCell sx={{ py: 1.5 }}>
                      <ButtonGroup size="small" variant="outlined">
                        <Tooltip title={`All ${ret} units are good`}>
                          <Button
                            color="success"
                            onClick={() => setAllGood(line.id, ret)}
                            sx={{ fontSize: 11, px: 1.2 }}
                          >
                            All Good
                          </Button>
                        </Tooltip>
                        <Tooltip title={`All ${ret} units are damaged`}>
                          <Button
                            color="error"
                            onClick={() => setAllDamaged(line.id, ret)}
                            sx={{ fontSize: 11, px: 1.2 }}
                          >
                            All Damaged
                          </Button>
                        </Tooltip>
                      </ButtonGroup>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* â”€â”€ Summary â”€â”€ */}
        <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            textTransform="uppercase"
            letterSpacing={0.5}
          >
            Receive Summary
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 1.5 }} flexWrap="wrap">
            <Paper
              variant="outlined"
              sx={{ px: 2.5, py: 1.5, borderRadius: 2, minWidth: 130, textAlign: 'center' }}
            >
              <Typography variant="h5" fontWeight={800}>
                {totals.totalReturn}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Return Qty
              </Typography>
            </Paper>
            <Paper
              variant="outlined"
              sx={{
                px: 2.5,
                py: 1.5,
                borderRadius: 2,
                minWidth: 130,
                textAlign: 'center',
                borderColor: 'success.light',
                bgcolor: alpha(theme.palette.success.main, 0.04),
              }}
            >
              <Typography variant="h5" fontWeight={800} color="success.main">
                {totals.totalGood}
              </Typography>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                <Iconify icon="solar:check-circle-bold" width={12} sx={{ color: 'success.main' }} />
                <Typography variant="caption" color="success.dark">
                  Total Good
                </Typography>
              </Stack>
            </Paper>
            <Paper
              variant="outlined"
              sx={{
                px: 2.5,
                py: 1.5,
                borderRadius: 2,
                minWidth: 130,
                textAlign: 'center',
                borderColor: totals.totalDamaged > 0 ? 'error.light' : 'divider',
                bgcolor:
                  totals.totalDamaged > 0 ? alpha(theme.palette.error.main, 0.04) : 'transparent',
              }}
            >
              <Typography
                variant="h5"
                fontWeight={800}
                color={totals.totalDamaged > 0 ? 'error.main' : 'text.disabled'}
              >
                {totals.totalDamaged}
              </Typography>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                <Iconify
                  icon="solar:danger-bold"
                  width={12}
                  sx={{ color: totals.totalDamaged > 0 ? 'error.main' : 'text.disabled' }}
                />
                <Typography
                  variant="caption"
                  color={totals.totalDamaged > 0 ? 'error.dark' : 'text.disabled'}
                >
                  Total Damaged
                </Typography>
              </Stack>
            </Paper>
          </Stack>

          {hasErrors && (
            <Alert severity="error" icon={<Iconify icon="solar:danger-bold" />} sx={{ mt: 1.5 }}>
              Please fix the quantity errors above before confirming. Good + Damaged must equal
              Return Qty for each item.
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={submitting} color="inherit" variant="outlined">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleSubmit}
          disabled={submitting || hasErrors}
          startIcon={<Iconify icon="solar:check-circle-bold-duotone" width={18} />}
        >
          {submitting ? 'Processingâ€¦' : 'Confirm Receive'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
