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
  usePatchRequest as patchRequest,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import QualityAlertFormDialog from './quality-alert-form-dialog';
import {
  normalizeText,
  formatDateTime,
  getAlertAction,
  getAlertStatusChipProps,
  getAlertSeverityChipProps,
} from './quality-alert-shared';

const EP = endpoints.storeInventory;

function SectionLabel({ children }) {
  return (
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
      {children}
    </Typography>
  );
}

function SectionValue({ children }) {
  return (
    <Typography variant="body1" fontWeight={600} color="#0f172a">
      {children || 'N/A'}
    </Typography>
  );
}

function DetailField({ label, value }) {
  return (
    <Box>
      <SectionLabel>{label}</SectionLabel>
      <SectionValue>{value}</SectionValue>
    </Box>
  );
}

function StatCard({ icon, label, value, sub, color = '#0f172a', bgColor = '#f8fafc' }) {
  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid #e5e7eb',
        height: '100%',
        bgcolor: bgColor,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.7)',
            display: 'grid',
            placeItems: 'center',
            color,
            flexShrink: 0,
          }}
        >
          <Iconify icon={icon} width={24} />
        </Box>
        <Box>
          <Typography variant="overline" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h6" fontWeight={700} color="#0f172a">
            {value || 'N/A'}
          </Typography>
          {sub && (
            <Typography variant="body2" color="text.secondary">
              {sub}
            </Typography>
          )}
        </Box>
      </Stack>
    </Card>
  );
}

function getActionSeverity(status) {
  const s = normalizeText(status);
  if (s === 'resolved') return 'success';
  if (s === 'in progress') return 'info';
  return 'warning';
}

