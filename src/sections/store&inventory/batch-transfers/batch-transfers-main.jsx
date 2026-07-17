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
import StockTransferFormDialog from '../stock-transfer/stock-transfer-form-dialog';

const EP = endpoints.storeInventory;

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'Draft', label: 'Draft' },
  { value: 'In Transit', label: 'In Transit' },
  { value: 'Received', label: 'Received' },
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

function getStatusChipProps(status) {
  switch (normalizeStatus(status)) {
    case 'received':
      return { color: 'success', label: 'Received' };
    case 'in transit':
      return { color: 'info', label: 'In Transit' };
    case 'cancelled':
      return { color: 'error', label: 'Cancelled' };
    case 'draft':
      return { color: 'default', label: 'Draft' };
    default:
      return { color: 'default', label: status || 'Unknown' };
  }
}

function buildTransferQuery({ search, status, fromWarehouse, toWarehouse, page, pagination }) {
  const params = new URLSearchParams();

  params.set('ordering', '-transfer_date');

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (status) {
    params.set('status', status);
  }

  if (fromWarehouse) {
    params.set('from_warehouse', String(fromWarehouse));
  }

  if (toWarehouse) {
    params.set('to_warehouse', String(toWarehouse));
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String(page + 1));
  }

  return `${EP.batch_transfers}?${params.toString()}`;
}

