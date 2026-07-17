'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
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
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import SummaryCard from '../../_components/summary-card';

const EP = endpoints.beneficiaries;

const INITIAL_FORM = {
  activity_name: '',
  program: '',
  total_beneficiaries: '',
  sessions_completed: '',
  attendance_rate: '',
  dropout_rate: '',
  last_session: '',
};

export default function AttendanceTrackerMain() {
  const { data: rawData, loading } = useGetRequest(EP.attendance_tracker);
  const ATTENDANCE_TRACKER = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const createDialog = useBoolean();
  const editDialog = useBoolean();
  const confirm = useBoolean();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    try {
      await axiosInstance.post(EP.attendance_tracker, formData);
      toast.success('Attendance record created');
      mutate(EP.attendance_tracker);
      createDialog.onFalse();
      setFormData(INITIAL_FORM);
    } catch (err) {
      toast.error('Failed to create record');
    }
  }, [formData, createDialog]);

  const handleEdit = (row) => {
    setEditingItem(row);
    setFormData({
      activity_name: row.activity_name || '',
      program: row.program || '',
      total_beneficiaries: row.total_beneficiaries || '',
      sessions_completed: row.sessions_completed || '',
      attendance_rate: row.attendance_rate || '',
      dropout_rate: row.dropout_rate || '',
      last_session: row.last_session || '',
    });
    editDialog.onTrue();
  };

  const handleEditSubmit = useCallback(async () => {
    try {
      await axiosInstance.patch(`${EP.attendance_tracker}${editingItem.id}/`, formData);
      toast.success('Record updated');
      mutate(EP.attendance_tracker);
      editDialog.onFalse();
      setEditingItem(null);
      setFormData(INITIAL_FORM);
    } catch (err) {
      toast.error('Failed to update record');
    }
  }, [formData, editDialog, editingItem]);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await axiosInstance.delete(`${EP.attendance_tracker}${deleteId}/`);
      toast.success('Record deleted');
      mutate(EP.attendance_tracker);
    } catch (err) {
      toast.error('Failed to delete record');
    }
    confirm.onFalse();
  }, [deleteId, confirm]);

  const avgRate = ATTENDANCE_TRACKER.length
    ? Math.round(
        ATTENDANCE_TRACKER.reduce((s, a) => s + a.attendance_rate, 0) / ATTENDANCE_TRACKER.length
      )
    : 0;
  const totalBeneficiaries = ATTENDANCE_TRACKER.reduce((s, a) => s + a.total_beneficiaries, 0);
  const avgDropout = ATTENDANCE_TRACKER.length
    ? (
        ATTENDANCE_TRACKER.reduce((s, a) => s + a.dropout_rate, 0) / ATTENDANCE_TRACKER.length
      ).toFixed(1)
    : 0;

  const rateColor = (rate) => {
    if (rate >= 85) return 'success';
    if (rate >= 70) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        sx={{ mb: 1 }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Attendance Tracker
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Monitor beneficiary attendance across activities and programs
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={createDialog.onTrue}
        >
          Add Record
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Activities Tracked"
            value={ATTENDANCE_TRACKER.length}
            icon="solar:clipboard-list-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Avg Attendance Rate"
            value={`${avgRate}%`}
            icon="solar:check-circle-bold"
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Beneficiaries"
            value={totalBeneficiaries}
            icon="solar:users-group-rounded-bold"
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Avg Dropout Rate"
            value={`${avgDropout}%`}
            icon="solar:logout-bold"
            color="error"
          />
        </Grid>
      </Grid>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Activity</TableCell>
                <TableCell>Program</TableCell>
                <TableCell align="center">Total</TableCell>
                <TableCell align="center">Sessions</TableCell>
                <TableCell>Attendance Rate</TableCell>
                <TableCell align="center">Dropout</TableCell>
                <TableCell>Last Session</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ATTENDANCE_TRACKER.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Typography fontWeight="bold">{row.activity_name}</Typography>
                  </TableCell>
                  <TableCell>{row.program}</TableCell>
                  <TableCell align="center">{row.total_beneficiaries}</TableCell>
                  <TableCell align="center">{row.sessions_completed}</TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption">{row.attendance_rate}%</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={row.attendance_rate}
                        color={rateColor(row.attendance_rate)}
                        sx={{ height: 6, borderRadius: 1 }}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${row.dropout_rate}%`}
                      size="small"
                      color={row.dropout_rate > 5 ? 'error' : 'success'}
                    />
                  </TableCell>
                  <TableCell>{row.last_session}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <IconButton size="small" color="warning" onClick={() => handleEdit(row)}>
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
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Record"
        content="Are you sure you want to delete this attendance record?"
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
          title: 'Add Attendance Record',
          onSubmit: handleCreateSubmit,
          btnLabel: 'Create',
        },
        {
          open: editDialog.value,
          onClose: editDialog.onFalse,
          title: 'Edit Attendance Record',
          onSubmit: handleEditSubmit,
          btnLabel: 'Update',
        },
      ].map((dlg) => (
        <Dialog key={dlg.title} open={dlg.open} onClose={dlg.onClose} fullWidth maxWidth="sm">
          <DialogTitle>{dlg.title}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Activity Name"
                name="activity_name"
                value={formData.activity_name}
                onChange={handleFormChange}
              />
              <TextField
                fullWidth
                label="Program"
                name="program"
                value={formData.program}
                onChange={handleFormChange}
              />
              <TextField
                fullWidth
                label="Total Beneficiaries"
                name="total_beneficiaries"
                type="number"
                value={formData.total_beneficiaries}
                onChange={handleFormChange}
              />
              <TextField
                fullWidth
                label="Sessions Completed"
                name="sessions_completed"
                type="number"
                value={formData.sessions_completed}
                onChange={handleFormChange}
              />
              <TextField
                fullWidth
                label="Attendance Rate (%)"
                name="attendance_rate"
                type="number"
                value={formData.attendance_rate}
                onChange={handleFormChange}
              />
              <TextField
                fullWidth
                label="Dropout Rate (%)"
                name="dropout_rate"
                type="number"
                value={formData.dropout_rate}
                onChange={handleFormChange}
              />
              <TextField
                fullWidth
                label="Last Session"
                name="last_session"
                type="date"
                value={formData.last_session}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" color="inherit" onClick={dlg.onClose}>
              Cancel
            </Button>
            <Button variant="contained" onClick={dlg.onSubmit}>
              {dlg.btnLabel}
            </Button>
          </DialogActions>
        </Dialog>
      ))}
    </Box>
  );
}
