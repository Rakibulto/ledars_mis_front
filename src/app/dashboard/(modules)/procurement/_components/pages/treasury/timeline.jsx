'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Eye,
  Send,
  Clock,
  Search,
  XCircle,
  FileText,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

const toList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  return [];
};

const safeTime = (value) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const asNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getStageConfig = (stage) => {
  switch (stage) {
    case 'PRF Submitted':
      return { icon: FileText, iconClass: 'text-muted-foreground bg-muted/40 border-border' };
    case 'Finance Review':
      return { icon: Search, iconClass: 'text-primary bg-primary/10 border-primary/20' };
    case 'Budget Verified':
    case 'Approved for Payment':
      return { icon: CheckCircle, iconClass: 'text-success bg-success/10 border-success/20' };
    case 'Payment Scheduled':
    case 'On Hold':
      return { icon: Clock, iconClass: 'text-warning bg-warning/10 border-warning/20' };
    case 'Payment Processed':
      return { icon: Send, iconClass: 'text-primary bg-primary/10 border-primary/20' };
    case 'Payment Completed':
      return { icon: DollarSign, iconClass: 'text-success bg-success/10 border-success/20' };
    case 'Payment Failed':
    case 'Payment Reversed':
    case 'Rejected':
      return { icon: XCircle, iconClass: 'text-error bg-error/10 border-error/20' };
    default:
      return { icon: AlertCircle, iconClass: 'text-muted-foreground bg-muted/40 border-border' };
  }
};

const getPaymentRecordStage = (record) => {
  switch (record.status) {
    case 'Completed':
      return 'Payment Completed';
    case 'Processed':
      return 'Payment Processed';
    case 'Failed':
      return 'Payment Failed';
    case 'Reversed':
      return 'Payment Reversed';
    default:
      return 'Payment Scheduled';
  }
};

const getPaymentRecordRemarks = (record) => {
  const details = [
    record.reference_number ? `Ref: ${record.reference_number}` : '',
    record.payment_method ? `Method: ${record.payment_method}` : '',
    record.amount ? `Amount: ${formatBDT(record.amount)}` : '',
    record.bank_name ? `Bank: ${record.bank_name}` : '',
    record.remarks || '',
  ].filter(Boolean);

  return details.join(' | ');
};

const resolveTreasuryStatus = (prf, treasury, paymentRecords, settledAmount) => {
  const targetAmount =
    asNumber(treasury?.approved_amount) || asNumber(prf?.net_amount) || asNumber(prf?.total_amount);

  if (
    treasury?.status === 'Rejected' ||
    prf?.status === 'Rejected' ||
    paymentRecords.some((record) => ['Failed', 'Reversed'].includes(record.status))
  ) {
    return 'returned';
  }

  if (treasury?.status === 'On Hold' || prf?.status === 'Pending Approval') {
    return 'on-hold';
  }

  if (settledAmount > 0 && targetAmount > 0 && settledAmount < targetAmount) {
    return 'partially-paid';
  }

  if (
    prf?.status === 'Paid' ||
    treasury?.status === 'Payment Processed' ||
    paymentRecords.some((record) => record.status === 'Completed') ||
    (settledAmount > 0 && targetAmount > 0 && settledAmount >= targetAmount)
  ) {
    return 'paid';
  }

  return 'sent-to-treasury';
};

