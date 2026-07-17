'use client';

import { toast } from 'sonner';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import axiosInstance, { endpoints } from 'src/utils/axios';
import { getAmountInWords } from 'src/utils/amountInWords';

import { CONFIG } from 'src/config-global';

import { useAuthContext } from 'src/auth/hooks';

import { usePerdiumClaimApi } from './use-perdium-claim-api';

const EMPTY_FORM = {
  employee_name: '',
  designation: '',
  grade: 'H-1',
  area_type: '',
  purpose_of_travel: '',
  name_of_project: '',
  from_date: '',
  to_date: '',
  total_days: 0,
  breakfast_qty: 0,
  breakfast_unit_cost: 0,
  lunch_qty: 0,
  lunch_unit_cost: 0,
  dinner_qty: 0,
  dinner_unit_cost: 0,
  accommodation_qty: 0,
  accommodation_unit_cost: 0,
  others_qty: 0,
  others_unit_cost: 0,
  amount_in_words: '',
  remarks: '',
  prepared_by: '',
  reviewed_by: '',
  finance_by: '',
  approved_by: '',
};

const CLAIM_ITEMS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'accommodation', label: 'Accommodation' },
  { key: 'others', label: 'Others expenses' },
];

export default function PerdiumClaimForm({ claimId, readOnly, hideHeader }) {
  const { actions } = usePerdiumClaimApi();
  const { user } = useAuthContext();
  const [form, setForm] = useState(EMPTY_FORM);
  const [perdiumRates, setPerdiumRates] = useState({ high: [], low: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [claimDate, setClaimDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [rateError, setRateError] = useState('');
  const skipNextLookup = useRef(false);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);

  // Auto-fill prepared_by from logged-in user for new claims
  useEffect(() => {
    if (!claimId && user) {
      const name = user.name || user.displayName || user.email || '';
      setForm((prev) => ({ ...prev, prepared_by: name }));
    }
  }, [claimId, user]);

  // Fetch employees and projects for dropdowns
  useEffect(() => {
    axiosInstance
      .get(endpoints.employee.list)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setEmployees(list);
      })
      .catch(() => {});

    axiosInstance
      .get(endpoints.projects.projects)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setProjects(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (claimId) {
      setLoading(true);
      axiosInstance
        .get(endpoints.accounting.perdium_claim_by_id(claimId))
        .then((res) => {
          const d = res.data;
          setForm({
            employee_name: d.employee_name || '',
            designation: d.designation || '',
            grade: d.grade || 'H-1',
            area_type: d.area_type || '',
            purpose_of_travel: d.purpose_of_travel || '',
            name_of_project: d.name_of_project || '',
            from_date: d.from_date || '',
            to_date: d.to_date || '',
            total_days: Number(d.total_days) || 0,
            breakfast_qty: Number(d.breakfast_qty) || 0,
            breakfast_unit_cost: Number(d.breakfast_unit_cost) || 0,
            lunch_qty: Number(d.lunch_qty) || 0,
            lunch_unit_cost: Number(d.lunch_unit_cost) || 0,
            dinner_qty: Number(d.dinner_qty) || 0,
            dinner_unit_cost: Number(d.dinner_unit_cost) || 0,
            accommodation_qty: Number(d.accommodation_qty) || 0,
            accommodation_unit_cost: Number(d.accommodation_unit_cost) || 0,
            others_qty: Number(d.others_qty) || 0,
            others_unit_cost: Number(d.others_unit_cost) || 0,
            amount_in_words: d.amount_in_words || '',
            remarks: d.remarks || '',
            prepared_by: d.prepared_by || '',
            reviewed_by: d.reviewed_by || '',
            finance_by: d.finance_by || '',
            approved_by: d.approved_by || '',
          });
          if (d.date) setClaimDate(new Date(d.date).toLocaleDateString('en-GB'));
          // Existing claim already has saved unit costs — don't overwrite them on load
          skipNextLookup.current = true;
        })
        .catch(() => toast.error('Failed to load claim'))
        .finally(() => setLoading(false));
    }
  }, [claimId]);

  // Live rate lookup whenever Grade or Area Type changes
  useEffect(() => {
    if (readOnly) return;
    if (!form.grade || !form.area_type) return;
    if (skipNextLookup.current) {
      skipNextLookup.current = false;
      return;
    }
    let active = true;
    axiosInstance
      .get(endpoints.accounting.lookup, {
        params: { grade: form.grade, area_type: form.area_type },
      })
      .then((res) => {
        if (!active) return;
        const r = res.data;
        setForm((prev) => ({
          ...prev,
          breakfast_unit_cost: Number(r.breakfast) || 0,
          lunch_unit_cost: Number(r.lunch) || 0,
          dinner_unit_cost: Number(r.dinner) || 0,
          accommodation_unit_cost: Number(r.accommodation) || 0,
          others_unit_cost: Number(r.others_expenses) || 0,
        }));
        setRateError('');
      })
      .catch(() =>
        setRateError('No rate configured for this grade + area. Add it under Perdiem Rates.')
      );
    return () => {
      active = false;
    };
  }, [form.grade, form.area_type, readOnly]);

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: val };
      if (field === 'from_date' || field === 'to_date') {
        if (next.from_date && next.to_date) {
          const from = new Date(next.from_date);
          const to = new Date(next.to_date);
          const diff = Math.max(0, Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1);
          next.total_days = diff;
        }
      }
      return next;
    });
  };

  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    const found = employees.find(
      (emp) => emp.user?.id === employeeId || emp.employee_id === employeeId
    );
    if (found) {
      setForm((prev) => ({
        ...prev,
        employee_name: found.employee_name || '',
        designation: found.designation?.name || '',
      }));
    }
  };

  const handleNumChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: parseFloat(e.target.value) || 0 }));
  };

  const calcRowTotal = (prefix) => {
    const qty = Number(form[`${prefix}_qty`]) || 0;
    const cost = Number(form[`${prefix}_unit_cost`]) || 0;
    return qty * cost;
  };

  const grandTotal = useMemo(
    () => CLAIM_ITEMS.reduce((sum, { key }) => sum + calcRowTotal(key), 0),
    [
      form.breakfast_qty,
      form.breakfast_unit_cost,
      form.lunch_qty,
      form.lunch_unit_cost,
      form.dinner_qty,
      form.dinner_unit_cost,
      form.accommodation_qty,
      form.accommodation_unit_cost,
      form.others_qty,
      form.others_unit_cost,
    ]
  );

  // Auto-set amount in words whenever grandTotal changes
  useEffect(() => {
    if (readOnly) return;
    const next = getAmountInWords(grandTotal);
    setForm((prev) => {
      if (prev.amount_in_words !== next) return { ...prev, amount_in_words: next };
      return prev;
    });
  }, [grandTotal, readOnly]);

  const handleSave = async () => {
    if (!form.employee_name.trim()) {
      toast.error('Employee name is required');
      return;
    }
    console.log('SUBMITTING PAYLOAD:', form);
    setSaving(true);
    try {
      if (claimId) {
        await actions.updateClaim(claimId, form);
        toast.success('Claim updated successfully');
      } else {
        await actions.createClaim(form);
        toast.success('Claim submitted successfully');
      }
      try {
        window.close();
      } catch {
        /* ignore */
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to save claim');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = useCallback(() => {
    const baseUrl = (CONFIG.appDomainUrl || window.location.origin).replace(/\/+$/, '');
    const toNum = (v) => Number(v) || 0;

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
  <span class="f-lbl">Name:</span><span class="f-dot">${form.employee_name}</span>
  <span class="f-lbl">Designation:</span><span class="f-dot">${form.designation}</span>
  <span class="f-lbl">Grade:</span><span class="f-dot-sm">${form.grade}</span>
</div>
<div class="field-row"><span class="f-lbl">Purpose of Travel:</span><span class="f-dot">${form.purpose_of_travel}</span></div>
<div class="field-row"><span class="f-lbl">Name of Project:</span><span class="f-dot">${form.name_of_project}</span></div>
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
  <div class="from-field"><span class="f-lbl">From :</span><span class="from-fill">${form.from_date}</span></div>
  <div class="from-field"><span class="f-lbl">To :</span><span class="from-fill">${form.to_date}</span></div>
  <div class="from-field"><span class="f-lbl">Total days:</span><span class="from-fill">${form.total_days}</span></div>
</div>
<table class="sub-table">
  <thead><tr><th>Particular</th><th style="width:100px;">Quantity</th><th style="width:120px;">Unit cost (Taka)</th><th style="width:90px;">Total</th></tr></thead>
  <tbody>
    ${CLAIM_ITEMS.map(({ key, label }) => {
      const qty = toNum(form[`${key}_qty`]);
      const cost = toNum(form[`${key}_unit_cost`]);
      return `<tr><td>${label}</td><td>${qty}</td><td>${cost}</td><td>${qty * cost}</td></tr>`;
    }).join('')}
    <tr><td><strong>Total</strong></td><td></td><td></td><td><strong>${grandTotal}</strong></td></tr>
  </tbody>
</table>
<div class="inwards-row"><span class="f-lbl">In Wards:</span><span class="inwards-fill">${form.amount_in_words}</span></div>
<div class="footer-sigs">
  <span>Prepared by<br>${form.prepared_by || '______________'}</span>
  <span>Reviewed by<br>${form.reviewed_by || '______________'}</span>
  <span>Finance by<br>${form.finance_by || '______________'}</span>
  <span>Approved by<br>${form.approved_by || '______________'}</span>
</div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    win.addEventListener('load', () => {
      win.print();
      URL.revokeObjectURL(url);
    });
  }, [form, perdiumRates, grandTotal, claimDate]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {!hideHeader && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold">
            {readOnly
              ? 'Perdium Claim Details'
              : claimId
                ? 'Edit Perdium Claim'
                : 'New Perdium Claim'}
          </Typography>
          <Stack direction="row" spacing={1}>
            {readOnly && (
              <Button variant="contained" color="primary" onClick={handlePrint}>
                Print
              </Button>
            )}
            {!readOnly && (
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : claimId ? 'Update Claim' : 'Submit Claim'}
              </Button>
            )}
          </Stack>
        </Stack>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            sx={{ mb: 1 }}
          >
            <Typography variant="h5" fontWeight="bold">
              Daily Allowance and Perdiem Claim Sheet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Date: {claimDate}
            </Typography>
          </Stack>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}>
              {claimId || readOnly ? (
                <TextField label="Name" fullWidth value={form.employee_name} disabled />
              ) : (
                <TextField
                  select
                  label="Name"
                  fullWidth
                  value={
                    employees.find((e) => e.employee_name === form.employee_name)?.user?.id || ''
                  }
                  onChange={handleEmployeeChange}
                  helperText={!form.employee_name ? 'Select an employee' : ''}
                >
                  <MenuItem value="">
                    <em>Select employee</em>
                  </MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp.user?.id || emp.employee_id} value={emp.user?.id}>
                      {emp.employee_name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Designation" fullWidth value={form.designation} disabled />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Grade"
                fullWidth
                value={form.grade}
                onChange={handleChange('grade')}
                disabled={readOnly}
                SelectProps={{ native: true }}
              >
                <option value="H-1">H-1</option>
                <option value="C-G">C-G</option>
                <option value="A-B">A-B</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Area Type"
                fullWidth
                value={form.area_type}
                onChange={handleChange('area_type')}
                disabled={readOnly}
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
              >
                <option value="">Select area</option>
                <option value="high">High Expensive Area</option>
                <option value="low">Low Expensive Area</option>
              </TextField>
            </Grid>
            {rateError && (
              <Grid item xs={12}>
                <Alert severity="warning">{rateError}</Alert>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                label="Purpose of Travel"
                fullWidth
                value={form.purpose_of_travel}
                onChange={handleChange('purpose_of_travel')}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Name of Project"
                fullWidth
                value={form.name_of_project}
                onChange={handleChange('name_of_project')}
                disabled={readOnly}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">
                  <em>Select project</em>
                </MenuItem>
                {projects.map((proj) => (
                  <MenuItem key={proj.id} value={proj.name || proj.code}>
                    {proj.name || proj.code}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" align="center" sx={{ mb: 2 }}>
            Description of Submitted Perdiem:
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <TextField
                label="From"
                type="date"
                fullWidth
                value={form.from_date}
                onChange={handleChange('from_date')}
                disabled={readOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="To"
                type="date"
                fullWidth
                value={form.to_date}
                onChange={handleChange('to_date')}
                disabled={readOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Total days"
                type="number"
                fullWidth
                value={form.total_days}
                onChange={handleNumChange('total_days')}
                disabled={readOnly}
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Claimed Expenses:
          </Typography>
          <TableContainer sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.200' }}>Particular</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'grey.200' }}>
                    Quantity
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'grey.200' }}>
                    Unit cost (Taka)
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'grey.200' }}>
                    Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {CLAIM_ITEMS.map(({ key, label }) => (
                  <TableRow key={key}>
                    <TableCell>{label}</TableCell>
                    <TableCell align="right">
                      {readOnly ? (
                        (Number(form[`${key}_qty`]) || 0).toFixed(2)
                      ) : (
                        <TextField
                          type="number"
                          size="small"
                          value={form[`${key}_qty`]}
                          onChange={handleNumChange(`${key}_qty`)}
                          InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                          sx={{ width: 100 }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {(Number(form[`${key}_unit_cost`]) || 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {calcRowTotal(key).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {grandTotal.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <TextField
            label="Amount in Words"
            fullWidth
            value={form.amount_in_words}
            onChange={handleChange('amount_in_words')}
            disabled={readOnly}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Remarks"
            fullWidth
            multiline
            rows={2}
            value={form.remarks}
            onChange={handleChange('remarks')}
            disabled={readOnly}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Signatures
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                label="Prepared by"
                fullWidth
                value={form.prepared_by}
                disabled
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {!readOnly && (
        <Box sx={{ textAlign: 'right' }}>
          <Button variant="contained" size="large" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : claimId ? 'Update Claim' : 'Submit Claim'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
