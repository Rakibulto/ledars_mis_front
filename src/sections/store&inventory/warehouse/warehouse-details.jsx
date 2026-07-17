'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { alpha, useTheme } from '@mui/material/styles';
import { Box, Card, Grid, Alert, Stack, Button, Typography, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  usePutRequest as putRequest,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { renderBooleanChip } from '../shared/inventory-desk-page';
import {
  formatCapacity,
  WarehouseFormDialog,
  getWarehouseTypeLabel,
  validateWarehouseForm,
  normalizeWarehouseForm,
  warehouseFormToPayload,
} from './warehouse-form-dialog';

const EP = endpoints.storeInventory;

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

function formatDateTime(value) {
  if (!value) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getWarehouseNarrative(warehouse) {
  switch (warehouse?.warehouse_type) {
    case 'Central':
      return 'Central warehouses should anchor procurement receipts, replenishment policy, and cross-location stock visibility.';
    case 'Regional':
      return 'Regional warehouses should balance upstream receipts with downstream field fulfillment and local capacity planning.';
    case 'Field':
      return 'Field warehouses should stay lightweight, responsive, and ready for rapid distribution or localized replenishment.';
    case 'Transit':
      return 'Transit hubs should optimize fast movement, staging, and dispatch rather than long-term storage density.';
    default:
      return 'Define clear handling, storage, and dispatch rules for this warehouse so downstream operations stay predictable.';
  }
}

export default function WarehouseDetails() {
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
  const heroGradient = `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isDark ? 0.3 : 0.12)}, ${alpha(theme.palette.info.main, isDark ? 0.3 : 0.12)})`;

  const warehouseId = Array.isArray(params?.warehouseId)
    ? params.warehouseId[0]
    : params?.warehouseId;
  const detailUrl = warehouseId ? EP.warehouse_by_id(warehouseId) : null;

  const { data: warehouse, loading, error } = useGetRequest(detailUrl);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const warehouseTypeLabel =
    warehouse?.warehouse_type_label || getWarehouseTypeLabel(warehouse?.warehouse_type);

  const revalidateWarehouseQueries = async () => {
    await mutate((key) => typeof key === 'string' && key.startsWith(EP.warehouses));
  };

  const openEditDialog = () => {
    if (!warehouse) {
      return;
    }

    setForm(normalizeWarehouseForm(warehouse));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (submitting) {
      return;
    }

    setDialogOpen(false);
    setForm(null);
  };

  const handleSubmit = async () => {
    const validationMessage = validateWarehouseForm(form);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      await putRequest(detailUrl, warehouseFormToPayload(form));
      toast.success('Warehouse updated successfully.');
      closeDialog();
      await revalidateWarehouseQueries();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError?.response?.data || requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      await deleteRequest(detailUrl);
      toast.success('Warehouse deleted successfully.');
      await revalidateWarehouseQueries();
      router.push(paths.dashboard.storeInventory.warehouses);
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError?.response?.data || requestError));
    } finally {
      setDeleting(false);
      confirm.onFalse();
    }
  };

  const summaryCards = useMemo(
    () => [
      {
        label: 'Storage Locations',
        value: warehouse?.location_count ?? 0,
        helper: 'Active storage locations linked to this warehouse.',
        icon: 'solar:box-bold-duotone',
        color: theme.palette.primary.main,
      },
      {
        label: 'Capacity',
        value: formatCapacity(warehouse?.capacity_sqft),
        helper: 'Configured footprint for stock planning and storage design.',
        icon: 'solar:scale-bold-duotone',
        color: theme.palette.info.main,
      },
      {
        label: 'Contact Line',
        value: warehouse?.phone || 'Unassigned',
        helper: 'Operational phone line for the site.',
        icon: 'solar:phone-bold-duotone',
        color: theme.palette.success.main,
      },
      {
        label: 'Last Updated',
        value: warehouse?.updated_at ? formatDateTime(warehouse.updated_at) : 'N/A',
        helper: 'Most recent backend update timestamp.',
        icon: 'solar:clock-circle-bold-duotone',
        color: theme.palette.warning.main,
      },
    ],
    [
      theme.palette.info.main,
      theme.palette.primary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      warehouse,
    ]
  );

  if (loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !warehouse) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          This warehouse could not be loaded. The record may have been removed or the backend
          returned an error.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Button
              component={Link}
              href={paths.dashboard.storeInventory.warehouses}
              startIcon={<Iconify icon="solar:arrow-left-linear" />}
              sx={{ px: 0, mb: 1, textTransform: 'none' }}
            >
              Back to Warehouses
            </Button>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
              <Iconify icon="solar:buildings-bold-duotone" width={28} />
              <Typography variant="h4" fontWeight={800} color="text.primary">
                {warehouse.name}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Code {warehouse.code} • {warehouseTypeLabel}
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={openEditDialog}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Edit Warehouse
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={confirm.onTrue}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Delete Warehouse
            </Button>
          </Stack>
        </Stack>

        <Alert severity="info" sx={{ borderRadius: 2 }}>
          This detail screen uses the live warehouse endpoint, including edit and delete against the
          same backend record.
        </Alert>

        <Card sx={{ ...panelSx, overflow: 'hidden' }}>
          <Box sx={{ p: 3.5, background: heroGradient }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="overline" color="text.secondary">
                  Warehouse Overview
                </Typography>
                <Typography variant="h4" fontWeight={800} color="text.primary" mb={1}>
                  {warehouse.name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {warehouse.address ||
                    'No address is stored for this warehouse yet. Add one to improve routing, dispatch, and audit clarity.'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={1.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                  <Typography variant="body2" color="text.secondary">
                    Warehouse Type
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="text.primary">
                    {warehouseTypeLabel}
                  </Typography>
                  {renderBooleanChip(warehouse.is_active, 'Active', 'Inactive')}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Card>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={3}>
              <Grid container spacing={2}>
                {summaryCards.map((card) => (
                  <Grid key={card.label} size={{ xs: 12, sm: 6 }}>
                    <Card sx={panelSx}>
                      <Box sx={{ p: 3 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <Box>
                            <Typography variant="overline" color="text.secondary">
                              {card.label}
                            </Typography>
                            <Typography variant="h5" fontWeight={800} color="text.primary">
                              {card.value}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: 2,
                              bgcolor: alpha(card.color, isDark ? 0.22 : 0.12),
                              color: card.color,
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            <Iconify icon={card.icon} width={22} />
                          </Box>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" mt={1.5}>
                          {card.helper}
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Card sx={panelSx}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} color="text.primary" mb={2.5}>
                    Warehouse Profile
                  </Typography>
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <DetailField label="Warehouse Code" value={warehouse.code || 'N/A'} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <DetailField label="Warehouse Type" value={warehouseTypeLabel} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <DetailField
                        label="Manager"
                        value={warehouse.manager || 'Unassigned'}
                        muted={!warehouse.manager}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <DetailField
                        label="Phone"
                        value={warehouse.phone || 'No direct line'}
                        muted={!warehouse.phone}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <DetailField
                        label="Address"
                        value={warehouse.address || 'No address recorded'}
                        muted={!warehouse.address}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <DetailField label="Created" value={formatDateTime(warehouse.created_at)} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <DetailField label="Updated" value={formatDateTime(warehouse.updated_at)} />
                    </Grid>
                  </Grid>
                </Box>
              </Card>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              <Card sx={panelSx}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} color="text.primary" mb={2}>
                    Operational Readiness
                  </Typography>
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.08),
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Site Narrative
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="text.primary">
                        {getWarehouseNarrative(warehouse)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: alpha(theme.palette.success.main, isDark ? 0.18 : 0.08),
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Capacity Posture
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="text.primary">
                        {warehouse.capacity_sqft
                          ? `Configured for ${formatCapacity(warehouse.capacity_sqft)} of storage footprint.`
                          : 'Capacity is not configured yet, so planning and storage utilization remain incomplete.'}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: alpha(theme.palette.info.main, isDark ? 0.18 : 0.08),
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Location Readiness
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="text.primary">
                        {Number(warehouse.location_count || 0) > 0
                          ? `${warehouse.location_count} storage locations are already linked to this warehouse.`
                          : 'No storage locations are linked yet. Downstream operation setup will need location definitions.'}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Card>

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
                      Edit Warehouse
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                      onClick={confirm.onTrue}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      Delete Warehouse
                    </Button>
                    <Button
                      component={Link}
                      href={paths.dashboard.storeInventory.warehouses}
                      variant="text"
                      startIcon={<Iconify icon="solar:list-bold" />}
                      sx={{ textTransform: 'none', fontWeight: 700, justifyContent: 'flex-start' }}
                    >
                      Return to list
                    </Button>
                  </Stack>
                </Box>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      <WarehouseFormDialog
        open={dialogOpen}
        title="Edit Warehouse"
        submitLabel={submitting ? 'Saving...' : 'Update Warehouse'}
        form={form || normalizeWarehouseForm(warehouse)}
        setForm={setForm}
        submitting={submitting}
        onClose={closeDialog}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Warehouse"
        content={`Are you sure you want to delete ${warehouse.name || 'this warehouse'}?`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        }
      />
    </Box>
  );
}
