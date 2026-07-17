'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Mail,
  Send,
  Loader2,
  Printer,
  Calendar,
  Download,
  FileText,
  ArrowLeft,
  DollarSign,
  CheckCircle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePatchRequest as patchRequest,
  useCreateRequest as createRequest,
} from 'src/actions/ledars-hook';

import { PageLoader } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

function formatBDT(amount) {
  if (!amount) return '৳0';
  if (amount >= 10000000) return `৳${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(2)} Lakh`;
  return `৳${Number(amount)?.toLocaleString('en-IN')}`;
}

export function AwardNotification() {
  const router = useRouter();
  const params = useParams();
  const awardId = params.id;
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const awardUrl = `${endpoints.procurement_management.awards}${awardId}/`;
  const { data: award, loading } = useGetRequest(awardUrl);

  const hasVendor = Boolean(award?.vendor?.id);
  const isDirectEvaluation = award?.vendor?.is_direct_evaluation || !hasVendor;
  const canSendNotification = hasVendor && award?.notificationStatus !== 'sent';
  const canAcceptAward = hasVendor && award?.acceptanceStatus !== 'accepted';

  const handleSendNotification = async () => {
    if (!hasVendor) {
      toast.info('Direct evaluation awards bypass vendor notification pipeline.');
      return;
    }
    setSending(true);
    try {
      await createRequest(endpoints.procurement_management.award_notifications, {
        award: Number(awardId),
        vendor_profile: award.vendor.id,
        notification_type: 'Award',
        sent_date: new Date().toISOString(),
        message: `Award notification for contract ${award.award_number}`,
        is_sent: true,
        is_acknowledged: false,
        acknowledged_date: null,
      });
      // Mark the award's notification status as sent
      await patchRequest(endpoints.procurement_management.award_by_id(awardId), {
        notification_status: 'sent',
      });
      await mutate(awardUrl);
      setShowSendConfirm(false);
    } catch (err) {
      console.error('Failed to send award notification:', err);
    } finally {
      setSending(false);
    }
  };

  const handleAcceptAward = async () => {
    if (!hasVendor) {
      toast.info('Direct evaluation awards bypass vendor acceptance.');
      return;
    }

    setAccepting(true);
    try {
      await createRequest(endpoints.procurement_management.vendor_acceptances, {
        award: awardId,
        status: 'accepted',
      });
      await mutate(awardUrl);
    } catch (err) {
      console.error('Failed to accept award:', err);
    } finally {
      setAccepting(false);
    }
  };

  const handlePrint = () => window.print();

  const handleDownload = () => {
    if (!award) return;
    const itemsHtml =
      award.items?.length > 0
        ? `<table>
            <thead><tr><th>Item Name</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
            <tbody>
              ${award.items
                .map(
                  (item) =>
                    `<tr>
                      <td>${item.name ?? item.description ?? ''}${item.specification ? `<br/><small>${item.specification}</small>` : ''}</td>
                      <td>${item.quantity ?? ''}</td>
                      <td>${formatBDT(item.unitPrice)}</td>
                      <td>${formatBDT(item.total)}</td>
                    </tr>`
                )
                .join('')}
              <tr style="font-weight:600;"><td colspan="3" align="right">Total Contract Value:</td><td>${formatBDT(award.awardedAmount)}</td></tr>
            </tbody>
          </table>`
        : '';
    const html = `<!DOCTYPE html>
<html><head>
<title>Award Letter - ${award.award_number}</title>
<style>
  body{font-family:Arial,sans-serif;margin:40px;color:#1a1a1a;font-size:14px}
  h1{color:#2563eb;margin-bottom:4px} h2{margin-top:0;color:#374151}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0}
  .label{color:#6b7280;font-size:11px;margin-bottom:2px} .value{font-weight:600}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th,td{border:1px solid #e5e7eb;padding:8px 12px;text-align:left}
  th{background:#f3f4f6;font-weight:600}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb}
  @media print{body{margin:20px}}
</style></head>
<body>
  <h1>Ledars</h1>
  <h2>Award Notification - ${award.award_number}</h2>
  <p><strong>Date:</strong> ${award.awardDate ?? '—'}</p>
  <p>Dear ${award.vendor?.contactPerson ?? award.vendor?.name ?? 'Vendor'},</p>
  <p>We are pleased to inform you that your quotation has been accepted and you have been awarded the contract for the following procurement:</p>
  <div class="meta">
    <div><div class="label">Award Number</div><div class="value">${award.award_number}</div></div>
    <div><div class="label">Award Date</div><div class="value">${award.awardDate ?? '—'}</div></div>
    <div><div class="label">RFQ Number</div><div class="value">${award.rfqNumber ?? '—'}</div></div>
    <div><div class="label">Contract Value</div><div class="value" style="color:#16a34a;font-size:18px">${formatBDT(award.awardedAmount)}</div></div>
  </div>
  <h3>Project Details</h3>
  <p><strong>${award.title ?? ''}</strong></p>
  ${award.description ? `<p>${award.description}</p>` : ''}
  ${itemsHtml}
  <div class="footer">
    <p>We look forward to working with you.</p>
    <p>Best regards,<br/><strong>${award.awarded_by ?? 'Procurement Department'}</strong></p>
  </div>
  <script>window.onload=function(){window.print()}</script>
</body></html>`;
    const w = window.open('', '_blank', 'width=860,height=960');
    if (!w) return;
    w.document.write(html);
    w.document.close();
  };

  if (loading) return <PageLoader message="Loading award details..." />;
  if (!award) return <p className="p-8 text-center text-muted-foreground">Award not found.</p>;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push(paths.dashboard.procurement.awards.summary)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-1">
              Award Notification Preview
            </h1>
            <p className="text-muted-foreground">Award ID: {award.award_number}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download PDF
          </Button>
          {award.notificationStatus === 'sent' ? (
            <Button size="sm" variant="success" disabled>
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Notification Sent
            </Button>
          ) : hasVendor ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setShowSendConfirm(true)}
              disabled={sending}
            >
              {sending ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 mr-1.5" />
              )}
              {sending ? 'Sending...' : 'Send to Vendor'}
            </Button>
          ) : (
            <Button size="sm" variant="secondary" disabled>
              <Mail className="w-3.5 h-3.5 mr-1.5" />
              Direct Eval Bypassed
            </Button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {award.notificationStatus === 'sent' && (
        <Card className="mb-6 border-success bg-success/5">
          <CardBody>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success" />
              <div>
                <p className="font-medium text-foreground">Award notification sent successfully</p>
                <p className="text-sm text-muted-foreground">
                  {award.vendor?.email && `Sent to ${award.vendor.email}`}
                  {award.vendor?.phone && ` • ${award.vendor.phone}`}
                  {award.notificationDate && ` on ${award.notificationDate}`}
                  {award.acceptanceStatus === 'accepted' && award.acceptanceDate && (
                    <> • Vendor accepted on {award.acceptanceDate}</>
                  )}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Email Preview */}
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader
            title="Email Preview"
            description="This is how the award notification will appear to the vendor"
          />
          <CardBody>
            {/* Email Header */}
            <div className="border-b border-border pb-4 mb-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">To:</p>
                  {award.vendor?.email ? (
                    <p className="font-medium text-foreground">{award.vendor.email}</p>
                  ) : isDirectEvaluation ? (
                    <p className="font-medium text-muted-foreground italic">
                      Direct evaluation vendor (no vendor portal contact)
                    </p>
                  ) : (
                    <p className="font-medium text-muted-foreground italic">Email not provided</p>
                  )}
                  {award.vendor?.contactPerson ? (
                    <p className="text-sm text-muted-foreground">{award.vendor.contactPerson}</p>
                  ) : isDirectEvaluation ? (
                    <p className="text-sm text-muted-foreground">
                      Direct evaluation quote recipient
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Date:</p>
                  <p className="font-medium text-foreground">{award.awardDate ?? '—'}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Subject:</p>
              <p className="font-semibold text-foreground">
                Contract Award Notification - {award.award_number}
              </p>
            </div>

            {/* Email Body */}
            <div className="space-y-6">
              {/* Letter Header */}
              <div className="text-center border-b border-border pb-6">
                <h2 className="text-xl font-semibold text-primary mb-2">Ledars</h2>
                <p className="text-sm text-muted-foreground">Vendor Portal</p>
                <p className="text-sm text-muted-foreground">
                  {award?.vendor?.email ?? (isDirectEvaluation ? 'Direct evaluation vendor' : '')}
                </p>
              </div>
              {award.notificationStatus !== 'sent' && hasVendor && (
                <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">
                    Award Notification Not Sent
                  </h3>
                  <p className="text-sm text-foreground mb-2">
                    This award notification has not been sent to the vendor yet. Please review the
                    details and click "Send to Vendor" when ready.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setShowSendConfirm(true)}
                    disabled={sending}
                  >
                    {sending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                    {sending ? 'Sending...' : 'Send Award Notification'}
                  </Button>
                </div>
              )}
              {!hasVendor && (
                <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">Direct Evaluation Award</h3>
                  <p className="text-sm text-foreground">
                    This award has no linked vendor profile, so the vendor portal notification and
                    acceptance are bypassed.
                  </p>
                </div>
              )}
              {award.notificationStatus === 'sent' && award.acceptanceStatus === 'accepted' && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Congratulations!</h3>
                      <p className="text-sm text-muted-foreground">
                        Your quotation has been accepted
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* Greeting */}
              <div>
                <p className="text-foreground mb-4">
                  Dear {award.vendor?.contactPerson ?? award.vendor?.name ?? 'Vendor'},
                </p>
                <p className="text-foreground mb-4">
                  We are pleased to inform you that your quotation has been accepted and you have
                  been awarded the contract for the following procurement:
                </p>
              </div>

              {/* Award Details */}
              <Card className="bg-muted/30">
                <CardBody>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Award Number</p>
                      <p className="font-semibold text-foreground">{award.award_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Award Date</p>
                      <p className="font-medium text-foreground">{award.awardDate ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">RFQ Number</p>
                      <p className="font-medium text-foreground">{award.rfqNumber ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Contract Value</p>
                      <p className="font-semibold text-success text-lg">
                        {formatBDT(award.awardedAmount)}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Project Details */}
              <div>
                <h4 className="font-semibold text-foreground mb-3">Project Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">{award.title}</p>
                      {award.description && (
                        <p className="text-muted-foreground whitespace-pre-line">
                          {award.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Terms — only show section if at least one field exists */}
              {(award.validityPeriod ||
                award.validFrom ||
                award.validUntil ||
                award.deliveryTimeline ||
                award.paymentTerms ||
                award.warrantyPeriod) && (
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Key Contract Terms</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {(award.validityPeriod || award.validFrom || award.validUntil) && (
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Validity Period</p>
                          <p className="font-medium text-foreground">
                            {award.validityPeriod ?? '—'}
                          </p>
                          {(award.validFrom || award.validUntil) && (
                            <p className="text-xs text-muted-foreground">
                              {award.validFrom ?? '—'} to {award.validUntil ?? '—'}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {award.deliveryTimeline && (
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Delivery Timeline</p>
                          <p className="font-medium text-foreground">{award.deliveryTimeline}</p>
                        </div>
                      </div>
                    )}
                    {award.paymentTerms && (
                      <div className="flex items-start gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Payment Terms</p>
                          <p className="font-medium text-foreground">{award.paymentTerms}</p>
                        </div>
                      </div>
                    )}
                    {award.warrantyPeriod && (
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Warranty Period</p>
                          <p className="font-medium text-foreground">{award.warrantyPeriod}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Award Items */}
              {award.items?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Awarded Items</h4>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr className="border-b border-border">
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                            Item Name
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {award.items.map((item, index) => (
                          <tr key={index} className="border-b border-border last:border-0">
                            <td className="px-4 py-3 text-sm text-foreground">
                              {item.name || item.description}
                              {item.specification && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {item.specification}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-foreground">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-foreground">
                              {formatBDT(item.unitPrice)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-foreground">
                              {formatBDT(item.total)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-muted/30">
                          <td
                            colSpan={3}
                            className="px-4 py-3 text-sm font-semibold text-foreground text-right"
                          >
                            Total Contract Value:
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-success text-right">
                            {formatBDT(award.awardedAmount)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Terms & Conditions */}
              {award.terms?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Terms & Conditions</h4>
                  <div className="space-y-2">
                    {award.terms.map((term, index) => (
                      <div key={index} className="flex gap-2 text-sm">
                        <span className="text-muted-foreground">{index + 1}.</span>
                        <p className="text-foreground">{term}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* terms_and_conditions fallback (plain text) */}
              {!award.terms?.length && award.terms_and_conditions && (
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Terms & Conditions</h4>
                  <p className="text-sm text-foreground whitespace-pre-line">
                    {award.terms_and_conditions}
                  </p>
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">Next Steps</h4>
                <p className="text-sm text-foreground mb-2">
                  Please confirm your acceptance of this award by clicking the link below within 5
                  business days:
                </p>
                <Button
                  variant="primary"
                  className="mt-2"
                  onClick={handleAcceptAward}
                  disabled={accepting || !canAcceptAward}
                >
                  {accepting ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {accepting
                    ? 'Accepting...'
                    : !hasVendor
                      ? 'Direct Eval Bypassed'
                      : award.acceptanceStatus === 'accepted'
                        ? 'Already Accepted'
                        : 'Accept Award'}
                </Button>
                {award.responseDeadline && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Response deadline: {award.responseDeadline}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  If you have any questions, please contact our procurement team at
                  procurement@organization.org
                </p>
              </div>

              {/* Approvers — only if available */}
              {award.approvers?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Approved By</h4>
                  <div className="space-y-2">
                    {award.approvers.map((approver, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-foreground">{approver.name}</p>
                          <p className="text-xs text-muted-foreground">{approver.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{approver.date}</p>
                          <p className="text-xs font-medium text-success capitalize">
                            {approver.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Closing */}
              <div>
                <p className="text-foreground mb-2">We look forward to working with you.</p>
                <p className="text-foreground mb-4">Best regards,</p>
                <div>
                  <p className="font-medium text-foreground">
                    {award.awarded_by ?? 'Procurement Department'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ProcureMax - {award.organization?.name ?? 'Organization Name'}
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Send Confirmation Modal */}
      {showSendConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader
              title="Send Award Notification"
              description="Confirm sending award notification to vendor"
            />
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Email will be sent to:
                    </p>
                    <p className="text-sm text-foreground">
                      {award.vendor?.email ?? 'Email not available'}
                    </p>
                    {award.vendor?.contactPerson && (
                      <p className="text-sm text-muted-foreground">{award.vendor.contactPerson}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => setShowSendConfirm(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleSendNotification}
                    disabled={sending}
                  >
                    {sending ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    {sending ? 'Sending...' : 'Send Now'}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
