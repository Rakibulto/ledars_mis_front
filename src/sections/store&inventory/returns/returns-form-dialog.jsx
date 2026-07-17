'use client';

import { toast } from 'sonner';
import React, { useMemo, useState, useEffect } from 'react';

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
  usePatchRequest as patchRequest,
  useCreateRequest as createRequest,
} from 'src/actions/ledars-hook';

const EP = endpoints.storeInventory;

const RETURN_TYPE_OPTIONS = [
  { value: 'customer', label: 'Customer Return' },
  { value: 'supplier', label: 'Supplier Return' },
];

const STATUS_OPTIONS = ['Draft', 'Pending Inspection', 'Approved', 'Done', 'Cancelled'];

const CONDITION_OPTIONS = ['Good', 'Damaged', 'Expired', 'Open Box', 'Repairable'];

function normalizeCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.results) ? payload.results : [];
}

function createDefaultValues() {
  return {
    reference: '',
    date: new Date().toISOString().split('T')[0],
    return_type: 'customer',
    product: '',
    warehouse: '',
    quantity: '',
    condition: 'Good',
    original_reference: '',
    status: 'Draft',
    created_by: '',
    reason: '',
  };
}

function mapReturnToFormValues(returnRecord) {
  return {
    reference: returnRecord?.reference || '',
    date: returnRecord?.date || new Date().toISOString().split('T')[0],
    return_type: returnRecord?.return_type || 'customer',
    product: returnRecord?.product ? String(returnRecord.product) : '',
    warehouse: returnRecord?.warehouse ? String(returnRecord.warehouse) : '',
    quantity: returnRecord?.quantity ?? '',
    condition: returnRecord?.condition || 'Good',
    original_reference: returnRecord?.original_reference || '',
    status: returnRecord?.status || 'Draft',
    created_by: returnRecord?.created_by ? String(returnRecord.created_by) : '',
    reason: returnRecord?.reason || '',
  };
}

export default function ReturnsFormDialog({ open, mode, returnId, onClose, onSuccess }) {
  const isEdit = mode === 'edit';
  const detailUrl = open && returnId ? EP.return_record_by_id(returnId) : null;
  const {
    data: returnRecord,
    loading: detailLoading,
    error: detailError,
  } = useGetRequest(detailUrl);
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
        String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawProducts]
  );

  const warehouseOptions = useMemo(
    () =>
      [...normalizeCollection(rawWarehouses)].sort((left, right) =>
        String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
          sensitivity: 'base',
        })
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

  const [formValues, setFormValues] = useState(createDefaultValues);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!isEdit) {
      setFormValues(createDefaultValues());
    }
  }, [isEdit, open]);

  useEffect(() => {
    if (!open || !isEdit || !returnRecord?.id) {
      return;
    }

    setFormValues(mapReturnToFormValues(returnRecord));
  }, [isEdit, open, returnRecord]);

  const handleFieldChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formValues.reference.trim()) {
      toast.error('Reference is required.');
      return;
    }

    if (!formValues.date) {
      toast.error('Return date is required.');
      return;
    }

    if (!formValues.product) {
      toast.error('Select a product for this return.');
      return;
    }

    if (Number(formValues.quantity || 0) <= 0) {
      toast.error('Quantity must be greater than zero.');
      return;
    }

    if (!formValues.reason.trim()) {
      toast.error('Reason is required for auditability.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        reference: formValues.reference.trim(),
        date: formValues.date,
        return_type: formValues.return_type,
        product: Number(formValues.product),
        warehouse: formValues.warehouse ? Number(formValues.warehouse) : null,
        quantity: Number(formValues.quantity || 0),
        reason: formValues.reason.trim(),
        condition: formValues.condition.trim() || 'Good',
        original_reference: formValues.original_reference.trim() || null,
        status: formValues.status.trim() || 'Draft',
        created_by: formValues.created_by ? Number(formValues.created_by) : null,
      };

      const response = isEdit
        ? await patchRequest(EP.return_record_by_id(returnId), payload)
        : await createRequest(EP.return_records, payload);

      toast.success(isEdit ? 'Return updated successfully.' : 'Return created successfully.');
      onSuccess?.(response);
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error?.response?.data || error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Return Record' : 'Create Return Record'}</DialogTitle>

      <DialogContent dividers>
        {isEdit && detailLoading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <Stack spacing={3} sx={{ pt: 1 }}>
            {isEdit && detailError && (
              <Alert severity="error">The selected return record could not be loaded.</Alert>
            )}

            <Stack spacing={0.5}>
              <Typography variant="h6" fontWeight={700}>
                Return Context
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Capture the origin reference, disposition status, product, warehouse, and the reason
                this stock is flowing back into or out of inventory.
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Reference"
                  value={formValues.reference}
                  onChange={(event) => handleFieldChange('reference', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Return Date"
                  value={formValues.date}
                  onChange={(event) => handleFieldChange('date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Return Type"
                  value={formValues.return_type}
                  onChange={(event) => handleFieldChange('return_type', event.target.value)}
                >
                  {RETURN_TYPE_OPTIONS.map((option) => (
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
                  label="Product"
                  value={formValues.product}
                  onChange={(event) => handleFieldChange('product', event.target.value)}
                  disabled={productsLoading}
                >
                  <MenuItem value="">Select Product</MenuItem>
                  {productOptions.map((product) => (
                    <MenuItem key={product.id} value={String(product.id)}>
                      {product.name} ({product.code})
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
                  <MenuItem value="">Not Assigned</MenuItem>
                  {warehouseOptions.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={String(warehouse.id)}>
                      {warehouse.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantity"
                  value={formValues.quantity}
                  onChange={(event) => handleFieldChange('quantity', event.target.value)}
                  inputProps={{ min: 0, step: '0.01' }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Condition"
                  value={formValues.condition}
                  onChange={(event) => handleFieldChange('condition', event.target.value)}
                >
                  {CONDITION_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Original Reference"
                  value={formValues.original_reference}
                  onChange={(event) => handleFieldChange('original_reference', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
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
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Recorded By"
                  value={formValues.created_by}
                  onChange={(event) => handleFieldChange('created_by', event.target.value)}
                  disabled={usersLoading}
                >
                  <MenuItem value="">Not Assigned</MenuItem>
                  {userOptions.map((user) => (
                    <MenuItem key={user.id} value={String(user.id)}>
                      {user.username}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Reason"
                  value={formValues.reason}
                  onChange={(event) => handleFieldChange('reason', event.target.value)}
                  placeholder="Explain the return, inspection outcome, or reverse-logistics reason."
                />
              </Grid>
            </Grid>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting || detailLoading}>
          {submitting ? 'Saving...' : isEdit ? 'Update Return' : 'Create Return'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
