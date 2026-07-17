'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
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
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { useChartOfAccountsApi } from './use-chart-of-accounts-api';

const BASE_PATH = '/dashboard/accounting-finance/configuration/chart-of-accounts';

const TYPE_COLORS = {
  asset: 'success',
  liability: 'info',
  equity: 'secondary',
  income: 'warning',
  expense: 'error',
};

const EMPTY_FORM = {
  code: '',
  name: '',
  type_id: '',
  parent_id: '',
  opening_balance: 0,
  description: '',
  status: 'active',
  is_contra: false,
  reconcile: false,
};

function buildFlatList(accounts) {
  const childMap = {};
  const roots = [];

  accounts.forEach((acc) => {
    if (acc.parent) {
      if (!childMap[acc.parent]) childMap[acc.parent] = [];
      childMap[acc.parent].push(acc);
    } else {
      roots.push(acc);
    }
  });

  Object.values(childMap).forEach((children) =>
    children.sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true }))
  );

  const flat = [];
  function walk(nodes, depth) {
    nodes.forEach((node) => {
      flat.push({ ...node, depth });
      const children = childMap[node.id] || [];
      if (children.length) walk(children, depth + 1);
    });
  }
  walk(roots, 0);
  return { flat, childMap };
}

// Collect all descendant account codes (including self) for a given account
function getDescendantCodes(accountId, childMap) {
  const codes = [];
  const visited = new Set();

  function collect(id) {
    if (visited.has(id)) return;
    visited.add(id);
    const children = childMap[id] || [];
    children.forEach((child) => {
      codes.push(child.code);
      collect(child.id);
    });
  }

  collect(accountId);
  return codes;
}

