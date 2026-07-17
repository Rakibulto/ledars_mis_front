'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { Zap, Copy, Plus, Save, Send, Trash2, Upload, Settings, ArrowLeft } from 'lucide-react';

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

// AAB Standard T&C Templates
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

export function CreateWorkOrder() {
  const router = useRouter();
  const [selectedAwardId, setSelectedAwardId] = useState('');
  const [itemsAutoPopulated, setItemsAutoPopulated] = useState(false);
  // Attachments kept as plain state â€” { file: File, type: string }[]
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch only accepted awards for WO creation
  const { data: awardsData, loading: awardsLoading } = useGetRequest(
    endpoints.procurement_management.accepted_awards
  );
  const awardsList = Array.isArray(awardsData?.results)
    ? awardsData.results
    : Array.isArray(awardsData)
      ? awardsData
      : [];

  const { register, getValues, setValue, watch, control } = useForm({
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
      items: [
        {
          id: '1',
          description: '',
          specification: '',
          quantity: 1,
          unitPrice: 0,
          total: 0,
          source: 'manual',
        },
      ],
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

  // â”€â”€ watched values (used in JSX that previously read formData.*) â”€â”€â”€â”€â”€â”€â”€
  const formData = watch();
  // Keep items in sync so calculateTotal() and item JSX work the same way
  const items = formData.items ?? [];
  const customTerms = (formData.customTerms ?? []).map((t) => t.value);

  // â”€â”€ helpers that mirror the old handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleInputChange = (field, value) => setValue(field, value);

  const handleAwardSelect = (awardId) => {
    const award = awardsList.find((a) => String(a.id) === String(awardId));
    if (!award) return;
    setSelectedAwardId(awardId);
    setValue('awardId', String(award.id));
    setValue('vendorDbId', String(award.vendor?.id || ''));
    setValue('vendorName', award.vendor?.name || '');
    setValue('vendorEmail', award.vendor?.email || '');
    setValue('vendorPhone', award.vendor?.phone || '');
    setValue('vendorAddress', award.vendor?.address || '');
    setValue('vendorId', award.vendor_profile ? String(award.vendor_profile) : '');
    setValue('title', award.title || '');
    setValue(
      'category',
      award.category || award.rfq?.category_name || award.rfq?.rfq_category_name || ''
    );
    setValue('csNumber', award.csNumber || '');
    setValue('rfqNumber', award.rfqNumber || '');
    setValue('requisitionNumber', award.requisitionNumber || '');
    // Map items: use award.items[].name as Item Name (stored in description for backend compatibility)
    if (award.items?.length > 0) {
      replaceItems(
        award.items.map((item, idx) => ({
          id: String(idx + 1),
          description: item.name || item.item_name || item.description || '',
          specification: item.specification || '',
          quantity: Number(item.quantity ?? item.qty) || 1,
          unitPrice: Number(item.unitPrice ?? item.unit_price) || 0,
          total: Number(item.total ?? item.total_price) || 0,
          source: 'wo',
        }))
      );
      setItemsAutoPopulated(true);
    }
    // Pre-fill T&C from award if available
    if (award.terms_and_conditions) {
      replaceTerms(
        award.terms_and_conditions
          .split('\n')
          .filter(Boolean)
          .map((t) => ({ value: t }))
      );
    }
  };

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
    const newId = (Math.max(...items.map((i) => parseInt(i.id))) + 1).toString();
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

  // â”€â”€ shared submit function â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSubmit = async (status) => {
    setSubmitting(true);
    try {
      const values = getValues();
      const isDraft = status === 'draft';

      // Build JSON payload matching backend field names
      const payload = {
        ...(values.awardId && { award: parseInt(values.awardId, 10) }),
        ...(values.vendorDbId && { vendor: parseInt(values.vendorDbId, 10) }),
        title: values.title,
        category: values.category,
        order_date: new Date().toISOString().split('T')[0],
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

      const woRes = await axiosInstance.post(endpoints.procurement_management.work_orders, payload);
      console.log('WO creation response:', woRes);
      const wo = woRes.data;

      // POST each item to /api/work-order-items/ using the returned WO id
      // item FK is the Award PK (not a local index), so we pass the award id
      if (values.items?.length > 0 && wo?.id) {
        const awardPk = values.awardId ? parseInt(values.awardId, 10) : null;
        await Promise.all(
          values.items.map((item) =>
            axiosInstance.post(endpoints.procurement_management.work_order_items, {
              work_order: wo.id,
              item: awardPk,
              description: item.description,
              specification: item.specification || '',
              delivered: 0,
              item_delivery_status: 'pending',
            })
          )
        );
      }

      if (attachments.length > 0 && wo?.workOrderNumber) {
        await Promise.all(
          attachments.map((att) => {
            const fd = new FormData();
            fd.append('work_order_number', wo.workOrderNumber);
            fd.append('file', att.file);
            fd.append('name', att.file.name);
            return axiosInstance.post(endpoints.procurement_management.work_order_attachments, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          })
        );
      }

      toast.success(
        status === 'Draft' ? 'Work Order saved as draft.' : 'Work Order submitted for approval.'
      );
      router.push('/dashboard/procurement/work-orders/pending');
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.detail ||
          err?.message ||
          'Failed to save Work Order. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = () => handleSubmit('draft');
  const handleSubmitForApproval = () => handleSubmit('pending-approval');
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link href={paths.dashboard.procurement.workOrders.list}>
            <button type="button" className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Create Work Order</h1>
            <p className="text-muted-foreground">
              Auto-generate WO/PO from approved CS or create manually &mdash; AAB Procurement
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Auto-Generate from CS */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader
              title="Auto-Generate from Approved CS"
              description="Select an approved Comparative Statement to auto-populate WO details"
              action={
                <Badge variant="info">
                  <Zap className="w-3 h-3 mr-1" />
                  Auto
                </Badge>
              }
            />
            <CardBody>
              <select
                value={selectedAwardId}
                onChange={(e) => handleAwardSelect(e.target.value)}
                disabled={awardsLoading}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              >
                <option value="">
                  {awardsLoading
                    ? 'Loading awards...'
                    : 'Select Approved Award to Auto-Generate WO...'}
                </option>
                {awardsList.map((award) => (
                  <option key={award.id} value={award.id}>
                    {award.award_number} &mdash; {award.title} ({award.vendor?.name}) &mdash;{' '}
                    {formatBDT(award.awardedAmount ?? award.awarded_amount ?? 0)}
                  </option>
                ))}
              </select>
              {selectedAwardId && (
                <div className="mt-3 p-3 bg-success/5 border border-success/20 rounded-lg text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-success" />
                    <span className="font-medium text-success">
                      Auto-populated from award #{selectedAwardId} &mdash; vendor, items &amp;
                      prices
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-muted-foreground">
                    <span>CS: {formData.csNumber}</span>
                    <span>RFQ: {formData.rfqNumber}</span>
                    <span>Vendor: {formData.vendorName}</span>
                    <span>Items: {items.length} auto-loaded</span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader
              title="Basic Information"
              description="Linked procurement documents &mdash; auto-numbered WO-AAB-YYYY-NNN"
            />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Work Order Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    disabled={!!selectedAwardId}
                    placeholder="e.g., IT Equipment & Computer Hardware — Dhaka Head Office"
                    className={`w-full px-3 py-2 border border-input rounded-lg ${selectedAwardId ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-primary'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    disabled={!!selectedAwardId}
                    placeholder="e.g., IT Equipment"
                    className={`w-full px-3 py-2 border border-input rounded-lg ${selectedAwardId ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-primary'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    WO Number (Auto)
                  </label>
                  <input
                    type="text"
                    value="WO-AAB-2026-006"
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
                    onChange={(e) => handleInputChange('csNumber', e.target.value)}
                    disabled={!!selectedAwardId}
                    placeholder="e.g., CS-2026-001"
                    className={`w-full px-3 py-2 border border-input rounded-lg ${selectedAwardId ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-primary'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    MRF Number
                  </label>
                  <input
                    type="text"
                    value={formData.requisitionNumber}
                    disabled={!!selectedAwardId}
                    onChange={(e) => handleInputChange('requisitionNumber', e.target.value)}
                    placeholder="e.g., MRF-2026-015"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    RFQ Number
                  </label>
                  <input
                    type="text"
                    value={formData.rfqNumber}
                    onChange={(e) => handleInputChange('rfqNumber', e.target.value)}
                    disabled={!!selectedAwardId}
                    placeholder="e.g., RFQ-2026-015"
                    className={`w-full px-3 py-2 border border-input rounded-lg ${selectedAwardId ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-primary'}`}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Vendor Information */}
          <Card>
            <CardHeader title="Vendor Information" description="Auto-filled from approved CS" />
            <CardBody>
              <div className="space-y-4">
                {formData.vendorId ? (
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
                  <p className="text-sm text-muted-foreground">
                    Select an approved CS above to auto-fill vendor details, or enter manually.
                  </p>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Items */}
          <Card className={itemsAutoPopulated ? 'border-success/30' : ''}>
            <CardHeader
              title="Work Order Items"
              description={
                itemsAutoPopulated
                  ? `${items.length} items auto-populated from RFQ ${formData.rfqNumber} via ${formData.csNumber}`
                  : 'Select an approved CS above to auto-populate items, or add manually'
              }
              action={
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              }
            />
            <CardBody>
              <div className="space-y-4">
                {itemsAutoPopulated && (
                  <div className="p-3 bg-success/5 border border-success/20 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="w-4 h-4 text-success" />
                      <span className="font-medium text-success">
                        {items.length} items auto-populated from awarded vendor&apos;s financial
                        proposal ({formData.csNumber} &rarr; {formData.rfqNumber})
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Auto-populated from award — fields locked
                    </span>
                  </div>
                )}
                {items.map((item, index) => (
                  <div key={item.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-foreground">Item {index + 1}</h4>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={item.source === 'wo'}
                          title={
                            item.source === 'wo'
                              ? 'Auto-populated items cannot be removed'
                              : 'Remove item'
                          }
                          className={`p-1 rounded ${item.source === 'wo' ? 'text-muted-foreground opacity-40 cursor-not-allowed' : 'text-error hover:bg-error/10'}`}
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

          {/* Terms & Conditions - Templated with Customization */}
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
            <CardHeader title="Auto-Numbering" />
            <CardBody>
              <div className="space-y-3">
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Next WO Number</p>
                  <p className="text-lg font-bold text-primary">WO-AAB-2026-006</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Format</p>
                  <p className="text-sm font-medium">WO-AAB-YYYY-NNN</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">PO Number</p>
                  <p className="text-sm font-medium">PO-AAB-2026-006</p>
                </div>
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
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <p className="text-sm font-medium text-foreground">Draft</p>
                </div>
                {selectedAwardId && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-1">Source Award</p>
                    <p className="text-sm font-medium text-primary">Award #{selectedAwardId}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Vendor Notification" />
            <CardBody>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Upon approval, the vendor will be notified through:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                    <span className="w-2 h-2 bg-success rounded-full" />
                    Vendor Portal (automatic)
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                    <span className="w-2 h-2 bg-primary rounded-full" />
                    Email notification
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Attachments" />
            <CardBody>
              <div className="space-y-3">
                <label className="block">
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload files</p>
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
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((att, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted/30 rounded"
                      >
                        <span className="text-sm text-foreground truncate">{att.file.name}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-error hover:bg-error/10 p-1 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  {submitting ? 'Submittingâ€¦' : 'Submit for Approval'}
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
                  {submitting ? 'Savingâ€¦' : 'Save as Draft'}
                </Button>
                <Link href={paths.dashboard.procurement.workOrders.list}>
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
