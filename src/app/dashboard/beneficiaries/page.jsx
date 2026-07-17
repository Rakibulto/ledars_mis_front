import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

export default function BeneficiariesRootPage() {
  redirect(paths.dashboard.beneficiaries.dashboard);
}
