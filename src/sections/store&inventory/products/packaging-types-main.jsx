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
  Dialog,
  Switch,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Pagination,
  Typography,
  DialogTitle,
  Autocomplete,
  DialogActions,
  DialogContent,
  InputAdornment,
  TableContainer,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePutRequest,
  useCreateRequest,
  useDeleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import TableRowSkeleton from 'src/components/table/tableRowSkeleton';

import { renderBooleanChip } from '../shared/inventory-desk-page';

const EP = endpoints.storeInventory;
const STATUS_FILTER_OPTIONS = [
  { id: '', label: 'All Status' },
  { id: 'true', label: 'Active' },
  { id: 'false', label: 'Inactive' },
];
const EMPTY_FORM = {
  name: '',
  code: '',
  quantity: '1',
  weight: '',
  dimensions: '',
  barcode: '',
  is_active: true,
};

function buildPackagingQuery({ search, status, page, pagination }) {
  const params = new URLSearchParams();

  params.set('ordering', '-id');

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (status !== '') {
    params.set('is_active', status);
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String(page + 1));
  }

  return `${EP.packaging_types}?${params.toString()}`;
}

function formatWeight(value) {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  return `${Number(value).toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })} kg`;
}

function normalizePackagingForm(packagingType) {
  return {
    name: packagingType?.name || '',
    code: packagingType?.code || '',
    quantity: String(packagingType?.quantity ?? 1),
    weight:
      packagingType?.weight === null || packagingType?.weight === undefined
        ? ''
        : String(packagingType.weight),
    dimensions: packagingType?.dimensions || '',
    barcode: packagingType?.barcode || '',
    is_active: Boolean(packagingType?.is_active),
  };
}

