'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';

import {
  Alert,
  Box,
  Chip,
  Dialog,
  Divider,
  Grid,
  Stack,
  Button,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest, extractErrorMessage } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

const EP = endpoints.storeInventory;

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(value));
}

function fmtQty(value) {
  return Number(value || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function statusChipProps(status) {
  switch (
    String(status || '')
      .trim()
      .toLowerCase()
  ) {
    case 'completed':
      return { color: 'success', label: 'Completed' };
    case 'approved':
      return { color: 'info', label: 'Approved' };
    case 'cancelled':
      return { color: 'error', label: 'Cancelled' };
    case 'pending approval':
      return { color: 'warning', label: 'Pending Approval' };
    default:
      return { color: 'default', label: status || 'Unknown' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ScrapApprovalDialog({ open, scrapRecord, onClose, onSuccess }) {
  const { user } = useAuthContext();
  const [submitting, setSubmitting] = useState(false);

  // Fetch approval workflow config for approval information display
  const { data: rawApprovalWorkflows } = useGetRequest(
    open ? `${EP.approval_workflows}?menu=scrap_management` : null
  );

  // Parse workflow and level info
  const { matchedLevel, eligibleUsers } = useMemo(() => {
    const workflows = Array.isArray(rawApprovalWorkflows)
      ? rawApprovalWorkflows
      : Array.isArray(rawApprovalWorkflows?.results)
        ? rawApprovalWorkflows.results
        : [];
    const activeWorkflow = workflows.find((wf) => wf.is_active);
    if (
      !activeWorkflow ||
      !Array.isArray(activeWorkflow.levels) ||
      activeWorkflow.levels.length === 0
    ) {
      return { matchedLevel: null, eligibleUsers: [] };
    }
    // Use the first level (scrap typically has one level)
    const level = activeWorkflow.levels[0];
    return {
      matchedLevel: level,
      eligibleUsers: Array.isArray(level.level_users) ? level.level_users : [],
    };
  }, [rawApprovalWorkflows]);

  // Compute approval info
  const approvalInfo = useMemo(() => {
    if (!scrapRecord) return null;

    const approvalLog = Array.isArray(scrapRecord.approval_log) ? scrapRecord.approval_log : [];
    const approvedCount = approvalLog.length;
    const minRequired = matchedLevel?.minimum_approval_required || 1;
    const pendingCount = Math.max(0, minRequired - approvedCount);
    const isOrdered = matchedLevel?.level_maintain_require === 'yes';

    const approvedUserNames = approvalLog.map((entry) => entry.name || entry.email || 'Unknown');

    const allEligibleNames = eligibleUsers.map(
      (lu) => lu.user_detail?.full_name || lu.user_detail?.email || 'Unknown'
    );

    // Pending users: eligible users minus already approved
    const approvedEmails = approvalLog.map((entry) => (entry.email || '').toLowerCase());
    const pendingUsers = eligibleUsers.filter(
      (lu) => !approvedEmails.includes((lu.user_detail?.email || '').toLowerCase())
    );
    const pendingUserNames = pendingUsers.map(
      (lu) => lu.user_detail?.full_name || lu.user_detail?.email || 'Unknown'
    );

    // Next approver for ordered workflow
    let nextApprover = null;
    if (isOrdered) {
      const nextOrder = (scrapRecord.approval_level || 0) + 1;
      const nextUser = eligibleUsers.find((lu) => lu.approval_order === nextOrder);
      if (nextUser) {
        nextApprover = nextUser.user_detail?.full_name || nextUser.user_detail?.email || 'Unknown';
      }
    }

    return {
      currentStatus: scrapRecord.status || 'Pending Approval',
      minRequired,
      approvedCount,
      pendingCount,
      approvedUserNames,
      pendingUserNames,
      allEligibleNames,
      nextApprover,
      isOrdered,
    };
  }, [scrapRecord, matchedLevel, eligibleUsers]);

  if (!scrapRecord) return null;

  const chip = statusChipProps(scrapRecord.status);
  const isApproved =
    String(scrapRecord.status || '')
      .trim()
      .toLowerCase() === 'approved';

  // Check if current user already approved
  const approvalLog = Array.isArray(scrapRecord.approval_log) ? scrapRecord.approval_log : [];
  const userAlreadyApproved = approvalLog.some(
    (entry) => String(entry.email || '').toLowerCase() === String(user?.email || '').toLowerCase()
  );

  // Check if current user is eligible
  const userEmail = (user?.email || '').toLowerCase();
  const isEligible = eligibleUsers.some(
    (lu) => String(lu.user_detail?.email || '').toLowerCase() === userEmail
  );

  const canApprove = !isApproved && !userAlreadyApproved && isEligible;

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await axiosInstance.post(`${EP.scrap_record_by_id(scrapRecord.id)}approve/`);
      toast.success(`${scrapRecord.reference || 'Scrap record'} approved successfully.`);
      onSuccess?.();
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err));
    } finally {
      setSubmitting(false);
    }
  };

  const metaFields = [
    { label: 'Reference', value: scrapRecord.reference || '—' },
    {
      label: 'Certificate No.',
      value: scrapRecord.certificate_number || '—',
    },
    {
      label: 'Product',
      value: scrapRecord.product_name || '—',
    },
    {
      label: 'Product Code',
      value: scrapRecord.product_code || '—',
    },
    {
      label: 'Office / Location',
      value: scrapRecord.office_location_name || scrapRecord.warehouse_name || '—',
    },
    {
      label: 'Recorded By',
      value: scrapRecord.scrapped_by_name || '—',
    },
    { label: 'Scrap Date', value: fmtDate(scrapRecord.date) },
    {
      label: 'Disposal Date',
      value: fmtDate(scrapRecord.disposal_date),
    },
    {
      label: 'Disposal Method',
      value: scrapRecord.disposal_method || '—',
    },
    {
      label: 'Quantity',
      value: `${fmtQty(scrapRecord.quantity)} ${scrapRecord.uom_name || ''}`.trim(),
    },
    { label: 'Current Status', value: chip.label, highlight: true },
  ];

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      {/* ── Header ── */}
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" fontWeight={700} color="#0f172a">
              Review Scrap Record
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {scrapRecord.reference || 'Unnumbered'}&nbsp;·&nbsp;
              {scrapRecord.product_name || 'Product pending'}
            </Typography>
          </Box>
          <Chip size="small" {...chip} variant="soft" sx={{ mt: 0.5 }} />
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {/* ── Meta overview grid ── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(2, 1fr)' },
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

        {/* ── Reason ── */}
        {scrapRecord.reason && (
          <Box
            sx={{
              p: 2,
              bgcolor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 2,
              mb: 2.5,
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Reason for Scrap
            </Typography>
            <Typography variant="body2" color="#0f172a">
              {scrapRecord.reason}
            </Typography>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* ── Approval Information ── */}
        {approvalInfo && (
          <Box
            sx={{
              p: 2,
              bgcolor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: 2,
              mb: 2.5,
            }}
          >
            <Typography variant="subtitle2" fontWeight={700} color="#0369a1" mb={1.5}>
              Approval Information
            </Typography>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Current Status
                </Typography>
                <Typography variant="body2" fontWeight={600} color="#0f172a">
                  {approvalInfo.currentStatus}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Min Approval Required
                </Typography>
                <Typography variant="body2" fontWeight={600} color="#0f172a">
                  {approvalInfo.minRequired}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Approved Count
                </Typography>
                <Typography variant="body2" fontWeight={600} color="success.main">
                  {approvalInfo.approvedCount}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Pending Count
                </Typography>
                <Typography variant="body2" fontWeight={600} color="warning.main">
                  {approvalInfo.pendingCount}
                </Typography>
              </Grid>
            </Grid>

            {/* Approved Users */}
            {approvalInfo.approvedUserNames.length > 0 && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  Approved By
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {approvalInfo.approvedUserNames.map((name, idx) => (
                    <Chip
                      key={idx}
                      label={name}
                      size="small"
                      color="success"
                      variant="soft"
                      sx={{ mb: 0.5 }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Pending Users */}
            {approvalInfo.pendingUserNames.length > 0 && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  Pending Approval From
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {approvalInfo.pendingUserNames.map((name, idx) => (
                    <Chip
                      key={idx}
                      label={name}
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ mb: 0.5 }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Next Approver for ordered workflow */}
            {approvalInfo.isOrdered && approvalInfo.nextApprover && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  Next Approver
                </Typography>
                <Chip label={approvalInfo.nextApprover} size="small" color="info" variant="soft" />
              </Box>
            )}

            {/* Eligible Approvers list */}
            {approvalInfo.allEligibleNames.length > 0 && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  {approvalInfo.allEligibleNames.length === 1
                    ? 'Eligible Approver'
                    : 'Eligible Approvers'}
                </Typography>
                <Typography variant="body2" fontWeight={500} color="#0f172a">
                  {approvalInfo.allEligibleNames.join(', ')}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
          <strong>Approving</strong> will reduce the products warehouse stock by
          <strong>
            {fmtQty(scrapRecord.quantity)} {scrapRecord.uom_name || 'units'}
          </strong>{' '}
          once the minimum approval requirement is reached.
        </Alert>
      </DialogContent>

      {/* ── Actions ── */}
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={submitting} color="inherit" variant="outlined">
          Cancel
        </Button>

        <Box sx={{ flex: 1 }} />

        {canApprove && (
          <Button
            variant="contained"
            color="success"
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <Iconify icon="solar:check-circle-bold" width={18} />
              )
            }
            onClick={handleApprove}
          >
            {submitting ? 'Approving…' : 'Approve'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
