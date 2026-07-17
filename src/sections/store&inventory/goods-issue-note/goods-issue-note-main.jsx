'use client';

import dayjs from 'dayjs';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Box,
  Tab,
  Card,
  Chip,
  Grid,
  Tabs,
  Alert,
  Stack,
  Table,
  Button,
  Switch,
  Divider,
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

import { useDebounce } from 'src/hooks/use-debounce';

import axiosInstance, { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  usePatchRequest as patchRequest,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import TableRowSkeleton from 'src/components/table/tableRowSkeleton';

import { useAuthContext } from 'src/auth/hooks';

import GinApprovalInfo from './gin-approval-info';
import GinApprovalSummary from './gin-approval-summary';
import SummaryCard from '../../_components/summary-card';
import IssueDocumentChallanPDF from './issue-document-challan-pdf';
import { getIssueDocumentModuleConfig } from './issue-document-module-config';
import { revalidateInventoryLogInsights } from '../inventory-log/inventory-log-utils';
import {
  computeGinWorkflowInfo,
  GIN_APPROVAL_WORKFLOW_URL,
  NO_WORKFLOW_LEVEL_MESSAGE,
} from './gin-approval-workflow';

const EP = endpoints.storeInventory;
const PM = endpoints.procurement_management;

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Pending Approval', label: 'Pending Approval' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Issued', label: 'Issued' },
  { value: 'Cancelled', label: 'Cancelled' },
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

