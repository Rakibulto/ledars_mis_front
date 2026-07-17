'use client';

import dayjs from 'dayjs';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import {
  ArrowLeft,
  Save,
  Upload,
  AlertTriangle,
  CheckCircle,
  FileText,
  Shield,
  Clock,
  Ban,
  Award,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../_components/components/ui/card';
import { Button } from '../../../_components/components/ui/button';
import { Badge } from '../../../_components/components/ui/badge';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useGetRequest } from 'src/actions/ledars-hook';
import axiosInstance, { endpoints } from 'src/utils/axios';
import { toast } from 'sonner';

// ─── Autocomplete Component ──────────────────────────────────────────────────

function Autocomplete({
  options,
  value,
  onChange,
  getLabel,
  getOptionLabel,
  renderOption,
  placeholder,
  disabled,
  loading,
}) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedLabel = value ? getLabel(options.find((o) => String(o.id) === String(value))) : '';

  useEffect(() => {
    setInputValue(value ? selectedLabel : '');
  }, [value]);

  const filtered = useMemo(() => {
    if (!inputValue.trim()) return options;
    const q = inputValue.toLowerCase();
    return options.filter((o) =>
      (getOptionLabel ? getOptionLabel(o) : o.name || '').toLowerCase().includes(q)
    );
  }, [inputValue, options, getOptionLabel]);

  useEffect(() => {
    setHighlightIndex(-1);
  }, [inputValue]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setInputValue(value ? selectedLabel : '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, selectedLabel]);

  function handleSelect(opt) {
    onChange(opt.id);
    setInputValue(getOptionLabel ? getOptionLabel(opt) : opt.name || '');
    setIsOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(e) {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(filtered[highlightIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setInputValue(value ? selectedLabel : '');
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="w-full px-3 py-2 pr-8 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          placeholder={loading ? 'Loading...' : placeholder}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          disabled={disabled || loading}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
          {filtered.map((opt, idx) => (
            <button
              key={opt.id}
              type="button"
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                idx === highlightIndex ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
              }`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(opt)}
              onMouseEnter={() => setHighlightIndex(idx)}
            >
              {renderOption
                ? renderOption(opt)
                : getOptionLabel
                  ? getOptionLabel(opt)
                  : opt.name || ''}
            </button>
          ))}
        </div>
      )}
      {isOpen && filtered.length === 0 && inputValue.trim() && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-lg shadow-lg">
          <div className="px-3 py-2 text-sm text-muted-foreground">No results found</div>
        </div>
      )}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

/** @typedef {{ id: number; item_name: string; specification?: string; specifications?: string; quantity: number; unit: string; estimated_unit_price: string }} LineItem */
/** @typedef {{ offered_spec: string; compliant: 'Yes' | 'Partial' | 'No' }} ComplianceRow */
/** @typedef {{ unit_price: string }} FinancialItem */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ManualSubmitQuotation() {
  const router = useRouter();
  const { id: routeId } = useParams();
  const searchParams = useSearchParams();

  const editId = searchParams.get('edit_quotationId');
  const isEditMode = !!editId;

  const [activeSection, setActiveSection] = useState('technical');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Extra: RFQ Reference & Vendor Information state ───────────────────────
  const [selectedRfqId, setSelectedRfqId] = useState(routeId || '');
  const [vendorMode, setVendorMode] = useState('existing');
  const [vendorId, setVendorId] = useState(null);
  const [vendorName, setVendorName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorContactPerson, setVendorContactPerson] = useState('');
  const [vendorDesignation, setVendorDesignation] = useState('');
  const [vendorCategories, setVendorCategories] = useState([]);
  const [vendorErrors, setVendorErrors] = useState({});

  // ─── Fetch RFQ list for dropdown ───────────────────────────────────────────
  const { data: rfqListData, isLoading: rfqListLoading } = useGetRequest(
    endpoints.procurement_management.rfqs
  );
  const rfqList = Array.isArray(rfqListData) ? rfqListData : (rfqListData?.results ?? []);

  // ─── Fetch awards to check which RFQs are already awarded ─────────────────
  const { data: awardsData } = useGetRequest(endpoints.procurement_management.awards);
  const awardsList = useMemo(() => {
    if (!awardsData) return [];
    return Array.isArray(awardsData) ? awardsData : (awardsData.results ?? []);
  }, [awardsData]);

  // Set of RFQ numbers that already have awards
  const awardedRfqNumbers = useMemo(
    () => new Set(awardsList.map((a) => a.rfqNumber).filter(Boolean)),
    [awardsList]
  );

  // Get selected RFQ number for validation query
  const selectedRfqNumber = useMemo(() => {
    if (!selectedRfqId) return '';
    const rfq = rfqList.find((r) => String(r.id) === String(selectedRfqId));
    return rfq?.rfq_number || '';
  }, [selectedRfqId, rfqList]);

  // ─── Fetch quotation validation data for selected RFQ only ───────────────
  const validationUrl = selectedRfqNumber
    ? `${endpoints.procurement_management.quotation_validation}?rfq_no=${encodeURIComponent(selectedRfqNumber)}`
    : null;
  const { data: validationData } = useGetRequest(validationUrl);
  const validationList = useMemo(() => {
    if (!validationData) return [];
    return Array.isArray(validationData) ? validationData : [];
  }, [validationData]);

  // Set of emails that already have quotations for the selected RFQ
  const existingEmailsForRfq = useMemo(() => {
    if (validationList.length === 0) return new Set();
    const emails = new Set();
    validationList.forEach((item) => {
      if (item.vendors) {
        item.vendors.forEach((v) => {
          if (v.email) emails.add(v.email.toLowerCase());
        });
      }
    });
    return emails;
  }, [validationList]);

  // Check if a vendor email already has a quotation for the selected RFQ
  const isEmailDuplicate = useCallback(
    (email) => {
      if (!email || !selectedRfqNumber) return false;
      return existingEmailsForRfq.has(email.toLowerCase());
    },
    [selectedRfqNumber, existingEmailsForRfq]
  );

  // Compute RFQ status for dropdown indicators
  const getRfqStatus = useMemo(() => {
    const now = dayjs();
    return (rfq) => {
      const deadline = rfq.submission_deadline;
      if (deadline && dayjs(deadline).isBefore(dayjs().startOf('day'))) {
        return { type: 'expired', label: 'Deadline expired' };
      }
      if (rfq.rfq_number && awardedRfqNumbers.has(rfq.rfq_number)) {
        return { type: 'awarded', label: 'Already awarded' };
      }
      if (deadline) {
        const diff = dayjs(deadline).diff(now, 'hour');
        if (diff <= 24) {
          return { type: 'urgent', label: `${diff}h remaining` };
        }
        const days = dayjs(deadline).diff(now, 'day');
        return { type: 'active', label: `${days}d remaining` };
      }
      return { type: 'active', label: 'Available' };
    };
  }, [awardedRfqNumbers]);

  // ─── Fetch selected RFQ details ────────────────────────────────────────────
  const effectiveRfqId = selectedRfqId || routeId;
  const { data: rfq, loading } = useGetRequest(
    effectiveRfqId ? endpoints.procurement_management.rfq_by_id(String(effectiveRfqId)) : null
  );

  // ─── Fetch existing submission (edit mode) ──────────────────────────────────
  const { data: existingSubmission, loading: submissionLoading } = useGetRequest(
    editId ? endpoints.procurement_management.vendor_rfq_submission_by_id(editId) : null
  );

  // ─── Fetch vendor list ─────────────────────────────────────────────────────
  const { data: vendorData, isLoading: vendorLoading } = useGetRequest(
    vendorMode === 'existing' ? endpoints.storeInventory.vendors : null
  );
  const vendorList = Array.isArray(vendorData) ? vendorData : (vendorData?.results ?? []);

  // Filtered vendor list: exclude vendors who already have quotations for selected RFQ
  const filteredVendorList = useMemo(() => {
    if (!selectedRfqNumber || existingEmailsForRfq.size === 0) return vendorList;
    return vendorList.filter((v) => {
      const email = (v.email || '').toLowerCase();
      return !email || !existingEmailsForRfq.has(email);
    });
  }, [vendorList, selectedRfqNumber, existingEmailsForRfq]);

  // ─── Fetch categories for vendor creation ──────────────────────────────────
  const { data: catApiData } = useGetRequest(endpoints.procurement_management.item_category);
  const categoryObjects = (() => {
    const results = Array.isArray(catApiData?.results)
      ? catApiData.results
      : Array.isArray(catApiData)
        ? catApiData
        : [];
    return results.map((c) => ({ id: c.id, name: c.name || '' }));
  })();
  const allCategoryNames = categoryObjects.map((c) => c.name);
  const categoryIdMap = Object.fromEntries(categoryObjects.map((c) => [c.name, c.id]));

  const lineItems = (rfq?.line_items ?? []).map((item) => ({
    ...item,
    specification: item.specifications || item.specification || '',
  }));
  const requiredDocs = rfq?.required_documents ?? [];

  // ─── React Hook Form ────────────────────────────────────────────────────────
  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      company_experience: '',
      methodology: '',
      delivery_lead_time_days: '',
      warranty_period: '',
      compliance: {},
      financial: {},
      vat: '',
      ait: '',
      delivery_charge: '',
      quotation_validity_days: '',
      payment_terms: '100% after delivery & inspection',
      additional_remarks: '',
      documents: {},
      checklist: {},
      declaration: false,
    },
  });

  // ─── Pre-fill form when editing an existing draft ───────────────────────────
  useEffect(() => {
    if (!isEditMode || !existingSubmission || !rfq) return;

    const tp = existingSubmission.technical_proposal ?? {};
    const fp = existingSubmission.financial_proposal ?? {};

    const complianceMap = {};
    const complianceSource = Array.isArray(tp.compliance) ? tp.compliance : [];
    complianceSource.forEach((c) => {
      complianceMap[String(c.line_item_id)] = {
        offered_spec: c.offered_spec ?? '',
        compliant: c.compliant ?? 'Yes',
      };
    });

    const financialMap = {};
    const financialItemsArr = Array.isArray(fp.items) ? fp.items : [];
    financialItemsArr.forEach((fi) => {
      financialMap[String(fi.line_item_id)] = {
        unit_price: String(fi.unit_price ?? ''),
      };
    });

    reset({
      company_experience: tp.company_experience ?? '',
      methodology: tp.methodology ?? '',
      delivery_lead_time_days:
        fp.delivery_lead_time_days != null ? String(fp.delivery_lead_time_days) : '',
      warranty_period: existingSubmission.warranty_period ?? '',
      compliance: complianceMap,
      financial: financialMap,
      vat: fp.vat != null ? String(fp.vat) : '',
      ait: fp.ait != null ? String(fp.ait) : '',
      delivery_charge: fp.delivery_charge != null ? String(fp.delivery_charge) : '',
      quotation_validity_days:
        fp.quotation_validity_days != null ? String(fp.quotation_validity_days) : '',
      payment_terms: fp.payment_terms ?? '100% after delivery & inspection',
      additional_remarks: existingSubmission.additional_remarks ?? '',
      documents: {},
      checklist: {},
      declaration: existingSubmission.declaration === true,
    });
  }, [existingSubmission, rfq, isEditMode, reset]);

  // ─── Computed totals via watch ───────────────────────────────────────────────
  const watchedFinancial = useWatch({ control, name: 'financial' });
  const watchedVat = useWatch({ control, name: 'vat' });
  const watchedAit = useWatch({ control, name: 'ait' });
  const watchedDelivery = useWatch({ control, name: 'delivery_charge' });
  const watchedDeclaration = useWatch({ control, name: 'declaration' });
  const watchedExperience = useWatch({ control, name: 'company_experience' });
  const watchedCompliance = useWatch({ control, name: 'compliance' });
  const watchedDocuments = useWatch({ control, name: 'documents' });
  const watchedValidity = useWatch({ control, name: 'quotation_validity_days' });

  // ─── Already-uploaded docs from existing submission (edit mode) ─────────────
  const existingDocNames = new Set(
    isEditMode && Array.isArray(existingSubmission?.documents)
      ? existingSubmission.documents.map((d) => d.doc_name)
      : []
  );

  // ─── Auto-checklist derived from real form values ────────────────────────────
  const autoChecklist = {
    technical_capability_statement: !!(watchedExperience && watchedExperience.trim().length > 0),
    spec_compliance:
      lineItems.length === 0 ||
      lineItems.every((item) => !!watchedCompliance?.[item.id]?.offered_spec?.trim()),
    documents_uploaded:
      requiredDocs.length === 0 ||
      requiredDocs.some((doc) => {
        if (isEditMode && existingDocNames.has(doc)) return true;
        const fl = watchedDocuments?.[doc];
        return !!(fl && fl[0]);
      }),
    financial_filled:
      lineItems.length === 0 ||
      lineItems.every((item) => {
        const price = parseFloat(watchedFinancial?.[item.id]?.unit_price || '0');
        return price > 0;
      }),
    vat_delivery:
      watchedVat !== '' &&
      watchedVat !== undefined &&
      watchedDelivery !== '' &&
      watchedDelivery !== undefined &&
      watchedValidity !== '' &&
      watchedValidity !== undefined,
    declaration: !!watchedDeclaration,
  };

  const checklistItems = [
    { key: 'technical_capability_statement', label: 'Technical capability statement' },
    { key: 'spec_compliance', label: 'Spec compliance table filled' },
    { key: 'financial_filled', label: 'Unit prices entered (financial)' },
    { key: 'vat_delivery', label: 'VAT / delivery / validity declared' },
    { key: 'declaration', label: 'Declaration accepted' },
  ];

  const allChecklistPassed = autoChecklist.documents_uploaded;
  const completedCount = checklistItems.filter((item) => autoChecklist[item.key]).length;

  const subTotal = lineItems.reduce((acc, item) => {
    const price = parseFloat(watchedFinancial?.[item.id]?.unit_price || '0');
    return acc + price * item.quantity;
  }, 0);

  const grandTotal =
    subTotal +
    parseFloat(watchedVat || '0') +
    parseFloat(watchedAit || '0') +
    parseFloat(watchedDelivery || '0');

  // ─── Vendor validation ──────────────────────────────────────────────────────
  const validateVendor = () => {
    const errs = {};
    if (vendorMode === 'existing') {
      if (!vendorId) errs.vendor_id = 'Please select a vendor';
    } else {
      if (!vendorName.trim()) errs.vendor_name = 'Vendor name is required';
      if (!vendorContactPerson.trim()) errs.vendor_contact_person = 'Contact person is required';
      if (!vendorEmail.trim()) errs.vendor_email = 'Vendor email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendorEmail))
        errs.vendor_email = 'Enter a valid email';
      if (vendorCategories.length === 0) errs.vendor_categories = 'Select at least one category';
    }
    return errs;
  };

  // ─── Create vendor manually ────────────────────────────────────────────────
  async function createManualVendor() {
    const categoryIds = vendorCategories.map((name) => categoryIdMap[name]).filter(Boolean);
    const payload = {
      name: vendorName,
      email: vendorEmail,
      phone: vendorPhone,
      address: vendorAddress,
      contact_person: vendorContactPerson,
      designation: vendorDesignation,
      categories: categoryIds,
      status: 'Active',
    };
    const res = await axiosInstance.post(
      endpoints.procurement_management.vendors_management,
      payload
    );
    return res.data;
  }

  // ─── Build FormData payload ──────────────────────────────────────────────────
  function buildFormData(data, status, createdVendorId) {
    const fd = new FormData();

    // ── RFQ Reference
    fd.append('rfq', String(rfq?.id ?? ''));
    fd.append('rfq_number', rfq?.rfq_number ?? '');
    fd.append('status', status);

    // ── Vendor Info
    if (vendorMode === 'existing' && vendorId) {
      const selectedVendor = vendorList.find((v) => v.id === Number(vendorId));
      fd.append('vendor_id', String(vendorId));
      fd.append('vendor_name', selectedVendor?.company_name || selectedVendor?.name || '');
      fd.append('vendor_email', selectedVendor?.email || '');
      fd.append('vendor_phone', selectedVendor?.phone || '');
      fd.append('vendor_address', selectedVendor?.address || '');
    } else {
      fd.append('vendor_id', String(createdVendorId));
      fd.append('vendor_name', vendorName);
      fd.append('vendor_email', vendorEmail);
      fd.append('vendor_phone', vendorPhone);
      fd.append('vendor_address', vendorAddress);
      fd.append('vendor_contact_person', vendorContactPerson);
      fd.append('vendor_designation', vendorDesignation);
    }

    // ── Technical Proposal
    fd.append('company_experience', data.company_experience);
    fd.append('methodology', data.methodology);
    fd.append(
      'delivery_lead_time_days',
      data.delivery_lead_time_days ? String(data.delivery_lead_time_days) : ''
    );
    fd.append('warranty_period', data.warranty_period);

    // ── Compliance (JSON)
    const compliancePayload = lineItems.map((item) => ({
      line_item_id: item.id,
      item_name: item.item_name,
      required_spec: item.specification,
      offered_spec: data.compliance?.[item.id]?.offered_spec ?? '',
      compliant: data.compliance?.[item.id]?.compliant ?? 'Yes',
    }));
    fd.append('compliance', JSON.stringify(compliancePayload));

    // ── Financial Items (JSON)
    const financialItems = lineItems.map((item) => {
      const unitPrice = parseFloat(data.financial?.[item.id]?.unit_price || '0');
      return {
        line_item_id: item.id,
        item_name: item.item_name,
        description: item.specification,
        qty: item.quantity,
        unit: item.unit,
        unit_price: unitPrice,
        total: unitPrice * item.quantity,
      };
    });
    fd.append('items', JSON.stringify(financialItems));

    // ── Totals
    fd.append('sub_total', String(subTotal));
    fd.append('vat', data.vat || '0');
    fd.append('ait', data.ait || '0');
    fd.append('delivery_charge', data.delivery_charge || '0');
    fd.append('grand_total', String(grandTotal));
    fd.append(
      'quotation_validity_days',
      data.quotation_validity_days ? String(data.quotation_validity_days) : ''
    );
    fd.append('payment_terms', data.payment_terms);
    fd.append('additional_remarks', data.additional_remarks);

    // ── Documents (File objects)
    requiredDocs.forEach((docName) => {
      const fileList = data.documents?.[docName];
      if (fileList && fileList[0]) {
        fd.append(`documents[${docName}]`, fileList[0]);
      }
    });

    // ── Declaration
    fd.append('declaration', String(data.declaration));

    return fd;
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const onSaveDraft = handleSubmit(async (data) => {
    const vendorErrs = validateVendor();
    if (Object.keys(vendorErrs).length > 0) {
      setVendorErrors(vendorErrs);
      toast.error('Please fill in vendor information.');
      return;
    }

    // Check for duplicate quotation
    if (vendorMode === 'manual' && vendorEmail && isEmailDuplicate(vendorEmail)) {
      toast.error('This vendor has already submitted a proposal for this RFQ.');
      return;
    }
    if (vendorMode === 'existing' && vendorId) {
      const selectedVendor = vendorList.find((v) => v.id === Number(vendorId));
      if (selectedVendor?.email && isEmailDuplicate(selectedVendor.email)) {
        toast.error('This vendor has already submitted a proposal for this RFQ.');
        return;
      }
    }

    let createdVendorId = null;
    if (vendorMode === 'manual') {
      try {
        const created = await createManualVendor();
        createdVendorId = created?.id;
        if (!createdVendorId) {
          toast.error('Failed to create vendor. Please try again.');
          return;
        }
      } catch (err) {
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.name?.[0] ||
          err?.response?.data?.email?.[0] ||
          'Failed to create vendor. Please try again.';
        toast.error(msg);
        return;
      }
    }

    postSubmission(buildFormData(data, 'draft', createdVendorId), 'draft');
  });

  const onSubmit = handleSubmit(
    async (data) => {
      // Validate RFQ is selected
      if (!selectedRfqId) {
        toast.error('Please select an RFQ before submitting.');
        return;
      }

      // Validate at least 1 document is uploaded
      const hasAtLeastOneDoc = requiredDocs.some((doc) => {
        if (isEditMode && existingDocNames.has(doc)) return true;
        const fl = watchedDocuments?.[doc];
        return !!(fl && fl[0]);
      });
      if (requiredDocs.length > 0 && !hasAtLeastOneDoc) {
        toast.error('Please upload at least 1 document in the Required Documents section.');
        return;
      }

      const vendorErrs = validateVendor();
      if (Object.keys(vendorErrs).length > 0) {
        setVendorErrors(vendorErrs);
        toast.error('Please fill in vendor information.');
        return;
      }

      // Check for duplicate quotation
      if (vendorMode === 'manual' && vendorEmail && isEmailDuplicate(vendorEmail)) {
        toast.error('This vendor has already submitted a proposal for this RFQ.');
        return;
      }
      if (vendorMode === 'existing' && vendorId) {
        const selectedVendor = vendorList.find((v) => v.id === Number(vendorId));
        if (selectedVendor?.email && isEmailDuplicate(selectedVendor.email)) {
          toast.error('This vendor has already submitted a proposal for this RFQ.');
          return;
        }
      }

      let createdVendorId = null;
      if (vendorMode === 'manual') {
        try {
          const created = await createManualVendor();
          createdVendorId = created?.id;
          if (!createdVendorId) {
            toast.error('Failed to create vendor. Please try again.');
            return;
          }
        } catch (err) {
          const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.name?.[0] ||
            err?.response?.data?.email?.[0] ||
            'Failed to create vendor. Please try again.';
          toast.error(msg);
          return;
        }
      }

      postSubmission(buildFormData(data, 'submitted', createdVendorId), 'submitted');
    },
    (formErrors) => {
      console.error('Validation errors:', formErrors);
    }
  );

  async function postSubmission(fd, status) {
    setIsSubmitting(true);
    try {
      if (isEditMode && editId) {
        await axiosInstance.patch(
          endpoints.procurement_management.vendor_rfq_submission_by_id(editId),
          fd,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
      } else {
        await axiosInstance.post(endpoints.procurement_management.vendor_rfq_submissions, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      toast.success(
        isEditMode ? 'Proposal updated successfully!' : 'Proposal submitted successfully!'
      );
      router.push('/dashboard/procurement/quotations/list');
    } catch (err) {
      console.error('API Error:', err);
      toast.error('Failed to submit proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Loading / Not Found ─────────────────────────────────────────────────────
  if (loading || (isEditMode && submissionLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!rfq && effectiveRfqId) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">RFQ not found.</p>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-8">
      {/* ── EXTRA: RFQ Reference Section ──────────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader
          title="RFQ Reference"
          description="Select an RFQ to load its line items automatically."
        />
        <CardBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Select RFQ <span className="text-red-500">*</span>
              </label>
              <Autocomplete
                options={rfqList}
                value={selectedRfqId}
                onChange={(val) => setSelectedRfqId(String(val))}
                getLabel={(item) =>
                  item ? `${item.rfq_number} ${item.rfq_title ? `-- ${item.rfq_title}` : ''}` : ''
                }
                getOptionLabel={(item) =>
                  `${item.rfq_number} ${item.rfq_title ? `-- ${item.rfq_title}` : ''}`
                }
                renderOption={(item) => {
                  const status = getRfqStatus(item);
                  const label = `${item.rfq_number}${item.rfq_title ? ` -- ${item.rfq_title}` : ''}`;
                  const iconMap = {
                    expired: <Ban className="w-3.5 h-3.5 text-red-500 shrink-0" />,
                    awarded: <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
                    urgent: <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />,
                    active: <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />,
                  };
                  return (
                    <div className="flex items-center justify-between gap-2 w-full min-w-0">
                      <span className="truncate">{label}</span>
                      <span
                        className={`inline-flex items-center gap-1 shrink-0 text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                          status.type === 'expired'
                            ? 'bg-red-50 text-red-600'
                            : status.type === 'awarded'
                              ? 'bg-amber-50 text-amber-600'
                              : status.type === 'urgent'
                                ? 'bg-orange-50 text-orange-600'
                                : 'bg-green-50 text-green-600'
                        }`}
                      >
                        {iconMap[status.type]}
                        {status.label}
                      </span>
                    </div>
                  );
                }}
                placeholder="Search by RFQ number or title..."
                disabled={!!routeId}
                loading={rfqListLoading}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── EXTRA: Vendor Information Section ─────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader
          title="Vendor Information"
          description="Select an existing vendor or enter vendor details manually."
        />
        <CardBody>
          <div className="space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setVendorMode('existing');
                  setVendorId(null);
                  setVendorErrors({});
                  setVendorName('');
                  setVendorEmail('');
                  setVendorPhone('');
                  setVendorAddress('');
                  setVendorContactPerson('');
                  setVendorDesignation('');
                  setVendorCategories([]);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  vendorMode === 'existing'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-muted-foreground border-border hover:bg-secondary'
                }`}
              >
                Select existing vendor
              </button>
              <button
                type="button"
                onClick={() => {
                  setVendorMode('manual');
                  setVendorId(null);
                  setVendorErrors({});
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  vendorMode === 'manual'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-muted-foreground border-border hover:bg-secondary'
                }`}
              >
                Enter vendor manually
              </button>
            </div>

            {/* Existing vendor selector */}
            {vendorMode === 'existing' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Select Vendor <span className="text-red-500">*</span>
                </label>
                <Autocomplete
                  options={filteredVendorList}
                  value={vendorId}
                  onChange={(val) => {
                    setVendorId(val ? Number(val) : null);
                    setVendorErrors((prev) => ({ ...prev, vendor_id: undefined }));
                  }}
                  getLabel={(item) =>
                    item ? (item.company_name ?? item.name ?? `Vendor #${item.id}`) : ''
                  }
                  getOptionLabel={(item) => item.company_name ?? item.name ?? `Vendor #${item.id}`}
                  placeholder={selectedRfqNumber && filteredVendorList.length < vendorList.length
                    ? `${filteredVendorList.length} vendors available (${vendorList.length - filteredVendorList.length} already submitted)`
                    : 'Search by vendor name...'}
                  loading={vendorLoading}
                />
                {vendorErrors.vendor_id && (
                  <p className="text-xs text-red-500 mt-1">{vendorErrors.vendor_id}</p>
                )}
                {vendorId &&
                  (() => {
                    const selectedVendor = vendorList.find((v) => v.id === Number(vendorId));
                    if (!selectedVendor) return null;
                    return (
                      <div className="mt-2 p-3 bg-muted/50 border border-border rounded-lg">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                          Selected Vendor Details
                        </p>
                        <div className="space-y-0.5 text-sm">
                          <p>
                            <strong>Name:</strong>{' '}
                            {selectedVendor.company_name || selectedVendor.name}
                          </p>
                          <p>
                            <strong>Email:</strong> {selectedVendor.email || '—'}
                          </p>
                          <p>
                            <strong>Phone:</strong> {selectedVendor.phone || '—'}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            )}

            {/* Manual vendor fields */}
            {vendorMode === 'manual' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Vendor / Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kampala Supplies Ltd"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      value={vendorName}
                      onChange={(e) => {
                        setVendorName(e.target.value);
                        setVendorErrors((prev) => ({ ...prev, vendor_name: undefined }));
                      }}
                    />
                    {vendorErrors.vendor_name && (
                      <p className="text-xs text-red-500 mt-1">{vendorErrors.vendor_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Contact Person <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      value={vendorContactPerson}
                      onChange={(e) => {
                        setVendorContactPerson(e.target.value);
                        setVendorErrors((prev) => ({ ...prev, vendor_contact_person: undefined }));
                      }}
                    />
                    {vendorErrors.vendor_contact_person && (
                      <p className="text-xs text-red-500 mt-1">
                        {vendorErrors.vendor_contact_person}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Contact Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="vendor@example.com"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      value={vendorEmail}
                      onChange={(e) => {
                        const val = e.target.value;
                        setVendorEmail(val);
                        setVendorErrors((prev) => ({ ...prev, vendor_email: undefined }));
                        if (val && isEmailDuplicate(val)) {
                          toast.error('This vendor has already submitted a proposal.');
                        }
                      }}
                    />
                    {vendorErrors.vendor_email && (
                      <p className="text-xs text-red-500 mt-1">{vendorErrors.vendor_email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sales Manager"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      value={vendorDesignation}
                      onChange={(e) => setVendorDesignation(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+256 700 000000"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      value={vendorPhone}
                      onChange={(e) => setVendorPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Vendor Address
                    </label>
                    <input
                      type="text"
                      placeholder="Plot 12, Kampala Road, Kampala"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      value={vendorAddress}
                      onChange={(e) => setVendorAddress(e.target.value)}
                    />
                  </div>
                </div>
                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Vendor Categories <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Select one or more categories. The vendor will be qualified to supply items in
                    these categories.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allCategoryNames.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setVendorCategories((prev) =>
                            prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                          );
                          setVendorErrors((prev) => ({ ...prev, vendor_categories: undefined }));
                        }}
                        className={`px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${
                          vendorCategories.includes(cat)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/30 text-foreground'
                        }`}
                      >
                        {vendorCategories.includes(cat) && (
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                        )}
                        {cat}
                      </button>
                    ))}
                    {allCategoryNames.length === 0 && (
                      <p className="text-xs text-muted-foreground">Loading categories...</p>
                    )}
                  </div>
                  {vendorErrors.vendor_categories && (
                    <p className="text-xs text-red-500 mt-1">{vendorErrors.vendor_categories}</p>
                  )}
                  {vendorCategories.length > 0 && (
                    <div className="mt-2 p-2 bg-muted/50 rounded-lg">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                        Selected ({vendorCategories.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {vendorCategories.map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-[11px] font-medium"
                          >
                            {cat}
                            <button
                              type="button"
                              onClick={() =>
                                setVendorCategories((prev) => prev.filter((c) => c !== cat))
                              }
                              className="hover:text-primary/70"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* ── Two-Envelope Info ──────────────────────────────────────────────────── */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              Two-Envelope Submission (Technical &amp; Financial)
            </p>
            <p className="text-xs text-blue-700 mt-1">
              As per AAB procurement policy, proposals are submitted in two separate envelopes. The
              Technical Proposal is evaluated first. Only technically qualified vendors&apos;
              Financial Proposals are opened and evaluated.
            </p>
          </div>
        </div>
      </div>

      {/* ── Section Tabs ──────────────────────────────────────────────────────── */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveSection('technical')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeSection === 'technical'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Envelope 1: Technical Proposal
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('financial')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeSection === 'financial'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Envelope 2: Financial Proposal
          </button>
        </div>
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* ── TECHNICAL PROPOSAL ─────────────────────────────────────────── */}
          {activeSection === 'technical' && (
            <>
              <Card>
                <CardHeader
                  title="Technical Proposal"
                  description="Company qualifications, methodology, and compliance with specifications"
                />
                <CardBody>
                  <div className="space-y-4">
                    {/* Company Experience */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Company Experience &amp; Capability Statement
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Describe your company's experience with similar projects, capacity to deliver the required quantities, and relevant past performance with Ledars NGO or similar organizations..."
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        {...register('company_experience')}
                      />
                    </div>

                    {/* Methodology */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Technical Methodology / Approach
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Describe your approach to fulfilling this order: sourcing, quality control, packaging, delivery logistics..."
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        {...register('methodology')}
                      />
                    </div>

                    {/* Compliance Table */}
                    {lineItems.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Compliance with Technical Specifications
                        </label>
                        <div className="border border-border rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-muted/50">
                              <tr className="text-left">
                                <th className="px-4 py-2 text-xs font-semibold">#</th>
                                <th className="px-4 py-2 text-xs font-semibold">Item</th>
                                <th className="px-4 py-2 text-xs font-semibold">Required Specs</th>
                                <th className="px-4 py-2 text-xs font-semibold">
                                  Your Offered Specs
                                </th>
                                <th className="px-4 py-2 text-xs font-semibold text-center">
                                  Compliant?
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {lineItems.map((item, idx) => (
                                <tr key={item.id} className="border-t border-border">
                                  <td className="px-4 py-2 text-sm">{idx + 1}</td>
                                  <td className="px-4 py-2 text-sm">{item.item_name}</td>
                                  <td className="px-4 py-2 text-xs text-muted-foreground">
                                    {item.specification || '—'}
                                  </td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="text"
                                      placeholder="Your specification"
                                      className="w-full px-2 py-1 text-sm border border-input rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                      {...register(`compliance.${item.id}.offered_spec`)}
                                    />
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    <select
                                      className="px-2 py-1 text-xs border border-input rounded"
                                      {...register(`compliance.${item.id}.compliant`)}
                                    >
                                      <option value="Yes">Yes</option>
                                      <option value="Partial">Partial</option>
                                      <option value="No">No</option>
                                    </select>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Delivery & Warranty */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Delivery Lead Time (days)
                        </label>
                        <input
                          type="number"
                          placeholder={
                            rfq?.delivery_commitment_days
                              ? `Required: ${rfq.delivery_commitment_days} days`
                              : 'e.g. 15'
                          }
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          {...register('delivery_lead_time_days')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Warranty Period
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 12 months"
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          {...register('warranty_period')}
                        />
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Required Documents */}
              {requiredDocs.length > 0 && (
                <Card>
                  <CardHeader
                    title="Required Documents Upload"
                    description="Upload documents specified in the RFQ. All fields are optional — you may submit with partial or no uploads."
                  />
                  <CardBody>
                    <div className="space-y-3">
                      {requiredDocs.map((doc, i) => (
                        <Controller
                          key={i}
                          control={control}
                          name={`documents.${doc}`}
                          render={({ field }) => {
                            const fileList = field.value;
                            const newFileName = fileList?.[0]?.name;
                            const alreadyUploaded = isEditMode && existingDocNames.has(doc);
                            const existingDoc = isEditMode
                              ? existingSubmission?.documents?.find((d) => d.doc_name === doc)
                              : null;
                            return (
                              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileText className="w-4 h-4 text-primary shrink-0" />
                                  <span className="text-sm truncate">{doc}</span>
                                  {newFileName ? (
                                    <span className="text-xs text-green-600 ml-2 shrink-0">
                                      ✓ {newFileName}
                                    </span>
                                  ) : alreadyUploaded ? (
                                    <span className="text-xs text-blue-600 ml-2 shrink-0">
                                      ✓ already uploaded
                                      {existingDoc?.file_url && (
                                        <a
                                          href={existingDoc.file_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="ml-1 underline"
                                        >
                                          view
                                        </a>
                                      )}
                                    </span>
                                  ) : null}
                                </div>
                                <label className="border-2 border-dashed border-border rounded px-4 py-1.5 text-xs text-muted-foreground cursor-pointer hover:border-primary/30 shrink-0">
                                  <Upload className="w-3 h-3 inline mr-1" />
                                  {alreadyUploaded && !newFileName
                                    ? 'Replace'
                                    : newFileName
                                      ? 'Re Upload'
                                      : 'Upload'}
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => field.onChange(e.target.files)}
                                  />
                                </label>
                              </div>
                            );
                          }}
                        />
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}
            </>
          )}

          {/* ── FINANCIAL PROPOSAL ─────────────────────────────────────────── */}
          {activeSection === 'financial' && (
            <>
              <Card>
                <CardHeader
                  title="Financial Proposal — Item Pricing"
                  description="All prices in BDT, inclusive of applicable VAT/Tax"
                />
                <CardBody>
                  <table className="w-full">
                    <thead className="border-b-2 border-border">
                      <tr className="text-left">
                        <th className="pb-3 text-xs font-semibold uppercase w-10">#</th>
                        <th className="pb-3 text-xs font-semibold uppercase">Description</th>
                        <th className="pb-3 text-xs font-semibold uppercase text-center">Qty</th>
                        <th className="pb-3 text-xs font-semibold uppercase text-right">
                          Unit Price (BDT)
                        </th>
                        <th className="pb-3 text-xs font-semibold uppercase text-right">
                          Total (BDT)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, idx) => {
                        const price = parseFloat(watchedFinancial?.[item.id]?.unit_price || '0');
                        const rowTotal = price * item.quantity;
                        return (
                          <tr key={item.id} className="border-b border-border">
                            <td className="py-3 pr-3 text-sm font-medium">{idx + 1}</td>
                            <td className="py-3 pr-3">
                              <p className="text-sm text-foreground">{item.item_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.specification || '—'}
                              </p>
                            </td>
                            <td className="py-3 pr-3 text-sm text-center">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-3 pr-3 text-right">
                              <input
                                type="number"
                                placeholder="0.00"
                                className="w-28 px-2 py-1.5 border border-input rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                {...register(`financial.${item.id}.unit_price`)}
                              />
                            </td>
                            <td className="py-3 text-sm font-medium text-right">
                              {price > 0
                                ? rowTotal.toLocaleString('en-BD', {
                                    minimumFractionDigits: 2,
                                  })
                                : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="border-t-2 border-border">
                      <tr>
                        <td colSpan={4} className="pt-3 text-sm font-semibold text-right">
                          Sub Total (BDT):
                        </td>
                        <td className="pt-3 text-sm font-semibold text-right">
                          {subTotal > 0
                            ? subTotal.toLocaleString('en-BD', {
                                minimumFractionDigits: 2,
                              })
                            : '—'}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="pt-1 text-sm text-right text-muted-foreground">
                          VAT (if applicable):
                        </td>
                        <td className="pt-1 text-sm text-right">
                          <input
                            type="number"
                            placeholder="0"
                            className="w-24 px-2 py-1 border border-input rounded text-right text-sm"
                            {...register('vat')}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="pt-1 text-sm text-right text-muted-foreground">
                          AIT (if applicable):
                        </td>
                        <td className="pt-1 text-sm text-right">
                          <input
                            type="number"
                            placeholder="0"
                            className="w-24 px-2 py-1 border border-input rounded text-right text-sm"
                            {...register('ait')}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="pt-1 text-sm text-right text-muted-foreground">
                          Transportation / Delivery Charge:
                        </td>
                        <td className="pt-1 text-sm text-right">
                          <input
                            type="number"
                            placeholder="0"
                            className="w-24 px-2 py-1 border border-input rounded text-right text-sm"
                            {...register('delivery_charge')}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="pt-2 text-sm font-bold text-right">
                          Grand Total (BDT):
                        </td>
                        <td className="pt-2 text-sm font-bold text-right text-primary">
                          {grandTotal > 0
                            ? grandTotal.toLocaleString('en-BD', {
                                minimumFractionDigits: 2,
                              })
                            : '—'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Payment &amp; Validity" />
                <CardBody>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Quotation Validity (days)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 30"
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        {...register('quotation_validity_days')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Payment Terms
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        {...register('payment_terms')}
                      >
                        <option>100% after delivery &amp; inspection</option>
                        <option>Net 30 after delivery</option>
                        <option>Net 15 after delivery</option>
                        <option>50% advance, 50% delivery</option>
                      </select>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Additional Remarks" />
                <CardBody>
                  <textarea
                    rows={3}
                    placeholder="Any conditions, discounts for early payment, bulk pricing notes..."
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    {...register('additional_remarks')}
                  />
                </CardBody>
              </Card>
            </>
          )}

          {/* Declaration */}
          <Card>
            <CardBody>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-border"
                  {...register('declaration')}
                />
                <span className="text-sm text-foreground leading-relaxed">
                  I hereby confirm that the information in both the Technical and Financial
                  proposals are accurate, the goods/services meet the stated specifications, and I
                  accept the terms and conditions outlined in the RFQ document. I understand that
                  Ledars NGO reserves the right to accept or reject any proposal.
                </span>
              </label>
            </CardBody>
          </Card>
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Actions" />
            <CardBody>
              <div className="space-y-3">
                {/* <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  disabled={isSubmitting}
                  onClick={onSaveDraft}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isEditMode ? 'Update Draft' : 'Save Draft'}
                </Button> */}
                <Button
                  variant="primary"
                  className="w-full"
                  type="button"
                  disabled={isSubmitting}
                  onClick={onSubmit}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isSubmitting
                    ? isEditMode
                      ? 'Updating...'
                      : 'Submitting...'
                    : isEditMode
                      ? 'Update & Submit'
                      : 'Submit Proposal'}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Both technical &amp; financial envelopes will be submitted together
              </p>
            </CardBody>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardBody>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800 mb-1">Important Notes</p>
                  <ul className="text-xs text-orange-700 space-y-1.5">
                    <li>&bull; Technical proposal must NOT include pricing</li>
                    <li>&bull; All prices in BDT, inclusive of taxes</li>
                    <li>&bull; Delivery cost should be declared separately</li>
                    <li>&bull; Late submissions will not be accepted</li>
                    <li>&bull; Once submitted, proposal cannot be modified</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* RFQ Summary */}
          {rfq && (
            <Card>
              <CardHeader title="RFQ Summary" />
              <CardBody>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RFQ ID</span>
                    <span className="font-medium">{rfq.rfq_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <Badge variant="default" size="sm">
                      {rfq.category_name ?? rfq.category ?? '—'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items</span>
                    <span className="font-medium">{lineItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Closing Date</span>
                    <span className="font-semibold text-orange-600">
                      {formatDate(rfq.submission_deadline)}
                    </span>
                  </div>
                  {rfq.delivery_commitment_days && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery Days</span>
                      <span className="font-medium">{rfq.delivery_commitment_days} days</span>
                    </div>
                  )}
                  {rfq.urgency && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Urgency</span>
                      <Badge variant={rfq.urgency === 'Urgent' ? 'danger' : 'default'} size="sm">
                        {rfq.urgency}
                      </Badge>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Value</span>
                    <span className="font-medium">
                      BDT {parseFloat(rfq.total_estimated_value ?? '0').toLocaleString('en-BD')}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Submission Checklist */}
          <Card>
            <CardHeader title="Submission Checklist" />
            <CardBody>
              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">
                    {completedCount} / {checklistItems.length} completed
                  </span>
                  {allChecklistPassed ? (
                    <span className="text-[10px] font-semibold text-green-600 flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3" /> Ready to submit
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-orange-500">
                      {checklistItems.length - completedCount} item(s) pending
                    </span>
                  )}
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      allChecklistPassed ? 'bg-green-500' : 'bg-orange-400'
                    }`}
                    style={{
                      width: `${(completedCount / checklistItems.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {checklistItems.map((item) => {
                  const done = autoChecklist[item.key];
                  return (
                    <div
                      key={item.key}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                        done ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          done ? 'bg-green-500' : 'bg-orange-300'
                        }`}
                      >
                        {done ? (
                          <CheckCircle className="w-2.5 h-2.5 text-white" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                        )}
                      </div>
                      <span className={done ? 'line-through opacity-60' : 'font-medium'}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}

                {/* Documents row — required, at least 1 upload needed */}
                {requiredDocs.length > 0 && (
                  <div
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                      autoChecklist.documents_uploaded
                        ? 'bg-green-50 text-green-800'
                        : 'bg-orange-50 text-orange-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        autoChecklist.documents_uploaded ? 'bg-green-500' : 'bg-orange-300'
                      }`}
                    >
                      {autoChecklist.documents_uploaded ? (
                        <CheckCircle className="w-2.5 h-2.5 text-white" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                      )}
                    </div>
                    <span
                      className={
                        autoChecklist.documents_uploaded ? 'line-through opacity-60' : 'font-medium'
                      }
                    >
                      At least 1 document uploaded
                    </span>
                  </div>
                )}
              </div>

              {!allChecklistPassed && (
                <p className="mt-3 text-[10px] text-orange-600 text-center">
                  Upload at least 1 document to enable submission.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
