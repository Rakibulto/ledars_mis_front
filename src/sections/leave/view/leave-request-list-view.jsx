'use client';

import dayjs from 'dayjs';
import { useMemo, useCallback } from 'react';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { fDate } from 'src/utils/format-time';

import { varAlpha } from 'src/theme/styles';
import { STATUS_OPTIONS } from 'src/_mock/options';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetDepartments, useGetLeavePolicies } from 'src/actions/settings';
import {
  deleteLeaveRequest,
  useGetLeaveRequests,
  useGetCompensatoryLeave,
} from 'src/actions/leave';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { RenderContentLoading } from 'src/components/loading';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { UserTableToolbar } from 'src/sections/user/user-table-toolbar';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { LeaveRequestTableRow } from '../leave-request-table-row';
import { exportLeaveRequestsToExcel } from '../utils/leave-utils';
import { LeaveRequestQuickEditForm } from '../leave-request-quick-edit-form';
import { LeaveRequestTableFiltersResult } from '../leave-request-table-filters-result';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const BASE_TABLE_HEAD = [
  { id: 'employee_name', label: 'Employee' },
  { id: 'leave_policy_name', label: 'Leave Type' },
  { id: 'start_date', label: 'Start Date' },
  { id: 'end_date', label: 'End Date' },
  { id: 'days', label: 'Total Days' },
  { id: 'reason', label: 'Reason' },
  { id: 'status', label: 'Status' },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function LeaveRequestListView({ employeeId, flag, employee }) {
  const addLeave = useBoolean();
  const table = useTable();
  const confirm = useBoolean();

  const { user } = useAuthContext();
  const canAddLeave = user?.user_permissions_list?.some(
    (perm) => perm.codename === 'add_leaverequest'
  );

  const { datas, datasLoading, setCurrentPage, setRowsPerPage } = useGetLeaveRequests(
    employeeId,
    false,
    flag,
    false
  );

  const isAdmin = user?.role === 'Admin';
  const isEmployee = user?.role === 'Employee' || user?.role === 'Supervisor';

  // Fetch compensatory leave data for employee
  const { data: compensatoryLeaves = [], dataLoading: compensatoryLoading } =
    useGetCompensatoryLeave(employeeId || user?.employee_id || null);

  const { leavePolicies = [] } = useGetLeavePolicies();
  const { departments = [] } = useGetDepartments();

  const canChange = user?.user_permissions_list?.some(
    (perm) => perm.codename === 'change_leaverequest'
  );
  const canDelete = user?.user_permissions_list?.some(
    (perm) => perm.codename === 'delete_leaverequest'
  );

  const tableData = useMemo(
    () => (!datasLoading && datas?.length > 0 ? datas : []),
    [datas, datasLoading]
  );

  // Add date range filter state
  const filters = useSetState({
    status: 'all',
    employeeName: '',
    leaveType: [],
    startDate: null,
    endDate: null,
    department: '',
  });

  const leaveTypeOptions = useMemo(
    () =>
      leavePolicies
        .filter((policy) => policy.is_active)
        .map((policy) => {
          const groupNames = (policy.leave_groups_detail || []).map((g) => g.name).join(', ');

          return {
            value: policy.id,
            label: groupNames
              ? `${policy.leave_type_name} (${groupNames})`
              : policy.leave_type_name,
          };
        }),
    [leavePolicies]
  );

  const departmentOptions = useMemo(
    () =>
      departments.map((dept) => ({
        value: dept.name,
        label: dept.name,
      })),
    [departments]
  );

  const dataFiltered = applyFilter({
    inputData: tableData || [],
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);
  const canReset = filters.state.status !== 'all';
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await deleteLeaveRequest(id, user?.employee_id || employeeId);
        table.onUpdatePageDeleteRow(dataInPage.length);
        toast.success('Leave request deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete leave request. Please try again.');
      }
    },
    [dataInPage.length, table, user?.employee_id, employeeId]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      const deletePromises = table.selected.map((id) =>
        deleteLeaveRequest(id, user?.employee_id || employeeId)
      );
      await Promise.all(deletePromises);
      table.onUpdatePageDeleteRows({
        totalRowsInPage: dataInPage.length,
        totalRowsFiltered: dataFiltered.length,
      });
      table.onSelectAllRows(false, []);
      toast.success('Leave requests deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete leave requests. Please try again.');
    }
  }, [dataFiltered.length, dataInPage.length, table, user?.employee_id, employeeId]);

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      table.onResetPage();
      filters.setState({ status: newValue });
    },
    [filters, table]
  );

  const tableHead = useMemo(
    () =>
      isEmployee || flag
        ? BASE_TABLE_HEAD.filter((col) => col.id !== 'employee_name')
        : BASE_TABLE_HEAD,
    [isEmployee, flag]
  );

  const handleDownloadExcel = useCallback(async () => {
    await exportLeaveRequestsToExcel(dataFiltered, 'leave-requests.xlsx');
  }, [dataFiltered]);

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Leave Requests"
          links={
            flag
              ? [{ name: '' }]
              : [{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Leave Requests' }]
          }
          action={
            canAddLeave && (
              <Button
                onClick={addLeave.onTrue}
                variant="contained"
                color="primary"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                New Leave Request
              </Button>
            )
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        {/* compensatory leave card - separate loading */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <Iconify icon="solar:calendar-bold" width={24} color="primary.main" />
            <Typography variant="h6">Compensatory Leave</Typography>
          </Stack>
          {compensatoryLoading ? (
            <RenderContentLoading showPagination={false} showFilters={false} tableRowCount={0} />
          ) : compensatoryLeaves.length === 0 ? (
            <Typography variant="subtitle2" color="text.secondary">
              No compensatory leave found for this month.
            </Typography>
          ) : (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Total Available:{' '}
                <b>
                  {compensatoryLeaves.filter((leave) => !leave.is_used && !leave.is_expired).length}
                </b>{' '}
                day(s)
              </Typography>
              <Stack spacing={2}>
                {compensatoryLeaves.map((leave, idx) => {
                  let status = 'Available';
                  let color = 'success';
                  let icon = 'eva:checkmark-circle-2-fill';
                  if (leave.is_used) {
                    status = `Used${leave.used_date ? ` (${fDate(leave.used_date)})` : ''}`;
                    color = 'info';
                    icon = 'eva:archive-fill';
                  } else if (leave.is_expired) {
                    status = 'Expired';
                    color = 'error';
                    icon = 'eva:close-circle-fill';
                  }
                  return (
                    <Card
                      key={leave.id}
                      variant="outlined"
                      sx={{
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        bgcolor: leave.is_used
                          ? 'action.selected'
                          : leave.is_expired
                            ? 'error.lighter'
                            : 'success.lighter',
                        borderColor: `${color}.main`,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        flex={1}
                        color="common.black"
                      >
                        <Iconify icon={icon} color={`${color}.main`} />
                        <Label color={color} variant="filled">
                          {status}
                        </Label>
                        <Typography variant="body2">
                          <b>Earned:</b> {fDate(leave.earned_date)}
                        </Typography>
                        <Typography variant="body2">
                          <b>Expires:</b> {fDate(leave.expires_on)}
                        </Typography>
                      </Stack>
                    </Card>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Card>

        <Card>
          <Tabs
            value={filters.state.status}
            onChange={handleFilterStatus}
            sx={{
              px: 2.5,
              boxShadow: (theme) =>
                `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }}
          >
            {STATUS_OPTIONS.map((tab) => (
              <Tab
                key={tab.value}
                iconPosition="end"
                value={tab.value}
                label={tab.label}
                icon={
                  <Label
                    variant={
                      ((tab.value === 'all' || tab.value === filters.state.status) && 'filled') ||
                      'soft'
                    }
                    color={
                      (tab.value === 'approved' && 'success') ||
                      (tab.value === 'pending' && 'warning') ||
                      (tab.value === 'rejected' && 'error') ||
                      'default'
                    }
                  >
                    {tab.value !== 'all'
                      ? datas.filter((req) => req.status === tab.value).length
                      : datas.length}
                  </Label>
                }
              />
            ))}
          </Tabs>

          {!isEmployee && !flag && (
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', md: 'center' }}
              sx={{ p: 2.5, pr: { xs: 2.5, md: 1 }, width: '100%' }}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                flex={1}
                sx={{ width: '100%' }}
              >
                <UserTableToolbar
                  filters={{
                    state: {
                      name: filters.state.employeeName,
                      role: filters.state.leaveType,
                      department: filters.state.department,
                    },
                    setState: (obj) => {
                      if ('name' in obj) filters.setField('employeeName', obj.name);
                      if ('role' in obj) filters.setField('leaveType', obj.role);
                      if ('department' in obj) filters.setField('department', obj.department);
                    },
                  }}
                  options={{
                    roles: leaveTypeOptions,
                    departments: departmentOptions,
                  }}
                  onResetPage={table.onResetPage}
                  leaveType
                  sx={{ width: { xs: '100%', md: 'auto' } }}
                />

                <DatePicker
                  label="Start Date"
                  value={filters.state.startDate}
                  onChange={(date) => filters.setField('startDate', date)}
                  format="DD-MM-YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: { width: { xs: '100%', md: 200 } },
                    },
                  }}
                />

                <DatePicker
                  label="End Date"
                  value={filters.state.endDate}
                  onChange={(date) => filters.setField('endDate', date)}
                  format="DD-MM-YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: { width: { xs: '100%', md: 200 } },
                    },
                  }}
                />
              </Stack>
              <Box sx={{ ml: { md: 'auto' }, mt: { xs: 2, md: 0 } }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleDownloadExcel}
                  startIcon={<Iconify icon="eva:file-text-fill" />}
                  sx={{ minWidth: 100 }}
                >
                  Export
                </Button>
              </Box>
            </Stack>
          )}

          {canReset && (
            <LeaveRequestTableFiltersResult
              filters={filters}
              totalResults={dataFiltered.length}
              onResetPage={table.onResetPage}
              onResetFilters={() => filters.setState({ status: 'all' })}
              sx={{ p: 2.5 }}
            />
          )}

          {datasLoading ? (
            <RenderContentLoading showAnalytics={false} />
          ) : (
            <>
              <Box sx={{ position: 'relative' }}>
                {canDelete && (
                  <TableSelectedAction
                    dense={table.dense}
                    numSelected={table.selected.length}
                    rowCount={dataFiltered.length}
                    onSelectAllRows={(checked) =>
                      table.onSelectAllRows(
                        checked,
                        dataFiltered.map((row) => row.id)
                      )
                    }
                    action={
                      <Tooltip title="Delete">
                        <IconButton color="primary" onClick={confirm.onTrue}>
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Tooltip>
                    }
                  />
                )}

                <Scrollbar>
                  <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                    <TableHeadCustom
                      order={table.order}
                      orderBy={table.orderBy}
                      headLabel={tableHead}
                      rowCount={dataFiltered.length}
                      numSelected={table.selected.length}
                      onSort={table.onSort}
                      onSelectAllRows={
                        canDelete
                          ? (checked) =>
                              table.onSelectAllRows(
                                checked,
                                dataFiltered.map((row) => row.id)
                              )
                          : undefined
                      }
                    />

                    <TableBody>
                      {dataFiltered
                        .slice(
                          table.page * table.rowsPerPage,
                          table.page * table.rowsPerPage + table.rowsPerPage
                        )
                        .map((row) => (
                          <LeaveRequestTableRow
                            key={row.id}
                            row={row}
                            selected={table.selected.includes(row.id)}
                            onSelectRow={() => table.onSelectRow(row.id)}
                            onDeleteRow={handleDeleteRow}
                            canChange={canChange}
                            canDelete={canDelete}
                            isEmployee={isEmployee}
                            user={user}
                            flag={flag}
                            isAdmin={isAdmin}
                          />
                        ))}

                      <TableEmptyRows
                        height={table.dense ? 56 : 76}
                        emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                      />

                      <TableNoData notFound={notFound} />
                    </TableBody>
                  </Table>
                </Scrollbar>
              </Box>

              <TablePaginationCustom
                page={table.page}
                dense={table.dense}
                count={dataFiltered.length}
                rowsPerPage={table.rowsPerPage}
                onPageChange={(event, newPage) => {
                  table.onChangePage(event, newPage);
                  setCurrentPage(newPage);
                }}
                onChangeDense={table.onChangeDense}
                onRowsPerPageChange={(event) => {
                  table.onChangeRowsPerPage(event);
                  setRowsPerPage(parseInt(event.target.value, 30));
                }}
              />
            </>
          )}
        </Card>
      </DashboardContent>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong> {table.selected.length} </strong> items?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />

      <LeaveRequestQuickEditForm
        open={addLeave.value}
        onClose={addLeave.onFalse}
        addEntry
        currentRequest={{}}
        isEmployee={isEmployee}
        user={user}
        flag={flag}
        employee={employee}
      />
    </>
  );
}

function applyFilter({ inputData, comparator, filters }) {
  const { status, employeeName, leaveType, startDate, endDate, department } = filters;

  let filteredData = [...inputData];

  if (status && status !== 'all') {
    filteredData = filteredData.filter((item) => item.status === status);
  }

  if (employeeName) {
    filteredData = filteredData.filter(
      (item) =>
        (item?.employee_name || '')?.toLowerCase()?.includes(employeeName?.toLowerCase()) ||
        (item?.employee_id || '')?.toLowerCase()?.includes(employeeName?.toLowerCase())
    );
  }

  if (leaveType !== undefined && leaveType !== null) {
    let arr = Array.isArray(leaveType) ? leaveType : [leaveType];
    arr = arr.filter((v) => v !== '' && v !== null && v !== undefined);
    if (arr.length > 0) {
      filteredData = filteredData.filter((item) => arr.includes(item?.leave_policy));
    }
  }

  // Date range filter
  if (startDate) {
    filteredData = filteredData.filter((item) =>
      dayjs(item.start_date).isSameOrAfter(dayjs(startDate), 'day')
    );
  }
  if (endDate) {
    filteredData = filteredData.filter((item) =>
      dayjs(item.end_date).isSameOrBefore(dayjs(endDate), 'day')
    );
  }

  if (department) {
    filteredData = filteredData.filter((item) => item?.department_name === department);
  }

  filteredData = filteredData
    .map((el, index) => [el, index])
    .sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    })
    .map((el) => el[0]);
  return filteredData;
}
