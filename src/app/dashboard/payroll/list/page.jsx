import { CONFIG } from 'src/config-global';

import { PayrollListView } from 'src/sections/payroll/view';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Payroll List | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission={['view_payroll']}>
      <PayrollListView />
    </PermissionBasedGuard>
  );
}
