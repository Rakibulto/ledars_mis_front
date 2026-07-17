'use client';

import dayjs from 'dayjs';
import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
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

function normalizeCollection(payload) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.results) ? payload.results : [];
}

function formatQuantity(value) {
  return Number(value || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function makeEmptyItem() {
  return {
    _key: crypto.randomUUID(),
    product_id: '',
    product_name: '',
    product_code: '',
    product_system_qty: '',
    product_uom: '',
    quantity: '',
    quantity_error: null,
  };
}

function createDefaultFormValues() {
  return {
    date: new Date().toISOString().split('T')[0],
    office_location: '',
    reason: '',
    disposal_method: '',
    disposal_date: null, // dayjs object or null
    certificate_number: '',
    scrapped_by: '',
  };
}

function mapScrapToFormValues(rec) {
  return {
    date: rec?.date || new Date().toISOString().split('T')[0],
    office_location: rec?.office_location ? String(rec.office_location) : '',
    reason: rec?.reason || '',
    disposal_method: rec?.disposal_method || '',
    disposal_date: rec?.disposal_date ? dayjs(rec.disposal_date) : null,
    certificate_number: rec?.certificate_number || '',
    scrapped_by: rec?.scrapped_by ? String(rec.scrapped_by) : '',
  };
}

function getQuantityError(systemQty, qty) {
  if (systemQty === '' || qty === '') return null;
  const sys = Number(systemQty);
  const val = Number(qty);
  if (val <= 0) return 'Quantity must be greater than zero.';
  if (val > sys) return `Cannot exceed available stock (${formatQuantity(sys)}).`;
  return null;
}

export default function ScrapFormPage({ mode = 'create' }) {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();

  const isEdit = mode === 'edit';
  const scrapId = params?.scrapId;

  const detailUrl = isEdit && scrapId ? EP.scrap_record_by_id(scrapId) : null;
  const {
    data: scrapRecord,
    loading: detailLoading,
    error: detailError,
  } = useGetRequest(detailUrl);

  // Offices / Warehouses — same source as Stock Adjustment
  const { data: rawOffices, loading: officesLoading } = useGetRequest(
    `${PM.office_management}?pagination=false`
  );
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

  // Products filtered by selected office (same endpoint as Stock Adjustment)
  const [selectedOfficeId, setSelectedOfficeId] = useState('');

  const itemsFetchUrl = useMemo(
    () =>
      selectedOfficeId ? `${EP.inventory_office_stock_detail}?office_id=${selectedOfficeId}` : null,
    [selectedOfficeId]
  );
  const { data: rawItems, loading: itemsLoading } = useGetRequest(itemsFetchUrl);

  const itemOptions = useMemo(() => normalizeCollection(rawItems), [rawItems]);
  const itemByProductId = useMemo(
    () => new Map(itemOptions.map((item) => [String(item.product_id), item])),
    [itemOptions]
  );

  const [formValues, setFormValues] = useState(createDefaultFormValues);
  const [scrapItems, setScrapItems] = useState(() => [makeEmptyItem()]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      setFormValues(createDefaultFormValues());
      setScrapItems([makeEmptyItem()]);
      setSelectedOfficeId('');
    }
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit || !scrapRecord?.id) return;
    const next = mapScrapToFormValues(scrapRecord);
    setFormValues(next);
    if (next.office_location) setSelectedOfficeId(next.office_location);
    setScrapItems([
      {
        _key: crypto.randomUUID(),
        product_id: scrapRecord.product ? String(scrapRecord.product) : '',
        product_name: scrapRecord.product_name || '',
        product_code: scrapRecord.product_code || '',
        product_system_qty: '',
        product_uom: scrapRecord.uom_name || '',
        quantity: scrapRecord.quantity ?? '',
        quantity_error: null,
      },
    ]);
  }, [scrapRecord, isEdit]);

  // Backfill system qty when items load (edit mode)
  useEffect(() => {
    if (!isEdit || !itemOptions.length) return;
    setScrapItems((prev) =>
      prev.map((row) => {
        if (!row.product_id) return row;
        const item = itemByProductId.get(String(row.product_id));
        if (!item) return row;
        const sysQty = Number(item.quantity ?? 0);
        return {
          ...row,
          product_system_qty: sysQty,
          product_uom: item.unit || row.product_uom,
          quantity_error: getQuantityError(sysQty, row.quantity),
        };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemOptions]);

  const handleFieldChange = (field, value) => {
    setFormValues((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'office_location') {
        setSelectedOfficeId(value);
        setScrapItems([makeEmptyItem()]);
      }
      return next;
    });
  };

  const handleItemChange = useCallback(
    (key, field, value) => {
      setScrapItems((prev) =>
        prev.map((row) => {
          if (row._key !== key) return row;
          const next = { ...row, [field]: value };
          if (field === 'product_id') {
            const item = itemByProductId.get(String(value));
            if (item) {
              next.product_name = item.product_name || '';
              next.product_code = item.sku || '';
              next.product_system_qty = Number(item.quantity ?? 0);
              next.product_uom = item.unit || '';
            } else {
              next.product_name = '';
              next.product_code = '';
              next.product_system_qty = '';
              next.product_uom = '';
            }
            next.quantity = '';
            next.quantity_error = null;
          }
          if (field === 'quantity') {
            next.quantity_error = getQuantityError(row.product_system_qty, value);
          }
          return next;
        })
      );
    },
    [itemByProductId]
  );

  const handleAddItem = () => setScrapItems((prev) => [...prev, makeEmptyItem()]);

  const handleRemoveItem = (key) => setScrapItems((prev) => prev.filter((row) => row._key !== key));

  const selectedProductIds = useMemo(
    () => new Set(scrapItems.map((row) => row.product_id).filter(Boolean)),
    [scrapItems]
  );

  const allProductsSelected =
    Boolean(formValues.office_location) &&
    !itemsLoading &&
    itemOptions.length > 0 &&
    itemOptions.length <= selectedProductIds.size;

  const validate = () => {
    if (!formValues.office_location) {
      toast.error('Please select a warehouse / office location.');
      return false;
    }
    if (!formValues.date) {
      toast.error('Scrap date is required.');
      return false;
    }
    const validItems = scrapItems.filter((row) => row.product_id);
    if (validItems.length === 0) {
      toast.error('Please select at least one product.');
      return false;
    }
    const qtyErrorMsg = validItems.reduce((msg, row) => {
      if (msg) return msg;
      const qty = Number(row.quantity || 0);
      if (qty <= 0)
        return `Scrap quantity for "${row.product_name || 'a product'}" must be greater than zero.`;
      if (row.product_system_qty !== '' && qty > Number(row.product_system_qty))
        return `Scrap quantity for "${row.product_name}" (${qty}) cannot exceed available stock (${formatQuantity(row.product_system_qty)} ${row.product_uom}).`;
      return msg;
    }, null);
    if (qtyErrorMsg) {
      toast.error(qtyErrorMsg);
      return false;
    }
    return true;
  };

  const buildItemPayload = (row) => ({
    date: formValues.date,
    office_location: Number(formValues.office_location),
    product: Number(row.product_id),
    warehouse: null,
    quantity: Number(row.quantity || 0),
    reason: formValues.reason.trim() || null,
    disposal_method: formValues.disposal_method.trim() || null,
    disposal_date: formValues.disposal_date ? formValues.disposal_date.format('YYYY-MM-DD') : null,
    certificate_number: formValues.certificate_number.trim() || null,
    status: 'Pending Approval',
    scrapped_by: formValues.scrapped_by ? Number(formValues.scrapped_by) : null,
  });

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const validItems = scrapItems.filter((row) => row.product_id);

      if (isEdit) {
        const payload = buildItemPayload(validItems[0]);
        const response = await patchRequest(EP.scrap_record_by_id(scrapId), payload);
        const recordId = response?.id || scrapId;
        toast.success('Scrap record updated.');
        await Promise.all([
          mutate((key) => typeof key === 'string' && key.startsWith(EP.scrap_records)),
          mutate(EP.scrap_record_by_id(recordId)),
        ]);
        router.push(paths.dashboard.storeInventory.scrapManagement_detail(recordId));
      } else {
        const created = await Promise.all(
          validItems.map((row) => createRequest(EP.scrap_records, buildItemPayload(row)))
        );
        const firstId = created?.[0]?.id;
        const count = created.length;
        toast.success(
          count === 1 ? 'Scrap record created.' : `${count} scrap records created successfully.`
        );
        await mutate((key) => typeof key === 'string' && key.startsWith(EP.scrap_records));
        if (firstId) {
          router.push(paths.dashboard.storeInventory.scrapManagement_detail(firstId));
        } else {
          router.push(paths.dashboard.storeInventory.scrapManagement);
        }
      }
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err));
    } finally {
      setSubmitting(false);
    }
  };

  const returnPath =
    isEdit && scrapId
      ? paths.dashboard.storeInventory.scrapManagement_detail(scrapId)
      : paths.dashboard.storeInventory.scrapManagement;

  if (isEdit && detailLoading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const officeSelected = Boolean(formValues.office_location);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
        <Stack spacing={3}>
          {/* ── Header ── */}
          <Card
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.08)}, ${alpha(theme.palette.warning.main, 0.06)})`,
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Button
                  component={Link}
                  href={returnPath}
                  startIcon={<Iconify icon="solar:arrow-left-linear" />}
                  sx={{ px: 0, mb: 1, textTransform: 'none' }}
                >
                  {isEdit ? 'Back to Scrap Record' : 'Back to Scrap Management'}
                </Button>
                <Typography variant="h4" fontWeight={800} color="text.primary">
                  {isEdit ? 'Edit Scrap Record' : 'Create Scrap Record'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  {isEdit
                    ? 'Update the scrap record. Stock will only be deducted when the record is approved.'
                    : 'Select a warehouse, pick a product from its stock, enter the scrap quantity, and submit. The record is saved as Pending — stock is deducted only after approval.'}
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
                  color={isEdit ? 'warning' : 'error'}
                  variant="soft"
                />
                <Chip
                  label="Pending Approval on Save"
                  color="default"
                  variant="soft"
                  size="small"
                />
                <Button component={Link} href={returnPath} variant="outlined" color="inherit">
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Iconify icon="solar:trash-bin-trash-bold-duotone" />}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Saving…' : isEdit ? 'Update Record' : 'Submit Scrap Record'}
                </Button>
              </Stack>
            </Stack>
          </Card>

          {isEdit && detailError && (
            <Alert severity="error" sx={{ borderRadius: 2.5 }}>
              The selected scrap record could not be loaded for editing.
            </Alert>
          )}

          {/* ── Scrap Context ── */}
          <Card sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Scrap Context
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Select the warehouse or office first. Products available in that location will
                  load automatically. Scrap quantity must not exceed the available stock.
                </Typography>
              </Box>

              {/* Workflow note */}
              <Alert
                severity="info"
                icon={<Iconify icon="solar:clock-circle-bold-duotone" />}
                sx={{ borderRadius: 2 }}
              >
                <strong>Approval workflow:</strong> Submitting creates a{' '}
                <strong>Pending Approval</strong> record. Stock is only deducted from inventory when
                the record is <strong>Approved</strong> from the Scrap Management list.
              </Alert>

              <Grid container spacing={2}>
                {/* Warehouse / Office */}
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
                        : 'Products are filtered by this selection'
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
                {/* Date */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Scrap Date *"
                    value={formValues.date}
                    onChange={(e) => handleFieldChange('date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                {/* Recorded By */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Recorded By"
                    value={formValues.scrapped_by}
                    onChange={(e) => handleFieldChange('scrapped_by', e.target.value)}
                    disabled={usersLoading}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {userOptions.map((u) => (
                      <MenuItem key={u.id} value={String(u.id)}>
                        {u.username}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <Divider />

              {/* Product & Quantity (multi-row) */}
              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1.5 }}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    Product &amp; Scrap Quantity
                  </Typography>
                  {!isEdit && officeSelected && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
                      onClick={handleAddItem}
                      disabled={itemsLoading || allProductsSelected}
                    >
                      Add Product
                    </Button>
                  )}
                </Stack>

                {!officeSelected ? (
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.warning.main, 0.06),
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`,
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Iconify
                        icon="solar:info-circle-bold-duotone"
                        sx={{ color: 'warning.main' }}
                      />
                      <Typography variant="body2" color="warning.dark">
                        Select a warehouse or office above to load its available products.
                      </Typography>
                    </Stack>
                  </Box>
                ) : allProductsSelected ? (
                  <Alert severity="info" sx={{ borderRadius: 2, mb: 2 }}>
                    All available products have already been selected.
                  </Alert>
                ) : null}

                {officeSelected && (
                  <Stack spacing={2}>
                    {scrapItems.map((row, index) => (
                      <ScrapItemRow
                        key={row._key}
                        row={row}
                        index={index}
                        itemOptions={itemOptions}
                        itemsLoading={itemsLoading}
                        selectedProductIds={selectedProductIds}
                        isEdit={isEdit}
                        canRemove={!isEdit && scrapItems.length > 1}
                        onChange={handleItemChange}
                        onRemove={handleRemoveItem}
                        theme={theme}
                      />
                    ))}
                  </Stack>
                )}
              </Box>

              <Divider />

              {/* Disposal Details */}
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                  Disposal Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Disposal Method"
                      value={formValues.disposal_method}
                      onChange={(e) => handleFieldChange('disposal_method', e.target.value)}
                      placeholder="Recycling, Incineration, Landfill…"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <DatePicker
                      label="Disposal Date"
                      value={formValues.disposal_date}
                      onChange={(newVal) => handleFieldChange('disposal_date', newVal)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          helperText: 'Optional',
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Disposal Document Number"
                      value={formValues.certificate_number}
                      onChange={(e) => handleFieldChange('certificate_number', e.target.value)}
                      placeholder="Disposal or destruction document #"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Reason"
                      value={formValues.reason}
                      onChange={(e) => handleFieldChange('reason', e.target.value)}
                      placeholder="Describe the damage, expiry, contamination, or loss event… (optional)"
                      helperText="Optional — describe why these items are being scrapped."
                    />
                  </Grid>
                </Grid>
              </Box>
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
              variant="contained"
              color="error"
              size="large"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold-duotone" />}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Saving…' : isEdit ? 'Update Record' : 'Submit Scrap Record'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </LocalizationProvider>
  );
}

