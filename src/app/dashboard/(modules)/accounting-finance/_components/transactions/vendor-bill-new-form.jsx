'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { toast } from 'sonner';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { fetcher, endpoints } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { useVendorBillsApi } from './use-vendor-bills-api';

const toList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.payment)) return response.payment;
  return [];
};

const numericValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const asText = (value) => (value || value === 0 ? String(value) : '');

const getWorkOrderLabel = (workOrder) =>
  `${workOrder.workOrderNumber || workOrder.wo_number || `WO-${workOrder.id}`}  ${workOrder.vendor?.name || 'Unknown vendor'}`;

const getGrnLabel = (grn) => {
  const amount = numericValue(grn.total_received_value);
  const amountSuffix = amount > 0 ? ` Â· ${amount.toLocaleString('en-US')}` : '';
  return `${grn.grn_number}  ${grn.supplier_name || 'Unknown supplier'}${amountSuffix}`;
};

const getBankLabel = (bank) => `${bank.bank_name || bank.name} Â· ${bank.account_number || ''}`;

const getChequeLabel = (check) =>
  `#${check.check_number} Â· ${check.payee} Â· ${Number(check.amount || 0).toLocaleString('en-US')}`;

const getAccountLabel = (account) => (account ? `${account.code}  ${account.name}` : '');

const autocompleteField = (params, { label, placeholder, helperText, required, disabled } = {}) => (
  <TextField
    {...params}
    label={label}
    placeholder={placeholder}
    helperText={helperText}
    required={required}
    disabled={disabled}
    size="small"
    InputLabelProps={{ ...params.InputLabelProps, shrink: true }}
  />
);

function FileUploadCard({ label, hint, file, onChange, onClear, accept }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        borderStyle: file ? 'solid' : 'dashed',
        bgcolor: file ? 'action.hover' : 'background.paper',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'primary.lighter',
            color: 'primary.main',
            flexShrink: 0,
          }}
        >
          <Iconify icon={file ? 'solar:file-check-bold' : 'solar:upload-bold'} width={22} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {file ? file.name : hint}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button component="label" size="small" variant={file ? 'outlined' : 'contained'}>
              {file ? 'Replace' : 'Choose file'}
              <input
                hidden
                type="file"
                accept={accept}
                onChange={(event) => onChange(event.target.files?.[0] || null)}
              />
            </Button>
            {file ? (
              <Button size="small" color="inherit" onClick={onClear}>
                Remove
              </Button>
            ) : null}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

const DetailRow = ({ label, value }) => (
  <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ py: 0.5 }}>
    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
      {label}
    </Typography>
    <Typography
      variant="body2"
      fontWeight={600}
      sx={{ textAlign: 'right', wordBreak: 'break-word' }}
    >
      {value || '—'}
    </Typography>
  </Stack>
);

function DetailSection({ title, icon, children }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        {icon ? <Iconify icon={icon} width={18} color="primary.main" /> : null}
        <Typography variant="subtitle2" fontWeight={700}>
          {title}
        </Typography>
      </Stack>
      <Divider sx={{ mb: 1 }} />
      {children}
    </Box>
  );
}

function WorkOrderDetail({ workOrder, loading }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  if (!workOrder) {
    return (
      <Alert severity="info" variant="outlined">
        No work order selected.
      </Alert>
    );
  }

  const items = Array.isArray(workOrder.items) ? workOrder.items : [];

  return (
    <Box>
      <DetailSection title="Work order" icon="solar:document-bold">
        <DetailRow label="WO number" value={workOrder.workOrderNumber || workOrder.wo_number} />
        <DetailRow label="Title" value={workOrder.title} />
        <DetailRow label="Status" value={workOrder.status} />
        <DetailRow label="Approval" value={workOrder.approvalStatus} />
        <DetailRow label="Vendor" value={workOrder.vendor?.name} />
        <DetailRow label="Category" value={workOrder.category} />
        <DetailRow
          label="Total amount"
          value={workOrder.totalAmount ? formatCurrency(workOrder.totalAmount) : ''}
        />
        <DetailRow label="Order date" value={workOrder.orderDate} />
        <DetailRow label="Delivery deadline" value={workOrder.deliveryDeadline} />
        <DetailRow label="Payment terms" value={workOrder.paymentTerms} />
        <DetailRow label="Tax rate" value={workOrder.taxRate ? `${workOrder.taxRate}%` : ''} />
        <DetailRow label="Project" value={workOrder.project?.title || workOrder.project?.name} />
      </DetailSection>

      {items.length > 0 ? (
        <DetailSection title="Items" icon="solar:box-bold">
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Unit price</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell sx={{ maxWidth: 160 }}>{item.name || item.description}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(Number(item.unitPrice || 0))}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(Number(item.total || 0))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DetailSection>
      ) : null}
    </Box>
  );
}

