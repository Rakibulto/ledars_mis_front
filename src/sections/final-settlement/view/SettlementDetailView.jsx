'use client';

import { mutate } from 'swr';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { endpoints } from 'src/utils/axios';
import { fDate } from 'src/utils/format-time';

import { CONFIG } from 'src/config-global';
import { DashboardContent } from 'src/layouts/dashboard';
import StatusChip from 'src/_components/final-settlement/StatusChip';
import { useGetRequest, useCreateMutation } from 'src/actions/ledars-hook';
import SignatureDialog from 'src/_components/final-settlement/SignatureDialog';
import PaymentCompleteDialog from 'src/_components/final-settlement/PaymentCompleteDialog';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

const FINANCIAL_COLUMNS = [
  'S/N',
  'Particulars',
  'Yes/No',
  'Amount (Tk)',
  'Due Staff',
  'Due LEDARS',
  'Remarks',
];

const LOAN_COLUMNS = ['S/N', 'Date', 'Amount (Tk)', 'Last Date of Payment', 'Remarks'];

export default function SettlementDetailView() {
  const params = useParams();
  const { id } = params;
  const router = useRouter();
  const { user } = useAuthContext();
  const [signLoading, setSignLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Signature dialog state
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signRole, setSignRole] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const apiUrl = useMemo(() => endpoints.finalSettlement.byId(id), [id]);

  const { data: settlement, loading } = useGetRequest(apiUrl);

  const { trigger: signTrigger } = useCreateMutation(endpoints.finalSettlement.sign(id));
  const { trigger: paymentTrigger } = useCreateMutation(
    endpoints.finalSettlement.paymentComplete(id)
  );

  const handleSignOpen = (role) => {
    setSignRole(role);
    setSignDialogOpen(true);
  };

  const handleSignConfirm = async () => {
    if (!signRole) return;
    setSignLoading(true);
    try {
      await signTrigger({ role: signRole, confirmed: true });
      toast.success(`Signed as ${signRole.charAt(0).toUpperCase() + signRole.slice(1)}`);
      setSignDialogOpen(false);
      setSignRole(null);
      mutate(apiUrl);
    } catch (error) {
      toast.error(error?.detail || error?.message || 'Failed to sign');
    } finally {
      setSignLoading(false);
    }
  };

  const handlePaymentConfirm = async () => {
    setPaymentLoading(true);
    try {
      await paymentTrigger({});
      toast.success('Payment completed successfully!');
      setPaymentDialogOpen(false);
      mutate(apiUrl);
    } catch (error) {
      toast.error(error?.detail || error?.message || 'Failed to complete payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const renderSignatureChip = (role, label) => {
    const sigMap = {
      supervisor: 'supervisor_signature',
      finance: 'finance_signature',
      management: 'management_signature',
    };
    const sigData = settlement?.[sigMap[role]];
    if (sigData) {
      return (
        <Chip
          icon={<Iconify icon="solar:check-circle-bold-duotone" />}
          label={`Signed by ${sigData.name} on ${new Date(sigData.signed_at).toLocaleDateString()}`}
          color="success"
          variant="outlined"
          sx={{ width: '100%', justifyContent: 'flex-start', py: 2 }}
        />
      );
    }
    return (
      <Button
        variant="outlined"
        color="primary"
        startIcon={<Iconify icon="solar:pen-bold-duotone" />}
        onClick={() => handleSignOpen(role)}
        sx={{ width: '100%' }}
      >
        {label}
      </Button>
    );
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

  if (!settlement) {
    return (
      <DashboardContent>
        <Typography variant="h6" sx={{ textAlign: 'center', py: 8 }}>
          Settlement not found
        </Typography>
      </DashboardContent>
    );
  }

  const allSigned =
    settlement.supervisor_signature &&
    settlement.finance_signature &&
    settlement.management_signature;

  const handleFinalSettlementPrint = () => {
    const baseUrl = CONFIG.appDomainUrl.replace(/\/+$/, '');
    const s = settlement;

    const fmtDate = (d) => {
      if (!d) return '';
      try {
        return new Date(d).toLocaleDateString('en-BD', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch {
        return d;
      }
    };

    const finRows = (s.financial_rows || [])
      .map(
        (r) =>
          `<tr>
          <td class="tc">${String(r.sn || '').padStart(2, '0')}</td>
          <td>${r.particulars || ''}</td>
          <td class="tc">${r.yes_no || ''}</td>
          <td class="tr">${(r.amount ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
          <td class="tr">${(r.due_staff ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
          <td class="tr">${(r.due_ledars ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
          <td>${r.remarks || ''}</td>
        </tr>`
      )
      .join('');

    const loanRows = (s.loan_rows || [])
      .map(
        (r) =>
          `<tr>
          <td class="tc">${r.sn || ''}</td>
          <td>${fmtDate(r.date)}</td>
          <td class="tr">${(r.amount ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
          <td>${fmtDate(r.last_date_of_payment)}</td>
          <td>${r.remarks || ''}</td>
        </tr>`
      )
      .join('');

    const sigImg = (sig) => {
      if (!sig) return '';
      const imgUrl = sig.signature_image;
      if (!imgUrl) return '';
      return `<img src="${imgUrl}" style="max-height:40px;max-width:140px;object-fit:contain;display:block;margin-top:4px;" />`;
    };

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
        .f-val { flex: 1; padding-bottom: 1px; padding-left: 4px; min-height: 14px; border-bottom: 1px dotted #555; font-size: 11px; }
        .section-title { font-weight: 700; font-size: 11px; margin-bottom: 5px; margin-top: 8px; }
        .opinion-box { border: 1px solid #555; min-height: 58px; padding: 6px; margin-bottom: 10px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 8px; }
        table th, table td { border: 1px solid #555; padding: 3px 5px; }
        table th { font-weight: 700; text-align: center; background: #f5f5f5; }
        .tc { text-align: center; } .tr { text-align: right; } .bold { font-weight: 700; }
        .inwards-row { display: flex; gap: 4px; align-items: baseline; margin-top: 4px; }
        .inwards-fill { flex: 1; border-bottom: 1px dotted #555; min-height: 14px; padding-left: 4px; font-size: 11px; }
        .decl-box { border: 1px solid #555; min-height: 50px; padding: 6px; margin-bottom: 10px; font-size: 11px; }
        .decl-para { font-size: 11px; line-height: 1.8; margin-bottom: 18px; }
        .sig-right { text-align: right; font-size: 11px; margin-bottom: 28px; }
        .footer-sigs { display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px solid #555; font-size: 11px; }
        .sig-block { text-align: center; min-width: 130px; }
        .sig-block .sig-label { font-weight: 700; display: block; margin-bottom: 2px; }
        .sig-block .sig-name { font-size: 10px; color: #444; }
        @media print { body { padding: 0; } @page { size: A4; margin: 1cm 1.2cm; } }
      `;

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
      <title>Final Settlement Form</title><style>${SHARED_CSS}</style></head><body>
    
      <div class="page">
        <div class="hdr">
          <img class="hdr-logo" src="${baseUrl}/icons/logo.png" alt="LEDARS" onerror="this.style.display='none'">
          <img class="hdr-name" src="${baseUrl}/icons/name_img.png" alt="LEDARS Shyamnagar" onerror="this.style.display='none'">
        </div>
        <div class="form-title">Final Settlement Form</div>
    
        <div class="field-row">
          <span class="f-lbl">Project Name:</span><span class="f-val">${s.project_name || ''}</span>
          <span class="f-lbl" style="margin-left:16px;">Date:</span><span class="f-val" style="max-width:140px;">${fmtDate(s.date)}</span>
        </div>
        <div class="field-row"><span class="f-lbl">Name of Staff:</span><span class="f-val">${s.name_of_staff || ''}</span></div>
        <div class="field-row"><span class="f-lbl">Designation:</span><span class="f-val">${s.designation || ''}</span></div>
        <div class="field-row">
          <span class="f-lbl">Joining Date:</span><span class="f-val">${fmtDate(s.joining_date)}</span>
          <span class="f-lbl" style="margin-left:16px;">Resignation Date:</span><span class="f-val">${fmtDate(s.resignation_date)}</span>
        </div>
    
        <div class="section-title">Supervisor Opinion:</div>
        <div class="opinion-box">${s.supervisor_opinion || ''}</div>
    
        <div class="section-title">Financial Settlement:</div>
        <table>
          <thead><tr>
            <th style="width:38px;">S/N</th>
            <th>Particulars</th>
            <th style="width:52px;">Yes/No</th>
            <th style="width:68px;">Amount (Tk)</th>
            <th style="width:72px;">Due Staff</th>
            <th style="width:76px;">Due LEDARS</th>
            <th style="width:68px;">Remarks</th>
          </tr></thead>
          <tbody>
            ${finRows || '<tr><td colspan="7" style="text-align:center;color:#999;">No financial rows</td></tr>'}
            <tr style="font-weight:700;background:#f5f5f5;">
              <td colspan="3" class="tr bold">Total</td>
              <td class="tr">${(s.total_amount ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
              <td class="tr">${(s.total_due_staff ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
              <td class="tr">${(s.total_due_ledars ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
        <div class="inwards-row">
          <span class="f-lbl">Final Payment of Staff:</span>
          <span class="inwards-fill">${(s.final_payment ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })} Tk</span>
        </div>
        <div class="inwards-row">
          <span class="f-lbl">In Words:</span>
          <span class="inwards-fill">${s.final_payment_words || ''}</span>
        </div>
      </div>
    
      <div class="page">
        <div class="hdr">
          <img class="hdr-logo" src="${baseUrl}/icons/logo.png" alt="LEDARS" onerror="this.style.display='none'">
          <img class="hdr-name" src="${baseUrl}/icons/name_img.png" alt="LEDARS Shyamnagar" onerror="this.style.display='none'">
        </div>
    
        <div class="section-title" style="margin-top:8px;">Loan Information:</div>
        <table>
          <thead><tr>
            <th style="width:38px;">S/N</th><th>Date</th><th>Amount (Tk)</th>
            <th>Last Date of Payment</th><th>Remarks</th>
          </tr></thead>
          <tbody>
            ${loanRows || '<tr><td colspan="5" style="text-align:center;color:#999;">No loan records</td></tr>'}
          </tbody>
        </table>
    
        <div class="section-title">Declaration of Canteen Manager:</div>
        <div class="decl-box">${s.canteen_declaration || ''}</div>
    
        <div class="section-title">Declaration of Srizon Manager:</div>
        <div class="decl-box">${s.srizon_declaration || ''}</div>
    
        <div class="decl-para">
          I declared that I &nbsp;<strong>${s.declaration_name || '............................'}</strong>&nbsp;
          Finished all financial dealing with LEDARS today. I do not have any due except the amount
          &nbsp;<strong>${s.declaration_amount || '....................................'}</strong>&nbsp;
          to LEDARS. I cannot claims any benefit to LEDARS in future.
        </div>
    
        <div class="sig-right">
          ${s.declaration_name || '.………………………'}<br>Signature of Employee
        </div>
    
        <div class="footer-sigs">
          <div class="sig-block">
            <span class="sig-label">Supervisor</span>
            ${sigImg(s.supervisor_signature)}
            <span class="sig-name">${s.supervisor_signature?.name || ''}</span>
          </div>
          <div class="sig-block">
            <span class="sig-label">Finance Person</span>
            ${sigImg(s.finance_signature)}
            <span class="sig-name">${s.finance_signature?.name || ''}</span>
          </div>
          <div class="sig-block">
            <span class="sig-label">Management Person</span>
            ${sigImg(s.management_signature)}
            <span class="sig-name">${s.management_signature?.name || ''}</span>
          </div>
        </div>
      </div>
    
      </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 700);
  };
  return (
    <DashboardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h4">Settlement Details</Typography>
          <StatusChip status={settlement.status} />
        </Stack>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="solar:arrow-left-bold-duotone" />}
          onClick={() => router.push('/dashboard/final-settlement')}
        >
          Back to List
        </Button>
      </Stack>

      {/* Section 1: Header Info */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Header Information
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Typography>
              <strong>Project Name:</strong> {settlement.project_name}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography>
              <strong>Name of Staff:</strong> {settlement.name_of_staff}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography>
              <strong>Date:</strong> {settlement.date ? fDate(settlement.date) : '-'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography>
              <strong>Designation:</strong> {settlement.designation}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }} />
          <Grid size={{ xs: 6 }}>
            <Typography>
              <strong>Joining Date:</strong>{' '}
              {settlement.joining_date ? fDate(settlement.joining_date) : '-'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography>
              <strong>Resignation Date:</strong>{' '}
              {settlement.resignation_date ? fDate(settlement.resignation_date) : '-'}
            </Typography>
          </Grid>
        </Grid>
      </Card>

      {/* Section 2: Supervisor Opinion */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Supervisor Opinion
        </Typography>
        <Typography>{settlement.supervisor_opinion || 'No opinion provided.'}</Typography>
      </Card>

      {/* Section 3: Financial Settlement Table */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Financial Settlement
        </Typography>
        <Paper variant="outlined" sx={{ overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {FINANCIAL_COLUMNS.map((col) => (
                  <TableCell key={col}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(settlement.financial_rows || []).map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{String(row.sn).padStart(2, '0')}</TableCell>
                  <TableCell>{row.particulars}</TableCell>
                  <TableCell>{row.yes_no}</TableCell>
                  <TableCell>{row.amount || 0}</TableCell>
                  <TableCell>{row.due_staff || 0}</TableCell>
                  <TableCell>{row.due_ledars || 0}</TableCell>
                  <TableCell>{row.remarks || ''}</TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell colSpan={3} align="right">
                  <strong>Total</strong>
                </TableCell>
                <TableCell>
                  <strong>{settlement.total_amount}</strong>
                </TableCell>
                <TableCell>
                  <strong>{settlement.total_due_staff}</strong>
                </TableCell>
                <TableCell>
                  <strong>{settlement.total_due_ledars}</strong>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid size={{ xs: 6 }}>
            <Typography>
              <strong>Final Payment of Staff:</strong> {settlement.final_payment || 0}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography>
              <strong>In Words:</strong> {settlement.final_payment_words || '-'}
            </Typography>
          </Grid>
        </Grid>
      </Card>

      {/* Section 4: Loan Information */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Loan Information
        </Typography>
        {settlement.loan_rows && settlement.loan_rows.length > 0 ? (
          <Paper variant="outlined" sx={{ overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {LOAN_COLUMNS.map((col) => (
                    <TableCell key={col}>{col}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {settlement.loan_rows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.sn}</TableCell>
                    <TableCell>{row.date || '-'}</TableCell>
                    <TableCell>{row.amount || 0}</TableCell>
                    <TableCell>{row.last_date_of_payment || '-'}</TableCell>
                    <TableCell>{row.remarks || ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No loan records.
          </Typography>
        )}
      </Card>

      {/* Section 5: Declarations */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Declarations
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="subtitle2">Canteen Manager Declaration</Typography>
            <Typography>{settlement.canteen_declaration || 'N/A'}</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="subtitle2">Srizon Manager Declaration</Typography>
            <Typography>{settlement.srizon_declaration || 'N/A'}</Typography>
          </Grid>
        </Grid>
      </Card>

      {/* Section 6: Final Declaration */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Final Declaration
        </Typography>
        <Paper variant="outlined" sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Typography variant="body1">
            I declared that I <strong>{settlement.declaration_name || '______'}</strong> Finished
            all financial dealing with LEDARS today. I do not have any due except the amount{' '}
            <strong>{settlement.declaration_amount || '______'}</strong> to LEDARS. I cannot claims
            any benefit to LEDARS in future.
          </Typography>
        </Paper>
      </Card>

      {/* Signature Section */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Signatures
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 4 }}>{renderSignatureChip('supervisor', 'Supervisor Signature')}</Grid>
          <Grid size={{ xs: 4 }}>{renderSignatureChip('finance', 'Finance Person Signature')}</Grid>
          <Grid size={{ xs: 4 }}>
            {renderSignatureChip('management', 'Management Person Signature')}
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            size="large"
            startIcon={<Iconify icon="solar:printer-bold-duotone" />}
            onClick={handleFinalSettlementPrint}
          >
            Print
          </Button>
          {allSigned && settlement.status === 'Payment_Pending' && (
            <Button
              variant="contained"
              color="success"
              fullWidth
              size="large"
              startIcon={<Iconify icon="solar:card-transfer-bold-duotone" />}
              onClick={() => setPaymentDialogOpen(true)}
            >
              Mark as Payment Completed
            </Button>
          )}
        </Box>
      </Card>

      {/* Signature Dialog */}
      <SignatureDialog
        open={signDialogOpen}
        onClose={() => {
          setSignDialogOpen(false);
          setSignRole(null);
        }}
        onConfirm={handleSignConfirm}
        role={signRole}
        currentUser={{ name: user?.name || user?.email, email: user?.email }}
        loading={signLoading}
      />

      {/* Payment Complete Dialog */}
      <PaymentCompleteDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        onConfirm={handlePaymentConfirm}
        loading={paymentLoading}
      />
    </DashboardContent>
  );
}
