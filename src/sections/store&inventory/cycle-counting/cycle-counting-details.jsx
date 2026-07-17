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

import CycleCountingFormDialog from './cycle-counting-form-dialog';

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

function formatPercent(value) {
  return Number(value || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatVariance(value) {
  if (value === null || typeof value === 'undefined') {
    return 'Pending';
  }

  const amount = Number(value || 0);

  if (amount > 0) {
    return `+${amount.toLocaleString('en-BD')}`;
  }

  return amount.toLocaleString('en-BD');
}

function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function getStatusChipProps(status) {
  switch (normalizeStatus(status)) {
    case 'reviewed':
      return { color: 'secondary', label: 'Reviewed' };
    case 'completed':
      return { color: 'success', label: 'Completed' };
    case 'in progress':
      return { color: 'info', label: 'In Progress' };
    case 'scheduled':
      return { color: 'warning', label: 'Scheduled' };
    case 'cancelled':
      return { color: 'error', label: 'Cancelled' };
    default:
      return { color: 'default', label: status || 'Unknown' };
  }
}

function getCountTypeChipProps(type) {
  switch (
    String(type || '')
      .trim()
      .toLowerCase()
  ) {
    case 'abc cycle count':
      return { color: 'primary', label: 'ABC Cycle Count' };
    case 'high value audit':
      return { color: 'error', label: 'High Value Audit' };
    case 'expiry review':
      return { color: 'warning', label: 'Expiry Review' };
    case 'full physical count':
      return { color: 'success', label: 'Full Physical Count' };
    default:
      return { color: 'default', label: type || 'Custom' };
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

export default function CycleCountingDetails() {
  const params = useParams();
  const router = useRouter();
  const countId = params?.countId;
  const detailUrl = countId ? endpoints.storeInventory.cycle_count_by_id(countId) : null;

  const { data: count, loading, error } = useGetRequest(detailUrl);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('edit');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const lineItems = useMemo(() => (Array.isArray(count?.lines) ? count.lines : []), [count]);

  const lineMetrics = useMemo(
    () => ({
      items: lineItems.length,
      countedItems: lineItems.filter((line) => line.counted_qty !== null).length,
      varianceCount: lineItems.filter(
        (line) => line.variance !== null && Number(line.variance || 0) !== 0
      ).length,
      varianceTotal: lineItems.reduce((total, line) => total + Number(line.variance || 0), 0),
    }),
    [lineItems]
  );

  const statusChip = getStatusChipProps(count?.status);
  const typeChip = getCountTypeChipProps(count?.count_type);

  const handleCreate = () => {
    setFormMode('create');
    setFormOpen(true);
  };

  const handleEdit = () => {
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!countId) {
      return;
    }

    try {
      await deleteRequest(endpoints.storeInventory.cycle_count_by_id(countId));
      toast.success('Cycle count session deleted successfully.');
      await mutate(endpoints.storeInventory.cycle_counts);
      router.push(paths.dashboard.storeInventory.cycleCounting);
    } catch (deleteError) {
      toast.error(extractErrorMessage(deleteError?.response?.data || deleteError));
    }
  };

  const handleSuccess = async (record) => {
    await Promise.all([
      mutate(endpoints.storeInventory.cycle_counts),
      record?.id
        ? mutate(endpoints.storeInventory.cycle_count_by_id(record.id))
        : Promise.resolve(),
      detailUrl ? mutate(detailUrl) : Promise.resolve(),
    ]);

    if (formMode === 'create' && record?.id) {
      router.push(paths.dashboard.storeInventory.cycleCounting_detail(record.id));
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
              href={paths.dashboard.storeInventory.cycleCounting}
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
            >
              Back to Cycle Counts
            </Button>

            <Box>
              <Typography variant="h4" fontWeight={700} color="#0f172a">
                {count?.count_number || 'Cycle Count Details'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review session scope, warehouse ownership, counted progress, and variance lines
                before converting findings into downstream stock decisions.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
              onClick={handleCreate}
            >
              Create Session
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={handleEdit}
              disabled={loading || Boolean(error) || !count}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={() => setDeleteOpen(true)}
              disabled={loading || Boolean(error) || !count}
            >
              Delete
            </Button>
            {!loading && !error && count && (
              <>
                <Chip size="medium" color={typeChip.color} label={typeChip.label} variant="soft" />
                <Chip
                  size="medium"
                  color={statusChip.color}
                  label={statusChip.label}
                  variant="soft"
                />
              </>
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
            Failed to load the selected cycle count session. Please try again.
          </Alert>
        )}

        {!loading && !error && count && (
          <Stack spacing={3}>
            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography variant="h5" fontWeight={700} color="#0f172a">
                    {count.count_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {count.warehouse_name || 'Warehouse not linked'}
                    {count.scope ? ` • ${count.scope}` : ''}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    label={`Items ${count.item_count || lineMetrics.items}`}
                    variant="outlined"
                  />
                  <Chip
                    label={`Counted ${count.counted_items || lineMetrics.countedItems}`}
                    variant="outlined"
                  />
                  <Chip
                    label={`${formatPercent(count.progress_percent)}% Progress`}
                    color="primary"
                    variant="soft"
                  />
                </Stack>
              </Stack>
            </Card>

            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Warehouse" value={count.warehouse_name} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Count Type" value={count.count_type} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Status" value={count.status} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Scope" value={count.scope} />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Scheduled Date" value={formatDate(count.scheduled_date)} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Owner" value={count.owner_name} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Reviewer" value={count.reviewer_name} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField
                    label="Progress"
                    value={`${formatPercent(count.progress_percent)}% complete`}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <DetailField label="Session Notes" value={count.notes} />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <DetailField label="Line Items" value={count.item_count || lineMetrics.items} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField
                    label="Variance Flags"
                    value={count.variance_count ?? lineMetrics.varianceCount}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField
                    label="Variance Total"
                    value={formatVariance(count.variance_total ?? lineMetrics.varianceTotal)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Created At" value={formatDateTime(count.created_at)} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Updated At" value={formatDateTime(count.updated_at)} />
                </Grid>
              </Grid>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <Box sx={{ p: 3, pb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Count Line Items
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review system quantity, counted quantity, location, and variance on each stock
                  line captured in this count session.
                </Typography>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell>Item</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell align="right">System Qty</TableCell>
                      <TableCell align="right">Counted Qty</TableCell>
                      <TableCell align="right">Variance</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell>Notes</TableCell>
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
                              {line.product_name || `Code ${line.item_code || 'N/A'}`}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{line.location || 'N/A'}</TableCell>
                        <TableCell align="right">{formatQuantity(line.system_qty)}</TableCell>
                        <TableCell align="right">
                          {line.counted_qty === null ? 'Pending' : formatQuantity(line.counted_qty)}
                        </TableCell>
                        <TableCell align="right">{formatVariance(line.variance)}</TableCell>
                        <TableCell>{line.unit || 'N/A'}</TableCell>
                        <TableCell>{line.notes || 'N/A'}</TableCell>
                      </TableRow>
                    ))}

                    {!lineItems.length && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            No line items were attached to this cycle count session.
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
                      <DetailField label="Counted Lines" value={lineMetrics.countedItems} />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <DetailField label="Variance Flags" value={lineMetrics.varianceCount} />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <DetailField
                        label="Variance Total"
                        value={formatVariance(lineMetrics.varianceTotal)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Card>
          </Stack>
        )}
      </Stack>

      <CycleCountingFormDialog
        open={formOpen}
        mode={formMode}
        countId={formMode === 'edit' ? countId : null}
        onClose={() => setFormOpen(false)}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Cycle Count Session"
        content="Deleting this cycle count session will remove its counted lines and variance review data."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
