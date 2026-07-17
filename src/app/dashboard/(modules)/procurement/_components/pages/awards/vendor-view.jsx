// {
//     "id": 4,
//     "award_number": "AWD-2026-0004",
//     "rfqNumber": "RFQ-2026-040",
//     "csNumber": "CS-2026-0012",
//     "title": "Electronics (CAT-001) - Education Department",
//     "description": "Nihil incidunt quis\n\nfdfdfdfdfdfdfdf",
//     "organization": {
//         "name": "Cassady Waters",
//         "contactPerson": null,
//         "email": null,
//         "phone": null,
//         "address": "Sunt qui optio omni"
//     },
//     "vendor": {
//         "id": 9,
//         "name": "Reuben Salazar",
//         "contactPerson": "Tamim vai company",
//         "email": "tamim@gmail.com",
//         "phone": "+8801710000000",
//         "address": "Amet aut odio maior"
//     },
//     "awardedAmount": "8278.00",
//     "approvedAmount": "10577.00",
//     "savings": 2299.0,
//     "savingsPercentage": 21.74,
//     "awardDate": "2026-05-02",
//     "notificationDate": null,
//     "responseDeadline": null,
//     "validFrom": null,
//     "validUntil": null,
//     "validityPeriod": null,
//     "deliveryTimeline": null,
//     "deliveryAddress": null,
//     "paymentTerms": null,
//     "warrantyPeriod": null,
//     "status": "active",
//     "notificationStatus": "sent",
//     "acceptanceStatus": "accepted",
//     "acceptanceDate": null,
//     "deliveryStatus": "pending",
//     "deliveryProgress": 0,
//     "completionDate": null,
//     "paymentStatus": "pending",
//     "amountPaid": "0.00",
//     "items": [
//         {
//             "description": "Desktop",
//             "specification": "",
//             "quantity": 1,
//             "unitPrice": 85.0,
//             "total": 85.0
//         },
//         {
//             "description": "Mobile Itel",
//             "specification": "",
//             "quantity": 5,
//             "unitPrice": 914.0,
//             "total": 4570.0
//         },
//         {
//             "description": "Chair",
//             "specification": "",
//             "quantity": 3,
//             "unitPrice": 936.0,
//             "total": 2808.0
//         },
//         {
//             "description": "Mobile Itel",
//             "specification": "",
//             "quantity": 5,
//             "unitPrice": 869.0,
//             "total": 4345.0
//         }
//     ],
//     "totalItems": 4,
//     "deliveredItems": 0,
//     "terms": [],
//     "deliverySchedule": [],
//     "approvers": [],
//     "contactInfo": null,
//     "comparative_statement": 11,
//     "rfq": 40,
//     "vendor_profile": 9,
//     "justification": null,
//     "terms_and_conditions": null,
//     "awarded_by": null,
//     "created_at": "2026-05-02T18:13:34.817270+06:00",
//     "updated_at": "2026-05-04T16:34:45.015848+06:00"
// }

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Mail,
  User,
  Award,
  Clock,
  Phone,
  Printer,
  XCircle,
  Calendar,
  FileText,
  Download,
  Building2,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

const hasValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
};

const formatCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return `$${num.toLocaleString()}`;
};

