import { CONFIG } from 'src/config-global';

import { WorkspaceTabs } from 'src/sections/overview/app/view';
import { CentralDashboardMain } from 'src/sections/central-dashboard';

// ----------------------------------------------------------------------

export const metadata = { title: `Dashboard - ${CONFIG.appName}` };

export default function Page() {
  // return <WorkspaceTabs />;
  return <CentralDashboardMain />;
}
