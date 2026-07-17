'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState, useEffect } from 'react';

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
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import TableRowSkeleton from 'src/components/table/tableRowSkeleton';

import QualityControlPointFormDialog from './quality-control-point-form-dialog';
import {
  truncateText,
  getStatusChipProps,
  normalizeCollection,
  getPriorityChipProps,
  getFrequencyChipProps,
} from './quality-control-point-shared';

const EP = endpoints.storeInventory;
const PM = endpoints.procurement_management;

const FREQUENCY_FILTER_OPTIONS = [
  { value: '', label: 'All Frequencies' },
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Per Batch', label: 'Per Batch' },
];

const PRIORITY_FILTER_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
];

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

const SUMMARY_TONES = {
  slate: { bg: '#e2e8f0', fg: '#0f172a' },
  success: { bg: '#dcfce7', fg: '#166534' },
  warning: { bg: '#fef3c7', fg: '#92400e' },
  error: { bg: '#fee2e2', fg: '#991b1b' },
};

function buildQCPQuery({
  search,
  officeLocation,
  frequency,
  priority,
  isActive,
  page,
  pagination,
}) {
  const params = new URLSearchParams();
  params.set('ordering', '-created_at');

  const q = String(search || '').trim();
  if (q) params.set('search', q);
  if (officeLocation) params.set('office_location', String(officeLocation));
  if (frequency) params.set('frequency', frequency);
  if (priority) params.set('priority', priority);
  if (isActive !== '') params.set('is_active', isActive);

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String(page + 1));
  }

  return `${EP.quality_control_points}?${params.toString()}`;
}

function buildSummaryMetrics(records) {
  return records.reduce(
    (acc, r) => {
      acc.total += 1;
      if (r.is_active) acc.active += 1;
      else acc.inactive += 1;
      const p = String(r.priority || '').toLowerCase();
      if (p === 'critical' || p === 'high') acc.highPriority += 1;
      return acc;
    },
    { total: 0, active: 0, inactive: 0, highPriority: 0 }
  );
}

