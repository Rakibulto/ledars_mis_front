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

const STATUS_OPTIONS = ['Draft', 'In Transit', 'Received', 'Cancelled'];

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
    quantity: '',
    unit: '',
    unit_price: '',
    remarks: '',
  };
}

function createDefaultFormValues() {
  return {
    transfer_date: new Date().toISOString().split('T')[0],
    from_warehouse: '',
    to_warehouse: '',
    from_location: '',
    to_location: '',
    status: 'Draft',
    sent_by: '',
    received_by: '',
    vehicle_number: '',
    driver_name: '',
    notes: '',
    lines: [createEmptyLineItem()],
  };
}

function mapTransferToFormValues(transfer) {
  return {
    transfer_date: transfer?.transfer_date || new Date().toISOString().split('T')[0],
    from_warehouse: transfer?.from_warehouse ? String(transfer.from_warehouse) : '',
    to_warehouse: transfer?.to_warehouse ? String(transfer.to_warehouse) : '',
    from_location: transfer?.from_location || transfer?.from_warehouse_name || '',
    to_location: transfer?.to_location || transfer?.to_warehouse_name || '',
    status: transfer?.status || 'Draft',
    sent_by: transfer?.sent_by ? String(transfer.sent_by) : '',
    received_by: transfer?.received_by ? String(transfer.received_by) : '',
    vehicle_number: transfer?.vehicle_number || '',
    driver_name: transfer?.driver_name || '',
    notes: transfer?.notes || '',
    lines:
      transfer?.lines?.length > 0
        ? transfer.lines.map((line) => ({
            localId: createLocalId(),
            product: line.product ? String(line.product) : '',
            item_code: line.item_code || '',
            item_name: line.item_name || line.product_name || '',
            quantity: line.quantity ?? '',
            unit: line.unit || '',
            unit_price: line.unit_price ?? '',
            remarks: line.remarks || '',
          }))
        : [createEmptyLineItem()],
  };
}

