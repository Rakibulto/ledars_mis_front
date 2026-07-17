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
  getPutawayScopeLabel,
  getPutawayTargetLabel,
  PutawayRuleFormDialog,
  validatePutawayRuleForm,
  normalizePutawayRuleForm,
  putawayRuleFormToPayload,
} from './putaway-rule-form-dialog';

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

function getPriorityLabel(sequence) {
  const numericSequence = Number(sequence || 0);

  if (numericSequence <= 3) {
    return 'Primary Lane';
  }

  if (numericSequence <= 10) {
    return 'Standard Lane';
  }

  return 'Fallback Lane';
}

function getRuleNarrative(rule) {
  if ((rule?.target_type || '').toLowerCase() === 'product') {
    return 'Product-scoped putaway rules are precise overrides. Use them when a specific SKU must land in a controlled location before any category-based default can apply.';
  }

  return 'Category-scoped putaway rules are the baseline routing logic for inbound stock. Use them to keep warehouse landing zones consistent when no SKU-specific override exists.';
}

export default function PutawayRuleDetails() {
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

  const ruleId = Array.isArray(params?.ruleId) ? params.ruleId[0] : params?.ruleId;
  const detailUrl = ruleId ? EP.putaway_rule_by_id(ruleId) : null;

  const { data: rule, loading, error } = useGetRequest(detailUrl);
  const { data: rawWarehouses } = useGetRequest(`${EP.warehouses}?pagination=false&ordering=name`);
  const { data: rawProducts } = useGetRequest(`${EP.products}?pagination=false`);
  const { data: rawCategories } = useGetRequest(`${EP.item_category}?pagination=false`);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const warehouseId = form?.warehouse || (rule?.warehouse ? String(rule.warehouse) : '');
  const locationOptionsUrl = warehouseId
    ? `${EP.storage_locations}?pagination=false&warehouse=${warehouseId}&is_active=true`
    : null;
  const { data: rawLocations } = useGetRequest(locationOptionsUrl);

  const warehouses = useMemo(() => toDataArray(rawWarehouses), [rawWarehouses]);
  const products = useMemo(() => toDataArray(rawProducts), [rawProducts]);
  const categories = useMemo(() => toDataArray(rawCategories), [rawCategories]);
  const locations = useMemo(() => toDataArray(rawLocations), [rawLocations]);

  const revalidatePutawayQueries = async () => {
    await mutate((key) => typeof key === 'string' && key.startsWith(EP.putaway_rules));
  };

  const openEditDialog = () => {
    if (!rule) {
      return;
    }

    setForm(normalizePutawayRuleForm(rule));
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
    const validationMessage = validatePutawayRuleForm(form);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      await putRequest(detailUrl, putawayRuleFormToPayload(form));
      toast.success('Putaway rule updated successfully.');
      closeDialog();
      await revalidatePutawayQueries();
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
      toast.success('Putaway rule deleted successfully.');
      await revalidatePutawayQueries();
      router.push(paths.dashboard.storeInventory.putawayRules);
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
        label: 'Rule Scope',
        value: getPutawayScopeLabel(rule),
        helper: 'Determines whether this rule is SKU-specific or category-wide.',
        icon: 'solar:box-bold-duotone',
        color: theme.palette.primary.main,
      },
      {
        label: 'Priority Sequence',
        value: rule?.sequence ?? 0,
        helper: `${getPriorityLabel(rule?.sequence)} inside the routing order.`,
        icon: 'solar:sort-from-top-to-bottom-bold-duotone',
        color: theme.palette.warning.main,
      },
      {
        label: 'Warehouse',
        value: rule?.warehouse_name || 'Unassigned',
        helper: 'Warehouse where this putaway instruction is enforced.',
        icon: 'solar:buildings-bold-duotone',
        color: theme.palette.info.main,
      },
      {
        label: 'Destination',
        value: rule?.location_name || 'Unassigned',
        helper: 'Storage location that inbound stock should land in.',
        icon: 'solar:box-bold-duotone',
        color: theme.palette.success.main,
      },
    ],
    [
      rule,
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

  if (error || !rule) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          This putaway rule could not be loaded. The record may have been removed or the backend
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
              href={paths.dashboard.storeInventory.putawayRules}
              startIcon={<Iconify icon="solar:arrow-left-linear" />}
              sx={{ px: 0, mb: 1, textTransform: 'none' }}
            >
              Back to Putaway Rules
            </Button>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
              <Iconify icon="solar:routing-bold-duotone" width={28} />
              <Typography variant="h4" fontWeight={800} color="text.primary">
                {getPutawayTargetLabel(rule)}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {getPutawayScopeLabel(rule)} • {rule.warehouse_name || 'Warehouse pending'}
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={openEditDialog}
            >
              Edit Rule
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={confirm.onTrue}
            >
              Delete Rule
            </Button>
          </Stack>
        </Stack>

        <Card sx={{ ...panelSx, overflow: 'hidden', background: heroGradient }}>
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2}>
              <Typography variant="h5" fontWeight={800}>
                Putaway routing summary
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 820 }}>
                {getRuleNarrative(rule)}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                {renderBooleanChip(rule.is_active, 'Active Rule', 'Inactive Rule')}
                <Button size="small" variant="outlined" color="inherit" onClick={openEditDialog}>
                  Adjust Routing
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
                  Rule details
                </Typography>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField label="Target" value={getPutawayTargetLabel(rule)} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField label="Rule scope" value={getPutawayScopeLabel(rule)} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField label="Warehouse" value={rule.warehouse_name || 'Unassigned'} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField
                      label="Warehouse code"
                      value={rule.warehouse_code || 'No code'}
                      muted
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField
                      label="Destination location"
                      value={rule.location_name || 'Unassigned'}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField
                      label="Location type"
                      value={rule.location_type_label || 'Location'}
                      muted
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField label="Priority sequence" value={rule.sequence || 0} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailField
                      label="Control posture"
                      value={getPriorityLabel(rule.sequence)}
                      muted
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
                    Rule state
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
                        {rule.is_active
                          ? 'This routing instruction is live and will influence destination decisions now.'
                          : 'This routing instruction is inactive and currently excluded from operational routing.'}
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
                        Sequence note
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sequence {rule.sequence} means this rule will be evaluated before any rule
                        with a higher sequence number inside the same routing scope.
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
                    Review the warehouse-location pairing and sequence priority whenever the
                    physical storage layout changes, a new SKU family is introduced, or the inbound
                    routing process is being simplified.
                  </Typography>
                  <Button fullWidth variant="outlined" color="inherit" onClick={openEditDialog}>
                    Edit Routing Rule
                  </Button>
                </Box>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        <PutawayRuleFormDialog
          open={dialogOpen}
          title="Edit Putaway Rule"
          submitLabel="Update Rule"
          form={form || normalizePutawayRuleForm(rule)}
          setForm={setForm}
          submitting={submitting}
          onClose={closeDialog}
          onSubmit={handleSubmit}
          warehouses={warehouses}
          locations={locations}
          products={products}
          categories={categories}
        />

        <ConfirmDialog
          open={confirm.value}
          onClose={confirm.onFalse}
          title="Delete Putaway Rule"
          content={`Delete ${getPutawayTargetLabel(rule)}? This will remove the rule from the warehouse routing order.`}
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
