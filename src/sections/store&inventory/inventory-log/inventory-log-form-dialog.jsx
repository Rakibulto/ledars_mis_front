'use client';

import { toast } from 'sonner';
import { useMemo, useState, useEffect } from 'react';

import {
  Grid,
  Alert,
  Stack,
  Button,
  Dialog,
  MenuItem,
  TextField,
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
  usePutRequest as putRequest,
  useCreateRequest as createRequest,
} from 'src/actions/ledars-hook';

import {
  normalizeCollection,
  toDateTimeLocalValue,
  FORM_MOVE_TYPE_OPTIONS,
} from './inventory-log-utils';

const EP = endpoints.storeInventory;

const DEFAULT_FORM = {
  date: '',
  reference: '',
  product: '',
  source_location: '',
  destination_location: '',
  quantity: '',
  uom: '',
  move_type: 'Receipt',
  done_by: '',
};

function sortByLabel(rows, selector) {
  return [...rows].sort((left, right) =>
    selector(left).localeCompare(selector(right), undefined, { sensitivity: 'base' })
  );
}

export default function InventoryLogFormDialog({ open, mode, logId, onClose, onSuccess }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const detailUrl = open && mode === 'edit' && logId ? EP.stock_move_by_id(logId) : null;

  const { data: logRecord, loading: detailLoading } = useGetRequest(detailUrl);
  const { data: rawProducts, loading: productsLoading } = useGetRequest(
    `${EP.products}?ordering=name`
  );
  const { data: rawUsers, loading: usersLoading } = useGetRequest(
    `${endpoints.auth.simpleUsers}?ordering=username`
  );

  const products = useMemo(
    () => sortByLabel(normalizeCollection(rawProducts), (product) => `${product?.name || ''}`),
    [rawProducts]
  );
  const users = useMemo(
    () => sortByLabel(normalizeCollection(rawUsers), (user) => `${user?.username || ''}`),
    [rawUsers]
  );

  useEffect(() => {
    if (!open) {
      setForm(DEFAULT_FORM);
      setFormError('');
      setSubmitting(false);
      return;
    }

    if (mode === 'create') {
      setForm(DEFAULT_FORM);
      setFormError('');
      return;
    }

    if (mode === 'edit' && logRecord && !detailLoading) {
      setForm({
        date: toDateTimeLocalValue(logRecord.date),
        reference: logRecord.reference || '',
        product: logRecord.product ? String(logRecord.product) : '',
        source_location: logRecord.source_location || '',
        destination_location: logRecord.destination_location || '',
        quantity: logRecord.quantity ?? '',
        uom: logRecord.uom || '',
        move_type: logRecord.move_type || 'Receipt',
        done_by: logRecord.done_by ? String(logRecord.done_by) : '',
      });
      setFormError('');
    }
  }, [detailLoading, logRecord, mode, open]);

  const dialogTitle = mode === 'edit' ? 'Edit Inventory Log' : 'Create Inventory Log';

  const handleFieldChange = (field) => (event) => {
    const nextValue = event.target.value;

    if (field === 'product') {
      const selectedProduct = products.find((product) => String(product.id) === String(nextValue));

      setForm((current) => ({
        ...current,
        product: nextValue,
        uom: selectedProduct?.uom_name || current.uom || '',
      }));
      return;
    }

    setForm((current) => ({ ...current, [field]: nextValue }));
  };

  const handleSubmit = async () => {
    const quantity = Number(form.quantity);
    const reference = form.reference.trim();
    const sourceLocation = form.source_location.trim();
    const destinationLocation = form.destination_location.trim();

    if (
      !form.date ||
      !reference ||
      !form.product ||
      !form.move_type ||
      !sourceLocation ||
      !destinationLocation
    ) {
      setFormError('Date, reference, product, move type, source, and destination are required.');
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFormError('Quantity must be greater than zero.');
      return;
    }

    const selectedProduct = products.find((product) => String(product.id) === String(form.product));
    const payload = {
      date: form.date.length === 16 ? `${form.date}:00` : form.date,
      reference,
      product: Number(form.product),
      source_location: sourceLocation,
      destination_location: destinationLocation,
      quantity,
      uom: form.uom.trim() || selectedProduct?.uom_name || null,
      move_type: form.move_type,
      done_by: form.done_by ? Number(form.done_by) : null,
    };

    setSubmitting(true);
    setFormError('');

    try {
      const response =
        mode === 'edit' && logId
          ? await putRequest(EP.stock_move_by_id(logId), payload)
          : await createRequest(EP.stock_moves, payload);

      toast.success(
        mode === 'edit'
          ? 'Inventory log updated successfully.'
          : 'Inventory log created successfully.'
      );
      await onSuccess?.(response);
      onClose?.();
    } catch (error) {
      setFormError(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            Capture a stock movement with its product, route, direction-driving move type, and
            operator so the inventory ledger stays audit-ready.
          </Typography>

          {formError && <Alert severity="error">{formError}</Alert>}

          {mode === 'edit' && detailLoading ? (
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 5 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                Loading inventory log details...
              </Typography>
            </Stack>
          ) : (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="datetime-local"
                  label="Recorded At"
                  value={form.date}
                  onChange={handleFieldChange('date')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Reference"
                  placeholder="e.g. GRN-2026-0042"
                  value={form.reference}
                  onChange={handleFieldChange('reference')}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Product"
                  value={form.product}
                  onChange={handleFieldChange('product')}
                  disabled={productsLoading}
                >
                  <MenuItem value="">Select product</MenuItem>
                  {products.map((product) => (
                    <MenuItem key={product.id} value={String(product.id)}>
                      {product.code ? `${product.code} • ` : ''}
                      {product.name || 'Unnamed product'}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Move Type"
                  value={form.move_type}
                  onChange={handleFieldChange('move_type')}
                >
                  {FORM_MOVE_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Source Location"
                  placeholder="e.g. Central Warehouse Rack-A1"
                  value={form.source_location}
                  onChange={handleFieldChange('source_location')}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Destination Location"
                  placeholder="e.g. Project Store Room"
                  value={form.destination_location}
                  onChange={handleFieldChange('destination_location')}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Quantity"
                  value={form.quantity}
                  onChange={handleFieldChange('quantity')}
                  inputProps={{ min: 0, step: '0.01' }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Unit Of Measure"
                  placeholder="e.g. pcs"
                  value={form.uom}
                  onChange={handleFieldChange('uom')}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Done By"
                  value={form.done_by}
                  onChange={handleFieldChange('done_by')}
                  disabled={usersLoading}
                >
                  <MenuItem value="">System / Unassigned</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={String(user.id)}>
                      {user.username}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting || detailLoading}>
          {submitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Log'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
