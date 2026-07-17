'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState, useEffect } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Grid,
  Card,
  Chip,
  Alert,
  Paper,
  Stack,
  Button,
  Dialog,
  Divider,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  usePatchRequest as patchRequest,
  useCreateRequest as createRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

import { getIssueDocumentModuleConfig } from './issue-document-module-config';
import { revalidateInventoryLogInsights } from '../inventory-log/inventory-log-utils';

const EP = endpoints.storeInventory;

const STATUS_OPTIONS = ['Draft', 'Pending Approval', 'Approved', 'Issued', 'Cancelled'];

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

function getUserLabel(user) {
  return user?.username || '';
}

function getDepartmentLabel(department) {
  return department?.name || '';
}

function getProjectLabel(project) {
  return project?.title || project?.short_name || project?.code || project?.name || '';
}

function getWarehouseOptionLabel(warehouse) {
  return warehouse?.name || '';
}

function getOfficeLabel(office) {
  return office?.name || '';
}

function normalizeCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.results) ? payload.results : [];
}

function createLocalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyLineItem() {
  return {
    localId: createLocalId(),
    product: '',
    item_code: '',
    item_name: '',
    requested_qty: '',
    issued_qty: '',
    unit: '',
    unit_price: '',
    current_stock: '',
    remarks: '',
  };
}

function createDefaultFormValues() {
  return {
    issue_date: new Date().toISOString().split('T')[0],
    issued_to: '',
    issue_from: '',
    department: '',
    project: '',
    project_id: '',
    purpose: '',
    warehouse: '',
    status: 'Draft',
    requested_by: '',
    approved_by: '',
    approval_level: 0,
    total_levels: 2,
    line_items: [createEmptyLineItem()],
  };
}

function mapGinToFormValues(gin) {
  return {
    issue_date: gin?.issue_date || new Date().toISOString().split('T')[0],
    issued_to: gin?.issued_to || '',
    issue_from: gin?.issue_from || '',
    department: gin?.department || '',
    project: gin?.project || '',
    project_id:
      gin?.project_fk !== undefined && gin?.project_fk !== null ? String(gin.project_fk) : '',
    purpose: gin?.purpose || '',
    warehouse: gin?.warehouse ? String(gin.warehouse) : '',
    status: gin?.status || 'Draft',
    requested_by: gin?.requested_by ? String(gin.requested_by) : '',
    approved_by: gin?.approved_by ? String(gin.approved_by) : '',
    approval_level: gin?.approval_level ?? 0,
    total_levels: gin?.total_levels ?? 2,
    line_items:
      gin?.line_items?.length > 0
        ? gin.line_items.map((line) => ({
            localId: createLocalId(),
            product: line.product ? String(line.product) : '',
            item_code: line.item_code || '',
            item_name: line.item_name || line.product_name || '',
            requested_qty: line.requested_qty ?? '',
            issued_qty: line.issued_qty ?? '',
            unit: line.unit || '',
            unit_price: line.unit_price ?? '',
            current_stock: '',
            remarks: line.remarks || '',
          }))
        : [createEmptyLineItem()],
  };
}

function buildPayload(formValues) {
  return {
    issue_date: formValues.issue_date,
    issued_to: formValues.issued_to.trim() || null,
    issue_from: formValues.issue_from.trim() || null,
    department: formValues.department.trim() || null,
    project: formValues.project.trim() || null,
    project_fk: formValues.project_id ? Number(formValues.project_id) : null,
    purpose: formValues.purpose.trim() || null,
    warehouse: formValues.warehouse || null,
    office_location: formValues.office_location || null,
    status: formValues.status,
    requested_by: formValues.requested_by || null,
    approved_by: formValues.approved_by || null,
    approval_level: Number(formValues.approval_level || 0),
    total_levels: Number(formValues.total_levels || 1),
    line_items: formValues.line_items.map((line) => ({
      product: Number(line.product),
      item_code: line.item_code.trim(),
      item_name: line.item_name.trim(),
      requested_qty: Number(line.issued_qty || line.requested_qty || 0),
      issued_qty: Number(line.issued_qty || 0),
      unit: line.unit.trim(),
      unit_price: Number(line.unit_price || 0),
      remarks: line.remarks?.trim() || null,
    })),
  };
}

function ReviewField({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} color="text.primary">
        {value || 'Not provided'}
      </Typography>
    </Box>
  );
}

