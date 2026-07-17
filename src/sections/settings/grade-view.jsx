'use client';

import { z as zod } from 'zod';

import { createGrade, updateGrade, deleteGrade, useGetGrades } from 'src/actions/settings';

import { SettingsEntityView } from './settings-entity-view';

// Schema for grade validation
const GradeSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required' }),
});

// Fields for form and table
const GRADE_FIELDS = [{ name: 'name', label: 'Name' }];

export function GradeView() {
  const { grades, gradesLoading, gradesError } = useGetGrades();

  return (
    <SettingsEntityView
      title="Grade Management"
      entityName="Grade"
      entityData={grades}
      fields={GRADE_FIELDS}
      schema={GradeSchema}
      isLoading={gradesLoading}
      hasError={gradesError}
      onAdd={createGrade}
      onUpdate={updateGrade}
      onDelete={deleteGrade}
      permissionPrefix="grade"
    />
  );
}
