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
  Skeleton,
  TextField,
  Typography,
  DialogTitle,
  Autocomplete,
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

const TRACKING_OPTIONS = [
  { id: 'none', label: 'No Tracking' },
  { id: 'lot', label: 'By Lots' },
  { id: 'serial', label: 'By Serial Number' },
];

const EMPTY_FORM = {
  name: '',
  category: null,
  uom: null,
  tracking: 'none',
  expiry_tracking: false,
  default_cost: '0',
  default_reorder: '0',
  default_max: '0',
  description: '',
  is_active: true,
};

function toOptions(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data?.results) ? data.results : [];
}

function getTrackingLabel(value) {
  return TRACKING_OPTIONS.find((option) => option.id === value)?.label || 'No Tracking';
}

function formatAmount(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString('en-BD', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function normalizeTemplateForm(template) {
  return {
    name: template?.name || '',
    category: template?.category || null,
    uom: template?.uom || null,
    tracking: template?.tracking || 'none',
    expiry_tracking: Boolean(template?.expiry_tracking),
    default_cost: String(template?.default_cost ?? 0),
    default_reorder: String(template?.default_reorder ?? 0),
    default_max: String(template?.default_max ?? 0),
    description: template?.description || '',
    is_active: Boolean(template?.is_active),
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

export default function ProductTemplateDetails() {
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
  const heroBorder = `1px solid ${alpha(theme.palette.info.main, isDark ? 0.34 : 0.18)}`;
  const heroBackground = `linear-gradient(135deg, ${alpha(theme.palette.info.main, isDark ? 0.2 : 0.08)} 0%, ${alpha(theme.palette.success.main, isDark ? 0.16 : 0.08)} 55%, ${theme.palette.background.paper} 100%)`;
  const summaryBoxBg = isDark
    ? alpha(theme.palette.common.black, 0.18)
    : alpha(theme.palette.common.white, 0.74);
  const summaryBoxBorder = `1px solid ${alpha(theme.palette.divider, isDark ? 0.92 : 0.48)}`;
  const rawPayloadBg = isDark ? alpha(theme.palette.common.black, 0.42) : theme.palette.grey[900];

  const templateId = params?.templateId;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const templateUrl = templateId ? EP.product_template_by_id(templateId) : null;

  const { data: template, loading, error } = useGetRequest(templateUrl);
  const { data: rawCategories } = useGetRequest(EP.item_category);
  const { data: rawUom } = useGetRequest(EP.uom);

  const updateTemplate = usePutRequest;
  const deleteTemplate = useDeleteRequest;

  const categoryOptions = useMemo(
    () =>
      [...toOptions(rawCategories)].sort((left, right) =>
        String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawCategories]
  );

  const uomOptions = useMemo(
    () =>
      [...toOptions(rawUom)].sort((left, right) =>
        String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawUom]
  );

  const derivedMetrics = useMemo(
    () => ({
      hasCategory: Boolean(template?.category_name),
      hasUom: Boolean(template?.uom_name),
      reorderTarget: Number(template?.default_reorder || 0),
      maxTarget: Number(template?.default_max || 0),
      defaultCost: Number(template?.default_cost || 0),
    }),
    [template]
  );

  const revalidateTemplateQueries = async () => {
    await mutate(
      (key) => typeof key === 'string' && key.startsWith(EP.product_templates),
      undefined,
      { revalidate: true }
    );
  };

  const openEditDialog = () => {
    if (!template) {
      return;
    }

    setForm(normalizeTemplateForm(template));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Template name is required.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category || null,
      uom: form.uom || null,
      tracking: form.tracking || 'none',
      expiry_tracking: Boolean(form.expiry_tracking),
      default_cost: Number(form.default_cost || 0),
      default_reorder: Number(form.default_reorder || 0),
      default_max: Number(form.default_max || 0),
      description: form.description.trim() || null,
      is_active: Boolean(form.is_active),
    };

    setSubmitting(true);

    try {
      await updateTemplate(EP.product_template_by_id(templateId), payload);
      toast.success('Product template updated successfully.');
      closeDialog();
      await revalidateTemplateQueries();
    } catch (submitError) {
      toast.error('Failed to update product template.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      await deleteTemplate(EP.product_template_by_id(templateId));
      toast.success('Product template deleted successfully.');
      await revalidateTemplateQueries();
      router.push(paths.dashboard.storeInventory.productTemplates);
    } catch (deleteError) {
      toast.error('Failed to delete product template.');
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
            <Link href={paths.dashboard.storeInventory.productTemplates} passHref>
              <Button variant="outlined" startIcon={<Iconify icon="eva:arrow-back-fill" />}>
                Back to List
              </Button>
            </Link>

            <Box>
              <Typography variant="h4" fontWeight={800} color="text.primary">
                Product Template Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review the live backend template record and manage defaults from a dedicated details
                screen.
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={confirm.onTrue}
              disabled={!template || deleting}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Delete Template
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={openEditDialog}
              disabled={!template}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Edit Template
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
            Failed to load the product template details. Please check the backend response and try
            again.
          </Alert>
        )}

        {!loading && !error && template && (
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
                        <Iconify icon="solar:document-bold-duotone" width={28} />
                      </Box>
                      <Box>
                        <Typography variant="overline" sx={{ color: 'info.main' }}>
                          Template Profile
                        </Typography>
                        <Typography variant="h4" fontWeight={800} color="text.primary">
                          {template.name}
                        </Typography>
                      </Box>
                    </Stack>

                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
                      {template.description || 'No description was added to this template yet.'}
                    </Typography>
                  </Box>

                  <Stack spacing={1.5} alignItems={{ xs: 'flex-start', lg: 'flex-end' }}>
                    {renderBooleanChip(template.is_active, 'Active', 'Inactive')}
                    {renderBooleanChip(template.expiry_tracking, 'Expiry Tracked', 'No Expiry')}
                    <Typography variant="body2" color="text.secondary" fontWeight={700}>
                      Tracking: {getTrackingLabel(template.tracking)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={700}>
                      Default Cost: Tk {formatAmount(template.default_cost)}
                    </Typography>
                  </Stack>
                </Stack>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {[
                    {
                      label: 'Record ID',
                      value: template.id,
                      color: theme.palette.primary.main,
                      icon: 'solar:hashtag-square-bold-duotone',
                    },
                    {
                      label: 'Tracking Mode',
                      value: getTrackingLabel(template.tracking),
                      color: theme.palette.info.main,
                      icon: 'solar:restart-circle-bold-duotone',
                    },
                    {
                      label: 'Default Cost',
                      value: `Tk ${formatAmount(template.default_cost)}`,
                      color: theme.palette.success.main,
                      icon: 'solar:wad-of-money-bold-duotone',
                    },
                    {
                      label: 'Reorder Target',
                      value: formatAmount(template.default_reorder),
                      color: theme.palette.warning.main,
                      icon: 'solar:sort-from-top-to-bottom-bold-duotone',
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
                        Template Details
                      </Typography>

                      <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField label="Template Name" value={template.name} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField
                            label="Category"
                            value={template.category_name || 'Uncategorized'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField
                            label="Default UoM"
                            value={template.uom_name || 'Not assigned'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField
                            label="Tracking"
                            value={getTrackingLabel(template.tracking)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField
                            label="Expiry Tracking"
                            value={template.expiry_tracking ? 'Enabled' : 'Disabled'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DetailField
                            label="Status"
                            value={template.is_active ? 'Active' : 'Inactive'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <DetailField
                            label="Default Cost"
                            value={`Tk ${formatAmount(template.default_cost)}`}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <DetailField
                            label="Default Reorder"
                            value={formatAmount(template.default_reorder)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <DetailField
                            label="Default Max"
                            value={formatAmount(template.default_max)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <DetailField
                            label="Description"
                            value={template.description || 'No description available.'}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Card>

                  <Card sx={panelSx}>
                    <Box sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} color="text.primary" mb={2.5}>
                        Operational Notes
                      </Typography>

                      <Stack spacing={2}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.info.main, isDark ? 0.34 : 0.2)}`,
                            bgcolor: alpha(theme.palette.info.main, isDark ? 0.18 : 0.08),
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Classification
                          </Typography>
                          <Typography variant="body1" fontWeight={700} color="text.primary">
                            {derivedMetrics.hasCategory
                              ? `Linked to ${template.category_name}.`
                              : 'No category is linked yet, which limits server-side grouping and filtering.'}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.success.main, isDark ? 0.34 : 0.2)}`,
                            bgcolor: alpha(theme.palette.success.main, isDark ? 0.16 : 0.08),
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Measurement Standard
                          </Typography>
                          <Typography variant="body1" fontWeight={700} color="text.primary">
                            {derivedMetrics.hasUom
                              ? `Default unit is ${template.uom_name}.`
                              : 'No default UoM is assigned. Downstream product creation should add one.'}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.warning.main, isDark ? 0.34 : 0.2)}`,
                            bgcolor: alpha(theme.palette.warning.main, isDark ? 0.18 : 0.08),
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Replenishment Guidance
                          </Typography>
                          <Typography variant="body1" fontWeight={700} color="text.primary">
                            {derivedMetrics.reorderTarget > 0 || derivedMetrics.maxTarget > 0
                              ? `Reorder at ${formatAmount(template.default_reorder)} and cap at ${formatAmount(template.default_max)}.`
                              : 'No replenishment thresholds are set on this template yet.'}
                          </Typography>
                        </Box>
                      </Stack>
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
                          Edit This Template
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                          onClick={confirm.onTrue}
                          sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                          Delete This Template
                        </Button>
                        <Link href={paths.dashboard.storeInventory.productTemplates} passHref>
                          <Button
                            fullWidth
                            variant="text"
                            startIcon={<Iconify icon="eva:arrow-back-fill" />}
                            sx={{ textTransform: 'none', fontWeight: 700 }}
                          >
                            Return to Template List
                          </Button>
                        </Link>
                      </Stack>
                    </Box>
                  </Card>

                  <Card sx={panelSx}>
                    <Box sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} color="text.primary" mb={2}>
                        Control Notes
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Tracking Policy
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {template.expiry_tracking
                              ? 'Expiry control is enabled, so derived products should preserve date-sensitive handling.'
                              : 'Expiry control is off for this template.'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Default Pricing
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {derivedMetrics.defaultCost > 0
                              ? `A starting cost of Tk ${formatAmount(template.default_cost)} is available for new products.`
                              : 'No default cost is configured yet.'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Readiness
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {template.is_active
                              ? 'This template is active and available for operational use.'
                              : 'This template is inactive and should stay out of new setup flows until reactivated.'}
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
        <DialogTitle>Edit Product Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Template Name"
                value={form.name}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, name: event.target.value }))
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={categoryOptions}
                value={categoryOptions.find((option) => option.id === form.category) || null}
                getOptionLabel={(option) => option?.name || ''}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                onChange={(event, value) =>
                  setForm((currentForm) => ({ ...currentForm, category: value?.id || null }))
                }
                renderInput={(params) => <TextField {...params} label="Category" />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={uomOptions}
                value={uomOptions.find((option) => option.id === form.uom) || null}
                getOptionLabel={(option) => option?.name || ''}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                onChange={(event, value) =>
                  setForm((currentForm) => ({ ...currentForm, uom: value?.id || null }))
                }
                renderInput={(params) => <TextField {...params} label="Default UoM" />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={TRACKING_OPTIONS}
                value={
                  TRACKING_OPTIONS.find((option) => option.id === form.tracking) ||
                  TRACKING_OPTIONS[0]
                }
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                onChange={(event, value) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    tracking: value?.id || 'none',
                  }))
                }
                renderInput={(params) => <TextField {...params} label="Tracking" />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Default Cost"
                value={form.default_cost}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    default_cost: event.target.value,
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Default Reorder"
                value={form.default_reorder}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    default_reorder: event.target.value,
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Default Max"
                value={form.default_max}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    default_max: event.target.value,
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Description"
                value={form.description}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    description: event.target.value,
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(form.expiry_tracking)}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          expiry_tracking: event.target.checked,
                        }))
                      }
                    />
                  }
                  label="Expiry tracking enabled"
                />
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
                  label="Template is active"
                />
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              'Update Template'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Product Template"
        content={`Are you sure you want to delete ${template?.name || 'this product template'}?`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        }
      />
    </Box>
  );
}
