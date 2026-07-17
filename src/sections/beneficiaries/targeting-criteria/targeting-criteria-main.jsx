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
  InputLabel,
  DialogTitle,
  FormControl,
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
  criterion: '',
  type: '',
  weight: '',
  measurement: '',
  status: 'Active',
};

export default function TargetingCriteriaMain() {
  const { data: rawData, loading } = useGetRequest(endpoints.beneficiaries.targeting_criteria);
  const TARGETING_CRITERIA = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const { data: rawProjects } = useGetRequest(endpoints.beneficiaries.simple_projects);
  const PROJECTS = Array.isArray(rawProjects) ? rawProjects : rawProjects?.results || [];

  const programs = [...new Set(TARGETING_CRITERIA.map((c) => c.program))];

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
        program: row.program || '',
        criterion: row.criterion || '',
        type: row.type || '',
        weight: row.weight || '',
        measurement: row.measurement || '',
        status: row.status || 'Active',
      });
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleSubmit = useCallback(async () => {
    if (!formData.criterion) {
      toast.error('Criterion is required');
      return;
    }
    try {
      if (editingItem) {
        await axiosInstance.patch(
          `${endpoints.beneficiaries.targeting_criteria}${editingItem.id}/`,
          formData
        );
        toast.success('Criterion updated successfully');
      } else {
        await axiosInstance.post(endpoints.beneficiaries.targeting_criteria, formData);
        toast.success('Criterion added successfully');
      }
      mutate(endpoints.beneficiaries.targeting_criteria);
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
      await axiosInstance.delete(`${endpoints.beneficiaries.targeting_criteria}${deleteId}/`);
      mutate(endpoints.beneficiaries.targeting_criteria);
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
            Targeting Criteria
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Define criteria for beneficiary selection and program targeting
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
            value={TARGETING_CRITERIA.length}
            icon="solar:target-bold"
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
            value={TARGETING_CRITERIA.filter((c) => c.status === 'Active').length}
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
                <TableCell>Criterion</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="center">Weight (%)</TableCell>
                <TableCell>Measurement</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {TARGETING_CRITERIA.map((row, idx) => (
                <TableRow key={row.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <Chip label={row.program} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{row.criterion}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={row.type} size="small" color="success" />
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight="bold">{row.weight}</Typography>
                  </TableCell>
                  <TableCell>{row.measurement}</TableCell>
                  <TableCell>
                    <Chip label={row.status} size="small" color="success" />
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
        <DialogTitle>{editingItem ? 'Edit Criterion' : 'Add Targeting Criterion'}</DialogTitle>
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
              label="Criterion"
              name="criterion"
              value={formData.criterion}
              onChange={handleFormChange}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select name="type" value={formData.type} onChange={handleFormChange} label="Type">
                <MenuItem value="Economic">Economic</MenuItem>
                <MenuItem value="Demographic">Demographic</MenuItem>
                <MenuItem value="Social">Social</MenuItem>
                <MenuItem value="Geographic">Geographic</MenuItem>
                <MenuItem value="Vulnerability">Vulnerability</MenuItem>
              </Select>
            </FormControl>
            {/* <TextField
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleFormChange}
              fullWidth
            /> */}
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
