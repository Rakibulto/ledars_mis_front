import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

/** Contra removed from Gateway — redirect to vouchers hub */
export default function ContraVoucherRedirectPage() {
  redirect(paths.dashboard.accountsGateway.vouchers.root);
}
