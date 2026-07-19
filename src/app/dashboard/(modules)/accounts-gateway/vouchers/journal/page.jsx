import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

export default function JournalChooserRedirectPage() {
  redirect(paths.dashboard.accountsGateway.voucherMenu('journal'));
}
