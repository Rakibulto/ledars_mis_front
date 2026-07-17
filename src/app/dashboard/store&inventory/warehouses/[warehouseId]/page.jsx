'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { paths } from 'src/routes/paths';

export default function WarehouseDetailRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.warehouseId) ? params.warehouseId[0] : params?.warehouseId;

  useEffect(() => {
    if (id) router.replace(paths.dashboard.storeInventory.warehouseSettingsDetail(id));
  }, [id, router]);

  return null;
}