export default function QualityAlertDetails() {
  const params = useParams();
  const router = useRouter();
  const qualityAlertId = params?.qualityAlertId;
  const detailUrl = qualityAlertId ? EP.quality_alert_by_id(qualityAlertId) : null;

  const { data: qualityAlert, loading, error } = useGetRequest(detailUrl);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('edit');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [progressing, setProgressing] = useState(false);
  const [resolving, setResolving] = useState(false);

  const severityChip = useMemo(
    () => getAlertSeverityChipProps(qualityAlert?.severity),
    [qualityAlert?.severity]
  );
  const statusChip = useMemo(
    () => getAlertStatusChipProps(qualityAlert?.status),
    [qualityAlert?.status]
  );

  const isNew = normalizeText(qualityAlert?.status) === 'new';
  const isInProgress = normalizeText(qualityAlert?.status) === 'in progress';
  const isResolved = normalizeText(qualityAlert?.status) === 'resolved';

  const handleCreate = () => {
    setFormMode('create');
    setFormOpen(true);
  };

  const handleEdit = () => {
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!qualityAlertId) return;
    try {
      await deleteRequest(EP.quality_alert_by_id(qualityAlertId));
      toast.success('Quality alert deleted successfully.');
      await mutate(EP.quality_alerts);
      router.push(paths.dashboard.storeInventory.qualityAlerts);
    } catch (deleteError) {
      toast.error(extractErrorMessage(deleteError?.response?.data || deleteError));
    }
  };

  const handleMarkInProgress = async () => {
    setProgressing(true);
    try {
      await patchRequest(EP.quality_alert_by_id(qualityAlertId), { status: 'In Progress' });
      toast.success('Alert marked as In Progress.');
      await mutate(detailUrl);
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err));
    } finally {
      setProgressing(false);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      await patchRequest(EP.quality_alert_by_id(qualityAlertId), { status: 'Resolved' });
      toast.success('Alert resolved successfully.');
      await mutate(detailUrl);
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err));
    } finally {
      setResolving(false);
    }
  };

  const handleSuccess = async (record) => {
    await Promise.all([
      mutate(EP.quality_alerts),
      detailUrl ? mutate(detailUrl) : Promise.resolve(),
      record?.id ? mutate(EP.quality_alert_by_id(record.id)) : Promise.resolve(),
    ]);
    if (formMode === 'create' && record?.id) {
      router.push(paths.dashboard.storeInventory.qualityAlert_detail(record.id));
    }
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        {/* Header row */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={2}
          alignItems={{ md: 'flex-start' }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ sm: 'center' }}
          >
            <Button
              component={Link}
              href={paths.dashboard.storeInventory.qualityAlerts}
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
              size="small"
            >
              Quality Alerts
            </Button>

            <Box>
              <Typography variant="h4" fontWeight={700} color="#0f172a">
                {qualityAlert?.reference || 'Alert Details'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {qualityAlert?.title || 'Review this quality alert and take appropriate action.'}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap alignItems="center">
            {!loading && !error && qualityAlert && (
              <>
                <Chip
                  size="medium"
                  color={severityChip.color}
                  label={severityChip.label}
                  variant="soft"
                />
                <Chip
                  size="medium"
                  color={statusChip.color}
                  label={statusChip.label}
                  variant="soft"
                />
              </>
            )}
            {isNew && (
              <Button
                variant="outlined"
                color="info"
                size="small"
                startIcon={<Iconify icon="solar:play-circle-bold" />}
                onClick={handleMarkInProgress}
                disabled={progressing}
              >
                {progressing ? 'Updating...' : 'Mark In Progress'}
              </Button>
            )}
            {(isNew || isInProgress) && (
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<Iconify icon="solar:check-circle-bold" />}
                onClick={handleResolve}
                disabled={resolving}
              >
                {resolving ? 'Resolving...' : 'Resolve'}
              </Button>
            )}
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
              onClick={handleCreate}
            >
              New Alert
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={handleEdit}
              disabled={loading || Boolean(error) || !qualityAlert}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={() => setDeleteOpen(true)}
              disabled={loading || Boolean(error) || !qualityAlert}
            >
              Delete
            </Button>
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
            Failed to load the selected quality alert. Please try again.
          </Alert>
        )}

        {!loading && !error && qualityAlert && (
          <Stack spacing={3}>
            {/* Gradient banner */}
            <Card
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                color: '#fff',
                background: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 55%, #f59e0b 100%)',
              }}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={2}
                alignItems={{ md: 'center' }}
              >
                <Box>
                  <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Quality Alert
                  </Typography>
                  <Typography variant="h4" fontWeight={800}>
                    {qualityAlert.title || qualityAlert.reference}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
                    {qualityAlert.office_location_name
                      ? `${qualityAlert.office_location_name} · `
                      : ''}
                    {qualityAlert.product_name
                      ? `Product: ${qualityAlert.product_name}`
                      : 'No product linked'}
                  </Typography>
                </Box>

                <Stack spacing={1} alignItems={{ md: 'flex-end' }}>
                  <Stack direction="row" spacing={1}>
                    <Chip label={severityChip.label} color={severityChip.color} variant="soft" />
                    <Chip label={statusChip.label} color={statusChip.color} variant="soft" />
                  </Stack>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {qualityAlert.reference}
                  </Typography>
                </Stack>
              </Stack>
            </Card>

            {/* Stat cards */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard
                  icon="solar:danger-triangle-bold-duotone"
                  label="Severity"
                  value={severityChip.label}
                  sub="Prioritizes the operational response urgency."
                  color="#b45309"
                  bgColor="#fff7ed"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard
                  icon="solar:bell-bold-duotone"
                  label="Status"
                  value={statusChip.label}
                  sub={
                    isResolved ? 'Closed — no further action needed.' : 'Under active monitoring.'
                  }
                  color="#1d4ed8"
                  bgColor="#eff6ff"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard
                  icon="solar:box-bold-duotone"
                  label="Affected Product"
                  value={qualityAlert.product_name || 'Not linked'}
                  sub={qualityAlert.product_code || ''}
                  color="#166534"
                  bgColor="#f0fdf4"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard
                  icon="solar:calendar-bold-duotone"
                  label="Logged At"
                  value={formatDateTime(qualityAlert.created_at)}
                  sub={`By ${qualityAlert.reported_by_name || 'Unknown reporter'}`}
                  color="#7c3aed"
                  bgColor="#f5f3ff"
                />
              </Grid>
            </Grid>

            {/* Main detail sections */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 7 }}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
                  <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mb: 2.5 }}>
                    Alert Context
                  </Typography>

                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Reference" value={qualityAlert.reference} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Severity" value={severityChip.label} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField
                        label="Office / Warehouse"
                        value={qualityAlert.office_location_name || 'Not linked'}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField
                        label="Office Type"
                        value={qualityAlert.office_location_type || '—'}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField
                        label="Affected Product"
                        value={qualityAlert.product_name || 'Not linked'}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Product Code" value={qualityAlert.product_code || '—'} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField
                        label="Reported By"
                        value={qualityAlert.reported_by_name || 'Unassigned'}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField
                        label="Assigned To"
                        value={qualityAlert.assigned_to_name || 'Unassigned'}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField
                        label="Logged At"
                        value={formatDateTime(qualityAlert.created_at)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField
                        label="Last Updated"
                        value={formatDateTime(qualityAlert.updated_at)}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ mb: 1 }}>
                    Description
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: 'pre-wrap' }}
                  >
                    {qualityAlert.description || 'No incident description recorded.'}
                  </Typography>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ mb: 1 }}>
                    Corrective Action
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: 'pre-wrap' }}
                  >
                    {qualityAlert.corrective_action ||
                      'No corrective action has been recorded yet.'}
                  </Typography>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 5 }}>
                <Stack spacing={3}>
                  {/* Recommended next step */}
                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                    <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mb: 2 }}>
                      Recommended Next Step
                    </Typography>
                    <Alert
                      severity={getActionSeverity(qualityAlert.status)}
                      sx={{ borderRadius: 2 }}
                    >
                      {getAlertAction({
                        severity: qualityAlert.severity,
                        status: qualityAlert.status,
                      })}
                    </Alert>
                  </Card>

                  {/* Incident snapshot */}
                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                    <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mb: 2 }}>
                      Incident Snapshot
                    </Typography>
                    <Stack spacing={2}>
                      <DetailField label="Current Status" value={statusChip.label} />
                      <DetailField label="Severity Level" value={severityChip.label} />
                      <DetailField
                        label="Reporter Email"
                        value={qualityAlert.reported_by_email || '—'}
                      />
                      <DetailField
                        label="Assigned To"
                        value={qualityAlert.assigned_to_name || 'Unassigned'}
                      />
                      {!isResolved && (
                        <Stack spacing={1} sx={{ pt: 1 }}>
                          {isNew && (
                            <Button
                              fullWidth
                              variant="outlined"
                              color="info"
                              startIcon={<Iconify icon="solar:play-circle-bold" />}
                              onClick={handleMarkInProgress}
                              disabled={progressing}
                            >
                              {progressing ? 'Updating...' : 'Mark In Progress'}
                            </Button>
                          )}
                          <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            startIcon={<Iconify icon="solar:check-circle-bold" />}
                            onClick={handleResolve}
                            disabled={resolving}
                          >
                            {resolving ? 'Resolving...' : 'Resolve Alert'}
                          </Button>
                        </Stack>
                      )}
                    </Stack>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        )}

        {/* Delete dialog */}
        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title="Delete Quality Alert"
          content={`Are you sure you want to delete "${qualityAlert?.reference || 'this alert'}"? This action cannot be undone.`}
          action={
            <Button variant="contained" color="error" onClick={handleDelete}>
              Delete
            </Button>
          }
        />

        <QualityAlertFormDialog
          open={formOpen}
          mode={formMode}
          alertId={formMode === 'edit' ? qualityAlertId : null}
          onClose={() => setFormOpen(false)}
          onSuccess={handleSuccess}
        />
      </Stack>
    </Box>
  );
}
