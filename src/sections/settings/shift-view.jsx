'use client';

import { z as zod } from 'zod';
import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { createShift, updateShift, deleteShift, useGetShifts } from 'src/actions/settings';

import { Iconify } from 'src/components/iconify';

import { SettingsEntityView } from './settings-entity-view';

// Schema for shift validation
const ShiftSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required' }),
  office_start_time: zod.string().min(1, { message: 'Office start time is required' }),
  office_start_time_consideration: zod
    .number()
    .min(0, { message: 'Start time consideration is required' }),
  office_end_time: zod.string().min(1, { message: 'Office end time is required' }),
  office_end_time_consideration: zod
    .number()
    .min(0, { message: 'End time consideration is required' }),
  check_in_start_time: zod.string().min(1, { message: 'Check-in start time is required' }),
  check_in_end_time: zod.string().min(1, { message: 'Check-in end time is required' }),
  check_out_start_time: zod.string().min(1, { message: 'Check-out start time is required' }),
  check_out_end_time: zod.string().min(1, { message: 'Check-out end time is required' }),
});

// Fields for form and table
export function ShiftView() {
  const { shifts, shiftsLoading, shiftsError } = useGetShifts();

  // Format time values for table display
  const formatTime = (value) => {
    if (!value) return '';
    const timeParts = value.split(':');
    if (timeParts.length < 2) return value;
    const hours = parseInt(timeParts[0], 10);
    const mins = timeParts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins} ${ampm}`;
  };

  const SHIFT_FIELDS = useMemo(
    () => [
      {
        name: 'name',
        label: 'Shift Name',
        transform: (value) => <Typography variant="subtitle2">{value}</Typography>,
      },
      {
        name: 'office_start_time',
        label: 'Office Start',
        type: 'time',
        transform: (value) => (
          <Box display="flex" alignItems="center" gap={1}>
            <Iconify icon="solar:clock-circle-bold" width={16} color="success.main" />
            <Typography variant="body2" fontWeight="medium">
              {formatTime(value)}
            </Typography>
          </Box>
        ),
      },
      {
        name: 'office_start_time_consideration',
        label: 'Start Buffer (min)',
        type: 'number',
        transform: (value) => (
          <Typography variant="body2" color="info.main" fontWeight="medium">
            ±{value} min
          </Typography>
        ),
      },
      {
        name: 'office_end_time',
        label: 'Office End',
        type: 'time',
        transform: (value) => (
          <Box display="flex" alignItems="center" gap={1}>
            <Iconify icon="solar:clock-circle-bold" width={16} color="error.main" />
            <Typography variant="body2" fontWeight="medium">
              {formatTime(value)}
            </Typography>
          </Box>
        ),
      },
      {
        name: 'office_end_time_consideration',
        label: 'End Buffer (min)',
        type: 'number',
        transform: (value) => (
          <Typography variant="body2" color="info.main" fontWeight="medium">
            ±{value} min
          </Typography>
        ),
      },
      {
        name: 'check_in_start_time',
        label: 'Check-in Start',
        type: 'time',
        transform: (value) => (
          <Box display="flex" alignItems="center" gap={1}>
            <Iconify icon="solar:login-2-bold" width={16} color="primary.main" />
            <Typography variant="body2">{formatTime(value)}</Typography>
          </Box>
        ),
      },
      {
        name: 'check_in_end_time',
        label: 'Check-in End',
        type: 'time',
        transform: (value) => (
          <Box display="flex" alignItems="center" gap={1}>
            <Iconify icon="solar:login-2-bold" width={16} color="warning.main" />
            <Typography variant="body2">{formatTime(value)}</Typography>
          </Box>
        ),
      },
      {
        name: 'check_out_start_time',
        label: 'Check-out Start',
        type: 'time',
        transform: (value) => (
          <Box display="flex" alignItems="center" gap={1}>
            <Iconify icon="solar:logout-2-bold" width={16} color="primary.main" />
            <Typography variant="body2">{formatTime(value)}</Typography>
          </Box>
        ),
      },
      {
        name: 'check_out_end_time',
        label: 'Check-out End',
        type: 'time',
        transform: (value) => (
          <Box display="flex" alignItems="center" gap={1}>
            <Iconify icon="solar:logout-2-bold" width={16} color="warning.main" />
            <Typography variant="body2">{formatTime(value)}</Typography>
          </Box>
        ),
      },
    ],
    []
  );

  return (
    <SettingsEntityView
      title="Shift Management"
      entityName="Shift"
      entityData={shifts}
      fields={SHIFT_FIELDS}
      schema={ShiftSchema}
      isLoading={shiftsLoading}
      hasError={shiftsError}
      onAdd={createShift}
      onUpdate={updateShift}
      onDelete={deleteShift}
      permissionPrefix="shift"
    />
  );
}