export default function StockTransferFormDialog({
  open,
  mode,
  transferId,
  onClose,
  onSuccess,
  entityLabel = 'Stock Transfer',
  listEndpoint = EP.stock_transfers,
  detailEndpointBuilder = EP.stock_transfer_by_id,
}) {
  const isEdit = mode === 'edit';
  const detailUrl = open && transferId ? detailEndpointBuilder(transferId) : null;
  const entityLabelLower = entityLabel.toLowerCase();
  const { data: transfer, loading: detailLoading, error: detailError } = useGetRequest(detailUrl);
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

  const [formValues, setFormValues] = useState(createDefaultFormValues);
  const [submitting, setSubmitting] = useState(false);

  const sourceWarehouseOptions = useMemo(
    () =>
      warehouseOptions.filter(
        (warehouse) => String(warehouse.id) !== String(formValues.to_warehouse || '')
      ),
    [formValues.to_warehouse, warehouseOptions]
  );

  const destinationWarehouseOptions = useMemo(
    () =>
      warehouseOptions.filter(
        (warehouse) => String(warehouse.id) !== String(formValues.from_warehouse || '')
      ),
    [formValues.from_warehouse, warehouseOptions]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!isEdit) {
      setFormValues(createDefaultFormValues());
    }
  }, [isEdit, open]);

  useEffect(() => {
    if (!open || !isEdit || !transfer?.id) {
      return;
    }

    setFormValues(mapTransferToFormValues(transfer));
  }, [isEdit, open, transfer]);

  const getWarehouseName = (warehouseId) => {
    const selectedWarehouse = warehouseOptions.find(
      (warehouse) => String(warehouse.id) === String(warehouseId)
    );

    return selectedWarehouse?.name || '';
  };

  const handleFieldChange = (field, value) => {
    setFormValues((current) => {
      const nextValues = { ...current, [field]: value };
      const previousSourceName = getWarehouseName(current.from_warehouse);
      const previousDestinationName = getWarehouseName(current.to_warehouse);

      if (field === 'from_warehouse') {
        const nextSourceName = getWarehouseName(value);

        if (
          !String(current.from_location || '').trim() ||
          current.from_location === previousSourceName
        ) {
          nextValues.from_location = nextSourceName;
        }
      }

      if (field === 'to_warehouse') {
        const nextDestinationName = getWarehouseName(value);

        if (
          !String(current.to_location || '').trim() ||
          current.to_location === previousDestinationName
        ) {
          nextValues.to_location = nextDestinationName;
        }
      }

      return nextValues;
    });
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
            updatedLine.item_code = selectedProduct.code || '';
            updatedLine.item_name = selectedProduct.name || '';
            updatedLine.unit = selectedProduct.uom_name || selectedProduct.uom_code || '';
            updatedLine.unit_price =
              selectedProduct.cost ||
              selectedProduct.purchase_price ||
              selectedProduct.sales_price ||
              '';
          }
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
    if (!formValues.transfer_date) {
      toast.error('Transfer date is required.');
      return;
    }

    if (!formValues.from_warehouse || !formValues.to_warehouse) {
      toast.error('Select both source and destination warehouses.');
      return;
    }

    if (String(formValues.from_warehouse) === String(formValues.to_warehouse)) {
      toast.error('Source and destination warehouses must be different.');
      return;
    }

    const validLines = formValues.lines.filter(
      (line) => String(line.product || '').trim() && String(line.item_name || '').trim()
    );

    if (!validLines.length) {
      toast.error('Add at least one stock item to the transfer.');
      return;
    }

    const invalidQuantity = validLines.some((line) => Number(line.quantity || 0) <= 0);

    if (invalidQuantity) {
      toast.error('Each transfer line must have a quantity greater than zero.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        transfer_date: formValues.transfer_date,
        from_warehouse: formValues.from_warehouse || null,
        to_warehouse: formValues.to_warehouse || null,
        from_location:
          formValues.from_location.trim() || getWarehouseName(formValues.from_warehouse) || null,
        to_location:
          formValues.to_location.trim() || getWarehouseName(formValues.to_warehouse) || null,
        status: formValues.status,
        sent_by: formValues.sent_by || null,
        received_by: formValues.received_by || null,
        vehicle_number: formValues.vehicle_number.trim() || null,
        driver_name: formValues.driver_name.trim() || null,
        notes: formValues.notes.trim() || null,
        lines: validLines.map((line) => ({
          product: Number(line.product),
          item_code: line.item_code.trim(),
          item_name: line.item_name.trim(),
          quantity: Number(line.quantity || 0),
          unit: line.unit.trim(),
          unit_price: Number(line.unit_price || 0),
          remarks: line.remarks?.trim() || null,
        })),
      };

      const response = isEdit
        ? await patchRequest(detailEndpointBuilder(transferId), payload)
        : await createRequest(listEndpoint, payload);

      toast.success(
        isEdit ? `${entityLabel} updated successfully.` : `${entityLabel} created successfully.`
      );
      onSuccess?.(response);
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error?.response?.data || error));
    } finally {
      setSubmitting(false);
    }
  };

  const sourceWarehouseName = getWarehouseName(formValues.from_warehouse);
  const destinationWarehouseName = getWarehouseName(formValues.to_warehouse);

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{isEdit ? `Edit ${entityLabel}` : `Create ${entityLabel}`}</DialogTitle>

      <DialogContent dividers>
        {isEdit && detailLoading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <Stack spacing={3} sx={{ pt: 1 }}>
            {isEdit && detailError && (
              <Alert severity="error">
                {`The selected ${entityLabelLower} could not be loaded for editing.`}
              </Alert>
            )}

            <Box>
              <Typography variant="h6" fontWeight={700}>
                Transfer Context
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose the warehouse route first, then assign the dispatch and receiving team,
                transport details, and movement status before posting the stock transfer.
              </Typography>
            </Box>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2.5,
                borderColor: '#bfdbfe',
                bgcolor: '#eff6ff',
              }}
            >
              <Stack spacing={1.25}>
                <Typography variant="subtitle2" fontWeight={700} color="#1d4ed8">
                  Transfer Route Preview
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Button
                    variant="outlined"
                    color="inherit"
                    sx={{
                      pointerEvents: 'none',
                      borderColor: '#bfdbfe',
                      bgcolor: '#ffffff',
                      color: '#1d4ed8',
                    }}
                  >
                    {sourceWarehouseName || 'Select From Warehouse'}
                  </Button>
                  <Iconify icon="solar:arrow-right-linear" width={20} sx={{ color: '#64748b' }} />
                  <Button
                    variant="outlined"
                    color="inherit"
                    sx={{
                      pointerEvents: 'none',
                      borderColor: '#bae6fd',
                      bgcolor: '#ffffff',
                      color: '#0f766e',
                    }}
                  >
                    {destinationWarehouseName || 'Select To Warehouse'}
                  </Button>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Every product line below will be moved out of the source warehouse and received
                  into the destination warehouse.
                </Typography>
              </Stack>
            </Paper>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Transfer Date"
                  value={formValues.transfer_date}
                  onChange={(event) => handleFieldChange('transfer_date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
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
                  label="From Warehouse"
                  value={formValues.from_warehouse}
                  onChange={(event) => handleFieldChange('from_warehouse', event.target.value)}
                  disabled={warehousesLoading}
                  helperText="Select the warehouse the products will leave from."
                >
                  <MenuItem value="">Select From Warehouse</MenuItem>
                  {sourceWarehouseOptions.map((warehouse) => (
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
                  label="To Warehouse"
                  value={formValues.to_warehouse}
                  onChange={(event) => handleFieldChange('to_warehouse', event.target.value)}
                  disabled={warehousesLoading}
                  helperText="Select the receiving warehouse for this transfer."
                >
                  <MenuItem value="">Select To Warehouse</MenuItem>
                  {destinationWarehouseOptions.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={String(warehouse.id)}>
                      {warehouse.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Dispatch Label"
                  value={formValues.from_location}
                  onChange={(event) => handleFieldChange('from_location', event.target.value)}
                  placeholder="Defaults to the source warehouse name"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Receiving Label"
                  value={formValues.to_location}
                  onChange={(event) => handleFieldChange('to_location', event.target.value)}
                  placeholder="Defaults to the destination warehouse name"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Dispatch Owner"
                  value={formValues.sent_by}
                  onChange={(event) => handleFieldChange('sent_by', event.target.value)}
                  disabled={usersLoading}
                >
                  <MenuItem value="">Select Dispatch Owner</MenuItem>
                  {userOptions.map((user) => (
                    <MenuItem key={user.id} value={String(user.id)}>
                      {user.username}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Receiving Owner"
                  value={formValues.received_by}
                  onChange={(event) => handleFieldChange('received_by', event.target.value)}
                  disabled={usersLoading}
                >
                  <MenuItem value="">Select Receiving Owner</MenuItem>
                  {userOptions.map((user) => (
                    <MenuItem key={user.id} value={String(user.id)}>
                      {user.username}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Vehicle / Transport Reference"
                  value={formValues.vehicle_number}
                  onChange={(event) => handleFieldChange('vehicle_number', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Driver / Courier Name"
                  value={formValues.driver_name}
                  onChange={(event) => handleFieldChange('driver_name', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Movement Notes"
                  value={formValues.notes}
                  onChange={(event) => handleFieldChange('notes', event.target.value)}
                  placeholder="Record dispatch instructions, receiving conditions, or movement context."
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
                    Products In Transfer
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select the products leaving the source warehouse and set the quantity being
                    received by the destination warehouse.
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
                  onClick={addLineItem}
                >
                  Add Product
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
                              {product.name}
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
                      <Grid size={{ xs: 12, md: 1.5 }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Transfer Qty"
                          value={line.quantity}
                          onChange={(event) =>
                            handleLineChange(line.localId, 'quantity', event.target.value)
                          }
                          inputProps={{ min: 0, step: '0.01' }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 1.5 }}>
                        <TextField
                          fullWidth
                          label="Unit"
                          value={line.unit}
                          onChange={(event) =>
                            handleLineChange(line.localId, 'unit', event.target.value)
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
                            handleLineChange(line.localId, 'unit_price', event.target.value)
                          }
                          inputProps={{ min: 0, step: '0.01' }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 10 }}>
                        <TextField
                          fullWidth
                          label="Remarks"
                          value={line.remarks}
                          onChange={(event) =>
                            handleLineChange(line.localId, 'remarks', event.target.value)
                          }
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
          {submitting ? 'Saving...' : isEdit ? 'Save Transfer Changes' : 'Create Internal Transfer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
