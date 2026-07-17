'use client';

import React from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Card,
  Grid,
  Button,
  Switch,
  Dialog,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  FormControlLabel,
} from '@mui/material';

export const ROUTE_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export const ROUTE_STEP_FILTER_OPTIONS = [
  { value: '', label: 'All Routes' },
  { value: 'true', label: 'With Steps' },
  { value: 'false', label: 'Without Steps' },
];

export const ROUTE_ORDER_OPTIONS = [
  { value: 'name', label: 'Name A-Z' },
  { value: '-name', label: 'Name Z-A' },
  { value: 'code', label: 'Code A-Z' },
  { value: '-code', label: 'Code Z-A' },
];

export function toDataArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data?.results) ? data.results : [];
}

export function getRouteName(route) {
  return route?.name || 'Unnamed route';
}

export function getRouteStepCount(route) {
  return Number(route?.step_count ?? route?.steps?.length ?? 0);
}

export function getRouteSteps(route) {
  return Array.isArray(route?.steps) ? route.steps : [];
}

export function buildRouteQuery({ search, status, hasSteps, ordering, page, pagination = true }) {
  const params = new URLSearchParams();

  if (ordering) {
    params.set('ordering', ordering);
  }

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (status !== '') {
    params.set('is_active', status);
  }

  if (hasSteps) {
    params.set('has_steps', hasSteps);
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String((page || 0) + 1));
  }

  return params.toString();
}

export function getEmptyRouteForm() {
  return {
    name: '',
    code: '',
    description: '',
    steps_text: '',
    is_active: true,
  };
}

export function normalizeRouteForm(route) {
  return {
    name: route?.name || '',
    code: route?.code || '',
    description: route?.description || '',
    steps_text: getRouteSteps(route).join('\n'),
    is_active: Boolean(route?.is_active),
  };
}

export function validateRouteForm(form) {
  if (!form.name.trim()) {
    return 'Route name is required.';
  }

  if (!form.code.trim()) {
    return 'Route code is required.';
  }

  return null;
}

export function routeFormToPayload(form) {
  return {
    name: form.name.trim(),
    code: form.code.trim(),
    description: form.description.trim(),
    steps: form.steps_text
      .split('\n')
      .map((step) => step.trim())
      .filter(Boolean),
    is_active: Boolean(form.is_active),
  };
}

export function RouteFormDialog({
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

  const stepPreview = form.steps_text
    .split('\n')
    .map((step) => step.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Route Name"
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
              label="Route Code"
              value={form.code}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  code: event.target.value,
                }))
              }
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              minRows={3}
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
            <TextField
              fullWidth
              multiline
              minRows={5}
              label="Route Steps"
              placeholder="Enter one step per line"
              helperText="Each line becomes one route step in the backend JSON list."
              value={form.steps_text}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  steps_text: event.target.value,
                }))
              }
            />
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
              label="Route is active"
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
                Route preview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {form.name.trim() || 'Unnamed route'} with code {form.code.trim() || 'pending'} has{' '}
                {stepPreview.length || 0} preview step(s)
                {stepPreview.length ? `: ${stepPreview.join(' -> ')}` : '.'}
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
