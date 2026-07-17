import { useState } from 'react';
import { Link } from 'react-router';
import {
  Eye,
  Tag,
  Clock,
  Search,
  Shield,
  Package,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody } from '../../components/ui/card';
const vendorCategories = [
  'IT Equipment',
  'Computer Hardware',
  'Networking',
  'Software & Licensing',
  'Office Equipment',
];
const mockRFQs = [
  {
    id: 'RFQ-2026-045',
    title: 'Emergency Tarpaulins Supply (200 pcs)',
    category: 'Relief Supplies',
    publishedDate: '2026-04-01',
    closingDate: '2026-04-10',
    status: 'open',
    itemCount: 3,
    office: 'Ukhiya Field Office',
    estimatedValue: 'BDT 5,00,000 - 8,00,000',
    submitted: false,
    matchesCategory: false,
  },
  {
    id: 'RFQ-2026-042',
    title: 'Laptop Procurement - WASH Project (Dhaka)',
    category: 'IT Equipment',
    publishedDate: '2026-03-25',
    closingDate: '2026-04-18',
    status: 'open',
    itemCount: 5,
    office: 'Dhaka Head Office',
    estimatedValue: 'BDT 6,50,000',
    submitted: false,
    matchesCategory: true,
  },
  {
    id: 'RFQ-2026-040',
    title: 'Network Switch & Router for Field Offices',
    category: 'Networking',
    publishedDate: '2026-03-22',
    closingDate: '2026-04-12',
    status: 'open',
    itemCount: 4,
    office: "Cox's Bazar Regional Office",
    estimatedValue: 'BDT 3,20,000',
    submitted: false,
    matchesCategory: true,
  },
  {
    id: 'RFQ-2026-038',
    title: 'Desktop PC & Monitors - Rajshahi Office',
    category: 'Computer Hardware',
    publishedDate: '2026-03-20',
    closingDate: '2026-04-08',
    status: 'closing-soon',
    itemCount: 3,
    office: 'Rajshahi LRP Office',
    estimatedValue: 'BDT 4,85,000',
    submitted: false,
    matchesCategory: true,
  },
  {
    id: 'RFQ-2026-035',
    title: 'Server & UPS - HQ Data Center Upgrade',
    category: 'IT Equipment',
    publishedDate: '2026-03-15',
    closingDate: '2026-04-25',
    status: 'open',
    itemCount: 6,
    office: 'Dhaka Head Office',
    estimatedValue: 'BDT 12,00,000',
    submitted: false,
    matchesCategory: true,
  },
  {
    id: 'RFQ-2026-030',
    title: 'Microsoft 365 Licensing (Annual)',
    category: 'Software & Licensing',
    publishedDate: '2026-03-10',
    closingDate: '2026-03-28',
    status: 'submitted',
    itemCount: 2,
    office: 'Dhaka Head Office',
    estimatedValue: 'BDT 8,50,000',
    submitted: true,
    matchesCategory: true,
  },
  {
    id: 'RFQ-2026-025',
    title: 'Multifunction Printers & Scanners',
    category: 'Office Equipment',
    publishedDate: '2026-03-05',
    closingDate: '2026-03-20',
    status: 'awarded',
    itemCount: 4,
    office: 'All Offices (Dhaka, CXB, Rajshahi)',
    estimatedValue: 'BDT 4,20,000',
    submitted: true,
    matchesCategory: true,
  },
  {
    id: 'RFQ-2026-022',
    title: 'Firewall & Cybersecurity Appliances',
    category: 'Networking',
    publishedDate: '2026-02-28',
    closingDate: '2026-03-15',
    status: 'closed',
    itemCount: 3,
    office: 'Dhaka Head Office',
    estimatedValue: 'BDT 5,60,000',
    submitted: true,
    matchesCategory: true,
  },
];
const statusMap = {
  open: { variant: 'success', label: 'Open for Bidding' },
  'closing-soon': { variant: 'warning', label: 'Closing Soon' },
  submitted: { variant: 'info', label: 'Proposal Submitted' },
  closed: { variant: 'default', label: 'Closed' },
  awarded: { variant: 'primary', label: 'Awarded' },
};
export function VendorPortalRFQs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('my-categories');
  const filtered = mockRFQs.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesCategory =
      categoryFilter === 'all' || (categoryFilter === 'my-categories' && r.matchesCategory);
    return matchesSearch && matchesStatus && matchesCategory;
  });
  const myRFQs = mockRFQs.filter((r) => r.matchesCategory);
  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-semibold text-foreground">Available RFQs</h1>
          <Badge variant="info" size="sm">
            <Shield className="w-3 h-3 mr-1" />
            Category-Filtered
          </Badge>
        </div>
        <p className="text-muted-foreground">
          RFQs matching your assigned categories from Ledars NGO
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-semibold">MY CATEGORIES:</span>
          {vendorCategories.map((cat) => (
            <Badge key={cat} variant="default" size="sm">
              <Tag className="w-3 h-3 mr-1" />
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Open (My Categories)"
          value={myRFQs.filter((r) => r.status === 'open' || r.status === 'closing-soon').length}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Proposals Submitted"
          value={myRFQs.filter((r) => r.submitted).length}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Closing Soon"
          value={myRFQs.filter((r) => r.status === 'closing-soon').length}
          icon={AlertCircle}
          color="orange"
        />
        <StatCard
          title="Awarded to You"
          value={myRFQs.filter((r) => r.status === 'awarded').length}
          icon={Package}
          color="purple"
        />
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search RFQs by title or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="my-categories">My Categories Only</option>
              <option value="all">All RFQs</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="closing-soon">Closing Soon</option>
              <option value="submitted">Submitted</option>
              <option value="closed">Closed</option>
              <option value="awarded">Awarded</option>
            </select>
          </div>
        </CardBody>
      </Card>

      <div className="space-y-4">
        {filtered.map((rfq) => {
          const s = statusMap[rfq.status] || statusMap.open;
          return (
            <Card key={rfq.id} hover>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        to={`/vendor-portal/rfqs/${rfq.id}`}
                        className="text-base font-semibold text-primary hover:underline"
                      >
                        {rfq.id}
                      </Link>
                      <Badge variant={s.variant} size="sm">
                        {s.label}
                      </Badge>
                      <Badge variant={rfq.matchesCategory ? 'primary' : 'outline'} size="sm">
                        {rfq.matchesCategory && <Tag className="w-3 h-3 mr-1" />}
                        {rfq.category}
                      </Badge>
                      {!rfq.matchesCategory && (
                        <span className="text-[10px] text-muted-foreground italic">
                          Not in your categories
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground mb-2">{rfq.title}</p>
                    <div className="flex items-center gap-6 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" />
                        {rfq.itemCount} items
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Published: {rfq.publishedDate}
                      </span>
                      <span
                        className={`flex items-center gap-1 ${rfq.status === 'closing-soon' ? 'text-orange-600 font-semibold' : ''}`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Closes: {rfq.closingDate}
                      </span>
                      <span>{rfq.office}</span>
                      <span>Est: {rfq.estimatedValue}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link to={`/vendor-portal/rfqs/${rfq.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    {(rfq.status === 'open' || rfq.status === 'closing-soon') &&
                      !rfq.submitted &&
                      rfq.matchesCategory && (
                        <Link to={`/vendor-portal/rfqs/${rfq.id}/submit`}>
                          <Button variant="primary" size="sm">
                            Submit Proposal
                          </Button>
                        </Link>
                      )}
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card>
            <CardBody>
              <p className="text-center text-muted-foreground py-8">
                No RFQs found matching your filters.
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
