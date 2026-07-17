import { CONFIG } from 'src/config-global';

import { PreapprovedIpView } from 'src/sections/settings';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Pre-approved IP List | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission="view_preapprovedip">
      <PreapprovedIpView />
    </PermissionBasedGuard>
  );
}
