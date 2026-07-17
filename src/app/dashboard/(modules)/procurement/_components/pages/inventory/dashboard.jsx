'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Box,
  Boxes,
  Package,
  Printer,
  Calendar,
  FileText,
  Warehouse,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  TrendingDown,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const formatBDT = (amount) => {
  if (amount >= 10000000) return `\u09F3${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `\u09F3${(amount / 100000).toFixed(2)} Lakh`;
  return `\u09F3${amount.toLocaleString('en-IN')}`;
};
// BD-localized mock data
const mockDashboardData = {
  totalValue: 18750000,
  fixedAssets: { count: 342, value: 14250000 },
  consumables: { count: 1256, value: 4500000 },
  lowStockItems: 14,
  outOfStockItems: 3,
  pendingRequisitions: 8,
  pendingReleases: 5,
  recentReceipts: [
    {
      id: 'INV-AAB-2026-0012',
      name: 'HP ProBook 450 G10 Laptop',
      type: 'asset',
      quantity: 15,
      value: 1350000,
      grnNumber: 'GRN-AAB-2026-003',
      receivedDate: '2026-03-28',
      location: 'Dhaka HQ Store',
      vendor: 'TechBD Solutions Ltd',
    },
    {
      id: 'INV-AAB-2026-0045',
      name: 'A4 Paper (80gsm, 500 sheet ream)',
      type: 'consumable',
      quantity: 500,
      value: 125000,
      grnNumber: 'GRN-AAB-2026-004',
      receivedDate: '2026-03-27',
      location: 'Ukhiya Central Warehouse',
      vendor: 'Dhaka Print House Ltd',
    },
    {
      id: 'INV-AAB-2026-0013',
      name: 'Steel Office Desk (4ft x 2.5ft)',
      type: 'asset',
      quantity: 25,
      value: 625000,
      grnNumber: 'GRN-AAB-2026-001',
      receivedDate: '2026-03-26',
      location: 'Teknaf Warehouse-1',
      vendor: 'Hatil-Brothers Furniture Ltd',
    },
    {
      id: 'INV-AAB-2026-0078',
      name: 'Toner Cartridge HP 26A (Black)',
      type: 'consumable',
      quantity: 100,
      value: 350000,
      grnNumber: 'GRN-AAB-2026-005',
      receivedDate: '2026-03-25',
      location: 'Dhaka HQ Store',
      vendor: 'TechBD Solutions Ltd',
    },
  ],
  lowStockAlerts: [
    {
      id: 'INV-AAB-2026-0090',
      name: 'Emergency Tarpaulin (12ft x 18ft)',
      type: 'consumable',
      currentStock: 45,
      minStock: 200,
      location: 'Ukhiya Central Warehouse',
      lastIssued: '2026-03-26',
    },
    {
      id: 'INV-AAB-2026-0091',
      name: 'Hygiene Kit (Family Pack)',
      type: 'consumable',
      currentStock: 28,
      minStock: 100,
      location: 'Teknaf Warehouse-1',
      lastIssued: '2026-03-24',
    },
    {
      id: 'INV-AAB-2026-0092',
      name: 'First Aid Kit (Standard)',
      type: 'consumable',
      currentStock: 12,
      minStock: 50,
      location: 'Ukhiya Central Warehouse',
      lastIssued: '2026-03-22',
    },
    {
      id: 'INV-AAB-2026-0093',
      name: 'Solar Lantern (Rechargeable)',
      type: 'consumable',
      currentStock: 8,
      minStock: 75,
      location: 'Teknaf Warehouse-2',
      lastIssued: '2026-03-20',
    },
  ],
  topConsumables: [
    { name: 'A4 Paper (80gsm)', issued: 450, unit: 'reams', trend: 12 },
    { name: 'Toner Cartridges', issued: 85, unit: 'units', trend: -5 },
    { name: 'Emergency Tarpaulin', issued: 320, unit: 'pieces', trend: 22 },
    { name: 'Hygiene Kit (Family)', issued: 250, unit: 'kits', trend: 15 },
    { name: 'Bottled Water (1.5L)', issued: 1800, unit: 'bottles', trend: 8 },
  ],
  locationSummary: [
    { location: 'Dhaka HQ Store', assets: 125, consumables: 456, value: 6250000 },
    { location: 'Ukhiya Central Warehouse', assets: 98, consumables: 534, value: 5350000 },
    { location: 'Teknaf Warehouse-1', assets: 72, consumables: 178, value: 4150000 },
    { location: 'Teknaf Warehouse-2', assets: 47, consumables: 88, value: 3000000 },
  ],
  pendingMaterialRequisitions: [
    {
      id: 'MR-AAB-2026-018',
      requester: 'Tasneem Jahan',
      dept: 'Communications',
      items: 5,
      status: 'pending-supervisor',
      date: '2026-03-30',
    },
    {
      id: 'MR-AAB-2026-017',
      requester: 'Md. Ashraful Hoque',
      dept: 'Admin',
      items: 8,
      status: 'pending-pm',
      date: '2026-03-29',
    },
    {
      id: 'MR-AAB-2026-016',
      requester: 'Dr. Nafisa Akter',
      dept: 'Health Programme',
      items: 12,
      status: 'pending-pm',
      date: '2026-03-28',
    },
  ],
};
// Role-based access
const accessRoles = [
  { role: 'Admin', color: 'bg-error/10 text-error', perms: 'Full access' },
  { role: 'Store Staff', color: 'bg-primary/10 text-primary', perms: 'Stock ops' },
  { role: 'Programme Colleague', color: 'bg-success/10 text-success', perms: 'Request & view' },
];
const warehouseLocations = [
  { id: 'all', name: 'All Locations' },
  { id: 'dhaka-hq', name: 'Dhaka HQ Store' },
  { id: 'ukhiya-central', name: 'Ukhiya Central Warehouse' },
  { id: 'teknaf-1', name: 'Teknaf Warehouse-1' },
  { id: 'teknaf-2', name: 'Teknaf Warehouse-2' },
];
const getStatusBadge = (status) => {
  switch (status) {
    case 'pending-supervisor':
      return { variant: 'warning', label: 'Pending Supervisor' };
    case 'pending-pm':
      return { variant: 'warning', label: 'Pending PM' };
    case 'approved':
      return { variant: 'success', label: 'Approved' };
    default:
      return { variant: 'default', label: status };
  }
};
export function InventoryDashboard() {
  const data = mockDashboardData;
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Inventory Dashboard</h1>
            <p className="text-muted-foreground">
              Ledars NGO — Assets, consumables & warehouse overview
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={paths.dashboard.procurement.inventory.materialRequisition}>
              <Button variant="outline" size="sm">
                <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
                Material Requisition
              </Button>
            </Link>
            <Link href={paths.dashboard.procurement.inventory.reports}>
              <Button variant="outline" size="sm">
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Reports
              </Button>
            </Link>
          </div>
        </div>

        {/* Warehouse Selector + Role Access */}
        <div className="flex items-center justify-between gap-4 p-3 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Warehouse className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="px-3 py-1.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {warehouseLocations.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Access:</span>
            {accessRoles.map((r) => (
              <span
                key={r.role}
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.color}`}
              >
                {r.role} ({r.perms})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Inventory Value</p>
                <p className="text-xl font-semibold text-foreground">
                  {formatBDT(data.totalValue)}
                </p>
              </div>
              <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                <Boxes className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fixed Assets</p>
                <p className="text-xl font-semibold text-foreground">{data.fixedAssets.count}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatBDT(data.fixedAssets.value)}
                </p>
              </div>
              <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Box className="w-3.5 h-3.5 text-blue-500" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Consumables</p>
                <p className="text-xl font-semibold text-foreground">{data.consumables.count}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatBDT(data.consumables.value)}
                </p>
              </div>
              <div className="w-8 h-8 shrink-0 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Package className="w-3.5 h-3.5 text-green-500" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-error">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Low Stock Alerts</p>
                <p className="text-xl font-semibold text-error">{data.lowStockItems}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.outOfStockItems} out of stock
                </p>
              </div>
              <div className="w-8 h-8 shrink-0 rounded-lg bg-error/10 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-error" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Pending Requisitions + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2 border-warning/30 bg-warning/5">
          <CardHeader
            title="Pending Material Requisitions"
            description="Approval: Requester → Requester Supervisor → Project Manager (3-level)"
            action={
              <Link href={paths.dashboard.procurement.inventory.materialRequisition}>
                <Button variant="warning" size="sm">
                  View All
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            }
          />
          <CardBody>
            <div className="space-y-3">
              {data.pendingMaterialRequisitions.map((req) => {
                const badge = getStatusBadge(req.status);
                return (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg bg-background"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-foreground text-sm">{req.id}</span>
                        <Badge variant={badge.variant} size="sm">
                          {badge.label}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {req.requester} ({req.dept}) &bull; {req.items} items &bull; {req.date}
                      </div>
                    </div>
                    <Link href={paths.dashboard.procurement.inventory.materialRequisition}>
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Quick Actions" />
          <CardBody>
            <div className="space-y-2">
              <Link href={paths.dashboard.procurement.inventory.items}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Boxes className="w-3.5 h-3.5 mr-1.5" />
                  View All Items
                </Button>
              </Link>
              <Link href={paths.dashboard.procurement.inventory.issue}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                  Issue Stock
                </Button>
              </Link>
              <Link href={paths.dashboard.procurement.inventory.materialRequisition}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
                  Raise Requisition
                </Button>
              </Link>
              <Link href={paths.dashboard.procurement.inventory.materialRelease}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Material Release
                </Button>
              </Link>
              <Link href={paths.dashboard.procurement.grn.create}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Package className="w-3.5 h-3.5 mr-1.5" />
                  Generate GRN
                </Button>
              </Link>
              <Link href={paths.dashboard.procurement.inventory.movement}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  Material In/Out
                </Button>
              </Link>
              <Link href={paths.dashboard.procurement.inventory.warehouses}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Warehouse className="w-3.5 h-3.5 mr-1.5" />
                  Warehouses
                </Button>
              </Link>
              <Link href={paths.dashboard.procurement.grn.list}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  Challan / Waybill
                </Button>
              </Link>
              <Link href={paths.dashboard.procurement.inventory.reports}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Reports
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Recently Received Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Recently Received Items (via GRN)"
              description="Latest inventory additions from Goods Received Notes"
              action={
                <Link href={paths.dashboard.procurement.inventory.items}>
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              }
            />
            <CardBody>
              <div className="space-y-3">
                {data.recentReceipts.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.type === 'asset' ? 'bg-blue-500/10' : 'bg-green-500/10'}`}
                      >
                        {item.type === 'asset' ? (
                          <Box className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Package className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={paths.dashboard.procurement.inventory.detail(item.id)}>
                            <h4 className="font-medium text-foreground hover:text-primary">
                              {item.name}
                            </h4>
                          </Link>
                          <Badge variant={item.type === 'asset' ? 'default' : 'success'} size="sm">
                            {item.type === 'asset' ? 'Asset' : 'Consumable'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Qty: {item.quantity}</span>
                          <span>&bull;</span>
                          <span>GRN: {item.grnNumber}</span>
                          <span>&bull;</span>
                          <span>{item.location}</span>
                          <span>&bull;</span>
                          <span>{item.vendor}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatBDT(item.value)}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.receivedDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Low Stock Alerts */}
        <div>
          <Card className="border-warning bg-warning/5">
            <CardHeader title="Low Stock Alerts" description="Items below minimum stock level" />
            <CardBody>
              <div className="space-y-3">
                {data.lowStockAlerts.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border border-warning/20 rounded-lg bg-background"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Link href={paths.dashboard.procurement.inventory.detail(item.id)}>
                        <h4 className="font-medium text-foreground text-sm hover:text-primary">
                          {item.name}
                        </h4>
                      </Link>
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Current:</span>
                        <span className="font-semibold text-error">{item.currentStock}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Min Required:</span>
                        <span className="font-medium text-foreground">{item.minStock}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-error"
                          style={{ width: `${(item.currentStock / item.minStock) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {item.location} &bull; Last issued: {item.lastIssued}
                      </p>
                    </div>
                  </div>
                ))}
                <Link href={paths.dashboard.procurement.inventory.items}>
                  <Button variant="warning" size="sm" className="w-full">
                    View All Low Stock Items
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Top Consumables Usage */}
        <Card>
          <CardHeader
            title="Top Consumables Usage (This Month)"
            description="Most issued consumable items across all locations"
          />
          <CardBody>
            <div className="space-y-3">
              {data.topConsumables.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.issued} {item.unit} issued
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.trend > 0 ? (
                      <TrendingUp className="w-4 h-4 text-success" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-error" />
                    )}
                    <span
                      className={`text-sm font-medium ${item.trend > 0 ? 'text-success' : 'text-error'}`}
                    >
                      {Math.abs(item.trend)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Location Summary */}
        <Card>
          <CardHeader
            title="Inventory by Location"
            description="Distribution across AAB warehouses & stores"
          />
          <CardBody>
            <div className="space-y-4">
              {data.locationSummary.map((loc, index) => (
                <div key={index} className="border-b border-border last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground text-sm">{loc.location}</h4>
                    <p className="text-sm font-semibold text-primary">{formatBDT(loc.value)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center">
                        <Box className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Assets</p>
                        <p className="text-sm font-semibold text-foreground">{loc.assets}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center">
                        <Package className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Consumables</p>
                        <p className="text-sm font-semibold text-foreground">{loc.consumables}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
