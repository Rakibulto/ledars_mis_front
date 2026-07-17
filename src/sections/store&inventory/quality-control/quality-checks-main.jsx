'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Table,
  Button,
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
  InputAdornment,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useDebounce } from 'src/hooks/use-debounce';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePatchRequest,
  extractErrorMessage,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import TableRowSkeleton from 'src/components/table/tableRowSkeleton';

import QualityCheckFormDialog from './quality-check-form-dialog';
import {
  formatDate,
  normalizeStatus,
  getStatusChipProps,
  getResultChipProps,
  normalizeCollection,
  getPriorityChipProps,
  QUALITY_TYPE_OPTIONS,
  QUALITY_STATUS_OPTIONS,
} from './quality-check-shared';

const EP = endpoints.storeInventory;
const PM = endpoints.procurement_management;

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Status' },
  ...QUALITY_STATUS_OPTIONS.map((option) => ({ value: option, label: option })),
];

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All Check Types' },
  ...QUALITY_TYPE_OPTIONS.map((option) => ({ value: option, label: option })),
];

const SUMMARY_TONES = {
  slate: { bg: '#e2e8f0', fg: '#0f172a' },
  success: { bg: '#dcfce7', fg: '#166534' },
  warning: { bg: '#fef3c7', fg: '#92400e' },
  error: { bg: '#fee2e2', fg: '#991b1b' },
};

function buildQualityCheckQuery({ search, status, checkType, officeLocation, page, pagination }) {
  const params = new URLSearchParams();

  params.set('ordering', '-date');

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (status) {
    params.set('status', status);
  }

  if (checkType) {
    params.set('check_type', checkType);
  }

  if (officeLocation) {
    params.set('office_location', String(officeLocation));
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String(page + 1));
  }

  return `${EP.quality_checks}?${params.toString()}`;
}

function buildSummaryMetrics(records) {
  return records.reduce(
    (summary, record) => {
      summary.total += 1;

      switch (normalizeStatus(record.status)) {
        case 'pass':
          summary.passed += 1;
          break;
        case 'conditional pass':
          summary.conditional += 1;
          break;
        case 'fail':
          summary.failed += 1;
          break;
        default:
          summary.pending += 1;
          break;
      }

      return summary;
    },
    { total: 0, passed: 0, conditional: 0, failed: 0, pending: 0 }
  );
}

