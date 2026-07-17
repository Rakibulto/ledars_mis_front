'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import { Bar, XAxis, YAxis, Legend, Tooltip, BarChart, ResponsiveContainer } from 'recharts';

import {
  Box,
  Card,
  Grid,
  Chip,
  Stack,
  Table,
  Button,
  Dialog,
  Select,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  InputLabel,
  IconButton,
  Typography,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  LinearProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import SummaryCard from '../../_components/summary-card';

const EP = endpoints.beneficiaries;

const INITIAL_FORM = { indicator: '', baseline: '', current: '', target: '', unit: '', status: '' };

export default function OutcomeIndicatorsMain() {
  const { data: rawData, loading } = useGetRequest(EP.outcome_indicators);
  const OUTCOME_INDICATORS = Array.isArray(rawData) ? rawData : rawData?.results || [];

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
      await axiosInstance.post(EP.outcome_indicators, formData);
      toast.success('Indicator created');
      mutate(EP.outcome_indicators);
      createDialog.onFalse();
      setFormData(INITIAL_FORM);
    } catch (err) {
      toast.error('Failed to create indicator');
    }
  }, [formData, createDialog]);

  const handleEdit = (row) => {
    setEditingItem(row);
    setFormData({
      indicator: row.indicator || '',
      baseline: row.baseline || '',
      current: row.current || '',
      target: row.target || '',
      unit: row.unit || '',
      status: row.status || '',
    });
    editDialog.onTrue();
  };

  const handleEditSubmit = useCallback(async () => {
    try {
      await axiosInstance.patch(`${EP.outcome_indicators}${editingItem.id}/`, formData);
      toast.success('Indicator updated');
      mutate(EP.outcome_indicators);
      editDialog.onFalse();
      setEditingItem(null);
      setFormData(INITIAL_FORM);
    } catch (err) {
      toast.error('Failed to update indicator');
    }
  }, [formData, editDialog, editingItem]);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await axiosInstance.delete(`${EP.outcome_indicators}${deleteId}/`);
      toast.success('Indicator deleted');
      mutate(EP.outcome_indicators);
    } catch (err) {
      toast.error('Failed to delete indicator');
    }
    confirm.onFalse();
  }, [deleteId, confirm]);

  const avgProgress = OUTCOME_INDICATORS.length
    ? Math.round(
        OUTCOME_INDICATORS.reduce(
          (s, i) => s + ((i.current - i.baseline) / (i.target - i.baseline)) * 100,
          0
        ) / OUTCOME_INDICATORS.length
      )
    : 0;

  const chartData = OUTCOME_INDICATORS.map((i) => ({
    name: i.indicator.length > 25 ? `${i.indicator.substring(0, 25)}...` : i.indicator,
    Baseline: i.baseline,
    Current: i.current,
    Target: i.target,
  }));

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
            Outcome Indicators
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Track baseline, current, and target values for key program outcomes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={createDialog.onTrue}
        >
          Add Indicator
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Total Indicators"
            value={OUTCOME_INDICATORS.length}
            icon="solar:chart-2-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Avg. Progress"
            value={`${avgProgress}%`}
            icon="solar:graph-up-bold"
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="On Track"
            value={OUTCOME_INDICATORS.filter((i) => i.current >= i.target * 0.8).length}
            icon="solar:check-circle-bold"
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Indicator Progress Chart
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 30 }}>
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Baseline" fill="#FF6384" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Current" fill="#36A2EB" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Target" fill="#4BC0C0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Indicator</TableCell>
                    <TableCell align="center">Baseline</TableCell>
                    <TableCell align="center">Current</TableCell>
                    <TableCell align="center">Target</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {OUTCOME_INDICATORS.map((row) => {
                    const progress = Math.round(
                      ((row.current - row.baseline) / (row.target - row.baseline)) * 100
                    );
                    const onTrack = row.current >= row.target * 0.8;
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Typography variant="subtitle2">{row.indicator}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          {row.baseline}
                          {row.unit}
                        </TableCell>
                        <TableCell align="center">
                          <Typography fontWeight="bold">
                            {row.current}
                            {row.unit}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {row.target}
                          {row.unit}
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5} sx={{ minWidth: 120 }}>
                            <Typography variant="caption">{Math.min(progress, 100)}%</Typography>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(progress, 100)}
                              color={onTrack ? 'success' : 'warning'}
                              sx={{ height: 6, borderRadius: 1 }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.status || (onTrack ? 'On Track' : 'Needs Attention')}
                            size="small"
                            color={
                              row.status === 'Active' || row.status === 'Approved'
                                ? 'success'
                                : row.status === 'Completed'
                                  ? 'primary'
                                  : row.status === 'Draft'
                                    ? 'warning'
                                    : row.status === 'Inactive'
                                      ? 'error'
                                      : onTrack
                                        ? 'success'
                                        : 'warning'
                            }
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleEdit(row)}
                            >
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
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Indicator"
        content="Are you sure you want to delete this indicator?"
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
          title: 'Add Indicator',
          onSubmit: handleCreateSubmit,
          btnLabel: 'Create',
        },
        {
          open: editDialog.value,
          onClose: editDialog.onFalse,
          title: 'Edit Indicator',
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
                label="Indicator Name"
                name="indicator"
                value={formData.indicator}
                onChange={handleFormChange}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="Baseline"
                  name="baseline"
                  type="number"
                  value={formData.baseline}
                  onChange={handleFormChange}
                />
                <TextField
                  fullWidth
                  label="Current"
                  name="current"
                  type="number"
                  value={formData.current}
                  onChange={handleFormChange}
                />
                <TextField
                  fullWidth
                  label="Target"
                  name="target"
                  type="number"
                  value={formData.target}
                  onChange={handleFormChange}
                />
              </Stack>
              <TextField
                fullWidth
                label="Unit (e.g. %, ৳)"
                name="unit"
                value={formData.unit}
                onChange={handleFormChange}
              />

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  label="Status"
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Draft">Draft</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
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
