'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import {
  Box,
  Tab,
  Card,
  Tabs,
  Grid,
  Chip,
  Stack,
  Table,
  Select,
  Button,
  Tooltip,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  InputLabel,
  Typography,
  IconButton,
  FormControl,
  InputAdornment,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import StatusActionMenu from '../../_components/shared/status-action-menu';
import { usePerdiumClaimApi } from '../../_components/configuration/use-perdium-claim-api';

const STATUS_COLOR = {
  draft: 'default',
  submitted: 'info',
  approved: 'success',
  rejected: 'error',
};

const STATUS_LABEL = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
};

const STATUS_TRANSITIONS = {
  draft: [
    { status: 'submitted', label: 'Submit for Review' },
    { status: 'approved', label: 'Approve' },
    { status: 'rejected', label: 'Reject', destructive: true },
  ],
  submitted: [
    { status: 'approved', label: 'Approve' },
    { status: 'rejected', label: 'Reject', destructive: true },
  ],
  approved: [{ status: 'rejected', label: 'Reject', destructive: true }],
  rejected: [{ status: 'submitted', label: 'Resubmit' }],
};

const AMOUNT_RANGES = [
  { value: 'all', label: 'All Amounts' },
  { value: 'lt5k', label: 'Under ৳5,000', test: (v) => v < 5000 },
  { value: '5k-20k', label: '৳5,000 – ৳20,000', test: (v) => v >= 5000 && v < 20000 },
  { value: '20k-50k', label: '৳20,000 – ৳50,000', test: (v) => v >= 20000 && v < 50000 },
  { value: 'gt50k', label: 'Above ৳50,000', test: (v) => v >= 50000 },
];

// ── Summary Card ──────────────────────────────────────────────────────────────

function SummaryCard({ title, value, icon, iconColor, iconBg }) {
  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: 3,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: 2,
          bgcolor: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Iconify icon={icon} width={26} sx={{ color: iconColor }} />
      </Box>
      <Box>
        <Typography variant="h4" fontWeight={700} lineHeight={1.2}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
    </Card>
  );
}

// ── Print / Export helpers ───────────────────────────────────────────────────