function QualityMetricCard({ icon, title, value, description, tone = 'slate' }) {
  const colors = SUMMARY_TONES[tone] || SUMMARY_TONES.slate;

  return (
    <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2.5,
            bgcolor: colors.bg,
            color: colors.fg,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Iconify icon={icon} width={28} />
        </Box>

        <Box>
          <Typography variant="overline" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} color="#0f172a">
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

function QualityCheckRow({ check, serialNumber, onOpenDetails, onEdit, onDelete, onReview }) {
  const statusChip = getStatusChipProps(check.status);
  const resultChip = getResultChipProps(check.result);
  const priorityChip = getPriorityChipProps(check.priority);
  const isPending = normalizeStatus(check.status) === 'pending';

  return (
    <TableRow
      hover
      onClick={() => onOpenDetails(check.id)}
      sx={{
        cursor: 'pointer',
        '&:hover': { bgcolor: '#f8fafc' },
      }}
    >
      <TableCell align="center" sx={{ width: 56 }}>
        <Typography variant="body2" fontWeight={700} color="#64748b">
          {serialNumber}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={700} color="#0f172a">
          {check.reference || 'Unnumbered'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={600} color="#0f172a">
          {check.office_location_name || check.warehouse_name || '—'}
        </Typography>
      </TableCell>
      <TableCell>
        <Stack spacing={0}>
          <Typography variant="body2" fontWeight={600} color="#0f172a">
            {check.product_name || '—'}
          </Typography>
          {check.product_code && (
            <Typography variant="caption" color="text.secondary">
              {check.product_code}
            </Typography>
          )}
        </Stack>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#475569">
          {check.inspector || '—'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#475569">
          {formatDate(check.date)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Chip size="small" color={statusChip.color} label={statusChip.label} variant="soft" />
      </TableCell>
      <TableCell align="center">
        {check.result ? (
          <Chip size="small" color={resultChip.color} label={resultChip.label} variant="soft" />
        ) : (
          <Typography variant="caption" color="text.secondary">
            —
          </Typography>
        )}
      </TableCell>
      <TableCell align="center">
        <Chip size="small" color={priorityChip.color} label={priorityChip.label} variant="soft" />
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#475569">
          {check.created_by_name || '—'}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
          {isPending && (
            <Button
              size="small"
              variant="contained"
              color="warning"
              startIcon={<Iconify icon="solar:shield-check-bold" width={15} />}
              onClick={(event) => {
                event.stopPropagation();
                onReview(check);
              }}
              sx={{ fontSize: 11, px: 1.2, py: 0.4, minWidth: 0, fontWeight: 700 }}
            >
              Review
            </Button>
          )}
          <IconButton
            size="small"
            color="primary"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetails(check.id);
            }}
          >
            <Iconify icon="solar:eye-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="inherit"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(check.id);
            }}
          >
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(check);
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function QualityChecksMain() {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [checkTypeFilter, setCheckTypeFilter] = useState('');
  const [officeLocationFilter, setOfficeLocationFilter] = useState('');
  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [approving, setApproving] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [activeId, setActiveId] = useState(null);

  const debouncedSearch = useDebounce(searchInput, 400);

  const listUrl = useMemo(
    () =>
      buildQualityCheckQuery({
        search: debouncedSearch,
        status: statusFilter,
        checkType: checkTypeFilter,
        officeLocation: officeLocationFilter,
        page,
        pagination: true,
      }),
    [debouncedSearch, statusFilter, checkTypeFilter, officeLocationFilter, page]
  );

  const summaryUrl = useMemo(
    () =>
      buildQualityCheckQuery({
        search: debouncedSearch,
        status: statusFilter,
        checkType: checkTypeFilter,
        officeLocation: officeLocationFilter,
        page,
        pagination: false,
      }),
    [debouncedSearch, statusFilter, checkTypeFilter, officeLocationFilter, page]
  );

  const {
    data: rawQualityList,
    loading: qualityListLoading,
    error: qualityListError,
  } = useGetRequest(listUrl);
  const { data: rawQualitySummary } = useGetRequest(summaryUrl);
  const { data: rawOffices } = useGetRequest(`${PM.office_management}?pagination=false`);

  const rows = useMemo(() => normalizeCollection(rawQualityList), [rawQualityList]);
  const summaryRows = useMemo(() => normalizeCollection(rawQualitySummary), [rawQualitySummary]);

  const officeOptions = useMemo(() => {
    const all = normalizeCollection(rawOffices);
    return [...all].sort((a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' })
    );
  }, [rawOffices]);

  const summaryMetrics = useMemo(() => buildSummaryMetrics(summaryRows), [summaryRows]);

  const totalPages = Math.max(rawQualityList?.total_pages || 1, 1);
  const rowsPerPage = rawQualityList?.page_size || 10;
  const totalMatches = rawQualityList?.count ?? rows.length;
  const filtersApplied = Boolean(
    searchInput.trim() || statusFilter || checkTypeFilter || officeLocationFilter
  );

  const openDetails = (qualityCheckId) => {
    router.push(paths.dashboard.storeInventory.qualityCheck_detail(qualityCheckId));
  };

  const openCreateDialog = () => {
    setFormMode('create');
    setActiveId(null);
    setFormOpen(true);
  };

  const openEditDialog = (qualityCheckId) => {
    setFormMode('edit');
    setActiveId(qualityCheckId);
    setFormOpen(true);
  };

  const refreshListData = async () => {
    await Promise.all([mutate(listUrl), mutate(summaryUrl), mutate(EP.quality_checks)]);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) {
      return;
    }

    try {
      await deleteRequest(EP.quality_check_by_id(deleteTarget.id));
      toast.success('Quality check deleted successfully.');
      await refreshListData();
    } catch (deleteError) {
      toast.error(extractErrorMessage(deleteError?.response?.data || deleteError));
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleApprove = async () => {
    if (!reviewTarget?.id) return;
    setApproving(true);
    try {
      await usePatchRequest(EP.quality_check_by_id(reviewTarget.id), { status: 'Approved' });
      toast.success(`${reviewTarget.reference || 'Quality check'} approved successfully.`);
      await refreshListData();
    } catch (approveError) {
      toast.error(extractErrorMessage(approveError?.response?.data || approveError));
    } finally {
      setApproving(false);
      setReviewTarget(null);
    }
  };

  const handleDecline = async () => {
    if (!reviewTarget?.id) return;
    setDeclining(true);
    try {
      await usePatchRequest(EP.quality_check_by_id(reviewTarget.id), { status: 'Declined' });
      toast.success(`${reviewTarget.reference || 'Quality check'} declined.`);
      await refreshListData();
    } catch (declineError) {
      toast.error(extractErrorMessage(declineError?.response?.data || declineError));
    } finally {
      setDeclining(false);
      setReviewTarget(null);
    }
  };

  const handleFormSuccess = async (record) => {
    await refreshListData();
    if (record?.id) {
      await mutate(EP.quality_check_by_id(record.id));
    }
    if (formMode === 'create' && record?.id) {
      router.push(paths.dashboard.storeInventory.qualityCheck_detail(record.id));
    }
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setStatusFilter('');
    setCheckTypeFilter('');
    setOfficeLocationFilter('');
    setPage(0);
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        <Card
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            color: '#fff',
            background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            spacing={3}
            alignItems={{ md: 'center' }}
          >
            <Stack spacing={1.5} sx={{ maxWidth: 760 }}>
              <Chip
                label="Store & Inventory"
                sx={{
                  alignSelf: 'flex-start',
                  bgcolor: 'rgba(255,255,255,0.16)',
                  color: '#fff',
                  fontWeight: 700,
                }}
              />
              <Typography variant="h3" fontWeight={800}>
                Quality Control Desk
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.84)' }}>
                Inspect office and warehouse stock, track results, and manage corrective actions.
              </Typography>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="contained"
                color="inherit"
                startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
                onClick={openCreateDialog}
                sx={{
                  color: 'common.white',
                  fontWeight: 700,
                  '&:hover': { color: 'common.white' },
                  '&.Mui-disabled': { color: 'common.white' },
                }}
              >
                Add Quality Check
              </Button>
            </Stack>
          </Stack>
        </Card>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <QualityMetricCard
              icon="solar:clipboard-check-bold-duotone"
              title="Total Checks"
              value={summaryMetrics.total}
              description="Matched under the current filters."
              tone="slate"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <QualityMetricCard
              icon="solar:check-circle-bold-duotone"
              title="Release Ready"
              value={summaryMetrics.passed + summaryMetrics.conditional}
              description="Passed + conditional-pass checks."
              tone="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <QualityMetricCard
              icon="solar:clock-circle-bold-duotone"
              title="Pending"
              value={summaryMetrics.pending}
              description="Awaiting final disposition."
              tone="warning"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <QualityMetricCard
              icon="solar:danger-triangle-bold-duotone"
              title="Failed"
              value={summaryMetrics.failed}
              description="Stock blocked pending corrective action."
              tone="error"
            />
          </Grid>
        </Grid>

        <Card sx={{ borderRadius: 4, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Stack spacing={2.5} sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search reference, product, office, or inspector…"
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                    setPage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="solar:magnifer-bold-duotone" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Status"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPage(0);
                  }}
                >
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <MenuItem key={option.value || 'all-status'} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Check Type"
                  value={checkTypeFilter}
                  onChange={(event) => {
                    setCheckTypeFilter(event.target.value);
                    setPage(0);
                  }}
                >
                  {TYPE_FILTER_OPTIONS.map((option) => (
                    <MenuItem key={option.value || 'all-types'} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Office / Warehouse"
                  value={officeLocationFilter}
                  onChange={(event) => {
                    setOfficeLocationFilter(event.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All Locations</MenuItem>
                  {officeOptions.map((office) => (
                    <MenuItem key={office.id} value={String(office.id)}>
                      {office.name || 'Unnamed location'}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              spacing={2}
            >
              <Typography variant="body2" color="text.secondary">
                {totalMatches} quality check{totalMatches !== 1 ? 's' : ''} matched on the server.
              </Typography>

              <Stack direction="row" spacing={1.5} alignItems="center">
                {filtersApplied && (
                  <Button variant="text" color="inherit" onClick={handleResetFilters}>
                    Reset filters
                  </Button>
                )}
              </Stack>
            </Stack>

            {qualityListError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                Failed to load quality checks. Please refresh the page and try again.
              </Alert>
            )}
          </Stack>

          <TableContainer>
            <Table size={dense ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#eff6ff' }}>
                  <TableCell align="center" sx={{ width: 56, fontWeight: 700 }}>
                    SL
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Office / Warehouse</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Inspector</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Inspection Date</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Status
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Result
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Priority
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Created By</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {qualityListLoading
                  ? Array.from({ length: 5 }, (_, index) => (
                      <TableRowSkeleton
                        key={index}
                        columns={[
                          { type: 'text', width: 20, align: 'center' },
                          { type: 'text', width: 120 },
                          { type: 'text', width: 140 },
                          { type: 'text', width: 140, lines: 2 },
                          { type: 'text', width: 100 },
                          { type: 'text', width: 100 },
                          { type: 'rect', width: 80, height: 24, align: 'center' },
                          { type: 'rect', width: 80, height: 24, align: 'center' },
                          { type: 'rect', width: 70, height: 24, align: 'center' },
                          { type: 'text', width: 100 },
                          { type: 'circle', count: 3, size: 30, align: 'center' },
                        ]}
                      />
                    ))
                  : rows.map((check, index) => (
                      <QualityCheckRow
                        key={check.id}
                        check={check}
                        serialNumber={page * rowsPerPage + index + 1}
                        onOpenDetails={openDetails}
                        onEdit={openEditDialog}
                        onDelete={(target) => setDeleteTarget(target)}
                        onReview={(target) => setReviewTarget(target)}
                      />
                    ))}

                {!qualityListLoading && !rows.length && (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 8 }}>
                      <Stack alignItems="center" spacing={2}>
                        <Iconify
                          icon="solar:clipboard-remove-bold-duotone"
                          width={56}
                          sx={{ color: '#cbd5e1' }}
                        />
                        <Typography variant="body1" fontWeight={600} color="#64748b">
                          {filtersApplied
                            ? 'No quality checks match the current filters.'
                            : 'No quality checks recorded yet.'}
                        </Typography>
                        {!filtersApplied && (
                          <Button
                            variant="contained"
                            startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
                            onClick={openCreateDialog}
                          >
                            Add First Check
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 3, py: 2, borderTop: '1px solid #e5e7eb' }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={dense}
                  onChange={(event) => setDense(event.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  Dense
                </Typography>
              }
              sx={{ m: 0 }}
            />
            {totalPages > 1 && (
              <Pagination
                count={totalPages}
                page={page + 1}
                onChange={(_, value) => setPage(value - 1)}
                color="primary"
                shape="rounded"
              />
            )}
          </Stack>
        </Card>

        <ConfirmDialog
          open={Boolean(reviewTarget)}
          onClose={() => setReviewTarget(null)}
          title="Review Quality Check"
          content={
            <Stack spacing={2.5}>
              {/* Overview */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ mb: 1.5 }}>
                  Inspection Overview
                </Typography>
                <Grid container spacing={1.5}>
                  {[
                    { label: 'Reference', value: reviewTarget?.reference },
                    { label: 'Check Type', value: reviewTarget?.check_type },
                    {
                      label: 'Office / Warehouse',
                      value: reviewTarget?.office_location_name || reviewTarget?.warehouse_name,
                    },
                    { label: 'Product', value: reviewTarget?.product_name },
                    { label: 'Inspector', value: reviewTarget?.inspector },
                    { label: 'Inspection Date', value: formatDate(reviewTarget?.date) },
                    { label: 'Priority', value: reviewTarget?.priority },
                    { label: 'Result', value: reviewTarget?.result || '—' },
                  ].map(({ label, value }) => (
                    <Grid key={label} size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        {label}
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="#0f172a">
                        {value || '—'}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Divider />

              <Typography variant="body2" color="text.secondary">
                Choose <strong>Confirm</strong> to approve this inspection, or{' '}
                <strong>Decline</strong> to reject it. The status will be updated immediately.
              </Typography>
            </Stack>
          }
          action={
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                color="error"
                disabled={declining || approving}
                onClick={handleDecline}
                startIcon={<Iconify icon="solar:close-circle-bold" />}
              >
                {declining ? 'Declining…' : 'Decline'}
              </Button>
              <Button
                variant="contained"
                color="success"
                disabled={approving || declining}
                onClick={handleApprove}
                startIcon={<Iconify icon="solar:check-circle-bold" />}
              >
                {approving ? 'Approving…' : 'Confirm'}
              </Button>
            </Stack>
          }
        />

        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="Delete Quality Check"
          content={`Are you sure you want to delete ${deleteTarget?.reference || 'this quality check'}? This action cannot be undone.`}
          action={
            <Button variant="contained" color="error" onClick={handleDelete}>
              Delete
            </Button>
          }
        />

        <QualityCheckFormDialog
          open={formOpen}
          mode={formMode}
          qualityCheckId={formMode === 'edit' ? activeId : null}
          onClose={() => setFormOpen(false)}
          onSuccess={handleFormSuccess}
        />
      </Stack>
    </Box>
  );
}
