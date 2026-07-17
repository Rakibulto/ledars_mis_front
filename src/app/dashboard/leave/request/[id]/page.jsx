import { CONFIG } from 'src/config-global';

import LeaveRequestDetailView from 'src/sections/leave/view/leave-request-detail-view';

export const metadata = { title: `Leave Request Details | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <LeaveRequestDetailView />;
}
