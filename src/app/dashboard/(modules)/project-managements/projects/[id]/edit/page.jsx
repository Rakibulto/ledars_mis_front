import ProjectForm from '../../../_components/project-form';

import { PermissionBasedGuard } from 'src/auth/guard';

export default async function Page({ params }) {
  const { id } = await params;

  return (
    <PermissionBasedGuard requiredPermission="change_projectmanagementproject">
      <ProjectForm mode="edit" projectId={id} />
    </PermissionBasedGuard>
  );
}
