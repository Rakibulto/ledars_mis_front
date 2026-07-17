'use client';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import AlertTitle from '@mui/material/AlertTitle';
import LoadingButton from '@mui/lab/LoadingButton';
import Autocomplete from '@mui/material/Autocomplete';
import ToggleButton from '@mui/material/ToggleButton';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';
import { DashboardContent } from 'src/layouts/dashboard';

// ─── constants ───────────────────────────────────────────────────────────────

const EP = endpoints.procurement_management;

const UNIT_OPTIONS = [
  'Pcs',
  'Set',
  'Box',
  'Kg',
  'Liter',
  'Packet',
  'Ream',
  'Roll',
  'Lot',
  'Job',
  'Sq.ft',
  'Running ft',
];

const emptyItem = () => ({
  item: null,
  item_name: '',
  description: '',
  specification: '',
  unit: 'Pcs',
  quantity: 1,
  unit_price: '',
  remarks: '',
});

const emptyForm = {
  rfq: '',
  vendor_name: '',
  vendor_email: '',
  vendor_phone: '',
  vendor_address: '',
  justification: '',
  delivery_terms: '',
  payment_terms: '',
  warranty_terms: '',
  validity_date: '',
  discount_percentage: 0,
  tax_amount: 0,
};

// ─── helpers ─────────────────────────────────────────────────────────────────

const parseNum = (v) => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
};

