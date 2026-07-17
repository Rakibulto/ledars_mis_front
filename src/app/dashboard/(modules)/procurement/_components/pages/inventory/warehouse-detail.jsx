'use client';

import Link from 'next/link';
import {
  Edit,
  Clock,
  Package,
  ArrowLeft,
  Warehouse,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  ArrowLeftRight,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const mockWarehouseDetail = {
  id: 'WH-002',
  name: 'Teknaf Warehouse - 1',
  code: 'WH-TKN-1',
  location: "Teknaf, Cox's Bazar",
  office: 'Teknaf Field Office',
  capacity: '3,500 sq ft',
  utilizationPercent: 85,
  totalItems: 218,
  totalValue: 3100000,
  status: 'active',
  manager: 'Karim Uddin',
  lastStockCount: '2026-03-25',
  stockCategories: [
    { category: 'Relief Supplies', itemCount: 72, value: 1250000, lowStock: 5 },
    { category: 'Medical Supplies', itemCount: 38, value: 620000, lowStock: 3 },
    { category: 'Construction Materials', itemCount: 45, value: 850000, lowStock: 2 },
    { category: 'Office Supplies', itemCount: 28, value: 180000, lowStock: 1 },
    { category: 'Hygiene Kits', itemCount: 35, value: 200000, lowStock: 1 },
  ],
  recentMovements: [
    {
      id: 'MOV-001',
      type: 'in',
      description: 'GRN-2026-0071: 50 tarpaulins received from vendor',
      date: '2026-04-03',
      quantity: '+50 items',
      by: 'Karim Uddin',
    },
    {
      id: 'MOV-002',
      type: 'out',
      description: 'MR-2026-0135: 30 hygiene kits dispatched to camp 14',
      date: '2026-04-02',
      quantity: '-30 items',
      by: 'Abdul Kader',
    },
    {
      id: 'MOV-003',
      type: 'transfer',
      description: 'Transfer to Teknaf WH-2: 25 blankets',
      date: '2026-04-01',
      quantity: '-25 items',
      by: 'Karim Uddin',
    },
    {
      id: 'MOV-004',
      type: 'in',
      description: 'GRN-2026-0068: 100 medical kits received',
      date: '2026-03-30',
      quantity: '+100 items',
      by: 'Selim Hossain',
    },
    {
      id: 'MOV-005',
      type: 'out',
      description: 'MR-2026-0130: 20 construction tools dispatched',
      date: '2026-03-29',
      quantity: '-20 items',
      by: 'Abdul Kader',
    },
  ],
  lowStockItems: [
    {
      item: 'Emergency Tarpaulins (4m x 6m)',
      sku: 'SKU-TRP-001',
      currentQty: 12,
      reorderLevel: 50,
      category: 'Relief Supplies',
    },
    {
      item: 'First Aid Kits - Standard',
      sku: 'SKU-FAK-003',
      currentQty: 5,
      reorderLevel: 25,
      category: 'Medical Supplies',
    },
    {
      item: 'Water Purification Tablets (Box)',
      sku: 'SKU-WPT-002',
      currentQty: 8,
      reorderLevel: 30,
      category: 'Medical Supplies',
    },
    {
      item: 'Rope (50m rolls)',
      sku: 'SKU-RPE-001',
      currentQty: 3,
      reorderLevel: 15,
      category: 'Construction Materials',
    },
  ],
};
const movementBadge = (type) => {
  switch (type) {
    case 'in':
      return (
        <Badge variant="success" size="sm">
          In
        </Badge>
      );
    case 'out':
      return (
        <Badge variant="warning" size="sm">
          Out
        </Badge>
      );
    case 'transfer':
      return (
        <Badge variant="info" size="sm">
          Transfer
        </Badge>
      );
    default:
      return (
        <Badge variant="default" size="sm">
          {type}
        </Badge>
      );
  }
};
export function WarehouseDetail() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href={paths.dashboard.procurement_new.inventory.warehouses}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Warehouses
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{mockWarehouseDetail.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{mockWarehouseDetail.code}</Badge>
                <Badge variant="success">{mockWarehouseDetail.status}</Badge>
                <span className="text-sm text-muted-foreground">
                  {mockWarehouseDetail.location} • {mockWarehouseDetail.office}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={paths.dashboard.procurement_new.inventory.interWarehouseTransfer}>
              <Button variant="outline" size="sm">
                <ArrowLeftRight className="w-3.5 h-3.5 mr-1.5" />
                Transfer Items
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardBody>
            <div className="text-center">
              <Package className="w-3.5 h-3.5 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-semibold">{mockWarehouseDetail.totalItems}</p>
              <p className="text-xs text-muted-foreground">Total Items</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <TrendingUp className="w-3.5 h-3.5 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-semibold">
                ৳{(mockWarehouseDetail.totalValue / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-muted-foreground">Stock Value</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <BarChart3 className="w-3.5 h-3.5 text-orange-600 mx-auto mb-1" />
              <p className="text-xl font-semibold">{mockWarehouseDetail.utilizationPercent}%</p>
              <p className="text-xs text-muted-foreground">Utilized</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 mx-auto mb-1" />
              <p className="text-xl font-semibold">{mockWarehouseDetail.lowStockItems.length}</p>
              <p className="text-xs text-muted-foreground">Low Stock Alerts</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <Clock className="w-3.5 h-3.5 text-purple-600 mx-auto mb-1" />
              <p className="text-xl font-semibold">{mockWarehouseDetail.lastStockCount}</p>
              <p className="text-xs text-muted-foreground">Last Stock Count</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Stock Categories */}
          <Card>
            <CardHeader
              title="Stock by Category"
              description="Inventory breakdown across categories"
            />
            <CardBody>
              <table className="w-full">
                <thead className="border-b-2 border-border">
                  <tr className="text-left">
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                      Category
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                      Items
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                      Value
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                      Low Stock
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockWarehouseDetail.stockCategories.map((cat, idx) => (
                    <tr key={idx} className="border-b border-border">
                      <td className="py-3 text-sm font-medium text-foreground">{cat.category}</td>
                      <td className="py-3 text-sm text-foreground text-right">{cat.itemCount}</td>
                      <td className="py-3 text-sm text-foreground text-right">
                        ৳{(cat.value / 1000).toFixed(0)}K
                      </td>
                      <td className="py-3 text-center">
                        {cat.lowStock > 0 ? (
                          <Badge variant="warning" size="sm">
                            {cat.lowStock}
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            OK
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>

          {/* Recent Movements */}
          <Card>
            <CardHeader
              title="Recent Stock Movements"
              description="Latest incoming, outgoing, and transfer activity"
            />
            <CardBody>
              <table className="w-full">
                <thead className="border-b-2 border-border">
                  <tr className="text-left">
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">Type</th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                      Description
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                      Qty
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">Date</th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">By</th>
                  </tr>
                </thead>
                <tbody>
                  {mockWarehouseDetail.recentMovements.map((mov) => (
                    <tr key={mov.id} className="border-b border-border">
                      <td className="py-3 pr-3">{movementBadge(mov.type)}</td>
                      <td className="py-3 pr-3 text-sm text-foreground">{mov.description}</td>
                      <td
                        className={`py-3 pr-3 text-sm text-right font-medium ${mov.type === 'in' ? 'text-green-600' : 'text-orange-600'}`}
                      >
                        {mov.quantity}
                      </td>
                      <td className="py-3 pr-3 text-sm text-muted-foreground">{mov.date}</td>
                      <td className="py-3 text-sm text-muted-foreground">{mov.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>

        {/* Low Stock Alerts Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Low Stock Alerts"
              action={
                <Badge variant="danger" size="sm">
                  {mockWarehouseDetail.lowStockItems.length} items
                </Badge>
              }
            />
            <CardBody>
              <div className="space-y-3">
                {mockWarehouseDetail.lowStockItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-destructive/5 border border-destructive/15 rounded-lg"
                  >
                    <p className="text-sm font-medium text-foreground mb-1">{item.item}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {item.sku} • {item.category}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Current:{' '}
                        <span className="font-semibold text-destructive">{item.currentQty}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Min: <span className="font-medium">{item.reorderLevel}</span>
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                      <div
                        className="bg-destructive rounded-full h-1.5"
                        style={{
                          width: `${Math.min((item.currentQty / item.reorderLevel) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Warehouse Info" />
            <CardBody>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Manager</p>
                  <p className="text-sm font-medium">{mockWarehouseDetail.manager}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium">{mockWarehouseDetail.location}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Parent Office</p>
                  <p className="text-sm font-medium">{mockWarehouseDetail.office}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Capacity</p>
                  <p className="text-sm font-medium">{mockWarehouseDetail.capacity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Utilization</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-orange-600">
                      {mockWarehouseDetail.utilizationPercent}%
                    </p>
                    <div className="flex-1 bg-secondary rounded-full h-2">
                      <div
                        className="bg-orange-500 rounded-full h-2"
                        style={{ width: `${mockWarehouseDetail.utilizationPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
