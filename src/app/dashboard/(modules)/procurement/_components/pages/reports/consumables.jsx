'use client';

import { useState } from 'react';
import { Boxes, Package, TrendingDown, AlertTriangle } from 'lucide-react';
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  BarChart,
  LineChart,
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
export function ConsumableStockReport() {
  const [category, setCategory] = useState('all');
  const [stockLevel, setStockLevel] = useState('all');
  const [location, setLocation] = useState('all');
  const stats = { totalItems: 385, lowStock: 42, outOfStock: 8, totalValue: 2850000 };
  const trendData = [
    { month: 'Jan', consumption: 1200, value: 850000 },
    { month: 'Feb', consumption: 1350, value: 920000 },
    { month: 'Mar', consumption: 1450, value: 1080000 },
    { month: 'Apr', consumption: 680, value: 520000 },
  ];
  const stockList = [
    {
      id: 'CON-AAB-001',
      name: 'A4 Paper Ream (80gsm)',
      category: 'Stationery',
      location: 'Dhaka Office',
      currentStock: 150,
      reorderLevel: 50,
      monthlyConsumption: 45,
      unitPrice: 550,
      value: 82500,
      status: 'adequate',
    },
    {
      id: 'CON-AAB-002',
      name: 'Printer Toner (HP)',
      category: 'IT Supplies',
      location: 'Dhaka Office',
      currentStock: 12,
      reorderLevel: 15,
      monthlyConsumption: 8,
      unitPrice: 8500,
      value: 102000,
      status: 'low',
    },
    {
      id: 'CON-AAB-003',
      name: 'Hand Sanitizer (5L)',
      category: 'Hygiene',
      location: "Cox's Bazar",
      currentStock: 0,
      reorderLevel: 20,
      monthlyConsumption: 18,
      unitPrice: 1200,
      value: 0,
      status: 'out',
    },
    {
      id: 'CON-AAB-004',
      name: 'Diesel Fuel (Litre)',
      category: 'Fuel',
      location: 'Sylhet Field',
      currentStock: 250,
      reorderLevel: 100,
      monthlyConsumption: 180,
      unitPrice: 120,
      value: 30000,
      status: 'adequate',
    },
    {
      id: 'CON-AAB-005',
      name: 'Water Purification Tablets',
      category: 'Programme',
      location: "Cox's Bazar",
      currentStock: 8,
      reorderLevel: 50,
      monthlyConsumption: 35,
      unitPrice: 250,
      value: 2000,
      status: 'low',
    },
    {
      id: 'CON-AAB-006',
      name: 'First Aid Kit Refill',
      category: 'Medical',
      location: 'Barishal Store',
      currentStock: 0,
      reorderLevel: 10,
      monthlyConsumption: 5,
      unitPrice: 3500,
      value: 0,
      status: 'out',
    },
  ];
  const filters = (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Categories</option>
          <option value="stationery">Stationery</option>
          <option value="it">IT Supplies</option>
          <option value="hygiene">Hygiene</option>
          <option value="fuel">Fuel</option>
          <option value="programme">Programme</option>
          <option value="medical">Medical</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Stock Level</label>
        <select
          value={stockLevel}
          onChange={(e) => setStockLevel(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Levels</option>
          <option value="adequate">Adequate</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Location</label>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Locations</option>
          <option value="dhaka">Dhaka Office</option>
          <option value="sylhet">Sylhet Field</option>
          <option value="cox">Cox's Bazar</option>
          <option value="barishal">Barishal Store</option>
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
              <p className="text-sm text-muted-foreground mb-1">Total Items</p>
              <p className="text-3xl font-bold text-foreground">{stats.totalItems}</p>
            </div>
            <Boxes className="w-8 h-8 text-primary" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-warning">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Low Stock</p>
              <p className="text-3xl font-bold text-warning">{stats.lowStock}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-warning" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-error">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Out of Stock</p>
              <p className="text-3xl font-bold text-error">{stats.outOfStock}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-error" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-success">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Stock Value</p>
              <p className="text-xl font-bold text-success">{formatBDT(stats.totalValue)}</p>
            </div>
            <Package className="w-8 h-8 text-success" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
  const charts = (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader title="Monthly Consumption" description="Unit consumption trend — FY 2025-26" />
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="consumption" fill="#1e40af" name="Units Consumed" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Consumption Value Trend" description="Value in BDT over time" />
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `৳${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(value) => formatBDT(value)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                name="Value (৳)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
  const table = (
    <Card>
      <CardHeader
        title="Consumable Stock Details"
        description="Complete stock listing — Ledars NGO"
      />
      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b-2 border-border">
              <tr className="text-left">
                <th className="pb-3 text-sm font-semibold text-foreground">Item ID</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Name</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Category</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Location</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Stock</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Reorder</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Monthly</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Value</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {stockList.map((item) => (
                <tr key={item.id} className="border-b border-border">
                  <td className="py-3 text-sm font-mono text-foreground">{item.id}</td>
                  <td className="py-3 text-sm text-foreground">{item.name}</td>
                  <td className="py-3 text-sm text-foreground">{item.category}</td>
                  <td className="py-3 text-sm text-muted-foreground">{item.location}</td>
                  <td className="py-3 text-sm text-center font-semibold text-foreground">
                    {item.currentStock}
                  </td>
                  <td className="py-3 text-sm text-center text-muted-foreground">
                    {item.reorderLevel}
                  </td>
                  <td className="py-3 text-sm text-center text-foreground">
                    {item.monthlyConsumption}
                  </td>
                  <td className="py-3 text-sm font-semibold text-foreground">
                    {formatBDT(item.value)}
                  </td>
                  <td className="py-3">
                    <Badge
                      variant={
                        item.status === 'adequate'
                          ? 'success'
                          : item.status === 'low'
                            ? 'warning'
                            : 'error'
                      }
                    >
                      {item.status}
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
      title="Consumable Stock Report"
      description="Consumable inventory tracking and stock alerts — Ledars NGO"
      filters={filters}
      kpiCards={kpiCards}
      charts={charts}
      table={table}
    />
  );
}
