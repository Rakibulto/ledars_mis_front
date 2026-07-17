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
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';

import { usePaymentTermsApi } from './use-payment-terms-api';

const EMPTY_FORM = {
  code: '',
  name: '',
  due_days: 0,
  discount_days: 0,
  discount_percent: 0,
  installment_logic: '',
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
          (value ?? (
            <Typography variant="body2" fontWeight={500}>
              —
            </Typography>
          ))
        )}
      </Box>
    </Stack>
  );
}

export default function PaymentTermDetail() {
  const router = useRouter();
  const { id } = useParams();
  const workspace = usePaymentTermsApi();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const term = useMemo(
    () => workspace.paymentTerms.find((t) => String(t.id) === String(id)),
    [workspace.paymentTerms, id]
  );

  const handleOpenEditDialog = () => {
    setForm({
      code: term.code || '',
      name: term.name || '',
      due_days: term.dueDays ?? 0,
      discount_days: term.discountDays ?? 0,
      discount_percent: term.discountPercent ?? 0,
      installment_logic: term.installmentLogic || '',
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    try {
      await workspace.actions.updatePaymentTerm(term.id, form);
      setEditOpen(false);
      toast.success('Payment term updated');
    } catch (error) {
      toast.error(error?.message || 'Failed to update payment term');
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

  if (!term) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Payment term not found.
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
          Payment Terms
        </Typography>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {term.name}
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
            <Chip
              label={term.code}
              variant="outlined"
              sx={{ fontFamily: 'monospace', fontWeight: 700 }}
            />
            <Typography variant="h4" fontWeight={700}>
              {term.name}
            </Typography>
            <Chip
              label={term.active ? 'Active' : 'Inactive'}
              size="small"
              color={term.active ? 'success' : 'default'}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {term.settlementProfile}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handleOpenEditDialog}>
            Edit
          </Button>
          <Button
            variant="outlined"
            color={term.active ? 'error' : 'success'}
            onClick={() => workspace.actions.togglePaymentTermStatus(term.id)}
          >
            {term.active ? 'Disable' : 'Enable'}
          </Button>
        </Stack>
      </Stack>

      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Due Days
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {term.dueDays}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                days from invoice
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Discount Days
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {term.discountDays}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                early payment window
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Discount Rate
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {term.discountPercent > 0 ? `${term.discountPercent}%` : 'None'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                early payment incentive
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Reminder Cadence
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {term.reminderCadence}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Term Identity"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            />
            <Divider />
            <CardContent sx={{ pt: 0 }}>
              <DetailRow label="ID" value={term.id} />
              <DetailRow label="Code" value={term.code} />
              <DetailRow label="Name" value={term.name} />
              <DetailRow label="Due Days" value={`${term.dueDays} days`} />
              <DetailRow label="Discount Days" value={`${term.discountDays} days`} />
              <DetailRow
                label="Discount %"
                value={term.discountPercent > 0 ? `${term.discountPercent}%` : 'No discount'}
              />
              <DetailRow
                label="Status"
                value={
                  <Chip
                    label={term.active ? 'Active' : 'Inactive'}
                    size="small"
                    color={term.active ? 'success' : 'default'}
                  />
                }
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Settlement & Policies"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            />
            <Divider />
            <CardContent sx={{ pt: 0 }}>
              <DetailRow label="Settlement Profile" value={term.settlementProfile} />
              <DetailRow label="Installment Logic" value={term.installmentLogic} />
              <DetailRow label="Early Payment Model" value={term.earlyPaymentModel} />
              <DetailRow label="Reminder Cadence" value={term.reminderCadence} />
              <DetailRow label="Approval Window" value={term.approvalWindow} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit payment term</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Code" value={form.code} disabled fullWidth />
            <TextField
              label="Name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Due days"
              type="number"
              value={form.due_days}
              onChange={(event) =>
                setForm((current) => ({ ...current, due_days: Number(event.target.value) }))
              }
              fullWidth
            />
            <TextField
              label="Discount days"
              type="number"
              value={form.discount_days}
              onChange={(event) =>
                setForm((current) => ({ ...current, discount_days: Number(event.target.value) }))
              }
              fullWidth
            />
            <TextField
              label="Discount percent"
              type="number"
              value={form.discount_percent}
              onChange={(event) =>
                setForm((current) => ({ ...current, discount_percent: Number(event.target.value) }))
              }
              fullWidth
            />
            <TextField
              label="Installment logic"
              value={form.installment_logic}
              disabled
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
