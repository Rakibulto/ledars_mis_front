'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ── Enrichment ─────────────────────────────────────────────

const TRANSACTION_LOCK_DATE = '2026-03-01';

function approvalStateFromStatus(status) {
  if (status === 'posted') return 'approved';
  if (status === 'cancelled') return 'needs_changes';
  // draft or any other value → ready for approval decision
  return 'approved';
}

export function enrichJournalEntry(entry) {
  return {
    ...entry,
    // Map backend field names → UI field names
    number: entry.reference || `JE-${entry.id}`,
    journal_id: entry.journal, // integer FK from backend
    totalDebit: Number(entry.total_debit || 0),
    totalCredit: Number(entry.total_credit || 0),
    attachmentCount: entry.item_count || 0,
    preparedBy: entry.created_by_name || 'System',
    reviewer: 'Finance Manager',
    recurring: Boolean(entry.is_auto_generated),
    recurringLabel: entry.is_auto_generated ? 'Auto-generated entry' : undefined,
    // approvalState: derived from status (backend has no approval workflow)
    approvalState: approvalStateFromStatus(entry.status),
    // locked: date < lock date
    locked: entry.date ? new Date(entry.date) < new Date(TRANSACTION_LOCK_DATE) : false,
    tags: [],
    lines: [],
    attachments: [],
    activity: [],
  };
}

// ── Hook ────────────────────────────────────────────────────

export function useJournalEntriesApi() {
  // Always order by newest date first so the list is consistent
  const entriesUrl = `${endpoints.accounting.journal_entries}?ordering=-id`;
  const journalsUrl = endpoints.accounting.journals;

  const {
    data: rawEntries,
    isLoading: entriesLoading,
    isValidating: entriesValidating,
    error,
  } = useSWR(entriesUrl, fetcher);
  const { data: rawJournals, isLoading: journalsLoading } = useSWR(journalsUrl, fetcher);

  const journals = useMemo(() => {
    if (Array.isArray(rawJournals)) return rawJournals;
    if (Array.isArray(rawJournals?.results)) return rawJournals.results;
    return [];
  }, [rawJournals]);

  const entries = useMemo(() => {
    const list = Array.isArray(rawEntries)
      ? rawEntries
      : Array.isArray(rawEntries?.results)
        ? rawEntries.results
        : [];
    return list.map(enrichJournalEntry);
  }, [rawEntries]);

  // ── Mutations ──────────────────────────────────────────────

  /** Post a single journal entry to the GL */
  const postEntry = async (entryId) => {
    await axiosInstance.post(endpoints.accounting.journal_entry_post(entryId));
    await mutate(entriesUrl);
  };

  /**
   * Create a new journal entry header on the backend.
   * Items/lines are not included (require account FK IDs).
   * Returns the created entry enriched for UI use.
   */
  const createEntry = async (payload) => {
    const totalDebit = payload.lines?.reduce((sum, l) => sum + Number(l.debit || 0), 0) ?? 0;
    const totalCredit = payload.lines?.reduce((sum, l) => sum + Number(l.credit || 0), 0) ?? 0;

    const body = {
      journal: payload.journal_id,
      date: payload.date,
      narration: payload.narration || '',
      reference: payload.reference || '',
      status: 'draft',
      total_debit: totalDebit,
      total_credit: totalCredit,
      is_auto_generated: Boolean(payload.recurring),
      items:
        payload.lines?.map((line) => ({
          account: line.account_id,
          label: line.description || 'Line item',
          debit: Number(line.debit || 0),
          credit: Number(line.credit || 0),
          amount_currency: 0,
          analytic_account: line.analytic_account ? Number(line.analytic_account) : undefined,
          cost_center: line.cost_center ? Number(line.cost_center) : undefined,
        })) ?? [],
    };
    if (payload.fiscal_period) body.fiscal_period = Number(payload.fiscal_period);

    const { data } = await axiosInstance.post(endpoints.accounting.journal_entries, body);

    await mutate(entriesUrl);
    return enrichJournalEntry(data);
  };

  /**
   * Update an existing journal entry header on the backend.
   */
  const updateEntry = async (entryId, payload) => {
    const body = {
      date: payload.date,
      narration: payload.narration || '',
      reference: payload.reference || '',
      journal: payload.journal_id,
      is_auto_generated: Boolean(payload.recurring),
    };
    if (payload.fiscal_period) body.fiscal_period = Number(payload.fiscal_period);

    if (payload.lines && payload.lines.length > 0) {
      body.items = payload.lines.map((line) => ({
        account: line.account_id,
        label: line.description || 'Line item',
        debit: Number(line.debit || 0),
        credit: Number(line.credit || 0),
        amount_currency: 0,
        analytic_account: line.analytic_account ? Number(line.analytic_account) : undefined,
        cost_center: line.cost_center ? Number(line.cost_center) : undefined,
      }));
    }

    const { data } = await axiosInstance.patch(endpoints.accounting.journal_entry_by_id(entryId), body);
    await mutate(entriesUrl);
    return enrichJournalEntry(data);
  };

  /** Re-fetch entries (used after optimistic batch post) */
  const refetch = async () => {
    await mutate(entriesUrl);
  };

  const deleteEntry = async (entryId) => {
    await axiosInstance.delete(endpoints.accounting.journal_entry_by_id(entryId));
    await mutate(entriesUrl);
  };

  return {
    entries,
    journals,
    loading: entriesLoading || journalsLoading,
    isValidating: entriesValidating,
    error,
    entriesUrl,
    actions: {
      postEntry,
      createEntry,
      updateEntry,
      deleteEntry,
      refetch,
    },
  };
}
