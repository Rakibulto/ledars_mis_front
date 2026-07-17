'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ------------------------------------------------------------
// Enrich a raw FiscalYear + its periods into display shape
// ------------------------------------------------------------
function enrichFiscalYear(year, periods) {
  const yearPeriods = periods.filter((p) => Number(p.fiscal_year) === Number(year.id));
  const closedPeriods = yearPeriods.filter((p) => p.status === 'closed').length;
  const isClosed = year.status === 'closed';

  return {
    ...year,
    is_closed: isClosed,
    closedPeriods,
    totalPeriods: yearPeriods.length,
    closeReadiness: yearPeriods.length
      ? `${closedPeriods}/${yearPeriods.length} periods closed`
      : 'Periods not generated',
    nextAction: isClosed ? 'Archive and carry forward' : 'Review close readiness',
    lifecycleState: isClosed
      ? 'Closed and ready for carry-forward'
      : !yearPeriods.length
        ? 'Setup pending period generation'
        : closedPeriods === yearPeriods.length
          ? 'Ready to close year'
          : 'Period-by-period close in progress',
    reopenPolicy: isClosed
      ? 'Reopen requires controller and audit justification'
      : 'Year remains operational',
  };
}

// ------------------------------------------------------------
// Hook — drop-in for the fiscal year slice
// ------------------------------------------------------------
export function useFiscalYearApi() {
  const yearsUrl = endpoints.accounting.fiscal_years;
  const periodsUrl = endpoints.accounting.fiscal_periods;

  const { data: rawYears, isLoading, error } = useSWR(yearsUrl, fetcher);
  // Reuse cached periods (same SWR key as fiscal-periods page)
  const { data: rawPeriods } = useSWR(periodsUrl, fetcher);

  const periodsList = useMemo(() => {
    if (Array.isArray(rawPeriods)) return rawPeriods;
    if (Array.isArray(rawPeriods?.results)) return rawPeriods.results;
    return [];
  }, [rawPeriods]);

  const fiscalYears = useMemo(() => {
    const list = Array.isArray(rawYears)
      ? rawYears
      : Array.isArray(rawYears?.results)
        ? rawYears.results
        : [];
    return list.map((y) => enrichFiscalYear(y, periodsList));
  }, [rawYears, periodsList]);

  const overview = useMemo(
    () => ({
      openFiscalYears: fiscalYears.filter((y) => !y.is_closed).length,
      closedFiscalYears: fiscalYears.filter((y) => y.is_closed).length,
      closedPeriods: periodsList.filter((p) => p.status === 'closed').length,
    }),
    [fiscalYears, periodsList]
  );

  // ── Mutations ──────────────────────────────────────────────

  const createFiscalYear = async (payload) => {
    await axiosInstance.post(yearsUrl, {
      name: payload.name,
      start_date: payload.start_date,
      end_date: payload.end_date,
      status: payload.status || 'draft',
      is_active: true,
    });
    await mutate(yearsUrl);
  };

  const generateFiscalPeriods = async (yearId) => {
    const response = await axiosInstance.post(
      endpoints.accounting.fiscal_year_generate_periods(yearId)
    );
    // Refresh both so periods table and close readiness update together
    await Promise.all([mutate(yearsUrl), mutate(periodsUrl)]);
    return response.data;
  };

  const closeFiscalYear = async (yearId) => {
    await axiosInstance.post(endpoints.accounting.fiscal_year_close(yearId));
    await Promise.all([mutate(yearsUrl), mutate(periodsUrl)]);
  };

  const reopenFiscalYear = async (yearId) => {
    await axiosInstance.post(endpoints.accounting.fiscal_year_reopen(yearId));
    await mutate(yearsUrl);
  };

  const updateFiscalYear = async (id, payload) => {
    await axiosInstance.patch(endpoints.accounting.fiscal_year_by_id(id), {
      name: payload.name,
      start_date: payload.start_date,
      end_date: payload.end_date,
      status: payload.status,
    });
    await mutate(yearsUrl);
  };

  const deleteFiscalYear = async (id) => {
    await axiosInstance.delete(endpoints.accounting.fiscal_year_by_id(id));
    await mutate(yearsUrl);
  };

  return {
    fiscalYears,
    overview,
    loading: isLoading,
    error,
    actions: {
      createFiscalYear,
      generateFiscalPeriods,
      closeFiscalYear,
      reopenFiscalYear,
      updateFiscalYear,
      deleteFiscalYear,
    },
  };
}
