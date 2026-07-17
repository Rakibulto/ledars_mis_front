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
  getRemovalMethodLabel,
  getRemovalStrategyLabel,
  RemovalStrategyFormDialog,
  validateRemovalStrategyForm,
  normalizeRemovalStrategyForm,
  removalStrategyFormToPayload,
} from './removal-strategy-form-dialog';

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

function getRemovalNarrative(strategy) {
  const method = strategy?.strategy;

  if (method === 'fefo') {
    return 'FEFO removal strategies protect shelf life by selecting the earliest-expiring stock first. Use them where expiry risk is operationally more important than strict receiving order.';
  }

  if (method === 'lifo') {
    return 'LIFO removal strategies prioritise the newest stock first. Use them only where physical layout or operational constraints justify reversing the usual FIFO posture.';
  }

  if (method === 'closest') {
    return 'Closest-location removal strategies minimise travel time by selecting the nearest available stock. They should be validated against accuracy and expiry posture before broad activation.';
  }

  return 'FIFO removal strategies are the baseline stock depletion method. They reduce aging risk by ensuring older stock is selected first whenever available.';
}

export default function RemovalStrategyDetails() {
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

  const strategyId = Array.isArray(params?.strategyId) ? params.strategyId[0] : params?.strategyId;
  const detailUrl = strategyId ? EP.removal_strategy_by_id(strategyId) : null;

  const { data: strategy, loading, error } = useGetRequest(detailUrl);
  const { data: rawWarehouses } = useGetRequest(`${EP.warehouses}?pagination=false&ordering=name`);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const warehouses = useMemo(() => toDataArray(rawWarehouses), [rawWarehouses]);

  const revalidateRemovalStrategyQueries = async () => {
    await mutate((key) => typeof key === 'string' && key.startsWith(EP.removal_strategies));
  };

  const openEditDialog = () => {
    if (!strategy) {
      return;
    }

    setForm(normalizeRemovalStrategyForm(strategy));
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
    const validationMessage = validateRemovalStrategyForm(form);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      await putRequest(detailUrl, removalStrategyFormToPayload(form));
      toast.success('Removal strategy updated successfully.');
      closeDialog();
      await revalidateRemovalStrategyQueries();
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
      toast.success('Removal strategy deleted successfully.');
      await revalidateRemovalStrategyQueries();
      router.push(paths.dashboard.storeInventory.removalStrategies);
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
        label: 'Removal Method',
        value: getRemovalMethodLabel(strategy),
        helper: 'How the warehouse selects stock for outbound execution.',
        icon: 'solar:sort-from-top-to-bottom-bold-duotone',
        color: theme.palette.primary.main,
      },
      {
        label: 'Warehouse',
        value: strategy?.warehouse_name || 'Unassigned',
        helper: 'Warehouse where this strategy is enforced.',
        icon: 'solar:buildings-bold-duotone',
        color: theme.palette.info.main,
      },
      {
        label: 'Warehouse Code',
        value: strategy?.warehouse_code || 'No code',
        helper: 'Quick reference code for the active warehouse context.',
        icon: 'solar:tag-price-bold-duotone',
        color: theme.palette.warning.main,
      },
      {
        label: 'Strategy Status',
        value: strategy?.is_active ? 'Active' : 'Inactive',
        helper: 'Whether the removal policy is currently operational.',
        icon: 'solar:check-circle-bold-duotone',
        color: theme.palette.success.main,
      },
    ],
    [
      strategy,
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

  if (error || !strategy) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          This removal strategy could not be loaded. The record may have been removed or the backend
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
              href={paths.dashboard.storeInventory.removalStrategies}
              startIcon={<Iconify icon="solar:arrow-left-linear" />}
              sx={{ px: 0, mb: 1, textTransform: 'none' }}
            >
              Back to Removal Strategies
            </Button>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
              <Iconify icon="solar:sort-from-top-to-bottom-bold-duotone" width={28} />
              <Typography variant="h4" fontWeight={800} color="text.primary">
                {getRemovalStrategyLabel(strategy)}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {getRemovalMethodLabel(strategy)} • {strategy.warehouse_name || 'Warehouse pending'}
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={openEditDialog}
            >
              Edit Strategy
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={confirm.onTrue}
            >
              Delete Strategy
            </Button>
          </Stack>
        </Stack>

        <Card sx={{ ...panelSx, overflow: 'hidden', background: heroGradient }}>
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2}>
              <Typography variant="h5" fontWeight={800}>
                Removal policy summary
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 820 }}>
                {getRemovalNarrative(strategy)}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                {renderBooleanChip(strategy.is_active, 'Active Strategy', 'Inactive Strategy')}
                <Button size="small" variant="outlined" color="inherit" onClick={openEditDialog}>
                  Adjust Strategy
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
                  Strategy details
                </Typography>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField label="Strategy name" value={getRemovalStrategyLabel(strategy)} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField label="Removal method" value={getRemovalMethodLabel(strategy)} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField
                      label="Warehouse"
                      value={strategy.warehouse_name || 'Unassigned'}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField
                      label="Warehouse code"
                      value={strategy.warehouse_code || 'No code'}
                      muted
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField
                      label="Activation"
                      value={strategy.is_active ? 'Active strategy' : 'Inactive strategy'}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField label="Record ID" value={strategy.id} muted />
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
                    Strategy state
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
                        {strategy.is_active
                          ? 'This removal policy is live and can influence outbound picking decisions now.'
                          : 'This removal policy is inactive and currently excluded from operational stock selection.'}
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
                        Method note
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getRemovalMethodLabel(strategy)} should be reviewed whenever picking flow,
                        expiry control, or warehouse travel distance expectations change.
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
                    Recheck this policy whenever warehouse zoning changes, expiry controls are
                    tightened, or outbound fulfillment needs a different stock depletion posture.
                  </Typography>
                  <Button fullWidth variant="outlined" color="inherit" onClick={openEditDialog}>
                    Edit Removal Strategy
                  </Button>
                </Box>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        <RemovalStrategyFormDialog
          open={dialogOpen}
          title="Edit Removal Strategy"
          submitLabel="Update Strategy"
          form={form || normalizeRemovalStrategyForm(strategy)}
          setForm={setForm}
          submitting={submitting}
          onClose={closeDialog}
          onSubmit={handleSubmit}
          warehouses={warehouses}
        />

        <ConfirmDialog
          open={confirm.value}
          onClose={confirm.onFalse}
          title="Delete Removal Strategy"
          content={`Delete ${getRemovalStrategyLabel(strategy)}? This will remove the policy from the warehouse removal rule set.`}
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
