'use client';

import { mutate } from 'swr';
import { useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
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
import { SIGN_ROLES } from 'src/constants/movementManagement';
import StatusChip from 'src/app/dashboard/movement-management/_components/StatusChip';
import SignatureDialog from 'src/app/dashboard/movement-management/_components/SignatureDialog';
import DeleteConfirmDialog from 'src/app/dashboard/movement-management/_components/DeleteConfirmDialog';
import {
  useGetRequest,
  useCreateMutation,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

const parseNumber = (val) => {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : 0;
};

export default function MovementDetail() {
  const params = useParams();
  const { id } = params;
  const router = useRouter();
  const { user } = useAuthContext();
  const [signLoading, setSignLoading] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signRole, setSignRole] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const deleteConfirm = useBoolean();

  const apiUrl = useMemo(() => endpoints.movementManagement.byId(id), [id]);
  const { data: movement, loading } = useGetRequest(apiUrl);

  const { trigger: signTrigger } = useCreateMutation(endpoints.movementManagement.sign(id));

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
      await deleteRequest(endpoints.movementManagement.byId(id));
      toast.success('Movement deleted successfully!');
      router.push('/dashboard/movement-management');
    } catch (error) {
      toast.error(error?.detail || error?.message || 'Failed to delete');
    } finally {
      setDeleteLoading(false);
      deleteConfirm.onFalse();
    }
  }, [id, router, deleteConfirm]);

  const handleTourPlanPrint = () => {
    if (!movement) return;
    const baseUrl = CONFIG.appDomainUrl.replace(/\/+$/, '');
    const m = movement;

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

    const scheduleRows = (m.schedule_rows || [])
      .map(
        (r) =>
          `<tr>
            <td class="tc">${r.sl || ''}</td>
            <td>${fmtDate(r.date)}</td>
            <td class="tl">${r.travel_route || ''}</td>
            <td class="tl">${r.description || ''}</td>
            <td class="tr">${fmtMoney(r.expense_travel)}</td>
            <td class="tr">${fmtMoney(r.expense_food)}</td>
            <td class="tr">${fmtMoney(r.expense_lodging)}</td>
            <td class="tr">${fmtMoney(r.expense_others)}</td>
          </tr>`
      )
      .join('');

    const emptyRows = Array(Math.max(0, 6 - (m.schedule_rows || []).length))
      .fill(0)
      .map(
        () =>
          '<tr><td style="height:20px;"></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>'
      )
      .join('');

    const sigImg = (sig) => {
      if (!sig) return '';
      const imgUrl = sig.signature_image;
      if (!imgUrl) return '';
      return `<img src="${imgUrl}" style="max-height:40px;max-width:140px;object-fit:contain;display:block;margin-top:4px;" />`;
    };

    const COPY_HTML = () => `
    <div class="copy">
      <div class="tour-hdr">
        <img class="tour-logo" src="${baseUrl}/icons/logo.png" alt="" onerror="this.style.display='none'">
        <div class="tour-org">
          <img class="tour-name" src="${baseUrl}/icons/name_img.png" alt="" onerror="this.style.display='none'">
          <div class="tour-web">www.ledars.org</div>
        </div>
      </div>
      <div class="tour-title">Tour Plan Schedule</div>

      <div class="field-row">
        <span class="f-lbl">Name:</span><span class="f-val">${m.name || ''}</span>
        <span class="f-lbl ml">Designation:</span><span class="f-val">${m.designation || ''}</span>
        <span class="f-lbl ml">Grade:</span><span class="f-val sm">${m.grade || ''}</span>
      </div>
      <div class="field-row"><span class="f-lbl">Purpose of travel:</span><span class="f-val">${m.purpose_of_travel || ''}</span></div>
      <div class="field-row"><span class="f-lbl">Name of the project:</span><span class="f-val">${Array.isArray(m.project_name) ? m.project_name.join(', ') : (m.project_name || '')}</span></div>

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
          ${scheduleRows || emptyRows}
          <tr>
            <td colspan="4" style="text-align:right;font-weight:700;padding-right:8px;">Subtotal</td>
            <td class="tr bold">${fmtMoney(m.subtotal_travel)}</td>
            <td class="tr bold">${fmtMoney(m.subtotal_food)}</td>
            <td class="tr bold">${fmtMoney(m.subtotal_lodging)}</td>
            <td class="tr bold">${fmtMoney(m.subtotal_others)}</td>
          </tr>
          <tr>
            <td colspan="4" style="text-align:right;font-weight:700;padding-right:8px;">Grand Total</td>
            <td colspan="4" class="tr bold">${fmtMoney(m.grand_total)}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer-sigs">
        <div class="sig-block">
          <span class="sig-lbl">Submitted By</span>
          ${sigImg(m.submitted_by_signature)}
          <span class="sig-name">${m.submitted_by_signature?.name || ''}</span>
        </div>
        <div class="sig-block">
          <span class="sig-lbl">Checked and Supervised By</span>
          ${sigImg(m.checked_supervised_signature)}
          <span class="sig-name">${m.checked_supervised_signature?.name || ''}</span>
        </div>
        <div class="sig-block">
          <span class="sig-lbl">Approved By</span>
          ${sigImg(m.approved_by_signature)}
          <span class="sig-name">${m.approved_by_signature?.name || ''}</span>
        </div>
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
    .tour-hdr { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; justify-content: center; }
    .tour-logo { width: 46px; height: 46px; object-fit: contain; }
    .tour-org { display: flex; flex-direction: column; align-items: center; }
    .tour-name { max-height: 36px; width: auto; object-fit: contain; }
    .tour-web { font-size: 9px; text-decoration: underline; color: #0000cc; margin-top: 1px; text-align: center; }
    .tour-title { text-align: center; font-size: 13px; font-weight: 700; text-decoration: underline; color: #cc0000; margin: 5px 0 7px; }
    .field-row { display: flex; align-items: baseline; gap: 3px; margin-bottom: 4px; }
    .f-lbl { font-weight: 400; white-space: nowrap; font-size: 10px; }
    .f-val { flex: 1; border-bottom: 1px dotted #555; min-height: 12px; padding-left: 3px; font-size: 10px; }
    .f-val.sm { max-width: 60px; flex: none; }
    .ml { margin-left: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px; }
    table th, table td { border: 1px solid #555; padding: 2px 4px; text-align: center; }
    table th { font-weight: 700; background: #e0e0e0; }
    .tl { text-align: left; } .tr { text-align: right; } .tc { text-align: center; } .bold { font-weight: 700; }
    .footer-sigs { display: flex; justify-content: space-between; font-size: 10px; padding-top: 5px; }
    .sig-block { text-align: center; min-width: 130px; }
    .sig-lbl { font-weight: 700; display: block; margin-bottom: 2px; }
    .sig-name { font-size: 9px; color: #444; }
    @media print { body { padding: 0; } @page { size: A4; margin: 0.8cm 1cm; } .copy { page-break-inside: avoid; } }
  </style></head><body>
  <div class="page-wrap">
    ${COPY_HTML()}
  
  </div>
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

  if (!movement) {
    return (
      <DashboardContent>
        <Typography variant="h6" sx={{ textAlign: 'center', py: 8 }}>
          Movement not found
        </Typography>
      </DashboardContent>
    );
  }

  const allSigned =
    movement.submitted_by_signature &&
    movement.checked_supervised_signature &&
    movement.approved_by_signature;

  const renderSignatureBlock = (role, label) => {
    const sigMap = {
      submitted_by: 'submitted_by_signature',
      checked_supervised: 'checked_supervised_signature',
      approved_by: 'approved_by_signature',
    };
    const sigData = movement[sigMap[role]];

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
            onClick={() => router.push('/dashboard/movement-management')}
          >
            Back
          </Button>
          <Typography variant="h4">Movement Detail</Typography>
          <StatusChip status={movement.status} />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:printer-bold" />}
            onClick={handleTourPlanPrint}
          >
            Print
          </Button>
          {movement.status === 'draft' && (
            <>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:pen-bold-duotone" />}
                onClick={() => router.push(`/dashboard/movement-management/create?editId=${id}`)}
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
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Name
            </Typography>
            <Typography variant="body1">{movement.name}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Designation
            </Typography>
            <Typography variant="body1">{movement.designation}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Grade
            </Typography>
            <Typography variant="body1">{movement.grade}</Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Purpose of Travel
            </Typography>
            <Typography variant="body1">{movement.purpose_of_travel}</Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Project
            </Typography>
            <Typography variant="body1">
              {Array.isArray(movement.project_name)
                ? movement.project_name.join(', ')
                : movement.project_name}
            </Typography>
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Movement Schedule
        </Typography>
        <Paper variant="outlined" sx={{ overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, textAlign: 'center' }}>
                  Sl
                </TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, textAlign: 'center' }}>
                  Date
                </TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, textAlign: 'center' }}>
                  Travel Route
                </TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, textAlign: 'center' }}>
                  Description
                </TableCell>
                <TableCell colSpan={4} align="center" sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>
                  Approx. Expenses
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Travel</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Food</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Lodging</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Others</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(movement.schedule_rows || []).map((row, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ textAlign: 'center' }}>{row.sl || index + 1}</TableCell>
                  <TableCell>{row.date ? fDate(row.date) : ''}</TableCell>
                  <TableCell>{row.travel_route}</TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell align="right">
                    {parseNumber(row.expense_travel).toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    {parseNumber(row.expense_food).toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    {parseNumber(row.expense_lodging).toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    {parseNumber(row.expense_others).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}

              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell colSpan={4} align="right">
                  <strong>Subtotal</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>{parseNumber(movement.subtotal_travel).toLocaleString()}</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>{parseNumber(movement.subtotal_food).toLocaleString()}</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>{parseNumber(movement.subtotal_lodging).toLocaleString()}</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>{parseNumber(movement.subtotal_others).toLocaleString()}</strong>
                </TableCell>
              </TableRow>

              <TableRow sx={{ bgcolor: 'grey.200' }}>
                <TableCell colSpan={4} align="right">
                  <strong>Grand Total</strong>
                </TableCell>
                <TableCell colSpan={4} align="right">
                  <strong>{parseNumber(movement.grand_total).toLocaleString()}</strong>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      </Card>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Signatures
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            {renderSignatureBlock('submitted_by', SIGN_ROLES.submitted_by)}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            {renderSignatureBlock('checked_supervised', SIGN_ROLES.checked_supervised)}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
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
