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
import BackorderFormDialog from './backorder-form-dialog';

const EP = endpoints.storeInventory;

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Pending Quality Check', label: 'Pending Quality Check' },
  { value: 'Pending Approval', label: 'Pending Approval' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Posted to Stock', label: 'Posted to Stock' },
];

function formatDate(value) {
  if (!value) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(value));
}

function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function normalizeCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.results) ? payload.results : [];
}

function getStatusChipProps(status) {
  switch (normalizeStatus(status)) {
    case 'posted':
    case 'posted to stock':
      return { color: 'secondary', label: 'Posted to Stock' };
    case 'pending approval':
      return { color: 'warning', label: 'Pending Approval' };
    case 'pending quality check':
      return { color: 'warning', label: 'Pending Quality Check' };
    case 'approved':
      return { color: 'success', label: 'Approved' };
    case 'draft':
      return { color: 'default', label: 'Draft' };
    default:
      return { color: 'default', label: status || 'Unknown' };
  }
}

function buildBackorderQuery({ search, status, vendor, warehouse, page, pagination }) {
  const params = new URLSearchParams();

  params.set('ordering', '-receive_date');

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (status) {
    params.set('status', status);
  }

  if (vendor) {
    params.set('vendor', String(vendor));
  }

  if (warehouse) {
    params.set('warehouse', String(warehouse));
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String(page + 1));
  }

  return `${EP.backorders}?${params.toString()}`;
}

