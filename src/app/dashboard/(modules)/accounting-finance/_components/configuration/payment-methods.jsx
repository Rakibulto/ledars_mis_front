'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
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

import { Iconify } from 'src/components/iconify';

import { usePaymentMethodsApi } from './use-payment-methods-api';
import { ReferenceConfigToolbar } from './reference-config-toolbar';

const BASE_PATH = '/dashboard/accounting-finance/configuration/payment-methods';

function MetricCard({ label, value, helper }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function PaymentMethods() {
  const workspace = usePaymentMethodsApi();
  const [open, setOpen] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    type: 'inbound',
    payment_flow: '',
    journal: '',
    settlement_days: 0,
    bank_export_config: '',
    behavior_chain: '',
  });
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const selectedMethod =
    workspace.paymentMethods.find((method) => String(method.id) === String(selectedMethodId)) ||
    workspace.paymentMethods[0] ||
    null;

  const saveMethod = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and code are required');
      return;
    }

    setSubmitting(true);
    try {
      if (editTarget) {
        await workspace.actions.updatePaymentMethod(editTarget.id, form);
        toast.success('Payment method updated');
      } else {
        await workspace.actions.createPaymentMethod(form);
        toast.success('Payment method created');
      }
      setOpen(false);
      setEditTarget(null);
      setForm({
        name: '',
        code: '',
        type: 'inbound',
        payment_flow: '',
        journal: '',
        settlement_days: 0,
        bank_export_config: '',
        behavior_chain: '',
      });
    } catch (error) {
      toast.error(error?.message || 'Failed to save payment method');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditDialog = (method) => {
    setEditTarget(method);
    setForm({
      name: method.name || '',
      code: method.code || '',
      type: method.type || 'inbound',
      payment_flow: method.payment_flow || '',
      journal: method.journal || '',
      settlement_days: method.settlement_days ?? 0,
      bank_export_config: method.bank_export_config || method.bankExportConfig || '',
      behavior_chain: method.behavior_chain || method.behaviorChain || '',
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      await workspace.actions.deletePaymentMethod(deleteTarget.id);
      toast.success('Payment method deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete payment method');
    }
  };

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Code</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Name</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Type</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Settlement Days
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Export Profile
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.paymentMethods.map((method) => (
          <tr key={method.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{method.code}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{method.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{method.type}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {method.settlement_days} day(s)
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{method.exportProfile}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {method.active ? 'Active' : 'Inactive'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <Box sx={{ p: 3 }}>
      <ReferenceConfigToolbar printTitle="Payment Methods" printContent={printContent} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Payment Methods
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Collection and disbursement routes with settlement timing, journals, and export
            behavior.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setOpen(true)}
        >
          New Payment Method
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Methods"
            value={workspace.overview.paymentMethodCount}
            helper="Inbound and outbound routes configured"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Active"
            value={workspace.overview.activePaymentMethods}
            helper="Enabled for live posting flows"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Inbound"
            value={workspace.paymentMethods.filter((method) => method.type === 'inbound').length}
            helper="Collection-side routes"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Outbound"
            value={workspace.paymentMethods.filter((method) => method.type === 'outbound').length}
            helper="Vendor and treasury disbursement routes"
          />
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Method</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Behavior</TableCell>
                <TableCell>Settlement</TableCell>
                <TableCell>Export Profile</TableCell>
                <TableCell>Fee / Flow Chain</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workspace.paymentMethods.map((method) => (
                <TableRow
                  key={method.id}
                  hover
                  selected={String(method.id) === String(selectedMethod?.id)}
                  onClick={() => setSelectedMethodId(method.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Stack spacing={0.35}>
                      <Typography variant="body2" fontWeight={700}>
                        {method.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {method.code} • {method.payment_flow} • {method.journal}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={method.type}
                      size="small"
                      color={method.type === 'inbound' ? 'success' : 'warning'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>{method.defaultBehavior}</TableCell>
                  <TableCell>{method.settlement_days} day(s)</TableCell>
                  <TableCell>{method.exportProfile}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{method.feeRule}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {method.bankExportConfig} • {method.behaviorChain}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={method.active ? 'Active' : 'Inactive'}
                      size="small"
                      color={method.active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View details">
                      <Button
                        component={Link}
                        href={`${BASE_PATH}/${method.id}`}
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
                          handleOpenEditDialog(method);
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
                          setDeleteTarget(method);
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
                        workspace.actions.togglePaymentMethodStatus(method.id);
                      }}
                    >
                      {method.active ? 'Disable' : 'Enable'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* {selectedMethod ? (
        <Card sx={{ borderRadius: 3, mt: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Settlement Control Detail
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1.1}>
                  <Typography variant="body2">
                    Method: <strong>{selectedMethod.name}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Collection/disbursement type: <strong>{selectedMethod.type}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Default behavior: <strong>{selectedMethod.defaultBehavior}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Settlement timing: <strong>{selectedMethod.settlement_days} day(s)</strong>
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1.1}>
                  <Typography variant="body2">
                    Behavior chain: <strong>{selectedMethod.behaviorChain}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Export profile: <strong>{selectedMethod.exportProfile}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Bank export config: <strong>{selectedMethod.bankExportConfig}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Fee rule: <strong>{selectedMethod.feeRule}</strong>
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : null} */}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Payment Method' : 'New Payment Method'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
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
                label="Code"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Type"
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value }))
                }
              >
                <MenuItem value="inbound">Inbound</MenuItem>
                <MenuItem value="outbound">Outbound</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Payment Flow"
                value={form.payment_flow}
                onChange={(event) =>
                  setForm((current) => ({ ...current, payment_flow: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Journal"
                value={form.journal}
                onChange={(event) =>
                  setForm((current) => ({ ...current, journal: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Settlement Days"
                value={form.settlement_days}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    settlement_days: Number(event.target.value),
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Bank Export Config"
                value={form.bank_export_config}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bank_export_config: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Behavior Chain"
                value={form.behavior_chain}
                onChange={(event) =>
                  setForm((current) => ({ ...current, behavior_chain: event.target.value }))
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
                name: '',
                code: '',
                type: 'inbound',
                payment_flow: '',
                journal: '',
                settlement_days: 0,
                bank_export_config: '',
                behavior_chain: '',
              });
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={saveMethod} disabled={submitting}>
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
        <DialogTitle>Delete Payment Method</DialogTitle>
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
