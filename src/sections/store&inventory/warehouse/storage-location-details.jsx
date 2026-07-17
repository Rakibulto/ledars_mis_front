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
  Chip,
  Grid,
  Stack,
  Table,
  Alert,
  Button,
  Divider,
  MenuItem,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
  InputAdornment,
  LinearProgress,
  CircularProgress,
} from '@mui/material';

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

import {
  getLocationTypeLabel,
  getParentLocationOptions,
  toStorageLocationOptions,
  StorageLocationFormDialog,
  getEmptyStorageLocationForm,
  validateStorageLocationForm,
  normalizeStorageLocationForm,
  storageLocationFormToPayload,
} from './storage-location-form-dialog';

// â”€â”€â”€ constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const EP = endpoints.storeInventory;
const PM = endpoints.procurement_management;

// â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatusChip({ active }) {
  return (
    <Chip
      label={active ? 'Active' : 'Inactive'}
      color={active ? 'success' : 'default'}
      size="small"
      variant="soft"
      sx={{ fontWeight: 700 }}
    />
  );
}

function FlagChip({ value, trueLabel = 'Yes', falseLabel = 'No' }) {
  return (
    <Chip
      label={value ? trueLabel : falseLabel}
      color={value ? 'warning' : 'default'}
      size="small"
      variant="soft"
      sx={{ fontWeight: 600 }}
    />
  );
}

function DetailField({ label, value, icon, muted = false }) {
  return (
    <Box>
      <Stack direction="row" spacing={0.5} alignItems="center" mb={0.25}>
        {icon && <Iconify icon={icon} width={13} sx={{ color: 'text.secondary' }} />}
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {label}
        </Typography>
      </Stack>
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

function SectionCard({ title, icon, children, action, color = 'primary.main' }) {
  const theme = useTheme();
  return (
    <Card
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
      }}
    >
      <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon={icon} width={20} sx={{ color }} />
            <Typography variant="subtitle1" fontWeight={700}>
              {title}
            </Typography>
          </Stack>
          {action}
        </Stack>
      </Box>
      <Box sx={{ p: 3 }}>{children}</Box>
    </Card>
  );
}

function getTypeColor(theme, locationType) {
  const map = {
    internal: theme.palette.primary.main,
    view: theme.palette.info.main,
    supplier: theme.palette.secondary.main,
    customer: theme.palette.success.main,
    production: theme.palette.warning.main,
    transit: theme.palette.info.dark,
    scrap: theme.palette.error.main,
  };
  return map[locationType] || theme.palette.text.secondary;
}

function getTypeIcon(locationType) {
  const map = {
    internal: 'solar:box-bold-duotone',
    view: 'solar:eye-bold-duotone',
    supplier: 'solar:delivery-bold-duotone',
    customer: 'solar:user-bold-duotone',
    production: 'solar:settings-bold-duotone',
    transit: 'solar:route-bold-duotone',
    scrap: 'solar:trash-bin-trash-bold-duotone',
  };
  return map[locationType] || 'solar:map-point-bold-duotone';
}

