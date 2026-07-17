import { useState } from 'react';
import { Link } from 'react-router';
import { Eye, Clock, Search, FileText, DollarSign, CheckCircle } from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody } from '../../components/ui/card';
const mockQuotations = [
  {
    id: 'QTN-VP-001',
    rfqId: 'RFQ-2026-045',
    rfqTitle: 'Emergency Tarpaulins Supply',
    submittedDate: '2026-04-05',
    totalAmount: 4250000,
    items: 3,
    status: 'under-review',
    validUntil: '2026-05-05',
    deliveryDays: 15,
  },
  {
    id: 'QTN-VP-002',
    rfqId: 'RFQ-2026-038',
    rfqTitle: 'Medical Equipment & Supplies',
    submittedDate: '2026-03-22',
    totalAmount: 980000,
    items: 8,
    status: 'awarded',
    validUntil: '2026-04-22',
    deliveryDays: 10,
  },
  {
    id: 'QTN-VP-003',
    rfqId: 'RFQ-2026-035',
    rfqTitle: 'Vehicle Maintenance Service Contract',
    submittedDate: '2026-03-18',
    totalAmount: 720000,
    items: 2,
    status: 'not-selected',
    validUntil: '2026-04-18',
    deliveryDays: 7,
  },
  {
    id: 'QTN-VP-004',
    rfqId: 'RFQ-2026-030',
    rfqTitle: 'Warehouse Shelving & Storage Equipment',
    submittedDate: '2026-03-10',
    totalAmount: 560000,
    items: 4,
    status: 'awarded',
    validUntil: '2026-04-10',
    deliveryDays: 20,
  },
];
const statusMap = {
  draft: { variant: 'default', label: 'Draft' },
  'under-review': { variant: 'warning', label: 'Under Review' },
  awarded: { variant: 'success', label: 'Awarded' },
  'not-selected': { variant: 'danger', label: 'Not Selected' },
};
export function VendorPortalQuotations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const filtered = mockQuotations.filter((q) => {
    const matchesSearch =
      q.rfqTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const totalSubmitted = mockQuotations.length;
  const totalValue = mockQuotations.reduce((s, q) => s + q.totalAmount, 0);
  const awarded = mockQuotations.filter((q) => q.status === 'awarded').length;
  const pending = mockQuotations.filter((q) => q.status === 'under-review').length;
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">My Quotations</h1>
        <p className="text-muted-foreground">
          Track all your submitted quotations and their status
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatCard title="Total Submitted" value={totalSubmitted} icon={FileText} color="blue" />
        <StatCard
          title="Total Value"
          value={`৳${(totalValue / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          color="green"
        />
        <StatCard title="Awarded" value={awarded} icon={CheckCircle} color="purple" />
        <StatCard title="Under Review" value={pending} icon={Clock} color="orange" />
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search quotations..."
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
              <option value="under-review">Under Review</option>
              <option value="awarded">Awarded</option>
              <option value="not-selected">Not Selected</option>
            </select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <table className="w-full">
            <thead className="border-b-2 border-border">
              <tr className="text-left">
                <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                  Quotation ID
                </th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase">RFQ</th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase">Submitted</th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                  Items
                </th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                  Amount
                </th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                  Status
                </th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => {
                const s = statusMap[q.status] || statusMap.draft;
                return (
                  <tr
                    key={q.id}
                    className="border-b border-border hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-3 pr-3 text-sm font-medium text-primary">{q.id}</td>
                    <td className="py-3 pr-3">
                      <p className="text-sm font-medium text-foreground">{q.rfqTitle}</p>
                      <p className="text-xs text-muted-foreground">{q.rfqId}</p>
                    </td>
                    <td className="py-3 pr-3 text-sm text-muted-foreground">{q.submittedDate}</td>
                    <td className="py-3 pr-3 text-sm text-center">{q.items}</td>
                    <td className="py-3 pr-3 text-sm font-semibold text-right">
                      ৳{q.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 pr-3 text-center">
                      <Badge variant={s.variant} size="sm">
                        {s.label}
                      </Badge>
                    </td>
                    <td className="py-3 text-center">
                      <Link to={`/vendor-portal/rfqs/${q.rfqId}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
