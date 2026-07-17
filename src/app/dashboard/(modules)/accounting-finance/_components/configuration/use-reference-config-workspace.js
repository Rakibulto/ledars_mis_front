'use client';

import { useMemo, useSyncExternalStore } from 'react';

import {
  createCurrency,
  syncExchangeRates,
  createExchangeRate,
  createPaymentMethod,
  toggleCurrencyStatus,
  createBankCashAccount,
  createReconciliationModel,
  togglePaymentMethodStatus,
  toggleReconciliationModelStatus,
  subscribeReferenceConfigWorkspace,
  getReferenceConfigWorkspaceVersion,
  getReferenceConfigWorkspaceSnapshot,
} from './reference-config-mock-data';

const getWorkspaceSnapshot = () => getReferenceConfigWorkspaceVersion();

export function useReferenceConfigWorkspace() {
  const version = useSyncExternalStore(
    subscribeReferenceConfigWorkspace,
    getWorkspaceSnapshot,
    getWorkspaceSnapshot
  );

  return useMemo(
    () => ({
      version,
      ...getReferenceConfigWorkspaceSnapshot(),
      actions: {
        createCurrency,
        toggleCurrencyStatus,
        syncExchangeRates,
        createExchangeRate,
        createPaymentMethod,
        togglePaymentMethodStatus,
        createBankCashAccount,
        createReconciliationModel,
        toggleReconciliationModelStatus,
      },
    }),
    [version]
  );
}
