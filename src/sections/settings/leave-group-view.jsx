'use client';

import { z as zod } from 'zod';
import { useMemo } from 'react';

import {
  createLeaveGroup,
  updateLeaveGroup,
  deleteLeaveGroup,
  useGetLeaveGroups,
} from 'src/actions/settings';

import { SettingsEntityView } from './settings-entity-view';

// Schema for leave group validation
const LeaveGroupSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required' }),
  description: zod.string().optional(),
});

export function LeaveGroupView() {
  const { leaveGroups, leaveGroupsLoading, leaveGroupsError } = useGetLeaveGroups();

  // Define fields for form and table
  const LEAVE_GROUP_FIELDS = useMemo(
    () => [
      {
        name: 'name',
        label: 'Name',
      },
      {
        name: 'description',
        label: 'Description',
      },
    ],
    []
  );

  return (
    <SettingsEntityView
      title="Leave Group Management"
      entityName="Leave Group"
      entityData={leaveGroups}
      fields={LEAVE_GROUP_FIELDS}
      schema={LeaveGroupSchema}
      isLoading={leaveGroupsLoading}
      hasError={leaveGroupsError}
      onAdd={createLeaveGroup}
      onUpdate={updateLeaveGroup}
      onDelete={deleteLeaveGroup}
      permissionPrefix="leavegroup"
    />
  );
}
