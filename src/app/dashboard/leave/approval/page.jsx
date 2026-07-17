import { CONFIG } from 'src/config-global';

import { LeaveApprovalListView } from 'src/sections/leave/view';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Leave Approval List | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard
      requiredPermission={['view_leaveapproval', 'change_leaveapproval']}
      allowSupervisor
    >
      <LeaveApprovalListView />
    </PermissionBasedGuard>
  );
}
