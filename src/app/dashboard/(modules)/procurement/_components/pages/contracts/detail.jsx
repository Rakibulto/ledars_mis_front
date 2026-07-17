'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Edit,
  User,
  Printer,
  Calendar,
  Download,
  ArrowLeft,
  Building2,
  DollarSign,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const mockContract = {
  id: 'CNT-2026-001',
  title: 'Emergency Relief Supply - Annual Framework',
  vendor: "Cox's Bazar Relief Supplies Ltd",
  vendorId: 'VND-001',
  vendorContact: 'Mohammad Reza',
  vendorPhone: '+880-341-55890',
  awardRef: 'AWD-2026-012',
  type: 'Framework Agreement',
  category: 'Goods',
  startDate: '2026-01-15',
  endDate: '2027-01-14',
  value: 4500000,
  spent: 2850000,
  status: 'active',
  office: 'Dhaka Head Office',
  paymentTerms: 'Net 30',
  renewalDue: '2026-12-14',
  createdBy: 'Amer Hamid',
  createdDate: '2026-01-10',
  approvedBy: 'Farah Kabir',
  approvedDate: '2026-01-14',
  scope:
    "Supply of emergency relief materials including tarpaulins, blankets, hygiene kits, and water purification tablets for AAB operations in Cox's Bazar district. Framework agreement with call-off orders as needed.",
  specialConditions:
    'Delivery within 72 hours of call-off order. 5% penalty per day for late delivery. All items must meet SPHERE standards.',
  amendments: [
    {
      id: 'AMD-001',
      date: '2026-03-15',
      description:
        'Value ceiling increased by ৳500,000 to accommodate additional hygiene kit requirements for camp expansion',
      previousValue: 4000000,
      newValue: 4500000,
      approvedBy: 'Farah Kabir',
      status: 'approved',
    },
  ],
  payments: [
    {
      id: 'PAY-001',
      date: '2026-02-15',
      amount: 850000,
      invoice: 'INV-2026-0034',
      status: 'paid',
      description: 'Call-off order #1 - Tarpaulins (200 pcs)',
    },
    {
      id: 'PAY-002',
      date: '2026-03-10',
      amount: 1200000,
      invoice: 'INV-2026-0047',
      status: 'paid',
      description: 'Call-off order #2 - Hygiene Kits (500 pcs)',
    },
    {
      id: 'PAY-003',
      date: '2026-04-02',
      amount: 800000,
      invoice: 'INV-2026-0062',
      status: 'processing',
      description: 'Call-off order #3 - Blankets (300 pcs) + WP Tablets',
    },
  ],
  timeline: [
    { date: '2026-01-10', event: 'Contract drafted', user: 'Amer Hamid' },
    { date: '2026-01-14', event: 'Approved by Country Director', user: 'Farah Kabir' },
    { date: '2026-01-15', event: 'Contract activated', user: 'System' },
    { date: '2026-02-15', event: 'First call-off order placed', user: 'Nusrat Jahan' },
    { date: '2026-03-15', event: 'Amendment AMD-001 approved', user: 'Farah Kabir' },
    { date: '2026-04-02', event: 'Third call-off order placed', user: 'Nusrat Jahan' },
  ],
};
export function ContractDetail() {
  const { id } = useParams();
  const utilPct = Math.round((mockContract.spent / mockContract.value) * 100);
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <Link
          href={paths.dashboard.procurement.contracts.root}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Contracts
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                {mockContract.id}
              </h1>
              <Badge variant="success">Active</Badge>
              <Badge variant="outline">{mockContract.type}</Badge>
            </div>
            <p className="text-lg text-foreground">{mockContract.title}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {mockContract.office} • {mockContract.category}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={paths.dashboard.procurement.contracts.amendment(mockContract.id)}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Amend
              </Button>
            </Link>
            <Link href={paths.dashboard.procurement.contracts.renewal(mockContract.id)}>
              <Button variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Renew
              </Button>
            </Link>
            <Button variant="ghost">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="ghost">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody>
            <div className="text-center">
              <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-semibold">৳{(mockContract.value / 1000000).toFixed(2)}M</p>
              <p className="text-xs text-muted-foreground">Contract Value</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-semibold">৳{(mockContract.spent / 1000000).toFixed(2)}M</p>
              <p className="text-xs text-muted-foreground">Total Spent</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <DollarSign className="w-6 h-6 text-orange-600 mx-auto mb-1" />
              <p className="text-xl font-semibold">
                ৳{((mockContract.value - mockContract.spent) / 1000000).toFixed(2)}M
              </p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <AlertTriangle
                className={`w-6 h-6 mx-auto mb-1 ${utilPct >= 80 ? 'text-red-600' : 'text-purple-600'}`}
              />
              <p className="text-xl font-semibold">{utilPct}%</p>
              <p className="text-xs text-muted-foreground">Utilization</p>
              <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                <div
                  className={`rounded-full h-1.5 ${utilPct >= 80 ? 'bg-destructive' : 'bg-primary'}`}
                  style={{ width: `${utilPct}%` }}
                />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Scope */}
          <Card>
            <CardHeader title="Scope of Work" />
            <CardBody>
              <p className="text-sm text-foreground leading-relaxed">{mockContract.scope}</p>
            </CardBody>
          </Card>

          {/* Special Conditions */}
          <Card>
            <CardHeader title="Special Conditions" />
            <CardBody>
              <p className="text-sm text-foreground leading-relaxed">
                {mockContract.specialConditions}
              </p>
            </CardBody>
          </Card>

          {/* Amendments */}
          <Card>
            <CardHeader
              title="Amendments"
              action={<Badge variant="outline">{mockContract.amendments.length}</Badge>}
            />
            <CardBody>
              {mockContract.amendments.map((amd) => (
                <div key={amd.id} className="p-4 bg-secondary/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{amd.id}</span>
                      <Badge variant="success" size="sm">
                        {amd.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{amd.date}</span>
                  </div>
                  <p className="text-sm text-foreground mb-2">{amd.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Previous: ৳{(amd.previousValue / 1000000).toFixed(2)}M</span>
                    <span>→</span>
                    <span className="font-medium text-foreground">
                      New: ৳{(amd.newValue / 1000000).toFixed(2)}M
                    </span>
                    <span>Approved by: {amd.approvedBy}</span>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader title="Payment History" description="Payments against this contract" />
            <CardBody>
              <table className="w-full">
                <thead className="border-b-2 border-border">
                  <tr className="text-left">
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">ID</th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                      Description
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                      Amount
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                      Invoice
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">Date</th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockContract.payments.map((pay) => (
                    <tr key={pay.id} className="border-b border-border">
                      <td className="py-3 pr-3 text-sm font-medium text-primary">{pay.id}</td>
                      <td className="py-3 pr-3 text-sm text-foreground">{pay.description}</td>
                      <td className="py-3 pr-3 text-sm font-medium text-foreground text-right">
                        ৳{(pay.amount / 1000).toFixed(0)}K
                      </td>
                      <td className="py-3 pr-3 text-sm text-muted-foreground">{pay.invoice}</td>
                      <td className="py-3 pr-3 text-sm text-muted-foreground">{pay.date}</td>
                      <td className="py-3 text-center">
                        <Badge variant={pay.status === 'paid' ? 'success' : 'warning'} size="sm">
                          {pay.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Contract Details" />
            <CardBody>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium">
                    {mockContract.startDate} → {mockContract.endDate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Terms</p>
                  <p className="text-sm font-medium">{mockContract.paymentTerms}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Award Reference</p>
                  <Link
                    href={paths.dashboard.procurement.awards.root}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {mockContract.awardRef}
                  </Link>
                </div>
                {mockContract.renewalDue && (
                  <div>
                    <p className="text-xs text-muted-foreground">Renewal Due</p>
                    <p className="text-sm font-medium text-orange-600">{mockContract.renewalDue}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Vendor" />
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{mockContract.vendor}</p>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-foreground">{mockContract.vendorContact}</p>
                </div>
                <div className="text-xs text-muted-foreground">{mockContract.vendorPhone}</div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Approval Info" />
            <CardBody>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Created By</p>
                  <p className="text-sm font-medium">
                    {mockContract.createdBy} • {mockContract.createdDate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Approved By</p>
                  <p className="text-sm font-medium">
                    {mockContract.approvedBy} • {mockContract.approvedDate}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Activity Timeline" />
            <CardBody>
              <div className="space-y-3">
                {mockContract.timeline.map((t, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-foreground">{t.event}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.user} • {t.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
