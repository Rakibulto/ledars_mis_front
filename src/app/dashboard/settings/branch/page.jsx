import { CONFIG } from 'src/config-global';

import { BranchView } from 'src/sections/settings';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Branch List | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission="view_branch">
      <BranchView />
    </PermissionBasedGuard>
  );
}
