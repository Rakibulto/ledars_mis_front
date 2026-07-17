'use client';

import { mutate } from 'swr';
import { useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';
import { fDate } from 'src/utils/format-time';

import { CONFIG } from 'src/config-global';
import { DashboardContent } from 'src/layouts/dashboard';
import { SIGN_ROLES } from 'src/constants/providentFund';
import StatusChip from 'src/app/dashboard/accounting-finance/provident-fund/_components/StatusChip';
import SignatureDialog from 'src/app/dashboard/accounting-finance/provident-fund/_components/SignatureDialog';
import {
  useGetRequest,
  useCreateMutation,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';
import DeleteConfirmDialog from 'src/app/dashboard/accounting-finance/provident-fund/_components/DeleteConfirmDialog';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

const fmtDate = (d) => (d ? fDate(d) : '');
const fmtMoney = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n.toLocaleString('en-BD', { minimumFractionDigits: 2 }) : '';
};

const DETAIL_FIELD = ({ label, value, multiline, rows }) => (
  <Grid size={{ xs: 12, md: 6 }}>
    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
      {label}
    </Typography>
    {multiline ? (
      <Paper variant="outlined" sx={{ p: 1.5, minHeight: 48 }}>
        <Typography variant="body2">{value || '-'}</Typography>
      </Paper>
    ) : (
      <Typography variant="body1">{value || '-'}</Typography>
    )}
  </Grid>
);

const SIGNATURE_FIELDS = [
  'supervisor_signature',
  'upper_authority_signature',
  'accounts_officer_signature',
  'trust_member_1_signature',
  'trust_member_2_signature',
  'recommender_signature',
  'recorder_signature',
  'approver_signature',
];

const SIGNATURE_ROLES = [
  'supervisor',
  'upper_authority',
  'accounts_officer',
  'trust_member_1',
  'trust_member_2',
  'recommender',
  'recorder',
  'approver',
];

export default function ProvidentFundDetail() {
  const params = useParams();
  const { id } = params;
  const router = useRouter();
  const { user } = useAuthContext();
  const [signLoading, setSignLoading] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signRole, setSignRole] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const deleteConfirm = useBoolean();

  const apiUrl = useMemo(() => endpoints.providentFund.byId(id), [id]);
  const { data: pfLoan, loading } = useGetRequest(apiUrl);

  const { trigger: signTrigger } = useCreateMutation(endpoints.providentFund.sign(id));

  const employeeUrl = useMemo(
    () => (user?.id ? endpoints.employee.details(user.id) : null),
    [user?.id]
  );
  const { data: employeeData } = useGetRequest(employeeUrl);

  const handleSignOpen = (role) => {
    setSignRole(role);
    setSignDialogOpen(true);
  };

  const handleSignConfirm = async () => {
    if (!signRole) return;
    setSignLoading(true);
    try {
      await signTrigger({ role: signRole, confirmed: true });
      toast.success(`Signed as ${SIGN_ROLES[signRole] || signRole}`);
      setSignDialogOpen(false);
      setSignRole(null);
      mutate(apiUrl);
    } catch (error) {
      toast.error(error?.detail || error?.message || 'Failed to sign');
    } finally {
      setSignLoading(false);
    }
  };

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true);
    try {
      await deleteRequest(endpoints.providentFund.byId(id));
      toast.success('PF loan application deleted successfully!');
      router.push('/dashboard/accounting-finance/provident-fund');
    } catch (error) {
      toast.error(error?.detail || error?.message || 'Failed to delete');
    } finally {
      setDeleteLoading(false);
      deleteConfirm.onFalse();
    }
  }, [id, router, deleteConfirm]);

  // print

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
  
      <div class="date-row">তারিখ ঃ <span class="date-fill">${pfLoan.applicant_signature_date || ''}</span></div>

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
        <div class="grid-field"><span class="g-lbl">নাম ঃ</span><span class="g-dot">${pfLoan.applicant_name || ''}</span></div>
        <div class="grid-field"><span class="g-lbl">প্রার্থীত প্রত্যাশিত ঋণের পরিমান ঃ</span><span class="g-dot">${fmtMoney(pfLoan.expected_loan_amount)}</span></div>
        <div class="grid-field"><span class="g-lbl">পদবী ঃ</span><span class="g-dot">${pfLoan.designation || ''}</span></div>
        <div class="grid-field"><span class="g-lbl">প্রার্থীত ঋণের উদ্দেশ্য ঃ</span><span class="g-dot">${pfLoan.loan_purpose || ''}</span></div>
        <div class="grid-field"><span class="g-lbl">চাকরিতে যোগদানের তারিখ ঃ</span><span class="g-dot">${pfLoan.joining_date || ''}</span></div>
        <div class="grid-field"><span class="g-lbl">চাকরিতে স্থায়ীকরনের তারিখ ঃ</span><span class="g-dot">${pfLoan.permanent_date || ''}</span></div>
        <div class="grid-field"><span class="g-lbl">মাসিক কিস্তির সংখ্যা ঃ</span><span class="g-dot">${pfLoan.monthly_installment_count || ''}</span></div>
        <div class="grid-field"><span class="g-lbl">মাসিক সর্বমোট বেতনের পরিমান ঃ</span><span class="g-dot">${fmtMoney(pfLoan.monthly_total_salary)}</span></div>
        <div class="grid-field"><span class="g-lbl">বর্তমান কর্মস্থল ঃ</span><span class="g-dot">${pfLoan.current_workplace || ''}</span></div>
        <div class="grid-field"><span class="g-lbl">কর্মসূচির নাম ঃ</span><span class="g-dot">${pfLoan.program_name || ''}</span></div>
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
        <div class="rec-line">${pfLoan.upper_authority_recommendation || ''}</div>
        <div class="rec-line"></div>
        <div class="rec-sig-row">
          <div class="rec-sig-f"><span>নাম ঃ</span><span class="rec-sig-fill">${pfLoan.upper_authority_name || ''}</span></div>
          <div class="rec-sig-f"><span>পদবী ঃ</span><span class="rec-sig-fill">${pfLoan.upper_authority_designation || ''}</span></div>
          <div class="rec-sig-f"><span>স্বাক্ষর ঃ</span><span class="rec-sig-fill">${pfLoan.upper_authority_signature?.name || ''}</span></div>
        </div>
      </div>

      <!-- সুপারভাইজার recommendation box -->
      <div class="rec-box">
        <div class="rec-title">সুপারভাইজারের সুপারিশ ঃ</div>
        <div class="rec-line">${pfLoan.supervisor_recommendation || ''}</div>
        <div class="rec-sig-row">
          <div class="rec-sig-f"><span>নাম ঃ</span><span class="rec-sig-fill">${pfLoan.supervisor_name || ''}</span></div>
          <div class="rec-sig-f"><span>পদবী ঃ</span><span class="rec-sig-fill">${pfLoan.supervisor_designation || ''}</span></div>
          <div class="rec-sig-f"><span>স্বাক্ষর ঃ</span><span class="rec-sig-fill">${pfLoan.supervisor_signature?.name || ''}</span></div>
        </div>
      </div>
    </div>
  
    <!-- ═══ PAGE 2 ═══ -->
    <div class="page">
      ${HDR(baseUrl)}
  
      <div class="section-title">হিসাবরক্ষণ কর্মকর্তা ঃ</div>
      <div class="p2-para">
        পিএফ তহবিলে আবেদনকারী সদস্যের নামে লভ্যাংশসহ মোট <span style="display:inline-block;width:100px;border-bottom:1px dotted #555;">${fmtMoney(pfLoan.pf_total_balance)}</span>
        টাকা (নিজস্ব <span style="display:inline-block;width:70px;border-bottom:1px dotted #555;">${fmtMoney(pfLoan.own_contribution)}</span>
        সংস্থার <span style="display:inline-block;width:70px;border-bottom:1px dotted #555;">${fmtMoney(pfLoan.org_contribution)}</span>
        লভ্যাংশ) টাকা জমা
        রয়েছে। পিএফ বাবদ মোট জমা থেকে জামানতের ঘাটতি বাদ দিয়ে ৮০% অর্থাৎ সর্বোচ্চ (প্রায়)
        <span style="display:inline-block;width:100px;border-bottom:1px dotted #555;">${fmtMoney(pfLoan.max_loan_eligible)}</span>
        টাকা ঋণ দেওয়া যেতে পারে, যা মাসিক সুদ-আসল
        <span style="display:inline-block;width:90px;border-bottom:1px dotted #555;">${fmtMoney(pfLoan.monthly_interest_principal)}</span> টাকা
        সেবার হার <span style="display:inline-block;width:40px;border-bottom:1px dotted #555;">${pfLoan.interest_rate_percent || ''}</span>%
        হিসেবে <span style="display:inline-block;width:40px;border-bottom:1px dotted #555;">${pfLoan.installment_count || ''}</span>কিস্তিতে
        <span style="display:inline-block;width:70px;border-bottom:1px dotted #555;">${pfLoan.repayment_months || ''}</span> মাস হতে পরিশোধ করতে হবে।
      </div>

      <div class="p2-field"><span>নাম ঃ</span><span class="p2-fill">${pfLoan.accounts_officer_name || ''}</span></div>
      <div class="p2-field"><span>পদবী ঃ</span><span class="p2-fill">${pfLoan.accounts_officer_designation || ''}</span></div>
      <div class="p2-field"><span>স্বাক্ষর ঃ</span><span class="p2-fill">${pfLoan.accounts_officer_signature?.name || ''}</span></div>
  
      <div style="font-size:11px;font-weight:700;margin:10px 0 6px;">
        সদস্য, পিএফ ট্রাস্টি বোর্ড ঃ (কমপক্ষে দুইজনের স্বাক্ষর থাকতে হবে)
      </div>
  
      <div class="trust-box">
        <div class="trust-note">আবেদনকারী সদস্যকে প্রার্থীত ঋণ প্রদান করার জন্য অনুরোধ করা হলো। (যদি পূর্বের ঋণ সমন্বয় থাকে।)</div>
        <div class="trust-member">
          <div class="p2-field"><span>১. নাম ঃ</span><span class="p2-fill">${pfLoan.trust_member_1_name || ''}</span><span>স্বাক্ষর ঃ</span><span class="p2-fill">${pfLoan.trust_member_1_signature?.name || ''}</span></div>
        </div>
        <div class="trust-member">
          <div class="p2-field"><span>২. নাম ঃ</span><span class="p2-fill">${pfLoan.trust_member_2_name || ''}</span><span>স্বাক্ষর ঃ</span><span class="p2-fill">${pfLoan.trust_member_2_signature?.name || ''}</span></div>
        </div>
        <div class="trust-summary">
          সদস্য সচিব, পিএফ ট্রাস্টি বোর্ড ঃ <span style="display:inline-block;width:80px;border-bottom:1px dotted #555;">${fmtMoney(pfLoan.secretary_approved_amount)}</span>
          টাকা (পূর্বের ঋণ ও সুদ সমন্বয় সাপেক্ষে) ঋণ বাবদ প্রদান করা যেতে পারে।
        </div>
      </div>

      <div class="footer-3col">
        <div class="footer-person">
          <span>সুপারিশকারীর স্বাক্ষর</span>
          <span style="margin-top:18px; font-size:10px;">${pfLoan.recommender_signature?.name || ''}</span>
          <span style="font-size:10px;">${pfLoan.recommender_signature?.signed_at ? new Date(pfLoan.recommender_signature.signed_at).toLocaleDateString() : ''}</span>
        </div>
        <div class="footer-person">
          <span>নথিভুক্তকারীর স্বাক্ষর</span>
          <span style="margin-top:18px; font-size:10px;">${pfLoan.recorder_signature?.name || ''}</span>
          <span style="font-size:10px;">${pfLoan.recorder_signature?.signed_at ? new Date(pfLoan.recorder_signature.signed_at).toLocaleDateString() : ''}</span>
        </div>
        <div class="footer-person">
          <span>অনুমোদনকারীর স্বাক্ষর</span>
          <span style="margin-top:18px; font-size:10px;">${pfLoan.approver_signature?.name || ''}</span>
          <span style="font-size:10px;">${pfLoan.approver_signature?.signed_at ? new Date(pfLoan.approver_signature.signed_at).toLocaleDateString() : ''}</span>
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

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (!pfLoan) {
    return (
      <DashboardContent>
        <Typography variant="h6" sx={{ textAlign: 'center', py: 8 }}>
          PF Loan Application not found
        </Typography>
      </DashboardContent>
    );
  }

  const allFinalSigned =
    pfLoan.recommender_signature && pfLoan.recorder_signature && pfLoan.approver_signature;

  const renderSignatureBlock = (role, label) => {
    const sigData =
      pfLoan[`${role}_signature`] ||
      pfLoan[
        `${role.replace('trust_member_1', 'trust_member_1').replace('trust_member_2', 'trust_member_2')}_signature`
      ];

    // Map role names to their corresponding model field names
    const fieldMap = {
      supervisor: 'supervisor_signature',
      upper_authority: 'upper_authority_signature',
      accounts_officer: 'accounts_officer_signature',
      trust_member_1: 'trust_member_1_signature',
      trust_member_2: 'trust_member_2_signature',
      recommender: 'recommender_signature',
      recorder: 'recorder_signature',
      approver: 'approver_signature',
    };

    const sigFieldData = pfLoan[fieldMap[role]];

    if (sigFieldData) {
      return (
        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {label}
          </Typography>
          {sigFieldData.signature_image && (
            <Box
              component="img"
              src={sigFieldData.signature_image}
              alt={`${label} signature`}
              sx={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain', my: 1 }}
            />
          )}
          <Typography variant="body2" fontWeight={600}>
            {sigFieldData.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {sigFieldData.signed_at ? new Date(sigFieldData.signed_at).toLocaleDateString() : ''}
          </Typography>
        </Paper>
      );
    }

    return (
      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="solar:pen-bold-duotone" />}
          onClick={() => handleSignOpen(role)}
          sx={{ mt: 1 }}
        >
          Click to Sign
        </Button>
      </Paper>
    );
  };

  return (
    <DashboardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:arrow-left-linear" />}
            onClick={() => router.push('/dashboard/accounting-finance/provident-fund')}
          >
            Back
          </Button>
          <Typography variant="h4">PF Loan Application Detail</Typography>
          <StatusChip status={pfLoan.status} />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:printer-bold" />}
            onClick={handlePFLoanPrint}
          >
            Print
          </Button>
          {pfLoan.status === 'draft' && (
            <>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:pen-bold-duotone" />}
                onClick={() =>
                  router.push(`/dashboard/accounting-finance/provident-fund/create?editId=${id}`)
                }
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold-duotone" />}
                onClick={deleteConfirm.onTrue}
              >
                Delete
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {allFinalSigned && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Loan Approved
        </Alert>
      )}

      {/* Section 1 — Applicant Info */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Applicant Information
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          আবেদনকারীর তথ্য
        </Typography>
        <Grid container spacing={2}>
          <DETAIL_FIELD label="Application Date" value={fmtDate(pfLoan.application_date)} />
          <DETAIL_FIELD label="Applicant Name" value={pfLoan.applicant_name} />
          <DETAIL_FIELD label="Designation" value={pfLoan.designation} />
          <DETAIL_FIELD label="Joining Date" value={fmtDate(pfLoan.joining_date)} />
          <DETAIL_FIELD label="Permanent Date" value={fmtDate(pfLoan.permanent_date)} />
          <DETAIL_FIELD
            label="Monthly Installment Count"
            value={pfLoan.monthly_installment_count}
          />
          <DETAIL_FIELD
            label="Monthly Total Salary (Tk)"
            value={fmtMoney(pfLoan.monthly_total_salary)}
          />
          <DETAIL_FIELD label="Current Workplace" value={pfLoan.current_workplace} />
          <DETAIL_FIELD label="Program Name" value={pfLoan.program_name} />
          <DETAIL_FIELD
            label="Expected Loan Amount (Tk)"
            value={fmtMoney(pfLoan.expected_loan_amount)}
          />
          <DETAIL_FIELD label="Loan Purpose" value={pfLoan.loan_purpose} multiline />
          <DETAIL_FIELD
            label="Applicant Signature Date"
            value={fmtDate(pfLoan.applicant_signature_date)}
          />
        </Grid>
      </Card>

      {/* Section 2 — Supervisor Recommendation */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Supervisor Recommendation
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          পর্যবেক্ষকের সুপারিশ
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Recommendation
            </Typography>
            <Paper variant="outlined" sx={{ p: 1.5, minHeight: 48 }}>
              <Typography variant="body2">{pfLoan.supervisor_recommendation || '-'}</Typography>
            </Paper>
          </Grid>
          <DETAIL_FIELD label="Supervisor Name" value={pfLoan.supervisor_name} />
          <DETAIL_FIELD label="Supervisor Designation" value={pfLoan.supervisor_designation} />
        </Grid>
      </Card>

      {/* Section 3 — Upper Authority Recommendation */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upper Authority Recommendation
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          শাখা-আঞ্চলিক/প্রকল্প/বিভাগীয় প্রধানের সুপারিশ
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Recommendation
            </Typography>
            <Paper variant="outlined" sx={{ p: 1.5, minHeight: 48 }}>
              <Typography variant="body2">
                {pfLoan.upper_authority_recommendation || '-'}
              </Typography>
            </Paper>
          </Grid>
          <DETAIL_FIELD label="Upper Authority Name" value={pfLoan.upper_authority_name} />
          <DETAIL_FIELD
            label="Upper Authority Designation"
            value={pfLoan.upper_authority_designation}
          />
        </Grid>
      </Card>

      {/* Section 4 — Accounts Officer */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Accounts Officer Section
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          হিসাব কর্মকর্তার অংশ
        </Typography>
        <Grid container spacing={2}>
          <DETAIL_FIELD label="PF Total Balance (Tk)" value={fmtMoney(pfLoan.pf_total_balance)} />
          <DETAIL_FIELD label="Own Contribution (Tk)" value={fmtMoney(pfLoan.own_contribution)} />
          <DETAIL_FIELD label="Org Contribution (Tk)" value={fmtMoney(pfLoan.org_contribution)} />
          <DETAIL_FIELD label="Max Loan Eligible (Tk)" value={fmtMoney(pfLoan.max_loan_eligible)} />
          <DETAIL_FIELD
            label="Monthly Interest+Principal (Tk)"
            value={fmtMoney(pfLoan.monthly_interest_principal)}
          />
          <DETAIL_FIELD label="Interest Rate (%)" value={pfLoan.interest_rate_percent} />
          <DETAIL_FIELD label="Installment Count" value={pfLoan.installment_count} />
          <DETAIL_FIELD label="Repayment Months" value={pfLoan.repayment_months} />
          <DETAIL_FIELD label="Accounts Officer Name" value={pfLoan.accounts_officer_name} />
          <DETAIL_FIELD
            label="Accounts Officer Designation"
            value={pfLoan.accounts_officer_designation}
          />
        </Grid>
      </Card>

      {/* Section 5 — PF Trust Board Members */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          PF Trust Board Members
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          পিএফ ট্রাস্ট বোর্ড সদস্য
        </Typography>
        <Grid container spacing={2}>
          <DETAIL_FIELD label="Trust Member 1 Name" value={pfLoan.trust_member_1_name} />
          <DETAIL_FIELD label="Trust Member 2 Name" value={pfLoan.trust_member_2_name} />
        </Grid>
      </Card>

      {/* Section 6 — Member Secretary */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Member Secretary
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          সদস্য সচিব
        </Typography>
        <Grid container spacing={2}>
          <DETAIL_FIELD
            label="Secretary Approved Amount (Tk)"
            value={fmtMoney(pfLoan.secretary_approved_amount)}
          />
        </Grid>
      </Card>

      {/* Signature Section — 8 blocks */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Signatures
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            {renderSignatureBlock('supervisor', SIGN_ROLES.supervisor)}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            {renderSignatureBlock('upper_authority', SIGN_ROLES.upper_authority)}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            {renderSignatureBlock('accounts_officer', SIGN_ROLES.accounts_officer)}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            {renderSignatureBlock('trust_member_1', SIGN_ROLES.trust_member_1)}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            {renderSignatureBlock('trust_member_2', SIGN_ROLES.trust_member_2)}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            {renderSignatureBlock('recommender', SIGN_ROLES.recommender)}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            {renderSignatureBlock('recorder', SIGN_ROLES.recorder)}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            {renderSignatureBlock('approver', SIGN_ROLES.approver)}
          </Grid>
        </Grid>
      </Card>

      <SignatureDialog
        open={signDialogOpen}
        onClose={() => {
          setSignDialogOpen(false);
          setSignRole(null);
        }}
        onConfirm={handleSignConfirm}
        role={signRole}
        currentUser={user}
        employeeData={employeeData}
        loading={signLoading}
      />

      <DeleteConfirmDialog
        open={deleteConfirm.value}
        onClose={deleteConfirm.onFalse}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </DashboardContent>
  );
}
