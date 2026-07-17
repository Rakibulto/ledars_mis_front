'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
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

import { useJournalsApi } from './use-journals-api';

const TYPE_COLORS = {
  sale: '#22c55e',
  sales: '#22c55e',
  purchase: '#f59e0b',
  cash: '#3b82f6',
  bank: '#8b5cf6',
  general: '#6b7280',
};
const TYPE_ICONS = {
  sale: 'solar:cart-large-bold-duotone',
  sales: 'solar:cart-large-bold-duotone',
  purchase: 'solar:bag-bold-duotone',
  cash: 'solar:wallet-bold-duotone',
  bank: 'solar:safe-square-bold-duotone',
  general: 'solar:document-bold-duotone',
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

export default function JournalDetail() {
  const router = useRouter();
  const { id } = useParams();
  const workspace = useJournalsApi();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    journal_type: 'general',
    sequence_prefix: '',
    default_debit_account: '',
    default_credit_account: '',
  });

  const journal = useMemo(
    () => workspace.journals.find((j) => String(j.id) === String(id)),
    [workspace.journals, id]
  );

  const handleOpenEditDialog = () => {
    setForm({
      name: journal.name || '',
      journal_type: journal.type || journal.journal_type || 'general',
      sequence_prefix: journal.sequence_prefix || journal.sequencePolicy || '',
      default_debit_account: journal.default_debit_account || '',
      default_credit_account: journal.default_credit_account || '',
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    try {
      await workspace.actions.updateJournal(journal.id, form);
      setEditOpen(false);
      toast.success('Journal updated');
    } catch (error) {
      toast.error(error?.message || 'Failed to update journal');
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

  if (!journal) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Journal not found.
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

  const color = TYPE_COLORS[journal.type] || '#6b7280';
  const icon = TYPE_ICONS[journal.type] || 'solar:document-bold-duotone';

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
          Journals
        </Typography>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {journal.name}
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
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: `${color}20`, color, width: 52, height: 52 }}>
            <Iconify icon={icon} width={28} />
          </Avatar>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="h4" fontWeight={700}>
                {journal.name}
              </Typography>
              <Chip
                label={journal.code}
                sx={{ fontFamily: 'monospace', fontWeight: 700 }}
                size="small"
              />
              <Chip
                label={journal.active ? 'Active' : 'Inactive'}
                size="small"
                color={journal.active ? 'success' : 'default'}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {journal.reviewPolicy}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handleOpenEditDialog}>
            Edit
          </Button>
          <Button
            variant="outlined"
            color={journal.active ? 'error' : 'success'}
            onClick={() => workspace.actions.toggleJournalStatus(journal.id)}
          >
            {journal.active ? 'Disable' : 'Enable'}
          </Button>
        </Stack>
      </Stack>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Journal</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Name"
              value={form.name}
              fullWidth
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <TextField
              label="Journal Type"
              select
              value={form.journal_type}
              fullWidth
              onChange={(event) =>
                setForm((prev) => ({ ...prev, journal_type: event.target.value }))
              }
            >
              <MenuItem value="general">General</MenuItem>
              <MenuItem value="sale">Sales</MenuItem>
              <MenuItem value="purchase">Purchase</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="bank">Bank</MenuItem>
            </TextField>
            <TextField
              label="Sequence Prefix"
              value={form.sequence_prefix}
              fullWidth
              onChange={(event) =>
                setForm((prev) => ({ ...prev, sequence_prefix: event.target.value }))
              }
            />
            <TextField
              label="Default Debit Account"
              select
              value={form.default_debit_account}
              fullWidth
              onChange={(event) =>
                setForm((prev) => ({ ...prev, default_debit_account: event.target.value }))
              }
            >
              <MenuItem value="">None</MenuItem>
              {workspace.accountsList.map((account) => (
                <MenuItem key={account.id} value={String(account.id)}>
                  {account.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Default Credit Account"
              select
              value={form.default_credit_account}
              fullWidth
              onChange={(event) =>
                setForm((prev) => ({ ...prev, default_credit_account: event.target.value }))
              }
            >
              <MenuItem value="">None</MenuItem>
              {workspace.accountsList.map((account) => (
                <MenuItem key={account.id} value={String(account.id)}>
                  {account.name}
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
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3, borderTop: `3px solid ${color}` }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Type
              </Typography>
              <Chip
                label={journal.type}
                sx={{
                  display: 'flex',
                  mt: 0.5,
                  textTransform: 'capitalize',
                  bgcolor: `${color}15`,
                  color,
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Posting Queue
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                {journal.postingQueue}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                pending entries
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Default Debit
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {journal.defaultDebitName}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Default Credit
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {journal.defaultCreditName}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Journal Identity"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            />
            <Divider />
            <CardContent sx={{ pt: 0 }}>
              <DetailRow label="ID" value={journal.id} />
              <DetailRow label="Code" value={journal.code} />
              <DetailRow label="Name" value={journal.name} />
              <DetailRow
                label="Type"
                value={
                  <Chip
                    label={journal.type}
                    size="small"
                    sx={{ textTransform: 'capitalize', bgcolor: `${color}15`, color }}
                  />
                }
              />
              <DetailRow
                label="Status"
                value={
                  <Chip
                    label={journal.active ? 'Active' : 'Inactive'}
                    size="small"
                    color={journal.active ? 'success' : 'default'}
                  />
                }
              />
              <DetailRow label="Sequence Prefix" value={journal.sequence_prefix || '—'} />
              <DetailRow label="Sequence Policy" value={journal.sequencePolicy} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Posting & Routing"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            />
            <Divider />
            <CardContent sx={{ pt: 0 }}>
              <DetailRow label="Default Debit Account" value={journal.defaultDebitName} />
              <DetailRow label="Default Credit Account" value={journal.defaultCreditName} />
              <DetailRow label="Suspense Account" value={journal.suspenseAccount} />
              <DetailRow label="Profit/Loss Account" value={journal.profitAccount} />
              <DetailRow label="Period Access" value={journal.periodAccess} />
              <DetailRow label="Review Policy" value={journal.reviewPolicy} />
              <DetailRow label="Last Entry Date" value={journal.lastEntryDate} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
