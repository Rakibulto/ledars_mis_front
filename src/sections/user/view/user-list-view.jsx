'use client';

import { mutate } from 'swr';
import ExcelJS from 'exceljs';
import { useMemo, useState, useReducer, forwardRef, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Slide from '@mui/material/Slide';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useDebounce } from 'src/hooks/use-debounce';
import { useSetState } from 'src/hooks/use-set-state';

import axios, { endpoints } from 'src/utils/axios';
import { fDate, formatTo12Hour } from 'src/utils/format-time';

import { varAlpha } from 'src/theme/styles';
import { USER_STATUS_OPTIONS } from 'src/_mock/options';
import { DashboardContent } from 'src/layouts/dashboard';
import { updateUserPermissions } from 'src/actions/permissions';
import { updateUserRole, useGetEmployees } from 'src/actions/employees';
import { useGetRoles, useGetDepartments, useGetDesignations } from 'src/actions/settings';

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
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks';

import { UserTableRow } from '../user-table-row';
import { UserTableToolbar } from '../user-table-toolbar';
import { UserCreateSimpleForm } from '../user-create-simple-form';
import { UserTableFiltersResult } from '../user-table-filters-result';
import { employeeCodenames, supervisorCodenames } from '../utils/user-utils';

// ----------------------------------------------------------------------

const Transition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...USER_STATUS_OPTIONS];

// Define the base table head columns
const BASE_TABLE_HEAD = [
  { id: 'id' },
  { id: 'employee_name', label: 'Name' },
  { id: 'shift?.name', label: 'Shift' },
  { id: 'department?.name', label: 'Department/Designation' },
  { id: 'joining_date', label: 'Joining / Confirmation Date' },
  { id: 'status', label: 'Status' },
  { id: '', width: 88 },
];

// Dialog reducer for role change dialog
function roleDialogReducer(state, action) {
  switch (action.type) {
    case 'OPEN':
      return { open: true, userId: action.userId, newRole: action.newRole };
    case 'CLOSE':
      return { open: false, userId: null, newRole: null };
    default:
      return state;
  }
}

// Dialog reducer for user creation dialog
function createUserDialogReducer(state, action) {
  switch (action.type) {
    case 'OPEN':
      return { open: true };
    case 'CLOSE':
      return { open: false };
    default:
      return state;
  }
}

