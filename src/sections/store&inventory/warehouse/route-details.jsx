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
  getRouteName,
  getRouteSteps,
  RouteFormDialog,
  getRouteStepCount,
  validateRouteForm,
  normalizeRouteForm,
  routeFormToPayload,
} from './route-form-dialog';

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

function getRouteNarrative(route) {
  const stepCount = getRouteStepCount(route);

  if (stepCount > 0) {
    return 'This route already has defined workflow steps and can be reviewed as an operational stock movement policy. Recheck the sequencing whenever warehouse execution changes.';
  }

  return 'This route exists as a shell policy without configured steps. It should be completed before being relied on for warehouse execution or rule assignment.';
}

export default function RouteDetails() {
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
  const heroGradient = `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isDark ? 0.3 : 0.12)}, ${alpha(theme.palette.warning.main, isDark ? 0.28 : 0.12)})`;

  const routeId = Array.isArray(params?.routeId) ? params.routeId[0] : params?.routeId;
  const detailUrl = routeId ? EP.route_by_id(routeId) : null;

  const { data: route, loading, error } = useGetRequest(detailUrl);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const stepItems = useMemo(() => getRouteSteps(route), [route]);
  const _routeListData = useMemo(() => toDataArray(route ? [route] : []), [route]);

  const revalidateRouteQueries = async () => {
    await mutate((key) => typeof key === 'string' && key.startsWith(EP.routes));
  };

  const openEditDialog = () => {
    if (!route) {
      return;
    }

    setForm(normalizeRouteForm(route));
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
    const validationMessage = validateRouteForm(form);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      await putRequest(detailUrl, routeFormToPayload(form));
      toast.success('Route updated successfully.');
      closeDialog();
      await revalidateRouteQueries();
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
      toast.success('Route deleted successfully.');
      await revalidateRouteQueries();
      router.push(paths.dashboard.storeInventory.routesAndRules);
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
        label: 'Route Code',
        value: route?.code || 'No code',
        helper: 'Unique reference code for the workflow.',
        icon: 'solar:tag-price-bold-duotone',
        color: theme.palette.primary.main,
      },
      {
        label: 'Step Count',
        value: getRouteStepCount(route),
        helper: 'Configured workflow steps in this route.',
        icon: 'solar:sort-from-top-to-bottom-bold-duotone',
        color: theme.palette.info.main,
      },
      {
        label: 'Route Status',
        value: route?.is_active ? 'Active' : 'Inactive',
        helper: 'Whether this route can be used operationally.',
        icon: 'solar:check-circle-bold-duotone',
        color: theme.palette.success.main,
      },
      {
        label: 'Description',
        value: route?.description ? 'Documented' : 'Undocumented',
        helper: 'Whether the route has descriptive notes for operators.',
        icon: 'solar:document-text-bold-duotone',
        color: theme.palette.warning.main,
      },
    ],
    [
      route,
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

  if (error || !route) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          This route could not be loaded. The record may have been removed or the backend returned
          an error.
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
              href={paths.dashboard.storeInventory.routesAndRules}
              startIcon={<Iconify icon="solar:arrow-left-linear" />}
              sx={{ px: 0, mb: 1, textTransform: 'none' }}
            >
              Back to Routes & Rules
            </Button>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
              <Iconify icon="solar:routing-bold-duotone" width={28} />
              <Typography variant="h4" fontWeight={800} color="text.primary">
                {getRouteName(route)}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {route.code || 'No code'} • {getRouteStepCount(route)} step(s)
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={openEditDialog}
            >
              Edit Route
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={confirm.onTrue}
            >
              Delete Route
            </Button>
          </Stack>
        </Stack>

        <Card sx={{ ...panelSx, overflow: 'hidden', background: heroGradient }}>
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2}>
              <Typography variant="h5" fontWeight={800}>
                Route summary
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 820 }}>
                {getRouteNarrative(route)}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                {renderBooleanChip(route.is_active, 'Active Route', 'Inactive Route')}
                <Button size="small" variant="outlined" color="inherit" onClick={openEditDialog}>
                  Adjust Route
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
                  Route details
                </Typography>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField label="Route name" value={getRouteName(route)} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField label="Route code" value={route.code || 'No code'} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField
                      label="Activation"
                      value={route.is_active ? 'Active route' : 'Inactive route'}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField label="Step count" value={getRouteStepCount(route)} muted />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <DetailField
                      label="Description"
                      value={route.description || 'No description provided.'}
                      muted={!route.description}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Card>

            <Card sx={{ ...panelSx, mt: 3 }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2.5 }}>
                  Route steps
                </Typography>

                {stepItems.length ? (
                  <Stack spacing={1.5}>
                    {stepItems.map((step, index) => (
                      <Box
                        key={`${step}-${index}`}
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          border: `1px solid ${theme.palette.divider}`,
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Step {index + 1}
                        </Typography>
                        <Typography variant="body1" fontWeight={700}>
                          {step}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No route steps are configured yet.
                  </Typography>
                )}
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              <Card sx={panelSx}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                    Route state
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: alpha(theme.palette.success.main, 0.08),
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={700}>
                        Activation
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {route.is_active
                          ? 'This route is live and can be used by operational flows now.'
                          : 'This route is inactive and currently excluded from operational assignment.'}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: alpha(theme.palette.warning.main, 0.08),
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={700}>
                        Step readiness
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getRouteStepCount(route) > 0
                          ? 'This route already includes workflow steps and should be validated against the actual warehouse process.'
                          : 'This route still needs step definitions before it can describe a full warehouse flow.'}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Card>

              <Card sx={panelSx}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                    Next action
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Review this route whenever movement steps, stock handling checkpoints, or
                    warehouse execution policy changes.
                  </Typography>
                  <Button fullWidth variant="outlined" color="inherit" onClick={openEditDialog}>
                    Edit Route
                  </Button>
                </Box>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        <RouteFormDialog
          open={dialogOpen}
          title="Edit Route"
          submitLabel="Update Route"
          form={form || normalizeRouteForm(route)}
          setForm={setForm}
          submitting={submitting}
          onClose={closeDialog}
          onSubmit={handleSubmit}
        />

        <ConfirmDialog
          open={confirm.value}
          onClose={confirm.onFalse}
          title="Delete Route"
          content={`Delete ${getRouteName(route)}? This will remove the workflow from the route registry.`}
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
