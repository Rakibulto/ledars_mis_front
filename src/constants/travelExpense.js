export const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'default' },
  submitted: { label: 'Submitted', color: 'info' },
  approved: { label: 'Approved', color: 'success' },
};

export const SIGN_ROLES = {
  prepared_received: 'Prepared & Received By',
  checked_by: 'Checked By',
  accountant: 'Accountant',
  approved_by: 'Approved By',
};

export const emptyExpenseRow = () => ({
  date_time: '',
  description: '',
  mode: '',
  travel_fare: '',
  food: '',
  lodging: '',
  row_total: 0,
  files: [],
});

export const defaultFormValues = {
  project: '',
  date_of_submission: '',
  name: '',
  designation: '',
  purpose: '',
  note: '',
  expense_rows: [emptyExpenseRow()],
};
