import { CONFIG } from 'src/config-global';

import { LeaveRequestListView } from 'src/sections/leave/view';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Leave Request List | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission={['view_leaverequest', 'add_leaverequest']}>
      <LeaveRequestListView />
    </PermissionBasedGuard>
  );
}
