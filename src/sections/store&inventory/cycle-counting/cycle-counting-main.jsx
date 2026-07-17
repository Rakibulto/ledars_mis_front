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

import SummaryCard from '../../_components/summary-card';
import CycleCountingFormDialog from './cycle-counting-form-dialog';

const EP = endpoints.storeInventory;

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Reviewed', label: 'Reviewed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const COUNT_TYPE_OPTIONS = [
  { value: '', label: 'All Count Types' },
  { value: 'ABC Cycle Count', label: 'ABC Cycle Count' },
  { value: 'High Value Audit', label: 'High Value Audit' },
  { value: 'Expiry Review', label: 'Expiry Review' },
  { value: 'Full Physical Count', label: 'Full Physical Count' },
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

function formatDate(value) {
  if (!value) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(value));
}

function formatPercent(value) {
  return Number(value || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatVariance(value) {
  const amount = Number(value || 0);

  if (amount > 0) {
    return `+${amount.toLocaleString('en-BD')}`;
  }

  return amount.toLocaleString('en-BD');
}

function getStatusChipProps(status) {
  switch (normalizeStatus(status)) {
    case 'reviewed':
      return { color: 'secondary', label: 'Reviewed' };
    case 'completed':
      return { color: 'success', label: 'Completed' };
    case 'in progress':
      return { color: 'info', label: 'In Progress' };
    case 'scheduled':
      return { color: 'warning', label: 'Scheduled' };
    case 'cancelled':
      return { color: 'error', label: 'Cancelled' };
    default:
      return { color: 'default', label: status || 'Unknown' };
  }
}

function getCountTypeChipProps(type) {
  switch (
    String(type || '')
      .trim()
      .toLowerCase()
  ) {
    case 'abc cycle count':
      return { color: 'primary', label: 'ABC Cycle Count' };
    case 'high value audit':
      return { color: 'error', label: 'High Value Audit' };
    case 'expiry review':
      return { color: 'warning', label: 'Expiry Review' };
    case 'full physical count':
      return { color: 'success', label: 'Full Physical Count' };
    default:
      return { color: 'default', label: type || 'Custom' };
  }
}

function buildCycleCountQuery({ search, status, countType, warehouse, page, pagination }) {
  const params = new URLSearchParams();

  params.set('ordering', '-scheduled_date');

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (status) {
    params.set('status', status);
  }

  if (countType) {
    params.set('count_type', countType);
  }

  if (warehouse) {
    params.set('warehouse', String(warehouse));
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String(page + 1));
  }

  return `${EP.cycle_counts}?${params.toString()}`;
}

function CountRow({ count, serialNumber, onOpenDetails, onEdit, onDelete }) {
  const statusChip = getStatusChipProps(count.status);
  const typeChip = getCountTypeChipProps(count.count_type);

  return (
    <TableRow
      hover
      onClick={() => onOpenDetails(count.id)}
      sx={{
        cursor: 'pointer',
        '&:hover': {
          bgcolor: '#f8fafc',
        },
      }}
    >
      <TableCell align="center" sx={{ width: 56 }}>
        <Typography variant="body2" fontWeight={700} color="#64748b">
          {serialNumber}
        </Typography>
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={700} color="#0f172a">
            {count.count_number || 'Unnumbered session'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {count.scope || 'Scope not captured'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={600} color="#0f172a">
          {count.warehouse_name || 'Warehouse pending'}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Chip size="small" color={typeChip.color} label={typeChip.label} variant="soft" />
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#475569">
          {formatDate(count.scheduled_date)}
        </Typography>
      </TableCell>
      <TableCell>
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={600} color="#0f172a">
            {count.owner_name || 'Owner pending'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {count.reviewer_name || 'Reviewer pending'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell align="center">
        <Stack spacing={0.25} alignItems="center">
          <Typography variant="body2" fontWeight={700} color="#0f172a">
            {count.counted_items || 0}/{count.item_count || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatPercent(count.progress_percent)}% complete
          </Typography>
        </Stack>
      </TableCell>
      <TableCell align="center">
        <Stack spacing={0.25} alignItems="center">
          <Typography variant="body2" fontWeight={700} color="#0f172a">
            {count.variance_count || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatVariance(count.variance_total || 0)} variance
          </Typography>
        </Stack>
      </TableCell>
      <TableCell align="center">
        <Chip size="small" color={statusChip.color} label={statusChip.label} variant="soft" />
      </TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <IconButton
            size="small"
            color="primary"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(count.id);
            }}
          >
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(count.id);
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function CycleCountingMain() {
  const router = useRouter();

  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [activeCountId, setActiveCountId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 400);

  const countListUrl = useMemo(
    () =>
      buildCycleCountQuery({
        search: debouncedSearch,
        status: statusFilter,
        countType: typeFilter,
        warehouse: warehouseFilter,
        page,
        pagination: true,
      }),
    [debouncedSearch, page, statusFilter, typeFilter, warehouseFilter]
  );

  const countSummaryUrl = useMemo(
    () =>
      buildCycleCountQuery({
        search: debouncedSearch,
        status: statusFilter,
        countType: typeFilter,
        warehouse: warehouseFilter,
        page: 0,
        pagination: false,
      }),
    [debouncedSearch, statusFilter, typeFilter, warehouseFilter]
  );

  const {
    data: rawCountList,
    loading: listLoading,
    error: listError,
  } = useGetRequest(countListUrl);
  const { data: rawCountSummary } = useGetRequest(countSummaryUrl);
  const { data: rawWarehouses, loading: warehousesLoading } = useGetRequest(EP.warehouses);

  const rows = useMemo(() => normalizeCollection(rawCountList), [rawCountList]);
  const summaryRows = useMemo(() => normalizeCollection(rawCountSummary), [rawCountSummary]);
  const warehouseOptions = useMemo(
    () =>
      [...normalizeCollection(rawWarehouses)].sort((left, right) =>
        String(left?.name || left?.warehouse_name || '').localeCompare(
          String(right?.name || right?.warehouse_name || ''),
          undefined,
          { sensitivity: 'base' }
        )
      ),
    [rawWarehouses]
  );

  const totalPages = Math.max(1, Number(rawCountList?.total_pages || 1));
  const totalCount = Number(rawCountList?.count || summaryRows.length || 0);

  const summaryMetrics = useMemo(
    () => ({
      total: totalCount,
      open: summaryRows.filter((row) => {
        const status = normalizeStatus(row.status);
        return status === 'scheduled' || status === 'in progress';
      }).length,
      completed: summaryRows.filter((row) => normalizeStatus(row.status) === 'completed').length,
      varianceFlags: summaryRows.reduce((total, row) => total + Number(row.variance_count || 0), 0),
    }),
    [summaryRows, totalCount]
  );

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
    setFormMode('create');
    setActiveCountId(null);
    setFormOpen(true);
  };

  const handleEdit = (countId) => {
    setFormMode('edit');
    setActiveCountId(countId);
    setFormOpen(true);
  };

  const handleDeleteRequest = (countId) => {
    setDeleteId(countId);
  };

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    try {
      await deleteRequest(EP.cycle_count_by_id(deleteId));
      toast.success('Cycle count session deleted successfully.');
      await Promise.all([mutate(countListUrl), mutate(countSummaryUrl)]);
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete the selected cycle count session.');
    }
  };

  const handleSuccess = async (record) => {
    const createdRecordId = formMode === 'create' ? record?.id : null;

    await Promise.all([
      mutate(countListUrl),
      mutate(countSummaryUrl),
      record?.id ? mutate(EP.cycle_count_by_id(record.id)) : Promise.resolve(),
    ]);

    if (createdRecordId) {
      router.push(paths.dashboard.storeInventory.cycleCounting_detail(createdRecordId));
    }
  };

  const openDetails = (countId) => {
    router.push(paths.dashboard.storeInventory.cycleCounting_detail(countId));
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={2}
          alignItems={{ md: 'center' }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700} color="#0f172a" gutterBottom>
              Cycle Counting
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage recurring count sessions with server-side search, warehouse filters,
              pagination, row drilldown, and shared create, edit, and delete actions.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
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
            >
              Create Count Session
            </Button>
          </Stack>
        </Stack>

        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Search, count type, status, warehouse, and pagination now run against the server. Click
          any count session row to open its variance review details.
        </Alert>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Filtered Sessions"
              value={summaryMetrics.total}
              icon="solar:clipboard-list-bold-duotone"
              bgcolor="#1d4ed8"
              boxShadow="0 4px 20px rgba(29, 78, 216, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Open Counts"
              value={summaryMetrics.open}
              icon="solar:clock-circle-bold-duotone"
              bgcolor="#d97706"
              boxShadow="0 4px 20px rgba(217, 119, 6, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Completed"
              value={summaryMetrics.completed}
              icon="solar:check-circle-bold-duotone"
              bgcolor="#059669"
              boxShadow="0 4px 20px rgba(5, 150, 105, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Variance Flags"
              value={summaryMetrics.varianceFlags}
              icon="solar:danger-triangle-bold-duotone"
              bgcolor="#b91c1c"
              boxShadow="0 4px 20px rgba(185, 28, 28, 0.28)"
            />
          </Grid>
        </Grid>

        <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4.5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search count number, warehouse, scope, owner, or reviewer..."
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
                label="Count Type"
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value);
                  setPage(0);
                }}
              >
                {COUNT_TYPE_OPTIONS.map((option) => (
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
                    {warehouse.name || warehouse.warehouse_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Card>

        {listError && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Cycle count sessions could not be loaded from the backend.
          </Alert>
        )}

        <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <TableContainer>
            <Table size={dense ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell align="center" sx={{ width: 56 }}>
                    #
                  </TableCell>
                  <TableCell>Session</TableCell>
                  <TableCell>Warehouse</TableCell>
                  <TableCell align="center">Count Type</TableCell>
                  <TableCell>Scheduled</TableCell>
                  <TableCell>Controllers</TableCell>
                  <TableCell align="center">Progress</TableCell>
                  <TableCell align="center">Variances</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listLoading
                  ? Array.from({ length: 5 }, (_, index) => (
                      <TableRowSkeleton
                        key={index}
                        columns={[
                          { type: 'text', width: 24, align: 'center' },
                          { type: 'text', lines: 2, width: 180 },
                          { type: 'text', width: 150 },
                          { type: 'rect', width: 120, height: 28, align: 'center' },
                          { type: 'text', width: 100 },
                          { type: 'text', lines: 2, width: 150 },
                          { type: 'text', lines: 2, width: 88, align: 'center' },
                          { type: 'text', lines: 2, width: 90, align: 'center' },
                          { type: 'rect', width: 110, height: 28, align: 'center' },
                          { type: 'text', width: 48, align: 'center' },
                        ]}
                      />
                    ))
                  : rows.map((count, index) => (
                      <CountRow
                        key={count.id}
                        count={count}
                        serialNumber={page * 10 + index + 1}
                        onOpenDetails={openDetails}
                        onEdit={handleEdit}
                        onDelete={handleDeleteRequest}
                      />
                    ))}

                {!listLoading && !rows.length && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                      <Stack spacing={2} alignItems="center">
                        <Iconify
                          icon="solar:clipboard-list-line-duotone"
                          width={56}
                          sx={{ color: '#cbd5e1' }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          No cycle count sessions found
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
                {totalCount} session{totalCount === 1 ? '' : 's'} matched
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
      </Stack>

      <CycleCountingFormDialog
        open={formOpen}
        mode={formMode}
        countId={activeCountId}
        onClose={() => {
          setFormOpen(false);
          setActiveCountId(null);
        }}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete Cycle Count Session"
        content="Deleting this cycle count session will remove its counted lines and variance review record."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
