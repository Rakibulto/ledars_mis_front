import { CONFIG } from 'src/config-global';

import { AdjustmentForm } from 'src/sections/attendance/view';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Adjustment Form | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard
      requiredPermission={['add_attendanceadjustmentrequest', 'view_attendanceadjustmentrequest']}
    >
      <AdjustmentForm />
    </PermissionBasedGuard>
  );
}
