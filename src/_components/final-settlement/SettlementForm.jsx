'use client';

import dayjs from 'dayjs';
import { mutate } from 'swr';
import { useForm, Controller } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CircularProgress from '@mui/material/CircularProgress';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetEmployees } from 'src/actions/employees';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetRequest, usePatchMutation, useCreateMutation } from 'src/actions/ledars-hook';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

import StatusChip from './StatusChip';

const DEFAULT_FINANCIAL_ROWS = [
  {
    sn: 1,
    particulars: 'Office advance',
    yes_no: 'No',
    amount: 0,
    due_staff: 0,
    due_ledars: 0,
    remarks: '',
  },
  {
    sn: 2,
    particulars: 'Office (Assets/Materials)',
    yes_no: 'No',
    amount: 0,
    due_staff: 0,
    due_ledars: 0,
    remarks: '',
  },
  {
    sn: 3,
    particulars: 'Office dealings',
    yes_no: 'No',
    amount: 0,
    due_staff: 0,
    due_ledars: 0,
    remarks: '',
  },
  {
    sn: 4,
    particulars: 'Office colleague dealings',
    yes_no: 'No',
    amount: 0,
    due_staff: 0,
    due_ledars: 0,
    remarks: '',
  },
  {
    sn: 5,
    particulars: 'Staff welfare fund (Loan)',
    yes_no: 'No',
    amount: 0,
    due_staff: 0,
    due_ledars: 0,
    remarks: '',
  },
  {
    sn: 6,
    particulars: 'Provident Fund (Loan)',
    yes_no: 'No',
    amount: 0,
    due_staff: 0,
    due_ledars: 0,
    remarks: '',
  },
  {
    sn: 7,
    particulars: 'Staff security fund',
    yes_no: 'No',
    amount: 0,
    due_staff: 0,
    due_ledars: 0,
    remarks: '',
  },
  {
    sn: 8,
    particulars: 'Others dealings (Vendors)',
    yes_no: 'No',
    amount: 0,
    due_staff: 0,
    due_ledars: 0,
    remarks: '',
  },
  {
    sn: 9,
    particulars: 'LEDARS Canteen dealings',
    yes_no: 'No',
    amount: 0,
    due_staff: 0,
    due_ledars: 0,
    remarks: '',
  },
  {
    sn: 10,
    particulars: 'LEDARS Srizon dealings',
    yes_no: 'No',
    amount: 0,
    due_staff: 0,
    due_ledars: 0,
    remarks: '',
  },
  {
    sn: 11,
    particulars: 'LEDARS Provident Fund',
    yes_no: 'No',
    amount: 0,
    due_staff: 0,
    due_ledars: 0,
    remarks: '',
  },
  {
    sn: 12,
    particulars: 'Bank Liabilities',
    yes_no: 'No',
    amount: 0,
    due_staff: 0,
    due_ledars: 0,
    remarks: '',
  },
  {
    sn: 13,
    particulars: 'Salary',
    yes_no: 'No',
    amount: 0,
    due_staff: 0,
    due_ledars: 0,
    remarks: '',
  },
  {
    sn: 14,
    particulars: 'Any others payment (If rule)',
    yes_no: 'No',
    amount: 0,
    due_staff: 0,
    due_ledars: 0,
    remarks: '',
  },
];

const YES_NO_OPTIONS = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];

