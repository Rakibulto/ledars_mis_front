'use client';

import useSWR from 'swr';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Chip from '@mui/material/Chip';

import { paths } from 'src/routes/paths';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { formatCurrency } from '../utils';
import { getPayrollEntryById } from './mock-data';
import { enrichPayrollEntry } from './use-workspace-payroll-api';
import TransactionDetailShell, {
  formatDetailDate,
  TransactionRecordNotFound,
} from './transaction-detail-shell';

const STATUS_COLORS = {
  draft: 'default',
  posted: 'success',
};

export default function PayrollEntryDetail({ entryId }) {
  const isNumeric = !Number.isNaN(Number(entryId));
  const { data: rawEntry } = useSWR(
    isNumeric ? endpoints.accounting.workspace_payroll_entry_by_id(entryId) : null,
    fetcher
  );
  const [entry, setEntry] = useState(isNumeric ? null : (getPayrollEntryById(entryId) ?? null));
  useEffect(() => {
    if (rawEntry) setEntry(enrichPayrollEntry(rawEntry));
  }, [rawEntry]);

  if (!entry) {
    return (
      <TransactionRecordNotFound
        title="Payroll Entry"
        backHref={paths.dashboard.accountingFinance.transactions.payrollEntries}
      />
    );
  }

  return (
    <TransactionDetailShell
      title="Payroll Entry Detail"
      subtitle="Batch payroll journal review for salary accrual, net pay, and statutory liabilities."
      documentNumber={entry.number}
      backHref={paths.dashboard.accountingFinance.transactions.payrollEntries}
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
          label: 'Post payroll batch',
          icon: 'solar:document-add-bold',
          variant: 'contained',
          disabled: entry.status === 'posted',
          onClick: async () => {
            try {
              const { data } = await axiosInstance.post(
                endpoints.accounting.workspace_payroll_entry_post(entryId)
              );
              setEntry(enrichPayrollEntry(data));
              toast.success('Payroll entry posted successfully');
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
        { label: 'Gross payroll', value: formatCurrency(entry.grossAmount) },
        { label: 'Net payroll', value: formatCurrency(entry.netAmount) },
        { label: 'Liability amount', value: formatCurrency(entry.liabilityAmount) },
        { label: 'Funding source', value: entry.fundingSource },
      ]}
      sections={[
        {
          title: 'Payroll Batch Overview',
          items: [
            { label: 'Payroll cycle', value: entry.payrollCycle },
            { label: 'Posting date', value: formatDetailDate(entry.date) },
            { label: 'Period start', value: formatDetailDate(entry.periodStart) },
            { label: 'Period end', value: formatDetailDate(entry.periodEnd) },
            { label: 'Employees', value: entry.employeeCount },
            { label: 'Approval route', value: entry.approvalRoute },
            { label: 'Funding source', value: entry.fundingSource },
            { label: 'Description', value: entry.description, fullWidth: true },
          ],
        },
      ]}
      sidebar={[
        {
          title: 'Payroll Control',
          items: [
            {
              primary: 'Posting state',
              secondary: 'Payroll journal release state',
              meta: entry.status,
            },
            {
              primary: 'Employee coverage',
              secondary: 'People included in this batch',
              meta: entry.employeeCount,
            },
            {
              primary: 'Approval route',
              secondary: 'Payroll authorization workflow',
              meta: entry.approvalRoute,
            },
          ],
        },
      ]}
      controlChecks={[
        {
          label: 'Batch posting',
          description: 'Payroll journal should be posted before period close',
          status: entry.status === 'posted' ? 'success' : 'warning',
          value: entry.status,
        },
        {
          label: 'Liability coverage',
          description: 'Gross less net should reconcile to liability amount',
          status:
            entry.grossAmount - entry.netAmount === entry.liabilityAmount ? 'success' : 'error',
          value: formatCurrency(entry.liabilityAmount),
        },
        {
          label: 'Funding attribution',
          description: 'Payroll batch should carry a source or fund mapping',
          status: entry.fundingSource ? 'success' : 'warning',
          value: entry.fundingSource || 'pending',
        },
      ]}
      timeline={[
        {
          label: 'Payroll batch prepared',
          description: entry.description,
          status: entry.payrollCycle,
          tone: 'info',
          time: formatDetailDate(entry.date),
          icon: 'solar:users-group-two-rounded-bold',
        },
      ]}
    />
  );
}
