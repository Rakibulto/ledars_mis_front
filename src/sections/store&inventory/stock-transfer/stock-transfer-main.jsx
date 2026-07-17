'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import { useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  Grid,
  alpha,
  Alert,
  Stack,
  Table,
  Button,
  Tooltip,
  MenuItem,
  Skeleton,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Pagination,
  Typography,
  InputAdornment,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useDebounce } from 'src/hooks/use-debounce';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { useAuthContext } from 'src/auth/hooks';

import InternalTransferPDF from './internal-transfer-pdf';
import InternalTransferFormDialog from './internal-transfer-form-dialog';
import InternalTransferReviewDialog from './internal-transfer-review-dialog';
import InternalTransferBackReceiveDialog from './internal-transfer-back-receive-dialog';

// ─── constants ────────────────────────────────────────────────────────────────

const EP = endpoints.storeInventory;
const PM = endpoints.procurement_management;

/**
 * New approval workflow endpoint replacing EP.inventory_approval_matrix.
 * Fetches the active workflow configured for internal_transfers under the inventory module.
 */
const APPROVAL_WORKFLOW_URL =
  '/api/approval-workflows/?module_type=inventory&menu=internal_transfers';

/**
 * Message shown when a transfer amount does not match any configured workflow level.
 * Displayed when the user clicks the "No Workflow" warning button in the Next Action column.
 */
const NO_WORKFLOW_LEVEL_MESSAGE =
  'Please contact the admin to configure the Approval Workflow properly with level-based permissions from the Approval Workflow settings.';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Pending Transit Approval', label: 'Pending Transit Approval' },
  { value: 'In Transit', label: 'In Transit' },
  { value: 'Back Transit', label: 'Back Transit' },
  { value: 'Received', label: 'Received' },
  { value: 'Back Received', label: 'Back Received' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const STATUS_CONFIG = {
  Draft: {
    color: 'default',
    icon: 'solar:document-text-bold-duotone',
    reviewable: true,
  },
  'Pending Transit Approval': {
    color: 'warning',
    icon: 'solar:clock-circle-bold-duotone',
    reviewable: true,
  },
  'In Transit': {
    color: 'info',
    icon: 'solar:delivery-bold-duotone',
    reviewable: true,
  },
  'Back Transit': {
    color: 'warning',
    icon: 'solar:arrow-left-bold-duotone',
    reviewable: true,
  },
  Received: {
    color: 'success',
    icon: 'solar:check-circle-bold-duotone',
    reviewable: false,
  },
  'Back Received': {
    color: 'success',
    icon: 'solar:refresh-bold-duotone',
    reviewable: false,
  },
  Cancelled: {
    color: 'error',
    icon: 'solar:close-circle-bold-duotone',
    reviewable: false,
  },
};

// ─── Approval Workflow helpers ─────────────────────────────────────────────────
//
// These replace the old rawApprovalMatrix / EP.inventory_approval_matrix logic.
// The new workflow API supports:
//   - Amount-range based level matching (from_amount / to_amount)
//   - minimum_approval_required  → how many approvers must sign off
//   - level_maintain_require     → "yes" enforces approval_order sequence
//   - level_users                → list of permitted approvers per level

/**
 * Normalise the raw API response from APPROVAL_WORKFLOW_URL.
 * The list endpoint may return an array or a paginated { results: [] } object.
 * We always work with the first (and typically only) workflow returned.
 */
function normalizeWorkflow(raw) {
  // console.log('Raw workflow response:', raw);
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  if (Array.isArray(raw.results)) return raw.results[0] ?? null;
  // Single-object response (e.g. from a detail URL)
  if (raw.id) return raw;
  return null;
}

/**
 * Derive the transfer's total monetary value.
 * Prefers computing from line items (quantity × unit_price) because that is
 * the most accurate source; falls back to the server-computed `total_value`
 * field if lines are not embedded in the list response.
 */
function getTransferTotal(transfer) {
  const lines = Array.isArray(transfer?.lines) ? transfer.lines : [];
  if (lines.length > 0) {
    const computed = lines.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
      0
    );
    // Only use computed value if it is non-zero; otherwise fall through to
    // total_value (handles the case where unit_price is missing from list items).
    if (computed > 0) return computed;
  }
  return Number(transfer?.total_value || 0);
}

/**
 * Find the workflow level whose (from_amount, to_amount) range contains totalAmount.
 * Returns null if the workflow is inactive or no level matches.
 */
function findMatchedLevel(workflow, totalAmount) {
  if (!workflow?.is_active) return null;
  const levels = Array.isArray(workflow.levels) ? workflow.levels : [];
  return (
    levels.find((lvl) => {
      const from = Number(lvl.from_amount);
      // to_amount: null means no upper bound (unlimited), treat as Infinity.
      const to =
        lvl.to_amount !== null && lvl.to_amount !== undefined ? Number(lvl.to_amount) : Infinity;
      return totalAmount >= from && totalAmount <= to;
    }) ?? null
  );
}

/**
 * Central function that produces all workflow-related state for a single transfer.
 *
 * Returns:
 *   matchedLevel        – the workflow level object that applies (or null)
 *   canApprove          – whether the logged-in user may click "Review" right now
 *   noMatchWarning      – true when the transfer amount is outside every level range
 *   nextApprover        – display name(s) of the next pending approver(s)
 *   approvalProgress    – human-readable string e.g. "1 / 2"
 *   fullyApproved       – true when minimum_approval_required is already met
 *   levelUsers          – full level_users array (for detail dialogs)
 *   orderedApproval     – true when level_maintain_require === "yes"
 */
function computeWorkflowInfo(transfer, rawWorkflow, userEmail) {
  const statusCfg = STATUS_CONFIG[transfer?.status];
  const isReviewable = statusCfg?.reviewable ?? false;

  const workflow = normalizeWorkflow(rawWorkflow);
  // console.log('Normalized workflow:', workflow);

  // ── No workflow configured at all ──────────────────────────────────────────
  if (!workflow) {
    return {
      matchedLevel: null,
      canApprove: false,
      // transitShowReviewButton:
      //   transfer.status === 'In Transit' || transfer.status === 'Back Transit',
      noMatchWarning: false,
      nextApprover: null,
      approvalProgress: null,
      fullyApproved: false,
      levelUsers: [],
      orderedApproval: false,
      alreadyApproved: false,
    };
  }
  console.log('Workflow config:', workflow);
  const totalAmount = getTransferTotal(transfer);
  const matchedLevel = findMatchedLevel(workflow, totalAmount);

  // ── Workflow exists but no level range matches this transfer's amount ───────
  if (!matchedLevel) {
    return {
      matchedLevel: null,
      canApprove: false,
      transitShowReviewButton: false, // Don't show review button if no workflow level matches, even for In Transit status, because the dialog won't know which level's permissions to apply.
      // Only show the warning button when the status still needs action.
      noMatchWarning: isReviewable,
      nextApprover: null,
      approvalProgress: null,
      fullyApproved: false,
      levelUsers: [],
      orderedApproval: false,
      alreadyApproved: false,
    };
  }

  // ── Check if current user already approved (by email in status_log) ────────
  const statusLog = Array.isArray(transfer?.status_log) ? transfer.status_log : [];
  const alreadyApproved = userEmail
    ? statusLog.some((entry) => (entry.email ?? '').toLowerCase() === userEmail.toLowerCase())
    : false;

  // ── Extract approved names from status_log and pending names from levelUsers ──
  const approvedEmails = new Set(
    statusLog.map((entry) => (entry.email ?? '').toLowerCase()).filter(Boolean)
  );
  const approvedNames = statusLog.map((entry) => entry.name || entry.email || '').filter(Boolean);

  // ── Matched level – compute approval state ─────────────────────────────────
  const approvalLevel = Number(transfer?.approval_level ?? 0);
  const minRequired = Number(matchedLevel.minimum_approval_required ?? 1);
  const levelUsers = Array.isArray(matchedLevel.level_users) ? matchedLevel.level_users : [];
  const orderedApproval = matchedLevel.level_maintain_require === 'yes';
  const fullyApproved = approvalLevel >= minRequired;

  // Find pending approvers: level_users minus those who already approved
  const pendingNames = levelUsers
    .filter((lu) => {
      const email = (lu.user_detail?.email ?? '').toLowerCase();
      return email && !approvedEmails.has(email);
    })
    .map((lu) => lu.user_detail?.full_name || lu.user_detail?.email || '')
    .filter(Boolean);

  // Find the current user's entry in level_users (case-insensitive e-mail match).
  const userEntry = userEmail
    ? levelUsers.find(
        (lu) => (lu.user_detail?.email ?? '').toLowerCase() === userEmail.toLowerCase()
      )
    : null;

  // Show review button for In Transit / Back Transit regardless of workflow,
  // because the dialog handles receive / not-receive actions internally.
  const transitShowReviewButton = userEntry
    ? transfer.status === 'In Transit' || transfer.status === 'Back Transit'
    : false;

  // Determine whether the logged-in user is allowed to approve right now.
  let canApprove = false;

  if (userEntry && isReviewable && !fullyApproved && !alreadyApproved) {
    if (orderedApproval) {
      // Strict order: user's approval_order must equal (current level + 1).
      canApprove = userEntry.approval_order === approvalLevel + 1;
    } else {
      // Any workflow user may approve in any order.
      canApprove = true;
    }
  }

  // Build next-approver display string.
  let nextApprover = null;
  if (!fullyApproved) {
    if (orderedApproval) {
      const nextOrder = approvalLevel + 1;
      const nextUser = levelUsers.find((lu) => lu.approval_order === nextOrder);
      nextApprover = nextUser?.user_detail?.full_name ?? null;
    } else {
      // Show all level users as candidates (since order doesn't matter).
      nextApprover = levelUsers
        .map((lu) => lu.user_detail?.full_name)
        .filter(Boolean)
        .join(', ');
    }
  }

  return {
    matchedLevel,
    canApprove,
    transitShowReviewButton,
    noMatchWarning: false,
    nextApprover,
    approvalProgress: `${approvalLevel} / ${minRequired}`,
    fullyApproved,
    levelUsers,
    orderedApproval,
    alreadyApproved,
    approvedNames,
    pendingNames,
  };
}