export default function SettlementForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');
  const isEdit = Boolean(editId);

  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [settlement, setSettlement] = useState(null);

  const apiUrl = useMemo(() => (editId ? endpoints.finalSettlement.byId(editId) : null), [editId]);

  const { data: fetchedSettlement, loading: fetchLoading } = useGetRequest(apiUrl, {
    refreshKey: apiUrl,
  });

  const { trigger: createTrigger } = useCreateMutation(endpoints.finalSettlement.list);
  const { trigger: updateTrigger } = usePatchMutation(isEdit ? apiUrl : null);

  const isReadOnly = isEdit && settlement && !['Draft', 'Rejected'].includes(settlement.status);

  // Track last populated settlement to avoid re-populating on every fetchedSettlement reference change
  const lastPopulatedIdRef = useRef(null);

  const { employees = [], employeesLoading } = useGetEmployees({ status: 'active' });

  const { control, handleSubmit, watch, setValue, reset, getValues } = useForm({
    defaultValues: {
      project_name: '',
      date: dayjs().format('YYYY-MM-DD'),
      name_of_staff: '',
      employee_id: null,
      designation: '',
      joining_date: '',
      resignation_date: '',
      supervisor_opinion: '',
      financial_rows: DEFAULT_FINANCIAL_ROWS.map((r) => ({ ...r })),
      total_amount: 0,
      total_due_staff: 0,
      total_due_ledars: 0,
      final_payment: 0,
      final_payment_words: '',
      loan_rows: [],
      canteen_declaration: '',
      srizon_declaration: '',
      declaration_name: user?.name || '',
      declaration_amount: '',
    },
  });

  // Watch financial rows to auto-calculate totals
  const financialRows = watch('financial_rows');

  // Auto-calculate totals — only update when the computed totals actually differ
  useEffect(() => {
    if (!financialRows || financialRows.length === 0) return;
    const totalAmount = financialRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
    const totalDueStaff = financialRows.reduce(
      (sum, row) => sum + (parseFloat(row.due_staff) || 0),
      0
    );
    const totalDueLedars = financialRows.reduce(
      (sum, row) => sum + (parseFloat(row.due_ledars) || 0),
      0
    );
    const prevTotalAmount = getValues('total_amount');
    const prevTotalDueStaff = getValues('total_due_staff');
    const prevTotalDueLedars = getValues('total_due_ledars');
    if (totalAmount !== prevTotalAmount) setValue('total_amount', totalAmount);
    if (totalDueStaff !== prevTotalDueStaff) setValue('total_due_staff', totalDueStaff);
    if (totalDueLedars !== prevTotalDueLedars) setValue('total_due_ledars', totalDueLedars);
  }, [financialRows, setValue, getValues]);

  // Fetch existing settlement for edit mode
  useEffect(() => {
    if (!editId) {
      // Auto-fill declaration_name in create mode
      if (user?.name) setValue('declaration_name', user.name);
      return;
    }

    if (!fetchedSettlement || !fetchedSettlement.id) return;

    // Guard: only re-populate when we have a new settlement (not on every reference change)
    if (lastPopulatedIdRef.current === fetchedSettlement.id) return;
    lastPopulatedIdRef.current = fetchedSettlement.id;

    setSettlement(fetchedSettlement);

    // Populate form
    Object.keys(fetchedSettlement).forEach((key) => {
      if (
        key === 'created_at' ||
        key === 'updated_at' ||
        key === 'created_by' ||
        key === 'created_by_info'
      )
        return;
      setValue(key, fetchedSettlement[key]);
    });

    if (!fetchedSettlement.declaration_name) {
      const nameVal = user?.name || fetchedSettlement?.created_by_info?.name || '';
      setValue('declaration_name', nameVal);
    }
  }, [editId, fetchedSettlement, setValue, user]);

  const handleFinancialRowChange = useCallback(
    (index, field, value) => {
      const currentRows = getValues('financial_rows');
      const currentValue = currentRows[index]?.[field];
      if (currentValue === value) return;
      const rows = [...currentRows];
      rows[index] = { ...rows[index], [field]: value };
      setValue('financial_rows', rows);
    },
    [getValues, setValue]
  );

  const handleLoanRowChange = useCallback(
    (index, field, value) => {
      const currentRows = getValues('loan_rows');
      const currentValue = currentRows[index]?.[field];
      if (currentValue === value) return;
      const rows = [...currentRows];
      rows[index] = { ...rows[index], [field]: value };
      setValue('loan_rows', rows);
    },
    [getValues, setValue]
  );

  const addLoanRow = useCallback(() => {
    const rows = [...getValues('loan_rows')];
    const newSn = rows.length > 0 ? Math.max(...rows.map((r) => r.sn)) + 1 : 1;
    rows.push({ sn: newSn, date: '', amount: 0, last_date_of_payment: '', remarks: '' });
    setValue('loan_rows', rows);
  }, [getValues, setValue]);

  const removeLoanRow = useCallback(
    (index) => {
      const rows = [...getValues('loan_rows')];
      if (rows.length === 0) return;
      rows.splice(index, 1);
      // Reassign sn
      rows.forEach((r, i) => {
        r.sn = i + 1;
      });
      setValue('loan_rows', rows);
    },
    [getValues, setValue]
  );

  const onSubmit = async (status) => {
    setLoading(true);
    try {
      const formData = getValues();
      formData.status = status;

      if (isEdit) {
        await updateTrigger(formData);
        if (status === 'Submitted') {
          await axiosInstance.post(endpoints.finalSettlement.submit(editId));
        }
        toast.success('Settlement updated successfully!');
        mutate(apiUrl);
      } else {
        const result = await createTrigger(formData);
        if (status === 'Submitted' && result?.id) {
          await axiosInstance.post(endpoints.finalSettlement.submit(result.id));
        }
        toast.success('Settlement created successfully!');
        mutate(endpoints.finalSettlement.list);
      }
      router.push('/dashboard/final-settlement');
    } catch (error) {
      toast.error(error?.detail || error?.message || 'Failed to save settlement');
    } finally {
      setLoading(false);
    }
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
          {isEdit ? 'Edit Final Settlement' : 'Create Final Settlement'}
        </Typography>
        {settlement && <StatusChip status={settlement.status} />}
      </Stack>

      {isReadOnly && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This settlement is in {settlement.status} status and cannot be edited.
        </Alert>
      )}

      {/* Section 1: Header Info */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Header Information
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="project_name"
              control={control}
              rules={{ required: 'Project Name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Project Name"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Controller
              name="name_of_staff"
              control={control}
              rules={{ required: 'Name of Staff is required' }}
              render={({ field, fieldState: { error } }) => (
                <Autocomplete
                  options={employees}
                  loading={employeesLoading}
                  getOptionLabel={(option) => option?.employee_name || option?.user?.username || ''}
                  value={employees?.find((e) => e.employee_name === field.value) || null}
                  isOptionEqualToValue={(option, value) => option?.user?.id === value?.user?.id}
                  onChange={(_, newValue) => {
                    field.onChange(newValue ? newValue.employee_name : '');
                    setValue('employee_id', newValue?.user?.id ?? null);
                    setValue('designation', newValue?.designation?.name || '');
                    setValue('joining_date', newValue?.joining_date || '');
                    setValue('resignation_date', newValue?.resign_terminated_date || '');
                  }}
                  disabled={isReadOnly}
                  renderOption={(props, option) => (
                    <li {...props} key={option.user?.id}>
                      {option.employee_name} ({option.employee_id})
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Name of Staff"
                      error={!!error}
                      helperText={error?.message}
                      disabled={isReadOnly}
                      size="small"
                    />
                  )}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Date"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(newValue) =>
                    field.onChange(newValue ? dayjs(newValue).format('YYYY-MM-DD') : '')
                  }
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: { fullWidth: true, size: 'small', disabled: isReadOnly },
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Controller
              name="designation"
              control={control}
              rules={{ required: 'Designation is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Designation"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>{/* Spacer */}</Grid>
          <Grid size={{ xs: 6 }}>
            <Controller
              name="joining_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Joining Date"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(newValue) =>
                    field.onChange(newValue ? dayjs(newValue).format('YYYY-MM-DD') : '')
                  }
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: { fullWidth: true, size: 'small', disabled: isReadOnly },
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Controller
              name="resignation_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Resignation Date"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(newValue) =>
                    field.onChange(newValue ? dayjs(newValue).format('YYYY-MM-DD') : '')
                  }
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: { fullWidth: true, size: 'small', disabled: isReadOnly },
                  }}
                />
              )}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Section 2: Supervisor Opinion */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Supervisor Opinion
        </Typography>
        <Controller
          name="supervisor_opinion"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              multiline
              rows={4}
              label="Supervisor Opinion"
              disabled={isReadOnly}
            />
          )}
        />
      </Card>

      {/* Section 3: Financial Settlement Table */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Financial Settlement
        </Typography>
        <Paper variant="outlined" sx={{ overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>S/N</TableCell>
                <TableCell>Particulars</TableCell>
                <TableCell>Yes/No</TableCell>
                <TableCell>Amount (Tk)</TableCell>
                <TableCell>Due Amount of Staff</TableCell>
                <TableCell>Due Amount of LEDARS</TableCell>
                <TableCell>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {financialRows.map((row, index) => (
                <TableRow key={row.sn}>
                  <TableCell>{String(row.sn).padStart(2, '0')}</TableCell>
                  <TableCell>{row.particulars}</TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={row.yes_no}
                      onChange={(e) => handleFinancialRowChange(index, 'yes_no', e.target.value)}
                      disabled={isReadOnly}
                      sx={{ minWidth: 80 }}
                    >
                      {YES_NO_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={row.amount}
                      onChange={(e) =>
                        handleFinancialRowChange(index, 'amount', parseFloat(e.target.value) || 0)
                      }
                      disabled={isReadOnly}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={row.due_staff}
                      onChange={(e) =>
                        handleFinancialRowChange(
                          index,
                          'due_staff',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      disabled={isReadOnly}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={row.due_ledars}
                      onChange={(e) =>
                        handleFinancialRowChange(
                          index,
                          'due_ledars',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      disabled={isReadOnly}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={row.remarks}
                      onChange={(e) => handleFinancialRowChange(index, 'remarks', e.target.value)}
                      disabled={isReadOnly}
                      sx={{ width: 150 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell colSpan={3} align="right">
                  <strong>Total</strong>
                </TableCell>
                <TableCell>
                  <strong>{watch('total_amount')}</strong>
                </TableCell>
                <TableCell>
                  <strong>{watch('total_due_staff')}</strong>
                </TableCell>
                <TableCell>
                  <strong>{watch('total_due_ledars')}</strong>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </Paper>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid size={{ xs: 6 }}>
            <Controller
              name="final_payment"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Final Payment of Staff"
                  type="number"
                  disabled={isReadOnly}
                  size="small"
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Controller
              name="final_payment_words"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="In Words"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Section 4: Loan Information Table */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">Loan Information</Typography>
          {!isReadOnly && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
              onClick={addLoanRow}
            >
              Add Row
            </Button>
          )}
        </Stack>

        {watch('loan_rows') && watch('loan_rows').length > 0 ? (
          <Paper variant="outlined" sx={{ overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>S/N</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount (Tk)</TableCell>
                  <TableCell>Last Date of Payment</TableCell>
                  <TableCell>Remarks</TableCell>
                  {!isReadOnly && <TableCell width={50} />}
                </TableRow>
              </TableHead>
              <TableBody>
                {watch('loan_rows').map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.sn}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="date"
                        value={row.date}
                        onChange={(e) => handleLoanRowChange(index, 'date', e.target.value)}
                        disabled={isReadOnly}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 140 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={row.amount}
                        onChange={(e) =>
                          handleLoanRowChange(index, 'amount', parseFloat(e.target.value) || 0)
                        }
                        disabled={isReadOnly}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="date"
                        value={row.last_date_of_payment}
                        onChange={(e) =>
                          handleLoanRowChange(index, 'last_date_of_payment', e.target.value)
                        }
                        disabled={isReadOnly}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 140 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={row.remarks}
                        onChange={(e) => handleLoanRowChange(index, 'remarks', e.target.value)}
                        disabled={isReadOnly}
                        sx={{ width: 150 }}
                      />
                    </TableCell>
                    {!isReadOnly && (
                      <TableCell>
                        <IconButton size="small" color="error" onClick={() => removeLoanRow(index)}>
                          <Iconify icon="solar:trash-bin-trash-bold-duotone" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No loan records added yet. Click &quot;Add Row&quot; to add loan information.
          </Typography>
        )}
      </Card>

      {/* Section 5: Declarations */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Declarations
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <Controller
              name="canteen_declaration"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={3}
                  label="Declaration of Canteen Manager"
                  disabled={isReadOnly}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Controller
              name="srizon_declaration"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={3}
                  label="Declaration of Srizon Manager"
                  disabled={isReadOnly}
                />
              )}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Section 6: Final Declaration Block */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Final Declaration
        </Typography>
        <Paper variant="outlined" sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Box component="div" sx={{ typography: 'body1' }}>
            I declared that I{' '}
            <Controller
              name="declaration_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  size="small"
                  disabled={isReadOnly}
                  sx={{ mx: 1, minWidth: 200, verticalAlign: 'middle' }}
                  placeholder="Full Name"
                />
              )}
            />{' '}
            Finished all financial dealing with LEDARS today. I do not have any due except the
            amount{' '}
            <Controller
              name="declaration_amount"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  size="small"
                  disabled={isReadOnly}
                  sx={{ mx: 1, minWidth: 150, verticalAlign: 'middle' }}
                  placeholder="Amount"
                />
              )}
            />{' '}
            to LEDARS. I cannot claim any benefit to LEDARS in future.
          </Box>
        </Paper>
      </Card>

      {/* Action Buttons */}
      {!isReadOnly && (
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={() => router.push('/dashboard/final-settlement')}>
            Cancel
          </Button>
          {isEdit ? (
            <>
              <Button
                variant="contained"
                onClick={() => onSubmit(getValues('status') || 'Draft')}
                disabled={loading}
                startIcon={
                  loading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Iconify icon="solar:pen-bold-duotone" />
                  )
                }
              >
                Update Draft
              </Button>
              <Button
                variant="contained"
                onClick={() => onSubmit('Submitted')}
                disabled={loading}
                startIcon={
                  loading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Iconify icon="solar:pen-bold-duotone" />
                  )
                }
              >
                Update as Submit
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={() => onSubmit('Draft')}
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
                color="primary"
                onClick={() => onSubmit('Submitted')}
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
            </>
          )}
        </Stack>
      )}
    </DashboardContent>
  );
}
