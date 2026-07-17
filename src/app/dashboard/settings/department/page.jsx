import { CONFIG } from 'src/config-global';

import { DepartmentView } from 'src/sections/settings';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Department List | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission="view_department">
      <DepartmentView />
    </PermissionBasedGuard>
  );
}
