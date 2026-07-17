'use client';

import { useState } from 'react';
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
export function InventoryReceivedReport() {
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-04-04');
  const [category, setCategory] = useState('all');
  const [warehouse, setWarehouse] = useState('all');
  const stats = {
    totalGRNs: 62,
    totalItems: 418,
    totalValue: 185000000,
    avgDeliveryTime: 10,
    pendingVerification: 8,
    lowStockAlerts: 42,
  };
  const monthlyData = [
    { month: 'Jan', grns: 15, items: 98, value: 42500000 },
    { month: 'Feb', grns: 18, items: 125, value: 52000000 },
    { month: 'Mar', grns: 20, items: 132, value: 62000000 },
    { month: 'Apr', grns: 9, items: 63, value: 28500000 },
  ];
  const warehouseData = [
    { name: 'Dhaka Central', value: 185, amount: 85000000 },
    { name: 'Sylhet Field', value: 82, amount: 38000000 },
    { name: "Cox's Bazar", value: 68, amount: 32000000 },
    { name: 'Rangpur Field', value: 45, amount: 18000000 },
    { name: 'Barishal Store', value: 38, amount: 12000000 },
  ];
  const grnList = [
    {
      id: 'GRN-AAB-2026-022',
      woNumber: 'WO-AAB-2026-018',
      vendor: 'TechBD Solutions Ltd',
      date: '2026-03-25',
      items: 8,
      value: 4850000,
      warehouse: 'Dhaka Central',
      status: 'verified',
    },
    {
      id: 'GRN-AAB-2026-023',
      woNumber: 'WO-AAB-2026-019',
      vendor: 'Dhaka Office Mart',
      date: '2026-03-22',
      items: 5,
      value: 1380000,
      warehouse: 'Rangpur Field',
      status: 'verified',
    },
    {
      id: 'GRN-AAB-2026-024',
      woNumber: 'WO-AAB-2026-020',
      vendor: 'BuildRight Construction',
      date: '2026-04-01',
      items: 12,
      value: 8200000,
      warehouse: 'Sylhet Field',
      status: 'pending',
    },
    {
      id: 'GRN-AAB-2026-025',
      woNumber: 'WO-AAB-2026-021',
      vendor: 'Relief Supplies BD',
      date: '2026-04-02',
      items: 15,
      value: 6500000,
      warehouse: "Cox's Bazar",
      status: 'pending',
    },
    {
      id: 'GRN-AAB-2026-026',
      woNumber: 'WO-AAB-2026-015',
      vendor: 'Green Medical Ltd',
      date: '2026-03-18',
      items: 6,
      value: 3200000,
      warehouse: 'Barishal Store',
      status: 'verified',
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
        <label className="block text-sm font-medium text-foreground mb-2">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Categories</option>
          <option value="assets">Fixed Assets</option>
          <option value="consumables">Consumables</option>
          <option value="programme">Programme Materials</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Warehouse</label>
        <select
          value={warehouse}
          onChange={(e) => setWarehouse(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Warehouses</option>
          <option value="dhaka">Dhaka Central</option>
          <option value="sylhet">Sylhet Field</option>
          <option value="cox">Cox's Bazar</option>
          <option value="rangpur">Rangpur Field</option>
          <option value="barishal">Barishal Store</option>
        </select>
      </div>
    </div>
  );
  const kpiCards = (
    <div className="grid grid-cols-6 gap-4">
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total GRNs</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalGRNs}</p>
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-success">
        <CardBody>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Items Received</p>
            <p className="text-2xl font-bold text-success">{stats.totalItems}</p>
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Value</p>
            <p className="text-lg font-bold text-primary">{formatBDT(stats.totalValue)}</p>
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-warning">
        <CardBody>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Avg Delivery</p>
            <p className="text-2xl font-bold text-foreground">{stats.avgDeliveryTime}d</p>
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-error">
        <CardBody>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Pending GRNs</p>
            <p className="text-2xl font-bold text-error">{stats.pendingVerification}</p>
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-warning">
        <CardBody>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Low Stock</p>
            <p className="text-2xl font-bold text-warning">{stats.lowStockAlerts}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
  const charts = (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader
          title="Monthly GRN & Items Received"
          description="Goods received trend — FY 2025-26"
        />
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="grns" fill="#1e40af" name="GRNs" />
              <Bar dataKey="items" fill="#10b981" name="Items Received" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
      <Card>
        <CardHeader
          title="Warehouse Stock Distribution"
          description="Items by warehouse location"
        />
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={warehouseData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(e) => `${e.name} (${e.value})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {warehouseData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
  const table = (
    <Card>
      <CardHeader title="GRN & Warehouse Details" description="Goods Received Notes — Ledars NGO" />
      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b-2 border-border">
              <tr className="text-left">
                <th className="pb-3 text-sm font-semibold text-foreground">GRN ID</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Work Order</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Vendor</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Date</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Items</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Value</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Warehouse</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {grnList.map((grn) => (
                <tr key={grn.id} className="border-b border-border">
                  <td className="py-3 text-sm font-mono text-foreground">{grn.id}</td>
                  <td className="py-3 text-sm font-mono text-muted-foreground">{grn.woNumber}</td>
                  <td className="py-3 text-sm text-foreground">{grn.vendor}</td>
                  <td className="py-3 text-sm text-muted-foreground">{grn.date}</td>
                  <td className="py-3 text-sm text-center text-foreground">{grn.items}</td>
                  <td className="py-3 text-sm font-semibold text-foreground">
                    {formatBDT(grn.value)}
                  </td>
                  <td className="py-3 text-sm text-foreground">{grn.warehouse}</td>
                  <td className="py-3">
                    <Badge variant={grn.status === 'verified' ? 'success' : 'warning'}>
                      {grn.status}
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
      title="GRN & Warehouse Stock Report"
      description="Goods received and warehouse inventory tracking — Ledars NGO FY 2025-26"
      filters={filters}
      kpiCards={kpiCards}
      charts={charts}
      table={table}
    />
  );
}