// ─── General list / query helpers ────────────────────────────────────────────

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.results) ? payload.results : [];
}

function fmtDate(v) {
  if (!v) return '—';
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(v));
}

function fmtQty(v) {
  return Number(v || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 });
}

function fmtCurrency(v) {
  const amount = Number(v || 0);
  return `BDT ${amount.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function buildQuery({ base, search, status, fromOffice, toOffice, page }) {
  const p = new URLSearchParams();
  p.set('ordering', '-transfer_date,-created_at');
  p.set('pagination', 'true');
  p.set('page', String(page + 1));
  if (search.trim()) p.set('search', search.trim());
  if (status) p.set('status', status);
  if (fromOffice) p.set('from_office', String(fromOffice));
  if (toOffice) p.set('to_office', String(toOffice));
  return `${base}?${p.toString()}`;
}

function buildSummaryQuery({ base, search, status, fromOffice, toOffice }) {
  const p = new URLSearchParams();
  if (search.trim()) p.set('search', search.trim());
  if (status) p.set('status', status);
  if (fromOffice) p.set('from_office', String(fromOffice));
  if (toOffice) p.set('to_office', String(toOffice));
  return `${base}?${p.toString()}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusChip({ status }) {
  const cfg = STATUS_CONFIG[status] || {
    color: 'default',
    icon: 'solar:question-circle-bold-duotone',
  };
  return (
    <Chip
      size="small"
      color={cfg.color}
      label={status}
      icon={<Iconify icon={cfg.icon} width={13} />}
      variant="soft"
      sx={{ fontWeight: 700, '& .MuiChip-icon': { ml: 0.75 } }}
    />
  );
}

function KpiCard({ icon, label, value, color, loading }) {
  const theme = useTheme();
  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette[color].main, 0.18)}`,
        bgcolor: alpha(theme.palette[color].main, 0.04),
        height: '100%',
      }}
    >
      <Stack direction="row" alignItems="center" gap={1.5}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette[color].main, 0.14),
            color: theme.palette[color].main,
            flexShrink: 0,
          }}
        >
          <Iconify icon={icon} width={22} />
        </Box>
        <Box>
          {loading ? (
            <Skeleton width={40} height={28} />
          ) : (
            <Typography variant="h5" fontWeight={800} color={`${color}.main`} lineHeight={1}>
              {value}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {label}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

/**
 * Small chip that shows the approval progress (e.g. "1 / 2") for a transfer.
 * Turns green when fully approved.
 * Tooltip shows approved names ✅ and pending names ⏳ separately.
 */
function ApprovalProgressChip({ info }) {
  if (!info.matchedLevel) return null;

  const { approvalProgress, fullyApproved, approvedNames, pendingNames } = info;

  // Build a smart tooltip showing approved vs pending approvers
  const approvedList =
    Array.isArray(approvedNames) && approvedNames.length > 0
      ? approvedNames.map((n) => `  ✅ ${n}`).join('\n')
      : '';
  const pendingList =
    Array.isArray(pendingNames) && pendingNames.length > 0
      ? pendingNames.map((n) => `  ⏳ ${n}`).join('\n')
      : '';

  let tooltipTitle = '';
  if (fullyApproved) {
    tooltipTitle = `✅ All required approvals received\n\nApproved by:\n${approvedList}`;
  } else if (approvedList && pendingList) {
    tooltipTitle = `Approval Progress: ${approvalProgress}\n\n✅ Already Approved:\n${approvedList}\n\n⏳ Pending Approval:\n${pendingList}`;
  } else if (pendingList) {
    tooltipTitle = `Approval Progress: ${approvalProgress}\n\n⏳ Pending Approval:\n${pendingList}`;
  } else if (approvedList) {
    tooltipTitle = `Approval Progress: ${approvalProgress}\n\n✅ Already Approved:\n${approvedList}`;
  } else {
    tooltipTitle = `Approval Progress: ${approvalProgress}\nAwaiting approval...`;
  }

  return (
    <Tooltip
      title={
        <Box sx={{ whiteSpace: 'pre-line', fontSize: 12, lineHeight: 1.6 }}>{tooltipTitle}</Box>
      }
      arrow
    >
      <Chip
        size="small"
        label={approvalProgress}
        color={fullyApproved ? 'success' : 'warning'}
        variant="soft"
        icon={
          <Iconify
            icon={
              fullyApproved ? 'solar:check-circle-bold-duotone' : 'solar:clock-circle-bold-duotone'
            }
            width={12}
          />
        }
        sx={{ fontWeight: 700, fontSize: 11, '& .MuiChip-icon': { ml: 0.5 } }}
      />
    </Tooltip>
  );
}

// ─── TransferRow ──────────────────────────────────────────────────────────────
//
// Props:
//   transfer   – single transfer record from the list API
//   idx        – display row index (0-based within the current page)
//   onEdit     – (id) => void
//   onDelete   – (id) => void
//   onReview   – (transfer) => void  – opens the review/dispatch dialog
//   onView     – (id) => void        – navigates to the detail page
//   rawWorkflow – raw response from APPROVAL_WORKFLOW_URL (passed down once)
//   userEmail  – logged-in user's e-mail address

function TransferRow({
  transfer,
  idx,
  onEdit,
  onDelete,
  onReview,
  onView,
  rawWorkflow,
  userEmail,
}) {
  const theme = useTheme();
  const cfg = STATUS_CONFIG[transfer.status] || STATUS_CONFIG.Draft;
  const [generatingPdf, setGeneratingPdf] = React.useState(false);

  // Derive all workflow-related state for this specific transfer.
  const wfInfo = useMemo(
    () => computeWorkflowInfo(transfer, rawWorkflow, userEmail),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      transfer.id,
      transfer.status,
      transfer.approval_level,
      transfer.total_value,
      rawWorkflow,
      userEmail,
    ]
  );

  // ── Derived display flags ─────────────────────────────────────────────────
  // const showReview = wfInfo.canApprove || wfInfo.transitShowReviewButton;
  const showReview = !!(wfInfo.canApprove || wfInfo.transitShowReviewButton);
  console.log(
    'can approve ',
    wfInfo.canApprove,
    ' transshwo review button',
    wfInfo.transitShowReviewButton
  );

  // console.log('show review', showReview, wfInfo);
  const showWarning = cfg.reviewable && wfInfo.noMatchWarning;
  const showGatePass = transfer.status === 'In Transit';
  // Show the next-approver chip only when there is a matched level and someone is pending.
  const showNextApprover = wfInfo.matchedLevel && !wfInfo.fullyApproved && wfInfo.nextApprover;
  // Show "—" when nothing else is rendered in the Next Action cell.
  const showDash = !showReview && !showWarning && !showGatePass && !wfInfo.matchedLevel;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleGatePassClick = async () => {
    setGeneratingPdf(true);
    try {
      const lines = Array.isArray(transfer.lines) ? transfer.lines : [];
      const blob = await pdf(
        <InternalTransferPDF transfer={transfer} lines={lines} docType="gate_pass" />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GatePass-${transfer.transfer_number || transfer.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to generate Gate Pass.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  /**
   * Clicking the "No Workflow" warning button surfaces the admin configuration
   * message as a toast so the user understands what action is needed.
   */
  const handleNoWorkflowClick = () => {
    toast.warning(NO_WORKFLOW_LEVEL_MESSAGE, {
      duration: 8000,
      description: 'Approval Workflow not configured',
    });
  };

  return (
    <TableRow
      hover
      sx={{ cursor: 'default', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}
    >
      {/* # */}
      <TableCell align="center" sx={{ width: 48 }}>
        <Typography variant="caption" fontWeight={700} color="text.disabled">
          {idx + 1}
        </Typography>
      </TableCell>

      {/* Transfer # / Date */}
      <TableCell sx={{ minWidth: 140 }}>
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={800} color="primary.main">
            {transfer.transfer_number || '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {fmtDate(transfer.transfer_date)}
          </Typography>
        </Stack>
      </TableCell>

      {/* Route: From → To */}
      <TableCell sx={{ minWidth: 220 }}>
        <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
          <Chip
            size="small"
            label={transfer.from_office_name || '—'}
            icon={
              <Iconify
                icon={
                  transfer.from_office_type === 'warehouse'
                    ? 'solar:warehouse-bold-duotone'
                    : 'solar:buildings-2-bold-duotone'
                }
                width={12}
              />
            }
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              color: theme.palette.primary.main,
              borderColor: alpha(theme.palette.primary.main, 0.2),
              '& .MuiChip-icon': { color: theme.palette.primary.main, ml: 0.5 },
            }}
            variant="outlined"
          />
          <Iconify
            icon="solar:arrow-right-bold"
            width={14}
            sx={{ color: 'text.disabled', flexShrink: 0 }}
          />
          <Chip
            size="small"
            label={transfer.to_office_name || '—'}
            icon={
              <Iconify
                icon={
                  transfer.to_office_type === 'warehouse'
                    ? 'solar:warehouse-bold-duotone'
                    : 'solar:buildings-2-bold-duotone'
                }
                width={12}
              />
            }
            sx={{
              bgcolor: alpha(theme.palette.info.main, 0.08),
              color: theme.palette.info.main,
              borderColor: alpha(theme.palette.info.main, 0.2),
              '& .MuiChip-icon': { color: theme.palette.info.main, ml: 0.5 },
            }}
            variant="outlined"
          />
        </Stack>
      </TableCell>

      {/* Items / Qty */}
      <TableCell align="center" sx={{ minWidth: 90 }}>
        <Stack spacing={0} alignItems="center">
          <Typography variant="body2" fontWeight={700}>
            {transfer.item_count ?? 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {fmtQty(transfer.quantity_total)} units
          </Typography>
        </Stack>
      </TableCell>

      {/* Total Value */}
      <TableCell align="center" sx={{ minWidth: 150 }}>
        <Typography variant="body2" fontWeight={700}>
          {fmtCurrency(transfer.total_value)}
        </Typography>
      </TableCell>

      {/* Status */}
      <TableCell align="center" sx={{ minWidth: 120 }}>
        <StatusChip status={transfer.status} />
      </TableCell>

      {/* Next Action  ─────────────────────────────────────────────────────── */}
      {/*                                                                       */}
      {/* Layout (top → bottom):                                                */}
      {/*   1. Approval progress chip  +  next-approver chip (if pending)       */}
      {/*   2. Action button(s): Review | "No Workflow" | Gate Pass             */}
      <TableCell align="center" sx={{ minWidth: 200 }}>
        <Stack spacing={0.75} alignItems="center">
          {/* ── Approval progress row ── */}
          {wfInfo.matchedLevel && (
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              justifyContent="center"
              flexWrap="wrap"
            >
              <ApprovalProgressChip info={wfInfo} />

              {showNextApprover && (
                <Tooltip title={`Pending approval from: ${wfInfo.nextApprover}`} arrow>
                  <Chip
                    size="small"
                    label={wfInfo.nextApprover}
                    variant="outlined"
                    sx={{
                      fontSize: 10,
                      fontWeight: 600,
                      maxWidth: 120,
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      },
                    }}
                  />
                </Tooltip>
              )}
            </Stack>
          )}

          {/* ── Action buttons row ── */}
          <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
            {/* Warning: transfer amount is outside every configured level range */}
            {showWarning && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<Iconify icon="solar:danger-triangle-bold-duotone" width={14} />}
                onClick={handleNoWorkflowClick}
                sx={{ fontSize: 11, fontWeight: 700 }}
              >
                No Workflow
              </Button>
            )}

            {/* Review / dispatch button – only visible to permitted users */}
            {showReview && (
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<Iconify icon="solar:eye-bold-duotone" width={14} />}
                onClick={() => onReview(transfer)}
                sx={{ fontSize: 12, fontWeight: 700 }}
              >
                Review
              </Button>
            )}

            {/* Gate Pass PDF – always shown for In Transit transfers */}
            {showGatePass && (
              <Button
                size="small"
                variant="contained"
                color="info"
                startIcon={
                  generatingPdf ? (
                    <CircularProgress size={13} color="inherit" />
                  ) : (
                    <Iconify icon="solar:document-bold-duotone" width={14} />
                  )
                }
                onClick={handleGatePassClick}
                disabled={generatingPdf}
                sx={{ fontSize: 12, fontWeight: 700 }}
              >
                Gate Pass
              </Button>
            )}

            {/* Empty state */}
            {showDash && (
              <Typography variant="caption" color="text.disabled">
                —
              </Typography>
            )}
          </Stack>
        </Stack>
      </TableCell>

      {/* Row actions (view / edit / delete) */}
      <TableCell align="center" sx={{ width: 80 }}>
        <Stack direction="row" spacing={0.25} justifyContent="center">
          <Tooltip title="View Details">
            <IconButton size="small" color="default" onClick={() => onView(transfer.id)}>
              <Iconify icon="solar:eye-bold" width={16} />
            </IconButton>
          </Tooltip>
          {transfer.status === 'Draft' && (
            <Tooltip title="Edit">
              <IconButton size="small" color="primary" onClick={() => onEdit(transfer.id)}>
                <Iconify icon="solar:pen-bold" width={16} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => onDelete(transfer.id)}>
              <Iconify icon="solar:trash-bin-trash-bold" width={16} />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function InternalTransferMain() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuthContext();

  // ── Local state ────────────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromOfficeFilter, setFromOfficeFilter] = useState('');
  const [toOfficeFilter, setToOfficeFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [reviewTransfer, setReviewTransfer] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  // ── API: paginated list ────────────────────────────────────────────────────
  const listUrl = useMemo(
    () =>
      buildQuery({
        base: EP.internal_transfers,
        search: debouncedSearch,
        status: statusFilter,
        fromOffice: fromOfficeFilter,
        toOffice: toOfficeFilter,
        page,
      }),
    [debouncedSearch, statusFilter, fromOfficeFilter, toOfficeFilter, page]
  );

  // ── API: un-paginated summary (for KPI counts) ────────────────────────────
  const summaryUrl = useMemo(
    () =>
      buildSummaryQuery({
        base: EP.internal_transfers,
        search: debouncedSearch,
        status: statusFilter,
        fromOffice: fromOfficeFilter,
        toOffice: toOfficeFilter,
      }),
    [debouncedSearch, statusFilter, fromOfficeFilter, toOfficeFilter]
  );

  const { data: rawList, loading: listLoading, error: listError } = useGetRequest(listUrl);
  const { data: rawSummary } = useGetRequest(summaryUrl);
  const { data: rawOffices, loading: officesLoading } = useGetRequest(`${PM.office_management}`);

  /**
   * Fetch the Approval Workflow configuration for internal transfers.
   * Replaces the old EP.inventory_approval_matrix call.
   *
   * Expected response shape (list of workflows):
   * [{ id, is_active, total_levels, levels: [{ level_number, from_amount, to_amount,
   *    minimum_approval_required, level_maintain_require, level_users: [...] }] }]
   */
  const { data: rawWorkflow } = useGetRequest(APPROVAL_WORKFLOW_URL);

  // ── Derived data ───────────────────────────────────────────────────────────
  const rows = useMemo(() => normalizeList(rawList), [rawList]);
  const summaryRows = useMemo(() => normalizeList(rawSummary), [rawSummary]);
  const totalPages = Math.max(1, Number(rawList?.total_pages || 1));
  const totalCount = Number(rawList?.count || summaryRows.length || 0);

  const allOffices = useMemo(
    () =>
      [...normalizeList(rawOffices)].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
      ),
    [rawOffices]
  );

  const kpis = useMemo(
    () => ({
      total: totalCount,
      draft: summaryRows.filter((r) => r.status === 'Draft').length,
      inTransit: summaryRows.filter((r) => r.status === 'In Transit').length,
      backTransit: summaryRows.filter((r) => r.status === 'Back Transit').length,
      received: summaryRows.filter((r) => r.status === 'Received').length,
      totalQty: summaryRows.reduce((s, r) => s + Number(r.quantity_total || 0), 0),
    }),
    [summaryRows, totalCount]
  );

  const canReset = Boolean(
    search.trim() || statusFilter || fromOfficeFilter || toOfficeFilter || page !== 0
  );

  // ── Cache invalidation helper ──────────────────────────────────────────────
  const invalidate = () =>
    mutate((key) => typeof key === 'string' && key.startsWith(EP.internal_transfers));

  // ── Event handlers ─────────────────────────────────────────────────────────
  const handleCreate = () => {
    setFormMode('create');
    setEditId(null);
    setFormOpen(true);
  };

  const handleEdit = (id) => {
    setFormMode('edit');
    setEditId(id);
    setFormOpen(true);
  };

  const handleSuccess = async () => {
    await invalidate();
    setFormOpen(false);
    setEditId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteRequest(EP.internal_transfer_by_id(deleteId));
      toast.success('Internal transfer deleted.');
      await invalidate();
      setDeleteId(null);
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err) || 'Delete failed.');
    }
  };

  const handleReview = (transfer) => setReviewTransfer(transfer);

  const handleReviewSuccess = async () => {
    setReviewTransfer(null);
    await invalidate();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
      <Stack spacing={3}>
        {/* ── Page header ── */}
        <Card
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              right: -60,
              top: -60,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ md: 'center' }}
            gap={2}
            sx={{ position: 'relative', zIndex: 1 }}
          >
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.14),
                    color: theme.palette.primary.main,
                  }}
                >
                  <Iconify icon="solar:transfer-horizontal-bold-duotone" width={22} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={800}>
                    Internal Transfers
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Move stock between offices and warehouses with full audit trail
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" gap={1} flexWrap="wrap">
                <Chip
                  size="small"
                  icon={<Iconify icon="solar:delivery-bold-duotone" width={13} />}
                  label={`${kpis.inTransit} in transit`}
                  variant="outlined"
                  color="info"
                  sx={{ fontWeight: 700 }}
                />
                {kpis.backTransit > 0 && (
                  <Chip
                    size="small"
                    icon={<Iconify icon="solar:arrow-left-bold-duotone" width={13} />}
                    label={`${kpis.backTransit} back transit`}
                    variant="outlined"
                    color="warning"
                    sx={{ fontWeight: 700 }}
                  />
                )}
                <Chip
                  size="small"
                  icon={<Iconify icon="solar:check-circle-bold-duotone" width={13} />}
                  label={`${kpis.received} received`}
                  variant="outlined"
                  color="success"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  size="small"
                  icon={<Iconify icon="solar:box-bold-duotone" width={13} />}
                  label={`${fmtQty(kpis.totalQty)} units in scope`}
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
            </Stack>
            <Stack direction="row" gap={1.5}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="solar:restart-bold-duotone" width={16} />}
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setFromOfficeFilter('');
                  setToOfficeFilter('');
                  setPage(0);
                }}
                disabled={!canReset}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={18} />}
                onClick={handleCreate}
                sx={{ fontWeight: 700 }}
              >
                New Transfer
              </Button>
            </Stack>
          </Stack>
        </Card>

        {/* ── KPI cards ── */}
        <Grid container spacing={2}>
          {[
            {
              icon: 'solar:transfer-horizontal-bold-duotone',
              label: 'Total',
              value: kpis.total,
              color: 'primary',
            },
            {
              icon: 'solar:document-text-bold-duotone',
              label: 'Draft',
              value: kpis.draft,
              color: 'warning',
            },
            {
              icon: 'solar:delivery-bold-duotone',
              label: 'In Transit',
              value: kpis.inTransit,
              color: 'info',
            },
            {
              icon: 'solar:arrow-left-bold-duotone',
              label: 'Back Transit',
              value: kpis.backTransit,
              color: 'warning',
            },
            {
              icon: 'solar:check-circle-bold-duotone',
              label: 'Received',
              value: kpis.received,
              color: 'success',
            },
          ].map((kpi) => (
            <Grid key={kpi.label} size={{ xs: 6, sm: 4, md: 2.4 }}>
              <KpiCard {...kpi} loading={listLoading} />
            </Grid>
          ))}
        </Grid>

        {/* ── Filters ── */}
        <Card
          sx={{ p: 2, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 1)}` }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search transfer number, notes, office..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify
                        icon="solar:magnifer-bold-duotone"
                        width={18}
                        sx={{ color: 'text.disabled' }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment:
                    search !== debouncedSearch ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : null,
                }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                {STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o.value || 'all'} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2.75 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="From Office/Warehouse"
                value={fromOfficeFilter}
                onChange={(e) => {
                  setFromOfficeFilter(e.target.value);
                  setPage(0);
                }}
                disabled={officesLoading}
              >
                <MenuItem value="">All Sources</MenuItem>
                {allOffices.map((o) => (
                  <MenuItem key={o.id} value={String(o.id)}>
                    {o.name}
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 0.75 }}
                    >
                      ({o.type})
                    </Typography>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2.75 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="To Office/Warehouse"
                value={toOfficeFilter}
                onChange={(e) => {
                  setToOfficeFilter(e.target.value);
                  setPage(0);
                }}
                disabled={officesLoading}
              >
                <MenuItem value="">All Destinations</MenuItem>
                {allOffices.map((o) => (
                  <MenuItem key={o.id} value={String(o.id)}>
                    {o.name}
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 0.75 }}
                    >
                      ({o.type})
                    </Typography>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Card>

        {listError && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Could not load internal transfer records.
          </Alert>
        )}

        {/* ── Transfer table ── */}
        <Card
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 1)}`,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              px: 2.5,
              py: 1.75,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 1)}`,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={700}>
                Transfer Records
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {totalCount} {totalCount === 1 ? 'transfer' : 'transfers'}
              </Typography>
            </Stack>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                  <TableCell align="center" sx={{ width: 48, fontWeight: 700 }}>
                    #
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Transfer #</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Route</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Items / Qty
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Total Value
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Status
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Next Action
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, width: 80 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {listLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        {[48, 140, 260, 90, 150, 120, 180, 80].map((w, j) => (
                          <TableCell key={j} align={j === 0 ? 'center' : 'left'}>
                            <Skeleton variant="text" width={w} height={20} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : rows.map((transfer, idx) => (
                      <TransferRow
                        key={transfer.id}
                        transfer={transfer}
                        idx={page * 10 + idx}
                        onEdit={handleEdit}
                        onDelete={(id) => setDeleteId(id)}
                        onReview={handleReview}
                        onView={(id) =>
                          router.push(paths.dashboard.storeInventory.stock_transfer_detail(id))
                        }
                        // New: pass the raw workflow response and the logged-in user's e-mail.
                        // TransferRow calls computeWorkflowInfo() internally per row.
                        rawWorkflow={rawWorkflow}
                        userEmail={user?.email}
                      />
                    ))}

                {!listLoading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ py: 8, textAlign: 'center' }}>
                      <Stack alignItems="center" spacing={1.5}>
                        <Iconify
                          icon="solar:transfer-horizontal-line-duotone"
                          width={52}
                          sx={{ color: alpha(theme.palette.text.disabled, 0.6) }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          No transfers found
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                          Adjust your filters or create the first transfer.
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={16} />}
                          onClick={handleCreate}
                        >
                          Create Transfer
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{
                px: 2.5,
                py: 1.75,
                borderTop: `1px solid ${alpha(theme.palette.divider, 1)}`,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {totalCount} {totalCount === 1 ? 'record' : 'records'}
              </Typography>
              <Pagination
                color="primary"
                shape="rounded"
                count={totalPages}
                page={page + 1}
                onChange={(_, v) => setPage(v - 1)}
              />
            </Stack>
          )}
        </Card>

        {/* ── Business logic info card ── */}
        <Card
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.info.main, 0.18)}`,
            bgcolor: alpha(theme.palette.info.main, 0.03),
          }}
        >
          <Stack direction="row" gap={1.5} alignItems="flex-start">
            <Iconify
              icon="solar:info-circle-bold-duotone"
              width={20}
              sx={{ color: 'info.main', mt: 0.1, flexShrink: 0 }}
            />
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="info.dark" gutterBottom>
                Stock Movement Rules
              </Typography>
              <Stack spacing={0.5}>
                {[
                  'Draft → no stock change. Edit freely.',
                  'Dispatch (→ In Transit) → quantity deducted from source immediately.',
                  'Mark Received (→ Received) → quantity added to destination inventory.',
                  'Not Received (→ Back Transit) → no stock change; goods are returning to source.',
                  'Back Received → quantity restored to source inventory.',
                  'Cancel Transfer (from Draft) → no stock change.',
                ].map((rule) => (
                  <Stack key={rule} direction="row" gap={0.75} alignItems="flex-start">
                    <Iconify
                      icon="solar:arrow-right-bold"
                      width={13}
                      sx={{ color: 'info.main', mt: 0.25, flexShrink: 0 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {rule}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Card>
      </Stack>

      {/* ── Dialogs ── */}

      <InternalTransferFormDialog
        open={formOpen}
        mode={formMode}
        transferId={editId}
        onClose={() => {
          setFormOpen(false);
          setEditId(null);
        }}
        onSuccess={handleSuccess}
      />

      {reviewTransfer?.status === 'Back Transit' ? (
        <InternalTransferBackReceiveDialog
          open={Boolean(reviewTransfer)}
          transfer={reviewTransfer}
          onClose={() => setReviewTransfer(null)}
          onSuccess={handleReviewSuccess}
        />
      ) : (
        <InternalTransferReviewDialog
          open={Boolean(reviewTransfer)}
          transfer={reviewTransfer}
          onClose={() => setReviewTransfer(null)}
          onSuccess={handleReviewSuccess}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete Internal Transfer"
        content="This permanently deletes the transfer. If In Transit, stock will be restored to the source."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}

// 'use client';

// import { mutate } from 'swr';
// import { toast } from 'sonner';
// import { useRouter } from 'next/navigation';
// import React, { useMemo, useState } from 'react';

// import { useTheme } from '@mui/material/styles';
// import {
//   Box,
//   Card,
//   Chip,
//   Grid,
//   alpha,
//   Alert,
//   Stack,
//   Table,
//   Button,
//   Tooltip,
//   MenuItem,
//   Skeleton,
//   TableRow,
//   TableBody,
//   TableCell,
//   TableHead,
//   TextField,
//   IconButton,
//   Pagination,
//   Typography,
//   InputAdornment,
//   TableContainer,
//   CircularProgress,
// } from '@mui/material';

// import { paths } from 'src/routes/paths';

// import { useDebounce } from 'src/hooks/use-debounce';

// import { pdf } from '@react-pdf/renderer';

// import { endpoints } from 'src/utils/axios';

// import { useAuthContext } from 'src/auth/hooks';

// import {
//   useGetRequest,
//   extractErrorMessage,
//   useDeleteRequest as deleteRequest,
// } from 'src/actions/ledars-hook';

// import { Iconify } from 'src/components/iconify';
// import { ConfirmDialog } from 'src/components/custom-dialog';

// import InternalTransferFormDialog from './internal-transfer-form-dialog';
// import InternalTransferReviewDialog from './internal-transfer-review-dialog';
// import InternalTransferBackReceiveDialog from './internal-transfer-back-receive-dialog';
// import InternalTransferPDF from './internal-transfer-pdf';

// // ─── constants ────────────────────────────────────────────────────────────────

// const EP = endpoints.storeInventory;
// const PM = endpoints.procurement_management;

// const STATUS_OPTIONS = [
//   { value: '', label: 'All Status' },
//   { value: 'Draft', label: 'Draft' },
//   { value: 'In Transit', label: 'In Transit' },
//   { value: 'Back Transit', label: 'Back Transit' },
//   { value: 'Received', label: 'Received' },
//   { value: 'Back Received', label: 'Back Received' },
//   { value: 'Cancelled', label: 'Cancelled' },
// ];

// const STATUS_CONFIG = {
//   Draft: {
//     color: 'default',
//     icon: 'solar:document-text-bold-duotone',
//     reviewable: true,
//   },
//   'In Transit': {
//     color: 'info',
//     icon: 'solar:delivery-bold-duotone',
//     reviewable: true,
//   },
//   'Back Transit': {
//     color: 'warning',
//     icon: 'solar:arrow-left-bold-duotone',
//     reviewable: true,
//   },
//   Received: {
//     color: 'success',
//     icon: 'solar:check-circle-bold-duotone',
//     reviewable: false,
//   },
//   'Back Received': {
//     color: 'success',
//     icon: 'solar:refresh-bold-duotone',
//     reviewable: false,
//   },
//   Cancelled: {
//     color: 'error',
//     icon: 'solar:close-circle-bold-duotone',
//     reviewable: false,
//   },
// };

// // ─── helpers ──────────────────────────────────────────────────────────────────

// function normalizeList(payload) {
//   if (Array.isArray(payload)) return payload;
//   return Array.isArray(payload?.results) ? payload.results : [];
// }

// function fmtDate(v) {
//   if (!v) return '—';
//   return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(v));
// }

// function fmtQty(v) {
//   return Number(v || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 });
// }

// function buildQuery({ base, search, status, fromOffice, toOffice, page }) {
//   const p = new URLSearchParams();
//   p.set('ordering', '-transfer_date,-created_at');
//   p.set('pagination', 'true');
//   p.set('page', String(page + 1));
//   if (search.trim()) p.set('search', search.trim());
//   if (status) p.set('status', status);
//   if (fromOffice) p.set('from_office', String(fromOffice));
//   if (toOffice) p.set('to_office', String(toOffice));
//   return `${base}?${p.toString()}`;
// }

// function buildSummaryQuery({ base, search, status, fromOffice, toOffice }) {
//   const p = new URLSearchParams();
//   if (search.trim()) p.set('search', search.trim());
//   if (status) p.set('status', status);
//   if (fromOffice) p.set('from_office', String(fromOffice));
//   if (toOffice) p.set('to_office', String(toOffice));
//   return `${base}?${p.toString()}`;
// }

// // ─── StatusChip ───────────────────────────────────────────────────────────────

// function StatusChip({ status }) {
//   const cfg = STATUS_CONFIG[status] || {
//     color: 'default',
//     icon: 'solar:question-circle-bold-duotone',
//   };
//   return (
//     <Chip
//       size="small"
//       color={cfg.color}
//       label={status}
//       icon={<Iconify icon={cfg.icon} width={13} />}
//       variant="soft"
//       sx={{ fontWeight: 700, '& .MuiChip-icon': { ml: 0.75 } }}
//     />
//   );
// }

// // ─── KPI card ─────────────────────────────────────────────────────────────────

// function KpiCard({ icon, label, value, color, loading }) {
//   const theme = useTheme();
//   return (
//     <Card
//       sx={{
//         p: 2,
//         borderRadius: 3,
//         border: `1px solid ${alpha(theme.palette[color].main, 0.18)}`,
//         bgcolor: alpha(theme.palette[color].main, 0.04),
//         height: '100%',
//       }}
//     >
//       <Stack direction="row" alignItems="center" gap={1.5}>
//         <Box
//           sx={{
//             width: 40,
//             height: 40,
//             borderRadius: 2,
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             bgcolor: alpha(theme.palette[color].main, 0.14),
//             color: theme.palette[color].main,
//             flexShrink: 0,
//           }}
//         >
//           <Iconify icon={icon} width={22} />
//         </Box>
//         <Box>
//           {loading ? (
//             <Skeleton width={40} height={28} />
//           ) : (
//             <Typography variant="h5" fontWeight={800} color={`${color}.main`} lineHeight={1}>
//               {value}
//             </Typography>
//           )}
//           <Typography variant="caption" color="text.secondary" fontWeight={600}>
//             {label}
//           </Typography>
//         </Box>
//       </Stack>
//     </Card>
//   );
// }

// // ─── Transfer row ─────────────────────────────────────────────────────────────

// function TransferRow({
//   transfer,
//   idx,
//   onEdit,
//   onDelete,
//   onReview,
//   onView,
//   onGatePass,
//   userCanApprove,
// }) {
//   const theme = useTheme();
//   const cfg = STATUS_CONFIG[transfer.status] || STATUS_CONFIG.Draft;
//   const [generatingPdf, setGeneratingPdf] = React.useState(false);

//   const handleGatePassClick = async () => {
//     setGeneratingPdf(true);
//     try {
//       const lines = Array.isArray(transfer.lines) ? transfer.lines : [];
//       const blob = await pdf(
//         <InternalTransferPDF transfer={transfer} lines={lines} docType="gate_pass" />
//       ).toBlob();
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `GatePass-${transfer.transfer_number || transfer.id}.pdf`;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       URL.revokeObjectURL(url);
//       onGatePass?.();
//     } catch {
//       toast.error('Failed to generate Gate Pass.');
//     } finally {
//       setGeneratingPdf(false);
//     }
//   };

//   return (
//     <TableRow
//       hover
//       sx={{ cursor: 'default', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}
//     >
//       <TableCell align="center" sx={{ width: 48 }}>
//         <Typography variant="caption" fontWeight={700} color="text.disabled">
//           {idx + 1}
//         </Typography>
//       </TableCell>

//       <TableCell sx={{ minWidth: 140 }}>
//         <Stack spacing={0.25}>
//           <Typography variant="body2" fontWeight={800} color="primary.main">
//             {transfer.transfer_number || '—'}
//           </Typography>
//           <Typography variant="caption" color="text.secondary">
//             {fmtDate(transfer.transfer_date)}
//           </Typography>
//         </Stack>
//       </TableCell>

//       <TableCell sx={{ minWidth: 220 }}>
//         <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
//           <Chip
//             size="small"
//             label={transfer.from_office_name || '—'}
//             icon={
//               <Iconify
//                 icon={
//                   transfer.from_office_type === 'warehouse'
//                     ? 'solar:warehouse-bold-duotone'
//                     : 'solar:buildings-2-bold-duotone'
//                 }
//                 width={12}
//               />
//             }
//             sx={{
//               bgcolor: alpha(theme.palette.primary.main, 0.08),
//               color: theme.palette.primary.main,
//               borderColor: alpha(theme.palette.primary.main, 0.2),
//               '& .MuiChip-icon': { color: theme.palette.primary.main, ml: 0.5 },
//             }}
//             variant="outlined"
//           />
//           <Iconify
//             icon="solar:arrow-right-bold"
//             width={14}
//             sx={{ color: 'text.disabled', flexShrink: 0 }}
//           />
//           <Chip
//             size="small"
//             label={transfer.to_office_name || '—'}
//             icon={
//               <Iconify
//                 icon={
//                   transfer.to_office_type === 'warehouse'
//                     ? 'solar:warehouse-bold-duotone'
//                     : 'solar:buildings-2-bold-duotone'
//                 }
//                 width={12}
//               />
//             }
//             sx={{
//               bgcolor: alpha(theme.palette.info.main, 0.08),
//               color: theme.palette.info.main,
//               borderColor: alpha(theme.palette.info.main, 0.2),
//               '& .MuiChip-icon': { color: theme.palette.info.main, ml: 0.5 },
//             }}
//             variant="outlined"
//           />
//         </Stack>
//       </TableCell>

//       <TableCell align="center" sx={{ minWidth: 90 }}>
//         <Stack spacing={0} alignItems="center">
//           <Typography variant="body2" fontWeight={700}>
//             {transfer.item_count ?? 0}
//           </Typography>
//           <Typography variant="caption" color="text.secondary">
//             {fmtQty(transfer.quantity_total)} units
//           </Typography>
//         </Stack>
//       </TableCell>

//       <TableCell align="center" sx={{ minWidth: 120 }}>
//         <StatusChip status={transfer.status} />
//       </TableCell>

//       <TableCell align="center" sx={{ minWidth: 150 }}>
//         <Stack direction="row" spacing={0.75} justifyContent="center" alignItems="center">
//           {cfg.reviewable && userCanApprove(transfer) && (
//             <Button
//               size="small"
//               variant="outlined"
//               color="primary"
//               startIcon={<Iconify icon="solar:eye-bold-duotone" width={14} />}
//               onClick={() => onReview(transfer)}
//               sx={{ fontSize: 12, fontWeight: 700 }}
//             >
//               Review
//             </Button>
//           )}
//           {transfer.status === 'In Transit' && (
//             <Button
//               size="small"
//               variant="contained"
//               color="info"
//               startIcon={
//                 generatingPdf ? (
//                   <CircularProgress size={13} color="inherit" />
//                 ) : (
//                   <Iconify icon="solar:document-bold-duotone" width={14} />
//                 )
//               }
//               onClick={handleGatePassClick}
//               disabled={generatingPdf}
//               sx={{ fontSize: 12, fontWeight: 700 }}
//             >
//               Gate Pass
//             </Button>
//           )}
//           {!cfg.reviewable && transfer.status !== 'In Transit' && (
//             <Typography variant="caption" color="text.disabled">
//               —
//             </Typography>
//           )}
//         </Stack>
//       </TableCell>

//       <TableCell align="center" sx={{ width: 80 }}>
//         <Stack direction="row" spacing={0.25} justifyContent="center">
//           <Tooltip title="View Details">
//             <IconButton size="small" color="default" onClick={() => onView(transfer.id)}>
//               <Iconify icon="solar:eye-bold" width={16} />
//             </IconButton>
//           </Tooltip>
//           {transfer.status === 'Draft' && (
//             <Tooltip title="Edit">
//               <IconButton size="small" color="primary" onClick={() => onEdit(transfer.id)}>
//                 <Iconify icon="solar:pen-bold" width={16} />
//               </IconButton>
//             </Tooltip>
//           )}
//           <Tooltip title="Delete">
//             <IconButton size="small" color="error" onClick={() => onDelete(transfer.id)}>
//               <Iconify icon="solar:trash-bin-trash-bold" width={16} />
//             </IconButton>
//           </Tooltip>
//         </Stack>
//       </TableCell>
//     </TableRow>
//   );
// }

// // ─── Main ─────────────────────────────────────────────────────────────────────

// export default function InternalTransferMain() {
//   const theme = useTheme();
//   const router = useRouter();
//   const { user } = useAuthContext();

//   const [page, setPage] = useState(0);
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');
//   const [fromOfficeFilter, setFromOfficeFilter] = useState('');
//   const [toOfficeFilter, setToOfficeFilter] = useState('');
//   const [formOpen, setFormOpen] = useState(false);
//   const [formMode, setFormMode] = useState('create');
//   const [editId, setEditId] = useState(null);
//   const [deleteId, setDeleteId] = useState(null);
//   const [reviewTransfer, setReviewTransfer] = useState(null);

//   const debouncedSearch = useDebounce(search, 400);

//   const listUrl = useMemo(
//     () =>
//       buildQuery({
//         base: EP.internal_transfers,
//         search: debouncedSearch,
//         status: statusFilter,
//         fromOffice: fromOfficeFilter,
//         toOffice: toOfficeFilter,
//         page,
//       }),
//     [debouncedSearch, statusFilter, fromOfficeFilter, toOfficeFilter, page]
//   );

//   const summaryUrl = useMemo(
//     () =>
//       buildSummaryQuery({
//         base: EP.internal_transfers,
//         search: debouncedSearch,
//         status: statusFilter,
//         fromOffice: fromOfficeFilter,
//         toOffice: toOfficeFilter,
//       }),
//     [debouncedSearch, statusFilter, fromOfficeFilter, toOfficeFilter]
//   );

//   const { data: rawList, loading: listLoading, error: listError } = useGetRequest(listUrl);
//   const { data: rawSummary } = useGetRequest(summaryUrl);
//   const { data: rawOffices, loading: officesLoading } = useGetRequest(`${PM.office_management}`);
//   const { data: rawApprovalMatrix } = useGetRequest(EP.inventory_approval_matrix);

//   const userCanApprove = useMemo(
//     (transfer) => {
// console.log('transfer item is:', transfer);
//       const userEmail = user?.email;
//       if (!userEmail) return false;
//       const rules = Array.isArray(rawApprovalMatrix)
//         ? rawApprovalMatrix
//         : Array.isArray(rawApprovalMatrix?.results)
//           ? rawApprovalMatrix.results
//           : [];
//       return rules
//         .filter((rule) => rule.is_active && rule.module === 'internal_transfers')
//         .some((rule) =>
//           (Array.isArray(rule.approvers_info) ? rule.approvers_info : []).some(
//             (emp) => String(emp.email || '').toLowerCase() === userEmail.toLowerCase()
//           )
//         );
//     },
//     [rawApprovalMatrix, user?.email]
//   );

//   const rows = useMemo(() => normalizeList(rawList), [rawList]);
//   const summaryRows = useMemo(() => normalizeList(rawSummary), [rawSummary]);
//   const totalPages = Math.max(1, Number(rawList?.total_pages || 1));
//   const totalCount = Number(rawList?.count || summaryRows.length || 0);

//   const allOffices = useMemo(
//     () =>
//       [...normalizeList(rawOffices)].sort((a, b) =>
//         (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
//       ),
//     [rawOffices]
//   );

//   const kpis = useMemo(
//     () => ({
//       total: totalCount,
//       draft: summaryRows.filter((r) => r.status === 'Draft').length,
//       inTransit: summaryRows.filter((r) => r.status === 'In Transit').length,
//       backTransit: summaryRows.filter((r) => r.status === 'Back Transit').length,
//       received: summaryRows.filter((r) => r.status === 'Received').length,
//       totalQty: summaryRows.reduce((s, r) => s + Number(r.quantity_total || 0), 0),
//     }),
//     [summaryRows, totalCount]
//   );

//   const canReset = Boolean(
//     search.trim() || statusFilter || fromOfficeFilter || toOfficeFilter || page !== 0
//   );

//   const invalidate = () =>
//     mutate((key) => typeof key === 'string' && key.startsWith(EP.internal_transfers));

//   const handleCreate = () => {
//     setFormMode('create');
//     setEditId(null);
//     setFormOpen(true);
//   };
//   const handleEdit = (id) => {
//     setFormMode('edit');
//     setEditId(id);
//     setFormOpen(true);
//   };
//   const handleSuccess = async () => {
//     await invalidate();
//     setFormOpen(false);
//     setEditId(null);
//   };

//   const handleDelete = async () => {
//     if (!deleteId) return;
//     try {
//       await deleteRequest(EP.internal_transfer_by_id(deleteId));
//       toast.success('Internal transfer deleted.');
//       await invalidate();
//       setDeleteId(null);
//     } catch (err) {
//       toast.error(extractErrorMessage(err?.response?.data || err) || 'Delete failed.');
//     }
//   };

//   const handleReview = (transfer) => setReviewTransfer(transfer);

//   const handleReviewSuccess = async () => {
//     setReviewTransfer(null);
//     await invalidate();
//   };

//   return (
//     <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
//       <Stack spacing={3}>
//         {/* Page header */}
//         <Card
//           sx={{
//             p: { xs: 2.5, md: 3 },
//             borderRadius: 3,
//             border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
//             background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
//             overflow: 'hidden',
//             position: 'relative',
//           }}
//         >
//           <Box
//             sx={{
//               position: 'absolute',
//               right: -60,
//               top: -60,
//               width: 200,
//               height: 200,
//               borderRadius: '50%',
//               background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 70%)`,
//               pointerEvents: 'none',
//             }}
//           />
//           <Stack
//             direction={{ xs: 'column', md: 'row' }}
//             justifyContent="space-between"
//             alignItems={{ md: 'center' }}
//             gap={2}
//             sx={{ position: 'relative', zIndex: 1 }}
//           >
//             <Stack spacing={1}>
//               <Stack direction="row" alignItems="center" gap={1}>
//                 <Box
//                   sx={{
//                     width: 40,
//                     height: 40,
//                     borderRadius: 2,
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     bgcolor: alpha(theme.palette.primary.main, 0.14),
//                     color: theme.palette.primary.main,
//                   }}
//                 >
//                   <Iconify icon="solar:transfer-horizontal-bold-duotone" width={22} />
//                 </Box>
//                 <Box>
//                   <Typography variant="h5" fontWeight={800}>
//                     Internal Transfers
//                   </Typography>
//                   <Typography variant="body2" color="text.secondary">
//                     Move stock between offices and warehouses with full audit trail
//                   </Typography>
//                 </Box>
//               </Stack>
//               <Stack direction="row" gap={1} flexWrap="wrap">
//                 <Chip
//                   size="small"
//                   icon={<Iconify icon="solar:delivery-bold-duotone" width={13} />}
//                   label={`${kpis.inTransit} in transit`}
//                   variant="outlined"
//                   color="info"
//                   sx={{ fontWeight: 700 }}
//                 />

