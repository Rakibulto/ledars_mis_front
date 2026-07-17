'use client';

import React from 'react';

import { Box, Card, CardContent } from '@mui/material';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 1: Advance Print Form (অগ্রিম অনুমোদন/গ্রহণ ফরম)
// ═══════════════════════════════════════════════════════════════

export default function TemplatesPage() {
  const getAdvancePrintHTML = () => {
    const baseUrl = CONFIG.appDomainUrl.replace(/\/+$/, '');
    const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>অগ্রিম অনুমোদন/গ্রহণ ফরম</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap">
  <style>
    /* ── Advance Print Form Styles ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Sans Bengali', Arial, sans-serif;
      font-size: 10px;
      color: #000;
      background: #fff;
      padding: 20px 28px;
    }
    .org-wrap {
      display: flex;
      align-items: center;
      margin-bottom: 3px;
    }
    .org-logo {
      width: 66px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }
    .org-logo img { width: 60px; height: 60px; object-fit: contain; }
    .org-center {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .org-spacer { width: 66px; flex-shrink: 0; }
    .org-name-img { max-height: 56px; width: auto; object-fit: contain; display: block; }
    .org-web { font-size: 10px; text-decoration: underline; color: #0000cc; margin-top: 2px; }
    .rule { border-top: 3px solid #000; margin: 5px 0 8px; }
    .title-wrap { text-align: center; margin-bottom: 10px; }
    .title-box {
      display: inline-block;
      background: #1c1c1c;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      padding: 5px 20px;
      border-radius: 4px;
    }
    .serial-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 10.5px;
    }
    .serial-field { display: flex; align-items: baseline; gap: 3px; }
    .s-fill {
      display: inline-block;
      width: 90px;
      border-bottom: 1px dotted #555;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    .info-table td {
      border: 1px solid #555;
      padding: 5px 8px;
      font-size: 10.5px;
      vertical-align: top;
    }
    .barabar-cell { width: 50%; min-height: 65px; height: 65px; }
    .anurodh-cell { width: 50%; }
    .full-field-cell {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }
    .ff-label { white-space: nowrap; font-size: 10.5px; }
    .ff-dots {
      flex: 1;
      border-bottom: 1px dotted #555;
      min-height: 13px;
    }
    .biboron-label {
      font-size: 10.5px;
      margin-bottom: 4px;
      margin-top: 6px;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    .details-table th,
    .details-table td {
      border: 1px solid #555;
      padding: 4px 6px;
      font-size: 10px;
      vertical-align: middle;
    }
    .details-table th {
      text-align: center;
      font-weight: 700;
      background: #f2f2f2;
    }
    .chk {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 1px solid #333;
      vertical-align: middle;
      margin-left: 2px;
    }
    .type-sub-row td {
      min-height: 22px;
      height: 22px;
    }
    .kathay-row {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-bottom: 6px;
      font-size: 10.5px;
    }
    .kathay-fill {
      flex: 1;
      border-bottom: 1px dotted #555;
      min-height: 13px;
    }
    .comment-box {
      border: 1px solid #555;
      background: #d8d8d8;
      padding: 5px 8px;
      min-height: 54px;
      margin-bottom: 5px;
      font-size: 10.5px;
    }
    .comment-box-label { font-weight: 700; margin-bottom: 4px; }
    .qa-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    .qa-table td {
      border: 1px solid #555;
      padding: 4px 6px;
      font-size: 10px;
    }
    .qa-yn { width: 38px; text-align: center; }
    .recipient-sig { margin-top: 8px; margin-bottom: 16px; }
    .sig-line-short {
      width: 150px;
      border-top: 1px solid #000;
      margin-bottom: 3px;
    }
    .sig-lbl { font-size: 10.5px; }
    .footer-sigs {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #555;
      padding-top: 5px;
    }
    .footer-sig { text-align: center; font-size: 10.5px; }
    @media print {
      body { padding: 0; }
      @page { size: A4; margin: 1cm 1.2cm; }
    }
  </style>
</head>
<body>
  <div class="org-wrap">
    <div class="org-logo">
      <img src="${baseUrl}/icons/logo.png" alt="LEDARS Logo" onerror="this.style.display='none'">
    </div>
    <div class="org-center">
      <img class="org-name-img" src="${baseUrl}/icons/name_img.png" alt="LEDARS" onerror="this.style.display='none'">
      <div class="org-web">www.ledars.org</div>
    </div>
    <div class="org-spacer"></div>
  </div>
  <div class="rule"></div>
  <div class="title-wrap">
    <span class="title-box">অগ্রিম অনুমোদন/গ্রহণ ফরম</span>
  </div>
  <div class="serial-row">
    <div class="serial-field"><span>ক্রমিক নং-</span><span class="s-fill"></span></div>
    <div class="serial-field"><span>তারিখ ঃ</span><span class="s-fill"></span></div>
  </div>
  <table class="info-table">
    <tr><td class="barabar-cell">বরাবর,</td><td class="anurodh-cell">অনুরোধকারী,</td></tr>
    <tr><td colspan="2"><div class="full-field-cell"><span class="ff-label">প্রকল্পের নাম ঃ</span><span class="ff-dots"></span></div></td></tr>
    <tr><td colspan="2"><div class="full-field-cell"><span class="ff-label">অগ্রিম গ্রহণের উদ্দেশ্য ঃ</span><span class="ff-dots"></span></div></td></tr>
  </table>
  <div class="biboron-label">অগ্রিম গ্রহণের বিবরণ ঃ</div>
  <table class="details-table">
    <thead>
      <tr><th style="width:18%;">অগ্রিম গ্রহণের<br>তারিখ</th><th style="width:22%;">অগ্রিম গ্রহণকৃত<br>টাকার পরিমাণ</th><th style="width:20%;">প্রত্যাশিত সমন্বয়ের<br>তারিখ</th><th>গ্রহণের ধরণ</th></tr>
    </thead>
    <tbody>
      <tr class="type-sub-row"><td rowspan="3" style="height:66px;"></td><td rowspan="3"></td><td rowspan="3"></td><td>চেক মাধ্যমে ঃ <span class="chk"></span>&nbsp;&nbsp;&nbsp;&nbsp;নগদ ঃ <span class="chk"></span></td></tr>
      <tr class="type-sub-row"><td>ব্যাংকের নাম</td></tr>
      <tr class="type-sub-row"><td>চেক নং-</td></tr>
    </tbody>
  </table>
  <div class="kathay-row"><span>কথায় ঃ</span><span class="kathay-fill"></span><span>টাকা মাত্র ।</span></div>
  <div class="comment-box"><div class="comment-box-label">হিসাবরক্ষকের মন্তব্য ঃ</div></div>
  <table class="qa-table">
    <tbody>
      <tr><td>বর্তমান উল্লেখিত কর্মচারীর নামে ফেরৎ যোগ্য অগ্রিম আছে কি?</td><td class="qa-yn">হ্যাঁ</td><td class="qa-yn">না</td></tr>
      <tr><td>অতীতে অগ্রিম গ্রহণ করে সঠিকসময় সমন্বয় করেছেন কি?</td><td class="qa-yn">হ্যাঁ</td><td class="qa-yn">না</td></tr>
      <tr><td>অতীতে যে কাজের জন্য অগ্রিম গ্রহণ করেছেন সে কাজ সঠিক- ভাবে করতে পেরেছিলেন কি?</td><td class="qa-yn">হ্যাঁ</td><td class="qa-yn">না</td></tr>
    </tbody>
  </table>
  <div class="recipient-sig"><div class="sig-line-short"></div><div class="sig-lbl">অগ্রিম গ্রহীতার স্বাক্ষর</div></div>
  <div class="footer-sigs">
    <div class="footer-sig">হিসাবরক্ষকের স্বাক্ষর</div>
    <div class="footer-sig">সুপারিশকারীর স্বাক্ষর</div>
    <div class="footer-sig">অনুমোদনকারীর স্বাক্ষর</div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 700);
  };

  const handleFinalSettlementPrint = () => {
    const baseUrl = CONFIG.appDomainUrl.replace(/\/+$/, '');

    const SHARED_CSS = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; background: #fff; padding: 20px 28px; }
    .hdr { display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 4px; }
    .hdr-logo { width: 54px; height: 54px; object-fit: contain; }
    .hdr-name { max-height: 48px; width: auto; object-fit: contain; }
    .page { page-break-after: always; }
    .page:last-child { page-break-after: avoid; }
    .form-title { text-align: center; font-size: 15px; font-weight: 700; text-decoration: underline; margin: 8px 0 12px; }
    .field-row { display: flex; align-items: baseline; gap: 4px; margin-bottom: 6px; }
    .f-lbl { font-weight: 700; white-space: nowrap; font-size: 11px; }
    .f-dot { flex: 1; border-bottom: 1px dotted #555; padding-bottom: 1px; min-height: 14px; }
    .section-title { font-weight: 700; font-size: 11px; margin-bottom: 5px; margin-top: 8px; }
    .opinion-box { border: 1px solid #555; min-height: 70px; padding: 6px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 8px; }
    table th, table td { border: 1px solid #555; padding: 3px 5px; }
    table th { font-weight: 700; text-align: center; background: #f5f5f5; }
    .tc { text-align: center; } .tr { text-align: right; } .bold { font-weight: 700; }
    .inwards-row { display: flex; gap: 4px; align-items: baseline; margin-top: 4px; }
    .inwards-fill { flex: 1; border-bottom: 1px dotted #555; min-height: 14px; }
    .decl-box { border: 1px solid #555; min-height: 55px; padding: 6px; margin-bottom: 10px; }
    .decl-para { font-size: 11px; line-height: 1.8; margin-bottom: 18px; }
    .sig-right { text-align: right; font-size: 11px; margin-bottom: 28px; }
    .footer-sigs { display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px solid #555; font-size: 11px; }
    @media print { body { padding: 0; } @page { size: A4; margin: 1cm 1.2cm; } }
  `;

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
  <title>Final Settlement Form</title><style>${SHARED_CSS}</style></head><body>

  <!-- ═══ PAGE 1 ═══ -->
  <div class="page">
    <div class="hdr">
      <img class="hdr-logo" src="${baseUrl}/icons/logo.png" alt="LEDARS" onerror="this.style.display='none'">
      <img class="hdr-name" src="${baseUrl}/icons/name_img.png" alt="LEDARS Shyamnagar" onerror="this.style.display='none'">
    </div>
    <div class="form-title">Final Settlement Form</div>

    <div class="field-row">
      <span class="f-lbl">Project Name:</span><span class="f-dot"></span>
      <span class="f-lbl" style="margin-left:16px;">Date:</span><span class="f-dot" style="max-width:140px;"></span>
    </div>
    <div class="field-row"><span class="f-lbl">Name of Staff:</span><span class="f-dot"></span></div>
    <div class="field-row"><span class="f-lbl">Designation:</span><span class="f-dot"></span></div>
    <div class="field-row">
      <span class="f-lbl">Joining Date:</span><span class="f-dot"></span>
      <span class="f-lbl" style="margin-left:16px;">Resignation Date:</span><span class="f-dot"></span>
    </div>

    <div class="section-title">Supervisor Opinion:</div>
    <div class="opinion-box"></div>

    <div class="section-title">Financial Settlement:</div>
    <table>
      <thead><tr>
        <th style="width:38px;">S/N</th>
        <th>Particulars</th>
        <th style="width:52px;">Yes /No</th>
        <th style="width:68px;">Amount (Tk)</th>
        <th style="width:72px;">Due Amount of Staff</th>
        <th style="width:76px;">Due amount of LEDARS</th>
        <th style="width:68px;">Remarks</th>
      </tr></thead>
      <tbody>
        ${[
          ['01', 'Office advance'],
          ['02', 'Office (Assets/Materials)'],
          ['03', 'Office dealings'],
          ['04', 'Office colleague dealings'],
          ['05', 'Staff welfare fund (Loan)'],
          ['06', 'Provident Fund (Loan)'],
          ['07', 'Staff security fund'],
          ['08', 'Others dealings (Vendors)'],
          ['09', 'LEDARS Canteen dealings'],
          ['10', 'LEDARS Srizon dealings'],
          ['11', 'LEDARS Provident Fund'],
          ['12', 'Bank Liabilities'],
          ['13', 'Salary'],
          ['14', 'Any others payment (If rule)'],
        ]
          .map(
            ([n, p]) =>
              `<tr><td class="tc">${n}</td><td>${p}</td><td></td><td></td><td></td><td></td><td></td></tr>`
          )
          .join('')}
        <tr><td colspan="3" class="tr bold">Total</td><td></td><td></td><td></td><td></td></tr>
        <tr><td colspan="3" class="bold">Final Payment of Staff</td><td></td><td></td><td></td><td></td></tr>
      </tbody>
    </table>
    <div class="inwards-row"><span class="f-lbl">In Wards:</span><span class="inwards-fill"></span></div>
  </div>

  <!-- ═══ PAGE 2 ═══ -->
  <div class="page">
    <div class="hdr">
      <img class="hdr-logo" src="${baseUrl}/icons/logo.png" alt="LEDARS" onerror="this.style.display='none'">
      <img class="hdr-name" src="${baseUrl}/icons/name_img.png" alt="LEDARS Shyamnagar" onerror="this.style.display='none'">
    </div>

    <div class="section-title" style="margin-top:8px;">Loan Information:</div>
    <table>
      <thead><tr>
        <th style="width:38px;">S/N</th><th>Date</th><th>Amount (Tk)</th>
        <th>Last date of payment</th><th>Remarks</th>
      </tr></thead>
      <tbody>
        ${Array(4)
          .fill(0)
          .map(() => `<tr><td style="height:24px;"></td><td></td><td></td><td></td><td></td></tr>`)
          .join('')}
      </tbody>
    </table>

    <div class="section-title">Declaration of Canteen Manager:</div>
    <div class="decl-box"></div>

    <div class="section-title">Declaration of Srizon Manager:</div>
    <div class="decl-box"></div>

    <div class="decl-para">
      I declared that I &nbsp;............................&nbsp; Finished all financial dealing with LEDARS today. I do
      not have any due except the amount &nbsp;....................................&nbsp; to LEDARS. I cannot claims
      any benefit to LEDARS in future.
    </div>

    <div class="sig-right">
      .………………………<br>Signature, Date
    </div>

    <div class="footer-sigs">
      <span>Supervisor Signature</span>
      <span>Finance Person Signature</span>
      <span>Management Person Signature</span>
    </div>
  </div>

  </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 700);
  };

  const handleMoneyReceivedPrint = () => {
    const baseUrl = CONFIG.appDomainUrl.replace(/\/+$/, '');

    const COPY_HTML = (side) => `
    <div class="copy${side === 'right' ? ' copy-right' : ''}">
      <!-- mini header -->
      <div class="mini-hdr">
        <img class="mini-logo" src="${baseUrl}/icons/logo.png" alt="" onerror="this.style.display='none'">
        <div class="mini-org">
          <img class="mini-name" src="${baseUrl}/icons/name_img.png" alt="" onerror="this.style.display='none'">
          <div class="mini-sub">প্রাপ্তি স্বীকার পত্র</div>
        </div>
      </div>

      <!-- info fields -->
      <div class="info-row">
        <div class="info-field"><span class="lbl">নামঃ</span><span class="fill"></span></div>
        <div class="info-field"><span class="lbl">পিতার নামঃ</span><span class="fill"></span></div>
      </div>
      <div class="info-row">
        <div class="info-field full"><span class="lbl">ঠিকানাঃ</span><span class="fill"></span></div>
      </div>
      <div class="info-row">
        <div class="info-field"><span class="lbl">মোবাইল নং-</span><span class="fill"></span></div>
      </div>
      <div class="info-row">
        <div class="info-field"><span class="lbl">পন্য/ সেবার ধরণঃ</span><span class="fill"></span></div>
        <div class="info-field narrow"><span class="lbl">তারিখ:</span><span class="fill"></span></div>
      </div>

      <!-- items table -->
      <table>
        <thead><tr>
          <th>বিবরণ</th><th style="width:60px;">পরিমান</th>
          <th style="width:48px;">দর</th><th style="width:60px;">টাকা</th>
        </tr></thead>
        <tbody>
          ${Array(12)
            .fill(0)
            .map(() => `<tr><td style="height:20px;"></td><td></td><td></td><td></td></tr>`)
            .join('')}
        </tbody>
        <tfoot>
          <tr><td colspan="4" style="font-size:10px; padding:4px 5px;">
            পন্য/সেবা মূল্য বাবদ.. .. .. .. .. .. .. .. .. .. .. .. .. .. বুঝিয়া পাইলাম।
          </td></tr>
        </tfoot>
      </table>

      <!-- signatures -->
      <div class="sig-row">
        <span class="sig-lbl">প্রদানকারীর স্বাক্ষর</span>
        <span class="sig-lbl">গ্রহীতার স্বাক্ষর</span>
      </div>
    </div>`;

    const html = `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8">
  <title>প্রাপ্তি স্বীকার পত্র</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Noto Sans Bengali', Arial, sans-serif; font-size: 10px; color: #000;
           background: #fff; padding: 16px 20px; }

    .page-wrap { display: flex; gap: 14px; }
    .copy { flex: 1; border: 1px solid #999; padding: 10px; }

    /* mini header */
    .mini-hdr { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
    .mini-logo { width: 44px; height: 44px; object-fit: contain; }
    .mini-org { display: flex; flex-direction: column; }
    .mini-name { max-height: 32px; width: auto; object-fit: contain; }
    .mini-sub { font-size: 11px; font-weight: 700; margin-top: 2px; }

    /* info fields */
    .info-row { display: flex; gap: 6px; margin-bottom: 4px; }
    .info-field { display: flex; align-items: baseline; flex: 1; gap: 2px; }
    .info-field.full { flex: 2; }
    .info-field.narrow { flex: 0 0 38%; }
    .lbl { font-size: 10px; font-weight: 700; white-space: nowrap; }
    .fill { flex: 1; border-bottom: 0.7px dotted #555; min-height: 13px; }

    /* table */
    table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 6px; font-size: 10px; }
    table th, table td { border: 0.7px solid #555; padding: 2px 4px; }
    table th { text-align: center; font-weight: 700; background: #f2f2f2; }

    /* signatures */
    .sig-row { display: flex; justify-content: space-between; margin-top: 8px; padding-top: 4px; }
    .sig-lbl { font-size: 10px; font-weight: 700; }

    @media print {
      body { padding: 0; }
      @page { size: A4; margin: 0.8cm 1cm; }
    }
  </style></head><body>

  <div class="page-wrap">
    ${COPY_HTML('left')}
    ${COPY_HTML('right')}
  </div>

  </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 900);
  };

  const handlePerdiemPrint = () => {
    const baseUrl = CONFIG.appDomainUrl.replace(/\/+$/, '');

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
  <title>Daily Allowance and Perdiem Claim Sheet</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; background: #fff; padding: 18px 28px; }

    /* ── Full-address header (logo top-right style) ── */
    .hdr { display: flex; justify-content: flex-end; align-items: flex-start; margin-bottom: 6px; }
    .hdr-right { display: flex; flex-direction: column; align-items: center; }
    .hdr-logo { width: 52px; height: 52px; object-fit: contain; }
    .hdr-name-img { max-height: 42px; width: auto; object-fit: contain; margin-top: 2px; }
    .hdr-addr { font-size: 9px; text-align: center; margin-top: 3px; line-height: 1.5; }

    /* ── Form title ── */
    .form-title { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
    .date-row { text-align: right; font-size: 11px; margin-bottom: 6px; }
    .date-fill { display: inline-block; width: 140px; border-bottom: 1px dotted #555; }

    /* ── Field rows ── */
    .field-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 5px; }
    .f-lbl { font-weight: 400; white-space: nowrap; }
    .f-dot { flex: 1; border-bottom: 1px dotted #555; min-height: 13px; }
    .f-dot-sm { width: 100px; border-bottom: 1px dotted #555; min-height: 13px; }

    /* ── Section titles ── */
    .sec-title { font-size: 11px; font-weight: 400; margin-bottom: 4px; }

    /* ── Perdiem Bill pill ── */
    .bill-wrap { text-align: center; margin: 10px 0 6px; }
    .bill-pill {
      display: inline-block; border: 2px solid #000; border-radius: 6px;
      padding: 4px 22px; font-size: 13px; font-weight: 700;
    }

    /* ── Tables ── */
    table { border-collapse: collapse; font-size: 10.5px; margin-bottom: 8px; }
    table th, table td { border: 1px solid #555; padding: 3px 6px; text-align: center; }
    table th { font-weight: 700; background: #e0e0e0; }
    .rate-table { width: 100%; }
    .accom-table { width: 60%; }

    /* ── Submitted section ── */
    .submitted-title { font-size: 14px; font-weight: 700; text-align: center; margin: 10px 0 6px; }
    .from-row { display: flex; gap: 24px; margin-bottom: 6px; }
    .from-field { display: flex; gap: 4px; align-items: baseline; }
    .from-fill { width: 110px; border-bottom: 1px dotted #555; }
    .sub-table { width: 100%; }

    /* ── In Wards + footer ── */
    .inwards-row { display: flex; gap: 4px; align-items: baseline; margin: 6px 0 14px; }
    .inwards-fill { flex: 1; border-bottom: 1px dotted #555; }
    .footer-sigs { display: flex; justify-content: space-between; font-size: 11px; padding-top: 6px; }

    @media print { body { padding: 0; } @page { size: A4; margin: 1cm 1.2cm; } }
  </style></head><body>

  <!-- ── HEADER ── -->
  <div class="hdr">
    <div class="hdr-right">
      <img class="hdr-logo" src="${baseUrl}/icons/logo.png" alt="" onerror="this.style.display='none'">
      <img class="hdr-name-img" src="${baseUrl}/icons/name_img.png" alt="" onerror="this.style.display='none'">
      <div class="hdr-addr">
        Local Environment Development and Agricultural Research Society<br>
        Head Office: Village: Munshigonj, Post Office: Kadamtala,<br>
        Upazila: Shyamnagar, District: Satkhira, Bangladesh.
      </div>
    </div>
  </div>

  <!-- ── TITLE + DATE ── -->
  <div class="form-title">Daily Allowance and Perdiem Claim Sheet</div>
  <div class="date-row">Date: <span class="date-fill"></span></div>

  <!-- ── INFO FIELDS ── -->
  <div class="field-row">
    <span class="f-lbl">Name:</span><span class="f-dot"></span>
    <span class="f-lbl">Designation:</span><span class="f-dot"></span>
    <span class="f-lbl">Grade:</span><span class="f-dot-sm"></span>
  </div>
  <div class="field-row"><span class="f-lbl">Purpose of Travel:</span><span class="f-dot"></span></div>
  <div class="field-row"><span class="f-lbl">Name of Project:</span><span class="f-dot"></span></div>

  <!-- ── PERDIEM BILL ── -->
  <div class="bill-wrap"><span class="bill-pill">Perdiem Bill</span></div>

  <div class="sec-title">Perdiem Description : (Human Resource management Manual 3.18 &amp; 3.19)</div>
  <div class="sec-title">High Expensive Area :</div>
  <table class="rate-table">
    <thead><tr><th>Grade</th><th>Breakfast</th><th>Lunch</th><th>Dinner</th><th>Others expenses</th><th>Total</th></tr></thead>
    <tbody>
      <tr><td>H-1</td><td>60</td><td>150</td><td>150</td><td>100</td><td>460</td></tr>
      <tr><td>C-G</td><td>90</td><td>180</td><td>180</td><td>180</td><td>630</td></tr>
      <tr><td>A-B</td><td>120</td><td>250</td><td>250</td><td>250</td><td>870</td></tr>
    </tbody>
  </table>

  <div class="sec-title">Low expensive area :</div>
  <table class="rate-table">
    <thead><tr><th>Grade</th><th>Breakfast</th><th>Lunch</th><th>Dinner</th><th>Others expenses</th><th>Total</th></tr></thead>
    <tbody>
      <tr><td>H-1</td><td>40</td><td>120</td><td>120</td><td>120</td><td>400</td></tr>
      <tr><td>C-G</td><td>70</td><td>150</td><td>150</td><td>150</td><td>520</td></tr>
      <tr><td>A-B</td><td>100</td><td>200</td><td>200</td><td>200</td><td>700</td></tr>
    </tbody>
  </table>

  <div class="sec-title">Accommodation :</div>
  <table class="accom-table">
    <thead><tr><th>Status</th><th>High expensive area</th><th>Low expensive area</th></tr></thead>
    <tbody>
      <tr><td>H-1</td><td>500</td><td>350</td></tr>
      <tr><td>C-G</td><td>800</td><td>700</td></tr>
      <tr><td>A-B</td><td>2500</td><td>1500</td></tr>
    </tbody>
  </table>

  <!-- ── DESCRIPTION OF SUBMITTED PERDIEM ── -->
  <div class="submitted-title">Description of Submitted Perdiem :</div>
  <div class="from-row">
    <div class="from-field"><span class="f-lbl">From :</span><span class="from-fill"></span></div>
    <div class="from-field"><span class="f-lbl">To :</span><span class="from-fill"></span></div>
    <div class="from-field"><span class="f-lbl">Total days:</span><span class="from-fill"></span></div>
  </div>

  <table class="sub-table">
    <thead><tr><th>Particular</th><th style="width:100px;">Quantity</th><th style="width:120px;">Unit cost (Taka)</th><th style="width:90px;">Total</th></tr></thead>
    <tbody>
      ${['Breakfast', 'Lunch', 'Dinner', 'Accommodation', 'Others expenses', 'Total']
        .map((r) => `<tr><td style="height:22px;">${r}</td><td></td><td></td><td></td></tr>`)
        .join('')}
    </tbody>
  </table>

  <div class="inwards-row"><span class="f-lbl">In Wards:</span><span class="inwards-fill"></span></div>
  <div class="footer-sigs">
    <span>Prepared by</span><span>Reviewed by</span><span>Finance by</span><span>Approved by</span>
  </div>

  </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 700);
  };

  const handlePFLoanPrint = () => {
    const baseUrl = CONFIG.appDomainUrl.replace(/\/+$/, '');

    const HDR = (baseUrll) => `
    <div class="hdr">
      <div class="hdr-right">
        <img class="hdr-logo" src="${baseUrl}/icons/logo.png" alt="" onerror="this.style.display='none'">
        <img class="hdr-name-img" src="${baseUrl}/icons/name_img.png" alt="" onerror="this.style.display='none'">
        <div class="hdr-addr">
          Local Environment Development and Agricultural Research Society<br>
          <strong>Head Office</strong>:<br>
          Village: Munshigonj, Post Office: Kadamtala,<br>
          Upazila: Shyamnagar, District: Satkhira, Post Code: 9455,<br>
          Bangladesh.
        </div>
      </div>
    </div>`;

    const html = `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8">
  <title>PF Loan Application</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Noto Sans Bengali', Arial, sans-serif; font-size: 11px; color: #000; background: #fff; padding: 18px 28px; }

    .page { page-break-after: always; }
    .page:last-child { page-break-after: avoid; }

    /* header */
    .hdr { display: flex; justify-content: flex-end; margin-bottom: 8px; }
    .hdr-right { display: flex; flex-direction: column; align-items: center; }
    .hdr-logo { width: 50px; height: 50px; object-fit: contain; }
    .hdr-name-img { max-height: 38px; width: auto; object-fit: contain; margin-top: 2px; }
    .hdr-addr { font-size: 9px; text-align: center; margin-top: 3px; line-height: 1.5; }

    /* field rows */
    .date-row { font-size: 11px; margin-bottom: 6px; font-weight: 700; }
    .date-fill { display: inline-block; width: 140px; border-bottom: 1px dotted #555; }
    .to-block { font-size: 11px; font-weight: 700; line-height: 1.8; margin-bottom: 8px; }
    .subject { font-size: 11px; font-weight: 700; text-decoration: underline; margin-bottom: 8px; }
    .salutation { margin-bottom: 6px; }
    .body-para { font-size: 11px; line-height: 1.7; margin-bottom: 10px; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 16px; margin-bottom: 8px; }
    .grid-field { display: flex; align-items: baseline; gap: 3px; font-size: 11px; }
    .g-lbl { white-space: nowrap; font-weight: 400; }
    .g-dot { flex: 1; border-bottom: 1px dotted #555; min-height: 13px; }

    .closing { font-size: 11px; margin-bottom: 16px; }
    .sig-row { display: flex; gap: 24px; margin-bottom: 14px; }
    .sig-field { display: flex; gap: 4px; }
    .sig-fill { width: 160px; border-bottom: 1px dotted #555; }

    /* recommendation boxes */
    .rec-box { border: 1px solid #555; padding: 8px; margin-bottom: 8px; font-size: 11px; }
    .rec-title { font-weight: 700; margin-bottom: 6px; }
    .rec-line { border-bottom: 1px dotted #555; margin-bottom: 5px; min-height: 14px; }
    .rec-sig-row { display: flex; gap: 8px; margin-top: 4px; }
    .rec-sig-f { display: flex; gap: 3px; flex: 1; }
    .rec-sig-fill { flex: 1; border-bottom: 1px dotted #555; }

    /* page 2 */
    .section-title { font-size: 11px; font-weight: 700; margin-bottom: 6px; text-decoration: underline; }
    .p2-para { font-size: 11px; line-height: 1.8; margin-bottom: 8px; }
    .p2-field { display: flex; gap: 3px; align-items: baseline; font-size: 11px; margin-bottom: 5px; }
    .p2-fill { flex: 1; border-bottom: 1px dotted #555; min-height: 14px; }

    .trust-box { border: 1px solid #555; padding: 8px; margin-bottom: 10px; font-size: 11px; }
    .trust-note { font-size: 11px; margin-bottom: 6px; }
    .trust-member { margin-bottom: 5px; }
    .trust-summary { font-size: 11px; margin-top: 6px; }

    .footer-3col { display: flex; justify-content: space-between; border-top: 1px solid #555; padding-top: 8px; font-size: 11px; text-align: center; }
    .footer-person { display: flex; flex-direction: column; align-items: center; gap: 2px; }

    @media print { body { padding: 0; } @page { size: A4; margin: 1cm 1.2cm; } }
  </style></head><body>

  <!-- ═══ PAGE 1 ═══ -->
  <div class="page">
    ${HDR(baseUrl)}

    <div class="date-row">তারিখ ঃ <span class="date-fill"></span></div>

    <div class="to-block">
      বরাবর<br>
      সদস্য সচিব<br>
      পিএফ ট্রাস্টি বোর্ড<br>
      লিডার্স<br>
      শ্যামনগর, সাতক্ষীরা।
    </div>

    <div class="subject">বিষয় ঃ ঋণের জন্য আবেদন।</div>
    <div class="salutation">জনাব,</div>
    <div class="body-para">
      সবিনয় নিবেদন এই যে, আমি নিম্নস্বাক্ষরকারী পিএফ ঋণ নীতিমালার শর্তসমূহ মেনে নিয়ে ঋণের জন্য আবেদন
      করছি। উল্লেখ্য, আমার প্রার্থীত ঋণের কিস্তি আমার মাসিক বেতন থেকে কর্তৃপক্ষ কর্তনপূর্বক পরিশোধ করবেন।
    </div>

    <div class="grid-2">
      <div class="grid-field"><span class="g-lbl">নাম ঃ</span><span class="g-dot"></span></div>
      <div class="grid-field"><span class="g-lbl">প্রার্থীত প্রত্যাশিত ঋণের পরিমান ঃ</span><span class="g-dot"></span></div>
      <div class="grid-field"><span class="g-lbl">পদবী ঃ</span><span class="g-dot"></span></div>
      <div class="grid-field"><span class="g-lbl">প্রার্থীত ঋণের উদ্দেশ্য ঃ</span><span class="g-dot"></span></div>
      <div class="grid-field"><span class="g-lbl">চাকরিতে যোগদানের তারিখ ঃ</span><span class="g-dot"></span></div>
      <div class="grid-field"><span class="g-lbl">চাকরিতে স্থায়ীকরনের তারিখ ঃ</span><span class="g-dot"></span></div>
      <div class="grid-field"><span class="g-lbl">মাসিক কিস্তির সংখ্যা ঃ</span><span class="g-dot"></span></div>
      <div class="grid-field"><span class="g-lbl">মাসিক সর্বমোট বেতনের পরিমান ঃ</span><span class="g-dot"></span></div>
      <div class="grid-field"><span class="g-lbl">বর্তমান কর্মস্থল ঃ</span><span class="g-dot"></span></div>
      <div class="grid-field"><span class="g-lbl">কর্মসূচির নাম ঃ</span><span class="g-dot"></span></div>
    </div>

    <div class="closing">অতএব প্রার্থনা, উপরোক্ত তথ্যাদির প্রেক্ষিতে আমাকে প্রার্থীত ঋণ মঞ্জুর করে বাধিত করবেন।</div>
    <div style="margin-bottom:10px;">আপনার বিশ্বস্ত,</div>
    <div class="sig-row">
      <div class="sig-field"><span>স্বাক্ষর ঃ</span><span class="sig-fill"></span></div>
      <div class="sig-field"><span>তারিখ ঃ</span><span class="sig-fill"></span></div>
    </div>

    <!-- উর্ধ্বতন কর্তৃপক্ষ recommendation box -->
    <div class="rec-box">
      <div class="rec-title">উর্ধ্বতন (শাখা-আঞ্চলিক ব্যবস্থাপক/ প্রকল্প/ বিভাগীয় প্রধান) কর্তৃপক্ষ এর সুপারিশ ঃ</div>
      <div class="rec-line"></div>
      <div class="rec-line"></div>
      <div class="rec-line"></div>
      <div class="rec-sig-row">
        <div class="rec-sig-f"><span>নাম ঃ</span><span class="rec-sig-fill"></span></div>
        <div class="rec-sig-f"><span>পদবী ঃ</span><span class="rec-sig-fill"></span></div>
        <div class="rec-sig-f"><span>স্বাক্ষর ঃ</span><span class="rec-sig-fill"></span></div>
      </div>
    </div>

    <!-- সুপারভাইজার recommendation box -->
    <div class="rec-box">
      <div class="rec-title">সুপারভাইজারের সুপারিশ ঃ</div>
      <div class="rec-line"></div>
      <div class="rec-line"></div>
      <div class="rec-sig-row">
        <div class="rec-sig-f"><span>নাম ঃ</span><span class="rec-sig-fill"></span></div>
        <div class="rec-sig-f"><span>পদবী ঃ</span><span class="rec-sig-fill"></span></div>
        <div class="rec-sig-f"><span>স্বাক্ষর ঃ</span><span class="rec-sig-fill"></span></div>
      </div>
    </div>
  </div>

  <!-- ═══ PAGE 2 ═══ -->
  <div class="page">
    ${HDR(baseUrl)}

    <div class="section-title">হিসাবরক্ষণ কর্মকর্তা ঃ</div>
    <div class="p2-para">
      পিএফ তহবিলে আবেদনকারী সদস্যের নামে লভ্যাংশসহ মোট <span style="display:inline-block;width:100px;border-bottom:1px dotted #555;"></span>
      টাকা (নিজস্ব <span style="display:inline-block;width:70px;border-bottom:1px dotted #555;"></span>
      সংস্থার <span style="display:inline-block;width:70px;border-bottom:1px dotted #555;"></span>
      লভ্যাংশ <span style="display:inline-block;width:70px;border-bottom:1px dotted #555;"></span>) টাকা জমা
      রয়েছে। পিএফ বাবদ মোট জমা থেকে জামানতের ঘাটতি বাদ দিয়ে ৮০% অর্থাৎ সর্বোচ্চ (প্রায়)
      <span style="display:inline-block;width:100px;border-bottom:1px dotted #555;"></span>
      টাকা ঋণ দেওয়া যেতে পারে, যা মাসিক সুদ-আসল
      <span style="display:inline-block;width:90px;border-bottom:1px dotted #555;"></span> টাকা
      সেবার হার <span style="display:inline-block;width:40px;border-bottom:1px dotted #555;"></span>%
      হিসেবে <span style="display:inline-block;width:40px;border-bottom:1px dotted #555;"></span>কিস্তিতে
      <span style="display:inline-block;width:70px;border-bottom:1px dotted #555;"></span> মাস হতে পরিশোধ করতে হবে।
    </div>

    <div class="p2-field"><span>নাম ঃ</span><span class="p2-fill"></span></div>
    <div class="p2-field"><span>পদবী ঃ</span><span class="p2-fill"></span></div>
    <div class="p2-field"><span>স্বাক্ষর ঃ</span><span class="p2-fill"></span></div>

    <div style="font-size:11px;font-weight:700;margin:10px 0 6px;">
      সদস্য, পিএফ ট্রাস্টি বোর্ড ঃ (কমপক্ষে দুইজনের স্বাক্ষর থাকতে হবে)
    </div>

    <div class="trust-box">
      <div class="trust-note">আবেদনকারী সদস্যকে প্রার্থীত ঋণ প্রদান করার জন্য অনুরোধ করা হলো। (যদি পূর্বের ঋণ সমন্বয় থাকে।)</div>
      <div class="trust-member">
        <div class="p2-field"><span>১. নাম ঃ</span><span class="p2-fill"></span><span>স্বাক্ষর ঃ</span><span class="p2-fill"></span></div>
      </div>
      <div class="trust-member">
        <div class="p2-field"><span>২. নাম ঃ</span><span class="p2-fill"></span><span>স্বাক্ষর ঃ</span><span class="p2-fill"></span></div>
      </div>
      <div class="trust-summary">
        সদস্য সচিব, পিএফ ট্রাস্টি বোর্ড ঃ <span style="display:inline-block;width:80px;border-bottom:1px dotted #555;"></span>
        টাকা (পূর্বের ঋণ ও সুদ সমন্বয় সাপেক্ষে) ঋণ বাবদ প্রদান করা যেতে পারে।
      </div>
    </div>

    <div class="footer-3col">
      <div class="footer-person">
        <span>সুপারিশকারীর স্বাক্ষর</span>
        <span style="margin-top:18px; font-size:10px;">অসিত মণ্ডল</span>
        <span style="font-size:10px;">সদস্য সচিব</span>
        <span style="font-size:10px;">পিএফ ট্রাস্টি বোর্ড</span>
      </div>
      <div class="footer-person">
        <span>নথিভুক্তকারীর স্বাক্ষর</span>
        <span style="margin-top:18px; font-size:10px;">নাম ঃ</span>
        <span style="font-size:10px;">পদবীঃ</span>
        <span style="font-size:10px;">পিএফ ট্রাস্টি বোর্ড</span>
      </div>
      <div class="footer-person">
        <span>অনুমোদনকারীর স্বাক্ষর</span>
        <span style="margin-top:18px; font-size:10px;">মোহন কুমার মণ্ডল</span>
        <span style="font-size:10px;">সভাপতি</span>
        <span style="font-size:10px;">পিএফ ট্রাস্টি বোড</span>
      </div>
    </div>
  </div>

  </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 900);
  };

  const handleTourPlanPrint = () => {
    const baseUrl = CONFIG.appDomainUrl.replace(/\/+$/, '');

    const COPY_HTML = () => `
    <div class="copy">
      <!-- header -->
      <div class="tour-hdr">
        <img class="tour-logo" src="${baseUrl}/icons/logo.png" alt="" onerror="this.style.display='none'">
        <div class="tour-org">
          <img class="tour-name" src="${baseUrl}/icons/name_img.png" alt="" onerror="this.style.display='none'">
          <div class="tour-web">www.ledars.org</div>
        </div>
      </div>
      <div class="tour-title">Tour Plan Schedule</div>

      <!-- info fields -->
      <div class="field-row">
        <span class="f-lbl">Name:</span><span class="f-dot"></span>
        <span class="f-lbl ml">Designation:</span><span class="f-dot"></span>
        <span class="f-lbl ml">Grade:</span><span class="f-dot sm"></span>
      </div>
      <div class="field-row"><span class="f-lbl">Purpose of travel:</span><span class="f-dot"></span></div>
      <div class="field-row"><span class="f-lbl">Name of the project:</span><span class="f-dot"></span></div>

      <!-- table -->
      <table>
        <thead>
          <tr>
            <th rowspan="2" style="width:28px;">Sl</th>
            <th rowspan="2" style="width:52px;">Date</th>
            <th rowspan="2">Travel Route</th>
            <th rowspan="2">Description</th>
            <th colspan="4">Approx. Expenses</th>
          </tr>
          <tr>
            <th style="width:46px;">Travel</th>
            <th style="width:38px;">Food</th>
            <th style="width:46px;">Lodging</th>
            <th style="width:44px;">Others</th>
          </tr>
        </thead>
        <tbody>
          ${Array(6)
            .fill(0)
            .map(
              () =>
                `<tr><td style="height:20px;"></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`
            )
            .join('')}
          <tr><td colspan="4" style="text-align:right;font-weight:700;padding-right:8px;">Subtotal</td><td></td><td></td><td></td><td></td></tr>
          <tr><td colspan="4" style="text-align:right;font-weight:700;padding-right:8px;">Total</td><td></td><td></td><td></td><td></td></tr>
        </tbody>
      </table>

      <!-- footer sigs -->
      <div class="footer-sigs">
        <span>Submitted By</span>
        <span>Checked and Supervised By</span>
        <span>Approved By</span>
      </div>
    </div>`;

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
  <title>Tour Plan Schedule</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #000; background: #fff; padding: 14px 18px; }

    .page-wrap { display: flex; flex-direction: column; gap: 0; }
    .copy { border-bottom: 2px dashed #aaa; padding-bottom: 12px; margin-bottom: 12px; }
    .copy:last-child { border-bottom: none; margin-bottom: 0; }

    /* header */
    .tour-hdr { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; justify-content: center; }
    .tour-logo { width: 46px; height: 46px; object-fit: contain; }
    .tour-org { display: flex; flex-direction: column; align-items: center; }
    .tour-name { max-height: 36px; width: auto; object-fit: contain; }
    .tour-web { font-size: 9px; text-decoration: underline; color: #0000cc; margin-top: 1px; text-align: center; }

    /* title */
    .tour-title {
      text-align: center; font-size: 13px; font-weight: 700;
      text-decoration: underline; color: #cc0000;
      margin: 5px 0 7px;
    }

    /* field rows */
    .field-row { display: flex; align-items: baseline; gap: 3px; margin-bottom: 4px; }
    .f-lbl { font-weight: 400; white-space: nowrap; font-size: 10px; }
    .f-dot { flex: 1; border-bottom: 1px dotted #555; min-height: 12px; }
    .f-dot.sm { max-width: 60px; flex: none; }
    .ml { margin-left: 8px; }

    /* table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px; }
    table th, table td { border: 1px solid #555; padding: 2px 4px; text-align: center; }
    table th { font-weight: 700; background: #e0e0e0; }
    table td:nth-child(3), table td:nth-child(4) { text-align: left; }

    /* footer */
    .footer-sigs { display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; padding-top: 5px; }

    @media print {
      body { padding: 0; }
      @page { size: A4; margin: 0.8cm 1cm; }
      .copy { page-break-inside: avoid; }
    }
  </style></head><body>

  <div class="page-wrap">
    ${COPY_HTML()}
    ${COPY_HTML()}
  </div>

  </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 700);
  };

  const handleTravelExpensePrint = () => {
    const baseUrl = CONFIG.appDomainUrl.replace(/\/+$/, '');

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
  <title>Travel Expense Report (TER)</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; background: #fff; padding: 18px 26px; }

    /* ── Header (logo right side with full address) ── */
    .hdr { display: flex; justify-content: flex-end; margin-bottom: 6px; }
    .hdr-inner { display: flex; align-items: flex-start; gap: 8px; }
    .hdr-logo { width: 52px; height: 52px; object-fit: contain; }
    .hdr-text { display: flex; flex-direction: column; }
    .hdr-name-img { max-height: 40px; width: auto; object-fit: contain; }
    .hdr-full-name { font-size: 9px; margin-top: 3px; }
    .hdr-addr { font-size: 9px; font-weight: 700; }
    .hdr-city { font-size: 9px; }
    .hdr-web { font-size: 9px; text-decoration: underline; color: #0000cc; }

    /* ── TER title pill ── */
    .title-wrap { text-align: center; margin: 6px 0 10px; }
    .title-pill {
      display: inline-block; background: #1c1c1c; color: #fff;
      font-size: 13px; font-weight: 700;
      padding: 4px 20px; border-radius: 5px;
    }

    /* ── Info fields ── */
    .field-row { display: flex; align-items: baseline; gap: 4px; margin-bottom: 5px; }
    .f-lbl { font-weight: 400; white-space: nowrap; font-size: 11px; }
    .f-dot { flex: 1; border-bottom: 1px dotted #555; min-height: 13px; }
    .f-dot-fix { width: 140px; border-bottom: 1px dotted #555; min-height: 13px; }
    .date-box {
      display: inline-block; width: 120px; height: 20px;
      border: 1px solid #555; vertical-align: middle; margin-left: 4px;
    }

    /* ── Main table ── */
    table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 6px; }
    table th, table td { border: 1px solid #555; padding: 2px 4px; }
    table th { text-align: center; font-weight: 700; background: #e8e8e8; }
    table td { height: 18px; vertical-align: middle; }
    .tc { text-align: center; }
    .tr { text-align: right; }

    /* ── Below table ── */
    .attach-note { text-align: right; font-size: 10.5px; margin-bottom: 4px; }
    .inwards-row { display: flex; gap: 4px; align-items: baseline; margin-bottom: 14px; }
    .inwards-fill { flex: 1; border-bottom: 1px dotted #555; }

    /* ── Footer ── */
    .footer-sigs { display: flex; justify-content: space-between; font-size: 11px; font-weight: 400; padding-top: 5px; }
    .note-row { font-size: 11px; margin-top: 6px; }

    @media print { body { padding: 0; } @page { size: A4; margin: 1cm 1.2cm; } }
  </style></head><body>

  <!-- ── HEADER ── -->
  <div class="hdr">
    <div class="hdr-inner">
      <img class="hdr-logo" src="${baseUrl}/icons/logo.png" alt="" onerror="this.style.display='none'">
      <div class="hdr-text">
        <img class="hdr-name-img" src="${baseUrl}/icons/name_img.png" alt="" onerror="this.style.display='none'">
        <div class="hdr-full-name">Local Environment Development and Agricultural Research Society</div>
        <div class="hdr-addr">Shyamnagar, Satkhira.</div>
        <div class="hdr-web">www.ledars.org</div>
      </div>
    </div>
  </div>

  <!-- ── TER TITLE ── -->
  <div class="title-wrap"><span class="title-pill">Travel Expense Report (TER)</span></div>

  <!-- ── INFO FIELDS ── -->
  <div class="field-row">
    <span class="f-lbl">Project:</span><span class="f-dot"></span>
    <span class="f-lbl" style="margin-left:10px;">Date of Submission :</span>
    <span class="date-box"></span>
  </div>
  <div class="field-row">
    <span class="f-lbl">Name</span><span class="f-dot"></span>
    <span class="f-lbl" style="margin-left:10px;">Designation</span><span class="f-dot"></span>
  </div>
  <div class="field-row"><span class="f-lbl">Purpose</span><span class="f-dot"></span></div>

  <!-- ── MAIN TABLE ── -->
  <table>
    <thead><tr>
      <th style="width:72px;">Date &amp; Time</th>
      <th>Description</th>
      <th style="width:52px;">Mode</th>
      <th style="width:60px;">Travel Fare</th>
      <th style="width:52px;">Food</th>
      <th style="width:60px;">Lodging</th>
      <th style="width:56px;">Total</th>
    </tr></thead>
    <tbody>
      ${Array(22)
        .fill(0)
        .map(
          () =>
            `<tr><td></td><td></td><td class="tc"></td><td class="tr"></td><td class="tr"></td><td class="tr"></td><td class="tr"></td></tr>`
        )
        .join('')}
      <tr>
        <td colspan="3" style="font-weight:700;">Total</td>
        <td class="tr"></td><td class="tr"></td><td class="tr"></td><td class="tr"></td>
      </tr>
    </tbody>
  </table>

  <div class="attach-note">(please attach the supporting documents)</div>
  <div class="inwards-row">
    <span class="f-lbl">(Total Taka in words</span>
    <span class="inwards-fill"></span>
    <span class="f-lbl">)</span>
  </div>

  <!-- ── FOOTER ── -->
  <div class="footer-sigs">
    <span>Prepared &amp; received by</span>
    <span>Checked by</span>
    <span>Accountant</span>
    <span>Approved by</span>
  </div>
  <div class="note-row">Note :</div>

  </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 700);
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', mt: 4, mb: 4 }}>
      <Card sx={{ borderRadius: 3, boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 4 }}>
          <div className="flex items-center justify-center p-6">
            <button
              type="button"
              onClick={handleTravelExpensePrint}
              className="
          inline-flex items-center gap-2
          rounded-lg bg-green-700 px-6 py-3
          text-white font-semibold text-base
          shadow-md hover:bg-green-800
          active:scale-95 transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        "
            >
              {/* printer icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"
                />
              </svg>
              Print Vendor Enlistment Form
            </button>
          </div>
          <div className="flex items-center justify-center p-6">
            <button
              type="button"
              onClick={handleTourPlanPrint}
              className="
          inline-flex items-center gap-2
          rounded-lg bg-green-700 px-6 py-3
          text-white font-semibold text-base
          shadow-md hover:bg-green-800
          active:scale-95 transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        "
            >
              {/* printer icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"
                />
              </svg>
              Print Vendor Enlistment Form
            </button>
          </div>
          <div className="flex items-center justify-center p-6">
            <button
              type="button"
              onClick={handlePFLoanPrint}
              className="
          inline-flex items-center gap-2
          rounded-lg bg-green-700 px-6 py-3
          text-white font-semibold text-base
          shadow-md hover:bg-green-800
          active:scale-95 transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        "
            >
              {/* printer icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"
                />
              </svg>
              Print Vendor Enlistment Form
            </button>
          </div>
          <div className="flex items-center justify-center p-6">
            <button
              type="button"
              onClick={handlePerdiemPrint}
              className="
          inline-flex items-center gap-2
          rounded-lg bg-green-700 px-6 py-3
          text-white font-semibold text-base
          shadow-md hover:bg-green-800
          active:scale-95 transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        "
            >
              {/* printer icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"
                />
              </svg>
              Print Vendor Enlistment Form
            </button>
          </div>
          <div className="flex items-center justify-center p-6">
            <button
              type="button"
              onClick={handleMoneyReceivedPrint}
              className="
          inline-flex items-center gap-2
          rounded-lg bg-green-700 px-6 py-3
          text-white font-semibold text-base
          shadow-md hover:bg-green-800
          active:scale-95 transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        "
            >
              {/* printer icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"
                />
              </svg>
              Print Vendor Enlistment Form
            </button>
          </div>
          <div className="flex items-center justify-center p-6">
            <button
              type="button"
              onClick={handleFinalSettlementPrint}
              className="
          inline-flex items-center gap-2
          rounded-lg bg-green-700 px-6 py-3
          text-white font-semibold text-base
          shadow-md hover:bg-green-800
          active:scale-95 transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        "
            >
              {/* printer icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"
                />
              </svg>
              Print Vendor Enlistment Form
            </button>
          </div>
        </CardContent>
      </Card>
    </Box>
  );
}
