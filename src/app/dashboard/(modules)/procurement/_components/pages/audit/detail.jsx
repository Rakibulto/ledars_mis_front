'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Copy, Clock, MapPin, Monitor, FileText, ArrowLeft, ArrowRight } from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
// Mock audit detail data
const mockAuditDetails = {
  'AUD-2026-0001': {
    id: 'AUD-2026-0001',
    timestamp: '2026-04-04 09:15:23',
    user: 'Md. Rafiqul Islam',
    userId: 'USR-001',
    email: 'rafiqul.islam@aab.org',
    role: 'Procurement Admin',
    department: 'Procurement',
    module: 'Material Requisitions',
    action: 'create',
    description: 'Created Material Requisition MR-2026-0142 for Dhaka Office',
    ipAddress: '103.15.245.12',
    browser: 'Chrome 124.0.6367.60',
    os: 'Windows 11',
    device: 'Desktop',
    status: 'success',
    office: 'Dhaka Head Office',
    sessionId: 'SES-2026-04-04-001',
    relatedRecords: [
      { type: 'Material Requisition', id: 'MR-2026-0142', link: '/requisitions/MR-2026-0142' },
    ],
    beforeState: null,
    afterState: {
      requisitionId: 'MR-2026-0142',
      requestedBy: 'Md. Rafiqul Islam',
      office: 'Dhaka Head Office',
      totalAmount: 125000,
      currency: 'BDT',
      items: 5,
      budgetCode: 'BDG-OP-2026',
      priority: 'High',
      status: 'Draft',
      justification: 'Urgent office supplies required for Q2 operations',
    },
  },
  'AUD-2026-0006': {
    id: 'AUD-2026-0006',
    timestamp: '2026-04-03 17:45:30',
    user: 'Aminul Haque',
    userId: 'USR-005',
    email: 'aminul.haque@aab.org',
    role: 'Procurement Admin',
    department: 'Procurement',
    module: 'Vendors',
    action: 'update',
    description: 'Updated vendor status: ProClean Services changed from Active to Blacklisted',
    ipAddress: '103.15.245.18',
    browser: 'Firefox 125.0',
    os: 'macOS Sonoma',
    device: 'Desktop',
    status: 'critical',
    office: 'Dhaka Head Office',
    sessionId: 'SES-2026-04-03-045',
    relatedRecords: [
      { type: 'Vendor', id: 'VEN-2024-006', link: '/vendors/detail/VEN-2024-006' },
      { type: 'Blacklist Request', id: 'BLK-2026-003', link: '/vendors/blacklist' },
    ],
    beforeState: {
      vendorId: 'VEN-2024-006',
      companyName: 'ProClean Services',
      status: 'Active',
      verificationState: 'Verified',
      totalOrders: 5,
      performanceRating: 2.1,
    },
    afterState: {
      vendorId: 'VEN-2024-006',
      companyName: 'ProClean Services',
      status: 'Blacklisted',
      verificationState: 'Verified',
      totalOrders: 5,
      performanceRating: 2.1,
      blacklistReason: 'Non-compliance with delivery terms',
      blacklistDate: '2026-04-03',
      blacklistApprovedBy: 'Country Director',
    },
  },
};
// Default detail for any audit ID
const defaultDetail = {
  id: 'AUD-2026-0002',
  timestamp: '2026-04-04 09:22:10',
  user: 'Fatema Begum',
  userId: 'USR-003',
  email: 'fatema.begum@aab.org',
  role: 'Finance Checker',
  department: 'Finance',
  module: 'Payment Requisitions',
  action: 'approve',
  description: 'Approved Payment Requisition PRF-2026-0089 (BDT 47,175)',
  ipAddress: '103.15.245.15',
  browser: 'Chrome 124.0.6367.60',
  os: 'Windows 10',
  device: 'Desktop',
  status: 'success',
  office: 'Dhaka Head Office',
  sessionId: 'SES-2026-04-04-003',
  relatedRecords: [
    {
      type: 'Payment Requisition',
      id: 'PRF-2026-0089',
      link: '/payment-requisitions/PRF-2026-0089',
    },
    { type: 'Work Order', id: 'WO-2026-0042', link: '/work-orders/WO-2026-0042' },
    { type: 'Vendor', id: 'VEN-2024-001', link: '/vendors/detail/VEN-2024-001' },
  ],
  beforeState: {
    prfId: 'PRF-2026-0089',
    status: 'Pending Finance Review',
    netPayable: 47175,
    budgetAvailable: 350000,
  },
  afterState: {
    prfId: 'PRF-2026-0089',
    status: 'Finance Approved',
    netPayable: 47175,
    budgetAvailable: 302825,
    approvedBy: 'Fatema Begum',
    approvalDate: '2026-04-04',
    remarks: 'Budget verified. Forwarded to Treasury.',
  },
};
const getStatusBadge = (status) => {
  switch (status) {
    case 'success':
      return <Badge variant="success">Success</Badge>;
    case 'warning':
      return <Badge variant="warning">Warning</Badge>;
    case 'critical':
      return <Badge variant="danger">Critical</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};
const getActionBadge = (action) => {
  switch (action) {
    case 'create':
      return <Badge variant="success">Create</Badge>;
    case 'update':
      return <Badge variant="info">Update</Badge>;
    case 'delete':
      return <Badge variant="danger">Delete</Badge>;
    case 'approve':
      return <Badge variant="success">Approve</Badge>;
    case 'login':
      return <Badge variant="primary">Login</Badge>;
    case 'process':
      return <Badge variant="info">Process</Badge>;
    case 'security':
      return <Badge variant="danger">Security</Badge>;
    default:
      return <Badge variant="default">{action}</Badge>;
  }
};
export function AuditDetail() {
  const { id } = useParams();
  const detail = mockAuditDetails[id || ''] || defaultDetail;
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={paths.dashboard.procurement.audit.log}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Audit Log
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">{detail.id}</h1>
              {getStatusBadge(detail.status)}
              {getActionBadge(detail.action)}
            </div>
            <p className="text-muted-foreground">{detail.description}</p>
          </div>
          <Button variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-2" />
            Copy Event ID
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Details */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Event Info */}
          <Card>
            <CardHeader title="Event Information" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Event ID</p>
                    <p className="text-sm font-medium text-foreground">{detail.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Timestamp</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">{detail.timestamp}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Module</p>
                    <Badge variant="outline">{detail.module}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Session ID</p>
                    <code className="text-xs bg-secondary px-2 py-1 rounded">
                      {detail.sessionId}
                    </code>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Office / Location</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">{detail.office}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">IP Address</p>
                    <code className="text-xs bg-secondary px-2 py-1 rounded">
                      {detail.ipAddress}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Browser</p>
                    <p className="text-sm text-foreground">{detail.browser}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">OS / Device</p>
                    <p className="text-sm text-foreground">
                      {detail.os} — {detail.device}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Before / After Diff */}
          {(detail.beforeState || detail.afterState) && (
            <Card>
              <CardHeader
                title="Data Changes (Before / After)"
                description="Detailed comparison of field-level changes"
              />
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Before */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      Before
                    </h4>
                    {detail.beforeState ? (
                      <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-2">
                        {Object.entries(detail.beforeState).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-medium text-foreground">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-secondary/50 border border-border rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          No previous state (new record)
                        </p>
                      </div>
                    )}
                  </div>
                  {/* After */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      After
                    </h4>
                    {detail.afterState && (
                      <div className="bg-success/5 border border-success/20 rounded-lg p-4 space-y-2">
                        {Object.entries(detail.afterState).map(([key, value]) => {
                          const changed = detail.beforeState
                            ? detail.beforeState[key] !== value
                            : true;
                          return (
                            <div
                              key={key}
                              className={`flex justify-between text-sm ${changed ? 'font-semibold' : ''}`}
                            >
                              <span className="text-muted-foreground">{key}:</span>
                              <span
                                className={`font-medium ${changed ? 'text-success' : 'text-foreground'}`}
                              >
                                {String(value)}
                                {changed && !detail.beforeState?.[key] && (
                                  <span className="ml-1 text-xs">(new)</span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Related Records */}
          {detail.relatedRecords && detail.relatedRecords.length > 0 && (
            <Card>
              <CardHeader title="Related Records" description="Associated documents and entities" />
              <CardBody>
                <div className="space-y-3">
                  {detail.relatedRecords.map((record, idx) => (
                    <Link
                      key={idx}
                      href={record.link}
                      className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{record.type}</p>
                          <p className="text-xs text-muted-foreground">{record.id}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right Panel - User Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="User Information" />
            <CardBody>
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary mx-auto mb-3">
                  {detail.user
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')}
                </div>
                <h4 className="text-sm font-semibold text-foreground">{detail.user}</h4>
                <p className="text-xs text-muted-foreground">{detail.email}</p>
              </div>
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">User ID</span>
                  <span className="text-xs font-medium text-foreground">{detail.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Role</span>
                  <Badge variant="primary" size="sm">
                    {detail.role}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Department</span>
                  <span className="text-xs font-medium text-foreground">{detail.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Office</span>
                  <span className="text-xs font-medium text-foreground">{detail.office}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Device & Access" />
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Monitor className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Browser</p>
                    <p className="text-sm font-medium text-foreground">{detail.browser}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Monitor className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Operating System</p>
                    <p className="text-sm font-medium text-foreground">{detail.os}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">IP Address</p>
                    <code className="text-xs bg-secondary px-2 py-1 rounded">
                      {detail.ipAddress}
                    </code>
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
