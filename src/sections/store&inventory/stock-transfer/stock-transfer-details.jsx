'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
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

import {
  useGetRequest,
  extractErrorMessage,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import StockTransferPDF from './stock-transfer-pdf';
import StockTransferFormDialog from './stock-transfer-form-dialog';
import { getStockTransferModuleConfig } from './stock-transfer-module-config';

function formatCurrency(value) {
  const amount = Number(value || 0);

  return `৳${amount.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) {
    return 'Not recorded';
  }

  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) {
    return 'Not recorded';
  }

  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getWarehouseLabel(primary, fallback, emptyLabel) {
  return primary || fallback || emptyLabel;
}

function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function getStatusChipProps(status) {
  switch (normalizeStatus(status)) {
    case 'received':
      return { color: 'success', label: 'Received' };
    case 'in transit':
      return { color: 'info', label: 'In Transit' };
    case 'cancelled':
      return { color: 'error', label: 'Cancelled' };
    case 'draft':
      return { color: 'default', label: 'Draft' };
    default:
      return { color: 'default', label: status || 'Unknown' };
  }
}

function DetailField({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600} color="#0f172a">
        {value || 'N/A'}
      </Typography>
    </Box>
  );
}

export default function StockTransferDetails({ moduleKey = 'stockTransfer' }) {
  const params = useParams();
  const router = useRouter();
  const moduleConfig = getStockTransferModuleConfig(moduleKey);
  const transferId = moduleConfig.paramKeys
    .map((key) => {
      const value = params?.[key];
      return Array.isArray(value) ? value[0] : value;
    })
    .find(Boolean);
  const detailUrl = transferId ? moduleConfig.detailEndpoint(transferId) : null;

  const { data: transfer, loading, error } = useGetRequest(detailUrl);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('edit');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const lineItems = useMemo(
    () => (Array.isArray(transfer?.lines) ? transfer.lines : []),
    [transfer]
  );

  const lineMetrics = useMemo(
    () => ({
      items: lineItems.length,
      quantity: lineItems.reduce((total, line) => total + Number(line.quantity || 0), 0),
      value: lineItems.reduce(
        (total, line) => total + Number(line.quantity || 0) * Number(line.unit_price || 0),
        0
      ),
    }),
    [lineItems]
  );

  const sourceLabel = getWarehouseLabel(
    transfer?.from_warehouse_name,
    transfer?.from_location,
    'Source not linked'
  );
  const destinationLabel = getWarehouseLabel(
    transfer?.to_warehouse_name,
    transfer?.to_location,
    'Destination not linked'
  );

  const statusChip = getStatusChipProps(transfer?.status);

  const handleCreate = () => {
    setFormMode('create');
    setFormOpen(true);
  };

  const handleEdit = () => {
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!transferId) {
      return;
    }

    try {
      await deleteRequest(moduleConfig.detailEndpoint(transferId));
      toast.success(moduleConfig.deletedToast);
      await mutate((key) => typeof key === 'string' && key.startsWith(moduleConfig.listEndpoint));
      router.push(moduleConfig.listPath);
    } catch (deleteError) {
      toast.error(
        extractErrorMessage(deleteError?.response?.data || deleteError) || moduleConfig.deleteError
      );
    }
  };

  const handleDownloadPdf = async () => {
    if (!transfer) {
      return;
    }

    setDownloadingPdf(true);

    try {
      const blob = await pdf(
        <StockTransferPDF transfer={transfer} moduleConfig={moduleConfig} lineItems={lineItems} />
      ).toBlob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = downloadUrl;
      link.download = `${transfer?.transfer_number || moduleConfig.singularTitle}-details.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      toast.success('Transfer PDF downloaded.');
    } catch (downloadError) {
      toast.error('Failed to prepare transfer PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSuccess = async (record) => {
    await Promise.all([
      mutate((key) => typeof key === 'string' && key.startsWith(moduleConfig.listEndpoint)),
      record?.id ? mutate(moduleConfig.detailEndpoint(record.id)) : Promise.resolve(),
      detailUrl ? mutate(detailUrl) : Promise.resolve(),
    ]);

    if (formMode === 'create' && record?.id) {
      router.push(moduleConfig.detailPath(record.id));
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
              href={moduleConfig.listPath}
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
            >
              {moduleConfig.backToListLabel}
            </Button>

            <Box>
              <Typography variant="h4" fontWeight={700} color="#0f172a">
                {transfer?.transfer_number || moduleConfig.detailHeadingFallback}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {moduleConfig.detailDescription}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:download-bold" />}
              onClick={handleDownloadPdf}
              disabled={loading || Boolean(error) || !transfer || downloadingPdf}
            >
              {downloadingPdf ? 'Preparing PDF...' : 'Download PDF'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
              onClick={handleCreate}
            >
              {moduleConfig.createLabel}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={handleEdit}
              disabled={loading || Boolean(error) || !transfer}
            >
              {moduleConfig.editLabel}
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={() => setDeleteOpen(true)}
              disabled={loading || Boolean(error) || !transfer}
            >
              {moduleConfig.deleteLabel}
            </Button>
            {!loading && !error && transfer && (
              <Chip
                size="medium"
                color={statusChip.color}
                label={statusChip.label}
                variant="soft"
              />
            )}
          </Stack>
        </Stack>

        {loading && (
          <Card sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2.5}>
              <Skeleton variant="text" width="35%" height={42} />
              <Skeleton variant="rounded" height={120} />
              <Skeleton variant="rounded" height={320} />
            </Stack>
          </Card>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {moduleConfig.detailLoadError}
          </Alert>
        )}

        {!loading && !error && transfer && (
          <Stack spacing={3}>
            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography variant="h5" fontWeight={700} color="#0f172a">
                    {transfer.transfer_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Products move from {sourceLabel} to {destinationLabel} through this internal
                    transfer route.
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={sourceLabel} variant="outlined" />
                  <Chip
                    label={destinationLabel}
                    variant="outlined"
                    sx={{ borderColor: '#bae6fd', bgcolor: '#ecfeff' }}
                  />
                  <Chip label={`Items ${lineMetrics.items}`} variant="outlined" />
                  <Chip
                    label={`Qty ${lineMetrics.quantity.toLocaleString('en-BD')}`}
                    variant="outlined"
                  />
                  <Chip
                    label={formatCurrency(transfer.total_value)}
                    color="primary"
                    variant="soft"
                  />
                </Stack>
              </Stack>
            </Card>

            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="From Warehouse" value={transfer.from_warehouse_name} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="To Warehouse" value={transfer.to_warehouse_name} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Dispatch Label" value={transfer.from_location} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Receiving Label" value={transfer.to_location} />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Transfer Date" value={formatDate(transfer.transfer_date)} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Dispatch Owner" value={transfer.sent_by_name} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Receiving Owner" value={transfer.received_by_name} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Status" value={transfer.status} />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField
                    label="Vehicle / Transport Reference"
                    value={transfer.vehicle_number}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Driver / Courier Name" value={transfer.driver_name} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Created At" value={formatDateTime(transfer.created_at)} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Updated At" value={formatDateTime(transfer.updated_at)} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <DetailField label="Movement Notes" value={transfer.notes} />
                </Grid>
              </Grid>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <Box sx={{ p: 3, pb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  {moduleConfig.lineItemsTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {moduleConfig.lineItemsDescription}
                </Typography>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell>Item</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Line Total</TableCell>
                      <TableCell>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lineItems.map((line) => (
                      <TableRow key={line.id} hover>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant="body2" fontWeight={700} color="#0f172a">
                              {line.item_name || line.item_code || 'Unnamed item'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Code {line.item_code || 'Not recorded'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{line.product_name || 'Unlinked product'}</TableCell>
                        <TableCell align="right">
                          {Number(line.quantity || 0).toLocaleString('en-BD')}
                        </TableCell>
                        <TableCell>{line.unit || 'N/A'}</TableCell>
                        <TableCell align="right">{formatCurrency(line.unit_price)}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(
                            Number(line.quantity || 0) * Number(line.unit_price || 0)
                          )}
                        </TableCell>
                        <TableCell>{line.remarks || 'N/A'}</TableCell>
                      </TableRow>
                    ))}

                    {!lineItems.length && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            {moduleConfig.noLineItemsDescription}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {!!lineItems.length && (
                <Box sx={{ px: 3, py: 2.5, bgcolor: '#f8fafc' }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <DetailField label="Line Items" value={lineMetrics.items} />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <DetailField
                        label="Transfer Qty"
                        value={lineMetrics.quantity.toLocaleString('en-BD')}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <DetailField label="Line Value" value={formatCurrency(lineMetrics.value)} />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <DetailField
                        label="Document Value"
                        value={formatCurrency(transfer.total_value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Card>
          </Stack>
        )}
      </Stack>

      <StockTransferFormDialog
        open={formOpen}
        mode={formMode}
        transferId={formMode === 'edit' ? transferId : null}
        entityLabel={moduleConfig.entityLabel}
        listEndpoint={moduleConfig.listEndpoint}
        detailEndpointBuilder={moduleConfig.detailEndpoint}
        onClose={() => setFormOpen(false)}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={moduleConfig.deleteTitle}
        content={moduleConfig.deleteContent}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
