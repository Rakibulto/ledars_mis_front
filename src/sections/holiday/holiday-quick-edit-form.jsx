'use client';

import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useEffect, forwardRef } from 'react';

import Box from '@mui/material/Box';
import Slide from '@mui/material/Slide';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { useGetSimpleEmployees } from 'src/actions/employees';
import { createHoliday, updateHoliday } from 'src/actions/holiday';
import {
  useGetBranches,
  useGetDepartments,
  useGetLeaveGroups,
  useGetDesignations,
} from 'src/actions/settings';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { HolidaySchema } from './holiday-schema';
import { getEmployeeDisplayName } from './utils/holiday-utils';

// ----------------------------------------------------------------------

const Transition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

// ----------------------------------------------------------------------

export function HolidayQuickEditForm({ currentHoliday, open, onClose, addEntry }) {
  const { departments, departmentsLoading } = useGetDepartments(open);
  const { designations, designationsLoading } = useGetDesignations(open);
  const { branches, branchesLoading } = useGetBranches(open);
  const { employees, employeesLoading } = useGetSimpleEmployees(open);
  const { leaveGroups } = useGetLeaveGroups(open);

  const defaultValues = useMemo(
    () => ({
      name: currentHoliday?.name || '',
      from_date: currentHoliday?.from_date || '',
      to_date: currentHoliday?.to_date || '',
      description: currentHoliday?.description || '',
      is_global: currentHoliday?.is_global !== false,
      employment_types: currentHoliday?.employment_types ?? 'all',
      branches: currentHoliday?.branches_data?.map((branch) => branch.id) || [],
      designations: currentHoliday?.designations_data?.map((designation) => designation.id) || [],
      departments: currentHoliday?.departments_data?.map((department) => department.id) || [],
      assigned_employees: currentHoliday?.assigned_employees_data?.map((user) => user.id) || [],
      excluded_employees: currentHoliday?.excluded_employees_data?.map((user) => user.id) || [],
      status: currentHoliday?.status || 'Pending',
      holiday_type:
        currentHoliday?.holiday_type?.length > 0
          ? currentHoliday.holiday_type
          : [
              ...(currentHoliday?.branches_data?.length ? ['Branch'] : []),
              ...(currentHoliday?.departments_data?.length ? ['Department'] : []),
              ...(currentHoliday?.designations_data?.length ? ['Designation'] : []),
              ...((currentHoliday?.employment_types && currentHoliday.employment_types !== 'all') ||
              currentHoliday?.employment_types === null
                ? ['Employee Type']
                : []),
              ...(currentHoliday?.assigned_employees_data?.length ? ['Assigned Employees'] : []),
              ...(currentHoliday?.excluded_employees_data?.length ? ['Excluded Employees'] : []),
            ],
    }),
    [currentHoliday]
  );

  const methods = useForm({
    mode: 'onBlur',
    resolver: zodResolver(HolidaySchema),
    defaultValues,
  });

  const {
    watch,
    reset,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;

  // Reset form when dialog opens
  useMemo(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  const values = watch();

  // Show fields based on holiday_type selection
  const showBranch = values.holiday_type?.includes('Branch');
  const showDepartment = values.holiday_type?.includes('Department');
  const showDesignation = values.holiday_type?.includes('Designation');
  const showEmploymentType = values.holiday_type?.includes('Employee Type');
  const showAssigned = values.holiday_type?.includes('Assigned Employees');
  const showExcluded = values.holiday_type?.includes('Excluded Employees');

  // Clear fields when holiday_type options are deselected
  useEffect(() => {
    if (!showEmploymentType) {
      setValue('employment_types', '');
    }
    if (!showBranch) {
      setValue('branches', []);
    }
    if (!showDepartment) {
      setValue('departments', []);
    }
    if (!showDesignation) {
      setValue('designations', []);
    }
    if (!showAssigned) {
      setValue('assigned_employees', []);
    }
    if (!showExcluded) {
      setValue('excluded_employees', []);
    }
  }, [
    values.holiday_type,
    setValue,
    showEmploymentType,
    showBranch,
    showDepartment,
    showDesignation,
    showAssigned,
    showExcluded,
  ]);

  // Clear all non-global fields when is_global is set to true
  useEffect(() => {
    if (values.is_global) {
      setValue('holiday_type', []);
      setValue('employment_types', '');
      setValue('branches', []);
      setValue('departments', []);
      setValue('designations', []);
      setValue('assigned_employees', []);
      setValue('excluded_employees', []);
    }
  }, [values.is_global, setValue]);

  const isApproved = !addEntry && currentHoliday?.status === 'Approved';

  const onSubmit = async (formData) => {
    const data = {
      ...formData,
      from_date: dayjs(formData.from_date).format('YYYY-MM-DD'),
      to_date: dayjs(formData.to_date).format('YYYY-MM-DD'),
    };

    if (data.employment_types === 'all') {
      data.employment_types = null;
    }

    try {
      if (isApproved) {
        toast.error('Approved holidays cannot be modified');
        return;
      }

      if (addEntry) {
        await createHoliday(data);
        toast.success('Holiday Added Successfully!');
      } else {
        await updateHoliday(currentHoliday.id, data);
        toast.success('Holiday Updated Successfully!');
      }

      reset();
      onClose();
    } catch (error) {
      console.error('Failed to save holiday:', error);
      toast.error(error?.non_field_errors || 'Failed to save holiday. Please try again.');
    }
  };

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose} TransitionComponent={Transition}>
      <Form methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{addEntry ? 'Add Holiday Entry' : 'Quick Update Holiday'}</DialogTitle>

        <DialogContent>
          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            pt={1}
            gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
          >
            <Field.Text
              name="name"
              label="Holiday Name"
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
            />

            <Field.Text
              name="description"
              label="Description"
              fullWidth
              error={!!errors.description}
              helperText={errors.description?.message}
            />

            <Field.DatePicker
              name="from_date"
              label="From Date"
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.from_date,
                  helperText: errors.from_date?.message,
                },
              }}
            />

            <Field.DatePicker
              name="to_date"
              label="To Date"
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.to_date,
                  helperText: errors.to_date?.message,
                },
              }}
            />

            <Field.Select name="is_global" label="Is Global" fullWidth>
              <MenuItem value>Yes</MenuItem>
              <MenuItem value={false}>No</MenuItem>
            </Field.Select>

            {!values.is_global && (
              <>
                <Field.Autocomplete
                  name="holiday_type"
                  label="Holiday Type"
                  multiple
                  options={[
                    'Branch',
                    'Department',
                    'Designation',
                    'Employee Type',
                    'Assigned Employees',
                    'Excluded Employees',
                  ]}
                  value={values.holiday_type || []}
                  onChange={(_, newValue) =>
                    setValue('holiday_type', newValue, { shouldDirty: true })
                  }
                  getOptionLabel={(option) => option}
                  isOptionEqualToValue={(option, value) => option === value}
                  ChipProps={{
                    variant: 'soft',
                    color: 'primary',
                    size: 'small',
                  }}
                />

                {showEmploymentType && (
                  <Field.Select name="employment_types" label="Employment Types" fullWidth>
                    <MenuItem value="all">All</MenuItem>
                    {(leaveGroups || []).map((group) => (
                      <MenuItem key={group?.id} value={group?.id}>
                        {group?.name}
                      </MenuItem>
                    ))}
                  </Field.Select>
                )}

                {showBranch && (
                  <Field.Autocomplete
                    name="branches"
                    label="Branches"
                    multiple
                    options={branches}
                    value={branches.filter((b) => values.branches?.includes(b.id))}
                    onChange={(_, newValue) =>
                      setValue(
                        'branches',
                        newValue.map((b) => b.id),
                        { shouldDirty: true }
                      )
                    }
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    loading={branchesLoading}
                    ChipProps={{
                      variant: 'soft',
                      color: 'primary',
                      size: 'small',
                    }}
                  />
                )}

                {showDepartment && (
                  <Field.Autocomplete
                    name="departments"
                    label="Departments"
                    multiple
                    options={departments}
                    value={departments.filter((d) => values.departments?.includes(d.id))}
                    onChange={(_, newValue) =>
                      setValue(
                        'departments',
                        newValue.map((d) => d.id),
                        { shouldDirty: true }
                      )
                    }
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    loading={departmentsLoading}
                    ChipProps={{
                      variant: 'soft',
                      color: 'primary',
                      size: 'small',
                    }}
                  />
                )}

                {showDesignation && (
                  <Field.Autocomplete
                    name="designations"
                    label="Designations"
                    multiple
                    options={designations}
                    value={designations.filter((d) => values.designations?.includes(d.id))}
                    onChange={(_, newValue) =>
                      setValue(
                        'designations',
                        newValue.map((d) => d.id),
                        { shouldDirty: true }
                      )
                    }
                    getOptionLabel={(option) => {
                      const format = (d) => {
                        const dept =
                          d?.department_name || (d?.department && d.department.name) || '';
                        return dept ? `${d.name} (${dept})` : d.name || '';
                      };
                      if (typeof option === 'number') {
                        const desig = designations?.find((d) => d.id === option);
                        return desig ? format(desig) : '';
                      }
                      return format(option);
                    }}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    loading={designationsLoading}
                    ChipProps={{
                      variant: 'soft',
                      color: 'primary',
                      size: 'small',
                    }}
                  />
                )}

                {showAssigned && (
                  <Field.Autocomplete
                    name="assigned_employees"
                    label="Assigned Employees"
                    multiple
                    options={employees}
                    value={employees.filter((u) =>
                      values.assigned_employees?.includes(u.user?.id || u.id)
                    )}
                    onChange={(_, newValue) =>
                      setValue(
                        'assigned_employees',
                        newValue.map((u) => u.user?.id || u.id),
                        { shouldDirty: true }
                      )
                    }
                    getOptionLabel={(option) => getEmployeeDisplayName(option)}
                    isOptionEqualToValue={(option, value) =>
                      (option.user?.id || option.id) === (value.user?.id || value.id)
                    }
                    loading={employeesLoading}
                    renderOption={(props, option) => (
                      <li {...props} key={option.user?.id || option.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            src={option.profile_picture || ''}
                            alt={option.employee_name || option.user?.username}
                            sx={{ width: 24, height: 24 }}
                          />
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" color="text.primary">
                              {getEmployeeDisplayName(option)}
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
                    ChipProps={{
                      variant: 'soft',
                      color: 'primary',
                      size: 'small',
                    }}
                  />
                )}

                {showExcluded && (
                  <Field.Autocomplete
                    name="excluded_employees"
                    label="Excluded Employees"
                    multiple
                    options={employees}
                    value={employees.filter((u) =>
                      values.excluded_employees?.includes(u.user?.id || u.id)
                    )}
                    onChange={(_, newValue) =>
                      setValue(
                        'excluded_employees',
                        newValue.map((u) => u.user?.id || u.id),
                        { shouldDirty: true }
                      )
                    }
                    getOptionLabel={(option) => getEmployeeDisplayName(option)}
                    isOptionEqualToValue={(option, value) =>
                      (option.user?.id || option.id) === (value.user?.id || value.id)
                    }
                    loading={employeesLoading}
                    renderOption={(props, option) => (
                      <li {...props} key={option.user?.id || option.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            src={option.profile_picture || ''}
                            alt={option.employee_name || option.user?.username}
                            sx={{ width: 24, height: 24 }}
                          />
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" color="text.primary">
                              {getEmployeeDisplayName(option)}
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
                    ChipProps={{
                      variant: 'soft',
                      color: 'primary',
                      size: 'small',
                    }}
                  />
                )}
              </>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>

          <LoadingButton type="submit" variant="contained" loading={isSubmitting} color="primary">
            {addEntry ? 'Add' : 'Update'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
