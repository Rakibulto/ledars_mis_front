'use client';

import { useMemo, useSyncExternalStore } from 'react';

import {
  createJournal,
  closeFiscalYear,
  createFiscalYear,
  closeFiscalPeriod,
  reopenFiscalPeriod,
  toggleJournalStatus,
  generateFiscalPeriods,
  subscribeCoreLedgerConfigWorkspace,
  getCoreLedgerConfigWorkspaceVersion,
  getCoreLedgerConfigWorkspaceSnapshot,
} from './core-ledger-config-mock-data';

const getWorkspaceSnapshot = () => getCoreLedgerConfigWorkspaceVersion();

export function useCoreLedgerConfigWorkspace() {
  const version = useSyncExternalStore(
    subscribeCoreLedgerConfigWorkspace,
    getWorkspaceSnapshot,
    getWorkspaceSnapshot
  );

  return useMemo(
    () => ({
      version,
      ...getCoreLedgerConfigWorkspaceSnapshot(),
      actions: {
        createJournal,
        toggleJournalStatus,
        createFiscalYear,
        closeFiscalYear,
        generateFiscalPeriods,
        closeFiscalPeriod,
        reopenFiscalPeriod,
      },
    }),
    [version]
  );
}
