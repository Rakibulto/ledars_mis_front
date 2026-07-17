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

import { CONFIG } from 'src/config-global';
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

export function LeaveRequestListView({ employeeId, flag, employee, leaveBalances }) {
  // console.log('LeaveRequestListView props:', { employeeId, flag, employee, leaveBalances });

  // console.log('Employee', employee);

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

  const handleLeaveRequestPrint = (row) => {
    const escape = (v) =>
      String(v ?? '')
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"');

    const fmtDate = (d) => {
      if (!d) return '';
      try {
        return new Date(d).toLocaleDateString('en-GB');
      } catch {
        return String(d);
      }
    };

    const employeeName = escape(row?.employee_name);
    const address = escape(row?.branch_name);
    const contactAddress = escape(row?.present_address || employee?.present_address || '');
    const designation = escape(row?.designation);
    const project = escape(row?.project_name || row?.department_name);
    const leaveType = escape(row?.leave_policy_name);
    const startDate = fmtDate(row?.start_date);
    const endDate = fmtDate(row?.end_date);
    const days =
      row?.requested_days ||
      row?.days ||
      Math.floor((new Date(row?.end_date) - new Date(row?.start_date)) / (1000 * 60 * 60 * 24)) +
        1 ||
      '';
    const reason = escape(row?.reason);
    const currentDate = new Date().toLocaleDateString('en-GB');
    const baseUrl = CONFIG.appDomainUrl.replace(/\/+$/, '');
    const severUrl = CONFIG.serverUrl.replace(/\/+$/, '');
    const signatureImage = row?.signature
      ? `${row.signature}`
      : employee?.signature
        ? `${employee.signature}`
        : '';

    // Signature helper for print
    const renderSigField = (data, name) => {
      if (!data) {
        return `<div class="sig-line-top"></div><div class="sig-block-label">${name}</div>`;
      }
      const img = data.signature_image
        ? `<img src="${data.signature_image}" style="max-width:140px;max-height:50px;object-fit:contain;" alt="${name}">`
        : `<div class="sig-line-top"></div>`;
      const signerName = data.name || '';
      return `${img}<div class="sig-block-label">${name}</div><div class="sig-name">${escape(signerName)}</div>`;
    };

    const casualLeave =
      (leaveBalances || []).find((item) => item.leave_type_name === 'Casual Leave') || {};

    const earnedLeave =
      (leaveBalances || []).find((item) => item.leave_type_name === 'Earned Leave') || {};

    const sickLeave =
      (leaveBalances || []).find((item) => item.leave_type_name === 'Sick Leave') || {};

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Leave Application</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      color: #000;
      background: #fff;
      padding: 22px 30px;
    }

    /* ════════════════════════════════════════════
       ORG HEADER  — logo left + name_img right, centred together
    ════════════════════════════════════════════ */
    .header {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .header-logo {
      width: 52px;
      height: 52px;
      object-fit: contain;
    }
    .header-name {
      max-height: 46px;
      width: auto;
      object-fit: contain;
    }
    .header-rule {
      border-top: 1.5px solid #000;
      margin: 4px 0 8px;
    }

    /* ════════════════════════════════════════════
       FORM TITLE
    ════════════════════════════════════════════ */
    .form-title {
      text-align: center;
      font-size: 14px;
      font-weight: 700;
      text-decoration: underline;
      margin-bottom: 8px;
    }

    /* ════════════════════════════════════════════
       DATE ROW  (right-aligned)
    ════════════════════════════════════════════ */
    .date-row {
      text-align: right;
      font-size: 11px;
      margin-bottom: 5px;
    }
    .date-dots {
      display: inline-block;
      width: 130px;
      border-bottom: 1px dotted #444;
    }

    /* ════════════════════════════════════════════
       INFO LABELS  (Name / Designation / Project)
    ════════════════════════════════════════════ */
    .info-label {
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    /* ════════════════════════════════════════════
       PARAGRAPH LINES  (dark blue, with dot fills)
    ════════════════════════════════════════════ */
    .para-line {
      font-size: 11px;
      color: #000;
      margin-top: 8px;
      margin-bottom: 3px;
      line-height: 1.8;
    }

    /* ════════════════════════════════════════════
       CONTRACT ADDRESS + SIGNATURE ROW
    ════════════════════════════════════════════ */
    .addr-sig-row {
      display: flex;
      align-items: flex-end;
      margin-top: 10px;
      margin-bottom: 4px;
      gap: 10px;
    }
    .addr-col {
      flex: 0 0 55%;
    }
    .addr-label {
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .addr-dots {
      border-top: 1px dotted #444;
      margin-bottom: 8px;
      padding-top: 2px;
      font-size: 10px;
      color: #888;
      letter-spacing: 1px;
    }
    .addr-value {
      font-size: 11px;
      margin-bottom: 4px;
      min-height: 40px;
      padding: 4px 0;
    }
    .sig-right {
      flex: 1;
      text-align: left;
      padding-left: 20px;
    }
    .sig-line-top {
      border-top: 1px solid #000;
      width: 160px;
      margin-bottom: 4px;
    }
    .sig-right-label {
      font-size: 11px;
    }
    .sig-employee-name {
      font-size: 11px;
      font-weight: 600;
      margin-top: 4px;
    }

    /* ════════════════════════════════════════════
       TWO BORDERED BOXES
    ════════════════════════════════════════════ */
    .box-row {
      display: flex;
      gap: 14px;
      margin-top: 10px;
      margin-bottom: 4px;
      align-items: stretch;
    }
    .box {
      border: 1px solid #333;
      padding: 8px 10px;
      font-size: 11px;
      display: flex;
      flex-direction: column;
    }
    .box-left  { flex: 0 0 52%; }
    .box-right { flex: 1; }

    /* Leave position header line */
    .box-header-line {
      font-size: 11px;
      margin-bottom: 6px;
    }

    /* Leave balance table */
    .leave-tbl {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    .leave-tbl th,
    .leave-tbl td {
      border: 1px solid #555;
      padding: 3px 5px;
      text-align: center;
    }
    .leave-tbl th {
      background: #f0f0f0;
      font-weight: 700;
    }
    .leave-tbl td:first-child {
      text-align: left;
    }

    /* Admin signature at bottom of left box */
    .box-admin-sig {
      margin-top: auto;
      padding-top: 14px;
      font-size: 11px;
      text-align: center;
    }
    .box-admin-sig .check {
      text-decoration: underline;
      font-weight: 700;
    }

    /* Right box content */
    .box-right-text {
      font-size: 11px;
      line-height: 1.9;
    }
    .box-director {
      margin-top: auto;
      font-size: 11px;
      padding-top: 10px;
    }

    /* ════════════════════════════════════════════
       BELOW BOXES  — Executive Director (right)
    ════════════════════════════════════════════ */
    .below-boxes {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 10px;
      margin-top: 4px;
      font-size: 11px;
    }

    /* ════════════════════════════════════════════
       SECTION DIVIDER
    ════════════════════════════════════════════ */
    .section-rule {
      border-top: 3px solid #222;
      margin: 10px 0 12px;
    }

    /* ════════════════════════════════════════════
       JOINING REPORT SECTION
    ════════════════════════════════════════════ */
    .joining-title {
      text-align: center;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .joining-field {
      font-size: 11px;
      color: #000;
      margin-bottom: 5px;
      display: flex;
      align-items: baseline;
    }
    .joining-fill {
      flex: 1;
      border-bottom: 1px dotted #000;
      margin-left: 3px;
      min-width: 100px;
    }
    .joining-gap { margin-top: 14px; }

    /* Signature block (short line + label) */
    .sig-block-small {
      margin-top: 16px;
    }
    .sig-short-line {
      width: 160px;
      border-top: 1px solid #000;
      margin-bottom: 3px;
    }
    .sig-block-label {
      font-size: 11px;
    }
    .blue-label {
      color: #000;
      font-size: 11px;
      margin-bottom: 3px;
    }

    /* ════════════════════════════════════════════
       SIGNATURE SECTION
    ════════════════════════════════════════════ */
    .sig-section{margin-top:10px;padding:8px;border:1px dashed #ccc;border-radius:4px}
    .sig-section-title{font-size:11px;font-weight:700;margin-bottom:6px;color:#444}
    .sig-grid{display:flex;gap:12px;flex-wrap:wrap}
    .sig-grid-item{flex:1;min-width:150px;max-width:200px}
    .sig-name{font-size:10px;font-weight:600;color:#333;margin-top:2px}

    /* ════════════════════════════════════════════
       PRINT
    ════════════════════════════════════════════ */
    @media print {
      body { padding: 0; }
      @page { size: A4; margin: 1.1cm 1.2cm; }
    }
  </style>
</head>
<body>

  <!-- ═══════════════════ ORG HEADER ═══════════════════ -->
  <div class="header">
    <img
      class="header-logo"
      src="${baseUrl}/icons/logo.png"
      alt="LEDARS Logo"
      onerror="this.style.display='none'"
    >
    <img
      class="header-name"
      src="${baseUrl}/icons/name_img.png"
      alt="LEDARS — Shyamnagar, Satkhira."
      onerror="this.style.display='none'"
    >
  </div>
  <div class="header-rule"></div>

  <!-- ═══════════════════ FORM TITLE ═══════════════════ -->
  <div class="form-title">Leave Application</div>

  <!-- ═══════════════════ DATE (right) ═══════════════════ -->
  <div class="date-row">
    Date: <span class="date-dots">${currentDate}</span>
  </div>

  <!-- ═══════════════════ INFO LABELS ═══════════════════ -->
  <div class="info-label">Name of Applicant: ${employeeName}</div>
  <div class="info-label">Designation: ${designation}</div>
  <div class="info-label">Project: ${project}</div>

  <!-- ═══════════════════ LEAVE PARAGRAPH ═══════════════════ -->
  <div class="para-line">
    I am applying for &nbsp;${days}&nbsp;days ${leaveType} leave from &nbsp;${startDate}&nbsp;
  </div>
  <div class="para-line">
    to&nbsp;${endDate}&nbsp; for the purpose of &nbsp;${reason}&nbsp;
  </div>

  <!-- ═══════════════════ CONTRACT ADDRESS + APPLICANT SIGNATURE ═══════════════════ -->
  <div class="addr-sig-row">
    <!-- Left: address dotted lines -->
    <div class="addr-col">
      <div class="addr-label">Contact Address at leave</div>
      <div class="addr-value">${contactAddress || '..........................................................................'}</div>
      ${!contactAddress ? '<div class="addr-dots">..........................................................................</div>' : ''}
    </div>

    <!-- Right: Signature of Applicant -->
    <div class="sig-right">
      ${signatureImage ? `<img src="${signatureImage}" style="max-width: 160px; max-height: 60px; object-fit: contain;" alt="Signature">` : '<div class="sig-line-top"></div>'}
      <div class="sig-right-label">Signature of the Applicant</div>
      <div class="sig-employee-name">${employeeName}</div>
    </div>
  </div>


  <!-- ═══════════════════ TWO BORDERED BOXES ═══════════════════ -->
  <div class="box-row">

    <!-- Left box: Leave position table -->
    <div class="box box-left">
      <div class="box-header-line">
        Applying Leave position as on &nbsp;..........................
      </div>
      <table class="leave-tbl">
        <thead>
          <tr>
            <th>Particular</th>
            <th>Casual<br>Leave</th>
            <th>Sick<br>Leave</th>
            <th>Earned<br>Leave</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Opening Balance</td>
            <td>...${casualLeave.used}...day</td>
            <td>..${sickLeave.used}....day</td>
            <td>..${earnedLeave.used}....day</td>
          </tr>
          <tr>
            <td>Applying Leave</td>
            <td>...${casualLeave.pending}...day</td>
            <td>..${sickLeave.pending}....day</td>
            <td>..${earnedLeave.pending}....day</td>
          </tr>
          <tr>
            <td>Balance</td>
            <td>..${casualLeave.remaining}....day</td>
            <td>..${sickLeave.remaining}....day</td>
            <td>..${earnedLeave.remaining}....day</td>
          </tr>
        </tbody>
      </table>
      <div class="box-admin-sig">
      <div>${renderSigField(row?.admin_check_sign, 'Signature and Designation (Admin Sec):')}</div>
        <div class="check">Check and Filing</div>
      </div>
    </div>

    <!-- Right box: Recommendation -->
    <div class="box box-right">
      <div class="box-right-text">
        Recommended &nbsp;${days}&nbsp;days leave<br>
        with pay/ without pay or regretted due<br>
        to.............................................
      </div>
      <div>${renderSigField(row?.req_unit_head_sign, 'Program Director / Unit Head')}</div>
      <div class="box-director">
        Executive Director / Program Director
      </div>
    </div>

  </div>

  <!-- ═══════════════════ BELOW BOXES ═══════════════════ -->
  <div class="below-boxes">
    ${renderSigField(row?.req_excutive_sign, 'Executive Director / Program Director')}
  </div>

  <!-- ═══════════════════ SECTION DIVIDER ═══════════════════ -->
  <div class="section-rule"></div>

  <!-- ═══════════════════ JOINING REPORT ═══════════════════ -->
  <div class="joining-title">Joining Report</div>

  <div class="joining-field">
    <span>Date:</span><span class="joining-fill">${row?.actual_joining_date ? fmtDate(row.actual_joining_date) : ''}</span>
  </div>
  <div class="joining-field">
    <span>Joining date as per leave:</span><span class="joining-fill">${row?.as_per_leave_joining_date ? fmtDate(row.as_per_leave_joining_date) : ''}</span>
  </div>
  <div class="joining-field">
    <span>Actual date of joining:</span><span class="joining-fill">${row?.actual_joining_date ? fmtDate(row.actual_joining_date) : ''}</span>
  </div>

 

  <!-- Signature of employee -->
  <div class="sig-block-small">
    <div class="sig-short-line"></div>
    ${renderSigField(row?.joining_employee_sign, 'Signature of the employee')}
    <div class="blue-label">Additional leave (if any) recommended with pay/without pay.</div>
    <div class="blue-label">Accepted joining</div>
  </div>

  <!-- Program Director signature -->
  <div class="sig-block-small" style="margin-top:24px;">
    <div class="sig-short-line"></div>
    ${renderSigField(row?.joining_excutive_sign, 'Program Director / Executive Director')}
  </div>

</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    /* small delay so images load before print dialog */
    setTimeout(() => win.print(), 700);
  };

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
                            leaveBalances
                            selected={table.selected.includes(row.id)}
                            onSelectRow={() => table.onSelectRow(row.id)}
                            onDeleteRow={handleDeleteRow}
                            canChange={canChange}
                            canDelete={canDelete}
                            isEmployee={isEmployee}
                            user={user}
                            flag={flag}
                            isAdmin={isAdmin}
                            onPrint={handleLeaveRequestPrint}
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