const buildTimelineEntries = (prf, treasury, paymentRecords, paymentTimelines) => {
  const actualEntries = paymentTimelines
    .map((entry) => ({
      id: `timeline-${entry.id}`,
      stage: entry.stage,
      timestamp: entry.timestamp,
      remarks: entry.remarks,
      actor: entry.performed_by_name || 'System',
    }))
    .filter((entry) => entry.timestamp)
    .sort((left, right) => safeTime(left.timestamp) - safeTime(right.timestamp));

  const actualStages = new Set(actualEntries.map((entry) => entry.stage));
  const derivedEntries = [];

  const pushDerived = (entry, options = {}) => {
    const { allowSameStage = false } = options;

    if (!entry?.timestamp) return;
    if (!allowSameStage && actualStages.has(entry.stage)) return;

    const duplicate = derivedEntries.some(
      (item) => item.stage === entry.stage && safeTime(item.timestamp) === safeTime(entry.timestamp)
    );

    if (!duplicate) {
      derivedEntries.push(entry);
    }
  };

  pushDerived({
    id: `prf-${prf.id}-submitted`,
    stage: 'PRF Submitted',
    timestamp: prf.created_at,
    remarks: prf.remarks || 'Payment requisition submitted for treasury processing.',
    actor: 'Requester',
  });

  pushDerived({
    id: `prf-${prf.id}-approved`,
    stage: 'Approved for Payment',
    timestamp: treasury?.approved_date || prf.approved_date,
    remarks: treasury?.finance_remarks || 'Approved for treasury handling.',
    actor: treasury?.approved_by_name || prf.approver_name || 'Approver',
  });

  if (treasury?.reviewed_date) {
    pushDerived({
      id: `treasury-${treasury.id}-review`,
      stage: 'Finance Review',
      timestamp: treasury.reviewed_date,
      remarks: treasury.budget_remarks || treasury.finance_remarks || 'Treasury review logged.',
      actor: treasury.reviewed_by_name || 'Treasury',
    });
  }

  if (treasury?.budget_verified) {
    pushDerived({
      id: `treasury-${treasury.id}-budget`,
      stage: 'Budget Verified',
      timestamp: treasury.reviewed_date || treasury.updated_at,
      remarks: treasury.budget_remarks || 'Budget verified for payment release.',
      actor: treasury.reviewed_by_name || 'Treasury',
    });
  }

  if (treasury?.payment_scheduled_date) {
    pushDerived({
      id: `treasury-${treasury.id}-scheduled`,
      stage: 'Payment Scheduled',
      timestamp: treasury.payment_scheduled_date,
      remarks: treasury.payment_method
        ? `Payment scheduled via ${treasury.payment_method}.`
        : 'Payment scheduled by treasury.',
      actor: treasury.approved_by_name || 'Treasury',
    });
  }

  paymentRecords
    .slice()
    .sort(
      (left, right) =>
        safeTime(left.payment_date || left.updated_at || left.created_at) -
        safeTime(right.payment_date || right.updated_at || right.created_at)
    )
    .forEach((record) => {
      pushDerived(
        {
          id: `payment-${record.id}`,
          stage: getPaymentRecordStage(record),
          timestamp: record.payment_date || record.updated_at || record.created_at,
          remarks: getPaymentRecordRemarks(record),
          actor: record.processed_by_name || 'Treasury',
        },
        { allowSameStage: true }
      );
    });

  if (treasury?.status === 'On Hold' || prf.status === 'Pending Approval') {
    pushDerived({
      id: `prf-${prf.id}-hold`,
      stage: 'On Hold',
      timestamp: treasury?.updated_at || prf.updated_at,
      remarks: treasury?.finance_remarks || prf.finance_remarks || 'Payment is currently on hold.',
      actor: treasury?.reviewed_by_name || 'Treasury',
    });
  }

  if (treasury?.status === 'Rejected' || prf.status === 'Rejected') {
    pushDerived({
      id: `prf-${prf.id}-rejected`,
      stage: 'Rejected',
      timestamp: treasury?.updated_at || prf.updated_at,
      remarks:
        treasury?.finance_remarks ||
        prf.finance_remarks ||
        'Payment requisition returned or rejected.',
      actor: treasury?.approved_by_name || 'Treasury',
    });
  }

  if (prf.status === 'Paid' && paymentRecords.length === 0) {
    pushDerived({
      id: `prf-${prf.id}-paid`,
      stage: 'Payment Completed',
      timestamp: prf.updated_at || treasury?.updated_at || prf.approved_date,
      remarks: prf.finance_remarks || 'Payment marked as paid from requisition workflow.',
      actor: 'Treasury',
    });
  }

  return [...actualEntries, ...derivedEntries].sort(
    (left, right) => safeTime(left.timestamp) - safeTime(right.timestamp)
  );
};

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

