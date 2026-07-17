'use client';

import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Grid,
  Paper,
  Stack,
  Alert,
  Table,
  Button,
  Divider,
  Skeleton,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  IconButton,
  CardContent,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { useAuthContext } from 'src/auth/hooks';

import { usePerdiumClaimApi } from '../../../_components/configuration/use-perdium-claim-api';
import PerdiumSignatureDialog from '../../../_components/configuration/perdium-signature-dialog';

const STATUS_LABEL = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
};

const STATUS_COLOR = {
  draft: 'default',
  submitted: 'info',
  approved: 'success',
  rejected: 'error',
};

const CLAIM_ITEMS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'accommodation', label: 'Accommodation' },
  { key: 'others', label: 'Others expenses' },
];

const toNum = (v) => Number(v) || 0;

// ── Small helpers ─────────────────────────────────────────────────────────────

function getFullUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = (CONFIG.serverUrl || '').replace(/\/+$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

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

export default function PerdiumDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const confirm = useBoolean();
  const { actions } = usePerdiumClaimApi();
  const { user } = useAuthContext();

  const [claim, setClaim] = useState(null);
  const [perdiumRates, setPerdiumRates] = useState({ high: [], low: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signLoading, setSignLoading] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signRole, setSignRole] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axiosInstance
      .get(endpoints.accounting.perdium_claim_by_id(id))
      .then((res) => setClaim(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    axiosInstance
      .get(endpoints.accounting.perdium)
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.results)
            ? res.data.results
            : [];
        setPerdiumRates({
          high: list.filter((p) => p.area_type === 'high'),
          low: list.filter((p) => p.area_type === 'low'),
        });
      })
      .catch(() => {});
  }, [id]);

  const calcRowTotal = useCallback(
    (prefix) => toNum(claim?.[`${prefix}_qty`]) * toNum(claim?.[`${prefix}_unit_cost`]),
    [claim]
  );

  const grandTotal = useMemo(
    () => (claim ? CLAIM_ITEMS.reduce((sum, { key }) => sum + calcRowTotal(key), 0) : 0),
    [claim, calcRowTotal]
  );

  // Fetch employee data for signature image
  const [employeeData, setEmployeeData] = useState(null);
  useEffect(() => {
    if (user?.id) {
      axiosInstance
        .get(endpoints.employee.details(user.id))
        .then((res) => setEmployeeData(res.data))
        .catch(() => {});
    }
  }, [user?.id]);

  const handleSignOpen = (role) => {
    setSignRole(role);
    setSignDialogOpen(true);
  };

  const handleSignConfirm = async () => {
    if (!signRole) return;
    setSignLoading(true);
    try {
      await axiosInstance.post(endpoints.accounting.perdium_claim_sign(id), {
        role: signRole,
        confirmed: true,
      });
      toast.success(`Signed as ${signRole.replace('_', ' ')}`);
      setSignDialogOpen(false);
      setSignRole(null);
      // Refresh claim data
      const res = await axiosInstance.get(endpoints.accounting.perdium_claim_by_id(id));
      setClaim(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to sign');
    } finally {
      setSignLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await actions.deleteClaim(id);
      toast.success('Claim deleted successfully');
      router.push(paths.dashboard.accountingFinance.configuration.perdium);
    } catch {
      toast.error('Failed to delete claim.');
    } finally {
      setDeleting(false);
      confirm.onFalse();
    }
  };

  const handlePrint = useCallback(() => {
    if (!claim) return;
    const baseUrl = (CONFIG.appDomainUrl || window.location.origin).replace(/\/+$/, '');
    const claimDate = claim.date ? new Date(claim.date).toLocaleDateString('en-GB') : '';

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Daily Allowance and Perdiem Claim Sheet</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #000; background: #fff; padding: 18px 28px; }
  .hdr { display: flex; justify-content: flex-end; align-items: flex-start; margin-bottom: 6px; }
  .hdr-right { display: flex; flex-direction: column; align-items: center; }
  .hdr-logo { width: 52px; height: 52px; object-fit: contain; }
  .hdr-name-img { max-height: 42px; width: auto; object-fit: contain; margin-top: 2px; }
  .hdr-addr { font-size: 9px; text-align: center; margin-top: 3px; line-height: 1.5; }
  .form-title { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
  .date-row { text-align: right; font-size: 11px; margin-bottom: 6px; }
  .date-fill { display: inline-block; width: 140px; border-bottom: 1px dotted #555; }
  .field-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 5px; }
  .f-lbl { font-weight: 400; white-space: nowrap; }
  .f-dot { flex: 1; border-bottom: 1px dotted #555; min-height: 13px; }
  .f-dot-sm { width: 100px; border-bottom: 1px dotted #555; min-height: 13px; }
  .sec-title { font-size: 11px; font-weight: 400; margin-bottom: 4px; }
  .bill-wrap { text-align: center; margin: 10px 0 6px; }
  .bill-pill { display: inline-block; border: 2px solid #000; border-radius: 6px; padding: 4px 22px; font-size: 13px; font-weight: 700; }
  table { border-collapse: collapse; font-size: 10.5px; margin-bottom: 8px; }
  table th, table td { border: 1px solid #555; padding: 3px 6px; text-align: center; }
  table th { font-weight: 700; background: #e0e0e0; }
  .rate-table { width: 100%; }
  .accom-table { width: 60%; }
  .submitted-title { font-size: 14px; font-weight: 700; text-align: center; margin: 10px 0 6px; }
  .from-row { display: flex; gap: 24px; margin-bottom: 6px; }
  .from-field { display: flex; gap: 4px; align-items: baseline; }
  .from-fill { width: 110px; border-bottom: 1px dotted #555; }
  .sub-table { width: 100%; }
  .inwards-row { display: flex; gap: 4px; align-items: baseline; margin: 6px 0 14px; }
  .inwards-fill { flex: 1; border-bottom: 1px dotted #555; }
  .footer-sigs { display: flex; justify-content: space-between; font-size: 11px; padding-top: 6px; }
  @media print { body { padding: 0; } @page { size: A4; margin: 1cm 1.2cm; } }
</style></head><body>
<div class="hdr">
  <div class="hdr-right">
    <img class="hdr-logo" src="${baseUrl}/icons/logo.png" alt="" onerror="this.style.display='none'">
    <img class="hdr-name-img" src="${baseUrl}/icons/name_img.png" alt="" onerror="this.style.display='none'">
    <div class="hdr-addr">Local Environment Development and Agricultural Research Society<br>Head Office: Village: Munshigonj, Post Office: Kadamtala,<br>Upazila: Shyamnagar, District: Satkhira, Bangladesh.</div>
  </div>
</div>
<div class="form-title">Daily Allowance and Perdiem Claim Sheet</div>
<div class="date-row">Date: <span class="date-fill">${claimDate}</span></div>
<div class="field-row">
  <span class="f-lbl">Name:</span><span class="f-dot">${claim.employee_name || ''}</span>
  <span class="f-lbl">Designation:</span><span class="f-dot">${claim.designation || ''}</span>
  <span class="f-lbl">Grade:</span><span class="f-dot-sm">${claim.grade || ''}</span>
</div>
<div class="field-row"><span class="f-lbl">Purpose of Travel:</span><span class="f-dot">${claim.purpose_of_travel || ''}</span></div>
<div class="field-row"><span class="f-lbl">Name of Project:</span><span class="f-dot">${claim.name_of_project || ''}</span></div>
<div class="bill-wrap"><span class="bill-pill">Perdiem Bill</span></div>
<div class="sec-title">Perdiem Description : (Human Resource management Manual 3.18 &amp; 3.19)</div>
<div class="sec-title">High Expensive Area :</div>
<table class="rate-table">
  <thead><tr><th>Grade</th><th>Breakfast</th><th>Lunch</th><th>Dinner</th><th>Others expenses</th><th>Total</th></tr></thead>
  <tbody>
    ${['H-1', 'C-G', 'A-B']
      .map((g) => {
        const r = perdiumRates.high.find((p) => p.grade === g);
        const b = toNum(r?.breakfast);
        const l = toNum(r?.lunch);
        const d = toNum(r?.dinner);
        const o = toNum(r?.others_expenses);
        return `<tr><td>${g}</td><td>${b}</td><td>${l}</td><td>${d}</td><td>${o}</td><td>${b + l + d + o}</td></tr>`;
      })
      .join('')}
  </tbody>
</table>
<div class="sec-title">Low expensive area :</div>
<table class="rate-table">
  <thead><tr><th>Grade</th><th>Breakfast</th><th>Lunch</th><th>Dinner</th><th>Others expenses</th><th>Total</th></tr></thead>
  <tbody>
    ${['H-1', 'C-G', 'A-B']
      .map((g) => {
        const r = perdiumRates.low.find((p) => p.grade === g);
        const b = toNum(r?.breakfast);
        const l = toNum(r?.lunch);
        const d = toNum(r?.dinner);
        const o = toNum(r?.others_expenses);
        return `<tr><td>${g}</td><td>${b}</td><td>${l}</td><td>${d}</td><td>${o}</td><td>${b + l + d + o}</td></tr>`;
      })
      .join('')}
  </tbody>
</table>
<div class="sec-title">Accommodation :</div>
<table class="accom-table">
  <thead><tr><th>Status</th><th>High expensive area</th><th>Low expensive area</th></tr></thead>
  <tbody>
    ${['H-1', 'C-G', 'A-B']
      .map((g) => {
        const h = toNum(perdiumRates.high.find((p) => p.grade === g)?.accommodation);
        const l = toNum(perdiumRates.low.find((p) => p.grade === g)?.accommodation);
        return `<tr><td>${g}</td><td>${h}</td><td>${l}</td></tr>`;
      })
      .join('')}
  </tbody>
</table>
<div class="submitted-title">Description of Submitted Perdiem :</div>
<div class="from-row">
  <div class="from-field"><span class="f-lbl">From :</span><span class="from-fill">${claim.from_date || ''}</span></div>
  <div class="from-field"><span class="f-lbl">To :</span><span class="from-fill">${claim.to_date || ''}</span></div>
  <div class="from-field"><span class="f-lbl">Total days:</span><span class="from-fill">${claim.total_days || ''}</span></div>
</div>
<table class="sub-table">
  <thead><tr><th>Particular</th><th style="width:100px;">Quantity</th><th style="width:120px;">Unit cost (Taka)</th><th style="width:90px;">Total</th></tr></thead>
  <tbody>
    ${CLAIM_ITEMS.map(({ key, label }) => {
      const qty = toNum(claim[`${key}_qty`]);
      const cost = toNum(claim[`${key}_unit_cost`]);
      return `<tr><td>${label}</td><td>${qty}</td><td>${cost}</td><td>${qty * cost}</td></tr>`;
    }).join('')}
    <tr><td><strong>Total</strong></td><td></td><td></td><td><strong>${grandTotal}</strong></td></tr>
  </tbody>
</table>
<div class="inwards-row"><span class="f-lbl">In Wards:</span><span class="inwards-fill">${claim.amount_in_words || ''}</span></div>
<div class="footer-sigs">
  <span>Prepared by<br>${claim.prepared_by || '______________'}</span>
  <span>Reviewed by<br>${claim.reviewed_by || '______________'}</span>
  <span>Finance by<br>${claim.finance_by || '______________'}</span>
  <span>Approved by<br>${claim.approved_by || '______________'}</span>
</div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      toast.error('Please allow popups for this website to print.');
      return;
    }
    win.addEventListener('load', () => {
      win.print();
      URL.revokeObjectURL(url);
    });
  }, [claim, perdiumRates, grandTotal]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={88} sx={{ borderRadius: 2, mb: 2 }} />
        <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (!claim || error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Perdium claim not found or an error occurred.
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
              href={paths.dashboard.accountingFinance.configuration.perdium}
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
                  {claim.employee_name || 'Unknown Employee'}
                </Typography>
                {claim.status && (
                  <Label variant="soft" color={STATUS_COLOR[claim.status] || 'default'}>
                    {STATUS_LABEL[claim.status] || claim.status}
                  </Label>
                )}
              </Stack>
              <Stack direction="row" spacing={2.5} flexWrap="wrap">
                <Typography variant="caption" color="text.secondary">
                  {claim.designation}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ৳
                  {parseFloat(grandTotal || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </Typography>
                {claim.from_date && claim.to_date && (
                  <Typography variant="caption" color="text.secondary">
                    {claim.from_date} – {claim.to_date}
                  </Typography>
                )}
              </Stack>
            </Box>

            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="solar:pen-bold" width={16} />}
              onClick={() =>
                window.open(
                  `${paths.dashboard.accountingFinance.configuration.perdium}/${id}/edit`,
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
          {/* Section 1: Basic Info */}
          <SectionTitle>Basic Information</SectionTitle>
          <Grid container spacing={0} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }} sx={{ pr: { md: 3 } }}>
              <DetailRow label="Employee Name" value={claim.employee_name} />
              <DetailRow label="Designation" value={claim.designation} />
              <DetailRow label="Grade" value={claim.grade} />
            </Grid>
            <Grid
              size={{ xs: 12, md: 6 }}
              sx={{
                pl: { md: 3 },
                borderLeft: { md: '1px solid' },
                borderColor: { md: 'divider' },
              }}
            >
              <DetailRow label="Purpose of Travel" value={claim.purpose_of_travel} />
              <DetailRow label="Project" value={claim.name_of_project} />
            </Grid>
          </Grid>

          {/* Section 2: Travel Details */}
          <SectionTitle>Travel Details</SectionTitle>
          <Grid container spacing={0} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }} sx={{ pr: { md: 3 } }}>
              <DetailRow label="From Date" value={claim.from_date} />
              <DetailRow label="To Date" value={claim.to_date} />
            </Grid>
            <Grid
              size={{ xs: 12, md: 6 }}
              sx={{
                pl: { md: 3 },
                borderLeft: { md: '1px solid' },
                borderColor: { md: 'divider' },
              }}
            >
              <DetailRow label="Total Days" value={claim.total_days} />
              <DetailRow
                label="Grand Total"
                value={`৳${parseFloat(grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              />
            </Grid>
          </Grid>

          {/* Section 3: Claimed Expenses */}
          <SectionTitle>Claimed Expenses</SectionTitle>
          <Card
            variant="outlined"
            sx={{ borderRadius: 2, border: '1px solid #e5e7eb', mb: 3, overflow: 'hidden' }}
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Particular</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Quantity
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Unit Cost (Taka)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Total
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {CLAIM_ITEMS.map(({ key, label }) => (
                    <TableRow key={key}>
                      <TableCell>{label}</TableCell>
                      <TableCell align="right">{toNum(claim[`${key}_qty`]).toFixed(2)}</TableCell>
                      <TableCell align="right">
                        {toNum(claim[`${key}_unit_cost`]).toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {calcRowTotal(key).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {grandTotal.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {claim.amount_in_words && (
            <>
              <SectionTitle>Amount in Words</SectionTitle>
              <Typography variant="body2" sx={{ mb: 3 }}>
                {claim.amount_in_words}
              </Typography>
            </>
          )}

          {claim.remarks && (
            <>
              <SectionTitle>Remarks</SectionTitle>
              <Typography variant="body2" sx={{ mb: 3 }}>
                {claim.remarks}
              </Typography>
            </>
          )}

          {/* Section 4: Signatures */}
          <SectionTitle>Signatures</SectionTitle>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              {claim.prepared_by_signature ? (
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Prepared By
                  </Typography>
                  {claim.prepared_by_signature.signature_image && (
                    <Box
                      component="img"
                      src={getFullUrl(claim.prepared_by_signature.signature_image)}
                      alt="Prepared by signature"
                      sx={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain', my: 1 }}
                    />
                  )}
                  <Typography variant="body2" fontWeight={600}>
                    {claim.prepared_by_signature.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {claim.prepared_by_signature.signed_at
                      ? new Date(claim.prepared_by_signature.signed_at).toLocaleDateString()
                      : ''}
                  </Typography>
                </Paper>
              ) : (
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Prepared By
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: 'italic', mb: 1 }}
                  >
                    {claim.prepared_by || 'Not set'}
                  </Typography>
                </Paper>
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              {claim.reviewed_by_signature ? (
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Reviewed By
                  </Typography>
                  {claim.reviewed_by_signature.signature_image && (
                    <Box
                      component="img"
                      src={getFullUrl(claim.reviewed_by_signature.signature_image)}
                      alt="Reviewed by signature"
                      sx={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain', my: 1 }}
                    />
                  )}
                  <Typography variant="body2" fontWeight={600}>
                    {claim.reviewed_by_signature.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {claim.reviewed_by_signature.signed_at
                      ? new Date(claim.reviewed_by_signature.signed_at).toLocaleDateString()
                      : ''}
                  </Typography>
                </Paper>
              ) : (
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Reviewed By
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Iconify icon="solar:pen-bold-duotone" width={16} />}
                    onClick={() => handleSignOpen('reviewed_by')}
                    sx={{ mt: 1 }}
                  >
                    Click to Sign
                  </Button>
                </Paper>
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              {claim.finance_by_signature ? (
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Finance By
                  </Typography>
                  {claim.finance_by_signature.signature_image && (
                    <Box
                      component="img"
                      src={getFullUrl(claim.finance_by_signature.signature_image)}
                      alt="Finance by signature"
                      sx={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain', my: 1 }}
                    />
                  )}
                  <Typography variant="body2" fontWeight={600}>
                    {claim.finance_by_signature.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {claim.finance_by_signature.signed_at
                      ? new Date(claim.finance_by_signature.signed_at).toLocaleDateString()
                      : ''}
                  </Typography>
                </Paper>
              ) : (
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Finance By
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Iconify icon="solar:pen-bold-duotone" width={16} />}
                    onClick={() => handleSignOpen('finance_by')}
                    sx={{ mt: 1 }}
                  >
                    Click to Sign
                  </Button>
                </Paper>
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              {claim.approved_by_signature ? (
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Approved By
                  </Typography>
                  {claim.approved_by_signature.signature_image && (
                    <Box
                      component="img"
                      src={getFullUrl(claim.approved_by_signature.signature_image)}
                      alt="Approved by signature"
                      sx={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain', my: 1 }}
                    />
                  )}
                  <Typography variant="body2" fontWeight={600}>
                    {claim.approved_by_signature.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {claim.approved_by_signature.signed_at
                      ? new Date(claim.approved_by_signature.signed_at).toLocaleDateString()
                      : ''}
                  </Typography>
                </Paper>
              ) : (
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Approved By
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Iconify icon="solar:pen-bold-duotone" width={16} />}
                    onClick={() => handleSignOpen('approved_by')}
                    sx={{ mt: 1 }}
                  >
                    Click to Sign
                  </Button>
                </Paper>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Perdium Claim"
        content="Are you sure you want to delete this claim record? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        }
      />

      <PerdiumSignatureDialog
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
    </Box>
  );
}
