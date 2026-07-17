import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, forwardRef } from 'react';
import { useForm, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Slide from '@mui/material/Slide';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { fData } from 'src/utils/format-number';
import { formatTo12Hour } from 'src/utils/format-time';

import Loading from 'src/app/dashboard/loading';
import {
  useGetUser,
  createEmployee,
  updateEmployee,
  useGetFilteredUsers,
} from 'src/actions/employees';
import {
  STATUS,
  GENDER_OPTIONS,
  RELIGION_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  OFFICE_DAYS_OPTIONS,
  MARITAL_STATUS_OPTIONS,
} from 'src/_mock/options';
import {
  useGetShifts,
  useGetGrades,
  useGetBranches,
  useGetDepartments,
  useGetLeaveGroups,
  useGetDesignations,
  createSupervisorLevel,
  deleteSupervisorLevel,
  updateSupervisorLevel,
  useGetEmployeeSupervisorLevel,
} from 'src/actions/settings';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { useAuthContext } from 'src/auth/hooks';

import { formatToE164 } from './utils/user-utils';
import { EmployeeSchema } from './employee-schema';

// ----------------------------------------------------------------------

const Transition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

// ----------------------------------------------------------------------

function EmergencyContactFields({ name, disabled }) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <>
      {fields.map((field, index) => (
        <Box key={field.id || index} sx={{ mb: 2 }}>
          <Grid container spacing={2} mb={1}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field.Text name={`${name}.${index}.name`} label="Name" disabled={disabled} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field.Text
                name={`${name}.${index}.relationship`}
                label="Relationship"
                disabled={disabled}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field.Phone
                name={`${name}.${index}.phone`}
                label="Phone Number"
                disabled={disabled}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field.Text name={`${name}.${index}.address`} label="Address" disabled={disabled} />
            </Grid>
          </Grid>
          <Button
            onClick={() => remove(index)}
            disabled={disabled}
            color="error"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
          >
            Remove
          </Button>
        </Box>
      ))}
      <Button
        variant="outlined"
        color="primary"
        onClick={() => append({ name: '', relationship: '', phone: '', address: '' })}
        disabled={disabled}
        startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
      >
        Add Emergency Contact
      </Button>
    </>
  );
}

function NomineeFields({ name, disabled }) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <>
      {fields.map((field, index) => (
        <Box key={field.id || field._id || index} sx={{ mb: 2 }}>
          <Grid container spacing={2} mb={1}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field.Text name={`${name}.${index}.name`} label="Nominee Name" disabled={disabled} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field.Text
                name={`${name}.${index}.relationship`}
                label="Relationship"
                disabled={disabled}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field.Phone
                name={`${name}.${index}.phone`}
                label="Phone Number"
                disabled={disabled}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field.Text name={`${name}.${index}.address`} label="Address" disabled={disabled} />
            </Grid>
            <Grid size={12}>
              <Field.Text
                name={`${name}.${index}.percentage`}
                label="Percentage (%)"
                type="number"
                disabled={disabled}
              />
            </Grid>
          </Grid>
          <Button
            onClick={() => remove(index)}
            disabled={disabled}
            color="error"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
          >
            Remove
          </Button>
        </Box>
      ))}
      <Button
        variant="outlined"
        color="primary"
        onClick={() =>
          append({ name: '', relationship: '', phone: '', address: '', percentage: 100 })
        }
        disabled={disabled}
        startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
      >
        Add Nominee
      </Button>
    </>
  );
}

