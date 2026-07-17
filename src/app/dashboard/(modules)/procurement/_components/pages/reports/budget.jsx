'use client';

import { useState } from 'react';
import {
  Bar,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

import { Badge } from '../../components/ui/badge';
import { ReportLayout } from '../../components/report-layout';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
function formatBDT(amount) {
  if (amount >= 10000000) return `৳${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(2)} L`;
  return `৳${amount.toLocaleString('en-IN')}`;
}
export function BudgetUtilizationReport() {
  const [project, setProject] = useState('all');
  const [period, setPeriod] = useState('year');
  const stats = {
    totalBudget: 500000000,
    procured: 385000000,
    committed: 75000000,
    available: 40000000,
    utilizationRate: 92,
  };
  const budgetData = [
    {
      code: 'WASH-Sylhet-2026',
      name: 'WASH Programme — Sylhet',
      donor: 'DFID',
      allocated: 120000000,
      procured: 98000000,
      committed: 15000000,
      available: 7000000,
      utilization: 94,
    },
    {
      code: 'EDU-Rangpur-2026',
      name: 'Education — Rangpur',
      donor: 'EU',
      allocated: 90000000,
      procured: 72000000,
      committed: 12000000,
      available: 6000000,
      utilization: 93,
    },
    {
      code: 'DRR-Cox-2026',
      name: "DRR — Cox's Bazar",
      donor: 'ECHO',
      allocated: 80000000,
      procured: 64000000,
      committed: 10000000,
      available: 6000000,
      utilization: 93,
    },
    {
      code: 'INFRA-Dhaka-2026',
      name: 'Infrastructure — Dhaka HQ',
      donor: 'Core Budget',
      allocated: 150000000,
      procured: 120000000,
      committed: 25000000,
      available: 5000000,
      utilization: 97,
    },
    {
      code: 'CORE-Dhaka-2026',
      name: 'Core Admin & Operations',
      donor: 'ActionAid Intl',
      allocated: 60000000,
      procured: 31000000,
      committed: 13000000,
      available: 16000000,
      utilization: 73,
    },
  ];
  const chartData = budgetData.map((b) => ({
    name: b.name.split(' — ')[0],
    allocated: b.allocated / 10000000,
    procured: b.procured / 10000000,
    available: b.available / 10000000,
  }));
  const filters = (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Project</label>
        <select
          value={project}
          onChange={(e) => setProject(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Projects</option>
          <option value="wash">WASH — Sylhet</option>
          <option value="edu">Education — Rangpur</option>
          <option value="drr">DRR — Cox's Bazar</option>
          <option value="infra">Infrastructure — Dhaka</option>
          <option value="core">Core Admin</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Period</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">FY 2025-26</option>
        </select>
      </div>
    </div>
  );
  const kpiCards = (
    <div className="grid grid-cols-5 gap-4">
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Budget</p>
            <p className="text-xl font-bold text-foreground">{formatBDT(stats.totalBudget)}</p>
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-error">
        <CardBody>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Procured</p>
            <p className="text-xl font-bold text-error">{formatBDT(stats.procured)}</p>
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-warning">
        <CardBody>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Committed</p>
            <p className="text-xl font-bold text-warning">{formatBDT(stats.committed)}</p>
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-success">
        <CardBody>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Available</p>
            <p className="text-xl font-bold text-success">{formatBDT(stats.available)}</p>
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Utilization</p>
            <p className="text-3xl font-bold text-primary">{stats.utilizationRate}%</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
  const charts = (
    <Card>
      <CardHeader
        title="Budget vs Procurement by Project"
        description="Allocation and procurement spend comparison — FY 2025-26 (৳ Cr)"
      />
      <CardBody>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(v) => `${v} Cr`} />
            <Tooltip formatter={(value) => `৳${value.toFixed(2)} Cr`} />
            <Legend />
            <Bar dataKey="allocated" fill="#1e40af" name="Allocated (৳ Cr)" />
            <Bar dataKey="procured" fill="#ef4444" name="Procured (৳ Cr)" />
            <Bar dataKey="available" fill="#10b981" name="Available (৳ Cr)" />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
  const table = (
    <Card>
      <CardHeader
        title="Budget vs Procurement Details"
        description="Project-wise budget utilization — Ledars NGO FY 2025-26"
      />
      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b-2 border-border">
              <tr className="text-left">
                <th className="pb-3 text-sm font-semibold text-foreground">Project Code</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Project</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Donor</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Allocated</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Procured</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Committed</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Available</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {budgetData.map((b) => (
                <tr key={b.code} className="border-b border-border">
                  <td className="py-3 text-sm font-mono text-foreground">{b.code}</td>
                  <td className="py-3 text-sm text-foreground">{b.name}</td>
                  <td className="py-3 text-sm text-muted-foreground">{b.donor}</td>
                  <td className="py-3 text-sm font-semibold text-foreground">
                    {formatBDT(b.allocated)}
                  </td>
                  <td className="py-3 text-sm font-semibold text-error">{formatBDT(b.procured)}</td>
                  <td className="py-3 text-sm text-warning">{formatBDT(b.committed)}</td>
                  <td className="py-3 text-sm font-semibold text-success">
                    {formatBDT(b.available)}
                  </td>
                  <td className="py-3">
                    <Badge
                      variant={
                        b.utilization >= 95 ? 'error' : b.utilization >= 85 ? 'warning' : 'success'
                      }
                    >
                      {b.utilization}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
  return (
    <ReportLayout
      title="Budget vs Procurement Report"
      description="Budget allocation, procurement spending, and variance analysis — Ledars NGO FY 2025-26"
      filters={filters}
      kpiCards={kpiCards}
      charts={charts}
      table={table}
    />
  );
}