export default function ChartOfAccounts() {
  useCurrency();
  const workspace = useChartOfAccountsApi();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const { flat: filtered, childMap } = useMemo(() => {
    let list = [...workspace.accounts].filter((account) => {
      if (
        search &&
        !`${account.code} ${account.name}`.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (typeFilter !== 'all') {
        if (account.classification !== typeFilter) return false;
      }
      if (statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        if (account.active !== isActive) return false;
      }
      return true;
    });
    return buildFlatList(list);
  }, [search, typeFilter, statusFilter, workspace.accounts]);

  const handleOpenCreateDialog = useCallback(() => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }, []);

  const handleOpenEditDialog = useCallback((account) => {
    setEditTarget(account);
    setForm({
      code: account.code || '',
      name: account.name || '',
      type_id: account.classification || '',
      parent_id: account.parent || '',
      opening_balance: account.opening_balance ?? account.balance ?? 0,
      description: account.description || '',
      status: account.active ? 'active' : 'inactive',
      is_contra: account.is_contra ?? false,
      reconcile: account.reconcile ?? false,
    });
    setOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  }, []);

  const handleCreate = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Code and Name are required');
      return;
    }
    try {
      if (editTarget) {
        await workspace.actions.updateAccount(editTarget.id, form);
        toast.success('Account updated');
      } else {
        await workspace.actions.createAccount(form);
        toast.success('Account created');
      }
      handleCloseDialog();
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to save account');
    }
  };

  const handleDelete = async () => {
    try {
      await workspace.actions.deleteAccount(deleteTarget.id);
      toast.success('Account deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete account');
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const result = await workspace.actions.seedChartOfAccounts();
      toast.success(result?.detail || 'Chart of accounts seeded successfully');
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to seed');
    } finally {
      setSeeding(false);
    }
  };

  const canSave = form.code.trim() && form.name.trim();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Account Register</Typography>
          <Typography variant="body2" color="text.secondary">
            Search, classify, and edit accounting accounts from one place.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={seeding ? null : <Iconify icon="solar:magic-stick-bold-duotone" />}
            onClick={handleSeed}
            disabled={seeding}
          >
            {seeding ? 'Seeding...' : 'Seed'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={handleOpenCreateDialog}
          >
            New Account
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2,
                bgcolor: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Iconify icon="solar:check-circle-bold-duotone" width={26} sx={{ color: '#10b981' }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700} lineHeight={1.2}>
                {workspace.overview.activeAccounts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active accounts
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2,
                bgcolor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Iconify icon="solar:shield-check-bold-duotone" width={26} sx={{ color: '#3b82f6' }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700} lineHeight={1.2}>
                {workspace.overview.reconcilableAccounts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reconcilable accounts
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2,
                bgcolor: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Iconify icon="solar:danger-bold-duotone" width={26} sx={{ color: '#ef4444' }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700} lineHeight={1.2}>
                {workspace.overview.highExposureAccounts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High exposure accounts
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search accounts..."
            value={search ?? ''}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
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
            value={typeFilter ?? 'all'}
            onChange={(event) => setTypeFilter(event.target.value ?? 'all')}
            sx={{ width: 220 }}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="asset">Asset</MenuItem>
            <MenuItem value="liability">Liability</MenuItem>
            <MenuItem value="equity">Equity</MenuItem>
            <MenuItem value="income">Income</MenuItem>
            <MenuItem value="expense">Expense</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            value={statusFilter ?? 'all'}
            onChange={(event) => setStatusFilter(event.target.value ?? 'all')}
            sx={{ width: 160 }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table
            size="small"
            sx={{
              borderCollapse: 'collapse',
              '& .MuiTableCell-root': {
                border: '1px solid #e0e0e0 !important',
                borderColor: '#e0e0e0 !important',
                borderStyle: 'solid !important',
                py: 1.25,
                px: 1.5,
              },
              '& .MuiTableHead-root .MuiTableCell-root': {
                borderBottom: '2px solid #bdbdbd !important',
                bgcolor: '#f5f5f5',
                fontWeight: 700,
                fontSize: 13,
                border: '1px solid #bdbdbd !important',
                borderColor: '#bdbdbd !important',
                borderStyle: 'solid !important',
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 90 }}>Code</TableCell>
                <TableCell>Account</TableCell>
                <TableCell sx={{ width: 120 }}>Type</TableCell>
                <TableCell sx={{ width: 160 }}>Parent</TableCell>
                <TableCell>Linked / Related</TableCell>
                <TableCell align="right" sx={{ width: 110 }}>Balance</TableCell>
                <TableCell sx={{ width: 100 }}>Status</TableCell>
                <TableCell align="right" sx={{ width: 90 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">No accounts found.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((account) => (
                <TableRow
                  key={account.id}
                  hover
                  sx={{
                    cursor: 'pointer',
                    bgcolor: account.depth === 0 ? 'rgba(76, 175, 80, 0.04)' : 'transparent',
                    '&:last-child .MuiTableCell-root': { borderBottom: 'none' },
                  }}
                  onClick={() => {
                    const childCodes = getDescendantCodes(account.id, childMap);
                    const allCodes = [account.code, ...childCodes];
                    const param = allCodes.length > 1 ? allCodes.join(',') : account.code;
                    window.location.href = `/dashboard/accounting-finance/transactions/general-ledger-posting?accounts=${param}`;
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={account.depth === 0 ? 700 : 500} sx={{ pl: account.depth * 3, fontSize: 13 }}>
                      {account.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" fontWeight={account.depth === 0 ? 700 : 500} sx={{ pl: account.depth * 3 }}>
                        {account.name}
                      </Typography>
                      {account.is_contra && (
                        <Chip label="Contra" size="small" color="secondary" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={account.typeName}
                      size="small"
                      variant="outlined"
                      color={TYPE_COLORS[account.classification] || 'default'}
                      sx={{ fontWeight: 600, borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{account.parentName || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={account.tags.length ? 'text.primary' : 'text.secondary'}>
                      {account.tags.length ? account.tags.join(', ') : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} color={Number(account.balance) < 0 ? 'error' : 'text.primary'}>
                      {formatCurrency(Math.abs(Number(account.balance || 0)))}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={account.active ? 'Active' : 'Inactive'}
                      size="small"
                      variant="outlined"
                      color={account.active ? 'success' : 'default'}
                      sx={{ fontWeight: 600, borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="View Ledger">
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            const childCodes = getDescendantCodes(account.id, childMap);
                            const allCodes = [account.code, ...childCodes];
                            const param = allCodes.length > 1 ? allCodes.join(',') : account.code;
                            window.location.href = `/dashboard/accounting-finance/transactions/general-ledger-posting?accounts=${param}`;
                          }}
                        >
                          <Iconify icon="solar:chart-bold" width={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenEditDialog(account);
                          }}
                        >
                          <Iconify icon="solar:pen-bold" width={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteTarget(account);
                          }}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Account' : 'New Account'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                required
                label="Code"
                value={form.code ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                InputProps={{ readOnly: !!editTarget }}
                helperText={editTarget ? 'Code cannot be changed after creation' : 'e.g. 1000, 1100'}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                required
                label="Name"
                value={form.name ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Account Type"
                value={form.type_id ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, type_id: event.target.value ?? '' }))}
              >
                <MenuItem value="">— Select type —</MenuItem>
                <MenuItem value="asset">Asset</MenuItem>
                <MenuItem value="liability">Liability</MenuItem>
                <MenuItem value="equity">Equity</MenuItem>
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Parent Account (optional)"
                value={form.parent_id ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, parent_id: event.target.value ?? '' }))}
              >
                <MenuItem value="">— None —</MenuItem>
                {workspace.accounts
                  .filter((a) => String(a.id) !== String(editTarget?.id))
                  .map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.code} · {a.name}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Opening Balance"
                value={form.opening_balance ?? 0}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    opening_balance: event.target.value === '' ? 0 : Number(event.target.value),
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Description"
                value={form.description ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Status"
                value={form.status ?? 'active'}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Contra Account"
                value={form.is_contra ? 'yes' : 'no'}
                onChange={(event) => setForm((current) => ({ ...current, is_contra: event.target.value === 'yes' }))}
              >
                <MenuItem value="no">No</MenuItem>
                <MenuItem value="yes">Yes</MenuItem>
              </TextField>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Contra accounts reverse normal debit/credit balance for their type.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Reconcilable"
                value={form.reconcile ? 'yes' : 'no'}
                onChange={(event) => setForm((current) => ({ ...current, reconcile: event.target.value === 'yes' }))}
              >
                <MenuItem value="no">No</MenuItem>
                <MenuItem value="yes">Yes</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!canSave}>
            {editTarget ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}