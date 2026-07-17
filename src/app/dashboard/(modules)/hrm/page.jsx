import { CONFIG } from 'src/config-global';

import { WorkspaceTabs } from 'src/sections/overview/app/view';

// ----------------------------------------------------------------------

export const metadata = { title: `HRM Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <WorkspaceTabs />;
}
