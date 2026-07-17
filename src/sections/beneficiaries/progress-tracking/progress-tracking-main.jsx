'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';

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
  TextField,
  TableBody,
  TableCell,
  TableHead,
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

const INITIAL_FORM = {
  beneficiary: '',
  program: '',
  enrolled_date: '',
  milestones_total: '',
  milestones_completed: '',
  progress: '',
  current_phase: '',
  next_milestone: '',
  target_graduation: '',
};

export default function ProgressTrackingMain() {
  const { data: rawData, loading } = useGetRequest(endpoints.beneficiaries.progress_tracking);
  const PROGRESS_TRACKING = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const { data: rawProjects } = useGetRequest(endpoints.beneficiaries.simple_projects);
  const PROJECTS = Array.isArray(rawProjects) ? rawProjects : rawProjects?.results || [];

  const { data: rawBeneficiaries } = useGetRequest(endpoints.beneficiaries.simple_beneficiaries);
  const BENEFICIARIES = Array.isArray(rawBeneficiaries)
    ? rawBeneficiaries
    : rawBeneficiaries?.results || [];

  const avgProgress = PROGRESS_TRACKING.length
    ? Math.round(
        PROGRESS_TRACKING.reduce((s, p) => s + (p.progress || 0), 0) / PROGRESS_TRACKING.length
      )
    : 0;

  const formDialog = useBoolean();
  const confirmDelete = useBoolean();
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [deleteId, setDeleteId] = useState(null);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    formDialog.onTrue();
  }, [formDialog]);

  const handleOpenEdit = useCallback(
    (row) => {
      setEditingItem(row);
      setFormData({
        beneficiary: row.beneficiary || '',
        program: row.program || '',
        enrolled_date: row.enrolled_date || '',
        milestones_total: row.milestones_total || '',
        milestones_completed: row.milestones_completed || '',
        progress: row.progress ?? '',
        current_phase: row.current_phase || '',
        next_milestone: row.next_milestone || '',
        target_graduation: row.target_graduation || '',
      });
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleSubmit = useCallback(async () => {
    try {
      if (editingItem) {
        await axiosInstance.patch(
          `${endpoints.beneficiaries.progress_tracking}${editingItem.id}/`,
          formData
        );
        toast.success('Progress updated');
      } else {
        await axiosInstance.post(endpoints.beneficiaries.progress_tracking, formData);
        toast.success('Progress record created');
      }
      mutate(endpoints.beneficiaries.progress_tracking);
      formDialog.onFalse();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  }, [formData, editingItem, formDialog]);

  const handleOpenDelete = useCallback(
    (id) => {
      setDeleteId(id);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await axiosInstance.delete(`${endpoints.beneficiaries.progress_tracking}${deleteId}/`);
      mutate(endpoints.beneficiaries.progress_tracking);
      toast.success('Record deleted');
      confirmDelete.onFalse();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  }, [deleteId, confirmDelete]);

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
            Progress Tracking
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track individual beneficiary progress through program milestones
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            onClick={handleOpenCreate}
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            Add Record
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:export-bold" />}
          >
            Export
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Beneficiaries Tracked"
            value={PROGRESS_TRACKING.length}
            icon="solar:users-group-rounded-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Avg. Progress"
            value={`${avgProgress}%`}
            icon="solar:graph-up-bold"
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Near Graduation"
            value={PROGRESS_TRACKING.filter((p) => p.progress >= 70).length}
            icon="solar:diploma-bold"
            color="success"
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
                <TableCell>Program</TableCell>
                <TableCell>Current Phase</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Next Milestone</TableCell>
                <TableCell>Target Graduation</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {PROGRESS_TRACKING.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{row.beneficiary_name}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>
                    {row.ben_code}
                  </TableCell>
                  <TableCell>
                    <Chip label={row.program_name} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{row.current_phase}</TableCell>
                  <TableCell>
                    <Stack spacing={0.5} sx={{ minWidth: 130 }}>
                      <Typography variant="caption">
                        {row.milestones_completed}/{row.milestones_total} milestones ({row.progress}
                        %)
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={row.progress}
                        color={
                          row.progress >= 70 ? 'success' : row.progress >= 30 ? 'warning' : 'error'
                        }
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell>{row.next_milestone}</TableCell>
                  <TableCell>{row.target_graduation}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
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

      <Dialog open={formDialog.value} onClose={formDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Progress' : 'Add Progress Record'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Beneficiary</InputLabel>
              <Select
                name="beneficiary"
                value={formData.beneficiary}
                onChange={handleFormChange}
                label="Beneficiary"
              >
                {BENEFICIARIES.map((beneficiary) => (
                  <MenuItem key={beneficiary.id} value={beneficiary.id}>
                    {beneficiary.name} -- {beneficiary.ben_code}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Program</InputLabel>
              <Select
                name="program"
                value={formData.program}
                onChange={handleFormChange}
                label="Program"
              >
                {PROJECTS.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Enrolled Date"
              name="enrolled_date"
              type="date"
              value={formData.enrolled_date}
              onChange={handleFormChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Milestones Total"
                name="milestones_total"
                type="number"
                value={formData.milestones_total}
                onChange={handleFormChange}
                fullWidth
              />
              <TextField
                label="Milestones Completed"
                name="milestones_completed"
                type="number"
                value={formData.milestones_completed}
                onChange={handleFormChange}
                fullWidth
              />
            </Stack>
            <TextField
              label="Progress"
              name="progress"
              type="number"
              value={formData.progress}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Current Phase"
              name="current_phase"
              value={formData.current_phase}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Next Milestone"
              name="next_milestone"
              value={formData.next_milestone}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Target Graduation"
              name="target_graduation"
              type="date"
              value={formData.target_graduation}
              onChange={handleFormChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={formDialog.onFalse}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete Record"
        content="Are you sure you want to delete this progress record?"
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
