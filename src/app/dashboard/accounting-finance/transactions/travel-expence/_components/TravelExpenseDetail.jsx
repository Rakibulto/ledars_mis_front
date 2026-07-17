'use client';

import { mutate } from 'swr';
import numberToWords from 'number-to-words';
import { useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';
import { fDate } from 'src/utils/format-time';

import { CONFIG } from 'src/config-global';
import { DashboardContent } from 'src/layouts/dashboard';
import { SIGN_ROLES } from 'src/constants/travelExpense';
import StatusChip from 'src/app/dashboard/accounting-finance/transactions/travel-expence/_components/StatusChip';
import {
  useGetRequest,
  useCreateMutation,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';
import SignatureDialog from 'src/app/dashboard/accounting-finance/transactions/travel-expence/_components/SignatureDialog';
import DeleteConfirmDialog from 'src/app/dashboard/accounting-finance/transactions/travel-expence/_components/DeleteConfirmDialog';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

const { toWords } = numberToWords;

const parseNumber = (val) => {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : 0;
};

export default function TravelExpenseDetail() {
  const params = useParams();
  const { id } = params;
  const router = useRouter();
  const { user } = useAuthContext();
  const [signLoading, setSignLoading] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signRole, setSignRole] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const deleteConfirm = useBoolean();

  const apiUrl = useMemo(() => endpoints.travelExpense.byId(id), [id]);
  const { data: travelExpense, loading } = useGetRequest(apiUrl);

  const { trigger: signTrigger } = useCreateMutation(endpoints.travelExpense.sign(id));

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
      await deleteRequest(endpoints.travelExpense.byId(id));
      toast.success('Travel expense deleted successfully!');
      router.push('/dashboard/accounting-finance/transactions/travel-expence');
    } catch (error) {
      toast.error(error?.detail || error?.message || 'Failed to delete');
    } finally {
      setDeleteLoading(false);
      deleteConfirm.onFalse();
    }
  }, [id, router, deleteConfirm]);

  const handleTravelExpensePrint = () => {
    if (!travelExpense) return;
    const baseUrl = CONFIG.appDomainUrl.replace(/\/+$/, '');
    const t = travelExpense;

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

    const fmtMoney = (v) => parseNumber(v).toLocaleString('en-BD', { minimumFractionDigits: 2 });

    const amountInWords = (() => {
      const total = parseNumber(t.grand_total);
      if (total === 0) return '';
      try {
        const words = toWords(Math.floor(total));
        const paisa = Math.round((total - Math.floor(total)) * 100);
        if (paisa > 0) {
          return `${words} taka and ${toWords(paisa)} paisa only`;
        }
        return `${words} taka only`;
      } catch {
        return '';
      }
    })();

    const sigImg = (sig) => {
      if (!sig) return '';
      const imgUrl = sig.signature_image;
      if (!imgUrl) return '';
      return `<img src="${imgUrl}" style="max-height:40px;max-width:140px;object-fit:contain;display:block;margin-top:4px;" />`;
    };

    const expenseRows = (t.expense_rows || [])
      .map(
        (r, i) =>
          `<tr>
            <td>${i + 1}</td>
            <td>${r.date_time ? fmtDate(r.date_time) : ''}</td>
            <td>${r.description || ''}</td>
            <td class="tc">${r.mode || ''}</td>
            <td class="tr">${fmtMoney(r.travel_fare)}</td>
            <td class="tr">${fmtMoney(r.food)}</td>
            <td class="tr">${fmtMoney(r.lodging)}</td>
            <td class="tr">${fmtMoney(r.row_total)}</td>
          </tr>`
      )
      .join('');

    const minRows = Math.max(6, t.expense_rows?.length || 0);
    const emptyRows = Array(Math.max(0, minRows - (t.expense_rows || []).length))
      .fill(0)
      .map(
        () =>
          '<tr><td style="height:20px;"></td><td></td><td></td><td class="tc"></td><td class="tr"></td><td class="tr"></td><td class="tr"></td><td class="tr"></td></tr>'
      )
      .join('');

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
    <title>Travel Expense Report (TER)</title>
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #000; background: #fff; padding: 18px 26px; }

      .hdr { display: flex; justify-content: center; margin-bottom: 6px; }
      .hdr-inner { display: flex; align-items: flex-start; gap: 8px; }
      .hdr-logo { width: 52px; height: 52px; object-fit: contain; }
      .hdr-text { display: flex; flex-direction: column; align-items: center; }
      .hdr-name-img { max-height: 40px; width: auto; object-fit: contain; }
      .hdr-full-name { font-size: 9px; margin-top: 3px; text-align: center; }
      .hdr-web { font-size: 9px; text-decoration: underline; color: #0000cc; text-align: center; }

      .title-wrap { text-align: center; margin: 6px 0 10px; }
      .title-pill {
        display: inline-block; background: #1c1c1c; color: #fff;
        font-size: 13px; font-weight: 700;
        padding: 4px 20px; border-radius: 5px;
      }

      .field-row { display: flex; align-items: baseline; gap: 4px; margin-bottom: 5px; }
      .f-lbl { font-weight: 400; white-space: nowrap; font-size: 11px; }
      .f-dot { flex: 1; border-bottom: 1px dotted #555; min-height: 13px; padding-left: 3px; font-size: 11px; }
      .f-dot-fix { width: 140px; border-bottom: 1px dotted #555; min-height: 13px; }
      .date-box {
        display: inline-block; width: 120px; height: 20px;
        border: 1px solid #555; vertical-align: middle; margin-left: 4px;
      }

      table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 6px; }
      table th, table td { border: 1px solid #555; padding: 2px 4px; }
      table th { text-align: center; font-weight: 700; background: #e8e8e8; }
      table td { height: 18px; vertical-align: middle; }
      .tc { text-align: center; }
      .tr { text-align: right; }
      .bold { font-weight: 700; }

      .attach-note { text-align: right; font-size: 10.5px; margin-bottom: 4px; }
      .inwards-row { display: flex; gap: 4px; align-items: baseline; margin-bottom: 14px; }
      .inwards-fill { flex: 1; border-bottom: 1px dotted #555; font-size: 11px; }

      .footer-sigs { display: flex; justify-content: space-between; font-size: 11px; font-weight: 400; padding-top: 5px; }
      .sig-block { text-align: center; min-width: 130px; }
      .sig-lbl { font-weight: 700; display: block; margin-bottom: 2px; }
      .sig-name { font-size: 9px; color: #444; }
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
          <div class="hdr-web">www.ledars.org</div>
        </div>
      </div>
    </div>

    <!-- ── TER TITLE ── -->
    <div class="title-wrap"><span class="title-pill">Travel Expense Report (TER)</span></div>

    <!-- ── INFO FIELDS ── -->
    <div class="field-row">
      <span class="f-lbl">Project:</span><span class="f-dot">${t.project || ''}</span>
      <span class="f-lbl" style="margin-left:10px;">Date of Submission :</span>
      <span class="f-dot" style="max-width:140px;flex:none;">${t.date_of_submission ? fmtDate(t.date_of_submission) : ''}</span>
    </div>
    <div class="field-row">
      <span class="f-lbl">Name:</span><span class="f-dot">${t.name || ''}</span>
      <span class="f-lbl" style="margin-left:10px;">Designation:</span><span class="f-dot">${t.designation || ''}</span>
    </div>
    <div class="field-row"><span class="f-lbl">Purpose:</span><span class="f-dot">${t.purpose || ''}</span></div>

    <!-- ── MAIN TABLE ── -->
    <table>
      <thead><tr>
        <th style="width:36px;">#</th>
        <th style="width:80px;">Date &amp; Time</th>
        <th>Description</th>
        <th style="width:52px;">Mode</th>
        <th style="width:60px;">Travel Fare</th>
        <th style="width:52px;">Food</th>
        <th style="width:60px;">Lodging</th>
        <th style="width:56px;">Total</th>
      </tr></thead>
      <tbody>
        ${expenseRows}${emptyRows}
        <tr>
          <td colspan="3" style="font-weight:700;text-align:right;">Total</td>
          <td></td>
          <td class="tr bold">${fmtMoney(t.total_travel_fare)}</td>
          <td class="tr bold">${fmtMoney(t.total_food)}</td>
          <td class="tr bold">${fmtMoney(t.total_lodging)}</td>
          <td class="tr bold">${fmtMoney(t.grand_total)}</td>
        </tr>
      </tbody>
    </table>

    <div class="attach-note">(please attach the supporting documents)</div>
    <div class="inwards-row">
      <span class="f-lbl">(Total Taka in words:</span>
      <span class="inwards-fill">${amountInWords}</span>
      <span class="f-lbl">)</span>
    </div>

    <!-- ── FOOTER SIGNATURES ── -->
    <div class="footer-sigs">
      <div class="sig-block">
        <span class="sig-lbl">Prepared &amp; received by</span>
        ${sigImg(t.prepared_received_signature)}
        <span class="sig-name">${t.prepared_received_signature?.name || ''}</span>
      </div>
      <div class="sig-block">
        <span class="sig-lbl">Checked by</span>
        ${sigImg(t.checked_by_signature)}
        <span class="sig-name">${t.checked_by_signature?.name || ''}</span>
      </div>
      <div class="sig-block">
        <span class="sig-lbl">Accountant</span>
        ${sigImg(t.accountant_signature)}
        <span class="sig-name">${t.accountant_signature?.name || ''}</span>
      </div>
      <div class="sig-block">
        <span class="sig-lbl">Approved by</span>
        ${sigImg(t.approved_by_signature)}
        <span class="sig-name">${t.approved_by_signature?.name || ''}</span>
      </div>
    </div>
    <div class="note-row">Note: ${t.note || ''}</div>

    </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 700);
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

  if (!travelExpense) {
    return (
      <DashboardContent>
        <Typography variant="h6" sx={{ textAlign: 'center', py: 8 }}>
          Travel expense not found
        </Typography>
      </DashboardContent>
    );
  }

  const allSigned =
    travelExpense.prepared_received_signature &&
    travelExpense.checked_by_signature &&
    travelExpense.accountant_signature &&
    travelExpense.approved_by_signature;

  const attachmentsByRow = {};
  (travelExpense.attachments || []).forEach((att) => {
    if (!attachmentsByRow[att.row_index]) attachmentsByRow[att.row_index] = [];
    attachmentsByRow[att.row_index].push(att);
  });

  const renderSignatureBlock = (role, label) => {
    const sigMap = {
      prepared_received: 'prepared_received_signature',
      checked_by: 'checked_by_signature',
      accountant: 'accountant_signature',
      approved_by: 'approved_by_signature',
    };
    const sigData = travelExpense[sigMap[role]];

    if (sigData) {
      return (
        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {label}
          </Typography>
          {sigData.signature_image && (
            <Box
              component="img"
              src={sigData.signature_image}
              alt={`${label} signature`}
              sx={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain', my: 1 }}
            />
          )}
          <Typography variant="body2" fontWeight={600}>
            {sigData.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {sigData.signed_at ? new Date(sigData.signed_at).toLocaleDateString() : ''}
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
            onClick={() => router.push('/dashboard/accounting-finance/transactions/travel-expence')}
          >
            Back
          </Button>
          <Typography variant="h4">Travel Expense Detail</Typography>
          <StatusChip status={travelExpense.status} />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:printer-bold" />}
            onClick={handleTravelExpensePrint}
          >
            Print
          </Button>
          {travelExpense.status === 'draft' && (
            <>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:pen-bold-duotone" />}
                onClick={() =>
                  router.push(
                    `/dashboard/accounting-finance/transactions/travel-expence/create?editId=${id}`
                  )
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

      {allSigned && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Approved by all signatories
        </Alert>
      )}

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Header Information
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Project
            </Typography>
            <Typography variant="body1">{travelExpense.project}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Date of Submission
            </Typography>
            <Typography variant="body1">
              {travelExpense.date_of_submission ? fDate(travelExpense.date_of_submission) : ''}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Name
            </Typography>
            <Typography variant="body1">{travelExpense.name}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Designation
            </Typography>
            <Typography variant="body1">{travelExpense.designation}</Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Purpose
            </Typography>
            <Typography variant="body1">{travelExpense.purpose}</Typography>
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Expense Details
        </Typography>
        <Paper variant="outlined" sx={{ overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Date & Time</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Mode</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Travel Fare</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Food</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Lodging</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Files</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(travelExpense.expense_rows || []).map((row, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ textAlign: 'center' }}>{index + 1}</TableCell>
                  <TableCell>
                    {row.date_time ? new Date(row.date_time).toLocaleString() : ''}
                  </TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell>{row.mode}</TableCell>
                  <TableCell align="right">
                    {parseNumber(row.travel_fare).toLocaleString()}
                  </TableCell>
                  <TableCell align="right">{parseNumber(row.food).toLocaleString()}</TableCell>
                  <TableCell align="right">{parseNumber(row.lodging).toLocaleString()}</TableCell>
                  <TableCell align="right">{parseNumber(row.row_total).toLocaleString()}</TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      {(attachmentsByRow[index] || []).map((att) => (
                        <Link
                          key={att.id}
                          href={att.file_url}
                          target="_blank"
                          variant="caption"
                          noWrap
                          sx={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 150,
                          }}
                        >
                          {att.original_name}
                        </Link>
                      ))}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell colSpan={4} align="right">
                  <strong>Total</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>{parseNumber(travelExpense.total_travel_fare).toLocaleString()}</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>{parseNumber(travelExpense.total_food).toLocaleString()}</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>{parseNumber(travelExpense.total_lodging).toLocaleString()}</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>{parseNumber(travelExpense.grand_total).toLocaleString()}</strong>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          (please attach the supporting documents)
        </Typography>
      </Card>

      {travelExpense.note && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Note
          </Typography>
          <Typography variant="body1">{travelExpense.note}</Typography>
        </Card>
      )}

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Signatures
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            {renderSignatureBlock('prepared_received', SIGN_ROLES.prepared_received)}
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            {renderSignatureBlock('checked_by', SIGN_ROLES.checked_by)}
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            {renderSignatureBlock('accountant', SIGN_ROLES.accountant)}
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            {renderSignatureBlock('approved_by', SIGN_ROLES.approved_by)}
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
