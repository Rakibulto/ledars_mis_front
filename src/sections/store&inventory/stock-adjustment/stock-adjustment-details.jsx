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

import { useAuthContext } from 'src/auth/hooks';

import {
  useGetRequest,
  extractErrorMessage,
  usePatchRequest as patchRequest,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import AdjustmentApprovalDialog from './adjustment-approval-dialog';
import AdjustmentApprovalSummary from './adjustment-approval-summary';
import {
  STOCK_ADJUSTMENT_APPROVAL_WORKFLOW_URL,
  computeAdjustmentWorkflowInfo,
} from './adjustment-approval-workflow';

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

function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function getStatusChipProps(status) {
  switch (normalizeStatus(status)) {
    case 'posted':
      return { color: 'secondary', label: 'Posted' };
    case 'approved':
      return { color: 'success', label: 'Approved' };
    case 'pending approval':
      return { color: 'warning', label: 'Pending Approval' };
    case 'cancelled':
      return { color: 'error', label: 'Cancelled' };
    case 'draft':
      return { color: 'default', label: 'Draft' };
    default:
      return { color: 'default', label: status || 'Unknown' };
  }
}

function getAdjustmentTypeChipProps(type) {
  switch (
    String(type || '')
      .trim()
      .toLowerCase()
  ) {
    case 'increase':
      return { color: 'success', label: 'Increase' };
    case 'decrease':
      return { color: 'error', label: 'Decrease' };
    case 'recount':
      return { color: 'info', label: 'Recount' };
    default:
      return { color: 'default', label: type || 'Unknown' };
  }
}

function formatDifference(value) {
  const amount = Number(value || 0);

  if (amount > 0) {
    return `+${amount.toLocaleString('en-BD')}`;
  }

  return amount.toLocaleString('en-BD');
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

export default function StockAdjustmentDetails() {
  const params = useParams();
  const router = useRouter();
  const adjustmentId = params?.adjustmentId;
  const detailUrl = adjustmentId
    ? endpoints.storeInventory.stock_adjustment_by_id(adjustmentId)
    : null;

  const { user } = useAuthContext();
  const { data: adjustment, loading, error } = useGetRequest(detailUrl);
  const { data: rawWorkflow } = useGetRequest(STOCK_ADJUSTMENT_APPROVAL_WORKFLOW_URL);

  const wfInfo = useMemo(
    () =>
      adjustment
        ? computeAdjustmentWorkflowInfo(adjustment, rawWorkflow, user?.email)
        : null,
    [adjustment, rawWorkflow, user?.email]
  );

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

  const lineItems = useMemo(
    () => (Array.isArray(adjustment?.lines) ? adjustment.lines : []),
    [adjustment]
  );

  const lineMetrics = useMemo(
    () => ({
      items: lineItems.length,
      difference: lineItems.reduce((total, line) => total + Number(line.difference || 0), 0),
      value: lineItems.reduce(
        (total, line) =>
          total + Math.abs(Number(line.difference || 0)) * Number(line.unit_price || 0),
        0
      ),
    }),
    [lineItems]
  );

  const statusChip = getStatusChipProps(adjustment?.status);
  const typeChip = getAdjustmentTypeChipProps(adjustment?.adjustment_type);
  const normalizedStatus = normalizeStatus(adjustment?.status);
  const isWorkflowLocked = normalizedStatus === 'approved' || normalizedStatus === 'posted';

  const handleCreate = () => {
    router.push(paths.dashboard.storeInventory.stock_adjustment_create);
  };

  const handleEdit = () => {
    router.push(paths.dashboard.storeInventory.stock_adjustment_edit(adjustmentId));
  };

  const handleDelete = async () => {
    if (!adjustmentId) {
      return;
    }

    try {
      await deleteRequest(endpoints.storeInventory.stock_adjustment_by_id(adjustmentId));
      toast.success('Stock adjustment deleted successfully.');
      await mutate(
        (key) =>
          typeof key === 'string' && key.startsWith(endpoints.storeInventory.stock_adjustments)
      );
      router.push(paths.dashboard.storeInventory.stock_adjustment);
    } catch (deleteError) {
      toast.error(extractErrorMessage(deleteError?.response?.data || deleteError));
    }
  };

  const handleStatusUpdate = async (nextStatus, successMessage) => {
    if (!adjustmentId) {
      return;
    }

    setStatusSubmitting(true);

    try {
      await patchRequest(endpoints.storeInventory.stock_adjustment_by_id(adjustmentId), {
        status: nextStatus,
      });
      toast.success(successMessage);
      await Promise.all([
        mutate(
          (key) =>
            typeof key === 'string' && key.startsWith(endpoints.storeInventory.stock_adjustments)
        ),
        detailUrl ? mutate(detailUrl) : Promise.resolve(),
      ]);
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError?.response?.data || requestError));
    } finally {
      setStatusSubmitting(false);
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
              href={paths.dashboard.storeInventory.stock_adjustment}
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
            >
              Back to Adjustments
            </Button>

            <Box>
              <Typography variant="h4" fontWeight={700} color="#0f172a">
                {adjustment?.adjustment_number || 'Stock Adjustment Details'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review the adjustment reason, approval state, warehouse context, and counted line
                differences before posting inventory corrections.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {normalizedStatus === 'draft' && (
              <Button
                variant="contained"
                color="warning"
                startIcon={<Iconify icon="solar:clipboard-check-bold" />}
                onClick={() =>
                  handleStatusUpdate('Pending Approval', 'Adjustment submitted for approval.')
                }
                disabled={loading || Boolean(error) || !adjustment || statusSubmitting}
              >
                {statusSubmitting ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            )}
            {normalizedStatus === 'pending approval' && wfInfo?.canApprove && (
              <Button
                variant="contained"
                color="success"
                startIcon={<Iconify icon="solar:check-circle-bold" />}
                onClick={() => setApprovalDialogOpen(true)}
                disabled={loading || Boolean(error) || !adjustment}
              >
                Approve
              </Button>
            )}
            {normalizedStatus === 'pending approval' &&
            !wfInfo?.canApprove &&
            wfInfo?.eligibleApproverNames?.length ? (
              <Chip
                size="small"
                variant="outlined"
                label={`Approvers: ${wfInfo.eligibleApproverNames.join(', ')}`}
              />
            ) : null}
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
              onClick={handleCreate}
            >
              Create Adjustment
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={handleEdit}
              disabled={loading || Boolean(error) || !adjustment || isWorkflowLocked}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={() => setDeleteOpen(true)}
              disabled={loading || Boolean(error) || !adjustment || isWorkflowLocked}
            >
              Delete
            </Button>
            {!loading && !error && adjustment && (
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
            Failed to load the selected stock adjustment. Please try again.
          </Alert>
        )}

        {!loading && !error && adjustment && (
          <Stack spacing={3}>
            <Alert
              severity={normalizedStatus === 'approved' ? 'success' : 'info'}
              sx={{ borderRadius: 2 }}
            >
              {normalizedStatus === 'approved'
                ? 'This adjustment has been approved and its line differences are already applied to product stock quantities.'
                : 'Draft and pending adjustments do not change stock yet. Approval is the step that applies each line difference to product quantity.'}
            </Alert>

            {wfInfo?.matchedLevel ? (
              <AdjustmentApprovalSummary wfInfo={wfInfo} />
            ) : null}

            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography variant="h5" fontWeight={700} color="#0f172a">
                    {adjustment.adjustment_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reconcile {adjustment.warehouse_name || 'Warehouse not linked'}
                    {adjustment.location ? ` • ${adjustment.location}` : ''} with approval-based
                    stock posting.
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`Items ${lineMetrics.items}`} variant="outlined" />
                  <Chip
                    label={`Diff ${formatDifference(lineMetrics.difference)}`}
                    variant="outlined"
                  />
                  <Chip
                    label={formatCurrency(adjustment.total_value)}
                    color="primary"
                    variant="soft"
                  />
                </Stack>
              </Stack>
            </Card>

            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Warehouse" value={adjustment.office_location_name} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Location Label" value={adjustment.location} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Adjustment Type" value={adjustment.adjustment_type} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Status" value={adjustment.status} />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <DetailField
                    label="Adjustment Date"
                    value={formatDate(adjustment.adjustment_date)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <DetailField label="Adjusted By" value={adjustment.adjusted_by_name} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <DetailField
                    label="Document Value"
                    value={formatCurrency(adjustment.total_value)}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <DetailField label="Adjustment Reason" value={adjustment.reason} />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <DetailField label="Line Items" value={lineMetrics.items} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField
                    label="Difference Total"
                    value={formatDifference(adjustment.difference_total ?? lineMetrics.difference)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Created At" value={formatDateTime(adjustment.created_at)} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Updated At" value={formatDateTime(adjustment.updated_at)} />
                </Grid>
              </Grid>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <Box sx={{ p: 3, pb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Adjustment Line Items
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  System balance, counted balance, variance, and valuation captured for each stock
                  line in this adjustment.
                </Typography>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell>Item</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">System Qty</TableCell>
                      <TableCell align="right">Counted Qty</TableCell>
                      <TableCell align="right">Difference</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Line Value</TableCell>
                      <TableCell>Reason</TableCell>
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
                          {Number(line.system_qty || 0).toLocaleString('en-BD')}
                        </TableCell>
                        <TableCell align="right">
                          {Number(line.counted_qty || 0).toLocaleString('en-BD')}
                        </TableCell>
                        <TableCell align="right">{formatDifference(line.difference)}</TableCell>
                        <TableCell>{line.unit || 'N/A'}</TableCell>
                        <TableCell align="right">{formatCurrency(line.unit_price)}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(
                            Math.abs(Number(line.difference || 0)) * Number(line.unit_price || 0)
                          )}
                        </TableCell>
                        <TableCell>{line.reason || 'N/A'}</TableCell>
                      </TableRow>
                    ))}

                    {!lineItems.length && (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            No line items were attached to this stock adjustment.
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
                        label="Difference Total"
                        value={formatDifference(lineMetrics.difference)}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <DetailField label="Line Value" value={formatCurrency(lineMetrics.value)} />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <DetailField
                        label="Document Value"
                        value={formatCurrency(adjustment.total_value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Card>
          </Stack>
        )}
      </Stack>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Stock Adjustment"
        content="Deleting this stock adjustment will also remove its generated stock movements."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />

      <AdjustmentApprovalDialog
        open={approvalDialogOpen}
        adjustment={adjustment}
        onClose={() => setApprovalDialogOpen(false)}
        onSuccess={async () => {
          setApprovalDialogOpen(false);
          await Promise.all([
            mutate(
              (key) =>
                typeof key === 'string' &&
                key.startsWith(endpoints.storeInventory.stock_adjustments)
            ),
            detailUrl ? mutate(detailUrl) : Promise.resolve(),
          ]);
        }}
      />
    </Box>
  );
}
