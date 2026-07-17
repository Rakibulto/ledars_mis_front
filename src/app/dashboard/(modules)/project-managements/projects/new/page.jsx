import CreateProject from '../../_components/create-project';

import { PermissionBasedGuard } from 'src/auth/guard';

export default function Page() {
  return (
    <PermissionBasedGuard requiredPermission="add_projectmanagementproject">
      <CreateProject />
    </PermissionBasedGuard>
  );
}
