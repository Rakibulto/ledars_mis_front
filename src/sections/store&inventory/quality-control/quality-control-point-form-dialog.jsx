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
  Tooltip,
  MenuItem,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  InputAdornment,
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

import {
  normalizeCollection,
  QCP_PRIORITY_OPTIONS,
  QCP_FREQUENCY_OPTIONS,
} from './quality-control-point-shared';

const EP = endpoints.storeInventory;
const PM = endpoints.procurement_management;

function createDefaultFormValues() {
  return {
    name: '',
    office_location: '',
    product: '',
    assigned_to: '',
    frequency: 'Weekly',
    priority: 'Medium',
    inspection_criteria: '',
    description: '',
    is_active: true,
  };
}

function mapRecordToFormValues(record) {
  return {
    name: record?.name || '',
    office_location: record?.office_location ? String(record.office_location) : '',
    product: record?.product ? String(record.product) : '',
    assigned_to: record?.assigned_to ? String(record.assigned_to) : '',
    frequency: record?.frequency || 'Weekly',
    priority: record?.priority || 'Medium',
    inspection_criteria: record?.inspection_criteria || '',
    description: record?.description || '',
    is_active: record?.is_active !== false,
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

/** Flatten user objects from all OfficeStaff records. */
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
    String(a.username || '').localeCompare(String(b.username || ''), undefined, {
      sensitivity: 'base',
    })
  );
}

function getStaffLabel(user) {
  const username = user?.username || 'Unknown';
  const role = user?.role || user?.profile?.role || user?.employee_profile?.designation;
  return role ? `${username} (${role})` : username;
}

