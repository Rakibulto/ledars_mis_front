'use client';

import { z as zod } from 'zod';

import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  useGetDepartments,
} from 'src/actions/settings';

import { SettingsEntityView } from './settings-entity-view';

// Schema for department validation
const DepartmentSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required' }),
});

// Fields for form and table
const DEPARTMENT_FIELDS = [{ name: 'name', label: 'Name' }];

export function DepartmentView() {
  const { departments, departmentsLoading, departmentsError } = useGetDepartments();

  return (
    <SettingsEntityView
      title="Department Management"
      entityName="Department"
      entityData={departments}
      fields={DEPARTMENT_FIELDS}
      schema={DepartmentSchema}
      isLoading={departmentsLoading}
      hasError={departmentsError}
      onAdd={createDepartment}
      onUpdate={updateDepartment}
      onDelete={deleteDepartment}
      permissionPrefix="department"
    />
  );
}
