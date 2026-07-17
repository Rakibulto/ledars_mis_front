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
  Tooltip,
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
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useDebounce } from 'src/hooks/use-debounce';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, useDeleteRequest as deleteRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import TableRowSkeleton from 'src/components/table/tableRowSkeleton';

import { useAuthContext } from 'src/auth/hooks';

import SummaryCard from '../../_components/summary-card';
import ScrapApprovalDialog from './scrap-approval-dialog';
import { computeScrapWorkflowInfo, SCRAP_APPROVAL_WORKFLOW_URL } from './scrap-approval-workflow';

const EP = endpoints.storeInventory;
const PM = endpoints.procurement_management;

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'Pending Approval', label: 'Pending Approval' },
  { value: 'Approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function normalizeCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.results) ? payload.results : [];
}

function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function getStatusChipProps(status) {
  switch (normalizeStatus(status)) {
    case 'completed':
      return { color: 'success', label: 'Completed' };
    case 'approved':
      return { color: 'info', label: 'Approved' };
    case 'cancelled':
      return { color: 'error', label: 'Cancelled' };
    case 'pending approval':
      return { color: 'warning', label: 'Pending Approval' };
    default:
      return { color: 'default', label: status || 'Unknown' };
  }
}

function formatDate(value) {
  if (!value) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(value));
}

