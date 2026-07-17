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
  Rating,
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
  period: '',
  respondents: '',
  avg_satisfaction: '',
  response_rate: '',
  status: 'Planned',
  key_findings: '',
};

export default function SatisfactionSurveysMain() {
  const { data: rawData, loading } = useGetRequest(endpoints.beneficiaries.satisfaction_surveys);
  const SATISFACTION_SURVEYS = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const { data: rawProjects } = useGetRequest(endpoints.beneficiaries.simple_projects);
  const PROJECTS = Array.isArray(rawProjects) ? rawProjects : rawProjects?.results || [];

  const avgSatisfaction = SATISFACTION_SURVEYS.length
    ? (
        SATISFACTION_SURVEYS.reduce((s, ss) => s + (ss.avg_satisfaction || 0), 0) /
        SATISFACTION_SURVEYS.length
      ).toFixed(1)
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
        survey_name: row.survey_name || '',
        project: row.project || '',
        period: row.period || '',
        respondents: row.respondents || '',
        avg_satisfaction: row.avg_satisfaction || '',
        response_rate: row.response_rate || '',
        status: row.status || 'Planned',
        key_findings: row.key_findings || '',
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
          `${endpoints.beneficiaries.satisfaction_surveys}${editingItem.id}/`,
          formData
        );
        toast.success('Survey updated');
      } else {
        await axiosInstance.post(endpoints.beneficiaries.satisfaction_surveys, formData);
        toast.success('Survey created');
      }
      mutate(endpoints.beneficiaries.satisfaction_surveys);
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
      await axiosInstance.delete(`${endpoints.beneficiaries.satisfaction_surveys}${deleteId}/`);
      mutate(endpoints.beneficiaries.satisfaction_surveys);
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
            Satisfaction Surveys
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Measure beneficiary satisfaction with programs and services
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
            value={SATISFACTION_SURVEYS.length}
            icon="solar:document-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Avg. Satisfaction"
            value={`${avgSatisfaction}/5`}
            icon="solar:star-bold"
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Total Respondents"
            value={SATISFACTION_SURVEYS.reduce((s, ss) => s + ss.respondents, 0)}
            icon="solar:users-group-rounded-bold"
            color="info"
          />
        </Grid>
      </Grid>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Survey Name</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Period</TableCell>
                <TableCell align="center">Respondents</TableCell>
                <TableCell>Satisfaction</TableCell>
                <TableCell align="center">Response Rate</TableCell>
                <TableCell>Key Findings</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {SATISFACTION_SURVEYS.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{row.survey_name}</Typography>
                  </TableCell>
                  <TableCell>{row.project}</TableCell>
                  <TableCell>{row.period}</TableCell>
                  <TableCell align="center">{row.respondents}</TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Rating value={row.avg_satisfaction} precision={0.1} readOnly size="small" />
                      <Typography variant="body2">{row.avg_satisfaction}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${row.response_rate}%`}
                      size="small"
                      color={row.response_rate >= 80 ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, fontSize: 13 }}>{row.key_findings}</TableCell>
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
        <DialogTitle>{editingItem ? 'Edit Survey' : 'New Satisfaction Survey'}</DialogTitle>
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
              label="Period"
              name="period"
              value={formData.period}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Respondents"
              name="respondents"
              type="number"
              value={formData.respondents}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Avg. Satisfaction (1-5)"
              name="avg_satisfaction"
              type="number"
              value={formData.avg_satisfaction}
              onChange={handleFormChange}
              fullWidth
              inputProps={{ min: 0, max: 5, step: 0.1 }}
            />
            <TextField
              label="Response Rate (%)"
              name="response_rate"
              type="number"
              value={formData.response_rate}
              onChange={handleFormChange}
              fullWidth
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
              </Select>
            </FormControl>
            <TextField
              label="Key Findings"
              name="key_findings"
              value={formData.key_findings}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={3}
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
