'use client';

import { z as zod } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { fCurrency } from 'src/utils/format-number';

import { createSalary, updateSalary } from 'src/actions/salary';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const SalarySchema = zod.object({
  basic: zod.coerce
    .number()
    .refine((v) => v >= 0, { message: 'Basic salary must be positive' })
    .optional()
    .nullable(),
  house_rent: zod.coerce
    .number()
    .refine((v) => v >= 0, { message: 'House rent must be positive' })
    .optional()
    .nullable(),
  conveyance: zod.coerce
    .number()
    .refine((v) => v >= 0, { message: 'Conveyance must be positive' })
    .optional()
    .nullable(),
  medical: zod.coerce
    .number()
    .refine((v) => v >= 0, { message: 'Medical must be positive' })
    .optional()
    .nullable(),
  gross_salary: zod.coerce
    .number()
    .refine((v) => v >= 0, { message: 'Gross salary must be positive' })
    .optional()
    .nullable(),
  festival_bonus: zod.coerce
    .number()
    .refine((v) => v >= 0, { message: 'Festival bonus must be positive' })
    .optional()
    .nullable(),
  performance_bonus: zod.coerce
    .number()
    .refine((v) => v >= 0, { message: 'Performance bonus must be positive' })
    .optional()
    .nullable(),
  absence_deduction: zod.coerce
    .number()
    .refine((v) => v >= 0, { message: 'Absence deduction must be positive' })
    .optional()
    .nullable(),
  is_late_during_holiday: zod.boolean().optional(),
  late_count_threshold: zod.coerce
    .number()
    .int()
    .refine((v) => v >= 0, { message: 'Threshold must be 0 or more' })
    .optional()
    .nullable(),
  late_deduction: zod.coerce
    .number()
    .refine((v) => v >= 0, { message: 'Late deduction must be positive' })
    .optional()
    .nullable(),
  holiday_compensation: zod.coerce
    .number()
    .refine((v) => v >= 0, { message: 'Holiday compensation must be positive' })
    .optional()
    .nullable(),
  weekday_compensation: zod.coerce
    .number()
    .refine((v) => v >= 0, { message: 'Weekday compensation must be positive' })
    .optional()
    .nullable(),
  tax_percentage: zod.coerce
    .number()
    .refine((v) => v >= 0 && v <= 100, { message: 'Tax percentage must be 0-100' })
    .optional()
    .nullable(),
  tax_amount_threshold: zod.coerce
    .number()
    .refine((v) => v >= 0, { message: 'Threshold must be positive' })
    .optional()
    .nullable(),
});

// ----------------------------------------------------------------------

