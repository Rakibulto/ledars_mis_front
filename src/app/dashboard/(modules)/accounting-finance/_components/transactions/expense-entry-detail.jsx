'use client';

import useSWR from 'swr';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Chip from '@mui/material/Chip';

import { paths } from 'src/routes/paths';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { formatCurrency } from '../utils';
import { getExpenseEntryById } from './mock-data';
import { enrichExpenseEntry } from './use-workspace-expense-api';
import TransactionDetailShell, {
  formatDetailDate,
  TransactionRecordNotFound,
} from './transaction-detail-shell';

const STATUS_COLORS = {
  submitted: 'warning',
  posted: 'success',
};

export default function ExpenseEntryDetail({ entryId }) {
  const isNumeric = !Number.isNaN(Number(entryId));
  const { data: rawEntry } = useSWR(
    isNumeric ? endpoints.accounting.workspace_expense_entry_by_id(entryId) : null,
    fetcher
  );
  const [entry, setEntry] = useState(isNumeric ? null : (getExpenseEntryById(entryId) ?? null));
  useEffect(() => {
    if (rawEntry) setEntry(enrichExpenseEntry(rawEntry));
  }, [rawEntry]);

  if (!entry) {
    return (
      <TransactionRecordNotFound
        title="Expense Entry"
        backHref={paths.dashboard.accountingFinance.transactions.expenseEntries}
      />
    );
  }

  return (
    <TransactionDetailShell
      title="Expense Entry Detail"
      subtitle="Operational expense batch review for submission control and posting readiness."
      documentNumber={entry.number}
      backHref={paths.dashboard.accountingFinance.transactions.expenseEntries}
      chips={[
        <Chip
          key="status"
          label={entry.status}
          size="small"
          color={STATUS_COLORS[entry.status]}
          sx={{ textTransform: 'capitalize' }}
        />,
      ]}
      actions={[
        {
          label: 'Post expense entry',
          icon: 'solar:wallet-money-bold',
          variant: 'contained',
          disabled: entry.status === 'posted',
          onClick: async () => {
            try {
              const { data } = await axiosInstance.post(
                endpoints.accounting.workspace_expense_entry_post(entryId)
              );
              setEntry(enrichExpenseEntry(data));
              toast.success('Expense entry posted successfully');
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
        { label: 'Expense amount', value: formatCurrency(entry.amount) },
        { label: 'Category', value: entry.category },
        { label: 'Submitted by', value: entry.employee },
        { label: 'Cost center', value: entry.costCenter },
      ]}
      sections={[
        {
          title: 'Expense Overview',
          items: [
            { label: 'Entry date', value: formatDetailDate(entry.date) },
            { label: 'Category', value: entry.category },
            { label: 'Submitted by', value: entry.employee },
            { label: 'Cost center', value: entry.costCenter },
            { label: 'Approval route', value: entry.approvalRoute },
            { label: 'Reference', value: entry.reference },
            { label: 'Description', value: entry.description, fullWidth: true },
          ],
        },
      ]}
      sidebar={[
        {
          title: 'Expense Control',
          items: [
            {
              primary: 'Posting state',
              secondary: 'Operational expense journal status',
              meta: entry.status,
            },
            {
              primary: 'Submitting team',
              secondary: 'Originating unit or employee group',
              meta: entry.employee,
            },
            {
              primary: 'Approval route',
              secondary: 'Review path before posting',
              meta: entry.approvalRoute,
            },
          ],
        },
      ]}
      controlChecks={[
        {
          label: 'Expense posting',
          description: 'Submitted batch should be posted through expense journal',
          status: entry.status === 'posted' ? 'success' : 'warning',
          value: entry.status,
        },
        {
          label: 'Category attribution',
          description: 'Expense record tagged to correct operational category',
          status: entry.category ? 'success' : 'error',
          value: entry.category || 'missing',
        },
        {
          label: 'Cost center tagging',
          description: 'Operational expense should map to a reporting segment',
          status: entry.costCenter ? 'success' : 'warning',
          value: entry.costCenter || 'pending',
        },
      ]}
      timeline={[
        {
          label: 'Expense submitted',
          description: entry.description,
          status: entry.employee,
          tone: 'info',
          time: formatDetailDate(entry.date),
          icon: 'solar:wallet-money-bold',
        },
      ]}
    />
  );
}
