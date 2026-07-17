'use client';

import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

// ── World currencies list ────────────────────────────────────────────────────
export const WORLD_CURRENCIES = [
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', flag: '🇧🇩' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', flag: '🇵🇰' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷' },
];

// Default exchange rates: how many BDT equals 1 unit of the currency
// e.g. 1 USD = 110 BDT → USD: 110
export const DEFAULT_EXCHANGE_RATES = {
  BDT: 1,
  USD: 110,
  EUR: 120,
  GBP: 140,
  JPY: 0.75,
  CAD: 82,
  AUD: 72,
  CHF: 122,
  CNY: 15,
  INR: 1.32,
  SGD: 82,
  HKD: 14,
  AED: 30,
  SAR: 29,
  MYR: 25,
  KRW: 0.083,
  THB: 3.1,
  IDR: 0.0069,
  PKR: 0.39,
  TRY: 3.4,
};

const STORAGE_KEY_CURRENCY = 'af_active_currency';
const STORAGE_KEY_RATES = 'af_exchange_rates';

// ── Context ───────────────────────────────────────────────────────────────────
const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [activeCurrencyCode, setActiveCurrencyCode] = useState(() => {
    if (typeof window === 'undefined') return 'BDT';
    return localStorage.getItem(STORAGE_KEY_CURRENCY) || 'BDT';
  });

  const [exchangeRates, setExchangeRates] = useState(() => {
    if (typeof window === 'undefined') return { ...DEFAULT_EXCHANGE_RATES };
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RATES);
      return stored
        ? { ...DEFAULT_EXCHANGE_RATES, ...JSON.parse(stored) }
        : { ...DEFAULT_EXCHANGE_RATES };
    } catch {
      return { ...DEFAULT_EXCHANGE_RATES };
    }
  });

  const activeCurrency = useMemo(
    () => WORLD_CURRENCIES.find((c) => c.code === activeCurrencyCode) ?? WORLD_CURRENCIES[0],
    [activeCurrencyCode]
  );

  // Keep utils.js module-level state in sync so formatCurrency() uses active currency
  useEffect(() => {
    // Imported lazily to avoid circular dep issues during SSR
    import('./utils').then((mod) => {
      if (typeof mod._setCurrencyGlobal === 'function') {
        mod._setCurrencyGlobal(activeCurrencyCode, exchangeRates);
      }
    });
  }, [activeCurrencyCode, exchangeRates]);

  const setActiveCurrency = useCallback((code) => {
    setActiveCurrencyCode(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CURRENCY, code);
    }
  }, []);

  const updateExchangeRate = useCallback((code, rate) => {
    setExchangeRates((prev) => {
      const next = { ...prev, [code]: Number(rate) };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const updateAllRates = useCallback((rates) => {
    setExchangeRates((prev) => {
      const next = { ...prev, ...rates };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  // Convert amount from fromCurrency to activeCurrency
  // Rates: 1 unit = X BDT → BDT_amount = amount * rates[from]; active_amount = BDT_amount / rates[to]
  const convertAmount = useCallback(
    (amount, fromCurrency = 'BDT') => {
      const num = Number(amount || 0);
      if (fromCurrency === activeCurrencyCode) return num;
      const fromRate = exchangeRates[fromCurrency] ?? 1;
      const toRate = exchangeRates[activeCurrencyCode] ?? 1;
      return (num * fromRate) / toRate;
    },
    [activeCurrencyCode, exchangeRates]
  );

  // Format amount with conversion and active currency symbol
  const formatAmount = useCallback(
    (amount, fromCurrency = 'BDT') => {
      const converted = convertAmount(amount, fromCurrency);
      return `${activeCurrency.symbol}${converted.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [activeCurrency, convertAmount]
  );

  const value = useMemo(
    () => ({
      activeCurrency,
      activeCurrencyCode,
      exchangeRates,
      setActiveCurrency,
      updateExchangeRate,
      updateAllRates,
      convertAmount,
      formatAmount,
    }),
    [
      activeCurrency,
      activeCurrencyCode,
      exchangeRates,
      setActiveCurrency,
      updateExchangeRate,
      updateAllRates,
      convertAmount,
      formatAmount,
    ]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx)
    throw new Error('useCurrency must be used inside CurrencyProvider (accounting-finance layout)');
  return ctx;
}
