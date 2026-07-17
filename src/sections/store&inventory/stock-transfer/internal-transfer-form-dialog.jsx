'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useMemo, useState, useEffect } from 'react';

import { useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  Grid,
  alpha,
  Stack,
  Button,
  Dialog,
  Divider,
  MenuItem,
  Skeleton,
  TextField,
  IconButton,
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

// ─── constants ────────────────────────────────────────────────────────────────

const EP = endpoints.storeInventory;
const PM = endpoints.procurement_management;

const EMPTY_LINE = {
  product: '',
  product_name: '',
  product_code: '',
  quantity: '',
  unit: '',
  notes: '',
  max_qty: null,
};
const STATUS_CHOICES_EDIT = ['Draft', 'In Transit', 'Received', 'Cancelled'];
const today = () => new Date().toISOString().slice(0, 10);

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.results) ? payload.results : [];
}

// ─── InternalTransferFormDialog ───────────────────────────────────────────────

export default function InternalTransferFormDialog({ open, mode, transferId, onClose, onSuccess }) {
  const theme = useTheme();
  const isEdit = mode === 'edit';

  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState({
    transfer_date: today(),
    from_office: '',
    to_office: '',
    status: 'Draft',
    notes: '',
  });
  const [lines, setLines] = useState([{ ...EMPTY_LINE }]);

  // ── data fetching ──────────────────────────────────────────────────────────
  const { data: rawOffices, loading: officesLoading } = useGetRequest(
    open ? PM.office_management : null
  );
  const itemsUrl = useMemo(
    () =>
      open && fields.from_office
        ? `${EP.items}?office_id=${fields.from_office}&page_size=1000`
        : null,
    [open, fields.from_office]
  );
  const { data: rawItems, loading: itemsLoading } = useGetRequest(itemsUrl);
  const { data: rawTransfer, loading: transferLoading } = useGetRequest(
    open && isEdit && transferId ? EP.internal_transfer_by_id(transferId) : null
  );

  const allOffices = useMemo(() => normalizeList(rawOffices), [rawOffices]);
  const allItems = useMemo(() => normalizeList(rawItems), [rawItems]);

  // ── populate form when editing ─────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (isEdit && rawTransfer && !transferLoading) {
      const t = rawTransfer;
      setFields({
        transfer_date: t.transfer_date || today(),
        from_office: t.from_office != null ? String(t.from_office) : '',
        to_office: t.to_office != null ? String(t.to_office) : '',
        status: t.status || 'Draft',
        notes: t.notes || '',
      });
      const existingLines =
        Array.isArray(t.lines) && t.lines.length > 0
          ? t.lines.map((l) => ({
              id: l.id,
              product: l.product != null ? String(l.product) : '',
              product_name: l.product_name || '',
              product_code: l.product_code || '',
              quantity: l.quantity != null ? String(l.quantity) : '',
              unit: l.unit || '',
              notes: l.notes || '',
            }))
          : [{ ...EMPTY_LINE }];
      setLines(existingLines);
    } else if (!isEdit) {
      setFields({
        transfer_date: today(),
        from_office: '',
        to_office: '',
        status: 'Draft',
        notes: '',
      });
      setLines([{ ...EMPTY_LINE }]);
    }
  }, [open, isEdit, rawTransfer, transferLoading]);


  // ── helpers ────────────────────────────────────────────────────────────────
  const setField = (key, val) => setFields((prev) => ({ ...prev, [key]: val }));

  const handleFromOfficeChange = (val) => {
    setField('from_office', val);
    setLines([{ ...EMPTY_LINE }]);
  };

  const handleLineChange = (idx, key, val) => {
    setLines((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };

      if (key === 'product' && val) {
        const item = allItems.find((i) => String(i.id) === String(val));
        if (item) {
          const stock = Number(item.current_stock ?? item.on_hand ?? 0);
          next[idx].product_name = item.item_name || item.name || item.product_name || '';
          next[idx].product_code = item.item_code || item.code || item.product_code || '';
          next[idx].unit = item.unit || item.uom_name || '';
          next[idx].max_qty = stock;
          next[idx].quantity = '';
          if (stock === 0) toast.warning(`"${next[idx].product_name}" has no stock available.`);
        }
      }

      if (key === 'quantity') {
        const maxQty = next[idx].max_qty;
        const entered = Number(val);
        if (maxQty !== null && entered > maxQty) {
          next[idx].quantity = String(maxQty);
          toast.warning(`Quantity capped at available stock: ${maxQty}`);
          return next;
        }
      }

      return next;
    });
  };

  const addLine = () => setLines((prev) => [...prev, { ...EMPTY_LINE }]);
  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const toOffices = useMemo(
    () => allOffices.filter((o) => String(o.id) !== String(fields.from_office)),
    [allOffices, fields.from_office]
  );

  const selectedProductIds = useMemo(
    () => new Set(lines.map((l) => l.product).filter(Boolean)),
    [lines]
  );

  const buildPayload = () => ({
    transfer_date: fields.transfer_date,
    from_office: fields.from_office ? Number(fields.from_office) : null,
    to_office: fields.to_office ? Number(fields.to_office) : null,
    status: fields.status,
    notes: fields.notes || '',
    lines: lines
      .filter((l) => l.product && l.quantity)
      .map((l) => ({
        ...(l.id ? { id: l.id } : {}),
        product: Number(l.product),
        product_name: l.product_name || '',
        product_code: l.product_code || '',
        quantity: l.quantity,
        unit: l.unit || '',
        notes: l.notes || '',
      })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fields.transfer_date || !fields.from_office || !fields.to_office) {
      toast.error('Please fill Date, From, and To fields.');
      return;
    }
    if (lines.filter((l) => l.product && l.quantity).length === 0) {
      toast.error('Please add at least one line item with product and quantity.');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        await patchRequest(EP.internal_transfer_by_id(transferId), payload);
        toast.success('Transfer updated.');
      } else {
        await createRequest(EP.internal_transfers, payload);
        toast.success('Transfer created.');
      }
      mutate((key) => typeof key === 'string' && key.startsWith(EP.internal_transfers));
      await onSuccess();
    } catch (err) {
      const msg = extractErrorMessage(err?.response?.data || err);
      toast.error(msg || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const showLoading = isEdit && transferLoading && !rawTransfer;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        component: 'div',
        sx: {
          borderRadius: 3,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            pb: 1.5,
            flexShrink: 0,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 1)}`,
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <Iconify icon="solar:transfer-horizontal-bold-duotone" width={20} />
          </Box>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={800}>
              {isEdit ? 'Edit Transfer' : 'New Internal Transfer'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isEdit ? `Editing transfer record` : 'Move stock between offices / warehouses'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ flexShrink: 0 }}>
            <Iconify icon="solar:close-circle-bold" width={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            flex: '1 1 auto',
            overflowY: 'auto',
            pt: '20px !important',
            pb: 1,
            px: { xs: 2, sm: 3 },
          }}
        >
          {showLoading ? (
            <Stack spacing={2}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={52} />
              ))}
            </Stack>
          ) : (
            <Stack spacing={2.5}>
              {/* Header fields */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    fullWidth
                    required
                    size="small"
                    type="date"
                    label="Transfer Date"
                    value={fields.transfer_date}
                    onChange={(e) => setField('transfer_date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    required
                    size="small"
                    label="From (Source)"
                    value={fields.from_office}
                    onChange={(e) => handleFromOfficeChange(e.target.value)}
                    disabled={officesLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Iconify
                            icon="solar:buildings-2-bold-duotone"
                            width={16}
                            sx={{ color: 'text.disabled' }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  >
                    <MenuItem value="" disabled>
                      Select source office/warehouse
                    </MenuItem>
                    {allOffices.map((o) => (
                      <MenuItem key={o.id} value={String(o.id)}>
                        {o.name}
                        <Chip
                          label={o.type}
                          size="small"
                          variant="soft"
                          sx={{ ml: 0.75, height: 16, fontSize: 10 }}
                        />
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    required
                    size="small"
                    label="To (Destination)"
                    value={fields.to_office}
                    onChange={(e) => setField('to_office', e.target.value)}
                    disabled={!fields.from_office || officesLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Iconify
                            icon="solar:buildings-2-bold-duotone"
                            width={16}
                            sx={{ color: 'text.disabled' }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  >
                    <MenuItem value="" disabled>
                      Select destination office/warehouse
                    </MenuItem>
                    {toOffices.map((o) => (
                      <MenuItem key={o.id} value={String(o.id)}>
                        {o.name}
                        <Chip
                          label={o.type}
                          size="small"
                          variant="soft"
                          color="info"
                          sx={{ ml: 0.75, height: 16, fontSize: 10 }}
                        />
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {isEdit && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Status"
                      value={fields.status}
                      onChange={(e) => setField('status', e.target.value)}
                    >
                      {STATUS_CHOICES_EDIT.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}

                <Grid size={{ xs: 12, md: isEdit ? 8 : 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Notes (optional)"
                    multiline
                    rows={2}
                    value={fields.notes}
                    onChange={(e) => setField('notes', e.target.value)}
                    placeholder="Any remarks about this transfer..."
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 0.5 }} />

              {/* Line items */}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Line Items
                    {fields.from_office && (
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        (products from selected source)
                      </Typography>
                    )}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Iconify icon="solar:add-circle-bold" width={14} />}
                    onClick={addLine}
                    disabled={!fields.from_office}
                  >
                    Add Item
                  </Button>
                </Stack>

                {!fields.from_office && (
                  <Card
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.warning.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    }}
                  >
                    <Stack direction="row" gap={1} alignItems="center">
                      <Iconify
                        icon="solar:info-circle-bold-duotone"
                        width={18}
                        sx={{ color: 'warning.main' }}
                      />
                      <Typography variant="body2" color="warning.dark">
                        Select a source office/warehouse first to load available items.
                      </Typography>
                    </Stack>
                  </Card>
                )}

                {fields.from_office && (
                  <Stack spacing={1.5}>
                    {lines.map((line, idx) => (
                      <Card
                        key={idx}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.divider, 1)}`,
                          bgcolor: alpha(theme.palette.grey[500], 0.02),
                        }}
                      >
                        <Grid container spacing={1.5} alignItems="center">
                          <Grid size={{ xs: 12, sm: 5 }}>
                            <TextField
                              select
                              fullWidth
                              required
                              size="small"
                              label="Product"
                              value={line.product}
                              onChange={(e) => handleLineChange(idx, 'product', e.target.value)}
                              disabled={itemsLoading}
                              SelectProps={{
                                renderValue: (val) => {
                                  if (!val) return '';
                                  const found = allItems.find((i) => String(i.id) === String(val));
                                  return found
                                    ? found.item_name ||
                                        found.name ||
                                        found.product_name ||
                                        String(val)
                                    : line.product_name || String(val);
                                },
                              }}
                              InputProps={
                                itemsLoading
                                  ? {
                                      endAdornment: (
                                        <InputAdornment position="end">
                                          <CircularProgress size={14} />
                                        </InputAdornment>
                                      ),
                                    }
                                  : {}
                              }
                            >
                              <MenuItem value="" disabled>
                                Select item…
                              </MenuItem>
                              {allItems
                                .filter(
                                  (item) =>
                                    !selectedProductIds.has(String(item.id)) ||
                                    String(item.id) === String(line.product)
                                )
                                .map((item) => (
                                  <MenuItem key={item.id} value={String(item.id)}>
                                    <Box>
                                      <Typography variant="body2" fontWeight={600} lineHeight={1.4}>
                                        {item.item_name || item.name || item.product_name || '—'}
                                      </Typography>
                                      <Typography variant="caption" color="text.disabled">
                                        {item.item_code || item.code}&nbsp;·&nbsp;
                                        {item.current_stock ?? item.on_hand ?? 0}{' '}
                                        {item.unit || 'unit'}
                                      </Typography>
                                    </Box>
                                  </MenuItem>
                                ))}
                            </TextField>
                          </Grid>

                          <Grid size={{ xs: 6, sm: 2.5 }}>
                            <TextField
                              fullWidth
                              required
                              size="small"
                              label="Quantity"
                              type="number"
                              inputProps={{
                                min: 0.01,
                                step: 0.01,
                                max: line.max_qty ?? undefined,
                              }}
                              value={line.quantity}
                              onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                              disabled={!line.product || line.max_qty === 0}
                              helperText={
                                line.product && line.max_qty !== null
                                  ? line.max_qty === 0
                                    ? 'No stock'
                                    : `Max: ${line.max_qty}`
                                  : undefined
                              }
                              FormHelperTextProps={{
                                sx: {
                                  color: line.max_qty === 0 ? 'error.main' : 'text.disabled',
                                  mx: 0,
                                  mt: 0.3,
                                  fontSize: 10,
                                },
                              }}
                            />
                          </Grid>

                          <Grid size={{ xs: 6, sm: 2 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Unit"
                              value={line.unit}
                              InputProps={{ readOnly: true }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  bgcolor: alpha(theme.palette.grey[500], 0.06),
                                },
                              }}
                            />
                          </Grid>

                          <Grid size={{ xs: 10, sm: 2 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Note (opt.)"
                              value={line.notes}
                              onChange={(e) => handleLineChange(idx, 'notes', e.target.value)}
                            />
                          </Grid>

                          <Grid
                            size={{ xs: 2, sm: 0.5 }}
                            sx={{ display: 'flex', justifyContent: 'center' }}
                          >
                            {lines.length > 1 && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeLine(idx)}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                              </IconButton>
                            )}
                          </Grid>
                        </Grid>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            flexShrink: 0,
            borderTop: `1px solid ${alpha(theme.palette.divider, 1)}`,
            gap: 1,
          }}
        >
          <Button variant="outlined" color="inherit" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={
              saving ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <Iconify icon="solar:check-circle-bold" width={16} />
              )
            }
          >
            {saving ? 'Saving…' : isEdit ? 'Update Transfer' : 'Create Transfer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
