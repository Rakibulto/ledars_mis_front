'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Table,
  Button,
  Dialog,
  Switch,
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
  FormControlLabel,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePutRequest as updateRequest,
  useCreateRequest as createRequest,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

const DEFAULT_FORM = {
  number: '',
  product_name: '',
  type: '',
  quantity: '',
  expiry_date: '',
  manufacture_date: '',
  supplier: '',
  status: '',
};

const normalizeText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

export default function LotSerialNumbersMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const rowsPerPage = 10;
  const confirm = useBoolean();
  const EP = endpoints.storeInventory;

  const { data: rawData } = useGetRequest(EP.lot_serials);
  const lotSerialNumbers = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const filtered = useMemo(() => {
    if (!searchTerm) return lotSerialNumbers;
    return lotSerialNumbers.filter((row) =>
      Object.values(row).some((val) => normalizeText(val).includes(normalizeText(searchTerm)))
    );
  }, [lotSerialNumbers, searchTerm]);

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const selectedItem = filtered.find((row) => row.id === selectedItemId) || filtered[0] || null;

  const traceabilityControls = useMemo(
    () => ({
      total: lotSerialNumbers.length,
      lots: lotSerialNumbers.filter((row) => normalizeText(row.type) === 'lot').length,
      serials: lotSerialNumbers.filter((row) => normalizeText(row.type) === 'serial').length,
      blocked: lotSerialNumbers.filter((row) => normalizeText(row.status).includes('block')).length,
      expiring: lotSerialNumbers.filter((row) => {
        if (!row.expiry_date) return false;
        return new Date(row.expiry_date) <= new Date('2025-06-30');
      }).length,
    }),
    [lotSerialNumbers]
  );

  const handleCreate = async () => {
    try {
      await createRequest(EP.lot_serials, form);
      toast.success('Created successfully');
      setDialogOpen(false);
      setForm(DEFAULT_FORM);
      mutate(EP.lot_serials);
    } catch {
      toast.error('Failed to create');
    }
  };

  const handleUpdate = async () => {
    try {
      await updateRequest(EP.lot_serial_by_id(editingItem.id), form);
      toast.success('Updated successfully');
      setDialogOpen(false);
      setEditingItem(null);
      setForm(DEFAULT_FORM);
      mutate(EP.lot_serials);
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRequest(EP.lot_serial_by_id(deleteId));
      toast.success('Deleted successfully');
      mutate(EP.lot_serials);
    } catch {
      toast.error('Failed to delete');
    } finally {
      confirm.onFalse();
      setDeleteId(null);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      number: item.number || '',
      product_name: item.product_name || '',
      type: item.type || '',
      quantity: item.quantity || '',
      expiry_date: item.expiry_date || '',
      manufacture_date: item.manufacture_date || '',
      supplier: item.supplier || '',
      status: item.status || '',
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm(DEFAULT_FORM);
    setDialogOpen(true);
  };

  const handleSubmit = editingItem ? handleUpdate : handleCreate;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4">Lots / Serial Numbers</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={openCreate}
        >
          Add New
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        The traceability desk should show the selected lot or serial, highlight expiring or blocked
        records, and keep edit actions close to movement review work.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:tag-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{traceabilityControls.total}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:layers-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'info.main' }}
            />
            <Typography variant="h4">{traceabilityControls.lots}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Lots
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:hashtag-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'secondary.main' }}
            />
            <Typography variant="h4">{traceabilityControls.serials}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Serials
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:danger-triangle-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'warning.main' }}
            />
            <Typography variant="h4">{traceabilityControls.expiring}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Expiring
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:shield-warning-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'error.main' }}
            />
            <Typography variant="h4">{traceabilityControls.blocked}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Blocked
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 2, borderRadius: 3, border: '1px solid #e5e7eb' }}>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                size="small"
                placeholder="Search lot or serial..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:magnifer-bold-duotone" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 320 }}
              />
            </Stack>

            <TableContainer>
              <Table size={dense ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
                    <TableCell>Number</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Expiry</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      selected={row.id === selectedItem?.id}
                      onClick={() => setSelectedItemId(row.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{row.number}</TableCell>
                      <TableCell>{row.product_name}</TableCell>
                      <TableCell>{row.type}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell>{row.expiry_date || 'N/A'}</TableCell>
                      <TableCell>{row.supplier || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.status || 'Unknown'}
                          size="small"
                          sx={{
                            bgcolor: normalizeText(row.status).includes('block')
                              ? '#fee2e2'
                              : '#ecfdf5',
                            color: normalizeText(row.status).includes('block')
                              ? '#991b1b'
                              : '#065f46',
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" onClick={(event) => event.stopPropagation()}>
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

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch checked={dense} onChange={(event) => setDense(event.target.checked)} />
                }
                label="Dense"
              />
              {filtered.length > rowsPerPage && (
                <Pagination
                  count={Math.ceil(filtered.length / rowsPerPage)}
                  page={page}
                  onChange={(event, value) => setPage(value)}
                  color="primary"
                />
              )}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Selected Record Review
                </Typography>
                {selectedItem ? (
                  <Stack spacing={1.5}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedItem.number}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedItem.product_name}
                      </Typography>
                    </Box>
                    <Chip
                      label={selectedItem.status || 'Unknown'}
                      size="small"
                      sx={{
                        width: 'fit-content',
                        bgcolor: normalizeText(selectedItem.status).includes('block')
                          ? '#fee2e2'
                          : '#ecfdf5',
                        color: normalizeText(selectedItem.status).includes('block')
                          ? '#991b1b'
                          : '#065f46',
                        fontWeight: 700,
                      }}
                    />
                    <Alert
                      severity={traceabilityControls.expiring ? 'warning' : 'info'}
                      sx={{ borderRadius: 2 }}
                    >
                      Expiry: {selectedItem.expiry_date || 'Not set'} | Qty:{' '}
                      {selectedItem.quantity || 0}
                    </Alert>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#eff6ff' }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Movement Context
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Supplier: {selectedItem.supplier || 'Unknown'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Manufacture Date: {selectedItem.manufacture_date || 'Not set'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Traceability Type: {selectedItem.type || 'N/A'}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      onClick={() => handleEdit(selectedItem)}
                      sx={{ textTransform: 'none' }}
                    >
                      Edit Selected Record
                    </Button>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a lot or serial to review traceability details.
                  </Typography>
                )}
              </Box>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Traceability Control Queue
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fff7ed' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Expiring Records
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {traceabilityControls.expiring} records should be reviewed for FEFO or recall
                      action.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fef2f2' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Blocked Records
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {traceabilityControls.blocked} records are blocked and need release or
                      investigation.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#eff6ff' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Lots
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {traceabilityControls.lots} lot-controlled records are active in stock.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f5f3ff' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Serials
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {traceabilityControls.serials} serial-controlled records are available for
                      tracing.
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Lot/Serial' : 'Add New Lot/Serial'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Number"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name"
                value={form.product_name}
                onChange={(e) => setForm({ ...form, product_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Manufacture Date"
                type="date"
                value={form.manufacture_date}
                onChange={(e) => setForm({ ...form, manufacture_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingItem ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure you want to delete this record?"
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
