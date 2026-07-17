'use client';

import { PermissionBasedGuard } from 'src/auth/guard';

export default function DonorsLayout({ children }) {
  return (
    <PermissionBasedGuard requiredPermission={['view_donor', 'view_donorledger']}>
      {children}
    </PermissionBasedGuard>
  );
}
