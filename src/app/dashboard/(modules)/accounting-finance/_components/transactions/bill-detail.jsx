'use client';

import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Dialog from '@mui/material/Dialog';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { CONFIG } from 'src/config-global';
import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { Iconify } from 'src/components/iconify';

import { getBillById } from './mock-data'; // legacy fallback for non-numeric IDs
import { enrichBillDetail } from './use-vendor-bills-api';
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

const STATUS_COLORS = {
  draft: 'default',
  pending: 'warning',
  received: 'info',
  approved: 'info',
  partial: 'warning',
  paid: 'success',
  overdue: 'error',
  posted: 'success',
};

const BILL_STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending Approval',
  approved: 'Approved',
  partial: 'Partially Paid',
  paid: 'Paid',
  overdue: 'Overdue',
  posted: 'Posted',
  cancelled: 'Cancelled',
};

const BILL_STATUS_ACTIONS = {
  draft: [
    { status: 'pending', label: 'Submit for Approval', variant: 'contained' },
    {
      status: 'cancelled',
      label: 'Cancel Bill',
      variant: 'outlined',
      color: 'error',
      confirmation: 'cancel',
    },
  ],
  pending: [
    { status: 'approved', label: 'Approve', variant: 'contained' },
    { status: 'draft', label: 'Return to Draft', variant: 'outlined', color: 'inherit' },
    {
      status: 'cancelled',
      label: 'Cancel Bill',
      variant: 'outlined',
      color: 'error',
      confirmation: 'cancel',
    },
  ],
  approved: [
    { status: 'posted', label: 'Post Bill', variant: 'contained', confirmation: 'post' },
    {
      status: 'cancelled',
      label: 'Cancel Bill',
      variant: 'outlined',
      color: 'error',
      confirmation: 'cancel',
    },
  ],
  partial: [
    {
      status: 'cancelled',
      label: 'Cancel Bill',
      variant: 'outlined',
      color: 'error',
      confirmation: 'cancel',
    },
  ],
  overdue: [
    { status: 'posted', label: 'Post Bill', variant: 'contained', confirmation: 'post' },
    {
      status: 'cancelled',
      label: 'Cancel Bill',
      variant: 'outlined',
      color: 'error',
      confirmation: 'cancel',
    },
  ],
  posted: [],
  cancelled: [],
};

const toList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.payment)) return response.payment;
  return [];
};

const resolveFileUrl = (file) => {
  if (!file) return null;
  if (file.startsWith('http://') || file.startsWith('https://')) return file;
  return `${CONFIG.serverUrl}${file}`;
};

const getFileExt = (file) => (file || '').split('.').pop()?.toLowerCase() || '';

