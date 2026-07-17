import {
  info,
  blue,
  pink,
  error,
  orange,
  primary,
  success,
  warning,
  tertiary,
  secondary,
} from 'src/theme/core/palette';

// ----------------------------------------------------------------------

// user-list-view
export const USER_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'resigned', label: 'Resigned' },
  { value: 'incomplete', label: 'Incomplete' },
];

// user-new-edit-form
export const GENDER_OPTIONS = ['male', 'female', 'other'];
export const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const MARITAL_STATUS_OPTIONS = ['single', 'married', 'divorced', 'widowed'];
export const EMPLOYMENT_TYPE_OPTIONS = [
  'General Staff (Probation)',
  'General Staff (Regular)',
  'Teachers (Probation)',
  'Teachers (Regular)',
];
export const STATUS = ['active', 'terminated', 'resigned', 'incomplete'];
export const OFFICE_DAYS_OPTIONS = [
  'Sunday-Thursday',
  'Saturday-Thursday',
  'Monday-Thursday',
  'Custom',
];
export const RELIGION_OPTIONS = ['Islam', 'Hindu', 'Christian', 'Buddhist', 'Other'];

// leave-policy-view
// Fields for form and table
export const effectiveFromOptions = [
  { value: 'joining', label: 'From Joining' },
  { value: 'confirmation', label: 'After Confirmation' },
  { value: 'one_year', label: 'After 1 Year of Service' },
];

export const genderOptions = [
  { value: 'any', label: 'Any' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

// adjustment-form
export const ADJUSTMENT_TYPES = [
  { value: 'forgot_sign_in', label: 'Forgot to Sign In' },
  { value: 'forgot_sign_out', label: 'Forgot to Sign Out' },
  { value: 'traffic_delay', label: 'Traffic Delay' },
  { value: 'personal_emergency', label: 'Personal Emergency' },
  { value: 'other', label: 'Other' },
];

// holiday-calendar-view
export const CALENDAR_COLOR_OPTIONS = [
  primary.darker,
  secondary.darker,
  info.darker,
  blue.darker,
  tertiary.darker,
  pink.darker,
  orange.darker,
  warning.darker,
  success.darker,
  error.darker,
];

// leave-reset-period-view
export const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

// leave-approval-list-view
// leave-request-list-view
export const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

// dailt-attendance-view
export const ATTENDANCE_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'Present', label: 'Present' },
  { value: 'Absent', label: 'Absent' },
  { value: 'Late', label: 'Late' },
  { value: 'Early Leave', label: 'Early Out' },
  { value: 'Checked In', label: 'Checked In' },
  { value: 'Checked Out', label: 'Checked Out' },
  { value: 'Half Day', label: 'Half Day' },
  { value: 'Leave', label: 'Leave' },
  { value: 'Holiday', label: 'Holiday' },
  { value: 'Weekend', label: 'Weekend' },
];

// attendance-view
export const ATTENDANCE_STATUS = [
  'Present',
  'Absent',
  'Late',
  'Overtime',
  'Early Leave',
  'Not Detected',
];

// adjustment-approval-view
export const APPROVAL_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];
