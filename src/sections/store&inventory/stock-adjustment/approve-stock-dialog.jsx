'use client';

import { toast } from 'sonner';
import React, { useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { extractErrorMessage } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import { computeAdjustmentWorkflowInfo } from './adjustment-approval-workflow';

const EP = endpoints.storeInventory;

// ── helpers ──────────────────────────────────────────────────────────────────
function patchRow(setRows, adjId, patch) {
  setRows((prev) => prev.map((r) => (r.adjId === adjId ? { ...r, ...patch } : r)));
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ApproveStockDialog({
  open,
  product,
  pendingAdjustments = [],
  rawWorkflow,
  userEmail,
  onClose,
  onSuccess,
}) {
  const [rows, setRows] = useState([]);

  // Sync editable rows whenever the dialog opens or the list changes
  useEffect(() => {
    if (open && pendingAdjustments.length) {
      setRows(
        pendingAdjustments.map((adj) => {
          const line = Array.isArray(adj.lines) && adj.lines.length ? adj.lines[0] : {};
          return {
            adjId: adj.id,
            adjNumber: adj.adjustment_number || '—',
            officeName: adj.office_location_name || adj.warehouse_name || '—',
            officeLocationId: adj.office_location ?? null,
            productId: line.product ?? product?.id ?? null,
            qty: String(Math.max(Number(line.difference ?? 0), 0)),
            unit: line.unit || product?.uom_name || '',
            // rowStatus: pending | approving | approved | confirming_decline | declining | declined
            rowStatus: 'pending',
            rowError: null,
          };
        })
      );
    } else if (!open) {
      setRows([]);
    }
  }, [open, pendingAdjustments, product]);

  const anyActive = rows.some((r) => r.rowStatus === 'approving' || r.rowStatus === 'declining');
  const anyChanged = rows.some((r) => r.rowStatus === 'approved' || r.rowStatus === 'declined');
  const allDone =
    rows.length > 0 && rows.every((r) => r.rowStatus === 'approved' || r.rowStatus === 'declined');

  const handleClose = () => {
    if (anyActive) return;
    if (anyChanged) {
      onSuccess?.();
    } else {
      onClose();
    }
  };

  const handleQtyChange = (adjId, value) => {
    patchRow(setRows, adjId, { qty: value, rowError: null });
  };

  // ── Approve a single row ──────────────────────────────────────────────────
  const handleApproveRow = async (adjId) => {
    const row = rows.find((r) => r.adjId === adjId);
    if (!row) return;

    const qty = Number(row.qty);
    if (!(qty > 0)) {
      patchRow(setRows, adjId, { rowError: 'Quantity must be greater than zero.' });
      return;
    }
    if (!row.officeLocationId) {
      patchRow(setRows, adjId, { rowError: 'No warehouse linked to this request.' });
      return;
    }

    patchRow(setRows, adjId, { rowStatus: 'approving', rowError: null });

    try {
      // 1. Check for an existing LocationStock record
      const lsRes = await axiosInstance.get(EP.location_stocks, {
        params: {
          product: row.productId,
          office_location: row.officeLocationId,
          pagination: 'false',
        },
      });
      const lsItems = Array.isArray(lsRes.data) ? lsRes.data : (lsRes.data?.results ?? []);
      const existing = lsItems.find(
        (item) =>
          String(item.product) === String(row.productId) &&
          String(item.office_location) === String(row.officeLocationId)
      );

      // 2. Create or update LocationStock — signal auto-recalculates Product.on_hand
      // if (existing) {
      //   await axiosInstance.patch(EP.location_stock_by_id(existing.id), {
      //     quantity: Number(existing.quantity) + qty,
      //   });
      // } else {
      //   await axiosInstance.post(EP.location_stocks, {
      //     product: row.productId,
      //     office_location: Number(row.officeLocationId),
      //     quantity: qty,
      //   });
      // }

      // 3. Approve via workflow endpoint (unordered for product list tab)
      await axiosInstance.post(EP.stock_adjustment_approve(adjId), { force_unordered: true });

      patchRow(setRows, adjId, { rowStatus: 'approved' });
      toast.success(`${row.adjNumber} approved — stock updated.`);
    } catch (err) {
      patchRow(setRows, adjId, {
        rowStatus: 'pending',
        rowError: extractErrorMessage(err?.response?.data || err),
      });
    }
  };

  // ── Decline flow (inline confirmation) ────────────────────────────────────
  const handleDeclineRow = (adjId) => {
    patchRow(setRows, adjId, { rowStatus: 'confirming_decline', rowError: null });
  };

  const handleDeclineCancel = (adjId) => {
    patchRow(setRows, adjId, { rowStatus: 'pending' });
  };

  const handleDeclineConfirm = async (adjId) => {
    const row = rows.find((r) => r.adjId === adjId);
    patchRow(setRows, adjId, { rowStatus: 'declining', rowError: null });
    try {
      await axiosInstance.patch(EP.stock_adjustment_by_id(adjId), { status: 'Declined' });
      patchRow(setRows, adjId, { rowStatus: 'declined' });
      toast.success(`${row?.adjNumber ?? 'Request'} declined.`);
    } catch (err) {
      patchRow(setRows, adjId, {
        rowStatus: 'pending',
        rowError: extractErrorMessage(err?.response?.data || err),
      });
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        Approve / Decline Stock Requests
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          {product.name}
          {product.code ? ` · ${product.code}` : ''} — Current global stock:{' '}
          <strong>
            {Number(product.on_hand ?? 0)} {product.uom_name || ''}
          </strong>
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {rows.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
              No pending requests found for this product.
            </Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ pl: 2.5 }}>Reference</TableCell>
                <TableCell>Warehouse / Office</TableCell>
                <TableCell align="right" sx={{ width: 140 }}>
                  Requested Qty
                </TableCell>
                <TableCell align="center" sx={{ width: 130 }}>
                  Status
                </TableCell>
                <TableCell align="right" sx={{ width: 260, pr: 2.5 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                const isDone = row.rowStatus === 'approved' || row.rowStatus === 'declined';
                const isBusy = row.rowStatus === 'approving' || row.rowStatus === 'declining';
                const isConfirming = row.rowStatus === 'confirming_decline';
                const sourceAdj = pendingAdjustments.find((adj) => adj.id === row.adjId);
                const rowWfInfo = sourceAdj
                  ? computeAdjustmentWorkflowInfo(sourceAdj, rawWorkflow, userEmail, {
                      forceUnordered: true,
                    })
                  : null;
                const canApproveRow = rowWfInfo?.canApprove ?? true;

                return (
                  <React.Fragment key={row.adjId}>
                    <TableRow
                      sx={{
                        opacity: isDone ? 0.6 : 1,
                        bgcolor:
                          row.rowStatus === 'approved'
                            ? 'rgba(16,185,129,0.06)'
                            : row.rowStatus === 'declined'
                              ? 'rgba(239,68,68,0.06)'
                              : 'inherit',
                      }}
                    >
                      {/* Reference */}
                      <TableCell sx={{ pl: 2.5 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {row.adjNumber}
                        </Typography>
                      </TableCell>

                      {/* Warehouse */}
                      <TableCell>
                        <Typography variant="body2">{row.officeName}</Typography>
                      </TableCell>

                      {/* Qty (editable) */}
                      <TableCell align="right">
                        <TextField
                          type="number"
                          size="small"
                          value={row.qty}
                          onChange={(e) => handleQtyChange(row.adjId, e.target.value)}
                          inputProps={{
                            min: 1,
                            step: 'any',
                            style: { textAlign: 'right', width: 70 },
                          }}
                          disabled={isDone || isBusy || isConfirming}
                        />
                      </TableCell>

                      {/* Status badge */}
                      <TableCell align="center">
                        {isBusy ? (
                          <CircularProgress size={18} />
                        ) : (
                          <Chip
                            size="small"
                            variant="soft"
                            label={
                              row.rowStatus === 'approved'
                                ? 'Approved'
                                : row.rowStatus === 'declined'
                                  ? 'Declined'
                                  : row.rowStatus === 'confirming_decline'
                                    ? 'Confirming…'
                                    : 'Pending'
                            }
                            color={
                              row.rowStatus === 'approved'
                                ? 'success'
                                : row.rowStatus === 'declined'
                                  ? 'error'
                                  : row.rowStatus === 'confirming_decline'
                                    ? 'warning'
                                    : 'default'
                            }
                          />
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right" sx={{ pr: 2.5 }}>
                        {!isDone && !isBusy && !isConfirming && (
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {canApproveRow ? (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<Iconify icon="solar:check-circle-bold" width={14} />}
                                onClick={() => handleApproveRow(row.adjId)}
                                sx={{ textTransform: 'none', fontWeight: 700 }}
                              >
                                Approve
                              </Button>
                            ) : rowWfInfo?.eligibleApproverNames?.length ? (
                              <Typography variant="caption" color="text.secondary">
                                {rowWfInfo.eligibleApproverNames.join(', ')}
                              </Typography>
                            ) : null}
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<Iconify icon="solar:close-circle-bold" width={14} />}
                              onClick={() => handleDeclineRow(row.adjId)}
                              sx={{ textTransform: 'none', fontWeight: 700 }}
                            >
                              Decline
                            </Button>
                          </Stack>
                        )}

                        {isConfirming && (
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                            alignItems="center"
                          >
                            <Typography variant="caption" color="text.secondary">
                              Confirm?
                            </Typography>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              onClick={() => handleDeclineConfirm(row.adjId)}
                              sx={{ textTransform: 'none', fontWeight: 700 }}
                            >
                              Yes, Decline
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleDeclineCancel(row.adjId)}
                              sx={{ textTransform: 'none' }}
                            >
                              Cancel
                            </Button>
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Per-row error */}
                    {row.rowError && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ py: 0.5, pl: 2.5, pr: 2.5, borderTop: 0 }}>
                          <Alert
                            severity="error"
                            sx={{ py: 0.25, fontSize: '0.75rem', borderRadius: 1 }}
                          >
                            {row.rowError}
                          </Alert>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        {allDone && (
          <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
            All requests processed.
          </Typography>
        )}
        <Button onClick={handleClose} disabled={anyActive}>
          {anyChanged ? 'Done' : 'Cancel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
