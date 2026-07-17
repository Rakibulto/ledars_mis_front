'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useMemo, useState, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Table,
  Button,
  Dialog,
  Switch,
  Divider,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Pagination,
  Typography,
  DialogTitle,
  Autocomplete,
  DialogActions,
  DialogContent,
  InputAdornment,
  LinearProgress,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest, useDeleteRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import SummaryCard from '../../_components/summary-card';

const STATUS_OPTIONS = ['Pending', 'Accepted', 'In Progress', 'Completed'];
const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'];
const INITIAL_FORM = {
  beneficiary: '',
  referred_to: '',
  service: '',
  date: '',
  status: 'Pending',
  priority: 'Medium',
};
const ROWS_PER_PAGE = 10;

function normalizeText(value) {
  return (value || '').toString().trim().toLowerCase();
}

function getPriorityTone(priority) {
  if (priority === 'Critical') return { bg: '#fee2e2', color: '#991b1b' };
  if (priority === 'High') return { bg: '#fed7aa', color: '#9a3412' };
  if (priority === 'Medium') return { bg: '#fef3c7', color: '#92400e' };
  return { bg: '#dbeafe', color: '#1e40af' };
}

function getStatusTone(status) {
  if (status === 'Completed') return { bg: '#d1fae5', color: '#065f46' };
  if (status === 'Accepted' || status === 'In Progress') return { bg: '#dbeafe', color: '#1e40af' };
  if (status === 'Pending') return { bg: '#fef3c7', color: '#92400e' };
  return { bg: '#f3f4f6', color: '#374151' };
}

