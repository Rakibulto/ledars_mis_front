'use client';

import { toast } from 'sonner';
import React, { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Grid,
  Alert,
  Stack,
  Button,
  Dialog,
  MenuItem,
  Tooltip,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
  InputAdornment,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  usePatchRequest as patchRequest,
  useCreateRequest as createRequest,
} from 'src/actions/ledars-hook';

import { useAuthContext } from 'src/auth/hooks';

import { Iconify } from 'src/components/iconify';

import {
  normalizeCollection,
  QUALITY_ALERT_SEVERITY_OPTIONS,
} from './quality-alert-shared';

const EP = endpoints.storeInventory;
const PM = endpoints.procurement_management;

function createDefaultFormValues(userId = '') {
  return {
    title: '',
    product: '',
    severity: 'Medium',
    description: '',
    corrective_action: '',
    reported_by: userId ? String(userId) : '',
    office_location: '',
    assigned_to: '',
  };
}

function mapRecordToFormValues(record) {
  return {
    title: record?.title || '',
    product: record?.product ? String(record.product) : '',
    severity: record?.severity || 'Medium',
    description: record?.description || '',
    corrective_action: record?.corrective_action || '',
    reported_by: record?.reported_by ? String(record.reported_by) : '',
    office_location: record?.office_location ? String(record.office_location) : '',
    assigned_to: record?.assigned_to ? String(record.assigned_to) : '',
  };
}

function sortByLabel(items, getLabel) {
  return [...items].sort((a, b) =>
    getLabel(a).localeCompare(getLabel(b), undefined, { sensitivity: 'base' })
  );
}

function getProductLabel(product) {
  const name = product?.product_name || product?.name || product?.item_name || 'Unnamed product';
  const code = product?.sku || product?.code || product?.item_code;
  return code ? `${name} (${code})` : name;
}

function getUserLabel(user) {
  const username = user?.username || 'Unknown user';
  const email = user?.email;
  return email ? `${username} (${email})` : username;
}

/** Flatten user objects from all OfficeStaff records for a given office. */
function extractStaffUsers(rawStaff) {
  const all = normalizeCollection(rawStaff);
  const seen = new Set();
  const users = [];
  for (const record of all) {
    const staffUsers = Array.isArray(record.user) ? record.user : [];
    for (const u of staffUsers) {
      if (u?.id && !seen.has(u.id)) {
        seen.add(u.id);
        users.push(u);
      }
    }
  }
  return users.sort((a, b) =>
    String(a.username || '').localeCompare(String(b.username || ''), undefined, { sensitivity: 'base' })
  );
}

