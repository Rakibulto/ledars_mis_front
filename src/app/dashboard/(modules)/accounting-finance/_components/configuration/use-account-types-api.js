'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// Abbreviated display code derived from classification
// (backend has no "code" field on AccountType)
const CLASSIFICATION_CODE = {
  asset: 'AST',
  liability: 'LIA',
  equity: 'EQT',
  income: 'INC',
  expense: 'EXP',
};

// ------------------------------------------------------------
// Enrich a raw backend AccountType with all display fields
// the table already expects (same shape as the old mock data)
// ------------------------------------------------------------
function enrichAccountType(type, accounts) {
  const classification = type.classification || '';
  const isBalanceSheet = ['asset', 'liability', 'equity'].includes(classification);
  const mappedAccounts = accounts.filter((a) => Number(a.account_type) === Number(type.id));

  return {
    ...type,
    // Normalise active flag
    active: type.is_active !== false,
    // Derived display fields that keep the table columns intact
    code: CLASSIFICATION_CODE[classification] || classification.slice(0, 3).toUpperCase(),
    nature: classification,
    category: isBalanceSheet ? 'balance_sheet' : 'profit_loss',
    mappedAccountCount: mappedAccounts.length,
    mappedBalance: mappedAccounts.reduce((sum, a) => sum + Number(a.current_balance || 0), 0),
    postingMode: isBalanceSheet ? 'Continuous balance control' : 'Close to retained earnings',
    closeBehavior: isBalanceSheet ? 'Carry forward to opening balances' : 'Close at year end',
    controlOwner: ['asset', 'liability'].includes(classification)
      ? 'Controller'
      : 'Finance Business Partner',
    defaultPolicy:
      classification === 'income'
        ? 'Requires revenue recognition review'
        : 'Standard posting posture',
    mappingRule: `Default ${classification} mapping to ${isBalanceSheet ? 'balance sheet' : 'P&L'} presentation`,
    categoryBehavior: isBalanceSheet
      ? 'Carries balance to next fiscal year'
      : 'Closes to retained earnings automatically',
  };
}

// ------------------------------------------------------------
// Hook — drop-in replacement for the accountTypes slice that
// useFoundationalConfigWorkspace used to provide
// ------------------------------------------------------------
export function useAccountTypesApi() {
  const typesUrl = endpoints.accounting.account_types;
  const accountsUrl = endpoints.accounting.accounts;

  const { data: rawTypes, isLoading, error } = useSWR(typesUrl, fetcher);
  // Reuse the same SWR key as chart-of-accounts so the browser
  // serves from cache when the user switches between pages
  const { data: rawAccounts } = useSWR(accountsUrl, fetcher);

  const accountsList = useMemo(() => {
    if (Array.isArray(rawAccounts)) return rawAccounts;
    if (Array.isArray(rawAccounts?.results)) return rawAccounts.results;
    return [];
  }, [rawAccounts]);

  const accountTypes = useMemo(() => {
    const list = Array.isArray(rawTypes)
      ? rawTypes
      : Array.isArray(rawTypes?.results)
        ? rawTypes.results
        : [];
    return list.map((type) => enrichAccountType(type, accountsList)).sort((a, b) => b.id - a.id);
  }, [rawTypes, accountsList]);

  const overview = useMemo(
    () => ({
      activeAccountTypes: accountTypes.filter((t) => t.active).length,
      mappedAccounts: accountTypes.reduce((sum, t) => sum + t.mappedAccountCount, 0),
      balanceSheetTypes: accountTypes.filter((t) => t.category === 'balance_sheet').length,
    }),
    [accountTypes]
  );

  // ── Mutations ──────────────────────────────────────────────

  const createAccountType = async (payload) => {
    await axiosInstance.post(typesUrl, {
      name: payload.name,
      classification: payload.classification, // backend field name
      is_active: true,
    });
    await mutate(typesUrl);
  };

  const toggleAccountTypeStatus = async (typeId) => {
    const type = accountTypes.find((t) => String(t.id) === String(typeId));
    if (!type) return;
    await axiosInstance.patch(endpoints.accounting.account_type_by_id(typeId), {
      is_active: !type.active,
    });
    await mutate(typesUrl);
  };

  const updateAccountType = async (id, payload) => {
    await axiosInstance.patch(endpoints.accounting.account_type_by_id(id), {
      name: payload.name,
      classification: payload.classification,
    });
    await mutate(typesUrl);
  };

  const deleteAccountType = async (id) => {
    await axiosInstance.delete(endpoints.accounting.account_type_by_id(id));
    await mutate(typesUrl);
  };

  return {
    accountTypes,
    overview,
    loading: isLoading,
    error,
    actions: {
      createAccountType,
      toggleAccountTypeStatus,
      updateAccountType,
      deleteAccountType,
    },
  };
}
