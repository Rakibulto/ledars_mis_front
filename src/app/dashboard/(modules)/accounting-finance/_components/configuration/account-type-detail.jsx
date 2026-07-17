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
import CardHeader from '@mui/material/CardHeader';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { Iconify } from 'src/components/iconify';

import { useAccountTypesApi } from './use-account-types-api';

// ── Small helper ─────────────────────────────────────────────
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
          (value ?? '—')
        )}
      </Box>
    </Stack>
  );
}

export default function AccountTypeDetail() {
  const router = useRouter();
  const { id } = useParams();
  const workspace = useAccountTypesApi();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    classification: 'asset',
  });

  const type = useMemo(
    () => workspace.accountTypes.find((t) => String(t.id) === String(id)),
    [workspace.accountTypes, id]
  );

  const handleOpenEditDialog = () => {
    setForm({
      name: type.name || '',
      classification: type.classification || 'asset',
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    try {
      await workspace.actions.updateAccountType(type.id, form);
      setEditOpen(false);
      toast.success('Account type updated');
    } catch (error) {
      toast.error(error?.message || 'Failed to update account type');
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

  if (!type) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Account type not found.
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
      {/* Header */}
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
          Account Types
        </Typography>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {type.name}
        </Typography>
      </Stack>

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
              label={type.code}
              color="primary"
              sx={{ fontWeight: 700, fontFamily: 'monospace' }}
            />
            <Typography variant="h4" fontWeight={700}>
              {type.name}
            </Typography>
            <Chip
              label={type.active ? 'Active' : 'Inactive'}
              size="small"
              color={type.active ? 'success' : 'default'}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {type.defaultPolicy}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handleOpenEditDialog}>
            Edit
          </Button>
          <Button
            variant="outlined"
            color={type.active ? 'error' : 'success'}
            onClick={() => workspace.actions.toggleAccountTypeStatus(type.id)}
          >
            {type.active ? 'Disable' : 'Enable'}
          </Button>
        </Stack>
      </Stack>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Account Type</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Name"
              value={form.name}
              fullWidth
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <TextField
              label="Classification"
              select
              value={form.classification}
              fullWidth
              onChange={(event) =>
                setForm((prev) => ({ ...prev, classification: event.target.value }))
              }
            >
              <MenuItem value="asset">Asset</MenuItem>
              <MenuItem value="liability">Liability</MenuItem>
              <MenuItem value="equity">Equity</MenuItem>
              <MenuItem value="income">Income</MenuItem>
              <MenuItem value="expense">Expense</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate}>
            Save changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Mapped Accounts
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                {type.mappedAccountCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {type.postingMode}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Category
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ textTransform: 'capitalize' }}>
                {type.category === 'balance_sheet' ? 'Balance Sheet' : 'Profit & Loss'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {type.categoryBehavior}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Control Owner
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ fontSize: '1.1rem' }}>
                {type.controlOwner}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Oversight responsibility
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Classification & Identity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Classification & Identity"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            />
            <Divider />
            <CardContent sx={{ pt: 0 }}>
              <DetailRow label="ID" value={type.id} />
              <DetailRow label="Name" value={type.name} />
              <DetailRow label="Code" value={type.code} />
              <DetailRow
                label="Classification (Nature)"
                value={
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {type.nature}
                  </Typography>
                }
              />
              <DetailRow
                label="Category"
                value={type.category === 'balance_sheet' ? 'Balance Sheet' : 'Profit & Loss'}
              />
              <DetailRow
                label="Status"
                value={
                  <Chip
                    label={type.active ? 'Active' : 'Inactive'}
                    size="small"
                    color={type.active ? 'success' : 'default'}
                  />
                }
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Posting & Governance */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Posting & Governance"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            />
            <Divider />
            <CardContent sx={{ pt: 0 }}>
              <DetailRow label="Posting Mode" value={type.postingMode} />
              <DetailRow label="Close Behavior" value={type.closeBehavior} />
              <DetailRow label="Mapping Rule" value={type.mappingRule} />
              <DetailRow label="Category Behavior" value={type.categoryBehavior} />
              <DetailRow label="Default Policy" value={type.defaultPolicy} />
              <DetailRow label="Control Owner" value={type.controlOwner} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
