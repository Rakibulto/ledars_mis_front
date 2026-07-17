'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { pdf } from '@react-pdf/renderer';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Table,
  Button,
  Divider,
  Avatar,
  Skeleton,
  TableRow,
  Tooltip,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
  IconButton,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import {
  useGetRequest,
  extractErrorMessage,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import InternalTransferFormDialog from './internal-transfer-form-dialog';
import InternalTransferReviewDialog from './internal-transfer-review-dialog';
import InternalTransferBackReceiveDialog from './internal-transfer-back-receive-dialog';
import InternalTransferPDF from './internal-transfer-pdf';

// ─── constants ────────────────────────────────────────────────────────────────

const EP = endpoints.storeInventory;

const STATUS_CONFIG = {
  Draft: {
    color: 'default',
    icon: 'solar:document-text-bold-duotone',
    reviewable: true,
    description: 'Transfer is being prepared. Edit freely before dispatching.',
  },
  'Pending Transit Approval': {
    color: 'warning',
    icon: 'solar:clock-circle-bold-duotone',
    reviewable: true,
    description: 'Awaiting approval from authorized approvers.',
  },
  'In Transit': {
    color: 'info',
    icon: 'solar:delivery-bold-duotone',
    reviewable: true,
    description: 'Goods are en route to the destination.',
  },
  'Back Transit': {
    color: 'warning',
    icon: 'solar:arrow-left-bold-duotone',
    reviewable: true,
    description: 'Goods were not accepted and are returning to the source.',
  },
  Received: {
    color: 'success',
    icon: 'solar:check-circle-bold-duotone',
    reviewable: false,
    description: 'Transfer complete. Destination inventory has been updated.',
  },
  'Back Received': {
    color: 'success',
    icon: 'solar:refresh-bold-duotone',
    reviewable: false,
    description: 'Returned goods received back at source.',
  },
  Cancelled: {
    color: 'error',
    icon: 'solar:close-circle-bold-duotone',
    reviewable: false,
    description: 'Transfer was cancelled.',
  },
};

const WORKFLOW_FORWARD = ['Draft', 'Pending Transit Approval', 'In Transit', 'Received'];
const WORKFLOW_RETURN = [
  'Draft',
  'Pending Transit Approval',
  'In Transit',
  'Back Transit',
  'Back Received',
];

const APPROVAL_WORKFLOW_URL =
  '/api/approval-workflows/?module_type=inventory&menu=internal_transfers';

// ─── Approval workflow helpers (matching list page logic) ──────────────────────

function normalizeWorkflow(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  if (Array.isArray(raw.results)) return raw.results[0] ?? null;
  if (raw.id) return raw;
  return null;
}

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

function computeWorkflowInfo(transfer, rawWorkflow, userEmail) {
  const statusCfg = STATUS_CONFIG[transfer?.status];
  const isReviewable = statusCfg?.reviewable ?? false;
  const workflow = normalizeWorkflow(rawWorkflow);

  if (!workflow) {
    return {
      matchedLevel: null,
      canApprove: false,
      noMatchWarning: false,
      nextApprover: null,
      approvalProgress: null,
      fullyApproved: false,
      levelUsers: [],
      orderedApproval: false,
      alreadyApproved: false,
      approvedNames: [],
      pendingNames: [],
    };
  }

  const totalAmount = getTransferTotal(transfer);
  const matchedLevel = findMatchedLevel(workflow, totalAmount);
  if (!matchedLevel) {
    return {
      matchedLevel: null,
      canApprove: false,
      noMatchWarning: isReviewable,
      nextApprover: null,
      approvalProgress: null,
      fullyApproved: false,
      levelUsers: [],
      orderedApproval: false,
      alreadyApproved: false,
      approvedNames: [],
      pendingNames: [],
    };
  }

  // Check if current user already approved (by email in status_log)
  const statusLog = Array.isArray(transfer?.status_log) ? transfer.status_log : [];
  const alreadyApproved = userEmail
    ? statusLog.some((entry) => (entry.email ?? '').toLowerCase() === userEmail.toLowerCase())
    : false;

  // Extract approved names from status_log and pending names from levelUsers
  const approvedEmails = new Set(
    statusLog.map((entry) => (entry.email ?? '').toLowerCase()).filter(Boolean)
  );
  const approvedNames = statusLog.map((entry) => entry.name || entry.email || '').filter(Boolean);

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

  const userEntry = userEmail
    ? levelUsers.find(
        (lu) => (lu.user_detail?.email ?? '').toLowerCase() === userEmail.toLowerCase()
      )
    : null;

  let canApprove = false;
  if (userEntry && isReviewable && !fullyApproved && !alreadyApproved) {
    if (orderedApproval) {
      canApprove = userEntry.approval_order === approvalLevel + 1;
    } else {
      canApprove = true;
    }
  }

  let nextApprover = null;
  if (!fullyApproved) {
    if (orderedApproval) {
      const nextOrder = approvalLevel + 1;
      const nextUser = levelUsers.find((lu) => lu.approval_order === nextOrder);
      nextApprover = nextUser?.user_detail?.full_name ?? null;
    } else {
      nextApprover = levelUsers
        .map((lu) => lu.user_detail?.full_name)
        .filter(Boolean)
        .join(', ');
    }
  }

  return {
    matchedLevel,
    canApprove,
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

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(v) {
  if (!v) return '\u2014';
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(v));
}

function fmtDateTime(v) {
  if (!v) return '\u2014';
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(v)
  );
}

function fmtNumber(v) {
  return Number(v || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function fmtCurrency(v) {
  const n = Number(v || 0);
  return `BDT ${n.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatusChip({ status, size = 'medium' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
  return (
    <Chip
      size={size}
      color={cfg.color}
      label={status || '\u2014'}
      variant="soft"
      icon={<Iconify icon={cfg.icon} width={size === 'small' ? 12 : 14} />}
      sx={{ fontWeight: 700, '& .MuiChip-icon': { ml: 0.75 } }}
    />
  );
}

function InfoRow({ label, value, mono = false }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 110, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        variant="caption"
        fontWeight={600}
        color="text.primary"
        sx={{ textAlign: 'right', fontFamily: mono ? 'monospace' : undefined }}
      >
        {value || '\u2014'}
      </Typography>
    </Stack>
  );
}

function MetricCard({ icon, label, value, sub, color = 'primary' }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2.5,
        bgcolor: alpha(theme.palette[color].main, 0.06),
        border: `1px solid ${alpha(theme.palette[color].main, 0.14)}`,
        height: '100%',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette[color].main, 0.14),
            color: `${color}.main`,
            flexShrink: 0,
          }}
        >
          <Iconify icon={icon} width={22} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {sub}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function OfficeBlock({ label, name, type, color = 'primary' }) {
  const theme = useTheme();
  const icon =
    type === 'warehouse' ? 'solar:warehouse-bold-duotone' : 'solar:buildings-2-bold-duotone';
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2.5,
        flex: 1,
        bgcolor: alpha(theme.palette[color].main, 0.05),
        border: `1px solid ${alpha(theme.palette[color].main, 0.16)}`,
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette[color].main, 0.14),
            color: `${color}.main`,
            flexShrink: 0,
          }}
        >
          <Iconify icon={icon} width={16} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight={700} lineHeight={1.2}>
            {name || '\u2014'}
          </Typography>
          {type && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: 'capitalize' }}
            >
              {type}
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

// ── Approval Progress Chip (matches list page) ─────────────────────────────

function ApprovalProgressChip({ info }) {
  if (!info?.matchedLevel) return null;

  const { approvalProgress, fullyApproved, approvedNames, pendingNames } = info;

  const approvedList =
    Array.isArray(approvedNames) && approvedNames.length > 0
      ? approvedNames.map((n) => `  \u2705 ${n}`).join('\n')
      : '';
  const pendingList =
    Array.isArray(pendingNames) && pendingNames.length > 0
      ? pendingNames.map((n) => `  \u23F3 ${n}`).join('\n')
      : '';

  let tooltipTitle = '';
  if (fullyApproved) {
    tooltipTitle = `\u2705 All required approvals received\n\nApproved by:\n${approvedList}`;
  } else if (approvedList && pendingList) {
    tooltipTitle = `Approval Progress: ${approvalProgress}\n\n\u2705 Already Approved:\n${approvedList}\n\n\u23F3 Pending Approval:\n${pendingList}`;
  } else if (pendingList) {
    tooltipTitle = `Approval Progress: ${approvalProgress}\n\n\u23F3 Pending Approval:\n${pendingList}`;
  } else if (approvedList) {
    tooltipTitle = `Approval Progress: ${approvalProgress}\n\n\u2705 Already Approved:\n${approvedList}`;
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

// ── Status Log Timeline ────────────────────────────────────────────────────

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
              {entry.status_from} \u2192 {entry.status_to}
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

// ── Workflow Timeline (updated) ─────────────────────────────────────────────

function WorkflowTimeline({ currentStatus, onReview, wfInfo }) {
  const theme = useTheme();
  const cfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.Draft;
  const isReturnPath = ['Back Transit', 'Back Received'].includes(currentStatus);
  const isCancelled = currentStatus === 'Cancelled';
  const stages = isReturnPath ? WORKFLOW_RETURN : WORKFLOW_FORWARD;

  const STAGE_ICONS = {
    Draft: 'solar:document-text-bold-duotone',
    'Pending Transit Approval': 'solar:clock-circle-bold-duotone',
    'In Transit': 'solar:delivery-bold-duotone',
    Received: 'solar:check-circle-bold-duotone',
    'Back Transit': 'solar:arrow-left-bold-duotone',
    'Back Received': 'solar:refresh-bold-duotone',
  };

  const getState = (stage) => {
    if (isCancelled) return 'cancelled';
    const idx = stages.indexOf(stage);
    const cur = stages.indexOf(currentStatus);
    if (idx < cur) return 'done';
    if (stage === currentStatus) return 'active';
    return 'pending';
  };

  return (
    <Stack spacing={0}>
      {isCancelled && (
        <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
          This transfer has been cancelled.
        </Alert>
      )}

      {/* Approval Progress Chip + Pending Approver info */}
      {wfInfo && wfInfo.matchedLevel && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.warning.main, 0.04),
            border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify
              icon="solar:users-group-rounded-bold-duotone"
              width={16}
              sx={{ color: 'warning.main' }}
            />
            <Typography
              variant="caption"
              fontWeight={700}
              color="warning.main"
              sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              Approval
            </Typography>
            <Box sx={{ ml: 'auto' }}>
              <ApprovalProgressChip info={wfInfo} />
            </Box>
          </Stack>
          {!wfInfo.fullyApproved && wfInfo.nextApprover && (
            <Alert
              severity="info"
              icon={<Iconify icon="solar:clock-circle-bold-duotone" width={14} />}
              sx={{ mt: 1, borderRadius: 1.5, py: 0 }}
            >
              <Typography variant="caption" fontWeight={600}>
                Pending: {wfInfo.nextApprover}
              </Typography>
            </Alert>
          )}
        </Box>
      )}

      {stages.map((stage, i) => {
        const state = getState(stage);
        const isLast = i === stages.length - 1;
        const stageCfg = STATUS_CONFIG[stage] || {};
        const paletteColor = stageCfg.color === 'default' ? 'grey' : stageCfg.color || 'primary';
        const dotBg =
          state === 'done'
            ? theme.palette.success.main
            : state === 'active'
              ? theme.palette[paletteColor]?.main || theme.palette.primary.main
              : theme.palette.grey[200];

        return (
          <Stack key={stage} direction="row" spacing={1.5}>
            <Stack alignItems="center" sx={{ width: 32, flexShrink: 0 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: dotBg,
                  color: state === 'pending' ? theme.palette.text.disabled : '#fff',
                  border: state === 'pending' ? `1.5px dashed ${theme.palette.grey[300]}` : 'none',
                  flexShrink: 0,
                }}
              >
                {state === 'done' ? (
                  <Iconify icon="solar:check-circle-bold" width={16} />
                ) : (
                  <Iconify
                    icon={STAGE_ICONS[stage] || 'solar:circle-bold'}
                    width={16}
                    sx={{ opacity: state === 'pending' ? 0.4 : 1 }}
                  />
                )}
              </Box>
              {!isLast && (
                <Box
                  sx={{
                    width: 2,
                    flex: 1,
                    my: 0.5,
                    minHeight: 20,
                    bgcolor:
                      state === 'done' ? theme.palette.success.light : theme.palette.grey[200],
                    borderRadius: 1,
                  }}
                />
              )}
            </Stack>
            <Box pb={isLast ? 0 : 2.5} flex={1}>
              <Typography
                variant="body2"
                fontWeight={state === 'active' ? 800 : state === 'done' ? 600 : 400}
                color={state === 'pending' ? 'text.disabled' : 'text.primary'}
              >
                {stage}
              </Typography>
              {state === 'active' && (
                <Typography variant="caption" color="text.secondary">
                  {cfg.description}
                </Typography>
              )}
            </Box>
          </Stack>
        );
      })}

      {!isCancelled &&
        wfInfo?.canApprove &&
        (currentStatus === 'In Transit' || currentStatus === 'Back Transit') && (
          <Box pt={2.5}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="solar:eye-bold-duotone" width={16} />}
              onClick={onReview}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Review & Take Action
            </Button>
          </Box>
        )}

      {/* Already approved message */}
      {!isCancelled && wfInfo?.alreadyApproved && !wfInfo.fullyApproved && (
        <Box pt={2.5}>
          <Alert
            severity="success"
            icon={<Iconify icon="solar:check-circle-bold-duotone" width={16} />}
            sx={{ borderRadius: 2 }}
          >
            <Typography variant="caption" fontWeight={600}>
              You have already approved this transfer. Awaiting other approvers.
            </Typography>
          </Alert>
        </Box>
      )}
    </Stack>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function InternalTransferDetails() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();

  const transferId = (() => {
    const v = params?.transferId;
    return Array.isArray(v) ? v[0] : v;
  })();

  const detailUrl = transferId ? EP.internal_transfer_by_id(transferId) : null;
  const { data: transfer, loading, error } = useGetRequest(detailUrl);
  const { user } = useAuthContext();
  const { data: rawWorkflow } = useGetRequest(APPROVAL_WORKFLOW_URL);

  const wfInfo = useMemo(
    () => computeWorkflowInfo(transfer, rawWorkflow, user?.email),
    [transfer, rawWorkflow, user?.email]
  );

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [downloadingChalan, setDownloadingChalan] = useState(false);
  const [downloadingGatePass, setDownloadingGatePass] = useState(false);

  const lines = useMemo(() => (Array.isArray(transfer?.lines) ? transfer.lines : []), [transfer]);

  const lineMetrics = useMemo(
    () => ({
      items: lines.length,
      quantity: lines.reduce((s, l) => s + Number(l.quantity || 0), 0),
      value: lines.reduce((s, l) => s + Number(l.quantity || 0) * Number(l.unit_price || 0), 0),
    }),
    [lines]
  );

  const statusCfg = STATUS_CONFIG[transfer?.status] || STATUS_CONFIG.Draft;
  const statusLogs = Array.isArray(transfer?.status_log) ? transfer.status_log : [];

  const invalidate = () =>
    mutate((key) => typeof key === 'string' && key.startsWith(EP.internal_transfers));

  const handleGetChalan = async () => {
    if (!transfer) return;
    setDownloadingChalan(true);
    try {
      const blob = await pdf(
        <InternalTransferPDF transfer={transfer} lines={lines} docType="chalan" />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Chalan-${transfer.transfer_number || 'transfer'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Chalan downloaded.');
    } catch {
      toast.error('Failed to generate Chalan.');
    } finally {
      setDownloadingChalan(false);
    }
  };

  const handleGetGatePass = async () => {
    if (!transfer) return;
    setDownloadingGatePass(true);
    try {
      const blob = await pdf(
        <InternalTransferPDF transfer={transfer} lines={lines} docType="gate_pass" />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GatePass-${transfer.transfer_number || 'transfer'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Gate Pass downloaded.');
    } catch {
      toast.error('Failed to generate Gate Pass.');
    } finally {
      setDownloadingGatePass(false);
    }
  };

  const handleFormSuccess = async () => {
    await Promise.all([invalidate(), detailUrl ? mutate(detailUrl) : Promise.resolve()]);
    setFormOpen(false);
  };

  const handleReviewSuccess = async () => {
    setReviewOpen(false);
    await Promise.all([invalidate(), detailUrl ? mutate(detailUrl) : Promise.resolve()]);
  };

  const handleDelete = async () => {
    if (!transferId) return;
    try {
      await deleteRequest(EP.internal_transfer_by_id(transferId));
      toast.success('Internal transfer deleted.');
      await invalidate();
      router.push(paths.dashboard.storeInventory.stock_transfer);
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err) || 'Failed to delete transfer.');
    } finally {
      setDeleteOpen(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
      <Stack spacing={3}>
        {/* ── page header ── */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
          spacing={1.5}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Tooltip title="Back to Internal Transfers">
              <IconButton
                component={Link}
                href={paths.dashboard.storeInventory.stock_transfer}
                sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}
              >
                <Iconify icon="eva:arrow-back-fill" width={18} />
              </IconButton>
            </Tooltip>
            <Box>
              {loading ? (
                <>
                  <Skeleton width={180} height={28} />
                  <Skeleton width={120} height={18} sx={{ mt: 0.25 }} />
                </>
              ) : (
                <>
                  <Typography variant="h5" fontWeight={800} lineHeight={1.2}>
                    {transfer?.transfer_number || 'Transfer Details'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Internal Stock Transfer &middot; {fmtDate(transfer?.transfer_date)}
                  </Typography>
                </>
              )}
            </Box>
            {!loading && transfer && <StatusChip status={transfer.status} />}
          </Stack>

          {!loading && !error && transfer && (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {/* Review button: show for all users when In Transit or Back Transit */}
              {(transfer.status === 'In Transit' || transfer.status === 'Back Transit') && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Iconify icon="solar:eye-bold-duotone" width={16} />}
                  onClick={() => setReviewOpen(true)}
                  sx={{ fontWeight: 700 }}
                >
                  Review
                </Button>
              )}
              {transfer.status === 'Draft' && (
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="solar:pen-bold" width={16} />}
                  onClick={() => setFormOpen(true)}
                >
                  Edit
                </Button>
              )}
              {/* Chalan - only show when In Transit */}
              {transfer.status === 'In Transit' && (
                <Button
                  variant="outlined"
                  color="info"
                  disabled={downloadingChalan}
                  startIcon={
                    downloadingChalan ? (
                      <Iconify icon="svg-spinners:ring-resize" width={16} />
                    ) : (
                      <Iconify icon="solar:document-text-bold-duotone" width={16} />
                    )
                  }
                  onClick={handleGetChalan}
                  sx={{ fontWeight: 600 }}
                >
                  {downloadingChalan ? 'Generating\u2026' : 'Get Chalan'}
                </Button>
              )}
              {/* Gate Pass - only show when In Transit */}
              {transfer.status === 'In Transit' && (
                <Button
                  variant="outlined"
                  color="info"
                  disabled={downloadingGatePass}
                  startIcon={
                    downloadingGatePass ? (
                      <Iconify icon="svg-spinners:ring-resize" width={16} />
                    ) : (
                      <Iconify icon="solar:shield-check-bold-duotone" width={16} />
                    )
                  }
                  onClick={handleGetGatePass}
                  sx={{ fontWeight: 600 }}
                >
                  {downloadingGatePass ? 'Generating\u2026' : 'Gate Pass'}
                </Button>
              )}
              <Button
                variant="outlined"
                color="error"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" width={16} />}
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>
            </Stack>
          )}
        </Stack>

        {/* ── loading ── */}
        {loading && (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3 }} />
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <Stack spacing={2}>
                  <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
                  <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, lg: 4 }}>
                <Skeleton variant="rounded" height={420} sx={{ borderRadius: 3 }} />
              </Grid>
            </Grid>
          </Stack>
        )}

        {/* ── error ── */}
        {!loading && error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Failed to load this internal transfer. Please try again.
          </Alert>
        )}

        {/* ── content ── */}
        {!loading && !error && transfer && (
          <Stack spacing={3}>
            {/* route banner */}
            <Card
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  px: 3,
                  py: 2.5,
                  background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 60%, #0891b2 100%)',
                }}
              >
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ md: 'center' }}
                  spacing={2}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                    {[
                      { name: transfer.from_office_name, type: transfer.from_office_type },
                      null,
                      { name: transfer.to_office_name, type: transfer.to_office_type },
                    ].map((loc, i) =>
                      loc === null ? (
                        <Iconify
                          key="arrow"
                          icon="solar:arrow-right-bold-duotone"
                          width={22}
                          sx={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}
                        />
                      ) : (
                        <Stack
                          key={i}
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.15)',
                          }}
                        >
                          <Iconify
                            icon={
                              loc.type === 'warehouse'
                                ? 'solar:warehouse-bold-duotone'
                                : 'solar:buildings-2-bold-duotone'
                            }
                            width={15}
                            sx={{ color: 'rgba(255,255,255,0.85)' }}
                          />
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{ color: 'common.white' }}
                          >
                            {loc.name || '\u2014'}
                          </Typography>
                          {loc.type && (
                            <Typography
                              variant="caption"
                              sx={{ color: 'rgba(255,255,255,0.55)', textTransform: 'capitalize' }}
                            >
                              ({loc.type})
                            </Typography>
                          )}
                        </Stack>
                      )
                    )}
                  </Stack>

                  <Stack alignItems={{ md: 'flex-end' }} spacing={0.5}>
                    <StatusChip status={transfer.status} size="medium" />
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255,255,255,0.65)',
                        maxWidth: 260,
                        textAlign: { md: 'right' },
                      }}
                    >
                      {statusCfg.description}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>

              <Box sx={{ px: 3, py: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <MetricCard
                      icon="solar:box-bold-duotone"
                      label="Items"
                      value={fmtNumber(lineMetrics.items)}
                      sub="Line items"
                      color="primary"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <MetricCard
                      icon="solar:layers-bold-duotone"
                      label="Quantity"
                      value={fmtNumber(lineMetrics.quantity)}
                      sub="Total units"
                      color="info"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <MetricCard
                      icon="solar:wallet-money-bold-duotone"
                      label="Value"
                      value={fmtCurrency(transfer.total_value ?? lineMetrics.value)}
                      sub="Transfer value"
                      color="warning"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <MetricCard
                      icon="solar:calendar-bold-duotone"
                      label="Date"
                      value={fmtDate(transfer.transfer_date)}
                      sub="Transfer date"
                      color="success"
                    />
                  </Grid>
                </Grid>
              </Box>
            </Card>

            {/* body */}
            <Grid container spacing={3}>
              {/* left column */}
              <Grid size={{ xs: 12, lg: 8 }}>
                <Stack spacing={3}>
                  {/* transfer details card */}
                  <Card
                    sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.25} mb={2.5}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                        }}
                      >
                        <Iconify icon="solar:transfer-horizontal-bold-duotone" width={18} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800}>
                          Transfer Details
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Source, destination, dates and notes
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2.5}>
                      <OfficeBlock
                        label="From (Source)"
                        name={transfer.from_office_name}
                        type={transfer.from_office_type}
                        color="primary"
                      />
                      <Stack
                        justifyContent="center"
                        alignItems="center"
                        sx={{ px: 0.5, flexShrink: 0 }}
                      >
                        <Iconify
                          icon="solar:arrow-right-bold-duotone"
                          width={28}
                          sx={{ color: 'text.disabled' }}
                        />
                      </Stack>
                      <OfficeBlock
                        label="To (Destination)"
                        name={transfer.to_office_name}
                        type={transfer.to_office_type}
                        color="info"
                      />
                    </Stack>

                    <Grid container spacing={1.75}>
                      {[
                        { label: 'Transfer Number', value: transfer.transfer_number, mono: true },
                        { label: 'Transfer Date', value: fmtDate(transfer.transfer_date) },
                        { label: 'Created At', value: fmtDateTime(transfer.created_at) },
                        { label: 'Last Updated', value: fmtDateTime(transfer.updated_at) },
                      ].map((f) => (
                        <Grid key={f.label} size={{ xs: 12, sm: 6 }}>
                          <Box
                            sx={{
                              p: 1.75,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.grey[500], 0.05),
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            <Typography variant="caption" color="text.secondary" display="block">
                              {f.label}
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              sx={{ mt: 0.25, fontFamily: f.mono ? 'monospace' : undefined }}
                            >
                              {f.value || '\u2014'}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>

                    {transfer.notes && (
                      <>
                        <Divider sx={{ my: 2.5 }} />
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.warning.main, 0.04),
                            border: `1px solid ${alpha(theme.palette.warning.main, 0.14)}`,
                          }}
                        >
                          <Stack direction="row" spacing={1}>
                            <Iconify
                              icon="solar:notes-bold-duotone"
                              width={18}
                              sx={{ color: 'warning.main', mt: 0.2, flexShrink: 0 }}
                            />
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Transfer Notes
                              </Typography>
                              <Typography variant="body2" fontWeight={500} sx={{ mt: 0.25 }}>
                                {transfer.notes}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      </>
                    )}

                    {/* Transport Details - show when available */}
                    {(transfer.transport_person || transfer.dispatch_date) && (
                      <>
                        <Divider sx={{ my: 2.5 }} />
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.info.main, 0.04),
                            border: `1px solid ${alpha(theme.palette.info.main, 0.14)}`,
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                            <Iconify
                              icon="solar:delivery-bold-duotone"
                              width={18}
                              sx={{ color: 'info.main' }}
                            />
                            <Typography variant="subtitle2" fontWeight={700} color="info.main">
                              Transportation Details
                            </Typography>
                          </Stack>
                          <Grid container spacing={1.5}>
                            {transfer.transport_person && (
                              <>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                  <InfoRow
                                    label="Transport Person"
                                    value={transfer.transport_person}
                                  />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                  <InfoRow label="Phone" value={transfer.transport_phone} />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                  <InfoRow label="Address" value={transfer.transport_address} />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                  <InfoRow label="Vehicle" value={transfer.vehicle_number} />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                  <InfoRow
                                    label="Dispatch Date"
                                    value={fmtDate(transfer.dispatch_date)}
                                  />
                                </Grid>
                              </>
                            )}
                          </Grid>
                        </Box>
                      </>
                    )}
                  </Card>

                  {/* line items */}
                  <Card
                    sx={{
                      borderRadius: 3,
                      border: `1px solid ${theme.palette.divider}`,
                      overflow: 'hidden',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ p: 3, pb: 2 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          color: 'info.main',
                        }}
                      >
                        <Iconify icon="solar:box-minimalistic-bold-duotone" width={18} />
                      </Box>
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight={800}>
                          Transfer Line Items
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {lineMetrics.items} product{lineMetrics.items !== 1 ? 's' : ''} &middot;{' '}
                          {fmtNumber(lineMetrics.quantity)} total units
                        </Typography>
                      </Box>
                    </Stack>

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow
                            sx={{
                              bgcolor: alpha(theme.palette.grey[500], 0.06),
                              '& .MuiTableCell-head': {
                                fontSize: 12,
                                fontWeight: 700,
                                color: 'text.secondary',
                                py: 1.5,
                                borderBottom: `1px solid ${theme.palette.divider}`,
                              },
                            }}
                          >
                            <TableCell sx={{ pl: 3 }}>#</TableCell>
                            <TableCell>Product</TableCell>
                            <TableCell align="right">Qty</TableCell>
                            <TableCell>Unit</TableCell>
                            <TableCell align="right">Unit Price</TableCell>
                            <TableCell align="right">Line Total</TableCell>
                            <TableCell>Notes</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {lines.map((line, idx) => (
                            <TableRow
                              key={line.id}
                              hover
                              sx={{ '&:last-child td': { borderBottom: 0 }, '& td': { py: 1.5 } }}
                            >
                              <TableCell sx={{ pl: 3 }}>
                                <Typography
                                  variant="caption"
                                  fontWeight={700}
                                  color="text.disabled"
                                >
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={700}>
                                  {line.item_name || line.product_name || 'Unnamed item'}
                                </Typography>
                                {(line.item_code || line.product_code) && (
                                  <Typography variant="caption" color="text.secondary">
                                    {line.item_code || line.product_code}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight={700}>
                                  {fmtNumber(line.quantity)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">
                                  {line.unit || '\u2014'}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">
                                  {fmtCurrency(line.unit_price)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight={700} color="primary.main">
                                  {fmtCurrency(
                                    Number(line.quantity || 0) * Number(line.unit_price || 0)
                                  )}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">
                                  {line.notes || '\u2014'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                          {!lines.length && (
                            <TableRow>
                              <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                <Stack alignItems="center" spacing={1}>
                                  <Iconify
                                    icon="solar:box-bold-duotone"
                                    width={40}
                                    sx={{ color: 'text.disabled' }}
                                  />
                                  <Typography variant="body2" color="text.secondary">
                                    No line items attached to this transfer
                                  </Typography>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {!!lines.length && (
                      <Box
                        sx={{
                          px: 3,
                          py: 2,
                          borderTop: `1px solid ${theme.palette.divider}`,
                          bgcolor: alpha(theme.palette.grey[500], 0.03),
                        }}
                      >
                        <Stack direction="row" justifyContent="flex-end" spacing={3}>
                          <Stack alignItems="flex-end">
                            <Typography variant="caption" color="text.secondary">
                              Total Quantity
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={800}>
                              {fmtNumber(lineMetrics.quantity)} units
                            </Typography>
                          </Stack>
                          <Divider orientation="vertical" flexItem />
                          <Stack alignItems="flex-end">
                            <Typography variant="caption" color="text.secondary">
                              Calculated Value
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                              {fmtCurrency(lineMetrics.value)}
                            </Typography>
                          </Stack>
                          {transfer.total_value != null && (
                            <>
                              <Divider orientation="vertical" flexItem />
                              <Stack alignItems="flex-end">
                                <Typography variant="caption" color="text.secondary">
                                  Document Value
                                </Typography>
                                <Typography variant="subtitle2" fontWeight={800}>
                                  {fmtCurrency(transfer.total_value)}
                                </Typography>
                              </Stack>
                            </>
                          )}
                        </Stack>
                      </Box>
                    )}
                  </Card>
                </Stack>
              </Grid>

              {/* right column */}
              <Grid size={{ xs: 12, lg: 4 }}>
                <Stack spacing={3}>
                  {/* workflow timeline */}
                  <Card
                    sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.25} mb={2.5}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          color: 'success.main',
                        }}
                      >
                        <Iconify icon="solar:chart-2-bold-duotone" width={18} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800}>
                          Workflow
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Transfer lifecycle & approval progress
                        </Typography>
                      </Box>
                    </Stack>
                    <WorkflowTimeline
                      currentStatus={transfer.status}
                      onReview={() => setReviewOpen(true)}
                      wfInfo={wfInfo}
                    />
                  </Card>

                  {/* Status Log Timeline card */}
                  {statusLogs.length > 0 && (
                    <Card
                      sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.25} mb={2}>
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.main',
                          }}
                        >
                          <Iconify icon="solar:clipboard-list-bold-duotone" width={18} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={800}>
                            Approval History
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {statusLogs.length} log entr{statusLogs.length !== 1 ? 'ies' : 'y'}
                          </Typography>
                        </Box>
                      </Stack>
                      <StatusLogTimeline logEntries={statusLogs} />
                    </Card>
                  )}

                  {/* inventory flags */}
                  <Card
                    sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.25} mb={2}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          color: 'info.main',
                        }}
                      >
                        <Iconify icon="solar:database-bold-duotone" width={18} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800}>
                          Inventory Flags
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Stock operation status
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack spacing={1}>
                      {[
                        {
                          icon: 'solar:minus-square-bold-duotone',
                          iconColor: 'warning.main',
                          label: 'Source Deducted',
                          value: transfer.stock_deducted,
                          chipColor: 'warning',
                        },
                        {
                          icon: 'solar:add-square-bold-duotone',
                          iconColor: 'success.main',
                          label: 'Destination Received',
                          value: transfer.stock_received,
                          chipColor: 'success',
                        },
                      ].map((f) => (
                        <Stack
                          key={f.label}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.grey[500], 0.04),
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Iconify icon={f.icon} width={16} sx={{ color: f.iconColor }} />
                            <Typography variant="caption" fontWeight={600}>
                              {f.label}
                            </Typography>
                          </Stack>
                          <Chip
                            size="small"
                            label={f.value ? 'Yes' : 'No'}
                            color={f.value ? f.chipColor : 'default'}
                            variant="soft"
                            sx={{ fontWeight: 700, height: 22 }}
                          />
                        </Stack>
                      ))}
                    </Stack>
                  </Card>

                  {/* quick reference */}
                  <Card
                    sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.25} mb={2}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(theme.palette.grey[500], 0.1),
                          color: 'text.secondary',
                        }}
                      >
                        <Iconify icon="solar:info-square-bold-duotone" width={18} />
                      </Box>
                      <Typography variant="subtitle1" fontWeight={800}>
                        Quick Reference
                      </Typography>
                    </Stack>
                    <Stack spacing={1}>
                      <InfoRow label="Transfer ID" value={`#${transfer.id}`} mono />
                      <Divider />
                      <InfoRow label="Reference No." value={transfer.transfer_number} mono />
                      <Divider />
                      <InfoRow label="Transfer Date" value={fmtDate(transfer.transfer_date)} />
                      <Divider />
                      <InfoRow label="Created" value={fmtDateTime(transfer.created_at)} />
                      <Divider />
                      <InfoRow label="Updated" value={fmtDateTime(transfer.updated_at)} />
                    </Stack>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        )}
      </Stack>

      {/* dialogs */}
      <InternalTransferFormDialog
        open={formOpen}
        mode="edit"
        transferId={transferId}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      {transfer?.status === 'Back Transit' ? (
        <InternalTransferBackReceiveDialog
          open={reviewOpen}
          transfer={transfer || null}
          onClose={() => setReviewOpen(false)}
          onSuccess={handleReviewSuccess}
        />
      ) : (
        <InternalTransferReviewDialog
          open={reviewOpen}
          transfer={transfer || null}
          onClose={() => setReviewOpen(false)}
          onSuccess={handleReviewSuccess}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Internal Transfer"
        content="Deleting this transfer will permanently remove it along with all line items. This cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
