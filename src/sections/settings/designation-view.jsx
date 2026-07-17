'use client';

import { z as zod } from 'zod';
import { useMemo } from 'react';

import {
  createDesignation,
  updateDesignation,
  deleteDesignation,
  useGetDepartments,
  useGetDesignations,
} from 'src/actions/settings';

import { SettingsEntityView } from './settings-entity-view';

// Schema for designation validation
const DesignationSchema = zod.object({
  department: zod
    .string()
    .min(1, { message: 'Department is required' })
    .or(zod.number().min(1, { message: 'Department is required' })),
  name: zod.string().min(1, { message: 'Name is required' }),
});

export function DesignationView() {
  const { designations, designationsLoading, designationsError } = useGetDesignations();
  const { departments } = useGetDepartments();

  // Create department options for select field
  const departmentOptions = useMemo(() => {
    if (!departments) return [];

    return departments.map((department) => ({
      value: department.id.toString(),
      label: department.name,
    }));
  }, [departments]);

  // Create department lookup map
  const departmentMap = useMemo(() => {
    if (!departments) return {};

    return departments.reduce((acc, dept) => {
      acc[dept.id] = dept.name;
      return acc;
    }, {});
  }, [departments]);

  // Define fields for form and table
  const DESIGNATION_FIELDS = useMemo(
    () => [
      {
        name: 'department',
        label: 'Department',
        type: 'select',
        options: departmentOptions,
        transform: (value) => departmentMap[value] || 'Unknown',
      },
      {
        name: 'name',
        label: 'Name',
      },
    ],
    [departmentOptions, departmentMap]
  );

  return (
    <SettingsEntityView
      title="Designation Management"
      entityName="Designation"
      entityData={designations}
      fields={DESIGNATION_FIELDS}
      schema={DesignationSchema}
      isLoading={designationsLoading}
      hasError={designationsError}
      onAdd={createDesignation}
      onUpdate={updateDesignation}
      onDelete={deleteDesignation}
      permissionPrefix="designation"
    />
  );
}
