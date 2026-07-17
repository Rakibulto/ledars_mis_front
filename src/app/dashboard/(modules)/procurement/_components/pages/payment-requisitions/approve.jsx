'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Send,
  XCircle,
  Banknote,
  FileText,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  usePatchRequest as patchRequest,
} from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

const formatBDT = (amount) => {
  const value = Number(amount) || 0;
  if (value >= 10000000) return `৳${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `৳${(value / 100000).toFixed(2)} L`;
  return `৳${value.toLocaleString('en-IN')}`;
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

export function PRFApprovalView() {
  const { id } = useParams();
  const router = useRouter();
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: prf, loading } = useGetRequest(
    id ? endpoints.procurement_management.payment_requisition_by_id(id) : null
  );

  const handleDecision = async (status) => {
    if (status === 'Rejected' && !comments.trim()) {
      toast.error('Please provide remarks for rejection.');
      return;
    }

    if (!prf?.id) return;

    try {
      setSubmitting(true);
      await patchRequest(endpoints.procurement_management.payment_requisition_by_id(prf.id), {
        status,
        finance_remarks: comments,
      });

      await Promise.all([
        mutate(endpoints.procurement_management.payment_requisition_summary),
        mutate(`${endpoints.procurement_management.payment_requisitions}?pagination=false`),
        mutate(endpoints.procurement_management.payment_requisition_by_id(prf.id)),
      ]);

      toast.success(
        status === 'Approved'
          ? 'Payment requisition approved successfully.'
          : 'Payment requisition rejected.'
      );
      router.push(paths.dashboard.procurement.paymentRequisitions.detail(prf.id));
    } catch (error) {
      toast.error(extractErrorMessage(error?.response?.data || error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
        <Card>
          <CardBody>
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading approval view...
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!prf?.id) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
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

  const approvalRoute = Number(prf.net_amount) >= 500000 ? 'Country Director' : 'Head of Finance';

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            type="button"
            onClick={() =>
              router.push(paths.dashboard.procurement.paymentRequisitions.detail(prf.id))
            }
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-1">
              Review PRF - {prf.prf_number}
            </h1>
            <p className="text-muted-foreground">
              Validate the linked procurement documents and record your decision.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant={getStatusVariant(prf.status)}>{prf.status}</Badge>
          <Badge variant="outline">{prf.priority || 'Medium'} priority</Badge>
        </div>
      </div>

      <Card className="mb-6 bg-primary/5 border-primary/20">
        <CardBody>
          <p className="text-sm font-medium text-foreground mb-3">Approval Route</p>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-success/10 rounded-full text-success font-medium">
              <CheckCircle className="w-3 h-3" />
              Submitted
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-1 px-3 py-1.5 bg-warning/20 rounded-full text-warning font-bold border border-warning">
              <ShieldCheck className="w-3 h-3" />
              Pending Approval
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-1 px-3 py-1.5 bg-muted/50 rounded-full text-muted-foreground">
              <CheckCircle className="w-3 h-3" />
              {approvalRoute}
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-1 px-3 py-1.5 bg-muted/50 rounded-full text-muted-foreground">
              <Banknote className="w-3 h-3" />
              Treasury
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-1 px-3 py-1.5 bg-muted/50 rounded-full text-muted-foreground">
              <Send className="w-3 h-3" />
              Paid
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="mb-6 border-primary bg-primary/5">
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-foreground">{formatBDT(prf.total_amount)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Tax</p>
              <p className="text-2xl font-bold text-error">-{formatBDT(prf.tax_amount)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Net Payable</p>
              <p className="text-2xl font-bold text-success">{formatBDT(prf.net_amount)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Supplier</p>
              <p className="text-sm font-semibold text-foreground">{prf.supplier_name || 'N/A'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Invoice</p>
              <p className="text-sm font-semibold text-foreground">{prf.invoice_number || 'N/A'}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader
          title="Linked Transaction Summary"
          description="Review the live references attached to this PRF"
        />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="border rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Work Order</h4>
                  {prf.work_order ? (
                    <Link
                      href={paths.dashboard.procurement.workOrders.detail(prf.work_order)}
                      className="text-primary hover:underline text-sm"
                    >
                      {prf.wo_number || prf.work_order_number}
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground">No linked work order</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Payment method: {prf.payment_method || 'N/A'}
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Goods Receipt Note</h4>
                  {prf.grn ? (
                    <Link
                      href={paths.dashboard.procurement.grn.detail(prf.grn)}
                      className="text-primary hover:underline text-sm"
                    >
                      {prf.grn_number}
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground">No linked GRN</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {prf.item_count || 0} item(s) included in the PRF.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader
          title="Approval Remarks"
          description="These remarks will be stored on the payment requisition"
        />
        <CardBody>
          <textarea
            value={comments}
            onChange={(event) => setComments(event.target.value)}
            rows={5}
            placeholder="Add your review comments, verification notes, or rejection reason"
            className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {prf.finance_remarks ? (
            <div className="mt-3 p-3 rounded-lg bg-muted/40 border border-border text-sm text-muted-foreground">
              Existing finance remarks: {prf.finance_remarks}
            </div>
          ) : null}
        </CardBody>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          className="border-error text-error hover:bg-error/10"
          onClick={() => handleDecision('Rejected')}
          disabled={submitting}
        >
          <XCircle className="w-4 h-4 mr-2" />
          Reject PRF
        </Button>
        <Button type="button" onClick={() => handleDecision('Approved')} disabled={submitting}>
          <CheckCircle className="w-4 h-4 mr-2" />
          {submitting ? 'Saving...' : 'Approve PRF'}
        </Button>
      </div>

      {!['Submitted', 'Pending Approval'].includes(prf.status) ? (
        <div className="mt-4 p-3 rounded-lg border border-warning bg-warning/5 text-sm text-muted-foreground flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
          This PRF is currently in {prf.status}. Updating the decision will overwrite the live
          status.
        </div>
      ) : null}
    </div>
  );
}