function SalaryField({ name, label, basicSalary, control, setValue, disabled }) {
  const [isPercent, setIsPercent] = useState(false);
  const [percentValue, setPercentValue] = useState('');

  const currentAmount = useWatch({ control, name }) || 0;
  const basic = parseFloat(basicSalary) || 0;

  const handleToggle = useCallback(() => {
    setIsPercent((prev) => {
      if (!prev && basic > 0 && currentAmount > 0) {
        setPercentValue(((parseFloat(currentAmount) / basic) * 100).toFixed(2));
      }
      return !prev;
    });
  }, [basic, currentAmount]);

  useEffect(() => {
    if (isPercent && percentValue && basic > 0) {
      const amount = (parseFloat(percentValue) / 100) * basic;
      setValue(name, parseFloat(amount.toFixed(2)), { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basic]);

  const handlePercentChange = (e) => {
    const pct = e.target.value;
    setPercentValue(pct);
    if (basic > 0 && pct !== '') {
      const amount = (parseFloat(pct || 0) / 100) * basic;
      setValue(name, parseFloat(amount.toFixed(2)), { shouldDirty: true });
    } else {
      setValue(name, 0, { shouldDirty: true });
    }
  };

  return (
    <Stack direction="row" spacing={1} alignItems="flex-start">
      {isPercent ? (
        <TextField
          fullWidth
          label={`${label} (%)`}
          value={percentValue}
          onChange={handlePercentChange}
          type="number"
          placeholder="0"
          disabled={disabled}
          inputProps={{ step: 0.01, min: 0 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Typography variant="caption" color="text.secondary">
                  %
                </Typography>
              </InputAdornment>
            ),
          }}
          helperText={
            basic > 0
              ? `= ${fCurrency(currentAmount)} (${percentValue || 0}% of ${fCurrency(basic)})`
              : 'Enter basic salary first'
          }
        />
      ) : (
        <Field.Text
          name={name}
          label={label}
          type="number"
          placeholder="0"
          disabled={disabled}
          inputProps={{ step: 0.01, min: 0 }}
          helperText={
            basic > 0 && parseFloat(currentAmount) > 0
              ? `= ${((parseFloat(currentAmount) / basic) * 100).toFixed(1)}% of basic`
              : undefined
          }
        />
      )}

      <Tooltip title={isPercent ? 'Switch to amount' : 'Switch to percentage'}>
        <IconButton
          onClick={handleToggle}
          size="small"
          color={isPercent ? 'primary' : 'default'}
          disabled={disabled}
          sx={{
            mt: 1,
            border: (theme) =>
              `1px solid ${isPercent ? theme.palette.primary.main : theme.palette.divider}`,
            borderRadius: 1,
            width: 36,
            height: 36,
          }}
        >
          <Iconify icon={isPercent ? 'mdi:percent' : 'mdi:currency-bdt'} width={18} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

// ----------------------------------------------------------------------

function SectionHeader({ icon, title, subtitle, color = 'primary' }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2, mt: 1 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          display: 'flex',
          borderRadius: 1,
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${color}.lighter`,
          color: `${color}.main`,
        }}
      >
        <Iconify icon={icon} width={20} />
      </Box>
      <Stack spacing={0}>
        <Typography variant="subtitle2">{title}</Typography>
        {subtitle && (
          <Typography variant="caption" color="text.disabled">
            {subtitle}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}

// ----------------------------------------------------------------------

export function AccountSalary({ employee, initialSalary = null }) {
  const { user } = useAuthContext();
  const [editingId, setEditingId] = useState(initialSalary?.id ?? null);
  const [generalError, setGeneralError] = useState('');

  // Permission checks
  const isSelf = user?.id === employee?.user?.id;
  const canAdd = (user?.user_permissions_list || []).some((p) => p.codename === 'add_salary');
  const canChange = (user?.user_permissions_list || []).some((p) => p.codename === 'change_salary');
  const canView = (user?.user_permissions_list || []).some((p) => p.codename === 'view_salary');
  const canEdit = editingId ? canChange : canAdd;

  // Default values
  const defaultValues = useMemo(
    () => ({
      basic: initialSalary?.basic ?? '',
      house_rent: initialSalary?.house_rent ?? '',
      conveyance: initialSalary?.conveyance ?? '',
      medical: initialSalary?.medical ?? '',
      gross_salary: initialSalary?.gross_salary ?? '',
      festival_bonus: initialSalary?.festival_bonus ?? '',
      performance_bonus: initialSalary?.performance_bonus ?? '',
      absence_deduction: initialSalary?.absence_deduction ?? '',
      is_late_during_holiday: initialSalary?.is_late_during_holiday ?? false,
      late_count_threshold: initialSalary?.late_count_threshold ?? 3,
      late_deduction: initialSalary?.late_deduction ?? '',
      holiday_compensation: initialSalary?.holiday_compensation ?? '',
      weekday_compensation: initialSalary?.weekday_compensation ?? '',
      tax_percentage: initialSalary?.tax_percentage ?? '',
      tax_amount_threshold: initialSalary?.tax_amount_threshold ?? '',
    }),
    [initialSalary]
  );

  const methods = useForm({
    mode: 'onBlur',
    resolver: zodResolver(SalarySchema),
    defaultValues,
  });

  const {
    reset,
    control,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Watch fields for live calculation
  const basicValue = useWatch({ control, name: 'basic' });
  const houseRentValue = useWatch({ control, name: 'house_rent' });
  const conveyanceValue = useWatch({ control, name: 'conveyance' });
  const medicalValue = useWatch({ control, name: 'medical' });
  const isLateDuringHoliday = useWatch({ control, name: 'is_late_during_holiday' });

  // Auto-calculate gross salary on the frontend
  const calculatedGross = useMemo(() => {
    const b = parseFloat(basicValue) || 0;
    const h = parseFloat(houseRentValue) || 0;
    const c = parseFloat(conveyanceValue) || 0;
    const m = parseFloat(medicalValue) || 0;
    return Math.ceil(b + h + c + m);
  }, [basicValue, houseRentValue, conveyanceValue, medicalValue]);

  // Sync calculated gross into the form
  useEffect(() => {
    setValue('gross_salary', calculatedGross, { shouldDirty: false });
  }, [calculatedGross, setValue]);

  // Update form state when initialSalary changes
  useEffect(() => {
    reset(defaultValues);
    setEditingId(initialSalary?.id ?? null);
    setGeneralError('');
  }, [defaultValues, reset, initialSalary]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setGeneralError('');

      if (!employee?.user?.id && !editingId) {
        setGeneralError('Employee information is missing.');
        return;
      }

      const payload = {
        ...data,
        employee: employee?.user?.id,
        basic: data.basic ? Number(data.basic) : 0,
        house_rent: data.house_rent ? Number(data.house_rent) : 0,
        conveyance: data.conveyance ? Number(data.conveyance) : 0,
        medical: data.medical ? Number(data.medical) : 0,
        gross_salary: calculatedGross,
        festival_bonus: data.festival_bonus ? Number(data.festival_bonus) : 0,
        performance_bonus: data.performance_bonus ? Number(data.performance_bonus) : 0,
        absence_deduction: data.absence_deduction ? Number(data.absence_deduction) : 0,
        is_late_during_holiday: !!data.is_late_during_holiday,
        late_count_threshold: data.late_count_threshold ? Number(data.late_count_threshold) : 3,
        late_deduction: data.late_deduction ? Number(data.late_deduction) : 0,
        holiday_compensation: data.holiday_compensation ? Number(data.holiday_compensation) : 0,
        weekday_compensation: data.weekday_compensation ? Number(data.weekday_compensation) : 0,
        tax_percentage: data.tax_percentage ? Number(data.tax_percentage) : null,
        tax_amount_threshold: data.tax_amount_threshold ? Number(data.tax_amount_threshold) : null,
      };

      let saved;

      if (editingId) {
        saved = await updateSalary(editingId, payload);
        toast.success('Salary record updated successfully');
        setEditingId(saved?.id ?? editingId);
      } else {
        saved = await createSalary(payload);
        toast.success('Salary record created successfully');
        setEditingId(saved?.id ?? null);
      }

      const savedValues = {
        basic: saved?.basic ?? payload.basic ?? '',
        house_rent: saved?.house_rent ?? payload.house_rent ?? '',
        conveyance: saved?.conveyance ?? payload.conveyance ?? '',
        medical: saved?.medical ?? payload.medical ?? '',
        gross_salary: saved?.gross_salary ?? payload.gross_salary ?? '',
        festival_bonus: saved?.festival_bonus ?? payload.festival_bonus ?? '',
        performance_bonus: saved?.performance_bonus ?? payload.performance_bonus ?? '',
        absence_deduction: saved?.absence_deduction ?? payload.absence_deduction ?? '',
        is_late_during_holiday:
          saved?.is_late_during_holiday ?? payload.is_late_during_holiday ?? false,
        late_count_threshold: saved?.late_count_threshold ?? payload.late_count_threshold ?? 3,
        late_deduction: saved?.late_deduction ?? payload.late_deduction ?? '',
        holiday_compensation: saved?.holiday_compensation ?? payload.holiday_compensation ?? '',
        weekday_compensation: saved?.weekday_compensation ?? payload.weekday_compensation ?? '',
        tax_percentage: saved?.tax_percentage ?? payload.tax_percentage ?? '',
        tax_amount_threshold: saved?.tax_amount_threshold ?? payload.tax_amount_threshold ?? '',
      };

      reset(savedValues);
    } catch (err) {
      console.error(err);
      const errorMessage = err?.detail || err?.message || 'Failed to save salary';
      setGeneralError(errorMessage);
      toast.error(errorMessage);
    }
  });

  // Show permission error if user cannot view
  if (!canView) {
    return (
      <Grid container spacing={3}>
        <Grid item size={12}>
          <Card sx={{ p: 3 }}>
            <Alert severity="info">You do not have permission to view salary information.</Alert>
          </Card>
        </Grid>
      </Grid>
    );
  }

  // If there is no salary record and the user cannot add
  if (!editingId && !canAdd) {
    return (
      <Grid container spacing={3}>
        <Grid item size={12}>
          <Card sx={{ p: 3 }}>
            <Alert severity="warning">You do not have permission to add salary records.</Alert>
          </Card>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item size={12}>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            {editingId ? 'Edit Salary Record' : 'Add Salary Record'}
          </Typography>

          {generalError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGeneralError('')}>
              {generalError}
            </Alert>
          )}

          <Form methods={methods} onSubmit={onSubmit}>
            <Grid container spacing={3}>
              {/* -- Left Column: Salary Components -- */}
              <Grid item size={{ xs: 12, md: 7 }}>
                <Stack spacing={2.5}>
                  {/* Basic Salary */}
                  <SectionHeader
                    icon="solar:wallet-money-bold-duotone"
                    title="Salary Components"
                    subtitle="Basic salary and allowances"
                    color="primary"
                  />

                  <Field.Text
                    name="basic"
                    label="Basic Salary"
                    type="number"
                    placeholder="0"
                    disabled={!canEdit}
                    inputProps={{ step: 0.01, min: 0 }}
                  />

                  <Divider sx={{ borderStyle: 'dashed' }} />

                  {/* Allowances */}
                  <SectionHeader
                    icon="solar:home-2-bold-duotone"
                    title="Allowances"
                    subtitle="Click BDT/% to toggle input mode"
                    color="info"
                  />

                  <SalaryField
                    disabled={!canEdit}
                    name="house_rent"
                    label="House Rent"
                    basicSalary={basicValue}
                    control={control}
                    setValue={setValue}
                  />
                  <SalaryField
                    disabled={!canEdit}
                    name="conveyance"
                    label="Conveyance"
                    basicSalary={basicValue}
                    control={control}
                    setValue={setValue}
                  />
                  <SalaryField
                    disabled={!canEdit}
                    name="medical"
                    label="Medical"
                    basicSalary={basicValue}
                    control={control}
                    setValue={setValue}
                  />

                  <Divider sx={{ borderStyle: 'dashed' }} />

                  {/* Gross Salary (auto-calculated) */}
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      bgcolor: 'primary.lighter',
                      border: (theme) => `1px solid ${theme.palette.primary.light}`,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Iconify
                          icon="solar:calculator-bold-duotone"
                          width={22}
                          sx={{ color: 'primary.main' }}
                        />
                        <Typography variant="subtitle2" color="primary.darker">
                          Gross Salary (Auto-calculated)
                        </Typography>
                      </Stack>
                      <Typography variant="h5" color="primary.darker" fontWeight="bold">
                        {fCurrency(calculatedGross)}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="caption"
                      color="primary.dark"
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      Basic ({fCurrency(basicValue || 0)}) + House Rent (
                      {fCurrency(houseRentValue || 0)}) + Conveyance (
                      {fCurrency(conveyanceValue || 0)}) + Medical ({fCurrency(medicalValue || 0)})
                    </Typography>
                  </Box>

                  <Divider sx={{ borderStyle: 'dashed' }} />

                  {/* Bonuses */}
                  <SectionHeader
                    icon="solar:gift-bold-duotone"
                    title="Bonuses"
                    subtitle="Festival and performance bonuses"
                    color="warning"
                  />

                  <SalaryField
                    disabled={!canEdit}
                    name="festival_bonus"
                    label="Festival Bonus"
                    basicSalary={basicValue}
                    control={control}
                    setValue={setValue}
                  />
                  <SalaryField
                    disabled={!canEdit}
                    name="performance_bonus"
                    label="Performance Bonus"
                    basicSalary={basicValue}
                    control={control}
                    setValue={setValue}
                  />

                  <Divider sx={{ borderStyle: 'dashed' }} />

                  {/* Compensations */}
                  <SectionHeader
                    icon="solar:shield-check-bold-duotone"
                    title="Compensations"
                    subtitle="Holiday and weekday compensations"
                    color="success"
                  />

                  <SalaryField
                    disabled={!canEdit}
                    name="holiday_compensation"
                    label="Holiday Compensation"
                    basicSalary={basicValue}
                    control={control}
                    setValue={setValue}
                  />
                  <SalaryField
                    disabled={!canEdit}
                    name="weekday_compensation"
                    label="Weekday Compensation"
                    basicSalary={basicValue}
                    control={control}
                    setValue={setValue}
                  />
                </Stack>
              </Grid>

              {/* -- Right Column: Deductions, Late Policy, Tax -- */}
              <Grid item size={{ xs: 12, md: 5 }}>
                <Stack spacing={2.5}>
                  {/* Absence Deduction */}
                  <SectionHeader
                    icon="solar:minus-circle-bold-duotone"
                    title="Absence Deduction"
                    subtitle="Per-day deduction for absences"
                    color="error"
                  />

                  <Field.Text
                    name="absence_deduction"
                    label="Absence Deduction"
                    type="number"
                    placeholder="0"
                    disabled={!canEdit}
                    inputProps={{ step: 0.01, min: 0 }}
                  />

                  <Divider sx={{ borderStyle: 'dashed' }} />

                  {/* Late Deduction Policy (grouped) */}
                  <SectionHeader
                    icon="solar:clock-circle-bold-duotone"
                    title="Late Deduction Policy"
                    subtitle="Configure late arrival deduction rules"
                    color="error"
                  />

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      bgcolor: 'background.neutral',
                    }}
                  >
                    <Stack spacing={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={isLateDuringHoliday || false}
                            onChange={(e) =>
                              setValue('is_late_during_holiday', e.target.checked, {
                                shouldDirty: true,
                              })
                            }
                            color="warning"
                          />
                        }
                        label={
                          <Stack spacing={0}>
                            <Typography variant="body2">Apply on holidays/weekends</Typography>
                            <Typography variant="caption" color="text.disabled">
                              If enabled, late deduction applies even on holidays & weekends
                            </Typography>
                          </Stack>
                        }
                      />

                      <Field.Text
                        name="late_count_threshold"
                        label="Late Count Threshold"
                        type="number"
                        placeholder="3"
                        disabled={!canEdit}
                        inputProps={{ step: 1, min: 0 }}
                        helperText="Number of late arrivals allowed before deduction applies"
                      />
                      <Field.Text
                        name="late_deduction"
                        label="Late Deduction Amount"
                        type="number"
                        placeholder="0"
                        disabled={!canEdit}
                        inputProps={{ step: 0.01, min: 0 }}
                        helperText="Amount deducted when late count exceeds threshold"
                      />
                    </Stack>
                  </Box>

                  <Divider sx={{ borderStyle: 'dashed' }} />

                  {/* Tax Configuration (grouped) */}
                  <SectionHeader
                    icon="solar:bill-list-bold-duotone"
                    title="Tax Configuration"
                    subtitle="Income tax deduction from net salary"
                    color="secondary"
                  />

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      bgcolor: 'background.neutral',
                    }}
                  >
                    <Stack spacing={2}>
                      <Field.Text
                        name="tax_percentage"
                        label="Tax Percentage"
                        type="number"
                        placeholder="0"
                        disabled={!canEdit}
                        inputProps={{ step: 0.01, min: 0, max: 100 }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography variant="caption" color="text.secondary">
                                %
                              </Typography>
                            </InputAdornment>
                          ),
                        }}
                        helperText="Percentage to apply on net salary"
                      />

                      <Field.Text
                        name="tax_amount_threshold"
                        label="Tax Amount Threshold"
                        type="number"
                        placeholder="0"
                        disabled={!canEdit}
                        inputProps={{ step: 0.01, min: 0 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography variant="caption" color="text.secondary">
                                BDT
                              </Typography>
                            </InputAdornment>
                          ),
                        }}
                        helperText="Net salary threshold above which tax is deducted"
                      />
                    </Stack>
                  </Box>
                </Stack>
              </Grid>

              {/* -- Submit Buttons (full width) -- */}
              <Grid item size={12}>
                <Divider sx={{ mb: 2 }} />

                {canEdit ? (
                  <Stack direction="row" spacing={2}>
                    <LoadingButton
                      type="submit"
                      loading={isSubmitting}
                      variant="contained"
                      color="primary"
                      startIcon={
                        <Iconify icon={editingId ? 'solar:pen-bold' : 'mingcute:add-line'} />
                      }
                    >
                      {editingId ? 'Update Salary' : 'Create Salary'}
                    </LoadingButton>
                  </Stack>
                ) : (
                  <Alert severity="info">You do not have permission to edit salary records.</Alert>
                )}
              </Grid>
            </Grid>
          </Form>
        </Card>
      </Grid>
    </Grid>
  );
}
