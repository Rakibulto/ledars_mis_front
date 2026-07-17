'use client';

import { mutate } from 'swr';
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
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import SummaryCard from '../../_components/summary-card';

const EP = endpoints.accounting;
const INITIAL_FORM = { code: '', name: '', account_type: '', parent_group: '', is_active: true };

export default function ChartOfAccountsPage() {
  const { data, loading, error } = useGetRequest(EP.accounts);
  const { data: typesData } = useGetRequest(EP.account_types);
  const { data: groupsData } = useGetRequest(EP.account_groups);

  const accounts = useMemo(() => data?.results || data || [], [data]);
  const types = useMemo(() => typesData?.results || typesData || [], [typesData]);
  const groups = useMemo(() => groupsData?.results || groupsData || [], [groupsData]);

  const createDialog = useBoolean();
  const editDialog = useBoolean();
  const confirm = useBoolean();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const handleFormChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleEdit = useCallback(
    (item) => {
      setEditingItem(item);
      setFormData({
        code: item.code || '',
        name: item.name || '',
        account_type: item.account_type || '',
        parent_group: item.parent_group || '',
        is_active: item.is_active ?? true,
      });
      editDialog.onTrue();
    },
    [editDialog]
  );

  const handleCreateSubmit = useCallback(async () => {
    try {
      await axiosInstance.post(EP.accounts, formData);
      mutate(EP.accounts);
      toast.success('Account created');
      createDialog.onFalse();
      setFormData(INITIAL_FORM);
    } catch (err) {
      toast.error(err.message || 'Failed to create');
    }
  }, [formData, createDialog]);

  const handleEditSubmit = useCallback(async () => {
    try {
      await axiosInstance.patch(`${EP.accounts}${editingItem.id}/`, formData);
      mutate(EP.accounts);
      toast.success('Account updated');
      editDialog.onFalse();
    } catch (err) {
      toast.error(err.message || 'Failed to update');
    }
  }, [formData, editingItem, editDialog]);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await axiosInstance.delete(`${EP.accounts}${deleteId}/`);
      mutate(EP.accounts);
      toast.success('Account deleted');
      confirm.onFalse();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  }, [deleteId, confirm]);

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    try {
      const res = await axiosInstance.post(EP.account_seed);
      toast.success(res.data?.detail || 'Chart of accounts seeded successfully');
      mutate(EP.accounts);
      mutate(EP.account_types);
      mutate(EP.account_groups);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err.message || 'Failed to seed');
    } finally {
      setSeeding(false);
    }
  }, []);

  const renderForm = () => (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <TextField
        name="code"
        label="Account Code"
        value={formData.code}
        onChange={handleFormChange}
        fullWidth
      />
      <TextField
        name="name"
        label="Account Name"
        value={formData.name}
        onChange={handleFormChange}
        fullWidth
      />
      <Select
        name="account_type"
        value={formData.account_type}
        onChange={handleFormChange}
        displayEmpty
        fullWidth
      >
        <MenuItem value="">Select Type</MenuItem>
        {types.map((t) => (
          <MenuItem key={t.id} value={t.id}>
            {t.name}
          </MenuItem>
        ))}
      </Select>
      <Select
        name="parent_group"
        value={formData.parent_group}
        onChange={handleFormChange}
        displayEmpty
        fullWidth
      >
        <MenuItem value="">Select Group</MenuItem>
        {groups.map((g) => (
          <MenuItem key={g.id} value={g.id}>
            {g.name}
          </MenuItem>
        ))}
      </Select>
    </Stack>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Chart of Accounts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage the chart of accounts
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={createDialog.onTrue}
          >
            Add Account
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={seeding ? null : <Iconify icon="solar:magic-stick-bold-duotone" />}
            onClick={handleSeed}
            disabled={seeding}
          >
            {seeding ? 'Seeding...' : 'Seed'}
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Accounts"
            value={accounts.length}
            icon="solar:notebook-bold-duotone"
            color="#2563eb"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Account Types"
            value={types.length}
            icon="solar:tag-bold-duotone"
            color="#8b5cf6"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Groups"
            value={groups.length}
            icon="solar:folder-bold-duotone"
            color="#10b981"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Active"
            value={accounts.filter((a) => a.is_active !== false).length}
            icon="solar:check-circle-bold-duotone"
            color="#f97316"
            loading={loading}
            error={error}
          />
        </Grid>
      </Grid>

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{acc.code}</Typography>
                  </TableCell>
                  <TableCell>{acc.name}</TableCell>
                  <TableCell>{acc.account_type_name || acc.account_type || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={acc.is_active !== false ? 'Active' : 'Inactive'}
                      size="small"
                      color={acc.is_active !== false ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(acc)}>
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setDeleteId(acc.id);
                        confirm.onTrue();
                      }}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {accounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No accounts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Account"
        content="Are you sure you want to delete this account?"
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />

      {[
        {
          open: createDialog.value,
          onClose: createDialog.onFalse,
          title: 'Create Account',
          onSubmit: handleCreateSubmit,
        },
        {
          open: editDialog.value,
          onClose: editDialog.onFalse,
          title: 'Edit Account',
          onSubmit: handleEditSubmit,
        },
      ].map((d) => (
        <Dialog key={d.title} open={d.open} onClose={d.onClose} maxWidth="sm" fullWidth>
          <DialogTitle>{d.title}</DialogTitle>
          <DialogContent>{renderForm()}</DialogContent>
          <DialogActions>
            <Button onClick={d.onClose}>Cancel</Button>
            <Button variant="contained" onClick={d.onSubmit}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      ))}
    </Box>
  );
}
