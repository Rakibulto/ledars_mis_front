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
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import AlertTitle from '@mui/material/AlertTitle';
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
import { useDebitNotesApi } from './use-debit-notes-api';

const STATUS_COLORS = {
  draft: 'default',
  applied: 'success',
};

const EMPTY_NOTE = {
  supplier_id: '',
  bill_ref: '',
  date: new Date().toISOString().slice(0, 10),
  adjustmentType: 'Rate correction',
  approvalRoute: '',
  disputeReference: '',
  amount: '',
  reason: '',
  notes: '',
};

export default function DebitNotes() {
  const { activeCurrency } = useCurrency();
  const api = useDebitNotesApi();
  const { notes, vendors, adjustmentBills, getVendorById } = api;

  const [status, setStatus] = useState('all');
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftNote, setDraftNote] = useState(EMPTY_NOTE);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredNotes = useMemo(
    () => notes.filter((note) => (status === 'all' ? true : note.status === status)),
    [notes, status]
  );

  // adjustmentBills (with appliedAdjustmentAmount, remainingAdjustmentExposure, etc.)
  // are pre-computed inside the hook from live bills and notes

  const selectedNote =
    notes.find((note) => note.id === selectedNoteId) || filteredNotes[0] || notes[0] || null;
  const selectedSupplier = selectedNote ? getVendorById(selectedNote.supplier_id) : null;
  const selectedBill =
    adjustmentBills.find((bill) => bill.number === selectedNote?.bill_ref) || null;
  const candidateBills = adjustmentBills.filter(
    (bill) => String(bill.supplier_id) === String(draftNote.supplier_id)
  );

  const adjustmentSummary = useMemo(() => {
    const openBills = adjustmentBills.filter((bill) => bill.adjustmentState === 'open');
    const disputedBills = adjustmentBills.filter((bill) => bill.disputeFlag);

    return {
      openCount: openBills.length,
      disputedCount: disputedBills.length,
      openExposure: openBills.reduce(
        (sum, bill) => sum + Number(bill.remainingAdjustmentExposure || 0),
        0
      ),
    };
  }, [adjustmentBills]);

  const draftCount = notes.filter((note) => note.status === 'draft').length;
  const appliedValue = notes
    .filter((note) => note.status === 'applied')
    .reduce((sum, note) => sum + Number(note.amount || 0), 0);

  const updateDraft = (field, value) => {
    setDraftNote((current) => ({ ...current, [field]: value }));
  };

  const stageBillForDebitNote = (bill) => {
    const suggestedAmount = Math.min(
      Number(bill.remainingAdjustmentExposure || 0),
      Math.round(Number(bill.balance_due || 0) * 0.2)
    );

    setDraftNote((current) => ({
      ...current,
      supplier_id: bill.supplier_id,
      bill_ref: bill.number,
      adjustmentType: bill.disputeFlag ? 'Short delivery' : 'Rate correction',
      approvalRoute: bill.approvalRoute || current.approvalRoute,
      disputeReference: bill.disputeFlag
        ? `DISP-${bill.number.split('-').slice(-1)[0]}`
        : current.disputeReference,
      amount: suggestedAmount > 0 ? String(suggestedAmount) : current.amount,
      reason: bill.disputeFlag
        ? `Adjustment prepared for disputed vendor bill ${bill.number}.`
        : `Commercial correction prepared for vendor bill ${bill.number}.`,
      notes: bill.goodsReceiptRef
        ? `Source document: ${bill.goodsReceiptRef}. Match status: ${bill.matchStatus}.`
        : current.notes,
    }));
    setDialogOpen(true);
  };

  const handleCreateNote = async () => {
    try {
      if (editTarget) {
        await api.actions.updateDebitNote(editTarget.id, draftNote);
        toast.success('Debit note updated successfully');
      } else {
        const created = await api.actions.createDebitNote(draftNote);
        setSelectedNoteId(created.id);
        toast.success('Debit note created successfully');
      }
      setDraftNote(EMPTY_NOTE);
      setEditTarget(null);
      setDialogOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to save debit note');
    }
  };

  const handleOpenEditDialog = (note) => {
    setEditTarget(note);
    setDraftNote({
      supplier_id: note.supplier_id ?? '',
      bill_ref: note.bill_ref ?? '',
      date: note.date || new Date().toISOString().slice(0, 10),
      adjustmentType: note.adjustmentType ?? 'Rate correction',
      approvalRoute: note.approvalRoute ?? '',
      disputeReference: note.disputeReference ?? '',
      amount: String(note.amount || ''),
      reason: note.reason ?? '',
      notes: note.notes ?? '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.actions.deleteDebitNote(deleteTarget.id);
      toast.success('Debit note deleted');
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to delete debit note');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleApply = async (noteId) => {
    try {
      await api.actions.applyDebitNote(noteId);
      toast.success('Debit note applied');
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Apply failed');
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
            Debit Notes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live supplier debit note workspace for returns, rate corrections, and payable
            adjustments.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setDialogOpen(true)}
        >
          Create Debit Note
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        <AlertTitle>Adjustment workflow active</AlertTitle>
        Debit notes now track draft versus applied status, bill-level adjustment exposure, and
        supplier dispute handling from shared payables mock records.
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
                Open adjustment bills
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
                Open adjustment exposure
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
              Disputed supplier bills: {adjustmentSummary.disputedCount}. Open adjustments:{' '}
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
                    <TableCell>DN #</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Bill Ref</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredNotes.map((note) => {
                    const supplier = getVendorById(note.supplier_id);
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
                        <TableCell>
                          {supplier ? (
                            <Typography
                              component={RouterLink}
                              href={paths.dashboard.procurement_new.vendors.detail(
                                note.supplier_id
                              )}
                              variant="body1"
                              fontWeight={700}
                              onClick={(event) => event.stopPropagation()}
                              sx={{
                                color: 'primary.main',
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' },
                              }}
                            >
                              {supplier.name}
                            </Typography>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>{note.bill_ref}</TableCell>
                        <TableCell>{new Date(note.date).toLocaleDateString()}</TableCell>
                        <TableCell align="right">{formatCurrency(note.amount)}</TableCell>
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
                            <Tooltip title="Edit debit note">
                              <IconButton
                                size="small"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleOpenEditDialog(note);
                                }}
                                disabled={note.status === 'applied'}
                              >
                                <Iconify icon="solar:pen-bold" width={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete debit note">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setDeleteTarget(note);
                                }}
                                disabled={note.status === 'applied'}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                              </IconButton>
                            </Tooltip>
                            <Button
                              size="small"
                              variant="text"
                              component={RouterLink}
                              href={paths.dashboard.accountingFinance.transactions.debitNoteDetail(
                                note.id
                              )}
                              onClick={(event) => event.stopPropagation()}
                            >
                              View
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={note.status === 'applied'}
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
                      Selected debit note
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {selectedNote?.number || 'No debit note selected'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedSupplier?.name ||
                        'Choose a debit note to review its linked supplier bill and adjustment posture.'}
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
                      {selectedBill ? (
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent sx={{ p: 2 }}>
                            <Stack direction="row" justifyContent="space-between" spacing={1}>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={800}>
                                  {selectedBill.number}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Due {new Date(selectedBill.due_date).toLocaleDateString()} ·{' '}
                                  {selectedBill.matchStatus}
                                </Typography>
                              </Box>
                              <Chip
                                size="small"
                                label={selectedBill.adjustmentState}
                                color={
                                  selectedBill.adjustmentState === 'open'
                                    ? 'warning'
                                    : selectedBill.adjustmentState === 'covered'
                                      ? 'success'
                                      : 'default'
                                }
                              />
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                Applied debit notes
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                {formatCurrency(selectedBill.appliedAdjustmentAmount)}
                              </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">
                                Remaining adjustment exposure
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                {formatCurrency(selectedBill.remainingAdjustmentExposure)}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {selectedBill.disputeFlag
                                ? 'Supplier dispute is active.'
                                : 'No dispute flag on supplier bill.'}
                            </Typography>
                          </CardContent>
                        </Card>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No linked vendor bill found for this debit note.
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
                      Supplier bill candidates
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stage a debit note from disputed or unmatched supplier bills that still carry
                      adjustment exposure.
                    </Typography>
                  </Box>

                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Supplier"
                    value={draftNote.supplier_id}
                    onChange={(event) =>
                      setDraftNote((current) => ({
                        ...current,
                        supplier_id: event.target.value,
                        bill_ref: '',
                        amount: '',
                      }))
                    }
                  >
                    {vendors.map((vendor) => (
                      <MenuItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Stack spacing={1.25}>
                    {candidateBills.map((bill) => (
                      <Card key={bill.id} variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <Checkbox
                              checked={draftNote.bill_ref === bill.number}
                              disabled={
                                !bill.eligibleForAdjustment || bill.remainingAdjustmentExposure <= 0
                              }
                              onChange={() => stageBillForDebitNote(bill)}
                              sx={{ mt: -0.75, ml: -0.75 }}
                            />
                            <Box sx={{ flexGrow: 1 }}>
                              <Stack direction="row" justifyContent="space-between" spacing={1}>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight={800}>
                                    {bill.number}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Due {new Date(bill.due_date).toLocaleDateString()} ·{' '}
                                    {bill.paymentProposal}
                                  </Typography>
                                </Box>
                                <Chip
                                  size="small"
                                  label={bill.adjustmentState}
                                  color={
                                    bill.adjustmentState === 'open'
                                      ? 'warning'
                                      : bill.adjustmentState === 'covered'
                                        ? 'success'
                                        : 'default'
                                  }
                                />
                              </Stack>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {bill.matchStatus} ·{' '}
                                {bill.disputeFlag
                                  ? 'Dispute flagged'
                                  : 'Commercial correction only'}
                              </Typography>
                              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Remaining adjustment exposure
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                  {formatCurrency(bill.remainingAdjustmentExposure)}
                                </Typography>
                              </Stack>
                              <Button
                                size="small"
                                variant="text"
                                sx={{ mt: 1, px: 0 }}
                                disabled={
                                  !bill.eligibleForAdjustment ||
                                  bill.remainingAdjustmentExposure <= 0
                                }
                                onClick={() => stageBillForDebitNote(bill)}
                              >
                                Stage Debit Note
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

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditTarget(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editTarget ? 'Edit Debit Note' : 'Create Debit Note'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.25 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Add the adjustment type, dispute reference, and approval route so the debit note can
              flow like a formal AP adjustment document.
            </Alert>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Supplier"
                  value={draftNote.supplier_id}
                  onChange={(event) =>
                    setDraftNote((current) => ({
                      ...current,
                      supplier_id: event.target.value,
                      bill_ref: '',
                      amount: '',
                    }))
                  }
                >
                  {vendors.map((vendor) => (
                    <MenuItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Bill reference"
                  value={draftNote.bill_ref}
                  onChange={(event) => updateDraft('bill_ref', event.target.value)}
                  disabled={!draftNote.supplier_id}
                  helperText={
                    draftNote.supplier_id
                      ? candidateBills.length === 0
                        ? 'No vendor bills found for the selected supplier.'
                        : 'Select the vendor bill to apply this debit note against.'
                      : 'Select a supplier first to load available bills.'
                  }
                >
                  {candidateBills.length > 0 ? (
                    candidateBills.map((bill) => (
                      <MenuItem key={bill.id} value={bill.number}>
                        {bill.number} — {getVendorById(bill.supplier_id)?.name || ''}
                        {bill.disputeFlag ? ' (disputed)' : ''}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled value="">
                      No bills available for this supplier
                    </MenuItem>
                  )}
                </TextField>
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
                  label="Dispute reference"
                  value={draftNote.disputeReference}
                  onChange={(event) => updateDraft('disputeReference', event.target.value)}
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
            disabled={
              !draftNote.reason.trim() ||
              !draftNote.approvalRoute.trim() ||
              Number(draftNote.amount) <= 0
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
        <DialogTitle>Delete Debit Note?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete debit note <strong>{deleteTarget?.number}</strong>? This
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
