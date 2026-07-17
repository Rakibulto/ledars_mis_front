'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toWords } from 'number-to-words';
import { useParams } from 'next/navigation';
import {
  Eye,
  Send,
  Bell,
  User,
  Clock,
  Stamp,
  Upload,
  XCircle,
  Printer,
  FileText,
  Download,
  ArrowLeft,
  UserCheck,
  RotateCcw,
  GitBranch,
  DollarSign,
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';

import { endpoints } from 'src/utils/axios';

import { CONFIG } from 'src/config-global';
import { useGetRequest } from 'src/actions/ledars-hook';

import { ApprovalModal } from './approval-modal';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

export function RequisitionDetail() {
  const params = useParams();

  const requisition_no = params?.id; // Assuming the URL is like /requisitions/[id], where [id] is the  replace requisition number
  console.log('Requisition No from URL:', requisition_no);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Fetch MRF data
  const {
    data: apiDataResponse,
    isLoading,
    error,
  } = useGetRequest(
    requisition_no
      ? `${endpoints.procurement_management.material_requisitions}?requisition_no=${requisition_no}`
      : null
  );

  const apiData = apiDataResponse?.[0] || null;
  console.log('api data:', apiData);
  const boqItems = useMemo(() => {
    if (!apiData?.mr_items || !Array.isArray(apiData?.mr_items)) return [];
    return apiData.mr_items.map((item, idx) => ({
      sl: idx + 1,
      description:
        item?.item_name || item?.requested_item_name || item?.requested_item_description || 'N/A',
      specification: item?.specifications || item?.specification || 'N/A',
      unit: item?.requested_unit || item?.unit || 'N/A',
      qty: item?.quantity || 0,
      rate: item?.requested_unit_price || item?.unit_price || 0,
      amount:
        item?.total_price ||
        (item?.quantity || 0) * (item?.requested_unit_price || item?.unit_price || 0),
      current_stock: item?.current_stock || '-',
    }));
  }, [apiData]);

  // Map approval workflow from status_logs
  const approvalWorkflow = useMemo(() => {
    if (!apiData?.status_logs || !Array.isArray(apiData.status_logs)) {
      return [
        {
          step: 1,
          title: 'Budget Clearance',
          role: 'Finance Focal',
          approver: 'N/A',
          designation: 'N/A',
          status: 'Pending Approval',
          date: null,
          comments: 'N/A',
          icon: DollarSign,
          color: 'text-blue-600 bg-blue-50 border-blue-200',
        },
        {
          step: 2,
          title: 'Endorsement',
          role: 'Area Manager',
          approver: 'N/A',
          designation: 'N/A',
          status: 'Pending Approval',
          date: null,
          comments: null,
          icon: UserCheck,
          color: 'text-purple-600 bg-purple-50 border-purple-200',
        },
        {
          step: 3,
          title: 'Final Approval',
          role: 'Head of Operations',
          approver: 'N/A',
          designation: 'N/A',
          status: 'Pending Approval',
          date: null,
          comments: null,
          icon: Stamp,
          color: 'text-green-600 bg-green-50 border-green-200',
        },
      ];
    }

    const statusMap = {
      draft: { step: 0, title: 'Draft', role: 'N/A', icon: FileText },
      submitted: { step: 1, title: 'Budget Clearance', role: 'Finance Focal', icon: DollarSign },
      budget_cleared: { step: 2, title: 'Endorsement', role: 'Area Manager', icon: UserCheck },
      endorsed: { step: 3, title: 'Final Approval', role: 'Head of Operations', icon: Stamp },
      approved: { step: 4, title: 'Approved', role: 'N/A', icon: CheckCircle },
      rejected: { step: 1, title: 'Rejected', role: 'N/A', icon: XCircle },
    };

    return apiData.status_logs.map((log, idx) => {
      const status = log.status || 'waiting';
      const config = statusMap[status] || {
        step: idx + 1,
        title: status,
        role: 'N/A',
        icon: FileText,
      };

      return {
        step: config.step,
        title: config.title,
        role: config.role,
        approver: log.approved_by_user?.name || log.approved_by || 'N/A',
        designation: log.approved_by_user?.designation || 'N/A',
        status:
          log.status === 'approved'
            ? 'approved'
            : log.status === 'rejected'
              ? 'rejected'
              : 'waiting',
        date: log.approved_at || null,
        comments: log.comments || null,
        icon: config.icon,
        color:
          log.status === 'approved'
            ? 'text-green-600 bg-green-50 border-green-200'
            : log.status === 'rejected'
              ? 'text-red-600 bg-red-50 border-red-200'
              : 'text-muted-foreground bg-muted/30 border-border',
      };
    });
  }, [apiData]);

  // Map notifications from status_logs
  const notifications = useMemo(() => {
    if (!apiData?.status_logs || !Array.isArray(apiData.status_logs)) return [];

    return apiData.status_logs
      .map((log, idx) => ({
        id: idx + 1,
        event: `${log.status?.replace(/_/g, ' ').toUpperCase() || 'Status Updated'}`,
        recipient: log.approved_by_user?.name || log.approved_by || 'N/A',
        channel: 'Email + System',
        time: log.approved_at || '—',
        status: log.approved_at ? 'sent' : 'scheduled',
      }))
      .filter((n, idx, arr) => idx === arr.length - 1 || arr[idx + 1].time !== n.time);
  }, [apiData]);

  // Map attachments
  const attachments = useMemo(() => {
    const attachmentList = [];

    if (apiData?.attachments && Array.isArray(apiData.attachments)) {
      apiData.attachments.forEach((att) => {
        attachmentList.push({
          name: att.file?.name || att.file || 'N/A',
          size: att.file_size || 'N/A',
          type: att.attachment_type || 'Document',
          date: att.uploaded_at || att.created_at || 'N/A',
          url: att.file?.url || att.file || null,
        });
      });
    }

    if (apiData?.attachment && apiData.attachment) {
      const att = apiData.attachment;
      attachmentList.push({
        name: att.file?.name || att.file || 'N/A',
        size: att.file_size || 'N/A',
        type: att.attachment_type || 'Document',
        date: att.uploaded_at || att.created_at || 'N/A',
        url: att.file?.url || att.file || null,
      });
    }

    return attachmentList;
  }, [apiData]);

  // Map version history
  const versionHistory = useMemo(() => {
    if (!apiData?.version) return [];
    return [
      {
        version: apiData.version || 'v1.0',
        date: apiData.created_at || 'N/A',
        author: apiData.requester_info?.name || apiData.requester || 'N/A',
        changes: `Initial submission with ${apiData.mr_items?.length || 0} BOQ items, total ৳${apiData.total_amount?.toLocaleString() || 0}`,
      },
    ];
  }, [apiData]);

  // Comments from status logs
  const comments = useMemo(() => {
    if (!apiData?.status_logs || !Array.isArray(apiData.status_logs)) return [];

    return apiData.status_logs
      .filter((log) => log.comments)
      .map((log, idx) => ({
        id: idx + 1,
        author: log.approved_by_user?.name || log.approved_by || 'N/A',
        role: log.approved_by_user?.designation || 'Approver',
        date: log.approved_at || 'N/A',
        text: log.comments || 'N/A',
      }));
  }, [apiData]);

  const totalAmount = Number(apiData?.total_amount || 0);

  const amountInWords =
    totalAmount > 0
      ? `${toWords(totalAmount)
          .replace(/,/g, '')
          .replace(/^./, (c) => c.toUpperCase())} Taka only`
      : '';

  const handlePrint = () => {
    const baseUrl = CONFIG.appDomainUrl.replace(/\/+$/, '');
    /* ── helpers ──────────────────────────────────────────────────── */
    const escape = (v) =>
      String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const extractName = (val) =>
      val && typeof val === 'object' ? String(val.name ?? val.username ?? '') : String(val ?? '');

    const fmtDate = (d) => {
      if (!d) return '';
      try {
        return new Date(d).toLocaleDateString('en-GB');
      } catch {
        return String(d);
      }
    };

    /* ── derived header values (no field name changes) ───────────── */
    const projectName = extractName(apiData?.project_info) || String(apiData?.project ?? '');
    const deptName = extractName(apiData?.department_name);
    const reqOfficeName = extractName(apiData?.requesting_office_info);
    const requesterName = extractName(apiData?.created_by);
    const approver1Name = extractName(apiData?.approver1_info);
    const approver2Name = extractName(apiData?.approver2_info);
    const createdDate = fmtDate(apiData?.created_at);

    /* ── items: pad to minimum 14 rows so blank lines always render ─ */
    const MIN_ROWS = 14;
    const srcItems = boqItems ?? [];
    const paddedRows = [...srcItems, ...Array(Math.max(0, MIN_ROWS - srcItems.length)).fill(null)];

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
  <title>${escape(apiData?.requisition_no)} — ক্রয় চাহিদা পত্র</title>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap"
  >
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Noto Sans Bengali', Arial, sans-serif;
      font-size: 10px;
      color: #000;
      background: #fff;
      padding: 22px 28px;
    }

    /* ── Org header ── */
    .org-wrap {
      display: flex;
      align-items: center;
      margin-bottom: 3px;
    }
    /* Logo sits on the left, fixed width */
    .org-logo {
      width: 64px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }
    .org-logo img {
      width: 58px;
      height: 58px;
      object-fit: contain;
    }
    /* Centre column takes remaining space */
    .org-center {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    /* Right spacer keeps centre column truly centred */
    .org-spacer {
      width: 64px;
      flex-shrink: 0;
    }
    /* name_img.png replaces the LEDARS + Shyamnagar, Satkhira. text */
    .org-name-img {
      max-height: 54px;
      width: auto;
      object-fit: contain;
      display: block;
    }
    .org-web { font-size: 10px; text-decoration: underline; color: #0000cc; margin-top: 2px; }
    .rule     { border-top: 3px solid #000; margin: 5px 0 6px; }

    /* ── Form title ── */
    .title-wrap { text-align: center; margin-bottom: 9px; }
    .title-box  {
      display: inline-block;
      background: #1c1c1c;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      padding: 5px 22px;
      border-radius: 4px;
    }

    /* ── Info strip ── */
    .info-strip { display: flex; margin-bottom: 10px; }
    .info-chunk {
      flex: 1;
      display: flex;
      gap: 3px;
      margin-right: 10px;
    }
    .info-chunk:last-child { margin-right: 0; }
    .i-lbl { font-weight: 700; white-space: nowrap; font-size: 10px; }
    .i-val {
      flex: 1;
      font-size: 10px;
      border-bottom: 0.7px solid #000;
      padding-bottom: 1px;
      min-height: 14px;
    }

    /* ── Tables shared ── */
    table               { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
    table th, table td  { border: 0.7px solid #000; padding: 2px 4px; font-size: 10px; }
    table th            { font-weight: 700; text-align: center; background: #fff; }
    .tc { text-align: center; }
    .tr { text-align: right; }
    .bold { font-weight: 700; }
    .spec { color: #444; font-size: 8.5px; }

    /* ── Approval table ── */
    .ap-role  { width: 90px; font-weight: 700; }
    .ap-name  { }
    .ap-sig   { width: 110px; }
    .ap-date  { width: 90px; }

    /* ── Items table ── */
    .it-sl     { width: 30px; }
    .it-qty    { width: 68px; }
    .it-stock  { width: 65px; }
    .it-rate   { width: 62px; }
    .it-budget { width: 74px; }
    .items-tbl td { min-height: 18px; height: 18px; }

    /* ── Below-table field rows ── */
    .field-row { display: flex; gap: 4px; margin-bottom: 5px; }
    .f-lbl {
      font-weight: 700;
      white-space: nowrap;
      font-size: 10px;
    }
    .f-val {
      flex: 1;
      font-size: 10px;
      border-bottom: 0.7px solid #000;
      padding-bottom: 1px;
      min-height: 14px;
    }

    /* ── Shaded dept strips ── */
    .shade-strip {
      display: flex;
      gap: 4px;
      background: #d4d4d4;
      border: 0.7px solid #000;
      padding: 3px 5px;
      margin-bottom: 3px;
      font-size: 10px;
    }
    .s-lbl { font-weight: 700; white-space: nowrap; }
    .s-val  { flex: 1; }

    /* ── Buyer / Receiver row ── */
    .two-col {
      display: flex;
      justify-content: space-between;
      margin: 12px 0 3px;
    
    }
    .half { width: 48%; display: flex; gap: 4px; }

    /* ── Signature section ── */
    .sig-wrap {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
    }
    .sig-block { width: 44%; }
    .sig-line  { display: flex; gap: 4px; margin-bottom: 8px; }
    .sig-lbl   {
      font-weight: 700;
      width: 48px;
      flex-shrink: 0;
      font-size: 10px;
    }
    .sig-val {
      flex: 1;
      font-size: 10px;
      border-bottom: 0.7px solid #000;
      padding-bottom: 1px;
      min-height: 14px;
    }

    /* ── Print ── */
    @media print {
      body { padding: 0; }
      @page { size: A4; margin: 1.1cm 1.2cm; }
    }
  </style>
</head>
<body>

  <!-- ═══════════════════ ORG HEADER ═══════════════════ -->
  <div class="org-wrap">
    <!-- Logo — left column -->
    <div class="org-logo">
      <img
        src="${baseUrl}/icons/logo.png"
        alt="LEDARS Logo"
        onerror="this.style.display='none'"
      >
    </div>

    <!-- Org name image (LEDARS + Shyamnagar, Satkhira.) + website — centre column -->
    <div class="org-center">
      <img
        class="org-name-img"
        src="${baseUrl}/icons/name_img.png"
        alt="LEDARS — Shyamnagar, Satkhira."
        onerror="this.style.display='none'"
      >
      <div class="org-web">www.ledars.org</div>
    </div>

    <!-- Spacer — right column (mirrors logo width to keep text truly centred) -->
    <div class="org-spacer"></div>
  </div>
  <div class="rule"></div>

  <!-- ═══════════════════ FORM TITLE ═══════════════════ -->
  <div class="title-wrap">
    <span class="title-box">ক্রয় চাহিদা পত্র</span>
  </div>

  <!-- ═══════════════════ INFO STRIP ═══════════════════ -->
  <div class="info-strip">
    <div class="info-chunk">
      <span class="i-lbl">চাহিদাপত্র নং :</span>
      <span class="i-val">${escape(apiData?.requisition_no)}</span>
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

  <!-- ═══════════════════ APPROVAL TABLE ═══════════════════ -->
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

  <!-- ═══════════════════ ITEMS TABLE ═══════════════════ -->
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
          ${escape(Number(apiData?.total_amount ?? 0).toLocaleString())}
        </td>
      </tr>
    </tfoot>
  </table>

  <!-- ═══════════════════ কথায় ═══════════════════ -->
  <div class="field-row">
    <span class="f-lbl">কথায় :</span>
    <span class="f-val">${escape(amountInWords)}</span>
  </div>

  <!-- ═══════════════════ মন্তব্য ═══════════════════ -->
  <div class="field-row">
    <span class="f-lbl">মন্তব্য :</span>
    <span class="f-val">${escape(apiData?.special_instruction)}</span>
  </div>

  <!-- ═══════════════════ SHADED DEPT STRIPS ═══════════════════ -->
  <div class="shade-strip">
    <span class="s-lbl">হিসাব বিভাগ :</span>
    <span class="s-val">${escape(deptName)}</span>
  </div>
  <div class="shade-strip">
    <span class="s-lbl">প্রকল্প বাস্তবায়ন বিভাগ :</span>
    <span class="s-val">${escape(reqOfficeName)}</span>
  </div>

  <!-- ═══════════════════ BUYER / RECEIVER ═══════════════════ -->
  <div class="two-col">
    <div class="half">
      <span class="f-lbl">ক্রয়কারী :</span>
      <span class="f-val">${escape(apiData?.contact_person)}</span>
    </div>
    <div class="half">
      <span class="f-lbl">গ্রহণকারী :</span>
      <span class="f-val"></span>
    </div>
  </div>

  <!-- ═══════════════════ SIGNATURE SECTION ═══════════════════ -->
  <div class="sig-wrap">

    <!-- Left — Requester -->
    <div class="sig-block">
      <div class="sig-line">
        <span class="sig-lbl">স্বাক্ষর :</span>
        <span class="sig-val"></span>
      </div>
      <div class="sig-line">
        <span class="sig-lbl">নাম :</span>
        <span class="sig-val">${escape(requesterName)}</span>
      </div>
      <div class="sig-line">
        <span class="sig-lbl">পদবী :</span>
        <span class="sig-val"></span>
      </div>
      <div class="sig-line">
        <span class="sig-lbl">তারিখ :</span>
        <span class="sig-val">${escape(createdDate)}</span>
      </div>
    </div>

    <!-- Right — Receiver -->
    <div class="sig-block">
      <div class="sig-line">
        <span class="sig-lbl">স্বাক্ষর :</span>
        <span class="sig-val"></span>
      </div>
      <div class="sig-line">
        <span class="sig-lbl">নাম :</span>
        <span class="sig-val"></span>
      </div>
      <div class="sig-line">
        <span class="sig-lbl">পদবী :</span>
        <span class="sig-val"></span>
      </div>
      <div class="sig-line">
        <span class="sig-lbl">তারিখ :</span>
        <span class="sig-val"></span>
      </div>
    </div>

  </div>

</body>
</html>`;

    /* ── open print window ─────────────────────────────────────────── */
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    // Wait for Noto Sans Bengali to load before triggering print
    setTimeout(() => win.print(), 900);
  };

  const tabs = [
    { id: 'details', label: 'MRF Details', icon: FileText },
    { id: 'boq', label: 'BOQ Items', icon: FileText },
    { id: 'workflow', label: 'Approval Workflow', icon: ShieldCheck },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'attachments', label: `Attachments (${attachments.length})`, icon: Upload },
    { id: 'versions', label: 'Version History', icon: GitBranch },
    { id: 'comments', label: `Comments (${comments.length})`, icon: MessageSquare },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading Material Requisition Details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !apiData) {
    return (
      <div className="p-4 md:p-8">
        <Link href="/dashboard/procurement/requisitions/list">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors mb-4">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
        </Link>
        <Card>
          <CardBody className="flex flex-col items-center justify-center gap-4 py-12">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                {error ? 'Error Loading Data' : 'Material Requisition Not Found'}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {error
                  ? 'An error occurred while loading the material requisition details.'
                  : 'The requested MRF could not be found.'}
              </p>
              <Link href="/dashboard/procurement/requisitions/list">
                <Button variant="primary">Back to List</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <Link href="/dashboard/procurement/requisitions/list">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          </Link>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl md:text-2xl font-semibold text-foreground">
                {apiData?.requisition_no}
              </h1>
              <Badge variant="default">{apiData?.version}</Badge>
              <Badge
                variant={
                  apiData?.status === 'endorsed' || apiData?.status === 'budget_cleared'
                    ? 'warning'
                    : apiData?.status === 'approved'
                      ? 'success'
                      : 'default'
                }
              >
                <UserCheck className="w-3 h-3 mr-1" />
                {apiData?.status?.replace(/_/g, ' ').toUpperCase()}
              </Badge>
              <Badge
                variant={
                  apiData?.priority === 'urgent'
                    ? 'danger'
                    : apiData?.priority === 'high'
                      ? 'warning'
                      : 'default'
                }
                size="sm"
              >
                {apiData?.priority} priority
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {apiData?.project} — {apiData?.category} — {apiData?.office}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            {/* <PDFDownloadLink
              document={<MrfPDF data={apiData} boqItems={boqItems} />}
              fileName={`${apiData?.requisition_no || 'MRF'}.pdf`}
              style={{ textDecoration: 'none' }}
            >
              {({ loading }) => (
                <Button variant="outline" size="sm" disabled={loading}>
                  <Download className="w-4 h-4 mr-2" />
                  {loading ? 'Generating…' : 'Export PDF'}
                </Button>
              )}
            </PDFDownloadLink> */}
            <Button variant="primary" size="sm" onClick={() => setShowApprovalModal(true)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Take Action
            </Button>
          </div>
        </div>

        {/* Workflow Progress Bar */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between overflow-x-auto">
              {[
                {
                  label: 'Submitted',
                  icon: Send,
                  done:
                    apiData?.status &&
                    ['submitted', 'budget_cleared', 'endorsed', 'approved', 'rejected'].includes(
                      apiData.status
                    ),
                  date: apiData?.created_at || '—',
                },
                {
                  label: 'Budget Clearance',
                  icon: DollarSign,
                  done:
                    apiData?.status &&
                    ['budget_cleared', 'endorsed', 'approved'].includes(apiData.status),
                  date:
                    apiData?.status_logs?.find((l) => l.status === 'budget_cleared')?.approved_at ||
                    'Pending',
                },
                {
                  label: 'Endorsement',
                  icon: UserCheck,
                  done: apiData?.status && ['endorsed', 'approved'].includes(apiData.status),
                  date:
                    apiData?.status_logs?.find((l) => l.status === 'endorsed')?.approved_at ||
                    'Pending',
                },
                {
                  label: 'Final Approval',
                  icon: Stamp,
                  done: apiData?.status === 'approved',
                  date:
                    apiData?.status_logs?.find((l) => l.status === 'approved')?.approved_at ||
                    'Waiting',
                },
                { label: 'Routed to Procurement', icon: ArrowRight, done: false, date: '—' },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.done
                          ? 'bg-green-500 text-white'
                          : apiData?.status === 'budget_cleared' && idx === 2
                            ? 'bg-primary text-white ring-4 ring-primary/20 animate-pulse'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {step.done ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <p
                      className={`text-xs font-medium mt-2 ${step.done ? 'text-green-600' : apiData?.status === 'budget_cleared' && idx === 2 ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{step.date}</p>
                  </div>
                  {idx < 4 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 ${step.done ? 'bg-green-400' : 'bg-muted'}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardBody>
            <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
            <p className="text-xl font-bold text-primary">
              ৳{apiData?.total_amount?.toLocaleString()}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-muted-foreground mb-1">BOQ Items</p>
            <p className="text-xl font-bold text-foreground">{apiData?.mr_items?.length || 0}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-muted-foreground mb-1">Approval Step</p>
            <p className="text-xl font-bold text-purple-600">
              {(() => {
                const statusMap = { submitted: 1, budget_cleared: 2, endorsed: 3, approved: 4 };
                const step = statusMap[apiData?.status] || 1;
                return `${step} of 3`;
              })()}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-muted-foreground mb-1">Days Elapsed</p>
            <p className="text-xl font-bold text-orange-600">
              {(() => {
                if (!apiData?.created_at) return '—';
                const created = new Date(apiData?.created_at);
                const today = new Date();
                const days = Math.floor((today - created) / (1000 * 60 * 60 * 24));
                return days;
              })()}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-muted-foreground mb-1">Attachments</p>
            <p className="text-xl font-bold text-foreground">{attachments.length + 1}</p>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabs?.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Basic Information" />
            <CardBody>
              <div className="space-y-3 text-sm">
                {[
                  ['MRF Number', apiData?.requisition_no],
                  ['Version', apiData?.version],
                  [
                    'Office',
                    `${apiData?.requesting_office_info?.name}-${apiData?.requesting_office_info?.address}`,
                  ],
                  ['Department', apiData?.department_name],
                  ['Project / Programme', apiData?.project_info?.name || apiData?.project],
                  ['Category', apiData?.category_name],
                  ['Fiscal Year', apiData?.fiscal_year],
                  ['Priority', apiData?.priority],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between py-1.5 border-b border-border/50"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Requester & Budget" />
            <CardBody>
              <div className="space-y-3 text-sm">
                {[
                  [
                    'Requester',
                    apiData?.created_by?.username || apiData?.created_by?.name || 'N/A',
                  ],
                  ['Designation', apiData?.created_by?.designation],
                  ['Email', apiData?.created_by?.email],
                  ['Budget Code', apiData?.budget_code_display?.name],
                  ['Donor Code', apiData?.donor_code_info?.name],
                  ['Account Head', apiData?.account_code_display?.name],
                  ['Date Created', apiData?.created_at],
                  ['Required By', apiData?.delivery_date],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between py-1.5 border-b border-border/50"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader title="Purpose / Justification" />
            <CardBody>
              <p className="text-sm text-foreground leading-relaxed">{apiData?.purpose}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Delivery Information" />
            <CardBody>
              <div className="space-y-3 text-sm">
                {[
                  ['Location', apiData?.delivery_location_info?.name || apiData?.delivery_location],
                  [
                    'Address',
                    apiData?.delivery_location_info?.address || apiData?.delivery_address,
                  ],
                  ['Contact Person', apiData?.contact_person],
                  ['Phone', apiData?.contact_phone],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between py-1.5 border-b border-border/50"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground text-right max-w-[200px]">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Special Instructions" />
            <CardBody>
              <p className="text-sm text-foreground">{apiData?.special_instructions}</p>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span
                  className="font-medium text-foreground  "
                  dangerouslySetInnerHTML={{
                    __html: apiData?.specifications || '-',
                  }}
                />
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'boq' && (
        <Card>
          <CardHeader
            title="Bill of Quantities (BOQ)"
            description={`${boqItems.length} line items — Total: ৳${apiData?.total_amount?.toLocaleString()}`}
            action={
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export BOQ
              </Button>
            }
          />
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-foreground text-left">
                      SL#
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-foreground text-left">
                      Item Name
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-foreground text-left">
                      Specifications
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-foreground text-center">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-foreground text-center">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-foreground text-right">
                      Rate (৳)
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-foreground text-right">
                      Amount (৳)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {boqItems?.map((item) => (
                    <tr
                      key={item?.sl}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-mono">{item?.sl}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {item?.description}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {item?.specification}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">{item?.unit}</td>
                      <td className="px-4 py-3 text-sm text-center font-semibold">
                        {item?.qty.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        ৳{item?.rate.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold font-mono">
                        ৳{item?.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-primary/5 border-t-2 border-primary">
                    <td colSpan={6} className="px-4 py-3 text-sm font-bold text-right">
                      Grand Total:
                    </td>
                    <td className="px-4 py-3 text-lg font-bold text-primary text-right font-mono">
                      ৳{apiData?.total_amount?.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'workflow' && (
        <div className="space-y-6">
          {/* 3-Level Approval Workflow */}
          <Card>
            <CardHeader
              title="3-Level Approval Workflow"
              description="Budget Clearance → Endorsement → Final Approval (as per authority matrix)"
              action={
                <Badge variant="warning">
                  <Clock className="w-3 h-3 mr-1" />
                  Step 2 of 3
                </Badge>
              }
            />
            <CardBody>
              <div className="space-y-4">
                {approvalWorkflow?.map((level, idx) => (
                  <div
                    key={idx}
                    className={`p-5 rounded-lg border-2 ${
                      level.status === 'approved'
                        ? 'border-green-200 bg-green-50/50'
                        : level.status === 'pending'
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center border ${level.color}`}
                      >
                        <level.icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-primary">
                                STEP {level.step}
                              </span>
                              <h3 className="text-base font-semibold text-foreground">
                                {level.title}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {level.role} — {level.approver} ({level.designation})
                            </p>
                          </div>
                          <div>
                            {level.status === 'approved' && (
                              <Badge variant="success">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approved
                              </Badge>
                            )}
                            {level.status === 'Pending Approval' && (
                              <Badge variant="warning">
                                <Clock className="w-3 h-3 mr-1 animate-pulse" />
                                Pending Action
                              </Badge>
                            )}
                            {level.status === 'Waiting' && (
                              <Badge variant="default">
                                <Clock className="w-3 h-3 mr-1" />
                                Waiting
                              </Badge>
                            )}
                          </div>
                        </div>

                        {level.date && (
                          <p className="text-xs text-muted-foreground mb-2">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Actioned on: {level.date}
                          </p>
                        )}

                        {level.comments && (
                          <div className="mt-2 p-3 bg-card rounded-lg border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Comments:</p>
                            <p className="text-sm text-foreground">{level.comments}</p>
                          </div>
                        )}

                        {level.status === 'Pending Approval' && (
                          <div className="mt-3 flex gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setShowApprovalModal(true)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve & Endorse
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowApprovalModal(true)}
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Return for Revision
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setShowApprovalModal(true)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Auto-Route After Approval */}
                <div className="p-4 bg-green-50 border-2 border-dashed border-green-300 rounded-lg flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Send className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-900">
                      Auto-Route to Procurement Officer
                    </p>
                    <p className="text-xs text-green-700">
                      After final approval (Step 3), this MRF will be automatically assigned to{' '}
                      <strong>Tanvir Ahmed (Sr. Procurement Officer)</strong> for RFQ preparation
                      and vendor sourcing.
                    </p>
                  </div>
                  <Badge variant="default" size="sm">
                    Scheduled
                  </Badge>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Authority Matrix Reference */}
          <Card>
            <CardHeader
              title="Authority Delegation Matrix Reference (DUMMY DATA)"
              description="Applicable approval authority based on MRF value"
            />
            <CardBody>
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold">Amount Range</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold">Budget Clearance</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold">Endorsement</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold">Final Approval</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      range: 'Up to ৳5,00,000',
                      budget: 'Finance Focal',
                      endorse: 'Area Manager',
                      final: 'Programme Coordinator',
                      highlight: false,
                    },
                    {
                      range: '৳5,00,001 – ৳20,00,000',
                      budget: 'Finance Focal',
                      endorse: 'Director Programmes',
                      final: 'Head of Operations',
                      highlight: true,
                    },
                    {
                      range: 'Above ৳20,00,000',
                      budget: 'Finance Focal',
                      endorse: 'Director Programmes',
                      final: 'Country Director',
                      highlight: false,
                    },
                  ].map((row, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-border ${row.highlight ? 'bg-primary/5 font-medium' : ''}`}
                    >
                      <td className="px-4 py-3">
                        {row.range}{' '}
                        {row.highlight && (
                          <Badge variant="primary" size="sm">
                            Current
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">{row.budget}</td>
                      <td className="px-4 py-3">{row.endorse}</td>
                      <td className="px-4 py-3">{row.final}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <CardHeader
            title="Automated Notification Log"
            description="Email + system alerts sent at each workflow stage"
          />
          <CardBody>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      n.status === 'sent'
                        ? 'border-border bg-card'
                        : 'border-dashed border-border bg-muted/30'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        n.status === 'sent' ? 'bg-green-50' : 'bg-muted'
                      }`}
                    >
                      {n.status === 'sent' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{n.event}</p>
                      <p className="text-xs text-muted-foreground">To: {n.recipient}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={n.status === 'sent' ? 'success' : 'default'} size="sm">
                        {n.channel}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {typeof n.time === 'string' ? n.time.split('T')[0] : n.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'attachments' && (
        <Card>
          <CardHeader
            title="Supporting Documents"
            description={`${attachments.length} files attached to this MRF`}
            action={
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload More
              </Button>
            }
          />
          <CardBody>
            {attachments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No attachments found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{file.size}</span>
                          <Badge variant="default" size="sm">
                            {file.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Uploaded:{' '}
                            {typeof file.date === 'string' ? file.date.split('T')[0] : file.date}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-muted rounded transition-colors">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-2 hover:bg-muted rounded transition-colors">
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'versions' && (
        <Card>
          <CardHeader
            title="Version History & Audit Trail"
            description="Complete history of all changes to this MRF"
          />
          <CardBody>
            {versionHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <GitBranch className="w-12 h-12 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No version history available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {versionHistory.map((v, idx) => (
                  <div key={idx} className="flex gap-4 p-4 border border-border rounded-lg">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <GitBranch className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="primary" size="sm">
                          {v.version}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {typeof v.date === 'string' ? v.date.split('T')[0] : v.date}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{v.changes}</p>
                      <p className="text-xs text-muted-foreground mt-1">By: {v.author}</p>
                    </div>
                  </div>
                ))}

                {/* Audit Trail */}
                <div className="mt-6 pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold text-foreground mb-4">
                    Detailed Audit Trail
                  </h4>
                  <div className="space-y-3">
                    {apiData?.status_logs && apiData.status_logs.length > 0 ? (
                      apiData.status_logs.map((log, idx) => (
                        <div key={idx} className="flex gap-3 text-sm">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-3 h-3 rounded-full ${log.approved_by ? 'bg-primary' : 'bg-muted-foreground'}`}
                            />
                            {idx < apiData.status_logs.length - 1 && (
                              <div className="w-0.5 h-full bg-border mt-1" />
                            )}
                          </div>
                          <div className="pb-4">
                            <p className="font-medium text-foreground">
                              {log.status?.replace(/_/g, ' ').toUpperCase()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {log.approved_at
                                ? new Date(log.approved_at).toLocaleString()
                                : 'Pending'}{' '}
                              — By: {log.approved_by_user?.name || log.approved_by || 'System'}
                            </p>
                            {log.comments && (
                              <p className="text-xs text-muted-foreground">{log.comments}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No audit trail available</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'comments' && (
        <Card>
          <CardHeader
            title="Discussion & Comments"
            description="Communication between requester and approvers"
          />
          <CardBody>
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No comments yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">{c.author}</span>
                        <Badge variant="default" size="sm">
                          {c.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{c.date}</span>
                      </div>
                      <p className="text-sm text-foreground">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment */}
            <div className="pt-4 border-t border-border">
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Add a comment..."
              />
              <div className="flex justify-end mt-2">
                <Button variant="primary" size="sm">
                  <Send className="w-4 h-4 mr-2" />
                  Post Comment
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <ApprovalModal
          requisition={{
            id: apiData.id,
            department: apiData.department_name,
            requester: apiData.created_by?.name || apiData.created_by?.username,
            category: apiData.category_name,
            amount: apiData.total_amount,
            dateCreated: apiData.created_at,
            dateRequired: apiData.delivery_date,
            purpose: apiData.purpose,
          }}
          onClose={() => setShowApprovalModal(false)}
        />
      )}
    </div>
  );
}
