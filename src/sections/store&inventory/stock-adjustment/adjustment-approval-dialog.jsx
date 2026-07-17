'use client';

import { toast } from 'sonner';
import { useState } from 'react';

import {
  Box,
  Chip,
  Alert,
  Stack,
  Table,
  Dialog,
  Button,
  Divider,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { extractErrorMessage } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const EP = endpoints.storeInventory;

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(value) {
  const n = Number(value || 0);
  return `৳${n.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(value));
}

function fmtDiff(value) {
  const n = Number(value || 0);
  if (n > 0) return `+${n.toLocaleString('en-BD')}`;
  return n.toLocaleString('en-BD');
}

function diffColor(value) {
  const n = Number(value || 0);
  if (n > 0) return 'success.main';
  if (n < 0) return 'error.main';
  return 'text.secondary';
}

function typeChipProps(type) {
  switch (
    String(type || '')
      .trim()
      .toLowerCase()
  ) {
    case 'increase':
      return { color: 'success', label: 'Increase' };
    case 'decrease':
      return { color: 'error', label: 'Decrease' };
    case 'recount':
      return { color: 'info', label: 'Recount' };
    default:
      return { color: 'default', label: type || 'Unknown' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * AdjustmentApprovalDialog
 *
 * Shows a full overview of the selected stock adjustment (meta info + line items),
 * then lets an authorised approver either Approve or Decline it.
 *
 * Props
 *   open        – boolean
 *   adjustment  – the full adjustment object (must have .lines[])
 *   onClose     – called when the user cancels
 *   onSuccess   – called after a successful Approve or Decline
 */
export default function AdjustmentApprovalDialog({
  open,
  adjustment,
  onClose,
  onSuccess,
  forceUnordered = false,
}) {
  const [submitting, setSubmitting] = useState(null); // 'approve' | 'decline' | null

  if (!adjustment) return null;

  const lines = Array.isArray(adjustment.lines) ? adjustment.lines : [];
  const chip = typeChipProps(adjustment.adjustment_type);
  const netDiff = lines.reduce((s, l) => s + Number(l.difference || 0), 0);
  const calcValue = lines.reduce(
    (s, l) => s + Math.abs(Number(l.difference || 0)) * Number(l.unit_price || 0),
    0
  );
  const docValue = adjustment.total_value != null ? adjustment.total_value : calcValue;
  const isBusy = submitting !== null;

  const handleAction = async (nextStatus) => {
    setSubmitting(nextStatus === 'Approved' ? 'approve' : 'decline');
    try {
      if (nextStatus === 'Approved') {
        const body = forceUnordered ? { force_unordered: true } : {};
        const response = await axiosInstance.post(EP.stock_adjustment_approve(adjustment.id), body);
        const nextStatus = response?.data?.status || 'Approved';
        toast.success(
          nextStatus === 'Approved'
            ? `${adjustment.adjustment_number || 'Adjustment'} approved — stock updated.`
            : `${adjustment.adjustment_number || 'Adjustment'} approval recorded.`
        );
      } else {
        await axiosInstance.patch(EP.stock_adjustment_by_id(adjustment.id), { status: nextStatus });
        toast.success(`${adjustment.adjustment_number || 'Adjustment'} declined.`);
      }
      onSuccess?.();
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err));
      setSubmitting(null);
    }
  };

  const metaFields = [
    {
      label: 'Warehouse / Office',
      value: adjustment.office_location_name || adjustment.warehouse_name || '—',
    },
    { label: 'Adjustment Date', value: fmtDate(adjustment.adjustment_date) },
    { label: 'Adjusted By', value: adjustment.adjusted_by_name || '—' },
    { label: 'Reason', value: adjustment.reason || '—' },
    { label: 'Total Items', value: String(lines.length) },
    { label: 'Document Value', value: fmtCurrency(docValue), highlight: true },
  ];

  return (
    <Dialog open={open} onClose={isBusy ? undefined : onClose} maxWidth="md" fullWidth>
      {/* ── Header ── */}
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" fontWeight={700} color="#0f172a">
              Review Stock Adjustment
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {adjustment.adjustment_number || 'Unnumbered'}&nbsp;·&nbsp;
              {adjustment.office_location_name || adjustment.warehouse_name || 'No warehouse'}
            </Typography>
          </Box>
          <Chip size="small" {...chip} variant="soft" sx={{ mt: 0.5 }} />
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {/* ── Meta overview ── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' },
            gap: 2,
            p: 2,
            bgcolor: '#f8fafc',
            borderRadius: 2,
            mb: 2.5,
          }}
        >
          {metaFields.map(({ label, value, highlight }) => (
            <Box key={label}>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography
                variant="body2"
                fontWeight={600}
                color={highlight ? 'primary.main' : '#0f172a'}
              >
                {value}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* ── Line items table ── */}
        <Typography variant="subtitle2" fontWeight={700} mb={1} color="#0f172a">
          Line Items
        </Typography>

        <TableContainer sx={{ border: '1px solid #e5e7eb', borderRadius: 1.5, mb: 1.5 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ width: 36 }}>#</TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="right">System Qty</TableCell>
                <TableCell align="right">Counted Qty</TableCell>
                <TableCell align="right">Difference</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Line Value</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.disabled">
                      No line items found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((line, idx) => (
                  <TableRow key={line.id ?? idx} hover>
                    <TableCell sx={{ color: 'text.disabled' }}>{idx + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {line.product_name || `Product #${line.product}`}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {Number(line.system_qty || 0).toLocaleString('en-BD')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {Number(line.counted_qty || 0).toLocaleString('en-BD')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color={diffColor(line.difference)}
                      >
                        {fmtDiff(line.difference)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{fmtCurrency(line.unit_price)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {fmtCurrency(
                          Math.abs(Number(line.difference || 0)) * Number(line.unit_price || 0)
                        )}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── Summary ── */}
        <Stack direction="row" justifyContent="flex-end" spacing={3} sx={{ px: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Net difference:{' '}
            <Typography
              component="span"
              variant="body2"
              fontWeight={700}
              color={diffColor(netDiff)}
            >
              {fmtDiff(netDiff)}
            </Typography>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total value:{' '}
            <Typography component="span" variant="body2" fontWeight={700} color="primary.main">
              {fmtCurrency(docValue)}
            </Typography>
          </Typography>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
          <strong>Approving</strong> will apply all line differences to warehouse stock
          immediately.&nbsp;
          <strong>Declining</strong> will cancel the request — no stock changes will occur.
        </Alert>
      </DialogContent>

      {/* ── Actions ── */}
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={isBusy} color="inherit" variant="outlined">
          Cancel
        </Button>

        <Box sx={{ flex: 1 }} />

        <Button
          variant="contained"
          color="error"
          disabled={isBusy}
          startIcon={
            submitting === 'decline' ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <Iconify icon="solar:close-circle-bold" width={18} />
            )
          }
          onClick={() => handleAction('Declined')}
          sx={{ mr: 1 }}
        >
          {submitting === 'decline' ? 'Declining…' : 'Decline'}
        </Button>

        <Button
          variant="contained"
          color="success"
          disabled={isBusy}
          startIcon={
            submitting === 'approve' ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <Iconify icon="solar:check-circle-bold" width={18} />
            )
          }
          onClick={() => handleAction('Approved')}
        >
          {submitting === 'approve' ? 'Approving…' : 'Approve'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
