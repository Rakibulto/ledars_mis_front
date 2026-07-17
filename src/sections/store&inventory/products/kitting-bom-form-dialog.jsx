'use client';

import React, { useMemo } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Grid,
  Stack,
  Button,
  Dialog,
  Switch,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  Autocomplete,
  DialogActions,
  DialogContent,
  FormControlLabel,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

export const BOM_STATUS_FILTER_OPTIONS = [
  { id: '', label: 'All Status' },
  { id: 'true', label: 'Active' },
  { id: 'false', label: 'Inactive' },
];

function createComponentKey() {
  return `bom-component-${Math.random().toString(36).slice(2, 11)}`;
}

export function createEmptyBomComponent() {
  return {
    key: createComponentKey(),
    id: null,
    component: null,
    quantity: '',
    unit_cost: '',
  };
}

export function getEmptyBomForm() {
  return {
    name: '',
    code: '',
    product: null,
    description: '',
    assembly_time_minutes: '0',
    is_active: true,
    components: [createEmptyBomComponent()],
  };
}

export function toBomOptions(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data?.results) ? data.results : [];
}

export function sortBomOptionsByName(options) {
  return [...options].sort((left, right) =>
    String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
      sensitivity: 'base',
    })
  );
}

export function formatBomAmount(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString('en-BD', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function buildKittingBomQuery({ search, productId, status, page }) {
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

  if (status !== '') {
    params.set('is_active', status);
  }

  return params.toString();
}

export function getBomDerivedTotals(components = []) {
  return components.reduce(
    (accumulator, component) => {
      const quantity = Number(component.quantity || 0);
      const unitCost = Number(component.unit_cost || 0);

      if (component.component) {
        accumulator.componentCount += 1;
      }

      accumulator.totalQty += quantity;
      accumulator.totalCost += quantity * unitCost;

      return accumulator;
    },
    {
      componentCount: 0,
      totalQty: 0,
      totalCost: 0,
    }
  );
}

export function normalizeBomForm(bom) {
  const normalizedComponents = Array.isArray(bom?.components)
    ? bom.components.map((component) => ({
        key: createComponentKey(),
        id: component.id ?? null,
        component: component.component ?? null,
        quantity: String(component.quantity ?? ''),
        unit_cost: String(component.unit_cost ?? ''),
      }))
    : [];

  return {
    name: bom?.name || '',
    code: bom?.code || '',
    product: bom?.product ?? null,
    description: bom?.description || '',
    assembly_time_minutes: String(bom?.assembly_time_minutes ?? 0),
    is_active: Boolean(bom?.is_active),
    components: normalizedComponents.length ? normalizedComponents : [createEmptyBomComponent()],
  };
}

export function validateBomForm(form) {
  if (!form.name.trim()) {
    return 'BOM name is required.';
  }

  if (!form.code.trim()) {
    return 'BOM code is required.';
  }

  if (!form.product) {
    return 'A finished product must be selected.';
  }

  if (Number(form.assembly_time_minutes || 0) < 0) {
    return 'Assembly time cannot be negative.';
  }

  for (let index = 0; index < (form.components || []).length; index += 1) {
    const component = form.components[index];
    const hasAnyValue =
      Boolean(component.component) || component.quantity !== '' || component.unit_cost !== '';

    if (hasAnyValue) {
      if (!component.component) {
        return `Component ${index + 1} is missing a product.`;
      }

      if (Number(component.quantity || 0) <= 0) {
        return `Component ${index + 1} must have a quantity greater than zero.`;
      }

      if (Number(component.unit_cost || 0) < 0) {
        return `Component ${index + 1} cannot have a negative unit cost.`;
      }
    }
  }

  return null;
}

export function bomFormToPayload(form) {
  const components = (form.components || [])
    .filter((component) => component.component)
    .map((component) => ({
      id: component.id ?? undefined,
      component: component.component,
      quantity: component.quantity || '0',
      unit_cost: component.unit_cost || '0',
    }));

  return {
    name: form.name.trim(),
    code: form.code.trim(),
    product: form.product,
    description: form.description.trim(),
    assembly_time_minutes: Number(form.assembly_time_minutes || 0),
    is_active: Boolean(form.is_active),
    total_cost: getBomDerivedTotals(components).totalCost,
    components,
  };
}

export function KittingBomFormDialog({
  open,
  title,
  submitLabel,
  form,
  setForm,
  products,
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
  const derivedTotals = useMemo(() => getBomDerivedTotals(form.components), [form.components]);

  const updateComponent = (componentKey, patch) => {
    setForm((currentForm) => ({
      ...currentForm,
      components: currentForm.components.map((component) =>
        component.key === componentKey ? { ...component, ...patch } : component
      ),
    }));
  };

  const removeComponent = (componentKey) => {
    setForm((currentForm) => {
      const nextComponents = currentForm.components.filter(
        (component) => component.key !== componentKey
      );

      return {
        ...currentForm,
        components: nextComponents.length ? nextComponents : [createEmptyBomComponent()],
      };
    });
  };

  const addComponent = () => {
    setForm((currentForm) => ({
      ...currentForm,
      components: [...currentForm.components, createEmptyBomComponent()],
    }));
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="BOM Name"
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
              label="BOM Code"
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
              renderInput={(params) => <TextField {...params} label="Finished Product" />}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="number"
              label="Assembly Time (Minutes)"
              value={form.assembly_time_minutes}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  assembly_time_minutes: event.target.value,
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
              label="BOM is active"
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
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  spacing={2}
                  mb={2}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={700} color="text.primary">
                      Component Lines
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add every component, quantity, and cost used to assemble this finished item.
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<Iconify icon="mingcute:add-line" />}
                    onClick={addComponent}
                  >
                    Add Component
                  </Button>
                </Stack>

                <Stack spacing={2}>
                  {form.components.map((component, index) => {
                    const selectedComponent = productLookup.get(component.component) || null;

                    return (
                      <Card
                        key={component.key}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          borderColor: alpha(theme.palette.text.primary, isDark ? 0.16 : 0.08),
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={1.5}
                        >
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                              Component {index + 1}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {selectedComponent?.code || 'Choose a component product'}
                            </Typography>
                          </Box>
                          <IconButton
                            color="error"
                            onClick={() => removeComponent(component.key)}
                            disabled={form.components.length === 1 && !component.component}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                          </IconButton>
                        </Stack>

                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Autocomplete
                              options={products}
                              value={selectedComponent}
                              onChange={(event, nextValue) =>
                                updateComponent(component.key, { component: nextValue?.id ?? null })
                              }
                              isOptionEqualToValue={(option, value) => option.id === value.id}
                              getOptionLabel={(option) => option?.name || ''}
                              renderInput={(params) => (
                                <TextField {...params} label="Component Product" />
                              )}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Quantity"
                              value={component.quantity}
                              onChange={(event) =>
                                updateComponent(component.key, { quantity: event.target.value })
                              }
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Unit Cost"
                              value={component.unit_cost}
                              onChange={(event) =>
                                updateComponent(component.key, { unit_cost: event.target.value })
                              }
                            />
                          </Grid>
                        </Grid>
                      </Card>
                    );
                  })}
                </Stack>

                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  {[
                    {
                      label: 'Component Count',
                      value: derivedTotals.componentCount,
                      helper: 'Active component selections in this BOM.',
                    },
                    {
                      label: 'Total Quantity',
                      value: formatBomAmount(derivedTotals.totalQty),
                      helper: 'Combined quantity across all lines.',
                    },
                    {
                      label: 'Estimated Cost',
                      value: `Tk ${formatBomAmount(derivedTotals.totalCost)}`,
                      helper: 'Derived from quantity x unit cost.',
                    },
                  ].map((metric) => (
                    <Grid key={metric.label} size={{ xs: 12, md: 4 }}>
                      <Card
                        variant="outlined"
                        sx={{
                          mt: 2,
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
