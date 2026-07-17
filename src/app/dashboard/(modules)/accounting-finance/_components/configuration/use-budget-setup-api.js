'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ── Constants ─────────────────────────────────────────────────────────────────

const SETTINGS_URL = endpoints.accounting.settings;
const FISCAL_YEARS_URL = endpoints.accounting.fiscal_years;

const GOVERNANCE_DEFAULTS = {
  approvalPolicy: 'Department owner → Budget controller → Finance director',
  transferWindow: 'Monthly transfer board every 5th business day',
  reforecastCadence: 'Quarterly rolling reforecast',
  budgetReleaseMode: 'Monthly release with quarterly hard review',
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useBudgetSetupApi() {
  const { data: settings, isLoading: settingsLoading, error } = useSWR(SETTINGS_URL, fetcher);
  const { data: rawFiscalYears, isLoading: fyLoading } = useSWR(FISCAL_YEARS_URL, fetcher);

  const fiscalYears = useMemo(() => {
    const list = Array.isArray(rawFiscalYears)
      ? rawFiscalYears
      : Array.isArray(rawFiscalYears?.results)
        ? rawFiscalYears.results
        : [];
    return list;
  }, [rawFiscalYears]);

  /**
   * Derive initial form values from the backend settings.
   * Non-persisted UI settings fall back to sensible defaults.
   */
  const budgetSettings = useMemo(() => {
    const activeFY = fiscalYears.find((fy) => fy.status === 'active') || fiscalYears[0];
    return {
      defaultFiscalYear: settings?.current_fiscal_year ?? activeFY?.id ?? '',
      budgetPeriod: 'monthly',
      enforceBudgetLimits: settings?.enable_budget_control !== false,
      allowBudgetTransfers: true,
      autoCloseExceededBudgets: false,
      warningThreshold: 70,
      criticalThreshold: 90,
      emailAlerts: true,
      dashboardWarnings: true,
      blockOverBudgetTransactions: false,
      ...GOVERNANCE_DEFAULTS,
    };
  }, [settings, fiscalYears]);

  const overview = useMemo(
    () => ({
      warningThreshold: 70,
      criticalThreshold: 90,
      trackedBudget: 0,
    }),
    []
  );

  const budgetPolicy = useMemo(() => GOVERNANCE_DEFAULTS, []);

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Persists the fields that exist on AccountingSettings.
   * UI-only fields (thresholds, notifications, etc.) are not sent to the backend.
   */
  const updateBudgetSettings = async (form) => {
    const patch = {
      enable_budget_control: Boolean(form.enforceBudgetLimits),
    };
    // Only include current_fiscal_year if a valid integer ID is selected
    if (form.defaultFiscalYear && !Number.isNaN(Number(form.defaultFiscalYear))) {
      patch.current_fiscal_year = Number(form.defaultFiscalYear);
    }
    await axiosInstance.patch(`${SETTINGS_URL}1/`, patch);
    await mutate(SETTINGS_URL);
  };

  return {
    budgetSettings,
    fiscalYears,
    overview,
    budgetPolicy,
    loading: settingsLoading || fyLoading,
    error,
    actions: {
      updateBudgetSettings,
    },
  };
}