//                 {kpis.backTransit > 0 && (
//                   <Chip
//                     size="small"
//                     icon={<Iconify icon="solar:arrow-left-bold-duotone" width={13} />}
//                     label={`${kpis.backTransit} back transit`}
//                     variant="outlined"
//                     color="warning"
//                     sx={{ fontWeight: 700 }}
//                   />
//                 )}
//                 <Chip
//                   size="small"
//                   icon={<Iconify icon="solar:check-circle-bold-duotone" width={13} />}
//                   label={`${kpis.received} received`}
//                   variant="outlined"
//                   color="success"
//                   sx={{ fontWeight: 700 }}
//                 />
//                 <Chip
//                   size="small"
//                   icon={<Iconify icon="solar:box-bold-duotone" width={13} />}
//                   label={`${fmtQty(kpis.totalQty)} units in scope`}
//                   variant="outlined"
//                   sx={{ fontWeight: 700 }}
//                 />
//               </Stack>
//             </Stack>
//             <Stack direction="row" gap={1.5}>
//               <Button
//                 variant="outlined"
//                 color="inherit"
//                 startIcon={<Iconify icon="solar:restart-bold-duotone" width={16} />}
//                 onClick={() => {
//                   setSearch('');
//                   setStatusFilter('');
//                   setFromOfficeFilter('');
//                   setToOfficeFilter('');
//                   setPage(0);
//                 }}
//                 disabled={!canReset}
//               >
//                 Reset
//               </Button>
//               <Button
//                 variant="contained"
//                 startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={18} />}
//                 onClick={handleCreate}
//                 sx={{ fontWeight: 700 }}
//               >
//                 New Transfer
//               </Button>
//             </Stack>
//           </Stack>
//         </Card>

