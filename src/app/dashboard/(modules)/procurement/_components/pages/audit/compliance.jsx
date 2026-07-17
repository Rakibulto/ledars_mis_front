'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Clock, Shield, XCircle, FileText, Download, RefreshCw, CheckCircle } from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
// import { Link } from 'react-router';
// Mock compliance data
const complianceCategories = [
  {
    id: 'proc-policy',
    name: 'Procurement Policy Compliance',
    description: 'Adherence to AAB procurement policy and donor requirements',
    score: 94,
    totalChecks: 48,
    passed: 45,
    failed: 2,
    pending: 1,
    lastChecked: '2026-04-04',
    items: [
      {
        id: 1,
        rule: 'Minimum 3 quotations for purchases above BDT 50,000',
        status: 'passed',
        details: '42/42 compliant',
      },
      {
        id: 2,
        rule: 'Comparative Statement prepared for all eligible purchases',
        status: 'passed',
        details: '38/38 compliant',
      },
      {
        id: 3,
        rule: 'Work Orders issued before delivery',
        status: 'failed',
        details: '2 WOs issued after delivery date',
      },
      {
        id: 4,
        rule: 'Approval chain completed before PO issuance',
        status: 'passed',
        details: '35/35 compliant',
      },
      {
        id: 5,
        rule: 'Vendor evaluation completed before award',
        status: 'passed',
        details: '28/28 compliant',
      },
      {
        id: 6,
        rule: 'Budget availability confirmed before commitment',
        status: 'failed',
        details: '1 commitment without budget check',
      },
      {
        id: 7,
        rule: 'RFQ distributed to minimum 5 vendors',
        status: 'pending',
        details: 'Awaiting Q2 data compilation',
      },
    ],
  },
  {
    id: 'vendor-compliance',
    name: 'Vendor Compliance',
    description: 'Vendor documentation, registration, and performance standards',
    score: 88,
    totalChecks: 35,
    passed: 31,
    failed: 3,
    pending: 1,
    lastChecked: '2026-04-03',
    items: [
      {
        id: 1,
        rule: 'All active vendors have valid trade licenses',
        status: 'failed',
        details: '3 vendors have expired licenses',
      },
      {
        id: 2,
        rule: 'Vendor bank account details verified',
        status: 'passed',
        details: '52/52 verified',
      },
      {
        id: 3,
        rule: 'Annual vendor performance review completed',
        status: 'passed',
        details: '48/52 completed',
      },
      {
        id: 4,
        rule: 'Vendor tax certificates (TIN/BIN) on file',
        status: 'failed',
        details: '2 missing TIN certificates',
      },
      {
        id: 5,
        rule: 'Vendor conflict of interest declarations collected',
        status: 'passed',
        details: '52/52 collected',
      },
      {
        id: 6,
        rule: 'Blacklisted vendors excluded from active RFQs',
        status: 'passed',
        details: '100% compliant',
      },
    ],
  },
  {
    id: 'financial-compliance',
    name: 'Financial & Tax Compliance',
    description: 'VAT/Tax deductions, payment processing, and financial controls',
    score: 97,
    totalChecks: 42,
    passed: 41,
    failed: 1,
    pending: 0,
    lastChecked: '2026-04-04',
    items: [
      {
        id: 1,
        rule: 'VAT deducted at source per NBR regulations',
        status: 'passed',
        details: '156/156 payments compliant',
      },
      {
        id: 2,
        rule: 'TDS applied per Income Tax Ordinance',
        status: 'passed',
        details: '156/156 payments compliant',
      },
      {
        id: 3,
        rule: 'Payment within 30 days of GRN verification',
        status: 'failed',
        details: '3 payments exceeded 30-day SLA',
      },
      {
        id: 4,
        rule: 'Dual authorization for payments above BDT 100,000',
        status: 'passed',
        details: '28/28 compliant',
      },
      {
        id: 5,
        rule: 'Bank reconciliation completed monthly',
        status: 'passed',
        details: 'Up to date through March 2026',
      },
    ],
  },
  {
    id: 'inventory-compliance',
    name: 'Inventory & Asset Compliance',
    description: 'Stock management, asset tracking, and warehouse operations',
    score: 91,
    totalChecks: 28,
    passed: 25,
    failed: 2,
    pending: 1,
    lastChecked: '2026-04-02',
    items: [
      {
        id: 1,
        rule: 'Physical stock count matches system records',
        status: 'passed',
        details: 'Last count: March 28, 2026 — 98.5% accuracy',
      },
      {
        id: 2,
        rule: 'Fixed assets tagged and registered',
        status: 'failed',
        details: '5 newly received assets pending tagging',
      },
      {
        id: 3,
        rule: 'GRN verification within 48 hours of receipt',
        status: 'passed',
        details: '45/47 verified on time',
      },
      {
        id: 4,
        rule: 'Inter-warehouse transfers documented',
        status: 'passed',
        details: '12/12 transfers documented',
      },
      {
        id: 5,
        rule: 'Expired/damaged items written off with approval',
        status: 'pending',
        details: 'Q1 write-off pending committee approval',
      },
      {
        id: 6,
        rule: 'Minimum stock levels maintained',
        status: 'failed',
        details: '8 items below minimum threshold',
      },
    ],
  },
  {
    id: 'access-security',
    name: 'Access & Security Compliance',
    description: 'User access controls, authentication, and data security',
    score: 96,
    totalChecks: 20,
    passed: 19,
    failed: 1,
    pending: 0,
    lastChecked: '2026-04-04',
    items: [
      {
        id: 1,
        rule: 'All users have role-based access (no shared accounts)',
        status: 'passed',
        details: '100% unique accounts',
      },
      {
        id: 2,
        rule: 'Password rotation enforced (90-day policy)',
        status: 'passed',
        details: '45/47 compliant',
      },
      {
        id: 3,
        rule: 'Failed login attempts monitored and locked',
        status: 'passed',
        details: '3 accounts locked this month',
      },
      {
        id: 4,
        rule: 'Inactive accounts disabled after 60 days',
        status: 'failed',
        details: '2 inactive accounts still enabled',
      },
      {
        id: 5,
        rule: 'Audit log retention (minimum 3 years)',
        status: 'passed',
        details: 'Full history since system launch',
      },
    ],
  },
];
const expiringDocuments = [
  {
    id: 1,
    vendor: 'Premium Office Solutions Ltd',
    document: 'Trade License',
    expiryDate: '2026-04-15',
    daysLeft: 11,
    status: 'expiring-soon',
  },
  {
    id: 2,
    vendor: 'BuildPro Construction Co',
    document: 'VAT Registration Certificate',
    expiryDate: '2026-04-22',
    daysLeft: 18,
    status: 'expiring-soon',
  },
  {
    id: 3,
    vendor: 'MediCare Equipment Supplies',
    document: 'TIN Certificate',
    expiryDate: '2026-05-01',
    daysLeft: 27,
    status: 'attention',
  },
  {
    id: 4,
    vendor: 'Global Logistics Services',
    document: 'Insurance Policy',
    expiryDate: '2026-04-08',
    daysLeft: 4,
    status: 'critical',
  },
  {
    id: 5,
    vendor: 'TechSupply Global Inc',
    document: 'ISO 9001 Certification',
    expiryDate: '2026-06-30',
    daysLeft: 87,
    status: 'ok',
  },
];
const getScoreColor = (score) => {
  if (score >= 95) return 'text-green-600';
  if (score >= 85) return 'text-blue-600';
  if (score >= 70) return 'text-orange-600';
  return 'text-red-600';
};
const getScoreBg = (score) => {
  if (score >= 95) return 'bg-green-50 border-green-200';
  if (score >= 85) return 'bg-blue-50 border-blue-200';
  if (score >= 70) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
};
export function ComplianceDashboard() {
  const [expandedCategory, setExpandedCategory] = useState('proc-policy');
  const overallScore = Math.round(
    complianceCategories.reduce((sum, c) => sum + c.score, 0) / complianceCategories.length
  );
  const totalPassed = complianceCategories.reduce((sum, c) => sum + c.passed, 0);
  const totalFailed = complianceCategories.reduce((sum, c) => sum + c.failed, 0);
  const totalPending = complianceCategories.reduce((sum, c) => sum + c.pending, 0);
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
            Compliance Dashboard
          </h1>
          <p className="text-muted-foreground">
            Statutory requirements, policy adherence, and compliance tracking
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={paths.dashboard.procurement.audit.log}>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              View Audit Log
            </Button>
          </Link>
          <Link href={paths.dashboard.procurement.audit.export}>
            <Button variant="primary">
              <Download className="w-4 h-4 mr-2" />
              Export Compliance Report
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Overall Compliance Score"
          value={`${overallScore}%`}
          icon={Shield}
          color="green"
          trend={{ value: '+2% from last month', isPositive: true }}
        />
        <StatCard
          title="Checks Passed"
          value={totalPassed}
          icon={CheckCircle}
          color="blue"
          trend={{
            value: `of ${totalPassed + totalFailed + totalPending} total`,
            isPositive: true,
          }}
        />
        <StatCard
          title="Failed Checks"
          value={totalFailed}
          icon={XCircle}
          color="red"
          trend={{ value: 'Requires attention', isPositive: false }}
        />
        <StatCard
          title="Pending Reviews"
          value={totalPending}
          icon={Clock}
          color="orange"
          trend={{ value: 'Awaiting verification', isPositive: false }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Categories */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          {complianceCategories.map((category) => (
            <Card key={category.id}>
              <div
                className="cursor-pointer"
                onClick={() =>
                  setExpandedCategory(expandedCategory === category.id ? null : category.id)
                }
              >
                <CardBody>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center ${getScoreBg(category.score)}`}
                      >
                        <span className={`text-lg font-bold ${getScoreColor(category.score)}`}>
                          {category.score}%
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{category.name}</h3>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="success" size="sm">
                        {category.passed} Passed
                      </Badge>
                      {category.failed > 0 && (
                        <Badge variant="danger" size="sm">
                          {category.failed} Failed
                        </Badge>
                      )}
                      {category.pending > 0 && (
                        <Badge variant="warning" size="sm">
                          {category.pending} Pending
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-success rounded-full h-2 transition-all"
                      style={{ width: `${category.score}%` }}
                    />
                  </div>
                </CardBody>
              </div>

              {/* Expanded items */}
              {expandedCategory === category.id && (
                <div className="border-t border-border px-6 pb-4">
                  <div className="space-y-2 mt-4">
                    {category.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          item.status === 'passed'
                            ? 'bg-success/5 border-success/20'
                            : item.status === 'failed'
                              ? 'bg-destructive/5 border-destructive/20'
                              : 'bg-warning/5 border-warning/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.status === 'passed' ? (
                            <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                          ) : item.status === 'failed' ? (
                            <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-warning flex-shrink-0" />
                          )}
                          <p className="text-sm text-foreground">{item.rule}</p>
                        </div>
                        <span
                          className={`text-xs font-medium whitespace-nowrap ml-4 ${
                            item.status === 'passed'
                              ? 'text-success'
                              : item.status === 'failed'
                                ? 'text-destructive'
                                : 'text-warning'
                          }`}
                        >
                          {item.details}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Expiring Documents */}
          <Card>
            <CardHeader
              title="Expiring Documents"
              description="Vendor documents requiring renewal"
              action={
                <Badge variant="warning" size="sm">
                  {expiringDocuments.filter((d) => d.daysLeft <= 30).length} Expiring
                </Badge>
              }
            />
            <CardBody>
              <div className="space-y-3">
                {expiringDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-3 rounded-lg border ${
                      doc.daysLeft <= 7
                        ? 'bg-destructive/5 border-destructive/20'
                        : doc.daysLeft <= 30
                          ? 'bg-warning/5 border-warning/20'
                          : 'bg-secondary/50 border-border'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-foreground">{doc.vendor}</p>
                      {doc.daysLeft <= 7 ? (
                        <Badge variant="danger" size="sm">
                          {doc.daysLeft}d
                        </Badge>
                      ) : doc.daysLeft <= 30 ? (
                        <Badge variant="warning" size="sm">
                          {doc.daysLeft}d
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">
                          {doc.daysLeft}d
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{doc.document}</p>
                    <p className="text-xs text-muted-foreground mt-1">Expires: {doc.expiryDate}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader title="Compliance Summary" />
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Full Audit</span>
                  <span className="text-sm font-medium text-foreground">March 15, 2026</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Next Scheduled Audit</span>
                  <span className="text-sm font-medium text-foreground">June 15, 2026</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Audit Period</span>
                  <span className="text-sm font-medium text-foreground">FY 2025-2026</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Compliance Officer</span>
                  <span className="text-sm font-medium text-foreground">Kamal Hossain</span>
                </div>
                <div className="border-t border-border pt-4">
                  <Button variant="outline" className="w-full" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Compliance Check
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