// â”€â”€â”€ main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function StorageLocationDetails() {
  const params = useParams();
  const router = useRouter();
  const confirm = useBoolean();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const locationId = Array.isArray(params?.locationId) ? params.locationId[0] : params?.locationId;
  const detailUrl = locationId ? EP.storage_location_by_id(locationId) : null;
  const parentLookupUrl = `${EP.storage_locations}?ordering=office__name&pagination=false`;
  const productsUrl = locationId
    ? `${EP.products}?storage_location=${locationId}&pagination=false`
    : null;

  const officeListUrl = `${PM.office_management}?pagination=false`;

  const { data: location, loading, error } = useGetRequest(detailUrl);
  const { data: rawOffices } = useGetRequest(officeListUrl);
  const { data: rawParentLookup } = useGetRequest(parentLookupUrl);
  const { data: rawProducts, isLoading: productsLoading } = useGetRequest(productsUrl);

  const officeOptions = useMemo(() => toStorageLocationOptions(rawOffices), [rawOffices]);
  const allLocationOptions = useMemo(
    () => toStorageLocationOptions(rawParentLookup),
    [rawParentLookup]
  );
  const products = useMemo(() => {
    if (!rawProducts) return [];
    return Array.isArray(rawProducts) ? rawProducts : rawProducts.results || [];
  }, [rawProducts]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(getEmptyStorageLocationForm());
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('');

  const parentOptions = useMemo(
    () => getParentLocationOptions(allLocationOptions, form.warehouse, location?.id),
    [allLocationOptions, form.warehouse, location?.id]
  );

  const filteredProducts = useMemo(() => {
    let list = products;
    if (productStatusFilter === 'active') list = list.filter((p) => p.is_active);
    if (productStatusFilter === 'inactive') list = list.filter((p) => !p.is_active);
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.code?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, productSearch, productStatusFilter]);

  const productMetrics = useMemo(
    () => ({
      total: products.length,
      active: products.filter((p) => p.is_active).length,
      totalOnHand: products.reduce((s, p) => s + Number(p.on_hand || 0), 0),
      totalReserved: products.reduce((s, p) => s + Number(p.reserved || 0), 0),
      totalAvailable: products.reduce((s, p) => s + Number(p.available || 0), 0),
      lowStock: products.filter(
        (p) => Number(p.on_hand || 0) <= Number(p.reorder_level || 0) && p.is_active
      ).length,
    }),
    [products]
  );

  const locationTypeLabel =
    location?.location_type_label || getLocationTypeLabel(location?.location_type);
  const typeColor = getTypeColor(theme, location?.location_type);
  const typeIcon = getTypeIcon(location?.location_type);
  const heroGradient = `linear-gradient(135deg, ${alpha(typeColor, isDark ? 0.28 : 0.12)}, ${alpha(theme.palette.background.paper, 0)})`;
  const primaryGradient = `linear-gradient(135deg, ${typeColor}, ${alpha(typeColor, 0.6)})`;
  const panelSx = {
    borderRadius: 3,
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: theme.palette.background.paper,
  };

  const revalidateQueries = async () => {
    await Promise.all([
      mutate((key) => typeof key === 'string' && key.startsWith(EP.storage_locations)),
      mutate((key) => typeof key === 'string' && key.startsWith(EP.products)),
    ]);
  };

  const openEditDialog = () => {
    if (!location) return;
    setForm(normalizeStorageLocationForm(location));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (submitting) return;
    setDialogOpen(false);
    setForm(getEmptyStorageLocationForm());
  };

  const handleSubmit = async () => {
    const validationMessage = validateStorageLocationForm(form);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }
    setSubmitting(true);
    try {
      await putRequest(detailUrl, storageLocationFormToPayload(form));
      toast.success('Storage location updated successfully.');
      closeDialog();
      await revalidateQueries();
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
      toast.success('Storage location deleted successfully.');
      await revalidateQueries();
      router.push(paths.dashboard.storeInventory.storageLocations);
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError?.response?.data || requestError));
    } finally {
      setDeleting(false);
      confirm.onFalse();
    }
  };

  // â”€â”€ loading / error states â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading storage locationâ€¦
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error || !location) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          component={Link}
          href={paths.dashboard.storeInventory.storageLocations}
          startIcon={<Iconify icon="solar:arrow-left-linear" />}
          sx={{ mb: 2, textTransform: 'none' }}
        >
          Back to Storage Locations
        </Button>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          This storage location could not be loaded. The record may have been removed or the backend
          returned an error.
        </Alert>
      </Box>
    );
  }

  const flags = [
    {
      label: 'Scrap Routing',
      value: location.is_scrap,
      icon: 'solar:trash-bin-trash-bold-duotone',
      color: theme.palette.error.main,
    },
    {
      label: 'Return Routing',
      value: location.is_return,
      icon: 'solar:undo-left-bold-duotone',
      color: theme.palette.warning.main,
    },
    {
      label: 'Active',
      value: location.is_active,
      icon: 'solar:check-circle-bold-duotone',
      color: theme.palette.success.main,
    },
  ];

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Stack spacing={3}>
        {/* â”€â”€ nav + header â”€â”€ */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Button
              component={Link}
              href={paths.dashboard.storeInventory.storageLocations}
              startIcon={<Iconify icon="solar:arrow-left-linear" />}
              sx={{ px: 0, mb: 1, textTransform: 'none', fontWeight: 600 }}
            >
              Back to Storage Locations
            </Button>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background: primaryGradient,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Iconify icon={typeIcon} width={24} sx={{ color: '#fff' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} color="text.primary" lineHeight={1.2}>
                  {location.name}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    {[location.office_name, location.parent_name].filter(Boolean).join(' / ')}
                  </Typography>
                  <StatusChip active={location.is_active} />
                </Stack>
              </Box>
            </Stack>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={openEditDialog}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={confirm.onTrue}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Delete
            </Button>
          </Stack>
        </Stack>

        {/* â”€â”€ hero card â”€â”€ */}
        <Card sx={{ ...panelSx, overflow: 'hidden' }}>
          <Box sx={{ p: 3.5, background: heroGradient }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="overline" color="text.secondary">
                  Storage Location
                </Typography>
                <Typography variant="h4" fontWeight={800} color="text.primary" mb={0.5}>
                  {location.name}
                </Typography>
                {location.barcode && (
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <Iconify
                      icon="solar:barcode-bold-duotone"
                      width={16}
                      sx={{ color: 'text.secondary' }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontFamily="monospace"
                      fontWeight={700}
                    >
                      {location.barcode}
                    </Typography>
                  </Stack>
                )}
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    label={locationTypeLabel}
                    size="small"
                    variant="soft"
                    sx={{ fontWeight: 700, color: typeColor, bgcolor: alpha(typeColor, 0.12) }}
                    icon={<Iconify icon={typeIcon} width={14} sx={{ color: typeColor }} />}
                  />
                  {location.office_name && (
                    <Chip
                      label={location.office_name}
                      size="small"
                      variant="outlined"
                      icon={<Iconify icon="solar:buildings-2-bold-duotone" width={14} />}
                    />
                  )}
                  {location.is_scrap && (
                    <Chip label="Scrap" size="small" color="error" variant="soft" />
                  )}
                  {location.is_return && (
                    <Chip label="Return" size="small" color="warning" variant="soft" />
                  )}
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={1.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                  <Box textAlign={{ xs: 'left', md: 'right' }}>
                    <Typography variant="caption" color="text.secondary">
                      Office / Warehouse
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="text.primary">
                      {location.office_name || 'â€”'}
                    </Typography>
                  </Box>
                  <Box textAlign={{ xs: 'left', md: 'right' }}>
                    <Typography variant="caption" color="text.secondary">
                      Child Locations
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="text.primary">
                      {location.child_count ?? 0}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Card>

        {/* â”€â”€ product stock metrics â”€â”€ */}
        {!productsLoading && products.length > 0 && (
          <Grid container spacing={2}>
            {[
              {
                label: 'Products Stored',
                value: productMetrics.total,
                icon: 'solar:box-bold-duotone',
                color: theme.palette.primary.main,
                helper: 'Total products assigned here.',
              },
              {
                label: 'Active Products',
                value: productMetrics.active,
                icon: 'solar:check-circle-bold-duotone',
                color: theme.palette.success.main,
                helper: 'Currently active & available.',
              },
              {
                label: 'Total On-Hand',
                value: Number(productMetrics.totalOnHand).toLocaleString('en-BD', {
                  maximumFractionDigits: 2,
                }),
                icon: 'solar:layers-bold-duotone',
                color: theme.palette.info.main,
                helper: 'Sum of all on-hand quantities.',
              },
              {
                label: 'Total Available',
                value: Number(productMetrics.totalAvailable).toLocaleString('en-BD', {
                  maximumFractionDigits: 2,
                }),
                icon: 'solar:cart-large-4-bold-duotone',
                color: theme.palette.success.dark,
                helper: 'On-hand minus reserved.',
              },
              {
                label: 'Reserved',
                value: Number(productMetrics.totalReserved).toLocaleString('en-BD', {
                  maximumFractionDigits: 2,
                }),
                icon: 'solar:lock-bold-duotone',
                color: theme.palette.warning.main,
                helper: 'Quantity held for orders.',
              },
              {
                label: 'Low Stock',
                value: productMetrics.lowStock,
                icon: 'solar:danger-triangle-bold-duotone',
                color: theme.palette.error.main,
                helper: 'At or below reorder level.',
              },
            ].map((card) => (
              <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <Card sx={panelSx}>
                  <Box sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="overline" color="text.secondary" fontSize="0.62rem">
                          {card.label}
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color="text.primary">
                          {card.value}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: 2,
                          bgcolor: alpha(card.color, isDark ? 0.22 : 0.12),
                          color: card.color,
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <Iconify icon={card.icon} width={19} />
                      </Box>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" mt={0.75} display="block">
                      {card.helper}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* â”€â”€ main layout: details left, flags right â”€â”€ */}
        <Grid container spacing={3}>
          {/* left: location details */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <SectionCard
              title="Location Details"
              icon="solar:document-text-bold-duotone"
              color={typeColor}
            >
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    label="Location Name"
                    value={location.name}
                    icon="solar:tag-bold-duotone"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField label="Location Type" value={locationTypeLabel} icon={typeIcon} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    label="Office / Warehouse"
                    value={location.office_name || 'â€”'}
                    muted={!location.office_name}
                    icon="solar:buildings-2-bold-duotone"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    label="Office Type"
                    value={
                      location.office_type
                        ? location.office_type === 'warehouse'
                          ? 'Warehouse'
                          : 'Office'
                        : 'â€”'
                    }
                    muted={!location.office_type}
                    icon="solar:flag-bold-duotone"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    label="Parent Location"
                    value={location.parent_name || 'Top-level (no parent)'}
                    muted={!location.parent_name}
                    icon="solar:widget-4-bold-duotone"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    label="Child Locations"
                    value={String(location.child_count ?? 0)}
                    icon="solar:boxes-minimalistic-bold-duotone"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    label="Barcode"
                    value={location.barcode || 'Not set'}
                    muted={!location.barcode}
                    icon="solar:barcode-bold-duotone"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    label="Status"
                    value={location.is_active ? 'Active' : 'Inactive'}
                    icon="solar:shield-check-bold-duotone"
                  />
                </Grid>
              </Grid>
            </SectionCard>
          </Grid>

          {/* right: flags + actions */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <Stack spacing={3}>
              {/* operational flags */}
              <SectionCard
                title="Operational Flags"
                icon="solar:shield-bold-duotone"
                color={typeColor}
              >
                <Stack spacing={0}>
                  {flags.map((flag, i) => (
                    <Box key={flag.label}>
                      {i > 0 && <Divider sx={{ my: 1.5 }} />}
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1.5,
                              bgcolor: alpha(flag.color, 0.12),
                              color: flag.color,
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            <Iconify icon={flag.icon} width={16} />
                          </Box>
                          <Typography variant="body2" fontWeight={600}>
                            {flag.label}
                          </Typography>
                        </Stack>
                        <FlagChip value={flag.value} trueLabel="Enabled" falseLabel="Disabled" />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </SectionCard>

              {/* hierarchy navigation */}
              <SectionCard title="Hierarchy" icon="solar:widget-4-bold-duotone" color={typeColor}>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Full Path
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="text.primary"
                      textAlign="right"
                      maxWidth={200}
                      sx={{ wordBreak: 'break-all' }}
                    >
                      {[location.office_name, location.parent_name, location.name]
                        .filter(Boolean)
                        .join(' â€º ')}
                    </Typography>
                  </Stack>
                  <Divider />
                  {location.parent ? (
                    <Button
                      component={Link}
                      href={paths.dashboard.storeInventory.storage_location_detail(location.parent)}
                      variant="outlined"
                      size="small"
                      startIcon={<Iconify icon="solar:arrow-up-bold" />}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      Open Parent Location
                    </Button>
                  ) : (
                    <Alert severity="info" sx={{ borderRadius: 2, py: 0.75 }}>
                      This is a top-level location â€” no parent exists.
                    </Alert>
                  )}
                </Stack>
              </SectionCard>
            </Stack>
          </Grid>
        </Grid>

        {/* â”€â”€ products in this location â”€â”€ */}
        <SectionCard
          title={`Products in This Location (${productsLoading ? 'â€¦' : filteredProducts.length})`}
          icon="solar:box-minimalistic-bold-duotone"
          color={typeColor}
        >
          {/* filter bar */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2}>
            <TextField
              size="small"
              sx={{ flex: 1 }}
              placeholder="Search by name, code, barcodeâ€¦"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify
                      icon="solar:magnifer-linear"
                      width={18}
                      sx={{ color: 'text.disabled' }}
                    />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              sx={{ minWidth: 160 }}
              label="Status"
              value={productStatusFilter}
              onChange={(e) => setProductStatusFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
            {(productSearch || productStatusFilter) && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setProductSearch('');
                  setProductStatusFilter('');
                }}
              >
                Clear
              </Button>
            )}
          </Stack>

          {/* summary chips */}
          {!productsLoading && products.length > 0 && (
            <Stack direction="row" spacing={1.5} mb={2} flexWrap="wrap">
              <Chip
                size="small"
                variant="soft"
                color="primary"
                label={`${products.length} Products`}
                icon={<Iconify icon="solar:box-bold-duotone" width={14} />}
              />
              <Chip
                size="small"
                variant="soft"
                color="info"
                label={`On-Hand: ${Number(productMetrics.totalOnHand).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`}
                icon={<Iconify icon="solar:layers-bold-duotone" width={14} />}
              />
              <Chip
                size="small"
                variant="soft"
                color="success"
                label={`Available: ${Number(productMetrics.totalAvailable).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`}
                icon={<Iconify icon="solar:cart-large-4-bold-duotone" width={14} />}
              />
              {productMetrics.lowStock > 0 && (
                <Chip
                  size="small"
                  variant="soft"
                  color="error"
                  label={`${productMetrics.lowStock} Low Stock`}
                  icon={<Iconify icon="solar:danger-triangle-bold-duotone" width={14} />}
                />
              )}
            </Stack>
          )}

          {productsLoading ? (
            <LinearProgress />
          ) : products.length === 0 ? (
            <Stack alignItems="center" spacing={1.5} py={5}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  bgcolor: alpha(typeColor, 0.1),
                  color: typeColor,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Iconify icon="solar:box-minimalistic-bold-duotone" width={28} />
              </Box>
              <Typography variant="body1" fontWeight={700} color="text.primary">
                No products stored here
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Assign products to <strong>{location.name}</strong> via the product settings to see
                them here.
              </Typography>
            </Stack>
          ) : filteredProducts.length === 0 ? (
            <Stack alignItems="center" spacing={1} py={3}>
              <Iconify icon="solar:magnifer-linear" width={36} sx={{ color: 'text.disabled' }} />
              <Typography variant="body2" color="text.secondary">
                No products match your filter.
              </Typography>
            </Stack>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{ bgcolor: alpha(theme.palette.text.primary, isDark ? 0.1 : 0.04) }}
                  >
                    {[
                      '#',
                      'Code',
                      'Product Name',
                      'Category',
                      'On-Hand',
                      'Reserved',
                      'Available',
                      'Reorder Lvl',
                      'Status',
                    ].map((h) => (
                      <TableCell
                        key={h}
                        align={
                          ['#', 'On-Hand', 'Reserved', 'Available', 'Reorder Lvl'].includes(h)
                            ? 'center'
                            : 'left'
                        }
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.4,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.map((product, i) => {
                    const onHand = Number(product.on_hand || 0);
                    const reorder = Number(product.reorder_level || 0);
                    const isLow = product.is_active && onHand <= reorder;
                    return (
                      <TableRow key={product.id} hover>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={700} color="text.secondary">
                            {i + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color="primary.main"
                            fontWeight={700}
                            fontFamily="monospace"
                          >
                            {product.code || 'â€”'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {product.name || 'â€”'}
                          </Typography>
                          {product.barcode && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontFamily="monospace"
                            >
                              {product.barcode}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {product.category_name || 'â€”'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            color={isLow ? 'error.main' : 'success.main'}
                          >
                            {onHand.toLocaleString('en-BD', { maximumFractionDigits: 2 })}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600} color="warning.main">
                            {Number(product.reserved || 0).toLocaleString('en-BD', {
                              maximumFractionDigits: 2,
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            color={
                              Number(product.available || 0) > 0 ? 'success.main' : 'error.main'
                            }
                          >
                            {Number(product.available || 0).toLocaleString('en-BD', {
                              maximumFractionDigits: 2,
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="text.secondary">
                            {reorder > 0
                              ? reorder.toLocaleString('en-BD', { maximumFractionDigits: 2 })
                              : 'â€”'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <StatusChip active={product.is_active} />
                            {isLow && (
                              <Chip
                                label="Low"
                                size="small"
                                color="error"
                                variant="soft"
                                sx={{ fontWeight: 700 }}
                              />
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionCard>

        {/* â”€â”€ child locations (if any) â”€â”€ */}
        {(location.child_count ?? 0) > 0 && (
          <SectionCard
            title={`Child Locations (${location.child_count})`}
            icon="solar:boxes-minimalistic-bold-duotone"
            color={typeColor}
          >
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              This location has <strong>{location.child_count}</strong> nested child location(s).
              Use the Storage Locations list with a parent filter to browse them.
            </Alert>
            <Box mt={2}>
              <Button
                component={Link}
                href={paths.dashboard.storeInventory.storageLocations}
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="solar:filter-bold-duotone" />}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Browse Storage Locations
              </Button>
            </Box>
          </SectionCard>
        )}
      </Stack>

      {/* â”€â”€ edit dialog â”€â”€ */}
      <StorageLocationFormDialog
        open={dialogOpen}
        title="Edit Storage Location"
        submitLabel="Save Changes"
        form={form}
        setForm={setForm}
        submitting={submitting}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        officeOptions={officeOptions}
        parentOptions={parentOptions}
      />

      {/* â”€â”€ delete confirm â”€â”€ */}
      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Storage Location"
        content={
          <Typography>
            Delete <strong>{location.name}</strong>? This action cannot be undone.
          </Typography>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={
              deleting ? (
                <CircularProgress size={16} />
              ) : (
                <Iconify icon="solar:trash-bin-trash-bold" />
              )
            }
          >
            {deleting ? 'Deletingâ€¦' : 'Delete'}
          </Button>
        }
      />
    </Box>
  );
}
