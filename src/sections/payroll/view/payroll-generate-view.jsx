'use client';

import { z as zod } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import LoadingButton from '@mui/lab/LoadingButton';
import CardContent from '@mui/material/CardContent';
import Autocomplete from '@mui/material/Autocomplete';
import LinearProgress from '@mui/material/LinearProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { generatePayroll } from 'src/actions/payroll';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetSimpleEmployees } from 'src/actions/employees';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PayrollResultTable } from '../payroll-result-table';

// ----------------------------------------------------------------------

const PayrollGenerateSchema = zod
  .object({
    month: zod.number().min(1).max(12, { message: 'Please select a valid month' }),
    year: zod.number().min(2020).max(2035, { message: 'Please select a valid year' }),
    basic_payroll: zod.boolean(),
    festival_bonus: zod.boolean(),
    performance_bonus: zod.boolean(),
    async_generation: zod.boolean(),
    use_date_range: zod.boolean(),
    start_date: zod.string().optional().nullable(),
    end_date: zod.string().optional().nullable(),
    employee_ids: zod.array(zod.number()).optional(),
  })
  .refine(
    (data) => {
      if (data.use_date_range) {
        return !!data.start_date && !!data.end_date;
      }
      return true;
    },
    { message: 'Start and end dates are required for date range mode', path: ['start_date'] }
  );

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const YEARS = Array.from({ length: currentYear - 2026 + 1 }, (_, i) => 2026 + i);

// ----------------------------------------------------------------------

