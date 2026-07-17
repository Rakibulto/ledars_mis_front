'use client';

import dayjs from 'dayjs';
import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Save, Trash2, ArrowLeft, FileText, Loader2 } from 'lucide-react';

import { TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  useCreateMutation,
  extractErrorMessage,
  usePatchRequest as patchRequest,
} from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
import { DocumentInfoSidebar } from './document-info-sidebar';

const EMPTY_ITEM = {
  description: '',
  ordered_quantity: '',
  received_quantity: '',
  accepted_quantity: '',
  rejected_quantity: '',
  unit_price: '',
  condition: 'Good',
  remarks: '',
};

function formatBDT(amount) {
  const value = Number(amount) || 0;
  if (value >= 10000000) return `৳${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `৳${(value / 100000).toFixed(2)} Lakh`;
  return `৳${value.toLocaleString('en-IN')}`;
}

const toList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  return [];
};

const numericValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const calculateAcceptedRejected = (orderedQuantity, receivedQuantity) => {
  const ordered = Math.max(0, numericValue(orderedQuantity));
  const received = Math.max(0, numericValue(receivedQuantity));
  const accepted = Math.min(received, ordered);
  const rejected = Math.max(ordered - accepted, 0);

  return {
    accepted: asText(accepted),
    rejected: asText(rejected),
  };
};

const asText = (value) => (value || value === 0 ? String(value) : '');

const buildItemRemarks = (item) =>
  [item.description ? `Item: ${item.description}` : null, item.remarks || null]
    .filter(Boolean)
    .join(' | ');

const extractEntityId = (response) =>
  response?.id ||
  response?.data?.id ||
  response?.grn_id ||
  response?.data?.grn_id ||
  response?.pk ||
  response?.data?.pk ||
  null;

const getWorkOrderItemName = (item) =>
  item?.name || item?.item_name || item?.description || 'Work order item';

const getWorkOrderItemQuantity = (item) =>
  item?.quantity ?? item?.qty ?? item?.ordered_quantity ?? item?.orderedQty ?? 0;

const getWorkOrderItemUnitPrice = (item) =>
  item?.unitPrice ?? item?.unit_price ?? item?.estimated_unit_price ?? 0;

const getWorkOrderLabel = (workOrder) =>
  `${workOrder.workOrderNumber || workOrder.wo_number || `WO-${workOrder.id}`} - ${workOrder.vendor?.name || 'Unknown vendor'}`;

const getDPLabel = (dp) => {
  if (!dp) return '';
  return `${dp.dp_number || `DP-${dp.id}`} - ${dp.shop_name || 'No shop'}`;
};

export function CreateGRN() {
  const router = useRouter();
  const [grnMode, setGrnMode] = useState('work_order'); // 'work_order' | 'direct_purchase'
  const [form, setForm] = useState({
    workOrder: '',
    directPurchase: null,
    supplier: '',
    receiptDate: '',
    deliveryNoteNumber: '',
    invoiceNumber: '',
    invoiceAmount: '',
    remarks: '',
    directVendorName: '',
    directVendorEmail: '',
    directVendorPhone: '',
    directVendorAddress: '',
    receiveLocation: null,
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [workOrderInput, setWorkOrderInput] = useState('');
  const [dpInput, setDpInput] = useState('');
  const [showDocSidebar, setShowDocSidebar] = useState(false);
  const [fullWorkOrder, setFullWorkOrder] = useState(null);
  const [loadingFullWO, setLoadingFullWO] = useState(false);
  const { trigger: createGRN, isMutating: submitting } = useCreateMutation(
    endpoints.procurement_management.grns
  );

  const { data: workOrderResponse } = useGetRequest(
    `${endpoints.procurement_management.work_orders_lean}?pagination=false&status=Approved&vendor_status=accepted`
  );
  const { data: supplierResponse } = useGetRequest(
    `${endpoints.procurement_management.suppliers}?pagination=false`
  );
  const { data: officeResponse } = useGetRequest(
    `${endpoints.procurement_management.office_management}?pagination=false`
  );
  const { data: dpResponse } = useGetRequest(
    `${endpoints.procurement_management.direct_purchases}?pagination=false&status=Approved`
  );

  const workOrders = useMemo(() => toList(workOrderResponse), [workOrderResponse]);
  const suppliers = useMemo(() => toList(supplierResponse), [supplierResponse]);
  const approvedDPs = useMemo(() => toList(dpResponse), [dpResponse]);
  const officeLocations = useMemo(() => toList(officeResponse), [officeResponse]);

  const selectedWorkOrder = useMemo(() => {
    const lean = workOrders.find((item) => String(item.id) === String(form.workOrder));
    if (fullWorkOrder && String(fullWorkOrder.id) === String(form.workOrder)) {
      return { ...lean, ...fullWorkOrder };
    }
    return lean;
  }, [form.workOrder, workOrders, fullWorkOrder]);

  const getWorkOrderReceivedQuantity = (item) =>
    item?.received_quantity ??
    item?.delivered ??
    item?.delivered_quantity ??
    item?.deliveredQty ??
    item?.quantity ??
    item?.qty ??
    item?.ordered_quantity ??
    item?.orderedQty ??
    0;

  useEffect(() => {
    if (!form.workOrder) {
      setWorkOrderInput('');
      return;
    }

    if (selectedWorkOrder) {
      setWorkOrderInput(getWorkOrderLabel(selectedWorkOrder));
    }
  }, [form.workOrder, selectedWorkOrder]);

  const totalReceivedValue = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + numericValue(item.received_quantity) * numericValue(item.unit_price),
        0
      ),
    [items]
  );

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleModeSwitch = (mode) => {
    setGrnMode(mode);
    setForm((current) => ({
      ...current,
      workOrder: '',
      directPurchase: null,
      supplier: '',
      invoiceAmount: '',
      directVendorName: '',
      directVendorEmail: '',
      directVendorPhone: '',
      directVendorAddress: '',
    }));
    setItems([{ ...EMPTY_ITEM }]);
    setWorkOrderInput('');
    setDpInput('');
  };

  const handleDPChange = (dp) => {
    setForm((current) => ({
      ...current,
      directPurchase: dp || null,
      invoiceAmount: dp ? asText(dp.total_amount ?? dp.totalAmount ?? '') : '',
    }));
    setItems(
      dp?.dp_items?.length
        ? dp.dp_items.map((item) => {
            const orderedQty = asText(item.quantity ?? 0);
            const { accepted, rejected } = calculateAcceptedRejected(orderedQty, orderedQty);
            return {
              description: item.description || '',
              ordered_quantity: orderedQty,
              received_quantity: orderedQty,
              accepted_quantity: accepted,
              rejected_quantity: rejected,
              unit_price: asText(item.unit_price ?? 0),
              condition: 'Good',
              remarks: item.specification || '',
            };
          })
        : [{ ...EMPTY_ITEM }]
    );
  };

  const handleWorkOrderChange = useCallback(
    async (value) => {
      const leanWO = workOrders.find((item) => String(item.id) === String(value));

      // Immediately set basic form fields from lean data for instant feedback
      setForm((current) => ({
        ...current,
        workOrder: value ? String(value) : '',
        supplier: leanWO?.vendor?.id ? String(leanWO.vendor.id) : '',
        invoiceAmount: leanWO
          ? asText(leanWO?.totalAmount ?? leanWO?.total_amount ?? '')
          : '',
        directVendorName: '',
        directVendorEmail: '',
        directVendorPhone: '',
        directVendorAddress: '',
      }));

      if (!value) {
        setFullWorkOrder(null);
        setItems([{ ...EMPTY_ITEM }]);
        return;
      }

      // Fetch full work order details (items, attachments, vendor details)
      setLoadingFullWO(true);
      try {
        const response = await axiosInstance.get(
          endpoints.procurement_management.work_order_full(value)
        );
        const fullWO = response?.data || response;
        setFullWorkOrder(fullWO);

        const isDirectEvaluationVendor = Boolean(
          fullWO && (!fullWO.vendor?.id || fullWO.vendor?.is_direct_evaluation)
        );

        // Update form with full work order data
        setForm((current) => ({
          ...current,
          workOrder: String(value),
          supplier: fullWO?.vendor?.id ? String(fullWO.vendor.id) : '',
          invoiceAmount: fullWO
            ? asText(fullWO?.totalAmount ?? fullWO?.total_amount ?? fullWO?.net_amount ?? '')
            : '',
          directVendorName: isDirectEvaluationVendor ? fullWO.vendor?.name || '' : '',
          directVendorEmail: isDirectEvaluationVendor ? fullWO.vendor?.email || '' : '',
          directVendorPhone: isDirectEvaluationVendor ? fullWO.vendor?.phone || '' : '',
          directVendorAddress: isDirectEvaluationVendor ? fullWO.vendor?.address || '' : '',
        }));

        // Populate items from full work order
        setItems(
          fullWO?.items?.length
            ? fullWO.items.map((item) => {
                const orderedQuantity = asText(getWorkOrderItemQuantity(item));
                const receivedQuantity = asText(
                  getWorkOrderReceivedQuantity(item) || getWorkOrderItemQuantity(item)
                );
                const { accepted, rejected } = calculateAcceptedRejected(
                  orderedQuantity,
                  receivedQuantity
                );
                return {
                  description: getWorkOrderItemName(item),
                  ordered_quantity: orderedQuantity,
                  received_quantity: receivedQuantity,
                  accepted_quantity: accepted,
                  rejected_quantity: rejected,
                  unit_price: asText(getWorkOrderItemUnitPrice(item)),
                  condition: 'Good',
                  remarks: item.specification || item.specifications || '',
                };
              })
            : [{ ...EMPTY_ITEM }]
        );
      } catch (error) {
        toast.error('Failed to load work order details. Please try again.');
        setFullWorkOrder(null);
        setItems([{ ...EMPTY_ITEM }]);
      } finally {
        setLoadingFullWO(false);
      }
    },
    [workOrders]
  );

  const updateItem = (index, field, value) => {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const next = { ...item, [field]: value };

        if (field === 'received_quantity' || field === 'ordered_quantity') {
          const { accepted, rejected } = calculateAcceptedRejected(
            next.ordered_quantity,
            next.received_quantity
          );
          next.accepted_quantity = accepted;
          next.rejected_quantity = rejected;

          if (numericValue(rejected) > 0) {
            next.condition = 'Partial';
          } else if (next.condition === 'Partial') {
            next.condition = 'Good';
          }
        }

        return next;
      })
    );
  };

  const addItem = () => setItems((current) => [...current, { ...EMPTY_ITEM }]);

  const removeItem = (index) => {
    setItems((current) =>
      current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const handleSubmit = async () => {
    if (grnMode === 'work_order') {
      if (
        !form.workOrder ||
        (!form.supplier && !form.directVendorName) ||
        !form.receiptDate ||
        !form.receiveLocation
      ) {
        toast.error(
          'Work order, supplier/direct vendor, receipt date, and goods receive location are required.'
        );
        return;
      }
    } else if (!form.directPurchase || !form.receiptDate || !form.receiveLocation) {
      toast.error('Direct purchase, receipt date, and goods receive location are required.');
      return;
    }

    try {
      const payload = {
        ...(grnMode === 'work_order'
          ? { work_order: Number(form.workOrder) }
          : { direct_purchase: form.directPurchase?.id || null }),
        supplier: form.supplier ? Number(form.supplier) : null,
        direct_vendor_name:
          grnMode === 'direct_purchase'
            ? form.directPurchase?.shop_name || null
            : form.directVendorName?.trim() || null,
        direct_vendor_email: form.directVendorEmail?.trim() || null,
        direct_vendor_phone: form.directVendorPhone?.trim() || null,
        direct_vendor_address: form.directVendorAddress?.trim() || null,
        receipt_date: form.receiptDate,
        delivery_note_number: form.deliveryNoteNumber,
        invoice_number: form.invoiceNumber,
        invoice_amount: numericValue(form.invoiceAmount || totalReceivedValue),
        remarks: form.remarks,
        receive_location: form.receiveLocation?.id || null,
        grn_items: items.map((item) => ({
          ...(() => {
            const { accepted, rejected } = calculateAcceptedRejected(
              item.ordered_quantity,
              item.received_quantity
            );
            return {
              accepted_quantity: numericValue(accepted),
              rejected_quantity: numericValue(rejected),
            };
          })(),
          ordered_quantity: numericValue(item.ordered_quantity),
          received_quantity: numericValue(item.received_quantity),
          unit_price: numericValue(item.unit_price),
          condition: item.condition,
          remarks: buildItemRemarks(item),
        })),
      };

      const grn = await createGRN(payload);
      const grnId = extractEntityId(grn);

      if (grnId) {
        await patchRequest(endpoints.procurement_management.grn_by_id(grnId), {
          status: 'Pending Verification',
        });
      }

      await Promise.all([
        mutate(endpoints.procurement_management.grn_summary),
        mutate(`${endpoints.procurement_management.grns}?pagination=false`),
      ]);

      toast.success('GRN created successfully. Redirecting to pending verification.');
      router.push(paths.dashboard.procurement.grn.pendingVerification);
    } catch (error) {
      toast.error(extractErrorMessage(error?.response?.data || error));
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href={paths.dashboard.procurement.grn.list}>
          <button type="button" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">Create Goods Receive Note</h1>
          <p className="text-muted-foreground text-sm">
            Record goods received against a work order or direct purchase.
          </p>
        </div>
        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          {grnMode === 'work_order' && selectedWorkOrder && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDocSidebar(true)}
              className="hidden sm:inline-flex"
              disabled={loadingFullWO}
            >
              {loadingFullWO ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-1.5" />
              )}
              {loadingFullWO ? 'Loading...' : 'View Document Information'}
            </Button>
          )}
          <div className="flex items-center rounded-lg border border-input overflow-hidden">
            <button
              type="button"
              onClick={() => handleModeSwitch('work_order')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                grnMode === 'work_order'
                  ? 'bg-primary text-white'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              Work Order
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('direct_purchase')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-l border-input ${
                grnMode === 'direct_purchase'
                  ? 'bg-primary text-white'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              Direct Purchase
            </button>
          </div>
        </div>
      </div>

      <Card className="mb-6 border-primary bg-primary/5">
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              All GRNs except Verified status are listed here for verification follow-up.
              <p className="text-xs text-muted-foreground mb-1">
                {grnMode === 'direct_purchase' ? 'Direct Purchase' : 'Work Order'}
              </p>
              <p className="font-semibold text-foreground">
                {grnMode === 'direct_purchase'
                  ? form.directPurchase?.dp_number || 'Not selected'
                  : selectedWorkOrder?.workOrderNumber ||
                    selectedWorkOrder?.wo_number ||
                    'Not selected'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {grnMode === 'direct_purchase' ? 'Shop / Seller' : 'Supplier'}
              </p>
              <p className="font-semibold text-foreground">
                {grnMode === 'direct_purchase'
                  ? form.directPurchase?.shop_name || 'Not selected'
                  : selectedWorkOrder?.vendor?.name ||
                    form.directVendorName ||
                    suppliers.find((item) => String(item.id) === String(form.supplier))?.name ||
                    'Not selected'}
              </p>
              {grnMode === 'work_order' &&
                selectedWorkOrder &&
                (!selectedWorkOrder.vendor?.id ||
                  selectedWorkOrder.vendor?.is_direct_evaluation) && (
                  <p className="text-xs text-warning mt-1">
                    This GRN will use the direct evaluation vendor info from the selected work
                    order.
                  </p>
                )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Received Value</p>
              <p className="text-2xl font-bold text-primary">{formatBDT(totalReceivedValue)}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader
          title="Receipt Details"
          description="Identify the work order or direct purchase, and delivery references"
        />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {grnMode === 'work_order' ? (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Work Order <span className="text-red-500">*</span>
                </label>
                <Autocomplete
                  options={workOrders}
                  value={selectedWorkOrder || null}
                  inputValue={workOrderInput}
                  onInputChange={(_, value) => setWorkOrderInput(value)}
                  onChange={(_, newValue) => handleWorkOrderChange(newValue?.id || '')}
                  getOptionLabel={(option) => getWorkOrderLabel(option)}
                  isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
                  noOptionsText="No matching work orders found"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search work order by number or vendor"
                      variant="outlined"
                      size="small"
                    />
                  )}
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Direct Purchase Code <span className="text-red-500">*</span>
                </label>
                <Autocomplete
                  options={approvedDPs}
                  value={form.directPurchase}
                  inputValue={dpInput}
                  onInputChange={(_, value) => setDpInput(value)}
                  onChange={(_, newValue) => handleDPChange(newValue)}
                  getOptionLabel={(option) => getDPLabel(option)}
                  isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
                  noOptionsText="No approved direct purchases found"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search by DP code or shop name"
                      variant="outlined"
                      size="small"
                    />
                  )}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {grnMode === 'direct_purchase' ? 'Shop / Seller' : 'Supplier'}
                {grnMode === 'work_order' && <span className="text-red-500"> *</span>}
              </label>
              {grnMode === 'direct_purchase' ? (
                <input
                  type="text"
                  readOnly
                  value={form.directPurchase?.shop_name || ''}
                  placeholder="Auto-filled from direct purchase"
                  className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
                />
              ) : (
                <select
                  value={form.supplier}
                  onChange={(event) => updateForm('supplier', event.target.value)}
                  disabled={Boolean(
                    selectedWorkOrder &&
                    (!selectedWorkOrder.vendor?.id ||
                      selectedWorkOrder.vendor?.is_direct_evaluation)
                  )}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Receipt Date <span className="text-red-500">*</span>
              </label>
              <DatePicker
                format="DD/MM/YYYY"
                value={form.receiptDate ? dayjs(form.receiptDate) : null}
                onChange={(newValue) =>
                  updateForm(
                    'receiptDate',
                    newValue && dayjs(newValue).isValid()
                      ? dayjs(newValue).format('YYYY-MM-DD')
                      : ''
                  )
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    placeholder: 'Select receipt date',
                    required: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        backgroundColor: 'background.paper',
                      },
                      '& .MuiOutlinedInput-input': {
                        py: '8.5px',
                      },
                    },
                  },
                  openPickerButton: {
                    edge: 'end',
                  },
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Delivery Note Number
              </label>
              <input
                type="text"
                value={form.deliveryNoteNumber}
                onChange={(event) => updateForm('deliveryNoteNumber', event.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Invoice Number
              </label>
              <input
                type="text"
                value={form.invoiceNumber}
                onChange={(event) => updateForm('invoiceNumber', event.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Invoice Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.invoiceAmount}
                onChange={(event) => updateForm('invoiceAmount', event.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Goods Receive Location <span className="text-destructive">*</span>
              </label>
              <Autocomplete
                options={officeLocations}
                value={form.receiveLocation}
                onChange={(_, newValue) => updateForm('receiveLocation', newValue)}
                getOptionLabel={(option) => option?.name || ''}
                isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
                noOptionsText="No office locations found"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select receive location"
                    variant="outlined"
                    size="small"
                    error={!form.receiveLocation}
                    helperText={!form.receiveLocation ? 'Receive location is required' : ''}
                  />
                )}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Receipt Remarks
            </label>
            <textarea
              rows={3}
              value={form.remarks}
              onChange={(event) => updateForm('remarks', event.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Notes about the delivery, partial receipts, or visible issues"
            />
          </div>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              GRN Items
              {loadingFullWO && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </span>
          }
          description={loadingFullWO ? 'Loading work order items...' : 'Capture quantities received and their initial condition'}
        />
        <CardBody>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={`item-${index}`}
                className="grid grid-cols-1 md:grid-cols-[1.6fr_120px_120px_120px_120px_140px_140px_auto] gap-3 items-end"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(event) => updateItem(index, 'description', event.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Ordered</label>
                  <input
                    type="number"
                    min="0"
                    value={item.ordered_quantity}
                    onChange={(event) => updateItem(index, 'ordered_quantity', event.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Received</label>
                  <input
                    type="number"
                    min="0"
                    value={item.received_quantity}
                    onChange={(event) => updateItem(index, 'received_quantity', event.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Accepted</label>
                  <input
                    type="number"
                    min="0"
                    value={item.accepted_quantity}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Rejected</label>
                  <input
                    type="number"
                    min="0"
                    value={item.rejected_quantity}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Unit Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(event) => updateItem(index, 'unit_price', event.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Condition
                  </label>
                  <select
                    value={item.condition}
                    onChange={(event) => updateItem(index, 'condition', event.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Good">Good</option>
                    <option value="Partial">Partial</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => removeItem(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div className="md:col-span-8">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Item Notes
                  </label>
                  <input
                    type="text"
                    value={item.remarks}
                    onChange={(event) => updateItem(index, 'remarks', event.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Condition notes, batch details, or discrepancies"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between items-center gap-3 flex-wrap">
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              Add Item
            </Button>
            <Badge variant="outline">Received value {formatBDT(totalReceivedValue)}</Badge>
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href={paths.dashboard.procurement.grn.list}>
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button type="button" onClick={handleSubmit} disabled={submitting}>
          <Save className="w-4 h-4 mr-2" />
          {submitting ? 'Saving...' : 'Create GRN'}
        </Button>
      </div>

      {/* Mobile View Document Information button */}
      {grnMode === 'work_order' && selectedWorkOrder && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:hidden z-30">
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={() => setShowDocSidebar(true)}
            className="shadow-lg"
            disabled={loadingFullWO}
          >
            {loadingFullWO ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            {loadingFullWO ? 'Loading...' : 'View Document Information'}
          </Button>
        </div>
      )}

      {/* Document Info Sidebar */}
      {showDocSidebar && grnMode === 'work_order' && selectedWorkOrder && (
        <DocumentInfoSidebar
          workOrder={selectedWorkOrder}
          attachments={fullWorkOrder?.attachments || selectedWorkOrder?.attachments || []}
          onClose={() => setShowDocSidebar(false)}
        />
      )}
    </div>
  );
}
