'use client';

import { useState } from 'react';
import { Eye, User, Shield, AlertTriangle } from 'lucide-react';
import {
  Bar,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

import { Badge } from '../../components/ui/badge';
import { ReportLayout } from '../../components/report-layout';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function AuditLogsReport() {
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-04-04');
  const [module, setModule] = useState('all');
  const [severity, setSeverity] = useState('all');
  const stats = { totalActions: 2456, flagged: 18, users: 42, modules: 12 };
  const moduleData = [
    { module: 'Requisitions', actions: 485, flagged: 3 },
    { module: 'RFQ', actions: 392, flagged: 2 },
    { module: 'CS/Award', actions: 318, flagged: 5 },
    { module: 'Work Orders', actions: 285, flagged: 1 },
    { module: 'GRN', actions: 248, flagged: 2 },
    { module: 'Payments', actions: 312, flagged: 4 },
    { module: 'Vendors', actions: 198, flagged: 1 },
    { module: 'Treasury', actions: 218, flagged: 0 },
  ];
  const auditLogs = [
    {
      id: 'LOG-2026-04-04-001',
      timestamp: '2026-04-04 09:15:22',
      user: 'Md. Rafiqul Islam',
      role: 'Procurement Officer',
      module: 'Requisitions',
      action: 'Created REQ-AAB-2026-048',
      ip: '192.168.1.45',
      severity: 'info',
    },
    {
      id: 'LOG-2026-04-04-002',
      timestamp: '2026-04-04 09:42:18',
      user: 'Tahmina Khatun',
      role: 'Programme Head',
      module: 'Requisitions',
      action: 'Approved REQ-AAB-2026-047',
      ip: '192.168.1.52',
      severity: 'info',
    },
    {
      id: 'LOG-2026-04-04-003',
      timestamp: '2026-04-04 10:05:33',
      user: 'Kamrul Hasan',
      role: 'Procurement Officer',
      module: 'CS/Award',
      action: 'Modified CS-AAB-2026-025 after approval',
      ip: '192.168.1.45',
      severity: 'warning',
    },
    {
      id: 'LOG-2026-04-03-004',
      timestamp: '2026-04-03 14:22:45',
      user: 'System',
      role: 'Automated',
      module: 'Vendors',
      action: 'Vendor V009 license expiry alert (30 days)',
      ip: 'system',
      severity: 'warning',
    },
    {
      id: 'LOG-2026-04-03-005',
      timestamp: '2026-04-03 16:48:12',
      user: 'Nasreen Akter',
      role: 'Treasury Officer',
      module: 'Payments',
      action: 'Processed RTGS ৳1.25 Cr for PRF-AAB-2026-020',
      ip: '192.168.1.60',
      severity: 'info',
    },
    {
      id: 'LOG-2026-04-02-006',
      timestamp: '2026-04-02 11:30:55',
      user: 'Unknown',
      role: 'N/A',
      module: 'Auth',
      action: 'Failed login attempt (3 consecutive)',
      ip: '103.45.67.89',
      severity: 'critical',
    },
    {
      id: 'LOG-2026-04-02-007',
      timestamp: '2026-04-02 13:15:08',
      user: 'Md. Ashraful Hoque',
      role: 'Country Director',
      module: 'CS/Award',
      action: 'Returned CS-AAB-2026-027 (insufficient quotations)',
      ip: '192.168.1.10',
      severity: 'info',
    },
    {
      id: 'LOG-2026-04-01-008',
      timestamp: '2026-04-01 08:00:00',
      user: 'System',
      role: 'Automated',
      module: 'GRN',
      action: 'Low stock alert: 42 items below reorder level',
      ip: 'system',
      severity: 'warning',
    },
  ];
  const filters = (
    <div className="grid grid-cols-4 gap-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Date From</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Date To</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Module</label>
        <select
          value={module}
          onChange={(e) => setModule(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Modules</option>
          <option value="requisitions">Requisitions</option>
          <option value="rfq">RFQ</option>
          <option value="cs">CS/Award</option>
          <option value="wo">Work Orders</option>
          <option value="grn">GRN</option>
          <option value="payments">Payments</option>
          <option value="vendors">Vendors</option>
          <option value="treasury">Treasury</option>
          <option value="auth">Authentication</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Severity</label>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Levels</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
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
              <p className="text-sm text-muted-foreground mb-1">Total Actions</p>
              <p className="text-3xl font-bold text-foreground">
                {stats.totalActions.toLocaleString()}
              </p>
            </div>
            <Eye className="w-8 h-8 text-primary" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-error">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Flagged Events</p>
              <p className="text-3xl font-bold text-error">{stats.flagged}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-error" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-success">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Users</p>
              <p className="text-3xl font-bold text-success">{stats.users}</p>
            </div>
            <User className="w-8 h-8 text-success" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-warning">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Modules Tracked</p>
              <p className="text-3xl font-bold text-warning">{stats.modules}</p>
            </div>
            <Shield className="w-8 h-8 text-warning" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
  const charts = (
    <Card>
      <CardHeader
        title="Actions by Module"
        description="System activity and flagged events per module — FY 2025-26"
      />
      <CardBody>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={moduleData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="module" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="actions" fill="#1e40af" name="Total Actions" />
            <Bar dataKey="flagged" fill="#ef4444" name="Flagged" />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
  const table = (
    <Card>
      <CardHeader title="Audit Log Details" description="System audit trail — Ledars NGO" />
      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b-2 border-border">
              <tr className="text-left">
                <th className="pb-3 text-sm font-semibold text-foreground">Timestamp</th>
                <th className="pb-3 text-sm font-semibold text-foreground">User</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Role</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Module</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Action</th>
                <th className="pb-3 text-sm font-semibold text-foreground">IP Address</th>
                <th className="pb-3 text-sm font-semibold text-foreground">Severity</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className="border-b border-border">
                  <td className="py-3 text-sm font-mono text-muted-foreground">{log.timestamp}</td>
                  <td className="py-3 text-sm text-foreground">{log.user}</td>
                  <td className="py-3 text-sm text-muted-foreground">{log.role}</td>
                  <td className="py-3 text-sm text-foreground">{log.module}</td>
                  <td className="py-3 text-sm text-foreground max-w-[250px] truncate">
                    {log.action}
                  </td>
                  <td className="py-3 text-sm font-mono text-muted-foreground">{log.ip}</td>
                  <td className="py-3">
                    <Badge
                      variant={
                        log.severity === 'critical'
                          ? 'error'
                          : log.severity === 'warning'
                            ? 'warning'
                            : 'default'
                      }
                    >
                      {log.severity}
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
      title="Audit Logs"
      description="System audit trail, user activity tracking, and compliance monitoring — Ledars NGO"
      filters={filters}
      kpiCards={kpiCards}
      charts={charts}
      table={table}
    />
  );
}
