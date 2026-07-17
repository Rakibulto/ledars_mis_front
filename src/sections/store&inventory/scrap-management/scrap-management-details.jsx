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
  Button,
  Divider,
  Skeleton,
  Typography,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import {
  useGetRequest,
  extractErrorMessage,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import ScrapApprovalDialog from './scrap-approval-dialog';

const EP = endpoints.storeInventory;

function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function getStatusChipProps(status) {
  switch (normalizeStatus(status)) {
    case 'completed':
      return { color: 'success', label: 'Completed' };
    case 'approved':
      return { color: 'info', label: 'Approved' };
    case 'cancelled':
      return { color: 'error', label: 'Cancelled' };
    case 'pending approval':
      return { color: 'warning', label: 'Pending Approval' };
    default:
      return { color: 'default', label: status || 'Unknown' };
  }
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

export default function ScrapManagementDetails() {
  const params = useParams();
  const router = useRouter();
  const scrapId = params?.scrapId;
  const detailUrl = scrapId ? EP.scrap_record_by_id(scrapId) : null;
  const { data: scrapRecord, loading, error } = useGetRequest(detailUrl);
  const { user } = useAuthContext();

  // Fetch approval workflow config for scrap management
  const { data: rawApprovalWorkflows } = useGetRequest(
    `${EP.approval_workflows}?menu=scrap_management`
  );

  // Build workflow lookup: { eligible user emails => user names }
  const workflowEligibleUsers = useMemo(() => {
    const workflows = Array.isArray(rawApprovalWorkflows)
      ? rawApprovalWorkflows
      : Array.isArray(rawApprovalWorkflows?.results)
        ? rawApprovalWorkflows.results
        : [];

    const activeWorkflow = workflows.find((wf) => wf.is_active);
    if (!activeWorkflow) return { emails: [], names: [] };

    const userMap = {};
    const nameList = [];

    if (Array.isArray(activeWorkflow.levels)) {
      activeWorkflow.levels.forEach((level) => {
        if (Array.isArray(level.level_users)) {
          level.level_users.forEach((lu) => {
            const email = String(lu.user_detail?.email || '').toLowerCase();
            const name = lu.user_detail?.full_name || lu.user_detail?.email || 'Unknown';
            if (email && !userMap[email]) {
              userMap[email] = true;
              nameList.push(name);
            }
          });
        }
      });
    }

    return { emails: Object.keys(userMap), names: nameList };
  }, [rawApprovalWorkflows]);

  const userEmail = (user?.email || '').toLowerCase();
  const isUserEligible = workflowEligibleUsers.emails.includes(userEmail);

  // Check if user already approved
  const approvalLog = Array.isArray(scrapRecord?.approval_log) ? scrapRecord.approval_log : [];
  const userAlreadyApproved = approvalLog.some(
    (entry) => String(entry.email || '').toLowerCase() === userEmail
  );

  const showApproveOnDetail =
    scrapRecord &&
    isUserEligible &&
    !userAlreadyApproved &&
    normalizeStatus(scrapRecord.status) === 'pending approval';

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

  const statusChip = getStatusChipProps(scrapRecord?.status);

  const revalidateScrapQueries = async () => {
    await mutate((key) => typeof key === 'string' && key.startsWith(EP.scrap_records), undefined, {
      revalidate: true,
    });
  };

  const handleCreate = () => {
    router.push(paths.dashboard.storeInventory.scrapManagement_create);
  };

  const handleEdit = () => {
    router.push(paths.dashboard.storeInventory.scrapManagement_edit(scrapId));
  };

  const handleDelete = async () => {
    if (!scrapId) {
      return;
    }

    try {
      await deleteRequest(EP.scrap_record_by_id(scrapId));
      await revalidateScrapQueries();
      toast.success('Scrap record deleted successfully.');
      router.push(paths.dashboard.storeInventory.scrapManagement);
    } catch (deleteError) {
      toast.error(extractErrorMessage(deleteError?.response?.data || deleteError));
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
              href={paths.dashboard.storeInventory.scrapManagement}
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
            >
              Back to Scrap Management
            </Button>

            <Box>
              <Typography variant="h4" fontWeight={700} color="#0f172a">
                {scrapRecord?.reference || 'Scrap Record Details'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review the product, office location, disposal method, status, and audit trail for
                this inventory write-off.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {showApproveOnDetail && (
              <Button
                variant="contained"
                color="success"
                startIcon={<Iconify icon="solar:check-circle-bold" />}
                onClick={() => setApprovalDialogOpen(true)}
              >
                Approve
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
              onClick={handleCreate}
            >
              Create Scrap Record
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={handleEdit}
              disabled={loading || Boolean(error) || !scrapRecord}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={() => setDeleteOpen(true)}
              disabled={loading || Boolean(error) || !scrapRecord}
            >
              Delete
            </Button>
            {!loading && !error && scrapRecord && (
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
            Failed to load the selected scrap record. Please try again.
          </Alert>
        )}

        {!loading && !error && scrapRecord && (
          <Stack spacing={3}>
            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography variant="h5" fontWeight={700} color="#0f172a">
                    {scrapRecord.reference}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {scrapRecord.product_name || 'Product pending'}
                    {' • '}
                    {scrapRecord.office_location_name ||
                      scrapRecord.warehouse_name ||
                      'Location not assigned'}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    label={`Qty ${formatQuantity(scrapRecord.quantity)} ${scrapRecord.uom_name || ''}`.trim()}
                    variant="outlined"
                  />
                  <Chip
                    label={scrapRecord.disposal_method || 'Method pending'}
                    variant="outlined"
                  />
                  <Chip
                    label={scrapRecord.certificate_number || 'Certificate pending'}
                    color="primary"
                    variant="soft"
                  />
                </Stack>
              </Stack>
            </Card>

            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Product" value={scrapRecord.product_name} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Product Code" value={scrapRecord.product_code} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField
                    label="Office / Location"
                    value={scrapRecord.office_location_name || scrapRecord.warehouse_name}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Status" value={statusChip.label} />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Scrap Date" value={formatDate(scrapRecord.date)} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField
                    label="Disposal Date"
                    value={formatDate(scrapRecord.disposal_date)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField
                    label="Quantity"
                    value={`${formatQuantity(scrapRecord.quantity)} ${scrapRecord.uom_name || ''}`.trim()}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DetailField label="Recorded By" value={scrapRecord.scrapped_by_name} />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <DetailField label="Disposal Method" value={scrapRecord.disposal_method} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <DetailField label="Certificate Number" value={scrapRecord.certificate_number} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <DetailField label="Created At" value={formatDateTime(scrapRecord.created_at)} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <DetailField label="Reason" value={scrapRecord.reason} />
                </Grid>
              </Grid>

              {/* Approval Log Section */}
              {approvalLog.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Box>
                    <Typography variant="h6" fontWeight={700} mb={1.5}>
                      Approval History
                    </Typography>
                    <Stack spacing={1}>
                      {approvalLog.map((entry, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            p: 1.5,
                            bgcolor: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            borderRadius: 1.5,
                          }}
                        >
                          <Typography variant="body2" fontWeight={600} color="#0369a1">
                            {entry.name || entry.email || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {entry.approved_at ? formatDateTime(entry.approved_at) : 'Approved'}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </>
              )}
            </Card>

            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Stack spacing={1.5}>
                <Typography variant="h6" fontWeight={700}>
                  Processing Guidance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {normalizeStatus(scrapRecord.status) === 'completed'
                    ? 'The write-off has been completed. Confirm the certificate reference and disposal method match the physical disposal evidence.'
                    : normalizeStatus(scrapRecord.status) === 'approved'
                      ? 'The scrap record is approved and ready for final disposal. Capture the disposal date and certificate once the action is executed.'
                      : normalizeStatus(scrapRecord.status) === 'cancelled'
                        ? 'This scrap record is cancelled. Review whether a replacement audit entry is needed and confirm no further disposal action should continue.'
                        : 'This scrap record is still pending. Review the reason, quantity, and disposal plan before completing the write-off.'}
                </Typography>
              </Stack>
            </Card>
          </Stack>
        )}
      </Stack>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Scrap Record"
        content="Deleting this scrap record will also remove its generated stock movement audit row."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />

      <ScrapApprovalDialog
        open={approvalDialogOpen}
        scrapRecord={scrapRecord}
        onClose={() => setApprovalDialogOpen(false)}
        onSuccess={async () => {
          setApprovalDialogOpen(false);
          await revalidateScrapQueries();
          if (detailUrl) await mutate(detailUrl);
        }}
      />
    </Box>
  );
}
