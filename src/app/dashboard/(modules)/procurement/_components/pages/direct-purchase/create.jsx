'use client';

import Link from 'next/link';
import { useRef, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import {
  X,
  Plus,
  Send,
  Save,
  Trash2,
  Upload,
  FileText,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import { TextField, Autocomplete } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

const UNIT_OPTIONS = ['Pcs','Set','Box','Kg','Liter','Packet','Ream','Roll','Lot','Job','Sq.ft','Running ft'];
const WARRANTY_OPTIONS = ['None','6 Months','1 Year','2 Years','3 Years','5 Years'];
const COUNTRY_OPTIONS = ['Bangladesh','Any Asian Country','Japan','USA / Europe','Any Country'];

const DEFAULT_ITEM = { item:null, description:'', specification:'', unit:'Pcs', quantity:1, estimated_rate:0, extended_amount:0, remarks:'' };

const DEFAULT_FORM = {
  department:null, project:null, category:null,
  priority:null, fiscal_year:'', purpose:'',
  dp_items:[{...DEFAULT_ITEM}],
  specifications:'', preferred_brand:'', alternative_brands:'',
  warranty_period:'', country_of_origin:'', quality_standards:'',
  shop:null, reference_number:'', budget_code:null, account_code:null,
  requesting_office:null, delivery_location:null,
  purchase_date:'', expected_delivery_date:'',
  payment_terms:'', contact_person:'', contact_phone:'',
  special_instruction:'', justification:'', remarks:'',
};

const SECTIONS = ['Basic Information','Bill of Quantities','Specifications & Details','Delivery & Contact','Review & Submit'];

export function CreateDirectPurchase() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = Boolean(editId);
  const fileInputRef = useRef(null);
  const [attachment, setAttachment] = useState(null);
  const [activeSection, setActiveSection] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [editPopulated, setEditPopulated] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('Approved');
  const [options, setOptions] = useState({
    departments:[],projects:[],budgets:[],accounts:[],
    shops:[],offices:[],priorities:[],payment_terms:[],current_user:null,
  });

  const { data: formOptionsData } = useGetRequest(`${endpoints.procurement_management.direct_purchases}form-options/`);
  const { data: fiscalYearOptionsRaw } = useGetRequest(endpoints.accounting.fiscal_years);
  const { data: editDpData } = useGetRequest(
    isEditMode ? `${endpoints.procurement_management.direct_purchases}${editId}/` : null
  );

  const fiscalYearOptions = useMemo(() => {
    const raw = fiscalYearOptionsRaw;
    const list = Array.isArray(raw) ? raw : (raw?.results ?? []);
    return list.map((fy) => fy.code || fy.name || String(fy.id)).filter(Boolean);
  }, [fiscalYearOptionsRaw]);

  const { data: inventoryRaw } = useGetRequest(`${endpoints.storeInventory.items}?pagination=false`);
  const inventoryItems = useMemo(() => {
    if (Array.isArray(inventoryRaw)) return inventoryRaw;
    return Array.isArray(inventoryRaw?.results) ? inventoryRaw.results : [];
  }, [inventoryRaw]);

  useEffect(() => {
    if (!formOptionsData || Object.keys(formOptionsData).length === 0) return;
    setOptions({
      departments: formOptionsData.departments ?? [],
      projects: formOptionsData.projects ?? [],
      budgets: formOptionsData.budgets ?? [],
      accounts: formOptionsData.accounts ?? [],
      shops: formOptionsData.shops ?? [],
      offices: formOptionsData.offices ?? [],
      priorities: formOptionsData.priorities ?? [],
      payment_terms: formOptionsData.payment_terms ?? [],
      current_user: formOptionsData.current_user ?? null,
    });
    setOptionsLoading(false);
  }, [formOptionsData]);

  const { control, register, setValue, getValues, watch, handleSubmit } = useForm({ defaultValues: DEFAULT_FORM });
  const { fields, append, remove } = useFieldArray({ control, name: 'dp_items' });

  useEffect(() => {
    if (isEditMode) return; // edit mode populates from existing DP
    if (formOptionsData?.current_user?.employee_name) setValue('contact_person', formOptionsData.current_user.employee_name);
    if (formOptionsData?.priorities?.length) {
      const medium = formOptionsData.priorities.find((p) => p.value === 'Medium') ?? formOptionsData.priorities[0];
      setValue('priority', medium);
    }
  }, [formOptionsData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Populate form when editing an existing DP
  useEffect(() => {
    if (!isEditMode || !editDpData || editPopulated || optionsLoading) return;
    const { departments, projects, budgets, accounts, shops, offices, priorities } = options;
    const dept    = departments.find((d) => d.id === editDpData.department) ?? null;
    const proj    = projects.find((p) => p.id === editDpData.project) ?? null;
    const shop    = shops.find((s) => s.id === editDpData.shop) ?? null;
    const budget  = budgets.find((b) => b.id === editDpData.budget_code) ?? null;
    const account = accounts.find((a) => a.id === editDpData.account_code) ?? null;
    const reqOff  = offices.find((o) => o.id === editDpData.requesting_office) ?? null;
    const delLoc  = offices.find((o) => o.id === editDpData.delivery_location) ?? null;
    const priority = priorities.find((p) => p.value === editDpData.priority) ?? null;
    const dpItems = (editDpData.dp_items ?? []).map((item) => ({
      item: item.item ? (inventoryItems.find((inv) => inv.id === item.item) ?? null) : null,
      description: item.description ?? '',
      specification: item.specification ?? '',
      unit: item.unit ?? 'Pcs',
      quantity: item.quantity ?? 1,
      estimated_rate: item.unit_price ?? 0,
      extended_amount: item.extended_amount ?? 0,
      remarks: item.remarks ?? '',
    }));
    setValue('department', dept);
    setValue('project', proj);
    setValue('shop', shop ?? (editDpData.shop_name || null));
    setValue('budget_code', budget);
    setValue('account_code', account);
    setValue('requesting_office', reqOff);
    setValue('delivery_location', delLoc);
    setValue('priority', priority);
    ['fiscal_year','purpose','reference_number','specifications','preferred_brand',
     'alternative_brands','warranty_period','country_of_origin','quality_standards',
     'purchase_date','expected_delivery_date','payment_terms','contact_person',
     'contact_phone','special_instruction','justification','remarks'].forEach((f) => {
       setValue(f, editDpData[f] ?? '');
     });
    if (dpItems.length > 0) setValue('dp_items', dpItems);
    setSelectedStatus(editDpData.status ?? 'Approved');
    setEditPopulated(true);
  }, [editDpData, optionsLoading, options, inventoryItems, isEditMode, editPopulated, setValue]);

  const watchedItems = watch('dp_items') ?? [];
  const totalAmount = watchedItems.reduce((sum, item) => sum + (parseFloat(item.extended_amount) || 0), 0);
  const values = watch();

  const recalcExtended = (index, qty, price) => {
    setValue(`dp_items.${index}.extended_amount`, (parseFloat(qty)||0) * (parseFloat(price)||0));
  };

  const acSx = { '& .MuiOutlinedInput-root': { borderRadius: '0.5rem', fontSize: '0.875rem' } };

  const fmtAmount = (val) => {
    const n = parseFloat(val);
    if (Number.isNaN(n)) return '৳ 0.00';
    return `৳\u202f${n.toLocaleString('en-BD',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  };

  const submitForm = (submitStatus) => handleSubmit(async (vals) => {
    setSubmitting(true); setSubmitError(null);
    try {
      const fd = new FormData();
      fd.append('status', submitStatus);
      if (vals.department?.id) fd.append('department', vals.department.id);
      if (vals.project?.id) fd.append('project', vals.project.id);
      if (vals.category?.id) fd.append('category', vals.category.id);
      // shop: existing object → send id; free-text string → send shop_name_create
      if (vals.shop?.id) {
        fd.append('shop', vals.shop.id);
      } else if (typeof vals.shop === 'string' && vals.shop.trim()) {
        fd.append('shop_name_create', vals.shop.trim());
      }
      if (vals.budget_code?.id) fd.append('budget_code', vals.budget_code.id);
      if (vals.account_code?.id) fd.append('account_code', vals.account_code.id);
      if (vals.requesting_office?.id) fd.append('requesting_office', vals.requesting_office.id);
      if (vals.delivery_location?.id) fd.append('delivery_location', vals.delivery_location.id);
      if (vals.priority?.value) fd.append('priority', vals.priority.value);
      if (vals.payment_terms) fd.append('payment_terms', vals.payment_terms);
      ['fiscal_year','purpose','reference_number','specifications','preferred_brand',
       'alternative_brands','warranty_period','country_of_origin','quality_standards',
       'purchase_date','expected_delivery_date','contact_person','contact_phone',
       'special_instruction','justification','remarks'].forEach((f) => { if (vals[f]) fd.append(f, vals[f]); });
      const dpItems = (vals.dp_items ?? []).filter((i) => i.description || i.item?.id).map((i) => ({
        ...(i.item?.id ? { item: i.item.id } : {}),
        description: i.description || i.item?.name || '',
        specification: i.specification || '',
        unit: i.unit || 'Pcs',
        quantity: parseFloat(i.quantity) || 1,
        unit_price: parseFloat(i.estimated_rate) || 0,
        remarks: i.remarks || '',
      }));
      fd.append('dp_items_data', JSON.stringify(dpItems));
      if (attachment) fd.append('attachment', attachment);
      if (isEditMode) {
        await axiosInstance.patch(`${endpoints.procurement_management.direct_purchases}${editId}/`, fd);
      } else {
        await axiosInstance.post(endpoints.procurement_management.direct_purchases, fd);
      }
      router.push(paths.dashboard.procurement.directPurchase.list);
    } catch (err) {
      const errData = err?.response?.data;
      setSubmitError(typeof errData==='object' ? JSON.stringify(errData,null,2) : String(errData ?? err.message ?? 'Network error'));
      setSubmitting(false);
    }
  });

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Link href={paths.dashboard.procurement.directPurchase.list}>
            <button className="rounded-lg p-2 transition-colors hover:bg-muted"><ArrowLeft className="h-5 w-5 text-muted-foreground" /></button>
          </Link>
          <div>
            <h1 className="mb-1 text-2xl font-semibold text-foreground">
              {isEditMode ? 'Edit Direct Purchase' : 'Create Direct Purchase (DP)'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isEditMode
                ? `Editing DP · changes will be saved via PATCH`
                : 'Submit a new Direct Purchase with BOQ, shop, and delivery details'}
            </p>
          </div>
        </div>
        <Badge size="lg" variant={isEditMode ? 'warning' : 'default'}>
          {isEditMode ? (editDpData?.dp_number ?? `DP-${editId}`) : 'DP-AUTO'}
        </Badge>
      </div>

      {/* Progress Steps */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            {SECTIONS.map((section, idx) => (
              <button key={idx} onClick={() => setActiveSection(idx)} className="group flex flex-col items-center gap-1.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  idx < activeSection ? 'bg-success text-white'
                    : idx === activeSection ? 'bg-primary text-white ring-4 ring-primary/20'
                    : 'bg-muted text-muted-foreground'}`}>
                  {idx < activeSection ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                </div>
                <span className={`max-w-24 text-center text-[10px] font-medium leading-tight ${idx===activeSection?'text-primary':'text-muted-foreground'}`}>{section}</span>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="col-span-12 space-y-6 lg:col-span-9">

          {/* Section 0 – Basic Information */}
          {activeSection === 0 && (
            <Card>
              <CardHeader title="Basic Information" description="Department, project, priority and purpose" action={<Badge size="sm" variant="danger">Required</Badge>} />
              <CardBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Department</label>
                      <Controller name="department" control={control} render={({ field }) => (
                        <Autocomplete value={field.value} onChange={(_,val)=>field.onChange(val)} options={options.departments}
                          getOptionLabel={(opt)=>opt?.name??''} isOptionEqualToValue={(opt,val)=>opt?.id===val?.id}
                          size="small" loading={optionsLoading} sx={acSx}
                          renderInput={(params)=><TextField {...params} placeholder="Select department" size="small"/>} />
                      )} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Project / Programme</label>
                      <Controller name="project" control={control} render={({ field }) => (
                        <Autocomplete value={field.value} onChange={(_,val)=>field.onChange(val)} options={options.projects}
                          getOptionLabel={(opt)=>opt?`${opt.name}${opt.code?` (${opt.code})`:''}`:''}
                          isOptionEqualToValue={(opt,val)=>opt?.id===val?.id} size="small" loading={optionsLoading} sx={acSx}
                          renderInput={(params)=><TextField {...params} placeholder="Select project" size="small"/>} />
                      )} />
                    </div>

                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Priority</label>
                      <Controller name="priority" control={control} render={({ field }) => (
                        <Autocomplete value={field.value} onChange={(_,val)=>field.onChange(val)} options={options.priorities}
                          getOptionLabel={(opt)=>opt?.label??''} isOptionEqualToValue={(opt,val)=>opt?.value===val?.value}
                          size="small" sx={acSx}
                          renderInput={(params)=><TextField {...params} placeholder="Select priority" size="small"/>} />
                      )} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Fiscal Year</label>
                      <select {...register('fiscal_year')} className="w-full rounded-lg border border-input px-3 py-[9px] text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">— Select fiscal year —</option>
                        {fiscalYearOptions.map((fy)=><option key={fy} value={fy}>{fy}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Budget Code</label>
                      <Controller name="budget_code" control={control} render={({ field }) => (
                        <Autocomplete value={field.value} onChange={(_,val)=>field.onChange(val)} options={options.budgets}
                          getOptionLabel={(opt)=>opt?`${opt.code} — ${opt.name}`:''}
                          isOptionEqualToValue={(opt,val)=>opt?.id===val?.id} size="small" loading={optionsLoading} sx={acSx}
                          renderInput={(params)=><TextField {...params} placeholder="Select budget code" size="small"/>} />
                      )} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Purpose / Justification Summary *</label>
                    <textarea {...register('purpose')} rows={3} placeholder="Brief purpose of this direct purchase…"
                      className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Section 1 – BOQ */}
          {activeSection === 1 && (
            <Card>
              <CardHeader
                title="Bill of Quantities (BOQ)"
                description="Add items with specifications, quantities, and estimated costs"
                action={
                  <Button size="sm" variant="outline" onClick={() => append({...DEFAULT_ITEM})}>
                    <Plus className="h-4 w-4 mr-2" />Add Line Item
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
                            { label: 'Item Id', cls: 'w-40 text-left' },
                            { label: 'Item Name', cls: 'w-44 text-left' },
                            { label: 'Specifications', cls: 'w-44 text-left' },
                            { label: 'Unit', cls: 'w-24 text-center' },
                            { label: 'Qty', cls: 'w-16 text-center' },
                            { label: 'Est. Rate (৳)', cls: 'w-28 text-right' },
                            { label: 'Ext. Amount (৳)', cls: 'w-28 text-right' },
                            { label: 'Remarks', cls: 'w-28 text-left' },
                            { label: '', cls: 'w-8' },
                          ].map((col) => (
                            <th key={col.label} className={`px-3 py-2 text-xs font-semibold text-foreground ${col.cls}`}>
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((field, index) => (
                          <tr key={field.id} className="border-b border-border">
                            <td className="px-3 py-2 text-sm font-mono">{index + 1}</td>
                            <td className="px-3 py-2">
                              <Controller
                                name={`dp_items.${index}.item`}
                                control={control}
                                render={({ field: f }) => (
                                  <Autocomplete
                                    value={f.value}
                                    onChange={(_, val) => {
                                      f.onChange(val);
                                      if (val) {
                                        setValue(`dp_items.${index}.description`, val.item_name ?? val.name ?? '');
                                        setValue(`dp_items.${index}.specification`, val.subcategory_name ?? val.specifications ?? '');
                                        setValue(`dp_items.${index}.unit`, val.uom_name ?? val.unit ?? 'Pcs');
                                        const rate = parseFloat(val.unit_price ?? val.cost ?? 0) || 0;
                                        setValue(`dp_items.${index}.estimated_rate`, rate);
                                        const qty = parseFloat(getValues(`dp_items.${index}.quantity`)) || 1;
                                        setValue(`dp_items.${index}.extended_amount`, qty * rate);
                                      }
                                    }}
                                    options={inventoryItems}
                                    getOptionLabel={(opt) => opt ? `${opt.item_code ? `[${opt.item_code}] ` : ''}${opt.item_name ?? opt.name ?? ''}` : ''}
                                    isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                                    size="small"
                                    sx={{ width: 160, '& .MuiOutlinedInput-root': { fontSize: '0.75rem' } }}
                                    renderInput={(params) => (
                                      <TextField {...params} placeholder="Manual entry" size="small" />
                                    )}
                                  />
                                )}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input {...register(`dp_items.${index}.description`)} type="text" placeholder="Item name..."
                                className="w-full rounded border border-input px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                            </td>
                            <td className="px-3 py-2">
                              <input {...register(`dp_items.${index}.specification`)} type="text" placeholder="Brand, model, size..."
                                className="w-full rounded border border-input px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                            </td>
                            <td className="px-3 py-2">
                              <Controller
                                name={`dp_items.${index}.unit`}
                                control={control}
                                render={({ field: f }) => (
                                  <Autocomplete
                                    value={f.value ?? 'Pcs'}
                                    onChange={(_, val) => f.onChange(val ?? 'Pcs')}
                                    options={UNIT_OPTIONS}
                                    size="small"
                                    disableClearable
                                    sx={{ width: 90, '& .MuiOutlinedInput-root': { fontSize: '0.75rem' } }}
                                    renderInput={(params) => <TextField {...params} size="small" />}
                                  />
                                )}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Controller
                                name={`dp_items.${index}.quantity`}
                                control={control}
                                render={({ field: f }) => (
                                  <input
                                    value={f.value}
                                    onChange={(e) => {
                                      const qty = parseFloat(e.target.value) || 0;
                                      f.onChange(qty);
                                      recalcExtended(index, qty, getValues(`dp_items.${index}.estimated_rate`));
                                    }}
                                    type="number" min="1"
                                    className="w-16 rounded border border-input px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                )}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Controller
                                name={`dp_items.${index}.estimated_rate`}
                                control={control}
                                render={({ field: f }) => (
                                  <input
                                    value={f.value}
                                    onChange={(e) => {
                                      const rate = parseFloat(e.target.value) || 0;
                                      f.onChange(rate);
                                      recalcExtended(index, getValues(`dp_items.${index}.quantity`), rate);
                                    }}
                                    type="number" min="0" step="0.01"
                                    className="w-24 rounded border border-input px-2 py-1.5 text-right text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                )}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="rounded bg-muted px-2 py-1.5 text-right text-sm font-semibold text-foreground">
                                ৳{(parseFloat(watchedItems[index]?.extended_amount) || 0).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <input {...register(`dp_items.${index}.remarks`)} type="text" placeholder="Notes..."
                                className="w-full rounded border border-input px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                            </td>
                            <td className="px-3 py-2">
                              {fields.length > 1 && (
                                <button type="button" onClick={() => remove(index)} className="rounded p-1 transition-colors hover:bg-red-50">
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
                    <Button size="sm" variant="outline" onClick={() => append({...DEFAULT_ITEM})}>
                      <Plus className="h-4 w-4 mr-2" />Add Another Item
                    </Button>
                    <div className="w-72 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Items:</span>
                        <span className="font-semibold">{fields.length}</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-2">
                        <span className="text-sm font-semibold text-foreground">Grand Total (Estimated):</span>
                        <span className="text-lg font-bold text-primary">{fmtAmount(totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Section 2 – Specifications */}
          {activeSection === 2 && (
            <Card>
              <CardHeader title="Specifications & Details" description="Technical specs, brand preferences, warranty and standards" />
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Technical Specifications</label>
                    <textarea {...register('specifications')} rows={4} placeholder="Detailed technical specifications…"
                      className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Preferred Brand</label>
                      <input {...register('preferred_brand')} placeholder="e.g. Sony, HP, Local"
                        className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Alternative Brands</label>
                      <input {...register('alternative_brands')} placeholder="Other acceptable brands"
                        className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Warranty Period</label>
                      <select {...register('warranty_period')} className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">— Select —</option>
                        {WARRANTY_OPTIONS.map((w)=><option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Country of Origin</label>
                      <select {...register('country_of_origin')} className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">— Select —</option>
                        {COUNTRY_OPTIONS.map((c)=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Quality Standards</label>
                    <textarea {...register('quality_standards')} rows={2} placeholder="ISO, BDS, or other applicable standards…"
                      className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Section 3 – Delivery & Contact */}
          {activeSection === 3 && (
            <Card>
              <CardHeader title="Delivery & Contact" description="Shop / Seller, delivery location, dates, payment terms and contact details" />
              <CardBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Shop / Seller</label>
                      <Controller name="shop" control={control} render={({ field }) => (
                        <Autocomplete
                          value={field.value}
                          onChange={(_, val) => field.onChange(val)}
                          onInputChange={(_, inputVal, reason) => {
                            if (reason === 'input') field.onChange(inputVal);
                          }}
                          options={options.shops}
                          getOptionLabel={(opt) => typeof opt === 'string' ? opt : (opt?.name ?? '')}
                          isOptionEqualToValue={(opt, val) =>
                            typeof val === 'string' ? opt?.name === val : opt?.id === val?.id
                          }
                          freeSolo
                          size="small"
                          loading={optionsLoading}
                          sx={acSx}
                          renderInput={(params) => (
                            <TextField {...params} placeholder="Type or select shop name" size="small"
                              helperText="Select existing or type a new name to create"
                              FormHelperTextProps={{ sx: { fontSize: '0.7rem', mt: 0.3 } }}
                            />
                          )}
                        />
                      )} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Reference / Quotation No.</label>
                      <input {...register('reference_number')} placeholder="e.g. QT-2026-001"
                        className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Requesting Office</label>
                      <Controller name="requesting_office" control={control} render={({ field }) => (
                        <Autocomplete value={field.value} onChange={(_,val)=>field.onChange(val)} options={options.offices}
                          getOptionLabel={(opt)=>opt?.name??''} isOptionEqualToValue={(opt,val)=>opt?.id===val?.id}
                          size="small" loading={optionsLoading} sx={acSx}
                          renderInput={(params)=><TextField {...params} placeholder="Select office" size="small"/>} />
                      )} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Delivery Location</label>
                      <Controller name="delivery_location" control={control} render={({ field }) => (
                        <Autocomplete value={field.value} onChange={(_,val)=>field.onChange(val)} options={options.offices}
                          getOptionLabel={(opt)=>opt?.name??''} isOptionEqualToValue={(opt,val)=>opt?.id===val?.id}
                          size="small" loading={optionsLoading} sx={acSx}
                          renderInput={(params)=><TextField {...params} placeholder="Select location" size="small"/>} />
                      )} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Purchase Date</label>
                      <input type="date" {...register('purchase_date')} className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Expected Delivery Date</label>
                      <input type="date" {...register('expected_delivery_date')} className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Payment Terms</label>
                      <select {...register('payment_terms')} className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">— Select —</option>
                        {options.payment_terms.map((pt)=><option key={pt.value} value={pt.value}>{pt.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Contact Person</label>
                      <input {...register('contact_person')} placeholder="Name of contact"
                        className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Contact Phone</label>
                      <input {...register('contact_phone')} placeholder="+880 1X-XXXX-XXXX"
                        className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Special Instructions</label>
                    <textarea {...register('special_instruction')} rows={2} placeholder="Packing, labelling, handling…"
                      className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Justification for Direct Purchase</label>
                    <textarea {...register('justification')} rows={3} placeholder="Why is this a direct purchase (sole source, urgency, etc.)…"
                      className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Attachment (Quotation / Invoice)</label>
                    <input type="file" ref={fileInputRef} onChange={(e)=>setAttachment(e.target.files?.[0]??null)} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />
                    {attachment ? (
                      <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2">
                        <FileText className="h-4 w-4 text-success" />
                        <span className="flex-1 text-sm text-foreground truncate">{attachment.name}</span>
                        <button type="button" onClick={()=>setAttachment(null)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <button type="button" onClick={()=>fileInputRef.current?.click()}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                        <Upload className="h-4 w-4" /> Click to upload file (max 10 MB)
                      </button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Section 4 – Review & Submit */}
          {activeSection === 4 && (
            <Card>
              <CardHeader title="Review & Submit" description="Confirm all details before submission" action={<Badge size="sm" variant="success">Final Step</Badge>} />
              <CardBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border p-4 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</p>
                      <dl className="space-y-1 text-sm">
                        <div className="flex justify-between"><dt className="text-muted-foreground">Department</dt><dd className="font-medium">{values.department?.name||'—'}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Project</dt><dd className="font-medium">{values.project?.name||'—'}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Priority</dt><dd className="font-medium">{values.priority?.label||'—'}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Fiscal Year</dt><dd className="font-medium">{values.fiscal_year||'—'}</dd></div>
                      </dl>
                    </div>
                    <div className="rounded-lg border border-border p-4 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Delivery & Contact</p>
                      <dl className="space-y-1 text-sm">
                        <div className="flex justify-between"><dt className="text-muted-foreground">Shop / Seller</dt><dd className="font-medium">{typeof values.shop === 'string' ? values.shop : values.shop?.name || '—'}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Payment Terms</dt><dd className="font-medium">{values.payment_terms||'—'}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Purchase Date</dt><dd className="font-medium">{values.purchase_date||'—'}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Delivery By</dt><dd className="font-medium">{values.expected_delivery_date||'—'}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Contact</dt><dd className="font-medium">{values.contact_person||'—'}</dd></div>
                      </dl>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2.5 flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">BOQ ({watchedItems.filter((i)=>i.description||i.item?.id).length} items)</p>
                      <p className="text-sm font-bold text-primary">{fmtAmount(totalAmount)}</p>
                    </div>
                    <div className="divide-y divide-border">
                      {watchedItems.filter((i)=>i.description||i.item?.id).map((item,idx)=>(
                        <div key={idx} className="flex items-center justify-between px-4 py-2 text-sm">
                          <span className="flex-1 text-foreground">{item.description || item.item?.item_name || item.item?.name || '—'}</span>
                          <span className="text-muted-foreground mx-4">{item.quantity} × {fmtAmount(item.estimated_rate)}</span>
                          <span className="font-medium">{fmtAmount(item.extended_amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {submitError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <pre className="text-xs text-destructive whitespace-pre-wrap">{submitError}</pre>
                    </div>
                  )}

                  {/* Status selector — edit mode only */}
                  {isEditMode && (
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Change Status</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'Draft',    label: 'Draft',    cls: 'border-gray-300 text-gray-700 bg-gray-50'    },
                          { value: 'Approved', label: 'Approved', cls: 'border-green-300 text-green-700 bg-green-50' },
                          { value: 'Rejected', label: 'Rejected', cls: 'border-red-300 text-red-700 bg-red-50'       },
                        ].map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setSelectedStatus(s.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                              selectedStatus === s.value
                                ? `${s.cls} ring-2 ring-offset-1 ring-current`
                                : 'border-input text-muted-foreground bg-background hover:bg-muted'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                      {selectedStatus !== (editDpData?.status) && (
                        <p className="text-xs text-amber-600 mt-2">
                          Status will change: <span className="font-semibold">{editDpData?.status}</span> → <span className="font-semibold">{selectedStatus}</span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    {!isEditMode && (
                      <Button type="button" variant="outline" onClick={submitForm('Draft')} disabled={submitting}>
                        <Save className="h-4 w-4 mr-2" />Save as Draft
                      </Button>
                    )}
                    <Button type="button" variant="primary" onClick={submitForm(isEditMode ? selectedStatus : 'Approved')} disabled={submitting}>
                      <Send className="h-4 w-4 mr-2" />{submitting ? 'Saving…' : isEditMode ? 'Save Changes' : 'Submit DP'}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-12 space-y-4 lg:col-span-3">
          <Card>
            <CardHeader title="Sections" />
            <CardBody className="p-2">
              {SECTIONS.map((s,idx)=>(
                <button key={idx} onClick={()=>setActiveSection(idx)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    idx===activeSection?'bg-primary/10 text-primary font-medium':'text-muted-foreground hover:bg-muted'}`}>
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    idx<activeSection?'bg-success text-white':idx===activeSection?'bg-primary text-white':'bg-muted-foreground/20 text-muted-foreground'}`}>
                    {idx<activeSection?'✓':idx+1}
                  </div>
                  {s}
                </button>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="BOQ Summary" />
            <CardBody>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Items</span>
                  <span className="font-medium text-foreground">{watchedItems.filter((i)=>i.description||i.item?.id).length}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Grand Total</span>
                  <span className="font-bold text-primary">{fmtAmount(totalAmount)}</span>
                </div>
                {values.shop && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">Shop / Seller</p>
                    <p className="font-medium">{typeof values.shop === 'string' ? values.shop : values.shop?.name}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
          <div className="flex flex-col gap-2">
            {activeSection > 0 && (
              <Button variant="outline" size="sm" onClick={()=>setActiveSection((v)=>v-1)}>← Previous</Button>
            )}
            {activeSection < SECTIONS.length - 1 && (
              <Button variant="primary" size="sm" onClick={()=>setActiveSection((v)=>v+1)}>Next →</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
