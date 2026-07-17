'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
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

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

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

import { renderStatusChip } from '../shared/inventory-desk-page';
import {
  toWarehouseOptions,
  WarehouseFormDialog,
  getEmptyWarehouseForm,
  getWarehouseTypeLabel,
  validateWarehouseForm,
  normalizeWarehouseForm,
  warehouseFormToPayload,
  WAREHOUSE_ORDER_OPTIONS,
  WAREHOUSE_STATUS_FILTER_OPTIONS,
} from './warehouse-form-dialog';

const STORE_EP = endpoints.storeInventory;
const OFFICE_EP = endpoints.procurement_management.office_management;

function WarehouseRow({ row, serialNumber, onOpenDetails, onEdit, onDelete }) {
  const typeValue = row.warehouse_type || row.type;
  const warehouseTypeLabel = getWarehouseTypeLabel(typeValue);

  return (
    <TableRow
      hover
      onClick={() => onOpenDetails(row.id)}
      sx={{
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <TableCell align="center" sx={{ width: 56 }}>
        <Typography variant="body2" fontWeight={700} color="text.secondary">
          {serialNumber}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {row.code}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {row.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.address || 'No address recorded'}
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
          {row.phone || 'No phone'}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" color="text.secondary">
          {row.budgetAllocation ? `৳${Number(row.budgetAllocation).toLocaleString('en-BD')}` : '—'}
        </Typography>
      </TableCell>
      <TableCell align="center">
        {renderStatusChip(row.status ?? (row.is_active ? 'Active' : 'Inactive'))}
      </TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <IconButton
            size="small"
            color="primary"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(row);
            }}
          >
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(row);
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function WarehousesMain() {
  const confirm = useBoolean();
  const router = useRouter();
  const theme = useTheme();

  const isDark = theme.palette.mode === 'dark';
  const panelSx = {
    borderRadius: 3,
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: theme.palette.background.paper,
  };
  const tableHeadBg = alpha(theme.palette.text.primary, isDark ? 0.12 : 0.04);
  const primaryGradient = `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.info.main})`;
  const primaryGradientHover = `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.info.dark})`;

  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [form, setForm] = useState(getEmptyWarehouseForm());
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const listUrl = useMemo(() => {
    const params = new URLSearchParams();

    params.set('type', 'warehouse');

    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }

    if (statusFilter !== '') {
      params.set('status', statusFilter);
    }

    if (ordering) {
      params.set('ordering', ordering);
    }

    params.set('pagination', 'true');
    params.set('page', String(page + 1));

    return `${OFFICE_EP}?${params.toString()}`;
  }, [ordering, page, searchQuery, statusFilter]);

  const summaryUrl = useMemo(() => {
    const params = new URLSearchParams();

    params.set('type', 'warehouse');

    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }

    if (statusFilter !== '') {
      params.set('status', statusFilter);
    }

    if (ordering) {
      params.set('ordering', ordering);
    }

    params.set('pagination', 'false');

    return `${OFFICE_EP}?${params.toString()}`;
  }, [ordering, searchQuery, statusFilter]);

  const {
    data: rawWarehouseList,
    loading: warehouseListLoading,
    error: warehouseListError,
  } = useGetRequest(listUrl);
  const { data: rawWarehouseSummary, loading: warehouseSummaryLoading } = useGetRequest(summaryUrl);

  const rows = useMemo(() => toWarehouseOptions(rawWarehouseList), [rawWarehouseList]);
  const summaryRows = useMemo(() => toWarehouseOptions(rawWarehouseSummary), [rawWarehouseSummary]);

  const summaryMetrics = useMemo(
    () => ({
      total: summaryRows.length,
      active: summaryRows.filter((row) => String(row.status).toLowerCase() === 'active').length,
      regions: new Set(summaryRows.map((row) => row.division || '').filter(Boolean)).size,
      totalLocations: summaryRows.reduce((sum, row) => sum + Number(row.location_count || 0), 0),
    }),
    [summaryRows]
  );

  const totalPages = rawWarehouseList?.total_pages || 1;
  const rowsPerPage = rawWarehouseList?.page_size || 10;

  const revalidateWarehouseQueries = async () => {
    await mutate(
      (key) =>
        typeof key === 'string' &&
        (key.startsWith(OFFICE_EP) || key.startsWith(STORE_EP.warehouses))
    );
  };

  const openDetails = (id) => {
    router.push(paths.dashboard.procurement.settings.officeDetail(id));
  };

  const openCreateDialog = () => {
    setEditingWarehouse(null);
    setForm(getEmptyWarehouseForm());
    setDialogOpen(true);
  };

  const openEditDialog = (warehouse) => {
    setEditingWarehouse(warehouse);
    setForm(normalizeWarehouseForm(warehouse));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (submitting) {
      return;
    }

    setDialogOpen(false);
    setEditingWarehouse(null);
    setForm(getEmptyWarehouseForm());
  };

  const handleSubmit = async () => {
    const validationMessage = validateWarehouseForm(form);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      const payload = warehouseFormToPayload(form);

      if (editingWarehouse) {
        await putRequest(STORE_EP.warehouse_by_id(editingWarehouse.id), payload);
        toast.success('Warehouse updated successfully.');
      } else {
        await createRequest(STORE_EP.warehouses, payload);
        toast.success('Warehouse created successfully.');
      }

      closeDialog();
      await revalidateWarehouseQueries();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError?.response?.data || requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteRequest(STORE_EP.warehouse_by_id(deleteTarget.id));
      toast.success('Warehouse deleted successfully.');
      await revalidateWarehouseQueries();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError?.response?.data || requestError));
    } finally {
      setDeleting(false);
      confirm.onFalse();
      setDeleteTarget(null);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setOrdering('-created_at');
    setPage(0);
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
              <Iconify icon="solar:buildings-bold-duotone" width={28} />
              <Typography variant="h4" fontWeight={800} color="text.primary">
                Warehouses
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Manage warehouse master data with live backend pagination, server-side search and
              filters, and row-to-detail navigation.
            </Typography>
          </Box>

          {/* <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={openCreateDialog}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              color: theme.palette.primary.contrastText,
              background: primaryGradient,
              '&:hover': {
                background: primaryGradientHover,
              },
            }}
          >
            Add Warehouse
          </Button> */}
          <></>
        </Stack>

        <Alert severity={warehouseListError ? 'error' : 'info'} sx={{ borderRadius: 2 }}>
          {warehouseListError
            ? 'Failed to load warehouses. Check the backend response or active filters and try again.'
            : 'This page now loads warehouse records from the unified office management API using a backend type filter and live search.'}
        </Alert>

        <Grid container spacing={3}>
          {[
            {
              label: 'Matching Warehouses',
              value: summaryMetrics.total,
              helper: 'Records matched by the current server-side filters.',
              color: theme.palette.primary.main,
              icon: 'solar:buildings-bold-duotone',
            },
            {
              label: 'Active Warehouses',
              value: summaryMetrics.active,
              helper: 'Warehouses currently available for operations.',
              color: theme.palette.success.main,
              icon: 'solar:check-circle-bold-duotone',
            },
            {
              label: 'Regions',
              value: summaryMetrics.regions,
              helper: 'Unique divisions or regions in the current warehouse set.',
              color: theme.palette.info.main,
              icon: 'solar:map-point-bold-duotone',
            },
            {
              label: 'Linked Locations',
              value: summaryMetrics.totalLocations,
              helper: 'Storage locations counted across the matched result set.',
              color: theme.palette.warning.main,
              icon: 'solar:box-bold-duotone',
            },
          ].map((card) => (
            <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card sx={panelSx}>
                <Box sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        {card.label}
                      </Typography>
                      <Typography variant="h4" fontWeight={800} color="text.primary">
                        {warehouseSummaryLoading ? '...' : card.value}
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
                  <Typography variant="body2" color="text.secondary" mt={1.5}>
                    {card.helper}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card sx={panelSx}>
          <Box sx={{ p: 2.5 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by name, code, address, or phone"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
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
                  {WAREHOUSE_STATUS_FILTER_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Order"
                  value={ordering}
                  onChange={(event) => {
                    setOrdering(event.target.value);
                    setPage(0);
                  }}
                >
                  {WAREHOUSE_ORDER_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 1.5 }}>
                <Stack
                  direction={{ xs: 'row', md: 'column' }}
                  spacing={1}
                  justifyContent={{ xs: 'space-between', md: 'center' }}
                  alignItems={{ xs: 'center', md: 'flex-end' }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={dense}
                        onChange={(event) => setDense(event.target.checked)}
                      />
                    }
                    label="Dense"
                  />
                  <Button onClick={handleResetFilters} sx={{ textTransform: 'none' }}>
                    Reset
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Card>

        <Card sx={panelSx}>
          <TableContainer>
            <Table size={dense ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ bgcolor: tableHeadBg }}>
                  <TableCell align="center" sx={{ width: 56, fontWeight: 700 }}>
                    SL
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Warehouse</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>District / Division</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Head of Office</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Budget Allocation
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Status
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {warehouseListLoading
                  ? Array.from({ length: 5 }, (_, index) => (
                      <TableRowSkeleton
                        key={index}
                        columns={[
                          { type: 'text', width: 20, align: 'center' },
                          { type: 'text', width: 80 },
                          { type: 'text', width: 180 },
                          { type: 'text', width: 120 },
                          { type: 'text', width: 130 },
                          { type: 'text', width: 100, align: 'right' },
                          { type: 'rect', width: 72, height: 24, align: 'center' },
                          { type: 'circle', count: 2, size: 30, align: 'center' },
                        ]}
                      />
                    ))
                  : rows.map((row, index) => (
                      <WarehouseRow
                        key={row.id}
                        row={row}
                        serialNumber={page * rowsPerPage + index + 1}
                        onOpenDetails={openDetails}
                        onEdit={openEditDialog}
                        onDelete={(warehouse) => {
                          setDeleteTarget(warehouse);
                          confirm.onTrue();
                        }}
                      />
                    ))}

                {!warehouseListLoading && !rows.length && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Stack alignItems="center" spacing={2}>
                        <Iconify
                          icon="solar:buildings-bold-duotone"
                          width={56}
                          sx={{ color: 'text.disabled' }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          No warehouses found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Adjust the filters or add a new warehouse.
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
              borderTop: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {rawWarehouseList?.count ?? 0} records matched on the backend.
            </Typography>

            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={(event, nextPage) => setPage(nextPage - 1)}
              variant="outlined"
              shape="rounded"
            />
          </Box>
        </Card>
      </Stack>

      <WarehouseFormDialog
        open={dialogOpen}
        title={editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}
        submitLabel={
          submitting ? 'Saving...' : editingWarehouse ? 'Update Warehouse' : 'Create Warehouse'
        }
        form={form}
        setForm={setForm}
        submitting={submitting}
        onClose={closeDialog}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Warehouse"
        content={`Are you sure you want to delete ${deleteTarget?.name || 'this warehouse'}?`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        }
      />
    </Box>
  );
}
