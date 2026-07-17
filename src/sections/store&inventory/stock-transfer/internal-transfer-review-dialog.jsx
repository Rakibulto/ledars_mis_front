'use client';

import dayjs from 'dayjs';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Chip,
  Grid,
  Alert,
  Stack,
  Button,
  Dialog,
  Divider,
  Avatar,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import { extractErrorMessage, useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const EP = endpoints.storeInventory;
const APPROVAL_WORKFLOW_URL =
  '/api/approval-workflows/?module_type=inventory&menu=internal_transfers';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(v) {
  if (!v) return '—';
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(v));
}

function fmtDateTime(v) {
  if (!v) return '—';
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(v)
  );
}

function fmtQty(v) {
  return Number(v || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 });
}

function statusChip(status) {
  const map = {
    Draft: { color: 'default', icon: 'solar:document-text-bold-duotone' },
    'Pending Transit Approval': { color: 'warning', icon: 'solar:clock-circle-bold-duotone' },
    'In Transit': { color: 'info', icon: 'solar:delivery-bold-duotone' },
    'Back Transit': { color: 'warning', icon: 'solar:arrow-left-bold-duotone' },
    Received: { color: 'success', icon: 'solar:check-circle-bold-duotone' },
    'Back Received': { color: 'success', icon: 'solar:refresh-bold-duotone' },
    Cancelled: { color: 'error', icon: 'solar:close-circle-bold-duotone' },
  };
  const cfg = map[status] || { color: 'default', icon: 'solar:question-circle-bold-duotone' };
  return (
    <Chip
      size="small"
      label={status}
      color={cfg.color}
      variant="soft"
      icon={<Iconify icon={cfg.icon} width={13} />}
      sx={{ fontWeight: 700, '& .MuiChip-icon': { ml: 0.75 } }}
    />
  );
}

// ── transport form empty state ──────────────────────────────────────────────

const EMPTY_TRANSPORT = {
  transport_person: '',
  transport_phone: '',
  transport_address: '',
  vehicle_number: '',
  dispatch_date: null,
};

// ── Approver metadata helpers ───────────────────────────────────────────────

/**
 * Compute the total transfer value from lines.
 */
function getTransferTotal(transfer) {
  const lines = Array.isArray(transfer?.lines) ? transfer.lines : [];
  if (lines.length > 0) {
    const computed = lines.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
      0
    );
    if (computed > 0) return computed;
  }
  return Number(transfer?.total_value || 0);
}

/**
 * Normalise workflow response.
 */
function normalizeWorkflow(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  if (Array.isArray(raw.results)) return raw.results[0] ?? null;
  if (raw.id) return raw;
  return null;
}

/**
 * Find the matched level for a given total amount.
 */
function findMatchedLevel(workflow, totalAmount) {
  if (!workflow?.is_active) return null;
  const levels = Array.isArray(workflow.levels) ? workflow.levels : [];
  return (
    levels.find((lvl) => {
      const from = Number(lvl.from_amount);
      const to =
        lvl.to_amount !== null && lvl.to_amount !== undefined ? Number(lvl.to_amount) : Infinity;
      return totalAmount >= from && totalAmount <= to;
    }) ?? null
  );
}

// ── Status Log Viewer ───────────────────────────────────────────────────────

