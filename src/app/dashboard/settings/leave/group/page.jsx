import { CONFIG } from 'src/config-global';

import { LeaveGroupView } from 'src/sections/settings';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Leave Group List | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission="view_leavegroup">
      <LeaveGroupView />
    </PermissionBasedGuard>
  );
}
