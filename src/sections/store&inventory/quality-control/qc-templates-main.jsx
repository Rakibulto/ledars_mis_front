'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Card,
  Chip,
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

import { useDebounce } from 'src/hooks/use-debounce';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import TableRowSkeleton from 'src/components/table/tableRowSkeleton';

import QcTemplateFormDialog from './qc-template-form-dialog';
import { renderBooleanChip } from '../shared/inventory-desk-page';
import {
  normalizeCollection,
  getChecklistPreview,
  getTemplateOptionalCount,
  getTemplateChecklistCount,
  getTemplateMandatoryCount,
} from './qc-template-shared';

const EP = endpoints.storeInventory;

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

const SUMMARY_TONES = {
  slate: { bg: '#e2e8f0', fg: '#0f172a' },
  success: { bg: '#dcfce7', fg: '#166534' },
  warning: { bg: '#fef3c7', fg: '#92400e' },
  error: { bg: '#fee2e2', fg: '#991b1b' },
};

function buildQcTemplateQuery({ search, category, isActive, page, pagination }) {
  const params = new URLSearchParams();
  const normalizedSearch = String(search || '').trim();

  params.set('ordering', 'name');

  if (normalizedSearch) {
    params.set('search', normalizedSearch);
  }

  if (category) {
    params.set('category', String(category));
  }

  if (isActive !== '') {
    params.set('is_active', isActive);
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String(page + 1));
  }

  return `${EP.qc_templates}?${params.toString()}`;
}

function buildSummaryMetrics(records) {
  return records.reduce(
    (summary, record) => {
      const checklistCount = getTemplateChecklistCount(record);

      summary.total += 1;
      summary.steps += checklistCount;

      if (record.is_active) {
        summary.active += 1;
      } else {
        summary.inactive += 1;
      }

      if (getTemplateMandatoryCount(record) > 0) {
        summary.ready += 1;
      }

      if (checklistCount <= 2) {
        summary.thin += 1;
      }

      return summary;
    },
    { total: 0, active: 0, inactive: 0, ready: 0, thin: 0, steps: 0 }
  );
}

