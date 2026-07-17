'use client';

import useSWR from 'swr';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';

// ---------------------------------------------------------------------------

function parseNotes(notes) {
  if (!notes) return {};
  try {
    const parsed = JSON.parse(notes);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function SummaryCard({ icon, color, bg, label, value }) {
  return (
    <Card sx={{ p: 2.5, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            bgcolor: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Iconify icon={icon} width={26} sx={{ color }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2} noWrap>
            {value || '—'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

function Field({ label, value, children }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.4 }}>
        {label}
      </Typography>
      {children || (
        <Typography variant="body2" fontWeight={600}>
          {value || '—'}
        </Typography>
      )}
    </Box>
  );
}

// ── EditField: onChange is passed straight to TextField, no wrapping ────────
function EditField({ label, value, onChange, multiline }) {
  return (
    <TextField
      label={label}
      fullWidth
      size="small"
      value={value ?? ''}
      onChange={onChange}
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
    />
  );
}

// ---------------------------------------------------------------------------

export default function MoneyReceiptDetailView({ receiptId }) {
  const { data, isLoading, mutate } = useSWR(
    receiptId ? endpoints.accounting.supplier_payment_by_id(receiptId) : null,
    fetcher
  );

  const [editMode, setEditMode] = useState(false);
  const [editExtra, setEditExtra] = useState(null);
  const [saving, setSaving] = useState(false);

  const extra = parseNotes(data?.notes);
  const isAuto = (data?.bill_refs?.length || 0) > 0;

  const items =
    extra?.items?.length > 0
      ? extra.items
      : data
        ? [{ description: 'Payment', quantity: 1, rate: parseFloat(data.amount || 0) }]
        : [];

  const totalAmount =
    items.reduce((s, i) => s + (i.quantity || 1) * (i.rate || 0), 0) ||
    parseFloat(data?.amount || 0);

  // ── shorthand: update a single field in editExtra ─────────────────────────
  const handleFieldChange = (field) => (e) =>
    setEditExtra((prev) => ({ ...prev, [field]: e.target.value }));

  const handleStartEdit = () => {
    setEditExtra({
      vendor_name: extra.vendor_name || data?.vendor_name || '',
      father_name: extra.father_name || '',
      address: extra.address || '',
      mobile: extra.mobile || '',
      type_of_goods: extra.type_of_goods || '',
      amount_in_words: extra.amount_in_words || '',
      payer_signature: extra.payer_signature || '',
      receiver_signature: extra.receiver_signature || '',
      items: extra.items?.length
        ? extra.items
        : [{ description: '', quantity: 1, rate: parseFloat(data?.amount || 0) }],
    });
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditExtra(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(endpoints.accounting.supplier_payment_by_id(receiptId), {
        notes: JSON.stringify(editExtra),
      });
      toast.success('Receipt updated successfully');
      await mutate();
      setEditMode(false);
      setEditExtra(null);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ── Bengali two-copy print ────────────────────────────────────────────────
  const handlePrint = useCallback(() => {
    if (!data) return;

    const baseUrl = (CONFIG.appDomainUrl || window.location.origin).replace(/\/+$/, '');
    const ex = extra;

    const MIN_ROWS = 8;
    const itemRows = items
      .map(
        (item) =>
          `<tr>
            <td style="height:20px;">${item.description || ''}</td>
            <td style="text-align:center;">${item.quantity ?? ''}</td>
            <td style="text-align:right;">${parseFloat(item.rate || 0).toFixed(2)}</td>
            <td style="text-align:right;">${((item.quantity || 1) * (item.rate || 0)).toFixed(2)}</td>
          </tr>`
      )
      .join('');

    const emptyRows = Array(Math.max(0, MIN_ROWS - items.length))
      .fill(0)
      .map(() => `<tr><td style="height:20px;"></td><td></td><td></td><td></td></tr>`)
      .join('');

    const COPY_HTML = () => `
      <div class="copy">
        <div class="mini-hdr">
          <img class="mini-logo" src="${baseUrl}/icons/logo.png" alt="" onerror="this.style.display='none'">
          <div class="mini-org">
            <img class="mini-name" src="${baseUrl}/icons/name_img.png" alt="" onerror="this.style.display='none'">
            <div class="mini-sub">প্রাপ্তি স্বীকার পত্র</div>
          </div>
        </div>
        <div class="receipt-no">রসিদ নং: ${data.number || data.payment_number || ''}</div>
        <div class="info-row">
          <div class="info-field">
            <span class="lbl">নামঃ</span>
            <span class="fill">${ex?.vendor_name || data.vendor_name || ''}</span>
          </div>
          <div class="info-field">
            <span class="lbl">পিতার নামঃ</span>
            <span class="fill">${ex?.father_name || ''}</span>
          </div>
        </div>
        <div class="info-row">
          <div class="info-field full">
            <span class="lbl">ঠিকানাঃ</span>
            <span class="fill">${ex?.address || ''}</span>
          </div>
        </div>
        <div class="info-row">
          <div class="info-field">
            <span class="lbl">মোবাইল নং-</span>
            <span class="fill">${ex?.mobile || ''}</span>
          </div>
        </div>
        <div class="info-row">
          <div class="info-field">
            <span class="lbl">পন্য/ সেবার ধরণঃ</span>
            <span class="fill">${ex?.type_of_goods || ''}</span>
          </div>
          <div class="info-field narrow">
            <span class="lbl">তারিখ:</span>
            <span class="fill">${data.date || ''}</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>বিবরণ</th>
              <th style="width:56px;">পরিমান</th>
              <th style="width:52px;">দর</th>
              <th style="width:64px;">টাকা</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
            ${emptyRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align:right; font-weight:700; padding:3px 5px;">মোট</td>
              <td style="text-align:right; font-weight:700; padding:3px 5px;">${totalAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="4" style="font-size:10px; padding:5px;">
                পন্য/সেবা মূল্য বাবদ &nbsp;<strong>${ex?.amount_in_words || '.. .. .. .. .. .. .. .. .. .. .. .. .. ..'}</strong>&nbsp; বুঝিয়া পাইলাম।
              </td>
            </tr>
          </tfoot>
        </table>
        <div class="sig-row">
          <div class="sig-block">
            <div class="sig-name">${ex?.payer_signature || ''}</div>
            <div class="sig-line">প্রদানকারীর স্বাক্ষর</div>
          </div>
          <div class="sig-block">
            <div class="sig-name">${ex?.receiver_signature || ''}</div>
            <div class="sig-line">গ্রহীতার স্বাক্ষর</div>
          </div>
        </div>
      </div>`;

    const html = `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8">
<title>প্রাপ্তি স্বীকার পত্র — ${data.number || data.payment_number || ''}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Noto Sans Bengali', Arial, sans-serif; font-size: 10px; color: #000; background: #fff; padding: 16px 20px; }
  .page-wrap { display: flex; gap: 14px; }
  .copy { flex: 1; border: 1px solid #999; padding: 10px; }
  .receipt-no { text-align: right; font-size: 10px; margin-bottom: 6px; font-weight: 600; }
  .mini-hdr { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
  .mini-logo { width: 44px; height: 44px; object-fit: contain; }
  .mini-org { display: flex; flex-direction: column; }
  .mini-name { max-height: 32px; width: auto; object-fit: contain; }
  .mini-sub { font-size: 11px; font-weight: 700; margin-top: 2px; }
  .info-row { display: flex; gap: 6px; margin-bottom: 4px; }
  .info-field { display: flex; align-items: baseline; flex: 1; gap: 2px; }
  .info-field.full { flex: 2; }
  .info-field.narrow { flex: 0 0 38%; }
  .lbl { font-size: 10px; font-weight: 700; white-space: nowrap; }
  .fill { flex: 1; border-bottom: 0.7px dotted #555; min-height: 14px; padding-left: 3px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 6px; font-size: 10px; }
  table th, table td { border: 0.7px solid #555; padding: 2px 4px; }
  table th { text-align: center; font-weight: 700; background: #f2f2f2; }
  tfoot td { font-size: 10px; }
  .sig-row { display: flex; justify-content: space-between; margin-top: 28px; }
  .sig-block { text-align: center; min-width: 100px; }
  .sig-name { font-weight: 700; min-height: 18px; margin-bottom: 4px; }
  .sig-line { font-size: 10px; font-weight: 700; border-top: 1px solid #000; padding-top: 3px; display: block; }
  @media print { body { padding: 0; } @page { size: A4 portrait; margin: 0.8cm 1cm; } }
</style></head><body>
<div class="page-wrap">
  ${COPY_HTML()}
</div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    win.addEventListener('load', () => {
      win.print();
      URL.revokeObjectURL(url);
    });
  }, [data, extra, items, totalAmount]);

  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Loading receipt...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Receipt not found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* ── Page header ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Money Receipt
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {data.number || data.payment_number}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {editMode ? (
            <>
              <Button variant="outlined" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="solar:pen-bold" />}
                onClick={handleStartEdit}
              >
                Edit
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:printer-bold" />}
                onClick={handlePrint}
              >
                Print
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {/* ── 4 summary cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            icon="solar:receipt-bold-duotone"
            color="#3b82f6"
            bg="#eff6ff"
            label="Receipt No."
            value={data.number || data.payment_number}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            icon="solar:buildings-2-bold-duotone"
            color="#6366f1"
            bg="#f5f3ff"
            label="Vendor"
            value={editMode ? editExtra?.vendor_name : extra.vendor_name || data.vendor_name}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            icon="solar:dollar-minimalistic-bold-duotone"
            color="#10b981"
            bg="#f0fdf4"
            label="Total Amount"
            value={`৳${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            icon="solar:calendar-bold-duotone"
            color="#f59e0b"
            bg="#fffbeb"
            label="Date"
            value={data.date}
          />
        </Grid>
      </Grid>

      {/* ── Two-column section: Recipient | Payment ── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Left — Recipient details */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card
            sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: 3, height: '100%' }}
          >
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>
                Recipient Details
              </Typography>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {editMode ? (
                    <EditField
                      label="Name"
                      value={editExtra.vendor_name}
                      onChange={handleFieldChange('vendor_name')}
                    />
                  ) : (
                    <Field label="Name" value={extra.vendor_name || data.vendor_name} />
                  )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  {editMode ? (
                    <EditField
                      label="Father's Name"
                      value={editExtra.father_name}
                      onChange={handleFieldChange('father_name')}
                    />
                  ) : (
                    <Field label="Father's Name" value={extra.father_name} />
                  )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  {editMode ? (
                    <EditField
                      label="Mobile No."
                      value={editExtra.mobile}
                      onChange={handleFieldChange('mobile')}
                    />
                  ) : (
                    <Field label="Mobile No." value={extra.mobile} />
                  )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  {editMode ? (
                    <EditField
                      label="Type of Goods / Service"
                      value={editExtra.type_of_goods}
                      onChange={handleFieldChange('type_of_goods')}
                    />
                  ) : (
                    <Field label="Type of Goods / Service" value={extra.type_of_goods} />
                  )}
                </Grid>

                <Grid size={{ xs: 12 }}>
                  {editMode ? (
                    <EditField
                      label="Address"
                      value={editExtra.address}
                      onChange={handleFieldChange('address')}
                      multiline
                    />
                  ) : (
                    <Field label="Address" value={extra.address} />
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right — Payment details (read-only, not part of editable extra) */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card
            sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: 3, height: '100%' }}
          >
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>
                Payment Details
              </Typography>
              <Stack spacing={2.5}>
                <Field label="Payment Method" value={data.method} />
                <Field label="Receipt Type">
                  <Box>
                    <Chip
                      size="small"
                      label={isAuto ? 'Auto Generated' : 'Manual'}
                      color={isAuto ? 'info' : 'default'}
                      variant="soft"
                    />
                  </Box>
                </Field>
                {isAuto && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mb: 0.75 }}
                    >
                      Bill References
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                      {data.bill_refs.map((b) => (
                        <Chip key={b} label={b} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Items table (display only) ── */}
      <Card
        sx={{
          mb: 3,
          border: '1px solid #e5e7eb',
          boxShadow: 'none',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, borderBottom: '1px solid #e5e7eb' }}>
          <Typography variant="h6" fontWeight={700}>
            Items
          </Typography>
        </Box>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Quantity
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Rate (৳)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Amount (৳)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={idx} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {idx + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.description || '—'}</TableCell>
                  <TableCell align="center">{item.quantity}</TableCell>
                  <TableCell align="center">
                    ৳
                    {parseFloat(item.rate || 0).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    ৳
                    {((item.quantity || 1) * (item.rate || 0)).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell colSpan={4} align="right" sx={{ fontWeight: 700, borderBottom: 0 }}>
                  Total
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, borderBottom: 0 }}>
                  ৳{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ── Signatures ── */}
      <Card sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>
            Signatures &amp; Acknowledgement
          </Typography>

          {/* Amount in words */}
          <Box sx={{ mb: 3 }}>
            {editMode ? (
              <EditField
                label="Amount in Words"
                value={editExtra.amount_in_words}
                onChange={handleFieldChange('amount_in_words')}
              />
            ) : (
              <Field label="Amount in Words" value={extra.amount_in_words} />
            )}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Signature blocks */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              {editMode ? (
                <EditField
                  label="Payer's Signature / Name"
                  value={editExtra.payer_signature}
                  onChange={handleFieldChange('payer_signature')}
                />
              ) : (
                <Box
                  sx={{
                    textAlign: 'center',
                    pt: 4,
                    borderTop: '2px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body1" fontWeight={700} sx={{ mb: 0.5 }}>
                    {extra.payer_signature || '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Payer&apos;s Signature
                  </Typography>
                </Box>
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              {editMode ? (
                <EditField
                  label="Receiver's Signature / Name"
                  value={editExtra.receiver_signature}
                  onChange={handleFieldChange('receiver_signature')}
                />
              ) : (
                <Box
                  sx={{
                    textAlign: 'center',
                    pt: 4,
                    borderTop: '2px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body1" fontWeight={700} sx={{ mb: 0.5 }}>
                    {extra.receiver_signature || '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Receiver&apos;s Signature
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>

          {editMode && (
            <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
