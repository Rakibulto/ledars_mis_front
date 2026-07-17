'use client';

import dayjs from 'dayjs';
import { useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { paths } from 'src/routes/paths';

import { useSetState } from 'src/hooks/use-set-state';

import { fDate } from 'src/utils/format-time';

import { useGetLeaveBalance } from 'src/actions/leave';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { RenderContentLoading } from 'src/components/loading';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TablePaginationCustom,
} from 'src/components/table';

import { exportLeaveBalanceMatrixToExcel } from '../utils/leave-utils';
import { LeaveBalanceTableFiltersResult } from '../leave-balance-table-filters-result';

function LeaveBalanceToolbar({ filters, options, onExport, onChangeStart, onChangeEnd }) {
  const handleFilterName = useCallback(
    (event) => {
      filters.setField('name', event.target.value);
    },
    [filters]
  );

  const handleFilterDepartment = useCallback(
    (event) => {
      filters.setField('department', event.target.value);
    },
    [filters]
  );

  const handleFilterDesignation = useCallback(
    (event) => {
      filters.setField('designation', event.target.value);
    },
    [filters]
  );

  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: 2.5, pr: { xs: 2.5, md: 1 } }}
    >
      <FormControl sx={{ width: { xs: '100%', md: 420 } }}>
        <InputLabel id="leave-balance-dept-label">Department</InputLabel>
        <Select
          labelId="leave-balance-dept-label"
          value={filters.state.department}
          onChange={handleFilterDepartment}
          input={<OutlinedInput label="Department" />}
          fullWidth
        >
          <MenuItem value="">All Departments</MenuItem>
          {options.departments.map((dept) => (
            <MenuItem key={dept} value={dept}>
              {dept}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ width: { xs: '100%', md: 420 } }}>
        <InputLabel id="leave-balance-desig-label">Designation</InputLabel>
        <Select
          labelId="leave-balance-desig-label"
          value={filters.state.designation}
          onChange={handleFilterDesignation}
          input={<OutlinedInput label="Designation" />}
          fullWidth
        >
          <MenuItem value="">All Designations</MenuItem>
          {options.designations.map((des) => (
            <MenuItem key={des} value={des}>
              {des}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <DatePicker
        label="From"
        value={filters.state.startDate}
        onChange={onChangeStart}
        format="DD-MM-YYYY"
        slotProps={{
          textField: { fullWidth: true, sx: { width: { sm: '100%', md: 400 } } },
        }}
      />

      <DatePicker
        label="To"
        value={filters.state.endDate}
        onChange={onChangeEnd}
        format="DD-MM-YYYY"
        slotProps={{
          textField: { fullWidth: true, sx: { width: { sm: '100%', md: 400 } } },
        }}
      />

      <TextField
        value={filters.state.name}
        onChange={handleFilterName}
        placeholder="Search by employee name or ID"
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />

      <Button
        variant="contained"
        color="primary"
        onClick={onExport}
        startIcon={<Iconify icon="eva:file-text-fill" />}
        sx={{ minWidth: 120 }}
      >
        Export
      </Button>
    </Stack>
  );
}

export function LeaveBalanceListView() {
  const table = useTable();

  const filters = useSetState({
    name: '',
    department: '',
    designation: '',
    startDate: null,
    endDate: null,
  });

  const fromParam = filters.state.startDate
    ? dayjs(filters.state.startDate).format('YYYY-MM-DD')
    : null;
  const toParam = filters.state.endDate ? dayjs(filters.state.endDate).format('YYYY-MM-DD') : null;

  const { data, dataLoading, dataError } = useGetLeaveBalance({
    from_date: fromParam,
    to_date: toParam,
  });

  const handleFilterStart = useCallback(
    (date) => {
      filters.setField('startDate', date);
      table.onResetPage();
    },
    [filters, table]
  );

  const handleFilterEnd = useCallback(
    (date) => {
      filters.setField('endDate', date);
      table.onResetPage();
    },
    [filters, table]
  );

  // Normalize leave balance data for admin and supervisor
  const normalizedData = useMemo(() => {
    if (!data) return [];
    // Supervisor format: { supervisor: [...], subordinates: [[...], ...] }
    if (data.supervisor || data.subordinates) {
      let all = [];
      if (Array.isArray(data.supervisor)) {
        all = all.concat(data.supervisor);
      }
      if (Array.isArray(data.subordinates)) {
        data.subordinates.forEach((group) => {
          if (Array.isArray(group)) all = all.concat(group);
        });
      }
      return all;
    }
    // Admin format: flat array
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  // 1. Get all unique leave policy names (sorted for consistency)
  const policyNames = useMemo(() => {
    if (!Array.isArray(normalizedData)) return [];
    const set = new Set();
    normalizedData?.forEach((item) => set.add(item?.leave_type_name));
    return Array.from(set).sort();
  }, [normalizedData]);

  // 2. Group data by employee_id and collect department/designation
  const employees = useMemo(() => {
    if (!Array.isArray(normalizedData)) return [];
    const map = {};
    normalizedData.forEach((item) => {
      if (!map[item.employee_id]) {
        map[item.employee_id] = {
          employee_id: item.employee_id,
          employee_name: item.employee_name,
          department: item.department,
          designation: item.designation,
          policies: {},
        };
      }
      map[item.employee_id].policies[item.leave_type_name] = item;
    });
    return Object.values(map);
  }, [normalizedData]);

  // Collect unique departments and designations from data
  const departmentOptions = useMemo(() => {
    const set = new Set();
    // Handle both admin (array) and supervisor (object) formats
    if (Array.isArray(data)) {
      data.forEach((item) => item.department && set.add(item.department));
    } else if (data && (Array.isArray(data.supervisor) || Array.isArray(data.subordinates))) {
      if (Array.isArray(data.supervisor)) {
        data.supervisor.forEach((item) => item.department && set.add(item.department));
      }
      if (Array.isArray(data.subordinates)) {
        data.subordinates.forEach((group) => {
          if (Array.isArray(group)) {
            group.forEach((item) => item.department && set.add(item.department));
          }
        });
      }
    }
    return Array.from(set);
  }, [data]);

  const designationOptions = useMemo(() => {
    const set = new Set();
    // Handle both admin (array) and supervisor (object) formats
    if (Array.isArray(data)) {
      data.forEach((item) => item.designation && set.add(item.designation));
    } else if (data && (Array.isArray(data.supervisor) || Array.isArray(data.subordinates))) {
      if (Array.isArray(data.supervisor)) {
        data.supervisor.forEach((item) => item.designation && set.add(item.designation));
      }
      if (Array.isArray(data.subordinates)) {
        data.subordinates.forEach((group) => {
          if (Array.isArray(group)) {
            group.forEach((item) => item.designation && set.add(item.designation));
          }
        });
      }
    }
    return Array.from(set);
  }, [data]);

  // 4. Filter employees by name/ID, department, and designation
  const filteredEmployees = useMemo(() => {
    let result = employees;
    const { name, department, designation } = filters.state;
    if (name) {
      const keyword = name.toLowerCase();
      result = result.filter(
        (emp) =>
          emp.employee_name?.toLowerCase().includes(keyword) ||
          emp.employee_id?.toLowerCase().includes(keyword)
      );
    }
    if (department) {
      result = result.filter((emp) => emp.department === department);
    }
    if (designation) {
      result = result.filter((emp) => emp.designation === designation);
    }
    return result;
  }, [employees, filters.state]);

  // 5. Get global min(from_date) and max(to_date)
  const period = useMemo(() => {
    // If filter dates are set show them, otherwise fall back to data range
    if (fromParam || toParam) {
      return {
        minDate: fromParam,
        maxDate: toParam,
      };
    }
    if (!Array.isArray(data) || !data.length) return null;
    let minDate = data[0].from_date;
    let maxDate = data[0].to_date;
    data.forEach((item) => {
      if (item.from_date && item.from_date < minDate) minDate = item.from_date;
      if (item.to_date && item.to_date > maxDate) maxDate = item.to_date;
    });
    return { minDate, maxDate };
  }, [data, fromParam, toParam]);

  const canReset =
    !!filters.state.name ||
    !!filters.state.department ||
    !!filters.state.designation ||
    !!filters.state.startDate ||
    !!filters.state.endDate;

  // Export handler
  const handleExport = async () => {
    await exportLeaveBalanceMatrixToExcel(filteredEmployees, policyNames, 'leave-balance.xlsx', {
      from_date: fromParam,
      to_date: toParam,
    });
  };

  const notFound = !filteredEmployees.length;

  // Calculate paginated data
  const paginatedEmployees = useMemo(() => {
    const startIndex = table.page * table.rowsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + table.rowsPerPage);
  }, [filteredEmployees, table.page, table.rowsPerPage]);

  if (dataError) {
    return (
      <DashboardContent>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <Typography color="error">
            Error loading leave balance data. Please try again later.
          </Typography>
        </Box>
      </DashboardContent>
    );
  }
  if (!employees.length && !dataLoading) {
    return (
      <DashboardContent>
        <Typography>No leave balance data found.</Typography>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Employee Leave Balance"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Leave', href: paths.dashboard.leave.request },
          { name: 'Leave Balance' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Show leave balance period */}
      {period && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">
            Leave balances are counted from <b>{fDate(period.minDate, 'DD-MM-YYYY')}</b> to{' '}
            <b>{fDate(period.maxDate, 'DD-MM-YYYY')}</b>
          </Typography>
        </Alert>
      )}

      <Card>
        {/* Toolbar for filters and export */}
        <LeaveBalanceToolbar
          filters={filters}
          options={{
            departments: departmentOptions,
            designations: designationOptions,
          }}
          onExport={handleExport}
          onChangeStart={handleFilterStart}
          onChangeEnd={handleFilterEnd}
        />

        {canReset && (
          <LeaveBalanceTableFiltersResult
            filters={filters}
            totalResults={filteredEmployees.length}
            onResetPage={table.onResetPage}
            options={{ departments: departmentOptions, designations: designationOptions }}
            sx={{ px: 3, py: 1 }}
          />
        )}

        {dataLoading ? (
          <RenderContentLoading showAnalytics={false} m={0} />
        ) : (
          <>
            <Scrollbar>
              <Box sx={{ minWidth: 960 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      {policyNames.map((policy) => (
                        <TableCell key={policy} align="center">
                          {policy}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedEmployees.map((emp) => (
                      <TableRow key={emp.employee_id}>
                        <TableCell>
                          <Stack
                            sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}
                          >
                            <Typography variant="subtitle2">{emp.employee_name}</Typography>
                            {emp.employee_id && (
                              <Label
                                variant="soft"
                                color="blue"
                                sx={{
                                  typography: 'caption',
                                  fontWeight: 600,
                                  borderRadius: '4px',
                                  px: 1,
                                  fontSize: '14px',
                                }}
                              >
                                ID: {emp.employee_id}
                              </Label>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {emp.department && `${emp.department}`}
                              {emp.designation && ` | ${emp.designation}`}
                            </Typography>
                          </Stack>
                        </TableCell>
                        {policyNames.map((policy) => {
                          const leave = emp.policies[policy];
                          return (
                            <TableCell key={policy} align="center">
                              {leave ? (
                                <>
                                  <Typography variant="body2" color="error.main">
                                    Used: <b>{leave.used}</b>
                                  </Typography>
                                  <Typography variant="body2" color="warning.main">
                                    Pending: <b>{leave.pending}</b>
                                  </Typography>
                                  <Typography variant="body2" color="success.main">
                                    Remaining: <b>{leave.remaining}</b>
                                  </Typography>
                                  <Typography variant="body2" color="info.main">
                                    Allowed: <b>{leave.total_allowed}</b>
                                  </Typography>
                                </>
                              ) : (
                                <Label variant="inverted" color="error">
                                  Not Eligible
                                </Label>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}

                    <TableEmptyRows
                      height={table.dense ? 56 : 56 + 20}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, filteredEmployees.length)}
                    />

                    <TableNoData notFound={notFound} />
                  </TableBody>
                </Table>
              </Box>
            </Scrollbar>

            <TablePaginationCustom
              page={table.page}
              count={filteredEmployees.length}
              rowsPerPage={table.rowsPerPage}
              dense={table.dense}
              onPageChange={table.onChangePage}
              onChangeDense={table.onChangeDense}
              onRowsPerPageChange={table.onChangeRowsPerPage}
            />
          </>
        )}
      </Card>
    </DashboardContent>
  );
}
