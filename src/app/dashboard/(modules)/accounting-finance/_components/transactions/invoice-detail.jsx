'use client';

import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { Iconify } from 'src/components/iconify';

import { getInvoiceById } from './mock-data';
import { useTransactionStatusApi } from '../shared/use-transaction-status-api';
import { formatStatusLabel, STATUS_CHIP_COLORS } from '../shared/status-workflow';
import {
  TimelineCard,
  formatDetailDate,
  ControlChecksCard,
  ReferenceLinksCard,
} from './transaction-detail-shell';
import {
  exportCsvFile,
  exportJsonFile,
  formatCurrency,
  exportExcelWorkbook,
  buildTransactionCsvRows,
  buildTransactionWorkbookData,
} from '../utils';

const INVOICE_STATUS_ACTIONS = {
  draft: [
    { status: 'sent', label: 'Send Invoice', variant: 'contained' },
    {
      status: 'cancelled',
      label: 'Cancel Invoice',
      variant: 'outlined',
      color: 'error',
      confirmation: 'cancelled',
    },
  ],
  sent: [
    { status: 'posted', label: 'Post Invoice', variant: 'contained', confirmation: 'posted' },
    {
      status: 'cancelled',
      label: 'Cancel Invoice',
      variant: 'outlined',
      color: 'error',
      confirmation: 'cancelled',
    },
  ],
  posted: [
    { status: 'paid', label: 'Mark as Paid', variant: 'contained', confirmation: 'paid' },
    {
      status: 'cancelled',
      label: 'Cancel Invoice',
      variant: 'outlined',
      color: 'error',
      confirmation: 'cancelled',
    },
  ],
  partial: [
    { status: 'paid', label: 'Mark as Paid', variant: 'contained', confirmation: 'paid' },
    {
      status: 'cancelled',
      label: 'Cancel Invoice',
      variant: 'outlined',
      color: 'error',
      confirmation: 'cancelled',
    },
  ],
  overdue: [
    { status: 'sent', label: 'Send Invoice', variant: 'contained' },
    {
      status: 'cancelled',
      label: 'Cancel Invoice',
      variant: 'outlined',
      color: 'error',
      confirmation: 'cancelled',
    },
  ],
  paid: [],
  cancelled: [],
};

const DUNNING_COLORS = {
  none: 'default',
  stage_1: 'info',
  stage_2: 'warning',
  stage_3: 'error',
};

function formatStageLabel(value) {
  return value.replace(/_/g, ' ');
}

function enrichDetailInvoice(raw) {
  if (!raw) return null;
  return {
    ...raw,
    dunningStage: raw.dunning_stage,
    paymentTerms: raw.payment_terms,
    servicePeriod: raw.service_period,
    billingOwner: raw.billing_owner,
    billingReference: raw.billing_reference,
    recurringLabel: raw.recurring_label,
    promiseToPay: raw.promise_to_pay,
    creditWarning: raw.credit_warning,
    linkedJournals: raw.linked_journals ?? [],
    subtotal: Number(raw.subtotal ?? 0),
    tax_amount: Number(raw.tax_amount ?? 0),
    total: Number(raw.total ?? 0),
    paid_amount: Number(raw.paid_amount ?? 0),
    balance_due: Number(raw.balance_due ?? 0),
    lines: (raw.lines ?? []).map((l) => ({
      ...l,
      quantity: Number(l.quantity ?? 1),
      unit_price: Number(l.unit_price ?? 0),
      amount: Number(l.amount ?? 0),
    })),
    allocations: raw.allocations ?? [],
    attachments: (raw.attachments ?? []).map((a) => ({ ...a, type: a.file_type })),
    chatter: (raw.chatter ?? []).map((c) => ({
      ...c,
      time: c.time ?? c.time_label ?? '',
    })),
  };
}

