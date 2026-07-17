import dayjs from 'dayjs';
import ExcelJS from 'exceljs';

// ----------------------------------------------------------------------

// Calculate working hours
export function calculateWorkingHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;

  try {
    const checkInTime = dayjs(checkIn, 'DD-MM-YYYY HH:mm:ss');
    const checkOutTime = dayjs(checkOut, 'DD-MM-YYYY HH:mm:ss');

    if (!checkInTime.isValid() || !checkOutTime.isValid()) return 0;

    // Calculate difference in hours (as decimal)
    const diffHours = checkOutTime.diff(checkInTime, 'minute') / 60;

    // Return rounded to 2 decimal places
    return Math.round(diffHours * 100) / 100;
  } catch (error) {
    console.error('Error calculating working hours:', error);
    return 0;
  }
}

// Get the difference in days between two dates for custom date range filter
export function getDateDiffInDays(start, end) {
  if (!start || !end) return 0;
  return dayjs(end).diff(dayjs(start), 'day') + 1;
}

export function getStatusColor(row) {
  const status = row?.status;

  if (status === 'Present') return 'success';
  if (status === 'Late') return 'orange';
  if (status === 'Early Leave') return 'pink';
  if (status === 'Overtime') return 'blue';
  if (status === 'Absent') return 'error';
  if (status === 'Not Detected') return 'warning';
  if (status === 'Holiday') return 'blue';
  if (status === 'Half Day') return 'tertiary';
  if (status === 'Half Day Leave') return 'tertiary';
  if (status === 'Weekend') return 'secondary';
  if (status === 'Leave') return 'warning';

  return 'default';
}

export const STATUS_COLORS = {
  Present: 'success.main',
  Absent: 'error.main',
  Late: 'orange.main',
  'Half Day': 'tertiary.main',
  'Half Day Leave': 'tertiary.main',
  'Early Leave': 'pink.main',
  Overtime: 'blue.main',
  'Not Detected': 'grey.400',
  Holiday: 'blue.main',
  Weekend: 'secondary.main',
  Leave: 'warning.main',
};

export function getCalendarStatusColor(status, theme) {
  return STATUS_COLORS[status]
    ? theme.palette[STATUS_COLORS[status].split('.')[0]][STATUS_COLORS[status].split('.')[1]]
    : theme.palette.grey[400];
}

export const getStatusColors = (status) => {
  switch (status) {
    case 'Total':
      return 'tertiary';
    case 'Present':
      return 'success';
    case 'Absent':
      return 'error';
    case 'Late':
      return 'orange';
    case 'Early Leave':
      return 'pink';
    case 'On Leave':
      return 'warning';
    case 'Holiday':
      return 'blue';
    case 'Weekend':
      return 'secondary';
    case 'Half Day Leave':
      return 'tertiary';
    case 'Half Day':
      return 'tertiary';
    default:
      return 'primary';
  }
};

// Map status to Excel fill color (ARGB)
const STATUS_EXCEL_COLORS = {
  Present: 'FF5BE49B', // Green
  Absent: 'FFFFAC82', // Red
  Late: 'FFFFAB57', // Orange
  'Early Leave': 'FFFF8EBF', // Pink
  Overtime: 'FF76B0F1', // Blue
  'Not Detected': 'FFBDBDBD', // Grey
  'Half Day': 'FFFFB1C9', // Tertiary
  Holiday: 'FF76B0F1', // Blue
  Weekend: 'FFC684FF', // Purple
  Leave: 'FFFFD666', // Yellow
  'Half Day Leave': 'FFFFB1C9', // Tertiary
};

export const getRoleColor = (role) => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'primary';
    case 'supervisor':
      return 'secondary';
    case 'employee':
      return 'info';
    default:
      return 'default';
  }
};

