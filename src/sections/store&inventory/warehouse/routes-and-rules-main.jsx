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
  getRouteName,
  getRouteSteps,
  buildRouteQuery,
  RouteFormDialog,
  getEmptyRouteForm,
  getRouteStepCount,
  validateRouteForm,
  normalizeRouteForm,
  routeFormToPayload,
  ROUTE_ORDER_OPTIONS,
  ROUTE_STEP_FILTER_OPTIONS,
  ROUTE_STATUS_FILTER_OPTIONS,
} from './route-form-dialog';

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

function RouteRow({ row, serialNumber, onOpenDetails, onEdit, onDelete }) {
  const steps = getRouteSteps(row);

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
          {getRouteName(row)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.code || 'No code'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {row.description || 'No description provided.'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {getRouteStepCount(row)} step(s)
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {steps[0] || 'No route steps configured'}
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

export default function RoutesAndRulesMain() {
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
  const [stepFilter, setStepFilter] = useState('');
  const [ordering, setOrdering] = useState('name');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [form, setForm] = useState(getEmptyRouteForm());
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const listUrl = useMemo(
    () =>
      `${EP.routes}?${buildRouteQuery({
        search: searchQuery,
        status: statusFilter,
        hasSteps: stepFilter,
        ordering,
        page,
        pagination: true,
      })}`,
    [ordering, page, searchQuery, statusFilter, stepFilter]
  );

  const summaryUrl = useMemo(
    () =>
      `${EP.routes}?${buildRouteQuery({
        search: searchQuery,
        status: statusFilter,
        hasSteps: stepFilter,
        ordering,
        pagination: false,
      })}`,
    [ordering, searchQuery, statusFilter, stepFilter]
  );

  const {
    data: rawRouteList,
    loading: routeListLoading,
    error: routeListError,
  } = useGetRequest(listUrl);
  const { data: rawRouteSummary, loading: routeSummaryLoading } = useGetRequest(summaryUrl);

  const rows = useMemo(() => toDataArray(rawRouteList), [rawRouteList]);
  const summaryRows = useMemo(() => toDataArray(rawRouteSummary), [rawRouteSummary]);

  const totalPages = rawRouteList?.total_pages || 1;
  const rowsPerPage = rawRouteList?.page_size || 10;

  useEffect(() => {
    if (page > Math.max(totalPages - 1, 0)) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [page, totalPages]);

  const summaryMetrics = useMemo(
    () => ({
      total: summaryRows.length,
      active: summaryRows.filter((row) => row.is_active).length,
      withSteps: summaryRows.filter((row) => getRouteStepCount(row) > 0).length,
      inactive: summaryRows.filter((row) => !row.is_active).length,
    }),
    [summaryRows]
  );

  const revalidateRouteQueries = async () => {
    await mutate((key) => typeof key === 'string' && key.startsWith(EP.routes));
  };

  const openDetails = (id) => {
    router.push(paths.dashboard.storeInventory.routesAndRules_detail(id));
  };

  const openCreateDialog = () => {
    setEditingRoute(null);
    setForm(getEmptyRouteForm());
    setDialogOpen(true);
  };

  const openEditDialog = (route) => {
    setEditingRoute(route);
    setForm(normalizeRouteForm(route));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (submitting) {
      return;
    }

    setDialogOpen(false);
    setEditingRoute(null);
    setForm(getEmptyRouteForm());
  };

  const handleSubmit = async () => {
    const validationMessage = validateRouteForm(form);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      const payload = routeFormToPayload(form);

      if (editingRoute) {
        await putRequest(EP.route_by_id(editingRoute.id), payload);
        toast.success('Route updated successfully.');
      } else {
        await createRequest(EP.routes, payload);
        toast.success('Route created successfully.');
      }

      closeDialog();
      await revalidateRouteQueries();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError?.response?.data || requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (route) => {
    setDeleteTarget(route);
    confirm.onTrue();
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteRequest(EP.route_by_id(deleteTarget.id));
      toast.success('Route deleted successfully.');
      await revalidateRouteQueries();
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
    setStatusFilter('');
    setStepFilter('');
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
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isDark ? 0.28 : 0.12)}, ${alpha(theme.palette.warning.main, isDark ? 0.24 : 0.12)})`,
          }}
        >
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              spacing={3}
              alignItems={{ xs: 'flex-start', lg: 'center' }}
              justifyContent="space-between"
            >
              <Box sx={{ maxWidth: 880 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.25 }}>
                  <Iconify icon="solar:routing-bold-duotone" width={28} />
                  <Typography variant="h4" fontWeight={800} color="text.primary">
                    Routes & Rules Desk
                  </Typography>
                </Stack>
                <Typography variant="body1" color="text.secondary">
                  Design route logic with live backend search, server-side pagination, JSON step
                  tracking, and direct row-to-detail review for ERP warehouse flow control.
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
                  Add Route
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Card>

        <Alert severity={routeListError ? 'error' : 'info'} sx={{ borderRadius: 2 }}>
          {routeListError
            ? 'Failed to load routes. Check the backend filters or API response and try again.'
            : 'This desk uses the live routes API with backend search, step filtering, pagination, and CRUD support.'}
        </Alert>

        <Grid container spacing={3}>
          {[
            {
              label: 'Matching Routes',
              value: routeSummaryLoading ? '...' : summaryMetrics.total,
              helper: 'Records matched by the current server-side filters.',
              color: theme.palette.primary.main,
              icon: 'solar:list-check-bold-duotone',
            },
            {
              label: 'Active Routes',
              value: routeSummaryLoading ? '...' : summaryMetrics.active,
              helper: 'Routes currently available for warehouse flow design.',
              color: theme.palette.success.main,
              icon: 'solar:check-circle-bold-duotone',
            },
            {
              label: 'Step-Ready Routes',
              value: routeSummaryLoading ? '...' : summaryMetrics.withSteps,
              helper: 'Routes that already include at least one configured step.',
              color: theme.palette.info.main,
              icon: 'solar:sort-from-top-to-bottom-bold-duotone',
            },
            {
              label: 'Inactive Routes',
              value: routeSummaryLoading ? '...' : summaryMetrics.inactive,
              helper: 'Routes that are stored but not active in operations.',
              color: theme.palette.warning.main,
              icon: 'solar:archive-bold-duotone',
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
                    Route Registry
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Search, filter, and paginate routes directly from the backend without
                    client-side slicing.
                  </Typography>
                </Box>
              </Stack>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, lg: 6 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Search by route name, code, or description"
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

                <Grid size={{ xs: 12, sm: 4, md: 3, lg: 2 }}>
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Route Status"
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setPage(0);
                    }}
                  >
                    {ROUTE_STATUS_FILTER_OPTIONS.map((option) => (
                      <MenuItem key={option.value || 'all'} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 4, md: 3, lg: 2 }}>
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Step Coverage"
                    value={stepFilter}
                    onChange={(event) => {
                      setStepFilter(event.target.value);
                      setPage(0);
                    }}
                  >
                    {ROUTE_STEP_FILTER_OPTIONS.map((option) => (
                      <MenuItem key={option.value || 'all'} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 4, md: 3, lg: 2 }}>
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
                    {ROUTE_ORDER_OPTIONS.map((option) => (
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
                      <TableCell>Route</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Steps</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {routeListLoading
                      ? [...Array(rowsPerPage || 10)].map((_, index) => (
                          <TableRowSkeleton
                            key={`route-skeleton-${index}`}
                            columns={[
                              { type: 'text', width: 20, align: 'center' },
                              { type: 'text', width: 180, lines: 2 },
                              { type: 'text', width: 220, lines: 2 },
                              { type: 'text', width: 140, lines: 2 },
                              { type: 'rect', width: 76, height: 24, align: 'center' },
                              { type: 'circle', count: 3, size: 30, align: 'center' },
                            ]}
                            sx={{ '& td': { py: dense ? 1.5 : 2 } }}
                          />
                        ))
                      : rows.map((row, index) => (
                          <RouteRow
                            key={row.id}
                            row={row}
                            serialNumber={page * rowsPerPage + index + 1}
                            onOpenDetails={openDetails}
                            onEdit={openEditDialog}
                            onDelete={openDeleteDialog}
                          />
                        ))}

                    {!routeListLoading && rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            No routes matched the current backend filters.
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
                    {routeListLoading
                      ? 'Loading server-side routes.'
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

        <RouteFormDialog
          open={dialogOpen}
          title={editingRoute ? 'Edit Route' : 'Add Route'}
          submitLabel={editingRoute ? 'Update Route' : 'Create Route'}
          form={form}
          setForm={setForm}
          submitting={submitting}
          onClose={closeDialog}
          onSubmit={handleSubmit}
        />

        <ConfirmDialog
          open={confirm.value}
          onClose={confirm.onFalse}
          title="Delete Route"
          content={`Delete ${deleteTarget ? getRouteName(deleteTarget) : 'this route'}? This will remove the workflow from the route registry.`}
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
