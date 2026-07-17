'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Eye,
  Mail,
  Award,
  Clock,
  Search,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  DraftingCompass,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { PageLoader } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

function formatBDT(amount) {
  if (!amount) return '৳0';
  if (amount >= 10000000) return `৳${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(2)} Lakh`;
  return `৳${amount?.toLocaleString('en-IN')}`;
}

const getStatusColor = (status) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'pending-acceptance':
      return 'warning';
    case 'draft':
      return 'default';
    case 'expired':
      return 'error';
    default:
      return 'default';
  }
};

const getNotificationStatusColor = (status) => {
  switch (status) {
    case 'sent':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
};

const getAcceptanceStatusColor = (status) => {
  switch (status) {
    case 'accepted':
      return 'success';
    case 'pending':
      return 'warning';
    case 'rejected':
      return 'error';
    case 'not-sent':
      return 'default';
    default:
      return 'default';
  }
};

export function AwardSummary() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data: summaryData } = useGetRequest(endpoints.procurement_management.award_summary);
  const { data: awardsData, loading } = useGetRequest(
    `${endpoints.procurement_management.awards}?pagination=true&acceptanceStatus=pending&acceptanceStatus=accepted&page=${page}&search=${debouncedSearch}&status=${statusFilter}&category=${categoryFilter}`
  );
  const { data: categoriesData } = useGetRequest(endpoints.procurement_management.item_category);

  const awards = awardsData?.results ?? [];
  const totalCount = awardsData?.count ?? 0;
  const pageSize = awardsData?.page_size ?? 10;
  const directEvaluationCount = awards.filter(
    (award) => award?.vendor?.is_direct_evaluation || !award?.vendor?.id
  ).length;

  const totalAwards = summaryData?.total ?? 0;
  const activeAwards = summaryData?.active ?? 0;
  const pendingAwards = summaryData?.pending ?? 0;
  const notifiedCount = summaryData?.notified ?? 0;
  const acceptedCount = summaryData?.accepted ?? 0;
  const totalAmount = summaryData?.total_amount ?? 0;

  const categories = Array.isArray(categoriesData)
    ? categoriesData
    : (categoriesData?.results ?? []);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Award Summary</h1>
        <p className="text-muted-foreground">Manage contract awards and vendor notifications</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Awards</p>
                <p className="text-xl font-semibold text-foreground">{totalAwards}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Award className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Awards</p>
                <p className="text-xl font-semibold text-foreground">{activeAwards}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-success" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Acceptance</p>
                <p className="text-xl font-semibold text-foreground">{pendingAwards}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 text-warning" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                <p className="text-xl font-semibold text-foreground">{formatBDT(totalAmount)}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notifications Sent</p>
                <p className="text-xl font-semibold text-foreground">
                  {notifiedCount}/{totalAwards}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalAwards > 0
                    ? `${((notifiedCount / totalAwards) * 100).toFixed(0)}% completion rate`
                    : '—'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Vendor Accepted</p>
                <p className="text-xl font-semibold text-success">{acceptedCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalAwards > 0
                    ? `${((acceptedCount / totalAwards) * 100).toFixed(0)}% acceptance rate`
                    : '—'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-success" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by award ID, title, or vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending-acceptance">Pending Acceptance</option>
              <option value="draft">Draft</option>
              <option value="expired">Expired</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Awards List */}
      {directEvaluationCount > 0 && (
        <Card className="mb-6 border-secondary bg-secondary/5">
          <CardBody>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-secondary" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  {directEvaluationCount} direct evaluation award
                  {directEvaluationCount > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  These awards bypass standard vendor portal notification and acceptance.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
      <Card>
        <CardHeader
          title={`Awards (${totalCount})`}
          description="View and manage contract awards"
        />
        <CardBody>
          {loading ? (
            <PageLoader message="Loading awards..." />
          ) : awards.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No awards found.</p>
          ) : (
            <div className="space-y-4">
              {awards.map((award) => (
                <div
                  key={award.id}
                  className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{award.award_number}</h3>
                        <Badge variant={getStatusColor(award.status)}>
                          {award.status?.replace('-', ' ')}
                        </Badge>
                        {(award.vendor?.is_direct_evaluation || !award.vendor?.id) && (
                          <Badge variant="secondary">Direct Eval</Badge>
                        )}
                        <Badge variant={getNotificationStatusColor(award.notificationStatus)}>
                          {award.notificationStatus === 'sent'
                            ? 'Notified'
                            : 'Pending Notification'}
                        </Badge>
                        {award.acceptanceStatus === 'accepted' && (
                          <Badge variant="success">Vendor Accepted</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{award.title}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>RFQ: {award.rfqNumber}</span>
                        <span>•</span>
                        <span>CS: {award.csNumber}</span>
                        <span>•</span>
                        <span>Award Date: {award.awardDate}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Link href={paths.dashboard.procurement.awards.notification(award.id)}>
                        <Button size="sm" variant="outline">
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          View Details
                        </Button>
                      </Link>
                      <Link href={paths.dashboard.procurement.awards.vendorView(award.id)}>
                        <Button size="sm" variant="outline">
                          <DraftingCompass className="w-3.5 h-3.5 mr-1.5" />
                          Vendor view
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Vendor</p>
                      <p className="text-sm font-medium text-foreground">
                        {award.vendor?.name ||
                          award.vendor?.contactPerson ||
                          award.vendor_name ||
                          award.vendorName ||
                          'Direct evaluation vendor'}
                      </p>
                      {award.vendor?.email && (
                        <p className="text-xs text-muted-foreground mt-0.5">{award.vendor.email}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Awarded Amount</p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatBDT(award.awardedAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Savings</p>
                      <p className="text-sm font-semibold text-success">
                        {formatBDT(award.savings)}{' '}
                        {award.savingsPercentage ? `(${award.savingsPercentage}%)` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Delivery Timeline</p>
                      <p className="text-sm font-medium text-foreground">
                        {award.deliveryTimeline}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      <span>
                        {award.notificationStatus === 'sent'
                          ? award.notificationDate
                            ? `Notified on ${award.notificationDate}`
                            : 'Notified'
                          : 'Notification pending'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {award.vendor?.is_direct_evaluation || !award.vendor?.id ? (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>Direct evaluation award</span>
                        </>
                      ) : award.acceptanceStatus === 'accepted' ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-success" />
                          <span>Accepted on {award.acceptanceDate}</span>
                        </>
                      ) : award.acceptanceStatus === 'pending' ? (
                        <>
                          <Clock className="w-3 h-3 text-warning" />
                          <span>Awaiting vendor acceptance</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>Not sent to vendor</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      <span>{award.totalItems || award.items?.length || 0} items</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalCount > pageSize && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of{' '}
                {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page * pageSize >= totalCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