function PackagingTypeRow({ row, serialNumber, onOpenDetails, onEdit, onDelete }) {
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
        <Typography variant="body2" color="text.secondary">
          {row.code}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2" color="text.secondary">
          {row.quantity}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {formatWeight(row.weight)}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {row.dimensions || 'N/A'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {row.barcode || 'No barcode'}
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

export default function PackagingTypesMain() {
  const confirm = useBoolean();
  const router = useRouter();
  const theme = useTheme();

  const isDark = theme.palette.mode === 'dark';
  const panelSx = {
    borderRadius: 3,
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: theme.palette.background.paper,
  };
  const heroGradient = `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.info.main})`;
  const heroGradientHover = `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.info.dark})`;
  const tableHeadBg = alpha(theme.palette.text.primary, isDark ? 0.12 : 0.04);

  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPackagingType, setEditingPackagingType] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const packagingListUrl = useMemo(
    () =>
      buildPackagingQuery({
        search: searchQuery,
        status: statusFilter,
        page,
        pagination: true,
      }),
    [page, searchQuery, statusFilter]
  );

  const packagingSummaryUrl = useMemo(
    () =>
      buildPackagingQuery({
        search: searchQuery,
        status: statusFilter,
        page: 0,
        pagination: false,
      }),
    [searchQuery, statusFilter]
  );

  const {
    data: rawPackagingList,
    loading: packagingListLoading,
    error: packagingListError,
  } = useGetRequest(packagingListUrl);
  const { data: rawPackagingSummary, loading: packagingSummaryLoading } =
    useGetRequest(packagingSummaryUrl);

  const createPackagingType = useCreateRequest;
  const updatePackagingType = usePutRequest;
  const deletePackagingType = useDeleteRequest;

  const rows = useMemo(
    () => (Array.isArray(rawPackagingList?.results) ? rawPackagingList.results : []),
    [rawPackagingList]
  );

  const summaryRows = useMemo(() => {
    if (Array.isArray(rawPackagingSummary)) {
      return rawPackagingSummary;
    }

    return Array.isArray(rawPackagingSummary?.results) ? rawPackagingSummary.results : [];
  }, [rawPackagingSummary]);

  const totalPages = Math.max(1, Number(rawPackagingList?.total_pages || 1));
  const rowsPerPage = Number(rawPackagingList?.page_size || 10);
  const canResetFilters = Boolean(searchQuery.trim() || statusFilter || page !== 0);

  const summaryMetrics = useMemo(
    () => ({
      total: Number(rawPackagingList?.count || summaryRows.length),
      active: summaryRows.filter((row) => row.is_active).length,
      inactive: summaryRows.filter((row) => !row.is_active).length,
      withBarcode: summaryRows.filter((row) => Boolean(row.barcode)).length,
      heavy: summaryRows.filter((row) => Number(row.weight || 0) > 25).length,
    }),
    [rawPackagingList?.count, summaryRows]
  );

  const openPackagingTypeDetails = (packagingTypeId) => {
    router.push(paths.dashboard.storeInventory.packagingType_detail(packagingTypeId));
  };

  const openCreateDialog = () => {
    setEditingPackagingType(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (packagingType) => {
    setEditingPackagingType(packagingType);
    setForm(normalizePackagingForm(packagingType));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPackagingType(null);
    setForm(EMPTY_FORM);
  };

  const revalidatePackagingQueries = async () => {
    await mutate(
      (key) => typeof key === 'string' && key.startsWith(EP.packaging_types),
      undefined,
      { revalidate: true }
    );
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Packaging type name is required.');
      return;
    }

    if (!form.code.trim()) {
      toast.error('Packaging code is required.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      quantity: Number(form.quantity || 1),
      weight: form.weight === '' ? null : Number(form.weight),
      dimensions: form.dimensions.trim() || null,
      barcode: form.barcode.trim() || null,
      is_active: Boolean(form.is_active),
    };

    setSubmitting(true);

    try {
      if (editingPackagingType) {
        await updatePackagingType(EP.packaging_type_by_id(editingPackagingType.id), payload);
        toast.success('Packaging type updated successfully.');
      } else {
        await createPackagingType(EP.packaging_types, payload);
        toast.success('Packaging type created successfully.');
      }

      closeDialog();
      await revalidatePackagingQueries();
    } catch (error) {
      toast.error(
        editingPackagingType
          ? 'Failed to update packaging type.'
          : 'Failed to create packaging type.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deletePackagingType(EP.packaging_type_by_id(deleteTarget.id));
      toast.success('Packaging type deleted successfully.');
      await revalidatePackagingQueries();
    } catch (error) {
      toast.error('Failed to delete packaging type.');
    } finally {
      confirm.onFalse();
      setDeleteTarget(null);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPage(0);
  };

  const selectedStatusFilter =
    STATUS_FILTER_OPTIONS.find((option) => option.id === statusFilter) || STATUS_FILTER_OPTIONS[0];

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
              <Iconify icon="solar:box-bold-duotone" width={28} />
              <Typography variant="h4" fontWeight={800} color="text.primary">
                Packaging Types
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Keep packaging profiles, quantities, weight limits, and barcode references aligned for
              handling and shipping operations.
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
              background: heroGradient,
              '&:hover': {
                background: heroGradientHover,
              },
            }}
          >
            Add Packaging Type
          </Button>
        </Stack>

        <Alert severity={packagingListError ? 'error' : 'info'} sx={{ borderRadius: 2 }}>
          {packagingListError
            ? 'Failed to load packaging types. Check the backend response or current filters and try again.'
            : 'This desk uses the real packaging-types API contract with server-side search, active-status filtering, pagination, and CRUD actions.'}
        </Alert>

        <Grid container spacing={3}>
          {[
            {
              label: 'Matching Types',
              value: summaryMetrics.total,
              helper: 'Packaging types returned by the current backend search and filters.',
              color: theme.palette.primary.main,
              icon: 'solar:box-bold-duotone',
            },
            {
              label: 'Active',
              value: summaryMetrics.active,
              helper: 'Packaging profiles currently available for use.',
              color: theme.palette.success.main,
              icon: 'solar:check-circle-bold-duotone',
            },
            {
              label: 'With Barcode',
              value: summaryMetrics.withBarcode,
              helper: 'Packaging records already tied to a barcode reference.',
              color: theme.palette.secondary.main,
              icon: 'solar:barcode-bold-duotone',
            },
            {
              label: 'Heavy Profiles',
              value: summaryMetrics.heavy,
              helper: 'Profiles above 25 kg that may need special handling.',
              color: theme.palette.warning.main,
              icon: 'solar:danger-triangle-bold-duotone',
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
                        {packagingSummaryLoading ? '...' : card.value}
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by packaging name, code, barcode, or dimensions"
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
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Autocomplete
                  options={STATUS_FILTER_OPTIONS}
                  value={selectedStatusFilter}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  onChange={(event, value) => {
                    setStatusFilter(value?.id || '');
                    setPage(0);
                  }}
                  renderInput={(params) => <TextField {...params} size="small" label="Status" />}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                >
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={handleResetFilters}
                    disabled={!canResetFilters}
                    startIcon={<Iconify icon="solar:restart-bold" width={18} />}
                    sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
                  >
                    Reset
                  </Button>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={dense}
                        onChange={(event) => setDense(event.target.checked)}
                      />
                    }
                    label="Dense"
                  />
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Card>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Card sx={panelSx}>
              <TableContainer>
                <Table size={dense ? 'small' : 'medium'}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: tableHeadBg }}>
                      <TableCell align="center" sx={{ width: 56, fontWeight: 700 }}>
                        SL
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        Quantity
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Weight</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Dimensions</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Barcode</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        Status
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {packagingListLoading
                      ? Array.from({ length: 5 }, (_, index) => (
                          <TableRowSkeleton
                            key={index}
                            columns={[
                              { type: 'text', width: 20, align: 'center' },
                              { type: 'text', width: 120 },
                              { type: 'text', width: 70 },
                              { type: 'text', width: 40, align: 'center' },
                              { type: 'text', width: 70 },
                              { type: 'text', width: 110 },
                              { type: 'text', width: 90 },
                              { type: 'rect', width: 64, height: 24, align: 'center' },
                              { type: 'circle', count: 2, size: 30, align: 'center' },
                            ]}
                          />
                        ))
                      : rows.map((row, index) => (
                          <PackagingTypeRow
                            key={row.id}
                            row={row}
                            serialNumber={page * rowsPerPage + index + 1}
                            onOpenDetails={openPackagingTypeDetails}
                            onEdit={openEditDialog}
                            onDelete={(packagingType) => {
                              setDeleteTarget(packagingType);
                              confirm.onTrue();
                            }}
                          />
                        ))}

                    {!packagingListLoading && !rows.length && (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                          <Stack alignItems="center" spacing={2}>
                            <Iconify
                              icon="solar:box-minimalistic-bold-duotone"
                              width={56}
                              sx={{ color: 'text.disabled' }}
                            />
                            <Typography variant="h6" color="text.secondary">
                              No packaging types found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Adjust the search or status filter, or add a new packaging type.
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
                  {rawPackagingList?.count ?? 0} records matched on the backend.
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
          </Grid>
        </Grid>
      </Stack>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPackagingType ? 'Edit Packaging Type' : 'Add Packaging Type'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, name: event.target.value }))
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Code"
                value={form.code}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, code: event.target.value }))
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                value={form.quantity}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, quantity: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Weight (kg)"
                value={form.weight}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, weight: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Barcode"
                value={form.barcode}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, barcode: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Dimensions"
                value={form.dimensions}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, dimensions: event.target.value }))
                }
                helperText="Example: 30 x 20 x 10 cm"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(form.is_active)}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        is_active: event.target.checked,
                      }))
                    }
                  />
                }
                label="Active packaging type"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : editingPackagingType ? (
              'Update Packaging Type'
            ) : (
              'Create Packaging Type'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Packaging Type"
        content={`Are you sure you want to delete ${deleteTarget?.name || 'this packaging type'}?`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
