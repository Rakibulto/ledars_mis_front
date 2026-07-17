'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState, useEffect } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Paper,
  Stack,
  Button,
  Divider,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

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

const ADJUSTMENT_TYPE_OPTIONS = [
  { value: 'stock_in', label: 'Stock In' },
  { value: 'stock_out', label: 'Stock Out' },
  { value: 'correction', label: 'Correction' },
  { value: 'return', label: 'Return' },
];

const STOCK_IN_TYPES = new Set(['stock_in', 'return']);
const STOCK_OUT_TYPES = new Set(['stock_out']);

function getCountedQtyError(adjustmentType, systemQty, countedQty) {
  if (systemQty === '' || countedQty === '') return null;
  const sys = Number(systemQty);
  const cnt = Number(countedQty);
  if (STOCK_IN_TYPES.has(adjustmentType) && cnt <= sys) {
    return `Must be greater than system qty (${sys})`;
  }
  if (STOCK_OUT_TYPES.has(adjustmentType) && cnt >= sys) {
    return `Must be less than system qty (${sys})`;
  }
  return null;
}

function normalizeCollection(payload) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.results) ? payload.results : [];
}

function createLocalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDifference(value) {
  const amount = Number(value || 0);
  if (amount > 0) return `+${amount.toLocaleString('en-BD')}`;
  return amount.toLocaleString('en-BD');
}

function createEmptyLine() {
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
    adjustment_type: 'correction',
    office_location: '',
    location: '',
    reason: '',
    status: 'Draft',
    adjusted_by: '',
    lines: [createEmptyLine()],
  };
}

