'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

import { useCurrency, WORLD_CURRENCIES } from '../currency-context';
import { ReferenceConfigToolbar } from './reference-config-toolbar';
import { useBankCashAccountsApi } from './use-bank-cash-accounts-api';

const BASE_PATH = '/dashboard/accounting-finance/configuration/bank-cash-accounts';

function MetricCard({ label, value, helper }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function BankCashAccounts() {
  const workspace = useBankCashAccountsApi();
  const { formatAmount, activeCurrency } = useCurrency();

  // ── Bank account dialog ──────────────────────────────────
  const [open, setOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    balance: 0,
    currency: 'BDT',
    account_number: '',
    bank_name: '',
  });
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Cash register dialog ─────────────────────────────────
  const [cashOpen, setCashOpen] = useState(false);
  const [cashSubmitting, setCashSubmitting] = useState(false);
  const [cashForm, setCashForm] = useState({ name: '', opening_balance: 0, max_limit: 0 });

  const bankAccounts = workspace.bankCashAccounts.filter((account) => account.type === 'bank');
  const cashAccounts = workspace.bankCashAccounts.filter((account) => account.type === 'cash');
  const selectedAccount =
    workspace.bankCashAccounts.find(
      (account) => String(account.id) === String(selectedAccountId)
    ) ||
    workspace.bankCashAccounts[0] ||
    null;

  const saveAccount = async () => {
    if (!form.name.trim() || !form.account_number.trim() || !form.bank_name.trim()) {
      toast.error('Name, bank/register name, and account number are required');
      return;
    }

    setSubmitting(true);
    try {
      await workspace.actions.createBankCashAccount(form);
      toast.success('Account added');
      setOpen(false);
      setForm({
        code: '',
        name: '',
        balance: 0,
        currency: 'BDT',
        account_number: '',
        bank_name: '',
      });
    } catch (error) {
      toast.error(error?.message || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  const saveCashRegister = async () => {
    if (!cashForm.name.trim()) {
      toast.error('Cash register name is required');
      return;
    }

    setCashSubmitting(true);
    try {
      await workspace.actions.createCashRegister(cashForm);
      toast.success('Cash register added');
      setCashOpen(false);
      setCashForm({ name: '', opening_balance: 0, max_limit: 0 });
    } catch (error) {
      toast.error(error?.message || 'Failed to create cash register');
    } finally {
      setCashSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (deleteTarget.type === 'bank') {
        await workspace.actions.deleteBankAccount(deleteTarget.id);
      } else {
        await workspace.actions.deleteCashRegister(deleteTarget.id);
      }
      toast.success('Account deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete account');
    }
  };

  const renderSection = (title, icon, items, color) => (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon={icon} width={24} sx={{ color }} />
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
        </Stack>
        <Typography variant="body2" fontWeight={700}>
          {items.length} account(s)
        </Typography>
      </Stack>
      <Grid container spacing={2}>
        {items.map((account) => (
          <Grid key={account.id} size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                borderRadius: 3,
                height: '100%',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              onClick={() => setSelectedAccountId(account.id)}
            >
              <CardContent>
                <Stack direction="row" spacing={2}>
                  <Avatar sx={{ bgcolor: `${color}20`, color }}>
                    <Iconify
                      icon={
                        account.type === 'bank' ? 'solar:safe-square-bold' : 'solar:wallet-bold'
                      }
                    />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {account.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {account.bank_name} • {account.account_number}
                        </Typography>
                      </Box>
                      <Chip label={account.currency} size="small" />
                    </Stack>
                    <Stack spacing={0.35} sx={{ mt: 1.25 }}>
                      <Typography variant="body2">
                        Balance: <strong>{formatAmount(account.balance, account.currency)}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Pending:{' '}
                        <strong>{formatAmount(account.pendingBalance, account.currency)}</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {account.treasuryDefault} • {account.liquidityTag} •{' '}
                        {account.reconciliationState}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {account.reconciliationCadence} • {account.liquidityHorizon}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mt: 1.5 }}
                >
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(account);
                      }}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View details">
                    <Button
                      component={Link}
                      href={`${BASE_PATH}/${account.id}`}
                      size="small"
                      variant="text"
                    >
                      View Details
                    </Button>
                  </Tooltip>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Account
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Type</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Bank / Register
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Number
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Currency
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
            Balance
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.bankCashAccounts.map((account) => (
          <tr key={account.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{account.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {account.type === 'bank' ? 'Bank' : 'Cash'}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{account.bank_name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {account.account_number}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{account.currency}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              {account.balance}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <Box sx={{ p: 3 }}>
      <ReferenceConfigToolbar printTitle="Bank & Cash Accounts" printContent={printContent} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ md: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Bank & Cash Accounts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Liquidity structure with treasury defaults, pending balance visibility, and
            reconciliation posture.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:wallet-bold" />}
            onClick={() => setCashOpen(true)}
          >
            Add Cash Register
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => setOpen(true)}
          >
            Add Bank Account
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Bank accounts"
            value={workspace.overview.bankAccountCount}
            helper="Controlled banking routes"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Cash accounts"
            value={workspace.overview.cashAccountCount}
            helper="Field floats and petty cash"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Liquidity"
            value={formatAmount(workspace.overview.totalLiquidity)}
            helper="Gross configured liquidity"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Pending"
            value={formatAmount(workspace.overview.pendingLiquidity)}
            helper="Expected uncleared amount"
          />
        </Grid>
      </Grid>

      {renderSection('Bank Accounts', 'solar:safe-square-bold-duotone', bankAccounts, '#2563eb')}
      {renderSection('Cash Accounts', 'solar:wallet-bold-duotone', cashAccounts, '#16a34a')}

      {selectedAccount ? (
        <Card sx={{ borderRadius: 3, mt: 1 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Liquidity Control Detail
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1.1}>
                  <Typography variant="body2">
                    Account: <strong>{selectedAccount.name}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Route type:{' '}
                    <strong>
                      {selectedAccount.type === 'bank'
                        ? 'Bank settlement account'
                        : 'Cash holding account'}
                    </strong>
                  </Typography>
                  <Typography variant="body2">
                    Treasury default: <strong>{selectedAccount.treasuryDefault}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Liquidity horizon: <strong>{selectedAccount.liquidityHorizon}</strong>
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1.1}>
                  <Typography variant="body2">
                    Available balance:{' '}
                    <strong>
                      {formatAmount(selectedAccount.availableBalance, selectedAccount.currency)}
                    </strong>
                  </Typography>
                  <Typography variant="body2">
                    Pending balance:{' '}
                    <strong>
                      {formatAmount(selectedAccount.pendingBalance, selectedAccount.currency)}
                    </strong>
                  </Typography>
                  <Typography variant="body2">
                    Reconciliation cadence: <strong>{selectedAccount.reconciliationCadence}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Control posture: <strong>{selectedAccount.reconciliationState}</strong>
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Bank Account</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Code"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
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
                fullWidth
                label="Bank Name"
                value={form.bank_name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bank_name: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Account Number"
                value={form.account_number}
                onChange={(event) =>
                  setForm((current) => ({ ...current, account_number: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Currency"
                value={form.currency}
                onChange={(event) =>
                  setForm((current) => ({ ...current, currency: event.target.value }))
                }
              >
                {WORLD_CURRENCIES.map((c) => (
                  <MenuItem key={c.code} value={c.code}>
                    {c.flag} {c.code} — {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Opening Balance"
                value={form.balance}
                onChange={(event) =>
                  setForm((current) => ({ ...current, balance: Number(event.target.value) }))
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">{activeCurrency.symbol}</InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveAccount} disabled={submitting}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cashOpen} onClose={() => setCashOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Cash Register</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Register Name"
                value={cashForm.name}
                onChange={(event) =>
                  setCashForm((current) => ({ ...current, name: event.target.value }))
                }
                helperText="E.g. Petty Cash, Front Desk Float"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Opening Balance"
                value={cashForm.opening_balance}
                onChange={(event) =>
                  setCashForm((current) => ({
                    ...current,
                    opening_balance: Number(event.target.value),
                  }))
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">{activeCurrency.symbol}</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Max Limit"
                value={cashForm.max_limit}
                onChange={(event) =>
                  setCashForm((current) => ({ ...current, max_limit: Number(event.target.value) }))
                }
                helperText="Maximum cash allowed in this register"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">{activeCurrency.symbol}</InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCashOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveCashRegister} disabled={cashSubmitting}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteAccount}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
