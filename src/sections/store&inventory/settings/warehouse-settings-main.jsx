'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Table,
  Alert,
  Button,
  Dialog,
  Divider,
  MenuItem,
  TableRow,
  Tooltip,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  Pagination,
  Typography,
  Autocomplete,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  TableContainer,
  CircularProgress,
  LinearProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  usePutRequest as putRequest,
  useCreateRequest as createRequest,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import TableRowSkeleton from 'src/components/table/tableRowSkeleton';

// ─── constants ────────────────────────────────────────────────────────────────

const EP = endpoints.procurement_management;
const SI = endpoints.storeInventory;

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'closed', label: 'Closed' },
];

const ORDER_OPTIONS = [
  { value: '-id', label: 'Newest First' },
  { value: 'id', label: 'Oldest First' },
  { value: 'name', label: 'Name A–Z' },
  { value: '-name', label: 'Name Z–A' },
];

const DIVISION_OPTIONS = [
  { value: '', label: 'All Divisions' },
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
].map((d) => (typeof d === 'string' ? { value: d, label: d } : d));

const EMPTY_FORM = {
  name: '',
  code: '',
  district: '',
  division: '',
  address: '',
  phone: '',
  email: '',
  status: 'active',
  headOfOffice: '',
  budgetAllocation: '',
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function getStatusChip(status) {
  const map = {
    active: { label: 'Active', color: 'success' },
    inactive: { label: 'Inactive', color: 'default' },
    closed: { label: 'Closed', color: 'error' },
  };
  const cfg = map[String(status || '').toLowerCase()] || {
    label: status || 'Unknown',
    color: 'default',
  };
  return (
    <Chip
      label={cfg.label}
      color={cfg.color}
      size="small"
      variant="soft"
      sx={{ fontWeight: 700 }}
    />
  );
}

function formatBudget(value) {
  const n = Number(value || 0);
  if (n === 0) return '—';
  return `৳${n.toLocaleString('en-BD')}`;
}

// ─── row ──────────────────────────────────────────────────────────────────────

function WarehouseRow({ row, serial, onView, onEdit, onDelete, checkingStock }) {
  return (
    <TableRow
      hover
      onClick={() => onView(row.id)}
      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
    >
      <TableCell align="center" sx={{ width: 52 }}>
        <Typography variant="body2" fontWeight={700} color="text.secondary">
          {serial}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {row.office_id || '—'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {row.name || 'Unnamed'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.code || 'No code'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {row.district || '—'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.division || ''}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {row.headOfOffice || 'Unassigned'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.phone || ''}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2" color="text.secondary">
          {row.staffCount ?? 0}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" color="text.secondary">
          {formatBudget(row.budgetAllocation)}
        </Typography>
      </TableCell>
      <TableCell align="center">{getStatusChip(row.status)}</TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <Tooltip title="View Details">
            <IconButton
              size="small"
              color="info"
              onClick={(e) => {
                e.stopPropagation();
                onView(row.id);
              }}
            >
              <Iconify icon="solar:eye-bold" width={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row);
              }}
            >
              <Iconify icon="solar:pen-bold" width={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              disabled={checkingStock}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row);
              }}
            >
              {checkingStock ? (
                <CircularProgress size={16} color="error" />
              ) : (
                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

// ─── form dialog ──────────────────────────────────────────────────────────────

function WarehouseFormDialog({ open, editing, form, onChange, onClose, onSubmit, submitting }) {
  const { data: rawOffices, isLoading: officesLoading } = useGetRequest(
    `${EP.office_management}?pagination=false`
  );
  const officeOptions = useMemo(() => {
    const list = Array.isArray(rawOffices) ? rawOffices : rawOffices?.results || [];
    return list.map((o) => ({ id: o.id, label: o.name, type: o.type }));
  }, [rawOffices]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {editing ? 'Edit Warehouse' : 'Add Warehouse'}
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Grid container spacing={2}>
          {/* readonly type badge */}
          <Grid size={{ xs: 12 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Type (auto):
              </Typography>
              <Chip
                label="warehouse"
                color="primary"
                size="small"
                variant="soft"
                sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}
              />
              <Typography variant="caption" color="text.secondary">
                Read-only — always sent as &quot;warehouse&quot;
              </Typography>
            </Stack>
          </Grid>

          {[
            { key: 'name', label: 'Warehouse Name', required: true, xs: 12 },
            { key: 'code', label: 'Short Code (e.g. DHK)', required: true },
            { key: 'district', label: 'District' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'budgetAllocation', label: 'Budget Allocation (৳)', type: 'number' },
            { key: 'address', label: 'Full Address', multiline: true, rows: 2, xs: 12 },
          ].map((field) => (
            <Grid key={field.key} size={{ xs: 12, sm: field.xs === 12 ? 12 : 6 }}>
              <TextField
                fullWidth
                size="small"
                label={field.label}
                value={form[field.key] ?? ''}
                type={field.type || 'text'}
                multiline={!!field.multiline}
                rows={field.rows}
                required={!!field.required}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            </Grid>
          ))}

          {/* Head of Warehouse — office/warehouse dropdown */}
          <Grid size={{ xs: 12 }}>
            <Autocomplete
              fullWidth
              size="small"
              options={officeOptions}
              loading={officesLoading}
              groupBy={(option) => (option.type === 'warehouse' ? 'Warehouses' : 'Offices')}
              value={officeOptions.find((o) => o.label === form.headOfOffice) || null}
              onChange={(_, selected) => onChange('headOfOffice', selected ? selected.label : '')}
              getOptionLabel={(option) => option.label || ''}
              isOptionEqualToValue={(option, value) => option.label === value.label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Head of Warehouse"
                  placeholder="Select an office or warehouse"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {officesLoading ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Division"
              value={form.division || ''}
              onChange={(e) => onChange('division', e.target.value)}
            >
              {DIVISION_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={form.status || 'active'}
              onChange={(e) => onChange('status', e.target.value)}
            >
              {[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'closed', label: 'Closed' },
              ].map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={submitting}
          startIcon={
            submitting ? <CircularProgress size={16} /> : <Iconify icon="mingcute:save-line" />
          }
        >
          {submitting ? 'Saving…' : 'Save Warehouse'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function WarehouseSettingsMain() {
  const router = useRouter();
  const confirm = useBoolean();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const panelSx = {
    borderRadius: 3,
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: theme.palette.background.paper,
  };
  const primaryGradient = `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.info.main})`;

  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [ordering, setOrdering] = useState('-id');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [checkingStockId, setCheckingStockId] = useState(null);
  const [stockBlockTarget, setStockBlockTarget] = useState(null);

  const listUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('type', 'warehouse');
    params.set('pagination', 'true');
    params.set('page', String(page + 1));
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (statusFilter) params.set('status', statusFilter);
    if (divisionFilter) params.set('division', divisionFilter);
    if (ordering) params.set('ordering', ordering);
    return `${EP.office_management}?${params.toString()}`;
  }, [page, searchQuery, statusFilter, divisionFilter, ordering]);

  const summaryUrl = useMemo(() => `${EP.office_management}?type=warehouse&pagination=false`, []);

  const { data: rawList, loading: listLoading, error: listError } = useGetRequest(listUrl);
  const { data: rawSummary, loading: summaryLoading } = useGetRequest(summaryUrl);

  const rows = useMemo(
    () => (!rawList ? [] : Array.isArray(rawList) ? rawList : rawList.results || []),
    [rawList]
  );
  const summaryRows = useMemo(
    () => (!rawSummary ? [] : Array.isArray(rawSummary) ? rawSummary : rawSummary.results || []),
    [rawSummary]
  );
  const totalPages = rawList?.total_pages || 1;

  const metrics = useMemo(
    () => ({
      total: summaryRows.length,
      active: summaryRows.filter((r) => r.status === 'active').length,
      inactive: summaryRows.filter((r) => r.status !== 'active').length,
      totalBudget: summaryRows.reduce((sum, r) => sum + Number(r.budgetAllocation || 0), 0),
      divisions: new Set(summaryRows.map((r) => r.division).filter(Boolean)).size,
    }),
    [summaryRows]
  );

  const revalidate = () =>
    mutate((key) => typeof key === 'string' && key.startsWith(EP.office_management));

  const openCreate = () => {
    setEditingItem(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };
  const openEdit = (row) => {
    setEditingItem(row);
    setForm({
      name: row.name || '',
      code: row.code || '',
      district: row.district || '',
      division: row.division || '',
      address: row.address || '',
      phone: row.phone || '',
      email: row.email || '',
      status: row.status || 'active',
      headOfOffice: row.headOfOffice || '',
      budgetAllocation: row.budgetAllocation || '',
    });
    setDialogOpen(true);
  };
  const closeDialog = () => {
    if (submitting) return;
    setDialogOpen(false);
    setEditingItem(null);
    setForm({ ...EMPTY_FORM });
  };
  const handleFormChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const buildPayload = (f) => {
    const p = {
      name: f.name?.trim() || '',
      code: f.code?.trim() || '',
      type: 'warehouse',
      status: f.status || 'active',
    };
    if (f.district?.trim()) p.district = f.district.trim();
    if (f.division) p.division = f.division;
    if (f.address?.trim()) p.address = f.address.trim();
    if (f.phone?.trim()) p.phone = f.phone.trim();
    if (f.email?.trim()) p.email = f.email.trim();
    if (f.headOfOffice?.trim()) p.headOfOffice = f.headOfOffice.trim();
    if (f.budgetAllocation !== '' && f.budgetAllocation != null)
      p.budgetAllocation = Number(f.budgetAllocation);
    return p;
  };

  const handleSubmit = async () => {
    if (!form.name?.trim()) {
      toast.error('Warehouse name is required.');
      return;
    }
    if (!form.code?.trim()) {
      toast.error('Warehouse code is required.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildPayload(form);
      if (editingItem) {
        await putRequest(EP.office_management_by_id(editingItem.id), payload);
        toast.success('Warehouse updated successfully.');
      } else {
        await createRequest(EP.office_management, payload);
        toast.success('Warehouse created successfully.');
      }
      closeDialog();
      await revalidate();
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRequest(EP.office_management_by_id(deleteTarget.id));
      toast.success('Warehouse deleted.');
      await revalidate();
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err));
    } finally {
      setDeleting(false);
      confirm.onFalse();
      setDeleteTarget(null);
    }
  };

  const handleDeleteRequest = async (row) => {
    setCheckingStockId(row.id);
    try {
      const resp = await axiosInstance.get(
        `${SI.location_stocks}?office_location=${row.id}&has_stock=true`
      );
      const count = resp.data?.count ?? (Array.isArray(resp.data) ? resp.data.length : 0);
      if (count > 0) {
        setStockBlockTarget(row);
      } else {
        setDeleteTarget(row);
        confirm.onTrue();
      }
    } catch {
      setDeleteTarget(row);
      confirm.onTrue();
    } finally {
      setCheckingStockId(null);
    }
  };

  const summaryCards = [
    {
      label: 'Total Warehouses',
      value: metrics.total,
      helper: 'All warehouse sites.',
      icon: 'solar:buildings-bold-duotone',
      color: theme.palette.primary.main,
    },
    {
      label: 'Active',
      value: metrics.active,
      helper: 'Currently operational.',
      icon: 'solar:check-circle-bold-duotone',
      color: theme.palette.success.main,
    },
    {
      label: 'Inactive / Closed',
      value: metrics.inactive,
      helper: 'Not in operation.',
      icon: 'solar:close-circle-bold-duotone',
      color: theme.palette.error.main,
    },
    {
      label: 'Divisions',
      value: metrics.divisions,
      helper: 'Unique admin divisions.',
      icon: 'solar:map-point-bold-duotone',
      color: theme.palette.info.main,
    },
    {
      label: 'Total Budget',
      value: formatBudget(metrics.totalBudget),
      helper: 'Sum of all allocations.',
      icon: 'solar:wallet-money-bold-duotone',
      color: theme.palette.warning.main,
    },
  ];

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Stack spacing={3}>
        {/* header */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background: primaryGradient,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Iconify icon="solar:buildings-bold-duotone" width={24} sx={{ color: '#fff' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} color="text.primary" lineHeight={1.2}>
                  Warehouse Settings
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Manage warehouse locations — staff, budgets, operational status, and inventory
                </Typography>
              </Box>
            </Stack>
          </Box>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={openCreate}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              background: primaryGradient,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.info.dark})`,
              },
            }}
          >
            Add Warehouse
          </Button>
        </Stack>

        {/* alert */}
        <Alert
          severity={listError ? 'error' : 'info'}
          icon={<Iconify icon="solar:info-circle-bold-duotone" />}
          sx={{ borderRadius: 2 }}
        >
          {listError ? (
            'Failed to load warehouses. Please check the backend or refresh.'
          ) : (
            <>
              Data source: <strong>/api/office_management/?type=warehouse</strong> — with live
              search, status and division filters.
            </>
          )}
        </Alert>

        {/* summary cards */}
        <Grid container spacing={2}>
          {summaryCards.map((card) => (
            <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <Card sx={panelSx}>
                <Box sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="overline" color="text.secondary" fontSize="0.65rem">
                        {card.label}
                      </Typography>
                      <Typography variant="h5" fontWeight={800} color="text.primary">
                        {summaryLoading ? '…' : card.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: alpha(card.color, isDark ? 0.22 : 0.12),
                        color: card.color,
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Iconify icon={card.icon} width={20} />
                    </Box>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" mt={1} display="block">
                    {card.helper}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* filters */}
        <Card sx={panelSx}>
          <Box sx={{ p: 2.5 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by name, code, district…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify
                          icon="solar:magnifer-linear"
                          width={18}
                          sx={{ color: 'text.secondary' }}
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
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
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Division"
                  value={divisionFilter}
                  onChange={(e) => {
                    setDivisionFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  {DIVISION_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Order"
                  value={ordering}
                  onChange={(e) => {
                    setOrdering(e.target.value);
                    setPage(0);
                  }}
                >
                  {ORDER_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('');
                    setDivisionFilter('');
                    setOrdering('-id');
                    setPage(0);
                  }}
                >
                  Reset
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Card>

        {/* table */}
        <Card sx={panelSx}>
          {listLoading && <LinearProgress />}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.text.primary, isDark ? 0.1 : 0.04) }}>
                  {[
                    '#',
                    'Office ID',
                    'Name / Code',
                    'District / Division',
                    'Head / Phone',
                    'Staff',
                    'Budget',
                    'Status',
                    'Actions',
                  ].map((h) => (
                    <TableCell
                      key={h}
                      align={
                        ['#', 'Staff', 'Actions', 'Status', 'Budget'].includes(h)
                          ? 'center'
                          : 'left'
                      }
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.4,
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {listLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRowSkeleton
                      key={i}
                      columns={[
                        { type: 'text', width: 24 },
                        { type: 'text', width: 60 },
                        { type: 'text', lines: 2, width: '80%' },
                        { type: 'text', lines: 2, width: '70%' },
                        { type: 'text', lines: 2, width: '70%' },
                        { type: 'text', width: 32 },
                        { type: 'text', width: 80 },
                        { type: 'rect', width: 64, height: 22 },
                        { type: 'circle', count: 3, size: 28 },
                      ]}
                    />
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      <Stack alignItems="center" spacing={1}>
                        <Iconify
                          icon="solar:buildings-bold-duotone"
                          width={48}
                          sx={{ color: 'text.disabled' }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          No warehouse records match the current filters.
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
                    <WarehouseRow
                      key={row.id}
                      row={row}
                      serial={page * (rawList?.page_size || 10) + index + 1}
                      onView={(id) =>
                        router.push(paths.dashboard.storeInventory.warehouseSettingsDetail(id))
                      }
                      onEdit={openEdit}
                      onDelete={handleDeleteRequest}
                      checkingStock={checkingStockId === row.id}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* ── pagination footer ── */}
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              borderTop: `1px solid`,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {rawList?.count != null
                ? `Showing ${rows.length ? page * (rawList?.page_size || 10) + 1 : 0}–${page * (rawList?.page_size || 10) + rows.length} of ${rawList.count} warehouse${rawList.count !== 1 ? 's' : ''}`
                : `${rows.length} warehouse${rows.length !== 1 ? 's' : ''}`}
            </Typography>
            {totalPages > 1 && (
              <Pagination
                count={totalPages}
                page={page + 1}
                onChange={(_, v) => setPage(v - 1)}
                color="primary"
                shape="rounded"
                size="small"
              />
            )}
          </Box>
        </Card>
      </Stack>

      <WarehouseFormDialog
        open={dialogOpen}
        editing={editingItem}
        form={form}
        onChange={handleFormChange}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={() => {
          confirm.onFalse();
          setDeleteTarget(null);
        }}
        title="Delete Warehouse"
        content={
          <Typography>
            Delete <strong>{deleteTarget?.name || 'this warehouse'}</strong>? This action cannot be
            undone.
          </Typography>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={
              deleting ? (
                <CircularProgress size={16} />
              ) : (
                <Iconify icon="solar:trash-bin-trash-bold" />
              )
            }
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        }
      />

      <ConfirmDialog
        open={Boolean(stockBlockTarget)}
        onClose={() => setStockBlockTarget(null)}
        title="Cannot Delete Warehouse"
        content={
          <Typography>
            <strong>{stockBlockTarget?.name || 'This warehouse'}</strong> cannot be deleted because
            products are currently assigned to it. Please transfer all products to another Office or
            Warehouse before deleting this location.
          </Typography>
        }
        action={
          <Button variant="contained" color="primary" onClick={() => setStockBlockTarget(null)}>
            Got It
          </Button>
        }
      />
    </Box>
  );
}
