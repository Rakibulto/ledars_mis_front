'use client';

import { CONFIG } from 'src/config-global';

export default function VendorEnlistmentPrint() {
  const handlePrintVendorEnlishment = () => {
    const baseUrl = CONFIG.appDomainUrl.replace(/\/+$/, '');

    const printContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LEDARS – Vendor Enlistment Form (IVE 2025-2027)</title>
  <style>
    /* ── Reset & Base ─────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
      color: #000;
      background: #fff;
    }

    /* ── Page ─────────────────────────────────────────────────── */
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 14mm 16mm 14mm 16mm;
      margin: 0 auto;
      page-break-after: always;
    }
    .page:last-child { page-break-after: avoid; }

    /* ── Header ───────────────────────────────────────────────── */
    .hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2.5px solid #000;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    .hdr-logos { display: flex; align-items: center; gap: 8px; }
    .hdr-logo  { height: 52px; width: auto; object-fit: contain; }
    .hdr-name-img { height: 38px; width: auto; object-fit: contain; }
    .hdr-address {
      text-align: right;
      font-size: 8pt;
      line-height: 1.5;
    }
    .hdr-address strong { font-size: 9pt; }

    /* ── Page footer ──────────────────────────────────────────── */
    .page-num {
      text-align: center;
      font-size: 9pt;
      margin-top: 12px;
      color: #333;
    }

    /* ── Titles ───────────────────────────────────────────────── */
    .form-title {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin: 10px 0 2px;
    }
    .form-subtitle-bn {
      text-align: center;
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .form-sub2 {
      text-align: center;
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .form-sub2-bn {
      text-align: center;
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 8px;
    }

    /* ── Intro paragraph ─────────────────────────────────────── */
    .intro {
      font-size: 10pt;
      line-height: 1.55;
      margin-bottom: 10px;
      text-align: justify;
    }

    /* ── Section heading ─────────────────────────────────────── */
    .section-hdr {
      font-size: 11pt;
      font-weight: bold;
      text-decoration: underline;
      margin: 10px 0 4px;
    }
    .section-hdr-bn { font-size: 10pt; }

    /* ── Form table ───────────────────────────────────────────── */
    .form-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 10pt;
    }
    .form-table td, .form-table th {
      border: 1px solid #000;
      padding: 5px 7px;
      vertical-align: top;
    }
    .form-table .num-cell {
      width: 28px;
      text-align: center;
      font-weight: bold;
    }
    .form-table .lbl-cell { width: 38%; }
    .form-table .lbl-cell .lbl-en { font-weight: bold; font-style: italic; }
    .form-table .lbl-cell .lbl-bn { font-size: 9pt; }
    .form-table .val-cell { width: 55%; }

    /* field lines inside a cell */
    .field-line {
      display: block;
      border-bottom: 1px solid #555;
      margin-bottom: 5px;
      min-height: 16px;
      font-size: 10pt;
    }
    .field-label { font-size: 10pt; }
    .field-label-bn { font-size: 9pt; }

    /* numbered list inside a cell */
    .client-list { list-style: none; padding: 0; }
    .client-list li {
      border-bottom: 1px solid #555;
      min-height: 16px;
      margin-bottom: 4px;
      font-size: 10pt;
    }

    /* ── Bank table ───────────────────────────────────────────── */
    .bank-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 10pt;
    }
    .bank-table td {
      border: 1px solid #000;
      padding: 5px 7px;
      vertical-align: top;
    }
    .bank-table .b-num  { width: 28px; text-align: center; font-weight: bold; }
    .bank-table .b-lbl  { width: 38%; }
    .bank-table .b-lbl .lbl-en { font-weight: bold; }
    .bank-table .b-lbl .lbl-bn { font-size: 9pt; }
    .bank-table .b-val  { }

    /* ── Signature block ─────────────────────────────────────── */
    .sig-block { margin-top: 12px; font-size: 10pt; line-height: 2; font-style: italic; }
    .sig-line {
      display: inline-block;
      width: 280px;
      border-bottom: 1px solid #000;
    }

    /* ── Terms & Conditions ──────────────────────────────────── */
    .tc-title {
      text-align: center;
      font-size: 13pt;
      font-weight: bold;
      text-decoration: underline;
      margin: 6px 0 2px;
    }
    .tc-title-bn {
      text-align: center;
      font-size: 10pt;
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 8px;
    }
    .tc-list { padding-left: 0; list-style: none; }
    .tc-list > li {
      margin-bottom: 8px;
      font-size: 10pt;
      line-height: 1.5;
    }
    .tc-list > li .tc-en { font-weight: bold; font-style: italic; }
    .tc-list > li .tc-bn { font-size: 9.5pt; }

    /* ── Attachments ─────────────────────────────────────────── */
    .attach-title { font-weight: bold; font-style: italic; font-size: 11pt; margin-top: 10px; }
    .attach-list { list-style: none; padding-left: 0; }
    .attach-list li {
      font-size: 10pt;
      line-height: 1.7;
    }
    .attach-list li .a-num { font-weight: bold; }

    /* ── Application letter (Form-01) ────────────────────────── */
    .form01-banner {
      border: 2px solid #000;
      text-align: center;
      font-weight: bold;
      font-style: italic;
      font-size: 11pt;
      padding: 5px 8px;
      background: #FFFF00;
      margin-bottom: 12px;
    }
    .letter-block { font-size: 10.5pt; line-height: 1.7; }
    .letter-to { margin-bottom: 8px; }
    .subject-line { font-weight: bold; margin-bottom: 10px; font-size: 10.5pt; }
    .declaration-para {
      font-size: 10.5pt;
      line-height: 1.65;
      margin-bottom: 6px;
      text-align: justify;
    }
    .declaration-para .d-en { font-weight: bold; }
    .declaration-para .d-bn { font-size: 9.5pt; }
    .sig-final {
      text-align: right;
      margin-top: 30px;
      font-size: 10.5pt;
      font-weight: bold;
      font-style: italic;
    }

    /* ── Print media ─────────────────────────────────────────── */
    @media print {
      @page {
        size: A4;
        margin: 0;
      }
      body { background: #fff; }
      .page {
        width: 210mm;
        min-height: 297mm;
        padding: 14mm 16mm;
        margin: 0;
      }
    }
  </style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════
     PAGE 1 – Intro + Section A (fields 1-3)
═══════════════════════════════════════════════════════ -->
<div class="page">

  <!-- Header -->
  <div class="hdr">
    <div class="hdr-logos">
      <img class="hdr-logo"     src="${baseUrl}/icons/logo.png"     alt="LEDARS Logo"    onerror="this.style.display='none'" />
      <img class="hdr-name-img" src="${baseUrl}/icons/name_img.png" alt="LEDARS"         onerror="this.style.display='none'" />
    </div>
    <div class="hdr-address">
      <strong>LEDARS</strong><br/>
      Local Environment Development and Agricultural Research Society<br/>
      <strong>Head Office</strong><br/>
      Village: Munshiganj, Post Office: Kadamtala,<br/>
      Upazila: Shyamnagar, District: Satkhira, Post Code: 9455, Bangladesh.
    </div>
  </div>

  <!-- Form Title -->
  <div class="form-title">Invitation for Vendor Enlistment (IVE) 2025-2027.</div>
  <div class="form-subtitle-bn">বিক্রেতা/সরবরাহকারী তালিকা ভুক্তির জন্য আমন্ত্রণ–২০২৫–২০২৭</div>
  <div class="form-sub2">Vendor Information Form</div>
  <div class="form-sub2-bn">বিক্রেতা/সরবরাহকারীর তথ্য ফরম।</div>

  <!-- Intro -->
  <p class="intro">
    LEDARS relies on a strong network of reliable and reputable service providers and suppliers when
    carrying out our development operations capital city (Dhaka) and divisional city (Khulna). New
    potential suppliers are encouraged to submit their registration through the Google link or hard copy.
    Invitation to participate in LEDARS's tenders will depend on LEDARS's evaluation of the company's
    experience, reputation, registration documents, logistics, ability to perform and its financial soundness.
  </p>
  <p class="intro">
    To be considered as a potentially enlisted supplier, the supplier must provide authentic and reliable
    information and ensure that the commodities, items and services offered are within LEDARS's
    requirements. Vendors not meet LEDARS's strict zero tolerance for fraud and corruption will be dealt
    with under its Vendor Sanctions Framework.
  </p>

  <!-- Section A heading -->
  <div class="section-hdr">Section A: Company Details &amp; General Information:</div>
  <div class="section-hdr section-hdr-bn">কোম্পানির বিবরণ এবং সাধারণ তথ্য:</div>

  <!-- Fields 1-3 -->
  <table class="form-table">
    <tbody>
      <!-- 1 -->
      <tr>
        <td class="num-cell">1.</td>
        <td class="lbl-cell">
          <div class="lbl-en">Vendor Company/ Firm/ Name of Company</div>
          <div class="lbl-bn">বিক্রেতা কোম্পানি/ফার্ম/ ব্যবসা প্রতিষ্ঠানের নাম</div>
        </td>
        <td class="val-cell">&nbsp;</td>
      </tr>
      <!-- 2 -->
      <tr>
        <td class="num-cell">2.</td>
        <td class="lbl-cell">
          <div class="lbl-en">Proprietor Information</div>
          <div class="lbl-bn">মালিকের তথ্য</div>
        </td>
        <td class="val-cell">
          <span class="field-label">Name: নাম </span><span class="field-line"></span>
          <span class="field-label">Title: পদবী </span><span class="field-line"></span>
          <span class="field-label">Cell No: যোগাযোগের নম্বর </span><span class="field-line"></span>
          <span class="field-label">Email: ইমেল </span><span class="field-line"></span>
        </td>
      </tr>
      <!-- 3 -->
      <tr>
        <td class="num-cell">3.</td>
        <td class="lbl-cell">
          <div class="lbl-en">Address</div>
          <div class="lbl-bn">ঠিকানা</div>
        </td>
        <td class="val-cell">
          <span class="field-label">Village/Road: গ্রাম/ রাস্তা </span><span class="field-line"></span>
          <span class="field-label">House No: বাড়ি নম্বর </span><span class="field-line"></span>
          <span class="field-label">Postal Code: পোস্ট কোড </span><span class="field-line"></span>
          <span class="field-label">City: শহর </span><span class="field-line"></span>
          <span class="field-label">Division: বিভাগ </span><span class="field-line"></span>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="page-num">Page 1 of 6</div>
</div>


<!-- ═══════════════════════════════════════════════════
     PAGE 2 – Section A (fields 4-13)
═══════════════════════════════════════════════════════ -->
<div class="page">

  <!-- Header -->
  <div class="hdr">
    <div class="hdr-logos">
      <img class="hdr-logo"     src="${baseUrl}/icons/logo.png"     alt="LEDARS Logo" onerror="this.style.display='none'" />
      <img class="hdr-name-img" src="${baseUrl}/icons/name_img.png" alt="LEDARS"      onerror="this.style.display='none'" />
    </div>
    <div class="hdr-address">
      <strong>LEDARS</strong><br/>
      Local Environment Development and Agricultural Research Society<br/>
      <strong>Head Office</strong><br/>
      Village: Munshiganj, Post Office: Kadamtala,<br/>
      Upazila: Shyamnagar, District: Satkhira, Post Code: 9455, Bangladesh.
    </div>
  </div>

  <table class="form-table">
    <tbody>
      <!-- 4 -->
      <tr>
        <td class="num-cell">4.</td>
        <td class="lbl-cell">
          <div class="lbl-en">Contact Person</div>
          <div class="lbl-bn">যোগাযোগের মুখ্য ব্যক্তি</div>
        </td>
        <td class="val-cell">
          <span class="field-label">Name (নাম): </span><span class="field-line"></span>
          <span class="field-label">Title (পদবী): </span><span class="field-line"></span>
          <span class="field-label">Cell No (যোগাযোগের নম্বর): </span><span class="field-line"></span>
          <span class="field-label">Email (ইমেল): </span><span class="field-line"></span>
          <span class="field-label">Website [ওয়েবসাইট (যদি থাকে)]: </span><span class="field-line"></span>
        </td>
      </tr>
      <!-- 5 -->
      <tr>
        <td class="num-cell">5.</td>
        <td class="lbl-cell">
          <div class="lbl-en">Year of Establishment</div>
          <div class="lbl-bn">প্রতিষ্ঠার বছর:</div>
        </td>
        <td class="val-cell">&nbsp;</td>
      </tr>
      <!-- 6 -->
      <tr>
        <td class="num-cell">6.</td>
        <td class="lbl-cell">
          <div class="lbl-en">Nature of Business</div>
          <div class="lbl-bn">ব্যবসার প্রকৃতি বা ধরণ</div>
        </td>
        <td class="val-cell">&nbsp;<br/>&nbsp;</td>
      </tr>
      <!-- 7 -->
      <tr>
        <td class="num-cell">7.</td>
        <td class="lbl-cell">
          <div class="lbl-bn">প্রতিষ্ঠানের অন্য কোন শাখা থাকলে তার বিবরণ ঃ</div>
        </td>
        <td class="val-cell">
          <span class="field-label">Name: নাম </span><span class="field-line"></span>
          <span class="field-label">Address: ঠিকানা </span><span class="field-line"></span>
          <span class="field-label">Cell No: যোগাযোগের নম্বর </span><span class="field-line"></span>
          <span class="field-label">Email: ইমেল </span><span class="field-line"></span>
          <span class="field-label">Website [ওয়েবসাইট (যদি থাকে)]: </span><span class="field-line"></span>
        </td>
      </tr>
      <!-- 8 -->
      <tr>
        <td class="num-cell">8.</td>
        <td class="lbl-cell">
          <div class="lbl-en">Last years Client list with contact person name, number and e-mail ID information:</div>
          <div class="lbl-bn">বিগত বছরের ক্লাইন্ট এর তালিকা (যোগাযোগের জন্য ব্যক্তির নাম, নম্বর এবং ইমেইল আইডি)</div>
        </td>
        <td class="val-cell">
          <ul class="client-list">
            <li>1. &nbsp;</li>
            <li>2. &nbsp;</li>
            <li>3. &nbsp;</li>
            <li>4. &nbsp;</li>
            <li>5. &nbsp;</li>
          </ul>
        </td>
      </tr>
      <!-- 9 -->
      <tr>
        <td class="num-cell">9.</td>
        <td class="lbl-cell">
          <div class="lbl-en">Trade License</div>
          <div class="lbl-bn">ট্রেড লাইসেন্স</div>
        </td>
        <td class="val-cell">
          <span class="field-label">Trade License No. ট্রেড লাইসেন্স নম্বর: </span><span class="field-line"></span>
          <span class="field-label">Valid Date: বৈধ তারিখ: </span><span class="field-line"></span>
        </td>
      </tr>
      <!-- 10 -->
      <tr>
        <td class="num-cell">10.</td>
        <td class="lbl-cell">
          <div class="lbl-en">VAT No/ BIN No.</div>
          <div class="lbl-bn">ভ্যাট রেজিস্ট্রেশান নম্বর:</div>
        </td>
        <td class="val-cell">&nbsp;</td>
      </tr>
      <!-- 11 -->
      <tr>
        <td class="num-cell">11.</td>
        <td class="lbl-cell">
          <div class="lbl-en">TIN No.</div>
          <div class="lbl-bn">আয় কর সনদ নম্বর (টিআইএন):</div>
        </td>
        <td class="val-cell">&nbsp;</td>
      </tr>
      <!-- 12 -->
      <tr>
        <td class="num-cell">12.</td>
        <td class="lbl-cell">
          <div class="lbl-en">Tax Return Acknowledgement</div>
          <div class="lbl-bn">ট্যাক্স রিটার্ন জমা প্রদানের প্রমাণপত্র:</div>
        </td>
        <td class="val-cell">&nbsp;</td>
      </tr>
      <!-- 13 -->
      <tr>
        <td class="num-cell">13.</td>
        <td class="lbl-cell" colspan="2">
          <div class="lbl-en">Others License No (If any)</div>
          <div class="lbl-bn">অন্যান্য <strong>লাইসেন্স নম্বর:</strong></div>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="page-num">Page 2 of 6</div>
</div>


<!-- ═══════════════════════════════════════════════════
     PAGE 3 – Section B: Bank Info + Signature
═══════════════════════════════════════════════════════ -->
<div class="page">

  <!-- Header -->
  <div class="hdr">
    <div class="hdr-logos">
      <img class="hdr-logo"     src="${baseUrl}/icons/logo.png"     alt="LEDARS Logo" onerror="this.style.display='none'" />
      <img class="hdr-name-img" src="${baseUrl}/icons/name_img.png" alt="LEDARS"      onerror="this.style.display='none'" />
    </div>
    <div class="hdr-address">
      <strong>LEDARS</strong><br/>
      Local Environment Development and Agricultural Research Society<br/>
      <strong>Head Office</strong><br/>
      Village: Munshiganj, Post Office: Kadamtala,<br/>
      Upazila: Shyamnagar, District: Satkhira, Post Code: 9455, Bangladesh.
    </div>
  </div>

  <!-- Bank Section heading -->
  <div class="section-hdr" style="margin-bottom:6px;">B. Bank Information: <span style="font-size:10pt;font-style:normal;">ব্যাংক হিসাব সম্পর্কিত</span></div>

  <table class="bank-table">
    <tbody>
      <tr>
        <td class="b-num">1.</td>
        <td class="b-lbl">
          <div class="lbl-en">Account Name</div>
          <div class="lbl-bn">হিসাবের নাম</div>
        </td>
        <td class="b-val">&nbsp;</td>
      </tr>
      <tr>
        <td class="b-num">2.</td>
        <td class="b-lbl">
          <div class="lbl-en">Account No</div>
          <div class="lbl-bn">হিসাব নম্বর</div>
        </td>
        <td class="b-val">&nbsp;</td>
      </tr>
      <tr>
        <td class="b-num">3.</td>
        <td class="b-lbl">
          <div class="lbl-en">Bank Name</div>
          <div class="lbl-bn">ব্যাংকের নাম</div>
        </td>
        <td class="b-val">&nbsp;</td>
      </tr>
      <tr>
        <td class="b-num">4.</td>
        <td class="b-lbl">
          <div class="lbl-en">Branch Name</div>
          <div class="lbl-bn">শাখার নাম</div>
        </td>
        <td class="b-val">&nbsp;</td>
      </tr>
      <tr>
        <td class="b-num">5.</td>
        <td class="b-lbl">
          <div class="lbl-en">Routing No</div>
          <div class="lbl-bn">রাউটিং নম্বর</div>
        </td>
        <td class="b-val">&nbsp;</td>
      </tr>
    </tbody>
  </table>

  <!-- Declaration & Signature -->
  <p style="font-size:10.5pt;font-weight:bold;font-style:italic;line-height:1.6;margin-bottom:4px;">
    I, representing the Organization/ Company acknowledge and ensure the Organization/ Farm/ Company's compliance with the above statements:
  </p>
  <p style="font-size:9.5pt;line-height:1.6;margin-bottom:14px;">
    আমি, সংস্থা/ কোম্পানীর প্রতিনিধিত্ব করছি এবং উপরোক্ত বিবৃতিগুলির সাথে সংস্থা/ কোম্পানীর সম্মতি স্বীকার করছি এবং নিশ্চিত করছি:
  </p>

  <div class="sig-block">
    <p><em>Name &amp; Title:</em> নাম ও পদবী &nbsp;<span class="sig-line"></span></p>
    <br/>
    <p><em>Name of the Company:</em> ব্যবসা প্রতিষ্ঠানের নাম &nbsp;<span class="sig-line"></span></p>
    <br/>
    <p><em>Seal, Signature &amp; Date:</em> আবেদনকারীর সিল ও স্বাক্ষর &nbsp;<span class="sig-line"></span></p>
  </div>

  <div class="page-num">Page 3 of 6</div>
</div>


<!-- ═══════════════════════════════════════════════════
     PAGE 4 – Terms & Conditions (1-8)
═══════════════════════════════════════════════════════ -->
<div class="page">

  <!-- Header -->
  <div class="hdr">
    <div class="hdr-logos">
      <img class="hdr-logo"     src="${baseUrl}/icons/logo.png"     alt="LEDARS Logo" onerror="this.style.display='none'" />
      <img class="hdr-name-img" src="${baseUrl}/icons/name_img.png" alt="LEDARS"      onerror="this.style.display='none'" />
    </div>
    <div class="hdr-address">
      <strong>LEDARS</strong><br/>
      Local Environment Development and Agricultural Research Society<br/>
      <strong>Head Office</strong><br/>
      Village: Munshiganj, Post Office: Kadamtala,<br/>
      Upazila: Shyamnagar, District: Satkhira, Post Code: 9455, Bangladesh.
    </div>
  </div>

  <div class="tc-title">TERMS AND CONDITIONS</div>
  <div class="tc-title-bn">শর্তাবলী এবং শর্তপ্রযোজ্য</div>

  <ol class="tc-list">
    <li>
      <span class="tc-en">1. Mode of payment: Payment should be made through Account Payee cheque/Pay order/RTGS/BEFTN or DD in favor of the vendor.</span><br/>
      <span class="tc-bn">(অর্থপ্রদানের পদ্ধতি: বিক্রেতার অনুকূলে, – অ্যাকাউন্ট পে চেক/পে অর্ডার/RTGS/BEFTN বা DD-এর মাধ্যমে অর্থপ্রদান করা হবে)</span>
    </li>
    <li>
      <span class="tc-en">2. VAT, Tax as applicable will be deducted, at source by LEDARS as per NBR (National Board of Revenue, Bangladesh) rules.</span><br/>
      <span class="tc-bn">এনবিআর (জাতীয় রাজস্ব বোর্ড, বাংলাদেশ) নিয়ম অনুসারে LEDARS দ্বারা উৎসে ভ্যাট, ট্যাক্স কর্তন করা হবে।</span>
    </li>
    <li>
      <span class="tc-en">3. The Supplier will have to complete the delivery accordingly with the Terms and Conditions.</span><br/>
      <span class="tc-bn">সরবরাহকারীকে শর্তাবলী সহ সেই অনুযায়ী ডেলিভারি সম্পন্ন করতে হবে।</span>
    </li>
    <li>
      <span class="tc-en">4. Goods/ Works/Services delivery will be reported immediately by Vendor to Purchaser. Purchaser reserves the right to cancel this Purchase Order in whole or in part if Vendor should fail to make deliveries in accordance with the terms of the Purchase Order or agreement.</span><br/>
      <span class="tc-bn">পণ্য/কাজ/পরিষেবা সরবরাহ অবিলম্বে বিক্রেতা দ্বারা ক্রয়কারীকে জানানো হবে। যদি বিক্রেতা ক্রয় আদেশ বা চুক্তির শর্তাবলী অনুসারে বিতরণ করতে ব্যর্থ হয় তবে ক্রয়কারী এই ক্রয় আদেশটি সম্পূর্ণ বা আংশিকভাবে বাতিল করার অধিকার সংরক্ষণ করে।</span>
    </li>
    <li>
      <span class="tc-en">5. Any defect in manufacture/ Goods/Works/ Services will not be accepted.</span><br/>
      <span class="tc-bn">প্রস্তুতকারক/পণ্য/কাজ/পরিষেবার কোনো ত্রুটি গ্রহণ করা হবে না।</span>
    </li>
    <li>
      <span class="tc-en">6. Any claim arising out of the delivery of Goods/works and related services shall be settled by the supplier at his/her own cost and responsibility.</span><br/>
      <span class="tc-bn">পণ্য/কাজ এবং সম্পর্কিত পরিষেবা সরবরাহের ফলে উদ্ভূত যে কোনও দাবি সরবরাহকারী তার নিজের খরচ এবং দায়িত্বে নিষ্পত্তি করবে।</span>
    </li>
    <li>
      <span class="tc-en">7. LEDARS reserved the authority to cancel-partial or full quotation/tender with or without any explanation.</span><br/>
      <span class="tc-bn">লিডার্স প্রয়োজন অনুযায়ী যে কোনো সময়, কোনো ব্যাখ্যা প্রদান ছাড়াই, আংশিক বা সম্পূর্ণ উদ্ধৃতি/দরপত্র বাতিল করার ক্ষমতা সংরক্ষণ করে।</span>
    </li>
    <li>
      <span class="tc-en">8. Applicants for the enlistment process should share the declaration if they know anyone who is working in LEDARS in advance to ensure the process is transparent. If any information discloses later after completing the enlistment process, the application may get disqualified based on LEDARS management decision.</span><br/>
      <span class="tc-bn">আবেদন প্রক্রিয়ার জন্য আবেদনকারীদের অগ্রিম ঘোষণা দিতে হবে যদি তারা LEDARS-এ কর্মরত কোনো ব্যক্তিকে চেনেন, যাতে প্রক্রিয়াটি স্বচ্ছ থাকে। যদি আবেদন প্রক্রিয়া সম্পন্ন হওয়ার পরে কোনো তথ্য প্রকাশ পায়, তবে LEDARS পরিচালনা পর্ষদের সিদ্ধান্ত অনুযায়ী আবেদন বাতিল হতে পারে।</span>
    </li>
  </ol>

  <div class="page-num">Page 4 of 6</div>
</div>


<!-- ═══════════════════════════════════════════════════
     PAGE 5 – Terms 9-10 + Attachments
═══════════════════════════════════════════════════════ -->
<div class="page">

  <!-- Header -->
  <div class="hdr">
    <div class="hdr-logos">
      <img class="hdr-logo"     src="${baseUrl}/icons/logo.png"     alt="LEDARS Logo" onerror="this.style.display='none'" />
      <img class="hdr-name-img" src="${baseUrl}/icons/name_img.png" alt="LEDARS"      onerror="this.style.display='none'" />
    </div>
    <div class="hdr-address">
      <strong>LEDARS</strong><br/>
      Local Environment Development and Agricultural Research Society<br/>
      <strong>Head Office</strong><br/>
      Village: Munshiganj, Post Office: Kadamtala,<br/>
      Upazila: Shyamnagar, District: Satkhira, Post Code: 9455, Bangladesh.
    </div>
  </div>

  <ol class="tc-list" style="margin-top:6px;">
    <li>
      <span class="tc-en">9. Repeated failures of the vendor to participate in bids or respond to LEDARS product queries can lead to the removal of the vendor in question from the enlistment.</span><br/>
      <span class="tc-bn">বিডগুলিতে অংশ নিতে বা LEDARS পণ্যের প্রশ্নের উত্তর দিতে বিক্রেতার বারবার ব্যর্থ হলে সংশ্লিষ্ট সরবরাহকারীকে তালিকা থেকে অপসারণ করা হতে পারে।</span>
    </li>
    <li style="margin-top:8px;">
      <span class="tc-en">10. LEDARS never allows any harassment of women and children and never allows child labour. Any Person, institution, or organization associated with those is strongly discouraged to participate in the enlistment process.</span><br/>
      <span class="tc-bn">লিডার্স কখনো নারীদের ও শিশুদের হয়রানি সমর্থন করে না এবং শিশুশ্রমের কোনোভাবেই অনুমোদন দেয় না। যে কোনো ব্যক্তি, প্রতিষ্ঠান বা সংগঠন যারা এসবের সাথে জড়িত, তাদের তালিকাভুক্তির প্রক্রিয়ায় অংশগ্রহণ করতে কঠোরভাবে নিরুৎসাহিত করা হয়।</span>
    </li>
  </ol>

  <!-- Attachments -->
  <div class="attach-title">Attachment: <span style="font-size:10pt;font-weight:normal;font-style:normal;">(সংযুক্তি)</span></div>
  <ul class="attach-list" style="margin-top:6px;">
    <li><span class="a-num">1.</span> <strong><em>Organization/ Company profile.</em></strong> (সংস্থা/কোম্পানীর প্রোফাইল)</li>
    <li><span class="a-num">2.</span> <strong><em>Valid Trade License.</em></strong> (বৈধ ট্রেড লাইসেন্স)</li>
    <li><span class="a-num">3.</span> <strong><em>TIN Certificate.</em></strong> (টিআইএন সার্টিফিকেট)</li>
    <li><span class="a-num">4.</span> <strong><em>BIN Certificate.</em></strong> (BIN সার্টিফিকেট)</li>
    <li><span class="a-num">5.</span> <strong><em>Others License.</em></strong> (অন্যান্য লাইসেন্স)</li>
    <li><span class="a-num">6.</span> <strong><em>Experience Certificate/PO.</em></strong> (অভিজ্ঞতা সার্টিফিকেট/পিও)</li>
    <li><span class="a-num">7.</span> <strong><em>Bank Account Certificate.</em></strong> (ব্যাংক হিসাব সম্পর্কিত সার্টিফিকেট)</li>
    <li><span class="a-num">8.</span> <strong><em>Vendor Enlistment Application.</em></strong> (বিক্রেতা তালিকাভুক্তি আবেদন)</li>
  </ul>

  <div class="page-num">Page 5 of 6</div>
</div>


<!-- ═══════════════════════════════════════════════════
     PAGE 6 – Application Letter (Form-01)
═══════════════════════════════════════════════════════ -->
<div class="page">

  <!-- Header -->
  <div class="hdr">
    <div class="hdr-logos">
      <img class="hdr-logo"     src="${baseUrl}/icons/logo.png"     alt="LEDARS Logo" onerror="this.style.display='none'" />
      <img class="hdr-name-img" src="${baseUrl}/icons/name_img.png" alt="LEDARS"      onerror="this.style.display='none'" />
    </div>
    <div class="hdr-address">
      <strong>LEDARS</strong><br/>
      Local Environment Development and Agricultural Research Society<br/>
      <strong>Head Office</strong><br/>
      Village: Munshiganj, Post Office: Kadamtala,<br/>
      Upazila: Shyamnagar, District: Satkhira, Post Code: 9455, Bangladesh.
    </div>
  </div>

  <!-- Form-01 Banner -->
  <div class="form01-banner">
    সরবরাহকারী তালিকাভুক্তির আবেদনপত্র শীট (ফরম- ০১) যাহা আবেদন কারীকে তার নিজস্ব প্যাডে সীল, স্বাক্ষর সহ লিখতে হবে।
  </div>

  <div class="letter-block">
    <p>তারিখ: <span class="field-line" style="display:inline-block;width:160px;border-bottom:1px solid #000;"></span></p>
    <br/>
    <div class="letter-to">
      বরাবর,<br/>
      নির্বাহী পরিচালক<br/>
      লিডার্স<br/>
      শ্যামনগর, সাতক্ষীরা।
    </div>

    <p class="subject-line">
      Subject: Application for vendor enlistment for Two (2) Years.<br/>
      বিষয় ঃ দুই (২) বছরের সরবরাহকারী তালিকাভুক্তির জন্য আবেদন।
    </p>

    <div class="declaration-para">
      <span class="d-en">I/We declare that, I/we have the legal capacity to enter into a contract with you, and have not been declared ineligible by the Government of Bangladesh on charges of engaging in corrupt, fraudulent, collusive or coercive practices.</span><br/>
      <span class="d-bn">(আমি/আমরা ঘোষণা করছি যে, আমি/আমরা আপনার সাথে চুক্তি সম্পাদনের জন্য আইনগত সক্ষমতা রাখি এবং দুর্নীতিপূর্ণ, প্রতারণাপূর্ণ, আঁতাতমূলক বা জবরদস্তিমূলক কার্যকলাপের অভিযোগে বাংলাদেশ সরকারের দ্বারা অযোগ্য ঘোষিত হইনি)</span>
    </div>

    <div class="declaration-para">
      <span class="d-en">I/We am/are not submitting more than one Application in this enlistment/ renewal of enlistment process in my/our own name or other name or in different names.</span><br/>
      <span class="d-bn">(আমি/আমরা এই তালিকাভুক্তি/তালিকাভুক্তি নবায়ন প্রক্রিয়ায় আমার/আমাদের নিজের নাম, অন্য কোনো নাম, বা ভিন্ন নাম ব্যবহার করে একাধিক আবেদন দাখিল করছি না)</span>
    </div>

    <div class="declaration-para">
      <span class="d-en">I/We have examined and have no reservations to the Document issued by you.</span><br/>
      <span class="d-bn">(আমরা পরীক্ষা করেছি এবং আপনার দ্বারা প্রদত্ত নথির প্রতি আমাদের কোনো আপত্তি নেই)</span>
    </div>

    <div class="declaration-para">
      <span class="d-en">I/We certify that to the best of my/our knowledge, the information provided by me/us is correct and true.</span><br/>
      <span class="d-bn">(আমি/আমরা প্রত্যয়ন করছি যে আমার/আমাদের দ্বারা প্রদত্ত তথ্য সর্বোত্তম জ্ঞান অনুযায়ী সঠিক এবং সত্য)</span>
    </div>

    <div class="declaration-para">
      <span class="d-en">I/We understand that if any of the particulars and statements provided above is proven to be incorrect and false, my/our enlistment shall be liable to cancellation.</span><br/>
      <span class="d-bn">(আমি/আমরা বুঝি যে উপরোক্ত প্রদত্ত তথ্য ও বিবৃতিগুলোর কোনোটি যদি ভুল বা মিথ্যা প্রমাণিত হয়, তাহলে আমার/আমাদের তালিকাভুক্তি বাতিলের জন্য দায়ী থাকবে)</span>
    </div>

    <div class="declaration-para">
      <span class="d-en">I/We understand that you reserve the right to reject all the Applications or annul the enlistment proceedings without incurring any liability to Applicant.</span><br/>
      <span class="d-bn">(আমি/আমরা বুঝি যে আপনি সমস্ত আবেদন প্রত্যাখ্যান করার বা আবেদনকারীর প্রতি কোনো দায় বদ্ধতা ছাড়াই তালিকা ভুক্তির প্রক্রিয়া বাতিল করার অধিকার সংরক্ষণ করেন)</span>
    </div>

    <div class="sig-final">
      Seal &amp; Signature of the Applicant (Vendor)<br/>
      আবেদনকারীর সিল ও স্বাক্ষর
    </div>
  </div>

  <div class="page-num">Page 6 of 6</div>
</div>

<script>
  window.onload = function () {
    window.print();
  };
</script>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Please allow popups for this site to print the form.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="flex items-center justify-center p-6">
      <button
        type="button"
        onClick={handlePrintVendorEnlishment}
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
  );
}
