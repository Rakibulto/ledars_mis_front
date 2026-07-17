'use client';

import Link from 'next/link';
import { use } from 'react';
import {
  Edit,
  Clock,
  XCircle,
  FileText,
  ArrowLeft,
  CheckCircle,
  ArrowRight,
  DollarSign,
} from 'lucide-react';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { paths } from 'src/routes/paths';

import { Badge } from '../../_components/components/ui/badge';
import { Button } from '../../_components/components/ui/button';
import { Card, CardBody, CardHeader } from '../../_components/components/ui/card';

const STATUS_BADGE = {
  Draft:            { variant: 'default',  icon: FileText,    className: '' },
  'Pending Approval':{ variant: 'warning', icon: Clock,       className: '' },
  Approved:         { variant: 'success',  icon: CheckCircle, className: '' },
  Rejected:         { variant: 'danger',   icon: XCircle,     className: 'bg-red-100 text-red-700 border-red-400' },
  'Converted to GRN':{ variant: 'success', icon: ArrowRight,  className: '' },
};

const PRIORITY_BADGE = { Urgent: 'danger', High: 'warning', Medium: 'info', Low: 'default' };

function fmtDate(iso) {
  if (!iso) return '—';
  return iso.split('T')[0];
}

function fmtAmount(val) {
  const n = parseFloat(val);
  if (Number.isNaN(n)) return '—';
  return `৳\u202f${n.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm text-foreground">{value || '—'}</p>
    </div>
  );
}

export default function DirectPurchaseDetailPage({ params }) {
  const { id } = use(params);
  const url = `${endpoints.procurement_management.direct_purchases}${id}/`;
  const { data: dp, loading } = useGetRequest(url);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground text-sm">
        <Clock className="w-4 h-4 mr-2 animate-spin" />Loading…
      </div>
    );
  }

  if (!dp) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-muted-foreground">
        <FileText className="w-8 h-8 opacity-30" />
        <p className="text-sm">Direct Purchase not found.</p>
        <Link href={paths.dashboard.procurement.directPurchase.list}>
          <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back to List</Button>
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_BADGE[dp.status] ?? { variant: 'default', icon: FileText };
  const StatusIcon = statusCfg.icon;

  const totalAmount = dp.total_amount ?? dp.dp_items?.reduce(
    (acc, item) => acc + (parseFloat(item.unit_price) || 0) * (parseFloat(item.quantity) || 0), 0
  ) ?? 0;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={paths.dashboard.procurement.directPurchase.list}>
            <button className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Back">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-foreground font-mono">
              {dp.dp_number || `DP-${id}`}
            </h1>
            <p className="text-sm text-muted-foreground">Direct Purchase Detail</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusCfg.variant} size="sm" className={statusCfg.className}>
            <StatusIcon className="w-3 h-3 mr-1 inline" />{dp.status}
          </Badge>
          <Badge variant={PRIORITY_BADGE[dp.priority] ?? 'default'} size="sm">{dp.priority || '—'}</Badge>
          <Link href={`${paths.dashboard.procurement.directPurchase.create}?edit=${id}`}>
            <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-2" />Edit</Button>
          </Link>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="mb-4">
        <CardHeader title="Basic Information" />
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <Field label="DP Number"       value={dp.dp_number} />
            <Field label="Status"          value={dp.status} />
            <Field label="Priority"        value={dp.priority} />
            <Field label="Fiscal Year"     value={dp.fiscal_year} />
            <Field label="Department"      value={dp.department_name} />
            <Field label="Category"        value={dp.category_name} />
            <Field label="Shop / Seller"   value={dp.shop_name} />
            <Field label="Reference No."   value={dp.reference_number} />
            <Field label="Purchase Date"   value={fmtDate(dp.purchase_date)} />
            <Field label="Delivery By"     value={fmtDate(dp.expected_delivery_date)} />
            <Field label="Payment Terms"   value={dp.payment_terms} />
            <Field label="Created By"      value={dp.created_by_username} />
          </div>
          {dp.purpose && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Purpose</p>
              <p className="text-sm text-foreground">{dp.purpose}</p>
            </div>
          )}
          {dp.justification && (
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Justification</p>
              <p className="text-sm text-foreground">{dp.justification}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* BOQ Items */}
      <Card className="mb-4">
        <CardHeader
          title={`Bill of Quantities (${dp.dp_items?.length ?? 0} items)`}
          description="Items included in this direct purchase"
        />
        <CardBody className="p-0">
          {dp.dp_items?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">#</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Item Id</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Item Name</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Unit</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Qty</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Unit Price</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {dp.dp_items.map((item, idx) => (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{item.item || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                        <p>{item.description || '—'}</p>
                        {item.specification && <p className="text-xs mt-0.5 opacity-70">{item.specification}</p>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.unit || '—'}</td>
                      <td className="px-4 py-3 text-right">{item.quantity ?? '—'}</td>
                      <td className="px-4 py-3 text-right">{fmtAmount(item.unit_price)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{fmtAmount(item.extended_amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50 border-t border-border">
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-right">Total Amount</td>
                    <td className="px-4 py-3 text-right font-bold text-base">{fmtAmount(totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
              <FileText className="w-5 h-5 opacity-30" />No items added
            </div>
          )}
        </CardBody>
      </Card>

      {/* Additional Details */}
      {(dp.specifications || dp.preferred_brand || dp.warranty_period || dp.contact_person || dp.special_instruction || dp.remarks) && (
        <Card className="mb-4">
          <CardHeader title="Additional Details" />
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {dp.specifications    && <Field label="Specifications"  value={dp.specifications} />}
              {dp.preferred_brand   && <Field label="Preferred Brand" value={dp.preferred_brand} />}
              {dp.warranty_period   && <Field label="Warranty Period" value={dp.warranty_period} />}
              {dp.contact_person    && <Field label="Contact Person"  value={dp.contact_person} />}
              {dp.contact_phone     && <Field label="Contact Phone"   value={dp.contact_phone} />}
              {dp.payment_terms     && <Field label="Payment Terms"   value={dp.payment_terms} />}
            </div>
            {dp.special_instruction && (
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Special Instructions</p>
                <p className="text-sm text-foreground">{dp.special_instruction}</p>
              </div>
            )}
            {dp.remarks && (
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Remarks</p>
                <p className="text-sm text-foreground">{dp.remarks}</p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Status Log */}
      {dp.status_logs?.length > 0 && (
        <Card className="mb-4">
          <CardHeader title="Status History" />
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">From</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">To</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">By</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {dp.status_logs.map((log) => (
                    <tr key={log.id} className="border-b border-border hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">{log.from_status || '—'}</td>
                      <td className="px-4 py-3 font-medium">{log.to_status}</td>
                      <td className="px-4 py-3 text-muted-foreground">{log.changed_by_name || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(log.changed_at)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{log.comments || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2">
        <Link href={paths.dashboard.procurement.directPurchase.list}>
          <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back to List</Button>
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <DollarSign className="w-3.5 h-3.5" />
          <span>Created {fmtDate(dp.created_at)}</span>
          {dp.updated_at && dp.updated_at !== dp.created_at && (
            <span>· Updated {fmtDate(dp.updated_at)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