function formatQuantity(value) {
  return Number(value || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function buildScrapQuery({ search, status, officeLocation, disposalMethod, page, pagination }) {
  const params = new URLSearchParams();

  params.set('ordering', '-created_at');

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (status) {
    params.set('status', status);
  }

  if (officeLocation) {
    params.set('office_location', String(officeLocation));
  }

  if (disposalMethod) {
    params.set('disposal_method', disposalMethod);
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String(page + 1));
  }

  return `${EP.scrap_records}?${params.toString()}`;
}

function ScrapRow({
  scrapRecord,
  serialNumber,
  onOpenDetails,
  onEdit,
  onDelete,
  onApprove,
  approving,
  wfInfo,
}) {
  const statusChip = getStatusChipProps(scrapRecord.status);
  const isApprovable = !['approved', 'completed', 'cancelled'].includes(
    String(scrapRecord.status || '')
      .trim()
      .toLowerCase()
  );

  const showApproveButton = isApprovable && Boolean(wfInfo?.canApprove);
  const nextApproverLabel =
    wfInfo?.nextApprover || (wfInfo?.pendingNames?.length ? wfInfo.pendingNames.join(', ') : '');

  return (
    <TableRow
      hover
      onClick={() => onOpenDetails(scrapRecord.id)}
      sx={{
        cursor: 'pointer',
        '&:hover': {
          bgcolor: '#f8fafc',
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
            {scrapRecord.reference || 'Unnumbered scrap'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {scrapRecord.certificate_number || 'Certificate pending'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={600} color="#0f172a">
            {scrapRecord.product_name || 'Product pending'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {scrapRecord.product_code || 'Code pending'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#475569">
          {scrapRecord.office_location_name || scrapRecord.warehouse_name || 'Location pending'}
        </Typography>
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" color="#475569">
            {scrapRecord.disposal_method || 'Method pending'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {scrapRecord.scrapped_by_name || 'Recorder pending'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" color="#475569">
            {formatDate(scrapRecord.date)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Disposal {formatDate(scrapRecord.disposal_date)}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell align="center">
        <Stack spacing={0.25} alignItems="center">
          <Typography variant="body2" fontWeight={700} color="#0f172a">
            {formatQuantity(scrapRecord.quantity)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {scrapRecord.uom_name || 'unit'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell align="center">
        <Chip size="small" color={statusChip.color} label={statusChip.label} variant="soft" />
      </TableCell>
      <TableCell>
        <Stack spacing={0.25} sx={{ maxWidth: 180 }}>
          {isApprovable && nextApproverLabel ? (
            <Tooltip title={`Next approver: ${nextApproverLabel}`}>
              <Typography variant="body2" fontWeight={600} color="#0f172a" noWrap>
                {nextApproverLabel}
              </Typography>
            </Tooltip>
          ) : (
            <Typography variant="body2" color="text.disabled">
              -
            </Typography>
          )}
          {wfInfo?.approvedNames?.length ? (
            <Tooltip title={`Approved: ${wfInfo.approvedNames.join(', ')}`}>
              <Typography variant="caption" color="success.main" noWrap>
                Approved: {wfInfo.approvedNames.join(', ')}
              </Typography>
            </Tooltip>
          ) : null}
        </Stack>
      </TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={0.5} justifyContent="center">
          {showApproveButton && (
            <Tooltip title="Approve">
              <Button
                size="small"
                variant="contained"
                disabled={approving}
                color="success"
                onClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  onApprove(scrapRecord);
                }}
                sx={{
                  ml: 0.25,
                  px: 1.25,
                  minWidth: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                }}
                startIcon={<Iconify icon="solar:check-circle-bold" width={14} />}
              >
                Approve
              </Button>
            </Tooltip>
          )}
          <IconButton
            size="small"
            color="primary"
            disabled={
              String(scrapRecord.status || '')
                .trim()
                .toLowerCase() === 'approved'
            }
            onClick={(event) => {
              event.stopPropagation();
              onEdit(scrapRecord.id);
            }}
          >
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            disabled={
              String(scrapRecord.status || '')
                .trim()
                .toLowerCase() === 'approved'
            }
            onClick={(event) => {
              event.stopPropagation();
              onDelete(scrapRecord.id);
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function ScrapManagementMain() {
  const router = useRouter();
  const { user } = useAuthContext();

  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [officeLocationFilter, setOfficeLocationFilter] = useState('');
  const [disposalMethodFilter, setDisposalMethodFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null); // holds the full scrap record

  const debouncedSearch = useDebounce(searchQuery, 400);

  const scrapListUrl = useMemo(
    () =>
      buildScrapQuery({
        search: debouncedSearch,
        status: statusFilter,
        officeLocation: officeLocationFilter,
        disposalMethod: disposalMethodFilter,
        page,
        pagination: true,
      }),
    [debouncedSearch, statusFilter, officeLocationFilter, disposalMethodFilter, page]
  );

  const scrapSummaryUrl = useMemo(
    () =>
      buildScrapQuery({
        search: debouncedSearch,
        status: statusFilter,
        officeLocation: officeLocationFilter,
        disposalMethod: disposalMethodFilter,
        page: 0,
        pagination: false,
      }),
    [debouncedSearch, statusFilter, officeLocationFilter, disposalMethodFilter]
  );

  const {
    data: rawScrapList,
    loading: listLoading,
    error: listError,
  } = useGetRequest(scrapListUrl);
  const { data: rawScrapSummary } = useGetRequest(scrapSummaryUrl);
  const { data: rawOffices, loading: officesLoading } = useGetRequest(
    `${PM.office_management}?pagination=false`
  );

  const { data: rawApprovalWorkflows } = useGetRequest(SCRAP_APPROVAL_WORKFLOW_URL);

  const rows = useMemo(() => normalizeCollection(rawScrapList), [rawScrapList]);
  const summaryRows = useMemo(() => normalizeCollection(rawScrapSummary), [rawScrapSummary]);
  const officeOptions = useMemo(
    () =>
      [...normalizeCollection(rawOffices)]
        .filter((o) => o.type === 'office' || o.type === 'warehouse')
        .sort((left, right) =>
          String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
            sensitivity: 'base',
          })
        ),
    [rawOffices]
  );
  const disposalMethodOptions = useMemo(
    () =>
      [
        ...new Set(
          summaryRows.map((row) => String(row?.disposal_method || '').trim()).filter(Boolean)
        ),
      ].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' })),
    [summaryRows]
  );

  const totalPages = Math.max(1, Number(rawScrapList?.total_pages || 1));
  const totalCount = Number(rawScrapList?.count || summaryRows.length || 0);

  const summaryMetrics = useMemo(
    () => ({
      total: totalCount,
      pending: summaryRows.filter((row) => normalizeStatus(row.status) === 'pending approval')
        .length,
      completed: summaryRows.filter((row) => normalizeStatus(row.status) === 'completed').length,
      quantity: summaryRows.reduce((total, row) => total + Number(row.quantity || 0), 0),
    }),
    [summaryRows, totalCount]
  );

  const canResetFilters = Boolean(
    searchQuery.trim() || statusFilter || officeLocationFilter || disposalMethodFilter || page !== 0
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setOfficeLocationFilter('');
    setDisposalMethodFilter('');
    setPage(0);
  };

  const handleCreate = () => {
    router.push(paths.dashboard.storeInventory.scrapManagement_create);
  };

  const handleEdit = (scrapId) => {
    router.push(paths.dashboard.storeInventory.scrapManagement_edit(scrapId));
  };

  const handleDeleteRequest = (scrapId) => {
    setDeleteId(scrapId);
  };

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    try {
      await deleteRequest(EP.scrap_record_by_id(deleteId));
      toast.success('Scrap record deleted successfully.');
      await Promise.all([mutate(scrapListUrl), mutate(scrapSummaryUrl)]);
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete the selected scrap record.');
    }
  };

  const handleApproveRequest = (scrapRecord) => {
    setApproveTarget(scrapRecord);
  };

  const openDetails = (scrapId) => {
    router.push(paths.dashboard.storeInventory.scrapManagement_detail(scrapId));
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={2}
          alignItems={{ md: 'center' }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700} color="#0f172a" gutterBottom>
              Scrap Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage stock write-offs with server-side search, filters, pagination, row drilldown,
              and inline create, edit, and delete actions.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:restart-bold-duotone" />}
              onClick={handleResetFilters}
              disabled={!canResetFilters}
            >
              Reset Filters
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
              onClick={handleCreate}
            >
              Create Scrap Record
            </Button>
          </Stack>
        </Stack>

        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Search now runs on the server across reference, product, office location, reason, disposal
          method, certificate number, and recorder. Click any scrap row to open its full audit
          details.
        </Alert>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Filtered Records"
              value={summaryMetrics.total}
              icon="solar:trash-bin-trash-bold-duotone"
              bgcolor="#b91c1c"
              boxShadow="0 4px 20px rgba(185, 28, 28, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Pending Approval"
              value={summaryMetrics.pending}
              icon="solar:clock-circle-bold-duotone"
              bgcolor="#d97706"
              boxShadow="0 4px 20px rgba(217, 119, 6, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Completed"
              value={summaryMetrics.completed}
              icon="solar:check-circle-bold-duotone"
              bgcolor="#059669"
              boxShadow="0 4px 20px rgba(5, 150, 105, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Scrap Qty"
              value={formatQuantity(summaryMetrics.quantity)}
              icon="solar:box-bold-duotone"
              bgcolor="#1d4ed8"
              boxShadow="0 4px 20px rgba(29, 78, 216, 0.28)"
            />
          </Grid>
        </Grid>

        <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4.5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search reference, product, reason, disposal method, certificate, or user..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:magnifer-bold-duotone" width={18} />
                    </InputAdornment>
                  ),
                  endAdornment:
                    searchQuery !== debouncedSearch ? (
                      <CircularProgress color="inherit" size={16} />
                    ) : null,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2.5 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(0);
                }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 2.5 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Office / Warehouse"
                value={officeLocationFilter}
                onChange={(event) => {
                  setOfficeLocationFilter(event.target.value);
                  setPage(0);
                }}
                disabled={officesLoading}
              >
                <MenuItem value="">All Locations</MenuItem>
                {officeOptions.map((office) => (
                  <MenuItem key={office.id} value={String(office.id)}>
                    {office.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 2.5 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Disposal Method"
                value={disposalMethodFilter}
                onChange={(event) => {
                  setDisposalMethodFilter(event.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Methods</MenuItem>
                {disposalMethodOptions.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #e5e7eb' }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ sm: 'center' }}
              spacing={1.5}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Scrap Register
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {totalCount.toLocaleString('en-BD')} scrap records matched the current server
                  filters.
                </Typography>
              </Box>
            </Stack>
          </Box>

          {listError && (
            <Alert severity="error" sx={{ m: 2 }}>
              Failed to load the scrap list. Please refresh the page and try again.
            </Alert>
          )}

          <TableContainer>
            <Table size={dense ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell align="center">#</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Office / Location</TableCell>
                  <TableCell>Disposal</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell>Next Approver</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listLoading
                  ? Array.from({ length: 5 }, (_, index) => (
                      <TableRowSkeleton
                        key={index}
                        columns={[
                          { type: 'text', width: 24, align: 'center' },
                          { type: 'text', lines: 2, width: 160 },
                          { type: 'text', lines: 2, width: 160 },
                          { type: 'text', width: 130 },
                          { type: 'text', lines: 2, width: 150 },
                          { type: 'text', lines: 2, width: 135 },
                          { type: 'text', lines: 2, width: 72, align: 'center' },
                          { type: 'rect', width: 120, height: 28, align: 'center' },
                          { type: 'text', lines: 2, width: 140 },
                          { type: 'text', width: 48, align: 'center' },
                        ]}
                      />
                    ))
                  : rows.map((scrapRecord, index) => (
                      <ScrapRow
                        key={scrapRecord.id}
                        scrapRecord={scrapRecord}
                        serialNumber={page * 10 + index + 1}
                        onOpenDetails={openDetails}
                        onEdit={handleEdit}
                        onDelete={handleDeleteRequest}
                        onApprove={handleApproveRequest}
                        approving={false}
                        wfInfo={computeScrapWorkflowInfo(
                          scrapRecord,
                          rawApprovalWorkflows,
                          user?.email
                        )}
                      />
                    ))}

                {!listLoading && !rows.length && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                      <Stack spacing={2} alignItems="center">
                        <Iconify
                          icon="solar:trash-bin-trash-bold-duotone"
                          width={56}
                          sx={{ color: '#cbd5e1' }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          No scrap records found
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                          Adjust the search or filters to widen the result set.
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ sm: 'center' }}
            sx={{ px: 2.5, py: 2, borderTop: '1px solid #e5e7eb' }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <FormControlLabel
                control={
                  <Switch checked={dense} onChange={(event) => setDense(event.target.checked)} />
                }
                label="Dense rows"
                sx={{ m: 0 }}
              />

              <Typography variant="body2" color="text.secondary">
                Page {page + 1} of {totalPages}
              </Typography>
            </Stack>

            <Pagination
              page={page + 1}
              count={totalPages}
              color="primary"
              onChange={(_, value) => setPage(value - 1)}
              showFirstButton
              showLastButton
            />
          </Stack>
        </Card>
      </Stack>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete Scrap Record"
        content="Deleting this scrap record will also remove its generated stock movement audit row."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />

      <ScrapApprovalDialog
        open={Boolean(approveTarget)}
        scrapRecord={approveTarget}
        onClose={() => setApproveTarget(null)}
        onSuccess={async () => {
          setApproveTarget(null);
          await Promise.all([
            mutate(scrapListUrl),
            mutate(scrapSummaryUrl),
            mutate(SCRAP_APPROVAL_WORKFLOW_URL),
          ]);
        }}
      />
    </Box>
  );
}