function MetricCard({ icon, title, value, description, tone = 'slate' }) {
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

function ControlPointRow({ point, serialNumber, onOpenDetails, onEdit, onDelete }) {
  const freqChip = getFrequencyChipProps(point.frequency);
  const prioChip = getPriorityChipProps(point.priority);
  const statusChip = getStatusChipProps(point.is_active);

  return (
    <TableRow
      hover
      onClick={() => onOpenDetails(point.id)}
      sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }}
    >
      <TableCell align="center" sx={{ width: 56 }}>
        <Typography variant="body2" fontWeight={700} color="#64748b">
          {serialNumber}
        </Typography>
      </TableCell>

      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={700} color="#0f172a">
            {point.reference || 'â€”'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {truncateText(point.name, 48)}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell>
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={600} color="#0f172a">
            {point.office_location_name || 'â€”'}
          </Typography>
          {point.office_location_type && (
            <Typography variant="caption" color="text.secondary">
              {point.office_location_type}
            </Typography>
          )}
        </Stack>
      </TableCell>

      <TableCell>
        <Stack spacing={0.25}>
          <Typography variant="body2" color="#0f172a">
            {point.product_name || 'â€”'}
          </Typography>
          {point.product_code && (
            <Typography variant="caption" color="text.secondary">
              {point.product_code}
            </Typography>
          )}
        </Stack>
      </TableCell>

      <TableCell>
        <Typography variant="body2" color="#475569">
          {point.assigned_to_name || 'Unassigned'}
        </Typography>
      </TableCell>

      <TableCell>
        <Chip label={freqChip.label} color={freqChip.color} size="small" variant="soft" />
      </TableCell>

      <TableCell>
        <Chip label={prioChip.label} color={prioChip.color} size="small" variant="soft" />
      </TableCell>

      <TableCell>
        <Chip label={statusChip.label} color={statusChip.color} size="small" variant="soft" />
      </TableCell>

      <TableCell>
        <Typography variant="caption" color="text.secondary">
          {point.created_by_name || 'â€”'}
        </Typography>
      </TableCell>

      <TableCell align="center">
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(point.id);
            }}
          >
            <Iconify icon="solar:eye-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="inherit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(point.id);
            }}
          >
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(point);
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function QualityControlPointsMain() {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState('');
  const [officeFilter, setOfficeFilter] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [activeId, setActiveId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebounce(searchInput, 400);

  const listUrl = useMemo(
    () =>
      buildQCPQuery({
        search: debouncedSearch,
        officeLocation: officeFilter,
        frequency: frequencyFilter,
        priority: priorityFilter,
        isActive: statusFilter,
        page,
        pagination: true,
      }),
    [debouncedSearch, officeFilter, frequencyFilter, priorityFilter, statusFilter, page]
  );

  const summaryUrl = useMemo(
    () =>
      buildQCPQuery({
        search: debouncedSearch,
        officeLocation: officeFilter,
        frequency: frequencyFilter,
        priority: priorityFilter,
        isActive: statusFilter,
        page: 0,
        pagination: false,
      }),
    [debouncedSearch, officeFilter, frequencyFilter, priorityFilter, statusFilter]
  );

  const { data: rawList, loading: listLoading, error: listError } = useGetRequest(listUrl);
  const { data: rawSummary } = useGetRequest(summaryUrl);
  const { data: rawOffices } = useGetRequest(`${PM.office_management}?pagination=false`);

  const rows = useMemo(() => normalizeCollection(rawList), [rawList]);
  const summaryRows = useMemo(() => normalizeCollection(rawSummary), [rawSummary]);
  const officeOptions = useMemo(
    () =>
      [...normalizeCollection(rawOffices)].sort((a, b) =>
        String(a?.name || '').localeCompare(String(b?.name || ''))
      ),
    [rawOffices]
  );

  const summaryMetrics = useMemo(() => buildSummaryMetrics(summaryRows), [summaryRows]);

  const totalPages = Math.max(rawList?.total_pages || 1, 1);
  const rowsPerPage = rawList?.page_size || 10;
  const totalMatches = rawList?.count ?? rows.length;

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(totalPages - 1, 0));
  }, [page, totalPages]);

  const openDetails = (id) =>
    router.push(paths.dashboard.storeInventory.qualityControlPoint_detail(id));
  const openCreateDialog = () => {
    setFormMode('create');
    setActiveId(null);
    setFormOpen(true);
  };
  const openEditDialog = (id) => {
    setFormMode('edit');
    setActiveId(id);
    setFormOpen(true);
  };

  const refreshList = async () => {
    await Promise.all([mutate(listUrl), mutate(summaryUrl), mutate(EP.quality_control_points)]);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteRequest(EP.quality_control_point_by_id(deleteTarget.id));
      toast.success('Quality control point deleted successfully.');
      await refreshList();
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err));
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleFormSuccess = async (record) => {
    await refreshList();
    if (record?.id) await mutate(EP.quality_control_point_by_id(record.id));
    if (formMode === 'create' && record?.id) {
      router.push(paths.dashboard.storeInventory.qualityControlPoint_detail(record.id));
    }
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setOfficeFilter('');
    setFrequencyFilter('');
    setPriorityFilter('');
    setStatusFilter('');
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
            background: 'linear-gradient(135deg, #0c1445 0%, #1e40af 55%, #0891b2 100%)',
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
                label="Store and Inventory"
                sx={{
                  alignSelf: 'flex-start',
                  bgcolor: 'rgba(255,255,255,0.16)',
                  color: '#fff',
                  fontWeight: 700,
                }}
              />
              <Typography variant="h3" fontWeight={800}>
                Quality Control Points
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.84)' }}>
                Manage enforceable inspection rules with warehouse-linked products, assigned
                inspectors, frequency and priority routing.
              </Typography>
            </Stack>
            <Button
              variant="contained"
              color="inherit"
              startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
              onClick={openCreateDialog}
              sx={{ color: 'common.white', fontWeight: 700, '&:hover': { color: 'common.white' } }}
            >
              Add Control Point
            </Button>
          </Stack>
        </Card>

        {/* Metric cards */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              icon="solar:shield-check-bold-duotone"
              title="Total Controls"
              value={summaryMetrics.total}
              description="Matched under the current filters."
              tone="slate"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              icon="solar:check-circle-bold-duotone"
              title="Active"
              value={summaryMetrics.active}
              description="Available for live inspection routing."
              tone="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              icon="solar:danger-triangle-bold-duotone"
              title="High / Critical"
              value={summaryMetrics.highPriority}
              description="Controls with elevated priority level."
              tone="error"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              icon="solar:lock-bold-duotone"
              title="Inactive"
              value={summaryMetrics.inactive}
              description="Paused â€” not used in active routing."
              tone="warning"
            />
          </Grid>
        </Grid>

        {/* List card */}
        <Card sx={{ borderRadius: 4, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {/* Filter bar */}
          <Stack spacing={2} sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search reference, name, criteria, product, or staffâ€¦"
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
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Frequency"
                  value={frequencyFilter}
                  onChange={(e) => {
                    setFrequencyFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  {FREQUENCY_FILTER_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
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
                  label="Priority"
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  {PRIORITY_FILTER_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 1 }}>
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
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleResetFilters}
                  sx={{ height: 40 }}
                >
                  Reset
                </Button>
              </Grid>
            </Grid>

            <Typography variant="body2" color="text.secondary">
              {totalMatches} control point{totalMatches !== 1 ? 's' : ''} matched on the backend.
            </Typography>
          </Stack>

          {listError && (
            <Box sx={{ px: 3, pb: 2 }}>
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                Failed to load quality control points. Please try again.
              </Alert>
            </Box>
          )}

          <TableContainer>
            <Table size={dense ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ width: 56 }}>
                    #
                  </TableCell>
                  <TableCell>Reference / Name</TableCell>
                  <TableCell>Office / Warehouse</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Assigned Staff</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listLoading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRowSkeleton
                      key={`qcp-skeleton-${i}`}
                      columns={[
                        { type: 'text', width: 24, align: 'center' },
                        { type: 'text', lines: 2, width: '80%' },
                        { type: 'text', lines: 2, width: '70%' },
                        { type: 'text', lines: 2, width: '65%' },
                        { type: 'text', width: '60%' },
                        { type: 'rect', width: 70, height: 24 },
                        { type: 'rect', width: 70, height: 24 },
                        { type: 'rect', width: 70, height: 24 },
                        { type: 'text', width: '55%' },
                        { type: 'circle', size: 28, count: 3, align: 'center' },
                      ]}
                    />
                  ))}

                {!listLoading &&
                  rows.map((point, index) => (
                    <ControlPointRow
                      key={point.id}
                      point={point}
                      serialNumber={page * rowsPerPage + index + 1}
                      onOpenDetails={openDetails}
                      onEdit={openEditDialog}
                      onDelete={setDeleteTarget}
                    />
                  ))}

                {!listLoading && !rows.length && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                      <Stack spacing={1} alignItems="center">
                        <Iconify
                          icon="solar:shield-search-bold-duotone"
                          width={32}
                          color="#94a3b8"
                        />
                        <Typography variant="h6" color="#0f172a">
                          No quality control points found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Adjust the search or filters to widen the result set.
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
            sx={{ px: 3, py: 2.5 }}
          >
            <FormControlLabel
              control={<Switch checked={dense} onChange={(e) => setDense(e.target.checked)} />}
              label="Dense rows"
            />
            {totalPages > 1 && (
              <Pagination
                color="primary"
                page={page + 1}
                count={totalPages}
                onChange={(_, v) => setPage(v - 1)}
              />
            )}
          </Stack>
        </Card>
      </Stack>

      <QualityControlPointFormDialog
        open={formOpen}
        mode={formMode}
        qualityControlPointId={formMode === 'edit' ? activeId : null}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Quality Control Point"
        content={`Are you sure you want to delete "${deleteTarget?.name || 'this control point'}"? This action cannot be undone.`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
