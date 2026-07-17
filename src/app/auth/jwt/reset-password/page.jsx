import { CONFIG } from 'src/config-global';

import { SplitResetPasswordView } from 'src/auth/view/split';

// ----------------------------------------------------------------------

export const metadata = { title: `Reset password - ${CONFIG.appName}` };

export default function Page() {
  return <SplitResetPasswordView />;
}
