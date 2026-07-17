'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState, useEffect } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Grid,
  Alert,
  Stack,
  Table,
  Button,
  Switch,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Pagination,
  Typography,
  InputAdornment,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  usePutRequest as putRequest,
  useCreateRequest as createRequest,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import TableRowSkeleton from 'src/components/table/tableRowSkeleton';

import { renderBooleanChip } from '../shared/inventory-desk-page';
import {
  toDataArray,
  getPutawayScopeLabel,
  buildPutawayRuleQuery,
  getPutawayTargetLabel,
  PutawayRuleFormDialog,
  PUTAWAY_ORDER_OPTIONS,
  PUTAWAY_TARGET_OPTIONS,
  getEmptyPutawayRuleForm,
  validatePutawayRuleForm,
  normalizePutawayRuleForm,
  putawayRuleFormToPayload,
  PUTAWAY_STATUS_FILTER_OPTIONS,
} from './putaway-rule-form-dialog';

const EP = endpoints.storeInventory;

function SummaryCard({ label, value, helper, icon, color }) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        p: 2.75,
        height: '100%',
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
        boxShadow: 'none',
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {helper}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            bgcolor: alpha(color, 0.12),
            color,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Iconify icon={icon} width={24} />
        </Box>
      </Stack>
    </Card>
  );
}

