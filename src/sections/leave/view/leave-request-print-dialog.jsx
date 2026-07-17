'use client';

import { Stack, Dialog, Button, DialogTitle, DialogContent, DialogActions } from '@mui/material';

import { useSetState } from 'src/hooks/use-set-state';

import { CONFIG } from 'src/config-global';
import { useGetEmployee } from 'src/actions/employees';
import { useGetLeaveBalanceByYear } from 'src/actions/leave';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

function fmtDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-GB');
  } catch {
    return String(d);
  }
}

function escapeHtml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSigField(data, name) {
  if (!data) {
    return `<div class="sig-line-top"></div><div class="sig-block-label">${name}</div>`;
  }
  const img = data.signature_image
    ? `<img src="${data.signature_image}" style="max-width:140px;max-height:50px;object-fit:contain;" alt="${name}">`
    : `<div class="sig-line-top"></div>`;
  const signerName = data.name || '';
  return `${img}<div class="sig-block-label">${name}</div><div class="sig-name">${escapeHtml(signerName)}</div>`;
}

export default function LeaveRequestPrintDialog({ open, onClose, leaveRequest }) {
  const { user } = useAuthContext();
  const { employee } = useGetEmployee(user?.id);
  const currentYear = new Date().getFullYear();
  const filters = useSetState({ year: currentYear, search: '' });
  const { data: leaveBalances = [] } = useGetLeaveBalanceByYear(
    employee?.employee_id,
    filters.state.year
  );

  if (!leaveRequest?.id) return null;

  const r = leaveRequest;
  const baseUrl = CONFIG.appDomainUrl.replace(/\/+$/, '');
  const employeeName = escapeHtml(r.employee_name);
  const designation = escapeHtml(r.designation || '');
  const project = escapeHtml(r.project_name || r.department_name || '');
  const leaveType = escapeHtml(r.leave_policy_name || '');
  const startDate = fmtDate(r.start_date);
  const endDate = fmtDate(r.end_date);
  const days =
    r.requested_days ||
    r.days ||
    Math.floor((new Date(r.end_date) - new Date(r.start_date)) / (1000 * 60 * 60 * 24)) + 1 ||
    '';
  const reason = escapeHtml(r.reason || '');
  const currentDate = new Date().toLocaleDateString('en-GB');
  const contactAddress = escapeHtml(r.present_address || employee?.present_address || '');
  const signatureImage = r.signature || employee?.signature || '';

  const casualLeave =
    (leaveBalances || []).find((item) => item.leave_type_name === 'Casual Leave') || {};
  const earnedLeave =
    (leaveBalances || []).find((item) => item.leave_type_name === 'Earned Leave') || {};
  const sickLeave =
    (leaveBalances || []).find((item) => item.leave_type_name === 'Sick Leave') || {};

  const handlePrint = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Leave Application</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      color: #000;
      background: #fff;
      padding: 26px 34px;
    }

    /* ---------- HEADER ---------- */
    .header {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .header-logo { width: 52px; height: 52px; object-fit: contain; }
    .header-name { max-height: 46px; width: auto; object-fit: contain; }
    .header-rule { border-top: 1.5px solid #000; margin: 6px 0 10px; }

    .form-title { text-align: center; font-size: 14px; font-weight: 700; text-decoration: underline; margin-bottom: 14px; }

    /* ---------- DATE / INFO ---------- */
    .date-row { text-align: right; font-size: 11px; margin-bottom: 10px; }
    .date-dots { display: inline-block; width: 130px; border-bottom: 1px dotted #444; }

    .info-label { font-size: 11px; font-weight: 400; margin-bottom: 8px; }

    /* ---------- LEAVE PARAGRAPH ---------- */
    .para-line { font-size: 11px; color: #000; margin-top: 4px; margin-bottom: 4px; line-height: 1.9; }

    /* ---------- ADDRESS + SIGNATURE ---------- */
    .addr-sig-row { display: flex; align-items: flex-end; margin-top: 18px; margin-bottom: 10px; gap: 10px; }
    .addr-col { flex: 0 0 55%; }
    .addr-label { font-size: 11px; margin-bottom: 8px; }
    .addr-dots-line { border-bottom: 1px dotted #444; height: 14px; margin-bottom: 2px; }
    .addr-value { font-size: 11px; margin-bottom: 4px; min-height: 44px; padding: 2px 0; white-space: pre-line; }
    .sig-right { flex: 1; text-align: center; padding-left: 20px; }
    .sig-line-top { border-top: 1px solid #000; width: 170px; margin: 0 auto 4px; }
    .sig-right-label { font-size: 11px; }
    .sig-employee-name { font-size: 11px; font-weight: 600; margin-top: 2px; }

    /* ---------- TWO BOXES ---------- */
    .box-row { display: flex; gap: 14px; margin-top: 16px; margin-bottom: 4px; align-items: stretch; }
    .box { border: 1px solid #2447a6; padding: 8px 10px; font-size: 11px; display: flex; flex-direction: column; }
    .box-left  { flex: 0 0 52%; }
    .box-right { flex: 1; }
    .box-header-line { font-size: 11px; margin-bottom: 6px; }

    .leave-tbl { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    .leave-tbl th, .leave-tbl td { border: 1px solid #555; padding: 3px 5px; text-align: center; }
    .leave-tbl th { background: #f0f0f0; font-weight: 700; }
    .leave-tbl td:first-child { text-align: left; }

    .box-admin-sig { margin-top: auto; padding-top: 16px; font-size: 11px; text-align: center; }
    .box-admin-sig .check { font-weight: 700; margin-top: 2px; }

    .box-right-text { font-size: 11px; line-height: 1.9; }
    .box-director { margin-top: auto; font-size: 11px; padding-top: 10px; text-align: center; }

    .below-boxes { display: flex; justify-content: flex-end; margin-bottom: 14px; margin-top: 10px; font-size: 11px; text-align: center; }

    /* ---------- SECTION DIVIDER (double rule, matches PDF) ---------- */
    .section-rule { border-top: 3px double #222; margin: 14px 0 16px; }

    /* ---------- JOINING REPORT ---------- */
    .joining-title { text-align: center; font-size: 13px; font-weight: 700; margin-bottom: 14px; }
    .joining-field { font-size: 11px; color: #000; margin-bottom: 8px; display: flex; align-items: baseline; }
    .joining-fill { flex: 1; border-bottom: 1px dotted #000; margin-left: 3px; min-width: 100px; }

    .sig-block-small { margin-top: 22px; }
    .sig-short-line { width: 170px; border-top: 1px solid #000; margin-bottom: 4px; }
    .sig-block-label { font-size: 11px; }
    .blue-label { color: #000; font-size: 11px; margin-bottom: 4px; }

    @media print { body { padding: 0; } @page { size: A4; margin: 1.1cm 1.2cm; } }
  </style>
</head>
<body>

  <!-- ORG HEADER -->
  <div class="header">
    <img class="header-logo" src="${baseUrl}/icons/logo.png" alt="LEDARS Logo" onerror="this.style.display='none'">
    <img class="header-name" src="${baseUrl}/icons/name_img.png" alt="LEDARS" onerror="this.style.display='none'">
  </div>
  <div class="header-rule"></div>

  <!-- FORM TITLE -->
  <div class="form-title">Leave Application</div>

  <!-- DATE (right) -->
  <div class="date-row">Date: <span class="date-dots">${currentDate}</span></div>

  <!-- INFO LABELS -->
  <div class="info-label">Name of Applicant: ${employeeName}</div>
  <div class="info-label">Designation: ${designation}</div>
  <div class="info-label">Project: ${project}</div>

  <!-- LEAVE PARAGRAPH -->
  <div class="para-line">I am applying for &nbsp;${days}&nbsp;days ${leaveType} leave from &nbsp;${startDate}&nbsp;</div>
  <div class="para-line">to&nbsp;${endDate}&nbsp; for the purpose of &nbsp;${reason}&nbsp;</div>

  <!-- CONTRACT ADDRESS + APPLICANT SIGNATURE -->
  <div class="addr-sig-row">
    <div class="addr-col">
      <div class="addr-label">Contact Address at leave</div>
      ${
        contactAddress
          ? `<div class="addr-value">${contactAddress}</div>`
          : `
          <div class="addr-dots-line"></div>
          <div class="addr-dots-line"></div>
          <div class="addr-dots-line"></div>
        `
      }
    </div>
    <div class="sig-right">
      ${signatureImage ? `<img src="${signatureImage}" style="max-width: 160px; max-height: 60px; object-fit: contain;" alt="Signature">` : '<div class="sig-line-top"></div>'}
      <div class="sig-right-label">Signature of the Applicant</div>
    </div>
  </div>

  <!-- TWO BORDERED BOXES -->
  <div class="box-row">
    <div class="box box-left">
      <div class="box-header-line">Applying Leave position as on &nbsp;..........................</div>
      <table class="leave-tbl">
        <thead>
          <tr>
            <th>Particular</th>
            <th>Casual<br>Leave</th>
            <th>Sick<br>Leave</th>
            <th>Earned<br>Leave</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Opening Balance</td>
            <td>...${casualLeave.used}...day</td>
            <td>..${sickLeave.used}....day</td>
            <td>..${earnedLeave.used}....day</td>
          </tr>
          <tr>
            <td>Applying Leave</td>
            <td>...${casualLeave.pending}...day</td>
            <td>..${sickLeave.pending}....day</td>
            <td>..${earnedLeave.pending}....day</td>
          </tr>
          <tr>
            <td>Balance</td>
            <td>..${casualLeave.remaining}....day</td>
            <td>..${sickLeave.remaining}....day</td>
            <td>..${earnedLeave.remaining}....day</td>
          </tr>
        </tbody>
      </table>
      <div class="box-admin-sig">
        <div>${renderSigField(r.admin_check_sign, 'Signature and Designation (Admin Sec):')}</div>
        <div class="check">Check and Filing</div>
      </div>
    </div>

    <div class="box box-right">
      <div class="box-right-text">
        Recommended &nbsp;${days}&nbsp;days leave<br>
        with pay/ without pay or regretted due<br>
        to.............................................
      </div>
      <div class="box-director">${renderSigField(r.req_unit_head_sign, 'Program Director / Unit Head')}</div>
    </div>
  </div>

  <!-- BELOW BOXES -->
  <div class="below-boxes">
    ${renderSigField(r.req_excutive_sign, 'Executive Director / Program Director')}
  </div>

  <!-- SECTION DIVIDER -->
  <div class="section-rule"></div>

  <!-- JOINING REPORT -->
  <div class="joining-title">Joining Report</div>

  <div class="joining-field">
    <span>Date:</span><span class="joining-fill">${r.actual_joining_date ? fmtDate(r.actual_joining_date) : ''}</span>
  </div>
  <div class="joining-field">
    <span>Joining date as per leave:</span><span class="joining-fill">${r.as_per_leave_joining_date ? fmtDate(r.as_per_leave_joining_date) : ''}</span>
  </div>
  <div class="joining-field">
    <span>Actual date of joining:</span><span class="joining-fill">${r.actual_joining_date ? fmtDate(r.actual_joining_date) : ''}</span>
  </div>

  <!-- Signature of employee -->
  <div class="sig-block-small">
    <div class="sig-short-line"></div>
    ${renderSigField(r.joining_employee_sign, 'Signature of the employee')}
    <div class="blue-label" style="margin-top:8px;">Additional leave (if any) recommended with pay/without pay.</div>
    <div class="blue-label">Accepted joining</div>
  </div>

  <!-- Program Director signature -->
  <div class="sig-block-small" style="margin-top:26px;">
    <div class="sig-short-line"></div>
    ${renderSigField(r.joining_excutive_sign, 'Program Director / Executive Director')}
  </div>

</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 700);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Iconify icon="solar:printer-bold" />
        Print Leave Application
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          <p>Print the leave application form with all signatures and details.</p>
          <p>The form will open in a new browser window for printing.</p>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:printer-bold" />}
          onClick={() => {
            handlePrint();
            onClose();
          }}
        >
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
}
