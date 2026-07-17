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
import HandshakeIcon from '@mui/icons-material/Handshake'; // Active terms      — green
import LocalOfferIcon from '@mui/icons-material/LocalOffer'; // Discount terms    — blue
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom'; // Long-dated terms — amber

import { Iconify } from 'src/components/iconify';

import { usePaymentTermsApi } from './use-payment-terms-api';
import { FoundationalConfigToolbar } from './foundational-config-toolbar';

const BASE_PATH = '/dashboard/accounting-finance/configuration/payment-terms';

const EMPTY_FORM = {
  code: '',
  name: '',
  due_days: 0,
  discount_days: 0,
  discount_percent: 0,
  installment_logic: '',
};

export default function PaymentTerms() {
  const workspace = usePaymentTermsApi();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      if (editTarget) {
        await workspace.actions.updatePaymentTerm(editTarget.id, form);
        toast.success('Payment term updated');
      } else {
        await workspace.actions.createPaymentTerm(form);
        toast.success('Payment term created');
      }
      setOpen(false);
      setEditTarget(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to save payment term');
    }
  };

  const handleOpenEditDialog = (term) => {
    setEditTarget(term);
    setForm({
      code: term.code || '',
      name: term.name || '',
      due_days: term.due_days ?? term.dueDays ?? 0,
      discount_days: term.discount_days ?? term.discountDays ?? 0,
      discount_percent: term.discount_percent ?? term.discountPercent ?? 0,
      installment_logic: term.installment_logic || term.installmentLogic || '',
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      await workspace.actions.deletePaymentTerm(deleteTarget.id);
      toast.success('Payment term deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete payment term');
    }
  };

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Code</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Name</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Due Days
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Discount %
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Discount Days
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Installment Logic
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.paymentTerms.map((term) => (
          <tr key={term.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{term.code}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{term.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{term.dueDays}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {term.discountPercent}%
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{term.discountDays}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {term.installmentLogic}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {term.active ? 'Active' : 'Inactive'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <Box sx={{ p: 3 }}>
      <FoundationalConfigToolbar printTitle="Payment Terms" printContent={printContent} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Payment Terms
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Settlement policy rules for invoice due dates, early-payment discounts, and reminder
            posture.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setOpen(true)}
        >
          New Payment Term
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Active terms
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
                  {workspace.overview.activePaymentTerms}
                </Typography>
                <HandshakeIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Discount terms
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
                  {workspace.overview.discountedTerms}
                </Typography>
                <LocalOfferIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Long-dated terms
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
                  {workspace.overview.longDatedTerms}
                </Typography>
                <HourglassBottomIcon sx={{ fontSize: 40, color: 'warning.main' }} />
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
                <TableCell>Due Days</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>Installment Logic</TableCell>
                <TableCell>Reminder Cadence</TableCell>
                <TableCell>Approval Window</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workspace.paymentTerms.map((term) => (
                <TableRow key={term.id} hover>
                  <TableCell>
                    <Chip
                      label={term.code}
                      size="small"
                      variant="outlined"
                      sx={{ fontFamily: 'monospace' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {term.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {term.settlementProfile}
                    </Typography>
                  </TableCell>
                  <TableCell>{term.dueDays} days</TableCell>
                  <TableCell>
                    {term.discountPercent > 0
                      ? `${term.discountPercent}% in ${term.discountDays} days`
                      : 'No discount'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{term.installmentLogic}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {term.earlyPaymentModel}
                    </Typography>
                  </TableCell>
                  <TableCell>{term.reminderCadence}</TableCell>
                  <TableCell>{term.approvalWindow}</TableCell>
                  <TableCell>
                    <Chip
                      label={term.active ? 'Active' : 'Inactive'}
                      size="small"
                      color={term.active ? 'success' : 'default'}
                    />
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
                          href={`${BASE_PATH}/${term.id}`}
                          size="small"
                          variant="text"
                        >
                          View Details
                        </Button>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenEditDialog(term)}>
                          <Iconify icon="solar:pen-bold" width={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(term)}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                        </IconButton>
                      </Tooltip>
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        onClick={() => workspace.actions.togglePaymentTermStatus(term.id)}
                      >
                        {term.active ? 'Disable' : 'Enable'}
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
        <DialogTitle>{editTarget ? 'Edit Payment Term' : 'New Payment Term'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Due Days"
                value={form.due_days}
                onChange={(event) =>
                  setForm((current) => ({ ...current, due_days: Number(event.target.value) }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Discount Days"
                value={form.discount_days}
                onChange={(event) =>
                  setForm((current) => ({ ...current, discount_days: Number(event.target.value) }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Discount %"
                value={form.discount_percent}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    discount_percent: Number(event.target.value),
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Installment Logic"
                value={form.installment_logic}
                onChange={(event) =>
                  setForm((current) => ({ ...current, installment_logic: event.target.value }))
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
        <DialogTitle>Delete Payment Term</DialogTitle>
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
