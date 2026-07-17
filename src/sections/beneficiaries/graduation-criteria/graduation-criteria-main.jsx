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
  IconButton,
  Typography,
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

const INITIAL_FORM = {
  program: '',
  criteria: '',
  weight: '',
  indicator: '',
  measurement: '',
  status: 'Active',
};

export default function GraduationCriteriaMain() {
  const { data: rawData, loading } = useGetRequest(endpoints.beneficiaries.graduation_criteria);
  const { data: projects } = useGetRequest(endpoints.beneficiaries.programs);
  const GRADUATION_CRITERIA = Array.isArray(rawData) ? rawData : rawData?.results || [];

  console.log('Graduation Criteria:', GRADUATION_CRITERIA);

  const programs = [...new Set(GRADUATION_CRITERIA.map((c) => c.program))];

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
        program: row?.program || '',
        criteria: row?.criteria || '',
        weight: row?.weight || '',
        indicator: row?.indicator || '',
        measurement: row?.measurement || '',
        status: row?.status || 'Active',
      });
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleSubmit = useCallback(async () => {
    if (!formData.criteria) {
      toast.error('Criteria is required');
      return;
    }
    try {
      if (editingItem) {
        await axiosInstance.patch(
          `${endpoints.beneficiaries.graduation_criteria}${editingItem.id}/`,
          formData
        );
        toast.success('Criterion updated');
      } else {
        await axiosInstance.post(endpoints.beneficiaries.graduation_criteria, formData);
        toast.success('Criterion added');
      }
      mutate(endpoints.beneficiaries.graduation_criteria);
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
      await axiosInstance.delete(`${endpoints.beneficiaries.graduation_criteria}${deleteId}/`);
      mutate(endpoints.beneficiaries.graduation_criteria);
      toast.success('Criterion deleted');
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
            Graduation Criteria
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Define criteria for beneficiary graduation from programs
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleOpenCreate}
          startIcon={<Iconify icon="solar:add-circle-bold" />}
        >
          Add Criterion
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Total Criteria"
            value={GRADUATION_CRITERIA.length}
            icon="solar:diploma-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Programs"
            value={programs.length}
            icon="solar:folder-bold"
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Active"
            value={GRADUATION_CRITERIA.filter((c) => c.status === 'Active').length}
            icon="solar:check-circle-bold"
            color="success"
          />
        </Grid>
      </Grid>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Program</TableCell>
                <TableCell>Criteria</TableCell>
                <TableCell>Indicator</TableCell>
                <TableCell align="center">Weight (%)</TableCell>
                <TableCell>Measurement</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {GRADUATION_CRITERIA.map((row, idx) => (
                <TableRow key={row?.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <Chip label={row?.program_name} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{row?.criteria}</Typography>
                  </TableCell>
                  <TableCell>{row?.indicator}</TableCell>
                  <TableCell align="center">
                    <Typography fontWeight="bold">{row?.weight}</Typography>
                  </TableCell>
                  <TableCell>{row?.measurement}</TableCell>
                  <TableCell>
                    <Chip label={row?.status} size="small" color="success" />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton size="small" color="primary" onClick={() => handleOpenEdit(row)}>
                        <Iconify icon="solar:pen-bold" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDelete(row?.id)}
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
        <DialogTitle>{editingItem ? 'Edit Criterion' : 'Add Graduation Criterion'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* <TextField
              label="Program"
              name="program"
              value={formData.program}
              onChange={handleFormChange}
              fullWidth
            /> */}

            <Select
              name="program"
              value={formData.program}
              onChange={handleFormChange}
              displayEmpty
              fullWidth
            >
              {projects?.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>

            <TextField
              label="Criteria"
              name="criteria"
              value={formData.criteria}
              onChange={handleFormChange}
              fullWidth
              required
            />
            <TextField
              label="Indicator"
              name="indicator"
              value={formData.indicator}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Weight (%)"
              name="weight"
              type="number"
              value={formData.weight}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Measurement"
              name="measurement"
              value={formData.measurement}
              onChange={handleFormChange}
              fullWidth
            />
            <Select
              name="status"
              value={formData.status}
              onChange={handleFormChange}
              displayEmpty
              fullWidth
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={formDialog.onFalse}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete Criterion"
        content="Are you sure you want to delete this criterion?"
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
