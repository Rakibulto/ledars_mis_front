'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState, useEffect } from 'react';

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

import { renderBooleanChip } from '../shared/inventory-desk-page';
import {
  toDataArray,
  getOperationTypeName,
  getOperationTypeLabel,
  OPERATION_TYPE_OPTIONS,
  buildOperationTypeQuery,
  OperationTypeFormDialog,
  OPERATION_ORDER_OPTIONS,
  getEmptyOperationTypeForm,
  validateOperationTypeForm,
  normalizeOperationTypeForm,
  operationTypeFormToPayload,
  OPERATION_STATUS_FILTER_OPTIONS,
} from './operation-type-form-dialog';

const EP = endpoints.storeInventory;

function SummaryCard({ label, value, helper, icon, color }) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        p: 2.75,
        height: '100%',
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
        boxShadow: 'none',
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {helper}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            bgcolor: alpha(color, 0.12),
            color,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Iconify icon={icon} width={24} />
        </Box>
      </Stack>
    </Card>
  );
}

function OperationTypeRow({ row, serialNumber, onOpenDetails, onEdit, onDelete }) {
  return (
    <TableRow
      hover
      sx={{
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
      onClick={() => onOpenDetails(row.id)}
    >
      <TableCell align="center" sx={{ width: 56 }}>
        <Typography variant="body2" fontWeight={700} color="text.secondary">
          {serialNumber}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {getOperationTypeName(row)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.code || 'No code'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {getOperationTypeLabel(row)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.operation_type || 'No category'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {row.warehouse_name || 'No warehouse'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.warehouse_code || 'No code'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {row.default_source_name || 'No source'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          To {row.default_destination_name || 'No destination'}
        </Typography>
      </TableCell>
      <TableCell align="center">{renderBooleanChip(row.is_active, 'Active', 'Inactive')}</TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <IconButton
            size="small"
            color="primary"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetails(row.id);
            }}
          >
            <Iconify icon="solar:eye-bold" width={18} />
          </IconButton>
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

export default function OperationTypesMain() {
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
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ordering, setOrdering] = useState('name');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOperationType, setEditingOperationType] = useState(null);
  const [form, setForm] = useState(getEmptyOperationTypeForm());
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const listUrl = useMemo(
    () =>
      `${EP.operation_types}?${buildOperationTypeQuery({
        search: searchQuery,
        warehouse: warehouseFilter,
        operationType: typeFilter,
        status: statusFilter,
        ordering,
        page,
        pagination: true,
      })}`,
    [ordering, page, searchQuery, statusFilter, typeFilter, warehouseFilter]
  );

  const summaryUrl = useMemo(
    () =>
      `${EP.operation_types}?${buildOperationTypeQuery({
        search: searchQuery,
        warehouse: warehouseFilter,
        operationType: typeFilter,
        status: statusFilter,
        ordering,
        pagination: false,
      })}`,
    [ordering, searchQuery, statusFilter, typeFilter, warehouseFilter]
  );

  const warehouseOptionsUrl = useMemo(() => `${EP.warehouses}?pagination=false&ordering=name`, []);
  const locationOptionsUrl = useMemo(
    () => `${EP.storage_locations}?pagination=false&ordering=name`,
    []
  );

  const {
    data: rawOperationTypeList,
    loading: operationTypeListLoading,
    error: operationTypeListError,
  } = useGetRequest(listUrl);
  const { data: rawOperationTypeSummary, loading: operationTypeSummaryLoading } =
    useGetRequest(summaryUrl);
  const { data: rawWarehouses } = useGetRequest(warehouseOptionsUrl);
  const { data: rawLocations } = useGetRequest(locationOptionsUrl);

  const rows = useMemo(() => toDataArray(rawOperationTypeList), [rawOperationTypeList]);
  const summaryRows = useMemo(
    () => toDataArray(rawOperationTypeSummary),
    [rawOperationTypeSummary]
  );
  const warehouseOptions = useMemo(() => toDataArray(rawWarehouses), [rawWarehouses]);
  const locationOptions = useMemo(() => toDataArray(rawLocations), [rawLocations]);

  const totalPages = rawOperationTypeList?.total_pages || 1;
  const rowsPerPage = rawOperationTypeList?.page_size || 10;

  useEffect(() => {
    if (page > Math.max(totalPages - 1, 0)) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [page, totalPages]);

  const summaryMetrics = useMemo(
    () => ({
      total: summaryRows.length,
      active: summaryRows.filter((row) => row.is_active).length,
      incoming: summaryRows.filter((row) => row.operation_type === 'incoming').length,
      outgoing: summaryRows.filter((row) => row.operation_type === 'outgoing').length,
    }),
    [summaryRows]
  );

  const revalidateOperationTypeQueries = async () => {
    await mutate((key) => typeof key === 'string' && key.startsWith(EP.operation_types));
  };

  const openDetails = (id) => {
    router.push(paths.dashboard.storeInventory.operationType_detail(id));
  };

  const openCreateDialog = () => {
    setEditingOperationType(null);
    setForm(getEmptyOperationTypeForm());
    setDialogOpen(true);
  };

  const openEditDialog = (operationType) => {
    setEditingOperationType(operationType);
    setForm(normalizeOperationTypeForm(operationType));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (submitting) {
      return;
    }

    setDialogOpen(false);
    setEditingOperationType(null);
    setForm(getEmptyOperationTypeForm());
  };

  const handleSubmit = async () => {
    const validationMessage = validateOperationTypeForm(form);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      const payload = operationTypeFormToPayload(form);

      if (editingOperationType) {
        await putRequest(EP.operation_type_by_id(editingOperationType.id), payload);
        toast.success('Operation type updated successfully.');
      } else {
        await createRequest(EP.operation_types, payload);
        toast.success('Operation type created successfully.');
      }

      closeDialog();
      await revalidateOperationTypeQueries();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError?.response?.data || requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (operationType) => {
    setDeleteTarget(operationType);
    confirm.onTrue();
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteRequest(EP.operation_type_by_id(deleteTarget.id));
      toast.success('Operation type deleted successfully.');
      await revalidateOperationTypeQueries();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError?.response?.data || requestError));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
      confirm.onFalse();
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setWarehouseFilter('');
    setTypeFilter('');
    setStatusFilter('');
    setOrdering('name');
    setPage(0);
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Stack spacing={3}>
        <Card
          sx={{
            ...panelSx,
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isDark ? 0.28 : 0.12)}, ${alpha(theme.palette.info.main, isDark ? 0.24 : 0.12)})`,
          }}
        >
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              spacing={3}
              alignItems={{ xs: 'flex-start', lg: 'center' }}
              justifyContent="space-between"
            >
              <Box sx={{ maxWidth: 900 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.25 }}>
                  <Iconify icon="solar:widget-bold-duotone" width={28} />
                  <Typography variant="h4" fontWeight={800} color="text.primary">
                    Operation Types Desk
                  </Typography>
                </Stack>
                <Typography variant="body1" color="text.secondary">
                  Configure warehouse workflow templates with live backend search, filter,
                  pagination, and location-aware defaults for receiving, delivery, internal, return,
                  and scrap operations.
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleResetFilters}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Reset Filters
                </Button>

                <Button
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
                  Add Operation Type
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Card>

        <Alert severity={operationTypeListError ? 'error' : 'info'} sx={{ borderRadius: 2 }}>
          {operationTypeListError
            ? 'Failed to load operation types. Check the backend filters or API response and try again.'
            : 'This desk uses the live operation types API with backend search, warehouse/type/status filters, ordering, pagination, and CRUD support.'}
        </Alert>

        <Grid container spacing={3}>
          {[
            {
              label: 'Matching Types',
              value: operationTypeSummaryLoading ? '...' : summaryMetrics.total,
              helper: 'Operation templates matched by the current server-side filters.',
              color: theme.palette.primary.main,
              icon: 'solar:list-check-bold-duotone',
            },
            {
              label: 'Active Types',
              value: operationTypeSummaryLoading ? '...' : summaryMetrics.active,
              helper: 'Workflow templates currently enabled for warehouse execution.',
              color: theme.palette.success.main,
              icon: 'solar:check-circle-bold-duotone',
            },
            {
              label: 'Receiving Types',
              value: operationTypeSummaryLoading ? '...' : summaryMetrics.incoming,
              helper: 'Templates dedicated to inbound receipt handling.',
              color: theme.palette.info.main,
              icon: 'solar:inbox-in-bold-duotone',
            },
            {
              label: 'Delivery Types',
              value: operationTypeSummaryLoading ? '...' : summaryMetrics.outgoing,
              helper: 'Templates dedicated to outbound delivery execution.',
              color: theme.palette.warning.main,
              icon: 'solar:logout-3-bold-duotone',
            },
          ].map((card) => (
            <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard {...card} />
            </Grid>
          ))}
        </Grid>

        <Card sx={panelSx}>
          <Box sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Stack
                direction={{ xs: 'column', lg: 'row' }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', lg: 'center' }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Operation Registry
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Search, filter, and paginate workflow templates directly from the backend
                    without client-side slicing.
                  </Typography>
                </Box>
              </Stack>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, lg: 4 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Search by name, code, warehouse, or default locations"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
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

                <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2 }}>
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Warehouse"
                    value={warehouseFilter}
                    onChange={(event) => {
                      setWarehouseFilter(event.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="">All Warehouses</MenuItem>
                    {warehouseOptions.map((warehouse) => (
                      <MenuItem key={warehouse.id} value={String(warehouse.id)}>
                        {warehouse.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2 }}>
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Operation Category"
                    value={typeFilter}
                    onChange={(event) => {
                      setTypeFilter(event.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {OPERATION_TYPE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2 }}>
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Workflow Status"
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setPage(0);
                    }}
                  >
                    {OPERATION_STATUS_FILTER_OPTIONS.map((option) => (
                      <MenuItem key={option.value || 'all'} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2 }}>
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Order"
                    value={ordering}
                    onChange={(event) => {
                      setOrdering(event.target.value);
                      setPage(0);
                    }}
                  >
                    {OPERATION_ORDER_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <TableContainer
                sx={{ borderRadius: 2.5, border: `1px solid ${theme.palette.divider}` }}
              >
                <Table size={dense ? 'small' : 'medium'}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: tableHeadBg }}>
                      <TableCell align="center">#</TableCell>
                      <TableCell>Operation</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Warehouse</TableCell>
                      <TableCell>Default Flow</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {operationTypeListLoading
                      ? [...Array(rowsPerPage || 10)].map((_, index) => (
                          <TableRowSkeleton
                            key={`operation-type-skeleton-${index}`}
                            columns={[
                              { type: 'text', width: 20, align: 'center' },
                              { type: 'text', width: 180, lines: 2 },
                              { type: 'text', width: 150, lines: 2 },
                              { type: 'text', width: 170, lines: 2 },
                              { type: 'text', width: 180, lines: 2 },
                              { type: 'rect', width: 76, height: 24, align: 'center' },
                              { type: 'circle', count: 3, size: 30, align: 'center' },
                            ]}
                            sx={{ '& td': { py: dense ? 1.5 : 2 } }}
                          />
                        ))
                      : rows.map((row, index) => (
                          <OperationTypeRow
                            key={row.id}
                            row={row}
                            serialNumber={page * rowsPerPage + index + 1}
                            onOpenDetails={openDetails}
                            onEdit={openEditDialog}
                            onDelete={openDeleteDialog}
                          />
                        ))}

                    {!operationTypeListLoading && rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            No operation types matched the current backend filters.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </TableContainer>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={dense}
                        onChange={(event) => setDense(event.target.checked)}
                      />
                    }
                    label="Dense rows"
                    sx={{ m: 0 }}
                  />

                  <Typography variant="body2" color="text.secondary">
                    {operationTypeListLoading
                      ? 'Loading server-side operation types.'
                      : `${rows.length} row(s) returned on this page.`}
                  </Typography>
                </Stack>

                <Pagination
                  page={page + 1}
                  count={totalPages}
                  color="primary"
                  onChange={(_, value) => setPage(value - 1)}
                />
              </Stack>
            </Stack>
          </Box>
        </Card>

        <OperationTypeFormDialog
          open={dialogOpen}
          title={editingOperationType ? 'Edit Operation Type' : 'Add Operation Type'}
          submitLabel={editingOperationType ? 'Update Operation Type' : 'Create Operation Type'}
          form={form}
          setForm={setForm}
          submitting={submitting}
          onClose={closeDialog}
          onSubmit={handleSubmit}
          warehouses={warehouseOptions}
          locations={locationOptions}
        />

        <ConfirmDialog
          open={confirm.value}
          onClose={confirm.onFalse}
          title="Delete Operation Type"
          content={`Delete ${deleteTarget ? getOperationTypeName(deleteTarget) : 'this operation type'}? This will remove the workflow template from the operation registry.`}
          action={
            <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
              Delete
            </Button>
          }
        />
      </Stack>
    </Box>
  );
}
