// 'use client';

// import React, { useMemo, useState } from 'react';
// import { toast } from 'sonner';
// import { mutate } from 'swr';

// import {
//   Box,
//   Button,
//   Card,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
//   Grid,
//   IconButton,
//   InputAdornment,
//   Pagination,
//   Stack,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   TextField,
//   Typography,
// } from '@mui/material';

// import { Iconify } from 'src/components/iconify';
// import { useBoolean } from 'src/hooks/use-boolean';
// import { ConfirmDialog } from 'src/components/custom-dialog';

// import { endpoints } from 'src/utils/axios';
// import { useGetRequest, useCreateRequest, usePutRequest, useDeleteRequest } from 'src/actions/ledars-hook';

// const DEFAULT_FORM = { reference: '', date: '', type: '', original_ref: '', source: '', status: '', reason: '' };

// export default function ReturnsMain() {
//   'use client';

//   import { endpoints } from 'src/utils/axios';
//   import { useGetRequest } from 'src/actions/ledars-hook';

//   import InventoryCrudDeskPage from '../shared/inventory-crud-desk-page';
//   import { renderStatusChip } from '../shared/inventory-desk-page';

//   const EP = endpoints.storeInventory;
//   const DEFAULT_FORM = { reference: '', date: '', type: '', original_ref: '', source: '', status: '', reason: '' };

//   export default function ReturnsMain() {
//     const { data: rawData } = useGetRequest(EP.return_records);
//     const rows = Array.isArray(rawData) ? rawData : rawData?.results || [];

//     return (
//       <InventoryCrudDeskPage
//         title="Returns"
//         dialogTitle="Return"
//         description="Track inbound and outbound returns with enough context to resolve disposition, source accountability, and close the loop on reverse logistics."
//         icon="solar:arrow-left-down-bold-duotone"
//         rows={rows}
//         columns={[
//           { key: 'reference', label: 'Reference' },
//           { key: 'date', label: 'Date' },
//           { key: 'type', label: 'Type' },
//           { key: 'original_ref', label: 'Original Ref' },
//           { key: 'source', label: 'Source' },
//           { key: 'status', label: 'Status', render: (row) => renderStatusChip(row.status) },
//           { key: 'reason', label: 'Reason' },
//         ]}
//         summaryCards={[
//           { label: 'Total returns', value: rows.length, icon: 'solar:arrow-left-down-bold-duotone', helper: 'Reverse-flow records currently logged.' },
//           { label: 'Completed', value: rows.filter((row) => row.status === 'Done').length, icon: 'solar:check-circle-bold-duotone', color: 'success', helper: 'Returns already fully resolved and booked.' },
//         ]}
//         queueItems={(allRows) => [
//           { label: 'Open returns', value: allRows.filter((row) => row.status !== 'Done').length, color: 'warning', helper: 'Records still awaiting closure or disposition.' },
//           { label: 'Missing origin reference', value: allRows.filter((row) => !row.original_ref).length, color: 'default', helper: 'These returns should be tied back to the original issue or receipt.' },
//         ]}
//         reviewFields={[
//           { label: 'Type', render: (row) => row.type || 'Unknown' },
//           { label: 'Original reference', render: (row) => row.original_ref || 'Not linked' },
//           { label: 'Source', render: (row) => row.source || 'Unknown source' },
//           { label: 'Status', render: (row) => renderStatusChip(row.status) },
//           { label: 'Reason', render: (row) => row.reason || 'No reason recorded' },
//         ]}
//         defaultForm={DEFAULT_FORM}
//         fields={[
//           { key: 'reference', label: 'Reference' },
//           { key: 'date', label: 'Date', type: 'date' },
//           { key: 'type', label: 'Type' },
//           { key: 'original_ref', label: 'Original Ref' },
//           { key: 'source', label: 'Source' },
//           { key: 'status', label: 'Status' },
//           { key: 'reason', label: 'Reason', sm: 12 },
//         ]}
//         createEndpoint={EP.return_records}
//         updateEndpoint={(id) => EP.return_record_by_id(id)}
//         deleteEndpoint={(id) => EP.return_record_by_id(id)}
//         mutateKey={EP.return_records}
//         getRowTitle={(row) => row.reference || 'Unnumbered return'}
//         getRowSubtitle={(row) => `${row.type || 'Return'} from ${row.source || 'unknown source'}`}
//       />
//     );
//   }
//     setDialogOpen(true);

