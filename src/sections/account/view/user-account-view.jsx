'use client';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';

import { useTabs } from 'src/hooks/use-tabs';

import Loading from 'src/app/dashboard/loading';
import { useGetSalaries } from 'src/actions/salary';
import { useGetEmployee } from 'src/actions/employees';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserNewEditForm } from 'src/sections/user/user-new-edit-form';

import { useAuthContext } from 'src/auth/hooks';

import { AccountSalary } from '../account-salary';
import { LeaveBalanceDashboard } from '../leave-balance';
import { AccountPermissions } from '../account-permissions';
import { AccountChangePassword } from '../account-change-password';

// ----------------------------------------------------------------------

const TABS = [
  { value: 'general', label: 'General', icon: <Iconify icon="solar:user-id-bold" width={24} /> },
  { value: 'leave', label: 'Leave', icon: <Iconify icon="solar:calendar-mark-bold" width={24} /> },
  { value: 'security', label: 'Security', icon: <Iconify icon="ic:round-vpn-key" width={24} /> },
  { value: 'salary', label: 'Salary', icon: <Iconify icon="solar:wallet-money-bold" width={24} /> },
  {
    value: 'permissions',
    label: 'Permissions',
    icon: <Iconify icon="solar:shield-bold-duotone" width={24} />,
  },
];

// ----------------------------------------------------------------------

export function AccountView({ id }) {
  const { user } = useAuthContext();

  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  let initialTab = searchParams?.get('tab') || 'general';
  if (initialTab === 'permissions' && user?.role !== 'Admin') {
    initialTab = 'general';
  }

  const tabs = useTabs(initialTab);

  const { employee, employeeLoading } = useGetEmployee(id || user?.id);

  // Check if viewing own account
  const isSelf = !id || String(user?.id) === String(id);
  const isAdmin = user?.role === 'Admin';

  // Permission checks for salary
  const canViewSalary = (user?.user_permissions_list || []).some(
    (p) => p.codename === 'view_salary'
  );

  // Fetch salary for this employee only when on salary tab and user has permission
  // This prevents unnecessary API calls when on other tabs
  const { salaries = [], salariesLoading } = useGetSalaries(
    employee?.user?.id,
    !!employee?.user?.id && canViewSalary && tabs.value === 'salary'
  );

  if (employeeLoading || salariesLoading) {
    return <Loading />;
  }

  const filteredTabs = isAdmin
    ? TABS.filter((tab) => tab.value !== 'username')
    : TABS.filter(
        (tab) => tab.value !== 'permissions' && (tab.value !== 'salary' || canViewSalary)
      );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Account"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          ...(user?.role === 'Admin' ? [{ name: 'User', href: paths.dashboard.user.list }] : []),
          { name: 'Account' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs value={tabs.value} onChange={tabs.onChange} sx={{ mb: { xs: 3, md: 5 } }}>
        {filteredTabs.map((tab) => (
          <Tab key={tab.value} label={tab.label} icon={tab.icon} value={tab.value} />
        ))}
      </Tabs>

      {tabs.value === 'general' && <UserNewEditForm currentEmployee={employee} />}

      {tabs.value === 'leave' && <LeaveBalanceDashboard employee={employee} />}

      {tabs.value === 'security' && (
        <AccountChangePassword isSelf={isSelf} userId={id || user?.id} />
      )}

      {tabs.value === 'salary' && (
        <AccountSalary employee={employee} initialSalary={salaries?.length ? salaries[0] : null} />
      )}

      {tabs.value === 'permissions' && <AccountPermissions employee={employee} />}
    </DashboardContent>
  );
}
