'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Eye,
  Plus,
  Clock,
  Search,
  Printer,
  XCircle,
  Banknote,
  FileText,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

const formatBDT = (amount) => {
  const value = Number(amount) || 0;
  if (value >= 10000000) return `৳${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `৳${(value / 100000).toFixed(2)} L`;
  return `৳${value.toLocaleString('en-IN')}`;
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const toList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  return [];
};

const getStatusVariant = (status) => {
  switch (status) {
    case 'Approved':
    case 'Paid':
      return 'success';
    case 'Rejected':
      return 'error';
    case 'Submitted':
    case 'Pending Approval':
      return 'warning';
    default:
      return 'default';
  }
};

const isActionableStatus = (status) => ['Submitted', 'Pending Approval'].includes(status);

const getPRFGrnNumbers = (prf) => {
  if (Array.isArray(prf?.grn_numbers) && prf.grn_numbers.length > 0) {
    return prf.grn_numbers.filter(Boolean);
  }
  return prf?.grn_number ? [prf.grn_number] : [];
};

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const getDayDiffFromToday = (value) => {
  const date = toDate(value);
  if (!date) return null;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((target - startOfToday) / (1000 * 60 * 60 * 24));
};

const getScheduleStatusBadge = (daysDiff) => {
  if (daysDiff === null) return { label: 'No schedule', variant: 'default' };
  if (daysDiff < 0) return { label: `Overdue ${Math.abs(daysDiff)}d`, variant: 'error' };
  if (daysDiff === 0) return { label: 'Due today', variant: 'warning' };
  if (daysDiff <= 7) return { label: `Due in ${daysDiff}d`, variant: 'warning' };
  return { label: `Due in ${daysDiff}d`, variant: 'success' };
};

export function PRFList() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'register';
  const isScheduleView = view === 'schedule';
  const statusFromQuery = searchParams.get('status') || 'Approved';
  const effectiveStatusFilter = isScheduleView ? 'all' : statusFromQuery;
  const isPendingApprovalsView = !isScheduleView && effectiveStatusFilter === 'Pending Approval';
  const [searchTerm, setSearchTerm] = useState('');

  const { data: prfResponse, loading } = useGetRequest(
    `${endpoints.procurement_management.payment_requisitions}?pagination=false`
  );
  const { data: summary = {} } = useGetRequest(
    endpoints.procurement_management.payment_requisition_summary
  );

  const prfs = useMemo(() => toList(prfResponse), [prfResponse]);

  const filteredPRFs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return prfs.filter((prf) => {
      const matchesStatus = effectiveStatusFilter === 'all' || prf.status === effectiveStatusFilter;
      const linkedGrnNumbers = getPRFGrnNumbers(prf);
      const searchable = [
        prf.prf_number,
        prf.supplier_name,
        prf.invoice_number,
        prf.wo_number,
        ...linkedGrnNumbers,
        prf.purpose,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStatus && (!query || searchable.includes(query));
    });
  }, [prfs, searchTerm, effectiveStatusFilter]);

  const scheduleRows = useMemo(() => {
    const actionable = filteredPRFs
      .filter((prf) => prf.status !== 'Rejected')
      .map((prf) => {
        const scheduleDate = prf.tentative_payment_schedule_date || null;
        const dayDiff = getDayDiffFromToday(scheduleDate);
        return {
          ...prf,
          scheduleDate,
          dayDiff,
        };
      });

    return actionable.sort((a, b) => {
      const aDate = toDate(a.scheduleDate);
      const bDate = toDate(b.scheduleDate);
      if (aDate && bDate) return aDate - bDate;
      if (aDate && !bDate) return -1;
      if (!aDate && bDate) return 1;
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    });
  }, [filteredPRFs]);

  const scheduleSummary = useMemo(() => {
    const scheduled = scheduleRows.filter((row) => !!row.scheduleDate);
    const overdue = scheduled.filter((row) => row.dayDiff !== null && row.dayDiff < 0);
    const dueThisWeek = scheduled.filter(
      (row) => row.dayDiff !== null && row.dayDiff >= 0 && row.dayDiff <= 7
    );
    const totalScheduledAmount = scheduled.reduce(
      (sum, row) => sum + (Number(row.total_amount) || 0),
      0
    );

    return {
      total: scheduleRows.length,
      scheduled: scheduled.length,
      overdue: overdue.length,
      dueThisWeek: dueThisWeek.length,
      amount: totalScheduledAmount,
    };
  }, [scheduleRows]);

  const summaryCards = [
    {
      title: 'Total PRFs',
      value: summary.total ?? prfs.length,
      icon: FileText,
      tone: 'text-primary',
    },
    {
      title: 'Pending Approval',
      value: summary.pending ?? prfs.filter((item) => item.status === 'Pending Approval').length,
      icon: Clock,
      tone: 'text-warning',
    },
    {
      title: 'Approved',
      value: summary.approved ?? prfs.filter((item) => item.status === 'Approved').length,
      icon: CheckCircle,
      tone: 'text-success',
    },
    {
      title: 'Rejected',
      value: prfs.filter((item) => item.status === 'Rejected').length,
      icon: XCircle,
      tone: 'text-error',
    },
    {
      title: 'Total Value',
      value: formatBDT(summary.total_amount),
      icon: TrendingUp,
      tone: 'text-primary',
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
            {isScheduleView
              ? 'Payment Schedule'
              : isPendingApprovalsView
                ? 'Pending PRF Approvals'
                : 'Payment Requisition Forms'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isScheduleView
              ? 'Track tentative payment dates, due priorities, and payable amounts.'
              : isPendingApprovalsView
                ? 'Review complete PRF context before approval: linked docs, schedule, allocation, and approval remarks.'
                : 'Review vendor payment requests linked to work orders, GRNs, and invoices.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Link href={paths.dashboard.procurement.paymentRequisitions.create}>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New PRF
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {(isScheduleView
          ? [
              {
                title: 'Schedule Items',
                value: scheduleSummary.total,
                icon: FileText,
                tone: 'text-primary',
              },
              {
                title: 'With Schedule Date',
                value: scheduleSummary.scheduled,
                icon: Clock,
                tone: 'text-primary',
              },
              {
                title: 'Overdue',
                value: scheduleSummary.overdue,
                icon: AlertCircle,
                tone: 'text-error',
              },
              {
                title: 'Due In 7 Days',
                value: scheduleSummary.dueThisWeek,
                icon: CheckCircle,
                tone: 'text-warning',
              },
              {
                title: 'Scheduled Value',
                value: formatBDT(scheduleSummary.amount),
                icon: TrendingUp,
                tone: 'text-primary',
              },
            ]
          : summaryCards
        ).map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{card.title}</p>
                    <p className="text-2xl font-semibold text-foreground">{card.value}</p>
                  </div>
                  <Icon className={`w-5 h-5 ${card.tone}`} />
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <Card className="mb-6">
        <CardHeader
          title={
            isScheduleView
              ? 'Filter Payment Schedule'
              : isPendingApprovalsView
                ? 'Filter Pending Approvals'
                : 'Filter PRFs'
          }
          description={
            isScheduleView
              ? 'Search by PRF, supplier, invoice, work order, or GRN to find scheduled payments'
              : isPendingApprovalsView
                ? 'Search by PRF, supplier, invoice, work order, GRN, or purpose'
                : 'Search by number, supplier, linked document, or purpose'
          }
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={
                  isScheduleView
                    ? 'Search schedule by PRF, supplier, invoice, WO, or GRN'
                    : 'Search PRF, supplier, invoice, WO, or GRN'
                }
                className="w-full pl-10 pr-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={
            isScheduleView
              ? 'Payment Schedule Register'
              : isPendingApprovalsView
                ? 'Pending Approval Queue'
                : 'PRF Register'
          }
          description={
            isScheduleView
              ? `${scheduleRows.length} scheduled payment item${scheduleRows.length === 1 ? '' : 's'} in view`
              : isPendingApprovalsView
                ? `${filteredPRFs.length} PRF${filteredPRFs.length === 1 ? '' : 's'} awaiting decision`
                : `${filteredPRFs.length} requisition${filteredPRFs.length === 1 ? '' : 's'} in view`
          }
        />
        <CardBody>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading payment requisitions...
            </div>
          ) : (isScheduleView ? scheduleRows.length === 0 : filteredPRFs.length === 0) ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {isScheduleView
                ? 'No scheduled payment data matches the current filters.'
                : 'No payment requisitions match the current filters.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  {isScheduleView ? (
                    <tr className="border-b border-border text-left">
                      <th className="py-3 pr-4 font-medium">PRF / Supplier</th>
                      <th className="py-3 pr-4 font-medium">Work Order / GRN</th>
                      <th className="py-3 pr-4 font-medium">Invoice</th>
                      <th className="py-3 pr-4 font-medium">Tentative Payment Date</th>
                      <th className="py-3 pr-4 font-medium">Amount</th>
                      <th className="py-3 pr-4 font-medium">PRF Status</th>
                      <th className="py-3 font-medium text-right">Actions</th>
                    </tr>
                  ) : isPendingApprovalsView ? (
                    <tr className="border-b border-border text-left">
                      <th className="py-3 pr-4 font-medium">PRF / Supplier</th>
                      <th className="py-3 pr-4 font-medium">Associations</th>
                      <th className="py-3 pr-4 font-medium">Financial & Schedule</th>
                      <th className="py-3 pr-4 font-medium">Approval Context</th>
                      <th className="py-3 font-medium text-right">Actions</th>
                    </tr>
                  ) : (
                    <tr className="border-b border-border text-left">
                      <th className="py-3 pr-4 font-medium">PRF</th>
                      <th className="py-3 pr-4 font-medium">Supplier</th>
                      <th className="py-3 pr-4 font-medium">Linked Docs</th>
                      <th className="py-3 pr-4 font-medium">Invoice</th>
                      <th className="py-3 pr-4 font-medium">Amount</th>
                      <th className="py-3 pr-4 font-medium">Status</th>
                      <th className="py-3 font-medium text-right">Actions</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {(isScheduleView ? scheduleRows : filteredPRFs).map((prf) => (
                    <tr key={prf.id} className="border-b border-border/50 align-top">
                      {(() => {
                        const grnNumbers = getPRFGrnNumbers(prf);
                        const scheduleBadge = getScheduleStatusBadge(prf.dayDiff);

                        if (isScheduleView) {
                          return (
                            <>
                              <td className="py-4 pr-4">
                                <p className="font-semibold text-foreground">
                                  {prf.prf_number || 'N/A'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {prf.supplier_name || 'N/A'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Created {formatDate(prf.created_at)}
                                </p>
                              </td>
                              <td className="py-4 pr-4">
                                <p className="text-xs text-muted-foreground">
                                  WO: {prf.wo_number || 'N/A'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  GRNs: {grnNumbers.length > 0 ? grnNumbers.join(', ') : 'N/A'}
                                </p>
                              </td>
                              <td className="py-4 pr-4">
                                <p className="font-medium text-foreground">
                                  {prf.invoice_number || 'N/A'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDate(prf.invoice_date)}
                                </p>
                              </td>
                              <td className="py-4 pr-4">
                                <p className="font-medium text-foreground">
                                  {formatDate(prf.scheduleDate)}
                                </p>
                                <div className="mt-1">
                                  <Badge variant={scheduleBadge.variant}>
                                    {scheduleBadge.label}
                                  </Badge>
                                </div>
                              </td>
                              <td className="py-4 pr-4">
                                <p className="font-semibold text-foreground">
                                  {formatBDT(prf.total_amount)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Tax {formatBDT(prf.tax_amount)}
                                </p>
                              </td>
                              <td className="py-4 pr-4">
                                <Badge variant={getStatusVariant(prf.status)}>
                                  {prf.status || 'Draft'}
                                </Badge>
                              </td>
                              <td className="py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <Link
                                    href={paths.dashboard.procurement.paymentRequisitions.detail(
                                      prf.id
                                    )}
                                  >
                                    <Button variant="outline" size="sm">
                                      <Eye className="w-4 h-4 mr-2" />
                                      View
                                    </Button>
                                  </Link>
                                </div>
                              </td>
                            </>
                          );
                        }

                        if (isPendingApprovalsView) {
                          const dayDiff = getDayDiffFromToday(prf.tentative_payment_schedule_date);
                          const pendingScheduleBadge = getScheduleStatusBadge(dayDiff);

                          return (
                            <>
                              <td className="py-4 pr-4">
                                <p className="font-semibold text-foreground">
                                  {prf.prf_number || 'N/A'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {prf.supplier_name || 'N/A'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Invoice: {prf.invoice_number || 'N/A'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Created {formatDate(prf.created_at)}
                                </p>
                              </td>
                              <td className="py-4 pr-4">
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <p>WO: {prf.wo_number || 'N/A'}</p>
                                  <p>
                                    GRNs: {grnNumbers.length > 0 ? grnNumbers.join(', ') : 'N/A'}
                                  </p>
                                  <p>Dept: {prf.department_name || 'N/A'}</p>
                                  <p>Project: {prf.project_name || 'N/A'}</p>
                                  <p>Items: {prf.item_count || 0}</p>
                                </div>
                              </td>
                              <td className="py-4 pr-4">
                                <p className="font-semibold text-foreground">
                                  {formatBDT(prf.total_amount)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Net {formatBDT(prf.net_amount)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Tax {formatBDT(prf.tax_amount)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Tentative date: {formatDate(prf.tentative_payment_schedule_date)}
                                </p>
                                <div className="mt-1">
                                  <Badge variant={pendingScheduleBadge.variant}>
                                    {pendingScheduleBadge.label}
                                  </Badge>
                                </div>
                              </td>
                              <td className="py-4 pr-4">
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <p>
                                    Current:{' '}
                                    <Badge variant={getStatusVariant(prf.status)}>
                                      {prf.status || 'Draft'}
                                    </Badge>
                                  </p>
                                  <p>Priority: {prf.priority || 'Medium'}</p>
                                  <p>Approver: {prf.approver_name || 'Not assigned yet'}</p>
                                  <p>Approved on: {formatDate(prf.approved_date)}</p>
                                  <p>Finance remarks: {prf.finance_remarks || 'No remarks yet'}</p>
                                </div>
                              </td>
                              <td className="py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <Link
                                    href={paths.dashboard.procurement.paymentRequisitions.detail(
                                      prf.id
                                    )}
                                  >
                                    <Button variant="outline" size="sm">
                                      <Eye className="w-4 h-4 mr-2" />
                                      View
                                    </Button>
                                  </Link>
                                  <Link
                                    href={paths.dashboard.procurement.paymentRequisitions.approve(
                                      prf.id
                                    )}
                                  >
                                    <Button size="sm">
                                      <ArrowRight className="w-4 h-4 mr-2" />
                                      Approve
                                    </Button>
                                  </Link>
                                </div>
                              </td>
                            </>
                          );
                        }

                        return (
                          <>
                            <td className="py-4 pr-4">
                              <p className="font-semibold text-foreground">{prf.prf_number}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {prf.purpose || 'No purpose provided'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Created {formatDate(prf.created_at)}
                              </p>
                            </td>
                            <td className="py-4 pr-4">
                              <p className="font-medium text-foreground">
                                {prf.supplier_name || 'N/A'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {prf.department_name || 'Department not set'}
                              </p>
                            </td>
                            <td className="py-4 pr-4">
                              <div className="space-y-1 text-xs text-muted-foreground">
                                <p>WO: {prf.wo_number || 'N/A'}</p>
                                <div>
                                  <p>
                                    GRNs:{' '}
                                    {grnNumbers.length > 0 ? `${grnNumbers.length} linked` : 'N/A'}
                                  </p>
                                  {grnNumbers.length > 0 ? (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {grnNumbers.slice(0, 3).map((grnNumber) => (
                                        <Badge
                                          key={grnNumber}
                                          variant="outline"
                                          className="text-[10px] px-1.5 py-0.5"
                                        >
                                          {grnNumber}
                                        </Badge>
                                      ))}
                                      {grnNumbers.length > 3 ? (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] px-1.5 py-0.5"
                                        >
                                          +{grnNumbers.length - 3} more
                                        </Badge>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                                <p>Items: {prf.item_count || 0}</p>
                              </div>
                            </td>
                            <td className="py-4 pr-4">
                              <p className="font-medium text-foreground">
                                {prf.invoice_number || 'N/A'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(prf.invoice_date)}
                              </p>
                            </td>
                            <td className="py-4 pr-4">
                              <p className="font-semibold text-foreground">
                                {formatBDT(prf.total_amount)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Net {formatBDT(prf.net_amount)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Tax {formatBDT(prf.tax_amount)}
                              </p>
                            </td>
                            <td className="py-4 pr-4">
                              <div className="flex flex-col gap-2 items-start">
                                <Badge variant={getStatusVariant(prf.status)}>
                                  {prf.status || 'Draft'}
                                </Badge>
                                <Badge variant="outline">{prf.priority || 'Medium'} priority</Badge>
                              </div>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Link
                                  href={paths.dashboard.procurement.paymentRequisitions.detail(
                                    prf.id
                                  )}
                                >
                                  <Button variant="outline" size="sm">
                                    <Eye className="w-4 h-4 mr-2" />
                                    View
                                  </Button>
                                </Link>
                                {isActionableStatus(prf.status) ? (
                                  <Link
                                    href={paths.dashboard.procurement.paymentRequisitions.approve(
                                      prf.id
                                    )}
                                  >
                                    <Button size="sm">
                                      <ArrowRight className="w-4 h-4 mr-2" />
                                      Approve
                                    </Button>
                                  </Link>
                                ) : prf.status === 'Rejected' ? (
                                  <Badge variant="error" className="self-center">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Review required
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="self-center">
                                    <Banknote className="w-3 h-3 mr-1" />
                                    {prf.status || 'Draft'}
                                  </Badge>
                                )}
                              </div>
                            </td>
                          </>
                        );
                      })()}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
