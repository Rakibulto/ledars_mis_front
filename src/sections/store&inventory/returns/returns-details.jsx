'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Button,
  Divider,
  Skeleton,
  Typography,
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

import ReturnsFormDialog from './returns-form-dialog';

const EP = endpoints.storeInventory;

function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function getStatusChipProps(status) {
  switch (normalizeStatus(status)) {
    case 'done':
    case 'completed':
      return { color: 'success', label: 'Done' };
    case 'approved':
      return { color: 'info', label: 'Approved' };
    case 'pending inspection':
      return { color: 'warning', label: 'Pending Inspection' };
    case 'cancelled':
      return { color: 'error', label: 'Cancelled' };
    case 'draft':
      return { color: 'default', label: 'Draft' };
    default:
      return { color: 'default', label: status || 'Unknown' };
  }
}

function getReturnTypeLabel(returnType, returnTypeLabel) {
  if (returnTypeLabel) {
    return returnTypeLabel;
  }

  return returnType === 'supplier' ? 'Supplier Return' : 'Customer Return';
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

function formatQuantity(value) {
  return Number(value || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
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

export default function ReturnsDetails() {
  const params = useParams();
  const router = useRouter();
  const returnId = params?.returnId;
  const detailUrl = returnId ? EP.return_record_by_id(returnId) : null;
  const { data: returnRecord, loading, error } = useGetRequest(detailUrl);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('edit');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const statusChip = getStatusChipProps(returnRecord?.status);

  const revalidateReturnQueries = async () => {
    await mutate((key) => typeof key === 'string' && key.startsWith(EP.return_records), undefined, {
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
    if (!returnId) {
      return;
    }

    try {
      await deleteRequest(EP.return_record_by_id(returnId));
      await revalidateReturnQueries();
      toast.success('Return deleted successfully.');
      router.push(paths.dashboard.storeInventory.returns);
    } catch (deleteError) {
      toast.error(extractErrorMessage(deleteError?.response?.data || deleteError));
    }
  };

  const handleSuccess = async (record) => {
    await revalidateReturnQueries();

    if (formMode === 'create' && record?.id) {
      router.push(paths.dashboard.storeInventory.returns_detail(record.id));
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
              href={paths.dashboard.storeInventory.returns}
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
            >
              Back to Returns
            </Button>

            <Box>
              <Typography variant="h4" fontWeight={700} color="#0f172a">
                {returnRecord?.reference || 'Return Details'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review return origin, stock destination, quantity, condition, and audit context.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
              onClick={handleCreate}
            >
              Create Return
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={handleEdit}
              disabled={loading || Boolean(error) || !returnRecord}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={() => setDeleteOpen(true)}
              disabled={loading || Boolean(error) || !returnRecord}
            >
              Delete
            </Button>
            {!loading && !error && returnRecord && (
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
              <Skeleton variant="rounded" height={220} />
            </Stack>
          </Card>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Failed to load the selected return record. Please try again.
          </Alert>
        )}

        {!loading && !error && returnRecord && (
          <Stack spacing={3}>
            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography variant="h5" fontWeight={700} color="#0f172a">
                    {returnRecord.reference}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getReturnTypeLabel(returnRecord.return_type, returnRecord.return_type_label)}
                    {' • '}
                    {returnRecord.warehouse_name || 'Warehouse not assigned'}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`Qty ${formatQuantity(returnRecord.quantity)}`} variant="outlined" />
                  <Chip label={returnRecord.condition || 'Condition pending'} variant="outlined" />
                  <Chip
                    label={returnRecord.product_name || 'Product pending'}
                    color="primary"
                    variant="soft"
                  />
                </Stack>
              </Stack>
            </Card>

            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField
                    label="Return Type"
                    value={getReturnTypeLabel(
                      returnRecord.return_type,
                      returnRecord.return_type_label
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Product" value={returnRecord.product_name} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Product Code" value={returnRecord.product_code} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Warehouse" value={returnRecord.warehouse_name} />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Return Date" value={formatDate(returnRecord.date)} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Quantity" value={formatQuantity(returnRecord.quantity)} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Condition" value={returnRecord.condition} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Status" value={returnRecord.status} />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <DetailField label="Original Reference" value={returnRecord.original_reference} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <DetailField label="Recorded By" value={returnRecord.created_by_name} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <DetailField label="Created At" value={formatDateTime(returnRecord.created_at)} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <DetailField label="Reason" value={returnRecord.reason} />
                </Grid>
              </Grid>
            </Card>

            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Stack spacing={1.5}>
                <Typography variant="h6" fontWeight={700}>
                  Processing Guidance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {normalizeStatus(returnRecord.status) === 'draft'
                    ? 'The return is still a draft. Validate the source reference, inspect the item condition, and confirm warehouse ownership before approval.'
                    : normalizeStatus(returnRecord.status) === 'pending inspection'
                      ? 'The return is waiting for inspection. Confirm the physical condition and decide whether the stock is restocked, quarantined, or sent back out.'
                      : normalizeStatus(returnRecord.status) === 'approved'
                        ? 'The return is approved. Complete the warehouse posting or supplier dispatch so the reverse movement is fully reconciled.'
                        : normalizeStatus(returnRecord.status) === 'done'
                          ? 'The return is closed. Use this record as the audit source for the linked stock movement and original reference.'
                          : 'Review the current disposition and confirm whether any related stock movement or follow-up action is still pending.'}
                </Typography>
              </Stack>
            </Card>
          </Stack>
        )}
      </Stack>

      <ReturnsFormDialog
        open={formOpen}
        mode={formMode}
        returnId={formMode === 'edit' ? returnId : null}
        onClose={() => setFormOpen(false)}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Return Record"
        content="Deleting this return will also remove its generated stock movement audit row."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
