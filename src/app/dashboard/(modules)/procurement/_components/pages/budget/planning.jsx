'use client';

import { useState } from 'react';
import { Eye, Building2, BarChart3, DollarSign, TrendingUp } from 'lucide-react';

import { Link } from 'src/shims/react-router';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const mockBudgetLines = [
  {
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
  },
  {
    id: 'BDG-002',
    code: '5200',
    name: 'Construction & Works',
    office: 'Teknaf Field Office',
    fiscalYear: 'FY 2025-2026',
    allocated: 8500000,
    committed: 8200000,
    spent: 5740000,
    available: 300000,
    status: 'at-risk',
  },
  {
    id: 'BDG-003',
    code: '5300',
    name: 'Service Contracts',
    office: "Cox's Bazar Sadar Office",
    fiscalYear: 'FY 2025-2026',
    allocated: 4200000,
    committed: 2800000,
    spent: 1900000,
    available: 1400000,
    status: 'on-track',
  },
  {
    id: 'BDG-004',
    code: '5400',
    name: 'Emergency Relief Supplies',
    office: 'Ukhiya Field Office',
    fiscalYear: 'FY 2025-2026',
    allocated: 6500000,
    committed: 4800000,
    spent: 4100000,
    available: 1700000,
    status: 'on-track',
  },
  {
    id: 'BDG-005',
    code: '5500',
    name: 'IT & Equipment',
    office: 'Dhaka Head Office',
    fiscalYear: 'FY 2025-2026',
    allocated: 2800000,
    committed: 2650000,
    spent: 2200000,
    available: 150000,
    status: 'over-budget',
  },
  {
    id: 'BDG-006',
    code: '5600',
    name: 'Vehicle & Transport',
    office: "Cox's Bazar Sadar Office",
    fiscalYear: 'FY 2025-2026',
    allocated: 3200000,
    committed: 2400000,
    spent: 1600000,
    available: 800000,
    status: 'on-track',
  },
];
const statusBadge = (status) => {
  switch (status) {
    case 'on-track':
      return (
        <Badge variant="success" size="sm">
          On Track
        </Badge>
      );
    case 'at-risk':
      return (
        <Badge variant="warning" size="sm">
          At Risk
        </Badge>
      );
    case 'over-budget':
      return (
        <Badge variant="danger" size="sm">
          Over Budget
        </Badge>
      );
    default:
      return (
        <Badge variant="default" size="sm">
          {status}
        </Badge>
      );
  }
};
export function BudgetPlanning() {
  const [officeFilter, setOfficeFilter] = useState('all');
  const filtered = mockBudgetLines.filter(
    (b) => officeFilter === 'all' || b.office === officeFilter
  );
  const totalAllocated = filtered.reduce((s, b) => s + b.allocated, 0);
  const totalCommitted = filtered.reduce((s, b) => s + b.committed, 0);
  const totalSpent = filtered.reduce((s, b) => s + b.spent, 0);
  const totalAvailable = filtered.reduce((s, b) => s + b.available, 0);
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Budget Planning & Overview
          </h1>
          <p className="text-muted-foreground">
            FY 2025-2026 procurement budget across all offices
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/budget/transfer">
            <Button variant="outline">
              <DollarSign className="w-4 h-4 mr-2" />
              Budget Transfer
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Allocated"
          value={`৳${(totalAllocated / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Committed"
          value={`৳${(totalCommitted / 1000000).toFixed(1)}M`}
          icon={TrendingUp}
          color="orange"
        />
        <StatCard
          title="Spent"
          value={`৳${(totalSpent / 1000000).toFixed(1)}M`}
          icon={BarChart3}
          color="green"
        />
        <StatCard
          title="Available"
          value={`৳${(totalAvailable / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          color="purple"
          trend={{
            value: `${Math.round((totalAvailable / totalAllocated) * 100)}% remaining`,
            isPositive: true,
          }}
        />
      </div>

      {/* Overall Utilization Bar */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Overall Budget Utilization</span>
            <span className="text-sm font-semibold text-foreground">
              {Math.round((totalSpent / totalAllocated) * 100)}% spent
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-4 flex overflow-hidden">
            <div
              className="bg-green-500 h-4"
              style={{ width: `${(totalSpent / totalAllocated) * 100}%` }}
            />
            <div
              className="bg-orange-400 h-4"
              style={{ width: `${((totalCommitted - totalSpent) / totalAllocated) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-xs text-muted-foreground">
                Spent ({Math.round((totalSpent / totalAllocated) * 100)}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-orange-400" />
              <span className="text-xs text-muted-foreground">
                Committed ({Math.round(((totalCommitted - totalSpent) / totalAllocated) * 100)}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gray-200" />
              <span className="text-xs text-muted-foreground">
                Available ({Math.round((totalAvailable / totalAllocated) * 100)}%)
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Filter */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex gap-4 items-center">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <select
              value={officeFilter}
              onChange={(e) => setOfficeFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Offices</option>
              <option value="Dhaka Head Office">Dhaka Head Office</option>
              <option value="Cox's Bazar Sadar Office">Cox's Bazar Sadar</option>
              <option value="Ukhiya Field Office">Ukhiya</option>
              <option value="Teknaf Field Office">Teknaf</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Budget Lines Table */}
      <Card>
        <CardHeader title="Budget Lines" description="Procurement budget breakdown by category" />
        <CardBody>
          <table className="w-full">
            <thead className="border-b-2 border-border">
              <tr className="text-left">
                <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                  Budget Line
                </th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase">Office</th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                  Allocated
                </th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                  Committed
                </th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                  Spent
                </th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                  Available
                </th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                  Utilization
                </th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                  Status
                </th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                  View
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const utilPct = Math.round((b.committed / b.allocated) * 100);
                return (
                  <tr
                    key={b.id}
                    className="border-b border-border hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <p className="text-sm font-medium text-foreground">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.code}</p>
                    </td>
                    <td className="py-3 pr-4 text-sm text-muted-foreground">{b.office}</td>
                    <td className="py-3 pr-4 text-sm font-medium text-foreground text-right">
                      ৳{(b.allocated / 1000000).toFixed(1)}M
                    </td>
                    <td className="py-3 pr-4 text-sm text-orange-600 text-right">
                      ৳{(b.committed / 1000000).toFixed(1)}M
                    </td>
                    <td className="py-3 pr-4 text-sm text-green-600 text-right">
                      ৳{(b.spent / 1000000).toFixed(1)}M
                    </td>
                    <td
                      className={`py-3 pr-4 text-sm font-semibold text-right ${b.available < 500000 ? 'text-destructive' : 'text-foreground'}`}
                    >
                      ৳{(b.available / 1000000).toFixed(1)}M
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-secondary rounded-full h-2 w-20">
                          <div
                            className={`rounded-full h-2 ${utilPct >= 95 ? 'bg-destructive' : utilPct >= 80 ? 'bg-orange-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(utilPct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{utilPct}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-center">{statusBadge(b.status)}</td>
                    <td className="py-3 text-center">
                      <Link to={`/budget/${b.id}`}>
                        <button className="p-1.5 hover:bg-muted rounded">
                          <Eye className="w-4 h-4 text-primary" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
