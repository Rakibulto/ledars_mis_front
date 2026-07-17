'use client';

import { useMemo, useSyncExternalStore } from 'react';

import {
  createAccount,
  archiveAccount,
  createCostCenter,
  toggleAccountStatus,
  updateBudgetSettings,
  toggleCostCenterStatus,
  subscribePlanningConfigWorkspace,
  getPlanningConfigWorkspaceVersion,
  getPlanningConfigWorkspaceSnapshot,
} from './planning-config-mock-data';

const getWorkspaceSnapshot = () => getPlanningConfigWorkspaceVersion();

export function usePlanningConfigWorkspace() {
  const version = useSyncExternalStore(
    subscribePlanningConfigWorkspace,
    getWorkspaceSnapshot,
    getWorkspaceSnapshot
  );

  return useMemo(
    () => ({
      version,
      ...getPlanningConfigWorkspaceSnapshot(),
      actions: {
        createAccount,
        archiveAccount,
        toggleAccountStatus,
        createCostCenter,
        toggleCostCenterStatus,
        updateBudgetSettings,
      },
    }),
    [version]
  );
}
