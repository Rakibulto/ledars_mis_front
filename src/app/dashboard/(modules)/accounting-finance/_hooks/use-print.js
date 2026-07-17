'use client';

export function usePrint() {
  const print = () => window.print();
  return { print };
}
