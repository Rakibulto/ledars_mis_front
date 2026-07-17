import React from 'react';

import { paths } from 'src/routes/paths';

import InventoryLogDetails from 'src/sections/store&inventory/inventory-log/inventory-log-details';

export default function InventoryLogHistoryDetailsPage() {
  return (
    <InventoryLogDetails
      backHref={paths.dashboard.storeInventory.inventoryLogHistory}
      backLabel="Back to History"
      quickReturnLabel="Return To History"
      detailRouteMode="history"
    />
  );
}
