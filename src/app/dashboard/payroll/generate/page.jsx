import { CONFIG } from 'src/config-global';

import { PayrollGenerateView } from 'src/sections/payroll/view';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Generate Payroll | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission={['add_payroll']}>
      <PayrollGenerateView />
    </PermissionBasedGuard>
  );
}
