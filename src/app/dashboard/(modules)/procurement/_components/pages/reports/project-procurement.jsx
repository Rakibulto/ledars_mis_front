'use client';

import { useState } from 'react';
import { Banknote, FolderOpen, TrendingUp, CheckCircle } from 'lucide-react';
import {
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  BarChart,
  PieChart,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

import { Badge } from '../../components/ui/badge';
import { ReportLayout } from '../../components/report-layout';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const COLORS = ['#1e40af', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
function formatBDT(amount) {
  if (amount >= 10000000) return `৳${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(2)} L`;
  return `৳${amount.toLocaleString('en-IN')}`;
}
export function ProjectProcurementReport() {
  const [project, setProject] = useState('all');
  const [donor, setDonor] = useState('all');
  const stats = {
    totalProjects: 8,
    totalBudget: 500000000,
    totalProcured: 285000000,
    avgUtilization: 78,
  };
  const projectData = [
    {
      code: 'WASH-Sylhet-2026',
      name: 'WASH Programme — Sylhet',
      donor: 'DFID',
      budget: 120000000,
      procured: 98000000,
      requisitions: 18,
      rfqs: 15,
      wos: 12,
      grns: 10,
      utilization: 82,
    },
    {
      code: 'EDU-Rangpur-2026',
      name: 'Education — Rangpur',
      donor: 'EU',
      budget: 90000000,
      procured: 62000000,
      requisitions: 14,
      rfqs: 11,
      wos: 9,
      grns: 8,
      utilization: 69,
    },
    {
      code: 'DRR-Cox-2026',
      name: "DRR — Cox's Bazar",
      donor: 'ECHO',
      budget: 80000000,
      procured: 58000000,
      requisitions: 12,
      rfqs: 10,
      wos: 8,
      grns: 7,
      utilization: 73,
    },
    {
      code: 'INFRA-Dhaka-2026',
      name: 'Infrastructure — Dhaka HQ',
      donor: 'Core Budget',
      budget: 150000000,
      procured: 42000000,
      requisitions: 8,
      rfqs: 6,
      wos: 5,
      grns: 4,
      utilization: 28,
    },
    {
      code: 'CORE-Dhaka-2026',
      name: 'Core Admin & Operations',
      donor: 'ActionAid Intl',
      budget: 60000000,
      procured: 25000000,
      requisitions: 22,
      rfqs: 18,
      wos: 15,
      grns: 12,
      utilization: 42,
    },
  ];
  const donorPie = [
    { name: 'DFID', value: 98000000 },
    { name: 'EU', value: 62000000 },
    { name: 'ECHO', value: 58000000 },
    { name: 'Core Budget', value: 42000000 },
    { name: 'ActionAid Intl', value: 25000000 },
  ];
  const chartData = projectData.map((p) => ({
    name: p.code.split('-')[0],
    budget: p.budget / 10000000,
    procured: p.procured / 10000000,
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
        <label className="block text-sm font-medium text-foreground mb-2">Donor</label>
        <select
          value={donor}
          onChange={(e) => setDonor(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Donors</option>
          <option value="dfid">DFID</option>
          <option value="eu">EU</option>
          <option value="echo">ECHO</option>
          <option value="core">Core Budget</option>
          <option value="aa">ActionAid Intl</option>
        </select>
      </div>
    </div>
  );
  const kpiCards = (
    <div className="grid grid-cols-4 gap-6">
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Projects</p>
              <p className="text-3xl font-bold text-foreground">{stats.totalProjects}</p>
            </div>
            <FolderOpen className="w-8 h-8 text-primary" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-success">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Budget</p>
              <p className="text-xl font-bold text-success">{formatBDT(stats.totalBudget)}</p>
            </div>
            <Banknote className="w-8 h-8 text-success" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Procured</p>
              <p className="text-xl font-bold text-primary">{formatBDT(stats.totalProcured)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-warning">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Utilization</p>
              <p className="text-3xl font-bold text-warning">{stats.avgUtilization}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-warning" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
  const charts = (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader
          title="Budget vs Procurement by Project"
          description="Allocation and spend comparison (৳ Cr)"
        />
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `${v} Cr`} />
              <Tooltip formatter={(value) => `৳${value.toFixed(2)} Cr`} />
              <Legend />
              <Bar dataKey="budget" fill="#1e40af" name="Budget (৳ Cr)" />
              <Bar dataKey="procured" fill="#10b981" name="Procured (৳ Cr)" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
      <Card>
        <CardHeader
          title="Procurement by Donor"
          description="Spend distribution across funding sources"
        />
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={donorPie}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(e) => `${e.name}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {donorPie.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatBDT(value)} />
            </PieChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
  const table = (
    <Card>
      <CardHeader
        title="Project-wise Procurement Summary"
        description="Procurement activity per project — Ledars NGO FY 2025-26"
      />
      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b-2 border-border">
              <tr className="text-left">
                <th className="pb-3 text-sm font-semibold text-foreground">Project Code</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Project</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Donor</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Budget</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Procured</th>
                <th className="pb-3 text-sm font-semibold text-foreground">REQs</th>
                <th className="pb-3 text-sm font-semibold text-foreground">RFQs</th>
                <th className="pb-3 text-sm font-semibold text-foreground">WOs</th>
                <th className="pb-3 text-sm font-semibold text-foreground">GRNs</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {projectData.map((p) => (
                <tr key={p.code} className="border-b border-border">
                  <td className="py-3 text-sm font-mono text-foreground">{p.code}</td>
                  <td className="py-3 text-sm text-foreground">{p.name}</td>
                  <td className="py-3 text-sm text-muted-foreground">{p.donor}</td>
                  <td className="py-3 text-sm font-semibold text-foreground">
                    {formatBDT(p.budget)}
                  </td>
                  <td className="py-3 text-sm font-semibold text-primary">
                    {formatBDT(p.procured)}
                  </td>
                  <td className="py-3 text-sm text-center text-foreground">{p.requisitions}</td>
                  <td className="py-3 text-sm text-center text-foreground">{p.rfqs}</td>
                  <td className="py-3 text-sm text-center text-foreground">{p.wos}</td>
                  <td className="py-3 text-sm text-center text-foreground">{p.grns}</td>
                  <td className="py-3">
                    <Badge
                      variant={
                        p.utilization >= 80 ? 'success' : p.utilization >= 50 ? 'warning' : 'error'
                      }
                    >
                      {p.utilization}%
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
      title="Project-wise Procurement Summary"
      description="Procurement analysis by project code and funding source — Ledars NGO FY 2025-26"
      filters={filters}
      kpiCards={kpiCards}
      charts={charts}
      table={table}
    />
  );
}
