'use client';

import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { useMemo, Fragment, useCallback } from 'react';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { varAlpha } from 'src/theme/styles';
import { STATUS_OPTIONS } from 'src/_mock/options';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetDepartments, useGetLeavePolicies } from 'src/actions/settings';
import { deleteLeaveApproval, updateLeaveApproval, useGetLeaveApprovals } from 'src/actions/leave';

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

import { LeaveApprovalTableRow } from '../leave-approval-table-row';
import { LeaveApprovalQuickEditForm } from '../leave-approval-quick-edit-form';
import { LeaveApprovalTableFiltersResult } from '../leave-approval-table-filters-result';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const TABLE_HEAD = [
  { id: 'employee_name', label: 'Employee' },
  { id: 'leave_request_name', label: 'Leave Type' },
  { id: 'leave_from', label: 'From', width: 115 },
  { id: 'leave_to', label: 'To', width: 115 },
  { id: 'total_days', label: 'Total Days' },
  { id: 'approver_name', label: 'Approver' },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function LeaveApprovalListView() {
  const addLeave = useBoolean();
  const table = useTable();
  const confirm = useBoolean();

  const { user } = useAuthContext();

  const isAdmin = user?.role === 'Admin';
  const isSupervisor = user?.role === 'Supervisor';

  const { datas, datasLoading, setCurrentPage, setRowsPerPage } = useGetLeaveApprovals({
    id: !isAdmin && user?.id,
  });

  const { leavePolicies = [] } = useGetLeavePolicies();
  const { departments = [] } = useGetDepartments();

  const canChange = user?.user_permissions_list?.some(
    (perm) => perm.codename === 'change_leaveapproval'
  );
  const canDelete = user?.user_permissions_list?.some(
    (perm) => perm.codename === 'delete_leaveapproval'
  );

  const tableData = useMemo(
    () => (!datasLoading && datas?.length > 0 ? datas : []),
    [datas, datasLoading]
  );

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

  // Add filter state for employee, leave type, and date range
  const filters = useSetState({
    status: 'all',
    employeeName: '',
    leaveType: [],
    startDate: null,
    endDate: null,
    department: '',
  });

  // Update applyFilter to use new filters
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
        await deleteLeaveApproval(id);
        table.onUpdatePageDeleteRow(dataInPage.length);
        toast.success('Leave approval deleted successfully!');
      } catch (error) {
        toast.error(error?.detail || 'Failed to delete leave approval. Please try again.');
      }
    },
    [dataInPage.length, table]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      const deletePromises = table.selected.map((id) => deleteLeaveApproval(id));
      await Promise.all(deletePromises);
      table.onUpdatePageDeleteRows({
        totalRowsInPage: dataInPage.length,
        totalRowsFiltered: dataFiltered.length,
      });
      table.onSelectAllRows(false, []);
      toast.success('Leave approvals deleted successfully!');
    } catch (error) {
      toast.error(error?.detail || 'Failed to delete leave approvals. Please try again.');
    }
  }, [dataFiltered.length, dataInPage.length, table]);

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      table.onResetPage();
      filters.setState({ status: newValue });
    },
    [filters, table]
  );

  const isGrouped = isAdmin || !user?.id;

  // Group data by leave_request if admin or id not present
  const groupedData = useMemo(() => {
    if (!isGrouped) return dataFiltered;
    const groups = {};
    const order = [];
    dataFiltered.forEach((item) => {
      const key = item.leave_request;
      if (!groups[key]) {
        groups[key] = {
          ...item,
          approvers: [],
        };
        order.push(key);
      }
      groups[key].approvers.push({
        approver: item.approver,
        approver_name: item.approver_name,
        status: item.status,
        comments: item.comments,
        level: item.level,
      });
    });
    return order.map((key) => groups[key]);
  }, [dataFiltered, isGrouped]);

  // Bulk approve/reject all for a leave_request (admin only)
  const handleBulkStatusChange = async (leaveRequestId, status) => {
    if (!isAdmin) return;
    // Get all approval ids for this leave_request
    const ids = tableData
      .filter((item) => item.leave_request === leaveRequestId)
      .map((item) => item.id);

    try {
      await Promise.all(ids.map((id) => updateLeaveApproval(id, { status })));
      toast.success(`All approvals for request #${leaveRequestId} set to ${status}`);
    } catch (error) {
      toast.error(error?.detail || 'Failed to update all approvals');
    }
  };

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Leave Approvals"
          links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Leave Approvals' }]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

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

          {canReset && (
            <LeaveApprovalTableFiltersResult
              filters={filters}
              totalResults={dataFiltered.length}
              onResetPage={table.onResetPage}
              onResetFilters={() => filters.setState({ status: 'all' })}
              sx={{ p: 2.5 }}
            />
          )}

          {/* Filter Toolbar */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
            sx={{ p: 2.5, pr: { xs: 2.5, md: 1 }, width: '100%' }}
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

          {datasLoading ? (
            <RenderContentLoading showAnalytics={false} m={0} />
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
                      headLabel={TABLE_HEAD}
                      rowCount={isGrouped ? groupedData.length : dataFiltered.length}
                      numSelected={table.selected.length}
                      onSort={table.onSort}
                      onSelectAllRows={
                        canDelete
                          ? (checked) =>
                              table.onSelectAllRows(
                                checked,
                                (isGrouped ? groupedData : dataFiltered).map((row) =>
                                  isGrouped ? row.leave_request : row.id
                                )
                              )
                          : undefined
                      }
                    />

                    <TableBody>
                      {groupedData
                        .slice(
                          table.page * table.rowsPerPage,
                          table.page * table.rowsPerPage + table.rowsPerPage
                        )
                        .map((row) => (
                          <Fragment key={isGrouped ? row.leave_request : row.id}>
                            <LeaveApprovalTableRow
                              row={row}
                              selected={table.selected.includes(
                                isGrouped ? row.leave_request : row.id
                              )}
                              onSelectRow={() =>
                                table.onSelectRow(isGrouped ? row.leave_request : row.id)
                              }
                              onDeleteRow={handleDeleteRow}
                              canChange={canChange}
                              canDelete={canDelete}
                              isGrouped={isGrouped}
                              isAdmin={isAdmin}
                              onBulkStatusChange={handleBulkStatusChange}
                              currentUserId={user?.id}
                              isSupervisor={isSupervisor}
                            />
                          </Fragment>
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

      <LeaveApprovalQuickEditForm
        open={addLeave.value}
        onClose={addLeave.onFalse}
        addEntry
        currentApproval={{}}
      />
    </>
  );
}

// Update applyFilter to use new filters
function applyFilter({ inputData, comparator, filters }) {
  const { status, employeeName, leaveType, startDate, endDate, department } = filters;
  let filteredData = [...inputData];

  if (status && status !== 'all') {
    filteredData = filteredData.filter((item) => item.status === status);
  }

  if (employeeName) {
    const keyword = employeeName.toLowerCase();
    filteredData = filteredData.filter(
      (item) =>
        (item?.employee_name || '').toLowerCase().includes(keyword) ||
        (item?.employee_id || '').toLowerCase().includes(keyword)
    );
  }

  if (leaveType !== undefined && leaveType !== null) {
    let arr = Array.isArray(leaveType) ? leaveType : [leaveType];
    arr = arr.filter((v) => v !== '' && v !== null && v !== undefined);
    if (arr.length > 0) {
      filteredData = filteredData.filter((item) => arr.includes(item?.leave_request));
    }
  }

  // Date range filter (leave_from)
  if (startDate) {
    filteredData = filteredData.filter((item) =>
      dayjs(item.leave_from, 'DD-MM-YYYY').isSameOrAfter(dayjs(startDate), 'day')
    );
  }

  if (endDate) {
    filteredData = filteredData.filter((item) =>
      dayjs(item.leave_to, 'DD-MM-YYYY').isSameOrBefore(dayjs(endDate), 'day')
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
