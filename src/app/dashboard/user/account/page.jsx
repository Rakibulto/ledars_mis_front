import { CONFIG } from 'src/config-global';

import { AccountView } from 'src/sections/account/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Account Settings | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <AccountView />;
}
