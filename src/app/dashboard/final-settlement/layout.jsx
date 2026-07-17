'use client';

import { PermissionBasedGuard } from 'src/auth/guard';

export default function FinalSettlementLayout({ children }) {
  return (
    <PermissionBasedGuard requiredPermission={['view_finalsettlement', 'add_finalsettlement']}>
      {children}
    </PermissionBasedGuard>
  );
}
