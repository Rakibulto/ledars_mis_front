'use client';

import { useState } from 'react';
import { Plus, Users, Edit2, Shield, Search, Calendar, ArrowRight } from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody } from '../../components/ui/card';
const mockDelegations = [
  {
    id: 'DEL-001',
    fromUser: 'Farah Kabir',
    fromRole: 'Country Director',
    toUser: 'Amer Hamid',
    toRole: 'Deputy Director - Programs',
    type: 'Full Authority',
    permissions: ['Purchase Order Approval', 'Payment Approval', 'Contract Signing'],
    startDate: '2026-04-15',
    endDate: '2026-04-30',
    reason: 'Annual leave — Dhaka',
    status: 'active',
    maxAmount: 5000000,
  },
  {
    id: 'DEL-002',
    fromUser: 'Amer Hamid',
    fromRole: 'Deputy Director - Programs',
    toUser: 'Shahana Begum',
    toRole: 'Finance Manager',
    type: 'Partial',
    permissions: ['Payment Approval up to ৳500K'],
    startDate: '2026-04-10',
    endDate: '2026-04-12',
    reason: "Field visit — Cox's Bazar",
    status: 'expired',
    maxAmount: 500000,
  },
  {
    id: 'DEL-003',
    fromUser: 'Nazmul Haque',
    fromRole: "Procurement Lead — Cox's Bazar",
    toUser: 'Rima Sultana',
    toRole: 'Senior Procurement Officer',
    type: 'Partial',
    permissions: ['Material Requisition Approval', 'RFQ Publication'],
    startDate: '2026-05-01',
    endDate: '2026-05-15',
    reason: 'Training program — Dhaka',
    status: 'scheduled',
    maxAmount: 1000000,
  },
  {
    id: 'DEL-004',
    fromUser: 'Tarek Ahmed',
    fromRole: 'Office Head — Ukhiya',
    toUser: 'Nasreen Akhter',
    toRole: 'Program Coordinator',
    type: 'Emergency',
    permissions: ['Emergency Purchase up to ৳200K', 'GRN Approval'],
    startDate: '2026-04-01',
    endDate: '2026-04-03',
    reason: 'Medical emergency leave',
    status: 'expired',
    maxAmount: 200000,
  },
];
const statusMap = {
  active: { variant: 'success', label: 'Active' },
  expired: { variant: 'default', label: 'Expired' },
  scheduled: { variant: 'info', label: 'Scheduled' },
  revoked: { variant: 'danger', label: 'Revoked' },
};
const typeMap = {
  'Full Authority': 'primary',
  Partial: 'warning',
  Emergency: 'danger',
};
export function DelegationSettings() {
  const [searchQuery, setSearchQuery] = useState('');
  const filtered = mockDelegations.filter(
    (d) =>
      d.fromUser.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.toUser.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Authority Delegation</h1>
          <p className="text-muted-foreground">
            Manage temporary authority delegation for approvals and actions
          </p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          New Delegation
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Active Delegations"
          value={mockDelegations.filter((d) => d.status === 'active').length}
          icon={Shield}
          color="green"
        />
        <StatCard
          title="Scheduled"
          value={mockDelegations.filter((d) => d.status === 'scheduled').length}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Total This Month"
          value={mockDelegations.length}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Expired"
          value={mockDelegations.filter((d) => d.status === 'expired').length}
          icon={Users}
          color="orange"
        />
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by user or delegation ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardBody>
      </Card>

      <div className="space-y-4">
        {filtered.map((d) => {
          const s = statusMap[d.status] || statusMap.active;
          return (
            <Card key={d.id} hover>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-medium text-primary">{d.id}</span>
                      <Badge variant={typeMap[d.type] || 'default'} size="sm">
                        {d.type}
                      </Badge>
                      <Badge variant={s.variant} size="sm">
                        {s.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">{d.fromUser}</p>
                        <p className="text-xs text-muted-foreground">{d.fromRole}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-primary" />
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">{d.toUser}</p>
                        <p className="text-xs text-muted-foreground">{d.toRole}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {d.startDate} → {d.endDate}
                      </span>
                      <span>Max: ৳{(d.maxAmount / 1000000).toFixed(1)}M</span>
                      <span>{d.reason}</span>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {d.permissions.map((p, i) => (
                        <Badge key={i} variant="outline" size="sm">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {d.status === 'active' && (
                      <Button variant="danger" size="sm">
                        Revoke
                      </Button>
                    )}
                    {d.status === 'scheduled' && (
                      <Button variant="outline" size="sm">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
