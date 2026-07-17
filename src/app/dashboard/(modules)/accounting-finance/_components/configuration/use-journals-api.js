'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ------------------------------------------------------------
// Derive all display fields the card UI expects from a raw
// backend Journal object + the already-fetched accounts list
// ------------------------------------------------------------
function enrichJournal(journal, accounts) {
  // Backend uses "sales"; the UI colour/icon maps use "sale".
  // Normalise so both render correctly without touching the maps.
  const type = journal.journal_type === 'sales' ? 'sale' : journal.journal_type || 'general';

  const defaultDebit = accounts.find((a) => Number(a.id) === Number(journal.default_debit_account));
  const defaultCredit = accounts.find(
    (a) => Number(a.id) === Number(journal.default_credit_account)
  );

  return {
    ...journal,
    // normalise type so TYPE_COLORS / TYPE_ICONS work unchanged
    type,
    active: journal.is_active !== false,
    defaultDebitName: defaultDebit?.name || 'Not assigned',
    defaultCreditName: defaultCredit?.name || 'Not assigned',
    // Posting queue requires a heavy entries fetch; keep as placeholder
    postingQueue: 0,
    lastEntryDate: '—',
    reviewPolicy:
      type === 'bank'
        ? 'Bank reconciliation review'
        : type === 'sale'
          ? 'Revenue recognition review'
          : type === 'purchase'
            ? 'AP approval review'
            : 'Controller posting review',
    sequencePolicy: journal.sequence_prefix
      ? `${journal.sequence_prefix}/%(year)s/%(seq)s`
      : `${String(journal.code || 'JRN').toUpperCase()}/%(year)s/%(seq)s`,
    // Fields that exist in the mock but not in backend — kept as display defaults
    suspenseAccount: defaultDebit?.name || 'Suspense clearing account',
    profitAccount: defaultCredit?.name || 'Current year earnings',
    periodAccess:
      type === 'bank'
        ? 'Open periods only with treasury approval'
        : 'Open periods for accounting team',
  };
}

// ------------------------------------------------------------
// Hook — drop-in replacement for the journals slice that
// useCoreLedgerConfigWorkspace used to provide
// ------------------------------------------------------------
export function useJournalsApi() {
  const journalsUrl = endpoints.accounting.journals;
  const accountsUrl = endpoints.accounting.accounts;

  const { data: rawJournals, isLoading, error } = useSWR(journalsUrl, fetcher);
  // Reuse cached accounts (same SWR key as chart-of-accounts page)
  const { data: rawAccounts } = useSWR(accountsUrl, fetcher);

  const accountsList = useMemo(() => {
    if (Array.isArray(rawAccounts)) return rawAccounts;
    if (Array.isArray(rawAccounts?.results)) return rawAccounts.results;
    return [];
  }, [rawAccounts]);

  const journals = useMemo(() => {
    const list = Array.isArray(rawJournals)
      ? rawJournals
      : Array.isArray(rawJournals?.results)
        ? rawJournals.results
        : [];
    return list.map((j) => enrichJournal(j, accountsList));
  }, [rawJournals, accountsList]);

  const overview = useMemo(
    () => ({
      activeJournals: journals.filter((j) => j.active).length,
      postingQueue: journals.reduce((sum, j) => sum + j.postingQueue, 0),
      sequencedJournals: journals.filter((j) => j.sequence_prefix).length,
    }),
    [journals]
  );

  // ── Mutations ──────────────────────────────────────────────

  const createJournal = async (payload) => {
    // Map the normalised "sale" back to backend's "sales"
    const journalType = payload.journal_type === 'sale' ? 'sales' : payload.journal_type;
    const body = {
      name: payload.name,
      journal_type: journalType,
      is_active: true,
    };
    if (payload.sequence_prefix?.trim()) body.sequence_prefix = payload.sequence_prefix;
    if (payload.default_debit_account)
      body.default_debit_account = Number(payload.default_debit_account);
    if (payload.default_credit_account)
      body.default_credit_account = Number(payload.default_credit_account);

    await axiosInstance.post(journalsUrl, body);
    await mutate(journalsUrl);
  };

  const toggleJournalStatus = async (journalId) => {
    const journal = journals.find((j) => String(j.id) === String(journalId));
    if (!journal) return;
    await axiosInstance.patch(endpoints.accounting.journal_by_id(journalId), {
      is_active: !journal.active,
    });
    await mutate(journalsUrl);
  };

  const updateJournal = async (id, payload) => {
    const body = {
      name: payload.name,
      journal_type: payload.journal_type === 'sale' ? 'sales' : payload.journal_type,
    };
    if (payload.sequence_prefix?.trim()) body.sequence_prefix = payload.sequence_prefix;
    if (payload.default_debit_account)
      body.default_debit_account = Number(payload.default_debit_account);
    if (payload.default_credit_account)
      body.default_credit_account = Number(payload.default_credit_account);
    await axiosInstance.patch(endpoints.accounting.journal_by_id(id), body);
    await mutate(journalsUrl);
  };

  const deleteJournal = async (id) => {
    await axiosInstance.delete(endpoints.accounting.journal_by_id(id));
    await mutate(journalsUrl);
  };

  return {
    journals,
    accountsList,
    overview,
    loading: isLoading,
    error,
    actions: {
      createJournal,
      toggleJournalStatus,
      updateJournal,
      deleteJournal,
    },
  };
}
