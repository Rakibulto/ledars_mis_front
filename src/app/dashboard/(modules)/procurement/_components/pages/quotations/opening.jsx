'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState, useCallback } from 'react';
import {
  Eye,
  Award,
  Users,
  Shield,
  Download,
  FileText,
  ArrowLeft,
  Building2,
  Paperclip,
  TrendingUp,
  CheckCircle2,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Tabs } from '../../components/ui/tabs';
import { PageLoader } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { AttachmentPanel } from './components/attachment-panel';
import { VendorComparison } from './components/vendor-comparison';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

// ── helpers ───────────────────────────────────────────────────────────────────

function getFileExtType(filename) {
  const ext = (filename || '').split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'ico'].includes(ext)) return 'image';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
  if (ext === 'pdf') return 'pdf';
  return ext || 'file';
}

/** Merge financial items with the same name by summing quantity and total. */
function mergeFinancialItems(items) {
  const map = new Map();
  for (const item of items) {
    const key = (item.name || '').trim().toLowerCase();
    if (map.has(key)) {
      const prev = map.get(key);
      map.set(key, {
        ...prev,
        quantity: prev.quantity + item.quantity,
        total: prev.total + item.total,
      });
    } else {
      map.set(key, { ...item });
    }
  }
  return Array.from(map.values());
}

function mapApiVendor(s, allSubmissions) {
  const fp = s.financial_proposal || {};
  const tp = s.technical_proposal || {};

  const technical = {};
  (tp.compliance || []).forEach((c) => {
    const key = (c.item_name || `item_${c.id}`).toLowerCase().replace(/\s+/g, '_');
    const score = c.compliant === 'Yes' ? 10 : c.compliant === 'Partial' ? 5 : 0;
    technical[key] = { score, maxScore: 10, comment: c.offered_spec || '' };
  });
  if (tp.company_experience) {
    technical.experience = { score: 8, maxScore: 10, comment: tp.company_experience };
  }
  if (tp.methodology) {
    technical.methodology = { score: 8, maxScore: 10, comment: tp.methodology };
  }

  const techEntries = Object.values(technical);
  const technicalScore = techEntries.length
    ? Math.round(
        (techEntries.reduce((a, e) => a + e.score, 0) /
          techEntries.reduce((a, e) => a + e.maxScore, 0)) *
          100
      )
    : 0;

  const grandTotal = parseFloat(fp.grand_total || 0);
  const allTotals = allSubmissions
    .map((s2) => parseFloat(s2.financial_proposal?.grand_total || 0))
    .filter(Boolean);
  const minTotal = allTotals.length ? Math.min(...allTotals) : grandTotal;
  const financialScore =
    grandTotal > 0 ? Math.min(100, Math.round((minTotal / grandTotal) * 100)) : 0;

  const overallScore = parseFloat((technicalScore * 0.6 + financialScore * 0.4).toFixed(1));

  return {
    id: String(s.id),
    name: s.vendor?.vendor_name || 'Unknown Vendor',
    registrationNumber: `VID-${s.vendor?.vendor_id || '—'}`,
    contactPerson: s.vendor?.designation || s.vendor?.vendor_name || '—',
    email: '',
    phone: '',
    submissionDate: s.submitted_at || s.created_at || '',
    totalPrice: grandTotal,
    technicalScore,
    financialScore,
    overallScore,
    rank: 0,
    status: s.status === 'submitted' ? 'compliant' : 'non-compliant',
    technicalIssues: s.status !== 'submitted' ? ['Submission incomplete'] : undefined,
    technical,
    financial: {
      items: (fp.items || []).map((item) => ({
        name: item.item_name || '',
        quantity: Number(item.qty) || 0,
        unitPrice: parseFloat(item.unit_price || 0),
        total: parseFloat(item.total || 0),
      })),
      subtotal: parseFloat(fp.sub_total || 0),
      tax: parseFloat(fp.vat || 0),
      delivery: parseFloat(fp.delivery_charge || 0),
      installation: 0,
      total: grandTotal,
      paymentTerms: fp.payment_terms || '—',
      deliveryTime: fp.delivery_lead_time_days ? `${fp.delivery_lead_time_days} days` : '—',
      warrantyPeriod: s.warranty_period || '—',
    },
    attachments: (s.documents || []).map((doc) => ({
      id: String(doc.id),
      name: doc.doc_name || doc.filename || 'Document',
      size: doc.filename || '',
      type: getFileExtType(doc.filename || doc.file_url || ''),
      file_url: doc.file_url || doc.file || '',
    })),
  };
}

