import { CONFIG } from 'src/config-global';

import { SupervisorLevelView } from 'src/sections/settings';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Supervisor Level List | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission="view_supervisorlevel">
      <SupervisorLevelView />
    </PermissionBasedGuard>
  );
}