function PutawayRuleRow({ row, serialNumber, onOpenDetails, onEdit, onDelete }) {
  return (
    <TableRow
      hover
      sx={{
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
      onClick={() => onOpenDetails(row.id)}
    >
      <TableCell align="center" sx={{ width: 56 }}>
        <Typography variant="body2" fontWeight={700} color="text.secondary">
          {serialNumber}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {getPutawayTargetLabel(row)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.product_code || row.warehouse_code || 'Rule target'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {getPutawayScopeLabel(row)}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {row.warehouse_name || 'Unassigned warehouse'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.warehouse_code || 'No code'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {row.location_name || 'No location'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.location_type_label || 'Location'}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {row.sequence}
        </Typography>
      </TableCell>
      <TableCell align="center">{renderBooleanChip(row.is_active, 'Active', 'Inactive')}</TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <IconButton
            size="small"
            color="primary"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetails(row.id);
            }}
          >
            <Iconify icon="solar:eye-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="primary"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(row);
            }}
          >
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(row);
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function PutawayRulesMain() {
  const confirm = useBoolean();
  const router = useRouter();
  const theme = useTheme();

  const isDark = theme.palette.mode === 'dark';
  const panelSx = {
    borderRadius: 3,
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: theme.palette.background.paper,
  };
  const tableHeadBg = alpha(theme.palette.text.primary, isDark ? 0.12 : 0.04);
  const primaryGradient = `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.info.main})`;
  const primaryGradientHover = `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.info.dark})`;

  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [ordering, setOrdering] = useState('sequence');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState(getEmptyPutawayRuleForm());
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const listUrl = useMemo(
    () =>
      `${EP.putaway_rules}?${buildPutawayRuleQuery({
        search: searchQuery,
        warehouse: warehouseFilter,
        status: statusFilter,
        targetType: targetTypeFilter,
        ordering,
        page,
        pagination: true,
      })}`,
    [ordering, page, searchQuery, statusFilter, targetTypeFilter, warehouseFilter]
  );

  const summaryUrl = useMemo(
    () =>
      `${EP.putaway_rules}?${buildPutawayRuleQuery({
        search: searchQuery,
        warehouse: warehouseFilter,
        status: statusFilter,
        targetType: targetTypeFilter,
        ordering,
        pagination: false,
      })}`,
    [ordering, searchQuery, statusFilter, targetTypeFilter, warehouseFilter]
  );

  const warehouseOptionsUrl = useMemo(() => `${EP.warehouses}?pagination=false&ordering=name`, []);
  const productOptionsUrl = useMemo(() => `${EP.products}?pagination=false`, []);
  const categoryOptionsUrl = useMemo(() => `${EP.item_category}?pagination=false`, []);
  const locationOptionsUrl = useMemo(() => {
    if (!form.warehouse) {
      return null;
    }

    return `${EP.storage_locations}?pagination=false&warehouse=${form.warehouse}&is_active=true`;
  }, [form.warehouse]);

  const {
    data: rawRuleList,
    loading: ruleListLoading,
    error: ruleListError,
  } = useGetRequest(listUrl);
  const { data: rawRuleSummary, loading: ruleSummaryLoading } = useGetRequest(summaryUrl);
  const { data: rawWarehouses } = useGetRequest(warehouseOptionsUrl);
  const { data: rawProducts } = useGetRequest(productOptionsUrl);
  const { data: rawCategories } = useGetRequest(categoryOptionsUrl);
  const { data: rawLocations } = useGetRequest(locationOptionsUrl);

  const rows = useMemo(() => toDataArray(rawRuleList), [rawRuleList]);
  const summaryRows = useMemo(() => toDataArray(rawRuleSummary), [rawRuleSummary]);
  const warehouseOptions = useMemo(() => toDataArray(rawWarehouses), [rawWarehouses]);
  const productOptions = useMemo(() => toDataArray(rawProducts), [rawProducts]);
  const categoryOptions = useMemo(() => toDataArray(rawCategories), [rawCategories]);
  const locationOptions = useMemo(() => toDataArray(rawLocations), [rawLocations]);

  const totalPages = rawRuleList?.total_pages || 1;
  const rowsPerPage = rawRuleList?.page_size || 10;

  useEffect(() => {
    if (page > Math.max(totalPages - 1, 0)) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [page, totalPages]);

  const summaryMetrics = useMemo(
    () => ({
      total: summaryRows.length,
      active: summaryRows.filter((row) => row.is_active).length,
      productScoped: summaryRows.filter((row) => row.target_type === 'product').length,
      highPriority: summaryRows.filter((row) => Number(row.sequence || 0) <= 3).length,
    }),
    [summaryRows]
  );

  const revalidatePutawayQueries = async () => {
    await mutate((key) => typeof key === 'string' && key.startsWith(EP.putaway_rules));
  };

  const openDetails = (id) => {
    router.push(paths.dashboard.storeInventory.putawayRule_detail(id));
  };

  const openCreateDialog = () => {
    setEditingRule(null);
    setForm(getEmptyPutawayRuleForm());
    setDialogOpen(true);
  };

  const openEditDialog = (rule) => {
    setEditingRule(rule);
    setForm(normalizePutawayRuleForm(rule));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (submitting) {
      return;
    }

    setDialogOpen(false);
    setEditingRule(null);
    setForm(getEmptyPutawayRuleForm());
  };

  const handleSubmit = async () => {
    const validationMessage = validatePutawayRuleForm(form);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      const payload = putawayRuleFormToPayload(form);

      if (editingRule) {
        await putRequest(EP.putaway_rule_by_id(editingRule.id), payload);
        toast.success('Putaway rule updated successfully.');
      } else {
        await createRequest(EP.putaway_rules, payload);
        toast.success('Putaway rule created successfully.');
      }

      closeDialog();
      await revalidatePutawayQueries();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError?.response?.data || requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (rule) => {
    setDeleteTarget(rule);
    confirm.onTrue();
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteRequest(EP.putaway_rule_by_id(deleteTarget.id));
      toast.success('Putaway rule deleted successfully.');
      await revalidatePutawayQueries();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError?.response?.data || requestError));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
      confirm.onFalse();
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setWarehouseFilter('');
    setStatusFilter('');
    setTargetTypeFilter('');
    setOrdering('sequence');
    setPage(0);
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Stack spacing={3}>
        <Card
          sx={{
            ...panelSx,
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isDark ? 0.28 : 0.12)}, ${alpha(theme.palette.warning.main, isDark ? 0.24 : 0.12)})`,
          }}
        >
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              spacing={3}
              alignItems={{ xs: 'flex-start', lg: 'center' }}
              justifyContent="space-between"
            >
              <Box sx={{ maxWidth: 880 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.25 }}>
                  <Iconify icon="solar:routing-bold-duotone" width={28} />
                  <Typography variant="h4" fontWeight={800} color="text.primary">
                    Putaway Rules Desk
                  </Typography>
                </Stack>
                <Typography variant="body1" color="text.secondary">
                  Design warehouse routing logic with live backend search, server-side pagination,
                  product-versus-category scope, and direct row-to-detail review for ERP putaway
                  control.
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleResetFilters}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Reset Filters
                </Button>

                <Button
                  variant="contained"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={openCreateDialog}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    color: theme.palette.primary.contrastText,
                    background: primaryGradient,
                    '&:hover': {
                      background: primaryGradientHover,
                    },
                  }}
                >
                  Add Putaway Rule
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Card>

        <Alert severity={ruleListError ? 'error' : 'info'} sx={{ borderRadius: 2 }}>
          {ruleListError
            ? 'Failed to load putaway rules. Check the backend filters or API response and try again.'
            : 'This page now uses the live putaway rules API with backend search, warehouse filtering, target-type filtering, pagination, and CRUD support.'}
        </Alert>

        <Grid container spacing={3}>
          {[
            {
              label: 'Matching Rules',
              value: ruleSummaryLoading ? '...' : summaryMetrics.total,
              helper: 'Records matched by the current server-side filters.',
              color: theme.palette.primary.main,
              icon: 'solar:list-check-bold-duotone',
            },
            {
              label: 'Active Rules',
              value: ruleSummaryLoading ? '...' : summaryMetrics.active,
              helper: 'Rules currently routing inbound stock decisions.',
              color: theme.palette.success.main,
              icon: 'solar:check-circle-bold-duotone',
            },
            {
              label: 'Product Scope',
              value: ruleSummaryLoading ? '...' : summaryMetrics.productScoped,
              helper: 'Rules that override category routing with product-specific logic.',
              color: theme.palette.info.main,
              icon: 'solar:box-bold-duotone',
            },
            {
              label: 'High Priority',
              value: ruleSummaryLoading ? '...' : summaryMetrics.highPriority,
              helper: 'Rules with sequence 1-3 that should be validated carefully.',
              color: theme.palette.warning.main,
              icon: 'solar:sort-from-top-to-bottom-bold-duotone',
            },
          ].map((card) => (
            <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard {...card} />
            </Grid>
          ))}
        </Grid>

        <Card sx={panelSx}>
          <Box sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Stack
                direction={{ xs: 'column', lg: 'row' }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', lg: 'center' }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Putaway Rule Registry
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Search, filter, and paginate live rules directly from the backend without
                    client-side slicing.
                  </Typography>
                </Box>
              </Stack>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, lg: 4 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Search by product, category, warehouse, location, or code"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setPage(0);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Iconify icon="solar:magnifer-bold-duotone" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2 }}>
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Warehouse"
                    value={warehouseFilter}
                    onChange={(event) => {
                      setWarehouseFilter(event.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="">All Warehouses</MenuItem>
                    {warehouseOptions.map((warehouse) => (
                      <MenuItem key={warehouse.id} value={String(warehouse.id)}>
                        {warehouse.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2 }}>
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Rule Status"
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setPage(0);
                    }}
                  >
                    {PUTAWAY_STATUS_FILTER_OPTIONS.map((option) => (
                      <MenuItem key={option.value || 'all'} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2 }}>
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Rule Scope"
                    value={targetTypeFilter}
                    onChange={(event) => {
                      setTargetTypeFilter(event.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="">All Scopes</MenuItem>
                    {PUTAWAY_TARGET_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2 }}>
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Order"
                    value={ordering}
                    onChange={(event) => {
                      setOrdering(event.target.value);
                      setPage(0);
                    }}
                  >
                    {PUTAWAY_ORDER_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <TableContainer
                sx={{ borderRadius: 2.5, border: `1px solid ${theme.palette.divider}` }}
              >
                <Table size={dense ? 'small' : 'medium'}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: tableHeadBg }}>
                      <TableCell align="center">#</TableCell>
                      <TableCell>Target</TableCell>
                      <TableCell>Scope</TableCell>
                      <TableCell>Warehouse</TableCell>
                      <TableCell>Destination Location</TableCell>
                      <TableCell align="center">Sequence</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ruleListLoading
                      ? [...Array(rowsPerPage || 10)].map((_, index) => (
                          <TableRowSkeleton
                            key={`putaway-skeleton-${index}`}
                            columns={[
                              { type: 'text', width: 20, align: 'center' },
                              { type: 'text', width: 180, lines: 2 },
                              { type: 'text', width: 120 },
                              { type: 'text', width: 160, lines: 2 },
                              { type: 'text', width: 150, lines: 2 },
                              { type: 'text', width: 36, align: 'center' },
                              { type: 'rect', width: 76, height: 24, align: 'center' },
                              { type: 'circle', count: 3, size: 30, align: 'center' },
                            ]}
                            sx={{ '& td': { py: dense ? 1.5 : 2 } }}
                          />
                        ))
                      : rows.map((row, index) => (
                          <PutawayRuleRow
                            key={row.id}
                            row={row}
                            serialNumber={page * rowsPerPage + index + 1}
                            onOpenDetails={openDetails}
                            onEdit={openEditDialog}
                            onDelete={openDeleteDialog}
                          />
                        ))}

                    {!ruleListLoading && rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            No putaway rules matched the current backend filters.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </TableContainer>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={dense}
                        onChange={(event) => setDense(event.target.checked)}
                      />
                    }
                    label="Dense rows"
                    sx={{ m: 0 }}
                  />

                  <Typography variant="body2" color="text.secondary">
                    {ruleListLoading
                      ? 'Loading server-side putaway rules.'
                      : `${rows.length} row(s) returned on this page.`}
                  </Typography>
                </Stack>

                <Pagination
                  page={page + 1}
                  count={totalPages}
                  color="primary"
                  onChange={(_, value) => setPage(value - 1)}
                />
              </Stack>
            </Stack>
          </Box>
        </Card>

        <PutawayRuleFormDialog
          open={dialogOpen}
          title={editingRule ? 'Edit Putaway Rule' : 'Add Putaway Rule'}
          submitLabel={editingRule ? 'Update Rule' : 'Create Rule'}
          form={form}
          setForm={setForm}
          submitting={submitting}
          onClose={closeDialog}
          onSubmit={handleSubmit}
          warehouses={warehouseOptions}
          locations={locationOptions}
          products={productOptions}
          categories={categoryOptions}
        />

        <ConfirmDialog
          open={confirm.value}
          onClose={confirm.onFalse}
          title="Delete Putaway Rule"
          content={`Delete ${deleteTarget ? getPutawayTargetLabel(deleteTarget) : 'this putaway rule'}? This will remove the routing instruction from the warehouse rule set.`}
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
