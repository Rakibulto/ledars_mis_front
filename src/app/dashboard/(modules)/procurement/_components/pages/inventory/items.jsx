'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Box,
  Eye,
  Boxes,
  MapPin,
  Search,
  Package,
  Warehouse,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
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
// BD-localized inventory items with auto-generated AAB asset tags
const mockInventoryItems = [
  {
    id: 'INV-AAB-2026-0012',
    name: 'HP ProBook 450 G10 Laptop',
    category: 'IT Equipment',
    type: 'asset',
    assetTag: 'AAB-FA-IT-001',
    quantity: 15,
    unitPrice: 90000,
    totalValue: 1350000,
    location: 'Dhaka HQ Store',
    custodian: 'Md. Rafiqul Islam',
    status: 'in-stock',
    lastMovement: '2026-03-28',
    grnNumber: 'GRN-AAB-2026-003',
    woNumber: 'WO-AAB-2026-002',
  },
  {
    id: 'INV-AAB-2026-0045',
    name: 'A4 Paper (80gsm, 500 sheet ream)',
    category: 'Office Supplies',
    type: 'consumable',
    quantity: 450,
    minStock: 200,
    unitPrice: 250,
    totalValue: 112500,
    location: 'Ukhiya Central Warehouse',
    custodian: 'Rahima Begum',
    status: 'in-stock',
    lastMovement: '2026-03-27',
    issued: 50,
    grnNumber: 'GRN-AAB-2026-004',
  },
  {
    id: 'INV-AAB-2026-0013',
    name: 'Steel Office Desk (4ft x 2.5ft)',
    category: 'Furniture',
    type: 'asset',
    assetTag: 'AAB-FA-FUR-001',
    quantity: 25,
    unitPrice: 25000,
    totalValue: 625000,
    location: 'Teknaf Warehouse-1',
    custodian: 'Karim Uddin',
    status: 'in-stock',
    lastMovement: '2026-03-26',
    grnNumber: 'GRN-AAB-2026-001',
    woNumber: 'WO-AAB-2026-001',
  },
  {
    id: 'INV-AAB-2026-0078',
    name: 'Toner Cartridge HP 26A (Black)',
    category: 'IT Accessories',
    type: 'consumable',
    quantity: 25,
    minStock: 30,
    unitPrice: 3500,
    totalValue: 87500,
    location: 'Dhaka HQ Store',
    custodian: 'Md. Rafiqul Islam',
    status: 'low-stock',
    lastMovement: '2026-03-25',
    issued: 75,
    grnNumber: 'GRN-AAB-2026-005',
  },
  {
    id: 'INV-AAB-2026-0014',
    name: 'Canon imageRUNNER 2630i Photocopier',
    category: 'IT Equipment',
    type: 'asset',
    assetTag: 'AAB-FA-IT-002',
    quantity: 5,
    unitPrice: 185000,
    totalValue: 925000,
    location: 'Dhaka HQ Store',
    custodian: 'Md. Rafiqul Islam',
    status: 'in-stock',
    lastMovement: '2026-03-22',
    grnNumber: 'GRN-AAB-2026-006',
    woNumber: 'WO-AAB-2026-004',
  },
  {
    id: 'INV-AAB-2026-0090',
    name: 'Emergency Tarpaulin (12ft x 18ft)',
    category: 'Relief Supplies',
    type: 'consumable',
    quantity: 45,
    minStock: 200,
    unitPrice: 1200,
    totalValue: 54000,
    location: 'Ukhiya Central Warehouse',
    custodian: 'Rahima Begum',
    status: 'low-stock',
    lastMovement: '2026-03-26',
    issued: 155,
    grnNumber: 'GRN-AAB-2026-008',
  },
  {
    id: 'INV-AAB-2026-0015',
    name: 'Mitsubishi Pajero Sport (4WD)',
    category: 'Vehicle',
    type: 'asset',
    assetTag: 'AAB-FA-VEH-001',
    quantity: 3,
    unitPrice: 5500000,
    totalValue: 16500000,
    location: 'Dhaka HQ Garage',
    custodian: 'Md. Ashraful Hoque',
    status: 'in-stock',
    lastMovement: '2025-12-15',
    grnNumber: 'GRN-AAB-2025-042',
    woNumber: 'WO-AAB-2025-038',
  },
  {
    id: 'INV-AAB-2026-0091',
    name: 'Hygiene Kit (Family Pack)',
    category: 'WASH Supplies',
    type: 'consumable',
    quantity: 28,
    minStock: 100,
    unitPrice: 850,
    totalValue: 23800,
    location: 'Teknaf Warehouse-1',
    custodian: 'Karim Uddin',
    status: 'low-stock',
    lastMovement: '2026-03-24',
    issued: 72,
    grnNumber: 'GRN-AAB-2026-009',
  },
  {
    id: 'INV-AAB-2026-0016',
    name: 'Medical Examination Table',
    category: 'Medical Equipment',
    type: 'asset',
    assetTag: 'AAB-FA-MED-001',
    quantity: 8,
    unitPrice: 35000,
    totalValue: 280000,
    location: 'Ukhiya Central Warehouse',
    custodian: 'Dr. Nafisa Akter',
    status: 'in-stock',
    lastMovement: '2026-02-20',
    grnNumber: 'GRN-AAB-2026-010',
    woNumber: 'WO-AAB-2026-005',
  },
  {
    id: 'INV-AAB-2026-0092',
    name: 'First Aid Kit (Standard)',
    category: 'Medical Supplies',
    type: 'consumable',
    quantity: 12,
    minStock: 50,
    unitPrice: 2800,
    totalValue: 33600,
    location: 'Ukhiya Central Warehouse',
    custodian: 'Rahima Begum',
    status: 'low-stock',
    lastMovement: '2026-03-22',
    issued: 38,
    grnNumber: 'GRN-AAB-2026-011',
  },
];
// Store location selection
const storeLocations = [
  { id: 'all', name: 'All Store Locations' },
  { id: 'dhaka-hq', name: 'Dhaka HQ Store' },
  { id: 'ukhiya-central', name: 'Ukhiya Central Warehouse' },
  { id: 'teknaf-1', name: 'Teknaf Warehouse-1' },
  { id: 'teknaf-2', name: 'Teknaf Warehouse-2' },
  { id: 'dhaka-garage', name: 'Dhaka HQ Garage' },
];
// Role-based access
const accessRoles = [
  { role: 'Admin', color: 'bg-error/10 text-error', perms: 'Full access' },
  { role: 'Store Staff', color: 'bg-primary/10 text-primary', perms: 'Stock ops, Issue, Track' },
  { role: 'Programme Colleague', color: 'bg-success/10 text-success', perms: 'Request & View' },
];
const getStatusColor = (status) => {
  switch (status) {
    case 'in-stock':
      return 'success';
    case 'low-stock':
      return 'warning';
    case 'out-of-stock':
      return 'error';
    default:
      return 'default';
  }
};
export function InventoryItems() {
  // Read URL params for pre-filtering from sidebar links
  const urlParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  const initialType = urlParams.get('type') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const filteredItems = mockInventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.custodian.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStore =
      storeFilter === 'all' ||
      item.location.includes(
        storeFilter === 'dhaka-hq'
          ? 'Dhaka HQ Store'
          : storeFilter === 'ukhiya-central'
            ? 'Ukhiya Central'
            : storeFilter === 'teknaf-1'
              ? 'Teknaf Warehouse-1'
              : storeFilter === 'teknaf-2'
                ? 'Teknaf Warehouse-2'
                : storeFilter === 'dhaka-garage'
                  ? 'Dhaka HQ Garage'
                  : ''
      );
    return matchesSearch && matchesType && matchesStatus && matchesCategory && matchesStore;
  });
  const categories = ['all', ...Array.from(new Set(mockInventoryItems.map((i) => i.category)))];
  const totalItems = filteredItems.length;
  const totalValue = filteredItems.reduce((sum, item) => sum + item.totalValue, 0);
  const assetsCount = filteredItems.filter((i) => i.type === 'asset').length;
  const consumablesCount = filteredItems.filter((i) => i.type === 'consumable').length;
  const lowStockCount = filteredItems.filter((i) => i.status === 'low-stock').length;
  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Store Management — Inventory Items
            </h1>
            <p className="text-muted-foreground">
              Ledars NGO — All fixed assets and consumable items with store location tracking
            </p>
          </div>
        </div>

        {/* Store Selector + Access Roles */}
        <div className="flex items-center justify-between gap-4 p-3 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Warehouse className="w-4 h-4 text-muted-foreground" />
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="px-3 py-1.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {storeLocations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Items</p>
                <p className="text-xl font-semibold text-foreground">{totalItems}</p>
              </div>
              <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                <Boxes className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                <p className="text-xl font-semibold text-foreground">{formatBDT(totalValue)}</p>
              </div>
              <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fixed Assets</p>
                <p className="text-xl font-semibold text-blue-500">{assetsCount}</p>
              </div>
              <Box className="w-3.5 h-3.5 text-blue-500" />
            </div>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Consumables</p>
                <p className="text-xl font-semibold text-green-500">{consumablesCount}</p>
              </div>
              <Package className="w-3.5 h-3.5 text-green-500" />
            </div>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Low Stock</p>
                <p className="text-xl font-semibold text-warning">{lowStockCount}</p>
              </div>
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, ID, category, location, or custodian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Types</option>
              <option value="asset">Fixed Assets (Permanent)</option>
              <option value="consumable">Consumables</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader
          title={`Inventory Items (${filteredItems.length})`}
          description="Consumable vs Permanent item classification with auto-assigned asset tags"
        />
        <CardBody>
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`border-2 rounded-lg p-4 hover:border-primary/50 transition-colors ${item.type === 'asset' ? 'border-l-blue-500 border-l-4' : 'border-l-green-500 border-l-4'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${item.type === 'asset' ? 'bg-blue-500/10' : 'bg-green-500/10'}`}
                    >
                      {item.type === 'asset' ? (
                        <Box className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <Package className="w-3.5 h-3.5 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={paths.dashboard.procurement.inventory.detail(item.id)}>
                          <h3 className="font-semibold text-foreground hover:text-primary">
                            {item.name}
                          </h3>
                        </Link>
                        <Badge variant={item.type === 'asset' ? 'default' : 'success'} size="sm">
                          {item.type === 'asset' ? 'Fixed Asset (Permanent)' : 'Consumable'}
                        </Badge>
                        <Badge variant={getStatusColor(item.status)} size="sm">
                          {item.status.replace('-', ' ')}
                        </Badge>
                        {item.type === 'asset' && item.assetTag && (
                          <Badge variant="outline" size="sm">
                            Tag: {item.assetTag}
                          </Badge>
                        )}
                        {item.status === 'low-stock' && (
                          <AlertTriangle className="w-4 h-4 text-warning" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>ID: {item.id}</span>
                        <span>&bull;</span>
                        <span>Category: {item.category}</span>
                        <span>&bull;</span>
                        <span>Custodian: {item.custodian}</span>
                        <span>&bull;</span>
                        <span>Last Movement: {item.lastMovement}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={paths.dashboard.procurement.inventory.detail(item.id)}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View Details
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {item.type === 'asset' ? 'Quantity' : 'Current Stock'}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {item.quantity} {item.type === 'consumable' && 'units'}
                    </p>
                  </div>
                  {item.type === 'consumable' && item.minStock && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Min Stock</p>
                      <p className="text-sm font-medium text-foreground">{item.minStock}</p>
                    </div>
                  )}
                  {item.type === 'consumable' && item.issued !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Issued (Month)</p>
                      <p className="text-sm font-medium text-foreground">{item.issued}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Unit Price</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatBDT(item.unitPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Value</p>
                    <p className="text-sm font-semibold text-primary">
                      {formatBDT(item.totalValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Location</p>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.location}
                      </p>
                    </div>
                  </div>
                </div>

                {item.status === 'low-stock' && item.type === 'consumable' && (
                  <div className="mt-3 p-2 bg-warning/10 border border-warning/20 rounded flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <p className="text-sm text-warning">
                      Stock level below minimum. Current: {item.quantity}, Required: {item.minStock}
                      . Reorder recommended.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
