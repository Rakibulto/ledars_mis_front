'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Printer, Download, ArrowLeft } from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, extractErrorMessage } from 'src/actions/ledars-hook';

import { Button } from '../../components/ui/button';
import { downloadFileFromEndpoint } from './export-utils';

function formatBDT(amount) {
  const value = Number(amount) || 0;
  if (value >= 10000000) return `\u09F3${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `\u09F3${(value / 100000).toFixed(2)} Lakh`;
  return `\u09F3${value.toLocaleString('en-IN')}`;
}

function formatDisplayDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function splitTerms(terms) {
  if (Array.isArray(terms)) {
    return terms.flatMap((entry) =>
      String(entry || '')
        .split('\n')
        .map((term) => term.trim())
        .filter(Boolean)
    );
  }

  return String(terms || '')
    .split('\n')
    .map((term) => term.trim())
    .filter(Boolean);
}

const LESS_THAN_TWENTY = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitWords(value) {
  if (value < 20) return LESS_THAN_TWENTY[value];
  const ten = Math.floor(value / 10);
  const unit = value % 10;
  return unit ? `${TENS[ten]} ${LESS_THAN_TWENTY[unit]}` : TENS[ten];
}

function threeDigitWords(value) {
  if (value < 100) return twoDigitWords(value);
  const hundred = Math.floor(value / 100);
  const remainder = value % 100;
  return remainder
    ? `${LESS_THAN_TWENTY[hundred]} Hundred ${twoDigitWords(remainder)}`
    : `${LESS_THAN_TWENTY[hundred]} Hundred`;
}

function amountToWords(value) {
  const amount = Math.round(Number(value) || 0);
  if (!amount) return 'Taka Zero Only';

  const parts = [];
  const crore = Math.floor(amount / 10000000);
  const lakh = Math.floor((amount % 10000000) / 100000);
  const thousand = Math.floor((amount % 100000) / 1000);
  const remainder = amount % 1000;

  if (crore) parts.push(`${threeDigitWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigitWords(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigitWords(thousand)} Thousand`);
  if (remainder) parts.push(threeDigitWords(remainder));

  return `Taka ${parts.join(' ')} Only`;
}

export function WorkOrderPrint() {
  const { id } = useParams();
  const router = useRouter();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const { data: workOrder, loading } = useGetRequest(
    id ? endpoints.procurement_management.work_order_by_id(id) : null
  );

  const wo = useMemo(() => {
    if (!workOrder || Array.isArray(workOrder)) return null;

    const organization = workOrder.organization || {};
    const vendor = workOrder.vendor || {};

    return {
      dbId: workOrder.id,
      id: workOrder.workOrderNumber || workOrder.id,
      poNumber: workOrder.workOrderNumber || workOrder.id,
      csNumber: workOrder.csNumber || '-',
      rfqNumber: workOrder.rfqNumber || '-',
      mrfNumber: workOrder.requisitionNumber || '-',
      awardNumber: workOrder.awardNumber || '-',
      orderDate: formatDisplayDate(workOrder.orderDate),
      deliveryDeadline: formatDisplayDate(workOrder.deliveryDeadline),
      title: workOrder.title || 'Work Order',
      category: workOrder.category || '-',
      budgetCode: workOrder.budgetCode || '-',
      project: workOrder.project || '-',
      org: {
        name: organization.name || 'Ledars NGO',
        nameBn: organization.nameBn || '',
        address: organization.address || '-',
        phone: organization.phone || '-',
        email: organization.email || '-',
        bin: organization.bin || '-',
      },
      vendor: {
        name: vendor.name || '-',
        contactPerson: vendor.contactPerson || '-',
        address: vendor.address || '-',
        phone: vendor.phone || '-',
        email: vendor.email || '-',
        tin: vendor.tin || '-',
        bin: vendor.bin || '-',
      },
      deliveryLocation: workOrder.deliveryLocation || '-',
      paymentTerms: workOrder.paymentTerms || '-',
      warrantyPeriod: workOrder.warrantyPeriod || '-',
      items: (workOrder.items || []).map((item, index) => ({
        sl: index + 1,
        description: item.description || item.name || '-',
        specification: item.specification || '-',
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        total: Number(item.total) || 0,
      })),
      totalAmount: Number(workOrder.totalAmount) || 0,
      termsAndConditions: splitTerms(workOrder.termsAndConditions),
      approvers: (workOrder.approvalChain || []).map((approval) => ({
        name: approval.approver || '-',
        role: approval.role || '-',
        action: approval.action || '-',
        date: approval.date || '-',
      })),
    };
  }, [workOrder]);

  const totalInWords = useMemo(() => amountToWords(wo?.totalAmount || 0), [wo?.totalAmount]);

  const handleDownloadPdf = async () => {
    if (!id || !wo) return;

    try {
      setDownloadingPdf(true);
      await downloadFileFromEndpoint(
        endpoints.procurement_management.work_order_download_pdf(id),
        `${wo.id}.pdf`
      );
      toast.success('Work order PDF downloaded.');
    } catch (error) {
      toast.error(extractErrorMessage(error?.response?.data || error));
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading print preview...</div>;
  }

  if (!wo) {
    return <div className="p-8 text-center text-muted-foreground">Work order not found.</div>;
  }

  return (
    <div>
      {/* Action Bar - Hidden in Print */}
      <div className="print:hidden p-4 bg-muted border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push(paths.dashboard.procurement.workOrders.detail(wo.dbId))}
            className="p-2 hover:bg-background rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-semibold text-foreground">{wo.id}</h2>
            <p className="text-sm text-muted-foreground">Print Preview</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print
          </Button>
          <Button size="sm" variant="primary" onClick={handleDownloadPdf} disabled={downloadingPdf}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {downloadingPdf ? 'Downloading...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Printable Content */}
      <div className="max-w-4xl mx-auto p-8 print:p-0 print:max-w-none">
        <div className="bg-white text-black print:shadow-none rounded-lg shadow-lg p-10 print:p-8">
          {/* Official Header */}
          <div className="text-center border-b-2 border-black pb-6 mb-6">
            <h1 className="text-2xl font-bold mb-1">{wo.org.name}</h1>
            <p className="text-base font-semibold mb-2">{wo.org.nameBn}</p>
            <p className="text-sm text-gray-600">{wo.org.address}</p>
            <p className="text-sm text-gray-600">
              Phone: {wo.org.phone} | Email: {wo.org.email}
            </p>
            <p className="text-sm text-gray-600">BIN: {wo.org.bin}</p>
            <div className="mt-4 inline-block border-2 border-black px-6 py-2">
              <h2 className="text-xl font-bold">WORK ORDER / PURCHASE ORDER</h2>
            </div>
          </div>

          {/* WO Details Box */}
          <div className="grid grid-cols-2 gap-6 mb-6 border border-gray-400 rounded p-4">
            <div className="space-y-2">
              <div className="flex">
                <span className="text-sm font-semibold w-32">WO Number:</span>
                <span className="text-sm font-bold">{wo.id}</span>
              </div>
              <div className="flex">
                <span className="text-sm font-semibold w-32">PO Number:</span>
                <span className="text-sm">{wo.poNumber}</span>
              </div>
              <div className="flex">
                <span className="text-sm font-semibold w-32">CS Reference:</span>
                <span className="text-sm">{wo.csNumber}</span>
              </div>
              <div className="flex">
                <span className="text-sm font-semibold w-32">RFQ Reference:</span>
                <span className="text-sm">{wo.rfqNumber}</span>
              </div>
              <div className="flex">
                <span className="text-sm font-semibold w-32">MRF Reference:</span>
                <span className="text-sm">{wo.mrfNumber}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex">
                <span className="text-sm font-semibold w-32">Order Date:</span>
                <span className="text-sm">{wo.orderDate}</span>
              </div>
              <div className="flex">
                <span className="text-sm font-semibold w-32">Delivery By:</span>
                <span className="text-sm font-bold">{wo.deliveryDeadline}</span>
              </div>
              <div className="flex">
                <span className="text-sm font-semibold w-32">Category:</span>
                <span className="text-sm">{wo.category}</span>
              </div>
              <div className="flex">
                <span className="text-sm font-semibold w-32">Budget Code:</span>
                <span className="text-sm">{wo.budgetCode}</span>
              </div>
              <div className="flex">
                <span className="text-sm font-semibold w-32">Project:</span>
                <span className="text-sm">{wo.project}</span>
              </div>
            </div>
          </div>

          {/* Vendor Info */}
          <div className="mb-6 border border-gray-400 rounded p-4">
            <h3 className="font-bold text-sm mb-3 pb-2 border-b border-gray-300">
              VENDOR INFORMATION
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex">
                  <span className="text-sm font-semibold w-28">Vendor:</span>
                  <span className="text-sm font-bold">{wo.vendor.name}</span>
                </div>
                <div className="flex">
                  <span className="text-sm font-semibold w-28">Contact:</span>
                  <span className="text-sm">{wo.vendor.contactPerson}</span>
                </div>
                <div className="flex">
                  <span className="text-sm font-semibold w-28">Address:</span>
                  <span className="text-sm">{wo.vendor.address}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex">
                  <span className="text-sm font-semibold w-28">Phone:</span>
                  <span className="text-sm">{wo.vendor.phone}</span>
                </div>
                <div className="flex">
                  <span className="text-sm font-semibold w-28">Email:</span>
                  <span className="text-sm">{wo.vendor.email}</span>
                </div>
                <div className="flex">
                  <span className="text-sm font-semibold w-28">TIN:</span>
                  <span className="text-sm">{wo.vendor.tin}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="mb-6 grid grid-cols-3 gap-4 border border-gray-400 rounded p-4">
            <div>
              <p className="text-sm font-semibold">Delivery Location:</p>
              <p className="text-sm">{wo.deliveryLocation}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Payment Terms:</p>
              <p className="text-sm">{wo.paymentTerms}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Warranty:</p>
              <p className="text-sm">{wo.warrantyPeriod}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-3">ORDER ITEMS</h3>
            <table className="w-full border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-3 py-2 text-left text-xs font-bold">
                    SL
                  </th>
                  <th className="border border-gray-400 px-3 py-2 text-left text-xs font-bold">
                    Item Name & Specifications
                  </th>
                  <th className="border border-gray-400 px-3 py-2 text-right text-xs font-bold">
                    Qty
                  </th>
                  <th className="border border-gray-400 px-3 py-2 text-right text-xs font-bold">
                    Unit Price (BDT)
                  </th>
                  <th className="border border-gray-400 px-3 py-2 text-right text-xs font-bold">
                    Total (BDT)
                  </th>
                </tr>
              </thead>
              <tbody>
                {wo.items.map((item) => (
                  <tr key={item.sl}>
                    <td className="border border-gray-400 px-3 py-2 text-sm">{item.sl}</td>
                    <td className="border border-gray-400 px-3 py-2">
                      <p className="text-sm font-medium">{item.name || item.description}</p>
                      <p className="text-xs text-gray-600">{item.specification}</p>
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-sm text-right">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-sm text-right">
                      {formatBDT(item.unitPrice)}
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-sm text-right font-medium">
                      {formatBDT(item.total)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={4} className="border border-gray-400 px-3 py-2 text-sm text-right">
                    GRAND TOTAL:
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-sm text-right">
                    {formatBDT(wo.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="text-sm mt-2">
              <span className="font-semibold">In Words:</span> {totalInWords}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              * VAT (15%) and AIT (3.5%) will be deducted at source as per NBR rules
            </p>
          </div>

          {/* Terms & Conditions */}
          <div className="mb-6 border border-gray-400 rounded p-4">
            <h3 className="font-bold text-sm mb-3 pb-2 border-b border-gray-300">
              TERMS & CONDITIONS
            </h3>
            <ol className="list-decimal list-inside space-y-1">
              {wo.termsAndConditions.map((tc, index) => (
                <li key={index} className="text-sm text-gray-800">
                  {tc}
                </li>
              ))}
            </ol>
          </div>

          {/* Vendor Signature */}
          <div className="mb-8 border border-gray-400 rounded p-4">
            <h3 className="font-bold text-sm mb-4 pb-2 border-b border-gray-300">
              VENDOR ACKNOWLEDGEMENT
            </h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-8">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Authorized Representative Name:</p>
                  <div className="border-b border-gray-400 min-h-[24px]" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Designation:</p>
                  <div className="border-b border-gray-400 min-h-[24px]" />
                </div>
              </div>
              <div className="space-y-8">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Signature & Seal:</p>
                  <div className="border border-gray-300 min-h-[60px] rounded" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Date:</p>
                  <div className="border-b border-gray-400 min-h-[24px]" />
                </div>
              </div>
            </div>
          </div>

          {/* AAB Approver Signatures */}
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-4">AUTHORIZED SIGNATURES (Ledars NGO)</h3>
            <div className="grid grid-cols-2 gap-6">
              {wo.approvers.map((approver, index) => (
                <div key={index} className="border border-gray-400 rounded p-4 space-y-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Signature:</p>
                    <div className="border-b border-gray-400 min-h-[40px]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{approver.name}</p>
                    <p className="text-xs text-gray-600">{approver.role}</p>
                    <p className="text-xs text-gray-500">{approver.action}</p>
                    <p className="text-xs text-gray-500">Date: {approver.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-black pt-4 mt-8 text-center">
            <p className="text-xs text-gray-500">
              This is a system-generated document from AAB Procurement Automation System.
            </p>
            <p className="text-xs text-gray-500">
              {wo.org.name} | {wo.org.address} | BIN: {wo.org.bin}
            </p>
            <p className="text-xs text-gray-500">| Ref: {wo.id}</p>
            <p className="text-xs text-gray-400 mt-2">
              Generated:{' '}
              {new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}{' '}
              | Ref: {wo.id}/{wo.poNumber}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
