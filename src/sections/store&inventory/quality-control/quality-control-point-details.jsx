'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useState } from 'react';
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

import QualityControlPointFormDialog from './quality-control-point-form-dialog';
import {
  formatDateTime,
  getQCPNarrative,
  getStatusChipProps,
  getPriorityChipProps,
  getFrequencyChipProps,
} from './quality-control-point-shared';

const EP = endpoints.storeInventory;

function DetailField({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600} color="#0f172a">
        {value || 'â€”'}
      </Typography>
    </Box>
  );
}

function StatCard({ icon, label, value, sub, color, bgColor }) {
  return (
    <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            flexShrink: 0,
            bgcolor: bgColor,
            color,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Iconify icon={icon} width={24} />
        </Box>
        <Box>
          <Typography variant="overline" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h6" fontWeight={700} color="#0f172a">
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.secondary">
              {sub}
            </Typography>
          )}
        </Box>
      </Stack>
    </Card>
  );
}

export default function QualityControlPointDetails() {
  const params = useParams();
  const router = useRouter();
  const qualityControlPointId = Array.isArray(params?.qualityControlPointId)
    ? params.qualityControlPointId[0]
    : params?.qualityControlPointId;

  const detailUrl = qualityControlPointId
    ? EP.quality_control_point_by_id(qualityControlPointId)
    : null;
  const { data: controlPoint, loading, error } = useGetRequest(detailUrl);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('edit');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const freqChip = getFrequencyChipProps(controlPoint?.frequency);
  const prioChip = getPriorityChipProps(controlPoint?.priority);
  const statusChip = getStatusChipProps(controlPoint?.is_active);

  const handleCreate = () => {
    setFormMode('create');
    setFormOpen(true);
  };
  const handleEdit = () => {
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!qualityControlPointId) return;
    try {
      await deleteRequest(EP.quality_control_point_by_id(qualityControlPointId));
      toast.success('Quality control point deleted.');
      await mutate(EP.quality_control_points);
      router.push(paths.dashboard.storeInventory.qualityControlPoints);
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err));
    }
  };

  const handleSuccess = async (record) => {
    await Promise.all([
      mutate(EP.quality_control_points),
      detailUrl ? mutate(detailUrl) : Promise.resolve(),
      record?.id ? mutate(EP.quality_control_point_by_id(record.id)) : Promise.resolve(),
    ]);
    if (formMode === 'create' && record?.id) {
      router.push(paths.dashboard.storeInventory.qualityControlPoint_detail(record.id));
    }
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        {/* Top nav row */}
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
              href={paths.dashboard.storeInventory.qualityControlPoints}
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
              size="small"
            >
              Control Points
            </Button>
            <Box>
              <Typography variant="h4" fontWeight={700} color="#0f172a">
                {controlPoint?.reference || controlPoint?.name || 'Control Point Details'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {controlPoint?.name ||
                  'Review the inspection configuration and assigned resources.'}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap alignItems="center">
            {!loading && !error && controlPoint && (
              <>
                <Chip size="medium" color={freqChip.color} label={freqChip.label} variant="soft" />
                <Chip size="medium" color={prioChip.color} label={prioChip.label} variant="soft" />
                <Chip
                  size="medium"
                  color={statusChip.color}
                  label={statusChip.label}
                  variant="soft"
                />
              </>
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
              onClick={handleCreate}
            >
              New Point
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={handleEdit}
              disabled={loading || Boolean(error) || !controlPoint}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={() => setDeleteOpen(true)}
              disabled={loading || Boolean(error) || !controlPoint}
            >
              Delete
            </Button>
          </Stack>
        </Stack>

        {/* Skeleton */}
        {loading && (
          <Card sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2.5}>
              <Skeleton variant="text" width="35%" height={42} />
              <Skeleton variant="rounded" height={120} />
              <Skeleton variant="rounded" height={320} />
            </Stack>
          </Card>
        )}

        {/* Error */}
        {!loading && error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Failed to load this quality control point. Please try again.
          </Alert>
        )}

        {!loading && !error && controlPoint && (
          <Stack spacing={3}>
            {/* Gradient banner */}
            <Card
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                color: '#fff',
                background: 'linear-gradient(135deg, #0c1445 0%, #1e40af 55%, #0891b2 100%)',
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
                    Quality Control Point
                  </Typography>
                  <Typography variant="h4" fontWeight={800}>
                    {controlPoint.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
                    {controlPoint.office_location_name
                      ? `${controlPoint.office_location_name} Â· `
                      : ''}
                    {controlPoint.product_name
                      ? `Product: ${controlPoint.product_name}`
                      : 'No product linked'}
                  </Typography>
                </Box>
                <Stack spacing={1} alignItems={{ md: 'flex-end' }}>
                  <Stack direction="row" spacing={1}>
                    <Chip label={freqChip.label} color={freqChip.color} variant="soft" />
                    <Chip label={prioChip.label} color={prioChip.color} variant="soft" />
                    <Chip label={statusChip.label} color={statusChip.color} variant="soft" />
                  </Stack>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {controlPoint.reference || `ID: ${controlPoint.id}`}
                  </Typography>
                </Stack>
              </Stack>
            </Card>

            {/* Stat cards */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard
                  icon="solar:refresh-circle-bold-duotone"
                  label="Frequency"
                  value={freqChip.label}
                  sub="How often this control must be performed."
                  color="#1d4ed8"
                  bgColor="#eff6ff"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard
                  icon="solar:danger-triangle-bold-duotone"
                  label="Priority"
                  value={prioChip.label}
                  sub="Urgency level for failed inspections."
                  color="#b45309"
                  bgColor="#fff7ed"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard
                  icon="solar:check-circle-bold-duotone"
                  label="Status"
                  value={statusChip.label}
                  sub={
                    controlPoint.is_active
                      ? 'Available for live inspection routing.'
                      : 'Not active â€” excluded from routing.'
                  }
                  color="#166534"
                  bgColor="#f0fdf4"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard
                  icon="solar:buildings-3-bold-duotone"
                  label="Office / Warehouse"
                  value={controlPoint.office_location_name || 'Not linked'}
                  sub={controlPoint.office_location_type || ''}
                  color="#7c3aed"
                  bgColor="#f5f3ff"
                />
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              {/* Left: main detail sections */}
              <Grid size={{ xs: 12, lg: 7 }}>
                <Stack spacing={3}>
                  {/* General Information */}
                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                    <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mb: 2.5 }}>
                      General Information
                    </Typography>
                    <Grid container spacing={2.5}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <DetailField label="Reference" value={controlPoint.reference} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <DetailField label="Control Point Name" value={controlPoint.name} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <DetailField label="Priority" value={prioChip.label} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <DetailField label="Frequency" value={freqChip.label} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <DetailField label="Created By" value={controlPoint.created_by_name} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <DetailField
                          label="Created At"
                          value={formatDateTime(controlPoint.created_at)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <DetailField
                          label="Last Updated"
                          value={formatDateTime(controlPoint.updated_at)}
                        />
                      </Grid>
                    </Grid>
                  </Card>

                  {/* Office/Warehouse & Product Mapping */}
                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                    <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mb: 2.5 }}>
                      Office / Warehouse &amp; Product Mapping
                    </Typography>
                    <Grid container spacing={2.5}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <DetailField
                          label="Office / Warehouse"
                          value={controlPoint.office_location_name}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <DetailField
                          label="Location Type"
                          value={controlPoint.office_location_type}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <DetailField label="Linked Product" value={controlPoint.product_name} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <DetailField label="Product Code" value={controlPoint.product_code} />
                      </Grid>
                    </Grid>
                  </Card>

                  {/* Inspection Rules & Criteria */}
                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                    <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mb: 1.5 }}>
                      Inspection Rules &amp; Criteria
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ whiteSpace: 'pre-wrap', mb: 2 }}
                    >
                      {controlPoint.inspection_criteria || 'No inspection criteria defined yet.'}
                    </Typography>
                    {controlPoint.description && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography
                          variant="subtitle2"
                          fontWeight={700}
                          color="#0f172a"
                          sx={{ mb: 1 }}
                        >
                          Description
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ whiteSpace: 'pre-wrap' }}
                        >
                          {controlPoint.description}
                        </Typography>
                      </>
                    )}
                  </Card>
                </Stack>
              </Grid>

              {/* Right panel */}
              <Grid size={{ xs: 12, lg: 5 }}>
                <Stack spacing={3}>
                  {/* Assigned Staff */}
                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                    <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mb: 2 }}>
                      Assigned Inspector / Staff
                    </Typography>
                    {controlPoint.assigned_to_name ? (
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: '50%',
                            bgcolor: '#eff6ff',
                            color: '#1d4ed8',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Iconify icon="solar:user-bold-duotone" width={22} />
                        </Box>
                        <Box>
                          <Typography variant="body1" fontWeight={700} color="#0f172a">
                            {controlPoint.assigned_to_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Assigned inspector for this control point
                          </Typography>
                        </Box>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No inspector assigned. Edit this control point to assign a staff member.
                      </Typography>
                    )}
                  </Card>

                  {/* Control Point Configuration */}
                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                    <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mb: 2 }}>
                      Control Point Configuration
                    </Typography>
                    <Stack spacing={1.75}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Active for routing
                        </Typography>
                        <Chip
                          size="small"
                          color={statusChip.color}
                          label={statusChip.label}
                          variant="soft"
                        />
                      </Stack>
                      <Divider />
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Priority
                        </Typography>
                        <Chip
                          size="small"
                          color={prioChip.color}
                          label={prioChip.label}
                          variant="soft"
                        />
                      </Stack>
                      <Divider />
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Inspection frequency
                        </Typography>
                        <Chip
                          size="small"
                          color={freqChip.color}
                          label={freqChip.label}
                          variant="soft"
                        />
                      </Stack>
                    </Stack>
                  </Card>

                  {/* Recommended Use */}
                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                    <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mb: 1.5 }}>
                      Recommended Use
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getQCPNarrative(controlPoint)}
                    </Typography>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        )}
      </Stack>

      <QualityControlPointFormDialog
        open={formOpen}
        mode={formMode}
        qualityControlPointId={formMode === 'edit' ? qualityControlPointId : null}
        onClose={() => setFormOpen(false)}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Quality Control Point"
        content={`Are you sure you want to delete "${controlPoint?.name || 'this control point'}"? This action cannot be undone.`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
