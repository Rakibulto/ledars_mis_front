'use client';

import React from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
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

export const STORAGE_LOCATION_TYPE_OPTIONS = [
  { value: 'view', label: 'View' },
  { value: 'internal', label: 'Internal Location' },
  { value: 'supplier', label: 'Supplier Location' },
  { value: 'customer', label: 'Customer Location' },
  { value: 'production', label: 'Production' },
  { value: 'transit', label: 'Transit Location' },
  { value: 'scrap', label: 'Scrap' },
];

export const STORAGE_LOCATION_STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export const STORAGE_LOCATION_HANDLING_OPTIONS = [
  { value: '', label: 'All Handling' },
  { value: 'standard', label: 'Standard Flow' },
  { value: 'scrap', label: 'Scrap Only' },
  { value: 'return', label: 'Return Only' },
];

export const STORAGE_LOCATION_ORDER_OPTIONS = [
  { value: 'office__name', label: 'Office / Warehouse A-Z' },
  { value: 'name', label: 'Location A-Z' },
  { value: 'location_type', label: 'Type A-Z' },
  { value: 'barcode', label: 'Barcode A-Z' },
  { value: '-is_active', label: 'Active First' },
];

export function toStorageLocationOptions(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data?.results) ? data.results : [];
}

export function getParentLocationOptions(options, warehouseId, currentLocationId) {
  const warehouseKey = warehouseId !== undefined && warehouseId !== null ? String(warehouseId) : '';
  return (Array.isArray(options) ? options : []).filter((option) => {
    if (!option || !option.id) {
      return false;
    }
    if (currentLocationId && String(option.id) === String(currentLocationId)) {
      return false;
    }
    if (!warehouseId) {
      return true;
    }

    const optionWarehouse = String(option.warehouse || option.warehouse_id || option.office || '');
    return optionWarehouse === warehouseKey;
  });
}

export function getLocationTypeLabel(value) {
  return (
    STORAGE_LOCATION_TYPE_OPTIONS.find((option) => option.value === value)?.label ||
    value ||
    'Unknown'
  );
}

export function buildStorageLocationQuery({
  search,
  office,
  locationType,
  status,
  handling,
  ordering,
  page,
  pagination = true,
}) {
  const params = new URLSearchParams();
  const normalizedSearch = String(search || '').trim();

  if (ordering) {
    params.set('ordering', ordering);
  }

  if (normalizedSearch) {
    params.set('search', normalizedSearch);
  }

  if (office) {
    params.set('office', String(office));
  }

  if (locationType) {
    params.set('location_type', locationType);
  }

  if (status !== '') {
    params.set('is_active', status);
  }

  if (handling === 'scrap') {
    params.set('is_scrap', 'true');
  }

  if (handling === 'return') {
    params.set('is_return', 'true');
  }

  if (handling === 'standard') {
    params.set('is_scrap', 'false');
    params.set('is_return', 'false');
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String((page || 0) + 1));
  }

  return params.toString();
}

export function getEmptyStorageLocationForm() {
  return {
    name: '',
    office: '',
    location_type: 'internal',
    barcode: '',
    is_scrap: false,
    is_return: false,
    is_active: true,
  };
}

export function normalizeStorageLocationForm(location) {
  return {
    name: location?.name || '',
    office: location?.office ? String(location.office) : '',
    location_type: location?.location_type || 'internal',
    barcode: location?.barcode || '',
    is_scrap: Boolean(location?.is_scrap),
    is_return: Boolean(location?.is_return),
    is_active: Boolean(location?.is_active ?? true),
  };
}

export function validateStorageLocationForm(form) {
  if (!form.name.trim()) {
    return 'Location name is required.';
  }

  if (!form.office) {
    return 'Office / Warehouse is required.';
  }

  if (!form.location_type) {
    return 'Location type is required.';
  }

  return null;
}

export function storageLocationFormToPayload(form) {
  return {
    name: form.name.trim(),
    office: form.office ? Number(form.office) : null,
    location_type: form.location_type,
    barcode: form.barcode.trim() || null,
    is_scrap: Boolean(form.is_scrap),
    is_return: Boolean(form.is_return),
    is_active: Boolean(form.is_active),
  };
}

function getOfficeLabel(officeOptions, officeId) {
  const match = officeOptions.find((o) => String(o.id) === String(officeId));
  if (!match) return 'Not set';
  return match.code ? `${match.code} - ${match.name}` : match.name;
}

export function StorageLocationFormDialog({
  open,
  title,
  submitLabel,
  form,
  setForm,
  submitting,
  onClose,
  onSubmit,
  officeOptions,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const typeLabel = getLocationTypeLabel(form.location_type);
  const selectedOffice = officeOptions.find((o) => String(o.id) === String(form.office));

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Location Name"
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
              label="Office / Warehouse"
              value={form.office}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  office: event.target.value,
                }))
              }
              helperText="Select the office or warehouse that owns this storage location."
            >
              {officeOptions.map((option) => (
                <MenuItem key={option.id} value={String(option.id)}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={option.type === 'warehouse' ? 'Warehouse' : 'Office'}
                      size="small"
                      color={option.type === 'warehouse' ? 'warning' : 'primary'}
                      variant="outlined"
                      sx={{ height: 20, fontSize: 10 }}
                    />
                    {option.code ? `${option.code} - ${option.name}` : option.name}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Location Type"
              value={form.location_type}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  location_type: event.target.value,
                }))
              }
            >
              {STORAGE_LOCATION_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Barcode"
              value={form.barcode}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  barcode: event.target.value,
                }))
              }
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Card
              variant="outlined"
              sx={{
                display: 'flex',
                alignItems: 'center',
                borderRadius: 2.5,
                borderColor: alpha(theme.palette.text.primary, isDark ? 0.16 : 0.08),
              }}
            >
              <Box sx={{ px: 2.5, py: 2 }}>
                <Typography variant="overline" color="text.secondary">
                  Type Preview
                </Typography>
                <Typography variant="h6" fontWeight={800} color="text.primary">
                  {typeLabel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Control how this location participates in inventory routing and stock ownership.
                </Typography>
              </Box>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(form.is_scrap)}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      is_scrap: event.target.checked,
                    }))
                  }
                />
              }
              label="Scrap location"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(form.is_return)}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      is_return: event.target.checked,
                    }))
                  }
                />
              }
              label="Return location"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
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
              label="Location is active"
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
                <Typography variant="h6" fontWeight={700} color="text.primary" mb={1.5}>
                  Operational Preview
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2.5}>
                  Confirm office/warehouse ownership and special handling before you save.
                </Typography>

                <Grid container spacing={2}>
                  {[
                    {
                      label: 'Office / Warehouse',
                      value: getOfficeLabel(officeOptions, form.office),
                      helper: selectedOffice
                        ? `Type: ${selectedOffice.type === 'warehouse' ? 'Warehouse' : 'Office'}`
                        : 'The operational site responsible for this location.',
                    },
                    {
                      label: 'Location Type',
                      value: typeLabel,
                      helper: 'Controls routing and stock ownership for this location.',
                    },
                    {
                      label: 'Handling Flags',
                      value:
                        [form.is_scrap ? 'Scrap' : null, form.is_return ? 'Return' : null]
                          .filter(Boolean)
                          .join(' • ') || 'Standard flow',
                      helper: form.barcode.trim() || 'Barcode optional',
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
        <Button onClick={onSubmit} variant="contained" disabled={submitting}>
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
