import { CONFIG } from 'src/config-global';

import { PayrollDetailView } from 'src/sections/payroll/view';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Payroll Detail | Dashboard - ${CONFIG.appName}` };

export default async function Page({ params }) {
  const { id } = await params;

  return (
    <PermissionBasedGuard requiredPermission={['view_payroll']}>
      <PayrollDetailView id={id} />
    </PermissionBasedGuard>
  );
}