function mapAdjustmentToFormValues(adj) {
  return {
    adjustment_date: adj?.adjustment_date || new Date().toISOString().split('T')[0],
    adjustment_type: adj?.adjustment_type || 'correction',
    office_location: adj?.office_location ? String(adj.office_location) : '',
    location: adj?.location || '',
    reason: adj?.reason || '',
    status: adj?.status || 'Draft',
    adjusted_by: adj?.adjusted_by ? String(adj.adjusted_by) : '',
    lines:
      adj?.lines?.length > 0
        ? adj.lines.map((line) => ({
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
        : [createEmptyLine()],
  };
}

function ReviewField({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} color="text.primary">
        {value || 'Not provided'}
      </Typography>
    </Box>
  );
}

export default function StockAdjustmentFormPage({ mode = 'create' }) {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();

  const isEdit = mode === 'edit';
  const adjustmentId = params?.adjustmentId;

  const detailUrl = isEdit && adjustmentId ? EP.stock_adjustment_by_id(adjustmentId) : null;
  const { data: adjustment, loading: detailLoading, error: detailError } = useGetRequest(detailUrl);

  // Load all offices/warehouses from office_management
  const { data: rawOffices, loading: officesLoading } = useGetRequest(
    `${PM.office_management}?pagination=false`
  );

  // Load users for "Adjusted By"
  const { data: rawUsers, loading: usersLoading } = useGetRequest(endpoints.auth.simpleUsers);

  const officeOptions = useMemo(
    () =>
      normalizeCollection(rawOffices)
        .filter((o) => o.type === 'office' || o.type === 'warehouse')
        .sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || ''), undefined, {
            sensitivity: 'base',
          })
        ),
    [rawOffices]
  );

  const userOptions = useMemo(
    () =>
      normalizeCollection(rawUsers)
        .filter((u) => u?.username)
        .sort((a, b) =>
          String(a.username || '').localeCompare(String(b.username || ''), undefined, {
            sensitivity: 'base',
          })
        ),
    [rawUsers]
  );

  // Items for the selected office/warehouse
  const [selectedOfficeId, setSelectedOfficeId] = useState('');

  const itemsFetchUrl = useMemo(
    () =>
      selectedOfficeId ? `${EP.inventory_office_stock_detail}?office_id=${selectedOfficeId}` : null,
    [selectedOfficeId]
  );
  const { data: rawItems, loading: itemsLoading } = useGetRequest(itemsFetchUrl);

  // Items keyed by product_id for fast lookup
  const itemOptions = useMemo(() => normalizeCollection(rawItems), [rawItems]);
  const itemById = useMemo(
    () => new Map(itemOptions.map((item) => [String(item.product_id), item])),
    [itemOptions]
  );

  const [formValues, setFormValues] = useState(createDefaultFormValues);
  const [submitting, setSubmitting] = useState(false);

  // Reset on mode change
  useEffect(() => {
    if (!isEdit) {
      setFormValues(createDefaultFormValues());
      setSelectedOfficeId('');
    }
  }, [isEdit]);

  // Populate form in edit mode
  useEffect(() => {
    if (!isEdit || !adjustment?.id) return;
    const next = mapAdjustmentToFormValues(adjustment);
    setFormValues(next);
    if (next.office_location) setSelectedOfficeId(next.office_location);
  }, [adjustment, isEdit]);

  const lineImpactSummary = useMemo(
    () =>
      formValues.lines.reduce(
        (acc, line) => {
          const diff = Number(line.difference || 0);
          if (diff > 0) acc.positive += diff;
          else if (diff < 0) acc.negative += Math.abs(diff);
          return acc;
        },
        { positive: 0, negative: 0 }
      ),
    [formValues.lines]
  );

  const handleFieldChange = (field, value) => {
    setFormValues((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'office_location') {
        // Reset lines when warehouse changes
        setSelectedOfficeId(value);
        next.lines = [createEmptyLine()];
      }
      if (field === 'adjustment_type') {
        // Re-validate all line counted_qty errors when type changes
        next.lines = prev.lines.map((line) => ({
          ...line,
          counted_qty_error: getCountedQtyError(value, line.system_qty, line.counted_qty),
        }));
      }
      return next;
    });
  };

  const handleLineChange = (localId, field, value) => {
    setFormValues((prev) => ({
      ...prev,
      lines: prev.lines.map((line) => {
        if (line.localId !== localId) return line;

        const updated = { ...line, [field]: value };

        if (field === 'product') {
          const item = itemById.get(String(value));
          if (item) {
            updated.item_code = item.sku || '';
            updated.item_name = item.product_name || '';
            updated.system_qty = Number(item.quantity ?? 0);
            updated.counted_qty = Number(item.quantity ?? 0);
            updated.difference = 0;
            updated.unit = item.unit || '';
            updated.unit_price = Number(item.unit_price ?? 0);
          } else {
            updated.item_code = '';
            updated.item_name = '';
            updated.system_qty = '';
            updated.counted_qty = '';
            updated.difference = '';
            updated.unit = '';
            updated.unit_price = '';
          }
        }

        if (field === 'counted_qty') {
          const sysQty = Number(line.system_qty || 0);
          const cntQty = Number(value || 0);
          updated.difference = cntQty - sysQty;
        }

        if (field === 'counted_qty' || field === 'product') {
          updated.counted_qty_error = getCountedQtyError(
            prev.adjustment_type,
            updated.system_qty,
            updated.counted_qty
          );
        }

        return updated;
      }),
    }));
  };

  const addLine = () => {
    setFormValues((prev) => ({ ...prev, lines: [...prev.lines, createEmptyLine()] }));
  };

  const removeLine = (localId) => {
    setFormValues((prev) => ({
      ...prev,
      lines: prev.lines.length === 1 ? prev.lines : prev.lines.filter((l) => l.localId !== localId),
    }));
  };

  const validate = () => {
    if (!formValues.adjustment_date) {
      toast.error('Adjustment date is required.');
      return false;
    }
    if (!formValues.office_location) {
      toast.error('Please select a warehouse / office location.');
      return false;
    }
    const validLines = formValues.lines.filter(
      (l) => String(l.product || '').trim() && String(l.item_name || '').trim()
    );
    if (!validLines.length) {
      toast.error('Add at least one product line.');
      return false;
    }
    const negativeCountedQty = validLines.some((l) => Number(l.counted_qty || 0) < 0);
    if (negativeCountedQty) {
      toast.error('Counted quantity cannot be negative.');
      return false;
    }
    const adjustmentType = formValues.adjustment_type;
    for (const l of validLines) {
      const err = getCountedQtyError(adjustmentType, l.system_qty, l.counted_qty);
      if (err) {
        toast.error(`${l.item_name || 'A line'}: ${err}`);
        return false;
      }
    }
    const noChange = validLines.every((l) => Number(l.difference || 0) === 0);
    if (noChange && adjustmentType !== 'correction') {
      toast.error('At least one line must have a non-zero difference.');
      return false;
    }
    return true;
  };

  const buildPayload = (statusOverride) => {
    const validLines = formValues.lines.filter(
      (l) => String(l.product || '').trim() && String(l.item_name || '').trim()
    );
    return {
      adjustment_date: formValues.adjustment_date,
      adjustment_type: formValues.adjustment_type,
      office_location: Number(formValues.office_location),
      location: formValues.location.trim() || null,
      reason: formValues.reason.trim() || null,
      status: statusOverride || formValues.status,
      adjusted_by: formValues.adjusted_by || null,
      lines: validLines.map((l) => ({
        product: Number(l.product),
        item_code: String(l.item_code || '').trim(),
        item_name: String(l.item_name || '').trim(),
        system_qty: Number(l.system_qty || 0),
        counted_qty: Number(l.counted_qty || 0),
        difference: Number(l.difference || 0),
        unit: String(l.unit || '').trim(),
        unit_price: Number(l.unit_price || 0),
        reason: l.reason?.trim() || null,
      })),
    };
  };

  const handleSubmit = async (statusOverride) => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = buildPayload(statusOverride);
      const response = isEdit
        ? await patchRequest(EP.stock_adjustment_by_id(adjustmentId), payload)
        : await createRequest(EP.stock_adjustments, payload);

      const recordId = response?.id || adjustmentId;
      toast.success(isEdit ? 'Stock adjustment updated.' : 'Stock adjustment created.');

      await Promise.all([
        mutate((key) => typeof key === 'string' && key.startsWith(EP.stock_adjustments)),
        recordId ? mutate(EP.stock_adjustment_by_id(recordId)) : Promise.resolve(),
      ]);

      if (isEdit) {
        router.push(paths.dashboard.storeInventory.stock_adjustment_detail(recordId));
      } else {
        router.push(paths.dashboard.storeInventory.stock_adjustment);
      }
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err));
    } finally {
      setSubmitting(false);
    }
  };

  const returnPath =
    isEdit && adjustmentId
      ? paths.dashboard.storeInventory.stock_adjustment_detail(adjustmentId)
      : paths.dashboard.storeInventory.stock_adjustment;

  if (isEdit && detailLoading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Stack spacing={3}>
        {/* ── Header ── */}
        <Card
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)}, ${alpha(theme.palette.success.main, 0.06)})`,
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
            <Box>
              <Button
                component={Link}
                href={returnPath}
                startIcon={<Iconify icon="solar:arrow-left-linear" />}
                sx={{ px: 0, mb: 1, textTransform: 'none' }}
              >
                {isEdit ? 'Back to Adjustment' : 'Back to Adjustments'}
              </Button>
              <Typography variant="h4" fontWeight={800} color="text.primary">
                {isEdit ? 'Edit Stock Adjustment' : 'Create Stock Adjustment'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {isEdit
                  ? 'Update the adjustment context, warehouse, and line items on this page.'
                  : 'Select a warehouse, add product lines with counted quantities, then save as draft or submit for approval.'}
              </Typography>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <Chip
                label={isEdit ? 'Edit Mode' : 'Create Mode'}
                color={isEdit ? 'warning' : 'primary'}
                variant="soft"
              />
              <Button component={Link} href={returnPath} variant="outlined" color="inherit">
                Cancel
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Iconify icon="solar:diskette-bold-duotone" />}
                onClick={() => handleSubmit('Draft')}
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Save Draft'}
              </Button>
              <Button
                variant="contained"
                color="warning"
                startIcon={<Iconify icon="solar:clipboard-check-bold" />}
                onClick={() => handleSubmit('Pending Approval')}
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Submit & Pending'}
              </Button>
            </Stack>
          </Stack>
        </Card>

        {isEdit && detailError && (
          <Alert severity="error" sx={{ borderRadius: 2.5 }}>
            The selected adjustment could not be loaded for editing.
          </Alert>
        )}

        {/* ── Adjustment Context ── */}
        <Card sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Adjustment Context
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select the warehouse or office whose stock you are correcting, then fill in the
                adjustment type, date, and reason.
              </Typography>
            </Box>

            {/* Workflow summary */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.warning.main, 0.05),
                borderColor: alpha(theme.palette.warning.main, 0.3),
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                flexWrap="wrap"
                useFlexGap
              >
                <Alert severity="success" sx={{ py: 0, flex: 1, minWidth: 200 }}>
                  +{lineImpactSummary.positive.toLocaleString('en-BD')} increase qty
                </Alert>
                <Alert severity="error" sx={{ py: 0, flex: 1, minWidth: 200 }}>
                  -{lineImpactSummary.negative.toLocaleString('en-BD')} decrease qty
                </Alert>
                <Alert severity="info" sx={{ py: 0, flex: 1, minWidth: 200 }}>
                  Net {formatDifference(lineImpactSummary.positive - lineImpactSummary.negative)}
                </Alert>
              </Stack>
            </Paper>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Warehouse / Office *"
                  value={formValues.office_location}
                  onChange={(e) => handleFieldChange('office_location', e.target.value)}
                  disabled={officesLoading}
                  helperText={
                    officeOptions.length === 0 && !officesLoading
                      ? 'No offices/warehouses found'
                      : 'Items are loaded based on this selection'
                  }
                >
                  <MenuItem value="">Select Warehouse / Office</MenuItem>
                  {officeOptions.map((office) => (
                    <MenuItem key={office.id} value={String(office.id)}>
                      <Stack spacing={0}>
                        <Typography variant="body2" fontWeight={600}>
                          {office.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {office.type === 'warehouse' ? 'Warehouse' : 'Office'}
                          {office.location ? ` • ${office.location}` : ''}
                        </Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Adjustment Date *"
                  value={formValues.adjustment_date}
                  onChange={(e) => handleFieldChange('adjustment_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2.5 }}>
                <TextField
                  select
                  fullWidth
                  label="Adjustment Type"
                  value={formValues.adjustment_type}
                  onChange={(e) => handleFieldChange('adjustment_type', e.target.value)}
                >
                  {ADJUSTMENT_TYPE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 2.5 }}>
                <TextField
                  select
                  fullWidth
                  label="Adjusted By"
                  value={formValues.adjusted_by}
                  onChange={(e) => handleFieldChange('adjusted_by', e.target.value)}
                  disabled={usersLoading}
                >
                  <MenuItem value="">Not Assigned</MenuItem>
                  {userOptions.map((u) => (
                    <MenuItem key={u.id} value={String(u.id)}>
                      {u.username}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Location Label"
                  value={formValues.location}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  placeholder="Optional sub-location label"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Adjustment Reason"
                  value={formValues.reason}
                  onChange={(e) => handleFieldChange('reason', e.target.value)}
                  placeholder="Why is this stock correction being made?"
                />
              </Grid>
            </Grid>
          </Stack>
        </Card>

        {/* ── Line Items ── */}
        <Card sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
          <Stack spacing={2.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Adjustment Line Items
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formValues.office_location
                    ? 'Select products from the chosen warehouse/office and enter the counted quantity.'
                    : 'Select a warehouse / office above to load its available items.'}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={addLine}
                disabled={!formValues.office_location}
              >
                Add Line
              </Button>
            </Stack>

            <Divider />

            {!formValues.office_location ? (
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.warning.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Iconify icon="solar:info-circle-bold-duotone" sx={{ color: 'warning.main' }} />
                  <Typography variant="body2" color="warning.dark">
                    Select a warehouse or office location first to load its available items.
                  </Typography>
                </Stack>
              </Box>
            ) : (
              <Stack spacing={2}>
                {formValues.lines.map((line, index) => (
                  <Paper key={line.localId} variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" fontWeight={700}>
                          Line Item {index + 1}
                        </Typography>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => removeLine(line.localId)}
                          disabled={formValues.lines.length === 1}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Stack>

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            select
                            fullWidth
                            label="Product *"
                            value={line.product}
                            onChange={(e) =>
                              handleLineChange(line.localId, 'product', e.target.value)
                            }
                            disabled={itemsLoading}
                            SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 320 } } } }}
                          >
                            <MenuItem value="">
                              {itemsLoading ? 'Loading…' : 'Select Product'}
                            </MenuItem>
                            {itemOptions.map((item) => (
                              <MenuItem key={item.product_id} value={String(item.product_id)}>
                                <Stack spacing={0}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {item.product_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {item.sku} • Stock: {Number(item.quantity ?? 0)} {item.unit}
                                  </Typography>
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
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                          <TextField
                            fullWidth
                            label="Unit"
                            value={line.unit}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                          <TextField
                            fullWidth
                            type="number"
                            label="System Qty"
                            value={line.system_qty}
                            InputProps={{ readOnly: true }}
                            helperText="Current warehouse stock"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Counted Qty *"
                            value={line.counted_qty}
                            onChange={(e) =>
                              handleLineChange(line.localId, 'counted_qty', e.target.value)
                            }
                            inputProps={{ min: 0, step: '0.01' }}
                            disabled={!line.product}
                            error={Boolean(line.counted_qty_error)}
                            helperText={
                              line.counted_qty_error
                                ? line.counted_qty_error
                                : line.product
                                  ? `Diff: ${formatDifference(line.difference)}`
                                  : '—'
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Unit Price"
                            value={line.unit_price}
                            InputProps={{ readOnly: true }}
                            helperText="Auto-filled from product"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 10 }}>
                          <TextField
                            fullWidth
                            label="Line Reason"
                            value={line.reason}
                            onChange={(e) =>
                              handleLineChange(line.localId, 'reason', e.target.value)
                            }
                            placeholder="Optional reason for this line"
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>
        </Card>

        {/* ── Bottom Actions ── */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
          <Button
            component={Link}
            href={returnPath}
            variant="outlined"
            color="inherit"
            size="large"
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="large"
            startIcon={<Iconify icon="solar:diskette-bold-duotone" />}
            onClick={() => handleSubmit('Draft')}
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Save Draft'}
          </Button>
          <Button
            variant="contained"
            color="warning"
            size="large"
            startIcon={<Iconify icon="solar:clipboard-check-bold" />}
            onClick={() => handleSubmit('Pending Approval')}
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Submit & Pending'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
