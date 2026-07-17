'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';

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
  Divider,
  MenuItem,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  Typography,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axios, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import SummaryCard from '../../_components/summary-card';

// ============================================
// CONSTANTS FOR DROPDOWN OPTIONS
// ============================================
const TYPE_OPTIONS = [
  { value: 'Home Visit', label: 'Home Visit' },
  { value: 'Phone Call', label: 'Phone Call' },
  { value: 'Office Visit', label: 'Office Visit' },
  { value: 'Group Session', label: 'Group Session' },
];

const STATUS_OPTIONS = [
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Missed', label: 'Missed' },
  { value: 'Rescheduled', label: 'Rescheduled' },
];

const PRIORITY_OPTIONS = [
  { value: 'Critical', label: 'Critical', color: 'error' },
  { value: 'High', label: 'High', color: 'warning' },
  { value: 'Medium', label: 'Medium', color: 'info' },
  { value: 'Low', label: 'Low', color: 'default' },
];

const PRIORITY_COLOR = { Critical: 'error', High: 'warning', Medium: 'info', Low: 'default' };
const STATUS_COLOR = {
  Scheduled: 'info',
  Completed: 'success',
  Missed: 'error',
  Rescheduled: 'warning',
  Overdue: 'error',
};

// ============================================
// INITIAL FORM STATE
// ============================================
const INITIAL_FORM = {
  beneficiary: '',
  case_worker: '',
  follow_up_date: '',
  type: '',
  purpose: '',
  status: 'Scheduled',
  priority: 'Medium',
};