function StatusLogTimeline({ logEntries }) {
  const theme = useTheme();
  if (!Array.isArray(logEntries) || logEntries.length === 0) {
    return (
      <Typography variant="caption" color="text.disabled">
        No approval history yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ position: 'relative' }}>
      {/* Vertical line */}
      <Box
        sx={{
          position: 'absolute',
          left: 11,
          top: 8,
          bottom: 8,
          width: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.15),
          borderRadius: 1,
        }}
      />
      {logEntries.map((entry, i) => (
        <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
          <Avatar
            sx={{
              width: 24,
              height: 24,
              fontSize: 11,
              fontWeight: 800,
              bgcolor:
                entry.status_to === 'In Transit'
                  ? theme.palette.success.main
                  : alpha(theme.palette.primary.main, 0.12),
              color: entry.status_to === 'In Transit' ? '#fff' : theme.palette.primary.main,
              zIndex: 1,
            }}
          >
            <Iconify
              icon={
                entry.status_to === 'In Transit'
                  ? 'solar:check-circle-bold-duotone'
                  : 'solar:user-check-bold-duotone'
              }
              width={14}
            />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" fontWeight={700} display="block">
              {entry.name || entry.email || 'Unknown'}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {entry.status_from} → {entry.status_to}
            </Typography>
            {entry.log_time && (
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
                {fmtDateTime(entry.log_time)}
              </Typography>
            )}
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function InternalTransferReviewDialog({ open, transfer, onClose, onSuccess }) {
  const theme = useTheme();
  const { user } = useAuthContext();
  const [submitting, setSubmitting] = useState(null);
  const [transport, setTransport] = useState(EMPTY_TRANSPORT);

  // Editable line quantities: localId → quantity
  const [lineQuantities, setLineQuantities] = useState({});
  // LocationStock data: product_id → available quantity
  const [locationStockMap, setLocationStockMap] = useState({});
  const [stockLoading, setStockLoading] = useState(false);

  // Fetch workflow configuration
  const { data: rawWorkflow } = useGetRequest(APPROVAL_WORKFLOW_URL);

  // ── Fetch LocationStock data for the from_office ──────────────────────────
  const fetchLocationStock = useCallback(async () => {
    if (!transfer?.from_office_id) return;
    setStockLoading(true);
    try {
      const res = await axiosInstance.get(EP.location_stocks, {
        params: { office_location: transfer.from_office_id, pagination: false },
      });
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
          ? res.data.results
          : [];
      const map = {};
      data.forEach((item) => {
        map[String(item.product)] = Number(item.quantity || 0);
      });
      setLocationStockMap(map);
    } catch {
      // Silent fail - stock check will show proper error during validation
    } finally {
      setStockLoading(false);
    }
  }, [transfer?.from_office_id]);

  useEffect(() => {
    if (open && transfer?.from_office_id) {
      fetchLocationStock();
    }
  }, [open, transfer?.from_office_id, fetchLocationStock]);

  // ── Derived workflow state ────────────────────────────────────────────────
  const workflowInfo = useMemo(() => {
    if (!transfer || !rawWorkflow) return null;

    const workflow = normalizeWorkflow(rawWorkflow);
    if (!workflow) return null;

    const totalAmount = getTransferTotal(transfer);
    const matchedLevel = findMatchedLevel(workflow, totalAmount);
    if (!matchedLevel) return null;

    const minRequired = Number(matchedLevel.minimum_approval_required ?? 1);
    const currentLevel = Number(transfer.approval_level ?? 0);
    const fullyApproved = currentLevel >= minRequired;
    const ordered = matchedLevel.level_maintain_require === 'yes';
    const levelUsers = Array.isArray(matchedLevel.level_users) ? matchedLevel.level_users : [];

    // Check if current user already approved (by email in status_log)
    const userEmail = user?.email?.toLowerCase() || '';
    const statusLog = Array.isArray(transfer?.status_log) ? transfer.status_log : [];
    const alreadyApproved = userEmail
      ? statusLog.some((entry) => (entry.email ?? '').toLowerCase() === userEmail)
      : false;

    const userEntry = userEmail
      ? levelUsers.find((lu) => (lu.user_detail?.email ?? '').toLowerCase() === userEmail)
      : null;

    let canApprove = false;
    if (userEntry && !fullyApproved && !alreadyApproved) {
      if (ordered) {
        canApprove = userEntry.approval_order === currentLevel + 1;
      } else {
        canApprove = true;
      }
    }

    // Build pending approver display
    let pendingApprover = null;
    if (!fullyApproved) {
      if (ordered) {
        const nextOrder = currentLevel + 1;
        const nextUser = levelUsers.find((lu) => lu.approval_order === nextOrder);
        pendingApprover = nextUser?.user_detail?.full_name || nextUser?.user_detail?.email || null;
      } else {
        pendingApprover = levelUsers
          .map((lu) => lu.user_detail?.full_name || lu.user_detail?.email)
          .filter(Boolean)
          .join(', ');
      }
    }

    return {
      matchedLevel,
      minRequired,
      currentLevel,
      fullyApproved,
      ordered,
      canApprove,
      levelUsers,
      pendingApprover,
      userEntry,
      isFinalApprover: userEntry && currentLevel + 1 >= minRequired,
      alreadyApproved,
    };
  }, [transfer, rawWorkflow, user]);

  // Determine if this transfer needs approval or direct dispatch
  const needsApproval = workflowInfo && !workflowInfo.fullyApproved;

  // Pre-fill transport fields if they already exist on the transfer
  useEffect(() => {
    if (transfer) {
      setTransport({
        transport_person: transfer.transport_person || '',
        transport_phone: transfer.transport_phone || '',
        transport_address: transfer.transport_address || '',
        vehicle_number: transfer.vehicle_number || '',
        dispatch_date: transfer.dispatch_date ? dayjs(transfer.dispatch_date) : null,
      });
    }
  }, [transfer]);

  // Initialize line quantities from transfer lines
  useEffect(() => {
    if (transfer && open) {
      const transferLines = Array.isArray(transfer.lines) ? transfer.lines : [];
      const initial = {};
      transferLines.forEach((line) => {
        initial[line.id || `line-${transferLines.indexOf(line)}`] = String(
          Number(line.quantity || 0)
        );
      });
      setLineQuantities(initial);
    }
  }, [transfer, open]);

  const lines = useMemo(
    () => (Array.isArray(transfer?.lines) ? transfer.lines : []),
    [transfer?.lines]
  );

  // Compute adjusted total qty from editable quantities
  const adjustedTotalQty = useMemo(() => {
    let total = 0;
    lines.forEach((line) => {
      const lineId = line.id || `line-${lines.indexOf(line)}`;
      const qty = Number(lineQuantities[lineId] || line.quantity || 0);
      total += qty;
    });
    return total;
  }, [lines, lineQuantities]);

  if (!transfer) return null;

  const isBusy = submitting !== null;
  const statusLogs = Array.isArray(transfer.status_log) ? transfer.status_log : [];
  const totalQty = lines.reduce((s, l) => s + Number(l.quantity || 0), 0);

  const handleTransportChange = (e) => {
    const { name, value } = e.target;
    setTransport((prev) => ({ ...prev, [name]: value }));
  };

  const handleLineQtyChange = (lineId, value) => {
    setLineQuantities((prev) => ({
      ...prev,
      [lineId]: value,
    }));
  };

  const isTransportValid =
    transport.transport_person.trim() &&
    transport.transport_phone.trim() &&
    transport.transport_address.trim() &&
    transport.dispatch_date &&
    dayjs(transport.dispatch_date).isValid();

  /**
   * Validate stock availability against LocationStock data.
   * Returns { valid: boolean, errors: string[] }
   */
  const validateStockAvailability = () => {
    if (!transfer?.from_office_id) {
      return { valid: true, errors: [] };
    }

    const errors = [];

    if (Object.keys(locationStockMap).length === 0 && !stockLoading) {
      // No LocationStock data loaded - skip validation to avoid blocking
      return { valid: true, errors: [] };
    }

    lines.forEach((line) => {
      const productId = String(line.product);
      const availableQty = Number(locationStockMap[productId] || 0);
      const requestedQty = Number(
        lineQuantities[line.id || `line-${lines.indexOf(line)}`] || line.quantity || 0
      );

      if (requestedQty > availableQty) {
        errors.push({
          productName: line.product_name || line.item_name || 'Unknown Item',
          requested: requestedQty,
          available: availableQty,
        });
      }
    });

    if (errors.length > 0) {
      // Build a user-friendly toast message
      const errorMessages = errors.map(
        (e) =>
          `Insufficient stock for ${e.productName}.\nRequested Quantity: ${fmtQty(e.requested)}\nAvailable Quantity: ${fmtQty(e.available)}\nPlease add stock to the selected storage or reduce the transfer quantity before approval.`
      );
      return { valid: false, errors: errorMessages };
    }

    return { valid: true, errors: [] };
  };

  /**
   * Build the updated line items with modified quantities.
   */
  const buildUpdatedLineItems = () =>
    lines.map((line) => {
      const lineId = line.id || `line-${lines.indexOf(line)}`;
      const newQty = Number(lineQuantities[lineId] || line.quantity || 0);
      return {
        ...line,
        quantity: newQty,
      };
    });

  /**
   * Approve action – calls the new /approve/ endpoint.
   * Always sends transport details along with the approval so they are saved
   * at every approval step. Final approver must provide valid transport details.
   */
  const handleApprove = async () => {
    // Stock validation before dispatch (for final approver or direct dispatch)
    if (workflowInfo?.isFinalApprover || !workflowInfo) {
      const validation = validateStockAvailability();
      if (!validation.valid) {
        validation.errors.forEach((msg) => toast.error(msg, { duration: 8000 }));
        setSubmitting(null);
        return;
      }
    }

    setSubmitting('approve');
    try {
      // Final approver must have valid transport details
      if (workflowInfo?.isFinalApprover && !isTransportValid) {
        toast.error('Please fill in all required transportation details before final dispatch.');
        setSubmitting(null);
        return;
      }

      // Build payload with transport details (always sent so backend saves them)
      const payload = {};
      if (transport.transport_person.trim()) {
        Object.assign(payload, {
          transport_person: transport.transport_person.trim(),
          transport_phone: transport.transport_phone.trim(),
          transport_address: transport.transport_address.trim(),
          dispatch_date: transport.dispatch_date
            ? dayjs(transport.dispatch_date).format('YYYY-MM-DD')
            : undefined,
          ...(transport.vehicle_number.trim() && {
            vehicle_number: transport.vehicle_number.trim(),
          }),
        });
      }

      // Include updated line item quantities in the payload
      const updatedLines = buildUpdatedLineItems();
      payload.lines = updatedLines.map((line) => ({
        id: line.id,
        product: line.product,
        product_name: line.product_name,
        product_code: line.product_code,
        quantity: Number(line.quantity || 0),
        unit_price: Number(line.unit_price || 0),
        unit: line.unit || '',
        notes: line.notes || '',
      }));

      await axiosInstance.post(EP.internal_transfer_approve(transfer.id), payload);
      toast.success('Approval submitted successfully.');
      setTransport(EMPTY_TRANSPORT);
      setSubmitting(null);
      onSuccess?.();
    } catch (err) {
      const errorMsg = extractErrorMessage(err?.response?.data || err);
      // Check if it's the "Insufficient stock" ValueError from backend
      if (
        errorMsg &&
        (errorMsg.includes('Insufficient stock') || errorMsg.includes('insufficient'))
      ) {
        toast.error(
          'Requested quantity exceeds available stock. Please update stock quantity in the source storage before approving this transfer.',
          { duration: 8000 }
        );
      } else {
        toast.error(errorMsg || 'Approval failed.');
      }
      setSubmitting(null);
    }
  };

  /**
   * Direct dispatch (when no workflow is configured) – uses old change-status.
   */
  const handleDirectDispatch = async () => {
    // Stock validation before dispatch
    const validation = validateStockAvailability();
    if (!validation.valid) {
      validation.errors.forEach((msg) => toast.error(msg, { duration: 8000 }));
      setSubmitting(null);
      return;
    }

    setSubmitting('dispatch');
    try {
      const payload = {
        status: 'In Transit',
        transport_person: transport.transport_person.trim(),
        transport_phone: transport.transport_phone.trim(),
        transport_address: transport.transport_address.trim(),
        dispatch_date: dayjs(transport.dispatch_date).format('YYYY-MM-DD'),
        ...(transport.vehicle_number.trim() && {
          vehicle_number: transport.vehicle_number.trim(),
        }),
      };
      await axiosInstance.post(EP.internal_transfer_change_status(transfer.id), payload);
      toast.success(`Transfer dispatched successfully.`);
      setTransport(EMPTY_TRANSPORT);
      setSubmitting(null);
      onSuccess?.();
    } catch (err) {
      const errorMsg = extractErrorMessage(err?.response?.data || err);
      if (
        errorMsg &&
        (errorMsg.includes('Insufficient stock') || errorMsg.includes('insufficient'))
      ) {
        toast.error(
          'Requested quantity exceeds available stock. Please update stock quantity in the source storage before approving this transfer.',
          { duration: 8000 }
        );
      } else {
        toast.error(errorMsg || 'Dispatch failed.');
      }
      setSubmitting(null);
    }
  };

  /**
   * Mark as Received (In Transit → Received)
   */
  const handleMarkReceived = async () => {
    setSubmitting('received');
    try {
      const payload = { status: 'Received' };
      await axiosInstance.post(EP.internal_transfer_change_status(transfer.id), payload);
      toast.success('Transfer marked as Received.');
      setSubmitting(null);
      onSuccess?.();
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err) || 'Failed to mark as received.');
      setSubmitting(null);
    }
  };

  /**
   * Mark as Not Received (In Transit → Back Transit)
   */
  const handleMarkNotReceived = async () => {
    setSubmitting('not_received');
    try {
      const payload = { status: 'Back Transit' };
      await axiosInstance.post(EP.internal_transfer_change_status(transfer.id), payload);
      toast.success('Transfer marked as Not Received. Status changed to Back Transit.');
      setSubmitting(null);
      onSuccess?.();
    } catch (err) {
      toast.error(
        extractErrorMessage(err?.response?.data || err) || 'Failed to mark as not received.'
      );
      setSubmitting(null);
    }
  };

  return (
    <Dialog open={open} onClose={isBusy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: 'primary.main',
              }}
            >
              <Iconify icon="solar:transfer-horizontal-bold-duotone" width={20} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
                {transfer.status === 'In Transit'
                  ? 'Receive Transfer'
                  : 'Review & Approve Transfer'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {transfer.transfer_number || `IT-${transfer.id}`}
              </Typography>
            </Box>
          </Stack>
          {statusChip(transfer.status)}
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 2 }}>
        <Stack spacing={2}>
          {/* Route info */}
          <Box
            sx={{
              p: 1.75,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            }}
          >
            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
              <Stack spacing={0} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  From
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {transfer.from_office_name || '—'}
                </Typography>
              </Stack>
              <Iconify
                icon="solar:arrow-right-bold"
                width={18}
                sx={{ color: 'primary.main', mx: 0.5 }}
              />
              <Stack spacing={0} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  To
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {transfer.to_office_name || '—'}
                </Typography>
              </Stack>
              <Box sx={{ ml: 'auto' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Date
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {fmtDate(transfer.transfer_date)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Lines summary with editable quantities */}
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 0.75 }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                ITEMS ({lines.length})
              </Typography>
              {stockLoading && <CircularProgress size={14} sx={{ color: 'text.disabled' }} />}
            </Stack>
            <Stack spacing={1}>
              {lines.slice(0, 10).map((line, i) => {
                const lineId = line.id || `line-${i}`;
                const currentQty =
                  lineQuantities[lineId] !== undefined
                    ? lineQuantities[lineId]
                    : String(Number(line.quantity || 0));
                const productId = String(line.product);
                const availableStock = Number(locationStockMap[productId] || 0);
                const requestedQty = Number(currentQty || 0);
                const stockDataLoaded = Object.keys(locationStockMap).length > 0;
                const productInStock = Object.hasOwn(locationStockMap, productId);
                // Show warning when:
                // 1. Product exists in stock map AND requested > available, OR
                // 2. Stock data loaded but product NOT found (0 stock) AND requested > 0 AND product has an ID
                const exceedsStock =
                  requestedQty > 0 &&
                  line.product &&
                  ((productInStock && requestedQty > availableStock) ||
                    (!productInStock && stockDataLoaded && requestedQty > 0));

                return (
                  <Stack
                    key={lineId}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 1.5,
                      bgcolor: alpha(
                        exceedsStock ? theme.palette.error.main : theme.palette.grey[500],
                        exceedsStock ? 0.12 : 0.05
                      ),
                      border: exceedsStock ? `2px solid red` : '1px solid transparent',
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: '100%' }}>
                        {line.product_name || `Item ${i + 1}`}
                      </Typography>
                      {line.unit && (
                        <Typography variant="caption" color="text.secondary">
                          {line.unit}
                          {stockDataLoaded && ` | Available: ${fmtQty(availableStock)}`}
                        </Typography>
                      )}
                    </Box>
                    <TextField
                      size="small"
                      type="number"
                      value={currentQty}
                      onChange={(e) => handleLineQtyChange(lineId, e.target.value)}
                      inputProps={{
                        min: 0,
                        step: 'any',
                      }}
                      sx={{
                        width: 100,
                        '& .MuiOutlinedInput-input': {
                          textAlign: 'right',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          py: 0.75,
                        },
                      }}
                      error={exceedsStock}
                      helperText={
                        exceedsStock ? `Exceeds available (${fmtQty(availableStock)})` : ''
                      }
                      disabled={transfer.status === 'In Transit' || isBusy}
                      FormHelperTextProps={{
                        sx: { fontSize: '0.65rem', mt: 0.25, mx: 0 },
                      }}
                    />
                  </Stack>
                );
              })}
              {lines.length > 10 && (
                <Typography variant="caption" color="text.disabled" sx={{ pl: 1.5 }}>
                  + {lines.length - 10} more items
                </Typography>
              )}
            </Stack>
            {lines.length > 0 && (
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.75, px: 1.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  Total Quantity
                </Typography>
                <Typography variant="caption" fontWeight={800} color="primary.main">
                  {fmtQty(adjustedTotalQty)} units
                </Typography>
              </Stack>
            )}
          </Box>

          {/* ── Approval Progress Section ── */}
          {workflowInfo && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                bgcolor: alpha(theme.palette.warning.main, 0.04),
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <Iconify
                  icon="solar:users-group-rounded-bold-duotone"
                  width={18}
                  sx={{ color: 'warning.main' }}
                />
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="warning.main"
                  sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  Approval Progress
                </Typography>
                <Chip
                  size="small"
                  label={`${workflowInfo.currentLevel} / ${workflowInfo.minRequired}`}
                  color={workflowInfo.fullyApproved ? 'success' : 'warning'}
                  variant="soft"
                  sx={{ ml: 'auto', fontWeight: 700, fontSize: 11 }}
                />
              </Stack>

              {/* Pending approver info */}
              {!workflowInfo.fullyApproved && workflowInfo.pendingApprover && (
                <Alert
                  severity="info"
                  icon={<Iconify icon="solar:clock-circle-bold-duotone" width={16} />}
                  sx={{ mb: 1.5, borderRadius: 1.5 }}
                >
                  <Typography variant="caption" fontWeight={600}>
                    {workflowInfo.ordered
                      ? `Pending approval from: ${workflowInfo.pendingApprover}`
                      : `Pending approval from: ${workflowInfo.pendingApprover} (any order)`}
                  </Typography>
                </Alert>
              )}

              {/* Status Log Timeline */}
              <StatusLogTimeline logEntries={statusLogs} />
            </Box>
          )}

          {/* ── Transport Details Section ── */}
          {/* Always show transport details when dialog is open for Draft/Pending Transit Approval */}
          {(transfer.status === 'Draft' || transfer.status === 'Pending Transit Approval') && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.info.main, 0.25)}`,
                bgcolor: alpha(theme.palette.info.main, 0.04),
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <Iconify
                  icon="solar:delivery-bold-duotone"
                  width={18}
                  sx={{ color: 'info.main' }}
                />
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="info.main"
                  sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  Transportation Details
                </Typography>
                {workflowInfo?.isFinalApprover && (
                  <Chip
                    size="small"
                    label="Required for dispatch"
                    color="error"
                    variant="outlined"
                    sx={{ ml: 'auto', fontWeight: 700, fontSize: 10 }}
                  />
                )}
                {workflowInfo && !workflowInfo.isFinalApprover && (
                  <Chip
                    size="small"
                    label="Optional"
                    color="default"
                    variant="outlined"
                    sx={{ ml: 'auto', fontWeight: 600, fontSize: 10 }}
                  />
                )}
              </Stack>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required={workflowInfo?.isFinalApprover || !workflowInfo}
                    size="small"
                    label="Transport Person / Courier Name"
                    name="transport_person"
                    value={transport.transport_person}
                    onChange={handleTransportChange}
                    placeholder="e.g. Abdul Karim / DHL"
                    disabled={isBusy}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required={workflowInfo?.isFinalApprover || !workflowInfo}
                    size="small"
                    label="Phone Number"
                    name="transport_phone"
                    value={transport.transport_phone}
                    onChange={handleTransportChange}
                    placeholder="e.g. 01700-000000"
                    disabled={isBusy}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    required={workflowInfo?.isFinalApprover || !workflowInfo}
                    size="small"
                    label="Address"
                    name="transport_address"
                    value={transport.transport_address}
                    onChange={handleTransportChange}
                    placeholder="Transport person or courier address"
                    multiline
                    minRows={2}
                    disabled={isBusy}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Dispatch Date"
                    value={transport.dispatch_date}
                    onChange={(newValue) =>
                      setTransport((prev) => ({ ...prev, dispatch_date: newValue }))
                    }
                    format="DD/MM/YYYY"
                    disabled={isBusy}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: workflowInfo?.isFinalApprover || !workflowInfo,
                        size: 'small',
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Vehicle Number (optional)"
                    name="vehicle_number"
                    value={transport.vehicle_number}
                    onChange={handleTransportChange}
                    placeholder="e.g. Dhaka Metro GA-1234"
                    disabled={isBusy}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* ── Action Buttons ── */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              sx={{ mb: 1, display: 'block' }}
            >
              {transfer.status === 'In Transit'
                ? 'RECEIVE ACTION'
                : workflowInfo
                  ? 'APPROVAL ACTION'
                  : 'AVAILABLE ACTIONS'}
            </Typography>
            <Stack spacing={1}>
              {/* In Transit: Show Received / Not Received buttons */}
              {transfer.status === 'In Transit' && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    bgcolor: alpha(theme.palette.success.main, 0.04),
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Has the destination received all items? Choose one of the options below.
                  </Typography>
                  <Stack direction="row" spacing={1.5}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={
                        submitting === 'received' ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : (
                          <Iconify icon="solar:check-circle-bold-duotone" width={16} />
                        )
                      }
                      disabled={isBusy}
                      onClick={handleMarkReceived}
                      sx={{ fontWeight: 700 }}
                    >
                      {submitting === 'received' ? 'Processing...' : 'Received'}
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      color="warning"
                      size="small"
                      startIcon={
                        submitting === 'not_received' ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : (
                          <Iconify icon="solar:close-circle-bold-duotone" width={16} />
                        )
                      }
                      disabled={isBusy}
                      onClick={handleMarkNotReceived}
                      sx={{ fontWeight: 700 }}
                    >
                      {submitting === 'not_received' ? 'Processing...' : 'Not Received'}
                    </Button>
                  </Stack>
                </Box>
              )}

              {/* Approval workflow: Show Approve / Submit Dispatch button */}
              {workflowInfo && workflowInfo.canApprove && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: `1px solid ${alpha(
                      workflowInfo.isFinalApprover
                        ? theme.palette.success.main
                        : theme.palette.primary.main,
                      0.2
                    )}`,
                    bgcolor: alpha(
                      workflowInfo.isFinalApprover
                        ? theme.palette.success.main
                        : theme.palette.primary.main,
                      0.04
                    ),
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {workflowInfo.isFinalApprover
                      ? 'You are the final approver. Provide transportation details and submit to dispatch the goods.'
                      : 'Review the transfer details and approve to move to the next stage.'}
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    color={workflowInfo.isFinalApprover ? 'success' : 'primary'}
                    size="small"
                    startIcon={
                      submitting === 'approve' ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : (
                        <Iconify
                          icon={
                            workflowInfo.isFinalApprover
                              ? 'solar:delivery-bold-duotone'
                              : 'solar:user-check-bold-duotone'
                          }
                          width={16}
                        />
                      )
                    }
                    disabled={isBusy || (workflowInfo.isFinalApprover && !isTransportValid)}
                    onClick={handleApprove}
                    sx={{ fontWeight: 700 }}
                  >
                    {submitting === 'approve'
                      ? 'Processing...'
                      : workflowInfo.isFinalApprover
                        ? 'Submit Dispatch'
                        : 'Approve'}
                  </Button>
                </Box>
              )}

              {/* No workflow: Direct dispatch (old behavior) */}
              {!workflowInfo && transfer.status === 'Draft' && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    bgcolor: alpha(theme.palette.info.main, 0.04),
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Fill in the transportation details below, then dispatch. Quantity will be
                    deducted from the source inventory immediately.
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    color="info"
                    size="small"
                    startIcon={
                      submitting === 'dispatch' ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : (
                        <Iconify icon="solar:delivery-bold-duotone" width={16} />
                      )
                    }
                    disabled={isBusy || !isTransportValid}
                    onClick={handleDirectDispatch}
                    sx={{ fontWeight: 700 }}
                  >
                    {submitting === 'dispatch' ? 'Processing' : 'Dispatch'}
                  </Button>
                </Box>
              )}

              {/* User already approved this transfer */}
              {workflowInfo && workflowInfo.alreadyApproved && !workflowInfo.fullyApproved && (
                <Alert
                  severity="success"
                  icon={<Iconify icon="solar:check-circle-bold-duotone" width={16} />}
                  sx={{ borderRadius: 2 }}
                >
                  <Typography variant="caption" fontWeight={600}>
                    You have already approved this transfer. Awaiting other approvers.
                  </Typography>
                </Alert>
              )}

              {/* User is not the current approver – show pending message */}
              {workflowInfo &&
                !workflowInfo.canApprove &&
                !workflowInfo.fullyApproved &&
                !workflowInfo.alreadyApproved && (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    {workflowInfo.ordered
                      ? `Approval is pending from: ${workflowInfo.pendingApprover || 'the next user in order'}`
                      : `Awaiting approval from authorized approvers.`}
                  </Alert>
                )}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button variant="outlined" color="inherit" onClick={onClose} disabled={isBusy}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
