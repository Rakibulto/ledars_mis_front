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
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import LockIcon from '@mui/icons-material/Lock';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import { Iconify } from 'src/components/iconify';

import { useFiscalYearApi } from './use-fiscal-year-api';
import { CoreLedgerConfigToolbar } from './core-ledger-config-toolbar';

const BASE_PATH = '/dashboard/accounting-finance/configuration/fiscal-year';

const EMPTY_FORM = {
  name: '',
  start_date: '',
  end_date: '',
  status: 'draft',
};

export default function FiscalYear() {
  const workspace = useFiscalYearApi();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Name</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Start</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>End</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Status
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Lifecycle Status
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Readiness
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.fiscalYears.map((year) => (
          <tr key={year.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{year.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {new Date(year.start_date).toLocaleDateString()}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {new Date(year.end_date).toLocaleDateString()}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{year.status}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{year.lifecycleState}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{year.closeReadiness}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const handleCreate = async () => {
    if (!form.name.trim() || !form.start_date || !form.end_date) {
      toast.error('Name, start date, and end date are required');
      return;
    }
    if (form.start_date >= form.end_date) {
      toast.error('End date must be after start date');
      return;
    }
    try {
      if (editTarget) {
        await workspace.actions.updateFiscalYear(editTarget.id, form);
        toast.success('Fiscal year updated');
      } else {
        await workspace.actions.createFiscalYear(form);
        toast.success('Fiscal year created');
      }
      setOpen(false);
      setEditTarget(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to save fiscal year');
    }
  };

  const handleOpenEditDialog = (year) => {
    setEditTarget(year);
    setForm({
      name: year.name || '',
      start_date: year.start_date || '',
      end_date: year.end_date || '',
      status: year.status || 'draft',
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      await workspace.actions.deleteFiscalYear(deleteTarget.id);
      toast.success('Fiscal year deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete fiscal year');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <CoreLedgerConfigToolbar printTitle="Fiscal Years" printContent={printContent} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Fiscal Years
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Define fiscal-year governance, close readiness, and archive posture.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setOpen(true)}
        >
          New Fiscal Year
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Open fiscal years
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="h5" fontWeight={800}>
                  {workspace.overview.openFiscalYears}
                </Typography>
                <CalendarMonthIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Closed fiscal years
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="h5" fontWeight={800}>
                  {workspace.overview.closedFiscalYears}
                </Typography>
                <EventBusyIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Closed periods
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="h5" fontWeight={800}>
                  {workspace.overview.closedPeriods}
                </Typography>
                <LockIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Lifecycle</TableCell>
                <TableCell>Readiness</TableCell>
                <TableCell>Next Action</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workspace.fiscalYears.map((year) => (
                <TableRow key={year.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {year.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{new Date(year.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(year.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={year.status}
                      size="small"
                      color={
                        year.status === 'open'
                          ? 'success'
                          : year.status === 'closed'
                            ? 'error'
                            : 'default'
                      }
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{year.lifecycleState}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {year.reopenPolicy}
                    </Typography>
                  </TableCell>
                  <TableCell>{year.closeReadiness}</TableCell>
                  <TableCell>{year.nextAction}</TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                      alignItems="center"
                    >
                      <Tooltip title="View details">
                        <Button
                          component={Link}
                          href={`${BASE_PATH}/${year.id}`}
                          size="small"
                          variant="text"
                        >
                          View Details
                        </Button>
                      </Tooltip>
                      {!year.is_closed && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenEditDialog(year)}>
                            <Iconify icon="solar:pen-bold" width={16} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!year.is_closed && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteTarget(year)}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!year.totalPeriods ? (
                        <Button
                          size="small"
                          variant="text"
                          color="inherit"
                          onClick={() => workspace.actions.generateFiscalPeriods(year.id)}
                        >
                          Generate Periods
                        </Button>
                      ) : null}
                      {year.status === 'draft' ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          onClick={() => workspace.actions.reopenFiscalYear(year.id)}
                        >
                          Open Year
                        </Button>
                      ) : year.status === 'open' ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          onClick={() => workspace.actions.closeFiscalYear(year.id)}
                        >
                          Close Year
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          onClick={() => workspace.actions.reopenFiscalYear(year.id)}
                        >
                          Open Year
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Fiscal Year' : 'New Fiscal Year'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            {editTarget ? (
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Code"
                  value={editTarget.code ?? ''}
                  InputProps={{ readOnly: true }}
                  helperText="Auto-generated code"
                />
              </Grid>
            ) : null}
            <Grid size={{ xs: 12, sm: editTarget ? 8 : 12 }}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={form.start_date}
                inputProps={{ max: form.end_date || undefined }}
                onChange={(event) =>
                  setForm((current) => ({ ...current, start_date: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={form.end_date}
                inputProps={{ min: form.start_date || undefined }}
                error={Boolean(form.start_date && form.end_date && form.end_date <= form.start_date)}
                helperText={
                  form.start_date && form.end_date && form.end_date <= form.start_date
                    ? 'End date must be after start date'
                    : ''
                }
                onChange={(event) =>
                  setForm((current) => ({ ...current, end_date: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Status"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value }))
                }
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="open">Open</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
              setEditTarget(null);
              setForm(EMPTY_FORM);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreate}>
            {editTarget ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Fiscal Year</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