function formatCurrency(value) {
  const amount = Number(value || 0);

  return `BDT ${amount.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(value));
}

function getProjectLabel(project) {
  return project?.title || project?.short_name || project?.code || project?.name || '';
}

function getStatusChipProps(status) {
  switch (normalizeStatus(status)) {
    case 'issued':
      return { color: 'secondary', label: 'Issued' };
    case 'pending approval':
      return { color: 'warning', label: 'Pending Approval' };
    case 'approved':
      return { color: 'success', label: 'Approved' };
    case 'cancelled':
      return { color: 'error', label: 'Cancelled' };
    case 'draft':
      return { color: 'default', label: 'Draft' };
    default:
      return { color: 'default', label: status || 'Unknown' };
  }
}

function buildIssueDocumentQuery({
  baseEndpoint,
  search,
  status,
  department,
  project,
  warehouse,
  office_location,
  page,
  pagination,
}) {
  const params = new URLSearchParams();

  params.set('ordering', '-issue_date');

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (status) {
    params.set('status', status);
  }

  if (department) {
    params.set('department', department);
  }

  if (project) {
    params.set('project', project);
  }

  if (warehouse) {
    params.set('warehouse', String(warehouse));
  }

  if (office_location) {
    params.set('office_location', String(office_location));
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String(page + 1));
  }

  return `${baseEndpoint}?${params.toString()}`;
}

function getUniqueOptions(rows, field) {
  return [...new Set(rows.map((row) => String(row?.[field] || '').trim()).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' })
  );
}

function getApprovalLineItems(gin) {
  return Array.isArray(gin?.line_items) ? gin.line_items : [];
}

function createDecisionLineItems(gin) {
  return getApprovalLineItems(gin).map((line, index) => ({
    localId: String(line.id || `${line.product || 'line'}-${line.item_code || index}`),
    id: line.id || null,
    gin: line.gin || gin?.id || null,
    product: line.product ? String(line.product) : '',
    product_name: line.product_name || '',
    item_code: line.item_code || '',
    item_name: line.item_name || line.product_name || '',
    requested_qty: line.requested_qty ?? line.issued_qty ?? '',
    issued_qty: line.issued_qty ?? '',
    unit: line.unit || '',
    unit_price: line.unit_price ?? '',
    remarks: line.remarks || '',
    item_current_quantity: line.item_current_quantity ?? null,
  }));
}

function normalizeDecisionLineItems(lineItems) {
  if (!Array.isArray(lineItems) || !lineItems.length) {
    toast.error('No line items are available for approval.');
    return null;
  }

  const normalizedLineItems = lineItems.map((line) => ({
    product: Number(line.product || 0),
    item_code: String(line.item_code || '').trim(),
    item_name: String(line.item_name || line.product_name || '').trim(),
    requested_qty: Number(line.issued_qty || 0),
    issued_qty: Number(line.issued_qty || 0),
    unit: String(line.unit || '').trim(),
    unit_price: Number(line.unit_price || 0),
    remarks: String(line.remarks || '').trim() || null,
    item_current_quantity: Number(line.item_current_quantity || 0),
  }));

  const incompleteLine = normalizedLineItems.find(
    (line) => !line.product || !line.item_code || !line.item_name || !line.unit
  );

  if (incompleteLine) {
    toast.error('Each line item must stay linked to an item before approval.');
    return null;
  }

  const invalidQuantity = normalizedLineItems.find((line) => Number(line.issued_qty || 0) <= 0);

  if (invalidQuantity) {
    toast.error('Issued quantity must be greater than zero.');
    return null;
  }

  const exceedsStock = normalizedLineItems.find(
    (line) => Number(line.issued_qty || 0) > Number(line.item_current_quantity || 0)
  );

  if (exceedsStock) {
    toast.error('Issued quantity must be under the current stock for the selected item.');
    return null;
  }

  return normalizedLineItems.map(({ item_current_quantity, ...line }) => line);
}

function ApprovalDetailField({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} color="#0f172a">
        {value || 'N/A'}
      </Typography>
    </Box>
  );
}

function GoodsIssueRow({
  gin,
  moduleConfig,
  serialNumber,
  wfInfo,
  workflowEnabled,
  onApprove,
  onIssue,
  onOpenDetails,
  onEdit,
  onDelete,
  onGatePass,
  onNoWorkflowWarning,
}) {
  const [generatingGatePass, setGeneratingGatePass] = useState(false);

  const handleGatePassClick = async (event) => {
    event.stopPropagation();
    setGeneratingGatePass(true);
    try {
      const blob = await pdf(
        <IssueDocumentChallanPDF
          documentData={gin}
          moduleConfig={moduleConfig}
          lineItems={getApprovalLineItems(gin)}
          docType="gate_pass"
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GatePass-${gin.gin_number || gin.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Gate Pass downloaded.');
    } catch {
      toast.error('Failed to generate Gate Pass.');
    } finally {
      setGeneratingGatePass(false);
    }
  };
  const statusChip = getStatusChipProps(gin.status);
  const showsIssueToField = moduleConfig.showIssueToField !== false;
  const usesWarehouseParties = moduleConfig.partySelectionMode === 'warehouse';
  const usesOfficeParties = moduleConfig.partySelectionMode === 'office';
  const isIssued = normalizeStatus(gin.status) === 'issued';
  const canApprove = workflowEnabled
    ? Boolean(wfInfo?.canApprove)
    : moduleConfig.showApproveAction && normalizeStatus(gin.status) === 'pending approval';
  const canIssue = workflowEnabled
    ? Boolean(wfInfo?.canIssue)
    : moduleConfig.showIssueAction && normalizeStatus(gin.status) === 'approved';
  const showNoWorkflowWarning =
    workflowEnabled && normalizeStatus(gin.status) === 'pending approval' && wfInfo?.noMatchWarning;
  const routingMeta = [gin.department, gin.project].filter(Boolean).join(' | ');

  return (
    <TableRow
      hover
      onClick={() => onOpenDetails(gin.id)}
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
            {gin.gin_number || 'Unnumbered issue'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {gin.purpose || 'Purpose not captured'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={600} color="#0f172a">
            {(usesWarehouseParties || usesOfficeParties) && showsIssueToField
              ? gin.issue_from || moduleConfig.issueFromFallback
              : showsIssueToField
                ? gin.issued_to || moduleConfig.issueToFallback
                : gin.issue_from || moduleConfig.issueFromFallback}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {(usesWarehouseParties || usesOfficeParties) && showsIssueToField
              ? routingMeta || moduleConfig.issueContextFallback
              : showsIssueToField
                ? `${gin.issue_from ? `From ${gin.issue_from}` : moduleConfig.issueFromFallback}${gin.department ? ` | ${gin.department}` : ''}${gin.project ? ` | ${gin.project}` : ''}`
                : routingMeta || moduleConfig.issueContextFallback}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#475569">
          {(usesWarehouseParties || usesOfficeParties) && showsIssueToField
            ? gin.issued_to || moduleConfig.issueToFallback
            : gin.warehouse_name || 'Warehouse not assigned'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#475569">
          {formatDate(gin.issue_date)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Stack spacing={0.25} alignItems="center">
          <Typography variant="body2" fontWeight={700} color="#0f172a">
            {gin.item_count || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Issued {Number(gin.issued_qty_total || 0).toLocaleString('en-BD')}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight={700} color="#0f172a">
          {formatCurrency(gin.total_value)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Stack spacing={0.75} alignItems="center">
          <Chip size="small" color={statusChip.color} label={statusChip.label} variant="soft" />
          {gin.status === 'Issued' && (
            <Button
              size="small"
              variant="contained"
              color="info"
              startIcon={
                generatingGatePass ? (
                  <CircularProgress size={13} color="inherit" />
                ) : (
                  <Iconify icon="solar:document-bold-duotone" width={14} />
                )
              }
              onClick={handleGatePassClick}
              disabled={generatingGatePass}
              sx={{ fontSize: 11, fontWeight: 700 }}
            >
              Gate Pass
            </Button>
          )}
        </Stack>
      </TableCell>
      <TableCell align="center">
        <Stack spacing={0.75} alignItems="center">
          {workflowEnabled && !isIssued ? <GinApprovalInfo wfInfo={wfInfo} /> : null}

          {isIssued ? (
            <Stack
              direction="row"
              spacing={0.75}
              justifyContent="center"
              flexWrap="wrap"
              useFlexGap
            >
              <Chip size="small" color="secondary" label="Issued" variant="soft" />
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<Iconify icon="solar:eye-bold" width={16} />}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenDetails(gin.id);
                }}
              >
                View
              </Button>
            </Stack>
          ) : (
            <Stack
              direction="row"
              spacing={0.75}
              justifyContent="center"
              flexWrap="wrap"
              useFlexGap
            >
              {showNoWorkflowWarning ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<Iconify icon="solar:danger-triangle-bold-duotone" width={14} />}
                  onClick={(event) => {
                    event.stopPropagation();
                    onNoWorkflowWarning();
                  }}
                  sx={{ fontSize: 11, fontWeight: 700 }}
                >
                  No Workflow
                </Button>
              ) : null}
              {canApprove ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<Iconify icon="solar:check-circle-bold" width={16} />}
                  onClick={(event) => {
                    event.stopPropagation();
                    onApprove(gin);
                  }}
                >
                  {moduleConfig.approveActionLabel}
                </Button>
              ) : null}
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<Iconify icon="solar:eye-bold" width={16} />}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenDetails(gin.id);
                }}
              >
                View
              </Button>
              {canIssue ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  startIcon={<Iconify icon="solar:delivery-bold" width={16} />}
                  onClick={(event) => {
                    event.stopPropagation();
                    onIssue(gin);
                  }}
                >
                  {moduleConfig.issueActionLabel || 'Issue'}
                </Button>
              ) : null}
              <IconButton
                size="small"
                color="primary"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(gin.id);
                }}
              >
                <Iconify icon="solar:pen-bold" width={18} />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(gin.id);
                }}
              >
                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
              </IconButton>
            </Stack>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function GoodsIssueNoteMain({ moduleKey = 'goodsIssueNote' }) {
  const router = useRouter();
  const { user } = useAuthContext();
  const moduleConfig = getIssueDocumentModuleConfig(moduleKey);
  const workflowEnabled = moduleConfig.showApproveAction;
  const showsIssueToField = moduleConfig.showIssueToField !== false;
  const usesWarehouseParties = moduleConfig.partySelectionMode === 'warehouse';
  const usesOfficeParties = moduleConfig.partySelectionMode === 'office';

  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [officeLocationFilter, setOfficeLocationFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [decisionDialog, setDecisionDialog] = useState(null);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 400);

  const ginListUrl = useMemo(
    () =>
      buildIssueDocumentQuery({
        baseEndpoint: moduleConfig.listEndpoint,
        search: debouncedSearch,
        status: statusFilter,
        department: departmentFilter,
        project: projectFilter,
        warehouse: usesOfficeParties ? undefined : warehouseFilter,
        office_location: usesOfficeParties ? officeLocationFilter : undefined,
        page,
        pagination: true,
      }),
    [
      debouncedSearch,
      departmentFilter,
      moduleConfig.listEndpoint,
      officeLocationFilter,
      page,
      projectFilter,
      statusFilter,
      usesOfficeParties,
      warehouseFilter,
    ]
  );

  const ginStatusSummaryUrl = useMemo(
    () =>
      buildIssueDocumentQuery({
        baseEndpoint: moduleConfig.listEndpoint,
        search: debouncedSearch,
        status: '',
        department: departmentFilter,
        project: projectFilter,
        warehouse: usesOfficeParties ? undefined : warehouseFilter,
        office_location: usesOfficeParties ? officeLocationFilter : undefined,
        page: 0,
        pagination: false,
      }),
    [
      debouncedSearch,
      departmentFilter,
      moduleConfig.listEndpoint,
      officeLocationFilter,
      projectFilter,
      usesOfficeParties,
      warehouseFilter,
    ]
  );

  const { data: rawGinList, loading: listLoading, error: listError } = useGetRequest(ginListUrl);
  const { data: rawGinStatusSummary } = useGetRequest(ginStatusSummaryUrl);
  const { data: rawWarehouses, loading: warehousesLoading } = useGetRequest(
    usesOfficeParties ? null : EP.warehouses
  );
  const { data: rawOfficeLocations, loading: officeLocationsLoading } = useGetRequest(
    usesOfficeParties ? PM.office_management : null
  );
  const { data: rawDepartments, loading: departmentsLoading } = useGetRequest(
    endpoints.settings.departments
  );
  const { data: rawProjects, loading: projectsLoading } = useGetRequest(
    endpoints.projectManagements.projects
  );
  const { data: rawWorkflow } = useGetRequest(workflowEnabled ? GIN_APPROVAL_WORKFLOW_URL : null);

  const rows = useMemo(() => normalizeCollection(rawGinList), [rawGinList]);
  const statusSummaryRows = useMemo(
    () => normalizeCollection(rawGinStatusSummary),
    [rawGinStatusSummary]
  );
  const warehouseOptions = useMemo(
    () =>
      [...normalizeCollection(rawWarehouses)].sort((left, right) =>
        String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawWarehouses]
  );
  const officeLocationOptions = useMemo(
    () =>
      [...normalizeCollection(rawOfficeLocations)].sort((left, right) =>
        String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawOfficeLocations]
  );
  const departmentOptions = useMemo(() => {
    const liveOptions = normalizeCollection(rawDepartments)
      .map((department) => String(department?.name || '').trim())
      .filter(Boolean);

    if (liveOptions.length) {
      return [...new Set(liveOptions)].sort((left, right) =>
        left.localeCompare(right, undefined, { sensitivity: 'base' })
      );
    }

    return getUniqueOptions(statusSummaryRows, 'department');
  }, [rawDepartments, statusSummaryRows]);
  const projectOptions = useMemo(() => {
    const liveOptions = normalizeCollection(rawProjects)
      .map((project) => String(getProjectLabel(project)).trim())
      .filter(Boolean);

    if (liveOptions.length) {
      return [...new Set(liveOptions)].sort((left, right) =>
        left.localeCompare(right, undefined, { sensitivity: 'base' })
      );
    }

    return getUniqueOptions(statusSummaryRows, 'project');
  }, [rawProjects, statusSummaryRows]);

  const totalPages = Math.max(1, Number(rawGinList?.total_pages || 1));
  const totalCount = Number(rawGinStatusSummary?.count || statusSummaryRows.length || 0);
  const summaryMetrics = useMemo(() => {
    const countByStatus = (status) =>
      statusSummaryRows.filter((row) => normalizeStatus(row.status) === normalizeStatus(status))
        .length;

    return {
      total: totalCount,
      draft: countByStatus('Draft'),
      pendingApproval: countByStatus('Pending Approval'),
      approved: countByStatus('Approved'),
      issued: countByStatus('Issued'),
      cancelled: countByStatus('Cancelled'),
    };
  }, [statusSummaryRows, totalCount]);

  const getTabCount = (statusValue) => {
    if (!statusValue) {
      return totalCount;
    }

    switch (normalizeStatus(statusValue)) {
      case 'draft':
        return summaryMetrics.draft;
      case 'pending approval':
        return summaryMetrics.pendingApproval;
      case 'approved':
        return summaryMetrics.approved;
      case 'issued':
        return summaryMetrics.issued;
      case 'cancelled':
        return summaryMetrics.cancelled;
      default:
        return 0;
    }
  };

  const canResetFilters = Boolean(
    searchQuery.trim() ||
    statusFilter ||
    departmentFilter ||
    projectFilter ||
    warehouseFilter ||
    officeLocationFilter ||
    page !== 0
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDepartmentFilter('');
    setProjectFilter('');
    setWarehouseFilter('');
    setOfficeLocationFilter('');
    setPage(0);
  };

  const handleCreate = () => {
    router.push(moduleConfig.createPath);
  };

  const handleEdit = (ginId) => {
    router.push(moduleConfig.editPath(ginId));
  };

  const handleDeleteRequest = (ginId) => {
    setDeleteId(ginId);
  };

  const handleApproveRequest = (gin) => {
    setDecisionDialog({
      mode: 'approve',
      target: gin,
      lineItems: createDecisionLineItems(gin),
    });
  };

  const handleNoWorkflowWarning = () => {
    toast.warning(NO_WORKFLOW_LEVEL_MESSAGE, {
      duration: 8000,
      description: 'Approval Workflow not configured',
    });
  };

  const handleIssueRequest = (gin) => {
    setDecisionDialog({
      mode: 'issue',
      target: gin,
      lineItems: createDecisionLineItems(gin),
      transport: {
        transport_person: '',
        transport_phone: '',
        transport_address: '',
        vehicle_number: '',
        dispatch_date: null,
      },
    });
  };

  const handleTransportChange = (field, value) => {
    setDecisionDialog((prev) => ({
      ...prev,
      transport: { ...prev.transport, [field]: value },
    }));
  };

  const handleDecisionLineItemChange = (localId, value) => {
    setDecisionDialog((current) => {
      if (!current || current.mode !== 'approve') {
        return current;
      }

      return {
        ...current,
        lineItems: current.lineItems.map((line) => {
          if (line.localId !== localId) {
            return line;
          }

          const maxIssuedQty = Number(line.item_current_quantity || 0);
          const nextIssuedQty = Number(value || 0);

          if (value !== '' && maxIssuedQty > 0 && nextIssuedQty > maxIssuedQty) {
            toast.error('Issued quantity must be under the current stock for the selected item.');
            return line;
          }

          return {
            ...line,
            issued_qty: value,
            requested_qty: value,
          };
        }),
      };
    });
  };

  const handleDecision = async (nextStatus) => {
    if (!decisionDialog?.target?.id) {
      return;
    }

    const normalizedLineItems =
      nextStatus === 'Approved' ? normalizeDecisionLineItems(decisionDialog.lineItems) : null;

    if (nextStatus === 'Approved' && !normalizedLineItems) {
      return;
    }

    setDecisionSubmitting(true);

    try {
      if (nextStatus === 'Approved' && workflowEnabled) {
        await axiosInstance.post(EP.gin_approve(decisionDialog.target.id), {
          line_items: normalizedLineItems,
        });
      } else if (nextStatus === 'Issued' && workflowEnabled && decisionDialog.transport) {
        const t = decisionDialog.transport;
        await axiosInstance.post(EP.gin_issue(decisionDialog.target.id), {
          transport_person: t.transport_person || null,
          transport_phone: t.transport_phone || null,
          transport_address: t.transport_address || null,
          vehicle_number: t.vehicle_number || null,
          dispatch_date: t.dispatch_date ? dayjs(t.dispatch_date).format('YYYY-MM-DD') : null,
        });
      } else {
        const payload = {
          status: nextStatus,
        };

        if (nextStatus === 'Approved') {
          payload.approval_level = Number(
            decisionDialog.target.total_levels || decisionDialog.target.approval_level || 0
          );
          payload.line_items = normalizedLineItems;
        }

        if (nextStatus === 'Issued' && decisionDialog.transport) {
          const t = decisionDialog.transport;
          payload.transport_person = t.transport_person || null;
          payload.transport_phone = t.transport_phone || null;
          payload.transport_address = t.transport_address || null;
          payload.vehicle_number = t.vehicle_number || null;
          payload.dispatch_date = t.dispatch_date
            ? dayjs(t.dispatch_date).format('YYYY-MM-DD')
            : null;
        }

        await patchRequest(moduleConfig.detailEndpoint(decisionDialog.target.id), payload);
      }

      toast.success(
        nextStatus === 'Approved'
          ? moduleConfig.approvedToast
          : nextStatus === 'Issued'
            ? moduleConfig.issuedToast || `${moduleConfig.singularTitle} marked as issued.`
            : `${moduleConfig.singularTitle} marked as cancelled.`
      );

      await Promise.all([
        mutate(ginListUrl),
        mutate(ginStatusSummaryUrl),
        mutate(moduleConfig.detailEndpoint(decisionDialog.target.id)),
        revalidateInventoryLogInsights(),
      ]);

      setDecisionDialog(null);
    } catch (error) {
      const fallbackMessage =
        nextStatus === 'Approved'
          ? moduleConfig.approveError
          : nextStatus === 'Issued'
            ? moduleConfig.issueError ||
              `Failed to mark the selected ${moduleConfig.recordSingular} as issued.`
            : `Failed to mark the selected ${moduleConfig.recordSingular} as cancelled.`;

      toast.error(extractErrorMessage(error?.response?.data || error) || fallbackMessage);
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const decisionTarget = decisionDialog?.target || null;
  const decisionLineItems = useMemo(() => decisionDialog?.lineItems || [], [decisionDialog]);
  const isIssueDialog = decisionDialog?.mode === 'issue';
  const decisionMetrics = useMemo(
    () => ({
      items: decisionLineItems.length,
      totalValue: decisionLineItems.reduce(
        (total, line) => total + Number(line.issued_qty || 0) * Number(line.unit_price || 0),
        0
      ),
    }),
    [decisionLineItems]
  );
  const decisionWorkflowInfo = useMemo(
    () =>
      workflowEnabled && decisionTarget
        ? computeGinWorkflowInfo(decisionTarget, rawWorkflow, user?.email)
        : null,
    [workflowEnabled, decisionTarget, rawWorkflow, user?.email]
  );

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    try {
      await deleteRequest(moduleConfig.detailEndpoint(deleteId));
      toast.success(moduleConfig.deletedToast);
      await Promise.all([
        mutate(ginListUrl),
        mutate(ginStatusSummaryUrl),
        revalidateInventoryLogInsights(),
      ]);
      setDeleteId(null);
    } catch (error) {
      toast.error(moduleConfig.deleteError);
    }
  };

  const openDetails = (ginId) => {
    router.push(moduleConfig.detailPath(ginId));
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
              {moduleConfig.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {moduleConfig.pageDescription}
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
              {moduleConfig.createLabel}
            </Button>
          </Stack>
        </Stack>

        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {moduleConfig.listInfo}
        </Alert>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title={moduleConfig.filteredSummaryTitle}
              value={summaryMetrics.total}
              icon="solar:box-minimalistic-bold-duotone"
              bgcolor="#1d4ed8"
              boxShadow="0 4px 20px rgba(29, 78, 216, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Pending Approval"
              value={summaryMetrics.pendingApproval}
              icon="solar:clock-circle-bold-duotone"
              bgcolor="#d97706"
              boxShadow="0 4px 20px rgba(217, 119, 6, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Approved"
              value={summaryMetrics.approved}
              icon="solar:check-circle-bold-duotone"
              bgcolor="#059669"
              boxShadow="0 4px 20px rgba(5, 150, 105, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Issued"
              value={summaryMetrics.issued}
              icon="solar:delivery-bold-duotone"
              bgcolor="#7c3aed"
              boxShadow="0 4px 20px rgba(124, 58, 237, 0.28)"
            />
          </Grid>
        </Grid>

        <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb' }}>
          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={moduleConfig.searchPlaceholder}
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
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Department"
                  value={departmentFilter}
                  onChange={(event) => {
                    setDepartmentFilter(event.target.value);
                    setPage(0);
                  }}
                  disabled={departmentsLoading}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {departmentOptions.map((department) => (
                    <MenuItem key={department} value={department}>
                      {department}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Project"
                  value={projectFilter}
                  onChange={(event) => {
                    setProjectFilter(event.target.value);
                    setPage(0);
                  }}
                  disabled={projectsLoading}
                >
                  <MenuItem value="">All Projects</MenuItem>
                  {projectOptions.map((project) => (
                    <MenuItem key={project} value={project}>
                      {project}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {!usesOfficeParties && (
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Warehouse"
                    value={warehouseFilter}
                    onChange={(event) => {
                      setWarehouseFilter(event.target.value);
                      setPage(0);
                    }}
                    disabled={warehousesLoading}
                  >
                    <MenuItem value="">All Warehouses</MenuItem>
                    {warehouseOptions.map((warehouse) => (
                      <MenuItem key={warehouse.id} value={String(warehouse.id)}>
                        {warehouse.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
              {usesOfficeParties && (
                <Grid size={{ xs: 12, md: 2 }}>
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
                    disabled={officeLocationsLoading}
                  >
                    <MenuItem value="">All Locations</MenuItem>
                    {officeLocationOptions.map((loc) => (
                      <MenuItem key={loc.id} value={String(loc.id)}>
                        {loc.name}
                        {loc.type ? ` (${loc.type})` : ''}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
            </Grid>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.25 }}>
                Filter by Status
              </Typography>
              <Tabs
                value={statusFilter}
                onChange={(event, value) => {
                  setStatusFilter(value);
                  setPage(0);
                }}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 44,
                  '& .MuiTabs-indicator': { display: 'none' },
                  '& .MuiTab-root': {
                    minHeight: 44,
                    mr: 1,
                    borderRadius: 99,
                    border: '1px solid #e2e8f0',
                    color: 'text.secondary',
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 2,
                  },
                  '& .Mui-selected': {
                    bgcolor: '#0f172a',
                    color: '#ffffff !important',
                    borderColor: '#0f172a',
                  },
                }}
              >
                {STATUS_TABS.map((option) => (
                  <Tab
                    key={option.value || 'all'}
                    value={option.value}
                    label={`${option.label} (${getTabCount(option.value)})`}
                  />
                ))}
              </Tabs>
            </Box>
          </Stack>
        </Card>

        {listError && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {moduleConfig.loadError}
          </Alert>
        )}

        <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <TableContainer>
            <Table size={dense ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell align="center" sx={{ width: 56 }}>
                    #
                  </TableCell>
                  <TableCell>Issue</TableCell>
                  <TableCell>
                    {(usesWarehouseParties || usesOfficeParties) && showsIssueToField
                      ? moduleConfig.issueFromLabel
                      : moduleConfig.issueColumnLabel}
                  </TableCell>
                  <TableCell>
                    {(usesWarehouseParties || usesOfficeParties) && showsIssueToField
                      ? moduleConfig.issueToLabel
                      : 'Warehouse'}
                  </TableCell>
                  <TableCell>Issue Date</TableCell>
                  <TableCell align="center">Items</TableCell>
                  <TableCell align="right">Total Value</TableCell>
                  <TableCell align="center">Status</TableCell>
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
                          { type: 'text', lines: 2, width: 150 },
                          { type: 'text', lines: 2, width: 160 },
                          { type: 'text', width: 120 },
                          { type: 'text', width: 90 },
                          { type: 'text', width: 60, align: 'center' },
                          { type: 'text', width: 90, align: 'right' },
                          { type: 'rect', width: 120, height: 28, align: 'center' },
                          { type: 'text', width: 48, align: 'center' },
                        ]}
                      />
                    ))
                  : rows.map((gin, index) => (
                      <GoodsIssueRow
                        key={gin.id}
                        gin={gin}
                        moduleConfig={moduleConfig}
                        serialNumber={page * 10 + index + 1}
                        workflowEnabled={workflowEnabled}
                        wfInfo={
                          workflowEnabled
                            ? computeGinWorkflowInfo(gin, rawWorkflow, user?.email)
                            : null
                        }
                        onApprove={handleApproveRequest}
                        onIssue={handleIssueRequest}
                        onOpenDetails={openDetails}
                        onEdit={handleEdit}
                        onDelete={handleDeleteRequest}
                        onNoWorkflowWarning={handleNoWorkflowWarning}
                      />
                    ))}

                {!listLoading && !rows.length && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <Stack spacing={2} alignItems="center">
                        <Iconify
                          icon="solar:delivery-line-duotone"
                          width={56}
                          sx={{ color: '#cbd5e1' }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          {moduleConfig.emptyTitle}
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                          {moduleConfig.emptyDescription}
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
            sx={{ px: 2.5, py: 2 }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <FormControlLabel
                control={
                  <Switch checked={dense} onChange={(event) => setDense(event.target.checked)} />
                }
                label="Dense"
              />
              <Typography variant="body2" color="text.secondary">
                {totalCount}{' '}
                {totalCount === 1 ? moduleConfig.recordSingular : moduleConfig.recordPlural} matched
              </Typography>
            </Stack>

            <Pagination
              color="primary"
              shape="rounded"
              count={totalPages}
              page={page + 1}
              onChange={(event, value) => setPage(value - 1)}
            />
          </Stack>
        </Card>
      </Stack>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title={moduleConfig.deleteTitle}
        content={moduleConfig.deleteContent}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />

      <ConfirmDialog
        open={Boolean(decisionDialog)}
        onClose={() => {
          if (!decisionSubmitting) {
            setDecisionDialog(null);
          }
        }}
        title={
          isIssueDialog
            ? moduleConfig.issueDialogTitle || `Issue ${moduleConfig.singularTitle}`
            : moduleConfig.approveDialogTitle
        }
        maxWidth="md"
        cancelLabel="Back"
        content={
          decisionTarget ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {isIssueDialog
                  ? moduleConfig.issueDialogDescription ||
                    `Review the ${moduleConfig.recordSingular} below, then confirm whether it should be marked as issued.`
                  : moduleConfig.approveDialogDescription}
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ApprovalDetailField label="Issue Number" value={decisionTarget.gin_number} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ApprovalDetailField label="Status" value={decisionTarget.status} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ApprovalDetailField
                    label={moduleConfig.issueFromLabel}
                    value={decisionTarget.issue_from || moduleConfig.issueFromFallback}
                  />
                </Grid>
                {showsIssueToField ? (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <ApprovalDetailField
                      label={moduleConfig.issueToLabel}
                      value={decisionTarget.issued_to || moduleConfig.issueToFallback}
                    />
                  </Grid>
                ) : (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <ApprovalDetailField
                      label="Department / Project"
                      value={
                        [decisionTarget.department, decisionTarget.project]
                          .filter(Boolean)
                          .join(' | ') || moduleConfig.issueContextFallback
                      }
                    />
                  </Grid>
                )}
                {!usesOfficeParties && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <ApprovalDetailField
                      label="Warehouse"
                      value={decisionTarget.warehouse_name || 'Warehouse not assigned'}
                    />
                  </Grid>
                )}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ApprovalDetailField
                    label="Issue Date"
                    value={formatDate(decisionTarget.issue_date)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ApprovalDetailField
                    label="Items"
                    value={String(decisionMetrics.items || decisionTarget.item_count || 0)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ApprovalDetailField
                    label="Total Value"
                    value={formatCurrency(decisionMetrics.totalValue || decisionTarget.total_value)}
                  />
                </Grid>
              </Grid>

              {workflowEnabled && decisionWorkflowInfo ? (
                <GinApprovalSummary wfInfo={decisionWorkflowInfo} />
              ) : null}

              <Divider />

              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Line Items
                </Typography>
                <Stack spacing={1}>
                  {decisionLineItems.length ? (
                    decisionLineItems.map((line) => (
                      <Stack
                        key={line.localId}
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        spacing={1.5}
                        sx={{
                          px: 1.5,
                          py: 1.25,
                          borderRadius: 1.5,
                          bgcolor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600} color="#0f172a">
                            {line.product_name || line.item_name || 'Unknown item'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {line.item_code || 'No code'}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.25 }}
                          >
                            Current stock{' '}
                            {Number(line.item_current_quantity || 0).toLocaleString('en-BD')}{' '}
                            {line.unit || ''}
                          </Typography>
                        </Box>

                        {isIssueDialog ? (
                          <Typography variant="body2" color="text.secondary">
                            Issued {Number(line.issued_qty || 0).toLocaleString('en-BD')}{' '}
                            {line.unit || ''}
                          </Typography>
                        ) : (
                          <TextField
                            size="small"
                            type="number"
                            label="Issued Qty"
                            value={line.issued_qty}
                            onChange={(event) =>
                              handleDecisionLineItemChange(line.localId, event.target.value)
                            }
                            inputProps={{
                              min: 0,
                              max: Number(line.item_current_quantity || 0) || undefined,
                              step: 'any',
                            }}
                            helperText={`Max ${Number(line.item_current_quantity || 0).toLocaleString('en-BD')} ${line.unit || ''}`}
                            sx={{ minWidth: { xs: '100%', sm: 180 } }}
                          />
                        )}
                      </Stack>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No line items were attached to this issue.
                    </Typography>
                  )}
                </Stack>
              </Box>

              {isIssueDialog && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                      Transport / Dispatch Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Transport Person / Courier Name"
                          required
                          value={decisionDialog?.transport?.transport_person || ''}
                          onChange={(e) =>
                            handleTransportChange('transport_person', e.target.value)
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Phone Number"
                          required
                          value={decisionDialog?.transport?.transport_phone || ''}
                          onChange={(e) => handleTransportChange('transport_phone', e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <DatePicker
                          label="Dispatch Date *"
                          value={
                            decisionDialog?.transport?.dispatch_date
                              ? dayjs(decisionDialog.transport.dispatch_date)
                              : null
                          }
                          onChange={(val) => handleTransportChange('dispatch_date', val)}
                          slotProps={{ textField: { size: 'small', fullWidth: true } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Vehicle Number (optional)"
                          value={decisionDialog?.transport?.vehicle_number || ''}
                          onChange={(e) => handleTransportChange('vehicle_number', e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Delivery Address"
                          multiline
                          rows={2}
                          value={decisionDialog?.transport?.transport_address || ''}
                          onChange={(e) =>
                            handleTransportChange('transport_address', e.target.value)
                          }
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}
            </Stack>
          ) : null
        }
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
            {isIssueDialog ? (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleDecision('Cancelled')}
                  disabled={decisionSubmitting}
                >
                  {decisionSubmitting ? 'Saving...' : 'Not Issued'}
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => handleDecision('Issued')}
                  disabled={
                    decisionSubmitting ||
                    !decisionDialog?.transport?.transport_person?.trim() ||
                    !decisionDialog?.transport?.transport_phone?.trim() ||
                    !decisionDialog?.transport?.dispatch_date
                  }
                >
                  {decisionSubmitting ? 'Saving...' : 'Issued'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleDecision('Cancelled')}
                  disabled={decisionSubmitting}
                >
                  {decisionSubmitting ? 'Saving...' : 'Not Approved'}
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleDecision('Approved')}
                  disabled={decisionSubmitting}
                >
                  {decisionSubmitting ? 'Saving...' : 'Confirm'}
                </Button>
              </>
            )}
          </Stack>
        }
      />
    </Box>
  );
}
