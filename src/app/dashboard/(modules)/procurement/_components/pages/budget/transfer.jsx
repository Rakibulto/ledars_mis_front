'use client';

import { Save, ArrowLeft, DollarSign, AlertTriangle, ArrowLeftRight } from 'lucide-react';

import { Link } from 'src/shims/react-router';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const recentTransfers = [
  {
    id: 'BT-001',
    from: 'Vehicle & Transport (5600)',
    to: 'Emergency Relief (5400)',
    amount: 300000,
    date: '2026-03-15',
    status: 'approved',
    approvedBy: 'Farah Kabir',
  },
  {
    id: 'BT-002',
    from: 'IT & Equipment (5500)',
    to: 'Procurement of Goods (5100)',
    amount: 150000,
    date: '2026-02-20',
    status: 'approved',
    approvedBy: 'Amer Hamid',
  },
  {
    id: 'BT-003',
    from: 'Service Contracts (5300)',
    to: 'Construction & Works (5200)',
    amount: 500000,
    date: '2026-01-10',
    status: 'approved',
    approvedBy: 'Farah Kabir',
  },
];
export function BudgetTransfer() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          to="/budget"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Budget
        </Link>
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Budget Transfer Request</h1>
            <p className="text-muted-foreground">Transfer budget allocation between budget lines</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Transfer Form */}
          <Card>
            <CardHeader
              title="Transfer Details"
              description="Specify source and destination budget lines"
            />
            <CardBody>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      From Budget Line *
                    </label>
                    <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Select source budget line...</option>
                      <option value="5100">5100 - Procurement of Goods (৳4.8M available)</option>
                      <option value="5200">5200 - Construction & Works (৳0.3M available)</option>
                      <option value="5300">5300 - Service Contracts (৳1.4M available)</option>
                      <option value="5400">5400 - Emergency Relief (৳1.7M available)</option>
                      <option value="5500">5500 - IT & Equipment (৳0.15M available)</option>
                      <option value="5600">5600 - Vehicle & Transport (৳0.8M available)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      To Budget Line *
                    </label>
                    <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Select destination budget line...</option>
                      <option value="5100">5100 - Procurement of Goods</option>
                      <option value="5200">5200 - Construction & Works</option>
                      <option value="5300">5300 - Service Contracts</option>
                      <option value="5400">5400 - Emergency Relief</option>
                      <option value="5500">5500 - IT & Equipment</option>
                      <option value="5600">5600 - Vehicle & Transport</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Transfer Amount (BDT) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Justification *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide detailed justification for the budget reallocation..."
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Supporting Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MR-2026-0138, WO-2026-045"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Recent Transfers */}
          <Card>
            <CardHeader title="Recent Budget Transfers" />
            <CardBody>
              <table className="w-full">
                <thead className="border-b-2 border-border">
                  <tr className="text-left">
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">ID</th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                      From → To
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                      Amount
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">Date</th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransfers.map((t) => (
                    <tr key={t.id} className="border-b border-border">
                      <td className="py-3 pr-3 text-sm font-medium text-primary">{t.id}</td>
                      <td className="py-3 pr-3 text-sm text-foreground">
                        {t.from} → {t.to}
                      </td>
                      <td className="py-3 pr-3 text-sm font-medium text-right">
                        ৳{(t.amount / 1000).toFixed(0)}K
                      </td>
                      <td className="py-3 pr-3 text-sm text-muted-foreground">{t.date}</td>
                      <td className="py-3 text-center">
                        <Badge variant="success" size="sm">
                          {t.status}
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
            <CardHeader title="Actions" />
            <CardBody>
              <div className="space-y-3">
                <Button variant="primary" className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button variant="success" className="w-full">
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Submit for Approval
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card className="border-warning/30 bg-warning/5">
            <CardBody>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Transfer Rules</p>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li>• Transfer must not exceed available balance of source line</li>
                    <li>• Transfers above ৳500K require CD approval</li>
                    <li>• Maximum 3 transfers per budget line per quarter</li>
                    <li>• Cross-office transfers need both office heads approval</li>
                    <li>• Cannot transfer from committed amounts</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Approval Flow" />
            <CardBody>
              <div className="space-y-3">
                {[
                  { step: 1, label: 'Requestor submits', status: 'current' },
                  { step: 2, label: 'Finance Officer reviews', status: 'pending' },
                  { step: 3, label: 'Office Head approves', status: 'pending' },
                  { step: 4, label: 'Budget updated in system', status: 'pending' },
                ].map((step) => (
                  <div key={step.step} className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${step.status === 'current' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}
                    >
                      {step.step}
                    </div>
                    <span
                      className={`text-sm ${step.status === 'current' ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                    >
                      {step.label}
                    </span>
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
