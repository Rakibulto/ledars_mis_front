import { CONFIG } from 'src/config-global';

import { AttendanceQuickAddEditForm } from 'src/sections/user/attendance-quick-add-edit-form';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Web Login | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission={['add_attendancedata']}>
      <AttendanceQuickAddEditForm currentEntry={{}} open onClose={null} noDialog />
    </PermissionBasedGuard>
  );
}
