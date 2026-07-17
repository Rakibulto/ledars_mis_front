'use client';

import React, { useMemo } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Grid,
  Button,
  Dialog,
  Switch,
  MenuItem,
  TextField,
  Typography,
  DialogTitle,
  Autocomplete,
  DialogActions,
  DialogContent,
  FormControlLabel,
} from '@mui/material';

export const TRIGGER_OPTIONS = [
  { id: 'automatic', label: 'Automatic' },
  { id: 'manual', label: 'Manual' },
];

export const TRIGGER_FILTER_OPTIONS = [{ id: '', label: 'All Triggers' }, ...TRIGGER_OPTIONS];

export const REORDER_STATUS_FILTER_OPTIONS = [
  { id: '', label: 'All Status' },
  { id: 'true', label: 'Active' },
  { id: 'false', label: 'Inactive' },
];

export function getEmptyReorderRuleForm() {
  return {
    product: null,
    warehouse: null,
    min_qty: '',
    max_qty: '',
    reorder_qty: '',
    lead_time_days: '7',
    trigger: 'automatic',
    is_active: true,
  };
}

export function toReorderOptions(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data?.results) ? data.results : [];
}

export function sortReorderOptionsByName(options) {
  return [...options].sort((left, right) =>
    String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
      sensitivity: 'base',
    })
  );
}

export function formatReorderAmount(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString('en-BD', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function buildReorderRuleQuery({ search, productId, warehouseId, trigger, status, page }) {
  const params = new URLSearchParams();

  params.set('ordering', '-id');
  params.set('pagination', 'true');
  params.set('page', String(page + 1));

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (productId) {
    params.set('product', String(productId));
  }

  if (warehouseId) {
    params.set('warehouse', String(warehouseId));
  }

  if (trigger) {
    params.set('trigger', trigger);
  }

  if (status !== '') {
    params.set('is_active', status);
  }

  return params.toString();
}

export function normalizeReorderRuleForm(rule) {
  return {
    product: rule?.product ?? null,
    warehouse: rule?.warehouse ?? null,
    min_qty: String(rule?.min_qty ?? ''),
    max_qty: String(rule?.max_qty ?? ''),
    reorder_qty: String(rule?.reorder_qty ?? ''),
    lead_time_days: String(rule?.lead_time_days ?? 7),
    trigger: rule?.trigger || 'automatic',
    is_active: Boolean(rule?.is_active),
  };
}

export function validateReorderRuleForm(form) {
  if (!form.product) {
    return 'A product must be selected.';
  }

  if (Number(form.min_qty || 0) < 0) {
    return 'Minimum quantity cannot be negative.';
  }

  if (Number(form.max_qty || 0) < 0) {
    return 'Maximum quantity cannot be negative.';
  }

  if (Number(form.reorder_qty || 0) <= 0) {
    return 'Reorder quantity must be greater than zero.';
  }

  if (Number(form.max_qty || 0) < Number(form.min_qty || 0)) {
    return 'Maximum quantity must be greater than or equal to minimum quantity.';
  }

  if (Number(form.lead_time_days || 0) < 0) {
    return 'Lead time cannot be negative.';
  }

  return null;
}

export function reorderRuleFormToPayload(form) {
  return {
    product: form.product,
    warehouse: form.warehouse || null,
    min_qty: form.min_qty || '0',
    max_qty: form.max_qty || '0',
    reorder_qty: form.reorder_qty || '0',
    lead_time_days: Number(form.lead_time_days || 0),
    trigger: form.trigger,
    is_active: Boolean(form.is_active),
  };
}

export function ReorderRuleFormDialog({
  open,
  title,
  submitLabel,
  form,
  setForm,
  products,
  warehouses,
  submitting,
  onClose,
  onSubmit,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const productLookup = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );
  const warehouseLookup = useMemo(
    () => new Map(warehouses.map((warehouse) => [warehouse.id, warehouse])),
    [warehouses]
  );
  const minQty = Number(form.min_qty || 0);
  const maxQty = Number(form.max_qty || 0);
  const reorderQty = Number(form.reorder_qty || 0);
  const coverageWindow = Math.max(maxQty - minQty, 0);

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              options={products}
              value={productLookup.get(form.product) || null}
              onChange={(event, nextValue) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  product: nextValue?.id ?? null,
                }))
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) => option?.name || ''}
              renderInput={(params) => <TextField {...params} label="Product" />}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              options={warehouses}
              value={warehouseLookup.get(form.warehouse) || null}
              onChange={(event, nextValue) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  warehouse: nextValue?.id ?? null,
                }))
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) => option?.name || ''}
              renderInput={(params) => <TextField {...params} label="Warehouse (Optional)" />}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              type="number"
              label="Minimum Qty"
              value={form.min_qty}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  min_qty: event.target.value,
                }))
              }
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              type="number"
              label="Maximum Qty"
              value={form.max_qty}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  max_qty: event.target.value,
                }))
              }
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              type="number"
              label="Reorder Qty"
              value={form.reorder_qty}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  reorder_qty: event.target.value,
                }))
              }
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Trigger"
              value={form.trigger}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  trigger: event.target.value,
                }))
              }
            >
              {TRIGGER_OPTIONS.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="number"
              label="Lead Time (Days)"
              value={form.lead_time_days}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  lead_time_days: event.target.value,
                }))
              }
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
              label="Rule is active"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: alpha(theme.palette.text.primary, isDark ? 0.16 : 0.08),
              }}
            >
              <Box sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={700} color="text.primary" mb={1}>
                  Policy Preview
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2.5}>
                  Review the replenishment span, reorder quantity, and supplier wait time before
                  saving.
                </Typography>

                <Grid container spacing={2}>
                  {[
                    {
                      label: 'Coverage Window',
                      value: formatReorderAmount(coverageWindow),
                      helper: 'Difference between max and minimum stock.',
                    },
                    {
                      label: 'Reorder Batch',
                      value: formatReorderAmount(reorderQty),
                      helper: 'Quantity to replenish when triggered.',
                    },
                    {
                      label: 'Lead Time',
                      value: `${Number(form.lead_time_days || 0)} days`,
                      helper: 'Expected supplier or warehouse response time.',
                    },
                  ].map((metric) => (
                    <Grid key={metric.label} size={{ xs: 12, md: 4 }}>
                      <Card
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          borderColor: alpha(theme.palette.text.primary, isDark ? 0.16 : 0.08),
                          bgcolor: alpha(theme.palette.primary.main, isDark ? 0.12 : 0.05),
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {metric.label}
                        </Typography>
                        <Typography variant="h6" fontWeight={800} color="text.primary">
                          {metric.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {metric.helper}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
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
