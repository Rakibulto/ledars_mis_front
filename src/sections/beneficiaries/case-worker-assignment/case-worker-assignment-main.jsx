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
  TableRow,
  MenuItem,
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
  LinearProgress,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axios, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import SummaryCard from '../../_components/summary-card';

const INITIAL_FORM = {
  case_worker: '',
  designation: '',
  area: '',
  active_cases: 0,
  max_capacity: 0,
  specialization: '',
  phone: '',
  email: '',
};

export default function CaseWorkerAssignmentMain() {
  const { data: rawData, loading } = useGetRequest(endpoints.beneficiaries.case_worker_assignments);
  const CASE_WORKER_ASSIGNMENTS = Array.isArray(rawData) ? rawData : rawData?.results || [];

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

  const { data: simpleUsers } = useGetRequest(endpoints.auth.simpleUsers);
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
        case_worker: row.case_worker || '',
        designation: row.designation || '',
        area: row.area || '',
        active_cases: row.active_cases || 0,
        max_capacity: row.max_capacity || 0,
        specialization: row.specialization || '',
        phone: row.phone || '',
        email: row.email || '',
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
        await axios.patch(
          `${endpoints.beneficiaries.case_worker_assignments}${editingItem.id}/`,
          data
        );
        toast.success('Assignment updated successfully');
      } else {
        await axios.post(endpoints.beneficiaries.case_worker_assignments, data);
        toast.success('Case worker assigned successfully');
      }
      mutate(endpoints.beneficiaries.case_worker_assignments);
      handleCloseDialog();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Operation failed');
      console.error('Form submission error:', err);
    }
  });

  const handleOpenDelete = useCallback(
    (id) => {
      setDeleteId(id);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await axios.delete(`${endpoints.beneficiaries.case_worker_assignments}${deleteId}/`);
      mutate(endpoints.beneficiaries.case_worker_assignments);
      toast.success('Assignment deleted');
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
            Case Worker Assignment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage case workers and their assigned beneficiaries
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleOpenCreate}
          startIcon={<Iconify icon="solar:user-plus-bold" />}
        >
          Assign Case Worker
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Case Workers"
            value={CASE_WORKER_ASSIGNMENTS.length}
            icon="solar:users-group-rounded-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Active Cases"
            value={CASE_WORKER_ASSIGNMENTS.reduce((s, c) => s + c.active_cases, 0)}
            icon="solar:folder-open-bold"
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Avg. Load"
            value={`${Math.round(CASE_WORKER_ASSIGNMENTS.reduce((s, c) => s + c.active_cases, 0) / CASE_WORKER_ASSIGNMENTS.length)}`}
            icon="solar:chart-2-bold"
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="At Capacity"
            value={
              CASE_WORKER_ASSIGNMENTS.filter((c) => c.active_cases >= c.max_capacity * 0.9).length
            }
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
                <TableCell>Case Worker</TableCell>
                <TableCell>Designation</TableCell>
                <TableCell>Area</TableCell>
                <TableCell>Specialization</TableCell>
                <TableCell>Active Cases</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {CASE_WORKER_ASSIGNMENTS.map((row) => {
                const loadPercent = (row.active_cases / row.max_capacity) * 100;
                const loadColor =
                  loadPercent >= 90 ? 'error' : loadPercent >= 70 ? 'warning' : 'success';
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{row.case_worker}</Typography>
                    </TableCell>
                    <TableCell>{row.designation}</TableCell>
                    <TableCell>{row.area}</TableCell>
                    <TableCell>
                      <Chip label={row.specialization} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">
                          {row.active_cases} / {row.max_capacity}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={loadPercent}
                          color={loadColor}
                          sx={{ height: 6, borderRadius: 1 }}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          loadPercent >= 90 ? 'Full' : loadPercent >= 70 ? 'High' : 'Available'
                        }
                        size="small"
                        color={loadColor}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{row.phone}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenEdit(row)}
                        >
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
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={formDialog.value} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{ fontWeight: 600, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Iconify icon={editingItem ? 'solar:pen-bold' : 'solar:user-plus-bold'} width={24} />
          {editingItem ? 'Edit Assignment' : 'Assign Case Worker'}
        </DialogTitle>

        <Divider />

        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
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

            {/* Designation TextField */}
            <Controller
              name="designation"
              control={control}
              rules={{ required: 'Designation is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Designation"
                  placeholder="e.g. Senior Case Worker, Junior Case Worker"
                  size="small"
                  error={!!errors.designation}
                  helperText={errors.designation?.message}
                />
              )}
            />

            {/* Area TextField */}
            <Controller
              name="area"
              control={control}
              rules={{ required: 'Area is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Area"
                  placeholder="Geographic area of coverage"
                  size="small"
                  error={!!errors.area}
                  helperText={errors.area?.message}
                />
              )}
            />

            {/* Specialization TextField */}
            <Controller
              name="specialization"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Specialization"
                  placeholder="e.g. Medical, Financial, Legal"
                  size="small"
                  error={!!errors.specialization}
                  helperText={errors.specialization?.message}
                />
              )}
            />

            {/* Active Cases & Max Capacity Row */}
            <Stack direction="row" spacing={2}>
              <Controller
                name="active_cases"
                control={control}
                rules={{
                  required: 'Active cases is required',
                  min: { value: 0, message: 'Must be 0 or greater' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Active Cases"
                    type="number"
                    size="small"
                    fullWidth
                    error={!!errors.active_cases}
                    helperText={errors.active_cases?.message}
                    inputProps={{ min: 0, step: 1 }}
                  />
                )}
              />
              <Controller
                name="max_capacity"
                control={control}
                rules={{
                  required: 'Max capacity is required',
                  min: { value: 1, message: 'Must be greater than 0' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Max Capacity"
                    type="number"
                    size="small"
                    fullWidth
                    error={!!errors.max_capacity}
                    helperText={errors.max_capacity?.message}
                    inputProps={{ min: 1, step: 1 }}
                  />
                )}
              />
            </Stack>

            {/* Phone TextField */}
            <Controller
              name="phone"
              control={control}
              rules={{
                required: 'Phone is required',
                pattern: {
                  value: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
                  message: 'Please enter a valid phone number',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Phone"
                  placeholder="+1 (123) 456-7890"
                  size="small"
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  type="tel"
                />
              )}
            />

            {/* Email TextField */}
            <Controller
              name="email"
              control={control}
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Email"
                  placeholder="case.worker@example.com"
                  size="small"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
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
              minWidth: 120,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={18} />
                {editingItem ? 'Updating...' : 'Assigning...'}
              </>
            ) : (
              <>
                <Iconify icon={editingItem ? 'solar:check-circle-bold' : 'solar:user-plus-bold'} />
                {editingItem ? 'Update' : 'Assign'}
              </>
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete Assignment"
        content="Are you sure you want to delete this assignment?"
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
