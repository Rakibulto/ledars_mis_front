'use client';

import { PermissionBasedGuard } from 'src/auth/guard';

const INVENTORY_VIEW_PERMISSIONS = [
  'view_item',
  'view_category',
  'view_unitofmeasure',
  'view_gin',
  'view_stocktransfer',
  'view_stockadjustment',
  'view_scraprecord',
  'view_returnrecord',
  'view_locationstock',
  'view_stockmove',
  'view_warehouse',
  'view_storagelocation',
  'view_qualitycheck',
  'view_qualityalert',
  'view_qualitycontrolpoint',
  'view_inventorysettings',
];

export default function StoreInventoryLayout({ children }) {
  return (
    <PermissionBasedGuard requiredPermission={INVENTORY_VIEW_PERMISSIONS}>
      {children}
    </PermissionBasedGuard>
  );
}