export default function QualityAlertFormDialog({ open, mode, alertId, onClose, onSuccess }) {
  const { user } = useAuthContext();
  const isEdit = mode === 'edit';
  const detailUrl = open && isEdit && alertId ? EP.quality_alert_by_id(alertId) : null;

  const { data: qualityAlert, loading: detailLoading, error: detailError } = useGetRequest(detailUrl);

  const { data: rawOffices, loading: officesLoading } = useGetRequest(
    open ? `${PM.office_management}?pagination=false` : null
  );

  const [formValues, setFormValues] = useState(() => createDefaultFormValues(user?.id));
  const [submitting, setSubmitting] = useState(false);

  // Warehouse-driven: only fetch when an office is selected
  const selectedOfficeId = formValues.office_location;

  const warehouseProductsUrl = open && selectedOfficeId
    ? `${EP.inventory_office_stock_detail}?office_id=${selectedOfficeId}`
    : null;

  const warehouseStaffUrl = open && selectedOfficeId
    ? `${PM.office_staff}?office=${selectedOfficeId}`
    : null;

  const { data: rawWarehouseProducts, loading: productsLoading } = useGetRequest(warehouseProductsUrl);
  const { data: rawWarehouseStaff, loading: staffLoading } = useGetRequest(warehouseStaffUrl);

  const officeOptions = useMemo(
    () => sortByLabel(normalizeCollection(rawOffices), (o) => String(o?.name || '')),
    [rawOffices]
  );

  // Products come as [{ product_id, product_name, sku, ... }] from office-stock-detail
  const productOptions = useMemo(() => {
    const items = Array.isArray(rawWarehouseProducts) ? rawWarehouseProducts : normalizeCollection(rawWarehouseProducts);
    return sortByLabel(items, getProductLabel);
  }, [rawWarehouseProducts]);

  // Staff comes as [{ id, office, user: [...], status }] from office_staff
  const staffOptions = useMemo(() => extractStaffUsers(rawWarehouseStaff), [rawWarehouseStaff]);

  // Reported-by is always from all users (not warehouse-gated)
  const { data: rawUsers } = useGetRequest(open ? endpoints.auth.simpleUsers : null);
  const reportedByOptions = useMemo(
    () => sortByLabel(normalizeCollection(rawUsers), getUserLabel),
    [rawUsers]
  );

  useEffect(() => {
    if (!open) return;
    if (!isEdit) setFormValues(createDefaultFormValues(user?.id));
  }, [isEdit, open, user?.id]);

  useEffect(() => {
    if (!open || !isEdit || !qualityAlert?.id) return;
    setFormValues(mapRecordToFormValues(qualityAlert));
  }, [isEdit, open, qualityAlert]);

  const fieldDisabled = submitting || (isEdit && detailLoading);
  const warehouseSelected = Boolean(selectedOfficeId);

  const handleFieldChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleOfficeChange = (value) => {
    // Reset warehouse-dependent fields when office changes
    setFormValues((current) => ({
      ...current,
      office_location: value,
      product: '',
      assigned_to: '',
    }));
  };

  const handleSubmit = async () => {
    if (!formValues.title.trim()) {
      toast.error('Alert title is required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: formValues.title.trim(),
        product: formValues.product ? Number(formValues.product) : null,
        severity: formValues.severity,
        description: formValues.description.trim() || null,
        corrective_action: formValues.corrective_action.trim() || null,
        reported_by: formValues.reported_by ? Number(formValues.reported_by) : null,
        office_location: formValues.office_location ? Number(formValues.office_location) : null,
        assigned_to: formValues.assigned_to ? Number(formValues.assigned_to) : null,
      };

      if (!isEdit) {
        payload.status = 'New';
      }

      const response = isEdit
        ? await patchRequest(EP.quality_alert_by_id(alertId), payload)
        : await createRequest(EP.quality_alerts, payload);

      toast.success(
        isEdit ? 'Quality alert updated successfully.' : 'Quality alert created successfully.'
      );
      onSuccess?.(response);
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error?.response?.data || error));
    } finally {
      setSubmitting(false);
    }
  };

  const lookupsLoading = officesLoading || (isEdit && detailLoading);

  return (
    <Dialog open={open} onClose={fieldDisabled ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Quality Alert' : 'Create Quality Alert'}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {isEdit
              ? 'Update the alert details, severity, or corrective action below.'
              : 'Select an office / warehouse first — the product and staff fields will unlock automatically based on that location.'}
          </Typography>

          {lookupsLoading && (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Loading options...
              </Typography>
            </Stack>
          )}

          {isEdit && detailError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              Failed to load the selected quality alert. Please close the dialog and try again.
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Row 1: Title (full width) */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Alert Title"
                value={formValues.title}
                onChange={(event) => handleFieldChange('title', event.target.value)}
                disabled={fieldDisabled}
                required
                helperText="A short, clear description of the incident or quality issue."
              />
            </Grid>

            {/* Row 2: Severity + Office/Warehouse */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Severity"
                value={formValues.severity}
                onChange={(event) => handleFieldChange('severity', event.target.value)}
                disabled={fieldDisabled}
              >
                {QUALITY_ALERT_SEVERITY_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Office / Warehouse"
                value={formValues.office_location}
                onChange={(event) => handleOfficeChange(event.target.value)}
                disabled={fieldDisabled}
                helperText="Selecting a warehouse unlocks the Product and Assigned To fields."
              >
                <MenuItem value="">No office / warehouse</MenuItem>
                {officeOptions.map((office) => (
                  <MenuItem key={office.id} value={String(office.id)}>
                    {office.name || 'Unnamed office'}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Row 3: Product (warehouse-gated) + Reported By */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Tooltip
                title={!warehouseSelected ? 'Select an Office / Warehouse first to load products.' : ''}
                placement="top"
                disableHoverListener={warehouseSelected}
              >
                <Box>
                  <TextField
                    fullWidth
                    select
                    label="Affected Product"
                    value={formValues.product}
                    onChange={(event) => handleFieldChange('product', event.target.value)}
                    disabled={fieldDisabled || !warehouseSelected}
                    InputProps={
                      productsLoading
                        ? {
                            endAdornment: (
                              <InputAdornment position="end">
                                <CircularProgress size={16} />
                              </InputAdornment>
                            ),
                          }
                        : undefined
                    }
                    helperText={
                      !warehouseSelected
                        ? 'Requires an office / warehouse selection.'
                        : productOptions.length === 0 && !productsLoading
                          ? 'No products found for this warehouse.'
                          : `${productOptions.length} product${productOptions.length !== 1 ? 's' : ''} available.`
                    }
                  >
                    <MenuItem value="">No linked product</MenuItem>
                    {productOptions.map((product) => (
                      <MenuItem
                        key={product.product_id ?? product.id}
                        value={String(product.product_id ?? product.id)}
                      >
                        {getProductLabel(product)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Tooltip>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Reported By"
                value={formValues.reported_by}
                onChange={(event) => handleFieldChange('reported_by', event.target.value)}
                disabled={fieldDisabled}
              >
                <MenuItem value="">No reporter selected</MenuItem>
                {reportedByOptions.map((option) => (
                  <MenuItem key={option.id} value={String(option.id)}>
                    {getUserLabel(option)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Row 4: Assigned To (warehouse-gated) — full row or half */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Tooltip
                title={!warehouseSelected ? 'Select an Office / Warehouse first to load staff members.' : ''}
                placement="top"
                disableHoverListener={warehouseSelected}
              >
                <Box>
                  <TextField
                    fullWidth
                    select
                    label="Assigned To (Staff)"
                    value={formValues.assigned_to}
                    onChange={(event) => handleFieldChange('assigned_to', event.target.value)}
                    disabled={fieldDisabled || !warehouseSelected}
                    InputProps={
                      staffLoading
                        ? {
                            endAdornment: (
                              <InputAdornment position="end">
                                <CircularProgress size={16} />
                              </InputAdornment>
                            ),
                          }
                        : undefined
                    }
                    helperText={
                      !warehouseSelected
                        ? 'Requires an office / warehouse selection.'
                        : staffOptions.length === 0 && !staffLoading
                          ? 'No staff assigned to this warehouse.'
                          : `${staffOptions.length} staff member${staffOptions.length !== 1 ? 's' : ''} available.`
                    }
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {staffOptions.map((staffUser) => (
                      <MenuItem key={staffUser.id} value={String(staffUser.id)}>
                        {getUserLabel(staffUser)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Tooltip>
            </Grid>

            {/* Warehouse indicator chip when selected */}
            {warehouseSelected && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: 2,
                    bgcolor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    height: '100%',
                  }}
                >
                  <Iconify icon="solar:buildings-3-bold-duotone" width={20} sx={{ color: '#16a34a' }} />
                  <Box>
                    <Typography variant="caption" color="#166534" fontWeight={600}>
                      {officeOptions.find((o) => String(o.id) === selectedOfficeId)?.name || 'Selected warehouse'}
                    </Typography>
                    <Typography variant="caption" color="#4ade80" sx={{ display: 'block' }}>
                      Products and staff are filtered to this location.
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}

            {/* Description */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Description"
                value={formValues.description}
                onChange={(event) => handleFieldChange('description', event.target.value)}
                disabled={fieldDisabled}
                helperText="Describe the incident, scope, or visible defect so the team can triage quickly."
              />
            </Grid>

            {/* Corrective Action */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Corrective Action"
                value={formValues.corrective_action}
                onChange={(event) => handleFieldChange('corrective_action', event.target.value)}
                disabled={fieldDisabled}
                helperText="Record containment, rework, supplier follow-up, or closeout action."
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
          {submitting ? 'Saving...' : isEdit ? 'Update Alert' : 'Create Alert'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