export default function IssueDocumentFormPage({ mode = 'create', moduleKey = 'goodsIssueNote' }) {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  const { user: authUser } = useAuthContext();

  const isEdit = mode === 'edit';
  const moduleConfig = getIssueDocumentModuleConfig(moduleKey);
  const documentId = moduleConfig.paramKeys
    .map((key) => {
      const value = params?.[key];
      return Array.isArray(value) ? value[0] : value;
    })
    .find(Boolean);

  const detailUrl = isEdit && documentId ? moduleConfig.detailEndpoint(documentId) : null;

  const { data: document, loading: detailLoading, error: detailError } = useGetRequest(detailUrl);
  const { data: rawWarehouses, loading: warehousesLoading } = useGetRequest(EP.warehouses);
  const { data: rawOffices, loading: officesLoading } = useGetRequest(
    `${endpoints.procurement_management.office_management}?pagination=false`
  );
  const { data: rawUsers, loading: usersLoading } = useGetRequest(endpoints.auth.simpleUsers);
  const { data: rawDepartments, loading: departmentsLoading } = useGetRequest(
    endpoints.settings.departments
  );
  const { data: rawProjects, loading: projectsLoading } = useGetRequest(
    endpoints.projectManagements.projects
  );
  const allowedStatusOptions = STATUS_OPTIONS;

  const warehouseOptions = useMemo(
    () =>
      [...normalizeCollection(rawWarehouses)].sort((left, right) =>
        String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawWarehouses]
  );

  const officeOptions = useMemo(
    () =>
      [...normalizeCollection(rawOffices)].sort((left, right) =>
        String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawOffices]
  );

  const userOptions = useMemo(
    () =>
      [...normalizeCollection(rawUsers)]
        .filter((item) => getUserLabel(item))
        .sort((left, right) =>
          getUserLabel(left).localeCompare(getUserLabel(right), undefined, {
            sensitivity: 'base',
          })
        ),
    [rawUsers]
  );

  const departmentOptions = useMemo(
    () =>
      [...normalizeCollection(rawDepartments)]
        .filter((item) => getDepartmentLabel(item))
        .sort((left, right) =>
          getDepartmentLabel(left).localeCompare(getDepartmentLabel(right), undefined, {
            sensitivity: 'base',
          })
        ),
    [rawDepartments]
  );

  const projectOptions = useMemo(
    () =>
      [...normalizeCollection(rawProjects)]
        .filter((item) => getProjectLabel(item))
        .sort((left, right) =>
          getProjectLabel(left).localeCompare(getProjectLabel(right), undefined, {
            sensitivity: 'base',
          })
        ),
    [rawProjects]
  );

  const [issueFromOfficeId, setIssueFromOfficeId] = useState('');

  const usesWarehouseParties = moduleConfig.partySelectionMode === 'warehouse';
  const usesOfficeParties = moduleConfig.partySelectionMode === 'office';

  const itemsFetchUrl = useMemo(() => {
    if (usesOfficeParties) {
      return issueFromOfficeId
        ? `${EP.items}?office_id=${issueFromOfficeId}&pagination=false`
        : null;
    }
    return EP.items;
  }, [usesOfficeParties, issueFromOfficeId]);

  const { data: rawItems, loading: itemsLoading } = useGetRequest(itemsFetchUrl);

  const itemOptions = useMemo(
    () =>
      [...normalizeCollection(rawItems)].sort((left, right) =>
        String(left?.item_name || '').localeCompare(String(right?.item_name || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawItems]
  );

  const [formValues, setFormValues] = useState(createDefaultFormValues);

  const selectedProductIds = useMemo(
    () => new Set(formValues.line_items.map((l) => String(l.product)).filter(Boolean)),
    [formValues.line_items]
  );

  const [submitting, setSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const usesProjectIssueTo = moduleConfig.issueToSource === 'project';
  const showsIssueToField = moduleConfig.showIssueToField !== false;

  const issueFromOptionPool = usesOfficeParties
    ? officeOptions
    : usesWarehouseParties
      ? warehouseOptions
      : userOptions;
  const getIssueFromLabel = (option) =>
    usesOfficeParties
      ? getOfficeLabel(option)
      : usesWarehouseParties
        ? getWarehouseOptionLabel(option)
        : getUserLabel(option);
  const issueFromLoading = usesOfficeParties
    ? officesLoading
    : usesWarehouseParties
      ? warehousesLoading
      : usersLoading;

  const issueToOptionPool = usesProjectIssueTo
    ? projectOptions
    : usesWarehouseParties
      ? warehouseOptions
      : userOptions;
  const getIssueToLabel = (option) =>
    usesProjectIssueTo
      ? getProjectLabel(option)
      : usesWarehouseParties
        ? getWarehouseOptionLabel(option)
        : getUserLabel(option);
  const issueToLoading = usesProjectIssueTo
    ? projectsLoading
    : usesWarehouseParties
      ? warehousesLoading
      : usersLoading;

  useEffect(() => {
    if (!isEdit) {
      setFormValues(createDefaultFormValues());
      setIssueFromOfficeId('');
      setShowReview(false);
    }
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit || !document?.id || !officeOptions.length) {
      return;
    }

    const nextValues = mapGinToFormValues(document);

    setFormValues({
      ...nextValues,
      issued_to: showsIssueToField ? nextValues.issued_to : '',
    });

    if (usesOfficeParties) {
      // Prefer the FK id directly (for GINs that already have office_location set);
      // fall back to name matching for legacy GINs where only issue_from text was saved.
      if (document?.office_location) {
        setIssueFromOfficeId(String(document.office_location));
      } else if (nextValues.issue_from) {
        const matched = officeOptions.find(
          (o) => getOfficeLabel(o).toLowerCase() === nextValues.issue_from.toLowerCase()
        );
        if (matched) setIssueFromOfficeId(String(matched.id));
      }
    }
  }, [document, isEdit, showsIssueToField, usesOfficeParties, officeOptions]);

  const issueToOptions = useMemo(
    () =>
      issueToOptionPool.filter(
        (option) =>
          !usesWarehouseParties || getWarehouseOptionLabel(option) !== formValues.issue_from
      ),
    [formValues.issue_from, issueToOptionPool, usesWarehouseParties]
  );

  const issueFromOptions = useMemo(
    () =>
      issueFromOptionPool.filter(
        (option) =>
          !usesWarehouseParties ||
          !showsIssueToField ||
          getWarehouseOptionLabel(option) !== formValues.issued_to
      ),
    [formValues.issued_to, issueFromOptionPool, showsIssueToField, usesWarehouseParties]
  );

  const issuedToHasLiveOption = issueToOptionPool.some(
    (item) => getIssueToLabel(item) === formValues.issued_to
  );
  const issueFromHasLiveOption = issueFromOptionPool.some(
    (item) => getIssueFromLabel(item) === formValues.issue_from
  );
  const departmentHasLiveOption = departmentOptions.some(
    (item) => getDepartmentLabel(item) === formValues.department
  );
  const projectHasLiveOption = projectOptions.some(
    (item) => getProjectLabel(item) === formValues.project
  );

  const getWarehouseIdByName = (warehouseName) => {
    const normalizedWarehouseName = String(warehouseName || '')
      .trim()
      .toLowerCase();

    if (!normalizedWarehouseName) {
      return '';
    }

    const matchedWarehouse = warehouseOptions.find(
      (warehouse) =>
        getWarehouseOptionLabel(warehouse).trim().toLowerCase() === normalizedWarehouseName
    );

    return matchedWarehouse ? String(matchedWarehouse.id) : '';
  };

  const itemOptionsById = useMemo(
    () => new Map(itemOptions.map((item) => [String(item.id), item])),
    [itemOptions]
  );

  const getUserNameById = (userId) => {
    const matchedUser = userOptions.find((user) => String(user.id) === String(userId));

    return getUserLabel(matchedUser) || '';
  };

  const validateDocument = () => {
    if (!formValues.issue_date) {
      toast.error('Issue date is required.');
      return false;
    }

    if (Number(formValues.total_levels || 0) <= 0) {
      toast.error('Total approval steps must be greater than zero.');
      return false;
    }

    if (Number(formValues.approval_level || 0) < 0) {
      toast.error('Approval level cannot be negative.');
      return false;
    }

    if (Number(formValues.approval_level || 0) > Number(formValues.total_levels || 0)) {
      toast.error('Approval level cannot exceed the total approval steps.');
      return false;
    }

    return true;
  };

  const getNormalizedLineItems = () => {
    const validLineItems = formValues.line_items.filter((line) =>
      String(line.product || '').trim()
    );

    if (!validLineItems.length) {
      toast.error('Add at least one stock item.');
      return null;
    }

    const normalizedLineItems = validLineItems.map((line) => {
      const selectedItem = itemOptionsById.get(String(line.product));
      const issuedQty = Number(line.issued_qty || 0);
      const currentStock = Number(line.current_stock || selectedItem?.current_stock || 0);

      return {
        ...line,
        item_code: String(line.item_code || selectedItem?.item_code || '').trim(),
        item_name: String(line.item_name || selectedItem?.item_name || '').trim(),
        requested_qty: issuedQty,
        issued_qty: issuedQty,
        unit: String(line.unit || selectedItem?.unit || '').trim(),
        unit_price: Number(line.unit_price || selectedItem?.unit_price || 0),
        current_stock: currentStock,
      };
    });

    const incompleteProducts = normalizedLineItems.some(
      (line) => !line.item_code || !line.item_name || !line.unit
    );

    if (incompleteProducts) {
      toast.error('Each selected item must resolve to code, name, and unit before review.');
      return null;
    }

    const invalidQuantities = normalizedLineItems.some((line) => Number(line.issued_qty || 0) <= 0);

    if (invalidQuantities) {
      toast.error('Issued quantity must be greater than zero.');
      return null;
    }

    // const exceedsStock = normalizedLineItems.find(
    //   (line) => Number(line.issued_qty || 0) > Number(line.current_stock || 0)
    // );

    // if (exceedsStock) {
    //   toast.error('Issued quantity must be under the current stock for the selected item.');
    //   return null;
    // }

    return normalizedLineItems;
  };

  const reviewLineItems = useMemo(
    () =>
      formValues.line_items
        .filter((line) => String(line.product || '').trim())
        .map((line) => {
          const selectedItem = itemOptionsById.get(String(line.product));
          const issuedQty = Number(line.issued_qty || 0);
          const unitPrice = Number(line.unit_price || selectedItem?.unit_price || 0);

          return {
            localId: line.localId,
            productName: line.item_name || selectedItem?.item_name || 'Unknown item',
            unit: line.unit || selectedItem?.unit || 'N/A',
            issuedQty,
            unitPrice,
            remarks: line.remarks?.trim() || 'No remarks',
            lineTotal: issuedQty * unitPrice,
          };
        }),
    [formValues.line_items, itemOptionsById]
  );

  const reviewTotals = useMemo(
    () => ({
      items: reviewLineItems.length,
      quantity: reviewLineItems.reduce((total, line) => total + Number(line.issuedQty || 0), 0),
      value: reviewLineItems.reduce((total, line) => total + Number(line.lineTotal || 0), 0),
    }),
    [reviewLineItems]
  );

  const returnPath =
    isEdit && documentId ? moduleConfig.detailPath(documentId) : moduleConfig.listPath;

  const formHeading = isEdit
    ? `Edit ${moduleConfig.singularTitle}`
    : `Create ${moduleConfig.singularTitle}`;

  const formDescription = isEdit
    ? 'Update the issue context, approval routing, and line items on a dedicated page instead of a dialog.'
    : 'Capture a new issue document on a dedicated page, then return to the list after save.';

  const contextDescription = usesOfficeParties
    ? isEdit
      ? 'Link this record to an issuing office/warehouse, destination project, department, and current workflow status.'
      : 'Link this record to an issuing office/warehouse, destination project, and department before choosing draft or pending in the overview step.'
    : usesWarehouseParties
      ? isEdit
        ? showsIssueToField
          ? 'Link this record to an issue-from warehouse, issue-to warehouse, department, project, and current workflow status.'
          : 'Link this record to an issue-from warehouse, department, project, and current workflow status.'
        : showsIssueToField
          ? 'Link this record to an issue-from warehouse, issue-to warehouse, department, and project before choosing draft or pending in the overview step.'
          : 'Link this record to an issue-from warehouse, department, and project before choosing draft or pending in the overview step.'
      : isEdit
        ? 'Link this record to an origin, recipient, department, project, warehouse, and current workflow status.'
        : 'Link this record to an origin, recipient, department, project, and warehouse context before choosing draft or pending in the overview step.';

  const handleFieldChange = (field, value) => {
    if (!isEdit && showReview) {
      setShowReview(false);
    }

    setFormValues((current) => {
      const nextValues = { ...current, [field]: value };

      if (usesWarehouseParties && field === 'issue_from') {
        nextValues.warehouse = getWarehouseIdByName(value) || '';
      }

      if (usesOfficeParties && field === 'issue_from') {
        const matched = officeOptions.find(
          (o) => getOfficeLabel(o).toLowerCase() === String(value || '').toLowerCase()
        );
        setIssueFromOfficeId(matched ? String(matched.id) : '');
        nextValues.line_items = [createEmptyLineItem()];
      }

      if (
        showsIssueToField &&
        usesWarehouseParties &&
        field === 'issue_from' &&
        value &&
        value === current.issued_to
      ) {
        nextValues.issued_to = '';
      }

      if (
        showsIssueToField &&
        usesWarehouseParties &&
        field === 'issued_to' &&
        value &&
        value === current.issue_from
      ) {
        nextValues.issue_from = '';
        nextValues.warehouse = '';
      }

      // When the project-mode "Issued To" field changes, keep project name + id in sync
      if (usesProjectIssueTo && field === 'issued_to') {
        nextValues.project = value;
        const selectedOption = issueToOptions.find((opt) => getIssueToLabel(opt) === value);
        nextValues.project_id = selectedOption ? String(selectedOption.id) : '';
      }

      return nextValues;
    });
  };

  const handleLineItemChange = (localId, field, value) => {
    if (!isEdit && showReview) {
      setShowReview(false);
    }

    setFormValues((current) => ({
      ...current,
      line_items: current.line_items.map((line) => {
        if (line.localId !== localId) {
          return line;
        }

        const updatedLine = { ...line, [field]: value };

        if (field === 'product') {
          const selectedItem = itemOptionsById.get(String(value));

          if (selectedItem) {
            updatedLine.item_code = selectedItem.item_code || '';
            updatedLine.item_name = selectedItem.item_name || '';
            updatedLine.unit = selectedItem.unit || '';
            updatedLine.unit_price = selectedItem.unit_price || '';
            const onHand = selectedItem.current_stock ?? selectedItem.on_hand ?? '';
            updatedLine.current_stock = onHand;
          } else {
            updatedLine.item_code = '';
            updatedLine.item_name = '';
            updatedLine.unit = '';
            updatedLine.unit_price = '';
            updatedLine.current_stock = '';
          }
        }

        if (field === 'issued_qty') {
          updatedLine.requested_qty = value;
        }

        return updatedLine;
      }),
    }));
  };

  const addLineItem = () => {
    if (!isEdit && showReview) {
      setShowReview(false);
    }

    setFormValues((current) => ({
      ...current,
      line_items: [createEmptyLineItem(), ...current.line_items],
    }));
  };

  const removeLineItem = (localId) => {
    if (!isEdit && showReview) {
      setShowReview(false);
    }

    setFormValues((current) => ({
      ...current,
      line_items:
        current.line_items.length === 1
          ? current.line_items
          : current.line_items.filter((line) => line.localId !== localId),
    }));
  };

  const revalidateIssueDocumentQueries = async (recordId) => {
    await Promise.all([
      mutate((key) => typeof key === 'string' && key.startsWith(moduleConfig.listEndpoint)),
      recordId ? mutate(moduleConfig.detailEndpoint(recordId)) : Promise.resolve(),
      revalidateInventoryLogInsights(),
    ]);
  };

  const handleSubmit = async (statusOverride) => {
    if (!validateDocument()) {
      return;
    }

    const normalizedLineItems = getNormalizedLineItems();

    if (!normalizedLineItems) {
      return;
    }

    setSubmitting(true);

    try {
      const resolvedStatus =
        typeof statusOverride === 'string' ? statusOverride : formValues.status;
      const payload = buildPayload({
        ...formValues,
        office_location: usesOfficeParties ? issueFromOfficeId || null : null,
        issued_to: showsIssueToField ? formValues.issued_to : '',
        status: resolvedStatus,
        line_items: normalizedLineItems,
      });
      const response = isEdit
        ? await patchRequest(moduleConfig.detailEndpoint(documentId), payload)
        : await createRequest(moduleConfig.listEndpoint, payload);

      const recordId = response?.id || documentId;

      toast.success(isEdit ? moduleConfig.updatedToast : moduleConfig.createdToast);
      await revalidateIssueDocumentQueries(recordId);

      if (isEdit) {
        router.push(moduleConfig.detailPath(recordId));
      } else {
        router.push(moduleConfig.listPath);
      }
    } catch (error) {
      toast.error(extractErrorMessage(error?.response?.data || error));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrepareReview = () => {
    if (!validateDocument()) {
      return;
    }

    const normalizedLineItems = getNormalizedLineItems();

    if (!normalizedLineItems) {
      return;
    }

    setShowReview(true);
  };

  if (isEdit && detailLoading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Stack spacing={3}>
        <Card
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.info.main, 0.08)})`,
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
            <Box>
              <Button
                component={Link}
                href={returnPath}
                startIcon={<Iconify icon="solar:arrow-left-linear" />}
                sx={{ px: 0, mb: 1, textTransform: 'none' }}
              >
                {isEdit ? moduleConfig.backToListLabel : moduleConfig.returnToListLabel}
              </Button>
              <Typography variant="h4" fontWeight={800} color="text.primary">
                {formHeading}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {formDescription}
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
              <Chip
                label={isEdit ? 'Edit Mode' : 'Create Mode'}
                color={isEdit ? 'warning' : 'primary'}
                variant="soft"
              />
              <Button component={Link} href={returnPath} variant="outlined" color="inherit">
                Cancel
              </Button>
              {isEdit ? (
                <>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => handleSubmit('Draft')}
                    disabled={submitting}
                  >
                    {submitting ? 'Updating...' : 'Update Draft'}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => handleSubmit('Pending Approval')}
                    disabled={submitting}
                  >
                    {submitting ? 'Updating...' : 'Update Pending'}
                  </Button>
                </>
              ) : (
                <Button variant="contained" onClick={handlePrepareReview} disabled={submitting}>
                  {submitting ? 'Saving...' : moduleConfig.createLabel}
                </Button>
              )}
            </Stack>
          </Stack>
        </Card>

        {detailError && isEdit && (
          <Alert severity="error" sx={{ borderRadius: 2.5 }}>
            The selected record could not be loaded for editing.
          </Alert>
        )}

        <Card sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Issuance Context
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {contextDescription}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Issue Date"
                  value={formValues.issue_date}
                  onChange={(event) => handleFieldChange('issue_date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              {showsIssueToField && (
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    select
                    fullWidth
                    label={moduleConfig.issueToLabel}
                    value={formValues.issued_to}
                    onChange={(event) => handleFieldChange('issued_to', event.target.value)}
                    disabled={issueToLoading}
                  >
                    <MenuItem value="">{moduleConfig.issueToEmptyLabel}</MenuItem>
                    {formValues.issued_to && !issuedToHasLiveOption && (
                      <MenuItem value={formValues.issued_to}>{formValues.issued_to}</MenuItem>
                    )}
                    {issueToOptions.map((option) => (
                      <MenuItem key={option.id} value={getIssueToLabel(option)}>
                        {getIssueToLabel(option)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label={moduleConfig.issueFromLabel}
                  value={formValues.issue_from}
                  onChange={(event) => handleFieldChange('issue_from', event.target.value)}
                  disabled={issueFromLoading}
                >
                  <MenuItem value="">{moduleConfig.issueFromEmptyLabel}</MenuItem>
                  {formValues.issue_from && !issueFromHasLiveOption && (
                    <MenuItem value={formValues.issue_from}>{formValues.issue_from}</MenuItem>
                  )}
                  {issueFromOptions.map((option) => (
                    <MenuItem key={`source-${option.id}`} value={getIssueFromLabel(option)}>
                      {getIssueFromLabel(option)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Department"
                  value={formValues.department}
                  onChange={(event) => handleFieldChange('department', event.target.value)}
                  disabled={departmentsLoading}
                >
                  <MenuItem value="">Not Assigned</MenuItem>
                  {formValues.department && !departmentHasLiveOption && (
                    <MenuItem value={formValues.department}>{formValues.department}</MenuItem>
                  )}
                  {departmentOptions.map((department) => (
                    <MenuItem key={department.id} value={getDepartmentLabel(department)}>
                      {getDepartmentLabel(department)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {!usesProjectIssueTo && (
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    select
                    fullWidth
                    label="Project"
                    value={formValues.project}
                    onChange={(event) => handleFieldChange('project', event.target.value)}
                    disabled={projectsLoading}
                  >
                    <MenuItem value="">Not Linked</MenuItem>
                    {formValues.project && !projectHasLiveOption && (
                      <MenuItem value={formValues.project}>{formValues.project}</MenuItem>
                    )}
                    {projectOptions.map((project) => (
                      <MenuItem key={project.id} value={getProjectLabel(project)}>
                        {getProjectLabel(project)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
              {/* <Grid size={{ xs: 12, md: isEdit ? 7 : 9 }}> */}
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Purpose"
                  value={formValues.purpose}
                  onChange={(event) => handleFieldChange('purpose', event.target.value)}
                />
              </Grid>
              {isEdit && (
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField
                    select
                    fullWidth
                    label="Status"
                    value={formValues.status}
                    onChange={(event) => handleFieldChange('status', event.target.value)}
                  >
                    {allowedStatusOptions.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
            </Grid>
          </Stack>
        </Card>

        <Card sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Approval Workflow
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Capture who requested and approved the issue note, plus the workflow stage inside
                the approval chain.
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  label="Requested By"
                  value={formValues.requested_by}
                  onChange={(event) => handleFieldChange('requested_by', event.target.value)}
                  disabled={usersLoading}
                >
                  <MenuItem value="">Not Assigned</MenuItem>
                  {userOptions.map((user) => (
                    <MenuItem key={`requested-${user.id}`} value={String(user.id)}>
                      {getUserLabel(user)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {/* <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Approved By"
                  value={formValues.approved_by}
                  onChange={(event) => handleFieldChange('approved_by', event.target.value)}
                  disabled={usersLoading}
                >
                  <MenuItem value="">Not Assigned</MenuItem>
                  {userOptions.map((user) => (
                    <MenuItem key={`approved-${user.id}`} value={String(user.id)}>
                      {getUserLabel(user)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Approval Level"
                  value={formValues.approval_level}
                  onChange={(event) => handleFieldChange('approval_level', event.target.value)}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Approval Steps"
                  value={formValues.total_levels}
                  onChange={(event) => handleFieldChange('total_levels', event.target.value)}
                  inputProps={{ min: 1 }}
                />
              </Grid> */}
            </Grid>
          </Stack>
        </Card>

        <Card sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
          <Stack spacing={2.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Line Items
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add the items being issued out of stock for this document.
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={addLineItem}
                disabled={usesOfficeParties && !formValues.issue_from}
              >
                Add Item
              </Button>
            </Stack>

            <Divider />

            {usesOfficeParties && !formValues.issue_from ? (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: (t) => `${t.palette.warning.main}0D`,
                  border: (t) => `1px solid ${t.palette.warning.main}33`,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Iconify icon="solar:info-circle-bold-duotone" sx={{ color: 'warning.main' }} />
                  <Typography variant="body2" color="warning.dark">
                    Select an Issue From office or warehouse first to load available items.
                  </Typography>
                </Stack>
              </Box>
            ) : (
              <Stack spacing={2}>
                {formValues.line_items.map((line, index) => (
                  <Paper key={line.localId} variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" fontWeight={700}>
                          Item {index + 1}
                        </Typography>
                        <IconButton
                          color="error"
                          onClick={() => removeLineItem(line.localId)}
                          disabled={formValues.line_items.length === 1}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Stack>

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            select
                            fullWidth
                            label="Item"
                            value={line.product}
                            onChange={(event) =>
                              handleLineItemChange(line.localId, 'product', event.target.value)
                            }
                            disabled={itemsLoading}
                          >
                            <MenuItem value="">Select Item</MenuItem>
                            {line.product &&
                              !itemOptions.some(
                                (item) => String(item.id) === String(line.product)
                              ) && (
                                <MenuItem value={line.product}>
                                  {line.item_name || 'Current item'}
                                  {line.item_code ? ` (${line.item_code})` : ''}
                                </MenuItem>
                              )}
                            {itemOptions
                              .filter(
                                (item) =>
                                  !selectedProductIds.has(String(item.id)) ||
                                  String(item.id) === String(line.product)
                              )
                              .map((item) => (
                                <MenuItem key={item.id} value={String(item.id)}>
                                  {item.item_name} ({item.item_code})
                                </MenuItem>
                              ))}
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                          <TextField
                            fullWidth
                            label="Unit"
                            value={line.unit}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Unit Price"
                            value={line.unit_price}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 1.5 }}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Issued"
                            value={line.issued_qty}
                            onChange={(event) =>
                              handleLineItemChange(line.localId, 'issued_qty', event.target.value)
                            }
                            inputProps={{
                              min: 0,
                              // max: Number(line.current_stock || 0) || undefined,
                            }}
                            helperText={
                              line.product
                                ? `Current stock: ${Number(line.current_stock || itemOptionsById.get(String(line.product))?.current_stock || 0).toLocaleString('en-BD')}`
                                : 'Select an item first'
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 2.5 }}>
                          <TextField
                            fullWidth
                            label="Remarks"
                            value={line.remarks}
                            onChange={(event) =>
                              handleLineItemChange(line.localId, 'remarks', event.target.value)
                            }
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>
        </Card>

        <Dialog
          open={!isEdit && showReview}
          onClose={submitting ? undefined : () => setShowReview(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Document Overview</DialogTitle>

          <DialogContent dividers>
            <Stack spacing={3} sx={{ pt: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Review the full Goods Issue Note below, then choose whether to create it as a
                  draft or create it directly in pending approval.
                </Typography>
              </Box>

              <Alert severity="info" sx={{ borderRadius: 2.5 }}>
                This is the final review step. If you change any field above, the overview will be
                cleared and you will need to click Create GIN again before using Draft or Create &
                Pending.
              </Alert>

              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <ReviewField label="Issue Date" value={formatDate(formValues.issue_date)} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <ReviewField
                    label={moduleConfig.issueFromLabel}
                    value={formValues.issue_from || 'Not assigned'}
                  />
                </Grid>
                {showsIssueToField && (
                  <Grid size={{ xs: 12, md: 3 }}>
                    <ReviewField label={moduleConfig.issueToLabel} value={formValues.issued_to} />
                  </Grid>
                )}
                <Grid size={{ xs: 12, md: 3 }}>
                  <ReviewField label="Department" value={formValues.department || 'Not assigned'} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <ReviewField label="Project" value={formValues.project || 'Not linked'} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <ReviewField
                    label="Approval Stage"
                    value={`${formValues.approval_level || 0}/${formValues.total_levels || 1}`}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ReviewField
                    label="Requested By"
                    value={getUserNameById(formValues.requested_by) || 'Not assigned'}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ReviewField
                    label="Approved By"
                    value={getUserNameById(formValues.approved_by) || 'Not assigned'}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <ReviewField label="Purpose" value={formValues.purpose || 'Not provided'} />
                </Grid>
              </Grid>

              <Divider />

              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                  Line Item Overview
                </Typography>

                {reviewLineItems.map((line, index) => (
                  <Paper
                    key={line.localId}
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 2.5,
                      borderColor: alpha(theme.palette.primary.main, 0.16),
                      background: alpha(theme.palette.primary.main, 0.03),
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                            {index + 1}. {line.productName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {`${line.unit} | Issued ${Number(line.issuedQty || 0).toLocaleString(
                              'en-BD'
                            )}`}
                          </Typography>
                        </Box>
                        <Chip
                          label={formatCurrency(line.lineTotal)}
                          color="primary"
                          variant="soft"
                        />
                      </Stack>

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <ReviewField label="Unit" value={line.unit} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <ReviewField label="Unit Price" value={formatCurrency(line.unitPrice)} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <ReviewField
                            label="Issued Quantity"
                            value={Number(line.issuedQty || 0).toLocaleString('en-BD')}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <ReviewField label="Remarks" value={line.remarks} />
                        </Grid>
                      </Grid>
                    </Stack>
                  </Paper>
                ))}
              </Stack>

              <Divider />

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={2}
                alignItems={{ md: 'center' }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.25}
                  flexWrap="wrap"
                  useFlexGap
                >
                  <Chip label={`Items ${reviewTotals.items}`} variant="outlined" />
                  <Chip
                    label={`Issued ${reviewTotals.quantity.toLocaleString('en-BD')}`}
                    variant="outlined"
                  />
                  <Chip
                    label={`Estimated Value ${formatCurrency(reviewTotals.value)}`}
                    color="primary"
                    variant="soft"
                  />
                </Stack>
              </Stack>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button variant="outlined" color="inherit" onClick={() => setShowReview(false)}>
              Cancel
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => handleSubmit('Draft')}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Draft'}
            </Button>
            <Button
              variant="contained"
              onClick={() => handleSubmit('Pending Approval')}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create & Pending'}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Box>
  );
}
