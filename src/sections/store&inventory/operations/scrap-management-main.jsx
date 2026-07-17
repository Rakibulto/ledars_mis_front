'use client';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { formatCurrency } from '../shared/inventory-desk-page';
import InventoryCrudDeskPage from '../shared/inventory-crud-desk-page';

const EP = endpoints.storeInventory;

const DEFAULT_FORM = {
  reference: '',
  date: '',
  product_name: '',
  quantity: '',
  uom: '',
  lot: '',
  reason: '',
  value: '',
};

export default function ScrapManagementMain() {
  const { data: rawData } = useGetRequest(EP.scrap_records);

  const rows = Array.isArray(rawData) ? rawData : rawData?.results || [];

  return (
    <InventoryCrudDeskPage
      title="Scrap Management"
      dialogTitle="Scrap Record"
      description="Record stock written off due to damage, expiry, or loss so warehouse teams can quantify operational leakage and its financial impact."
      icon="solar:trash-bin-trash-bold-duotone"
      rows={rows}
      columns={[
        { key: 'reference', label: 'Reference' },
        { key: 'date', label: 'Date' },
        { key: 'product_name', label: 'Product' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'uom', label: 'UoM' },
        { key: 'lot', label: 'Lot' },
        { key: 'reason', label: 'Reason' },
        {
          key: 'value',
          label: 'Value',
          render: (row) => formatCurrency(row.value),
        },
      ]}
      summaryCards={[
        {
          label: 'Total scrapped',
          value: rows.length,
          icon: 'solar:trash-bin-trash-bold-duotone',
          helper: 'Scrap records currently available.',
        },
        {
          label: 'Total value lost',
          value: formatCurrency(rows.reduce((sum, row) => sum + Number(row.value || 0), 0)),
          icon: 'solar:dollar-bold-duotone',
          color: 'warning',
          helper: 'Financial impact of recorded scrap and disposal losses.',
        },
      ]}
      queueItems={(allRows) => [
        {
          label: 'High-value losses',
          value: allRows.filter((row) => Number(row.value || 0) > 50000).length,
          color: 'warning',
          helper: 'Large losses should trigger immediate review and escalation.',
        },
        {
          label: 'Unlotted scrap',
          value: allRows.filter((row) => !row.lot).length,
          color: 'default',
          helper: 'These write-offs need better traceability back to affected inventory.',
        },
      ]}
      reviewFields={[
        {
          label: 'Product',
          render: (row) => row.product_name || 'Unknown product',
        },
        {
          label: 'Quantity',
          render: (row) => `${row.quantity || 0} ${row.uom || ''}`.trim(),
        },
        {
          label: 'Lot',
          render: (row) => row.lot || 'Not recorded',
        },
        {
          label: 'Reason',
          render: (row) => row.reason || 'No reason provided',
        },
        {
          label: 'Value lost',
          render: (row) => formatCurrency(row.value),
        },
      ]}
      defaultForm={DEFAULT_FORM}
      fields={[
        { key: 'reference', label: 'Reference' },
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'product_name', label: 'Product Name' },
        { key: 'quantity', label: 'Quantity', type: 'number' },
        { key: 'uom', label: 'UoM' },
        { key: 'lot', label: 'Lot' },
        { key: 'reason', label: 'Reason' },
        { key: 'value', label: 'Value', type: 'number' },
      ]}
      createEndpoint={EP.scrap_records}
      updateEndpoint={(id) => EP.scrap_record_by_id(id)}
      deleteEndpoint={(id) => EP.scrap_record_by_id(id)}
      mutateKey={EP.scrap_records}
      getRowTitle={(row) => row.reference || row.product_name || 'Unnumbered scrap record'}
      getRowSubtitle={(row) => `${row.product_name || 'Unknown product'} scrap event`}
    />
  );
}

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

// const DEFAULT_FORM = { reference: '', date: '', product_name: '', quantity: '', uom: '', lot: '', reason: '', value: '' };

// export default function ScrapManagementMain() {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [page, setPage] = useState(1);
//   const rowsPerPage = 10;

//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [editingItem, setEditingItem] = useState(null);
//   const [form, setForm] = useState(DEFAULT_FORM);
//   const [deleteId, setDeleteId] = useState(null);
//   const confirm = useBoolean();
//   const EP = endpoints.storeInventory;