function TemplateMetricCard({ icon, title, value, description, tone = 'slate' }) {
  const colors = SUMMARY_TONES[tone] || SUMMARY_TONES.slate;

  return (
    <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2.5,
            bgcolor: colors.bg,
            color: colors.fg,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Iconify icon={icon} width={28} />
        </Box>

        <Box>
          <Typography variant="overline" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} color="#0f172a">
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

function TemplateRow({ template, serialNumber, onOpenDetails, onEdit, onDelete }) {
  const checklistCount = getTemplateChecklistCount(template);
  const mandatoryCount = getTemplateMandatoryCount(template);
  const optionalCount = getTemplateOptionalCount(template);

  return (
    <TableRow
      hover
      onClick={() => onOpenDetails(template.id)}
      sx={{
        cursor: 'pointer',
        '&:hover': {
          bgcolor: '#ecfeff',
        },
      }}
    >
      <TableCell align="center" sx={{ width: 56 }}>
        <Typography variant="body2" fontWeight={700} color="#64748b">
          {serialNumber}
        </Typography>
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={700} color="#0f172a">
            {template.name || 'Unnamed template'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {getChecklistPreview(template.checklist)}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={600} color="#0f172a">
          {template.category_name || 'No category linked'}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Chip size="small" color="primary" label={`${checklistCount} items`} variant="soft" />
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={600} color="#0f172a">
            {mandatoryCount} mandatory
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {optionalCount} optional
          </Typography>
        </Stack>
      </TableCell>
      <TableCell align="center">
        {renderBooleanChip(template.is_active, 'Active', 'Inactive')}
      </TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <IconButton
            size="small"
            color="primary"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetails(template.id);
            }}
          >
            <Iconify icon="solar:eye-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="inherit"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(template.id);
            }}
          >
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(template);
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function QcTemplatesMain() {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [activeId, setActiveId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebounce(searchInput, 400);

  const listUrl = useMemo(
    () =>
      buildQcTemplateQuery({
        search: debouncedSearch,
        category: categoryFilter,
        isActive: statusFilter,
        page,
        pagination: true,
      }),
    [debouncedSearch, categoryFilter, statusFilter, page]
  );

  const summaryUrl = useMemo(
    () =>
      buildQcTemplateQuery({
        search: debouncedSearch,
        category: categoryFilter,
        isActive: statusFilter,
        page,
        pagination: false,
      }),
    [debouncedSearch, categoryFilter, statusFilter, page]
  );

  const {
    data: rawTemplateList,
    loading: templateListLoading,
    error: templateListError,
  } = useGetRequest(listUrl);
  const { data: rawTemplateSummary } = useGetRequest(summaryUrl);
  const { data: rawCategories } = useGetRequest(`${EP.item_category}?pagination=false`);

  const rows = useMemo(() => normalizeCollection(rawTemplateList), [rawTemplateList]);
  const summaryRows = useMemo(() => normalizeCollection(rawTemplateSummary), [rawTemplateSummary]);
  const categoryOptions = useMemo(
    () =>
      [...normalizeCollection(rawCategories)].sort((left, right) =>
        String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawCategories]
  );

  const summaryMetrics = useMemo(() => buildSummaryMetrics(summaryRows), [summaryRows]);

  const totalPages = Math.max(rawTemplateList?.total_pages || 1, 1);
  const rowsPerPage = rawTemplateList?.page_size || 10;
  const totalMatches = rawTemplateList?.count ?? rows.length;
  const filtersApplied = Boolean(searchInput.trim() || categoryFilter || statusFilter);

  const openDetails = (templateId) => {
    router.push(paths.dashboard.storeInventory.qcTemplate_detail(templateId));
  };

  const openCreateDialog = () => {
    setFormMode('create');
    setActiveId(null);
    setFormOpen(true);
  };

  const openEditDialog = (templateId) => {
    setFormMode('edit');
    setActiveId(templateId);
    setFormOpen(true);
  };

  const refreshListData = async () => {
    await Promise.all([mutate(listUrl), mutate(summaryUrl), mutate(EP.qc_templates)]);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) {
      return;
    }

    try {
      await deleteRequest(EP.qc_template_by_id(deleteTarget.id));
      toast.success('QC template deleted successfully.');
      await refreshListData();
    } catch (deleteError) {
      toast.error(extractErrorMessage(deleteError?.response?.data || deleteError));
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleFormSuccess = async (record) => {
    await refreshListData();

    if (record?.id) {
      await mutate(EP.qc_template_by_id(record.id));
    }

    if (formMode === 'create' && record?.id) {
      router.push(paths.dashboard.storeInventory.qcTemplate_detail(record.id));
    }
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setCategoryFilter('');
    setStatusFilter('');
    setPage(0);
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        <Card
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            color: '#fff',
            background: 'linear-gradient(135deg, #164e63 0%, #0f766e 55%, #22c55e 100%)',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            spacing={3}
            alignItems={{ md: 'center' }}
          >
            <Stack spacing={1.5} sx={{ maxWidth: 760 }}>
              <Chip
                label="Store & Inventory"
                sx={{
                  alignSelf: 'flex-start',
                  bgcolor: 'rgba(255,255,255,0.16)',
                  color: '#fff',
                  fontWeight: 700,
                }}
              />
              <Typography variant="h3" fontWeight={800}>
                QC Templates Desk
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.88)' }}>
                Design reusable inspection checklists with live backend search, filters, pagination,
                inline CRUD, and routed template drilldown.
              </Typography>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="contained"
                color="inherit"
                startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
                onClick={openCreateDialog}
                sx={{
                  color: 'common.white',
                  fontWeight: 700,
                  '&:hover': { color: 'common.white' },
                  '&.Mui-disabled': { color: 'common.white' },
                }}
              >
                Add QC Template
              </Button>
            </Stack>
          </Stack>
        </Card>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <TemplateMetricCard
              icon="solar:clipboard-list-bold-duotone"
              title="Total Templates"
              value={summaryMetrics.total}
              description="Matched on the backend under the current search and filters."
              tone="slate"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <TemplateMetricCard
              icon="solar:check-circle-bold-duotone"
              title="Active"
              value={summaryMetrics.active}
              description="Templates currently available for live inspection workflows."
              tone="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <TemplateMetricCard
              icon="solar:shield-check-bold-duotone"
              title="Mandatory Ready"
              value={summaryMetrics.ready}
              description="Templates with at least one required release-control step."
              tone="warning"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <TemplateMetricCard
              icon="solar:danger-triangle-bold-duotone"
              title="Thin Checklists"
              value={summaryMetrics.thin}
              description="Templates with two or fewer checklist steps that may need review."
              tone="error"
            />
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ borderRadius: 3 }}>
          Search, category, status, and pagination now run against the live backend QC template API.
          Open any row to review and update the template in detail.
        </Alert>

        <Card sx={{ borderRadius: 4, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Stack spacing={2.5} sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search template name or category"
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value);
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
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Category"
                  value={categoryFilter}
                  onChange={(event) => {
                    setCategoryFilter(event.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categoryOptions.map((category) => (
                    <MenuItem key={category.id} value={String(category.id)}>
                      {category.name || 'Unnamed category'}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Status"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPage(0);
                  }}
                >
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <MenuItem key={option.value || 'all-status'} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              spacing={2}
            >
              <Typography variant="body2" color="text.secondary">
                {totalMatches} QC templates matched on the server.
              </Typography>

              <Stack direction="row" spacing={1.5} alignItems="center">
                {filtersApplied && (
                  <Button variant="text" color="inherit" onClick={handleResetFilters}>
                    Reset filters
                  </Button>
                )}
              </Stack>
            </Stack>

            {templateListError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                Failed to load QC templates. Please refresh the page and try again.
              </Alert>
            )}
          </Stack>

          <TableContainer>
            <Table size={dense ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#ecfeff' }}>
                  <TableCell align="center" sx={{ width: 56, fontWeight: 700 }}>
                    SL
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Template</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Checklist
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Coverage</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Status
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templateListLoading
                  ? Array.from({ length: 5 }, (_, index) => (
                      <TableRowSkeleton
                        key={index}
                        columns={[
                          { type: 'text', width: 20, align: 'center' },
                          { type: 'text', width: 220, lines: 2 },
                          { type: 'text', width: 150 },
                          { type: 'rect', width: 90, height: 24, align: 'center' },
                          { type: 'text', width: 160, lines: 2 },
                          { type: 'rect', width: 90, height: 24, align: 'center' },
                          { type: 'circle', count: 3, size: 30, align: 'center' },
                        ]}
                      />
                    ))
                  : rows.map((template, index) => (
                      <TemplateRow
                        key={template.id}
                        template={template}
                        serialNumber={page * rowsPerPage + index + 1}
                        onOpenDetails={openDetails}
                        onEdit={openEditDialog}
                        onDelete={(target) => setDeleteTarget(target)}
                      />
                    ))}

                {!templateListLoading && !rows.length && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Stack alignItems="center" spacing={2}>
                        <Iconify
                          icon="solar:clipboard-list-bold-duotone"
                          width={56}
                          sx={{ color: 'text.disabled' }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          No QC templates found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Adjust the filters or add a new QC template.
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
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ sm: 'center' }}
            >
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Switch checked={dense} onChange={(event) => setDense(event.target.checked)} />
                }
                label="Dense"
              />

              <Typography variant="body2" color="text.secondary">
                Page {page + 1} of {totalPages}
              </Typography>
            </Stack>

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

      <QcTemplateFormDialog
        open={formOpen}
        mode={formMode}
        qcTemplateId={formMode === 'edit' ? activeId : null}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete QC Template"
        content={`Are you sure you want to delete ${deleteTarget?.name || 'this QC template'}?`}
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

// 'use client';

// import { endpoints } from 'src/utils/axios';
// import { useGetRequest } from 'src/actions/ledars-hook';

// import InventoryCrudDeskPage from '../shared/inventory-crud-desk-page';
// import { renderBooleanChip } from '../shared/inventory-desk-page';

// const EP = endpoints.storeInventory;
// const DEFAULT_FORM = { name: '', category: '', is_active: true };

// export default function QcTemplatesMain() {
//   const { data: rawData } = useGetRequest(EP.qc_templates);
//   const rows = (Array.isArray(rawData) ? rawData : rawData?.results || []).map((row) => ({
//     ...row,
//     checklist: Array.isArray(row.checklist) ? row.checklist : [],
//   }));

//   return (
//     <InventoryCrudDeskPage
//       title="QC Templates"
//       dialogTitle="QC Template"
//       description="Maintain reusable inspection templates so quality checks stay consistent across products, teams, and field sites."
//       icon="solar:clipboard-list-bold-duotone"
//       rows={rows}
//       columns={[
//         { key: 'id', label: 'ID' },
//         { key: 'name', label: 'Template Name' },
//         { key: 'category', label: 'Category' },
//         { key: 'checklist', label: 'Checklist Items', render: (row) => row.checklist.length },
//         { key: 'is_active', label: 'Active', render: (row) => renderBooleanChip(row.is_active, 'Active', 'Inactive') },
//       ]}
//       summaryCards={[{ label: 'Total templates', value: rows.length, icon: 'solar:clipboard-list-bold-duotone', helper: 'Templates available for inspection design and rollout.' }]}
//       queueItems={(allRows) => [
//         { label: 'Inactive templates', value: allRows.filter((row) => !row.is_active).length, color: 'default', helper: 'Inactive templates should be archived or replaced.' },
//         { label: 'Thin checklists', value: allRows.filter((row) => row.checklist.length <= 2).length, color: 'warning', helper: 'Very short templates may not cover the full inspection scope.' },
//       ]}
//       reviewFields={[
//         { label: 'Category', render: (row) => row.category || 'Uncategorized' },
//         { label: 'Checklist items', render: (row) => row.checklist.length },
//         { label: 'Activity', render: (row) => renderBooleanChip(row.is_active, 'Active', 'Inactive') },
//       ]}
//       defaultForm={DEFAULT_FORM}
//       fields={[
//         { key: 'name', label: 'Template Name' },
//         { key: 'category', label: 'Category' },
//         { key: 'is_active', label: 'Active', options: [{ label: 'Active', value: true }, { label: 'Inactive', value: false }] },
//       ]}
//       createEndpoint={EP.qc_templates}
//       updateEndpoint={(id) => `${EP.qc_templates}${id}/`}
//       deleteEndpoint={(id) => `${EP.qc_templates}${id}/`}
//       mutateKey={EP.qc_templates}
//       getRowTitle={(row) => row.name || 'Unnamed template'}
//       getRowSubtitle={(row) => `${row.category || 'General'} template with ${row.checklist.length} checklist items`}
//     />
//   );
// }

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
