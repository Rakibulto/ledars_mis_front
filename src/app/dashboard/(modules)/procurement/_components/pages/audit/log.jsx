'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Eye,
  User,
  Edit,
  Plus,
  Clock,
  LogIn,
  Search,
  Shield,
  Trash2,
  LogOut,
  Download,
  Activity,
  FileText,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
// Mock audit log data
const mockAuditLogs = [
  {
    id: 'AUD-2026-0001',
    timestamp: '2026-04-04 09:15:23',
    user: 'Md. Rafiqul Islam',
    userId: 'USR-001',
    role: 'Procurement Admin',
    module: 'Material Requisitions',
    action: 'create',
    description: 'Created Material Requisition MR-2026-0142 for Dhaka Office',
    ipAddress: '103.15.245.12',
    status: 'success',
    office: 'Dhaka Head Office',
    details: { requisitionId: 'MR-2026-0142', amount: 125000, items: 5 },
  },
  {
    id: 'AUD-2026-0002',
    timestamp: '2026-04-04 09:22:10',
    user: 'Fatema Begum',
    userId: 'USR-003',
    role: 'Finance Checker',
    module: 'Payment Requisitions',
    action: 'approve',
    description: 'Approved Payment Requisition PRF-2026-0089 (BDT 47,175)',
    ipAddress: '103.15.245.15',
    status: 'success',
    office: 'Dhaka Head Office',
    details: { prfId: 'PRF-2026-0089', amount: 47175, vendor: 'Premium Office Solutions Ltd' },
  },
  {
    id: 'AUD-2026-0003',
    timestamp: '2026-04-04 08:55:01',
    user: 'Kamal Hossain',
    userId: 'USR-007',
    role: 'System Admin',
    module: 'Settings',
    action: 'update',
    description: 'Updated approval matrix — added new level for amounts above BDT 500,000',
    ipAddress: '103.15.245.10',
    status: 'success',
    office: 'Dhaka Head Office',
    details: { setting: 'Approval Matrix', changeType: 'Added approval level' },
  },
  {
    id: 'AUD-2026-0004',
    timestamp: '2026-04-04 08:30:45',
    user: 'Shahidul Alam',
    userId: 'USR-012',
    role: 'Inventory Officer',
    module: 'GRN',
    action: 'create',
    description: 'Created GRN-2026-0067 — received 150 items from BuildPro Construction',
    ipAddress: '103.22.180.5',
    status: 'success',
    office: 'Ukhiya Warehouse',
    details: { grnId: 'GRN-2026-0067', items: 150, vendor: 'BuildPro Construction' },
  },
  {
    id: 'AUD-2026-0005',
    timestamp: '2026-04-04 08:15:12',
    user: 'Vendor: TechSupply Global',
    userId: 'VEN-002',
    role: 'Vendor',
    module: 'Vendor Portal',
    action: 'login',
    description: 'Vendor login from new IP address — flagged for review',
    ipAddress: '202.134.12.88',
    status: 'warning',
    office: 'External',
    details: { previousIp: '103.45.67.89', newIp: '202.134.12.88', browser: 'Chrome 124' },
  },
  {
    id: 'AUD-2026-0006',
    timestamp: '2026-04-03 17:45:30',
    user: 'Aminul Haque',
    userId: 'USR-005',
    role: 'Procurement Admin',
    module: 'Vendors',
    action: 'update',
    description: 'Updated vendor status: ProClean Services changed from Active to Blacklisted',
    ipAddress: '103.15.245.18',
    status: 'critical',
    office: 'Dhaka Head Office',
    details: {
      vendorId: 'VEN-006',
      previousStatus: 'Active',
      newStatus: 'Blacklisted',
      reason: 'Non-compliance with delivery terms',
    },
  },
  {
    id: 'AUD-2026-0007',
    timestamp: '2026-04-03 16:30:00',
    user: 'Nasreen Akter',
    userId: 'USR-009',
    role: 'Treasury Officer',
    module: 'Treasury',
    action: 'process',
    description: 'Processed payment of BDT 138,750 to BuildPro Construction — Cheque #78542',
    ipAddress: '103.15.245.20',
    status: 'success',
    office: 'Dhaka Head Office',
    details: { paymentId: 'PAY-2026-0045', amount: 138750, method: 'Cheque', chequeNo: '78542' },
  },
  {
    id: 'AUD-2026-0008',
    timestamp: '2026-04-03 15:20:15',
    user: 'System',
    userId: 'SYSTEM',
    role: 'System',
    module: 'Authentication',
    action: 'security',
    description: 'Failed login attempt (3rd) for user david.l@aab.org — account temporarily locked',
    ipAddress: '45.33.12.100',
    status: 'critical',
    office: 'External',
    details: { email: 'david.l@aab.org', attempts: 3, lockDuration: '30 minutes' },
  },
  {
    id: 'AUD-2026-0009',
    timestamp: '2026-04-03 14:10:08',
    user: 'Md. Rafiqul Islam',
    userId: 'USR-001',
    role: 'Procurement Admin',
    module: 'RFQ',
    action: 'create',
    description: 'Created RFQ-2026-0034 and distributed to 5 vendors',
    ipAddress: '103.15.245.12',
    status: 'success',
    office: 'Dhaka Head Office',
    details: { rfqId: 'RFQ-2026-0034', vendorsInvited: 5, deadline: '2026-04-15' },
  },
  {
    id: 'AUD-2026-0010',
    timestamp: '2026-04-03 11:50:22',
    user: 'Taslima Rahman',
    userId: 'USR-011',
    role: 'Budget Holder',
    module: 'Budget',
    action: 'approve',
    description: 'Approved budget reallocation of BDT 200,000 from BDG-ADMIN to BDG-PROG',
    ipAddress: '103.15.245.25',
    status: 'success',
    office: "Cox's Bazar Office",
    details: { fromCode: 'BDG-ADMIN-2026', toCode: 'BDG-PROG-2026', amount: 200000 },
  },
  {
    id: 'AUD-2026-0011',
    timestamp: '2026-04-03 10:05:33',
    user: 'Kamal Hossain',
    userId: 'USR-007',
    role: 'System Admin',
    module: 'Settings',
    action: 'delete',
    description: 'Deleted inactive user account: david.l@aab.org (David Lee)',
    ipAddress: '103.15.245.10',
    status: 'warning',
    office: 'Dhaka Head Office',
    details: { deletedUser: 'David Lee', email: 'david.l@aab.org', reason: 'Staff separated' },
  },
  {
    id: 'AUD-2026-0012',
    timestamp: '2026-04-02 16:40:18',
    user: 'Inventory System',
    userId: 'SYSTEM',
    role: 'System',
    module: 'Inventory',
    action: 'alert',
    description:
      'Low stock alert: Printer Paper A4 (SKU-1001) below minimum threshold at Teknaf Warehouse-1',
    ipAddress: 'system',
    status: 'warning',
    office: 'Teknaf Warehouse-1',
    details: {
      sku: 'SKU-1001',
      currentStock: 12,
      minThreshold: 50,
      warehouse: 'Teknaf Warehouse-1',
    },
  },
];
const getActionIcon = (action) => {
  switch (action) {
    case 'create':
      return <Plus className="w-3.5 h-3.5" />;
    case 'update':
      return <Edit className="w-3.5 h-3.5" />;
    case 'delete':
      return <Trash2 className="w-3.5 h-3.5" />;
    case 'approve':
      return <CheckCircle className="w-3.5 h-3.5" />;
    case 'login':
      return <LogIn className="w-3.5 h-3.5" />;
    case 'logout':
      return <LogOut className="w-3.5 h-3.5" />;
    case 'process':
      return <Activity className="w-3.5 h-3.5" />;
    case 'security':
      return <Shield className="w-3.5 h-3.5" />;
    case 'alert':
      return <AlertTriangle className="w-3.5 h-3.5" />;
    default:
      return <FileText className="w-3.5 h-3.5" />;
  }
};
const getActionBadge = (action) => {
  switch (action) {
    case 'create':
      return (
        <Badge variant="success">
          <Plus className="w-3 h-3 mr-1" />
          Create
        </Badge>
      );
    case 'update':
      return (
        <Badge variant="info">
          <Edit className="w-3 h-3 mr-1" />
          Update
        </Badge>
      );
    case 'delete':
      return (
        <Badge variant="danger">
          <Trash2 className="w-3 h-3 mr-1" />
          Delete
        </Badge>
      );
    case 'approve':
      return (
        <Badge variant="success">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approve
        </Badge>
      );
    case 'login':
      return (
        <Badge variant="primary">
          <LogIn className="w-3 h-3 mr-1" />
          Login
        </Badge>
      );
    case 'process':
      return (
        <Badge variant="info">
          <Activity className="w-3 h-3 mr-1" />
          Process
        </Badge>
      );
    case 'security':
      return (
        <Badge variant="danger">
          <Shield className="w-3 h-3 mr-1" />
          Security
        </Badge>
      );
    case 'alert':
      return (
        <Badge variant="warning">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Alert
        </Badge>
      );
    default:
      return <Badge variant="default">{action}</Badge>;
  }
};
const getStatusBadge = (status) => {
  switch (status) {
    case 'success':
      return (
        <Badge variant="success" size="sm">
          Success
        </Badge>
      );
    case 'warning':
      return (
        <Badge variant="warning" size="sm">
          Warning
        </Badge>
      );
    case 'critical':
      return (
        <Badge variant="danger" size="sm">
          Critical
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
export function AuditLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const modules = [...new Set(mockAuditLogs.map((l) => l.module))];
  const actions = [...new Set(mockAuditLogs.map((l) => l.action))];
  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchesSearch =
      log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesModule && matchesAction && matchesStatus;
  });
  const totalEvents = mockAuditLogs.length;
  const criticalEvents = mockAuditLogs.filter((l) => l.status === 'critical').length;
  const warningEvents = mockAuditLogs.filter((l) => l.status === 'warning').length;
  const uniqueUsers = new Set(mockAuditLogs.map((l) => l.userId)).size;
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
            Audit Trail Log
          </h1>
          <p className="text-muted-foreground">
            Complete record of all system activities and user actions
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={paths.dashboard.procurement.audit.compliance}>
            <Button variant="outline">
              <Shield className="w-4 h-4 mr-2" />
              Compliance Dashboard
            </Button>
          </Link>
          <Link href={paths.dashboard.procurement.audit.export}>
            <Button variant="primary">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Events (Today)"
          value={totalEvents}
          icon={Activity}
          color="blue"
          trend={{ value: '+18 from yesterday', isPositive: true }}
        />
        <StatCard
          title="Critical Events"
          value={criticalEvents}
          icon={AlertTriangle}
          color="red"
          trend={{ value: '2 need attention', isPositive: false }}
        />
        <StatCard
          title="Warnings"
          value={warningEvents}
          icon={Shield}
          color="orange"
          trend={{ value: '3 flagged', isPositive: false }}
        />
        <StatCard
          title="Active Users"
          value={uniqueUsers}
          icon={User}
          color="green"
          trend={{ value: '12 online now', isPositive: true }}
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by user, description, module, event ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Actions</option>
              {actions.map((a) => (
                <option key={a} value={a} className="capitalize">
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Severity</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="To"
            />
          </div>
        </CardBody>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader
          title={`Audit Events (${filteredLogs.length})`}
          description="All system activities with full traceability"
        />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                    Timestamp
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">User</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Module</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Action</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                    Description
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Office</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Severity</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                    IP Address
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`border-b border-border hover:bg-secondary/30 transition-colors ${log.status === 'critical' ? 'bg-destructive/5' : ''}`}
                  >
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {log.timestamp}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {log.user
                            .split(' ')
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground whitespace-nowrap">
                            {log.user}
                          </p>
                          <p className="text-xs text-muted-foreground">{log.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <Badge variant="outline" size="sm">
                        {log.module}
                      </Badge>
                    </td>
                    <td className="py-3 pr-3">{getActionBadge(log.action)}</td>
                    <td className="py-3 pr-3">
                      <p className="text-sm text-foreground max-w-[300px] truncate">
                        {log.description}
                      </p>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {log.office}
                      </span>
                    </td>
                    <td className="py-3 pr-3">{getStatusBadge(log.status)}</td>
                    <td className="py-3 pr-3">
                      <code className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                        {log.ipAddress}
                      </code>
                    </td>
                    <td className="py-3 text-center">
                      <Link href={paths.dashboard.procurement.audit.detail(log.id)}>
                        <button className="p-1.5 hover:bg-muted rounded transition-colors">
                          <Eye className="w-4 h-4 text-primary" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {filteredLogs.length} of {mockAuditLogs.length} events
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="primary" size="sm">
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                3
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
