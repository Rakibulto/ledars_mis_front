'use client';

import { useMemo, useSyncExternalStore } from 'react';

import {
  createTax,
  toggleTaxStatus,
  createAccountType,
  createPaymentTerm,
  toggleAccountTypeStatus,
  togglePaymentTermStatus,
  subscribeFoundationalConfigWorkspace,
  getFoundationalConfigWorkspaceVersion,
  getFoundationalConfigWorkspaceSnapshot,
} from './foundational-config-mock-data';

const getWorkspaceSnapshot = () => getFoundationalConfigWorkspaceVersion();

export function useFoundationalConfigWorkspace() {
  const version = useSyncExternalStore(
    subscribeFoundationalConfigWorkspace,
    getWorkspaceSnapshot,
    getWorkspaceSnapshot
  );

  return useMemo(
    () => ({
      version,
      ...getFoundationalConfigWorkspaceSnapshot(),
      actions: {
        createAccountType,
        toggleAccountTypeStatus,
        createPaymentTerm,
        togglePaymentTermStatus,
        createTax,
        toggleTaxStatus,
      },
    }),
    [version]
  );
}
