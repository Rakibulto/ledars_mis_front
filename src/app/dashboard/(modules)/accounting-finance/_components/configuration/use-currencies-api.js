'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ------------------------------------------------------------
// Enrich a raw backend Currency record with display fields.
// exchangeRates is the full list from /api/acc-exchange-rates/
// ------------------------------------------------------------
function enrichCurrency(currency, exchangeRates) {
  const latestRate = exchangeRates
    .filter((r) => Number(r.currency) === Number(currency.id))
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  return {
    ...currency,
    active: currency.is_active !== false,
    precision: Number(currency.decimal_places ?? 2),
    exchange_rate: latestRate ? Number(latestRate.rate) : currency.is_base ? 1 : 0,
    lastRateDate: latestRate?.date || '—',
    source: latestRate?.source || 'Manual',
    // UI-only derived labels
    roundingMethod: 'Round half-up',
    gainLossAutomation: 'Monthly unrealized FX revaluation',
    triangulation: currency.is_base
      ? 'Base reporting currency'
      : currency.code === 'EUR'
        ? 'ECB cross-rate'
        : 'Donor settlement anchor',
  };
}

// ------------------------------------------------------------
// Hook — drop-in replacement for the currencies slice that the
// currencies.jsx page needs from useReferenceConfigWorkspace.
// ------------------------------------------------------------
export function useCurrenciesApi() {
  const currenciesUrl = endpoints.accounting.currencies;
  const ratesUrl = endpoints.accounting.exchange_rates;

  const {
    data: rawCurrencies,
    isLoading: currenciesLoading,
    error,
  } = useSWR(currenciesUrl, fetcher);
  const { data: rawRates, isLoading: ratesLoading } = useSWR(ratesUrl, fetcher);

  const exchangeRates = useMemo(() => {
    if (Array.isArray(rawRates)) return rawRates;
    if (Array.isArray(rawRates?.results)) return rawRates.results;
    return [];
  }, [rawRates]);

  const currencies = useMemo(() => {
    const list = Array.isArray(rawCurrencies)
      ? rawCurrencies
      : Array.isArray(rawCurrencies?.results)
        ? rawCurrencies.results
        : [];
    return list.map((c) => enrichCurrency(c, exchangeRates));
  }, [rawCurrencies, exchangeRates]);

  const overview = useMemo(
    () => ({
      activeCurrencies: currencies.filter((c) => c.active).length,
      inactiveCurrencies: currencies.filter((c) => !c.active).length,
      liveRateSources: new Set(exchangeRates.map((r) => r.source).filter(Boolean)).size,
    }),
    [currencies, exchangeRates]
  );

  const alerts = useMemo(() => {
    const result = [];
    const missingRate = currencies.filter(
      (c) => !c.is_base && !exchangeRates.find((r) => Number(r.currency) === Number(c.id))
    );
    if (missingRate.length > 0) {
      result.push({
        id: 'missing-rates',
        severity: 'warning',
        title: `${missingRate.length} active currency(s) are missing exchange rates`,
        description: 'Configure exchange rates before posting transactions in these currencies.',
      });
    }
    if (!result.length) {
      result.push({
        id: 'currency-steady',
        severity: 'success',
        title: 'Currency configuration is in a controlled state',
        description: 'All active currencies have exchange rates and are ready for posting.',
      });
    }
    return result;
  }, [currencies, exchangeRates]);

  // ── Mutations ──────────────────────────────────────────────

  const createCurrency = async (payload) => {
    await axiosInstance.post(currenciesUrl, {
      code: payload.code,
      name: payload.name,
      symbol: payload.symbol,
      is_base: Boolean(payload.is_base),
      decimal_places: Number(payload.precision ?? 2),
      is_active: true,
    });
    await mutate(currenciesUrl);
  };

  const toggleCurrencyStatus = async (currencyId) => {
    const currency = currencies.find((c) => String(c.id) === String(currencyId));
    if (!currency) return;
    await axiosInstance.patch(endpoints.accounting.currency_by_id(currencyId), {
      is_active: !currency.active,
    });
    await mutate(currenciesUrl);
  };

  const updateCurrency = async (id, payload) => {
    await axiosInstance.patch(endpoints.accounting.currency_by_id(id), {
      code: payload.code,
      name: payload.name,
      symbol: payload.symbol,
      decimal_places: Number(payload.precision ?? 2),
    });
    await mutate(currenciesUrl);
  };

  const deleteCurrency = async (id) => {
    await axiosInstance.delete(endpoints.accounting.currency_by_id(id));
    await mutate(currenciesUrl);
  };

  return {
    currencies,
    exchangeRates,
    overview,
    alerts,
    loading: currenciesLoading || ratesLoading,
    error,
    actions: {
      createCurrency,
      toggleCurrencyStatus,
      updateCurrency,
      deleteCurrency,
    },
  };
}
