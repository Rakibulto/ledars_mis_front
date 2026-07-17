'use client';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';
import { lockPayroll, useGetPayrolls } from 'src/actions/payroll';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { TablePaginationCustom } from 'src/components/table';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const currentYear = new Date().getFullYear();
const currentMonthName = MONTH_NAMES[new Date().getMonth()];

function renderLeaveBreakdown(breakdown) {
  if (!breakdown || typeof breakdown !== 'object' || Object.keys(breakdown).length === 0) {
    return 'None';
  }
  return Object.entries(breakdown)
    .map(([type, days]) => `${type}: ${days}`)
    .join(', ');
}

// Excel export using ExcelJS
async function exportToExcel(payrolls, filterMonth, filterYear) {
  try {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Ledars MIS';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Payroll Records');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Employee', key: 'employee', width: 30 },
      { header: 'Month', key: 'payroll_month', width: 12 },
      { header: 'Year', key: 'payroll_year', width: 8 },
      { header: 'Days in Month', key: 'days_of_month', width: 14 },
      { header: 'Working Days', key: 'working_days', width: 14 },
      { header: 'Present Days', key: 'present_days', width: 14 },
      { header: 'Absent Days', key: 'absent_days', width: 12 },
      { header: 'Late Days', key: 'late_days', width: 10 },
      { header: 'Weekend Days', key: 'weekend_days', width: 14 },
      { header: 'Holidays', key: 'holidays', width: 10 },
      { header: 'Leave Breakdown', key: 'leave_breakdown', width: 25 },
      { header: 'Basic', key: 'basic', width: 12 },
      { header: 'House Rent', key: 'house_rent', width: 12 },
      { header: 'Conveyance', key: 'conveyance', width: 12 },
      { header: 'Medical', key: 'medical', width: 12 },
      { header: 'Gross Salary', key: 'gross_salary', width: 14 },
      { header: 'Festival Bonus', key: 'festival_bonus', width: 14 },
      { header: 'Performance Bonus', key: 'performance_bonus', width: 16 },
      { header: 'Absence Deduction', key: 'absence_deduction', width: 16 },
      { header: 'Late Deduction', key: 'late_deduction', width: 14 },
      { header: 'Holiday Compensation', key: 'holiday_compensation', width: 18 },
      { header: 'Weekday Compensation', key: 'weekday_compensation', width: 18 },
      { header: 'Tax Deduction', key: 'tax_deduction', width: 14 },
      { header: 'Net Salary', key: 'net_salary', width: 14 },
      { header: 'Total Transfer', key: 'total_transfer_amount', width: 14 },
      { header: 'Locked', key: 'is_locked', width: 8 },
      { header: 'Creator', key: 'creator', width: 25 },
      { header: 'Created At', key: 'created_at', width: 20 },
      { header: 'Updated At', key: 'updated_at', width: 20 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1976D2' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Add data rows
    payrolls.forEach((p) => {
      worksheet.addRow({
        id: p.id,
        employee: p.employee || '',
        payroll_month: p.payroll_month || '',
        payroll_year: p.payroll_year || '',
        days_of_month: p.days_of_month || 0,
        working_days: p.working_days || 0,
        present_days: p.present_days || 0,
        absent_days: p.absent_days || 0,
        late_days: p.late_days || 0,
        weekend_days: p.weekend_days || 0,
        holidays: p.holidays || 0,
        leave_breakdown: renderLeaveBreakdown(p.leave_breakdown),
        basic: parseFloat(p.basic || 0),
        house_rent: parseFloat(p.house_rent || 0),
        conveyance: parseFloat(p.conveyance || 0),
        medical: parseFloat(p.medical || 0),
        gross_salary: parseFloat(p.gross_salary || 0),
        festival_bonus: parseFloat(p.festival_bonus || 0),
        performance_bonus: parseFloat(p.performance_bonus || 0),
        absence_deduction: parseFloat(p.absence_deduction || 0),
        late_deduction: parseFloat(p.late_deduction || 0),
        holiday_compensation: parseFloat(p.holiday_compensation || 0),
        weekday_compensation: parseFloat(p.weekday_compensation || 0),
        tax_deduction: parseFloat(p.tax_deduction || 0),
        net_salary: parseFloat(p.net_salary || 0),
        total_transfer_amount: parseFloat(p.total_transfer_amount || 0),
        is_locked: p.is_locked ? 'Yes' : 'No',
        creator: p.creator || '',
        created_at: p.created_at ? new Date(p.created_at).toLocaleString() : '',
        updated_at: p.updated_at ? new Date(p.updated_at).toLocaleString() : '',
      });
    });

    // Format currency columns
    const currencyKeys = [
      'basic',
      'house_rent',
      'conveyance',
      'medical',
      'gross_salary',
      'festival_bonus',
      'performance_bonus',
      'absence_deduction',
      'late_deduction',
      'holiday_compensation',
      'weekday_compensation',
      'tax_deduction',
      'net_salary',
      'total_transfer_amount',
    ];
    currencyKeys.forEach((key) => {
      const col = worksheet.getColumn(key);
      col.numFmt = '#,##0.00';
    });

    // Auto-filter
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: payrolls.length + 1, column: worksheet.columns.length },
    };

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const period = filterMonth && filterYear ? `${filterMonth}_${filterYear}` : filterYear || 'All';
    a.download = `Payroll_${period}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${payrolls.length} payroll record(s) to Excel`);
  } catch (error) {
    console.error('Excel export error:', error);
    toast.error('Failed to export to Excel. Make sure exceljs is installed.');
  }
}

