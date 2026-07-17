'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  X,
  Eye,
  Mail,
  Bell,
  Phone,
  Clock,
  Globe,
  MapPin,
  Shield,
  XCircle,
  FileText,
  Download,
  Building2,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
import {
  useVendorDetail,
  useVendorWorkOrders,
  useVendorRFQInvitations,
  useVendorPerformanceRecords,
  useVendorPerformanceSummary,
} from './use-vendor-api';

export function VendorDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('profile');
  const { data: apiVendor } = useVendorDetail(id);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const { data: rfqInvData } = useVendorRFQInvitations(id);
  const { data: workOrderData } = useVendorWorkOrders(id);
  const { data: perfData } = useVendorPerformanceRecords(id);
  const { data: perfSummary } = useVendorPerformanceSummary(id);

  const vendor = {
    id: apiVendor?.id || id || '',
    companyName: apiVendor?.name || '',
    companyNameBn: apiVendor?.company_name_bn || '',
    contactPerson: apiVendor?.contact_person || '',
    designation: apiVendor?.designation || '',
    email: apiVendor?.email || '',
    phone: apiVendor?.phone || '',
    website: apiVendor?.website || '',
    address: apiVendor?.address || '',
    district: apiVendor?.district || '',
    division: apiVendor?.division || '',
    registrationNumber: apiVendor?.registration_number || '',
    yearEstablished: apiVendor?.year_established || '',
    status: apiVendor?.status || '',
    verificationState: apiVendor?.verification_state || '',
    registrationDate: apiVendor?.registration_date || '',
    enlistmentYear: apiVendor?.enlistment_year || '',
    categories: Array.isArray(apiVendor?.categories)
      ? apiVendor.categories.map((c) => (typeof c === 'object' ? c.name : c))
      : [],
    tin: apiVendor?.tax_id || '',
    vatBin: apiVendor?.bin_number || '',
    totalOrders: apiVendor?.total_orders ?? 0,
    totalValue: apiVendor?.total_value ?? 0,
    avgRating: apiVendor?.overall_rating ?? 0,
    twoFAEnabled: apiVendor?.two_fa_enabled || false,
    portalLastLogin: apiVendor?.portal_last_login || '',
    // Enlistment form fields
    villageRoad: apiVendor?.village_road || '',
    houseNumber: apiVendor?.house_number || '',
    postalCode: apiVendor?.postal_code || '',
    city: apiVendor?.city || '',
    proprietorName: apiVendor?.proprietor_name || '',
    proprietorTitle: apiVendor?.proprietor_title || '',
    proprietorCell: apiVendor?.proprietor_cell || '',
    proprietorEmail: apiVendor?.proprietor_email || '',
    natureOfBusiness: apiVendor?.nature_of_business || '',
    otherBranchName: apiVendor?.other_branch_name || '',
    otherBranchAddress: apiVendor?.other_branch_address || '',
    otherBranchCell: apiVendor?.other_branch_cell || '',
    otherBranchEmail: apiVendor?.other_branch_email || '',
    otherBranchWebsite: apiVendor?.other_branch_website || '',
    lastYearClients: Array.isArray(apiVendor?.last_year_clients) ? apiVendor.last_year_clients : [],
    tradeLicenseValidDate: apiVendor?.trade_license_valid_date || '',
    taxReturnAcknowledgement: apiVendor?.tax_return_acknowledgement || false,
    othersLicenseNo: apiVendor?.others_license_no || '',
    declarationNameTitle: apiVendor?.declaration_name_title || '',
    declarationCompanyName: apiVendor?.declaration_company_name || '',
    declarationDate: apiVendor?.declaration_date || '',
  };
  const bankDetails = {
    bankName: apiVendor?.bank_name || '',
    branchName: apiVendor?.branch_name || '',
    accountName: apiVendor?.account_name || '',
    accountNumber: apiVendor?.account_number
      ? `****${String(apiVendor.account_number).slice(-4)}`
      : '',
    routingNumber: apiVendor?.routing_number || '',
    accountType: apiVendor?.account_type || '',
    swiftCode: apiVendor?.swift_code || '',
  };
  const documents = Array.isArray(apiVendor?.documents)
    ? apiVendor.documents.map((d) => ({
        id: d.id,
        name: d.doc_type || '',
        type: d.doc_type || '',
        uploadDate: d.uploaded_at || '',
        expiryDate: d.expiry_date || null,
        status: d.review_status || 'pending',
        daysToExpiry: d.expiry_date
          ? Math.ceil((new Date(d.expiry_date) - new Date()) / 86400000)
          : null,
        size: '',
        fileUrl: d.file_url || d.file || '',
      }))
    : [];
  const rfqHistory = Array.isArray(rfqInvData?.results)
    ? rfqInvData.results
    : Array.isArray(rfqInvData)
      ? rfqInvData
      : [];
  const workOrders = Array.isArray(workOrderData?.results)
    ? workOrderData.results
    : Array.isArray(workOrderData)
      ? workOrderData
      : [];
  const performanceRecords = Array.isArray(perfData?.results)
    ? perfData.results
    : Array.isArray(perfData)
      ? perfData
      : [];
  const performance = {
    onTimeDelivery:
      perfSummary?.total_on_time && perfSummary?.total_orders
        ? Math.round((perfSummary.total_on_time / perfSummary.total_orders) * 100)
        : 0,
    totalOrders: perfSummary?.total_orders ?? 0,
    totalOnTime: perfSummary?.total_on_time ?? 0,
    totalLate: perfSummary?.total_late ?? 0,
    totalRejected: perfSummary?.total_rejected ?? 0,
    totalSpent: parseFloat(perfSummary?.total_spent ?? 0),
    avgCompliance: parseFloat(perfSummary?.avg_compliance ?? 0),
  };
  const expiryAlerts = documents
    .filter((d) => d.daysToExpiry !== null && d.daysToExpiry <= 90)
    .map((d) => ({
      doc: d.name,
      expiryDate: d.expiryDate,
      daysLeft: d.daysToExpiry,
    }));
  const totalEstimatedValue = performance.totalSpent;
  const getDocExpiryBadge = (daysToExpiry) => {
    if (daysToExpiry === null)
      return (
        <Badge variant="default" size="sm">
          No Expiry
        </Badge>
      );
    if (daysToExpiry <= 30)
      return (
        <Badge variant="danger" size="sm">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {daysToExpiry}d
        </Badge>
      );
    if (daysToExpiry <= 90)
      return (
        <Badge variant="warning" size="sm">
          <Clock className="w-3 h-3 mr-1" />
          {daysToExpiry}d
        </Badge>
      );
    return (
      <Badge variant="success" size="sm">
        <CheckCircle className="w-3 h-3 mr-1" />
        {daysToExpiry}d
      </Badge>
    );
  };

  const handlePrintVendorEnlishment = () => {
    const baseUrl = CONFIG.appDomainUrl.replace(/\/+$/, '');
    const v = apiVendor || {};
    const clientList = Array.isArray(v.last_year_clients) ? v.last_year_clients : [];
    const clientHtml = clientList
      .slice(0, 5)
      .map(
        (c, i) =>
          `<li>${i + 1}. ${c.name || ''} — ${c.contact_number || ''} — ${c.email || ''}</li>`
      )
      .join('');

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
          <td class="val-cell">${v.name || ''} ${v.company_name_bn ? `(${v.company_name_bn})` : ''}</td>
        </tr>
        <!-- 2 -->
        <tr>
          <td class="num-cell">2.</td>
          <td class="lbl-cell">
            <div class="lbl-en">Proprietor Information</div>
            <div class="lbl-bn">মালিকের তথ্য</div>
          </td>
          <td class="val-cell">
            <span class="field-label">Name: নাম </span><span class="field-line">${v.proprietor_name || ''}</span>
            <span class="field-label">Title: পদবী </span><span class="field-line">${v.proprietor_title || ''}</span>
            <span class="field-label">Cell No: যোগাযোগের নম্বর </span><span class="field-line">${v.proprietor_cell || ''}</span>
            <span class="field-label">Email: ইমেল </span><span class="field-line">${v.proprietor_email || ''}</span>
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
            <span class="field-label">Village/Road: গ্রাম/ রাস্তা </span><span class="field-line">${v.village_road || v.address || ''}</span>
            <span class="field-label">House No: বাড়ি নম্বর </span><span class="field-line">${v.house_number || ''}</span>
            <span class="field-label">Postal Code: পোস্ট কোড </span><span class="field-line">${v.postal_code || ''}</span>
            <span class="field-label">City: শহর </span><span class="field-line">${v.city || v.district || ''}</span>
            <span class="field-label">Division: বিভাগ </span><span class="field-line">${v.division || ''}</span>
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
            <span class="field-label">Name (নাম): </span><span class="field-line">${v.contact_person || ''}</span>
            <span class="field-label">Title (পদবী): </span><span class="field-line">${v.designation || ''}</span>
            <span class="field-label">Cell No (যোগাযোগের নম্বর): </span><span class="field-line">${v.phone || ''}</span>
            <span class="field-label">Email (ইমেল): </span><span class="field-line">${v.email || ''}</span>
            <span class="field-label">Website [ওয়েবসাইট (যদি থাকে)]: </span><span class="field-line">${v.website || ''}</span>
          </td>
        </tr>
        <!-- 5 -->
        <tr>
          <td class="num-cell">5.</td>
          <td class="lbl-cell">
            <div class="lbl-en">Year of Establishment</div>
            <div class="lbl-bn">প্রতিষ্ঠার বছর:</div>
          </td>
          <td class="val-cell">${v.year_established || ''}</td>
        </tr>
        <!-- 6 -->
        <tr>
          <td class="num-cell">6.</td>
          <td class="lbl-cell">
            <div class="lbl-en">Nature of Business</div>
            <div class="lbl-bn">ব্যবসার প্রকৃতি বা ধরণ</div>
          </td>
          <td class="val-cell">${v.nature_of_business || ''}</td>
        </tr>
        <!-- 7 -->
        <tr>
          <td class="num-cell">7.</td>
          <td class="lbl-cell">
            <div class="lbl-bn">প্রতিষ্ঠানের অন্য কোন শাখা থাকলে তার বিবরণ ঃ</div>
          </td>
          <td class="val-cell">
            <span class="field-label">Name: নাম </span><span class="field-line">${v.other_branch_name || ''}</span>
            <span class="field-label">Address: ঠিকানা </span><span class="field-line">${v.other_branch_address || ''}</span>
            <span class="field-label">Cell No: যোগাযোগের নম্বর </span><span class="field-line">${v.other_branch_cell || ''}</span>
            <span class="field-label">Email: ইমেল </span><span class="field-line">${v.other_branch_email || ''}</span>
            <span class="field-label">Website [ওয়েবসাইট (যদি থাকে)]: </span><span class="field-line">${v.other_branch_website || ''}</span>
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
              ${clientHtml || '<li>1. &nbsp;</li><li>2. &nbsp;</li><li>3. &nbsp;</li><li>4. &nbsp;</li><li>5. &nbsp;</li>'}
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
            <span class="field-label">Trade License No. ট্রেড লাইসেন্স নম্বর: </span><span class="field-line">${v.trade_license_number || ''}</span>
            <span class="field-label">Valid Date: বৈধ তারিখ: </span><span class="field-line">${v.trade_license_valid_date || v.trade_license_expiry || ''}</span>
          </td>
        </tr>
        <!-- 10 -->
        <tr>
          <td class="num-cell">10.</td>
          <td class="lbl-cell">
            <div class="lbl-en">VAT No/ BIN No.</div>
            <div class="lbl-bn">ভ্যাট রেজিস্ট্রেশান নম্বর:</div>
          </td>
          <td class="val-cell">${v.bin_number || ''}</td>
        </tr>
        <!-- 11 -->
        <tr>
          <td class="num-cell">11.</td>
          <td class="lbl-cell">
            <div class="lbl-en">TIN No.</div>
            <div class="lbl-bn">আয় কর সনদ নম্বর (টিআইএন):</div>
          </td>
          <td class="val-cell">${v.tax_id || ''}</td>
        </tr>
        <!-- 12 -->
        <tr>
          <td class="num-cell">12.</td>
          <td class="lbl-cell">
            <div class="lbl-en">Tax Return Acknowledgement</div>
            <div class="lbl-bn">ট্যাক্স রিটার্ন জমা প্রদানের প্রমাণপত্র:</div>
          </td>
          <td class="val-cell">${v.tax_return_acknowledgement ? 'Yes' : 'No'}</td>
        </tr>
        <!-- 13 -->
        <tr>
          <td class="num-cell">13.</td>
          <td class="lbl-cell" colspan="2">
            <div class="lbl-en">Others License No (If any): ${v.others_license_no || ''}</div>
            <div class="lbl-bn">অন্যান্য <strong>লাইসেন্স নম্বর:</strong> ${v.others_license_no || ''}</div>
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
          <td class="b-val">${v.account_name || ''}</td>
        </tr>
        <tr>
          <td class="b-num">2.</td>
          <td class="b-lbl">
            <div class="lbl-en">Account No</div>
            <div class="lbl-bn">হিসাব নম্বর</div>
          </td>
          <td class="b-val">${v.account_number || ''}</td>
        </tr>
        <tr>
          <td class="b-num">3.</td>
          <td class="b-lbl">
            <div class="lbl-en">Bank Name</div>
            <div class="lbl-bn">ব্যাংকের নাম</div>
          </td>
          <td class="b-val">${v.bank_name || ''}</td>
        </tr>
        <tr>
          <td class="b-num">4.</td>
          <td class="b-lbl">
            <div class="lbl-en">Branch Name</div>
            <div class="lbl-bn">শাখার নাম</div>
          </td>
          <td class="b-val">${v.branch_name || ''}</td>
        </tr>
        <tr>
          <td class="b-num">5.</td>
          <td class="b-lbl">
            <div class="lbl-en">Routing No</div>
            <div class="lbl-bn">রাউটিং নম্বর</div>
          </td>
          <td class="b-val">${v.routing_number || ''}</td>
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
      <p><em>Name &amp; Title:</em> নাম ও পদবী &nbsp;<span class="sig-line">${v.declaration_name_title || ''}</span></p>
      <br/>
      <p><em>Name of the Company:</em> ব্যবসা প্রতিষ্ঠানের নাম &nbsp;<span class="sig-line">${v.declaration_company_name || v.name || ''}</span></p>
      <br/>
      <p><em>Seal, Signature &amp; Date:</em> আবেদনকারীর সিল ও স্বাক্ষর &nbsp;<span class="sig-line">${v.declaration_date || ''}</span></p>
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
      <p>তারিখ: <span class="field-line" style="display:inline-block;width:160px;border-bottom:1px solid #000;">${v.declaration_date || ''}</span></p>
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
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href={paths.dashboard.procurement.vendors.list}>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          </Link>
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                {vendor.companyName}
              </h1>
              <Badge variant="success">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </Badge>
              <Badge variant="primary" size="sm">
                {vendor.enlistmentYear}
              </Badge>
              {vendor.twoFAEnabled && (
                <Badge variant="info" size="sm">
                  <Shield className="w-3 h-3 mr-1" />
                  2FA
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {vendor.id} &middot; {vendor.companyNameBn}
            </p>
          </div>
          <Link href={`${paths.dashboard.procurement.vendors.create}?edit=${vendor.id}`}>
            <Button variant="outline">Edit Profile</Button>
          </Link>
          <Button variant="outline" onClick={handlePrintVendorEnlishment}>
            <FileText className="w-4 h-4 mr-2" />
            Print Enlistment Form
          </Button>
        </div>

        {/* Expiry Alerts */}
        {expiryAlerts.length > 0 && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
            <Bell className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-800">Document Expiry Alerts</p>
              {expiryAlerts.map((a, i) => (
                <p key={i} className="text-xs text-orange-700 mt-1">
                  <strong>{a.doc}</strong> expires on {a.expiryDate} ({a.daysLeft} days remaining).
                  Automated alert sent to vendor.
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-4">
          {[
            'profile',
            'documents',
            'bank',
            'categories',
            'rfq-history',
            'work-orders',
            'performance',
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {tab
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Company Profile" description="Legal and business information" />
            <CardBody>
              <div className="space-y-3 text-sm">
                {[
                  ['Registration (RJSC)', vendor.registrationNumber],
                  ['Year Established', vendor.yearEstablished],
                  ['TIN', vendor.tin],
                  ['VAT BIN', vendor.vatBin],
                  ['Enlistment Period', vendor.enlistmentYear],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="flex justify-between py-1 border-b border-border/50"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Contact Information" />
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{vendor.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Mobile</p>
                    <p className="text-sm font-medium">{vendor.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="w-4 h-4 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Website</p>
                    <p className="text-sm font-medium">{vendor.website}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm font-medium">{vendor.address}</p>
                    <p className="text-xs text-muted-foreground">
                      {vendor.district}, {vendor.division}, {vendor.country}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Enlistment Details */}
          <Card>
            <CardHeader
              title="Enlistment Form Details"
              description="Additional fields from the Vendor Enlistment Form"
            />
            <CardBody>
              <div className="space-y-3 text-sm">
                {[
                  ['Proprietor Name', vendor.proprietorName],
                  ['Proprietor Title', vendor.proprietorTitle],
                  ['Proprietor Cell', vendor.proprietorCell],
                  ['Proprietor Email', vendor.proprietorEmail],
                  ['Village / Road', vendor.villageRoad],
                  ['House No', vendor.houseNumber],
                  ['Postal Code', vendor.postalCode],
                  ['City', vendor.city],
                  ['Nature of Business', vendor.natureOfBusiness],
                  ['Trade License Valid Date', vendor.tradeLicenseValidDate],
                  ['Others License No', vendor.othersLicenseNo],
                  ['Tax Return Acknowledgement', vendor.taxReturnAcknowledgement ? 'Yes' : 'No'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value || '—'}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Other Branch Info */}
          {(vendor.otherBranchName || vendor.otherBranchAddress) && (
            <Card>
              <CardHeader
                title="Other Branch"
                description="Other branch or sub-office information"
              />
              <CardBody>
                <div className="space-y-3 text-sm">
                  {[
                    ['Branch Name', vendor.otherBranchName],
                    ['Address', vendor.otherBranchAddress],
                    ['Cell No', vendor.otherBranchCell],
                    ['Email', vendor.otherBranchEmail],
                    ['Website', vendor.otherBranchWebsite],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between py-1 border-b border-border/50"
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value || '—'}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Last Year's Clients */}
          {vendor.lastYearClients.length > 0 && (
            <Card>
              <CardHeader title="Last Year's Client List" />
              <CardBody>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-xs font-semibold text-left">#</th>
                        <th className="px-3 py-2 text-xs font-semibold text-left">Client Name</th>
                        <th className="px-3 py-2 text-xs font-semibold text-left">Contact</th>
                        <th className="px-3 py-2 text-xs font-semibold text-left">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendor.lastYearClients.map((c, idx) => (
                        <tr key={idx} className="border-b border-border/50">
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2">{c.name || '—'}</td>
                          <td className="px-3 py-2">{c.contact_number || '—'}</td>
                          <td className="px-3 py-2">{c.email || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Declaration */}
          {(vendor.declarationNameTitle || vendor.declarationCompanyName) && (
            <Card>
              <CardHeader title="Declaration" />
              <CardBody>
                <div className="space-y-3 text-sm">
                  {[
                    ['Name & Title', vendor.declarationNameTitle],
                    ['Company Name', vendor.declarationCompanyName],
                    ['Date', vendor.declarationDate],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between py-1 border-b border-border/50"
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value || '—'}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          <Card className="md:col-span-2">
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary">
                  {vendor.contactPerson
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{vendor.contactPerson}</h3>
                  <p className="text-sm text-muted-foreground">{vendor.designation}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Portal: 2FA {vendor.twoFAEnabled ? 'Enabled' : 'Disabled'} &middot; Last login:{' '}
                    {vendor.portalLastLogin}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </Button>
                  <Button variant="outline" size="sm">
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab: Documents with Expiry Tracking */}
      {activeTab === 'documents' && (
        <Card>
          <CardHeader
            title="Compliance Documents"
            description="Document expiry is tracked automatically. Alerts sent at 90, 30, and 7 days before expiry."
          />
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-semibold">Document</th>
                    <th className="px-4 py-3 text-xs font-semibold">Upload Date</th>
                    <th className="px-4 py-3 text-xs font-semibold">Expiry Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-center">Days to Expiry</th>
                    <th className="px-4 py-3 text-xs font-semibold">Verification</th>
                    <th className="px-4 py-3 text-xs font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className={`border-b border-border ${doc.daysToExpiry !== null && doc.daysToExpiry <= 90 ? 'bg-orange-50/50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">{doc.uploadDate}</td>
                      <td className="px-4 py-3 text-xs">{doc.expiryDate || 'N/A'}</td>
                      <td className="px-4 py-3 text-center">
                        {getDocExpiryBadge(doc.daysToExpiry)}
                      </td>
                      <td className="px-4 py-3">
                        {doc.status === 'Verified' ? (
                          <Badge
                            variant="success"
                            size="sm"
                            className="bg-green-100 text-green-700 border-green-200"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        ) : doc.status === 'Rejected' ? (
                          <Badge
                            variant="danger"
                            size="sm"
                            className="bg-red-100 text-red-600 border-red-200"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Rejected
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="p-1.5 hover:bg-muted rounded"
                            onClick={() => setSelectedDoc(doc)}
                          >
                            <Eye className="w-4 h-4 text-primary" />
                          </button>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-muted rounded inline-flex"
                          >
                            <Download className="w-4 h-4 text-primary" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <Bell className="w-3 h-3 inline mr-1" />
                <strong>Auto-Alert Schedule:</strong> 90 days (email), 30 days (email + portal), 7
                days (email + portal + admin notification). Expired documents trigger vendor status
                review.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tab: Bank */}
      {activeTab === 'bank' && (
        <Card>
          <CardHeader title="Bank Account Details" description="Payment and banking information" />
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                {[
                  ['Bank Name', bankDetails.bankName],
                  ['Branch', bankDetails.branchName],
                  ['Account Name', bankDetails.accountName],
                  ['Account Type', bankDetails.accountType],
                ].map(([l, v]) => (
                  <div key={l}>
                    <label className="text-xs text-muted-foreground">{l}</label>
                    <p className="text-sm font-medium">{v}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {[
                  ['Account Number', bankDetails.accountNumber],
                  ['Routing Number', bankDetails.routingNumber],
                  ['SWIFT Code', bankDetails.swiftCode],
                  ['TIN', vendor.tin],
                  ['VAT BIN', vendor.vatBin],
                ].map(([l, v]) => (
                  <div key={l}>
                    <label className="text-xs text-muted-foreground">{l}</label>
                    <p className="text-sm font-mono font-medium">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tab: Categories */}
      {activeTab === 'categories' && (
        <Card>
          <CardHeader
            title="Assigned Procurement Categories"
            description="Vendor can view and respond to RFQs only in these categories"
          />
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {vendor.categories.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-4 border-2 border-primary/20 bg-primary/5 rounded-lg flex items-center justify-between"
                >
                  <span className="text-sm font-medium">{cat}</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              ))}
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <Shield className="w-3 h-3 inline mr-1" />
                RFQs are visible to this vendor ONLY if the RFQ category matches one of these
                assigned categories.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tab: RFQ History */}
      {activeTab === 'rfq-history' && (
        <Card>
          <CardHeader
            title="RFQ Participation History"
            description={`${rfqHistory.length} RFQs invited | ${rfqHistory.filter((r) => r.submitted_status).length} submitted`}
          />
          <CardBody>
            {rfqHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No RFQ invitations found for this vendor.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="px-4 py-3 text-xs font-semibold">RFQ Number</th>
                      <th className="px-4 py-3 text-xs font-semibold">Title</th>
                      <th className="px-4 py-3 text-xs font-semibold">Category</th>
                      <th className="px-4 py-3 text-xs font-semibold">Deadline</th>
                      <th className="px-4 py-3 text-xs font-semibold">RFQ Status</th>
                      <th className="px-4 py-3 text-xs font-semibold">Invite Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-center">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfqHistory.map((rfq) => (
                      <tr key={rfq.id} className="border-b border-border hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-mono text-primary">
                          {rfq.rfq_number || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm">{rfq.rfq_title || '—'}</td>
                        <td className="px-4 py-3">
                          {rfq.rfq_category ? (
                            <Badge variant="default" size="sm">
                              {rfq.rfq_category}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {rfq.rfq_deadline ? rfq.rfq_deadline.slice(0, 10) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              rfq.rfq_status === 'awarded'
                                ? 'success'
                                : rfq.rfq_status === 'cancelled'
                                  ? 'danger'
                                  : 'default'
                            }
                            size="sm"
                          >
                            {rfq.rfq_status || '—'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              rfq.invite_status === 'submitted'
                                ? 'success'
                                : rfq.invite_status === 'declined'
                                  ? 'danger'
                                  : rfq.invite_status === 'viewed'
                                    ? 'info'
                                    : 'warning'
                            }
                            size="sm"
                            className="capitalize"
                          >
                            {rfq.invite_status || 'sent'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {rfq.submitted_status ? (
                            <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Tab: Work Orders */}
      {activeTab === 'work-orders' && (
        <Card>
          <CardHeader
            title="Work Order History"
            description="Issued work orders and delivery tracking"
          />
          <CardBody>
            {workOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No work orders found for this vendor.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="px-4 py-3 text-xs font-semibold">WO Number</th>
                      <th className="px-4 py-3 text-xs font-semibold">Title</th>
                      <th className="px-4 py-3 text-xs font-semibold">Category</th>
                      <th className="px-4 py-3 text-xs font-semibold">Order Date</th>
                      <th className="px-4 py-3 text-xs font-semibold">Delivery Deadline</th>
                      <th className="px-4 py-3 text-xs font-semibold text-right">Amount (BDT)</th>
                      <th className="px-4 py-3 text-xs font-semibold">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold">Delivery</th>
                      <th className="px-4 py-3 text-xs font-semibold">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrders.map((wo) => (
                      <tr key={wo.id} className="border-b border-border hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-mono text-primary">
                          {wo.workOrderNumber || wo.wo_number || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm">{wo.title || '—'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {wo.category || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {wo.orderDate || wo.order_date || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {wo.deliveryDeadline || wo.delivery_date || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono font-semibold">
                          {wo.totalAmount != null
                            ? `BDT ${parseFloat(wo.totalAmount || wo.total_amount || 0).toLocaleString()}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {wo.status?.toLowerCase() === 'approved' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-green-100 text-green-700 border-green-200">
                              {wo.status}
                            </span>
                          ) : (
                            <Badge
                              variant={
                                wo.status === 'Completed'
                                  ? 'success'
                                  : wo.status === 'In Progress'
                                    ? 'info'
                                    : wo.status === 'Cancelled'
                                      ? 'danger'
                                      : 'warning'
                              }
                              size="sm"
                            >
                              {wo.status || '—'}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              (wo.deliveryStatus || wo.delivery_status) === 'completed'
                                ? 'success'
                                : (wo.deliveryStatus || wo.delivery_status) === 'in-progress'
                                  ? 'info'
                                  : 'default'
                            }
                            size="sm"
                            className="capitalize"
                          >
                            {wo.deliveryStatus || wo.delivery_status || 'not-started'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              (wo.paymentStatus || wo.payment_status) === 'paid'
                                ? 'success'
                                : (wo.paymentStatus || wo.payment_status) === 'partial'
                                  ? 'warning'
                                  : 'default'
                            }
                            size="sm"
                            className="capitalize"
                          >
                            {wo.paymentStatus || wo.payment_status || 'not-started'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Tab: Performance */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Orders', value: performance.totalOrders, color: 'text-primary' },
              { label: 'On-Time', value: performance.totalOnTime, color: 'text-green-600' },
              { label: 'Late', value: performance.totalLate, color: 'text-yellow-600' },
              { label: 'Rejected', value: performance.totalRejected, color: 'text-red-600' },
              {
                label: 'On-Time Rate',
                value: `${performance.onTimeDelivery}%`,
                color: 'text-blue-600',
              },
              {
                label: 'Compliance Avg',
                value: `${parseFloat(performance.avgCompliance).toFixed(1)}%`,
                color: 'text-purple-600',
              },
            ].map((s) => (
              <Card key={s.label}>
                <CardBody>
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Monthly records table */}
          <Card>
            <CardHeader title="Monthly Performance Records" />
            <CardBody>
              {performanceRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No performance records found for this vendor.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="text-left">
                        <th className="px-4 py-3 text-xs font-semibold">Period</th>
                        <th className="px-4 py-3 text-xs font-semibold text-center">
                          Total Orders
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-center">On-Time</th>
                        <th className="px-4 py-3 text-xs font-semibold text-center">Late</th>
                        <th className="px-4 py-3 text-xs font-semibold text-center">Rejected</th>
                        <th className="px-4 py-3 text-xs font-semibold text-center">
                          On-Time Rate
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-center">
                          Avg Delivery (days)
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-center">Compliance</th>
                        <th className="px-4 py-3 text-xs font-semibold text-right">
                          Total Spent (BDT)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceRecords.map((rec) => (
                        <tr key={rec.id} className="border-b border-border hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm font-medium">
                            {String(rec.period_month).padStart(2, '0')}/{rec.period_year}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">{rec.total_orders}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-medium text-green-600">
                              {rec.on_time_deliveries}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-medium text-yellow-600">
                              {rec.late_deliveries}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-medium text-red-600">
                              {rec.rejected_items}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              variant={
                                rec.delivery_rate >= 80
                                  ? 'success'
                                  : rec.delivery_rate >= 50
                                    ? 'warning'
                                    : 'danger'
                              }
                              size="sm"
                            >
                              {rec.delivery_rate}%
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">{rec.avg_delivery_days}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              variant={
                                rec.compliance_score >= 80
                                  ? 'success'
                                  : rec.compliance_score >= 50
                                    ? 'warning'
                                    : 'danger'
                              }
                              size="sm"
                            >
                              {parseFloat(rec.compliance_score).toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-mono font-semibold">
                            {parseFloat(rec.total_spent).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="bg-background rounded-xl shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold capitalize">
                  {selectedDoc.name?.replace(/-/g, ' ')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Document Preview */}
            <div className="px-5 py-4 flex justify-center bg-muted/30 border-b border-border">
              {selectedDoc.fileUrl ? (
                /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(selectedDoc.fileUrl) ? (
                  <img
                    src={selectedDoc.fileUrl}
                    alt={selectedDoc.name}
                    className="max-h-64 max-w-full rounded object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                    <FileText className="w-12 h-12" />
                    <p className="text-xs">Preview not available</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <FileText className="w-12 h-12" />
                  <p className="text-xs">No file attached</p>
                </div>
              )}
            </div>

            {/* Document Details */}
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground mb-0.5">Document Type</p>
                  <p className="font-medium capitalize">
                    {selectedDoc.name?.replace(/-/g, ' ') || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Verification</p>
                  <div>
                    {selectedDoc.status === 'Verified' ? (
                      <Badge
                        variant="success"
                        size="sm"
                        className="bg-green-100 text-green-700 border-green-200"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : selectedDoc.status === 'Rejected' ? (
                      <Badge
                        variant="danger"
                        size="sm"
                        className="bg-red-100 text-red-600 border-red-200"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Upload Date</p>
                  <p className="font-medium">{selectedDoc.uploadDate?.slice(0, 10) || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Expiry Date</p>
                  <p className="font-medium">{selectedDoc.expiryDate || 'N/A'}</p>
                </div>
                {selectedDoc.daysToExpiry !== null && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Days to Expiry</p>
                    <div>{getDocExpiryBadge(selectedDoc.daysToExpiry)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
              {selectedDoc.fileUrl && (
                <a
                  href={selectedDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:opacity-90"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
              )}
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