function SupervisorLevelsSection({ employeeId, userId, isAdmin }) {
  const { employeeSupervisorLevel = [], employeeSupervisorLevelLoading } =
    useGetEmployeeSupervisorLevel(employeeId);
  const { users: supervisors = [] } = useGetFilteredUsers({ role1: 'Admin', role2: 'Supervisor' });

  const open = useBoolean();
  const confirmDelete = useBoolean();
  const editDataRef = useRef(null);
  const form = useSetState({ supervisor: '', level: '' });
  const deleteState = useSetState({ id: null });

  const handleOpen = (data = null) => {
    editDataRef.current = data;
    form.setState(
      data ? { supervisor: data.supervisor, level: data.level } : { supervisor: '', level: '' }
    );
    open.onTrue();
  };

  const handleClose = () => {
    open.onFalse();
    editDataRef.current = null;
    form.setState({ supervisor: '', level: '' });
  };

  const handleChange = (e) => {
    form.setField(e.target.name, e.target.value);
  };

  const handleSubmit = async () => {
    const levelValue = Number(form.state.level);
    if (!form.state.supervisor || !form.state.level || levelValue < 1 || levelValue > 3) {
      toast.error('Supervisor level is required and must be between 1 and 3.');
      return;
    }

    try {
      if (editDataRef.current) {
        await updateSupervisorLevel(
          editDataRef.current.id,
          {
            employee: userId,
            supervisor: Number(form.state.supervisor),
            level: levelValue,
          },
          employeeId
        );
        toast.success('Supervisor level updated');
      } else {
        await createSupervisorLevel(
          {
            employee: userId,
            supervisor: Number(form.state.supervisor),
            level: levelValue,
          },
          employeeId
        );
        toast.success('Supervisor level added');
      }
      handleClose();
    } catch (err) {
      toast.error('Failed to save supervisor level');
    }
  };

  const handleDeleteClick = (id) => {
    deleteState.setState({ id });
    confirmDelete.onTrue();
  };

  const handleConfirmDelete = async () => {
    if (!deleteState.state.id) return;
    await handleDelete(deleteState.state.id);
    deleteState.setState({ id: null });
    confirmDelete.onFalse();
  };

  const handleDelete = async (id) => {
    try {
      await deleteSupervisorLevel(id, employeeId, userId);
      toast.success('Supervisor level deleted');
    } catch (err) {
      toast.error('Failed to delete supervisor level');
    }
  };

  if (employeeSupervisorLevelLoading) {
    return <Loading />;
  }

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Supervisor Levels
      </Typography>

      {employeeSupervisorLevel.length === 0 ? (
        <EmptyContent filled title="No data" sx={{ py: 3, height: 'auto', flexGrow: 'unset' }} />
      ) : (
        <Scrollbar>
          <TableContainer sx={{ width: '100%' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width="40">Level</TableCell>
                  <TableCell>Supervisor</TableCell>
                  <TableCell width="40">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employeeSupervisorLevel?.map((row) => (
                  <TableRow key={row?.id}>
                    <TableCell>{row?.level}</TableCell>
                    <TableCell>{row?.supervisor_name}</TableCell>
                    <TableCell>
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                        color="text.secondary"
                      >
                        <Tooltip title="Quick Edit" placement="top" arrow>
                          <IconButton onClick={() => handleOpen(row)} disabled={!isAdmin}>
                            <Iconify icon="solar:pen-bold" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete" placement="top" arrow>
                          <IconButton onClick={() => handleDeleteClick(row.id)} disabled={!isAdmin}>
                            <Iconify icon="solar:trash-bin-trash-bold" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      )}

      <Button
        sx={{ mt: 2 }}
        variant="outlined"
        color="primary"
        onClick={() => handleOpen()}
        disabled={!isAdmin}
        startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
      >
        Add Supervisor Level
      </Button>

      <Dialog
        fullWidth
        maxWidth="sm"
        open={open.value}
        onClose={handleClose}
        TransitionComponent={Transition}
      >
        <DialogTitle>
          {editDataRef.current ? 'Edit Supervisor Level' : 'Add Supervisor Level'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, minWidth: 300 }}>
            <Field.Autocomplete
              name="supervisor"
              label="Supervisor"
              options={supervisors || []}
              value={supervisors?.find((s) => s?.id === form.state.supervisor) || null}
              onChange={(_, value) => form.setField('supervisor', value ? value.id : '')}
              getOptionLabel={(option) =>
                option?.username ? `${option.username} (${option.email})` : ''
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Typography variant="body2">
                    {option?.username} ({option?.email})
                  </Typography>
                </li>
              )}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Level"
              name="level"
              type="number"
              value={form.state.level}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{ min: 1, max: 3 }}
              helperText="Enter a level between 1 and 3"
              error={
                form.state.level !== '' &&
                (Number(form.state.level) < 1 || Number(form.state.level) > 3)
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={!isAdmin}>
            {editDataRef.current ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={() => {
          deleteState.setState({ id: null });
          confirmDelete.onFalse();
        }}
        title="Delete Supervisor Level"
        content="Are you sure you want to delete this supervisor level?"
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete
          </Button>
        }
      />
    </Card>
  );
}

export function UserNewEditForm({ currentEmployee }) {
  const { user } = useAuthContext();

  // Check if user is admin
  const isAdmin = user?.role === 'Admin';

  // Fetch data
  const { departments, departmentsLoading } = useGetDepartments();
  const { designations, designationsLoading } = useGetDesignations();
  const { branches, branchesLoading } = useGetBranches();
  const { shifts, shiftsLoading } = useGetShifts();
  const { leaveGroups, leaveGroupsLoading } = useGetLeaveGroups();
  const { grades, gradesLoading } = useGetGrades();
  const { users } = useGetFilteredUsers({});

  const selectedUserId = currentEmployee?.user?.id;
  const { user: selectedUser, userLoading: selectedUserLoading } = useGetUser({
    id: selectedUserId,
  });

  // Update loading state
  const isLoading =
    departmentsLoading ||
    designationsLoading ||
    branchesLoading ||
    shiftsLoading ||
    leaveGroupsLoading ||
    selectedUserLoading;

  const defaultOfficeDays = currentEmployee?.office_days || 'Sunday-Thursday';
  const isCustomOfficeDays = !OFFICE_DAYS_OPTIONS.includes(defaultOfficeDays);

  const defaultValues = useMemo(
    () => ({
      // User field
      user: currentEmployee?.user?.id || '',

      // Employee basic information
      employee_id: currentEmployee?.employee_id || '',
      employee_name: currentEmployee?.employee_name || '',
      joining_date: currentEmployee?.joining_date ? new Date(currentEmployee.joining_date) : null,
      probation_period_time: currentEmployee?.probation_period_time || 3,
      probation_period: currentEmployee?.probation_period ?? false,
      confirmation_date: currentEmployee?.confirmation_date
        ? new Date(currentEmployee.confirmation_date)
        : null,

      // Office information
      department_id: currentEmployee?.department?.id || null,
      designation_id: currentEmployee?.designation?.id || null,
      location_id: currentEmployee?.location?.id || null,
      office_days: isCustomOfficeDays ? 'Custom' : defaultOfficeDays,
      office_days_custom: isCustomOfficeDays ? defaultOfficeDays : '',
      office_time_id: currentEmployee?.office_time?.id || null,
      official_mobile_number: formatToE164(currentEmployee?.official_mobile_number) || '',
      employment_type: currentEmployee?.employment_type?.id || '',
      salary: currentEmployee?.salary ?? '',
      rfid_or_machine_code: currentEmployee?.rfid_or_machine_code || '',
      grade_id: currentEmployee?.grade?.id || null,
      status: currentEmployee?.status || 'active',

      // Termination details
      resign_terminated_date: currentEmployee?.resign_terminated_date
        ? new Date(currentEmployee.resign_terminated_date)
        : null,
      resign_terminated_reason: currentEmployee?.resign_terminated_reason || '',

      // Personal information
      present_address: currentEmployee?.present_address || '',
      permanent_address: currentEmployee?.permanent_address || '',
      marital_status: currentEmployee?.marital_status || 'single',
      religion: currentEmployee?.religion || '',
      blood_group: currentEmployee?.blood_group || '',
      gender: currentEmployee?.gender || 'male',
      personal_mobile_number: formatToE164(currentEmployee?.personal_mobile_number) || '',
      personal_email_id: currentEmployee?.personal_email_id || '',
      date_of_birth: currentEmployee?.date_of_birth
        ? new Date(currentEmployee.date_of_birth)
        : null,

      // Education & Experience
      last_education: currentEmployee?.last_education || '',
      educational_institute: currentEmployee?.educational_institute || '',
      last_job_experience: currentEmployee?.last_job_experience || '',

      // Profile picture
      profile_picture: currentEmployee?.profile_picture || null,

      // Signature
      signature: currentEmployee?.signature || null,

      // Bank details
      bank_name: currentEmployee?.bank_name || '',
      bank_account_number: currentEmployee?.bank_account_number || '',
      bank_branch: currentEmployee?.bank_branch || '',

      // Attendance settings
      allow_web_login: currentEmployee?.allow_web_login ?? true,
      is_ip_restricted: currentEmployee?.is_ip_restricted ?? false,
      allow_any_ip_attendance: currentEmployee?.allow_any_ip_attendance ?? false,

      // Arrays
      emergency_contact: currentEmployee?.emergency_contact
        ? currentEmployee.emergency_contact.map((c) => ({
            id: c.id,
            name: c.name || '',
            relationship: c.relationship || '',
            phone: c.phone || '',
            address: c.address || '',
          }))
        : [],
      nominee: currentEmployee?.nominee
        ? currentEmployee.nominee.map((n) => ({
            id: n.id,
            name: n.name || '',
            relationship: n.relationship || '',
            phone: n.phone || '',
            address: n.address || '',
            percentage: n.percentage ?? 100,
          }))
        : [],
      supervisor: currentEmployee?.supervisor?.map((s) => Number(s.id)) || [],
      leave_group: currentEmployee?.leave_group?.id || null,
    }),
    [currentEmployee, isCustomOfficeDays, defaultOfficeDays]
  );

  const methods = useForm({
    mode: 'onBlur',
    resolver: zodResolver(EmployeeSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    handleSubmit,
    setValue,
    formState: { isSubmitting, errors },
  } = methods;

  // Reset form when currentEmployee or defaultValues change
  useMemo(() => {
    if (currentEmployee) {
      reset(defaultValues);
    }
  }, [currentEmployee, defaultValues, reset]);

  const values = watch();

  const onSubmit = handleSubmit(
    async (data) => {
      // eslint-disable-next-line prefer-const
      let { office_days, office_days_custom } = data;
      if (office_days === 'Custom') {
        office_days = (office_days_custom || '')
          .replace(/\s+/g, '')
          .replace(/,+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        if (!office_days) {
          office_days = 'Sunday-Thursday';
        }
      }
      const formattedData = {
        ...data,
        office_days,
      };
      delete formattedData.office_days_custom;

      formattedData.joining_date = data.joining_date
        ? new Date(data.joining_date).toISOString().split('T')[0]
        : null;
      formattedData.confirmation_date = data.confirmation_date
        ? new Date(data.confirmation_date).toISOString().split('T')[0]
        : null;
      formattedData.resign_terminated_date = data.resign_terminated_date
        ? new Date(data.resign_terminated_date).toISOString().split('T')[0]
        : null;
      formattedData.date_of_birth = data.date_of_birth
        ? new Date(data.date_of_birth).toISOString().split('T')[0]
        : null;

      try {
        if (currentEmployee) {
          // Update existing employee
          await updateEmployee(currentEmployee.user.id, formattedData);
          toast.success('Employee updated successfully!');
        } else {
          // Create new employee
          await createEmployee(formattedData);
          toast.success('Employee created successfully!');
        }
      } catch (error) {
        console.error('Error saving employee:', error);
        if (error && typeof error === 'object' && !Array.isArray(error)) {
          Object.entries(error).forEach(([field, messages]) => {
            const msg = Array.isArray(messages) ? messages.join(', ') : String(messages);
            toast.error(msg);
          });
        } else {
          toast.error(
            error?.detail || error?.message || 'Failed to save employee. Please try again.'
          );
        }
      }
    },
    (invalid) => {
      // This runs only when there are validation errors on submit
      toast.error('Please fix the errors in the form');
    }
  );

  // Watch values for attendance settings and status
  const allowWebLogin = watch('allow_web_login');
  const isIpRestricted = watch('is_ip_restricted');
  const allowAnyIpAttendance = watch('allow_any_ip_attendance');
  const status = watch('status');

  // Conditions between switches
  useEffect(() => {
    // If allow_web_login is false, untoggle both IP options
    if (!allowWebLogin) {
      if (isIpRestricted) setValue('is_ip_restricted', false);
      if (allowAnyIpAttendance) setValue('allow_any_ip_attendance', false);
    }
    // If both IP options are selected, untoggle the one just toggled
    if (isIpRestricted && allowAnyIpAttendance) {
      // Only allow one to be true
      setValue('allow_any_ip_attendance', false);
    }
  }, [allowWebLogin, isIpRestricted, allowAnyIpAttendance, setValue]);

  // Clear resignation/termination fields when user is re-activated
  useEffect(() => {
    if (status && status !== 'resigned' && status !== 'terminated') {
      // reset regardless of previous value, safe to call each time
      setValue('resign_terminated_date', null);
      setValue('resign_terminated_reason', '');
    }
  }, [status, setValue]);

  // Custom handlers for toggling switches
  const handleWebLoginChange = (event) => {
    const { checked } = event.target;
    setValue('allow_web_login', checked);
    if (!checked) {
      setValue('is_ip_restricted', false);
      setValue('allow_any_ip_attendance', false);
    }
  };

  const handleIpRestrictedChange = (event) => {
    const { checked } = event.target;
    if (checked) {
      // Always select parent if child is selected
      if (!allowWebLogin) setValue('allow_web_login', true);
      // Deselect other child if selected
      if (allowAnyIpAttendance) setValue('allow_any_ip_attendance', false);
      setValue('is_ip_restricted', true);
    } else {
      setValue('is_ip_restricted', false);
    }
  };

  const handleAnyIpAttendanceChange = (event) => {
    const { checked } = event.target;
    if (checked) {
      // Always select parent if child is selected
      if (!allowWebLogin) setValue('allow_web_login', true);
      // Deselect other child if selected
      if (isIpRestricted) setValue('is_ip_restricted', false);
      setValue('allow_any_ip_attendance', true);
    } else {
      setValue('allow_any_ip_attendance', false);
    }
  };

  // Example state for checkboxes
  const [checked, setChecked] = useState([false, false]);

  const handleChange1 = (event) => {
    // Toggle both children when parent is toggled
    setChecked([event.target.checked, event.target.checked]);
  };

  const handleChildChange = (index) => (event) => {
    const updated = [...checked];
    updated[index] = event.target.checked;
    // If either child is checked, parent should be checked
    setChecked([updated[0] || updated[1], updated[1]]);
  };

  // Show loading state
  if (isLoading || (currentEmployee && !currentEmployee.user)) {
    return <Loading />;
  }

  // Predefined office day patterns for custom selection
  const PREDEFINED_OFFICE_DAYS = ['Sunday-Wednesday', 'Monday-Friday', 'Custom'];

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {/* Left Column - Profile Picture & Settings */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, mb: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Profile Picture */}
            <Box sx={{ pt: 10, pb: 5, px: 3 }}>
              <Field.UploadAvatar
                name="profile_picture"
                helperText={
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 3,
                      mx: 'auto',
                      display: 'block',
                      textAlign: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    Allowed *.jpeg, *.jpg, *.png, *.gif
                    <br /> max size of {fData(3145728)}
                  </Typography>
                }
              />
            </Box>

            {/* Signature Upload */}
            <Box sx={{ px: 3, pb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Signature
              </Typography>
              <Field.Upload
                name="signature"
                accept="image/*"
                helperText={
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 1,
                      display: 'block',
                      color: 'text.disabled',
                    }}
                  >
                    Allowed *.jpeg, *.jpg, *.png, *.gif
                    <br /> max size of {fData(3145728)}
                  </Typography>
                }
              />
            </Box>

            {/* Grade */}
            <Box sx={{ px: 3, pb: 3 }}>
              <Field.Autocomplete
                name="grade_id"
                label="Grade"
                placeholder="Search grade"
                disabled={!isAdmin}
                options={grades || []}
                getOptionLabel={(option) => {
                  if (typeof option === 'number') {
                    const grade = grades?.find((g) => g.id === option);
                    return grade ? grade.name : '';
                  }
                  return option?.name || '';
                }}
                isOptionEqualToValue={(option, value) =>
                  option.id === value || option.id === Number(value)
                }
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Typography variant="body2">{option.name}</Typography>
                  </li>
                )}
                onChange={(_, value) => setValue('grade_id', value ? value.id : null)}
                value={grades?.find((g) => g.id === watch('grade_id')) || null}
              />
            </Box>

            <Divider />

            {/* Employee Status */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Status
              </Typography>
              <Field.Select name="status" fullWidth disabled={!isAdmin}>
                {STATUS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')}
                  </MenuItem>
                ))}
              </Field.Select>

              {/* Resign/Termination fields */}
              {(values.status === 'terminated' || values.status === 'resigned') && (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Field.DatePicker
                    name="resign_terminated_date"
                    label="Termination/Resignation Date"
                    fullWidth
                    disabled={!isAdmin}
                  />

                  <Field.Text
                    name="resign_terminated_reason"
                    label="Reason"
                    multiline
                    rows={3}
                    fullWidth
                    disabled={!isAdmin}
                  />
                </Stack>
              )}
            </Box>

            <Divider />

            {/* Attendance Settings */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Attendance Settings
              </Typography>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={allowWebLogin}
                    onChange={handleWebLoginChange}
                    disabled={!isAdmin}
                  />
                }
                label={<Typography variant="body2">Allow Web Login</Typography>}
                sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={isIpRestricted}
                    onChange={handleIpRestrictedChange}
                    disabled={!isAdmin}
                  />
                }
                label={<Typography variant="body2">IP Restricted</Typography>}
                sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={allowAnyIpAttendance}
                    onChange={handleAnyIpAttendanceChange}
                    disabled={!isAdmin}
                  />
                }
                label={<Typography variant="body2">Allow Attendance from Any IP</Typography>}
                sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
              />
            </Box>
          </Card>

          {/* Supervisor Levels */}
          <SupervisorLevelsSection
            employeeId={currentEmployee?.employee_id}
            userId={currentEmployee?.user?.id}
            isAdmin={isAdmin}
          />
        </Grid>

        {/* Right Column - Main Form */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Employment Details */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Employment Details
            </Typography>

            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              {/* User field */}
              <Field.Autocomplete
                name="user"
                label="User Account"
                placeholder="Select User"
                disabled={!isAdmin || !!currentEmployee}
                options={currentEmployee ? (selectedUser ? [selectedUser] : []) : users || []}
                value={selectedUser || null}
                getOptionLabel={(option) => {
                  if (typeof option === 'string' || typeof option === 'number') {
                    const userObj = users?.find((u) => u.id === Number(option));
                    return userObj ? `${userObj.username} (${userObj.email})` : '';
                  }
                  return `${option?.username} (${option?.email})`;
                }}
                isOptionEqualToValue={(option, value) =>
                  option.id === value?.id || option.id === value || option.id === Number(value)
                }
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <div>
                        <Typography variant="subtitle2">{option.username}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {option.email}
                        </Typography>
                      </div>
                    </Stack>
                  </li>
                )}
              />

              <Field.Text name="employee_id" label="Employee ID" disabled={!isAdmin} />

              <Field.Text name="employee_name" label="Employee Name" disabled={!isAdmin} />

              <Field.Autocomplete
                multiple
                name="supervisor"
                label="Supervisors"
                placeholder="Select supervisors"
                disabled
                options={currentEmployee?.supervisor || []}
                getOptionLabel={(option) => {
                  if (typeof option === 'number') {
                    const supervisor = (currentEmployee?.supervisor || []).find(
                      (s) => s.id === option
                    );
                    return supervisor ? `${supervisor.username} (${supervisor.email})` : '';
                  }
                  return `${option?.username} (${option?.email})`;
                }}
                isOptionEqualToValue={(option, value) =>
                  option.id === value || option.id === Number(value)
                }
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Typography variant="body2">
                      {option.username} - {option.email}
                    </Typography>
                  </li>
                )}
                value={currentEmployee?.supervisor || []}
                renderTags={(selected, getTagProps) =>
                  selected.map((value, index) => {
                    const supervisor =
                      typeof value === 'number'
                        ? (currentEmployee?.supervisor || []).find((s) => s.id === value)
                        : value;
                    return (
                      <Chip
                        {...getTagProps({ index })}
                        key={supervisor?.id || index}
                        size="small"
                        variant="soft"
                        label={supervisor?.username || ''}
                      />
                    );
                  })
                }
              />

              {/* Department */}
              <Field.Autocomplete
                name="department_id"
                label="Department"
                placeholder="Search department"
                disabled={!isAdmin}
                options={departments || []}
                getOptionLabel={(option) => {
                  if (typeof option === 'number') {
                    const dept = departments?.find((d) => d.id === option);
                    return dept ? dept.name : '';
                  }
                  return option?.name || '';
                }}
                isOptionEqualToValue={(option, value) =>
                  option.id === value || option.id === Number(value)
                }
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Typography variant="body2">{option.name}</Typography>
                  </li>
                )}
                onChange={(_, value) => setValue('department_id', value ? value.id : null)}
                value={departments?.find((d) => d.id === watch('department_id')) || null}
              />

              {/* Designation */}
              <Field.Autocomplete
                name="designation_id"
                label="Designation"
                placeholder="Search designation"
                disabled={!isAdmin}
                options={designations || []}
                getOptionLabel={(option) => {
                  const format = (d) => {
                    const dept = d?.department_name || (d?.department && d.department.name) || '';
                    return dept ? `${d.name} (${dept})` : d.name || '';
                  };
                  if (typeof option === 'number') {
                    const desig = designations?.find((d) => d.id === option);
                    return desig ? format(desig) : '';
                  }
                  return format(option);
                }}
                isOptionEqualToValue={(option, value) =>
                  option.id === value || option.id === Number(value)
                }
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Stack>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {departments?.find((d) => d.id === option.department)?.name || ''}
                      </Typography>
                    </Stack>
                  </li>
                )}
                onChange={(_, value) => setValue('designation_id', value ? value.id : null)}
                value={designations?.find((d) => d.id === watch('designation_id')) || null}
              />

              {/* Location */}
              <Field.Autocomplete
                name="location_id"
                label="Office Location"
                placeholder="Search location"
                disabled={!isAdmin}
                options={branches || []}
                getOptionLabel={(option) => {
                  if (typeof option === 'number') {
                    const branch = branches?.find((b) => b.id === option);
                    return branch ? branch.name : '';
                  }
                  return option?.name || '';
                }}
                isOptionEqualToValue={(option, value) =>
                  option.id === value || option.id === Number(value)
                }
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Typography variant="body2">{option.name}</Typography>
                  </li>
                )}
                onChange={(_, value) => setValue('location_id', value ? value.id : null)}
                value={branches?.find((b) => b.id === watch('location_id')) || null}
              />

              <Field.Select name="employment_type" label="Employment Type" disabled={!isAdmin}>
                {leaveGroups?.map((group) => (
                  <MenuItem key={group?.id} value={group?.id}>
                    {group?.name}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.DatePicker
                fullWIdth
                name="joining_date"
                label="Joining Date"
                disabled={!isAdmin}
              />

              <Field.Text
                name="probation_period_time"
                label="Probation Period (months)"
                type="number"
                fullWidth
                disabled={!isAdmin}
              />

              <Field.DatePicker
                name="confirmation_date"
                label="Confirmation Date"
                disabled={!isAdmin}
              />

              <Field.Text name="salary" label="Salary" type="number" disabled={!isAdmin} />
            </Box>
          </Card>

          {/* Office Details */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Office Details
            </Typography>

            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <Field.Select name="office_days" label="Office Days" disabled={!isAdmin}>
                {OFFICE_DAYS_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Field.Select>

              {/* Show custom office days input if "Custom" is selected */}
              {watch('office_days') === 'Custom' && (
                <Box>
                  <Field.Text
                    name="office_days_custom"
                    fullWidth
                    placeholder="e.g. Sunday-Wednesday"
                    helperText="Enter days separated by hyphen (e.g. Sunday-Wednesday). Or copy from below."
                    disabled={!isAdmin}
                  />
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                    {PREDEFINED_OFFICE_DAYS.filter((d) => d !== 'Custom').map((pattern) => (
                      <Button
                        key={pattern}
                        size="small"
                        variant="outlined"
                        onClick={async () => {
                          setValue('office_days_custom', pattern.replace(/, /g, '-'));
                        }}
                        disabled={!isAdmin}
                        sx={{ mb: 1 }}
                      >
                        {pattern.replace(/, /g, '-')}
                      </Button>
                    ))}
                  </Stack>
                </Box>
              )}

              <Field.Select name="office_time_id" label="Office Hours" disabled={!isAdmin}>
                {shifts?.map((time) => (
                  <MenuItem key={time.id} value={time.id}>
                    {time?.name} ({formatTo12Hour(time?.office_start_time)} -{' '}
                    {formatTo12Hour(time?.office_end_time)})
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Phone
                name="official_mobile_number"
                label="Official Phone"
                disabled={!isAdmin}
              />

              <Field.Text
                name="rfid_or_machine_code"
                label="RFID/Device Code"
                disabled={!isAdmin}
              />

              {/* Leave Groups & Leave Policies */}
              <Field.Autocomplete
                name="leave_group"
                label="Leave Group"
                placeholder="Select Leave Group"
                disabled={!isAdmin}
                options={leaveGroups || []}
                getOptionLabel={(option) => {
                  if (typeof option === 'number') {
                    const group = leaveGroups?.find((g) => g.id === option);
                    return group ? group.name : '';
                  }
                  return option?.name || '';
                }}
                isOptionEqualToValue={(option, value) =>
                  option.id === value || option.id === Number(value)
                }
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Typography variant="body2">{option.name}</Typography>
                  </li>
                )}
                onChange={(_, value) => setValue('leave_group', value ? value.id : null)}
                value={leaveGroups?.find((g) => g.id === watch('leave_group')) || null}
              />

              <Field.Switch
                name="probation_period"
                label="Probation Period"
                labelPlacement="start"
                disabled={!isAdmin}
                sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
                FormHelperTextProps={{ sx: { ml: 1 } }}
                helperText="Indicates if the employee is in probation period"
              />
            </Box>
          </Card>

          {/* Personal Information */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Personal Information
            </Typography>

            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <Field.DatePicker name="date_of_birth" label="Date of Birth" />

              <Field.Select name="gender" label="Gender">
                {GENDER_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Select name="marital_status" label="Marital Status">
                {MARITAL_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Select name="blood_group" label="Blood Group">
                {BLOOD_GROUP_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Select name="religion" label="Religion">
                {RELIGION_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Phone name="personal_mobile_number" label="Personal Phone" />

              <Field.Text name="personal_email_id" label="Personal Email" />
            </Box>
          </Card>

          {/* Address Information */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Address Information
            </Typography>

            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
              }}
            >
              <Field.Text name="present_address" label="Present Address" multiline rows={3} />

              <Field.Text name="permanent_address" label="Permanent Address" multiline rows={3} />
            </Box>
          </Card>

          {/* Education & Experience */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Education & Experience
            </Typography>

            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
              }}
            >
              <Field.Text name="last_education" label="Last Education" />

              <Field.Text name="educational_institute" label="Educational Institute" />

              <Field.Text
                name="last_job_experience"
                label="Last Job Experience"
                multiline
                rows={3}
              />
            </Box>
          </Card>

          {/* Emergency Contacts */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Emergency Contacts
            </Typography>
            <EmergencyContactFields name="emergency_contact" />
          </Card>

          {/* Nominees */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Nominees
            </Typography>
            <NomineeFields name="nominee" />
          </Card>

          {/* Bank Details */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Bank Details
            </Typography>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <Field.Text name="bank_name" label="Bank Name" disabled={!isAdmin} />

              <Field.Text
                name="bank_account_number"
                label="Bank Account Number"
                disabled={!isAdmin}
              />

              <Field.Text name="bank_branch" label="Bank Branch" disabled={!isAdmin} />
            </Box>
          </Card>

          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              left: 0,
              width: '100%',
              zIndex: 1,
              py: 2,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              loading={isSubmitting}
              startIcon={<Iconify icon="solar:user-id-bold-duotone" />}
              disabled={isSubmitting}
            >
              {currentEmployee ? 'Update Profile' : 'Create Profile'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Form>
  );
}
