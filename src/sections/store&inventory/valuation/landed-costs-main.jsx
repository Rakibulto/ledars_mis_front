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
  Divider,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Pagination,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
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

const EP = endpoints.storeInventory;
const DEFAULT_FORM = {
  reference: '',
  date: '',
  grn_reference: '',
  vendor: '',
  product_cost: '',
  freight: '',
  customs: '',
  total_landed: '',
  status: '',
};

const normalizeStatus = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const toAmount = (value) => Number(value || 0);

const formatCurrency = (value) => `BDT ${toAmount(value).toLocaleString()}`;

const getStatusTone = (status) => {
  switch (normalizeStatus(status)) {
    case 'posted':
    case 'approved':
      return { bgcolor: '#d1fae5', color: '#065f46' };
    case 'draft':
      return { bgcolor: '#f3f4f6', color: '#374151' };
    default:
      return { bgcolor: '#fef3c7', color: '#92400e' };
  }
};

export default function LandedCostsMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [dense, setDense] = useState(false);
  const [selectedCostId, setSelectedCostId] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [deleteId, setDeleteId] = useState(null);
  const confirm = useBoolean();

  const { data: rawData } = useGetRequest(EP.landed_costs);
  const LANDED_COSTS = Array.isArray(rawData) ? rawData : rawData?.results || [];
  const tableData = LANDED_COSTS;

  const handleCreate = async () => {
    try {
      await createRequest(EP.landed_costs, form);
      toast.success('Created successfully');
      setDialogOpen(false);
      setForm(DEFAULT_FORM);
      mutate(EP.landed_costs);
    } catch (err) {
      toast.error('Failed to create');
    }
  };

  const handleUpdate = async () => {
    try {
      await updateRequest(EP.landed_cost_by_id(editingItem.id), form);
      toast.success('Updated successfully');
      setDialogOpen(false);
      setEditingItem(null);
      setForm(DEFAULT_FORM);
      mutate(EP.landed_costs);
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRequest(EP.landed_cost_by_id(deleteId));
      toast.success('Deleted successfully');
      mutate(EP.landed_costs);
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
      grn_reference: item.grn_reference || '',
      vendor: item.vendor || '',
      product_cost: item.product_cost || '',
      freight: item.freight || '',
      customs: item.customs || '',
      total_landed: item.total_landed || '',
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

  const filtered = useMemo(() => {
    if (!searchTerm) return tableData;
    return tableData.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, tableData]);

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const selectedCost = filtered.find((row) => row.id === selectedCostId) || filtered[0] || null;

  const landedSummary = useMemo(
    () => ({
      posted: tableData.filter((row) => normalizeStatus(row.status) === 'posted').length,
      draft: tableData.filter((row) => normalizeStatus(row.status) === 'draft').length,
      highOverhead: tableData.filter((row) => {
        const overhead = toAmount(row.freight) + toAmount(row.customs);
        const total = toAmount(row.total_landed);
        return total > 0 && overhead / total >= 0.3;
      }).length,
      total: tableData.reduce((sum, row) => sum + toAmount(row.total_landed), 0),
    }),
    [tableData]
  );

  const selectedOverhead = selectedCost
    ? toAmount(selectedCost.freight) + toAmount(selectedCost.customs)
    : 0;

  const selectedOverheadShare =
    selectedCost && toAmount(selectedCost.total_landed) > 0
      ? Math.round((selectedOverhead / toAmount(selectedCost.total_landed)) * 100)
      : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Landed Costs
      </Typography>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        The landed cost desk should show which receipts still need cost allocation, which posted
        cost sheets carry unusually high overhead, and where finance needs to verify freight and
        customs composition before stock value is finalized.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:calculator-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{LANDED_COSTS.length}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Total Records
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify
              icon="solar:check-circle-bold-duotone"
              width={40}
              sx={{ mb: 1, color: 'primary.main' }}
            />
            <Typography variant="h4">{landedSummary.posted}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Posted Sheets
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
            <Typography variant="h4">{formatCurrency(landedSummary.total)}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Allocated Value
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 2, borderRadius: 3, border: '1px solid #e5e7eb' }}>
            <Stack
              direction="row"
              spacing={2}
              sx={{ mb: 2 }}
              alignItems="center"
              justifyContent="space-between"
            >
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
              <Table size={dense ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
                    <TableCell>Reference</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>GRN Ref</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Total Landed</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((row, idx) => (
                    <TableRow
                      key={row.id || idx}
                      hover
                      selected={row.id === selectedCost?.id}
                      onClick={() => setSelectedCostId(row.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{String(row.reference ?? '')}</TableCell>
                      <TableCell>{String(row.date ?? '')}</TableCell>
                      <TableCell>{String(row.grn_reference ?? '')}</TableCell>
                      <TableCell>{String(row.vendor ?? '')}</TableCell>
                      <TableCell>{formatCurrency(row.total_landed)}</TableCell>
                      <TableCell>
                        <Chip
                          label={String(row.status || 'Unknown')}
                          size="small"
                          sx={{
                            bgcolor: getStatusTone(row.status).bgcolor,
                            color: getStatusTone(row.status).color,
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEdit(row);
                          }}
                          color="primary"
                        >
                          <Iconify icon="solar:pen-bold" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteId(row.id);
                            confirm.onTrue();
                          }}
                          color="error"
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
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
                  onChange={(e, v) => setPage(v)}
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
                  Selected Cost Review
                </Typography>
                {selectedCost ? (
                  <Stack spacing={1.5}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedCost.reference || 'Landed cost sheet'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedCost.vendor || 'Vendor not captured'}
                      </Typography>
                    </Box>

                    <Chip
                      label={selectedCost.status || 'Unknown'}
                      size="small"
                      sx={{
                        width: 'fit-content',
                        bgcolor: getStatusTone(selectedCost.status).bgcolor,
                        color: getStatusTone(selectedCost.status).color,
                        fontWeight: 700,
                      }}
                    />

                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          GRN: {selectedCost.grn_reference || 'N/A'}
                        </Alert>
                      </Grid>
                      <Grid item xs={6}>
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                          OH: {selectedOverheadShare}%
                        </Alert>
                      </Grid>
                    </Grid>

                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Cost structure
                      </Typography>
                      <Stack spacing={1}>
                        <Typography variant="body2" color="text.secondary">
                          Product cost: {formatCurrency(selectedCost.product_cost)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Freight: {formatCurrency(selectedCost.freight)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Customs: {formatCurrency(selectedCost.customs)}
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          Total landed: {formatCurrency(selectedCost.total_landed)}
                        </Typography>
                      </Stack>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Next control action
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {normalizeStatus(selectedCost.status) === 'posted'
                          ? 'This sheet is posted. Confirm that the landed allocation is reflected in stock valuation layers and close the receipt review.'
                          : selectedOverheadShare >= 30
                            ? 'Overhead is unusually high. Verify freight and customs split before the landed amount is posted into inventory value.'
                            : 'This cost sheet is still pending. Review the GRN match, validate vendor charges, and post once allocation is complete.'}
                      </Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a landed cost record to review allocation quality and next actions.
                  </Typography>
                )}
              </Box>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Cost Control Queue
                </Typography>
                <Stack spacing={1.5}>
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    {landedSummary.draft} sheet(s) still waiting to be posted into stock value.
                  </Alert>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    {landedSummary.highOverhead} record(s) carry overhead above 30% of landed total.
                  </Alert>
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    {landedSummary.posted} posted sheet(s) are ready for audit trail confirmation.
                  </Alert>
                </Stack>
              </Box>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Landed Cost' : 'Add Landed Cost'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Reference"
              size="small"
              fullWidth
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
            />
            <TextField
              label="Date"
              size="small"
              fullWidth
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <TextField
              label="GRN Reference"
              size="small"
              fullWidth
              value={form.grn_reference}
              onChange={(e) => setForm({ ...form, grn_reference: e.target.value })}
            />
            <TextField
              label="Vendor"
              size="small"
              fullWidth
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
            />
            <TextField
              label="Product Cost"
              size="small"
              fullWidth
              type="number"
              value={form.product_cost}
              onChange={(e) => setForm({ ...form, product_cost: e.target.value })}
            />
            <TextField
              label="Freight"
              size="small"
              fullWidth
              type="number"
              value={form.freight}
              onChange={(e) => setForm({ ...form, freight: e.target.value })}
            />
            <TextField
              label="Customs"
              size="small"
              fullWidth
              type="number"
              value={form.customs}
              onChange={(e) => setForm({ ...form, customs: e.target.value })}
            />
            <TextField
              label="Total Landed"
              size="small"
              fullWidth
              type="number"
              value={form.total_landed}
              onChange={(e) => setForm({ ...form, total_landed: e.target.value })}
            />
            <TextField
              label="Status"
              size="small"
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

      {/* Confirm Delete Dialog */}
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
