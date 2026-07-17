import { CONFIG } from 'src/config-global';

import { AttendanceApprovalView } from 'src/sections/attendance/view';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Attendance Approvals | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission={['view_attendanceadjustmentapproval']}>
      <AttendanceApprovalView />
    </PermissionBasedGuard>
  );
}