export default function QualityControlPointFormDialog({
  open,
  mode,
  qualityControlPointId,
  onClose,
  onSuccess,
}) {
  const isEdit = mode === 'edit';
  const detailUrl =
    open && isEdit && qualityControlPointId
      ? EP.quality_control_point_by_id(qualityControlPointId)
      : null;

  const {
    data: qualityControlPoint,
    loading: detailLoading,
    error: detailError,
  } = useGetRequest(detailUrl);
  const { data: rawOffices, loading: officesLoading } = useGetRequest(
    open ? `${PM.office_management}?pagination=false` : null
  );

  const [formValues, setFormValues] = useState(createDefaultFormValues);
  const [submitting, setSubmitting] = useState(false);

  const selectedOfficeId = formValues.office_location;

  const warehouseProductsUrl =
    open && selectedOfficeId
      ? `${EP.inventory_office_stock_detail}?office_id=${selectedOfficeId}`
      : null;
  const warehouseStaffUrl =
    open && selectedOfficeId ? `${PM.office_staff}?office=${selectedOfficeId}` : null;

  const { data: rawWarehouseProducts, loading: productsLoading } =
    useGetRequest(warehouseProductsUrl);
  const { data: rawWarehouseStaff, loading: staffLoading } = useGetRequest(warehouseStaffUrl);

  const officeOptions = useMemo(
    () => sortByLabel(normalizeCollection(rawOffices), (o) => String(o?.name || '')),
    [rawOffices]
  );

  const productOptions = useMemo(() => {
    const items = Array.isArray(rawWarehouseProducts)
      ? rawWarehouseProducts
      : normalizeCollection(rawWarehouseProducts);
    return sortByLabel(items, getProductLabel);
  }, [rawWarehouseProducts]);

  const staffOptions = useMemo(() => extractStaffUsers(rawWarehouseStaff), [rawWarehouseStaff]);

  useEffect(() => {
    if (!open) return;
    if (!isEdit) setFormValues(createDefaultFormValues());
  }, [isEdit, open]);

  useEffect(() => {
    if (!open || !isEdit || !qualityControlPoint?.id) return;
    setFormValues(mapRecordToFormValues(qualityControlPoint));
  }, [isEdit, open, qualityControlPoint]);

  const fieldDisabled = submitting || (isEdit && detailLoading);
  const warehouseSelected = Boolean(selectedOfficeId);

  const handleFieldChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleOfficeChange = (value) => {
    setFormValues((current) => ({
      ...current,
      office_location: value,
      product: '',
      assigned_to: '',
    }));
  };

  const handleSubmit = async () => {
    if (!formValues.name.trim()) {
      toast.error('Control point name is required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formValues.name.trim(),
        office_location: formValues.office_location ? Number(formValues.office_location) : null,
        product: formValues.product ? Number(formValues.product) : null,
        assigned_to: formValues.assigned_to ? Number(formValues.assigned_to) : null,
        frequency: formValues.frequency,
        priority: formValues.priority,
        inspection_criteria: formValues.inspection_criteria.trim() || null,
        description: formValues.description.trim() || null,
        is_active: Boolean(formValues.is_active),
      };

      const response = isEdit
        ? await patchRequest(EP.quality_control_point_by_id(qualityControlPointId), payload)
        : await createRequest(EP.quality_control_points, payload);

      toast.success(
        isEdit
          ? 'Quality control point updated successfully.'
          : 'Quality control point created successfully.'
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
      <DialogTitle>
        {isEdit ? 'Edit Quality Control Point' : 'Create Quality Control Point'}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {isEdit
              ? 'Update the control point configuration, office mapping, and assigned inspector.'
              : 'Select an Office / Warehouse first — the Product and Assigned Staff fields will unlock automatically.'}
          </Typography>

          {lookupsLoading && (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Loading control point options...
              </Typography>
            </Stack>
          )}

          {isEdit && detailError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              Failed to load the selected quality control point. Please close the dialog and try
              again.
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Row 1: Name (full) */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Control Point Name"
                value={formValues.name}
                onChange={(event) => handleFieldChange('name', event.target.value)}
                disabled={fieldDisabled}
                required
                helperText="A clear, specific name for what this control point governs."
              />
            </Grid>

            {/* Row 2: Office/Warehouse + Frequency */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Office / Warehouse"
                value={formValues.office_location}
                onChange={(event) => handleOfficeChange(event.target.value)}
                disabled={fieldDisabled}
                helperText="Selecting a location unlocks the Product and Assigned Staff fields."
              >
                <MenuItem value="">No office / warehouse</MenuItem>
                {officeOptions.map((office) => (
                  <MenuItem key={office.id} value={String(office.id)}>
                    {office.name || 'Unnamed office'}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Inspection Frequency"
                value={formValues.frequency}
                onChange={(event) => handleFieldChange('frequency', event.target.value)}
                disabled={fieldDisabled}
              >
                {QCP_FREQUENCY_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Row 3: Product (warehouse-gated) + Priority */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Tooltip
                title={
                  !warehouseSelected ? 'Select an Office / Warehouse first to load products.' : ''
                }
                placement="top"
                disableHoverListener={warehouseSelected}
              >
                <Box>
                  <TextField
                    fullWidth
                    select
                    label="Linked Product"
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
                label="Priority Level"
                value={formValues.priority}
                onChange={(event) => handleFieldChange('priority', event.target.value)}
                disabled={fieldDisabled}
              >
                {QCP_PRIORITY_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Row 4: Assigned Staff (warehouse-gated) + Status */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Tooltip
                title={
                  !warehouseSelected
                    ? 'Select an Office / Warehouse first to load staff members.'
                    : ''
                }
                placement="top"
                disableHoverListener={warehouseSelected}
              >
                <Box>
                  <TextField
                    fullWidth
                    select
                    label="Assigned Inspector / Staff"
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
                        {getStaffLabel(staffUser)}
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
                label="Status"
                value={formValues.is_active ? 'true' : 'false'}
                onChange={(event) => handleFieldChange('is_active', event.target.value === 'true')}
                disabled={fieldDisabled}
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
            </Grid>

            {/* Warehouse indicator when selected */}
            {warehouseSelected && (
              <Grid size={{ xs: 12 }}>
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
                  }}
                >
                  <Iconify
                    icon="solar:buildings-3-bold-duotone"
                    width={20}
                    sx={{ color: '#16a34a' }}
                  />
                  <Box>
                    <Typography variant="caption" color="#166534" fontWeight={600}>
                      {officeOptions.find((o) => String(o.id) === selectedOfficeId)?.name ||
                        'Selected location'}
                    </Typography>
                    <Typography variant="caption" color="#4ade80" sx={{ display: 'block' }}>
                      Products and staff are filtered to this warehouse.
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}

            {/* Inspection Criteria */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Inspection Criteria"
                value={formValues.inspection_criteria}
                onChange={(event) => handleFieldChange('inspection_criteria', event.target.value)}
                disabled={fieldDisabled}
                helperText="Describe what inspectors must check, how to measure it, and the pass/fail threshold."
              />
            </Grid>

            {/* Description */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Description"
                value={formValues.description}
                onChange={(event) => handleFieldChange('description', event.target.value)}
                disabled={fieldDisabled}
                helperText="Additional context about this control point — scope, purpose, or related processes."
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
          {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Control Point'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
