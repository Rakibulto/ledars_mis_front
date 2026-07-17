'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ── Enrichment ─────────────────────────────────────────────

function enrichExchangeRate(rate, currencies, baseCurrencyCode) {
  // Resolve currency FK → display info
  const toCurrency = currencies.find(
    (c) => c.id === rate.currency || c.id === Number(rate.currency)
  );
  const toCode = toCurrency?.code || String(rate.currency);
  const toSymbol = toCurrency?.symbol || toCode;

  const rateNum = Number(rate.rate || 0);
  const varianceFlag = rateNum > 125 ? 'watch' : 'stable';

  const src = (rate.source || '').toLowerCase();
  const importMode = src && src !== 'manual' && src !== '' ? 'Feed import' : 'Single entry';

  return {
    ...rate,
    // Display aliases
    from_currency: baseCurrencyCode || 'BDT',
    to_currency: toCode,
    toSymbol,
    effective_date: rate.date,
    inverseRate: Number(rate.inverse_rate || 0),
    // Derived UI fields
    varianceFlag,
    importMode,
    gainLossAutomation: 'Balance sheet revaluation at period close',
    active: true,
  };
}

// ── Hook ────────────────────────────────────────────────────

export function useExchangeRatesApi() {
  const ratesUrl = endpoints.accounting.exchange_rates;
  const currenciesUrl = endpoints.accounting.currencies;

  const { data: rawRates, isLoading: ratesLoading, error } = useSWR(ratesUrl, fetcher);
  const { data: rawCurrencies, isLoading: currenciesLoading } = useSWR(currenciesUrl, fetcher);

  const currencies = useMemo(() => {
    if (Array.isArray(rawCurrencies)) return rawCurrencies;
    if (Array.isArray(rawCurrencies?.results)) return rawCurrencies.results;
    return [];
  }, [rawCurrencies]);

  // Determine base currency code (first with is_base=true, fallback first entry)
  const baseCurrencyCode = useMemo(
    () => currencies.find((c) => c.is_base)?.code || currencies[0]?.code || 'BDT',
    [currencies]
  );

  const exchangeRates = useMemo(() => {
    const list = Array.isArray(rawRates)
      ? rawRates
      : Array.isArray(rawRates?.results)
        ? rawRates.results
        : [];
    return list
      .map((r) => enrichExchangeRate(r, currencies, baseCurrencyCode))
      .sort((a, b) => b.id - a.id);
  }, [rawRates, currencies, baseCurrencyCode]);

  const overview = useMemo(
    () => ({
      liveRateSources: new Set(exchangeRates.map((r) => r.source).filter(Boolean)).size,
    }),
    [exchangeRates]
  );

  // ── Mutations ──────────────────────────────────────────────

  /**
   * Payload shape (from currency-exchange-rates.jsx form):
   *   { from_currency, to_currency (code), rate, date, source, import_mode, gain_loss_automation }
   */
  const createExchangeRate = async (payload) => {
    // Resolve to_currency code → FK id
    const toCurrency = currencies.find(
      (c) => c.code.toLowerCase() === (payload.to_currency || '').toLowerCase()
    );
    if (!toCurrency) {
      throw new Error(`Currency "${payload.to_currency}" not found`);
    }

    await axiosInstance.post(ratesUrl, {
      currency: toCurrency.id,
      date: payload.date,
      rate: Number(payload.rate),
      source: payload.source || 'Manual',
    });
    await mutate(ratesUrl);
  };

  /** Re-fetch from backend (used by Sync button) */
  const syncExchangeRates = async () => {
    await mutate(ratesUrl);
  };

  const updateExchangeRate = async (id, payload) => {
    const toCurrency = currencies.find(
      (c) => c.code === payload.to_currency || String(c.id) === String(payload.currency)
    );
    await axiosInstance.patch(endpoints.accounting.exchange_rate_by_id(id), {
      currency: toCurrency?.id ?? payload.currency,
      date: payload.date,
      rate: Number(payload.rate),
      source: payload.source || 'Manual',
    });
    await mutate(ratesUrl);
  };

  const deleteExchangeRate = async (id) => {
    await axiosInstance.delete(endpoints.accounting.exchange_rate_by_id(id));
    await mutate(ratesUrl);
  };

  return {
    exchangeRates,
    currencies,
    overview,
    loading: ratesLoading || currenciesLoading,
    error,
    actions: {
      createExchangeRate,
      syncExchangeRates,
      updateExchangeRate,
      deleteExchangeRate,
    },
  };
}