// ----------------------------------------------------------------------

export function PayrollListView() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState(currentMonthName);
  const [filterYear, setFilterYear] = useState(String(currentYear));

  const { payrolls, payrollsLoading, payrollsError, payrollsEmpty } = useGetPayrolls(
    {
      employee: searchQuery || undefined,
      payroll_month: filterMonth || undefined,
      payroll_year: filterYear ? Number(filterYear) : undefined,
    },
    true
  );

  const approveConfirm = useBoolean();

  // Compute available years from data (only current and past)
  const dataYears = [...new Set(payrolls.map((p) => p.payroll_year))];
  const allYears = [...new Set([...dataYears, currentYear])]
    .filter((y) => y <= currentYear)
    .sort((a, b) => b - a);

  const currentMonthIndex = new Date().getMonth(); // 0-based

  // Check if a month is disabled (future month for current year)
  const isMonthDisabled = (monthName) => {
    if (!filterYear || Number(filterYear) < currentYear) return false;
    if (Number(filterYear) === currentYear) {
      const monthIdx = MONTH_NAMES.indexOf(monthName);
      return monthIdx > currentMonthIndex;
    }
    return true;
  };

  const filteredPayrolls = payrolls;

  // period lock state (all filtered records locked?)
  const periodLocked =
    filteredPayrolls && filteredPayrolls.length > 0
      ? filteredPayrolls.every((p) => p.is_locked)
      : false;

  const paginatedPayrolls = filteredPayrolls.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Summary calculations
  const totalGross = filteredPayrolls.reduce((sum, p) => sum + parseFloat(p.gross_salary || 0), 0);
  const totalNet = filteredPayrolls.reduce((sum, p) => sum + parseFloat(p.net_salary || 0), 0);
  const totalDeductions = filteredPayrolls.reduce(
    (sum, p) => sum + parseFloat(p.absence_deduction || 0) + parseFloat(p.late_deduction || 0),
    0
  );
  const totalTax = filteredPayrolls.reduce((sum, p) => sum + parseFloat(p.tax_deduction || 0), 0);
  const totalTransfer = filteredPayrolls.reduce(
    (sum, p) => sum + parseFloat(p.total_transfer_amount || 0),
    0
  );

  const hasFilters = searchQuery || filterMonth || filterYear;

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterMonth('');
    setFilterYear('');
    setPage(0);
  }, []);

  const handleExport = useCallback(() => {
    exportToExcel(filteredPayrolls, filterMonth, filterYear);
  }, [filteredPayrolls, filterMonth, filterYear]);

  // toggle approval state for the selected period
  const handleConfirmAction = useCallback(async () => {
    if (!filterMonth || !filterYear) {
      approveConfirm.onFalse();
      return;
    }
    const monthNumber = MONTH_NAMES.indexOf(filterMonth) + 1;
    const yearNumber = Number(filterYear);
    const newLockState = !periodLocked;
    try {
      await lockPayroll(monthNumber, yearNumber, newLockState);
      toast.success(
        `Payroll for ${filterMonth} ${filterYear} ${
          newLockState ? 'approved' : 'unapproved'
        } successfully`
      );
    } catch (err) {
      toast.error(err?.message || 'Failed to update approval status');
    } finally {
      approveConfirm.onFalse();
    }
  }, [filterMonth, filterYear, periodLocked, approveConfirm]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Payroll Records"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Payroll', href: paths.dashboard.payroll.root },
          { name: 'List' },
        ]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="soft"
              color="success"
              startIcon={<Iconify icon="solar:file-download-bold" />}
              onClick={handleExport}
              disabled={filteredPayrolls.length === 0}
            >
              Export Excel
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => router.push(paths.dashboard.payroll.generate)}
            >
              Generate Payroll
            </Button>
            <Button
              variant={periodLocked ? 'outlined' : 'soft'}
              color={periodLocked ? 'warning' : 'secondary'}
              startIcon={
                <Iconify
                  icon={
                    periodLocked
                      ? 'solar:lock-unlocked-bold-duotone'
                      : 'solar:check-circle-bold-duotone'
                  }
                />
              }
              onClick={() => {
                if (!filterMonth || !filterYear) return;
                approveConfirm.onTrue();
              }}
              disabled={filteredPayrolls.length === 0 || !filterMonth || !filterYear}
            >
              {periodLocked ? 'Unlock Period' : 'Approve'}
            </Button>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item size={{ xs: 6, sm: 2.4 }}>
          <SummaryCard
            title="Total Records"
            value={filteredPayrolls.length}
            icon="solar:document-text-bold-duotone"
            color="primary"
          />
        </Grid>
        <Grid item size={{ xs: 6, sm: 2.4 }}>
          <SummaryCard
            title="Total Gross"
            value={fCurrency(totalGross)}
            icon="solar:wallet-money-bold-duotone"
            color="info"
          />
        </Grid>
        <Grid item size={{ xs: 6, sm: 2.4 }}>
          <SummaryCard
            title="Total Net"
            value={fCurrency(totalNet)}
            icon="solar:hand-money-bold-duotone"
            color="success"
          />
        </Grid>
        <Grid item size={{ xs: 6, sm: 2.4 }}>
          <SummaryCard
            title="Deductions"
            value={fCurrency(totalDeductions)}
            icon="solar:minus-circle-bold-duotone"
            color="error"
          />
        </Grid>
        <Grid item size={{ xs: 6, sm: 2.4 }}>
          <SummaryCard
            title="Total Transfer"
            value={fCurrency(totalTransfer)}
            icon="solar:card-transfer-bold-duotone"
            color="success"
          />
        </Grid>
      </Grid>

      {/* Filter & Table Card */}
      <Card>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="solar:list-bold-duotone" width={24} />
              <Typography variant="h6">All Payrolls</Typography>
            </Stack>
          }
          subheader={`${filteredPayrolls.length} record(s) found`}
        />

        <CardContent sx={{ pb: 0 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by employee name or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                ...(searchQuery && {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <Iconify icon="eva:close-fill" width={18} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Month</InputLabel>
              <Select
                value={filterMonth}
                label="Month"
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Months</MenuItem>
                {MONTH_NAMES.map((m) => (
                  <MenuItem key={m} value={m} disabled={isMonthDisabled(m)}>
                    {m}
                    {isMonthDisabled(m) ? ' (Future)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Year</InputLabel>
              <Select
                value={filterYear}
                label="Year"
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Years</MenuItem>
                {allYears.map((y) => (
                  <MenuItem key={y} value={String(y)}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {hasFilters && (
              <Button
                color="error"
                size="small"
                startIcon={<Iconify icon="solar:trash-bin-minimalistic-bold" />}
                onClick={handleClearFilters}
              >
                Clear
              </Button>
            )}
          </Stack>

          {hasFilters && (
            <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
              {searchQuery && (
                <Chip
                  label={`Search: ${searchQuery}`}
                  size="small"
                  variant="soft"
                  color="primary"
                  onDelete={() => setSearchQuery('')}
                />
              )}
              {filterMonth && (
                <Chip
                  label={`Month: ${filterMonth}`}
                  size="small"
                  variant="soft"
                  color="primary"
                  onDelete={() => setFilterMonth('')}
                />
              )}
              {filterYear && (
                <Chip
                  label={`Year: ${filterYear}`}
                  size="small"
                  variant="soft"
                  color="primary"
                  onDelete={() => setFilterYear('')}
                />
              )}
            </Stack>
          )}
        </CardContent>

        {payrollsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : payrollsError ? (
          <Alert severity="error" sx={{ m: 3 }}>
            Failed to load payroll records. Please try again.
          </Alert>
        ) : payrollsEmpty ? (
          <Alert severity="info" variant="outlined" sx={{ m: 3 }}>
            No payroll records found. Generate your first payroll to see records here.
          </Alert>
        ) : (
          <>
            <Scrollbar>
              <TableContainer sx={{ minWidth: 800, position: 'relative' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 0 }} />
                      <TableCell>Employee</TableCell>
                      <TableCell align="center">Period</TableCell>
                      <TableCell align="center">Days</TableCell>
                      <TableCell align="center">Working</TableCell>
                      <TableCell align="center">Present</TableCell>
                      <TableCell align="center">Absent</TableCell>
                      <TableCell align="center">Late</TableCell>
                      <TableCell align="right">Gross Salary</TableCell>
                      <TableCell align="right">Deductions</TableCell>
                      <TableCell align="right">Tax</TableCell>
                      <TableCell align="right">Net Salary</TableCell>
                      <TableCell align="right">Transfer</TableCell>
                      <TableCell align="center" sx={{ width: 0 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedPayrolls.map((payroll) => (
                      <PayrollListRow key={payroll.id} payroll={payroll} />
                    ))}

                    {paginatedPayrolls.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={14} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No records match the current filters.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>

            <TablePaginationCustom
              page={page}
              dense={false}
              count={filteredPayrolls.length}
              rowsPerPage={rowsPerPage}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={approveConfirm.value}
        onClose={approveConfirm.onFalse}
        title={periodLocked ? 'Unapprove Period' : 'Approve Period'}
        content={`Are you sure you want to ${periodLocked ? 'unapprove' : 'approve'} payroll for ${filterMonth} ${filterYear}?`}
        action={
          <Button
            variant="contained"
            color={periodLocked ? 'warning' : 'success'}
            onClick={handleConfirmAction}
          >
            {periodLocked ? 'Unapprove' : 'Approve'}
          </Button>
        }
      />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function SummaryCard({ title, value, icon, color }) {
  return (
    <Card
      sx={{
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          display: 'flex',
          borderRadius: 1.5,
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${color}.lighter`,
          color: `${color}.main`,
        }}
      >
        <Iconify icon={icon} width={28} />
      </Box>
      <Stack spacing={0.25}>
        <Typography variant="caption" color="text.disabled">
          {title}
        </Typography>
        <Typography variant="h6" noWrap>
          {value}
        </Typography>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

function PayrollListRow({ payroll }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const totalDeductions =
    parseFloat(payroll.absence_deduction || 0) + parseFloat(payroll.late_deduction || 0);

  const taxDeduction = parseFloat(payroll.tax_deduction || 0);

  const attendanceRate =
    payroll.working_days > 0
      ? ((payroll.present_days / payroll.working_days) * 100).toFixed(1)
      : '0.0';

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            <Iconify
              icon={open ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
              width={18}
            />
          </IconButton>
        </TableCell>

        <TableCell>
          <Stack direction="row" spacing={1} alignItems="center">
            <Stack spacing={0.25}>
              <Typography variant="subtitle2" noWrap>
                {payroll.employee?.split(' - ')?.[0] || payroll.employee}
              </Typography>
              <Typography variant="caption" color="text.disabled" noWrap>
                {payroll.employee?.split(' - ')?.[1] || ''}
              </Typography>
            </Stack>
            {payroll.is_locked && (
              <Tooltip title="Locked">
                <Iconify icon="solar:lock-bold" width={16} sx={{ color: 'warning.main' }} />
              </Tooltip>
            )}
          </Stack>
        </TableCell>

        <TableCell align="center">
          <Chip
            label={`${payroll.payroll_month} ${payroll.payroll_year}`}
            size="small"
            variant="soft"
            color="default"
          />
        </TableCell>

        <TableCell align="center">
          <Tooltip title="Days in Month">
            <Typography variant="body2">{payroll.days_of_month}</Typography>
          </Tooltip>
        </TableCell>

        <TableCell align="center">
          <Chip label={payroll.working_days} size="small" variant="soft" color="primary" />
        </TableCell>

        <TableCell align="center">
          <Chip label={payroll.present_days} size="small" variant="soft" color="success" />
        </TableCell>

        <TableCell align="center">
          <Chip
            label={payroll.absent_days}
            size="small"
            variant="soft"
            color={payroll.absent_days > 0 ? 'error' : 'default'}
          />
        </TableCell>

        <TableCell align="center">
          <Chip
            label={payroll.late_days || 0}
            size="small"
            variant="soft"
            color={payroll.late_days > 0 ? 'warning' : 'default'}
          />
        </TableCell>

        <TableCell align="right">
          <Typography variant="subtitle2">{fCurrency(payroll.gross_salary)}</Typography>
        </TableCell>

        <TableCell align="right">
          <Typography variant="body2" color={totalDeductions > 0 ? 'error.main' : 'text.secondary'}>
            {totalDeductions > 0 ? '-' : ''}
            {fCurrency(totalDeductions)}
          </Typography>
        </TableCell>

        <TableCell align="right">
          <Typography variant="body2" color={taxDeduction > 0 ? 'warning.main' : 'text.secondary'}>
            {taxDeduction > 0 ? '-' : ''}
            {fCurrency(taxDeduction)}
          </Typography>
        </TableCell>

        <TableCell align="right">
          <Typography variant="subtitle2" color="info.main" fontWeight="bold">
            {fCurrency(payroll.net_salary)}
          </Typography>
        </TableCell>

        <TableCell align="right">
          <Typography variant="subtitle2" color="success.main" fontWeight="bold">
            {fCurrency(payroll.total_transfer_amount)}
          </Typography>
        </TableCell>

        <TableCell align="center">
          <Tooltip title="View Payslip">
            <IconButton
              size="small"
              color="primary"
              onClick={() => router.push(paths.dashboard.payroll.details(payroll.id))}
            >
              <Iconify icon="solar:eye-bold" width={20} />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>

      {/* Expandable Detail Row */}
      <TableRow>
        <TableCell colSpan={14} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 1 }}>
              <Grid container spacing={2}>
                {/* Salary Breakdown */}
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <DetailCard
                    title="Salary Breakdown"
                    icon="solar:wallet-money-bold-duotone"
                    color="primary"
                    items={[
                      { label: 'Basic Salary', value: fCurrency(payroll.basic) },
                      { label: 'House Rent', value: fCurrency(payroll.house_rent) },
                      { label: 'Conveyance', value: fCurrency(payroll.conveyance) },
                      { label: 'Medical', value: fCurrency(payroll.medical) },
                      {
                        label: 'Gross Salary',
                        value: fCurrency(payroll.gross_salary),
                        bold: true,
                      },
                    ]}
                  />
                </Grid>

                {/* Attendance Info */}
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <DetailCard
                    title="Attendance Summary"
                    icon="solar:calendar-bold-duotone"
                    color="info"
                    items={[
                      { label: 'Days in Month', value: payroll.days_of_month },
                      { label: 'Working Days', value: payroll.working_days },
                      { label: 'Present Days', value: payroll.present_days },
                      { label: 'Absent Days', value: payroll.absent_days },
                      { label: 'Late Days', value: payroll.late_days || 0 },
                      { label: 'Weekend Days', value: payroll.weekend_days },
                      { label: 'Holidays', value: payroll.holidays },
                      {
                        label: 'Attendance Rate',
                        value: `${attendanceRate}%`,
                        bold: true,
                      },
                    ]}
                  />
                </Grid>

                {/* Bonuses & Compensation */}
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <DetailCard
                    title="Bonuses & Compensation"
                    icon="solar:gift-bold-duotone"
                    color="warning"
                    items={[
                      { label: 'Festival Bonus', value: fCurrency(payroll.festival_bonus) },
                      {
                        label: 'Performance Bonus',
                        value: fCurrency(payroll.performance_bonus),
                      },
                      {
                        label: 'Holiday Compensation',
                        value: fCurrency(payroll.holiday_compensation),
                      },
                      {
                        label: 'Weekday Compensation',
                        value: fCurrency(payroll.weekday_compensation),
                      },
                    ]}
                  />
                </Grid>

                {/* Deductions & Net */}
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <DetailCard
                    title="Deductions & Net Pay"
                    icon="solar:minus-circle-bold-duotone"
                    color="error"
                    items={[
                      {
                        label: 'Absence Deduction',
                        value: fCurrency(payroll.absence_deduction),
                      },
                      { label: 'Late Deduction', value: fCurrency(payroll.late_deduction) },
                      {
                        label: 'Tax Deduction',
                        value: fCurrency(payroll.tax_deduction),
                      },
                      {
                        label: 'Total Deductions',
                        value: fCurrency(totalDeductions + taxDeduction),
                        bold: true,
                        isNegative: totalDeductions + taxDeduction > 0,
                      },
                      {
                        label: 'Net Salary',
                        value: fCurrency(payroll.net_salary),
                        bold: true,
                        isPositive: true,
                      },
                      {
                        label: 'Total Transfer',
                        value: fCurrency(payroll.total_transfer_amount),
                        bold: true,
                        isPositive: true,
                      },
                    ]}
                  />
                </Grid>

                {/* Leave Breakdown & Meta */}
                <Grid item size={{ xs: 12 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: 'background.neutral',
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      divider={
                        <Box
                          sx={{
                            width: 1,
                            bgcolor: 'divider',
                            alignSelf: 'stretch',
                          }}
                        />
                      }
                    >
                      <Stack spacing={0.25}>
                        <Typography variant="caption" color="text.disabled">
                          Leave Breakdown
                        </Typography>
                        <Typography variant="body2">
                          {renderLeaveBreakdown(payroll.leave_breakdown)}
                        </Typography>
                      </Stack>

                      <Stack spacing={0.25}>
                        <Typography variant="caption" color="text.disabled">
                          Locked
                        </Typography>
                        <Typography variant="body2">{payroll.is_locked ? 'Yes' : 'No'}</Typography>
                      </Stack>

                      <Stack spacing={0.25}>
                        <Typography variant="caption" color="text.disabled">
                          Created By
                        </Typography>
                        <Typography variant="body2">{payroll.creator}</Typography>
                      </Stack>

                      <Stack spacing={0.25}>
                        <Typography variant="caption" color="text.disabled">
                          Created At
                        </Typography>
                        <Typography variant="body2">
                          {payroll.created_at
                            ? new Date(payroll.created_at).toLocaleString()
                            : 'N/A'}
                        </Typography>
                      </Stack>

                      <Stack spacing={0.25}>
                        <Typography variant="caption" color="text.disabled">
                          Updated At
                        </Typography>
                        <Typography variant="body2">
                          {payroll.updated_at
                            ? new Date(payroll.updated_at).toLocaleString()
                            : 'N/A'}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// ----------------------------------------------------------------------

function DetailCard({ title, icon, color, items }) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        height: '100%',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            display: 'flex',
            borderRadius: 0.75,
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${color}.lighter`,
            color: `${color}.main`,
          }}
        >
          <Iconify icon={icon} width={16} />
        </Box>
        <Typography variant="subtitle2" fontSize={12}>
          {title}
        </Typography>
      </Stack>

      <Stack spacing={0.75}>
        {items.map((item) => (
          <Stack
            key={item.label}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="caption" color="text.secondary">
              {item.label}
            </Typography>
            <Typography
              variant="caption"
              fontWeight={item.bold ? 'bold' : 'normal'}
              color={
                item.isNegative ? 'error.main' : item.isPositive ? 'success.main' : 'text.primary'
              }
            >
              {item.value}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
