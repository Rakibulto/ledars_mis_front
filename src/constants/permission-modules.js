export const PERMISSION_MODULES = [
  {
    key: 'meeting_management',
    label: 'Meeting Management',
    icon: 'solar:calendar-mark-bold-duotone',
    color: '#3b82f6',
    bg: '#eff6ff',
  },
  {
    key: 'crm',
    label: 'CRM',
    icon: 'solar:users-group-rounded-bold-duotone',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    key: 'movement_management',
    label: 'Movement Management',
    icon: 'solar:delivery-bold-duotone',
    color: '#0ea5e9',
    bg: '#f0f9ff',
  },
  {
    key: 'procurement',
    label: 'Procurement Management',
    icon: 'solar:cart-large-2-bold-duotone',
    color: '#f59e0b',
    bg: '#fffbeb',
    submodules: [
      {
        label: 'Material Requisitions',
        pages: [{ model: 'materialrequisition', name: 'Material Requisitions' }],
      },
      { label: 'RFQ Management', pages: [{ model: 'rfq', name: 'RFQ' }] },
      { label: 'Quotations', pages: [{ model: 'vendorquotation', name: 'Quotations' }] },
      {
        label: 'Comparative Statements',
        pages: [{ model: 'comparativestatement', name: 'Comparative Statements' }],
      },
      { label: 'Awards', pages: [{ model: 'award', name: 'Awards' }] },
      { label: 'Work Orders', pages: [{ model: 'workorder', name: 'Work Orders' }] },
      { label: 'Direct Purchase', pages: [{ model: 'directpurchase', name: 'Direct Purchase' }] },
      {
        label: 'Goods Receive Notes',
        pages: [{ model: 'goodsreceiptnote', name: 'Goods Receive Notes' }],
      },
      { label: 'Inventory', pages: [{ model: 'warehouse', name: 'Inventory / Warehouses' }] },
      {
        label: 'Payment Requisitions',
        pages: [{ model: 'paymentrequisition', name: 'Payment Requisitions' }],
      },
      {
        label: 'Treasury & Finance',
        pages: [{ model: 'treasuryprocessing', name: 'Treasury Processing' }],
      },
      {
        label: 'Vendors',
        pages: [
          { model: 'vendorverification', name: 'Vendor Verification' },
          { model: 'vendorcategory', name: 'Vendor Categories' },
          { model: 'vendorcategorymapping', name: 'Category Mapping' },
        ],
      },
      {
        label: 'Reports & Notifications',
        pages: [{ model: 'procurementnotification', name: 'Notifications' }],
      },
      {
        label: 'Settings',
        pages: [
          { model: 'usermanagement', name: 'User Management' },
          { model: 'procurementrole', name: 'Roles & Permissions' },
          { model: 'approvalmatrix', name: 'Approval Matrix' },
          { model: 'budget', name: 'Budget Codes' },
          { model: 'accountcategory', name: 'Account Categories' },
          { model: 'account', name: 'Account Codes' },
          { model: 'emailtemplate', name: 'Email Templates' },
          { model: 'notificationsetting', name: 'Notification Settings' },
          { model: 'officemanagement', name: 'Office Management' },
          { model: 'fiscalyear', name: 'Fiscal Year' },
          { model: 'currency', name: 'Currency & Rates' },
        ],
      },
    ],
  },
  {
    key: 'project_managements',
    label: 'Project Managements',
    icon: 'solar:folder-with-files-bold-duotone',
    color: '#6366f1',
    bg: '#eef2ff',
    submodules: [
      {
        label: 'Projects',
        pages: [
          { model: 'projectmanagementproject', name: 'Projects' },
          { model: 'projectmanagementprojectplan', name: 'Project Plans' },
          { model: 'projectmanagementunit', name: 'Project Units' },
        ],
      },
      {
        label: 'Task Management',
        pages: [{ model: 'projectmanagementplanworkitem', name: 'Tasks / Work Items' }],
      },
      {
        label: 'Expense Management',
        pages: [
          { model: 'projectmanagementexpense', name: 'Expenses' },
          { model: 'advance', name: 'Advance Receivables' },
        ],
      },
    ],
  },
  {
    key: 'donor',
    label: 'Ledars Management',
    icon: 'solar:hand-heart-bold-duotone',
    color: '#14b8a6',
    bg: '#f0fdfa',
    submodules: [
      {
        label: 'Donor Management',
        pages: [
          { model: 'donor', name: 'Donors' },
          { model: 'donorledger', name: 'Donor Ledgers' },
        ],
      },
    ],
  },
  {
    // UI key is "hrm"; Django stores HRM across multiple app_labels.
    key: 'hrm',
    appLabels: [
      'employee',
      'shift',
      'attendance',
      'holiday',
      'leave',
      'payroll',
      'final_settlement',
    ],
    label: 'HRM',
    icon: 'solar:users-group-rounded-bold-duotone',
    color: '#0ea5e9',
    bg: '#f0f9ff',
    submodules: [
      {
        label: 'Employee',
        pages: [
          { model: 'employee', name: 'Employees' },
          { model: 'salary', name: 'Salary' },
        ],
      },
      {
        label: 'Organization Settings',
        pages: [
          { model: 'department', name: 'Department' },
          { model: 'designation', name: 'Designation' },
          { model: 'branch', name: 'Branch' },
          { model: 'grade', name: 'Grade' },
          { model: 'shift', name: 'Shift' },
        ],
      },
      {
        label: 'Attendance',
        pages: [
          { model: 'attendancedata', name: 'Attendance Data' },
          { model: 'attendanceadjustmentrequest', name: 'Adjustment Requests' },
          { model: 'attendanceadjustmentapproval', name: 'Adjustment Approvals' },
          { model: 'cutoff', name: 'Cut-off Date' },
        ],
      },
      {
        label: 'Holiday',
        pages: [{ model: 'holiday', name: 'Holidays' }],
      },
      {
        label: 'Leave Operations',
        pages: [
          { model: 'leaverequest', name: 'Leave Requests' },
          { model: 'leaveapproval', name: 'Leave Approvals' },
        ],
      },
      {
        label: 'Leave Settings',
        pages: [
          { model: 'leavegroup', name: 'Leave Groups' },
          { model: 'leavepolicy', name: 'Leave Policies' },
          { model: 'leavereset', name: 'Reset Period' },
          { model: 'specialleavepolicy', name: 'Special Policies' },
          { model: 'supervisorlevel', name: 'Supervisor Level' },
        ],
      },
      {
        label: 'Payroll',
        pages: [{ model: 'payroll', name: 'Payroll' }],
      },
      {
        label: 'Final Settlement',
        pages: [{ model: 'finalsettlement', name: 'Final Settlement' }],
      },
    ],
  },
  {
    key: 'beneficiary',
    label: 'Beneficiaries',
    icon: 'solar:users-group-rounded-bold-duotone',
    color: '#06b6d4',
    bg: '#ecfeff',
    submodules: [
      {
        label: 'Registration & Database',
        pages: [
          { model: 'beneficiary', name: 'Beneficiaries' },
          { model: 'vulnerabilitytype', name: 'Vulnerability Types' },
        ],
      },
      {
        label: 'Assessment & Targeting',
        pages: [
          { model: 'vulnerabilityassessment', name: 'Vulnerability Assessment' },
          { model: 'targetingcriteria', name: 'Targeting Criteria' },
          { model: 'needsassessment', name: 'Needs Assessment' },
          { model: 'eligibilityscreening', name: 'Eligibility Screening' },
        ],
      },
      {
        label: 'Household Management',
        pages: [
          { model: 'householdprofiling', name: 'Household Profiling' },
          { model: 'householdsurvey', name: 'Household Surveys' },
        ],
      },
      {
        label: 'Accountability',
        pages: [
          { model: 'complaintsfeedback', name: 'Complaints & Feedback' },
          { model: 'satisfactionsurvey', name: 'Satisfaction Surveys' },
          { model: 'grievanceredressal', name: 'Grievance Redressal' },
        ],
      },
      {
        label: 'Reports & Analytics',
        pages: [
          { model: 'donorreport', name: 'Donor Report' },
          { model: 'attendancetracker', name: 'Attendance Tracker' },
          { model: 'coveragearea', name: 'Coverage Map' },
        ],
      },
      {
        label: 'Settings',
        pages: [{ model: 'beneficiarysetting', name: 'Settings' }],
      },
    ],
  },
  {
    key: 'inventory',
    label: 'Store & Inventory',
    icon: 'solar:box-bold-duotone',
    color: '#78716c',
    bg: '#fafaf9',
    submodules: [
      {
        label: 'Products',
        pages: [
          { model: 'item', name: 'Item Master' },
          { model: 'category', name: 'Categories' },
          { model: 'unitofmeasure', name: 'Units of Measure' },
        ],
      },
      {
        label: 'Operations',
        pages: [
          { model: 'gin', name: 'Goods Issue Note' },
          { model: 'stocktransfer', name: 'Internal Transfers' },
          { model: 'stockadjustment', name: 'Stock Adjustment' },
          { model: 'scraprecord', name: 'Scrap Management' },
          { model: 'returnrecord', name: 'Return Management' },
        ],
      },
      {
        label: 'Inventory Log',
        pages: [
          { model: 'locationstock', name: 'Inventory List' },
          { model: 'stockmove', name: 'Stock Moves / History' },
        ],
      },
      {
        label: 'Warehouse & Locations',
        pages: [
          { model: 'warehouse', name: 'Warehouses' },
          { model: 'storagelocation', name: 'Storage Locations' },
        ],
      },
      {
        label: 'Quality Control',
        pages: [
          { model: 'qualitycheck', name: 'Quality Checks' },
          { model: 'qualityalert', name: 'Quality Alerts' },
          { model: 'qualitycontrolpoint', name: 'Control Points' },
        ],
      },
      {
        label: 'Settings',
        pages: [{ model: 'inventorysettings', name: 'Inventory Settings' }],
      },
    ],
  },
  {
    key: 'accounting',
    label: 'Accounting & Finance',
    icon: 'solar:wallet-money-bold-duotone',
    color: '#059669',
    bg: '#f0fdf4',
    submodules: [
      { label: 'Dashboard', pages: [{ model: 'accountingdashboard', name: 'Dashboard' }] },
      {
        label: 'Configuration',
        pages: [
          { model: 'account', name: 'Chart of Accounts' },
          { model: 'accounttype', name: 'Account Types' },
          { model: 'journal', name: 'Journals' },
          { model: 'tax', name: 'Taxes' },
          { model: 'currency', name: 'Currencies' },
          { model: 'costcenter', name: 'Cost Centers' },
          { model: 'fiscalyear', name: 'Fiscal Year' },
          { model: 'fiscalperiod', name: 'Fiscal Periods' },
          { model: 'bankaccount', name: 'Bank Accounts' },
          { model: 'paymentterm', name: 'Payment Terms' },
        ],
      },
      {
        label: 'Transactions',
        pages: [
          { model: 'journalentry', name: 'Journal Entries' },
          { model: 'bill', name: 'Vendor Bills' },
          { model: 'customerinvoice', name: 'Customer Invoices' },
          { model: 'creditnote', name: 'Credit Notes' },
          { model: 'debitnote', name: 'Debit Notes' },
          { model: 'expenseentry', name: 'Expense Entries' },
          { model: 'payrollentry', name: 'Payroll Entries' },
          { model: 'inventoryentry', name: 'Inventory Entries' },
          { model: 'voucher', name: 'Vouchers' },
          { model: 'deferredrevenue', name: 'Deferred Revenue' },
          { model: 'deferredexpense', name: 'Deferred Expenses' },
        ],
      },
      {
        label: 'Receivables',
        pages: [
          { model: 'customer', name: 'Customers' },
          { model: 'customerreceipt', name: 'Customer Receipts' },
        ],
      },
      {
        label: 'Payables',
        pages: [
          { model: 'vendor', name: 'Vendors' },
          { model: 'supplierpayment', name: 'Supplier Payments' },
        ],
      },
      {
        label: 'Banking',
        pages: [
          { model: 'banktransaction', name: 'Bank Transactions' },
          { model: 'bankreconciliation', name: 'Bank Reconciliation' },
          { model: 'cashtransaction', name: 'Cash Transactions' },
        ],
      },
      {
        label: 'Assets',
        pages: [
          { model: 'asset', name: 'Fixed Assets' },
          { model: 'assetdepreciation', name: 'Depreciation' },
          { model: 'assetdisposal', name: 'Disposal' },
        ],
      },
      {
        label: 'Budgets',
        pages: [
          { model: 'budget', name: 'Budget Plans' },
          { model: 'budgetline', name: 'Budget Lines' },
        ],
      },
      {
        label: 'Reports',
        pages: [
          { model: 'financialreporttemplate', name: 'Report Templates' },
          { model: 'generatedreport', name: 'Generated Reports' },
        ],
      },
      {
        label: 'Settings',
        pages: [
          { model: 'approvalworkflow', name: 'Approval Workflows' },
          { model: 'auditlog', name: 'Audit Log' },
        ],
      },
    ],
  },
];

