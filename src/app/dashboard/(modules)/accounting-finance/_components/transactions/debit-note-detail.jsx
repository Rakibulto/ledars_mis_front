'use client';

import useSWR from 'swr';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Chip from '@mui/material/Chip';

import { paths } from 'src/routes/paths';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { formatCurrency } from '../utils';
import { getDebitNoteById } from './mock-data';
import { enrichDebitNote } from './use-debit-notes-api';
import TransactionDetailShell, {
  formatDetailDate,
  TransactionRecordNotFound,
} from './transaction-detail-shell';

const STATUS_COLORS = {
  draft: 'default',
  applied: 'success',
};

export default function DebitNoteDetail({ noteId }) {
  const isNumeric = !Number.isNaN(Number(noteId));
  const { data: rawNote } = useSWR(
    isNumeric ? endpoints.accounting.debit_note_by_id(noteId) : null,
    fetcher
  );
  const [note, setNote] = useState(isNumeric ? null : (getDebitNoteById(noteId) ?? null));
  const [supplier, setSupplier] = useState(null);
  const [linkedBill, setLinkedBill] = useState(null);
  useEffect(() => {
    if (rawNote) setNote(enrichDebitNote(rawNote));
  }, [rawNote]);

  useEffect(() => {
    let cancelled = false;

    async function loadSupplier() {
      if (!note?.supplier_id) {
        setSupplier(null);
        return;
      }

      try {
        const { data } = await axiosInstance.get(
          `${endpoints.procurement_management.vendors_management}${note.supplier_id}/`
        );
        if (!cancelled) setSupplier(data ?? null);
      } catch (error) {
        if (!cancelled) setSupplier(null);
      }
    }

    loadSupplier();
    return () => {
      cancelled = true;
    };
  }, [note?.supplier_id]);

  useEffect(() => {
    let cancelled = false;

    async function loadLinkedBill() {
      if (!note?.bill_ref) {
        setLinkedBill(null);
        return;
      }

      try {
        const { data } = await axiosInstance.get(
          `${endpoints.accounting.bills}?number=${note.bill_ref}`
        );
        const list = data?.results ?? data ?? [];
        const bill = Array.isArray(list) ? (list[0] ?? null) : (list ?? null);
        if (!cancelled) setLinkedBill(bill);
      } catch (error) {
        if (!cancelled) setLinkedBill(null);
      }
    }

    loadLinkedBill();
    return () => {
      cancelled = true;
    };
  }, [note?.bill_ref]);

  if (!note) {
    return (
      <TransactionRecordNotFound
        title="Debit Note"
        backHref={paths.dashboard.accountingFinance.transactions.debitNotes}
      />
    );
  }

  return (
    <TransactionDetailShell
      title="Debit Note Detail"
      subtitle="Supplier adjustment record for short delivery, rate correction, and bill application."
      documentNumber={note.number}
      backHref={paths.dashboard.accountingFinance.transactions.debitNotes}
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
          label: 'Apply adjustment',
          icon: 'solar:check-circle-bold',
          variant: 'contained',
          disabled: note.status === 'applied',
          onClick: async () => {
            try {
              const { data } = await axiosInstance.post(
                endpoints.accounting.debit_note_apply(noteId)
              );
              setNote(enrichDebitNote(data));
              toast.success('Debit note applied successfully');
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
      ]}
      summary={[
        { label: 'Adjustment amount', value: formatCurrency(note.amount) },
        { label: 'Supplier', value: supplier?.name },
        { label: 'Bill reference', value: note.bill_ref },
        { label: 'Adjustment type', value: note.adjustmentType },
      ]}
      sections={[
        {
          title: 'Debit Note Overview',
          items: [
            { label: 'Supplier', value: supplier?.name },
            { label: 'Debit note date', value: formatDetailDate(note.date) },
            { label: 'Adjustment type', value: note.adjustmentType },
            { label: 'Approval route', value: note.approvalRoute },
            { label: 'Dispute reference', value: note.disputeReference },
            { label: 'Reason', value: note.reason, fullWidth: true },
            { label: 'Internal notes', value: note.notes, fullWidth: true },
            { label: 'Supplier email', value: supplier?.email },
            { label: 'Supplier rating', value: supplier?.rating },
            { label: 'Application status', value: note.applicationStatus },
          ],
        },
      ]}
      tables={[
        {
          title: 'Linked Supplier Bill',
          columns: [
            { key: 'bill', label: 'Bill' },
            { key: 'status', label: 'Status' },
            { key: 'due', label: 'Due Date' },
            { key: 'balance', label: 'Balance Due', align: 'right' },
          ],
          rows: linkedBill
            ? [
                {
                  bill: linkedBill.number,
                  status: linkedBill.status,
                  due: formatDetailDate(linkedBill.due_date),
                  balance: formatCurrency(linkedBill.balance_due),
                },
              ]
            : [],
          emptyMessage: 'No supplier bill is linked to this debit note.',
        },
      ]}
      sidebar={[
        {
          title: 'Payables Control',
          items: [
            {
              primary: 'Application status',
              secondary: 'Adjustment offset state',
              meta: note.applicationStatus,
            },
            {
              primary: 'Dispute flag',
              secondary: 'Supplier profile review',
              meta: supplier?.disputeFlag ? 'Flagged' : 'Clear',
            },
            {
              primary: 'Approval route',
              secondary: 'Adjustment authorization chain',
              meta: note.approvalRoute,
            },
          ],
        },
      ]}
      controlChecks={[
        {
          label: 'Adjustment application',
          description: 'Debit note should be applied to the supplier balance',
          status: note.status === 'applied' ? 'success' : 'warning',
          value: note.applicationStatus,
        },
        {
          label: 'Supplier dispute check',
          description: 'Profile-level dispute indicator',
          status: supplier?.disputeFlag ? 'error' : 'success',
          value: supplier?.disputeFlag ? 'flagged' : 'clear',
        },
        {
          label: 'Reference support',
          description: 'Debit note should include approval and dispute references',
          status: note.approvalRoute && note.disputeReference ? 'success' : 'warning',
          value: note.disputeReference || 'pending',
        },
      ]}
      referenceLinks={
        linkedBill
          ? [
              {
                label: linkedBill.number,
                description: 'Open linked vendor bill',
                href: paths.dashboard.accountingFinance.transactions.billDetail(linkedBill.id),
                icon: 'solar:bill-list-bold',
              },
            ]
          : []
      }
      timeline={[
        {
          label: 'Debit note raised',
          description: note.reason,
          status: note.status,
          tone: note.status === 'applied' ? 'success' : 'warning',
          time: formatDetailDate(note.date),
          icon: 'solar:file-text-bold',
        },
      ]}
    />
  );
}
