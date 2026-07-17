export const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'default' },
  submitted: { label: 'Submitted', color: 'info' },
  approved: { label: 'Approved', color: 'success' },
};

export const SIGN_ROLES = {
  submitted_by: 'Submitted By',
  checked_supervised: 'Checked and Supervised By',
  approved_by: 'Approved By',
};

export const emptyScheduleRow = (sl) => ({
  sl,
  date: '',
  travel_route: '',
  description: '',
  expense_travel: '',
  expense_food: '',
  expense_lodging: '',
  expense_others: '',
});

export const defaultFormValues = {
  name: '',
  designation: '',
  grade: '',
  purpose_of_travel: '',
  project_name: [],
  schedule_rows: [emptyScheduleRow(1)],
};
