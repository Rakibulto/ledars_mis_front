'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useMemo, useState, useCallback } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Box,
  Card,
  Chip,
  Grid,
  Table,
  Stack,
  Button,
  Dialog,
  Select,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
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

const INITIAL_FORM = {
  indicator: '',
  baseline: '',
  current: '',
  target: '',
  unit: '%',
  status: 'On Track',
};

// Custom tooltip for chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Card
        sx={{
          p: 2,
          border: '1px solid #e5e7eb',
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <Typography variant="body2" fontWeight={600} mb={1}>
          {label}
        </Typography>
        {payload.map((entry, index) => (
          <Typography key={index} variant="caption" display="block" sx={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </Typography>
        ))}
      </Card>
    );
  }
  return null;
};

// Calculate progress percentage
const calculateProgress = (baseline, current, target) => {
  if (baseline === target) return 100;
  const progress = ((current - baseline) / (target - baseline)) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

// Get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'On Track':
      return { bg: '#dbeafe', color: '#1e40af' };
    case 'Moderate':
      return { bg: '#fed7aa', color: '#92400e' };
    case 'At Risk':
      return { bg: '#fee2e2', color: '#991b1b' };
    default:
      return { bg: '#f3f4f6', color: '#6b7280' };
  }
};

// Format value with unit
const formatValue = (value, unit) => {
  if (unit === '৳') {
    return `৳${value.toLocaleString()}`;
  }
  if (unit === '%') {
    return `${value}%`;
  }
  return `${value}${unit}`;
};

