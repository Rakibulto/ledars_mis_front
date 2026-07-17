'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

import { Iconify } from 'src/components/iconify';

import { useJournalsApi } from './use-journals-api';
import { CoreLedgerConfigToolbar } from './core-ledger-config-toolbar';

const BASE_PATH = '/dashboard/accounting-finance/configuration/journals';

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

const EMPTY_FORM = {
  name: '',
  journal_type: 'general', // backend field name
  sequence_prefix: '', // backend field name
  default_debit_account: '',
  default_credit_account: '',
};

export default function JournalsList() {
  const workspace = useJournalsApi();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Code</th>
          <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Name</th>
          <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Type</th>
          <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>
            Default Dr
          </th>
          <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>
            Default Cr
          </th>
          <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>
            Posting Queue
          </th>
          <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>
            Sequence
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.journals.map((j) => (
          <tr key={j.id}>
            <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{j.code}</td>
            <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{j.name}</td>
            <td
              style={{ padding: 8, borderBottom: '1px solid #f0f0f0', textTransform: 'capitalize' }}
            >
              {j.type}
            </td>
            <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{j.defaultDebitName}</td>
            <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{j.defaultCreditName}</td>
            <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{j.postingQueue}</td>
            <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{j.sequencePolicy}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      if (editTarget) {
        await workspace.actions.updateJournal(editTarget.id, form);
        toast.success('Journal updated');
      } else {
        await workspace.actions.createJournal(form);
        toast.success('Journal created');
      }
      setOpen(false);
      setEditTarget(null);
      setForm(EMPTY_FORM);
    } catch {
      toast.error('Failed to save journal');
    }
  };

  const handleOpenEditDialog = (journal) => {
    setEditTarget(journal);
    setForm({
      name: journal.name || '',
      journal_type: journal.type || journal.journal_type || 'general',
      sequence_prefix: journal.sequence_prefix || journal.sequencePolicy || '',
      default_debit_account: journal.default_debit_account || '',
      default_credit_account: journal.default_credit_account || '',
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      await workspace.actions.deleteJournal(deleteTarget.id);
      toast.success('Journal deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete journal');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <CoreLedgerConfigToolbar printTitle="Journals" printContent={printContent} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Journals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage posting journals, queue posture, and default routing controls.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setOpen(true)}
        >
          New Journal
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Active journals
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="h5" fontWeight={800}>
                  {workspace.overview.activeJournals}
                </Typography>
                <LibraryBooksIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Posting queue
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="h5" fontWeight={800}>
                  {workspace.overview.postingQueue}
                </Typography>
                <PendingActionsIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Sequenced journals
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="h5" fontWeight={800}>
                  {workspace.overview.sequencedJournals}
                </Typography>
                <FormatListNumberedIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {workspace.journals.map((journal) => (
          <Grid key={journal.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                borderTop: `3px solid ${TYPE_COLORS[journal.type]}`,
                borderRadius: 3,
                height: '100%',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                '&:hover': { bgcolor: 'grey.300' },
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: `${TYPE_COLORS[journal.type]}20`,
                      color: TYPE_COLORS[journal.type],
                    }}
                  >
                    <Iconify icon={TYPE_ICONS[journal.type]} width={22} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {journal.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontFamily: 'monospace' }}
                    >
                      {journal.code}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                  <Chip
                    label={journal.type}
                    size="small"
                    sx={{
                      textTransform: 'capitalize',
                      bgcolor: `${TYPE_COLORS[journal.type]}15`,
                      color: TYPE_COLORS[journal.type],
                    }}
                  />
                  <Chip label={`${journal.postingQueue} entries`} size="small" variant="outlined" />
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block">
                  Default Dr: {journal.defaultDebitName}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Default Cr: {journal.defaultCreditName}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Sequence: {journal.sequencePolicy}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Suspense: {journal.suspenseAccount}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Profit/Loss: {journal.profitAccount}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Period access: {journal.periodAccess}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  {journal.reviewPolicy}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Last entry: {journal.lastEntryDate}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={() => workspace.actions.toggleJournalStatus(journal.id)}
                  >
                    {journal.active ? 'Disable' : 'Enable'}
                  </Button>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleOpenEditDialog(journal)}>
                      <Iconify icon="solar:pen-bold" width={16} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(journal)}>
                      <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                    </IconButton>
                  </Tooltip>
                  <Button
                    size="small"
                    variant="contained"
                    component={Link}
                    href={`${BASE_PATH}/${journal.id}`}
                    startIcon={<Iconify icon="solar:eye-bold" width={16} />}
                  >
                    Open
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Journal' : 'New Journal'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
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
                select
                fullWidth
                label="Type"
                value={form.journal_type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, journal_type: event.target.value }))
                }
              >
                <MenuItem value="general">General</MenuItem>
                <MenuItem value="sales">Sales</MenuItem>
                <MenuItem value="purchase">Purchase</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="bank">Bank</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Sequence Prefix"
                value={form.sequence_prefix}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sequence_prefix: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Default Debit Account (optional)"
                value={form.default_debit_account}
                onChange={(event) =>
                  setForm((current) => ({ ...current, default_debit_account: event.target.value }))
                }
              >
                <MenuItem value="">— None —</MenuItem>
                {workspace.accountsList.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.code} · {a.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Default Credit Account (optional)"
                value={form.default_credit_account}
                onChange={(event) =>
                  setForm((current) => ({ ...current, default_credit_account: event.target.value }))
                }
              >
                <MenuItem value="">— None —</MenuItem>
                {workspace.accountsList.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.code} · {a.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
              setEditTarget(null);
              setForm(EMPTY_FORM);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreate}>
            {editTarget ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Journal</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
