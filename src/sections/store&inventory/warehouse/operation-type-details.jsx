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
  toDataArray,
  getOperationTypeName,
  getOperationTypeLabel,
  OperationTypeFormDialog,
  validateOperationTypeForm,
  normalizeOperationTypeForm,
  operationTypeFormToPayload,
} from './operation-type-form-dialog';

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

function getOperationNarrative(operationType) {
  const typeValue = operationType?.operation_type;

  if (typeValue === 'incoming') {
    return 'Incoming operation types control how receipts land into the warehouse. Use them to define the default source and receiving destination so inbound work starts from a clean process template.';
  }

  if (typeValue === 'outgoing') {
    return 'Outgoing operation types define delivery order execution. Use them to anchor default picking and dispatch locations so outbound stock leaves through a consistent workflow.';
  }

  if (typeValue === 'internal') {
    return 'Internal transfer operation types move stock between locations inside the organization. Keep default source and destination zones aligned with the warehouse layout to reduce operator confusion.';
  }

  if (typeValue === 'returns') {
    return 'Return operation types support reverse logistics and inspection flow. Use them to isolate returned stock into the right verification or quarantine area before it re-enters normal inventory.';
  }

  return 'Scrap operation types support disposal and write-off flow. Use them to route unusable stock away from normal storage and into controlled scrap handling locations.';
}

