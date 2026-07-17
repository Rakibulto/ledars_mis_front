'use client';

import { z as zod } from 'zod';

import {
  createPreapprovedIp,
  updatePreapprovedIp,
  deletePreapprovedIp,
  useGetPreapprovedIps,
} from 'src/actions/settings';

import { SettingsEntityView } from './settings-entity-view';

// Schema for pre-approved IP validation
const PreapprovedIpSchema = zod.object({
  ip_address: zod.string().min(1, { message: 'IP Address is required' }),
  description: zod.string().optional(),
});

// Fields for form and table
const PREAPPROVED_IP_FIELDS = [
  { name: 'ip_address', label: 'IP Address' },
  { name: 'description', label: 'Description' },
];

export function PreapprovedIpView() {
  const { preapprovedIps, preapprovedIpsLoading, preapprovedIpsError } = useGetPreapprovedIps();

  return (
    <SettingsEntityView
      title="Pre-approved IP Management"
      entityName="Pre-approved IP"
      entityData={preapprovedIps}
      fields={PREAPPROVED_IP_FIELDS}
      schema={PreapprovedIpSchema}
      isLoading={preapprovedIpsLoading}
      hasError={preapprovedIpsError}
      onAdd={createPreapprovedIp}
      onUpdate={updatePreapprovedIp}
      onDelete={deletePreapprovedIp}
      permissionPrefix="preapprovedip"
    />
  );
}
