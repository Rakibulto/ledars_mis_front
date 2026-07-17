import { CONFIG } from 'src/config-global';

import { SpecialLeavePoliciesView } from 'src/sections/settings';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Special Leave Policies List | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission="view_specialleavepolicy">
      <SpecialLeavePoliciesView />
    </PermissionBasedGuard>
  );
}
