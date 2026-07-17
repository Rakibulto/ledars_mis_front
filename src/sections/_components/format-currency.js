import { number } from 'zod';

/**
 * Format currency value with BDT symbol (৳) and K suffix
 * @param {number} value - The value to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value) {
  const num = Number(value);

  if (!num || Number.isNaN(num)) return '৳0';

  const decimals = 2;
  const kValue = num / 1000;

  return `৳${kValue.toFixed(decimals)}K`;
}

/**
 * Format large numbers with appropriate suffix (K, M, B)
 * @param {number} value - The value to format
 * @returns {string} Formatted currency string
 */
export function formatCurrencyAuto(value) {
  const num = Number(value);

  if (!num || Number.isNaN(num)) return '৳0';

  // Control decimal places here
  const decimals = 2;
  const absValue = Math.abs(num);

  if (absValue >= 1000000000) {
    // Billion
    return `৳${(num / 1000000000).toFixed(decimals)}B`;
  }
  if (absValue >= 1000000) {
    // Million
    return `৳${(num / 1000000).toFixed(decimals)}M`;
  }
  if (absValue >= 1000) {
    // Thousand
    return `৳${(num / 1000).toFixed(decimals)}K`;
  }

  return `৳${num.toFixed(decimals)}`;
}

/**
 * Format currency with comma separators
 * @param {number} value - The value to format
 * @returns {string} Formatted currency string with commas
 */
export function formatCurrencyWithCommas(value) {
  const num = Number(value);
  if (!num || Number.isNaN(num)) return '৳0';

  // Control decimal places here
  const decimals = 2;

  const formatted = num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `৳${formatted}`;
}
