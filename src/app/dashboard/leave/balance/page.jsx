import { CONFIG } from 'src/config-global';

import { LeaveBalanceListView } from 'src/sections/leave/view';

import { PermissionBasedGuard } from 'src/auth/guard/permission-based-guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Leave Balance | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard allowSupervisor>
      <LeaveBalanceListView />
    </PermissionBasedGuard>
  );
}
