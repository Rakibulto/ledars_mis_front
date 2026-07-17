'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  X,
  Save,
  Send,
  Upload,
  Shield,
  FileText,
  ArrowLeft,
  CreditCard,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { Badge } from '../../components/ui/badge';
import { useVendorDetail } from './use-vendor-api';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
import { useGetRequest } from '../../../../../../../actions/ledars-hook';

const STEP_FIELDS = {
  1: [
    'name',
    'legal_name',
    'year_established',
    'organization_type',
    'annual_turnover',
    'address',
    'district',
    'division',
  ],
  2: ['contact_person', 'designation', 'email', 'phone'],
  4: [
    'bank_name',
    'branch_name',
    'account_name',
    'account_number',
    'routing_number',
    'account_type',
  ],
};

export function CreateVendor() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = Boolean(editId);

  const { data: editedDefaultData } = useVendorDetail(editId);

  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      company_name_bn: '',
      legal_name: '',
      year_established: '',
      organization_type: '',
      annual_turnover: '',
      address: '',
      district: '',
      division: '',
      country: 'Bangladesh',
      contact_person: '',
      designation: '',
      email: '',
      phone: '',
      office_phone: '',
      website: '',
      nid_passport: '',
      bank_name: '',
      branch_name: '',
      account_name: '',
      account_number: '',
      routing_number: '',
      account_type: '',
      swift_code: '',
    },
  });

  // Prefill form when editing an existing vendor
  useEffect(() => {
    if (isEditMode && editedDefaultData) {
      reset({
        name: editedDefaultData.name || '',
        company_name_bn: editedDefaultData.company_name_bn || '',
        legal_name: editedDefaultData.legal_name || '',
        year_established: editedDefaultData.year_established || '',
        organization_type: editedDefaultData.organization_type || '',
        annual_turnover: editedDefaultData.annual_turnover || '',
        address: editedDefaultData.address || '',
        district: editedDefaultData.district || '',
        division: editedDefaultData.division || '',
        country: editedDefaultData.country || 'Bangladesh',
        contact_person: editedDefaultData.contact_person || '',
        designation: editedDefaultData.designation || '',
        email: editedDefaultData.email || '',
        phone: editedDefaultData.phone || '',
        office_phone: editedDefaultData.office_phone || '',
        website: editedDefaultData.website || '',
        nid_passport: editedDefaultData.nid_passport || '',
        bank_name: editedDefaultData.bank_name || '',
        branch_name: editedDefaultData.branch_name || '',
        account_name: editedDefaultData.account_name || '',
        account_number: editedDefaultData.account_number || '',
        routing_number: editedDefaultData.routing_number || '',
        account_type: editedDefaultData.account_type || '',
        swift_code: editedDefaultData.swift_code || '',
      });
      if (Array.isArray(editedDefaultData.categories)) {
        setSelectedCategories(editedDefaultData.categories.map((c) => c.name));
      }
    }
  }, [isEditMode, editedDefaultData, reset]);

  const watchedValues = watch();

  const { data: catApiData } = useGetRequest(endpoints.procurement_management.item_category);
  const categoryObjects = useMemo(() => {
    const results = Array.isArray(catApiData?.results)
      ? catApiData.results
      : Array.isArray(catApiData)
        ? catApiData
        : [];
    return results.map((c) => ({ id: c.id, name: c.name || '' }));
  }, [catApiData]);
  const allCategories = categoryObjects.map((c) => c.name);
  const categoryIdMap = useMemo(
    () => Object.fromEntries(categoryObjects.map((c) => [c.name, c.id])),
    [categoryObjects]
  );

  // Map of existing documents by doc_type (edit mode only)
  const existingDocsByType = useMemo(() => {
    if (!isEditMode || !Array.isArray(editedDefaultData?.documents)) return {};
    return Object.fromEntries(editedDefaultData.documents.map((d) => [d.doc_type, d]));
  }, [isEditMode, editedDefaultData]);

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleFileChange = (docId, file) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [docId]: { file, expiry: prev[docId]?.expiry || '' },
    }));
  };
  const handleExpiryChange = (docId, expiry) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [docId]: { file: prev[docId]?.file || null, expiry },
    }));
  };
  const removeFile = (docId) => {
    setUploadedFiles((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
  };

  const handleNext = async () => {
    const fields = STEP_FIELDS[step];
    if (fields) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    setStep((s) => Math.min(6, s + 1));
  };

  const onSubmit = async (formValues) => {
    if (!confirmed) {
      toast.error('Please confirm the declaration before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const categoryIds = selectedCategories.map((name) => categoryIdMap[name]).filter(Boolean);

      const payload = {
        ...formValues,
        year_established: formValues.year_established ? Number(formValues.year_established) : null,
        categories: categoryIds,
      };

      let vendorId;

      if (isEditMode) {
        // PATCH — update existing vendor
        await axiosInstance.patch(
          endpoints.procurement_management.vendors_management_by_id(editId),
          payload
        );
        vendorId = editId;
      } else {
        // POST — create new vendor
        payload.status = 'Pending';
        const res = await axiosInstance.post(
          endpoints.procurement_management.vendors_management,
          payload
        );
        vendorId = res.data?.id;
      }

      // Upload any new documents
      const docEntries = Object.entries(uploadedFiles).filter(([, v]) => v.file);
      for (const [docId, { file, expiry }] of docEntries) {
        const fd = new FormData();
        fd.append('vendor', vendorId);
        fd.append('doc_type', docId);
        fd.append('file', file);
        if (expiry) fd.append('expiry_date', expiry);
        await axiosInstance.post(endpoints.procurement_management.vendor_documents, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (isEditMode) {
        await mutate(endpoints.procurement_management.vendors_management_by_id(editId));
        toast.success('Vendor updated successfully.');
      } else {
        toast.success('Vendor registered successfully and submitted for approval.');
      }
      router.push(paths.dashboard.procurement.vendors.list);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.name?.[0] ||
        err?.response?.data?.email?.[0] ||
        (isEditMode
          ? 'Failed to update vendor. Please try again.'
          : 'Failed to register vendor. Please try again.');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const uploadedCount = Object.keys(uploadedFiles).filter((k) => uploadedFiles[k]?.file).length;

  const steps = [
    { num: 1, label: 'Company Information' },
    { num: 2, label: 'Contact Details' },
    { num: 3, label: 'Compliance Documents' },
    { num: 4, label: 'Bank Information' },
    { num: 5, label: 'Assign Categories' },
    { num: 6, label: 'Review & Submit' },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href={paths.dashboard.procurement.vendors.list}>
            <button type="button" className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-1">
              {isEditMode
                ? `Edit Vendor: ${editedDefaultData?.code || editedDefaultData?.name || '...'}`
                : 'Online Vendor Registration'}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode
                ? 'Update vendor information, documents, and assigned categories.'
                : 'Enlist a new vendor in Ledars NGO procurement system. Annual enlistment 2025\u20132026.'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9">
            {/* Step 1 */}
            {step === 1 && (
              <Card>
                <CardHeader
                  title="Step 1: Company Information"
                  description="Legal business details of the vendor"
                />
                <CardBody>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">
                          Company Name (English) <span className="text-red-500">*</span>
                        </p>
                        <input
                          {...register('name', { required: 'Company name is required' })}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="e.g. TechBD Solutions Ltd"
                        />
                        {errors.name && (
                          <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">
                          Company Name (Bangla)
                        </p>
                        <input
                          {...register('company_name_bn')}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="e.g. টেকবিডি সলিউশনস লিমিটেড"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">
                          Legal Business Name <span className="text-red-500">*</span>
                        </p>
                        <input
                          {...register('legal_name', { required: 'Legal name is required' })}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="As per trade license"
                        />
                        {errors.legal_name && (
                          <p className="text-xs text-red-500 mt-1">{errors.legal_name.message}</p>
                        )}
                      </div>
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">
                          Year Established <span className="text-red-500">*</span>
                        </p>
                        <input
                          type="number"
                          {...register('year_established', {
                            required: 'Year is required',
                            min: { value: 1900, message: 'Invalid year' },
                            max: { value: new Date().getFullYear(), message: 'Invalid year' },
                          })}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="e.g. 2015"
                        />
                        {errors.year_established && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.year_established.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">
                          Type of Organization <span className="text-red-500">*</span>
                        </p>
                        <select
                          {...register('organization_type', {
                            required: 'Organization type is required',
                          })}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select type...</option>
                          <option value="sole_proprietorship">Sole Proprietorship</option>
                          <option value="partnership">Partnership</option>
                          <option value="limited_company">Limited Company</option>
                          <option value="Cooperative Society">Cooperative Society</option>
                          <option value="Private_Company">Private Company</option>
                          <option value="NGO">NGO</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors.organization_type && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.organization_type.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">
                          Annual Turnover (BDT) <span className="text-red-500">*</span>
                        </p>
                        <select
                          {...register('annual_turnover', {
                            required: 'Annual turnover is required',
                          })}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select range...</option>
                          <option>Below BDT 10 Lakh</option>
                          <option>BDT 10 Lakh - 50 Lakh</option>
                          <option>BDT 50 Lakh - 1 Crore</option>
                          <option>BDT 1 Crore - 5 Crore</option>
                          <option>BDT 5 Crore - 10 Crore</option>
                          <option>Above BDT 10 Crore</option>
                        </select>
                        {errors.annual_turnover && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.annual_turnover.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="block text-sm font-medium text-foreground mb-1">
                        Registered Address <span className="text-red-500">*</span>
                      </p>
                      <textarea
                        rows={2}
                        {...register('address', { required: 'Address is required' })}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        placeholder="Full registered business address..."
                      />
                      {errors.address && (
                        <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">
                          District <span className="text-red-500">*</span>
                        </p>
                        <select
                          {...register('district', { required: 'District is required' })}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select district...</option>
                          <option>Dhaka</option>
                          <option>Chittagong</option>
                          <option>Rajshahi</option>
                          <option>Khulna</option>
                          <option>Sylhet</option>
                          <option>Rangpur</option>
                          <option>Barishal</option>
                          <option>Mymensingh</option>
                          <option>Cox&apos;s Bazar</option>
                          <option>Gazipur</option>
                          <option>Narayanganj</option>
                          <option>Comilla</option>
                        </select>
                        {errors.district && (
                          <p className="text-xs text-red-500 mt-1">{errors.district.message}</p>
                        )}
                      </div>
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">
                          Division <span className="text-red-500">*</span>
                        </p>
                        <select
                          {...register('division', { required: 'Division is required' })}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select division...</option>
                          <option>Dhaka</option>
                          <option>Chittagong</option>
                          <option>Rajshahi</option>
                          <option>Khulna</option>
                          <option>Sylhet</option>
                          <option>Rangpur</option>
                          <option>Barishal</option>
                          <option>Mymensingh</option>
                        </select>
                        {errors.division && (
                          <p className="text-xs text-red-500 mt-1">{errors.division.message}</p>
                        )}
                      </div>
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">Country</p>
                        <input
                          {...register('country')}
                          readOnly
                          className="w-full px-3 py-2 border border-input rounded-lg bg-muted/50 text-muted-foreground"
                        />
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <Card>
                <CardHeader
                  title="Step 2: Contact Details"
                  description="Primary contact person and communication details"
                />
                <CardBody>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">
                          Contact Person Name <span className="text-red-500">*</span>
                        </p>
                        <input
                          {...register('contact_person', {
                            required: 'Contact person is required',
                          })}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Full name"
                        />
                        {errors.contact_person && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.contact_person.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">
                          Designation <span className="text-red-500">*</span>
                        </p>
                        <input
                          {...register('designation', { required: 'Designation is required' })}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="e.g. Managing Director / Proprietor"
                        />
                        {errors.designation && (
                          <p className="text-xs text-red-500 mt-1">{errors.designation.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">
                          Email Address <span className="text-red-500">*</span>
                        </p>
                        <input
                          type="email"
                          {...register('email', {
                            required: 'Email is required',
                            pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: 'Invalid email address',
                            },
                          })}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="company@domain.com.bd"
                        />
                        {errors.email && (
                          <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                        )}
                      </div>
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">
                          Mobile Number <span className="text-red-500">*</span>
                        </p>
                        <input
                          {...register('phone', { required: 'Phone is required' })}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="+880-1XXX-XXXXXX"
                        />
                        {errors.phone && (
                          <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">
                          Office Phone
                        </p>
                        <input
                          {...register('office_phone')}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="+880-2-XXXXXXX"
                        />
                      </div>
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">Website</p>
                        <input
                          {...register('website')}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="https://www.company.com.bd"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="block text-sm font-medium text-foreground mb-1">
                        NID / Passport Number of Contact Person
                      </p>
                      <input
                        {...register('nid_passport')}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="National ID or Passport number"
                      />
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <strong>Note:</strong> The contact email will be used for vendor portal
                        login credentials. The vendor will receive a portal invitation with 2FA
                        setup instructions after approval.
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <Card>
                <CardHeader
                  title="Step 3: Upload Compliance Documents"
                  description="All documents are mandatory for vendor enlistment"
                />
                <CardBody>
                  <div className="space-y-4">
                    {[
                      {
                        id: 'trade-license',
                        label: 'Trade License',
                        desc: 'Up-to-date trade license issued by city corporation / municipality',
                        required: true,
                        expiry: true,
                      },
                      {
                        id: 'vat-registration',
                        label: 'VAT Registration (BIN Certificate)',
                        desc: 'Business Identification Number from NBR',
                        required: true,
                        expiry: false,
                      },
                      {
                        id: 'tin-certificate',
                        label: 'TIN Certificate',
                        desc: 'Tax Identification Number certificate from NBR',
                        required: true,
                        expiry: false,
                      },
                      {
                        id: 'tax-compliance',
                        label: 'Tax Compliance Certificate',
                        desc: 'Up-to-date tax payment clearance / return acknowledgment',
                        required: true,
                        expiry: true,
                      },
                      {
                        id: 'bank-solvency',
                        label: 'Bank Solvency Certificate / Account Confirmation',
                        desc: 'Bank solvency or letter confirming active business account',
                        required: true,
                        expiry: true,
                      },
                      {
                        id: 'company-profile',
                        label: 'Company Profile / Brochure',
                        desc: 'Overview of services, experience, key clients (optional)',
                        required: false,
                        expiry: false,
                      },
                      {
                        id: 'rjsc-cert',
                        label: 'Company Registration Certificate (RJSC)',
                        desc: 'For limited companies — RJSC incorporation certificate',
                        required: false,
                        expiry: false,
                      },
                    ].map((doc) => {
                      const uploaded = uploadedFiles[doc.id];
                      const fileInputId = `vendor-doc-upload-${doc.id}`;
                      return (
                        <div
                          key={doc.id}
                          className="p-4 border border-border rounded-lg hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <p className="text-sm font-semibold text-foreground">{doc.label}</p>
                                {doc.required && (
                                  <Badge variant="danger" size="sm">
                                    Required
                                  </Badge>
                                )}
                                {uploaded?.file && (
                                  <Badge variant="success" size="sm">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Uploaded
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{doc.desc}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                            {uploaded?.file ? (
                              <div className="flex-1 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-green-600" />
                                  <span className="text-xs text-green-800 font-medium truncate max-w-[200px]">
                                    {uploaded.file.name}
                                  </span>
                                  <span className="text-xs text-green-600">
                                    ({(uploaded.file.size / 1024).toFixed(0)} KB)
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile(doc.id)}
                                  className="p-1 hover:bg-red-100 rounded transition-colors"
                                >
                                  <X className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            ) : isEditMode && existingDocsByType[doc.id] ? (
                              <div className="flex-1 flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                  <div className="min-w-0">
                                    <span className="text-xs text-blue-800 font-medium truncate block max-w-[200px]">
                                      {existingDocsByType[doc.id].file_url?.split('/').pop() ||
                                        'Existing file'}
                                    </span>
                                    <Badge
                                      variant={
                                        existingDocsByType[doc.id].review_status === 'verified'
                                          ? 'success'
                                          : existingDocsByType[doc.id].review_status === 'rejected'
                                            ? 'danger'
                                            : 'warning'
                                      }
                                      size="sm"
                                    >
                                      {existingDocsByType[doc.id].review_status}
                                    </Badge>
                                  </div>
                                </div>
                                <label
                                  htmlFor={fileInputId}
                                  className="flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs text-blue-700 cursor-pointer transition-colors shrink-0"
                                >
                                  <Upload className="w-3 h-3" />
                                  Replace
                                </label>
                                <input
                                  id={fileInputId}
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleFileChange(doc.id, f);
                                  }}
                                />
                              </div>
                            ) : (
                              <label
                                htmlFor={fileInputId}
                                className="flex-1 border-2 border-dashed border-border rounded-lg p-3 text-center hover:border-primary/30 cursor-pointer transition-colors"
                              >
                                <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                                <p className="text-xs text-muted-foreground">
                                  Click to upload (PDF, JPG, PNG — max 5MB)
                                </p>
                              </label>
                            )}
                            {!uploaded?.file && !(isEditMode && existingDocsByType[doc.id]) && (
                              <input
                                id={fileInputId}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleFileChange(doc.id, f);
                                }}
                              />
                            )}
                            {doc.expiry && (
                              <div className="w-48">
                                <p className="block text-xs text-muted-foreground mb-1">
                                  Expiry Date
                                </p>
                                <input
                                  type="date"
                                  value={
                                    uploaded?.expiry ||
                                    (isEditMode && existingDocsByType[doc.id]?.expiry_date) ||
                                    ''
                                  }
                                  onChange={(e) => handleExpiryChange(doc.id, e.target.value)}
                                  className="w-full px-2 py-1.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-orange-800">
                            Document Expiry Tracking
                          </p>
                          <p className="text-xs text-orange-700 mt-1">
                            The system will automatically track document expiry dates and send
                            alerts to vendors 90 days, 30 days, and 7 days before expiration.
                            Vendors with expired documents will be flagged for review.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Step 4 */}
            {step === 4 && (
              <Card>
                <CardHeader
                  title="Step 4: Bank Information"
                  description="Payment and banking details for vendor payments"
                />
                <CardBody>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">
                          Bank Name <span className="text-red-500">*</span>
                        </p>
                        <select
                          {...register('bank_name', { required: 'Bank name is required' })}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select bank...</option>
                          <option>Sonali Bank PLC</option>
                          <option>Janata Bank PLC</option>
                          <option>Agrani Bank PLC</option>
                          <option>Rupali Bank PLC</option>
                          <option>Dutch-Bangla Bank Ltd</option>
                          <option>BRAC Bank Ltd</option>
                          <option>Eastern Bank Ltd</option>
                          <option>City Bank Ltd</option>
                          <option>Islami Bank Bangladesh Ltd</option>
                          <option>Standard Chartered Bangladesh</option>
                          <option>HSBC Bangladesh</option>
                          <option>Prime Bank Ltd</option>
                          <option>United Commercial Bank Ltd</option>
                          <option>Mutual Trust Bank Ltd</option>
                        </select>
                        {errors.bank_name && (
                          <p className="text-xs text-red-500 mt-1">{errors.bank_name.message}</p>
                        )}
                      </div>
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">
                          Branch Name <span className="text-red-500">*</span>
                        </p>
                        <input
                          {...register('branch_name', { required: 'Branch name is required' })}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="e.g. Motijheel Branch"
                        />
                        {errors.branch_name && (
                          <p className="text-xs text-red-500 mt-1">{errors.branch_name.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">
                          Account Name <span className="text-red-500">*</span>
                        </p>
                        <input
                          {...register('account_name', { required: 'Account name is required' })}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="As per bank records"
                        />
                        {errors.account_name && (
                          <p className="text-xs text-red-500 mt-1">{errors.account_name.message}</p>
                        )}
                      </div>
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">
                          Account Number <span className="text-red-500">*</span>
                        </p>
                        <input
                          {...register('account_number', {
                            required: 'Account number is required',
                          })}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="13-digit account number"
                        />
                        {errors.account_number && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.account_number.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">
                          Routing Number <span className="text-red-500">*</span>
                        </p>
                        <input
                          {...register('routing_number', {
                            required: 'Routing number is required',
                          })}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="9-digit routing number"
                        />
                        {errors.routing_number && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.routing_number.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="block text-sm font-medium text-foreground mb-1">
                          Account Type <span className="text-red-500">*</span>
                        </p>
                        <select
                          {...register('account_type', { required: 'Account type is required' })}
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select type...</option>
                          <option>Current Account</option>
                          <option>Savings Account</option>
                        </select>
                        {errors.account_type && (
                          <p className="text-xs text-red-500 mt-1">{errors.account_type.message}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="block text-sm font-medium text-foreground mb-1">
                        SWIFT Code (for international payments)
                      </p>
                      <input
                        {...register('swift_code')}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. DBBLBDDH"
                      />
                    </div>
                    <div className="p-3 bg-muted/30 border border-border rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        <CreditCard className="w-3 h-3 inline mr-1" />
                        Bank information is encrypted and stored securely. Only authorized finance
                        personnel can access banking details.
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Step 5 */}
            {step === 5 && (
              <Card>
                <CardHeader
                  title="Step 5: Assign Procurement Categories"
                  description={`Select one or multiple categories (${selectedCategories.length} selected of ${allCategories.length} available)`}
                />
                <CardBody>
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <Shield className="w-3 h-3 inline mr-1" />
                        <strong>Category-Based RFQ Visibility:</strong> Vendors will ONLY see and
                        respond to RFQs matching their assigned categories. Select all relevant
                        categories this vendor is qualified to supply.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {allCategories?.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`px-3 py-2 rounded-lg border-2 text-xs font-medium text-left transition-all ${selectedCategories.includes(cat) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/30 text-foreground'}`}
                        >
                          {selectedCategories.includes(cat) && (
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                          )}
                          {cat}
                        </button>
                      ))}
                    </div>
                    {selectedCategories.length > 0 && (
                      <div className="pt-3 border-t border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                          SELECTED CATEGORIES ({selectedCategories.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCategories.map((cat) => (
                            <span
                              key={cat}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs rounded-full"
                            >
                              {cat}
                              <button type="button" onClick={() => toggleCategory(cat)}>
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Step 6 */}
            {step === 6 && (
              <Card>
                <CardHeader
                  title="Step 6: Review & Submit"
                  description="Verify all information before submitting for admin approval"
                />
                <CardBody>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 border border-border rounded-lg space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                          Company
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {watchedValues.name || '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {watchedValues.organization_type || '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {watchedValues.district}, {watchedValues.division}
                        </p>
                      </div>
                      <div className="p-4 border border-border rounded-lg space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                          Contact
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {watchedValues.contact_person || '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {watchedValues.email || '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {watchedValues.phone || '—'}
                        </p>
                      </div>
                      <div className="p-4 border border-border rounded-lg space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                          Banking
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {watchedValues.bank_name || '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {watchedValues.branch_name} &middot; {watchedValues.account_type}
                        </p>
                      </div>
                      <div className="p-4 border border-border rounded-lg space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                          Categories & Documents
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {selectedCategories.length} categories selected
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {uploadedCount} document(s) uploaded
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-sm font-semibold text-green-800">Registration Summary</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Enlistment Period:</span>{' '}
                          <strong>2025-2026</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Categories:</span>{' '}
                          <strong>{selectedCategories.length} assigned</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Documents:</span>{' '}
                          <strong>{uploadedCount} uploaded</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Bank Info:</span>{' '}
                          <strong>{watchedValues.bank_name ? 'Provided' : 'Not provided'}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 font-semibold mb-1">
                        {isEditMode ? 'After Update' : 'After Submission'}
                      </p>
                      <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                        <li>Admin team will verify all submitted documents</li>
                        <li>Category assignment will be reviewed and confirmed</li>
                        <li>Vendor will receive email notification upon approval</li>
                        <li>Portal login credentials with 2FA will be sent to the vendor</li>
                        <li>Document expiry alerts will be automatically scheduled</li>
                      </ul>
                    </div>
                    <p className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-1 w-4 h-4 rounded border-border"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                      />
                      <span className="text-sm text-foreground">
                        {isEditMode
                          ? 'I confirm that all updated information is accurate and the uploaded documents are authentic.'
                          : 'I confirm that all information provided is accurate and the uploaded documents are authentic. I understand that providing false information may result in vendor disqualification or blacklisting.'}
                      </span>
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardBody>
                <p className="text-xs font-semibold text-muted-foreground mb-3">
                  REGISTRATION STEPS
                </p>
                <div className="space-y-1">
                  {steps.map((s) => (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => setStep(s.num)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors ${step === s.num ? 'bg-primary text-white' : 'hover:bg-muted text-foreground'}`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === s.num ? 'bg-white text-primary' : 'bg-muted text-muted-foreground'}`}
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
                    <p className="text-xs font-semibold text-foreground">Annual Enlistment</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Vendors are enlisted once a year or when required. Current period:
                      2025&ndash;2026. Enlistment requires admin verification and approval.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  REQUIRED DOCUMENTS
                </p>
                <ul className="space-y-1.5">
                  {[
                    'Trade License',
                    'VAT Registration (BIN)',
                    'TIN Certificate',
                    'Tax Compliance Certificate',
                    'Bank Information',
                  ].map((d, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs">
                      <FileText className="w-3 h-3 text-primary" />
                      {d}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 p-4 bg-card border border-border rounded-lg flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
          >
            Previous
          </Button>
          <div className="flex gap-3">
            <Link href={paths.dashboard.procurement.vendors.list}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={() => toast.info('Draft saved locally.')}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            {step === 6 ? (
              <Button type="submit" variant="primary" disabled={submitting || !confirmed}>
                <Send className="w-4 h-4 mr-2" />
                {submitting
                  ? isEditMode
                    ? 'Updating...'
                    : 'Submitting...'
                  : isEditMode
                    ? 'Update Vendor'
                    : 'Submit for Approval'}
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={handleNext}>
                Next Step
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
