'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Eye,
  Edit,
  Plus,
  MapPin,
  Search,
  Package,
  FileText,
  Warehouse,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  ArrowLeftRight,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody } from '../../components/ui/card';
const mockWarehouses = [
  {
    id: 'WH-000',
    name: 'Dhaka HQ Store',
    code: 'WH-DHK',
    location: 'Dhaka',
    office: 'Dhaka Head Office',
    capacity: '2,500 sq ft',
    utilizationPercent: 58,
    totalItems: 456,
    totalValue: 6250000,
    lowStockItems: 5,
    outOfStockItems: 1,
    status: 'active',
    manager: 'Md. Ashraful Hoque',
    lastStockCount: '2026-03-30',
    recentMovements: 28,
  },
  {
    id: 'WH-001',
    name: 'Ukhiya Central Warehouse',
    code: 'WH-UKH',
    location: "Ukhiya, Cox's Bazar",
    office: 'Ukhiya Field Office',
    capacity: '5,000 sq ft',
    utilizationPercent: 72,
    totalItems: 342,
    totalValue: 4250000,
    lowStockItems: 8,
    outOfStockItems: 2,
    status: 'active',
    manager: 'Rahima Begum',
    lastStockCount: '2026-03-28',
    recentMovements: 45,
  },
  {
    id: 'WH-002',
    name: 'Teknaf Warehouse - 1',
    code: 'WH-TKN-1',
    location: "Teknaf, Cox's Bazar",
    office: 'Teknaf Field Office',
    capacity: '3,500 sq ft',
    utilizationPercent: 85,
    totalItems: 218,
    totalValue: 3100000,
    lowStockItems: 12,
    outOfStockItems: 4,
    status: 'active',
    manager: 'Karim Uddin',
    lastStockCount: '2026-03-25',
    recentMovements: 32,
  },
  {
    id: 'WH-003',
    name: 'Teknaf Warehouse - 2',
    code: 'WH-TKN-2',
    location: "Teknaf, Cox's Bazar",
    office: 'Teknaf Field Office',
    capacity: '2,000 sq ft',
    utilizationPercent: 45,
    totalItems: 96,
    totalValue: 1850000,
    lowStockItems: 3,
    outOfStockItems: 0,
    status: 'active',
    manager: 'Selim Hossain',
    lastStockCount: '2026-03-30',
    recentMovements: 15,
  },
];
const getUtilizationColor = (pct) => {
  if (pct >= 90) return 'text-red-600 bg-red-50';
  if (pct >= 70) return 'text-orange-600 bg-orange-50';
  return 'text-green-600 bg-green-50';
};
export function WarehouseList() {
  const [searchQuery, setSearchQuery] = useState('');
  const totalItems = mockWarehouses.reduce((s, w) => s + w.totalItems, 0);
  const totalValue = mockWarehouses.reduce((s, w) => s + w.totalValue, 0);
  const totalLowStock = mockWarehouses.reduce((s, w) => s + w.lowStockItems, 0);
  const filtered = mockWarehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Warehouse Management</h1>
          <p className="text-muted-foreground">
            Manage stock across all AAB warehouses &amp; store locations
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={paths.dashboard.procurement.grn.create}>
            <Button variant="outline" size="sm">
              <Package className="w-3.5 h-3.5 mr-1.5" />
              Create GRN (Receive Goods)
            </Button>
          </Link>
          <Link href={paths.dashboard.procurement.inventory.interWarehouseTransfer}>
            <Button variant="outline" size="sm">
              <ArrowLeftRight className="w-3.5 h-3.5 mr-1.5" />
              Inter-Warehouse Transfer
            </Button>
          </Link>
          <Button variant="primary" size="sm">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Warehouse
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Warehouses"
          value={mockWarehouses.length}
          icon={Warehouse}
          color="blue"
        />
        <StatCard title="Total Items" value={totalItems} icon={Package} color="green" />
        <StatCard
          title="Total Stock Value"
          value={`৳${(totalValue / 1000000).toFixed(1)}M`}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Low Stock Alerts"
          value={totalLowStock}
          icon={AlertTriangle}
          color="red"
          trend={{
            value: `${mockWarehouses.reduce((s, w) => s + w.outOfStockItems, 0)} out of stock`,
            isPositive: false,
          }}
        />
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search warehouses by name, code, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {filtered.map((wh) => (
          <Card key={wh.id} hover>
            <CardBody>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Warehouse className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-foreground">{wh.name}</h3>
                      <Badge variant="outline" size="sm">
                        {wh.code}
                      </Badge>
                      <Badge variant="success" size="sm">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {wh.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {wh.location}
                      </span>
                      <span>Office: {wh.office}</span>
                      <span>Manager: {wh.manager}</span>
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      <div className="p-3 bg-secondary/50 rounded-lg text-center">
                        <p className="text-lg font-semibold text-foreground">{wh.totalItems}</p>
                        <p className="text-xs text-muted-foreground">Total Items</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg text-center">
                        <p className="text-lg font-semibold text-foreground">
                          ৳{(wh.totalValue / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-xs text-muted-foreground">Stock Value</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg text-center">
                        <p className="text-lg font-semibold text-foreground">{wh.capacity}</p>
                        <p className="text-xs text-muted-foreground">Capacity</p>
                      </div>
                      <div
                        className="p-3 rounded-lg text-center border-2"
                        style={{
                          borderColor:
                            wh.utilizationPercent >= 85 ? 'var(--destructive)' : 'var(--border)',
                        }}
                      >
                        <p
                          className={`text-lg font-semibold ${wh.utilizationPercent >= 85 ? 'text-destructive' : 'text-foreground'}`}
                        >
                          {wh.utilizationPercent}%
                        </p>
                        <p className="text-xs text-muted-foreground">Utilized</p>
                      </div>
                      <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg text-center">
                        <p className="text-lg font-semibold text-warning">{wh.lowStockItems}</p>
                        <p className="text-xs text-muted-foreground">Low Stock</p>
                      </div>
                      <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg text-center">
                        <p className="text-lg font-semibold text-destructive">
                          {wh.outOfStockItems}
                        </p>
                        <p className="text-xs text-muted-foreground">Out of Stock</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Last stock count: {wh.lastStockCount}</span>
                      <span>{wh.recentMovements} movements this month</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link href={paths.dashboard.procurement.inventory.warehouseDetail(wh.id)}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View
                    </Button>
                  </Link>
                  <Link href={paths.dashboard.procurement.grn.create}>
                    <Button variant="outline" size="sm">
                      <Package className="w-3.5 h-3.5 mr-1" />
                      GRN
                    </Button>
                  </Link>
                  <Link href={paths.dashboard.procurement.inventory.materialRelease}>
                    <Button variant="outline" size="sm">
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      Release
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
