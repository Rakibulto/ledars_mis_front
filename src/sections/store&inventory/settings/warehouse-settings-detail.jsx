'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Table,
  Alert,
  Avatar,
  Button,
  Dialog,
  Divider,
  MenuItem,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  DialogTitle,
  Autocomplete,
  DialogContent,
  DialogActions,
  TableContainer,
  InputAdornment,
  LinearProgress,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  usePutRequest as putRequest,
  useDeleteRequest as deleteRequest,
  useCreateRequest as createRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ─── constants ────────────────────────────────────────────────────────────────

const EP = endpoints.procurement_management;
const STORE_EP = endpoints.storeInventory;

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

function formatDateTime(value) {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );
}

function formatNumber(v) {
  const n = Number(v || 0);
  return n.toLocaleString('en-BD', { maximumFractionDigits: 2 });
}

function DetailField({ label, value, muted = false, icon }) {
  return (
    <Box>
      <Stack direction="row" spacing={0.5} alignItems="center" mb={0.25}>
        {icon && <Iconify icon={icon} width={14} sx={{ color: 'text.secondary' }} />}
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {label}
        </Typography>
      </Stack>
      <Typography
        variant="body1"
        fontWeight={700}
        color={muted ? 'text.secondary' : 'text.primary'}
      >
        {value}
      </Typography>
    </Box>
  );
}

function SectionCard({ title, icon, children, action }) {
  const theme = useTheme();
  return (
    <Card
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
      }}
    >
      <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon={icon} width={20} sx={{ color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight={700}>
              {title}
            </Typography>
          </Stack>
          {action}
        </Stack>
      </Box>
      <Box sx={{ p: 3 }}>{children}</Box>
    </Card>
  );
}

// ─── CREATE STAFF DIALOG ─────────────────────────────────────────────────────

