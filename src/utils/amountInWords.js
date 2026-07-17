// utils/amountInWords.js

import { toWords } from 'number-to-words';

export const getAmountInWords = (amount) => {
  const numericAmount = Number(amount || 0);

  if (numericAmount <= 0) return '';

  return `${toWords(numericAmount)
    .replace(/,/g, '')
    .replace(/^./, (c) => c.toUpperCase())} Taka only`;
};
