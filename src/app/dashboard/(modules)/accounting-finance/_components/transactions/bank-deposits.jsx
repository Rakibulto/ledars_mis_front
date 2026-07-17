'use client';

import { toast } from 'sonner';
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

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { useBankDepositsApi } from './use-bank-deposits-api';

const STATUS_COLORS = {
  draft: 'default',
  posted: 'success',
};

const RECON_COLORS = {
  pending: 'warning',
  reconciled: 'success',
};

const BANK_ACCOUNTS = ['Operating Bank Account', 'Collections Clearing', 'Grant Settlement Bank'];

const DEPOSIT_SOURCES = [
  'Cash collections',
  'Partner reimbursement',
  'Program income',
  'Field office settlement',
];

const DEPOSIT_METHODS = ['Counter deposit', 'Cash pickup', 'Cash-in-transit', 'Agent banking'];

const EMPTY_DEPOSIT_FORM = {
  date: '2026-03-29',
  bankAccount: '',
  bank_account: '',
  source: 'Cash collections',
  depositMethod: 'Counter deposit',
  depositSlipRef: '',
  preparedBy: '',
  amount: '',
  description: '',
};

export default function BankDeposits() {
  const { activeCurrency } = useCurrency();
  const api = useBankDepositsApi();
  const { deposits } = api;

  const { data: rawAccounts } = useSWR(endpoints.accounting.accounts, fetcher);
  const accounts = useMemo(() => {
    const list = Array.isArray(rawAccounts) ? rawAccounts : rawAccounts?.results ?? [];
    return list.filter((a) => a.is_active !== false);
  }, [rawAccounts]);

  const [search, setSearch] = useState('');
  const [reconciliationStatus, setReconciliationStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftDeposit, setDraftDeposit] = useState(EMPTY_DEPOSIT_FORM);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(
    () =>
      deposits.filter((deposit) => {
        const haystack = `${deposit.number} ${deposit.description} ${deposit.source}`.toLowerCase();
        if (search && !haystack.includes(search.toLowerCase())) return false;
        if (reconciliationStatus !== 'all' && deposit.reconciliationStatus !== reconciliationStatus)
          return false;
        return true;
      }),
    [deposits, reconciliationStatus, search]
  );

  const postedValue = deposits
    .filter((deposit) => deposit.status === 'posted')
    .reduce((sum, deposit) => sum + deposit.amount, 0);
  const pendingRecon = deposits.filter(
    (deposit) => deposit.reconciliationStatus === 'pending'
  ).length;

  const updateDraftDeposit = (field, value) => {
    setDraftDeposit((current) => ({ ...current, [field]: value }));
  };

  const handleOpenDialog = () => {
    setEditTarget(null);
    setDraftDeposit(EMPTY_DEPOSIT_FORM);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (deposit) => {
    setEditTarget(deposit);
    setDraftDeposit({
      date: deposit.date || EMPTY_DEPOSIT_FORM.date,
      bankAccount: deposit.bankAccount || EMPTY_DEPOSIT_FORM.bankAccount,
      source: deposit.source || EMPTY_DEPOSIT_FORM.source,
      depositMethod: deposit.depositMethod || EMPTY_DEPOSIT_FORM.depositMethod,
      depositSlipRef: deposit.depositSlipRef || '',
      preparedBy: deposit.preparedBy || '',
      amount: String(deposit.amount || ''),
      description: deposit.description || '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditTarget(null);
    setDraftDeposit(EMPTY_DEPOSIT_FORM);
  };

  const handleCreateDraft = async () => {
    try {
      if (editTarget) {
        await api.actions.updateDeposit(editTarget.id, draftDeposit);
        toast.success('Deposit updated successfully');
      } else {
        await api.actions.createDeposit(draftDeposit);
        toast.success('Deposit created successfully');
      }
      handleCloseDialog();
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to save deposit');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.actions.deleteDeposit(deleteTarget.id);
      toast.success('Deposit deleted');
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to delete deposit');
    } finally {
      setDeleteTarget(null);
    }
  };

  const canCreateDraft =
    draftDeposit.description.trim() &&
    draftDeposit.preparedBy.trim() &&
    Number(draftDeposit.amount) > 0;

  const handleReconcile = async (depositId) => {
    try {
      await api.actions.reconcile(depositId);
      toast.success('Deposit reconciled');
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Reconciliation failed');
    }
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
            Bank Deposits
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live bank deposit workspace with reconciliation status and deposit-source control.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={handleOpenDialog}
        >
          New Deposit
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        <AlertTitle>Deposit control active</AlertTitle>
        Deposits track reconciliation workflow with live treasury data from the backend.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Posted deposits
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {formatCurrency(postedValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Pending reconciliation
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {pendingRecon}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search deposit or source"
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
            <TextField
              select
              size="small"
              label="Reconciliation"
              value={reconciliationStatus}
              onChange={(event) => setReconciliationStatus(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="reconciled">Reconciled</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Number</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Bank Account</TableCell>
                <TableCell>Source</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((deposit) => (
                <TableRow key={deposit.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      {deposit.number}
                    </Typography>
                  </TableCell>
                  <TableCell>{new Date(deposit.date).toLocaleDateString()}</TableCell>
                  <TableCell>{deposit.description}</TableCell>
                  <TableCell>{deposit.bankAccount}</TableCell>
                  <TableCell>{deposit.source}</TableCell>
                  <TableCell align="right">{formatCurrency(deposit.amount)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={deposit.status}
                        size="small"
                        color={STATUS_COLORS[deposit.status]}
                        sx={{ textTransform: 'capitalize' }}
                      />
                      <Chip
                        label={deposit.reconciliationStatus}
                        size="small"
                        color={RECON_COLORS[deposit.reconciliationStatus]}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                      <Tooltip title="Edit deposit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditDialog(deposit)}
                          disabled={deposit.status === 'posted'}
                        >
                          <Iconify icon="solar:pen-bold" width={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete deposit">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(deposit)}
                          disabled={deposit.status === 'posted'}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                        </IconButton>
                      </Tooltip>
                      <Button
                        size="small"
                        variant="text"
                        component={RouterLink}
                        href={paths.dashboard.accountingFinance.transactions.bankDepositDetail(
                          deposit.id
                        )}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={deposit.reconciliationStatus === 'reconciled'}
                        onClick={() => handleReconcile(deposit.id)}
                      >
                        Reconcile
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Deposit' : 'Create Deposit'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Capture the source bundle, deposit slip, and bank preparation ownership before the
              treasury team reconciles the deposit.
            </Alert>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Deposit date"
                  value={draftDeposit.date}
                  onChange={(event) => updateDraftDeposit('date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Bank account"
                  value={draftDeposit.bank_account}
                  onChange={(event) => {
                    const selectedId = event.target.value;
                    const selected = accounts.find((a) => String(a.id) === String(selectedId));
                    updateDraftDeposit('bank_account', selectedId);
                    updateDraftDeposit('bankAccount', selected ? `${selected.code} - ${selected.name}` : '');
                  }}
                >
                  <MenuItem value="">Select bank account</MenuItem>
                  {accounts.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Deposit source"
                  value={draftDeposit.source}
                  onChange={(event) => updateDraftDeposit('source', event.target.value)}
                >
                  {DEPOSIT_SOURCES.map((option) => (
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
                  label="Deposit method"
                  value={draftDeposit.depositMethod}
                  onChange={(event) => updateDraftDeposit('depositMethod', event.target.value)}
                >
                  {DEPOSIT_METHODS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Deposit slip reference"
                  value={draftDeposit.depositSlipRef}
                  onChange={(event) => updateDraftDeposit('depositSlipRef', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Prepared by"
                  value={draftDeposit.preparedBy}
                  onChange={(event) => updateDraftDeposit('preparedBy', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Amount"
                  value={draftDeposit.amount}
                  onChange={(event) => updateDraftDeposit('amount', event.target.value)}
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
                  value={draftDeposit.description}
                  onChange={(event) => updateDraftDeposit('description', event.target.value)}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateDraft} disabled={!canCreateDraft}>
            {editTarget ? 'Save Changes' : 'Create Draft'}
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
        <DialogTitle>Delete Deposit?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete deposit <strong>{deleteTarget?.number}</strong>? This
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
