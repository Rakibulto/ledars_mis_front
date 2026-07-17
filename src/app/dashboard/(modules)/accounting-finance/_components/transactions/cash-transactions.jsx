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
import { useWorkspaceCashApi } from './use-workspace-cash-api';

const STATUS_COLORS = {
  draft: 'default',
  posted: 'success',
};

const DIRECTION_COLORS = {
  inflow: 'success',
  outflow: 'warning',
};

const PAYMENT_METHODS = ['Cash voucher', 'Manual receipt', 'Field advance', 'Cash reimbursement'];

const today = new Date().toISOString().slice(0, 10);

const EMPTY_CASH_FORM = {
  date: today,
  account: '',
  counterparty: '',
  direction: 'outflow',
  amount: '',
  paymentMethod: 'Cash voucher',
  reference: '',
  description: '',
};

export default function CashTransactions() {
  const { activeCurrency } = useCurrency();
  const {
    transactions,
    isLoading,
    createDraft,
    updateTransaction,
    deleteTransaction,
    postTransaction,
  } = useWorkspaceCashApi();

  const { data: rawAccounts } = useSWR(endpoints.accounting.accounts, fetcher);

  const accounts = useMemo(() => {
    const list = Array.isArray(rawAccounts) ? rawAccounts : rawAccounts?.results ?? [];
    return list.filter((a) => a.is_active !== false);
  }, [rawAccounts]);

  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftTransaction, setDraftTransaction] = useState(EMPTY_CASH_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(
    () =>
      transactions.filter((transaction) => {
        const haystack =
          `${transaction.number} ${transaction.description} ${transaction.counterparty}`.toLowerCase();
        if (search && !haystack.includes(search.toLowerCase())) return false;
        if (direction !== 'all' && transaction.direction !== direction) return false;
        return true;
      }),
    [direction, search, transactions]
  );

  const inflow = transactions
    .filter((transaction) => transaction.direction === 'inflow')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const outflow = transactions
    .filter((transaction) => transaction.direction === 'outflow')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const updateDraftTransaction = (field, value) => {
    setDraftTransaction((current) => ({ ...current, [field]: value }));
  };

  const handleOpenDialog = () => {
    setDraftTransaction(EMPTY_CASH_FORM);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditTarget(null);
    setDraftTransaction(EMPTY_CASH_FORM);
  };

  const handleCreateDraft = async () => {
    setSubmitting(true);
    const payload = {
      date: draftTransaction.date,
      account: draftTransaction.account,
      counterparty: draftTransaction.counterparty,
      direction: draftTransaction.direction,
      amount: draftTransaction.amount,
      payment_method: draftTransaction.paymentMethod,
      reference: draftTransaction.reference,
      description: draftTransaction.description,
    };
    try {
      if (editTarget) {
        await updateTransaction(editTarget.id, payload);
      } else {
        await createDraft(payload);
      }
      handleCloseDialog();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditDialog = (transaction) => {
    setEditTarget(transaction);
    setDraftTransaction({
      date: transaction.date || new Date().toISOString().slice(0, 10),
      account: transaction.account ?? '',
      counterparty: transaction.counterparty ?? '',
      direction: transaction.direction ?? 'inflow',
      amount: String(transaction.amount || ''),
      paymentMethod: transaction.payment_method ?? 'Bank Transfer',
      reference: transaction.reference ?? '',
      description: transaction.description ?? '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTransaction(deleteTarget.id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handlePost = async (id) => {
    await postTransaction(id);
  };

  const canCreateDraft =
    draftTransaction.description.trim() &&
    draftTransaction.counterparty.trim() &&
    Number(draftTransaction.amount) > 0;

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
            Cash Transactions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track petty cash inflows and outflows with posting workflow.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={handleOpenDialog}
        >
          New Transaction
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Total Inflow
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }} color="success.main">
                {formatCurrency(inflow)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Total Outflow
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }} color="warning.main">
                {formatCurrency(outflow)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Net Balance
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {formatCurrency(inflow - outflow)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" width={20} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              label="Direction"
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="inflow">Inflow</MenuItem>
              <MenuItem value="outflow">Outflow</MenuItem>
            </TextField>
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Transaction #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Counterparty</TableCell>
                  <TableCell>Direction</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No transactions found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Typography variant="subtitle2">{transaction.number}</Typography>
                      </TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>{transaction.accountName || transaction.account_name || transaction.account || '-'}</TableCell>
                      <TableCell>{transaction.counterparty}</TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.direction}
                          size="small"
                          color={DIRECTION_COLORS[transaction.direction]}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.status}
                          size="small"
                          color={STATUS_COLORS[transaction.status]}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={transaction.status === 'posted'}
                            onClick={() => handlePost(transaction.id)}
                          >
                            Post
                          </Button>
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
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Cash Transaction' : 'Create Cash Transaction'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Record the counterparty, direction, and cash document reference before posting the
              petty cash movement.
            </Alert>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Transaction date"
                  value={draftTransaction.date}
                  onChange={(event) => updateDraftTransaction('date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Cash account"
                  value={draftTransaction.account}
                  onChange={(event) => updateDraftTransaction('account', event.target.value)}
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
                  label="Counterparty"
                  placeholder="Staff member, vendor, or field office"
                  value={draftTransaction.counterparty}
                  onChange={(event) => updateDraftTransaction('counterparty', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Direction"
                  value={draftTransaction.direction}
                  onChange={(event) => updateDraftTransaction('direction', event.target.value)}
                >
                  <MenuItem value="inflow">Inflow</MenuItem>
                  <MenuItem value="outflow">Outflow</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Amount"
                  value={draftTransaction.amount}
                  onChange={(event) => updateDraftTransaction('amount', event.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">{activeCurrency.symbol}</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Payment method"
                  value={draftTransaction.paymentMethod}
                  onChange={(event) => updateDraftTransaction('paymentMethod', event.target.value)}
                >
                  {PAYMENT_METHODS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Reference"
                  value={draftTransaction.reference}
                  onChange={(event) => updateDraftTransaction('reference', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Description"
                  value={draftTransaction.description}
                  onChange={(event) => updateDraftTransaction('description', event.target.value)}
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
        <DialogTitle>Delete Transaction?</DialogTitle>
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
