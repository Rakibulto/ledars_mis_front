'use client';

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ── Constants ─────────────────────────────────────────────────────────────────

const EP = endpoints.accounting;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Enrich a raw LockDate record from the backend with derived display fields
 * so the existing UI can render without changes.
 */
function enrichLockDate(ld) {
  const enforcementMap = {
    hard: 'Hard close',
    tax: 'Tax close',
    soft: 'Soft close',
  };

  const auditOwnerMap = {
    hard: 'Finance Controller',
    tax: 'Head of Accounts',
    soft: 'Finance Controller',
  };

  const escalationMap = {
    hard: 'Controller-only reopen path',
    tax: 'Escalate to hard lock at statutory cutoff',
    soft: 'Escalate to tax lock 3 days before close',
  };

  const impactMap = {
    hard: 'Affects journals, invoices, and bills',
    tax: 'Affects tax reports and filing adjustments',
    soft: 'Affects journals, invoices, and bills',
  };

  return {
    ...ld,
    scopeLabel: ld.scope || 'Accounting period',
    enforcementLevel: enforcementMap[ld.type] || 'Soft close',
    auditOwner: auditOwnerMap[ld.type] || 'Finance Controller',
    escalationRule: escalationMap[ld.type] || '',
    impactSummary: impactMap[ld.type] || '',
    history: [
      {
        id: `${ld.id}-configured`,
        date: ld.updated_at ? ld.updated_at.split('T')[0] : ld.lock_date,
        action: 'Configured',
        actor: auditOwnerMap[ld.type] || 'Finance Controller',
      },
    ],
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useLockDatesApi() {
  const { data: rawData, isLoading, error } = useSWR(EP.lock_dates, fetcher);

  const lockDates = useMemo(() => {
    const list = Array.isArray(rawData) ? rawData : (rawData?.results ?? []);
    return list.map(enrichLockDate);
  }, [rawData]);

  const overview = useMemo(
    () => ({
      lockDateCount: lockDates.length,
      hardLocks: lockDates.filter((ld) => ld.type === 'hard').length,
      policyCoverage: lockDates.length,
    }),
    [lockDates]
  );

  const alerts = useMemo(() => {
    const list = [];

    if (!lockDates.some((ld) => ld.type === 'hard')) {
      list.push({
        id: 'no-hard',
        severity: 'warning',
        title: 'No hard lock configured',
        description:
          'A hard close date should exist to prevent period reopening without controller approval.',
      });
    }

    if (!list.length) {
      list.push({
        id: 'stable',
        severity: 'success',
        title: 'Lock governance controls are in place',
        description: 'Hard close and tax lock dates are configured to protect completed periods.',
      });
    }

    return list;
  }, [lockDates]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const addLockDate = useCallback(async (payload) => {
    await axiosInstance.post(EP.lock_dates, {
      name: payload.name,
      description: payload.description || '',
      type: payload.type || 'soft',
      lock_date: payload.lock_date,
      scope: payload.scope || 'Accounting period',
      applies_to: payload.applies_to || 'All accountants',
    });
    await mutate(EP.lock_dates);
  }, []);

  const updateLockDate = useCallback(async (payload) => {
    await axiosInstance.patch(EP.lock_date_by_id(payload.id), {
      name: payload.name,
      description: payload.description || '',
      type: payload.type,
      lock_date: payload.lock_date,
      scope: payload.scope || payload.scopeLabel || 'Accounting period',
      applies_to: payload.applies_to || 'All accountants',
    });
    await mutate(EP.lock_dates);
  }, []);

  const deleteLockDate = useCallback(async (id) => {
    await axiosInstance.delete(EP.lock_date_by_id(id));
    await mutate(EP.lock_dates);
  }, []);

  return {
    lockDates,
    overview,
    alerts,
    loading: isLoading,
    error,
    actions: {
      addLockDate,
      updateLockDate,
      deleteLockDate,
    },
  };
}
