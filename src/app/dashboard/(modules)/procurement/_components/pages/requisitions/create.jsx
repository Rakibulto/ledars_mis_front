'use client';

import Link from 'next/link';
import { useRef, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import {
  X,
  Eye,
  Plus,
  Save,
  Send,
  Clock,
  Stamp,
  Trash2,
  Upload,
  FileText,
  ArrowLeft,
  UserCheck,
  DollarSign,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';

import { TextField, Autocomplete } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import RichTextEditor from '../../components/ui/rich-text-editor';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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

const WARRANTY_OPTIONS = ['None', '6 Months', '1 Year', '2 Years', '3 Years', '5 Years'];
const COUNTRY_OPTIONS = ['Bangladesh', 'Any Asian Country', 'Japan', 'USA / Europe', 'Any Country'];

const DEFAULT_ITEM = {
  item: null,
  description: '',
  specification: '',
  unit: 'Pcs',
  quantity: 1,
  estimated_rate: 0,
  extended_amount: 0,
  remarks: '',
};

const DEFAULT_FORM_VALUES = {
  department: null,
  project: null,
  donor_code: null,
  category: null,
  priority: null,
  purpose: '',
  budget_code: null,
  account_code: null,
  fiscal_year: '',
  specifications: '',
  preferred_brand: '',
  alternative_brands: '',
  warranty_period: '',
  country_of_origin: '',
  quality_standards: '',
  requesting_office: null,
  delivery_location: null,
  delivery_date: '',
  contact_person: '',
  contact_phone: '',
  special_instruction: '',
  mr_items: [{ ...DEFAULT_ITEM }],
};

export function CreateRequisition() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = Boolean(editId);

  const {
    data: requisitionDefaultData,
    isLoading,
    error,
  } = useGetRequest(
    editId
      ? `${endpoints.procurement_management.material_requisitions}?requisition_no=${editId}`
      : null
  );

  const router = useRouter();

  const { data: formOptionsData } = useGetRequest(
    endpoints.procurement_management.material_requisitions_form_options
  );
  const { data: officeLocations } = useGetRequest(
    endpoints.procurement_management.office_management
  );
  const { data: ngoProjectsData } = useGetRequest(endpoints.projectManagements.projects);
  const { data: uomData } = useGetRequest(endpoints.storeInventory.uom);
  // ── React Hook Form ────────────────────────────────────────────────────────
  const { control, register, setValue, watch, getValues, handleSubmit } = useForm({
    defaultValues: DEFAULT_FORM_VALUES,
  });
  const { data: categoryOptions } = useGetRequest(endpoints.storeInventory.item_category);
  // console.log('categories:', categoryOptions);
  const { data: fiscalYearOptionsRaw } = useGetRequest(endpoints.accounting.fiscal_years);
  const fiscalYearOptions = useMemo(() => {
    const raw = fiscalYearOptionsRaw;
    const list = Array.isArray(raw) ? raw : (raw?.results ?? []);
    return list.map((fy) => fy.code || fy.name || String(fy.id)).filter(Boolean);
  }, [fiscalYearOptionsRaw]);

  const unitOptions = useMemo(() => {
    if (!uomData) return UNIT_OPTIONS;
    const raw = Array.isArray(uomData) ? uomData : (uomData.results ?? []);
    const names = raw.map((item) => (item?.name ?? '').toString().trim()).filter(Boolean);
    return names.length ? Array.from(new Set(names)).sort() : UNIT_OPTIONS;
  }, [uomData]);

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'mr_items' });

  // ── UI state (not form data) ───────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState(0);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const [options, setOptions] = useState({
    departments: [],
    projects: [],
    donor_codes: [],
    categories: [],
    priorities: [],
    statuses: [],
    budgets: [],
    accounts: [],
    office_locations: [],
    items: [],
    current_user: null,
  });
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const hasPrefilledRef = useRef(false);

  // ── Populate options from useGetRequest (SWR) ───────────────────────────
  useEffect(() => {
    if (!formOptionsData || Object.keys(formOptionsData).length === 0) return;

    setOptions({
      departments: formOptionsData.departments ?? [],
      projects: formOptionsData.projects ?? [],
      donor_codes: formOptionsData.donor_codes ?? [],
      categories: categoryOptions ?? [],
      priorities: formOptionsData.priorities ?? [],
      statuses: formOptionsData.statuses ?? [],
      budgets: formOptionsData.budgets ?? [],
      accounts: formOptionsData.accounts ?? [],
      office_locations: officeLocations ?? [],
      items: formOptionsData.items ?? [],
      current_user: formOptionsData.current_user ?? null,
    });

    // Pre-fill contact person from logged-in employee
    if (formOptionsData.current_user?.employee_name) {
      setValue('contact_person', formOptionsData.current_user.employee_name);
    }

    // Pre-select Medium priority
    if (formOptionsData.priorities?.length) {
      const mediumPrio =
        formOptionsData.priorities.find((p) => p.value === 'Medium') ??
        formOptionsData.priorities[0];
      setValue('priority', mediumPrio);
    }

    setOptionsLoading(false);
  }, [formOptionsData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync office_locations, categories, and ngo-projects when their data arrives separately ──
  useEffect(() => {
    if (officeLocations) {
      setOptions((prev) => ({ ...prev, office_locations: officeLocations }));
    }
  }, [officeLocations]);

  useEffect(() => {
    if (categoryOptions) {
      setOptions((prev) => ({ ...prev, categories: categoryOptions }));
    }
  }, [categoryOptions]);

  useEffect(() => {
    if (ngoProjectsData) {
      const results = Array.isArray(ngoProjectsData)
        ? ngoProjectsData
        : (ngoProjectsData.results ?? []);
      const projects = results.map((p) => ({ id: p.id, code: p.code, name: p.title }));
      setOptions((prev) => ({ ...prev, projects }));
    }
  }, [ngoProjectsData]);

  // ── Prefill form in Edit Mode ─────────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode) return;
    if (hasPrefilledRef.current) return;
    if (optionsLoading) return;

    const raw = requisitionDefaultData?.[0];
    if (!raw?.id) return;

    hasPrefilledRef.current = true;

    const findById = (list, id) =>
      id ? (list.find((o) => String(o.id) === String(id)) ?? null) : null;
    const findByValue = (list, value) =>
      value ? (list.find((o) => o.value === value) ?? null) : null;

    setValue(
      'department',
      findById(options.departments, raw.department) ??
        (raw.department ? { id: raw.department, name: raw.department_name } : null)
    );
    setValue('project', findById(options.projects, raw.project) ?? raw.project_info ?? null);
    setValue(
      'donor_code',
      findById(options.donor_codes, raw.donor_code) ?? raw.donor_code_info ?? null
    );
    setValue(
      'category',
      findById(options.categories, raw.category) ??
        (raw.category ? { id: raw.category, name: raw.category_name } : null)
    );
    setValue(
      'priority',
      findByValue(options.priorities, raw.priority) ??
        (raw.priority ? { value: raw.priority, label: raw.priority } : null)
    );
    setValue('fiscal_year', raw.fiscal_year ?? '');
    setValue('purpose', raw.purpose ?? '');
    setValue(
      'budget_code',
      findById(options.budgets, raw.budget_code) ?? raw.budget_code_display ?? null
    );
    setValue(
      'account_code',
      findById(options.accounts, raw.account_code) ?? raw.account_code_display ?? null
    );
    setValue('specifications', raw.specifications ?? '');
    setValue('preferred_brand', raw.preferred_brand ?? '');
    setValue('alternative_brands', raw.alternative_brands ?? '');
    setValue('warranty_period', raw.warranty_period ?? '');
    setValue('country_of_origin', raw.country_of_origin ?? '');
    setValue('quality_standards', raw.quality_standards ?? '');
    setValue(
      'requesting_office',
      findById(options.office_locations, raw.requesting_office) ??
        raw.requesting_office_info ??
        null
    );
    setValue(
      'delivery_location',
      findById(options.office_locations, raw.delivery_location) ??
        raw.delivery_location_info ??
        null
    );
    setValue('delivery_date', raw.delivery_date ?? '');
    setValue('contact_person', raw.contact_person ?? '');
    setValue('contact_phone', raw.contact_phone ?? '');
    setValue('special_instruction', raw.special_instruction ?? '');

    // Replace mr_items
    if (Array.isArray(raw.mr_items) && raw.mr_items.length > 0) {
      const mappedItems = raw.mr_items.map((apiItem) => ({
        item:
          findById(options.items, apiItem.item) ??
          (apiItem.item ? { id: apiItem.item, name: apiItem.item_name } : null),
        description: apiItem.requested_item_description ?? apiItem.item_name ?? '',
        specification: apiItem.subcategory ?? '',
        unit: apiItem.requested_unit ?? 'Pcs',
        quantity: apiItem.quantity ?? 1,
        estimated_rate:
          parseFloat(apiItem.requested_unit_price) || parseFloat(apiItem.unit_price) || 0,
        extended_amount: parseFloat(apiItem.total_price) || 0,
        remarks: apiItem.remarks ?? '',
      }));
      replace(mappedItems);
    }

    // Load existing server-side attachments
    if (Array.isArray(raw.attachments) && raw.attachments.length > 0) {
      setExistingAttachments(raw.attachments);
    }
  }, [isEditMode, optionsLoading, requisitionDefaultData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Watched values for derived state ─────────────────────────────────────
  const watchedItems = watch('mr_items') ?? [];
  const watchBudgetCode = watch('budget_code');
  const watchFiscalYear = watch('fiscal_year');
  const watchDeliveryLocation = watch('delivery_location');

  const totalAmount = watchedItems.reduce(
    (sum, item) => sum + (parseFloat(item.extended_amount) || 0),
    0
  );

  const selectedBudget = options.budgets.find((b) => String(b.id) === String(watchBudgetCode?.id));

  const selectedDeliveryLocation = options.office_locations.find(
    (l) => String(l.id) === String(watchDeliveryLocation?.id)
  );

  // ── BOQ helpers ───────────────────────────────────────────────────────────
  const addItem = () => append({ ...DEFAULT_ITEM });

  const recalcExtended = (index, qty, rate) => {
    setValue(`mr_items.${index}.extended_amount`, (parseFloat(qty) || 0) * (parseFloat(rate) || 0));
  };

  // ── File attachment helpers ───────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.size <= 10 * 1024 * 1024);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const removeAttachment = (idx) => setAttachments((prev) => prev.filter((_, i) => i !== idx));

  // ── Payload builder — maps RHF values to backend field names ─────────────
  const buildPayload = (values, submitStatus) => {
    const fd = new FormData();

    fd.append('status', submitStatus);

    // FK fields — send only the numeric id
    if (values.department?.id) fd.append('department', values.department.id);
    if (values.project?.id) fd.append('project', values.project.id);
    if (values.donor_code?.id) fd.append('donor_code', values.donor_code.id);
    if (values.category?.id) fd.append('category', values.category.id);
    if (values.budget_code?.id) fd.append('budget_code', values.budget_code.id);
    if (values.account_code?.id) fd.append('account_code', values.account_code.id);
    if (values.requesting_office?.id) fd.append('requesting_office', values.requesting_office.id);
    if (values.delivery_location?.id) fd.append('delivery_location', values.delivery_location.id);

    // Choice field — priority stores {value, label}; send value only
    if (values.priority?.value) fd.append('priority', values.priority.value);

    // Plain text / date fields
    if (values.fiscal_year) fd.append('fiscal_year', values.fiscal_year);
    if (values.purpose) fd.append('purpose', values.purpose);
    if (values.specifications) fd.append('specifications', values.specifications);
    if (values.preferred_brand) fd.append('preferred_brand', values.preferred_brand);
    if (values.alternative_brands) fd.append('alternative_brands', values.alternative_brands);
    if (values.warranty_period) fd.append('warranty_period', values.warranty_period);
    if (values.country_of_origin) fd.append('country_of_origin', values.country_of_origin);
    if (values.quality_standards) fd.append('quality_standards', values.quality_standards);
    if (values.delivery_date) fd.append('delivery_date', values.delivery_date);
    if (values.contact_person) fd.append('contact_person', values.contact_person);
    if (values.contact_phone) fd.append('contact_phone', values.contact_phone);
    if (values.special_instruction) fd.append('special_instruction', values.special_instruction);

    // mr_items — map estimated_rate → requested_unit_price (backend field name)
    // extended_amount is NOT sent; backend recalculates total_amount server-side
    const mrItems = (values.mr_items ?? [])
      .filter((i) => i.description || i.item?.id)
      .map((i) => ({
        ...(i.item?.id
          ? { item: i.item.id }
          : { requested_item_name: i.description || i.item?.name || '' }),
        requested_item_description: i.specification || '',
        requested_unit: i.unit || 'Pcs',
        requested_unit_price: parseFloat(i.estimated_rate) || 0,
        quantity: parseInt(i.quantity, 10) || 1,
        remarks: i.remarks || '',
      }));
    fd.append('mr_items', JSON.stringify(mrItems));

    // attachment (single primary file — model FileField)
    if (attachments.length > 0) {
      fd.append('attachment', attachments[0]);
    }

    // attachment_files (additional files via MaterialRequisitionAttachment relation)
    if (attachments.length > 1) {
      attachments.slice(1).forEach((f) => fd.append('attachment_files', f));
    }

    return fd;
  };

  // ── Submit — status = 'Draft' or 'Pending Approval' ──────────────────────
  const submitForm = (submitStatus) =>
    handleSubmit(async (values) => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        const payload = buildPayload(values, submitStatus);
        if (isEditMode) {
          const raw = requisitionDefaultData?.[0];
          const numericId = raw?.id;
          await axiosInstance.patch(
            endpoints.procurement_management.material_requisitions_by_id(numericId),
            payload
          );
        } else {
          await axiosInstance.post(endpoints.procurement_management.material_requisitions, payload);
        }
        router.push('/dashboard/procurement/requisitions/list');
      } catch (err) {
        const errData = err?.response?.data;
        setSubmitError(
          typeof errData === 'object'
            ? JSON.stringify(errData, null, 2)
            : String(errData ?? err.message ?? 'Network error. Please try again.')
        );
        setSubmitting(false);
      } finally {
        console.log('Submission attempt finished.');
      }
    });

  // ── Sections ──────────────────────────────────────────────────────────────
  const sections = [
    'Basic Information',
    'Budget & Funding',
    'Bill of Quantities (BOQ)',
    'Specifications & Details',
    'Delivery & Contact',
    'Attachments',
    'Review & Submit',
  ];

  const getApprovalLevels = () => [
    {
      step: 1,
      title: 'Budget Clearance',
      role: 'Finance Focal',
      approver: 'Finance Manager',
      icon: DollarSign,
      color: 'text-blue-600 bg-blue-50',
      description: 'Verifies budget availability and budget code accuracy',
    },
    {
      step: 2,
      title: 'Endorsement',
      role: 'Programme Head / Area Manager',
      approver: totalAmount > 500000 ? 'Director Programmes' : 'Area Manager',
      icon: UserCheck,
      color: 'text-purple-600 bg-purple-50',
      description: 'Endorses requisition for procurement processing',
    },
    {
      step: 3,
      title: 'Final Approval',
      role:
        totalAmount > 2000000
          ? 'Country Director'
          : totalAmount > 500000
            ? 'Head of Operations'
            : 'Programme Coordinator',
      approver:
        totalAmount > 2000000
          ? 'Country Director'
          : totalAmount > 500000
            ? 'Head of Operations'
            : 'Programme Coordinator',
      icon: Stamp,
      color: 'text-green-600 bg-green-50',
      description: 'Final approval as per authority delegation matrix',
    },
  ];

  const currentUser = options.current_user;

  // Shared sx for MUI Autocomplete TextFields
  const acSx = {
    '& .MuiOutlinedInput-root': { borderRadius: '0.5rem', fontSize: '0.875rem' },
  };

  return (
    <div className="p-4 md:p-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/procurement/requisitions/list">
            <button className="rounded-lg p-2 transition-colors hover:bg-muted">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
          </Link>
          <div>
            <h1 className="mb-1 text-2xl font-semibold text-foreground">
              {isEditMode
                ? `Edit Material Requisition — ${
                    requisitionDefaultData?.[0]?.requisition_no ?? editId
                  }`
                : 'Create Material Requisition Form (MRF)'}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode
                ? 'Update requisition details, BOQ, specifications, and approvers'
                : 'Submit a new MRF with specifications, BOQ, and budget details'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge size="lg" variant="info">
            {isEditMode ? 'Edit Mode' : 'Draft — Version 1.0'}
          </Badge>
          <Badge size="lg" variant="default">
            {isEditMode ? (requisitionDefaultData?.[0]?.requisition_no ?? 'MRF-EDIT') : 'MRF-AUTO'}
          </Badge>
        </div>
      </div>

      {/* ── Progress Steps ──────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            {sections.map((section, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSection(idx)}
                className="group flex flex-col items-center gap-1.5"
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    idx < activeSection
                      ? 'bg-success text-white'
                      : idx === activeSection
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {idx < activeSection ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                </div>
                <span
                  className={`max-w-20 text-center text-[10px] font-medium leading-tight ${
                    idx === activeSection ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {section}
                </span>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>
      {/* main */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ── Main Content ──────────────────────────────────────────────────── */}
        <div className="col-span-12 space-y-6 lg:col-span-9">
          {/* ─────── Section 0 : Basic Information ─────────────────────────── */}
          {activeSection === 0 && (
            <Card>
              <CardHeader
                title="Basic Information"
                description="Enter MRF details — all staff can submit MRF"
                action={
                  <Badge size="sm" variant="danger">
                    Required
                  </Badge>
                }
              />
              <CardBody>
                <div className="space-y-4">
                  {/* Row 1: Requesting Office / Department / Project */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Requesting Office *
                      </label>
                      <Controller
                        name="requesting_office"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            value={field.value}
                            onChange={(_, val) => field.onChange(val)}
                            options={options.office_locations}
                            getOptionLabel={(opt) => opt?.name ?? ''}
                            isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                            size="small"
                            loading={optionsLoading}
                            sx={acSx}
                            renderInput={(params) => (
                              <TextField {...params} placeholder="Select office" size="small" />
                            )}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Department *
                      </label>
                      <Controller
                        name="department"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            value={field.value}
                            onChange={(_, val) => field.onChange(val)}
                            options={options.departments}
                            getOptionLabel={(opt) => opt?.name ?? ''}
                            isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                            size="small"
                            loading={optionsLoading}
                            sx={acSx}
                            renderInput={(params) => (
                              <TextField {...params} placeholder="Select department" size="small" />
                            )}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Project / Programme *
                      </label>
                      <Controller
                        name="project"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            value={field.value}
                            onChange={(_, val) => field.onChange(val)}
                            options={options.projects}
                            getOptionLabel={(opt) =>
                              opt ? `${opt.name}${opt.code ? ` (${opt.code})` : ''}` : ''
                            }
                            isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                            size="small"
                            loading={optionsLoading}
                            sx={acSx}
                            renderInput={(params) => (
                              <TextField {...params} placeholder="Select project" size="small" />
                            )}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Row 2: Category / Priority / Fiscal Year */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Category *
                      </label>
                      <Controller
                        name="category"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            value={field.value}
                            onChange={(_, val) => field.onChange(val)}
                            options={options.categories}
                            getOptionLabel={(opt) => opt?.name ?? ''}
                            isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                            size="small"
                            loading={optionsLoading}
                            sx={acSx}
                            renderInput={(params) => (
                              <TextField {...params} placeholder="Select category" size="small" />
                            )}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Priority *
                      </label>
                      <Controller
                        name="priority"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            value={field.value}
                            onChange={(_, val) => field.onChange(val)}
                            options={
                              options.priorities.length > 0
                                ? options.priorities
                                : [
                                    { value: 'Low', label: 'Low — Routine' },
                                    { value: 'Medium', label: 'Medium — Standard' },
                                    { value: 'High', label: 'High — Urgent Programme Need' },
                                    { value: 'Urgent', label: 'Urgent — Emergency' },
                                  ]
                            }
                            getOptionLabel={(opt) => opt?.label ?? opt?.value ?? ''}
                            isOptionEqualToValue={(opt, val) => opt?.value === val?.value}
                            size="small"
                            sx={acSx}
                            renderInput={(params) => (
                              <TextField {...params} placeholder="Select priority" size="small" />
                            )}
                          />
                        )}
                      />
                    </div>
                    {/*
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Fiscal Year
                      </label>
                      <input
                        {...register('fiscal_year')}
                        type="text"
                        placeholder="e.g. FY-2025-2026"
                        className="w-full rounded-lg border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div> */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Fiscal Year
                      </label>
                      <Controller
                        name="fiscal_year"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            value={field.value || ''}
                            onChange={(_, val) => field.onChange(val)}
                            options={fiscalYearOptions}
                            getOptionLabel={(opt) => opt || ''}
                            isOptionEqualToValue={(opt, val) => opt === val}
                            size="small"
                            loading={optionsLoading || !fiscalYearOptionsRaw}
                            sx={acSx}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Select fiscal year"
                                size="small"
                              />
                            )}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Row 3: Requester info (read-only) */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Requester Name
                      </label>
                      <input
                        type="text"
                        value={currentUser?.employee_name || currentUser?.username || ''}
                        readOnly
                        className="w-full rounded-lg border border-input bg-muted px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Designation / Position
                      </label>
                      <input
                        type="text"
                        value={currentUser?.designation || ''}
                        readOnly
                        className="w-full rounded-lg border border-input bg-muted px-3 py-2"
                      />
                    </div>
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Purpose / Justification *
                    </label>
                    <textarea
                      {...register('purpose')}
                      rows={4}
                      className="w-full resize-none rounded-lg border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Explain the business need and justification. Include programme activity reference, expected outcomes..."
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Min 50 characters. Reference specific programme activities or work plan items.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* ─────── Section 1 : Budget & Funding ──────────────────────────── */}
          {activeSection === 1 && (
            <Card>
              <CardHeader
                title="Budget & Funding Information"
                description="Select budget allocation and donor funding source"
                action={
                  <Badge size="sm" variant="danger">
                    Required
                  </Badge>
                }
              />
              <CardBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {/* Budget Code */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Budget Code *
                      </label>
                      <Controller
                        name="budget_code"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            value={field.value}
                            onChange={(_, val) => {
                              field.onChange(val);
                              if (!watchFiscalYear && val?.fiscal_year) {
                                setValue('fiscal_year', val.fiscal_year);
                              }
                            }}
                            options={options.budgets}
                            getOptionLabel={(opt) => (opt ? `${opt.code} – ${opt.name}` : '')}
                            isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                            size="small"
                            loading={optionsLoading}
                            sx={acSx}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Select budget code"
                                size="small"
                              />
                            )}
                          />
                        )}
                      />
                    </div>

                    {/* Donor Code */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Donor Code
                      </label>
                      <Controller
                        name="donor_code"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            value={field.value}
                            onChange={(_, val) => field.onChange(val)}
                            options={options.donor_codes}
                            getOptionLabel={(opt) => (opt ? `${opt.code} – ${opt.name}` : '')}
                            isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                            size="small"
                            loading={optionsLoading}
                            sx={acSx}
                            renderInput={(params) => (
                              <TextField {...params} placeholder="Select donor" size="small" />
                            )}
                          />
                        )}
                      />
                    </div>

                    {/* Account Head */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Account Head *
                      </label>
                      <Controller
                        name="account_code"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            value={field.value}
                            onChange={(_, val) => field.onChange(val)}
                            options={options.accounts}
                            getOptionLabel={(opt) => (opt ? `${opt.code} – ${opt.name}` : '')}
                            isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                            size="small"
                            loading={optionsLoading}
                            sx={acSx}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Select account head"
                                size="small"
                              />
                            )}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Budget Availability Panel */}
                  {selectedBudget && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <h4 className="text-sm font-semibold text-foreground">
                          Budget Availability – {selectedBudget.code}
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {[
                          ['Total Allocated', selectedBudget.allocated_amount, 'text-foreground'],
                          ['Spent to Date', selectedBudget.spent, 'text-red-600'],
                          ['Available Balance', selectedBudget.balance, 'text-green-600'],
                        ].map(([label, amount, cls]) => (
                          <div
                            key={label}
                            className="rounded-lg border border-border bg-card p-3 text-center"
                          >
                            <p className="mb-1 text-xs text-muted-foreground">{label}</p>
                            <p className={`text-lg font-bold ${cls}`}>
                              ৳{Number(amount || 0).toLocaleString()}
                            </p>
                          </div>
                        ))}
                        <div className="rounded-lg border border-border bg-card p-3 text-center">
                          <p className="mb-1 text-xs text-muted-foreground">Fiscal Year</p>
                          <p className="text-lg font-bold text-foreground">
                            {selectedBudget.fiscal_year || '—'}
                          </p>
                        </div>
                      </div>
                      {totalAmount > 0 && totalAmount > Number(selectedBudget.balance) && (
                        <div className="mt-3 flex gap-2 rounded border border-red-200 bg-red-50 p-3">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                          <p className="text-xs text-red-700">
                            Estimated amount exceeds available balance. Budget transfer may be
                            required.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* ─────── Section 2 : BOQ ────────────────────────────────────────── */}
          {activeSection === 2 && (
            <Card>
              <CardHeader
                title="Bill of Quantities (BOQ)"
                description="Add items with specifications, quantities, and estimated costs"
                action={
                  <Button size="sm" variant="outline" onClick={addItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Line Item
                  </Button>
                }
              />
              <CardBody>
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          {[
                            { label: 'SL#', cls: 'w-10 text-left' },
                            { label: 'Item (Inventory)', cls: 'w-40 text-left' },
                            { label: 'Description', cls: 'w-44 text-left' },
                            { label: 'Specifications', cls: 'w-44 text-left' },
                            { label: 'Unit', cls: 'w-24 text-center' },
                            { label: 'Qty', cls: 'w-16 text-center' },
                            { label: 'Est. Rate (৳)', cls: 'w-28 text-right' },
                            { label: 'Ext. Amount (৳)', cls: 'w-28 text-right' },
                            { label: 'Remarks', cls: 'w-28 text-left' },
                            { label: '', cls: 'w-8' },
                          ].map((col) => (
                            <th
                              key={col.label}
                              className={`px-3 py-2 text-xs font-semibold text-foreground ${col.cls}`}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((field, index) => (
                          <tr key={field.id} className="border-b border-border">
                            {/* SL# */}
                            <td className="px-3 py-2 text-sm font-mono">{index + 1}</td>

                            {/* Item — Autocomplete from inventory products */}
                            <td className="px-3 py-2">
                              <Controller
                                name={`mr_items.${index}.item`}
                                control={control}
                                render={({ field: f }) => (
                                  <Autocomplete
                                    value={f.value}
                                    onChange={(_, val) => {
                                      f.onChange(val);
                                      if (val) {
                                        setValue(`mr_items.${index}.description`, val.name ?? '');
                                        setValue(
                                          `mr_items.${index}.specification`,
                                          val.subcategory_name ?? ''
                                        );
                                        setValue(`mr_items.${index}.unit`, val.unit ?? 'Pcs');
                                        const rate = parseFloat(val.unit_price) || 0;
                                        setValue(`mr_items.${index}.estimated_rate`, rate);
                                        const qty =
                                          parseFloat(getValues(`mr_items.${index}.quantity`)) || 1;
                                        setValue(`mr_items.${index}.extended_amount`, qty * rate);
                                      }
                                    }}
                                    options={options.items}
                                    getOptionLabel={(opt) => opt?.name ?? ''}
                                    isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                                    size="small"
                                    sx={{
                                      width: 160,
                                      '& .MuiOutlinedInput-root': { fontSize: '0.75rem' },
                                    }}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        placeholder="Manual entry"
                                        size="small"
                                      />
                                    )}
                                  />
                                )}
                              />
                            </td>

                            {/* Description */}
                            <td className="px-3 py-2">
                              <input
                                {...register(`mr_items.${index}.description`)}
                                type="text"
                                placeholder="Item name..."
                                className="w-full rounded border border-input px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </td>

                            {/* Specification */}
                            <td className="px-3 py-2">
                              <input
                                {...register(`mr_items.${index}.specification`)}
                                type="text"
                                placeholder="Brand, model, size..."
                                className="w-full rounded border border-input px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </td>

                            {/* Unit */}
                            <td className="px-3 py-2">
                              <Controller
                                name={`mr_items.${index}.unit`}
                                control={control}
                                render={({ field: f }) => (
                                  <Autocomplete
                                    value={f.value ?? 'Pcs'}
                                    onChange={(_, val) => f.onChange(val ?? 'Pcs')}
                                    options={unitOptions}
                                    size="small"
                                    disableClearable
                                    sx={{
                                      width: 90,
                                      '& .MuiOutlinedInput-root': { fontSize: '0.75rem' },
                                    }}
                                    renderInput={(params) => <TextField {...params} size="small" />}
                                  />
                                )}
                              />
                            </td>

                            {/* Quantity — triggers extended_amount recalc */}
                            <td className="px-3 py-2">
                              <Controller
                                name={`mr_items.${index}.quantity`}
                                control={control}
                                render={({ field: f }) => (
                                  <input
                                    value={f.value}
                                    onChange={(e) => {
                                      const qty = parseFloat(e.target.value) || 0;
                                      f.onChange(qty);
                                      recalcExtended(
                                        index,
                                        qty,
                                        getValues(`mr_items.${index}.estimated_rate`)
                                      );
                                    }}
                                    type="number"
                                    min="1"
                                    className="w-16 rounded border border-input px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                )}
                              />
                            </td>

                            {/* Estimated Rate — triggers extended_amount recalc */}
                            <td className="px-3 py-2">
                              <Controller
                                name={`mr_items.${index}.estimated_rate`}
                                control={control}
                                render={({ field: f }) => (
                                  <input
                                    value={f.value}
                                    onChange={(e) => {
                                      const rate = parseFloat(e.target.value) || 0;
                                      f.onChange(rate);
                                      recalcExtended(
                                        index,
                                        getValues(`mr_items.${index}.quantity`),
                                        rate
                                      );
                                    }}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-24 rounded border border-input px-2 py-1.5 text-right text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                )}
                              />
                            </td>

                            {/* Extended Amount — auto-calculated, display only */}
                            <td className="px-3 py-2">
                              <div className="rounded bg-muted px-2 py-1.5 text-right text-sm font-semibold text-foreground">
                                ৳
                                {(
                                  parseFloat(watchedItems[index]?.extended_amount) || 0
                                ).toLocaleString()}
                              </div>
                            </td>

                            {/* Remarks */}
                            <td className="px-3 py-2">
                              <input
                                {...register(`mr_items.${index}.remarks`)}
                                type="text"
                                placeholder="Notes..."
                                className="w-full rounded border border-input px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </td>

                            {/* Remove row */}
                            <td className="px-3 py-2">
                              {fields.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="rounded p-1 transition-colors hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-start justify-between">
                    <Button size="sm" variant="outline" onClick={addItem}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Another Item
                    </Button>
                    <div className="w-72 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Items:</span>
                        <span className="font-semibold">{fields.length}</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-2">
                        <span className="text-sm font-semibold text-foreground">
                          Grand Total (Estimated):
                        </span>
                        <span className="text-lg font-bold text-primary">
                          ৳{totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* ─────── Section 3 : Specifications & Technical Details ─────────── */}
          {activeSection === 3 && (
            <Card>
              <CardHeader
                title="Specifications & Technical Details"
                description="Provide overall technical requirements applicable to this requisition"
              />
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Detailed Technical Specifications
                    </label>
                    <Controller
                      name="specifications"
                      control={control}
                      render={({ field }) => (
                        <RichTextEditor
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Enter detailed specifications for all items (brand, model, size, material, etc.)"
                          minHeight="200px"
                        />
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Preferred Brand / Make
                      </label>
                      <input
                        {...register('preferred_brand')}
                        type="text"
                        placeholder="e.g., HP, Dell, Samsung or 'No preference'"
                        className="w-full rounded-lg border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Alternative Acceptable Brands
                      </label>
                      <input
                        {...register('alternative_brands')}
                        type="text"
                        placeholder="e.g., Lenovo, Asus, Acer"
                        className="w-full rounded-lg border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Required Warranty Period
                      </label>
                      <Controller
                        name="warranty_period"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            value={field.value ?? ''}
                            onChange={(_, val) => field.onChange(val ?? '')}
                            options={WARRANTY_OPTIONS}
                            size="small"
                            sx={acSx}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Select warranty requirement"
                                size="small"
                              />
                            )}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Country of Origin Preference
                      </label>
                      <Controller
                        name="country_of_origin"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            value={field.value ?? ''}
                            onChange={(_, val) => field.onChange(val ?? '')}
                            options={COUNTRY_OPTIONS}
                            size="small"
                            sx={acSx}
                            renderInput={(params) => (
                              <TextField {...params} placeholder="No preference" size="small" />
                            )}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Quality Standards / Compliance Requirements
                    </label>
                    <textarea
                      {...register('quality_standards')}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g., ISO certified, BIS standard, BSTI approved, CE marked..."
                    />
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex gap-2">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Tip: Detailed Specifications Help
                        </p>
                        <p className="mt-1 text-xs text-blue-700">
                          Clear specifications help procurement officers prepare accurate RFQs and
                          ensure vendors provide comparable quotations.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* ─────── Section 4 : Delivery & Contact ─────────────────────────── */}
          {activeSection === 4 && (
            <Card>
              <CardHeader
                title="Delivery & Contact Information"
                description="Specify delivery requirements and contact details"
              />
              <CardBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Delivery Location *
                      </label>
                      <Controller
                        name="delivery_location"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            value={field.value}
                            onChange={(_, val) => field.onChange(val)}
                            options={options.office_locations}
                            getOptionLabel={(opt) => opt?.name ?? ''}
                            isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                            size="small"
                            loading={optionsLoading}
                            sx={acSx}
                            renderInput={(params) => (
                              <TextField {...params} placeholder="Select location" size="small" />
                            )}
                          />
                        )}
                      />
                      {selectedDeliveryLocation?.address && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {selectedDeliveryLocation.address}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Required By Date *
                      </label>
                      <input
                        {...register('delivery_date')}
                        type="date"
                        className="w-full rounded-lg border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Receiving Contact Person
                      </label>
                      <input
                        {...register('contact_person')}
                        type="text"
                        placeholder="Name of receiving person"
                        className="w-full rounded-lg border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Contact Phone
                      </label>
                      <input
                        {...register('contact_phone')}
                        type="tel"
                        placeholder="+880-1XXX-XXXXXX"
                        className="w-full rounded-lg border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Special Delivery Instructions
                    </label>
                    <textarea
                      {...register('special_instruction')}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g., Fragile items – requires careful handling. Deliver during office hours (9 AM – 5 PM)..."
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* ─────── Section 5 : Attachments ────────────────────────────────── */}
          {activeSection === 5 && (
            <Card>
              <CardHeader
                title="Supporting Documents"
                description="Upload specifications, quotation references, technical drawings, or any supporting documentation"
                action={
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                }
              />
              <CardBody>
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  <div
                    className="cursor-pointer rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="mb-1 text-sm font-medium text-foreground">
                      Click to upload or drag files here
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, DOCX, XLS, XLSX, JPG, PNG — Max 10 MB per file
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      First file → primary attachment; additional files → supplementary attachments
                    </p>
                  </div>

                  {/* Existing server-side attachments (edit mode only) */}
                  {isEditMode && existingAttachments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        Existing Attachments ({existingAttachments.length})
                      </h4>
                      {existingAttachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {att.filename || att.file?.split('/').pop() || 'Attachment'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Already uploaded
                                <span className="ml-2 rounded bg-blue-200/60 px-1.5 py-0.5 text-blue-700">
                                  server file
                                </span>
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            title="Open file"
                            onClick={() =>
                              window.open(att.file_url || att.file, '_blank', 'noopener,noreferrer')
                            }
                            className="rounded p-1.5 transition-colors hover:bg-blue-100"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </button>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground">
                        To replace a file, upload a new one below. Existing files remain unless the
                        backend replaces them.
                      </p>
                    </div>
                  )}

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        Attached Documents ({attachments.length})
                      </h4>
                      {attachments.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                {idx === 0 && (
                                  <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                                    primary
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              title="Preview file"
                              onClick={() => {
                                const url = URL.createObjectURL(file);
                                window.open(url, '_blank', 'noopener,noreferrer');
                              }}
                              className="rounded p-1.5 transition-colors hover:bg-muted"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </button>
                            <button
                              type="button"
                              title="Remove file"
                              onClick={() => removeAttachment(idx)}
                              className="rounded p-1.5 transition-colors hover:bg-red-50"
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">
                      <strong>Recommended documents:</strong> Technical specifications sheet, market
                      survey / reference quotations, relevant budget approval memo, photographs or
                      drawings (for construction/renovation), ToR for consultancy services.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* ─────── Section 6 : Review & Submit ────────────────────────────── */}
          {activeSection === 6 && (
            <>
              <Card>
                <CardHeader
                  title="Review MRF Summary"
                  description="Review all details before submission"
                />
                <CardBody>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Basic Details summary */}
                      <div className="rounded-lg bg-muted/30 p-4">
                        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Basic Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          {[
                            ['Office', watch('requesting_office')?.name || '—'],
                            ['Department', watch('department')?.name || '—'],
                            ['Project', watch('project')?.name || '—'],
                            ['Category', watch('category')?.name || '—'],
                            ['Priority', watch('priority')?.label || '—'],
                            ['Fiscal Year', watch('fiscal_year') || '—'],
                          ].map(([label, value]) => (
                            <div key={label} className="flex justify-between">
                              <span className="text-muted-foreground">{label}:</span>
                              <span className="font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Budget & Funding summary */}
                      <div className="rounded-lg bg-muted/30 p-4">
                        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Budget & Funding
                        </h4>
                        <div className="space-y-2 text-sm">
                          {[
                            ['Budget Code', watch('budget_code')?.code || '—'],
                            ['Donor Code', watch('donor_code')?.code || '—'],
                            ['Account Head', watch('account_code')?.code || '—'],
                            ['Fiscal Year', watch('fiscal_year') || '—'],
                          ].map(([label, value]) => (
                            <div key={label} className="flex justify-between">
                              <span className="text-muted-foreground">{label}:</span>
                              <span className="font-mono font-medium">{value}</span>
                            </div>
                          ))}
                          <div className="flex justify-between border-t border-border pt-1">
                            <span className="text-muted-foreground">Total Amount:</span>
                            <span className="font-bold text-primary">
                              ৳{totalAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BOQ summary */}
                    <div className="rounded-lg bg-muted/30 p-4">
                      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        BOQ Summary — {watchedItems.length} Items
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b border-border">
                            <tr>
                              {['#', 'Description', 'Qty', 'Ext. Amount'].map((h) => (
                                <th
                                  key={h}
                                  className={`pb-2 text-xs text-muted-foreground ${
                                    h === 'Ext. Amount'
                                      ? 'text-right'
                                      : h === 'Qty'
                                        ? 'text-center'
                                        : 'text-left'
                                  }`}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {watchedItems.map((item, idx) => (
                              <tr key={idx} className="border-b border-border/50">
                                <td className="py-2">{idx + 1}</td>
                                <td className="py-2">
                                  {item.description || item.item?.item_name || '—'}
                                </td>
                                <td className="py-2 text-center">
                                  {item.quantity} {item.unit}
                                </td>
                                <td className="py-2 text-right font-mono">
                                  ৳{(parseFloat(item.extended_amount) || 0).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-border">
                              <td colSpan={3} className="py-2 text-right font-semibold">
                                Grand Total:
                              </td>
                              <td className="py-2 text-right font-bold text-primary">
                                ৳{totalAmount.toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Attachments summary */}
                    <div className="rounded-lg bg-muted/30 p-4">
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Attachments ({existingAttachments.length + attachments.length})
                      </h4>
                      {existingAttachments.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {existingAttachments.map((att) => (
                            <Badge key={att.id} variant="info">
                              <FileText className="mr-1 h-3 w-3" />
                              {att.filename || att.file?.split('/').pop() || 'Attachment'}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {attachments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {attachments.map((file, idx) => (
                            <Badge key={idx} variant="default">
                              <FileText className="mr-1 h-3 w-3" />
                              {file.name}
                            </Badge>
                          ))}
                        </div>
                      ) : existingAttachments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No attachments uploaded</p>
                      ) : null}
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Approval Workflow Preview */}
              <Card>
                <CardHeader
                  title="Approval Workflow"
                  description="This MRF will follow the 3-level approval process as per authority matrix"
                  action={
                    <Badge size="sm" variant="info">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      Auto-Determined
                    </Badge>
                  }
                />
                <CardBody>
                  <div className="space-y-3">
                    {getApprovalLevels().map((level, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 rounded-lg border border-border p-4"
                      >
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full ${level.color}`}
                        >
                          <level.icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-primary">
                              STEP {level.step}
                            </span>
                            <h4 className="text-sm font-semibold text-foreground">{level.title}</h4>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {level.role} — {level.approver}
                          </p>
                          <p className="text-xs text-muted-foreground">{level.description}</p>
                        </div>
                        <Badge size="sm" variant="default">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <Send className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-900">
                          Auto-Route to Procurement Officer
                        </p>
                        <p className="text-xs text-green-700">
                          After final approval, this MRF will be automatically assigned to the
                          procurement officer for RFQ preparation.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Notification Preview */}
              <Card>
                <CardHeader
                  title="Automated Notifications"
                  description="Email + system alerts will be sent at each stage"
                />
                <CardBody>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      {
                        event: 'On Submission',
                        recipients: 'Requester, Finance Focal',
                        type: 'Email + System',
                      },
                      {
                        event: 'Budget Clearance Complete',
                        recipients: 'Requester, Endorser',
                        type: 'Email + System',
                      },
                      {
                        event: 'Endorsement Complete',
                        recipients: 'Requester, Final Approver',
                        type: 'Email + System',
                      },
                      {
                        event: 'Final Approval',
                        recipients: 'Requester, Procurement Officer',
                        type: 'Email + System',
                      },
                      {
                        event: 'Return for Revision',
                        recipients: 'Requester',
                        type: 'Email + System + SMS',
                      },
                      {
                        event: 'Rejection',
                        recipients: 'Requester, Department Head',
                        type: 'Email + System',
                      },
                    ].map((n, idx) => (
                      <div key={idx} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                        <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-foreground">{n.event}</p>
                          <p className="text-[10px] text-muted-foreground">To: {n.recipients}</p>
                        </div>
                        <Badge size="sm" variant="default">
                          {n.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </>
          )}
        </div>

        {/* ── Right Sidebar ───────────────────────────────────────────────── */}
        <div className="col-span-12 space-y-4 lg:col-span-3">
          <Card>
            <CardBody>
              <h4 className="mb-3 text-sm font-semibold text-foreground">MRF Information</h4>
              <div className="space-y-2 text-sm">
                {[
                  [
                    'MRF No',
                    isEditMode
                      ? (requisitionDefaultData?.[0]?.requisition_no ?? editId)
                      : 'Auto-Assigned',
                  ],
                  ['Version', isEditMode ? 'Edit Mode' : '1.0 (Draft)'],
                  ['Requester', currentUser?.employee_name || currentUser?.username || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h4 className="mb-3 text-sm font-semibold text-foreground">Amount Summary</h4>
              <div className="rounded-lg bg-primary/5 p-4 text-center">
                <p className="mb-1 text-xs text-muted-foreground">Estimated Total</p>
                <p className="text-2xl font-bold text-primary">৳{totalAmount.toLocaleString()}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {watchedItems.length} line items
                </p>
              </div>
              {totalAmount > 2000000 && (
                <div className="mt-3 flex gap-1.5 rounded bg-red-50 p-2 text-xs text-red-700">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Country Director approval required
                </div>
              )}
              {totalAmount > 500000 && totalAmount <= 2000000 && (
                <div className="mt-3 flex gap-1.5 rounded bg-orange-50 p-2 text-xs text-orange-700">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Head of Operations approval required
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h4 className="mb-3 text-sm font-semibold text-foreground">Sections</h4>
              <div className="space-y-1">
                {sections.map((section, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSection(idx)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                      idx === activeSection
                        ? 'bg-primary/10 font-semibold text-primary'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {idx + 1}. {section}
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h4 className="mb-2 text-sm font-semibold text-foreground">Attachments</h4>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {attachments.length} file(s) attached
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ── Error Banner ────────────────────────────────────────────────────── */}
      {submitError && (
        <div className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <pre className="whitespace-pre-wrap text-xs text-red-700">{submitError}</pre>
        </div>
      )}

      {/* ── Bottom Action Bar ────────────────────────────────────────────────── */}
      {/* sticky bottom-4 */}
      <div className=" mt-6 flex flex-col items-start justify-between gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          {activeSection > 0 && (
            <Button variant="outline" onClick={() => setActiveSection(activeSection - 1)}>
              ← Previous
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" disabled={submitting} onClick={submitForm('Draft')}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          {activeSection < sections.length - 1 ? (
            <Button variant="primary" onClick={() => setActiveSection(activeSection + 1)}>
              Next Step →
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={submitting}
              onClick={submitForm('Pending Approval')}
            >
              <Send className="mr-2 h-4 w-4" />
              {submitting
                ? isEditMode
                  ? 'Updating…'
                  : 'Submitting…'
                : isEditMode
                  ? 'Update MRF'
                  : 'Submit for Approval'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