export const PERMISSION_ACTIONS = [
  { key: 'view', label: 'View' },
  { key: 'add', label: 'Create' },
  { key: 'change', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
];

export function findPermForAction(perms, model, actionKey) {
  return perms.find(
    (p) =>
      p.content_type__model === model &&
      (p.codename === `${actionKey}_${model}` || p.codename.startsWith(`${actionKey}_`))
  );
}

export function getPermissionRows(mod, modPerms) {
  if (mod.submodules) {
    return mod.submodules.flatMap((sub) =>
      sub.pages.map((page) => ({
        key: `${sub.label}-${page.model}`,
        label: page.name,
        group: sub.label,
        model: page.model,
      }))
    );
  }

  const models = [...new Set(modPerms.map((p) => p.content_type__model))];

  if (models.length <= 1) {
    return [{ key: mod.key, label: mod.label, group: null, model: models[0] || null }];
  }

  return models.map((model) => ({
    key: model,
    label: model,
    group: null,
    model,
  }));
}

/** Django app_labels owned by a UI module (supports multi-app modules like HRM). */
export function getModuleAppLabels(mod) {
  if (!mod) return [];
  return mod.appLabels?.length ? mod.appLabels : [mod.key];
}

export function getAllManagedAppLabels() {
  return [...new Set(PERMISSION_MODULES.flatMap((mod) => getModuleAppLabels(mod)))];
}

export function getModuleByKey(moduleKey) {
  return PERMISSION_MODULES.find(
    (mod) => mod.key === moduleKey || getModuleAppLabels(mod).includes(moduleKey)
  );
}

/** Map Django app_labels → unique UI module keys (e.g. employee/leave → hrm). */
export function getUiModuleKeysFromAppLabels(appLabels = []) {
  return [
    ...new Set(
      appLabels
        .map((label) => getModuleByKey(label)?.key)
        .filter(Boolean)
    ),
  ];
}

export function getPermissionsForModule(mod, permissions = []) {
  const labels = new Set(getModuleAppLabels(mod));
  return permissions.filter((p) => labels.has(p.content_type__app_label || p.app_label));
}

export function getActionPermsForModule(modPerms, actionKey) {
  return modPerms.filter((p) => p.codename.startsWith(`${actionKey}_`));
}

export function getGroupModuleKeys(group, fallbackPermissions = []) {
  const perms = group?.permissions?.length ? group.permissions : fallbackPermissions;
  return [
    ...new Set(
      perms.map((perm) => perm.app_label || perm.content_type__app_label).filter(Boolean)
    ),
  ];
}
