import { CONFIG } from 'src/config-global';

import { PermissionsView } from 'src/sections/settings/permissions-view';

export const metadata = { title: `Module Permissions | ${CONFIG.appName}` };

export default function Page() {
  return <PermissionsView />;
}