// Export attendance data to Excel
export async function exportAttendanceToExcel(dataFiltered, fileName = 'attendance-report.xlsx') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance');

  // Define columns
  worksheet.columns = [
    { header: 'Employee ID', key: 'employeeId', width: 15 },
    { header: 'RFID No', key: 'rfid_no', width: 15 },
    { header: 'Name', key: 'employee_name', width: 20 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Department', key: 'department', width: 18 },
    { header: 'Designation', key: 'designation', width: 18 },
    { header: 'Branch', key: 'branch', width: 15 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Check In', key: 'check_in', width: 18 },
    { header: 'Check Out', key: 'check_out', width: 18 },
    { header: 'Late', key: 'is_late', width: 10 },
    { header: 'Late By', key: 'late_by', width: 12 },
    { header: 'Early Out By', key: 'early_out_by', width: 14 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Remarks', key: 'remarks', width: 20 },
  ];

  // Add rows
  dataFiltered.forEach((emp) => {
    const info = emp.employee_info || {};
    (emp.attendance || []).forEach((att) => {
      const row = worksheet.addRow({
        employeeId: info.employeeId || '',
        rfid_no: info.rfid_no || '',
        employee_name: info.employee_name || '',
        email: info.email || '',
        department: info.department || '',
        designation: info.designation || '',
        branch: info.branch || '',
        date: att.date || '',
        check_in: att.check_in || '',
        check_out: att.check_out || '',
        is_late: att.is_late ? 'Yes' : '',
        late_by: att.late_by || '',
        early_out_by: att.early_out_by || '',
        status: att.status || '',
        remarks: att.remarks || '',
      });

      // Color the "Status" cell
      const statusColIndex = worksheet.columns.findIndex((col) => col.key === 'status') + 1;
      const fillColor = STATUS_EXCEL_COLORS[att.status] || 'FFFFFFFF';
      row.getCell(statusColIndex).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: fillColor },
      };
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
    to: lastCell ? lastCell.address : 'N1',
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

// Export monthly attendance data to Excel
export async function exportMonthlyAttendanceToExcel(
  data,
  fileName = 'monthly-attendance-report.xlsx'
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Monthly Attendance');

  worksheet.columns = [
    { header: 'Employee ID', key: 'employeeId', width: 15 },
    { header: 'RFID No', key: 'rfid_no', width: 15 },
    { header: 'Name', key: 'employee_name', width: 20 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Department', key: 'department', width: 18 },
    { header: 'Designation', key: 'designation', width: 18 },
    { header: 'Branch', key: 'branch', width: 15 },
    { header: 'Total On Time', key: 'on_time', width: 10 },
    { header: 'Total Present', key: 'present', width: 10 },
    { header: 'Total Absent', key: 'absent', width: 10 },
    { header: 'Total Late', key: 'late', width: 10 },
    { header: 'Total Early Out', key: 'early_leave', width: 10 },
    { header: 'Total Half Day', key: 'half_day', width: 10 },
    { header: 'Total Leave', key: 'leave', width: 10 },
    { header: 'Total Half Day Leave', key: 'half_day_leave', width: 10 },
    { header: 'Total Adjustments', key: 'adjustment', width: 14 },
    { header: 'Total Weekend', key: 'weekend', width: 10 },
    { header: 'Total Holiday', key: 'holiday', width: 10 },
  ];

  // Add rows
  data.forEach((emp) => {
    const info = emp.employee_info || {};
    let present = 0;
    let absent = 0;
    let late = 0;
    let earlyLeave = 0;
    let halfDay = 0;
    let leave = 0;
    let halfDayLeave = 0;
    let adjustment = 0;
    let on_time = 0;
    let weekend = 0;
    let holiday = 0;

    (emp.attendance || []).forEach((att) => {
      // Count as present if status is any of these
      if (att.check_in) {
        present += 1;
      }
      if (att.status === 'Present' && att.check_in && att.check_out) on_time += 1;
      if (att.status === 'Weekend' && !att.check_in && !att.check_out) weekend += 1;
      if (att.status === 'Holiday') holiday += 1;
      if (att.status === 'Absent') absent += 1;
      if (att.is_late) late += 1;
      if (
        att.status !== 'Half Day Leave' &&
        att.status !== 'Leave' &&
        (att.early_out_by || (att.check_in && !att.check_out))
      )
        earlyLeave += 1;
      if (att.status === 'Half Day') halfDay += 1;
      if (att.status === 'Leave') leave += 1;
      if (att.status === 'Half Day Leave') halfDayLeave += 1;
      if (att.remarks && att.remarks.toLowerCase().includes('attendance adjusted')) adjustment += 1;
    });

    const rowObj = {
      employeeId: info.employeeId || '',
      rfid_no: info.rfid_no || '',
      employee_name: info.employee_name || '',
      email: info.email || '',
      department: info.department || '',
      designation: info.designation || '',
      branch: info.branch || '',
      on_time,
      present,
      absent,
      late,
      early_leave: earlyLeave,
      half_day: halfDay,
      leave,
      half_day_leave: halfDayLeave,
      adjustment,
      weekend,
      holiday,
    };

    worksheet.addRow(rowObj);
  });

  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1976D2' },
  };
  worksheet.columns.forEach((col) => {
    col.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  const headerRow = worksheet.getRow(1);
  const { lastCell } = headerRow;
  worksheet.autoFilter = {
    from: 'A1',
    to: lastCell ? lastCell.address : worksheet.getRow(1).getCell(worksheet.columns.length).address,
  };

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
