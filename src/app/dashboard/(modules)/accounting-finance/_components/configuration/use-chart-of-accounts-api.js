'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ------------------------------------------------------------
// Maps a single raw backend account + fetched account types
// into the enriched shape the chart-of-accounts UI expects.
// ------------------------------------------------------------
function enrichAccount(account, accountTypes, accountMap) {
  const type = accountTypes.find((t) => Number(t.id) === Number(account.account_type));
  const classification = account.classification || type?.classification || '';
  const balance = Number(account.current_balance || 0);
  const isGlobal = account.is_global ?? account.ngo_project == null;

  return {
    ...account,
    // Normalise backend field names to what the UI already uses
    type_id: account.account_type,
    balance,
    reconcile: account.is_reconcilable ?? false,
    archived: account.is_deprecated ?? false,
    active: account.is_active !== false,
    is_contra: account.is_contra ?? false,
    is_global: isGlobal,
    liquidity_type: account.liquidity_type || type?.liquidity_type || '',

    // Derived display fields
    typeName: account.account_type_name || type?.name || 'Unassigned',
    category: ['asset', 'liability', 'equity'].includes(classification)
      ? 'balance_sheet'
      : 'profit_loss',
    parentName: account.parent_name || (account.parent && accountMap[account.parent]) || '',
    tags: account.tag_names || [],
  };
}

// ------------------------------------------------------------
// The hook — drop-in for the accounts slice of the workspace
// ------------------------------------------------------------
export function useChartOfAccountsApi({ ngoProjectId = null } = {}) {
  const accountsUrl = ngoProjectId
    ? `${endpoints.accounting.accounts}?page_size=500&ordering=code&ngo_project=${ngoProjectId}`
    : `${endpoints.accounting.accounts}?page_size=500&ordering=code`;
  const typesUrl = endpoints.accounting.account_types;

  const {
    data: rawAccounts,
    isLoading: accountsLoading,
    error: accountsError,
  } = useSWR(ngoProjectId === undefined ? null : accountsUrl, fetcher);
  const { data: rawTypes, isLoading: typesLoading } = useSWR(typesUrl, fetcher);

  // Flatten paginated (results[]) or plain-array responses
  const accountTypes = useMemo(() => {
    if (Array.isArray(rawTypes)) return rawTypes;
    if (Array.isArray(rawTypes?.results)) return rawTypes.results;
    return [];
  }, [rawTypes]);

  // Build a quick id→name lookup for parent resolution
  const accountMap = useMemo(() => {
    const list = Array.isArray(rawAccounts)
      ? rawAccounts
      : Array.isArray(rawAccounts?.results)
        ? rawAccounts.results
        : [];
    const map = {};
    list.forEach((a) => {
      map[a.id] = a.name;
    });
    return map;
  }, [rawAccounts]);

  const accounts = useMemo(() => {
    const list = Array.isArray(rawAccounts)
      ? rawAccounts
      : Array.isArray(rawAccounts?.results)
        ? rawAccounts.results
        : [];
    return list
      .sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true }))
      .map((account) => enrichAccount(account, accountTypes, accountMap));
  }, [rawAccounts, accountTypes, accountMap]);

  const overview = useMemo(
    () => ({
      activeAccounts: accounts.filter((a) => a.active).length,
      reconcilableAccounts: accounts.filter((a) => a.reconcile).length,
      highExposureAccounts: accounts.filter((a) => Math.abs(a.balance) > 150000).length,
      archiveCandidates: accounts.filter((a) => Math.abs(a.balance) < 1 && a.active).length,
    }),
    [accounts]
  );

  // ── Mutations ──────────────────────────────────────────────

  const resolveAccountTypeId = (classification) => {
    if (!classification) return undefined;
    // If it's already a number, return it as-is (backward compat)
    if (typeof classification === 'number' || (typeof classification === 'string' && /^\d+$/.test(classification))) {
      return Number(classification);
    }
    // Match classification string to AccountType record
    const match = accountTypes.find(
      (t) => String(t.classification).toLowerCase() === String(classification).toLowerCase()
    );
    return match ? match.id : undefined;
  };

  const createAccount = async (payload) => {
    const body = {
      code: payload.code || undefined,
      name: payload.name,
      account_type: resolveAccountTypeId(payload.type_id),
      opening_balance: Number(payload.opening_balance || 0),
      is_reconcilable: Boolean(payload.reconcile),
      is_active: payload.status !== 'inactive',
      is_contra: Boolean(payload.is_contra),
      description: payload.description || '',
    };
    if (payload.parent_id) body.parent = Number(payload.parent_id);
    if (ngoProjectId) body.ngo_project = Number(ngoProjectId);
    const response = await axiosInstance.post(endpoints.accounting.accounts, body);
    await mutate(accountsUrl);
    return response.data;
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
      account_type: resolveAccountTypeId(payload.type_id),
      is_reconcilable: Boolean(payload.reconcile),
      is_active: payload.status !== 'inactive',
      is_contra: Boolean(payload.is_contra),
      description: payload.description || '',
      opening_balance: Number(payload.opening_balance || 0),
    };
    if (payload.parent_id) body.parent = Number(payload.parent_id);
    else body.parent = null;
    await axiosInstance.patch(endpoints.accounting.account_by_id(id), body);
    await mutate(accountsUrl);
  };

  const deleteAccount = async (id) => {
    await axiosInstance.delete(endpoints.accounting.account_by_id(id));
    await mutate(accountsUrl);
  };

  const seedChartOfAccounts = async () => {
    const body = ngoProjectId ? { ngo_project: Number(ngoProjectId) } : {};
    const res = await axiosInstance.post(endpoints.accounting.account_seed, body);
    await Promise.all([
      mutate(accountsUrl),
      mutate(typesUrl),
      mutate(endpoints.accounting.account_groups),
    ]);
    return res.data;
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
      seedChartOfAccounts,
    },
  };
}
