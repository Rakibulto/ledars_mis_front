'use client';

import useSWR from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';

const EMPTY_ITEM = { description: '', quantity: 1, rate: 0 };

const EMPTY_FORM = {
  vendor: '',
  vendor_name: '',
  father_name: '',
  address: '',
  mobile: '',
  type_of_goods: '',
  date: new Date().toISOString().split('T')[0],
  method: 'cash',
  settlement_reference: '',
  amount_in_words: '',
  payer_signature: '',
  receiver_signature: '',
  items: [{ ...EMPTY_ITEM }],
};

export default function MoneyReceiptForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const { data: vendorsData } = useSWR(endpoints.accounting.vendors, fetcher);
  const vendors = Array.isArray(vendorsData) ? vendorsData : vendorsData?.results || [];

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleVendorChange = (e) => {
    const vendorId = e.target.value;
    const found = vendors.find((v) => v.id === vendorId);
    setForm((prev) => ({
      ...prev,
      vendor: vendorId,
      vendor_name: found?.name || found?.vendor_name || '',
    }));
  };

  const handleItemChange = (idx, field) => (e) => {
    const val = field === 'description' ? e.target.value : parseFloat(e.target.value) || 0;
    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: val };
      return { ...prev, items };
    });
  };

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, { ...EMPTY_ITEM }] }));
  const removeItem = (idx) =>
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const totalAmount = useMemo(
    () => form.items.reduce((sum, item) => sum + item.quantity * item.rate, 0),
    [form.items]
  );

  const handleSubmit = async () => {
    if (!form.vendor) {
      toast.error('Please select a vendor');
      return;
    }
    if (!form.date) {
      toast.error('Date is required');
      return;
    }
    if (totalAmount <= 0) {
      toast.error('Total amount must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      const notes = JSON.stringify({
        father_name: form.father_name,
        address: form.address,
        mobile: form.mobile,
        type_of_goods: form.type_of_goods,
        items: form.items,
        amount_in_words: form.amount_in_words,
        payer_signature: form.payer_signature,
        receiver_signature: form.receiver_signature,
        vendor_name: form.vendor_name,
      });

      await axiosInstance.post(endpoints.accounting.supplier_payments, {
        vendor: form.vendor,
        date: form.date,
        method: form.method,
        amount: totalAmount,
        notes,
        settlement_reference: form.settlement_reference,
      });

      toast.success('Money receipt created successfully');
      try {
        window.close();
      } catch {
        /* ignore */
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to create receipt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 960, mx: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          New Money Receipt
        </Typography>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : 'Submit Receipt'}
        </Button>
      </Stack>

      {/* Recipient Info */}
      <Card sx={{ mb: 3, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Recipient Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Vendor *</InputLabel>
                <Select value={form.vendor} label="Vendor *" onChange={handleVendorChange}>
                  {vendors.map((v) => (
                    <MenuItem key={v.id} value={v.id}>
                      {v.name || v.vendor_name || `Vendor #${v.id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Name"
                fullWidth
                value={form.vendor_name}
                onChange={handleChange('vendor_name')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Father's Name"
                fullWidth
                value={form.father_name}
                onChange={handleChange('father_name')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Mobile No."
                fullWidth
                value={form.mobile}
                onChange={handleChange('mobile')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                value={form.address}
                onChange={handleChange('address')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Type of Goods / Service"
                fullWidth
                value={form.type_of_goods}
                onChange={handleChange('type_of_goods')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date *"
                type="date"
                fullWidth
                value={form.date}
                onChange={handleChange('date')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={form.method}
                  label="Payment Method"
                  onChange={handleChange('method')}
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="mobile_banking">Mobile Banking</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Settlement Reference"
                fullWidth
                value={form.settlement_reference}
                onChange={handleChange('settlement_reference')}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Items */}
      <Card sx={{ mb: 3, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              Items
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={addItem}
            >
              Add Row
            </Button>
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, width: 110 }}>
                    Quantity
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, width: 130 }}>
                    Rate (৳)
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: 130 }}>
                    Amount (৳)
                  </TableCell>
                  <TableCell sx={{ width: 44 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {form.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={item.description}
                        onChange={handleItemChange(idx, 'description')}
                        placeholder="Description"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        type="number"
                        value={item.quantity}
                        onChange={handleItemChange(idx, 'quantity')}
                        sx={{ width: 90 }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        type="number"
                        value={item.rate}
                        onChange={handleItemChange(idx, 'rate')}
                        sx={{ width: 110 }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        ৳
                        {(item.quantity * item.rate).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeItem(idx)}
                        disabled={form.items.length === 1}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} align="right">
                    <Typography variant="subtitle2" fontWeight={700}>
                      Total
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight={700}>
                      ৳{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card sx={{ mb: 3, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Additional Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Amount in Words"
                fullWidth
                value={form.amount_in_words}
                onChange={handleChange('amount_in_words')}
                placeholder="e.g. Five Thousand Taka Only"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Payer's Signature / Name"
                fullWidth
                value={form.payer_signature}
                onChange={handleChange('payer_signature')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Receiver's Signature / Name"
                fullWidth
                value={form.receiver_signature}
                onChange={handleChange('receiver_signature')}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ textAlign: 'right' }}>
        <Button variant="contained" size="large" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : 'Submit Receipt'}
        </Button>
      </Box>
    </Box>
  );
}