// ── component ─────────────────────────────────────────────────────────────────

export function QuotationOpening() {
  const mockQuotationData = {
    id: 'QUO-2024-001',
    rfqNumber: 'RFQ-2024-015',
    title: 'Office Furniture & Equipment Supply',
    deadline: '2024-03-12T17:00:00',
    publishedDate: '2024-02-25',
    openedDate: '2024-03-12T17:15:23',
    openedBy: 'Sarah Johnson',
    status: 'opened',
    category: 'Office Supplies',
    estimatedValue: 75000,
    currency: 'USD',
    evaluationCriteria: {
      technical: 60,
      financial: 40,
    },
    vendors: [
      {
        id: 'V001',
        name: 'Premium Office Solutions Ltd',
        registrationNumber: 'REG-2021-4567',
        contactPerson: 'John Anderson',
        email: 'john@premiumoffice.com',
        phone: '+1-555-0123',
        submissionDate: '2024-03-11T14:30:00',
        totalPrice: 68500,
        technicalScore: 85,
        financialScore: 92,
        overallScore: 87.8,
        rank: 1,
        status: 'compliant',
        technical: {
          experience: {
            score: 18,
            maxScore: 20,
            comment: 'Excellent track record with 15 years in the industry',
          },
          quality: {
            score: 28,
            maxScore: 30,
            comment: 'High-quality samples provided, meets all specifications',
          },
          capacity: {
            score: 14,
            maxScore: 15,
            comment: 'Strong delivery capacity and logistics network',
          },
          methodology: {
            score: 13,
            maxScore: 15,
            comment: 'Well-documented installation and maintenance process',
          },
          certifications: {
            score: 12,
            maxScore: 20,
            comment: 'ISO 9001 certified, missing environmental certification',
          },
        },
        financial: {
          items: [
            { name: 'Executive Office Desk', quantity: 12, unitPrice: 850, total: 10200 },
            { name: 'Ergonomic Office Chair', quantity: 50, unitPrice: 420, total: 21000 },
            { name: 'Filing Cabinet', quantity: 25, unitPrice: 280, total: 7000 },
            { name: 'Meeting Table', quantity: 5, unitPrice: 1200, total: 6000 },
            { name: 'Conference Chair', quantity: 40, unitPrice: 180, total: 7200 },
          ],
          subtotal: 51400,
          tax: 5140,
          delivery: 2000,
          installation: 9960,
          total: 68500,
          paymentTerms: '50% advance, 50% on delivery',
          deliveryTime: '21 days',
          warrantyPeriod: '24 months',
        },
        attachments: [
          { id: '1', name: 'Company_Profile.pdf', size: '2.4 MB', type: 'pdf' },
          { id: '2', name: 'Product_Catalog.pdf', size: '8.7 MB', type: 'pdf' },
          { id: '3', name: 'ISO_9001_Certificate.pdf', size: '1.2 MB', type: 'pdf' },
          { id: '4', name: 'Sample_Images.zip', size: '15.3 MB', type: 'zip' },
          { id: '5', name: 'Technical_Specifications.xlsx', size: '456 KB', type: 'excel' },
        ],
      },
      {
        id: 'V002',
        name: 'GlobalTech Furniture Co.',
        registrationNumber: 'REG-2020-8934',
        contactPerson: 'Maria Rodriguez',
        email: 'maria@globaltech.com',
        phone: '+1-555-0456',
        submissionDate: '2024-03-12T09:15:00',
        totalPrice: 72300,
        technicalScore: 78,
        financialScore: 88,
        overallScore: 82.0,
        rank: 2,
        status: 'compliant',
        technical: {
          experience: {
            score: 16,
            maxScore: 20,
            comment: 'Good experience with 10 years in the market',
          },
          quality: {
            score: 25,
            maxScore: 30,
            comment: 'Good quality products, minor deviations in specifications',
          },
          capacity: {
            score: 13,
            maxScore: 15,
            comment: 'Adequate delivery capacity',
          },
          methodology: {
            score: 12,
            maxScore: 15,
            comment: 'Standard installation process',
          },
          certifications: {
            score: 12,
            maxScore: 20,
            comment: 'ISO 9001 certified',
          },
        },
        financial: {
          items: [
            { name: 'Executive Office Desk', quantity: 12, unitPrice: 920, total: 11040 },
            { name: 'Ergonomic Office Chair', quantity: 50, unitPrice: 450, total: 22500 },
            { name: 'Filing Cabinet', quantity: 25, unitPrice: 300, total: 7500 },
            { name: 'Meeting Table', quantity: 5, unitPrice: 1350, total: 6750 },
            { name: 'Conference Chair', quantity: 40, unitPrice: 195, total: 7800 },
          ],
          subtotal: 55590,
          tax: 5559,
          delivery: 2500,
          installation: 8651,
          total: 72300,
          paymentTerms: '30% advance, 70% on delivery',
          deliveryTime: '28 days',
          warrantyPeriod: '18 months',
        },
        attachments: [
          { id: '1', name: 'Company_Registration.pdf', size: '1.8 MB', type: 'pdf' },
          { id: '2', name: 'Product_Brochure.pdf', size: '6.2 MB', type: 'pdf' },
          { id: '3', name: 'Certifications.pdf', size: '2.1 MB', type: 'pdf' },
        ],
      },
      {
        id: 'V003',
        name: 'Budget Office Supplies Inc.',
        registrationNumber: 'REG-2022-1234',
        contactPerson: 'David Kim',
        email: 'david@budgetoffice.com',
        phone: '+1-555-0789',
        submissionDate: '2024-03-12T16:45:00',
        totalPrice: 58900,
        technicalScore: 65,
        financialScore: 98,
        overallScore: 78.2,
        rank: 3,
        status: 'non-compliant',
        technicalIssues: ['Missing ISO certification', 'Delivery time exceeds requirement'],
        technical: {
          experience: {
            score: 12,
            maxScore: 20,
            comment: 'Limited experience - only 3 years in business',
          },
          quality: {
            score: 20,
            maxScore: 30,
            comment: 'Acceptable quality but concerns about durability',
          },
          capacity: {
            score: 10,
            maxScore: 15,
            comment: 'Limited delivery capacity, may face delays',
          },
          methodology: {
            score: 11,
            maxScore: 15,
            comment: 'Basic installation process, no maintenance plan',
          },
          certifications: {
            score: 12,
            maxScore: 20,
            comment: 'No international certifications',
          },
        },
        financial: {
          items: [
            { name: 'Executive Office Desk', quantity: 12, unitPrice: 680, total: 8160 },
            { name: 'Ergonomic Office Chair', quantity: 50, unitPrice: 350, total: 17500 },
            { name: 'Filing Cabinet', quantity: 25, unitPrice: 220, total: 5500 },
            { name: 'Meeting Table', quantity: 5, unitPrice: 980, total: 4900 },
            { name: 'Conference Chair', quantity: 40, unitPrice: 145, total: 5800 },
          ],
          subtotal: 41860,
          tax: 4186,
          delivery: 3500,
          installation: 9354,
          total: 58900,
          paymentTerms: '20% advance, 80% on delivery',
          deliveryTime: '45 days',
          warrantyPeriod: '12 months',
        },
        attachments: [
          { id: '1', name: 'Business_License.pdf', size: '980 KB', type: 'pdf' },
          { id: '2', name: 'Price_List.pdf', size: '1.5 MB', type: 'pdf' },
        ],
      },
    ],
  };

  const params = useParams();
  const id = params?.id;

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showAttachmentPanel, setShowAttachmentPanel] = useState(false);

  const { data: quotationData, loading } = useGetRequest(
    id ? endpoints.procurement_management.quotation_by_id(id) : null
  );

  const vendors = useMemo(() => quotationData?.vendors ?? [], [quotationData]);
  const currentVendorId = selectedVendor ?? vendors[0]?.id;
  const vendor = vendors.find((v) => String(v.id) === String(currentVendorId)) ?? vendors[0];
  console.log('selected vendor:', selectedVendor);
  console.log('vendorsss :', vendors);
  console.log('vendor vendor:', vendor);

  // ── Export CSV ────────────────────────────────────────────────────────────────
  const handleExportCSV = useCallback(() => {
    if (!vendors.length) return;

    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const row = (...cols) => cols.map(esc).join(',');

    const lines = [];
    lines.push(row('RFQ Number', quotationData?.rfqNumber ?? ''));
    lines.push(row('Title', quotationData?.title ?? ''));
    lines.push(
      row(
        'Opened Date',
        quotationData?.openedDate ? new Date(quotationData.openedDate).toLocaleString() : ''
      )
    );
    lines.push('');

    // Vendor ranking summary
    lines.push(
      row(
        'Rank',
        'Vendor',
        'Registration No.',
        'Technical Score',
        'Financial Score',
        'Overall Score',
        'Total Price (BDT)',
        'Status'
      )
    );
    vendors.forEach((v) => {
      lines.push(
        row(
          v.rank,
          v.name,
          v.registrationNumber,
          v.technicalScore,
          v.financialScore,
          v.overallScore,
          v.totalPrice,
          v.status
        )
      );
    });
    lines.push('');

    // Per-vendor financial breakdown
    vendors.forEach((v) => {
      lines.push(row(`Financial Breakdown: ${v.name}`));
      lines.push(row('Item', 'Qty', 'Unit Price (BDT)', 'Total (BDT)'));
      mergeFinancialItems(v.financial?.items ?? []).forEach((item) => {
        lines.push(row(item.name, item.quantity, item.unitPrice, item.total));
      });
      lines.push(row('', '', 'Subtotal', v.financial?.subtotal ?? 0));
      lines.push(row('', '', 'Tax/VAT', v.financial?.tax ?? 0));
      lines.push(row('', '', 'Delivery Charge', v.financial?.delivery ?? 0));
      lines.push(row('', '', 'Grand Total', v.financial?.total ?? 0));
      lines.push(row('', '', 'Payment Terms', v.financial?.paymentTerms ?? ''));
      lines.push(row('', '', 'Delivery Time', v.financial?.deliveryTime ?? ''));
      lines.push('');
    });

    const csv = `\uFEFF${lines.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotation-${quotationData?.rfqNumber ?? id}-comparison.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [vendors, quotationData, id]);

  // ── Technical Tab ──────────────────────────────────────────────────────────
  const technicalTab = (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <p className="text-sm font-medium text-foreground shrink-0">Select Vendor:</p>
        <div className="flex flex-wrap gap-2">
          {vendors.map((v) => (
            <button
              type="button"
              key={v.id}
              onClick={() => setSelectedVendor(v.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentVendorId === v.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {v.name}
              <Badge
                variant={v.status === 'compliant' ? 'success' : 'destructive'}
                size="sm"
                className="ml-2"
              >
                Rank #{v.rank ?? '—'}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {vendor && (
        <>
          <Card>
            <CardHeader title="Vendor Information" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Company Name</p>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {vendor.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Registration Number</p>
                  <p className="text-sm font-medium text-foreground">
                    {vendor.registrationNumber ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Contact Person</p>
                  <p className="text-sm font-medium text-foreground">
                    {vendor.contactPerson ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="text-sm font-medium text-foreground">{vendor.email || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Submission Date</p>
                  <p className="text-sm font-medium text-foreground">
                    {vendor.submissionDate ? new Date(vendor.submissionDate).toLocaleString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge variant={vendor.status === 'compliant' ? 'success' : 'destructive'}>
                    {vendor.status === 'compliant' ? (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 mr-1" />
                    )}
                    {vendor.status}
                  </Badge>
                </div>
              </div>

              {vendor.status === 'non-compliant' && vendor.technicalIssues && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm font-medium text-destructive mb-2">Technical Issues:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {vendor.technicalIssues.map((issue, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Overall Score — prominent summary card */}
          <Card
            className={`border-2 ${
              (vendor?.overallScore ?? 0) >= 75
                ? 'border-success/40 bg-success/5'
                : (vendor?.overallScore ?? 0) >= 50
                  ? 'border-warning/40 bg-warning/5'
                  : 'border-destructive/40 bg-destructive/5'
            }`}
          >
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Overall Score
                  </p>
                  <p
                    className={`text-4xl font-extrabold ${
                      (vendor?.overallScore ?? 0) >= 75
                        ? 'text-success'
                        : (vendor?.overallScore ?? 0) >= 50
                          ? 'text-warning'
                          : 'text-destructive'
                    }`}
                  >
                    {vendor?.overallScore ?? '—'}
                    <span className="text-lg font-medium text-muted-foreground">/100</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Documents (50%) + Financial (50%)
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-muted-foreground">Doc Score</span>
                    <span className="text-sm font-bold text-foreground">
                      {vendor?.technicalScore ?? '—'}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-muted-foreground">Financial Score</span>
                    <span className="text-sm font-bold text-foreground">
                      {vendor?.financialScore ?? '—'}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">Rank</span>
                    <Badge variant={vendor?.rank === 1 ? 'warning' : 'outline'} size="sm">
                      #{vendor?.rank ?? '—'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Technical Evaluation — Document Checklist"
              description={`Document Score: ${vendor?.technicalScore ?? '—'}/100  •  Required: ${(quotationData?.requiredDocuments ?? []).length} document(s)`}
            />
            <CardBody>
              {(quotationData?.requiredDocuments ?? []).length === 0 &&
              Object.entries(vendor?.technical ?? {}).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No required documents defined for this RFQ.
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Score summary bar */}
                  <div className="flex items-center gap-3 mb-4 p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">
                          Overall Document Score
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {vendor?.technicalScore ?? '—'}/100
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            (vendor?.technicalScore ?? 0) >= 80
                              ? 'bg-success'
                              : (vendor?.technicalScore ?? 0) >= 50
                                ? 'bg-warning'
                                : 'bg-destructive'
                          }`}
                          style={{ width: `${vendor?.technicalScore ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Per-document checklist */}
                  {Object.entries(vendor?.technical ?? {}).map(([key, data]) => {
                    const uploaded = data.uploaded ?? data.score > 0;
                    const docLabel = data.doc_name || key.replace(/_/g, ' ');
                    return (
                      <div
                        key={key}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          uploaded
                            ? 'border-success/30 bg-success/5'
                            : 'border-destructive/30 bg-destructive/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                              uploaded
                                ? 'bg-success/20 text-success'
                                : 'bg-destructive/20 text-destructive'
                            }`}
                          >
                            {uploaded ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <AlertTriangle className="w-4 h-4" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-foreground capitalize">
                            {docLabel}
                          </span>
                        </div>
                        <Badge variant={uploaded ? 'success' : 'destructive'} size="sm">
                          {uploaded ? 'Uploaded' : 'Missing'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );

  // ── Financial Tab ──────────────────────────────────────────────────────────
  const financialTab = (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <p className="text-sm font-medium text-foreground shrink-0">Select Vendor:</p>
        <div className="flex flex-wrap gap-2">
          {vendors.map((v) => (
            <button
              type="button"
              key={v.id}
              onClick={() => setSelectedVendor(v.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentVendorId === v.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {v.name}
              <span className="ml-2 text-xs">BDT {(v.totalPrice ?? 0).toLocaleString()}</span>
            </button>
          ))}
        </div>
      </div>

      {vendor && (
        <>
          <Card>
            <CardHeader title="Price Summary" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total Bid Price</p>
                  <p className="text-2xl font-semibold text-foreground">
                    BDT {(vendor.financial?.total ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Financial Score</p>
                  <p className="text-2xl font-semibold text-success">
                    {vendor.financialScore ?? '—'}/100
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">vs Estimate</p>
                  <p
                    className={`text-2xl font-semibold ${
                      (vendor.financial?.total ?? 0) < (quotationData?.estimatedValue ?? 0)
                        ? 'text-success'
                        : 'text-destructive'
                    }`}
                  >
                    {(vendor.financial?.total ?? 0) < (quotationData?.estimatedValue ?? 0) ? (
                      <TrendingDown className="inline w-6 h-6 mr-1" />
                    ) : (
                      <TrendingUp className="inline w-6 h-6 mr-1" />
                    )}
                    {quotationData?.estimatedValue
                      ? `${Math.abs(Math.round((((vendor.financial?.total ?? 0) - quotationData.estimatedValue) / quotationData.estimatedValue) * 100))}%`
                      : '—'}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Price Breakdown" />
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Item Name
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        Quantity
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        Unit Price
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mergeFinancialItems(vendor.financial?.items ?? []).map((item, index) => (
                      <tr key={index} className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-foreground">{item.name}</td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">
                          BDT {(item.unitPrice ?? 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-foreground">
                          BDT {(item.total ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-b border-border">
                      <td
                        colSpan={3}
                        className="py-3 px-4 text-sm text-right text-muted-foreground"
                      >
                        Subtotal
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-foreground">
                        BDT {(vendor.financial?.subtotal ?? 0).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td
                        colSpan={3}
                        className="py-3 px-4 text-sm text-right text-muted-foreground"
                      >
                        Tax
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-foreground">
                        BDT {(vendor.financial?.tax ?? 0).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td
                        colSpan={3}
                        className="py-3 px-4 text-sm text-right text-muted-foreground"
                      >
                        Delivery
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-foreground">
                        BDT {(vendor.financial?.delivery ?? 0).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td
                        colSpan={3}
                        className="py-3 px-4 text-sm text-right text-muted-foreground"
                      >
                        Installation
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-foreground">
                        BDT {(vendor.financial?.installation ?? 0).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={3}
                        className="py-3 px-4 text-sm text-right font-semibold text-foreground"
                      >
                        Grand Total
                      </td>
                      <td className="py-3 px-4 text-base text-right font-semibold text-primary">
                        BDT {(vendor.financial?.total ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Payment Terms</p>
                  <p className="text-sm font-medium text-foreground">
                    {vendor.financial?.paymentTerms ?? '—'}
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Delivery Time</p>
                  <p className="text-sm font-medium text-foreground">
                    {vendor.financial?.deliveryTime ?? '—'}
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Warranty Period</p>
                  <p className="text-sm font-medium text-foreground">
                    {vendor.financial?.warrantyPeriod ?? '—'}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );

  // ── Comparative Analysis Tab ───────────────────────────────────────────────
  const comparisonTab = (
    <div className="space-y-6">
      <VendorComparison vendors={vendors} />
    </div>
  );

  // ── Loading / Not Found ────────────────────────────────────────────────────
  if (loading) {
    return <PageLoader message="Loading quotation..." />;
  }

  if (!quotationData) {
    return <p className="p-8 text-muted-foreground">Quotation not found.</p>;
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={paths.dashboard.procurement.quotations.list}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Quotations
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
                {quotationData?.title ?? `Quotation #${id}`}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {quotationData?.rfqNumber ?? '—'}
                </span>
                <span className="hidden sm:inline">•</span>
                <span>{quotationData?.category ?? '—'}</span>
                <Badge variant="info">
                  <Eye className="w-3 h-3 mr-1" />
                  Opened
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAttachmentPanel(!showAttachmentPanel)}
              >
                <Paperclip className="w-3.5 h-3.5 mr-1.5" />
                Attachments
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportCSV}>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Audit Trail */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 bg-info/10 border border-info/20 rounded-lg">
              <Shield className="w-5 h-5 text-info shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Audit Trail</p>
                <p className="text-xs text-muted-foreground">
                  {quotationData?.openedDate
                    ? `Opened on ${new Date(quotationData.openedDate).toLocaleString()} by ${quotationData?.openedBy ?? 'Unknown'}`
                    : 'Not yet opened'}{' '}
                  • Deadline was{' '}
                  {quotationData?.deadline
                    ? new Date(quotationData.deadline).toLocaleString()
                    : '—'}
                </p>
              </div>
              <Badge variant="success" className="self-start sm:self-center shrink-0">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Opened After Deadline
              </Badge>
            </div>
          </CardBody>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Submissions</p>
                  <p className="text-xl md:text-2xl font-semibold text-foreground">
                    {vendors.length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lowest Bid</p>
                  <p className="text-xl md:text-2xl font-semibold text-success">
                    {vendors.length
                      ? `BDT ${Math.min(...vendors.map((v) => v.totalPrice ?? Infinity)).toLocaleString()}`
                      : '—'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-5 h-5 text-success" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Top Ranked</p>
                  <p className="text-base font-semibold text-foreground">
                    {vendors.find((v) => v.rank === 1)?.name?.split(' ')[0] ?? '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Score: {vendors.find((v) => v.rank === 1)?.overallScore ?? '—'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-warning" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Compliant Bids</p>
                  <p className="text-xl md:text-2xl font-semibold text-foreground">
                    {
                      vendors.filter((v) => v.status === 'submitted' || v.status === 'compliant')
                        .length
                    }
                    /{vendors.length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-info" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Card>
          <CardBody>
            <Tabs
              tabs={[
                {
                  id: 'technical',
                  label: 'Technical Evaluation',
                  content: technicalTab,
                  badge: vendors.length,
                },
                {
                  id: 'financial',
                  label: 'Financial Evaluation',
                  content: financialTab,
                  badge: vendors.length,
                },
                {
                  id: 'comparison',
                  label: 'Comparative Analysis',
                  content: comparisonTab,
                },
              ]}
              defaultTab="technical"
            />
          </CardBody>
        </Card>
      </div>

      {/* Attachment Panel (Slide-out) */}
      {showAttachmentPanel && vendor && (
        <AttachmentPanel vendor={vendor} onClose={() => setShowAttachmentPanel(false)} />
      )}
    </div>
  );
}
