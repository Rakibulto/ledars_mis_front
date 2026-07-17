'use client';

import { useState } from 'react';
import { Scale, Clock, Award, Banknote, CheckCircle } from 'lucide-react';
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
export function CSummaryReport() {
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-04-04');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const stats = { totalCS: 48, approved: 35, pending: 10, returned: 3, totalValue: 185000000 };
  const statusPie = [
    { name: 'Approved', value: 35 },
    { name: 'Pending Committee', value: 6 },
    { name: 'Pending CD', value: 4 },
    { name: 'Returned', value: 3 },
  ];
  const monthlyData = [
    { month: 'Jan', created: 12, approved: 10, value: 42000000 },
    { month: 'Feb', created: 14, approved: 12, value: 52000000 },
    { month: 'Mar', created: 15, approved: 10, value: 58000000 },
    { month: 'Apr', created: 7, approved: 3, value: 33000000 },
  ];
  const csList = [
    {
      id: 'CS-AAB-2026-022',
      rfqId: 'RFQ-AAB-2026-028',
      title: 'IT Equipment — Dhaka Office',
      vendors: 4,
      lowestBid: 4200000,
      recommendedVendor: 'TechBD Solutions Ltd',
      recommendedAmount: 4850000,
      justification: 'Best value (quality + price)',
      committee: 'Procurement Committee',
      approver: 'Country Director',
      status: 'approved',
      date: '2026-03-10',
    },
    {
      id: 'CS-AAB-2026-023',
      rfqId: 'RFQ-AAB-2026-029',
      title: 'WASH Materials — Sylhet',
      vendors: 5,
      lowestBid: 7800000,
      recommendedVendor: 'BuildRight Construction',
      recommendedAmount: 8200000,
      justification: 'Prior WASH experience + quality',
      committee: 'Procurement Committee',
      approver: 'Country Director',
      status: 'approved',
      date: '2026-03-15',
    },
    {
      id: 'CS-AAB-2026-024',
      rfqId: 'RFQ-AAB-2026-030',
      title: 'Office Furniture — Rangpur',
      vendors: 3,
      lowestBid: 1200000,
      recommendedVendor: 'Dhaka Office Mart',
      recommendedAmount: 1380000,
      justification: 'Delivery timeline + warranty',
      committee: 'Procurement Committee',
      approver: 'Director — Finance',
      status: 'approved',
      date: '2026-03-18',
    },
    {
      id: 'CS-AAB-2026-025',
      rfqId: 'RFQ-AAB-2026-031',
      title: "Emergency Relief Packs — Cox's Bazar",
      vendors: 4,
      lowestBid: 6200000,
      recommendedVendor: 'Relief Supplies BD',
      recommendedAmount: 6500000,
      justification: 'Field proven + logistics capacity',
      committee: 'Emergency Proc. Committee',
      approver: 'Country Director',
      status: 'pending',
      date: '2026-04-01',
    },
    {
      id: 'CS-AAB-2026-026',
      rfqId: 'RFQ-AAB-2026-032',
      title: 'Medical Supplies — Barishal',
      vendors: 3,
      lowestBid: 2800000,
      recommendedVendor: 'Green Medical Ltd',
      recommendedAmount: 3200000,
      justification: 'DGDA certified + quality',
      committee: 'Procurement Committee',
      approver: 'Director — Finance',
      status: 'pending',
      date: '2026-04-02',
    },
    {
      id: 'CS-AAB-2026-027',
      rfqId: 'RFQ-AAB-2026-033',
      title: 'Solar Panels — Field Offices',
      vendors: 2,
      lowestBid: 14500000,
      recommendedVendor: 'QuickBuild Construction',
      recommendedAmount: 15800000,
      justification: 'Returned — need 3+ quotations',
      committee: 'Procurement Committee',
      approver: 'Country Director',
      status: 'returned',
      date: '2026-03-28',
    },
  ];
  const filters = (
    <div className="grid grid-cols-4 gap-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Date From</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Date To</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="returned">Returned</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Categories</option>
          <option value="it">IT Equipment</option>
          <option value="programme">Programme Supplies</option>
          <option value="furniture">Furniture</option>
          <option value="construction">Construction</option>
        </select>
      </div>
    </div>
  );
  const kpiCards = (
    <div className="grid grid-cols-5 gap-4">
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total CS</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalCS}</p>
            </div>
            <Scale className="w-7 h-7 text-primary" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-success">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Approved</p>
              <p className="text-2xl font-bold text-success">{stats.approved}</p>
            </div>
            <CheckCircle className="w-7 h-7 text-success" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-warning">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold text-warning">{stats.pending}</p>
            </div>
            <Clock className="w-7 h-7 text-warning" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-error">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Returned</p>
              <p className="text-2xl font-bold text-error">{stats.returned}</p>
            </div>
            <Award className="w-7 h-7 text-error" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Value</p>
              <p className="text-lg font-bold text-primary">{formatBDT(stats.totalValue)}</p>
            </div>
            <Banknote className="w-7 h-7 text-primary" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
  const charts = (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader title="CS Approval Status" description="Comparative Statements by status" />
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusPie}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(e) => `${e.name} (${e.value})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusPie.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Monthly CS Trend" description="Created vs Approved — FY 2025-26" />
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="created" fill="#1e40af" name="Created" />
              <Bar dataKey="approved" fill="#10b981" name="Approved" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
  const table = (
    <Card>
      <CardHeader
        title="Comparative Statement Details"
        description="CS analysis and vendor recommendations — Ledars NGO"
      />
      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b-2 border-border">
              <tr className="text-left">
                <th className="pb-3 text-sm font-semibold text-foreground">CS ID</th>
                <th className="pb-3 text-sm font-semibold text-foreground">RFQ</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Title</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Vendors</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Lowest Bid</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Recommended</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Amount</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Approver</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {csList.map((cs) => (
                <tr key={cs.id} className="border-b border-border">
                  <td className="py-3 text-sm font-mono text-foreground">{cs.id}</td>
                  <td className="py-3 text-sm font-mono text-muted-foreground">{cs.rfqId}</td>
                  <td className="py-3 text-sm text-foreground max-w-[200px] truncate">
                    {cs.title}
                  </td>
                  <td className="py-3 text-sm text-center text-foreground">{cs.vendors}</td>
                  <td className="py-3 text-sm text-muted-foreground">{formatBDT(cs.lowestBid)}</td>
                  <td className="py-3 text-sm text-foreground">{cs.recommendedVendor}</td>
                  <td className="py-3 text-sm font-semibold text-foreground">
                    {formatBDT(cs.recommendedAmount)}
                  </td>
                  <td className="py-3 text-sm text-muted-foreground">{cs.approver}</td>
                  <td className="py-3">
                    <Badge
                      variant={
                        cs.status === 'approved'
                          ? 'success'
                          : cs.status === 'pending'
                            ? 'warning'
                            : 'error'
                      }
                    >
                      {cs.status}
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
      title="Comparative Statement Summary"
      description="CS analysis, vendor comparison, and award recommendations — Ledars NGO FY 2025-26"
      filters={filters}
      kpiCards={kpiCards}
      charts={charts}
      table={table}
    />
  );
}
