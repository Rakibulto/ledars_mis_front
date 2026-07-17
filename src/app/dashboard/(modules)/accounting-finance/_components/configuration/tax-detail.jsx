'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';
import { toast } from 'sonner';

import { useTaxesApi } from './use-taxes-api';

const TAX_TYPE_COLORS = {
  withholding: '#f59e0b',
  input: '#2563eb',
  output: '#16a34a',
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

export default function TaxDetail() {
  const router = useRouter();
  const { id } = useParams();
  const workspace = useTaxesApi();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    rate: 0,
    scope: '',
    tax_type: 'percentage',
  });

  const tax = useMemo(
    () => workspace.taxes.find((t) => String(t.id) === String(id)),
    [workspace.taxes, id]
  );

  const handleOpenEditDialog = () => {
    setForm({
      code: tax.code || '',
      name: tax.name || '',
      rate: tax.rate ?? 0,
      scope: tax.scope || tax.type || '',
      tax_type: tax.tax_type || 'percentage',
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    try {
      await workspace.actions.updateTax(tax.id, form);
      setEditOpen(false);
      toast.success('Tax rule updated');
    } catch (error) {
      toast.error(error?.message || 'Failed to update tax rule');
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

  if (!tax) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Tax rule not found.
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

  const chipColor = TAX_TYPE_COLORS[tax.tax_type] || '#6b7280';

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
          Taxes / VAT
        </Typography>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {tax.name}
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
              {tax.code}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {tax.name}
            </Typography>
            <Chip
              label={tax.active ? 'Active' : 'Inactive'}
              size="small"
              color={tax.active ? 'success' : 'default'}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {tax.usageScope}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handleOpenEditDialog}>
            Edit
          </Button>
          <Button
            variant="outlined"
            color={tax.active ? 'error' : 'success'}
            onClick={() => workspace.actions.toggleTaxStatus(tax.id)}
          >
            {tax.active ? 'Disable' : 'Enable'}
          </Button>
        </Stack>
      </Stack>

      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Rate
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {tax.rate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {tax.rateModel}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                VAT Direction
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={tax.tax_type}
                  sx={{
                    bgcolor: `${chipColor}15`,
                    color: chipColor,
                    fontWeight: 700,
                    textTransform: 'capitalize',
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                {tax.reportingBox}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Settlement Account
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {tax.settlementAccount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Posting target
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Tax Identity"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            />
            <Divider />
            <CardContent sx={{ pt: 0 }}>
              <DetailRow label="ID" value={tax.id} />
              <DetailRow label="Code" value={tax.code} />
              <DetailRow label="Name" value={tax.name} />
              <DetailRow label="Rate" value={`${tax.rate}%`} />
              <DetailRow
                label="Computation"
                value={tax.tax_type === 'fixed' ? 'Fixed Amount' : 'Percentage'}
              />
              <DetailRow
                label="Scope"
                value={<Chip label={tax.type} size="small" sx={{ textTransform: 'capitalize' }} />}
              />
              <DetailRow
                label="Status"
                value={
                  <Chip
                    label={tax.active ? 'Active' : 'Inactive'}
                    size="small"
                    color={tax.active ? 'success' : 'default'}
                  />
                }
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Reporting & Settlement"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            />
            <Divider />
            <CardContent sx={{ pt: 0 }}>
              <DetailRow label="VAT Direction" value={tax.tax_type} />
              <DetailRow label="Reporting Box" value={tax.reportingBox} />
              <DetailRow label="Settlement Account" value={tax.settlementAccount} />
              <DetailRow label="Usage Scope" value={tax.usageScope} />
              <DetailRow label="Reporting Tags" value={tax.reportingTags} />
              <DetailRow label="Rate Model" value={tax.rateModel} />
              <DetailRow label="Multi-Rate Logic" value={tax.multiRateLogic} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit tax rule</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Code"
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Rate"
              type="number"
              value={form.rate}
              onChange={(event) =>
                setForm((current) => ({ ...current, rate: Number(event.target.value) }))
              }
              fullWidth
            />
            <TextField
              label="Scope"
              value={form.scope}
              onChange={(event) => setForm((current) => ({ ...current, scope: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Tax type"
              value={form.tax_type}
              onChange={(event) => setForm((current) => ({ ...current, tax_type: event.target.value }))}
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
