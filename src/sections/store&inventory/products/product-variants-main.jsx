'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

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
  product: null,
  name: '',
  code: '',
  cost_adjustment: '0',
  attributes_text: '{}',
  is_active: true,
};

function buildVariantQuery({ search, productId, status, page, pagination }) {
  const params = new URLSearchParams();

  params.set('ordering', '-id');

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (productId) {
    params.set('product', String(productId));
  }

  if (status !== '') {
    params.set('is_active', status);
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String(page + 1));
  }

  return `${EP.product_variants}?${params.toString()}`;
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  const absoluteAmount = Math.abs(amount);
  const formattedAmount = absoluteAmount.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${amount < 0 ? '-৳' : '৳'}${formattedAmount}`;
}

function formatAttributesPreview(attributes) {
  if (!attributes) {
    return 'No attributes defined.';
  }

  if (Array.isArray(attributes)) {
    return attributes.length ? attributes.join(', ') : 'No attributes defined.';
  }

  if (typeof attributes === 'object') {
    const entries = Object.entries(attributes);

    if (!entries.length) {
      return 'No attributes defined.';
    }

    return entries
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
      .join(' | ');
  }

  return String(attributes);
}

function normalizeVariantForm(variant) {
  return {
    product: variant?.product_id || variant?.product || null,
    name: variant?.name || '',
    code: variant?.code || '',
    cost_adjustment: String(variant?.cost_adjustment ?? 0),
    attributes_text: JSON.stringify(variant?.attributes || {}, null, 2),
    is_active: Boolean(variant?.is_active),
  };
}

function parseAttributesText(attributesText) {
  const trimmedValue = attributesText.trim();

  if (!trimmedValue) {
    return {};
  }

  return JSON.parse(trimmedValue);
}

function ProductVariantRow({ row, serialNumber, onOpenDetails, onEdit, onDelete }) {
  return (
    <TableRow
      hover
      onClick={() => onOpenDetails(row.id)}
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
          {row.variant_name || row.name}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#334155" fontWeight={600}>
          {row.product_name || 'Unlinked product'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#475569">
          {row.sku || row.code || 'No code'}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2" color="#475569">
          {row.attribute_count ?? Object.keys(row.attributes || {}).length}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight={700} color="#0f172a">
          {formatCurrency(row.cost_adjustment)}
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

export default function ProductVariantsMain() {
  const confirm = useBoolean();
  const router = useRouter();

  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const variantListUrl = useMemo(
    () =>
      buildVariantQuery({
        search: searchQuery,
        productId: productFilter,
        status: statusFilter,
        page,
        pagination: true,
      }),
    [page, productFilter, searchQuery, statusFilter]
  );

  const variantSummaryUrl = useMemo(
    () =>
      buildVariantQuery({
        search: searchQuery,
        productId: productFilter,
        status: statusFilter,
        page: 0,
        pagination: false,
      }),
    [productFilter, searchQuery, statusFilter]
  );

  const {
    data: rawVariantList,
    loading: variantListLoading,
    error: variantListError,
  } = useGetRequest(variantListUrl);
  const { data: rawVariantSummary, loading: variantSummaryLoading } =
    useGetRequest(variantSummaryUrl);
  const { data: rawProducts, loading: productsLoading } = useGetRequest(EP.products);

  const createVariant = useCreateRequest;
  const updateVariant = usePutRequest;
  const deleteVariant = useDeleteRequest;

  const productOptions = useMemo(() => {
    const products = Array.isArray(rawProducts) ? rawProducts : rawProducts?.results || [];

    return [...products].sort((left, right) =>
      String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
        sensitivity: 'base',
      })
    );
  }, [rawProducts]);

  const rows = useMemo(
    () => (Array.isArray(rawVariantList?.results) ? rawVariantList.results : []),
    [rawVariantList]
  );

  const summaryRows = useMemo(() => {
    if (Array.isArray(rawVariantSummary)) {
      return rawVariantSummary;
    }

    return Array.isArray(rawVariantSummary?.results) ? rawVariantSummary.results : [];
  }, [rawVariantSummary]);

  const totalPages = Math.max(1, Number(rawVariantList?.total_pages || 1));
  const rowsPerPage = Number(rawVariantList?.page_size || 10);

  const summaryMetrics = useMemo(
    () => ({
      total: Number(rawVariantList?.count || summaryRows.length),
      active: summaryRows.filter((row) => row.is_active).length,
      inactive: summaryRows.filter((row) => !row.is_active).length,
      missingCode: summaryRows.filter((row) => !(row.sku || row.code)).length,
    }),
    [rawVariantList?.count, summaryRows]
  );

  const canResetFilters = Boolean(
    searchQuery.trim() || productFilter || statusFilter || page !== 0
  );

  const openVariantDetails = (variantId) => {
    router.push(paths.dashboard.storeInventory.productVariant_detail(variantId));
  };

  const openCreateDialog = () => {
    if (!productOptions.length) {
      toast.error('Create at least one product before adding a variant.');
      return;
    }

    setEditingVariant(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (variant) => {
    setEditingVariant(variant);
    setForm(normalizeVariantForm(variant));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingVariant(null);
    setForm(EMPTY_FORM);
  };

  const revalidateVariantQueries = async () => {
    await mutate(
      (key) => typeof key === 'string' && key.startsWith(EP.product_variants),
      undefined,
      { revalidate: true }
    );
  };

  const handleSubmit = async () => {
    if (!form.product) {
      toast.error('Parent product is required.');
      return;
    }

    if (!form.name.trim()) {
      toast.error('Variant name is required.');
      return;
    }

    if (!form.code.trim()) {
      toast.error('Variant code is required.');
      return;
    }

    let parsedAttributes;

    try {
      parsedAttributes = parseAttributesText(form.attributes_text);
    } catch (error) {
      toast.error('Attributes must be valid JSON.');
      return;
    }

    const payload = {
      product: Number(form.product),
      name: form.name.trim(),
      code: form.code.trim(),
      cost_adjustment: Number(form.cost_adjustment || 0),
      attributes: parsedAttributes,
      is_active: Boolean(form.is_active),
    };

    setSubmitting(true);

    try {
      if (editingVariant) {
        await updateVariant(EP.product_variant_by_id(editingVariant.id), payload);
        toast.success('Product variant updated successfully.');
      } else {
        await createVariant(EP.product_variants, payload);
        toast.success('Product variant created successfully.');
      }

      closeDialog();
      await revalidateVariantQueries();
    } catch (error) {
      toast.error(
        editingVariant ? 'Failed to update product variant.' : 'Failed to create product variant.'
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
      await deleteVariant(EP.product_variant_by_id(deleteTarget.id));
      toast.success('Product variant deleted successfully.');
      await revalidateVariantQueries();
    } catch (error) {
      toast.error('Failed to delete product variant.');
    } finally {
      confirm.onFalse();
      setDeleteTarget(null);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setProductFilter('');
    setStatusFilter('');
    setPage(0);
  };

  const selectedProductFilter =
    productOptions.find((product) => String(product.id) === String(productFilter)) || null;
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
              <Iconify icon="solar:layers-bold-duotone" width={28} />
              <Typography variant="h4" fontWeight={800} color="#0f172a">
                Product Variants
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Keep variant names, parent products, SKUs, and attribute definitions consistent so
              downstream inventory transactions stay traceable.
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
            Add Variant
          </Button>
        </Stack>

        <Alert severity={variantListError ? 'error' : 'info'} sx={{ borderRadius: 2 }}>
          {variantListError
            ? 'Failed to load product variants. Check the backend response or active filters and try again.'
            : 'This desk now uses the real product-variants API fields and server-side search, filters, pagination, and CRUD actions.'}
        </Alert>

        <Grid container spacing={3}>
          {[
            {
              label: 'Matching Variants',
              value: summaryMetrics.total,
              helper: 'Records returned by the current backend search and filters.',
              color: '#2563eb',
              icon: 'solar:layers-bold-duotone',
            },
            {
              label: 'Active',
              value: summaryMetrics.active,
              helper: 'Variants available for operational use.',
              color: '#059669',
              icon: 'solar:check-circle-bold-duotone',
            },
            {
              label: 'Inactive',
              value: summaryMetrics.inactive,
              helper: 'Variants currently disabled from active use.',
              color: '#dc2626',
              icon: 'solar:close-circle-bold-duotone',
            },
            {
              label: 'Missing Code',
              value: summaryMetrics.missingCode,
              helper: 'Variants that need a proper code or SKU.',
              color: '#d97706',
              icon: 'solar:danger-triangle-bold-duotone',
            },
          ].map((card) => (
            <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <Box sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        {card.label}
                      </Typography>
                      <Typography variant="h4" fontWeight={800} color="#0f172a">
                        {variantSummaryLoading ? '...' : card.value}
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
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by variant name, code, or parent product"
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
                  options={productOptions}
                  loading={productsLoading}
                  value={selectedProductFilter}
                  getOptionLabel={(option) => option?.name || ''}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  onChange={(event, value) => {
                    setProductFilter(value?.id || '');
                    setPage(0);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Product"
                      placeholder="All Products"
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
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
              <Grid size={{ xs: 12, md: 2 }}>
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
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <TableContainer>
                <Table size={dense ? 'small' : 'medium'}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell align="center" sx={{ width: 56, fontWeight: 700 }}>
                        SL
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Variant</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Parent Product</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Code / SKU</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        Attributes
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        Cost Adj.
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
                    {variantListLoading
                      ? Array.from({ length: 5 }, (_, index) => (
                          <TableRowSkeleton
                            key={index}
                            columns={[
                              { type: 'text', width: 20, align: 'center' },
                              { type: 'text', lines: 2, width: 120 },
                              { type: 'text', width: 120 },
                              { type: 'text', width: 90 },
                              { type: 'text', width: 40, align: 'center' },
                              { type: 'text', width: 70, align: 'right' },
                              { type: 'rect', width: 64, height: 24, align: 'center' },
                              { type: 'circle', count: 2, size: 30, align: 'center' },
                            ]}
                          />
                        ))
                      : rows.map((row, index) => (
                          <ProductVariantRow
                            key={row.id}
                            row={row}
                            serialNumber={page * rowsPerPage + index + 1}
                            onOpenDetails={openVariantDetails}
                            onEdit={openEditDialog}
                            onDelete={(variant) => {
                              setDeleteTarget(variant);
                              confirm.onTrue();
                            }}
                          />
                        ))}

                    {!variantListLoading && !rows.length && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                          <Stack alignItems="center" spacing={2}>
                            <Iconify
                              icon="solar:layers-minimalistic-bold-duotone"
                              width={56}
                              sx={{ color: '#cbd5e1' }}
                            />
                            <Typography variant="h6" color="text.secondary">
                              No product variants found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Adjust the search or filters, or add a new variant.
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
                  {rawVariantList?.count ?? 0} records matched on the backend.
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
        <DialogTitle>{editingVariant ? 'Edit Product Variant' : 'Add Product Variant'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={productOptions}
                loading={productsLoading}
                value={productOptions.find((product) => product.id === form.product) || null}
                getOptionLabel={(option) => option?.name || ''}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                onChange={(event, value) =>
                  setForm((currentForm) => ({ ...currentForm, product: value?.id || null }))
                }
                renderInput={(params) => <TextField {...params} label="Parent Product" required />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Variant Name"
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
                label="Variant Code / SKU"
                value={form.code}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, code: event.target.value }))
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Cost Adjustment"
                value={form.cost_adjustment}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    cost_adjustment: event.target.value,
                  }))
                }
                helperText="Use negative values to lower the base price."
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={6}
                label="Attributes JSON"
                value={form.attributes_text}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    attributes_text: event.target.value,
                  }))
                }
                helperText='Example: {"color": "Blue", "size": "XL"}'
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
                label="Active variant"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : editingVariant ? (
              'Update Variant'
            ) : (
              'Create Variant'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Product Variant"
        content={`Are you sure you want to delete ${deleteTarget?.variant_name || deleteTarget?.name || 'this variant'}?`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
