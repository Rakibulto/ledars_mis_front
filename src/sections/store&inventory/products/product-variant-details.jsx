'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  Box,
  Card,
  Grid,
  Alert,
  Stack,
  Button,
  Dialog,
  Switch,
  Divider,
  Skeleton,
  TextField,
  Typography,
  DialogTitle,
  Autocomplete,
  DialogActions,
  DialogContent,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, usePutRequest, useDeleteRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { renderBooleanChip } from '../shared/inventory-desk-page';

const EP = endpoints.storeInventory;

const EMPTY_FORM = {
  product: null,
  name: '',
  code: '',
  cost_adjustment: '0',
  attributes_text: '{}',
  is_active: true,
};

function formatCurrency(value) {
  const amount = Number(value || 0);
  const absoluteAmount = Math.abs(amount);
  const formattedAmount = absoluteAmount.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${amount < 0 ? '-৳' : '৳'}${formattedAmount}`;
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

function getAttributeEntries(attributes) {
  if (!attributes) {
    return [];
  }

  if (Array.isArray(attributes)) {
    return attributes.length
      ? attributes.map((value, index) => ({ label: `Value ${index + 1}`, value: String(value) }))
      : [];
  }

  if (typeof attributes === 'object') {
    return Object.entries(attributes).map(([key, value]) => ({
      label: key,
      value: Array.isArray(value) ? value.join(', ') : String(value),
    }));
  }

  return [{ label: 'Value', value: String(attributes) }];
}

function DetailField({ label, value, muted = false }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={700} color={muted ? 'text.secondary' : '#0f172a'}>
        {value}
      </Typography>
    </Box>
  );
}

export default function ProductVariantDetails() {
  const params = useParams();
  const router = useRouter();
  const confirm = useBoolean();

  const variantId = params?.variantId;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const variantUrl = variantId ? EP.product_variant_by_id(variantId) : null;

  const { data: variant, loading, error } = useGetRequest(variantUrl);
  const { data: rawProducts, loading: productsLoading } = useGetRequest(EP.products);

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

  const attributeEntries = useMemo(() => getAttributeEntries(variant?.attributes), [variant]);

  const rawAttributesJson = useMemo(
    () => JSON.stringify(variant?.attributes || {}, null, 2),
    [variant]
  );

  const revalidateVariantQueries = async () => {
    await mutate(
      (key) => typeof key === 'string' && key.startsWith(EP.product_variants),
      undefined,
      { revalidate: true }
    );
  };

  const openEditDialog = () => {
    if (!variant) {
      return;
    }

    setForm(normalizeVariantForm(variant));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setForm(EMPTY_FORM);
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
    } catch (submitError) {
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
      await updateVariant(EP.product_variant_by_id(variantId), payload);
      toast.success('Product variant updated successfully.');
      closeDialog();
      await revalidateVariantQueries();
    } catch (submitError) {
      toast.error('Failed to update product variant.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      await deleteVariant(EP.product_variant_by_id(variantId));
      toast.success('Product variant deleted successfully.');
      await revalidateVariantQueries();
      router.push(paths.dashboard.storeInventory.productVariants);
    } catch (deleteError) {
      toast.error('Failed to delete product variant.');
    } finally {
      setDeleting(false);
      confirm.onFalse();
    }
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Link href={paths.dashboard.storeInventory.productVariants} passHref>
              <Button variant="outlined" startIcon={<Iconify icon="eva:arrow-back-fill" />}>
                Back to List
              </Button>
            </Link>

            <Box>
              <Typography variant="h4" fontWeight={800} color="#0f172a">
                Product Variant Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review the exact variant payload used by the inventory backend and manage it from a
                dedicated details screen.
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={confirm.onTrue}
              disabled={!variant || deleting}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Delete Variant
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={openEditDialog}
              disabled={!variant}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Edit Variant
            </Button>
          </Stack>
        </Stack>

        {loading && (
          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Stack spacing={2.5}>
              <Skeleton variant="text" width="32%" height={46} />
              <Skeleton variant="rounded" height={132} />
              <Skeleton variant="rounded" height={280} />
            </Stack>
          </Card>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Failed to load the product variant details. Please check the backend response and try
            again.
          </Alert>
        )}

        {!loading && !error && variant && (
          <>
            <Card
              sx={{
                borderRadius: 3,
                border: '1px solid #bae6fd',
                background: 'linear-gradient(135deg, #ecfeff 0%, #eff6ff 55%, #f8fafc 100%)',
              }}
            >
              <Box sx={{ p: 3 }}>
                <Stack
                  direction={{ xs: 'column', lg: 'row' }}
                  justifyContent="space-between"
                  spacing={3}
                >
                  <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 2.5,
                          bgcolor: '#0f766e',
                          color: 'white',
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <Iconify icon="solar:layers-bold-duotone" width={28} />
                      </Box>
                      <Box>
                        <Typography variant="overline" color="#0f766e">
                          Variant Profile
                        </Typography>
                        <Typography variant="h4" fontWeight={800} color="#0f172a">
                          {variant.variant_name || variant.name}
                        </Typography>
                      </Box>
                    </Stack>

                    <Typography variant="body1" color="#334155" sx={{ maxWidth: 720 }}>
                      Parent product: {variant.product_name || 'Unlinked product'}
                    </Typography>
                  </Box>

                  <Stack spacing={1.5} alignItems={{ xs: 'flex-start', lg: 'flex-end' }}>
                    {renderBooleanChip(variant.is_active, 'Active', 'Inactive')}
                    <Typography variant="body2" color="#475569" fontWeight={700}>
                      Code / SKU: {variant.sku || variant.code || 'No code'}
                    </Typography>
                    <Typography variant="body2" color="#475569" fontWeight={700}>
                      Cost Adjustment: {formatCurrency(variant.cost_adjustment)}
                    </Typography>
                  </Stack>
                </Stack>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {[
                    {
                      label: 'Variant ID',
                      value: variant.id,
                      color: '#2563eb',
                      icon: 'solar:hashtag-square-bold-duotone',
                    },
                    {
                      label: 'Parent Product ID',
                      value: variant.product_id || variant.product || 'N/A',
                      color: '#0f766e',
                      icon: 'solar:box-bold-duotone',
                    },
                    {
                      label: 'Attributes Defined',
                      value: variant.attribute_count ?? attributeEntries.length,
                      color: '#9333ea',
                      icon: 'solar:tuning-2-bold-duotone',
                    },
                    {
                      label: 'Cost Delta',
                      value: formatCurrency(variant.cost_adjustment),
                      color: '#d97706',
                      icon: 'solar:wad-of-money-bold-duotone',
                    },
                  ].map((item) => (
                    <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 3 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          bgcolor: 'rgba(255,255,255,0.72)',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" spacing={2}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {item.label}
                            </Typography>
                            <Typography variant="h6" fontWeight={800} color="#0f172a">
                              {item.value}
                            </Typography>
                          </Box>
                          <Box sx={{ color: item.color }}>
                            <Iconify icon={item.icon} width={22} />
                          </Box>
                        </Stack>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Card>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <Stack spacing={3}>
                  <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <Box sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} color="#0f172a" mb={2.5}>
                        Variant Details
                      </Typography>

                      <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField
                            label="Variant Name"
                            value={variant.variant_name || variant.name}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField
                            label="Parent Product"
                            value={variant.product_name || 'Unlinked product'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField
                            label="Variant Code / SKU"
                            value={variant.sku || variant.code || 'No code'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField
                            label="Status"
                            value={variant.is_active ? 'Active' : 'Inactive'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField label="Variant ID" value={variant.id} muted />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField
                            label="Parent Product ID"
                            value={variant.product_id || variant.product || 'N/A'}
                            muted
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField
                            label="Attribute Count"
                            value={variant.attribute_count ?? attributeEntries.length}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField
                            label="Cost Adjustment"
                            value={formatCurrency(variant.cost_adjustment)}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Card>

                  <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <Box sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} color="#0f172a" mb={2.5}>
                        Attributes
                      </Typography>

                      {attributeEntries.length ? (
                        <Stack spacing={1.5}>
                          {attributeEntries.map((item) => (
                            <Box
                              key={`${item.label}-${item.value}`}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                border: '1px solid #e2e8f0',
                                bgcolor: '#f8fafc',
                              }}
                            >
                              <Typography variant="caption" color="text.secondary">
                                {item.label}
                              </Typography>
                              <Typography variant="body1" fontWeight={700} color="#0f172a">
                                {item.value || 'N/A'}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                          No structured attribute data is currently stored for this variant.
                        </Alert>
                      )}

                      <Divider sx={{ my: 3 }} />

                      <Typography variant="subtitle2" color="#334155" mb={1.5}>
                        Raw Attributes JSON
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          p: 2,
                          borderRadius: 2,
                          bgcolor: '#020617',
                          color: '#e2e8f0',
                          overflowX: 'auto',
                          fontSize: '0.875rem',
                          lineHeight: 1.6,
                        }}
                      >
                        {rawAttributesJson}
                      </Box>
                    </Box>
                  </Card>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, lg: 4 }}>
                <Stack spacing={3}>
                  <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <Box sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} color="#0f172a" mb={2}>
                        Quick Actions
                      </Typography>
                      <Stack spacing={1.5}>
                        <Button
                          variant="contained"
                          startIcon={<Iconify icon="solar:pen-bold" />}
                          onClick={openEditDialog}
                          sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                          Edit This Variant
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                          onClick={confirm.onTrue}
                          sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                          Delete This Variant
                        </Button>
                        <Link href={paths.dashboard.storeInventory.productVariants} passHref>
                          <Button
                            fullWidth
                            variant="text"
                            startIcon={<Iconify icon="eva:arrow-back-fill" />}
                            sx={{ textTransform: 'none', fontWeight: 700 }}
                          >
                            Return to Variant List
                          </Button>
                        </Link>
                      </Stack>
                    </Box>
                  </Card>

                  <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <Box sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} color="#0f172a" mb={2}>
                        Record Notes
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Traceability
                          </Typography>
                          <Typography variant="body2" color="#334155">
                            {variant.sku || variant.code
                              ? 'This variant already has a distinct code for operational tracking.'
                              : 'This variant should receive a distinct code before wider operational use.'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Parent Link
                          </Typography>
                          <Typography variant="body2" color="#334155">
                            {variant.product_name
                              ? `Linked to ${variant.product_name}.`
                              : 'This record is missing a readable parent-product label in the current payload.'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Attribute Coverage
                          </Typography>
                          <Typography variant="body2" color="#334155">
                            {attributeEntries.length
                              ? `${attributeEntries.length} attribute field${attributeEntries.length > 1 ? 's are' : ' is'} currently defined.`
                              : 'No attribute fields are defined yet for this variant.'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          </>
        )}
      </Stack>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit Product Variant</DialogTitle>
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
                renderInput={(inputParams) => (
                  <TextField {...inputParams} label="Parent Product" required />
                )}
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
            {submitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Update Variant'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Product Variant"
        content={`Are you sure you want to delete ${variant?.variant_name || variant?.name || 'this variant'}?`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        }
      />
    </Box>
  );
}
