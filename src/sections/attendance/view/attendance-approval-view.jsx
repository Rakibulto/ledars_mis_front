'use client';

import dayjs from 'dayjs';
import { z as zod } from 'zod';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { useSetState } from 'src/hooks/use-set-state';

import { fDate, fTime } from 'src/utils/format-time';

import { useGetDepartments } from 'src/actions/settings';
import { useGetSimpleEmployees } from 'src/actions/employees';
import { ADJUSTMENT_TYPES, APPROVAL_STATUS_OPTIONS } from 'src/_mock/options';
import { updateAttendanceApproval, useGetAttendanceApprovals } from 'src/actions/attendance';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { SettingsEntityView } from 'src/sections/settings/settings-entity-view';

import { useAuthContext } from 'src/auth/hooks';

// Zod schema for update form
const ApprovalSchema = zod.object({
  status: zod.string().min(1, { message: 'Status is required' }),
  comments: zod.string().nullable().optional(),
});

export function AttendanceApprovalView() {
  const { user } = useAuthContext();

  const canChangeApproval = user?.user_permissions_list?.some(
    (p) => p.codename === 'change_attendanceadjustmentapproval'
  );

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  // Filter state
  const filters = useSetState({
    employee: '',
    department: '',
    adjustmentType: '',
    status: '',
    startDate: null,
    endDate: null,
  });

  // build params for API
  const params = useMemo(() => {
    const p = {
      pagination: true,
      page,
      page_size: pageSize,
    };
    if (filters.state.employee) p.employee_name = filters.state.employee;
    if (filters.state.department) p.department = filters.state.department;
    if (filters.state.adjustmentType) p.adjustment_request_name = filters.state.adjustmentType;
    if (filters.state.status) p.status = filters.state.status;
    if (filters.state.startDate) p.start_date = dayjs(filters.state.startDate).format('YYYY-MM-DD');
    if (filters.state.endDate) p.end_date = dayjs(filters.state.endDate).format('YYYY-MM-DD');
    return p;
  }, [page, pageSize, filters.state]);

  // Fetch approvals with backend filters/pagination
  const { approvals, approvalsLoading, approvalsError, pagination } = useGetAttendanceApprovals({
    id: null,
    params,
  });

  const { employees: allEmployees = [] } = useGetSimpleEmployees();
  const { departments = [] } = useGetDepartments();

  const employeeOptions = useMemo(
    () => allEmployees.filter((emp) => emp.employee_name),
    [allEmployees]
  );

  const departmentOptions = useMemo(
    () => departments.map((dept) => dept.name).filter(Boolean),
    [departments]
  );

  const adjustmentTypeOptions = useMemo(() => ADJUSTMENT_TYPES, []);

  // Pagination callbacks
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page
  };

  const handleFilterChange = (filterParams) => {
    if (filterParams.employee !== undefined) filters.setField('employee', filterParams.employee);
    if (filterParams.department !== undefined)
      filters.setField('department', filterParams.department);
    if (filterParams.adjustmentType !== undefined)
      filters.setField('adjustmentType', filterParams.adjustmentType);
    if (filterParams.status !== undefined) filters.setField('status', filterParams.status);
    if (filterParams.startDate !== undefined) filters.setField('startDate', filterParams.startDate);
    if (filterParams.endDate !== undefined) filters.setField('endDate', filterParams.endDate);
    setPage(1); // Reset to first page when filters change
  };

  // Table columns
  const FIELDS = useMemo(
    () => [
      {
        name: 'employee_name',
        label: 'Employee',
        width: 220,
        transform: (value, row) => (
          <Box>
            <Typography variant="subtitle2" color="text.primary">
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.department || 'No Department'}
            </Typography>
          </Box>
        ),
      },
      {
        name: 'status_and_action_date',
        label: 'Status',
        transform: (value, row) => {
          const statusValue = row.status;
          const actionDateValue = row.action_date;

          const statusConfig = {
            pending: { color: 'warning', icon: 'solar:clock-circle-bold', label: 'Pending Review' },
            approved: { color: 'success', icon: 'solar:check-circle-bold', label: 'Approved' },
            rejected: { color: 'error', icon: 'solar:close-circle-bold', label: 'Rejected' },
          };

          const config = statusConfig[statusValue] || {
            color: 'default',
            icon: 'solar:question-circle-bold',
            label: 'Unknown',
          };

          return (
            <Tooltip title={config.label} arrow>
              <Box>
                <Label
                  color={config.color}
                  variant="soft"
                  startIcon={<Iconify icon={config.icon} />}
                  sx={{ mb: 0.5 }}
                >
                  {statusValue
                    ? statusValue.charAt(0).toUpperCase() + statusValue.slice(1)
                    : 'Unknown'}
                </Label>
                {actionDateValue ? (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {fDate(actionDateValue, 'DD-MM-YYYY')}
                    </Typography>
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {fTime(actionDateValue, 'h:mm a')}
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontStyle: 'italic' }}
                    >
                      Not processed
                    </Typography>
                  </Box>
                )}
              </Box>
            </Tooltip>
          );
        },
      },
      {
        name: 'adjustment_request_name',
        label: 'Request Type',
        transform: (value) => {
          const found = ADJUSTMENT_TYPES.find((type) => type.value === value);
          return (
            <Typography variant="body2" color="text.primary" fontWeight="medium">
              {found ? found.label : value}
            </Typography>
          );
        },
      },
      {
        name: 'check_type',
        label: 'Check Type',
        transform: (value) => {
          if (value === 'check_in') {
            return (
              <Label
                color="success"
                variant="soft"
                startIcon={<Iconify icon="solar:login-2-bold" />}
              >
                Check In
              </Label>
            );
          }
          if (value === 'check_out') {
            return (
              <Label color="info" variant="soft" startIcon={<Iconify icon="solar:logout-2-bold" />}>
                Check Out
              </Label>
            );
          }
          return '';
        },
      },
      {
        name: 'actual_duty_start_time',
        label: 'Duty Start / End Time',
        width: 110,
        transform: (value) => (
          <Typography variant="caption" color="text.primary">
            {value ? fTime(value, 'h:mm a') : '-'}
          </Typography>
        ),
      },
      {
        name: 'actual_arrival_time',
        label: 'Actual Arrival / Departure Time',
        transform: (value) =>
          value ? (
            <Tooltip title="Actual recorded time" arrow>
              <Box>
                <Typography variant="caption" color="warning.main" fontWeight="bold">
                  {fDate(value, 'DD-MM-YYYY')}
                </Typography>
                <br />
                <Typography variant="caption" color="warning.main" fontWeight="bold">
                  {fTime(value, 'h:mm a')}
                </Typography>
              </Box>
            </Tooltip>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No record
            </Typography>
          ),
      },
      {
        name: 'requested_arrival_time',
        label: 'Requested Arrival / Departure Time',
        transform: (value) =>
          value ? (
            <Tooltip title="Employee requested time" arrow>
              <Box>
                <Typography variant="caption" color="info.main" fontWeight="bold">
                  {fDate(value, 'DD-MM-YYYY')}
                </Typography>
                <br />
                <Typography variant="caption" color="info.main" fontWeight="bold">
                  {fTime(value, 'h:mm a')}
                </Typography>
              </Box>
            </Tooltip>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No request
            </Typography>
          ),
      },
      {
        name: 'remarks',
        label: 'Remarks',
        width: 240,
        transform: (value) => (
          <Tooltip title={value || 'No remarks'} arrow>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 6,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {value || 'No remarks'}
            </Typography>
          </Tooltip>
        ),
      },
      {
        name: 'comments',
        label: 'Comments',
        width: 160,
        transform: (value) => (
          <Tooltip title={value || 'No comments'} arrow>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 6,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {value || 'No comments'}
            </Typography>
          </Tooltip>
        ),
      },
    ],
    []
  );

  // Update fields
  const FORM_FIELDS = [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: APPROVAL_STATUS_OPTIONS,
    },
    { name: 'comments', label: 'Comments' },
  ];

  return (
    <SettingsEntityView
      title="Attendance Approvals"
      entityName="Attendance Approval"
      entityData={approvals}
      fields={FIELDS}
      schema={ApprovalSchema}
      isLoading={approvalsLoading}
      hasError={approvalsError}
      onUpdate={
        canChangeApproval
          ? (id, values) =>
              updateAttendanceApproval(
                id,
                {
                  ...values,
                  userId: user?.id,
                },
                params
              )
          : null
      }
      onDelete={null}
      permissionPrefix="attendanceadjustmentapproval"
      formFields={FORM_FIELDS}
      permissions={{
        canAdd: false,
        canEdit: canChangeApproval,
        canDelete: false,
      }}
      // Backend pagination props
      usePagination
      paginationData={{
        results: approvals,
        count: pagination?.count || 0,
        next: pagination?.next,
        previous: pagination?.previous,
        current_page: pagination?.current_page,
        total_pages: pagination?.total_pages,
      }}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      onFilterChange={handleFilterChange}
      filterComponent={
        <Grid container spacing={2} sx={{ width: '100%' }}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Autocomplete
              options={employeeOptions}
              getOptionLabel={(option) => option.employee_name || ''}
              value={
                employeeOptions.find((e) => e.employee_name === filters.state.employee) || null
              }
              onChange={(_, value) => {
                filters.setField('employee', value ? value.employee_name : '');
                setPage(1);
              }}
              renderOption={(props, option) => (
                <li {...props} key={option.user?.id || option.employee_id || option.employee_name}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={option.profile_picture || ''}
                      alt={option.employee_name}
                      sx={{ width: 24, height: 24 }}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" color="text.primary">
                        {option.employee_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.employee_id || '—'}
                      </Typography>
                    </Box>
                  </Box>
                </li>
              )}
              renderInput={(inputParams) => (
                <TextField {...inputParams} label="Employee" placeholder="All Employees" />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              select
              fullWidth
              label="Department"
              value={filters.state.department}
              onChange={(e) => {
                filters.setField('department', e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Departments</MenuItem>
              {departmentOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              select
              fullWidth
              label="Adjustment Type"
              value={filters.state.adjustmentType}
              onChange={(e) => {
                filters.setField('adjustmentType', e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Types</MenuItem>
              {adjustmentTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <DatePicker
              openTo="day"
              format="DD/MM/YYYY"
              label="Start Date"
              value={filters.state.startDate}
              onChange={(newValue) => {
                filters.setField('startDate', newValue);
                setPage(1);
              }}
              slotProps={{
                textField: { fullWidth: true },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <DatePicker
              openTo="day"
              format="DD/MM/YYYY"
              label="End Date"
              value={filters.state.endDate}
              onChange={(newValue) => {
                filters.setField('endDate', newValue);
                setPage(1);
              }}
              slotProps={{
                textField: { fullWidth: true },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              select
              fullWidth
              label="Status"
              value={filters.state.status}
              onChange={(e) => {
                filters.setField('status', e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {APPROVAL_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      }
    />
  );
}
