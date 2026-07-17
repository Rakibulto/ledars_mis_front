import { CONFIG } from 'src/config-global';

import { HolidayListView } from 'src/sections/holiday/view';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Holiday List | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission={['view_holiday']}>
      <HolidayListView />
    </PermissionBasedGuard>
  );
}
