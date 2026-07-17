'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Eye,
  Lock,
  Clock,
  Users,
  Filter,
  Search,
  Calendar,
  Download,
  FileText,
  LockOpen,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

// Map API quotation status to UI display status
function mapStatus(apiStatus) {
  switch ((apiStatus || '').toLowerCase()) {
    case 'published':
      return 'pending';
    case 'opened':
      return 'opened';
    case 'evaluated':
      return 'evaluated';
    default:
      return 'pending';
  }
}

// Map raw API vendor submission to the card shape expected by the renderer
function mapSubmission(s) {
  return {
    id: String(s.id),
    rfqNumber: s.rfq_number || '',
    title: `${s.vendor?.vendor_name || 'Unknown Vendor'} — ${s.rfq_number || ''}`.trim(),
    deadline: s.submitted_at || s.created_at || '',
    publishedDate: s.created_at || '',
    submissions: 1,
    status: mapStatus(s.status),
    openedDate: s.submitted_at || null,
    openedBy: s.vendor?.vendor_name || null,
    vendorsInvited: 1,
    category: s.rfq_number || '',
    estimatedValue: parseFloat(s.financial_proposal?.grand_total || 0),
  };
}
function getStatusInfo(status, deadline) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const isPastDeadline = now > deadlineDate;
  switch (status) {
    case 'ready':
      return {
        label: 'Ready to Open',
        variant: 'success',
        icon: LockOpen,
        canOpen: true,
      };
    case 'pending':
      return {
        label: isPastDeadline ? 'Ready to Open' : 'Awaiting Deadline',
        variant: isPastDeadline ? 'success' : 'warning',
        icon: isPastDeadline ? LockOpen : Lock,
        canOpen: isPastDeadline,
      };
    case 'opened':
      return {
        label: 'Opened',
        variant: 'info',
        icon: Eye,
        canOpen: true,
      };
    case 'evaluated':
      return {
        label: 'Evaluated',
        variant: 'default',
        icon: CheckCircle2,
        canOpen: true,
      };
    default:
      return {
        label: 'Unknown',
        variant: 'default',
        icon: AlertCircle,
        canOpen: false,
      };
  }
}
function formatDeadlineStatus(deadline) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0) {
    return { text: 'Deadline passed', color: 'text-success' };
  }
  if (diffDays > 2) {
    return { text: `${diffDays} days remaining`, color: 'text-muted-foreground' };
  }
  if (diffHours > 24) {
    return { text: `${diffDays} days remaining`, color: 'text-warning' };
  }
  if (diffHours > 0) {
    return { text: `${diffHours} hours remaining`, color: 'text-destructive' };
  }
  return { text: 'Less than 1 hour', color: 'text-destructive' };
}

