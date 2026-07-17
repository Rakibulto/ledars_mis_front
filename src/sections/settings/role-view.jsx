'use client';

import { z as zod } from 'zod';

import { createRole, updateRole, deleteRole, useGetRoles } from 'src/actions/settings';

import { SettingsEntityView } from './settings-entity-view';

// Schema for role validation
const RoleSchema = zod.object({
  name: zod.string().min(1, { message: 'Role name is required' }),
});

// Fields for form and table
const ROLE_FIELDS = [{ name: 'name', label: 'Role Name' }];

export function RolesView() {
  const { roles, rolesLoading, rolesError } = useGetRoles();

  return (
    <SettingsEntityView
      title="Role Management"
      entityName="Role"
      entityData={roles}
      fields={ROLE_FIELDS}
      schema={RoleSchema}
      isLoading={rolesLoading}
      hasError={rolesError}
      onAdd={createRole}
      onUpdate={updateRole}
      onDelete={deleteRole}
      permissionPrefix="role"
    />
  );
}
