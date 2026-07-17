'use client';

import { useState } from 'react';
import { Building2, BarChart3, DollarSign, TrendingUp } from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const mockUtilization = {
  fiscalYear: 'FY 2025-2026',
  monthlyData: [
    { month: 'Jul 2025', allocated: 37200000, spent: 1800000, cumSpent: 1800000 },
    { month: 'Aug 2025', allocated: 37200000, spent: 2400000, cumSpent: 4200000 },
    { month: 'Sep 2025', allocated: 37200000, spent: 3100000, cumSpent: 7300000 },
    { month: 'Oct 2025', allocated: 37200000, spent: 2200000, cumSpent: 9500000 },
    { month: 'Nov 2025', allocated: 37200000, spent: 2800000, cumSpent: 12300000 },
    { month: 'Dec 2025', allocated: 37200000, spent: 1500000, cumSpent: 13800000 },
    { month: 'Jan 2026', allocated: 37200000, spent: 3500000, cumSpent: 17300000 },
    { month: 'Feb 2026', allocated: 37200000, spent: 2100000, cumSpent: 19400000 },
    { month: 'Mar 2026', allocated: 37200000, spent: 1340000, cumSpent: 20740000 },
    { month: 'Apr 2026', allocated: 37200000, spent: null, cumSpent: null },
    { month: 'May 2026', allocated: 37200000, spent: null, cumSpent: null },
    { month: 'Jun 2026', allocated: 37200000, spent: null, cumSpent: null },
  ],
  officeBreakdown: [
    { office: 'Dhaka Head Office', allocated: 14800000, spent: 7400000, pct: 50 },
    { office: "Cox's Bazar Sadar Office", allocated: 7400000, spent: 3500000, pct: 47 },
    { office: 'Ukhiya Field Office', allocated: 6500000, spent: 4100000, pct: 63 },
    { office: 'Teknaf Field Office', allocated: 8500000, spent: 5740000, pct: 68 },
  ],
  categoryBreakdown: [
    { category: 'Procurement of Goods', allocated: 12000000, spent: 5200000 },
    { category: 'Construction & Works', allocated: 8500000, spent: 5740000 },
    { category: 'Service Contracts', allocated: 4200000, spent: 1900000 },
    { category: 'Emergency Relief', allocated: 6500000, spent: 4100000 },
    { category: 'IT & Equipment', allocated: 2800000, spent: 2200000 },
    { category: 'Vehicle & Transport', allocated: 3200000, spent: 1600000 },
  ],
};
export function BudgetUtilization() {
  const [viewBy, setViewBy] = useState('office');
  const totalAllocated = 37200000;
  const totalSpent = 20740000;
  const utilizationPct = Math.round((totalSpent / totalAllocated) * 100);
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Budget Utilization Report</h1>
        <p className="text-muted-foreground">
          {mockUtilization.fiscalYear} — 9 of 12 months elapsed (75%)
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Budget"
          value={`৳${(totalAllocated / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Total Spent"
          value={`৳${(totalSpent / 1000000).toFixed(1)}M`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Utilization Rate"
          value={`${utilizationPct}%`}
          icon={BarChart3}
          color="orange"
          trend={{ value: '75% of year elapsed', isPositive: utilizationPct <= 75 }}
        />
        <StatCard
          title="Remaining"
          value={`৳${((totalAllocated - totalSpent) / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Monthly Spend */}
      <Card className="mb-6">
        <CardHeader title="Monthly Expenditure" description="Budget spend by month" />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Month</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                    Monthly Spend
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                    Cumulative
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Progress</th>
                </tr>
              </thead>
              <tbody>
                {mockUtilization.monthlyData.map((m, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-border ${m.spent === null ? 'opacity-40' : ''}`}
                  >
                    <td className="py-2.5 pr-4 text-sm font-medium text-foreground">{m.month}</td>
                    <td className="py-2.5 pr-4 text-sm text-right">
                      {m.spent !== null ? `৳${(m.spent / 1000000).toFixed(1)}M` : '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-sm text-right font-medium">
                      {m.cumSpent !== null ? `৳${(m.cumSpent / 1000000).toFixed(1)}M` : '—'}
                    </td>
                    <td className="py-2.5 pr-4">
                      {m.cumSpent !== null && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-secondary rounded-full h-2 max-w-32">
                            <div
                              className="bg-primary rounded-full h-2"
                              style={{ width: `${(m.cumSpent / totalAllocated) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round((m.cumSpent / totalAllocated) * 100)}%
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Breakdown Toggle */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setViewBy('office')}
          className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${viewBy === 'office' ? 'bg-primary text-white' : 'bg-secondary text-foreground'}`}
        >
          <Building2 className="w-4 h-4 inline mr-1" />
          By Office
        </button>
        <button
          onClick={() => setViewBy('category')}
          className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${viewBy === 'category' ? 'bg-primary text-white' : 'bg-secondary text-foreground'}`}
        >
          <BarChart3 className="w-4 h-4 inline mr-1" />
          By Category
        </button>
      </div>

      {viewBy === 'office' ? (
        <Card>
          <CardHeader title="Utilization by Office" />
          <CardBody>
            <div className="space-y-4">
              {mockUtilization.officeBreakdown.map((o, idx) => (
                <div key={idx} className="p-4 bg-secondary/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{o.office}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        ৳{(o.spent / 1000000).toFixed(1)}M / ৳{(o.allocated / 1000000).toFixed(1)}M
                      </span>
                      <Badge variant={o.pct >= 70 ? 'warning' : 'success'} size="sm">
                        {o.pct}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div
                      className={`rounded-full h-3 ${o.pct >= 70 ? 'bg-orange-500' : 'bg-green-500'}`}
                      style={{ width: `${o.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Utilization by Category" />
          <CardBody>
            <div className="space-y-4">
              {mockUtilization.categoryBreakdown.map((c, idx) => {
                const pct = Math.round((c.spent / c.allocated) * 100);
                return (
                  <div key={idx} className="p-4 bg-secondary/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{c.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          ৳{(c.spent / 1000000).toFixed(1)}M / ৳{(c.allocated / 1000000).toFixed(1)}
                          M
                        </span>
                        <Badge variant={pct >= 75 ? 'warning' : 'success'} size="sm">
                          {pct}%
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div
                        className={`rounded-full h-3 ${pct >= 75 ? 'bg-orange-500' : 'bg-green-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
