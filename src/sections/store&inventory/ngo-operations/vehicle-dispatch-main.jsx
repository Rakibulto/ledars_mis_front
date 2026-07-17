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

export default function VehicleDispatchMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    reference: '',
    date: '',
    vehicle: '',
    driver: '',
    route: '',
    distance_km: '',
    fuel_cost: '',
    status: '',
  });
  const [deleteId, setDeleteId] = useState(null);
  const confirm = useBoolean();
  const EP = endpoints.storeInventory;

  const { data: rawData } = useGetRequest(EP.vehicle_dispatches);
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
      await useCreateRequest(EP.vehicle_dispatches, form);
      toast.success('Created successfully');
      setDialogOpen(false);
      setForm({
        reference: '',
        date: '',
        vehicle: '',
        driver: '',
        route: '',
        distance_km: '',
        fuel_cost: '',
        status: '',
      });
      mutate(EP.vehicle_dispatches);
    } catch (err) {
      toast.error('Failed to create');
    }
  };

  const handleUpdate = async () => {
    try {
      await usePutRequest(EP.vehicle_dispatch_by_id(editingItem.id), form);
      toast.success('Updated successfully');
      setDialogOpen(false);
      setEditingItem(null);
      setForm({
        reference: '',
        date: '',
        vehicle: '',
        driver: '',
        route: '',
        distance_km: '',
        fuel_cost: '',
        status: '',
      });
      mutate(EP.vehicle_dispatches);
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    try {
      await useDeleteRequest(EP.vehicle_dispatch_by_id(deleteId));
      toast.success('Deleted successfully');
      mutate(EP.vehicle_dispatches);
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
      vehicle: item.vehicle || '',
      driver: item.driver || '',
      route: item.route || '',
      distance_km: item.distance_km || '',
      fuel_cost: item.fuel_cost || '',
      status: item.status || '',
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm({
      reference: '',
      date: '',
      vehicle: '',
      driver: '',
      route: '',
      distance_km: '',
      fuel_cost: '',
      status: '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = editingItem ? handleUpdate : handleCreate;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Vehicle Dispatch
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:bus-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{tableData.length}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total Dispatches
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
              {tableData.filter((v) => v.status === 'In Transit').length}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              In Transit
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
                <TableCell>Reference</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Route</TableCell>
                <TableCell>Distance (km)</TableCell>
                <TableCell>Fuel Cost</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((row, idx) => (
                <TableRow key={row.id || idx} hover>
                  <TableCell>{String(row.reference ?? '')}</TableCell>
                  <TableCell>{String(row.date ?? '')}</TableCell>
                  <TableCell>{String(row.vehicle ?? '')}</TableCell>
                  <TableCell>{String(row.driver ?? '')}</TableCell>
                  <TableCell>{String(row.route ?? '')}</TableCell>
                  <TableCell>{String(row.distance_km ?? '')}</TableCell>
                  <TableCell>{String(row.fuel_cost ?? '')}</TableCell>
                  <TableCell>{String(row.status ?? '')}</TableCell>
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
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
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
        <DialogTitle>{editingItem ? 'Edit Vehicle Dispatch' : 'Add Vehicle Dispatch'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Reference"
              fullWidth
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
            />
            <TextField
              label="Date"
              fullWidth
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <TextField
              label="Vehicle"
              fullWidth
              value={form.vehicle}
              onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
            />
            <TextField
              label="Driver"
              fullWidth
              value={form.driver}
              onChange={(e) => setForm({ ...form, driver: e.target.value })}
            />
            <TextField
              label="Route"
              fullWidth
              value={form.route}
              onChange={(e) => setForm({ ...form, route: e.target.value })}
            />
            <TextField
              label="Distance (km)"
              fullWidth
              type="number"
              value={form.distance_km}
              onChange={(e) => setForm({ ...form, distance_km: e.target.value })}
            />
            <TextField
              label="Fuel Cost"
              fullWidth
              type="number"
              value={form.fuel_cost}
              onChange={(e) => setForm({ ...form, fuel_cost: e.target.value })}
            />
            <TextField
              label="Status"
              fullWidth
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
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