export function PayrollGenerateView() {
  const router = useRouter();

  const [payrollResult, setPayrollResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showEmployeeFilter, setShowEmployeeFilter] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [asyncResult, setAsyncResult] = useState(null);
  const [generateError, setGenerateError] = useState(null);

  const { employees } = useGetSimpleEmployees();

  const defaultValues = useMemo(
    () => ({
      month: currentMonth,
      year: currentYear,
      basic_payroll: true,
      festival_bonus: false,
      performance_bonus: false,
      async_generation: false,
      use_date_range: false,
      start_date: '',
      end_date: '',
      employee_ids: [],
    }),
    []
  );

  const methods = useForm({
    resolver: zodResolver(PayrollGenerateSchema),
    defaultValues,
  });

  const { handleSubmit, reset, control } = methods;

  const asyncGeneration = useWatch({ control, name: 'async_generation' });
  const selectedMonth = useWatch({ control, name: 'month' });
  const selectedYear = useWatch({ control, name: 'year' });
  const basicPayroll = useWatch({ control, name: 'basic_payroll' });
  const festivalBonus = useWatch({ control, name: 'festival_bonus' });
  const performanceBonus = useWatch({ control, name: 'performance_bonus' });
  const useDateRange = useWatch({ control, name: 'use_date_range' });

  // Check if selected month/year is in the future
  const isFuturePeriod =
    selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth);

  const onSubmit = handleSubmit(async (data) => {
    setGenerateError(null);
    setIsGenerating(true);
    setAsyncResult(null);
    try {
      // omit month/year when explicit range is supplied
      const payload = {
        basic_payroll: data.basic_payroll,
        festival_bonus: data.festival_bonus,
        performance_bonus: data.performance_bonus,
        async_generation: data.async_generation,
      };

      if (!(data.use_date_range && data.start_date && data.end_date)) {
        payload.month = data.month;
        payload.year = data.year;
      }

      if (data.use_date_range && data.start_date && data.end_date) {
        payload.start_date = fDate(data.start_date, 'YYYY-MM-DD');
        payload.end_date = fDate(data.end_date, 'YYYY-MM-DD');
      }

      if (selectedEmployees.length > 0) {
        payload.employee_ids = selectedEmployees.map((emp) => emp?.user?.id);
      }

      const result = await generatePayroll(payload);

      if (data.async_generation && result?.async) {
        setAsyncResult(result);
        setPayrollResult(null);
        toast.success(
          result.message ||
            'Payroll generation started in background. You will receive a notification when complete.'
        );
      } else {
        setPayrollResult(result);
        setAsyncResult(null);
        toast.success(
          result.message || `Payroll generated successfully for ${result.count} employee(s)`
        );
      }
    } catch (error) {
      console.error('Error generating payroll:', error);
      const msg = error?.error || 'Failed to generate payroll';
      setGenerateError(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  });

  const handleClearResults = useCallback(() => {
    setPayrollResult(null);
    setAsyncResult(null);
    setGenerateError(null);
  }, []);

  const handleReset = useCallback(() => {
    reset(defaultValues);
    setPayrollResult(null);
    setAsyncResult(null);
    setSelectedEmployees([]);
    setShowEmployeeFilter(false);
    setGenerateError(null);
  }, [reset, defaultValues]);

  const selectedMonthLabel = MONTHS.find((m) => m.value === selectedMonth)?.label || '';

  // Helper: check if a month option should be disabled
  const isMonthDisabled = (monthVal) => {
    if (selectedYear < currentYear) return false;
    if (selectedYear === currentYear) return monthVal > currentMonth;
    return true; // future year = all disabled
  };

  // Compute summary stats from result
  const summaryStats = payrollResult?.payrolls
    ? {
        totalEmployees: payrollResult.count || payrollResult.payrolls.length,
        totalGrossSalary: payrollResult.payrolls.reduce(
          (sum, p) => sum + parseFloat(p.gross_salary || 0),
          0
        ),
        totalNetSalary: payrollResult.payrolls.reduce(
          (sum, p) => sum + parseFloat(p.net_salary || 0),
          0
        ),
        totalDeductions: payrollResult.payrolls.reduce(
          (sum, p) =>
            sum + parseFloat(p.absence_deduction || 0) + parseFloat(p.late_deduction || 0),
          0
        ),
        totalTaxDeduction: payrollResult.payrolls.reduce(
          (sum, p) => sum + parseFloat(p.tax_deduction || 0),
          0
        ),
        totalTransfer: payrollResult.payrolls.reduce(
          (sum, p) => sum + parseFloat(p.total_transfer_amount || 0),
          0
        ),
        totalFestivalBonus: payrollResult.payrolls.reduce(
          (sum, p) => sum + parseFloat(p.festival_bonus || 0),
          0
        ),
        totalPerformanceBonus: payrollResult.payrolls.reduce(
          (sum, p) => sum + parseFloat(p.performance_bonus || 0),
          0
        ),
        avgAttendanceRate:
          payrollResult.payrolls.length > 0
            ? payrollResult.payrolls.reduce((sum, p) => {
                const total = p.working_days || 1;
                return sum + (p.present_days / total) * 100;
              }, 0) / payrollResult.payrolls.length
            : 0,
      }
    : null;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Generate Payroll"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Payroll', href: paths.dashboard.payroll.root },
          { name: 'Generate' },
        ]}
        action={
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:list-bold" />}
            onClick={() => router.push(paths.dashboard.payroll.list)}
          >
            View Payroll List
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {generateError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {generateError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ---- Left Column: Form ---- */}
        <Grid item size={{ xs: 12, sm: 4, md: 3 }}>
          <Stack spacing={3}>
            <Card>
              <CardHeader
                title="Payroll Period"
                subheader="Select month and year for payroll generation"
                avatar={
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      display: 'flex',
                      borderRadius: 1.5,
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'primary.lighter',
                      color: 'primary.main',
                    }}
                  >
                    <Iconify icon="solar:calendar-bold-duotone" width={24} />
                  </Box>
                }
              />
              <CardContent>
                <Form methods={methods} onSubmit={onSubmit}>
                  <Stack spacing={2.5}>
                    <Field.Select name="month" label="Month">
                      {MONTHS.map((month) => (
                        <MenuItem
                          key={month.value}
                          value={month.value}
                          disabled={isMonthDisabled(month.value)}
                        >
                          {month.label}
                          {isMonthDisabled(month.value) && ' (Future)'}
                        </MenuItem>
                      ))}
                    </Field.Select>

                    <Field.Select name="year" label="Year">
                      {YEARS.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Field.Select>

                    {isFuturePeriod && (
                      <Alert severity="warning" variant="outlined" sx={{ py: 0.5 }}>
                        <Typography variant="caption">
                          Cannot generate payroll for a future period.
                        </Typography>
                      </Alert>
                    )}

                    {/* Selected Period Badge */}
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: isFuturePeriod ? 'warning.lighter' : 'primary.lighter',
                        textAlign: 'center',
                      }}
                    >
                      <Typography
                        variant="caption"
                        color={isFuturePeriod ? 'warning.dark' : 'primary.dark'}
                      >
                        Selected Period
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        color={isFuturePeriod ? 'warning.darker' : 'primary.darker'}
                        fontWeight="bold"
                      >
                        {selectedMonthLabel} {selectedYear}
                      </Typography>
                    </Box>

                    <Divider sx={{ borderStyle: 'dashed' }} />

                    {/* Payroll Components */}
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <Iconify icon="solar:document-bold-duotone" width={18} />
                      Payroll Components
                    </Typography>

                    <Stack spacing={0.5}>
                      <Tooltip
                        title="Includes basic salary, house rent, conveyance, and medical allowances"
                        placement="right"
                      >
                        <FormControlLabel
                          control={<Field.Checkbox name="basic_payroll" />}
                          label={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body2">Basic Payroll</Typography>
                              <Chip label="Required" size="small" color="primary" variant="soft" />
                            </Stack>
                          }
                        />
                      </Tooltip>

                      <Tooltip
                        title="Add festival bonus to the payroll calculation"
                        placement="right"
                      >
                        <FormControlLabel
                          control={<Field.Checkbox name="festival_bonus" />}
                          label={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body2">Festival Bonus</Typography>
                              <Chip label="Optional" size="small" variant="outlined" />
                            </Stack>
                          }
                        />
                      </Tooltip>

                      <Tooltip
                        title="Add performance bonus to the payroll calculation"
                        placement="right"
                      >
                        <FormControlLabel
                          control={<Field.Checkbox name="performance_bonus" />}
                          label={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body2">Performance Bonus</Typography>
                              <Chip label="Optional" size="small" variant="outlined" />
                            </Stack>
                          }
                        />
                      </Tooltip>
                    </Stack>

                    <Divider sx={{ borderStyle: 'dashed' }} />

                    {/* Employee Selection */}
                    <Box
                      onClick={() => setShowEmployeeFilter(!showEmployeeFilter)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.72 },
                      }}
                    >
                      <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Iconify icon="solar:users-group-rounded-bold-duotone" width={18} />
                        Employee Selection
                      </Typography>
                      <Iconify
                        icon={
                          showEmployeeFilter
                            ? 'eva:arrow-ios-upward-fill'
                            : 'eva:arrow-ios-downward-fill'
                        }
                        width={18}
                        sx={{ color: 'text.secondary' }}
                      />
                    </Box>

                    <Collapse in={showEmployeeFilter}>
                      <Stack spacing={2}>
                        <Alert severity="info" variant="outlined" sx={{ py: 0.5 }}>
                          <Typography variant="caption">
                            Leave empty to generate for all active employees. Select specific
                            employees to generate payroll only for them.
                          </Typography>
                        </Alert>

                        <Autocomplete
                          multiple
                          size="small"
                          options={employees || []}
                          getOptionLabel={(option) =>
                            option?.employee_name
                              ? `${option.employee_name}${option.employee_id ? ` (${option.employee_id})` : ''}`
                              : option?.user?.username || ''
                          }
                          value={selectedEmployees}
                          onChange={(_, newValue) => setSelectedEmployees(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Employees"
                              placeholder="Search..."
                            />
                          )}
                          renderOption={(props, option) => (
                            <li {...props} key={option?.user?.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar
                                  src={option.profile_picture || ''}
                                  alt={option.employee_name || option.user?.username}
                                  sx={{ width: 24, height: 24 }}
                                />
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                  <Typography variant="body2" color="text.primary">
                                    {option.employee_name || option.user?.username}
                                  </Typography>
                                  {option.employee_id && (
                                    <Typography variant="caption" color="text.secondary">
                                      {option.employee_id}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </li>
                          )}
                          renderTags={(tagValue, getTagProps) =>
                            tagValue.map((option, index) => (
                              <Chip
                                {...getTagProps({ index })}
                                key={option?.user?.id}
                                label={
                                  option?.employee_name ||
                                  option?.user?.username ||
                                  option?.employee_id ||
                                  'Unknown'
                                }
                                variant="soft"
                                color="primary"
                                size="small"
                              />
                            ))
                          }
                          isOptionEqualToValue={(option, value) =>
                            option?.user?.id === value?.user?.id
                          }
                        />

                        {selectedEmployees.length > 0 && (
                          <Typography variant="caption" color="primary.main">
                            {selectedEmployees.length} employee(s) selected
                          </Typography>
                        )}
                      </Stack>
                    </Collapse>

                    {/* Advanced Options */}
                    <Divider sx={{ borderStyle: 'dashed' }} />

                    <Box
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.72 },
                      }}
                    >
                      <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Iconify icon="solar:settings-bold-duotone" width={18} />
                        Advanced Options
                      </Typography>
                      <Iconify
                        icon={
                          showAdvanced ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'
                        }
                        width={18}
                        sx={{ color: 'text.secondary' }}
                      />
                    </Box>

                    <Collapse in={showAdvanced}>
                      <Stack spacing={2}>
                        <FormControlLabel
                          control={<Field.Checkbox name="async_generation" />}
                          label={
                            <Stack>
                              <Typography variant="body2">Background Processing</Typography>
                              <Typography variant="caption" color="text.disabled">
                                Run payroll generation in the background
                              </Typography>
                            </Stack>
                          }
                        />

                        {asyncGeneration && (
                          <Alert
                            severity="info"
                            variant="outlined"
                            icon={<Iconify icon="solar:bell-bing-bold-duotone" />}
                          >
                            <Typography variant="caption">
                              The payroll will be generated in the background. You&apos;ll receive a
                              notification when it&apos;s complete.
                            </Typography>
                          </Alert>
                        )}

                        <Divider sx={{ borderStyle: 'dashed' }} />

                        <FormControlLabel
                          control={<Field.Checkbox name="use_date_range" />}
                          label={
                            <Stack>
                              <Typography variant="body2">Custom Date Range</Typography>
                              <Typography variant="caption" color="text.disabled">
                                Override month/year with explicit start & end dates
                              </Typography>
                            </Stack>
                          }
                        />

                        {useDateRange && (
                          <Stack spacing={2}>
                            <Field.DatePicker
                              name="start_date"
                              label="Start Date"
                              fullWidth
                              openTo="day"
                              format="DD/MM/YYYY"
                            />
                            <Field.DatePicker name="end_date" label="End Date" fullWidth />
                          </Stack>
                        )}
                      </Stack>
                    </Collapse>

                    <Divider sx={{ borderStyle: 'dashed' }} />

                    {/* Active Components Summary */}
                    <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Active Components
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                        {basicPayroll && (
                          <Chip label="Basic" size="small" color="success" variant="soft" />
                        )}
                        {festivalBonus && (
                          <Chip label="Festival" size="small" color="warning" variant="soft" />
                        )}
                        {performanceBonus && (
                          <Chip label="Performance" size="small" color="info" variant="soft" />
                        )}
                        {selectedEmployees.length > 0 && (
                          <Chip
                            label={`${selectedEmployees.length} Employees`}
                            size="small"
                            color="secondary"
                            variant="soft"
                          />
                        )}
                        {!basicPayroll && !festivalBonus && !performanceBonus && (
                          <Typography variant="caption" color="text.disabled">
                            No components selected
                          </Typography>
                        )}
                      </Stack>
                    </Box>

                    {/* Action Buttons */}
                    <LoadingButton
                      fullWidth
                      size="large"
                      type="submit"
                      variant="contained"
                      color="primary"
                      loading={isGenerating}
                      disabled={isFuturePeriod}
                      startIcon={<Iconify icon="solar:play-bold" />}
                    >
                      {isGenerating ? 'Generating...' : 'Generate Payroll'}
                    </LoadingButton>

                    <Stack direction="row" spacing={1}>
                      {(payrollResult || asyncResult) && (
                        <Button
                          fullWidth
                          variant="soft"
                          color="error"
                          onClick={handleClearResults}
                          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        >
                          Clear
                        </Button>
                      )}
                      <Button
                        fullWidth
                        variant="soft"
                        color="inherit"
                        onClick={handleReset}
                        startIcon={<Iconify icon="solar:restart-bold" />}
                      >
                        Reset
                      </Button>
                    </Stack>
                  </Stack>
                </Form>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* ---- Right Column: Results ---- */}
        <Grid item size={{ xs: 12, sm: 8, md: 9 }}>
          {isGenerating && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Stack spacing={2} alignItems="center" sx={{ py: 3 }}>
                  <Iconify
                    icon="svg-spinners:blocks-shuffle-3"
                    width={48}
                    sx={{ color: 'primary.main' }}
                  />
                  <Typography variant="h6">Generating Payroll...</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Processing payroll for {selectedMonthLabel} {selectedYear}. Please wait.
                  </Typography>
                  <LinearProgress sx={{ width: '100%', borderRadius: 1 }} />
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Async background result */}
          {asyncResult && !isGenerating && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'info.lighter',
                    }}
                  >
                    <Iconify
                      icon="solar:bell-bing-bold-duotone"
                      width={40}
                      sx={{ color: 'info.main' }}
                    />
                  </Box>
                  <Typography variant="h6" textAlign="center">
                    Payroll Generation in Progress
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ maxWidth: 480 }}
                  >
                    {asyncResult.message || 'Payroll generation started in the background.'}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip
                      label={`${MONTHS.find((m) => m.value === asyncResult.month)?.label || ''} ${asyncResult.year || ''}`}
                      color="primary"
                      variant="soft"
                      icon={<Iconify icon="solar:calendar-bold" />}
                    />
                  </Stack>
                  <Alert severity="info" variant="outlined" sx={{ mt: 2, maxWidth: 480 }}>
                    <Typography variant="caption">
                      You will receive a notification once the payroll generation is complete. You
                      can navigate away from this page safely.
                    </Typography>
                  </Alert>
                  <Button
                    variant="soft"
                    color="primary"
                    startIcon={<Iconify icon="solar:list-bold" />}
                    onClick={() => router.push(paths.dashboard.payroll.list)}
                    sx={{ mt: 1 }}
                  >
                    Go to Payroll List
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          {payrollResult && !isGenerating && (
            <Stack spacing={3}>
              {/* Summary Statistics Cards */}
              <Grid container spacing={2}>
                <Grid item size={{ xs: 12, sm: 4, md: 3 }}>
                  <StatCard
                    title="Total Employees"
                    value={summaryStats?.totalEmployees || 0}
                    icon="solar:users-group-rounded-bold-duotone"
                    color="primary"
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 4, md: 3 }}>
                  <StatCard
                    title="Total Gross Salary"
                    value={fCurrency(summaryStats?.totalGrossSalary || 0)}
                    icon="solar:wallet-money-bold-duotone"
                    color="success"
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 4, md: 3 }}>
                  <StatCard
                    title="Total Net Salary"
                    value={fCurrency(summaryStats?.totalNetSalary || 0)}
                    icon="solar:hand-money-bold-duotone"
                    color="info"
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 4, md: 3 }}>
                  <StatCard
                    title="Total Deductions"
                    value={fCurrency(summaryStats?.totalDeductions || 0)}
                    icon="solar:minus-circle-bold-duotone"
                    color="error"
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 4, md: 3 }}>
                  <StatCard
                    title="Tax Deduction"
                    value={fCurrency(summaryStats?.totalTaxDeduction || 0)}
                    icon="solar:bill-list-bold-duotone"
                    color="secondary"
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 4, md: 3 }}>
                  <StatCard
                    title="Total Transfer"
                    value={fCurrency(summaryStats?.totalTransfer || 0)}
                    icon="solar:card-transfer-bold-duotone"
                    color="success"
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 4, md: 3 }}>
                  <StatCard
                    title="Avg Attendance"
                    value={`${(summaryStats?.avgAttendanceRate || 0).toFixed(1)}%`}
                    icon="solar:chart-2-bold-duotone"
                    color="info"
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 4, md: 3 }}>
                  <StatCard
                    title="Payroll Period"
                    value={`${MONTHS.find((m) => m.value === payrollResult?.month)?.label || ''} ${payrollResult?.year || ''}`}
                    icon="solar:calendar-mark-bold-duotone"
                    color="primary"
                    isSmallText
                  />
                </Grid>
              </Grid>

              {/* Payroll Result Table */}
              <PayrollResultTable payrollData={payrollResult} />
            </Stack>
          )}

          {!payrollResult && !isGenerating && !asyncResult && (
            <Card
              sx={{
                p: 5,
                textAlign: 'center',
                minHeight: 500,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.neutral',
              }}
            >
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  mb: 3,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.lighter',
                }}
              >
                <Iconify
                  icon="solar:wallet-money-bold-duotone"
                  width={56}
                  sx={{ color: 'primary.main' }}
                />
              </Box>

              <Typography variant="h5" gutterBottom>
                No Payroll Generated Yet
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mb: 3 }}>
                Configure the payroll parameters on the left panel and click &quot;Generate
                Payroll&quot; to process salary calculations for all active employees.
              </Typography>

              <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                <Chip
                  icon={<Iconify icon="solar:check-circle-bold" />}
                  label="Select Period"
                  variant="outlined"
                  color="primary"
                />
                <Chip
                  icon={<Iconify icon="solar:check-circle-bold" />}
                  label="Choose Components"
                  variant="outlined"
                  color="primary"
                />
                <Chip
                  icon={<Iconify icon="solar:play-bold" />}
                  label="Generate"
                  variant="outlined"
                  color="primary"
                />
              </Stack>
            </Card>
          )}
        </Grid>
      </Grid>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function StatCard({ title, value, icon, color = 'primary', isSmallText = false }) {
  return (
    <Card sx={{ p: 2, height: '100%' }}>
      <Stack spacing={1}>
        <Box
          sx={{
            width: 40,
            height: 40,
            display: 'flex',
            borderRadius: 1,
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${color}.lighter`,
            color: `${color}.main`,
          }}
        >
          <Iconify icon={icon} width={22} />
        </Box>
        <Typography variant="caption" color="text.secondary" noWrap>
          {title}
        </Typography>
        <Typography variant={isSmallText ? 'subtitle2' : 'h6'} fontWeight="bold" noWrap>
          {value}
        </Typography>
      </Stack>
    </Card>
  );
}
