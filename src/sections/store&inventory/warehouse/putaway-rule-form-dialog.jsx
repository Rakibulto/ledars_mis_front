'use client';

import React from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Card,
  Grid,
  Button,
  Switch,
  Dialog,
  MenuItem,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  FormControlLabel,
} from '@mui/material';

export const PUTAWAY_TARGET_OPTIONS = [
  { value: 'product', label: 'Product Rule' },
  { value: 'category', label: 'Category Rule' },
];

export const PUTAWAY_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export const PUTAWAY_ORDER_OPTIONS = [
  { value: 'sequence', label: 'Priority Low to High' },
  { value: '-sequence', label: 'Priority High to Low' },
  { value: 'warehouse__name', label: 'Warehouse A-Z' },
  { value: 'location__name', label: 'Location A-Z' },
  { value: 'product__name', label: 'Product A-Z' },
  { value: 'category__name', label: 'Category A-Z' },
];

export function toDataArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data?.results) ? data.results : [];
}

export function getPutawayTargetLabel(rule) {
  return rule?.target_name || rule?.product_name || rule?.category_name || 'No target configured';
}

export function getPutawayScopeLabel(rule) {
  if ((rule?.target_type || '').toLowerCase() === 'product' || rule?.product) {
    return 'Product Rule';
  }

  if ((rule?.target_type || '').toLowerCase() === 'category' || rule?.category) {
    return 'Category Rule';
  }

  return 'Unscoped Rule';
}

export function buildPutawayRuleQuery({
  search,
  warehouse,
  status,
  targetType,
  ordering,
  page,
  pagination = true,
}) {
  const params = new URLSearchParams();

  if (ordering) {
    params.set('ordering', ordering);
  }

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (warehouse) {
    params.set('warehouse', warehouse);
  }

  if (status !== '') {
    params.set('is_active', status);
  }

  if (targetType) {
    params.set('target_type', targetType);
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String((page || 0) + 1));
  }

  return params.toString();
}

export function getEmptyPutawayRuleForm() {
  return {
    target_type: 'product',
    product: '',
    category: '',
    warehouse: '',
    location: '',
    sequence: '10',
    is_active: true,
  };
}

export function normalizePutawayRuleForm(rule) {
  return {
    target_type: (
      rule?.target_type ||
      (rule?.product ? 'product' : 'category') ||
      'product'
    ).toLowerCase(),
    product: rule?.product ? String(rule.product) : '',
    category: rule?.category ? String(rule.category) : '',
    warehouse: rule?.warehouse ? String(rule.warehouse) : '',
    location: rule?.location ? String(rule.location) : '',
    sequence:
      rule?.sequence === null || rule?.sequence === undefined ? '10' : String(rule.sequence),
    is_active: Boolean(rule?.is_active),
  };
}

export function validatePutawayRuleForm(form) {
  if (!form.target_type) {
    return 'Rule scope is required.';
  }

  if (form.target_type === 'product' && !form.product) {
    return 'Select a product for this putaway rule.';
  }

  if (form.target_type === 'category' && !form.category) {
    return 'Select a category for this putaway rule.';
  }

  if (!form.warehouse) {
    return 'Warehouse is required.';
  }

  if (!form.location) {
    return 'Destination location is required.';
  }

  if (!form.sequence || Number(form.sequence) < 1) {
    return 'Sequence must be 1 or greater.';
  }

  return null;
}

export function putawayRuleFormToPayload(form) {
  return {
    product: form.target_type === 'product' && form.product ? Number(form.product) : null,
    category: form.target_type === 'category' && form.category ? Number(form.category) : null,
    warehouse: Number(form.warehouse),
    location: Number(form.location),
    sequence: Number(form.sequence),
    is_active: Boolean(form.is_active),
  };
}

export function PutawayRuleFormDialog({
  open,
  title,
  submitLabel,
  form,
  setForm,
  submitting,
  onClose,
  onSubmit,
  warehouses,
  locations,
  products,
  categories,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const targetPreview =
    form.target_type === 'product'
      ? products.find((product) => String(product.id) === form.product)?.name
      : categories.find((category) => String(category.id) === form.category)?.name;
  const warehousePreview = warehouses.find((warehouse) => String(warehouse.id) === form.warehouse);
  const locationPreview = locations.find((location) => String(location.id) === form.location);

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Rule Scope"
              value={form.target_type}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  target_type: event.target.value,
                  product: event.target.value === 'product' ? currentForm.product : '',
                  category: event.target.value === 'category' ? currentForm.category : '',
                }))
              }
            >
              {PUTAWAY_TARGET_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            {form.target_type === 'product' ? (
              <TextField
                select
                fullWidth
                label="Product"
                value={form.product}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    product: event.target.value,
                  }))
                }
              >
                {products.map((product) => (
                  <MenuItem key={product.id} value={String(product.id)}>
                    {product.name} ({product.code})
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                select
                fullWidth
                label="Category"
                value={form.category}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    category: event.target.value,
                  }))
                }
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={String(category.id)}>
                    {category.name} ({category.level})
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Warehouse"
              value={form.warehouse}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  warehouse: event.target.value,
                  location: '',
                }))
              }
            >
              {warehouses.map((warehouse) => (
                <MenuItem key={warehouse.id} value={String(warehouse.id)}>
                  {warehouse.name} ({warehouse.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Destination Location"
              value={form.location}
              disabled={!form.warehouse}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  location: event.target.value,
                }))
              }
              helperText={
                form.warehouse
                  ? 'Only locations from the selected warehouse are shown.'
                  : 'Select a warehouse first to load valid destination locations.'
              }
            >
              {locations.map((location) => (
                <MenuItem key={location.id} value={String(location.id)}>
                  {location.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="number"
              label="Priority Sequence"
              value={form.sequence}
              inputProps={{ min: 1 }}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  sequence: event.target.value,
                }))
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      is_active: event.target.checked,
                    }))
                  }
                />
              }
              label="Rule is active"
              sx={{ height: '100%', alignItems: 'center' }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.18 : 0.08)}`,
                boxShadow: 'none',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isDark ? 0.2 : 0.08)}, ${alpha(theme.palette.info.main, isDark ? 0.2 : 0.08)})`,
              }}
            >
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.75 }}>
                Routing preview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {targetPreview || 'Select a target'} will route into{' '}
                {locationPreview?.name || 'a location'}
                {warehousePreview ? ` inside ${warehousePreview.name}` : ''} at priority sequence{' '}
                {form.sequence || '10'}.
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={submitting}>
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
