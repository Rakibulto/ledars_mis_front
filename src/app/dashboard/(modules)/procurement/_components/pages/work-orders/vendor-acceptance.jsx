'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import {
  Mail,
  Clock,
  Phone,
  MapPin,
  Upload,
  XCircle,
  Download,
  FileText,
  Building2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  usePatchRequest as patchRequest,
  useCreateRequest as createRequest,
} from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

function formatBDT(amount) {
  const value = Number(amount) || 0;
  if (value >= 10000000) return `৳${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `৳${(value / 100000).toFixed(2)} Lakh`;
  return `৳${value.toLocaleString('en-IN')}`;
}

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
    case 'Accepted':
      return 'success';
    case 'Rejected':
      return 'error';
    case 'Negotiation':
      return 'warning';
    default:
      return 'default';
  }
};

export function VendorWorkOrderAcceptance() {
  const { id } = useParams();
  const [agreed, setAgreed] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: workOrder, loading } = useGetRequest(
    id ? endpoints.procurement_management.work_order_by_id(id) : null
  );
  const { data: acceptanceResponse } = useGetRequest(
    id
      ? `${endpoints.procurement_management.vendor_acceptances}?pagination=false&work_order=${id}`
      : null
  );

  const acceptance = useMemo(() => toList(acceptanceResponse)[0], [acceptanceResponse]);

  useEffect(() => {
    if (!acceptance) return;
    setRemarks(acceptance.remarks || '');
    setAgreed(acceptance.status === 'Accepted');
  }, [acceptance]);

  const daysLeft = useMemo(() => {
    if (!workOrder?.acceptanceDeadline) return null;
    const deadline = new Date(workOrder.acceptanceDeadline);
    if (Number.isNaN(deadline.getTime())) return null;
    return Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }, [workOrder]);

  const handleDecision = async (status) => {
    if (status === 'Accepted' && !agreed) {
      toast.error('Please confirm the terms before accepting the work order.');
      return;
    }

    if ((status === 'Rejected' || status === 'Negotiation') && !remarks.trim()) {
      toast.error('Please provide remarks for this response.');
      return;
    }

    if (!workOrder?.id) return;

    try {
      setSubmitting(true);
      const payload = new FormData();
      payload.append('work_order', String(workOrder.id));
      payload.append('status', status);
      payload.append('remarks', remarks);
      payload.append('response_date', new Date().toISOString());
      if (attachment) payload.append('attachment', attachment);

      if (acceptance?.id) {
        await patchRequest(
          endpoints.procurement_management.vendor_acceptance_by_id(acceptance.id),
          payload
        );
      } else {
        await createRequest(endpoints.procurement_management.vendor_acceptances, payload);
      }

      await Promise.all([
        mutate(endpoints.procurement_management.work_order_by_id(workOrder.id)),
        mutate(
          `${endpoints.procurement_management.vendor_acceptances}?pagination=false&work_order=${workOrder.id}`
        ),
        mutate(`${endpoints.procurement_management.work_orders}?pagination=false`),
      ]);

      toast.success(`Work order marked as ${status.toLowerCase()}.`);
    } catch (error) {
      toast.error(extractErrorMessage(error?.response?.data || error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
          <Card>
            <CardBody>
              <div className="py-12 text-center text-sm text-muted-foreground">
                Loading work order...
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  if (!workOrder?.id) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
          <Card>
            <CardBody>
              <div className="py-12 text-center text-sm text-muted-foreground">
                Work order not found.
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-4">
              <Building2 className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-semibold">
                  {workOrder.organization?.name || 'Issuing Organization'}
                </h1>
                <p className="text-sm text-primary-foreground/80">
                  Procurement work order response
                </p>
              </div>
            </div>
            <Badge
              variant={getStatusVariant(acceptance?.status || 'Pending')}
              className="text-sm px-4 py-2"
            >
              {acceptance?.status || 'Pending'}
            </Badge>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">Work Order / Purchase Order</h2>
            <p className="text-primary-foreground/80">
              {workOrder.workOrderNumber || workOrder.wo_number} - {workOrder.title}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <Card className="mb-6 border-warning bg-warning/5">
          <CardBody>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-warning" />
                <div>
                  <p className="font-medium text-foreground">
                    Acceptance Deadline: {formatDate(workOrder.acceptanceDeadline)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {daysLeft === null
                      ? 'Deadline not set'
                      : daysLeft >= 0
                        ? `${daysLeft} day(s) remaining to respond`
                        : 'Deadline has passed'}
                  </p>
                </div>
              </div>
              {daysLeft !== null ? (
                <Badge variant={daysLeft > 3 ? 'warning' : 'error'}>{daysLeft} days left</Badge>
              ) : null}
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader title="Issued By" />
              <CardBody>
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">
                    {workOrder.organization?.name || 'N/A'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm text-foreground">
                        {workOrder.organization?.address || 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm text-foreground">
                        {workOrder.organization?.phone || 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm text-foreground">
                        {workOrder.organization?.email || 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-foreground">
                          Contact: {workOrder.organization?.contactPerson || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Vendor Information" />
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Vendor</p>
                    <p className="font-medium text-foreground">{workOrder.vendor?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Contact Person</p>
                    <p className="font-medium text-foreground">
                      {workOrder.vendor?.contactPerson || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="font-medium text-foreground">
                      {workOrder.vendor?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Phone</p>
                    <p className="font-medium text-foreground">
                      {workOrder.vendor?.phone || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Item Names" />
              <CardBody>
                <div className="space-y-3">
                  {workOrder.items?.map((item) => (
                    <div key={item.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-foreground">
                            {item.name || item.description}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.specification || 'No specification provided'}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium text-foreground">Qty {item.quantity || 0}</p>
                          <p className="text-muted-foreground">{formatBDT(item.unitPrice)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Terms & Conditions" />
              <CardBody>
                <div className="space-y-2 text-sm text-foreground">
                  {(workOrder.termsAndConditions || []).map((term, index) => (
                    <div
                      key={`${index}-${term}`}
                      className="p-3 rounded-lg bg-muted/30 border border-border"
                    >
                      {term}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Work Order Summary" />
              <CardBody>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Order Date</span>
                    <span className="font-medium text-foreground">
                      {formatDate(workOrder.orderDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Delivery Deadline</span>
                    <span className="font-medium text-foreground">
                      {formatDate(workOrder.deliveryDeadline)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Payment Terms</span>
                    <span className="font-medium text-foreground text-right">
                      {workOrder.paymentTerms || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span className="font-semibold text-foreground">
                      {formatBDT(workOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Response"
                description="Submit your formal acceptance, rejection, or negotiation request"
              />
              <CardBody>
                <div className="space-y-4">
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(event) => setAgreed(event.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-foreground">
                      I confirm that I have reviewed the work order, delivery expectations, and
                      terms.
                    </span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Remarks
                    </label>
                    <textarea
                      rows={5}
                      value={remarks}
                      onChange={(event) => setRemarks(event.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Acceptance note, negotiation points, or rejection reason"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Supporting Attachment
                    </label>
                    <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-input rounded-lg cursor-pointer hover:bg-muted/50 w-fit">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Upload signed response</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(event) => setAttachment(event.target.files?.[0] || null)}
                      />
                    </label>
                    {attachment ? (
                      <p className="text-xs text-muted-foreground mt-2">{attachment.name}</p>
                    ) : null}
                    {acceptance?.attachment ? (
                      <a
                        href={acceptance.attachment}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex mt-2"
                      >
                        <Button variant="outline" size="sm">
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          Existing Attachment
                        </Button>
                      </a>
                    ) : null}
                  </div>
                </div>
              </CardBody>
            </Card>

            <div className="space-y-3">
              <Button
                type="button"
                className="w-full"
                onClick={() => handleDecision('Accepted')}
                disabled={submitting}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept Work Order
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-warning text-warning hover:bg-warning/10"
                onClick={() => handleDecision('Negotiation')}
                disabled={submitting}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Request Negotiation
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-error text-error hover:bg-error/10"
                onClick={() => handleDecision('Rejected')}
                disabled={submitting}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Work Order
              </Button>
            </div>

            {acceptance ? (
              <Card>
                <CardHeader title="Latest Response" />
                <CardBody>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={getStatusVariant(acceptance.status)}>
                        {acceptance.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Response Date</span>
                      <span className="font-medium text-foreground">
                        {formatDate(acceptance.response_date)}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      {acceptance.remarks || 'No remarks recorded.'}
                    </p>
                  </div>
                </CardBody>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
