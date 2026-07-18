'use client';

import { PermissionBasedGuard } from 'src/auth/guard';

const PROJECT_MANAGEMENTS_VIEW_PERMISSIONS = [
  'view_projectmanagementproject',
  'view_projectmanagementunit',
  'view_projectmanagementplanworkitem',
  'view_projectmanagementexpense',
  'view_advance',
];

export default function ProjectManagementsLayout({ children }) {
  return (
    <PermissionBasedGuard requiredPermission={PROJECT_MANAGEMENTS_VIEW_PERMISSIONS}>
      {children}
    </PermissionBasedGuard>
  );
}
