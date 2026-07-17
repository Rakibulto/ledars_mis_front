'use client';

import { useMemo } from 'react';
import useSWR from 'swr';

import Chip from '@mui/material/Chip';

import { paths } from 'src/routes/paths';

import { fetcher, endpoints } from 'src/utils/axios';

import { formatCurrency } from '../utils';
import TransactionDetailShell, {
  TransactionRecordNotFound,
} from './transaction-detail-shell';

export default function GeneralLedgerItemDetail({ itemId }) {
  const { data: rawItem, isLoading } = useSWR(
    itemId ? `${endpoints.accounting.journal_items}${itemId}/` : null,
    fetcher
  );

  if (isLoading) {
    return (
      <TransactionRecordNotFound
        title="Journal Item Detail"
        backHref={paths.dashboard.accountingFinance.transactions.generalLedgerPosting}
      />
    );
  }

  if (!rawItem) {
    return (
      <TransactionRecordNotFound
        title="Journal Item Detail"
        backHref={paths.dashboard.accountingFinance.transactions.generalLedgerPosting}
      />
    );
  }

  const item = rawItem;
  const accountCode = item.account_code || '';
  const accountName = item.account_name || '';
  const entryRef = item.entry_reference || `JE-${item.journal_entry}`;
  const entryDate = item.entry_date || '-';
  const entryStatus = item.entry_status || '-';
  const journalName = item.journal_name || '-';
  const description = item.label || '-';
  const debit = Number(item.debit) || 0;
  const credit = Number(item.credit) || 0;
  const balance = debit - credit;

  return (
    <TransactionDetailShell
      title="Journal Item Detail"
      subtitle="Detailed view of a single journal entry line with account and entry references."
      documentNumber={`${entryRef} — ${accountCode}`}
      backHref={paths.dashboard.accountingFinance.transactions.generalLedgerPosting}
      chips={[
        <Chip key="item" label="Journal item" size="small" variant="outlined" />,
        <Chip
          key="status"
          label={entryStatus}
          size="small"
          color={entryStatus === 'posted' ? 'success' : entryStatus === 'draft' ? 'default' : 'warning'}
        />,
      ]}
      actions={[
        {
          label: 'Back to ledger',
          icon: 'solar:list-arrow-left-bold',
          href: paths.dashboard.accountingFinance.transactions.generalLedgerPosting,
        },
        {
          label: 'View account',
          icon: 'solar:chart-bold',
          href: paths.dashboard.accountingFinance.transactions.generalLedgerPostingDetail(accountCode),
        },
        {
          label: 'View journal entry',
          icon: 'solar:document-text-bold',
          href: paths.dashboard.accountingFinance.transactions.journalEntryDetail(item.journal_entry),
        },
      ]}
      summary={[
        { label: 'Debit', value: debit > 0 ? formatCurrency(debit) : '-' },
        { label: 'Credit', value: credit > 0 ? formatCurrency(credit) : '-' },
        {
          label: 'Balance impact',
          value: `${formatCurrency(Math.abs(balance))} ${balance < 0 ? 'Cr' : 'Dr'}`,
        },
      ]}
      sections={[
        {
          title: 'Journal Item Details',
          items: [
            { label: 'Item ID', value: item.id },
            { label: 'Description', value: description },
            { label: 'Account code', value: accountCode },
            { label: 'Account name', value: accountName },
            { label: 'Debit amount', value: debit > 0 ? formatCurrency(debit) : '-' },
            { label: 'Credit amount', value: credit > 0 ? formatCurrency(credit) : '-' },
            { label: 'Analytic account', value: item.analytic_account_name || '-' },
            { label: 'Cost center', value: item.cost_center_name || '-' },
          ],
        },
        {
          title: 'Journal Entry Reference',
          items: [
            { label: 'Entry reference', value: entryRef },
            { label: 'Entry date', value: entryDate },
            { label: 'Entry status', value: entryStatus },
            { label: 'Entry narration', value: item.entry_narration || '-' },
            { label: 'Journal', value: journalName },
          ],
        },
      ]}
      tables={[]}
      sidebar={[
        {
          title: 'Item Classification',
          items: [
            {
              primary: 'Side',
              secondary: debit > 0 ? 'Debit entry' : 'Credit entry',
              meta: debit > 0 ? formatCurrency(debit) : formatCurrency(credit),
            },
            {
              primary: 'Account type',
              secondary: accountName,
              meta: accountCode,
            },
          ],
        },
      ]}
      controlChecks={[
        {
          label: 'Posting integrity',
          description: 'This item is part of a balanced journal entry',
          status: entryStatus === 'posted' ? 'success' : 'warning',
          value: entryStatus,
        },
      ]}
      referenceLinks={[
        {
          label: entryRef,
          description: 'Open source journal entry',
          href: paths.dashboard.accountingFinance.transactions.journalEntryDetail(item.journal_entry),
          icon: 'solar:document-text-bold',
        },
        {
          label: `${accountCode} - ${accountName}`,
          description: 'View all postings for this account',
          href: paths.dashboard.accountingFinance.transactions.generalLedgerPostingDetail(accountCode),
          icon: 'solar:chart-bold',
        },
      ]}
      timeline={[
        {
          label: 'Item posted',
          description: description,
          status: entryStatus,
          tone: entryStatus === 'posted' ? 'success' : 'info',
          time: entryDate,
          icon: 'solar:book-bold',
        },
      ]}
      auditTrail={[
        {
          primary: 'Journal item detail',
          secondary: `Item #${item.id} from ${entryRef}`,
          meta: accountCode,
        },
      ]}
    />
  );
}
