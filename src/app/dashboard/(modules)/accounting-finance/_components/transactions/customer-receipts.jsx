'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import AlertTitle from '@mui/material/AlertTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { useCustomerReceiptsApi } from './use-customer-receipts-api';

const STATUS_COLORS = {
  draft: 'default',
  posted: 'success',
  pending: 'warning',
};

const ALLOCATION_COLORS = {
  unallocated: 'error',
  partially_allocated: 'warning',
  fully_allocated: 'success',
};

const EMPTY_RECEIPT = {
  customer_id: '',
  date: '2026-03-29',
  method: 'Bank transfer',
  bankAccount: 'Collections Clearing',
  amount: '',
  reference: '',
  collectionOwner: '',
  remittanceAdvice: '',
  notes: '',
};

const RECEIPT_BANK_ACCOUNTS = [
  'Collections Clearing',
  'Operating Bank Account',
  'Mobile Collection Wallet',
];

function formatAllocationLabel(value) {
  return value.replace(/_/g, ' ');
}

export default function CustomerReceipts() {
  const { activeCurrency } = useCurrency();
  const api = useCustomerReceiptsApi();
  const { receipts, customers, getCustomerById } = api;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [allocationStatus, setAllocationStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftReceipt, setDraftReceipt] = useState(EMPTY_RECEIPT);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [allocationDraft, setAllocationDraft] = useState({
    invoice_number: '',
    amount: '',
    writeoffReason: 'Bank charge tolerance',
  });

  const filteredReceipts = useMemo(
    () =>
      receipts.filter((receipt) => {
        const customer = getCustomerById(receipt.customer_id);
        const haystack =
          `${receipt.number} ${receipt.reference} ${customer?.name || ''}`.toLowerCase();
        if (search && !haystack.includes(search.toLowerCase())) return false;
        if (status !== 'all' && receipt.status !== status) return false;
        if (allocationStatus !== 'all' && receipt.allocationStatus !== allocationStatus)
          return false;
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allocationStatus, receipts, search, status, getCustomerById]
  );

  const unappliedCount = receipts.filter((receipt) => receipt.unappliedAmount > 0).length;
  const draftCount = receipts.filter((receipt) => receipt.status === 'draft').length;
  const postedValue = receipts
    .filter((receipt) => receipt.status === 'posted')
    .reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0);
  const unappliedValue = receipts.reduce(
    (sum, receipt) => sum + Number(receipt.unappliedAmount || 0),
    0
  );
  const selectedReceipt =
    receipts.find((receipt) => receipt.id === selectedReceiptId) || receipts[0] || null;
  const selectedCustomer = selectedReceipt ? getCustomerById(selectedReceipt.customer_id) : null;
  const candidateInvoices = [];
  const overpaidReceipts = receipts.filter(
    (receipt) =>
      receipt.status === 'posted' && receipt.unappliedAmount > 0 && receipt.allocations.length > 0
  ).length;

  const updateDraft = (field, value) => {
    setDraftReceipt((current) => ({ ...current, [field]: value }));
  };

  const handleCreateReceipt = async () => {
    try {
      if (editTarget) {
        await api.actions.updateReceipt(editTarget.id, draftReceipt);
        toast.success('Receipt updated successfully');
      } else {
        const created = await api.actions.createReceipt(draftReceipt);
        setSelectedReceiptId(created.id);
        setAllocationDraft((current) => ({
          ...current,
          amount: created.amount ? String(created.amount) : current.amount,
        }));
        toast.success('Receipt created successfully');
      }
      setDraftReceipt(EMPTY_RECEIPT);
      setEditTarget(null);
      setDialogOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to save receipt');
    }
  };

  const handleOpenEditDialog = (receipt) => {
    setEditTarget(receipt);
    setDraftReceipt({
      customer_id: receipt.customer_id ?? '',
      reference: receipt.reference ?? '',
      date: receipt.date || new Date().toISOString().slice(0, 10),
      method: receipt.method ?? 'Bank transfer',
      bankAccount: receipt.bankAccount ?? '',
      collectionOwner: receipt.collectionOwner ?? '',
      remittanceAdvice: receipt.remittanceAdvice ?? '',
      amount: String(receipt.amount || ''),
      notes: receipt.notes ?? '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.actions.deleteReceipt(deleteTarget.id);
      toast.success('Receipt deleted');
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to delete receipt');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleAutoAllocate = async (receiptId) => {
    try {
      await api.actions.autoAllocate(receiptId);
      toast.success('Receipt auto-allocated successfully');
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Auto-allocation failed');
    }
  };

  const allocateSelectedReceipt = async () => {
    if (!selectedReceipt || !allocationDraft.invoice_number) return;
    try {
      await api.actions.allocate(selectedReceipt.id, {
        invoice_number: allocationDraft.invoice_number,
        amount: Number(allocationDraft.amount || selectedReceipt.unappliedAmount || 0),
      });
      toast.success('Allocation recorded');
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Allocation failed');
    }
  };

  const holdAsAdvance = async () => {
    if (!selectedReceipt) return;
    try {
      await api.actions.holdAsAdvance(selectedReceipt.id);
      toast.success('Receipt held as customer advance');
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Hold failed');
    }
  };

  const writeOffResidual = async () => {
    if (!selectedReceipt) return;
    try {
      await api.actions.writeOffResidual(selectedReceipt.id, {
        amount: Number(allocationDraft.amount || selectedReceipt.unappliedAmount || 0),
        reason: allocationDraft.writeoffReason,
      });
      toast.success('Residual written off');
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Write-off failed');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Customer Receipts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live receipts workspace for allocation, unapplied cash control, and collection clearing
            review.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setDialogOpen(true)}
        >
          New Receipt
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        <AlertTitle>Receipt allocation active</AlertTitle>
        Customer receipts now track unapplied cash, allocation status, and collection notes from
        shared mock transaction records.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Draft receipts',
            value: draftCount,
            icon: 'solar:document-add-bold-duotone',
            color: '#2563eb',
          },
          {
            label: 'Need allocation',
            value: unappliedCount,
            icon: 'solar:danger-circle-bold-duotone',
            color: '#dc2626',
          },
          {
            label: 'Posted value',
            value: formatCurrency(postedValue),
            icon: 'solar:wallet-money-bold-duotone',
            color: '#16a34a',
          },
          {
            label: 'Unapplied cash',
            value: formatCurrency(unappliedValue),
            icon: 'solar:bill-list-bold-duotone',
            color: '#f59e0b',
          },
          {
            label: 'Overpayment holds',
            value: overpaidReceipts,
            icon: 'solar:archive-minimalistic-bold-duotone',
            color: '#7c3aed',
          },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 2.4 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {card.label}
                    </Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>
                    <Iconify icon={card.icon} width={28} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search receipt, customer, or reference"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:magnifer-linear" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="all">All status</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="posted">Posted</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              value={allocationStatus}
              onChange={(event) => setAllocationStatus(event.target.value)}
              sx={{ minWidth: 190 }}
            >
              <MenuItem value="all">All allocation</MenuItem>
              <MenuItem value="unallocated">Unallocated</MenuItem>
              <MenuItem value="partially_allocated">Partially allocated</MenuItem>
              <MenuItem value="fully_allocated">Fully allocated</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: 3, overflowX: 'auto' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Receipt #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Allocation</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Unapplied</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReceipts.map((receipt) => {
                    const customer = getCustomerById(receipt.customer_id);

                    return (
                      <TableRow
                        key={receipt.id}
                        hover
                        selected={receipt.id === selectedReceipt?.id}
                        onClick={() => {
                          setSelectedReceiptId(receipt.id);
                          setAllocationDraft((current) => ({
                            ...current,
                            invoice_number:
                              receipt.allocations[0]?.invoice_number || current.invoice_number,
                            amount: receipt.unappliedAmount
                              ? String(receipt.unappliedAmount)
                              : current.amount,
                          }));
                        }}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{ fontFamily: 'monospace' }}
                          >
                            {receipt.number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {customer?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {receipt.reference}
                          </Typography>
                        </TableCell>
                        <TableCell>{new Date(receipt.date).toLocaleDateString()}</TableCell>
                        <TableCell>{receipt.method}</TableCell>
                        <TableCell>
                          <Chip
                            label={formatAllocationLabel(receipt.allocationStatus)}
                            size="small"
                            color={ALLOCATION_COLORS[receipt.allocationStatus]}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell align="right">{formatCurrency(receipt.amount)}</TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            color={receipt.unappliedAmount > 0 ? 'warning.main' : 'success.main'}
                          >
                            {formatCurrency(receipt.unappliedAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={receipt.status}
                            size="small"
                            color={STATUS_COLORS[receipt.status]}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end" spacing={1}>
                            <Tooltip title="Edit receipt">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditDialog(receipt);
                                }}
                                disabled={receipt.status === 'posted'}
                              >
                                <Iconify icon="solar:pen-bold" width={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete receipt">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(receipt);
                                }}
                                disabled={receipt.status === 'posted'}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                              </IconButton>
                            </Tooltip>
                            <Button
                              size="small"
                              variant="text"
                              component={RouterLink}
                              href={paths.dashboard.accountingFinance.transactions.customerReceiptDetail(
                                receipt.id
                              )}
                            >
                              View
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={receipt.unappliedAmount <= 0}
                              onClick={() => handleAutoAllocate(receipt.id)}
                            >
                              Allocate
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                  Matching Workspace
                </Typography>
                {selectedReceipt ? (
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedReceipt.number}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedCustomer?.name} • {selectedReceipt.method} •{' '}
                        {selectedReceipt.bankAccount}
                      </Typography>
                    </Box>
                    <Alert
                      severity={selectedReceipt.unappliedAmount > 0 ? 'warning' : 'success'}
                      sx={{ borderRadius: 2 }}
                    >
                      Unapplied balance: {formatCurrency(selectedReceipt.unappliedAmount)}
                    </Alert>
                    <TextField
                      size="small"
                      label="Target invoice number"
                      placeholder="e.g. INV-2026-001"
                      value={allocationDraft.invoice_number}
                      onChange={(event) =>
                        setAllocationDraft((current) => ({
                          ...current,
                          invoice_number: event.target.value,
                        }))
                      }
                    />
                    <TextField
                      size="small"
                      type="number"
                      label="Allocation / residual amount"
                      value={allocationDraft.amount}
                      onChange={(event) =>
                        setAllocationDraft((current) => ({
                          ...current,
                          amount: event.target.value,
                        }))
                      }
                    />
                    <TextField
                      select
                      size="small"
                      label="Write-off reason"
                      value={allocationDraft.writeoffReason}
                      onChange={(event) =>
                        setAllocationDraft((current) => ({
                          ...current,
                          writeoffReason: event.target.value,
                        }))
                      }
                    >
                      <MenuItem value="Bank charge tolerance">Bank charge tolerance</MenuItem>
                      <MenuItem value="Minor FX difference">Minor FX difference</MenuItem>
                      <MenuItem value="Customer short-pay tolerance">
                        Customer short-pay tolerance
                      </MenuItem>
                    </TextField>
                    <Stack spacing={1}>
                      <Button
                        variant="contained"
                        onClick={allocateSelectedReceipt}
                        disabled={
                          selectedReceipt.unappliedAmount <= 0 ||
                          !allocationDraft.invoice_number.trim()
                        }
                      >
                        Match To Invoice
                      </Button>
                      <Button
                        variant="outlined"
                        color="inherit"
                        onClick={holdAsAdvance}
                        disabled={selectedReceipt.unappliedAmount <= 0}
                      >
                        Hold As Customer Advance
                      </Button>
                      <Button
                        variant="outlined"
                        color="warning"
                        onClick={writeOffResidual}
                        disabled={selectedReceipt.unappliedAmount <= 0}
                      >
                        Write Off Residual
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a receipt to review invoice matching and residual treatment.
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                  Candidate Invoices
                </Typography>
                <Stack spacing={1.5} divider={<Divider flexItem />}>
                  {candidateInvoices.length ? (
                    candidateInvoices.map((invoice) => (
                      <Box key={invoice.id}>
                        <Typography variant="body2" fontWeight={700}>
                          {invoice.number}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          Due {new Date(invoice.due_date).toLocaleDateString()} • Balance{' '}
                          {formatCurrency(invoice.balance_due)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {invoice.dunningStage.replace(/_/g, ' ')} • {invoice.paymentTerms}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      No open invoices are seeded for this customer, so residual cash may need to
                      stay as advance.
                    </Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid> */}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Customer Receipt</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.25 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Capture the receiving account, remittance advice, and collection owner before
              allocation begins.
            </Alert>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Customer"
                  value={draftReceipt.customer_id}
                  onChange={(event) => updateDraft('customer_id', event.target.value)}
                >
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Receipt date"
                  type="date"
                  value={draftReceipt.date}
                  onChange={(event) => updateDraft('date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Method"
                  value={draftReceipt.method}
                  onChange={(event) => updateDraft('method', event.target.value)}
                >
                  <MenuItem value="Bank transfer">Bank transfer</MenuItem>
                  <MenuItem value="Wire transfer">Wire transfer</MenuItem>
                  <MenuItem value="Mobile banking">Mobile banking</MenuItem>
                  <MenuItem value="Cash">Cash</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Receiving account"
                  value={draftReceipt.bankAccount}
                  onChange={(event) => updateDraft('bankAccount', event.target.value)}
                >
                  {RECEIPT_BANK_ACCOUNTS.map((account) => (
                    <MenuItem key={account} value={account}>
                      {account}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Reference"
                  value={draftReceipt.reference}
                  onChange={(event) => updateDraft('reference', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Collection owner"
                  value={draftReceipt.collectionOwner}
                  onChange={(event) => updateDraft('collectionOwner', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Amount"
                  type="number"
                  value={draftReceipt.amount}
                  onChange={(event) => updateDraft('amount', event.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">{activeCurrency.symbol}</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Remittance advice"
                  value={draftReceipt.remittanceAdvice}
                  onChange={(event) => updateDraft('remittanceAdvice', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={3}
                  label="Collection notes"
                  value={draftReceipt.notes}
                  onChange={(event) => updateDraft('notes', event.target.value)}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDialogOpen(false);
              setEditTarget(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateReceipt}
            disabled={
              !draftReceipt.collectionOwner.trim() ||
              !draftReceipt.reference.trim() ||
              Number(draftReceipt.amount) <= 0
            }
          >
            {editTarget ? 'Save Changes' : 'Save Draft'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Receipt?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete receipt <strong>{deleteTarget?.number}</strong>? This
            action cannot be undone.
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
