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
import Checkbox from '@mui/material/Checkbox';
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
import { useSupplierPaymentsApi } from './use-supplier-payments-api';

const STATUS_COLORS = {
  draft: 'default',
  posted: 'success',
  pending: 'warning',
};

const RELEASE_COLORS = {
  queued: 'warning',
  released: 'success',
  blocked: 'error',
};

const EMPTY_PAYMENT = {
  supplier_id: '',
  date: '2026-03-29',
  method: 'Bank transfer',
  bankAccount: 'AP Clearing',
  paymentRun: 'RUN-APR-01',
  amount: '',
  billRefs: [],
  approvalRoute: 'Finance Controller',
  settlementReference: '',
  notes: '',
};

const PAYMENT_BANK_ACCOUNTS = ['AP Clearing', 'Operating Bank Account', 'Grant Settlement Bank'];

export default function SupplierPayments() {
  const { activeCurrency } = useCurrency();
  const api = useSupplierPaymentsApi();
  const { payments, vendors, getVendorById, getRfqsByVendor } = api;

  const [search, setSearch] = useState('');
  const [releaseStatus, setReleaseStatus] = useState('all');
  const [method, setMethod] = useState('all');
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftPayment, setDraftPayment] = useState(EMPTY_PAYMENT);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        const vendor = getVendorById(payment.supplier_id);
        const haystack =
          `${payment.number} ${vendor?.name || ''} ${payment.paymentRun}`.toLowerCase();
        if (search && !haystack.includes(search.toLowerCase())) return false;
        if (releaseStatus !== 'all' && payment.releaseStatus !== releaseStatus) return false;
        if (method !== 'all' && payment.method !== method) return false;
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [method, payments, releaseStatus, search, getVendorById]
  );

  const scheduledAmountByBill = useMemo(() => {
    const totals = {};

    payments.forEach((payment) => {
      if (payment.releaseStatus === 'blocked') return;

      const billRefs = Array.isArray(payment.billRefs) ? payment.billRefs : [];
      const allocationAmount =
        billRefs.length > 0 ? Number(payment.amount || 0) / billRefs.length : 0;

      billRefs.forEach((billRef) => {
        totals[billRef] = (totals[billRef] || 0) + allocationAmount;
      });
    });

    return totals;
  }, [payments]);

  const payableBills = useMemo(() => [], []);

  const selectedPayment =
    payments.find((payment) => payment.id === selectedPaymentId) ||
    filteredPayments[0] ||
    payments[0] ||
    null;
  const selectedVendor = selectedPayment ? getVendorById(selectedPayment.supplier_id) : null;
  const selectedPaymentBills = payableBills.filter((bill) =>
    selectedPayment?.billRefs?.includes(bill.number)
  );
  const candidateBills = payableBills.filter(
    (bill) => bill.supplier_id === draftPayment.supplier_id
  );

  const runSummary = useMemo(() => {
    const readyBills = payableBills.filter((bill) => bill.releaseReadiness === 'ready');
    const blockedBills = payableBills.filter((bill) => bill.releaseReadiness === 'blocked');
    const uncoveredExposure = readyBills.reduce(
      (sum, bill) => sum + Number(bill.remainingToSchedule || 0),
      0
    );

    return {
      readyCount: readyBills.length,
      blockedCount: blockedBills.length,
      uncoveredExposure,
      overdueExposure: payableBills
        .filter((bill) => bill.isOverdue && bill.remainingToSchedule > 0)
        .reduce((sum, bill) => sum + Number(bill.remainingToSchedule || 0), 0),
    };
  }, [payableBills]);

  const queuedCount = payments.filter((payment) => payment.releaseStatus === 'queued').length;
  const blockedCount = payments.filter((payment) => payment.releaseStatus === 'blocked').length;
  const releasedValue = payments
    .filter((payment) => payment.releaseStatus === 'released')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const queuedValue = payments
    .filter((payment) => payment.releaseStatus !== 'released')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const updateDraft = (field, value) => {
    setDraftPayment((current) => ({ ...current, [field]: value }));
  };

  const updateDraftBillSelection = (billNumber) => {
    setDraftPayment((current) => {
      const selectedBills = current.billRefs.includes(billNumber)
        ? current.billRefs.filter((item) => item !== billNumber)
        : [...current.billRefs, billNumber];

      const selectedBillRecords = candidateBills.filter((bill) =>
        selectedBills.includes(bill.number)
      );
      const calculatedAmount = selectedBillRecords.reduce(
        (sum, bill) => sum + Number(bill.remainingToSchedule || 0),
        0
      );

      return {
        ...current,
        billRefs: selectedBills,
        amount: calculatedAmount > 0 ? String(calculatedAmount) : current.amount,
      };
    });
  };

  const stageBillsForPayment = () => {
    const readyBills = candidateBills.filter((bill) => bill.releaseReadiness === 'ready');
    const readyBillRefs = readyBills.map((bill) => bill.number);
    const readyAmount = readyBills.reduce(
      (sum, bill) => sum + Number(bill.remainingToSchedule || 0),
      0
    );

    setDraftPayment((current) => ({
      ...current,
      billRefs: readyBillRefs,
      amount: readyAmount > 0 ? String(readyAmount) : current.amount,
      approvalRoute: readyBills.some((bill) => bill.isOverdue)
        ? 'Treasury Manager'
        : current.approvalRoute,
      notes:
        readyBills.length > 0
          ? `Payment run staged from ${readyBills.length} release-ready bill${readyBills.length > 1 ? 's' : ''}.`
          : current.notes,
    }));
    setDialogOpen(true);
  };

  const handleCreatePayment = async () => {
    try {
      if (editTarget) {
        await api.actions.updatePayment(editTarget.id, draftPayment);
        toast.success('Payment updated successfully');
      } else {
        const created = await api.actions.createPayment(draftPayment);
        setSelectedPaymentId(created.id);
        toast.success('Supplier payment created successfully');
      }
      setDraftPayment(EMPTY_PAYMENT);
      setEditTarget(null);
      setDialogOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to save payment');
    }
  };

  const handleOpenEditDialog = (payment) => {
    setEditTarget(payment);
    setDraftPayment({
      supplier_id: payment.supplier_id ?? '',
      date: payment.date || new Date().toISOString().slice(0, 10),
      method: payment.method ?? 'Bank transfer',
      bankAccount: payment.bankAccount ?? 'AP Clearing',
      paymentRun: payment.paymentRun ?? '',
      amount: String(payment.amount || ''),
      billRefs: payment.billRefs ?? [],
      approvalRoute: payment.approvalRoute ?? '',
      settlementReference: payment.settlementReference ?? '',
      notes: payment.notes ?? '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.actions.deletePayment(deleteTarget.id);
      toast.success('Payment deleted');
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to delete payment');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleRelease = async (paymentId) => {
    try {
      await api.actions.release(paymentId);
      toast.success('Payment released');
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Release failed');
    }
  };

  const handleUnblock = async (paymentId) => {
    try {
      await api.actions.unblock(paymentId);
      toast.success('Payment unblocked');
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Unblock failed');
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
            Supplier Payments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live payment run workspace for release queues, blocked transfers, and bank execution
            review.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setDialogOpen(true)}
        >
          New Payment
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        <AlertTitle>Payment release controls active</AlertTitle>
        Supplier payments now expose queue status, blocked run handling, pay-run coverage, and bank
        release actions from mock payables records.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Queued payments',
            value: queuedCount,
            icon: 'solar:clock-circle-bold-duotone',
            color: '#f59e0b',
          },
          {
            label: 'Blocked payments',
            value: blockedCount,
            icon: 'solar:danger-circle-bold-duotone',
            color: '#dc2626',
          },
          {
            label: 'Released value',
            value: formatCurrency(releasedValue),
            icon: 'solar:card-send-bold-duotone',
            color: '#16a34a',
          },
          {
            label: 'Queue value',
            value: formatCurrency(queuedValue),
            icon: 'solar:wallet-money-bold-duotone',
            color: '#2563eb',
          },
          {
            label: 'Ready bill exposure',
            value: formatCurrency(runSummary.uncoveredExposure),
            icon: 'solar:bill-list-bold-duotone',
            color: '#0f766e',
          },
          {
            label: 'Overdue uncovered',
            value: formatCurrency(runSummary.overdueExposure),
            icon: 'solar:danger-triangle-bold-duotone',
            color: '#b45309',
          },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 2 }}>
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
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ lg: 'center' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search payment, supplier, or run"
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
              value={releaseStatus}
              onChange={(event) => setReleaseStatus(event.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="all">All releases</MenuItem>
              <MenuItem value="queued">Queued</MenuItem>
              <MenuItem value="released">Released</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="all">All methods</MenuItem>
              <MenuItem value="Bank transfer">Bank transfer</MenuItem>
              <MenuItem value="Wire transfer">Wire transfer</MenuItem>
              <MenuItem value="Cheque">Cheque</MenuItem>
            </TextField>
            <Button variant="outlined" onClick={stageBillsForPayment} sx={{ minWidth: 170 }}>
              Stage Ready Bills
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12}}>
          <Card sx={{ borderRadius: 3, overflowX: 'auto' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Payment #</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Run</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Release</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const vendor = getVendorById(payment.supplier_id);
                    const isSelected = payment.id === selectedPayment?.id;

                    return (
                      <TableRow
                        key={payment.id}
                        hover
                        selected={isSelected}
                        onClick={() => setSelectedPaymentId(payment.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{ fontFamily: 'monospace' }}
                          >
                            {payment.number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {vendor ? (
                            <Typography
                              component={RouterLink}
                              href={paths.dashboard.procurement_new.vendors.detail(
                                payment.supplier_id
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
                              {vendor.name}
                            </Typography>
                          ) : (
                            '—'
                          )}
                          <Typography variant="caption" display="block" color="text.secondary">
                            {payment.billRefs.join(', ') || 'No bill ref'}
                          </Typography>
                        </TableCell>
                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell>{payment.paymentRun}</TableCell>
                        <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          <Chip
                            label={payment.status}
                            size="small"
                            color={STATUS_COLORS[payment.status]}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payment.releaseStatus}
                            size="small"
                            color={RELEASE_COLORS[payment.releaseStatus]}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end" spacing={1}>
                            <Tooltip title="Edit payment">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditDialog(payment);
                                }}
                                disabled={payment.releaseStatus === 'released'}
                              >
                                <Iconify icon="solar:pen-bold" width={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete payment">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(payment);
                                }}
                                disabled={payment.releaseStatus === 'released'}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                              </IconButton>
                            </Tooltip>
                            <Button
                              size="small"
                              variant="text"
                              component={RouterLink}
                              href={paths.dashboard.accountingFinance.transactions.supplierPaymentDetail(
                                payment.id
                              )}
                              onClick={(event) => event.stopPropagation()}
                            >
                              View
                            </Button>
                            {payment.releaseStatus === 'blocked' ? (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleUnblock(payment.id);
                                }}
                              >
                                Unblock
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={payment.releaseStatus === 'released'}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleRelease(payment.id);
                                }}
                              >
                                Release
                              </Button>
                            )}
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
                      Selected payment
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {selectedPayment?.number || 'No payment selected'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedVendor?.name ||
                        'Choose a payment from the queue to review linked bills and release readiness.'}
                    </Typography>
                  </Box>
                  {selectedPayment ? (
                    <>
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 6 }}>
                          <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent sx={{ p: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                Payment amount
                              </Typography>
                              <Typography variant="subtitle1" fontWeight={800}>
                                {formatCurrency(selectedPayment.amount)}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent sx={{ p: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                Linked bills
                              </Typography>
                              <Typography variant="subtitle1" fontWeight={800}>
                                {selectedPayment.billRefs.length}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                      <Divider />
                      <Stack spacing={1.25}>
                        {selectedPaymentBills.length > 0 ? (
                          selectedPaymentBills.map((bill) => (
                            <Card key={bill.id} variant="outlined" sx={{ borderRadius: 2 }}>
                              <CardContent sx={{ p: 2 }}>
                                <Stack direction="row" justifyContent="space-between" spacing={1}>
                                  <Box>
                                    <Typography variant="subtitle2" fontWeight={800}>
                                      {bill.number}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Due {new Date(bill.due_date).toLocaleDateString()} ·{' '}
                                      {bill.matchStatus}
                                    </Typography>
                                  </Box>
                                  <Chip
                                    size="small"
                                    label={bill.releaseReadiness}
                                    color={
                                      bill.releaseReadiness === 'ready'
                                        ? 'success'
                                        : bill.releaseReadiness === 'covered'
                                          ? 'info'
                                          : 'error'
                                    }
                                  />
                                </Stack>
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  sx={{ mt: 1.5 }}
                                >
                                  <Typography variant="body2" color="text.secondary">
                                    Balance due
                                  </Typography>
                                  <Typography variant="body2" fontWeight={700}>
                                    {formatCurrency(bill.balance_due)}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between">
                                  <Typography variant="body2" color="text.secondary">
                                    Remaining unscheduled
                                  </Typography>
                                  <Typography variant="body2" fontWeight={700}>
                                    {formatCurrency(bill.remainingToSchedule)}
                                  </Typography>
                                </Stack>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No vendor bills linked to this payment.
                          </Typography>
                        )}
                      </Stack>
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
                      Run planning
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      Payable bill staging
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Prepare the next supplier payment draft from bills that are matched,
                      undisputed, and still uncovered.
                    </Typography>
                  </Box>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Supplier"
                    value={draftPayment.supplier_id}
                    onChange={(event) =>
                      setDraftPayment((current) => ({
                        ...current,
                        supplier_id: event.target.value,
                        billRefs: [],
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
                              checked={draftPayment.billRefs.includes(bill.number)}
                              disabled={bill.releaseReadiness !== 'ready'}
                              onChange={() => updateDraftBillSelection(bill.number)}
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
                                  label={bill.releaseReadiness}
                                  color={
                                    bill.releaseReadiness === 'ready'
                                      ? 'success'
                                      : bill.releaseReadiness === 'covered'
                                        ? 'info'
                                        : 'error'
                                  }
                                />
                              </Stack>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {bill.matchStatus} ·{' '}
                                {bill.disputeFlag ? 'Dispute flagged' : 'No dispute'}
                              </Typography>
                              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Remaining to schedule
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                  {formatCurrency(bill.remainingToSchedule)}
                                </Typography>
                              </Stack>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                  <Alert
                    severity={draftPayment.billRefs.length > 0 ? 'success' : 'info'}
                    sx={{ borderRadius: 2 }}
                  >
                    {draftPayment.billRefs.length > 0
                      ? `${draftPayment.billRefs.length} bill${draftPayment.billRefs.length > 1 ? 's' : ''} selected for ${formatCurrency(Number(draftPayment.amount || 0))}.`
                      : `Ready bills: ${runSummary.readyCount}. Blocked bills: ${runSummary.blockedCount}.`}
                  </Alert>
                  <Button variant="contained" onClick={() => setDialogOpen(true)}>
                    Create Draft From Selection
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid> */}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Supplier Payment</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.25 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Capture approval routing, execution bank, and settlement references before release to
              the payment queue.
            </Alert>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Supplier"
                  value={draftPayment.supplier_id}
                  onChange={(event) =>
                    setDraftPayment((current) => ({
                      ...current,
                      supplier_id: event.target.value,
                      billRefs: [],
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Payment date"
                  type="date"
                  value={draftPayment.date}
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
                  value={draftPayment.method}
                  onChange={(event) => updateDraft('method', event.target.value)}
                >
                  <MenuItem value="Bank transfer">Bank transfer</MenuItem>
                  <MenuItem value="Wire transfer">Wire transfer</MenuItem>
                  <MenuItem value="Cheque">Cheque</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Execution bank"
                  value={draftPayment.bankAccount}
                  onChange={(event) => updateDraft('bankAccount', event.target.value)}
                >
                  {PAYMENT_BANK_ACCOUNTS.map((account) => (
                    <MenuItem key={account} value={account}>
                      {account}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Payment run"
                  value={draftPayment.paymentRun}
                  onChange={(event) => updateDraft('paymentRun', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Bill references"
                  value={draftPayment.billRefs}
                  onChange={(event) => updateDraft('billRefs', event.target.value)}
                  SelectProps={{ multiple: true }}
                  disabled={!draftPayment.supplier_id}
                  helperText={
                    draftPayment.supplier_id
                      ? getRfqsByVendor(draftPayment.supplier_id).length === 0
                        ? 'No RFQs found for the selected supplier.'
                        : 'Select one or more RFQ numbers as bill references.'
                      : 'Select a supplier first to load available RFQ bill references.'
                  }
                >
                  {getRfqsByVendor(draftPayment.supplier_id).map((rfq) => (
                    <MenuItem key={rfq.id} value={rfq.rfq_number}>
                      {rfq.rfq_number}
                      {rfq.rfq_title || rfq.title ? ` — ${rfq.rfq_title || rfq.title}` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Amount"
                  type="number"
                  value={draftPayment.amount}
                  onChange={(event) => updateDraft('amount', event.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">{activeCurrency.symbol}</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Approval route"
                  value={draftPayment.approvalRoute}
                  onChange={(event) => updateDraft('approvalRoute', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Settlement reference"
                  value={draftPayment.settlementReference}
                  onChange={(event) => updateDraft('settlementReference', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={3}
                  label="Release notes"
                  value={draftPayment.notes}
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
            onClick={handleCreatePayment}
            disabled={
              !draftPayment.paymentRun.trim() ||
              !draftPayment.approvalRoute.trim() ||
              Number(draftPayment.amount) <= 0 ||
              draftPayment.billRefs.length === 0
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
        <DialogTitle>Delete Payment?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete payment <strong>{deleteTarget?.number}</strong>? This
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
