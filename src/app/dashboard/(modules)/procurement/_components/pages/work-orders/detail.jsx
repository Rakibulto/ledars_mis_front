'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Eye,
  Zap,
  Bell,
  Mail,
  Send,
  User,
  Clock,
  Phone,
  MapPin,
  Package,
  Printer,
  XCircle,
  Calendar,
  Download,
  FileText,
  ArrowLeft,
  Paperclip,
  CheckCircle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest, extractErrorMessage } from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { downloadFileFromEndpoint } from './export-utils';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

function formatBDT(amount) {
  const value = Number(amount) || 0;
  if (value >= 10000000) return `৳${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `৳${(value / 100000).toFixed(2)} Lakh`;
  return `৳${value.toLocaleString('en-IN')}`;
}

const getStatusColor = (status) => {
  if (!status) return 'default';
  const normalized = status.toLowerCase().replace(/[\s_]+/g, '-');
  if (normalized === 'approved' || normalized === 'fully-approved') return 'success';
  if (normalized === 'pending-approval' || normalized === 'pending-committee') {
    return 'warning';
  }
  if (normalized === 'draft') return 'default';
  if (normalized === 'rejected' || normalized === 'cancelled') return 'error';
  if (normalized === 'in-progress') return 'info';
  return 'default';
};

const normalizeApprovalStatus = (status) => (status || '').toLowerCase().replace(/[\s_]+/g, '-');

const getDeliveryItemStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'partial':
      return 'warning';
    case 'pending':
      return 'default';
    default:
      return 'default';
  }
};

export function WorkOrderDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [sendingToVendor, setSendingToVendor] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocuments, setDownloadingDocuments] = useState(false);
  const { data: workOrder, loading } = useGetRequest(
    id ? endpoints.procurement_management.work_order_by_id(id) : null
  );

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-64">
        <p className="text-muted-foreground">Loading work order details...</p>
      </div>
    );
  }

  if (!workOrder || Array.isArray(workOrder)) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-64">
        <p className="text-muted-foreground">Work order not found.</p>
      </div>
    );
  }

  const wo = workOrder;
  const displayId = wo.workOrderNumber || wo.id;
  const items = wo.items || [];
  const approvalChain = wo.approvalChain || [];
  const notificationLog = wo.notificationLog || [];
  const attachments = wo.attachments || [];
  const isDirectEvaluation = !!wo.vendor?.is_direct_evaluation;
  const totalAmount = Number(wo.totalAmount) || 0;
  const amountPaid = Number(wo.amountPaid) || 0;
  const itemsCount = items.length;
  const totalItems =
    Number(wo.totalItems) ||
    itemsCount ||
    items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const deliveredItems = Number(wo.deliveredItems) || 0;
  const deliveryProgress = totalItems > 0 ? Math.min(100, (deliveredItems / totalItems) * 100) : 0;
  const paymentProgress = totalAmount > 0 ? Math.min(100, (amountPaid / totalAmount) * 100) : 0;
  const vendorHasResponded = ['accepted', 'rejected'].includes(wo.vendorStatus);
  const normalizedApprovalStatus = normalizeApprovalStatus(wo.approvalStatus);
  const canSendToVendor =
    normalizedApprovalStatus === 'fully-approved' &&
    !vendorHasResponded &&
    !['Cancelled', 'Completed'].includes(wo.status);
  const sendLabel = vendorHasResponded
    ? 'Vendor Responded'
    : normalizedApprovalStatus !== 'fully-approved'
      ? 'Awaiting Approval'
      : wo.notificationSent || wo.vendorStatus === 'sent' || wo.status === 'Sent to Vendor'
        ? 'Resend to Vendor'
        : 'Send to Vendor';

  const handleDownloadPdf = async () => {
    if (!id) return;

    try {
      setDownloadingPdf(true);
      await downloadFileFromEndpoint(
        endpoints.procurement_management.work_order_download_pdf(id),
        `${displayId}.pdf`
      );
      toast.success('Work order PDF downloaded.');
    } catch (error) {
      toast.error(extractErrorMessage(error?.response?.data || error));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadDocuments = async () => {
    if (!id) return;

    try {
      setDownloadingDocuments(true);
      await downloadFileFromEndpoint(
        endpoints.procurement_management.work_order_download_documents(id),
        `${displayId}.zip`
      );
      toast.success('Work order export bundle downloaded.');
    } catch (error) {
      toast.error(extractErrorMessage(error?.response?.data || error));
    } finally {
      setDownloadingDocuments(false);
    }
  };

  const handleSendToVendor = async () => {
    if (!id || !canSendToVendor) return;

    try {
      setSendingToVendor(true);
      await axiosInstance.post(endpoints.procurement_management.work_order_send_to_vendor(id));

      await Promise.all([
        mutate(endpoints.procurement_management.work_order_by_id(id)),
        mutate(endpoints.procurement_management.work_order_summary),
        mutate(
          (key) =>
            typeof key === 'string' && key.includes(endpoints.procurement_management.work_orders)
        ),
      ]);

      toast.success(
        sendLabel === 'Resend to Vendor'
          ? 'Vendor notification resent.'
          : 'Work order sent to vendor.'
      );
    } catch (error) {
      toast.error(extractErrorMessage(error?.response?.data || error));
    } finally {
      setSendingToVendor(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          <button
            type="button"
            onClick={() => router.push(paths.dashboard.procurement.workOrders.list)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-foreground mb-1">{displayId}</h1>
              {wo.autoGenerated && (
                <Badge variant="info">
                  <Zap className="w-3 h-3 mr-1" />
                  Auto-Generated{wo.csNumber ? ` from ${wo.csNumber}` : ''}
                </Badge>
              )}
              {isDirectEvaluation && <Badge variant="secondary">Direct Evaluation</Badge>}
            </div>
            {wo.title && <p className="text-muted-foreground">{wo.title}</p>}
            {isDirectEvaluation && (
              <p className="text-sm text-warning mt-2">
                This work order was created from a direct supplier quote instead of the normal
                vendor portal process, so the vendor information is taken from that quote.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={paths.dashboard.procurement.workOrders.print(id)}>
              <Button size="sm" variant="outline">
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download PDF
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleSendToVendor}
              disabled={!canSendToVendor || sendingToVendor}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {sendLabel}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {wo.status && (
            <Badge variant={getStatusColor(wo.approvalStatus || wo.status)}>{wo.status}</Badge>
          )}
          {wo.vendorStatus && (
            <Badge variant={wo.vendorStatus === 'accepted' ? 'success' : 'warning'}>
              Vendor: {wo.vendorStatus}
            </Badge>
          )}
          {wo.deliveryStatus && (
            <Badge variant={wo.deliveryStatus === 'in-progress' ? 'warning' : 'default'}>
              Delivery: {wo.deliveryStatus.replace(/-/g, ' ')}
            </Badge>
          )}
          {wo.paymentStatus && (
            <Badge variant={wo.paymentStatus === 'partial' ? 'warning' : 'default'}>
              Payment: {wo.paymentStatus}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardBody>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Order Amount</p>
                    <p className="text-xl font-semibold text-foreground">
                      {formatBDT(totalAmount)}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="font-medium text-success">{formatBDT(amountPaid)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-success" style={{ width: `${paymentProgress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {paymentProgress.toFixed(0)}% paid
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Delivery Progress</p>
                    <p className="text-xl font-semibold text-foreground">
                      {deliveredItems}/{totalItems}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                    <Package className="w-3.5 h-3.5 text-warning" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Items delivered</span>
                    <span className="font-medium text-foreground">
                      {deliveryProgress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${deliveryProgress}%` }} />
                  </div>
                  {wo.deliveryDeadline && (
                    <p className="text-xs text-muted-foreground">Deadline: {wo.deliveryDeadline}</p>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Work Order Details" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">PO Number</p>
                    <p className="font-medium text-foreground">{displayId}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Order Date</p>
                    <p className="font-medium text-foreground">{wo.orderDate || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">MRF Number</p>
                    <p className="font-medium text-foreground">{wo.requisitionNumber || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">RFQ Number</p>
                    <p className="font-medium text-foreground">{wo.rfqNumber || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">CS Number</p>
                    <p className="font-medium text-foreground">{wo.csNumber || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Award Number</p>
                    <p className="font-medium text-foreground">{wo.awardNumber || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Delivery Deadline</p>
                    <p className="font-medium text-foreground">{wo.deliveryDeadline || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Acceptance Deadline</p>
                    <p className="font-medium text-foreground">{wo.acceptanceDeadline || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Category</p>
                    <p className="font-medium text-foreground">{wo.category || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Budget Code</p>
                    <p className="font-medium text-foreground">{wo.budgetCode || '-'}</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Vendor Information" />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <div className="flex items-start gap-2 mb-3">
                    <h3 className="font-semibold text-foreground">{wo.vendor?.name || '-'}</h3>
                    {isDirectEvaluation && <Badge variant="secondary">Direct Eval</Badge>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Contact Person</p>
                        <p className="text-sm font-medium text-foreground">
                          {wo.vendor?.contactPerson || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="text-sm font-medium text-foreground">
                          {wo.vendor?.email || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium text-foreground">
                          {wo.vendor?.phone || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="text-sm font-medium text-foreground">
                          {wo.vendor?.address || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {wo.vendorStatus === 'accepted' && wo.vendorAcceptanceDate && (
                  <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm font-medium text-success">
                        Vendor accepted on {wo.vendorAcceptanceDate} — notified via Portal
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Order Items"
              description={`${itemsCount} items — amounts in BDT (৳)`}
            />
            <CardBody>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Item Name
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                        Delivered
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                        Total
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id ?? index} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">
                            {item.name || item.description || '-'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.specification || '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-foreground">
                          {item.quantity ?? 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-foreground">
                          {item.delivered ?? 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-foreground">
                          {formatBDT(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-foreground">
                          {formatBDT(item.total)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={getDeliveryItemStatusColor(item.deliveryStatus)}
                            size="sm"
                          >
                            {item.deliveryStatus || 'pending'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted/30">
                      <td
                        colSpan={4}
                        className="px-4 py-3 text-sm font-semibold text-foreground text-right"
                      >
                        Grand Total:
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-primary text-right">
                        {formatBDT(totalAmount)}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Delivery & Terms" />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Delivery Location</p>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-foreground whitespace-pre-line">
                      {wo.deliveryLocation || '-'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Payment Terms</p>
                    <p className="text-sm text-muted-foreground">{wo.paymentTerms || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Warranty Period</p>
                    <p className="text-sm text-muted-foreground">{wo.warrantyPeriod || '-'}</p>
                  </div>
                </div>
                {wo.notes && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Additional Notes</p>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm text-foreground">{wo.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Digital Approval History"
              description="Approval chain per Authority Matrix"
            />
            <CardBody>
              <div className="space-y-4">
                {approvalChain.length === 0 && (
                  <p className="text-sm text-muted-foreground">No approval history yet.</p>
                )}
                {approvalChain.map((approval, index) => (
                  <div key={approval.id ?? index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          approval.action === 'Approved'
                            ? 'bg-success/10'
                            : approval.action === 'Prepared'
                              ? 'bg-primary/10'
                              : 'bg-error/10'
                        }`}
                      >
                        {approval.action === 'Approved' ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : approval.action === 'Prepared' ? (
                          <FileText className="w-4 h-4 text-primary" />
                        ) : (
                          <XCircle className="w-4 h-4 text-error" />
                        )}
                      </div>
                      {index < approvalChain.length - 1 && (
                        <div className="w-0.5 h-full bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="font-medium text-foreground">{approval.approver || '-'}</p>
                          {approval.role && (
                            <p className="text-sm text-muted-foreground">{approval.role}</p>
                          )}
                        </div>
                        {approval.action && (
                          <Badge
                            variant={
                              approval.action === 'Approved'
                                ? 'success'
                                : approval.action === 'Prepared'
                                  ? 'info'
                                  : 'error'
                            }
                          >
                            {approval.action}
                          </Badge>
                        )}
                      </div>
                      {approval.date && (
                        <p className="text-sm text-muted-foreground mb-1">{approval.date}</p>
                      )}
                      {approval.comments && (
                        <p className="text-sm text-foreground">{approval.comments}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {notificationLog.length > 0 && (
            <Card>
              <CardHeader
                title="Vendor Notification Log"
                description="Portal & email notifications"
              />
              <CardBody>
                <div className="space-y-3">
                  {notificationLog.map((log, index) => (
                    <div
                      key={log.id ?? index}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg"
                    >
                      <Bell className="w-4 h-4 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{log.channel}</span>
                          {log.status && (
                            <Badge variant="success" size="sm">
                              {log.status}
                            </Badge>
                          )}
                        </div>
                        {(log.recipient || log.date || log.sentAt) && (
                          <p className="text-xs text-muted-foreground">
                            {log.recipient}
                            {log.recipient && (log.date || log.sentAt) ? ' — ' : ''}
                            {log.date || log.sentAt}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Quick Actions" />
            <CardBody>
              <div className="space-y-2">
                <Link href={paths.dashboard.procurement.workOrders.vendorAcceptance(id)}>
                  <Button size="sm" variant="outline" className="w-full justify-start">
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Vendor View
                  </Button>
                </Link>
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Resend to Vendor
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download Documents
                </Button>
              </div>
            </CardBody>
          </Card>

          {attachments.length > 0 && (
            <Card>
              <CardHeader title="Attachments" />
              <CardBody>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <a
                      key={file.id ?? index}
                      href={file.file_url || '#'}
                      target={file.file_url ? '_blank' : undefined}
                      rel={file.file_url ? 'noreferrer' : undefined}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.upload_date || file.uploadDate}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {(wo.orderDate ||
            wo.vendorAcceptanceDate ||
            wo.deliveryDeadline ||
            wo.acceptanceDeadline) && (
            <Card>
              <CardHeader title="Important Dates" />
              <CardBody>
                <div className="space-y-3">
                  {wo.orderDate && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Order Date</p>
                      <p className="text-sm font-medium text-foreground">{wo.orderDate}</p>
                    </div>
                  )}
                  {wo.vendorAcceptanceDate && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Vendor Acceptance</p>
                      <p className="text-sm font-medium text-foreground">
                        {wo.vendorAcceptanceDate}
                      </p>
                    </div>
                  )}
                  {wo.deliveryDeadline && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Delivery Deadline</p>
                      <p className="text-sm font-medium text-foreground">{wo.deliveryDeadline}</p>
                    </div>
                  )}
                  {wo.acceptanceDeadline && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Acceptance Deadline</p>
                      <p className="text-sm font-medium text-foreground">{wo.acceptanceDeadline}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
