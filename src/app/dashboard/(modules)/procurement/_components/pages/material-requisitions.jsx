'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { paths } from 'src/routes/paths';

export function MaterialRequisitions() {
  const router = useRouter();

  useEffect(() => {
    router.push(paths.dashboard.procurement.requisitions.list);
  }, [router]);

  return null;
}
