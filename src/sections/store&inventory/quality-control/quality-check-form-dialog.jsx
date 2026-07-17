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

import {
  normalizeCollection,
  QUALITY_TYPE_OPTIONS,
  QUALITY_RESULT_OPTIONS,
  QUALITY_PRIORITY_OPTIONS,
} from './quality-check-shared';

const EP = endpoints.storeInventory;
const PM = endpoints.procurement_management;

function createDefaultFormValues() {
  return {
    date: new Date().toISOString().split('T')[0],
    check_type: 'Receipt',
    office_location: '',
    product: '',
    inspector: '',
    status: 'Pending',
    result: '',
    priority: 'Medium',
    findings: '',
    corrective_actions: '',
    remarks: '',
  };
}

function mapRecordToFormValues(record) {
  return {
    date: record?.date || new Date().toISOString().split('T')[0],
    check_type: record?.check_type || 'Receipt',
    office_location: record?.office_location ? String(record.office_location) : '',
    product: record?.product ? String(record.product) : '',
    inspector: record?.inspector || '',
    status: record?.status || 'Pending',
    result: record?.result || '',
    priority: record?.priority || 'Medium',
    findings: record?.findings || '',
    corrective_actions: record?.corrective_actions || '',
    remarks: record?.remarks || '',
  };
}

