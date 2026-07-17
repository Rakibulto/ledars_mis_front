'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Eye,
  Send,
  Bell,
  Edit,
  User,
  Clock,
  Shield,
  FileText,
  Download,
  ArrowLeft,
  UserCheck,
  GitBranch,
  RotateCcw,
  ArrowRight,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

export function RequisitionTimeline() {
  const [filterType, setFilterType] = useState('all');
  const [showVersions, setShowVersions] = useState(true);
  const mrfId = 'MRF-2026-002';
  const versions = [
    {
      version: 'v1.0',
      date: '2026-03-20',
      author: 'Fatema Begum',
      status: 'current',
      changes: 'Initial submission – 6 BOQ items, ৳12,50,000',
      boqCount: 6,
      amount: 1250000,
    },
  ];
  const timeline = [
    {
      id: 1,
      type: 'create',
      title: 'MRF Created',
      description: 'Draft MRF created with 6 BOQ items for construction materials',
      user: 'Fatema Begum',
      role: 'Area Coordinator',
      timestamp: '2026-03-20 09:10 AM',
      detail: 'Category: Construction | Budget Code: BDG-DRR-2026-001 | Donor: EU-BD-2026',
    },
    {
      id: 2,
      type: 'submit',
      title: 'MRF Submitted for Approval',
      description:
        'Submitted to 3-level approval workflow: Budget Clearance → Endorsement → Final Approval',
      user: 'Fatema Begum',
      role: 'Area Coordinator',
      timestamp: '2026-03-20 09:15 AM',
      stepInfo: 'Workflow initiated — routed to Step 1: Budget Clearance',
    },
    {
      id: 3,
      type: 'notification',
      title: 'Email Notification Sent',
      description: 'Budget clearance request sent to Finance Focal',
      user: 'System',
      role: 'Automated',
      timestamp: '2026-03-20 09:15 AM',
      detail: 'To: Md. Rafiqul Islam (Finance Manager) | Channel: Email + System Alert',
    },
    {
      id: 4,
      type: 'notification',
      title: 'System Alert Generated',
      description: 'In-app notification for requester confirming submission',
      user: 'System',
      role: 'Automated',
      timestamp: '2026-03-20 09:16 AM',
      detail: 'To: Fatema Begum | Channel: System Alert',
    },
    {
      id: 5,
      type: 'approval',
      title: 'Step 1: Budget Clearance — Approved',
      description:
        'Budget verified. BDG-DRR-2026-001 has sufficient balance (৳18,50,000 available). Budget code and donor code verified against EU grant agreement.',
      user: 'Md. Rafiqul Islam',
      role: 'Finance Manager',
      timestamp: '2026-03-22 11:30 AM',
      stepInfo: 'Budget Clearance complete — MRF advanced to Step 2: Endorsement',
    },
    {
      id: 6,
      type: 'notification',
      title: 'Email Notification Sent',
      description: 'Budget clearance approval notification sent to requester',
      user: 'System',
      role: 'Automated',
      timestamp: '2026-03-22 11:35 AM',
      detail: 'To: Fatema Begum | Channel: Email + System Alert',
    },
    {
      id: 7,
      type: 'notification',
      title: 'Email Notification Sent',
      description: 'Endorsement request sent to Area Manager',
      user: 'System',
      role: 'Automated',
      timestamp: '2026-03-22 11:36 AM',
      detail: 'To: Aminul Haque (Area Manager, Rajshahi) | Channel: Email + System Alert',
    },
    {
      id: 8,
      type: 'comment',
      title: 'Comment Added',
      description:
        'Budget verified. Please note that the EU grant requires all construction expenditure to be reported separately in the quarterly financial report.',
      user: 'Md. Rafiqul Islam',
      role: 'Finance Manager',
      timestamp: '2026-03-22 11:30 AM',
    },
    {
      id: 9,
      type: 'comment',
      title: 'Comment Added',
      description:
        'Thank you. I have noted the EU reporting requirement. We will maintain separate documentation as per the grant agreement.',
      user: 'Fatema Begum',
      role: 'Area Coordinator',
      timestamp: '2026-03-22 02:15 PM',
    },
    {
      id: 10,
      type: 'reminder',
      title: 'Automated Reminder Sent',
      description: 'Endorsement has been pending for 3 days. Automated reminder sent.',
      user: 'System',
      role: 'Automated',
      timestamp: '2026-03-25 09:00 AM',
      detail: 'To: Aminul Haque (Area Manager) | Channel: Email',
    },
  ];
  const getEventIcon = (type) => {
    const icons = {
      create: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
      submit: { icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-100' },
      notification: { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-100' },
      approval: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
      endorsement: { icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-100' },
      comment: { icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
      edit: { icon: Edit, color: 'text-yellow-600', bg: 'bg-yellow-100' },
      version: { icon: GitBranch, color: 'text-primary', bg: 'bg-primary/10' },
      return: { icon: RotateCcw, color: 'text-orange-600', bg: 'bg-orange-100' },
      route: { icon: ArrowRight, color: 'text-green-600', bg: 'bg-green-100' },
      reminder: { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
      system: { icon: Shield, color: 'text-gray-500', bg: 'bg-gray-100' },
    };
    return icons[type] || icons.system;
  };
  const filteredTimeline = timeline.filter((e) => {
    if (filterType === 'all') return true;
    if (filterType === 'approvals') return ['approval', 'endorsement', 'return'].includes(e.type);
    if (filterType === 'notifications') return ['notification', 'reminder'].includes(e.type);
    if (filterType === 'comments') return e.type === 'comment';
    return e.type === filterType;
  });
  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-3 md:gap-4 mb-4">
          <Link href={paths.dashboard.procurement.requisitions.detail(mrfId)}>
            <button type="button" className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          </Link>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
              <h1 className="text-xl md:text-2xl font-semibold text-foreground">
                Audit Trail & Timeline
              </h1>
              <Badge variant="primary">{mrfId}</Badge>
            </div>
            <p className="text-sm md:text-base text-muted-foreground">
              Complete versioning & audit trail for this Material Requisition
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Audit Log
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Timeline */}
        <div className="lg:col-span-8">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'approvals', label: 'Approvals' },
              { id: 'notifications', label: 'Notifications' },
              { id: 'comments', label: 'Comments' },
            ].map((f) => (
              <Button
                key={f.id}
                variant={filterType === f.id ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterType(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {/* Timeline Events */}
          <div className="space-y-0">
            {filteredTimeline.map((event, idx) => {
              const iconConfig = getEventIcon(event.type);
              const Icon = iconConfig.icon;
              return (
                <div key={event.id} className="flex gap-4">
                  {/* Timeline Vertical Line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${iconConfig.bg} shrink-0`}
                    >
                      <Icon className={`w-5 h-5 ${iconConfig.color}`} />
                    </div>
                    {idx < filteredTimeline.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border my-1" />
                    )}
                  </div>

                  {/* Event Content */}
                  <div
                    className={`flex-1 pb-6 ${event.type === 'approval' || event.type === 'endorsement' ? '' : ''}`}
                  >
                    <div
                      className={`p-4 rounded-lg border ${
                        event.type === 'approval'
                          ? 'border-green-200 bg-green-50/50'
                          : event.type === 'return'
                            ? 'border-orange-200 bg-orange-50/50'
                            : event.type === 'notification' || event.type === 'reminder'
                              ? 'border-border bg-muted/20'
                              : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">{event.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {event.user === 'System' ? (
                              <span className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                System Automated
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {event.user} — {event.role}
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-4">
                          {event.timestamp}
                        </span>
                      </div>

                      <p className="text-sm text-foreground mt-2">{event.description}</p>

                      {event.stepInfo && (
                        <div className="mt-2 p-2 bg-primary/5 rounded border border-primary/20 text-xs text-primary font-medium">
                          <ArrowRight className="w-3 h-3 inline mr-1" />
                          {event.stepInfo}
                        </div>
                      )}

                      {event.detail && (
                        <p className="mt-2 text-xs text-muted-foreground">{event.detail}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pending Steps Indicator */}
          <div className="mt-2 flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted border-2 border-dashed border-border">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 p-4 rounded-lg border-2 border-dashed border-border bg-muted/20">
              <h4 className="text-sm font-semibold text-muted-foreground">
                Pending: Step 2 — Endorsement
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Waiting for Aminul Haque (Area Manager) to endorse this MRF
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="warning" size="sm">
                  <Clock className="w-3 h-3 mr-1" />3 days pending
                </Badge>
                <Badge variant="default" size="sm">
                  Next: Final Approval → Auto-Route
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          {/* Version History Box */}
          <Card>
            <CardHeader
              title="Version History"
              description="Track all versions of this MRF"
              action={
                <button
                  type="button"
                  onClick={() => setShowVersions(!showVersions)}
                  className="text-xs text-primary hover:underline"
                >
                  {showVersions ? 'Collapse' : 'Expand'}
                </button>
              }
            />
            {showVersions && (
              <CardBody>
                <div className="space-y-3">
                  {versions.map((v, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${v.status === 'current' ? 'border-primary bg-primary/5' : 'border-border'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={v.status === 'current' ? 'primary' : 'default'} size="sm">
                            {v.version}
                          </Badge>
                          {v.status === 'current' && (
                            <Badge variant="success" size="sm">
                              Current
                            </Badge>
                          )}
                        </div>
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      </div>
                      <p className="text-xs text-foreground mt-1">{v.changes}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        By {v.author} — {v.date}
                      </p>
                    </div>
                  ))}
                </div>
              </CardBody>
            )}
          </Card>

          {/* Workflow Summary */}
          <Card>
            <CardHeader title="Workflow Status" />
            <CardBody>
              <div className="space-y-3">
                {[
                  {
                    step: 1,
                    title: 'Budget Clearance',
                    status: 'approved',
                    by: 'Md. Rafiqul Islam',
                    date: '22 Mar',
                  },
                  {
                    step: 2,
                    title: 'Endorsement',
                    status: 'pending',
                    by: 'Aminul Haque',
                    date: 'Pending',
                  },
                  {
                    step: 3,
                    title: 'Final Approval',
                    status: 'waiting',
                    by: 'Sharif Uddin',
                    date: '—',
                  },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.status === 'approved'
                          ? 'bg-green-500 text-white'
                          : step.status === 'pending'
                            ? 'bg-primary text-white'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {step.status === 'approved' ? <CheckCircle className="w-4 h-4" /> : step.step}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">{step.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {step.by} — {step.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader title="Timeline Statistics" />
            <CardBody>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Events</span>
                  <span className="font-semibold">{timeline.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approvals</span>
                  <span className="font-semibold text-green-600">
                    {timeline.filter((e) => e.type === 'approval').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Notifications</span>
                  <span className="font-semibold">
                    {timeline.filter((e) => ['notification', 'reminder'].includes(e.type)).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comments</span>
                  <span className="font-semibold">
                    {timeline.filter((e) => e.type === 'comment').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Versions</span>
                  <span className="font-semibold">{versions.length}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground">Time Since Submit</span>
                  <span className="font-semibold text-orange-600">5 days</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
