'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Button,
  Dialog,
  Divider,
  MenuItem,
  TextField,
  IconButton,
  Pagination,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  InputAdornment,
  LinearProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import SummaryCard from '../../_components/summary-card';

const INITIAL_FORM = {
  organization: '',
  type: '',
  services: '',
  coverage: '',
  contact: '',
  status: 'Active',
  referrals_made: 0,
};
const PARTNERS_PER_PAGE = 6;

function normalizeText(value) {
  return (value || '').toString().trim().toLowerCase();
}

function buildCsv(rows) {
  const header = [
    'Organization',
    'Type',
    'Coverage',
    'Contact',
    'Status',
    'Referrals Made',
    'Services',
  ];
  const body = rows.map((row) => [
    row.organization || '',
    row.type || '',
    row.coverage || '',
    row.contact || '',
    row.status || '',
    row.referrals_made || 0,
    (row.services || []).join(', '),
  ]);

  return [header, ...body]
    .map((cols) => cols.map((col) => `"${String(col).replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

export default function ReferralNetworkMain() {
  const { data: rawData, loading } = useGetRequest(endpoints.beneficiaries.referral_network);
  const { data: rawReferrals, loading: referralsLoading } = useGetRequest(
    endpoints.beneficiaries.referral_management
  );

  const referralNetwork = useMemo(
    () => (Array.isArray(rawData) ? rawData : rawData?.results || []),
    [rawData]
  );
  const referrals = useMemo(
    () => (Array.isArray(rawReferrals) ? rawReferrals : rawReferrals?.results || []),
    [rawReferrals]
  );

  const formDialog = useBoolean();
  const confirmDelete = useBoolean();
  const [editingItem, setEditingItem] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [deleteId, setDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [page, setPage] = useState(0);

  const totalReferralsMade = useMemo(
    () => referralNetwork.reduce((sum, row) => sum + (row.referrals_made || 0), 0),
    [referralNetwork]
  );

  const partnerTypes = useMemo(
    () => Array.from(new Set(referralNetwork.map((row) => row.type).filter(Boolean))),
    [referralNetwork]
  );
  const serviceOptions = useMemo(() => {
    const services = new Set();
    referralNetwork.forEach((row) =>
      (row.services || []).forEach((service) => services.add(service))
    );
    return Array.from(services);
  }, [referralNetwork]);

  const referralCounts = useMemo(() => {
    const result = new Map();
    referrals.forEach((row) => {
      const key = normalizeText(row?.referred_to || row?.referredTo);
      if (!key) {
        return;
      }

      const current = result.get(key) || {
        total: 0,
        open: 0,
        completed: 0,
        pending: 0,
        inProgress: 0,
      };

      current.total += 1;
      if (row.status !== 'Completed') {
        current.open += 1;
      }
      if (row.status === 'Completed') {
        current.completed += 1;
      }
      if (row.status === 'Pending') {
        current.pending += 1;
      }
      if (row.status === 'Accepted' || row.status === 'In Progress') {
        current.inProgress += 1;
      }
      result.set(key, current);
    });
    return result;
  }, [referrals]);

  const unmatchedReferrals = useMemo(
    () =>
      referrals.filter((row) => {
        const target = normalizeText(row?.referred_to || row?.referredTo);
        return (
          target &&
          !referralNetwork.some((partner) => normalizeText(partner.organization) === target)
        );
      }).length,
    [referralNetwork, referrals]
  );

  const filteredPartners = useMemo(() => {
    const term = normalizeText(searchQuery);

    return referralNetwork.filter((partner) => {
      const partnerServices = (partner.services || []).map(normalizeText);
      const matchesSearch =
        !term ||
        normalizeText(partner.organization).includes(term) ||
        normalizeText(partner.coverage).includes(term) ||
        normalizeText(partner.contact).includes(term) ||
        partnerServices.some((service) => service.includes(term));
      const matchesStatus = statusFilter === 'all' || partner.status === statusFilter;
      const matchesType = typeFilter === 'all' || partner.type === typeFilter;
      const matchesService =
        serviceFilter === 'all' || (partner.services || []).includes(serviceFilter);

      return matchesSearch && matchesStatus && matchesType && matchesService;
    });
  }, [referralNetwork, searchQuery, serviceFilter, statusFilter, typeFilter]);

  const currentPage = Math.min(
    page,
    Math.max(Math.ceil(filteredPartners.length / PARTNERS_PER_PAGE) - 1, 0)
  );
  const totalPages = Math.ceil(filteredPartners.length / PARTNERS_PER_PAGE);
  const paginatedPartners = useMemo(() => {
    const startIndex = currentPage * PARTNERS_PER_PAGE;
    return filteredPartners.slice(startIndex, startIndex + PARTNERS_PER_PAGE);
  }, [currentPage, filteredPartners]);

  const selectedPartnerDetails = useMemo(() => {
    if (selectedPartner) {
      return selectedPartner;
    }
    return filteredPartners[0] || null;
  }, [filteredPartners, selectedPartner]);

  const linkedReferrals = useMemo(() => {
    if (!selectedPartnerDetails) {
      return [];
    }
    const key = normalizeText(selectedPartnerDetails.organization);
    return referrals
      .filter((row) => normalizeText(row?.referred_to || row?.referredTo) === key)
      .slice(0, 6);
  }, [referrals, selectedPartnerDetails]);

  const topPartners = useMemo(
    () =>
      [...referralNetwork]
        .sort((left, right) => (right.referrals_made || 0) - (left.referrals_made || 0))
        .slice(0, 4),
    [referralNetwork]
  );

  const handleFormChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    formDialog.onTrue();
  }, [formDialog]);

  const handleOpenEdit = useCallback(
    (partner) => {
      setEditingItem(partner);
      setSelectedPartner(partner);
      setFormData({
        organization: partner.organization || '',
        type: partner.type || '',
        services: Array.isArray(partner.services)
          ? partner.services.join(', ')
          : partner.services || '',
        coverage: partner.coverage || '',
        contact: partner.contact || '',
        status: partner.status || 'Active',
        referrals_made: partner.referrals_made || 0,
      });
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleSubmit = useCallback(async () => {
    if (!formData.organization) {
      toast.error('Organization is required');
      return;
    }

    try {
      const payload = { ...formData };
      if (typeof payload.services === 'string') {
        payload.services = payload.services
          .split(',')
          .map((service) => service.trim())
          .filter(Boolean);
      }
      payload.referrals_made = Number(payload.referrals_made || 0);

      if (editingItem) {
        await axiosInstance.patch(
          `${endpoints.beneficiaries.referral_network}${editingItem.id}/`,
          payload
        );
        toast.success('Partner updated');
      } else {
        await axiosInstance.post(endpoints.beneficiaries.referral_network, payload);
        toast.success('Partner added');
      }

      mutate(endpoints.beneficiaries.referral_network);
      formDialog.onFalse();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    }
  }, [editingItem, formData, formDialog]);

  const handleOpenDelete = useCallback(
    (partner) => {
      setDeleteId(partner.id);
      setSelectedPartner(partner);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await axiosInstance.delete(`${endpoints.beneficiaries.referral_network}${deleteId}/`);
      mutate(endpoints.beneficiaries.referral_network);
      toast.success('Partner deleted');
      confirmDelete.onFalse();
      if (selectedPartner?.id === deleteId) {
        setSelectedPartner(null);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete');
    }
  }, [confirmDelete, deleteId, selectedPartner]);

  const handleStatusToggle = useCallback(async (partner) => {
    const nextStatus = partner.status === 'Active' ? 'Inactive' : 'Active';

    try {
      await axiosInstance.patch(`${endpoints.beneficiaries.referral_network}${partner.id}/`, {
        status: nextStatus,
      });
      mutate(endpoints.beneficiaries.referral_network);
      toast.success(`Partner marked ${nextStatus}`);
      setSelectedPartner((prev) =>
        prev?.id === partner.id ? { ...prev, status: nextStatus } : prev
      );
    } catch (error) {
      toast.error('Failed to update partner status');
    }
  }, []);

  const handleExport = useCallback(() => {
    const csv = buildCsv(filteredPartners);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'referral-network.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }, [filteredPartners]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Referral Network
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage partner coverage, service pathways, and live referral load without removing the
            existing partner CRUD flow.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:download-bold" />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="contained"
            onClick={handleOpenCreate}
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            Add Partner
          </Button>
        </Stack>
      </Stack>

      {(loading || referralsLoading) && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Network Partners"
            value={referralNetwork.length}
            icon="solar:share-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Total Referrals Made"
            value={totalReferralsMade}
            icon="solar:transfer-horizontal-bold"
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Active Partners"
            value={referralNetwork.filter((row) => row.status === 'Active').length}
            icon="solar:check-circle-bold"
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Unmatched Referrals"
            value={unmatchedReferrals}
            icon="solar:danger-triangle-bold"
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Alert severity={unmatchedReferrals > 0 ? 'warning' : 'success'} sx={{ borderRadius: 2 }}>
            {unmatchedReferrals > 0
              ? `${unmatchedReferrals} live referral${unmatchedReferrals > 1 ? 's are' : ' is'} routed to organizations not present in the maintained referral network.`
              : 'All live referrals currently map to known network partners.'}
          </Alert>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={700}>
                Coverage Snapshot
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`${partnerTypes.length} partner types`} variant="outlined" />
                <Chip label={`${serviceOptions.length} mapped services`} variant="outlined" />
                <Chip label={`${referrals.length} live referrals`} color="info" />
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by organization, service, coverage, or contact..."
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
          <Grid size={{ xs: 12, sm: 4, md: 2.666 }}>
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
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 2.666 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Type"
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="all">All Types</MenuItem>
              {partnerTypes.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 2.666 }}>
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
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Grid container spacing={3}>
            {paginatedPartners.map((partner) => {
              const counts = referralCounts.get(normalizeText(partner.organization)) || {
                total: 0,
                open: 0,
                completed: 0,
                pending: 0,
                inProgress: 0,
              };

              return (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={partner.id}>
                  <Card
                    sx={{
                      p: 3,
                      height: '100%',
                      borderRadius: 3,
                      border:
                        selectedPartnerDetails?.id === partner.id
                          ? '1px solid #2563eb'
                          : '1px solid #e5e7eb',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedPartner(partner)}
                  >
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="h6">{partner.organization}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {partner.coverage || 'Coverage not set'}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Chip
                            label={partner.status}
                            size="small"
                            color={partner.status === 'Active' ? 'success' : 'default'}
                          />
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenEdit(partner);
                            }}
                          >
                            <Iconify icon="solar:pen-bold" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenDelete(partner);
                            }}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" />
                          </IconButton>
                        </Stack>
                      </Stack>

                      <Chip
                        label={partner.type || 'Partner'}
                        variant="outlined"
                        size="small"
                        sx={{ alignSelf: 'flex-start' }}
                      />

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Services
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={0.5}
                          flexWrap="wrap"
                          useFlexGap
                          sx={{ mt: 0.5 }}
                        >
                          {(partner.services || []).length ? (
                            (partner.services || []).map((service) => (
                              <Chip key={service} label={service} size="small" variant="outlined" />
                            ))
                          ) : (
                            <Chip label="No services configured" size="small" variant="outlined" />
                          )}
                        </Stack>
                      </Box>

                      <Stack spacing={0.75}>
                        <Typography variant="body2">
                          <Iconify
                            icon="solar:letter-bold"
                            width={16}
                            sx={{ mr: 0.5, verticalAlign: 'text-bottom' }}
                          />
                          {partner.contact || 'Contact not set'}
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          <Iconify
                            icon="solar:transfer-horizontal-bold"
                            width={16}
                            sx={{ mr: 0.5, verticalAlign: 'text-bottom' }}
                          />
                          {partner.referrals_made || 0} recorded referrals
                        </Typography>
                      </Stack>

                      <Divider />

                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip size="small" color="info" label={`${counts.total} linked`} />
                        <Chip size="small" color="warning" label={`${counts.open} open`} />
                        <Chip
                          size="small"
                          color="success"
                          label={`${counts.completed} completed`}
                        />
                      </Stack>
                    </Stack>
                  </Card>
                </Grid>
              );
            })}

            {paginatedPartners.length === 0 && (
              <Grid size={{ xs: 12 }}>
                <Card sx={{ p: 6, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                  <Stack spacing={2} alignItems="center">
                    <Iconify
                      icon="solar:buildings-3-bold-duotone"
                      width={56}
                      sx={{ color: '#94a3b8' }}
                    />
                    <Typography variant="h6">No partners found</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Adjust the filters or add a new network partner.
                    </Typography>
                  </Stack>
                </Card>
              </Grid>
            )}
          </Grid>

          {totalPages > 0 && (
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage + 1}
                onChange={(event, value) => setPage(value - 1)}
                shape="rounded"
                variant="outlined"
              />
            </Stack>
          )}
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Partner Detail
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Select a partner to review routing strength and live referral load.
                    </Typography>
                  </Box>
                  {selectedPartnerDetails?.status && (
                    <Chip
                      label={selectedPartnerDetails.status}
                      color={selectedPartnerDetails.status === 'Active' ? 'success' : 'default'}
                    />
                  )}
                </Stack>

                {!selectedPartnerDetails ? (
                  <Alert severity="info">No partner selected.</Alert>
                ) : (
                  <>
                    <Box>
                      <Typography variant="body1" fontWeight={700}>
                        {selectedPartnerDetails.organization}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedPartnerDetails.type || 'Partner'} •{' '}
                        {selectedPartnerDetails.coverage || 'Coverage not set'}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Contact
                        </Typography>
                        <Typography variant="body2">
                          {selectedPartnerDetails.contact || '-'}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Recorded referrals
                        </Typography>
                        <Typography variant="body2">
                          {selectedPartnerDetails.referrals_made || 0}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Linked live referrals
                        </Typography>
                        <Typography variant="body2">
                          {referralCounts.get(normalizeText(selectedPartnerDetails.organization))
                            ?.total || 0}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Open referrals
                        </Typography>
                        <Typography variant="body2">
                          {referralCounts.get(normalizeText(selectedPartnerDetails.organization))
                            ?.open || 0}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Service coverage
                      </Typography>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        {(selectedPartnerDetails.services || []).length ? (
                          selectedPartnerDetails.services.map((service) => (
                            <Chip key={service} label={service} size="small" variant="outlined" />
                          ))
                        ) : (
                          <Chip label="No services configured" size="small" variant="outlined" />
                        )}
                      </Stack>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Quick actions
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button
                          variant="outlined"
                          onClick={() => handleOpenEdit(selectedPartnerDetails)}
                        >
                          Edit partner
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => handleStatusToggle(selectedPartnerDetails)}
                        >
                          Mark {selectedPartnerDetails.status === 'Active' ? 'Inactive' : 'Active'}
                        </Button>
                      </Stack>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Linked referrals
                      </Typography>
                      <Stack spacing={1.5}>
                        {linkedReferrals.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No live referrals currently linked to this partner.
                          </Typography>
                        ) : (
                          linkedReferrals.map((referral) => (
                            <Box
                              key={referral.id}
                              sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc' }}
                            >
                              <Stack direction="row" justifyContent="space-between" spacing={1}>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight={600}>
                                    {referral.beneficiary_info?.name || 'Beneficiary'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {referral.service || 'Service not set'}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={referral.status || 'Pending'}
                                  size="small"
                                  color={referral.status === 'Completed' ? 'success' : 'info'}
                                />
                              </Stack>
                            </Box>
                          ))
                        )}
                      </Stack>
                    </Box>
                  </>
                )}
              </Stack>
            </Card>

            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700}>
                  Top Partners
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
                    <Chip
                      label={`${partner.referrals_made || 0}`}
                      color="primary"
                      variant="outlined"
                    />
                  </Stack>
                ))}
              </Stack>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={formDialog.value} onClose={formDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Partner' : 'Add Network Partner'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Organization"
              name="organization"
              value={formData.organization}
              onChange={handleFormChange}
              fullWidth
              required
            />
            <TextField
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Services (comma-separated)"
              name="services"
              value={formData.services}
              onChange={handleFormChange}
              fullWidth
              helperText="Example: Legal aid, Health referral, Psychosocial support"
            />
            <TextField
              label="Coverage"
              name="coverage"
              value={formData.coverage}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Contact"
              name="contact"
              value={formData.contact}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Referrals Made"
              name="referrals_made"
              type="number"
              value={formData.referrals_made}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              select
              name="status"
              value={formData.status}
              onChange={handleFormChange}
              fullWidth
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={formDialog.onFalse}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete Partner"
        content="Are you sure you want to delete this partner?"
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
