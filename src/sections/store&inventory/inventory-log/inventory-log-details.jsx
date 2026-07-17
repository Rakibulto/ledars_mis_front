'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Table,
  Button,
  Divider,
  Skeleton,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import InventoryLogFormDialog from './inventory-log-form-dialog';
import {
  formatDateTime,
  formatQuantity,
  getMoveTypeChipProps,
  getDirectionChipProps,
  getHistoryStatusChipProps,
  getInventoryDocumentLabel,
} from './inventory-log-utils';

const EP = endpoints.storeInventory;
const PROCUREMENT_EP = endpoints.procurement_management;

function DetailField({ label, value, helper }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600} color="#0f172a">
        {value || 'N/A'}
      </Typography>
      {helper ? (
        <Typography variant="caption" color="text.disabled">
          {helper}
        </Typography>
      ) : null}
    </Stack>
  );
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  return `BDT ${amount.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function resolveLinkedDocumentUrl(documentType, documentId) {
  if (!documentType || !documentId) {
    return null;
  }

  switch (String(documentType).toLowerCase()) {
    case 'gin':
      return EP.gin_by_id(documentId);
    case 'grn':
      return EP.grn_by_id(documentId);
    case 'procurement_grn':
      return PROCUREMENT_EP.grn_by_id(documentId);
    case 'stock_transfer':
      return EP.stock_transfer_by_id(documentId);
    default:
      return null;
  }
}

function resolveLinkedDocumentPath(documentType, documentId) {
  if (!documentType || !documentId) {
    return null;
  }

  switch (String(documentType).toLowerCase()) {
    case 'gin':
      return paths.dashboard.storeInventory.goods_issue_note_detail(documentId);
    case 'grn':
      return paths.dashboard.storeInventory.goodsReceiptNote_detail(documentId);
    case 'procurement_grn':
      return paths.dashboard.procurement.grn.detail(documentId);
    case 'stock_transfer':
      return paths.dashboard.storeInventory.stock_transfer_detail(documentId);
    default:
      return null;
  }
}

function getLinkedDocumentNumber(documentType, document) {
  switch (String(documentType || '').toLowerCase()) {
    case 'gin':
      return document?.gin_number;
    case 'grn':
    case 'procurement_grn':
      return document?.grn_number;
    case 'stock_transfer':
      return document?.transfer_number;
    default:
      return null;
  }
}

function getLinkedDocumentSummaryFields(documentType, document) {
  switch (String(documentType || '').toLowerCase()) {
    case 'gin':
      return [
        { label: 'Document Number', value: document?.gin_number },
        { label: 'Status', value: document?.status },
        { label: 'Issue Date', value: formatDateTime(document?.issue_date) },
        { label: 'Issue From', value: document?.issue_from },
        { label: 'Issue To', value: document?.issued_to },
        { label: 'Warehouse', value: document?.warehouse_name },
        { label: 'Requested By', value: document?.requested_by_name },
        { label: 'Approved By', value: document?.approved_by_name },
        { label: 'Department', value: document?.department },
        { label: 'Project', value: document?.project },
        { label: 'Purpose', value: document?.purpose },
        { label: 'Total Value', value: formatCurrency(document?.total_value) },
      ];
    case 'grn':
      return [
        { label: 'Document Number', value: document?.grn_number },
        { label: 'Status', value: document?.status },
        { label: 'Receive Date', value: formatDateTime(document?.receive_date) },
        { label: 'Vendor', value: document?.vendor_name || document?.supplier_name },
        { label: 'PO Reference', value: document?.po_number_display || document?.po_number },
        { label: 'Warehouse', value: document?.warehouse_name },
        { label: 'Received By', value: document?.received_by_name },
        { label: 'Invoice Number', value: document?.invoice_number },
        { label: 'Challan Number', value: document?.challan_number },
        { label: 'Vehicle Number', value: document?.vehicle_number },
        {
          label: 'Approval Level',
          value: `${document?.approval_level || 0}/${document?.total_levels || 1}`,
        },
        { label: 'Total Value', value: formatCurrency(document?.total_value) },
      ];
    case 'procurement_grn':
      return [
        { label: 'Document Number', value: document?.grn_number },
        { label: 'Status', value: document?.status },
        { label: 'Receipt Date', value: formatDateTime(document?.receipt_date) },
        { label: 'Supplier', value: document?.supplier_name },
        { label: 'Work Order', value: document?.wo_number },
        { label: 'Purchase Order', value: document?.po_number },
        { label: 'Received By', value: document?.received_by_name },
        { label: 'Delivery Note', value: document?.delivery_note_number },
        { label: 'Invoice Number', value: document?.invoice_number },
        { label: 'Invoice Amount', value: formatCurrency(document?.invoice_amount) },
        { label: 'Item Count', value: String(document?.item_count || 0) },
        { label: 'Total Value', value: formatCurrency(document?.total_received_value) },
      ];
    case 'stock_transfer':
      return [
        { label: 'Document Number', value: document?.transfer_number },
        { label: 'Status', value: document?.status },
        { label: 'Transfer Date', value: formatDateTime(document?.transfer_date) },
        { label: 'From Warehouse', value: document?.from_warehouse_name },
        { label: 'To Warehouse', value: document?.to_warehouse_name },
        { label: 'Dispatch Owner', value: document?.sent_by_name },
        { label: 'Receiving Owner', value: document?.received_by_name },
        { label: 'From Location', value: document?.from_location },
        { label: 'To Location', value: document?.to_location },
        { label: 'Reference Note', value: document?.notes || document?.remarks },
        { label: 'Item Count', value: String(document?.item_count || 0) },
        { label: 'Total Value', value: formatCurrency(document?.total_value) },
      ];
    default:
      return [];
  }
}

function getLinkedDocumentLines(documentType, document) {
  switch (String(documentType || '').toLowerCase()) {
    case 'gin':
      return Array.isArray(document?.line_items)
        ? document.line_items.map((line) => ({
            id: line.id,
            code: line.item_code || line.product_code || String(line.product || ''),
            item: line.item_name || line.product_name || 'Unnamed item',
            unit: line.unit || 'N/A',
            quantity: line.issued_qty || line.requested_qty || 0,
            notes: [
              `Requested: ${Number(line.requested_qty || 0).toLocaleString('en-BD')}`,
              `Issued: ${Number(line.issued_qty || 0).toLocaleString('en-BD')}`,
              `Unit Price: ${formatCurrency(line.unit_price)}`,
            ].join(' | '),
          }))
        : [];
    case 'grn':
      return Array.isArray(document?.line_items)
        ? document.line_items.map((line) => ({
            id: line.id,
            code: line.item_code || line.product_code || String(line.product || ''),
            item: line.product_name || line.item_name || 'Unnamed item',
            unit: line.unit || 'N/A',
            quantity: line.accepted_qty || line.received_qty || line.ordered_qty || 0,
            notes: [
              `Ordered: ${Number(line.ordered_qty || 0).toLocaleString('en-BD')}`,
              `Received: ${Number(line.received_qty || 0).toLocaleString('en-BD')}`,
              `Accepted: ${Number(line.accepted_qty || 0).toLocaleString('en-BD')}`,
              `Rejected: ${Number(line.rejected_qty || 0).toLocaleString('en-BD')}`,
            ].join(' | '),
          }))
        : [];
    case 'procurement_grn':
      return Array.isArray(document?.grn_items)
        ? document.grn_items.map((line) => ({
            id: line.id,
            code: line.item_code || String(line.item || ''),
            item:
              line.item_name ||
              (line.remarks?.startsWith('Item: ')
                ? line.remarks.split(' | ')[0].replace('Item: ', '')
                : 'Unnamed item'),
            unit: line.unit || 'N/A',
            quantity:
              line.accepted_quantity || line.received_quantity || line.ordered_quantity || 0,
            notes: [
              `Ordered: ${Number(line.ordered_quantity || 0).toLocaleString('en-BD')}`,
              `Received: ${Number(line.received_quantity || 0).toLocaleString('en-BD')}`,
              `Accepted: ${Number(line.accepted_quantity || 0).toLocaleString('en-BD')}`,
              `Rejected: ${Number(line.rejected_quantity || 0).toLocaleString('en-BD')}`,
              line.condition ? `Condition: ${line.condition}` : null,
            ]
              .filter(Boolean)
              .join(' | '),
          }))
        : [];
    case 'stock_transfer':
      return Array.isArray(document?.lines)
        ? document.lines.map((line) => ({
            id: line.id,
            code: line.item_code || line.product_code || String(line.product || ''),
            item: line.product_name || line.item_name || 'Unnamed item',
            unit: line.unit || 'N/A',
            quantity: line.quantity || 0,
            notes: [
              line.batch_number ? `Batch: ${line.batch_number}` : null,
              line.lot_number ? `Lot: ${line.lot_number}` : null,
              line.unit_price ? `Unit Price: ${formatCurrency(line.unit_price)}` : null,
            ]
              .filter(Boolean)
              .join(' | '),
          }))
        : [];
    default:
      return [];
  }
}

export default function InventoryLogDetails({
  backHref = paths.dashboard.storeInventory.inventoryLogList,
  backLabel = 'Back to Inventory Log',
  quickReturnLabel = 'Return To List',
  detailRouteMode = 'inventory-log',
}) {
  const params = useParams();
  const router = useRouter();
  const logId = params?.logId;
  const isHistoryMode = detailRouteMode === 'history';
  const detailUrl = logId ? EP.stock_move_by_id(logId) : null;
  const resolveDetailPath = isHistoryMode
    ? paths.dashboard.storeInventory.inventoryLogHistory_detail
    : paths.dashboard.storeInventory.inventoryLog_detail;

  const { data: logRecord, loading, error } = useGetRequest(detailUrl);
  const linkedDocumentUrl = useMemo(
    () =>
      isHistoryMode
        ? resolveLinkedDocumentUrl(logRecord?.document_type, logRecord?.document_id)
        : null,
    [isHistoryMode, logRecord?.document_type, logRecord?.document_id]
  );
  const {
    data: linkedDocument,
    loading: linkedDocumentLoading,
    error: linkedDocumentError,
  } = useGetRequest(linkedDocumentUrl);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('edit');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const moveTypeChip = getMoveTypeChipProps(logRecord?.move_type);
  const directionChip = getDirectionChipProps(logRecord?.direction);
  const historyStatusChip = getHistoryStatusChipProps(logRecord?.history_status);
  const isStatusChange = logRecord?.move_type === 'Status Change';
  const actorLabel = [logRecord?.done_by_name, logRecord?.done_by_email]
    .filter(Boolean)
    .join(' • ');
  const linkedDocumentLabel = getInventoryDocumentLabel(logRecord?.document_type);
  const linkedDocumentPath = useMemo(
    () => resolveLinkedDocumentPath(logRecord?.document_type, logRecord?.document_id),
    [logRecord?.document_type, logRecord?.document_id]
  );
  const linkedDocumentSummaryFields = useMemo(
    () => getLinkedDocumentSummaryFields(logRecord?.document_type, linkedDocument),
    [linkedDocument, logRecord?.document_type]
  );
  const linkedDocumentLines = useMemo(
    () => getLinkedDocumentLines(logRecord?.document_type, linkedDocument),
    [linkedDocument, logRecord?.document_type]
  );

  const handleDelete = async () => {
    if (!logId) {
      return;
    }

    try {
      await deleteRequest(EP.stock_move_by_id(logId));
      toast.success('Inventory log deleted successfully.');
      await Promise.all([
        mutate(EP.stock_moves),
        detailUrl ? mutate(detailUrl) : Promise.resolve(),
      ]);
      router.push(backHref);
    } catch (deleteError) {
      toast.error(extractErrorMessage(deleteError));
    }
  };

  const handleSuccess = async (record) => {
    await Promise.all([
      mutate(EP.stock_moves),
      record?.id ? mutate(EP.stock_move_by_id(record.id)) : Promise.resolve(),
      detailUrl ? mutate(detailUrl) : Promise.resolve(),
    ]);

    if (formMode === 'create' && record?.id) {
      router.push(resolveDetailPath(record.id));
    }
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={2}
          alignItems={{ md: 'center' }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ sm: 'center' }}
          >
            <Button
              component={Link}
              href={backHref}
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
            >
              {backLabel}
            </Button>

            <Box>
              <Typography variant="h4" fontWeight={700} color="#0f172a">
                {logRecord?.reference || 'Inventory Log Details'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isHistoryMode
                  ? 'Inspect the stock movement record and the linked source document that created this stock-in or stock-out history row.'
                  : 'Inspect the exact stock movement payload, route, product assignment, and operator context before editing or removing the ledger entry.'}
              </Typography>
            </Box>
          </Stack>

          {isHistoryMode ? (
            linkedDocumentPath ? (
              <Button
                component={Link}
                href={linkedDocumentPath}
                variant="outlined"
                startIcon={<Iconify icon="solar:square-arrow-right-bold" />}
              >
                Open {linkedDocumentLabel}
              </Button>
            ) : null
          ) : (
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
                onClick={() => {
                  setFormMode('create');
                  setFormOpen(true);
                }}
              >
                Create Log
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="solar:pen-bold" />}
                onClick={() => {
                  setFormMode('edit');
                  setFormOpen(true);
                }}
                disabled={loading || Boolean(error) || !logRecord || isStatusChange}
              >
                Edit
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                onClick={() => setDeleteOpen(true)}
                disabled={loading || Boolean(error) || !logRecord || isStatusChange}
              >
                Delete
              </Button>
            </Stack>
          )}
        </Stack>

        {loading && (
          <Card sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2.5}>
              <Skeleton variant="text" width="40%" height={42} />
              <Skeleton variant="rounded" height={140} />
              <Skeleton variant="rounded" height={320} />
            </Stack>
          </Card>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Failed to load this inventory log entry. Please try again.
          </Alert>
        )}

        {!loading && !error && logRecord && (
          <Stack spacing={3}>
            <Card
              sx={{
                p: 3.5,
                borderRadius: 4,
                color: 'common.white',
                background: 'linear-gradient(135deg, #0f172a 0%, #0f766e 46%, #22c55e 100%)',
                boxShadow: '0 24px 48px rgba(15, 23, 42, 0.18)',
              }}
            >
              <Stack spacing={2.5}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.8 }}>
                      {isHistoryMode
                        ? 'Stock movement history'
                        : isStatusChange
                          ? 'Inventory status audit record'
                          : 'Inventory movement record'}
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {logRecord.reference}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.88, maxWidth: 680 }}>
                      {isHistoryMode
                        ? `${linkedDocumentLabel}${linkedDocument ? ` • ${getLinkedDocumentNumber(logRecord.document_type, linkedDocument) || logRecord.reference}` : ''}`
                        : isStatusChange
                          ? `Status changed from ${logRecord.from_status || 'Created'} to ${logRecord.to_status || 'Unknown'}`
                          : logRecord.product_name || 'Product not linked'}
                      {!isStatusChange && logRecord.product_code
                        ? ` • ${logRecord.product_code}`
                        : ''}
                      {actorLabel ? ` • handled by ${actorLabel}` : ''}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {isHistoryMode ? (
                      <>
                        <Chip
                          label={historyStatusChip.label}
                          color={historyStatusChip.color}
                          variant="filled"
                        />
                        <Chip label={linkedDocumentLabel} color="info" variant="filled" />
                      </>
                    ) : (
                      <>
                        <Chip
                          label={moveTypeChip.label}
                          color={moveTypeChip.color}
                          variant="filled"
                        />
                        <Chip
                          label={directionChip.label}
                          color={directionChip.color}
                          variant="filled"
                        />
                      </>
                    )}
                    <Chip
                      label={formatQuantity(logRecord.quantity, logRecord.uom)}
                      sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'common.white' }}
                    />
                  </Stack>
                </Stack>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <DetailField
                      label="Recorded At"
                      value={formatDateTime(logRecord.date)}
                      helper="Operational timestamp"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <DetailField
                      label="Created At"
                      value={formatDateTime(logRecord.created_at)}
                      helper="Ledger entry created"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <DetailField
                      label="Operator"
                      value={logRecord.done_by_name || 'System / Unassigned'}
                      helper="Actor captured for audit"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <DetailField
                      label="Operator Email"
                      value={logRecord.done_by_email || 'Not captured'}
                      helper="Authenticated user email"
                    />
                  </Grid>
                  {isHistoryMode && (
                    <Grid size={{ xs: 12, md: 4 }}>
                      <DetailField
                        label="Linked Document"
                        value={linkedDocumentLabel}
                        helper={
                          logRecord.document_id
                            ? `Document ID ${logRecord.document_id}`
                            : 'Reference-only history row'
                        }
                      />
                    </Grid>
                  )}
                </Grid>
              </Stack>
            </Card>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <Stack spacing={3}>
                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                    <Typography variant="h6" fontWeight={700} color="#0f172a">
                      {isHistoryMode ? 'History Record' : 'Record Details'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                      {isHistoryMode
                        ? 'This entry captures the exact stock movement that reached the ledger, alongside the operator, linked document reference, and movement status.'
                        : isStatusChange
                          ? 'This entry captures a system-generated status transition for a stock document, including the actor and the exact from/to status route.'
                          : 'The inventory log is anchored on the stock move entity, so every field below is persisted and queryable in the same backend resource.'}
                    </Typography>

                    <Divider sx={{ my: 3 }} />

                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <DetailField label="Reference" value={logRecord.reference} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <DetailField
                          label="Product"
                          value={
                            isStatusChange
                              ? 'Not applicable for status audit'
                              : logRecord.product_name
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <DetailField
                          label="Product Code"
                          value={
                            isStatusChange
                              ? 'Not applicable for status audit'
                              : logRecord.product_code
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <DetailField label="Move Type" value={moveTypeChip.label} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <DetailField
                          label={isHistoryMode ? 'Status' : 'Direction'}
                          value={isHistoryMode ? historyStatusChip.label : directionChip.label}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <DetailField
                          label="Quantity"
                          value={
                            isStatusChange
                              ? 'Not applicable for status audit'
                              : formatQuantity(logRecord.quantity, logRecord.uom)
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <DetailField
                          label="Unit Of Measure"
                          value={
                            isStatusChange
                              ? 'Not applicable for status audit'
                              : logRecord.uom || 'Not specified'
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <DetailField label="Record ID" value={String(logRecord.id)} />
                      </Grid>
                      {isHistoryMode && (
                        <Grid size={{ xs: 12, md: 4 }}>
                          <DetailField
                            label="Linked Document"
                            value={
                              logRecord.document_id
                                ? `${linkedDocumentLabel} #${logRecord.document_id}`
                                : linkedDocumentLabel
                            }
                          />
                        </Grid>
                      )}
                      {isStatusChange && (
                        <Grid size={{ xs: 12, md: 4 }}>
                          <DetailField
                            label="From Status"
                            value={logRecord.from_status || 'Created'}
                          />
                        </Grid>
                      )}
                      {isStatusChange && (
                        <Grid size={{ xs: 12, md: 4 }}>
                          <DetailField label="To Status" value={logRecord.to_status || 'Unknown'} />
                        </Grid>
                      )}
                    </Grid>
                  </Card>

                  {isHistoryMode && (
                    <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        justifyContent="space-between"
                        spacing={2}
                        alignItems={{ md: 'center' }}
                      >
                        <Box>
                          <Typography variant="h6" fontWeight={700} color="#0f172a">
                            {linkedDocumentLabel} Details
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                            Review the source document that produced this inventory history row.
                          </Typography>
                        </Box>

                        {linkedDocumentPath && (
                          <Button
                            component={Link}
                            href={linkedDocumentPath}
                            variant="outlined"
                            startIcon={<Iconify icon="solar:square-arrow-right-bold" />}
                          >
                            Open {linkedDocumentLabel}
                          </Button>
                        )}
                      </Stack>

                      <Divider sx={{ my: 3 }} />

                      {!logRecord.document_type && (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          This history row is not linked to a document-backed stock movement.
                        </Alert>
                      )}

                      {logRecord.document_type && !logRecord.document_id && (
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                          The source document reference was captured, but the exact document record
                          could not be resolved.
                        </Alert>
                      )}

                      {linkedDocumentLoading && (
                        <Stack spacing={2.5}>
                          <Skeleton variant="text" width="35%" height={32} />
                          <Skeleton variant="rounded" height={120} />
                          <Skeleton variant="rounded" height={220} />
                        </Stack>
                      )}

                      {!linkedDocumentLoading && linkedDocumentError && (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>
                          Failed to load the linked document details for this history row.
                        </Alert>
                      )}

                      {!linkedDocumentLoading && !linkedDocumentError && linkedDocument && (
                        <Stack spacing={3}>
                          <Stack spacing={0.75}>
                            <Typography variant="subtitle1" fontWeight={700} color="#0f172a">
                              {getLinkedDocumentNumber(logRecord.document_type, linkedDocument) ||
                                logRecord.reference}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {linkedDocumentLabel} summary, routing context, and item-level
                              details.
                            </Typography>
                          </Stack>

                          <Grid container spacing={3}>
                            {linkedDocumentSummaryFields.map((field) => (
                              <Grid key={field.label} size={{ xs: 12, md: 4 }}>
                                <DetailField label={field.label} value={field.value} />
                              </Grid>
                            ))}
                          </Grid>

                          <Divider />

                          {linkedDocumentLines.length ? (
                            <TableContainer sx={{ border: '1px solid #e5e7eb', borderRadius: 2.5 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                    <TableCell>Item</TableCell>
                                    <TableCell>Code</TableCell>
                                    <TableCell>Unit</TableCell>
                                    <TableCell align="right">Quantity</TableCell>
                                    <TableCell>Notes</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {linkedDocumentLines.map((line) => (
                                    <TableRow key={line.id || `${line.code}-${line.item}`}>
                                      <TableCell>
                                        <Typography
                                          variant="body2"
                                          fontWeight={700}
                                          color="#0f172a"
                                        >
                                          {line.item}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>{line.code || 'N/A'}</TableCell>
                                      <TableCell>{line.unit || 'N/A'}</TableCell>
                                      <TableCell align="right">
                                        {formatQuantity(line.quantity, line.unit)}
                                      </TableCell>
                                      <TableCell>{line.notes || 'No extra notes'}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                              No line items were returned for this linked document.
                            </Alert>
                          )}
                        </Stack>
                      )}
                    </Card>
                  )}
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, lg: 4 }}>
                <Stack spacing={3}>
                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                    <Typography variant="h6" fontWeight={700} color="#0f172a">
                      {isStatusChange ? 'Status Route' : 'Movement Route'}
                    </Typography>
                    <Stack spacing={2.5} sx={{ mt: 2.5 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          bgcolor: '#eff6ff',
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        <Typography variant="caption" color="primary.main">
                          {isStatusChange ? 'From Status' : 'Source'}
                        </Typography>
                        <Typography variant="body1" fontWeight={700} color="#0f172a">
                          {logRecord.from_status ||
                            logRecord.source_location ||
                            'Source not recorded'}
                        </Typography>
                      </Box>

                      <Stack
                        direction="row"
                        spacing={1.25}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Iconify icon="eva:arrow-forward-fill" width={20} />
                        <Typography variant="body2" color="text.secondary">
                          {isStatusChange ? 'Status route' : 'Stock route'}
                        </Typography>
                      </Stack>

                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          bgcolor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                        }}
                      >
                        <Typography variant="caption" color="success.main">
                          {isStatusChange ? 'To Status' : 'Destination'}
                        </Typography>
                        <Typography variant="body1" fontWeight={700} color="#0f172a">
                          {logRecord.to_status ||
                            logRecord.destination_location ||
                            'Destination not recorded'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>

                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                    <Typography variant="h6" fontWeight={700} color="#0f172a">
                      Quick Navigation
                    </Typography>
                    <Stack spacing={1.25} sx={{ mt: 2 }}>
                      <Button
                        component={Link}
                        href={backHref}
                        variant="outlined"
                        startIcon={<Iconify icon="solar:list-bold-duotone" />}
                      >
                        {quickReturnLabel}
                      </Button>
                      {isHistoryMode && linkedDocumentPath && (
                        <Button
                          component={Link}
                          href={linkedDocumentPath}
                          variant="outlined"
                          startIcon={<Iconify icon="solar:square-arrow-right-bold" />}
                        >
                          Open {linkedDocumentLabel}
                        </Button>
                      )}
                      <Button
                        component={Link}
                        href={paths.dashboard.storeInventory.inventoryLogHistory}
                        variant="outlined"
                        startIcon={<Iconify icon="solar:history-bold-duotone" />}
                      >
                        Open History Report
                      </Button>
                      <Button
                        component={Link}
                        href={paths.dashboard.storeInventory.inventoryLogAnalytics}
                        variant="outlined"
                        startIcon={<Iconify icon="solar:graph-up-bold-duotone" />}
                      >
                        Open Analytics
                      </Button>
                    </Stack>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        )}
      </Stack>

      {!isHistoryMode && (
        <>
          <InventoryLogFormDialog
            open={formOpen}
            mode={formMode}
            logId={formMode === 'edit' ? logId : null}
            onClose={() => setFormOpen(false)}
            onSuccess={handleSuccess}
          />

          <ConfirmDialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            title="Delete Inventory Log"
            content="Deleting this stock move removes the ledger entry from the inventory log and its detail view."
            action={
              <Button variant="contained" color="error" onClick={handleDelete}>
                Delete
              </Button>
            }
          />
        </>
      )}
    </Box>
  );
}
