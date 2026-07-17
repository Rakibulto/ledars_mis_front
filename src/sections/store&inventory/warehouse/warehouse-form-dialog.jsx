'use client';

import React from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Grid,
  Button,
  Dialog,
  MenuItem,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

export const DIVISION_OPTIONS = [
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
];

export const WAREHOUSE_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'closed', label: 'Closed' },
];

export const WAREHOUSE_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'closed', label: 'Closed' },
];

export const WAREHOUSE_ORDER_OPTIONS = [
  { value: '-created_at', label: 'Newest First' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'code', label: 'Code A-Z' },
  { value: 'division', label: 'Division A-Z' },
  { value: '-updated_at', label: 'Recently Updated' },
];

export function toWarehouseOptions(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data?.results) ? data.results : [];
}

export function getWarehouseTypeLabel(value) {
  if (!value) return 'Warehouse';
  return `${String(value).charAt(0).toUpperCase()}${String(value).slice(1)}`;
}

export function formatBudget(value) {
  if (value === null || value === undefined || value === '') return 'Not set';
  return `৳${Number(value).toLocaleString('en-BD')}`;
}

export function getEmptyWarehouseForm() {
  return {
    code: '',
    name: '',
    district: '',
    division: '',
    address: '',
    phone: '',
    email: '',
    status: 'active',
    headOfOffice: '',
    budgetAllocation: '',
    budgetUtilized: '',
  };
}

export function normalizeWarehouseForm(warehouse) {
  return {
    code: warehouse?.code || '',
    name: warehouse?.name || '',
    district: warehouse?.district || '',
    division: warehouse?.division || '',
    address: warehouse?.address || '',
    phone: warehouse?.phone || '',
    email: warehouse?.email || '',
    status: warehouse?.status || 'active',
    headOfOffice: warehouse?.headOfOffice || '',
    budgetAllocation: warehouse?.budgetAllocation ?? '',
    budgetUtilized: warehouse?.budgetUtilized ?? '',
  };
}

export function validateWarehouseForm(form) {
  if (!form.code.trim()) {
    return 'Warehouse code is required.';
  }

  if (!form.name.trim()) {
    return 'Warehouse name is required.';
  }

  if (!form.status) {
    return 'Status is required.';
  }

  return null;
}

export function warehouseFormToPayload(form) {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    district: form.district.trim(),
    division: form.division || null,
    address: form.address.trim(),
    phone: form.phone.trim(),
    email: form.email.trim() || null,
    type: 'warehouse',
    status: form.status,
    headOfOffice: form.headOfOffice.trim() || null,
    budgetAllocation: form.budgetAllocation === '' ? 0 : Number(form.budgetAllocation),
    budgetUtilized: form.budgetUtilized === '' ? 0 : Number(form.budgetUtilized),
  };
}

export function formatCapacity(value) {
  if (value === null || value === undefined || value === '') {
    return 'Not set';
  }
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return 'Not set';
  }
  return `${amount.toLocaleString('en-BD')} sqft`;
}

export function WarehouseFormDialog({
  open,
  title,
  submitLabel,
  form,
  setForm,
  submitting,
  onClose,
  onSubmit,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  function field(key) {
    return (event) => setForm((f) => ({ ...f, [key]: event.target.value }));
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {/* Row 1 – Code / Name */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Warehouse Code"
              value={form.code}
              onChange={field('code')}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              label="Warehouse Name"
              value={form.name}
              onChange={field('name')}
            />
          </Grid>

          {/* Row 2 – District / Division */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="District"
              value={form.district}
              onChange={field('district')}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Division"
              value={form.division}
              onChange={field('division')}
            >
              <MenuItem value="">— Select Division —</MenuItem>
              {DIVISION_OPTIONS.map((div) => (
                <MenuItem key={div} value={div}>
                  {div}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Row 3 – Address */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Address"
              value={form.address}
              onChange={field('address')}
            />
          </Grid>

          {/* Row 4 – Phone / Email */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Phone" value={form.phone} onChange={field('phone')} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={form.email}
              onChange={field('email')}
            />
          </Grid>

          {/* Row 5 – Head of Office / Status */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Head of Office"
              value={form.headOfOffice}
              onChange={field('headOfOffice')}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Status"
              value={form.status}
              onChange={field('status')}
            >
              {WAREHOUSE_STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Row 6 – Budget Allocation / Budget Utilized */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="number"
              label="Budget Allocation (৳)"
              value={form.budgetAllocation}
              onChange={field('budgetAllocation')}
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="number"
              label="Budget Utilized (৳)"
              value={form.budgetUtilized}
              onChange={field('budgetUtilized')}
              inputProps={{ min: 0 }}
            />
          </Grid>

          {/* Summary preview */}
          <Grid size={{ xs: 12 }}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: alpha(theme.palette.text.primary, isDark ? 0.16 : 0.08),
              }}
            >
              <Box sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary" mb={1.5}>
                  Summary
                </Typography>
                <Grid container spacing={2}>
                  {[
                    {
                      label: 'Location',
                      value: [form.district, form.division].filter(Boolean).join(', ') || 'Not set',
                    },
                    {
                      label: 'Head of Office',
                      value: form.headOfOffice.trim() || 'Unassigned',
                    },
                    {
                      label: 'Budget Allocation',
                      value: formatBudget(form.budgetAllocation),
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
                        <Typography variant="body1" fontWeight={700} color="text.primary">
                          {metric.value}
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
