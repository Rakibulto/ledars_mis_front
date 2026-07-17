import { CONFIG } from 'src/config-global';

import { CentralDashboardMain } from 'src/sections/central-dashboard';

// ----------------------------------------------------------------------

export const metadata = { title: `Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <CentralDashboardMain />;
}
