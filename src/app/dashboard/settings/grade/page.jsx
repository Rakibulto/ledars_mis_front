import { CONFIG } from 'src/config-global';

import { GradeView } from 'src/sections/settings';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Grade List | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission="view_grade">
      <GradeView />
    </PermissionBasedGuard>
  );
}
