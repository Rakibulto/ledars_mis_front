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

import { getIssueDocumentModuleConfig } from './issue-document-module-config';

const EP = endpoints.storeInventory;
const PM = endpoints.procurement_management;

const STATUS_OPTIONS = ['Draft', 'Pending Approval', 'Approved', 'Issued', 'Cancelled'];

function getUserLabel(user) {
  return user?.username || '';
}

function getDepartmentLabel(department) {
  return department?.name || '';
}

function getProjectLabel(project) {
  return project?.title || project?.short_name || project?.code || project?.name || '';
}

function normalizeCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.results) ? payload.results : [];
}

function createLocalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyLineItem() {
  return {
    localId: createLocalId(),
    product: '',
    item_code: '',
    item_name: '',
    requested_qty: '',
    issued_qty: '',
    unit: '',
    unit_price: '',
    remarks: '',
  };
}

function createDefaultFormValues() {
  return {
    issue_date: new Date().toISOString().split('T')[0],
    issued_to: '',
    department: '',
    project: '',
    purpose: '',
    office_location: '',
    issue_from: '',
    status: 'Draft',
    requested_by: '',
    approved_by: '',
    approval_level: 0,
    total_levels: 2,
    line_items: [createEmptyLineItem()],
  };
}

function mapGinToFormValues(gin) {
  return {
    issue_date: gin?.issue_date || new Date().toISOString().split('T')[0],
    issued_to: gin?.issued_to || '',
    department: gin?.department || '',
    project: gin?.project || '',
    purpose: gin?.purpose || '',
    office_location: gin?.office_location ? String(gin.office_location) : '',
    issue_from: gin?.issue_from || '',
    status: gin?.status || 'Draft',
    requested_by: gin?.requested_by ? String(gin.requested_by) : '',
    approved_by: gin?.approved_by ? String(gin.approved_by) : '',
    approval_level: gin?.approval_level ?? 0,
    total_levels: gin?.total_levels ?? 2,
    line_items:
      gin?.line_items?.length > 0
        ? gin.line_items.map((line) => ({
            localId: createLocalId(),
            product: line.product ? String(line.product) : '',
            item_code: line.item_code || '',
            item_name: line.item_name || line.product_name || '',
            requested_qty: line.requested_qty ?? '',
            issued_qty: line.issued_qty ?? '',
            unit: line.unit || '',
            unit_price: line.unit_price ?? '',
            remarks: line.remarks || '',
          }))
        : [createEmptyLineItem()],
  };
}

function buildPayload(formValues) {
  return {
    issue_date: formValues.issue_date,
    issued_to: formValues.issued_to.trim(),
    issue_from: formValues.issue_from.trim() || null,
    department: formValues.department.trim() || null,
    project: formValues.project.trim() || null,
    purpose: formValues.purpose.trim() || null,
    office_location: formValues.office_location || null,
    status: formValues.status,
    requested_by: formValues.requested_by || null,
    approved_by: formValues.approved_by || null,
    approval_level: Number(formValues.approval_level || 0),
    total_levels: Number(formValues.total_levels || 1),
    line_items: formValues.line_items.map((line) => ({
      product: Number(line.product),
      item_code: line.item_code.trim(),
      item_name: line.item_name.trim(),
      requested_qty: Number(line.requested_qty || 0),
      issued_qty: Number(line.issued_qty || 0),
      unit: line.unit.trim(),
      unit_price: Number(line.unit_price || 0),
      remarks: line.remarks?.trim() || null,
    })),
  };
}

