'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Zap,
  Eye,
  Bell,
  Send,
  Star,
  Award,
  Clock,
  Users,
  Printer,
  Download,
  FileText,
  ArrowLeft,
  Building2,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Tabs } from '../../components/ui/tabs';
import { PageLoader } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
// Helper
function formatBDT(amount) {
  if (amount >= 10000000) return `৳${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(2)} Lakh`;
  return `৳${amount?.toLocaleString('en-IN')}`;
}
// Mock CS detail — BD data, linked to existing vendors
const mockCSDetail = {
  id: 'CS-2026-001',
  rfqNumber: 'RFQ-2026-015',
  title: 'IT Equipment & Computer Hardware for Dhaka Head Office',
  description:
    'Desktop computers, laptops, printers & networking equipment for Dhaka Head Office Digital Infrastructure Upgrade project.',
  status: 'pending_approval',
  createdDate: '2026-03-20',
  createdBy: 'Fatema Khatun',
  category: 'IT Equipment',
  budgetCode: 'BD-ICT-2026-01',
  project: 'Digital Infrastructure Upgrade',
  office: 'Dhaka Head Office',
  autoExtracted: true,
  extractionDate: '2026-03-19',
  extractionSource: 'RFQ-2026-015 Vendor Financial Proposals (5 submissions)',
  // Approval workflow per TOR
  approvalWorkflow: [
    {
      level: 1,
      role: 'Procurement/Admin Manager',
      name: 'Md. Kamal Hossain',
      status: 'approved',
      date: '2026-03-21',
      remarks: 'Recommended. Technical scores verified.',
    },
    {
      level: 2,
      role: 'Procurement Committee',
      name: 'Committee (4 members)',
      status: 'pending',
      date: null,
      remarks: null,
    },
    {
      level: 3,
      role: 'Final Approver (Authority Matrix)',
      name: 'Country Director',
      status: 'not_started',
      date: null,
      remarks: null,
    },
  ],
  // Line items
  items: [
    { id: 1, name: 'Desktop Computer (Core i7, 16GB RAM, 512GB SSD)', unit: 'Pcs', qty: 20 },
    { id: 2, name: 'Laptop (Core i5, 8GB RAM, 256GB SSD)', unit: 'Pcs', qty: 10 },
    { id: 3, name: 'Laser Printer (Network, Duplex)', unit: 'Pcs', qty: 5 },
    { id: 4, name: 'UPS (1000VA Online)', unit: 'Pcs', qty: 25 },
    { id: 5, name: 'Network Switch (24-Port Managed)', unit: 'Pcs', qty: 4 },
  ],
  // Vendors (BD names linked to existing vendor list)
  vendors: [
    {
      id: 'V001',
      name: 'TechBD Solutions Ltd',
      tin: '123456789012',
      location: 'Mohakhali, Dhaka',
      isRecommended: true,
      enlistedSince: '2024-06-15',
      pastOrders: 8,
      deliveryRating: 4.5,
      // Technical Scorecard per TOR
      technicalScore: {
        total: 88,
        criteria: [
          { name: 'Product Specification Compliance', maxScore: 30, score: 27, weight: 30 },
          { name: 'Brand & Warranty (OEM Authorized)', maxScore: 20, score: 18, weight: 20 },
          { name: 'After-Sales Service & Support', maxScore: 15, score: 14, weight: 15 },
          { name: 'Delivery Timeline Commitment', maxScore: 15, score: 13, weight: 15 },
          { name: 'Past Performance & Track Record', maxScore: 10, score: 9, weight: 10 },
          { name: 'Financial Capacity & Stability', maxScore: 10, score: 7, weight: 10 },
        ],
      },
      // Financial proposal (auto-extracted)
      financialProposal: {
        items: [
          { itemId: 1, unitPrice: 62000, totalPrice: 1240000 },
          { itemId: 2, unitPrice: 55000, totalPrice: 550000 },
          { itemId: 3, unitPrice: 28000, totalPrice: 140000 },
          { itemId: 4, unitPrice: 8500, totalPrice: 212500 },
          { itemId: 5, unitPrice: 22000, totalPrice: 88000 },
        ],
        subtotal: 2230500,
        vat: 334575, // 15% VAT
        ait: 78068, // 3.5% AIT
        delivery: 15000,
        grandTotal: 2658143,
      },
    },
    {
      id: 'V002',
      name: 'Star Electronics BD',
      tin: '234567890123',
      location: 'Elephant Road, Dhaka',
      isRecommended: false,
      enlistedSince: '2023-11-20',
      pastOrders: 5,
      deliveryRating: 4.0,
      technicalScore: {
        total: 76,
        criteria: [
          { name: 'Product Specification Compliance', maxScore: 30, score: 23, weight: 30 },
          { name: 'Brand & Warranty (OEM Authorized)', maxScore: 20, score: 15, weight: 20 },
          { name: 'After-Sales Service & Support', maxScore: 15, score: 12, weight: 15 },
          { name: 'Delivery Timeline Commitment', maxScore: 15, score: 11, weight: 15 },
          { name: 'Past Performance & Track Record', maxScore: 10, score: 8, weight: 10 },
          { name: 'Financial Capacity & Stability', maxScore: 10, score: 7, weight: 10 },
        ],
      },
      financialProposal: {
        items: [
          { itemId: 1, unitPrice: 58000, totalPrice: 1160000 },
          { itemId: 2, unitPrice: 52000, totalPrice: 520000 },
          { itemId: 3, unitPrice: 25000, totalPrice: 125000 },
          { itemId: 4, unitPrice: 7800, totalPrice: 195000 },
          { itemId: 5, unitPrice: 20000, totalPrice: 80000 },
        ],
        subtotal: 2080000,
        vat: 312000,
        ait: 72800,
        delivery: 12000,
        grandTotal: 2476800,
      },
    },
    {
      id: 'V003',
      name: 'Greenfield IT Solutions',
      tin: '345678901234',
      location: 'Banani, Dhaka',
      isRecommended: false,
      enlistedSince: '2025-01-10',
      pastOrders: 2,
      deliveryRating: 3.8,
      technicalScore: {
        total: 82,
        criteria: [
          { name: 'Product Specification Compliance', maxScore: 30, score: 25, weight: 30 },
          { name: 'Brand & Warranty (OEM Authorized)', maxScore: 20, score: 17, weight: 20 },
          { name: 'After-Sales Service & Support', maxScore: 15, score: 13, weight: 15 },
          { name: 'Delivery Timeline Commitment', maxScore: 15, score: 12, weight: 15 },
          { name: 'Past Performance & Track Record', maxScore: 10, score: 8, weight: 10 },
          { name: 'Financial Capacity & Stability', maxScore: 10, score: 7, weight: 10 },
        ],
      },
      financialProposal: {
        items: [
          { itemId: 1, unitPrice: 64000, totalPrice: 1280000 },
          { itemId: 2, unitPrice: 56000, totalPrice: 560000 },
          { itemId: 3, unitPrice: 30000, totalPrice: 150000 },
          { itemId: 4, unitPrice: 9000, totalPrice: 225000 },
          { itemId: 5, unitPrice: 24000, totalPrice: 96000 },
        ],
        subtotal: 2311000,
        vat: 346650,
        ait: 80885,
        delivery: 18000,
        grandTotal: 2756535,
      },
    },
    {
      id: 'V004',
      name: 'DataCom Technologies Ltd',
      tin: '456789012345',
      location: 'Gulshan, Dhaka',
      isRecommended: false,
      enlistedSince: '2024-03-22',
      pastOrders: 3,
      deliveryRating: 4.2,
      technicalScore: {
        total: 71,
        criteria: [
          { name: 'Product Specification Compliance', maxScore: 30, score: 21, weight: 30 },
          { name: 'Brand & Warranty (OEM Authorized)', maxScore: 20, score: 14, weight: 20 },
          { name: 'After-Sales Service & Support', maxScore: 15, score: 11, weight: 15 },
          { name: 'Delivery Timeline Commitment', maxScore: 15, score: 12, weight: 15 },
          { name: 'Past Performance & Track Record', maxScore: 10, score: 7, weight: 10 },
          { name: 'Financial Capacity & Stability', maxScore: 10, score: 6, weight: 10 },
        ],
      },
      financialProposal: {
        items: [
          { itemId: 1, unitPrice: 59000, totalPrice: 1180000 },
          { itemId: 2, unitPrice: 51000, totalPrice: 510000 },
          { itemId: 3, unitPrice: 26000, totalPrice: 130000 },
          { itemId: 4, unitPrice: 8000, totalPrice: 200000 },
          { itemId: 5, unitPrice: 21000, totalPrice: 84000 },
        ],
        subtotal: 2104000,
        vat: 315600,
        ait: 73640,
        delivery: 14000,
        grandTotal: 2507240,
      },
    },
    {
      id: 'V005',
      name: 'Navana Computing',
      tin: '567890123456',
      location: 'Motijheel, Dhaka',
      isRecommended: false,
      enlistedSince: '2023-08-05',
      pastOrders: 6,
      deliveryRating: 4.3,
      technicalScore: {
        total: 84,
        criteria: [
          { name: 'Product Specification Compliance', maxScore: 30, score: 26, weight: 30 },
          { name: 'Brand & Warranty (OEM Authorized)', maxScore: 20, score: 17, weight: 20 },
          { name: 'After-Sales Service & Support', maxScore: 15, score: 13, weight: 15 },
          { name: 'Delivery Timeline Commitment', maxScore: 15, score: 13, weight: 15 },
          { name: 'Past Performance & Track Record', maxScore: 10, score: 8, weight: 10 },
          { name: 'Financial Capacity & Stability', maxScore: 10, score: 7, weight: 10 },
        ],
      },

      financialProposal: {
        items: [
          { itemId: 1, unitPrice: 63000, totalPrice: 1260000 },
          { itemId: 2, unitPrice: 54000, totalPrice: 540000 },
          { itemId: 3, unitPrice: 29000, totalPrice: 145000 },
          { itemId: 4, unitPrice: 8800, totalPrice: 220000 },
          { itemId: 5, unitPrice: 23000, totalPrice: 92000 },
        ],
        subtotal: 2257000,
        vat: 338550,
        ait: 78995,
        delivery: 16000,
        grandTotal: 2690545,
      },
    },
  ],
  // Notes / Discussion
  notes: [
    {
      id: 1,
      author: 'Fatema Khatun',
      role: 'Procurement Officer',
      date: '2026-03-20',
      text: 'CS auto-generated from 5 vendor financial proposals received against RFQ-2026-015. Technical evaluations completed by IT Unit.',
    },
    {
      id: 2,
      author: 'Md. Kamal Hossain',
      role: 'Procurement/Admin Manager',
      date: '2026-03-21',
      text: 'Reviewed technical scores and financial proposals. TechBD Solutions Ltd offers best value considering technical compliance (88/100) and comprehensive warranty package. Approved at Level 1.',
    },
  ],
  // Notification log per TOR
  notificationLog: [
    {
      date: '2026-03-20 09:15',
      event: 'CS Auto-Generated',
      recipients: 'Fatema Khatun',
      channel: 'System + Email',
    },
    {
      date: '2026-03-20 09:16',
      event: 'Submitted for Level 1 Approval',
      recipients: 'Md. Kamal Hossain (Procurement/Admin Manager)',
      channel: 'Email + Dashboard',
    },
    {
      date: '2026-03-21 14:30',
      event: 'Level 1 Approved — Forwarded to Level 2',
      recipients: 'Procurement Committee (4 members)',
      channel: 'Email + SMS',
    },
  ],
};
function getStatusColor(status) {
  switch (status) {
    case 'approved':
      return 'text-success';
    case 'pending':
      return 'text-warning';
    case 'not_started':
      return 'text-muted-foreground';
    case 'rejected':
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
}
function getStatusBadge(status) {
  switch (status) {
    case 'approved':
      return (
        <Badge variant="success" size="sm">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="warning" size="sm">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case 'not_started':
      return (
        <Badge variant="secondary" size="sm">
          Not Started
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive" size="sm">
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" size="sm">
          {status}
        </Badge>
      );
  }
}

function getVendorKey(vendor) {
  return vendor?.vendor_id ?? vendor?.id;
}

function getFinancialItemId(financialItem) {
  return financialItem?.item_id ?? financialItem?.itemId;
}

function getUnitPrice(financialItem) {
  return financialItem?.unit_price ?? financialItem?.unitPrice;
}

function getTotalPrice(financialItem) {
  return financialItem?.total_price ?? financialItem?.totalPrice;
}

function normalizeName(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function findVendorFinancialItem(vendor, item) {
  const financialItems = vendor?.financial_proposal?.items ?? [];
  const normalizedItemId = String(item?.id ?? '');

  const byId = financialItems.find(
    (financialItem) => String(getFinancialItemId(financialItem)) === normalizedItemId
  );
  if (byId) return byId;

  const normalizedItemName = normalizeName(item?.name);
  if (!normalizedItemName) return undefined;

  return financialItems.find(
    (financialItem) => normalizeName(financialItem?.item_name) === normalizedItemName
  );
}

function TechnicalScorecardTab({ cs, isRec }) {
  const vendors = cs?.vendors ?? [];
  const requiredDocs = cs?.required_documents ?? [];
  const sortedVendors = [...vendors].sort(
    (a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0)
  );

  const scoreColor = (s) =>
    (s ?? 0) >= 75 ? 'text-success' : (s ?? 0) >= 50 ? 'text-warning' : 'text-destructive';

  return (
    <div className="space-y-6">
      {/* ── All Vendors Grid (like Financial Proposals) ─────────── */}
      <Card>
        <CardHeader
          title="Technical Scorecard — All Vendors"
          description={`Sorted by Overall Score (highest first) • ${sortedVendors.length} vendor(s) • ${requiredDocs.length} required document(s)`}
        />
        <CardBody>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sortedVendors.map((v, idx) => {
              const vDocs = v.technical_docs ?? {};
              const vUploaded = Object.values(vDocs).filter((d) => d.uploaded).length;
              const vTotal = Object.keys(vDocs).length;
              return (
                <div
                  key={v.vendor_id}
                  className={`p-4 rounded-lg border ${
                    isRec(v) ? 'border-success/30 bg-success/5' : 'border-border'
                  }`}
                >
                  {/* Vendor header */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-xs font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      Rank #{idx + 1}
                    </span>
                    <h4 className="text-sm font-semibold">{v.name}</h4>
                    {isRec(v) && (
                      <Badge variant="success" size="sm">
                        <Star className="w-3 h-3 mr-1" />
                        Recommended
                      </Badge>
                    )}
                  </div>
                  {/* Overall Score */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-muted-foreground">Overall Score:</span>
                    <span className={`text-xl font-extrabold ${scoreColor(v.overall_score)}`}>
                      {v.overall_score ?? '—'}
                      <span className="text-xs font-normal text-muted-foreground">/100</span>
                    </span>
                  </div>
                  {/* Scores summary */}
                  <div className="flex gap-3 mb-3 text-xs bg-muted/30 rounded px-2 py-1.5">
                    <div>
                      <span className="text-muted-foreground">Doc:</span>{' '}
                      <span className="font-semibold">{v.doc_score ?? '—'}/100</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Financial:</span>{' '}
                      <span className="font-semibold">{v.financial_score ?? '—'}/100</span>
                    </div>
                    {vTotal > 0 && (
                      <div className="ml-auto">
                        <span className="text-muted-foreground">Docs:</span>{' '}
                        <span
                          className={`font-semibold ${
                            vUploaded === vTotal ? 'text-success' : 'text-warning'
                          }`}
                        >
                          {vUploaded}/{vTotal}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Document checklist */}
                  <div className="space-y-1">
                    {Object.entries(vDocs).map(([key, data]) => {
                      const uploaded = data.uploaded ?? data.score > 0;
                      const docLabel = data.doc_name || key.replace(/_/g, ' ');
                      return (
                        <div
                          key={key}
                          className={`flex items-center justify-between px-2 py-1.5 rounded border text-xs ${
                            uploaded
                              ? 'border-success/30 bg-success/5'
                              : 'border-destructive/30 bg-destructive/5'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {uploaded ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                            )}
                            <span className="capitalize">{docLabel}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={uploaded ? 'success' : 'destructive'} size="sm">
                              {uploaded ? 'Uploaded' : 'Missing'}
                            </Badge>
                            {uploaded && data.file_url && (
                              <>
                                <a
                                  href={data.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-primary hover:text-primary/80 font-medium"
                                  title="View document"
                                >
                                  <Eye className="w-3 h-3" />
                                  View
                                </a>
                                <a
                                  href={data.file_url}
                                  download
                                  className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground font-medium"
                                  title="Download document"
                                >
                                  <Download className="w-3 h-3" />
                                  Download
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(vDocs).length === 0 && (
                      <p className="text-xs text-muted-foreground italic px-1">No documents</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

    </div>
  );
}

export function ComparativeStatementDetail() {
  const { id } = useParams();
  const [noteText, setNoteText] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState(null);

  const { data: cs, loading } = useGetRequest(
    id ? endpoints.procurement_management.comparative_statement_by_id(id) : null
  );

  const canApprove = !!cs?.can_approve;

  useEffect(() => {
    if (!cs?.vendors?.length) return;
    // Auto-recommend: use saved recommendation if present, else pick highest overall_score
    if (cs?.recommended_vendor?.vendor_id != null) {
      setSelectedVendorId(cs.recommended_vendor.vendor_id);
    } else {
      const best = [...cs.vendors].sort(
        (a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0)
      )[0];
      if (best) setSelectedVendorId(getVendorKey(best));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cs?.vendors, cs?.recommended_vendor?.vendor_id]);

  if (loading) return <PageLoader message="Loading comparative statement..." />;
  if (!cs) return <p className="p-8 text-center text-muted-foreground">CS not found</p>;

  const lowestTotal =
    cs?.vendors?.length > 0
      ? Math.min(...cs.vendors.map((v) => v.financial_proposal?.grand_total ?? Infinity))
      : 0;

  const sortedVendors = [...(cs?.vendors ?? [])].sort(
    (a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0)
  );

  // The currently selected/recommended vendor object
  const recommended = cs?.vendors?.find(
    (v) => String(getVendorKey(v)) === String(selectedVendorId)
  ) ?? cs?.vendors?.find((v) => v.is_recommended);

  const isRec = (v) => String(getVendorKey(v)) === String(selectedVendorId);

  const handleSelectRecommended = async (v) => {
    const key = getVendorKey(v);
    setSelectedVendorId(key);
    try {
      await axiosInstance.patch(
        endpoints.procurement_management.comparative_statement_by_id(id),
        { action: 'set_recommended_vendor', vendor_id: key }
      );
    } catch {
      // non-blocking — selection already reflected in UI
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await axiosInstance.patch(endpoints.procurement_management.comparative_statement_by_id(id), {
        action: 'add_note',
        note: noteText,
      });
      setNoteText('');
      toast.success('Note added');
    } catch {
      toast.error('Failed to add note');
    }
  };

  const handleExportCsv = () => {
    const headers = ['Vendor', 'Location', 'TIN', 'Doc Score', 'Financial Score', 'Overall Score', 'Grand Total'];
    const rows = sortedVendors.map((v) => [
      v.name ?? '',
      v.location ?? '',
      v.tin ?? '',
      v.doc_score ?? '',
      v.financial_score ?? '',
      v.overall_score ?? '',
      v.financial_proposal?.grand_total ?? '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cs-${cs?.cs_number ?? id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported successfully');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="">
        {/* Breadcrumb & Header */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link
            href={paths.dashboard.procurement.comparative.list}
            className="hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to CS List
          </Link>
          <span>/</span>
          <span className="text-foreground">{cs?.cs_number}</span>
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl md:text-2xl font-semibold text-foreground">{cs?.rfq_title}</h1>
              <Badge
                variant={
                  cs?.status === 'approved'
                    ? 'success'
                    : cs?.status === 'returned'
                      ? 'destructive'
                      : 'warning'
                }
                size="sm"
              >
                <Clock className="w-3 h-3 mr-1" />
                {cs?.status === 'approved'
                  ? 'Approved'
                  : cs?.status === 'returned'
                    ? 'Returned'
                    : 'Pending Approval'}
              </Badge>
              {cs?.auto_extracted && (
                <Badge variant="primary" size="sm">
                  <Zap className="w-3 h-3 mr-1" />
                  Auto-Extracted
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{cs.description}</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {canApprove && (
              <Link
                href={`${paths.dashboard.procurement.comparative.approval(id)}?selectedVendor=${selectedVendorId ?? ''}`}
              >
                <Button size="sm">Review &amp; Approve</Button>
              </Link>
            )}
            <Link href={paths.dashboard.procurement.comparative.print(id)} target="_blank">
              <Button variant="outline" size="sm">
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print CS
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>

        {/* Auto-Extraction Info */}
        {cs?.auto_extracted && (
          <div className="mb-6 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3 text-sm">
            <Zap className="w-4 h-4 text-primary flex-shrink-0" />
            <div>
              <span className="font-medium">Data auto-extracted from: </span>
              <span className="text-muted-foreground">
                {cs?.extraction_source} on {cs?.extraction_date}
              </span>
            </div>
          </div>
        )}

        {/* Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">CS Number</p>
                  <p className="text-sm font-semibold">{cs?.cs_number}</p>
                  <p className="text-[10px] text-muted-foreground">RFQ: {cs?.rfq_number}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Vendors Compared</p>
                  <p className="text-sm font-semibold">{cs?.vendors?.length} Vendors</p>
                  <p className="text-[10px] text-muted-foreground">
                    {cs?.items?.length} line items each
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Lowest Bid</p>
                  <p className="text-sm font-semibold text-success">{formatBDT(lowestTotal)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {cs?.vendors?.find(
                      (v) => (v.financial_proposal?.grand_total ?? Infinity) === lowestTotal
                    )?.name ?? '\u2014'}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Award className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Recommended</p>
                  <p className="text-sm font-semibold">{recommended?.name ?? '—'}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Overall:{' '}
                    <span
                      className={
                        (recommended?.overall_score ?? 0) >= 75
                          ? 'text-success font-semibold'
                          : (recommended?.overall_score ?? 0) >= 50
                            ? 'text-warning font-semibold'
                            : 'text-destructive font-semibold'
                      }
                    >
                      {recommended?.overall_score ?? '—'}/100
                    </span>
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Approval Workflow (TOR: 3 levels) */}
        <Card className="mb-6">
          <CardHeader
            title="Approval Workflow"
            description="Multi-stage approval as per AAB Authority Matrix"
          />
          <CardBody>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 overflow-x-auto">
              {(cs?.approval_matrix ?? []).map((step, i) => (
                <div key={step.level} className="flex items-center">
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      step.status === 'approved'
                        ? 'border-success/30 bg-success/5'
                        : step.status === 'pending'
                          ? 'border-warning/30 bg-warning/5'
                          : 'border-border bg-muted/30'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        step.status === 'approved'
                          ? 'bg-success text-white'
                          : step.status === 'pending'
                            ? 'bg-warning text-white'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {step.status === 'approved' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        step.level
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{step.role}</p>
                      <p className="text-[10px] text-muted-foreground">{step.name}</p>
                      {step.date && (
                        <p className="text-[10px] text-muted-foreground">{step.date}</p>
                      )}
                      {getStatusBadge(step.status)}
                    </div>
                  </div>
                  {i < (cs?.approval_matrix?.length ?? 0) - 1 && (
                    <div className="w-8 h-0.5 bg-border mx-1" />
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Tabs */}
        <Tabs
          tabs={[
            {
              id: 'comparison',
              label: 'Vendor Comparison',
              content: (
                <Card>
                  <CardHeader
                    title="Side-by-Side Vendor Comparison"
                    description="All amounts in BDT (\u09F3) \u2014 VAT 15% &amp; AIT 3.5% as per NBR"
                  />
                  <CardBody>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-3 font-semibold text-foreground w-64 sticky left-0 z-20 bg-card">
                              Item Name
                            </th>
                            <th className="text-center py-3 px-2 font-medium text-muted-foreground w-12 sticky left-64 z-20 bg-card border-r border-border/40">
                              Qty
                            </th>
                            {sortedVendors.map((v, idx) => (
                              <th
                                key={getVendorKey(v)}
                                onClick={() => handleSelectRecommended(v)}
                                className={`text-center py-3 px-3 font-semibold cursor-pointer select-none transition-all ${
                                  isRec(v)
                                    ? 'bg-success/10 text-success ring-2 ring-inset ring-success/40'
                                    : 'text-foreground hover:bg-muted/40'
                                }`}
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Rank #{idx + 1}</span>
                                  <span>{v.name}</span>
                                  {isRec(v) ? (
                                    <Badge variant="success" size="sm">
                                      <Star className="w-3 h-3 mr-1" />✓ Recommended
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      size="sm"
                                      className="text-muted-foreground"
                                    >
                                      Click to Select
                                    </Badge>
                                  )}
                                  <span className="text-[10px] text-muted-foreground font-normal">
                                    {v.location}
                                  </span>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(cs?.items ?? []).map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-border/50 hover:bg-muted/30"
                            >
                              <td className="py-2.5 px-3 sticky left-0 z-10 bg-card">
                                <p className="font-medium text-foreground">{item.name}</p>
                                <p className="text-[10px] text-muted-foreground">{item.unit}</p>
                              </td>
                              <td className="text-center py-2.5 px-2 text-muted-foreground sticky left-64 z-10 bg-card border-r border-border/40">
                                {item.qty}
                              </td>
                              {sortedVendors.map((v) => {
                                const fp = findVendorFinancialItem(v, item);
                                const unitPrice = getUnitPrice(fp);
                                const totalPrice = getTotalPrice(fp);
                                const isLowestForItem =
                                  unitPrice != null &&
                                  unitPrice ===
                                    Math.min(
                                      ...sortedVendors.map(
                                        (vv) =>
                                          getUnitPrice(findVendorFinancialItem(vv, item)) ??
                                          Infinity
                                      )
                                    );
                                return (
                                  <td
                                    key={getVendorKey(v)}
                                    onClick={() => handleSelectRecommended(v)}
                                    className={`text-center py-2.5 px-3 cursor-pointer transition-all ${isRec(v) ? 'bg-success/10' : 'hover:bg-muted/30'}`}
                                  >
                                    <p
                                      className={`font-medium ${isLowestForItem ? 'text-success' : 'text-foreground'}`}
                                    >
                                      {unitPrice != null ? formatBDT(unitPrice) : '—'}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {totalPrice != null ? formatBDT(totalPrice) : '—'}
                                    </p>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                          <tr className="border-t-2 border-border font-semibold">
                            <td className="py-2 px-3 sticky left-0 z-10 bg-card border-r border-border/40" colSpan={2}>
                              Subtotal
                            </td>
                            {sortedVendors.map((v) => (
                              <td
                                key={getVendorKey(v)}
                                onClick={() => handleSelectRecommended(v)}
                                className={`text-center py-2 px-3 cursor-pointer transition-all ${isRec(v) ? 'bg-success/10' : 'hover:bg-muted/30'}`}
                              >
                                {formatBDT(v.financial_proposal?.subtotal)}
                              </td>
                            ))}
                          </tr>
                          <tr className="text-muted-foreground">
                            <td className="py-1.5 px-3 sticky left-0 z-10 bg-card border-r border-border/40" colSpan={2}>
                              VAT (15%)
                            </td>
                            {sortedVendors.map((v) => (
                              <td
                                key={getVendorKey(v)}
                                onClick={() => handleSelectRecommended(v)}
                                className={`text-center py-1.5 px-3 cursor-pointer transition-all ${isRec(v) ? 'bg-success/10' : 'hover:bg-muted/30'}`}
                              >
                                {formatBDT(v.financial_proposal?.vat)}
                              </td>
                            ))}
                          </tr>
                          <tr className="text-muted-foreground">
                            <td className="py-1.5 px-3 sticky left-0 z-10 bg-card border-r border-border/40" colSpan={2}>
                              AIT (3.5%)
                            </td>
                            {sortedVendors.map((v) => (
                              <td
                                key={getVendorKey(v)}
                                onClick={() => handleSelectRecommended(v)}
                                className={`text-center py-1.5 px-3 cursor-pointer transition-all ${isRec(v) ? 'bg-success/10' : 'hover:bg-muted/30'}`}
                              >
                                {formatBDT(v.financial_proposal?.ait)}
                              </td>
                            ))}
                          </tr>
                          <tr className="text-muted-foreground">
                            <td className="py-1.5 px-3 sticky left-0 z-10 bg-card border-r border-border/40" colSpan={2}>
                              Delivery Charge
                            </td>
                            {sortedVendors.map((v) => (
                              <td
                                key={getVendorKey(v)}
                                onClick={() => handleSelectRecommended(v)}
                                className={`text-center py-1.5 px-3 cursor-pointer transition-all ${isRec(v) ? 'bg-success/10' : 'hover:bg-muted/30'}`}
                              >
                                {formatBDT(v.financial_proposal?.delivery)}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-t-2 border-border font-bold text-base">
                            <td className="py-3 px-3 sticky left-0 z-10 bg-card border-r border-border/40" colSpan={2}>
                              Grand Total
                            </td>
                            {sortedVendors.map((v) => {
                              const isLowest =
                                (v.financial_proposal?.grand_total ?? Infinity) === lowestTotal;
                              return (
                                <td
                                  key={getVendorKey(v)}
                                  onClick={() => handleSelectRecommended(v)}
                                  className={`text-center py-3 px-3 cursor-pointer transition-all font-bold ${
                                    isRec(v)
                                      ? 'bg-success/10 text-success'
                                      : isLowest
                                        ? 'text-success hover:bg-muted/30'
                                        : 'hover:bg-muted/30'
                                  }`}
                                >
                                  {formatBDT(v.financial_proposal?.grand_total)}
                                  {isLowest && !isRec(v) && (
                                    <span className="block text-[10px] font-normal">Lowest</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                          {/* Doc score row */}
                          <tr className="bg-muted/20 text-muted-foreground text-xs">
                            <td className="py-1.5 px-3 sticky left-0 z-10 bg-card border-r border-border/40" colSpan={2}>
                              ↳ Doc Score (50%)
                            </td>
                            {sortedVendors.map((v) => (
                              <td
                                key={getVendorKey(v)}
                                onClick={() => handleSelectRecommended(v)}
                                className={`text-center py-1.5 px-3 cursor-pointer transition-all ${isRec(v) ? 'bg-success/10' : 'hover:bg-muted/30'}`}
                              >
                                {v.doc_score ?? '—'}
                              </td>
                            ))}
                          </tr>
                          {/* Financial score row */}
                          <tr className="bg-muted/20 text-muted-foreground text-xs">
                            <td className="py-1.5 px-3 sticky left-0 z-10 bg-card border-r border-border/40" colSpan={2}>
                              ↳ Financial Score (50%)
                            </td>
                            {sortedVendors.map((v) => (
                              <td
                                key={getVendorKey(v)}
                                onClick={() => handleSelectRecommended(v)}
                                className={`text-center py-1.5 px-3 cursor-pointer transition-all ${isRec(v) ? 'bg-success/10' : 'hover:bg-muted/30'}`}
                              >
                                {v.financial_score ?? '—'}
                              </td>
                            ))}
                          </tr>
                          {/* Overall score row */}
                          <tr className="bg-primary/5 border-t-2 border-primary/20">
                            <td className="py-2.5 px-3 font-bold text-foreground sticky left-0 z-10 bg-card border-r border-border/40" colSpan={2}>
                              <div>Overall Score</div>
                              <div className="text-[10px] font-normal text-muted-foreground">
                                Documents (50%) + Financial (50%)
                              </div>
                            </td>
                            {sortedVendors.map((v) => (
                              <td
                                key={getVendorKey(v)}
                                onClick={() => handleSelectRecommended(v)}
                                className={`text-center py-2.5 px-3 cursor-pointer transition-all ${
                                  isRec(v) ? 'bg-success/10' : 'hover:bg-muted/30'
                                }`}
                              >
                                <span
                                  className={`text-base font-extrabold ${
                                    (v.overall_score ?? 0) >= 75
                                      ? 'text-success'
                                      : (v.overall_score ?? 0) >= 50
                                        ? 'text-warning'
                                        : 'text-destructive'
                                  }`}
                                >
                                  {v.overall_score ?? '—'}
                                </span>
                                <span className="text-xs font-normal text-muted-foreground">/100</span>
                                {isRec(v) && (
                                  <div className="mt-1">
                                    <Badge variant="success" size="sm">
                                      <Star className="w-3 h-3 mr-0.5" /> Recommended
                                    </Badge>
                                  </div>
                                )}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardBody>
                </Card>
              ),
            },
            {
              id: 'technical',
              label: 'Technical Scorecard',
              content: <TechnicalScorecardTab cs={cs} isRec={isRec} />,
            },
            {
              id: 'financial',
              label: 'Financial Proposals',
              content: (
                <Card>
                  <CardHeader
                    title="Financial Proposal Details"
                    description="Auto-extracted from vendor submissions. All amounts in BDT (\u09F3)."
                  />
                  <CardBody>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {sortedVendors.map((v, idx) => (
                        <div
                          key={v.id}
                          className={`p-4 rounded-lg border ${
                            isRec(v) ? 'border-success/30 bg-success/5' : 'border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">Rank #{idx + 1}</span>
                              <h4 className="text-sm font-semibold">{v.name}</h4>
                              {isRec(v) && (
                                <Badge variant="success" size="sm">
                                  <Star className="w-3 h-3 mr-1" />
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            {cs?.auto_extracted && (
                              <Badge variant="primary" size="sm">
                                <Zap className="w-3 h-3 mr-1" />
                                Auto-Extracted
                              </Badge>
                            )}
                          </div>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-1.5 font-medium text-muted-foreground">
                                  Item
                                </th>
                                <th className="text-right py-1.5 font-medium text-muted-foreground">
                                  Unit Price
                                </th>
                                <th className="text-right py-1.5 font-medium text-muted-foreground">
                                  Total
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {(v.financial_proposal?.items ?? []).map((fi) => {
                                const item = cs?.items?.find((it) => it.id === fi.item_id);
                                return (
                                  <tr key={fi.item_id} className="border-b border-border/30">
                                    <td className="py-1.5">{item?.name}</td>
                                    <td className="text-right py-1.5">
                                      {formatBDT(fi.unit_price)}
                                    </td>
                                    <td className="text-right py-1.5 font-medium">
                                      {formatBDT(fi.total_price)}
                                    </td>
                                  </tr>
                                );
                              })}
                              <tr className="font-semibold border-t border-border">
                                <td className="py-1.5">Subtotal</td>
                                <td></td>
                                <td className="text-right py-1.5">
                                  {formatBDT(v.financial_proposal?.subtotal)}
                                </td>
                              </tr>
                              <tr className="text-muted-foreground">
                                <td className="py-1">VAT (15%)</td>
                                <td></td>
                                <td className="text-right py-1">
                                  {formatBDT(v.financial_proposal?.vat)}
                                </td>
                              </tr>
                              <tr className="text-muted-foreground">
                                <td className="py-1">AIT (3.5%)</td>
                                <td></td>
                                <td className="text-right py-1">
                                  {formatBDT(v.financial_proposal?.ait)}
                                </td>
                              </tr>
                              <tr className="text-muted-foreground">
                                <td className="py-1">Delivery</td>
                                <td></td>
                                <td className="text-right py-1">
                                  {formatBDT(v.financial_proposal?.delivery)}
                                </td>
                              </tr>
                              <tr className="font-bold border-t-2 border-border text-base">
                                <td className="py-2">Grand Total</td>
                                <td></td>
                                <td className="text-right py-2">
                                  {formatBDT(v.financial_proposal?.grand_total)}
                                </td>
                              </tr>
                              <tr className="border-t border-border/50 bg-muted/20 text-muted-foreground">
                                <td className="py-1.5 text-xs" colSpan={2}>
                                  Document Score <span className="opacity-60">(50%)</span>
                                </td>
                                <td className="text-right py-1.5 font-semibold text-foreground">
                                  {v.doc_score != null ? `${v.doc_score}/100` : '—'}
                                </td>
                              </tr>
                              <tr className="bg-muted/20 text-muted-foreground">
                                <td className="py-1.5 text-xs" colSpan={2}>
                                  Financial Score <span className="opacity-60">(50%)</span>
                                </td>
                                <td className="text-right py-1.5 font-semibold text-foreground">
                                  {v.financial_score != null ? `${v.financial_score}/100` : '—'}
                                </td>
                              </tr>
                              <tr className="bg-primary/5">
                                <td className="py-2 text-xs font-bold text-foreground" colSpan={2}>
                                  Overall Score
                                  <span className="block text-[10px] font-normal text-muted-foreground">
                                    Doc (50%) + Financial (50%)
                                  </span>
                                </td>
                                <td className="text-right py-2">
                                  <span
                                    className={`text-sm font-extrabold ${
                                      (v.overall_score ?? 0) >= 75
                                        ? 'text-success'
                                        : (v.overall_score ?? 0) >= 50
                                          ? 'text-warning'
                                          : 'text-destructive'
                                    }`}
                                  >
                                    {v.overall_score != null ? v.overall_score : '—'}
                                  </span>
                                  {v.overall_score != null && (
                                    <span className="text-[10px] text-muted-foreground font-normal">
                                      /100
                                    </span>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              ),
            },
            {
              id: 'notes',
              label: 'Notes & Discussion',
              content: (
                <Card>
                  <CardHeader
                    title="Notes &amp; Discussion"
                    description="Internal notes and remarks for this CS"
                  />
                  <CardBody>
                    <div className="space-y-4 mb-6">
                      {(cs?.notes ?? []).map((note) => (
                        <div
                          key={note.id}
                          className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <MessageSquare className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold">{note.author}</span>
                              <Badge variant="secondary" size="sm">
                                {note.role}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">{note.date}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{note.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <textarea
                        className="flex-1 min-h-[80px] p-3 border border-input rounded-lg text-sm bg-card resize-none"
                        placeholder="Add a note or remark..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                      />
                      <Button size="sm" className="self-end" onClick={handleAddNote}>
                        <Send className="w-3.5 h-3.5 mr-1" />
                        Send
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ),
            },
            {
              id: 'notifications',
              label: 'Notification Log',
              content: (
                <Card>
                  <CardHeader
                    title="Notification Log"
                    description="All notifications triggered at each approval stage"
                  />
                  <CardBody>
                    <div className="space-y-3">
                      {(cs?.notification_log ?? []).map((n, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/20"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                            <Bell className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-foreground">{n.event}</p>
                              <span className="text-[10px] text-muted-foreground">{n.date}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">To: {n.recipients}</p>
                            <Badge variant="secondary" size="sm">
                              {n.channel}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              ),
            },
          ]}
          defaultTab="comparison"
        />
      </div>
    </div>
  );
}