'use client';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { renderStatusChip } from '../shared/inventory-desk-page';
import InventoryCrudDeskPage from '../shared/inventory-crud-desk-page';

const EP = endpoints.storeInventory;

const DEFAULT_FORM = {
  reference: '',
  date: '',
  type: '',
  original_ref: '',
  source: '',
  status: '',
  reason: '',
};

export default function ReturnsMain() {
  const { data: rawData } = useGetRequest(EP.return_records);

  const rows = Array.isArray(rawData) ? rawData : rawData?.results || [];

  return (
    <InventoryCrudDeskPage
      title="Returns"
      dialogTitle="Return"
      description="Track inbound and outbound returns with enough context to resolve disposition, source accountability, and close the loop on reverse logistics."
      icon="solar:arrow-left-down-bold-duotone"
      rows={rows}
      columns={[
        { key: 'reference', label: 'Reference' },
        { key: 'date', label: 'Date' },
        { key: 'type', label: 'Type' },
        { key: 'original_ref', label: 'Original Ref' },
        { key: 'source', label: 'Source' },
        {
          key: 'status',
          label: 'Status',
          render: (row) => renderStatusChip(row.status),
        },
        { key: 'reason', label: 'Reason' },
      ]}
      summaryCards={[
        {
          label: 'Total returns',
          value: rows.length,
          icon: 'solar:arrow-left-down-bold-duotone',
          helper: 'Reverse-flow records currently logged.',
        },
        {
          label: 'Completed',
          value: rows.filter((row) => row.status === 'Done').length,
          icon: 'solar:check-circle-bold-duotone',
          color: 'success',
          helper: 'Returns already fully resolved and booked.',
        },
      ]}
      queueItems={(allRows) => [
        {
          label: 'Open returns',
          value: allRows.filter((row) => row.status !== 'Done').length,
          color: 'warning',
          helper: 'Records still awaiting closure or disposition.',
        },
        {
          label: 'Missing origin reference',
          value: allRows.filter((row) => !row.original_ref).length,
          color: 'default',
          helper: 'These returns should be tied back to the original issue or receipt.',
        },
      ]}
      reviewFields={[
        {
          label: 'Type',
          render: (row) => row.type || 'Unknown',
        },
        {
          label: 'Original reference',
          render: (row) => row.original_ref || 'Not linked',
        },
        {
          label: 'Source',
          render: (row) => row.source || 'Unknown source',
        },
        {
          label: 'Status',
          render: (row) => renderStatusChip(row.status),
        },
        {
          label: 'Reason',
          render: (row) => row.reason || 'No reason recorded',
        },
      ]}
      defaultForm={DEFAULT_FORM}
      fields={[
        { key: 'reference', label: 'Reference' },
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'type', label: 'Type' },
        { key: 'original_ref', label: 'Original Ref' },
        { key: 'source', label: 'Source' },
        { key: 'status', label: 'Status' },
        { key: 'reason', label: 'Reason', sm: 12 },
      ]}
      createEndpoint={EP.return_records}
      updateEndpoint={(id) => EP.return_record_by_id(id)}
      deleteEndpoint={(id) => EP.return_record_by_id(id)}
      mutateKey={EP.return_records}
      getRowTitle={(row) => row.reference || 'Unnumbered return'}
      getRowSubtitle={(row) => `${row.type || 'Return'} from ${row.source || 'unknown source'}`}
    />
  );
}
