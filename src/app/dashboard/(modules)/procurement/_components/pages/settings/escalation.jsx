'use client';

import { useState } from 'react';
import {
  Bell,
  Plus,
  Clock,
  Edit2,
  ArrowUp,
  Settings,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody } from '../../components/ui/card';
const mockEscalationRules = [
  {
    id: 'ESC-001',
    name: 'Material Requisition Approval',
    module: 'Material Requisitions',
    triggerAfter: 48,
    levels: [
      {
        level: 1,
        delay: '48 hours',
        escalateTo: 'Office Head',
        action: 'Email + In-App Notification',
      },
      {
        level: 2,
        delay: '72 hours',
        escalateTo: 'Deputy Director',
        action: 'Email + SMS + Dashboard Alert',
      },
      {
        level: 3,
        delay: '96 hours',
        escalateTo: 'Country Director',
        action: 'Email + SMS + Auto-Flag',
      },
    ],
    status: 'active',
    totalTriggers: 12,
  },
  {
    id: 'ESC-002',
    name: 'Purchase Order Approval',
    module: 'Purchase Orders',
    triggerAfter: 24,
    levels: [
      {
        level: 1,
        delay: '24 hours',
        escalateTo: 'Procurement Lead',
        action: 'Email + In-App Notification',
      },
      { level: 2, delay: '48 hours', escalateTo: 'Office Head', action: 'Email + SMS' },
      {
        level: 3,
        delay: '72 hours',
        escalateTo: 'Country Director',
        action: 'Email + SMS + Auto-Flag',
      },
    ],
    status: 'active',
    totalTriggers: 8,
  },
  {
    id: 'ESC-003',
    name: 'Payment Requisition',
    module: 'Payment Requisitions',
    triggerAfter: 24,
    levels: [
      {
        level: 1,
        delay: '24 hours',
        escalateTo: 'Finance Manager',
        action: 'Email + In-App Notification',
      },
      { level: 2, delay: '48 hours', escalateTo: 'Deputy Director', action: 'Email + SMS' },
    ],
    status: 'active',
    totalTriggers: 15,
  },
  {
    id: 'ESC-004',
    name: 'Contract Renewal Alert',
    module: 'Contracts',
    triggerAfter: 720,
    levels: [
      {
        level: 1,
        delay: '30 days before expiry',
        escalateTo: 'Contract Manager',
        action: 'Email Notification',
      },
      {
        level: 2,
        delay: '15 days before expiry',
        escalateTo: 'Procurement Lead',
        action: 'Email + Dashboard Alert',
      },
      {
        level: 3,
        delay: '7 days before expiry',
        escalateTo: 'Country Director',
        action: 'Email + SMS + Auto-Flag',
      },
    ],
    status: 'active',
    totalTriggers: 3,
  },
  {
    id: 'ESC-005',
    name: 'Vendor Complaint Resolution',
    module: 'Vendors',
    triggerAfter: 72,
    levels: [
      { level: 1, delay: '72 hours', escalateTo: 'Procurement Officer', action: 'Email' },
      { level: 2, delay: '120 hours', escalateTo: 'Procurement Lead', action: 'Email + SMS' },
    ],
    status: 'paused',
    totalTriggers: 2,
  },
];
const mockActiveEscalations = [
  {
    id: 'AE-001',
    rule: 'Material Requisition Approval',
    ref: 'MR-2026-0142',
    pendingSince: '52 hours',
    currentLevel: 2,
    assignedTo: 'Amer Hamid',
    office: 'Ukhiya',
  },
  {
    id: 'AE-002',
    rule: 'Purchase Order Approval',
    ref: 'PO-2026-0038',
    pendingSince: '30 hours',
    currentLevel: 1,
    assignedTo: 'Nazmul Haque',
    office: "Cox's Bazar",
  },
  {
    id: 'AE-003',
    rule: 'Payment Requisition',
    ref: 'PRF-2026-0091',
    pendingSince: '28 hours',
    currentLevel: 1,
    assignedTo: 'Shahana Begum',
    office: 'Dhaka',
  },
];
export function EscalationSettings() {
  const [tab, setTab] = useState('rules');
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Escalation Management</h1>
          <p className="text-muted-foreground">
            Configure automated escalation rules and monitor active escalations
          </p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          New Rule
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Active Rules"
          value={mockEscalationRules.filter((r) => r.status === 'active').length}
          icon={Settings}
          color="blue"
        />
        <StatCard
          title="Active Escalations"
          value={mockActiveEscalations.length}
          icon={AlertTriangle}
          color="orange"
        />
        <StatCard title="Resolved This Month" value={18} icon={CheckCircle} color="green" />
        <StatCard title="Avg Resolution" value="36h" icon={Clock} color="purple" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setTab('rules')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'rules' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Escalation Rules ({mockEscalationRules.length})
        </button>
        <button
          onClick={() => setTab('active')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'active' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Active Escalations ({mockActiveEscalations.length})
        </button>
      </div>

      {tab === 'rules' && (
        <div className="space-y-4">
          {mockEscalationRules.map((rule) => (
            <Card key={rule.id} hover>
              <CardBody>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-foreground">{rule.name}</h3>
                      <Badge variant={rule.status === 'active' ? 'success' : 'default'} size="sm">
                        {rule.status === 'active' ? 'Active' : 'Paused'}
                      </Badge>
                      <Badge variant="outline" size="sm">
                        {rule.module}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Triggered {rule.totalTriggers} times • First escalation after{' '}
                      {rule.triggerAfter}h
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button variant={rule.status === 'active' ? 'ghost' : 'success'} size="sm">
                      {rule.status === 'active' ? 'Pause' : 'Activate'}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {rule.levels.map((lvl, idx) => (
                    <div key={lvl.level} className="flex items-center gap-2">
                      <div
                        className={`px-3 py-2 rounded-lg border ${idx === 0 ? 'border-blue-200 bg-blue-50' : idx === 1 ? 'border-orange-200 bg-orange-50' : 'border-red-200 bg-red-50'}`}
                      >
                        <p className="text-xs font-semibold text-foreground">Level {lvl.level}</p>
                        <p className="text-xs text-muted-foreground">{lvl.delay}</p>
                        <p className="text-xs font-medium">{lvl.escalateTo}</p>
                      </div>
                      {idx < rule.levels.length - 1 && (
                        <ArrowUp className="w-4 h-4 text-muted-foreground rotate-90" />
                      )}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {tab === 'active' && (
        <Card>
          <CardBody>
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                    Reference
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Rule</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                    Pending Since
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                    Level
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                    Assigned To
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Office</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockActiveEscalations.map((ae) => (
                  <tr
                    key={ae.id}
                    className="border-b border-border hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-3 pr-3 text-sm font-medium text-primary">{ae.ref}</td>
                    <td className="py-3 pr-3 text-sm text-foreground">{ae.rule}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={`text-sm font-medium ${parseInt(ae.pendingSince) > 48 ? 'text-destructive' : 'text-warning'}`}
                      >
                        {ae.pendingSince}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-center">
                      <Badge variant={ae.currentLevel >= 2 ? 'danger' : 'warning'} size="sm">
                        Level {ae.currentLevel}
                      </Badge>
                    </td>
                    <td className="py-3 pr-3 text-sm">{ae.assignedTo}</td>
                    <td className="py-3 pr-3 text-sm text-muted-foreground">{ae.office}</td>
                    <td className="py-3 text-center">
                      <Button variant="outline" size="sm">
                        <Bell className="w-3.5 h-3.5 mr-1" />
                        Nudge
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
