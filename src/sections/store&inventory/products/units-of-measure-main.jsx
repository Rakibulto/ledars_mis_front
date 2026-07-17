'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useMemo, useState, useEffect } from 'react';

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
const EMPTY_FORM = { name: '', is_active: true };

function buildUomQuery({ search, status, page, pagination }) {
  const params = new URLSearchParams();

  params.set('ordering', 'name');

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

  return `${EP.uom}?${params.toString()}`;
}

function UnitOfMeasureRow({ row, serialNumber, isSelected, onSelect, onEdit, onDelete }) {
  return (
    <TableRow
      hover
      selected={isSelected}
      onClick={() => onSelect(row.id)}
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
        <Typography variant="body2" fontWeight={700} color="#0f172a">
          {row.name}
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

export default function UnitsOfMeasureMain() {
  const confirm = useBoolean();

  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const unitListUrl = useMemo(
    () =>
      buildUomQuery({
        search: searchQuery,
        status: statusFilter,
        page,
        pagination: true,
      }),
    [page, searchQuery, statusFilter]
  );

  const unitSummaryUrl = useMemo(
    () =>
      buildUomQuery({
        search: searchQuery,
        status: statusFilter,
        page: 0,
        pagination: false,
      }),
    [searchQuery, statusFilter]
  );

  const {
    data: rawUnitList,
    loading: unitListLoading,
    error: unitListError,
  } = useGetRequest(unitListUrl);
  const { data: rawUnitSummary, loading: unitSummaryLoading } = useGetRequest(unitSummaryUrl);

  const createUnit = useCreateRequest;
  const updateUnit = usePutRequest;
  const deleteUnit = useDeleteRequest;

  const rows = useMemo(
    () => (Array.isArray(rawUnitList?.results) ? rawUnitList.results : []),
    [rawUnitList]
  );

  const summaryRows = useMemo(() => {
    if (Array.isArray(rawUnitSummary)) {
      return rawUnitSummary;
    }

    return Array.isArray(rawUnitSummary?.results) ? rawUnitSummary.results : [];
  }, [rawUnitSummary]);

  const totalPages = Math.max(1, Number(rawUnitList?.total_pages || 1));
  const rowsPerPage = Number(rawUnitList?.page_size || 10);
  const canResetFilters = Boolean(searchQuery.trim() || statusFilter || page !== 0);

  const selectedUnit = useMemo(
    () => rows.find((row) => row.id === selectedUnitId) || null,
    [rows, selectedUnitId]
  );

  const summaryMetrics = useMemo(
    () => ({
      total: Number(rawUnitList?.count || summaryRows.length),
      active: summaryRows.filter((row) => row.is_active).length,
      inactive: summaryRows.filter((row) => !row.is_active).length,
    }),
    [rawUnitList?.count, summaryRows]
  );

  useEffect(() => {
    if (!rows.length) {
      setSelectedUnitId(null);
      return;
    }

    if (!rows.some((row) => row.id === selectedUnitId)) {
      setSelectedUnitId(rows[0].id);
    }
  }, [rows, selectedUnitId]);

  const openCreateDialog = () => {
    setEditingUnit(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (unit) => {
    setEditingUnit(unit);
    setForm({
      name: unit?.name || '',
      is_active: Boolean(unit?.is_active),
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingUnit(null);
    setForm(EMPTY_FORM);
  };

  const revalidateUnitQueries = async () => {
    await mutate((key) => typeof key === 'string' && key.startsWith(EP.uom), undefined, {
      revalidate: true,
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Unit name is required.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      is_active: Boolean(form.is_active),
    };

    setSubmitting(true);

    try {
      if (editingUnit) {
        await updateUnit(EP.uom_by_id(editingUnit.id), payload);
        toast.success('Unit of measure updated successfully.');
      } else {
        await createUnit(EP.uom, payload);
        toast.success('Unit of measure created successfully.');
      }

      closeDialog();
      await revalidateUnitQueries();
    } catch (error) {
      toast.error(
        editingUnit ? 'Failed to update unit of measure.' : 'Failed to create unit of measure.'
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
      await deleteUnit(EP.uom_by_id(deleteTarget.id));
      toast.success('Unit of measure deleted successfully.');
      await revalidateUnitQueries();
    } catch (error) {
      toast.error('Failed to delete unit of measure.');
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
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
              <Iconify icon="solar:ruler-angular-bold-duotone" width={28} />
              <Typography variant="h4" fontWeight={800} color="#0f172a">
                Units of Measure
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Keep product counts, stock movements, and purchasing quantities aligned to the same
              measurement standard.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={openCreateDialog}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              background: 'linear-gradient(90deg, #0f766e, #0284c7)',
              '&:hover': {
                background: 'linear-gradient(90deg, #115e59, #0369a1)',
              },
            }}
          >
            Add Unit
          </Button>
        </Stack>

        <Alert severity={unitListError ? 'error' : 'info'} sx={{ borderRadius: 2 }}>
          {unitListError
            ? 'Failed to load units of measure. Check the backend response or current filters and try again.'
            : 'This desk uses the real UoM API contract with server-side search, active-status filtering, pagination, and CRUD actions.'}
        </Alert>

        <Grid container spacing={3}>
          {[
            {
              label: 'Matching Units',
              value: summaryMetrics.total,
              helper: 'Units returned by the current backend search and filters.',
              color: '#2563eb',
              icon: 'solar:ruler-angular-bold-duotone',
            },
            {
              label: 'Active',
              value: summaryMetrics.active,
              helper: 'Measurement standards currently available for use.',
              color: '#059669',
              icon: 'solar:check-circle-bold-duotone',
            },
            {
              label: 'Inactive',
              value: summaryMetrics.inactive,
              helper: 'Units disabled from new operational setup.',
              color: '#dc2626',
              icon: 'solar:close-circle-bold-duotone',
            },
          ].map((card) => (
            <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <Box sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        {card.label}
                      </Typography>
                      <Typography variant="h4" fontWeight={800} color="#0f172a">
                        {unitSummaryLoading ? '...' : card.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2,
                        bgcolor: `${card.color}20`,
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

        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Box sx={{ p: 2.5 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search units by name"
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
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <TableContainer>
                <Table size={dense ? 'small' : 'medium'}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell align="center" sx={{ width: 56, fontWeight: 700 }}>
                        SL
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Unit Name</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        Status
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {unitListLoading
                      ? Array.from({ length: 5 }, (_, index) => (
                          <TableRowSkeleton
                            key={index}
                            columns={[
                              { type: 'text', width: 20, align: 'center' },
                              { type: 'text', width: 150 },
                              { type: 'rect', width: 64, height: 24, align: 'center' },
                              { type: 'circle', count: 2, size: 30, align: 'center' },
                            ]}
                          />
                        ))
                      : rows.map((row, index) => (
                          <UnitOfMeasureRow
                            key={row.id}
                            row={row}
                            serialNumber={page * rowsPerPage + index + 1}
                            isSelected={selectedUnitId === row.id}
                            onSelect={setSelectedUnitId}
                            onEdit={openEditDialog}
                            onDelete={(unit) => {
                              setDeleteTarget(unit);
                              confirm.onTrue();
                            }}
                          />
                        ))}

                    {!unitListLoading && !rows.length && (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                          <Stack alignItems="center" spacing={2}>
                            <Iconify
                              icon="solar:ruler-bold-duotone"
                              width={56}
                              sx={{ color: '#cbd5e1' }}
                            />
                            <Typography variant="h6" color="text.secondary">
                              No units of measure found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Adjust the search or status filter, or add a new unit.
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
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {rawUnitList?.count ?? 0} records matched on the backend.
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

          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} color="#0f172a" mb={2}>
                    Selected Unit
                  </Typography>

                  {selectedUnit ? (
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="h6" fontWeight={800} color="#0f172a">
                          {selectedUnit.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Standard measurement label for product quantities and stock movements.
                        </Typography>
                      </Box>

                      <Stack spacing={1.25}>
                        <Stack direction="row" justifyContent="space-between" spacing={2}>
                          <Typography variant="body2" color="text.secondary">
                            Status
                          </Typography>
                          <Box>
                            {renderBooleanChip(selectedUnit.is_active, 'Active', 'Inactive')}
                          </Box>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" spacing={2}>
                          <Typography variant="body2" color="text.secondary">
                            Display label
                          </Typography>
                          <Typography variant="body2" fontWeight={600} color="#0f172a">
                            {selectedUnit.name}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  ) : (
                    <Alert severity="info" variant="outlined">
                      Select a unit row to review its current operational status.
                    </Alert>
                  )}
                </Box>
              </Card>

              <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} color="#0f172a" mb={2}>
                    Control Queue
                  </Typography>

                  <Stack spacing={1.5}>
                    {[
                      {
                        label: 'Inactive units',
                        value: summaryMetrics.inactive,
                        helper: 'Inactive units should stay hidden from new product setup.',
                        bgcolor: '#f8fafc',
                      },
                      {
                        label: 'Active standards',
                        value: summaryMetrics.active,
                        helper: 'These units are available across inventory operations.',
                        bgcolor: '#ecfdf5',
                      },
                      {
                        label: 'Filtered results',
                        value: summaryMetrics.total,
                        helper:
                          'Units currently visible under the active search and status filter.',
                        bgcolor: '#eff6ff',
                      },
                    ].map((item) => (
                      <Box key={item.label} sx={{ p: 2, borderRadius: 2, bgcolor: item.bgcolor }}>
                        <Stack direction="row" justifyContent="space-between" spacing={2}>
                          <Typography variant="body2" fontWeight={700} color="#0f172a">
                            {item.label}
                          </Typography>
                          <Typography variant="body2" fontWeight={800} color="#0f172a">
                            {unitSummaryLoading ? '...' : item.value}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {item.helper}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUnit ? 'Edit Unit of Measure' : 'Add Unit of Measure'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Unit Name"
                value={form.name}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, name: event.target.value }))
                }
                required
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
                label="Active unit"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : editingUnit ? (
              'Update Unit'
            ) : (
              'Create Unit'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Unit of Measure"
        content={`Are you sure you want to delete ${deleteTarget?.name || 'this unit'}?`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
