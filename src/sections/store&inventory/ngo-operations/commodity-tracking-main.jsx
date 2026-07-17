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

export default function CommodityTrackingMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const defaultForm = {
    commodity: '',
    donor: '',
    received_qty: '',
    distributed_qty: '',
    in_transit: '',
    in_warehouse: '',
    losses: '',
    loss_rate: '',
    compliance_status: '',
  };
  const [form, setForm] = useState(defaultForm);
  const [deleteId, setDeleteId] = useState(null);
  const confirm = useBoolean();
  const EP = endpoints.storeInventory;

  const { data: rawData } = useGetRequest(EP.commodity_tracking);
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
      await useCreateRequest(EP.commodity_tracking, form);
      toast.success('Created successfully');
      setDialogOpen(false);
      setForm(defaultForm);
      mutate(EP.commodity_tracking);
    } catch (err) {
      toast.error('Failed to create');
    }
  };

  const handleUpdate = async () => {
    try {
      await usePutRequest(EP.commodity_tracking_by_id(editingItem.id), form);
      toast.success('Updated successfully');
      setDialogOpen(false);
      setEditingItem(null);
      setForm(defaultForm);
      mutate(EP.commodity_tracking);
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    try {
      await useDeleteRequest(EP.commodity_tracking_by_id(deleteId));
      toast.success('Deleted successfully');
      mutate(EP.commodity_tracking);
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
      commodity: item.commodity || '',
      donor: item.donor || '',
      received_qty: item.received_qty || '',
      distributed_qty: item.distributed_qty || '',
      in_transit: item.in_transit || '',
      in_warehouse: item.in_warehouse || '',
      losses: item.losses || '',
      loss_rate: item.loss_rate || '',
      compliance_status: item.compliance_status || '',
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };
  const handleSubmit = editingItem ? handleUpdate : handleCreate;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Commodity Tracking
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:box-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{tableData.length}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Commodities Tracked
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:delivery-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">
              {tableData.reduce((s, c) => s + (c.distributed_qty || 0), 0)}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total Distributed
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }} justifyContent="space-between">
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
                <TableCell>Commodity</TableCell>
                <TableCell>Donor</TableCell>
                <TableCell>Received</TableCell>
                <TableCell>Distributed</TableCell>
                <TableCell>In Transit</TableCell>
                <TableCell>In Warehouse</TableCell>
                <TableCell>Losses</TableCell>
                <TableCell>Loss Rate</TableCell>
                <TableCell>Compliance</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((row, idx) => (
                <TableRow key={row.id || idx} hover>
                  <TableCell>{String(row.commodity ?? '')}</TableCell>
                  <TableCell>{String(row.donor ?? '')}</TableCell>
                  <TableCell>{String(row.received_qty ?? '')}</TableCell>
                  <TableCell>{String(row.distributed_qty ?? '')}</TableCell>
                  <TableCell>{String(row.in_transit ?? '')}</TableCell>
                  <TableCell>{String(row.in_warehouse ?? '')}</TableCell>
                  <TableCell>{String(row.losses ?? '')}</TableCell>
                  <TableCell>{String(row.loss_rate ?? '')}</TableCell>
                  <TableCell>{String(row.compliance_status ?? '')}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEdit(row)}>
                      <Iconify icon="solar:pen-bold" width={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setDeleteId(row.id);
                        confirm.onTrue();
                      }}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" width={18} />
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
        <DialogTitle>{editingItem ? 'Edit Commodity' : 'Add New Commodity'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Commodity"
                value={form.commodity}
                onChange={(e) => setForm({ ...form, commodity: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Donor"
                value={form.donor}
                onChange={(e) => setForm({ ...form, donor: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Received Qty"
                type="number"
                value={form.received_qty}
                onChange={(e) => setForm({ ...form, received_qty: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Distributed Qty"
                type="number"
                value={form.distributed_qty}
                onChange={(e) => setForm({ ...form, distributed_qty: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="In Transit"
                type="number"
                value={form.in_transit}
                onChange={(e) => setForm({ ...form, in_transit: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="In Warehouse"
                type="number"
                value={form.in_warehouse}
                onChange={(e) => setForm({ ...form, in_warehouse: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Losses"
                type="number"
                value={form.losses}
                onChange={(e) => setForm({ ...form, losses: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Loss Rate"
                value={form.loss_rate}
                onChange={(e) => setForm({ ...form, loss_rate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Compliance Status"
                value={form.compliance_status}
                onChange={(e) => setForm({ ...form, compliance_status: e.target.value })}
              />
            </Grid>
          </Grid>
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
