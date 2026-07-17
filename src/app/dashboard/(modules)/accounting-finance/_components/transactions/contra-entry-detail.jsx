'use client';

import useSWR from 'swr';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Chip from '@mui/material/Chip';

import { paths } from 'src/routes/paths';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { formatCurrency } from '../utils';
import { getContraEntryById } from './mock-data';
import { enrichContraEntry } from './use-workspace-contra-api';
import TransactionDetailShell, {
  formatDetailDate,
  TransactionRecordNotFound,
} from './transaction-detail-shell';

const STATUS_COLORS = {
  draft: 'default',
  posted: 'success',
};

export default function ContraEntryDetail({ entryId }) {
  const isNumeric = !Number.isNaN(Number(entryId));
  const { data: rawEntry } = useSWR(
    isNumeric ? endpoints.accounting.workspace_contra_entry_by_id(entryId) : null,
    fetcher
  );
  const [entry, setEntry] = useState(isNumeric ? null : (getContraEntryById(entryId) ?? null));
  useEffect(() => {
    if (rawEntry) setEntry(enrichContraEntry(rawEntry));
  }, [rawEntry]);

  if (!entry) {
    return (
      <TransactionRecordNotFound
        title="Contra Entry"
        backHref={paths.dashboard.accountingFinance.transactions.contraEntries}
      />
    );
  }

  return (
    <TransactionDetailShell
      title="Contra Entry Detail"
      subtitle="Internal transfer control between bank and cash holding accounts."
      documentNumber={entry.number}
      backHref={paths.dashboard.accountingFinance.transactions.contraEntries}
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
          label: 'Post transfer',
          icon: 'solar:transfer-horizontal-bold',
          variant: 'contained',
          disabled: entry.status === 'posted',
          onClick: async () => {
            try {
              const { data } = await axiosInstance.post(
                endpoints.accounting.workspace_contra_entry_post(entryId)
              );
              setEntry(enrichContraEntry(data));
              toast.success('Contra entry posted successfully');
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
        { label: 'Transfer amount', value: formatCurrency(entry.amount) },
        { label: 'From account', value: entry.fromAccount },
        { label: 'To account', value: entry.toAccount },
        { label: 'Transfer channel', value: entry.transferChannel },
      ]}
      sections={[
        {
          title: 'Transfer Overview',
          items: [
            { label: 'Transfer date', value: formatDetailDate(entry.date) },
            { label: 'From account', value: entry.fromAccount },
            { label: 'To account', value: entry.toAccount },
            { label: 'Transfer channel', value: entry.transferChannel },
            { label: 'Treasury owner', value: entry.treasuryOwner },
            { label: 'Reference', value: entry.reference },
            { label: 'Description', value: entry.description, fullWidth: true },
          ],
        },
      ]}
      sidebar={[
        {
          title: 'Treasury Control',
          items: [
            {
              primary: 'Posting state',
              secondary: 'Internal transfer journal status',
              meta: entry.status,
            },
            {
              primary: 'Transfer pair',
              secondary: 'Source and destination accounts',
              meta: `${entry.fromAccount} -> ${entry.toAccount}`,
            },
            {
              primary: 'Treasury owner',
              secondary: 'Transfer initiator or reviewer',
              meta: entry.treasuryOwner,
            },
          ],
        },
      ]}
      controlChecks={[
        {
          label: 'Transfer posting',
          description: 'Internal transfer should be posted before treasury close',
          status: entry.status === 'posted' ? 'success' : 'warning',
          value: entry.status,
        },
        {
          label: 'Account pair validation',
          description: 'Source and destination accounts must differ',
          status: entry.fromAccount !== entry.toAccount ? 'success' : 'error',
          value: entry.fromAccount !== entry.toAccount ? 'valid pair' : 'invalid pair',
        },
        {
          label: 'Transfer evidence',
          description: 'Internal transfer should include channel and reference',
          status: entry.transferChannel && entry.reference ? 'success' : 'warning',
          value: entry.reference || 'pending',
        },
      ]}
      timeline={[
        {
          label: 'Transfer initiated',
          description: entry.description,
          status: 'internal transfer',
          tone: 'info',
          time: formatDetailDate(entry.date),
          icon: 'solar:transfer-horizontal-bold',
        },
      ]}
    />
  );
}