function BillFilesCard({ invoiceFile, mushukFile }) {
  const files = [];
  if (invoiceFile) {
    files.push({
      key: 'invoice',
      label: 'Vendor invoice',
      url: resolveFileUrl(invoiceFile),
      name: invoiceFile.split('/').pop(),
    });
  }
  if (mushukFile) {
    files.push({
      key: 'mushuk',
      label: 'Mushuk / tax document',
      url: resolveFileUrl(mushukFile),
      name: mushukFile.split('/').pop(),
    });
  }

  if (files.length === 0) {
    return (
      <Alert severity="info" variant="outlined">
        No invoice or supporting documents attached to this bill.
      </Alert>
    );
  }

  return (
    <Stack spacing={1.25}>
      {files.map((file) => (
        <Box
          key={file.key}
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'background.neutral',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Iconify
              icon={getFileExt(file.name) === 'pdf' ? 'solar:file-text-bold' : 'solar:file-bold'}
              width={22}
              color="primary.main"
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {file.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {file.name}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Preview">
                <IconButton
                  size="small"
                  component="a"
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Iconify icon="solar:eye-bold" width={18} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download">
                <IconButton
                  size="small"
                  component="a"
                  href={file.url}
                  download
                  rel="noopener noreferrer"
                >
                  <Iconify icon="solar:download-bold" width={18} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>
      ))}
    </Stack>
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
        No work order linked to this bill.
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
        No GRNs linked to this bill.
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

export default function BillDetail({ id }) {
  const router = useRouter();
  const detailUrl = endpoints.accounting.bill_by_id(id);

  // All hooks must be declared before any conditional returns.
  const isNumeric = !Number.isNaN(Number(id));
  const { data: rawBill } = useSWR(isNumeric ? detailUrl : null, fetcher);

  // Local state: start from mock fallback (for non-numeric legacy IDs), then
  // sync from API when the real data arrives.
  const mockFallback = isNumeric ? null : getBillById(id);
  const [bill, setBill] = useState(mockFallback ?? null);
  const [supplier, setSupplier] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [statusConfirmation, setStatusConfirmation] = useState(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Optional procurement details sidebar. Only fetched when the drawer is open
  // so we don't waste requests on the detail view.
  const { data: rawWorkOrderDetail, isLoading: workOrderDetailLoading } = useSWR(
    bill?.work_order && detailsOpen
      ? endpoints.procurement_management.work_order_by_id(bill.work_order)
      : null,
    fetcher
  );
  const { data: rawGrnDetails, isLoading: grnDetailsLoading } = useSWR(
    bill?.grn_ids?.length && detailsOpen
      ? `${endpoints.procurement_management.grns}?id__in=${bill.grn_ids.join(',')}`
      : null,
    fetcher
  );

  const workOrderDetail = useMemo(() => {
    const list = toList(rawWorkOrderDetail);
    return list[0] || rawWorkOrderDetail || null;
  }, [rawWorkOrderDetail]);

  const grnDetails = useMemo(() => toList(rawGrnDetails), [rawGrnDetails]);

  const linkedDetailCount = (bill?.work_order ? 1 : 0) + (bill?.grn_ids?.length || 0);

  // Sync enriched API data into local state whenever the server responds.
  useEffect(() => {
    if (rawBill) {
      setBill(enrichBillDetail(rawBill));
    }
  }, [rawBill]);

  useEffect(() => {
    let cancelled = false;

    async function loadSupplier() {
      if (!bill?.supplier_id) return;
      try {
        const { data } = await axiosInstance.get(
          `${endpoints.procurement_management.vendors_management}${bill.supplier_id}/`
        );
        if (!cancelled) setSupplier(data ?? null);
      } catch (error) {
        if (!cancelled) {
          setSupplier(
            bill.vendor_detail?.name ? bill.vendor_detail : { name: `Vendor #${bill.supplier_id}` }
          );
        }
      }
    }

    loadSupplier();
    return () => {
      cancelled = true;
    };
  }, [bill?.supplier_id, bill?.vendor_detail]);

  if (!bill) {
    return <Alert severity="error">Vendor bill not found.</Alert>;
  }

  const statusActions = BILL_STATUS_ACTIONS[bill.status] || [];

  const executeStatusTransition = async (nextStatus, confirmationType) => {
    const loadingToastId = toast.loading(
      `Updating status to ${BILL_STATUS_LABELS[nextStatus] || nextStatus}…`
    );
    setPendingAction(`status:${nextStatus}`);

    try {
      if (nextStatus === 'approved') {
        await axiosInstance.post(endpoints.accounting.bill_approve(id));
      } else if (nextStatus === 'posted') {
        await axiosInstance.post(endpoints.accounting.bill_post(id));
      } else {
        await axiosInstance.patch(`${detailUrl}status/`, { status: nextStatus });
      }
      const { data } = await axiosInstance.get(detailUrl);
      if (data) {
        setBill(enrichBillDetail(data));
      }
      await mutate(detailUrl);
      toast.dismiss(loadingToastId);
      toast.success(`Bill status changed to ${BILL_STATUS_LABELS[nextStatus] || nextStatus}`);
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.error ||
          error?.message ||
          'Failed to update status'
      );
    } finally {
      setPendingAction(null);
      if (confirmationType) {
        setStatusConfirmation(null);
      }
    }
  };

  const matchedLines = bill.lines.filter((line) => line.matched).length;
  const billContextItems = [
    { label: 'Supplier', value: supplier?.name },
    { label: 'Bill date', value: formatDetailDate(bill.date) },
    { label: 'Due date', value: formatDetailDate(bill.due_date) },
    { label: 'Payment proposal', value: bill.paymentProposal },
    { label: 'Supplier invoice ref', value: bill.supplierInvoiceRef },
    { label: 'Goods receipt ref', value: bill.goodsReceiptRef },
    { label: 'Approval route', value: bill.approvalRoute },
  ];
  const controlChecks = [
    {
      label: 'Three-way match',
      description: 'Bill should reconcile to PO and receipt before payment release',
      status:
        bill.matchStatus === '3-way matched' ? 'success' : bill.disputeFlag ? 'error' : 'warning',
      value: bill.matchStatus,
    },
    {
      label: 'Dispute status',
      description: 'Exception handling on vendor-side claims',
      status: bill.disputeFlag ? 'error' : 'success',
      value: bill.disputeFlag ? 'blocked' : 'clear',
    },
    {
      label: 'Matched line coverage',
      description: 'Operational receipt confirmation against billed items',
      status: matchedLines === bill.lines.length ? 'success' : 'warning',
      value: `${matchedLines}/${bill.lines.length} matched`,
    },
    {
      label: 'Approval evidence',
      description: 'Bill should carry source references and approval routing',
      status: bill.approvalRoute && bill.supplierInvoiceRef ? 'success' : 'warning',
      value: bill.approvalRoute || 'pending',
    },
  ];

  const referenceLinks = [
    {
      label: 'Vendor bill register',
      description: 'Return to the AP bill list',
      href: paths.dashboard.accountingFinance.transactions.vendorBills,
      icon: 'solar:list-bold',
    },
    {
      label: 'Supplier payment register',
      description: 'Review payment releases against this bill',
      href: paths.dashboard.accountingFinance.transactions.supplierPayments,
      icon: 'solar:card-send-bold',
    },
    {
      label: 'Debit note register',
      description: 'Inspect supplier-side adjustments and claims',
      href: paths.dashboard.accountingFinance.transactions.debitNotes,
      icon: 'solar:file-text-bold',
    },
  ];

  const timeline = [
    {
      label: 'Bill received',
      description: `${supplier?.name || 'Supplier'} submitted this bill for validation`,
      status: bill.status,
      tone: bill.status === 'paid' ? 'success' : bill.status === 'overdue' ? 'error' : 'info',
      time: formatDetailDate(bill.date),
      icon: 'solar:bill-list-bold',
    },
    {
      label: 'Match control',
      description: bill.paymentProposal,
      status: bill.matchStatus,
      tone:
        bill.matchStatus === '3-way matched' ? 'success' : bill.disputeFlag ? 'error' : 'warning',
      icon: 'solar:shield-check-bold',
    },
    {
      label: 'Payment readiness',
      description: `Balance due ${formatCurrency(bill.balance_due)}`,
      status: bill.disputeFlag
        ? 'blocked'
        : bill.balance_due > 0
          ? 'pending settlement'
          : 'settled',
      tone: bill.disputeFlag ? 'error' : bill.balance_due > 0 ? 'warning' : 'success',
      icon: 'solar:wallet-money-bold',
    },
  ];

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

  const handleOpenPayDialog = () => {
    setPayAmount(String(bill.balance_due));
    setPayDialogOpen(true);
  };

  const handlePayBill = async () => {
    const amountToApply = Number(payAmount);
    if (!amountToApply || amountToApply <= 0) {
      toast.error('Enter a valid payment amount.');
      return;
    }
    if (amountToApply > bill.balance_due) {
      toast.error(`Amount cannot exceed ${formatCurrency(bill.balance_due)}.`);
      return;
    }
    setPayDialogOpen(false);
    try {
      await axiosInstance.post(endpoints.accounting.bill_register_payment(id), {
        amount: amountToApply,
      });
      const { data } = await axiosInstance.get(detailUrl);
      if (data) {
        setBill(enrichBillDetail(data));
      }
      await mutate(detailUrl);
      toast.success(`Payment of ${formatCurrency(amountToApply)} registered.`);
    } catch (error) {
      toast.error(error?.response?.data?.detail || error?.message || 'Failed to register payment');
    }
  };

  const handleResolveDispute = async () => {
    try {
      await axiosInstance.patch(detailUrl, {
        dispute_flag: false,
        match_status: '3-way matched',
      });
      const { data } = await axiosInstance.get(detailUrl);
      if (data) {
        setBill(enrichBillDetail(data));
      }
      await mutate(detailUrl);
      toast.success('Dispute resolved and bill released for payment.');
    } catch (error) {
      toast.error(error?.response?.data?.detail || error?.message || 'Failed to resolve dispute');
    }
  };

  const printContent = (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Bill Context</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <tbody>
            {billContextItems.map((item, idx) => (
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
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Bill Lines</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Description
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
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'center' }}>
                Matched
              </th>
            </tr>
          </thead>
          <tbody>
            {bill.lines.map((line, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{line.description}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                  {line.quantity}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                  {formatCurrency(line.unit_price)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                  {formatCurrency(line.amount)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'center' }}>
                  {line.matched ? 'Yes' : 'No'}
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
                {formatCurrency(bill.subtotal)}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }} />
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>Tax</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {formatCurrency(bill.tax_amount)}
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
                {formatCurrency(bill.total)}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }} />
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>
                Paid
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {formatCurrency(bill.paid_amount)}
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
                {formatCurrency(bill.balance_due)}
              </td>
            </tr>
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
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ textDecoration: bill.status === 'cancelled' ? 'line-through' : 'none' }}
          >
            {bill.number}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vendor bill workspace with match control, dispute handling, and payment release
            tracking.
          </Typography>
        </Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.25}
          sx={{
            minHeight: 48,
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Chip
            label={BILL_STATUS_LABELS[bill.status] || bill.status}
            size="small"
            color={STATUS_COLORS[bill.status] || 'default'}
            sx={{ textTransform: 'capitalize' }}
          />
          {statusActions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              size="medium"
              color={action.color || 'primary'}
              sx={{ minWidth: 160 }}
              disabled={Boolean(pendingAction)}
              onClick={() => {
                if (action.confirmation) {
                  setStatusConfirmation(action);
                  return;
                }
                executeStatusTransition(action.status);
              }}
            >
              {action.label}
            </Button>
          ))}
          {bill.balance_due > 0 && !bill.disputeFlag && (
            <Button
              variant="contained"
              color="success"
              startIcon={<Iconify icon="solar:card-send-bold" />}
              onClick={handleOpenPayDialog}
            >
              Pay Bill
            </Button>
          )}
          {bill.disputeFlag && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<Iconify icon="solar:shield-check-bold" />}
              onClick={handleResolveDispute}
            >
              Resolve Dispute
            </Button>
          )}
          <Dialog
            open={payDialogOpen}
            onClose={() => setPayDialogOpen(false)}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle>Register Payment</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                label="Payment amount"
                type="number"
                fullWidth
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                slotProps={{ htmlInput: { min: 0.01, max: bill.balance_due, step: 0.01 } }}
                helperText={`Balance due: ${formatCurrency(bill.balance_due)}`}
                sx={{ mt: 1 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPayDialogOpen(false)}>Cancel</Button>
              <Button variant="contained" color="success" onClick={handlePayBill}>
                Confirm Payment
              </Button>
            </DialogActions>
          </Dialog>
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
                    `${bill.number}-detail`,
                    buildTransactionCsvRows({
                      summary: [
                        { label: 'Total', value: formatCurrency(bill.total) },
                        { label: 'Paid', value: formatCurrency(bill.paid_amount) },
                        { label: 'Balance due', value: formatCurrency(bill.balance_due) },
                        { label: 'Approval route', value: bill.approvalRoute },
                      ],
                      sections: [
                        {
                          title: 'Bill Context',
                          items: billContextItems,
                        },
                      ],
                      tables: [
                        {
                          title: 'Bill Lines',
                          columns: [
                            { key: 'description', label: 'Description' },
                            { key: 'quantity', label: 'Qty' },
                            { key: 'unit_price', label: 'Rate' },
                            { key: 'amount', label: 'Amount' },
                            { key: 'matched', label: 'Matched' },
                          ],
                          rows: bill.lines.map((line) => ({
                            ...line,
                            matched: line.matched ? 'Yes' : 'No',
                          })),
                        },
                      ],
                      controlChecks,
                      referenceLinks,
                      timeline,
                      auditTrail: bill.chatter.map((item) => ({
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
                    `${bill.number}-detail`,
                    buildTransactionWorkbookData({
                      summary: [
                        { label: 'Total', value: formatCurrency(bill.total) },
                        { label: 'Paid', value: formatCurrency(bill.paid_amount) },
                        { label: 'Balance due', value: formatCurrency(bill.balance_due) },
                        { label: 'Approval route', value: bill.approvalRoute },
                      ],
                      sections: [
                        {
                          title: 'Bill Context',
                          items: billContextItems,
                        },
                      ],
                      tables: [
                        {
                          title: 'Bill Lines',
                          columns: [
                            { key: 'description', label: 'Description' },
                            { key: 'quantity', label: 'Qty' },
                            { key: 'unit_price', label: 'Rate' },
                            { key: 'amount', label: 'Amount' },
                            { key: 'matched', label: 'Matched' },
                          ],
                          rows: bill.lines.map((line) => ({
                            ...line,
                            matched: line.matched ? 'Yes' : 'No',
                          })),
                        },
                      ],
                      controlChecks,
                      referenceLinks,
                      timeline,
                      auditTrail: bill.chatter.map((item) => ({
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
                  exportJsonFile(bill.number, {
                    bill,
                    supplier,
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
          <Button
            variant={detailsOpen ? 'contained' : 'outlined'}
            color="inherit"
            size="small"
            startIcon={
              <Badge
                color="primary"
                badgeContent={linkedDetailCount}
                overlap="circular"
                sx={{ mr: linkedDetailCount ? 1 : 0 }}
              >
                <Iconify icon="solar:sidebar-minimal-bold" />
              </Badge>
            }
            onClick={() => setDetailsOpen((open) => !open)}
          >
            Details
          </Button>
          <Button variant="text" onClick={() => router.back()}>
            Back
          </Button>
        </Stack>
      </Stack>

      {bill.disputeFlag && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          This bill is blocked by an active dispute. Release should only happen after the quantity
          or service exception is closed.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Attached Files
                </Typography>
                <BillFilesCard invoiceFile={bill.invoiceFile} mushukFile={bill.mushukFile} />
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Supplier
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {supplier?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {supplier?.email}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1.25, display: 'block' }}
                    >
                      Supplier rating
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {supplier?.rating || 'n/a'}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1.25, display: 'block' }}
                    >
                      Approval route
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {bill.approvalRoute || 'Unassigned'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                    <Typography variant="caption" color="text.secondary">
                      Bill Date
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {new Date(bill.date).toLocaleDateString()}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1.25, display: 'block' }}
                    >
                      Due Date
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {new Date(bill.due_date).toLocaleDateString()}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1.25, display: 'block' }}
                    >
                      Payment Proposal
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {bill.paymentProposal}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1.25, display: 'block' }}
                    >
                      Supplier invoice ref
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {bill.supplierInvoiceRef || 'Not captured'}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1.25, display: 'block' }}
                    >
                      Goods receipt ref
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {bill.goodsReceiptRef || 'Awaiting receipt'}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Rate</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="center">Matched</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bill.lines.map((line, index) => (
                        <TableRow key={line.id || `${line.description}-${index}`}>
                          <TableCell>{line.description}</TableCell>
                          <TableCell align="right">{line.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(line.unit_price)}</TableCell>
                          <TableCell align="right">{formatCurrency(line.amount)}</TableCell>
                          <TableCell align="center">
                            {line.matched ? (
                              <Chip label="Matched" size="small" color="success" />
                            ) : (
                              <Chip
                                label="Pending"
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
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
                        <Typography variant="body2">{formatCurrency(bill.subtotal)}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">Tax</Typography>
                        <Typography variant="body2">{formatCurrency(bill.tax_amount)}</Typography>
                      </Stack>
                      <Divider />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle2" fontWeight={700}>
                          Total
                        </Typography>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {formatCurrency(bill.total)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="success.main">
                          Paid
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          {formatCurrency(bill.paid_amount)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle2" fontWeight={700} color="error">
                          Balance Due
                        </Typography>
                        <Typography variant="subtitle2" fontWeight={700} color="error">
                          {formatCurrency(bill.balance_due)}
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
                  Payables Chatter
                </Typography>
                {bill.chatter.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No notes or payment history yet.
                  </Typography>
                ) : (
                  <Stack spacing={1.25}>
                    {bill.chatter.map((item) => (
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
                )}
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
                        label={BILL_STATUS_LABELS[bill.status] || bill.status}
                        color={STATUS_COLORS[bill.status]}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Match status
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {bill.matchStatus}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Linked journals
                    </Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mt: 0.75 }}>
                      {bill.linkedJournals.map((journal) => (
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
                  Journal Entry Lines
                </Typography>
                {bill.attachments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No journal entries yet. Post the bill to see journal lines here.
                  </Typography>
                ) : (
                  <Stack spacing={1.25}>
                    {bill.attachments.map((item) => (
                      <Box
                        key={item.id}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'background.neutral',
                          border: '1px solid',
                          borderColor: item.debit > 0 ? 'success.light' : 'info.light',
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 0.5 }}
                        >
                          <Chip
                            label={item.type}
                            size="small"
                            color={item.debit > 0 ? 'success' : 'info'}
                            sx={{ height: 20, fontSize: 11 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {item.account_code}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight={600}>
                          {item.account_name || item.name}
                        </Typography>
                        {item.name && item.account_name !== item.name && (
                          <Typography variant="caption" color="text.secondary">
                            {item.name}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={2} sx={{ mt: 0.75 }}>
                          {item.debit > 0 && (
                            <Typography variant="caption" fontWeight={600} color="success.main">
                              DR {formatCurrency(item.debit)}
                            </Typography>
                          )}
                          {item.credit > 0 && (
                            <Typography variant="caption" fontWeight={600} color="info.main">
                              CR {formatCurrency(item.credit)}
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {printOpen && (
        <PdfPrintLayout title={`Vendor Bill — ${bill.number}`} onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}

      <Dialog open={Boolean(statusConfirmation)} onClose={() => setStatusConfirmation(null)}>
        <DialogTitle>
          {statusConfirmation?.confirmation === 'post'
            ? 'Confirm Post Bill'
            : 'Confirm Cancel Bill'}
        </DialogTitle>
        <DialogContent>
          {statusConfirmation?.confirmation === 'post'
            ? 'Posting this bill will create journal entries and cannot be undone.'
            : 'Cancelling this bill cannot be undone.'}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusConfirmation(null)}>Cancel</Button>
          <Button
            color={statusConfirmation?.confirmation === 'cancel' ? 'error' : 'primary'}
            variant="contained"
            onClick={() =>
              executeStatusTransition(statusConfirmation.status, statusConfirmation.confirmation)
            }
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

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
          <WorkOrderDetail
            workOrder={workOrderDetail}
            loading={workOrderDetailLoading && Boolean(bill?.work_order)}
          />
          <DetailSection title="Goods received notes" icon="solar:box-bold">
            <GrnDetail
              grns={grnDetails}
              loading={grnDetailsLoading && (bill?.grn_ids?.length || 0) > 0}
            />
          </DetailSection>
        </Box>
      </Drawer>
    </Box>
  );
}
