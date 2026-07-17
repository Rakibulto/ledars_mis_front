import { CONFIG } from 'src/config-global';

import { DesignationView } from 'src/sections/settings';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Designation List | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission="view_designation">
      <DesignationView />
    </PermissionBasedGuard>
  );
}
