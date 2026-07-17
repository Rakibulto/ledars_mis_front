import { CONFIG } from 'src/config-global';

import { PasswordResetConfirmView } from 'src/auth/view/split';

// ----------------------------------------------------------------------

export const metadata = { title: `Reset Password Confirmation - ${CONFIG.appName}` };

export default function Page({ params }) {
  const { uid, token } = params;

  return <PasswordResetConfirmView uid={uid} token={token} />;
}
