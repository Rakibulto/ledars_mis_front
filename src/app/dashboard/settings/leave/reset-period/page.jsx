import { CONFIG } from 'src/config-global';

import { ResetPeriodView } from 'src/sections/settings';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Leave Reset Period | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission="view_leavereset">
      <ResetPeriodView />
    </PermissionBasedGuard>
  );
}
