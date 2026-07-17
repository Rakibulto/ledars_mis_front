'use client';

import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';

import {
  Box,
  Card,
  Grid,
  Stack,
  Alert,
  Button,
  Divider,
  Skeleton,
  Typography,
  IconButton,
  CardContent,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { CONFIG } from 'src/config-global';
import { useGetAdvance, deleteAdvance } from 'src/actions/advances';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ── Constants ─────────────────────────────────────────────────────────────────

const MEDIUM_LABELS = { cheque: 'Cheque', direct: 'Direct' };
const MEDIUM_COLORS = { cheque: 'info', direct: 'success' };

const CHECK_META = {
  tick: { icon: 'solar:check-circle-bold', color: 'success.main', label: '✓ Tick' },
  cross: { icon: 'solar:close-circle-bold', color: 'error.main', label: '✗ Cross' },
};

const getAdvancePrintHTML = (advance, resolveUrl) => {
  const baseUrl = CONFIG.appDomainUrl.replace(/\/+$/, '');
  const chkT = (v) => (v === 'tick' ? '✓' : '');
  const chkF = (v) => (v === 'cross' ? '✓' : '');
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '');

  const sigRecipient = advance.signature_recipient
    ? `<img src="${resolveUrl(advance.signature_recipient)}" style="max-height:40px;display:block;margin-bottom:2px;" />`
    : '';
  const sigAccountant = advance.signature_accountant
    ? `<img src="${resolveUrl(advance.signature_accountant)}" style="max-height:30px;display:block;margin:0 auto 2px;" />`
    : '';
  const sigRecommender = advance.signature_recommender
    ? `<img src="${resolveUrl(advance.signature_recommender)}" style="max-height:30px;display:block;margin:0 auto 2px;" />`
    : '';
  const sigApprover = advance.signature_approver
    ? `<img src="${resolveUrl(advance.signature_approver)}" style="max-height:30px;display:block;margin:0 auto 2px;" />`
    : '';

  const amount = parseFloat(advance.advance_receivable_amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
  });

  const isCheque = advance.receive_medium === 'cheque';

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>অগ্রিম অনুমোদন/গ্রহণ ফরম</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap">
  <script>window.onload=function(){setTimeout(function(){window.print()},600)};</script>
  <style>
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
      padding-left: 4px;
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
      padding-left: 4px;
      font-weight: 600;
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
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border: 1px solid #333;
      vertical-align: middle;
      margin-left: 2px;
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
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
      padding-left: 4px;
      font-weight: 600;
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
    <div class="serial-field"><span>ক্রমিক নং-</span><span class="s-fill">${advance.id || ''}</span></div>
    <div class="serial-field"><span>তারিখ ঃ</span><span class="s-fill">${fmtDate(advance.created_at)}</span></div>
  </div>
  <table class="info-table">
    <tr><td class="barabar-cell">বরাবর,<br>${advance.to_text || ''}</td><td class="anurodh-cell">অনুরোধকারী,<br>${advance.from_employee_name || ''}</td></tr>
    <tr><td colspan="2"><div class="full-field-cell"><span class="ff-label">প্রকল্পের নাম ঃ</span><span class="ff-dots">${advance.project_title || ''}</span></div></td></tr>
    <tr><td colspan="2"><div class="full-field-cell"><span class="ff-label">অগ্রিম গ্রহণের উদ্দেশ্য ঃ</span><span class="ff-dots">${advance.cause_of_advance || ''}</span></div></td></tr>
  </table>
  <div class="biboron-label">অগ্রিম গ্রহণের বিবরণ ঃ</div>
  <table class="details-table">
    <thead>
      <tr><th style="width:18%;">অগ্রিম গ্রহণের<br>তারিখ</th><th style="width:22%;">অগ্রিম গ্রহণকৃত<br>টাকার পরিমাণ</th><th style="width:20%;">প্রত্যাশিত সমন্বয়ের<br>তারিখ</th><th>গ্রহণের ধরণ</th></tr>
    </thead>
    <tbody>
      <tr class="type-sub-row"><td rowspan="3" style="height:66px;font-weight:600;text-align:center;">${fmtDate(advance.advance_receivable_date)}</td><td rowspan="3" style="font-weight:600;text-align:center;">৳${amount}</td><td rowspan="3" style="font-weight:600;text-align:center;">${fmtDate(advance.expected_date)}</td><td style="font-weight:600;">চেক মাধ্যমে ঃ <span class="chk">${isCheque ? '✓' : ''}</span>&nbsp;&nbsp;&nbsp;&nbsp;নগদ ঃ <span class="chk">${!isCheque ? '✓' : ''}</span>&nbsp;&nbsp;&nbsp;&nbsp;(${advance.receive_medium === 'cheque' ? 'Cheque' : 'Direct'})</td></tr>
      <tr class="type-sub-row"><td style="font-weight:600;">ব্যাংকের নাম: ${advance.bank_name || ''}</td></tr>
      <tr class="type-sub-row"><td style="font-weight:600;">চেক নং- ${advance.cheque_no || ''}</td></tr>
    </tbody>
  </table>
  <div class="kathay-row"><span>কথায় ঃ</span><span class="kathay-fill">${advance.amount_in_words || ''}</span><span>টাকা মাত্র ।</span></div>
  <div class="comment-box"><div class="comment-box-label">হিসাবরক্ষকের মন্তব্য ঃ</div>${advance.accountant_remarks || ''}</div>
  <table class="qa-table">
    <tbody>
      <tr><td>বর্তমান উল্লেখিত কর্মচারীর নামে ফেরৎ যোগ্য অগ্রিম আছে কি?</td><td class="qa-yn">${chkT(advance.check_outstanding)}</td><td class="qa-yn">${chkF(advance.check_outstanding)}</td></tr>
      <tr><td>অতীতে অগ্রিম গ্রহণ করে সঠিকসময় সমন্বয় করেছেন কি?</td><td class="qa-yn">${chkT(advance.check_adjusted)}</td><td class="qa-yn">${chkF(advance.check_adjusted)}</td></tr>
      <tr><td>অতীতে যে কাজের জন্য অগ্রিম গ্রহণ করেছেন সে কাজ সঠিক- ভাবে করতে পেরেছিলেন কি?</td><td class="qa-yn">${chkT(advance.check_completed)}</td><td class="qa-yn">${chkF(advance.check_completed)}</td></tr>
    </tbody>
  </table>
  <div class="recipient-sig"><div class="sig-line-short"></div>${sigRecipient}<div class="sig-lbl">অগ্রিম গ্রহীতার স্বাক্ষর</div></div>
  <div class="footer-sigs">
    <div class="footer-sig">${sigAccountant}হিসাবরক্ষকের স্বাক্ষর</div>
    <div class="footer-sig">${sigRecommender}সুপারিশকারীর স্বাক্ষর</div>
    <div class="footer-sig">${sigApprover}অনুমোদনকারীর স্বাক্ষর</div>
  </div>
