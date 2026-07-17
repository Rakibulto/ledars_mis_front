'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Plus,
  Save,
  Search,
  Package,
  XCircle,
  Calendar,
  Download,
  FileText,
  Warehouse,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

const mockMovements = [
  {
    id: 'MOV-AAB-2026-045',
    date: '2026-03-28',
    time: '14:30',
    type: 'Stock In',
    item: 'HP ProBook 450 G10 Laptop',
    itemId: 'INV-AAB-2026-0012',
    quantity: 15,
    fromLocation: 'TechBD Solutions Ltd (Vendor)',
    toLocation: 'Dhaka HQ Store',
    reference: 'GRN-AAB-2026-003',
    processedBy: 'Fatema Khatun',
    balanceBefore: 0,
    balanceAfter: 15,
  },
  {
    id: 'MOV-AAB-2026-044',
    date: '2026-03-27',
    time: '11:20',
    type: 'Stock In',
    item: 'A4 Paper (80gsm, 500 sheet ream)',
    itemId: 'INV-AAB-2026-0045',
    quantity: 500,
    fromLocation: 'Dhaka Print House Ltd (Vendor)',
    toLocation: 'Ukhiya Central Warehouse',
    reference: 'GRN-AAB-2026-004',
    processedBy: 'Rahima Begum',
    balanceBefore: 0,
    balanceAfter: 500,
  },
  {
    id: 'MOV-AAB-2026-043',
    date: '2026-03-26',
    time: '15:45',
    type: 'Issue',
    item: 'Emergency Tarpaulin (12ft x 18ft)',
    itemId: 'INV-AAB-2026-0090',
    quantity: 80,
    fromLocation: 'Ukhiya Central Warehouse',
    toLocation: 'Camp 4 (Kutupalong)',
    reference: 'ISS-AAB-2026-045',
    processedBy: 'Rahima Begum',
    issuedTo: 'Camp Manager — Camp 4',
    releaseNote: 'MRL-AAB-2026-012',
    balanceBefore: 125,
    balanceAfter: 45,
  },
  {
    id: 'MOV-AAB-2026-042',
    date: '2026-03-25',
    time: '10:30',
    type: 'Transfer',
    item: 'Hygiene Kit (Family Pack)',
    itemId: 'INV-AAB-2026-0091',
    quantity: 30,
    fromLocation: 'Ukhiya Central Warehouse',
    toLocation: 'Teknaf Warehouse-1',
    reference: 'TRF-AAB-2026-012',
    processedBy: 'Karim Uddin',
    waybill: 'WB-AAB-2026-008',
    challan: 'CH-AAB-2026-015',
    balanceBefore: 58,
    balanceAfter: 28,
  },
  {
    id: 'MOV-AAB-2026-041',
    date: '2026-03-24',
    time: '09:15',
    type: 'Issue',
    item: 'First Aid Kit (Standard)',
    itemId: 'INV-AAB-2026-0092',
    quantity: 15,
    fromLocation: 'Ukhiya Central Warehouse',
    toLocation: 'Camp 18 (Balukhali)',
    reference: 'ISS-AAB-2026-043',
    processedBy: 'Rahima Begum',
    issuedTo: 'Health Programme Team',
    releaseNote: 'MRL-AAB-2026-011',
    balanceBefore: 27,
    balanceAfter: 12,
  },
  {
    id: 'MOV-AAB-2026-040',
    date: '2026-03-22',
    time: '16:00',
    type: 'Adjustment',
    item: 'Toner Cartridge HP 26A (Black)',
    itemId: 'INV-AAB-2026-0078',
    quantity: -3,
    fromLocation: 'Dhaka HQ Store',
    toLocation: 'Dhaka HQ Store',
    reference: 'ADJ-AAB-2026-003',
    processedBy: 'Md. Rafiqul Islam',
    reason: 'Damaged units removed — water damage during transit',
    balanceBefore: 28,
    balanceAfter: 25,
  },
];
const getMovementColor = (type) => {
  switch (type) {
    case 'Stock In':
      return 'success';
    case 'Issue':
      return 'warning';
    case 'Transfer':
      return 'default';
    case 'Adjustment':
      return 'error';
    default:
      return 'default';
  }
};
export function StockMovementHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const filteredMovements = mockMovements.filter((mov) => {
    const matchesSearch =
      mov.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mov.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mov.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || mov.type === typeFilter;
    const matchesWarehouse =
      warehouseFilter === 'all' ||
      mov.fromLocation.includes(warehouseFilter) ||
      mov.toLocation.includes(warehouseFilter);
    return matchesSearch && matchesType && matchesWarehouse;
  });
  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Material In/Out Tracking
            </h1>
            <p className="text-muted-foreground">
              Ledars NGO — Track all material in (GRN), out (release), transfers & adjustments
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowReturnForm(!showReturnForm);
                setShowAdjustForm(false);
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Return to Store
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAdjustForm(!showAdjustForm);
                setShowReturnForm(false);
              }}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Stock Adjustment
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Link href="/dashboard/procurement/inventory/issue">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                New Transaction
              </Button>
            </Link>
          </div>
        </div>

        {/* Access Roles */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground mr-2">Access:</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error">
            Admin (Full)
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            Store Staff (Track, Update)
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
            Programme Colleague (View)
          </span>
        </div>
      </div>

      {/* Stock Adjustment Form */}
      {showAdjustForm && (
        <Card className="mb-6 border-error/30 bg-error/5">
          <CardHeader
            title="Stock Adjustment"
            description="Record damaged, lost, expired or surplus items — updates system balance"
          />
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="block text-sm font-medium text-foreground mb-2">
                  Warehouse / Store *
                </p>
                <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Select warehouse</option>
                  <option value="Dhaka HQ Store">Dhaka HQ Store</option>
                  <option value="Ukhiya Central Warehouse">Ukhiya Central Warehouse</option>
                  <option value="Teknaf Warehouse-1">Teknaf Warehouse-1</option>
                  <option value="Teknaf Warehouse-2">Teknaf Warehouse-2</option>
                </select>
              </div>
              <div>
                <p className="block text-sm font-medium text-foreground mb-2">Adjustment Type *</p>
                <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Select type</option>
                  <option value="damaged">Damaged / Broken</option>
                  <option value="lost">Lost / Missing</option>
                  <option value="expired">Expired</option>
                  <option value="surplus">Surplus (physical count higher)</option>
                  <option value="write-off">Write-off / Disposal</option>
                </select>
              </div>
              <div>
                <p className="block text-sm font-medium text-foreground mb-2">Date *</p>
                <input
                  type="date"
                  defaultValue="2026-04-04"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="block text-sm font-medium text-foreground mb-2">Item *</p>
                <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Select item</option>
                  <option>Emergency Tarpaulin (12ft x 18ft) — Stock: 45</option>
                  <option>Toner Cartridge HP 26A — Stock: 25</option>
                  <option>First Aid Kit (Standard) — Stock: 12</option>
                  <option>Hygiene Kit (Family Pack) — Stock: 28</option>
                  <option>A4 Paper (80gsm, 500 sheet ream) — Stock: 450</option>
                </select>
              </div>
              <div>
                <p className="block text-sm font-medium text-foreground mb-2">Quantity (+/-) *</p>
                <input
                  type="number"
                  placeholder="e.g. -3 for removal, +5 for surplus"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <p className="block text-sm font-medium text-foreground mb-2">Authorized By</p>
                <input
                  type="text"
                  placeholder="e.g. Md. Ashraful Hoque"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="mb-4">
              <p className="block text-sm font-medium text-foreground mb-2">Reason / Remarks *</p>
              <textarea
                rows={2}
                placeholder="Describe why this adjustment is needed..."
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setShowAdjustForm(false)}
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={() => {
                  alert('Stock adjustment ADJ-AAB-2026-004 recorded successfully!');
                  setShowAdjustForm(false);
                }}
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Record Adjustment
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Return to Store Form */}
      {showReturnForm && (
        <Card className="mb-6 border-success/30 bg-success/5">
          <CardHeader
            title="Return to Store"
            description="Return previously issued items back to warehouse — updates stock balance"
          />
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="block text-sm font-medium text-foreground mb-2">
                  Return To (Warehouse/Store) *
                </p>
                <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Select warehouse</option>
                  <option value="Dhaka HQ Store">Dhaka HQ Store</option>
                  <option value="Ukhiya Central Warehouse">Ukhiya Central Warehouse</option>
                  <option value="Teknaf Warehouse-1">Teknaf Warehouse-1</option>
                  <option value="Teknaf Warehouse-2">Teknaf Warehouse-2</option>
                </select>
              </div>
              <div>
                <p className="block text-sm font-medium text-foreground mb-2">
                  Original Issue Reference
                </p>
                <input
                  type="text"
                  placeholder="e.g. ISS-AAB-2026-045"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <p className="block text-sm font-medium text-foreground mb-2">Date *</p>
                <input
                  type="date"
                  defaultValue="2026-04-04"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="block text-sm font-medium text-foreground mb-2">
                  Item Being Returned *
                </p>
                <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Select item</option>
                  <option>Emergency Tarpaulin (12ft x 18ft)</option>
                  <option>First Aid Kit (Standard)</option>
                  <option>Solar Lantern (Rechargeable)</option>
                  <option>Hygiene Kit (Family Pack)</option>
                  <option>Blanket (Thermal, 5ft x 7ft)</option>
                </select>
              </div>
              <div>
                <p className="block text-sm font-medium text-foreground mb-2">Quantity *</p>
                <input
                  type="number"
                  min={1}
                  placeholder="Quantity returning"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <p className="block text-sm font-medium text-foreground mb-2">Condition</p>
                <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="good">Good — Reusable</option>
                  <option value="fair">Fair — Minor wear</option>
                  <option value="damaged">Damaged — Needs repair</option>
                  <option value="unusable">Unusable — Write-off</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="block text-sm font-medium text-foreground mb-2">Returned By *</p>
                <input
                  type="text"
                  placeholder="e.g. Camp Manager — Camp 4"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <p className="block text-sm font-medium text-foreground mb-2">Received By *</p>
                <input
                  type="text"
                  placeholder="e.g. Rahima Begum"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="mb-4">
              <p className="block text-sm font-medium text-foreground mb-2">Remarks</p>
              <textarea
                rows={2}
                placeholder="Reason for return, condition notes..."
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setShowReturnForm(false)}
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={() => {
                  alert('Return RTN-AAB-2026-001 recorded! Stock updated.');
                  setShowReturnForm(false);
                }}
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Record Return
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by item, ID, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Warehouses</option>
              <option value="Dhaka HQ Store">Dhaka HQ Store</option>
              <option value="Ukhiya Central">Ukhiya Central Warehouse</option>
              <option value="Teknaf Warehouse-1">Teknaf Warehouse-1</option>
              <option value="Teknaf Warehouse-2">Teknaf Warehouse-2</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Types</option>
              <option value="Stock In">Stock In (via GRN)</option>
              <option value="Issue">Issue (via Release)</option>
              <option value="Transfer">Transfer</option>
              <option value="Adjustment">Adjustment</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardBody>
      </Card>

      {/* Movement List */}
      <Card>
        <CardHeader
          title={`Stock Movements (${filteredMovements.length})`}
          description="All inventory transactions — stock in via GRN, stock out via release"
        />
        <CardBody>
          <div className="space-y-3">
            {filteredMovements.map((mov) => (
              <div
                key={mov.id}
                className="border-2 border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${mov.type === 'Stock In' ? 'bg-success/10' : mov.type === 'Issue' ? 'bg-warning/10' : mov.type === 'Transfer' ? 'bg-primary/10' : 'bg-error/10'}`}
                    >
                      {mov.type === 'Stock In' ? (
                        <Plus className="w-3.5 h-3.5 text-success" />
                      ) : mov.type === 'Issue' ? (
                        <Package className="w-3.5 h-3.5 text-warning" />
                      ) : mov.type === 'Transfer' ? (
                        <ArrowRight className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <Calendar className="w-3.5 h-3.5 text-error" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{mov.id}</h3>
                        <Badge variant={getMovementColor(mov.type)}>{mov.type}</Badge>
                        <Badge variant={mov.quantity > 0 ? 'success' : 'error'} size="sm">
                          {mov.quantity > 0 ? '+' : ''}
                          {mov.quantity} units
                        </Badge>
                      </div>
                      <Link href={paths.dashboard.procurement.inventory.detail(mov.itemId)}>
                        <p className="text-sm font-medium text-primary hover:underline mb-2">
                          {mov.item}
                        </p>
                      </Link>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                        <span>
                          {mov.date} at {mov.time}
                        </span>
                        <span>&bull;</span>
                        <span>Ref: {mov.reference}</span>
                        <span>&bull;</span>
                        <span>By: {mov.processedBy}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">From</p>
                    <p className="text-sm font-medium text-foreground">{mov.fromLocation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">To</p>
                    <p className="text-sm font-medium text-foreground">{mov.toLocation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Balance Before</p>
                    <p className="text-sm font-semibold text-foreground">{mov.balanceBefore}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Balance After</p>
                    <p className="text-sm font-semibold text-primary">{mov.balanceAfter}</p>
                  </div>
                </div>

                {/* Related documents */}
                {(mov.releaseNote || mov.waybill || mov.challan) && (
                  <div className="mt-3 flex items-center gap-3 text-xs">
                    {mov.releaseNote && (
                      <Badge variant="outline" size="sm">
                        <FileText className="w-3 h-3 mr-1" />
                        Release: {mov.releaseNote}
                      </Badge>
                    )}
                    {mov.waybill && (
                      <Badge variant="outline" size="sm">
                        <Warehouse className="w-3 h-3 mr-1" />
                        Waybill: {mov.waybill}
                      </Badge>
                    )}
                    {mov.challan && (
                      <Badge variant="outline" size="sm">
                        <FileText className="w-3 h-3 mr-1" />
                        Challan: {mov.challan}
                      </Badge>
                    )}
                  </div>
                )}

                {mov.issuedTo && (
                  <div className="mt-3 p-2 bg-warning/10 border border-warning/20 rounded flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Issued to:</span>
                    <span className="font-medium text-foreground">{mov.issuedTo}</span>
                  </div>
                )}

                {mov.reason && (
                  <div className="mt-3 p-2 bg-error/10 border border-error/20 rounded flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Reason:</span>
                    <span className="font-medium text-foreground">{mov.reason}</span>
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
