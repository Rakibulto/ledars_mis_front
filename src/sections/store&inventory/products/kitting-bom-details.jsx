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
  Table,
  Button,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
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

import { renderBooleanChip } from '../shared/inventory-desk-page';
import {
  toBomOptions,
  formatBomAmount,
  validateBomForm,
  bomFormToPayload,
  normalizeBomForm,
  getBomDerivedTotals,
  KittingBomFormDialog,
  sortBomOptionsByName,
} from './kitting-bom-form-dialog';

const EP = endpoints.storeInventory;

export default function KittingBomDetails() {
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
  const heroGradient = `linear-gradient(135deg, ${alpha(theme.palette.info.main, isDark ? 0.38 : 0.16)}, ${alpha(theme.palette.success.main, isDark ? 0.36 : 0.14)})`;

  const bomId = Array.isArray(params?.bomId) ? params.bomId[0] : params?.bomId;
  const detailUrl = bomId ? EP.kitting_bom_by_id(bomId) : null;

  const { data: bom, loading, error } = useGetRequest(detailUrl);
  const { data: rawProducts } = useGetRequest(EP.products);

  const products = useMemo(() => sortBomOptionsByName(toBomOptions(rawProducts)), [rawProducts]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const componentRows = useMemo(
    () => (Array.isArray(bom?.components) ? bom.components : []),
    [bom?.components]
  );
  const derivedTotals = useMemo(
    () => ({
      ...getBomDerivedTotals(componentRows),
      componentCount: bom?.component_count ?? componentRows.length,
      totalQty:
        bom?.total_component_qty ??
        componentRows.reduce((sum, component) => sum + Number(component.quantity || 0), 0),
      totalCost: Number(bom?.total_cost || 0),
      assemblyTime: Number(bom?.assembly_time_minutes || 0),
    }),
    [bom, componentRows]
  );

  const revalidateBomQueries = async () => {
    await mutate((key) => typeof key === 'string' && key.startsWith(EP.kitting_bom));
  };

  const openEditDialog = () => {
    if (!bom) {
      return;
    }

    setForm(normalizeBomForm(bom));
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
    const validationMessage = validateBomForm(form);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      await putRequest(detailUrl, bomFormToPayload(form));
      toast.success('BOM updated successfully.');
      closeDialog();
      await revalidateBomQueries();
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
      toast.success('BOM deleted successfully.');
      await revalidateBomQueries();
      router.push(paths.dashboard.storeInventory.kittingBom);
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

  if (error || !bom) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          This BOM could not be loaded. The record may have been removed or the backend returned an
          error.
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
              href={paths.dashboard.storeInventory.kittingBom}
              startIcon={<Iconify icon="solar:arrow-left-linear" />}
              sx={{ px: 0, mb: 1, textTransform: 'none' }}
            >
              Back to Kitting / BOM
            </Button>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
              <Iconify icon="solar:box-bold-duotone" width={28} />
              <Typography variant="h4" fontWeight={800} color="text.primary">
                {bom.name}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              BOM code {bom.code} for {bom.product_name || 'an unlinked product'}.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={openEditDialog}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Edit BOM
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={confirm.onTrue}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Delete BOM
            </Button>
          </Stack>
        </Stack>

        <Alert severity="info" sx={{ borderRadius: 2 }}>
          This detail view reads and writes the same BOM API resource, including nested component
          lines.
        </Alert>

        <Card sx={{ ...panelSx, overflow: 'hidden' }}>
          <Box sx={{ p: 3.5, background: heroGradient }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="overline" color="text.secondary">
                  BOM Overview
                </Typography>
                <Typography variant="h4" fontWeight={800} color="text.primary" mb={1}>
                  {bom.name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {bom.description ||
                    'This bill of materials does not have a written description yet. Use the edit dialog to document assembly notes.'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={1.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                  <Typography variant="body2" color="text.secondary">
                    Product
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="text.primary">
                    {bom.product_name || 'Unlinked'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Code: {bom.product_code || 'N/A'}
                  </Typography>
                  {renderBooleanChip(bom.is_active, 'Active', 'Inactive')}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Card>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={3}>
              <Grid container spacing={2}>
                {[
                  {
                    label: 'Components',
                    value: derivedTotals.componentCount,
                    helper: 'Distinct component lines in this BOM.',
                    color: theme.palette.primary.main,
                    icon: 'solar:box-bold-duotone',
                  },
                  {
                    label: 'Total Qty',
                    value: formatBomAmount(derivedTotals.totalQty),
                    helper: 'Combined component quantity across all lines.',
                    color: theme.palette.info.main,
                    icon: 'solar:clipboard-list-bold-duotone',
                  },
                  {
                    label: 'Assembly Time',
                    value: `${derivedTotals.assemblyTime} min`,
                    helper: 'Expected assembly duration.',
                    color: theme.palette.warning.main,
                    icon: 'solar:clock-circle-bold-duotone',
                  },
                  {
                    label: 'Total Cost',
                    value: `Tk ${formatBomAmount(derivedTotals.totalCost)}`,
                    helper: 'Backend-derived rollup from component costs.',
                    color: theme.palette.success.main,
                    icon: 'solar:wad-of-money-bold-duotone',
                  },
                ].map((card) => (
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

              <Card sx={panelSx}>
                <Box sx={{ p: 3 }}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={1.5}
                    mb={2.5}
                  >
                    <Box>
                      <Typography variant="h6" fontWeight={700} color="text.primary">
                        Component Breakdown
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Every component line below is persisted through the BOM serializer, not kept
                        only in the UI.
                      </Typography>
                    </Box>
                  </Stack>

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Component</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            Quantity
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            Unit Cost
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            Line Total
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {componentRows.map((component) => (
                          <TableRow key={component.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={700} color="text.primary">
                                {component.component_name || 'Unknown component'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {component.component_code || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="text.secondary">
                                {formatBomAmount(component.quantity)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="text.secondary">
                                Tk {formatBomAmount(component.unit_cost)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={700} color="text.primary">
                                Tk{' '}
                                {formatBomAmount(
                                  Number(component.quantity || 0) * Number(component.unit_cost || 0)
                                )}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}

                        {!componentRows.length && (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                              <Stack spacing={1.5} alignItems="center">
                                <Iconify
                                  icon="solar:box-minimalistic-bold-duotone"
                                  width={42}
                                  sx={{ color: 'text.disabled' }}
                                />
                                <Typography variant="h6" color="text.secondary">
                                  No component lines yet
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Add components to make this BOM usable for assembly or planning.
                                </Typography>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Card>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              <Card sx={panelSx}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} color="text.primary" mb={2}>
                    Build Notes
                  </Typography>
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: alpha(theme.palette.primary.main, isDark ? 0.2 : 0.08),
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Finished Product
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="text.primary">
                        {bom.product_name || 'No linked product'}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: alpha(theme.palette.warning.main, isDark ? 0.2 : 0.08),
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Production Guidance
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="text.primary">
                        {derivedTotals.componentCount > 0
                          ? `This BOM uses ${derivedTotals.componentCount} component lines and ${formatBomAmount(derivedTotals.totalQty)} total quantity units.`
                          : 'This BOM is still a draft and does not include component lines yet.'}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: alpha(theme.palette.success.main, isDark ? 0.2 : 0.08),
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Cost Snapshot
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="text.primary">
                        Estimated assembly cost is Tk {formatBomAmount(derivedTotals.totalCost)}.
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
                      Edit BOM
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                      onClick={confirm.onTrue}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      Delete BOM
                    </Button>
                    <Button
                      component={Link}
                      href={paths.dashboard.storeInventory.kittingBom}
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

      <KittingBomFormDialog
        open={dialogOpen}
        title="Edit Kitting / BOM"
        submitLabel={submitting ? 'Saving...' : 'Update BOM'}
        form={form || normalizeBomForm(bom)}
        setForm={setForm}
        products={products}
        submitting={submitting}
        onClose={closeDialog}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Kitting / BOM"
        content={`Are you sure you want to delete ${bom.name || 'this BOM'}?`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        }
      />
    </Box>
  );
}
