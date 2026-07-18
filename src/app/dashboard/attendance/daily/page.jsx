import { CONFIG } from 'src/config-global';

import { DailyAttendanceView } from 'src/sections/attendance/view';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Daily Attendance | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard
      requiredPermission={['view_attendance', 'view_attendancedata']}
      allowSupervisor
    >
      <DailyAttendanceView />
    </PermissionBasedGuard>
  );
}