function buildCsv(rows) {
  const header = [
    'Referral ID',
    'Beneficiary',
    'Beneficiary Code',
    'Partner',
    'Service',
    'Date',
    'Priority',
    'Status',
  ];
  const body = rows.map((row) => [
    row?.referral_code || row?.id || '',
    row?.beneficiary_info?.name || row?.beneficiaryName || '',
    row?.beneficiary_info?.ben_code || row?.beneficiaryId || '',
    row?.referred_to || row?.referredTo || '',
    row?.service || '',
    row?.date || '',
    row?.priority || '',
    row?.status || '',
  ]);

  return [header, ...body]
    .map((cols) => cols.map((col) => `"${String(col).replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

function ReferralTableRow({ referral, onView, onEdit, onDelete, onAdvanceStatus }) {
  const priorityTone = getPriorityTone(referral?.priority);
  const statusTone = getStatusTone(referral?.status);
  const nextStatus =
    referral?.status === 'Pending'
      ? 'Accepted'
      : referral?.status === 'Accepted'
        ? 'In Progress'
        : referral?.status === 'In Progress'
          ? 'Completed'
          : null;

  return (
    <TableRow
      hover
      sx={{
        cursor: 'pointer',
        '&:hover': { bgcolor: '#f9fafb' },
        borderBottom: '1px solid #f3f4f6',
      }}
      onClick={() => onView(referral)}
    >
      <TableCell>
        <Typography variant="body2" fontWeight={600} color="#1a1a1a">
          {referral?.referral_code || referral?.id}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={600} color="#1a1a1a" sx={{ mb: 0.5 }}>
          {referral?.beneficiary_info?.name || referral?.beneficiaryName || '-'}
        </Typography>
        <Typography variant="caption" color="#6b7280">
          {referral?.beneficiary_info?.ben_code || referral?.beneficiaryId || 'No code'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#1a1a1a" fontWeight={500}>
          {referral?.referred_to || referral?.referredTo || '-'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#6b7280">
          {referral?.service || '-'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#1a1a1a">
          {referral?.date || '-'}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 2,
            py: 0.5,
            borderRadius: 1.5,
            bgcolor: priorityTone.bg,
            color: priorityTone.color,
          }}
        >
          <Typography variant="body2" fontWeight={600} fontSize="0.8125rem">
            {referral?.priority || 'Low'}
          </Typography>
        </Box>
      </TableCell>
      <TableCell align="center">
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 2,
            py: 0.5,
            borderRadius: 1.5,
            bgcolor: statusTone.bg,
            color: statusTone.color,
          }}
        >
          <Typography variant="body2" fontWeight={600} fontSize="0.8125rem">
            {referral?.status || 'Pending'}
          </Typography>
        </Box>
      </TableCell>
      <TableCell align="center" onClick={(event) => event.stopPropagation()}>
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <IconButton onClick={() => onView(referral)} size="small" sx={{ color: '#2563eb' }}>
            <Iconify icon="solar:eye-bold" width={18} />
          </IconButton>
          <IconButton onClick={() => onEdit(referral)} size="small" sx={{ color: '#f59e0b' }}>
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
          {nextStatus && (
            <IconButton
              onClick={() => onAdvanceStatus(referral, nextStatus)}
              size="small"
              sx={{ color: '#10b981' }}
            >
              <Iconify icon="solar:double-alt-arrow-right-bold" width={18} />
            </IconButton>
          )}
          <IconButton onClick={() => onDelete(referral)} size="small" sx={{ color: '#ef4444' }}>
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function ReferralManagementMain() {
  const confirm = useBoolean();
  const formDialog = useBoolean();

  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [deleteReferralId, setDeleteReferralId] = useState(null);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const { data: rawReferrals, loading } = useGetRequest(
    endpoints.beneficiaries.referral_management
  );
  const { data: summaryData } = useGetRequest(endpoints.beneficiaries.referral_summary);
  const { data: rawBeneficiaries, loading: beneficiariesLoading } = useGetRequest(
    endpoints.beneficiaries.beneficiaries_database
  );
  const { data: rawPartners, loading: partnersLoading } = useGetRequest(
    endpoints.beneficiaries.referral_network
  );

  const referrals = useMemo(
    () => (Array.isArray(rawReferrals) ? rawReferrals : rawReferrals?.results || []),
    [rawReferrals]
  );
  const beneficiaries = useMemo(
    () => (Array.isArray(rawBeneficiaries) ? rawBeneficiaries : rawBeneficiaries?.results || []),
    [rawBeneficiaries]
  );
  const partners = useMemo(
    () => (Array.isArray(rawPartners) ? rawPartners : rawPartners?.results || []),
    [rawPartners]
  );

  const partnerNames = useMemo(
    () => partners.map((row) => row.organization).filter(Boolean),
    [partners]
  );
  const serviceOptions = useMemo(() => {
    const services = new Set();
    partners.forEach((row) => (row.services || []).forEach((service) => services.add(service)));
    referrals.forEach((row) => row?.service && services.add(row.service));
    return Array.from(services);
  }, [partners, referrals]);

  const filteredReferrals = useMemo(() => {
    const term = normalizeText(searchQuery);

    return referrals.filter((referral) => {
      const beneficiaryName = normalizeText(
        referral?.beneficiary_info?.name || referral?.beneficiaryName
      );
      const beneficiaryCode = normalizeText(
        referral?.beneficiary_info?.ben_code || referral?.beneficiaryId
      );
      const referralId = normalizeText(referral?.referral_code || referral?.id);
      const referredTo = normalizeText(referral?.referred_to || referral?.referredTo);
      const service = normalizeText(referral?.service);

      const matchesSearch =
        !term ||
        beneficiaryName.includes(term) ||
        beneficiaryCode.includes(term) ||
        referralId.includes(term) ||
        referredTo.includes(term) ||
        service.includes(term);
      const matchesStatus = statusFilter === 'all' || referral?.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || referral?.priority === priorityFilter;
      const matchesPartner =
        partnerFilter === 'all' ||
        normalizeText(referral?.referred_to || referral?.referredTo) ===
          normalizeText(partnerFilter);
      const matchesService = serviceFilter === 'all' || referral?.service === serviceFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesPartner && matchesService;
    });
  }, [partnerFilter, priorityFilter, referrals, searchQuery, serviceFilter, statusFilter]);

  const currentPage = Math.min(
    page,
    Math.max(Math.ceil(filteredReferrals.length / ROWS_PER_PAGE) - 1, 0)
  );
  const totalPages = Math.ceil(filteredReferrals.length / ROWS_PER_PAGE);
  const paginatedReferrals = useMemo(() => {
    const startIndex = currentPage * ROWS_PER_PAGE;
    return filteredReferrals.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [currentPage, filteredReferrals]);

  const stats = useMemo(() => {
    if (summaryData) {
      return {
        total: summaryData.total || summaryData.total_referrals || referrals.length,
        pending: summaryData.pending || 0,
        inProgress: summaryData.in_progress || 0,
        completed: summaryData.completed || 0,
      };
    }

    return {
      total: referrals.length,
      pending: referrals.filter((row) => row.status === 'Pending').length,
      inProgress: referrals.filter((row) => ['Accepted', 'In Progress'].includes(row.status))
        .length,
      completed: referrals.filter((row) => row.status === 'Completed').length,
    };
  }, [referrals, summaryData]);

  const unmatchedReferrals = useMemo(
    () =>
      referrals.filter(
        (row) =>
          row?.referred_to &&
          !partners.some(
            (partner) => normalizeText(partner.organization) === normalizeText(row.referred_to)
          )
      ).length,
    [partners, referrals]
  );
  const urgentOpenReferrals = useMemo(
    () =>
      referrals.filter(
        (row) => row.status !== 'Completed' && ['Critical', 'High'].includes(row.priority)
      ).length,
    [referrals]
  );
  const activePartners = useMemo(
    () => partners.filter((row) => row.status === 'Active').length,
    [partners]
  );

  const selectedReferralDetails = useMemo(() => {
    if (selectedReferral) {
      return selectedReferral;
    }
    return filteredReferrals[0] || null;
  }, [filteredReferrals, selectedReferral]);

  const selectedPartner = useMemo(() => {
    if (!selectedReferralDetails?.referred_to) {
      return null;
    }

    return (
      partners.find(
        (partner) =>
          normalizeText(partner.organization) === normalizeText(selectedReferralDetails.referred_to)
      ) || null
    );
  }, [partners, selectedReferralDetails]);

  const selectedBeneficiary = useMemo(() => {
    if (!selectedReferralDetails?.beneficiary) {
      return null;
    }

    return (
      beneficiaries.find((row) => String(row.id) === String(selectedReferralDetails.beneficiary)) ||
      null
    );
  }, [beneficiaries, selectedReferralDetails]);

  const recommendedPartners = useMemo(() => {
    const service = normalizeText(selectedReferralDetails?.service || formData.service);
    const referredTo = normalizeText(selectedReferralDetails?.referred_to || formData.referred_to);

    return partners
      .filter((partner) => partner.status === 'Active')
      .filter((partner) => {
        const organization = normalizeText(partner.organization);
        const services = (partner.services || []).map(normalizeText);
        return (
          organization === referredTo ||
          services.some((item) => item.includes(service) || service.includes(item))
        );
      })
      .slice(0, 4);
  }, [formData.referred_to, formData.service, partners, selectedReferralDetails]);

  const topPartners = useMemo(
    () =>
      [...partners]
        .sort((left, right) => (right.referrals_made || 0) - (left.referrals_made || 0))
        .slice(0, 4),
    [partners]
  );

  const beneficiaryOptions = useMemo(
    () =>
      beneficiaries.map((row) => ({
        id: row.id,
        label: row.name || row.full_name || `Beneficiary ${row.id}`,
        benCode: row.ben_code || row.code || '',
        project: row.project_name || row.project?.name || '',
      })),
    [beneficiaries]
  );

  const selectedBeneficiaryOption = useMemo(
    () => beneficiaryOptions.find((row) => String(row.id) === String(formData.beneficiary)) || null,
    [beneficiaryOptions, formData.beneficiary]
  );

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage - 1);
  }, []);

  const handleChangeDense = useCallback((event) => {
    setDense(event.target.checked);
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    formDialog.onTrue();
  }, [formDialog]);

  const handleViewReferral = useCallback((referral) => {
    setSelectedReferral(referral);
  }, []);

  const handleOpenEdit = useCallback(
    (referral) => {
      setSelectedReferral(referral);
      setEditingItem(referral);
      setFormData({
        beneficiary: referral?.beneficiary || '',
        referred_to: referral?.referred_to || '',
        service: referral?.service || '',
        date: referral?.date || '',
        status: referral?.status || 'Pending',
        priority: referral?.priority || 'Medium',
      });
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleFormChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleOpenDelete = useCallback(
    (referral) => {
      setDeleteReferralId(referral?.id);
      setSelectedReferral(referral);
      confirm.onTrue();
    },
    [confirm]
  );

  const handleReferralDelete = useCallback(async () => {
    try {
      await useDeleteRequest(`${endpoints.beneficiaries.referral_management}${deleteReferralId}/`);
      await mutate(endpoints.beneficiaries.referral_management);
      await mutate(endpoints.beneficiaries.referral_summary);
      toast.success('Referral deleted successfully');
      if (selectedReferral?.id === deleteReferralId) {
        setSelectedReferral(null);
      }
    } catch (error) {
      toast.error('Failed to delete referral');
    } finally {
      confirm.onFalse();
    }
  }, [confirm, deleteReferralId, selectedReferral]);

  const handleAdvanceStatus = useCallback(async (referral, nextStatus) => {
    try {
      await axiosInstance.patch(`${endpoints.beneficiaries.referral_management}${referral.id}/`, {
        status: nextStatus,
      });
      await mutate(endpoints.beneficiaries.referral_management);
      await mutate(endpoints.beneficiaries.referral_summary);
      setSelectedReferral((prev) =>
        prev?.id === referral.id ? { ...prev, status: nextStatus } : prev
      );
      toast.success(`Referral moved to ${nextStatus}`);
    } catch (error) {
      toast.error('Failed to update referral status');
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.beneficiary || !formData.referred_to || !formData.service || !formData.date) {
      toast.error('Beneficiary, partner, service, and date are required');
      return;
    }

    try {
      if (editingItem) {
        await axiosInstance.patch(
          `${endpoints.beneficiaries.referral_management}${editingItem.id}/`,
          formData
        );
        toast.success('Referral updated successfully');
      } else {
        await axiosInstance.post(endpoints.beneficiaries.referral_management, formData);
        toast.success('Referral created successfully');
      }

      await mutate(endpoints.beneficiaries.referral_management);
      await mutate(endpoints.beneficiaries.referral_summary);
      formDialog.onFalse();
      setEditingItem(null);
      setFormData(INITIAL_FORM);
    } catch (error) {
      toast.error(editingItem ? 'Failed to update referral' : 'Failed to create referral');
    }
  }, [editingItem, formData, formDialog]);

  const handleExport = useCallback(() => {
    const csv = buildCsv(filteredReferrals);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'beneficiary-referrals.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }, [filteredReferrals]);

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'flex-start' }}
        justifyContent="space-between"
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} color="#1a1a1a" gutterBottom>
            Referral Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track partner routing, referral progress, and outcome readiness without removing the
            existing CRUD workflow.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:download-bold" />}
            onClick={handleExport}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              borderColor: '#d1d5db',
              color: '#374151',
              fontWeight: 600,
              px: 3,
            }}
          >
            Export
          </Button>
          <Link href="/dashboard/beneficiaries/referral-management" passHref>
            <Button
              variant="contained"
              onClick={handleOpenCreate}
              startIcon={<Iconify icon="mingcute:add-line" />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                bgcolor: '#2563eb',
                fontWeight: 600,
                px: 3,
                '&:hover': { bgcolor: '#1d4ed8' },
              }}
            >
              Create Referral
            </Button>
          </Link>
        </Stack>
      </Stack>

      {(loading || beneficiariesLoading || partnersLoading) && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Referrals"
            value={stats.total}
            icon="solar:send-square-bold-duotone"
            bgcolor="#2563eb90"
            boxShadow="0 4px 20px rgba(37, 99, 235, 0.3)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Pending"
            value={stats.pending}
            icon="solar:clock-circle-bold-duotone"
            bgcolor="#f9731690"
            boxShadow="0 4px 20px rgba(249, 115, 22, 0.3)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="In Progress"
            value={stats.inProgress}
            icon="solar:refresh-circle-bold-duotone"
            bgcolor="#8b5cf690"
            boxShadow="0 4px 20px rgba(139, 92, 246, 0.3)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Completed"
            value={stats.completed}
            icon="solar:check-circle-bold-duotone"
            bgcolor="#10b98190"
            boxShadow="0 4px 20px rgba(16, 185, 129, 0.3)"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Alert severity={unmatchedReferrals > 0 ? 'warning' : 'success'} sx={{ borderRadius: 2 }}>
            {unmatchedReferrals > 0
              ? `${unmatchedReferrals} referral${unmatchedReferrals > 1 ? 's are' : ' is'} routed to organizations outside the maintained network. Review partner mapping to keep routing traceable.`
              : 'All current referrals align with partners in the maintained referral network.'}
          </Alert>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={700}>
                Routing Queue
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip color="error" label={`${urgentOpenReferrals} urgent open`} />
                <Chip color="success" label={`${activePartners} active partners`} />
                <Chip variant="outlined" label={`${serviceOptions.length} service pathways`} />
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by referral ID, beneficiary, service, or partner..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" sx={{ color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">All Status</MenuItem>
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Priority"
                value={priorityFilter}
                onChange={(event) => {
                  setPriorityFilter(event.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">All Priorities</MenuItem>
                {PRIORITY_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Partner"
                value={partnerFilter}
                onChange={(event) => {
                  setPartnerFilter(event.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">All Partners</MenuItem>
                {partnerNames.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Service"
                value={serviceFilter}
                onChange={(event) => {
                  setServiceFilter(event.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">All Services</MenuItem>
                {serviceOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Box>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <TableContainer>
              <Table size={dense ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Referral ID</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Beneficiary</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Referred To</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Service</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Date</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#374151' }}>
                      Priority
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#374151' }}>
                      Status
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#374151' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedReferrals.map((referral) => (
                    <ReferralTableRow
                      key={referral.id}
                      referral={referral}
                      onView={handleViewReferral}
                      onEdit={handleOpenEdit}
                      onDelete={handleOpenDelete}
                      onAdvanceStatus={handleAdvanceStatus}
                    />
                  ))}

                  {paginatedReferrals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <Stack alignItems="center" spacing={2}>
                          <Iconify
                            icon="solar:file-text-bold-duotone"
                            width={64}
                            sx={{ color: '#d1d5db' }}
                          />
                          <Typography variant="h6" color="text.secondary">
                            No referrals found
                          </Typography>
                          <Typography variant="body2" color="text.disabled">
                            Try adjusting your search, partner, or status filters.
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 2.5,
                  px: 2,
                  alignItems: 'center',
                }}
              >
                <FormControlLabel
                  control={<Switch checked={dense} onChange={handleChangeDense} />}
                  label="Dense"
                />
                {totalPages > 0 && (
                  <Pagination
                    count={totalPages}
                    page={currentPage + 1}
                    variant="outlined"
                    shape="rounded"
                    onChange={handleChangePage}
                  />
                )}
              </Box>
            </TableContainer>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Referral Detail
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Select a row to review routing and progress.
                    </Typography>
                  </Box>
                  {selectedReferralDetails?.status && (
                    <Chip
                      label={selectedReferralDetails.status}
                      color={selectedReferralDetails.status === 'Completed' ? 'success' : 'info'}
                    />
                  )}
                </Stack>

                {!selectedReferralDetails ? (
                  <Alert severity="info">No referral selected yet.</Alert>
                ) : (
                  <>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Beneficiary
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedReferralDetails?.beneficiary_info?.name ||
                          selectedBeneficiary?.name ||
                          '-'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedReferralDetails?.beneficiary_info?.ben_code ||
                          selectedBeneficiary?.ben_code ||
                          'No code'}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Referral ID
                        </Typography>
                        <Typography variant="body2">
                          {selectedReferralDetails?.referral_code || selectedReferralDetails?.id}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Date
                        </Typography>
                        <Typography variant="body2">
                          {selectedReferralDetails?.date || '-'}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Service
                        </Typography>
                        <Typography variant="body2">
                          {selectedReferralDetails?.service || '-'}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Priority
                        </Typography>
                        <Typography variant="body2">
                          {selectedReferralDetails?.priority || '-'}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.75 }}>
                        Routing Partner
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedReferralDetails?.referred_to || '-'}
                      </Typography>
                      {selectedPartner ? (
                        <Stack spacing={0.5} sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Coverage: {selectedPartner.coverage || 'Not specified'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Contact: {selectedPartner.contact || 'Not specified'}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={0.75}
                            flexWrap="wrap"
                            useFlexGap
                            sx={{ mt: 0.5 }}
                          >
                            {(selectedPartner.services || []).map((service) => (
                              <Chip key={service} label={service} size="small" variant="outlined" />
                            ))}
                          </Stack>
                        </Stack>
                      ) : (
                        <Alert severity="warning" sx={{ mt: 1.5 }}>
                          This referral is not currently mapped to a known network partner.
                        </Alert>
                      )}
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Progress Actions
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {STATUS_OPTIONS.filter(
                          (option) => option !== selectedReferralDetails?.status
                        ).map((option) => (
                          <Button
                            key={option}
                            size="small"
                            variant="outlined"
                            onClick={() => handleAdvanceStatus(selectedReferralDetails, option)}
                          >
                            Mark {option}
                          </Button>
                        ))}
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleOpenEdit(selectedReferralDetails)}
                        >
                          Edit Referral
                        </Button>
                      </Stack>
                    </Box>
                  </>
                )}
              </Stack>
            </Card>

            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700}>
                  Recommended Partners
                </Typography>
                {recommendedPartners.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Select a referral or choose a service in the form to see network
                    recommendations.
                  </Typography>
                ) : (
                  recommendedPartners.map((partner) => (
                    <Box key={partner.id} sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {partner.organization}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {partner.coverage || 'Coverage not set'}
                          </Typography>
                        </Box>
                        <Chip size="small" label={`${partner.referrals_made || 0} referrals`} />
                      </Stack>
                    </Box>
                  ))
                )}
              </Stack>
            </Card>

            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700}>
                  Top Network Partners
                </Typography>
                {topPartners.map((partner) => (
                  <Stack
                    key={partner.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {partner.organization}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {partner.type || 'Partner'}
                      </Typography>
                    </Box>
                    <Chip label={partner.referrals_made || 0} color="primary" variant="outlined" />
                  </Stack>
                ))}
              </Stack>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Referral"
        content="Are you sure you want to delete this referral record? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleReferralDelete}>
            Delete
          </Button>
        }
      />

      <Dialog open={formDialog.value} onClose={formDialog.onFalse} fullWidth maxWidth="sm">
        <DialogTitle>{editingItem ? 'Edit Referral' : 'Create Referral'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1.5 }}>
            <Autocomplete
              options={beneficiaryOptions}
              loading={beneficiariesLoading}
              value={selectedBeneficiaryOption}
              onChange={(event, option) => {
                setFormData((prev) => ({ ...prev, beneficiary: option?.id || '' }));
              }}
              getOptionLabel={(option) =>
                `${option.label}${option.benCode ? ` (${option.benCode})` : ''}`
              }
              renderInput={(params) => <TextField {...params} label="Beneficiary" required />}
            />

            <Autocomplete
              freeSolo
              options={partnerNames}
              value={formData.referred_to}
              onInputChange={(event, value) => {
                setFormData((prev) => ({ ...prev, referred_to: value || '' }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Referred To"
                  required
                  helperText="Choose a known partner or enter a custom organization name."
                />
              )}
            />

            <Autocomplete
              freeSolo
              options={serviceOptions}
              value={formData.service}
              onInputChange={(event, value) => {
                setFormData((prev) => ({ ...prev, service: value || '' }));
              }}
              renderInput={(params) => <TextField {...params} label="Service" required />}
            />

            <TextField
              fullWidth
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
              required
            />

            <TextField
              select
              fullWidth
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleFormChange}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleFormChange}
            >
              {PRIORITY_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            {selectedBeneficiaryOption && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Selected beneficiary: {selectedBeneficiaryOption.label}
                {selectedBeneficiaryOption.benCode ? ` (${selectedBeneficiaryOption.benCode})` : ''}
                {selectedBeneficiaryOption.project ? ` • ${selectedBeneficiaryOption.project}` : ''}
              </Alert>
            )}

            {recommendedPartners.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Matching partners for this service
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {recommendedPartners.map((partner) => (
                    <Chip
                      key={partner.id}
                      label={partner.organization}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, referred_to: partner.organization }))
                      }
                      clickable
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={formDialog.onFalse}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