export function UserListView() {
  const table = useTable();
  const router = useRouter();

  const { user } = useAuthContext();
  const isAdmin = user?.role === 'Admin';

  // Check add_employee permission
  const hasAddEmployeePermission = user?.user_permissions_list?.some(
    (perm) => perm.codename === 'add_employee'
  );

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(30);

  const filters = useSetState({
    name: '',
    role: '',
    status: 'all',
    department: '',
    designation: '',
  });

  const debouncedName = useDebounce(filters.state.name, 1000);

  // Fetch employees data with pagination and filters
  const params = useMemo(() => {
    const p = {
      pagination: true,
      page: page + 1,
      page_size: pageSize,
    };

    if (debouncedName) p.keyword = debouncedName;
    if (filters.state.status !== 'all') p.status = filters.state.status;
    if (filters.state.role) p.role = filters.state.role;
    if (filters.state.department) p.department = filters.state.department;
    if (filters.state.designation) p.designation = filters.state.designation;

    return p;
  }, [page, pageSize, debouncedName, filters.state]);

  const { employees, employeesLoading, employeesError, pagination, statusCounts } =
    useGetEmployees(params);
  const { roles = [] } = useGetRoles();
  const { departments = [] } = useGetDepartments();
  const { designations = [] } = useGetDesignations();

  // Create user dialog state
  const [createUserDialog, dispatchCreateUserDialog] = useReducer(createUserDialogReducer, {
    open: false,
  });

  // Add role column to table head if user is admin
  const TABLE_HEAD = useMemo(() => {
    if (isAdmin) {
      // Insert role column before status
      return [
        ...BASE_TABLE_HEAD.slice(0, 5),
        { id: 'role', label: 'Role' },
        ...BASE_TABLE_HEAD.slice(5),
      ];
    }
    return BASE_TABLE_HEAD;
  }, [isAdmin]);

  // Transform employee data to match the table structure
  const tableData = useMemo(() => {
    if (!employees.length) return [];

    return employees;
  }, [employees]);

  const departmentOptions = useMemo(
    () => departments?.map((dept) => ({ value: dept?.id, label: dept?.name })) || [],
    [departments]
  );

  const designationOptions = useMemo(
    () =>
      designations?.map((desig) => {
        const dept = desig?.department_name || (desig?.department && desig.department.name);
        const label = dept ? `${desig?.name} (${dept})` : desig?.name;
        return { value: desig?.id, label };
      }) || [],
    [designations]
  );

  const canReset =
    !!filters.state.name ||
    !!filters.state.role ||
    filters.state.status !== 'all' ||
    !!filters.state.department ||
    !!filters.state.designation;

  const notFound = !tableData.length && canReset;

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.user.edit(id));
    },
    [router]
  );

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      setPage(0);
      filters.setState({ status: newValue });
    },
    [filters]
  );

  // Use useReducer for dialog state
  const [roleDialog, dispatchRoleDialog] = useReducer(roleDialogReducer, {
    open: false,
    userId: null,
    newRole: null,
  });

  // Show dialog and store user/role
  const handleRequestRoleChange = useCallback((userId, newRole) => {
    dispatchRoleDialog({ type: 'OPEN', userId, newRole });
  }, []);

  // Confirm and perform role change
  const handleConfirmRoleChange = useCallback(async () => {
    try {
      await updateUserRole(roleDialog.userId, roleDialog.newRole, roles);

      // Also sync permissions for the new role (Admin -> all permissions, etc.)
      const roleObj = roles.find((r) => r.id === roleDialog.newRole);
      try {
        const allPermissionsRes = await axios.get(endpoints.permission.list);
        const allPermissions = allPermissionsRes.data || [];

        let requiredPermissionIds = [];
        if (roleObj?.name === 'Admin') {
          requiredPermissionIds = allPermissions.map((p) => p.id);
        } else if (roleObj?.name === 'Supervisor') {
          requiredPermissionIds = allPermissions
            .filter((p) => supervisorCodenames.includes(p.codename))
            .map((p) => p.id);
        } else if (roleObj?.name === 'Employee') {
          requiredPermissionIds = allPermissions
            .filter((p) => employeeCodenames.includes(p.codename))
            .map((p) => p.id);
        }

        if (requiredPermissionIds.length) {
          await updateUserPermissions(roleDialog.userId, requiredPermissionIds);
        }
      } catch (permErr) {
        console.error('Failed to sync permissions after role change', permErr);
      }

      // Revalidate the exact employees list cache key (includes current params)
      const queryString =
        Object.keys(params).length > 0 ? new URLSearchParams(params).toString() : '';

      const listKey = queryString
        ? `${endpoints.employee.list}?${queryString}`
        : endpoints.employee.list;

      // Optimistically update the local SWR cache so UI reflects change immediately
      await mutate(
        listKey,
        (current) => {
          if (!current) return current;

          // Paginated response has `results`
          if (Array.isArray(current.results)) {
            const updated = current.results.map((emp) =>
              emp.user?.id === roleDialog.userId
                ? { ...emp, user: { ...emp.user, role: roleObj?.name } }
                : emp
            );
            return { ...current, results: updated };
          }

          // Single-employee response
          if (current.user?.id === roleDialog.userId) {
            return { ...current, user: { ...current.user, role: roleObj?.name } };
          }

          return current;
        },
        false
      );

      // Then revalidate to fetch authoritative data
      await mutate(listKey);

      toast.success('Role updated successfully');
    } catch (error) {
      toast.error('Failed to update role');
    } finally {
      dispatchRoleDialog({ type: 'CLOSE' });
    }
  }, [roleDialog, roles, params]);

  // Cancel role dialog
  const handleCancelRoleChange = useCallback(() => {
    dispatchRoleDialog({ type: 'CLOSE' });
  }, []);

  const handleExport = useCallback(async () => {
    const loadingToastId = toast.loading('Exporting employee data...');

    try {
      const exportParams = {};

      if (debouncedName) exportParams.keyword = debouncedName;
      if (filters.state.status !== 'all') exportParams.status = filters.state.status;
      if (filters.state.role) exportParams.role = filters.state.role;
      if (filters.state.department) exportParams.department = filters.state.department;
      if (filters.state.designation) exportParams.designation = filters.state.designation;

      const queryString = new URLSearchParams(exportParams).toString();
      const url = queryString
        ? `${endpoints.employee.list}?${queryString}`
        : endpoints.employee.list;
      const response = await axios.get(url);
      const allEmployees = response.data || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Employees');

      worksheet.columns = [
        { header: 'Employee ID', key: 'employee_id', width: 15 },
        { header: 'Employee Name', key: 'employee_name', width: 20 },
        { header: 'User Email', key: 'user_email', width: 25 },
        { header: 'Username', key: 'username', width: 15 },
        { header: 'User Role', key: 'user_role', width: 12 },
        { header: 'Department', key: 'department', width: 18 },
        { header: 'Designation', key: 'designation', width: 18 },
        { header: 'Location/Branch', key: 'location', width: 18 },
        { header: 'Location Address', key: 'location_address', width: 25 },
        { header: 'Shift Name', key: 'shift_name', width: 15 },
        { header: 'Office Start Time', key: 'office_start_time', width: 15 },
        { header: 'Office End Time', key: 'office_end_time', width: 15 },
        { header: 'Supervisor(s)', key: 'supervisors', width: 25 },
        { header: 'Leave Group', key: 'leave_group', width: 18 },
        { header: 'Employment Type', key: 'employment_type', width: 18 },
        { header: 'Joining Date', key: 'joining_date', width: 15 },
        { header: 'Confirmation Date', key: 'confirmation_date', width: 18 },
        { header: 'Probation Period', key: 'probation_period', width: 12 },
        { header: 'Probation Period Time (Months)', key: 'probation_period_time', width: 20 },
        { header: 'Office Days', key: 'office_days', width: 15 },
        { header: 'Official Mobile Number', key: 'official_mobile_number', width: 18 },
        { header: 'Personal Mobile Number', key: 'personal_mobile_number', width: 18 },
        { header: 'Personal Email ID', key: 'personal_email_id', width: 25 },
        { header: 'Salary', key: 'salary', width: 12 },
        { header: 'RFID/Machine Code', key: 'rfid_or_machine_code', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Resign/Terminated Date', key: 'resign_terminated_date', width: 18 },
        { header: 'Resign/Terminated Reason', key: 'resign_terminated_reason', width: 20 },
        { header: 'Present Address', key: 'present_address', width: 30 },
        { header: 'Permanent Address', key: 'permanent_address', width: 30 },
        { header: 'Marital Status', key: 'marital_status', width: 12 },
        { header: 'Religion', key: 'religion', width: 12 },
        { header: 'Blood Group', key: 'blood_group', width: 12 },
        { header: 'Gender', key: 'gender', width: 10 },
        { header: 'Last Education', key: 'last_education', width: 15 },
        { header: 'Educational Institute', key: 'educational_institute', width: 25 },
        { header: 'Last Job Experience', key: 'last_job_experience', width: 20 },
        { header: 'Profile Picture URL', key: 'profile_picture', width: 30 },
        { header: 'Date of Birth', key: 'date_of_birth', width: 15 },
        { header: 'Bank Name', key: 'bank_name', width: 15 },
        { header: 'Bank Account Number', key: 'bank_account_number', width: 18 },
        { header: 'Bank Branch', key: 'bank_branch', width: 15 },
        { header: 'Allow Web Login', key: 'allow_web_login', width: 12 },
        { header: 'Is IP Restricted', key: 'is_ip_restricted', width: 12 },
        { header: 'Allow Any IP Attendance', key: 'allow_any_ip_attendance', width: 18 },
        { header: 'Emergency Contact Count', key: 'emergency_contact_count', width: 18 },
        { header: 'Emergency Contact Details', key: 'emergency_contact_details', width: 40 },
        { header: 'Nominee Count', key: 'nominee_count', width: 12 },
        { header: 'Nominee Details', key: 'nominee_details', width: 40 },
      ];

      allEmployees.forEach((emp) => {
        worksheet.addRow({
          employee_id: emp?.employee_id || '',
          employee_name: emp?.employee_name || '',
          user_email: emp?.user?.email || '',
          username: emp?.user?.username || '',
          user_role: emp?.user?.role || '',
          department: emp?.department?.name || '',
          designation: emp?.designation?.name || '',
          location: emp?.location?.name || '',
          location_address: emp?.location?.address || '',
          shift_name: emp?.office_time?.name || '',
          office_start_time: formatTo12Hour(emp?.office_time?.office_start_time),
          office_end_time: formatTo12Hour(emp?.office_time?.office_end_time),
          supervisors: emp?.supervisor?.map((s) => s.username).join(', ') || '',
          leave_group: emp?.leave_group?.name || '',
          employment_type: emp?.employment_type?.name || '',
          joining_date: fDate(emp?.joining_date) || '',
          confirmation_date: fDate(emp?.confirmation_date) || '',
          probation_period: emp?.probation_period ? 'Yes' : 'No',
          probation_period_time: emp?.probation_period_time || '',
          office_days: emp?.office_days || '',
          official_mobile_number: emp?.official_mobile_number || '',
          personal_mobile_number: emp?.personal_mobile_number || '',
          personal_email_id: emp?.personal_email_id || '',
          salary: emp?.salary || '',
          rfid_or_machine_code: emp?.rfid_or_machine_code || '',
          status: emp?.status || '',
          resign_terminated_date: emp?.resign_terminated_date || '',
          resign_terminated_reason: emp?.resign_terminated_reason || '',
          present_address: emp?.present_address || '',
          permanent_address: emp?.permanent_address || '',
          marital_status: emp?.marital_status || '',
          religion: emp?.religion || '',
          blood_group: emp?.blood_group || '',
          gender: emp?.gender || '',
          last_education: emp?.last_education || '',
          educational_institute: emp?.educational_institute || '',
          last_job_experience: emp?.last_job_experience || '',
          profile_picture: emp?.profile_picture || '',
          date_of_birth: emp?.date_of_birth || '',
          bank_name: emp?.bank_name || '',
          bank_account_number: emp?.bank_account_number || '',
          bank_branch: emp?.bank_branch || '',
          allow_web_login: emp?.allow_web_login ? 'Yes' : 'No',
          is_ip_restricted: emp?.is_ip_restricted ? 'Yes' : 'No',
          allow_any_ip_attendance: emp?.allow_any_ip_attendance ? 'Yes' : 'No',
          emergency_contact_count: emp?.emergency_contact?.length || 0,
          emergency_contact_details:
            emp?.emergency_contact
              ?.map(
                (contact) =>
                  `${contact?.name} (${contact?.relationship}, ${contact?.phone}, ${contact?.address})`
              )
              .join('; ') || '',
          nominee_count: emp?.nominee?.length || 0,
          nominee_details:
            emp?.nominee
              ?.map(
                (nominee) =>
                  `${nominee?.name} (${nominee?.relationship}, ${nominee?.phone}, ${nominee?.address}, ${nominee?.percentage}%)`
              )
              .join('; ') || '',
        });
      });

      // Style header
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' },
      };

      worksheet.columns.forEach((col) => {
        col.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      });

      // Auto filter
      const headerRow = worksheet.getRow(1);
      const { lastCell } = headerRow;
      worksheet.autoFilter = {
        from: 'A1',
        to: lastCell ? lastCell.address : 'J1',
      };

      // Download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'employees_report.xlsx';
      a.click();
      URL.revokeObjectURL(blobUrl);

      toast.success('Employee data exported successfully!', { id: loadingToastId, duration: 3000 });
    } catch (error) {
      toast.error('Failed to export employee data. Please try again.', {
        id: loadingToastId,
        duration: 5000,
      });
    }
  }, [debouncedName, filters.state]);

  // Handle create user dialog close
  const handleCloseCreateUserDialog = useCallback(() => {
    dispatchCreateUserDialog({ type: 'CLOSE' });
  }, []);

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Employee List"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Account', href: paths.dashboard.user.account },
            { name: 'List' },
          ]}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              {hasAddEmployeePermission && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={() => dispatchCreateUserDialog({ type: 'OPEN' })}
                >
                  New Employee
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:file-text-fill" />}
                onClick={handleExport}
              >
                Export
              </Button>
            </Box>
          }
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
                      (tab.value === 'active' && 'success') ||
                      (tab.value === 'incomplete' && 'warning') ||
                      (tab.value === 'terminated' && 'error') ||
                      (tab.value === 'resigned' && 'orange') ||
                      (tab.value === 'inactive' && 'info') ||
                      'default'
                    }
                  >
                    {tab.value === 'all' ? pagination?.count || 0 : statusCounts[tab.value] || 0}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <UserTableToolbar
            filters={filters}
            onResetPage={() => setPage(0)}
            options={{
              roles: roles?.map((role) => ({ value: role?.id, label: role?.name })) || [],
              departments: departmentOptions,
              designations: designationOptions,
            }}
          />

          {canReset && (
            <UserTableFiltersResult
              filters={filters}
              totalResults={pagination?.count || 0}
              onResetPage={() => setPage(0)}
              options={{
                roles: roles?.map((role) => ({ value: role?.id, label: role?.name })),
                departments: departmentOptions,
                designations: designationOptions,
              }}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          {employeesLoading ? (
            <RenderContentLoading showAnalytics={false} m={0} />
          ) : employeesError ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="30vh">
              <Typography color="error">
                Error loading employee data. Please try again later.
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ position: 'relative' }}>
                <TableSelectedAction
                  dense={table.dense}
                  numSelected={table.selected.length}
                  rowCount={pagination?.count || 0}
                />

                <Scrollbar>
                  <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                    <TableHeadCustom
                      order={table.order}
                      orderBy={table.orderBy}
                      headLabel={TABLE_HEAD}
                      rowCount={pagination?.count || 0}
                      numSelected={table.selected.length}
                      onSort={table.onSort}
                    />

                    <TableBody>
                      {tableData?.map((row) => (
                        <UserTableRow
                          key={row?.user?.id}
                          row={row}
                          selected={table.selected.includes(row?.user?.id)}
                          onEditRow={() => handleEditRow(row?.user?.id)}
                          onUpdateRole={handleRequestRoleChange}
                          isAdmin={isAdmin}
                          roles={roles}
                          isSelf={user?.id === row.id}
                          currentUser={user}
                        />
                      ))}

                      <TableEmptyRows
                        height={table.dense ? 56 : 76}
                        emptyRows={emptyRows(0, pageSize, tableData.length)}
                      />

                      <TableNoData notFound={notFound} />
                    </TableBody>
                  </Table>
                </Scrollbar>
              </Box>

              <TablePaginationCustom
                page={page}
                dense={table.dense}
                count={pagination?.count || 0}
                rowsPerPage={pageSize}
                onPageChange={(e, newPage) => setPage(newPage)}
                onChangeDense={table.onChangeDense}
                onRowsPerPageChange={(e) => {
                  setPageSize(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </>
          )}
        </Card>
      </DashboardContent>

      {/* Role Change Confirmation Dialog */}
      <ConfirmDialog
        open={roleDialog.open}
        onClose={handleCancelRoleChange}
        title="Change Role"
        content="Are you sure you want to change this user's role?"
        action={
          <Button variant="contained" color="primary" onClick={handleConfirmRoleChange}>
            Confirm
          </Button>
        }
      />

      {/* Create User Dialog */}
      <Dialog
        fullWidth
        maxWidth="md"
        open={createUserDialog.open}
        onClose={handleCloseCreateUserDialog}
        TransitionComponent={Transition}
      >
        <DialogTitle>
          Create a New User
          <IconButton
            aria-label="close"
            onClick={handleCloseCreateUserDialog}
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Iconify icon="solar:close-circle-bold-duotone" width={28} height={28} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <UserCreateSimpleForm onClose={handleCloseCreateUserDialog} />
        </DialogContent>
      </Dialog>
    </>
  );
}
