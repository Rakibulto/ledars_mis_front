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

export default function CustomsImportTrackingMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const defaultForm = {
    reference: '',
    date: '',
    shipment: '',
    port: '',
    customs_status: '',
    duty_amount: '',
    exemption: '',
    clearing_agent: '',
    days_in_customs: '',
  };
  const [form, setForm] = useState(defaultForm);
  const [deleteId, setDeleteId] = useState(null);
  const confirm = useBoolean();
  const EP = endpoints.storeInventory;

  const { data: rawData } = useGetRequest(EP.customs_import_tracking);
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
      await useCreateRequest(EP.customs_import_tracking, form);
      toast.success('Created successfully');
      setDialogOpen(false);
      setForm(defaultForm);
      mutate(EP.customs_import_tracking);
    } catch (err) {
      toast.error('Failed to create');
    }
  };

  const handleUpdate = async () => {
    try {
      await usePutRequest(EP.customs_import_tracking_by_id(editingItem.id), form);
      toast.success('Updated successfully');
      setDialogOpen(false);
      setEditingItem(null);
      setForm(defaultForm);
      mutate(EP.customs_import_tracking);
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    try {
      await useDeleteRequest(EP.customs_import_tracking_by_id(deleteId));
      toast.success('Deleted successfully');
      mutate(EP.customs_import_tracking);
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
      reference: item.reference || '',
      date: item.date || '',
      shipment: item.shipment || '',
      port: item.port || '',
      customs_status: item.customs_status || '',
      duty_amount: item.duty_amount || '',
      exemption: item.exemption || '',
      clearing_agent: item.clearing_agent || '',
      days_in_customs: item.days_in_customs || '',
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
        Customs & Import Tracking
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:global-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{tableData.length}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total Imports
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:clock-circle-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">
              {tableData.filter((c) => c.customs_status === 'In Progress').length}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              In Progress
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
                <TableCell>Reference</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Shipment</TableCell>
                <TableCell>Port</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Duty</TableCell>
                <TableCell>Exemption</TableCell>
                <TableCell>Clearing Agent</TableCell>
                <TableCell>Days in Customs</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((row, idx) => (
                <TableRow key={row.id || idx} hover>
                  <TableCell>{String(row.reference ?? '')}</TableCell>
                  <TableCell>{String(row.date ?? '')}</TableCell>
                  <TableCell>{String(row.shipment ?? '')}</TableCell>
                  <TableCell>{String(row.port ?? '')}</TableCell>
                  <TableCell>{String(row.customs_status ?? '')}</TableCell>
                  <TableCell>{String(row.duty_amount ?? '')}</TableCell>
                  <TableCell>{String(row.exemption ?? '')}</TableCell>
                  <TableCell>{String(row.clearing_agent ?? '')}</TableCell>
                  <TableCell>{String(row.days_in_customs ?? '')}</TableCell>
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
        <DialogTitle>{editingItem ? 'Edit Import' : 'Add New Import'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reference"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Shipment"
                value={form.shipment}
                onChange={(e) => setForm({ ...form, shipment: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Port"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customs Status"
                value={form.customs_status}
                onChange={(e) => setForm({ ...form, customs_status: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duty Amount"
                type="number"
                value={form.duty_amount}
                onChange={(e) => setForm({ ...form, duty_amount: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Exemption"
                value={form.exemption}
                onChange={(e) => setForm({ ...form, exemption: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Clearing Agent"
                value={form.clearing_agent}
                onChange={(e) => setForm({ ...form, clearing_agent: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Days in Customs"
                type="number"
                value={form.days_in_customs}
                onChange={(e) => setForm({ ...form, days_in_customs: e.target.value })}
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