function TransferRow({ transfer, serialNumber, onOpenDetails, onEdit, onDelete }) {
  const statusChip = getStatusChipProps(transfer.status);

  return (
    <TableRow
      hover
      onClick={() => onOpenDetails(transfer.id)}
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
            {transfer.transfer_number || 'Unnumbered batch transfer'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {transfer.vehicle_number || 'Vehicle pending'}
            {transfer.driver_name ? ` • ${transfer.driver_name}` : ''}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={600} color="#0f172a">
            {transfer.from_warehouse_name || transfer.from_location || 'Source pending'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            To {transfer.to_warehouse_name || transfer.to_location || 'Destination pending'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#475569">
          {formatDate(transfer.transfer_date)}
        </Typography>
      </TableCell>
      <TableCell>
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={600} color="#0f172a">
            {transfer.sent_by_name || 'Sender pending'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {transfer.received_by_name || 'Receiver pending'} • Qty{' '}
            {Number(transfer.quantity_total || 0).toLocaleString('en-BD')}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell align="center">
        <Stack spacing={0.25} alignItems="center">
          <Typography variant="body2" fontWeight={700} color="#0f172a">
            {transfer.item_count || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            lines
          </Typography>
        </Stack>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight={700} color="#0f172a">
          {formatCurrency(transfer.total_value)}
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
              onEdit(transfer.id);
            }}
          >
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(transfer.id);
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function BatchTransfersMain() {
  const router = useRouter();

  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromWarehouseFilter, setFromWarehouseFilter] = useState('');
  const [toWarehouseFilter, setToWarehouseFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [activeTransferId, setActiveTransferId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 400);

  const transferListUrl = useMemo(
    () =>
      buildTransferQuery({
        search: debouncedSearch,
        status: statusFilter,
        fromWarehouse: fromWarehouseFilter,
        toWarehouse: toWarehouseFilter,
        page,
        pagination: true,
      }),
    [debouncedSearch, fromWarehouseFilter, page, statusFilter, toWarehouseFilter]
  );

  const transferSummaryUrl = useMemo(
    () =>
      buildTransferQuery({
        search: debouncedSearch,
        status: statusFilter,
        fromWarehouse: fromWarehouseFilter,
        toWarehouse: toWarehouseFilter,
        page: 0,
        pagination: false,
      }),
    [debouncedSearch, fromWarehouseFilter, statusFilter, toWarehouseFilter]
  );

  const {
    data: rawTransferList,
    loading: listLoading,
    error: listError,
  } = useGetRequest(transferListUrl);
  const { data: rawTransferSummary } = useGetRequest(transferSummaryUrl);
  const { data: rawWarehouses, loading: warehousesLoading } = useGetRequest(EP.warehouses);

  const rows = useMemo(() => normalizeCollection(rawTransferList), [rawTransferList]);
  const summaryRows = useMemo(() => normalizeCollection(rawTransferSummary), [rawTransferSummary]);
  const warehouseOptions = useMemo(
    () =>
      [...normalizeCollection(rawWarehouses)].sort((left, right) =>
        String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawWarehouses]
  );

  const totalPages = Math.max(1, Number(rawTransferList?.total_pages || 1));
  const totalCount = Number(rawTransferList?.count || summaryRows.length || 0);

  const summaryMetrics = useMemo(
    () => ({
      total: totalCount,
      draft: summaryRows.filter((row) => normalizeStatus(row.status) === 'draft').length,
      inTransit: summaryRows.filter((row) => normalizeStatus(row.status) === 'in transit').length,
      received: summaryRows.filter((row) => normalizeStatus(row.status) === 'received').length,
    }),
    [summaryRows, totalCount]
  );

  const canResetFilters = Boolean(
    searchQuery.trim() || statusFilter || fromWarehouseFilter || toWarehouseFilter || page !== 0
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setFromWarehouseFilter('');
    setToWarehouseFilter('');
    setPage(0);
  };

  const handleCreate = () => {
    setFormMode('create');
    setActiveTransferId(null);
    setFormOpen(true);
  };

  const handleEdit = (transferId) => {
    setFormMode('edit');
    setActiveTransferId(transferId);
    setFormOpen(true);
  };

  const handleDeleteRequest = (transferId) => {
    setDeleteId(transferId);
  };

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    try {
      await deleteRequest(EP.batch_transfer_by_id(deleteId));
      toast.success('Batch transfer deleted successfully.');
      await Promise.all([mutate(transferListUrl), mutate(transferSummaryUrl)]);
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete the selected batch transfer.');
    }
  };

  const handleSuccess = async (record) => {
    const createdRecordId = formMode === 'create' ? record?.id : null;

    await Promise.all([
      mutate(transferListUrl),
      mutate(transferSummaryUrl),
      record?.id ? mutate(EP.batch_transfer_by_id(record.id)) : Promise.resolve(),
    ]);

    if (createdRecordId) {
      router.push(paths.dashboard.storeInventory.batchTransfers_detail(createdRecordId));
    }
  };

  const openDetails = (transferId) => {
    router.push(paths.dashboard.storeInventory.batchTransfers_detail(transferId));
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
              Batch Transfers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage grouped warehouse transfers with server-side search, route filters, pagination,
              row drilldown, and inline create, edit, and delete actions.
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
              Create Batch Transfer
            </Button>
          </Stack>
        </Stack>

        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Search now runs on the server across transfer number, item code, item name, route,
          vehicle, driver, and staff. Click any batch transfer row to open its full movement
          details.
        </Alert>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Filtered Transfers"
              value={summaryMetrics.total}
              icon="solar:transfer-horizontal-bold-duotone"
              bgcolor="#1d4ed8"
              boxShadow="0 4px 20px rgba(29, 78, 216, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Draft"
              value={summaryMetrics.draft}
              icon="solar:document-add-bold-duotone"
              bgcolor="#7c3aed"
              boxShadow="0 4px 20px rgba(124, 58, 237, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="In Transit"
              value={summaryMetrics.inTransit}
              icon="solar:truck-bold-duotone"
              bgcolor="#0284c7"
              boxShadow="0 4px 20px rgba(2, 132, 199, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Received"
              value={summaryMetrics.received}
              icon="solar:check-circle-bold-duotone"
              bgcolor="#059669"
              boxShadow="0 4px 20px rgba(5, 150, 105, 0.28)"
            />
          </Grid>
        </Grid>

        <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search transfer number, item code, item name, route, vehicle, or staff..."
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
            <Grid size={{ xs: 12, md: 2.25 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Source Warehouse"
                value={fromWarehouseFilter}
                onChange={(event) => {
                  setFromWarehouseFilter(event.target.value);
                  setPage(0);
                }}
                disabled={warehousesLoading}
              >
                <MenuItem value="">All Sources</MenuItem>
                {warehouseOptions.map((warehouse) => (
                  <MenuItem key={warehouse.id} value={String(warehouse.id)}>
                    {warehouse.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 2.25 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Destination Warehouse"
                value={toWarehouseFilter}
                onChange={(event) => {
                  setToWarehouseFilter(event.target.value);
                  setPage(0);
                }}
                disabled={warehousesLoading}
              >
                <MenuItem value="">All Destinations</MenuItem>
                {warehouseOptions.map((warehouse) => (
                  <MenuItem key={warehouse.id} value={String(warehouse.id)}>
                    {warehouse.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #e5e7eb' }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ sm: 'center' }}
              spacing={1.5}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Batch Transfer Register
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {totalCount.toLocaleString('en-BD')} transfer records matched the current server
                  filters.
                </Typography>
              </Box>
            </Stack>
          </Box>

          {listError && (
            <Alert severity="error" sx={{ m: 2 }}>
              Failed to load the batch transfer list. Please refresh the page and try again.
            </Alert>
          )}

          <TableContainer>
            <Table size={dense ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell align="center">#</TableCell>
                  <TableCell>Transfer</TableCell>
                  <TableCell>Route</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Responsible Team</TableCell>
                  <TableCell align="center">Lines</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listLoading &&
                  Array.from({ length: 6 }).map((_, index) => (
                    <TableRowSkeleton
                      key={`batch-transfer-skeleton-${index + 1}`}
                      columns={[
                        { type: 'text', width: 24, align: 'center' },
                        { type: 'text', lines: 2, width: 180 },
                        { type: 'text', lines: 2, width: 180 },
                        { type: 'text', width: 100 },
                        { type: 'text', lines: 2, width: 170 },
                        { type: 'text', width: 60, align: 'center' },
                        { type: 'text', width: 90, align: 'right' },
                        { type: 'rect', width: 120, height: 28, align: 'center' },
                        { type: 'text', width: 48, align: 'center' },
                      ]}
                    />
                  ))}

                {!listLoading &&
                  rows.map((transfer, index) => (
                    <TransferRow
                      key={transfer.id}
                      transfer={transfer}
                      serialNumber={page * 10 + index + 1}
                      onOpenDetails={openDetails}
                      onEdit={handleEdit}
                      onDelete={handleDeleteRequest}
                    />
                  ))}

                {!listLoading && !rows.length && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <Stack spacing={1} alignItems="center">
                        <Iconify
                          icon="solar:transfer-horizontal-bold-duotone"
                          width={32}
                          color="#94a3b8"
                        />
                        <Typography variant="subtitle1" fontWeight={700}>
                          No batch transfers found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Change the filters or create a new batch transfer to start the flow.
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              px: 2.5,
              py: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e5e7eb',
              flexWrap: 'wrap',
              gap: 1.5,
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <FormControlLabel
                control={
                  <Switch checked={dense} onChange={(event) => setDense(event.target.checked)} />
                }
                label="Dense rows"
                sx={{ m: 0 }}
              />

              <Typography variant="body2" color="text.secondary">
                Page {page + 1} of {totalPages}
              </Typography>
            </Stack>

            <Pagination
              page={page + 1}
              count={totalPages}
              color="primary"
              onChange={(_, value) => setPage(value - 1)}
              showFirstButton
              showLastButton
            />
          </Box>
        </Card>
      </Stack>

      <StockTransferFormDialog
        open={formOpen}
        mode={formMode}
        transferId={activeTransferId}
        onClose={() => setFormOpen(false)}
        onSuccess={handleSuccess}
        entityLabel="Batch Transfer"
        listEndpoint={EP.batch_transfers}
        detailEndpointBuilder={EP.batch_transfer_by_id}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete Batch Transfer"
        content="Deleting this batch transfer will also remove its generated stock movements."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
