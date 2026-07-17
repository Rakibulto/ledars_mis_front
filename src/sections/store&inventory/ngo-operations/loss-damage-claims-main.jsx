'use client';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import InventoryCrudDeskPage from '../shared/inventory-crud-desk-page';
import { formatCurrency, renderStatusChip } from '../shared/inventory-desk-page';

const DEFAULT_FORM = {
  reference: '',
  date: '',
  type: '',
  shipment_ref: '',
  total_claim: '',
  status: '',
  filed_by: '',
  carrier: '',
};

const FIELDS = [
  { key: 'reference' },
  { key: 'date', type: 'date' },
  { key: 'type' },
  { key: 'shipment_ref', label: 'Shipment Ref' },
  { key: 'total_claim', label: 'Total Claim', type: 'number' },
  { key: 'status' },
  { key: 'filed_by', label: 'Filed By' },
  { key: 'carrier' },
];

export default function LossDamageClaimsMain() {
  const EP = endpoints.storeInventory;
  const { data: rawData } = useGetRequest(EP.loss_damage_claims);
  const rows = Array.isArray(rawData) ? rawData : rawData?.results || [];

  return (
    <InventoryCrudDeskPage
      title="Loss & Damage Claims"
      description="Monitor carrier claims, document shipment issues, and keep pending recoveries visible for the logistics desk."
      icon="solar:document-text-bold-duotone"
      rows={rows}
      columns={[
        { key: 'reference', label: 'Reference' },
        { key: 'date', label: 'Date' },
        { key: 'type', label: 'Type' },
        { key: 'shipment_ref', label: 'Shipment' },
        {
          key: 'total_claim',
          label: 'Claim Value',
          render: (row) => formatCurrency(row.total_claim),
        },
        { key: 'status', label: 'Status', render: (row) => renderStatusChip(row.status) },
        { key: 'carrier', label: 'Carrier' },
      ]}
      summaryCards={[
        { label: 'Total Claims', value: rows.length, icon: 'solar:document-text-bold-duotone' },
        {
          label: 'Claim Exposure',
          value: formatCurrency(rows.reduce((sum, row) => sum + Number(row.total_claim || 0), 0)),
          icon: 'solar:wallet-money-bold-duotone',
          color: 'warning',
        },
        {
          label: 'Under Review',
          value: rows.filter((row) =>
            String(row.status || '')
              .toLowerCase()
              .includes('review')
          ).length,
          icon: 'solar:clock-circle-bold-duotone',
        },
      ]}
      queueItems={(allRows, selectedRow) => [
        {
          label: 'Pending Follow-up',
          value: allRows.filter(
            (row) =>
              !String(row.status || '')
                .toLowerCase()
                .includes('complete')
          ).length,
          color: 'warning',
          helper: 'Claims that still need carrier or insurer resolution.',
        },
        {
          label: 'Selected Claim',
          value: selectedRow?.reference || 'None',
          helper: selectedRow?.shipment_ref || 'Select a claim to inspect its shipment reference.',
        },
        {
          label: 'Filed By',
          value: selectedRow?.filed_by || 'Unassigned',
          helper: selectedRow?.carrier || 'Carrier contact will appear here when selected.',
        },
      ]}
      reviewFields={[
        { key: 'type', label: 'Claim Type' },
        { key: 'shipment_ref', label: 'Shipment Ref' },
        {
          key: 'total_claim',
          label: 'Claim Value',
          render: (row) => formatCurrency(row.total_claim),
        },
        { key: 'status', label: 'Status', render: (row) => renderStatusChip(row.status) },
        { key: 'filed_by', label: 'Filed By' },
        { key: 'carrier', label: 'Carrier' },
      ]}
      defaultForm={DEFAULT_FORM}
      fields={FIELDS}
      createEndpoint={EP.loss_damage_claims}
      updateEndpoint={EP.loss_damage_claim_by_id}
      deleteEndpoint={EP.loss_damage_claim_by_id}
      mutateKey={EP.loss_damage_claims}
      getRowTitle={(row) => row.reference || 'Claim record'}
      getRowSubtitle={(row) => `${row.type || 'Unclassified'} claim`}
      dialogTitle="Claim"
      createLabel="Add Claim"
      emptyMessage="No loss or damage claims have been logged yet."
    />
  );
}
