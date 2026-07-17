// Helper function to calculate the number of days between two dates
export function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 1;

  const start = new Date(startDate);
  const end = new Date(endDate);

  const timeDiff = Math.abs(end - start);

  return Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
}

// Helper function to determine holiday types
export const getHolidayTypes = (holiday) => {
  const types = [];
  if (holiday.branches_data?.length > 0) types.push('Branch');
  if (holiday.departments_data?.length > 0) types.push('Department');
  if (holiday.designations_data?.length > 0) types.push('Designation');
  if (holiday.employment_types && holiday.employment_types !== 'all') types.push('Employee Type');
  if (holiday.assigned_employees_data?.length > 0) types.push('Assigned Employees');
  if (holiday.excluded_employees_data?.length > 0) types.push('Excluded Employees');
  return types;
};

// Helper function to get employee display name
export const getEmployeeDisplayName = (employee) => {
  if (employee.employee_name) {
    return employee.employee_name;
  }
  if (employee.user?.username) {
    return employee.user.username;
  }
  if (employee.user?.email) {
    return employee.user.email;
  }
  return `Employee ${employee.user?.id || employee.id}`;
};
