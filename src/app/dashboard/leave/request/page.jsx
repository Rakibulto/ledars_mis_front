import { CONFIG } from 'src/config-global';

import SupportiveForRequest from './_components/supportive_for_request';

// ----------------------------------------------------------------------

export const metadata = { title: `Leave Request List | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <SupportiveForRequest />;
}