const getStatusConfig = (status) => {
  switch (status) {
    case 'paid':
      return { color: 'success', label: 'Paid', icon: CheckCircle, cardClass: 'border-l-success' };
    case 'partially-paid':
      return {
        color: 'warning',
        label: 'Partially Paid',
        icon: DollarSign,
        cardClass: 'border-l-warning',
      };
    case 'sent-to-treasury':
      return {
        color: 'default',
        label: 'Sent to Treasury',
        icon: Send,
        cardClass: 'border-l-primary',
      };
    case 'on-hold':
      return { color: 'warning', label: 'On Hold', icon: Clock, cardClass: 'border-l-warning' };
    case 'returned':
      return { color: 'error', label: 'Returned', icon: XCircle, cardClass: 'border-l-error' };
    default:
      return { color: 'default', label: status, icon: AlertCircle, cardClass: 'border-l-border' };
  }
};

export function PaymentStatusTimeline() {
  const params = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const selectedId = Number(params?.id);
  const selectedPaymentId = Number.isFinite(selectedId) ? selectedId : null;

  const {
    data: prfResponse,
    loading: prfLoading,
    error: prfError,
  } = useGetRequest(`${endpoints.procurement_management.payment_requisitions}?pagination=false`);

  const { data: treasuryResponse, loading: treasuryLoading } = useGetRequest(
    `${endpoints.procurement_management.treasury}?pagination=false`
  );

  const { data: paymentRecordResponse, loading: paymentRecordLoading } = useGetRequest(
    `${endpoints.procurement_management.payment_records}?pagination=false`
  );

  const { data: paymentTimelineResponse, loading: paymentTimelineLoading } = useGetRequest(
    `${endpoints.procurement_management.payment_timelines}?pagination=false`
  );

  const rows = useMemo(() => {
    const prfs = toList(prfResponse);
    const treasuryRows = toList(treasuryResponse);
    const paymentRecords = toList(paymentRecordResponse);
    const paymentTimelines = toList(paymentTimelineResponse);

    const prfById = new Map(prfs.map((prf) => [prf.id, prf]));

    const treasuryByPrfId = treasuryRows.reduce((collection, row) => {
      const prfId = Number(row.payment_requisition);
      if (!Number.isFinite(prfId)) return collection;

      const current = collection.get(prfId);
      if (
        !current ||
        safeTime(row.updated_at || row.approved_date || row.created_at) >
          safeTime(current.updated_at || current.approved_date || current.created_at)
      ) {
        collection.set(prfId, row);
      }

      return collection;
    }, new Map());

    const treasuryById = new Map(treasuryRows.map((row) => [row.id, row]));

    const paymentRecordsByPrfId = paymentRecords.reduce((collection, row) => {
      const treasury = treasuryById.get(row.treasury_processing);
      const prfId = Number(treasury?.payment_requisition);
      if (!Number.isFinite(prfId)) return collection;

      const list = collection.get(prfId) || [];
      list.push(row);
      collection.set(prfId, list);
      return collection;
    }, new Map());

    const paymentTimelinesByPrfId = paymentTimelines.reduce((collection, row) => {
      const prfId = Number(row.payment_requisition);
      if (!Number.isFinite(prfId)) return collection;

      const list = collection.get(prfId) || [];
      list.push(row);
      collection.set(prfId, list);
      return collection;
    }, new Map());

    const relevantIds = new Set();
    prfs.forEach((prf) => {
      if (['Approved', 'Processing', 'Paid', 'Pending Approval', 'Rejected'].includes(prf.status)) {
        relevantIds.add(prf.id);
      }
    });
    treasuryRows.forEach((row) => relevantIds.add(Number(row.payment_requisition)));
    paymentTimelines.forEach((row) => relevantIds.add(Number(row.payment_requisition)));
    paymentRecords.forEach((row) => {
      const treasury = treasuryById.get(row.treasury_processing);
      if (treasury?.payment_requisition) {
        relevantIds.add(Number(treasury.payment_requisition));
      }
    });

    return Array.from(relevantIds)
      .filter((id) => Number.isFinite(id) && prfById.has(id))
      .map((id) => {
        const prf = prfById.get(id);
        const treasury = treasuryByPrfId.get(id);
        const records = (paymentRecordsByPrfId.get(id) || [])
          .slice()
          .sort(
            (left, right) =>
              safeTime(right.payment_date || right.updated_at || right.created_at) -
              safeTime(left.payment_date || left.updated_at || left.created_at)
          );
        const timelineEntries = buildTimelineEntries(
          prf,
          treasury,
          records,
          paymentTimelinesByPrfId.get(id) || []
        );
        const settledAmount =
          records.reduce((sum, record) => {
            if (['Processed', 'Completed'].includes(record.status)) {
              return sum + asNumber(record.amount);
            }
            return sum;
          }, 0) || (prf.status === 'Paid' ? asNumber(prf.net_amount) : 0);

        const latestTimelineEntry = timelineEntries[timelineEntries.length - 1] || null;
        const latestPaymentRecord = records[0] || null;

        return {
          id: prf.id,
          prfNumber: prf.prf_number || `PRF-${prf.id}`,
          vendor: prf.supplier_name || 'N/A',
          netPayable: asNumber(treasury?.approved_amount) || asNumber(prf.net_amount),
          grossAmount: asNumber(prf.total_amount),
          settledAmount,
          status: resolveTreasuryStatus(prf, treasury, records, settledAmount),
          createdDate: prf.created_at,
          approvedDate: treasury?.approved_date || prf.approved_date,
          scheduledDate: treasury?.payment_scheduled_date || prf.tentative_payment_schedule_date,
          paymentDate:
            latestPaymentRecord?.payment_date ||
            (prf.status === 'Paid' ? prf.updated_at || prf.approved_date : null),
          paymentMethod:
            latestPaymentRecord?.payment_method ||
            treasury?.payment_method ||
            prf.payment_method ||
            'N/A',
          bankReference:
            latestPaymentRecord?.reference_number ||
            prf.finance_remarks ||
            treasury?.finance_remarks ||
            'N/A',
          woNumber: prf.wo_number || 'N/A',
          items: Array.isArray(prf.prf_items) ? prf.prf_items : [],
          treasuryStatus: treasury?.status || 'Pending Review',
          treasuryNumber: treasury?.processing_number || null,
          timelineEntries,
          latestTimelineEntry,
          lastUpdated:
            latestTimelineEntry?.timestamp ||
            treasury?.updated_at ||
            prf.updated_at ||
            prf.created_at,
        };
      })
      .sort((left, right) => safeTime(right.lastUpdated) - safeTime(left.lastUpdated));
  }, [paymentRecordResponse, paymentTimelineResponse, prfResponse, treasuryResponse]);

  const loading = prfLoading || treasuryLoading || paymentRecordLoading || paymentTimelineLoading;

  const filteredPayments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return rows.filter((payment) => {
      const matchesSearch =
        payment.prfNumber.toLowerCase().includes(query) ||
        payment.vendor.toLowerCase().includes(query) ||
        payment.woNumber.toLowerCase().includes(query) ||
        (payment.treasuryNumber || '').toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      const matchesRoute = !selectedPaymentId || payment.id === selectedPaymentId;
      return matchesSearch && matchesStatus && matchesRoute;
    });
  }, [rows, searchQuery, selectedPaymentId, statusFilter]);

  const paid = rows.filter((p) => p.status === 'paid').length;
  const partiallyPaid = rows.filter((p) => p.status === 'partially-paid').length;
  const sentToTreasury = rows.filter((p) => p.status === 'sent-to-treasury').length;
  const onHold = rows.filter((p) => p.status === 'on-hold').length;
  const totalPaid = rows.reduce((sum, payment) => sum + payment.settledAmount, 0);
  const selectedPayment = selectedPaymentId ? filteredPayments[0] : null;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        {selectedPayment ? (
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Link
                href={paths.dashboard.procurement.treasury.timeline}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to timeline list
              </Link>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
                Payment Status Timeline - {selectedPayment.prfNumber}
              </h1>
              <p className="text-muted-foreground">
                Full treasury journey for {selectedPayment.vendor}.
              </p>
            </div>
            <Link href={paths.dashboard.procurement.paymentRequisitions.detail(selectedPayment.id)}>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Open PRF
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
              Payment Status Timeline
            </h1>
            <p className="text-muted-foreground">
              Track payment progress across PRFs, treasury processing, and settlement updates.
            </p>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 mb-6">
        <Card className="border-l-4 border-l-success">
          <CardBody>
            <div className="text-center">
              <CheckCircle className="w-6 h-6 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-success">{paid}</p>
              <p className="text-xs text-muted-foreground">Paid</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardBody>
            <div className="text-center">
              <DollarSign className="w-6 h-6 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold text-warning">{partiallyPaid}</p>
              <p className="text-xs text-muted-foreground">Partial</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardBody>
            <div className="text-center">
              <Send className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{sentToTreasury}</p>
              <p className="text-xs text-muted-foreground">In Treasury</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardBody>
            <div className="text-center">
              <Clock className="w-6 h-6 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold text-warning">{onHold}</p>
              <p className="text-xs text-muted-foreground">On Hold</p>
            </div>
          </CardBody>
        </Card>

        <Card className="col-span-2 border-l-4 border-l-success">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-success">{formatBDT(totalPaid)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by PRF, vendor, treasury no., or work order..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="partially-paid">Partially Paid</option>
              <option value="sent-to-treasury">Sent to Treasury</option>
              <option value="on-hold">On Hold</option>
              <option value="returned">Returned</option>
            </select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={`Payment Status Timeline (${filteredPayments.length})`}
          description="Composed from PRFs, treasury processing, payment records, and timeline events"
        />
        <CardBody>
          {prfError ? (
            <div className="py-10 text-center text-sm text-error">
              Unable to load payment requisitions for the treasury timeline.
            </div>
          ) : null}
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading payment statuses...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No payment status records found.
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPayments.map((payment) => {
                const statusConfig = getStatusConfig(payment.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <div key={payment.id} className="relative">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center border-2 border-border">
                          <StatusIcon className="w-6 h-6 text-foreground" />
                        </div>
                        <div className="w-0.5 h-full bg-border mt-2" />
                      </div>

                      <div className="flex-1 pb-6">
                        <Card className={`border-l-4 ${statusConfig.cardClass}`}>
                          <CardBody>
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-foreground">
                                    {payment.prfNumber}
                                  </h3>
                                  <Badge variant={statusConfig.color}>{statusConfig.label}</Badge>
                                  {payment.treasuryNumber ? (
                                    <Badge variant="outline">{payment.treasuryNumber}</Badge>
                                  ) : null}
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  Vendor:{' '}
                                  <span className="font-medium text-foreground">
                                    {payment.vendor}
                                  </span>
                                </p>
                                <p className="text-lg font-bold text-primary">
                                  {formatBDT(payment.netPayable)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Treasury status:{' '}
                                  <span className="font-medium text-foreground">
                                    {payment.treasuryStatus}
                                  </span>
                                </p>
                              </div>
                              <div className="flex gap-2 flex-wrap justify-end">
                                {!selectedPaymentId ? (
                                  <Link
                                    href={paths.dashboard.procurement.treasury.timelineDetail(
                                      payment.id
                                    )}
                                  >
                                    <Button variant="outline" size="sm">
                                      <Eye className="w-4 h-4 mr-2" />
                                      Timeline
                                    </Button>
                                  </Link>
                                ) : null}
                                <Link
                                  href={paths.dashboard.procurement.paymentRequisitions.detail(
                                    payment.id
                                  )}
                                >
                                  <Button variant="outline" size="sm">
                                    <Eye className="w-4 h-4 mr-2" />
                                    View PRF
                                  </Button>
                                </Link>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 text-sm mb-4">
                              <div className="rounded-lg border border-border bg-muted/10 p-3">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">
                                  Work Order
                                </p>
                                <p className="font-medium text-foreground">{payment.woNumber}</p>
                              </div>
                              <div className="rounded-lg border border-border bg-muted/10 p-3">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">
                                  Scheduled
                                </p>
                                <p className="font-medium text-foreground">
                                  {formatDate(payment.scheduledDate)}
                                </p>
                              </div>
                              <div className="rounded-lg border border-border bg-muted/10 p-3">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">
                                  Settled
                                </p>
                                <p className="font-medium text-foreground">
                                  {formatBDT(payment.settledAmount)}
                                </p>
                              </div>
                              <div className="rounded-lg border border-border bg-muted/10 p-3">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">
                                  Payment Method
                                </p>
                                <p className="font-medium text-foreground">
                                  {payment.paymentMethod}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2 text-sm mb-4">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <CheckCircle className="w-4 h-4 text-success" />
                                <span>Created: {formatDate(payment.createdDate)}</span>
                              </div>
                              {payment.approvedDate ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <CheckCircle className="w-4 h-4 text-success" />
                                  <span>Approved: {formatDate(payment.approvedDate)}</span>
                                </div>
                              ) : null}
                              {payment.sentToTreasuryDate ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Send className="w-4 h-4 text-primary" />
                                  <span>
                                    Sent to Treasury: {formatDate(payment.sentToTreasuryDate)}
                                  </span>
                                </div>
                              ) : null}
                              {payment.paymentDate ? (
                                <div className="flex items-center gap-2 text-success">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="font-medium">
                                    Paid: {formatDate(payment.paymentDate)} |{' '}
                                    {payment.paymentMethod}
                                  </span>
                                </div>
                              ) : null}
                            </div>

                            <div className="mt-4 p-3 border border-border rounded-lg bg-muted/20">
                              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                                <p className="text-xs font-semibold text-muted-foreground">
                                  Timeline Events
                                </p>
                                {payment.latestTimelineEntry ? (
                                  <p className="text-xs text-muted-foreground">
                                    Latest: {payment.latestTimelineEntry.stage} on{' '}
                                    {formatDateTime(payment.latestTimelineEntry.timestamp)}
                                  </p>
                                ) : null}
                              </div>
                              {payment.timelineEntries.length > 0 ? (
                                <div className="space-y-3">
                                  {(selectedPaymentId
                                    ? payment.timelineEntries
                                    : payment.timelineEntries.slice(-4)
                                  ).map((entry, index, entryList) => {
                                    const stageConfig = getStageConfig(entry.stage);
                                    const StageIcon = stageConfig.icon;
                                    return (
                                      <div key={entry.id} className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                          <div
                                            className={`flex h-8 w-8 items-center justify-center rounded-full border ${stageConfig.iconClass}`}
                                          >
                                            <StageIcon className="w-4 h-4" />
                                          </div>
                                          {index < entryList.length - 1 ? (
                                            <div className="mt-2 h-full w-px bg-border" />
                                          ) : null}
                                        </div>
                                        <div className="flex-1 pb-2">
                                          <div className="flex items-start justify-between gap-3 flex-wrap">
                                            <p className="text-sm font-semibold text-foreground">
                                              {entry.stage}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {formatDateTime(entry.timestamp)}
                                            </p>
                                          </div>
                                          {entry.remarks ? (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {entry.remarks}
                                            </p>
                                          ) : null}
                                          {entry.actor ? (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              By: {entry.actor}
                                            </p>
                                          ) : null}
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {!selectedPaymentId && payment.timelineEntries.length > 4 ? (
                                    <div className="pt-1">
                                      <Link
                                        href={paths.dashboard.procurement.treasury.timelineDetail(
                                          payment.id
                                        )}
                                      >
                                        <Button variant="outline" size="sm">
                                          Show full timeline
                                        </Button>
                                      </Link>
                                    </div>
                                  ) : null}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  No timeline events available yet.
                                </p>
                              )}
                            </div>

                            <div className="mt-4 p-3 border border-border rounded-lg bg-muted/20">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">
                                Individual Items
                              </p>
                              {payment.items.length > 0 ? (
                                <div className="space-y-2">
                                  {payment.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-start justify-between gap-3 text-xs"
                                    >
                                      <div>
                                        <p className="font-medium text-foreground">
                                          {item.description || item.item_name || 'PRF line item'}
                                        </p>
                                        <p className="text-muted-foreground">
                                          Qty: {Number(item.quantity) || 0} x{' '}
                                          {formatBDT(item.unit_price)}
                                        </p>
                                      </div>
                                      <p className="font-semibold text-foreground">
                                        {formatBDT(item.amount)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  No individual items found for this PRF.
                                </p>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
