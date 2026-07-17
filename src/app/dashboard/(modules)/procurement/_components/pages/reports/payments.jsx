'use client';

import { useState } from 'react';
import { Clock, Banknote, CheckCircle, ShieldCheck } from 'lucide-react';
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
const COLORS = ['#10b981', '#f59e0b', '#1e40af', '#ef4444'];
function formatBDT(amount) {
  if (amount >= 10000000) return `৳${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(2)} L`;
  return `৳${amount.toLocaleString('en-IN')}`;
}
export function PaymentStatusReport() {
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-04-04');
  const [status, setStatus] = useState('all');
  const [vendor, setVendor] = useState('all');
  const stats = {
    totalPayments: 85,
    paid: 58,
    pending: 18,
    inTreasury: 6,
    onHold: 3,
    totalValue: 285000000,
  };
  const statusData = [
    { name: 'Paid', value: 58, amount: 195000000 },
    { name: 'Pending Approval', value: 18, amount: 65000000 },
    { name: 'In Treasury', value: 6, amount: 18500000 },
    { name: 'On Hold', value: 3, amount: 6500000 },
  ];
  const paymentList = [
    {
      id: 'PRF-AAB-2026-018',
      vendor: 'TechBD Solutions Ltd',
      date: '2026-03-20',
      netPayable: 4717500,
      paymentDate: '2026-03-24',
      method: 'BEFTN',
      approver: 'Director — Finance',
      status: 'paid',
    },
    {
      id: 'PRF-AAB-2026-019',
      vendor: 'Dhaka Office Mart',
      date: '2026-03-22',
      netPayable: 1350000,
      paymentDate: null,
      method: null,
      approver: 'Programme Head',
      status: 'pending',
    },
    {
      id: 'PRF-AAB-2026-020',
      vendor: 'BuildRight Construction',
      date: '2026-03-18',
      netPayable: 12500000,
      paymentDate: '2026-03-23',
      method: 'RTGS',
      approver: 'Country Director',
      status: 'paid',
    },
    {
      id: 'PRF-AAB-2026-021',
      vendor: 'Relief Supplies BD',
      date: '2026-03-28',
      netPayable: 8200000,
      paymentDate: null,
      method: null,
      approver: 'Director — Finance',
      status: 'in-treasury',
    },
    {
      id: 'PRF-AAB-2026-022',
      vendor: 'Green Medical Ltd',
      date: '2026-04-01',
      netPayable: 3200000,
      paymentDate: null,
      method: null,
      approver: 'Programme Head',
      status: 'pending',
    },
    {
      id: 'PRF-AAB-2026-023',
      vendor: 'QuickBuild Construction',
      date: '2026-04-02',
      netPayable: 15800000,
      paymentDate: null,
      method: null,
      approver: 'Country Director',
      status: 'on-hold',
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
          <option value="paid">Paid</option>
          <option value="pending">Pending Approval</option>
          <option value="in-treasury">In Treasury</option>
          <option value="on-hold">On Hold</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Vendor</label>
        <select
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Vendors</option>
          <option value="techbd">TechBD Solutions</option>
          <option value="buildright">BuildRight Construction</option>
          <option value="relief">Relief Supplies BD</option>
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
              <p className="text-xs text-muted-foreground mb-1">Total PRFs</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalPayments}</p>
            </div>
            <Banknote className="w-7 h-7 text-primary" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-success">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Paid</p>
              <p className="text-2xl font-bold text-success">{stats.paid}</p>
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
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">In Treasury</p>
              <p className="text-2xl font-bold text-primary">{stats.inTreasury}</p>
            </div>
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-success">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Value</p>
              <p className="text-lg font-bold text-success">{formatBDT(stats.totalValue)}</p>
            </div>
            <Banknote className="w-7 h-7 text-success" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
  const charts = (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader
          title="PRF Status Distribution"
          description="Payment Requisitions by approval stage"
        />
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(e) => `${e.name} (${e.value})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
      <Card>
        <CardHeader
          title="Payment Value by Stage"
          description="Amount distribution across stages (৳)"
        />
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `৳${(v / 10000000).toFixed(1)}Cr`} />
              <Tooltip formatter={(value) => formatBDT(value)} />
              <Legend />
              <Bar dataKey="amount" fill="#1e40af" name="Amount (৳)" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
  const table = (
    <Card>
      <CardHeader
        title="PRF & Payment Details"
        description="Payment Requisition lifecycle — Ledars NGO"
      />
      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b-2 border-border">
              <tr className="text-left">
                <th className="pb-3 text-sm font-semibold text-foreground">PRF ID</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Vendor</th>
                <th className="pb-3 text-sm font-semibold text-foreground">PRF Date</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Net Payable</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Approver</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Payment Date</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Method</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {paymentList.map((p) => (
                <tr key={p.id} className="border-b border-border">
                  <td className="py-3 text-sm font-mono text-foreground">{p.id}</td>
                  <td className="py-3 text-sm text-foreground">{p.vendor}</td>
                  <td className="py-3 text-sm text-muted-foreground">{p.date}</td>
                  <td className="py-3 text-sm font-semibold text-foreground">
                    {formatBDT(p.netPayable)}
                  </td>
                  <td className="py-3 text-sm text-muted-foreground">{p.approver}</td>
                  <td className="py-3 text-sm text-muted-foreground">{p.paymentDate || '—'}</td>
                  <td className="py-3 text-sm text-foreground">{p.method || '—'}</td>
                  <td className="py-3">
                    <Badge
                      variant={
                        p.status === 'paid'
                          ? 'success'
                          : p.status === 'pending'
                            ? 'warning'
                            : p.status === 'in-treasury'
                              ? 'default'
                              : 'error'
                      }
                    >
                      {p.status}
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
      title="PRF & Payment Status Report"
      description="Payment Requisition lifecycle and disbursement tracking — Ledars NGO FY 2025-26"
      filters={filters}
      kpiCards={kpiCards}
      charts={charts}
      table={table}
    />
  );
}