function getPerdiumPrintHTML(rows) {
  const fmtAmount = (v) => parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const rowsHTML = rows
    .map(
      (r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${r.employee_name || '—'}</td>
        <td>${r.grade || '—'}</td>
        <td>${r.purpose_of_travel || '—'}</td>
        <td>${r.from_date || '—'}</td>
        <td>${r.to_date || '—'}</td>
        <td>৳${fmtAmount(r.grand_total)}</td>
        <td>${STATUS_LABEL[r.status] || r.status || '—'}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Perdium Claims</title>
  <script>window.onload=function(){setTimeout(function(){window.print()},400)};</script>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; }
    h2 { margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; }
    th { background: #f2f2f2; }
    @media print { @page { size: A4 landscape; margin: 1cm; } }
  </style>
</head>
<body>
  <h2>Perdium Claims</h2>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Employee</th><th>Grade</th><th>Purpose</th>
        <th>From</th><th>To</th><th>Total</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${rowsHTML}</tbody>
  </table>
</body>
</html>`;
}

function exportPerdiumToExcel(rows) {
  const fmtAmount = (v) => parseFloat(v || 0).toFixed(2);

  const rowsHTML = rows
    .map(
      (r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${r.employee_name || ''}</td>
        <td>${r.grade || ''}</td>
        <td>${r.purpose_of_travel || ''}</td>
        <td>${r.from_date || ''}</td>
        <td>${r.to_date || ''}</td>
        <td>${fmtAmount(r.grand_total)}</td>
        <td>${STATUS_LABEL[r.status] || r.status || ''}</td>
      </tr>`
    )
    .join('');

  const html = `<html>
<head><meta charset="UTF-8"></head>
<body>
  <table border="1">
    <thead>
      <tr>
        <th>#</th><th>Employee</th><th>Grade</th><th>Purpose</th>
        <th>From</th><th>To</th><th>Total</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${rowsHTML}</tbody>
  </table>
</body>
</html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `perdium-claims-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PerdiumPage() {
  const { claims, loading, actions } = usePerdiumClaimApi();
  const [deleting, setDeleting] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusLoading, setStatusLoading] = useState(null);

  const [searchText, setSearchText] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAmountRange, setFilterAmountRange] = useState('all');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  const summary = useMemo(() => {
    const total = claims.length;
    const totalAmount = claims.reduce((acc, c) => acc + parseFloat(c.grand_total || 0), 0);
    const approved = claims.filter((c) => c.status === 'approved').length;
    const pending = claims.filter((c) => c.status === 'draft' || c.status === 'submitted').length;
    return { total, totalAmount, approved, pending };
  }, [claims]);

  const employeeOptions = useMemo(() => {
    const names = new Set(claims.map((c) => c.employee_name).filter(Boolean));
    return ['all', ...Array.from(names)];
  }, [claims]);

  const gradeOptions = useMemo(() => {
    const grades = new Set(claims.map((c) => c.grade).filter(Boolean));
    return Array.from(grades);
  }, [claims]);

  const filtered = useMemo(() => {
    const q = searchText.toLowerCase();
    const amountTest = AMOUNT_RANGES.find((r) => r.value === filterAmountRange);

    return claims.filter((c) => {
      if (q) {
        const matchesSearch =
          (c.employee_name || '').toLowerCase().includes(q) ||
          (c.purpose_of_travel || '').toLowerCase().includes(q) ||
          (c.designation || '').toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      if (filterEmployee !== 'all' && c.employee_name !== filterEmployee) return false;
      if (filterGrade !== 'all' && c.grade !== filterGrade) return false;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;

      if (amountTest?.test) {
        const amt = parseFloat(c.grand_total || 0);
        if (!amountTest.test(amt)) return false;
      }

      if (filterFromDate && c.from_date < filterFromDate) return false;
      if (filterToDate && c.to_date > filterToDate) return false;

      return true;
    });
  }, [
    claims,
    searchText,
    filterEmployee,
    filterGrade,
    filterStatus,
    filterAmountRange,
    filterFromDate,
    filterToDate,
  ]);

  const hasActiveFilters =
    filterEmployee !== 'all' ||
    filterGrade !== 'all' ||
    filterStatus !== 'all' ||
    filterAmountRange !== 'all' ||
    filterFromDate ||
    filterToDate;

  const clearFilters = () => {
    setFilterEmployee('all');
    setFilterGrade('all');
    setFilterStatus('all');
    setFilterAmountRange('all');
    setFilterFromDate('');
    setFilterToDate('');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    try {
      await actions.deleteClaim(deleteTarget.id);
      toast.success('Claim deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusChange = async (claimId, newStatus) => {
    setStatusLoading(claimId);
    try {
      await actions.changeClaimStatus(claimId, newStatus);
      toast.success(`Status changed to ${STATUS_LABEL[newStatus] || newStatus}`);
    } catch {
      toast.error('Failed to change status');
    } finally {
      setStatusLoading(null);
    }
  };

  const handlePrintList = () => {
    try {
      const html = getPerdiumPrintHTML(filtered);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) {
        toast.error('Please allow popups for this website to print.');
        return;
      }
      win.focus();
    } catch {
      toast.error('Failed to generate print view.');
    }
  };

  const handleExportExcel = () => {
    try {
      exportPerdiumToExcel(filtered);
    } catch {
      toast.error('Failed to export to Excel.');
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="h4" fontWeight="bold">
          Perdium
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:printer-bold" width={16} />}
            onClick={handlePrintList}
          >
            Print
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:file-text-bold" width={16} />}
            onClick={handleExportExcel}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:settings-bold" />}
            component={Link}
            href={`${paths.dashboard.accountingFinance.configuration.perdium}/rates`}
          >
            Manage Rates
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() =>
              window.open(
                `${paths.dashboard.accountingFinance.configuration.perdium}/create`,
                '_blank'
              )
            }
          >
            New Claim
          </Button>
        </Stack>
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Track and manage all perdium claims
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Claims"
            value={summary.total}
            icon="solar:bill-list-bold-duotone"
            iconColor="#3b82f6"
            iconBg="#eff6ff"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Amount"
            value={`৳${summary.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            icon="solar:dollar-minimalistic-bold-duotone"
            iconColor="#10b981"
            iconBg="#f0fdf4"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Approved"
            value={summary.approved}
            icon="solar:check-circle-bold-duotone"
            iconColor="#22c55e"
            iconBg="#f0fdf4"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Pending"
            value={summary.pending}
            icon="solar:clock-circle-bold-duotone"
            iconColor="#f59e0b"
            iconBg="#fffbeb"
          />
        </Grid>
      </Grid>

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: '1px solid #e5e7eb' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={600}>
                All Claims
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {filtered.length} record{filtered.length === 1 ? '' : 's'} found
              </Typography>
            </Box>
            <TextField
              size="small"
              placeholder="Search by employee, designation, purpose..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              sx={{ minWidth: 280 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          {/* Filters */}
          <Box>
            <Tabs
              value={filterEmployee}
              onChange={(_, v) => setFilterEmployee(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 38,
                mb: 2,
                '& .MuiTabs-indicator': { display: 'none' },
                '& .MuiTab-root': {
                  minHeight: 34,
                  px: 2,
                  mr: 1,
                  borderRadius: 999,
                  textTransform: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'text.secondary',
                  border: '1px solid #e5e7eb',
                  bgcolor: '#fff',
                  transition: 'all 0.15s',
                },
                '& .Mui-selected': {
                  color: 'primary.main !important',
                  bgcolor: 'primary.lighter',
                  borderColor: 'primary.main',
                },
              }}
            >
              {employeeOptions.map((name) => (
                <Tab key={name} value={name} label={name === 'all' ? 'All Employees' : name} />
              ))}
            </Tabs>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Grade</InputLabel>
                  <Select
                    value={filterGrade}
                    label="Grade"
                    onChange={(e) => setFilterGrade(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">All Grades</MenuItem>
                    {gradeOptions.map((g) => (
                      <MenuItem key={g} value={g}>
                        {g}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    {Object.entries(STATUS_LABEL).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Amount</InputLabel>
                  <Select
                    value={filterAmountRange}
                    label="Amount"
                    onChange={(e) => setFilterAmountRange(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    {AMOUNT_RANGES.map((r) => (
                      <MenuItem key={r.value} value={r.value}>
                        {r.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <TextField
                  size="small"
                  type="date"
                  label="From Date"
                  InputLabelProps={{ shrink: true }}
                  value={filterFromDate}
                  onChange={(e) => setFilterFromDate(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    size="small"
                    type="date"
                    label="To Date"
                    InputLabelProps={{ shrink: true }}
                    value={filterToDate}
                    onChange={(e) => setFilterToDate(e.target.value)}
                    fullWidth
                  />
                  {hasActiveFilters && (
                    <Chip
                      label="Clear"
                      onClick={clearFilters}
                      onDelete={clearFilters}
                      deleteIcon={<Iconify icon="solar:close-circle-bold" />}
                      size="small"
                      sx={{ borderRadius: 999, flexShrink: 0 }}
                    />
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Grade</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Purpose</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>From</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>To</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#374151' }}>
                  Total (Taka)
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#374151' }}>
                  Status
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#374151' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography sx={{ py: 3 }} color="text.secondary">
                      Loading...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Iconify
                        icon="solar:bill-list-bold-duotone"
                        width={48}
                        sx={{ color: 'text.disabled', mb: 1.5 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        No perdium claims found
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    hover
                    sx={{
                      '&:last-child td': { borderBottom: 0 },
                      borderBottom: '1px solid #f3f4f6',
                      '&:nth-of-type(even)': { bgcolor: '#f9fafb' },
                      '&:hover': { bgcolor: '#f0f9ff !important' },
                    }}
                  >
                    <TableCell>
                      <Link
                        href={`${paths.dashboard.accountingFinance.configuration.perdium}/${c.id}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {c.employee_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {c.designation}
                        </Typography>
                      </Link>
                    </TableCell>
                    <TableCell>{c.grade}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.purpose_of_travel}
                      </Typography>
                    </TableCell>
                    <TableCell>{c.from_date || '-'}</TableCell>
                    <TableCell>{c.to_date || '-'}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        ৳
                        {parseFloat(c.grand_total || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Chip
                          label={STATUS_LABEL[c.status] || c.status}
                          color={STATUS_COLOR[c.status] || 'default'}
                          size="small"
                        />
                        <StatusActionMenu
                          currentStatus={c.status}
                          transitions={STATUS_TRANSITIONS[c.status] || []}
                          onTransition={(newStatus) => handleStatusChange(c.id, newStatus)}
                          loading={statusLoading === c.id}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            component={Link}
                            href={`${paths.dashboard.accountingFinance.configuration.perdium}/${c.id}`}
                            sx={{
                              color: 'primary.main',
                              '&:hover': { bgcolor: 'primary.lighter' },
                            }}
                          >
                            <Iconify icon="solar:eye-bold" width={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() =>
                              window.open(
                                `${paths.dashboard.accountingFinance.configuration.perdium}/${c.id}/edit`,
                                '_blank'
                              )
                            }
                            sx={{
                              color: 'warning.main',
                              '&:hover': { bgcolor: 'warning.lighter' },
                            }}
                          >
                            <Iconify icon="solar:pen-bold" width={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteTarget(c)}
                            disabled={deleting === c.id}
                            sx={{ '&:hover': { bgcolor: 'error.lighter' } }}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Claim"
        content={`Are you sure you want to delete the claim for "${deleteTarget?.employee_name || ''}"? This action cannot be undone.`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete} disabled={!!deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        }
      />
    </Box>
  );
}
