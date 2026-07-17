'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMemo, useEffect, useState } from 'react';
import {
  Save,
  Send,
  Trash2,
  Upload,
  Copy,
  Plus,
  Settings,
  ArrowLeft,
  Loader2,
  FileText,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
import { DatePicker } from '../../components/ui/date-picker';

function formatBDT(amount) {
  const num = Number(amount) || 0;
  if (num >= 10000000) return `৳${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `৳${(num / 100000).toFixed(2)} Lakh`;
  return `৳${num.toLocaleString('en-IN')}`;
}

const tcTemplates = {
  standard: [
    'The Vendor shall deliver the goods/services as per the specifications mentioned in this Work Order.',
    'Delivery must be completed on or before the delivery deadline specified above.',
    'Quality inspection will be conducted upon delivery at AAB designated location.',
    'Payment will be processed within 30 days from delivery after successful GRN (Goods Received Note) and invoice verification.',
    "Any defective items must be replaced at Vendor's cost within 7 business days.",
    'VAT (15%) and AIT (3.5%) will be deducted at source as per NBR regulations.',
    'Installation and setup services are included where applicable.',
    'All items must comply with original quotation and CS specifications.',
    'Transportation and handling are the responsibility of the Vendor.',
    'Any modifications require written approval from AAB Procurement.',
  ],
  services: [
    'The Vendor shall provide services as per the scope defined in the Work Order.',
    'Service delivery must adhere to the agreed timeline and milestones.',
    'Quality of service will be evaluated against AAB standard benchmarks.',
    'Payment will be milestone-based after satisfactory completion and sign-off.',
    'Vendor must maintain valid trade license and relevant certifications throughout the contract.',
    'VAT (15%) and AIT (10%) will be deducted at source as per NBR regulations for services.',
    'Vendor staff must comply with AAB code of conduct and safety regulations.',
    'Confidentiality of AAB data and information must be maintained.',
    'Any subcontracting requires prior written approval from AAB.',
    'Either party may terminate with 30-day written notice for breach of terms.',
  ],
  rental: [
    'The Vendor shall provide rental items/vehicles as per the specifications in this Work Order.',
    'Rental period starts from the delivery/handover date as stated above.',
    "All maintenance and servicing during the rental period is the Vendor's responsibility.",
    'Payment will be processed monthly after satisfactory service verification.',
    'Replacement must be provided within 24 hours in case of breakdown or defect.',
    'VAT (15%) and AIT (3.5%) will be deducted at source as per NBR regulations.',
    'Insurance and registration must be maintained by the Vendor throughout the rental period.',
    'Fuel and tolls are the responsibility of AAB unless stated otherwise.',
    'Any damage due to Vendor negligence will be deducted from rental charges.',
    'Either party may terminate with 15-day written notice.',
  ],
};

export function EditWorkOrder() {
  const router = useRouter();
  const params = useParams();
  const woId = params?.id;

  const [selectedAwardId, setSelectedAwardId] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingWo, setLoadingWo] = useState(true);

  // Fetch existing work order
  const { data: woData, loading: woLoading } = useGetRequest(
    woId ? endpoints.procurement_management.work_order_by_id(woId) : null
  );

  // Fetch awards for reference
  const { data: awardsData, loading: awardsLoading } = useGetRequest(
    endpoints.procurement_management.accepted_awards
  );
  const awardsList = Array.isArray(awardsData?.results)
    ? awardsData.results
    : Array.isArray(awardsData)
      ? awardsData
      : [];

  const { register, getValues, setValue, watch, control, reset } = useForm({
    defaultValues: {
      title: '',
      category: '',
      requisitionNumber: '',
      rfqNumber: '',
      csNumber: '',
      awardId: '',
      vendorDbId: '',
      vendorId: '',
      vendorName: '',
      vendorEmail: '',
      vendorPhone: '',
      vendorAddress: '',
      deliveryLocation: 'Ledars NGO\nHouse 8, Road 136, Gulshan-1\nDhaka-1212, Bangladesh',
      deliveryDeadline: '',
      paymentTerms: '30 days after GRN',
      warrantyPeriod: '12 months',
      notes: '',
      tcTemplate: 'standard',
      items: [],
      customTerms: tcTemplates.standard.map((t) => ({ value: t })),
    },
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItemField,
    replace: replaceItems,
  } = useFieldArray({ control, name: 'items' });

  const {
    fields: termFields,
    append: appendTerm,
    remove: removeTermField,
    replace: replaceTerms,
  } = useFieldArray({ control, name: 'customTerms' });

  const formData = watch();
  const items = formData.items ?? [];
  const customTerms = (formData.customTerms ?? []).map((t) => t.value);

  // Pre-populate form when work order data loads
  useEffect(() => {
    if (woData && !woLoading) {
      const wo = woData;
      reset({
        title: wo.title || '',
        category: wo.category || '',
        requisitionNumber: wo.requisitionNumber || '',
        rfqNumber: wo.rfqNumber || '',
        csNumber: wo.csNumber || '',
        awardId: wo.award?.id ? String(wo.award.id) : '',
        vendorDbId: wo.vendor?.id ? String(wo.vendor.id) : '',
        vendorId: '',
        vendorName: wo.vendor?.name || '',
        vendorEmail: wo.vendor?.email || '',
        vendorPhone: wo.vendor?.phone || '',
        vendorAddress: wo.vendor?.address || '',
        deliveryLocation: wo.deliveryLocation || wo.delivery_address || '',
        deliveryDeadline: wo.deliveryDeadline || wo.delivery_date || '',
        paymentTerms: wo.paymentTerms || wo.payment_terms || '30 days after GRN',
        warrantyPeriod: wo.warrantyPeriod || wo.warranty_period || '12 months',
        notes: wo.notes || wo.special_instructions || '',
        tcTemplate: wo.tcTemplate || wo.tc_template || 'standard',
        items: (wo.items || []).map((item, idx) => ({
          id: String(item.id || idx + 1),
          description: item.description || item.name || '',
          specification: item.specification || '',
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          total: Number(item.total) || 0,
          source: 'wo',
        })),
        customTerms: wo.termsAndConditions
          ? (typeof wo.termsAndConditions === 'string'
              ? wo.termsAndConditions.split('\n')
              : Array.isArray(wo.termsAndConditions)
                ? wo.termsAndConditions
                : []
            ).filter(Boolean).map((t) => ({ value: t }))
          : tcTemplates.standard.map((t) => ({ value: t })),
      });
      setSelectedAwardId(wo.award?.id ? String(wo.award.id) : '');
      setLoadingWo(false);
    }
  }, [woData, woLoading, reset]);

  const handleInputChange = (field, value) => setValue(field, value);

  const handleTemplateChange = (template) => {
    setValue('tcTemplate', template);
    replaceTerms(tcTemplates[template].map((t) => ({ value: t })));
  };

  const handleTermChange = (index, value) => setValue(`customTerms.${index}.value`, value);

  const addTerm = () => appendTerm({ value: '' });

  const removeTerm = (index) => {
    if (termFields.length > 1) removeTermField(index);
  };

  const handleItemChange = (id, field, value) => {
    const idx = items.findIndex((it) => it.id === id);
    if (idx === -1) return;
    const updated = { ...items[idx], [field]: value };
    if (field === 'quantity' || field === 'unitPrice')
      updated.total = updated.quantity * updated.unitPrice;
    setValue(`items.${idx}`, updated);
  };

  const addItem = () => {
    const newId = items.length > 0
      ? (Math.max(...items.map((i) => parseInt(i.id))) + 1).toString()
      : '1';
    appendItem({
      id: newId,
      description: '',
      specification: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      source: 'manual',
    });
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      const idx = items.findIndex((it) => it.id === id);
      if (idx !== -1) removeItemField(idx);
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files)
      setAttachments((prev) => [
        ...prev,
        ...Array.from(e.target.files).map((file) => ({ file, type: 'general' })),
      ]);
  };

  const removeAttachment = (index) => setAttachments((prev) => prev.filter((_, i) => i !== index));

  const calculateTotal = () => items.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleSubmit = async (status) => {
    setSubmitting(true);
    try {
      const values = getValues();
      const isDraft = status === 'draft';

      const payload = {
        ...(values.awardId && { award: parseInt(values.awardId, 10) }),
        ...(values.vendorDbId && { vendor: parseInt(values.vendorDbId, 10) }),
        title: values.title,
        category: values.category,
        delivery_date: values.deliveryDeadline,
        delivery_address: values.deliveryLocation,
        payment_terms: values.paymentTerms,
        warranty_period: values.warrantyPeriod,
        tc_template: values.tcTemplate,
        terms_and_conditions: (values.customTerms ?? []).map((t) => t.value).join('\n'),
        special_instructions: values.notes,
        status: isDraft ? 'Draft' : 'Pending Approval',
        approval_status: isDraft ? 'draft' : 'pending-approval',
      };

      // PUT to update existing work order
      await axiosInstance.put(
        endpoints.procurement_management.work_order_by_id(woId),
        payload
      );

      // Update items: delete existing and recreate
      if (values.items?.length > 0) {
        // Delete existing items
        try {
          const existingItems = await axiosInstance.get(
            `${endpoints.procurement_management.work_order_items}?work_order=${woId}`
          );
          const existingItemsList = existingItems.data?.results || existingItems.data || [];
          if (Array.isArray(existingItemsList)) {
            await Promise.all(
              existingItemsList.map((item) =>
                axiosInstance.delete(endpoints.procurement_management.work_order_item_by_id(item.id))
              )
            );
          }
        } catch (e) {
          // Items might not exist or endpoint might not support list filtering
        }

        // Create new items
        const awardPk = values.awardId ? parseInt(values.awardId, 10) : null;
        await Promise.all(
          values.items.map((item) =>
            axiosInstance.post(endpoints.procurement_management.work_order_items, {
              work_order: parseInt(woId, 10),
              item: awardPk,
              description: item.description,
              specification: item.specification || '',
              delivered: 0,
              item_delivery_status: 'pending',
            })
          )
        );
      }

      // Upload new attachments
      if (attachments.length > 0 && woData?.workOrderNumber) {
        await Promise.all(
          attachments.map((att) => {
            const fd = new FormData();
            fd.append('work_order_number', woData.workOrderNumber);
            fd.append('file', att.file);
            fd.append('name', att.file.name);
            return axiosInstance.post(endpoints.procurement_management.work_order_attachments, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          })
        );
      }

      toast.success(
        isDraft ? 'Work Order updated as draft.' : 'Work Order updated and submitted for approval.'
      );
      router.push('/dashboard/procurement/work-orders/pending');
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.detail ||
          err?.message ||
          'Failed to update Work Order. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = () => handleSubmit('draft');
  const handleSubmitForApproval = () => handleSubmit('pending-approval');

  if (woLoading || loadingWo) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground">Loading work order...</p>
        </div>
      </div>
    );
  }

  if (!woData) {
    return (
      <div className="p-4 md:p-6 lg:p-8 text-center">
        <p className="text-muted-foreground mb-4">Work order not found.</p>
        <Link href={paths.dashboard.procurement.workOrders.list}>
          <Button variant="outline">Back to List</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link href={paths.dashboard.procurement.workOrders.pendingApprovals}>
            <button type="button" className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Edit Work Order</h1>
            <p className="text-muted-foreground">
              Editing {woData.workOrderNumber || 'Work Order'} &mdash; {woData.title || 'No Title'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Award Reference (read-only in edit mode) */}
          {selectedAwardId && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader
                title="Source Award"
                description="This work order was generated from an approved award"
              />
              <CardBody>
                <div className="p-3 bg-success/5 border border-success/20 rounded-lg text-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-muted-foreground">
                    <span>CS: {formData.csNumber || '---'}</span>
                    <span>RFQ: {formData.rfqNumber || '---'}</span>
                    <span>Vendor: {formData.vendorName || '---'}</span>
                    <span>Items: {items.length}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Basic Info */}
          <Card>
            <CardHeader
              title="Basic Information"
              description="Work order details — edit as needed"
            />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Work Order Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    disabled
                    className="w-full px-3 py-2 border border-input rounded-lg bg-muted/50 text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    disabled
                    className="w-full px-3 py-2 border border-input rounded-lg bg-muted/50 text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    WO Number
                  </label>
                  <input
                    type="text"
                    value={woData.workOrderNumber || '---'}
                    disabled
                    className="w-full px-3 py-2 border border-input rounded-lg bg-muted/30 text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    CS Number
                  </label>
                  <input
                    type="text"
                    value={formData.csNumber}
                    disabled
                    className="w-full px-3 py-2 border border-input rounded-lg bg-muted/30 text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    MRF Number
                  </label>
                  <input
                    type="text"
                    value={formData.requisitionNumber}
                    disabled
                    className="w-full px-3 py-2 border border-input rounded-lg bg-muted/30 text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    RFQ Number
                  </label>
                  <input
                    type="text"
                    value={formData.rfqNumber}
                    disabled
                    className="w-full px-3 py-2 border border-input rounded-lg bg-muted/30 text-muted-foreground"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Vendor Information */}
          <Card>
            <CardHeader title="Vendor Information" description="Auto-filled from award" />
            <CardBody>
              <div className="space-y-4">
                {formData.vendorName ? (
                  <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                    <h3 className="font-semibold text-foreground">{formData.vendorName}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm text-foreground">{formData.vendorEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm text-foreground">{formData.vendorPhone}</p>
                      </div>
                      <div className="col-span-full">
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="text-sm text-foreground">{formData.vendorAddress}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No vendor information available.</p>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader
              title="Work Order Items"
              description={`${items.length} items — edit quantities and prices as needed`}
              action={
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              }
            />
            <CardBody>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-foreground">Item {index + 1}</h4>
                      {items.length > 1 && item.source !== 'wo' && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-error hover:bg-error/10 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="col-span-full">
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Item Name *
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          disabled={item.source === 'wo'}
                          placeholder="Item name"
                          className={`w-full px-3 py-2 border border-input rounded-lg ${item.source === 'wo' ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-primary'}`}
                        />
                      </div>
                      <div className="col-span-full">
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Specifications
                        </label>
                        <textarea
                          value={item.specification}
                          onChange={(e) =>
                            handleItemChange(item.id, 'specification', e.target.value)
                          }
                          disabled={item.source === 'wo'}
                          placeholder="Technical specifications"
                          rows={2}
                          className={`w-full px-3 py-2 border border-input rounded-lg resize-none ${item.source === 'wo' ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-primary'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)
                          }
                          disabled={item.source === 'wo'}
                          min="1"
                          className={`w-full px-3 py-2 border border-input rounded-lg ${item.source === 'wo' ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-primary'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Unit Price (BDT) *
                        </label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                          }
                          disabled={item.source === 'wo'}
                          min="0"
                          step="0.01"
                          className={`w-full px-3 py-2 border border-input rounded-lg ${item.source === 'wo' ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-primary'}`}
                        />
                      </div>
                      <div className="col-span-full">
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm font-medium text-foreground">Item Total:</span>
                          <span className="text-lg font-semibold text-primary">
                            {formatBDT(item.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <span className="font-semibold text-foreground">
                    Grand Total (excl. VAT/AIT):
                  </span>
                  <span className="text-xl font-semibold text-primary">
                    {formatBDT(calculateTotal())}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Delivery */}
          <Card>
            <CardHeader title="Delivery Information" description="AAB office delivery locations" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Delivery Location *
                  </label>
                  <textarea
                    value={formData.deliveryLocation}
                    onChange={(e) => handleInputChange('deliveryLocation', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Delivery Deadline *
                  </label>
                  <DatePicker
                    value={formData.deliveryDeadline}
                    onChange={(date) => handleInputChange('deliveryDeadline', date)}
                    placeholder="Select delivery deadline"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Terms & Conditions */}
          <Card>
            <CardHeader
              title="Terms & Conditions"
              description="AAB standard templates with customization"
              action={
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={formData.tcTemplate}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="text-sm px-2 py-1 border border-input rounded-lg"
                  >
                    <option value="standard">Standard Goods</option>
                    <option value="services">Services</option>
                    <option value="rental">Rental/Lease</option>
                  </select>
                </div>
              }
            />
            <CardBody>
              <div className="space-y-3">
                <div className="p-2 bg-muted/30 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
                  <Copy className="w-3 h-3" />
                  <span>
                    Template:{' '}
                    {formData.tcTemplate === 'standard'
                      ? 'Standard Goods'
                      : formData.tcTemplate === 'services'
                        ? 'Services'
                        : 'Rental/Lease'}{' '}
                    &mdash; Edit terms below or add custom clauses
                  </span>
                </div>
                {termFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <span className="text-xs font-semibold text-muted-foreground mt-2 min-w-6">
                      {index + 1}.
                    </span>
                    <textarea
                      value={customTerms[index] ?? ''}
                      onChange={(e) => handleTermChange(index, e.target.value)}
                      rows={2}
                      className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                    />
                    {termFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTerm(index)}
                        className="text-error hover:bg-error/10 p-1 rounded mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addTerm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Term
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Payment & Warranty */}
          <Card>
            <CardHeader title="Payment & Warranty Terms" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Payment Terms *
                  </label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="30 days after GRN">30 days after GRN</option>
                    <option value="45 days after GRN">45 days after GRN</option>
                    <option value="60 days after GRN">60 days after GRN</option>
                    <option value="Milestone-based">Milestone-based</option>
                    <option value="50% advance, 50% on delivery">
                      50% advance, 50% on delivery
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Warranty Period
                  </label>
                  <select
                    value={formData.warrantyPeriod}
                    onChange={(e) => handleInputChange('warrantyPeriod', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="6 months">6 months</option>
                    <option value="12 months">12 months</option>
                    <option value="18 months">18 months</option>
                    <option value="24 months">24 months</option>
                    <option value="36 months">36 months</option>
                    <option value="N/A">N/A (Services)</option>
                  </select>
                </div>
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any additional instructions..."
                    rows={3}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Work Order Info" />
            <CardBody>
              <div className="space-y-3">
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">WO Number</p>
                  <p className="text-lg font-bold text-primary">
                    {woData.workOrderNumber || '---'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge variant={woData.status?.toLowerCase() === 'draft' ? 'warning' : 'default'}>
                    {woData.status || 'Draft'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Approval Status</p>
                  <p className="text-sm font-medium text-foreground">
                    {woData.approvalStatus || 'draft'}
                  </p>
                </div>
                {selectedAwardId && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Source Award</p>
                    <p className="text-sm font-medium text-primary">Award #{selectedAwardId}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Summary" />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Items</p>
                  <p className="text-xl font-semibold text-foreground">{items.length}</p>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                  <p className="text-2xl font-semibold text-primary">
                    {formatBDT(calculateTotal())}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Attachments" />
            <CardBody>
              <div className="space-y-3">
                {/* Existing Documents */}
                {woData?.attachments?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Existing Documents</p>
                    {woData.attachments.map((att, index) => (
                      <div
                        key={att.id || index}
                        className="flex items-center justify-between p-2 bg-success/5 border border-success/20 rounded"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-success shrink-0" />
                          <span className="text-sm text-foreground truncate">{att.name || att.file?.split('/').pop() || 'Document'}</span>
                        </div>
                        {att.file_url && (
                          <a
                            href={att.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline shrink-0 ml-2"
                          >
                            View
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* New Uploads */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New Uploads</p>
                    {attachments.map((att, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-primary/5 border border-primary/20 rounded"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Upload className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm text-foreground truncate">{att.file.name}</span>
                        </div>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-error hover:bg-error/10 p-1 rounded shrink-0 ml-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload / Replace Button */}
                <label className="block">
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {woData?.attachments?.length > 0 ? 'Replace or Add Documents' : 'Click to upload files'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC, XLS (Max 10MB)</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                  />
                </label>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={handleSubmitForApproval}
                  disabled={submitting}
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {submitting ? 'Updating...' : 'Update & Submit for Approval'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleSaveDraft}
                  disabled={submitting}
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {submitting ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Link href={paths.dashboard.procurement.workOrders.pendingApprovals}>
                  <Button type="button" variant="outline" size="sm" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
