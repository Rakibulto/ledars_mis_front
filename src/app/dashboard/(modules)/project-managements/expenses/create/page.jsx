import { CreateAdvanceView } from '../advances/create-advance-view';

import { PermissionBasedGuard } from 'src/auth/guard';

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission={['add_projectmanagementexpense', 'add_advance']}>
      <CreateAdvanceView />
    </PermissionBasedGuard>
  );
}
