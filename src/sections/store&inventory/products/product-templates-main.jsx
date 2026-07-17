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

const TRACKING_OPTIONS = [
  { id: 'none', label: 'No Tracking' },
  { id: 'lot', label: 'By Lots' },
  { id: 'serial', label: 'By Serial Number' },
];

const TRACKING_FILTER_OPTIONS = [{ id: '', label: 'All Tracking' }, ...TRACKING_OPTIONS];

const STATUS_FILTER_OPTIONS = [
  { id: '', label: 'All Status' },
  { id: 'true', label: 'Active' },
  { id: 'false', label: 'Inactive' },
];

const EMPTY_FORM = {
  name: '',
  category: null,
  uom: null,
  tracking: 'none',
  expiry_tracking: false,
  default_cost: '0',
  default_reorder: '0',
  default_max: '0',
  description: '',
  is_active: true,
};

function toOptions(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data?.results) ? data.results : [];
}

function getTrackingLabel(value) {
  return TRACKING_OPTIONS.find((option) => option.id === value)?.label || 'No Tracking';
}

function formatAmount(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString('en-BD', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function buildTemplateQuery({ search, categoryId, tracking, status, page, pagination }) {
  const params = new URLSearchParams();

  params.set('ordering', '-id');

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (categoryId) {
    params.set('category', String(categoryId));
  }

  if (tracking) {
    params.set('tracking', tracking);
  }

  if (status !== '') {
    params.set('is_active', status);
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String(page + 1));
  }

  return `${EP.product_templates}?${params.toString()}`;
}

function normalizeTemplateForm(template) {
  return {
    name: template?.name || '',
    category: template?.category || null,
    uom: template?.uom || null,
    tracking: template?.tracking || 'none',
    expiry_tracking: Boolean(template?.expiry_tracking),
    default_cost: String(template?.default_cost ?? 0),
    default_reorder: String(template?.default_reorder ?? 0),
    default_max: String(template?.default_max ?? 0),
    description: template?.description || '',
    is_active: Boolean(template?.is_active),
  };
}

function ProductTemplateRow({ row, serialNumber, onOpenDetails, onEdit, onDelete }) {
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
          {row.category_name || 'Uncategorized'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {row.uom_name || 'No default UoM'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {getTrackingLabel(row.tracking)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        {renderBooleanChip(row.expiry_tracking, 'Enabled', 'Off')}
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight={700} color="text.primary">
          Tk {formatAmount(row.default_cost)}
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

export default function ProductTemplatesMain() {
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
  const primaryGradient = `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.info.main})`;
  const primaryGradientHover = `linear-gradient(90deg, ${theme.palette.success.dark}, ${theme.palette.info.dark})`;

  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [trackingFilter, setTrackingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const templateListUrl = useMemo(
    () =>
      buildTemplateQuery({
        search: searchQuery,
        categoryId: categoryFilter,
        tracking: trackingFilter,
        status: statusFilter,
        page,
        pagination: true,
      }),
    [categoryFilter, page, searchQuery, statusFilter, trackingFilter]
  );

  const templateSummaryUrl = useMemo(
    () =>
      buildTemplateQuery({
        search: searchQuery,
        categoryId: categoryFilter,
        tracking: trackingFilter,
        status: statusFilter,
        page: 0,
        pagination: false,
      }),
    [categoryFilter, searchQuery, statusFilter, trackingFilter]
  );

  const {
    data: rawTemplateList,
    loading: templateListLoading,
    error: templateListError,
  } = useGetRequest(templateListUrl);
  const { data: rawTemplateSummary, loading: templateSummaryLoading } =
    useGetRequest(templateSummaryUrl);
  const { data: rawCategories } = useGetRequest(EP.item_category);
  const { data: rawUom } = useGetRequest(EP.uom);

  const createTemplate = useCreateRequest;
  const updateTemplate = usePutRequest;
  const deleteTemplate = useDeleteRequest;

  const rows = useMemo(
    () => (Array.isArray(rawTemplateList?.results) ? rawTemplateList.results : []),
    [rawTemplateList]
  );

  const summaryRows = useMemo(() => toOptions(rawTemplateSummary), [rawTemplateSummary]);

  const categoryOptions = useMemo(
    () =>
      [...toOptions(rawCategories)].sort((left, right) =>
        String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawCategories]
  );

  const uomOptions = useMemo(
    () =>
      [...toOptions(rawUom)].sort((left, right) =>
        String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawUom]
  );

  const totalPages = Math.max(1, Number(rawTemplateList?.total_pages || 1));
  const rowsPerPage = Number(rawTemplateList?.page_size || 10);
  const canResetFilters = Boolean(
    searchQuery.trim() || categoryFilter || trackingFilter || statusFilter || page !== 0
  );

  const summaryMetrics = useMemo(
    () => ({
      total: Number(rawTemplateList?.count || summaryRows.length),
      active: summaryRows.filter((row) => row.is_active).length,
      expiryTracked: summaryRows.filter((row) => row.expiry_tracking).length,
      priced: summaryRows.filter((row) => Number(row.default_cost || 0) > 0).length,
    }),
    [rawTemplateList?.count, summaryRows]
  );

  const selectedCategoryFilter =
    categoryOptions.find((option) => String(option.id) === String(categoryFilter)) || null;
  const selectedTrackingFilter =
    TRACKING_FILTER_OPTIONS.find((option) => option.id === trackingFilter) ||
    TRACKING_FILTER_OPTIONS[0];
  const selectedStatusFilter =
    STATUS_FILTER_OPTIONS.find((option) => option.id === statusFilter) || STATUS_FILTER_OPTIONS[0];

  const openDetails = (templateId) => {
    router.push(paths.dashboard.storeInventory.productTemplate_detail(templateId));
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (template) => {
    setEditingTemplate(template);
    setForm(normalizeTemplateForm(template));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setForm(EMPTY_FORM);
  };

  const revalidateTemplateQueries = async () => {
    await mutate(
      (key) => typeof key === 'string' && key.startsWith(EP.product_templates),
      undefined,
      { revalidate: true }
    );
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Template name is required.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category || null,
      uom: form.uom || null,
      tracking: form.tracking || 'none',
      expiry_tracking: Boolean(form.expiry_tracking),
      default_cost: Number(form.default_cost || 0),
      default_reorder: Number(form.default_reorder || 0),
      default_max: Number(form.default_max || 0),
      description: form.description.trim() || null,
      is_active: Boolean(form.is_active),
    };

    setSubmitting(true);

    try {
      if (editingTemplate) {
        await updateTemplate(EP.product_template_by_id(editingTemplate.id), payload);
        toast.success('Product template updated successfully.');
      } else {
        await createTemplate(EP.product_templates, payload);
        toast.success('Product template created successfully.');
      }

      closeDialog();
      await revalidateTemplateQueries();
    } catch (error) {
      toast.error(
        editingTemplate
          ? 'Failed to update product template.'
          : 'Failed to create product template.'
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
      await deleteTemplate(EP.product_template_by_id(deleteTarget.id));
      toast.success('Product template deleted successfully.');
      await revalidateTemplateQueries();
    } catch (error) {
      toast.error('Failed to delete product template.');
    } finally {
      confirm.onFalse();
      setDeleteTarget(null);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setTrackingFilter('');
    setStatusFilter('');
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
              <Iconify icon="solar:document-bold-duotone" width={28} />
              <Typography variant="h4" fontWeight={800} color="text.primary">
                Product Templates
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Manage reusable product setup templates with live backend pagination, search,
              tracking, and replenishment defaults.
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
            Add Product Template
          </Button>
        </Stack>

        <Alert severity={templateListError ? 'error' : 'info'} sx={{ borderRadius: 2 }}>
          {templateListError
            ? 'Failed to load product templates. Check the backend response or active filters and try again.'
            : 'This page now uses the real product-templates API contract with server-side search, category tracking filters, pagination, and CRUD support.'}
        </Alert>

        <Grid container spacing={3}>
          {[
            {
              label: 'Matching Templates',
              value: summaryMetrics.total,
              helper: 'Templates returned by the current backend search and filters.',
              color: theme.palette.primary.main,
              icon: 'solar:document-bold-duotone',
            },
            {
              label: 'Active',
              value: summaryMetrics.active,
              helper: 'Templates ready to use in downstream product setup.',
              color: theme.palette.success.main,
              icon: 'solar:check-circle-bold-duotone',
            },
            {
              label: 'Expiry Tracked',
              value: summaryMetrics.expiryTracked,
              helper: 'Templates configured for expiry-sensitive inventory.',
              color: theme.palette.warning.main,
              icon: 'solar:calendar-mark-bold-duotone',
            },
            {
              label: 'Priced Profiles',
              value: summaryMetrics.priced,
              helper: 'Templates with a default cost already configured.',
              color: theme.palette.info.main,
              icon: 'solar:wad-of-money-bold-duotone',
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
                        {templateSummaryLoading ? '...' : card.value}
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
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by template name, description, category, or tracking"
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
                  options={categoryOptions}
                  value={selectedCategoryFilter}
                  getOptionLabel={(option) => option?.name || ''}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  onChange={(event, value) => {
                    setCategoryFilter(value?.id || '');
                    setPage(0);
                  }}
                  renderInput={(params) => <TextField {...params} size="small" label="Category" />}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Autocomplete
                  options={TRACKING_FILTER_OPTIONS}
                  value={selectedTrackingFilter}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  onChange={(event, value) => {
                    setTrackingFilter(value?.id || '');
                    setPage(0);
                  }}
                  renderInput={(params) => <TextField {...params} size="small" label="Tracking" />}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                >
                  <Autocomplete
                    sx={{ minWidth: { sm: 160 } }}
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

        <Card sx={panelSx}>
          <TableContainer>
            <Table size={dense ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ bgcolor: tableHeadBg }}>
                  <TableCell align="center" sx={{ width: 56, fontWeight: 700 }}>
                    SL
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Template Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Default UoM</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tracking</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Expiry
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Default Cost
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
                {templateListLoading
                  ? Array.from({ length: 5 }, (_, index) => (
                      <TableRowSkeleton
                        key={index}
                        columns={[
                          { type: 'text', width: 20, align: 'center' },
                          { type: 'text', width: 150 },
                          { type: 'text', width: 120 },
                          { type: 'text', width: 90 },
                          { type: 'text', width: 90 },
                          { type: 'rect', width: 70, height: 24, align: 'center' },
                          { type: 'text', width: 90, align: 'right' },
                          { type: 'rect', width: 70, height: 24, align: 'center' },
                          { type: 'circle', count: 2, size: 30, align: 'center' },
                        ]}
                      />
                    ))
                  : rows.map((row, index) => (
                      <ProductTemplateRow
                        key={row.id}
                        row={row}
                        serialNumber={page * rowsPerPage + index + 1}
                        onOpenDetails={openDetails}
                        onEdit={openEditDialog}
                        onDelete={(template) => {
                          setDeleteTarget(template);
                          confirm.onTrue();
                        }}
                      />
                    ))}

                {!templateListLoading && !rows.length && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <Stack alignItems="center" spacing={2}>
                        <Iconify
                          icon="solar:file-smile-bold-duotone"
                          width={56}
                          sx={{ color: 'text.disabled' }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          No product templates found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Adjust the filters or add a new product template.
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
              {rawTemplateList?.count ?? 0} records matched on the backend.
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

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Edit Product Template' : 'Add Product Template'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Template Name"
                value={form.name}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, name: event.target.value }))
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={categoryOptions}
                value={categoryOptions.find((option) => option.id === form.category) || null}
                getOptionLabel={(option) => option?.name || ''}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                onChange={(event, value) =>
                  setForm((currentForm) => ({ ...currentForm, category: value?.id || null }))
                }
                renderInput={(params) => <TextField {...params} label="Category" />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={uomOptions}
                value={uomOptions.find((option) => option.id === form.uom) || null}
                getOptionLabel={(option) => option?.name || ''}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                onChange={(event, value) =>
                  setForm((currentForm) => ({ ...currentForm, uom: value?.id || null }))
                }
                renderInput={(params) => <TextField {...params} label="Default UoM" />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={TRACKING_OPTIONS}
                value={
                  TRACKING_OPTIONS.find((option) => option.id === form.tracking) ||
                  TRACKING_OPTIONS[0]
                }
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                onChange={(event, value) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    tracking: value?.id || 'none',
                  }))
                }
                renderInput={(params) => <TextField {...params} label="Tracking" />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Default Cost"
                value={form.default_cost}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    default_cost: event.target.value,
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Default Reorder"
                value={form.default_reorder}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    default_reorder: event.target.value,
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Default Max"
                value={form.default_max}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    default_max: event.target.value,
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Description"
                value={form.description}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    description: event.target.value,
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(form.expiry_tracking)}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          expiry_tracking: event.target.checked,
                        }))
                      }
                    />
                  }
                  label="Expiry tracking enabled"
                />
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
                  label="Template is active"
                />
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : editingTemplate ? (
              'Update Template'
            ) : (
              'Create Template'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Product Template"
        content={`Are you sure you want to delete ${deleteTarget?.name || 'this product template'}?`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
