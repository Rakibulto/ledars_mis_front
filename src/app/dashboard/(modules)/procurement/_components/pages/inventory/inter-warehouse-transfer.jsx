'use client';

import { useState } from 'react';
import {
  X,
  Plus,
  Save,
  Send,
  Clock,
  Truck,
  Search,
  Trash2,
  Printer,
  Download,
  FileText,
  Warehouse,
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  ArrowLeftRight,
} from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const mockTransfers = [
  {
    id: 'TRF-2026-001',
    fromWarehouse: 'Teknaf Warehouse - 1',
    toWarehouse: 'Teknaf Warehouse - 2',
    items: [
      { name: 'Tarpaulins (4m x 6m)', qty: 25 },
      { name: 'Rope rolls (50m)', qty: 10 },
    ],
    totalItems: 35,
    status: 'completed',
    initiatedBy: 'Karim Uddin',
    approvedBy: 'Robiul Awal',
    initiatedDate: '2026-04-01',
    completedDate: '2026-04-02',
    reason: 'Stock redistribution for camp 14 emergency response',
    challan: { id: 'CH-AAB-2026-016', generated: true },
    waybill: {
      id: 'WB-AAB-2026-009',
      vehicleNo: 'Ctg Metro-Ga-22-1234',
      driverName: 'Zahid Hasan',
      driverPhone: '01612345678',
    },
    releaseNote: 'MRL-AAB-2026-013',
  },
  {
    id: 'TRF-2026-002',
    fromWarehouse: 'Ukhiya Central Warehouse',
    toWarehouse: 'Teknaf Warehouse - 1',
    items: [
      { name: 'First Aid Kits - Standard', qty: 20 },
      { name: 'Water Purification Tablets', qty: 50 },
    ],
    totalItems: 70,
    status: 'in-transit',
    initiatedBy: 'Rahima Begum',
    approvedBy: 'Shahidul Alam',
    initiatedDate: '2026-04-03',
    completedDate: null,
    reason: 'Replenish low stock at Teknaf WH-1',
    challan: { id: 'CH-AAB-2026-017', generated: true },
    waybill: {
      id: 'WB-AAB-2026-010',
      vehicleNo: 'Dhaka Metro-Ka-45-6789',
      driverName: 'Md. Selim',
      driverPhone: '01712345678',
    },
    releaseNote: 'MRL-AAB-2026-014',
  },
  {
    id: 'TRF-2026-003',
    fromWarehouse: 'Teknaf Warehouse - 2',
    toWarehouse: 'Ukhiya Central Warehouse',
    items: [{ name: 'Blankets (Emergency)', qty: 40 }],
    totalItems: 40,
    status: 'pending-approval',
    initiatedBy: 'Selim Hossain',
    approvedBy: null,
    initiatedDate: '2026-04-04',
    completedDate: null,
    reason: 'Excess stock reallocation to central warehouse',
    challan: null,
    waybill: null,
    releaseNote: null,
  },
  {
    id: 'TRF-2026-004',
    fromWarehouse: 'Ukhiya Central Warehouse',
    toWarehouse: 'Teknaf Warehouse - 2',
    items: [
      { name: 'Hygiene Kits', qty: 30 },
      { name: 'Solar Lanterns', qty: 15 },
    ],
    totalItems: 45,
    status: 'completed',
    initiatedBy: 'Rahima Begum',
    approvedBy: 'Shahidul Alam',
    initiatedDate: '2026-03-28',
    completedDate: '2026-03-29',
    reason: 'Regular restocking for Teknaf WH-2',
    challan: { id: 'CH-AAB-2026-015', generated: true },
    waybill: {
      id: 'WB-AAB-2026-008',
      vehicleNo: 'Ctg Metro-Kha-33-5678',
      driverName: 'Abdul Karim',
      driverPhone: '01898765432',
    },
    releaseNote: 'MRL-AAB-2026-012',
  },
];
const statusBadge = (status) => {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="success" size="sm">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    case 'in-transit':
      return (
        <Badge variant="info" size="sm">
          <ArrowLeftRight className="w-3 h-3 mr-1" />
          In Transit
        </Badge>
      );
    case 'pending-approval':
      return (
        <Badge variant="warning" size="sm">
          <Clock className="w-3 h-3 mr-1" />
          Pending Approval
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="danger" size="sm">
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="default" size="sm">
          {status}
        </Badge>
      );
  }
};
export function InterWarehouseTransfer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const filtered = mockTransfers.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.fromWarehouse.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.toWarehouse.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Inter-Warehouse Transfers
            </h1>
            <p className="text-muted-foreground">
              Track and manage stock movements between warehouses — with Challan, Waybill &amp;
              Release Note
            </p>
          </div>
          <Button size="sm" variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? (
              <>
                <X className="w-3.5 h-3.5 mr-1.5" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                New Transfer Request
              </>
            )}
          </Button>
        </div>

        {/* Access Roles */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground mr-2">Access:</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error">
            Admin (Full)
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            Store Staff (Create, Track)
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
            Programme Colleague (View)
          </span>
        </div>
      </div>

      {/* New Transfer Form */}
      {showForm && <TransferRequestForm onCancel={() => setShowForm(false)} />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Transfers"
          value={mockTransfers.length}
          icon={ArrowLeftRight}
          color="blue"
        />
        <StatCard
          title="In Transit"
          value={mockTransfers.filter((t) => t.status === 'in-transit').length}
          icon={Send}
          color="orange"
        />
        <StatCard
          title="Pending Approval"
          value={mockTransfers.filter((t) => t.status === 'pending-approval').length}
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Completed"
          value={mockTransfers.filter((t) => t.status === 'completed').length}
          icon={CheckCircle}
          color="green"
        />
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transfers by ID or warehouse..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="pending-approval">Pending Approval</option>
              <option value="in-transit">In Transit</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="space-y-4">
            {filtered.map((transfer) => (
              <div
                key={transfer.id}
                className="p-4 border border-border rounded-lg hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ArrowLeftRight className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{transfer.id}</span>
                        {statusBadge(transfer.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{transfer.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{transfer.initiatedDate}</p>
                    {transfer.completedDate && (
                      <p className="text-xs text-green-600">Completed: {transfer.completedDate}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3 pl-13">
                  <div className="flex-1 p-2.5 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-0.5">From</p>
                    <p className="text-sm font-medium text-foreground flex items-center gap-1">
                      <Warehouse className="w-3.5 h-3.5 text-muted-foreground" />
                      {transfer.fromWarehouse}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 p-2.5 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-0.5">To</p>
                    <p className="text-sm font-medium text-foreground flex items-center gap-1">
                      <Warehouse className="w-3.5 h-3.5 text-muted-foreground" />
                      {transfer.toWarehouse}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pl-13">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      Items:{' '}
                      <span className="font-medium text-foreground">
                        {transfer.items.map((i) => `${i.name} (${i.qty})`).join(', ')}
                      </span>
                    </span>
                    <Badge variant="outline" size="sm">
                      {transfer.totalItems} total items
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>By: {transfer.initiatedBy}</span>
                    {transfer.approvedBy && <span>Approved: {transfer.approvedBy}</span>}
                  </div>
                </div>

                {/* Document Badges & Actions */}
                <div className="mt-3 pl-13 flex items-center gap-2 flex-wrap">
                  {transfer.releaseNote && (
                    <Badge variant="outline" size="sm">
                      <FileText className="w-3 h-3 mr-1" />
                      Release Note: {transfer.releaseNote}
                    </Badge>
                  )}
                  {transfer.challan && (
                    <Badge variant="outline" size="sm">
                      <Printer className="w-3 h-3 mr-1" />
                      Challan: {transfer.challan.id}
                    </Badge>
                  )}
                  {transfer.waybill && (
                    <Badge variant="outline" size="sm">
                      <Truck className="w-3 h-3 mr-1" />
                      Waybill: {transfer.waybill.id}
                    </Badge>
                  )}
                  {(transfer.status === 'completed' || transfer.status === 'in-transit') && (
                    <div className="ml-auto flex gap-1">
                      {transfer.challan && (
                        <Button type="button" variant="outline" size="sm">
                          <Printer className="w-3 h-3 mr-1" />
                          Print Challan
                        </Button>
                      )}
                      {transfer.waybill && (
                        <Button type="button" variant="outline" size="sm">
                          <Truck className="w-3 h-3 mr-1" />
                          Print Waybill
                        </Button>
                      )}
                      <Button type="button" variant="outline" size="sm">
                        <FileText className="w-3 h-3 mr-1" />
                        Release Note
                      </Button>
                      <Button type="button" variant="outline" size="sm">
                        <Download className="w-3 h-3 mr-1" />
                        All Docs
                      </Button>
                    </div>
                  )}
                  {transfer.status === 'pending-approval' && (
                    <span className="text-xs text-muted-foreground italic ml-auto">
                      Documents generated after approval
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
const warehouseOptions = [
  'Dhaka HQ Store',
  'Ukhiya Central Warehouse',
  'Teknaf Warehouse - 1',
  'Teknaf Warehouse - 2',
];
const availableItems = [
  { id: '1', name: 'Tarpaulins (4m x 6m)', stock: 215 },
  { id: '2', name: 'Rope rolls (50m)', stock: 120 },
  { id: '3', name: 'First Aid Kits - Standard', stock: 48 },
  { id: '4', name: 'Water Purification Tablets', stock: 900 },
  { id: '5', name: 'Blankets (Emergency)', stock: 180 },
  { id: '6', name: 'Hygiene Kits', stock: 28 },
  { id: '7', name: 'Solar Lanterns', stock: 35 },
  { id: '8', name: 'Shelter Toolkit', stock: 33 },
  { id: '9', name: 'Bottled Water (1.5L Case of 12)', stock: 275 },
];
function TransferRequestForm({ onCancel }) {
  const [fromWarehouse, setFromWarehouse] = useState('');
  const [toWarehouse, setToWarehouse] = useState('');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState([{ id: '1', itemId: '', qty: 1 }]);
  const addItem = () => setItems([...items, { id: String(items.length + 1), itemId: '', qty: 1 }]);
  const removeItem = (id) => {
    if (items.length > 1) setItems(items.filter((i) => i.id !== id));
  };
  const handleSubmit = () => {
    if (!fromWarehouse || !toWarehouse || fromWarehouse === toWarehouse) {
      alert('Please select different From and To warehouses.');
      return;
    }
    if (!items.some((i) => i.itemId && i.qty > 0)) {
      alert('Please add at least one item with quantity.');
      return;
    }
    alert(`Transfer request TRF-2026-005 submitted!\nFrom: ${fromWarehouse}\nTo: ${toWarehouse}`);
    onCancel();
  };
  return (
    <div className="mb-6 space-y-6">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader
          title="New Transfer Request"
          description="Move stock between Ledars NGO warehouses"
        />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                From Warehouse *
              </label>
              <select
                value={fromWarehouse}
                onChange={(e) => setFromWarehouse(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              >
                <option value="">Select source warehouse</option>
                {warehouseOptions.map((wh) => (
                  <option key={wh} value={wh}>
                    {wh}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                To Warehouse *
              </label>
              <select
                value={toWarehouse}
                onChange={(e) => setToWarehouse(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              >
                <option value="">Select destination warehouse</option>
                {warehouseOptions
                  .filter((wh) => wh !== fromWarehouse)
                  .map((wh) => (
                    <option key={wh} value={wh}>
                      {wh}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {fromWarehouse && toWarehouse && fromWarehouse !== toWarehouse && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-background rounded-lg border border-border">
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground mb-1">From</p>
                <p className="text-sm font-semibold text-foreground flex items-center justify-center gap-1">
                  <Warehouse className="w-4 h-4 text-muted-foreground" />
                  {fromWarehouse}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground mb-1">To</p>
                <p className="text-sm font-semibold text-foreground flex items-center justify-center gap-1">
                  <Warehouse className="w-4 h-4 text-muted-foreground" />
                  {toWarehouse}
                </p>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Reason / Justification *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Stock redistribution for camp emergency response"
              rows={2}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-background"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Transfer Items"
          description="Select items and quantities from the source warehouse"
          action={
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          }
        />
        <CardBody>
          <div className="space-y-3">
            {items.map((item, index) => {
              const selected = availableItems.find((ai) => ai.id === item.itemId);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg"
                >
                  <span className="text-sm font-medium text-muted-foreground w-8">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <select
                      value={item.itemId}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((i) => (i.id === item.id ? { ...i, itemId: e.target.value } : i))
                        )
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select item</option>
                      {availableItems.map((ai) => (
                        <option key={ai.id} value={ai.id}>
                          {ai.name} (Stock: {ai.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((i) =>
                          i.id === item.id
                            ? {
                                ...i,
                                qty: Math.min(
                                  parseInt(e.target.value) || 1,
                                  selected?.stock || 9999
                                ),
                              }
                            : i
                        )
                      )
                    }
                    min={1}
                    max={selected?.stock || 9999}
                    className="w-24 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {selected && (
                    <span className="text-xs text-muted-foreground w-20">
                      Avail: {selected.stock}
                    </span>
                  )}
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-error hover:bg-error/10 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <div className="flex gap-4">
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="primary" size="sm" className="flex-1" onClick={handleSubmit}>
          <Save className="w-3.5 h-3.5 mr-1.5" />
          Submit Transfer Request
        </Button>
      </div>
    </div>
  );
}
