'use client';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { renderStatusChip } from '../shared/inventory-desk-page';
import InventoryCrudDeskPage from '../shared/inventory-crud-desk-page';

const DEFAULT_FORM = {
  reference: '',
  date: '',
  origin: '',
  destination: '',
  vehicle: '',
  driver: '',
  total_weight: '',
  status: '',
};

const FIELDS = [
  { key: 'reference' },
  { key: 'date', type: 'date' },
  { key: 'origin' },
  { key: 'destination' },
  { key: 'vehicle' },
  { key: 'driver' },
  { key: 'total_weight', type: 'number' },
  { key: 'status' },
];

export default function WaybillManagementMain() {
  const EP = endpoints.storeInventory;
  const { data: rawData } = useGetRequest(EP.waybills);
  const rows = Array.isArray(rawData) ? rawData : rawData?.results || [];

  return (
    <InventoryCrudDeskPage
      title="Waybill Management"
      description="Supervise transport documents, route assignments, and transit status so dispatch paperwork stays operationally current."
      icon="solar:document-bold-duotone"
      rows={rows}
      columns={[
        { key: 'reference', label: 'Reference' },
        { key: 'date', label: 'Date' },
        { key: 'origin', label: 'Origin' },
        { key: 'destination', label: 'Destination' },
        { key: 'vehicle', label: 'Vehicle' },
        { key: 'driver', label: 'Driver' },
        { key: 'status', label: 'Status', render: (row) => renderStatusChip(row.status) },
      ]}
      summaryCards={[
        { label: 'Waybills', value: rows.length, icon: 'solar:document-bold-duotone' },
        {
          label: 'In Transit',
          value: rows.filter((row) =>
            String(row.status || '')
              .toLowerCase()
              .includes('transit')
          ).length,
          icon: 'solar:delivery-bold-duotone',
          color: 'warning',
        },
        {
          label: 'Vehicles Assigned',
          value: new Set(rows.map((row) => row.vehicle).filter(Boolean)).size,
          icon: 'solar:bus-bold-duotone',
        },
      ]}
      queueItems={(allRows, selectedRow) => [
        {
          label: 'Open Movements',
          value: allRows.filter(
            (row) =>
              !String(row.status || '')
                .toLowerCase()
                .includes('complete')
          ).length,
          helper: 'Waybills that still require transport closure or status updates.',
        },
        {
          label: 'Selected Route',
          value: selectedRow
            ? `${selectedRow.origin || 'Unknown'} -> ${selectedRow.destination || 'Unknown'}`
            : 'None',
          helper: selectedRow?.vehicle || 'Select a waybill to inspect the assigned vehicle.',
        },
        {
          label: 'Declared Weight',
          value: selectedRow?.total_weight || 0,
          helper: selectedRow?.driver || 'Driver assignment appears here when a row is selected.',
        },
      ]}
      reviewFields={[
        { key: 'origin', label: 'Origin' },
        { key: 'destination', label: 'Destination' },
        { key: 'vehicle', label: 'Vehicle' },
        { key: 'driver', label: 'Driver' },
        { key: 'total_weight', label: 'Total Weight' },
        { key: 'status', label: 'Status', render: (row) => renderStatusChip(row.status) },
      ]}
      defaultForm={DEFAULT_FORM}
      fields={FIELDS}
      createEndpoint={EP.waybills}
      updateEndpoint={EP.waybill_by_id}
      deleteEndpoint={EP.waybill_by_id}
      mutateKey={EP.waybills}
      getRowTitle={(row) => row.reference || 'Waybill'}
      getRowSubtitle={(row) => `${row.origin || 'Unknown'} to ${row.destination || 'Unknown'}`}
      dialogTitle="Waybill"
      createLabel="Add Waybill"
      emptyMessage="No waybills have been entered yet."
    />
  );
}
