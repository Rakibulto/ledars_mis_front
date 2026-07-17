import { CONFIG } from 'src/config-global';

import { ShiftView } from 'src/sections/settings';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Shift List | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission="view_shift">
      <ShiftView />
    </PermissionBasedGuard>
  );
}