export default function FollowUpScheduleMain() {
  const { data: rawData, loading } = useGetRequest(endpoints.beneficiaries.follow_up_schedules);
  const FOLLOW_UP_SCHEDULE = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const { data: simpleBeeficiary } = useGetRequest(
    `${endpoints.beneficiaries.simple_beneficiaries}`
  );
  const { data: simpleUsers } = useGetRequest(endpoints.auth.simpleUsers);

  const overdue = FOLLOW_UP_SCHEDULE.filter((f) => f.status === 'Missed').length;
  const scheduled = FOLLOW_UP_SCHEDULE.filter((f) => f.status === 'Scheduled').length;

  const formDialog = useBoolean();
  const confirmDelete = useBoolean();
  const [editingItem, setEditingItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // ============================================
  // REACT HOOK FORM INITIALIZATION
  // ============================================
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    mode: 'onBlur',
    defaultValues: INITIAL_FORM,
  });

  // ============================================
  // DIALOG OPEN HANDLERS
  // ============================================
  const handleOpenCreate = useCallback(() => {
    setEditingItem(null);
    reset(INITIAL_FORM);
    formDialog.onTrue();
  }, [formDialog, reset]);

  const handleOpenEdit = useCallback(
    (row) => {
      setEditingItem(row);
      reset({
        beneficiary: row.beneficiary || '',
        case_worker: row.case_worker || '',
        follow_up_date: row.follow_up_date || '',
        type: row.type || '',
        purpose: row.purpose || '',
        status: row.status || 'Scheduled',
        priority: row.priority || 'Medium',
      });
      formDialog.onTrue();
    },
    [formDialog, reset]
  );

  // ============================================
  // FORM SUBMISSION HANDLER
  // ============================================
  const onSubmit = handleSubmit(async (data) => {
    try {
      if (editingItem) {
        await axios.patch(`${endpoints.beneficiaries.follow_up_schedules}${editingItem.id}/`, data);
        toast.success('Follow-up updated successfully');
      } else {
        await axios.post(endpoints.beneficiaries.follow_up_schedules, data);
        toast.success('Follow-up scheduled successfully');
      }
      mutate(endpoints.beneficiaries.follow_up_schedules);
      handleCloseDialog();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Operation failed');
      console.error('Form submission error:', err);
    }
  });

  const handleMarkComplete = useCallback(async (row) => {
    try {
      await axios.patch(`${endpoints.beneficiaries.follow_up_schedules}${row.id}/`, {
        status: 'Completed',
      });
      mutate(endpoints.beneficiaries.follow_up_schedules);
      toast.success('Marked as completed');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    }
  }, []);

  const handleOpenDelete = useCallback(
    (id) => {
      setDeleteId(id);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await axios.delete(`${endpoints.beneficiaries.follow_up_schedules}${deleteId}/`);
      mutate(endpoints.beneficiaries.follow_up_schedules);
      toast.success('Follow-up deleted');
      confirmDelete.onFalse();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    }
  }, [deleteId, confirmDelete]);

  // ============================================
  // DIALOG CLOSE HANDLER
  // ============================================
  const handleCloseDialog = useCallback(() => {
    reset(INITIAL_FORM);
    setEditingItem(null);
    formDialog.onFalse();
  }, [formDialog, reset]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Follow-up Schedule
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage beneficiary follow-up activities
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleOpenCreate}
          startIcon={<Iconify icon="solar:calendar-add-bold" />}
        >
          Schedule Follow-up
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Total Scheduled"
            value={FOLLOW_UP_SCHEDULE.length}
            icon="solar:calendar-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Upcoming"
            value={scheduled}
            icon="solar:clock-circle-bold"
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Missed"
            value={overdue}
            icon="solar:danger-triangle-bold"
            color="error"
          />
        </Grid>
      </Grid>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Beneficiary</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Case Worker</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Purpose</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {FOLLOW_UP_SCHEDULE.map((row) => (
                <TableRow
                  key={row.id}
                  sx={row.status === 'Missed' ? { bgcolor: 'error.lighter' } : {}}
                >
                  <TableCell>
                    <Typography variant="subtitle2">{row.beneficiary_name}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>
                    {row.ben_code}
                  </TableCell>
                  <TableCell>{row.case_worker}</TableCell>
                  <TableCell>{row.follow_up_date}</TableCell>
                  <TableCell>
                    <Chip label={row.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>{row.purpose}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.priority}
                      size="small"
                      color={PRIORITY_COLOR[row.priority] || 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.status}
                      size="small"
                      color={STATUS_COLOR[row.status] || 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {row.status !== 'Completed' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          onClick={() => handleMarkComplete(row)}
                        >
                          Complete
                        </Button>
                      )}
                      <IconButton size="small" color="primary" onClick={() => handleOpenEdit(row)}>
                        <Iconify icon="solar:pen-bold" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDelete(row.id)}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={formDialog.value} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{ fontWeight: 600, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Iconify icon={editingItem ? 'solar:pen-bold' : 'solar:calendar-add-bold'} width={24} />
          {editingItem ? 'Edit Follow-up Schedule' : 'Schedule Follow-up'}
        </DialogTitle>

        <Divider />

        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            {/* Beneficiary Select */}
            <Controller
              name="beneficiary"
              control={control}
              rules={{ required: 'Beneficiary is required' }}
              render={({ field }) => (
                <FormControl fullWidth size="small" error={!!errors.beneficiary}>
                  <InputLabel>Beneficiary</InputLabel>
                  <Select {...field} value={field.value ?? ''} label="Beneficiary">
                    <MenuItem value="">
                      <em>Select Beneficiary</em>
                    </MenuItem>
                    {simpleBeeficiary?.map((b) => (
                      <MenuItem key={b.id} value={b.id}>
                        {b.name} ({b.ben_code})
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.beneficiary && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.beneficiary.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />

            {/* Case Worker Select */}
            <Controller
              name="case_worker"
              control={control}
              rules={{ required: 'Case worker is required' }}
              render={({ field }) => (
                <FormControl fullWidth size="small" error={!!errors.case_worker}>
                  <InputLabel>Case Worker</InputLabel>
                  <Select {...field} value={field.value ?? ''} label="Case Worker">
                    <MenuItem value="">
                      <em>Select Case Worker</em>
                    </MenuItem>
                    {simpleUsers?.map((w) => (
                      <MenuItem key={w.id} value={w.id}>
                        {w.username}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.case_worker && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.case_worker.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />

            {/* Follow-up Date */}
            <Controller
              name="follow_up_date"
              control={control}
              rules={{ required: 'Follow-up date is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="date"
                  label="Follow-up Date"
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  error={!!errors.follow_up_date}
                  helperText={errors.follow_up_date?.message}
                />
              )}
            />

            {/* Type Select */}
            <Controller
              name="type"
              control={control}
              rules={{ required: 'Type is required' }}
              render={({ field }) => (
                <FormControl fullWidth size="small" error={!!errors.type}>
                  <InputLabel>Type</InputLabel>
                  <Select {...field} value={field.value ?? ''} label="Type">
                    <MenuItem value="">
                      <em>Select Type</em>
                    </MenuItem>
                    {TYPE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Iconify
                            icon={
                              option.value === 'Home Visit'
                                ? 'solar:home-bold'
                                : option.value === 'Phone Call'
                                  ? 'solar:phone-bold'
                                  : option.value === 'Office Visit'
                                    ? 'solar:building-bold'
                                    : 'solar:users-group-rounded-bold'
                            }
                            width={18}
                          />
                          {option.label}
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.type && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.type.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />

            {/* Purpose TextField */}
            <Controller
              name="purpose"
              control={control}
              rules={{ required: 'Purpose is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Purpose"
                  placeholder="Describe the purpose of this follow-up..."
                  multiline
                  rows={3}
                  size="small"
                  error={!!errors.purpose}
                  helperText={errors.purpose?.message}
                />
              )}
            />

            {/* Priority Select */}
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select {...field} value={field.value ?? 'Medium'} label="Priority">
                    {PRIORITY_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Chip
                          label={option.label}
                          size="small"
                          color={option.color}
                          variant="outlined"
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            {/* Status Select */}
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select {...field} value={field.value ?? 'Scheduled'} label="Status">
                    {STATUS_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Chip label={option.label} size="small" variant="outlined" />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseDialog}
            disabled={isSubmitting}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={isSubmitting}
            sx={{
              minWidth: 140,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={18} />
                {editingItem ? 'Updating...' : 'Scheduling...'}
              </>
            ) : (
              <>
                <Iconify
                  icon={editingItem ? 'solar:check-circle-bold' : 'solar:calendar-add-bold'}
                />
                {editingItem ? 'Update' : 'Schedule'}
              </>
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete Follow-up"
        content="Are you sure you want to delete this follow-up?"
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
