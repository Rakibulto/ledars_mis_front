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
import Checkbox from '@mui/material/Checkbox';
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
import { useCreditNotesApi } from './use-credit-notes-api';

const STATUS_COLORS = {
  draft: 'default',
  applied: 'success',
};

const EMPTY_NOTE = {
  customer_id: '',
  invoice_ref: '',
  date: new Date().toISOString().slice(0, 10),
  adjustmentType: 'Pricing rebate',
  approvalRoute: '',
  refundReference: '',
  amount: '',
  reason: '',
  notes: '',
};

export default function CreditNotes() {
  const { activeCurrency } = useCurrency();
  const api = useCreditNotesApi();
  const { notes, customers, invoices, getCustomerById } = api;

  const [status, setStatus] = useState('all');
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftNote, setDraftNote] = useState(EMPTY_NOTE);
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredNotes = useMemo(
    () => notes.filter((note) => (status === 'all' ? true : note.status === status)),
    [notes, status]
  );

  // Auto-select first note when data loads
  const effectiveSelectedId = selectedNoteId ?? filteredNotes[0]?.id ?? null;

  const appliedAmountByInvoice = useMemo(() => {
    const totals = {};

    notes.forEach((note) => {
      if (note.status !== 'applied') return;
      totals[note.invoice_ref] = (totals[note.invoice_ref] || 0) + Number(note.amount || 0);
    });

    return totals;
  }, [notes]);

  const adjustmentInvoices = useMemo(
    () =>
      invoices
        .map((invoice) => {
          const appliedCreditAmount = Number(appliedAmountByInvoice[invoice.number] || 0);
          const remainingCreditExposure = Math.max(
            Number(invoice.balance_due || 0) - appliedCreditAmount,
            0
          );
          const eligibleForCredit = invoice.creditWarning || invoice.status === 'overdue';

          return {
            ...invoice,
            appliedCreditAmount,
            remainingCreditExposure,
            eligibleForCredit,
            adjustmentState: eligibleForCredit
              ? remainingCreditExposure > 0
                ? 'open'
                : 'covered'
              : 'clear',
          };
        })
        .sort((left, right) => new Date(left.due_date) - new Date(right.due_date)),
    [appliedAmountByInvoice]
  );

  const selectedNote =
    notes.find((note) => note.id === effectiveSelectedId) || filteredNotes[0] || notes[0] || null;
  const selectedCustomer = selectedNote ? getCustomerById(selectedNote.customer_id) : null;
  const selectedInvoice =
    adjustmentInvoices.find((invoice) => invoice.number === selectedNote?.invoice_ref) || null;
  const candidateInvoices = adjustmentInvoices.filter(
    (invoice) => invoice.customer_id === draftNote.customer_id
  );

  const adjustmentSummary = useMemo(() => {
    const openInvoices = adjustmentInvoices.filter((invoice) => invoice.adjustmentState === 'open');
    const escalatedInvoices = adjustmentInvoices.filter(
      (invoice) => invoice.creditWarning || invoice.dunningStage === 'stage_3'
    );

    return {
      openCount: openInvoices.length,
      escalatedCount: escalatedInvoices.length,
      openExposure: openInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.remainingCreditExposure || 0),
        0
      ),
    };
  }, [adjustmentInvoices]);

  const draftCount = notes.filter((note) => note.status === 'draft').length;
  const appliedValue = notes
    .filter((note) => note.status === 'applied')
    .reduce((sum, note) => sum + Number(note.amount || 0), 0);

  const updateDraft = (field, value) => {
    setDraftNote((current) => ({ ...current, [field]: value }));
  };

  const stageInvoiceForCreditNote = (invoice) => {
    const suggestedAmount = Math.min(
      Number(invoice.remainingCreditExposure || 0),
      Math.round(Number(invoice.balance_due || 0) * 0.15)
    );

    setDraftNote((current) => ({
      ...current,
      customer_id: invoice.customer_id,
      invoice_ref: invoice.number,
      adjustmentType: invoice.creditWarning ? 'Service reversal' : 'Pricing rebate',
      approvalRoute: invoice.creditWarning ? 'Finance Director' : 'Receivables Manager',
      refundReference: invoice.creditWarning
        ? `CR-${invoice.number.split('-').slice(-1)[0]}-RFD`
        : `REBATE-${invoice.number.split('-').slice(-1)[0]}`,
      amount: suggestedAmount > 0 ? String(suggestedAmount) : current.amount,
      reason: invoice.creditWarning
        ? `Adjustment prepared for escalated customer invoice ${invoice.number}.`
        : `Commercial credit prepared for customer invoice ${invoice.number}.`,
      notes: invoice.promiseToPay
        ? `Promise to pay recorded for ${invoice.promiseToPay}. Dunning stage: ${invoice.dunningStage}.`
        : `Dunning stage: ${invoice.dunningStage}.`,
    }));
    setDialogOpen(true);
  };

  const handleCreateNote = async () => {
    if (Number(draftNote.amount) <= 0) return;
    setSaving(true);
    try {
      if (editTarget) {
        await api.actions.updateCreditNote(editTarget.id, draftNote);
        toast.success('Credit note updated.');
      } else {
        const created = await api.actions.createCreditNote(draftNote);
        setSelectedNoteId(created.id);
        toast.success('Credit note draft created.');
      }
      setDraftNote({ ...EMPTY_NOTE, customer_id: customers[0]?.id ?? '' });
      setEditTarget(null);
      setDialogOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save credit note.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditDialog = (note) => {
    setEditTarget(note);
    setDraftNote({
      customer_id: note.customer_id ?? '',
      invoice_ref: note.invoice_ref ?? '',
      date: note.date || new Date().toISOString().slice(0, 10),
      adjustmentType: note.adjustmentType ?? 'billing_error',
      approvalRoute: note.approvalRoute ?? '',
      refundReference: note.refundReference ?? '',
      amount: String(note.amount || ''),
      reason: note.reason ?? '',
      notes: note.notes ?? '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.actions.deleteCreditNote(deleteTarget.id);
      toast.success('Credit note deleted.');
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to delete credit note.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleApply = async (noteId) => {
    try {
      await api.actions.applyCreditNote(noteId);
      toast.success('Credit note applied.');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to apply credit note.');
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
            Credit Notes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live customer credit note workspace for rebates, service reversals, and receivable
            adjustments.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setDialogOpen(true)}
        >
          Create Credit Note
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        <AlertTitle>Receivable adjustment workflow active</AlertTitle>
        Credit notes now track draft and applied states, invoice-level credit exposure, and
        escalated receivable handling from shared receivables mock records.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Draft notes
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {draftCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Applied value
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {formatCurrency(appliedValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Open credit invoices
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {adjustmentSummary.openCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Open credit exposure
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {formatCurrency(adjustmentSummary.openExposure)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ lg: 'center' }}>
            <TextField
              select
              size="small"
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">All status</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="applied">Applied</MenuItem>
            </TextField>
            <Alert severity="warning" sx={{ py: 0, borderRadius: 2, flexGrow: 1 }}>
              Escalated invoices: {adjustmentSummary.escalatedCount}. Open credits:{' '}
              {adjustmentSummary.openCount}.
            </Alert>
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
                    <TableCell>CN #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Invoice Ref</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredNotes.map((note) => {
                    const customer = getCustomerById(note.customer_id);
                    const isSelected = note.id === selectedNote?.id;

                    return (
                      <TableRow
                        key={note.id}
                        hover
                        selected={isSelected}
                        onClick={() => setSelectedNoteId(note.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{ fontFamily: 'monospace' }}
                          >
                            {note.number}
                          </Typography>
                        </TableCell>
                        <TableCell>{customer?.name}</TableCell>
                        <TableCell>{note.invoice_ref}</TableCell>
                        <TableCell>{new Date(note.date).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} color="error.main">
                            {formatCurrency(note.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>{note.reason}</TableCell>
                        <TableCell>
                          <Chip
                            label={note.status}
                            size="small"
                            color={STATUS_COLORS[note.status]}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end" spacing={1}>
                            <Tooltip title="Edit credit note">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditDialog(note);
                                }}
                                disabled={note.status === 'applied' || note.status === 'cancelled'}
                              >
                                <Iconify icon="solar:pen-bold" width={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete credit note">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(note);
                                }}
                                disabled={note.status === 'applied' || note.status === 'cancelled'}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                              </IconButton>
                            </Tooltip>
                            <Button
                              size="small"
                              variant="text"
                              component={RouterLink}
                              href={paths.dashboard.accountingFinance.transactions.creditNoteDetail(
                                note.id
                              )}
                              onClick={(event) => event.stopPropagation()}
                            >
                              View
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={note.status === 'applied' || note.status === 'cancelled'}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleApply(note.id);
                              }}
                            >
                              Apply
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

        {/* <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Selected credit note
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {selectedNote?.number || 'No credit note selected'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCustomer?.name ||
                        'Choose a credit note to review its linked invoice and receivable posture.'}
                    </Typography>
                  </Box>

                  {selectedNote ? (
                    <>
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 6 }}>
                          <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent sx={{ p: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                Note amount
                              </Typography>
                              <Typography variant="subtitle1" fontWeight={800}>
                                {formatCurrency(selectedNote.amount)}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent sx={{ p: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                Application state
                              </Typography>
                              <Typography variant="subtitle1" fontWeight={800}>
                                {selectedNote.applicationStatus}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                      <Divider />
                      {selectedInvoice ? (
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent sx={{ p: 2 }}>
                            <Stack direction="row" justifyContent="space-between" spacing={1}>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={800}>
                                  {selectedInvoice.number}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Due {new Date(selectedInvoice.due_date).toLocaleDateString()} ·{' '}
                                  {selectedInvoice.dunningStage}
                                </Typography>
                              </Box>
                              <Chip
                                size="small"
                                label={selectedInvoice.adjustmentState}
                                color={
                                  selectedInvoice.adjustmentState === 'open'
                                    ? 'warning'
                                    : selectedInvoice.adjustmentState === 'covered'
                                      ? 'success'
                                      : 'default'
                                }
                              />
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                Applied credit notes
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                {formatCurrency(selectedInvoice.appliedCreditAmount)}
                              </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">
                                Remaining credit exposure
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                {formatCurrency(selectedInvoice.remainingCreditExposure)}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {selectedInvoice.creditWarning
                                ? 'Invoice is flagged for credit review.'
                                : 'No credit warning on linked invoice.'}
                            </Typography>
                          </CardContent>
                        </Card>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No linked customer invoice found for this credit note.
                        </Typography>
                      )}
                    </>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Adjustment planning
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      Customer invoice candidates
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stage a credit note from overdue or credit-warning invoices that still carry
                      receivable exposure.
                    </Typography>
                  </Box>

                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Customer"
                    value={draftNote.customer_id}
                    onChange={(event) =>
                      setDraftNote((current) => ({
                        ...current,
                        customer_id: event.target.value,
                        invoice_ref: '',
                        amount: '',
                      }))
                    }
                  >
                    {customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Stack spacing={1.25}>
                    {candidateInvoices.map((invoice) => (
                      <Card key={invoice.id} variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <Checkbox
                              checked={draftNote.invoice_ref === invoice.number}
                              disabled={
                                !invoice.eligibleForCredit || invoice.remainingCreditExposure <= 0
                              }
                              onChange={() => stageInvoiceForCreditNote(invoice)}
                              sx={{ mt: -0.75, ml: -0.75 }}
                            />
                            <Box sx={{ flexGrow: 1 }}>
                              <Stack direction="row" justifyContent="space-between" spacing={1}>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight={800}>
                                    {invoice.number}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Due {new Date(invoice.due_date).toLocaleDateString()} ·{' '}
                                    {invoice.paymentTerms}
                                  </Typography>
                                </Box>
                                <Chip
                                  size="small"
                                  label={invoice.adjustmentState}
                                  color={
                                    invoice.adjustmentState === 'open'
                                      ? 'warning'
                                      : invoice.adjustmentState === 'covered'
                                        ? 'success'
                                        : 'default'
                                  }
                                />
                              </Stack>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {invoice.status} ·{' '}
                                {invoice.creditWarning
                                  ? 'Credit warning active'
                                  : invoice.dunningStage}
                              </Typography>
                              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Remaining credit exposure
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                  {formatCurrency(invoice.remainingCreditExposure)}
                                </Typography>
                              </Stack>
                              <Button
                                size="small"
                                variant="text"
                                sx={{ mt: 1, px: 0 }}
                                disabled={
                                  !invoice.eligibleForCredit || invoice.remainingCreditExposure <= 0
                                }
                                onClick={() => stageInvoiceForCreditNote(invoice)}
                              >
                                Stage Credit Note
                              </Button>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid> */}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Credit Note</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.25 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Add customer adjustment type, approval route, and refund trace so the credit note can
              support receivable review and audit follow-up.
            </Alert>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Customer"
                  value={draftNote.customer_id}
                  onChange={(event) => updateDraft('customer_id', event.target.value)}
                >
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Invoice reference"
                  value={draftNote.invoice_ref}
                  onChange={(event) => updateDraft('invoice_ref', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Date"
                  type="date"
                  value={draftNote.date}
                  onChange={(event) => updateDraft('date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Adjustment type"
                  value={draftNote.adjustmentType}
                  onChange={(event) => updateDraft('adjustmentType', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Approval route"
                  value={draftNote.approvalRoute}
                  onChange={(event) => updateDraft('approvalRoute', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Refund or claim reference"
                  value={draftNote.refundReference}
                  onChange={(event) => updateDraft('refundReference', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Amount"
                  type="number"
                  value={draftNote.amount}
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
                  label="Reason"
                  value={draftNote.reason}
                  onChange={(event) => updateDraft('reason', event.target.value)}
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Internal notes"
                  value={draftNote.notes}
                  onChange={(event) => updateDraft('notes', event.target.value)}
                  multiline
                  minRows={2}
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
            onClick={handleCreateNote}
            disabled={saving || !draftNote.reason.trim() || Number(draftNote.amount) <= 0}
          >
            {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Save Draft'}
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
        <DialogTitle>Delete Credit Note?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete credit note <strong>{deleteTarget?.number}</strong>?
            This action cannot be undone.
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
