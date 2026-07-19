import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

/** Legacy path — projects moved to /accounts-gateway/projects */
export default function MastersProjectsRedirectPage() {
  redirect(paths.dashboard.accountsGateway.projects);
}