//         {/* KPI cards */}
//         <Grid container spacing={2}>
//           {[
//             {
//               icon: 'solar:transfer-horizontal-bold-duotone',
//               label: 'Total',
//               value: kpis.total,
//               color: 'primary',
//             },
//             {
//               icon: 'solar:document-text-bold-duotone',
//               label: 'Draft',
//               value: kpis.draft,
//               color: 'warning',
//             },
//             {
//               icon: 'solar:delivery-bold-duotone',
//               label: 'In Transit',
//               value: kpis.inTransit,
//               color: 'info',
//             },
//             {
//               icon: 'solar:arrow-left-bold-duotone',
//               label: 'Back Transit',
//               value: kpis.backTransit,
//               color: 'warning',
//             },
//             {
//               icon: 'solar:check-circle-bold-duotone',
//               label: 'Received',
//               value: kpis.received,
//               color: 'success',
//             },
//           ].map((kpi) => (
//             <Grid key={kpi.label} size={{ xs: 6, sm: 4, md: 2.4 }}>
//               <KpiCard {...kpi} loading={listLoading} />
//             </Grid>
//           ))}
//         </Grid>

//         {/* Filters */}
//         <Card
//           sx={{ p: 2, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 1)}` }}
//         >
//           <Grid container spacing={2} alignItems="center">
//             <Grid size={{ xs: 12, md: 4 }}>
//               <TextField
//                 fullWidth
//                 size="small"
//                 placeholder="Search transfer number, notes, office..."
//                 value={search}
//                 onChange={(e) => {
//                   setSearch(e.target.value);
//                   setPage(0);
//                 }}
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <Iconify
//                         icon="solar:magnifer-bold-duotone"
//                         width={18}
//                         sx={{ color: 'text.disabled' }}
//                       />
//                     </InputAdornment>
//                   ),
//                   endAdornment:
//                     search !== debouncedSearch ? (
//                       <CircularProgress size={14} color="inherit" />
//                     ) : null,
//                 }}
//               />
//             </Grid>
//             <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
//               <TextField
//                 select
//                 fullWidth
//                 size="small"
//                 label="Status"
//                 value={statusFilter}
//                 onChange={(e) => {
//                   setStatusFilter(e.target.value);
//                   setPage(0);
//                 }}
//               >
//                 {STATUS_OPTIONS.map((o) => (
//                   <MenuItem key={o.value || 'all'} value={o.value}>
//                     {o.label}
//                   </MenuItem>
//                 ))}
//               </TextField>
//             </Grid>
//             <Grid size={{ xs: 6, sm: 4, md: 2.75 }}>
//               <TextField
//                 select
//                 fullWidth
//                 size="small"
//                 label="From Office/Warehouse"
//                 value={fromOfficeFilter}
//                 onChange={(e) => {
//                   setFromOfficeFilter(e.target.value);
//                   setPage(0);
//                 }}
//                 disabled={officesLoading}
//               >
//                 <MenuItem value="">All Sources</MenuItem>
//                 {allOffices.map((o) => (
//                   <MenuItem key={o.id} value={String(o.id)}>
//                     {o.name}
//                     <Typography
//                       component="span"
//                       variant="caption"
//                       color="text.secondary"
//                       sx={{ ml: 0.75 }}
//                     >
//                       ({o.type})
//                     </Typography>
//                   </MenuItem>
//                 ))}
//               </TextField>
//             </Grid>
//             <Grid size={{ xs: 6, sm: 4, md: 2.75 }}>
//               <TextField
//                 select
//                 fullWidth
//                 size="small"
//                 label="To Office/Warehouse"
//                 value={toOfficeFilter}
//                 onChange={(e) => {
//                   setToOfficeFilter(e.target.value);
//                   setPage(0);
//                 }}
//                 disabled={officesLoading}
//               >
//                 <MenuItem value="">All Destinations</MenuItem>
//                 {allOffices.map((o) => (
//                   <MenuItem key={o.id} value={String(o.id)}>
//                     {o.name}
//                     <Typography
//                       component="span"
//                       variant="caption"
//                       color="text.secondary"
//                       sx={{ ml: 0.75 }}
//                     >
//                       ({o.type})
//                     </Typography>
//                   </MenuItem>
//                 ))}
//               </TextField>
//             </Grid>
//           </Grid>
//         </Card>

