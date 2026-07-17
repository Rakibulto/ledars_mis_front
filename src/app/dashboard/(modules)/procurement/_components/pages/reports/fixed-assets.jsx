'use client';

import { useState } from 'react';
import { Box, Banknote, TrendingUp, AlertCircle } from 'lucide-react';
import {
  Pie,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  PieChart,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

import { Badge } from '../../components/ui/badge';
import { ReportLayout } from '../../components/report-layout';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const COLORS = ['#1e40af', '#10b981', '#f59e0b', '#ef4444'];
function formatBDT(amount) {
  if (amount >= 10000000) return `৳${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(2)} L`;
  return `৳${amount.toLocaleString('en-IN')}`;
}
export function FixedAssetRegisterReport() {
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('all');
  const [condition, setCondition] = useState('all');
  const stats = {
    totalAssets: 245,
    totalValue: 42500000,
    depreciation: 8500000,
    netValue: 34000000,
  };
  const categoryData = [
    { name: 'IT Equipment', value: 95, amount: 12500000 },
    { name: 'Vehicles', value: 12, amount: 8500000 },
    { name: 'Furniture', value: 85, amount: 6500000 },
    { name: 'Programme Equip.', value: 53, amount: 15000000 },
  ];
  const assetList = [
    {
      id: 'FA-AAB-2026-001',
      name: 'Dell Latitude Laptop',
      category: 'IT Equipment',
      location: 'Dhaka Office-3F',
      purchaseDate: '2026-01-15',
      cost: 120000,
      depreciation: 12000,
      netValue: 108000,
      condition: 'good',
    },
    {
      id: 'FA-AAB-2026-002',
      name: 'Toyota Hilux 4WD',
      category: 'Vehicles',
      location: 'Sylhet Field Office',
      purchaseDate: '2025-06-10',
      cost: 4500000,
      depreciation: 900000,
      netValue: 3600000,
      condition: 'excellent',
    },
    {
      id: 'FA-AAB-2026-003',
      name: 'Office Desk (Executive)',
      category: 'Furniture',
      location: 'Dhaka Office-2F',
      purchaseDate: '2025-11-20',
      cost: 45000,
      depreciation: 4500,
      netValue: 40500,
      condition: 'good',
    },
    {
      id: 'FA-AAB-2026-004',
      name: 'Water Purification Unit',
      category: 'Programme Equip.',
      location: "Cox's Bazar Field",
      purchaseDate: '2026-02-08',
      cost: 850000,
      depreciation: 42500,
      netValue: 807500,
      condition: 'excellent',
    },
    {
      id: 'FA-AAB-2026-005',
      name: 'Solar Power System',
      category: 'Programme Equip.',
      location: 'Barishal Store',
      purchaseDate: '2026-03-12',
      cost: 1200000,
      depreciation: 30000,
      netValue: 1170000,
      condition: 'excellent',
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
          <option value="it">IT Equipment</option>
          <option value="vehicles">Vehicles</option>
          <option value="furniture">Furniture</option>
          <option value="programme">Programme Equipment</option>
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
          <option value="rangpur">Rangpur Field</option>
          <option value="barishal">Barishal Store</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Condition</label>
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Conditions</option>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
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
              <p className="text-sm text-muted-foreground mb-1">Total Assets</p>
              <p className="text-3xl font-bold text-foreground">{stats.totalAssets}</p>
            </div>
            <Box className="w-8 h-8 text-primary" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-success">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Value</p>
              <p className="text-xl font-bold text-success">{formatBDT(stats.totalValue)}</p>
            </div>
            <Banknote className="w-8 h-8 text-success" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-error">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Depreciation</p>
              <p className="text-xl font-bold text-error">{formatBDT(stats.depreciation)}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-error" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Net Value</p>
              <p className="text-xl font-bold text-primary">{formatBDT(stats.netValue)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
  const charts = (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader title="Assets by Category" description="Distribution by asset type" />
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(e) => `${e.name} (${e.value})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Asset Value by Category" description="Value distribution (৳)" />
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `৳${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(value) => formatBDT(value)} />
              <Legend />
              <Bar dataKey="amount" fill="#1e40af" name="Value (৳)" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
  const table = (
    <Card>
      <CardHeader title="Fixed Asset Register" description="Complete asset listing — Ledars NGO" />
      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b-2 border-border">
              <tr className="text-left">
                <th className="pb-3 text-sm font-semibold text-foreground">Asset ID</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Name</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Category</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Location</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Cost</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Depreciation</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Net Value</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Condition</th>
              </tr>
            </thead>
            <tbody>
              {assetList.map((asset) => (
                <tr key={asset.id} className="border-b border-border">
                  <td className="py-3 text-sm font-mono text-foreground">{asset.id}</td>
                  <td className="py-3 text-sm text-foreground">{asset.name}</td>
                  <td className="py-3 text-sm text-foreground">{asset.category}</td>
                  <td className="py-3 text-sm text-muted-foreground">{asset.location}</td>
                  <td className="py-3 text-sm text-foreground">{formatBDT(asset.cost)}</td>
                  <td className="py-3 text-sm text-error">{formatBDT(asset.depreciation)}</td>
                  <td className="py-3 text-sm font-semibold text-success">
                    {formatBDT(asset.netValue)}
                  </td>
                  <td className="py-3">
                    <Badge
                      variant={
                        asset.condition === 'excellent'
                          ? 'success'
                          : asset.condition === 'good'
                            ? 'default'
                            : 'warning'
                      }
                    >
                      {asset.condition}
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
      title="Fixed Asset Register"
      description="Complete fixed asset tracking and valuation — Ledars NGO"
      filters={filters}
      kpiCards={kpiCards}
      charts={charts}
      table={table}
    />
  );
}
