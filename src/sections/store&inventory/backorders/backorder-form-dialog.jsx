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

const STATUS_OPTIONS = [
  'Draft',
  'Pending Quality Check',
  'Pending Approval',
  'Approved',
  'Posted to Stock',
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

function createEmptyLineItem() {
  return {
    localId: createLocalId(),
    product: '',
    item_code: '',
    item_name: '',
    ordered_qty: '',
    received_qty: '',
    accepted_qty: '',
    rejected_qty: '',
    unit: '',
    unit_price: '',
    batch_number: '',
    expiry_date: '',
    remarks: '',
  };
}

function createDefaultFormValues() {
  return {
    receive_date: new Date().toISOString().split('T')[0],
    vendor: '',
    warehouse: '',
    status: 'Draft',
    invoice_number: '',
    challan_number: '',
    vehicle_number: '',
    line_items: [createEmptyLineItem()],
  };
}

function mapBackorderToFormValues(backorder) {
  return {
    receive_date: backorder?.receive_date || new Date().toISOString().split('T')[0],
    vendor: backorder?.vendor_id
      ? String(backorder.vendor_id)
      : backorder?.supplier
        ? String(backorder.supplier)
        : '',
    warehouse: backorder?.warehouse ? String(backorder.warehouse) : '',
    status: backorder?.status || 'Draft',
    invoice_number: backorder?.invoice_number || '',
    challan_number: backorder?.challan_number || '',
    vehicle_number: backorder?.vehicle_number || '',
    line_items:
      backorder?.line_items?.length > 0
        ? backorder.line_items.map((line) => ({
            localId: createLocalId(),
            product: line.product ? String(line.product) : '',
            item_code: line.item_code || '',
            item_name: line.item_name || line.product_name || '',
            ordered_qty: line.ordered_qty ?? '',
            received_qty: line.received_qty ?? '',
            accepted_qty: line.accepted_qty ?? '',
            rejected_qty: line.rejected_qty ?? '',
            unit: line.unit || '',
            unit_price: line.unit_price ?? '',
            batch_number: line.batch_number || '',
            expiry_date: line.expiry_date || '',
            remarks: line.remarks || '',
          }))
        : [createEmptyLineItem()],
  };
}

function buildPayload(formValues) {
  return {
    receive_date: formValues.receive_date,
    vendor: formValues.vendor || null,
    warehouse: formValues.warehouse || null,
    status: formValues.status,
    invoice_number: formValues.invoice_number.trim() || null,
    challan_number: formValues.challan_number.trim() || null,
    vehicle_number: formValues.vehicle_number.trim() || null,
    line_items: formValues.line_items.map((line) => ({
      product: Number(line.product),
      item_code: line.item_code.trim(),
      item_name: line.item_name.trim(),
      ordered_qty: Number(line.ordered_qty || 0),
      received_qty: Number(line.received_qty || 0),
      accepted_qty: Number(line.accepted_qty || 0),
      rejected_qty: Number(line.rejected_qty || 0),
      unit: line.unit.trim(),
      unit_price: Number(line.unit_price || 0),
      batch_number: line.batch_number.trim() || null,
      expiry_date: line.expiry_date || null,
      remarks: line.remarks?.trim() || null,
    })),
  };
}

export default function BackorderFormDialog({ open, mode, backorderId, onClose, onSuccess }) {
  const isEdit = mode === 'edit';
  const detailUrl = open && backorderId ? EP.backorder_by_id(backorderId) : null;
  const { data: backorder, loading: detailLoading, error: detailError } = useGetRequest(detailUrl);
  const { data: rawProducts, loading: productsLoading } = useGetRequest(open ? EP.products : null);
  const { data: rawVendors, loading: vendorsLoading } = useGetRequest(open ? EP.vendors : null);
  const { data: rawWarehouses, loading: warehousesLoading } = useGetRequest(
    open ? EP.warehouses : null
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

  const vendorOptions = useMemo(
    () =>
      [...normalizeCollection(rawVendors)].sort((left, right) =>
        String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawVendors]
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
    if (!open || !isEdit || !backorder?.id) {
      return;
    }

    setFormValues(mapBackorderToFormValues(backorder));
  }, [backorder, isEdit, open]);

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
          const selectedProduct = productOptions.find((item) => String(item.id) === String(value));

          if (selectedProduct) {
            updatedLine.item_code = selectedProduct.code || '';
            updatedLine.item_name = selectedProduct.name || '';
            updatedLine.unit = selectedProduct.uom_name || selectedProduct.uom_code || '';
            updatedLine.unit_price = selectedProduct.cost || '';
          }
        }

        if (field === 'received_qty' && !String(line.accepted_qty || '').trim()) {
          updatedLine.accepted_qty = value;
        }

        if (field === 'received_qty' && !String(line.rejected_qty || '').trim()) {
          updatedLine.rejected_qty = '0';
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
    if (!formValues.receive_date) {
      toast.error('Receive date is required.');
      return;
    }

    const validLineItems = formValues.line_items.filter(
      (line) => String(line.product || '').trim() && String(line.item_name || '').trim()
    );

    if (!validLineItems.length) {
      toast.error('Add at least one line item to the backorder.');
      return;
    }

    const invalidQuantities = validLineItems.some(
      (line) =>
        Number(line.ordered_qty || 0) <= 0 ||
        Number(line.received_qty || 0) < 0 ||
        Number(line.accepted_qty || 0) < 0 ||
        Number(line.rejected_qty || 0) < 0 ||
        Number(line.received_qty || 0) > Number(line.ordered_qty || 0)
    );

    if (invalidQuantities) {
      toast.error(
        'Ordered quantity must be positive and received quantity cannot exceed ordered quantity.'
      );
      return;
    }

    const hasOutstandingLine = validLineItems.some(
      (line) => Number(line.ordered_qty || 0) > Number(line.received_qty || 0)
    );

    if (!hasOutstandingLine) {
      toast.error('At least one line must keep an outstanding quantity for this backorder.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = buildPayload({ ...formValues, line_items: validLineItems });
      const response = isEdit
        ? await patchRequest(EP.backorder_by_id(backorderId), payload)
        : await createRequest(EP.backorders, payload);

      toast.success(isEdit ? 'Backorder updated successfully.' : 'Backorder created successfully.');
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
      <DialogTitle>{isEdit ? 'Edit Backorder' : 'Create Backorder'}</DialogTitle>

      <DialogContent dividers>
        {isEdit && detailLoading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <Stack spacing={3} sx={{ pt: 1 }}>
            {detailError && isEdit && (
              <Alert severity="error">
                The selected backorder could not be loaded for editing.
              </Alert>
            )}

            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Backorders must retain at least one outstanding quantity where ordered units exceed
              received units.
            </Alert>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Receive Date"
                  value={formValues.receive_date}
                  onChange={(event) => handleFieldChange('receive_date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Vendor"
                  value={formValues.vendor}
                  onChange={(event) => handleFieldChange('vendor', event.target.value)}
                  disabled={vendorsLoading}
                >
                  <MenuItem value="">Not Linked</MenuItem>
                  {vendorOptions.map((vendor) => (
                    <MenuItem key={vendor.id} value={String(vendor.id)}>
                      {vendor.name}
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

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Invoice Number"
                  value={formValues.invoice_number}
                  onChange={(event) => handleFieldChange('invoice_number', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Challan Number"
                  value={formValues.challan_number}
                  onChange={(event) => handleFieldChange('challan_number', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Vehicle Number"
                  value={formValues.vehicle_number}
                  onChange={(event) => handleFieldChange('vehicle_number', event.target.value)}
                />
              </Grid>
            </Grid>

            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    Backorder Line Items
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Capture the ordered quantity, what has arrived so far, and what remains
                    outstanding.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
                  onClick={addLineItem}
                >
                  Add Line
                </Button>
              </Stack>

              <Stack spacing={2}>
                {formValues.line_items.map((line, index) => {
                  const pendingQty = Math.max(
                    Number(line.ordered_qty || 0) - Number(line.received_qty || 0),
                    0
                  );

                  return (
                    <Paper key={line.localId} variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle1" fontWeight={700} color="#0f172a">
                            Line {index + 1}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" color="text.secondary">
                              Pending {pendingQty.toLocaleString('en-BD')}
                            </Typography>
                            <IconButton
                              color="error"
                              onClick={() => removeLineItem(line.localId)}
                              disabled={formValues.line_items.length === 1}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                            </IconButton>
                          </Stack>
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
                              disabled={productsLoading}
                            >
                              <MenuItem value="">Select Product</MenuItem>
                              {productOptions.map((product) => (
                                <MenuItem key={product.id} value={String(product.id)}>
                                  {product.name}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                              fullWidth
                              label="Item Code"
                              value={line.item_code}
                              onChange={(event) =>
                                handleLineItemChange(line.localId, 'item_code', event.target.value)
                              }
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                              fullWidth
                              label="Item Name"
                              value={line.item_name}
                              onChange={(event) =>
                                handleLineItemChange(line.localId, 'item_name', event.target.value)
                              }
                            />
                          </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 2.4 }}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Ordered Qty"
                              value={line.ordered_qty}
                              onChange={(event) =>
                                handleLineItemChange(
                                  line.localId,
                                  'ordered_qty',
                                  event.target.value
                                )
                              }
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 2.4 }}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Received Qty"
                              value={line.received_qty}
                              onChange={(event) =>
                                handleLineItemChange(
                                  line.localId,
                                  'received_qty',
                                  event.target.value
                                )
                              }
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 2.4 }}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Accepted Qty"
                              value={line.accepted_qty}
                              onChange={(event) =>
                                handleLineItemChange(
                                  line.localId,
                                  'accepted_qty',
                                  event.target.value
                                )
                              }
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 2.4 }}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Rejected Qty"
                              value={line.rejected_qty}
                              onChange={(event) =>
                                handleLineItemChange(
                                  line.localId,
                                  'rejected_qty',
                                  event.target.value
                                )
                              }
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 2.4 }}>
                            <TextField
                              fullWidth
                              label="Unit"
                              value={line.unit}
                              onChange={(event) =>
                                handleLineItemChange(line.localId, 'unit', event.target.value)
                              }
                            />
                          </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 3 }}>
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
                          <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                              fullWidth
                              label="Batch Number"
                              value={line.batch_number}
                              onChange={(event) =>
                                handleLineItemChange(
                                  line.localId,
                                  'batch_number',
                                  event.target.value
                                )
                              }
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                              fullWidth
                              type="date"
                              label="Expiry Date"
                              value={line.expiry_date}
                              onChange={(event) =>
                                handleLineItemChange(
                                  line.localId,
                                  'expiry_date',
                                  event.target.value
                                )
                              }
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 3 }}>
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
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Update Backorder' : 'Create Backorder'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
