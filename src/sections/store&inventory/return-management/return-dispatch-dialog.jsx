'use client';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useState } from 'react';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Box,
  Grid,
  Stack,
  Button,
  Dialog,
  Divider,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { extractErrorMessage } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const EP = endpoints.storeInventory;

const EMPTY_FORM = {
  transport_person: '',
  transport_phone: '',
  transport_address: '',
  vehicle_number: '',
  dispatch_date: null,
  dispatch_remarks: '',
};

export default function ReturnDispatchDialog({ open, returnDoc, onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isValid =
    form.transport_person.trim() &&
    form.transport_phone.trim() &&
    form.transport_address.trim() &&
    form.dispatch_date &&
    dayjs(form.dispatch_date).isValid();

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      const payload = {
        transport_person: form.transport_person.trim(),
        transport_phone: form.transport_phone.trim(),
        transport_address: form.transport_address.trim(),
        dispatch_date: dayjs(form.dispatch_date).format('YYYY-MM-DD'),
        ...(form.vehicle_number.trim() && { vehicle_number: form.vehicle_number.trim() }),
        ...(form.dispatch_remarks.trim() && { dispatch_remarks: form.dispatch_remarks.trim() }),
      };
      await axiosInstance.post(EP.return_management_dispatch(returnDoc.id), payload);
      toast.success(`Return ${returnDoc.return_number} dispatched successfully.`);
      setForm(EMPTY_FORM);
      onSuccess?.();
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err) || 'Failed to dispatch return.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setForm(EMPTY_FORM);
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Iconify icon="solar:delivery-bold-duotone" width={24} sx={{ color: 'info.main' }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Dispatch Return
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {returnDoc?.return_number}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={handleClose} disabled={submitting}>
            <Iconify icon="solar:close-circle-bold" width={20} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter the transportation details for this shipment. These details will appear on the
          Release Note PDF.
        </Typography>

        <Grid container spacing={2}>
          {/* Transport Person */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              size="small"
              label="Transport Person / Courier Name"
              name="transport_person"
              value={form.transport_person}
              onChange={handleChange}
              placeholder="e.g. Abdul Karim / DHL"
            />
          </Grid>

          {/* Phone Number */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              size="small"
              label="Phone Number"
              name="transport_phone"
              value={form.transport_phone}
              onChange={handleChange}
              placeholder="e.g. 01700-000000"
            />
          </Grid>

          {/* Address */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              required
              size="small"
              label="Address"
              name="transport_address"
              value={form.transport_address}
              onChange={handleChange}
              placeholder="Transport person or courier address"
              multiline
              minRows={2}
            />
          </Grid>

          {/* Dispatch Date */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              label="Dispatch Date"
              value={form.dispatch_date}
              onChange={(newValue) => setForm((prev) => ({ ...prev, dispatch_date: newValue }))}
              format="DD/MM/YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  size: 'small',
                },
              }}
            />
          </Grid>

          {/* Vehicle Number (optional) */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Vehicle Number (optional)"
              name="vehicle_number"
              value={form.vehicle_number}
              onChange={handleChange}
              placeholder="e.g. Dhaka Metro GA-1234"
            />
          </Grid>

          {/* Remarks (optional) */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label="Remarks (optional)"
              name="dispatch_remarks"
              value={form.dispatch_remarks}
              onChange={handleChange}
              placeholder="Any additional notes about this dispatch"
              multiline
              minRows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="info"
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          startIcon={submitting ? null : <Iconify icon="solar:delivery-bold-duotone" width={16} />}
        >
          {submitting ? 'Confirming…' : 'Confirm Transit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
