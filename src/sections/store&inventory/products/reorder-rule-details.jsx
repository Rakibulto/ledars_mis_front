'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Chip,
  Card,
  Grid,
  Alert,
  Stack,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';

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
import { getReorderRuleModuleConfig } from './reorder-rule-module-config';
import {
  TRIGGER_OPTIONS,
  toReorderOptions,
  formatReorderAmount,
  ReorderRuleFormDialog,
  validateReorderRuleForm,
  normalizeReorderRuleForm,
  reorderRuleFormToPayload,
  sortReorderOptionsByName,
} from './reorder-rule-form-dialog';

const EP = endpoints.storeInventory;

function TriggerChip({ trigger }) {
  const option = TRIGGER_OPTIONS.find((item) => item.id === trigger);

  return (
    <Chip
      size="small"
      label={option?.label || 'Unknown'}
      color={trigger === 'automatic' ? 'info' : 'default'}
      variant={trigger === 'automatic' ? 'filled' : 'outlined'}
    />
  );
}

export default function ReorderRuleDetails({ moduleKey = 'reorderRules' }) {
  const params = useParams();
  const router = useRouter();
  const confirm = useBoolean();
  const theme = useTheme();
  const moduleConfig = getReorderRuleModuleConfig(moduleKey);

  const isDark = theme.palette.mode === 'dark';
  const panelSx = {
    borderRadius: 3,
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: theme.palette.background.paper,
  };
  const heroGradient = `linear-gradient(135deg, ${alpha(theme.palette.warning.main, isDark ? 0.34 : 0.14)}, ${alpha(theme.palette.info.main, isDark ? 0.34 : 0.14)})`;

  const ruleId = moduleConfig.paramKeys
    .map((key) => {
      const value = params?.[key];
      return Array.isArray(value) ? value[0] : value;
    })
    .find(Boolean);
  const detailUrl = ruleId ? moduleConfig.detailEndpoint(ruleId) : null;

  const { data: rule, loading, error } = useGetRequest(detailUrl);
  const { data: rawProducts } = useGetRequest(EP.products);
  const { data: rawWarehouses } = useGetRequest(EP.warehouses);

  const products = useMemo(
    () => sortReorderOptionsByName(toReorderOptions(rawProducts)),
    [rawProducts]
  );
  const warehouses = useMemo(
    () => sortReorderOptionsByName(toReorderOptions(rawWarehouses)),
    [rawWarehouses]
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const coverageGap = Math.max(Number(rule?.max_qty || 0) - Number(rule?.min_qty || 0), 0);

  const revalidateRuleQueries = async () => {
    await mutate((key) => typeof key === 'string' && key.startsWith(moduleConfig.listEndpoint));
  };

  const openEditDialog = () => {
    if (!rule) {
      return;
    }

    setForm(normalizeReorderRuleForm(rule));
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
    const validationMessage = validateReorderRuleForm(form);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      await putRequest(detailUrl, reorderRuleFormToPayload(form));
      toast.success(moduleConfig.updatedToast);
      closeDialog();
      await revalidateRuleQueries();
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
      toast.success(moduleConfig.deletedToast);
      await revalidateRuleQueries();
      router.push(moduleConfig.listPath);
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError?.response?.data || requestError));
    } finally {
      setDeleting(false);
      confirm.onFalse();
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !rule) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {moduleConfig.detailError}
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
              href={moduleConfig.listPath}
              startIcon={<Iconify icon="solar:arrow-left-linear" />}
              sx={{ px: 0, mb: 1, textTransform: 'none' }}
            >
              {moduleConfig.backToListLabel}
            </Button>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
              <Iconify icon="solar:refresh-circle-bold-duotone" width={28} />
              <Typography variant="h4" fontWeight={800} color="text.primary">
                {rule.product_name || moduleConfig.singularTitle}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Stock policy for {rule.product_code || 'the selected product'} with{' '}
              {rule.warehouse_name || 'no warehouse restriction'}.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={openEditDialog}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Edit Rule
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={confirm.onTrue}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Delete Rule
            </Button>
          </Stack>
        </Stack>

        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {moduleConfig.detailInfo}
        </Alert>

        <Card sx={{ ...panelSx, overflow: 'hidden' }}>
          <Box sx={{ p: 3.5, background: heroGradient }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="overline" color="text.secondary">
                  Replenishment Policy
                </Typography>
                <Typography variant="h4" fontWeight={800} color="text.primary" mb={1}>
                  {rule.product_name || 'Unnamed Product'}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Triggered {rule.trigger === 'automatic' ? 'automatically' : 'manually'} when stock
                  control thresholds are reached.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={1.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                  <Typography variant="body2" color="text.secondary">
                    Warehouse
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="text.primary">
                    {rule.warehouse_name || 'All Warehouses'}
                  </Typography>
                  <TriggerChip trigger={rule.trigger} />
                  {renderBooleanChip(rule.is_active, 'Active', 'Inactive')}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Card>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Grid container spacing={2}>
              {[
                {
                  label: 'Minimum Qty',
                  value: formatReorderAmount(rule.min_qty),
                  helper: 'Lower threshold before replenishment is considered.',
                  color: theme.palette.warning.main,
                  icon: 'solar:arrow-down-bold-duotone',
                },
                {
                  label: 'Maximum Qty',
                  value: formatReorderAmount(rule.max_qty),
                  helper: 'Upper stock ceiling after replenishment.',
                  color: theme.palette.success.main,
                  icon: 'solar:arrow-up-bold-duotone',
                },
                {
                  label: 'Reorder Qty',
                  value: formatReorderAmount(rule.reorder_qty),
                  helper: 'Expected replenishment lot size.',
                  color: theme.palette.info.main,
                  icon: 'solar:restart-bold-duotone',
                },
                {
                  label: 'Lead Time',
                  value: `${Number(rule.lead_time_days || 0)} days`,
                  helper: 'Expected waiting period before stock arrives.',
                  color: theme.palette.primary.main,
                  icon: 'solar:clock-circle-bold-duotone',
                },
              ].map((card) => (
                <Grid key={card.label} size={{ xs: 12, sm: 6 }}>
                  <Card sx={panelSx}>
                    <Box sx={{ p: 3 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="overline" color="text.secondary">
                            {card.label}
                          </Typography>
                          <Typography variant="h4" fontWeight={800} color="text.primary">
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
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              <Card sx={panelSx}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} color="text.primary" mb={2}>
                    Policy Notes
                  </Typography>
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: alpha(theme.palette.warning.main, isDark ? 0.18 : 0.08),
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Coverage Gap
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="text.primary">
                        {formatReorderAmount(coverageGap)} units between minimum and maximum stock.
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
                        Trigger Strategy
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="text.primary">
                        {rule.trigger === 'automatic'
                          ? 'The system can propose replenishment automatically.'
                          : 'Planners must trigger replenishment manually.'}
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
                        Warehouse Scope
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="text.primary">
                        {rule.warehouse_name ||
                          'This rule applies without a warehouse-specific restriction.'}
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
                      Edit Rule
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                      onClick={confirm.onTrue}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      Delete Rule
                    </Button>
                    <Button
                      component={Link}
                      href={moduleConfig.listPath}
                      variant="text"
                      startIcon={<Iconify icon="solar:list-bold" />}
                      sx={{ textTransform: 'none', fontWeight: 700, justifyContent: 'flex-start' }}
                    >
                      {moduleConfig.returnToListLabel}
                    </Button>
                  </Stack>
                </Box>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      <ReorderRuleFormDialog
        open={dialogOpen}
        title={`Edit ${moduleConfig.singularTitle}`}
        submitLabel={submitting ? 'Saving...' : 'Update Rule'}
        form={form || normalizeReorderRuleForm(rule)}
        setForm={setForm}
        products={products}
        warehouses={warehouses}
        submitting={submitting}
        onClose={closeDialog}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title={`Delete ${moduleConfig.singularTitle}`}
        content={`Are you sure you want to delete the ${moduleConfig.singularTitle.toLowerCase()} for ${rule.product_name || 'this product'}?`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        }
      />
    </Box>
  );
}
