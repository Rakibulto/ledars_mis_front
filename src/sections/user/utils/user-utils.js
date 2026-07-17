// formatToE164 function
export const formatToE164 = (phoneNumber) => {
  if (!phoneNumber) return '';

  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  // If already in E.164 format, return as is
  if (phoneNumber.startsWith('+')) return phoneNumber;

  // For Bangladesh numbers (starting with 01)
  if (phoneNumber.startsWith('01')) {
    return `+880${phoneNumber.substring(1)}`;
  }

  // For numbers that might have country code already (without +)
  if (digitsOnly.length > 10) {
    return `+${digitsOnly}`;
  }

  // For other numbers, add Bangladesh country code as default
  return `+880${digitsOnly}`;
};

// Supervisor: specific permissions
export const supervisorCodenames = [
  'view_leaveapproval',
  'change_leaveapproval',
  'view_leaverequest',
  'add_leaverequest',
  'change_leaverequest',
  'view_own_attendance',
  'view_subordinate_attendance',
  'add_attendancedata',
  'add_attendanceadjustmentrequest',
  'view_attendanceadjustmentrequest',
  'change_attendanceadjustmentrequest',
  'view_attendanceadjustmentapproval',
  'change_attendanceadjustmentapproval',
];

// Employee: specific permissions
export const employeeCodenames = [
  'view_leaverequest',
  'add_leaverequest',
  'change_leaverequest',
  'view_own_attendance',
  'add_attendancedata',
  'add_attendanceadjustmentrequest',
  'view_attendanceadjustmentrequest',
  'change_attendanceadjustmentrequest',
];
