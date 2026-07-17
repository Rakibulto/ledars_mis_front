import { CONFIG } from 'src/config-global';

import { CalendarView } from 'src/sections/holiday/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Holiday Calendar | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <CalendarView />;
}
