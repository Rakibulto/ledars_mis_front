'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Eye,
  X,
  Mail,
  Star,
  Bell,
  Phone,
  Clock,
  Globe,
  MapPin,
  Shield,
  XCircle,
  FileText,
  Download,
  Building2,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import {
  useVendorDetail,
  useVendorRFQInvitations,
  useVendorWorkOrders,
  useVendorPerformanceRecords,
  useVendorPerformanceSummary,
} from './use-vendor-api';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

export function VendorDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('profile');
  const { data: apiVendor } = useVendorDetail(id);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const { data: rfqInvData } = useVendorRFQInvitations(id);
  const { data: workOrderData } = useVendorWorkOrders(id);
  const { data: perfData } = useVendorPerformanceRecords(id);
  const { data: perfSummary } = useVendorPerformanceSummary(id);

  const vendor = {
    id: apiVendor?.id || id || '',
    companyName: apiVendor?.name || '',
    companyNameBn: apiVendor?.company_name_bn || '',
    legalName: apiVendor?.legal_name || '',
    contactPerson: apiVendor?.contact_person || '',
    designation: apiVendor?.designation || '',
    email: apiVendor?.email || '',
    phone: apiVendor?.phone || '',
    officePhone: apiVendor?.office_phone || '',
    website: apiVendor?.website || '',
    address: apiVendor?.address || '',
    district: apiVendor?.district || '',
    division: apiVendor?.division || '',
    country: apiVendor?.country || 'Bangladesh',
    registrationNumber: apiVendor?.registration_number || '',
    yearEstablished: apiVendor?.year_established || '',
    organizationType: apiVendor?.organization_type || '',
    annualTurnover: apiVendor?.annual_turnover || '',
    status: apiVendor?.status || '',
    verificationState: apiVendor?.verification_state || '',
    registrationDate: apiVendor?.registration_date || '',
    enlistmentYear: apiVendor?.enlistment_year || '',
    categories: Array.isArray(apiVendor?.categories)
      ? apiVendor.categories.map((c) => (typeof c === 'object' ? c.name : c))
      : [],
    tin: apiVendor?.tax_id || '',
    vatBin: apiVendor?.bin_number || '',
    totalOrders: apiVendor?.total_orders ?? 0,
    totalValue: apiVendor?.total_value ?? 0,
    avgRating: apiVendor?.overall_rating ?? 0,
    twoFAEnabled: apiVendor?.two_fa_enabled || false,
    portalLastLogin: apiVendor?.portal_last_login || '',
  };
  const bankDetails = {
    bankName: apiVendor?.bank_name || '',
    branchName: apiVendor?.branch_name || '',
    accountName: apiVendor?.account_name || '',
    accountNumber: apiVendor?.account_number
      ? `****${String(apiVendor.account_number).slice(-4)}`
      : '',
    routingNumber: apiVendor?.routing_number || '',
    accountType: apiVendor?.account_type || '',
    swiftCode: apiVendor?.swift_code || '',
  };
  const documents = Array.isArray(apiVendor?.documents)
    ? apiVendor.documents.map((d) => ({
        id: d.id,
        name: d.doc_type || '',
        type: d.doc_type || '',
        uploadDate: d.uploaded_at || '',
        expiryDate: d.expiry_date || null,
        status: d.review_status || 'pending',
        daysToExpiry: d.expiry_date
          ? Math.ceil((new Date(d.expiry_date) - new Date()) / 86400000)
          : null,
        size: '',
        fileUrl: d.file_url || d.file || '',
      }))
    : [];
  const rfqHistory = Array.isArray(rfqInvData?.results)
    ? rfqInvData.results
    : Array.isArray(rfqInvData)
      ? rfqInvData
      : [];
  const workOrders = Array.isArray(workOrderData?.results)
    ? workOrderData.results
    : Array.isArray(workOrderData)
      ? workOrderData
      : [];
  const performanceRecords = Array.isArray(perfData?.results)
    ? perfData.results
    : Array.isArray(perfData)
      ? perfData
      : [];
  const performance = {
    onTimeDelivery: perfSummary?.total_on_time && perfSummary?.total_orders
      ? Math.round((perfSummary.total_on_time / perfSummary.total_orders) * 100)
      : 0,
    totalOrders: perfSummary?.total_orders ?? 0,
    totalOnTime: perfSummary?.total_on_time ?? 0,
    totalLate: perfSummary?.total_late ?? 0,
    totalRejected: perfSummary?.total_rejected ?? 0,
    totalSpent: parseFloat(perfSummary?.total_spent ?? 0),
    avgCompliance: parseFloat(perfSummary?.avg_compliance ?? 0),
  };
  const expiryAlerts = documents
    .filter((d) => d.daysToExpiry !== null && d.daysToExpiry <= 90)
    .map((d) => ({
      doc: d.name,
      expiryDate: d.expiryDate,
      daysLeft: d.daysToExpiry,
    }));
  const totalEstimatedValue = performance.totalSpent;
  const getDocExpiryBadge = (daysToExpiry) => {
    if (daysToExpiry === null)
      return (
        <Badge variant="default" size="sm">
          No Expiry
        </Badge>
      );
    if (daysToExpiry <= 30)
      return (
        <Badge variant="danger" size="sm">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {daysToExpiry}d
        </Badge>
      );
    if (daysToExpiry <= 90)
      return (
        <Badge variant="warning" size="sm">
          <Clock className="w-3 h-3 mr-1" />
          {daysToExpiry}d
        </Badge>
      );
    return (
      <Badge variant="success" size="sm">
        <CheckCircle className="w-3 h-3 mr-1" />
        {daysToExpiry}d
      </Badge>
    );
  };
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href={paths.dashboard.procurement.vendors.list}>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          </Link>
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                {vendor.companyName}
              </h1>
              <Badge variant="success">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </Badge>
              <Badge variant="primary" size="sm">
                {vendor.enlistmentYear}
              </Badge>
              {vendor.twoFAEnabled && (
                <Badge variant="info" size="sm">
                  <Shield className="w-3 h-3 mr-1" />
                  2FA
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {vendor.id} &middot; {vendor.companyNameBn}
            </p>
          </div>
          <Link href={`${paths.dashboard.procurement.vendors.create}?edit=${vendor.id}`}>
            <Button variant="outline">Edit Profile</Button>
          </Link>
        </div>

        {/* Expiry Alerts */}
        {expiryAlerts.length > 0 && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
            <Bell className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-800">Document Expiry Alerts</p>
              {expiryAlerts.map((a, i) => (
                <p key={i} className="text-xs text-orange-700 mt-1">
                  <strong>{a.doc}</strong> expires on {a.expiryDate} ({a.daysLeft} days remaining).
                  Automated alert sent to vendor.
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-4">
          {[
            'profile',
            'documents',
            'bank',
            'categories',
            'rfq-history',
            'work-orders',
            'performance',
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {tab
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Company Profile" description="Legal and business information" />
            <CardBody>
              <div className="space-y-3 text-sm">
                {[
                  ['Legal Name', vendor.legalName],
                  ['Registration (RJSC)', vendor.registrationNumber],
                  ['Year Established', vendor.yearEstablished],
                  ['Organization Type', vendor.organizationType],
                  ['Annual Turnover', vendor.annualTurnover],
                  ['TIN', vendor.tin],
                  ['VAT BIN', vendor.vatBin],
                  ['Enlistment Period', vendor.enlistmentYear],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="flex justify-between py-1 border-b border-border/50"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Contact Information" />
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{vendor.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Mobile</p>
                    <p className="text-sm font-medium">{vendor.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Office</p>
                    <p className="text-sm font-medium">{vendor.officePhone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="w-4 h-4 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Website</p>
                    <p className="text-sm font-medium">{vendor.website}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm font-medium">{vendor.address}</p>
                    <p className="text-xs text-muted-foreground">
                      {vendor.district}, {vendor.division}, {vendor.country}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="md:col-span-2">
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary">
                  {vendor.contactPerson
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{vendor.contactPerson}</h3>
                  <p className="text-sm text-muted-foreground">{vendor.designation}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Portal: 2FA {vendor.twoFAEnabled ? 'Enabled' : 'Disabled'} &middot; Last login:{' '}
                    {vendor.portalLastLogin}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </Button>
                  <Button variant="outline" size="sm">
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab: Documents with Expiry Tracking */}
      {activeTab === 'documents' && (
        <Card>
          <CardHeader
            title="Compliance Documents"
            description="Document expiry is tracked automatically. Alerts sent at 90, 30, and 7 days before expiry."
          />
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-semibold">Document</th>
                    <th className="px-4 py-3 text-xs font-semibold">Upload Date</th>
                    <th className="px-4 py-3 text-xs font-semibold">Expiry Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-center">Days to Expiry</th>
                    <th className="px-4 py-3 text-xs font-semibold">Verification</th>
                    <th className="px-4 py-3 text-xs font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className={`border-b border-border ${doc.daysToExpiry !== null && doc.daysToExpiry <= 90 ? 'bg-orange-50/50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">{doc.uploadDate}</td>
                      <td className="px-4 py-3 text-xs">{doc.expiryDate || 'N/A'}</td>
                      <td className="px-4 py-3 text-center">
                        {getDocExpiryBadge(doc.daysToExpiry)}
                      </td>
                      <td className="px-4 py-3">
                        {doc.status === 'Verified' ? (
                          <Badge variant="success" size="sm" className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        ) : doc.status === 'Rejected' ? (
                          <Badge variant="danger" size="sm" className="bg-red-100 text-red-600 border-red-200">
                            <XCircle className="w-3 h-3 mr-1" />
                            Rejected
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="p-1.5 hover:bg-muted rounded"
                            onClick={() => setSelectedDoc(doc)}
                          >
                            <Eye className="w-4 h-4 text-primary" />
                          </button>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-muted rounded inline-flex"
                          >
                            <Download className="w-4 h-4 text-primary" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <Bell className="w-3 h-3 inline mr-1" />
                <strong>Auto-Alert Schedule:</strong> 90 days (email), 30 days (email + portal), 7
                days (email + portal + admin notification). Expired documents trigger vendor status
                review.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tab: Bank */}
      {activeTab === 'bank' && (
        <Card>
          <CardHeader title="Bank Account Details" description="Payment and banking information" />
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                {[
                  ['Bank Name', bankDetails.bankName],
                  ['Branch', bankDetails.branchName],
                  ['Account Name', bankDetails.accountName],
                  ['Account Type', bankDetails.accountType],
                ].map(([l, v]) => (
                  <div key={l}>
                    <label className="text-xs text-muted-foreground">{l}</label>
                    <p className="text-sm font-medium">{v}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {[
                  ['Account Number', bankDetails.accountNumber],
                  ['Routing Number', bankDetails.routingNumber],
                  ['SWIFT Code', bankDetails.swiftCode],
                  ['TIN', vendor.tin],
                  ['VAT BIN', vendor.vatBin],
                ].map(([l, v]) => (
                  <div key={l}>
                    <label className="text-xs text-muted-foreground">{l}</label>
                    <p className="text-sm font-mono font-medium">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tab: Categories */}
      {activeTab === 'categories' && (
        <Card>
          <CardHeader
            title="Assigned Procurement Categories"
            description="Vendor can view and respond to RFQs only in these categories"
          />
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {vendor.categories.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-4 border-2 border-primary/20 bg-primary/5 rounded-lg flex items-center justify-between"
                >
                  <span className="text-sm font-medium">{cat}</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              ))}
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <Shield className="w-3 h-3 inline mr-1" />
                RFQs are visible to this vendor ONLY if the RFQ category matches one of these
                assigned categories.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tab: RFQ History */}
      {activeTab === 'rfq-history' && (
        <Card>
          <CardHeader
            title="RFQ Participation History"
            description={`${rfqHistory.length} RFQs invited | ${rfqHistory.filter((r) => r.submitted_status).length} submitted`}
          />
          <CardBody>
            {rfqHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No RFQ invitations found for this vendor.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="px-4 py-3 text-xs font-semibold">RFQ Number</th>
                      <th className="px-4 py-3 text-xs font-semibold">Title</th>
                      <th className="px-4 py-3 text-xs font-semibold">Category</th>
                      <th className="px-4 py-3 text-xs font-semibold">Deadline</th>
                      <th className="px-4 py-3 text-xs font-semibold">RFQ Status</th>
                      <th className="px-4 py-3 text-xs font-semibold">Invite Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-center">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfqHistory.map((rfq) => (
                      <tr key={rfq.id} className="border-b border-border hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-mono text-primary">{rfq.rfq_number || '—'}</td>
                        <td className="px-4 py-3 text-sm">{rfq.rfq_title || '—'}</td>
                        <td className="px-4 py-3">
                          {rfq.rfq_category ? (
                            <Badge variant="default" size="sm">{rfq.rfq_category}</Badge>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {rfq.rfq_deadline ? rfq.rfq_deadline.slice(0, 10) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={rfq.rfq_status === 'awarded' ? 'success' : rfq.rfq_status === 'cancelled' ? 'danger' : 'default'}
                            size="sm"
                          >
                            {rfq.rfq_status || '—'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              rfq.invite_status === 'submitted' ? 'success'
                              : rfq.invite_status === 'declined' ? 'danger'
                              : rfq.invite_status === 'viewed' ? 'info'
                              : 'warning'
                            }
                            size="sm"
                            className="capitalize"
                          >
                            {rfq.invite_status || 'sent'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {rfq.submitted_status ? (
                            <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Tab: Work Orders */}
      {activeTab === 'work-orders' && (
        <Card>
          <CardHeader
            title="Work Order History"
            description="Issued work orders and delivery tracking"
          />
          <CardBody>
            {workOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No work orders found for this vendor.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="px-4 py-3 text-xs font-semibold">WO Number</th>
                      <th className="px-4 py-3 text-xs font-semibold">Title</th>
                      <th className="px-4 py-3 text-xs font-semibold">Category</th>
                      <th className="px-4 py-3 text-xs font-semibold">Order Date</th>
                      <th className="px-4 py-3 text-xs font-semibold">Delivery Deadline</th>
                      <th className="px-4 py-3 text-xs font-semibold text-right">Amount (BDT)</th>
                      <th className="px-4 py-3 text-xs font-semibold">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold">Delivery</th>
                      <th className="px-4 py-3 text-xs font-semibold">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrders.map((wo) => (
                      <tr key={wo.id} className="border-b border-border hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-mono text-primary">{wo.workOrderNumber || wo.wo_number || '—'}</td>
                        <td className="px-4 py-3 text-sm">{wo.title || '—'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{wo.category || '—'}</td>
                        <td className="px-4 py-3 text-xs">{wo.orderDate || wo.order_date || '—'}</td>
                        <td className="px-4 py-3 text-xs">{wo.deliveryDeadline || wo.delivery_date || '—'}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono font-semibold">
                          {wo.totalAmount != null
                            ? `BDT ${parseFloat(wo.totalAmount || wo.total_amount || 0).toLocaleString()}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {wo.status?.toLowerCase() === 'approved' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-green-100 text-green-700 border-green-200">
                              {wo.status}
                            </span>
                          ) : (
                            <Badge
                              variant={
                                wo.status === 'Completed' ? 'success'
                                : wo.status === 'In Progress' ? 'info'
                                : wo.status === 'Cancelled' ? 'danger'
                                : 'warning'
                              }
                              size="sm"
                            >
                              {wo.status || '—'}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              (wo.deliveryStatus || wo.delivery_status) === 'completed' ? 'success'
                              : (wo.deliveryStatus || wo.delivery_status) === 'in-progress' ? 'info'
                              : 'default'
                            }
                            size="sm"
                            className="capitalize"
                          >
                            {wo.deliveryStatus || wo.delivery_status || 'not-started'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              (wo.paymentStatus || wo.payment_status) === 'paid' ? 'success'
                              : (wo.paymentStatus || wo.payment_status) === 'partial' ? 'warning'
                              : 'default'
                            }
                            size="sm"
                            className="capitalize"
                          >
                            {wo.paymentStatus || wo.payment_status || 'not-started'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Tab: Performance */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Orders', value: performance.totalOrders, color: 'text-primary' },
              { label: 'On-Time', value: performance.totalOnTime, color: 'text-green-600' },
              { label: 'Late', value: performance.totalLate, color: 'text-yellow-600' },
              { label: 'Rejected', value: performance.totalRejected, color: 'text-red-600' },
              { label: 'On-Time Rate', value: `${performance.onTimeDelivery}%`, color: 'text-blue-600' },
              { label: 'Compliance Avg', value: `${parseFloat(performance.avgCompliance).toFixed(1)}%`, color: 'text-purple-600' },
            ].map((s) => (
              <Card key={s.label}>
                <CardBody>
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Monthly records table */}
          <Card>
            <CardHeader title="Monthly Performance Records" />
            <CardBody>
              {performanceRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No performance records found for this vendor.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="text-left">
                        <th className="px-4 py-3 text-xs font-semibold">Period</th>
                        <th className="px-4 py-3 text-xs font-semibold text-center">Total Orders</th>
                        <th className="px-4 py-3 text-xs font-semibold text-center">On-Time</th>
                        <th className="px-4 py-3 text-xs font-semibold text-center">Late</th>
                        <th className="px-4 py-3 text-xs font-semibold text-center">Rejected</th>
                        <th className="px-4 py-3 text-xs font-semibold text-center">On-Time Rate</th>
                        <th className="px-4 py-3 text-xs font-semibold text-center">Avg Delivery (days)</th>
                        <th className="px-4 py-3 text-xs font-semibold text-center">Compliance</th>
                        <th className="px-4 py-3 text-xs font-semibold text-right">Total Spent (BDT)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceRecords.map((rec) => (
                        <tr key={rec.id} className="border-b border-border hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm font-medium">
                            {String(rec.period_month).padStart(2, '0')}/{rec.period_year}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">{rec.total_orders}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-medium text-green-600">{rec.on_time_deliveries}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-medium text-yellow-600">{rec.late_deliveries}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-medium text-red-600">{rec.rejected_items}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              variant={rec.delivery_rate >= 80 ? 'success' : rec.delivery_rate >= 50 ? 'warning' : 'danger'}
                              size="sm"
                            >
                              {rec.delivery_rate}%
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">{rec.avg_delivery_days}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              variant={rec.compliance_score >= 80 ? 'success' : rec.compliance_score >= 50 ? 'warning' : 'danger'}
                              size="sm"
                            >
                              {parseFloat(rec.compliance_score).toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-mono font-semibold">
                            {parseFloat(rec.total_spent).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="bg-background rounded-xl shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold capitalize">
                  {selectedDoc.name?.replace(/-/g, ' ')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Document Preview */}
            <div className="px-5 py-4 flex justify-center bg-muted/30 border-b border-border">
              {selectedDoc.fileUrl ? (
                /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(selectedDoc.fileUrl) ? (
                  <img
                    src={selectedDoc.fileUrl}
                    alt={selectedDoc.name}
                    className="max-h-64 max-w-full rounded object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                    <FileText className="w-12 h-12" />
                    <p className="text-xs">Preview not available</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <FileText className="w-12 h-12" />
                  <p className="text-xs">No file attached</p>
                </div>
              )}
            </div>

            {/* Document Details */}
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground mb-0.5">Document Type</p>
                  <p className="font-medium capitalize">{selectedDoc.name?.replace(/-/g, ' ') || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Verification</p>
                  <div>
                    {selectedDoc.status === 'Verified' ? (
                      <Badge variant="success" size="sm" className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : selectedDoc.status === 'Rejected' ? (
                      <Badge variant="danger" size="sm" className="bg-red-100 text-red-600 border-red-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Upload Date</p>
                  <p className="font-medium">{selectedDoc.uploadDate?.slice(0, 10) || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Expiry Date</p>
                  <p className="font-medium">{selectedDoc.expiryDate || 'N/A'}</p>
                </div>
                {selectedDoc.daysToExpiry !== null && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Days to Expiry</p>
                    <div>{getDocExpiryBadge(selectedDoc.daysToExpiry)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
              {selectedDoc.fileUrl && (
                <a
                  href={selectedDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:opacity-90"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
              )}
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
