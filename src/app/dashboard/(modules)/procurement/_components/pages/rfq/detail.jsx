'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Eye,
  Bell,
  Lock,
  Mail,
  Send,
  Star,
  Clock,
  Globe,
  Users,
  Shield,
  XCircle,
  Download,
  FileText,
  ArrowLeft,
  BarChart2,
  DollarSign,
  CheckCircle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { PageLoader } from '../../components/ui/loading';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

function toDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = value instanceof Date ? value : toDate(value);
  if (!date) return 'Pending';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function RFQDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: rfqRaw, loading: rfqLoading } = useGetRequest(
    id
      ? `${endpoints.procurement_management.rfqs}?rfq_number=${encodeURIComponent(id)}&pagination=false`
      : null
  );

  const rawRFQ = Array.isArray(rfqRaw)
    ? rfqRaw[0]
    : Array.isArray(rfqRaw?.results)
      ? rfqRaw.results[0]
      : null;

  const rfq = rawRFQ
    ? {
        rfqNumber: rawRFQ.rfq_number || '',
        mrfRef:
          rawRFQ.mr_number ||
          rawRFQ.requisition_no ||
          rawRFQ.linked_requisitions?.[0]?.requisition_no ||
          '',
        title: rawRFQ.rfq_title || rawRFQ.title || '',
        project: rawRFQ.linked_requisitions?.[0]?.title || rawRFQ.department || '',
        office: rawRFQ.department || '',
        department: rawRFQ.department || '',
        category: rawRFQ.category_name || '',
        categoryCode: '',
        selectedCategories: rawRFQ.invited_vendors
          ? [...new Set(rawRFQ.invited_vendors.map((v) => v.category).filter(Boolean))]
          : [],
        budgetCode: '',
        donorCode: '',
        accountHead: '',
        status: (rawRFQ.status || 'Draft').toLowerCase(),
        urgency: (rawRFQ.urgency || 'Normal').toLowerCase(),
        createdAt: rawRFQ.created_at || '',
        publishedAt: rawRFQ.published_at || rawRFQ.published_date || '',
        publishedDate: formatDate(rawRFQ.published_at || rawRFQ.published_date),
        deadline: rawRFQ.submission_deadline || '',
        evaluationCriteria: 'Lowest Price (L1)',
        procurementOfficer: rawRFQ.created_by_name || '',
        createdBy: rawRFQ.created_by_name || '',
        deliveryLocation: rawRFQ.linked_requisitions?.[0]?.delivery_location || '',
        requiredByDate: rawRFQ.linked_requisitions?.[0]?.required_by_date || '',
        scopeOfWork: rawRFQ.description || '',
        termsConditions: rawRFQ.payment_terms
          ? rawRFQ.payment_terms
              .split('\n')
              .map((t) => t.replace(/^\d+\.\s*/, '').trim())
              .filter(Boolean)
          : [],
        requiredDocuments: Array.isArray(rawRFQ.required_documents)
          ? rawRFQ.required_documents
          : [],
        boqItems: (rawRFQ.line_items || rawRFQ.items || []).map((item, idx) => ({
          slNo: String(idx + 1),
          description: item.item_name || '',
          specification: item.specification || '',
          unit: item.unit || 'Pcs',
          quantity: Number(item.quantity) || 0,
          estimatedRate: Number(item.estimated_unit_price) || 0,
          estimatedAmount: Number(item.estimated_total) || 0,
        })),
        vendors: (rawRFQ.invited_vendors || rawRFQ.vendors || []).map((v) => {
          const vendor = v.vendor || v; // handle both cases

          return {
            id: String(vendor.id),
            name: vendor.name || vendor.company_name_bn || '',
            categories:
              Array.isArray(vendor.categories) && vendor.categories.length > 0
                ? vendor.categories
                : vendor.category
                  ? [vendor.category]
                  : [],
            inviteStatus: v.invite_status || 'sent',
            submitted_status: v.submitted_status || false,
            invitedAt: v.invited_at || rawRFQ.published_at || rawRFQ.published_date || '',
            viewedAt: v.invite_status === 'viewed' ? v.updated_at : null,
            submittedAt: v.submitted_status ? v.updated_at : null,
            updatedAt: v.updated_at || null,
            email: vendor.user?.email || '',
            rating: Number(vendor.rating) || 0,
          };
        }),
        notificationLog: [],
      }
    : null;

  if (rfqLoading) {
    return <PageLoader message="Loading RFQ details..." />;
  }
  if (!rfq) {
    return <div className="p-8 text-center text-muted-foreground">RFQ not found.</div>;
  }

  const totalEstimated = rfq.boqItems.reduce((s, i) => s + i.estimatedAmount, 0);
  const vendorStats = {
    invited: rfq.vendors.length,
    viewed: rfq.vendors.filter((v) => v.viewedAt).length,
    submitted: rfq.vendors.filter((v) => v.inviteStatus === 'submitted').length,
    declined: rfq.vendors.filter((v) => v.inviteStatus === 'declined').length,
  };
  const publishedAt = toDate(rfq.publishedAt || rfq.createdAt);
  const submissionDeadline = toDate(rfq.deadline);
  const latestVendorActivity = rfq.vendors
    .map((vendor) =>
      toDate(vendor.submittedAt || vendor.viewedAt || vendor.updatedAt || vendor.invitedAt)
    )
    .filter(Boolean)
    .sort((left, right) => right - left)[0];
  const awardDecisionAt = ['awarded', 'closed'].includes(rfq.status)
    ? toDate(rawRFQ?.updated_at)
    : null;
  const timeline = [
    {
      date: formatDate(publishedAt),
      label: 'Published & Sent to Vendors',
      icon: Send,
      color: 'text-blue-500',
    },
    {
      date: formatDate(submissionDeadline),
      label: 'Submission Deadline',
      icon: Clock,
      color: 'text-orange-500',
    },
    {
      date: latestVendorActivity ? formatDate(latestVendorActivity) : 'Pending',
      label: 'Evaluation Period',
      icon: BarChart2,
      color: 'text-purple-500',
    },
    {
      date: awardDecisionAt ? formatDate(awardDecisionAt) : 'Pending',
      label: 'Award Decision',
      icon: CheckCircle,
      color: 'text-green-500',
    },
  ];
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'boq', label: 'BOQ & Specifications', icon: FileText },
    { id: 'terms', label: 'Terms & Evaluation', icon: Shield },
    { id: 'vendors', label: 'Vendor Participation', icon: Users },
    { id: 'notifications', label: 'Notification Log', icon: Bell },
  ];
  const getInviteStatusBadge = (status) => {
    const config = {
      submitted: { variant: 'success', label: 'Submitted' },
      viewed: { variant: 'info', label: 'Viewed' },
      sent: { variant: 'warning', label: 'Sent' },
      declined: { variant: 'danger', label: 'Declined' },
    };
    const c = config[status] || config.sent;
    return (
      <Badge variant={c.variant} size="sm">
        {c.label}
      </Badge>
    );
  };
  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          <Link href={paths.dashboard.procurement.rfq.list}>
            <button type="button" className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          </Link>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
              <h1 className="text-xl md:text-2xl font-semibold text-foreground">{rfq.rfqNumber}</h1>
              <Badge variant="success">
                <Globe className="w-3 h-3 mr-1" />
                Open for Quotes
              </Badge>
              <Badge variant="default">{rfq.urgency}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{rfq.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(paths.dashboard.procurement.rfq.distribution)}
            >
              <Send className="w-4 h-4 mr-2" />
              Distribution
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push(paths.dashboard.procurement.rfq.monitoring)}
            >
              <BarChart2 className="w-4 h-4 mr-2" />
              Monitoring
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-8">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <Card>
                <CardHeader
                  title="RFQ Overview"
                  description={`Generated from approved ${rfq.mrfRef}`}
                />
                <CardBody>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {[
                      ['RFQ Number', rfq.rfqNumber],
                      ['MRF Reference', rfq.mrfRef],
                      ['Published', rfq.publishedDate],
                      ['Project', rfq.project],
                      ['Office', rfq.office],
                      ['Category', rfq.category],
                      ['Budget Code', rfq.budgetCode],
                      ['Donor Code', rfq.donorCode],
                      ['Account Head', rfq.accountHead],
                      ['Delivery Location', rfq.deliveryLocation],
                      ['Required By', rfq.requiredByDate],
                      ['Procurement Officer', rfq.procurementOfficer],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Scope of Work" />
                <CardBody>
                  <p className="text-sm text-foreground leading-relaxed">{rfq.scopeOfWork}</p>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Category-Based Visibility
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 mb-2">
                        This RFQ is visible only to vendors registered under the following
                        categories:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {rfq.selectedCategories.map((cat, i) => (
                          <Badge key={i} variant="primary" size="sm">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Vendors outside these categories cannot view or respond to this RFQ.
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Tab: BOQ */}
          {activeTab === 'boq' && (
            <Card>
              <CardHeader
                title="Bill of Quantities & Specifications"
                description={`${rfq.boqItems.length} items auto-pulled from ${rfq.mrfRef}`}
                action={
                  <Badge variant="success" size="sm">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    From MRF
                  </Badge>
                }
              />
              <CardBody>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold text-left">SL#</th>
                        <th className="px-4 py-3 text-xs font-semibold text-left">Item Name</th>
                        <th className="px-4 py-3 text-xs font-semibold text-left">Specification</th>
                        <th className="px-4 py-3 text-xs font-semibold text-center">Unit</th>
                        <th className="px-4 py-3 text-xs font-semibold text-center">Qty</th>
                        <th className="px-4 py-3 text-xs font-semibold text-right">Est. Rate</th>
                        <th className="px-4 py-3 text-xs font-semibold text-right">Est. Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfq.boqItems.map((item) => (
                        <tr key={item.slNo} className="border-b border-border">
                          <td className="px-4 py-3 text-sm font-mono">{item.slNo}</td>
                          <td className="px-4 py-3 text-sm font-medium">{item.description}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {item.specification}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">{item.unit}</td>
                          <td className="px-4 py-3 text-sm text-center font-semibold">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-mono">
                            BDT {item.estimatedRate.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold font-mono">
                            BDT {item.estimatedAmount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-primary/5 border-t-2 border-primary">
                        <td colSpan={6} className="px-4 py-3 text-sm font-bold text-right">
                          Grand Total:
                        </td>
                        <td className="px-4 py-3 text-lg font-bold text-primary text-right font-mono">
                          BDT {totalEstimated.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <strong>Note:</strong> Estimated rates are internal only. Vendors see items,
                    specs, units, and quantities. They will quote their own prices.
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Tab: Terms & Evaluation */}
          {activeTab === 'terms' && (
            <div className="space-y-6">
              <Card>
                <CardHeader title="Terms & Conditions" />
                <CardBody>
                  <ol className="list-decimal list-inside space-y-2">
                    {rfq.termsConditions.map((t, i) => (
                      <li key={i} className="text-sm text-foreground">
                        {t}
                      </li>
                    ))}
                  </ol>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Required Documents" />
                <CardBody>
                  <div className="flex flex-wrap gap-2">
                    {rfq.requiredDocuments.map((d, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-full font-medium"
                      >
                        <FileText className="w-3 h-3" />
                        {d}
                      </span>
                    ))}
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <div className="flex items-center gap-3">
                    <BarChart2 className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Evaluation Criteria: {rfq.evaluationCriteria}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Award will be made to the lowest responsive and responsible bidder meeting
                        all specifications.
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Tab: Vendor Participation */}
          {activeTab === 'vendors' && (
            <Card>
              <CardHeader
                title={`Vendor Participation (${rfq.vendors.length})`}
                description="Only category-matching vendors were invited"
                action={
                  <Badge variant="info" size="sm">
                    <Shield className="w-3 h-3 mr-1" />
                    Category: {rfq.selectedCategories.join(', ')}
                  </Badge>
                }
              />
              <CardBody>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b-2 border-border">
                      <tr className="text-left">
                        <th className="pb-3 text-xs font-semibold">Vendor</th>
                        {/* <th className="pb-3 text-xs font-semibold">Categories</th> */}
                        <th className="pb-3 text-xs font-semibold text-center">Rating</th>
                        <th className="pb-3 text-xs font-semibold">Invited at</th>
                        <th className="pb-3 text-xs font-semibold">Viewed</th>
                        <th className="pb-3 text-xs font-semibold">Submitted</th>
                        <th className="pb-3 text-xs font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfq.vendors.map((v) => (
                        <tr key={v.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3">
                            <p className="text-sm font-medium">{v.name}</p>
                            <p className="text-xs text-muted-foreground">{v.email}</p>
                          </td>
                          {/* <td className="py-3">
                            <div className="flex flex-wrap gap-1">
                              {v.categories.map((c, i) => (
                                <span
                                  key={i}
                                  className={`text-[10px] px-1.5 py-0.5 rounded ${rfq.selectedCategories.includes(c) ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          </td> */}
                          <td className="py-3 text-center">
                            <span className="flex items-center gap-0.5 justify-center text-xs">
                              <Star className="w-3 h-3 text-yellow-500" />
                              {v.rating}
                            </span>
                          </td>
                          <td className="py-3 text-xs">
                            {new Date(v.invitedAt).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 text-xs">{v.viewedAt || <span>&mdash;</span>}</td>
                          <td className="py-3">
                            {v.submitted_status === true ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-700 border border-green-200">
                                <CheckCircle className="w-3 h-3" />
                                Submitted
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-600 border border-orange-200">
                                <Clock className="w-3 h-3" />
                                Not Submitted
                              </span>
                            )}
                          </td>
                          <td className="py-3">{getInviteStatusBadge(v.inviteStatus)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Tab: Notification Log */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader
                title="Notification Log"
                description="Email and portal notifications sent to vendors"
              />
              <CardBody>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b-2 border-border">
                      <tr className="text-left">
                        <th className="pb-3 text-xs font-semibold">Type</th>
                        <th className="pb-3 text-xs font-semibold">Recipient</th>
                        <th className="pb-3 text-xs font-semibold">Subject</th>
                        <th className="pb-3 text-xs font-semibold">Sent At</th>
                        <th className="pb-3 text-xs font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfq.notificationLog.map((log, idx) => (
                        <tr key={idx} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3">
                            <Badge variant={log.type === 'email' ? 'info' : 'primary'} size="sm">
                              {log.type === 'email' ? (
                                <Mail className="w-3 h-3 mr-1" />
                              ) : (
                                <Globe className="w-3 h-3 mr-1" />
                              )}
                              {log.type === 'email' ? 'Email' : 'Portal'}
                            </Badge>
                          </td>
                          <td className="py-3 text-sm">{log.recipient}</td>
                          <td className="py-3 text-xs text-muted-foreground">{log.subject}</td>
                          <td className="py-3 text-xs">{log.sentAt}</td>
                          <td className="py-3">
                            <Badge
                              variant={
                                log.status === 'delivered'
                                  ? 'success'
                                  : log.status === 'failed'
                                    ? 'danger'
                                    : 'warning'
                              }
                              size="sm"
                            >
                              {log.status === 'delivered' && (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              )}
                              {log.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                              {log.status === 'failed'
                                ? 'Failed'
                                : log.status === 'delivered'
                                  ? 'Delivered'
                                  : 'Pending'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold text-foreground mb-3">Quick Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Est. Total</p>
                    <p className="text-lg font-bold text-primary">
                      BDT {totalEstimated.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Invited</p>
                    <p className="text-xl font-bold text-foreground">{vendorStats.invited}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="text-xl font-bold text-green-600">{vendorStats.submitted}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Viewed</p>
                    <p className="text-xl font-bold text-blue-600">{vendorStats.viewed}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Declined</p>
                    <p className="text-xl font-bold text-red-600">{vendorStats.declined}</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold text-foreground mb-3">Timeline</h3>
              <div className="space-y-3">
                {timeline.map((t, i) => {
                  const Icon = t.icon;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${t.color}`} />
                      <div>
                        <p className="text-xs font-medium text-foreground">{t.label}</p>
                        <p className="text-[10px] text-muted-foreground">{t.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(paths.dashboard.procurement.rfq.distribution)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Resend to Pending Vendors
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(paths.dashboard.procurement.rfq.monitoring)}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  View Locked Submissions
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Download BOQ Sheet
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