export default function InvoiceDetail({ id }) {
  const router = useRouter();
  const detailUrl = endpoints.accounting.customer_invoice_by_id(id);
  const { data: rawInvoice, isLoading } = useSWR(detailUrl, fetcher);
  const { transitionStatus, loadingKey } = useTransactionStatusApi({
    statusEndpoint: (invoiceId) =>
      `${endpoints.accounting.customer_invoice_by_id(invoiceId)}status/`,
    mutateKeys: [detailUrl, `${endpoints.accounting.customer_invoices}?ordering=-created_at,-id`],
  });
  const invoice = useMemo(
    () => enrichDetailInvoice(rawInvoice) ?? (!isLoading ? getInvoiceById(id) : null),
    [rawInvoice, isLoading, id]
  );
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(null);

  if (isLoading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Loading invoice…</Typography>
      </Box>
    );
  }

  if (!isLoading && !invoice) {
    return <Alert severity="error">Invoice not found.</Alert>;
  }

  const customer = invoice.customer_detail ?? {};
  const invoiceContextItems = [
    { label: 'Customer', value: customer?.name },
    { label: 'Payment terms', value: invoice.paymentTerms },
    { label: 'Invoice date', value: formatDetailDate(invoice.date) },
    { label: 'Due date', value: formatDetailDate(invoice.due_date) },
    { label: 'Service period', value: invoice.servicePeriod },
    { label: 'Billing owner', value: invoice.billingOwner },
    { label: 'Billing reference', value: invoice.billingReference },
    { label: 'Promise to pay', value: formatDetailDate(invoice.promiseToPay) },
  ];
  const controlChecks = [
    {
      label: 'Settlement progress',
      description: 'Invoice balance should trend to zero before close',
      status: invoice.balance_due > 0 ? 'warning' : 'success',
      value: invoice.balance_due > 0 ? 'open balance' : 'settled',
    },
    {
      label: 'Credit review',
      description: 'Customer-level exposure monitoring',
      status: invoice.creditWarning ? 'error' : 'success',
      value: invoice.creditWarning ? 'review required' : 'within limit',
    },
    {
      label: 'Collections posture',
      description: 'Dunning workflow maturity on the receivable',
      status:
        invoice.dunningStage === 'none'
          ? 'success'
          : invoice.dunningStage === 'stage_1'
            ? 'info'
            : 'warning',
      value: formatStageLabel(invoice.dunningStage),
    },
    {
      label: 'Billing governance',
      description: 'Invoice should carry ownership and source reference',
      status: invoice.billingOwner && invoice.billingReference ? 'success' : 'warning',
      value: invoice.billingOwner || 'pending',
    },
  ];

  const referenceLinks = [
    {
      label: 'Customer invoice register',
      description: 'Return to the invoice list',
      href: paths.dashboard.accountingFinance.transactions.customerInvoices,
      icon: 'solar:list-bold',
    },
    {
      label: 'Customer receipt register',
      description: 'Review receipt allocations against this invoice',
      href: paths.dashboard.accountingFinance.transactions.customerReceipts,
      icon: 'solar:wallet-money-bold',
    },
    {
      label: 'Credit note register',
      description: 'Inspect customer adjustments and offsets',
      href: paths.dashboard.accountingFinance.transactions.creditNotes,
      icon: 'solar:archive-down-bold',
    },
  ];

  const timeline = [
    {
      label: 'Invoice issued',
      description: `${customer?.name || 'Customer'} billed on current terms`,
      status: invoice.paymentTerms,
      tone: 'info',
      time: formatDetailDate(invoice.date),
      icon: 'solar:bill-list-bold',
    },
    {
      label: 'Collections workflow',
      description: invoice.promiseToPay
        ? `Promise to pay set for ${formatDetailDate(invoice.promiseToPay)}`
        : 'No promise to pay logged yet',
      status: formatStageLabel(invoice.dunningStage),
      tone: invoice.dunningStage === 'none' ? 'success' : 'warning',
      icon: 'solar:mailbox-bold',
    },
    {
      label: 'Allocation status',
      description: `${invoice.allocations.length} payment allocations recorded`,
      status: invoice.status,
      tone:
        invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'error' : 'warning',
      icon: 'solar:check-read-bold',
    },
  ];

  const statusTransitions = INVOICE_STATUS_ACTIONS[invoice.status] || [];

  const executeStatusTransition = async (nextStatus) => {
    try {
      const loadingToastId = toast.loading(`Updating status to ${formatStatusLabel(nextStatus)}…`);
      setPendingAction(`status:${nextStatus}`);
      if (nextStatus === 'posted') {
        await axiosInstance.post(endpoints.accounting.customer_invoice_post(id));
      } else if (nextStatus === 'paid') {
        // Register payment for the full balance — creates payment journal entry
        await axiosInstance.post(endpoints.accounting.customer_invoice_register_payment(id), {
          amount: invoice.balance_due,
        });
      } else {
        await transitionStatus({ id, status: nextStatus });
      }
      // Refresh data
      await mutate(detailUrl);
      toast.dismiss(loadingToastId);
      toast.success(`Invoice status changed to ${formatStatusLabel(nextStatus)}`);
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to update status');
    } finally {
      setPendingAction(null);
      setConfirmStatus(null);
    }
  };

  const runActionWithToast = async (
    action,
    successMessage,
    errorMessage,
    loadingMessage,
    label
  ) => {
    const loadingToastId = toast.loading(loadingMessage || 'Processing action...');
    setPendingAction(label || null);

    try {
      await action();
      toast.dismiss(loadingToastId);
      toast.success(successMessage);
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error(error?.message || errorMessage);
    } finally {
      setPendingAction(null);
    }
  };

  const handleEscalateDunning = () => {
    const nextStage =
      invoice.dunning_stage === 'none'
        ? 'stage_1'
        : invoice.dunning_stage === 'stage_1'
          ? 'stage_2'
          : 'stage_3';

    runActionWithToast(
      async () => {
        await axiosInstance.patch(detailUrl, { dunning_stage: nextStage });
        await mutate(detailUrl);
      },
      `Escalated to ${formatStageLabel(nextStage)}`,
      'Failed to escalate dunning',
      'Escalating dunning…',
      'Escalate Dunning'
    );
  };

  const printContent = (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Invoice Context</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <tbody>
            {invoiceContextItems.map((item, idx) => (
              <tr key={idx}>
                <td
                  style={{
                    border: '1px solid #ddd',
                    padding: '6px 8px',
                    fontWeight: 600,
                    width: '40%',
                  }}
                >
                  {item.label}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                  {String(item.value ?? '—')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Invoice Lines</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Description
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Analytic
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                Qty
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                Rate
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{line.description}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{line.analytic}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                  {line.quantity}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                  {formatCurrency(line.unit_price)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                  {formatCurrency(line.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginTop: 8 }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', width: '70%' }} />
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>
                Subtotal
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {formatCurrency(invoice.subtotal)}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }} />
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>Tax</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {formatCurrency(invoice.tax_amount)}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }} />
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 700 }}>
                Total
              </td>
              <td
                style={{
                  border: '1px solid #ddd',
                  padding: '6px 8px',
                  textAlign: 'right',
                  fontWeight: 700,
                }}
              >
                {formatCurrency(invoice.total)}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }} />
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>
                Paid
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {formatCurrency(invoice.paid_amount)}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }} />
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 700 }}>
                Balance Due
              </td>
              <td
                style={{
                  border: '1px solid #ddd',
                  padding: '6px 8px',
                  textAlign: 'right',
                  fontWeight: 700,
                }}
              >
                {formatCurrency(invoice.balance_due)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Allocations</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Reference
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Method
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Date
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.allocations.map((allocation, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                  {allocation.reference}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                  {allocation.method}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{allocation.date}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                  {formatCurrency(allocation.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Control Checks</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Check
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Description
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Status
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {controlChecks.map((check, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>
                  {check.label}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                  {check.description}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{check.status}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{check.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Workflow Timeline</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Event
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Description
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Status
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((item, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>
                  {item.label}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.description}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.status}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.time || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            {invoice.number}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customer invoice workspace with allocation history, dunning control, and receivables
            chatter.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} flexWrap="wrap">
          {statusTransitions.map((transition) => (
            <Button
              key={transition.status}
              variant={transition.variant}
              color={transition.color || 'primary'}
              startIcon={transition.icon}
              disabled={Boolean(pendingAction) || loadingKey === `${id}:${transition.status}`}
              onClick={() => {
                if (transition.confirmation) {
                  setConfirmStatus(transition.status);
                  return;
                }
                executeStatusTransition(transition.status);
              }}
            >
              {transition.label}
            </Button>
          ))}
          {invoice.status !== 'paid' && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<Iconify icon="solar:mailbox-bold" />}
              onClick={handleEscalateDunning}
            >
              Escalate Dunning
            </Button>
          )}
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:printer-minimalistic-bold" />}
            disabled={Boolean(pendingAction)}
            onClick={() => setPrintOpen(true)}
          >
            Print Pack
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:document-bold" />}
            disabled={Boolean(pendingAction)}
            onClick={() =>
              runActionWithToast(
                () =>
                  exportCsvFile(
                    `${invoice.number}-detail`,
                    buildTransactionCsvRows({
                      summary: [
                        { label: 'Total', value: formatCurrency(invoice.total) },
                        { label: 'Paid', value: formatCurrency(invoice.paid_amount) },
                        { label: 'Balance due', value: formatCurrency(invoice.balance_due) },
                        { label: 'Billing owner', value: invoice.billingOwner },
                      ],
                      sections: [
                        {
                          title: 'Invoice Context',
                          items: invoiceContextItems,
                        },
                      ],
                      tables: [
                        {
                          title: 'Invoice Lines',
                          columns: [
                            { key: 'description', label: 'Description' },
                            { key: 'analytic', label: 'Analytic' },
                            { key: 'quantity', label: 'Qty' },
                            { key: 'unit_price', label: 'Rate' },
                            { key: 'amount', label: 'Amount' },
                          ],
                          rows: invoice.lines,
                        },
                        {
                          title: 'Allocations',
                          columns: [
                            { key: 'reference', label: 'Reference' },
                            { key: 'method', label: 'Method' },
                            { key: 'date', label: 'Date' },
                            { key: 'amount', label: 'Amount' },
                          ],
                          rows: invoice.allocations,
                        },
                      ],
                      controlChecks,
                      referenceLinks,
                      timeline,
                      auditTrail: invoice.chatter.map((item) => ({
                        primary: item.author,
                        secondary: item.message,
                        meta: item.time,
                      })),
                    })
                  ),
                'CSV exported',
                'Failed to export CSV',
                'Exporting CSV...',
                'Export CSV'
              )
            }
          >
            {pendingAction === 'Export CSV' ? 'Export CSV...' : 'Export CSV'}
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:file-download-bold" />}
            disabled={Boolean(pendingAction)}
            onClick={() =>
              runActionWithToast(
                () =>
                  exportExcelWorkbook(
                    `${invoice.number}-detail`,
                    buildTransactionWorkbookData({
                      summary: [
                        { label: 'Total', value: formatCurrency(invoice.total) },
                        { label: 'Paid', value: formatCurrency(invoice.paid_amount) },
                        { label: 'Balance due', value: formatCurrency(invoice.balance_due) },
                        { label: 'Billing owner', value: invoice.billingOwner },
                      ],
                      sections: [
                        {
                          title: 'Invoice Context',
                          items: invoiceContextItems,
                        },
                      ],
                      tables: [
                        {
                          title: 'Invoice Lines',
                          columns: [
                            { key: 'description', label: 'Description' },
                            { key: 'analytic', label: 'Analytic' },
                            { key: 'quantity', label: 'Qty' },
                            { key: 'unit_price', label: 'Rate' },
                            { key: 'amount', label: 'Amount' },
                          ],
                          rows: invoice.lines,
                        },
                        {
                          title: 'Allocations',
                          columns: [
                            { key: 'reference', label: 'Reference' },
                            { key: 'method', label: 'Method' },
                            { key: 'date', label: 'Date' },
                            { key: 'amount', label: 'Amount' },
                          ],
                          rows: invoice.allocations,
                        },
                      ],
                      controlChecks,
                      referenceLinks,
                      timeline,
                      auditTrail: invoice.chatter.map((item) => ({
                        primary: item.author,
                        secondary: item.message,
                        meta: item.time,
                      })),
                    })
                  ),
                'Excel workbook exported',
                'Failed to export Excel workbook',
                'Building Excel workbook...',
                'Export Excel'
              )
            }
          >
            {pendingAction === 'Export Excel' ? 'Export Excel...' : 'Export Excel'}
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:download-bold" />}
            disabled={Boolean(pendingAction)}
            onClick={() =>
              runActionWithToast(
                () =>
                  exportJsonFile(invoice.number, {
                    invoice,
                    customer,
                    controlChecks,
                    timeline,
                  }),
                'JSON exported',
                'Failed to export JSON',
                'Exporting JSON...',
                'Export JSON'
              )
            }
          >
            {pendingAction === 'Export JSON' ? 'Export JSON...' : 'Export JSON'}
          </Button>
          <Button variant="text" onClick={() => router.back()}>
            Back
          </Button>
        </Stack>
      </Stack>

      {invoice.creditWarning && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          This customer is flagged for credit review. Collections and new billing should be
          coordinated in parallel.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Bill To
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {customer?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {customer?.email}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1.25, display: 'block' }}
                    >
                      Payment terms
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {invoice.paymentTerms}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1.25, display: 'block' }}
                    >
                      Service period
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {invoice.servicePeriod || 'Not set'}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1.25, display: 'block' }}
                    >
                      Billing owner
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {invoice.billingOwner || 'Unassigned'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                    <Typography variant="caption" color="text.secondary">
                      Invoice Date
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {new Date(invoice.date).toLocaleDateString()}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1.25, display: 'block' }}
                    >
                      Due Date
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1.25, display: 'block' }}
                    >
                      Promise To Pay
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {invoice.promiseToPay
                        ? new Date(invoice.promiseToPay).toLocaleDateString()
                        : 'No commitment logged'}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1.25, display: 'block' }}
                    >
                      Billing reference
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {invoice.billingReference || 'No source reference'}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell>Account</TableCell>
                        <TableCell>Analytic</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Rate</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoice.lines.map((line, index) => (
                        <TableRow key={`${line.description}-${index}`}>
                          <TableCell>{line.description}</TableCell>
                          <TableCell>{line.account_code ? `${line.account_code} - ${line.account_name || ''}` : '-'}</TableCell>
                          <TableCell>{line.analytic || '-'}</TableCell>
                          <TableCell align="right">{line.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(line.unit_price)}</TableCell>
                          <TableCell align="right">{formatCurrency(line.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Box sx={{ width: 280 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">Subtotal</Typography>
                        <Typography variant="body2">{formatCurrency(invoice.subtotal)}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">Tax</Typography>
                        <Typography variant="body2">
                          {formatCurrency(invoice.tax_amount)}
                        </Typography>
                      </Stack>
                      <Divider />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle2" fontWeight={700}>
                          Total
                        </Typography>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {formatCurrency(invoice.total)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="success.main">
                          Paid
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          {formatCurrency(invoice.paid_amount)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle2" fontWeight={700} color="error">
                          Balance Due
                        </Typography>
                        <Typography variant="subtitle2" fontWeight={700} color="error">
                          {formatCurrency(invoice.balance_due)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Allocations
                </Typography>
                <Stack spacing={1.25}>
                  {invoice.allocations.length ? (
                    invoice.allocations.map((allocation) => (
                      <Stack
                        key={`${allocation.reference}-${allocation.date}`}
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {allocation.reference}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {allocation.method} · {new Date(allocation.date).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={700}>
                          {formatCurrency(allocation.amount)}
                        </Typography>
                      </Stack>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No payments allocated yet.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <ControlChecksCard checks={controlChecks} />
            <ReferenceLinksCard links={referenceLinks} />
            <TimelineCard items={timeline} />
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Status Summary
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={invoice.status_display || formatStatusLabel(invoice.status)}
                        color={STATUS_CHIP_COLORS[invoice.status] || 'default'}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Dunning stage
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={formatStageLabel(invoice.dunningStage)}
                        color={DUNNING_COLORS[invoice.dunningStage]}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Linked journals
                    </Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mt: 0.75 }}>
                      {invoice.linkedJournals.map((journal) => (
                        <Chip key={journal} label={journal} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Attachments
                </Typography>
                <Stack spacing={1.25}>
                  {invoice.attachments.map((attachment) => (
                    <Stack key={attachment.id} direction="row" justifyContent="space-between">
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {attachment.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {attachment.type}
                        </Typography>
                      </Box>
                      <Iconify icon="solar:paperclip-bold" width={18} />
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Collections Chatter
                </Typography>
                <Stack spacing={1.25}>
                  {invoice.chatter.map((item) => (
                    <Box
                      key={item.id}
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Typography variant="body2" fontWeight={700}>
                          {item.author}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.time}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ mt: 0.75 }}>
                        {item.message}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {printOpen && (
        <PdfPrintLayout
          title={`Customer Invoice — ${invoice.number}`}
          onClose={() => setPrintOpen(false)}
        >
          {printContent}
        </PdfPrintLayout>
      )}

      <Dialog open={Boolean(confirmStatus)} onClose={() => setConfirmStatus(null)}>
        <DialogTitle>
          {confirmStatus === 'paid' ? 'Confirm Mark as Paid' : 'Confirm Cancel Invoice'}
        </DialogTitle>
        <DialogContent>
          {confirmStatus === 'paid'
            ? 'This will mark the invoice as paid. This cannot be undone.'
            : 'This will cancel the invoice. This cannot be undone.'}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmStatus(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => executeStatusTransition(confirmStatus)}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
