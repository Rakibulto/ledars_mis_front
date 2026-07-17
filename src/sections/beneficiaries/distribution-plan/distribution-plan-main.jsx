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

const STATUS_COLOR = {
  Planned: 'warning',
  Approved: 'info',
  Draft: 'default',
  'In Progress': 'primary',
  Completed: 'success',
};
const EP = endpoints.beneficiaries;
const INITIAL_FORM = {
  reference: '',
  name: '',
  project: '',
  location: '',
  date: '',
  beneficiaries_targeted: 0,
  status: 'Draft',
};

export default function DistributionPlanMain() {
  const { data: rawData, loading } = useGetRequest(EP.distribution_plans);
  const DISTRIBUTION_PLANS = Array.isArray(rawData) ? rawData : rawData?.results || [];
  const { data: simpleProjects } = useGetRequest(EP.simple_projects);

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
        reference: row.reference || '',
        name: row.name || '',
        project: row.project || '',
        location: row.location || '',
        date: row.date || '',
        beneficiaries_targeted: row.beneficiaries_targeted || 0,
        status: row.status || 'Draft',
      });
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleSubmit = useCallback(async () => {
    if (!formData.name) {
      toast.error('Plan name is required');
      return;
    }
    try {
      if (editingItem) {
        await axiosInstance.patch(`${EP.distribution_plans}${editingItem.id}/`, formData);
        toast.success('Plan updated');
      } else {
        await axiosInstance.post(EP.distribution_plans, formData);
        toast.success('Plan created');
      }
      mutate(EP.distribution_plans);
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
      await axiosInstance.delete(`${EP.distribution_plans}${deleteId}/`);
      mutate(EP.distribution_plans);
      toast.success('Plan deleted');
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
            Distribution Plans
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Plan and manage beneficiary distributions
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleOpenCreate}
          startIcon={<Iconify icon="solar:add-circle-bold" />}
        >
          New Plan
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Total Plans"
            value={DISTRIBUTION_PLANS.length}
            icon="solar:document-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Beneficiaries Targeted"
            value={DISTRIBUTION_PLANS.reduce((s, p) => s + (p.beneficiaries_targeted || 0), 0)}
            icon="solar:users-group-rounded-bold"
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Upcoming"
            value={DISTRIBUTION_PLANS.filter((p) => p.status !== 'Completed').length}
            icon="solar:calendar-bold"
            color="warning"
          />
        </Grid>
      </Grid>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Reference</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">Targeted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {DISTRIBUTION_PLANS.map((row) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>
                    {row.reference}
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{row.name}</Typography>
                  </TableCell>
                  <TableCell>{row.project}</TableCell>
                  <TableCell>{row.location}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell align="center">{row.beneficiaries_targeted}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.status}
                      size="small"
                      color={STATUS_COLOR[row.status] || 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <IconButton size="small" color="primary" onClick={() => handleOpenEdit(row)}>
                        <Iconify icon="solar:pen-bold" width={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDelete(row.id)}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={formDialog.value} onClose={formDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Plan' : 'New Distribution Plan'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Reference"
              name="reference"
              value={formData.reference}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Plan Name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              fullWidth
              required
            />
            {/* <TextField
              label="Project"
              name="project"
              value={formData.project}
              onChange={handleFormChange}
              fullWidth
            /> */}

            {/* {
        "id": 2,
        "code": "PRJ-2026-0002",
        "name": "Project -1"
    }, */}
            <Select
              fullWidth
              displayEmpty
              name="beneficiary"
              value={formData.project || ''}
              onChange={handleFormChange}
            >
              <MenuItem value="" disabled>
                Select Project
              </MenuItem>
              {simpleProjects?.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {`${project?.name}-(${project?.code || 'No Code'})`}
                </MenuItem>
              ))}
            </Select>
            <TextField
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleFormChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Beneficiaries Targeted"
              name="beneficiaries_targeted"
              type="number"
              value={formData.beneficiaries_targeted}
              onChange={handleFormChange}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status || ''}
                label="Status"
                onChange={handleFormChange}
              >
                <MenuItem value="" disabled>
                  Select Status
                </MenuItem>
                <MenuItem value="Planning">Planning</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
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
        title="Delete Plan"
        content="Are you sure you want to delete this distribution plan?"
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
