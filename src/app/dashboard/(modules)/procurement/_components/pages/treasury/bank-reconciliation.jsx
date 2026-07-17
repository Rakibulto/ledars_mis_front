'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Eye,
  Search,
  Upload,
  Landmark,
  RefreshCw,
  DollarSign,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody } from '../../components/ui/card';

const mockReconciliations = [
  {
    id: 'REC-2026-004',
    bankAccount: 'BRAC Bank - Operational (A/C: 1524-XXXX-3890)',
    period: 'March 2026',
    bankBalance: 12450000,
    bookBalance: 12380000,
    difference: 70000,
    matchedItems: 124,
    unmatchedItems: 8,
    status: 'in-progress',
    preparedBy: 'Mostafa Kamal',
    lastUpdated: '2026-04-03',
  },
  {
    id: 'REC-2026-003',
    bankAccount: 'Dutch Bangla Bank - Project (A/C: 2871-XXXX-5612)',
    period: 'March 2026',
    bankBalance: 8720000,
    bookBalance: 8720000,
    difference: 0,
    matchedItems: 86,
    unmatchedItems: 0,
    status: 'reconciled',
    preparedBy: 'Nusrat Jahan',
    lastUpdated: '2026-04-01',
  },
  {
    id: 'REC-2026-002',
    bankAccount: 'BRAC Bank - Operational (A/C: 1524-XXXX-3890)',
    period: 'February 2026',
    bankBalance: 11200000,
    bookBalance: 11200000,
    difference: 0,
    matchedItems: 108,
    unmatchedItems: 0,
    status: 'reconciled',
    preparedBy: 'Mostafa Kamal',
    lastUpdated: '2026-03-05',
  },
  {
    id: 'REC-2026-001',
    bankAccount: 'Sonali Bank - Donor Fund (A/C: 3401-XXXX-7823)',
    period: 'February 2026',
    bankBalance: 25600000,
    bookBalance: 25540000,
    difference: 60000,
    status: 'discrepancy',
    matchedItems: 42,
    unmatchedItems: 3,
    preparedBy: 'Rahima Begum',
    lastUpdated: '2026-03-08',
  },
];
const statusMap = {
  reconciled: { variant: 'success', label: 'Reconciled' },
  'in-progress': { variant: 'info', label: 'In Progress' },
  discrepancy: { variant: 'danger', label: 'Discrepancy' },
  pending: { variant: 'warning', label: 'Pending' },
};
export function BankReconciliation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const filtered = mockReconciliations.filter((r) => {
    const matchesSearch =
      r.bankAccount.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesPeriod = periodFilter === 'all' || r.period === periodFilter;
    return matchesSearch && matchesStatus && matchesPeriod;
  });
  const totalDiscrepancy = mockReconciliations
    .filter((r) => r.status !== 'reconciled')
    .reduce((s, r) => s + r.difference, 0);
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
            Bank Reconciliation
          </h1>
          <p className="text-muted-foreground">Match bank statements with system payment records</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import Statement
          </Button>
          <Button variant="primary">
            <RefreshCw className="w-4 h-4 mr-2" />
            New Reconciliation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <StatCard
          title="Total Reconciliations"
          value={mockReconciliations.length}
          icon={Landmark}
          color="blue"
        />
        <StatCard
          title="Fully Reconciled"
          value={mockReconciliations.filter((r) => r.status === 'reconciled').length}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Open Discrepancies"
          value={mockReconciliations.filter((r) => r.difference > 0).length}
          icon={AlertTriangle}
          color="orange"
        />
        <StatCard
          title="Total Discrepancy"
          value={`৳${(totalDiscrepancy / 1000).toFixed(0)}K`}
          icon={DollarSign}
          color="red"
        />
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by bank account or reconciliation ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="reconciled">Reconciled</option>
              <option value="in-progress">In Progress</option>
              <option value="discrepancy">Discrepancy</option>
            </select>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Periods</option>
              <option value="March 2026">March 2026</option>
              <option value="February 2026">February 2026</option>
            </select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                    Reconciliation
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                    Bank Account
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Period</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                    Bank Balance
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                    Book Balance
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                    Difference
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                    Matched
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                    Status
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rec) => {
                  const s = statusMap[rec.status] || statusMap.pending;
                  return (
                    <tr
                      key={rec.id}
                      className="border-b border-border hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-3 pr-3">
                        <Link
                          href={paths.dashboard.procurement.treasury.bankReconciliationDetail(
                            rec.id
                          )}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {rec.id}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {rec.preparedBy} • {rec.lastUpdated}
                        </p>
                      </td>
                      <td className="py-3 pr-3 text-sm text-foreground">{rec.bankAccount}</td>
                      <td className="py-3 pr-3">
                        <Badge variant="outline" size="sm">
                          {rec.period}
                        </Badge>
                      </td>
                      <td className="py-3 pr-3 text-sm text-foreground text-right">
                        ৳{(rec.bankBalance / 1000000).toFixed(2)}M
                      </td>
                      <td className="py-3 pr-3 text-sm text-foreground text-right">
                        ৳{(rec.bookBalance / 1000000).toFixed(2)}M
                      </td>
                      <td
                        className={`py-3 pr-3 text-sm font-semibold text-right ${rec.difference > 0 ? 'text-destructive' : 'text-green-600'}`}
                      >
                        {rec.difference > 0 ? `৳${(rec.difference / 1000).toFixed(0)}K` : '—'}
                      </td>
                      <td className="py-3 pr-3 text-center">
                        <span className="text-sm text-foreground">{rec.matchedItems}</span>
                        {rec.unmatchedItems > 0 && (
                          <span className="text-xs text-destructive ml-1">
                            ({rec.unmatchedItems} unmatched)
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-center">
                        <Badge variant={s.variant} size="sm">
                          {s.label}
                        </Badge>
                      </td>
                      <td className="py-3 text-center">
                        <Link
                          href={paths.dashboard.procurement.treasury.bankReconciliationDetail(
                            rec.id
                          )}
                        >
                          <button className="p-1.5 hover:bg-muted rounded transition-colors">
                            <Eye className="w-4 h-4 text-primary" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
