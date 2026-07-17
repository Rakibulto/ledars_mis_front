'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Grid,
  Alert,
  Stack,
  Button,
  Dialog,
  Switch,
  Divider,
  Skeleton,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, usePutRequest, useDeleteRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { renderBooleanChip } from '../shared/inventory-desk-page';

const EP = endpoints.storeInventory;

const EMPTY_FORM = {
  name: '',
  code: '',
  quantity: '1',
  weight: '',
  dimensions: '',
  barcode: '',
  is_active: true,
};

function formatWeight(value) {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  return `${Number(value).toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })} kg`;
}

function normalizePackagingForm(packagingType) {
  return {
    name: packagingType?.name || '',
    code: packagingType?.code || '',
    quantity: String(packagingType?.quantity ?? 1),
    weight:
      packagingType?.weight === null || packagingType?.weight === undefined
        ? ''
        : String(packagingType.weight),
    dimensions: packagingType?.dimensions || '',
    barcode: packagingType?.barcode || '',
    is_active: Boolean(packagingType?.is_active),
  };
}

function DetailField({ label, value, muted = false }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body1"
        fontWeight={700}
        color={muted ? 'text.secondary' : 'text.primary'}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function PackagingTypeDetails() {
  const params = useParams();
  const router = useRouter();
  const confirm = useBoolean();
  const theme = useTheme();

  const isDark = theme.palette.mode === 'dark';
  const panelSx = {
    borderRadius: 3,
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: theme.palette.background.paper,
  };
  const heroBorder = `1px solid ${alpha(theme.palette.info.main, isDark ? 0.36 : 0.18)}`;
  const heroBackground = `linear-gradient(135deg, ${alpha(theme.palette.info.main, isDark ? 0.22 : 0.08)} 0%, ${alpha(theme.palette.success.main, isDark ? 0.18 : 0.08)} 55%, ${theme.palette.background.paper} 100%)`;
  const summaryBoxBg = isDark
    ? alpha(theme.palette.common.black, 0.18)
    : alpha(theme.palette.common.white, 0.72);
  const summaryBoxBorder = `1px solid ${alpha(theme.palette.divider, isDark ? 0.9 : 0.45)}`;
  const rawPayloadBg = isDark ? alpha(theme.palette.common.black, 0.4) : theme.palette.grey[900];

  const packagingTypeId = params?.packagingTypeId;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const packagingTypeUrl = packagingTypeId ? EP.packaging_type_by_id(packagingTypeId) : null;

  const { data: packagingType, loading, error } = useGetRequest(packagingTypeUrl);

  const updatePackagingType = usePutRequest;
  const deletePackagingType = useDeleteRequest;

  const derivedMetrics = useMemo(
    () => ({
      quantity: Number(packagingType?.quantity || 0),
      weight: Number(packagingType?.weight || 0),
      hasBarcode: Boolean(packagingType?.barcode),
      hasDimensions: Boolean(packagingType?.dimensions),
    }),
    [packagingType]
  );

  const revalidatePackagingQueries = async () => {
    await mutate(
      (key) => typeof key === 'string' && key.startsWith(EP.packaging_types),
      undefined,
      { revalidate: true }
    );
  };

  const openEditDialog = () => {
    if (!packagingType) {
      return;
    }

    setForm(normalizePackagingForm(packagingType));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Packaging type name is required.');
      return;
    }

    if (!form.code.trim()) {
      toast.error('Packaging code is required.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      quantity: Number(form.quantity || 1),
      weight: form.weight === '' ? null : Number(form.weight),
      dimensions: form.dimensions.trim() || null,
      barcode: form.barcode.trim() || null,
      is_active: Boolean(form.is_active),
    };

    setSubmitting(true);

    try {
      await updatePackagingType(EP.packaging_type_by_id(packagingTypeId), payload);
      toast.success('Packaging type updated successfully.');
      closeDialog();
      await revalidatePackagingQueries();
    } catch (submitError) {
      toast.error('Failed to update packaging type.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      await deletePackagingType(EP.packaging_type_by_id(packagingTypeId));
      toast.success('Packaging type deleted successfully.');
      await revalidatePackagingQueries();
      router.push(paths.dashboard.storeInventory.packagingTypes);
    } catch (deleteError) {
      toast.error('Failed to delete packaging type.');
    } finally {
      setDeleting(false);
      confirm.onFalse();
    }
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Link href={paths.dashboard.storeInventory.packagingTypes} passHref>
              <Button variant="outlined" startIcon={<Iconify icon="eva:arrow-back-fill" />}>
                Back to List
              </Button>
            </Link>

            <Box>
              <Typography variant="h4" fontWeight={800} color="text.primary">
                Packaging Type Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review the live packaging record from the backend and manage the full handling
                profile from a dedicated details screen.
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={confirm.onTrue}
              disabled={!packagingType || deleting}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Delete Packaging Type
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={openEditDialog}
              disabled={!packagingType}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Edit Packaging Type
            </Button>
          </Stack>
        </Stack>

        {loading && (
          <Card sx={{ ...panelSx, p: 3 }}>
            <Stack spacing={2.5}>
              <Skeleton variant="text" width="34%" height={46} />
              <Skeleton variant="rounded" height={132} />
              <Skeleton variant="rounded" height={280} />
            </Stack>
          </Card>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Failed to load the packaging type details. Please check the backend response and try
            again.
          </Alert>
        )}

        {!loading && !error && packagingType && (
          <>
            <Card
              sx={{
                borderRadius: 3,
                border: heroBorder,
                background: heroBackground,
              }}
            >
              <Box sx={{ p: 3 }}>
                <Stack
                  direction={{ xs: 'column', lg: 'row' }}
                  justifyContent="space-between"
                  spacing={3}
                >
                  <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 2.5,
                          bgcolor: 'info.main',
                          color: 'white',
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <Iconify icon="solar:box-bold-duotone" width={28} />
                      </Box>
                      <Box>
                        <Typography variant="overline" sx={{ color: 'info.main' }}>
                          Packaging Profile
                        </Typography>
                        <Typography variant="h4" fontWeight={800} color="text.primary">
                          {packagingType.name}
                        </Typography>
                      </Box>
                    </Stack>

                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
                      Code: {packagingType.code || 'No code'}
                    </Typography>
                  </Box>

                  <Stack spacing={1.5} alignItems={{ xs: 'flex-start', lg: 'flex-end' }}>
                    {renderBooleanChip(packagingType.is_active, 'Active', 'Inactive')}
                    <Typography variant="body2" color="text.secondary" fontWeight={700}>
                      Quantity: {packagingType.quantity ?? 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={700}>
                      Weight: {formatWeight(packagingType.weight)}
                    </Typography>
                  </Stack>
                </Stack>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {[
                    {
                      label: 'Record ID',
                      value: packagingType.id,
                      color: theme.palette.primary.main,
                      icon: 'solar:hashtag-square-bold-duotone',
                    },
                    {
                      label: 'Units Per Pack',
                      value: packagingType.quantity ?? 'N/A',
                      color: theme.palette.success.main,
                      icon: 'solar:box-minimalistic-bold-duotone',
                    },
                    {
                      label: 'Barcode Linked',
                      value: derivedMetrics.hasBarcode ? 'Yes' : 'No',
                      color: theme.palette.secondary.main,
                      icon: 'solar:barcode-bold-duotone',
                    },
                    {
                      label: 'Weight Profile',
                      value: formatWeight(packagingType.weight),
                      color: theme.palette.warning.main,
                      icon: 'solar:weight-bold-duotone',
                    },
                  ].map((item) => (
                    <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 3 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          bgcolor: summaryBoxBg,
                          border: summaryBoxBorder,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" spacing={2}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {item.label}
                            </Typography>
                            <Typography variant="h6" fontWeight={800} color="text.primary">
                              {item.value}
                            </Typography>
                          </Box>
                          <Box sx={{ color: item.color }}>
                            <Iconify icon={item.icon} width={22} />
                          </Box>
                        </Stack>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Card>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <Stack spacing={3}>
                  <Card sx={panelSx}>
                    <Box sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} color="text.primary" mb={2.5}>
                        Packaging Details
                      </Typography>

                      <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField label="Packaging Name" value={packagingType.name} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField
                            label="Packaging Code"
                            value={packagingType.code || 'No code'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField label="Quantity" value={packagingType.quantity ?? 'N/A'} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField label="Weight" value={formatWeight(packagingType.weight)} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField
                            label="Status"
                            value={packagingType.is_active ? 'Active' : 'Inactive'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField label="Record ID" value={packagingType.id} muted />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <DetailField
                            label="Barcode"
                            value={packagingType.barcode || 'No barcode assigned'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <DetailField
                            label="Dimensions"
                            value={packagingType.dimensions || 'No dimensions recorded'}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Card>

                  <Card sx={panelSx}>
                    <Box sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} color="text.primary" mb={2.5}>
                        Handling Notes
                      </Typography>

                      <Stack spacing={2}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.warning.main, isDark ? 0.34 : 0.2)}`,
                            bgcolor: alpha(theme.palette.warning.main, isDark ? 0.18 : 0.08),
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Barcode Readiness
                          </Typography>
                          <Typography variant="body1" fontWeight={700} color="text.primary">
                            {derivedMetrics.hasBarcode
                              ? packagingType.barcode
                              : 'No barcode is assigned to this packaging type yet.'}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.info.main, isDark ? 0.34 : 0.2)}`,
                            bgcolor: alpha(theme.palette.info.main, isDark ? 0.18 : 0.08),
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Spatial Profile
                          </Typography>
                          <Typography variant="body1" fontWeight={700} color="text.primary">
                            {derivedMetrics.hasDimensions
                              ? packagingType.dimensions
                              : 'No dimensions are stored for this packaging type.'}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.error.main, isDark ? 0.34 : 0.2)}`,
                            bgcolor: alpha(theme.palette.error.main, isDark ? 0.16 : 0.08),
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Weight Guidance
                          </Typography>
                          <Typography variant="body1" fontWeight={700} color="text.primary">
                            {derivedMetrics.weight > 25
                              ? 'This is a heavy packaging profile and may need special handling.'
                              : 'This profile is within the normal handling threshold.'}
                          </Typography>
                        </Box>
                      </Stack>

                      <Divider sx={{ my: 3 }} />

                      <Typography variant="subtitle2" color="text.secondary" mb={1.5}>
                        Raw Packaging Payload
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          p: 2,
                          borderRadius: 2,
                          bgcolor: rawPayloadBg,
                          color: theme.palette.common.white,
                          overflowX: 'auto',
                          fontSize: '0.875rem',
                          lineHeight: 1.6,
                        }}
                      >
                        {JSON.stringify(packagingType, null, 2)}
                      </Box>
                    </Box>
                  </Card>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, lg: 4 }}>
                <Stack spacing={3}>
                  <Card sx={panelSx}>
                    <Box sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} color="text.primary" mb={2}>
                        Quick Actions
                      </Typography>
                      <Stack spacing={1.5}>
                        <Button
                          variant="contained"
                          startIcon={<Iconify icon="solar:pen-bold" />}
                          onClick={openEditDialog}
                          sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                          Edit This Packaging Type
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                          onClick={confirm.onTrue}
                          sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                          Delete This Packaging Type
                        </Button>
                        <Link href={paths.dashboard.storeInventory.packagingTypes} passHref>
                          <Button
                            fullWidth
                            variant="text"
                            startIcon={<Iconify icon="eva:arrow-back-fill" />}
                            sx={{ textTransform: 'none', fontWeight: 700 }}
                          >
                            Return to Packaging List
                          </Button>
                        </Link>
                      </Stack>
                    </Box>
                  </Card>

                  <Card sx={panelSx}>
                    <Box sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} color="text.primary" mb={2}>
                        Record Notes
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Traceability
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {derivedMetrics.hasBarcode
                              ? 'This packaging type is already traceable through its barcode assignment.'
                              : 'Assign a barcode if this packaging type should be used in scan-based workflows.'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Capacity
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {`This profile carries ${packagingType.quantity ?? 0} unit${Number(packagingType.quantity || 0) === 1 ? '' : 's'} per package.`}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Physical Profile
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {derivedMetrics.hasDimensions
                              ? `Stored dimensions: ${packagingType.dimensions}.`
                              : 'No dimensions are currently stored for this profile.'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          </>
        )}
      </Stack>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit Packaging Type</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, name: event.target.value }))
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Code"
                value={form.code}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, code: event.target.value }))
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                value={form.quantity}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, quantity: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Weight (kg)"
                value={form.weight}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, weight: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Barcode"
                value={form.barcode}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, barcode: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Dimensions"
                value={form.dimensions}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, dimensions: event.target.value }))
                }
                helperText="Example: 30 x 20 x 10 cm"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(form.is_active)}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        is_active: event.target.checked,
                      }))
                    }
                  />
                }
                label="Active packaging type"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              'Update Packaging Type'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Packaging Type"
        content={`Are you sure you want to delete ${packagingType?.name || 'this packaging type'}?`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        }
      />
    </Box>
  );
}
