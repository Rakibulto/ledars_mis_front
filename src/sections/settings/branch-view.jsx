'use client';

import { z as zod } from 'zod';

import { createBranch, updateBranch, deleteBranch, useGetBranches } from 'src/actions/settings';

import { SettingsEntityView } from './settings-entity-view';

// Schema for branch validation
const BranchSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required' }),
});

// Fields for form and table
const BRANCH_FIELDS = [{ name: 'name', label: 'Name' }];

export function BranchView() {
  const { branches, branchesLoading, branchesError } = useGetBranches();

  return (
    <SettingsEntityView
      title="Branch Management"
      entityName="Branch"
      entityData={branches}
      fields={BRANCH_FIELDS}
      schema={BranchSchema}
      isLoading={branchesLoading}
      hasError={branchesError}
      onAdd={createBranch}
      onUpdate={updateBranch}
      onDelete={deleteBranch}
      permissionPrefix="branch"
    />
  );
}
