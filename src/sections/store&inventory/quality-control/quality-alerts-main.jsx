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
  extractErrorMessage,
  usePatchRequest as patchRequest,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import TableRowSkeleton from 'src/components/table/tableRowSkeleton';

import QualityAlertFormDialog from './quality-alert-form-dialog';
import {
  normalizeText,
  formatDateTime,
  normalizeCollection,
  getAlertStatusChipProps,
  getAlertSeverityChipProps,
  QUALITY_ALERT_STATUS_OPTIONS,
  QUALITY_ALERT_SEVERITY_OPTIONS,
} from './quality-alert-shared';

const EP = endpoints.storeInventory;
const PM = endpoints.procurement_management;

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Status' },
  ...QUALITY_ALERT_STATUS_OPTIONS.map((o) => ({ value: o, label: o })),
];

const SEVERITY_FILTER_OPTIONS = [
  { value: '', label: 'All Severity' },
  ...QUALITY_ALERT_SEVERITY_OPTIONS.map((o) => ({ value: o, label: o })),
];

const SUMMARY_TONES = {
  slate: { bg: '#e2e8f0', fg: '#0f172a' },
  success: { bg: '#dcfce7', fg: '#166534' },
  warning: { bg: '#fef3c7', fg: '#92400e' },
  error: { bg: '#fee2e2', fg: '#991b1b' },
  info: { bg: '#dbeafe', fg: '#1e40af' },
};

function buildAlertQuery({ search, severity, status, officeLocation, page, pagination }) {
  const params = new URLSearchParams();
  params.set('ordering', '-created_at');
  if (search.trim()) params.set('search', search.trim());
  if (severity) params.set('severity', severity);
  if (status) params.set('status', status);
  if (officeLocation) params.set('office_location', String(officeLocation));
  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String(page + 1));
  } else {
    params.set('pagination', 'false');
  }
  return `${EP.quality_alerts}?${params.toString()}`;
}

function buildSummaryMetrics(records) {
  return records.reduce(
    (s, r) => {
      s.total += 1;
      const sev = normalizeText(r.severity);
      const stat = normalizeText(r.status);
      if (sev === 'critical') s.critical += 1;
      if (stat === 'new') s.newAlerts += 1;
      if (stat === 'in progress') s.inProgress += 1;
      if (stat === 'resolved') s.resolved += 1;
      return s;
    },
    { total: 0, critical: 0, newAlerts: 0, inProgress: 0, resolved: 0 }
  );
}