export default function GoodsIssueNoteFormDialog({
  open,
  mode,
  ginId,
  onClose,
  onSuccess,
  moduleKey = 'goodsIssueNote',
}) {
  const isEdit = mode === 'edit';
  const moduleConfig = getIssueDocumentModuleConfig(moduleKey);
  const detailUrl = open && ginId ? moduleConfig.detailEndpoint(ginId) : null;
  const { data: gin, loading: detailLoading, error: detailError } = useGetRequest(detailUrl);
  const { data: rawOfficeLocations, loading: officeLocationsLoading } = useGetRequest(
    open ? PM.office_management : null
  );
  const { data: rawUsers, loading: usersLoading } = useGetRequest(
    open ? endpoints.auth.simpleUsers : null
  );
  const { data: rawDepartments, loading: departmentsLoading } = useGetRequest(
    open ? endpoints.settings.departments : null
  );
  const { data: rawProjects, loading: projectsLoading } = useGetRequest(
    open ? endpoints.projectManagements.projects : null
  );

  // Fetch stock for the selected office/warehouse — used to populate product selector
  const selectedOfficeId = open ? formValues.office_location : null;
  const officeStockUrl = selectedOfficeId
    ? `${EP.inventory_office_stock_detail}?office_id=${selectedOfficeId}`
    : null;
  const { data: rawOfficeStock, isLoading: officeStockLoading } = useGetRequest(officeStockUrl);

  const officeStockItems = useMemo(
    () => (Array.isArray(rawOfficeStock) ? rawOfficeStock : []),
    [rawOfficeStock]
  );

  // Map productId → stock entry for fast lookup
  const officeStockMap = useMemo(
    () =>
      officeStockItems.reduce((acc, item) => {
        acc[String(item.product_id)] = item;
        return acc;
      }, {}),
    [officeStockItems]
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

  const userOptions = useMemo(
    () =>
      [...normalizeCollection(rawUsers)]
        .filter((item) => getUserLabel(item))
        .sort((left, right) =>
          getUserLabel(left).localeCompare(getUserLabel(right), undefined, {
            sensitivity: 'base',
          })
        ),
    [rawUsers]
  );

  const departmentOptions = useMemo(
    () =>
      [...normalizeCollection(rawDepartments)]
        .filter((item) => getDepartmentLabel(item))
        .sort((left, right) =>
          getDepartmentLabel(left).localeCompare(getDepartmentLabel(right), undefined, {
            sensitivity: 'base',
          })
        ),
    [rawDepartments]
  );

  const projectOptions = useMemo(
    () =>
      [...normalizeCollection(rawProjects)]
        .filter((item) => getProjectLabel(item))
        .sort((left, right) =>
          getProjectLabel(left).localeCompare(getProjectLabel(right), undefined, {
            sensitivity: 'base',
          })
        ),
    [rawProjects]
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
    if (!open || !isEdit || !gin?.id) {
      return;
    }

    setFormValues(mapGinToFormValues(gin));
  }, [gin, isEdit, open]);

  const handleFieldChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleLineItemChange = (localId, field, value) => {
    setFormValues((current) => ({
      ...current,
      line_items: current.line_items.map((line) => {
        if (line.localId !== localId) {
          return line;
        }

        const updatedLine = { ...line, [field]: value };

        if (field === 'product') {
          const stockItem = officeStockMap[String(value)];
          if (stockItem) {
            updatedLine.item_code = stockItem.sku || '';
            updatedLine.item_name = stockItem.product_name || '';
            updatedLine.unit = stockItem.unit || '';
          }
        }

        if (field === 'requested_qty' && !String(line.issued_qty || '').trim()) {
          updatedLine.issued_qty = value;
        }

        return updatedLine;
      }),
    }));
  };

  const addLineItem = () => {
    setFormValues((current) => ({
      ...current,
      line_items: [...current.line_items, createEmptyLineItem()],
    }));
  };

  const removeLineItem = (localId) => {
    setFormValues((current) => ({
      ...current,
      line_items:
        current.line_items.length === 1
          ? current.line_items
          : current.line_items.filter((line) => line.localId !== localId),
    }));
  };

  const handleSubmit = async () => {
    if (!formValues.issue_date) {
      toast.error('Issue date is required.');
      return;
    }

    if (Number(formValues.total_levels || 0) <= 0) {
      toast.error('Total approval steps must be greater than zero.');
      return;
    }

    if (Number(formValues.approval_level || 0) < 0) {
      toast.error('Approval level cannot be negative.');
      return;
    }

    if (Number(formValues.approval_level || 0) > Number(formValues.total_levels || 0)) {
      toast.error('Approval level cannot exceed the total approval steps.');
      return;
    }

    const validLineItems = formValues.line_items.filter(
      (line) => String(line.product || '').trim() && String(line.item_name || '').trim()
    );

    if (!validLineItems.length) {
      toast.error('Add at least one stock item.');
      return;
    }

    const invalidQuantities = validLineItems.some(
      (line) => Number(line.requested_qty || 0) <= 0 || Number(line.issued_qty || 0) <= 0
    );

    if (invalidQuantities) {
      toast.error('Requested and issued quantities must be greater than zero.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = buildPayload({ ...formValues, line_items: validLineItems });
      const response = isEdit
        ? await patchRequest(moduleConfig.detailEndpoint(ginId), payload)
        : await createRequest(moduleConfig.listEndpoint, payload);

      toast.success(isEdit ? moduleConfig.updatedToast : moduleConfig.createdToast);
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
        {isEdit ? `Edit ${moduleConfig.singularTitle}` : `Create ${moduleConfig.singularTitle}`}
      </DialogTitle>

      <DialogContent dividers>
        {isEdit && detailLoading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <Stack spacing={3} sx={{ pt: 1 }}>
            {detailError && isEdit && (
              <Alert severity="error">The selected record could not be loaded for editing.</Alert>
            )}

            <Box>
              <Typography variant="h6" fontWeight={700}>
                Issuance Context
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Link this record to a recipient, department, project, warehouse, and current
                workflow status.
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Issue Date"
                  value={formValues.issue_date}
                  onChange={(event) => handleFieldChange('issue_date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Issue From (Office / Warehouse)"
                  value={formValues.office_location}
                  onChange={(event) => {
                    const selected = officeLocationOptions.find(
                      (loc) => String(loc.id) === event.target.value
                    );
                    handleFieldChange('office_location', event.target.value);
                    handleFieldChange('issue_from', selected?.name || '');
                    // Reset line items when location changes
                    setFormValues((cur) => ({
                      ...cur,
                      office_location: event.target.value,
                      issue_from: selected?.name || '',
                      line_items: [createEmptyLineItem()],
                    }));
                  }}
                  disabled={officeLocationsLoading}
                  helperText={
                    formValues.office_location && !officeStockLoading
                      ? `${officeStockItems.length} item(s) in stock`
                      : formValues.office_location && officeStockLoading
                        ? 'Loading stock…'
                        : 'Select a location to see available stock'
                  }
                >
                  <MenuItem value="">Select Office / Warehouse</MenuItem>
                  {officeLocationOptions.map((loc) => (
                    <MenuItem key={loc.id} value={String(loc.id)}>
                      {loc.name}
                      {loc.type ? ` (${loc.type})` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Issue To (Project / Recipient)"
                  value={formValues.issued_to}
                  onChange={(event) => handleFieldChange('issued_to', event.target.value)}
                  disabled={projectsLoading}
                >
                  <MenuItem value="">Not Linked</MenuItem>
                  {formValues.issued_to &&
                    !projectOptions.some(
                      (item) => getProjectLabel(item) === formValues.issued_to
                    ) && <MenuItem value={formValues.issued_to}>{formValues.issued_to}</MenuItem>}
                  {projectOptions.map((project) => (
                    <MenuItem key={project.id} value={getProjectLabel(project)}>
                      {getProjectLabel(project)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Purpose"
                  value={formValues.purpose}
                  onChange={(event) => handleFieldChange('purpose', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Department"
                  value={formValues.department}
                  onChange={(event) => handleFieldChange('department', event.target.value)}
                  disabled={departmentsLoading}
                >
                  <MenuItem value="">Not Assigned</MenuItem>
                  {formValues.department &&
                    !departmentOptions.some(
                      (item) => getDepartmentLabel(item) === formValues.department
                    ) && <MenuItem value={formValues.department}>{formValues.department}</MenuItem>}
                  {departmentOptions.map((department) => (
                    <MenuItem key={department.id} value={getDepartmentLabel(department)}>
                      {getDepartmentLabel(department)}
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
                  {STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Box>
              <Typography variant="h6" fontWeight={700}>
                Approval Workflow
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Capture who requested and approved the issue note, plus the workflow stage inside
                the approval chain.
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  label="Requested By"
                  value={formValues.requested_by}
                  onChange={(event) => handleFieldChange('requested_by', event.target.value)}
                  disabled={usersLoading}
                >
                  <MenuItem value="">Not Assigned</MenuItem>
                  {userOptions.map((user) => (
                    <MenuItem key={`requested-${user.id}`} value={String(user.id)}>
                      {getUserLabel(user)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {/* <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Approved By"
                  value={formValues.approved_by}
                  onChange={(event) => handleFieldChange('approved_by', event.target.value)}
                  disabled={usersLoading}
                >
                  <MenuItem value="">Not Assigned</MenuItem>
                  {userOptions.map((user) => (
                    <MenuItem key={`approved-${user.id}`} value={String(user.id)}>
                      {getUserLabel(user)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Approval Level"
                  value={formValues.approval_level}
                  onChange={(event) => handleFieldChange('approval_level', event.target.value)}
                  inputProps={{ min: 0 }}
                />
              </Grid>s
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Approval Steps"
                  value={formValues.total_levels}
                  onChange={(event) => handleFieldChange('total_levels', event.target.value)}
                  inputProps={{ min: 1 }}
                />
              </Grid> */}
            </Grid>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Line Items
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add the products being issued out of stock for this document.
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={addLineItem}
              >
                Add Item
              </Button>
            </Stack>

            <Stack spacing={2}>
              {formValues.line_items.map((line, index) => {
                const stockItem = line.product ? officeStockMap[String(line.product)] : null;
                const availableQty = stockItem ? Number(stockItem.quantity) : 0;
                const hasNoStockAtLocation =
                  !officeStockLoading &&
                  !!line.product &&
                  !!formValues.office_location &&
                  !stockItem;

                return (
                  <Paper key={line.localId} variant="outlined" sx={{ p: 2.5 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" fontWeight={700}>
                          Item {index + 1}
                        </Typography>
                        <IconButton
                          color="error"
                          onClick={() => removeLineItem(line.localId)}
                          disabled={formValues.line_items.length === 1}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
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
                              handleLineItemChange(line.localId, 'product', event.target.value)
                            }
                            disabled={officeStockLoading}
                            helperText={
                              !formValues.office_location
                                ? 'Select an office/warehouse first'
                                : officeStockItems.length === 0
                                  ? 'No stock available at this location'
                                  : undefined
                            }
                          >
                            <MenuItem value="">Select Product</MenuItem>
                            {officeStockItems.map((item) => (
                              <MenuItem key={item.product_id} value={String(item.product_id)}>
                                {item.product_name} — Stock:{' '}
                                {Number(item.quantity).toLocaleString('en-BD')} {item.unit}
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
                              handleLineItemChange(line.localId, 'item_code', event.target.value)
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            label="Item Name"
                            value={line.item_name}
                            onChange={(event) =>
                              handleLineItemChange(line.localId, 'item_name', event.target.value)
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 1.5 }}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Requested"
                            value={line.requested_qty}
                            onChange={(event) =>
                              handleLineItemChange(
                                line.localId,
                                'requested_qty',
                                event.target.value
                              )
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 1.5 }}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Issued"
                            value={line.issued_qty}
                            onChange={(event) =>
                              handleLineItemChange(line.localId, 'issued_qty', event.target.value)
                            }
                            error={hasNoStockAtLocation}
                            helperText={
                              line.product && formValues.office_location
                                ? availableQty > 0
                                  ? `Available: ${availableQty.toLocaleString('en-BD')}`
                                  : officeStockLoading
                                    ? 'Loading…'
                                    : 'No stock at this location'
                                : undefined
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                          <TextField
                            fullWidth
                            label="Unit"
                            value={line.unit}
                            onChange={(event) =>
                              handleLineItemChange(line.localId, 'unit', event.target.value)
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Unit Price"
                            value={line.unit_price}
                            onChange={(event) =>
                              handleLineItemChange(line.localId, 'unit_price', event.target.value)
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 8 }}>
                          <TextField
                            fullWidth
                            label="Remarks"
                            value={line.remarks}
                            onChange={(event) =>
                              handleLineItemChange(line.localId, 'remarks', event.target.value)
                            }
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting || detailLoading}>
          {submitting ? 'Saving...' : isEdit ? 'Update GIN' : 'Create GIN'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