export default function ImpactMeasurementMain() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data, loading, error } = useGetRequest(EP.impact_measurement || '/api/impact');

  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
  } = useGetRequest(EP.impact_measurement_summary || '/api/impact_measurements/summary/');

  const createDialog = useBoolean();
  const editDialog = useBoolean();
  const confirm = useBoolean();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const handleFormChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleEdit = useCallback(
    (item) => {
      setEditingItem(item);
      setFormData({
        indicator: item.indicator || '',
        baseline: item.baseline ?? '',
        current: item.current ?? '',
        target: item.target ?? '',
        unit: item.unit || '%',
        status: item.status || 'On Track',
      });
      editDialog.onTrue();
    },
    [editDialog]
  );

  const handleCreateSubmit = useCallback(async () => {
    try {
      await axiosInstance.post(EP.impact_measurement, formData);
      mutate(EP.impact_measurement);
      mutate(EP.impact_measurement_summary);
      toast.success('Indicator created');
      createDialog.onFalse();
      setFormData(INITIAL_FORM);
    } catch (err) {
      toast.error(err.message || 'Failed to create');
    }
  }, [formData, createDialog]);

  const handleEditSubmit = useCallback(async () => {
    try {
      await axiosInstance.patch(`${EP.impact_measurement}${editingItem.id}/`, formData);
      mutate(EP.impact_measurement);
      mutate(EP.impact_measurement_summary);
      toast.success('Indicator updated');
      editDialog.onFalse();
      setEditingItem(null);
      setFormData(INITIAL_FORM);
    } catch (err) {
      toast.error(err.message || 'Failed to update');
    }
  }, [formData, editingItem, editDialog]);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await axiosInstance.delete(`${EP.impact_measurement}${deleteId}/`);
      mutate(EP.impact_measurement);
      mutate(EP.impact_measurement_summary);
      toast.success('Indicator deleted');
      confirm.onFalse();
      setDeleteId(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  }, [deleteId, confirm]);

  // Use API data directly
  const impactTrend = useMemo(() => data?.trend || data?.results || [], [data]);
  const outcomeIndicators = useMemo(() => {
    const indicators = data?.indicators || [];
    return indicators;
  }, [data]);
  const summaryData = useMemo(() => summary || {}, [summary]);

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#fafafa' }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={{ xs: 2, sm: 0 }}
        mb={3}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            color="#1a1a1a"
            gutterBottom
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            }}
          >
            Impact Measurement & Outcomes
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.875rem', sm: '0.9rem', md: '1rem' },
            }}
          >
            Track and measure program impact and beneficiary outcomes
          </Typography>
        </Box>

        {/* Buttons */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1, sm: 2 }}
          width={{ xs: '100%', sm: 'auto' }}
        >
          <Button
            variant="outlined"
            startIcon={!isMobile ? <Iconify icon="solar:download-minimalistic-bold" /> : null}
            fullWidth={{ xs: true, sm: false }}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: { xs: 2, sm: 3 },
              py: { xs: 1.2, sm: 1 },
              fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
              borderColor: '#d1d5db',
              color: '#374151',
              '&:hover': {
                borderColor: '#9ca3af',
                bgcolor: '#f9fafb',
              },
            }}
          >
            {isMobile ? 'Export' : 'Export Report'}
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              setFormData(INITIAL_FORM);
              createDialog.onTrue();
            }}
            startIcon={!isMobile ? <Iconify icon="mingcute:add-line" /> : null}
            fullWidth={{ xs: true, sm: false }}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: { xs: 2, sm: 3 },
              py: { xs: 1.2, sm: 1 },
              fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            {isMobile ? 'Add' : 'Add Indicator'}
          </Button>
        </Stack>
      </Stack>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Total Beneficiaries"
            value={summaryData?.total_beneficiaries ?? 1245}
            subtitle="Reached in Dec 2025"
            icon="solar:users-group-rounded-bold-duotone"
            bgcolor="#3b82f6"
            boxShadow="0 4px 20px rgba(59, 130, 246, 0.3)"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Positive Outcomes"
            value={`${summaryData?.positive_outcomes ?? 87}%`}
            subtitle="Above baseline"
            icon="solar:chart-2-bold-duotone"
            bgcolor="#10b981"
            boxShadow="0 4px 20px rgba(16, 185, 129, 0.3)"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Target Achievement"
            value={`${summaryData?.target_achievement ?? 74}%`}
            subtitle="On track to goals"
            icon="solar:target-bold-duotone"
            bgcolor="#a855f7"
            boxShadow="0 4px 20px rgba(168, 85, 247, 0.3)"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Active Programs"
            value={summaryData?.active_programs ?? 12}
            subtitle="Intervention areas"
            icon="solar:chart-bold-duotone"
            bgcolor="#f97316"
            boxShadow="0 4px 20px rgba(249, 115, 22, 0.3)"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
      </Grid>

      {/* Impact Trend by Sector */}
      <Card
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
        }}
      >
        <Typography variant="h6" fontWeight={600} color="#1a1a1a" gutterBottom>
          Impact Trend by Sector
        </Typography>
        <Box sx={{ width: '100%', height: 350, mt: 2 }}>
          <ResponsiveContainer>
            <LineChart data={impactTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} iconType="circle" />
              <Line
                type="monotone"
                dataKey="education"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Education"
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="health"
                stroke="#10b981"
                strokeWidth={2}
                name="Health"
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="livelihood"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Livelihood"
                dot={{ fill: '#f59e0b', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="wash"
                stroke="#a855f7"
                strokeWidth={2}
                name="WASH"
                dot={{ fill: '#a855f7', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Card>

      {/* Outcome Indicators Performance */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb' }}>
          <Typography variant="h6" fontWeight={600} color="#1a1a1a">
            Outcome Indicators Performance
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Indicator
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                >
                  Baseline
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                >
                  Current
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                >
                  Target
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Progress
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                >
                  Status
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {outcomeIndicators.map((indicator) => {
                const progress = calculateProgress(
                  indicator.baseline,
                  indicator.current,
                  indicator.target
                );
                const statusColor = getStatusColor(indicator.status);

                return (
                  <TableRow
                    key={indicator.id}
                    sx={{
                      '&:hover': {
                        bgcolor: '#f9fafb',
                      },
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    {/* Indicator Name */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={500} color="#1a1a1a">
                        {indicator.indicator}
                      </Typography>
                    </TableCell>

                    {/* Baseline */}
                    <TableCell align="center">
                      <Typography variant="body2" color="#6b7280">
                        {formatValue(indicator.baseline, indicator.unit)}
                      </Typography>
                    </TableCell>

                    {/* Current */}
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={600} color="#1a1a1a">
                        {formatValue(indicator.current, indicator.unit)}
                      </Typography>
                    </TableCell>

                    {/* Target */}
                    <TableCell align="center">
                      <Typography variant="body2" color="#6b7280">
                        {formatValue(indicator.target, indicator.unit)}
                      </Typography>
                    </TableCell>

                    {/* Progress Bar */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flexGrow: 1, minWidth: 100 }}>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                              height: 8,
                              borderRadius: 1,
                              bgcolor: '#e5e7eb',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: progress >= 80 ? '#3b82f6' : '#f59e0b',
                                borderRadius: 1,
                              },
                            }}
                          />
                        </Box>
                        <Typography variant="caption" fontWeight={600} color="#1a1a1a">
                          {Math.round(progress)}%
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Status */}
                    <TableCell align="center">
                      <Chip
                        label={indicator.status}
                        size="small"
                        sx={{
                          bgcolor: statusColor.bg,
                          color: statusColor.color,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEdit(indicator)}>
                        <Iconify icon="solar:pen-bold" width={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setDeleteId(indicator.id);
                          confirm.onTrue();
                        }}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Delete Confirmation */}
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

      {/* Create / Edit Dialogs */}
      {[
        {
          open: createDialog.value,
          onClose: createDialog.onFalse,
          title: 'Add Indicator',
          onSubmit: handleCreateSubmit,
        },
        {
          open: editDialog.value,
          onClose: editDialog.onFalse,
          title: 'Edit Indicator',
          onSubmit: handleEditSubmit,
        },
      ].map((dlg) => (
        <Dialog key={dlg.title} open={dlg.open} onClose={dlg.onClose} maxWidth="sm" fullWidth>
          <DialogTitle>{dlg.title}</DialogTitle>
          <DialogContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}
          >
            <TextField
              label="Indicator"
              name="indicator"
              value={formData.indicator}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Baseline"
              name="baseline"
              type="number"
              value={formData.baseline}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Current"
              name="current"
              type="number"
              value={formData.current}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Target"
              name="target"
              type="number"
              value={formData.target}
              onChange={handleFormChange}
              fullWidth
            />
            <Select name="unit" value={formData.unit} onChange={handleFormChange} fullWidth>
              {['%', '৳', ' people', ' schools', ' households'].map((u) => (
                <MenuItem key={u} value={u}>
                  {u.trim() || u}
                </MenuItem>
              ))}
            </Select>
            <Select name="status" value={formData.status} onChange={handleFormChange} fullWidth>
              {['On Track', 'Moderate', 'At Risk'].map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </DialogContent>
          <DialogActions>
            <Button onClick={dlg.onClose}>Cancel</Button>
            <Button variant="contained" onClick={dlg.onSubmit}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      ))}
    </Box>
  );
}
