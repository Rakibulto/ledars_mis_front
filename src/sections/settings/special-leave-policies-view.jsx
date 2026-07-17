'use client';

import { z as zod } from 'zod';
import { useMemo } from 'react';

import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useSetState } from 'src/hooks/use-set-state';

import {
  useGetLeaveGroups,
  useGetLeavePolicies,
  createSpecialLeavePolicy,
  updateSpecialLeavePolicy,
  deleteSpecialLeavePolicy,
  useGetSpecialLeavePolicies,
} from 'src/actions/settings';

import { Label } from 'src/components/label';

import { SettingsEntityView } from './settings-entity-view';

// Schema for special leave policy validation
const SpecialLeavePolicySchema = zod.object({
  leave_policy: zod.coerce.number({ required_error: 'Leave policy is required' }),
  available_policies: zod
    .array(zod.coerce.number())
    .min(1, { message: 'At least one available policy is required' }),
});

export function SpecialLeavePoliciesView() {
  const { specialLeavePolicies, specialLeavePoliciesLoading, specialLeavePoliciesError } =
    useGetSpecialLeavePolicies();
  const { leavePolicies } = useGetLeavePolicies();
  const { leaveGroups } = useGetLeaveGroups();

  const filterState = useSetState({ selectedGroup: '', selectedPolicy: '' });

  // Leave policy options for select
  const leavePolicyOptions = useMemo(
    () =>
      (leavePolicies || []).map((policy) => ({
        value: policy.id,
        label: `${policy?.leave_type_name} - ${policy?.leave_groups_detail?.[0]?.name}`,
      })),
    [leavePolicies]
  );

  // Leave group options
  const leaveGroupOptions = useMemo(
    () =>
      (leaveGroups || []).map((group) => ({
        value: group.id,
        label: group.name,
      })),
    [leaveGroups]
  );

  // Create lookup map for policy names
  const leavePolicyMap = useMemo(() => {
    const map = {};
    (leavePolicies || []).forEach((policy) => {
      map[policy.id] = policy.leave_type_name;
    });
    return map;
  }, [leavePolicies]);

  // Create map from policy id to group id
  const policyToGroupMap = useMemo(() => {
    const map = {};
    (leavePolicies || []).forEach((policy) => {
      map[policy.id] = policy.leave_groups?.[0];
    });
    return map;
  }, [leavePolicies]);

  // Filter special leave policies by selected group and policy
  const filteredPolicies = useMemo(() => {
    let filtered = specialLeavePolicies || [];
    if (filterState.state.selectedGroup) {
      filtered = filtered.filter(
        (policy) =>
          policyToGroupMap[policy.leave_policy] === Number(filterState.state.selectedGroup)
      );
    }
    if (filterState.state.selectedPolicy) {
      filtered = filtered.filter(
        (policy) => policy.leave_policy === Number(filterState.state.selectedPolicy)
      );
    }
    return filtered;
  }, [
    specialLeavePolicies,
    filterState.state.selectedGroup,
    filterState.state.selectedPolicy,
    policyToGroupMap,
  ]);

  // Function to get filtered leave policy options based on selected group
  const getLeavePolicyOptions = useMemo(
    () => (formValues) => {
      const selectedGroup = formValues?.leave_group;
      if (!selectedGroup) {
        return leavePolicyOptions;
      }
      return leavePolicyOptions.filter((option) => {
        const policy = leavePolicies.find((p) => p.id === option.value);
        return policy?.leave_groups?.includes(selectedGroup);
      });
    },
    [leavePolicyOptions, leavePolicies]
  );

  // Function to get filtered available policies options based on selected group
  const getAvailablePoliciesOptions = useMemo(
    () => (formValues) => {
      const selectedGroup = formValues?.leave_group;
      if (!selectedGroup) {
        return leavePolicyOptions;
      }
      return leavePolicyOptions.filter((option) => {
        const policy = leavePolicies.find((p) => p.id === option.value);
        return policy?.leave_groups?.includes(selectedGroup);
      });
    },
    [leavePolicyOptions, leavePolicies]
  );

  // Fields for table
  const TABLE_FIELDS = useMemo(
    () => [
      {
        name: 'leave_policy',
        label: 'Leave Policy',
        type: 'select',
        transform: (value) => (
          <Typography variant="subtitle2">{leavePolicyMap[value] || value}</Typography>
        ),
      },
      {
        name: 'available_policies',
        label: 'Available Policies Management',
        type: 'multiselect',
        transform: (value) =>
          Array.isArray(value) ? (
            <Stack direction="row" spacing={0.5} flexWrap="wrap">
              {value.map((id, index) => (
                <Label
                  key={id}
                  variant="soft"
                  color={index % 3 === 0 ? 'primary' : index % 3 === 1 ? 'info' : 'secondary'}
                >
                  {leavePolicyMap[id] || id}
                </Label>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No policies available
            </Typography>
          ),
      },
    ],
    [leavePolicyMap]
  );

  // Fields for form
  const FORM_FIELDS = useMemo(
    () => [
      {
        name: 'leave_group',
        label: 'Leave Group',
        type: 'select',
        options: leaveGroupOptions,
        defaultValue: (currentEntity) =>
          currentEntity ? policyToGroupMap[currentEntity.leave_policy] || '' : '',
      },
      {
        name: 'leave_policy',
        label: 'Leave Policy',
        type: 'select',
        options: getLeavePolicyOptions,
      },
      {
        name: 'available_policies',
        label: 'Available Policies',
        type: 'multiselect',
        options: getAvailablePoliciesOptions,
        multiple: true,
        defaultValue: [],
      },
    ],
    [leaveGroupOptions, policyToGroupMap, getLeavePolicyOptions, getAvailablePoliciesOptions]
  );

  return (
    <SettingsEntityView
      title="Special Leave Policies Management"
      entityName="Special Leave Policy"
      entityData={filteredPolicies}
      fields={TABLE_FIELDS}
      formFields={FORM_FIELDS}
      schema={SpecialLeavePolicySchema}
      isLoading={specialLeavePoliciesLoading}
      hasError={specialLeavePoliciesError}
      onAdd={createSpecialLeavePolicy}
      onUpdate={updateSpecialLeavePolicy}
      onDelete={deleteSpecialLeavePolicy}
      permissionPrefix="specialleavepolicy"
      filterComponent={
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            select
            label="Filter by Leave Group"
            value={filterState.state.selectedGroup}
            onChange={(e) => {
              filterState.setField('selectedGroup', e.target.value);
              filterState.setField('selectedPolicy', ''); // Reset policy when group changes
            }}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All Groups</MenuItem>
            {leaveGroupOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      }
    />
  );
}