const fmtCurrency = (v) =>
  `BDT ${parseNum(v).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ─── sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="subtitle1" fontWeight={600}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

function FieldLabel({ children, required }) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ mb: 0.5, display: 'block', fontWeight: 500 }}
    >
      {children}
      {required && (
        <Box component="span" sx={{ color: 'error.main', ml: 0.3 }}>
          *
        </Box>
      )}
    </Typography>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export default function DirectEvaluationMain() {
  const router = useRouter();

  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [rfqItemsLoading, setRfqItemsLoading] = useState(false);
  const [rfqItemsLoaded, setRfqItemsLoaded] = useState(false);
  const [vendorMode, setVendorMode] = useState('manual'); // 'existing' | 'manual'
  const [vendorId, setVendorId] = useState(null);

  // Fetch RFQ list for dropdown
  const { data: rfqData, isLoading: rfqLoading } = useGetRequest(EP?.rfqs ?? null);
  const rfqList = rfqData?.results ?? rfqData ?? [];
  const { data: formOptionsData } = useGetRequest(
    endpoints.procurement_management.material_requisitions_form_options
  );
  const { data: uomData } = useGetRequest(endpoints.storeInventory.uom);

  // Fetch vendor list for existing-vendor mode
  const { data: vendorData, isLoading: vendorLoading } = useGetRequest(
    vendorMode === 'existing' ? endpoints.storeInventory.vendors : null
  );
  const vendorList = useMemo(() => {
    if (!vendorData) return [];
    return Array.isArray(vendorData) ? vendorData : (vendorData.results ?? []);
  }, [vendorData]);

  const itemOptions = formOptionsData?.items ?? [];
  const unitOptions = useMemo(() => {
    if (!uomData) return UNIT_OPTIONS;
    const raw = Array.isArray(uomData) ? uomData : (uomData.results ?? []);
    const names = raw.map((it) => (it?.name ?? '').toString().trim()).filter(Boolean);
    return names.length ? Array.from(new Set(names)).sort() : UNIT_OPTIONS;
  }, [uomData]);

  // ── Auto-load RFQ line items when an RFQ is selected ───────────────────

  useEffect(() => {
    if (!form.rfq) {
      setRfqItemsLoaded(false);
      return;
    }
    let cancelled = false;
    setRfqItemsLoading(true);
    axiosInstance
      .get(EP.rfq_by_id(form.rfq))
      .then(({ data }) => {
        if (cancelled) return;
        const lineItems = data.line_items ?? [];
        if (lineItems.length > 0) {
          setItems(
            lineItems.map((li) => {
              const matchedItem = itemOptions.find(
                (option) => option?.name?.trim() === String(li.item_name ?? '').trim()
              );
              return {
                item: matchedItem || null,
                item_name: li.item_name ?? '',
                description: li.specifications ?? '',
                specification: li.specifications ?? '',
                unit: li.unit ?? 'Pcs',
                quantity: li.quantity ?? 1,
                unit_price: li.estimated_unit_price ?? '',
                remarks: '',
              };
            })
          );
          setRfqItemsLoaded(true);
        } else {
          setRfqItemsLoaded(false);
        }
      })
      .catch(() => {
        if (!cancelled) setRfqItemsLoaded(false);
      })
      .finally(() => {
        if (!cancelled) setRfqItemsLoading(false);
      });
    // eslint-disable-next-line consistent-return
    return () => {
      cancelled = true;
    };
  }, [form.rfq]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── form field handler ──────────────────────────────────────────────────

  const handleChange = useCallback(
    (field) => (e) => {
      const { value } = e.target;
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      // Clear loaded-items flag when RFQ changes so user knows items will reload
      if (field === 'rfq') setRfqItemsLoaded(false);
    },
    []
  );

  // ── items management ────────────────────────────────────────────────────

  const handleItemChange = useCallback(
    (index, field) => (e) => {
      setItems((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: e.target.value };
        return updated;
      });
    },
    []
  );

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, emptyItem()]);
  }, []);

  const removeItem = useCallback((index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── computed totals ─────────────────────────────────────────────────────

  const subtotal = items.reduce(
    (acc, it) => acc + parseNum(it.quantity) * parseNum(it.unit_price),
    0
  );
  const discountValue = subtotal * (parseNum(form.discount_percentage) / 100);
  const grandTotal = subtotal - discountValue + parseNum(form.tax_amount);

  // ── validation ──────────────────────────────────────────────────────────

  const validate = () => {
    const errs = {};
    if (!form.rfq) errs.rfq = 'RFQ is required';
    if (vendorMode === 'existing') {
      if (!vendorId) errs.vendor_id = 'Please select an existing vendor';
    } else {
      if (!form.vendor_name.trim()) errs.vendor_name = 'Vendor name is required';
      if (!form.vendor_email.trim()) errs.vendor_email = 'Vendor email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.vendor_email))
        errs.vendor_email = 'Enter a valid email';
    }
    if (items.length === 0) errs.items = 'Add at least one item';
    items.forEach((it, i) => {
      if (!it.item_name.trim()) errs[`item_name_${i}`] = 'Name required';
      if (parseNum(it.quantity) < 1) errs[`item_qty_${i}`] = 'Min qty 1';
      if (parseNum(it.unit_price) <= 0) errs[`item_price_${i}`] = 'Price required';
    });
    return errs;
  };

  // ── submit ──────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Please fix the highlighted errors before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        rfq: form.rfq,
        ...(vendorMode === 'existing'
          ? { vendor_id: vendorId }
          : {
              vendor_name: form.vendor_name,
              vendor_email: form.vendor_email,
              vendor_phone: form.vendor_phone,
              vendor_address: form.vendor_address,
            }),
        justification: form.justification,
        delivery_terms: form.delivery_terms,
        payment_terms: form.payment_terms,
        warranty_terms: form.warranty_terms,
        validity_date: form.validity_date || null,
        discount_percentage: parseNum(form.discount_percentage),
        tax_amount: parseNum(form.tax_amount),
        items: items.map((it) => ({
          item_id: it.item?.id ?? null,
          item_name: it.item_name,
          description: it.description,
          specification: it.specification,
          unit: it.unit,
          quantity: parseInt(it.quantity, 10),
          unit_price: parseNum(it.unit_price),
          remarks: it.remarks,
        })),
      };

      const { data } = await axiosInstance.post(EP.quotation_direct_evaluation, payload);

      toast.success(
        `Direct evaluation submitted. Quotation: ${data.quotation_number} | Award: ${data.award_number}`
      );

      // Reset form
      setForm(emptyForm);
      setItems([emptyItem()]);
      setRfqItemsLoaded(false);
      setVendorMode('manual');
      setVendorId(null);

      // Navigate to quotation list after short delay
      setTimeout(() => {
        router.push('/dashboard/procurement/awards/summary');
      }, 1500);
    } catch (err) {
      const msg = err?.message || 'Submission failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, items, router]);

  // ── render ──────────────────────────────────────────────────────────────

  return (
    <DashboardContent>
      {/* Page header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack>
          <Typography variant="h5" fontWeight={700}>
            Direct Evaluation
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Submit a vendor quote directly without requiring a vendor portal registration.
          </Typography>
        </Stack>

        <Button
          variant="outlined"
          color="inherit"
          startIcon={<Icon icon="solar:arrow-left-bold-duotone" />}
          onClick={() => router.push('/dashboard/procurement/request-for-quotation')}
        >
          Back to RFQ List
        </Button>
      </Stack>

      {/* Explanatory warning */}
      <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
        <AlertTitle sx={{ fontWeight: 700 }}>Important: special purchase process</AlertTitle>
        This form is for direct vendor quotes and does not follow the usual vendor portal or
        comparison steps. Use it only when a supplier is not registered in the portal, such as in
        urgent or sole-source cases. The award will be saved as a direct evaluation transaction, and
        portal notifications will not be sent. Make sure you have the right approval before
        submitting.
      </Alert>

      <Grid container spacing={3}>
        {/* ── Left column ────────────────────────────────────────────── */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* RFQ Selection */}
          <Card sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <SectionHeader
              title="RFQ Reference"
              subtitle="Link this direct evaluation to an existing RFQ. Items from the RFQ will be loaded automatically."
            />
            <FieldLabel required>Select RFQ</FieldLabel>
            <TextField
              select
              fullWidth
              size="small"
              value={form.rfq}
              onChange={handleChange('rfq')}
              error={!!errors.rfq}
              helperText={errors.rfq}
              disabled={rfqLoading}
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="" disabled>
                {rfqLoading ? 'Loading RFQs…' : '— Select an RFQ —'}
              </MenuItem>
              {rfqList.map((rfq) => (
                <MenuItem key={rfq.id} value={rfq.id}>
                  {rfq.rfq_number} {rfq.rfq_title ? `— ${rfq.rfq_title}` : ''}
                </MenuItem>
              ))}
            </TextField>
            {rfqItemsLoading && (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5 }}>
                <CircularProgress size={14} />
                <Typography variant="caption" color="text.secondary">
                  Loading RFQ line items…
                </Typography>
              </Stack>
            )}
            {rfqItemsLoaded && !rfqItemsLoading && (
              <Alert
                severity="success"
                icon={<Icon icon="solar:check-circle-bold-duotone" />}
                sx={{ mt: 1.5, py: 0.5 }}
              >
                <Typography variant="caption">
                  RFQ line items loaded. Review quantities and enter unit prices below.
                </Typography>
              </Alert>
            )}
          </Card>

          {/* Vendor Information */}
          <Card sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <SectionHeader
              title="Vendor Information"
              subtitle="Choose how to specify the vendor for this direct evaluation"
            />

            {/* Mode toggle */}
            <Box sx={{ mb: 2.5 }}>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={vendorMode}
                onChange={(_, val) => {
                  if (!val) return; // prevent deselecting
                  setVendorMode(val);
                  setVendorId(null);
                  setErrors((prev) => ({
                    ...prev,
                    vendor_id: undefined,
                    vendor_name: undefined,
                    vendor_email: undefined,
                  }));
                }}
                sx={{ borderRadius: 1 }}
              >
                <ToggleButton
                  value="existing"
                  sx={{ px: 2, textTransform: 'none', fontSize: '0.8125rem' }}
                >
                  <Icon
                    icon="solar:buildings-2-bold-duotone"
                    width={16}
                    style={{ marginRight: 6 }}
                  />
                  Select existing vendor
                </ToggleButton>
                <ToggleButton
                  value="manual"
                  sx={{ px: 2, textTransform: 'none', fontSize: '0.8125rem' }}
                >
                  <Icon icon="solar:pen-bold-duotone" width={16} style={{ marginRight: 6 }} />
                  Enter vendor manually
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Existing vendor selector */}
            {vendorMode === 'existing' && (
              <Box>
                <FieldLabel required>Select Vendor</FieldLabel>
                <Autocomplete
                  value={vendorList.find((v) => v.id === vendorId) ?? null}
                  onChange={(_, val) => {
                    setVendorId(val?.id ?? null);
                    setErrors((prev) => ({ ...prev, vendor_id: undefined }));
                  }}
                  options={vendorList}
                  getOptionLabel={(opt) => opt?.company_name ?? opt?.name ?? `Vendor #${opt?.id}`}
                  isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                  loading={vendorLoading}
                  size="small"
                  fullWidth
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={vendorLoading ? 'Loading vendors…' : 'Search or select a vendor'}
                      size="small"
                      error={!!errors.vendor_id}
                      helperText={errors.vendor_id}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {vendorLoading ? <CircularProgress size={14} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Box>
            )}

            {/* Manual vendor fields */}
            {vendorMode === 'manual' && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FieldLabel required>Vendor Name</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. Kampala Supplies Ltd"
                    value={form.vendor_name}
                    onChange={handleChange('vendor_name')}
                    error={!!errors.vendor_name}
                    helperText={errors.vendor_name}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FieldLabel required>Contact Email</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    type="email"
                    placeholder="vendor@example.com"
                    value={form.vendor_email}
                    onChange={handleChange('vendor_email')}
                    error={!!errors.vendor_email}
                    helperText={errors.vendor_email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Icon icon="solar:letter-bold-duotone" width={16} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FieldLabel>Phone Number</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="+256 700 000000"
                    value={form.vendor_phone}
                    onChange={handleChange('vendor_phone')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Icon icon="solar:phone-bold-duotone" width={16} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FieldLabel>Vendor Address</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    placeholder="Plot 12, Kampala Road, Kampala"
                    value={form.vendor_address}
                    onChange={handleChange('vendor_address')}
                  />
                </Grid>
              </Grid>
            )}

            {/* Validity date — always visible */}
            <Box sx={{ mt: 2, width: 220 }}>
              <FieldLabel>Validity Date</FieldLabel>
              <DatePicker
                value={form.validity_date ? dayjs(form.validity_date) : null}
                format="DD/MM/YYYY"
                onChange={(newValue) => {
                  const dateValue =
                    newValue && dayjs(newValue).isValid()
                      ? dayjs(newValue).format('YYYY-MM-DD')
                      : '';
                  setForm((prev) => ({ ...prev, validity_date: dateValue }));
                }}
                slotProps={{ textField: { size: 'small' } }}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Box>
          </Card>
          {/* Quotation Items */}
          <Card sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2.5 }}
            >
              <SectionHeader
                title="Bill of Quantities (BOQ)"
                subtitle={
                  rfqItemsLoaded
                    ? 'Items loaded from the selected RFQ. Enter unit prices and adjust quantities as needed.'
                    : 'List all quote line items in BOQ format'
                }
              />
              <Button
                size="small"
                variant="outlined"
                startIcon={<Icon icon="solar:add-circle-bold-duotone" />}
                onClick={addItem}
              >
                Add Item
              </Button>
            </Stack>

            {errors.items && (
              <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block' }}>
                {errors.items}
              </Typography>
            )}

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Item</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Specifications</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 120, textAlign: 'center' }}>
                      Unit
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 80, textAlign: 'center' }}>
                      Qty
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 140, textAlign: 'right' }}>
                      Unit Price (BDT)
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 140, textAlign: 'right' }}>
                      Ext. Amount (BDT)
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 160 }}>Remarks</TableCell>
                    <TableCell sx={{ width: 48 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((it, i) => {
                    const lineTotal = parseNum(it.quantity) * parseNum(it.unit_price);
                    return (
                      <TableRow key={i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>
                          <Autocomplete
                            value={it.item}
                            onChange={(_, val) => {
                              setItems((prev) => {
                                const updated = [...prev];
                                updated[i] = {
                                  ...updated[i],
                                  item: val || null,
                                  item_name: val?.name ?? '',
                                  description: val?.name ?? updated[i].description,
                                  specification: val?.subcategory_name ?? updated[i].specification,
                                  unit: val?.unit ?? updated[i].unit,
                                  unit_price: val?.unit_price ?? updated[i].unit_price,
                                };
                                return updated;
                              });
                            }}
                            options={itemOptions}
                            getOptionLabel={(opt) => opt?.name ?? ''}
                            isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                            size="small"
                            sx={{ width: 160, '& .MuiOutlinedInput-root': { fontSize: '0.75rem' } }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Select item"
                                size="small"
                                error={!!errors[`item_name_${i}`]}
                                helperText={errors[`item_name_${i}`]}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Description"
                            value={it.description}
                            onChange={handleItemChange(i, 'description')}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Brand, model, size..."
                            value={it.specification}
                            onChange={handleItemChange(i, 'specification')}
                          />
                        </TableCell>
                        <TableCell>
                          <Autocomplete
                            value={it.unit || 'Pcs'}
                            onChange={(_, val) =>
                              setItems((prev) => {
                                const updated = [...prev];
                                updated[i] = { ...updated[i], unit: val ?? 'Pcs' };
                                return updated;
                              })
                            }
                            options={unitOptions}
                            size="small"
                            disableClearable
                            sx={{ width: 90, '& .MuiOutlinedInput-root': { fontSize: '0.75rem' } }}
                            renderInput={(params) => <TextField {...params} size="small" />}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ min: 1 }}
                            value={it.quantity}
                            onChange={handleItemChange(i, 'quantity')}
                            error={!!errors[`item_qty_${i}`]}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ min: 0, step: '0.01' }}
                            value={it.unit_price}
                            onChange={handleItemChange(i, 'unit_price')}
                            error={!!errors[`item_price_${i}`]}
                            helperText={errors[`item_price_${i}`]}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: 'right' }}
                          >
                            {fmtCurrency(lineTotal)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Optional"
                            value={it.remarks}
                            onChange={handleItemChange(i, 'remarks')}
                          />
                        </TableCell>
                        <TableCell>
                          {items.length > 1 && (
                            <IconButton size="small" color="error" onClick={() => removeItem(i)}>
                              <Icon icon="solar:trash-bin-trash-bold-duotone" width={18} />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Terms */}
          <Card sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <SectionHeader title="Terms & Conditions" />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FieldLabel>Delivery Terms</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  placeholder="e.g. 14 days after order"
                  value={form.delivery_terms}
                  onChange={handleChange('delivery_terms')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FieldLabel>Payment Terms</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  placeholder="e.g. 30 days net"
                  value={form.payment_terms}
                  onChange={handleChange('payment_terms')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FieldLabel>Warranty Terms</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  placeholder="e.g. 12 months manufacturer warranty"
                  value={form.warranty_terms}
                  onChange={handleChange('warranty_terms')}
                />
              </Grid>
            </Grid>
          </Card>

          {/* Justification */}
          <Card sx={{ p: 3, borderRadius: 2 }}>
            <SectionHeader
              title="Justification / Notes"
              subtitle="Explain why a direct evaluation is being used instead of the vendor portal"
            />
            <TextField
              fullWidth
              size="small"
              multiline
              rows={4}
              placeholder="e.g. Vendor is a known local supplier with no internet access. Quote received via phone / in-person."
              value={form.justification}
              onChange={handleChange('justification')}
            />
          </Card>
        </Grid>

        {/* ── Right column ────────────────────────────────────────────── */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* Price Summary */}
          <Card sx={{ p: 3, mb: 3, borderRadius: 2, position: 'sticky', top: 80 }}>
            <SectionHeader title="Price Summary" />

            <Stack spacing={2.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {fmtCurrency(subtotal)}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <FieldLabel>Discount (%)</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  inputProps={{ min: 0, max: 100, step: '0.1' }}
                  value={form.discount_percentage}
                  onChange={handleChange('discount_percentage')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
                {discountValue > 0 && (
                  <Typography variant="caption" color="success.main">
                    − {fmtCurrency(discountValue)}
                  </Typography>
                )}
              </Stack>

              <Stack spacing={0.5}>
                <FieldLabel>Tax / VAT (BDT)</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  inputProps={{ min: 0, step: '0.01' }}
                  value={form.tax_amount}
                  onChange={handleChange('tax_amount')}
                />
              </Stack>

              <Divider />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" fontWeight={700}>
                  Grand Total
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                  {fmtCurrency(grandTotal)}
                </Typography>
              </Stack>

              <Divider />

              <Box
                sx={{
                  p: 1.5,
                  bgcolor: 'warning.lighter',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'warning.light',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <Icon icon="solar:danger-bold-duotone" color="#B76E00" width={18} />
                  <Typography variant="caption" color="warning.darker">
                    When you submit this form, the system will create a vendor quote and an award
                    record right away. It will skip the normal quote comparison process.
                  </Typography>
                </Stack>
              </Box>

              <LoadingButton
                fullWidth
                size="large"
                variant="contained"
                color="primary"
                loading={submitting}
                onClick={handleSubmit}
                startIcon={<Icon icon="solar:check-circle-bold-duotone" />}
              >
                Submit Direct Evaluation
              </LoadingButton>

              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                onClick={() => {
                  setForm(emptyForm);
                  setItems([emptyItem()]);
                  setErrors({});
                  setVendorMode('manual');
                  setVendorId(null);
                }}
              >
                Reset Form
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
