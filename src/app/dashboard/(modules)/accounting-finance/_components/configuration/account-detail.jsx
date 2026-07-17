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

import { formatCurrency } from '../utils';
import { useChartOfAccountsApi } from './use-chart-of-accounts-api';

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

const BAND_COLORS = { 'High exposure': 'error', Monitored: 'warning', Routine: 'default' };

export default function AccountDetail() {
  const router = useRouter();
  const { id } = useParams();
  const workspace = useChartOfAccountsApi();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    type_id: '',
    reconcile: false,
    parent_id: '',
  });

  const account = useMemo(
    () => workspace.accounts.find((a) => String(a.id) === String(id)),
    [workspace.accounts, id]
  );

  const handleOpenEditDialog = () => {
    setForm({
      code: account.code || '',
      name: account.name || '',
      type_id: account.type_id ? String(account.type_id) : '',
      reconcile: Boolean(account.reconcile),
      parent_id: account.parent ? String(account.parent) : '',
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    try {
      await workspace.actions.updateAccount(account.id, form);
      setEditOpen(false);
      toast.success('Account updated');
    } catch (error) {
      toast.error(error?.message || 'Failed to update account');
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

  if (!account) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Account not found.
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

  const balance = Number(account.balance || 0);

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
          Chart of Accounts
        </Typography>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {account.code} · {account.name}
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
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              {account.code}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {account.name}
            </Typography>
            <Chip
              label={account.archived ? 'Archived' : account.active ? 'Active' : 'Inactive'}
              size="small"
              color={account.archived ? 'warning' : account.active ? 'success' : 'default'}
            />
            {account.archiveCandidate && (
              <Chip label="Archive Candidate" size="small" color="warning" variant="outlined" />
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {account.reportingRole}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" onClick={handleOpenEditDialog}>
            Edit
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => workspace.actions.toggleAccountStatus(account.id)}
          >
            {account.active ? 'Disable' : 'Enable'}
          </Button>
          {!account.archived && (
            <Button
              variant="text"
              color="warning"
              onClick={() => workspace.actions.archiveAccount(account.id)}
            >
              Archive
            </Button>
          )}
        </Stack>
      </Stack>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Account</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Account Code"
              value={form.code}
              fullWidth
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
            />
            <TextField
              label="Account Name"
              value={form.name}
              fullWidth
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <TextField
              label="Account Type"
              select
              value={form.type_id}
              fullWidth
              onChange={(event) => setForm((prev) => ({ ...prev, type_id: event.target.value }))}
            >
              {workspace.accountTypes.map((typeOption) => (
                <MenuItem key={typeOption.id} value={String(typeOption.id)}>
                  {typeOption.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Reconciliable"
              select
              value={form.reconcile ? 'yes' : 'no'}
              fullWidth
              onChange={(event) =>
                setForm((prev) => ({ ...prev, reconcile: event.target.value === 'yes' }))
              }
            >
              <MenuItem value="yes">Yes</MenuItem>
              <MenuItem value="no">No</MenuItem>
            </TextField>
            <TextField
              label="Parent Account"
              select
              value={form.parent_id}
              fullWidth
              onChange={(event) => setForm((prev) => ({ ...prev, parent_id: event.target.value }))}
            >
              <MenuItem value="">None</MenuItem>
              {workspace.accounts
                .filter((a) => String(a.id) !== String(account.id))
                .map((parent) => (
                  <MenuItem key={parent.id} value={String(parent.id)}>
                    {parent.code} · {parent.name}
                  </MenuItem>
                ))}
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

      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Current Balance
              </Typography>
              <Typography
                variant="h5"
                fontWeight={800}
                color={balance < 0 ? 'error.main' : 'text.primary'}
              >
                {formatCurrency(Math.abs(balance))}
                {balance < 0 ? ' (Cr)' : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Control Band
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={account.controlBand}
                  color={BAND_COLORS[account.controlBand] || 'default'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Account Type
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {account.typeName}
              </Typography>
              <Chip
                label={account.category === 'balance_sheet' ? 'Balance Sheet' : 'Profit & Loss'}
                size="small"
                color={account.category === 'balance_sheet' ? 'info' : 'success'}
                sx={{ mt: 0.5 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Hierarchy
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                Parent: {account.parentCode}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {account.numberingScheme}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Account Identity"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            />
            <Divider />
            <CardContent sx={{ pt: 0 }}>
              <DetailRow label="ID" value={account.id} />
              <DetailRow label="Code" value={account.code} />
              <DetailRow label="Name" value={account.name} />
              <DetailRow label="Account Type" value={account.typeName} />
              <DetailRow
                label="Category"
                value={account.category === 'balance_sheet' ? 'Balance Sheet' : 'Profit & Loss'}
              />
              <DetailRow
                label="Reconcilable"
                value={
                  <Chip
                    label={account.reconcile ? 'Yes' : 'No'}
                    size="small"
                    color={account.reconcile ? 'info' : 'default'}
                  />
                }
              />
              <DetailRow
                label="Status"
                value={
                  <Chip
                    label={account.archived ? 'Archived' : account.active ? 'Active' : 'Inactive'}
                    size="small"
                    color={account.archived ? 'warning' : account.active ? 'success' : 'default'}
                  />
                }
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Mapping & Governance"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            />
            <Divider />
            <CardContent sx={{ pt: 0 }}>
              <DetailRow
                label="Balance"
                value={`${formatCurrency(Math.abs(balance))}${balance < 0 ? ' (Cr)' : ''}`}
              />
              <DetailRow
                label="Control Band"
                value={
                  <Chip
                    label={account.controlBand}
                    size="small"
                    color={BAND_COLORS[account.controlBand] || 'default'}
                  />
                }
              />
              <DetailRow label="Reporting Role" value={account.reportingRole} />
              <DetailRow label="Default Mappings" value={account.defaultMappings} />
              <DetailRow label="Posting Restriction" value={account.postingRestriction} />
              <DetailRow label="Numbering Scheme" value={account.numberingScheme} />
              <DetailRow label="Usage Analytics" value={account.usageAnalytics} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