export default function QualityCheckFormDialog({ open, mode, qualityCheckId, onClose, onSuccess }) {
  const isEdit = mode === 'edit';
  const detailUrl =
    open && isEdit && qualityCheckId ? EP.quality_check_by_id(qualityCheckId) : null;

  const {
    data: qualityCheck,
    loading: detailLoading,
    error: detailError,
  } = useGetRequest(detailUrl);

  // All offices/warehouses (no type filter)
  const { data: rawOffices, loading: officesLoading } = useGetRequest(
    open ? `${PM.office_management}?pagination=false` : null
  );

  const officeOptions = useMemo(
    () =>
      [...normalizeCollection(rawOffices)].sort((a, b) =>
        String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' })
      ),
    [rawOffices]
  );

  const [formValues, setFormValues] = useState(createDefaultFormValues);
  const [submitting, setSubmitting] = useState(false);

  // Products filtered by selected office
  const productsFetchUrl = useMemo(
    () =>
      open && formValues.office_location
        ? `${EP.inventory_office_stock_detail}?office_id=${formValues.office_location}`
        : null,
    [open, formValues.office_location]
  );
  const { data: rawProducts, loading: productsLoading } = useGetRequest(productsFetchUrl);

  const productOptions = useMemo(() => normalizeCollection(rawProducts), [rawProducts]);

  // Inspectors from selected office staff list
  const officeFetchUrl = useMemo(
    () =>
      open && formValues.office_location
        ? PM.office_management_by_id(formValues.office_location)
        : null,
    [open, formValues.office_location]
  );
  const { data: officeDetail, loading: officeDetailLoading } = useGetRequest(officeFetchUrl);

  const staffOptions = useMemo(() => {
    const staff = officeDetail?.staff;
    if (!Array.isArray(staff)) return [];
    return [...staff].sort((a, b) =>
      String(a.username || '').localeCompare(String(b.username || ''), undefined, {
        sensitivity: 'base',
      })
    );
  }, [officeDetail]);

  // Reset form on open
  useEffect(() => {
    if (!open) return;
    if (!isEdit) {
      setFormValues(createDefaultFormValues());
    }
  }, [isEdit, open]);

  // Populate form on edit
  useEffect(() => {
    if (!open || !isEdit || !qualityCheck?.id) return;
    setFormValues(mapRecordToFormValues(qualityCheck));
  }, [isEdit, open, qualityCheck]);

  const officeSelected = Boolean(formValues.office_location);
  const fieldDisabled = submitting || (isEdit && detailLoading);
  const lookupLoading =
    officesLoading || (officeSelected && (productsLoading || officeDetailLoading));

  const handleFieldChange = (field, value) => {
    if (field === 'office_location') {
      setFormValues((current) => ({
        ...current,
        office_location: value,
        product: '',
        inspector: '',
      }));
      return;
    }
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formValues.office_location) {
      toast.error('Please select an office or warehouse.');
      return;
    }
    if (!formValues.date) {
      toast.error('Inspection date is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        date: formValues.date,
        check_type: formValues.check_type,
        office_location: Number(formValues.office_location),
        product: formValues.product ? Number(formValues.product) : null,
        inspector: formValues.inspector.trim() || null,
        status: formValues.status,
        result: formValues.result || null,
        priority: formValues.priority,
        findings: formValues.findings.trim() || null,
        corrective_actions: formValues.corrective_actions.trim() || null,
        remarks: formValues.remarks.trim() || null,
      };

      const response = isEdit
        ? await patchRequest(EP.quality_check_by_id(qualityCheckId), payload)
        : await createRequest(EP.quality_checks, payload);

      toast.success(
        isEdit ? 'Quality check updated successfully.' : 'Quality check created successfully.'
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
    <Dialog open={open} onClose={fieldDisabled ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Quality Check' : 'Create Quality Check'}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          {lookupLoading && (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Loading…
              </Typography>
            </Stack>
          )}

          {isEdit && detailError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              Failed to load the selected quality check. Please close the dialog and try again.
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Date + Check Type */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Inspection Date"
                type="date"
                value={formValues.date}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={fieldDisabled}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Check Type"
                value={formValues.check_type}
                onChange={(e) => handleFieldChange('check_type', e.target.value)}
                disabled={fieldDisabled}
              >
                {QUALITY_TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Office/Warehouse (required) */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Office / Warehouse *"
                value={formValues.office_location}
                onChange={(e) => handleFieldChange('office_location', e.target.value)}
                disabled={fieldDisabled || officesLoading}
                required
                helperText="Select an office or warehouse to load its products and staff."
              >
                <MenuItem value="">— Select office or warehouse —</MenuItem>
                {officeOptions.map((office) => (
                  <MenuItem key={office.id} value={String(office.id)}>
                    {office.name || 'Unnamed'}
                    {office.type ? ` (${office.type})` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Product (gated) */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Product"
                value={formValues.product}
                onChange={(e) => handleFieldChange('product', e.target.value)}
                disabled={fieldDisabled || !officeSelected || productsLoading}
                helperText={
                  !officeSelected ? 'Please select an office or warehouse first' : undefined
                }
              >
                <MenuItem value="">No linked product</MenuItem>
                {productOptions.map((p) => (
                  <MenuItem key={p.product_id} value={String(p.product_id)}>
                    {p.product_name || 'Unnamed'}
                    {p.sku ? ` (${p.sku})` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Inspector (gated) */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Inspector"
                value={formValues.inspector}
                onChange={(e) => handleFieldChange('inspector', e.target.value)}
                disabled={fieldDisabled || !officeSelected || officeDetailLoading}
                helperText={
                  !officeSelected ? 'Please select an office or warehouse first' : undefined
                }
              >
                <MenuItem value="">No inspector assigned</MenuItem>
                {staffOptions.map((user) => (
                  <MenuItem key={user.id} value={user.username}>
                    {user.username}
                    {user.role ? ` — ${user.role}` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Priority */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Priority"
                value={formValues.priority}
                onChange={(e) => handleFieldChange('priority', e.target.value)}
                disabled={fieldDisabled}
              >
                {QUALITY_PRIORITY_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Result */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Result"
                value={formValues.result}
                onChange={(e) => handleFieldChange('result', e.target.value)}
                disabled={fieldDisabled}
                helperText="Set the inspection outcome once the check is complete."
              >
                <MenuItem value="">No result yet</MenuItem>
                {QUALITY_RESULT_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Findings */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Findings"
                value={formValues.findings}
                onChange={(e) => handleFieldChange('findings', e.target.value)}
                disabled={fieldDisabled}
                helperText="Describe defects, deviations, or observations found during inspection."
              />
            </Grid>

            {/* Corrective Actions */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Corrective Actions"
                value={formValues.corrective_actions}
                onChange={(e) => handleFieldChange('corrective_actions', e.target.value)}
                disabled={fieldDisabled}
                helperText="Describe corrective or preventive actions to be taken."
              />
            </Grid>

            {/* Remarks */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Remarks / Notes"
                value={formValues.remarks}
                onChange={(e) => handleFieldChange('remarks', e.target.value)}
                disabled={fieldDisabled}
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={fieldDisabled}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={fieldDisabled || (isEdit && Boolean(detailError))}
        >
          {submitting ? 'Saving…' : isEdit ? 'Update Quality Check' : 'Create Quality Check'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
