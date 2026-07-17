import { CONFIG } from 'src/config-global';

import { CutOffDateView } from 'src/sections/settings';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Cut Off Date | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission="view_cutoff">
      <CutOffDateView />
    </PermissionBasedGuard>
  );
}