</body>
</html>`;
};

const CHECKLIST_LABELS = [
  {
    key: 'check_outstanding',
    label: 'Is there any outstanding refundable advance against the mentioned employee?',
  },
  {
    key: 'check_adjusted',
    label: 'If any advance was taken in the past, was it adjusted/settled timely?',
  },
  {
    key: 'check_completed',
    label: 'Was the work for which the past advance was taken completed properly?',
  },
];

const SIGNATURE_FIELDS = [
  { key: 'signature_recipient', label: 'Advance Recipient' },
  { key: 'signature_accountant', label: 'Accountant' },
  { key: 'signature_recommender', label: 'Recommender' },
  { key: 'signature_approver', label: 'Approver' },
];

// ── Small helpers ─────────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, mt: 1 }}>
      <Typography variant="subtitle1" fontWeight={700}>
        {children}
      </Typography>
      <Divider sx={{ flex: 1 }} />
    </Stack>
  );
}

function DetailRow({ label, value }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'divider', gap: 2 }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 200, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        component="div"
        fontWeight={500}
        textAlign="right"
        sx={{ wordBreak: 'break-word' }}
      >
        {value ?? '—'}
      </Typography>
    </Stack>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AdvanceDetailView() {
  const { id } = useParams();
  const router = useRouter();
  const confirm = useBoolean();

  const { advance, advanceLoading, advanceError } = useGetAdvance(id);

  // DRF with request context returns absolute URLs for ImageFields.
  // If the URL is somehow relative, prepend the backend origin.
  const resolveUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_HOST_API || 'http://127.0.0.1:8000'}${url}`;
  };

  const handleDelete = async () => {
    try {
      await deleteAdvance(id);
      toast.success('Advance deleted successfully');
      router.push(paths.dashboard.projectManagements.expenses.advances.root);
    } catch {
      toast.error('Failed to delete advance.');
    } finally {
      confirm.onFalse();
    }
  };

  const handlePrint = () => {
    try {
      const html = getAdvancePrintHTML(advance, resolveUrl);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) {
        toast.error('Please allow popups for this website to print.');
        return;
      }
      win.focus();
    } catch (error) {
      toast.error('Failed to generate print preview.');
    }
  };

  if (advanceLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={88} sx={{ borderRadius: 2, mb: 2 }} />
        <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (!advance || advanceError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Advance record not found or an error occurred.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          mb: 2,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <CardContent sx={{ p: '18px 24px !important' }}>
          <Stack direction="row" alignItems="flex-start" spacing={2} flexWrap="wrap" gap={1}>
            <IconButton
              component={RouterLink}
              href={paths.dashboard.projectManagements.expenses.advances.root}
              sx={{ mt: 0.25, flexShrink: 0 }}
            >
              <Iconify icon="solar:arrow-left-bold" width={20} />
            </IconButton>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                flexWrap="wrap"
                sx={{ mb: 0.5 }}
              >
                <Typography variant="h5" fontWeight={700} noWrap>
                  {advance.from_employee_name || 'Unknown Employee'}
                </Typography>
                <Label variant="soft" color={MEDIUM_COLORS[advance.receive_medium] || 'default'}>
                  {MEDIUM_LABELS[advance.receive_medium] || advance.receive_medium}
                </Label>
              </Stack>
              <Stack direction="row" spacing={2.5} flexWrap="wrap">
                <Typography variant="caption" color="text.secondary">
                  {advance.project_title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ৳
                  {parseFloat(advance.advance_receivable_amount || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Created {new Date(advance.created_at).toLocaleDateString()}
                </Typography>
              </Stack>
            </Box>

            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="solar:pen-bold" width={16} />}
              onClick={() =>
                window.open(
                  paths.dashboard.projectManagements.expenses.advances.edit(advance.id),
                  '_blank'
                )
              }
              sx={{ mr: 1 }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="solar:printer-bold" width={16} />}
              onClick={handlePrint}
              sx={{ mr: 1 }}
            >
              Print
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" width={16} />}
              onClick={confirm.onTrue}
            >
              Delete
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* ── DETAIL CONTENT ─────────────────────────────────────────────── */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          {/* Section 1: Advance Request */}
          <SectionTitle>Advance Request</SectionTitle>
          <Grid container spacing={0} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }} sx={{ pr: { md: 3 } }}>
              <DetailRow label="Employee" value={advance.from_employee_name} />
              <DetailRow label="Project" value={advance.project_title} />
              <DetailRow label="Cause of Advance" value={advance.cause_of_advance} />
            </Grid>
            <Grid
              size={{ xs: 12, md: 6 }}
              sx={{
                pl: { md: 3 },
                borderLeft: { md: '1px solid' },
                borderColor: { md: 'divider' },
              }}
            >
              {advance.from_text && <DetailRow label="From Details" value={advance.from_text} />}
              {advance.to_text && <DetailRow label="To" value={advance.to_text} />}
            </Grid>
          </Grid>

          {/* Section 2: Financial Details */}
          <SectionTitle>Details of Advance</SectionTitle>
          <Grid container spacing={0} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }} sx={{ pr: { md: 3 } }}>
              <DetailRow label="Advance Receivable Date" value={advance.advance_receivable_date} />
              <DetailRow
                label="Advance Receivable Amount"
                value={`৳${parseFloat(advance.advance_receivable_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              />
              <DetailRow label="Amount in Words" value={advance.amount_in_words} />
              <DetailRow label="Expected Date" value={advance.expected_date} />
            </Grid>
            <Grid
              size={{ xs: 12, md: 6 }}
              sx={{
                pl: { md: 3 },
                borderLeft: { md: '1px solid' },
                borderColor: { md: 'divider' },
              }}
            >
              <DetailRow
                label="Receive Medium"
                value={
                  <Label variant="soft" color={MEDIUM_COLORS[advance.receive_medium] || 'default'}>
                    {MEDIUM_LABELS[advance.receive_medium] || advance.receive_medium}
                  </Label>
                }
              />
              {advance.receive_medium === 'cheque' && (
                <>
                  <DetailRow label="Bank Name" value={advance.bank_name} />
                  <DetailRow label="Cheque No" value={advance.cheque_no} />
                </>
              )}
              {advance.accountant_remarks && (
                <DetailRow label="Accountant Remarks" value={advance.accountant_remarks} />
              )}
            </Grid>
          </Grid>

          {/* Section 3: Checklist */}
          <SectionTitle>Advance Checklist</SectionTitle>
          <Card
            variant="outlined"
            sx={{ borderRadius: 2, border: '1px solid #e5e7eb', mb: 3, overflow: 'hidden' }}
          >
            {CHECKLIST_LABELS.map(({ key, label }) => {
              const val = advance[key];
              const meta = CHECK_META[val];
              return (
                <Stack
                  key={key}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    py: 1.75,
                    px: 2.5,
                    borderBottom: '1px solid #f3f4f6',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Typography variant="body2" sx={{ flex: 1, pr: 3 }}>
                    {label}
                  </Typography>
                  {meta ? (
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Iconify icon={meta.icon} width={20} sx={{ color: meta.color }} />
                      <Typography variant="body2" fontWeight={600} sx={{ color: meta.color }}>
                        {meta.label}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      Not marked
                    </Typography>
                  )}
                </Stack>
              );
            })}
          </Card>

          {/* Section 4: Signatures */}
          <SectionTitle>Signatures</SectionTitle>
          <Grid container spacing={2}>
            {SIGNATURE_FIELDS.map(({ key, label }) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={key}>
                <Box
                  sx={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    minHeight: 180,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.5,
                    bgcolor: '#fafafa',
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                  >
                    {label}
                  </Typography>
                  {advance[key] ? (
                    <Box
                      component="img"
                      src={resolveUrl(advance[key])}
                      alt={label}
                      sx={{
                        maxHeight: 110,
                        maxWidth: '100%',
                        objectFit: 'contain',
                        borderRadius: 1,
                        border: '1px solid #e5e7eb',
                        flex: 1,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        border: '2px dashed #d1d5db',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                      }}
                    >
                      <Typography variant="caption" color="text.disabled">
                        No signature
                      </Typography>
                    </Box>
                  )}
                  <Divider sx={{ width: '100%' }} />
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Advance"
        content="Are you sure you want to delete this advance record? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
