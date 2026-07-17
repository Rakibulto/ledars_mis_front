'use client';

import useSWR from 'swr';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import { alpha, useTheme } from '@mui/material/styles';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { useCurrency } from '../currency-context';
import { useVouchersApi } from './use-vouchers-api';

const STATUS_COLORS = {
  draft: 'default',
  pending: 'warning',
  submitted: 'warning',
  approved: 'info',
  posted: 'success',
  rejected: 'error',
  cancelled: 'default',
};

const EMPTY_VOUCHER = {
  reference: '',
  voucher_type: 'journal',
  partner_name: '',
  journal_id: '',
  journal_name: '',
  date: new Date().toISOString().slice(0, 10),
  amount: '',
  payment_method_name: 'Internal Posting',
  currency: 'BDT',
  project: '',
  cost_center: '',
};

const EMPTY_VOUCHER_LINE = {
  _key: Date.now() + Math.random(),
  account: '',
  description: '',
  debit: '',
  credit: '',
};

export default function VoucherManagement() {
  const { activeCurrency, formatAmount } = useCurrency();
  const theme = useTheme();
  const [vouchers, setVouchers] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedVoucherId, setSelectedVoucherId] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, type: null, voucher: null });
  const [createOpen, setCreateOpen] = useState(false);
  const [draftVoucher, setDraftVoucher] = useState(EMPTY_VOUCHER);
  const [notes, setNotes] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [voucherLines, setVoucherLines] = useState([]);

  // ── API data ────────────────────────────────────────────────
  const api = useVouchersApi();

  const { data: rawProjects } = useSWR(endpoints.projectManagements.projects, fetcher);
  const { data: rawCostCenters } = useSWR(endpoints.accounting.cost_centers, fetcher);
  const { data: rawAccounts } = useSWR(endpoints.accounting.accounts, fetcher);

  const projects = useMemo(() => {
    const list = Array.isArray(rawProjects)
      ? rawProjects
      : Array.isArray(rawProjects?.results)
        ? rawProjects.results
        : [];
    return list;
  }, [rawProjects]);

  const costCenters = useMemo(() => {
    const list = Array.isArray(rawCostCenters)
      ? rawCostCenters
      : Array.isArray(rawCostCenters?.results)
        ? rawCostCenters.results
        : [];
    return list;
  }, [rawCostCenters]);

  const accounts = useMemo(() => {
    const list = Array.isArray(rawAccounts)
      ? rawAccounts
      : Array.isArray(rawAccounts?.results)
        ? rawAccounts.results
        : [];
    return list;
  }, [rawAccounts]);

  // Sync from API every time data refreshes; preserve local mock entries
  const hasSelectedDefault = useRef(false);
  useEffect(() => {
    if (!api.loading) {
      setVouchers((current) => {
        const localOnly = current.filter((v) => String(v.id).startsWith('vch-mock-'));
        return [...localOnly, ...api.vouchers];
      });
      setApprovals(api.approvals);
      if (!hasSelectedDefault.current && api.vouchers.length > 0) {
        hasSelectedDefault.current = true;
        setSelectedVoucherId(api.vouchers[0]?.id || null);
      }
    }
  }, [api.vouchers, api.approvals, api.loading]);

  // Attachments are not pre-fetched on the list page (shown as 0 until detail view)
  const attachments = useMemo(() => [], []);

  const attachmentCountByVoucher = useMemo(() => {
    const counts = {};
    attachments.forEach((item) => {
      counts[item.voucher_id] = (counts[item.voucher_id] || 0) + 1;
    });
    return counts;
  }, [attachments]);

  const pendingApprovals = approvals.filter((item) => item.status === 'pending').length;
  const filtered = vouchers.filter((voucher) => {
    const haystack = [voucher.number, voucher.reference, voucher.partner_name, voucher.journal_name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (search && !haystack.includes(search.toLowerCase())) return false;
    if (status !== 'all' && (voucher.status || '').toLowerCase() !== status) return false;
    return true;
  });

  const selectedVoucher =
    filtered.find((voucher) => voucher.id === selectedVoucherId) ||
    vouchers.find((voucher) => voucher.id === selectedVoucherId) ||
    filtered[0] ||
    vouchers[0] ||
    null;

  const voucherSummary = useMemo(() => {
    const readyToPost = vouchers.filter(
      (item) =>
        item.status === 'approved' &&
        (attachmentCountByVoucher[item.id] || 0) > 0 &&
        approvals
          .filter((approval) => approval.voucher_id === item.id)
          .every((approval) => approval.status === 'approved')
    ).length;

    const blockedPosting = vouchers.filter(
      (item) =>
        item.status === 'approved' &&
        ((attachmentCountByVoucher[item.id] || 0) === 0 ||
          approvals
            .filter((approval) => approval.voucher_id === item.id)
            .some((approval) => approval.status !== 'approved'))
    ).length;

    const missingSupport = vouchers.filter(
      (item) => (attachmentCountByVoucher[item.id] || 0) === 0
    ).length;

    return {
      readyToPost,
      blockedPosting,
      missingSupport,
    };
  }, [approvals, attachmentCountByVoucher, vouchers]);

  const stats = {
    total: vouchers.length,
    draft: vouchers.filter((item) => item.status === 'draft').length,
    awaitingApproval: vouchers.filter((item) => ['submitted', 'approved'].includes(item.status))
      .length,
    postedValue: vouchers
      .filter((item) => item.status === 'posted')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0),
  };

  const openAction = (type, voucher) => {
    setNotes('');
    setSelectedVoucherId(voucher.id);
    setActionDialog({ open: true, type, voucher });
  };

  const closeAction = () => {
    setActionDialog({ open: false, type: null, voucher: null });
    setNotes('');
  };

  const handleAction = async () => {
    const { voucher, type } = actionDialog;
    if (!voucher) return;

    const statusMap = {
      submit: 'submitted',
      approve: 'approved',
      reject: 'rejected',
      post: 'posted',
    };

    const approvalMap = {
      submit: 'pending',
      approve: 'approved',
      reject: 'rejected',
      post: 'approved',
    };

    const nextStatus = statusMap[type];
    const nextApproval = approvalMap[type];

    // Save previous state for rollback on failure
    const prevStatus = voucher.status;
    const prevApproval = voucher.approval_status;

    // Optimistic local state update
    setVouchers((current) =>
      current.map((item) =>
        item.id === voucher.id
          ? {
              ...item,
              status: nextStatus || item.status,
              approval_status: nextApproval || item.approval_status,
            }
          : item
      )
    );

    setApprovals((current) =>
      current.map((item) =>
        item.voucher_id === voucher.id ? { ...item, status: nextApproval || item.status } : item
      )
    );

    closeAction();

    // For backend vouchers (numeric ID) call the real endpoint
    const isApiVoucher = !String(voucher.id).startsWith('vch-mock-');
    if (isApiVoucher) {
      try {
        const endpointMap = {
          submit: endpoints.accounting.voucher_submit,
          approve: endpoints.accounting.voucher_approve,
          reject: endpoints.accounting.voucher_reject,
          post: endpoints.accounting.voucher_post,
        };
        const endpointFn = endpointMap[type];
        if (endpointFn) {
          const body = type === 'reject' && notes ? { remarks: notes } : {};
          await axiosInstance.post(endpointFn(voucher.id), body);
          toast.success(`Voucher ${type}ed successfully`);
        }
      } catch (err) {
        // Revert optimistic update on failure
        setVouchers((current) =>
          current.map((item) =>
            item.id === voucher.id
              ? { ...item, status: prevStatus, approval_status: prevApproval }
              : item
          )
        );
        setApprovals((current) =>
          current.map((item) =>
            item.voucher_id === voucher.id ? { ...item, status: prevApproval || 'pending' } : item
          )
        );
        const message =
          err?.response?.data?.detail || err?.response?.data?.message || `Voucher ${type} failed`;
        toast.error(message);
      }
    }
  };

  const addVoucherLine = () => {
    setVoucherLines((current) => [
      ...current,
      { ...EMPTY_VOUCHER_LINE, _key: Date.now() + Math.random() },
    ]);
  };

  const removeVoucherLine = (index) => {
    setVoucherLines((current) => current.filter((_, i) => i !== index));
  };

  const updateVoucherLine = (index, field, value) => {
    setVoucherLines((current) =>
      current.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  };

  const handleCreateVoucher = async () => {
    const amount = Number(draftVoucher.amount || 0);
    const totalFromLines = voucherLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const finalAmount = voucherLines.length > 0 ? totalFromLines : amount;

    if (editTarget) {
      try {
        await api.actions.updateVoucher(editTarget.id, {
          voucher_type: draftVoucher.voucher_type || 'journal',
          journal_id: Number(draftVoucher.journal_id),
          date: draftVoucher.date,
          partner_name: draftVoucher.partner_name || '',
          narration: draftVoucher.reference || '',
          amount: finalAmount,
          project: draftVoucher.project ? Number(draftVoucher.project) : undefined,
          cost_center: draftVoucher.cost_center ? Number(draftVoucher.cost_center) : undefined,
          lines: voucherLines.map((l) => ({
            account: l.account ? Number(l.account) : undefined,
            description: l.description || '',
            debit: Number(l.debit || 0),
            credit: Number(l.credit || 0),
          })),
        });
        setEditTarget(null);
        setDraftVoucher(EMPTY_VOUCHER);
        setVoucherLines([]);
        setCreateOpen(false);
        toast.success('Voucher updated successfully');
      } catch (err) {
        const message =
          err?.response?.data?.detail || err?.response?.data?.message || 'Failed to update voucher';
        toast.error(message);
      }
      return;
    }
    try {
      const created = await api.actions.createVoucher({
        voucher_type: draftVoucher.voucher_type || 'journal',
        journal_id: Number(draftVoucher.journal_id),
        date: draftVoucher.date,
        partner_name: draftVoucher.partner_name || '',
        narration: draftVoucher.reference || '',
        amount: finalAmount,
        project: draftVoucher.project ? Number(draftVoucher.project) : undefined,
        cost_center: draftVoucher.cost_center ? Number(draftVoucher.cost_center) : undefined,
        lines: voucherLines.map((l) => ({
          account: l.account ? Number(l.account) : undefined,
          description: l.description || '',
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
        })),
      });
      setSelectedVoucherId(created.id);
      setDraftVoucher(EMPTY_VOUCHER);
      setVoucherLines([]);
      setCreateOpen(false);
      toast.success('Voucher created successfully');
    } catch (err) {
      const message =
        err?.response?.data?.detail || err?.response?.data?.message || 'Failed to create voucher';
      toast.error(message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Voucher Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Approval-ready voucher workflow for submission, review, posting, and attachment control.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<Icon icon="solar:download-minimalistic-bold" />}>
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Icon icon="solar:add-circle-bold" />}
            onClick={() => setCreateOpen(true)}
          >
            New Voucher
          </Button>
        </Stack>
      </Stack>

      {api.loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Loading vouchers from the accounting backend…
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            title: 'Total Vouchers',
            value: stats.total,
            color: theme.palette.primary.main,
            icon: 'solar:document-text-bold-duotone',
          },
          {
            title: 'Draft Queue',
            value: stats.draft,
            color: theme.palette.warning.main,
            icon: 'solar:pen-new-square-bold-duotone',
          },
          {
            title: 'Pending Approvals',
            value: pendingApprovals,
            color: theme.palette.info.main,
            icon: 'solar:clipboard-check-bold-duotone',
          },
          {
            title: 'Ready To Post',
            value: voucherSummary.readyToPost,
            color: theme.palette.secondary.main,
            icon: 'solar:verified-check-bold-duotone',
          },
          {
            title: 'Posted Value',
            value: formatAmount(stats.postedValue),
            color: theme.palette.success.main,
            icon: 'solar:wallet-money-bold-duotone',
          },
        ].map((item) => (
          <Grid key={item.title} size={{ xs: 12, sm: 6, md: 4, xl: 2.4 }}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(item.color, 0.12),
                    color: item.color,
                    width: 52,
                    height: 52,
                  }}
                >
                  <Icon icon={item.icon} width={24} />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {item.title}
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {item.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 12 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search vouchers"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Number, partner, reference"
                />
                <TextField
                  select
                  size="small"
                  label="Status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="submitted">Submitted</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="posted">Posted</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </TextField>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Voucher</TableCell>
                    <TableCell>Partner / Journal</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Attachments</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((voucher) => (
                    <TableRow
                      key={voucher.id}
                      hover
                      selected={selectedVoucher?.id === voucher.id}
                      onClick={() => setSelectedVoucherId(voucher.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{ fontFamily: 'monospace' }}
                        >
                          {voucher.number}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {voucher.reference || 'No reference'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {voucher.partner_name || 'Internal Entry'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {voucher.journal_name || 'General Journal'}
                        </Typography>
                      </TableCell>
                      <TableCell>{new Date(voucher.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={voucher.voucher_type || 'journal'}
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700}>
                          {formatAmount(voucher.amount || 0, voucher.currency || 'BDT')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip
                            label={voucher.status || 'draft'}
                            size="small"
                            color={STATUS_COLORS[voucher.status] || 'default'}
                            sx={{ textTransform: 'capitalize' }}
                          />
                          {voucher.approval_status && (
                            <Chip
                              label={voucher.approval_status}
                              size="small"
                              variant="outlined"
                              sx={{ textTransform: 'capitalize' }}
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        {attachmentCountByVoucher[voucher.id] || 0}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Edit voucher">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditTarget(voucher);
                                setDraftVoucher({
                                  voucher_type: voucher.voucher_type ?? 'journal',
                                  journal_id: String(voucher.journal_id ?? ''),
                                  journal_name: voucher.journal_name ?? '',
                                  date: voucher.date ?? '',
                                  partner_name: voucher.partner_name ?? '',
                                  reference: voucher.narration ?? '',
                                  amount: String(voucher.amount ?? ''),
                                  payment_method_name: voucher.payment_method_name ?? '',
                                  currency: voucher.currency ?? 'BDT',
                                  project: voucher.project ?? '',
                                  cost_center: voucher.cost_center ?? '',
                                });
                                setCreateOpen(true);
                              }}
                              disabled={voucher.status === 'posted'}
                            >
                              <Icon icon="solar:pen-bold" width={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete voucher">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteTarget(voucher)}
                              disabled={voucher.status === 'posted'}
                            >
                              <Icon icon="solar:trash-bin-trash-bold" width={16} />
                            </IconButton>
                          </Tooltip>
                          <Button
                            size="small"
                            variant="text"
                            component={RouterLink}
                            href={paths.dashboard.accountingFinance.transactions.voucherDetail(
                              voucher.id
                            )}
                          >
                            View
                          </Button>
                          {voucher.status === 'draft' && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => openAction('submit', voucher)}
                            >
                              Submit
                            </Button>
                          )}
                          {voucher.status === 'submitted' && (
                            <Button
                              size="small"
                              color="success"
                              variant="outlined"
                              onClick={() => openAction('approve', voucher)}
                            >
                              Approve
                            </Button>
                          )}
                          {voucher.status === 'submitted' && (
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => openAction('reject', voucher)}
                            >
                              Reject
                            </Button>
                          )}
                          {voucher.status === 'approved' && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => openAction('post', voucher)}
                            >
                              Post
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filtered.length && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            No vouchers match the current filters.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/*
        <Grid size={{ xs: 12, lg: 3 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Selected Voucher
              </Typography>
              {selectedVoucher ? (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      {selectedVoucher.number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedVoucher.reference || 'No reference'}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      label={selectedVoucher.status || 'draft'}
                      size="small"
                      color={STATUS_COLORS[selectedVoucher.status] || 'default'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                    <Chip
                      label={`${selectedAttachments.length} attachments`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                  <Grid container spacing={1.5}>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary">
                        Journal
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedVoucher.journal_name || 'General Journal'}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary">
                        Amount
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {formatAmount(
                          selectedVoucher.amount || 0,
                          selectedVoucher.currency || 'BDT'
                        )}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Alert
                    severity={
                      selectedVoucher.status === 'approved' &&
                      selectedAttachments.length > 0 &&
                      selectedApprovals.every((item) => item.status === 'approved')
                        ? 'success'
                        : 'warning'
                    }
                  >
                    {selectedVoucher.status === 'approved' &&
                    selectedAttachments.length > 0 &&
                    selectedApprovals.every((item) => item.status === 'approved')
                      ? 'Voucher is ready for posting.'
                      : 'Voucher still needs full approval coverage or supporting attachments before posting.'}
                  </Alert>
                  <Divider />
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Approval Readiness
                    </Typography>
                    {selectedApprovals.length ? (
                      selectedApprovals.map((item) => (
                        <Stack
                          key={item.id}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="body2">
                            {item.approver_name || 'Approver'}
                          </Typography>
                          <Chip
                            label={item.status}
                            size="small"
                            variant="outlined"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </Stack>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No approval chain assigned yet.
                      </Typography>
                    )}
                  </Stack>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Select a voucher to review approvals, support, and posting readiness.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Approval Queue
              </Typography>
              <Stack spacing={1.5}>
                {approvals.slice(0, 5).map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: alpha(theme.palette.info.main, 0.05),
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {item.approver_name || 'Approver'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Voucher #{item.voucher_id || '—'}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={item.status}
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Odoo-Style Controls
              </Typography>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Blocked posting candidates</Typography>
                  <Chip label={voucherSummary.blockedPosting} size="small" color="warning" />
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Missing support files</Typography>
                  <Chip label={voucherSummary.missingSupport} size="small" color="default" />
                </Stack>
                {[
                  'Submission workflow before posting',
                  'Approval chain visibility',
                  'Attachment audit readiness',
                  'Journal-linked voucher categorization',
                ].map((item) => (
                  <Stack key={item} direction="row" spacing={1.25} alignItems="flex-start">
                    <Icon
                      icon="solar:check-circle-bold"
                      width={18}
                      color={theme.palette.success.main}
                    />
                    <Typography variant="body2">{item}</Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        */}
      </Grid>

      <Dialog open={actionDialog.open} onClose={closeAction} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textTransform: 'capitalize' }}>{actionDialog.type} Voucher</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity={actionDialog.type === 'reject' ? 'warning' : 'info'}>
              {actionDialog.voucher?.number} will be {actionDialog.type}ed.
            </Alert>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Approval notes, reviewer comments, or posting remarks"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAction}>Cancel</Button>
          <Button
            variant="contained"
            color={actionDialog.type === 'reject' ? 'error' : 'primary'}
            onClick={handleAction}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Voucher</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              This draft feeds the shared local workflow so finance can submit, approve, and post
              it.
            </Alert>
            <TextField
              fullWidth
              label="Reference"
              value={draftVoucher.reference}
              onChange={(event) =>
                setDraftVoucher((current) => ({ ...current, reference: event.target.value }))
              }
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Voucher Type"
                  value={draftVoucher.voucher_type}
                  onChange={(event) =>
                    setDraftVoucher((current) => ({ ...current, voucher_type: event.target.value }))
                  }
                >
                  <MenuItem value="journal">Journal</MenuItem>
                  <MenuItem value="payment">Payment</MenuItem>
                  <MenuItem value="receipt">Receipt</MenuItem>
                  <MenuItem value="adjustment">Adjustment</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={draftVoucher.date}
                  onChange={(event) =>
                    setDraftVoucher((current) => ({ ...current, date: event.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Partner"
                  value={draftVoucher.partner_name}
                  onChange={(event) =>
                    setDraftVoucher((current) => ({ ...current, partner_name: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Journal"
                  value={draftVoucher.journal_id}
                  onChange={(event) =>
                    setDraftVoucher((current) => ({ ...current, journal_id: event.target.value }))
                  }
                  required
                >
                  {api.journals.length > 0 ? (
                    api.journals.map((j) => (
                      <MenuItem key={j.id} value={j.id}>
                        {j.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No journals available
                    </MenuItem>
                  )}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Project"
                  value={draftVoucher.project}
                  onChange={(event) =>
                    setDraftVoucher((current) => ({ ...current, project: event.target.value }))
                  }
                >
                  <MenuItem value="">Select project</MenuItem>
                  {projects.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.title || p.name || p.code}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Cost Center"
                  value={draftVoucher.cost_center}
                  onChange={(event) =>
                    setDraftVoucher((current) => ({ ...current, cost_center: event.target.value }))
                  }
                >
                  <MenuItem value="">Select cost center</MenuItem>
                  {costCenters.map((cc) => (
                    <MenuItem key={cc.id} value={cc.id}>
                      {cc.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Payment Method"
                  value={draftVoucher.payment_method_name}
                  onChange={(event) =>
                    setDraftVoucher((current) => ({
                      ...current,
                      payment_method_name: event.target.value,
                    }))
                  }
                />
              </Grid>
            </Grid>

            {/* Voucher Lines */}
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" fontWeight={700}>
                Voucher Lines
              </Typography>
              <Button
                size="small"
                startIcon={<Icon icon="solar:add-circle-bold" />}
                onClick={addVoucherLine}
              >
                Add Line
              </Button>
            </Stack>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.neutral' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Account</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 110 }} align="right">
                      Debit
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 110 }} align="right">
                      Credit
                    </TableCell>
                    <TableCell sx={{ width: 40 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {voucherLines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          No lines added yet. Click &quot;Add Line&quot; to add journal lines.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    voucherLines.map((line, index) => (
                      <TableRow key={line._key ?? index}>
                        <TableCell sx={{ py: 0.75 }}>
                          <TextField
                            select
                            size="small"
                            value={line.account}
                            onChange={(e) => updateVoucherLine(index, 'account', e.target.value)}
                            variant="standard"
                            sx={{ minWidth: 140 }}
                          >
                            <MenuItem value="">Select</MenuItem>
                            {accounts.map((a) => (
                              <MenuItem key={a.id} value={a.id}>
                                {a.code} — {a.name}
                              </MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell sx={{ py: 0.75 }}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Line description"
                            value={line.description}
                            onChange={(e) =>
                              updateVoucherLine(index, 'description', e.target.value)
                            }
                            variant="standard"
                          />
                        </TableCell>
                        <TableCell sx={{ py: 0.75 }}>
                          <TextField
                            size="small"
                            type="number"
                            value={line.debit}
                            onChange={(e) => updateVoucherLine(index, 'debit', e.target.value)}
                            variant="standard"
                            inputProps={{ min: 0, style: { textAlign: 'right' } }}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 0.75 }}>
                          <TextField
                            size="small"
                            type="number"
                            value={line.credit}
                            onChange={(e) => updateVoucherLine(index, 'credit', e.target.value)}
                            variant="standard"
                            inputProps={{ min: 0, style: { textAlign: 'right' } }}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 0.75, pl: 0 }}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeVoucherLine(index)}
                          >
                            <Icon icon="solar:trash-bin-minimalistic-bold" width={15} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCreateOpen(false);
              setEditTarget(null);
              setDraftVoucher(EMPTY_VOUCHER);
              setVoucherLines([]);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateVoucher}>
            {editTarget ? 'Save Changes' : 'Create Draft'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Voucher?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete voucher <strong>{deleteTarget?.number}</strong>? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              try {
                await api.actions.deleteVoucher(deleteTarget.id);
              } catch (e) {
                console.error(e);
              } finally {
                setDeleteTarget(null);
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
