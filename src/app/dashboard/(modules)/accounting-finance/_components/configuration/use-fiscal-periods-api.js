'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// Backend has draft/open/closed. We display 'draft' as 'future' (not yet opened).
function toDisplayStatus(status) {
  return status === 'draft' ? 'future' : status;
}

// ------------------------------------------------------------
// Enrich a raw FiscalPeriod into the display shape the table expects
// ------------------------------------------------------------
function enrichPeriod(period, fiscalYears) {
  const year = fiscalYears.find((y) => Number(y.id) === Number(period.fiscal_year));
  const displayStatus = toDisplayStatus(period.status);
  const isClosed = period.status === 'closed';

  return {
    ...period,
    // Normalise to display status so STATUS_COLORS works unchanged
    status: displayStatus,
    fiscalYearName: period.fiscal_year_name || year?.name || `Year ${period.fiscal_year}`,
    lockState: isClosed ? 'Period locked — no new postings allowed' : 'Period open for posting',
    controlNote: isClosed
      ? 'Requires controller override to reopen'
      : 'Within normal accounting window',
    stateMachine: isClosed
      ? 'Closed → Awaiting year-end carry-forward'
      : displayStatus === 'future'
        ? 'Draft → Will open on period start date'
        : 'Open → Close when period is complete',
    reopenAllowed: isClosed,
  };
}

// ------------------------------------------------------------
// Hook — drop-in for the fiscal periods slice
// ------------------------------------------------------------
export function useFiscalPeriodsApi() {
  const periodsUrl = endpoints.accounting.fiscal_periods;
  const yearsUrl = endpoints.accounting.fiscal_years;

  const { data: rawPeriods, isLoading, error } = useSWR(periodsUrl, fetcher);
  // Reuse cached fiscal years (same SWR key as fiscal-year page)
  const { data: rawYears } = useSWR(yearsUrl, fetcher);

  const fiscalYears = useMemo(() => {
    if (Array.isArray(rawYears)) return rawYears;
    if (Array.isArray(rawYears?.results)) return rawYears.results;
    return [];
  }, [rawYears]);

  const fiscalPeriods = useMemo(() => {
    const list = Array.isArray(rawPeriods)
      ? rawPeriods
      : Array.isArray(rawPeriods?.results)
        ? rawPeriods.results
        : [];
    return list.map((p) => enrichPeriod(p, fiscalYears));
  }, [rawPeriods, fiscalYears]);

  const overview = useMemo(
    () => ({
      openPeriods: fiscalPeriods.filter((p) => p.status === 'open').length,
      futurePeriods: fiscalPeriods.filter((p) => p.status === 'future').length,
      closedPeriods: fiscalPeriods.filter((p) => p.status === 'closed').length,
    }),
    [fiscalPeriods]
  );

  // ── Mutations ──────────────────────────────────────────────

  const generateFiscalPeriods = async (yearId) => {
    try {
      const response = await axiosInstance.post(
        endpoints.accounting.fiscal_year_generate_periods(yearId)
      );
      await Promise.all([mutate(periodsUrl), mutate(yearsUrl)]);
      return response.data;
    } catch (err) {
      const message =
        err?.response?.data?.detail || err?.message || 'Failed to generate fiscal periods';
      throw new Error(message);
    }
  };

  const closeFiscalPeriod = async (periodId) => {
    try {
      await axiosInstance.patch(endpoints.accounting.fiscal_period_by_id(periodId), {
        status: 'closed',
      });
      await mutate(periodsUrl);
    } catch (err) {
      const message =
        err?.response?.data?.detail || err?.message || 'Failed to close fiscal period';
      throw new Error(message);
    }
  };

  const reopenFiscalPeriod = async (periodId) => {
    try {
      await axiosInstance.patch(endpoints.accounting.fiscal_period_by_id(periodId), {
        status: 'open',
      });
      await mutate(periodsUrl);
    } catch (err) {
      const message =
        err?.response?.data?.detail || err?.message || 'Failed to reopen fiscal period';
      throw new Error(message);
    }
  };

  // Expose open fiscal year for the "Generate Periods" button
  const openYear = fiscalYears.find((y) => y.status !== 'closed') || null;

  return {
    fiscalPeriods,
    fiscalYears,
    openYear,
    overview,
    loading: isLoading,
    error,
    actions: {
      generateFiscalPeriods,
      closeFiscalPeriod,
      reopenFiscalPeriod,
    },
  };
}
