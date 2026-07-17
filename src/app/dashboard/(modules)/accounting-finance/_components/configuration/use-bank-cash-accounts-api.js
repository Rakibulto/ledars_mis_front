'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ------------------------------------------------------------
// Enrich a backend BankAccount into the unified display shape.
// currencies is the full currencies list to resolve currency code.
// ------------------------------------------------------------
function enrichBankAccount(account, currencies) {
  const currencyObj = currencies.find((c) => Number(c.id) === Number(account.currency));
  const balance = Number(account.current_balance || 0);
  const pendingBalance = Math.round(balance * 0.08);

  return {
    ...account,
    // Use a namespaced id so bank and cash ids don't collide
    _rawId: account.id,
    id: `bank-${account.id}`,
    type: 'bank',
    balance,
    currency: currencyObj?.code || 'BDT',
    active: account.status === 'active',
    pendingBalance,
    availableBalance: balance - pendingBalance,
    treasuryDefault: 'Primary disbursement account',
    liquidityTag: 'Bank liquidity',
    reconciliationState: pendingBalance > 10000 ? 'attention' : 'healthy',
    reconciliationCadence: 'Daily bank-feed reconciliation',
    liquidityHorizon:
      pendingBalance > 10000 ? 'Tight 7-day liquidity horizon' : 'Stable 30-day liquidity horizon',
  };
}

// ------------------------------------------------------------
// Enrich a backend CashRegister into the unified display shape.
// ------------------------------------------------------------
function enrichCashRegister(register) {
  const balance = Number(register.current_balance || 0);
  const pendingBalance = Math.round(balance * 0.04);

  return {
    ...register,
    _rawId: register.id,
    id: `cash-${register.id}`,
    type: 'cash',
    bank_name: register.custodian_name || 'Cash Register',
    account_number: 'Cash Register',
    currency: 'BDT',
    balance,
    active: register.is_active !== false,
    pendingBalance,
    availableBalance: balance - pendingBalance,
    treasuryDefault: 'Field float account',
    liquidityTag: 'Cash on hand',
    reconciliationState: 'manual_control',
    reconciliationCadence: 'Daily cashier close',
    liquidityHorizon: 'Stable 30-day liquidity horizon',
  };
}

// ------------------------------------------------------------
// Hook — drop-in for the bankCashAccounts slice that
// bank-cash-accounts.jsx uses via useReferenceConfigWorkspace.
// Fetches from both bank_accounts and cash_registers endpoints
// and merges them into a single unified list.
// ------------------------------------------------------------
export function useBankCashAccountsApi() {
  const bankUrl = endpoints.accounting.bank_accounts;
  const cashUrl = endpoints.accounting.cash_registers;
  const currenciesUrl = endpoints.accounting.currencies;

  const { data: rawBankAccounts, isLoading: bankLoading, error } = useSWR(bankUrl, fetcher);
  const { data: rawCashRegisters, isLoading: cashLoading } = useSWR(cashUrl, fetcher);
  const { data: rawCurrencies } = useSWR(currenciesUrl, fetcher);

  const currencies = useMemo(() => {
    if (Array.isArray(rawCurrencies)) return rawCurrencies;
    if (Array.isArray(rawCurrencies?.results)) return rawCurrencies.results;
    return [];
  }, [rawCurrencies]);

  const bankAccounts = useMemo(() => {
    const list = Array.isArray(rawBankAccounts)
      ? rawBankAccounts
      : Array.isArray(rawBankAccounts?.results)
        ? rawBankAccounts.results
        : [];
    return list.map((a) => enrichBankAccount(a, currencies)).sort((a, b) => b.id - a.id);
  }, [rawBankAccounts, currencies]);

  const cashAccounts = useMemo(() => {
    const list = Array.isArray(rawCashRegisters)
      ? rawCashRegisters
      : Array.isArray(rawCashRegisters?.results)
        ? rawCashRegisters.results
        : [];
    return list.map(enrichCashRegister).sort((a, b) => b.id - a.id);
  }, [rawCashRegisters]);

  const bankCashAccounts = useMemo(
    () => [...bankAccounts, ...cashAccounts],
    [bankAccounts, cashAccounts]
  );

  const overview = useMemo(
    () => ({
      bankAccountCount: bankAccounts.length,
      cashAccountCount: cashAccounts.length,
      totalLiquidity: bankCashAccounts.reduce((sum, a) => sum + a.balance, 0),
      pendingLiquidity: bankCashAccounts.reduce((sum, a) => sum + a.pendingBalance, 0),
    }),
    [bankAccounts, cashAccounts, bankCashAccounts]
  );

  // ── Mutations ──────────────────────────────────────────────

  const createBankCashAccount = async (payload) => {
    // Resolve currency FK from code string
    const currencyObj = currencies.find(
      (c) => c.code === (payload.currency || 'BDT').toUpperCase()
    );
    const body = {
      name: payload.name,
      bank_name: payload.bank_name,
      account_number: payload.account_number,
      opening_balance: Number(payload.balance || 0),
      current_balance: Number(payload.balance || 0),
      status: 'active',
    };
    if (currencyObj) body.currency = currencyObj.id;
    await axiosInstance.post(bankUrl, body);
    await mutate(bankUrl);
  };

  const createCashRegister = async (payload) => {
    const body = {
      name: payload.name,
      opening_balance: Number(payload.opening_balance || 0),
      current_balance: Number(payload.opening_balance || 0),
      max_limit: Number(payload.max_limit || 0),
      is_active: true,
    };
    await axiosInstance.post(cashUrl, body);
    await mutate(cashUrl);
  };

  const toggleBankAccountStatus = async (accountId) => {
    // Only bank accounts (not cash registers) support status toggling via this endpoint.
    // accountId uses the namespaced form: "bank-{id}"
    const rawId = String(accountId).replace('bank-', '');
    const account = bankAccounts.find((a) => String(a._rawId) === rawId);
    if (!account) return;
    const newStatus = account.active ? 'inactive' : 'active';
    await axiosInstance.patch(endpoints.accounting.bank_account_by_id(rawId), {
      status: newStatus,
    });
    await mutate(bankUrl);
  };

  const deleteBankAccount = async (accountId) => {
    const rawId = String(accountId).replace('bank-', '');
    await axiosInstance.delete(endpoints.accounting.bank_account_by_id(rawId));
    await mutate(bankUrl);
  };

  const deleteCashRegister = async (registerId) => {
    const rawId = String(registerId).replace('cash-', '');
    await axiosInstance.delete(endpoints.accounting.cash_register_by_id(rawId));
    await mutate(cashUrl);
  };

  return {
    bankCashAccounts,
    overview,
    loading: bankLoading || cashLoading,
    error,
    actions: {
      createBankCashAccount,
      createCashRegister,
      toggleBankAccountStatus,
      deleteBankAccount,
      deleteCashRegister,
    },
  };
}
