'use client';

import useSWR from 'swr';
import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { fetcher, endpoints } from 'src/utils/axios';

import { formatCurrency } from '../utils';
import { getJournalItemById } from './mock-data';
import TransactionDetailShell, {
  formatDetailDate,
  TransactionRecordNotFound,
} from './transaction-detail-shell';

const STATUS_COLORS = {
  draft: 'default',
  pending: 'warning',
  posted: 'success',
  reversed: 'error',
};

export default function JournalItemDetail({ itemId }) {
  const itemUrl = itemId ? endpoints.accounting.journal_item_by_id(itemId) : null;
  const { data: rawItem, isLoading } = useSWR(itemUrl, fetcher);

  // Mock fallback: remap mock item fields to match the API shape expected by normalization
  const mockRawItem = useMemo(() => {
    if (rawItem || isLoading) return null;
    const m = getJournalItemById(itemId);
    if (!m) return null;
    return {
      id: m.id,
      journal_entry: m.entry_id,
      entry_reference: m.entry_number,
      entry_date: m.entry_date,
      entry_status: m.entry_status,
      entry_narration: m.description || '',
      journal_id: m.entry_journal_id,
      journal_name: '',
      account_code: m.account_code || '',
      account: m.account_id || '',
      account_name: m.account_name || '',
      analytic_account_name: m.analytic || '',
      debit: m.debit || 0,
      credit: m.credit || 0,
      label: m.description || '',
    };
  }, [rawItem, isLoading, itemId]);

  const effectiveRawItem = rawItem || mockRawItem;

  // Always call this hook at the top level — pass null key when effectiveRawItem isn't ready yet
  const entryUrl = effectiveRawItem?.journal_entry
    ? endpoints.accounting.journal_entry_by_id(effectiveRawItem.journal_entry)
    : null;
  const { data: entryData } = useSWR(entryUrl, fetcher);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!effectiveRawItem) {
    return (
      <TransactionRecordNotFound
        title="Journal Item"
        backHref={paths.dashboard.accountingFinance.transactions.journalItems}
      />
    );
  }

  // Normalise item fields from the enriched JournalItemSerializer
  const item = {
    id: effectiveRawItem.id,
    entry_id: effectiveRawItem.journal_entry,
    entry_number: effectiveRawItem.entry_reference || `JE-${effectiveRawItem.journal_entry}`,
    entry_reference: effectiveRawItem.entry_reference || `JE-${effectiveRawItem.journal_entry}`,
    entry_date: effectiveRawItem.entry_date,
    entry_status: effectiveRawItem.entry_status || 'draft',
    entry_narration: effectiveRawItem.entry_narration || '',
    entry_journal_id: effectiveRawItem.journal_id,
    journal_name: effectiveRawItem.journal_name || 'Journal',
    account_code: effectiveRawItem.account_code || '',
    account_id: effectiveRawItem.account,
    account_name: effectiveRawItem.account_name || '',
    analytic: effectiveRawItem.analytic_account_name || '',
    taxCode: '',
    debit: Number(effectiveRawItem.debit || 0),
    credit: Number(effectiveRawItem.credit || 0),
    description: effectiveRawItem.label || effectiveRawItem.entry_narration || '',
    entry_prepared_by: entryData?.created_by_name || entryData?.created_by || 'System',
    entry_reviewer: 'Finance Manager',
    entry_approval_state: rawItem.entry_status === 'posted' ? 'Approved' : 'Pending',
  };

  const movement = item.debit - item.credit;

  return (
    <TransactionDetailShell
      title="Journal Item Detail"
      subtitle="Line-level accounting drilldown for a single posting item with source entry context."
      documentNumber={item.entry_number}
      backHref={paths.dashboard.accountingFinance.transactions.journalItems}
      chips={[
        <Chip
          key="status"
          label={item.entry_status}
          size="small"
          color={STATUS_COLORS[item.entry_status] || 'default'}
          sx={{ textTransform: 'capitalize' }}
        />,
        <Chip key="journal" label={item.journal_name} size="small" variant="outlined" />,
      ]}
      actions={[
        {
          label: 'View source entry',
          icon: 'solar:document-text-bold',
          href: paths.dashboard.accountingFinance.transactions.journalEntryDetail(item.entry_id),
        },
      ]}
      summary={[
        { label: 'Debit', value: item.debit ? formatCurrency(item.debit) : '-' },
        { label: 'Credit', value: item.credit ? formatCurrency(item.credit) : '-' },
        {
          label: 'Net movement',
          value: `${formatCurrency(Math.abs(movement))} ${movement < 0 ? 'Cr' : 'Dr'}`,
          helper: item.analytic || 'No analytic tag',
        },
      ]}
      sections={[
        {
          title: 'Item Overview',
          items: [
            { label: 'Posting date', value: formatDetailDate(item.entry_date) },
            { label: 'Entry reference', value: item.entry_reference },
            { label: 'Journal', value: item.journal_name },
            {
              label: 'Account',
              value: `${item.account_code || item.account_id} - ${item.account_name}`,
            },
            { label: 'Analytic tag', value: item.analytic },
            { label: 'Tax code', value: item.taxCode },
            { label: 'Description', value: item.description, fullWidth: true },
          ],
        },
      ]}
      sidebar={[
        {
          title: 'Source Control',
          items: [
            {
              primary: 'Prepared by',
              secondary: 'Original source entry owner',
              meta: item.entry_prepared_by,
            },
            { primary: 'Reviewer', secondary: 'Source entry reviewer', meta: item.entry_reviewer },
            {
              primary: 'Approval state',
              secondary: 'Source entry approval status',
              meta: item.entry_approval_state,
            },
          ],
        },
      ]}
      controlChecks={[
        {
          label: 'Source entry status',
          description: 'Parent journal posting state',
          status:
            item.entry_status === 'posted'
              ? 'success'
              : item.entry_status === 'reversed'
                ? 'error'
                : 'warning',
          value: item.entry_status,
        },
        {
          label: 'Line classification',
          description: 'Account, analytic, and tax metadata present for the item',
          status: item.analytic && item.taxCode ? 'success' : 'warning',
          value: item.account_code || item.account_id,
        },
      ]}
      referenceLinks={[
        {
          label: item.entry_number,
          description: 'Open source journal entry',
          href: paths.dashboard.accountingFinance.transactions.journalEntryDetail(item.entry_id),
          icon: 'solar:document-text-bold',
        },
        {
          label: item.journal_name,
          description: 'Return to journal item register',
          href: paths.dashboard.accountingFinance.transactions.journalItems,
          icon: 'solar:list-bold',
        },
      ]}
      timeline={[
        {
          label: 'Journal item created',
          description: item.description,
          status: item.entry_reference,
          tone: 'info',
          time: formatDetailDate(item.entry_date),
          icon: 'solar:document-text-bold',
        },
        {
          label: 'Source approval',
          description: `Prepared by ${item.entry_prepared_by || 'system flow'}`,
          status: item.entry_approval_state,
          tone: item.entry_status === 'posted' ? 'success' : 'warning',
          icon: 'solar:shield-check-bold',
        },
      ]}
      auditTrail={[
        {
          primary: 'Item drilldown',
          secondary: 'Selected from the journal item listing',
          meta: item.id,
        },
        {
          primary: 'Source entry',
          secondary: 'Parent journal entry record',
          meta: item.entry_number,
        },
      ]}
    />
  );
}
