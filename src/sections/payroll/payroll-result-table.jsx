'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { TablePaginationCustom } from 'src/components/table';

// ----------------------------------------------------------------------

function renderLeaveBreakdown(breakdown) {
  if (!breakdown || typeof breakdown !== 'object' || Object.keys(breakdown).length === 0) {
    return 'None';
  }
  return Object.entries(breakdown)
    .map(([type, days]) => `${type}: ${days}`)
    .join(', ');
}

// ----------------------------------------------------------------------

export function PayrollResultTable({ payrollData }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const payrolls = payrollData?.payrolls || [];

  if (!payrolls.length) {
    return (
      <Card sx={{ p: 3 }}>
        <Alert severity="info" variant="outlined">
          No payroll records available for this period.
        </Alert>
      </Card>
    );
  }

  const { count, month, year, message } = payrollData;

  // Filter payrolls based on search query
  const filteredPayrolls = payrolls.filter((payroll) =>
    payroll.employee?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedPayrolls = filteredPayrolls.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Card>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="solar:document-text-bold-duotone" width={24} />
            <Typography variant="h6">Payroll Details</Typography>
          </Stack>
        }
        subheader={message || `Generated payroll for ${count} employee(s)`}
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label={`${MONTH_NAMES[(month || 1) - 1]} ${year || ''}`}
              color="primary"
              variant="soft"
              size="small"
              icon={<Iconify icon="solar:calendar-bold" />}
            />
            <Chip
              label={`${count || payrolls.length} Employees`}
              color="success"
              variant="soft"
              size="small"
              icon={<Iconify icon="solar:users-group-rounded-bold" />}
            />
          </Stack>
        }
      />

      <CardContent sx={{ pb: 1 }}>
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
      </CardContent>

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
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPayrolls.map((payroll) => (
                <PayrollExpandableRow key={payroll.id} payroll={payroll} />
              ))}

              {paginatedPayrolls.length === 0 && (
                <TableRow>
                  <TableCell colSpan={13} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No employees found matching &quot;{searchQuery}&quot;
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
    </Card>
  );
}

// ----------------------------------------------------------------------

function PayrollExpandableRow({ payroll }) {
  const [open, setOpen] = useState(false);

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
      </TableRow>

      {/* Expandable Detail Row */}
      <TableRow>
        <TableCell colSpan={13} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 1 }}>
              <Grid container spacing={2}>
                {/* Salary Breakdown */}
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <DetailSection
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
                  <DetailSection
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
                  <DetailSection
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
                  <DetailSection
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

function DetailSection({ title, icon, color, items }) {
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
                // eslint-disable-next-line no-nested-ternary
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
