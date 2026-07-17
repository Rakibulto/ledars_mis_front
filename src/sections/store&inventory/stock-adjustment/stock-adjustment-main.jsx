'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Tab,
  Tabs,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Table,
  Button,
  Switch,
  Tooltip,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Pagination,
  IconButton,
  Typography,
  InputAdornment,
  TableContainer,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useDebounce } from 'src/hooks/use-debounce';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, useDeleteRequest as deleteRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import TableRowSkeleton from 'src/components/table/tableRowSkeleton';

import { useAuthContext } from 'src/auth/hooks';

import AddStockDialog from './add-stock-dialog';
import ApproveStockDialog from './approve-stock-dialog';
import SummaryCard from '../../_components/summary-card';
import AdjustmentApprovalInfo from './adjustment-approval-info';
import AdjustmentApprovalDialog from './adjustment-approval-dialog';
import {
  computeAdjustmentWorkflowInfo,
  STOCK_ADJUSTMENT_APPROVAL_WORKFLOW_URL,
} from './adjustment-approval-workflow';

const EP = endpoints.storeInventory;

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Pending Approval', label: 'Pending Approval' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Posted', label: 'Posted' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'Increase', label: 'Increase' },
  { value: 'Decrease', label: 'Decrease' },
  { value: 'Recount', label: 'Recount' },
];

function normalizeCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.results) ? payload.results : [];
}

