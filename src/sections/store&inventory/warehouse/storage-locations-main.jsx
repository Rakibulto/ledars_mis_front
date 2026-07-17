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
import { useDebounce } from 'src/hooks/use-debounce';

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
  getLocationTypeLabel,
  toStorageLocationOptions,
  buildStorageLocationQuery,
  StorageLocationFormDialog,
  getEmptyStorageLocationForm,
  validateStorageLocationForm,
  normalizeStorageLocationForm,
  storageLocationFormToPayload,
  STORAGE_LOCATION_TYPE_OPTIONS,
  STORAGE_LOCATION_ORDER_OPTIONS,
  STORAGE_LOCATION_STATUS_OPTIONS,
  STORAGE_LOCATION_HANDLING_OPTIONS,
} from './storage-location-form-dialog';

const EP = endpoints.storeInventory;

function StorageLocationRow({ row, serialNumber, onOpenDetails, onEdit, onDelete }) {
  const locationTypeLabel = row.location_type_label || getLocationTypeLabel(row.location_type);
  const specialHandling = [row.is_scrap ? 'Scrap' : null, row.is_return ? 'Return' : null]
    .filter(Boolean)
    .join(' • ');

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
          {row.name}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {row.office_name || 'Not assigned'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.office_code || ''}
          {row.office_type ? ` · ${row.office_type}` : ''}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {locationTypeLabel}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {row.barcode || 'No barcode'}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2" color="text.secondary">
          {specialHandling || 'Standard'}
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

export default function StorageLocationsMain() {
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
  const [officeFilter, setOfficeFilter] = useState('');
  const [locationTypeFilter, setLocationTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [handlingFilter, setHandlingFilter] = useState('');
  const [ordering, setOrdering] = useState('office__name');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [form, setForm] = useState(getEmptyStorageLocationForm());
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 400);

  const listUrl = useMemo(
    () =>
      `${EP.storage_locations}?${buildStorageLocationQuery({
        search: debouncedSearch,
        office: officeFilter,
        locationType: locationTypeFilter,
        status: statusFilter,
        handling: handlingFilter,
        ordering,
        page,
        pagination: true,
      })}`,
    [
      debouncedSearch,
      handlingFilter,
      locationTypeFilter,
      ordering,
      page,
      statusFilter,
      officeFilter,
    ]
  );

  const summaryUrl = useMemo(
    () =>
      `${EP.storage_locations}?${buildStorageLocationQuery({
        search: debouncedSearch,
        office: officeFilter,
        locationType: locationTypeFilter,
        status: statusFilter,
        handling: handlingFilter,
        ordering,
        pagination: false,
      })}`,
    [debouncedSearch, handlingFilter, locationTypeFilter, ordering, statusFilter, officeFilter]
  );

  const officeListUrl = useMemo(
    () => `${endpoints.procurement_management.office_management}?pagination=false`,
    []
  );

  const {
    data: rawLocationList,
    loading: locationListLoading,
    error: locationListError,
  } = useGetRequest(listUrl);
  const { data: rawLocationSummary, loading: locationSummaryLoading } = useGetRequest(summaryUrl);
  const { data: rawOffices } = useGetRequest(officeListUrl);

  const rows = useMemo(() => toStorageLocationOptions(rawLocationList), [rawLocationList]);
  const summaryRows = useMemo(
    () => toStorageLocationOptions(rawLocationSummary),
    [rawLocationSummary]
  );
  const officeOptions = useMemo(() => toStorageLocationOptions(rawOffices), [rawOffices]);

  const summaryMetrics = useMemo(
    () => ({
      total: summaryRows.length,
      active: summaryRows.filter((row) => row.is_active).length,
      topLevel: summaryRows.filter((row) => !row.office).length,
      flagged: summaryRows.filter((row) => row.is_scrap || row.is_return).length,
    }),
    [summaryRows]
  );

  const totalPages = rawLocationList?.total_pages || 1;
  const rowsPerPage = rawLocationList?.page_size || 10;

  useEffect(() => {
    if (!locationListLoading && totalPages > 0 && page > totalPages - 1) {
      setPage(totalPages - 1);
    }
  }, [locationListLoading, page, totalPages]);

  const revalidateQueries = async () => {
    await mutate((key) => typeof key === 'string' && key.startsWith(EP.storage_locations));
  };

  const openDetails = (id) => {
    router.push(paths.dashboard.storeInventory.storage_location_detail(id));
  };

  const openCreateDialog = () => {
    setEditingLocation(null);
    setForm(getEmptyStorageLocationForm());
    setDialogOpen(true);
  };

  const openEditDialog = (location) => {
    setEditingLocation(location);
    setForm(normalizeStorageLocationForm(location));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (submitting) {
      return;
    }

    setDialogOpen(false);
    setEditingLocation(null);
    setForm(getEmptyStorageLocationForm());
  };

  const handleSubmit = async () => {
    const validationMessage = validateStorageLocationForm(form);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      const payload = storageLocationFormToPayload(form);

      if (editingLocation) {
        await putRequest(EP.storage_location_by_id(editingLocation.id), payload);
        toast.success('Storage location updated successfully.');
      } else {
        await createRequest(EP.storage_locations, payload);
        toast.success('Storage location created successfully.');
      }

      closeDialog();
      await revalidateQueries();
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
      await deleteRequest(EP.storage_location_by_id(deleteTarget.id));
      toast.success('Storage location deleted successfully.');
      await revalidateQueries();
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
    setOfficeFilter('');
    setLocationTypeFilter('');
    setStatusFilter('');
    setHandlingFilter('');
    setOrdering('office__name');
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
              <Iconify icon="solar:map-point-wave-bold-duotone" width={28} />
              <Typography variant="h4" fontWeight={800} color="text.primary">
                Storage Locations
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Design warehouse zones, bins, and nested storage structures with live backend search,
              filters, pagination, and dedicated row drilldown.
            </Typography>
          </Box>

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
            Add Storage Location
          </Button>
        </Stack>

        <Alert severity={locationListError ? 'error' : 'info'} sx={{ borderRadius: 2 }}>
          {locationListError
            ? 'Failed to load storage locations. Check the backend response or active filters and try again.'
            : 'This page now runs on the live storage-locations API with server-side search, warehouse and type filters, handling filters, pagination, and full CRUD.'}
        </Alert>

        <Grid container spacing={2}>
          {[
            {
              label: 'Filtered Locations',
              value: summaryMetrics.total,
              helper: 'Total records matching the active server filters.',
              icon: 'solar:map-point-bold-duotone',
              color: theme.palette.primary.main,
            },
            {
              label: 'Active Slots',
              value: summaryMetrics.active,
              helper: 'Locations ready for operational use.',
              icon: 'solar:shield-check-bold-duotone',
              color: theme.palette.success.main,
            },
            {
              label: 'Top-Level Zones',
              value: summaryMetrics.topLevel,
              helper: 'Locations without a parent anchor.',
              icon: 'solar:widget-4-bold-duotone',
              color: theme.palette.info.main,
            },
            {
              label: 'Special Handling',
              value: summaryMetrics.flagged,
              helper: 'Scrap or return locations currently in scope.',
              icon: 'solar:danger-triangle-bold-duotone',
              color: theme.palette.warning.main,
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
                        {locationSummaryLoading ? '...' : card.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2.5,
                        bgcolor: alpha(card.color, isDark ? 0.24 : 0.12),
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
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search location, warehouse, barcode, or parent..."
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
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Office / Warehouse"
                  value={officeFilter}
                  onChange={(event) => {
                    setOfficeFilter(event.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All Offices / Warehouses</MenuItem>
                  {officeOptions.map((option) => (
                    <MenuItem key={option.id} value={String(option.id)}>
                      {option.code ? `${option.code} - ${option.name}` : option.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Type"
                  value={locationTypeFilter}
                  onChange={(event) => {
                    setLocationTypeFilter(event.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {STORAGE_LOCATION_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
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
                  {STORAGE_LOCATION_STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Handling"
                  value={handlingFilter}
                  onChange={(event) => {
                    setHandlingFilter(event.target.value);
                    setPage(0);
                  }}
                >
                  {STORAGE_LOCATION_HANDLING_OPTIONS.map((option) => (
                    <MenuItem key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  {STORAGE_LOCATION_ORDER_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleResetFilters}
                  sx={{ height: 40, textTransform: 'none', fontWeight: 700 }}
                >
                  Reset Filters
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Card>

        <Card sx={panelSx}>
          <Box sx={{ p: 3, pb: 1.5 }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={1.5}
            >
              <Box>
                <Typography variant="h6" fontWeight={800} color="text.primary">
                  Storage Location Register
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click any row to open its detail view. Edit and delete actions stay inline for
                  fast master-data maintenance.
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Showing {rows.length} of {rawLocationList?.count || 0} filtered locations
              </Typography>
            </Stack>
          </Box>

          <TableContainer>
            <Table size={dense ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ bgcolor: tableHeadBg }}>
                  <TableCell align="center">#</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Office / Warehouse</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Barcode</TableCell>
                  <TableCell align="center">Handling</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {locationListLoading &&
                  Array.from({ length: 6 }).map((_, index) => (
                    <TableRowSkeleton
                      key={`storage-location-skeleton-${index}`}
                      columns={[
                        { type: 'text', width: 24, align: 'center' },
                        { type: 'text', lines: 2, width: '70%' },
                        { type: 'text', lines: 2, width: '75%' },
                        { type: 'text', width: '60%' },
                        { type: 'text', width: '65%' },
                        { type: 'text', width: '60%', align: 'center' },
                        { type: 'rect', width: 80, height: 24, align: 'center' },
                        { type: 'circle', size: 28, count: 2, align: 'center' },
                      ]}
                    />
                  ))}

                {!locationListLoading &&
                  rows.map((row, index) => (
                    <StorageLocationRow
                      key={row.id}
                      row={row}
                      serialNumber={page * rowsPerPage + index + 1}
                      onOpenDetails={openDetails}
                      onEdit={openEditDialog}
                      onDelete={(location) => {
                        setDeleteTarget(location);
                        confirm.onTrue();
                      }}
                    />
                  ))}

                {!locationListLoading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Stack spacing={1} alignItems="center">
                        <Iconify icon="solar:map-point-search-bold-duotone" width={28} />
                        <Typography variant="h6" color="text.primary">
                          No storage locations found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Adjust the search or filters to widen the server result set.
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
              px: 3,
              py: 2,
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: 2,
            }}
          >
            <FormControlLabel
              control={
                <Switch checked={dense} onChange={(event) => setDense(event.target.checked)} />
              }
              label="Dense rows"
            />

            {totalPages > 1 && (
              <Pagination
                page={page + 1}
                count={totalPages}
                color="primary"
                onChange={(_, value) => setPage(value - 1)}
              />
            )}
          </Box>
        </Card>
      </Stack>

      <StorageLocationFormDialog
        open={dialogOpen}
        title={editingLocation ? 'Edit Storage Location' : 'Add Storage Location'}
        submitLabel={editingLocation ? 'Save Changes' : 'Create Location'}
        form={form}
        setForm={setForm}
        submitting={submitting}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        officeOptions={officeOptions}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Storage Location"
        content={`Delete ${deleteTarget?.name || 'this storage location'}? This action cannot be undone.`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
