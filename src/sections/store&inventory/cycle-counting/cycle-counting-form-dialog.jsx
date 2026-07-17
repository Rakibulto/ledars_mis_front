'use client';

import { toast } from 'sonner';
import React, { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Grid,
  Alert,
  Paper,
  Stack,
  Button,
  Dialog,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  usePatchRequest as patchRequest,
  useCreateRequest as createRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const EP = endpoints.storeInventory;

const STATUS_OPTIONS = ['Scheduled', 'In Progress', 'Completed', 'Reviewed', 'Cancelled'];
const COUNT_TYPE_OPTIONS = [
  'ABC Cycle Count',
  'High Value Audit',
  'Expiry Review',
  'Full Physical Count',
];

function normalizeCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.results) ? payload.results : [];
}

function createLocalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getProductName(product) {
  return product?.name || product?.item_name || 'Unnamed Product';
}

function getProductCode(product) {
  return product?.code || product?.item_code || '';
}

function getProductUnit(product) {
  return product?.uom_name || product?.uom_code || product?.unit || '';
}

function getProductSystemQty(product) {
  return Number(
    product?.on_hand ??
      product?.available_qty ??
      product?.availableQty ??
      product?.current_stock ??
      product?.current_qty ??
      product?.currentQty ??
      product?.stock ??
      product?.quantity ??
      0
  );
}

function computeVariance(systemQty, countedQty) {
  if (countedQty === '' || countedQty === null || typeof countedQty === 'undefined') {
    return '';
  }

  return Number(countedQty || 0) - Number(systemQty || 0);
}

function createEmptyLineItem() {
  return {
    localId: createLocalId(),
    product: '',
    item_code: '',
    item_name: '',
    location: '',
    system_qty: '',
    counted_qty: '',
    variance: '',
    unit: '',
    notes: '',
  };
}

function createDefaultFormValues() {
  return {
    scheduled_date: new Date().toISOString().split('T')[0],
    count_type: 'ABC Cycle Count',
    warehouse: '',
    scope: '',
    status: 'Scheduled',
    owner: '',
    reviewer: '',
    notes: '',
    lines: [createEmptyLineItem()],
  };
}

function mapCountToFormValues(count) {
  return {
    scheduled_date: count?.scheduled_date || new Date().toISOString().split('T')[0],
    count_type: count?.count_type || 'ABC Cycle Count',
    warehouse: count?.warehouse ? String(count.warehouse) : '',
    scope: count?.scope || '',
    status: count?.status || 'Scheduled',
    owner: count?.owner ? String(count.owner) : '',
    reviewer: count?.reviewer ? String(count.reviewer) : '',
    notes: count?.notes || '',
    lines:
      count?.lines?.length > 0
        ? count.lines.map((line) => ({
            localId: createLocalId(),
            product: line.product ? String(line.product) : '',
            item_code: line.item_code || '',
            item_name: line.item_name || line.product_name || '',
            location: line.location || '',
            system_qty: line.system_qty ?? '',
            counted_qty: line.counted_qty ?? '',
            variance: line.variance ?? '',
            unit: line.unit || '',
            notes: line.notes || '',
          }))
        : [createEmptyLineItem()],
  };
}

