'use client';

import Link from 'next/link';
import {
  Box,
  Users,
  Scale,
  Clock,
  Shield,
  Package,
  Download,
  Activity,
  Banknote,
  BarChart3,
  Clipboard,
  TrendingUp,
  CreditCard,
  FolderOpen,
  DollarSign,
  ArrowRight,
  CheckCircle,
  ClipboardList,
  MessageSquare,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardBody, CardHeader } from '../components/ui/card';
function formatBDT(amount) {
  if (amount >= 10000000) return `৳${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `৳${(amount / 1000).toFixed(1)}K`;
  return `৳${amount.toLocaleString('en-IN')}`;
}
export function Reports() {
  // Real-time pipeline summary
  const pipelineSummary = {
    totalRequisitions: 187,
    activeRFQs: 14,
    pendingCS: 6,
    activeWOs: 18,
    pendingGRN: 8,
    pendingPRF: 9,
    treasuryQueue: 4,
    totalProcurementValue: 285000000,
  };
  const dashboardTiles = [
    {
      id: 'pipeline',
      title: 'Procurement Pipeline',
      description: 'End-to-end procurement tracking from requisition to payment',
      icon: TrendingUp,
      color: 'bg-primary/10 text-primary',
      borderColor: 'border-l-primary',
      link: '/reports/requisitions',
      stats: [
        { label: 'Total Requisitions', value: '187', trend: '+12 this month' },
        { label: 'In Progress', value: '34', trend: '18% of total' },
      ],
    },
    {
      id: 'vendor',
      title: 'Vendor Performance',
      description: 'Vendor participation, delivery, and quality metrics',
      icon: Users,
      color: 'bg-success/10 text-success',
      borderColor: 'border-l-success',
      link: '/reports/vendor-participation',
      stats: [
        { label: 'Active Vendors', value: '38', trend: '৳28.5 Cr awarded' },
        { label: 'Avg Participation', value: '76%', trend: '+4% vs Q3' },
      ],
    },
    {
      id: 'rfq',
      title: 'RFQ Status',
      description: 'Request for Quotation issuance, response, and closure tracking',
      icon: MessageSquare,
      color: 'bg-warning/10 text-warning',
      borderColor: 'border-l-warning',
      link: '/reports/rfq',
      stats: [
        { label: 'Total RFQs', value: '92', trend: '14 active now' },
        { label: 'Avg Response Rate', value: '82%', trend: '+6% improvement' },
      ],
    },
    {
      id: 'cs',
      title: 'CS Summary',
      description: 'Comparative Statement analysis and award recommendations',
      icon: Scale,
      color: 'bg-purple-500/10 text-purple-600',
      borderColor: 'border-l-purple-500',
      link: '/reports/comparative-statements',
      stats: [
        { label: 'Total CS Prepared', value: '68', trend: '6 pending approval' },
        { label: 'Avg Vendors/CS', value: '4.2', trend: 'Above minimum 3' },
      ],
    },
    {
      id: 'wopo',
      title: 'WO/PO Tracking',
      description: 'Work Order and Purchase Order lifecycle monitoring',
      icon: Clipboard,
      color: 'bg-blue-500/10 text-blue-600',
      borderColor: 'border-l-blue-500',
      link: '/reports/work-orders',
      stats: [
        { label: 'Active WO/PO', value: '18', trend: `${formatBDT(42500000)} value` },
        { label: 'Completed', value: '58', trend: '76% completion rate' },
      ],
    },
    {
      id: 'grn',
      title: 'GRN & Warehouse Stock',
      description: 'Goods Received Notes and warehouse inventory levels',
      icon: Package,
      color: 'bg-teal-500/10 text-teal-600',
      borderColor: 'border-l-teal-500',
      link: '/reports/inventory-received',
      stats: [
        { label: 'Total GRNs', value: '62', trend: '8 pending verification' },
        { label: 'Stock Value', value: formatBDT(18500000), trend: '42 low stock alerts' },
      ],
    },
    {
      id: 'prf',
      title: 'PRF & Payment Status',
      description: 'Payment Request Form lifecycle and vendor payment tracking',
      icon: Banknote,
      color: 'bg-emerald-500/10 text-emerald-600',
      borderColor: 'border-l-emerald-500',
      link: '/reports/payments',
      stats: [
        { label: 'Total PRFs', value: '94', trend: '9 in approval chain' },
        { label: 'Paid Value', value: formatBDT(195000000), trend: '4 in treasury' },
      ],
    },
    {
      id: 'audit',
      title: 'Audit Logs',
      description: 'System audit trail, user actions, and compliance tracking',
      icon: Shield,
      color: 'bg-slate-500/10 text-slate-600',
      borderColor: 'border-l-slate-500',
      link: '/reports/audit-logs',
      stats: [
        { label: 'Total Actions', value: '2,847', trend: 'Last 30 days' },
        { label: 'Flagged Events', value: '3', trend: 'Requires review' },
      ],
    },
    {
      id: 'project',
      title: 'Project-wise Procurement',
      description: 'Procurement summary by project code and funding source',
      icon: FolderOpen,
      color: 'bg-indigo-500/10 text-indigo-600',
      borderColor: 'border-l-indigo-500',
      link: '/reports/project-procurement',
      stats: [
        { label: 'Active Projects', value: '12', trend: '5 donors tracked' },
        { label: 'Total Procurement', value: formatBDT(285000000), trend: 'FY 2025-26' },
      ],
    },
    {
      id: 'budget',
      title: 'Budget vs Procurement',
      description: 'Budget allocation, utilization, and variance analysis',
      icon: DollarSign,
      color: 'bg-rose-500/10 text-rose-600',
      borderColor: 'border-l-rose-500',
      link: '/reports/budget',
      stats: [
        { label: 'Total Budget', value: formatBDT(350000000), trend: '92% utilized' },
        { label: 'Available', value: formatBDT(28000000), trend: '8% remaining' },
      ],
    },
  ];
  // Real-time pipeline stages
  const pipelineStages = [
    { stage: 'Requisitions', count: 187, active: 12, icon: ClipboardList, color: 'text-blue-600' },
    { stage: 'RFQ', count: 92, active: 14, icon: MessageSquare, color: 'text-amber-600' },
    { stage: 'CS/Award', count: 68, active: 6, icon: Scale, color: 'text-purple-600' },
    { stage: 'WO/PO', count: 76, active: 18, icon: Clipboard, color: 'text-cyan-600' },
    { stage: 'GRN', count: 62, active: 8, icon: Package, color: 'text-teal-600' },
    { stage: 'PRF', count: 94, active: 9, icon: Banknote, color: 'text-green-600' },
    { stage: 'Treasury', count: 85, active: 4, icon: CreditCard, color: 'text-emerald-600' },
  ];
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-1">Reporting & Dashboards</h1>
            <p className="text-muted-foreground">
              Real-time procurement analytics — Ledars NGO FY 2025-26
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export All Excel
            </Button>
            <Button variant="primary" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export All PDF
            </Button>
          </div>
        </div>

        {/* Real-time Pipeline Flow */}
        <Card className="mb-6">
          <CardHeader
            title="Real-time Procurement Pipeline"
            description="Live status across all procurement stages"
          />
          <CardBody>
            <div className="flex items-center justify-between gap-2">
              {pipelineStages.map((stage, idx) => (
                <div key={stage.stage} className="flex items-center gap-2">
                  <div className="text-center flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-1 ${stage.color}`}
                    >
                      <stage.icon className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium text-foreground truncate">{stage.stage}</p>
                    <p className="text-lg font-bold text-foreground">{stage.count}</p>
                    <Badge
                      variant={stage.active > 10 ? 'warning' : 'success'}
                      className="text-[10px]"
                    >
                      {stage.active} active
                    </Badge>
                  </div>
                  {idx < pipelineStages.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Top-level KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-primary">
            <CardBody className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Procurement Value</p>
                  <p className="text-xl font-bold text-primary">
                    {formatBDT(pipelineSummary.totalProcurementValue)}
                  </p>
                </div>
                <Activity className="w-6 h-6 text-primary" />
              </div>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-success">
            <CardBody className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Completed Payments</p>
                  <p className="text-xl font-bold text-success">85</p>
                </div>
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-warning">
            <CardBody className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Actions</p>
                  <p className="text-xl font-bold text-warning">23</p>
                </div>
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-error">
            <CardBody className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Alerts / Overdue</p>
                  <p className="text-xl font-bold text-error">5</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-error" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Dashboard Tiles — 10 TOR-required dashboards */}
        <div className="grid grid-cols-2 gap-5 mb-6">
          {dashboardTiles.map((tile) => (
            <Link key={tile.id} href={tile.link} className="block">
              <Card
                className={`border-l-4 ${tile.borderColor} hover:border-primary/50 transition-all hover:shadow-md`}
              >
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-11 h-11 rounded-lg ${tile.color} flex items-center justify-center flex-shrink-0`}
                    >
                      <tile.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-foreground">{tile.title}</h3>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{tile.description}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {tile.stats.map((stat, i) => (
                          <div key={i} className="bg-muted/50 rounded-md px-2 py-1.5">
                            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                            <p className="text-sm font-bold text-foreground">{stat.value}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {stat.trend}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>

        {/* Export & Quick Access */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardBody className="text-center py-6">
              <BarChart3 className="w-10 h-10 text-primary mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-foreground mb-1">Fixed Asset Register</h3>
              <p className="text-xs text-muted-foreground mb-3">
                245 assets — {formatBDT(42500000)} net value
              </p>
              <Link href="/reports/fixed-assets">
                <Button variant="outline" size="sm">
                  View Report
                </Button>
              </Link>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-6">
              <Box className="w-10 h-10 text-warning mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-foreground mb-1">Consumable Stock</h3>
              <p className="text-xs text-muted-foreground mb-3">385 items — 42 low stock alerts</p>
              <Link href="/reports/consumables">
                <Button variant="outline" size="sm">
                  View Report
                </Button>
              </Link>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-6">
              <FileSpreadsheet className="w-10 h-10 text-success mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-foreground mb-1">Vendor Awards</h3>
              <p className="text-xs text-muted-foreground mb-3">
                52 awards — {formatBDT(285000000)} total
              </p>
              <Link href="/reports/vendor-awards">
                <Button variant="outline" size="sm">
                  View Report
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