//         {listError && (
//           <Alert severity="error" sx={{ borderRadius: 2 }}>
//             Could not load internal transfer records.
//           </Alert>
//         )}

//         {/* Table */}
//         <Card
//           sx={{
//             borderRadius: 3,
//             border: `1px solid ${alpha(theme.palette.divider, 1)}`,
//             overflow: 'hidden',
//           }}
//         >
//           <Box
//             sx={{ px: 2.5, py: 1.75, borderBottom: `1px solid ${alpha(theme.palette.divider, 1)}` }}
//           >
//             <Stack direction="row" alignItems="center" justifyContent="space-between">
//               <Typography variant="subtitle1" fontWeight={700}>
//                 Transfer Records
//               </Typography>
//               <Typography variant="body2" color="text.secondary">
//                 {totalCount} {totalCount === 1 ? 'transfer' : 'transfers'}
//               </Typography>
//             </Stack>
//           </Box>

//           <TableContainer>
//             <Table size="small">
//               <TableHead>
//                 <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
//                   <TableCell align="center" sx={{ width: 48, fontWeight: 700 }}>
//                     #
//                   </TableCell>
//                   <TableCell sx={{ fontWeight: 700 }}>Transfer #</TableCell>
//                   <TableCell sx={{ fontWeight: 700 }}>Route</TableCell>
//                   <TableCell align="center" sx={{ fontWeight: 700 }}>
//                     Items / Qty
//                   </TableCell>
//                   <TableCell align="center" sx={{ fontWeight: 700 }}>
//                     Status
//                   </TableCell>
//                   <TableCell align="center" sx={{ fontWeight: 700 }}>
//                     Next Action
//                   </TableCell>
//                   <TableCell align="center" sx={{ fontWeight: 700, width: 80 }}>
//                     Actions
//                   </TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {listLoading
//                   ? Array.from({ length: 6 }).map((_, i) => (
//                       <TableRow key={i}>
//                         {[48, 140, 260, 90, 120, 140, 80].map((w, j) => (
//                           <TableCell key={j} align={j === 0 ? 'center' : 'left'}>
//                             <Skeleton variant="text" width={w} height={20} />
//                           </TableCell>
//                         ))}
//                       </TableRow>
//                     ))
//                   : rows.map((transfer, idx) => (
//                       <TransferRow
//                         key={transfer.id}
//                         transfer={transfer}
//                         idx={page * 10 + idx}
//                         onEdit={handleEdit}
//                         onDelete={(id) => setDeleteId(id)}
//                         onReview={handleReview}
//                         onGatePass={() => {}} // PDF generation is self-contained in the row
//                         userCanApprove={userCanApprove}
//                         onView={(id) =>
//                           router.push(paths.dashboard.storeInventory.stock_transfer_detail(id))
//                         }
//                       />
//                     ))}
//                 {!listLoading && rows.length === 0 && (
//                   <TableRow>
//                     <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center' }}>
//                       <Stack alignItems="center" spacing={1.5}>
//                         <Iconify
//                           icon="solar:transfer-horizontal-line-duotone"
//                           width={52}
//                           sx={{ color: alpha(theme.palette.text.disabled, 0.6) }}
//                         />
//                         <Typography variant="h6" color="text.secondary">
//                           No transfers found
//                         </Typography>
//                         <Typography variant="body2" color="text.disabled">
//                           Adjust your filters or create the first transfer.
//                         </Typography>
//                         <Button
//                           variant="contained"
//                           size="small"
//                           startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={16} />}
//                           onClick={handleCreate}
//                         >
//                           Create Transfer
//                         </Button>
//                       </Stack>
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </TableContainer>

