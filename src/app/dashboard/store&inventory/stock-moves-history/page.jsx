import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

export default function StockMovesHistoryPage() {
  redirect(paths.dashboard.storeInventory.inventoryLogHistory);
}
