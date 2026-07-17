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

export default function FieldWarehouseMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    name: '',
    type: '',
    location: '',
    capacity_sqft: '',
    manager: '',
    items_count: '',
    total_value: '',
    condition: '',
    security: '',
  });
  const [deleteId, setDeleteId] = useState(null);
  const confirm = useBoolean();
  const EP = endpoints.storeInventory;

  const { data: rawData } = useGetRequest(EP.field_warehouses);
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
      await useCreateRequest(EP.field_warehouses, form);
      toast.success('Created successfully');
      setDialogOpen(false);
      setForm({
        name: '',
        type: '',
        location: '',
        capacity_sqft: '',
        manager: '',
        items_count: '',
        total_value: '',
        condition: '',
        security: '',
      });
      mutate(EP.field_warehouses);
    } catch (err) {
      toast.error('Failed to create');
    }
  };

  const handleUpdate = async () => {
    try {
      await usePutRequest(EP.field_warehouse_by_id(editingItem.id), form);
      toast.success('Updated successfully');
      setDialogOpen(false);
      setEditingItem(null);
      setForm({
        name: '',
        type: '',
        location: '',
        capacity_sqft: '',
        manager: '',
        items_count: '',
        total_value: '',
        condition: '',
        security: '',
      });
      mutate(EP.field_warehouses);
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    try {
      await useDeleteRequest(EP.field_warehouse_by_id(deleteId));
      toast.success('Deleted successfully');
      mutate(EP.field_warehouses);
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
      name: item.name || '',
      type: item.type || '',
      location: item.location || '',
      capacity_sqft: item.capacity_sqft || '',
      manager: item.manager || '',
      items_count: item.items_count || '',
      total_value: item.total_value || '',
      condition: item.condition || '',
      security: item.security || '',
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm({
      name: '',
      type: '',
      location: '',
      capacity_sqft: '',
      manager: '',
      items_count: '',
      total_value: '',
      condition: '',
      security: '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = editingItem ? handleUpdate : handleCreate;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Field Warehouse Management
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:buildings-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{tableData.length}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total Field Stores
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
              {`BDT ${tableData.reduce((s, f) => s + (f.total_value || 0), 0).toLocaleString()}`}
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
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Capacity (sqft)</TableCell>
                <TableCell>Manager</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Value (BDT)</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Security</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((row, idx) => (
                <TableRow key={row.id || idx} hover>
                  <TableCell>{String(row.name ?? '')}</TableCell>
                  <TableCell>{String(row.type ?? '')}</TableCell>
                  <TableCell>{String(row.location ?? '')}</TableCell>
                  <TableCell>{String(row.capacity_sqft ?? '')}</TableCell>
                  <TableCell>{String(row.manager ?? '')}</TableCell>
                  <TableCell>{String(row.items_count ?? '')}</TableCell>
                  <TableCell>{String(row.total_value ?? '')}</TableCell>
                  <TableCell>{String(row.condition ?? '')}</TableCell>
                  <TableCell>{String(row.security ?? '')}</TableCell>
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
                  <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
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
        <DialogTitle>{editingItem ? 'Edit Field Warehouse' : 'Add Field Warehouse'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              label="Type"
              fullWidth
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
            <TextField
              label="Location"
              fullWidth
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <TextField
              label="Capacity (sqft)"
              fullWidth
              type="number"
              value={form.capacity_sqft}
              onChange={(e) => setForm({ ...form, capacity_sqft: e.target.value })}
            />
            <TextField
              label="Manager"
              fullWidth
              value={form.manager}
              onChange={(e) => setForm({ ...form, manager: e.target.value })}
            />
            <TextField
              label="Items Count"
              fullWidth
              type="number"
              value={form.items_count}
              onChange={(e) => setForm({ ...form, items_count: e.target.value })}
            />
            <TextField
              label="Total Value"
              fullWidth
              type="number"
              value={form.total_value}
              onChange={(e) => setForm({ ...form, total_value: e.target.value })}
            />
            <TextField
              label="Condition"
              fullWidth
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
            />
            <TextField
              label="Security"
              fullWidth
              value={form.security}
              onChange={(e) => setForm({ ...form, security: e.target.value })}
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
