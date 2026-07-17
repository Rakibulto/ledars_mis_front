'use client';

import { Clock, ArrowLeft, DollarSign, TrendingUp } from 'lucide-react';

import { Link, useParams } from 'src/shims/react-router';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const mockBudgetDetail = {
  id: 'BDG-001',
  code: '5100',
  name: 'Procurement of Goods',
  office: 'Dhaka Head Office',
  fiscalYear: 'FY 2025-2026',
  allocated: 12000000,
  committed: 7500000,
  spent: 5200000,
  available: 4800000,
  status: 'on-track',
  transactions: [
    {
      id: 'TXN-001',
      date: '2026-04-01',
      ref: 'PRF-2026-0085',
      description: 'Emergency medical supplies - Teknaf',
      type: 'expenditure',
      amount: -850000,
    },
    {
      id: 'TXN-002',
      date: '2026-03-28',
      ref: 'PO-2026-0034',
      description: "Hygiene kit components — Cox's Bazar",
      type: 'commitment',
      amount: -420000,
    },
    {
      id: 'TXN-003',
      date: '2026-03-15',
      ref: 'BT-002',
      description: 'Budget transfer from IT & Equipment',
      type: 'transfer-in',
      amount: 150000,
    },
    {
      id: 'TXN-004',
      date: '2026-03-10',
      ref: 'PRF-2026-0078',
      description: 'Tarpaulins — Ukhiya warehouse restock',
      type: 'expenditure',
      amount: -650000,
    },
    {
      id: 'TXN-005',
      date: '2026-02-22',
      ref: 'PO-2026-0028',
      description: 'Water purification supplies',
      type: 'commitment',
      amount: -380000,
    },
    {
      id: 'TXN-006',
      date: '2026-02-15',
      ref: 'PRF-2026-0072',
      description: 'Relief supply procurement — batch 1',
      type: 'expenditure',
      amount: -1200000,
    },
    {
      id: 'TXN-007',
      date: '2026-01-15',
      ref: 'ALLOC',
      description: 'Initial FY budget allocation',
      type: 'allocation',
      amount: 12000000,
    },
  ],
  subLines: [
    { name: 'Relief Supplies', allocated: 5000000, spent: 2800000 },
    { name: 'Medical Supplies', allocated: 3000000, spent: 1200000 },
    { name: 'Hygiene Products', allocated: 2500000, spent: 800000 },
    { name: 'Miscellaneous Goods', allocated: 1500000, spent: 400000 },
  ],
};
const txnTypeBadge = (type) => {
  switch (type) {
    case 'expenditure':
      return (
        <Badge variant="danger" size="sm">
          Expenditure
        </Badge>
      );
    case 'commitment':
      return (
        <Badge variant="warning" size="sm">
          Commitment
        </Badge>
      );
    case 'allocation':
      return (
        <Badge variant="success" size="sm">
          Allocation
        </Badge>
      );
    case 'transfer-in':
      return (
        <Badge variant="info" size="sm">
          Transfer In
        </Badge>
      );
    case 'transfer-out':
      return (
        <Badge variant="warning" size="sm">
          Transfer Out
        </Badge>
      );
    default:
      return (
        <Badge variant="default" size="sm">
          {type}
        </Badge>
      );
  }
};
export function BudgetDetail() {
  const { id } = useParams();
  const utilPct = Math.round((mockBudgetDetail.committed / mockBudgetDetail.allocated) * 100);
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
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-foreground">{mockBudgetDetail.name}</h1>
              <Badge variant="outline">{mockBudgetDetail.code}</Badge>
              <Badge variant="success">On Track</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {mockBudgetDetail.office} • {mockBudgetDetail.fiscalYear}
            </p>
          </div>
          <Link to="/budget/transfer">
            <Button variant="outline">
              <DollarSign className="w-4 h-4 mr-2" />
              Request Transfer
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody>
            <div className="text-center">
              <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-semibold">
                ৳{(mockBudgetDetail.allocated / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-muted-foreground">Allocated</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <Clock className="w-6 h-6 text-orange-600 mx-auto mb-1" />
              <p className="text-xl font-semibold">
                ৳{(mockBudgetDetail.committed / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-muted-foreground">Committed ({utilPct}%)</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-semibold">
                ৳{(mockBudgetDetail.spent / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-muted-foreground">Spent</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <DollarSign className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <p className="text-xl font-semibold">
                ৳{(mockBudgetDetail.available / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Transaction History */}
          <Card>
            <CardHeader
              title="Transaction History"
              description="All budget movements for this line"
            />
            <CardBody>
              <table className="w-full">
                <thead className="border-b-2 border-border">
                  <tr className="text-left">
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">Date</th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                      Reference
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                      Description
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                      Type
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockBudgetDetail.transactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-border">
                      <td className="py-3 pr-3 text-sm text-muted-foreground">{txn.date}</td>
                      <td className="py-3 pr-3 text-sm font-medium text-primary">{txn.ref}</td>
                      <td className="py-3 pr-3 text-sm text-foreground">{txn.description}</td>
                      <td className="py-3 pr-3 text-center">{txnTypeBadge(txn.type)}</td>
                      <td
                        className={`py-3 text-sm font-semibold text-right ${txn.amount >= 0 ? 'text-green-600' : 'text-destructive'}`}
                      >
                        {txn.amount >= 0 ? '+' : ''}৳{Math.abs(txn.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>

        {/* Sub-Line Breakdown */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Sub-Line Breakdown" />
            <CardBody>
              <div className="space-y-4">
                {mockBudgetDetail.subLines.map((sl, idx) => {
                  const pct = Math.round((sl.spent / sl.allocated) * 100);
                  return (
                    <div key={idx} className="p-3 bg-secondary/30 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{sl.name}</span>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>Spent: ৳{(sl.spent / 1000000).toFixed(1)}M</span>
                        <span>of ৳{(sl.allocated / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`rounded-full h-2 ${pct >= 75 ? 'bg-orange-500' : 'bg-green-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Utilization Chart" />
            <CardBody>
              <div className="flex items-center justify-center py-4">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-secondary"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${utilPct}, 100`}
                      className="text-primary"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-semibold">{utilPct}%</span>
                    <span className="text-xs text-muted-foreground">committed</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
