'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  Lock,
  Star,
  Unlock,
  XCircle,
  Download,
  FileText,
  ArrowLeft,
  DollarSign,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { PageLoader } from '../../components/ui/loading';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

export function SubmissionMonitoring() {
  const router = useRouter();
  const [selectedRFQ, setSelectedRFQ] = useState('');
  const [showLocked, setShowLocked] = useState(true);

  const { data: rfqRaw, loading: rfqLoading } = useGetRequest(
    `${endpoints.procurement_management.rfqs}?pagination=false`
  );

  const rfqs = (
    Array.isArray(rfqRaw) ? rfqRaw : Array.isArray(rfqRaw?.results) ? rfqRaw.results : []
  ).map((r) => ({
    id: r.id || '',
    rfqNumber: r.rfq_number || '',
    title: r.rfq_title || r.title || '',
    category: r.category_name || '',
    selectedCategories: r.invited_vendors
      ? [...new Set(r.invited_vendors.map((v) => v.category).filter(Boolean))]
      : [],
    deadline: r.submission_deadline || '',
    estimatedAmount: Number(r.total_estimated_value) || 0,
    isDeadlinePassed: r.submission_deadline ? new Date(r.submission_deadline) < new Date() : false,
    submissions: [],
  }));

  const PLACEHOLDER_RFQ = {
    rfqNumber: '',
    title: '',
    selectedCategories: [],
    deadline: new Date().toISOString(),
    estimatedAmount: 0,
    isDeadlinePassed: false,
    submissions: [],
  };

  const effectiveSelectedRFQ = selectedRFQ || rfqs[0]?.rfqNumber || '';
  const selectedRfqObj = rfqs.find((r) => r.rfqNumber === effectiveSelectedRFQ) || rfqs[0];

  const { data: submissionsRaw, loading: submissionsLoading } = useGetRequest(
    selectedRfqObj?.id
      ? `${endpoints.procurement_management.vendor_rfq_submissions}?rfq=${selectedRfqObj.id}`
      : null
  );

  // Legacy static placeholder kept for shape reference only — not rendered
  const _unused = [
    {
      rfqNumber: 'RFQ-2026-001',
      title: 'IT Equipment for WASH Project',
      category: 'IT Equipment',
      selectedCategories: ['IT Equipment', 'Computer Hardware', 'Networking'],
      deadline: '2026-04-20T17:00:00',
      estimatedAmount: 485000,
      isDeadlinePassed: false,
      submissions: [
        {
          id: 'S001',
          vendorId: 'V001',
          vendorName: 'TechBD Solutions Ltd',
          categories: ['IT Equipment', 'Computer Hardware', 'Networking'],
          location: 'Dhaka',
          rating: 4.5,
          submittedAt: '2026-03-28 14:30',
          totalQuotedAmount: null,
          items: [
            { description: 'Laptop Computer', quotedRate: null, quotedAmount: null },
            { description: 'Laser Printer', quotedRate: null, quotedAmount: null },
            { description: 'Network Switch', quotedRate: null, quotedAmount: null },
            { description: 'UPS System', quotedRate: null, quotedAmount: null },
          ],
          documents: [
            { name: 'Company Registration', uploaded: true },
            { name: 'VAT Registration (BIN)', uploaded: true },
            { name: 'TIN Certificate', uploaded: true },
            { name: 'Bank Solvency', uploaded: true },
            { name: 'Trade License', uploaded: true },
          ],
          isCompliant: true,
          remarks: 'All documents submitted.',
        },
        {
          id: 'S002',
          vendorId: 'V005',
          vendorName: 'Digital World IT',
          categories: ['IT Equipment', 'Computer Hardware', 'Software'],
          location: 'Dhaka',
          rating: 4.1,
          submittedAt: '2026-03-30 09:45',
          totalQuotedAmount: null,
          items: [
            { description: 'Laptop Computer', quotedRate: null, quotedAmount: null },
            { description: 'Laser Printer', quotedRate: null, quotedAmount: null },
            { description: 'Network Switch', quotedRate: null, quotedAmount: null },
            { description: 'UPS System', quotedRate: null, quotedAmount: null },
          ],
          documents: [
            { name: 'Company Registration', uploaded: true },
            { name: 'VAT Registration (BIN)', uploaded: true },
            { name: 'TIN Certificate', uploaded: true },
            { name: 'Bank Solvency', uploaded: false },
            { name: 'Trade License', uploaded: true },
          ],
          isCompliant: false,
          remarks: 'Bank Solvency Certificate missing.',
        },
        {
          id: 'S003',
          vendorId: 'V008',
          vendorName: 'GreenTech Solutions',
          categories: ['IT Equipment', 'Networking', 'Security Systems'],
          location: 'Dhaka',
          rating: 4.4,
          submittedAt: '2026-04-01 16:00',
          totalQuotedAmount: null,
          items: [
            { description: 'Laptop Computer', quotedRate: null, quotedAmount: null },
            { description: 'Laser Printer', quotedRate: null, quotedAmount: null },
            { description: 'Network Switch', quotedRate: null, quotedAmount: null },
            { description: 'UPS System', quotedRate: null, quotedAmount: null },
          ],
          documents: [
            { name: 'Company Registration', uploaded: true },
            { name: 'VAT Registration (BIN)', uploaded: true },
            { name: 'TIN Certificate', uploaded: true },
            { name: 'Bank Solvency', uploaded: true },
            { name: 'Trade License', uploaded: true },
          ],
          isCompliant: true,
          remarks: 'Complete submission.',
        },
        {
          id: 'S004',
          vendorId: 'V012',
          vendorName: 'Prime Technologies',
          categories: ['IT Equipment', 'Computer Hardware'],
          location: 'Dhaka',
          rating: 4.3,
          submittedAt: '2026-04-05 11:20',
          totalQuotedAmount: null,
          items: [
            { description: 'Laptop Computer', quotedRate: null, quotedAmount: null },
            { description: 'Laser Printer', quotedRate: null, quotedAmount: null },
            { description: 'Network Switch', quotedRate: null, quotedAmount: null },
            { description: 'UPS System', quotedRate: null, quotedAmount: null },
          ],
          documents: [
            { name: 'Company Registration', uploaded: true },
            { name: 'VAT Registration (BIN)', uploaded: true },
            { name: 'TIN Certificate', uploaded: true },
            { name: 'Bank Solvency', uploaded: true },
            { name: 'Trade License', uploaded: true },
          ],
          isCompliant: true,
          remarks: 'All documents complete.',
        },
        {
          id: 'S005',
          vendorId: 'V015',
          vendorName: 'CompuStore BD',
          categories: ['IT Equipment', 'Computer Hardware'],
          location: 'Dhaka',
          rating: 4.0,
          submittedAt: '2026-04-10 15:00',
          totalQuotedAmount: null,
          items: [
            { description: 'Laptop Computer', quotedRate: null, quotedAmount: null },
            { description: 'Laser Printer', quotedRate: null, quotedAmount: null },
            { description: 'Network Switch', quotedRate: null, quotedAmount: null },
            { description: 'UPS System', quotedRate: null, quotedAmount: null },
          ],
          documents: [
            { name: 'Company Registration', uploaded: true },
            { name: 'VAT Registration (BIN)', uploaded: true },
            { name: 'TIN Certificate', uploaded: false },
            { name: 'Bank Solvency', uploaded: true },
            { name: 'Trade License', uploaded: true },
          ],
          isCompliant: false,
          remarks: 'TIN Certificate missing.',
        },
      ],
    },
    {
      rfqNumber: 'RFQ-2025-045',
      title: 'Medical Supplies - Emergency',
      category: 'Medical Supplies',
      selectedCategories: ['Medical Supplies', 'Pharmaceuticals'],
      deadline: '2026-02-15T17:00:00',
      estimatedAmount: 520000,
      isDeadlinePassed: true,
      submissions: [
        {
          id: 'S010',
          vendorId: 'V004',
          vendorName: 'MediSupply Bangladesh',
          categories: ['Medical Supplies', 'Pharmaceuticals'],
          location: 'Dhaka',
          rating: 4.3,
          submittedAt: '2026-02-10 11:00',
          totalQuotedAmount: 495000,
          items: [
            { description: 'First Aid Kit (Standard)', quotedRate: 2500, quotedAmount: 125000 },
            { description: 'Surgical Gloves', quotedRate: 15, quotedAmount: 150000 },
            { description: 'Antiseptic Solution', quotedRate: 350, quotedAmount: 70000 },
            { description: 'Bandages & Dressings', quotedRate: 150, quotedAmount: 150000 },
          ],
          documents: [
            { name: 'Company Registration', uploaded: true },
            { name: 'VAT Registration (BIN)', uploaded: true },
            { name: 'TIN Certificate', uploaded: true },
            { name: 'Drug License', uploaded: true },
          ],
          isCompliant: true,
          remarks: 'Full submission with drug license.',
        },
      ],
    },
  ];
  const currentRFQ = selectedRfqObj || PLACEHOLDER_RFQ;

  const submissions = (
    Array.isArray(submissionsRaw) ? submissionsRaw : (submissionsRaw?.results ?? [])
  ).map((sub) => ({
    id: sub.id,
    vendorName: sub.vendor?.vendor_name || '',
    vendorId: sub.vendor?.vendor_id || '',
    location: '',
    rating: 0,
    submittedAt: sub.submitted_at || '',
    totalQuotedAmount: sub.financial_proposal?.grand_total
      ? Number(sub.financial_proposal.grand_total)
      : null,
    items: Array.isArray(sub.financial_proposal?.items)
      ? sub.financial_proposal.items.map((item) => ({
          description: item.item_name || '',
          quotedRate: item.unit_price ? Number(item.unit_price) : null,
          quotedAmount: item.total ? Number(item.total) : null,
        }))
      : [],
    documents: Array.isArray(sub.documents)
      ? sub.documents.map((doc) => ({
          name: doc.doc_name || '',
          uploaded: true,
        }))
      : [],
    isCompliant: Array.isArray(sub.technical_proposal?.compliance)
      ? sub.technical_proposal.compliance.every((c) => c.compliant !== 'No')
      : true,
    categories: [],
  }));

  const isLocked = !currentRFQ.isDeadlinePassed;

  const handleExportCsv = () => {
    const headers = [
      '#',
      'Vendor Name',
      'Vendor ID',
      'Submitted At',
      'Quoted Amount',
      'Compliant',
      'Documents Submitted',
    ];
    const csvRows = submissions.map((sub, idx) => [
      idx + 1,
      sub.vendorName,
      sub.vendorId,
      sub.submittedAt,
      isLocked ? 'Locked' : (sub.totalQuotedAmount ?? ''),
      sub.isCompliant ? 'Yes' : 'No',
      `${sub.documents.filter((d) => d.uploaded).length}/${sub.documents.length}`,
    ]);
    const csv = [headers, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions-${currentRFQ.rfqNumber || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  const stats = {
    submitted: submissions.length,
    compliant: submissions.filter((s) => s.isCompliant).length,
    nonCompliant: submissions.filter((s) => !s.isCompliant).length,
    docsComplete: submissions.filter((s) => s.documents.every((d) => d.uploaded)).length,
  };
  const getDeadlineStatus = () => {
    const now = new Date();
    const dl = new Date(currentRFQ.deadline);
    const diff = dl.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);
    if (diff < 0)
      return {
        label: 'Deadline Passed',
        color: 'bg-green-100 text-green-800 border-green-300',
        desc: 'Quotation amounts are now visible for evaluation.',
      };
    if (hours < 48)
      return {
        label: `${Math.floor(hours)}h Remaining`,
        color: 'bg-red-100 text-red-800 border-red-300',
        desc: 'Deadline approaching. Quotation amounts remain locked.',
      };
    return {
      label: `${Math.floor(hours / 24)} Days Remaining`,
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      desc: 'Quotation amounts are locked until deadline passes.',
    };
  };
  const dlStatus = getDeadlineStatus();
  if (rfqLoading || submissionsLoading) {
    return <PageLoader message="Loading submissions..." />;
  }
  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link href={paths.dashboard.procurement.rfq.list}>
          <button type="button" className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-1">
            Submission Monitoring
          </h1>
          <p className="text-sm text-muted-foreground">
            Track vendor submissions with quotation locking until deadline
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCsv}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total Submissions" value={stats.submitted} icon={FileText} color="blue" />
        <StatCard title="Compliant" value={stats.compliant} icon={CheckCircle} color="green" />
        <StatCard
          title="Non-Compliant"
          value={stats.nonCompliant}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard title="Docs Complete" value={stats.docsComplete} icon={FileText} color="purple" />
        <StatCard
          title="Est. Amount"
          value={`BDT ${(currentRFQ.estimatedAmount / 1000).toFixed(0)}K`}
          icon={DollarSign}
          color="green"
        />
      </div>

      {/* RFQ Selector */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-5">
              <p
                htmlFor="monitoring-rfq-select"
                className="block text-xs font-semibold text-muted-foreground mb-1"
              >
                SELECT RFQ
              </p>
              <select
                id="monitoring-rfq-select"
                value={effectiveSelectedRFQ}
                onChange={(e) => setSelectedRFQ(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {rfqs.map((r) => (
                  <option key={r.rfqNumber} value={r.rfqNumber}>
                    {r.rfqNumber} - {r.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <p
                htmlFor="monitoring-categories"
                className="block text-xs font-semibold text-muted-foreground mb-1"
              >
                CATEGORIES
              </p>
              <div id="monitoring-categories" className="flex flex-wrap gap-1">
                {currentRFQ.selectedCategories.map((c, i) => (
                  <Badge key={i} variant="primary" size="sm">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="md:col-span-4">
              <div className={`p-3 rounded-lg border ${dlStatus.color}`}>
                <div className="flex items-center gap-2">
                  {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                  <div>
                    <p className="text-sm font-bold">{dlStatus.label}</p>
                    <p className="text-xs">{dlStatus.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Quotation Locking Alert */}
      {isLocked && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
          <Lock className="w-5 h-5 text-orange-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-800">Quotation Amounts Locked</p>
            <p className="text-xs text-orange-700 mt-1">
              All quoted amounts and rates are encrypted and hidden until the submission deadline
              passes. This ensures fair competition and prevents any price manipulation. Only
              submission status, documents, and compliance can be viewed during this period.
            </p>
          </div>
        </div>
      )}

      {/* Submissions Table */}
      <Card>
        <CardHeader
          title={`Vendor Submissions - ${currentRFQ.rfqNumber}`}
          description={`${submissions.length} submissions received | ${isLocked ? 'Amounts locked' : 'Amounts visible'}`}
          action={
            <div className="flex items-center gap-2">
              {isLocked && (
                <Badge variant="warning" size="sm">
                  <Lock className="w-3 h-3 mr-1" />
                  Locked
                </Badge>
              )}
              {!isLocked && (
                <Badge variant="success" size="sm">
                  <Unlock className="w-3 h-3 mr-1" />
                  Unlocked
                </Badge>
              )}
            </div>
          }
        />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-xs font-semibold">#</th>
                  <th className="pb-3 text-xs font-semibold">Vendor</th>
                  <th className="pb-3 text-xs font-semibold">Categories</th>
                  <th className="pb-3 text-xs font-semibold text-center">Rating</th>
                  <th className="pb-3 text-xs font-semibold">Submitted</th>
                  <th className="pb-3 text-xs font-semibold text-right">Quoted Amount</th>
                  <th className="pb-3 text-xs font-semibold text-center">Documents</th>
                  <th className="pb-3 text-xs font-semibold">Compliance</th>
                  <th className="pb-3 text-xs font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, idx) => (
                  <tr
                    key={sub.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 text-sm font-mono text-muted-foreground">{idx + 1}</td>
                    <td className="py-3">
                      <p className="text-sm font-medium">{sub.vendorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub.vendorId} &middot; {sub.location}
                      </p>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {sub.categories.map((c, i) => (
                          <span
                            key={i}
                            className={`text-[10px] px-1.5 py-0.5 rounded ${currentRFQ.selectedCategories.includes(c) ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="flex items-center gap-0.5 justify-center text-xs">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {sub.rating}
                      </span>
                    </td>
                    <td className="py-3 text-xs">{sub.submittedAt}</td>
                    <td className="py-3 text-right">
                      {isLocked ? (
                        <div className="flex items-center justify-end gap-1">
                          <Lock className="w-3 h-3 text-orange-500" />
                          <span className="text-sm font-semibold text-orange-600">Locked</span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-primary font-mono">
                          BDT {sub.totalQuotedAmount?.toLocaleString() || '---'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs font-semibold">
                          {sub.documents.filter((d) => d.uploaded).length}/{sub.documents.length}
                        </span>
                        {sub.documents.every((d) => d.uploaded) ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-orange-500" />
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      {sub.isCompliant ? (
                        <Badge variant="success" size="sm">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Compliant
                        </Badge>
                      ) : (
                        <Badge variant="danger" size="sm">
                          <XCircle className="w-3 h-3 mr-1" />
                          Issue
                        </Badge>
                      )}
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        className="p-1.5 hover:bg-muted rounded"
                        title="View Details"
                        onClick={() =>
                          router.push(
                            paths.dashboard.procurement.quotations.opening(selectedRfqObj?.id)
                          )
                        }
                      >
                        <Eye className="w-4 h-4 text-primary" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Item-Level Comparison (only when unlocked) */}
      {!isLocked && submissions.length > 0 && (
        <Card className="mt-6">
          <CardHeader
            title="Item-Level Price Comparison"
            description="Compare quoted rates across all vendors per BOQ item"
            action={
              <Badge variant="success" size="sm">
                <Unlock className="w-3 h-3 mr-1" />
                Amounts Visible
              </Badge>
            }
          />
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-left">Item</th>
                    {submissions.map((s) => (
                      <th key={s.id} className="px-4 py-3 text-xs font-semibold text-right">
                        {s.vendorName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions[0]?.items.map((item, itemIdx) => {
                    const rates = submissions
                      .map((s) => s.items[itemIdx]?.quotedAmount)
                      .filter(Boolean);
                    const minRate = rates.length > 0 ? Math.min(...rates) : 0;
                    return (
                      <tr key={itemIdx} className="border-b border-border">
                        <td className="px-4 py-3 text-sm font-medium">{item.description}</td>
                        {submissions.map((s) => {
                          const amt = s.items[itemIdx]?.quotedAmount;
                          const isLowest = amt === minRate && amt !== null;
                          return (
                            <td
                              key={s.id}
                              className={`px-4 py-3 text-sm text-right font-mono ${isLowest ? 'font-bold text-green-600 bg-green-50' : ''}`}
                            >
                              {amt ? `BDT ${amt.toLocaleString()}` : '---'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-primary/5 border-t-2 border-primary">
                    <td className="px-4 py-3 text-sm font-bold">Grand Total</td>
                    {submissions.map((s) => (
                      <td
                        key={s.id}
                        className="px-4 py-3 text-sm text-right font-bold text-primary font-mono"
                      >
                        {s.totalQuotedAmount
                          ? `BDT ${s.totalQuotedAmount.toLocaleString()}`
                          : '---'}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Locked comparison */}
      {isLocked && (
        <Card className="mt-6">
          <CardBody>
            <div className="flex items-center justify-center gap-3 py-8">
              <Lock className="w-8 h-8 text-orange-400" />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  Item-Level Price Comparison Locked
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Price comparison will be available after the submission deadline (
                  {new Date(currentRFQ.deadline).toLocaleDateString()}) passes. This ensures fair
                  and transparent procurement per ActionAid policy.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Document Compliance Matrix */}
      <Card className="mt-6">
        <CardHeader
          title="Document Compliance Matrix"
          description="Track required document submission status per vendor"
        />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-left">Document</th>
                  {submissions.map((s) => (
                    <th key={s.id} className="px-4 py-3 text-xs font-semibold text-center">
                      {s.vendorName.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions[0]?.documents.map((doc, docIdx) => (
                  <tr key={docIdx} className="border-b border-border">
                    <td className="px-4 py-3 text-sm">{doc.name}</td>
                    {submissions.map((s) => (
                      <td key={s.id} className="px-2 py-1 text-center">
                        {s.documents[docIdx]?.uploaded ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
