'use client';

import { useSetState } from 'src/hooks/use-set-state';

import { useGetEmployee } from 'src/actions/employees';
import { useGetLeaveBalanceByYear } from 'src/actions/leave';

import { LeaveRequestListView } from 'src/sections/leave/view';

import { useAuthContext } from 'src/auth/hooks';
import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export default function SupportiveForRequest() {
  const { user } = useAuthContext();
  const { employee, employeeLoading } = useGetEmployee(user?.id);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, idx) => currentYear - idx);

  const filters = useSetState({ year: currentYear, search: '' });

  const { data: leaveBalances = [], dataLoading } = useGetLeaveBalanceByYear(
    employee?.employee_id,
    filters.state.year
  );

  return (
    <PermissionBasedGuard requiredPermission={['view_leaverequest', 'add_leaverequest']}>
      <LeaveRequestListView leaveBalances={leaveBalances} />
    </PermissionBasedGuard>
  );
}
