import { CONFIG } from 'src/config-global';

import { UserListView } from 'src/sections/user/view';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Employee List | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission="view_employee">
      <UserListView />
    </PermissionBasedGuard>
  );
}
