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
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';
import CorporateFareIcon from '@mui/icons-material/CorporateFare'; // Active centers   — green
import ReportProblemIcon from '@mui/icons-material/ReportProblem'; // Critical centers — red
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'; // Tracked budget   — primary

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { useCostCentersApi } from './use-cost-centers-api';
import { PlanningConfigToolbar } from './planning-config-toolbar';

const BASE_PATH = '/dashboard/accounting-finance/configuration/cost-centers';

const EMPTY_FORM = {
  code: '',
  name: '',
  manager: '',
  parent: '',
  budget: 0,
  spent: 0,
};

export default function CostCenters() {
  useCurrency();
  const workspace = useCostCentersApi();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleCreate = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Code and name are required');
      return;
    }
    try {
      if (editTarget) {
        await workspace.actions.updateCostCenter(editTarget.id, form);
        toast.success('Cost center updated');
      } else {
        await workspace.actions.createCostCenter(form);
        toast.success('Cost center created');
      }
      setOpen(false);
      setEditTarget(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err?.message || 'Failed to save cost center');
    }
  };

  const handleOpenEditDialog = (center) => {
    setEditTarget(center);
    setForm({
      code: center.code || '',
      name: center.name || '',
      manager: center.manager || '',
      parent: center.parent || '',
      budget: center.budget ?? 0,
      spent: center.spent ?? 0,
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      await workspace.actions.deleteCostCenter(deleteTarget.id);
      toast.success('Cost center deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete cost center');
    }
  };

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Code</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Name</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Parent
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Manager
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
            Budget
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
            Spent
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
            Utilization
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'center' }}>
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.costCenters.map((center) => (
          <tr key={center.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontFamily: 'monospace' }}>
              {center.code}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{center.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {center.parentName || '—'}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {center.manager || 'Unassigned'}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              {formatCurrency(center.budget)}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              {formatCurrency(center.spent)}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              {center.utilization}%
            </td>
            <td
              style={{
                border: '1px solid #ddd',
                padding: '6px 8px',
                textAlign: 'center',
                textTransform: 'capitalize',
              }}
            >
              {center.reviewState}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <Box sx={{ p: 3 }}>
      <PlanningConfigToolbar printTitle="Cost Centers" printContent={printContent} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Cost Centers / Analytic Accounts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track planning ownership, utilization posture, and linked budget pressure by center.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setOpen(true)}
        >
          New Cost Center
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Active centers
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
                  {workspace.overview.activeCostCenters}
                </Typography>
                <CorporateFareIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Critical centers
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
                  {workspace.overview.criticalCostCenters}
                </Typography>
                <ReportProblemIcon sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Tracked budget
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
                  {formatCurrency(workspace.overview.trackedBudget)}
                </Typography>
                <AccountBalanceWalletIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700}>
            Ownership and hierarchy
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cost centers now expose parent structure, manager ownership, linked budget plans, and
            transfer posture.
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Hierarchy</TableCell>
                <TableCell>Manager</TableCell>
                <TableCell align="right">Budget</TableCell>
                <TableCell align="right">Spent</TableCell>
                <TableCell>Utilization</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workspace.costCenters.map((center) => (
                <TableRow key={center.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {center.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {center.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {center.driver}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{center.hierarchyLabel}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Parent: {center.parentName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{center.manager || 'Unassigned'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {center.managerOwnership}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(center.budget)}</TableCell>
                  <TableCell align="right">{formatCurrency(center.spent)}</TableCell>
                  <TableCell sx={{ minWidth: 170 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(center.utilization, 100)}
                        sx={{ flex: 1, height: 6, borderRadius: 3 }}
                        color={
                          center.utilization > 90
                            ? 'error'
                            : center.utilization > 70
                              ? 'warning'
                              : 'primary'
                        }
                      />
                      <Typography variant="caption" fontWeight={600}>
                        {center.utilization}%
                      </Typography>
                    </Stack>
                    <Chip
                      label={center.reviewState}
                      size="small"
                      color={
                        center.reviewState === 'critical'
                          ? 'error'
                          : center.reviewState === 'watch'
                            ? 'warning'
                            : 'success'
                      }
                      sx={{ mt: 0.75, textTransform: 'capitalize' }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.75 }}
                    >
                      {center.budgetLinkage}
                    </Typography>
                  </TableCell>
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
                          href={`${BASE_PATH}/${center.id}`}
                          size="small"
                          variant="text"
                        >
                          View Details
                        </Button>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenEditDialog(center)}>
                          <Iconify icon="solar:pen-bold" width={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(center)}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                        </IconButton>
                      </Tooltip>
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        onClick={() => workspace.actions.toggleCostCenterStatus(center.id)}
                      >
                        {center.active ? 'Disable' : 'Enable'}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Cost Center' : 'New Cost Center'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Code"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
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
                label="Manager"
                value={form.manager}
                onChange={(event) =>
                  setForm((current) => ({ ...current, manager: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Parent Id"
                value={form.parent}
                onChange={(event) =>
                  setForm((current) => ({ ...current, parent: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Budget"
                value={form.budget}
                onChange={(event) =>
                  setForm((current) => ({ ...current, budget: Number(event.target.value) }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Spent"
                value={form.spent}
                onChange={(event) =>
                  setForm((current) => ({ ...current, spent: Number(event.target.value) }))
                }
              />
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
        <DialogTitle>Delete Cost Center</DialogTitle>
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
