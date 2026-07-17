'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useMemo, useState } from 'react';
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

import QualityCheckFormDialog from './quality-check-form-dialog';
import {
  formatDate,
  formatDateTime,
  normalizeStatus,
  getStatusChipProps,
  getResultChipProps,
  getPriorityChipProps,
  getRecommendedAction,
} from './quality-check-shared';

function DetailField({ label, value, preWrap }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body1"
        fontWeight={600}
        color="#0f172a"
        sx={preWrap ? { whiteSpace: 'pre-wrap' } : undefined}
      >
        {value || 'N/A'}
      </Typography>
    </Box>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
      {title && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
          {icon && <Iconify icon={icon} width={20} color="primary.main" />}
          <Typography variant="h6" fontWeight={700} color="#0f172a">
            {title}
          </Typography>
        </Stack>
      )}
      {children}
    </Card>
  );
}

function getActionSeverity(status) {
  switch (normalizeStatus(status)) {
    case 'approved':
      return 'success';
    case 'declined':
      return 'error';
    default:
      return 'info';
  }
}

export default function QualityCheckDetails() {
  const params = useParams();
  const router = useRouter();
  const qualityCheckId = params?.qualityCheckId;
  const detailUrl = qualityCheckId
    ? endpoints.storeInventory.quality_check_by_id(qualityCheckId)
    : null;

  const { data: qualityCheck, loading, error } = useGetRequest(detailUrl);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const handleEdit = () => setFormOpen(true);

  const handleFormSuccess = async (record) => {
    await Promise.all([
      mutate(endpoints.storeInventory.quality_checks),
      detailUrl ? mutate(detailUrl) : Promise.resolve(),
      record?.id
        ? mutate(endpoints.storeInventory.quality_check_by_id(record.id))
        : Promise.resolve(),
    ]);
  };

  const statusChip = useMemo(
    () => getStatusChipProps(qualityCheck?.status),
    [qualityCheck?.status]
  );
  const resultChip = useMemo(
    () => getResultChipProps(qualityCheck?.result),
    [qualityCheck?.result]
  );
  const priorityChip = useMemo(
    () => getPriorityChipProps(qualityCheck?.priority),
    [qualityCheck?.priority]
  );
  const actionSeverity = getActionSeverity(qualityCheck?.status);

  const handleDelete = async () => {
    if (!qualityCheckId) return;
    try {
      await deleteRequest(endpoints.storeInventory.quality_check_by_id(qualityCheckId));
      toast.success('Quality check deleted successfully.');
      await mutate(endpoints.storeInventory.quality_checks);
      router.push(paths.dashboard.storeInventory.qualityChecks);
    } catch (deleteError) {
      toast.error(extractErrorMessage(deleteError?.response?.data || deleteError));
    }
  };

  const locationName = qualityCheck?.office_location_name || qualityCheck?.warehouse_name || null;

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        {/* Header */}
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
              href={paths.dashboard.storeInventory.qualityChecks}
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
            >
              Back
            </Button>
            <Box>
              <Typography variant="h4" fontWeight={700} color="#0f172a">
                {qualityCheck?.reference || 'Quality Check Details'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review inspection details, findings, and corrective actions.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={handleEdit}
              disabled={loading || Boolean(error) || !qualityCheck}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={() => setDeleteOpen(true)}
              disabled={loading || Boolean(error) || !qualityCheck}
            >
              Delete
            </Button>
            {!loading && !error && qualityCheck && (
              <>
                <Chip
                  size="medium"
                  color="primary"
                  label={qualityCheck.check_type || 'Unknown'}
                  variant="soft"
                />
                <Chip
                  size="medium"
                  color={statusChip.color}
                  label={statusChip.label}
                  variant="soft"
                />
                <Chip
                  size="medium"
                  color={priorityChip.color}
                  label={priorityChip.label}
                  variant="soft"
                />
              </>
            )}
          </Stack>
        </Stack>

        {/* Loading skeleton */}
        {loading && (
          <Card sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2.5}>
              <Skeleton variant="text" width="35%" height={42} />
              <Skeleton variant="rounded" height={120} />
              <Skeleton variant="rounded" height={280} />
            </Stack>
          </Card>
        )}

        {/* Error */}
        {!loading && error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Failed to load the selected quality check. Please try again.
          </Alert>
        )}

        {/* Content */}
        {!loading && !error && qualityCheck && (
          <Stack spacing={3}>
            {/* Summary banner */}
            <Card
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)',
                color: '#fff',
              }}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={2}
                alignItems={{ md: 'center' }}
              >
                <Box>
                  <Typography variant="h5" fontWeight={800}>
                    {qualityCheck.reference}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
                    {qualityCheck.product_name || 'No product'}
                    {locationName ? ` • ${locationName}` : ''}
                    {qualityCheck.inspector ? ` • Inspector: ${qualityCheck.inspector}` : ''}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    label={qualityCheck.check_type || 'Unknown'}
                    sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', fontWeight: 700 }}
                  />
                  <Chip label={statusChip.label} color={statusChip.color} variant="soft" />
                  {qualityCheck.result && (
                    <Chip label={resultChip.label} color={resultChip.color} variant="soft" />
                  )}
                  <Chip label={priorityChip.label} color={priorityChip.color} variant="soft" />
                </Stack>
              </Stack>
            </Card>

            {/* Stat cards */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
                  <Typography variant="overline" color="text.secondary">
                    Inspection Date
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    {formatDate(qualityCheck.date)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {qualityCheck.check_type} inspection
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
                  <Typography variant="overline" color="text.secondary">
                    Office / Warehouse
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    {locationName || 'Not linked'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {qualityCheck.office_location_type || qualityCheck.warehouse_code || 'No code'}
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
                  <Typography variant="overline" color="text.secondary">
                    Product
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    {qualityCheck.product_name || 'Not linked'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {qualityCheck.product_code || 'No code'}
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
                  <Typography variant="overline" color="text.secondary">
                    Priority
                  </Typography>
                  <Chip
                    size="medium"
                    color={priorityChip.color}
                    label={priorityChip.label}
                    variant="soft"
                    sx={{ mt: 0.5 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Inspector: {qualityCheck.inspector || 'Not assigned'}
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {/* Main content grid */}
            <Grid container spacing={3}>
              {/* General Info */}
              <Grid size={{ xs: 12, lg: 6 }}>
                <SectionCard title="General Information" icon="solar:clipboard-text-bold-duotone">
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Reference" value={qualityCheck.reference} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Check Type" value={qualityCheck.check_type} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Status" value={statusChip.label} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Result" value={qualityCheck.result || '—'} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Priority" value={qualityCheck.priority || '—'} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Inspector" value={qualityCheck.inspector} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Created By" value={qualityCheck.created_by_name} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField
                        label="Created At"
                        value={formatDateTime(qualityCheck.created_at)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField
                        label="Updated At"
                        value={formatDateTime(qualityCheck.updated_at)}
                      />
                    </Grid>
                  </Grid>
                </SectionCard>
              </Grid>

              {/* Office + Product Info */}
              <Grid size={{ xs: 12, lg: 6 }}>
                <SectionCard title="Location & Product" icon="solar:buildings-2-bold-duotone">
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Office / Warehouse" value={locationName} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField
                        label="Location Type"
                        value={qualityCheck.office_location_type || qualityCheck.warehouse_code}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Product" value={qualityCheck.product_name} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Product Code" value={qualityCheck.product_code} />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2.5 }} />

                  {/* Recommended action */}
                  <Alert severity={actionSeverity} sx={{ borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                      Recommended Action
                    </Typography>
                    <Typography variant="body2">
                      {getRecommendedAction(qualityCheck.status)}
                    </Typography>
                  </Alert>
                </SectionCard>
              </Grid>

              {/* Result & Findings */}
              <Grid size={{ xs: 12 }}>
                <SectionCard
                  title="Inspection Findings & Actions"
                  icon="solar:document-medicine-bold-duotone"
                >
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        color="#0f172a"
                        sx={{ mb: 1 }}
                      >
                        Findings
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ whiteSpace: 'pre-wrap' }}
                      >
                        {qualityCheck.findings || 'No findings recorded.'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        color="#0f172a"
                        sx={{ mb: 1 }}
                      >
                        Corrective Actions
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ whiteSpace: 'pre-wrap' }}
                      >
                        {qualityCheck.corrective_actions || 'No corrective actions recorded.'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        color="#0f172a"
                        sx={{ mb: 1 }}
                      >
                        Remarks / Notes
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ whiteSpace: 'pre-wrap' }}
                      >
                        {qualityCheck.remarks || qualityCheck.notes || 'No remarks recorded.'}
                      </Typography>
                    </Grid>
                  </Grid>
                </SectionCard>
              </Grid>
            </Grid>
          </Stack>
        )}
      </Stack>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Quality Check"
        content={`Are you sure you want to delete ${qualityCheck?.reference || 'this quality check'}?`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />

      <QualityCheckFormDialog
        open={formOpen}
        mode="edit"
        qualityCheckId={qualityCheckId}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </Box>
  );
}