export default function OperationTypeDetails() {
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
  const heroGradient = `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isDark ? 0.3 : 0.12)}, ${alpha(theme.palette.info.main, isDark ? 0.28 : 0.12)})`;

  const operationTypeId = Array.isArray(params?.operationTypeId)
    ? params.operationTypeId[0]
    : params?.operationTypeId;
  const detailUrl = operationTypeId ? EP.operation_type_by_id(operationTypeId) : null;

  const { data: operationType, loading, error } = useGetRequest(detailUrl);
  const { data: rawWarehouses } = useGetRequest(`${EP.warehouses}?pagination=false&ordering=name`);
  const { data: rawLocations } = useGetRequest(
    `${EP.storage_locations}?pagination=false&ordering=name`
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const warehouses = useMemo(() => toDataArray(rawWarehouses), [rawWarehouses]);
  const locations = useMemo(() => toDataArray(rawLocations), [rawLocations]);

  const revalidateOperationTypeQueries = async () => {
    await mutate((key) => typeof key === 'string' && key.startsWith(EP.operation_types));
  };

  const openEditDialog = () => {
    if (!operationType) {
      return;
    }

    setForm(normalizeOperationTypeForm(operationType));
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
    const validationMessage = validateOperationTypeForm(form);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      await putRequest(detailUrl, operationTypeFormToPayload(form));
      toast.success('Operation type updated successfully.');
      closeDialog();
      await revalidateOperationTypeQueries();
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
      toast.success('Operation type deleted successfully.');
      await revalidateOperationTypeQueries();
      router.push(paths.dashboard.storeInventory.operationTypes);
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
        label: 'Operation Code',
        value: operationType?.code || 'No code',
        helper: 'Unique identifier used to reference this workflow template.',
        icon: 'solar:tag-price-bold-duotone',
        color: theme.palette.primary.main,
      },
      {
        label: 'Operation Category',
        value: getOperationTypeLabel(operationType),
        helper: 'Defines whether the workflow is inbound, outbound, internal, return, or scrap.',
        icon: 'solar:layers-bold-duotone',
        color: theme.palette.info.main,
      },
      {
        label: 'Warehouse',
        value: operationType?.warehouse_name || 'Unassigned',
        helper: 'Warehouse context where this operation type is applied.',
        icon: 'solar:buildings-bold-duotone',
        color: theme.palette.warning.main,
      },
      {
        label: 'Workflow Status',
        value: operationType?.is_active ? 'Active' : 'Inactive',
        helper: 'Whether this workflow template is currently operational.',
        icon: 'solar:check-circle-bold-duotone',
        color: theme.palette.success.main,
      },
    ],
    [
      operationType,
      theme.palette.info.main,
      theme.palette.primary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
    ]
  );

  if (loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !operationType) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          This operation type could not be loaded. The record may have been removed or the backend
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
              href={paths.dashboard.storeInventory.operationTypes}
              startIcon={<Iconify icon="solar:arrow-left-linear" />}
              sx={{ px: 0, mb: 1, textTransform: 'none' }}
            >
              Back to Operation Types
            </Button>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
              <Iconify icon="solar:widget-bold-duotone" width={28} />
              <Typography variant="h4" fontWeight={800} color="text.primary">
                {getOperationTypeName(operationType)}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {operationType.code || 'No code'} • {getOperationTypeLabel(operationType)}
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={openEditDialog}
            >
              Edit Operation Type
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={confirm.onTrue}
            >
              Delete Operation Type
            </Button>
          </Stack>
        </Stack>

        <Card sx={{ ...panelSx, overflow: 'hidden', background: heroGradient }}>
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2}>
              <Typography variant="h5" fontWeight={800}>
                Workflow summary
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 860 }}>
                {getOperationNarrative(operationType)}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                {renderBooleanChip(operationType.is_active, 'Active Workflow', 'Inactive Workflow')}
                <Button size="small" variant="outlined" color="inherit" onClick={openEditDialog}>
                  Adjust Workflow
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Card>

        <Grid container spacing={3}>
          {summaryCards.map((card) => (
            <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card sx={panelSx}>
                <Box sx={{ p: 2.75 }}>
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        {card.label}
                      </Typography>
                      <Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>
                        {card.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {card.helper}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: 2.5,
                        bgcolor: alpha(card.color, 0.12),
                        color: card.color,
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Iconify icon={card.icon} width={22} />
                    </Box>
                  </Stack>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={panelSx}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2.5 }}>
                  Workflow details
                </Typography>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField
                      label="Operation name"
                      value={getOperationTypeName(operationType)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField label="Operation code" value={operationType.code || 'No code'} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField
                      label="Operation category"
                      value={getOperationTypeLabel(operationType)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField
                      label="Workflow status"
                      value={operationType.is_active ? 'Active workflow' : 'Inactive workflow'}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField
                      label="Warehouse"
                      value={operationType.warehouse_name || 'Unassigned'}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField
                      label="Warehouse code"
                      value={operationType.warehouse_code || 'No code'}
                      muted
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField
                      label="Default source"
                      value={operationType.default_source_name || 'No default source'}
                      muted={!operationType.default_source_name}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField
                      label="Default destination"
                      value={operationType.default_destination_name || 'No default destination'}
                      muted={!operationType.default_destination_name}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              <Card sx={panelSx}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                    Default flow
                  </Typography>

                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={700}>
                        Source
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {operationType.default_source_name || 'No default source configured.'}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: alpha(theme.palette.info.main, 0.08),
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={700}>
                        Destination
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {operationType.default_destination_name ||
                          'No default destination configured.'}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Card>

              <Card sx={panelSx}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                    Control note
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Review this workflow whenever picking lanes, receiving gates, return handling,
                    or warehouse execution policy changes.
                  </Typography>
                  <Button fullWidth variant="outlined" color="inherit" onClick={openEditDialog}>
                    Edit Operation Type
                  </Button>
                </Box>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        <OperationTypeFormDialog
          open={dialogOpen}
          title="Edit Operation Type"
          submitLabel="Update Operation Type"
          form={form || normalizeOperationTypeForm(operationType)}
          setForm={setForm}
          submitting={submitting}
          onClose={closeDialog}
          onSubmit={handleSubmit}
          warehouses={warehouses}
          locations={locations}
        />

        <ConfirmDialog
          open={confirm.value}
          onClose={confirm.onFalse}
          title="Delete Operation Type"
          content={`Delete ${getOperationTypeName(operationType)}? This will remove the workflow template from the operation registry.`}
          action={
            <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
              Delete
            </Button>
          }
        />
      </Stack>
    </Box>
  );
}
