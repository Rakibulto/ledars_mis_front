'use client';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { renderStatusChip } from '../shared/inventory-desk-page';
import InventoryCrudDeskPage from '../shared/inventory-crud-desk-page';

const DEFAULT_FORM = {
  reference: '',
  shipment: '',
  origin: '',
  destination: '',
  current_leg: '',
  status: '',
  eta: '',
  carrier: '',
};

const FIELDS = [
  { key: 'reference' },
  { key: 'shipment' },
  { key: 'origin' },
  { key: 'destination' },
  { key: 'current_leg' },
  { key: 'status' },
  { key: 'eta', type: 'date' },
  { key: 'carrier' },
];

export default function PipelineTrackingMain() {
  const EP = endpoints.storeInventory;
  const { data: rawData } = useGetRequest(EP.pipeline_tracking);
  const rows = Array.isArray(rawData) ? rawData : rawData?.results || [];

  return (
    <InventoryCrudDeskPage
      title="Pipeline Tracking"
      description="Keep inbound humanitarian shipments visible across route legs, ETA changes, and in-transit control actions."
      icon="solar:route-bold-duotone"
      rows={rows}
      columns={[
        { key: 'reference', label: 'Reference' },
        { key: 'shipment', label: 'Shipment' },
        { key: 'origin', label: 'Origin' },
        { key: 'destination', label: 'Destination' },
        { key: 'current_leg', label: 'Current Leg' },
        { key: 'status', label: 'Status', render: (row) => renderStatusChip(row.status) },
        { key: 'eta', label: 'ETA' },
      ]}
      summaryCards={[
        { label: 'Active Pipelines', value: rows.length, icon: 'solar:route-bold-duotone' },
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
          label: 'Destination Count',
          value: new Set(rows.map((row) => row.destination).filter(Boolean)).size,
          icon: 'solar:map-point-bold-duotone',
        },
      ]}
      queueItems={(allRows, selectedRow) => [
        {
          label: 'Awaiting ETA Review',
          value: allRows.filter((row) => row.eta).length,
          helper: 'Shipments with ETA data ready for coordination follow-up.',
        },
        {
          label: 'Current Leg',
          value: selectedRow?.current_leg || 'None',
          helper: selectedRow?.carrier || 'Select a shipment to inspect route and carrier details.',
        },
        {
          label: 'Selected Destination',
          value: selectedRow?.destination || 'Not set',
          helper: selectedRow?.status || 'Status will appear once a row is selected.',
        },
      ]}
      reviewFields={[
        { key: 'origin', label: 'Origin' },
        { key: 'destination', label: 'Destination' },
        { key: 'current_leg', label: 'Current Leg' },
        { key: 'status', label: 'Status', render: (row) => renderStatusChip(row.status) },
        { key: 'eta', label: 'ETA' },
        { key: 'carrier', label: 'Carrier' },
      ]}
      defaultForm={DEFAULT_FORM}
      fields={FIELDS}
      createEndpoint={EP.pipeline_tracking}
      updateEndpoint={EP.pipeline_tracking_by_id}
      deleteEndpoint={EP.pipeline_tracking_by_id}
      mutateKey={EP.pipeline_tracking}
      getRowTitle={(row) => row.reference || row.shipment || 'Pipeline record'}
      getRowSubtitle={(row) => `${row.origin || 'Unknown'} to ${row.destination || 'Unknown'}`}
      dialogTitle="Pipeline"
      createLabel="Add Pipeline"
      emptyMessage="No pipeline tracking records are available."
    />
  );
}