function BackorderRow({ backorder, serialNumber, onOpenDetails, onEdit, onDelete }) {
  const statusChip = getStatusChipProps(backorder.status);
  const receivedQty = Math.max(
    Number(backorder.ordered_qty_total || 0) - Number(backorder.pending_qty_total || 0),
    0
  );

  return (
    <TableRow
      hover
      onClick={() => onOpenDetails(backorder.id)}
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
            {backorder.grn_number || 'Unnumbered backorder'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Invoice {backorder.invoice_number || 'Not captured'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={600} color="#0f172a">
            {backorder.vendor_name || backorder.supplier_name || 'Vendor not linked'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            PO {backorder.po_number_display || backorder.po_number || 'Not linked'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#475569">
          {backorder.warehouse_name || 'Warehouse not assigned'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#475569">
          {formatDate(backorder.receive_date)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Stack spacing={0.25} alignItems="center">
          <Typography variant="body2" fontWeight={700} color="#0f172a">
            {backorder.item_count || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Received {receivedQty.toLocaleString('en-BD')}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2" fontWeight={700} color="#b45309">
          {Number(backorder.pending_qty_total || 0).toLocaleString('en-BD')}
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
              onEdit(backorder.id);
            }}
          >
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(backorder.id);
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function BackordersMain() {
  const router = useRouter();

  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [activeBackorderId, setActiveBackorderId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 400);

  const backorderListUrl = useMemo(
    () =>
      buildBackorderQuery({
        search: debouncedSearch,
        status: statusFilter,
        vendor: vendorFilter,
        warehouse: warehouseFilter,
        page,
        pagination: true,
      }),
    [debouncedSearch, page, statusFilter, vendorFilter, warehouseFilter]
  );

  const backorderSummaryUrl = useMemo(
    () =>
      buildBackorderQuery({
        search: debouncedSearch,
        status: statusFilter,
        vendor: vendorFilter,
        warehouse: warehouseFilter,
        page: 0,
        pagination: false,
      }),
    [debouncedSearch, statusFilter, vendorFilter, warehouseFilter]
  );

  const {
    data: rawBackorderList,
    loading: listLoading,
    error: listError,
  } = useGetRequest(backorderListUrl);
  const { data: rawBackorderSummary } = useGetRequest(backorderSummaryUrl);
  const { data: rawVendors, loading: vendorsLoading } = useGetRequest(EP.vendors);
  const { data: rawWarehouses, loading: warehousesLoading } = useGetRequest(EP.warehouses);

  const rows = useMemo(() => normalizeCollection(rawBackorderList), [rawBackorderList]);
  const summaryRows = useMemo(
    () => normalizeCollection(rawBackorderSummary),
    [rawBackorderSummary]
  );
  const vendorOptions = useMemo(
    () =>
      [...normalizeCollection(rawVendors)].sort((left, right) =>
        String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawVendors]
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

  const totalPages = Math.max(1, Number(rawBackorderList?.total_pages || 1));
  const totalCount = Number(rawBackorderList?.count || summaryRows.length || 0);

  const summaryMetrics = useMemo(
    () => ({
      total: totalCount,
      pendingQuality: summaryRows.filter(
        (row) => normalizeStatus(row.status) === 'pending quality check'
      ).length,
      pendingApproval: summaryRows.filter(
        (row) => normalizeStatus(row.status) === 'pending approval'
      ).length,
      pendingQty: summaryRows.reduce((total, row) => total + Number(row.pending_qty_total || 0), 0),
    }),
    [summaryRows, totalCount]
  );

  const canResetFilters = Boolean(
    searchQuery.trim() || statusFilter || vendorFilter || warehouseFilter || page !== 0
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setVendorFilter('');
    setWarehouseFilter('');
    setPage(0);
  };

  const handleCreate = () => {
    setFormMode('create');
    setActiveBackorderId(null);
    setFormOpen(true);
  };

  const handleEdit = (backorderId) => {
    setFormMode('edit');
    setActiveBackorderId(backorderId);
    setFormOpen(true);
  };

  const handleDeleteRequest = (backorderId) => {
    setDeleteId(backorderId);
  };

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    try {
      await deleteRequest(EP.backorder_by_id(deleteId));
      toast.success('Backorder deleted successfully.');
      await Promise.all([mutate(backorderListUrl), mutate(backorderSummaryUrl)]);
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete the selected backorder.');
    }
  };

  const handleSuccess = async (record) => {
    await Promise.all([
      mutate(backorderListUrl),
      mutate(backorderSummaryUrl),
      record?.id ? mutate(EP.backorder_by_id(record.id)) : Promise.resolve(),
    ]);
  };

  const openDetails = (backorderId) => {
    router.push(paths.dashboard.storeInventory.backorders_detail(backorderId));
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
              Backorders
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track supplier receipts that still have outstanding quantities with server-side
              search, filters, pagination, row drilldown, and inline create, edit, and delete
              actions.
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
              Create Backorder
            </Button>
          </Stack>
        </Stack>

        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Backorders are now filtered by the backend to receipts with outstanding quantities only.
          Search, status, vendor, warehouse, and pagination all run on the server.
        </Alert>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Filtered Backorders"
              value={summaryMetrics.total}
              icon="solar:clipboard-list-bold-duotone"
              bgcolor="#1d4ed8"
              boxShadow="0 4px 20px rgba(29, 78, 216, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Pending Quality"
              value={summaryMetrics.pendingQuality}
              icon="solar:shield-warning-bold-duotone"
              bgcolor="#d97706"
              boxShadow="0 4px 20px rgba(217, 119, 6, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Pending Approval"
              value={summaryMetrics.pendingApproval}
              icon="solar:clock-circle-bold-duotone"
              bgcolor="#b45309"
              boxShadow="0 4px 20px rgba(180, 83, 9, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Outstanding Qty"
              value={Number(summaryMetrics.pendingQty || 0).toLocaleString('en-BD')}
              icon="solar:sort-by-time-bold-duotone"
              bgcolor="#7c2d12"
              boxShadow="0 4px 20px rgba(124, 45, 18, 0.28)"
            />
          </Grid>
        </Grid>

        <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search backorder number, invoice, vendor, PO, warehouse..."
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
            <Grid size={{ xs: 12, md: 2.333 }}>
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
            <Grid size={{ xs: 12, md: 2.333 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Vendor"
                value={vendorFilter}
                onChange={(event) => {
                  setVendorFilter(event.target.value);
                  setPage(0);
                }}
                disabled={vendorsLoading}
              >
                <MenuItem value="">All Vendors</MenuItem>
                {vendorOptions.map((vendor) => (
                  <MenuItem key={vendor.id} value={String(vendor.id)}>
                    {vendor.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 2.334 }}>
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
            Backorder records could not be loaded from the backend.
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
                  <TableCell>Backorder</TableCell>
                  <TableCell>Vendor / PO</TableCell>
                  <TableCell>Warehouse</TableCell>
                  <TableCell>Receive Date</TableCell>
                  <TableCell align="center">Items</TableCell>
                  <TableCell align="center">Pending Qty</TableCell>
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
                          { type: 'text', lines: 2, width: 150 },
                          { type: 'text', lines: 2, width: 160 },
                          { type: 'text', width: 120 },
                          { type: 'text', width: 90 },
                          { type: 'text', width: 60, align: 'center' },
                          { type: 'text', width: 72, align: 'center' },
                          { type: 'rect', width: 120, height: 28, align: 'center' },
                          { type: 'text', width: 48, align: 'center' },
                        ]}
                      />
                    ))
                  : rows.map((backorder, index) => (
                      <BackorderRow
                        key={backorder.id}
                        backorder={backorder}
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
                          icon="solar:clipboard-remove-line-duotone"
                          width={56}
                          sx={{ color: '#cbd5e1' }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          No backorders found
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
                {totalCount} backorder{totalCount === 1 ? '' : 's'} matched
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

      <BackorderFormDialog
        open={formOpen}
        mode={formMode}
        backorderId={activeBackorderId}
        onClose={() => {
          setFormOpen(false);
          setActiveBackorderId(null);
        }}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete Backorder"
        content="Deleting this backorder will also remove its generated stock movements."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
