import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

export default function ReceiptChooserRedirectPage() {
  redirect(paths.dashboard.accountsGateway.voucherMenu('receipt'));
}
