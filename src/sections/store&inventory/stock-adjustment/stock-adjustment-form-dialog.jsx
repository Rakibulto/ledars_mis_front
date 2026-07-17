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
const PM = endpoints.procurement_management;

const ADJUSTMENT_TYPE_OPTIONS = ['Increase', 'Decrease', 'Recount'];

function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function formatDifference(value) {
  const amount = Number(value || 0);

  if (amount > 0) {
    return `+${amount.toLocaleString('en-BD')}`;
  }

  return amount.toLocaleString('en-BD');
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

function getProductSystemQty(product) {
  return Number(
    product?.on_hand ??
      product?.available_qty ??
      product?.availableQty ??
      product?.current_qty ??
      product?.currentQty ??
      product?.stock ??
      product?.quantity ??
      0
  );
}

function createEmptyLineItem() {
  return {
    localId: createLocalId(),
    product: '',
    item_code: '',
    item_name: '',
    system_qty: '',
    counted_qty: '',
    difference: '',
    unit: '',
    unit_price: '',
    reason: '',
  };
}

function createDefaultFormValues() {
  return {
    adjustment_date: new Date().toISOString().split('T')[0],
    adjustment_type: 'Recount',
    warehouse: '',
    office_location: '',
    location: '',
    reason: '',
    status: 'Draft',
    adjusted_by: '',
    lines: [createEmptyLineItem()],
  };
}

function mapAdjustmentToFormValues(adjustment) {
  return {
    adjustment_date: adjustment?.adjustment_date || new Date().toISOString().split('T')[0],
    adjustment_type: adjustment?.adjustment_type || 'Recount',
    warehouse: adjustment?.warehouse ? String(adjustment.warehouse) : '',
    office_location: adjustment?.office_location ? String(adjustment.office_location) : '',
    location: adjustment?.location || '',
    reason: adjustment?.reason || '',
    status: adjustment?.status || 'Draft',
    adjusted_by: adjustment?.adjusted_by ? String(adjustment.adjusted_by) : '',
    lines:
      adjustment?.lines?.length > 0
        ? adjustment.lines.map((line) => ({
            localId: createLocalId(),
            product: line.product ? String(line.product) : '',
            item_code: line.item_code || '',
            item_name: line.item_name || line.product_name || '',
            system_qty: line.system_qty ?? '',
            counted_qty: line.counted_qty ?? '',
            difference: line.difference ?? '',
            unit: line.unit || '',
            unit_price: line.unit_price ?? '',
            reason: line.reason || '',
          }))
        : [createEmptyLineItem()],
  };
}

export default function StockAdjustmentFormDialog({
  open,
  mode,
  adjustmentId,
  onClose,
  onSuccess,
}) {
  const isEdit = mode === 'edit';
  const detailUrl = open && adjustmentId ? EP.stock_adjustment_by_id(adjustmentId) : null;
  const { data: adjustment, loading: detailLoading, error: detailError } = useGetRequest(detailUrl);
  const { data: rawProducts, loading: productsLoading } = useGetRequest(open ? EP.products : null);
  const { data: rawUsers, loading: usersLoading } = useGetRequest(
    open ? endpoints.auth.simpleUsers : null
  );
  const { data: rawWarehouses, loading: warehousesLoading } = useGetRequest(
    open ? EP.warehouses : null
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

  const warehouseOptions = useMemo(
    () =>
      [...normalizeCollection(rawWarehouses)].sort((left, right) =>
        String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawWarehouses]
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

  const [formValues, setFormValues] = useState(createDefaultFormValues);
  const [submitting, setSubmitting] = useState(false);

  const workflowStatus = useMemo(
    () => normalizeStatus(formValues.status || 'Draft'),
    [formValues.status]
  );

  const lineImpactSummary = useMemo(
    () =>
      formValues.lines.reduce(
        (summary, line) => {
          const difference = Number(line.difference || 0);

          if (difference > 0) {
            summary.positive += difference;
          } else if (difference < 0) {
            summary.negative += Math.abs(difference);
          }

          return summary;
        },
        { positive: 0, negative: 0 }
      ),
    [formValues.lines]
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
    if (!open || !isEdit || !adjustment?.id) {
      return;
    }

    setFormValues(mapAdjustmentToFormValues(adjustment));
  }, [adjustment, isEdit, open]);

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
            const systemQty = getProductSystemQty(selectedProduct);

            updatedLine.item_code = selectedProduct.code || '';
            updatedLine.item_name = selectedProduct.name || '';
            updatedLine.system_qty = systemQty;
            updatedLine.counted_qty = systemQty;
            updatedLine.difference = 0;
            updatedLine.unit = selectedProduct.uom_name || selectedProduct.uom_code || '';
            updatedLine.unit_price =
              selectedProduct.cost ||
              selectedProduct.purchase_price ||
              selectedProduct.sales_price ||
              '';
          }
        }

        if (field === 'system_qty' || field === 'counted_qty') {
          const systemQty = Number(field === 'system_qty' ? value : updatedLine.system_qty || 0);
          const countedQty = Number(field === 'counted_qty' ? value : updatedLine.counted_qty || 0);

          updatedLine.difference = countedQty - systemQty;
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

  const handleSubmit = async (nextStatus = formValues.status) => {
    if (!formValues.adjustment_date) {
      toast.error('Adjustment date is required.');
      return;
    }

    const validLines = formValues.lines.filter(
      (line) => String(line.product || '').trim() && String(line.item_name || '').trim()
    );

    if (!validLines.length) {
      toast.error('Add at least one stock item to the adjustment.');
      return;
    }

    const invalidQuantities = validLines.some(
      (line) => Number(line.system_qty || 0) < 0 || Number(line.counted_qty || 0) < 0
    );

    if (invalidQuantities) {
      toast.error('System and counted quantities cannot be negative.');
      return;
    }

    const negativeStockLines = validLines.filter((line) => {
      const diff = Number(line.counted_qty || 0) - Number(line.system_qty || 0);
      return diff < 0 && Number(line.system_qty || 0) + diff < 0;
    });

    if (negativeStockLines.length > 0) {
      toast.error('Stock cannot go below zero. Review counted quantities for negative results.');
      return;
    }

    const preparedLines = validLines.map((line) => {
      const systemQty = Number(line.system_qty || 0);
      const countedQty = Number(line.counted_qty || 0);

      return {
        product: Number(line.product),
        item_code: line.item_code.trim(),
        item_name: line.item_name.trim(),
        system_qty: systemQty,
        counted_qty: countedQty,
        difference: countedQty - systemQty,
        unit: line.unit.trim(),
        unit_price: Number(line.unit_price || 0),
        reason: line.reason?.trim() || null,
      };
    });

    if (!preparedLines.some((line) => Number(line.difference || 0) !== 0)) {
      toast.error('At least one line must carry a non-zero adjustment difference.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        adjustment_date: formValues.adjustment_date,
        adjustment_type: formValues.adjustment_type,
        warehouse: formValues.warehouse ? Number(formValues.warehouse) : null,
        office_location: formValues.office_location ? Number(formValues.office_location) : null,
        location: formValues.location.trim() || null,
        reason: formValues.reason.trim() || null,
        status: nextStatus,
        adjusted_by: formValues.adjusted_by || null,
        lines: preparedLines,
      };

      const response = isEdit
        ? await patchRequest(EP.stock_adjustment_by_id(adjustmentId), payload)
        : await createRequest(EP.stock_adjustments, payload);

      toast.success(
        isEdit ? 'Stock adjustment updated successfully.' : 'Stock adjustment created successfully.'
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
      <DialogTitle>{isEdit ? 'Edit Stock Adjustment' : 'Create Stock Adjustment'}</DialogTitle>

      <DialogContent dividers>
        {isEdit && detailLoading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <Stack spacing={3} sx={{ pt: 1 }}>
            {isEdit && detailError && (
              <Alert severity="error">
                The selected stock adjustment could not be loaded for editing.
              </Alert>
            )}

            <Box>
              <Typography variant="h6" fontWeight={700}>
                Adjustment Context
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Capture the warehouse correction first, then save draft changes or submit the
                adjustment for approval. Product stock updates only when the record is approved.
              </Typography>
            </Box>

            <Paper
              variant="outlined"
              sx={{ p: 2.5, borderRadius: 2.5, bgcolor: '#fffbeb', borderColor: '#fde68a' }}
            >
              <Stack spacing={1.5}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap>
                  <Typography variant="subtitle1" fontWeight={700} color="#92400e">
                    Approval Workflow
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current stage: {formValues.status || 'Draft'}
                  </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  Positive differences will add stock after approval. Negative differences will
                  reduce stock after approval. Draft and pending records do not touch product
                  quantity.
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    size="small"
                    variant={workflowStatus === 'draft' ? 'contained' : 'outlined'}
                  >
                    Draft
                  </Button>
                  <Button
                    size="small"
                    color="warning"
                    variant={workflowStatus === 'pending approval' ? 'contained' : 'outlined'}
                  >
                    Pending Approval
                  </Button>
                  <Button
                    size="small"
                    color="success"
                    variant={workflowStatus === 'approved' ? 'contained' : 'outlined'}
                  >
                    Approved
                  </Button>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Alert severity="success" sx={{ py: 0, flex: 1, minWidth: 220 }}>
                    Increase Qty {lineImpactSummary.positive.toLocaleString('en-BD')}
                  </Alert>
                  <Alert severity="error" sx={{ py: 0, flex: 1, minWidth: 220 }}>
                    Decrease Qty {lineImpactSummary.negative.toLocaleString('en-BD')}
                  </Alert>
                  <Alert severity="info" sx={{ py: 0, flex: 1, minWidth: 220 }}>
                    Net Qty{' '}
                    {formatDifference(lineImpactSummary.positive - lineImpactSummary.negative)}
                  </Alert>
                </Stack>
              </Stack>
            </Paper>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Adjustment Date"
                  value={formValues.adjustment_date}
                  onChange={(event) => handleFieldChange('adjustment_date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Adjustment Type"
                  value={formValues.adjustment_type}
                  onChange={(event) => handleFieldChange('adjustment_type', event.target.value)}
                >
                  {ADJUSTMENT_TYPE_OPTIONS.map((option) => (
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
                  {warehouseOptions.map((wh) => (
                    <MenuItem key={wh.id} value={String(wh.id)}>
                      {wh.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Office / Location"
                  value={formValues.office_location}
                  onChange={(event) => handleFieldChange('office_location', event.target.value)}
                  disabled={officeLocationsLoading}
                  helperText="Select to update location-level stock on approval"
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
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Location Label"
                  value={formValues.location}
                  onChange={(event) => handleFieldChange('location', event.target.value)}
                  placeholder="Optional location label"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Adjusted By"
                  value={formValues.adjusted_by}
                  onChange={(event) => handleFieldChange('adjusted_by', event.target.value)}
                  disabled={usersLoading}
                >
                  <MenuItem value="">Select Adjuster</MenuItem>
                  {userOptions.map((user) => (
                    <MenuItem key={user.id} value={String(user.id)}>
                      {user.username}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Adjustment Reason"
                  value={formValues.reason}
                  onChange={(event) => handleFieldChange('reason', event.target.value)}
                  placeholder="Explain why this stock correction is required."
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
                    Adjustment Line Items
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Compare system quantity versus counted quantity, then capture the valuation and
                    reason for each line difference.
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
                          SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 320 } } } }}
                        >
                          <MenuItem value="">Select Product</MenuItem>
                          {productOptions.map((product) => (
                            <MenuItem key={product.id} value={String(product.id)}>
                              <Stack spacing={0}>
                                <Typography variant="body2" fontWeight={600}>
                                  {product.name}
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
                          label="System Qty"
                          value={line.system_qty}
                          onChange={(event) =>
                            handleLineChange(line.localId, 'system_qty', event.target.value)
                          }
                          inputProps={{ min: 0, step: '0.01' }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 1.5 }}>
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
                        <TextField
                          fullWidth
                          label="Difference"
                          value={formatDifference(line.difference)}
                          disabled
                        />
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
                      <Grid size={{ xs: 12, md: 8 }}>
                        <TextField
                          fullWidth
                          label="Line Reason"
                          value={line.reason}
                          onChange={(event) =>
                            handleLineChange(line.localId, 'reason', event.target.value)
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
          variant="outlined"
          onClick={() => handleSubmit('Draft')}
          disabled={submitting || (isEdit && detailLoading) || workflowStatus === 'approved'}
        >
          {submitting && workflowStatus === 'draft' ? 'Saving...' : 'Save Draft'}
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={() => handleSubmit('Pending Approval')}
          disabled={submitting || (isEdit && detailLoading) || workflowStatus === 'approved'}
        >
          {submitting
            ? 'Saving...'
            : workflowStatus === 'pending approval'
              ? 'Save Pending Adjustment'
              : 'Submit for Approval'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
