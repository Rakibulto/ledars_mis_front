'use client';

import { use } from 'react';
import Link from 'next/link';
import { toWords } from 'number-to-words';
import {
  Edit,
  Clock,
  XCircle,
  Printer,
  FileText,
  ArrowLeft,
  ArrowRight,
  DollarSign,
  CheckCircle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { CONFIG } from 'src/config-global';
import { useGetRequest } from 'src/actions/ledars-hook';

import { Badge } from '../../_components/components/ui/badge';
import { Button } from '../../_components/components/ui/button';
import { Card, CardBody, CardHeader } from '../../_components/components/ui/card';

const STATUS_BADGE = {
  Draft: { variant: 'default', icon: FileText, className: '' },
  'Pending Approval': { variant: 'warning', icon: Clock, className: '' },
  Approved: { variant: 'success', icon: CheckCircle, className: '' },
  Rejected: {
    variant: 'danger',
    icon: XCircle,
    className: 'bg-red-100 text-red-700 border-red-400',
  },
  'Converted to GRN': { variant: 'success', icon: ArrowRight, className: '' },
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

  const totalAmountforTowords = Number(dp?.total_amount || 0);

  const amountInWords =
    totalAmountforTowords > 0
      ? `${toWords(totalAmountforTowords)
          .replace(/,/g, '')
          .replace(/^./, (c) => c.toUpperCase())} Taka only`
      : '';

  const handlePrint = () => {
    const baseUrl = CONFIG.appDomainUrl.replace(/\/+$/, '');
    /* ── helpers ──────────────────────────────────────────────────── */
    const escape = (v) =>
      String(v ?? '')
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"');

    /* ── derived header values (no field name changes) ───────────── */
    const projectName = dp?.project_info?.name || dp?.project || '';
    const deptName = dp?.department_name || '';
    const reqOfficeName = dp?.requesting_office_info?.name || '';
    const requesterName = dp?.created_by_username || '';
    const approver1Name = dp?.approver1_info?.employee_name || '';
    const approver2Name = dp?.approver2_info?.employee_name || '';
    const createdDate = fmtDate(dp?.created_at);

    /* ── items: pad to minimum 14 rows so blank lines always render ─ */
    const MIN_ROWS = 14;
    const srcItems = dp?.dp_items ?? [];
    const dpItems = srcItems.map((item, idx) => ({
      sl: idx + 1,
      description: item?.description || item?.item_name || '',
      specification: item?.specification || '',
      unit: item?.unit || '',
      qty: item?.quantity || 0,
      rate: item?.unit_price || 0,
      amount: item?.extended_amount || (item?.quantity || 0) * (item?.unit_price || 0),
      current_stock: item?.current_stock || '',
    }));
    const paddedRows = [...dpItems, ...Array(Math.max(0, MIN_ROWS - dpItems.length)).fill(null)];

    const boqRows = paddedRows
      .map(
        (item) => `
      <tr>
        <td class="tc">${item ? escape(item.sl) : ''}</td>
        <td>${
          item
            ? escape(item.description) +
              (item.specification
                ? `<br><span class="spec">${escape(item.specification)}</span>`
                : '')
            : ''
        }</td>
        <td class="tc">${
          item ? [escape(item.qty), escape(item.unit)].filter(Boolean).join(' ') : ''
        }</td>
        <td class="tc">${item ? escape(item.current_stock) : ''}</td>
        <td class="tr">${item ? escape(Number(item.rate ?? 0).toLocaleString()) : ''}</td>
        <td class="tr">${item ? escape(Number(item.amount ?? 0).toLocaleString()) : ''}</td>
      </tr>`
      )
      .join('');

    /* ── full HTML ───────────────────────────────────────────────── */
    const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>${escape(dp?.dp_number)} — ক্রয় চাহিদা পত্র</title>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap"
  >
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Sans Bengali', Arial, sans-serif;
      font-size: 10px;
      color: #000;
      background: #fff;
      padding: 22px 28px;
    }
    .org-wrap { display: flex; align-items: center; margin-bottom: 3px; }
    .org-logo { width: 64px; flex-shrink: 0; display: flex; align-items: center; justify-content: flex-start; }
    .org-logo img { width: 58px; height: 58px; object-fit: contain; }
    .org-center { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; }
    .org-spacer { width: 64px; flex-shrink: 0; }
    .org-name-img { max-height: 54px; width: auto; object-fit: contain; display: block; }
    .org-web { font-size: 10px; text-decoration: underline; color: #0000cc; margin-top: 2px; }
    .rule { border-top: 3px solid #000; margin: 5px 0 6px; }
    .title-wrap { text-align: center; margin-bottom: 9px; }
    .title-box {
      display: inline-block; background: #1c1c1c; color: #fff;
      font-size: 12px; font-weight: 700; padding: 5px 22px; border-radius: 4px;
    }
    .info-strip { display: flex; margin-bottom: 10px; }
    .info-chunk { flex: 1; display: flex; gap: 3px; margin-right: 10px; }
    .info-chunk:last-child { margin-right: 0; }
    .i-lbl { font-weight: 700; white-space: nowrap; font-size: 10px; }
    .i-val { flex: 1; font-size: 10px; border-bottom: 0.7px solid #000; padding-bottom: 1px; min-height: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
    table th, table td { border: 0.7px solid #000; padding: 2px 4px; font-size: 10px; }
    table th { font-weight: 700; text-align: center; background: #fff; }
    .tc { text-align: center; }
    .tr { text-align: right; }
    .bold { font-weight: 700; }
    .spec { color: #444; font-size: 8.5px; }
    .ap-role { width: 90px; font-weight: 700; }
    .ap-sig { width: 110px; }
    .ap-date { width: 90px; }
    .it-sl { width: 30px; }
    .it-qty { width: 68px; }
    .it-stock { width: 65px; }
    .it-rate { width: 62px; }
    .it-budget { width: 74px; }
    .items-tbl td { min-height: 18px; height: 18px; }
    .field-row { display: flex; gap: 4px; margin-bottom: 5px; }
    .f-lbl { font-weight: 700; white-space: nowrap; font-size: 10px; }
    .f-val { flex: 1; font-size: 10px; border-bottom: 0.7px solid #000; padding-bottom: 1px; min-height: 14px; }
    .shade-strip { display: flex; gap: 4px; background: #d4d4d4; border: 0.7px solid #000; padding: 3px 5px; margin-bottom: 3px; font-size: 10px; }
    .s-lbl { font-weight: 700; white-space: nowrap; }
    .s-val { flex: 1; }
    .two-col { display: flex; justify-content: space-between; margin: 12px 0 3px; }
    .half { width: 48%; display: flex; gap: 4px; }
    .sig-wrap { display: flex; justify-content: space-between; margin-top: 10px; }
    .sig-block { width: 44%; }
    .sig-line { display: flex; gap: 4px; margin-bottom: 8px; }
    .sig-lbl { font-weight: 700; width: 48px; flex-shrink: 0; font-size: 10px; }
    .sig-val { flex: 1; font-size: 10px; border-bottom: 0.7px solid #000; padding-bottom: 1px; min-height: 14px; }
    @media print {
      body { padding: 0; }
      @page { size: A4; margin: 1.1cm 1.2cm; }
    }
  </style>
</head>
<body>
  <div class="org-wrap">
    <div class="org-logo">
      <img src="${baseUrl}/icons/logo.png" alt="LEDARS Logo" onerror="this.style.display='none'">
    </div>
    <div class="org-center">
      <img class="org-name-img" src="${baseUrl}/icons/name_img.png" alt="LEDARS — Shyamnagar, Satkhira." onerror="this.style.display='none'">
      <div class="org-web">www.ledars.org</div>
    </div>
    <div class="org-spacer"></div>
  </div>
  <div class="rule"></div>
  <div class="title-wrap">
    <span class="title-box">ক্রয় চাহিদা পত্র</span>
  </div>
  <div class="info-strip">
    <div class="info-chunk">
      <span class="i-lbl">চাহিদাপত্র নং :</span>
      <span class="i-val">${escape(dp?.dp_number)}</span>
    </div>
    <div class="info-chunk">
      <span class="i-lbl">প্রকল্পের নাম :</span>
      <span class="i-val">${escape(projectName)}</span>
    </div>
    <div class="info-chunk">
      <span class="i-lbl">তারিখ :</span>
      <span class="i-val">${escape(createdDate)}</span>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th class="ap-role"></th>
        <th class="ap-name">নাম</th>
        <th class="ap-sig">স্বাক্ষর</th>
        <th class="ap-date">তারিখ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="ap-role bold">অনুরোধকারী</td>
        <td>${escape(requesterName)}</td>
        <td></td>
        <td>${escape(createdDate)}</td>
      </tr>
      <tr>
        <td class="ap-role bold">সুপারিশকারী</td>
        <td>${escape(approver1Name)}</td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td class="ap-role bold">অনুমোদনকারী</td>
        <td>${escape(approver2Name)}</td>
        <td></td>
        <td></td>
      </tr>
    </tbody>
  </table>
  <table class="items-tbl">
    <thead>
      <tr>
        <th class="it-sl">ক্র.নং</th>
        <th>বিবরণ</th>
        <th class="it-qty">চাহিদার<br>পরিমাণ</th>
        <th class="it-stock">বর্তমান<br>মজুদ</th>
        <th class="it-rate">একক দর</th>
        <th class="it-budget">বাজেটকৃত<br>অর্থ</th>
      </tr>
    </thead>
    <tbody>
      ${boqRows}
    </tbody>
    <tfoot>
      <tr>
        <td></td>
        <td class="tc bold">মোট</td>
        <td></td>
        <td></td>
        <td></td>
        <td class="tr bold">
          ${escape(Number(dp?.total_amount ?? 0).toLocaleString())}
        </td>
      </tr>
    </tfoot>
  </table>
  <div class="field-row">
    <span class="f-lbl">কথায় :</span>
    <span class="f-val">${escape(amountInWords)}</span>
  </div>
  <div class="field-row">
    <span class="f-lbl">মন্তব্য :</span>
    <span class="f-val">${escape(dp?.special_instruction || dp?.remarks || '')}</span>
  </div>
  <div class="shade-strip">
    <span class="s-lbl">হিসাব বিভাগ :</span>
    <span class="s-val">${escape(deptName)}</span>
  </div>
  <div class="shade-strip">
    <span class="s-lbl">প্রকল্প বাস্তবায়ন বিভাগ :</span>
    <span class="s-val">${escape(reqOfficeName)}</span>
  </div>
  <div class="two-col">
    <div class="half">
      <span class="f-lbl">ক্রয়কারী :</span>
      <span class="f-val">${escape(dp?.contact_person || '')}</span>
    </div>
    <div class="half">
      <span class="f-lbl">গ্রহণকারী :</span>
      <span class="f-val"></span>
    </div>
  </div>
  <div class="sig-wrap">
    <div class="sig-block">
      <div class="sig-line"><span class="sig-lbl">স্বাক্ষর :</span><span class="sig-val"></span></div>
      <div class="sig-line"><span class="sig-lbl">নাম :</span><span class="sig-val">${escape(requesterName)}</span></div>
      <div class="sig-line"><span class="sig-lbl">পদবী :</span><span class="sig-val"></span></div>
      <div class="sig-line"><span class="sig-lbl">তারিখ :</span><span class="sig-val">${escape(createdDate)}</span></div>
    </div>
    <div class="sig-block">
      <div class="sig-line"><span class="sig-lbl">স্বাক্ষর :</span><span class="sig-val"></span></div>
      <div class="sig-line"><span class="sig-lbl">নাম :</span><span class="sig-val"></span></div>
      <div class="sig-line"><span class="sig-lbl">পদবী :</span><span class="sig-val"></span></div>
      <div class="sig-line"><span class="sig-lbl">তারিখ :</span><span class="sig-val"></span></div>
    </div>
  </div>
</body>
</html>`;

    /* ── open print window ─────────────────────────────────────────── */
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 900);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground text-sm">
        <Clock className="w-4 h-4 mr-2 animate-spin" />
        Loading…
      </div>
    );
  }

  if (!dp) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-muted-foreground">
        <FileText className="w-8 h-8 opacity-30" />
        <p className="text-sm">Direct Purchase not found.</p>
        <Link href={paths.dashboard.procurement.directPurchase.list}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_BADGE[dp.status] ?? { variant: 'default', icon: FileText };
  const StatusIcon = statusCfg.icon;

  const totalAmount =
    dp.total_amount ??
    dp.dp_items?.reduce(
      (acc, item) => acc + (parseFloat(item.unit_price) || 0) * (parseFloat(item.quantity) || 0),
      0
    ) ??
    0;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={paths.dashboard.procurement.directPurchase.list}>
            <Button
              className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
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
            <StatusIcon className="w-3 h-3 mr-1 inline" />
            {dp.status}
          </Badge>
          <Badge variant={PRIORITY_BADGE[dp.priority] ?? 'default'} size="sm">
            {dp.priority || '—'}
          </Badge>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Link href={`${paths.dashboard.procurement.directPurchase.create}?edit=${id}`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="mb-4">
        <CardHeader title="Basic Information" />
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <Field label="DP Number" value={dp.dp_number} />
            <Field label="Status" value={dp.status} />
            <Field label="Priority" value={dp.priority} />
            <Field label="Fiscal Year" value={dp.fiscal_year} />
            <Field label="Department" value={dp.department_name} />
            <Field label="Category" value={dp.category_name} />
            <Field label="Shop / Seller" value={dp.shop_name} />
            <Field label="Reference No." value={dp.reference_number} />
            <Field label="Purchase Date" value={fmtDate(dp.purchase_date)} />
            <Field label="Delivery By" value={fmtDate(dp.expected_delivery_date)} />
            <Field label="Payment Terms" value={dp.payment_terms} />
            <Field label="Created By" value={dp.created_by_username} />
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
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                      Item Id
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                      Item Name
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Unit</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dp.dp_items.map((item, idx) => (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{item.item || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                        <p>{item.description || '—'}</p>
                        {item.specification && (
                          <p className="text-xs mt-0.5 opacity-70">{item.specification}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.unit || '—'}</td>
                      <td className="px-4 py-3 text-right">{item.quantity ?? '—'}</td>
                      <td className="px-4 py-3 text-right">{fmtAmount(item.unit_price)}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {fmtAmount(item.extended_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50 border-t border-border">
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-right">
                      Total Amount
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-base">
                      {fmtAmount(totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
              <FileText className="w-5 h-5 opacity-30" />
              No items added
            </div>
          )}
        </CardBody>
      </Card>

      {/* Additional Details */}
      {(dp.specifications ||
        dp.preferred_brand ||
        dp.warranty_period ||
        dp.contact_person ||
        dp.special_instruction ||
        dp.remarks) && (
        <Card className="mb-4">
          <CardHeader title="Additional Details" />
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {dp.specifications && <Field label="Specifications" value={dp.specifications} />}
              {dp.preferred_brand && <Field label="Preferred Brand" value={dp.preferred_brand} />}
              {dp.warranty_period && <Field label="Warranty Period" value={dp.warranty_period} />}
              {dp.contact_person && <Field label="Contact Person" value={dp.contact_person} />}
              {dp.contact_phone && <Field label="Contact Phone" value={dp.contact_phone} />}
              {dp.payment_terms && <Field label="Payment Terms" value={dp.payment_terms} />}
            </div>
            {dp.special_instruction && (
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">
                  Special Instructions
                </p>
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
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                      Comments
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dp.status_logs.map((log) => (
                    <tr key={log.id} className="border-b border-border hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">{log.from_status || '—'}</td>
                      <td className="px-4 py-3 font-medium">{log.to_status}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.changed_by_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {fmtDate(log.changed_at)}
                      </td>
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
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
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
