'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Plus,
  Save,
  Clock,
  Search,
  Trash2,
  Shield,
  XCircle,
  FileText,
  Warehouse,
  ArrowRight,
  CheckCircle,
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
    permissions: ['Create', 'Approve', 'Reject', 'View All', 'Release'],
  },
  {
    role: 'Store Staff',
    color: 'bg-primary/10 text-primary',
    permissions: ['Create', 'View Own', 'Issue Stock', 'Track'],
  },
  {
    role: 'Programme Colleague',
    color: 'bg-success/10 text-success',
    permissions: ['Create', 'View Own', 'Request'],
  },
];
// Warehouse/Store locations
const warehouseLocations = [
  { id: 'dhaka-hq', name: 'Dhaka HQ Store', code: 'DHK-HQ', type: 'Head Office' },
  {
    id: 'ukhiya-central',
    name: 'Ukhiya Central Warehouse',
    code: 'UKH-CW',
    type: 'Field Warehouse',
  },
  { id: 'teknaf-1', name: 'Teknaf Warehouse-1', code: 'TEK-W1', type: 'Field Warehouse' },
  { id: 'teknaf-2', name: 'Teknaf Warehouse-2', code: 'TEK-W2', type: 'Field Warehouse' },
];
// Mock material requisitions with 3-level approval chain: Requester -> Requester Supervisor -> Project Manager
const mockRequisitions = [
  {
    id: 'MR-AAB-2026-018',
    date: '2026-03-30',
    requester: 'Tasneem Jahan',
    designation: 'Communications Officer',
    department: 'Communications',
    requesterRole: 'Programme Colleague',
    warehouse: 'Dhaka HQ Store',
    facility: 'Dhaka Head Office — 3rd Floor',
    items: [
      { name: 'A4 Paper (80gsm)', qty: 50, unit: 'reams' },
      { name: 'Toner Cartridge HP 26A', qty: 5, unit: 'pcs' },
      { name: 'Notebook (200 pages)', qty: 20, unit: 'pcs' },
      { name: 'Whiteboard Marker Set', qty: 10, unit: 'sets' },
      { name: 'Folder (Lever Arch)', qty: 15, unit: 'pcs' },
    ],
    estimatedValue: 42500,
    purpose: 'Monthly office supplies for Communications unit',
    priority: 'normal',
    status: 'pending-supervisor',
    approvalChain: [
      {
        role: 'Requester',
        name: 'Tasneem Jahan',
        status: 'completed',
        date: '2026-03-30',
        designation: 'Communications Officer',
      },
      {
        role: 'Requester Supervisor',
        name: 'Shahana Begum',
        status: 'pending',
        date: null,
        designation: 'Supervisor — Communications',
      },
      {
        role: 'Project Manager',
        name: 'Md. Kamal Hossain',
        status: 'waiting',
        date: null,
        designation: 'Project Manager — HCMP',
      },
    ],
  },
  {
    id: 'MR-AAB-2026-017',
    date: '2026-03-29',
    requester: 'Md. Ashraful Hoque',
    designation: 'Admin Officer',
    department: 'Administration',
    requesterRole: 'Admin',
    warehouse: 'Dhaka HQ Store',
    facility: 'Dhaka Head Office — HR Unit, 3rd Floor',
    items: [
      { name: 'Steel Office Desk', qty: 3, unit: 'pcs' },
      { name: 'Office Chair (Executive)', qty: 3, unit: 'pcs' },
      { name: 'File Cabinet (4-drawer)', qty: 2, unit: 'pcs' },
      { name: 'Desk Lamp (LED)', qty: 5, unit: 'pcs' },
      { name: 'Extension Board (5-port)', qty: 5, unit: 'pcs' },
      { name: 'Wall Clock (12")', qty: 3, unit: 'pcs' },
      { name: 'Waste Bin (Steel)', qty: 5, unit: 'pcs' },
      { name: 'Visitor Chair (Cushioned)', qty: 8, unit: 'pcs' },
    ],
    estimatedValue: 285000,
    purpose: 'New office setup for expanded HR unit — 3rd floor, Dhaka HQ',
    priority: 'high',
    status: 'pending-pm',
    approvalChain: [
      {
        role: 'Requester',
        name: 'Md. Ashraful Hoque',
        status: 'completed',
        date: '2026-03-29',
        designation: 'Admin Officer',
      },
      {
        role: 'Requester Supervisor',
        name: 'Farah Kabir',
        status: 'completed',
        date: '2026-03-30',
        designation: 'Supervisor — Administration',
      },
      {
        role: 'Project Manager',
        name: 'Shahana Begum',
        status: 'pending',
        date: null,
        designation: 'Project Manager — HCMP',
      },
    ],
  },
  {
    id: 'MR-AAB-2026-016',
    date: '2026-03-28',
    requester: 'Dr. Nafisa Akter',
    designation: 'Health Programme Manager',
    department: 'Health Programme',
    requesterRole: 'Programme Colleague',
    warehouse: 'Ukhiya Central Warehouse',
    facility: 'Camp 4 Kutupalong Health Centre',
    items: [
      { name: 'First Aid Kit (Standard)', qty: 25, unit: 'kits' },
      { name: 'Disposable Gloves (Box of 100)', qty: 50, unit: 'boxes' },
      { name: 'Face Mask (3-ply, Box of 50)', qty: 30, unit: 'boxes' },
      { name: 'Hand Sanitizer (500ml)', qty: 100, unit: 'bottles' },
      { name: 'Oral Rehydration Salt (ORS)', qty: 500, unit: 'sachets' },
      { name: 'Paracetamol (500mg, Strip)', qty: 200, unit: 'strips' },
      { name: 'Medical Examination Gloves', qty: 20, unit: 'boxes' },
      { name: 'Thermometer (Digital)', qty: 10, unit: 'pcs' },
      { name: 'Blood Pressure Monitor', qty: 5, unit: 'pcs' },
      { name: 'Stretcher (Foldable)', qty: 3, unit: 'pcs' },
      { name: 'Medical Waste Bag (Yellow)', qty: 100, unit: 'pcs' },
      { name: 'Surgical Tape Roll', qty: 50, unit: 'rolls' },
    ],
    estimatedValue: 425000,
    purpose:
      'Emergency medical supplies for Camp 4 & Camp 18 health centres — monsoon preparedness',
    priority: 'urgent',
    status: 'pending-pm',
    approvalChain: [
      {
        role: 'Requester',
        name: 'Dr. Nafisa Akter',
        status: 'completed',
        date: '2026-03-28',
        designation: 'Health Programme Manager',
      },
      {
        role: 'Requester Supervisor',
        name: 'Selim Hossain',
        status: 'completed',
        date: '2026-03-29',
        designation: 'Supervisor — Health Programme',
      },
      {
        role: 'Project Manager',
        name: 'Md. Kamal Hossain',
        status: 'pending',
        date: null,
        designation: 'Project Manager — HCMP',
      },
    ],
  },
  {
    id: 'MR-AAB-2026-015',
    date: '2026-03-25',
    requester: 'Rahima Begum',
    designation: 'Warehouse Manager',
    department: 'Logistics',
    requesterRole: 'Store Staff',
    warehouse: 'Ukhiya Central Warehouse',
    facility: 'Ukhiya Central Warehouse — Emergency Store',
    items: [
      { name: 'Emergency Tarpaulin (12ft x 18ft)', qty: 500, unit: 'pcs' },
      { name: 'Hygiene Kit (Family Pack)', qty: 200, unit: 'kits' },
      { name: 'Blanket (Thermal)', qty: 300, unit: 'pcs' },
      { name: 'Solar Lantern (Rechargeable)', qty: 150, unit: 'pcs' },
    ],
    estimatedValue: 1250000,
    purpose: 'Pre-monsoon emergency stock replenishment — all camps',
    priority: 'urgent',
    status: 'approved',
    approvalChain: [
      {
        role: 'Requester',
        name: 'Rahima Begum',
        status: 'completed',
        date: '2026-03-25',
        designation: 'Warehouse Manager',
      },
      {
        role: 'Requester Supervisor',
        name: 'Karim Uddin',
        status: 'completed',
        date: '2026-03-26',
        designation: 'Supervisor — Logistics',
      },
      {
        role: 'Project Manager',
        name: 'Md. Kamal Hossain',
        status: 'completed',
        date: '2026-03-27',
        designation: 'Project Manager — HCMP',
      },
    ],
  },
  {
    id: 'MR-AAB-2026-014',
    date: '2026-03-22',
    requester: 'Md. Rafiqul Islam',
    designation: 'IT Manager',
    department: 'IT',
    requesterRole: 'Programme Colleague',
    warehouse: 'Dhaka HQ Store',
    facility: 'Dhaka Head Office — Conference Room (2nd Floor)',
    items: [
      { name: 'USB Flash Drive (64GB)', qty: 20, unit: 'pcs' },
      { name: 'HDMI Cable (2m)', qty: 10, unit: 'pcs' },
      { name: 'Ethernet Cable (Cat6, 3m)', qty: 15, unit: 'pcs' },
    ],
    estimatedValue: 28500,
    purpose: 'IT accessories for network setup in new conference room',
    priority: 'normal',
    status: 'released',
    approvalChain: [
      {
        role: 'Requester',
        name: 'Md. Rafiqul Islam',
        status: 'completed',
        date: '2026-03-22',
        designation: 'IT Manager',
      },
      {
        role: 'Requester Supervisor',
        name: 'Md. Ashraful Hoque',
        status: 'completed',
        date: '2026-03-22',
        designation: 'Supervisor — IT',
      },
      {
        role: 'Project Manager',
        name: 'Shahana Begum',
        status: 'completed',
        date: '2026-03-23',
        designation: 'Project Manager — HCMP',
      },
    ],
  },
];
const getStatusBadge = (status) => {
  switch (status) {
    case 'pending-supervisor':
      return { variant: 'warning', label: 'Pending Supervisor' };
    case 'pending-pm':
      return { variant: 'warning', label: 'Pending Project Manager' };
    case 'approved':
      return { variant: 'success', label: 'Approved' };
    case 'released':
      return { variant: 'default', label: 'Released' };
    case 'rejected':
      return { variant: 'error', label: 'Rejected' };
    default:
      return { variant: 'default', label: status };
  }
};
const getPriorityBadge = (priority) => {
  switch (priority) {
    case 'urgent':
      return { variant: 'error', label: 'Urgent' };
    case 'high':
      return { variant: 'warning', label: 'High' };
    case 'normal':
      return { variant: 'default', label: 'Normal' };
    default:
      return { variant: 'default', label: priority };
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
export function MaterialRequisition() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const filteredReqs = mockRequisitions.filter((req) => {
    const matchesSearch =
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesWarehouse = warehouseFilter === 'all' || req.warehouse === warehouseFilter;
    return matchesSearch && matchesStatus && matchesWarehouse;
  });
  const pendingCount = mockRequisitions.filter((r) => r.status.startsWith('pending')).length;
  const approvedCount = mockRequisitions.filter(
    (r) => r.status === 'approved' || r.status === 'released'
  ).length;
  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header with Role Access Info */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Material Requisition</h1>
            <p className="text-muted-foreground">
              Workflow: Requester → Requester Supervisor → Project Manager (3-level approval)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {showCreateForm ? 'View List' : 'New Requisition'}
            </Button>
          </div>
        </div>

        {/* Access Role Indicators */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
          <Shield className="w-4 h-4 text-muted-foreground" />
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Requisitions</p>
              <p className="text-xl font-semibold text-foreground">{mockRequisitions.length}</p>
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
              <p className="text-sm text-muted-foreground mb-1">Approved/Released</p>
              <p className="text-xl font-semibold text-success">{approvedCount}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Value</p>
              <p className="text-xl font-semibold text-primary">
                {formatBDT(mockRequisitions.reduce((s, r) => s + r.estimatedValue, 0))}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {!showCreateForm ? (
        <>
          {/* Filters with Warehouse Selector */}
          <Card className="mb-6">
            <CardBody>
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by ID, requester, department, or purpose..."
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
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Status</option>
                  <option value="pending-supervisor">Pending Supervisor</option>
                  <option value="pending-pm">Pending PM</option>
                  <option value="approved">Approved</option>
                  <option value="released">Released</option>
                </select>
              </div>
            </CardBody>
          </Card>

          {/* Requisition List */}
          <div className="space-y-4">
            {filteredReqs.map((req) => {
              const statusBadge = getStatusBadge(req.status);
              const priorityBadge = getPriorityBadge(req.priority);
              return (
                <Card key={req.id} hover>
                  <CardBody>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">{req.id}</h3>
                          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                          <Badge variant={priorityBadge.variant} size="sm">
                            {priorityBadge.label}
                          </Badge>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(req.requesterRole)}`}
                          >
                            {req.requesterRole}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">
                          <span className="font-medium text-foreground">{req.requester}</span> (
                          {req.designation}) &bull; {req.department} &bull; {req.date}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{req.purpose}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Warehouse className="w-3 h-3" />
                          <span className="font-medium">{req.warehouse}</span>
                          <span>&bull;</span>
                          <span>Facility: {req.facility}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-primary">
                          {formatBDT(req.estimatedValue)}
                        </p>
                        <p className="text-xs text-muted-foreground">{req.items.length} items</p>
                      </div>
                    </div>

                    {/* 3-Level Approval Chain Visual */}
                    <div className="flex items-center gap-2 mb-4 p-3 bg-muted/20 rounded-lg">
                      <span className="text-xs font-medium text-muted-foreground mr-2">
                        Approval:
                      </span>
                      {req.approvalChain.map((step, i) => (
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
                          {i < req.approvalChain.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Items Preview */}
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex flex-wrap gap-2">
                        {req.items.slice(0, 4).map((item, i) => (
                          <Badge key={i} variant="outline" size="sm">
                            {item.name} x{item.qty}
                          </Badge>
                        ))}
                        {req.items.length > 4 && (
                          <Badge variant="outline" size="sm">
                            +{req.items.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {req.status.startsWith('pending') && (
                      <div className="mt-4 flex gap-2">
                        <Button variant="success" size="sm" type="button">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button variant="outline" size="sm" type="button">
                          Return for Revision
                        </Button>
                        <Button variant="outline" size="sm" type="button" className="text-error">
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {req.status === 'approved' && (
                      <div className="mt-4 flex gap-2">
                        <Link href={paths.dashboard.procurement.inventory.materialRelease}>
                          <Button variant="primary" size="sm">
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            Generate Release Note
                          </Button>
                        </Link>
                        <Link href={paths.dashboard.procurement.inventory.issue}>
                          <Button variant="outline" size="sm">
                            <ClipboardList className="w-3.5 h-3.5 mr-1" />
                            Issue Stock
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        /* Create New Requisition Form */
        <CreateRequisitionForm onCancel={() => setShowCreateForm(false)} />
      )}
    </div>
  );
}
function CreateRequisitionForm({ onCancel }) {
  const [warehouse, setWarehouse] = useState('');
  const [facility, setFacility] = useState('');
  const [purpose, setPurpose] = useState('');
  const [priority, setPriority] = useState('normal');
  const [reqItems, setReqItems] = useState([{ id: '1', name: '', qty: 1, unit: 'pcs' }]);
  const addItem = () =>
    setReqItems([...reqItems, { id: String(reqItems.length + 1), name: '', qty: 1, unit: 'pcs' }]);
  const removeItem = (id) => {
    if (reqItems.length > 1) setReqItems(reqItems.filter((i) => i.id !== id));
  };
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="New Material Requisition"
          description="Raise a request from store — 3-level approval: Requester → Requester Supervisor → Project Manager"
        />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Requesting From (Warehouse/Store) *
              </label>
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select warehouse / store location</option>
                {warehouseLocations.map((w) => (
                  <option key={w.id} value={w.name}>
                    {w.name} — {w.type} ({w.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Facility / Location *
              </label>
              <input
                type="text"
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                placeholder="e.g. Camp 4 Health Centre, Dhaka HQ 2nd Floor"
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Priority *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Your Role</label>
              <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="programme">Programme Colleague</option>
                <option value="store">Store Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-foreground mb-2">
                Purpose / Justification *
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe why these materials are needed and for which programme/activity..."
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Requested Items"
          action={
            <Button variant="outline" size="sm" type="button" onClick={addItem}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Item
            </Button>
          }
        />
        <CardBody>
          <div className="space-y-3">
            {reqItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 border border-border rounded-lg"
              >
                <span className="text-sm font-medium text-muted-foreground w-8">{index + 1}.</span>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) =>
                    setReqItems((prev) =>
                      prev.map((i) => (i.id === item.id ? { ...i, name: e.target.value } : i))
                    )
                  }
                  placeholder="Item name / description"
                  className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="number"
                  value={item.qty}
                  onChange={(e) =>
                    setReqItems((prev) =>
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
                    setReqItems((prev) =>
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
                  <option value="rolls">rolls</option>
                  <option value="sachets">sachets</option>
                </select>
                {reqItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-error hover:bg-error/10 p-1 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* 3-Level Approval Chain Preview */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader
          title="Approval Workflow (3-Level)"
          description="This requisition will follow the standard 3-level approval chain"
        />
        <CardBody>
          <div className="flex items-center gap-3">
            {[
              { step: 'Requester (You)', desc: 'Raise requisition' },
              { step: 'Requester Supervisor', desc: 'Endorse / verify need' },
              { step: 'Project Manager', desc: 'Final approval & authorize release' },
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
        <Button variant="outline" size="sm" className="flex-1" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          type="button"
          onClick={() => {
            alert('Material Requisition MR-AAB-2026-019 submitted for Project Manager approval!');
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
