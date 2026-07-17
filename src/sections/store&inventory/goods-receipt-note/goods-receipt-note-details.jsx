'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';

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

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

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

function getGrnVendorInfo(grn) {
  if (!grn) return null;
  if (grn.vendor_info) return grn.vendor_info;
  if (grn.direct_vendor_name || grn.direct_vendor_email || grn.direct_vendor_phone) {
    return {
      name: grn.direct_vendor_name || grn.vendor_name || grn.supplier_name,
      email: grn.direct_vendor_email,
      phone: grn.direct_vendor_phone,
      address: grn.direct_vendor_address,
      is_direct_evaluation: true,
    };
  }
  return {
    name: grn.vendor_name || grn.supplier_name,
    email: grn.vendor_email,
    phone: grn.vendor_phone,
    address: grn.supplier_address,
    is_direct_evaluation: false,
  };
}

function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function getStatusChipProps(status) {
  switch (normalizeStatus(status)) {
    case 'posted':
    case 'posted to stock':
      return { color: 'secondary', label: 'Posted to Stock' };
    case 'pending approval':
      return { color: 'warning', label: 'Pending Approval' };
    case 'pending quality check':
      return { color: 'warning', label: 'Pending Quality Check' };
    case 'approved':
      return { color: 'success', label: 'Approved' };
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

export default function GoodsReceiptNoteDetails() {
  const params = useParams();
  const grnId = params?.grnId;

  const {
    data: grn,
    loading,
    error,
  } = useGetRequest(grnId ? endpoints.storeInventory.grn_by_id(grnId) : null);

  const lineItems = useMemo(() => (Array.isArray(grn?.line_items) ? grn.line_items : []), [grn]);

  const vendorInfo = useMemo(() => getGrnVendorInfo(grn), [grn]);

  const lineItemMetrics = useMemo(
    () => ({
      items: lineItems.length,
      ordered: lineItems.reduce((total, row) => total + Number(row.ordered_qty || 0), 0),
      received: lineItems.reduce((total, row) => total + Number(row.received_qty || 0), 0),
      accepted: lineItems.reduce((total, row) => total + Number(row.accepted_qty || 0), 0),
      rejected: lineItems.reduce((total, row) => total + Number(row.rejected_qty || 0), 0),
    }),
    [lineItems]
  );

  const statusChip = getStatusChipProps(grn?.status);

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={2}
          alignItems={{ md: 'center' }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Link href={paths.dashboard.storeInventory.goodsReceiptNote} passHref>
              <Button variant="outlined" startIcon={<Iconify icon="eva:arrow-back-fill" />}>
                Back to Receipts
              </Button>
            </Link>
            <Box>
              <Typography variant="h4" fontWeight={700} color="#0f172a">
                {grn?.grn_number || 'Goods Receipt Details'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inspect receipt metadata, vendor context, and received line items.
              </Typography>
            </Box>
          </Stack>

          {!loading && !error && grn && (
            <Chip size="medium" color={statusChip.color} label={statusChip.label} variant="soft" />
          )}
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
            Failed to load the selected GRN. Please try again.
          </Alert>
        )}

        {!loading && !error && grn && (
          <Stack spacing={3}>
            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography variant="h5" fontWeight={700} color="#0f172a">
                    {grn.grn_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vendor {vendorInfo?.name || 'Not linked'}
                    {vendorInfo?.is_direct_evaluation ? ' (Direct Evaluation)' : ''} • PO{' '}
                    {grn.po_number_display || grn.po_number || 'Not linked'}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`Items ${lineItemMetrics.items}`} variant="outlined" />
                  <Chip
                    label={`Accepted ${lineItemMetrics.accepted.toLocaleString('en-BD')}`}
                    variant="outlined"
                  />
                  <Chip label={formatCurrency(grn.total_value)} color="primary" variant="soft" />
                </Stack>
              </Stack>
            </Card>

            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField
                    label="PO Reference"
                    value={grn.po_number_display || grn.po_number}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Vendor" value={vendorInfo?.name} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Vendor Email" value={vendorInfo?.email} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Vendor Phone" value={vendorInfo?.phone} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Warehouse" value={grn.warehouse_name} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Received By" value={grn.received_by_name} />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Receive Date" value={formatDate(grn.receive_date)} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Invoice Number" value={grn.invoice_number} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Challan Number" value={grn.challan_number} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Vehicle Number" value={grn.vehicle_number} />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField
                    label="Approval Level"
                    value={`${grn.approval_level || 0}/${grn.total_levels || 1}`}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Created At" value={formatDateTime(grn.created_at)} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Updated At" value={formatDateTime(grn.updated_at)} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Total Value" value={formatCurrency(grn.total_value)} />
                </Grid>
              </Grid>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <Box sx={{ p: 3, pb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Receipt Line Items
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ordered, received, accepted, and rejected quantities captured against this
                  receipt.
                </Typography>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell>Item</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Ordered</TableCell>
                      <TableCell align="right">Received</TableCell>
                      <TableCell align="right">Accepted</TableCell>
                      <TableCell align="right">Rejected</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
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
                        <TableCell>
                          <Typography variant="body2" color="#475569">
                            {line.product_name || 'Unlinked product'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {Number(line.ordered_qty || 0).toLocaleString('en-BD')}
                        </TableCell>
                        <TableCell align="right">
                          {Number(line.received_qty || 0).toLocaleString('en-BD')}
                        </TableCell>
                        <TableCell align="right">
                          {Number(line.accepted_qty || 0).toLocaleString('en-BD')}
                        </TableCell>
                        <TableCell align="right">
                          {Number(line.rejected_qty || 0).toLocaleString('en-BD')}
                        </TableCell>
                        <TableCell>{line.unit || 'N/A'}</TableCell>
                        <TableCell align="right">{formatCurrency(line.unit_price)}</TableCell>
                      </TableRow>
                    ))}

                    {!lineItems.length && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            No line items were attached to this receipt.
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
                      <DetailField
                        label="Ordered Qty"
                        value={lineItemMetrics.ordered.toLocaleString('en-BD')}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <DetailField
                        label="Received Qty"
                        value={lineItemMetrics.received.toLocaleString('en-BD')}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <DetailField
                        label="Accepted Qty"
                        value={lineItemMetrics.accepted.toLocaleString('en-BD')}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <DetailField
                        label="Rejected Qty"
                        value={lineItemMetrics.rejected.toLocaleString('en-BD')}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Card>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
