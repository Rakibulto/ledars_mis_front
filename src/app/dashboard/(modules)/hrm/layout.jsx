'use client';

import { PermissionBasedGuard } from 'src/auth/guard';

const HRM_VIEW_PERMISSIONS = [
  'view_employee',
  'view_attendancedata',
  'view_attendance',
  'view_holiday',
  'view_leaverequest',
  'view_payroll',
  'view_finalsettlement',
  'view_department',
  'view_shift',
];

export default function HrmLayout({ children }) {
  return (
    <PermissionBasedGuard requiredPermission={HRM_VIEW_PERMISSIONS} allowSupervisor>
      {children}
    </PermissionBasedGuard>
  );
}
