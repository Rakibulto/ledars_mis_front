import { CONFIG } from 'src/config-global';

import { LeaveCalendarView } from 'src/sections/leave/view';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Leave Calendar | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission={['view_leaverequest']}>
      <LeaveCalendarView />
    </PermissionBasedGuard>
  );
}
