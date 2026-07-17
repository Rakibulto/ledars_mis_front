'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ------------------------------------------------------------
// Maps a single raw backend account + fetched account types
// into the enriched shape the chart-of-accounts UI expects.
// ------------------------------------------------------------
function enrichAccount(account, accountTypes) {
  const type = accountTypes.find((t) => Number(t.id) === Number(account.account_type));
  const classification = account.classification || type?.classification || '';
  const isBalanceSheet = ['asset', 'liability', 'equity'].includes(classification);
  const balance = Number(account.current_balance || 0);
  const code = String(account.code || '');
  const hierarchyLevel = code.length <= 1 ? 0 : Math.max(0, Math.floor((code.length - 1) / 2));
  const parentCode = hierarchyLevel > 0 ? code.slice(0, Math.max(1, code.length - 2)) : 'ROOT';

  return {
    ...account,
    // Normalise backend field names to what the UI already uses
    type_id: account.account_type,
    balance,
    reconcile: account.is_reconcilable ?? false,
    archived: account.is_deprecated ?? false,
    active: account.is_active !== false,

    // Derived display fields (same logic as the old mock enrichAccounts)
    typeName: account.account_type_name || type?.name || 'Unassigned',
    category: isBalanceSheet ? 'balance_sheet' : 'profit_loss',
    controlBand:
      Math.abs(balance) > 150000
        ? 'High exposure'
        : Math.abs(balance) > 50000
          ? 'Monitored'
          : 'Routine',
    reportingRole: isBalanceSheet ? 'Statement of financial position' : 'Profit and loss reporting',
    hierarchyLevel,
    parentCode,
    numberingScheme:
      classification === 'asset'
        ? '1xxx assets band'
        : classification === 'liability'
          ? '2xxx liabilities band'
          : classification === 'equity'
            ? '3xxx equity band'
            : classification === 'income'
              ? '4xxx income band'
              : '5xxx expense band',
    defaultMappings: isBalanceSheet
      ? 'Mapped to statement of financial position and close carry-forward'
      : 'Mapped to P&L close and retained earnings transfer',
    postingRestriction: ['asset', 'liability'].includes(classification)
      ? 'Operational journals plus controller override'
      : 'All operational journals',
    usageAnalytics:
      Math.abs(balance) > 150000
        ? 'High-usage ledger with frequent month-end review'
        : Math.abs(balance) > 50000
          ? 'Moderate posting volume and periodic reconciliation'
          : 'Low-volume account monitored by exception',
    archiveCandidate: Math.abs(balance) < 1 && account.is_active !== false,
  };
}

// ------------------------------------------------------------
// The hook — drop-in for the accounts slice of the workspace
// ------------------------------------------------------------
export function useChartOfAccountsApi() {
  const accountsUrl = endpoints.accounting.accounts;
  const typesUrl = endpoints.accounting.account_types;

  const {
    data: rawAccounts,
    isLoading: accountsLoading,
    error: accountsError,
  } = useSWR(accountsUrl, fetcher);
  const { data: rawTypes, isLoading: typesLoading } = useSWR(typesUrl, fetcher);

  // Flatten paginated (results[]) or plain-array responses
  const accountTypes = useMemo(() => {
    if (Array.isArray(rawTypes)) return rawTypes;
    if (Array.isArray(rawTypes?.results)) return rawTypes.results;
    return [];
  }, [rawTypes]);

  const accounts = useMemo(() => {
    const list = Array.isArray(rawAccounts)
      ? rawAccounts
      : Array.isArray(rawAccounts?.results)
        ? rawAccounts.results
        : [];
    return list
      .sort((a, b) => String(a.code).localeCompare(String(b.code)))
      .map((account) => enrichAccount(account, accountTypes));
  }, [rawAccounts, accountTypes]);

  const overview = useMemo(
    () => ({
      activeAccounts: accounts.filter((a) => a.active).length,
      reconcilableAccounts: accounts.filter((a) => a.reconcile).length,
      highExposureAccounts: accounts.filter((a) => a.controlBand === 'High exposure').length,
      archiveCandidates: accounts.filter((a) => a.archiveCandidate).length,
    }),
    [accounts]
  );

  // ── Mutations ──────────────────────────────────────────────

  const createAccount = async (payload) => {
    const body = {
      name: payload.name,
      account_type: Number(payload.type_id),
      opening_balance: Number(payload.balance || 0),
      is_reconcilable: Boolean(payload.reconcile),
      is_active: true,
    };
    // Only include parent if a real existing account was selected
    if (payload.parent_id) body.parent = Number(payload.parent_id);
    const response = await axiosInstance.post(accountsUrl, body);
    // Tell SWR to re-fetch the accounts list so the table refreshes
    await mutate(accountsUrl);
    return response.data; // Return the newly created account
  };

  const archiveAccount = async (accountId) => {
    await axiosInstance.patch(endpoints.accounting.account_by_id(accountId), {
      is_deprecated: true,
      is_active: false,
    });
    await mutate(accountsUrl);
  };

  const toggleAccountStatus = async (accountId) => {
    const account = accounts.find((a) => String(a.id) === String(accountId));
    if (!account) return;
    await axiosInstance.patch(endpoints.accounting.account_by_id(accountId), {
      is_active: !account.active,
    });
    await mutate(accountsUrl);
  };

  const updateAccount = async (id, payload) => {
    const body = {
      code: payload.code,
      name: payload.name,
      account_type: Number(payload.type_id),
      is_reconcilable: Boolean(payload.reconcile),
    };
    if (payload.parent_id) body.parent = Number(payload.parent_id);
    await axiosInstance.patch(endpoints.accounting.account_by_id(id), body);
    await mutate(accountsUrl);
  };

  const deleteAccount = async (id) => {
    await axiosInstance.delete(endpoints.accounting.account_by_id(id));
    await mutate(accountsUrl);
  };

  return {
    accounts,
    accountTypes,
    overview,
    loading: accountsLoading || typesLoading,
    error: accountsError,
    actions: {
      createAccount,
      archiveAccount,
      toggleAccountStatus,
      updateAccount,
      deleteAccount,
    },
  };
}
