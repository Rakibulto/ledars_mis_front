'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Clock, XCircle, FileText, ArrowLeft, DollarSign, CheckCircle } from 'lucide-react';

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

const numericValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export function TreasuryProcessing() {
  const { id: routeId } = useParams();
  const searchParams = useSearchParams();
  const queryId = searchParams.get('id');
  const prfId = routeId || queryId;

  const router = useRouter();

  const { data: prf, loading } = useGetRequest(
    prfId ? endpoints.procurement_management.payment_requisition_by_id(prfId) : null
  );

  const [paymentMethod, setPaymentMethod] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [partialAmount, setPartialAmount] = useState('');
  const [treasuryComments, setTreasuryComments] = useState('');
  const [holdReason, setHoldReason] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState('');

  const financials = useMemo(() => {
    const gross = numericValue(prf?.total_amount);
    const tax = numericValue(prf?.tax_amount);
    const net = numericValue(prf?.net_amount);
    const vat = Math.max(gross - net - tax, 0);

    return { gross, tax, net, vat };
  }, [prf]);

  const handleSubmit = async (status) => {
    if (!prf?.id) return;

    if (!paymentMethod && (status === 'paid' || status === 'partially-paid')) {
      toast.error('Please select payment method.');
      return;
    }
    if (!bankReference && (status === 'paid' || status === 'partially-paid')) {
      toast.error('Please enter bank reference number.');
      return;
    }
    if (!paymentDate && (status === 'paid' || status === 'partially-paid')) {
      toast.error('Please select payment date.');
      return;
    }
    if (status === 'partially-paid' && !partialAmount) {
      toast.error('Please enter partial payment amount.');
      return;
    }
    if (status === 'on-hold' && !holdReason) {
      toast.error('Please provide reason for hold.');
      return;
    }

    const nextPrfStatus =
      status === 'paid' ? 'Paid' : status === 'returned' ? 'Pending Approval' : 'Processing';

    const notes = [
      treasuryComments,
      holdReason ? `Hold reason: ${holdReason}` : '',
      partialAmount ? `Partial amount: ${partialAmount}` : '',
      paymentDate ? `Payment date: ${paymentDate}` : '',
      bankReference ? `Reference: ${bankReference}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    try {
      setSubmittingStatus(status);
      await patchRequest(endpoints.procurement_management.payment_requisition_by_id(prf.id), {
        status: nextPrfStatus,
        ...(paymentMethod && { payment_method: paymentMethod }),
        ...(notes && { finance_remarks: notes }),
      });

      await Promise.all([
        mutate(`${endpoints.procurement_management.payment_requisitions}?pagination=false`),
        mutate(
          `${endpoints.procurement_management.payment_requisitions}?pagination=false&status=Approved`
        ),
        mutate(
          `${endpoints.procurement_management.payment_requisitions}?pagination=false&status=Paid`
        ),
        mutate(
          `${endpoints.procurement_management.payment_requisitions}?pagination=false&status=Processing`
        ),
        mutate(
          `${endpoints.procurement_management.payment_requisitions}?pagination=false&status=Pending Approval`
        ),
        mutate(endpoints.procurement_management.payment_requisition_by_id(prf.id)),
      ]);

      toast.success(`Payment marked as ${status}.`);
      router.push(paths.dashboard.procurement.treasury.financeReview);
    } catch (error) {
      toast.error(extractErrorMessage(error?.response?.data || error));
    } finally {
      setSubmittingStatus('');
    }
  };

  if (!prfId) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <Card>
          <CardBody>
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                No PRF selected for treasury processing.
              </p>
              <Link href={paths.dashboard.procurement.treasury.financeReview}>
                <Button variant="outline">Go to Finance Review Queue</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <Card>
          <CardBody>
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading treasury processing data...
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!prf?.id) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <Card>
          <CardBody>
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Selected PRF was not found.</p>
              <Link href={paths.dashboard.procurement.treasury.financeReview}>
                <Button variant="outline">Back to Finance Review Queue</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href={paths.dashboard.procurement.treasury.financeReview}>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-1">
              Treasury Processing - {prf.prf_number || `PRF-${prf.id}`}
            </h1>
            <p className="text-muted-foreground">Process approved PRF payment transaction.</p>
          </div>
        </div>

        <Badge variant="warning">Pending Treasury Processing</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="border-primary bg-primary/5">
            <CardHeader title="Payment Summary" />
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Gross Amount</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatBDT(financials.gross)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">VAT</p>
                  <p className="text-2xl font-bold text-success">+{formatBDT(financials.vat)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Tax Deduction</p>
                  <p className="text-2xl font-bold text-error">-{formatBDT(financials.tax)}</p>
                </div>
                <div className="text-center border-l-2 border-primary">
                  <p className="text-sm text-muted-foreground mb-1">Net Payable</p>
                  <p className="text-3xl font-bold text-primary">{formatBDT(financials.net)}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Payment Processing"
              description="Enter payment and treasury details"
            />
            <CardBody>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Payment Method *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
                    >
                      <option value="">Select payment method</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="RTGS">RTGS</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(event) => setPaymentDate(event.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Bank/Payment Reference Number *
                    </label>
                    <input
                      type="text"
                      value={bankReference}
                      onChange={(event) => setBankReference(event.target.value)}
                      placeholder="Enter transfer/check reference"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Partial Payment Amount (optional)
                  </label>
                  <input
                    type="number"
                    value={partialAmount}
                    onChange={(event) => setPartialAmount(event.target.value)}
                    placeholder="0.00"
                    max={financials.net}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Hold Reason (if placing on hold)
                  </label>
                  <select
                    value={holdReason}
                    onChange={(event) => setHoldReason(event.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
                  >
                    <option value="">Select reason</option>
                    <option value="insufficient-funds">Insufficient Funds</option>
                    <option value="pending-documentation">Pending Additional Documentation</option>
                    <option value="vendor-verification">Vendor Verification Required</option>
                    <option value="budget-freeze">Budget Freeze</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Treasury Comments
                  </label>
                  <textarea
                    value={treasuryComments}
                    onChange={(event) => setTreasuryComments(event.target.value)}
                    placeholder="Add treasury processing remarks"
                    rows={4}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-base"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Payment Status Actions" description="Update next treasury action" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  variant="success"
                  className="w-full border border-success/50 bg-success/10 hover:bg-success/20"
                  disabled={!!submittingStatus}
                  onClick={() => handleSubmit('paid')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {submittingStatus === 'paid' ? 'Saving...' : 'Mark as Paid (Full)'}
                </Button>

                <Button
                  variant="warning"
                  className="w-full border border-warning/50 bg-warning/10 hover:bg-warning/20"
                  disabled={!!submittingStatus}
                  onClick={() => handleSubmit('partially-paid')}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  {submittingStatus === 'partially-paid' ? 'Saving...' : 'Mark as Partially Paid'}
                </Button>

                <Button
                  variant="default"
                  className="w-full border border-border bg-muted/50 hover:bg-muted"
                  disabled={!!submittingStatus}
                  onClick={() => handleSubmit('on-hold')}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {submittingStatus === 'on-hold' ? 'Saving...' : 'Place on Hold'}
                </Button>

                <Button
                  variant="error"
                  className="w-full border border-error/50 bg-error/10 hover:bg-error/20"
                  disabled={!!submittingStatus}
                  onClick={() => handleSubmit('returned')}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {submittingStatus === 'returned' ? 'Saving...' : 'Return to Finance'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Payment Information" />
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">PRF Number</span>
                  <span className="font-medium text-foreground">
                    {prf.prf_number || `PRF-${prf.id}`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Supplier</span>
                  <span className="font-medium text-foreground">{prf.supplier_name || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Invoice</span>
                  <span className="font-medium text-foreground">{prf.invoice_number || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">WO</span>
                  <span className="font-medium text-foreground">{prf.wo_number || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Approved Date</span>
                  <span className="font-medium text-foreground">
                    {formatDate(prf.approved_date)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Tentative Date</span>
                  <Badge variant="warning">{formatDate(prf.tentative_payment_schedule_date)}</Badge>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Quick Links" />
            <CardBody>
              <div className="space-y-2">
                <Link href={paths.dashboard.procurement.paymentRequisitions.detail(prf.id)}>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    View PRF Details
                  </Button>
                </Link>
                {prf.work_order ? (
                  <Link href={paths.dashboard.procurement.workOrders.detail(prf.work_order)}>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      View Work Order
                    </Button>
                  </Link>
                ) : null}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
