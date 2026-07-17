import { CONFIG } from 'src/config-global';

import { LeavePolicyView } from 'src/sections/settings';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Leave Policy List | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission="view_leavepolicy">
      <LeavePolicyView />
    </PermissionBasedGuard>
  );
}
