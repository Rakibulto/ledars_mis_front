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
const INITIAL_FORM = {
  voucher_number: '',
  voucher_type: '',
  description: '',
  amount: '',
  date: '',
};
const STATUS_COLOR = {
  Draft: 'default',
  Submitted: 'info',
  Approved: 'success',
  Rejected: 'error',
  Posted: 'primary',
};

export default function VoucherManagementPage() {
  const { data, loading, error } = useGetRequest(EP.vouchers);

  const vouchers = useMemo(() => data?.results || data || [], [data]);

  const createDialog = useBoolean();
  const editDialog = useBoolean();
  const confirm = useBoolean();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const stats = useMemo(
    () => ({
      total: vouchers.length,
      draft: vouchers.filter((v) => v.status === 'Draft').length,
      pending: vouchers.filter((v) => v.status === 'Submitted').length,
      approved: vouchers.filter((v) => v.status === 'Approved' || v.status === 'Posted').length,
    }),
    [vouchers]
  );

  const handleFormChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleEdit = useCallback(
    (item) => {
      setEditingItem(item);
      setFormData({
        voucher_number: item.voucher_number || '',
        voucher_type: item.voucher_type || '',
        description: item.description || '',
        amount: item.amount || '',
        date: item.date || '',
      });
      editDialog.onTrue();
    },
    [editDialog]
  );

  const handleCreateSubmit = useCallback(async () => {
    try {
      await axiosInstance.post(EP.vouchers, formData);
      mutate(EP.vouchers);
      toast.success('Voucher created');
      createDialog.onFalse();
      setFormData(INITIAL_FORM);
    } catch (err) {
      toast.error(err.message || 'Failed to create');
    }
  }, [formData, createDialog]);

  const handleEditSubmit = useCallback(async () => {
    try {
      await axiosInstance.patch(`${EP.vouchers}${editingItem.id}/`, formData);
      mutate(EP.vouchers);
      toast.success('Voucher updated');
      editDialog.onFalse();
    } catch (err) {
      toast.error(err.message || 'Failed to update');
    }
  }, [formData, editingItem, editDialog]);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await axiosInstance.delete(`${EP.vouchers}${deleteId}/`);
      mutate(EP.vouchers);
      toast.success('Voucher deleted');
      confirm.onFalse();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  }, [deleteId, confirm]);

  const handleAction = useCallback(async (id, action) => {
    try {
      const actionMap = {
        Submit: EP.voucher_submit,
        Approve: EP.voucher_approve,
        Reject: EP.voucher_reject,
        Post: EP.voucher_post,
      };
      await axiosInstance.post(actionMap[action](id));
      mutate(EP.vouchers);
      toast.success(`Voucher ${action.toLowerCase()}ed`);
    } catch (err) {
      toast.error(err.message || `Failed to ${action.toLowerCase()}`);
    }
  }, []);

  const renderForm = () => (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <TextField
        name="voucher_number"
        label="Voucher Number"
        value={formData.voucher_number}
        onChange={handleFormChange}
        fullWidth
      />
      <Select
        name="voucher_type"
        value={formData.voucher_type}
        onChange={handleFormChange}
        displayEmpty
        fullWidth
      >
        <MenuItem value="">Select Type</MenuItem>
        {['Payment', 'Receipt', 'Journal', 'Contra'].map((t) => (
          <MenuItem key={t} value={t}>
            {t}
          </MenuItem>
        ))}
      </Select>
      <TextField
        name="description"
        label="Description"
        value={formData.description}
        onChange={handleFormChange}
        fullWidth
        multiline
        rows={2}
      />
      <TextField
        name="amount"
        label="Amount"
        type="number"
        value={formData.amount}
        onChange={handleFormChange}
        fullWidth
      />
      <TextField
        name="date"
        label="Date"
        type="date"
        value={formData.date}
        onChange={handleFormChange}
        fullWidth
        InputLabelProps={{ shrink: true }}
      />
    </Stack>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Voucher Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create, approve, and post vouchers
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={createDialog.onTrue}
        >
          Create Voucher
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Vouchers"
            value={stats.total}
            icon="solar:document-text-bold-duotone"
            color="#2563eb"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Draft"
            value={stats.draft}
            icon="solar:pen-new-square-bold-duotone"
            color="#6b7280"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Pending Approval"
            value={stats.pending}
            icon="solar:clock-circle-bold-duotone"
            color="#f97316"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Approved/Posted"
            value={stats.approved}
            icon="solar:check-circle-bold-duotone"
            color="#10b981"
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
                <TableCell>Voucher #</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vouchers.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{v.voucher_number || v.id}</Typography>
                  </TableCell>
                  <TableCell>{v.voucher_type || '-'}</TableCell>
                  <TableCell>{v.description || '-'}</TableCell>
                  <TableCell>
                    {v.amount ? `UGX ${Number(v.amount).toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={v.status || 'Draft'}
                      size="small"
                      color={STATUS_COLOR[v.status] || 'default'}
                    />
                  </TableCell>
                  <TableCell>{v.date || '-'}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {v.status === 'Draft' && (
                        <Button size="small" onClick={() => handleAction(v.id, 'Submit')}>
                          Submit
                        </Button>
                      )}
                      {v.status === 'Submitted' && (
                        <>
                          <Button
                            size="small"
                            color="success"
                            onClick={() => handleAction(v.id, 'Approve')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleAction(v.id, 'Reject')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {v.status === 'Approved' && (
                        <Button size="small" onClick={() => handleAction(v.id, 'Post')}>
                          Post
                        </Button>
                      )}
                      <IconButton size="small" onClick={() => handleEdit(v)}>
                        <Iconify icon="solar:pen-bold" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setDeleteId(v.id);
                          confirm.onTrue();
                        }}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {vouchers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No vouchers found
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
        title="Delete Voucher"
        content="Are you sure you want to delete this voucher?"
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
          title: 'Create Voucher',
          onSubmit: handleCreateSubmit,
        },
        {
          open: editDialog.value,
          onClose: editDialog.onFalse,
          title: 'Edit Voucher',
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
