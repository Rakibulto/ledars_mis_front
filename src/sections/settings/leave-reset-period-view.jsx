'use client';

import { z as zod } from 'zod';
import { useMemo } from 'react';

import { fDate } from 'src/utils/format-time';

import { MONTH_OPTIONS } from 'src/_mock/options';
import {
  useGetResetPeriod,
  createResetPeriod,
  updateResetPeriod,
  deleteResetPeriod,
} from 'src/actions/settings';

import { Label } from 'src/components/label';

import { SettingsEntityView } from './settings-entity-view';

// Zod schema for validation
const ResetPeriodSchema = zod.object({
  start_month: zod.coerce.number().min(1).max(12).default(1),
  start_day: zod.coerce.number().min(1).max(31).default(1),
  end_month: zod.coerce.number().min(1).max(12).default(12),
  end_day: zod.coerce.number().min(1).max(31).default(31),
  is_active: zod.boolean().default(true),
});

export function ResetPeriodView() {
  const { resetPeriods, resetPeriodsLoading, resetPeriodsError } = useGetResetPeriod();

  // Table columns
  const TABLE_FIELDS = useMemo(
    () => [
      {
        name: 'from_date',
        label: 'From Date',
        transform: (value) => fDate(value, 'DD-MM-YYYY') || '-',
      },
      {
        name: 'to_date',
        label: 'To Date',
        transform: (value) => fDate(value, 'DD-MM-YYYY') || '-',
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
      },
    ],
    []
  );

  // Form fields
  const FORM_FIELDS = [
    {
      name: 'start_month',
      label: 'Start Month',
      type: 'select',
      options: MONTH_OPTIONS,
      defaultValue: 1,
    },
    {
      name: 'start_day',
      label: 'Start Day',
      type: 'number',
      defaultValue: 1,
    },
    {
      name: 'end_month',
      label: 'End Month',
      type: 'select',
      options: MONTH_OPTIONS,
      defaultValue: 12,
    },
    {
      name: 'end_day',
      label: 'End Day',
      type: 'number',
      defaultValue: 31,
    },
    {
      name: 'is_active',
      label: 'Active',
      type: 'select',
      options: [
        { value: true, label: 'Active' },
        { value: false, label: 'Inactive' },
      ],
      defaultValue: true,
    },
  ];

  return (
    <SettingsEntityView
      title="Reset Period Management"
      entityName="Reset Period"
      entityData={resetPeriods}
      fields={TABLE_FIELDS}
      schema={ResetPeriodSchema}
      isLoading={resetPeriodsLoading}
      hasError={resetPeriodsError}
      onAdd={createResetPeriod}
      onUpdate={updateResetPeriod}
      onDelete={deleteResetPeriod}
      permissionPrefix="leavereset"
      formFields={FORM_FIELDS}
      permissions={{
        canAdd: Array.isArray(resetPeriods) ? resetPeriods.length === 0 : true,
        canEdit: true,
        canDelete: true,
      }}
    />
  );
}
