'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Chip,
  Card,
  Grid,
  Alert,
  Stack,
  Table,
  Button,
  Switch,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Pagination,
  Typography,
  Autocomplete,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

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
import { getReorderRuleModuleConfig } from './reorder-rule-module-config';
import {
  TRIGGER_OPTIONS,
  toReorderOptions,
  formatReorderAmount,
  ReorderRuleFormDialog,
  buildReorderRuleQuery,
  TRIGGER_FILTER_OPTIONS,
  getEmptyReorderRuleForm,
  validateReorderRuleForm,
  normalizeReorderRuleForm,
  reorderRuleFormToPayload,
  sortReorderOptionsByName,
  REORDER_STATUS_FILTER_OPTIONS,
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

function ReorderRuleRow({ row, serialNumber, onOpenDetails, onEdit, onDelete }) {
  return (
    <TableRow
      hover
      onClick={() => onOpenDetails(row.id)}
      sx={{
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <TableCell align="center" sx={{ width: 56 }}>
        <Typography variant="body2" fontWeight={700} color="text.secondary">
          {serialNumber}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {row.product_name || 'Unnamed product'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.product_code || 'No product code'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {row.warehouse_name || 'All Warehouses'}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" color="text.secondary">
          {formatReorderAmount(row.min_qty)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" color="text.secondary">
          {formatReorderAmount(row.max_qty)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {formatReorderAmount(row.reorder_qty)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2" color="text.secondary">
          {Number(row.lead_time_days || 0)} days
        </Typography>
      </TableCell>
      <TableCell align="center">
        <TriggerChip trigger={row.trigger} />
      </TableCell>
      <TableCell align="center">{renderBooleanChip(row.is_active, 'Active', 'Inactive')}</TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={0.5} justifyContent="center">
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

export default function ReorderRulesMain({ moduleKey = 'reorderRules' }) {
  const confirm = useBoolean();
  const router = useRouter();
  const theme = useTheme();
  const moduleConfig = getReorderRuleModuleConfig(moduleKey);

  const isDark = theme.palette.mode === 'dark';
  const panelSx = {
    borderRadius: 3,
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: theme.palette.background.paper,
  };
  const tableHeadBg = alpha(theme.palette.text.primary, isDark ? 0.12 : 0.04);
  const primaryGradient = `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.info.main})`;
  const primaryGradientHover = `linear-gradient(90deg, ${theme.palette.warning.dark}, ${theme.palette.info.dark})`;

  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [triggerFilter, setTriggerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState(getEmptyReorderRuleForm());
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const listUrl = useMemo(
    () =>
      `${moduleConfig.listEndpoint}?${buildReorderRuleQuery({
        search: searchQuery,
        productId: productFilter,
        warehouseId: warehouseFilter,
        trigger: triggerFilter,
        status: statusFilter,
        page,
      })}`,
    [
      moduleConfig.listEndpoint,
      page,
      productFilter,
      searchQuery,
      statusFilter,
      triggerFilter,
      warehouseFilter,
    ]
  );

  const { data: rawRules, loading: rulesLoading, error: rulesError } = useGetRequest(listUrl);
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

  const rows = useMemo(() => {
    const ruleList = Array.isArray(rawRules?.results)
      ? rawRules.results
      : toReorderOptions(rawRules);

    return ruleList.map((rule) => ({
      ...rule,
      lead_time_days: Number(rule.lead_time_days || 0),
    }));
  }, [rawRules]);

  const summaryMetrics = useMemo(() => {
    const averageLeadTime = rows.length
      ? rows.reduce((sum, row) => sum + Number(row.lead_time_days || 0), 0) / rows.length
      : 0;

    return {
      total: rawRules?.count ?? rows.length,
      automatic: rows.filter((row) => row.trigger === 'automatic').length,
      warehouseLinked: rows.filter((row) => Boolean(row.warehouse)).length,
      averageLeadTime,
    };
  }, [rawRules, rows]);

  const totalPages = rawRules?.total_pages || 1;
  const rowsPerPage = rawRules?.page_size || 10;

  const revalidateRuleQueries = async () => {
    await mutate((key) => typeof key === 'string' && key.startsWith(moduleConfig.listEndpoint));
  };

  const openDetails = (id) => {
    router.push(moduleConfig.detailPath(id));
  };

  const openCreateDialog = () => {
    setEditingRule(null);
    setForm(getEmptyReorderRuleForm());
    setDialogOpen(true);
  };

  const openEditDialog = (rule) => {
    setEditingRule(rule);
    setForm(normalizeReorderRuleForm(rule));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (submitting) {
      return;
    }

    setDialogOpen(false);
    setEditingRule(null);
    setForm(getEmptyReorderRuleForm());
  };

  const handleSubmit = async () => {
    const validationMessage = validateReorderRuleForm(form);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      const payload = reorderRuleFormToPayload(form);

      if (editingRule) {
        await putRequest(moduleConfig.detailEndpoint(editingRule.id), payload);
        toast.success(moduleConfig.updatedToast);
      } else {
        await createRequest(moduleConfig.listEndpoint, payload);
        toast.success(moduleConfig.createdToast);
      }

      closeDialog();
      await revalidateRuleQueries();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError?.response?.data || requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteRequest(moduleConfig.detailEndpoint(deleteTarget.id));
      toast.success(moduleConfig.deletedToast);
      await revalidateRuleQueries();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError?.response?.data || requestError));
    } finally {
      confirm.onFalse();
      setDeleteTarget(null);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setProductFilter('');
    setWarehouseFilter('');
    setTriggerFilter('');
    setStatusFilter('');
    setPage(0);
  };

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
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
              <Iconify icon="solar:refresh-circle-bold-duotone" width={28} />
              <Typography variant="h4" fontWeight={800} color="text.primary">
                {moduleConfig.title}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {moduleConfig.pageDescription}
            </Typography>
          </Box>

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
            {`Add ${moduleConfig.singularTitle}`}
          </Button>
        </Stack>

        <Alert severity={rulesError ? 'error' : 'info'} sx={{ borderRadius: 2 }}>
          {rulesError ? moduleConfig.loadError : moduleConfig.listInfo}
        </Alert>

        <Grid container spacing={3}>
          {[
            {
              label: 'Matching Rules',
              value: summaryMetrics.total,
              helper: 'Rules returned by the current backend filters.',
              color: theme.palette.primary.main,
              icon: 'solar:refresh-circle-bold-duotone',
            },
            {
              label: 'Automatic on Page',
              value: summaryMetrics.automatic,
              helper: 'Visible rules that can trigger replenishment automatically.',
              color: theme.palette.info.main,
              icon: 'solar:bolt-circle-bold-duotone',
            },
            {
              label: 'Warehouse Scoped',
              value: summaryMetrics.warehouseLinked,
              helper: 'Visible rules tied to a specific warehouse.',
              color: theme.palette.warning.main,
              icon: 'solar:buildings-2-bold-duotone',
            },
            {
              label: 'Avg Lead Time',
              value: `${formatReorderAmount(summaryMetrics.averageLeadTime)} days`,
              helper: 'Average lead time across the visible result page.',
              color: theme.palette.success.main,
              icon: 'solar:clock-circle-bold-duotone',
            },
          ].map((card) => (
            <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card sx={panelSx}>
                <Box sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        {card.label}
                      </Typography>
                      <Typography variant="h4" fontWeight={800} color="text.primary">
                        {rulesLoading ? '...' : card.value}
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
          <Box sx={{ p: 2.5 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by product, code, warehouse, or trigger"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setPage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <Iconify
                        icon="solar:magnifer-linear"
                        width={18}
                        sx={{ mr: 1, color: 'text.secondary' }}
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2.5 }}>
                <Autocomplete
                  size="small"
                  options={products}
                  value={products.find((product) => product.id === Number(productFilter)) || null}
                  onChange={(event, nextValue) => {
                    setProductFilter(nextValue?.id ? String(nextValue.id) : '');
                    setPage(0);
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  getOptionLabel={(option) => option?.name || ''}
                  renderInput={(params) => <TextField {...params} label="Product" />}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2.5 }}>
                <Autocomplete
                  size="small"
                  options={warehouses}
                  value={
                    warehouses.find((warehouse) => warehouse.id === Number(warehouseFilter)) || null
                  }
                  onChange={(event, nextValue) => {
                    setWarehouseFilter(nextValue?.id ? String(nextValue.id) : '');
                    setPage(0);
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  getOptionLabel={(option) => option?.name || ''}
                  renderInput={(params) => <TextField {...params} label="Warehouse" />}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1.5 }}>
                <Autocomplete
                  size="small"
                  options={TRIGGER_FILTER_OPTIONS}
                  value={
                    TRIGGER_FILTER_OPTIONS.find((option) => option.id === triggerFilter) ||
                    TRIGGER_FILTER_OPTIONS[0]
                  }
                  onChange={(event, nextValue) => {
                    setTriggerFilter(nextValue?.id ?? '');
                    setPage(0);
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  getOptionLabel={(option) => option?.label || ''}
                  renderInput={(params) => <TextField {...params} label="Trigger" />}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1.5 }}>
                <Autocomplete
                  size="small"
                  options={REORDER_STATUS_FILTER_OPTIONS}
                  value={
                    REORDER_STATUS_FILTER_OPTIONS.find((option) => option.id === statusFilter) ||
                    REORDER_STATUS_FILTER_OPTIONS[0]
                  }
                  onChange={(event, nextValue) => {
                    setStatusFilter(nextValue?.id ?? '');
                    setPage(0);
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  getOptionLabel={(option) => option?.label || ''}
                  renderInput={(params) => <TextField {...params} label="Status" />}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={dense}
                        onChange={(event) => setDense(event.target.checked)}
                      />
                    }
                    label="Dense"
                  />
                  <Button onClick={handleResetFilters} sx={{ textTransform: 'none' }}>
                    Reset Filters
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Card>

        <Card sx={panelSx}>
          <TableContainer>
            <Table size={dense ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ bgcolor: tableHeadBg }}>
                  <TableCell align="center" sx={{ width: 56, fontWeight: 700 }}>
                    SL
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Warehouse</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Min Qty
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Max Qty
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Reorder Qty
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Lead Time
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Trigger
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Status
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rulesLoading
                  ? Array.from({ length: 5 }, (_, index) => (
                      <TableRowSkeleton
                        key={index}
                        columns={[
                          { type: 'text', width: 20, align: 'center' },
                          { type: 'text', width: 170 },
                          { type: 'text', width: 130 },
                          { type: 'text', width: 70, align: 'right' },
                          { type: 'text', width: 70, align: 'right' },
                          { type: 'text', width: 80, align: 'right' },
                          { type: 'text', width: 70, align: 'center' },
                          { type: 'rect', width: 80, height: 24, align: 'center' },
                          { type: 'rect', width: 72, height: 24, align: 'center' },
                          { type: 'circle', count: 2, size: 30, align: 'center' },
                        ]}
                      />
                    ))
                  : rows.map((row, index) => (
                      <ReorderRuleRow
                        key={row.id}
                        row={row}
                        serialNumber={page * rowsPerPage + index + 1}
                        onOpenDetails={openDetails}
                        onEdit={openEditDialog}
                        onDelete={(rule) => {
                          setDeleteTarget(rule);
                          confirm.onTrue();
                        }}
                      />
                    ))}

                {!rulesLoading && !rows.length && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                      <Stack alignItems="center" spacing={2}>
                        <Iconify
                          icon="solar:refresh-circle-bold-duotone"
                          width={56}
                          sx={{ color: 'text.disabled' }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          {moduleConfig.emptyTitle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {moduleConfig.emptyDescription}
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              px: 2.5,
              py: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {rawRules?.count ?? 0} records matched on the backend.
            </Typography>

            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={(event, nextPage) => setPage(nextPage - 1)}
              variant="outlined"
              shape="rounded"
            />
          </Box>
        </Card>
      </Stack>

      <ReorderRuleFormDialog
        open={dialogOpen}
        title={
          editingRule ? `Edit ${moduleConfig.singularTitle}` : `Add ${moduleConfig.singularTitle}`
        }
        submitLabel={submitting ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
        form={form}
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
        content={`Are you sure you want to delete the ${moduleConfig.singularTitle.toLowerCase()} for ${deleteTarget?.product_name || 'this product'}?`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}

// 'use client';

// import { Chip } from '@mui/material';

// import { endpoints } from 'src/utils/axios';
// import { useGetRequest } from 'src/actions/ledars-hook';

// import InventoryCrudDeskPage from '../shared/inventory-crud-desk-page';
// import { renderBooleanChip } from '../shared/inventory-desk-page';

// const EP = endpoints.storeInventory;
// const DEFAULT_FORM = { product_name: '', min_qty: '', max_qty: '', lead_time_days: '', trigger: '', supplier: '', is_active: true };

// export default function ReorderRulesMain() {
//   const { data: rawData } = useGetRequest(EP.reorder_rules);
//   const rows = Array.isArray(rawData) ? rawData : rawData?.results || [];

//   return (
//     <InventoryCrudDeskPage
//       title="Reorder Rules"
//       dialogTitle="Reorder Rule"
//       description="Keep minimum and maximum stock policies aligned with supplier lead times so replenishment can be planned before stockouts emerge."
//       icon="solar:refresh-circle-bold-duotone"
//       rows={rows}
//       columns={[
//         { key: 'id', label: 'ID' },
//         { key: 'product_name', label: 'Product' },
//         { key: 'min_qty', label: 'Min Qty' },
//         { key: 'max_qty', label: 'Max Qty' },
//         { key: 'lead_time_days', label: 'Lead Time' },
//         { key: 'trigger', label: 'Trigger', render: (row) => <Chip size="small" label={row.trigger || 'Manual'} variant="outlined" /> },
//         { key: 'supplier', label: 'Supplier' },
//         { key: 'is_active', label: 'Active', render: (row) => renderBooleanChip(row.is_active, 'Active', 'Inactive') },
//       ]}
//       summaryCards={[
//         { label: 'Total rules', value: rows.length, icon: 'solar:refresh-circle-bold-duotone', helper: 'Replenishment control rules currently defined.' },
//         { label: 'Automatic', value: rows.filter((row) => row.trigger === 'Automatic').length, icon: 'solar:bolt-circle-bold-duotone', color: 'info', helper: 'Rules configured for automated reorder logic.' },
//       ]}
//       queueItems={(allRows) => [
//         { label: 'Inactive rules', value: allRows.filter((row) => !row.is_active).length, color: 'default', helper: 'Inactive rules will not contribute to replenishment planning.' },
//         { label: 'Long lead-time suppliers', value: allRows.filter((row) => Number(row.lead_time_days || 0) > 14).length, color: 'warning', helper: 'These rules need wider planning buffers.' },
//       ]}
//       reviewFields={[
//         { label: 'Product', render: (row) => row.product_name || 'Unnamed product' },
//         { label: 'Min / Max', render: (row) => `${row.min_qty || 0} / ${row.max_qty || 0}` },
//         { label: 'Lead time', render: (row) => `${row.lead_time_days || 0} days` },
//         { label: 'Trigger', render: (row) => <Chip size="small" label={row.trigger || 'Manual'} variant="outlined" /> },
//         { label: 'Supplier', render: (row) => row.supplier || 'Unassigned' },
//       ]}
//       defaultForm={DEFAULT_FORM}
//       fields={[
//         { key: 'product_name', label: 'Product' },
//         { key: 'min_qty', label: 'Min Qty', type: 'number' },
//         { key: 'max_qty', label: 'Max Qty', type: 'number' },
//         { key: 'lead_time_days', label: 'Lead Time', type: 'number' },
//         { key: 'trigger', label: 'Trigger' },
//         { key: 'supplier', label: 'Supplier' },
//         { key: 'is_active', label: 'Active', options: [{ label: 'Active', value: true }, { label: 'Inactive', value: false }] },
//       ]}
//       createEndpoint={EP.reorder_rules}
//       updateEndpoint={(id) => EP.reorder_rule_by_id(id)}
//       deleteEndpoint={(id) => EP.reorder_rule_by_id(id)}
//       mutateKey={EP.reorder_rules}
//       getRowTitle={(row) => row.product_name || 'Unnamed rule'}
//       getRowSubtitle={(row) => `${row.supplier || 'Unassigned supplier'} with ${row.trigger || 'manual'} trigger`}
//     />
//   );
// }
//               <TextField fullWidth label="Product Name" value={form.product_name}
//                 onChange={(e) => setForm({ ...form, product_name: e.target.value })} />
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <TextField fullWidth label="Min Qty" value={form.min_qty}
//                 onChange={(e) => setForm({ ...form, min_qty: e.target.value })} />
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <TextField fullWidth label="Max Qty" value={form.max_qty}
//                 onChange={(e) => setForm({ ...form, max_qty: e.target.value })} />
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <TextField fullWidth label="Lead Time (Days)" value={form.lead_time_days}
//                 onChange={(e) => setForm({ ...form, lead_time_days: e.target.value })} />
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <TextField fullWidth label="Trigger" value={form.trigger}
//                 onChange={(e) => setForm({ ...form, trigger: e.target.value })} />
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <TextField fullWidth label="Supplier" value={form.supplier}
//                 onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
//             </Grid>
//           </Grid>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
//           <Button variant="contained" onClick={handleSubmit}>
//             {editingItem ? 'Update' : 'Save'}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       <ConfirmDialog
//         open={confirm.value}
//         onClose={confirm.onFalse}
//         title="Delete"
//         content="Are you sure you want to delete this record?"
//         action={<Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>}
//       />
//     </Box>
//   );
// }
