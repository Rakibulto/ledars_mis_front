import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

/** Chooser moved to dashboard popup — keep URL for bookmarks */
export default function PaymentChooserRedirectPage() {
  redirect(paths.dashboard.accountsGateway.voucherMenu('payment'));
}
