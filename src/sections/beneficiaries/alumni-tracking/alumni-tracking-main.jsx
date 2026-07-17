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
  Checkbox,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  Typography,
  DialogTitle,
  Autocomplete,
  DialogActions,
  DialogContent,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import SummaryCard from '../../_components/summary-card';

const STATUS_CHOICES = [
  { value: 'Employed', label: 'Employed' },
  { value: 'Self-employed', label: 'Self-employed' },
  { value: 'Unemployed', label: 'Unemployed' },
  { value: 'In Training', label: 'In Training' },
];

const INITIAL_FORM = {
  graduation_date: null,
  current_status: null,
  income_change: '',
  last_contact: null,
  follow_up_interval: '',
  needs_support: false,
  beneficiary: null,
  program: null,
};

export default function AlumniTrackingMain() {
  const { data: rawData, loading } = useGetRequest(endpoints.beneficiaries.alumni_tracking);
  const { data: rawBeneficiaries } = useGetRequest(endpoints.beneficiaries.simple_beneficiaries);
  const { data: rawProjects } = useGetRequest(endpoints.projects.simple_projects);
  const ALUMNI_TRACKING = Array.isArray(rawData) ? rawData : rawData?.results || [];
  const beneficiaries = Array.isArray(rawBeneficiaries)
    ? rawBeneficiaries
    : rawBeneficiaries?.results || [];
  const projects = Array.isArray(rawProjects) ? rawProjects : rawProjects?.results || [];

  const needsSupport = ALUMNI_TRACKING.filter((a) => a.needs_support).length;

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
        graduation_date: row.graduation_date || '',
        program: row.program || '',
        current_status: row.current_status || '',
        income_change: row.income_change || '',
        last_contact: row.last_contact || '',
        follow_up_interval: row.follow_up_interval || '',
        needs_support: row.needs_support || false,
      });
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleSubmit = useCallback(async () => {
    try {
      if (editingItem) {
        await axiosInstance.patch(
          `${endpoints.beneficiaries.alumni_tracking}${editingItem.id}/`,
          formData
        );
        toast.success('Alumni record updated');
      } else {
        await axiosInstance.post(endpoints.beneficiaries.alumni_tracking, formData);
        toast.success('Alumni record created');
      }
      mutate(endpoints.beneficiaries.alumni_tracking);
      formDialog.onFalse();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  }, [editingItem, formData, formDialog]);

  const handleOpenDelete = useCallback(
    (id) => {
      setDeleteId(id);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await axiosInstance.delete(`${endpoints.beneficiaries.alumni_tracking}${deleteId}/`);
      toast.success('Alumni record deleted');
      mutate(endpoints.beneficiaries.alumni_tracking);
      confirmDelete.onFalse();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  }, [deleteId, confirmDelete]);

  const avgIncome = ALUMNI_TRACKING.length
    ? Math.round(
        (ALUMNI_TRACKING || []).reduce((s, a) => s + parseInt(a.income_change || 0, 10), 0) /
          ALUMNI_TRACKING.length
      )
    : 0;

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
            Alumni Tracking
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor graduated beneficiaries and their post-program status
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            onClick={handleOpenCreate}
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            Add Alumni
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
        <Grid size={{ xs: 12, sm: 3 }}>
          <SummaryCard
            title="Total Alumni"
            value={ALUMNI_TRACKING.length}
            icon="solar:diploma-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <SummaryCard
            title="Self-Sufficient"
            value={ALUMNI_TRACKING.filter((a) => !a.needs_support).length}
            icon="solar:check-circle-bold"
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <SummaryCard
            title="Needs Support"
            value={needsSupport}
            icon="solar:danger-triangle-bold"
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <SummaryCard
            title="Avg. Income Change"
            value={`+${avgIncome}%`}
            icon="solar:graph-up-bold"
            color="info"
          />
        </Grid>
      </Grid>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Program</TableCell>
                <TableCell>Graduation Date</TableCell>
                <TableCell>Current Status</TableCell>
                <TableCell>Income Change</TableCell>
                <TableCell>Last Contact</TableCell>
                <TableCell>Follow-up</TableCell>
                <TableCell>Needs Support</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ALUMNI_TRACKING.map((row) => (
                <TableRow key={row.id} sx={row.needs_support ? { bgcolor: 'warning.lighter' } : {}}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>
                    {row.ben_code}
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{row.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={row.program} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{row.graduation_date}</TableCell>
                  <TableCell>{row.current_status}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.income_change}
                      size="small"
                      color={parseInt(row.income_change || 0, 10) >= 100 ? 'success' : 'info'}
                    />
                  </TableCell>
                  <TableCell>{row.last_contact}</TableCell>
                  <TableCell>{row.follow_up_interval}</TableCell>
                  <TableCell>
                    <Iconify
                      icon={
                        row.needs_support ? 'solar:danger-triangle-bold' : 'solar:check-circle-bold'
                      }
                      width={24}
                      color={row.needs_support ? 'warning.main' : 'success.main'}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenEdit(row)}>
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleOpenDelete(row.id)}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={formDialog.value} onClose={formDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Alumni Record' : 'Add Alumni Record'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Autocomplete
            options={beneficiaries}
            getOptionLabel={(option) => `${option.ben_code} - ${option.name}`}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            value={beneficiaries.find((option) => option.id === formData.beneficiary) || null}
            onChange={(_, value) =>
              setFormData((prev) => ({ ...prev, beneficiary: value?.id || null }))
            }
            renderInput={(params) => <TextField {...params} label="Beneficiary" />}
          />
          <TextField
            label="Graduation Date"
            name="graduation_date"
            type="date"
            value={formData.graduation_date || ''}
            onChange={handleFormChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <Autocomplete
            options={projects}
            getOptionLabel={(option) => `${option.code} - ${option.name}`}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            value={projects.find((option) => option.id === formData.program) || null}
            onChange={(_, value) =>
              setFormData((prev) => ({ ...prev, program: value?.id || null }))
            }
            renderInput={(params) => <TextField {...params} label="Program" />}
          />
          <Select
            name="current_status"
            value={formData.current_status || ''}
            onChange={handleFormChange}
            displayEmpty
            fullWidth
          >
            <MenuItem value="">
              <em>Select Status</em>
            </MenuItem>
            {STATUS_CHOICES.map((choice) => (
              <MenuItem key={choice.value} value={choice.value}>
                {choice.label}
              </MenuItem>
            ))}
          </Select>
          <TextField
            label="Income Change (%)"
            name="income_change"
            value={formData.income_change}
            onChange={handleFormChange}
            fullWidth
          />
          <TextField
            label="Last Contact"
            name="last_contact"
            type="date"
            value={formData.last_contact || ''}
            onChange={handleFormChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Follow-up Interval"
            name="follow_up_interval"
            value={formData.follow_up_interval}
            onChange={handleFormChange}
            fullWidth
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.needs_support}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, needs_support: e.target.checked }))
                }
              />
            }
            label="Needs Support"
          />
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
        title="Delete Alumni Record"
        content="Are you sure you want to delete this alumni record?"
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
