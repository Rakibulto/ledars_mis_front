'use client';

import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';
import { useState, useEffect } from 'react';

import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { formatCurrency } from '../utils';
import { enrichReceipt } from './use-customer-receipts-api';
import { getInvoiceById, getReceiptById, getCustomerById } from './mock-data';
import { useTransactionStatusApi } from '../shared/use-transaction-status-api';
import { getStatusActionMeta, buildNextStatusTransitions } from '../shared/status-workflow';
import TransactionDetailShell, {
  formatDetailDate,
  TransactionRecordNotFound,
} from './transaction-detail-shell';

const STATUS_COLORS = {
  draft: 'default',
  posted: 'success',
};

const ALLOCATION_COLORS = {
  unallocated: 'error',
  partially_allocated: 'warning',
  fully_allocated: 'success',
};

export default function CustomerReceiptDetail({ receiptId }) {
  const detailUrl = endpoints.accounting.customer_receipt_by_id(receiptId);
  const isNumeric = !Number.isNaN(Number(receiptId));
  const { data: rawReceipt } = useSWR(isNumeric ? detailUrl : null, fetcher);
  const [receipt, setReceipt] = useState(isNumeric ? null : (getReceiptById(receiptId) ?? null));
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [allocationDraft, setAllocationDraft] = useState({
    invoice_number: '',
    amount: '',
    writeoffReason: 'Bank charge tolerance',
  });
  const { transitionStatus, loadingKey } = useTransactionStatusApi({
    statusEndpoint: (itemId) => `${endpoints.accounting.customer_receipt_by_id(itemId)}status/`,
    mutateKeys: [detailUrl, endpoints.accounting.customer_receipts],
  });
  useEffect(() => {
    if (rawReceipt) setReceipt(enrichReceipt(rawReceipt));
  }, [rawReceipt]);

  if (!receipt) {
    return (
      <TransactionRecordNotFound
        title="Customer Receipt"
        backHref={paths.dashboard.accountingFinance.transactions.customerReceipts}
      />
    );
  }

  const customer = getCustomerById(receipt.customer_id);
  const statusActions = buildNextStatusTransitions(receipt.status, [
    'draft',
    'posted',
    'pending',
  ]).map((nextStatus, index) => ({
    label: getStatusActionMeta(nextStatus).label,
    icon: getStatusActionMeta(nextStatus).icon,
    variant: index === 0 ? 'contained' : 'outlined',
    color: nextStatus === 'cancelled' ? 'error' : undefined,
    disabled: loadingKey === `${receiptId}:${nextStatus}`,
    onClick: async () => {
      try {
        await transitionStatus({ id: receiptId, status: nextStatus });
        toast.success(`Receipt status changed to ${getStatusActionMeta(nextStatus).label}`);
      } catch (error) {
        toast.error(error?.response?.data?.error || error?.message || 'Failed to update status');
      }
    },
  }));
  const allocationRows = receipt.allocations.map((allocation) => {
    const invoice = getInvoiceById(allocation.invoice_id);
    return {
      invoice: invoice?.number || allocation.invoice_number || allocation.invoice_id || '—',
      issueDate: formatDetailDate(invoice?.issue_date),
      total: formatCurrency(invoice?.total || 0),
      allocated: formatCurrency(allocation.amount),
    };
  });

  const openAllocationDialog = () => {
    setAllocationDraft({
      invoice_number: receipt.allocations[0]?.invoice_number || '',
      amount: receipt.unappliedAmount ? String(receipt.unappliedAmount) : '',
      writeoffReason: 'Bank charge tolerance',
    });
    setAllocationDialogOpen(true);
  };

  const handleAddAllocation = async () => {
    try {
      const { data } = await axiosInstance.post(
        endpoints.accounting.customer_receipt_allocate(receipt.id),
        {
          invoice_number: allocationDraft.invoice_number,
          amount: Number(allocationDraft.amount || receipt.unappliedAmount || 0),
        }
      );
      setReceipt(enrichReceipt(data));
      await mutate(detailUrl);
      toast.success('Allocation recorded successfully');
      setAllocationDialogOpen(false);
    } catch (error) {
      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.error ||
          error?.message ||
          'Allocation failed'
      );
    }
  };

  return (
    <>
      <TransactionDetailShell
        title="Customer Receipt Detail"
        subtitle="Allocation review for customer cash receipts, unapplied balances, and invoice matching."
        documentNumber={receipt.number}
        backHref={paths.dashboard.accountingFinance.transactions.customerReceipts}
        statusActions={statusActions}
        chips={[
          <Chip
            key="status"
            label={receipt.status}
            size="small"
            color={STATUS_COLORS[receipt.status]}
            sx={{ textTransform: 'capitalize' }}
          />,
          <Chip
            key="allocation"
            label={receipt.allocationStatus.replace(/_/g, ' ')}
            size="small"
            color={ALLOCATION_COLORS[receipt.allocationStatus]}
            sx={{ textTransform: 'capitalize' }}
          />,
        ]}
        actions={[
          {
            label: 'Add Allocation',
            icon: 'solar:check-circle-bold',
            variant: 'contained',
            disabled: receipt.unappliedAmount <= 0,
            onClick: openAllocationDialog,
          },
        ]}
        alerts={
          receipt.unappliedAmount > 0
            ? [
                {
                  severity: 'warning',
                  title: 'Unapplied cash remains',
                  description: `${formatCurrency(receipt.unappliedAmount)} still needs invoice matching.`,
                },
              ]
            : []
        }
        summary={[
          { label: 'Receipt amount', value: formatCurrency(receipt.amount) },
          { label: 'Unapplied balance', value: formatCurrency(receipt.unappliedAmount) },
          {
            label: 'Allocations',
            value: receipt.allocations.length,
            helper: 'Linked invoice applications',
          },
          { label: 'Collection owner', value: receipt.collectionOwner },
        ]}
        sections={[
          {
            title: 'Receipt Overview',
            items: [
              { label: 'Customer', value: customer?.name },
              { label: 'Receipt date', value: formatDetailDate(receipt.date) },
              { label: 'Payment method', value: receipt.method },
              { label: 'Bank account', value: receipt.bankAccount },
              { label: 'Reference', value: receipt.reference },
              { label: 'Collection owner', value: receipt.collectionOwner },
              { label: 'Remittance advice', value: receipt.remittanceAdvice },
              { label: 'Customer email', value: customer?.email },
            ],
          },
          {
            title: 'Collection Notes',
            items: [{ label: 'Receipt notes', value: receipt.notes, fullWidth: true }],
          },
        ]}
        tables={[
          {
            title: 'Allocation Breakdown',
            columns: [
              { key: 'invoice', label: 'Invoice' },
              { key: 'issueDate', label: 'Issue Date' },
              { key: 'total', label: 'Invoice Total', align: 'right' },
              { key: 'allocated', label: 'Allocated', align: 'right' },
            ],
            rows: allocationRows,
            emptyMessage: 'No allocations have been linked to this receipt yet.',
          },
        ]}
        sidebar={[
          {
            title: 'Collection Control',
            items: [
              { primary: 'Receipt status', secondary: 'Posting state', meta: receipt.status },
              {
                primary: 'Allocation status',
                secondary: 'Matching progress',
                meta: receipt.allocationStatus.replace(/_/g, ' '),
              },
              {
                primary: 'Customer rating',
                secondary: 'Receivables segment',
                meta: customer?.tier || 'Standard',
              },
              {
                primary: 'Collection owner',
                secondary: 'Cash application owner',
                meta: receipt.collectionOwner,
              },
            ],
          },
        ]}
        controlChecks={[
          {
            label: 'Allocation completeness',
            description: 'Receipt should be fully matched before close',
            status: receipt.unappliedAmount > 0 ? 'warning' : 'success',
            value: receipt.unappliedAmount > 0 ? 'open' : 'cleared',
          },
          {
            label: 'Customer collection risk',
            description: 'Receivables monitoring based on customer profile',
            status: customer?.risk === 'high' ? 'warning' : 'success',
            value: customer?.risk || 'normal',
          },
          {
            label: 'Remittance evidence',
            description: 'Receipt should carry remittance advice or collection note',
            status: receipt.remittanceAdvice || receipt.notes ? 'success' : 'warning',
            value: receipt.remittanceAdvice || 'pending',
          },
        ]}
        referenceLinks={
          allocationRows.length
            ? allocationRows.map((row, index) => ({
                label: row.invoice,
                description: 'Open linked customer invoice',
                href: paths.dashboard.accountingFinance.transactions.invoiceDetail(
                  receipt.allocations[index].invoice_id
                ),
                icon: 'solar:bill-list-bold',
              }))
            : []
        }
        timeline={[
          {
            label: 'Receipt captured',
            description: `Receipt logged through ${receipt.method}`,
            status: 'captured',
            tone: 'info',
            time: formatDetailDate(receipt.date),
            icon: 'solar:wallet-money-bold',
          },
          {
            label: 'Allocation review',
            description: receipt.notes,
            status: receipt.allocationStatus.replace(/_/g, ' '),
            tone: receipt.unappliedAmount > 0 ? 'warning' : 'success',
            icon: 'solar:checklist-bold',
          },
        ]}
      />

      <Dialog
        open={allocationDialogOpen}
        onClose={() => setAllocationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Allocation</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.25 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Match this receipt to an invoice and record the allocation against the unapplied
              balance.
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
                setAllocationDraft((current) => ({ ...current, amount: event.target.value }))
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
              <MenuItem value="Customer short-pay tolerance">Customer short-pay tolerance</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAllocationDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddAllocation}
            disabled={
              !allocationDraft.invoice_number.trim() || Number(allocationDraft.amount || 0) <= 0
            }
          >
            Save Allocation
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
