'use client';

import dayjs from 'dayjs';
import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { DashboardContent } from 'src/layouts/dashboard';
import StatusChip from 'src/app/dashboard/movement-management/_components/StatusChip';
import { emptyScheduleRow, defaultFormValues } from 'src/constants/movementManagement';
import { useGetRequest, usePatchMutation, useCreateMutation } from 'src/actions/ledars-hook';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

const parseNumber = (val) => {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : 0;
};

export default function MovementForm() {
  const router = useRouter();
  const { user } = useAuthContext();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');
  const isEditMode = Boolean(editId);

  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const [originalRowCount, setOriginalRowCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const required = isEditMode ? 'change_movementmanagement' : 'add_movementmanagement';
    const allowed =
      user?.is_superuser || user?.user_permissions_list?.some((p) => p.codename === required);
    if (!allowed) {
      router.replace(paths.page403);
    }
  }, [user, router, isEditMode]);

  const apiUrl = useMemo(
    () => (editId ? endpoints.movementManagement.byId(editId) : null),
    [editId]
  );
  const { data: fetchedData, loading: fetchLoading } = useGetRequest(apiUrl);

  const { data: employeeData } = useGetRequest(endpoints.employee.list);
  const { data: projectData } = useGetRequest(endpoints.projects.projects);

  const employees = useMemo(() => {
    if (Array.isArray(employeeData)) return employeeData;
    return employeeData?.results || [];
  }, [employeeData]);

  const projects = useMemo(() => {
    if (Array.isArray(projectData)) return projectData;
    return projectData?.results || [];
  }, [projectData]);

  const { trigger: createTrigger } = useCreateMutation(endpoints.movementManagement.list);
  const { trigger: updateTrigger } = usePatchMutation(isEditMode ? apiUrl : null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: defaultFormValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'schedule_rows' });

  const scheduleRows = watch('schedule_rows');

  const isReadOnly = isEditMode && serverStatus && serverStatus !== 'draft';

  useEffect(() => {
    if (!fetchedData || !fetchedData.id) return;
    setServerStatus(fetchedData.status);
    const serverRows = fetchedData.schedule_rows?.length > 0 ? fetchedData.schedule_rows : [emptyScheduleRow(1)];
    setOriginalRowCount(serverRows.length);
    reset({
      name: fetchedData.name || '',
      designation: fetchedData.designation || '',
      grade: fetchedData.grade || '',
      purpose_of_travel: fetchedData.purpose_of_travel || '',
      project_name: Array.isArray(fetchedData.project_name) ? fetchedData.project_name : (fetchedData.project_name ? [fetchedData.project_name] : []),
      subtotal_travel: fetchedData.subtotal_travel ?? 0,
      subtotal_food: fetchedData.subtotal_food ?? 0,
      subtotal_lodging: fetchedData.subtotal_lodging ?? 0,
      subtotal_others: fetchedData.subtotal_others ?? 0,
      grand_total: fetchedData.grand_total ?? 0,
      schedule_rows: serverRows,
    });
  }, [fetchedData, reset]);

  const computedSubtotals = useMemo(() => {
    if (!scheduleRows || scheduleRows.length === 0) {
      return { subTravel: 0, subFood: 0, subLodging: 0, subOthers: 0, grand: 0 };
    }
    const subTravel = scheduleRows.reduce((s, r) => s + parseNumber(r.expense_travel), 0);
    const subFood = scheduleRows.reduce((s, r) => s + parseNumber(r.expense_food), 0);
    const subLodging = scheduleRows.reduce((s, r) => s + parseNumber(r.expense_lodging), 0);
    const subOthers = scheduleRows.reduce((s, r) => s + parseNumber(r.expense_others), 0);
    const grand = subTravel + subFood + subLodging + subOthers;
    return { subTravel, subFood, subLodging, subOthers, grand };
  }, [scheduleRows]);

  const handleAddRow = () => {
    const rows = getValues('schedule_rows');
    append(emptyScheduleRow(rows.length + 1));
  };

  const handleRemoveRow = (index) => {
    const rows = getValues('schedule_rows');
    if (rows.length <= 1) return;
    remove(index);
    const remaining = getValues('schedule_rows');
    remaining.forEach((r, i) => {
      r.sl = i + 1;
    });
    setValue('schedule_rows', [...remaining]);
  };

  const onSubmit = async (status) => {
    setLoading(true);
    try {
      const formData = getValues();
      const payload = {
        name: formData.name,
        designation: formData.designation,
        grade: formData.grade,
        purpose_of_travel: formData.purpose_of_travel,
        project_name: formData.project_name,
        schedule_rows: formData.schedule_rows,
        subtotal_travel: computedSubtotals.subTravel,
        subtotal_food: computedSubtotals.subFood,
        subtotal_lodging: computedSubtotals.subLodging,
        subtotal_others: computedSubtotals.subOthers,
        grand_total: computedSubtotals.grand,
        status,
      };

      if (isEditMode) {
        await updateTrigger(payload);
        toast.success('Movement updated successfully!');
        router.push('/dashboard/movement-management');
      } else {
        await createTrigger(payload);
        toast.success('Movement created successfully!');
        router.push('/dashboard/movement-management');
      }
    } catch (error) {
      toast.error(error?.detail || error?.message || 'Failed to save movement');
      setLoading(false);
      return;
    }
    setLoading(false);
    router.push('/dashboard/movement-management');
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
        <Typography variant="h4">{isEditMode ? 'Edit Movement' : 'Create Movement'}</Typography>
        {serverStatus && <StatusChip status={serverStatus} />}
      </Stack>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Header Information
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Name is required' }}
              render={({ field, fieldState: { error } }) => {
                const selectedEmp = employees.find(
                  (e) => (e.employee_name || e.user?.username) === field.value
                );
                return (
                  <Autocomplete
                    options={employees}
                    loading={false}
                    getOptionLabel={(option) =>
                      option?.employee_name || option?.user?.username || ''
                    }
                    value={selectedEmp || null}
                    isOptionEqualToValue={(option, value) => option?.user?.id === value?.user?.id}
                    onChange={(_, newValue) => {
                      field.onChange(newValue ? newValue.employee_name : '');
                      setValue('designation', newValue?.designation?.name || '');
                      setValue('grade', newValue?.grade?.name || '');
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
                        label="Name"
                        error={!!error}
                        helperText={error?.message}
                        disabled={isReadOnly}
                        size="small"
                      />
                    )}
                  />
                );
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="designation"
              control={control}
              rules={{ required: 'Designation is required' }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Designation"
                  disabled={isReadOnly}
                  size="small"
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="grade"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Grade" disabled={isReadOnly} size="small" />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="purpose_of_travel"
              control={control}
              rules={{ required: 'Purpose of travel is required' }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={2}
                  label="Purpose of Travel"
                  disabled={isReadOnly}
                  size="small"
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="project_name"
              control={control}
              rules={{ required: 'Project name is required' }}
              render={({ field, fieldState: { error } }) => {
                const selectedValues = projects.filter(
                  (p) => (field.value || []).includes(p.name)
                );
                return (
                  <Autocomplete
                    multiple
                    options={projects}
                    loading={false}
                    getOptionLabel={(option) => option?.name || option?.code || ''}
                    value={selectedValues}
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    onChange={(_, newValue) => {
                      field.onChange(newValue.map((v) => v.name));
                    }}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        {option.name} ({option.code})
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Name of the Project"
                        error={!!error}
                        helperText={error?.message}
                        size="small"
                      />
                    )}
                  />
                );
              }}
            />
          </Grid>
        </Grid>
      </Card>

      {/* ── Movement Schedule ── */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">Movement Schedule</Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
            onClick={handleAddRow}
          >
            Add Row
          </Button>
        </Stack>

        <Paper variant="outlined" sx={{ overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, textAlign: 'center' }}>
                  Sl
                </TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, textAlign: 'center' }}>
                  Date
                </TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, textAlign: 'center' }}>
                  Travel Route
                </TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, textAlign: 'center' }}>
                  Description
                </TableCell>
                <TableCell colSpan={4} align="center" sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>
                  Approx. Expenses
                </TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 700, textAlign: 'center' }} width={50}>
                  Action
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Travel</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Food</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Lodging</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Others</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell sx={{ textAlign: 'center' }}>{index + 1}</TableCell>
                  <TableCell>
                    <Controller
                      name={`schedule_rows.${index}.date`}
                      control={control}
                      render={({ field: dateField }) => (
                        <DatePicker
                          value={dateField.value ? dayjs(dateField.value) : null}
                          onChange={(newValue) =>
                            dateField.onChange(newValue ? dayjs(newValue).format('YYYY-MM-DD') : '')
                          }
                          format="DD/MM/YYYY"
                          slotProps={{
                            textField: {
                              size: 'small',
                              sx: { minWidth: 130 },
                            },
                          }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`schedule_rows.${index}.travel_route`}
                      control={control}
                      render={({ field: routeField }) => (
                        <TextField
                          {...routeField}
                          size="small"
                          sx={{ minWidth: 140 }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`schedule_rows.${index}.description`}
                      control={control}
                      render={({ field: descField }) => (
                        <TextField
                          {...descField}
                          size="small"
                          sx={{ minWidth: 140 }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`schedule_rows.${index}.expense_travel`}
                      control={control}
                      render={({ field: f }) => (
                        <TextField
                          {...f}
                          size="small"
                          type="number"
                          sx={{ width: 90 }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`schedule_rows.${index}.expense_food`}
                      control={control}
                      render={({ field: f }) => (
                        <TextField
                          {...f}
                          size="small"
                          type="number"
                          sx={{ width: 90 }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`schedule_rows.${index}.expense_lodging`}
                      control={control}
                      render={({ field: f }) => (
                        <TextField
                          {...f}
                          size="small"
                          type="number"
                          sx={{ width: 90 }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`schedule_rows.${index}.expense_others`}
                      control={control}
                      render={({ field: f }) => (
                        <TextField
                          {...f}
                          size="small"
                          type="number"
                          sx={{ width: 90 }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveRow(index)}
                      disabled={fields.length <= 1 || index < originalRowCount}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold-duotone" width={18} />
                      </IconButton>
                    </TableCell>
                </TableRow>
              ))}

              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell colSpan={4} align="right">
                  <strong>Subtotal</strong>
                </TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <strong>{computedSubtotals.subTravel}</strong>
                </TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <strong>{computedSubtotals.subFood}</strong>
                </TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <strong>{computedSubtotals.subLodging}</strong>
                </TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <strong>{computedSubtotals.subOthers}</strong>
                </TableCell>
                <TableCell />
              </TableRow>

              <TableRow sx={{ bgcolor: 'grey.200' }}>
                <TableCell colSpan={4} align="right">
                  <strong>Grand Total</strong>
                </TableCell>
                <TableCell colSpan={4} align="right">
                  <strong>{computedSubtotals.grand}</strong>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      </Card>

      {/* ── Buttons ── */}
      {isEditMode ? (
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mb: 3 }}>
          <Button variant="outlined" onClick={() => router.push('/dashboard/movement-management')}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => onSubmit(serverStatus || 'draft')}
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={16} />
              ) : (
                <Iconify icon="solar:pen-bold" />
              )
            }
          >
            Update
          </Button>
        </Stack>
      ) : (
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mb: 3 }}>
          <Button variant="outlined" onClick={() => router.push('/dashboard/movement-management')}>
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
