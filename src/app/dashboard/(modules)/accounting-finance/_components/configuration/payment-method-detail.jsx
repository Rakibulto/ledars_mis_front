'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';

import { usePaymentMethodsApi } from './use-payment-methods-api';

const EMPTY_FORM = {
  name: '',
  code: '',
  type: 'inbound',
  payment_flow: '',
  journal: '',
  settlement_days: 0,
  bank_export_config: '',
  behavior_chain: '',
};

function DetailRow({ label, value }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={2}
      sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180 }}>
        {label}
      </Typography>
      <Box textAlign="right">
        {typeof value === 'string' || typeof value === 'number' ? (
          <Typography variant="body2" fontWeight={500}>
            {value ?? '—'}
          </Typography>
        ) : (
          value
        )}
      </Box>
    </Stack>
  );
}

export default function PaymentMethodDetail() {
  const router = useRouter();
  const { id } = useParams();
  const workspace = usePaymentMethodsApi();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const method = useMemo(
    () => workspace.paymentMethods.find((item) => String(item.id) === String(id)),
    [workspace.paymentMethods, id]
  );

  const handleOpenEditDialog = () => {
    setForm({
      name: method?.name || '',
      code: method?.code || '',
      type: method?.type || 'inbound',
      payment_flow: method?.payment_flow || '',
      journal: method?.journal || '',
      settlement_days: method?.settlement_days ?? 0,
      bank_export_config: method?.bank_export_config || method?.bankExportConfig || '',
      behavior_chain: method?.behavior_chain || method?.behaviorChain || '',
    });
    setOpen(true);
  };

  const saveMethod = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and code are required');
      return;
    }
    setSubmitting(true);
    try {
      await workspace.actions.updatePaymentMethod(id, form);
      toast.success('Payment method updated');
      setOpen(false);
    } catch (error) {
      toast.error(error?.message || 'Failed to update payment method');
    } finally {
      setSubmitting(false);
    }
  };

  if (workspace.loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!method) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Payment method not found.
        </Typography>
        <Button
          sx={{ mt: 2 }}
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
          onClick={() => router.back()}
        >
          Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Payment Methods
        </Typography>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {method.name}
        </Typography>
      </Stack>

      {/* Title row */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 700,
                bgcolor: 'action.hover',
                px: 1,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              {method.code}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {method.name}
            </Typography>
            <Chip
              label={method.type}
              size="small"
              color={method.type === 'inbound' ? 'success' : 'warning'}
              sx={{ textTransform: 'capitalize' }}
            />
            <Chip
              label={method.active ? 'Active' : 'Inactive'}
              size="small"
              color={method.active ? 'success' : 'default'}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {method.defaultBehavior}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:pen-bold" />}
            onClick={handleOpenEditDialog}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color={method.active ? 'error' : 'success'}
            onClick={() => workspace.actions.togglePaymentMethodStatus(method.id)}
          >
            {method.active ? 'Disable' : 'Enable'}
          </Button>
        </Stack>
      </Stack>

      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Settlement Days
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {method.settlement_days ?? '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Clearing timeline
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Payment Flow
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                {method.payment_flow || '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Collection/disbursement route
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Journal
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                {method.journal || '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Posting target
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detail cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Settlement & Flow
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <DetailRow label="Method Code" value={method.code} />
              <DetailRow label="Direction" value={method.type} />
              <DetailRow label="Payment Flow" value={method.payment_flow || '—'} />
              <DetailRow label="Journal" value={method.journal || '—'} />
              <DetailRow label="Settlement Days" value={`${method.settlement_days ?? 0} day(s)`} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Export & Behavior
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <DetailRow label="Default Behavior" value={method.defaultBehavior} />
              <DetailRow label="Fee Rule" value={method.feeRule} />
              <DetailRow label="Export Profile" value={method.exportProfile} />
              <DetailRow label="Bank Export Config" value={method.bankExportConfig} />
              <DetailRow label="Behavior Chain" value={method.behaviorChain} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setForm(EMPTY_FORM);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Payment Method</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Code"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Type"
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value }))
                }
              >
                <MenuItem value="inbound">Inbound</MenuItem>
                <MenuItem value="outbound">Outbound</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Payment Flow"
                value={form.payment_flow}
                onChange={(event) =>
                  setForm((current) => ({ ...current, payment_flow: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Journal"
                value={form.journal}
                onChange={(event) =>
                  setForm((current) => ({ ...current, journal: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Settlement Days"
                value={form.settlement_days}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    settlement_days: Number(event.target.value),
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Bank Export Config"
                value={form.bank_export_config}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bank_export_config: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Behavior Chain"
                value={form.behavior_chain}
                onChange={(event) =>
                  setForm((current) => ({ ...current, behavior_chain: event.target.value }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
              setForm(EMPTY_FORM);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={saveMethod} disabled={submitting}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
