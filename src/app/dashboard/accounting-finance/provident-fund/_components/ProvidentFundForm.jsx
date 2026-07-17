'use client';

import dayjs from 'dayjs';
import { useForm, Controller } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CircularProgress from '@mui/material/CircularProgress';

import { endpoints } from 'src/utils/axios';

import { DashboardContent } from 'src/layouts/dashboard';
import { defaultFormValues } from 'src/constants/providentFund';
import { useGetRequest, usePatchMutation, useCreateMutation } from 'src/actions/ledars-hook';
import StatusChip from 'src/app/dashboard/accounting-finance/provident-fund/_components/StatusChip';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

const fmtDate = (d) => (d ? dayjs(d).format('YYYY-MM-DD') : '');

export default function ProvidentFundForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');
  const isEditMode = Boolean(editId);

  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);

  const apiUrl = useMemo(() => (editId ? endpoints.providentFund.byId(editId) : null), [editId]);
  const { data: fetchedData, loading: fetchLoading } = useGetRequest(apiUrl);

  const { trigger: createTrigger } = useCreateMutation(endpoints.providentFund.list);
  const { trigger: updateTrigger } = usePatchMutation(isEditMode ? apiUrl : null);

  // Fetch employee list for dropdown
  const { data: employeesData } = useGetRequest(endpoints.employee.simple);

  const employees = useMemo(() => {
    if (Array.isArray(employeesData)) return employeesData;
    if (Array.isArray(employeesData?.results)) return employeesData.results;
    return [];
  }, [employeesData]);

  // Fetch salary for selected employee
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const salaryUrl = useMemo(
    () => (selectedEmployeeId ? `/api/salaries/?employee_id=${selectedEmployeeId}` : null),
    [selectedEmployeeId]
  );
  const { data: salaryData } = useGetRequest(salaryUrl);

  const salary = useMemo(() => {
    if (Array.isArray(salaryData) && salaryData.length > 0) return salaryData[0];
    if (Array.isArray(salaryData?.results) && salaryData.results.length > 0)
      return salaryData.results[0];
    return null;
  }, [salaryData]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ...defaultFormValues,
      application_date: dayjs().format('YYYY-MM-DD'),
    },
  });

  const isReadOnly = isEditMode && serverStatus && serverStatus !== 'draft';

  // Handle employee selection - auto-fill fields
  const handleEmployeeSelect = useCallback(
    (_, employee) => {
      if (!employee) {
        setSelectedEmployeeId(null);
        return;
      }
      // Use user.id for salary API (employee_id param expects user.id)
      setSelectedEmployeeId(employee.user?.id || employee.id);
      setValue('applicant_name', employee.employee_name || '');
      setValue('designation', employee.designation?.name || '');
      setValue('joining_date', employee.joining_date || '');
      setValue('permanent_date', employee.confirmation_date || '');
    },
    [setValue]
  );

  // Auto-fill salary when salary data loads
  useEffect(() => {
    if (salary && salary.gross_salary) {
      setValue('monthly_total_salary', salary.gross_salary);
    }
  }, [salary, setValue]);

  useEffect(() => {
    if (!fetchedData || !fetchedData.id) return;
    setServerStatus(fetchedData.status);
    reset({
      application_date: fetchedData.application_date || dayjs().format('YYYY-MM-DD'),
      applicant_name: fetchedData.applicant_name || '',
      designation: fetchedData.designation || '',
      joining_date: fetchedData.joining_date || '',
      permanent_date: fetchedData.permanent_date || '',
      monthly_installment_count: fetchedData.monthly_installment_count || '',
      monthly_total_salary: fetchedData.monthly_total_salary || '',
      current_workplace: fetchedData.current_workplace || '',
      program_name: fetchedData.program_name || '',
      expected_loan_amount: fetchedData.expected_loan_amount || '',
      loan_purpose: fetchedData.loan_purpose || '',
      applicant_signature_date: fetchedData.applicant_signature_date || '',
      supervisor_recommendation: fetchedData.supervisor_recommendation || '',
      supervisor_name: fetchedData.supervisor_name || '',
      supervisor_designation: fetchedData.supervisor_designation || '',
      upper_authority_recommendation: fetchedData.upper_authority_recommendation || '',
      upper_authority_name: fetchedData.upper_authority_name || '',
      upper_authority_designation: fetchedData.upper_authority_designation || '',
      pf_total_balance: fetchedData.pf_total_balance || '',
      own_contribution: fetchedData.own_contribution || '',
      org_contribution: fetchedData.org_contribution || '',
      max_loan_eligible: fetchedData.max_loan_eligible || '',
      monthly_interest_principal: fetchedData.monthly_interest_principal || '',
      interest_rate_percent: fetchedData.interest_rate_percent || '',
      installment_count: fetchedData.installment_count || '',
      repayment_months: fetchedData.repayment_months || '',
      accounts_officer_name: fetchedData.accounts_officer_name || '',
      accounts_officer_designation: fetchedData.accounts_officer_designation || '',
      trust_member_1_name: fetchedData.trust_member_1_name || '',
      trust_member_2_name: fetchedData.trust_member_2_name || '',
      secretary_approved_amount: fetchedData.secretary_approved_amount || '',
    });
  }, [fetchedData, reset]);

  const onSubmit = async (submitStatus) => {
    setLoading(true);
    try {
      const formData = watch();
      const payload = {};
      Object.keys(defaultFormValues).forEach((key) => {
        payload[key] = formData[key] || null;
      });
      payload.status = submitStatus;

      if (isEditMode) {
        await updateTrigger(payload);
        toast.success('PF loan application updated successfully!');
      } else {
        await createTrigger(payload);
        toast.success('PF loan application created successfully!');
      }
      router.push('/dashboard/accounting-finance/provident-fund');
    } catch (error) {
      toast.error(error?.detail || error?.message || 'Failed to save');
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  if (fetchLoading) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">
          {isEditMode ? 'Edit PF Loan Application' : 'Create PF Loan Application'}
        </Typography>
        {serverStatus && <StatusChip status={serverStatus} />}
      </Stack>

      {isReadOnly && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This application is in <strong>{serverStatus}</strong> status and cannot be edited.
        </Alert>
      )}

      {/* Section 1 — Application Info */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Applicant Information
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          আবেদনকারীর তথ্য
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="applicant_name"
              control={control}
              rules={{ required: 'Applicant name is required' }}
              render={({ field, fieldState: { error } }) => {
                const selectedEmp = employees.find((e) => e.employee_name === field.value);
                return (
                  <Autocomplete
                    {...field}
                    value={selectedEmp || null}
                    options={employees}
                    getOptionLabel={(option) => option.employee_name || ''}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    onChange={handleEmployeeSelect}
                    disabled={isReadOnly}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Applicant Name"
                        size="small"
                        error={!!error}
                        helperText={error?.message}
                        placeholder="Search employee..."
                      />
                    )}
                  />
                );
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="designation"
              control={control}
              rules={{ required: 'Designation is required' }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Designation"
                  disabled={isReadOnly || !!watch('applicant_name')}
                  size="small"
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="joining_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Joining Date"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(newValue) => field.onChange(fmtDate(newValue))}
                  format="DD/MM/YYYY"
                  disabled={isReadOnly || !!watch('applicant_name')}
                  slotProps={{
                    textField: { size: 'small', fullWidth: true },
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="permanent_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Permanent Date"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(newValue) => field.onChange(fmtDate(newValue))}
                  format="DD/MM/YYYY"
                  disabled={isReadOnly || !!watch('applicant_name')}
                  slotProps={{
                    textField: { size: 'small', fullWidth: true },
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="monthly_installment_count"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Monthly Installment Count"
                  type="number"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="monthly_total_salary"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Monthly Total Salary (Tk)"
                  type="number"
                  disabled={isReadOnly || !!selectedEmployeeId}
                  size="small"
                  helperText={selectedEmployeeId && salary ? 'Auto-filled from salary record' : ''}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="current_workplace"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Current Workplace"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="program_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Program Name"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="expected_loan_amount"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Expected Loan Amount (Tk)"
                  type="number"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="loan_purpose"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Loan Purpose"
                  multiline
                  rows={2}
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="applicant_signature_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Applicant Signature Date"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(newValue) => field.onChange(fmtDate(newValue))}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: { size: 'small', fullWidth: true, disabled: isReadOnly },
                  }}
                />
              )}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Section 2 — Supervisor Recommendation */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Supervisor Recommendation
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          পর্যবেক্ষকের সুপারিশ
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="supervisor_recommendation"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Supervisor Recommendation"
                  multiline
                  rows={3}
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="supervisor_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Supervisor Name"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="supervisor_designation"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Supervisor Designation"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Section 3 — Upper Authority Recommendation */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upper Authority Recommendation
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          শাখা-আঞ্চলিক/প্রকল্প/বিভাগীয় প্রধানের সুপারিশ
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="upper_authority_recommendation"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Upper Authority Recommendation"
                  multiline
                  rows={3}
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="upper_authority_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Upper Authority Name"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="upper_authority_designation"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Upper Authority Designation"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Section 4 — Accounts Officer */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Accounts Officer Section
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          হিসাব কর্মকর্তার অংশ
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="pf_total_balance"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="PF Total Balance (Tk)"
                  type="number"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="own_contribution"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Own Contribution (Tk)"
                  type="number"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="org_contribution"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Org Contribution (Tk)"
                  type="number"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="max_loan_eligible"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Max Loan Eligible (Tk)"
                  type="number"
                  disabled={isReadOnly}
                  size="small"
                  helperText="80% of total after deducting collateral"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="monthly_interest_principal"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Monthly Interest+Principal (Tk)"
                  type="number"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="interest_rate_percent"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Interest Rate (%)"
                  type="number"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="installment_count"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Installment Count"
                  type="number"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="repayment_months"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Repayment Months"
                  type="number"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="accounts_officer_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Accounts Officer Name"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="accounts_officer_designation"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Accounts Officer Designation"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Section 5 — PF Trust Board Members */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          PF Trust Board Members
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          পিএফ ট্রাস্ট বোর্ড সদস্য
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="trust_member_1_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Trust Member 1 Name"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="trust_member_2_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Trust Member 2 Name"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Section 6 — Member Secretary */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Member Secretary
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          সদস্য সচিব
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="secretary_approved_amount"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Secretary Approved Amount (Tk)"
                  type="number"
                  disabled={isReadOnly}
                  size="small"
                  helperText="After deducting previous loan + interest"
                />
              )}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Form buttons */}
      {!isReadOnly && (
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            onClick={() => router.push('/dashboard/accounting-finance/provident-fund')}
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            onClick={() => onSubmit('draft')}
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={16} />
              ) : (
                <Iconify icon="solar:document-bold-duotone" />
              )
            }
          >
            Save as Draft
          </Button>
          <Button
            variant="contained"
            onClick={() => onSubmit('submitted')}
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={16} />
              ) : (
                <Iconify icon="solar:plain-2-bold-duotone" />
              )
            }
          >
            Submit
          </Button>
        </Stack>
      )}
    </DashboardContent>
  );
}
