import InventoryLogHistoryMain from 'src/sections/store&inventory/inventory-log/inventory-log-history-main';

export default function OperationInventoryLogHistoryPage() {
  return (
    <InventoryLogHistoryMain
      title="Operations Inventory Log"
      description="Use the operations inventory log to audit every GRN, GIN, transfer, and adjustment event with timestamp, movement direction, and document reference."
    />
  );
}
