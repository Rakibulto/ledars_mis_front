import { CONFIG } from 'src/config-global';

import { MonthlyAttendanceView } from 'src/sections/attendance/view';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Monthly Attendance | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard
      requiredPermission={[
        'view_own_attendance',
        'view_subordinate_attendance',
        'view_attendancedata',
      ]}
    >
      <MonthlyAttendanceView />
    </PermissionBasedGuard>
  );
}
