'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Save,
  Send,
  Trash2,
  Upload,
  Banknote,
  FileText,
  ArrowLeft,
  ArrowRight,
  Calculator,
  CheckCircle,
  ShieldCheck,
  Zap,
  Link as LinkIcon,
  Info,
  RotateCcw,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  useCreateMutation,
  extractErrorMessage,
  usePatchRequest as patchRequest,
  useCreateRequest as createRequest,
} from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
import { DatePicker } from '../../components/ui/date-picker';

const EMPTY_ITEM = {
  description: '',
  quantity: 1,
  unit_price: '',
  source: 'manual',
};

const formatBDT = (amount) => {
  const value = Number(amount) || 0;
  if (value >= 10000000) return `৳${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `৳${(value / 100000).toFixed(2)} L`;
  return `৳${value.toLocaleString('en-IN')}`;
};

const toList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  return [];
};

const numericValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const asText = (value) => (value || value === 0 ? String(value) : '');

const getWorkOrderLabel = (workOrder) =>
  `${workOrder.workOrderNumber || workOrder.wo_number || `WO-${workOrder.id}`} - ${workOrder.vendor?.name || 'Unknown vendor'}`;

const DisabledFieldWrapper = ({ label, required, disabled, disabledReason, children }) => (
  <div>
    <label className="block text-sm font-medium text-foreground mb-2">
      {label}
      {required && <span className="text-error ml-1">*</span>}
      {disabled && disabledReason && (
        <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground font-normal">
          <Info className="w-3 h-3" />
          {disabledReason}
        </span>
      )}
    </label>
    {children}
  </div>
);

const inputClass = (disabled) =>
  `w-full px-3 py-2 border border-input rounded-lg text-base transition-colors ${
    disabled
      ? 'bg-muted/50 text-muted-foreground cursor-not-allowed'
      : 'focus:outline-none focus:ring-2 focus:ring-primary'
  }`;

const selectClass = (disabled) =>
  `w-full px-3 py-2 border border-input rounded-lg text-base transition-colors ${
    disabled
      ? 'bg-muted/50 text-muted-foreground cursor-not-allowed'
      : 'focus:outline-none focus:ring-2 focus:ring-primary'
  }`;

export function CreatePRF() {
  const router = useRouter();
  const [form, setForm] = useState({
    workOrder: '',
    grnSelections: [],
    supplier: '',
    invoiceNumber: '',
    invoiceDate: '',
    tentativePaymentScheduleDate: '',
    invoiceAmount: '',
    totalAmount: '',
    taxAmount: '',
    vatPercentage: '',
    budgetCode: '',
    accountCode: '',
    project: '',
    department: '',
    priority: 'Medium',
    paymentMethod: 'Bank Transfer',
    purpose: '',
    remarks: '',
  });
  const [items, setItems] = useState([EMPTY_ITEM]);
  const [attachment, setAttachment] = useState(null);
  const [workOrderSearch, setWorkOrderSearch] = useState('');
  const [autoFilledFrom, setAutoFilledFrom] = useState(null);

  const { trigger: createPRF, isMutating: submitting } = useCreateMutation(
    endpoints.procurement_management.payment_requisitions
  );

  const { data: workOrderResponse } = useGetRequest(
    `${endpoints.procurement_management.work_orders}?pagination=false`
  );
  const { data: grnResponse } = useGetRequest(
    `${endpoints.procurement_management.grns}?pagination=false`
  );
  const { data: supplierResponse } = useGetRequest(
    `${endpoints.procurement_management.suppliers}?pagination=false`
  );
  const { data: budgetResponse } = useGetRequest(
    `${endpoints.procurement_management.budgets}?pagination=false`
  );
  const { data: accountResponse } = useGetRequest(
    `${endpoints.procurement_management.accounts}?pagination=false`
  );
  const { data: projectResponse } = useGetRequest(
    `${endpoints.projects.projects}?pagination=false`
  );
  const { data: departmentResponse } = useGetRequest(
    `${endpoints.settings.departments}?pagination=false`
  );

  const workOrders = useMemo(() => toList(workOrderResponse), [workOrderResponse]);
  const grns = useMemo(() => toList(grnResponse), [grnResponse]);
  const suppliers = useMemo(() => toList(supplierResponse), [supplierResponse]);
  const budgets = useMemo(() => toList(budgetResponse), [budgetResponse]);
  const accounts = useMemo(() => toList(accountResponse), [accountResponse]);
  const projects = useMemo(() => toList(projectResponse), [projectResponse]);
  const departments = useMemo(() => toList(departmentResponse), [departmentResponse]);

  const selectedWorkOrder = useMemo(
    () => workOrders.find((item) => String(item.id) === String(form.workOrder)),
    [form.workOrder, workOrders]
  );

  const woIsSelected = !!selectedWorkOrder;

  useEffect(() => {
    if (!form.workOrder) {
      setWorkOrderSearch('');
      return;
    }

    if (selectedWorkOrder) {
      setWorkOrderSearch(getWorkOrderLabel(selectedWorkOrder));
    }
  }, [form.workOrder, selectedWorkOrder]);

  const filteredWorkOrders = useMemo(() => {
    const query = workOrderSearch.trim().toLowerCase();
    if (!query) return workOrders;

    return workOrders.filter((workOrder) => {
      const vendorName = workOrder.vendor?.name || '';
      const workOrderNumber = workOrder.workOrderNumber || workOrder.wo_number || '';
      return `${workOrderNumber} ${vendorName}`.toLowerCase().includes(query);
    });
  }, [workOrders, workOrderSearch]);

  const availableGrns = useMemo(() => {
    if (!form.workOrder) return [];
    return grns.filter((item) => String(item.work_order) === String(form.workOrder));
  }, [form.workOrder, grns]);

  const selectedGRNs = useMemo(
    () => grns.filter((item) => form.grnSelections.includes(String(item.id))),
    [form.grnSelections, grns]
  );

  const selectedPrimaryGRN = selectedGRNs[0] || null;
  const selectedGrnReceivedTotal = selectedGRNs.reduce(
    (sum, item) => sum + numericValue(item.total_received_value),
    0
  );

  const itemsTotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + numericValue(item.quantity) * numericValue(item.unit_price),
        0
      ),
    [items]
  );

  const totalAmount = numericValue(form.totalAmount || form.invoiceAmount || itemsTotal);
  const taxAmount = numericValue(form.taxAmount);
  const netAmount = totalAmount - taxAmount;
  const vatPercentage = numericValue(form.vatPercentage);
  const vatBaseAmount = itemsTotal;
  const vatAmount = (vatBaseAmount * vatPercentage) / 100;
  const totalWithVat = vatBaseAmount + vatAmount;
  const totalQuantity = items.reduce((sum, item) => sum + numericValue(item.quantity), 0);
  const approvalRoute = totalAmount >= 500000 ? 'Country Director' : 'Head of Finance';

  const updateForm = useCallback((field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  }, []);

  const findSupplierId = useCallback(
    (vendorId) => {
      if (!vendorId) return '';
      const match = suppliers.find((s) => String(s.id) === String(vendorId));
      return match ? String(match.id) : '';
    },
    [suppliers]
  );

  const findBudgetId = useCallback(
    (budgetCode) => {
      if (!budgetCode) return '';
      const match = budgets.find(
        (b) =>
          String(b.code) === String(budgetCode) ||
          String(b.id) === String(budgetCode) ||
          String(b.name) === String(budgetCode)
      );
      return match ? String(match.id) : '';
    },
    [budgets]
  );

  const findProjectId = useCallback(
    (projectRef) => {
      if (!projectRef) return '';
      const match = projects.find(
        (p) =>
          String(p.id) === String(projectRef) ||
          String(p.name) === String(projectRef) ||
          String(p.project_name) === String(projectRef)
      );
      return match ? String(match.id) : '';
    },
    [projects]
  );

  const handleWorkOrderChange = useCallback(
    (value) => {
      const workOrder = workOrders.find((item) => String(item.id) === value);
      const linkedGrn = grns.find((item) => String(item.work_order) === value);

      if (!value) {
        setForm((current) => ({
          ...current,
          workOrder: '',
          grnSelections: [],
          supplier: '',
          invoiceNumber: '',
          invoiceDate: '',
          invoiceAmount: '',
          totalAmount: '',
          budgetCode: '',
          project: '',
          purpose: '',
        }));
        setItems([EMPTY_ITEM]);
        setAutoFilledFrom(null);
        return;
      }

      const supplierId = linkedGrn?.supplier
        ? String(linkedGrn.supplier)
        : workOrder?.vendor?.id
          ? findSupplierId(workOrder.vendor.id)
          : '';

      const budgetId = workOrder?.budgetCode ? findBudgetId(workOrder.budgetCode) : '';
      const projectId = workOrder?.project ? findProjectId(workOrder.project) : '';

      const woTotal = workOrder?.totalAmount || workOrder?.total_amount || 0;
      const woNumber = workOrder?.workOrderNumber || workOrder?.wo_number || '';
      const invoiceNum = linkedGrn?.invoice_number || '';
      const invoiceDt = linkedGrn?.receipt_date || '';

      setForm((current) => ({
        ...current,
        workOrder: value,
        grnSelections: linkedGrn ? [String(linkedGrn.id)] : current.grnSelections,
        supplier: supplierId || current.supplier,
        invoiceNumber: invoiceNum || woNumber || current.invoiceNumber,
        invoiceDate: invoiceDt || current.invoiceDate,
        invoiceAmount: woTotal ? String(woTotal) : current.invoiceAmount,
        totalAmount: woTotal ? String(woTotal) : current.totalAmount,
        budgetCode: budgetId || current.budgetCode,
        project: projectId || current.project,
        purpose: workOrder?.title
          ? `Payment for ${workOrder.title}${workOrder.category ? ` (${workOrder.category})` : ''}`
          : current.purpose,
      }));

      if (linkedGrn?.grn_items?.length) {
        setItems(
          linkedGrn.grn_items.map((item) => ({
            description: item.item_name || item.remarks || 'GRN line item',
            quantity: item.accepted_quantity || item.received_quantity || 1,
            unit_price: asText(item.unit_price),
            source: 'wo',
          }))
        );
      } else if (workOrder?.items?.length) {
        setItems(
          workOrder.items.map((item) => ({
            description: item.description || item.name || item.item_name || '',
            quantity: Number(item.quantity) || 1,
            unit_price: asText(item.unitPrice ?? item.unit_price),
            source: 'wo',
          }))
        );
      }

      setAutoFilledFrom(linkedGrn ? 'grn' : workOrder ? 'work-order' : null);
    },
    [workOrders, grns, findSupplierId, findBudgetId, findProjectId]
  );

  const handleGRNSelectionChange = useCallback(
    (selectedValues) => {
      const selectedGrnRecords = grns.filter((item) => selectedValues.includes(String(item.id)));
      const primaryGRN = selectedGrnRecords[0];

      setForm((current) => ({
        ...current,
        grnSelections: selectedValues,
        workOrder: primaryGRN?.work_order ? String(primaryGRN.work_order) : current.workOrder,
        supplier: primaryGRN?.supplier ? String(primaryGRN.supplier) : current.supplier,
        invoiceNumber: current.invoiceNumber || primaryGRN?.invoice_number || '',
        invoiceDate: current.invoiceDate || primaryGRN?.receipt_date || '',
        invoiceAmount: current.invoiceAmount,
        totalAmount: current.totalAmount,
      }));

      const mergedItems = selectedGrnRecords.flatMap((grn) =>
        Array.isArray(grn?.grn_items)
          ? grn.grn_items.map((item) => ({
              description: item.item_name || item.remarks || 'GRN line item',
              quantity: item.accepted_quantity || item.received_quantity || 1,
              unit_price: asText(item.unit_price),
              source: 'wo',
            }))
          : []
      );

      if (mergedItems.length) {
        setItems(mergedItems);
      }
    },
    [grns]
  );

  const updateItem = useCallback((index, field, value) => {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    );
  }, []);

  const addItem = useCallback(() => setItems((current) => [...current, { ...EMPTY_ITEM }]), []);

  const removeItem = useCallback((index) => {
    setItems((current) =>
      current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)
    );
  }, []);

  const resetForm = useCallback(() => {
    setForm({
      workOrder: '',
      grnSelections: [],
      supplier: '',
      invoiceNumber: '',
      invoiceDate: '',
      tentativePaymentScheduleDate: '',
      invoiceAmount: '',
      totalAmount: '',
      taxAmount: '',
      vatPercentage: '',
      budgetCode: '',
      accountCode: '',
      project: '',
      department: '',
      priority: 'Medium',
      paymentMethod: 'Bank Transfer',
      purpose: '',
      remarks: '',
    });
    setItems([EMPTY_ITEM]);
    setAttachment(null);
    setWorkOrderSearch('');
    setAutoFilledFrom(null);
  }, []);

  const handleSubmit = async () => {
    if (!form.supplier || !form.invoiceNumber || !totalAmount) {
      toast.error('Supplier, invoice number, and total amount are required.');
      return;
    }

    try {
      const payload = {
        ...(form.workOrder && { work_order: Number(form.workOrder) }),
        ...(form.grnSelections.length > 0 && { grn: Number(form.grnSelections[0]) }),
        ...(form.grnSelections.length > 0 && {
          grns: form.grnSelections.map((value) => Number(value)),
        }),
        supplier: Number(form.supplier),
        invoice_number: form.invoiceNumber,
        ...(form.invoiceDate && { invoice_date: form.invoiceDate }),
        ...(form.tentativePaymentScheduleDate && {
          tentative_payment_schedule_date: form.tentativePaymentScheduleDate,
        }),
        grn_checkbox: form.grnSelections.length > 0,
        invoice_amount: numericValue(form.invoiceAmount || totalAmount),
        ...(form.budgetCode && { budget_code: Number(form.budgetCode) }),
        ...(form.accountCode && { account_code: Number(form.accountCode) }),
        ...(form.project && { project: Number(form.project) }),
        ...(form.department && { department: Number(form.department) }),
        total_amount: totalAmount,
        tax_amount: taxAmount,
        priority: form.priority,
        purpose: form.purpose,
        remarks: form.remarks,
        payment_method: form.paymentMethod,
        status: 'Pending Approval',
      };

      const prf = await createPRF(payload);
      const validItems = items.filter(
        (item) =>
          item.description.trim() || numericValue(item.quantity) || numericValue(item.unit_price)
      );

      if (prf?.id && validItems.length > 0) {
        await Promise.all(
          validItems.map((item) =>
            createRequest(endpoints.procurement_management.payment_requisition_items, {
              payment_requisition: prf.id,
              description: item.description,
              quantity: numericValue(item.quantity) || 1,
              unit_price: numericValue(item.unit_price),
            })
          )
        );
      }

      if (prf?.id && attachment) {
        const formData = new FormData();
        formData.append('attachment', attachment);
        await patchRequest(
          endpoints.procurement_management.payment_requisition_by_id(prf.id),
          formData
        );
      }

      await Promise.all([
        mutate(endpoints.procurement_management.payment_requisition_summary),
        mutate(`${endpoints.procurement_management.payment_requisitions}?pagination=false`),
      ]);

      toast.success('Payment requisition submitted successfully.');
      router.push(paths.dashboard.procurement.paymentRequisitions.pendingApprovals);
    } catch (error) {
      toast.error(extractErrorMessage(error?.response?.data || error));
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href={paths.dashboard.procurement.paymentRequisitions.list}>
          <button type="button" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
            Create Payment Requisition Form
          </h1>
          <p className="text-muted-foreground text-sm">
            Submit a payment request against a work order, GRN, and vendor invoice.
          </p>
        </div>
        {woIsSelected && (
          <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Reset
          </Button>
        )}
      </div>

      {/* Approval Routing Preview */}
      <Card className="mb-6 bg-primary/5 border-primary/20">
        <CardBody>
          <p className="text-sm font-medium text-foreground mb-3">Approval Routing Preview</p>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 rounded-full text-primary font-medium">
              <FileText className="w-3 h-3" />
              PRF Submitted
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-1 px-3 py-1.5 bg-warning/10 rounded-full text-warning font-medium">
              <ShieldCheck className="w-3 h-3" />
              Pending Approval
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-1 px-3 py-1.5 bg-success/10 rounded-full text-success font-medium">
              <CheckCircle className="w-3 h-3" />
              {approvalRoute}
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 rounded-full text-primary font-medium">
              <Banknote className="w-3 h-3" />
              Treasury Processing
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-1 px-3 py-1.5 bg-success/10 rounded-full text-success font-medium">
              <Send className="w-3 h-3" />
              Paid
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Financial Summary */}
      <Card className="mb-6 border-primary bg-primary/5">
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Invoice / Gross</p>
              <p className="text-2xl font-bold text-foreground">{formatBDT(totalAmount)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Tax / Deduction</p>
              <p className="text-2xl font-bold text-error">-{formatBDT(taxAmount)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Items Total</p>
              <p className="text-2xl font-bold text-success">{formatBDT(itemsTotal)}</p>
            </div>
            <div className="text-center border-l-2 border-primary">
              <p className="text-sm text-muted-foreground mb-1">Net Payable</p>
              <p className="text-3xl font-bold text-primary">{formatBDT(netAmount)}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Work Order & GRN Selection */}
      <Card className="mb-6">
        <CardHeader
          title="Linked Procurement Records"
          description="Select the work order and GRN that support this payment request"
        />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Work Order</label>
              <input
                type="text"
                value={workOrderSearch}
                onChange={(event) => {
                  setWorkOrderSearch(event.target.value);
                  if (!event.target.value.trim()) {
                    handleWorkOrderChange('');
                  }
                }}
                placeholder="Search work order by number or vendor"
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
              />
              <div className="mt-2 max-h-40 overflow-y-auto border border-input rounded-lg p-1">
                {filteredWorkOrders.length === 0 ? (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">
                    No matching work orders found.
                  </p>
                ) : (
                  filteredWorkOrders.slice(0, 50).map((workOrder) => {
                    const selected = String(form.workOrder) === String(workOrder.id);
                    return (
                      <button
                        key={workOrder.id}
                        type="button"
                        onClick={() => handleWorkOrderChange(String(workOrder.id))}
                        className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                          selected
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted/40 text-foreground'
                        }`}
                      >
                        <span className="font-medium">
                          {workOrder.workOrderNumber || workOrder.wo_number || `WO-${workOrder.id}`}
                        </span>
                        <span className="mx-1.5 text-muted-foreground">&mdash;</span>
                        <span>{workOrder.vendor?.name || 'Unknown vendor'}</span>
                        {workOrder.totalAmount ? (
                          <span className="ml-2 text-xs opacity-70">
                            ({formatBDT(workOrder.totalAmount)})
                          </span>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                GRN (Multi-select)
              </label>
              <div className="max-h-40 overflow-y-auto border border-input rounded-lg p-2 space-y-1">
                {availableGrns.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-1">
                    {woIsSelected
                      ? 'No GRNs available for selected work order.'
                      : 'Select a work order first to see GRNs.'}
                  </p>
                ) : (
                  availableGrns.map((grn) => {
                    const grnValue = String(grn.id);
                    const checked = form.grnSelections.includes(grnValue);

                    return (
                      <label
                        key={grn.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted/40"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const nextValues = checked
                              ? form.grnSelections.filter((value) => value !== grnValue)
                              : [...form.grnSelections, grnValue];
                            handleGRNSelectionChange(nextValues);
                          }}
                          className="h-4 w-4 rounded border-input"
                        />
                        <span className="text-sm text-foreground">
                          {grn.grn_number} - {grn.supplier_name || 'Unknown supplier'}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click on GRN rows to select/deselect multiple entries.
              </p>
            </div>
          </div>

          {/* Auto-linked Details Card */}
          {(selectedWorkOrder || selectedPrimaryGRN) && (
            <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-success" />
                  Auto-linked details
                </p>
                {autoFilledFrom && (
                  <Badge variant="success" size="sm">
                    {autoFilledFrom === 'grn' ? 'Filled from GRN' : 'Filled from Work Order'}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 flex-wrap mb-3">
                {selectedWorkOrder ? (
                  <Badge variant="outline">
                    <LinkIcon className="w-3 h-3 mr-1" />
                    {selectedWorkOrder.workOrderNumber || selectedWorkOrder.wo_number}
                  </Badge>
                ) : null}
                {selectedGRNs.map((grn) => (
                  <Badge key={grn.id} variant="outline">
                    <LinkIcon className="w-3 h-3 mr-1" />
                    {grn.grn_number}
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Supplier:</span>{' '}
                  <span className="font-medium">
                    {selectedPrimaryGRN?.supplier_name || selectedWorkOrder?.vendor?.name || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>{' '}
                  <span className="font-medium">{selectedWorkOrder?.category || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Invoice ref:</span>{' '}
                  <span className="font-medium">
                    {selectedPrimaryGRN?.invoice_number ||
                      selectedWorkOrder?.csNumber ||
                      'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Order value:</span>{' '}
                  <span className="font-medium text-primary">
                    {formatBDT(selectedGrnReceivedTotal || selectedWorkOrder?.totalAmount)}
                  </span>
                </div>
                {selectedWorkOrder?.paymentTerms && (
                  <div>
                    <span className="text-muted-foreground">Payment terms:</span>{' '}
                    <span className="font-medium">{selectedWorkOrder.paymentTerms}</span>
                  </div>
                )}
                {selectedWorkOrder?.budgetCode && (
                  <div>
                    <span className="text-muted-foreground">Budget:</span>{' '}
                    <span className="font-medium">{selectedWorkOrder.budgetCode}</span>
                  </div>
                )}
                {selectedWorkOrder?.deliveryDeadline && (
                  <div>
                    <span className="text-muted-foreground">Delivery deadline:</span>{' '}
                    <span className="font-medium">{selectedWorkOrder.deliveryDeadline}</span>
                  </div>
                )}
                {selectedWorkOrder?.warrantyPeriod && (
                  <div>
                    <span className="text-muted-foreground">Warranty:</span>{' '}
                    <span className="font-medium">{selectedWorkOrder.warrantyPeriod}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Invoice & Allocation */}
      <Card className="mb-6">
        <CardHeader
          title="Invoice & Allocation"
          description="Capture the supplier invoice and budget coding"
        />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Supplier */}
            <DisabledFieldWrapper
              label="Supplier"
              required
              disabled={woIsSelected}
              disabledReason={woIsSelected ? 'Auto-filled from work order' : undefined}
            >
              <select
                value={form.supplier}
                onChange={(event) => updateForm('supplier', event.target.value)}
                disabled={woIsSelected}
                className={selectClass(woIsSelected)}
              >
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </DisabledFieldWrapper>

            {/* Invoice Number */}
            <DisabledFieldWrapper
              label="Invoice Number"
              required
              disabled={woIsSelected && !!form.invoiceNumber}
              disabledReason={
                woIsSelected && form.invoiceNumber ? 'Auto-filled from Work Order / GRN' : undefined
              }
            >
              <input
                type="text"
                value={form.invoiceNumber}
                onChange={(event) => updateForm('invoiceNumber', event.target.value)}
                disabled={woIsSelected && !!form.invoiceNumber}
                className={inputClass(woIsSelected && !!form.invoiceNumber)}
                placeholder="Enter invoice number"
              />
            </DisabledFieldWrapper>

            {/* Invoice Date */}
            <DisabledFieldWrapper
              label="Invoice Date"
              disabled={woIsSelected && !!form.invoiceDate}
              disabledReason={woIsSelected && form.invoiceDate ? 'Auto-filled from GRN' : undefined}
            >
              <DatePicker
                value={form.invoiceDate}
                onChange={(date) => updateForm('invoiceDate', date)}
                placeholder="Select invoice date"
                disabled={woIsSelected && !!form.invoiceDate}
              />
            </DisabledFieldWrapper>

            {/* Tentative Payment Schedule Date */}
            <DisabledFieldWrapper label="Tentative Payment Schedule Date">
              <DatePicker
                value={form.tentativePaymentScheduleDate}
                onChange={(date) => updateForm('tentativePaymentScheduleDate', date)}
                placeholder="Select payment date"
              />
            </DisabledFieldWrapper>

            {/* Invoice Amount */}
            <DisabledFieldWrapper
              label="Invoice Amount"
              disabled={woIsSelected && !!form.invoiceAmount}
              disabledReason={
                woIsSelected && form.invoiceAmount ? 'Auto-filled from work order' : undefined
              }
            >
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.invoiceAmount}
                onChange={(event) => updateForm('invoiceAmount', event.target.value)}
                disabled={woIsSelected && !!form.invoiceAmount}
                className={inputClass(woIsSelected && !!form.invoiceAmount)}
              />
            </DisabledFieldWrapper>

            {/* Total Amount */}
            <DisabledFieldWrapper label="Total Amount" required>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.totalAmount}
                onChange={(event) => updateForm('totalAmount', event.target.value)}
                className={inputClass(false)}
              />
            </DisabledFieldWrapper>

            {/* Tax Amount */}
            <DisabledFieldWrapper label="Tax Amount">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.taxAmount}
                onChange={(event) => updateForm('taxAmount', event.target.value)}
                className={inputClass(false)}
              />
            </DisabledFieldWrapper>

            {/* Budget Code */}
            <DisabledFieldWrapper
              label="Budget Code"
              disabled={woIsSelected && !!form.budgetCode}
              disabledReason={
                woIsSelected && form.budgetCode ? 'Auto-filled from work order' : undefined
              }
            >
              <select
                value={form.budgetCode}
                onChange={(event) => updateForm('budgetCode', event.target.value)}
                disabled={woIsSelected && !!form.budgetCode}
                className={selectClass(woIsSelected && !!form.budgetCode)}
              >
                <option value="">Select budget</option>
                {budgets.map((budget) => (
                  <option key={budget.id} value={budget.id}>
                    {budget.code || budget.name}
                  </option>
                ))}
              </select>
            </DisabledFieldWrapper>

            {/* Account Code */}
            <DisabledFieldWrapper label="Account Code">
              <select
                value={form.accountCode}
                onChange={(event) => updateForm('accountCode', event.target.value)}
                className={selectClass(false)}
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </DisabledFieldWrapper>

            {/* Project */}
            <DisabledFieldWrapper
              label="Project"
              disabled={woIsSelected && !!form.project}
              disabledReason={
                woIsSelected && form.project ? 'Auto-filled from work order' : undefined
              }
            >
              <select
                value={form.project}
                onChange={(event) => updateForm('project', event.target.value)}
                disabled={woIsSelected && !!form.project}
                className={selectClass(woIsSelected && !!form.project)}
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name || project.project_name}
                  </option>
                ))}
              </select>
            </DisabledFieldWrapper>

            {/* Department */}
            <DisabledFieldWrapper label="Department">
              <select
                value={form.department}
                onChange={(event) => updateForm('department', event.target.value)}
                className={selectClass(false)}
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name || department.department_name}
                  </option>
                ))}
              </select>
            </DisabledFieldWrapper>

            {/* Priority */}
            <DisabledFieldWrapper label="Priority">
              <select
                value={form.priority}
                onChange={(event) => updateForm('priority', event.target.value)}
                className={selectClass(false)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </DisabledFieldWrapper>

            {/* Payment Method */}
            <DisabledFieldWrapper label="Payment Method">
              <select
                value={form.paymentMethod}
                onChange={(event) => updateForm('paymentMethod', event.target.value)}
                className={selectClass(false)}
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </select>
            </DisabledFieldWrapper>
          </div>

          {/* Purpose */}
          <div className="mb-4">
            <DisabledFieldWrapper
              label="Purpose"
              disabled={woIsSelected && !!form.purpose}
              disabledReason={
                woIsSelected && form.purpose ? 'Auto-filled from work order' : undefined
              }
            >
              <textarea
                rows={3}
                value={form.purpose}
                onChange={(event) => updateForm('purpose', event.target.value)}
                disabled={woIsSelected && !!form.purpose}
                className={`${inputClass(woIsSelected && !!form.purpose)} resize-none`}
                placeholder="Why is this payment being requested?"
              />
            </DisabledFieldWrapper>
          </div>

          {/* Remarks */}
          <div className="mb-4">
            <DisabledFieldWrapper label="Remarks">
              <textarea
                rows={3}
                value={form.remarks}
                onChange={(event) => updateForm('remarks', event.target.value)}
                className={`${inputClass(false)} resize-none`}
                placeholder="Additional notes for reviewers"
              />
            </DisabledFieldWrapper>
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Supporting Attachment
            </label>
            <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-input rounded-lg cursor-pointer hover:bg-muted/50 w-fit">
              <Upload className="w-4 h-4" />
              <span className="text-sm">Select invoice or payment support</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={(event) => setAttachment(event.target.files?.[0] || null)}
              />
            </label>
            {attachment ? (
              <p className="text-xs text-muted-foreground mt-2">Selected: {attachment.name}</p>
            ) : null}
          </div>
        </CardBody>
      </Card>

      {/* PRF Items */}
      <Card className="mb-6">
        <CardHeader
          title="PRF Items"
          description={
            autoFilledFrom
              ? `${items.length} items auto-populated — edit quantities and prices as needed`
              : 'Break down the invoice into one or more payment lines'
          }
          action={
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calculator className="w-4 h-4" />
              <span>Calculated live</span>
            </div>
          }
        />
        <CardBody>
          <div className="space-y-4">
            {items.map((item, index) => {
              const lineAmount = numericValue(item.quantity) * numericValue(item.unit_price);
              return (
                <div
                  key={`${index}-${item.description}`}
                  className="grid grid-cols-1 md:grid-cols-[1.8fr_120px_160px_120px_auto] gap-3 items-end"
                >
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={item.description}
                      onChange={(event) => updateItem(index, 'description', event.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
                      placeholder="Invoice line description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Qty</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      readOnly
                      value={item.quantity}
                      onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      readOnly
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(event) => updateItem(index, 'unit_price', event.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Amount</label>
                    <div className="px-3 py-2 border border-input rounded-lg bg-muted/40 text-sm font-medium">
                      {formatBDT(lineAmount)}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={item.source === 'wo'}
                    title={item.source === 'wo' ? 'Work order items cannot be removed' : 'Remove item'}
                    className={item.source === 'wo' ? 'opacity-50 cursor-not-allowed' : ''}
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}

            <div className="grid grid-cols-1 md:grid-cols-[1.8fr_120px_160px_120px_auto] gap-3 items-end border-t border-dashed border-input pt-3">
              <div />
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  QTY
                </label>
                <div className="px-3 py-2 border border-input rounded-lg bg-primary/5 text-sm font-semibold text-primary">
                  Total Qty: {totalQuantity}
                </div>
              </div>
              <div />
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Amount
                </label>
                <div className="px-3 py-2 border border-input rounded-lg bg-primary/5 text-sm font-semibold text-primary">
                  Total Amount: {formatBDT(itemsTotal)}
                </div>
              </div>
              <div />
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center gap-3 flex-wrap">
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              Add Item
            </Button>
            <div className="ml-auto w-full sm:w-[320px] space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Percentage of Amount (VAT %)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.vatPercentage || ''}
                onChange={(event) => updateForm('vatPercentage', event.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
                placeholder="Enter VAT percentage"
              />
              <div className="text-sm rounded-lg border border-input bg-muted/40 px-3 py-2">
                <p className="text-muted-foreground">
                  VAT Amount on PRF Items Total ({vatPercentage || 0}%):
                  <span className="ml-1 font-medium text-foreground">{formatBDT(vatAmount)}</span>
                </p>
                <p className="text-muted-foreground">PRF Items Total + VAT</p>
                <p className="font-semibold text-primary">{formatBDT(totalWithVat)}</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Link href={paths.dashboard.procurement.paymentRequisitions.list}>
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button type="button" onClick={handleSubmit} disabled={submitting}>
          <Save className="w-4 h-4 mr-2" />
          {submitting ? 'Submitting...' : 'Submit PRF'}
        </Button>
      </div>
    </div>
  );
}
