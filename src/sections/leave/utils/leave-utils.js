import dayjs from 'dayjs';
import ExcelJS from 'exceljs';

// Helper function to calculate the number of days between two dates
export function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 1;

  const start = new Date(startDate);
  const end = new Date(endDate);

  const timeDiff = Math.abs(end - start);

  return Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
}

export function calculateLeaveDays(start, end) {
  if (!start || !end) return '';
  // Specify the format as 'DD-MM-YYYY'
  const startDate = dayjs(start, 'DD-MM-YYYY');
  const endDate = dayjs(end, 'DD-MM-YYYY');
  if (!startDate.isValid() || !endDate.isValid()) return '';
  return endDate.diff(startDate, 'day') + 1;
}

// Export leave requests to Excel
export async function exportLeaveRequestsToExcel(leaveRequests, fileName = 'leave-requests.xlsx') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Leave Requests');

  // Define columns
  worksheet.columns = [
    { header: 'Employee Name', key: 'employee_name', width: 22 },
    { header: 'Employee ID', key: 'employee_id', width: 16 },
    { header: 'Department', key: 'department_name', width: 18 },
    { header: 'Branch', key: 'branch_name', width: 18 },
    { header: 'Leave Type', key: 'leave_policy_name', width: 18 },
    { header: 'Start Date', key: 'start_date', width: 15 },
    { header: 'End Date', key: 'end_date', width: 15 },
    { header: 'Total Days', key: 'days', width: 12 },
    { header: 'Half Day Period', key: 'half_day_period', width: 15 },
    { header: 'Reason', key: 'reason', width: 30 },
    { header: 'Status', key: 'status', width: 12 },
  ];

  // Add rows
  leaveRequests.forEach((req) => {
    worksheet.addRow({
      employee_name: req.employee_name || '',
      employee_id: req.employee_id || '',
      department_name: req.department_name || '',
      branch_name: req.branch_name || '',
      leave_policy_name: req.leave_policy_name || '',
      start_date: req.start_date || '',
      end_date: req.end_date || '',
      days: req.requested_days || '',
      half_day_period: req.half_day_period || '',
      reason: req.reason || '',
      status: req.status ? req.status.charAt(0).toUpperCase() + req.status.slice(1) : '',
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
    col.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  // Add auto filter to all columns
  worksheet.autoFilter = {
    from: 'A1',
    to: worksheet.getRow(1).getCell(worksheet.columns.length).address,
  };

  // Download file in browser
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Export leave balance matrix to Excel
export async function exportLeaveBalanceMatrixToExcel(
  employees,
  policyNames,
  fileName = 'leave-balance-matrix.xlsx'
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Leave Balance Matrix');

  // Build header row
  const header = ['Employee ID', 'Employee Name', 'Department', 'Designation'];
  policyNames.forEach((policy) => {
    header.push(
      `${policy} (Used)`,
      `${policy} (Pending)`,
      `${policy} (Remaining)`,
      `${policy} (Total Allowed)`
    );
  });
  worksheet.addRow(header);

  // Add employee rows
  employees.forEach((emp) => {
    const row = [
      emp.employee_id || '',
      emp.employee_name || '',
      emp.department || '',
      emp.designation || '',
    ];
    policyNames.forEach((policy) => {
      const leave = emp.policies[policy];
      row.push(
        leave ? leave.used : '-',
        leave ? leave.pending : '-',
        leave ? leave.remaining : '-',
        leave ? leave.total_allowed : '-'
      );
    });
    worksheet.addRow(row);
  });

  // Style header
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1976D2' },
  };
  worksheet.columns.forEach((col) => {
    col.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    col.width = 18;
  });

  // Add auto filter to all columns
  worksheet.autoFilter = {
    from: 'A1',
    to: worksheet.getRow(1).getCell(worksheet.columns.length).address,
  };

  // Download file in browser
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