export function QuotationOpeningDashboard() {
  const mockQuotations = [
    {
      id: 'QUO-2024-001',
      rfqNumber: 'RFQ-2024-015',
      title: 'Office Furniture & Equipment Supply',
      deadline: '2024-03-12T17:00:00',
      publishedDate: '2024-02-25',
      submissions: 5,
      status: 'ready', // ready, pending, opened, evaluated
      openedDate: null,
      openedBy: null,
      vendorsInvited: 8,
      category: 'Office Supplies',
      estimatedValue: 75000,
    },
    {
      id: 'QUO-2024-002',
      rfqNumber: 'RFQ-2024-016',
      title: 'IT Equipment & Software Licenses',
      deadline: '2024-03-15T17:00:00',
      publishedDate: '2024-02-28',
      submissions: 3,
      status: 'pending',
      openedDate: null,
      openedBy: null,
      vendorsInvited: 6,
      category: 'IT Equipment',
      estimatedValue: 120000,
    },
    {
      id: 'QUO-2024-003',
      rfqNumber: 'RFQ-2024-012',
      title: 'Construction Materials for Regional Office',
      deadline: '2024-03-08T17:00:00',
      publishedDate: '2024-02-20',
      submissions: 7,
      status: 'opened',
      openedDate: '2024-03-08T17:15:00',
      openedBy: 'Sarah Johnson',
      vendorsInvited: 10,
      category: 'Construction',
      estimatedValue: 250000,
    },
    {
      id: 'QUO-2024-004',
      rfqNumber: 'RFQ-2024-011',
      title: 'Medical Supplies for Health Program',
      deadline: '2024-03-05T17:00:00',
      publishedDate: '2024-02-18',
      submissions: 4,
      status: 'evaluated',
      openedDate: '2024-03-05T17:10:00',
      openedBy: 'Michael Chen',
      vendorsInvited: 5,
      category: 'Medical',
      estimatedValue: 85000,
    },
    {
      id: 'QUO-2024-005',
      rfqNumber: 'RFQ-2024-017',
      title: 'Vehicle Fleet Maintenance Services',
      deadline: '2024-03-18T17:00:00',
      publishedDate: '2024-03-01',
      submissions: 2,
      status: 'pending',
      openedDate: null,
      openedBy: null,
      vendorsInvited: 7,
      category: 'Services',
      estimatedValue: 95000,
    },
  ];

  const [search, setSearch] = useState('');

  const { data: rawData, loading } = useGetRequest(
    `${endpoints.procurement_management.quotations}?pagination=false`
  );

  const rows = useMemo(
    () => (Array.isArray(rawData) ? rawData : (rawData?.results ?? [])),
    [rawData]
  );

  const quotations = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (item) =>
        item.rfqNumber?.toLowerCase().includes(q) ||
        item.title?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.quotationNumber?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const stats = useMemo(
    () => ({
      readyToOpen: rows.filter((q) => mapStatus(q.status) === 'ready').length,
      awaitingDeadline: rows.filter((q) => mapStatus(q.status) === 'pending').length,
      opened: rows.filter((q) => mapStatus(q.status) === 'opened').length,
      totalSubmissions: rows.reduce((sum, q) => sum + (q.vendors?.length ?? 0), 0),
    }),
    [rows]
  );
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
            Quotation Opening & Evaluation
          </h1>
          <p className="text-sm text-muted-foreground">
            Securely open and evaluate vendor quotations after submission deadlines
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ready to Open</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.readyToOpen}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <LockOpen className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Awaiting Deadline</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.awaitingDeadline}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Opened</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.opened}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-info" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Submissions</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.totalSubmissions}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by RFQ number, title, or category..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Quotations List */}
        <Card>
          <CardHeader
            title="Submitted Quotations"
            description="Review and open quotations after submission deadlines"
          />
          <CardBody>
            {loading && (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
            )}
            {!loading && quotations.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No quotations found.
              </div>
            )}
            <div className="space-y-4">
              {!loading &&
                quotations.map((quotation) => {
                  const statusInfo = getStatusInfo(quotation?.status, quotation?.deadline);
                  const deadlineStatus = formatDeadlineStatus(quotation?.deadline);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <div
                      key={quotation?.id}
                      className="border border-border rounded-lg p-4 md:p-6 hover:border-primary/50 hover:shadow-sm transition-all"
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-base md:text-lg font-semibold text-foreground">
                              {quotation?.title}
                            </h3>
                            <Badge variant={statusInfo.variant}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {quotation?.rfqNumber}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span>{quotation?.category}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>
                              BDT {(quotation?.estimatedValue ?? 0).toLocaleString()} Est. Value
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* {statusInfo.canOpen && ( */}
                          <Link
                            href={paths.dashboard.procurement.quotations.opening(quotation?.id)}
                          >
                            <Button>
                              <Eye className="w-4 h-4 mr-2" />
                              {quotation?.status === 'opened' || quotation?.status === 'evaluated'
                                ? 'View Details'
                                : 'Open Quotations'}
                            </Button>
                          </Link>
                          {/* )} */}
                        </div>
                      </div>

                      {/* Submission Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 md:p-4 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Vendors Invited</p>
                          <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {quotation?.invited_vendors_count ?? 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Submissions Received</p>
                          <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {quotation?.vendors?.length ?? 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Response Rate</p>
                          <p className="text-sm font-semibold text-foreground">
                            {(quotation?.vendors?.length ?? 0) > 0 ? '100%' : '0%'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Deadline Status</p>
                          <p className={`text-sm font-semibold ${deadlineStatus.color}`}>
                            {deadlineStatus.text}
                          </p>
                        </div>
                      </div>

                      {/* Timeline Info */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
                        <div className="flex flex-wrap items-center gap-3 md:gap-6">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            Published:{' '}
                            {quotation?.publishedDate
                              ? new Date(quotation?.publishedDate).toLocaleDateString()
                              : '—'}
                          </span>
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            Deadline:{' '}
                            {quotation?.deadline
                              ? new Date(quotation?.deadline).toLocaleString()
                              : '—'}
                          </span>
                        </div>

                        {quotation?.openedDate && (
                          <div className="flex items-center gap-2 text-muted-foreground bg-muted px-3 py-1 rounded">
                            <Eye className="w-4 h-4" />
                            <span className="text-xs">
                              Opened on {new Date(quotation?.openedDate).toLocaleString()} by{' '}
                              {quotation?.openedBy ?? 'Unknown'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Security Notice for Locked Quotations */}
                      {!statusInfo.canOpen && (
                        <div className="mt-4 flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                          <Lock className="w-4 h-4 text-warning mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-warning mb-1">
                              Quotation Sealed
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Quotation details will be available for opening after the submission
                              deadline passes. This ensures fair and transparent procurement
                              process.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
