'use client';

import { useMemo, useState } from 'react';

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

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { useWorkspaceContraApi } from './use-workspace-contra-api';

const STATUS_COLORS = {
  draft: 'default',
  posted: 'success',
};

const TREASURY_ACCOUNTS = [
  'Operating Bank Account',
  'Petty Cash',
  'Emergency Cash',
  'Collections Clearing',
];

const TRANSFER_CHANNELS = [
  'Cash replenishment',
  'Cash return',
  'Bank sweep',
  'Inter-account transfer',
];

const today = new Date().toISOString().slice(0, 10);

const EMPTY_CONTRA_FORM = {
  date: today,
  fromAccount: 'Operating Bank Account',
  toAccount: 'Petty Cash',
  transferChannel: 'Cash replenishment',
  treasuryOwner: '',
  reference: '',
  amount: '',
  description: '',
};

export default function ContraEntries() {
  const { activeCurrency } = useCurrency();
  const {
    contraEntries: entries,
    isLoading,
    createDraft,
    updateEntry,
    deleteEntry,
    postEntry,
  } = useWorkspaceContraApi();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftEntry, setDraftEntry] = useState(EMPTY_CONTRA_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(
    () =>
      entries.filter((entry) => {
        const haystack =
          `${entry.number} ${entry.description} ${entry.fromAccount} ${entry.toAccount}`.toLowerCase();
        return !search || haystack.includes(search.toLowerCase());
      }),
    [entries, search]
  );

  const postedValue = entries
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
      fromAccount: entry.fromAccount ?? entry.from_account ?? '',
      toAccount: entry.toAccount ?? entry.to_account ?? '',
      transferChannel: entry.transferChannel ?? entry.transfer_channel ?? 'Bank',
      treasuryOwner: entry.treasuryOwner ?? entry.treasury_owner ?? '',
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
            placeholder="Search contra number or account"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:magnifer-linear" />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Number</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                        {entry.number}
                      </Typography>
                    </TableCell>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>{entry.from_account}</TableCell>
                    <TableCell>{entry.to_account}</TableCell>
                    <TableCell align="right">{formatCurrency(entry.amount)}</TableCell>
                    <TableCell>
                      <Chip
                        label={entry.status}
                        size="small"
                        color={STATUS_COLORS[entry.status]}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={1}>
                        <Tooltip title="Edit entry">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDialog(entry);
                            }}
                            disabled={entry.status === 'posted'}
                          >
                            <Iconify icon="solar:pen-bold" width={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete entry">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(entry);
                            }}
                            disabled={entry.status === 'posted'}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                          </IconButton>
                        </Tooltip>
                        <Button
                          size="small"
                          variant="text"
                          component={RouterLink}
                          href={paths.dashboard.accountingFinance.transactions.contraEntryDetail(
                            entry.id
                          )}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={entry.status === 'posted'}
                          onClick={() => handlePost(entry.id)}
                        >
                          Post
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Contra Entry' : 'Create Contra Entry'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Define both sides of the transfer, treasury owner, and transfer reference before the
              entry is posted.
            </Alert>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Transfer date"
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
                  {TREASURY_ACCOUNTS.map((option) => (
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
                  label="To account"
                  value={draftEntry.toAccount}
                  onChange={(event) => updateDraftEntry('toAccount', event.target.value)}
                >
                  {TREASURY_ACCOUNTS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
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
            {submitting ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Draft'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Entry?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete entry <strong>{deleteTarget?.number}</strong>? This
            action cannot be undone.
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
