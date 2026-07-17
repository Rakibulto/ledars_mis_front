'use client';

import { z as zod } from 'zod';
import { useMemo } from 'react';

import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useSetState } from 'src/hooks/use-set-state';

import { genderOptions, effectiveFromOptions } from 'src/_mock/options';
import {
  createLeavePolicy,
  updateLeavePolicy,
  deleteLeavePolicy,
  useGetLeaveGroups,
  useGetLeavePolicies,
} from 'src/actions/settings';

import { Label } from 'src/components/label';

import { SettingsEntityView } from './settings-entity-view';

// Schema for leave policy validation
const LeavePolicySchema = zod.object({
  leave_groups: zod
    .array(zod.coerce.number())
    .min(1, { message: 'At least one group is required' }),
  leave_type_name: zod.string().min(1, { message: 'Leave type name is required' }),
  total_leave_days: zod.coerce.number().min(1, { message: 'Total leave days is required' }),
  gender: zod.string().min(1, { message: 'Gender is required' }),
  apply_before_days: zod.coerce.number().min(0, { message: 'Apply before days is required' }),
  effective_from: zod.string().min(1, { message: 'Effective from is required' }),
  max_days_per_request: zod.coerce.number().min(1, { message: 'Max days per request is required' }),
  min_days_per_request: zod.coerce.number(),
  allow_half_day: zod.boolean(),
  count_holidays: zod.boolean(),
  count_weekends: zod.boolean(),
  is_active: zod.boolean(),
});

export function LeavePolicyView() {
  const { leavePolicies, leavePoliciesLoading, leavePoliciesError } = useGetLeavePolicies();
  const { leaveGroups } = useGetLeaveGroups();

  // Leave group options for select
  const leaveGroupOptions = useMemo(
    () =>
      (leaveGroups || []).map((group) => ({
        value: group.id,
        label: group.name,
      })),
    [leaveGroups]
  );

  const filterState = useSetState({ selectedGroup: '' });

  // Filter leavePolicies by selected group
  const filteredPolicies =
    filterState.state.selectedGroup && leavePolicies
      ? leavePolicies.filter((policy) =>
          Array.isArray(policy.leave_groups)
            ? policy.leave_groups.includes(Number(filterState.state.selectedGroup))
            : false
        )
      : leavePolicies;

  // Fields for form and table
  const LEAVE_POLICY_FIELDS = useMemo(
    () => [
      {
        name: 'leave_groups',
        label: 'Leave Groups',
        type: 'multiselect',
        options: leaveGroupOptions,
        multiple: true,
        transform: (value, entity) => (
          <Typography variant="subtitle2">
            {(entity.leave_groups_detail || []).map((g) => g.name).join(', ')}
          </Typography>
        ),
        defaultValue: [],
      },
      {
        name: 'leave_type_name',
        label: 'Leave Type Name',
        defaultValue: '',
      },
      {
        name: 'total_leave_days',
        label: 'Total Leave Days',
        type: 'number',
        defaultValue: 1,
      },
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        options: genderOptions,
        transform: (value) => {
          const genderColors = {
            male: 'info',
            female: 'secondary',
            any: 'default',
          };

          const label = genderOptions.find((g) => g.value === value)?.label || value;
          return (
            <Label color={genderColors[value] || 'default'} variant="soft">
              {label}
            </Label>
          );
        },
        defaultValue: genderOptions[0]?.value || 'any',
      },
      {
        name: 'apply_before_days',
        label: 'Apply Before (days)',
        type: 'number',
        defaultValue: 0,
      },
      {
        name: 'effective_from',
        label: 'Effective From',
        type: 'select',
        options: effectiveFromOptions,
        transform: (value) => {
          const effectiveColors = {
            joining: 'success',
            confirmation: 'warning',
            one_year: 'info',
          };

          const label = effectiveFromOptions.find((e) => e.value === value)?.label || value;
          return (
            <Label color={effectiveColors[value] || 'default'} variant="soft">
              {label}
            </Label>
          );
        },
        defaultValue: effectiveFromOptions[0]?.value || 'joining',
      },
      {
        name: 'max_days_per_request',
        label: 'Max Days/Request',
        type: 'number',
        defaultValue: 1,
      },
      {
        name: 'min_days_per_request',
        label: 'Min Days/Request',
        type: 'number',
        defaultValue: 1,
      },
      {
        name: 'allow_half_day',
        label: 'Allow Half Day',
        type: 'select',
        options: [
          { value: true, label: 'Yes' },
          { value: false, label: 'No' },
        ],
        transform: (value) => (
          <Label color={value ? 'success' : 'error'} variant="soft">
            {value ? 'Yes' : 'No'}
          </Label>
        ),
        defaultValue: true,
      },
      {
        name: 'count_holidays',
        label: 'Count Holidays',
        type: 'select',
        options: [
          { value: true, label: 'Yes' },
          { value: false, label: 'No' },
        ],
        transform: (value) => (
          <Label color={value ? 'warning' : 'default'} variant="soft">
            {value ? 'Yes' : 'No'}
          </Label>
        ),
        defaultValue: false,
      },
      {
        name: 'count_weekends',
        label: 'Count Weekends',
        type: 'select',
        options: [
          { value: true, label: 'Yes' },
          { value: false, label: 'No' },
        ],
        transform: (value) => (
          <Label color={value ? 'secondary' : 'default'} variant="soft">
            {value ? 'Yes' : 'No'}
          </Label>
        ),
        defaultValue: false,
      },
      {
        name: 'is_active',
        label: 'Active',
        type: 'select',
        options: [
          { value: true, label: 'Active' },
          { value: false, label: 'Inactive' },
        ],
        transform: (value) => (
          <Label color={value ? 'success' : 'error'} variant="soft">
            {value ? 'Active' : 'Inactive'}
          </Label>
        ),
        defaultValue: true,
      },
    ],
    [leaveGroupOptions]
  );

  return (
    <SettingsEntityView
      title="Leave Policy Management"
      entityName="Leave Policy"
      entityData={filteredPolicies}
      fields={LEAVE_POLICY_FIELDS}
      schema={LeavePolicySchema}
      isLoading={leavePoliciesLoading}
      hasError={leavePoliciesError}
      onAdd={createLeavePolicy}
      onUpdate={updateLeavePolicy}
      onDelete={deleteLeavePolicy}
      permissionPrefix="leavepolicy"
      filterComponent={
        <TextField
          select
          label="Filter by Leave Group"
          value={filterState.state.selectedGroup}
          onChange={(e) => filterState.setField('selectedGroup', e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">All Groups</MenuItem>
          {leaveGroupOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      }
    />
  );
}
