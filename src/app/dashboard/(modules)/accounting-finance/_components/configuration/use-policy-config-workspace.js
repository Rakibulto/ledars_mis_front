'use client';

import { useSyncExternalStore } from 'react';

import { policyConfigStore } from './policy-config-mock-data';

export function usePolicyConfigWorkspace() {
  return useSyncExternalStore(
    policyConfigStore.subscribe,
    policyConfigStore.getSnapshot,
    policyConfigStore.getSnapshot
  );
}
