'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Plus,
  Save,
  Truck,
  Clock,
  Search,
  Printer,
  Package,
  XCircle,
  FileText,
  Download,
  Calendar,
  Warehouse,
  ArrowRight,
  CheckCircle,
  ShieldCheck,
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
// Role-based access configuration
const accessRoles = [
  {
    role: 'Admin',
    color: 'bg-error/10 text-error',
    permissions: ['Create', 'Approve', 'View All', 'Generate Docs'],
  },
  {
    role: 'Store Staff',
    color: 'bg-primary/10 text-primary',
    permissions: ['Create', 'Issue', 'Generate Docs'],
  },
  {
    role: 'Programme Colleague',
    color: 'bg-success/10 text-success',
    permissions: ['Request', 'View Own'],
  },
];
// Warehouse/Store locations
const warehouseLocations = [
  { id: 'dhaka-hq', name: 'Dhaka HQ Store', code: 'DHK-HQ' },
  { id: 'ukhiya-central', name: 'Ukhiya Central Warehouse', code: 'UKH-CW' },
  { id: 'teknaf-1', name: 'Teknaf Warehouse-1', code: 'TEK-W1' },
  { id: 'teknaf-2', name: 'Teknaf Warehouse-2', code: 'TEK-W2' },
];
// Mock Material Release Notes with 3-level approval: Requester → Requester Supervisor → Project Manager + Challan + Waybill + GRN
const mockReleases = [
  {
    id: 'MRL-AAB-2026-012',
    date: '2026-03-29',
    requisitionRef: 'MR-AAB-2026-015',
    type: 'goods-release',
    status: 'released',
    fromWarehouse: 'Ukhiya Central Warehouse',
    toDestination: 'Camp 4 (Kutupalong)',
    facility: 'Camp 4 Kutupalong Distribution Centre',
    requester: 'Dr. Nafisa Akter',
    requesterRole: 'Programme Colleague',
    releasedBy: 'Rahima Begum',
    receivedBy: 'Camp Manager — Camp 4',
    items: [
      { name: 'Emergency Tarpaulin (12ft x 18ft)', qty: 80, unit: 'pcs', unitPrice: 1200 },
      { name: 'Hygiene Kit (Family Pack)', qty: 50, unit: 'kits', unitPrice: 850 },
    ],
    totalValue: 138500,
    approvalChain: [
      {
        role: 'Requester',
        name: 'Dr. Nafisa Akter',
        status: 'completed',
        date: '2026-03-27',
        designation: 'Health Programme Manager',
      },
      {
        role: 'Requester Supervisor',
        name: 'Selim Hossain',
        status: 'completed',
        date: '2026-03-28',
        designation: 'Supervisor — Health Programme',
      },
      {
        role: 'Project Manager',
        name: 'Md. Kamal Hossain',
        status: 'completed',
        date: '2026-03-29',
        designation: 'Project Manager — HCMP',
      },
    ],
    challan: { id: 'CH-AAB-2026-015', generated: true },
    waybill: {
      id: 'WB-AAB-2026-008',
      generated: true,
      vehicleNo: 'Dhaka Metro-Ka-45-6789',
      driverName: 'Md. Selim',
      driverPhone: '01712345678',
    },
    grnRef: 'GRN-AAB-2026-009',
    documents: ['Material Release Note', 'Goods Release Note', 'Challan', 'Waybill'],
  },
  {
    id: 'MRL-AAB-2026-011',
    date: '2026-03-27',
    requisitionRef: 'MR-AAB-2026-014',
    type: 'goods-release',
    status: 'released',
    fromWarehouse: 'Dhaka HQ Store',
    toDestination: 'IT Department — Conference Room Setup',
    facility: 'Dhaka Head Office — 2nd Floor',
    requester: 'Md. Rafiqul Islam',
    requesterRole: 'Programme Colleague',
    releasedBy: 'Md. Rafiqul Islam',
    receivedBy: 'Md. Rafiqul Islam',
    items: [
      { name: 'USB Flash Drive (64GB)', qty: 20, unit: 'pcs', unitPrice: 650 },
      { name: 'HDMI Cable (2m)', qty: 10, unit: 'pcs', unitPrice: 450 },
      { name: 'Ethernet Cable (Cat6, 3m)', qty: 15, unit: 'pcs', unitPrice: 250 },
    ],
    totalValue: 21250,
    approvalChain: [
      {
        role: 'Requester',
        name: 'Md. Rafiqul Islam',
        status: 'completed',
        date: '2026-03-24',
        designation: 'IT Manager',
      },
      {
        role: 'Requester Supervisor',
        name: 'Md. Ashraful Hoque',
        status: 'completed',
        date: '2026-03-25',
        designation: 'Supervisor — IT',
      },
      {
        role: 'Project Manager',
        name: 'Shahana Begum',
        status: 'completed',
        date: '2026-03-26',
        designation: 'Project Manager — HCMP',
      },
    ],
    challan: { id: 'CH-AAB-2026-014', generated: true },
    waybill: null,
    grnRef: null,
    documents: ['Material Release Note', 'Goods Release Note', 'Challan'],
  },
  {
    id: 'MRL-AAB-2026-010',
    date: '2026-03-25',
    requisitionRef: null,
    type: 'inter-warehouse',
    status: 'in-transit',
    fromWarehouse: 'Ukhiya Central Warehouse',
    toDestination: 'Teknaf Warehouse-1',
    facility: 'Teknaf Warehouse-1',
    requester: 'Rahima Begum',
    requesterRole: 'Store Staff',
    releasedBy: 'Rahima Begum',
    receivedBy: 'Karim Uddin (Pending)',
    items: [
      { name: 'Blanket (Thermal, 5ft x 7ft)', qty: 100, unit: 'pcs', unitPrice: 950 },
      { name: 'Solar Lantern (Rechargeable)', qty: 50, unit: 'pcs', unitPrice: 2200 },
    ],
    totalValue: 205000,
    approvalChain: [
      {
        role: 'Requester',
        name: 'Rahima Begum',
        status: 'completed',
        date: '2026-03-23',
        designation: 'Warehouse Manager',
      },
      {
        role: 'Requester Supervisor',
        name: 'Karim Uddin',
        status: 'completed',
        date: '2026-03-24',
        designation: 'Supervisor — Logistics',
      },
      {
        role: 'Project Manager',
        name: 'Md. Kamal Hossain',
        status: 'completed',
        date: '2026-03-25',
        designation: 'Project Manager — HCMP',
      },
    ],
    challan: { id: 'CH-AAB-2026-013', generated: true },
    waybill: {
      id: 'WB-AAB-2026-007',
      generated: true,
      vehicleNo: 'Ctg Metro-Ga-12-3456',
      driverName: 'Abdul Karim',
      driverPhone: '01898765432',
    },
    grnRef: null,
    documents: ['Material Release Note', 'Challan', 'Waybill'],
  },
  {
    id: 'MRL-AAB-2026-009',
    date: '2026-03-23',
    requisitionRef: 'MR-AAB-2026-013',
    type: 'goods-release',
    status: 'pending-supervisor',
    fromWarehouse: 'Ukhiya Central Warehouse',
    toDestination: 'Camp 18 (Balukhali)',
    facility: 'Camp 18 Balukhali Health Centre',
    requester: 'Dr. Nafisa Akter',
    requesterRole: 'Programme Colleague',
    releasedBy: null,
    receivedBy: null,
    items: [
      { name: 'First Aid Kit (Standard)', qty: 15, unit: 'kits', unitPrice: 2500 },
      { name: 'Disposable Gloves (Box of 100)', qty: 20, unit: 'boxes', unitPrice: 350 },
      { name: 'Face Mask (3-ply, Box of 50)', qty: 15, unit: 'boxes', unitPrice: 250 },
    ],
    totalValue: 48250,
    approvalChain: [
      {
        role: 'Requester',
        name: 'Dr. Nafisa Akter',
        status: 'completed',
        date: '2026-03-23',
        designation: 'Health Programme Manager',
      },
      {
        role: 'Requester Supervisor',
        name: 'Selim Hossain',
        status: 'pending',
        date: null,
        designation: 'Supervisor — Health Programme',
      },
      {
        role: 'Project Manager',
        name: 'Md. Kamal Hossain',
        status: 'waiting',
        date: null,
        designation: 'Project Manager — HCMP',
      },
    ],
    challan: null,
    waybill: null,
    grnRef: null,
    documents: [],
  },
  {
    id: 'MRL-AAB-2026-008',
    date: '2026-03-20',
    requisitionRef: 'MR-AAB-2026-012',
    type: 'goods-release',
    status: 'pending-pm',
    fromWarehouse: 'Dhaka HQ Store',
    toDestination: 'Dhaka HQ — Admin Department',
    facility: 'Dhaka Head Office — 3rd Floor Admin Unit',
    requester: 'Tasneem Jahan',
    requesterRole: 'Programme Colleague',
    releasedBy: null,
    receivedBy: null,
    items: [
      { name: 'A4 Paper (80gsm, 500 sheet ream)', qty: 30, unit: 'reams', unitPrice: 500 },
      { name: 'Toner Cartridge HP 26A', qty: 3, unit: 'pcs', unitPrice: 3500 },
    ],
    totalValue: 25500,
    approvalChain: [
      {
        role: 'Requester',
        name: 'Tasneem Jahan',
        status: 'completed',
        date: '2026-03-19',
        designation: 'Communications Officer',
      },
      {
        role: 'Requester Supervisor',
        name: 'Shahana Begum',
        status: 'completed',
        date: '2026-03-20',
        designation: 'Supervisor — Communications',
      },
      {
        role: 'Project Manager',
        name: 'Farah Kabir',
        status: 'pending',
        date: null,
        designation: 'Project Manager',
      },
    ],
    challan: null,
    waybill: null,
    grnRef: null,
    documents: [],
  },
];
const getStatusBadge = (status) => {
  switch (status) {
    case 'released':
      return { variant: 'success', label: 'Released' };
    case 'in-transit':
      return { variant: 'warning', label: 'In Transit' };
    case 'pending-supervisor':
      return { variant: 'warning', label: 'Pending Supervisor' };
    case 'pending-pm':
      return { variant: 'warning', label: 'Pending Project Manager' };
    case 'pending':
      return { variant: 'default', label: 'Pending Release' };
    default:
      return { variant: 'default', label: status };
  }
};
const getApprovalStepColor = (status) => {
  switch (status) {
    case 'completed':
      return 'bg-success text-white';
    case 'pending':
      return 'bg-warning text-white animate-pulse';
    case 'waiting':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};
const getRoleBadge = (role) => {
  switch (role) {
    case 'Admin':
      return 'bg-error/10 text-error';
    case 'Store Staff':
      return 'bg-primary/10 text-primary';
    case 'Programme Colleague':
      return 'bg-success/10 text-success';
    default:
      return 'bg-muted text-muted-foreground';
  }
};
export function MaterialRelease() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const filteredReleases = mockReleases.filter((rel) => {
    const matchesSearch =
      rel.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rel.fromWarehouse.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rel.toDestination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rel.requester.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || rel.type === typeFilter;
    const matchesWarehouse = warehouseFilter === 'all' || rel.fromWarehouse === warehouseFilter;
    return matchesSearch && matchesType && matchesWarehouse;
  });
  const totalValue = mockReleases.reduce((s, r) => s + r.totalValue, 0);
  const pendingCount = mockReleases.filter((r) => r.status.startsWith('pending')).length;
  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header with Access Roles */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Material Release & Documents
            </h1>
            <p className="text-muted-foreground">
              Workflow: Requester → Requester Supervisor → Project Manager • Release Notes, GRN,
              Challans & Waybills
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export All
            </Button>
            <Button size="sm" variant="primary" onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {showCreateForm ? 'View List' : 'New Release Request'}
            </Button>
          </div>
        </div>

        {/* Access Role Indicators */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground mr-2">Access:</span>
          {accessRoles.map((r) => (
            <div key={r.role} className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.color}`}>
                {r.role}
              </span>
              <span className="text-xs text-muted-foreground">({r.permissions.join(', ')})</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Releases</p>
              <p className="text-xl font-semibold text-foreground">{mockReleases.length}</p>
            </div>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardBody>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Pending Approval</p>
              <p className="text-xl font-semibold text-warning">{pendingCount}</p>
            </div>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardBody>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-xl font-semibold text-success">
                {mockReleases.filter((r) => r.status === 'released').length}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Value</p>
              <p className="text-xl font-semibold text-primary">{formatBDT(totalValue)}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Documents Generated</p>
              <p className="text-xl font-semibold text-foreground">
                {mockReleases.reduce((s, r) => s + r.documents.length, 0)}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {showCreateForm ? (
        <CreateReleaseForm onCancel={() => setShowCreateForm(false)} />
      ) : (
        <>
          {/* Filters with Warehouse Selector */}
          <Card className="mb-6">
            <CardBody>
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by release ID, warehouse, destination, or requester..."
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
                  <option value="all">All Warehouses / Stores</option>
                  {warehouseLocations.map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Types</option>
                  <option value="goods-release">Goods Release</option>
                  <option value="inter-warehouse">Inter-Warehouse Transfer</option>
                </select>
              </div>
            </CardBody>
          </Card>

          {/* Release List */}
          <div className="space-y-4">
            {filteredReleases.map((release) => {
              const statusBadge = getStatusBadge(release.status);
              const isExpanded = expandedId === release.id;
              return (
                <Card key={release.id} hover>
                  <CardBody>
                    <div
                      className="flex items-start justify-between mb-4 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : release.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">{release.id}</h3>
                          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                          <Badge
                            variant={release.type === 'goods-release' ? 'default' : 'warning'}
                            size="sm"
                          >
                            {release.type === 'goods-release' ? 'Goods Release' : 'Inter-Warehouse'}
                          </Badge>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(release.requesterRole)}`}
                          >
                            {release.requesterRole}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {release.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Warehouse className="w-3 h-3" />
                            {release.fromWarehouse} → {release.toDestination}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            Requester:{' '}
                            <span className="font-medium text-foreground">{release.requester}</span>
                          </span>
                          <span>&bull;</span>
                          <span>Facility: {release.facility}</span>
                          {release.requisitionRef && (
                            <>
                              <span>&bull;</span>
                              <span>
                                MR:{' '}
                                <span className="text-primary font-medium">
                                  {release.requisitionRef}
                                </span>
                              </span>
                            </>
                          )}
                          {release.grnRef && (
                            <>
                              <span>&bull;</span>
                              <span>
                                GRN:{' '}
                                <span className="text-primary font-medium">{release.grnRef}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-primary">
                          {formatBDT(release.totalValue)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {release.items.length} items
                        </p>
                      </div>
                    </div>

                    {/* 3-Level Approval Chain */}
                    <div className="flex items-center gap-2 mb-3 p-3 bg-muted/20 rounded-lg">
                      <span className="text-xs font-medium text-muted-foreground mr-2">
                        Approval:
                      </span>
                      {release.approvalChain.map((step, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex flex-col items-center">
                            <div
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getApprovalStepColor(step.status)}`}
                            >
                              {step.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                              {step.status === 'pending' && <Clock className="w-3 h-3" />}
                              {step.role}
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {step.name}
                            </span>
                            {step.date && (
                              <span className="text-[10px] text-muted-foreground">{step.date}</span>
                            )}
                          </div>
                          {i < release.approvalChain.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Document Badges */}
                    {release.documents.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        {release.documents.map((doc, i) => (
                          <Badge key={i} variant="outline" size="sm">
                            <FileText className="w-3 h-3 mr-1" />
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Approval Actions for pending releases */}
                    {release.status.startsWith('pending') && (
                      <div className="flex gap-2 mb-3">
                        <Button variant="success" size="sm">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button variant="outline" size="sm">
                          Return for Revision
                        </Button>
                        <Button variant="outline" size="sm" className="text-error">
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="mt-4 space-y-4 border-t border-border pt-4">
                        {/* Items Table */}
                        <div>
                          <h4 className="font-medium text-foreground mb-3">Released Items</h4>
                          <div className="border border-border rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-muted/50">
                                  <th className="text-left px-4 py-2 text-sm font-medium text-muted-foreground">
                                    Item
                                  </th>
                                  <th className="text-center px-4 py-2 text-sm font-medium text-muted-foreground">
                                    Qty
                                  </th>
                                  <th className="text-center px-4 py-2 text-sm font-medium text-muted-foreground">
                                    Unit
                                  </th>
                                  <th className="text-right px-4 py-2 text-sm font-medium text-muted-foreground">
                                    Unit Price
                                  </th>
                                  <th className="text-right px-4 py-2 text-sm font-medium text-muted-foreground">
                                    Total
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {release.items.map((item, i) => (
                                  <tr key={i} className="border-t border-border">
                                    <td className="px-4 py-2 text-sm text-foreground">
                                      {item.name}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-foreground text-center">
                                      {item.qty}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-muted-foreground text-center">
                                      {item.unit}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-foreground text-right">
                                      {formatBDT(item.unitPrice)}
                                    </td>
                                    <td className="px-4 py-2 text-sm font-medium text-foreground text-right">
                                      {formatBDT(item.qty * item.unitPrice)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="border-t-2 border-border bg-muted/30">
                                  <td
                                    colSpan={4}
                                    className="px-4 py-2 text-sm font-semibold text-foreground text-right"
                                  >
                                    Total
                                  </td>
                                  <td className="px-4 py-2 text-sm font-semibold text-primary text-right">
                                    {formatBDT(release.totalValue)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>

                        {/* Personnel */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Released By</p>
                            <p className="text-sm font-medium text-foreground">
                              {release.releasedBy || '—'}
                            </p>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Received By</p>
                            <p className="text-sm font-medium text-foreground">
                              {release.receivedBy || '—'}
                            </p>
                          </div>
                        </div>

                        {/* Waybill / Transport Info */}
                        {release.waybill && (
                          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                            <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                              <Truck className="w-4 h-4" />
                              Transport & Waybill Details
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Waybill No.</p>
                                <p className="text-sm font-semibold text-primary">
                                  {release.waybill.id}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Vehicle No.</p>
                                <p className="text-sm font-medium text-foreground">
                                  {release.waybill.vehicleNo}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Driver</p>
                                <p className="text-sm font-medium text-foreground">
                                  {release.waybill.driverName}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Driver Phone</p>
                                <p className="text-sm font-medium text-foreground">
                                  {release.waybill.driverPhone}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Document Actions */}
                        <div className="flex flex-wrap gap-2">
                          {release.status === 'released' || release.status === 'in-transit' ? (
                            <>
                              <Button variant="outline" size="sm">
                                <FileText className="w-3.5 h-3.5 mr-1" />
                                Print Material Release Note
                              </Button>
                              <Button variant="outline" size="sm">
                                <ClipboardList className="w-3.5 h-3.5 mr-1" />
                                Print Goods Release Note
                              </Button>
                              {release.challan && (
                                <Button variant="outline" size="sm">
                                  <Printer className="w-3.5 h-3.5 mr-1" />
                                  Print Challan ({release.challan.id})
                                </Button>
                              )}
                              {release.waybill && (
                                <Button variant="outline" size="sm">
                                  <Truck className="w-3.5 h-3.5 mr-1" />
                                  Print Waybill ({release.waybill.id})
                                </Button>
                              )}
                              {release.grnRef && (
                                <Link href={paths.dashboard.procurement.grn.list}>
                                  <Button variant="outline" size="sm">
                                    <Package className="w-3.5 h-3.5 mr-1" />
                                    View GRN ({release.grnRef})
                                  </Button>
                                </Link>
                              )}
                              <Link href={paths.dashboard.procurement.grn.create}>
                                <Button variant="outline" size="sm">
                                  <Package className="w-3.5 h-3.5 mr-1" />
                                  Generate GRN
                                </Button>
                              </Link>
                              <Button variant="outline" size="sm">
                                <Download className="w-3.5 h-3.5 mr-1" />
                                Download All
                              </Button>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">
                              Documents will be generated after full approval
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
function CreateReleaseForm({ onCancel }) {
  const [warehouse, setWarehouse] = useState('');
  const [destination, setDestination] = useState('');
  const [facility, setFacility] = useState('');
  const [releaseType, setReleaseType] = useState('goods-release');
  const [mReqRef, setMReqRef] = useState('');
  const [generateChallan, setGenerateChallan] = useState(true);
  const [generateWaybill, setGenerateWaybill] = useState(false);
  const [generateGRN, setGenerateGRN] = useState(false);
  const [items, setItems] = useState([{ id: '1', name: '', qty: 1, unit: 'pcs', unitPrice: 0 }]);
  const addItem = () =>
    setItems([
      ...items,
      { id: String(items.length + 1), name: '', qty: 1, unit: 'pcs', unitPrice: 0 },
    ]);
  const removeItem = (id) => {
    if (items.length > 1) setItems(items.filter((i) => i.id !== id));
  };
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="New Material Release Request"
          description="Approval: Requester → Requester Supervisor → Project Manager. Documents generated upon approval."
        />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                From Warehouse/Store *
              </label>
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select source warehouse</option>
                {warehouseLocations.map((w) => (
                  <option key={w.id} value={w.name}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Release Type *
              </label>
              <select
                value={releaseType}
                onChange={(e) => setReleaseType(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="goods-release">Goods Release (to requester / programme)</option>
                <option value="inter-warehouse">Inter-Warehouse Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                To Destination *
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Camp 4 (Kutupalong), Admin Dept, Teknaf W-1"
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Facility / Location
              </label>
              <input
                type="text"
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                placeholder="e.g. Camp 4 Health Centre, Dhaka HQ 3rd Floor"
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-foreground mb-2">
                Material Requisition Reference (if linked)
              </label>
              <input
                type="text"
                value={mReqRef}
                onChange={(e) => setMReqRef(e.target.value)}
                placeholder="e.g. MR-AAB-2026-018"
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Release Items"
          action={
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Item
            </Button>
          }
        />
        <CardBody>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 border border-border rounded-lg"
              >
                <span className="text-sm font-medium text-muted-foreground w-8">{index + 1}.</span>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((i) => (i.id === item.id ? { ...i, name: e.target.value } : i))
                    )
                  }
                  placeholder="Item name"
                  className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="number"
                  value={item.qty}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((i) =>
                        i.id === item.id ? { ...i, qty: parseInt(e.target.value) || 1 } : i
                      )
                    )
                  }
                  min={1}
                  className="w-20 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={item.unit}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((i) => (i.id === item.id ? { ...i, unit: e.target.value } : i))
                    )
                  }
                  className="w-24 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="pcs">pcs</option>
                  <option value="reams">reams</option>
                  <option value="boxes">boxes</option>
                  <option value="kits">kits</option>
                  <option value="sets">sets</option>
                  <option value="bottles">bottles</option>
                </select>
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((i) =>
                        i.id === item.id ? { ...i, unitPrice: parseInt(e.target.value) || 0 } : i
                      )
                    )
                  }
                  min={0}
                  placeholder="Unit Price"
                  className="w-28 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-error hover:bg-error/10 p-1 rounded"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Document Generation Options */}
      <Card>
        <CardHeader
          title="Document Generation"
          description="Select which documents to auto-generate upon approval"
        />
        <CardBody>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked disabled className="w-4 h-4 accent-primary" />
              <span className="text-sm font-medium text-foreground">Material Release Note</span>
              <Badge variant="default" size="sm">
                Always
              </Badge>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked disabled className="w-4 h-4 accent-primary" />
              <span className="text-sm font-medium text-foreground">Goods Release Note</span>
              <Badge variant="default" size="sm">
                Always
              </Badge>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={generateChallan}
                onChange={(e) => setGenerateChallan(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm font-medium text-foreground">Challan</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={generateWaybill}
                onChange={(e) => setGenerateWaybill(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm font-medium text-foreground">Waybill</span>
              <span className="text-xs text-muted-foreground">(requires transport details)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={generateGRN}
                onChange={(e) => setGenerateGRN(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm font-medium text-foreground">GRN (at receiving end)</span>
            </label>
          </div>
        </CardBody>
      </Card>

      {/* 3-Level Approval Preview */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader
          title="Approval Workflow (3-Level)"
          description="This release will follow the standard 3-level approval chain"
        />
        <CardBody>
          <div className="flex items-center gap-3">
            {[
              { step: 'Requester (You)', desc: 'Raise release request' },
              { step: 'Requester Supervisor', desc: 'Endorse / verify' },
              { step: 'Project Manager', desc: 'Approve & authorize release' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {s.step}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</span>
                </div>
                {i < 2 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="flex gap-4">
        <Button size="sm" variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant="primary"
          className="flex-1"
          onClick={() => {
            alert('Material Release MRL-AAB-2026-013 submitted for Project Manager approval!');
            onCancel();
          }}
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          Submit for Supervisor Approval
        </Button>
      </div>
    </div>
  );
}
