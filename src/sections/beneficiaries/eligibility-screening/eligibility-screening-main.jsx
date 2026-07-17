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
  Switch,
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
  FormControlLabel,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import SummaryCard from '../../_components/summary-card';

const INITIAL_FORM = {
  applicant: '',
  nid: '',
  screening_date: '',
  program: '',
  criteria_met: '',
  criteria_total: '',
  score: '',
  eligible: false,
  screener: '',
  status: 'Pending Review',
};

export default function EligibilityScreeningMain() {
  const { data: rawData, loading } = useGetRequest(endpoints.beneficiaries.eligibility_screening);
  const ELIGIBILITY_SCREENING = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const { data: rawProjects } = useGetRequest(endpoints.beneficiaries.simple_projects);
  const PROJECTS = Array.isArray(rawProjects) ? rawProjects : rawProjects?.results || [];

  const approved = ELIGIBILITY_SCREENING.filter((e) => e.status === 'Approved').length;
  const rejected = ELIGIBILITY_SCREENING.filter((e) =>
    (e.status || '').startsWith('Rejected')
  ).length;

  const formDialog = useBoolean();
  const confirmDelete = useBoolean();
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [deleteId, setDeleteId] = useState(null);

  const handleFormChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
        applicant: row.applicant || '',
        nid: row.nid || '',
        screening_date: row.screening_date || '',
        program: row.program || '',
        criteria_met: row.criteria_met || '',
        criteria_total: row.criteria_total || '',
        score: row.score || '',
        eligible: row.eligible || false,
        screener: row.screener || '',
        status: row.status || 'Pending Review',
      });
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleSubmit = useCallback(async () => {
    try {
      if (editingItem) {
        await axiosInstance.patch(
          `${endpoints.beneficiaries.eligibility_screening}${editingItem.id}/`,
          formData
        );
        toast.success('Screening updated');
      } else {
        await axiosInstance.post(endpoints.beneficiaries.eligibility_screening, formData);
        toast.success('Screening created');
      }
      mutate(endpoints.beneficiaries.eligibility_screening);
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
      await axiosInstance.delete(`${endpoints.beneficiaries.eligibility_screening}${deleteId}/`);
      mutate(endpoints.beneficiaries.eligibility_screening);
      toast.success('Screening deleted');
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
            Eligibility Screening
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Screen applicants against program eligibility criteria
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleOpenCreate}
          startIcon={<Iconify icon="solar:user-check-bold" />}
        >
          New Screening
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <SummaryCard
            title="Total Screened"
            value={ELIGIBILITY_SCREENING.length}
            icon="solar:user-check-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <SummaryCard
            title="Approved"
            value={approved}
            icon="solar:check-circle-bold"
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <SummaryCard
            title="Rejected"
            value={rejected}
            icon="solar:close-circle-bold"
            color="error"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <SummaryCard
            title="Pending"
            value={ELIGIBILITY_SCREENING.filter((e) => e.status === 'Pending Review').length}
            icon="solar:clock-circle-bold"
            color="warning"
          />
        </Grid>
      </Grid>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Applicant</TableCell>
                <TableCell>NID</TableCell>
                <TableCell>Screening Date</TableCell>
                <TableCell>Program</TableCell>
                <TableCell>Criteria Met</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Eligible</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ELIGIBILITY_SCREENING.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{row.applicant}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{row.nid}</TableCell>
                  <TableCell>{row.screening_date}</TableCell>
                  <TableCell>
                    <Chip label={row.program_name} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="caption">
                        {row.criteria_met} / {row.criteria_total}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(row.criteria_met / row.criteria_total) * 100}
                        sx={{ height: 6, borderRadius: 1 }}
                        color={row.eligible ? 'success' : 'error'}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">{row.score}%</Typography>
                  </TableCell>
                  <TableCell>
                    <Iconify
                      icon={row.eligible ? 'solar:check-circle-bold' : 'solar:close-circle-bold'}
                      width={24}
                      color={row.eligible ? 'success.main' : 'error.main'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.status.split(' - ')[0]}
                      size="small"
                      color={
                        row.eligible
                          ? 'success'
                          : row.status === 'Pending Review'
                            ? 'warning'
                            : 'error'
                      }
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
        <DialogTitle>{editingItem ? 'Edit Screening' : 'New Eligibility Screening'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
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
              label="Applicant"
              name="applicant"
              value={formData.applicant}
              onChange={handleFormChange}
              fullWidth
              required
            />
            <TextField
              label="NID"
              name="nid"
              value={formData.nid}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Screening Date"
              name="screening_date"
              type="date"
              value={formData.screening_date}
              onChange={handleFormChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Criteria Met"
                name="criteria_met"
                type="number"
                value={formData.criteria_met}
                onChange={handleFormChange}
                fullWidth
              />
              <TextField
                label="Criteria Total"
                name="criteria_total"
                type="number"
                value={formData.criteria_total}
                onChange={handleFormChange}
                fullWidth
              />
            </Stack>
            <TextField
              label="Score (%)"
              name="score"
              type="number"
              value={formData.score}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Screener"
              name="screener"
              value={formData.screener}
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
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
                <MenuItem value="Rejected">Under Review</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  name="eligible"
                  checked={Boolean(formData.eligible)}
                  onChange={handleFormChange}
                  color="primary"
                />
              }
              label={`Eligible: ${formData.eligible ? 'Yes' : 'No'}`}
              sx={{ mt: 1 }}
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
        title="Delete Screening"
        content="Are you sure you want to delete this screening record?"
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