function AlertMetricCard({ icon, title, value, description, tone = 'slate' }) {
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

function AlertRow({ alertItem, serialNumber, onOpenDetails, onEdit, onDelete, onReview }) {
  const severityChip = getAlertSeverityChipProps(alertItem.severity);
  const statusChip = getAlertStatusChipProps(alertItem.status);
  const isActionable = ['new', 'in progress'].includes(normalizeText(alertItem.status));

  return (
    <TableRow
      hover
      onClick={() => onOpenDetails(alertItem.id)}
      sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#fff7ed' } }}
    >
      <TableCell align="center" sx={{ width: 56 }}>
        <Typography variant="body2" fontWeight={700} color="#64748b">
          {serialNumber}
        </Typography>
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={700} color="#0f172a">
            {alertItem.reference || 'Unnumbered'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {alertItem.title || 'No title'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Stack spacing={0}>
          <Typography variant="body2" fontWeight={600} color="#0f172a">
            {alertItem.office_location_name || '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {alertItem.product_name || 'No product linked'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Stack spacing={0}>
          <Typography variant="body2" color="#475569">
            {alertItem.reported_by_name || '—'}
          </Typography>
          {alertItem.assigned_to_name && (
            <Typography variant="caption" color="text.secondary">
              Assigned: {alertItem.assigned_to_name}
            </Typography>
          )}
        </Stack>
      </TableCell>
      <TableCell align="center">
        <Chip size="small" color={severityChip.color} label={severityChip.label} variant="soft" />
      </TableCell>
      <TableCell align="center">
        <Chip size="small" color={statusChip.color} label={statusChip.label} variant="soft" />
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#475569">
          {formatDateTime(alertItem.created_at)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
          {isActionable && (
            <Button
              size="small"
              variant="contained"
              color="warning"
              startIcon={<Iconify icon="solar:bell-bold" width={15} />}
              onClick={(event) => {
                event.stopPropagation();
                onReview(alertItem);
              }}
              sx={{ fontSize: 11, px: 1.2, py: 0.4, minWidth: 0, fontWeight: 700 }}
            >
              Review
            </Button>
          )}
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(alertItem.id);
            }}
          >
            <Iconify icon="solar:eye-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="inherit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(alertItem.id);
            }}
          >
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(alertItem);
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function QualityAlertsMain() {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [officeFilter, setOfficeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [processing, setProcessing] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [activeId, setActiveId] = useState(null);

  const debouncedSearch = useDebounce(searchInput, 400);

  const listUrl = useMemo(
    () =>
      buildAlertQuery({
        search: debouncedSearch,
        severity: severityFilter,
        status: statusFilter,
        officeLocation: officeFilter,
        page,
        pagination: true,
      }),
    [debouncedSearch, severityFilter, statusFilter, officeFilter, page]
  );

  const summaryUrl = useMemo(
    () =>
      buildAlertQuery({
        search: debouncedSearch,
        severity: severityFilter,
        status: statusFilter,
        officeLocation: officeFilter,
        page,
        pagination: false,
      }),
    [debouncedSearch, severityFilter, statusFilter, officeFilter, page]
  );

  const {
    data: rawAlertList,
    loading: alertListLoading,
    error: alertListError,
  } = useGetRequest(listUrl);
  const { data: rawAlertSummary } = useGetRequest(summaryUrl);
  const { data: rawOffices } = useGetRequest(`${PM.office_management}?pagination=false`);

  const rows = useMemo(() => normalizeCollection(rawAlertList), [rawAlertList]);
  const summaryRows = useMemo(() => normalizeCollection(rawAlertSummary), [rawAlertSummary]);

  const officeOptions = useMemo(() => {
    const all = normalizeCollection(rawOffices);
    return [...all].sort((a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' })
    );
  }, [rawOffices]);

  const summaryMetrics = useMemo(() => buildSummaryMetrics(summaryRows), [summaryRows]);

  const totalPages = Math.max(rawAlertList?.total_pages || 1, 1);
  const rowsPerPage = rawAlertList?.page_size || 10;
  const totalMatches = rawAlertList?.count ?? rows.length;
  const filtersApplied = Boolean(
    searchInput.trim() || severityFilter || statusFilter || officeFilter
  );

  const openDetails = (alertId) =>
    router.push(paths.dashboard.storeInventory.qualityAlert_detail(alertId));

  const openCreateDialog = () => {
    setFormMode('create');
    setActiveId(null);
    setFormOpen(true);
  };

  const openEditDialog = (alertId) => {
    setFormMode('edit');
    setActiveId(alertId);
    setFormOpen(true);
  };

  const refreshListData = async () => {
    await Promise.all([mutate(listUrl), mutate(summaryUrl), mutate(EP.quality_alerts)]);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteRequest(EP.quality_alert_by_id(deleteTarget.id));
      toast.success('Quality alert deleted.');
      await refreshListData();
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err));
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!reviewTarget?.id) return;
    setProcessing(newStatus);
    try {
      await patchRequest(EP.quality_alert_by_id(reviewTarget.id), { status: newStatus });
      toast.success(`${reviewTarget.reference || 'Alert'} marked as "${newStatus}".`);
      await refreshListData();
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err));
    } finally {
      setProcessing(null);
      setReviewTarget(null);
    }
  };

  const handleFormSuccess = async (record) => {
    await refreshListData();
    if (record?.id) await mutate(EP.quality_alert_by_id(record.id));
    if (formMode === 'create' && record?.id)
      router.push(paths.dashboard.storeInventory.qualityAlert_detail(record.id));
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSeverityFilter('');
    setStatusFilter('');
    setOfficeFilter('');
    setPage(0);
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Card
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            color: '#fff',
            background: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 55%, #f59e0b 100%)',
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
                Quality Alerts Desk
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.88)' }}>
                Triage incidents, assign ownership, track escalation, and close corrective actions
                across all warehouses and offices.
              </Typography>
            </Stack>

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
              Raise Alert
            </Button>
          </Stack>
        </Card>

        {/* Metric cards */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <AlertMetricCard
              icon="solar:danger-triangle-bold-duotone"
              title="Total Alerts"
              value={summaryMetrics.total}
              description="Matched under the current filters."
              tone="slate"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <AlertMetricCard
              icon="solar:fire-bold-duotone"
              title="Critical"
              value={summaryMetrics.critical}
              description="Immediate action required."
              tone="error"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <AlertMetricCard
              icon="solar:clock-circle-bold-duotone"
              title="In Progress"
              value={summaryMetrics.inProgress}
              description="Actively being investigated."
              tone="info"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <AlertMetricCard
              icon="solar:check-circle-bold-duotone"
              title="Resolved"
              value={summaryMetrics.resolved}
              description="Closed with corrective action."
              tone="success"
            />
          </Grid>
        </Grid>

        {/* Table card */}
        <Card sx={{ borderRadius: 4, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Stack spacing={2.5} sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search reference, title, product, reporter..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
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
                  label="Severity"
                  value={severityFilter}
                  onChange={(e) => {
                    setSeverityFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  {SEVERITY_FILTER_OPTIONS.map((o) => (
                    <MenuItem key={o.value || 'all-sev'} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  {STATUS_FILTER_OPTIONS.map((o) => (
                    <MenuItem key={o.value || 'all-stat'} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Office / Warehouse"
                  value={officeFilter}
                  onChange={(e) => {
                    setOfficeFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All Locations</MenuItem>
                  {officeOptions.map((o) => (
                    <MenuItem key={o.id} value={String(o.id)}>
                      {o.name || 'Unnamed'}
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
                {totalMatches} alert{totalMatches !== 1 ? 's' : ''} matched on the server.
              </Typography>
              {filtersApplied && (
                <Button variant="text" color="inherit" onClick={handleResetFilters}>
                  Reset filters
                </Button>
              )}
            </Stack>

            {alertListError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                Failed to load quality alerts. Please refresh and try again.
              </Alert>
            )}
          </Stack>

          <TableContainer>
            <Table size={dense ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fff7ed' }}>
                  <TableCell align="center" sx={{ width: 56, fontWeight: 700 }}>
                    SL
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Reference / Title</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Office / Product</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Reporter / Assigned</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Severity
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Logged At</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alertListLoading
                  ? Array.from({ length: 5 }, (_, i) => (
                      <TableRowSkeleton
                        key={i}
                        columns={[
                          { type: 'text', width: 20, align: 'center' },
                          { type: 'text', width: 140, lines: 2 },
                          { type: 'text', width: 130, lines: 2 },
                          { type: 'text', width: 120, lines: 2 },
                          { type: 'rect', width: 80, height: 24, align: 'center' },
                          { type: 'rect', width: 80, height: 24, align: 'center' },
                          { type: 'text', width: 110 },
                          { type: 'circle', count: 3, size: 30, align: 'center' },
                        ]}
                      />
                    ))
                  : rows.map((alertItem, index) => (
                      <AlertRow
                        key={alertItem.id}
                        alertItem={alertItem}
                        serialNumber={page * rowsPerPage + index + 1}
                        onOpenDetails={openDetails}
                        onEdit={openEditDialog}
                        onDelete={(t) => setDeleteTarget(t)}
                        onReview={(t) => setReviewTarget(t)}
                      />
                    ))}
                {!alertListLoading && !rows.length && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Stack alignItems="center" spacing={2}>
                        <Iconify
                          icon="solar:bell-off-bold-duotone"
                          width={56}
                          sx={{ color: '#cbd5e1' }}
                        />
                        <Typography variant="body1" fontWeight={600} color="#64748b">
                          {filtersApplied
                            ? 'No alerts match the current filters.'
                            : 'No quality alerts raised yet.'}
                        </Typography>
                        {!filtersApplied && (
                          <Button
                            variant="contained"
                            startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
                            onClick={openCreateDialog}
                          >
                            Raise First Alert
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Bottom bar: Dense + Pagination */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 3, py: 2, borderTop: '1px solid #e5e7eb' }}
          >
            <FormControlLabel
              control={
                <Switch checked={dense} onChange={(e) => setDense(e.target.checked)} size="small" />
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
                onChange={(_, v) => setPage(v - 1)}
                color="primary"
                shape="rounded"
              />
            )}
          </Stack>
        </Card>

        {/* Review dialog */}
        <ConfirmDialog
          open={Boolean(reviewTarget)}
          onClose={() => {
            if (!processing) setReviewTarget(null);
          }}
          title="Review Quality Alert"
          content={
            <Stack spacing={2.5}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#fff7ed',
                  border: '1px solid #fed7aa',
                }}
              >
                <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ mb: 1.5 }}>
                  Alert Overview
                </Typography>
                <Grid container spacing={1.5}>
                  {[
                    { label: 'Reference', value: reviewTarget?.reference },
                    { label: 'Title', value: reviewTarget?.title },
                    { label: 'Severity', value: reviewTarget?.severity },
                    { label: 'Current Status', value: reviewTarget?.status },
                    { label: 'Office / Warehouse', value: reviewTarget?.office_location_name },
                    { label: 'Product', value: reviewTarget?.product_name },
                    { label: 'Reporter', value: reviewTarget?.reported_by_name },
                    { label: 'Assigned To', value: reviewTarget?.assigned_to_name },
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
                Choose <strong>In Progress</strong> to start the investigation or{' '}
                <strong>Resolve</strong> to close this alert with the corrective action on record.
              </Typography>
            </Stack>
          }
          action={
            <Stack direction="row" spacing={1.5}>
              {normalizeText(reviewTarget?.status) === 'new' && (
                <Button
                  variant="outlined"
                  color="info"
                  disabled={Boolean(processing)}
                  onClick={() => handleStatusChange('In Progress')}
                  startIcon={<Iconify icon="solar:play-circle-bold" />}
                >
                  {processing === 'In Progress' ? 'Updating...' : 'In Progress'}
                </Button>
              )}
              <Button
                variant="contained"
                color="success"
                disabled={Boolean(processing)}
                onClick={() => handleStatusChange('Resolved')}
                startIcon={<Iconify icon="solar:check-circle-bold" />}
              >
                {processing === 'Resolved' ? 'Resolving...' : 'Resolve'}
              </Button>
            </Stack>
          }
        />

        {/* Delete dialog */}
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="Delete Quality Alert"
          content={`Are you sure you want to delete ${deleteTarget?.reference || 'this alert'}? This action cannot be undone.`}
          action={
            <Button variant="contained" color="error" onClick={handleDelete}>
              Delete
            </Button>
          }
        />

        <QualityAlertFormDialog
          open={formOpen}
          mode={formMode}
          alertId={formMode === 'edit' ? activeId : null}
          onClose={() => setFormOpen(false)}
          onSuccess={handleFormSuccess}
        />
      </Stack>
    </Box>
  );
}
