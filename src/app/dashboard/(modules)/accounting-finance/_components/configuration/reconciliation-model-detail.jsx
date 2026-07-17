'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
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

import { useReconciliationModelsApi } from './use-reconciliation-models-api';

const EMPTY_FORM = {
  name: '', type: 'suggestion', match_label: '', match_journal: '',
  account: '', tax: '', amount_rule: '', text_rule: '', change_version: '', auto_validate: false,
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

export default function ReconciliationModelDetail() {
  const router = useRouter();
  const { id } = useParams();
  const workspace = useReconciliationModelsApi();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const model = useMemo(
    () => workspace.reconciliationModels.find((item) => String(item.id) === String(id)),
    [workspace.reconciliationModels, id]
  );

  const handleOpenEditDialog = () => {
    setForm({
      name: model?.name || '',
      type: model?.type || 'suggestion',
      match_label: model?.match_label || '',
      match_journal: model?.match_journal || '',
      account: model?.account || '',
      tax: model?.tax || '',
      amount_rule: model?.amount_rule || '',
      text_rule: model?.text_rule || '',
      change_version: model?.change_version || '',
      auto_validate: model?.auto_validate || false,
    });
    setOpen(true);
  };

  const saveModel = async () => {
    if (!form.name.trim()) {
      toast.error('Model name is required');
      return;
    }
    setSubmitting(true);
    try {
      await workspace.actions.updateReconciliationModel(id, form);
      toast.success('Reconciliation model updated');
      setOpen(false);
    } catch (error) {
      toast.error(error?.message || 'Failed to update reconciliation model');
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

  if (!model) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Reconciliation model not found.
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

  const typeColor =
    model.type === 'writeoff' ? '#ef4444' : model.type === 'suggestion' ? '#2563eb' : '#6b7280';

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
          Reconciliation Models
        </Typography>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {model.name}
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
            <Typography variant="h4" fontWeight={700}>
              {model.name}
            </Typography>
            <Chip
              label={model.type}
              sx={{
                bgcolor: `${typeColor}15`,
                color: typeColor,
                fontWeight: 700,
                textTransform: 'capitalize',
              }}
            />
            <Chip
              label={model.active ? 'Active' : 'Inactive'}
              size="small"
              color={model.active ? 'success' : 'default'}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {model.matchStrategy}
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
            color={model.active ? 'error' : 'success'}
            onClick={() => workspace.actions.toggleReconciliationModelStatus(model.id)}
          >
            {model.active ? 'Disable' : 'Enable'}
          </Button>
        </Stack>
      </Stack>

      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Rule Coverage
              </Typography>
              <Typography variant="h6" fontWeight={800} sx={{ mt: 0.5 }}>
                {model.ruleCoverage}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Matching scope
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Auto Validate
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={model.auto_validate ? 'Enabled' : 'Disabled'}
                  color={model.auto_validate ? 'success' : 'default'}
                  sx={{ fontWeight: 700 }}
                />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                Auto clearing capability
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Version
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                {model.changeVersion || '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Rule revision
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
                Matching Rules
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <DetailRow label="Match Journal" value={model.match_journal || '—'} />
              <DetailRow label="Match Label Contains" value={model.match_label || '—'} />
              <DetailRow label="Amount Rule" value={model.amountRule} />
              <DetailRow label="Text Rule" value={model.textRule} />
              <DetailRow label="Match Strategy" value={model.matchStrategy} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Counterpart & Governance
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <DetailRow label="Counterpart Default" value={model.counterpartDefault} />
              <DetailRow label="Account" value={model.account || '—'} />
              <DetailRow label="Rule Coverage" value={model.ruleCoverage} />
              <DetailRow label="Change Version" value={model.changeVersion || '—'} />
              <DetailRow
                label="Type"
                value={
                  <Chip
                    label={model.type}
                    size="small"
                    color={
                      model.type === 'writeoff'
                        ? 'error'
                        : model.type === 'suggestion'
                          ? 'info'
                          : 'default'
                    }
                    sx={{ textTransform: 'capitalize' }}
                  />
                }
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog
        open={open}
        onClose={() => { setOpen(false); setForm(EMPTY_FORM); }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Reconciliation Model</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Type"
                value={form.type}
                onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))}
              >
                <MenuItem value="writeoff">Write-off</MenuItem>
                <MenuItem value="suggestion">Suggestion</MenuItem>
                <MenuItem value="manual">Manual</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Match Label Contains"
                value={form.match_label}
                onChange={(e) => setForm((c) => ({ ...c, match_label: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Match Journal"
                value={form.match_journal}
                onChange={(e) => setForm((c) => ({ ...c, match_journal: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Counterpart Account"
                value={form.account}
                onChange={(e) => setForm((c) => ({ ...c, account: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Tax"
                value={form.tax}
                onChange={(e) => setForm((c) => ({ ...c, tax: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Amount Rule"
                value={form.amount_rule}
                onChange={(e) => setForm((c) => ({ ...c, amount_rule: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Text Rule"
                value={form.text_rule}
                onChange={(e) => setForm((c) => ({ ...c, text_rule: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Version"
                value={form.change_version}
                onChange={(e) => setForm((c) => ({ ...c, change_version: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button
                variant={form.auto_validate ? 'contained' : 'outlined'}
                onClick={() => setForm((c) => ({ ...c, auto_validate: !c.auto_validate }))}
              >
                {form.auto_validate ? 'Auto validate enabled' : 'Enable auto validate'}
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); setForm(EMPTY_FORM); }}>Cancel</Button>
          <Button variant="contained" onClick={saveModel} disabled={submitting}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}