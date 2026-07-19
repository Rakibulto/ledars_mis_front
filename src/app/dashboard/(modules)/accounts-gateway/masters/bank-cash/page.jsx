'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { TableNoData } from 'src/components/table';

import { GatewayPage } from '../../_components/gateway-page';
import { useGatewayApi } from '../../_components/use-gateway-api';
import { AccountAutocomplete } from '../../_components/account-autocomplete';

const EMPTY_FORM = {
  name: '',
  bank_name: '',
  account_number: '',
  account_type: 'bank',
  account: '',
  opening_balance: '0',
  status: 'active',
};

export default function GatewayBankCashPage() {
  const { banks, bankCashAccounts, createBankWithCoa, updateBank, banksLoading } =
    useGatewayApi();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  const onEdit = (bank) => {
    setEditId(bank.id);
    setForm({
      name: bank.name || '',
      bank_name: bank.bank_name || '',
      account_number: bank.account_number || '',
      account_type: bank.account_type || 'bank',
      account: bank.account ? String(bank.account) : '',
      opening_balance: String(bank.opening_balance ?? 0),
      status: bank.status || 'active',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSave = async () => {
    if (!form.name || !form.account_number || !form.account) {
      toast.error('Name, account number, and CoA account are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        bank_name: form.bank_name,
        account_number: form.account_number,
        account_type: form.account_type,
        account: Number(form.account),
        opening_balance: Number(form.opening_balance) || 0,
        status: form.status || 'active',
      };

      if (editId) {
        await updateBank(editId, payload);
        toast.success('Bank/cash account updated.');
      } else {
        await createBankWithCoa({
          ...payload,
          current_balance: Number(form.opening_balance) || 0,
        });
        toast.success('Bank/cash account created.');
      }
      resetForm();
    } catch (err) {
      const detail = err?.response?.data || err?.message;
      toast.error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setSaving(false);
    }
  };

  return (
    <GatewayPage
      heading="Bank / Cash Accounts"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Masters', href: paths.dashboard.accountsGateway.masters.root },
        { name: 'Bank / Cash' },
      ]}
    >
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          {editId ? 'Edit bank or cash book' : 'Create bank or cash book'}
        </Typography>
        <Box
          rowGap={3}
          columnGap={2}
          display="grid"
          gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
        >
          <TextField
            label="Display name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <TextField
            label="Bank name"
            value={form.bank_name}
            onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
          />
          <TextField
            label="Account number"
            value={form.account_number}
            onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
          />
          <TextField
            select
            label="Type"
            value={form.account_type}
            onChange={(e) => setForm((f) => ({ ...f, account_type: e.target.value }))}
          >
            <MenuItem value="bank">Bank</MenuItem>
            <MenuItem value="cash">Cash</MenuItem>
          </TextField>
          <AccountAutocomplete
            options={
              form.account &&
              !bankCashAccounts.some((a) => String(a.id) === String(form.account))
                ? [
                    ...bankCashAccounts,
                    {
                      id: form.account,
                      code: '?',
                      name: `Current linked (#${form.account})`,
                    },
                  ]
                : bankCashAccounts
            }
            value={form.account}
            onChange={(id) => setForm((f) => ({ ...f, account: id }))}
            label="Link CoA ledger"
            helperText="Global bank/cash CoA only (shared across projects)"
          />
          <TextField
            label="Opening balance"
            type="number"
            value={form.opening_balance}
            onChange={(e) => setForm((f) => ({ ...f, opening_balance: e.target.value }))}
            helperText={editId ? 'Does not change current book balance' : undefined}
          />
          {editId && (
            <TextField
              select
              label="Status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </TextField>
          )}
        </Box>
        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
          {editId && (
            <Button variant="outlined" color="inherit" onClick={resetForm} disabled={saving}>
              Cancel
            </Button>
          )}
          <Button
            variant="contained"
            onClick={onSave}
            disabled={saving}
            startIcon={
              <Iconify icon={editId ? 'solar:pen-bold' : 'mingcute:add-line'} />
            }
          >
            {editId ? 'Update account' : 'Save account'}
          </Button>
        </Stack>
      </Card>

      <Card>
        <Scrollbar>
          <Table size="small" sx={{ minWidth: 780 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Number</TableCell>
                <TableCell>CoA</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell align="right" sx={{ width: 72 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!banksLoading &&
                banks.map((b) => (
                  <TableRow
                    key={b.id}
                    hover
                    selected={editId === b.id}
                    sx={{ bgcolor: editId === b.id ? 'action.selected' : undefined }}
                  >
                    <TableCell>
                      <Typography variant="subtitle2">{b.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {b.bank_name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{b.account_type}</TableCell>
                    <TableCell>{b.account_number}</TableCell>
                    <TableCell>
                      {b.account_code} {b.account_name}
                    </TableCell>
                    <TableCell>
                      <Label
                        variant="soft"
                        color={b.status === 'active' ? 'success' : 'default'}
                      >
                        {b.status}
                      </Label>
                    </TableCell>
                    <TableCell align="right">
                      {Number(b.current_balance || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => onEdit(b)}>
                          <Iconify icon="solar:pen-bold" width={18} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              <TableNoData notFound={!banksLoading && !banks.length} />
            </TableBody>
          </Table>
        </Scrollbar>
      </Card>
    </GatewayPage>
  );
}
