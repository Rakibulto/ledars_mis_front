import { CONFIG } from 'src/config-global';

import { PermissionGroupView } from 'src/sections/settings/permission-group-view';

export const metadata = { title: `Permission Groups | ${CONFIG.appName}` };

export default function Page() {
  return <PermissionGroupView />;
}
