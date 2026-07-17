'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';

import Chip from '@mui/material/Chip';

import { paths } from 'src/routes/paths';

import { fetcher, endpoints } from 'src/utils/axios';

import { formatCurrency } from '../utils';
import TransactionDetailShell, {
  TransactionRecordNotFound,
} from './transaction-detail-shell';

export default function GeneralLedgerAccountDetail({ accountId }) {
  const { data: rawItems, isLoading } = useSWR(
    accountId ? `${endpoints.accounting.journal_items}?account_code=${accountId}` : null,
    fetcher
  );

  const lines = useMemo(() => {
    const list = Array.isArray(rawItems)
      ? rawItems
      : Array.isArray(rawItems?.results)
        ? rawItems.results
        : [];
    // Sort by date ascending for running balance
    return [...list].sort((a, b) => (a.entry_date || '').localeCompare(b.entry_date || ''));
  }, [rawItems]);

  if (!isLoading && lines.length === 0) {
    return (
      <TransactionRecordNotFound
        title="General Ledger Account"
        backHref={paths.dashboard.accountingFinance.transactions.generalLedgerPosting}
      />
    );
  }

  if (isLoading) {
    return (
      <TransactionRecordNotFound
        title="General Ledger Account"
        backHref={paths.dashboard.accountingFinance.transactions.generalLedgerPosting}
      />
    );
  }

  const accountInfo = lines[0];
  const accountCode = accountInfo?.account_code || accountId;
  const accountName = accountInfo?.account_name || '';

  let runningBalance = 0;
  const ledgerRows = lines.map((line) => {
    runningBalance += Number(line.debit || 0) - Number(line.credit || 0);
    return {
      date: line.entry_date || '-',
      entry: line.entry_reference || '-',
      journal: line.journal_name || '-',
      description: line.label || '-',
      debit: line.debit ? formatCurrency(line.debit) : '-',
      credit: line.credit ? formatCurrency(line.credit) : '-',
      balance: `${formatCurrency(Math.abs(runningBalance))} ${runningBalance < 0 ? 'Cr' : 'Dr'}`,
    };
  });

  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);

  // Build unique journal entry references for the sidebar links
  const uniqueEntries = [];
  const seenEntries = new Set();
  lines.forEach((line) => {
    if (line.journal_entry && !seenEntries.has(line.journal_entry)) {
      seenEntries.add(line.journal_entry);
      uniqueEntries.push({
        id: line.journal_entry,
        reference: line.entry_reference || `JE-${line.journal_entry}`,
      });
    }
  });

  return (
    <TransactionDetailShell
      title="General Ledger Account Detail"
      subtitle="Account-level posting history with running balance and journal references."
      documentNumber={`${accountCode} - ${accountName}`}
      backHref={paths.dashboard.accountingFinance.transactions.generalLedgerPosting}
      chips={[<Chip key="account" label="Ledger account" size="small" variant="outlined" />]}
      actions={[
        {
          label: 'Back to ledger',
          icon: 'solar:list-arrow-left-bold',
          href: paths.dashboard.accountingFinance.transactions.generalLedgerPosting,
        },
      ]}
      summary={[
        { label: 'Posting lines', value: lines.length },
        { label: 'Total debit', value: formatCurrency(totalDebit) },
        { label: 'Total credit', value: formatCurrency(totalCredit) },
        {
          label: 'Closing balance',
          value: `${formatCurrency(Math.abs(runningBalance))} ${runningBalance < 0 ? 'Cr' : 'Dr'}`,
        },
      ]}
      sections={[
        {
          title: 'Account Overview',
          items: [
            { label: 'Account code', value: accountCode },
            { label: 'Account name', value: accountName },
          ],
        },
      ]}
      tables={[
        {
          title: 'Ledger Activity',
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'entry', label: 'Entry' },
            { key: 'journal', label: 'Journal' },
            { key: 'description', label: 'Description' },
            { key: 'debit', label: 'Debit', align: 'right' },
            { key: 'credit', label: 'Credit', align: 'right' },
            { key: 'balance', label: 'Balance', align: 'right' },
          ],
          rows: ledgerRows,
        },
      ]}
      sidebar={[
        {
          title: 'Posting Control',
          items: [
            {
              primary: 'Journal references',
              secondary: 'Entries touching this account',
              meta: lines.length,
            },
            {
              primary: 'Posting statuses',
              secondary: 'Unique states across the visible ledger lines',
              meta: Array.from(new Set(lines.map((line) => line.entry_status))).join(', '),
            },
          ],
        },
      ]}
      controlChecks={[
        {
          label: 'Ledger balance continuity',
          description: 'Running balance across visible postings',
          status: 'success',
          value: `${formatCurrency(Math.abs(runningBalance))} ${runningBalance < 0 ? 'Cr' : 'Dr'}`,
        },
        {
          label: 'Posting mix',
          description: 'Distinct posting states in the selected account activity',
          status:
            Array.from(new Set(lines.map((line) => line.entry_status))).length > 1
              ? 'warning'
              : 'success',
          value: Array.from(new Set(lines.map((line) => line.entry_status))).join(', '),
        },
      ]}
      referenceLinks={uniqueEntries.map((entry) => ({
        label: entry.reference,
        description: 'Open source journal entry',
        href: paths.dashboard.accountingFinance.transactions.journalEntryDetail(entry.id),
        icon: 'solar:document-text-bold',
      }))}
      timeline={[
        {
          label: 'Account drilldown loaded',
          description: `${lines.length} posting lines resolved for review`,
          status: accountCode,
          tone: 'info',
          icon: 'solar:chart-bold',
        },
      ]}
      auditTrail={[
        {
          primary: 'Account drilldown',
          secondary: 'Ledger account selected from general posting view',
          meta: accountCode,
        },
      ]}
    />
  );
}