function CreateStaffDialog({ open, officeId, onClose, onSuccess }) {
  const { data: rawUsers, isLoading: usersLoading } = useGetRequest('/api/simple-user/');
  const userOptions = useMemo(() => {
    const list = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];
    return list.map((u) => ({ id: u.id, label: u.username }));
  }, [rawUsers]);

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [status, setStatus] = useState('active');
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (submitting) return;
    setSelectedUsers([]);
    setStatus('active');
    onClose();
  };

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Select at least one staff member.');
      return;
    }
    setSubmitting(true);
    try {
      await createRequest('/api/office_staff/', {
        office: Number(officeId),
        user_ids: selectedUsers.map((u) => u.id),
        status,
      });
      toast.success(`${selectedUsers.length} staff member(s) added successfully.`);
      setSelectedUsers([]);
      setStatus('active');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Add Staff to Warehouse</DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Stack spacing={2.5}>
          <Autocomplete
            multiple
            fullWidth
            size="small"
            options={userOptions}
            loading={usersLoading}
            value={selectedUsers}
            onChange={(_, newVal) => setSelectedUsers(newVal)}
            getOptionLabel={(option) => option.label || ''}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Staff Members"
                placeholder="Search by username…"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {usersLoading ? <CircularProgress size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
          <TextField
            select
            fullWidth
            size="small"
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ].map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || selectedUsers.length === 0}
          startIcon={
            submitting ? <CircularProgress size={16} /> : <Iconify icon="solar:user-plus-bold" />
          }
        >
          {submitting
            ? 'Adding…'
            : `Add ${selectedUsers.length > 0 ? `(${selectedUsers.length}) ` : ''}Staff`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── EDIT FORM DIALOG ─────────────────────────────────────────────────────────

const DIVISION_OPTIONS = [
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
];

function EditDialog({ open, form, onChange, onClose, onSubmit, submitting }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Edit Warehouse</DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Grid container spacing={2}>
          {[
            { key: 'name', label: 'Warehouse Name', required: true, xs: 12 },
            { key: 'code', label: 'Short Code', required: true },
            { key: 'district', label: 'District' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'headOfOffice', label: 'Head of Warehouse', xs: 12 },
            { key: 'budgetAllocation', label: 'Budget Allocation (৳)', type: 'number' },
            { key: 'address', label: 'Full Address', multiline: true, rows: 2, xs: 12 },
          ].map((field) => (
            <Grid key={field.key} size={{ xs: 12, sm: field.xs === 12 ? 12 : 6 }}>
              <TextField
                fullWidth
                size="small"
                label={field.label}
                value={form[field.key] || ''}
                type={field.type || 'text'}
                multiline={!!field.multiline}
                rows={field.rows}
                required={!!field.required}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            </Grid>
          ))}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Division"
              value={form.division || ''}
              onChange={(e) => onChange('division', e.target.value)}
            >
              <MenuItem value="">All Divisions</MenuItem>
              {DIVISION_OPTIONS.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
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
          {submitting ? 'Saving…' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function WarehouseSettingsDetail() {
  const params = useParams();
  const router = useRouter();
  const confirm = useBoolean();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const heroGradient = `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isDark ? 0.3 : 0.14)}, ${alpha(theme.palette.info.main, isDark ? 0.3 : 0.1)})`;
  const primaryGradient = `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.info.main})`;
  const panelSx = {
    borderRadius: 3,
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: theme.palette.background.paper,
  };

  const warehouseId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const detailUrl = warehouseId ? EP.office_management_by_id(warehouseId) : null;
  const officeStockUrl = warehouseId
    ? `${STORE_EP.inventory_office_stock_detail}?office_id=${warehouseId}`
    : null;

  const { data: warehouse, loading, error } = useGetRequest(detailUrl);
  const { data: rawOfficeStock, isLoading: officeStockLoading } = useGetRequest(officeStockUrl);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checkingStock, setCheckingStock] = useState(false);
  const [stockBlocked, setStockBlocked] = useState(false);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [stockSearch, setStockSearch] = useState('');

  const officeStock = useMemo(() => {
    if (!rawOfficeStock) return [];
    return Array.isArray(rawOfficeStock) ? rawOfficeStock : rawOfficeStock.results || [];
  }, [rawOfficeStock]);

  const filteredStock = useMemo(() => {
    if (!stockSearch.trim()) return officeStock;
    const q = stockSearch.toLowerCase();
    return officeStock.filter(
      (p) => p.product_name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
    );
  }, [officeStock, stockSearch]);

  const revalidate = () =>
    mutate((key) => typeof key === 'string' && key.startsWith(EP.office_management));

  const openEdit = () => {
    if (!warehouse) return;
    setForm({
      name: warehouse.name || '',
      code: warehouse.code || '',
      district: warehouse.district || '',
      division: warehouse.division || '',
      address: warehouse.address || '',
      phone: warehouse.phone || '',
      email: warehouse.email || '',
      status: warehouse.status || 'active',
      headOfOffice: warehouse.headOfOffice || '',
      budgetAllocation: warehouse.budgetAllocation || '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (submitting) return;
    setDialogOpen(false);
  };
  const handleFormChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name?.trim()) {
      toast.error('Name is required.');
      return;
    }
    setSubmitting(true);
    try {
      await putRequest(detailUrl, { ...form, type: 'warehouse' });
      toast.success('Warehouse updated successfully.');
      closeDialog();
      await revalidate();
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteRequest(detailUrl);
      toast.success('Warehouse deleted.');
      await revalidate();
      router.push(paths.dashboard.storeInventory.warehouseSettings);
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err));
    } finally {
      setDeleting(false);
      confirm.onFalse();
    }
  };

  const handleDeleteRequest = async () => {
    setCheckingStock(true);
    try {
      const resp = await axiosInstance.get(
        `${STORE_EP.location_stocks}?office_location=${warehouseId}&has_stock=true`
      );
      const count = resp.data?.count ?? (Array.isArray(resp.data) ? resp.data.length : 0);
      if (count > 0) {
        setStockBlocked(true);
      } else {
        confirm.onTrue();
      }
    } catch {
      confirm.onTrue();
    } finally {
      setCheckingStock(false);
    }
  };

  // ── stats ──
  const stats = useMemo(() => {
    if (!warehouse) return [];
    const budgetUsed = Number(warehouse.budgetUtilized || 0);
    const budgetTotal = Number(warehouse.budgetAllocation || 0);
    const utilPct =
      budgetTotal > 0 ? Math.min(100, Math.round((budgetUsed / budgetTotal) * 100)) : 0;
    return [
      {
        label: 'Staff Count',
        value: warehouse.staffCount ?? 0,
        icon: 'solar:users-group-rounded-bold-duotone',
        color: theme.palette.primary.main,
        helper: 'Total staff assigned to this warehouse.',
      },
      {
        label: 'Budget Allocated',
        value: formatBudget(warehouse.budgetAllocation),
        icon: 'solar:wallet-money-bold-duotone',
        color: theme.palette.info.main,
        helper: 'Total budget allocation for this warehouse.',
      },
      {
        label: 'Budget Utilized',
        value: formatBudget(warehouse.budgetUtilized),
        icon: 'solar:chart-bold-duotone',
        color: utilPct > 80 ? theme.palette.error.main : theme.palette.success.main,
        helper: `${utilPct}% of budget has been utilized.`,
      },
      {
        label: 'Products in Stock',
        value: officeStockLoading ? '…' : officeStock.length,
        icon: 'solar:box-bold-duotone',
        color: theme.palette.warning.main,
        helper: 'Active products stocked in this warehouse.',
      },
    ];
  }, [warehouse, officeStock.length, officeStockLoading, theme]);

  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading warehouse details…
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error || !warehouse) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          component={Link}
          href={paths.dashboard.storeInventory.warehouseSettings}
          startIcon={<Iconify icon="solar:arrow-left-linear" />}
          sx={{ mb: 2, textTransform: 'none' }}
        >
          Back to Warehouse Settings
        </Button>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          This warehouse record could not be loaded. It may have been removed or the backend
          returned an error.
        </Alert>
      </Box>
    );
  }

  const staff = Array.isArray(warehouse.staff) ? warehouse.staff : [];

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Stack spacing={3}>
        {/* ── nav + header ── */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Button
              component={Link}
              href={paths.dashboard.storeInventory.warehouseSettings}
              startIcon={<Iconify icon="solar:arrow-left-linear" />}
              sx={{ px: 0, mb: 1, textTransform: 'none', fontWeight: 600 }}
            >
              Back to Warehouse Settings
            </Button>
            <Stack direction="row" spacing={1.5} alignItems="center">
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
                  {warehouse.name}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    {warehouse.office_id} · {warehouse.code}
                  </Typography>
                  {getStatusChip(warehouse.status)}
                </Stack>
              </Box>
            </Stack>
          </Box>
          <Stack direction={{ xs: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={openEdit}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={
                checkingStock ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Iconify icon="solar:trash-bin-trash-bold" />
                )
              }
              onClick={handleDeleteRequest}
              disabled={checkingStock}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Delete
            </Button>
          </Stack>
        </Stack>

        {/* ── hero card ── */}
        <Card sx={{ ...panelSx, overflow: 'hidden' }}>
          <Box sx={{ p: 3.5, background: heroGradient }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="overline" color="text.secondary">
                  Warehouse Overview
                </Typography>
                <Typography variant="h4" fontWeight={800} color="text.primary" mb={0.5}>
                  {warehouse.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={1.5}>
                  {warehouse.address ||
                    'No address stored for this warehouse. Add one to improve routing and audit clarity.'}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {warehouse.division && (
                    <Chip
                      label={warehouse.division}
                      size="small"
                      variant="outlined"
                      icon={<Iconify icon="solar:map-point-bold-duotone" width={14} />}
                    />
                  )}
                  {warehouse.district && (
                    <Chip label={warehouse.district} size="small" variant="outlined" />
                  )}
                  <Chip label="Warehouse" size="small" color="primary" variant="soft" />
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={1.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Office ID
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="text.primary">
                      {warehouse.office_id || '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Code
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="text.primary">
                      {warehouse.code || '—'}
                    </Typography>
                  </Box>
                  {getStatusChip(warehouse.status)}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Card>

        {/* ── stat cards ── */}
        <Grid container spacing={2}>
          {stats.map((card) => (
            <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={panelSx}>
                <Box sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="overline" color="text.secondary" fontSize="0.65rem">
                        {card.label}
                      </Typography>
                      <Typography variant="h5" fontWeight={800} color="text.primary">
                        {card.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2,
                        bgcolor: alpha(card.color, isDark ? 0.22 : 0.12),
                        color: card.color,
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Iconify icon={card.icon} width={22} />
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

        {/* ── details + staff layout ── */}
        <Grid container spacing={3}>
          {/* left: profile details */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <SectionCard title="Warehouse Profile" icon="solar:document-text-bold-duotone">
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    label="Office ID"
                    value={warehouse.office_id || '—'}
                    icon="solar:tag-bold-duotone"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    label="Short Code"
                    value={warehouse.code || '—'}
                    icon="solar:hashtag-bold-duotone"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    label="District"
                    value={warehouse.district || '—'}
                    muted={!warehouse.district}
                    icon="solar:map-point-bold-duotone"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    label="Division"
                    value={warehouse.division || '—'}
                    muted={!warehouse.division}
                    icon="solar:map-bold-duotone"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    label="Head of Warehouse"
                    value={warehouse.headOfOffice || 'Unassigned'}
                    muted={!warehouse.headOfOffice}
                    icon="solar:user-bold-duotone"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    label="Phone"
                    value={warehouse.phone || 'No phone recorded'}
                    muted={!warehouse.phone}
                    icon="solar:phone-bold-duotone"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    label="Email"
                    value={warehouse.email || 'No email recorded'}
                    muted={!warehouse.email}
                    icon="solar:letter-bold-duotone"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    label="Status"
                    value={warehouse.status || '—'}
                    icon="solar:shield-check-bold-duotone"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <DetailField
                    label="Address"
                    value={warehouse.address || 'No address recorded'}
                    muted={!warehouse.address}
                    icon="solar:home-bold-duotone"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    label="Budget Allocated"
                    value={formatBudget(warehouse.budgetAllocation)}
                    icon="solar:wallet-money-bold-duotone"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    label="Budget Utilized"
                    value={formatBudget(warehouse.budgetUtilized)}
                    icon="solar:chart-bold-duotone"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    label="Created"
                    value={formatDateTime(warehouse.created_at)}
                    icon="solar:calendar-bold-duotone"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    label="Last Updated"
                    value={formatDateTime(warehouse.updated_at)}
                    icon="solar:clock-circle-bold-duotone"
                  />
                </Grid>
                {warehouse.created_by && (
                  <Grid size={{ xs: 12 }}>
                    <DetailField
                      label="Created By"
                      value={warehouse.created_by}
                      icon="solar:user-bold-duotone"
                    />
                  </Grid>
                )}
              </Grid>
            </SectionCard>
          </Grid>

          {/* right: staff */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <SectionCard
              title={`Staff (${staff.length})`}
              icon="solar:users-group-rounded-bold-duotone"
              action={
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Iconify icon="solar:user-plus-bold" />}
                  onClick={() => setStaffDialogOpen(true)}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Add Staff
                </Button>
              }
            >
              {staff.length === 0 ? (
                <Stack alignItems="center" spacing={1} py={2}>
                  <Iconify
                    icon="solar:users-group-rounded-bold-duotone"
                    width={40}
                    sx={{ color: 'text.disabled' }}
                  />
                  <Typography variant="body2" color="text.secondary" align="center">
                    No staff assigned to this warehouse yet.
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={1.5}>
                  {staff.map((member) => (
                    <Stack
                      key={member.id}
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.text.primary, isDark ? 0.06 : 0.03),
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: alpha(theme.palette.primary.main, 0.18),
                          color: 'primary.main',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                        }}
                      >
                        {(member.username || member.email || '?').charAt(0).toUpperCase()}
                      </Avatar>
                      <Box flexGrow={1} minWidth={0}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {member.username || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {member.email || ''}
                        </Typography>
                      </Box>
                      {member.role && (
                        <Chip label={member.role} size="small" variant="soft" color="default" />
                      )}
                    </Stack>
                  ))}
                </Stack>
              )}
            </SectionCard>
          </Grid>
        </Grid>

        {/* ── office product stock ── */}
        <SectionCard
          title={`Product Stock — This Office (${officeStockLoading ? '…' : filteredStock.length} products)`}
          icon="solar:box-minimalistic-bold-duotone"
        >
          {/* filters row */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2}>
            <TextField
              size="small"
              placeholder="Search by product name or SKU…"
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify
                      icon="solar:magnifer-linear"
                      width={18}
                      sx={{ color: 'text.disabled' }}
                    />
                  </InputAdornment>
                ),
              }}
            />
            {stockSearch && (
              <Button size="small" variant="outlined" onClick={() => setStockSearch('')}>
                Clear
              </Button>
            )}
          </Stack>

          {/* summary strip */}
          {!officeStockLoading && officeStock.length > 0 && (
            <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
              <Chip
                icon={<Iconify icon="solar:box-bold-duotone" width={16} />}
                label={`${officeStock.length} Total Products`}
                size="small"
                variant="soft"
                color="primary"
              />
              <Chip
                icon={<Iconify icon="solar:layers-bold-duotone" width={16} />}
                label={`Total Qty: ${Number(officeStock.reduce((s, p) => s + Number(p.quantity || 0), 0)).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`}
                size="small"
                variant="soft"
                color="info"
              />
            </Stack>
          )}

          {officeStockLoading ? (
            <LinearProgress />
          ) : officeStock.length === 0 ? (
            <Stack alignItems="center" spacing={1} py={4}>
              <Iconify
                icon="solar:box-minimalistic-bold-duotone"
                width={44}
                sx={{ color: 'text.disabled' }}
              />
              <Typography variant="body2" color="text.secondary">
                No products are currently stocked in this office/warehouse.
              </Typography>
            </Stack>
          ) : filteredStock.length === 0 ? (
            <Stack alignItems="center" spacing={1} py={3}>
              <Iconify icon="solar:magnifer-linear" width={36} sx={{ color: 'text.disabled' }} />
              <Typography variant="body2" color="text.secondary">
                No products match your filter.
              </Typography>
            </Stack>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{ bgcolor: alpha(theme.palette.text.primary, isDark ? 0.1 : 0.04) }}
                  >
                    {['#', 'Product Name', 'SKU', 'Quantity', 'Unit', 'Stock Status'].map((h) => (
                      <TableCell
                        key={h}
                        align={['#', 'Quantity', 'Stock Status'].includes(h) ? 'center' : 'left'}
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
                  {filteredStock.map((item, i) => {
                    const stockStatusColor =
                      {
                        'In Stock': 'success',
                        'Low Stock': 'warning',
                        'Out of Stock': 'error',
                        Overstock: 'info',
                      }[item.stock_status] || 'default';
                    return (
                      <TableRow key={item.product_id} hover>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={700} color="text.secondary">
                            {i + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {item.product_name || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="primary.main" fontWeight={600}>
                            {item.sku || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            color={Number(item.quantity) <= 0 ? 'error.main' : 'success.main'}
                          >
                            {Number(item.quantity).toLocaleString('en-BD', {
                              maximumFractionDigits: 2,
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {item.unit || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.stock_status || '—'}
                            color={stockStatusColor}
                            size="small"
                            variant="soft"
                            sx={{ fontWeight: 700, fontSize: '0.68rem' }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionCard>

        {/* ── nested inventory warehouses ── */}
        {Array.isArray(warehouse.warehouses) && warehouse.warehouses.length > 0 && (
          <SectionCard
            title={`Linked Inventory Warehouses (${warehouse.warehouses.length})`}
            icon="solar:warehouse-bold-duotone"
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{ bgcolor: alpha(theme.palette.text.primary, isDark ? 0.1 : 0.04) }}
                  >
                    {[
                      '#',
                      'Name',
                      'Code',
                      'Type',
                      'Manager',
                      'Phone',
                      'Capacity (sqft)',
                      'Status',
                    ].map((h) => (
                      <TableCell
                        key={h}
                        align={['#', 'Capacity (sqft)', 'Status'].includes(h) ? 'center' : 'left'}
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
                  {warehouse.warehouses.map((wh, i) => (
                    <TableRow key={wh.id || i} hover>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={700} color="text.secondary">
                          {i + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {wh.name || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="primary.main" fontWeight={600}>
                          {wh.code || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={wh.warehouse_type_label || wh.warehouse_type || '—'}
                          size="small"
                          variant="soft"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {wh.manager || 'Unassigned'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {wh.phone || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={700}>
                          {wh.capacity_sqft ? Number(wh.capacity_sqft).toLocaleString() : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={wh.is_active ? 'Active' : 'Inactive'}
                          color={wh.is_active ? 'success' : 'default'}
                          size="small"
                          variant="soft"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        )}
      </Stack>

      {/* ── edit dialog ── */}
      <EditDialog
        open={dialogOpen}
        form={form}
        onChange={handleFormChange}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      {/* ── add staff dialog ── */}
      <CreateStaffDialog
        open={staffDialogOpen}
        officeId={warehouseId}
        onClose={() => setStaffDialogOpen(false)}
        onSuccess={revalidate}
      />

      {/* ── delete confirm ── */}
      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Warehouse"
        content={
          <Typography>
            Delete <strong>{warehouse.name}</strong>? This action cannot be undone.
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
        open={stockBlocked}
        onClose={() => setStockBlocked(false)}
        title="Cannot Delete Warehouse"
        content={
          <Typography>
            <strong>{warehouse?.name || 'This warehouse'}</strong> cannot be deleted because
            products are currently assigned to it. Please transfer all products to another Office or
            Warehouse before deleting this location.
          </Typography>
        }
        action={
          <Button variant="contained" color="primary" onClick={() => setStockBlocked(false)}>
            Got It
          </Button>
        }
      />
    </Box>
  );
}
