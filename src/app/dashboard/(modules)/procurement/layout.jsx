'use client';

import { PermissionBasedGuard } from 'src/auth/guard';

const PROCUREMENT_VIEW_PERMISSIONS = [
  'view_materialrequisition',
  'view_rfq',
  'view_vendorquotation',
  'view_comparativestatement',
  'view_award',
  'view_workorder',
  'view_directpurchase',
  'view_goodsreceiptnote',
  'view_warehouse',
  'view_paymentrequisition',
  'view_treasuryprocessing',
  'view_vendorverification',
  'view_vendorcategory',
  'view_procurementnotification',
  'view_approvalmatrix',
  'view_usermanagement',
];

export default function ProcurementLayout({ children }) {
  return (
    <PermissionBasedGuard requiredPermission={PROCUREMENT_VIEW_PERMISSIONS}>
      {children}
    </PermissionBasedGuard>
  );
}
