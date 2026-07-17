'use client';

import InventoryLogHistoryMain from '../inventory-log/inventory-log-history-main';

export default function StockMovesHistoryMain() {
  return (
    <InventoryLogHistoryMain
      title="Stock Moves History"
      description="Review the movement ledger across receipts, issues, transfers, and adjustments to support reconciliation and audit follow-up."
    />
  );
}
