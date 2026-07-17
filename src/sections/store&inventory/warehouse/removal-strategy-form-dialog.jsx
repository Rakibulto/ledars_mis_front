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

export const REMOVAL_STRATEGY_OPTIONS = [
  { value: 'fifo', label: 'First In, First Out (FIFO)' },
  { value: 'lifo', label: 'Last In, First Out (LIFO)' },
  { value: 'fefo', label: 'First Expiry, First Out (FEFO)' },
  { value: 'closest', label: 'Closest Location' },
];

export const REMOVAL_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export const REMOVAL_ORDER_OPTIONS = [
  { value: 'name', label: 'Name A-Z' },
  { value: '-name', label: 'Name Z-A' },
  { value: 'strategy', label: 'Method A-Z' },
  { value: 'warehouse__name', label: 'Warehouse A-Z' },
];

export function toDataArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data?.results) ? data.results : [];
}

export function getRemovalStrategyLabel(strategy) {
  return strategy?.name || 'Unnamed strategy';
}

export function getRemovalMethodLabel(strategy) {
  const strategyValue = typeof strategy === 'string' ? strategy : strategy?.strategy;

  return (
    strategy?.strategy_label ||
    REMOVAL_STRATEGY_OPTIONS.find((option) => option.value === strategyValue)?.label ||
    'Unknown method'
  );
}

export function buildRemovalStrategyQuery({
  search,
  warehouse,
  status,
  strategy,
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

  if (strategy) {
    params.set('strategy', strategy);
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String((page || 0) + 1));
  }

  return params.toString();
}

export function getEmptyRemovalStrategyForm() {
  return {
    name: '',
    strategy: 'fifo',
    warehouse: '',
    is_active: true,
  };
}

export function normalizeRemovalStrategyForm(strategy) {
  return {
    name: strategy?.name || '',
    strategy: strategy?.strategy || 'fifo',
    warehouse: strategy?.warehouse ? String(strategy.warehouse) : '',
    is_active: Boolean(strategy?.is_active),
  };
}

export function validateRemovalStrategyForm(form) {
  if (!form.name.trim()) {
    return 'Strategy name is required.';
  }

  if (!form.strategy) {
    return 'Removal method is required.';
  }

  if (!form.warehouse) {
    return 'Warehouse is required.';
  }

  return null;
}

export function removalStrategyFormToPayload(form) {
  return {
    name: form.name.trim(),
    strategy: form.strategy,
    warehouse: Number(form.warehouse),
    is_active: Boolean(form.is_active),
  };
}

export function RemovalStrategyFormDialog({
  open,
  title,
  submitLabel,
  form,
  setForm,
  submitting,
  onClose,
  onSubmit,
  warehouses,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const methodLabel = getRemovalMethodLabel(form.strategy);
  const warehousePreview = warehouses.find((warehouse) => String(warehouse.id) === form.warehouse);

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Strategy Name"
              value={form.name}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  name: event.target.value,
                }))
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Removal Method"
              value={form.strategy}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  strategy: event.target.value,
                }))
              }
            >
              {REMOVAL_STRATEGY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
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
              label="Strategy is active"
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
                Strategy preview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {form.name.trim() || 'Unnamed strategy'} will apply {methodLabel.toLowerCase()} in{' '}
                {warehousePreview?.name || 'the selected warehouse'}.
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
