'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import PublicIcon from '@mui/icons-material/Public';
import ShieldIcon from '@mui/icons-material/Shield';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import {
  Box,
  Card,
  Chip,
  Grid,
  Table,
  Stack,
  Button,
  Dialog,
  Tooltip,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  CardContent,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

import { useIncotermApi } from './use-incoterms-api';
import { PolicyConfigToolbar } from './policy-config-toolbar';

const BASE_PATH = '/dashboard/accounting-finance/configuration/incoterms';

function Incoterms() {
  const api = useIncotermApi();
  const [open, setOpen] = useState(false);
  const [selectedIncotermId, setSelectedIncotermId] = useState(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    risk_transfer: '',
    usageScope: '',
    allocationRule: '',
    billFlowUsage: '',
    invoiceFlowUsage: '',
  });
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const sortedIncoterms = useMemo(
    () =>
      [...api.incoterms].sort((a, b) => {
        const aTime = Date.parse(a.created_at || a.createdAt || '') || 0;
        const bTime = Date.parse(b.created_at || b.createdAt || '') || 0;
        if (aTime !== bTime) return bTime - aTime;
        return Number(b.id || 0) - Number(a.id || 0);
      }),
    [api.incoterms]
  );

  const selectedIncoterm =
    sortedIncoterms.find((item) => String(item.id) === String(selectedIncotermId)) ||
    sortedIncoterms[0] ||
    null;

  const handleCreate = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Code and name are required');
      return;
    }
    try {
      if (editTarget) {
        await api.actions.updateIncoterm(editTarget.id, form);
        toast.success('Incoterm updated');
      } else {
        await api.actions.createIncoterm(form);
        toast.success('Incoterm created');
      }
      setOpen(false);
      setEditTarget(null);
      setForm({
        code: '',
        name: '',
        description: '',
        risk_transfer: '',
        usageScope: '',
        allocationRule: '',
        billFlowUsage: '',
        invoiceFlowUsage: '',
      });
    } catch {
      toast.error('Failed to save incoterm');
    }
  };

  const handleOpenEditDialog = (inc) => {
    setEditTarget(inc);
    setForm({
      code: inc.code || '',
      name: inc.name || '',
      description: inc.description || '',
      risk_transfer: inc.risk_transfer || '',
      usageScope: inc.usageScope || '',
      allocationRule: inc.allocationRule || '',
      billFlowUsage: inc.billFlowUsage || '',
      invoiceFlowUsage: inc.invoiceFlowUsage || '',
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.actions.deleteIncoterm(deleteTarget.id);
      toast.success('Incoterm deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete incoterm');
    }
  };

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Code</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Name</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Risk Transfer
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Usage Scope
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Bill Flow
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedIncoterms.map((inc) => (
          <tr key={inc.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{inc.code}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{inc.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {inc.risk_transfer || 'At delivery point'}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{inc.usageScope}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{inc.billFlowUsage}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {inc.active ? 'Active' : 'Inactive'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <Box sx={{ p: 3 }}>
      <PolicyConfigToolbar printTitle="Incoterms" printContent={printContent} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Incoterms
          </Typography>
          <Typography variant="body2" color="text.secondary">
            International commercial terms with procurement and invoice usage governance.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setOpen(true)}
        >
          New Incoterm
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Active incoterms
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
                  {api.overview.activeIncoterms}
                </Typography>
                <PublicIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Policy coverage
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
                  {api.overview.policyCoverage}
                </Typography>
                <ShieldIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Trade terms
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
                  {api.incoterms.length}
                </Typography>
                <LocalShippingIcon sx={{ fontSize: 40, color: 'primary.main' }} />
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
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Risk Transfer</TableCell>
                <TableCell>Usage Scope</TableCell>
                <TableCell>Bill / Invoice Use</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedIncoterms.map((inc) => (
                <TableRow
                  key={inc.id}
                  hover
                  selected={String(inc.id) === String(selectedIncoterm?.id)}
                  onClick={() => setSelectedIncotermId(inc.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Chip label={inc.code} size="small" color="primary" sx={{ fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {inc.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {inc.description}
                    </Typography>
                  </TableCell>
                  <TableCell>{inc.risk_transfer || 'At delivery point'}</TableCell>
                  <TableCell>{inc.usageScope}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{inc.billFlowUsage}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {inc.invoiceFlowUsage}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={inc.active ? 'Active' : 'Inactive'}
                      size="small"
                      color={inc.active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View details">
                      <Button
                        component={Link}
                        href={`${BASE_PATH}/${inc.id}`}
                        size="small"
                        variant="text"
                      >
                        View Details
                      </Button>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenEditDialog(inc);
                        }}
                      >
                        <Iconify icon="solar:pen-bold" width={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteTarget(inc);
                        }}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                      </IconButton>
                    </Tooltip>
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      onClick={(event) => {
                        event.stopPropagation();
                        api.actions.toggleIncotermStatus(inc.id);
                      }}
                    >
                      {inc.active ? 'Disable' : 'Enable'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* {selectedIncoterm ? (
        <Card sx={{ borderRadius: 3, mt: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Flow Usage Detail
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1.1}>
                  <Typography variant="body2">
                    Incoterm:{' '}
                    <strong>
                      {selectedIncoterm.code} • {selectedIncoterm.name}
                    </strong>
                  </Typography>
                  <Typography variant="body2">
                    Risk transfer:{' '}
                    <strong>{selectedIncoterm.risk_transfer || 'At delivery point'}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Usage scope: <strong>{selectedIncoterm.usageScope}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Allocation rule: <strong>{selectedIncoterm.allocationRule}</strong>
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1.1}>
                  <Typography variant="body2">
                    Vendor-bill flow: <strong>{selectedIncoterm.billFlowUsage}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Customer-invoice flow: <strong>{selectedIncoterm.invoiceFlowUsage}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Adoption:{' '}
                    <strong>{selectedIncoterm.adoptionRate}% of mapped trade flows</strong>
                  </Typography>
                  <Typography variant="body2">
                    Status:{' '}
                    <strong>
                      {selectedIncoterm.active
                        ? 'Enabled for logistics and invoicing'
                        : 'Disabled for new documents'}
                    </strong>
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : null} */}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Incoterm' : 'New Incoterm'}</DialogTitle>
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
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Risk Transfer"
                value={form.risk_transfer}
                onChange={(event) =>
                  setForm((current) => ({ ...current, risk_transfer: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Usage Scope"
                value={form.usageScope}
                onChange={(event) =>
                  setForm((current) => ({ ...current, usageScope: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Allocation Rule"
                value={form.allocationRule}
                onChange={(event) =>
                  setForm((current) => ({ ...current, allocationRule: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Bill Flow Usage"
                value={form.billFlowUsage}
                onChange={(event) =>
                  setForm((current) => ({ ...current, billFlowUsage: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Invoice Flow Usage"
                value={form.invoiceFlowUsage}
                onChange={(event) =>
                  setForm((current) => ({ ...current, invoiceFlowUsage: event.target.value }))
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
              setForm({
                code: '',
                name: '',
                description: '',
                risk_transfer: '',
                usageScope: '',
                allocationRule: '',
                billFlowUsage: '',
                invoiceFlowUsage: '',
              });
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
        <DialogTitle>Delete Incoterm</DialogTitle>
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

export default Incoterms;
