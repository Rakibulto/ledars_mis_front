'use client';

import Link from 'next/link';
import {
  Plus,
  Send,
  Clock,
  FileText,
  Banknote,
  CreditCard,
  ArrowRight,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';

import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { StatCard } from '../components/stat-card';
import { Card, CardBody, CardHeader } from '../components/ui/card';
const formatBDT = (amount) => {
  if (amount >= 10000000) return `৳${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(2)} L`;
  return `৳${amount.toLocaleString('en-IN')}`;
};
export function PaymentRequisitions() {
  // Summary KPIs
  const kpis = {
    totalPRFs: 12,
    pendingApproval: 4,
    approvedForTreasury: 3,
    treasuryProcessing: 2,
    paid: 2,
    rejected: 1,
    totalValue: 3245000,
    pendingValue: 1875000,
  };
  const recentPRFs = [
    {
      id: 'PRF-AAB-2026-012',
      vendor: 'TechBD Solutions Ltd',
      amount: 485000,
      status: 'pending-supervisor',
      date: '2026-04-03',
    },
    {
      id: 'PRF-AAB-2026-011',
      vendor: 'Dhaka Office Mart',
      amount: 125000,
      status: 'pending-finance',
      date: '2026-04-02',
    },
    {
      id: 'PRF-AAB-2026-010',
      vendor: 'BuildRight Construction',
      amount: 875000,
      status: 'approved-treasury',
      date: '2026-04-01',
    },
    {
      id: 'PRF-AAB-2026-009',
      vendor: 'Relief Supplies BD',
      amount: 345000,
      status: 'treasury-processing',
      date: '2026-03-30',
    },
    {
      id: 'PRF-AAB-2026-008',
      vendor: 'Green Medical Ltd',
      amount: 215000,
      status: 'paid',
      date: '2026-03-28',
    },
  ];
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending-supervisor':
        return <Badge variant="warning">Pending Supervisor</Badge>;
      case 'pending-finance':
        return <Badge variant="warning">Pending Finance</Badge>;
      case 'pending-hof':
        return <Badge variant="warning">Pending Head of Finance</Badge>;
      case 'approved-treasury':
        return <Badge variant="default">Approved → Treasury</Badge>;
      case 'treasury-processing':
        return <Badge variant="default">Treasury Processing</Badge>;
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Payment Request Form (PRF) Dashboard
          </h1>
          <p className="text-muted-foreground">
            Ledars NGO — Initiate, track & manage vendor payment requisitions
          </p>
        </div>
        <Link href="/payment-requisitions/create">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Create New PRF
          </Button>
        </Link>
      </div>

      {/* Workflow Overview */}
      <Card className="mb-6 bg-primary/5 border-primary/20">
        <CardBody>
          <p className="text-sm font-medium text-foreground mb-3">
            PRF Workflow — Authority Matrix
          </p>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 rounded-full text-primary font-medium">
              <FileText className="w-3 h-3" /> PRF Initiated
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-1 px-3 py-1.5 bg-warning/10 rounded-full text-warning font-medium">
              <ShieldCheck className="w-3 h-3" /> Supervisor Endorses
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-1 px-3 py-1.5 bg-warning/10 rounded-full text-warning font-medium">
              <ShieldCheck className="w-3 h-3" /> Finance Verifies
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-1 px-3 py-1.5 bg-success/10 rounded-full text-success font-medium">
              <CheckCircle className="w-3 h-3" /> HoF / CD Approves
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 rounded-full text-primary font-medium">
              <Banknote className="w-3 h-3" /> Treasury Processes
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-1 px-3 py-1.5 bg-success/10 rounded-full text-success font-medium">
              <Send className="w-3 h-3" /> Vendor Paid & Notified
            </div>
          </div>
        </CardBody>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total PRFs"
          value={kpis.totalPRFs.toString()}
          icon={FileText}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Pending Approval"
          value={kpis.pendingApproval.toString()}
          icon={Clock}
          className="border-l-4 border-l-warning"
        />
        <StatCard
          title="Treasury Processing"
          value={kpis.treasuryProcessing.toString()}
          icon={Banknote}
          className="border-l-4 border-l-primary"
        />
        <StatCard
          title="Paid This Month"
          value={kpis.paid.toString()}
          icon={CheckCircle}
          className="border-l-4 border-l-success"
        />
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card className="border-l-4 border-l-primary">
          <CardBody>
            <p className="text-sm text-muted-foreground mb-1">Total PRF Value (FY 2025-26)</p>
            <p className="text-3xl font-bold text-foreground">{formatBDT(kpis.totalValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Across {kpis.totalPRFs} payment requests
            </p>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardBody>
            <p className="text-sm text-muted-foreground mb-1">Pending Approval Amount</p>
            <p className="text-3xl font-bold text-warning">{formatBDT(kpis.pendingValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.pendingApproval} PRFs awaiting action
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Recent PRFs */}
      <Card className="mb-6">
        <CardHeader
          title="Recent Payment Requests"
          description="Latest PRFs with current status"
          action={
            <Link href="/payment-requisitions/list">
              <Button variant="outline" size="sm">
                View All PRFs
              </Button>
            </Link>
          }
        />
        <CardBody>
          <div className="space-y-3">
            {recentPRFs.map((prf) => (
              <Link key={prf.id} href={`/payment-requisitions/${prf.id}`}>
                <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{prf.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {prf.vendor} — {prf.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold text-foreground">{formatBDT(prf.amount)}</p>
                    {getStatusBadge(prf.status)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <Link href="/payment-requisitions/create">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Create New PRF</p>
                  <p className="text-xs text-muted-foreground">Initiate payment request</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Link>
        <Link href="/payment-requisitions/list">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Pending Approvals</p>
                  <p className="text-xs text-muted-foreground">
                    {kpis.pendingApproval} PRFs need action
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Link>
        <Link href="/treasury">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Treasury Queue</p>
                  <p className="text-xs text-muted-foreground">
                    {kpis.treasuryProcessing} payments processing
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Link>
      </div>
    </div>
  );
}
