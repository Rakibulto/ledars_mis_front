'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Eye,
  Edit,
  Plus,
  Search,
  FileText,
  Calendar,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody } from '../../components/ui/card';
const mockContracts = [
  {
    id: 'CNT-2026-001',
    title: 'Emergency Relief Supply - Annual Framework',
    vendor: "Cox's Bazar Relief Supplies Ltd",
    vendorId: 'VND-001',
    awardRef: 'AWD-2026-012',
    type: 'Framework Agreement',
    startDate: '2026-01-15',
    endDate: '2027-01-14',
    value: 4500000,
    spent: 2850000,
    status: 'active',
    amendmentCount: 1,
    office: 'Dhaka Head Office',
    category: 'Goods',
    paymentTerms: 'Net 30',
    renewalDue: '2026-12-14',
  },
  {
    id: 'CNT-2026-002',
    title: 'Warehouse Construction - Teknaf',
    vendor: 'National Builders Co.',
    vendorId: 'VND-005',
    awardRef: 'AWD-2026-008',
    type: 'Fixed-Price',
    startDate: '2026-02-01',
    endDate: '2026-08-31',
    value: 8200000,
    spent: 5740000,
    status: 'active',
    amendmentCount: 0,
    office: 'Teknaf Field Office',
    category: 'Works',
    paymentTerms: 'Milestone-based',
    renewalDue: null,
  },
  {
    id: 'CNT-2026-003',
    title: 'IT Infrastructure Maintenance',
    vendor: 'TechServe Solutions',
    vendorId: 'VND-009',
    awardRef: 'AWD-2025-045',
    type: 'Service Level Agreement',
    startDate: '2025-07-01',
    endDate: '2026-06-30',
    value: 1200000,
    spent: 900000,
    status: 'expiring-soon',
    amendmentCount: 0,
    office: 'Dhaka Head Office',
    category: 'Services',
    paymentTerms: 'Monthly',
    renewalDue: '2026-05-30',
  },
  {
    id: 'CNT-2025-018',
    title: 'Medical Equipment Supply',
    vendor: 'HealthFirst Bangladesh',
    vendorId: 'VND-012',
    awardRef: 'AWD-2025-032',
    type: 'Purchase Order',
    startDate: '2025-09-01',
    endDate: '2026-02-28',
    value: 3400000,
    spent: 3400000,
    status: 'completed',
    amendmentCount: 2,
    office: 'Ukhiya Field Office',
    category: 'Goods',
    paymentTerms: 'Net 45',
    renewalDue: null,
  },
  {
    id: 'CNT-2026-004',
    title: 'Vehicle Rental - Field Operations',
    vendor: 'Desh Transport Services',
    vendorId: 'VND-015',
    awardRef: 'AWD-2026-003',
    type: 'Service Level Agreement',
    startDate: '2026-03-01',
    endDate: '2027-02-28',
    value: 2400000,
    spent: 400000,
    status: 'active',
    amendmentCount: 0,
    office: "Cox's Bazar Sadar Office",
    category: 'Services',
    paymentTerms: 'Monthly',
    renewalDue: '2027-01-28',
  },
];
const statusMap = {
  active: { variant: 'success', label: 'Active' },
  'expiring-soon': { variant: 'warning', label: 'Expiring Soon' },
  expired: { variant: 'danger', label: 'Expired' },
  completed: { variant: 'info', label: 'Completed' },
  terminated: { variant: 'danger', label: 'Terminated' },
  draft: { variant: 'default', label: 'Draft' },
};
export function ContractList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const filtered = mockContracts.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });
  const totalValue = mockContracts
    .filter((c) => c.status === 'active')
    .reduce((s, c) => s + c.value, 0);
  const totalSpent = mockContracts
    .filter((c) => c.status === 'active')
    .reduce((s, c) => s + c.spent, 0);
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
            Contract Management
          </h1>
          <p className="text-muted-foreground">Manage vendor contracts, amendments, and renewals</p>
        </div>
        <Link href={paths.dashboard.procurement_new.contracts.create}>
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Contract
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Active Contracts"
          value={mockContracts.filter((c) => c.status === 'active').length}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Total Active Value"
          value={`৳${(totalValue / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Expiring Soon"
          value={mockContracts.filter((c) => c.status === 'expiring-soon').length}
          icon={AlertTriangle}
          color="orange"
        />
        <StatCard
          title="Active Utilization"
          value={`${Math.round((totalSpent / totalValue) * 100)}%`}
          icon={Calendar}
          color="purple"
        />
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by contract title, vendor, or ID..."
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
              <option value="active">Active</option>
              <option value="expiring-soon">Expiring Soon</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Types</option>
              <option value="Framework Agreement">Framework Agreement</option>
              <option value="Fixed-Price">Fixed-Price</option>
              <option value="Service Level Agreement">SLA</option>
              <option value="Purchase Order">Purchase Order</option>
            </select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Contract</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Vendor</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Type</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Duration</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                    Value
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                    Utilization
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                    Status
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((contract) => {
                  const s = statusMap[contract.status] || statusMap.draft;
                  const utilPct = Math.round((contract.spent / contract.value) * 100);
                  return (
                    <tr
                      key={contract.id}
                      className="border-b border-border hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <div>
                          <Link
                            href={paths.dashboard.procurement_new.contracts.detail(contract.id)}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            {contract.id}
                          </Link>
                          <p className="text-sm text-foreground mt-0.5">{contract.title}</p>
                          <p className="text-xs text-muted-foreground">{contract.office}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-sm text-foreground">{contract.vendor}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" size="sm">
                          {contract.type}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-sm text-foreground">{contract.startDate}</p>
                        <p className="text-xs text-muted-foreground">to {contract.endDate}</p>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <p className="text-sm font-medium text-foreground">
                          ৳{(contract.value / 1000000).toFixed(2)}M
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Spent: ৳{(contract.spent / 1000000).toFixed(2)}M
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`text-sm font-semibold ${utilPct >= 90 ? 'text-destructive' : utilPct >= 70 ? 'text-orange-600' : 'text-green-600'}`}
                          >
                            {utilPct}%
                          </span>
                          <div className="w-16 bg-secondary rounded-full h-1.5">
                            <div
                              className={`rounded-full h-1.5 ${utilPct >= 90 ? 'bg-destructive' : utilPct >= 70 ? 'bg-orange-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(utilPct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <Badge variant={s.variant} size="sm">
                          {s.label}
                        </Badge>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={paths.dashboard.procurement_new.contracts.detail(contract.id)}
                          >
                            <button className="p-1.5 hover:bg-muted rounded transition-colors">
                              <Eye className="w-4 h-4 text-primary" />
                            </button>
                          </Link>
                          <button className="p-1.5 hover:bg-muted rounded transition-colors">
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
