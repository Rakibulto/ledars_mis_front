'use client';

import { z as zod } from 'zod';
import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import { useGetSimpleEmployees } from 'src/actions/employees';
import {
  createSupervisorLevel,
  updateSupervisorLevel,
  deleteSupervisorLevel,
  useGetSupervisorLevels,
} from 'src/actions/settings';

import { SettingsEntityView } from './settings-entity-view';

// Schema for supervisor level validation
const SupervisorLevelSchema = zod.object({
  employee: zod.coerce.number({ required_error: 'Employee is required' }),
  supervisor: zod.coerce.number({ required_error: 'Supervisor is required' }),
  level: zod.coerce.number().min(1, { message: 'Level is required' }),
});

export function SupervisorLevelView() {
  const { supervisorLevels, supervisorLevelsLoading, supervisorLevelsError } =
    useGetSupervisorLevels();
  const { employees = [] } = useGetSimpleEmployees();

  // Employee options for select
  const employeeOptions = useMemo(
    () =>
      employees?.map((emp) => ({
        value: emp?.user?.id,
        label: emp ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={emp.profile_picture || ''}
              alt={emp.employee_name || emp.user?.username}
              sx={{ width: 24, height: 24 }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2" color="text.primary" noWrap>
                {emp.employee_name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {emp.employee_id || ''}
              </Typography>
            </Box>
          </Box>
        ) : (
          ''
        ),
        // also keep raw values for transforms
        name: emp?.employee_name,
        employeeId: emp?.employee_id,
        avatar: emp?.profile_picture,
      })),
    [employees]
  );

  // Lookup maps for display
  const employeeMap = useMemo(() => {
    const map = {};
    employees?.forEach((emp) => {
      map[emp?.user?.id] = `${emp?.employee_name} (${emp?.employee_id})`;
    });
    return map;
  }, [employees]);

  // Fields for form and table
  const SUPERVISOR_LEVEL_FIELDS = useMemo(
    () => [
      {
        name: 'employee',
        label: 'Employee',
        type: 'select',
        options: employeeOptions,
        transform: (value, row) =>
          row?.employee_name
            ? `${row?.employee_name} (${row?.employee_id})`
            : employeeMap[value] || value,
      },
      {
        name: 'supervisor',
        label: 'Supervisor',
        type: 'select',
        options: employeeOptions,
        transform: (value, row) =>
          row?.supervisor_name ? row?.supervisor_name : employeeMap[value] || value,
      },
      {
        name: 'level',
        label: 'Level',
        type: 'number',
      },
    ],
    [employeeOptions, employeeMap]
  );

  return (
    <SettingsEntityView
      title="Supervisor Level Management"
      entityName="Supervisor Level"
      entityData={supervisorLevels}
      fields={SUPERVISOR_LEVEL_FIELDS}
      schema={SupervisorLevelSchema}
      isLoading={supervisorLevelsLoading}
      hasError={supervisorLevelsError}
      onAdd={createSupervisorLevel}
      onUpdate={updateSupervisorLevel}
      onDelete={deleteSupervisorLevel}
      permissionPrefix="supervisorlevel"
    />
  );
}
