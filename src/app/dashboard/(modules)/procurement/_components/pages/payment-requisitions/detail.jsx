'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  Eye,
  Clock,
  Printer,
  XCircle,
  Download,
  ArrowLeft,
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

const formatDate = (value, withTime = false) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};

const toList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  return [];
};

const numericValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
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

const buildLifecycle = (status) => {
  const stages = [
    {
      title: 'Submitted',
      statuses: ['Submitted', 'Pending Approval', 'Approved', 'Processing', 'Paid'],
    },
    { title: 'Pending Approval', statuses: ['Pending Approval', 'Approved', 'Processing', 'Paid'] },
    { title: 'Approved', statuses: ['Approved', 'Processing', 'Paid'] },
    { title: 'Processing', statuses: ['Processing', 'Paid'] },
    { title: 'Paid', statuses: ['Paid'] },
  ];

  return stages.map((stage) => ({
    ...stage,
    reached: stage.statuses.includes(status),
    current: stage.title === status,
  }));
};

const getPRFGrnNumbers = (prf) => {
  if (Array.isArray(prf?.grn_numbers) && prf.grn_numbers.length > 0) {
    return prf.grn_numbers.filter(Boolean);
  }
  return prf?.grn_number ? [prf.grn_number] : [];
};

export function PRFDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { data: prf, loading } = useGetRequest(
    id ? endpoints.procurement_management.payment_requisition_by_id(id) : null
  );
  const { data: grnResponse } = useGetRequest(
    `${endpoints.procurement_management.grns}?pagination=false`
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        <Card>
          <CardBody>
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading payment requisition...
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!prf?.id) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        <Card>
          <CardBody>
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Payment requisition not found.</p>
              <Link href={paths.dashboard.procurement.paymentRequisitions.list}>
                <Button variant="outline">Back to list</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const lifecycle = buildLifecycle(prf.status);
  const canApprove = ['Submitted', 'Pending Approval'].includes(prf.status);
  const linkedGrnNumbers = getPRFGrnNumbers(prf);
  const linkedGrnIds =
    Array.isArray(prf?.grns) && prf.grns.length > 0 ? prf.grns : prf?.grn ? [prf.grn] : [];
  const allGrns = toList(grnResponse);
  const linkedGrnRecords = allGrns.filter((grn) => linkedGrnIds.includes(grn.id));
  const grnFallbackItems = linkedGrnRecords.flatMap((grn) =>
    (grn?.grn_items || []).map((item) => ({
      source: `GRN ${grn.grn_number || grn.id}`,
      id: item.id,
      payment_requisition: prf?.id,
      item: item.item,
      item_name: item.item_name,
      description: item.remarks || item.item_name || 'GRN line item',
      quantity: item.accepted_quantity || item.received_quantity || 0,
      unit_price: item.unit_price,
      amount: item.total_value,
    }))
  );
  const prfItems =
    Array.isArray(prf?.prf_items) && prf.prf_items.length > 0
      ? prf.prf_items.map((item) => ({ ...item, source: 'PRF Item' }))
      : grnFallbackItems;
  const mergedItemsMap = prfItems.reduce((acc, item) => {
    const displayName = item.item_name || item.description || 'Unnamed item';
    const mergeKey = String(displayName).trim().toLowerCase();
    const existing = acc.get(mergeKey);

    if (!existing) {
      acc.set(mergeKey, {
        mergeKey,
        item_name: item.item_name || displayName,
        description: item.description || item.item_name || 'Payment line',
        quantity: numericValue(item.quantity),
        amount: numericValue(item.amount),
        sources: [item.source || 'PRF Item'],
      });
      return acc;
    }

    existing.quantity += numericValue(item.quantity);
    existing.amount += numericValue(item.amount);
    const sourceLabel = item.source || 'PRF Item';
    if (!existing.sources.includes(sourceLabel)) {
      existing.sources.push(sourceLabel);
    }
    return acc;
  }, new Map());

  const mergedPrfItems = Array.from(mergedItemsMap.values()).map((item) => ({
    ...item,
    unit_price: item.quantity > 0 ? item.amount / item.quantity : 0,
    source: item.sources.length === 1 ? item.sources[0] : 'Merged Sources',
  }));

  const prfItemsTotalQty = mergedPrfItems.reduce(
    (sum, item) => sum + numericValue(item.quantity),
    0
  );
  const prfItemsTotalAmount = mergedPrfItems.reduce(
    (sum, item) => sum + numericValue(item.amount),
    0
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <button
            type="button"
            onClick={() => router.push(paths.dashboard.procurement.paymentRequisitions.list)}
            className="p-2 hover:bg-muted rounded-lg transition-colors self-start"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-1">
              {prf.prf_number}
            </h1>
            <p className="text-muted-foreground text-sm">{prf.purpose || 'No purpose provided'}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canApprove ? (
              <Link href={paths.dashboard.procurement.paymentRequisitions.approve(prf.id)}>
                <Button size="sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Review
                </Button>
              </Link>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            {prf.attachment ? (
              <a href={prf.attachment} target="_blank" rel="noreferrer">
                <Button type="button" variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Attachment
                </Button>
              </a>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant={getStatusVariant(prf.status)}>{prf.status}</Badge>
          <Badge variant="outline">{prf.priority || 'Medium'} priority</Badge>
          <Badge variant="outline">Net {formatBDT(prf.net_amount)}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary bg-primary/5">
            <CardHeader title="Financial Summary" />
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Gross / Total</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatBDT(prf.total_amount)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Tax</p>
                  <p className="text-2xl font-bold text-error">-{formatBDT(prf.tax_amount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Invoice</p>
                  <p className="text-2xl font-bold text-success">{formatBDT(prf.invoice_amount)}</p>
                </div>
                <div className="text-center border-l-2 border-primary">
                  <p className="text-sm text-muted-foreground mb-1">Net Payable</p>
                  <p className="text-3xl font-bold text-primary">{formatBDT(prf.net_amount)}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Supplier Information" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Supplier</p>
                  <p className="font-semibold text-foreground">{prf.supplier_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                  <p className="font-medium text-foreground">{prf.payment_method || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Approver</p>
                  <p className="font-medium text-foreground">
                    {prf.approver_name || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Approved Date</p>
                  <p className="font-medium text-foreground">
                    {formatDate(prf.approved_date, true)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Invoice Details" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Invoice Number</p>
                  <p className="font-semibold text-foreground">{prf.invoice_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Invoice Date</p>
                  <p className="font-medium text-foreground">{formatDate(prf.invoice_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Invoice Amount</p>
                  <p className="font-medium text-foreground">{formatBDT(prf.invoice_amount)}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Budget & Account Allocation" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Budget</p>
                  <p className="font-medium text-foreground">{prf.budget_code_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Account</p>
                  <p className="font-medium text-foreground">{prf.account_code_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Project</p>
                  <p className="font-medium text-foreground">{prf.project_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Department</p>
                  <p className="font-medium text-foreground">{prf.department_name || 'N/A'}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {prf.remarks ? (
            <Card>
              <CardHeader title="Remarks" />
              <CardBody>
                <p className="text-sm text-foreground whitespace-pre-line">{prf.remarks}</p>
              </CardBody>
            </Card>
          ) : null}

          {prf.finance_remarks ? (
            <Card>
              <CardHeader title="Finance Remarks" />
              <CardBody>
                <p className="text-sm text-foreground whitespace-pre-line">{prf.finance_remarks}</p>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader
              title="PRF Items"
              description={
                Array.isArray(prf?.prf_items) && prf.prf_items.length > 0
                  ? `${prf.item_count || 0} line item(s)`
                  : mergedPrfItems.length > 0
                    ? `${mergedPrfItems.length} line item(s) from linked GRN data`
                    : `${prf.item_count || 0} line item(s)`
              }
            />
            <CardBody>
              {mergedPrfItems.length ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">Merged Lines</p>
                      <p className="text-lg font-semibold text-foreground">
                        {mergedPrfItems.length}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">Total Quantity</p>
                      <p className="text-lg font-semibold text-foreground">{prfItemsTotalQty}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-primary/5 p-3">
                      <p className="text-xs text-muted-foreground">Items Amount Total</p>
                      <p className="text-lg font-semibold text-primary">
                        {formatBDT(prfItemsTotalAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[760px]">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="py-2 pr-4">Source</th>
                          <th className="py-2 pr-4">Item Name</th>
                          <th className="py-2 pr-4">Description</th>
                          <th className="py-2 pr-4">Qty</th>
                          <th className="py-2 pr-4">Avg Unit Price</th>
                          <th className="py-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mergedPrfItems.map((item) => (
                          <tr key={item.mergeKey} className="border-b border-border/50 align-top">
                            <td className="py-3 pr-4">
                              <Badge variant="outline" className="text-[11px]">
                                {item.source || 'PRF Item'}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {item.item_name || 'N/A'}
                            </td>
                            <td className="py-3 pr-4">
                              <p className="font-medium text-foreground">
                                {item.description || item.item_name || 'Payment line'}
                              </p>
                            </td>
                            <td className="py-3 pr-4 text-foreground">
                              {numericValue(item.quantity)}
                            </td>
                            <td className="py-3 pr-4 text-foreground">
                              {formatBDT(item.unit_price)}
                            </td>
                            <td className="py-3 font-medium text-foreground">
                              {formatBDT(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No item breakdown has been added to this payment requisition.
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Linked Records" />
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Work Order</span>
                  {prf.work_order ? (
                    <Link
                      href={paths.dashboard.procurement.workOrders.detail(prf.work_order)}
                      className="font-medium text-primary hover:underline"
                    >
                      {prf.wo_number || prf.work_order_number}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">N/A</span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Linked GRNs</span>
                  {linkedGrnNumbers.length > 0 ? (
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline">{linkedGrnNumbers.length} linked</Badge>
                      <div className="flex flex-wrap justify-end gap-1 max-w-[240px]">
                        {linkedGrnNumbers.map((grnNumber, index) => {
                          const grnId = linkedGrnIds[index];

                          if (!grnId) {
                            return (
                              <Badge
                                key={`${grnNumber}-${index}`}
                                variant="outline"
                                className="text-[11px]"
                              >
                                {grnNumber}
                              </Badge>
                            );
                          }

                          return (
                            <Link
                              key={`${grnNumber}-${grnId}`}
                              href={paths.dashboard.procurement.grn.detail(grnId)}
                              className="inline-flex"
                            >
                              <Badge
                                variant="outline"
                                className="text-[11px] hover:border-primary hover:text-primary"
                              >
                                {grnNumber}
                              </Badge>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <span className="font-medium text-foreground">N/A</span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium text-foreground">
                    {formatDate(prf.created_at, true)}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Updated</span>
                  <span className="font-medium text-foreground">
                    {formatDate(prf.updated_at, true)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Approval Lifecycle" description="Derived from the live PRF status" />
            <CardBody>
              <div className="space-y-3">
                {lifecycle.map((step) => (
                  <div
                    key={step.title}
                    className={`p-3 border rounded-lg ${
                      step.current
                        ? 'border-warning bg-warning/5'
                        : step.reached
                          ? 'border-success bg-success/5'
                          : 'border-border bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {step.current ? (
                          <Clock className="w-4 h-4 text-warning" />
                        ) : step.reached ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : prf.status === 'Rejected' && step.title !== 'Submitted' ? (
                          <XCircle className="w-4 h-4 text-error" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                        <p className="font-medium text-foreground">{step.title}</p>
                      </div>
                      <Badge
                        variant={step.current ? 'warning' : step.reached ? 'success' : 'outline'}
                      >
                        {step.current ? 'Current' : step.reached ? 'Done' : 'Waiting'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {prf.status === 'Rejected' ? (
                  <div className="p-3 border border-error bg-error/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-error" />
                      <p className="font-medium text-foreground">Rejected</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {prf.finance_remarks || prf.remarks || 'No rejection reason recorded.'}
                    </p>
                  </div>
                ) : null}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Quick Summary" />
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={getStatusVariant(prf.status)}>{prf.status}</Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Priority</span>
                  <span className="font-medium text-foreground">{prf.priority || 'Medium'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium text-foreground">{prf.item_count || 0}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium text-foreground">{prf.payment_method || 'N/A'}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
