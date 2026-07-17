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

import ReturnsFormDialog from './returns-form-dialog';
import SummaryCard from '../../_components/summary-card';

const EP = endpoints.storeInventory;

const RETURN_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'customer', label: 'Customer Return' },
  { value: 'supplier', label: 'Supplier Return' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Pending Inspection', label: 'Pending Inspection' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Done', label: 'Done' },
  { value: 'Cancelled', label: 'Cancelled' },
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

function getStatusChipProps(status) {
  switch (normalizeStatus(status)) {
    case 'done':
    case 'completed':
      return { color: 'success', label: 'Done' };
    case 'approved':
      return { color: 'info', label: 'Approved' };
    case 'pending inspection':
      return { color: 'warning', label: 'Pending Inspection' };
    case 'cancelled':
      return { color: 'error', label: 'Cancelled' };
    case 'draft':
      return { color: 'default', label: 'Draft' };
    default:
      return { color: 'default', label: status || 'Unknown' };
  }
}

function getReturnTypeLabel(returnType, returnTypeLabel) {
  if (returnTypeLabel) {
    return returnTypeLabel;
  }

  return returnType === 'supplier' ? 'Supplier Return' : 'Customer Return';
}

function formatDate(value) {
  if (!value) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(value));
}

function formatQuantity(value) {
  return Number(value || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function buildReturnQuery({ search, returnType, status, warehouse, page, pagination }) {
  const params = new URLSearchParams();

  params.set('ordering', '-date');

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (returnType) {
    params.set('return_type', returnType);
  }

  if (status) {
    params.set('status', status);
  }

  if (warehouse) {
    params.set('warehouse', String(warehouse));
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String(page + 1));
  }

  return `${EP.return_records}?${params.toString()}`;
}

function ReturnRow({ returnRecord, serialNumber, onOpenDetails, onEdit, onDelete }) {
  const statusChip = getStatusChipProps(returnRecord.status);

  return (
    <TableRow
      hover
      onClick={() => onOpenDetails(returnRecord.id)}
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
            {returnRecord.reference || 'Unnumbered return'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {returnRecord.original_reference || 'Original reference pending'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={600} color="#0f172a">
            {returnRecord.product_name || 'Product pending'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {returnRecord.product_code || 'Code pending'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" color="#475569">
            {getReturnTypeLabel(returnRecord.return_type, returnRecord.return_type_label)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {returnRecord.condition || 'Condition pending'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#475569">
          {returnRecord.warehouse_name || 'Warehouse pending'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#475569">
          {formatDate(returnRecord.date)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2" fontWeight={700} color="#0f172a">
          {formatQuantity(returnRecord.quantity)}
        </Typography>
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
              onEdit(returnRecord.id);
            }}
          >
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(returnRecord.id);
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function ReturnsMain() {
  const router = useRouter();

  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [activeReturnId, setActiveReturnId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 400);

  const returnListUrl = useMemo(
    () =>
      buildReturnQuery({
        search: debouncedSearch,
        returnType: typeFilter,
        status: statusFilter,
        warehouse: warehouseFilter,
        page,
        pagination: true,
      }),
    [debouncedSearch, page, statusFilter, typeFilter, warehouseFilter]
  );

  const returnSummaryUrl = useMemo(
    () =>
      buildReturnQuery({
        search: debouncedSearch,
        returnType: typeFilter,
        status: statusFilter,
        warehouse: warehouseFilter,
        page: 0,
        pagination: false,
      }),
    [debouncedSearch, statusFilter, typeFilter, warehouseFilter]
  );

  const {
    data: rawReturnList,
    loading: listLoading,
    error: listError,
  } = useGetRequest(returnListUrl);
  const { data: rawReturnSummary } = useGetRequest(returnSummaryUrl);
  const { data: rawWarehouses, loading: warehousesLoading } = useGetRequest(EP.warehouses);

  const rows = useMemo(() => normalizeCollection(rawReturnList), [rawReturnList]);
  const summaryRows = useMemo(() => normalizeCollection(rawReturnSummary), [rawReturnSummary]);
  const warehouseOptions = useMemo(
    () =>
      [...normalizeCollection(rawWarehouses)].sort((left, right) =>
        String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawWarehouses]
  );

  const totalPages = Math.max(1, Number(rawReturnList?.total_pages || 1));
  const totalCount = Number(rawReturnList?.count || summaryRows.length || 0);

  const summaryMetrics = useMemo(
    () => ({
      total: totalCount,
      customer: summaryRows.filter((row) => row.return_type === 'customer').length,
      supplier: summaryRows.filter((row) => row.return_type === 'supplier').length,
      open: summaryRows.filter((row) => normalizeStatus(row.status) !== 'done').length,
    }),
    [summaryRows, totalCount]
  );

  const canResetFilters = Boolean(
    searchQuery.trim() || typeFilter || statusFilter || warehouseFilter || page !== 0
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setStatusFilter('');
    setWarehouseFilter('');
    setPage(0);
  };

  const handleCreate = () => {
    setFormMode('create');
    setActiveReturnId(null);
    setFormOpen(true);
  };

  const handleEdit = (returnId) => {
    setFormMode('edit');
    setActiveReturnId(returnId);
    setFormOpen(true);
  };

  const handleDeleteRequest = (returnId) => {
    setDeleteId(returnId);
  };

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    try {
      await deleteRequest(EP.return_record_by_id(deleteId));
      await Promise.all([mutate(returnListUrl), mutate(returnSummaryUrl)]);
      toast.success('Return deleted successfully.');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete the selected return.');
    }
  };

  const handleSuccess = async (record) => {
    const createdRecordId = formMode === 'create' ? record?.id : null;

    await Promise.all([
      mutate(returnListUrl),
      mutate(returnSummaryUrl),
      record?.id ? mutate(EP.return_record_by_id(record.id)) : Promise.resolve(),
    ]);

    if (createdRecordId) {
      router.push(paths.dashboard.storeInventory.returns_detail(createdRecordId));
    }
  };

  const openDetails = (returnId) => {
    router.push(paths.dashboard.storeInventory.returns_detail(returnId));
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
              Returns
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage reverse inventory flows with server-side search, filters, pagination, row
              drilldown, and shared create, edit, and delete actions.
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
              Create Return
            </Button>
          </Stack>
        </Stack>

        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Search, type, status, warehouse, and pagination now run against the server. Click any
          return row to open its full return details.
        </Alert>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Filtered Returns"
              value={summaryMetrics.total}
              icon="solar:arrow-left-down-bold-duotone"
              bgcolor="#1d4ed8"
              boxShadow="0 4px 20px rgba(29, 78, 216, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Customer Returns"
              value={summaryMetrics.customer}
              icon="solar:user-bold-duotone"
              bgcolor="#0284c7"
              boxShadow="0 4px 20px rgba(2, 132, 199, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Supplier Returns"
              value={summaryMetrics.supplier}
              icon="solar:buildings-2-bold-duotone"
              bgcolor="#7c3aed"
              boxShadow="0 4px 20px rgba(124, 58, 237, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Open Returns"
              value={summaryMetrics.open}
              icon="solar:clock-circle-bold-duotone"
              bgcolor="#d97706"
              boxShadow="0 4px 20px rgba(217, 119, 6, 0.28)"
            />
          </Grid>
        </Grid>

        <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search reference, original ref, product, warehouse, or reason..."
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
                label="Return Type"
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value);
                  setPage(0);
                }}
              >
                {RETURN_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 2.25 }}>
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
            <Grid size={{ xs: 12, md: 2.25 }}>
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

        {listError && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Return records could not be loaded from the backend.
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
                  <TableCell>Reference</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Type / Condition</TableCell>
                  <TableCell>Warehouse</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Quantity</TableCell>
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
                          { type: 'text', lines: 2, width: 160 },
                          { type: 'text', lines: 2, width: 160 },
                          { type: 'text', lines: 2, width: 150 },
                          { type: 'text', width: 120 },
                          { type: 'text', width: 100 },
                          { type: 'text', width: 72, align: 'center' },
                          { type: 'rect', width: 120, height: 28, align: 'center' },
                          { type: 'text', width: 48, align: 'center' },
                        ]}
                      />
                    ))
                  : rows.map((returnRecord, index) => (
                      <ReturnRow
                        key={returnRecord.id}
                        returnRecord={returnRecord}
                        serialNumber={page * 10 + index + 1}
                        onOpenDetails={openDetails}
                        onEdit={handleEdit}
                        onDelete={handleDeleteRequest}
                      />
                    ))}

                {!listLoading && !rows.length && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <Stack spacing={2} alignItems="center">
                        <Iconify
                          icon="solar:arrow-left-down-line-duotone"
                          width={56}
                          sx={{ color: '#cbd5e1' }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          No returns found
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
                {totalCount} return{totalCount === 1 ? '' : 's'} matched
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

      <ReturnsFormDialog
        open={formOpen}
        mode={formMode}
        returnId={activeReturnId}
        onClose={() => {
          setFormOpen(false);
          setActiveReturnId(null);
        }}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete Return Record"
        content="Deleting this return will also remove its generated stock movement audit row."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
