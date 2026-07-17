'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
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
import TableContainer from '@mui/material/TableContainer';
import { Balance as BalanceIcon, Category as CategoryIcon, AccountTree as AccountTreeIcon } from '@mui/icons-material';

import { Iconify } from 'src/components/iconify';

import { useAccountTypesApi } from './use-account-types-api';
import { FoundationalConfigToolbar } from './foundational-config-toolbar';

const BASE_PATH = '/dashboard/accounting-finance/configuration/account-types';

const EMPTY_FORM = {
  name: '',
  classification: 'asset', // maps directly to backend field
};

export default function AccountTypes() {
  const workspace = useAccountTypesApi();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      if (editTarget) {
        await workspace.actions.updateAccountType(editTarget.id, form);
        toast.success('Account type updated');
      } else {
        await workspace.actions.createAccountType(form);
        toast.success('Account type created');
      }
      setOpen(false);
      setEditTarget(null);
      setForm(EMPTY_FORM);
    } catch {
      toast.error('Failed to save account type');
    }
  };

  const handleOpenEditDialog = (type) => {
    setEditTarget(type);
    setForm({
      name: type.name || '',
      classification: type.classification || type.category || 'asset',
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      await workspace.actions.deleteAccountType(deleteTarget.id);
      toast.success('Account type deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete account type');
    }
  };

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Code</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Name</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Nature
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Category
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Mapped Accounts
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Mapping Rule
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Close Behavior
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.accountTypes.map((type) => (
          <tr key={type.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{type.code}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{type.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{type.nature}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{type.category}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {type.mappedAccountCount}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{type.mappingRule}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{type.closeBehavior}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {type.active ? 'Active' : 'Inactive'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <Box sx={{ p: 3 }}>
      <FoundationalConfigToolbar printTitle="Account Types" printContent={printContent} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Account Types
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Foundational classification rules for account mapping, posting posture, and year-end
            close behavior.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setOpen(true)}
        >
          New Account Type
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Active types
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
                  {workspace.overview.activeAccountTypes}
                </Typography>
                <CategoryIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Mapped accounts
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
                  {workspace.overview.mappedAccounts}
                </Typography>
                <AccountTreeIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Balance-sheet types
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
                  {workspace.overview.balanceSheetTypes}
                </Typography>
                <BalanceIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Nature</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Mapped Accounts</TableCell>
                <TableCell>Mapping Rule</TableCell>
                <TableCell>Close Behavior</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workspace.accountTypes.map((type) => (
                <TableRow key={type.id} hover>
                  <TableCell>
                    <Chip label={type.code} size="small" color="primary" sx={{ fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {type.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {type.defaultPolicy}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{type.nature}</TableCell>
                  <TableCell>
                    <Chip
                      label={type.category === 'balance_sheet' ? 'Balance Sheet' : 'Profit & Loss'}
                      size="small"
                      color={type.category === 'balance_sheet' ? 'info' : 'success'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {type.mappedAccountCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {type.postingMode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{type.mappingRule}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {type.categoryBehavior}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{type.closeBehavior}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Owner: {type.controlOwner}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={type.active ? 'Active' : 'Inactive'}
                      size="small"
                      color={type.active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                      alignItems="center"
                    >
                      <Tooltip title="View details">
                        <Button
                          component={Link}
                          href={`${BASE_PATH}/${type.id}`}
                          size="small"
                          variant="text"
                        >
                          View Details
                        </Button>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenEditDialog(type)}>
                          <Iconify icon="solar:pen-bold" width={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(type)}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                        </IconButton>
                      </Tooltip>
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        onClick={() => workspace.actions.toggleAccountTypeStatus(type.id)}
                      >
                        {type.active ? 'Disable' : 'Enable'}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Account Type' : 'New Account Type'}</DialogTitle>
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
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                fullWidth
                label="Classification"
                value={form.classification}
                onChange={(event) =>
                  setForm((current) => ({ ...current, classification: event.target.value }))
                }
              >
                <MenuItem value="asset">Asset</MenuItem>
                <MenuItem value="liability">Liability</MenuItem>
                <MenuItem value="equity">Equity</MenuItem>
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
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
        <DialogTitle>Delete Account Type</DialogTitle>
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
