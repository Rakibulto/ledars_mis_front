'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Card,
  Grid,
  Stack,
  Table,
  Button,
  Dialog,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Pagination,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  InputAdornment,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePutRequest,
  useCreateRequest,
  useDeleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

export default function DonorFundedInventoryMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    donor: '',
    grant_code: '',
    project: '',
    total_value: '',
    budget_code: '',
    reporting_frequency: '',
    end_date: '',
  });
  const [deleteId, setDeleteId] = useState(null);
  const confirm = useBoolean();
  const EP = endpoints.storeInventory;

  const { data: rawData } = useGetRequest(EP.donor_funded_inventory);
  const tableData = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const filtered = useMemo(() => {
    if (!searchTerm) return tableData;
    return tableData.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, tableData]);

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleCreate = async () => {
    try {
      await useCreateRequest(EP.donor_funded_inventory, form);
      toast.success('Created successfully');
      setDialogOpen(false);
      setForm({
        donor: '',
        grant_code: '',
        project: '',
        total_value: '',
        budget_code: '',
        reporting_frequency: '',
        end_date: '',
      });
      mutate(EP.donor_funded_inventory);
    } catch (err) {
      toast.error('Failed to create');
    }
  };

  const handleUpdate = async () => {
    try {
      await usePutRequest(EP.donor_funded_by_id(editingItem.id), form);
      toast.success('Updated successfully');
      setDialogOpen(false);
      setEditingItem(null);
      setForm({
        donor: '',
        grant_code: '',
        project: '',
        total_value: '',
        budget_code: '',
        reporting_frequency: '',
        end_date: '',
      });
      mutate(EP.donor_funded_inventory);
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    try {
      await useDeleteRequest(EP.donor_funded_by_id(deleteId));
      toast.success('Deleted successfully');
      mutate(EP.donor_funded_inventory);
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      confirm.onFalse();
      setDeleteId(null);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      donor: item.donor || '',
      grant_code: item.grant_code || '',
      project: item.project || '',
      total_value: item.total_value || '',
      budget_code: item.budget_code || '',
      reporting_frequency: item.reporting_frequency || '',
      end_date: item.end_date || '',
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm({
      donor: '',
      grant_code: '',
      project: '',
      total_value: '',
      budget_code: '',
      reporting_frequency: '',
      end_date: '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = editingItem ? handleUpdate : handleCreate;

  const { data: rawDonors } = useGetRequest(endpoints.projectManagements.donors);
  const donorOptions = Array.isArray(rawDonors) ? rawDonors : rawDonors?.results || [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Donor-Funded Inventory
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:hand-money-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{tableData.length}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Active Grants
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:wallet-money-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">
              {`BDT ${tableData.reduce((s, d) => s + (d.total_value || 0), 0).toLocaleString()}`}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total Value
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
          <TextField
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:magnifer-bold-duotone" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={openCreate}
          >
            Add New
          </Button>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Donor</TableCell>
                <TableCell>Grant Code</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Total Value</TableCell>
                <TableCell>Budget Code</TableCell>
                <TableCell>Reporting</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((row, idx) => (
                <TableRow key={row.id || idx} hover>
                  <TableCell>
                    {donorOptions.find((d) => d.id === row.donor)?.name || String(row.donor ?? '')}
                  </TableCell>
                  <TableCell>{String(row.grant_code ?? '')}</TableCell>
                  <TableCell>{String(row.project ?? '')}</TableCell>
                  <TableCell>{String(row.total_value ?? '')}</TableCell>
                  <TableCell>{String(row.budget_code ?? '')}</TableCell>
                  <TableCell>{String(row.reporting_frequency ?? '')}</TableCell>
                  <TableCell>{String(row.end_date ?? '')}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(row)}>
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setDeleteId(row.id);
                        confirm.onTrue();
                      }}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No records found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {filtered.length > rowsPerPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={Math.ceil(filtered.length / rowsPerPage)}
              page={page}
              onChange={(e, v) => setPage(v)}
              color="primary"
            />
          </Box>
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Donor-Funded Inventory' : 'Add Donor-Funded Inventory'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Donor"
              fullWidth
              value={form.donor}
              onChange={(e) => setForm({ ...form, donor: e.target.value })}
            >
              {donorOptions.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name} ({d.donor_code})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Grant Code"
              fullWidth
              value={form.grant_code}
              onChange={(e) => setForm({ ...form, grant_code: e.target.value })}
            />
            <TextField
              label="Project"
              fullWidth
              value={form.project}
              onChange={(e) => setForm({ ...form, project: e.target.value })}
            />
            <TextField
              label="Total Value"
              fullWidth
              type="number"
              value={form.total_value}
              onChange={(e) => setForm({ ...form, total_value: e.target.value })}
            />
            <TextField
              label="Budget Code"
              fullWidth
              value={form.budget_code}
              onChange={(e) => setForm({ ...form, budget_code: e.target.value })}
            />
            <TextField
              label="Reporting Frequency"
              fullWidth
              value={form.reporting_frequency}
              onChange={(e) => setForm({ ...form, reporting_frequency: e.target.value })}
            />
            <TextField
              label="End Date"
              fullWidth
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure you want to delete this item?"
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