function GrnDetail({ grns, loading }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  if (!grns || grns.length === 0) {
    return (
      <Alert severity="info" variant="outlined">
        No GRNs selected.
      </Alert>
    );
  }

  return (
    <Stack spacing={2.5}>
      {grns.map((grn) => {
        const items = Array.isArray(grn.grn_items) ? grn.grn_items : [];
        return (
          <Box key={grn.id}>
            <DetailSection title={`GRN ${grn.grn_number}`} icon="solar:box-bold">
              <DetailRow label="Supplier" value={grn.supplier_name} />
              <DetailRow label="WO number" value={grn.wo_number || grn.work_order_number} />
              <DetailRow label="Receipt date" value={grn.receipt_date || grn.received_date} />
              <DetailRow label="Invoice no." value={grn.invoice_number} />
              <DetailRow
                label="Total received"
                value={grn.total_received_value ? formatCurrency(grn.total_received_value) : ''}
              />
              <DetailRow label="Status" value={grn.status} />
              <DetailRow label="Received by" value={grn.received_by_name} />
              <DetailRow label="Location" value={grn.receive_location_info?.name} />
            </DetailSection>

            {items.length > 0 ? (
              <DetailSection title="Received items" icon="solar:box-minimalistic-bold">
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Recv.</TableCell>
                        <TableCell align="right">Acc.</TableCell>
                        <TableCell align="right">Unit</TableCell>
                        <TableCell align="right">Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={item.id || index}>
                          <TableCell sx={{ maxWidth: 140 }}>
                            {item.item_name || item.remarks}
                          </TableCell>
                          <TableCell align="right">{item.received_quantity}</TableCell>
                          <TableCell align="right">{item.accepted_quantity}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(Number(item.unit_price || 0))}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(Number(item.total_value || 0))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </DetailSection>
            ) : null}
          </Box>
        );
      })}
    </Stack>
  );
}

const findCashAtBankAccount = (paymentAccounts, bankAccount) => {
  if (!paymentAccounts?.length) return null;

  if (bankAccount?.account) {
    const linked = paymentAccounts.find((a) => String(a.id) === String(bankAccount.account));
    if (linked) return linked;
  }

  const bankName = (bankAccount?.bank_name || bankAccount?.name || '').toLowerCase();
  if (bankName) {
    const token = bankName.split(/\s+/).find((part) => part.length > 2);
    if (token) {
      const named = paymentAccounts.find(
        (a) =>
          a.name?.toLowerCase().includes('cash at bank') && a.name?.toLowerCase().includes(token)
      );
      if (named) return named;
    }
  }

  return (
    paymentAccounts.find((a) => a.name?.toLowerCase().includes('cash at bank')) ||
    paymentAccounts.find((a) => a.code?.startsWith('110') && a.code !== '1101') ||
    null
  );
};

const findCashInHandAccount = (paymentAccounts) =>
  paymentAccounts.find((a) => a.code === '1101') ||
  paymentAccounts.find((a) => a.name?.toLowerCase() === 'cash in hand') ||
  paymentAccounts.find((a) => a.name?.toLowerCase().includes('cash in hand')) ||
  null;

const EMPTY_LINE = () => ({
  _key: Date.now() + Math.random(),
  description: '',
  quantity: '1',
  unit_price: '',
  account: '',
  analytic_account: '',
  cost_center: '',
  source: 'manual',
});

const EMPTY_BILL = () => ({
  supplier_id: '',
  workOrder: '',
  grnSelections: [],
  bankAccountId: '',
  chequeId: '',
  payment_account: '',
  date: new Date().toISOString().slice(0, 10),
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  journal: '',
  project: '',
  cost_center: '',
  currency: '',
  fiscal_period: '',
  approvalRoute: '',
  supplierInvoiceRef: '',
  goodsReceiptRef: '',
  paymentProposal: 'Hold until validation',
  taxRate: '5',
  lines: [EMPTY_LINE()],
});

