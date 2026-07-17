import { CreateAdvanceView } from 'src/sections/project-managements/expenses/advances/create-advance-view';

import { PermissionBasedGuard } from 'src/auth/guard';

export const metadata = { title: 'Create Advance' };

export default function CreateAdvancePage() {
  return (
    <PermissionBasedGuard requiredPermission="add_advance">
      <CreateAdvanceView />
    </PermissionBasedGuard>
  );
}