function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  return `৳${amount.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(value));
}

function formatDifference(value) {
  const amount = Number(value || 0);

  if (amount > 0) {
    return `+${amount.toLocaleString('en-BD')}`;
  }

  return amount.toLocaleString('en-BD');
}

function getStatusChipProps(status) {
  switch (normalizeStatus(status)) {
    case 'posted':
      return { color: 'secondary', label: 'Posted' };
    case 'approved':
      return { color: 'success', label: 'Approved' };
    case 'pending approval':
      return { color: 'warning', label: 'Pending Approval' };
    case 'cancelled':
      return { color: 'error', label: 'Cancelled' };
    case 'draft':
      return { color: 'default', label: 'Draft' };
    default:
      return { color: 'default', label: status || 'Unknown' };
  }
}

function getAdjustmentTypeChipProps(type) {
  switch (
    String(type || '')
      .trim()
      .toLowerCase()
  ) {
    case 'increase':
      return { color: 'success', label: 'Increase' };
    case 'decrease':
      return { color: 'error', label: 'Decrease' };
    case 'recount':
      return { color: 'info', label: 'Recount' };
    default:
      return { color: 'default', label: type || 'Unknown' };
  }
}

function buildAdjustmentQuery({ search, status, adjustmentType, warehouse, page, pagination }) {
  const params = new URLSearchParams();

  params.set('ordering', '-adjustment_date');

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (status) {
    params.set('status', status);
  }

  if (adjustmentType) {
    params.set('adjustment_type', adjustmentType);
  }

  if (warehouse) {
    params.set('warehouse', String(warehouse));
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String(page + 1));
  }

  return `${EP.stock_adjustments}?${params.toString()}`;
}

function AdjustmentRow({
  adjustment,
  serialNumber,
  onOpenDetails,
  onEdit,
  onDelete,
  onApprove,
  wfInfo,
}) {
  const statusChip = getStatusChipProps(adjustment.status);
  const typeChip = getAdjustmentTypeChipProps(adjustment.adjustment_type);
  const normalizedStatus = normalizeStatus(adjustment.status);
  const isLocked = normalizedStatus === 'approved' || normalizedStatus === 'posted';
  const canApprove = Boolean(wfInfo?.canApprove);

  return (
    <TableRow hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
      <TableCell
        align="center"
        sx={{ width: 48, cursor: 'pointer' }}
        onClick={() => onOpenDetails(adjustment.id)}
      >
        <Typography variant="body2" fontWeight={700} color="text.disabled">
          {serialNumber}
        </Typography>
      </TableCell>

      <TableCell sx={{ cursor: 'pointer' }} onClick={() => onOpenDetails(adjustment.id)}>
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={700} color="text.primary">
            {adjustment.adjustment_number || 'Unnumbered'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {adjustment.reason || 'No reason'}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell sx={{ cursor: 'pointer' }} onClick={() => onOpenDetails(adjustment.id)}>
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={600} color="text.primary">
            {adjustment.office_location_name || adjustment.warehouse_name || '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {adjustment.location || '—'}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell sx={{ cursor: 'pointer' }} onClick={() => onOpenDetails(adjustment.id)}>
        <Typography variant="body2" color="text.secondary">
          {formatDate(adjustment.adjustment_date)}
        </Typography>
      </TableCell>

      <TableCell
        align="center"
        sx={{ cursor: 'pointer' }}
        onClick={() => onOpenDetails(adjustment.id)}
      >
        <Chip size="small" color={typeChip.color} label={typeChip.label} variant="soft" />
      </TableCell>

      <TableCell sx={{ cursor: 'pointer' }} onClick={() => onOpenDetails(adjustment.id)}>
        <Typography variant="body2" fontWeight={600} color="text.primary">
          {adjustment.adjusted_by_name || '—'}
        </Typography>
      </TableCell>

      <TableCell
        align="center"
        sx={{ cursor: 'pointer' }}
        onClick={() => onOpenDetails(adjustment.id)}
      >
        <Stack spacing={0} alignItems="center">
          <Typography variant="body2" fontWeight={700}>
            {adjustment.item_count || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Diff {formatDifference(adjustment.difference_total || 0)}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell
        align="right"
        sx={{ cursor: 'pointer' }}
        onClick={() => onOpenDetails(adjustment.id)}
      >
        <Typography variant="body2" fontWeight={700}>
          {formatCurrency(adjustment.total_value)}
        </Typography>
      </TableCell>

      <TableCell
        align="center"
        sx={{ cursor: 'pointer' }}
        onClick={() => onOpenDetails(adjustment.id)}
      >
        <Stack spacing={0.5} alignItems="center">
          <Chip size="small" color={statusChip.color} label={statusChip.label} variant="soft" />
          {normalizedStatus === 'pending approval' ? (
            <AdjustmentApprovalInfo wfInfo={wfInfo} showEligibleWhenCannotApprove />
          ) : null}
        </Stack>
      </TableCell>

      {/* ── Actions ── */}
      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
        <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
          <Tooltip title={isLocked ? 'Cannot edit an approved adjustment' : 'Edit'}>
            <span>
              <IconButton
                size="small"
                color="primary"
                disabled={isLocked}
                onClick={() => onEdit(adjustment.id)}
                sx={{ '&:not(:disabled):hover': { bgcolor: 'primary.lighter' } }}
              >
                <Iconify icon="solar:pen-bold" width={17} />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title={isLocked ? 'Cannot delete an approved adjustment' : 'Delete'}>
            <span>
              <IconButton
                size="small"
                color="error"
                disabled={isLocked}
                onClick={() => onDelete(adjustment.id)}
                sx={{ '&:not(:disabled):hover': { bgcolor: 'error.lighter' } }}
              >
                <Iconify icon="solar:trash-bin-trash-bold" width={17} />
              </IconButton>
            </span>
          </Tooltip>

          {canApprove && (
            <Tooltip title="Approve adjustment">
              <Button
                size="small"
                variant="contained"
                color="success"
                onClick={() => onApprove(adjustment)}
                sx={{
                  ml: 0.25,
                  px: 1.25,
                  minWidth: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                }}
                startIcon={<Iconify icon="solar:check-circle-bold" width={14} />}
              >
                Approve
              </Button>
            </Tooltip>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function StockAdjustmentMain() {
  const router = useRouter();
  const { user } = useAuthContext();

  // Permission: Admin role, or having change_stockadjustment Django permission
  // const canApproveStock =
  //   user?.role === 'Admin' ||
  //   user?.user_permissions_list?.some((p) => p.codename === 'change_stockadjustment') ||
  //   false;

  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [deleteId, setDeleteId] = useState(null);

  // Approve dialog state
  const [approveTarget, setApproveTarget] = useState(null);

  // Products tab state
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(0);
  const [quickAdjustProduct, setQuickAdjustProduct] = useState(null);
  const [approveProduct, setApproveProduct] = useState(null);
  const debouncedProductSearch = useDebounce(productSearch, 400);

  const debouncedSearch = useDebounce(searchQuery, 400);

  const adjustmentListUrl = useMemo(
    () =>
      buildAdjustmentQuery({
        search: debouncedSearch,
        status: statusFilter,
        adjustmentType: typeFilter,
        warehouse: warehouseFilter,
        page,
        pagination: true,
      }),
    [debouncedSearch, page, statusFilter, typeFilter, warehouseFilter]
  );

  const adjustmentSummaryUrl = useMemo(
    () =>
      buildAdjustmentQuery({
        search: debouncedSearch,
        status: statusFilter,
        adjustmentType: typeFilter,
        warehouse: warehouseFilter,
        page: 0,
        pagination: false,
      }),
    [debouncedSearch, statusFilter, typeFilter, warehouseFilter]
  );

  const productListUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('pagination', 'true');
    params.set('page', String(productPage + 1));
    if (debouncedProductSearch.trim()) params.set('search', debouncedProductSearch.trim());
    return `${endpoints.storeInventory.products}?${params.toString()}`;
  }, [debouncedProductSearch, productPage]);

  const {
    data: rawAdjustmentList,
    loading: listLoading,
    error: listError,
  } = useGetRequest(adjustmentListUrl);
  const { data: rawAdjustmentSummary } = useGetRequest(adjustmentSummaryUrl);
  const { data: rawWarehouses, loading: warehousesLoading } = useGetRequest(EP.warehouses);
  const { data: rawProductList, loading: productListLoading } = useGetRequest(productListUrl);

  const { data: rawWorkflow } = useGetRequest(STOCK_ADJUSTMENT_APPROVAL_WORKFLOW_URL);

  const pendingAdjUrl = useMemo(
    () => `${EP.stock_adjustments}?status=Pending+Approval&pagination=false`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const { data: rawPendingAdj } = useGetRequest(activeTab === 1 ? pendingAdjUrl : null);

  const pendingByProduct = useMemo(() => {
    const map = {};
    normalizeCollection(rawPendingAdj).forEach((adj) => {
      (adj.lines || []).forEach((line) => {
        if (line.product) {
          if (!map[line.product]) map[line.product] = [];
          map[line.product].push(adj);
        }
      });
    });
    return map;
  }, [rawPendingAdj]);

  const rows = useMemo(() => normalizeCollection(rawAdjustmentList), [rawAdjustmentList]);
  const summaryRows = useMemo(
    () => normalizeCollection(rawAdjustmentSummary),
    [rawAdjustmentSummary]
  );
  const warehouseOptions = useMemo(
    () =>
      [...normalizeCollection(rawWarehouses)].sort((left, right) =>
        String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawWarehouses]
  );

  const productRows = useMemo(() => normalizeCollection(rawProductList), [rawProductList]);
  const productTotalPages = Math.max(1, Number(rawProductList?.total_pages || 1));

  const totalPages = Math.max(1, Number(rawAdjustmentList?.total_pages || 1));
  const totalCount = Number(rawAdjustmentList?.count || summaryRows.length || 0);

  const summaryMetrics = useMemo(
    () => ({
      total: totalCount,
      pendingApproval: summaryRows.filter(
        (row) => normalizeStatus(row.status) === 'pending approval'
      ).length,
      approved: summaryRows.filter((row) => normalizeStatus(row.status) === 'approved').length,
      posted: summaryRows.filter((row) => normalizeStatus(row.status) === 'posted').length,
      positiveDifference: summaryRows.reduce(
        (total, row) => total + Math.max(Number(row.difference_total || 0), 0),
        0
      ),
      negativeDifference: summaryRows.reduce(
        (total, row) => total + Math.abs(Math.min(Number(row.difference_total || 0), 0)),
        0
      ),
    }),
    [summaryRows, totalCount]
  );

  const activeFilterCount = [
    Boolean(searchQuery.trim()),
    Boolean(statusFilter),
    Boolean(typeFilter),
    Boolean(warehouseFilter),
  ].filter(Boolean).length;

  const canResetFilters = Boolean(
    searchQuery.trim() || statusFilter || typeFilter || warehouseFilter || page !== 0
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setTypeFilter('');
    setWarehouseFilter('');
    setPage(0);
  };

  const handleCreate = () => {
    router.push(paths.dashboard.storeInventory.stock_adjustment_create);
  };

  const handleDeleteRequest = (adjustmentId) => {
    setDeleteId(adjustmentId);
  };

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    try {
      await deleteRequest(EP.stock_adjustment_by_id(deleteId));
      toast.success('Stock adjustment deleted successfully.');
      await Promise.all([mutate(adjustmentListUrl), mutate(adjustmentSummaryUrl)]);
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete the selected stock adjustment.');
    }
  };

  const handleSuccess = async (record) => {
    await Promise.all([
      mutate(adjustmentListUrl),
      mutate(adjustmentSummaryUrl),
      record?.id ? mutate(EP.stock_adjustment_by_id(record.id)) : Promise.resolve(),
    ]);
  };

  const openDetails = (adjustmentId) => {
    router.push(paths.dashboard.storeInventory.stock_adjustment_detail(adjustmentId));
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        <Card
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 4,
            border: '1px solid #fde68a',
            background:
              'linear-gradient(135deg, rgba(255,251,235,1) 0%, rgba(255,255,255,1) 48%, rgba(236,253,245,1) 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              right: -80,
              top: -96,
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(217,119,6,0.16) 0%, rgba(217,119,6,0) 72%)',
            }}
          />

          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            justifyContent="space-between"
            spacing={3}
            sx={{ position: 'relative', zIndex: 1 }}
          >
            <Stack spacing={2} sx={{ maxWidth: 780 }}>
              <Box>
                <Typography
                  variant="overline"
                  sx={{ color: '#b45309', fontWeight: 700, letterSpacing: 1.2 }}
                >
                  Adjustment Control Desk
                </Typography>
                <Typography variant="h4" fontWeight={800} color="#0f172a" sx={{ mt: 0.75 }}>
                  Stock Adjustment
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1.25 }}>
                  Build stock corrections in draft, submit them for approval, and apply quantity
                  increases or decreases only when the adjustment reaches Approved.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  icon={<Iconify icon="solar:clock-circle-bold-duotone" width={16} />}
                  label={`${summaryMetrics.pendingApproval} waiting approval`}
                  variant="outlined"
                  sx={{ bgcolor: '#ffffff', borderColor: '#fcd34d' }}
                />
                <Chip
                  icon={<Iconify icon="solar:check-circle-bold-duotone" width={16} />}
                  label={`${summaryMetrics.approved} approved corrections`}
                  variant="outlined"
                  sx={{ bgcolor: '#ffffff', borderColor: '#86efac' }}
                />
                <Chip
                  icon={<Iconify icon="solar:arrow-up-bold-duotone" width={16} />}
                  label={`+${summaryMetrics.positiveDifference.toLocaleString('en-BD')} incoming qty`}
                  variant="outlined"
                  sx={{ bgcolor: '#ffffff', borderColor: '#bbf7d0' }}
                />
                <Chip
                  icon={<Iconify icon="solar:arrow-down-bold-duotone" width={16} />}
                  label={`-${summaryMetrics.negativeDifference.toLocaleString('en-BD')} outgoing qty`}
                  variant="outlined"
                  sx={{ bgcolor: '#ffffff', borderColor: '#fecaca' }}
                />
              </Stack>
            </Stack>

            <Stack spacing={1.5} alignItems={{ xs: 'stretch', lg: 'flex-end' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<Iconify icon="solar:restart-bold-duotone" />}
                  onClick={handleResetFilters}
                  disabled={!canResetFilters}
                >
                  Reset Filters
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
                  onClick={handleCreate}
                  sx={{ boxShadow: '0 12px 24px rgba(180, 83, 9, 0.18)' }}
                >
                  Create Adjustment
                </Button>
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 360 }}>
                Draft and pending adjustments do not touch stock. Approval is the step that applies
                each line difference to product quantity.
              </Typography>
            </Stack>
          </Stack>
        </Card>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Adjustment Queue"
              value={summaryMetrics.total}
              icon="solar:settings-bold-duotone"
              bgcolor="#1d4ed8"
              boxShadow="0 4px 20px rgba(29, 78, 216, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Pending Approval"
              value={summaryMetrics.pendingApproval}
              icon="solar:clock-circle-bold-duotone"
              bgcolor="#d97706"
              boxShadow="0 4px 20px rgba(217, 119, 6, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Approved"
              value={summaryMetrics.approved}
              icon="solar:check-circle-bold-duotone"
              bgcolor="#059669"
              boxShadow="0 4px 20px rgba(5, 150, 105, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Net Qty Impact"
              value={formatDifference(
                summaryMetrics.positiveDifference - summaryMetrics.negativeDifference
              )}
              icon="solar:scale-bold-duotone"
              bgcolor="#7c3aed"
              boxShadow="0 4px 20px rgba(124, 58, 237, 0.28)"
            />
          </Grid>
        </Grid>

        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Stock Adjustments" />
          <Tab label="Product List" />
        </Tabs>

        {activeTab === 0 && (
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb' }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              spacing={1.5}
              sx={{ mb: 2.5 }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700} color="#0f172a">
                  Approval Command
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Search, filter, and open each adjustment to review line differences, submit for
                  approval, and approve stock corrections from one workflow surface.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  label={`${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}`}
                  color={activeFilterCount ? 'primary' : 'default'}
                  variant={activeFilterCount ? 'soft' : 'outlined'}
                />
                <Chip
                  size="small"
                  label={`${summaryMetrics.pendingApproval} pending approval`}
                  variant="outlined"
                />
              </Stack>
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search adjustment number, warehouse, reason, or controller..."
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setPage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="solar:magnifer-bold-duotone" width={18} />
                      </InputAdornment>
                    ),
                    endAdornment:
                      searchQuery !== debouncedSearch ? (
                        <CircularProgress color="inherit" size={16} />
                      ) : null,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2.5 }}>
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
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 2.5 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Adjustment Type"
                  value={typeFilter}
                  onChange={(event) => {
                    setTypeFilter(event.target.value);
                    setPage(0);
                  }}
                >
                  {TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 2.5 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Warehouse"
                  value={warehouseFilter}
                  onChange={(event) => {
                    setWarehouseFilter(event.target.value);
                    setPage(0);
                  }}
                  disabled={warehousesLoading}
                >
                  <MenuItem value="">All Warehouses</MenuItem>
                  {warehouseOptions.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={String(warehouse.id)}>
                      {warehouse.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Card>
        )}

        {activeTab === 0 && listError && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Stock adjustment records could not be loaded from the backend.
          </Alert>
        )}

        {activeTab === 0 && (
          <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <TableContainer>
              <Table size={dense ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell align="center" sx={{ width: 48 }}>
                      #
                    </TableCell>
                    <TableCell>Adjustment</TableCell>
                    <TableCell>Warehouse</TableCell>
                    <TableCell>Adjustment Date</TableCell>
                    <TableCell align="center">Type</TableCell>
                    <TableCell>Controllers</TableCell>
                    <TableCell align="center">Items</TableCell>
                    <TableCell align="right">Total Value</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center" sx={{ width: 140 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {listLoading
                    ? Array.from({ length: 5 }, (_, index) => (
                        <TableRowSkeleton
                          key={index}
                          columns={[
                            { type: 'text', width: 24, align: 'center' },
                            { type: 'text', lines: 2, width: 170 },
                            { type: 'text', lines: 2, width: 160 },
                            { type: 'text', width: 100 },
                            { type: 'rect', width: 110, height: 28, align: 'center' },
                            { type: 'text', lines: 2, width: 150 },
                            { type: 'text', width: 72, align: 'center' },
                            { type: 'text', width: 90, align: 'right' },
                            { type: 'rect', width: 120, height: 28, align: 'center' },
                            { type: 'text', width: 48, align: 'center' },
                          ]}
                        />
                      ))
                    : rows.map((adjustment, index) => (
                        <AdjustmentRow
                          key={adjustment.id}
                          adjustment={adjustment}
                          serialNumber={page * 10 + index + 1}
                          onOpenDetails={openDetails}
                          onEdit={(id) =>
                            router.push(paths.dashboard.storeInventory.stock_adjustment_edit(id))
                          }
                          onDelete={handleDeleteRequest}
                          onApprove={(adj) => setApproveTarget(adj)}
                          wfInfo={computeAdjustmentWorkflowInfo(
                            adjustment,
                            rawWorkflow,
                            user?.email
                          )}
                        />
                      ))}

                  {!listLoading && !rows.length && (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                        <Stack spacing={2} alignItems="center">
                          <Iconify
                            icon="solar:settings-line-duotone"
                            width={56}
                            sx={{ color: '#cbd5e1' }}
                          />
                          <Typography variant="h6" color="text.secondary">
                            No stock adjustments found
                          </Typography>
                          <Typography variant="body2" color="text.disabled">
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
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ sm: 'center' }}
              sx={{ px: 2.5, py: 2 }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <FormControlLabel
                  control={
                    <Switch checked={dense} onChange={(event) => setDense(event.target.checked)} />
                  }
                  label="Dense"
                />
                <Typography variant="body2" color="text.secondary">
                  {totalCount} adjustment{totalCount === 1 ? '' : 's'} matched
                </Typography>
              </Stack>

              <Pagination
                color="primary"
                shape="rounded"
                count={totalPages}
                page={page + 1}
                onChange={(event, value) => setPage(value - 1)}
              />
            </Stack>
          </Card>
        )}

        {activeTab === 1 && (
          <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <Box sx={{ p: 2.5 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" fontWeight={700} color="#0f172a">
                  Product Inventory
                </Typography>
                <TextField
                  size="small"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setProductPage(0);
                  }}
                  sx={{ width: { xs: '100%', sm: 280 } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="solar:magnifer-bold-duotone" width={18} />
                      </InputAdornment>
                    ),
                    endAdornment:
                      productSearch !== debouncedProductSearch ? (
                        <CircularProgress color="inherit" size={16} />
                      ) : null,
                  }}
                />
              </Stack>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell align="center" sx={{ width: 48 }}>
                      #
                    </TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="center">On Hand</TableCell>
                    <TableCell align="center">Available</TableCell>
                    <TableCell align="center">Stock Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productListLoading
                    ? Array.from({ length: 6 }, (_, i) => (
                        <TableRow key={i}>
                          {[...Array(7)].map((__, ci) => (
                            <TableCell key={ci}>
                              <Box sx={{ height: 16, bgcolor: '#f1f5f9', borderRadius: 1 }} />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : productRows.map((product, index) => {
                        const stockColor =
                          product.stock_status === 'Out of Stock'
                            ? 'error'
                            : product.stock_status === 'Low Stock'
                              ? 'warning'
                              : product.stock_status === 'Overstock'
                                ? 'info'
                                : 'success';
                        const pendingAdjs = pendingByProduct[product.id] || [];
                        const firstPendingAdj = pendingAdjs[0];
                        const productWfInfo = firstPendingAdj
                          ? computeAdjustmentWorkflowInfo(
                              firstPendingAdj,
                              rawWorkflow,
                              user?.email,
                              { forceUnordered: true }
                            )
                          : null;
                        const canApproveProduct =
                          pendingAdjs.length > 0 &&
                          pendingAdjs.some(
                            (adj) =>
                              computeAdjustmentWorkflowInfo(adj, rawWorkflow, user?.email, {
                                forceUnordered: true,
                              }).canApprove
                          );
                        return (
                          <TableRow key={product.id} hover>
                            <TableCell align="center">
                              <Typography variant="body2" color="text.secondary" fontWeight={700}>
                                {productPage * 10 + index + 1}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={700} color="#0f172a">
                                {product.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {product.code}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {product.category_name || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight={700}>
                                {Number(product.on_hand ?? 0)} {product.uom_name || ''}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" color="text.secondary">
                                {Number(product.available ?? 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                size="small"
                                label={product.stock_status || 'Unknown'}
                                color={stockColor}
                                variant="soft"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={1} justifyContent="center">
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  startIcon={<Iconify icon="solar:add-circle-bold" width={16} />}
                                  onClick={() => setQuickAdjustProduct(product)}
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  Add Stock
                                </Button>
                                {canApproveProduct ? (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    startIcon={
                                      <Iconify icon="solar:check-circle-bold" width={16} />
                                    }
                                    onClick={() => setApproveProduct(product)}
                                    sx={{
                                      textTransform: 'none',
                                      fontWeight: 700,
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    Approve ({pendingAdjs.length})
                                  </Button>
                                ) : null}
                                {pendingAdjs.length > 0 &&
                                !canApproveProduct &&
                                productWfInfo?.eligibleApproverNames?.length ? (
                                  <Tooltip
                                    title={`Eligible approvers: ${productWfInfo.eligibleApproverNames.join(', ')}`}
                                  >
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ maxWidth: 140 }}
                                      noWrap
                                    >
                                      {productWfInfo.eligibleApproverNames.join(', ')}
                                    </Typography>
                                  </Tooltip>
                                ) : null}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}

                  {!productListLoading && productRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          No products found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {productTotalPages > 1 && (
              <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Pagination
                  color="primary"
                  shape="rounded"
                  count={productTotalPages}
                  page={productPage + 1}
                  onChange={(_, v) => setProductPage(v - 1)}
                />
              </Box>
            )}
          </Card>
        )}
      </Stack>

      <AddStockDialog
        open={Boolean(quickAdjustProduct)}
        product={quickAdjustProduct}
        onClose={() => setQuickAdjustProduct(null)}
        onSuccess={async () => {
          setQuickAdjustProduct(null);
          await Promise.all([
            mutate(adjustmentListUrl),
            mutate(adjustmentSummaryUrl),
            mutate(pendingAdjUrl),
            mutate(productListUrl),
          ]);
        }}
      />

      <ApproveStockDialog
        open={Boolean(approveProduct)}
        product={approveProduct}
        pendingAdjustments={approveProduct ? pendingByProduct[approveProduct.id] || [] : []}
        rawWorkflow={rawWorkflow}
        userEmail={user?.email}
        onClose={() => setApproveProduct(null)}
        onSuccess={async () => {
          setApproveProduct(null);
          await Promise.all([
            mutate(adjustmentListUrl),
            mutate(adjustmentSummaryUrl),
            mutate(pendingAdjUrl),
            mutate(productListUrl),
          ]);
        }}
      />

      <AdjustmentApprovalDialog
        open={Boolean(approveTarget)}
        adjustment={approveTarget}
        onClose={() => setApproveTarget(null)}
        onSuccess={async () => {
          setApproveTarget(null);
          await Promise.all([mutate(adjustmentListUrl), mutate(adjustmentSummaryUrl)]);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete Stock Adjustment"
        content="Deleting this stock adjustment will also remove its generated stock movements."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
