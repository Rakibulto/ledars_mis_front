'use client';

import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { useRef, useMemo, useState, useEffect } from 'react';

import {
  Box,
  Card,
  Grid,
  Stack,
  Radio,
  Button,
  Select,
  Divider,
  MenuItem,
  TextField,
  Typography,
  InputLabel,
  IconButton,
  RadioGroup,
  FormControl,
  Autocomplete,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';
import { useGetAdvance, updateAdvance } from 'src/actions/advances';

import { Iconify } from 'src/components/iconify';

// ── Constants ─────────────────────────────────────────────────────────────────

const CAUSE_OPTIONS = [
  { value: 'Field Work', label: 'Field Work' },
  { value: 'Training', label: 'Training' },
  { value: 'Procurement', label: 'Procurement' },
  { value: 'Travel', label: 'Travel' },
  { value: 'Emergency', label: 'Emergency' },
  { value: 'Other', label: 'Other' },
];

const CHECKLIST_ITEMS = [
  {
    stateKey: 'check_outstanding',
    label: 'Is there any outstanding refundable advance against the mentioned employee?',
  },
  {
    stateKey: 'check_adjusted',
    label: 'If any advance was taken in the past, was it adjusted/settled timely?',
  },
  {
    stateKey: 'check_completed',
    label: 'Was the work for which the past advance was taken completed properly?',
  },
];

function numberToWords(amount) {
  if (!amount || Number.isNaN(Number(amount))) return '';
  const num = parseFloat(amount);
  if (num === 0) return 'Zero Taka Only';

  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tensArr = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  function below1000(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tensArr[Math.floor(n / 10)] + (n % 10 ? ` ${ones[n % 10]}` : '');
    return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${below1000(n % 100)}` : ''}`;
  }

  function toWords(n) {
    if (n === 0) return 'Zero';
    let words = '';
    let rem = n;
    const crore = Math.floor(rem / 10000000);
    if (crore) {
      words += `${below1000(crore)} Crore `;
      rem %= 10000000;
    }
    const lakh = Math.floor(rem / 100000);
    if (lakh) {
      words += `${below1000(lakh)} Lakh `;
      rem %= 100000;
    }
    const thousand = Math.floor(rem / 1000);
    if (thousand) {
      words += `${below1000(thousand)} Thousand `;
      rem %= 1000;
    }
    if (rem) words += below1000(rem);
    return words.trim();
  }

  const takaPart = Math.floor(num);
  const paisaPart = Math.round((num - takaPart) * 100);
  let result = '';
  if (takaPart > 0) result = `${toWords(takaPart)} Taka`;
  if (paisaPart > 0) result += `${result ? ' and ' : ''}${toWords(paisaPart)} Paisa`;
  return `${result || 'Zero Taka'} Only`;
}

function resolveUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_HOST_API || 'http://127.0.0.1:8000'}${url}`;
}

// ── Signature Upload ──────────────────────────────────────────────────────────

function SignatureUpload({ label, file, preview, onFileChange }) {
  const handleChange = (e) => {
    const f = e.target.files?.[0];
    if (f) onFileChange(f, URL.createObjectURL(f));
  };

  return (
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

      {preview ? (
        <Box
          component="img"
          src={preview}
          alt={label}
          sx={{
            maxHeight: 90,
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
            height: 70,
            border: '2px dashed #d1d5db',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          <Iconify icon="solar:pen-bold" width={24} sx={{ color: 'text.disabled' }} />
        </Box>
      )}

      <Stack alignItems="center" spacing={0.5} sx={{ width: '100%' }}>
        <Button
          component="label"
          variant="outlined"
          size="small"
          startIcon={<Iconify icon="solar:upload-bold" width={15} />}
          sx={{ fontSize: 12, width: '100%' }}
        >
          {file ? 'Change' : 'Upload'}
          <input type="file" hidden accept="image/*" onChange={handleChange} />
        </Button>
        {file && (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 150 }}>
            {file.name}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

// ── Checklist Row ─────────────────────────────────────────────────────────────

function ChecklistRow({ label, value, onChange }) {
  return (
    <Stack
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
      <Stack direction="row" spacing={0.75}>
        <IconButton
          size="small"
          onClick={() => onChange(value === 'tick' ? null : 'tick')}
          sx={{
            color: value === 'tick' ? 'success.main' : 'text.disabled',
            bgcolor: value === 'tick' ? 'success.lighter' : 'transparent',
            border: '1px solid',
            borderColor: value === 'tick' ? 'success.main' : '#e5e7eb',
            borderRadius: 1.5,
            width: 38,
            height: 38,
          }}
        >
          <Iconify icon="solar:check-circle-bold" width={20} />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onChange(value === 'cross' ? null : 'cross')}
          sx={{
            color: value === 'cross' ? 'error.main' : 'text.disabled',
            bgcolor: value === 'cross' ? 'error.lighter' : 'transparent',
            border: '1px solid',
            borderColor: value === 'cross' ? 'error.main' : '#e5e7eb',
            borderRadius: 1.5,
            width: 38,
            height: 38,
          }}
        >
          <Iconify icon="solar:close-circle-bold" width={20} />
        </IconButton>
      </Stack>
    </Stack>
  );
}

function CardSectionHeader({ title, subtitle }) {
  return (
    <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #e5e7eb', bgcolor: '#f9fafb' }}>
      <Typography variant="h6" fontWeight={600}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function EditAdvanceView() {
  const { id } = useParams();
  const [submitting, setSubmitting] = useState(false);
  const hydratedRef = useRef(false);

  const { advance, advanceLoading } = useGetAdvance(id);

  // ── Form state ────────────────────────────────────────────────────────────
  const [fromEmployee, setFromEmployee] = useState(null);
  const [requesterEmployee, setRequesterEmployee] = useState(null);
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [project, setProject] = useState(null);
  const [causeOfAdvance, setCauseOfAdvance] = useState('');
  const [advanceReceivableDate, setAdvanceReceivableDate] = useState('');
  const [advanceReceivableAmount, setAdvanceReceivableAmount] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [receiveMedium, setReceiveMedium] = useState('direct');
  const [bankName, setBankName] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [accountantRemarks, setAccountantRemarks] = useState('');
  const [checkOutstanding, setCheckOutstanding] = useState(null);
  const [checkAdjusted, setCheckAdjusted] = useState(null);
  const [checkCompleted, setCheckCompleted] = useState(null);
  const [sigRecipient, setSigRecipient] = useState({ file: null, preview: null });
  const [sigAccountant, setSigAccountant] = useState({ file: null, preview: null });
  const [sigRecommender, setSigRecommender] = useState({ file: null, preview: null });
  const [sigApprover, setSigApprover] = useState({ file: null, preview: null });

  // ── Data fetching ─────────────────────────────────────────────────────────
  const { data: usersData } = useGetRequest(endpoints.auth.create);
  const { data: projectsData } = useGetRequest(endpoints.projectManagementsProjects);

  const employees = useMemo(() => {
    const raw = Array.isArray(usersData) ? usersData : usersData?.results || [];
    return raw
      .filter((item) => item?.id)
      .map((item) => ({
        id: item.id,
        username: item.username,
      }));
  }, [usersData]);

  const projects = useMemo(() => {
    const raw = Array.isArray(projectsData) ? projectsData : projectsData?.results || [];
    return raw.map((p) => ({ id: p.id, title: p.title || p.name || `Project ${p.id}` }));
  }, [projectsData]);

  // ── Hydrate form once advance + lookup lists are loaded ──────────────────
  useEffect(() => {
    if (hydratedRef.current) return;
    if (!advance || !employees.length || !projects.length) return;

    const employeeId = advance.from_employee_id || advance.from_employee?.id || null;
    const matchedEmployee =
      employees.find((e) => e.id === employeeId) ||
      employees.find((e) => e.username === advance.from_employee_name) ||
      null;
    const matchedProject = projects.find((p) => p.title === advance.project_title) || null;

    setFromEmployee(matchedEmployee);
    setRequesterEmployee(matchedEmployee);
    setFromText(advance.from_text || '');
    setToText(advance.to_text || '');
    setProject(matchedProject);
    setCauseOfAdvance(advance.cause_of_advance || '');
    setAdvanceReceivableDate(advance.advance_receivable_date || '');
    setAdvanceReceivableAmount(advance.advance_receivable_amount || '');
    setExpectedDate(advance.expected_date || '');
    setReceiveMedium(advance.receive_medium || 'direct');
    setBankName(advance.bank_name || '');
    setChequeNo(advance.cheque_no || '');
    setAccountantRemarks(advance.accountant_remarks || '');
    setCheckOutstanding(advance.check_outstanding || null);
    setCheckAdjusted(advance.check_adjusted || null);
    setCheckCompleted(advance.check_completed || null);
    setSigRecipient({ file: null, preview: resolveUrl(advance.signature_recipient) });
    setSigAccountant({ file: null, preview: resolveUrl(advance.signature_accountant) });
    setSigRecommender({ file: null, preview: resolveUrl(advance.signature_recommender) });
    setSigApprover({ file: null, preview: resolveUrl(advance.signature_approver) });

    hydratedRef.current = true;
  }, [advance, employees, projects]);

  const amountInWords = useMemo(
    () => numberToWords(advanceReceivableAmount),
    [advanceReceivableAmount]
  );

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!project) {
      toast.error('Project is required');
      return;
    }
    if (!causeOfAdvance) {
      toast.error('Cause of advance is required');
      return;
    }
    if (!advanceReceivableDate) {
      toast.error('Advance receivable date is required');
      return;
    }
    if (!advanceReceivableAmount || Number(advanceReceivableAmount) <= 0) {
      toast.error('A valid advance receivable amount is required');
      return;
    }
    if (!expectedDate) {
      toast.error('Expected date is required');
      return;
    }
    if (receiveMedium === 'cheque') {
      if (!bankName.trim()) {
        toast.error('Bank name is required for cheque payment');
        return;
      }
      if (!chequeNo.trim()) {
        toast.error('Cheque number is required for cheque payment');
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (fromEmployee) formData.append('from_employee_id', fromEmployee.id);
      else if (advance?.from_employee_id)
        formData.append('from_employee_id', advance.from_employee_id);
      formData.append('from_text', fromText);
      formData.append('to_text', toText);
      formData.append('project_id_field', project.id);
      formData.append('cause_of_advance', causeOfAdvance);
      formData.append('advance_receivable_date', advanceReceivableDate);
      formData.append('advance_receivable_amount', advanceReceivableAmount);
      formData.append('expected_date', expectedDate);
      formData.append('receive_medium', receiveMedium);
      if (receiveMedium === 'cheque') {
        formData.append('bank_name', bankName);
        formData.append('cheque_no', chequeNo);
      }
      if (accountantRemarks) formData.append('accountant_remarks', accountantRemarks);
      if (checkOutstanding) formData.append('check_outstanding', checkOutstanding);
      if (checkAdjusted) formData.append('check_adjusted', checkAdjusted);
      if (checkCompleted) formData.append('check_completed', checkCompleted);
      if (sigRecipient.file) formData.append('signature_recipient', sigRecipient.file);
      if (sigAccountant.file) formData.append('signature_accountant', sigAccountant.file);
      if (sigRecommender.file) formData.append('signature_recommender', sigRecommender.file);
      if (sigApprover.file) formData.append('signature_approver', sigApprover.file);

      await updateAdvance(id, formData);
      toast.success('Advance updated successfully');
      setTimeout(() => {
        if (window.opener) window.opener.location.reload();
        window.close();
      }, 600);
    } catch (error) {
      const errData = error?.response?.data;
      const msg =
        errData?.detail ||
        errData?.non_field_errors?.[0] ||
        Object.values(errData || {})?.[0]?.[0] ||
        error?.message ||
        'Failed to update advance';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (advanceLoading || !hydratedRef.current) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Edit Advance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Update this advance request. Submitting will close this tab.
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={3}>
        <Card
          sx={{
            borderRadius: 3,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <CardSectionHeader
            title="Advance Request"
            subtitle="Fill in the memo details for this advance"
          />
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  From
                </Typography>
                <Autocomplete
                  options={employees}
                  getOptionLabel={(o) => o.username}
                  value={requesterEmployee}
                  onChange={(_, v) => setRequesterEmployee(v)}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Select Employee"
                      placeholder="Search employee..."
                    />
                  )}
                  sx={{ mb: 1.5 }}
                />
                <TextField
                  size="small"
                  label="From — additional details"
                  multiline
                  minRows={2}
                  value={fromText}
                  onChange={(e) => setFromText(e.target.value)}
                  fullWidth
                  placeholder="Department, designation, or any additional from details..."
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  To
                </Typography>
                <Autocomplete
                  options={employees}
                  getOptionLabel={(o) => o.username}
                  value={fromEmployee}
                  onChange={(_, v) => setFromEmployee(v)}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Select Employee"
                      placeholder="Search employee..."
                    />
                  )}
                  sx={{ mb: 1.5 }}
                />
                <TextField
                  size="small"
                  label="To"
                  multiline
                  minRows={2}
                  value={toText}
                  onChange={(e) => setToText(e.target.value)}
                  fullWidth
                  placeholder="Recipient, management, accounts department..."
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={projects}
                  getOptionLabel={(o) => o.title}
                  value={project}
                  onChange={(_, v) => setProject(v)}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Project Name *"
                      placeholder="Select project..."
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl size="small" fullWidth required>
                  <InputLabel>Cause of Advance</InputLabel>
                  <Select
                    value={causeOfAdvance}
                    label="Cause of Advance"
                    onChange={(e) => setCauseOfAdvance(e.target.value)}
                  >
                    {CAUSE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </Card>

        <Card
          sx={{
            borderRadius: 3,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <CardSectionHeader
            title="Details of Advance"
            subtitle="Financial and timeline information"
          />
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  size="small"
                  type="date"
                  label="Advance Receivable Date *"
                  InputLabelProps={{ shrink: true }}
                  value={advanceReceivableDate}
                  onChange={(e) => setAdvanceReceivableDate(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  size="small"
                  type="number"
                  label="Advance Receivable Amount *"
                  value={advanceReceivableAmount}
                  onChange={(e) => setAdvanceReceivableAmount(e.target.value)}
                  fullWidth
                  inputProps={{ min: 0, step: '0.01' }}
                  InputProps={{
                    startAdornment: (
                      <Typography variant="body2" sx={{ mr: 0.5, color: 'text.secondary' }}>
                        ৳
                      </Typography>
                    ),
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  size="small"
                  type="date"
                  label="Expected Date *"
                  InputLabelProps={{ shrink: true }}
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  Receive Medium *
                </Typography>
                <RadioGroup
                  row
                  value={receiveMedium}
                  onChange={(e) => {
                    setReceiveMedium(e.target.value);
                    if (e.target.value === 'direct') {
                      setBankName('');
                      setChequeNo('');
                    }
                  }}
                >
                  <FormControlLabel
                    value="direct"
                    control={<Radio size="small" />}
                    label="Direct"
                  />
                  <FormControlLabel
                    value="cheque"
                    control={<Radio size="small" />}
                    label="Cheque"
                  />
                </RadioGroup>
              </Grid>

              {receiveMedium === 'cheque' && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      size="small"
                      label="Bank Name *"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      fullWidth
                      placeholder="Enter bank name..."
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      size="small"
                      label="Cheque No *"
                      value={chequeNo}
                      onChange={(e) => setChequeNo(e.target.value)}
                      fullWidth
                      placeholder="Enter cheque number..."
                    />
                  </Grid>
                </>
              )}

              <Grid size={{ xs: 12 }}>
                <TextField
                  size="small"
                  label="Amount in Words"
                  value={amountInWords}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  placeholder="Auto-generated after entering amount above"
                  sx={{
                    '& .MuiOutlinedInput-root': { bgcolor: '#f9fafb' },
                    '& .MuiInputBase-input': {
                      color: amountInWords ? 'text.primary' : 'text.disabled',
                      fontStyle: amountInWords ? 'normal' : 'italic',
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  size="small"
                  label="Accountant Remarks"
                  multiline
                  minRows={3}
                  value={accountantRemarks}
                  onChange={(e) => setAccountantRemarks(e.target.value)}
                  fullWidth
                  placeholder="Enter any remarks from the accountant..."
                />
              </Grid>
            </Grid>
          </Box>
        </Card>

        <Card
          sx={{
            borderRadius: 3,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <CardSectionHeader
            title="Advance Checklist"
            subtitle="Mark each statement with ✓ Tick or ✗ Cross"
          />
          <Box sx={{ py: 0.5 }}>
            <ChecklistRow
              label={CHECKLIST_ITEMS[0].label}
              value={checkOutstanding}
              onChange={setCheckOutstanding}
            />
            <ChecklistRow
              label={CHECKLIST_ITEMS[1].label}
              value={checkAdjusted}
              onChange={setCheckAdjusted}
            />
            <ChecklistRow
              label={CHECKLIST_ITEMS[2].label}
              value={checkCompleted}
              onChange={setCheckCompleted}
            />
          </Box>
        </Card>

        <Card
          sx={{
            borderRadius: 3,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <CardSectionHeader
            title="Signatures"
            subtitle="Upload signature images — preview appears immediately after selection"
          />
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <SignatureUpload
                  label="Advance Recipient"
                  file={sigRecipient.file}
                  preview={sigRecipient.preview}
                  onFileChange={(file, preview) => setSigRecipient({ file, preview })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <SignatureUpload
                  label="Accountant"
                  file={sigAccountant.file}
                  preview={sigAccountant.preview}
                  onFileChange={(file, preview) => setSigAccountant({ file, preview })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <SignatureUpload
                  label="Recommender"
                  file={sigRecommender.file}
                  preview={sigRecommender.preview}
                  onFileChange={(file, preview) => setSigRecommender({ file, preview })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <SignatureUpload
                  label="Approver"
                  file={sigApprover.file}
                  preview={sigApprover.preview}
                  onFileChange={(file, preview) => setSigApprover({ file, preview })}
                />
              </Grid>
            </Grid>
          </Box>
        </Card>

        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ pb: 2 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => window.close()}
            disabled={submitting}
          >
            Cancel & Close
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Iconify icon="mingcute:check-line" />
              )
            }
          >
            {submitting ? 'Updating...' : 'Update Advance'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
