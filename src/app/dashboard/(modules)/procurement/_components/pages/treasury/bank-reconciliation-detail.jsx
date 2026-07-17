'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Link2, Landmark, ArrowLeft, CheckCircle, ArrowUpDown, AlertTriangle } from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const mockDetail = {
  id: 'REC-2026-004',
  bankAccount: 'BRAC Bank - Operational (A/C: 1524-XXXX-3890)',
  period: 'March 2026',
  bankBalance: 12450000,
  bookBalance: 12380000,
  difference: 70000,
  status: 'in-progress',
  preparedBy: 'Mostafa Kamal',
  lastUpdated: '2026-04-03',
  bankTransactions: [
    {
      id: 'BNK-001',
      date: '2026-03-02',
      description: "Vendor payment - Cox's Bazar Relief Supplies",
      debit: 450000,
      credit: 0,
      matched: true,
    },
    {
      id: 'BNK-002',
      date: '2026-03-05',
      description: 'Donor fund transfer - ECHO Grant',
      debit: 0,
      credit: 3500000,
      matched: true,
    },
    {
      id: 'BNK-003',
      date: '2026-03-10',
      description: 'Vendor payment - National Builders Co.',
      debit: 1200000,
      credit: 0,
      matched: true,
    },
    {
      id: 'BNK-004',
      date: '2026-03-15',
      description: 'Bank service charges',
      debit: 2500,
      credit: 0,
      matched: false,
    },
    {
      id: 'BNK-005',
      date: '2026-03-18',
      description: 'Salary disbursement - March',
      debit: 850000,
      credit: 0,
      matched: true,
    },
    {
      id: 'BNK-006',
      date: '2026-03-22',
      description: 'Vendor payment - TechServe Solutions',
      debit: 100000,
      credit: 0,
      matched: true,
    },
    {
      id: 'BNK-007',
      date: '2026-03-25',
      description: 'Interest earned',
      debit: 0,
      credit: 15000,
      matched: false,
    },
    {
      id: 'BNK-008',
      date: '2026-03-28',
      description: 'Cash deposit - field office return',
      debit: 0,
      credit: 25000,
      matched: false,
    },
  ],
  bookEntries: [
    {
      id: 'BK-001',
      date: '2026-03-02',
      description: "PRF-2026-0072 - Cox's Bazar Relief Supplies",
      debit: 450000,
      credit: 0,
      matched: true,
      matchedWith: 'BNK-001',
    },
    {
      id: 'BK-002',
      date: '2026-03-05',
      description: 'Receipt - ECHO Grant Transfer',
      debit: 0,
      credit: 3500000,
      matched: true,
      matchedWith: 'BNK-002',
    },
    {
      id: 'BK-003',
      date: '2026-03-10',
      description: 'PRF-2026-0078 - National Builders',
      debit: 1200000,
      credit: 0,
      matched: true,
      matchedWith: 'BNK-003',
    },
    {
      id: 'BK-004',
      date: '2026-03-18',
      description: 'Payroll March 2026',
      debit: 850000,
      credit: 0,
      matched: true,
      matchedWith: 'BNK-005',
    },
    {
      id: 'BK-005',
      date: '2026-03-22',
      description: 'PRF-2026-0085 - TechServe Solutions',
      debit: 100000,
      credit: 0,
      matched: true,
      matchedWith: 'BNK-006',
    },
    {
      id: 'BK-006',
      date: '2026-03-30',
      description: 'Petty cash reimbursement - Ukhiya',
      debit: 45000,
      credit: 0,
      matched: false,
      matchedWith: null,
    },
  ],
  adjustments: [
    {
      type: 'Outstanding cheque',
      description: 'PRF-2026-0085 - Petty cash not yet cleared',
      amount: -45000,
    },
    { type: 'Bank charge not recorded', description: 'Service charges for March', amount: -2500 },
    { type: 'Interest not recorded', description: 'Interest earned - March', amount: 15000 },
    { type: 'Deposit in transit', description: 'Cash deposit from field office', amount: 25000 },
  ],
};
export function BankReconciliationDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState('bank');
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <Link
          href={paths.dashboard.procurement.treasury.bankReconciliation}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Bank Reconciliation
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">{mockDetail.id}</h1>
              <Badge variant="info">In Progress</Badge>
            </div>
            <p className="text-foreground">{mockDetail.bankAccount}</p>
            <p className="text-sm text-muted-foreground">
              Period: {mockDetail.period} • Prepared by: {mockDetail.preparedBy}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Auto-Match
            </Button>
            <Button variant="success">
              <CheckCircle className="w-4 h-4 mr-2" />
              Finalize
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Bank Statement Balance</p>
              <p className="text-xl font-semibold text-foreground">
                ৳{(mockDetail.bankBalance / 1000000).toFixed(2)}M
              </p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Book Balance</p>
              <p className="text-xl font-semibold text-foreground">
                ৳{(mockDetail.bookBalance / 1000000).toFixed(2)}M
              </p>
            </div>
          </CardBody>
        </Card>
        <Card className={mockDetail.difference > 0 ? 'border-destructive/30' : ''}>
          <CardBody>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Difference</p>
              <p
                className={`text-xl font-semibold ${mockDetail.difference > 0 ? 'text-destructive' : 'text-green-600'}`}
              >
                {mockDetail.difference > 0
                  ? `৳${(mockDetail.difference / 1000).toFixed(0)}K`
                  : 'Nil'}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Matched / Unmatched</p>
              <p className="text-xl font-semibold text-foreground">
                {mockDetail.bankTransactions.filter((t) => t.matched).length}{' '}
                <span className="text-sm text-muted-foreground">/ </span>
                <span className="text-destructive">
                  {mockDetail.bankTransactions.filter((t) => !t.matched).length}
                </span>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {[
          { key: 'bank', label: 'Bank Statement', count: mockDetail.bankTransactions.length },
          { key: 'book', label: 'Book Entries', count: mockDetail.bookEntries.length },
          { key: 'adjustments', label: 'Adjustments', count: mockDetail.adjustments.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
          >
            {t.label}{' '}
            <span className="ml-1 text-xs bg-secondary px-1.5 py-0.5 rounded">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Bank Statement Tab */}
      {tab === 'bank' && (
        <Card>
          <CardBody>
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Date</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                    Description
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                    Debit
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                    Credit
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                    Matched
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockDetail.bankTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className={`border-b border-border ${!txn.matched ? 'bg-warning/5' : ''}`}
                  >
                    <td className="py-3 pr-3 text-sm text-muted-foreground">{txn.date}</td>
                    <td className="py-3 pr-3 text-sm text-foreground">{txn.description}</td>
                    <td className="py-3 pr-3 text-sm text-right">
                      {txn.debit > 0 ? (
                        <span className="text-destructive">৳{(txn.debit / 1000).toFixed(0)}K</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 pr-3 text-sm text-right">
                      {txn.credit > 0 ? (
                        <span className="text-green-600">৳{(txn.credit / 1000).toFixed(0)}K</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {txn.matched ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                      ) : (
                        <button className="p-1 hover:bg-muted rounded">
                          <Link2 className="w-4 h-4 text-primary" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {/* Book Entries Tab */}
      {tab === 'book' && (
        <Card>
          <CardBody>
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Date</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                    Description
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                    Debit
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                    Credit
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                    Matched With
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockDetail.bookEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className={`border-b border-border ${!entry.matched ? 'bg-warning/5' : ''}`}
                  >
                    <td className="py-3 pr-3 text-sm text-muted-foreground">{entry.date}</td>
                    <td className="py-3 pr-3 text-sm text-foreground">{entry.description}</td>
                    <td className="py-3 pr-3 text-sm text-right">
                      {entry.debit > 0 ? (
                        <span className="text-destructive">
                          ৳{(entry.debit / 1000).toFixed(0)}K
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 pr-3 text-sm text-right">
                      {entry.credit > 0 ? (
                        <span className="text-green-600">৳{(entry.credit / 1000).toFixed(0)}K</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {entry.matched ? (
                        <Badge variant="success" size="sm">
                          {entry.matchedWith}
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          Unmatched
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {/* Adjustments Tab */}
      {tab === 'adjustments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader title="Reconciliation Statement" />
            <CardBody>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-secondary/50 rounded-lg">
                  <span className="text-sm font-medium">Bank Statement Balance</span>
                  <span className="text-sm font-semibold">
                    ৳{(mockDetail.bankBalance / 1000000).toFixed(2)}M
                  </span>
                </div>
                {mockDetail.adjustments.map((adj, idx) => (
                  <div key={idx} className="flex justify-between px-3 py-2">
                    <div>
                      <p className="text-sm text-foreground">{adj.type}</p>
                      <p className="text-xs text-muted-foreground">{adj.description}</p>
                    </div>
                    <span
                      className={`text-sm font-medium ${adj.amount < 0 ? 'text-destructive' : 'text-green-600'}`}
                    >
                      {adj.amount < 0 ? '-' : '+'}৳{Math.abs(adj.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between p-3 bg-primary/5 rounded-lg border-2 border-primary/20">
                  <span className="text-sm font-semibold">Adjusted Bank Balance</span>
                  <span className="text-sm font-semibold">
                    ৳
                    {(
                      (mockDetail.bankBalance +
                        mockDetail.adjustments.reduce((s, a) => s + a.amount, 0)) /
                      1000000
                    ).toFixed(2)}
                    M
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-secondary/50 rounded-lg">
                  <span className="text-sm font-medium">Book Balance</span>
                  <span className="text-sm font-semibold">
                    ৳{(mockDetail.bookBalance / 1000000).toFixed(2)}M
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Actions Required" />
            <CardBody>
              <div className="space-y-3">
                <div className="p-3 border border-warning/30 bg-warning/5 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Record Bank Charges</p>
                      <p className="text-xs text-muted-foreground">
                        Bank service charges of ৳2,500 not yet recorded in books
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Create Journal Entry
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-3 border border-warning/30 bg-warning/5 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Record Interest Income</p>
                      <p className="text-xs text-muted-foreground">
                        Interest earned ৳15,000 not yet recorded in books
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Create Journal Entry
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-3 border border-info/30 bg-info/5 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Landmark className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Deposit in Transit</p>
                      <p className="text-xs text-muted-foreground">
                        ৳25,000 cash deposit pending bank clearance
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        No action needed — will clear next cycle
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