export default function VendorBillNewForm() {
  const api = useVendorBillsApi();
  const { vendors } = api;
  const { activeCurrency } = useCurrency();

  const [draftBill, setDraftBill] = useState(EMPTY_BILL());
  const [saving, setSaving] = useState(false);
  const [autoFilledFrom, setAutoFilledFrom] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [mushukFile, setMushukFile] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: rawJournals, isLoading: journalsLoading } = useSWR(
    endpoints.accounting.journals,
    fetcher
  );
  const { data: rawProjects, isLoading: projectsLoading } = useSWR(
    endpoints.projectManagements.projects,
    fetcher
  );
  const { data: rawCostCenters, isLoading: costCentersLoading } = useSWR(
    endpoints.accounting.cost_centers,
    fetcher
  );
  const { data: rawFiscalPeriods, isLoading: fiscalPeriodsLoading } = useSWR(
    endpoints.accounting.fiscal_periods,
    fetcher
  );
  const { data: rawAccounts, isLoading: accountsLoading } = useSWR(
    endpoints.accounting.accounts,
    fetcher
  );
  const { data: rawAnalyticAccounts, isLoading: analyticLoading } = useSWR(
    endpoints.accounting.analytic_accounts,
    fetcher
  );
  const { data: rawPaymentAccounts } = useSWR(
    `${endpoints.accounting.account_relatable}?type=payment`,
    fetcher
  );
  const { data: rawWorkOrders, isLoading: workOrdersLoading } = useSWR(
    `${endpoints.procurement_management.work_orders}?pagination=false`,
    fetcher
  );
  const { data: rawGrns, isLoading: grnsLoading } = useSWR(
    `${endpoints.procurement_management.grns}?pagination=false&status=Verified`,
    fetcher
  );
  const { data: rawBankAccounts, isLoading: banksLoading } = useSWR(
    endpoints.accounting.bank_accounts,
    fetcher
  );
  const { data: rawChecks, isLoading: checksLoading } = useSWR(
    endpoints.accounting.checks,
    fetcher
  );

  // Full detail fetches for the optional details sidebar. Only fetched when the
  // sidebar is open so we don't waste requests on the list view.
  const { data: rawWorkOrderDetail, isLoading: workOrderDetailLoading } = useSWR(
    draftBill.workOrder && detailsOpen
      ? endpoints.procurement_management.work_order_by_id(draftBill.workOrder)
      : null,
    fetcher
  );
  const { data: rawGrnDetails, isLoading: grnDetailsLoading } = useSWR(
    draftBill.grnSelections.length && detailsOpen
      ? `${endpoints.procurement_management.grns}?id__in=${draftBill.grnSelections.join(',')}&status=Verified`
      : null,
    fetcher
  );

  const workOrderDetail = useMemo(() => {
    const list = toList(rawWorkOrderDetail);
    return list[0] || rawWorkOrderDetail || null;
  }, [rawWorkOrderDetail]);

  const grnDetails = useMemo(() => toList(rawGrnDetails), [rawGrnDetails]);

  const journals = useMemo(() => {
    const list = toList(rawJournals);
    return list.filter((j) => j.journal_type === 'purchase');
  }, [rawJournals]);

  const projects = useMemo(() => toList(rawProjects), [rawProjects]);
  const costCenters = useMemo(() => toList(rawCostCenters), [rawCostCenters]);
  const fiscalPeriods = useMemo(() => toList(rawFiscalPeriods), [rawFiscalPeriods]);

  const accounts = useMemo(() => {
    const list = toList(rawAccounts);
    return list.filter((a) => a.is_active !== false);
  }, [rawAccounts]);

  const expenseAccounts = useMemo(
    () =>
      accounts.filter(
        (a) =>
          a.account_type?.classification === 'expense' ||
          String(a.code || '').startsWith('5') ||
          String(a.code || '').startsWith('6')
      ),
    [accounts]
  );

  const analyticAccounts = useMemo(() => toList(rawAnalyticAccounts), [rawAnalyticAccounts]);

  const paymentAccounts = useMemo(() => {
    const relatable = toList(rawPaymentAccounts);
    if (relatable.length) return relatable.filter((a) => a.is_active !== false);
    return accounts.filter(
      (a) =>
        a.account_type?.liquidity_type === 'bank_cash' ||
        a.code?.startsWith('10') ||
        a.code?.startsWith('11')
    );
  }, [rawPaymentAccounts, accounts]);

  const workOrders = useMemo(
    () => toList(rawWorkOrders).filter((wo) => wo.status === 'Approved'),
    [rawWorkOrders]
  );
  const grns = useMemo(() => toList(rawGrns), [rawGrns]);
  const bankAccounts = useMemo(
    () => toList(rawBankAccounts).filter((a) => a.status !== 'closed'),
    [rawBankAccounts]
  );
  const checks = useMemo(() => toList(rawChecks), [rawChecks]);

  const selectedWorkOrder = useMemo(
    () => workOrders.find((item) => String(item.id) === String(draftBill.workOrder)),
    [draftBill.workOrder, workOrders]
  );

  const woIsSelected = Boolean(selectedWorkOrder);

  const selectedVendor = useMemo(
    () => vendors.find((vendor) => String(vendor.id) === String(draftBill.supplier_id)) || null,
    [vendors, draftBill.supplier_id]
  );

  const selectedJournal = useMemo(
    () => journals.find((journal) => String(journal.id) === String(draftBill.journal)) || null,
    [journals, draftBill.journal]
  );

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(draftBill.project)) || null,
    [projects, draftBill.project]
  );

  const selectedCostCenter = useMemo(
    () => costCenters.find((cc) => String(cc.id) === String(draftBill.cost_center)) || null,
    [costCenters, draftBill.cost_center]
  );

  const selectedFiscalPeriod = useMemo(
    () => fiscalPeriods.find((fp) => String(fp.id) === String(draftBill.fiscal_period)) || null,
    [fiscalPeriods, draftBill.fiscal_period]
  );

  const availableGrns = useMemo(() => {
    if (!draftBill.workOrder) return [];
    return grns.filter((item) => String(item.work_order) === String(draftBill.workOrder));
  }, [draftBill.workOrder, grns]);

  const selectedGRNs = useMemo(
    () => grns.filter((item) => draftBill.grnSelections.includes(String(item.id))),
    [draftBill.grnSelections, grns]
  );

  const selectedGrnReceivedTotal = selectedGRNs.reduce(
    (sum, item) => sum + numericValue(item.total_received_value),
    0
  );

  const workOrderAmount = numericValue(
    selectedWorkOrder?.totalAmount ?? selectedWorkOrder?.total_amount
  );

  const resolvedBillAmount = useMemo(() => {
    if (selectedGRNs.length > 0) return selectedGrnReceivedTotal;
    if (selectedWorkOrder && workOrderAmount > 0) return workOrderAmount;
    return null;
  }, [selectedGRNs.length, selectedGrnReceivedTotal, selectedWorkOrder, workOrderAmount]);

  const selectedBankAccount = useMemo(
    () => bankAccounts.find((a) => String(a.id) === String(draftBill.bankAccountId)),
    [bankAccounts, draftBill.bankAccountId]
  );

  const selectedCheque = useMemo(
    () => checks.find((c) => String(c.id) === String(draftBill.chequeId)),
    [checks, draftBill.chequeId]
  );

  const resolvedPaymentAccount = useMemo(() => {
    if (draftBill.bankAccountId) {
      return findCashAtBankAccount(paymentAccounts, selectedBankAccount);
    }
    if (draftBill.chequeId) {
      const chequeBank = bankAccounts.find(
        (b) => String(b.id) === String(selectedCheque?.bank_account)
      );
      return findCashAtBankAccount(paymentAccounts, chequeBank);
    }
    return findCashInHandAccount(paymentAccounts);
  }, [
    draftBill.bankAccountId,
    draftBill.chequeId,
    paymentAccounts,
    selectedBankAccount,
    selectedCheque,
    bankAccounts,
  ]);

  useEffect(() => {
    setDraftBill((current) => ({
      ...current,
      payment_account: resolvedPaymentAccount?.id ? String(resolvedPaymentAccount.id) : '',
    }));
  }, [resolvedPaymentAccount?.id]);

  // Auto-fill each line's expense account from the resolved payment route
  // (e.g. Cash in Hand → 1101). Only sets it when the line has no manual account.
  useEffect(() => {
    if (!resolvedPaymentAccount?.id) return;
    setDraftBill((current) => {
      const nextLines = current.lines.map((line) =>
        line.account ? line : { ...line, account: String(resolvedPaymentAccount.id) }
      );
      return { ...current, lines: nextLines };
    });
  }, [resolvedPaymentAccount?.id]);

  // Auto-fill the bill's journal from the selected bank account's configured journal.
  // Only sets it when the user hasn't manually chosen a journal.
  useEffect(() => {
    const bankJournalId = selectedBankAccount?.journal_detail?.id;
    if (!bankJournalId) return;
    setDraftBill((current) =>
      current.journal ? current : { ...current, journal: String(bankJournalId) }
    );
  }, [selectedBankAccount?.journal_detail?.id, selectedBankAccount?.id]);

  const billSubtotal = useMemo(
    () =>
      draftBill.lines.reduce(
        (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unit_price) || 0),
        0
      ),
    [draftBill.lines]
  );
  const billTax = (billSubtotal * (Number(draftBill.taxRate) || 0)) / 100;
  const billTotal = billSubtotal + billTax;

  const matchStatusLabel = selectedGRNs.length
    ? '3-way matched'
    : draftBill.workOrder
      ? 'Awaiting receipt'
      : 'No procurement link';

  const paymentRouteLabel = draftBill.bankAccountId
    ? 'Cash at Bank (via bank)'
    : draftBill.chequeId
      ? 'Cash at Bank (via cheque)'
      : 'Cash in Hand';

  const isProcurementLoading = workOrdersLoading || grnsLoading;
  const canSave =
    !saving &&
    Boolean(draftBill.supplier_id) &&
    draftBill.lines.some((line) => line.description.trim() && Number(line.unit_price) > 0);

  const buildLinesFromRecords = useCallback((grnRecords, workOrder, defaultAccount = '') => {
    const mergedItems = grnRecords.flatMap((grn) =>
      Array.isArray(grn?.grn_items)
        ? grn.grn_items.map((item) => ({
            description: item.item_name || item.remarks || 'GRN line item',
            quantity: asText(item.accepted_quantity || item.received_quantity || 1),
            unit_price: asText(item.unit_price),
            source: 'grn',
          }))
        : []
    );

    if (mergedItems.length) {
      return mergedItems.map((item) => ({
        ...EMPTY_LINE(),
        ...item,
        account: defaultAccount,
        _key: Date.now() + Math.random(),
      }));
    }

    if (workOrder?.items?.length) {
      return workOrder.items.map((item) => ({
        ...EMPTY_LINE(),
        description: item.description || item.name || item.item_name || '',
        quantity: asText(item.quantity || 1),
        unit_price: asText(item.unitPrice ?? item.unit_price),
        account: defaultAccount,
        source: 'wo',
      }));
    }

    if (workOrder?.work_order_items?.length) {
      return workOrder.work_order_items.map((item) => ({
        ...EMPTY_LINE(),
        description: item.description || item.name || '',
        quantity: asText(item.quantity || 1),
        unit_price: asText(item.unitPrice ?? item.unit_price ?? item.total),
        account: defaultAccount,
        source: 'wo',
      }));
    }

    return null;
  }, []);

  const applyAutofillAmount = useCallback((amount, source) => {
    if (!amount || amount <= 0) return;
    setDraftBill((current) => {
      const nextLines = current.lines.map((line, index) =>
        index === 0 ? { ...line, unit_price: asText(amount), source: source || line.source } : line
      );
      return { ...current, lines: nextLines };
    });
  }, []);

  const handleWorkOrderChange = useCallback(
    (value) => {
      const workOrder = workOrders.find((item) => String(item.id) === value);
      const linkedGrn = grns.find((item) => String(item.work_order) === value);

      if (!value) {
        setDraftBill((current) => ({
          ...EMPTY_BILL(),
          date: current.date,
          due_date: current.due_date,
          journal: current.journal,
          project: current.project,
          cost_center: current.cost_center,
          fiscal_period: current.fiscal_period,
          bankAccountId: current.bankAccountId,
          chequeId: current.chequeId,
          payment_account: current.payment_account,
        }));
        setAutoFilledFrom(null);
        return;
      }

      // Resolve the supplier from the work order. Direct-evaluation work orders
      // expose the vendor with id=null (free-text direct vendor), so fall back
      // to matching an existing vendor in the dropdown by name.
      let supplierId = linkedGrn?.supplier
        ? String(linkedGrn.supplier)
        : workOrder?.vendor?.id
          ? String(workOrder.vendor.id)
          : '';

      if (!supplierId && workOrder?.vendor?.name) {
        const matchedVendor = vendors.find(
          (v) => v.name?.trim().toLowerCase() === workOrder.vendor.name.trim().toLowerCase()
        );
        if (matchedVendor) supplierId = String(matchedVendor.id);
      }

      const woTotal = numericValue(workOrder?.totalAmount ?? workOrder?.total_amount);
      const woNumber = workOrder?.workOrderNumber || workOrder?.wo_number || '';
      const invoiceNum = linkedGrn?.invoice_number || '';
      const woTaxRate = workOrder?.taxRate ? String(workOrder.taxRate) : '';
      const nextGrnSelections = linkedGrn ? [String(linkedGrn.id)] : [];
      const nextGrns = linkedGrn ? [linkedGrn] : [];
      const nextLines = buildLinesFromRecords(
        nextGrns,
        workOrder,
        resolvedPaymentAccount?.id ? String(resolvedPaymentAccount.id) : ''
      );

      setDraftBill((current) => ({
        ...current,
        workOrder: value,
        grnSelections: nextGrnSelections,
        supplier_id: supplierId || current.supplier_id,
        taxRate: woTaxRate || current.taxRate,
        supplierInvoiceRef: invoiceNum || woNumber || current.supplierInvoiceRef,
        goodsReceiptRef: linkedGrn?.grn_number || current.goodsReceiptRef,
        project: workOrder?.project ? String(workOrder.project) : current.project,
        lines: nextLines || [
          {
            ...EMPTY_LINE(),
            description: workOrder?.title ? `Payment for ${workOrder.title}` : 'Vendor bill line',
            unit_price: woTotal ? asText(woTotal) : '',
            source: 'wo',
          },
        ],
      }));

      setAutoFilledFrom(linkedGrn ? 'grn' : 'work-order');
    },
    [workOrders, grns, vendors, resolvedPaymentAccount, buildLinesFromRecords]
  );

  const handleGRNSelectionChange = useCallback(
    (selectedValues) => {
      const selectedGrnRecords = grns.filter((item) => selectedValues.includes(String(item.id)));
      const primaryGRN = selectedGrnRecords[0];
      const grnTotal = selectedGrnRecords.reduce(
        (sum, item) => sum + numericValue(item.total_received_value),
        0
      );
      const nextLines = buildLinesFromRecords(
        selectedGrnRecords,
        selectedWorkOrder,
        resolvedPaymentAccount?.id ? String(resolvedPaymentAccount.id) : ''
      );

      setDraftBill((current) => ({
        ...current,
        grnSelections: selectedValues,
        workOrder: primaryGRN?.work_order ? String(primaryGRN.work_order) : current.workOrder,
        supplier_id: primaryGRN?.supplier ? String(primaryGRN.supplier) : current.supplier_id,
        supplierInvoiceRef: current.supplierInvoiceRef || primaryGRN?.invoice_number || '',
        goodsReceiptRef:
          selectedGrnRecords
            .map((grn) => grn.grn_number)
            .filter(Boolean)
            .join(', ') || current.goodsReceiptRef,
        lines:
          nextLines ||
          (grnTotal > 0
            ? [
                {
                  ...EMPTY_LINE(),
                  description: 'GRN received value',
                  unit_price: asText(grnTotal),
                  source: 'grn',
                },
              ]
            : current.lines),
      }));

      setAutoFilledFrom(
        selectedGrnRecords.length ? 'grn' : selectedWorkOrder ? 'work-order' : null
      );
    },
    [grns, selectedWorkOrder, resolvedPaymentAccount, buildLinesFromRecords]
  );

  useEffect(() => {
    if (resolvedBillAmount === null) return;
    applyAutofillAmount(resolvedBillAmount, selectedGRNs.length ? 'grn' : 'work-order');
  }, [resolvedBillAmount, selectedGRNs.length, applyAutofillAmount]);

  const updateDraft = (field, value) => {
    setDraftBill((current) => ({ ...current, [field]: value }));
  };

  const handleBankChange = (value) => {
    setDraftBill((current) => ({
      ...current,
      bankAccountId: value,
      chequeId: value ? '' : current.chequeId,
    }));
  };

  const handleChequeChange = (value) => {
    setDraftBill((current) => ({
      ...current,
      chequeId: value,
      bankAccountId: value ? '' : current.bankAccountId,
    }));
  };

  const addLine = useCallback(() => {
    setDraftBill((current) => ({ ...current, lines: [...current.lines, EMPTY_LINE()] }));
  }, []);

  const removeLine = useCallback((index) => {
    setDraftBill((current) => ({
      ...current,
      lines: current.lines.filter((_, i) => i !== index),
    }));
  }, []);

  const updateLine = useCallback((index, field, value) => {
    setDraftBill((current) => {
      const lines = current.lines.map((l, i) => (i === index ? { ...l, [field]: value } : l));
      return { ...current, lines };
    });
  }, []);

  const handleCreateBill = async () => {
    const hasValidLine = draftBill.lines.some(
      (l) => l.description.trim() && Number(l.unit_price) > 0
    );
    if (!hasValidLine) return;
    setSaving(true);
    try {
      await api.actions.createBill({
        ...draftBill,
        invoiceFile,
        mushukFile,
        match_status: selectedGRNs.length
          ? '3-way matched'
          : draftBill.workOrder
            ? 'Awaiting receipt'
            : 'No procurement link',
      });
      toast.success('Vendor bill draft created successfully.');
      window.close();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to create bill.');
    } finally {
      setSaving(false);
    }
  };

  const availableCheques = useMemo(
    () =>
      checks.filter((check) =>
        ['draft', 'prepared', 'issued', 'deposited'].includes(
          String(check.status || '').toLowerCase()
        )
      ),
    [checks]
  );

  return (
    <Container maxWidth="xxl" sx={{ py: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Create Vendor Bill
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 560 }}>
            Search and link procurement records, attach documents, and let the form auto-fill
            amounts and payment accounts.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexShrink={0}>
          <Button
            variant={detailsOpen ? 'contained' : 'outlined'}
            color="inherit"
            size="small"
            startIcon={
              <Badge
                color="primary"
                badgeContent={draftBill.workOrder ? 1 : 0}
                overlap="circular"
                sx={{ mr: draftBill.workOrder ? 1 : 0 }}
              >
                <Iconify icon="solar:sidebar-minimal-bold" />
              </Badge>
            }
            onClick={() => setDetailsOpen((open) => !open)}
          >
            Details
          </Button>
          <Button
            component={Link}
            href={paths.dashboard.accountingFinance.transactions.supplierPayments}
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:card-send-bold" />}
          >
            Payments
          </Button>
          <Button variant="outlined" color="inherit" size="small" onClick={() => window.close()}>
            Cancel
          </Button>
        </Stack>
      </Stack>

      <Card
        sx={{
          mb: 2.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.lighter} 0%, ${theme.palette.background.paper} 70%)`,
        }}
      >
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Bill total
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                {formatCurrency(billTotal)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Subtotal {formatCurrency(billSubtotal)} + tax {formatCurrency(billTax)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.75 }}
              >
                Match status
              </Typography>
              <Chip size="small" color="info" label={matchStatusLabel} />
              {resolvedBillAmount !== null ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 0.75 }}
                >
                  Applied amount: {formatCurrency(resolvedBillAmount)}
                </Typography>
              ) : null}
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.75 }}
              >
                Payment route
              </Typography>
              <Chip
                size="small"
                color={draftBill.bankAccountId || draftBill.chequeId ? 'primary' : 'default'}
                label={paymentRouteLabel}
              />
              {resolvedPaymentAccount ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 0.75 }}
                >
                  {getAccountLabel(resolvedPaymentAccount)}
                </Typography>
              ) : null}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, mb: 2.5 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                1. Procurement link
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Optional select a work order and one or more GRNs to auto-fill supplier and amounts
              </Typography>
            </Box>
            {woIsSelected ? (
              <Button
                size="small"
                color="inherit"
                startIcon={<Iconify icon="solar:restart-bold" />}
                onClick={() => handleWorkOrderChange('')}
              >
                Clear
              </Button>
            ) : null}
          </Stack>

          {isProcurementLoading ? <LinearProgress sx={{ mb: 2, borderRadius: 1 }} /> : null}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={workOrders}
                value={selectedWorkOrder || null}
                loading={workOrdersLoading}
                onChange={(_, option) => handleWorkOrderChange(option ? String(option.id) : '')}
                getOptionLabel={(option) => getWorkOrderLabel(option)}
                isOptionEqualToValue={(a, b) => String(a.id) === String(b?.id)}
                filterOptions={(options, { inputValue }) => {
                  const query = inputValue.trim().toLowerCase();
                  if (!query) return options.slice(0, 100);
                  return options
                    .filter((wo) => getWorkOrderLabel(wo).toLowerCase().includes(query))
                    .slice(0, 100);
                }}
                renderOption={(props, option) => {
                  const amount = numericValue(option.totalAmount ?? option.total_amount);
                  return (
                    <li {...props} key={option.id}>
                      <Stack sx={{ py: 0.25 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {option.workOrderNumber || option.wo_number || `WO-${option.id}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.vendor?.name || 'Unknown vendor'}
                          {amount > 0 ? ` Â· ${formatCurrency(amount)}` : ''}
                        </Typography>
                      </Stack>
                    </li>
                  );
                }}
                renderInput={(params) =>
                  autocompleteField(params, {
                    label: 'Work order',
                    placeholder: 'Type WO number or vendor name',
                  })
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                multiple
                disableCloseOnSelect
                options={availableGrns}
                value={selectedGRNs}
                disabled={!draftBill.workOrder}
                loading={grnsLoading}
                onChange={(_, options) =>
                  handleGRNSelectionChange(options.map((grn) => String(grn.id)))
                }
                getOptionLabel={getGrnLabel}
                isOptionEqualToValue={(a, b) => String(a.id) === String(b?.id)}
                renderTags={(value, getTagProps) =>
                  value.map((grn, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={grn.id}
                      size="small"
                      label={grn.grn_number}
                    />
                  ))
                }
                renderInput={(params) =>
                  autocompleteField(params, {
                    label: 'GRNs',
                    placeholder: woIsSelected
                      ? 'Select one or more GRNs'
                      : 'Select a work order first',
                    helperText: woIsSelected
                      ? 'Leave empty to bill against the work order amount only'
                      : undefined,
                    disabled: !draftBill.workOrder,
                  })
                }
              />
            </Grid>

            {(selectedWorkOrder || selectedGRNs.length > 0) && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="success" icon={false} sx={{ borderRadius: 2 }}>
                  <Stack direction="row" flexWrap="wrap" gap={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Work order amount
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {workOrderAmount > 0 ? formatCurrency(workOrderAmount) : ''}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        GRN total
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {selectedGRNs.length > 0
                          ? formatCurrency(selectedGrnReceivedTotal)
                          : 'None selected'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Source
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                        {autoFilledFrom === 'grn'
                          ? 'From GRN'
                          : autoFilledFrom === 'work-order'
                            ? 'From work order'
                            : 'Manual'}
                      </Typography>
                    </Box>
                  </Stack>
                </Alert>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, mb: 2.5 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
            2. Payment source
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Pick a bank or cheque, or leave both empty for cash in hand
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={bankAccounts}
                value={selectedBankAccount || null}
                loading={banksLoading}
                onChange={(_, option) => handleBankChange(option ? String(option.id) : '')}
                getOptionLabel={getBankLabel}
                isOptionEqualToValue={(a, b) => String(a.id) === String(b?.id)}
                renderInput={(params) =>
                  autocompleteField(params, {
                    label: 'Bank account',
                    placeholder: 'Search bank',
                    helperText: 'Optional',
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={availableCheques}
                value={selectedCheque || null}
                loading={checksLoading}
                onChange={(_, option) => handleChequeChange(option ? String(option.id) : '')}
                getOptionLabel={getChequeLabel}
                isOptionEqualToValue={(a, b) => String(a.id) === String(b?.id)}
                renderInput={(params) =>
                  autocompleteField(params, {
                    label: 'Cheque',
                    placeholder: 'Search cheque number or payee',
                    helperText: 'Selecting bank clears cheque and vice versa',
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>Payment account:</strong>{' '}
                  {resolvedPaymentAccount
                    ? getAccountLabel(resolvedPaymentAccount)
                    : 'Will be resolved on save'}
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, mb: 2.5 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            3. Bill details
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                options={vendors}
                value={selectedVendor}
                onChange={(_, vendor) =>
                  updateDraft('supplier_id', vendor ? String(vendor.id) : '')
                }
                getOptionLabel={(vendor) => vendor?.name || ''}
                isOptionEqualToValue={(a, b) => String(a.id) === String(b?.id)}
                disabled={woIsSelected}
                renderInput={(params) =>
                  autocompleteField(params, {
                    label: 'Supplier',
                    placeholder: 'Search supplier',
                    required: true,
                    helperText: woIsSelected ? 'Auto-filled from work order' : undefined,
                    disabled: woIsSelected,
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Bill date"
                type="date"
                value={draftBill.date}
                onChange={(event) => updateDraft('date', event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Due date"
                type="date"
                value={draftBill.due_date}
                onChange={(event) => updateDraft('due_date', event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Supplier invoice reference"
                value={draftBill.supplierInvoiceRef}
                onChange={(event) => updateDraft('supplierInvoiceRef', event.target.value)}
                placeholder="Invoice / WO reference"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Goods receipt reference"
                value={draftBill.goodsReceiptRef}
                onChange={(event) => updateDraft('goodsReceiptRef', event.target.value)}
                helperText="Auto-filled when GRNs are selected"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FileUploadCard
                label="Supplier invoice"
                hint="PDF, image, or document"
                file={invoiceFile}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={setInvoiceFile}
                onClear={() => setInvoiceFile(null)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FileUploadCard
                label="Mushuk"
                hint="VAT mushuk document"
                file={mushukFile}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={setMushukFile}
                onClear={() => setMushukFile(null)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Approval route"
                value={draftBill.approvalRoute}
                onChange={(event) => updateDraft('approvalRoute', event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Payment proposal"
                value={draftBill.paymentProposal}
                onChange={(event) => updateDraft('paymentProposal', event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={journals}
                value={selectedJournal}
                loading={journalsLoading}
                onChange={(_, option) => updateDraft('journal', option ? String(option.id) : '')}
                getOptionLabel={(option) => option?.name || ''}
                isOptionEqualToValue={(a, b) => String(a.id) === String(b?.id)}
                renderInput={(params) =>
                  autocompleteField(params, {
                    label: 'Journal',
                    placeholder: 'Purchase journal',
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={projects}
                value={selectedProject}
                loading={projectsLoading}
                onChange={(_, option) => updateDraft('project', option ? String(option.id) : '')}
                getOptionLabel={(option) => option?.title || option?.name || ''}
                isOptionEqualToValue={(a, b) => String(a.id) === String(b?.id)}
                renderInput={(params) =>
                  autocompleteField(params, { label: 'Project', placeholder: 'Search project' })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={costCenters}
                value={selectedCostCenter}
                loading={costCentersLoading}
                onChange={(_, option) =>
                  updateDraft('cost_center', option ? String(option.id) : '')
                }
                getOptionLabel={(option) => option?.name || ''}
                isOptionEqualToValue={(a, b) => String(a.id) === String(b?.id)}
                renderInput={(params) =>
                  autocompleteField(params, {
                    label: 'Cost center',
                    placeholder: 'Search cost center',
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={fiscalPeriods}
                value={selectedFiscalPeriod}
                loading={fiscalPeriodsLoading}
                onChange={(_, option) =>
                  updateDraft('fiscal_period', option ? String(option.id) : '')
                }
                getOptionLabel={(option) => option?.name || ''}
                isOptionEqualToValue={(a, b) => String(a.id) === String(b?.id)}
                renderInput={(params) =>
                  autocompleteField(params, {
                    label: 'Fiscal period',
                    placeholder: 'Search fiscal period',
                  })
                }
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                4. Bill lines
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Amounts auto-fill from procurement; you can still edit lines manually
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={addLine}
            >
              Add line
            </Button>
          </Stack>

          <Stack spacing={1.5}>
            {draftBill.lines.map((line, index) => {
              const lineAmt = (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
              const lineAccount =
                accounts.find((a) => String(a.id) === String(line.account)) || null;
              const lineAnalytic =
                analyticAccounts.find((a) => String(a.id) === String(line.analytic_account)) ||
                null;
              const lineCostCenter =
                costCenters.find((cc) => String(cc.id) === String(line.cost_center)) || null;
              const isAutoLine = line.source === 'grn' || line.source === 'wo';

              return (
                <Paper key={line._key ?? index} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Stack
                    direction={{ xs: 'column', lg: 'row' }}
                    spacing={1}
                    alignItems={{ xs: 'stretch', lg: 'center' }}
                    flexWrap="wrap"
                  >
                    <TextField
                      size="small"
                      label="Description"
                      value={line.description}
                      onChange={(e) => updateLine(index, 'description', e.target.value)}
                      placeholder="Line description"
                      sx={{ flex: 1, minWidth: 0 }}
                    />
                    <TextField
                      size="small"
                      label="Qty"
                      type="number"
                      value={line.quantity}
                      onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                      inputProps={{ min: 0 }}
                      sx={{ width: { xs: '100%', lg: 80 }, flexShrink: 0 }}
                    />
                    <TextField
                      size="small"
                      label="Unit price"
                      type="number"
                      value={line.unit_price}
                      onChange={(e) => updateLine(index, 'unit_price', e.target.value)}
                      inputProps={{ min: 0 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">{activeCurrency.symbol}</InputAdornment>
                        ),
                      }}
                      sx={{ width: { xs: '100%', lg: 130 }, flexShrink: 0 }}
                    />
                    <TextField
                      size="small"
                      label="Amount"
                      value={
                        lineAmt > 0
                          ? lineAmt.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : ''
                      }
                      InputProps={{ readOnly: true }}
                      sx={{ width: { xs: '100%', lg: 120 }, flexShrink: 0 }}
                    />
                    <Autocomplete
                      size="small"
                      options={accounts}
                      value={lineAccount}
                      loading={accountsLoading}
                      onChange={(_, option) =>
                        updateLine(index, 'account', option ? String(option.id) : '')
                      }
                      getOptionLabel={getAccountLabel}
                      isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
                      renderInput={(params) =>
                        autocompleteField(params, {
                          label: 'Expense account',
                          placeholder: 'Search account',
                        })
                      }
                      sx={{ flex: 1, minWidth: 0 }}
                    />
                    <Autocomplete
                      size="small"
                      options={analyticAccounts}
                      value={lineAnalytic}
                      loading={analyticLoading}
                      onChange={(_, option) =>
                        updateLine(index, 'analytic_account', option ? String(option.id) : '')
                      }
                      getOptionLabel={getAccountLabel}
                      isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
                      renderInput={(params) =>
                        autocompleteField(params, {
                          label: 'Analytic account',
                          placeholder: 'Optional',
                        })
                      }
                      sx={{ flex: 1, minWidth: 0 }}
                    />
                    <Autocomplete
                      size="small"
                      options={costCenters}
                      value={lineCostCenter}
                      loading={costCentersLoading}
                      onChange={(_, option) =>
                        updateLine(index, 'cost_center', option ? String(option.id) : '')
                      }
                      getOptionLabel={(option) => option?.name || ''}
                      isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
                      renderInput={(params) =>
                        autocompleteField(params, {
                          label: 'Cost center',
                          placeholder: 'Optional',
                        })
                      }
                      sx={{ flex: 1, minWidth: 0 }}
                    />
                    {isAutoLine ? (
                      <Chip
                        size="small"
                        color="success"
                        variant="outlined"
                        label={line.source === 'grn' ? 'From GRN' : 'From WO'}
                        sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', lg: 'center' } }}
                      />
                    ) : null}
                    <Tooltip title={isAutoLine ? 'Auto-filled line' : 'Remove line'}>
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeLine(index)}
                          disabled={draftBill.lines.length === 1}
                        >
                          <Iconify icon="solar:trash-bin-minimalistic-bold" width={18} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>

          <Box sx={{ mt: 2 }}>
            <Stack
              direction="row"
              justifyContent="flex-end"
              alignItems="center"
              spacing={2}
              sx={{ mb: 1.5 }}
            >
              <Typography variant="body2" color="text.secondary">
                Tax rate %
              </Typography>
              <TextField
                size="small"
                type="number"
                value={draftBill.taxRate}
                onChange={(e) => updateDraft('taxRate', e.target.value)}
                sx={{ width: 96 }}
                inputProps={{ min: 0 }}
              />
            </Stack>
            <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, bgcolor: 'background.neutral' }}>
              <Stack spacing={0.75}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Subtotal
                  </Typography>
                  <Typography variant="body2">{formatCurrency(billSubtotal)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Tax ({draftBill.taxRate || 0}%)
                  </Typography>
                  <Typography variant="body2">{formatCurrency(billTax)}</Typography>
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle1" fontWeight={700}>
                    Total
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {formatCurrency(billTotal)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Box>
        </CardContent>
      </Card>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mt: 3 }}
      >
        <Typography variant="caption" color="text.secondary">
          {!draftBill.supplier_id
            ? 'Select a supplier to enable save'
            : !canSave
              ? 'Add at least one line with description and amount'
              : 'Ready to save draft'}
        </Typography>
        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Button onClick={() => window.close()}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateBill} disabled={!canSave}>
            {saving ? 'Saving' : 'Save draft'}
          </Button>
        </Stack>
      </Stack>

      <Drawer
        anchor="right"
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="h6" fontWeight={800}>
            Procurement details
          </Typography>
          <IconButton onClick={() => setDetailsOpen(false)} size="small">
            <Iconify icon="solar:close-circle-bold" width={20} />
          </IconButton>
        </Stack>
        <Box sx={{ p: 2, overflowY: 'auto' }}>
          <DetailSection title="Work order" icon="solar:document-bold">
            <WorkOrderDetail
              workOrder={workOrderDetail}
              loading={workOrderDetailLoading && Boolean(draftBill.workOrder)}
            />
          </DetailSection>
          <DetailSection title="Goods received notes" icon="solar:box-bold">
            <GrnDetail
              grns={grnDetails}
              loading={grnDetailsLoading && draftBill.grnSelections.length > 0}
            />
          </DetailSection>
        </Box>
      </Drawer>
    </Container>
  );
}
