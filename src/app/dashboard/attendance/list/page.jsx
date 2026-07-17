import { CONFIG } from 'src/config-global';

import { AttendanceView } from 'src/sections/attendance/view';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Attendance List | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission={['view_attendance']}>
      <AttendanceView />
    </PermissionBasedGuard>
  );
}
