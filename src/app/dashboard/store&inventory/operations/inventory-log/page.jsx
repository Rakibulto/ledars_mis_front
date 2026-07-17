import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

export default function OperationInventoryLogPage() {
  redirect(paths.dashboard.storeInventory.operationInventoryLogHistory);
}
