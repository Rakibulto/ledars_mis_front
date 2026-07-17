'use client';

import React, { useMemo } from 'react';

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

export const OPERATION_TYPE_OPTIONS = [
  { value: 'incoming', label: 'Receipts' },
  { value: 'outgoing', label: 'Delivery Orders' },
  { value: 'internal', label: 'Internal Transfers' },
  { value: 'returns', label: 'Returns' },
  { value: 'scrap', label: 'Scrap' },
];

export const OPERATION_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export const OPERATION_ORDER_OPTIONS = [
  { value: 'name', label: 'Name A-Z' },
  { value: '-name', label: 'Name Z-A' },
  { value: 'code', label: 'Code A-Z' },
  { value: 'operation_type', label: 'Category A-Z' },
  { value: 'warehouse__name', label: 'Warehouse A-Z' },
];

export function toDataArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data?.results) ? data.results : [];
}

export function getOperationTypeName(operationType) {
  return operationType?.name || 'Unnamed operation type';
}

export function getOperationTypeLabel(operationType) {
  const typeValue =
    typeof operationType === 'string' ? operationType : operationType?.operation_type;

  return (
    operationType?.operation_type_label ||
    OPERATION_TYPE_OPTIONS.find((option) => option.value === typeValue)?.label ||
    'Unknown operation type'
  );
}

export function buildOperationTypeQuery({
  search,
  warehouse,
  operationType,
  status,
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

  if (operationType) {
    params.set('operation_type', operationType);
  }

  if (status !== '') {
    params.set('is_active', status);
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String((page || 0) + 1));
  }

  return params.toString();
}

export function getEmptyOperationTypeForm() {
  return {
    name: '',
    code: '',
    operation_type: 'incoming',
    warehouse: '',
    default_source: '',
    default_destination: '',
    is_active: true,
  };
}

export function normalizeOperationTypeForm(operationType) {
  return {
    name: operationType?.name || '',
    code: operationType?.code || '',
    operation_type: operationType?.operation_type || 'incoming',
    warehouse: operationType?.warehouse ? String(operationType.warehouse) : '',
    default_source: operationType?.default_source ? String(operationType.default_source) : '',
    default_destination: operationType?.default_destination
      ? String(operationType.default_destination)
      : '',
    is_active: Boolean(operationType?.is_active),
  };
}

export function validateOperationTypeForm(form) {
  if (!form.name.trim()) {
    return 'Operation type name is required.';
  }

  if (!form.code.trim()) {
    return 'Operation type code is required.';
  }

  if (!form.operation_type) {
    return 'Operation category is required.';
  }

  if (!form.warehouse) {
    return 'Warehouse is required.';
  }

  return null;
}

export function operationTypeFormToPayload(form) {
  return {
    name: form.name.trim(),
    code: form.code.trim(),
    operation_type: form.operation_type,
    warehouse: Number(form.warehouse),
    default_source: form.default_source ? Number(form.default_source) : null,
    default_destination: form.default_destination ? Number(form.default_destination) : null,
    is_active: Boolean(form.is_active),
  };
}

export function OperationTypeFormDialog({
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
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const selectedWarehouse = useMemo(
    () => warehouses.find((warehouse) => String(warehouse.id) === form.warehouse),
    [form.warehouse, warehouses]
  );
  const filteredLocations = useMemo(
    () =>
      form.warehouse
        ? locations.filter((location) => String(location.warehouse) === String(form.warehouse))
        : [],
    [form.warehouse, locations]
  );
  const sourcePreview = useMemo(
    () => locations.find((location) => String(location.id) === form.default_source),
    [form.default_source, locations]
  );
  const destinationPreview = useMemo(
    () => locations.find((location) => String(location.id) === form.default_destination),
    [form.default_destination, locations]
  );

  const handleWarehouseChange = (event) => {
    const nextWarehouse = event.target.value;

    setForm((currentForm) => {
      const sourceStillValid = locations.some(
        (location) =>
          String(location.id) === currentForm.default_source &&
          String(location.warehouse) === String(nextWarehouse)
      );
      const destinationStillValid = locations.some(
        (location) =>
          String(location.id) === currentForm.default_destination &&
          String(location.warehouse) === String(nextWarehouse)
      );

      return {
        ...currentForm,
        warehouse: nextWarehouse,
        default_source: sourceStillValid ? currentForm.default_source : '',
        default_destination: destinationStillValid ? currentForm.default_destination : '',
      };
    });
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Operation Type Name"
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
              fullWidth
              label="Operation Type Code"
              value={form.code}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  code: event.target.value,
                }))
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Operation Category"
              value={form.operation_type}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  operation_type: event.target.value,
                }))
              }
            >
              {OPERATION_TYPE_OPTIONS.map((option) => (
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
              onChange={handleWarehouseChange}
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
              label="Default Source"
              value={form.default_source}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  default_source: event.target.value,
                }))
              }
              disabled={!form.warehouse}
              helperText={
                form.warehouse
                  ? 'Optional source location for this workflow.'
                  : 'Select a warehouse first.'
              }
            >
              <MenuItem value="">No default source</MenuItem>
              {filteredLocations.map((location) => (
                <MenuItem key={location.id} value={String(location.id)}>
                  {location.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Default Destination"
              value={form.default_destination}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  default_destination: event.target.value,
                }))
              }
              disabled={!form.warehouse}
              helperText={
                form.warehouse
                  ? 'Optional destination location for this workflow.'
                  : 'Select a warehouse first.'
              }
            >
              <MenuItem value="">No default destination</MenuItem>
              {filteredLocations.map((location) => (
                <MenuItem key={location.id} value={String(location.id)}>
                  {location.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
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
              label="Operation type is active"
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
                Operation preview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {form.name.trim() || 'Unnamed operation type'} will run as{' '}
                {getOperationTypeLabel(form.operation_type).toLowerCase()} in{' '}
                {selectedWarehouse?.name || 'the selected warehouse'}.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Default flow: {sourcePreview?.name || 'No source'} to{' '}
                {destinationPreview?.name || 'No destination'}.
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
