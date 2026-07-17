'use client';

import Chip from '@mui/material/Chip';

import { paths } from 'src/routes/paths';

import { formatCurrency } from '../utils';
import { MOCK_JOURNAL_ENTRIES } from './mock-data';
import TransactionDetailShell, {
  formatDetailDate,
  TransactionRecordNotFound,
} from './transaction-detail-shell';

function getLedgerLines(accountId) {
  return MOCK_JOURNAL_ENTRIES.flatMap((entry) =>
    (entry.lines || [])
      .filter((line) => String(line.account_code || line.account_id) === String(accountId))
      .map((line) => ({
        ...line,
        entryId: entry.id,
        entryNumber: entry.number,
        entryDate: entry.date,
        entryStatus: entry.status,
        entryReference: entry.reference,
        journalId: entry.journal_id,
        preparedBy: entry.preparedBy,
        reviewer: entry.reviewer,
      }))
  );
}

export default function GeneralLedgerAccountDetail({ accountId }) {
  const lines = getLedgerLines(accountId);
  const account = lines[0];

  if (!account) {
    return (
      <TransactionRecordNotFound
        title="General Ledger Account"
        backHref={paths.dashboard.accountingFinance.transactions.generalLedgerPosting}
      />
    );
  }

  let runningBalance = 0;
  const ledgerRows = lines.map((line) => {
    runningBalance += Number(line.debit || 0) - Number(line.credit || 0);
    return {
      date: formatDetailDate(line.entryDate),
      entry: line.entryNumber,
      reference: line.entryReference,
      description: line.description,
      debit: line.debit ? formatCurrency(line.debit) : '-',
      credit: line.credit ? formatCurrency(line.credit) : '-',
      balance: `${formatCurrency(Math.abs(runningBalance))} ${runningBalance < 0 ? 'Cr' : 'Dr'}`,
    };
  });

  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);

  return (
    <TransactionDetailShell
      title="General Ledger Account Detail"
      subtitle="Account-level posting history with running balance and journal references."
      documentNumber={`${account.account_code} - ${account.account_name}`}
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
        {
          label: 'Closing balance',
          value: `${formatCurrency(Math.abs(runningBalance))} ${runningBalance < 0 ? 'Cr' : 'Dr'}`,
          helper: `Total credit ${formatCurrency(totalCredit)}`,
        },
      ]}
      sections={[
        {
          title: 'Account Overview',
          items: [
            { label: 'Account code', value: account.account_code },
            { label: 'Account name', value: account.account_name },
            { label: 'Last prepared by', value: account.preparedBy },
            { label: 'Last reviewer', value: account.reviewer },
            { label: 'Analytic usage', value: account.analytic },
            { label: 'Tax code', value: account.taxCode },
          ],
        },
      ]}
      tables={[
        {
          title: 'Ledger Activity',
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'entry', label: 'Entry' },
            { key: 'reference', label: 'Reference' },
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
              meta: Array.from(new Set(lines.map((line) => line.entryStatus))).join(', '),
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
            Array.from(new Set(lines.map((line) => line.entryStatus))).length > 1
              ? 'warning'
              : 'success',
          value: Array.from(new Set(lines.map((line) => line.entryStatus))).join(', '),
        },
      ]}
      referenceLinks={Array.from(new Map(lines.map((line) => [line.entryId, line])))
        .values()
        .map((line) => ({
          label: line.entryNumber,
          description: 'Open source journal entry',
          href: paths.dashboard.accountingFinance.transactions.journalEntryDetail(line.entryId),
          icon: 'solar:document-text-bold',
        }))}
      timeline={[
        {
          label: 'Account drilldown loaded',
          description: `${lines.length} posting lines resolved for review`,
          status: account.account_code,
          tone: 'info',
          icon: 'solar:chart-bold',
        },
      ]}
      auditTrail={[
        {
          primary: 'Account drilldown',
          secondary: 'Ledger account selected from general posting view',
          meta: account.account_code,
        },
        {
          primary: 'Source dataset',
          secondary: 'Derived from journal entry lines in shared mock data',
          meta: 'Journal entries',
        },
      ]}
    />
  );
}
