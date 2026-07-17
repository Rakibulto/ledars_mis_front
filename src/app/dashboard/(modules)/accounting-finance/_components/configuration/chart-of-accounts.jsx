'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';

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
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { PlanningConfigToolbar } from './planning-config-toolbar';
import { useChartOfAccountsApi } from './use-chart-of-accounts-api';

const BASE_PATH = '/dashboard/accounting-finance/configuration/chart-of-accounts';

const EMPTY_FORM = {
  code: '',
  name: '',
  type_id: '',
  balance: 0,
  reconcile: false,
  parent_id: '',
};

export default function ChartOfAccounts() {
  useCurrency();
  const workspace = useChartOfAccountsApi();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(
    () =>
      [...workspace.accounts]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .filter((account) => {
          if (
            search &&
            !`${account.code} ${account.name}`.toLowerCase().includes(search.toLowerCase())
          )
            return false;
          if (typeFilter !== 'all') {
            if (typeFilter === 'unknown') return account.type_id == null;
            if (Number(account.type_id) !== Number(typeFilter)) return false;
          }
          return true;
        }),
    [search, typeFilter, workspace.accounts]
  );

  const selectedAccount =
    filtered.find((account) => String(account.id) === String(selectedAccountId)) ||
    filtered[0] ||
    null;
  const typeFilterOptions = useMemo(
    () => [
      ...new Set(
        workspace.accounts.map((account) =>
          account.type_id == null ? 'unknown' : String(account.type_id)
        )
      ),
    ],
    [workspace.accounts]
  );

  const handleCreate = async () => {
    if (!form.name.trim() || !form.type_id) {
      toast.error('Name and type are required');
      return;
    }
    try {
      if (editTarget) {
        await workspace.actions.updateAccount(editTarget.id, form);
        toast.success('Account updated');
        setOpen(false);
        setEditTarget(null);
        setForm(EMPTY_FORM);
      } else {
        const newAccount = await workspace.actions.createAccount(form);
        toast.success('Account created');
        setOpen(false);
        setForm(EMPTY_FORM);
        workspace.accounts.push(newAccount);
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to save account');
    }
  };

  const handleOpenEditDialog = (account) => {
    setEditTarget(account);
    setForm({
      code: account.code || '',
      name: account.name || '',
      type_id: account.type_id || '',
      balance: account.balance ?? 0,
      reconcile: account.reconcile ?? false,
      parent_id: account.parent_id || '',
    });
    setOpen(true);
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

  return (
    <Box sx={{ p: 3 }}>
      <PlanningConfigToolbar
        printTitle="Chart of Accounts"
        printContent={
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Account Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Hierarchy</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell>Mapping & Usage</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>{account.code}</TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell>{account.typeName}</TableCell>
                    <TableCell>{account.parentCode}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(Math.abs(Number(account.balance || 0)))}
                    </TableCell>
                    <TableCell>{account.defaultMappings}</TableCell>
                    <TableCell>
                      {account.archived ? 'Archived' : account.active ? 'Active' : 'Inactive'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        }
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Chart of Accounts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Structure, control-band visibility, and account activation posture.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setOpen(true)}
        >
          New Account
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Active accounts
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
                  {workspace.overview.activeAccounts}
                </Typography>
                <AccountCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Reconcilable accounts
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
                  {workspace.overview.reconcilableAccounts}
                </Typography>
                <SyncAltIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                High exposure accounts
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
                  {workspace.overview.highExposureAccounts}
                </Typography>
                <WarningAmberIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                Hierarchy and mapping posture
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Accounts now surface parent bands, default reporting mappings, archive candidates,
                and usage analytics.
              </Typography>
            </Box>
            <Chip
              label={`${workspace.overview.archiveCandidates} archive candidate(s)`}
              color={workspace.overview.archiveCandidates ? 'warning' : 'success'}
            />
          </Stack>
        </CardContent>
      </Card>

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
            {typeFilterOptions.map((typeId) => {
              const sample = workspace.accounts.find(
                (account) =>
                  (account.type_id == null ? 'unknown' : String(account.type_id)) === typeId
              );
              const label = typeId === 'unknown' ? 'Unspecified type' : sample?.typeName || typeId;

              return (
                <MenuItem key={typeId} value={typeId}>
                  {label}
                </MenuItem>
              );
            })}
          </TextField>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Account Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Hierarchy</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell>Mapping & Usage</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((account) => (
                <TableRow
                  key={account.id}
                  hover
                  selected={String(account.id) === String(selectedAccount?.id)}
                  onClick={() => setSelectedAccountId(account.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      {account.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ pl: account.hierarchyLevel * 2 }}
                    >
                      {account.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {account.reportingRole}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={account.typeName}
                      size="small"
                      color={account.category === 'balance_sheet' ? 'info' : 'success'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">Parent: {account.parentCode}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {account.numberingScheme}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={Number(account.balance) < 0 ? 'error' : 'text.primary'}
                    >
                      {formatCurrency(Math.abs(Number(account.balance || 0)))}
                      {Number(account.balance) < 0 ? ' (Cr)' : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{account.defaultMappings}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {account.usageAnalytics}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                      useFlexGap
                      flexWrap="wrap"
                    >
                      <Chip
                        label={
                          account.archived ? 'Archived' : account.active ? 'Active' : 'Inactive'
                        }
                        size="small"
                        color={
                          account.archived ? 'warning' : account.active ? 'success' : 'default'
                        }
                      />
                      {account.archiveCandidate ? (
                        <Chip
                          label="Archive Candidate"
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="View details">
                        <Button
                          component={Link}
                          href={`${BASE_PATH}/${account.id}`}
                          size="small"
                          onClick={(event) => event.stopPropagation()}
                        >
                          View Details
                        </Button>
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
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        onClick={() => workspace.actions.toggleAccountStatus(account.id)}
                      >
                        {account.active ? 'Disable' : 'Enable'}
                      </Button>
                      {!account.archived ? (
                        <Button
                          size="small"
                          variant="text"
                          color="warning"
                          onClick={() => workspace.actions.archiveAccount(account.id)}
                        >
                          Archive
                        </Button>
                      ) : null}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Account' : 'New Account'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            {editTarget ? (
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Code"
                  value={form.code ?? ''}
                  InputProps={{ readOnly: true }}
                  helperText="Auto-generated code"
                />
              </Grid>
            ) : null}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Name"
                value={form.name ?? ''}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Account Type"
                value={form.type_id ?? ''}
                onChange={(event) =>
                  setForm((current) => ({ ...current, type_id: event.target.value ?? '' }))
                }
              >
                <MenuItem value="">— Select type —</MenuItem>
                {workspace.accountTypes.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Opening Balance"
                value={form.balance ?? ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    balance: event.target.value === '' ? '' : Number(event.target.value),
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Parent Account (optional)"
                value={form.parent_id ?? ''}
                onChange={(event) =>
                  setForm((current) => ({ ...current, parent_id: event.target.value ?? '' }))
                }
              >
                <MenuItem value="">— None —</MenuItem>
                {workspace.accounts.map((a) => (
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
        <DialogTitle>Delete Account</DialogTitle>
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
