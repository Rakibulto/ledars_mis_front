'use client';

import useSWR from 'swr';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { formatCurrency } from '../utils';
import { enrichCreditNote } from './use-credit-notes-api';
import { getCustomerById, getCreditNoteById, getInvoiceByNumber } from './mock-data';
import TransactionDetailShell, {
  formatDetailDate,
  TransactionRecordNotFound,
} from './transaction-detail-shell';

const STATUS_COLORS = {
  draft: 'default',
  applied: 'success',
  cancelled: 'error',
};

export default function CreditNoteDetail({ noteId }) {
  const isNumeric = !Number.isNaN(Number(noteId));
  const { data: rawNote } = useSWR(
    isNumeric ? endpoints.accounting.credit_note_by_id(noteId) : null,
    fetcher
  );
  const [note, setNote] = useState(isNumeric ? null : (getCreditNoteById(noteId) ?? null));
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  useEffect(() => {
    if (rawNote) setNote(enrichCreditNote(rawNote));
  }, [rawNote]);

  if (!note) {
    return (
      <TransactionRecordNotFound
        title="Credit Note"
        backHref={paths.dashboard.accountingFinance.transactions.creditNotes}
      />
    );
  }

  const customer = getCustomerById(note.customer_id);
  const invoice = getInvoiceByNumber(note.invoice_ref);

  return (
    <>
      <TransactionDetailShell
        title="Credit Note Detail"
        subtitle="Receivable adjustment record for rebates, reversals, and customer balance corrections."
        documentNumber={note.number}
        backHref={paths.dashboard.accountingFinance.transactions.creditNotes}
        chips={[
          <Chip
            key="status"
            label={note.status}
            size="small"
            color={STATUS_COLORS[note.status]}
            sx={{ textTransform: 'capitalize' }}
          />,
          <Chip
            key="apply"
            label={note.applicationStatus}
            size="small"
            variant="outlined"
            sx={{ textTransform: 'capitalize' }}
          />,
        ]}
        actions={[
          {
            label: 'Apply credit note',
            icon: 'solar:check-circle-bold',
            variant: 'contained',
            disabled: note.status === 'applied' || note.status === 'cancelled',
            onClick: async () => {
              try {
                const { data } = await axiosInstance.post(
                  endpoints.accounting.credit_note_apply(noteId)
                );
                setNote(enrichCreditNote(data));
                toast.success('Credit note applied successfully');
              } catch (error) {
                toast.error(
                  error?.response?.data?.error ||
                    error?.response?.data?.detail ||
                    error?.message ||
                    'Action failed'
                );
              }
            },
          },
          {
            label: 'Cancel credit note',
            icon: 'solar:close-circle-bold',
            variant: 'outlined',
            color: 'error',
            disabled: note.status === 'cancelled' || note.status === 'applied',
            onClick: () => setCancelConfirmOpen(true),
          },
        ]}
        summary={[
          { label: 'Credit amount', value: formatCurrency(note.amount) },
          { label: 'Customer', value: customer?.name },
          { label: 'Invoice reference', value: note.invoice_ref },
          { label: 'Adjustment type', value: note.adjustmentType },
        ]}
        sections={[
          {
            title: 'Credit Note Overview',
            items: [
              { label: 'Customer', value: customer?.name },
              { label: 'Credit note date', value: formatDetailDate(note.date) },
              { label: 'Adjustment type', value: note.adjustmentType },
              { label: 'Approval route', value: note.approvalRoute },
              { label: 'Refund reference', value: note.refundReference },
              { label: 'Reason', value: note.reason, fullWidth: true },
              { label: 'Internal notes', value: note.notes, fullWidth: true },
              { label: 'Customer email', value: customer?.email },
              { label: 'Collection risk', value: customer?.risk },
              { label: 'Application status', value: note.applicationStatus },
            ],
          },
        ]}
        tables={[
          {
            title: 'Linked Customer Invoice',
            columns: [
              { key: 'invoice', label: 'Invoice' },
              { key: 'status', label: 'Status' },
              { key: 'due', label: 'Due Date' },
              { key: 'balance', label: 'Balance Due', align: 'right' },
            ],
            rows: invoice
              ? [
                  {
                    invoice: invoice.number,
                    status: invoice.status,
                    due: formatDetailDate(invoice.due_date),
                    balance: formatCurrency(invoice.balance_due),
                  },
                ]
              : [],
            emptyMessage: 'No customer invoice is linked to this credit note.',
          },
        ]}
        sidebar={[
          {
            title: 'Receivables Control',
            items: [
              {
                primary: 'Application status',
                secondary: 'Adjustment offset state',
                meta: note.applicationStatus,
              },
              { primary: 'Customer tier', secondary: 'Receivables profile', meta: customer?.tier },
              {
                primary: 'Approval route',
                secondary: 'Customer credit authorization',
                meta: note.approvalRoute,
              },
            ],
          },
        ]}
        controlChecks={[
          {
            label: 'Credit application',
            description: 'Credit note should offset receivable exposure',
            status: note.status === 'applied' ? 'success' : 'warning',
            value: note.applicationStatus,
          },
          {
            label: 'Customer risk review',
            description: 'Collection risk from customer master data',
            status: customer?.risk === 'high' ? 'warning' : 'success',
            value: customer?.risk || 'normal',
          },
          {
            label: 'Adjustment reference',
            description: 'Credit note should carry approval and refund trace',
            status: note.approvalRoute && note.refundReference ? 'success' : 'warning',
            value: note.refundReference || 'pending',
          },
        ]}
        referenceLinks={
          invoice
            ? [
                {
                  label: invoice.number,
                  description: 'Open linked customer invoice',
                  href: paths.dashboard.accountingFinance.transactions.invoiceDetail(invoice.id),
                  icon: 'solar:bill-list-bold',
                },
              ]
            : []
        }
        timeline={[
          {
            label: 'Credit note issued',
            description: note.reason,
            status: note.status,
            tone: note.status === 'applied' ? 'success' : 'warning',
            time: formatDetailDate(note.date),
            icon: 'solar:archive-down-bold',
          },
        ]}
      />
      <Dialog open={cancelConfirmOpen} onClose={() => setCancelConfirmOpen(false)}>
        <DialogTitle>Cancel Credit Note</DialogTitle>
        <DialogContent>
          Are you sure you want to cancel this credit note? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelConfirmOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              try {
                const { data } = await axiosInstance.patch(
                  endpoints.accounting.credit_note_by_id(noteId),
                  { status: 'cancelled' }
                );
                setNote(enrichCreditNote(data));
                toast.success('Credit note cancelled');
              } catch (error) {
                toast.error(
                  error?.response?.data?.error ||
                    error?.response?.data?.detail ||
                    error?.message ||
                    'Action failed'
                );
              } finally {
                setCancelConfirmOpen(false);
              }
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
