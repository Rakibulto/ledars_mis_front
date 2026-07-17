'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Eye,
  Award,
  Search,
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
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
  return `৳${Number(amount)?.toLocaleString('en-IN')}`;
}

const getStatusColor = (status) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'completed':
      return 'default';
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

const getDeliveryStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in-progress':
      return 'warning';
    case 'pending':
    case 'not-started':
      return 'default';
    default:
      return 'default';
  }
};

export function AwardHistory() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
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
    `${endpoints.procurement_management.awards}?pagination=true&acceptanceStatus=pending&acceptanceStatus=declined&page=${page}&search=${debouncedSearch}&status=${statusFilter}&year=${yearFilter}&ordering=${sortBy === 'date-desc' ? '-awardDate' : sortBy === 'date-asc' ? 'awardDate' : sortBy === 'amount-desc' ? '-awardedAmount' : 'awardedAmount'}`
  );

  const awards = awardsData?.results ?? [];
  const totalCount = awardsData?.count ?? 0;
  const pageSize = awardsData?.page_size ?? 10;

  const handleExport = () => {
    if (!awards.length) return;
    const headers = [
      'Award Number',
      'Title',
      'RFQ Number',
      'Vendor',
      'Status',
      'Delivery Status',
      'Award Date',
      'Completion Date',
      'Contract Value (BDT)',
      'Amount Paid (BDT)',
      'Total Items',
      'Delivered Items',
      'Delivery Progress (%)',
    ];
    const rows = awards.map((a) => [
      a.award_number ?? '',
      a.title ?? '',
      a.rfqNumber ?? '',
      a.vendor?.name ?? '',
      a.status ?? '',
      a.deliveryStatus ?? '',
      a.awardDate ?? '',
      a.completionDate ?? '',
      a.awardedAmount ?? 0,
      a.amountPaid ?? 0,
      a.totalItems || a.items?.length || 0,
      a.deliveredItems ?? 0,
      a.deliveryProgress ?? 0,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `award-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalAwards = summaryData?.total ?? 0;
  const totalAmount = summaryData?.total_amount ?? 0;
  const totalPaid = summaryData?.total_paid ?? 0;
  const completedAwards = summaryData?.completed ?? 0;
  const yoyGrowth = summaryData?.yoy_growth ?? 0;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Award History</h1>
        <p className="text-muted-foreground">Historical contract awards and performance tracking</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Awards</p>
                <p className="text-xl font-semibold text-foreground">{totalAwards}</p>
                <p className="text-xs text-muted-foreground mt-1">{completedAwards} completed</p>
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
                <p className="text-sm text-muted-foreground mb-1">Total Contract Value</p>
                <p className="text-xl font-semibold text-foreground">{formatBDT(totalAmount)}</p>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                <p className="text-xl font-semibold text-success">{formatBDT(totalPaid)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalAmount > 0
                    ? `${((totalPaid / totalAmount) * 100).toFixed(1)}% of total value`
                    : '—'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-success" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">YoY Growth</p>
                <p
                  className={`text-xl font-semibold ${yoyGrowth >= 0 ? 'text-success' : 'text-error'}`}
                >
                  {yoyGrowth >= 0 ? '+' : ''}
                  {Number(yoyGrowth).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date().getFullYear()} vs {new Date().getFullYear() - 1}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
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
              <option value="completed">Completed</option>
              <option value="pending-acceptance">Pending</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Years</option>
              {[2026, 2025, 2024, 2023, 2022].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="date-desc">Latest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Value</option>
              <option value="amount-asc">Lowest Value</option>
            </select>

            <Button size="sm" variant="outline" onClick={handleExport} disabled={!awards.length}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Awards List */}
      <Card>
        <CardHeader
          title={`Award History (${totalCount})`}
          description="Complete history of contract awards"
        />
        <CardBody>
          {loading ? (
            <PageLoader message="Loading award history..." />
          ) : awards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <p className="text-center text-muted-foreground">No awards found.</p>
              {(search || statusFilter || yearFilter || sortBy !== 'date-desc') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setDebouncedSearch('');
                    setStatusFilter('');
                    setYearFilter('');
                    setSortBy('date-desc');
                    setPage(1);
                  }}
                >
                  Reset All Filters
                </Button>
              )}
            </div>
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
                        <Badge variant={getDeliveryStatusColor(award.deliveryStatus)}>
                          {award.deliveryStatus?.replace('-', ' ')}
                        </Badge>
                        {(award.vendor?.is_direct_evaluation || !award.vendor?.id) && (
                          <Badge variant="secondary">Direct Eval</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{award.title}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>RFQ: {award.rfqNumber}</span>
                        <span>•</span>
                        <span>Award Date: {award.awardDate}</span>
                        {award.completionDate && (
                          <>
                            <span>•</span>
                            <span>Completed: {award.completionDate}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Link href={paths.dashboard.procurement.awards.notification(award.id)}>
                        <Button size="sm" variant="outline">
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Vendor</p>
                      <p className="text-sm font-medium text-foreground">{award.vendor?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Contract Value</p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatBDT(award.awardedAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Amount Paid</p>
                      <p className="text-sm font-semibold text-success">
                        {formatBDT(award.amountPaid)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Items</p>
                      <p className="text-sm font-medium text-foreground">
                        {award.deliveredItems || 0}/{award.totalItems || award.items?.length || 0}{' '}
                        delivered
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {award.status !== 'completed' && award.deliveryProgress > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Delivery Progress</span>
                        <span className="text-xs font-medium text-foreground">
                          {award.deliveryProgress}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${award.deliveryProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
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
