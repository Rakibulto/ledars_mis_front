'use client';

import dayjs from 'dayjs';
import { useRef, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
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
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import axios, { endpoints } from 'src/utils/axios';

import { DashboardContent } from 'src/layouts/dashboard';
import { emptyExpenseRow, defaultFormValues } from 'src/constants/travelExpense';
import { useGetRequest, usePatchMutation, useCreateMutation } from 'src/actions/ledars-hook';
import StatusChip from 'src/app/dashboard/accounting-finance/transactions/travel-expence/_components/StatusChip';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

const parseNumber = (val) => {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : 0;
};

export default function TravelExpenseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');
  const isEditMode = Boolean(editId);

  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const [pendingFiles, setPendingFiles] = useState({});
  const pendingFilesRef = useRef({});
  pendingFilesRef.current = pendingFiles;

  const apiUrl = useMemo(() => (editId ? endpoints.travelExpense.byId(editId) : null), [editId]);
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

  const { trigger: createTrigger } = useCreateMutation(endpoints.travelExpense.list);
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

  const { fields, append, remove } = useFieldArray({ control, name: 'expense_rows' });

  const expenseRows = watch('expense_rows');

  const isReadOnly = isEditMode && serverStatus && serverStatus !== 'draft';

  useEffect(() => {
    if (!fetchedData || !fetchedData.id) return;
    setServerStatus(fetchedData.status);
    reset({
      project: fetchedData.project || '',
      date_of_submission: fetchedData.date_of_submission || '',
      name: fetchedData.name || '',
      designation: fetchedData.designation || '',
      purpose: fetchedData.purpose || '',
      note: fetchedData.note || '',
      expense_rows:
        fetchedData.expense_rows?.length > 0 ? fetchedData.expense_rows : [emptyExpenseRow()],
    });
  }, [fetchedData, reset]);

  const computedTotals = useMemo(() => {
    if (!expenseRows || expenseRows.length === 0) {
      return { totalTravelFare: 0, totalFood: 0, totalLodging: 0, grand: 0 };
    }
    const totalTravelFare = expenseRows.reduce((s, r) => s + parseNumber(r.travel_fare), 0);
    const totalFood = expenseRows.reduce((s, r) => s + parseNumber(r.food), 0);
    const totalLodging = expenseRows.reduce((s, r) => s + parseNumber(r.lodging), 0);
    const grand = totalTravelFare + totalFood + totalLodging;
    return { totalTravelFare, totalFood, totalLodging, grand };
  }, [expenseRows]);

  useEffect(() => {
    if (!expenseRows) return;
    expenseRows.forEach((r, i) => {
      const t = parseNumber(r.travel_fare) + parseNumber(r.food) + parseNumber(r.lodging);
      if (r.row_total !== t) {
        setValue(`expense_rows.${i}.row_total`, t);
      }
    });
  }, [expenseRows, setValue]);

  const handleAddRow = () => {
    append(emptyExpenseRow());
  };

  const handleRemoveRow = (index) => {
    const rows = getValues('expense_rows');
    if (rows.length <= 1) return;
    remove(index);
  };

  const handleFileUpload = async (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const currentId = editId || fetchedData?.id;
    if (!currentId) {
      setPendingFiles((prev) => ({
        ...prev,
        [index]: [...(prev[index] || []), file],
      }));
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('row_index', index);

    try {
      const res = await axios.post(endpoints.travelExpense.uploadFile(currentId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const currentFiles = getValues(`expense_rows.${index}.files`) || [];
      setValue(`expense_rows.${index}.files`, [...currentFiles, res.data]);
      toast.success('File uploaded successfully');
    } catch (err) {
      toast.error(err?.detail || err?.message || 'Failed to upload file');
    }
    event.target.value = '';
  };

  const uploadPendingFiles = async (recordId) => {
    const { current } = pendingFilesRef;
    const indices = Object.keys(current);
    if (indices.length === 0) return;

    for (const rowIndex of indices) {
      const files = current[rowIndex];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('row_index', rowIndex);

        try {
          const res = await axios.post(endpoints.travelExpense.uploadFile(recordId), formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const currentFiles = getValues(`expense_rows.${rowIndex}.files`) || [];
          setValue(`expense_rows.${rowIndex}.files`, [...currentFiles, res.data]);
        } catch (err) {
          toast.error(err?.detail || err?.message || `Failed to upload file: ${file.name}`);
        }
      }
    }
    setPendingFiles({});
  };

  const handleFileDelete = async (index, fileId) => {
    const currentId = editId || fetchedData?.id;
    if (!currentId) return;

    try {
      await axios.delete(endpoints.travelExpense.deleteFile(currentId, fileId));
      const currentFiles = getValues(`expense_rows.${index}.files`) || [];
      setValue(
        `expense_rows.${index}.files`,
        currentFiles.filter((f) => f.id !== fileId)
      );
      toast.success('File deleted');
    } catch (err) {
      toast.error(err?.detail || 'Failed to delete file');
    }
  };

  const onSubmit = async (status) => {
    setLoading(true);
    try {
      const formData = getValues();
      const payload = {
        project: formData.project,
        date_of_submission: formData.date_of_submission || null,
        name: formData.name,
        designation: formData.designation,
        purpose: formData.purpose,
        note: formData.note,
        expense_rows: formData.expense_rows,
        status,
      };

      if (isEditMode) {
        await updateTrigger(payload);
        toast.success('Travel expense updated successfully!');
      } else {
        const created = await createTrigger(payload);
        const newId = created?.id;
        if (newId) {
          await uploadPendingFiles(newId);
        }
        toast.success('Travel expense created successfully!');
      }
      router.push('/dashboard/accounting-finance/transactions/travel-expence');
    } catch (error) {
      toast.error(error?.detail || error?.message || 'Failed to save travel expense');
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
          {isEditMode ? 'Edit Travel Expense' : 'Create Travel Expense'}
        </Typography>
        {serverStatus && <StatusChip status={serverStatus} />}
      </Stack>

      {isReadOnly && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This travel expense is in <strong>{serverStatus}</strong> status and cannot be edited.
        </Alert>
      )}

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Header Information
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="project"
              control={control}
              render={({ field }) => {
                const selectedProj = projects.find((p) => p.name === field.value);
                return (
                  <Autocomplete
                    options={projects}
                    loading={false}
                    getOptionLabel={(option) => option?.name || option?.code || ''}
                    value={selectedProj || null}
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    onChange={(_, newValue) => {
                      field.onChange(newValue ? newValue.name : '');
                    }}
                    disabled={isReadOnly}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        {option.name} ({option.code})
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField {...params} label="Project" disabled={isReadOnly} size="small" />
                    )}
                  />
                );
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="date_of_submission"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Date of Submission"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(newValue) =>
                    field.onChange(newValue ? dayjs(newValue).format('YYYY-MM-DD') : '')
                  }
                  format="DD/MM/YYYY"
                  disabled={isReadOnly}
                  slotProps={{
                    textField: { size: 'small', fullWidth: true },
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => {
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
                    }}
                    disabled={isReadOnly}
                    renderOption={(props, option) => (
                      <li {...props} key={option.user?.id}>
                        {option.employee_name} ({option.employee_id})
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField {...params} label="Name" disabled={isReadOnly} size="small" />
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
          <Grid size={{ xs: 12 }}>
            <Controller
              name="purpose"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={2}
                  label="Purpose"
                  disabled={isReadOnly}
                  size="small"
                />
              )}
            />
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">Expense Details</Typography>
          {!isReadOnly && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
              onClick={handleAddRow}
            >
              Add Row
            </Button>
          )}
        </Stack>

        <Paper variant="outlined" sx={{ overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Date & Time</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Mode</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Travel Fare</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Food</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Lodging</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Files</TableCell>
                {!isReadOnly && (
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }} width={50}>
                    Action
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell sx={{ textAlign: 'center' }}>{index + 1}</TableCell>
                  <TableCell>
                    <Controller
                      name={`expense_rows.${index}.date_time`}
                      control={control}
                      render={({ field: dtField }) => (
                        <DateTimePicker
                          value={dtField.value ? dayjs(dtField.value) : null}
                          onChange={(newValue) =>
                            dtField.onChange(newValue ? newValue.toISOString() : '')
                          }
                          format="DD/MM/YYYY HH:mm"
                          slotProps={{
                            textField: {
                              size: 'small',
                              sx: { minWidth: 180 },
                              disabled: isReadOnly,
                            },
                          }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`expense_rows.${index}.description`}
                      control={control}
                      render={({ field: descField }) => (
                        <TextField
                          {...descField}
                          size="small"
                          disabled={isReadOnly}
                          sx={{ minWidth: 140 }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`expense_rows.${index}.mode`}
                      control={control}
                      render={({ field: modeField }) => (
                        <TextField
                          {...modeField}
                          size="small"
                          disabled={isReadOnly}
                          sx={{ minWidth: 100 }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`expense_rows.${index}.travel_fare`}
                      control={control}
                      render={({ field: f }) => (
                        <TextField
                          {...f}
                          size="small"
                          type="number"
                          disabled={isReadOnly}
                          sx={{ width: 90 }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`expense_rows.${index}.food`}
                      control={control}
                      render={({ field: f }) => (
                        <TextField
                          {...f}
                          size="small"
                          type="number"
                          disabled={isReadOnly}
                          sx={{ width: 90 }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`expense_rows.${index}.lodging`}
                      control={control}
                      render={({ field: f }) => (
                        <TextField
                          {...f}
                          size="small"
                          type="number"
                          disabled={isReadOnly}
                          sx={{ width: 90 }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <strong>{parseNumber(expenseRows?.[index]?.row_total).toLocaleString()}</strong>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      {(expenseRows?.[index]?.files || []).map((f) => (
                        <Stack key={f.id} direction="row" alignItems="center" spacing={0.5}>
                          <Link
                            href={f.file_url}
                            target="_blank"
                            variant="caption"
                            noWrap
                            sx={{
                              maxWidth: 120,
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {f.original_name}
                          </Link>
                          {!isReadOnly && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleFileDelete(index, f.id)}
                            >
                              <Iconify icon="solar:close-circle-bold" width={14} />
                            </IconButton>
                          )}
                        </Stack>
                      ))}
                      {(pendingFiles[index] || []).map((file, fileIdx) => (
                        <Stack
                          key={`pending-${fileIdx}`}
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                        >
                          <Typography
                            variant="caption"
                            noWrap
                            sx={{
                              maxWidth: 120,
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              color: 'warning.main',
                            }}
                          >
                            {file.name} (pending)
                          </Typography>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setPendingFiles((prev) => ({
                                ...prev,
                                [index]: (prev[index] || []).filter((_, i) => i !== fileIdx),
                              }));
                            }}
                          >
                            <Iconify icon="solar:close-circle-bold" width={14} />
                          </IconButton>
                        </Stack>
                      ))}
                      {!isReadOnly && (
                        <Button
                          component="label"
                          size="small"
                          variant="outlined"
                          startIcon={<CloudUploadIcon sx={{ fontSize: 14 }} />}
                          sx={{ textTransform: 'none', minWidth: 0, py: 0 }}
                        >
                          Upload
                          <input type="file" hidden onChange={(e) => handleFileUpload(index, e)} />
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveRow(index)}
                        disabled={fields.length <= 1}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold-duotone" width={18} />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}

              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell colSpan={4} align="right">
                  <strong>Total</strong>
                </TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <strong>{computedTotals.totalTravelFare}</strong>
                </TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <strong>{computedTotals.totalFood}</strong>
                </TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <strong>{computedTotals.totalLodging}</strong>
                </TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <strong>{computedTotals.grand}</strong>
                </TableCell>
                <TableCell />
                {!isReadOnly && <TableCell />}
              </TableRow>
            </TableBody>
          </Table>
        </Paper>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          (please attach the supporting documents)
        </Typography>
      </Card>

      <Card sx={{ p: 3, mb: 3 }}>
        <Controller
          name="note"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              multiline
              rows={3}
              label="Note"
              disabled={isReadOnly}
              size="small"
            />
          )}
        />
      </Card>

      {!isReadOnly && (
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            onClick={() => router.push('/dashboard/accounting-finance/transactions/travel-expence')}
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
