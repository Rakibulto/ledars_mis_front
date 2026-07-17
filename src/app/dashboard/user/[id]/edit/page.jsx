import { CONFIG } from 'src/config-global';

import { AccountView } from 'src/sections/account/view';

import { PermissionBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Employee Edit | Dashboard - ${CONFIG.appName}` };

export default async function Page({ params }) {
  const { id } = await params;

  return (
    <PermissionBasedGuard requiredPermission="change_employee">
      <AccountView id={id} />
    </PermissionBasedGuard>
  );
}
