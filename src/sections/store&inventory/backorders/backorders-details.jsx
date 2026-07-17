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

import BackorderFormDialog from './backorder-form-dialog';

const EP = endpoints.storeInventory;

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

export default function BackordersDetails() {
  const params = useParams();
  const router = useRouter();
  const backorderId = params?.backorderId;
  const detailUrl = backorderId ? EP.backorder_by_id(backorderId) : null;
  const { data: backorder, loading, error } = useGetRequest(detailUrl);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('edit');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const lineItems = useMemo(
    () => (Array.isArray(backorder?.line_items) ? backorder.line_items : []),
    [backorder]
  );
  const outstandingLines = useMemo(
    () =>
      lineItems
        .map((line) => ({
          ...line,
          pending_qty: Math.max(Number(line.ordered_qty || 0) - Number(line.received_qty || 0), 0),
        }))
        .filter((line) => Number(line.pending_qty || 0) > 0),
    [lineItems]
  );

  const lineMetrics = useMemo(
    () => ({
      items: outstandingLines.length,
      ordered: outstandingLines.reduce((total, row) => total + Number(row.ordered_qty || 0), 0),
      received: outstandingLines.reduce((total, row) => total + Number(row.received_qty || 0), 0),
      accepted: outstandingLines.reduce((total, row) => total + Number(row.accepted_qty || 0), 0),
      rejected: outstandingLines.reduce((total, row) => total + Number(row.rejected_qty || 0), 0),
      pending: outstandingLines.reduce((total, row) => total + Number(row.pending_qty || 0), 0),
    }),
    [outstandingLines]
  );

  const statusChip = getStatusChipProps(backorder?.status);

  const revalidateBackorderQueries = async () => {
    await mutate((key) => typeof key === 'string' && key.startsWith(EP.backorders), undefined, {
      revalidate: true,
    });
  };

  const handleCreate = () => {
    setFormMode('create');
    setFormOpen(true);
  };

  const handleEdit = () => {
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!backorderId) {
      return;
    }

    try {
      await deleteRequest(EP.backorder_by_id(backorderId));
      await revalidateBackorderQueries();
      toast.success('Backorder deleted successfully.');
      router.push(paths.dashboard.storeInventory.backorders);
    } catch (deleteError) {
      toast.error(extractErrorMessage(deleteError?.response?.data || deleteError));
    }
  };

  const handleSuccess = async (record) => {
    await revalidateBackorderQueries();

    if (formMode === 'create' && record?.id) {
      router.push(paths.dashboard.storeInventory.backorders_detail(record.id));
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
              href={paths.dashboard.storeInventory.backorders}
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
            >
              Back to Backorders
            </Button>

            <Box>
              <Typography variant="h4" fontWeight={700} color="#0f172a">
                {backorder?.grn_number || 'Backorder Details'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review supplier context, receipt progress, outstanding quantities, and audit
                context.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
              onClick={handleCreate}
            >
              Create Backorder
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={handleEdit}
              disabled={loading || Boolean(error) || !backorder}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={() => setDeleteOpen(true)}
              disabled={loading || Boolean(error) || !backorder}
            >
              Delete
            </Button>
            {!loading && !error && backorder && (
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
              <Skeleton variant="rounded" height={280} />
            </Stack>
          </Card>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Failed to load the selected backorder. Please try again.
          </Alert>
        )}

        {!loading && !error && backorder && (
          <Stack spacing={3}>
            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography variant="h5" fontWeight={700} color="#0f172a">
                    {backorder.grn_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vendor {backorder.vendor_name || backorder.supplier_name || 'Not linked'}
                    {' • '}PO {backorder.po_number_display || backorder.po_number || 'Not linked'}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`Outstanding lines ${lineMetrics.items}`} variant="outlined" />
                  <Chip
                    label={`Pending ${lineMetrics.pending.toLocaleString('en-BD')}`}
                    color="warning"
                    variant="soft"
                  />
                  <Chip
                    label={`Received ${lineMetrics.received.toLocaleString('en-BD')}`}
                    variant="outlined"
                  />
                </Stack>
              </Stack>
            </Card>

            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField
                    label="PO Reference"
                    value={backorder.po_number_display || backorder.po_number}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField
                    label="Vendor"
                    value={backorder.vendor_name || backorder.supplier_name}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Warehouse" value={backorder.warehouse_name} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Received By" value={backorder.received_by_name} />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Receive Date" value={formatDate(backorder.receive_date)} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Invoice Number" value={backorder.invoice_number} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Challan Number" value={backorder.challan_number} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Vehicle Number" value={backorder.vehicle_number} />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField
                    label="Approval Level"
                    value={`${backorder.approval_level || 0}/${backorder.total_levels || 1}`}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Status" value={backorder.status} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Created At" value={formatDateTime(backorder.created_at)} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Updated At" value={formatDateTime(backorder.updated_at)} />
                </Grid>
              </Grid>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <Box sx={{ p: 3, pb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Outstanding Line Items
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ordered, received, accepted, rejected, and remaining quantities for lines still
                  open on this backorder.
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
                      <TableCell align="right">Pending</TableCell>
                      <TableCell>Unit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {outstandingLines.map((line) => (
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
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} color="#b45309">
                            {Number(line.pending_qty || 0).toLocaleString('en-BD')}
                          </Typography>
                        </TableCell>
                        <TableCell>{line.unit || 'N/A'}</TableCell>
                      </TableRow>
                    ))}

                    {!outstandingLines.length && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            No outstanding line items remain on this receipt.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {!!outstandingLines.length && (
                <Box sx={{ px: 3, py: 2.5, bgcolor: '#f8fafc' }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, md: 2.4 }}>
                      <DetailField
                        label="Ordered Qty"
                        value={lineMetrics.ordered.toLocaleString('en-BD')}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 2.4 }}>
                      <DetailField
                        label="Received Qty"
                        value={lineMetrics.received.toLocaleString('en-BD')}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 2.4 }}>
                      <DetailField
                        label="Accepted Qty"
                        value={lineMetrics.accepted.toLocaleString('en-BD')}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 2.4 }}>
                      <DetailField
                        label="Rejected Qty"
                        value={lineMetrics.rejected.toLocaleString('en-BD')}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 2.4 }}>
                      <DetailField
                        label="Pending Qty"
                        value={lineMetrics.pending.toLocaleString('en-BD')}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Card>

            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Stack spacing={1.5}>
                <Typography variant="h6" fontWeight={700}>
                  Processing Guidance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {normalizeStatus(backorder.status) === 'draft'
                    ? 'The backorder is still a draft. Confirm the vendor commitment, warehouse ownership, and open quantities before routing it for quality check or approval.'
                    : normalizeStatus(backorder.status) === 'pending quality check'
                      ? 'The receipt is waiting on quality verification. Inspect what has already arrived and keep the outstanding balance visible for supplier follow-up.'
                      : normalizeStatus(backorder.status) === 'pending approval'
                        ? 'The receipt is pending approval. Validate the remaining quantities and confirm whether a supplier escalation or revised delivery commitment is required.'
                        : normalizeStatus(backorder.status) === 'approved' ||
                            normalizeStatus(backorder.status) === 'posted to stock'
                          ? 'The receipt has moved forward in workflow, but open quantities still remain. Use this record to coordinate the remaining supplier delivery and reconcile the final receipt once fulfilled.'
                          : 'Review the current disposition and confirm whether the supplier still owes the outstanding quantities captured on this document.'}
                </Typography>
              </Stack>
            </Card>
          </Stack>
        )}
      </Stack>

      <BackorderFormDialog
        open={formOpen}
        mode={formMode}
        backorderId={formMode === 'edit' ? backorderId : null}
        onClose={() => setFormOpen(false)}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Backorder"
        content="Deleting this backorder will also remove its generated stock movements."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
