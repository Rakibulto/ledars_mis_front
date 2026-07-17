'use client';

import { toast } from 'sonner';
import React, { useMemo, useState, useEffect } from 'react';

import {
  Grid,
  Alert,
  Stack,
  Dialog,
  Button,
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
const PM = endpoints.procurement_management;

const STATUS_OPTIONS = [
  { value: 'Pending Approval', label: 'Pending Approval' },
  { value: 'Approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

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
    product: '',
    office_location: '',
    quantity: '',
    reason: '',
    disposal_method: '',
    disposal_date: '',
    certificate_number: '',
    status: 'pending',
    scrapped_by: '',
  };
}

function mapScrapToFormValues(scrapRecord) {
  return {
    reference: scrapRecord?.reference || '',
    date: scrapRecord?.date || new Date().toISOString().split('T')[0],
    product: scrapRecord?.product ? String(scrapRecord.product) : '',
    office_location: scrapRecord?.office_location ? String(scrapRecord.office_location) : '',
    quantity: scrapRecord?.quantity ?? '',
    reason: scrapRecord?.reason || '',
    disposal_method: scrapRecord?.disposal_method || '',
    disposal_date: scrapRecord?.disposal_date || '',
    certificate_number: scrapRecord?.certificate_number || '',
    status: scrapRecord?.status || 'Pending Approval',
    scrapped_by: scrapRecord?.scrapped_by ? String(scrapRecord.scrapped_by) : '',
  };
}

export default function ScrapManagementFormDialog({ open, mode, scrapId, onClose, onSuccess }) {
  const isEdit = mode === 'edit';
  const detailUrl = open && scrapId ? EP.scrap_record_by_id(scrapId) : null;
  const {
    data: scrapRecord,
    loading: detailLoading,
    error: detailError,
  } = useGetRequest(detailUrl);
  const { data: rawProducts, loading: productsLoading } = useGetRequest(open ? EP.products : null);
  const { data: rawUsers, loading: usersLoading } = useGetRequest(
    open ? endpoints.auth.simpleUsers : null
  );
  const { data: rawOfficeLocations, loading: officeLocationsLoading } = useGetRequest(
    open ? PM.office_management : null
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

  const officeLocationOptions = useMemo(
    () =>
      [...normalizeCollection(rawOfficeLocations)].sort((left, right) =>
        String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawOfficeLocations]
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
    if (!open || !isEdit || !scrapRecord?.id) {
      return;
    }

    setFormValues(mapScrapToFormValues(scrapRecord));
  }, [isEdit, open, scrapRecord]);

  const handleFieldChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formValues.reference.trim()) {
      toast.error('Reference is required.');
      return;
    }

    if (!formValues.date) {
      toast.error('Scrap date is required.');
      return;
    }

    if (!formValues.product) {
      toast.error('Select a product for this scrap record.');
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
        product: Number(formValues.product),
        warehouse: null,
        office_location: formValues.office_location ? Number(formValues.office_location) : null,
        quantity: Number(formValues.quantity || 0),
        reason: formValues.reason.trim(),
        disposal_method: formValues.disposal_method.trim() || null,
        disposal_date: formValues.disposal_date || null,
        certificate_number: formValues.certificate_number.trim() || null,
        status: formValues.status.trim() || 'Pending Approval',
        scrapped_by: formValues.scrapped_by ? Number(formValues.scrapped_by) : null,
      };

      const response = isEdit
        ? await patchRequest(EP.scrap_record_by_id(scrapId), payload)
        : await createRequest(EP.scrap_records, payload);

      toast.success(
        isEdit ? 'Scrap record updated successfully.' : 'Scrap record created successfully.'
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
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Scrap Record' : 'Create Scrap Record'}</DialogTitle>

      <DialogContent dividers>
        {isEdit && detailLoading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <Stack spacing={3} sx={{ pt: 1 }}>
            {isEdit && detailError && (
              <Alert severity="error">The selected scrap record could not be loaded.</Alert>
            )}

            <Stack spacing={0.5}>
              <Typography variant="h6" fontWeight={700}>
                Scrap Context
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Capture the source warehouse, product, quantity, status, disposal method, and audit
                notes for stock written off from inventory.
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
                  label="Scrap Date"
                  value={formValues.date}
                  onChange={(event) => handleFieldChange('date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
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
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  select
                  fullWidth
                  label="Product"
                  value={formValues.product}
                  onChange={(event) => handleFieldChange('product', event.target.value)}
                  disabled={productsLoading}
                  SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 320 } } } }}
                >
                  <MenuItem value="">Select Product</MenuItem>
                  {productOptions.map((product) => (
                    <MenuItem key={product.id} value={String(product.id)}>
                      <Stack spacing={0}>
                        <Typography variant="body2" fontWeight={600}>
                          {product.name} ({product.code})
                        </Typography>
                        {product.location && (
                          <Typography variant="caption" color="text.secondary">
                            {product.location}
                          </Typography>
                        )}
                      </Stack>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
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
                  fullWidth
                  label="Disposal Method"
                  value={formValues.disposal_method}
                  onChange={(event) => handleFieldChange('disposal_method', event.target.value)}
                  placeholder="Recycling, Incineration, Landfill..."
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Disposal Date"
                  value={formValues.disposal_date}
                  onChange={(event) => handleFieldChange('disposal_date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Certificate Number"
                  value={formValues.certificate_number}
                  onChange={(event) => handleFieldChange('certificate_number', event.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Office / Warehouse Location"
                  value={formValues.office_location}
                  onChange={(event) => handleFieldChange('office_location', event.target.value)}
                  disabled={officeLocationsLoading}
                  helperText="Location stock will be deducted here on approval"
                >
                  <MenuItem value="">No specific location</MenuItem>
                  {officeLocationOptions.map((loc) => (
                    <MenuItem key={loc.id} value={String(loc.id)}>
                      {loc.name}
                      {loc.type ? ` (${loc.type})` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Recorded By"
                  value={formValues.scrapped_by}
                  onChange={(event) => handleFieldChange('scrapped_by', event.target.value)}
                  disabled={usersLoading}
                >
                  <MenuItem value="">Unassigned</MenuItem>
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
                  minRows={4}
                  label="Reason"
                  value={formValues.reason}
                  onChange={(event) => handleFieldChange('reason', event.target.value)}
                  placeholder="Describe the damage, expiry, contamination, or loss event..."
                />
              </Grid>
            </Grid>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
          {isEdit ? 'Save Changes' : 'Create Record'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