export default function CycleCountingFormDialog({ open, mode, countId, onClose, onSuccess }) {
  const isEdit = mode === 'edit';
  const detailUrl = open && countId ? EP.cycle_count_by_id(countId) : null;
  const { data: count, loading: detailLoading, error: detailError } = useGetRequest(detailUrl);
  const { data: rawProducts, loading: productsLoading } = useGetRequest(open ? EP.products : null);
  const { data: rawWarehouses, loading: warehousesLoading } = useGetRequest(
    open ? EP.warehouses : null
  );
  const { data: rawUsers, loading: usersLoading } = useGetRequest(
    open ? endpoints.auth.simpleUsers : null
  );

  const productOptions = useMemo(
    () =>
      [...normalizeCollection(rawProducts)].sort((left, right) =>
        getProductName(left).localeCompare(getProductName(right), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawProducts]
  );

  const warehouseOptions = useMemo(
    () =>
      [...normalizeCollection(rawWarehouses)].sort((left, right) =>
        String(left?.name || left?.warehouse_name || '').localeCompare(
          String(right?.name || right?.warehouse_name || ''),
          undefined,
          { sensitivity: 'base' }
        )
      ),
    [rawWarehouses]
  );

  const userOptions = useMemo(
    () =>
      [...normalizeCollection(rawUsers)]
        .filter((user) => user?.username)
        .sort((left, right) =>
          String(left?.username || '').localeCompare(String(right?.username || ''), undefined, {
            sensitivity: 'base',
          })
        ),
    [rawUsers]
  );

  const [formValues, setFormValues] = useState(createDefaultFormValues);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!isEdit) {
      setFormValues(createDefaultFormValues());
    }
  }, [isEdit, open]);

  useEffect(() => {
    if (!open || !isEdit || !count?.id) {
      return;
    }

    setFormValues(mapCountToFormValues(count));
  }, [count, isEdit, open]);

  const handleFieldChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleLineChange = (localId, field, value) => {
    setFormValues((current) => ({
      ...current,
      lines: current.lines.map((line) => {
        if (line.localId !== localId) {
          return line;
        }

        const updatedLine = { ...line, [field]: value };

        if (field === 'product') {
          const selectedProduct = productOptions.find(
            (product) => String(product.id) === String(value)
          );

          if (selectedProduct) {
            updatedLine.item_code = getProductCode(selectedProduct);
            updatedLine.item_name = getProductName(selectedProduct);
            updatedLine.system_qty = getProductSystemQty(selectedProduct);
            updatedLine.counted_qty = '';
            updatedLine.variance = '';
            updatedLine.unit = getProductUnit(selectedProduct);
          }
        }

        if (field === 'system_qty' || field === 'counted_qty') {
          const nextSystemQty = field === 'system_qty' ? value : updatedLine.system_qty;
          const nextCountedQty = field === 'counted_qty' ? value : updatedLine.counted_qty;

          updatedLine.variance = computeVariance(nextSystemQty, nextCountedQty);
        }

        return updatedLine;
      }),
    }));
  };

  const addLineItem = () => {
    setFormValues((current) => ({
      ...current,
      lines: [...current.lines, createEmptyLineItem()],
    }));
  };

  const removeLineItem = (localId) => {
    setFormValues((current) => ({
      ...current,
      lines:
        current.lines.length === 1
          ? current.lines
          : current.lines.filter((line) => line.localId !== localId),
    }));
  };

  const handleSubmit = async () => {
    if (!formValues.scheduled_date) {
      toast.error('Scheduled date is required.');
      return;
    }

    if (!formValues.warehouse) {
      toast.error('Select the warehouse for this cycle count.');
      return;
    }

    if (!String(formValues.count_type || '').trim()) {
      toast.error('Count type is required.');
      return;
    }

    const validLines = formValues.lines.filter(
      (line) => String(line.product || '').trim() && String(line.item_name || '').trim()
    );

    if (!validLines.length) {
      toast.error('Add at least one stock item to the count session.');
      return;
    }

    const invalidQuantities = validLines.some((line) => {
      const systemQty = Number(line.system_qty || 0);
      const countedQty = line.counted_qty === '' ? null : Number(line.counted_qty);

      return systemQty < 0 || (countedQty !== null && countedQty < 0);
    });

    if (invalidQuantities) {
      toast.error('System and counted quantities cannot be negative.');
      return;
    }

    const preparedLines = validLines.map((line) => ({
      product: Number(line.product),
      item_code: line.item_code.trim(),
      item_name: line.item_name.trim(),
      location: line.location.trim() || null,
      system_qty: Number(line.system_qty || 0),
      counted_qty: line.counted_qty === '' ? null : Number(line.counted_qty || 0),
      unit: line.unit.trim(),
      notes: line.notes?.trim() || null,
    }));

    setSubmitting(true);

    try {
      const payload = {
        scheduled_date: formValues.scheduled_date,
        count_type: formValues.count_type,
        warehouse: formValues.warehouse || null,
        scope: formValues.scope.trim() || null,
        status: formValues.status,
        owner: formValues.owner || null,
        reviewer: formValues.reviewer || null,
        notes: formValues.notes.trim() || null,
        lines: preparedLines,
      };

      const response = isEdit
        ? await patchRequest(EP.cycle_count_by_id(countId), payload)
        : await createRequest(EP.cycle_counts, payload);

      toast.success(
        isEdit
          ? 'Cycle count session updated successfully.'
          : 'Cycle count session created successfully.'
      );
      onSuccess?.(response);
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error?.response?.data || error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {isEdit ? 'Edit Cycle Count Session' : 'Create Cycle Count Session'}
      </DialogTitle>

      <DialogContent dividers>
        {isEdit && detailLoading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <Stack spacing={3} sx={{ pt: 1 }}>
            {isEdit && detailError && (
              <Alert severity="error">
                The selected cycle count session could not be loaded for editing.
              </Alert>
            )}

            <Box>
              <Typography variant="h6" fontWeight={700}>
                Session Context
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Set the scheduled date, warehouse, ownership, and scope before capturing counted
                quantities and variance notes for each stock line.
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Scheduled Date"
                  value={formValues.scheduled_date}
                  onChange={(event) => handleFieldChange('scheduled_date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Count Type"
                  value={formValues.count_type}
                  onChange={(event) => handleFieldChange('count_type', event.target.value)}
                >
                  {COUNT_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={formValues.status}
                  onChange={(event) => handleFieldChange('status', event.target.value)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Warehouse"
                  value={formValues.warehouse}
                  onChange={(event) => handleFieldChange('warehouse', event.target.value)}
                  disabled={warehousesLoading}
                >
                  <MenuItem value="">Select Warehouse</MenuItem>
                  {warehouseOptions.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={String(warehouse.id)}>
                      {warehouse.name || warehouse.warehouse_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Scope"
                  value={formValues.scope}
                  onChange={(event) => handleFieldChange('scope', event.target.value)}
                  placeholder="A items, expiry candidates, cold chain stock"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Owner"
                  value={formValues.owner}
                  onChange={(event) => handleFieldChange('owner', event.target.value)}
                  disabled={usersLoading}
                >
                  <MenuItem value="">Select Owner</MenuItem>
                  {userOptions.map((user) => (
                    <MenuItem key={user.id} value={String(user.id)}>
                      {user.username}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Reviewer"
                  value={formValues.reviewer}
                  onChange={(event) => handleFieldChange('reviewer', event.target.value)}
                  disabled={usersLoading}
                >
                  <MenuItem value="">Select Reviewer</MenuItem>
                  {userOptions.map((user) => (
                    <MenuItem key={user.id} value={String(user.id)}>
                      {user.username}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Session Notes"
                  value={formValues.notes}
                  onChange={(event) => handleFieldChange('notes', event.target.value)}
                  placeholder="Capture the count objective, aisle scope, or review notes for the team."
                />
              </Grid>
            </Grid>

            <Box>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                justifyContent="space-between"
                alignItems={{ sm: 'center' }}
                sx={{ mb: 2 }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Count Line Items
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Define the product scope, storage location, system quantity, counted quantity,
                    and variance note for each counted line.
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
                  onClick={addLineItem}
                >
                  Add Line Item
                </Button>
              </Stack>

              <Stack spacing={2}>
                {formValues.lines.map((line, index) => (
                  <Paper key={line.localId} variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 2 }}
                    >
                      <Typography variant="subtitle1" fontWeight={700}>
                        Line Item {index + 1}
                      </Typography>

                      <IconButton
                        color="error"
                        onClick={() => removeLineItem(line.localId)}
                        disabled={formValues.lines.length === 1}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                      </IconButton>
                    </Stack>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          select
                          fullWidth
                          label="Product"
                          value={line.product}
                          onChange={(event) =>
                            handleLineChange(line.localId, 'product', event.target.value)
                          }
                          disabled={productsLoading}
                        >
                          <MenuItem value="">Select Product</MenuItem>
                          {productOptions.map((product) => (
                            <MenuItem key={product.id} value={String(product.id)}>
                              {getProductName(product)}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <TextField
                          fullWidth
                          label="Item Code"
                          value={line.item_code}
                          onChange={(event) =>
                            handleLineChange(line.localId, 'item_code', event.target.value)
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                          fullWidth
                          label="Item Name"
                          value={line.item_name}
                          onChange={(event) =>
                            handleLineChange(line.localId, 'item_name', event.target.value)
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                          fullWidth
                          label="Location"
                          value={line.location}
                          onChange={(event) =>
                            handleLineChange(line.localId, 'location', event.target.value)
                          }
                          placeholder="A-01-03"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="System Qty"
                          value={line.system_qty}
                          onChange={(event) =>
                            handleLineChange(line.localId, 'system_qty', event.target.value)
                          }
                          inputProps={{ min: 0, step: '0.01' }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Counted Qty"
                          value={line.counted_qty}
                          onChange={(event) =>
                            handleLineChange(line.localId, 'counted_qty', event.target.value)
                          }
                          inputProps={{ min: 0, step: '0.01' }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <TextField fullWidth label="Variance" value={line.variance} disabled />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <TextField
                          fullWidth
                          label="Unit"
                          value={line.unit}
                          onChange={(event) =>
                            handleLineChange(line.localId, 'unit', event.target.value)
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Line Notes"
                          value={line.notes}
                          onChange={(event) =>
                            handleLineChange(line.localId, 'notes', event.target.value)
                          }
                          placeholder="Shelf label mismatch, damaged carton, recount required"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || (isEdit && detailLoading)}
        >
          {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Count Session'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
