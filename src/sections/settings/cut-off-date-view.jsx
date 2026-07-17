'use client';

import { z as zod } from 'zod';
import { useMemo } from 'react';

import { fDate } from 'src/utils/format-time';

import {
  createCutOffDate,
  updateCutOffDate,
  deleteCutOffDate,
  useGetCutOffDates,
} from 'src/actions/settings';

import { SettingsEntityView } from './settings-entity-view';

// Zod schema for validation
const CutOffDateSchema = zod.object({
  name: zod.string().min(1, 'Name is required'),
  date: zod.coerce.number().min(1).max(31),
});

export function CutOffDateView() {
  const { cutOffDates, cutOffDatesLoading, cutOffDatesError } = useGetCutOffDates();

  // Table columns
  const TABLE_FIELDS = useMemo(
    () => [
      {
        name: 'name',
        label: 'Name',
      },
      {
        name: 'date',
        label: 'Day',
      },
      {
        name: 'cut_off',
        label: 'Cut Off Date',
        transform: (value) => fDate(value, 'DD-MM-YYYY') || '-',
      },
    ],
    []
  );

  // Form fields
  const FORM_FIELDS = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      defaultValue: '',
    },
    {
      name: 'date',
      label: 'Day',
      type: 'number',
      defaultValue: 1,
    },
  ];

  return (
    <SettingsEntityView
      title="Cut Off Date Management"
      entityName="Cut Off Date"
      entityData={cutOffDates}
      fields={TABLE_FIELDS}
      schema={CutOffDateSchema}
      isLoading={cutOffDatesLoading}
      hasError={cutOffDatesError}
      onAdd={createCutOffDate}
      onUpdate={updateCutOffDate}
      onDelete={deleteCutOffDate}
      permissionPrefix="cutoff"
      formFields={FORM_FIELDS}
      permissions={{
        canAdd: Array.isArray(cutOffDates) ? cutOffDates.length === 0 : true,
        canEdit: true,
        canDelete: true,
      }}
    />
  );
}
