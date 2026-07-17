'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { usePerdiumApi } from './use-perdium-api';

const BASE_PATH = '/dashboard/accounting-finance/configuration/perdium';

const EMPTY_FORM = {
  description: '',
  grade: 'H-1',
  area_type: 'high',
  breakfast: 0,
  lunch: 0,
  dinner: 0,
  others_expenses: 0,
  accommodation: 0,
};

export default function Perdium() {
  const api = usePerdiumApi();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleCreate = async () => {
    if (!form.description.trim()) {
      toast.error('Description is required');
      return;
    }
    try {
      if (editTarget) {
        await api.actions.updatePerdium(editTarget.id, form);
        toast.success('Perdium updated successfully');
      } else {
        await api.actions.createPerdium(form);
        toast.success('Perdium created successfully');
      }
      setOpen(false);
      setEditTarget(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to save perdium');
    }
  };

  const handleOpenEditDialog = (perdium) => {
    setEditTarget(perdium);
    setForm({
      description: perdium.description || '',
      grade: perdium.grade || 'H-1',
      area_type: perdium.area_type || 'high',
      breakfast: perdium.breakfast ?? 0,
      lunch: perdium.lunch ?? 0,
      dinner: perdium.dinner ?? 0,
      others_expenses: perdium.others_expenses ?? 0,
      accommodation: perdium.accommodation ?? 0,
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.actions.deletePerdium(deleteTarget.id);
      toast.success('Perdium deleted successfully');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete perdium');
    }
  };

  const handleToggleStatus = async (perdium) => {
    try {
      await api.actions.togglePerdiumStatus(perdium.id);
      toast.success(`Perdium ${perdium.is_active ? 'deactivated' : 'activated'} successfully`);
    } catch {
      toast.error('Failed to update perdium status');
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'H-1':
        return 'error';
      case 'C-G':
        return 'warning';
      case 'A-B':
        return 'info';
      default:
        return 'default';
    }
  };

  const getAreaTypeColor = (areaType) => (areaType === 'high' ? 'error' : 'success');

  return (
    <>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold">
            Perdium Configuration
          </Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => {
              setEditTarget(null);
              setForm(EMPTY_FORM);
              setOpen(true);
            }}
          >
            Add Perdium
          </Button>
        </Stack>

        <Card>
          <CardContent>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Total Perdiums
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {api.overview.totalPerdiums}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Active Perdiums
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {api.overview.activePerdiums}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      High Expensive Area
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="error.main">
                      {api.overview.highAreaPerdiums}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Low Expensive Area
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {api.overview.lowAreaPerdiums}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Area Type</TableCell>
                    <TableCell align="right">Breakfast</TableCell>
                    <TableCell align="right">Lunch</TableCell>
                    <TableCell align="right">Dinner</TableCell>
                    <TableCell align="right">Others</TableCell>
                    <TableCell align="right">Accommodation</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {api.loading ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          Loading...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : api.perdiums.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          No perdium configurations found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    api.perdiums.map((perdium) => (
                      <TableRow key={perdium.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 300 }}>
                            {perdium.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={perdium.grade}
                            color={getGradeColor(perdium.grade)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={perdium.areaTypeDisplay}
                            color={getAreaTypeColor(perdium.area_type)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">{perdium.breakfast?.toFixed(2)}</TableCell>
                        <TableCell align="right">{perdium.lunch?.toFixed(2)}</TableCell>
                        <TableCell align="right">{perdium.dinner?.toFixed(2)}</TableCell>
                        <TableCell align="right">{perdium.others_expenses?.toFixed(2)}</TableCell>
                        <TableCell align="right">{perdium.accommodation?.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            {perdium.total?.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={perdium.is_active ? 'Active' : 'Inactive'}
                            color={perdium.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Details">
                              <IconButton
                                size="small"
                                color="default"
                                component={Link}
                                href={paths.dashboard.accountingFinance.configuration.perdiumDetail(
                                  perdium.id
                                )}
                              >
                                <Iconify icon="solar:eye-bold" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenEditDialog(perdium)}
                              >
                                <Iconify icon="solar:pen-bold" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={perdium.is_active ? 'Deactivate' : 'Activate'}>
                              <IconButton
                                size="small"
                                color={perdium.is_active ? 'warning' : 'success'}
                                onClick={() => handleToggleStatus(perdium)}
                              >
                                <Iconify
                                  icon={
                                    perdium.is_active
                                      ? 'solar:stop-circle-bold'
                                      : 'solar:play-circle-bold'
                                  }
                                />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteTarget(perdium)}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Perdium' : 'Create New Perdium'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Perdium Description (Human Resource management Manual 3.18 & 3.19)"
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Grade"
                  fullWidth
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  SelectProps={{ native: true }}
                >
                  <option value="H-1">H-1</option>
                  <option value="C-G">C-G</option>
                  <option value="A-B">A-B</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Area Type"
                  fullWidth
                  value={form.area_type}
                  onChange={(e) => setForm({ ...form, area_type: e.target.value })}
                  SelectProps={{ native: true }}
                >
                  <option value="high">High Expensive Area</option>
                  <option value="low">Low Expensive Area</option>
                </TextField>
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
              Meal Rates
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Breakfast"
                  type="number"
                  fullWidth
                  value={form.breakfast}
                  onChange={(e) => setForm({ ...form, breakfast: parseFloat(e.target.value) || 0 })}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Lunch"
                  type="number"
                  fullWidth
                  value={form.lunch}
                  onChange={(e) => setForm({ ...form, lunch: parseFloat(e.target.value) || 0 })}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Dinner"
                  type="number"
                  fullWidth
                  value={form.dinner}
                  onChange={(e) => setForm({ ...form, dinner: parseFloat(e.target.value) || 0 })}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
              Other Expenses
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Others Expenses"
                  type="number"
                  fullWidth
                  value={form.others_expenses}
                  onChange={(e) =>
                    setForm({ ...form, others_expenses: parseFloat(e.target.value) || 0 })
                  }
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Accommodation"
                  type="number"
                  fullWidth
                  value={form.accommodation}
                  onChange={(e) =>
                    setForm({ ...form, accommodation: parseFloat(e.target.value) || 0 })
                  }
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Total:{' '}
                {(
                  (form.breakfast || 0) +
                  (form.lunch || 0) +
                  (form.dinner || 0) +
                  (form.others_expenses || 0) +
                  (form.accommodation || 0)
                ).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">
            {editTarget ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this perdium configuration? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
