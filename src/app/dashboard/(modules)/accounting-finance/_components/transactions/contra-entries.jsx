'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import AlertTitle from '@mui/material/AlertTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { useWorkspaceContraApi } from './use-workspace-contra-api';

const STATUS_COLORS = {
  draft: 'default',
  posted: 'success',
};

const TRANSFER_CHANNELS = [
  'Cash replenishment',
  'Cash return',
  'Bank sweep',
  'Inter-account transfer',
];

const today = new Date().toISOString().slice(0, 10);

const EMPTY_CONTRA_FORM = {
  date: today,
  fromAccount: '',
  toAccount: '',
  transferChannel: 'Cash replenishment',
  treasuryOwner: '',
  reference: '',
  amount: '',
  description: '',
};

export default function ContraEntries() {
  const { activeCurrency } = useCurrency();
  const { contraEntries, isLoading, isValidating, createDraft, updateEntry, deleteEntry, postEntry } =
    useWorkspaceContraApi();

  const { data: rawAccounts } = useSWR(endpoints.accounting.accounts, fetcher);

  const accounts = useMemo(() => {
    const list = Array.isArray(rawAccounts) ? rawAccounts : rawAccounts?.results ?? [];
    return list.filter((a) => a.is_active !== false);
  }, [rawAccounts]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [draftEntry, setDraftEntry] = useState(EMPTY_CONTRA_FORM);

  const filtered = useMemo(() => {
    if (!search) return contraEntries;
    const q = search.toLowerCase();
    return contraEntries.filter(
      (entry) =>
        `${entry.number} ${entry.description} ${entry.fromAccountName || entry.from_account_name || ''} ${entry.toAccountName || entry.to_account_name || ''}`.toLowerCase().includes(q)
    );
  }, [contraEntries, search]);

  const draftValue = filtered
    .filter((entry) => entry.status === 'draft')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const postedValue = filtered
    .filter((entry) => entry.status === 'posted')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const updateDraftEntry = (field, value) => {
    setDraftEntry((current) => ({ ...current, [field]: value }));
  };

  const handleOpenDialog = () => {
    setDraftEntry(EMPTY_CONTRA_FORM);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditTarget(null);
    setDraftEntry(EMPTY_CONTRA_FORM);
  };

  const handleCreateDraft = async () => {
    setSubmitting(true);
    const payload = {
      date: draftEntry.date,
      from_account: draftEntry.fromAccount,
      to_account: draftEntry.toAccount,
      transfer_channel: draftEntry.transferChannel,
      treasury_owner: draftEntry.treasuryOwner,
      reference: draftEntry.reference,
      amount: draftEntry.amount,
      description: draftEntry.description,
    };
    try {
      if (editTarget) {
        await updateEntry(editTarget.id, payload);
      } else {
        await createDraft(payload);
      }
      handleCloseDialog();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditDialog = (entry) => {
    setEditTarget(entry);
    setDraftEntry({
      date: entry.date || new Date().toISOString().slice(0, 10),
      fromAccount: entry.from_account ?? '',
      toAccount: entry.to_account ?? '',
      transferChannel: entry.transfer_channel ?? entry.transferChannel ?? 'Bank',
      treasuryOwner: entry.treasury_owner ?? entry.treasuryOwner ?? '',
      reference: entry.reference ?? '',
      amount: String(entry.amount || ''),
      description: entry.description ?? '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEntry(deleteTarget.id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const canCreateDraft =
    draftEntry.description.trim() &&
    draftEntry.treasuryOwner.trim() &&
    draftEntry.fromAccount !== draftEntry.toAccount &&
    Number(draftEntry.amount) > 0;

  const handlePost = async (entryId) => {
    await postEntry(entryId);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Contra Entries
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Internal transfer workspace for bank-to-cash and cash-to-bank movements.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={handleOpenDialog}
        >
          New Contra Entry
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        <AlertTitle>Internal transfer control active</AlertTitle>
        Contra entries use shared treasury data with posting workflow and transfer pairing
        visibility.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Visible transfers
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {filtered.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Posted value
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {formatCurrency(postedValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search contra entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={20} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Entry #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>From Account</TableCell>
                  <TableCell>To Account</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No contra entries found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Typography variant="subtitle2">{entry.number}</Typography>
                      </TableCell>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.fromAccountName || entry.from_account_name || '-'}</TableCell>
                      <TableCell>{entry.toAccountName || entry.to_account_name || '-'}</TableCell>
                      <TableCell>{formatCurrency(entry.amount)}</TableCell>
                      <TableCell>
                        <Chip
                          label={entry.status}
                          size="small"
                          color={STATUS_COLORS[entry.status]}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          {entry.status === 'draft' && (
                            <>
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => handleOpenEditDialog(entry)}>
                                  <Iconify icon="solar:pen-bold" width={16} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Post">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handlePost(entry.id)}
                                >
                                  <Iconify icon="solar:check-circle-bold" width={16} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setDeleteTarget(entry)}
                                >
                                  <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Contra Entry' : 'New Contra Entry'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={draftEntry.date}
                  onChange={(event) => updateDraftEntry('date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Transfer channel"
                  value={draftEntry.transferChannel}
                  onChange={(event) => updateDraftEntry('transferChannel', event.target.value)}
                >
                  {TRANSFER_CHANNELS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="From account"
                  value={draftEntry.fromAccount}
                  onChange={(event) => updateDraftEntry('fromAccount', event.target.value)}
                >
                  {accounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="To account"
                  value={draftEntry.toAccount}
                  onChange={(event) => updateDraftEntry('toAccount', event.target.value)}
                >
                  {accounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Treasury owner"
                  value={draftEntry.treasuryOwner}
                  onChange={(event) => updateDraftEntry('treasuryOwner', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Reference"
                  value={draftEntry.reference}
                  onChange={(event) => updateDraftEntry('reference', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Amount"
                  value={draftEntry.amount}
                  onChange={(event) => updateDraftEntry('amount', event.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">{activeCurrency.symbol}</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Description"
                  value={draftEntry.description}
                  onChange={(event) => updateDraftEntry('description', event.target.value)}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateDraft}
            disabled={!canCreateDraft || submitting}
          >
            {submitting ? <CircularProgress size={20} /> : editTarget ? 'Update' : 'Create Draft'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs">
        <DialogTitle>Delete Contra Entry?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {deleteTarget?.number}? This action cannot be undone.
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
