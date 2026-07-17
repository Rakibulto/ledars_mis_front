'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  Zap,
  Bell,
  Clock,
  Users,
  Filter,
  Search,
  Printer,
  XCircle,
  Download,
  FileText,
  BarChart3,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { PageLoader } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Modal } from '../../components/ui/modal';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
import { useGetRequest } from '../../../../../../../actions/ledars-hook';

const EP = endpoints.procurement_management;

// Mock data — BD-specific, linked to existing RFQs & vendor data
const mockComparativeStatements = [
  {
    id: 'CS-2026-001',
    rfqNumber: 'RFQ-2026-015',
    title: 'IT Equipment & Computer Hardware for Dhaka Head Office',
    description: 'Desktop computers, laptops, printers & networking equipment',
    createdDate: '2026-03-20',
    createdBy: 'Fatema Khatun',
    status: 'pending_approval',
    vendorsCompared: 5,
    recommendedVendor: 'TechBD Solutions Ltd',
    estimatedValue: 3250000,
    lowestBid: 2875000,
    savings: 375000,
    savingsPercent: '11.5',
    category: 'IT Equipment',
    budgetCode: 'BD-ICT-2026-01',
    project: 'Digital Infrastructure Upgrade',
    office: 'Dhaka Head Office',
    currentApprover: 'Procurement Committee',
    approvalLevel: '2 of 3',
    autoExtracted: true,
    technicalScoreAvg: 82,
    notifications: [
      { type: 'approval', message: 'Awaiting Procurement Committee review', time: '2 hours ago' },
    ],
  },
  {
    id: 'CS-2026-002',
    rfqNumber: 'RFQ-2026-016',
    title: "Office Furniture Supply for Cox's Bazar Regional Office",
    description: 'Ergonomic desks, chairs, filing cabinets & conference furniture',
    createdDate: '2026-03-22',
    createdBy: 'Md. Rafiqul Islam',
    status: 'approved',
    vendorsCompared: 4,
    recommendedVendor: 'Hatil-Brothers Furniture Ltd',
    estimatedValue: 1850000,
    lowestBid: 1625000,
    savings: 225000,
    savingsPercent: '12.2',
    category: 'Office Furniture',
    budgetCode: 'BD-FUR-2026-03',
    project: "Cox's Bazar Office Setup",
    office: "Cox's Bazar Regional Office",
    approvedDate: '2026-03-25',
    approvedBy: 'Country Director (Final Approver)',
    autoExtracted: true,
    technicalScoreAvg: 88,
  },
  {
    id: 'CS-2026-003',
    rfqNumber: 'RFQ-2026-012',
    title: 'Solar Panel Installation — 8 Field Offices',
    description: 'Solar power systems with inverters, batteries & installation for field offices',
    createdDate: '2026-03-10',
    createdBy: 'Shahana Begum',
    status: 'draft',
    vendorsCompared: 6,
    recommendedVendor: null,
    estimatedValue: 8500000,
    lowestBid: 7450000,
    savings: 1050000,
    savingsPercent: '12.4',
    category: 'Solar & Renewable Energy',
    budgetCode: 'BD-ENR-2026-01',
    project: 'Green Energy Initiative',
    office: 'Dhaka Head Office',
    autoExtracted: false,
    technicalScoreAvg: 0,
    notifications: [
      {
        type: 'action',
        message: 'Technical scorecard pending — 6 proposals awaiting evaluation',
        time: '1 day ago',
      },
    ],
  },
  {
    id: 'CS-2026-004',
    rfqNumber: 'RFQ-2026-011',
    title: 'Medical Supplies for Community Health Program',
    description:
      'First aid supplies, PPE kits, diagnostic equipment & medicines for 12 field clinics',
    createdDate: '2026-03-05',
    createdBy: 'Dr. Nafisa Akter',
    status: 'returned',
    vendorsCompared: 3,
    recommendedVendor: 'MedEquip Bangladesh Ltd',
    estimatedValue: 4200000,
    lowestBid: 3650000,
    savings: 550000,
    savingsPercent: '13.1',
    category: 'Medical & Health Supplies',
    budgetCode: 'BD-HLT-2026-02',
    project: 'Community Health Resilience',
    office: 'Dhaka Head Office',
    returnedBy: 'Procurement Committee',
    returnReason: 'Need updated Drug License for recommended vendor; re-verify expiry dates',
    autoExtracted: true,
    technicalScoreAvg: 75,
    notifications: [
      {
        type: 'returned',
        message: 'Returned by Procurement Committee — action needed',
        time: '3 days ago',
      },
    ],
  },
  {
    id: 'CS-2026-005',
    rfqNumber: 'RFQ-2026-009',
    title: 'Printing & Publication Materials — Annual Report FY2025-26',
    description: 'Annual reports, brochures, posters, and advocacy materials printing',
    createdDate: '2026-02-28',
    createdBy: 'Tasneem Jahan',
    status: 'approved',
    vendorsCompared: 5,
    recommendedVendor: 'Dhaka Print House Ltd',
    estimatedValue: 1200000,
    lowestBid: 985000,
    savings: 215000,
    savingsPercent: '17.9',
    category: 'Printing & Publications',
    budgetCode: 'BD-PUB-2026-01',
    project: 'Communications & Advocacy',
    office: 'Dhaka Head Office',
    approvedDate: '2026-03-05',
    approvedBy: 'Country Director (Final Approver)',
    autoExtracted: true,
    technicalScoreAvg: 91,
  },
  {
    id: 'CS-2026-006',
    rfqNumber: 'RFQ-2026-008',
    title: 'Vehicle Rental — Field Operations (6 Months)',
    description: 'Rental of 15 field vehicles (SUV/pickup) with drivers for programme activities',
    createdDate: '2026-02-20',
    createdBy: 'Md. Ashraful Hoque',
    status: 'pending_approval',
    vendorsCompared: 4,
    recommendedVendor: 'Amin Transport Services',
    estimatedValue: 5400000,
    lowestBid: 4850000,
    savings: 550000,
    savingsPercent: '10.2',
    category: 'Transport & Logistics',
    budgetCode: 'BD-TRN-2026-01',
    project: 'Field Operations Support',
    office: 'Dhaka Head Office',
    currentApprover: 'Procurement/Admin Manager',
    approvalLevel: '1 of 3',
    autoExtracted: true,
    technicalScoreAvg: 79,
    notifications: [
      {
        type: 'approval',
        message: 'Awaiting Procurement/Admin Manager review',
        time: '5 hours ago',
      },
    ],
  },
];
function formatBDT(amount) {
  if (amount >= 10000000) return `\u09F3${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `\u09F3${(amount / 100000).toFixed(2)} Lakh`;
  return `\u09F3${amount?.toLocaleString('en-IN')}`;
}
function getStatusInfo(status) {
  switch (status) {
    case 'draft':
      return { label: 'Draft', variant: 'secondary', icon: FileText };
    case 'pending_approval':
      return { label: 'Pending Approval', variant: 'warning', icon: Clock };
    case 'approved':
      return { label: 'Approved', variant: 'success', icon: CheckCircle2 };
    case 'rejected':
      return { label: 'Rejected', variant: 'destructive', icon: XCircle };
    case 'returned':
      return { label: 'Returned for Revision', variant: 'info', icon: RefreshCw };
    default:
      return { label: 'Unknown', variant: 'default', icon: AlertCircle };
  }
}
export function ComparativeStatementList() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [vendorSelectModal, setVendorSelectModal] = useState({
    open: false,
    statement: null,
    selectedVendorId: '',
  });
  const searchParams = useSearchParams();
  const isPendingMode = searchParams.get('mode') === 'pending';

  const { data: statementsData, loading } = useGetRequest(EP.comparative_statements);
  const statements = Array.isArray(statementsData)
    ? statementsData
    : (statementsData?.results ?? []);

  const filtered = statements.filter((cs) => {
    const normalizedStatus = (cs.status ?? '').toLowerCase();
    const q = searchInput.toLowerCase();
    if (isPendingMode) {
      if (normalizedStatus !== 'pending_approval') return false;
    } else if (normalizedStatus === 'pending_approval') {
      return false;
    }
    if (
      q &&
      !`${cs.cs_number ?? ''} ${cs.rfq_number ?? ''} ${cs.rfq_title ?? ''} ${cs.recommended_vendor?.name ?? ''}`
        .toLowerCase()
        .includes(q)
    )
      return false;
    if (statusFilter && normalizedStatus !== statusFilter.toLowerCase()) return false;
    if (categoryFilter && cs.category !== categoryFilter) return false;
    return true;
  });

  const pending = statements.filter(
    (cs) => (cs.status ?? '').toLowerCase() === 'pending_approval'
  ).length;
  const approved = statements.filter((cs) => (cs.status ?? '').toLowerCase() === 'approved').length;
  const totalSavings = statements
    .filter((cs) => cs.status === 'approved')
    .reduce((sum, cs) => sum + (Number(cs.potential_savings) || 0), 0);
  const totalVendors = statements.reduce((sum, cs) => sum + (Number(cs.vendors_evaluated) || 0), 0);

  const handleExportAll = () => {
    const headers = [
      'CS Number',
      'RFQ Number',
      'Title',
      'Status',
      'Category',
      'Estimated Value',
      'Lowest Bid',
      'Savings',
      'Vendors Evaluated',
      'Recommended Vendor',
      'Created By',
      'Created At',
    ];
    const csvRows = filtered.map((cs) => [
      cs.cs_number ?? '',
      cs.rfq_number ?? '',
      cs.rfq_title ?? '',
      cs.status ?? '',
      cs.category ?? '',
      cs.total_estimated_value ?? '',
      cs.lowest_bid ?? '',
      cs.potential_savings ?? '',
      cs.vendors_evaluated ?? '',
      cs.recommended_vendor?.name ?? '',
      cs.created_by_name ?? '',
      cs.created_at ?? '',
    ]);
    const csv = [headers, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comparative-statements.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported successfully');
  };

  const openVendorSelectionModal = (cs) => {
    const vendors = Array.isArray(cs?.vendors) ? cs.vendors : [];
    const sortedVendors = [...vendors].sort(
      (a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0)
    );
    const topVendorId = sortedVendors[0]?.vendor_id ?? sortedVendors[0]?.id ?? '';
    setVendorSelectModal({
      open: true,
      statement: cs,
      selectedVendorId: String(topVendorId || ''),
    });
  };

  const closeVendorSelectionModal = () => {
    setVendorSelectModal({
      open: false,
      statement: null,
      selectedVendorId: '',
    });
  };

  const proceedToApproval = () => {
    if (!vendorSelectModal.selectedVendorId) {
      toast.warning('Please select a vendor to continue.');
      return;
    }

    const statementId = vendorSelectModal.statement?.id;
    if (!statementId) {
      toast.error('Unable to open approval screen for this statement.');
      return;
    }

    router.push(
      `${paths.dashboard.procurement.comparative.approval(statementId)}?selectedVendor=${encodeURIComponent(vendorSelectModal.selectedVendorId)}`
    );
    closeVendorSelectionModal();
  };

  if (loading) return <PageLoader message="Loading comparative statements..." />;
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-1">
              {isPendingMode ? 'Pending Comparative Approvals' : 'Comparative Statements (CS)'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isPendingMode
                ? 'Comparative statements currently awaiting approval action.'
                : 'Auto-generated CS from vendor financial proposals — AAB Standard Format'}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleExportAll}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export All
            </Button>
          </div>
        </div>

        {/* Auto-Extraction Banner */}
        <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Automated CS Generation Active</p>
            <p className="text-xs text-muted-foreground">
              Financial proposal data is auto-extracted from vendor submissions. Technical
              scorecards are populated from evaluation forms. CS is auto-generated in AAB standard
              format.
            </p>
          </div>
          <Badge variant="success" size="sm">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            System Active
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pending Approval</p>
                  <p className="text-xl font-semibold text-foreground">{pending}</p>
                  <p className="text-[10px] text-warning mt-0.5">Requires action</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-warning" />
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Approved</p>
                  <p className="text-xl font-semibold text-foreground">{approved}</p>
                  <p className="text-[10px] text-success mt-0.5">Ready for award</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Savings</p>
                  <p className="text-xl font-semibold text-success">{formatBDT(totalSavings)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">From approved CS</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-success" />
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Vendors Evaluated</p>
                  <p className="text-xl font-semibold text-foreground">{totalVendors}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Across all CS</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="col-span-2 md:col-span-1">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Avg. Technical Score</p>
                  <p className="text-xl font-semibold text-foreground">
                    83<span className="text-sm font-normal text-muted-foreground">/100</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Recommended vendors</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by CS number, RFQ, vendor, or title..."
                    className="pl-10"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
              </div>
              <select
                className="text-sm border border-input rounded-lg px-3 py-2.5 bg-card"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="returned">Returned</option>
              </select>
              <select
                className="text-sm border border-input rounded-lg px-3 py-2.5 bg-card"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                <option>IT Equipment</option>
                <option>Office Furniture</option>
                <option>Solar &amp; Renewable Energy</option>
                <option>Medical &amp; Health Supplies</option>
                <option>Printing &amp; Publications</option>
                <option>Transport &amp; Logistics</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                More
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* CS List */}
        <Card>
          <CardHeader
            title={isPendingMode ? 'Pending Approvals' : 'CS List'}
            description={
              isPendingMode
                ? `Showing ${filtered.length} comparative statements awaiting approval.`
                : `Showing ${filtered.length} comparative statements outside the approval queue.`
            }
          />
          <CardBody>
            <div className="space-y-4">
              {filtered.map((cs) => {
                const statusInfo = getStatusInfo(cs.status);
                const StatusIcon = statusInfo.icon;
                return (
                  <div
                    key={cs.id}
                    className="border border-border rounded-lg p-5 hover:border-primary/50 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h3 className="text-sm font-semibold text-foreground">{cs.rfq_title}</h3>
                          <Badge variant={statusInfo.variant} size="sm">
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                          {cs.auto_extracted && (
                            <Badge variant="primary" size="sm">
                              <Zap className="w-3 h-3 mr-1" />
                              Auto-Extracted
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{cs.description}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {cs.cs_number}
                          </span>
                          <span className="hidden sm:inline text-border">|</span>
                          <span>RFQ: {cs.rfq_number}</span>
                          <span className="hidden sm:inline text-border">|</span>
                          <span>{cs.category}</span>
                          <span className="hidden sm:inline text-border">|</span>
                          <span className="hidden md:inline">{cs.office_info?.name}</span>
                          <span className="hidden md:inline text-border">|</span>
                          <span className="hidden md:inline">Budget: {cs.budget_code}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={paths.dashboard.procurement.comparative.detail(cs.id)}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                        </Link>
                        {cs.can_approve && (
                          <Button size="sm" onClick={() => openVendorSelectionModal(cs)}>
                            Review &amp; Approve
                          </Button>
                        )}
                        {cs.status === 'approved' && (
                          <Link
                            href={paths.dashboard.procurement.comparative.print(cs.id)}
                            target="_blank"
                          >
                            <Button variant="outline" size="sm">
                              <Printer className="w-3.5 h-3.5 mr-1" />
                              Print
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-3 border-t border-border">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Estimated Value</p>
                        <p className="text-sm font-semibold">
                          {formatBDT(cs.total_estimated_value)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Lowest Bid</p>
                        <p className="text-sm font-semibold text-success">
                          {formatBDT(cs.lowest_bid)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Savings</p>
                        {cs.potential_savings ? (
                          <p className="text-sm font-semibold text-success">
                            {formatBDT(cs.potential_savings)}
                            <span className="text-xs">({cs.savings_percent}%)</span>
                          </p>
                        ) : (
                          <span className="text-xs">No vendor Recommended</span>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Vendors</p>
                        <p className="text-sm font-semibold">{cs.vendors_evaluated} Compared</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Technical Score</p>
                        <p className="text-sm font-semibold">
                          {(cs.technical_score_avg ?? 0) > 0 ? (
                            <span
                              className={
                                (cs.technical_score_avg ?? 0) >= 80
                                  ? 'text-success'
                                  : (cs.technical_score_avg ?? 0) >= 60
                                    ? 'text-warning'
                                    : 'text-destructive'
                              }
                            >
                              {cs.technical_score_avg}/100
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Pending</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Recommended</p>
                        <p className="text-sm font-semibold truncate">
                          {cs.recommended_vendor?.name ?? '\u2014'}
                        </p>
                      </div>
                    </div>

                    {/* Approval + Notifications */}
                    {cs.approval_matrix?.length > 0 && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-border">
                        <div className="flex items-center gap-4 text-xs">
                          {cs.status === 'pending_approval' && (
                            <>
                              <span className="text-muted-foreground">
                                Approval: Level{' '}
                                {(cs.approval_matrix?.findIndex((a) => a.status === 'pending') ??
                                  -1) + 1}{' '}
                                of {cs.approval_matrix?.length}
                              </span>
                              <span className="text-border">|</span>
                              <span className="text-warning font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Awaiting:{' '}
                                {cs.approval_matrix?.find((a) => a.status === 'pending')?.role}
                              </span>
                            </>
                          )}
                          {cs.status === 'approved' && (
                            <span className="text-success font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved by{' '}
                              {
                                cs.approval_matrix
                                  ?.filter((a) => a.status === 'approved')
                                  ?.slice(-1)[0]?.name
                              }{' '}
                              on{' '}
                              {
                                cs.approval_matrix
                                  ?.filter((a) => a.status === 'approved')
                                  ?.slice(-1)[0]?.date
                              }
                            </span>
                          )}
                          {cs.status === 'returned' && (
                            <span className="text-blue-600 font-medium flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" />
                              Returned by{' '}
                              {cs.approval_matrix?.find((a) => a.status === 'returned')?.name}:{' '}
                              {cs.approval_matrix?.find((a) => a.status === 'returned')?.remarks}
                            </span>
                          )}
                        </div>
                        {cs.notification_log?.length > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-orange-600">
                            <Bell className="w-3 h-3" />
                            <span>{cs.notification_log?.[0]?.event}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span>Created by {cs.created_by_name}</span>
                      <span>&bull;</span>
                      <span>{cs.created_at}</span>
                      <span>&bull;</span>
                      <span>Project: {cs.project}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Modal
          isOpen={vendorSelectModal.open}
          onClose={closeVendorSelectionModal}
          size="md"
          title="Select Vendor For Approval"
          description={
            vendorSelectModal.statement
              ? `${vendorSelectModal.statement.cs_number} - ${vendorSelectModal.statement.rfq_title}`
              : 'Select a vendor from this comparative statement before approval.'
          }
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={closeVendorSelectionModal}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={proceedToApproval}
                disabled={!vendorSelectModal.selectedVendorId}
              >
                Continue To Review
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            {(vendorSelectModal.statement?.vendors ?? []).length === 0 ? (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
                No vendors found in this comparative statement. Please open the full CS and ensure
                vendor proposals are available.
              </div>
            ) : (
              [...(vendorSelectModal.statement?.vendors ?? [])]
                .sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0))
                .map((vendor, idx) => {
                  const vendorId = String(vendor.vendor_id ?? vendor.id);
                  const isSelected = vendorSelectModal.selectedVendorId === vendorId;
                  const isRecommended = Boolean(vendor.is_recommended);
                  const grandTotal = vendor.financial_proposal?.grand_total;

                  return (
                    <label
                      key={vendorId}
                      className={`block cursor-pointer rounded-lg border p-3 transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="selected-vendor"
                          className="mt-1"
                          checked={isSelected}
                          onChange={() =>
                            setVendorSelectModal((prev) => ({
                              ...prev,
                              selectedVendorId: vendorId,
                            }))
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{vendor.name}</p>
                            {isRecommended && (
                              <Badge variant="success" size="sm">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>Overall Score: {vendor.overall_score ?? '—'}</span>
                            <span>Total: {grandTotal ? formatBDT(grandTotal) : 'N/A'}</span>
                            <span>Rank #{idx + 1}</span>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
