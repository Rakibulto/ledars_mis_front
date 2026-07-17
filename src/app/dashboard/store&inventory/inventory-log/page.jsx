import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

export default function InventoryLogPage() {
  redirect(paths.dashboard.storeInventory.inventoryLogList);
}