//   const { data: rawData } = useGetRequest(EP.scrap_records);
//   const SCRAP_RECORDS = Array.isArray(rawData) ? rawData : rawData?.results || [];
//   const tableData = SCRAP_RECORDS;

//   const filtered = useMemo(() => {
//     if (!searchTerm) return tableData;
//     return tableData.filter((row) =>
//       Object.values(row).some((val) =>
//         String(val).toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     );
//   }, [searchTerm, tableData]);

//   const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

//   const handleCreate = async () => {
//     try {
//       await useCreateRequest(EP.scrap_records, form);
//       toast.success('Created successfully');
//       'use client';

//       import { endpoints } from 'src/utils/axios';
//       import { useGetRequest } from 'src/actions/ledars-hook';

//       import InventoryCrudDeskPage from '../shared/inventory-crud-desk-page';
//       import { formatCurrency } from '../shared/inventory-desk-page';

//       const EP = endpoints.storeInventory;
//       const DEFAULT_FORM = { reference: '', date: '', product_name: '', quantity: '', uom: '', lot: '', reason: '', value: '' };

//       export default function ScrapManagementMain() {
//         const { data: rawData } = useGetRequest(EP.scrap_records);
//         const rows = Array.isArray(rawData) ? rawData : rawData?.results || [];

//         return (
//           <InventoryCrudDeskPage
//             title="Scrap Management"
//             dialogTitle="Scrap Record"
//             description="Record stock written off due to damage, expiry, or loss so warehouse teams can quantify operational leakage and its financial impact."
//             icon="solar:trash-bin-trash-bold-duotone"
//             rows={rows}
//             columns={[
//               { key: 'reference', label: 'Reference' },
//               { key: 'date', label: 'Date' },
//               { key: 'product_name', label: 'Product' },
//               { key: 'quantity', label: 'Quantity' },
//               { key: 'uom', label: 'UoM' },
//               { key: 'lot', label: 'Lot' },
//               { key: 'reason', label: 'Reason' },
//               { key: 'value', label: 'Value', render: (row) => formatCurrency(row.value) },
//             ]}
//             summaryCards={[
//               { label: 'Total scrapped', value: rows.length, icon: 'solar:trash-bin-trash-bold-duotone', helper: 'Scrap records currently available.' },
//               { label: 'Total value lost', value: formatCurrency(rows.reduce((sum, row) => sum + Number(row.value || 0), 0)), icon: 'solar:dollar-bold-duotone', color: 'warning', helper: 'Financial impact of recorded scrap and disposal losses.' },
//             ]}
//             queueItems={(allRows) => [
//               { label: 'High-value losses', value: allRows.filter((row) => Number(row.value || 0) > 50000).length, color: 'warning', helper: 'Large losses should trigger immediate review and escalation.' },
//               { label: 'Unlotted scrap', value: allRows.filter((row) => !row.lot).length, color: 'default', helper: 'These write-offs need better traceability back to affected inventory.' },
//             ]}
//             reviewFields={[
//               { label: 'Product', render: (row) => row.product_name || 'Unknown product' },
//               { label: 'Quantity', render: (row) => `${row.quantity || 0} ${row.uom || ''}`.trim() },
//               { label: 'Lot', render: (row) => row.lot || 'Not recorded' },
//               { label: 'Reason', render: (row) => row.reason || 'No reason provided' },
//               { label: 'Value lost', render: (row) => formatCurrency(row.value) },
//             ]}
//             defaultForm={DEFAULT_FORM}
//             fields={[
//               { key: 'reference', label: 'Reference' },
//               { key: 'date', label: 'Date', type: 'date' },
//               { key: 'product_name', label: 'Product Name' },
//               { key: 'quantity', label: 'Quantity', type: 'number' },
//               { key: 'uom', label: 'UoM' },
//               { key: 'lot', label: 'Lot' },
//               { key: 'reason', label: 'Reason' },
//               { key: 'value', label: 'Value', type: 'number' },
//             ]}
//             createEndpoint={EP.scrap_records}
//             updateEndpoint={(id) => EP.scrap_record_by_id(id)}
//             deleteEndpoint={(id) => EP.scrap_record_by_id(id)}
//             mutateKey={EP.scrap_records}
//             getRowTitle={(row) => row.reference || row.product_name || 'Unnumbered scrap record'}
//             getRowSubtitle={(row) => `${row.product_name || 'Unknown product'} scrap event`}
//           />
//         );
//       }
//             size="small"
