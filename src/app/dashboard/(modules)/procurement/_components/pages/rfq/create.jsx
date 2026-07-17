'use client';

import dayjs from 'dayjs';
import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRef, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  X,
  Plus,
  Send,
  Star,
  Globe,
  Trash2,
  Upload,
  Shield,
  FileText,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Grid,
  Chip,
  Dialog,
  Select,
  Divider,
  MenuItem,
  TextField,
  InputLabel,
  IconButton,
  DialogTitle,
  FormControl,
  Autocomplete,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePatchRequest,
  useCreateRequest,
  extractErrorMessage,
} from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { PageLoader } from '../../components/ui/loading';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const UNIT_OPTIONS = [
  'Pcs',
  'Set',
  'Box',
  'Kg',
  'Liter',
  'Packet',
  'Ream',
  'Roll',
  'Lot',
  'Job',
  'Sq.ft',
  'Running ft',
];

const EMPTY_EXTRA_ITEM = {
  id: null,
  description: '',
  specifications: '',
  unit: 'Pcs',
  qty: 1,
  estimatedRate: 0,
};

export function CreateRFQ() {
  const editRfqId = useSearchParams().get('edit_rfq');

  const { data: rfqRaw, loading: rfqLoading } = useGetRequest(
    editRfqId
      ? `${endpoints.procurement_management.rfqs}?rfq_number=${encodeURIComponent(editRfqId)}&pagination=false`
      : null
  );

  // console.log('RFQ data for editing', rfqRaw);
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(1);
  const [selectedMRF, setSelectedMRF] = useState('');
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [bypassVendorSelection, setBypassVendorSelection] = useState(false);
  // console.log('selected vendors', selectedVendors);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [deadlineError, setDeadlineError] = useState('');
  const autoRFQId = 'Pending';
  const [quantities, setQuantities] = useState({});

  // ── Extra manually-added BOQ items ─────────────────────────────────────
  const [extraItems, setExtraItems] = useState([]);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [newItemForm, setNewItemForm] = useState({ ...EMPTY_EXTRA_ITEM });
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);

  const { data: mrfRaw, loading: mrfLoading } = useGetRequest(
    `${endpoints.procurement_management.requisitions}?status=Approved&pagination=false`
  );

  // console.log('raw MRF list', mrfRaw);
  const { data: vendorList, loading: vendorLoading } = useGetRequest(
    `${endpoints.procurement_management.vendors_management}`
  );

  const allVendors = vendorList.map((v) => ({
    id: v.id,
    name: v.name || v.company_name_bn || v.legal_name || '',
    categories: Array.isArray(v.categories) ? v.categories : v.category ? [v.category] : [],
    rating: Number(v.rating) || 0,
    contracts: v.active_contracts || v.total_orders || 0,
    location: v.city || v.address || '',
    email: v.email || '',
    status: v.status,
  }));

  // ── Inventory items for Add Item dialog dropdown ──────────────────────
  const { data: inventoryRaw } = useGetRequest(
    `${endpoints.storeInventory.items}?pagination=false`
  );
  const inventoryItems = useMemo(
    () =>
      Array.isArray(inventoryRaw)
        ? inventoryRaw
        : Array.isArray(inventoryRaw?.results)
          ? inventoryRaw.results
          : [],
    [inventoryRaw]
  );

  const approvedMRFs = (
    Array.isArray(mrfRaw) ? mrfRaw : Array.isArray(mrfRaw?.results) ? mrfRaw.results : []
  ).map((mr) => ({
    id: String(mr.id),
    mrfNumber: mr.requisition_no || '',
    project: mr.project_name || mr.department_name || '',
    office: mr.department_name || '',
    department: mr.department_name || '',
    category: mr.category_name || '',
    categoryId: mr.category || '',
    requester: mr.created_by?.username || '',
    budgetCode: mr.budget_code_display?.name || '',
    donorCode: mr.donor_code || '',
    accountHead: mr.account_code_display?.name || '',
    amount: Number(mr.total_amount) || 0,
    deliveryLocation: mr.delivery_location_info?.name || '',
    requiredByDate: mr.required_by_date || '',
    purpose: mr.purpose || '',
    boqItems: (mr.mr_items || []).map((item, idx) => ({
      id: item.id || idx + 1,
      slNo: String(idx + 1),
      description: item.item_name || item.item?.name || '',
      specification: item.specifications || item.specification || '',
      unit: item.unit || 'Pcs',
      quantity: Number(item.quantity) || 0,
      estimatedRate: Number(item.unit_price) || 0,
      estimatedAmount: Number(item.total_price) || 0,
    })),
  }));

  const [rfqData, setRfqData] = useState({
    title: '',
    description: '',
    deadline: '',
    urgency: 'normal',
    evaluationCriteria: 'lowest-price',
    termsConditions:
      '1. Quotations must be submitted before the deadline. Late submissions will not be accepted.\n2. All prices must be quoted in BDT (Bangladeshi Taka) inclusive of all taxes and duties.\n3. Delivery must be made to the specified location within the stipulated timeframe.\n4. Payment terms: Within 30 days of satisfactory delivery and inspection.\n5. Warranty/guarantee period as specified in the specifications.\n6. Ledars NGO reserves the right to accept or reject any/all quotations.\n7. Vendor must be VAT/TIN registered.\n8. Quoted prices must remain valid for a minimum of 90 days from the submission deadline.',
    scopeOfWork: '',
  });
  const [requiredDocuments, setRequiredDocuments] = useState([
    'Company Registration Certificate',
    'VAT Registration (BIN)',
    'TIN Certificate',
    'Bank Solvency Certificate',
    'Up to date Trade License',
  ]);
  const [newDocument, setNewDocument] = useState('');
  const [attachments, setAttachments] = useState([]); // [{ file: File, type: string }]
  const [existingAttachments, setExistingAttachments] = useState([]); // [{ id, file_url, filename }] — server files already uploaded

  console.log('attachments attachments:', attachments);
  const fileInputRef = useRef(null);
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files.map((f) => ({ file: f, type: 'Other' }))]);
    e.target.value = '';
  };
  const removeAttachment = (idx) => setAttachments((prev) => prev.filter((_, i) => i !== idx));
  const updateAttachmentType = (idx, type) =>
    setAttachments((prev) => prev.map((a, i) => (i === idx ? { ...a, type } : a)));

  // ── Edit mode: auto-fill form from existing RFQ data ────────────────
  useEffect(() => {
    if (!editRfqId || !rfqRaw?.length || !approvedMRFs.length) return;
    const rfq = rfqRaw[0];

    setRfqData((prev) => ({
      ...prev,
      title: rfq.title || '',
      description: rfq.description || '',
      deadline: rfq.submission_deadline
        ? new Date(rfq.submission_deadline).toISOString().slice(0, 16)
        : '',
      urgency: rfq.urgency?.toLowerCase() || 'normal',
      termsConditions: rfq.payment_terms || prev.termsConditions,
    }));

    if (rfq.required_documents?.length) {
      setRequiredDocuments(rfq.required_documents);
    }

    if (rfq.rfq_attachments?.length) {
      setExistingAttachments(
        rfq.rfq_attachments.map((a) => ({
          id: a.id,
          file_url: a.file_url,
          filename: a.file_url.split('/').pop(),
        }))
      );
    }

    if (rfq.line_items?.length) {
      setExtraItems(
        rfq.line_items.map((item) => ({
          id: item.id,
          description: item.item_name,
          specifications: item.specifications || item.specification || '',
          unit: item.unit,
          qty: item.quantity,
          estimatedRate: parseFloat(item.estimated_unit_price) || 0,
        }))
      );
    }

    const reqId = rfq.requisitions?.[0];
    if (reqId) {
      const matched = approvedMRFs.find((m) => String(m.id) === String(reqId));
      if (matched) handleMRFSelect(matched.mrfNumber);
    }

    // Set vendors AFTER handleMRFSelect so it isn't wiped by the setSelectedVendors([]) inside it
    if (rfq.invited_vendors?.length) {
      setSelectedVendors(rfq.invited_vendors.map((v) => v.vendor.id));
    }
  }, [rfqRaw, approvedMRFs.length, allVendors.length, editRfqId]);

  // console.log('selected vendors after setting in useEffect:', selectedVendors);
  // ─────────────────────────────────────────────────────────────────────

  const currentMRF = approvedMRFs.find((m) => m.mrfNumber === selectedMRF);

  const initialInvitedVendorIds = useMemo(() => {
    const invited = rfqRaw?.[0]?.invited_vendors;
    if (!Array.isArray(invited)) return [];
    return invited
      .map((entry) => entry?.vendor?.id ?? entry?.vendor_id ?? entry?.vendor ?? entry?.id)
      .filter(Boolean)
      .map(Number);
  }, [rfqRaw]);

  const submittedVendorCount = useMemo(() => {
    const rfq = rfqRaw?.[0];
    if (!rfq) return 0;
    if (typeof rfq.submitted_vendors_count === 'number') return rfq.submitted_vendors_count;
    if (!Array.isArray(rfq.invited_vendors)) return 0;
    return rfq.invited_vendors.filter(
      (entry) => entry?.submitted_status || entry?.invite_status === 'submitted'
    ).length;
  }, [rfqRaw]);

  const hasInvitedVendorSelectionChanged = useMemo(() => {
    if (!editRfqId) return false;
    const initial = [...new Set(initialInvitedVendorIds.map(Number))].sort((a, b) => a - b);
    const current = [...new Set(selectedVendors.map(Number))].sort((a, b) => a - b);
    if (initial.length !== current.length) return true;
    return initial.some((id, index) => id !== current[index]);
  }, [editRfqId, initialInvitedVendorIds, selectedVendors]);

  // In edit mode, rfq.line_items already contains ALL items (including MRF items),
  // so we don't show/submit currentMRF.boqItems to avoid duplication.
  const boqItemsToShow = editRfqId ? [] : (currentMRF?.boqItems ?? []);

  // console.log('approved MRFs', approvedMRFs);
  // console.log('selected MRF', currentMRF);
  const handleMRFSelect = (mrfNumber) => {
    setSelectedMRF(mrfNumber);
    const mrf = approvedMRFs.find((m) => m.mrfNumber === mrfNumber);
    if (mrf) {
      setRfqData((prev) => ({
        ...prev,
        title: `${mrf.category} - ${mrf.project}`,
        scopeOfWork: mrf.purpose,
      }));
      const catMap = {
        'IT Equipment': ['IT Equipment', 'Computer Hardware', 'Networking'],
        Construction: ['Construction', 'Building Materials', 'Civil Works'],
        'Office Supplies': ['Office Supplies', 'Stationery'],
        Furniture: ['Furniture', 'Office Furniture'],
        'Medical Supplies': ['Medical Supplies', 'Pharmaceuticals'],
        Vehicle: ['Vehicle', 'Automobile'],
        'Training Materials': ['Training Materials', 'Printing'],
        Printing: ['Printing', 'Office Supplies'],
      };

      setSelectedCategories(catMap[mrf.category] || [mrf.category]);
      setSelectedVendors([]);
    }
  };
  const matchingVendors = allVendors.filter((v) => v.status === 'Approved');

  const nonMatchingVendors = allVendors.filter((v) => v.status !== 'Approved');

  const getVendorCategoryLabel = (category) =>
    typeof category === 'string' ? category : category?.name || '';

  const toggleVendor = (id) => {
    setBypassVendorSelection(false);
    setSelectedVendors((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };
  const selectAllMatching = () => {
    setBypassVendorSelection(false);
    setSelectedVendors(matchingVendors.map((v) => v.id));
  };
  // ── Dynamic totals ────────────────────────────────────────────────────
  const totalEstimated = useMemo(() => {
    const mrfTotal = boqItemsToShow.reduce(
      (s, item) => s + (quantities[item.id] ?? item.quantity) * item.estimatedRate,
      0
    );
    const extraTotal = extraItems.reduce((s, item) => s + item.qty * item.estimatedRate, 0);
    return mrfTotal + extraTotal;
  }, [boqItemsToShow, quantities, extraItems]);
  const sections = [
    { num: 1, label: 'Select Approved MRF' },
    { num: 2, label: 'RFQ Details & Scope' },
    { num: 3, label: 'BOQ & Specifications' },
    { num: 4, label: 'Terms & Evaluation' },
    { num: 5, label: 'Select Vendors by Category' },
    { num: 6, label: 'Attachments & Documents' },
    { num: 7, label: 'Review & Publish' },
  ];

  const handleSubmit = async (publishStatus) => {
    if (!currentMRF) return;
    if (!rfqData.deadline) {
      setDeadlineError('Submission Deadline is required.');
      toast.error('Submission Deadline is required.');
      setActiveSection(2);
      return;
    }
    if (!dayjs(rfqData.deadline).isAfter(dayjs())) {
      setDeadlineError('Submission Deadline must be a future date and time.');
      setActiveSection(2);
      return;
    }
    setDeadlineError('');
    setSubmitting(true);
    setSubmitError('');
    try {
      const lineItems = boqItemsToShow
        .map((item, idx) => ({
          item_name: item.description,
          specification: item.specification || '',
          quantity: quantities[item.id] ?? item.quantity,
          unit: item.unit || 'Unit',
          estimated_unit_price: item.estimatedRate || null,
          sort_order: idx + 1,
        }))
        .concat(
          extraItems.map((item, idx) => ({
            item_name: item.description,
            specification: item.specifications || '',
            quantity: item.qty,
            unit: item.unit || 'Unit',
            estimated_unit_price: item.estimatedRate || null,
            sort_order: boqItemsToShow.length + idx + 1,
          }))
        );

      // console.log('submitted items', lineItems);
      const payload = {
        title: rfqData.title,
        description: `${rfqData.scopeOfWork}\n\n${rfqData.description}`.trim(),
        submission_deadline: rfqData.deadline ? new Date(rfqData.deadline).toISOString() : null,
        status: publishStatus.toLowerCase(),
        urgency: rfqData.urgency,
        rfq_category: currentMRF.categoryId,
        material_requisition: Number(currentMRF.id),
        material_requisitions: [Number(currentMRF.id)],
        required_documents: requiredDocuments,
        payment_terms: rfqData.termsConditions,
        line_items: lineItems,
      };

      if (bypassVendorSelection) {
        payload.invited_vendors = [];
      } else if (!editRfqId) {
        payload.invited_vendors = selectedVendors.map((id) => Number(id));
      } else if (hasInvitedVendorSelectionChanged && submittedVendorCount === 0) {
        payload.invited_vendors = selectedVendors.map((id) => Number(id));
      } else if (hasInvitedVendorSelectionChanged && submittedVendorCount > 0) {
        toast.warning(
          'Vendor selection changes were skipped to preserve already submitted vendor applications.'
        );
      }

      let createdRFQ;
      if (editRfqId && rfqRaw?.[0]?.id) {
        createdRFQ = await usePatchRequest(
          `${endpoints.procurement_management.rfqs}${rfqRaw[0].id}/`,
          payload
        );
      } else {
        createdRFQ = await useCreateRequest(endpoints.procurement_management.rfqs, payload);
      }
      const rfqId = createdRFQ?.id || createdRFQ?.data?.id;
      if (rfqId && attachments.length > 0) {
        await Promise.all(
          attachments.map((att) => {
            const fd = new FormData();
            fd.append('rfq_id', rfqId);
            fd.append('files', att.file);
            return axiosInstance.post(`${endpoints.procurement_management.rfq_attachments}`, fd, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
          })
        );
      }

      router.push(paths.dashboard.procurement.rfq.list);
      mutate(endpoints.procurement_management.rfqs);
      // setSubmitting(false);
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
      setSubmitting(false);
    }
  };

  if (rfqLoading || mrfLoading || vendorLoading) {
    return (
      <PageLoader message={editRfqId ? 'Loading RFQ data...' : 'Loading procurement data...'} />
    );
  }

  const XCircleIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 text-red-400"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link href={paths.dashboard.procurement.rfq.list}>
            <button type="button" className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          </Link>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
                Generate RFQ from Approved MRF
              </h1>
              <Badge variant="primary">{autoRFQId}</Badge>
              <Badge variant="info">Auto-Generated ID</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              System auto-pulls information from the approved MRF. Select vendors by category from
              the vendor database.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="col-span-9">
          {/* Section 1: Select Approved MRF */}
          {activeSection === 1 && (
            <Card>
              <CardHeader
                title="Step 1: Select Approved MRF"
                description="System will auto-pull all information from the selected MRF"
              />
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <p className="block text-sm font-medium text-foreground mb-2">
                      Select Approved MRF <span className="text-red-500">*</span>
                    </p>
                    <select
                      value={selectedMRF}
                      onChange={(e) => handleMRFSelect(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">-- Select an approved MRF --</option>
                      {approvedMRFs.map((m) => (
                        <option key={m.id} value={m.mrfNumber}>
                          {m.mrfNumber} - {m.category} - {m.project} (BDT{' '}
                          {m.amount.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentMRF && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h4 className="text-sm font-semibold text-green-800">
                          MRF Data Auto-Pulled Successfully
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">MRF Number</p>
                          <p className="font-mono font-semibold">{currentMRF.mrfNumber}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Project</p>
                          <p className="font-medium">{currentMRF.project}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Office</p>
                          <p>{currentMRF.office}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Category</p>
                          <Badge variant="primary" size="sm">
                            {currentMRF.category}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Budget Code</p>
                          <p className="font-mono text-sm">{currentMRF.budgetCode}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Donor Code</p>
                          <p className="font-mono text-sm">{currentMRF?.donor_code_info?.code}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Requester</p>
                          <p>{currentMRF.requester}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Account Head</p>
                          <p className="text-sm">{currentMRF.accountHead}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Estimated Amount</p>
                          <p className="text-lg font-bold text-primary">
                            BDT {currentMRF.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-xs text-muted-foreground">Purpose:</p>
                        <p className="text-sm">{currentMRF.purpose}</p>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">
                          BOQ Items: <strong>{boqItemsToShow.length + extraItems.length}</strong> |
                          Delivery: {currentMRF.deliveryLocation} | Required By:{' '}
                          {currentMRF.requiredByDate}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Section 2: RFQ Details */}
          {activeSection === 2 && (
            <Card>
              <CardHeader
                title="Step 2: RFQ Details & Scope of Work"
                description="Auto-populated from MRF. Modify if needed."
              />
              <CardBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="block text-sm font-medium text-foreground mb-2">
                        RFQ Title <span className="text-red-500">*</span>
                      </p>
                      <input
                        value={rfqData.title}
                        onChange={(e) => setRfqData((p) => ({ ...p, title: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <p className="block text-sm font-medium text-foreground mb-2">
                        Submission Deadline <span className="text-red-500">*</span>
                      </p>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateTimePicker
                          value={rfqData.deadline ? dayjs(rfqData.deadline) : null}
                          onChange={(val) => {
                            setRfqData((p) => ({ ...p, deadline: val ? val.toISOString() : '' }));
                            if (val && dayjs(val).isAfter(dayjs())) setDeadlineError('');
                          }}
                          minDateTime={dayjs()}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: 'small',
                              error: !!deadlineError,
                              helperText: deadlineError || '',
                              placeholder: 'Select submission deadline',
                              sx: {
                                '& .MuiInputBase-root': { fontSize: '0.875rem' },
                              },
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="block text-sm font-medium text-foreground mb-2">Urgency</p>
                      <select
                        value={rfqData.urgency}
                        onChange={(e) => setRfqData((p) => ({ ...p, urgency: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="normal">Normal</option>
                        <option value="urgent">Urgent</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <p className="block text-sm font-medium text-foreground mb-2">
                        Evaluation Criteria
                      </p>
                      <select
                        value={rfqData.evaluationCriteria}
                        onChange={(e) =>
                          setRfqData((p) => ({ ...p, evaluationCriteria: e.target.value }))
                        }
                        className="w-full px-3 py-2.5 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="lowest-price">Lowest Price (L1)</option>
                        <option value="quality-cost">Quality-Cost Based (QCBS)</option>
                        <option value="technical-merit">Technical Merit Based</option>
                        <option value="best-value">Best Value for Money</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <p className="block text-sm font-medium text-foreground mb-2">
                      Scope of Work / Description <span className="text-red-500">*</span>
                    </p>
                    <textarea
                      rows={4}
                      value={rfqData.scopeOfWork}
                      onChange={(e) => setRfqData((p) => ({ ...p, scopeOfWork: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Auto-populated from MRF purpose. Add additional scope details..."
                    />
                  </div>
                  <div>
                    <p className="block text-sm font-medium text-foreground mb-2">
                      Additional Description
                    </p>
                    <textarea
                      rows={3}
                      value={rfqData.description}
                      onChange={(e) => setRfqData((p) => ({ ...p, description: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Any additional instructions for vendors..."
                    />
                  </div>

                  {currentMRF && (
                    <div className="p-4 bg-muted/30 rounded-lg border border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-3">
                        AUTO-PULLED FROM {currentMRF.mrfNumber}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground">Project:</span>{' '}
                          <span className="font-medium">{currentMRF.project}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Category:</span>{' '}
                          <span className="font-medium">{currentMRF.category}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Budget:</span>{' '}
                          <span className="font-mono">{currentMRF.budgetCode}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Delivery:</span>{' '}
                          <span>{currentMRF.deliveryLocation}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Section 3: BOQ & Specifications (auto-pulled) */}
          {activeSection === 3 && (
            <Card>
              <CardHeader
                title="Step 3: Bill of Quantities & Specifications"
                description={
                  currentMRF
                    ? `${boqItemsToShow.length} MRF item(s) from ${currentMRF.mrfNumber}${extraItems.length > 0 ? ` + ${extraItems.length} extra item(s)` : ''}`
                    : 'Select an MRF first'
                }
                action={
                  <div className="flex items-center gap-2">
                    <Badge variant="success" size="sm">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Auto-pulled from MRF
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewItemForm({ ...EMPTY_EXTRA_ITEM });
                        setSelectedInventoryItem(null);
                        setAddItemOpen(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Item
                    </Button>
                  </div>
                }
              />
              <CardBody>
                {currentMRF ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-xs font-semibold text-foreground text-left">
                            SL#
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold text-foreground text-left">
                            Description
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold text-foreground text-left">
                            Specifications
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold text-foreground text-center">
                            Unit
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold text-foreground text-center">
                            Qty
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold text-foreground text-right">
                            Est. Rate (BDT)
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold text-foreground text-right">
                            Est. Amount (BDT)
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold text-foreground text-center">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* ── MRF Items (auto-pulled, hidden in edit mode) ── */}
                        {boqItemsToShow.map((item, idx) => {
                          const qty = quantities[item.id] ?? item.quantity;
                          const estAmt = qty * item.estimatedRate;
                          return (
                            <tr key={item.id} className="border-b border-border hover:bg-muted/20">
                              <td className="px-4 py-3 text-sm font-mono">{idx + 1}</td>
                              <td className="px-4 py-3 text-sm font-medium">{item.description}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">
                                {item.specification}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">{item.unit}</td>
                              <td className="px-4 py-3 text-sm text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={qty}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setQuantities((prev) => ({ ...prev, [item.id]: value }));
                                  }}
                                  className="w-20 text-center px-1 py-0.5 border border-input rounded-md text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-mono">
                                BDT {item.estimatedRate.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-semibold font-mono text-primary">
                                BDT {estAmt.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                                  MRF
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                        {/* ── Extra manually added items ── */}
                        {extraItems.map((item, idx) => (
                          <tr
                            key={`extra-${idx}`}
                            className="border-b border-border bg-blue-50/40 hover:bg-blue-50/60"
                          >
                            <td className="px-4 py-3 text-sm font-mono">
                              {boqItemsToShow.length + idx + 1}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">{item.description}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">
                              {item.specifications}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">{item.unit}</td>
                            <td className="px-4 py-3 text-sm text-center">
                              <input
                                type="number"
                                min="0"
                                value={item.qty}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  setExtraItems((prev) =>
                                    prev.map((it, i) => (i === idx ? { ...it, qty: value } : it))
                                  );
                                }}
                                className="w-20 text-center px-1 py-0.5 border border-input rounded-md text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-mono">
                              BDT {item.estimatedRate.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold font-mono text-primary">
                              BDT {(item.qty * item.estimatedRate).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setExtraItems((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="p-1 hover:bg-red-100 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-primary/5 border-t-2 border-primary">
                          <td colSpan={7} className="px-4 py-3 text-sm font-bold text-right">
                            Grand Total ({boqItemsToShow.length + extraItems.length} items):
                          </td>
                          <td className="px-4 py-3 text-lg font-bold text-primary text-right font-mono">
                            BDT {totalEstimated.toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Add Item button below table */}
                    <div className="mt-3 flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewItemForm({ ...EMPTY_EXTRA_ITEM });
                          setSelectedInventoryItem(null);
                          setAddItemOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Extra Item
                      </Button>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Grand Total (Est.)</p>
                        <p className="text-xl font-bold text-primary font-mono">
                          BDT {totalEstimated.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <strong>Note:</strong> Vendors will see BOQ items with descriptions,
                        specifications, units, and quantities. Estimated rates are hidden from
                        vendors &mdash; they will quote their own prices.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Please select an approved MRF in Step 1 to view BOQ items.</p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Section 4: Terms & Evaluation */}
          {activeSection === 4 && (
            <Card>
              <CardHeader
                title="Step 4: Terms, Conditions & Evaluation Criteria"
                description="Define the terms and how vendor quotations will be evaluated"
              />
              <CardBody>
                <div className="space-y-6">
                  <div>
                    <p className="block text-sm font-medium text-foreground mb-2">
                      Terms & Conditions
                    </p>
                    <textarea
                      rows={10}
                      value={rfqData.termsConditions}
                      onChange={(e) =>
                        setRfqData((p) => ({ ...p, termsConditions: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                    />
                  </div>
                  <div>
                    <p className="block text-sm font-medium text-foreground mb-2">
                      Required Documents from Vendors
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {requiredDocuments.map((doc, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-full font-medium"
                        >
                          {doc}
                          <button
                            type="button"
                            onClick={() =>
                              setRequiredDocuments((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={newDocument}
                        onChange={(e) => setNewDocument(e.target.value)}
                        placeholder="Add required document..."
                        className="flex-1 px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (newDocument.trim()) {
                            setRequiredDocuments((p) => [...p, newDocument.trim()]);
                            setNewDocument('');
                          }
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-foreground mb-2">
                      Evaluation Criteria
                    </h4>
                    <p className="text-sm text-foreground capitalize">
                      {rfqData.evaluationCriteria.replace(/-/g, ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {rfqData.evaluationCriteria === 'lowest-price' &&
                        'Award will be made to the lowest responsive and responsible bidder meeting all specifications.'}
                      {rfqData.evaluationCriteria === 'quality-cost' &&
                        'Evaluation weightage: Technical 70%, Financial 30%. Minimum technical score required: 70/100.'}
                      {rfqData.evaluationCriteria === 'technical-merit' &&
                        'Primary evaluation on technical capability. Only technically qualified vendors proceed to financial comparison.'}
                      {rfqData.evaluationCriteria === 'best-value' &&
                        'Holistic assessment of price, quality, delivery timeline, warranty, and vendor track record.'}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Section 5: Select Vendors by Category */}
          {activeSection === 5 && (
            <Card>
              <CardHeader
                title="Step 5: Select Vendors by Category"
                description="Only vendors registered under selected categories can view and respond to this RFQ"
                action={
                  <Badge variant="info" size="sm">
                    <Shield className="w-3 h-3 mr-1" />
                    Category-Restricted
                  </Badge>
                }
              />
              <CardBody>
                <div className="space-y-4">
                  {/* Selected Categories */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-semibold text-blue-800">
                        Auto-Selected Vendor Categories (from MRF)
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedCategories.map((cat, idx) => (
                        <Badge key={idx} variant="primary" size="sm">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      <strong>Visibility Rule:</strong> RFQ will be visible ONLY to vendors under
                      these categories. Vendors outside these categories cannot view or respond.
                    </p>
                  </div>

                  {/* Matching Vendors */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Matching Vendors ({matchingVendors.length})
                          <span className="text-xs text-muted-foreground font-normal ml-2">
                            vendors registered under selected categories
                          </span>
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={selectAllMatching}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Select All Matching
                        </Button>
                        <Button
                          variant={bypassVendorSelection ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setBypassVendorSelection((prev) => {
                              const next = !prev;
                              if (next) {
                                setSelectedVendors([]);
                              }
                              return next;
                            });
                          }}
                        >
                          {bypassVendorSelection ? 'Using Bypass Mode' : 'Bypass Vendor Selection'}
                        </Button>
                      </div>
                    </div>
                    {bypassVendorSelection && (
                      <div className="mb-3 rounded-lg border border-dashed border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
                        Vendor selection is bypassed. This RFQ will be created without invited
                        vendors and can be used for direct evaluation or one-off procurement
                        workflows.
                      </div>
                    )}
                    <div className="space-y-2">
                      {matchingVendors?.map((vendor) => (
                        <div
                          key={vendor?.id}
                          onClick={() => toggleVendor(vendor?.id)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedVendors.includes(vendor?.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedVendors.includes(vendor?.id) ? 'bg-primary border-primary' : 'border-border'}`}
                            >
                              {selectedVendors?.includes(vendor?.id) && (
                                <CheckCircle
                                  className="w-3 h-3
                                 text-white"
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-foreground">
                                  {vendor?.name}
                                </p>
                                <Badge variant="default" size="sm">
                                  {vendor?.id}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {vendor?.location}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {vendor?.email}
                                </span>
                                <span className="flex items-center gap-0.5 text-xs">
                                  <Star className="w-3 h-3 text-yellow-500" />
                                  {vendor?.rating}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {vendor?.contracts} contracts
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {vendor?.categories?.map((c, i) => {
                                  const label = getVendorCategoryLabel(c);
                                  return (
                                    <span
                                      key={i}
                                      className={`text-[10px] px-1.5 py-0.5 rounded ${selectedCategories.includes(label) ? 'bg-primary/10 text-primary font-medium' : 'bg-muted text-muted-foreground'}`}
                                    >
                                      {label}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Non-matching Vendors (blocked) */}
                  {nonMatchingVendors.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <h4 className="text-sm font-semibold text-muted-foreground">
                          Non-Matching Vendors ({nonMatchingVendors.length})
                          <span className="text-xs font-normal ml-2">
                            &mdash; cannot view or respond to this RFQ
                          </span>
                        </h4>
                      </div>
                      <div className="space-y-2 opacity-50">
                        {nonMatchingVendors
                          .filter((v) => v.status !== 'Approved')
                          .slice(0, 3)
                          .map((vendor) => (
                            <div
                              key={vendor?.id}
                              className="p-3 rounded-lg border border-border bg-muted/20"
                            >
                              <div className="flex items-center gap-3">
                                <XCircleIcon />
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    {vendor?.name} ({vendor?.id})
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Categories:{' '}
                                    {vendor?.categories
                                      ?.map(getVendorCategoryLabel)
                                      .filter(Boolean)
                                      .join(', ')}
                                  </p>
                                </div>
                                <Badge variant="default" size="sm">
                                  Not Eligible
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Notification Preview */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Send className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-semibold text-green-800">Notification Preview</p>
                    </div>
                    <p className="text-xs text-green-700">
                      Upon publishing, the system will send{' '}
                      <strong>email + portal notifications</strong> to {selectedVendors.length}{' '}
                      selected vendor(s). Vendors will receive a notification with the RFQ title,
                      deadline, and a link to view the full RFQ on the vendor portal. Only vendors
                      under selected categories ({selectedCategories.join(', ')}) will be able to
                      access the RFQ.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Section 6: Attachments */}
          {activeSection === 6 && (
            <Card>
              <CardHeader
                title="Step 6: Attachments & Supporting Documents"
                description="Attach scope, terms, BOQ sheets, drawings, or any supporting documents"
              />
              <CardBody>
                <div className="space-y-4">
                  {/* Drop Zone — label wraps the hidden input for native file dialog */}
                  <div
                    htmlFor="rfq-file-input"
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer block"
                  >
                    <input
                      ref={fileInputRef}
                      id="rfq-file-input"
                      type="file"
                      multiple
                      accept=".pdf,.xlsx,.xls,.docx,.doc,.dwg,.zip,.png,.jpg,.jpeg"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <div
                      className="flex flex-col items-center gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground">Click to select files</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, DOC, DOCX, XLS, XLSX, JPG, PNG — Max 10 MB per file
                      </p>
                    </div>
                  </div>

                  {/* Existing server attachments (edit mode) */}
                  {existingAttachments.length > 0 && (
                    <div className="space-y-2 mb-2">
                      <p className="text-sm font-semibold text-foreground mb-2">
                        Already Uploaded ({existingAttachments.length})
                      </p>
                      {existingAttachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/20"
                        >
                          <FileText className="w-5 h-5 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{att.filename}</p>
                            <span className="text-xs text-muted-foreground">Already uploaded</span>
                          </div>
                          <a
                            href={att.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            View
                          </a>
                          <button
                            type="button"
                            onClick={() =>
                              setExistingAttachments((prev) => prev.filter((a) => a.id !== att.id))
                            }
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected files list */}
                  {attachments.length > 0 ? (
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">
                        Selected Files ({attachments.length})
                      </p>
                      <div className="space-y-2">
                        {attachments.map((att, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 border border-border rounded-lg"
                          >
                            <FileText className="w-5 h-5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{att.file.name}</p>
                              <span className="text-xs text-muted-foreground">
                                {(att.file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                            <select
                              value={att.type}
                              onChange={(e) => updateAttachmentType(idx, e.target.value)}
                              className="text-xs border border-input rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                            >
                              <option>BOQ Sheet</option>
                              <option>Technical Spec</option>
                              <option>Terms</option>
                              <option>Evaluation</option>
                              <option>Scope of Work</option>
                              <option>Drawing</option>
                              <option>Other</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => removeAttachment(idx)}
                              className="text-red-400 hover:text-red-600 shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center">
                      No files selected. Attachments are optional.
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Section 7: Review & Publish */}
          {activeSection === 7 && (
            <div className="space-y-4">
              {/* ── Step Overview Progress Bar ── */}
              <Card>
                <CardBody>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {sections.map((s, idx) => {
                      const isLast = idx === sections.length - 1;
                      const isDone = s.num < 7;
                      return (
                        <div key={s.num} className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setActiveSection(s.num)}
                            className="flex flex-col items-center gap-1 group"
                          >
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                                s.num === 7
                                  ? 'bg-primary text-white ring-4 ring-primary/20'
                                  : isDone
                                    ? 'bg-green-500 text-white'
                                    : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : s.num}
                            </div>
                            <span
                              className={`text-[9px] font-medium max-w-[56px] text-center leading-tight ${s.num === 7 ? 'text-primary' : isDone ? 'text-green-600' : 'text-muted-foreground'}`}
                            >
                              {s.label}
                            </span>
                          </button>
                          {!isLast && (
                            <div
                              className={`h-0.5 w-6 mt-[-12px] ${isDone ? 'bg-green-400' : 'bg-muted'}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>

              {currentMRF ? (
                <>
                  {/* ── Step 1 Summary: MRF Info ── */}
                  <Card>
                    <CardBody>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Step 1 — MRF Reference
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveSection(1)}
                          className="ml-auto text-xs text-primary hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          ['MRF Number', currentMRF.mrfNumber, 'font-mono font-bold text-primary'],
                          ['Project', currentMRF.project, ''],
                          ['Category', currentMRF.category, ''],
                          ['Budget Code', currentMRF.budgetCode, 'font-mono'],
                          ['Office', currentMRF.office, ''],
                          ['Requester', currentMRF.requester, ''],
                          ['Delivery Location', currentMRF.deliveryLocation, ''],
                          ['Required By', currentMRF.requiredByDate, ''],
                        ].map(([label, val, cls]) => (
                          <div key={label} className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                            <p className={`text-sm ${cls || 'font-medium text-foreground'}`}>
                              {val || '—'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>

                  {/* ── Step 2 Summary: RFQ Details ── */}
                  <Card>
                    <CardBody>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Step 2 — RFQ Details & Scope
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveSection(2)}
                          className="ml-auto text-xs text-primary hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 text-sm">
                          {[
                            ['RFQ Number', autoRFQId],
                            ['Title', rfqData.title || 'Not set'],
                            ['Deadline', rfqData.deadline || 'Not set'],
                            ['Urgency', rfqData.urgency],
                            ['Evaluation', rfqData.evaluationCriteria.replace(/-/g, ' ')],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              className="flex justify-between py-1.5 border-b border-border/40"
                            >
                              <span className="text-muted-foreground">{label}</span>
                              <span className="font-medium text-foreground capitalize">
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Scope of Work
                          </p>
                          <p className="text-sm text-foreground bg-muted/30 rounded p-2 line-clamp-4">
                            {rfqData.scopeOfWork || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* ── Step 3 Summary: BOQ ── */}
                  <Card>
                    <CardBody>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Step 3 — BOQ & Specifications
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            ({boqItemsToShow.length + extraItems.length} items)
                          </span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveSection(3)}
                          className="ml-auto text-xs text-primary hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="px-3 py-2 text-xs text-left font-semibold">SL#</th>
                              <th className="px-3 py-2 text-xs text-left font-semibold">
                                Description
                              </th>
                              <th className="px-3 py-2 text-xs text-left font-semibold">
                                Specifications
                              </th>
                              <th className="px-3 py-2 text-xs text-center font-semibold">Unit</th>
                              <th className="px-3 py-2 text-xs text-center font-semibold">Qty</th>
                              <th className="px-3 py-2 text-xs text-right font-semibold">
                                Rate (BDT)
                              </th>
                              <th className="px-3 py-2 text-xs text-right font-semibold">
                                Amount (BDT)
                              </th>
                              <th className="px-3 py-2 text-xs text-center font-semibold">
                                Source
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {boqItemsToShow.map((item, idx) => {
                              const qty = quantities[item.id] ?? item.quantity;
                              return (
                                <tr
                                  key={item.id}
                                  className="border-b border-border hover:bg-muted/20"
                                >
                                  <td className="px-3 py-2 font-mono text-xs">{idx + 1}</td>
                                  <td className="px-3 py-2 font-medium">{item.description}</td>
                                  <td className="px-3 py-2 text-xs text-muted-foreground max-w-[140px] truncate">
                                    {item.specification || '—'}
                                  </td>
                                  <td className="px-3 py-2 text-center">{item.unit}</td>
                                  <td className="px-3 py-2 text-center font-semibold">{qty}</td>
                                  <td className="px-3 py-2 text-right font-mono">
                                    {item.estimatedRate.toLocaleString()}
                                  </td>
                                  <td className="px-3 py-2 text-right font-semibold font-mono text-primary">
                                    {(qty * item.estimatedRate).toLocaleString()}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                                      MRF
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                            {extraItems.map((item, idx) => (
                              <tr
                                key={`extra-${idx}`}
                                className="border-b border-border bg-blue-50/30 hover:bg-blue-50/50"
                              >
                                <td className="px-3 py-2 font-mono text-xs">
                                  {boqItemsToShow.length + idx + 1}
                                </td>
                                <td className="px-3 py-2 font-medium">{item.description}</td>
                                <td className="px-3 py-2 text-xs text-muted-foreground max-w-[140px] truncate">
                                  {item.specifications || '—'}
                                </td>
                                <td className="px-3 py-2 text-center">{item.unit}</td>
                                <td className="px-3 py-2 text-center font-semibold">{item.qty}</td>
                                <td className="px-3 py-2 text-right font-mono">
                                  {item.estimatedRate.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold font-mono text-primary">
                                  {(item.qty * item.estimatedRate).toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                    Extra
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-primary/5 border-t-2 border-primary">
                              <td colSpan={6} className="px-3 py-3 text-sm font-bold text-right">
                                Grand Total (Estimated):
                              </td>
                              <td className="px-3 py-3 text-lg font-bold text-primary text-right font-mono">
                                {totalEstimated.toLocaleString()}
                              </td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </CardBody>
                  </Card>

                  {/* ── Step 4 Summary: Terms ── */}
                  <Card>
                    <CardBody>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Step 4 — Terms, Conditions & Evaluation
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveSection(4)}
                          className="ml-auto text-xs text-primary hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Required Documents ({requiredDocuments.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {requiredDocuments.map((doc, i) => (
                              <span
                                key={i}
                                className="text-[11px] px-2 py-1 bg-primary/10 text-primary rounded-full font-medium"
                              >
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Evaluation Criteria
                          </p>
                          <p className="text-sm font-semibold text-foreground capitalize">
                            {rfqData.evaluationCriteria.replace(/-/g, ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {rfqData.termsConditions.split('\n')[0]}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* ── Step 5 Summary: Vendors ── */}
                  <Card>
                    <CardBody>
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${selectedVendors.length > 0 ? 'bg-green-500' : 'bg-orange-400'}`}
                        >
                          {selectedVendors.length > 0 ? (
                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Step 5 — Selected Vendors
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            ({selectedVendors.length} selected)
                          </span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveSection(5)}
                          className="ml-auto text-xs text-primary hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      {selectedVendors.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedVendors.map((vid) => {
                            const v = allVendors.find((x) => x.id === vid);
                            return v ? (
                              <div
                                key={vid}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full"
                              >
                                <Star className="w-3 h-3 text-yellow-500" />
                                <span className="text-xs font-medium text-primary">{v.name}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      ) : bypassVendorSelection ? (
                        <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                          <p className="text-xs text-orange-700">
                            Vendor selection is intentionally bypassed for this RFQ.
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                          <p className="text-xs text-orange-700">
                            No vendors have been selected yet.
                          </p>
                        </div>
                      )}
                      {selectedCategories.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Restricted to categories:{' '}
                          {selectedCategories.map((c, i) => (
                            <span key={i} className="font-medium text-foreground">
                              {c}
                              {i < selectedCategories.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </p>
                      )}
                    </CardBody>
                  </Card>

                  {/* ── Step 6 Summary: Attachments ── */}
                  <Card>
                    <CardBody>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Step 6 — Attachments
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            ({existingAttachments.length + attachments.length} file
                            {existingAttachments.length + attachments.length !== 1 ? 's' : ''})
                          </span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveSection(6)}
                          className="ml-auto text-xs text-primary hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      {existingAttachments.length + attachments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {existingAttachments.map((att) => (
                            <div
                              key={`existing-${att.id}`}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/40 border border-border rounded-lg"
                            >
                              <FileText className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs font-medium truncate max-w-[120px]">
                                {att.filename}
                              </span>
                              <span className="text-[10px] text-muted-foreground">(uploaded)</span>
                            </div>
                          ))}
                          {attachments.map((att, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/40 border border-border rounded-lg"
                            >
                              <FileText className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs font-medium truncate max-w-[120px]">
                                {att.file.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                ({att.type})
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No attachments added. (Optional)
                        </p>
                      )}
                    </CardBody>
                  </Card>

                  {/* ── Publish Action Banner ── */}
                  <div className="p-5 bg-gradient-to-r from-primary/10 to-blue-50 border border-primary/20 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Send className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground mb-1">
                          Ready to Publish?
                        </h4>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                          <li>
                            Email + portal notifications →{' '}
                            <strong className="text-foreground">
                              {selectedVendors.length} vendor(s)
                            </strong>
                          </li>
                          <li>
                            BOQ with{' '}
                            <strong className="text-foreground">
                              {boqItemsToShow.length + extraItems.length} items
                            </strong>
                            , Grand Total:{' '}
                            <strong className="text-primary">
                              BDT {totalEstimated.toLocaleString()}
                            </strong>
                          </li>
                          <li>
                            Category restricted:{' '}
                            <strong className="text-foreground">
                              {selectedCategories.join(', ') || 'None'}
                            </strong>
                          </li>
                          <li>
                            Submission deadline:{' '}
                            <strong className="text-foreground">
                              {rfqData.deadline || 'Not set'}
                            </strong>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <Card>
                  <CardBody>
                    <div className="py-12 text-center text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Please select an approved MRF in Step 1 to review.</p>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardBody>
              <div className="text-center mb-3">
                <p className="text-xs text-muted-foreground">RFQ Number</p>
                <p className="text-lg font-mono font-bold text-primary">{autoRFQId}</p>
                <Badge variant="info" size="sm">
                  Auto-Generated
                </Badge>
              </div>
              {currentMRF && (
                <div className="space-y-2 text-xs border-t border-border pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MRF Ref</span>
                    <span className="font-mono font-semibold">{currentMRF.mrfNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium">{currentMRF.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Amount</span>
                    <span className="font-bold text-primary">
                      BDT {currentMRF.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">BOQ Items</span>
                    <span>{boqItemsToShow.length + extraItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vendors Selected</span>
                    <span className="font-semibold">{selectedVendors.length}</span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <p className="text-xs font-semibold text-muted-foreground mb-3">STEPS</p>
              <div className="space-y-1">
                {sections.map((s) => (
                  <button
                    type="button"
                    key={s.num}
                    onClick={() => setActiveSection(s.num)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors ${activeSection === s.num ? 'bg-primary text-white' : 'hover:bg-muted text-foreground'}`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activeSection === s.num ? 'bg-white text-primary' : 'bg-muted text-muted-foreground'}`}
                    >
                      {s.num}
                    </span>
                    {s.label}
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Category Restriction</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    This RFQ is restricted to vendors under selected categories only. Non-matching
                    vendors cannot view or respond.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ── Add Item Dialog (MUI) ──────────────────────────────────────────── */}
      <Dialog open={addItemOpen} onClose={() => setAddItemOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}
        >
          <span style={{ fontSize: '1rem', fontWeight: 600 }}>Add Extra BOQ Item</span>
          <IconButton size="small" onClick={() => setAddItemOpen(false)}>
            <X size={16} />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Inventory Item Autocomplete */}
            <div>
              <p
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  marginBottom: '6px',
                  color: 'var(--foreground)',
                }}
              >
                Select from Inventory (optional — auto-fills fields)
              </p>
              <Autocomplete
                value={selectedInventoryItem}
                onChange={(_, val) => {
                  setSelectedInventoryItem(val);
                  if (val) {
                    setNewItemForm((prev) => ({
                      ...prev,
                      description: val.item_name || val.name || '',
                      specifications: val.specifications || val.description || '',
                      unit: val.unit || val.uom_name || 'Pcs',
                      estimatedRate: parseFloat(val.unit_price || val.cost || 0),
                    }));
                  }
                }}
                options={inventoryItems}
                getOptionLabel={(opt) =>
                  opt
                    ? `${opt.item_code ? `[${opt.item_code}] ` : ''}${opt.item_name || opt.name || ''}`
                    : ''
                }
                isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                size="small"
                renderInput={(params) => (
                  <TextField {...params} placeholder="Search inventory items..." size="small" />
                )}
              />
              {selectedInventoryItem && (
                <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {selectedInventoryItem.category_name && (
                    <Chip
                      label={`Category: ${selectedInventoryItem.category_name}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {selectedInventoryItem.stock_status && (
                    <Chip
                      label={selectedInventoryItem.stock_status}
                      size="small"
                      color={
                        selectedInventoryItem.stock_status === 'In Stock' ? 'success' : 'warning'
                      }
                      variant="outlined"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <TextField
              label="Item Name *"
              value={newItemForm.description}
              onChange={(e) => setNewItemForm((p) => ({ ...p, description: e.target.value }))}
              fullWidth
              size="small"
              placeholder="Item name..."
            />

            {/* Specifications */}
            <TextField
              label="Specifications"
              value={newItemForm.specifications}
              onChange={(e) => setNewItemForm((p) => ({ ...p, specifications: e.target.value }))}
              fullWidth
              size="small"
              multiline
              rows={2}
              placeholder="Brand, model, size, material..."
            />

            {/* Unit + Qty + Rate */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={newItemForm.unit}
                    label="Unit"
                    onChange={(e) => setNewItemForm((p) => ({ ...p, unit: e.target.value }))}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <MenuItem key={u} value={u}>
                        {u}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  label="Qty *"
                  type="number"
                  value={newItemForm.qty}
                  onChange={(e) =>
                    setNewItemForm((p) => ({ ...p, qty: parseFloat(e.target.value) || 0 }))
                  }
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  label="Est. Rate (BDT)"
                  type="number"
                  value={newItemForm.estimatedRate}
                  onChange={(e) =>
                    setNewItemForm((p) => ({
                      ...p,
                      estimatedRate: parseFloat(e.target.value) || 0,
                    }))
                  }
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
            </Grid>

            {/* Live Amount Preview */}
            <div
              style={{
                padding: '10px 14px',
                background: 'var(--muted, #f5f5f5)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                Est. Amount (BDT)
              </span>
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--primary, #1976d2)',
                  fontFamily: 'monospace',
                }}
              >
                {(newItemForm.qty * newItemForm.estimatedRate).toLocaleString()}
              </span>
            </div>
          </div>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
          <Button variant="outline" onClick={() => setAddItemOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!newItemForm.description.trim()}
            onClick={() => {
              setExtraItems((prev) => [...prev, { ...newItemForm }]);
              setNewItemForm({ ...EMPTY_EXTRA_ITEM });
              setSelectedInventoryItem(null);
              setAddItemOpen(false);
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bottom Action Bar */}
      <div className="mt-6 p-4 bg-card border border-border rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => activeSection > 1 && setActiveSection(activeSection - 1)}
          disabled={activeSection === 1}
        >
          Previous
        </Button>
        <div className="flex flex-wrap gap-2">
          <Link href={paths.dashboard.procurement.rfq.list}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => handleSubmit('draft')}
            disabled={submitting || !selectedMRF}
          >
            Save as Draft
          </Button>
          {activeSection === 7 ? (
            <Button
              variant="primary"
              disabled={
                submitting ||
                !selectedMRF ||
                (!bypassVendorSelection && selectedVendors.length === 0)
              }
              onClick={() => handleSubmit('published')}
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting
                ? 'Publishing...'
                : bypassVendorSelection
                  ? 'Publish RFQ without Vendors'
                  : 'Publish RFQ & Notify Vendors'}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => {
                if (activeSection === 2) {
                  if (!rfqData.deadline) {
                    setDeadlineError('Submission Deadline is required.');
                    return;
                  }
                  if (!dayjs(rfqData.deadline).isAfter(dayjs())) {
                    setDeadlineError('Submission Deadline must be a future date and time.');
                    return;
                  }
                  setDeadlineError('');
                }
                setActiveSection(activeSection + 1);
              }}
            >
              Next Step
            </Button>
          )}
          {/* {submitError && <p className="text-xs text-red-600 w-full mt-1">{submitError}</p>} */}
        </div>
      </div>
    </div>
  );
}