//           {totalPages > 1 && (
//             <Stack
//               direction="row"
//               justifyContent="space-between"
//               alignItems="center"
//               sx={{ px: 2.5, py: 1.75, borderTop: `1px solid ${alpha(theme.palette.divider, 1)}` }}
//             >
//               <Typography variant="body2" color="text.secondary">
//                 {totalCount} {totalCount === 1 ? 'record' : 'records'}
//               </Typography>
//               <Pagination
//                 color="primary"
//                 shape="rounded"
//                 count={totalPages}
//                 page={page + 1}
//                 onChange={(_, v) => setPage(v - 1)}
//               />
//             </Stack>
//           )}
//         </Card>

//         {/* Business logic info card */}
//         <Card
//           sx={{
//             p: 2.5,
//             borderRadius: 3,
//             border: `1px solid ${alpha(theme.palette.info.main, 0.18)}`,
//             bgcolor: alpha(theme.palette.info.main, 0.03),
//           }}
//         >
//           <Stack direction="row" gap={1.5} alignItems="flex-start">
//             <Iconify
//               icon="solar:info-circle-bold-duotone"
//               width={20}
//               sx={{ color: 'info.main', mt: 0.1, flexShrink: 0 }}
//             />
//             <Box>
//               <Typography variant="subtitle2" fontWeight={700} color="info.dark" gutterBottom>
//                 Stock Movement Rules
//               </Typography>
//               <Stack spacing={0.5}>
//                 {[
//                   'Draft → no stock change. Edit freely.',
//                   'Dispatch (→ In Transit) → quantity deducted from source immediately.',
//                   'Mark Received (→ Received) → quantity added to destination inventory.',
//                   'Not Received (→ Back Transit) → no stock change; goods are returning to source.',
//                   'Back Received → quantity restored to source inventory.',
//                   'Cancel Transfer (from Draft) → no stock change.',
//                 ].map((rule) => (
//                   <Stack key={rule} direction="row" gap={0.75} alignItems="flex-start">
//                     <Iconify
//                       icon="solar:arrow-right-bold"
//                       width={13}
//                       sx={{ color: 'info.main', mt: 0.25, flexShrink: 0 }}
//                     />
//                     <Typography variant="body2" color="text.secondary">
//                       {rule}
//                     </Typography>
//                   </Stack>
//                 ))}
//               </Stack>
//             </Box>
//           </Stack>
//         </Card>
//       </Stack>

//       <InternalTransferFormDialog
//         open={formOpen}
//         mode={formMode}
//         transferId={editId}
//         onClose={() => {
//           setFormOpen(false);
//           setEditId(null);
//         }}
//         onSuccess={handleSuccess}
//       />

//       {reviewTransfer?.status === 'Back Transit' ? (
//         <InternalTransferBackReceiveDialog
//           open={Boolean(reviewTransfer)}
//           transfer={reviewTransfer}
//           onClose={() => setReviewTransfer(null)}
//           onSuccess={handleReviewSuccess}
//         />
//       ) : (
//         <InternalTransferReviewDialog
//           open={Boolean(reviewTransfer)}
//           transfer={reviewTransfer}
//           onClose={() => setReviewTransfer(null)}
//           onSuccess={handleReviewSuccess}
//         />
//       )}

//       <ConfirmDialog
//         open={Boolean(deleteId)}
//         onClose={() => setDeleteId(null)}
//         title="Delete Internal Transfer"
//         content="This permanently deletes the transfer. If In Transit, stock will be restored to the source."
//         action={
//           <Button variant="contained" color="error" onClick={handleDelete}>
//             Delete
//           </Button>
//         }
//       />
//     </Box>
//   );
// }
