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
  MenuItem,
  TableRow,
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

const STATUS_COLOR = { Completed: 'success', 'In Progress': 'warning', Planned: 'info' };
const INITIAL_FORM = {
  survey_name: '',
  project: '',
  target_households: '',
  completed: '',
  start_date: '',
  end_date: '',
  status: '',
  data_quality_score: '',
};

export default function HouseholdSurveysMain() {
  const { data: rawData, loading } = useGetRequest(endpoints.beneficiaries.household_surveys);
  const HOUSEHOLD_SURVEYS = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const totalTarget = HOUSEHOLD_SURVEYS.reduce((s, h) => s + (h.target_households || 0), 0);
  const totalCompleted = HOUSEHOLD_SURVEYS.reduce((s, h) => s + (h.completed || 0), 0);

  const { data: rawProjects } = useGetRequest(endpoints.beneficiaries.simple_projects);
  const PROJECTS = Array.isArray(rawProjects) ? rawProjects : rawProjects?.results || [];

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
      console.log('row row row :', row);
      setEditingItem(row);
      setFormData({
        survey_name: row.survey_name || '',
        project: row.project || '',
        target_households: row.target_households || '',
        completed: row.completed || '',
        start_date: row.start_date || '',
        end_date: row.end_date || '',
        status: row.status || 'Planned',
        data_quality_score: row.data_quality_score || '',
      });
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleSubmit = useCallback(async () => {
    if (!formData.survey_name) {
      toast.error('Survey name is required');
      return;
    }
    try {
      if (editingItem) {
        await axiosInstance.patch(
          `${endpoints.beneficiaries.household_surveys}${editingItem.id}/`,
          formData
        );
        toast.success('Survey updated');
      } else {
        await axiosInstance.post(endpoints.beneficiaries.household_surveys, formData);
        toast.success('Survey created');
      }
      mutate(endpoints.beneficiaries.household_surveys);
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
      await axiosInstance.delete(`${endpoints.beneficiaries.household_surveys}${deleteId}/`);
      mutate(endpoints.beneficiaries.household_surveys);
      toast.success('Survey deleted');
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
            Household Surveys
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage household-level surveys and data collection
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleOpenCreate}
          startIcon={<Iconify icon="solar:clipboard-add-bold" />}
        >
          New Survey
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Total Surveys"
            value={HOUSEHOLD_SURVEYS.length}
            icon="solar:document-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Households Surveyed"
            value={totalCompleted}
            icon="solar:home-bold"
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Target Households"
            value={totalTarget}
            icon="solar:target-bold"
            color="info"
          />
        </Grid>
      </Grid>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Reference</TableCell>
                <TableCell>Survey Name</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Data Quality</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {HOUSEHOLD_SURVEYS?.map((row) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>
                    {row.reference}
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{row.survey_name}</Typography>
                  </TableCell>
                  <TableCell>{row.project_name}</TableCell>
                  <TableCell>
                    <Stack spacing={0.5} sx={{ minWidth: 120 }}>
                      <Typography variant="caption">
                        {row.completed} / {row.target_households} ({row.completion_rate}%)
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={row.completion_rate}
                        sx={{ height: 6, borderRadius: 1 }}
                        color={row.completion_rate >= 80 ? 'success' : 'warning'}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>
                    {row.start_date} — {row.end_date}
                  </TableCell>
                  <TableCell>
                    {row.data_quality_score ? (
                      <Chip
                        label={`${row.data_quality_score}%`}
                        size="small"
                        color={row.data_quality_score >= 90 ? 'success' : 'warning'}
                      />
                    ) : (
                      '—'
                    )}
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
        <DialogTitle>{editingItem ? 'Edit Survey' : 'New Household Survey'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Survey Name"
              name="survey_name"
              value={formData.survey_name}
              onChange={handleFormChange}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>project</InputLabel>
              <Select
                name="project"
                value={formData.project}
                onChange={handleFormChange}
                label="project"
              >
                {PROJECTS.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Target Households"
                name="target_households"
                type="number"
                value={formData.target_households}
                onChange={handleFormChange}
                fullWidth
              />
              <TextField
                label="Completed"
                name="completed"
                type="number"
                value={formData.completed}
                onChange={handleFormChange}
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Start Date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleFormChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleFormChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Data Quality Score (%)"
                name="data_quality_score"
                type="number"
                value={formData.data_quality_score}
                onChange={handleFormChange}
                fullWidth
              />
              <TextField
                label="Completion rate"
                name="Completion rate"
                type="number"
                value={formData.completed}
                onChange={handleFormChange}
                fullWidth
              />
            </Stack>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                label="Status"
                displayEmpty
                renderValue={(selected) => selected || 'Select status'}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Draft">Draft</MenuItem>
              </Select>
            </FormControl>
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
        title="Delete Survey"
        content="Are you sure you want to delete this survey?"
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