export function VendorAwardView() {
  const params = useParams();
  const awardId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const awardUrl = awardId ? `${endpoints.procurement_management.awards}${awardId}/` : null;
  const { data: award, loading } = useGetRequest(awardUrl);

  const items = Array.isArray(award?.items) ? award.items : [];
  const deliverySchedule = Array.isArray(award?.deliverySchedule) ? award.deliverySchedule : [];
  const terms = Array.isArray(award?.terms) ? award.terms : [];

  const hasItems = items.length > 0;
  const hasDeliverySchedule = deliverySchedule.length > 0;
  const hasTerms = terms.length > 0;
  const hasContractMeta =
    hasValue(award?.paymentTerms) ||
    hasValue(award?.warrantyPeriod) ||
    hasValue(award?.deliveryAddress) ||
    (hasValue(award?.validFrom) && hasValue(award?.validUntil));
  const hasContactInfo =
    hasValue(award?.contactInfo?.procurementOfficer) ||
    hasValue(award?.contactInfo?.email) ||
    hasValue(award?.contactInfo?.phone) ||
    hasValue(award?.contactInfo?.officeHours);

  const awardedAmountLabel = formatCurrency(award?.awardedAmount);

  const handleAccept = () => {
    alert('Award accepted! You will receive a Purchase Order shortly.');
    setShowAcceptModal(false);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    alert('Award declined. The procurement team has been notified.');
    setShowRejectModal(false);
  };

  const daysRemaining = hasValue(award?.responseDeadline)
    ? Math.ceil(
        (new Date(award.responseDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 p-4 md:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">Loading award details...</p>
      </div>
    );
  }

  if (!award) {
    return (
      <div className="min-h-screen bg-muted/20 p-4 md:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">Award data not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header - Public View */}
      <div className="bg-primary text-primary-foreground py-4 md:py-6 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold mb-1">
                Contract Award Notification
              </h1>
              {hasValue(award.id) && (
                <p className="text-primary-foreground/80">Award ID: {award.id}</p>
              )}
            </div>
            <div className="w-16 h-16 bg-primary-foreground/10 rounded-full flex items-center justify-center">
              <Award className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Deadline Alert */}
        {award.acceptanceStatus === 'pending' && hasValue(award.responseDeadline) && (
          <Card className="mb-6 border-warning bg-warning/5">
            <CardBody>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground mb-1">Response Required</p>
                  <p className="text-sm text-muted-foreground">
                    Please accept or decline this award within
                    <span className="font-semibold text-warning"> {daysRemaining} days</span>
                    (Deadline: {award.responseDeadline})
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="success" onClick={() => setShowAcceptModal(true)}>
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                    Accept Award
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowRejectModal(true)}>
                    <XCircle className="w-3.5 h-3.5 mr-1.5" />
                    Decline
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Congratulations Message */}
        <Card className="mb-6">
          <CardBody>
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Congratulations!</h2>
              <p className="text-muted-foreground mb-1">
                Your quotation has been accepted by{' '}
                <span className="font-semibold">{award.organization?.name}</span>
              </p>
              {hasValue(award.notificationDate) && (
                <p className="text-sm text-muted-foreground">
                  Notification sent on {award.notificationDate}
                </p>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Award Summary */}
        <Card className="mb-6">
          <CardHeader title="Award Summary" />
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Project Title</p>
                  <p className="font-semibold text-foreground">{award.title}</p>
                  {hasValue(award.description) && (
                    <p className="text-sm text-muted-foreground mt-1">{award.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Organization</p>
                  <p className="font-semibold text-foreground">{award.organization?.name}</p>
                  {hasValue(award.organization?.address) && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {award.organization?.address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-6 pt-6 border-t border-border">
              {awardedAmountLabel && (
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-success mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Contract Value</p>
                    <p className="text-xl font-semibold text-success">{awardedAmountLabel}</p>
                  </div>
                </div>
              )}
              {(hasValue(award.awardDate) || hasValue(award.validUntil)) && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Award Date</p>
                    {hasValue(award.awardDate) && (
                      <p className="font-semibold text-foreground">{award.awardDate}</p>
                    )}
                    {hasValue(award.validUntil) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Valid until {award.validUntil}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {hasValue(award.deliveryTimeline) && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Delivery Timeline</p>
                    <p className="font-semibold text-foreground">{award.deliveryTimeline}</p>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Contract Items */}
        {hasItems && (
          <Card className="mb-6">
            <CardHeader title="Contract Items" description="Detailed breakdown of awarded items" />
            <CardBody>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Item Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Item Details
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Specifications
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                        Qty
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
                    {items.map((item, index) => (
                      <tr key={index} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                          {item.name || item.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                          {item.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {item.specification || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-foreground">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-foreground">
                          {formatCurrency(item.unitPrice) || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-foreground">
                          {formatCurrency(item.total) || '-'}
                        </td>
                      </tr>
                    ))}
                    {awardedAmountLabel && (
                      <tr className="bg-muted/30">
                        <td
                          colSpan={5}
                          className="px-4 py-3 text-sm font-semibold text-foreground text-right"
                        >
                          Total Contract Value:
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-success text-right">
                          {awardedAmountLabel}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Delivery Schedule */}
        {hasDeliverySchedule && (
          <Card className="mb-6">
            <CardHeader title="Delivery Schedule" description="Phased delivery timeline" />
            <CardBody>
              <div className="space-y-4">
                {deliverySchedule.map((phase, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 border border-border rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-semibold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground mb-1">{phase.phase}</p>
                      <p className="text-sm text-muted-foreground">{phase.items}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{phase.quantity} items</p>
                      <p className="text-xs text-muted-foreground">{phase.deadline}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Terms & Conditions */}
        {(hasTerms || hasContractMeta) && (
          <Card className="mb-6">
            <CardHeader
              title="Terms & Conditions"
              description="Please review all terms carefully before accepting"
            />
            <CardBody>
              {hasTerms && (
                <div className="space-y-3">
                  {terms.map((term, index) => (
                    <div key={index} className="flex gap-3 text-sm">
                      <span className="text-muted-foreground font-medium">{index + 1}.</span>
                      <p className="text-foreground">{term}</p>
                    </div>
                  ))}
                </div>
              )}

              {hasContractMeta && (
                <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  {hasValue(award.paymentTerms) && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Payment Terms</p>
                      <p className="text-sm text-muted-foreground">{award.paymentTerms}</p>
                    </div>
                  )}
                  {hasValue(award.warrantyPeriod) && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Warranty Period</p>
                      <p className="text-sm text-muted-foreground">{award.warrantyPeriod}</p>
                    </div>
                  )}
                  {hasValue(award.deliveryAddress) && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Delivery Address</p>
                      <p className="text-sm text-muted-foreground">{award.deliveryAddress}</p>
                    </div>
                  )}
                  {hasValue(award.validFrom) && hasValue(award.validUntil) && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Contract Validity</p>
                      <p className="text-sm text-muted-foreground">
                        {award.validFrom} to {award.validUntil}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Contact Information */}
        {hasContactInfo && (
          <Card className="mb-6">
            <CardHeader
              title="Contact Information"
              description="For any questions or clarifications"
            />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {hasValue(award.contactInfo?.procurementOfficer) && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Procurement Officer</p>
                      <p className="font-medium text-foreground">
                        {award.contactInfo?.procurementOfficer}
                      </p>
                    </div>
                  </div>
                )}
                {hasValue(award.contactInfo?.email) && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <p className="font-medium text-foreground">{award.contactInfo?.email}</p>
                    </div>
                  </div>
                )}
                {hasValue(award.contactInfo?.phone) && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Phone</p>
                      <p className="font-medium text-foreground">{award.contactInfo?.phone}</p>
                    </div>
                  </div>
                )}
                {hasValue(award.contactInfo?.officeHours) && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Office Hours</p>
                      <p className="font-medium text-foreground">
                        {award.contactInfo?.officeHours}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Actions */}
        {award.acceptanceStatus === 'pending' && (
          <div className="flex gap-4 justify-center">
            <Button variant="outline" size="lg" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Print Award Letter
            </Button>
            <Button variant="outline" size="lg">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="error" size="lg" onClick={() => setShowRejectModal(true)}>
              <XCircle className="w-4 h-4 mr-2" />
              Decline Award
            </Button>
            <Button variant="success" size="lg" onClick={() => setShowAcceptModal(true)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept Award
            </Button>
          </div>
        )}
      </div>

      {/* Accept Confirmation Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader
              title="Accept Contract Award"
              description="Confirm your acceptance of this contract"
            />
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-success/5 border border-success/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">You are accepting:</p>
                    <p className="text-sm text-foreground">{award.title}</p>
                    {awardedAmountLabel && (
                      <p className="text-sm font-semibold text-success mt-2">
                        Contract Value: {awardedAmountLabel}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  By accepting this award, you confirm that you agree to all terms and conditions
                  and will commence delivery as per the agreed timeline.
                </p>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAcceptModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="success" onClick={handleAccept}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Acceptance
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader
              title="Decline Contract Award"
              description="Please provide a reason for declining"
            />
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-error/5 border border-error/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-error mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">You are declining:</p>
                    <p className="text-sm text-foreground">{award.title}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Reason for Declining *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please explain why you are declining this award..."
                    rows={4}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="error" onClick={handleReject}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Confirm Decline
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
