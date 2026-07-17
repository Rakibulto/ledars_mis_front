'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Printer, ArrowLeft, CheckCircle } from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

function formatBDT(amount) {
  const value = Number(amount) || 0;
  if (value >= 10000000) return `৳${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `৳${(value / 100000).toFixed(2)} Lakh`;
  return `৳${value.toLocaleString('en-IN')}`;
}

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

const getStatusVariant = (status) => {
  switch (status) {
    case 'Verified':
      return 'success';
    case 'Rejected':
      return 'error';
    case 'Pending Verification':
    case 'Partially Verified':
      return 'warning';
    default:
      return 'default';
  }
};

const getItemLabel = (item) => {
  if (item.item_name) return item.item_name;
  if (item.remarks?.startsWith('Item: ')) {
    return item.remarks.split(' | ')[0].replace('Item: ', '');
  }
  return 'GRN line item';
};

const getItemNotes = (item) => {
  if (!item.remarks) return 'N/A';
  if (item.remarks.includes(' | ')) return item.remarks.split(' | ').slice(1).join(' | ');
  if (item.remarks.startsWith('Item: ')) return 'N/A';
  return item.remarks;
};

const getDisplayRejectedQuantity = (item) => {
  const explicitRejected = Number(item?.rejected_quantity ?? 0);
  if (explicitRejected > 0) return explicitRejected;

  const ordered = Number(item?.ordered_quantity ?? 0);
  const received = Number(item?.received_quantity ?? 0);
  if (ordered > received) return ordered - received;

  return 0;
};

export function GRNDetail() {
  const { id } = useParams();
  const { data: grn, loading } = useGetRequest(
    id ? endpoints.procurement_management.grn_by_id(id) : null
  );
  const { data: verificationResponse } = useGetRequest(
    id ? `${endpoints.procurement_management.grn_verifications}?pagination=false&grn=${id}` : null
  );

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <Card>
          <CardBody>
            <div className="py-12 text-center text-sm text-muted-foreground">Loading GRN...</div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!grn?.id) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <Card>
          <CardBody>
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Goods receive note not found.</p>
              <Link href={paths.dashboard.procurement.grn.list}>
                <Button variant="outline">Back to list</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const verifications = toList(verificationResponse);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={paths.dashboard.procurement.grn.list}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-foreground">{grn.grn_number}</h1>
              <Badge variant={getStatusVariant(grn.status)}>{grn.status}</Badge>
              <Badge variant="outline">{grn.item_count || 0} item(s)</Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {grn.supplier_name || grn.direct_vendor_name || 'Unknown supplier'} -{' '}
              {grn.wo_number || grn.dp_number || 'No reference'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {['Draft', 'Pending Verification', 'Partially Verified'].includes(grn.status) ? (
            <Link href={paths.dashboard.procurement.grn.verify(grn.id)}>
              <Button size="sm">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                Verify
              </Button>
            </Link>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardBody>
                <p className="text-xs text-muted-foreground mb-1">Received Value</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatBDT(grn.total_received_value)}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-muted-foreground mb-1">Invoice Amount</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatBDT(grn.invoice_amount)}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-muted-foreground mb-1">Receipt Date</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatDate(grn.receipt_date)}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-muted-foreground mb-1">Verifications</p>
                <p className="text-lg font-semibold text-foreground">{verifications.length}</p>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Receipt Information" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Supplier</p>
                  <p className="font-medium text-foreground">{grn.supplier_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Received By</p>
                  <p className="font-medium text-foreground">{grn.received_by_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Work Order</p>
                  <p className="font-medium text-foreground">{grn.wo_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Direct Purchase</p>
                  <p className="font-medium text-foreground">{grn.dp_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Delivery Note</p>
                  <p className="font-medium text-foreground">{grn.delivery_note_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Invoice Number</p>
                  <p className="font-medium text-foreground">{grn.invoice_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Goods Receive Location</p>
                  <p className="font-medium text-foreground">
                    {grn.receive_location_info?.name || 'N/A'}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {grn.remarks ? (
            <Card>
              <CardHeader title="Receipt Remarks" />
              <CardBody>
                <p className="text-sm text-foreground whitespace-pre-line">{grn.remarks}</p>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader
              title="Received Items"
              description={`${grn.item_count || 0} item(s) captured on the GRN`}
            />
            <CardBody>
              {grn.grn_items?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="py-2 pr-4">Item</th>
                        <th className="py-2 pr-4">Ordered</th>
                        <th className="py-2 pr-4">Received</th>
                        <th className="py-2 pr-4">Accepted</th>
                        <th className="py-2 pr-4">Rejected</th>
                        <th className="py-2 pr-4">Condition</th>
                        <th className="py-2">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grn.grn_items.map((item) => (
                        <tr key={item.id} className="border-b border-border/50 align-top">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-foreground">{getItemLabel(item)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {getItemNotes(item)}
                            </p>
                          </td>
                          <td className="py-3 pr-4">{item.ordered_quantity}</td>
                          <td className="py-3 pr-4">{item.received_quantity}</td>
                          <td className="py-3 pr-4">{item.accepted_quantity}</td>
                          <td className="py-3 pr-4">{getDisplayRejectedQuantity(item)}</td>
                          <td className="py-3 pr-4">
                            <Badge
                              variant={
                                item.condition === 'Good'
                                  ? 'success'
                                  : item.condition === 'Damaged'
                                    ? 'error'
                                    : 'warning'
                              }
                            >
                              {item.condition}
                            </Badge>
                          </td>
                          <td className="py-3">{formatBDT(item.total_value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No GRN items are attached to this record.
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
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Work Order</span>
                  {grn.work_order ? (
                    <Link
                      href={paths.dashboard.procurement.workOrders.detail(grn.work_order)}
                      className="text-primary hover:underline font-medium"
                    >
                      {grn.wo_number}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">N/A</span>
                  )}
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Direct Purchase</span>
                  {grn.direct_purchase ? (
                    <Link
                      href={paths.dashboard.procurement.directPurchase.detail(grn.direct_purchase)}
                      className="text-primary hover:underline font-medium"
                    >
                      {grn.dp_number}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">N/A</span>
                  )}
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium text-foreground">
                    {formatDate(grn.created_at, true)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Updated</span>
                  <span className="font-medium text-foreground">
                    {formatDate(grn.updated_at, true)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Verification Log"
              description="Latest inspection records attached to this GRN"
            />
            <CardBody>
              {verifications.length ? (
                <div className="space-y-3">
                  {verifications.map((verification) => (
                    <div key={verification.id} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="font-medium text-foreground">Inspection</p>
                        <Badge
                          variant={
                            verification.status === 'Passed'
                              ? 'success'
                              : verification.status === 'Failed'
                                ? 'error'
                                : verification.status === 'Conditional'
                                  ? 'warning'
                                  : 'outline'
                          }
                        >
                          {verification.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {formatDate(verification.inspection_date, true)}
                      </p>
                      <p className="text-sm text-foreground">
                        {verification.findings || 'No findings recorded.'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No verification records have been added yet.
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Status Summary" />
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Current Status</span>
                  <Badge variant={getStatusVariant(grn.status)}>{grn.status}</Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Verification Count</span>
                  <span className="font-medium text-foreground">{verifications.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Item Count</span>
                  <span className="font-medium text-foreground">{grn.item_count || 0}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
