'use client';

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
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { deleteAdvance, useGetAdvances } from 'src/actions/advances';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useTable, TableEmptyRows, TablePaginationCustom } from 'src/components/table';

// ── Constants ─────────────────────────────────────────────────────────────────

const MEDIUM_LABELS = { cheque: 'Cheque', direct: 'Direct' };
const MEDIUM_COLORS = { cheque: 'info', direct: 'success' };

function getAdvanceListPrintHTML(rows) {
  const fmtAmount = (v) =>
    parseFloat(v || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const rowsHTML = rows
    .map(
      (r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${r.from_employee_name || '—'}</td>
        <td>${r.project_title || '—'}</td>
        <td>${r.cause_of_advance || '—'}</td>
        <td>৳${fmtAmount(r.advance_receivable_amount)}</td>
        <td>${r.receive_medium === 'cheque' ? 'Cheque' : 'Direct'}</td>
        <td>${r.advance_receivable_date || '—'}</td>
        <td>${r.expected_date || '—'}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Advance Receivables</title>
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
  <h2>Advance Receivables</h2>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Employee</th><th>Project</th><th>Cause</th>
        <th>Amount</th><th>Medium</th><th>Receivable Date</th><th>Expected Date</th>
      </tr>
    </thead>
    <tbody>${rowsHTML}</tbody>
  </table>
</body>
</html>`;
}

function exportAdvancesToExcel(rows) {
  const fmtAmount = (v) => parseFloat(v || 0).toFixed(2);

  const rowsHTML = rows
    .map(
      (r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${r.from_employee_name || ''}</td>
        <td>${r.project_title || ''}</td>
        <td>${r.cause_of_advance || ''}</td>
        <td>${fmtAmount(r.advance_receivable_amount)}</td>
        <td>${r.receive_medium === 'cheque' ? 'Cheque' : 'Direct'}</td>
        <td>${r.advance_receivable_date || ''}</td>
        <td>${r.expected_date || ''}</td>
      </tr>`
    )
    .join('');

  const html = `<html>
<head><meta charset="UTF-8"></head>
<body>
  <table border="1">
    <thead>
      <tr>
        <th>#</th><th>Employee</th><th>Project</th><th>Cause</th>
        <th>Amount</th><th>Medium</th><th>Receivable Date</th><th>Expected Date</th>
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
  link.download = `advances-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

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

// ── Main Component ────────────────────────────────────────────────────────────

export function AdvanceListView() {
  const table = useTable({ defaultCurrentPage: 0, defaultRowsPerPage: 10 });
  const [deleteId, setDeleteId] = useState(null);
  const confirm = useBoolean();
  const [searchText, setSearchText] = useState('');

  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterCause, setFilterCause] = useState('all');
  const [filterMedium, setFilterMedium] = useState('all');
  const [filterAmountRange, setFilterAmountRange] = useState('all');
  const [filterReceivableFrom, setFilterReceivableFrom] = useState('');
  const [filterReceivableTo, setFilterReceivableTo] = useState('');
  const [filterExpectedFrom, setFilterExpectedFrom] = useState('');
  const [filterExpectedTo, setFilterExpectedTo] = useState('');

  const { advances, advancesLoading } = useGetAdvances();

  const summary = useMemo(() => {
    const total = advances.length;
    const totalAmount = advances.reduce(
      (acc, r) => acc + parseFloat(r.advance_receivable_amount || 0),
      0
    );
    const byCheque = advances.filter((r) => r.receive_medium === 'cheque').length;
    const byDirect = advances.filter((r) => r.receive_medium === 'direct').length;
    return { total, totalAmount, byCheque, byDirect };
  }, [advances]);

  const AMOUNT_RANGES = [
    { value: 'all', label: 'All Amounts' },
    { value: 'lt10k', label: 'Under ৳10,000', test: (v) => v < 10000 },
    { value: '10k-50k', label: '৳10,000 – ৳50,000', test: (v) => v >= 10000 && v < 50000 },
    { value: '50k-100k', label: '৳50,000 – ৳100,000', test: (v) => v >= 50000 && v < 100000 },
    { value: 'gt100k', label: 'Above ৳100,000', test: (v) => v >= 100000 },
  ];

  const employeeOptions = useMemo(() => {
    const names = new Set(advances.map((r) => r.from_employee_name).filter(Boolean));
    return ['all', ...Array.from(names)];
  }, [advances]);

  const projectOptions = useMemo(() => {
    const names = new Set(advances.map((r) => r.project_title).filter(Boolean));
    return Array.from(names);
  }, [advances]);

  const causeOptions = useMemo(() => {
    const names = new Set(advances.map((r) => r.cause_of_advance).filter(Boolean));
    return Array.from(names);
  }, [advances]);

  const filtered = useMemo(() => {
    const q = searchText.toLowerCase();
    const amountTest = AMOUNT_RANGES.find((r) => r.value === filterAmountRange);

    return advances.filter((r) => {
      if (q) {
        const matchesSearch =
          (r.from_employee_name || '').toLowerCase().includes(q) ||
          (r.project_title || '').toLowerCase().includes(q) ||
          (r.cause_of_advance || '').toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      if (filterEmployee !== 'all' && r.from_employee_name !== filterEmployee) return false;
      if (filterProject !== 'all' && r.project_title !== filterProject) return false;
      if (filterCause !== 'all' && r.cause_of_advance !== filterCause) return false;
      if (filterMedium !== 'all' && r.receive_medium !== filterMedium) return false;

      if (amountTest?.test) {
        const amt = parseFloat(r.advance_receivable_amount || 0);
        if (!amountTest.test(amt)) return false;
      }

      if (filterReceivableFrom && r.advance_receivable_date < filterReceivableFrom) return false;
      if (filterReceivableTo && r.advance_receivable_date > filterReceivableTo) return false;
      if (filterExpectedFrom && r.expected_date < filterExpectedFrom) return false;
      if (filterExpectedTo && r.expected_date > filterExpectedTo) return false;

      return true;
    });
  }, [
    advances,
    searchText,
    filterEmployee,
    filterProject,
    filterCause,
    filterMedium,
    filterAmountRange,
    filterReceivableFrom,
    filterReceivableTo,
    filterExpectedFrom,
    filterExpectedTo,
  ]);

  const paginated = filtered.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const handleDelete = async () => {
    try {
      await deleteAdvance(deleteId);
      toast.success('Advance deleted successfully');
    } catch {
      toast.error('Failed to delete advance.');
    } finally {
      confirm.onFalse();
      setDeleteId(null);
    }
  };

  const handlePrintList = () => {
    try {
      const html = getAdvanceListPrintHTML(filtered);
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
      exportAdvancesToExcel(filtered);
    } catch {
      toast.error('Failed to export to Excel.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="h4" fontWeight={700}>
          Advance Receivables
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
        </Stack>
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Track and manage all advance requests under expense management
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Advances"
            value={summary.total}
            icon="solar:wallet-bold-duotone"
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
            title="By Cheque"
            value={summary.byCheque}
            icon="solar:card-bold-duotone"
            iconColor="#f59e0b"
            iconBg="#fffbeb"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="By Direct"
            value={summary.byDirect}
            icon="solar:transfer-horizontal-bold-duotone"
            iconColor="#6366f1"
            iconBg="#f5f3ff"
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
                All Advances
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {filtered.length} record{filtered.length === 1 ? '' : 's'} found
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              href={paths.dashboard.projectManagements.expenses.advances.create}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              sx={{ whiteSpace: 'nowrap', alignSelf: { xs: 'stretch', sm: 'auto' } }}
            >
              Create Advance
            </Button>
          </Stack>

          <TextField
            size="small"
            placeholder="Search by employee, project, cause..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              table.onResetPage();
            }}
            sx={{ minWidth: 280 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ mt: 2.5 }}>
            <Tabs
              value={filterEmployee}
              onChange={(_, v) => {
                setFilterEmployee(v);
                table.onResetPage();
              }}
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
                  <InputLabel>Project</InputLabel>
                  <Select
                    value={filterProject}
                    label="Project"
                    onChange={(e) => {
                      setFilterProject(e.target.value);
                      table.onResetPage();
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">All Projects</MenuItem>
                    {projectOptions.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Cause</InputLabel>
                  <Select
                    value={filterCause}
                    label="Cause"
                    onChange={(e) => {
                      setFilterCause(e.target.value);
                      table.onResetPage();
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">All Causes</MenuItem>
                    {causeOptions.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Medium</InputLabel>
                  <Select
                    value={filterMedium}
                    label="Medium"
                    onChange={(e) => {
                      setFilterMedium(e.target.value);
                      table.onResetPage();
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">All Mediums</MenuItem>
                    <MenuItem value="direct">Direct</MenuItem>
                    <MenuItem value="cheque">Cheque</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Amount</InputLabel>
                  <Select
                    value={filterAmountRange}
                    label="Amount"
                    onChange={(e) => {
                      setFilterAmountRange(e.target.value);
                      table.onResetPage();
                    }}
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

              <Grid size={{ xs: 12, md: 2.4 }}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    type="date"
                    label="Receivable From"
                    InputLabelProps={{ shrink: true }}
                    value={filterReceivableFrom}
                    onChange={(e) => {
                      setFilterReceivableFrom(e.target.value);
                      table.onResetPage();
                    }}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    type="date"
                    label="Receivable To"
                    InputLabelProps={{ shrink: true }}
                    value={filterReceivableTo}
                    onChange={(e) => {
                      setFilterReceivableTo(e.target.value);
                      table.onResetPage();
                    }}
                    fullWidth
                  />
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 12 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={1}>
                  <TextField
                    size="small"
                    type="date"
                    label="Expected From"
                    InputLabelProps={{ shrink: true }}
                    value={filterExpectedFrom}
                    onChange={(e) => {
                      setFilterExpectedFrom(e.target.value);
                      table.onResetPage();
                    }}
                  />
                  <TextField
                    size="small"
                    type="date"
                    label="Expected To"
                    InputLabelProps={{ shrink: true }}
                    value={filterExpectedTo}
                    onChange={(e) => {
                      setFilterExpectedTo(e.target.value);
                      table.onResetPage();
                    }}
                  />
                  {(filterEmployee !== 'all' ||
                    filterProject !== 'all' ||
                    filterCause !== 'all' ||
                    filterMedium !== 'all' ||
                    filterAmountRange !== 'all' ||
                    filterReceivableFrom ||
                    filterReceivableTo ||
                    filterExpectedFrom ||
                    filterExpectedTo) && (
                    <Chip
                      label="Clear all filters"
                      onClick={() => {
                        setFilterEmployee('all');
                        setFilterProject('all');
                        setFilterCause('all');
                        setFilterMedium('all');
                        setFilterAmountRange('all');
                        setFilterReceivableFrom('');
                        setFilterReceivableTo('');
                        setFilterExpectedFrom('');
                        setFilterExpectedTo('');
                        table.onResetPage();
                      }}
                      onDelete={() => {}}
                      deleteIcon={<Iconify icon="solar:close-circle-bold" />}
                      size="small"
                      sx={{ borderRadius: 999 }}
                    />
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Box>

        <TableContainer>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Cause</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Medium</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Receivable Date</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Expected Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#374151' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Iconify
                        icon="solar:wallet-bold-duotone"
                        width={48}
                        sx={{ color: 'text.disabled', mb: 1.5 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {advancesLoading ? 'Loading advances...' : 'No advance records found.'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((row, idx) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{
                      '&:last-child td': { borderBottom: 0 },
                      borderBottom: '1px solid #f3f4f6',
                      '&:nth-of-type(even)': { bgcolor: '#f9fafb' },
                      '&:hover': { bgcolor: '#f0f9ff !important' },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {table.page * table.rowsPerPage + idx + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {row.from_employee_name || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.project_title || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.cause_of_advance || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        ৳
                        {parseFloat(row.advance_receivable_amount || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Label variant="soft" color={MEDIUM_COLORS[row.receive_medium] || 'default'}>
                        {MEDIUM_LABELS[row.receive_medium] || row.receive_medium || '—'}
                      </Label>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.advance_receivable_date || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.expected_date || '—'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            component={RouterLink}
                            href={paths.dashboard.projectManagements.expenses.advances.detail(
                              row.id
                            )}
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
                                paths.dashboard.projectManagements.expenses.advances.edit(row.id),
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
                            onClick={() => {
                              setDeleteId(row.id);
                              confirm.onTrue();
                            }}
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
              <TableEmptyRows emptyRows={0} height={table.dense ? 52 : 76} />
            </TableBody>
          </Table>
        </TableContainer>

        <TablePaginationCustom
          count={filtered.length}
          page={table.page}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          dense={table.dense}
          onChangeDense={table.onChangeDense}
        />
      </Card>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Advance"
        content="Are you sure you want to delete this advance? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