// ─── ScrapItemRow sub-component ───────────────────────────────────────────────

function ScrapItemRow({
  row,
  index,
  itemOptions,
  itemsLoading,
  selectedProductIds,
  isEdit,
  canRemove,
  onChange,
  onRemove,
  theme,
}) {
  const productSelected = Boolean(row.product_id);
  const systemQtyKnown = row.product_system_qty !== '';

  // Filter options: include current row's selection, exclude ones selected in other rows
  const availableOptions = useMemo(
    () =>
      itemOptions.filter(
        (item) =>
          !selectedProductIds.has(String(item.product_id)) ||
          String(item.product_id) === row.product_id
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemOptions, selectedProductIds, row.product_id]
  );

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary">
          Item {index + 1}
        </Typography>
        {canRemove && (
          <IconButton
            size="small"
            color="error"
            title="Remove this product row"
            onClick={() => onRemove(row._key)}
          >
            <Iconify icon="solar:close-circle-bold" width={18} />
          </IconButton>
        )}
      </Stack>

      <Grid container spacing={2}>
        {/* Product */}
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            select
            fullWidth
            label="Product *"
            value={row.product_id}
            onChange={(e) => onChange(row._key, 'product_id', e.target.value)}
            disabled={itemsLoading}
            SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 320 } } } }}
            helperText={
              itemsLoading
                ? 'Loading products…'
                : availableOptions.length === 0
                  ? 'No products available in this location'
                  : 'Products in the selected location'
            }
          >
            <MenuItem value="">{itemsLoading ? 'Loading…' : 'Select Product'}</MenuItem>
            {availableOptions.map((item) => (
              <MenuItem key={item.product_id} value={String(item.product_id)}>
                <Stack spacing={0}>
                  <Typography variant="body2" fontWeight={600}>
                    {item.product_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.sku} • Stock: {formatQuantity(item.quantity)} {item.unit}
                  </Typography>
                </Stack>
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Item Code (read-only) */}
        <Grid size={{ xs: 12, md: 2 }}>
          <TextField
            fullWidth
            label="Item Code"
            value={row.product_code}
            InputProps={{ readOnly: true }}
            helperText="Auto-filled"
          />
        </Grid>

        {/* Available Stock (read-only) */}
        <Grid size={{ xs: 12, md: 2.5 }}>
          <TextField
            fullWidth
            label="Available Stock"
            value={
              systemQtyKnown ? `${formatQuantity(row.product_system_qty)} ${row.product_uom}` : ''
            }
            InputProps={{ readOnly: true }}
            helperText="Current stock in this location"
          />
        </Grid>

        {/* Scrap Quantity */}
        <Grid size={{ xs: 12, md: 3.5 }}>
          <TextField
            fullWidth
            type="number"
            label="Scrap Quantity *"
            value={row.quantity}
            onChange={(e) => onChange(row._key, 'quantity', e.target.value)}
            inputProps={{ min: 0.01, step: '0.01' }}
            disabled={!productSelected}
            error={Boolean(row.quantity_error)}
            helperText={
              row.quantity_error ||
              (systemQtyKnown
                ? `Max: ${formatQuantity(row.product_system_qty)} ${row.product_uom}`
                : 'Select a product first')
            }
          />
        </Grid>
      </Grid>

      {/* Stock impact banner */}
      {systemQtyKnown && productSelected && !row.quantity_error && Number(row.quantity) > 0 && (
        <Alert
          severity="warning"
          icon={<Iconify icon="solar:trash-bin-trash-bold-duotone" />}
          sx={{ borderRadius: 2, mt: 1.5 }}
        >
          <strong>On approval:</strong> Stock of <strong>{row.product_name}</strong> will be reduced
          by{' '}
          <strong>
            {formatQuantity(row.quantity)} {row.product_uom}
          </strong>{' '}
          — from{' '}
          <strong>
            {formatQuantity(row.product_system_qty)} to{' '}
            {formatQuantity(Number(row.product_system_qty) - Number(row.quantity))}
          </strong>{' '}
          {row.product_uom}.
        </Alert>
      )}
    </Box>
  );
}
