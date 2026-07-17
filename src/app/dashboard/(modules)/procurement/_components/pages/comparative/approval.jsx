'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Zap,
  Bell,
  Info,
  Star,
  Award,
  Clock,
  XCircle,
  FileText,
  ThumbsUp,
  ArrowLeft,
  RefreshCw,
  ThumbsDown,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { PageLoader } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

function formatBDT(amount) {
  if (amount >= 10000000) return `\u09F3${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `\u09F3${(amount / 100000).toFixed(2)} Lakh`;
  return `\u09F3${amount?.toLocaleString('en-IN')}`;
}
const mockApprovalData = {
  id: 'CS-2026-001',
  rfqNumber: 'RFQ-2026-015',
  title: 'IT Equipment & Computer Hardware for Dhaka Head Office',
  category: 'IT Equipment',
  project: 'Digital Infrastructure Upgrade',
  office: 'Dhaka Head Office',
  budgetCode: 'BD-ICT-2026-01',
  createdBy: 'Fatema Khatun',
  createdDate: '2026-03-20',
  autoExtracted: true,
  // Summary
  vendorsEvaluated: 5,
  totalEstimatedValue: 3250000,
  lowestBid: 2476800,
  recommendedBid: 2658143,
  potentialSavings: 591857,
  // Recommended vendor
  recommendedVendor: {
    name: 'TechBD Solutions Ltd',
    location: 'Mohakhali, Dhaka',
    tin: '123456789012',
    enlistedSince: '2024-06-15',
    pastOrders: 8,
    deliveryRating: 4.5,
    technicalScore: 88,
    financialTotal: 2658143,
    rank: 1,
  },
  // Justification
  justification: {
    summary:
      'TechBD Solutions Ltd is recommended based on highest combined technical-financial score despite not being the lowest bidder. Their superior technical compliance (88/100), OEM-authorized warranty, and proven track record with Ledars NGO make them the best value-for-money option.',
    keyPoints: [
      'Highest technical score (88/100) among all 5 vendors',
      'OEM-authorized distributor for HP, Dell, and Lenovo products',
      'Comprehensive 3-year on-site warranty included',
      'Fastest delivery commitment: 15 working days vs 25-30 by others',
      '8 successful past orders with AAB with 4.5/5.0 delivery rating',
      'Price difference from lowest bid: \u09F31,81,343 (7.3%) justified by superior specifications',
    ],
    risksAndMitigation: [
      {
        risk: 'Not the lowest bidder (\u09F31.81 Lakh higher than Star Electronics BD)',
        mitigation:
          'Higher price justified by OEM warranty, better specs & faster delivery. Cost-benefit analysis attached.',
      },
      {
        risk: 'High dependency on single vendor for IT equipment',
        mitigation:
          'Split order possible for future procurements; TechBD has sufficient capacity for this order.',
      },
      {
        risk: 'Market price volatility for IT equipment',
        mitigation: 'Prices locked for 90 days per vendor proposal; delivery within 15 days.',
      },
    ],
  },
  // TOR: 3-level approval workflow
  approvalMatrix: [
    {
      level: 1,
      role: 'Procurement/Admin Manager',
      name: 'Md. Kamal Hossain',
      designation: 'Manager, Procurement & Administration',
      status: 'approved',
      date: '2026-03-21',
      remarks:
        'Reviewed and confirmed. Technical evaluation conducted by IT Unit. Financial proposals verified. TechBD Solutions Ltd recommended. Forwarded to Procurement Committee.',
      notificationSent: true,
      notificationDate: '2026-03-21 14:30',
    },
    {
      level: 2,
      role: 'Procurement Committee',
      name: 'Committee Members (4)',
      designation: 'As per Authority Matrix — Procurement over \u09F325 Lakh',
      members: [
        { name: 'Md. Anisur Rahman', designation: 'Head of Programme', status: 'approved' },
        { name: 'Kamrunnahar Begum', designation: 'Head of Finance', status: 'approved' },
        { name: 'Md. Kamal Hossain', designation: 'Procurement/Admin Manager', status: 'approved' },
        {
          name: 'Shahriar Kabir',
          designation: 'Programme Coordinator (Requesting Unit)',
          status: 'pending',
        },
      ],
      status: 'pending',
      date: null,
      remarks: null,
      notificationSent: true,
      notificationDate: '2026-03-21 14:32',
    },
    {
      level: 3,
      role: 'Final Approver (Authority Matrix)',
      name: 'Farah Kabir',
      designation: 'Country Director, Ledars NGO',
      status: 'not_started',
      date: null,
      remarks: null,
      notificationSent: false,
    },
  ],
  // Vendor ranking
  vendorRanking: [
    { rank: 1, name: 'TechBD Solutions Ltd', technical: 88, financial: 2658143, recommended: true },
    { rank: 2, name: 'Navana Computing', technical: 84, financial: 2690545, recommended: false },
    {
      rank: 3,
      name: 'Greenfield IT Solutions',
      technical: 82,
      financial: 2756535,
      recommended: false,
    },
    { rank: 4, name: 'Star Electronics BD', technical: 76, financial: 2476800, recommended: false },
    {
      rank: 5,
      name: 'DataCom Technologies Ltd',
      technical: 71,
      financial: 2507240,
      recommended: false,
    },
  ],
};
function getApprovalIcon(status) {
  switch (status) {
    case 'approved':
      return <CheckCircle2 className="w-5 h-5 text-success" />;
    case 'pending':
      return <Clock className="w-5 h-5 text-warning" />;
    case 'not_started':
      return <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />;
    case 'rejected':
      return <XCircle className="w-5 h-5 text-destructive" />;
    default:
      return <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />;
  }
}
export function ComparativeStatementApproval() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramVendorId = searchParams.get('selectedVendor');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: cs, loading } = useGetRequest(
    id ? endpoints.procurement_management.comparative_statement_by_id(id) : null
  );

  if (loading) return <PageLoader message="Loading CS for approval..." />;
  if (!cs) return <p className="p-8 text-center text-muted-foreground">CS not found</p>;

  const selectedVendor = paramVendorId
    ? cs?.vendors?.find((v) => String(v.vendor_id) === String(paramVendorId))
    : cs?.vendors?.find((v) => v.is_recommended);

  const currentLevel = cs?.approval_matrix?.find((a) => a.status === 'pending');

  const handleDecision = async (action) => {
    if ((action === 'reject' || action === 'return') && !remarks.trim()) {
      toast.warning('Remarks are required for rejection or return.');
      return;
    }
    if (action === 'approve' && !selectedVendor) {
      toast.warning(
        'No vendor selected. Please go to View Full CS and select a recommended vendor first.'
      );
      return;
    }
    setIsSubmitting(true);
    try {
      await axiosInstance.patch(endpoints.procurement_management.comparative_statement_by_id(id), {
        action,
        remarks,
        ...(action === 'approve' ? { recommended_vendor: selectedVendor?.vendor_id } : {}),
      });
      toast.success(
        action === 'approve'
          ? 'CS approved and forwarded'
          : action === 'reject'
            ? 'CS rejected'
            : 'CS returned for revision'
      );
      router.push(paths.dashboard.procurement.comparative.list);
    } catch {
      toast.error('Action failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link
            href={paths.dashboard.procurement.comparative.list}
            className="hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            CS List
          </Link>
          <span>/</span>
          <Link
            href={paths.dashboard.procurement.comparative.detail(id)}
            className="hover:text-foreground"
          >
            {cs?.cs_number}
          </Link>
          <span>/</span>
          <span className="text-foreground">Approval Review</span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-1">
              Approval Review
            </h1>
            <p className="text-sm text-muted-foreground">
              {cs?.cs_number} &mdash; {cs?.rfq_title}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href={paths.dashboard.procurement.comparative.detail(id)}>
              <Button variant="outline" size="sm">
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                View Full CS
              </Button>
            </Link>
          </div>
        </div>

        {/* CS Summary */}
        <Card className="mb-6">
          <CardHeader title="CS Summary" />
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground">Category</p>
                <p className="text-sm font-semibold">{cs?.category}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Project</p>
                <p className="text-sm font-semibold">{cs?.project}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Office</p>
                <p className="text-sm font-semibold">{cs?.office_info?.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Budget Code</p>
                <p className="text-sm font-semibold">{cs?.budget_code}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Vendors Evaluated</p>
                <p className="text-sm font-semibold">{cs?.vendors_evaluated}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Estimated Value</p>
                <p className="text-sm font-semibold">{formatBDT(cs?.total_estimated_value)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Lowest Bid</p>
                <p className="text-sm font-semibold text-success">{formatBDT(cs?.lowest_bid)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Potential Savings</p>
                <p className="text-sm font-semibold text-success">
                  {formatBDT(cs?.potential_savings)}
                </p>
              </div>
            </div>
            {cs?.auto_extracted && (
              <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-xs text-primary">
                <Zap className="w-3 h-3" />
                <span>
                  CS auto-generated from vendor financial proposals submitted against{' '}
                  {cs?.rfq_number}
                </span>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recommended Vendor Highlight */}
        <Card className="mb-6 border-success/30 bg-success/5">
          <CardHeader title="Recommended Vendor" />
          <CardBody>
            {!selectedVendor ? (
              <div className="flex items-center gap-2 text-sm text-warning">
                <AlertTriangle className="w-4 h-4" />
                No vendor selected. Please go back to View Full CS and select a recommended vendor.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {selectedVendor?.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedVendor?.location} &bull; TIN: {selectedVendor?.tin}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Enlisted: {selectedVendor?.enlisted_since}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {selectedVendor?.past_orders} past orders
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Rating: {selectedVendor?.delivery_rating}/5.0
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground">Overall Score</p>
                  <p className="text-xl font-bold text-success">
                    {selectedVendor?.overall_score ?? '—'}
                    <span className="text-sm font-normal text-muted-foreground">/100</span>
                  </p>
                  <p className="text-sm font-semibold mt-1">
                    {formatBDT(selectedVendor?.financial_proposal?.grand_total)}
                  </p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Vendor Ranking Table */}
        <Card className="mb-6">
          <CardHeader
            title="Vendor Ranking"
            description="Ranked by overall score (descending)"
          />
          <CardBody>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Rank</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Vendor</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">
                    Overall Score
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                    Financial Total (BDT)
                  </th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...(cs?.vendors ?? [])].sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0)).map((v, idx) => (
                  <tr
                    key={v.vendor_id ?? v.id ?? idx}
                    className={`border-b border-border/50 ${v.is_recommended ? 'bg-success/5' : ''}`}
                  >
                    <td className="py-2.5 px-3 font-semibold">#{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium">{v.name}</span>
                      {v.is_recommended && (
                        <Badge variant="success" size="sm" className="ml-2">
                          <Star className="w-3 h-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                    </td>
                    <td className="text-center py-2.5 px-3">
                      <span
                        className={
                          (v.overall_score ?? 0) >= 75
                            ? 'text-success font-semibold'
                            : (v.overall_score ?? 0) >= 50
                              ? 'text-warning font-semibold'
                              : 'text-destructive font-semibold'
                        }
                      >
                        {v.overall_score ?? '—'}/100
                      </span>
                    </td>
                    <td className="text-right py-2.5 px-3 font-medium">
                      {formatBDT(v.financial_proposal?.grand_total)}
                    </td>
                    <td className="text-center py-2.5 px-3">
                      {v.is_recommended ? (
                        <Badge variant="success" size="sm">
                          Selected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" size="sm">
                          Evaluated
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>

        {/* Justification */}
        <Card className="mb-6">
          <CardHeader title="Justification &amp; Recommendation" />
          <CardBody>
            <div className="mb-4">
              <p className="text-sm text-foreground leading-relaxed">
                {cs?.justification ?? cs?.description ?? ''}
              </p>
            </div>
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                <ThumbsUp className="w-3 h-3 text-success" />
                Key Points
              </h4>
              <ul className="space-y-1.5">
                {(cs?.justification_key_points ?? []).map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-warning" />
                Risks &amp; Mitigation
              </h4>
              <div className="space-y-2">
                {(cs?.risks_and_mitigation ?? []).map((r, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-xs font-semibold text-destructive/80 mb-1">Risk: {r.risk}</p>
                    <p className="text-xs text-muted-foreground">Mitigation: {r.mitigation}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Approval Workflow — TOR: 3 levels */}
        <Card className="mb-6">
          <CardHeader
            title="Approval Workflow"
            description="Multi-stage approval as per AAB Authority Matrix (TOR 1.1)"
          />
          <CardBody>
            <div className="space-y-4">
              {(cs?.approval_matrix ?? []).map((level, i) => (
                <div
                  key={level.level}
                  className={`p-4 rounded-lg border ${
                    level.status === 'approved'
                      ? 'border-success/30 bg-success/5'
                      : level.status === 'pending'
                        ? 'border-warning/30 bg-warning/5'
                        : 'border-border bg-muted/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getApprovalIcon(level.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold">
                            Level {level.level}: {level.role}
                          </h4>
                          {level.status === 'approved' && (
                            <Badge variant="success" size="sm">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Approved
                            </Badge>
                          )}
                          {level.status === 'pending' && (
                            <Badge variant="warning" size="sm">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {level.status === 'not_started' && (
                            <Badge variant="secondary" size="sm">
                              Awaiting Previous Level
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {level.name} &mdash; {level.designation}
                        </p>
                        {level.date && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Date: {level.date}
                          </p>
                        )}
                        {level.remarks && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            &ldquo;{level.remarks}&rdquo;
                          </p>
                        )}
                        {level.notification_sent && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-600">
                            <Bell className="w-3 h-3" />
                            Notification sent: {level.notification_date}
                          </div>
                        )}

                        {/* Committee members detail */}
                        {level.members && (
                          <div className="mt-3 space-y-1.5">
                            <p className="text-[10px] font-semibold text-muted-foreground">
                              Committee Members:
                            </p>
                            {level.members.map((m, mi) => (
                              <div key={mi} className="flex items-center gap-2 text-xs">
                                {m.status === 'approved' ? (
                                  <CheckCircle2 className="w-3 h-3 text-success" />
                                ) : (
                                  <Clock className="w-3 h-3 text-warning" />
                                )}
                                <span className="font-medium">{m.name}</span>
                                <span className="text-muted-foreground">({m.designation})</span>
                                <Badge
                                  variant={m.status === 'approved' ? 'success' : 'warning'}
                                  size="sm"
                                >
                                  {m.status === 'approved' ? 'Approved' : 'Pending'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Decision Section */}
        <Card className="border-primary/30">
          <CardHeader
            title="Your Decision"
            description={`You are reviewing as: ${currentLevel?.role || 'Observer'}`}
          />
          <CardBody>
            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Comments / Remarks
              </label>
              <textarea
                className="w-full min-h-[100px] p-3 border border-input rounded-lg text-sm bg-card resize-none"
                placeholder="Add your review comments, conditions, or remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Notifications will be sent automatically at each approval stage as per TOR
                  requirements.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {!selectedVendor && (
                  <p className="text-xs text-warning flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    No vendor selected — go to View Full CS to select one
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    onClick={() => handleDecision('return')}
                    disabled={isSubmitting}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    {isSubmitting ? 'Submitting...' : 'Return for Revision'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDecision('reject')}
                    disabled={isSubmitting}
                  >
                    <ThumbsDown className="w-3.5 h-3.5 mr-1.5" />
                    {isSubmitting ? 'Submitting...' : 'Reject'}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-success hover:bg-success/90"
                    onClick={() => handleDecision('approve')}
                    disabled={isSubmitting}
                  >
                    <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
                    {isSubmitting ? 'Submitting...' : 'Approve & Forward'}
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
