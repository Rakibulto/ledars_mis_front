import { useMemo, useCallback } from 'react';

import { paths } from 'src/routes/paths';

import { useGetEmployee } from 'src/actions/employees';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const ICONS = {
  user: <Iconify icon="solar:user-bold-duotone" />,
  account: <Iconify icon="solar:user-id-bold-duotone" />,
  booking: <Iconify icon="solar:calendar-mark-bold-duotone" />,
  calendar: <Iconify icon="solar:calendar-bold-duotone" />,
  leave: <Iconify icon="solar:logout-2-bold-duotone" />,
  settings: <Iconify icon="solar:settings-bold-duotone" />,
  dashboard: <Iconify icon="solar:chart-square-bold-duotone" />,
  analytics: <Iconify icon="solar:graph-up-bold-duotone" />,
  payroll: <Iconify icon="solar:wallet-money-bold-duotone" />,
  payment: <Iconify icon="solar:hand-money-bold-duotone" />,
  treasury: <Iconify icon="solar:card-transfer-bold-duotone" />,
  beneficiaries: <Iconify icon="solar:users-group-rounded-bold-duotone" />,
  projects: <Iconify icon="solar:folder-with-files-bold-duotone" />,
  inventory: <Iconify icon="solar:box-bold-duotone" />,
  grn: <Iconify icon="solar:box-minimalistic-bold-duotone" />,
  procurement: <Iconify icon="solar:cart-large-2-bold-duotone" />,
  requisition: <Iconify icon="solar:clipboard-list-bold-duotone" />,
  rfq: <Iconify icon="solar:clipboard-text-bold-duotone" />,
  quotation: <Iconify icon="solar:document-text-bold-duotone" />,
  comparison: <Iconify icon="solar:scale-bold-duotone" />,
  award: <Iconify icon="solar:medal-star-bold-duotone" />,
  workOrder: <Iconify icon="solar:bill-list-bold-duotone" />,
  vendors: <Iconify icon="solar:buildings-2-bold-duotone" />,
  categories: <Iconify icon="solar:tag-bold-duotone" />,
  reports: <Iconify icon="solar:chart-2-bold-duotone" />,
  documents: <Iconify icon="solar:document-bold-duotone" />,
  notifications: <Iconify icon="solar:bell-bing-bold-duotone" />,
  department: <Iconify icon="solar:buildings-2-bold-duotone" />,
  branch: <Iconify icon="solar:map-point-bold-duotone" />,
  shift: <Iconify icon="solar:clock-circle-bold-duotone" />,
  approval: <Iconify icon="solar:check-circle-bold-duotone" />,
  delivery: <Iconify icon="solar:plain-2-bold-duotone" />,
  accounting: <Iconify icon="solar:calculator-bold-duotone" />,
  formAutomation: <Iconify icon="solar:document-add-bold-duotone" />,
  mail: <Iconify icon="solar:letter-bold-duotone" />,
  lock: <Iconify icon="solar:shield-check-bold-duotone" />,
  menuItem: <Iconify icon="solar:list-bold-duotone" />,
  disabled: <Iconify icon="solar:close-circle-bold-duotone" />,
  label: <Iconify icon="solar:bell-bing-bold-duotone" />,
  parameter: <Iconify icon="solar:settings-bold-duotone" />,
  external: <Iconify icon="solar:plain-2-bold-duotone" />,
  blank: <Iconify icon="solar:document-bold-duotone" />,
  todo: <Iconify icon="solar:checklist-bold-duotone" />,
  meeting: <Iconify icon="solar:calendar-mark-bold-duotone" />,
  crm: <Iconify icon="solar:phone-bold-duotone" />,
  hrm: <Iconify icon="solar:users-group-rounded-bold-duotone" />,
  store: <Iconify icon="solar:box-bold-duotone" />,
  finance: <Iconify icon="solar:calculator-bold-duotone" />,
  ledars: <Iconify icon="solar:buildings-2-bold-duotone" />,
  project: <Iconify icon="solar:folder-with-files-bold-duotone" />,
  movement: <Iconify icon="solar:delivery-bold-duotone" />,
};

const resolveNavIcon = (title, trail = []) => {
  const haystack = [...trail, title].filter(Boolean).join(' ').toLowerCase();

  if (haystack.includes('dashboard')) return ICONS.dashboard;
  if (haystack.includes('permission')) return ICONS.lock;
  if (haystack.includes('external')) return ICONS.external;
  if (haystack.includes('blank')) return ICONS.blank;
  if (haystack.includes('disabled')) return ICONS.disabled;
  if (haystack.includes('label')) return ICONS.label;
  if (haystack.includes('params')) return ICONS.parameter;
  if (haystack.includes('vendor') || haystack.includes('supplier')) return ICONS.vendors;
  if (haystack.includes('rfq')) return ICONS.rfq;
  if (haystack.includes('quotation')) return ICONS.quotation;
  if (haystack.includes('comparative')) return ICONS.comparison;
  if (haystack.includes('award')) return ICONS.award;
  if (haystack.includes('work order')) return ICONS.workOrder;
  if (haystack.includes('goods receipt') || haystack.includes('grn')) return ICONS.grn;
  if (haystack.includes('treasury')) return ICONS.treasury;
  if (
    haystack.includes('payment requisition') ||
    haystack.includes('payments') ||
    haystack.includes('payment status')
  )
    return ICONS.payment;
  if (haystack.includes('report')) return ICONS.reports;
  if (haystack.includes('analytics')) return ICONS.analytics;
  if (haystack.includes('notification')) return ICONS.notifications;
  if (haystack.includes('document') || haystack.includes('template')) return ICONS.documents;
  if (haystack.includes('category')) return ICONS.categories;
  if (haystack.includes('approval')) return ICONS.approval;
  if (haystack.includes('delivery')) return ICONS.delivery;
  if (
    haystack.includes('material requisition') ||
    haystack.includes('purchase requisition') ||
    haystack.includes('requisition') ||
    haystack.includes('prf')
  )
    return ICONS.requisition;
  if (haystack.includes('beneficiar')) return ICONS.beneficiaries;
  if (haystack.includes('project')) return ICONS.projects;
  if (haystack.includes('store') || haystack.includes('inventory') || haystack.includes('item'))
    return ICONS.inventory;
  if (haystack.includes('procurement')) return ICONS.procurement;
  if (haystack.includes('account information')) return ICONS.account;
  if (
    haystack.includes('accounting') ||
    haystack.includes('account code') ||
    haystack.includes('budget')
  )
    return ICONS.accounting;
  if (haystack.includes('form')) return ICONS.formAutomation;
  if (haystack.includes('employee') || haystack.includes('supervisor')) return ICONS.user;
  if (haystack.includes('department')) return ICONS.department;
  if (haystack.includes('designation') || haystack.includes('role')) return ICONS.account;
  if (haystack.includes('branch') || haystack.includes('location')) return ICONS.branch;
  if (haystack.includes('shift') || haystack.includes('timeline')) return ICONS.shift;
  if (haystack.includes('attendance')) return ICONS.calendar;
  if (haystack.includes('holiday')) return ICONS.booking;
  if (haystack.includes('leave')) return ICONS.leave;
  if (haystack.includes('payroll')) return ICONS.payroll;
  if (haystack.includes('settings')) return ICONS.settings;
  if (haystack.includes('mail')) return ICONS.mail;
  if (haystack.includes('calendar')) return ICONS.calendar;
  if (haystack.includes('list') || haystack.includes('all ')) return ICONS.menuItem;
  if (haystack.includes('create') || haystack.includes('add ')) return ICONS.formAutomation;

  return null;
};

const decorateNavItems = (items, trail = []) =>
  items.map((item) => {
    const icon = item.icon || (item.title ? resolveNavIcon(item.title, trail) : null);

    return {
      ...item,
      ...(icon && { icon }),
      ...(item.items && {
        items: decorateNavItems(item.items, [...trail, item.subheader].filter(Boolean)),
      }),
      ...(item.children && { children: decorateNavItems(item.children, [...trail, item.title]) }),
    };
  });

// ----------------------------------------------------------------------

export const storeInventoryNavTree = [
  {
    title: 'Products',
    children: [{ title: 'Product Management' }, { title: 'Units of Measurement' }],
  },
  {
    title: 'Operations',
    children: [
      { title: 'GRN' },
      { title: 'Goods Issue Note', children: [{ title: 'GIN List' }, { title: 'Create GIN' }] },
      { title: 'Transfers' },
      {
        title: 'Stock Adjustment',
        children: [{ title: 'Adjustment List' }, { title: 'Create Adjustment' }],
      },
      { title: 'Scrap Management', children: [{ title: 'Scrap List' }, { title: 'Create Scrap' }] },
      {
        title: 'Return Management',
        children: [
          { title: 'Return List' },
          { title: 'Create Return' },
          { title: 'Return History' },
        ],
      },
    ],
  },
  {
    title: 'Warehouse & Locations',
    children: [{ title: 'Warehouses' }, { title: 'Storage Locations' }],
  },
  {
    title: 'Quality Control',
    children: [
      { title: 'Quality Checks' },
      { title: 'Quality Alerts' },
      { title: 'Quality Control Points' },
      { title: 'Quality Teams' },
      { title: 'QC Templates' },
    ],
  },
  { title: 'Barcode & Scanning', children: [{ title: 'Barcode Scanning' }] },
];

// ----------------------------------------------------------------------

export function useNavData() {
  const { user } = useAuthContext();

  const { employee } = useGetEmployee(
    (user?.role === 'Employee' || user?.role === 'Supervisor') && user?.id ? user.id : null
  );

  const hasPermission = useCallback(
    (codename) => {
      if (user?.is_superuser) return true;
      if (!user?.user_permissions_list) return false;
      return user.user_permissions_list.some((permission) => permission.codename === codename);
    },
    [user?.user_permissions_list, user?.is_superuser]
  );

  const canShowWebLogin =
    user?.role === 'Employee' || user?.role === 'Supervisor' ? !!employee?.allow_web_login : true;

  const navData = useMemo(() => {
    const employeeChildren = [
      ...(hasPermission('view_employee')
        ? [{ title: 'List', path: paths.dashboard.user.list, icon: ICONS.menuItem }]
        : []),
      ...(hasPermission('view_employee')
        ? [
          {
            title: 'Account Information',
            path: paths.dashboard.user.account,
            icon: ICONS.account,
          },
        ]
        : []),
    ];

    const holidayChildren = [
      ...(hasPermission('view_holiday')
        ? [
          { title: 'List', path: paths.dashboard.holiday.list, icon: ICONS.menuItem },
          {
            title: 'Holiday Calendar',
            path: paths.dashboard.holiday.calendar,
            icon: ICONS.calendar,
          },
        ]
        : []),
      ...(!hasPermission('view_holiday') && user?.role !== 'Employee' && user?.role !== 'Supervisor'
        ? [{ title: 'Calendar', path: paths.dashboard.holiday.calendar, icon: ICONS.calendar }]
        : []),
    ];

    return decorateNavItems([
      // ============================================================
      // Dashboard
      // ============================================================
      { items: [{ title: 'Dashboard', path: paths.dashboard.root, icon: ICONS.dashboard }] },

      // ============================================================
      // Todo Management
      // ============================================================
      {
        items: [
          {
            title: 'Todo Management',
            icon: ICONS.todo,
            children: [{ title: 'Todo List', path: paths.dashboard.todo.list, icon: ICONS.todo }],
          },
        ],
      },

      // ============================================================
      // Meeting Management
      // ============================================================
      ...(hasPermission('view_meeting')
        ? [
          {
            items: [
              {
                title: 'Meeting Management',
                icon: ICONS.meeting,
                children: [
                  {
                    title: 'Meeting List',
                    path: paths.dashboard.meetingManagement.list,
                    icon: ICONS.meeting,
                  },
                  ...(hasPermission('add_meeting')
                    ? [
                      {
                        title: 'Create Meeting',
                        path: paths.dashboard.meetingManagement.create,
                        icon: ICONS.formAutomation,
                      },
                    ]
                    : []),
                  ...(hasPermission('view_meeting')
                    ? [
                      {
                        title: 'Meeting Calendar',
                        path: paths.dashboard.meetingManagement.calendar,
                        icon: ICONS.calendar,
                      },
                    ]
                    : []),
                ],
              },
            ],
          },
        ]
        : []),

      // ============================================================
      // CRM
      // ============================================================
      ...(hasPermission('view_lead')
        ? [
          {
            items: [
              {
                title: 'CRM',
                icon: ICONS.crm,
                children: [
                  {
                    title: 'All Leads',
                    path: paths.dashboard.crm.leads.list,
                    icon: ICONS.menuItem,
                  },
                  ...(hasPermission('add_lead')
                    ? [
                      {
                        title: 'Create Lead',
                        path: paths.dashboard.crm.leads.create,
                        icon: ICONS.formAutomation,
                      },
                    ]
                    : []),
                ],
              },
            ],
          },
        ]
        : []),

      // ============================================================
      // Movement Management
      // ============================================================
      {
        items: [
          {
            title: 'Movement Management',
            icon: ICONS.movement,
            children: [
              {
                title: 'Movement List',
                path: paths.dashboard.crm.movementManagement.list,
                icon: ICONS.menuItem,
              },
              ...(hasPermission('add_lead')
                ? [
                  {
                    title: 'Create Movement',
                    path: paths.dashboard.crm.movementManagement.create,
                    icon: ICONS.formAutomation,
                  },
                ]
                : []),
            ],
          },
        ],
      },

      // ============================================================
      // Procurement Management
      // ============================================================
      {
        items: [
          {
            title: 'Procurement Management',
            icon: ICONS.procurement,
            children: [
              {
                title: 'Dashboard',
                path: paths.dashboard.procurement.dashboard,
                icon: ICONS.dashboard,
              },
              {
                title: 'Material Requisitions',
                path: paths.dashboard.procurement.requisitions.root,
                icon: ICONS.requisition,
                children: [
                  {
                    title: 'Requisition List',
                    path: paths.dashboard.procurement.requisitions.list,
                    icon: ICONS.requisition,
                  },
                  {
                    title: 'Create Requisition',
                    path: paths.dashboard.procurement.requisitions.create,
                    icon: ICONS.formAutomation,
                  },
                  {
                    title: 'Workflow Approval',
                    path: paths.dashboard.procurement.requisitions.workflowApproval,
                    icon: ICONS.approval,
                  },
                ],
              },
              {
                title: 'RFQ Management',
                path: paths.dashboard.procurement.rfq.root,
                icon: ICONS.rfq,
                children: [
                  {
                    title: 'RFQ List',
                    path: paths.dashboard.procurement.rfq.list,
                    icon: ICONS.rfq,
                  },
                  {
                    title: 'Create RFQ',
                    path: paths.dashboard.procurement.rfq.create,
                    icon: ICONS.formAutomation,
                  },
                  {
                    title: 'Vendor Distribution',
                    path: paths.dashboard.procurement.rfq.distribution,
                    icon: ICONS.vendors,
                  },
                  {
                    title: 'Submission Monitoring',
                    path: paths.dashboard.procurement.rfq.monitoring,
                    icon: ICONS.analytics,
                  },
                ],
              },
              {
                title: 'Quotations',
                path: paths.dashboard.procurement.quotations.root,
                icon: ICONS.quotation,
                children: [
                  // { title: 'Quotation Dashboard', path: paths.dashboard.procurement.quotations.root, icon: ICONS.dashboard },
                  {
                    title: 'Opening & Evaluation',
                    path: paths.dashboard.procurement.quotations.list,
                    icon: ICONS.menuItem,
                  },
                  {
                    title: 'Direct Evaluation',
                    path: paths.dashboard.procurement.quotations.directEvaluation,
                    icon: ICONS.rfq,
                  },
                  {
                    title: 'Manual Submit Quotation',
                    path: paths.dashboard.procurement.quotations.manualSubmitQuotation,
                    icon: ICONS.quotation,
                  },
                ],
              },
              {
                title: 'Comparative Statements',
                path: paths.dashboard.procurement.comparative.root,
                icon: ICONS.comparison,
                children: [
                  {
                    title: 'CS List',
                    path: paths.dashboard.procurement.comparative.list,
                    icon: ICONS.comparison,
                  },
                  {
                    title: 'Pending Approvals',
                    path: paths.dashboard.procurement.comparative.pending,
                    icon: ICONS.approval,
                  },
                ],
              },
              {
                title: 'Awards',
                path: paths.dashboard.procurement.awards.root,
                icon: ICONS.award,
                children: [
                  {
                    title: 'Award Summary',
                    path: paths.dashboard.procurement.awards.summary,
                    icon: ICONS.award,
                  },
                  // { title: 'Notifications', path: paths.dashboard.procurement.awards.summary, icon: ICONS.notifications },
                  {
                    title: 'Award History',
                    path: paths.dashboard.procurement.awards.history,
                    icon: ICONS.reports,
                  },
                ],
              },
              {
                title: 'Work Orders',
                path: paths.dashboard.procurement.workOrders.root,
                icon: ICONS.workOrder,
                children: [
                  {
                    title: 'WO List',
                    path: paths.dashboard.procurement.workOrders.list,
                    icon: ICONS.workOrder,
                  },
                  {
                    title: 'Create WO',
                    path: paths.dashboard.procurement.workOrders.create,
                    icon: ICONS.formAutomation,
                  },
                  {
                    title: 'Pending Approvals',
                    path: paths.dashboard.procurement.workOrders.pendingApprovals,
                    icon: ICONS.approval,
                  },
                ],
              },
              {
                title: 'Direct Purchase',
                path: paths.dashboard.procurement.directPurchase.root,
                icon: ICONS.payment,
                children: [
                  {
                    title: 'DP List',
                    path: paths.dashboard.procurement.directPurchase.list,
                    icon: ICONS.menuItem,
                  },
                  {
                    title: 'Create DP',
                    path: paths.dashboard.procurement.directPurchase.create,
                    icon: ICONS.formAutomation,
                  },
                ],
              },
              {
                title: 'Goods Receive Notes',
                path: paths.dashboard.procurement.grn.root,
                icon: ICONS.grn,
                children: [
                  {
                    title: 'GRN List',
                    path: paths.dashboard.procurement.grn.list,
                    icon: ICONS.grn,
                  },
                  {
                    title: 'Create GRN',
                    path: paths.dashboard.procurement.grn.create,
                    icon: ICONS.formAutomation,
                  },
                  {
                    title: 'Pending Verification',
                    path: paths.dashboard.procurement.grn.pendingVerification,
                    icon: ICONS.approval,
                  },
                ],
              },
              {
                title: 'Inventory',
                path: paths.dashboard.procurement.inventory.root,
                icon: ICONS.inventory,
                children: [
                  {
                    title: 'Dashboard',
                    path: paths.dashboard.procurement.inventory.dashboard,
                    icon: ICONS.dashboard,
                  },
                  {
                    title: 'All Items',
                    path: `${paths.dashboard.procurement.inventory.items}?type=all`,
                    icon: ICONS.inventory,
                  },
                  {
                    title: 'Fixed Assets',
                    path: `${paths.dashboard.procurement.inventory.items}?type=asset`,
                    icon: ICONS.inventory,
                  },
                  {
                    title: 'Consumables',
                    path: `${paths.dashboard.procurement.inventory.items}?type=consumable`,
                    icon: ICONS.inventory,
                  },
                  // { title: 'Stock Movement', path: paths.dashboard.procurement.inventory.movement, icon: ICONS.inventory },
                  // { title: 'Issue/Transfer', path: paths.dashboard.procurement.inventory.issue, icon: ICONS.delivery },
                  // { title: 'Warehouses', path: paths.dashboard.procurement.inventory.warehouses, icon: ICONS.inventory },
                  // { title: 'Inter-Warehouse Transfer', path: paths.dashboard.procurement.inventory.interWarehouseTransfer, icon: ICONS.inventory },
                  // { title: 'Material Requisition', path: paths.dashboard.procurement.inventory.materialRequisition, icon: ICONS.requisition },
                  // { title: 'Material Release', path: paths.dashboard.procurement.inventory.materialRelease, icon: ICONS.delivery },
                  // { title: 'Inventory Reports', path: paths.dashboard.procurement.inventory.reports, icon: ICONS.reports },
                ],
              },
              {
                title: 'Payment Requisitions',
                path: paths.dashboard.procurement.paymentRequisitions.root,
                icon: ICONS.payment,
                children: [
                  {
                    title: 'PRF List',
                    path: paths.dashboard.procurement.paymentRequisitions.listApproved,
                    icon: ICONS.payment,
                  },
                  {
                    title: 'Create PRF',
                    path: paths.dashboard.procurement.paymentRequisitions.create,
                    icon: ICONS.formAutomation,
                  },
                  {
                    title: 'Pending Approvals',
                    path: paths.dashboard.procurement.paymentRequisitions.pendingApprovals,
                    icon: ICONS.approval,
                  },
                  {
                    title: 'Payment Schedule',
                    path: paths.dashboard.procurement.paymentRequisitions.paymentSchedule,
                    icon: ICONS.calendar,
                  },
                ],
              },
              {
                title: 'Treasury & Finance',
                path: paths.dashboard.procurement.treasury.root,
                icon: ICONS.treasury,
                children: [
                  {
                    title: 'Finance Review Queue',
                    path: paths.dashboard.procurement.treasury.financeReview,
                    icon: ICONS.accounting,
                  },
                  {
                    title: 'Payment Status',
                    path: paths.dashboard.procurement.treasury.timeline,
                    icon: ICONS.shift,
                  },
                  // { title: 'Payment Analytics', path: paths.dashboard.procurement.treasury.analytics, icon: ICONS.analytics },
                  // { title: 'Bank Reconciliation', path: paths.dashboard.procurement.treasury.bankReconciliation, icon: ICONS.approval },
                ],
              },
              {
                title: 'Vendors',
                path: paths.dashboard.procurement.vendors.root,
                icon: ICONS.vendors,
                children: [
                  {
                    title: 'Vendor Register',
                    path: paths.dashboard.procurement.vendors.create,
                    icon: ICONS.vendors,
                  },
                  {
                    title: 'Vendor List',
                    path: paths.dashboard.procurement.vendors.list,
                    icon: ICONS.vendors,
                  },
                  // { title: 'Vendor Onboarding', path: paths.dashboard.procurement.vendors.onboarding, icon: ICONS.formAutomation },
                  {
                    title: 'Vendor Verification',
                    path: paths.dashboard.procurement.vendors.verification,
                    icon: ICONS.approval,
                  },
                  {
                    title: 'Category Mapping',
                    path: paths.dashboard.procurement.vendors.categoryMapping,
                    icon: ICONS.categories,
                  },
                  // { title: 'Performance Tracking', path: paths.dashboard.procurement.vendors.performance, icon: ICONS.analytics },
                  {
                    title: 'Vendor Enlistment',
                    path: paths.dashboard.procurement.vendors.enlistment,
                    icon: ICONS.formAutomation,
                  },
                  {
                    title: 'Vendor Blacklist',
                    path: paths.dashboard.procurement.vendors.blacklist,
                    icon: ICONS.lock,
                  },
                ],
              },
              // { title: 'Contract Management', path: paths.dashboard.procurement.contracts.root, icon: ICONS.documents, children: [
              //   { title: 'Contract List', path: paths.dashboard.procurement.contracts.list, icon: ICONS.documents },
              //   { title: 'Create Contract', path: paths.dashboard.procurement.contracts.create, icon: ICONS.formAutomation },
              // ]},
              // { title: 'Document Repository', path: paths.dashboard.procurement.documents.root, icon: ICONS.documents, children: [
              //   { title: 'All Documents', path: paths.dashboard.procurement.documents.repository, icon: ICONS.documents },
              //   { title: 'Categories', path: paths.dashboard.procurement.documents.categories, icon: ICONS.categories },
              //   { title: 'Access Control', path: paths.dashboard.procurement.documents.accessControl, icon: ICONS.lock },
              // ]},
              // { title: 'Audit & Compliance', path: paths.dashboard.procurement.audit.root, icon: ICONS.approval, children: [
              //   { title: 'Audit Trail', path: paths.dashboard.procurement.audit.log, icon: ICONS.reports },
              //   { title: 'Compliance Dashboard', path: paths.dashboard.procurement.audit.compliance, icon: ICONS.approval },
              //   { title: 'Export & Reports', path: paths.dashboard.procurement.audit.export, icon: ICONS.external },
              // ]},
              // { title: 'Budget Management', path: paths.dashboard.procurement.budget.root, icon: ICONS.accounting, children: [
              //   { title: 'Budget Planning', path: paths.dashboard.procurement.budget.planning, icon: ICONS.accounting },
              //   { title: 'Utilization Report', path: paths.dashboard.procurement.budget.utilization, icon: ICONS.analytics },
              //   { title: 'Budget Transfer', path: paths.dashboard.procurement.budget.transfer, icon: ICONS.external },
              // ]},
              {
                title: 'Reports',
                path: paths.dashboard.procurement.reports.root,
                icon: ICONS.reports,
                children: [
                  {
                    title: 'Requisition Report',
                    path: paths.dashboard.procurement.reports.requisitions,
                    icon: ICONS.reports,
                  },
                  {
                    title: 'RFQ Report',
                    path: paths.dashboard.procurement.reports.rfq,
                    icon: ICONS.reports,
                  },
                  {
                    title: 'Vendor Participation',
                    path: paths.dashboard.procurement.reports.vendorParticipation,
                    icon: ICONS.reports,
                  },
                  {
                    title: 'Vendor Awards',
                    path: paths.dashboard.procurement.reports.vendorAwards,
                    icon: ICONS.reports,
                  },
                  {
                    title: 'Work Order Report',
                    path: paths.dashboard.procurement.reports.workOrders,
                    icon: ICONS.reports,
                  },
                  {
                    title: 'Inventory Received',
                    path: paths.dashboard.procurement.reports.inventoryReceived,
                    icon: ICONS.reports,
                  },
                  {
                    title: 'Fixed Asset Register',
                    path: paths.dashboard.procurement.reports.fixedAssets,
                    icon: ICONS.reports,
                  },
                  {
                    title: 'Consumable Stock',
                    path: paths.dashboard.procurement.reports.consumables,
                    icon: ICONS.reports,
                  },
                  {
                    title: 'Payment Status',
                    path: paths.dashboard.procurement.reports.payments,
                    icon: ICONS.reports,
                  },
                  {
                    title: 'Budget vs Procurement',
                    path: paths.dashboard.procurement.reports.budget,
                    icon: ICONS.reports,
                  },
                  {
                    title: 'CS Summary',
                    path: paths.dashboard.procurement.reports.comparativeStatements,
                    icon: ICONS.reports,
                  },
                  {
                    title: 'Audit Logs',
                    path: paths.dashboard.procurement.reports.auditLogs,
                    icon: ICONS.reports,
                  },
                  {
                    title: 'Project Procurement Report',
                    path: paths.dashboard.procurement.reports.projectProcurement,
                    icon: ICONS.reports,
                  },
                ],
              },
              {
                title: 'Notifications',
                path: paths.dashboard.procurement.notifications,
                icon: ICONS.notifications,
              },
              {
                title: 'Settings',
                path: paths.dashboard.procurement.settings.root,
                icon: ICONS.settings,
                children: [
                  {
                    title: 'User Management',
                    path: paths.dashboard.procurement.settings.users,
                    icon: ICONS.user,
                  },
                  {
                    title: 'Roles & Permissions',
                    path: paths.dashboard.procurement.settings.roles,
                    icon: ICONS.lock,
                  },
                  {
                    title: 'Approval Matrix',
                    path: paths.dashboard.procurement.settings.approvalMatrix,
                    icon: ICONS.approval,
                  },
                  {
                    title: 'Budget Codes',
                    path: paths.dashboard.procurement.settings.budgetCodes,
                    icon: ICONS.accounting,
                  },
                  {
                    title: 'Account Categories',
                    path: paths.dashboard.procurement.settings.accountCategories,
                    icon: ICONS.categories,
                  },
                  {
                    title: 'Account Codes',
                    path: paths.dashboard.procurement.settings.accountCodes,
                    icon: ICONS.accounting,
                  },
                  {
                    title: 'Category Setup',
                    path: paths.dashboard.procurement.settings.categories,
                    icon: ICONS.categories,
                  },
                  {
                    title: 'Item Master',
                    path: paths.dashboard.procurement.settings.items,
                    icon: ICONS.inventory,
                  },
                  {
                    title: 'Email Templates',
                    path: paths.dashboard.procurement.settings.emailTemplates,
                    icon: ICONS.mail,
                  },
                  {
                    title: 'Notification Settings',
                    path: paths.dashboard.procurement.settings.notifications,
                    icon: ICONS.notifications,
                  },
                  {
                    title: 'Office Management',
                    path: paths.dashboard.procurement.settings.offices,
                    icon: ICONS.branch,
                  },
                  {
                    title: 'Authority Delegation',
                    path: paths.dashboard.procurement.settings.delegation,
                    icon: ICONS.approval,
                  },
                  {
                    title: 'Escalation Rules',
                    path: paths.dashboard.procurement.settings.escalation,
                    icon: ICONS.notifications,
                  },
                  {
                    title: 'Fiscal Year',
                    path: paths.dashboard.procurement.settings.fiscalYear,
                    icon: ICONS.calendar,
                  },
                  {
                    title: 'Currency & Rates',
                    path: paths.dashboard.procurement.settings.currency,
                    icon: ICONS.accounting,
                  },
                  {
                    title: 'System Logs',
                    path: paths.dashboard.procurement.settings.systemLogs,
                    icon: ICONS.reports,
                  },
                  {
                    title: 'Backup & Recovery',
                    path: paths.dashboard.procurement.settings.backup,
                    icon: ICONS.settings,
                  },
                ],
              },
            ],
          },
        ],
      },

      // ============================================================
      // Project Managements
      // ============================================================
      {
        items: [
          {
            title: 'Project Managements',
            icon: ICONS.project,
            children: [
              {
                title: 'Overview',
                path: paths.dashboard.projectManagements.root,
                icon: ICONS.dashboard,
              },
              {
                title: 'Dashboard',
                path: paths.dashboard.projectManagements.dashboard,
                icon: ICONS.analytics,
              },
              {
                title: 'Projects',
                path: paths.dashboard.projectManagements.projects.root,
                icon: ICONS.projects,
                children: [
                  {
                    title: 'All Projects',
                    path: paths.dashboard.projectManagements.projects.allProjects,
                    icon: ICONS.menuItem,
                    activeMatch: [
                      { pattern: '^/dashboard/project-managements/projects/[^/]+/?$' },
                      { pattern: '^/dashboard/project-managements/projects/[^/]+/edit/?$' },
                    ],
                  },
                  {
                    title: 'Create New Project',
                    path: paths.dashboard.projectManagements.projects.create,
                    icon: ICONS.formAutomation,
                  },
                  {
                    title: 'Report',
                    path: paths.dashboard.projectManagements.projects.report,
                    icon: ICONS.reports,
                  },
                ],
              },
              {
                title: 'Task Management',
                path: paths.dashboard.projectManagements.taskManagement.root,
                icon: ICONS.menuItem,
                children: [
                  {
                    title: 'All Tasks',
                    path: paths.dashboard.projectManagements.taskManagement.allTasks,
                    icon: ICONS.menuItem,
                    activeMatch: [
                      {
                        pattern:
                          '^/dashboard/project-managements/task-management/all-tasks/[^/]+/[^/]+/?$',
                      },
                    ],
                  },
                ],
              },
              {
                title: 'Expense Management',
                path: paths.dashboard.projectManagements.expenses.root,
                icon: ICONS.reports,
                children: [
                  {
                    title: 'Expenses',
                    path: paths.dashboard.projectManagements.expenses.root,
                    icon: ICONS.menuItem,
                  },
                  {
                    title: 'Create Expense',
                    path: paths.dashboard.projectManagements.expenses.create,
                    icon: ICONS.formAutomation,
                  },
                  {
                    title: 'Advance Receivables',
                    path: paths.dashboard.projectManagements.expenses.advances.root,
                    icon: ICONS.payment,
                  },
                ],
              },
              // { title: 'Donor Management', path: paths.dashboard.projects.donors.root, icon: ICONS.vendors },
            ],
          },
        ],
      },

      // ============================================================
      // Accounting & Finance
      // ============================================================
      {
        items: [
          {
            title: "Accounting & Finance",
            icon: ICONS.accounting,
            children: [
              {
                title: 'Dashboard',
                path: paths.dashboard.accountingFinance.dashboard,
                icon: ICONS.dashboard,
              },
              {
                title: 'Configuration',
                path: paths.dashboard.accountingFinance.configuration.root,
                icon: ICONS.settings,
                children: [
                  {
                    title: 'COA List',
                    path: paths.dashboard.accountingFinance.configuration.coaList,
                    icon: ICONS.accounting,
                  },
                  {
                    title: 'Chart of Accounts',

                    path: paths.dashboard.accountingFinance.configuration.chartOfAccounts,
                    icon: ICONS.accounting,
                  },
                  // {
                  //   title: 'Account Types',
                  //   path: paths.dashboard.accountingFinance.configuration.accountTypes,
                  //   icon: ICONS.categories,
                  // },
                  {
                    title: 'Journals',
                    path: paths.dashboard.accountingFinance.configuration.journals,
                    icon: ICONS.documents,
                  },
                  {
                    title: 'Fiscal Year',
                    path: paths.dashboard.accountingFinance.configuration.fiscalYear,
                    icon: ICONS.calendar,
                  },
                  {
                    title: 'Fiscal Periods',
                    path: paths.dashboard.accountingFinance.configuration.fiscalPeriods,
                    icon: ICONS.calendar,
                  },
                  {
                    title: 'Payment Terms',
                    path: paths.dashboard.accountingFinance.configuration.paymentTerms,
                    icon: ICONS.payment,
                  },
                  {
                    title: 'Taxes / VAT',
                    path: paths.dashboard.accountingFinance.configuration.taxes,
                    icon: ICONS.accounting,
                  },
                  {
                    title: 'Currencies',
                    path: paths.dashboard.accountingFinance.configuration.currencies,
                    icon: ICONS.payment,
                  },
                  {
                    title: 'Cost Centers',
                    path: paths.dashboard.accountingFinance.configuration.costCenters,
                    icon: ICONS.analytics,
                  },
                  {
                    title: 'Budget Setup',
                    path: paths.dashboard.accountingFinance.configuration.budgetSetup,
                    icon: ICONS.accounting,
                  },
                  {
                    title: 'Asset Categories',
                    path: paths.dashboard.accountingFinance.configuration.assetCategories,
                    icon: ICONS.categories,
                  },
                  {
                    title: 'Bank / Cash Accounts',
                    path: paths.dashboard.accountingFinance.configuration.bankCashAccounts,
                    icon: ICONS.accounting,
                  },
                  {
                    title: 'Fiscal Positions',
                    path: paths.dashboard.accountingFinance.configuration.fiscalPositions,
                    icon: ICONS.accounting,
                  },
                  {
                    title: 'Reconciliation Models',
                    path: paths.dashboard.accountingFinance.configuration.reconciliationModels,
                    icon: ICONS.approval,
                  },
                  {
                    title: 'Payment Methods',
                    path: paths.dashboard.accountingFinance.configuration.paymentMethods,
                    icon: ICONS.payment,
                  },
                  {
                    title: 'Incoterms',
                    path: paths.dashboard.accountingFinance.configuration.incoterms,
                    icon: ICONS.delivery,
                  },
                  {
                    title: 'Exchange Rates',
                    path: paths.dashboard.accountingFinance.configuration.currencyExchangeRates,
                    icon: ICONS.payment,
                  },
                  {
                    title: 'Lock Dates',
                    path: paths.dashboard.accountingFinance.configuration.lockDates,
                    icon: ICONS.calendar,
                  },
                  {
                    title: 'Perdium',
                    path: paths.dashboard.accountingFinance.configuration.perdium,
                    icon: ICONS.accounting,
                  },
                ],
              },
              {
                title: 'Transactions',
                path: paths.dashboard.accountingFinance.transactions.root,
                icon: ICONS.requisition,
                children: [
                  {
                    title: 'Journal Entries',
                    path: paths.dashboard.accountingFinance.transactions.journalEntries,
                    icon: ICONS.documents,
                    activeMatch: [
                      {
                        path: paths.dashboard.accountingFinance.transactions.journalEntries,
                        deep: true,
                      },
                    ],
                  },
                  {
                    title: 'Voucher Management',
                    path: paths.dashboard.accountingFinance.transactions.vouchers,
                    icon: ICONS.approval,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.transactions.vouchers, deep: true },
                    ],
                  },
                  {
                    title: 'General Ledger Posting',
                    path: paths.dashboard.accountingFinance.transactions.generalLedgerPosting,
                    icon: ICONS.accounting,
                    activeMatch: [
                      {
                        path: paths.dashboard.accountingFinance.transactions.generalLedgerPosting,
                        deep: true,
                      },
                    ],
                  },
                  {
                    title: 'Customer Invoices',
                    path: paths.dashboard.accountingFinance.transactions.customerInvoices,
                    icon: ICONS.menuItem,
                    activeMatch: [
                      {
                        path: paths.dashboard.accountingFinance.transactions.customerInvoices,
                        deep: true,
                      },
                    ],
                  },
                  {
                    title: 'Credit Notes',
                    path: paths.dashboard.accountingFinance.transactions.creditNotes,
                    icon: ICONS.documents,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.transactions.creditNotes, deep: true },
                    ],
                  },
                  {
                    title: 'Vendor Bills',
                    path: paths.dashboard.accountingFinance.transactions.vendorBills,
                    icon: ICONS.menuItem,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.transactions.vendorBills, deep: true },
                    ],
                  },
                  {
                    title: 'Debit Notes',
                    path: paths.dashboard.accountingFinance.transactions.debitNotes,
                    icon: ICONS.documents,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.transactions.debitNotes, deep: true },
                    ],
                  },
                  {
                    title: 'Customer Receipts',
                    path: paths.dashboard.accountingFinance.transactions.customerReceipts,
                    icon: ICONS.payment,
                    activeMatch: [
                      {
                        path: paths.dashboard.accountingFinance.transactions.customerReceipts,
                        deep: true,
                      },
                    ],
                  },
                  {
                    title: 'Supplier Payments',
                    path: paths.dashboard.accountingFinance.transactions.supplierPayments,
                    icon: ICONS.payment,
                    activeMatch: [
                      {
                        path: paths.dashboard.accountingFinance.transactions.supplierPayments,
                        deep: true,
                      },
                    ],
                  },
                  {
                    title: 'Bank Deposits',
                    path: paths.dashboard.accountingFinance.transactions.bankDeposits,
                    icon: ICONS.accounting,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.transactions.bankDeposits, deep: true },
                    ],
                  },
                  {
                    title: 'Cash Transactions',
                    path: paths.dashboard.accountingFinance.transactions.cashTransactions,
                    icon: ICONS.payment,
                    activeMatch: [
                      {
                        path: paths.dashboard.accountingFinance.transactions.cashTransactions,
                        deep: true,
                      },
                    ],
                  },
                  {
                    title: 'Contra Entries',
                    path: paths.dashboard.accountingFinance.transactions.contraEntries,
                    icon: ICONS.accounting,
                    activeMatch: [
                      {
                        path: paths.dashboard.accountingFinance.transactions.contraEntries,
                        deep: true,
                      },
                    ],
                  },
                  {
                    title: 'Expense Entries',
                    path: paths.dashboard.accountingFinance.transactions.expenseEntries,
                    icon: ICONS.menuItem,
                    activeMatch: [
                      {
                        path: paths.dashboard.accountingFinance.transactions.expenseEntries,
                        deep: true,
                      },
                    ],
                  },
                  // {
                  //   title: 'Travel Expense',
                  //   path: paths.dashboard.accountingFinance.transactions.travelExpense,
                  //   icon: ICONS.delivery,
                  //   activeMatch: [
                  //     {
                  //       path: paths.dashboard.accountingFinance.transactions.travelExpense,
                  //       deep: true,
                  //     },
                  //   ],
                  // },
                  {
                    title: 'Payroll Entries',
                    path: paths.dashboard.accountingFinance.transactions.payrollEntries,
                    icon: ICONS.accounting,
                    activeMatch: [
                      {
                        path: paths.dashboard.accountingFinance.transactions.payrollEntries,
                        deep: true,
                      },
                    ],
                  },
                  {
                    title: 'Inventory Entries',
                    path: paths.dashboard.accountingFinance.transactions.inventoryEntries,
                    icon: ICONS.delivery,
                    activeMatch: [
                      {
                        path: paths.dashboard.accountingFinance.transactions.inventoryEntries,
                        deep: true,
                      },
                    ],
                  },
                  {
                    title: 'Journal Items',
                    path: paths.dashboard.accountingFinance.transactions.journalItems,
                    icon: ICONS.documents,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.transactions.journalItems, deep: true },
                    ],
                  },
                  {
                    title: 'Deferred Revenue',
                    path: paths.dashboard.accountingFinance.transactions.deferredRevenue,
                    icon: ICONS.analytics,
                    activeMatch: [
                      {
                        path: paths.dashboard.accountingFinance.transactions.deferredRevenue,
                        deep: true,
                      },
                    ],
                  },
                  {
                    title: 'Deferred Expenses',
                    path: paths.dashboard.accountingFinance.transactions.deferredExpenses,
                    icon: ICONS.analytics,
                    activeMatch: [
                      {
                        path: paths.dashboard.accountingFinance.transactions.deferredExpenses,
                        deep: true,
                      },
                    ],
                  },
                ],
              },
              {
                title: 'Banking',
                path: paths.dashboard.accountingFinance.banking.root,
                icon: ICONS.accounting,
                children: [
                  {
                    title: 'Bank Accounts',
                    path: paths.dashboard.accountingFinance.banking.bankAccounts,
                    icon: ICONS.accounting,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.banking.bankAccounts, deep: true },
                    ],
                  },
                  {
                    title: 'Bank Statements',
                    path: paths.dashboard.accountingFinance.banking.bankStatements,
                    icon: ICONS.documents,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.banking.bankStatements, deep: true },
                    ],
                  },
                  {
                    title: 'Reconciliation',
                    path: paths.dashboard.accountingFinance.banking.reconciliation,
                    icon: ICONS.approval,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.banking.reconciliation, deep: true },
                    ],
                  },
                  {
                    title: 'Transfers',
                    path: paths.dashboard.accountingFinance.banking.transfers,
                    icon: ICONS.payment,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.banking.transfers, deep: true },
                    ],
                  },
                  {
                    title: 'Check Management',
                    path: paths.dashboard.accountingFinance.banking.checkManagement,
                    icon: ICONS.documents,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.banking.checkManagement, deep: true },
                    ],
                  },
                ],
              },
              {
                title: 'Receivables',
                path: paths.dashboard.accountingFinance.receivables.root,
                icon: ICONS.payment,
                children: [
                  {
                    title: 'Customer Ledger',
                    path: paths.dashboard.accountingFinance.receivables.customerLedger,
                    icon: ICONS.menuItem,
                    activeMatch: [
                      {
                        path: paths.dashboard.accountingFinance.receivables.customerLedger,
                        deep: true,
                      },
                    ],
                  },
                  {
                    title: 'Due Invoices',
                    path: paths.dashboard.accountingFinance.receivables.dueInvoices,
                    icon: ICONS.documents,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.receivables.dueInvoices, deep: true },
                    ],
                  },
                  {
                    title: 'Aging Report',
                    path: paths.dashboard.accountingFinance.receivables.agingReport,
                    icon: ICONS.reports,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.receivables.agingReport, deep: true },
                    ],
                  },
                  {
                    title: 'Collection Follow-up',
                    path: paths.dashboard.accountingFinance.receivables.collectionFollowUp,
                    icon: ICONS.notifications,
                    activeMatch: [
                      {
                        path: paths.dashboard.accountingFinance.receivables.collectionFollowUp,
                        deep: true,
                      },
                    ],
                  },
                  {
                    title: 'Customer Statements',
                    path: paths.dashboard.accountingFinance.receivables.customerStatements,
                    icon: ICONS.documents,
                    activeMatch: [
                      {
                        path: paths.dashboard.accountingFinance.receivables.customerStatements,
                        deep: true,
                      },
                    ],
                  },
                ],
              },
              {
                title: 'Payables',
                path: paths.dashboard.accountingFinance.payables.root,
                icon: ICONS.payment,
                children: [
                  {
                    title: 'Supplier Ledger',
                    path: paths.dashboard.accountingFinance.payables.supplierLedger,
                    icon: ICONS.menuItem,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.payables.supplierLedger, deep: true },
                    ],
                  },
                  {
                    title: 'Unpaid Bills',
                    path: paths.dashboard.accountingFinance.payables.unpaidBills,
                    icon: ICONS.documents,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.payables.unpaidBills, deep: true },
                    ],
                  },
                  {
                    title: 'Aging Report',
                    path: paths.dashboard.accountingFinance.payables.agingReport,
                    icon: ICONS.reports,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.payables.agingReport, deep: true },
                    ],
                  },
                  {
                    title: 'Payment Schedule',
                    path: paths.dashboard.accountingFinance.payables.paymentSchedule,
                    icon: ICONS.calendar,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.payables.paymentSchedule, deep: true },
                    ],
                  },
                  {
                    title: 'Supplier Statements',
                    path: paths.dashboard.accountingFinance.payables.supplierStatements,
                    icon: ICONS.documents,
                    activeMatch: [
                      {
                        path: paths.dashboard.accountingFinance.payables.supplierStatements,
                        deep: true,
                      },
                    ],
                  },
                  {
                    title: 'Money Receipts',
                    path: paths.dashboard.accountingFinance.payables.moneyReceipt.root,
                    icon: ICONS.documents,
                    activeMatch: [
                      {
                        path: paths.dashboard.accountingFinance.payables.moneyReceipt.root,
                        deep: true,
                      },
                    ],
                  },
                ],
              },
              {
                title: 'Assets',
                path: paths.dashboard.accountingFinance.assets.root,
                icon: ICONS.categories,
                children: [
                  {
                    title: 'Asset Register',
                    path: paths.dashboard.accountingFinance.assets.register,
                    icon: ICONS.menuItem,
                  },
                  {
                    title: 'Asset Acquisition',
                    path: paths.dashboard.accountingFinance.assets.acquisition,
                    icon: ICONS.formAutomation,
                  },
                  {
                    title: 'Depreciation Schedule',
                    path: paths.dashboard.accountingFinance.assets.depreciation,
                    icon: ICONS.analytics,
                  },
                  {
                    title: 'Disposal / Sale',
                    path: paths.dashboard.accountingFinance.assets.disposal,
                    icon: ICONS.delivery,
                  },
                  {
                    title: 'Asset Reports',
                    path: paths.dashboard.accountingFinance.assets.reports,
                    icon: ICONS.reports,
                  },
                ],
              },
              {
                title: 'Budgets',
                path: paths.dashboard.accountingFinance.budgets.root,
                icon: ICONS.analytics,
                children: [
                  {
                    title: 'Overview',
                    path: paths.dashboard.accountingFinance.budgets.root,
                    icon: ICONS.home,
                  },
                  {
                    title: 'Budget Plans',
                    path: paths.dashboard.accountingFinance.budgets.plans,
                    icon: ICONS.menuItem,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.budgets.plans, deep: true },
                    ],
                  },
                  {
                    title: 'Budget Lines',
                    path: paths.dashboard.accountingFinance.budgets.lines,
                    icon: ICONS.documents,
                  },
                  {
                    title: 'Budget vs Actual',
                    path: paths.dashboard.accountingFinance.budgets.vsActual,
                    icon: ICONS.reports,
                  },
                  {
                    title: 'Dept / Project Tracking',
                    path: paths.dashboard.accountingFinance.budgets.tracking,
                    icon: ICONS.analytics,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.budgets.tracking, deep: true },
                    ],
                  },
                ],
              },
              {
                title: 'Reports',
                path: paths.dashboard.accountingFinance.reports.root,
                icon: ICONS.reports,
                children: [
                  {
                    title: 'Trial Balance',
                    path: paths.dashboard.accountingFinance.reports.trialBalance,
                    icon: ICONS.accounting,
                  },
                  {
                    title: 'Balance Sheet',
                    path: paths.dashboard.accountingFinance.reports.balanceSheet,
                    icon: ICONS.accounting,
                  },
                  {
                    title: 'Profit & Loss',
                    path: paths.dashboard.accountingFinance.reports.profitLoss,
                    icon: ICONS.analytics,
                  },
                  {
                    title: 'Cash Flow',
                    path: paths.dashboard.accountingFinance.reports.cashFlow,
                    icon: ICONS.payment,
                  },
                  {
                    title: 'General Ledger',
                    path: paths.dashboard.accountingFinance.reports.generalLedger,
                    icon: ICONS.documents,
                  },
                  // {
                  //   title: 'Journal Report',
                  //   path: paths.dashboard.accountingFinance.reports.journalReport,
                  //   icon: ICONS.documents,
                  //   activeMatch: [
                  //     { path: paths.dashboard.accountingFinance.reports.journalReport, deep: true },
                  //   ],
                  // },
                  // {
                  //   title: 'Account Ledger',
                  //   path: paths.dashboard.accountingFinance.reports.accountLedger,
                  //   icon: ICONS.menuItem,
                  // },
                  {
                    title: 'Customer Ledger',
                    path: paths.dashboard.accountingFinance.reports.customerLedger,
                    icon: ICONS.menuItem,
                  },
                  {
                    title: 'Supplier Ledger',
                    path: paths.dashboard.accountingFinance.reports.supplierLedger,
                    icon: ICONS.menuItem,
                  },
                  {
                    title: 'Tax Report',
                    path: paths.dashboard.accountingFinance.reports.taxReport,
                    icon: ICONS.accounting,
                  },
                  // {
                  //   title: 'Expense Report',
                  //   path: paths.dashboard.accountingFinance.reports.expenseReport,
                  //   icon: ICONS.reports,
                  // },
                  // {
                  //   title: 'Cost Center Report',
                  //   path: paths.dashboard.accountingFinance.reports.costCenterReport,
                  //   icon: ICONS.analytics,
                  // },
                  // {
                  //   title: 'Asset Report',
                  //   path: paths.dashboard.accountingFinance.reports.assetReport,
                  //   icon: ICONS.categories,
                  // },
                  // {
                  //   title: 'Budget Report',
                  //   path: paths.dashboard.accountingFinance.reports.budgetReport,
                  //   icon: ICONS.reports,
                  // },
                  // {
                  //   title: 'Executive Summary',
                  //   path: paths.dashboard.accountingFinance.reports.executiveSummary,
                  //   icon: ICONS.analytics,
                  // },
                  // {
                  //   title: 'Analytic Report',
                  //   path: paths.dashboard.accountingFinance.reports.analyticReport,
                  //   icon: ICONS.analytics,
                  // },
                  // {
                  //   title: 'Partner Ledger',
                  //   path: paths.dashboard.accountingFinance.reports.partnerLedger,
                  //   icon: ICONS.menuItem,
                  // },
                  // {
                  //   title: 'Tax Audit',
                  //   path: paths.dashboard.accountingFinance.reports.taxAudit,
                  //   icon: ICONS.accounting,
                  // },
                  // {
                  //   title: 'Consolidated Report',
                  //   path: paths.dashboard.accountingFinance.reports.consolidatedReport,
                  //   icon: ICONS.reports,
                  // },
                ],
              },
              {
                title: 'Analytic Accounting',
                path: paths.dashboard.accountingFinance.analyticAccounting.root,
                icon: ICONS.analytics,
                children: [
                  {
                    title: 'Overview',
                    path: paths.dashboard.accountingFinance.analyticAccounting.root,
                    icon: ICONS.home,
                  },
                  {
                    title: 'Analytic Accounts',
                    path: paths.dashboard.accountingFinance.analyticAccounting.analyticAccounts,
                    icon: ICONS.accounting,
                  },
                  {
                    title: 'Analytic Plans',
                    path: paths.dashboard.accountingFinance.analyticAccounting.analyticPlans,
                    icon: ICONS.documents,
                  },
                  {
                    title: 'Analytic Items',
                    path: paths.dashboard.accountingFinance.analyticAccounting.analyticItems,
                    icon: ICONS.menuItem,
                  },
                ],
              },
              {
                title: 'Year-End',
                path: paths.dashboard.accountingFinance.yearEnd.root,
                icon: ICONS.calendar,
                children: [
                  {
                    title: 'Overview',
                    path: paths.dashboard.accountingFinance.yearEnd.root,
                    icon: ICONS.home,
                  },
                  {
                    title: 'Year-End Closing',
                    path: paths.dashboard.accountingFinance.yearEnd.yearEndClosing,
                    icon: ICONS.approval,
                  },
                  {
                    title: 'Period Lock',
                    path: paths.dashboard.accountingFinance.yearEnd.periodLock,
                    icon: ICONS.calendar,
                  },
                  {
                    title: 'Opening Entries',
                    path: paths.dashboard.accountingFinance.yearEnd.openingEntries,
                    icon: ICONS.documents,
                  },
                ],
              },
              {
                title: 'Settings',
                path: paths.dashboard.accountingFinance.settings.root,
                icon: ICONS.settings,
                children: [
                  {
                    title: 'Posting Rules',
                    path: paths.dashboard.accountingFinance.settings.postingRules,
                    icon: ICONS.settings,
                  },
                  {
                    title: 'Integration Rules',
                    path: paths.dashboard.accountingFinance.settings.integrationRules,
                    icon: ICONS.external,
                  },
                  {
                    title: 'Approval Workflow',
                    path: paths.dashboard.accountingFinance.settings.approvalWorkflow,
                    icon: ICONS.approval,
                  },
                  {
                    title: 'Number Series',
                    path: paths.dashboard.accountingFinance.settings.numberSeries,
                    icon: ICONS.accounting,
                  },
                  {
                    title: 'Role Permissions',
                    path: paths.dashboard.accountingFinance.settings.rolePermissions,
                    icon: ICONS.account,
                  },
                  {
                    title: 'Audit Log',
                    path: paths.dashboard.accountingFinance.settings.auditLog,
                    icon: ICONS.documents,
                  },
                  {
                    title: 'Print Template',
                    path: '/dashboard/accounting-finance/settings/print-template',
                    icon: ICONS.documents,
                  },
                  {
                    title: 'Currency & Rates',
                    path: paths.dashboard.accountingFinance.settings.currencyRates,
                    icon: ICONS.accounting,
                  },
                ],
              },
              {
                title: 'Provident Fund',
                path: paths.dashboard.accountingFinance.providentFund.root,
                icon: ICONS.accounting,
                children: [
                  {
                    title: 'PF Loan List',
                    path: paths.dashboard.accountingFinance.providentFund.list,
                    icon: ICONS.menuItem,
                    activeMatch: [
                      { path: paths.dashboard.accountingFinance.providentFund.list, deep: true },
                    ],
                  },
                  {
                    title: 'Create PF Loan',
                    path: paths.dashboard.accountingFinance.providentFund.create,
                    icon: ICONS.formAutomation,
                  },
                ],
              },
            ],
          }
        ]

      },
      {
        // subheader: 'Ledars Management',
        items: [
          {
            title: 'Ledars Management',
            icon: ICONS.ledars,
            children: [
              {
                title: 'Donor Management',
                path: paths.dashboard.projects.donors.root,
                icon: ICONS.vendors,
              },
              // {
              //   title: 'Print Template',
              //   path: paths.dashboard.ledarsManagement.templates,
              //   icon: ICONS.documents,
              // },
            ],
          },
        ],
      },

      // ============================================================
      // HRM
      // ============================================================
      {
        items: [
          {
            title: 'HRM',
            icon: ICONS.hrm,
            children: [
              {
                title: 'Dashboard',
                path: paths.dashboard.hrm,
                icon: ICONS.dashboard,
              },
              ...((user?.role === 'Employee' || user?.role === 'Supervisor') &&
                !hasPermission('view_employee')
                ? [
                  {
                    title: 'Account Information',
                    path: paths.dashboard.user.account,
                    icon: ICONS.account,
                  },
                ]
                : []),
              ...(employeeChildren.length > 0
                ? [
                  {
                    title: 'Employee',
                    path: paths.dashboard.user.root,
                    icon: ICONS.user,
                    children: employeeChildren,
                  },
                ]
                : []),
              ...(user?.is_superuser
                ? [
                  {
                    title: 'Settings',
                    path: paths.dashboard.settings.root,
                    icon: ICONS.settings,
                    children: [
                      ...(hasPermission('view_department')
                        ? [
                          {
                            title: 'Department',
                            path: paths.dashboard.settings.department,
                            icon: ICONS.department,
                          },
                        ]
                        : []),
                      ...(hasPermission('view_designation')
                        ? [
                          {
                            title: 'Designation',
                            path: paths.dashboard.settings.designation,
                            icon: ICONS.account,
                          },
                        ]
                        : []),
                      ...(hasPermission('view_branch')
                        ? [
                          {
                            title: 'Branch',
                            path: paths.dashboard.settings.branch,
                            icon: ICONS.branch,
                          },
                        ]
                        : []),
                      ...(hasPermission('view_grade')
                        ? [
                          {
                            title: 'Grade',
                            path: paths.dashboard.settings.grade,
                            icon: ICONS.label,
                          },
                        ]
                        : []),
                      ...(hasPermission('view_shift')
                        ? [
                          {
                            title: 'Shift',
                            path: paths.dashboard.settings.shift,
                            icon: ICONS.shift,
                          },
                        ]
                        : []),
                      ...(hasPermission('view_role')
                        ? [
                          {
                            title: 'Role',
                            path: paths.dashboard.settings.role,
                            icon: ICONS.account,
                          },
                        ]
                        : []),
                      ...(hasPermission('view_leavepolicy') ||
                        hasPermission('view_leavegroup') ||
                        hasPermission('view_specialleavepolicy') ||
                        hasPermission('view_leavereset')
                        ? [
                          {
                            title: 'Leave Management',
                            path: paths.dashboard.settings.leave.root,
                            children: [
                              ...(hasPermission('view_leavegroup')
                                ? [
                                  {
                                    title: 'Group',
                                    path: paths.dashboard.settings.leave.group,
                                    icon: ICONS.leave,
                                  },
                                ]
                                : []),
                              ...(hasPermission('view_leavepolicy')
                                ? [
                                  {
                                    title: 'Policy',
                                    path: paths.dashboard.settings.leave.policy,
                                    icon: ICONS.leave,
                                  },
                                ]
                                : []),
                              ...(hasPermission('view_leavereset')
                                ? [
                                  {
                                    title: 'Reset Period',
                                    path: paths.dashboard.settings.leave.reset,
                                    icon: ICONS.leave,
                                  },
                                ]
                                : []),
                              ...(hasPermission('view_specialleavepolicy')
                                ? [
                                  {
                                    title: 'Special Policies',
                                    path: paths.dashboard.settings.leave.special,
                                    icon: ICONS.leave,
                                  },
                                ]
                                : []),
                            ],
                          },
                        ]
                        : []),
                      ...(hasPermission('view_preapprovedip')
                        ? [
                          {
                            title: 'Pre-approved IP',
                            path: paths.dashboard.settings.preapprovedip,
                            icon: ICONS.lock,
                          },
                        ]
                        : []),
                      ...(hasPermission('view_cutoff')
                        ? [
                          {
                            title: 'Cut-off Date',
                            path: paths.dashboard.settings.cutOffDate,
                            icon: ICONS.calendar,
                          },
                        ]
                        : []),
                      ...(hasPermission('view_supervisorlevel')
                        ? [
                          {
                            title: 'Supervisor Level',
                            path: paths.dashboard.settings.supervisorLevel,
                            icon: ICONS.user,
                          },
                        ]
                        : []),
                    ],
                  },
                ]
                : []),
              {
                title: 'Attendance Management',
                path: paths.dashboard.attendance.root,
                icon: ICONS.calendar,
                children: [
                  ...(hasPermission('view_attendance')
                    ? [
                      {
                        title: 'List',
                        path: paths.dashboard.attendance.list,
                        icon: ICONS.menuItem,
                      },
                    ]
                    : []),
                  ...(canShowWebLogin || hasPermission('add_attendancedata')
                    ? [
                      {
                        title: 'Mark Attendance',
                        path: paths.dashboard.attendance.webLogin,
                        icon: ICONS.calendar,
                      },
                    ]
                    : []),
                  ...(hasPermission('view_attendanceadjustmentrequest') ||
                    hasPermission('add_attendanceadjustmentrequest')
                    ? [
                      {
                        title: 'Adjustment',
                        path: paths.dashboard.attendance.adjustment,
                        icon: ICONS.approval,
                      },
                    ]
                    : []),
                  ...(hasPermission('view_attendanceadjustmentapproval')
                    ? [
                      {
                        title: 'Adjustment Approvals',
                        path: paths.dashboard.attendance.approval,
                        icon: ICONS.approval,
                      },
                    ]
                    : []),
                  ...(user?.role === 'Supervisor' || hasPermission('view_attendance')
                    ? [
                      {
                        title: 'Daily Attendance',
                        path: paths.dashboard.attendance.daily,
                        icon: ICONS.calendar,
                      },
                    ]
                    : []),
                  ...(hasPermission('view_attendancedata') ||
                    hasPermission('view_own_attendance') ||
                    hasPermission('view_subordinate_attendance')
                    ? [
                      {
                        title: 'Monthly Attendance Summary',
                        path: paths.dashboard.attendance.monthly,
                        icon: ICONS.reports,
                      },
                    ]
                    : []),
                ],
              },
              ...((user?.role === 'Employee' || user?.role === 'Supervisor') &&
                !hasPermission('view_holiday')
                ? [
                  {
                    title: 'Holiday Calendar',
                    path: paths.dashboard.holiday.calendar,
                    icon: ICONS.booking,
                  },
                ]
                : []),
              ...(holidayChildren.length > 0
                ? [
                  {
                    title: 'Holiday Management',
                    path: paths.dashboard.holiday.root,
                    icon: ICONS.booking,
                    children: holidayChildren,
                  },
                ]
                : []),
              {
                title: 'Leave Management',
                path: paths.dashboard.leave.root,
                icon: ICONS.leave,
                children: [
                  ...(hasPermission('view_leaverequest') || hasPermission('add_leaverequest')
                    ? [
                      {
                        title: 'Leave Requests',
                        path: paths.dashboard.leave.request,
                        icon: ICONS.leave,
                      },
                    ]
                    : []),
                  ...(user?.role === 'Supervisor' || hasPermission('view_leaveapproval')
                    ? [
                      {
                        title: 'Approvals',
                        path: paths.dashboard.leave.approval,
                        icon: ICONS.approval,
                      },
                    ]
                    : []),
                  ...(hasPermission('view_leaverequest')
                    ? [
                      {
                        title: 'Leave Calendar',
                        path: paths.dashboard.leave.calendar,
                        icon: ICONS.calendar,
                      },
                    ]
                    : []),
                  ...(user?.role === 'Admin'
                    ? [
                      {
                        title: 'Employee Leave Balance',
                        path: paths.dashboard.leave.balance,
                        icon: ICONS.analytics,
                      },
                    ]
                    : []),
                  ...(user?.role === 'Supervisor'
                    ? [
                      {
                        title: 'Subordinate Leave Balance',
                        path: paths.dashboard.leave.balance,
                        icon: ICONS.analytics,
                      },
                    ]
                    : []),
                ],
              },
              ...(hasPermission('add_payroll') || hasPermission('view_payroll')
                ? [
                  {
                    title: 'Payroll',
                    path: paths.dashboard.payroll.root,
                    icon: ICONS.payroll,
                    children: [
                      ...(hasPermission('add_payroll')
                        ? [
                          {
                            title: 'Generate Payroll',
                            path: paths.dashboard.payroll.generate,
                            icon: ICONS.formAutomation,
                          },
                        ]
                        : []),
                      ...(hasPermission('view_payroll') || hasPermission('add_payroll')
                        ? [
                          {
                            title: 'Payroll List',
                            path: paths.dashboard.payroll.list,
                            icon: ICONS.payroll,
                          },
                        ]
                        : []),
                    ],
                  },
                ]
                : []),
              {
                title: 'Final Settlement',
                path: paths.dashboard.finalSettlement.root,
                icon: ICONS.payment,
                children: [
                  {
                    title: 'Settlement List',
                    path: paths.dashboard.finalSettlement.list,
                    icon: ICONS.menuItem,
                  },
                  {
                    title: 'Create Settlement',
                    path: paths.dashboard.finalSettlement.create,
                    icon: ICONS.formAutomation,
                  },
                ],
              },
            ],
          },
        ],
      },

      // ============================================================
      // Beneficiaries
      // ============================================================
      {
        items: [
          {
            title: 'Beneficiaries',
            icon: ICONS.beneficiaries,
            children: [
              {
                title: 'Dashboard',
                path: paths.dashboard.beneficiaries.dashboard,
                icon: ICONS.dashboard,
              },
              {
                title: 'Registration & Database',
                path: paths.dashboard.beneficiaries.database,
                icon: ICONS.beneficiaries,
                children: [
                  {
                    title: 'Beneficiary Database',
                    path: paths.dashboard.beneficiaries.database,
                    icon: ICONS.beneficiaries,
                    children: [
                      {
                        title: 'All Beneficiaries',
                        path: paths.dashboard.beneficiaries.database,
                        icon: ICONS.beneficiaries,
                      },
                      {
                        title: 'Add Beneficiary',
                        path: paths.dashboard.beneficiaries.add_database,
                        icon: ICONS.formAutomation,
                      },
                    ],
                  },
                  {
                    title: 'ID Card Generation',
                    path: paths.dashboard.beneficiaries.id_card_generation,
                    icon: ICONS.account,
                  },
                  {
                    title: 'Import / Export',
                    path: paths.dashboard.beneficiaries.beneficiary_import,
                    icon: ICONS.external,
                  },
                ],
              },
              {
                title: 'Assessment & Targeting',
                path: paths.dashboard.beneficiaries.vulnerability_assessment,
                icon: ICONS.approval,
                children: [
                  {
                    title: 'Vulnerability Assessment',
                    path: paths.dashboard.beneficiaries.vulnerability_assessment,
                    icon: ICONS.approval,
                  },
                  {
                    title: 'Targeting Criteria',
                    path: paths.dashboard.beneficiaries.targeting_criteria,
                    icon: ICONS.settings,
                  },
                  {
                    title: 'Needs Assessment',
                    path: paths.dashboard.beneficiaries.needs_assessment,
                    icon: ICONS.requisition,
                  },
                  {
                    title: 'Eligibility Screening',
                    path: paths.dashboard.beneficiaries.eligibility_screening,
                    icon: ICONS.approval,
                  },
                ],
              },
              {
                title: 'Household Management',
                path: paths.dashboard.beneficiaries.household_profiling,
                icon: ICONS.department,
                children: [
                  {
                    title: 'Household Profiling',
                    path: paths.dashboard.beneficiaries.household_profiling,
                    icon: ICONS.department,
                  },
                  {
                    title: 'Household Surveys',
                    path: paths.dashboard.beneficiaries.household_surveys,
                    icon: ICONS.documents,
                  },
                ],
              },
              {
                title: 'Accountability',
                path: paths.dashboard.beneficiaries.complaints_feedback,
                icon: ICONS.notifications,
                children: [
                  {
                    title: 'Complaints & Feedback',
                    path: paths.dashboard.beneficiaries.complaints_feedback,
                    icon: ICONS.notifications,
                  },
                  {
                    title: 'Satisfaction Surveys',
                    path: paths.dashboard.beneficiaries.satisfaction_surveys,
                    icon: ICONS.documents,
                  },
                  {
                    title: 'Grievance Redressal',
                    path: paths.dashboard.beneficiaries.grievance_redressal,
                    icon: ICONS.approval,
                  },
                ],
              },
              {
                title: 'Reports & Analytics',
                path: paths.dashboard.beneficiaries.beneficiary_analytics,
                icon: ICONS.reports,
                children: [
                  {
                    title: 'Beneficiary Analytics',
                    path: paths.dashboard.beneficiaries.beneficiary_analytics,
                    icon: ICONS.analytics,
                  },
                  {
                    title: 'Demographic Report',
                    path: paths.dashboard.beneficiaries.demographic_report,
                    icon: ICONS.reports,
                  },
                  {
                    title: 'Coverage Map',
                    path: paths.dashboard.beneficiaries.coverage_map,
                    icon: ICONS.branch,
                  },
                  {
                    title: 'Donor Report',
                    path: paths.dashboard.beneficiaries.donor_report,
                    icon: ICONS.documents,
                  },
                  {
                    title: 'Attendance Tracker',
                    path: paths.dashboard.beneficiaries.attendance_tracker,
                    icon: ICONS.calendar,
                  },
                ],
              },
              {
                title: 'Settings',
                path: paths.dashboard.beneficiaries.beneficiary_settings,
                icon: ICONS.settings,
              },
            ],
          },
        ],
      },

      // ============================================================
      // Store & Inventory
      // ============================================================
      {
        items: [
          {
            title: 'Store & Inventory',
            icon: ICONS.store,
            children: [
              {
                title: 'Dashboard',
                path: paths.dashboard.storeInventory.dashboard,
                icon: ICONS.dashboard,
              },
              {
                title: 'Products',
                path: paths.dashboard.storeInventory.itemMaster,
                icon: ICONS.inventory,
                children: [
                  {
                    title: 'Item Master',
                    path: paths.dashboard.storeInventory.itemMaster,
                    icon: ICONS.inventory,
                    children: [
                      {
                        title: 'All Items',
                        path: paths.dashboard.storeInventory.itemMaster,
                        icon: ICONS.inventory,
                      },
                      {
                        title: 'Add Item',
                        path: paths.dashboard.storeInventory.add_item,
                        icon: ICONS.formAutomation,
                      },
                      {
                        title: 'Category List',
                        path: paths.dashboard.storeInventory.add_category,
                        icon: ICONS.categories,
                      },
                    ],
                  },
                  // { title: 'Product Variants', path: paths.dashboard.storeInventory.productVariants, icon: ICONS.categories },
                  {
                    title: 'Units of Measure',
                    path: paths.dashboard.storeInventory.unitsOfMeasure,
                    icon: ICONS.menuItem,
                  },
                  // { title: 'Packaging Types', path: paths.dashboard.storeInventory.packagingTypes, icon: ICONS.delivery },
                  // { title: 'Product Templates', path: paths.dashboard.storeInventory.productTemplates, icon: ICONS.documents },
                  // { title: 'Kitting / BOM', path: paths.dashboard.storeInventory.kittingBom, icon: ICONS.requisition },
                  // { title: 'Reorder Rules', path: paths.dashboard.storeInventory.reorderRules, icon: ICONS.settings },
                ],
              },
              {
                title: 'Operations',
                path: paths.dashboard.storeInventory.goodsReceiptNote,
                icon: ICONS.requisition,
                children: [
                  // { title: 'Goods Receipt Note', path: paths.dashboard.storeInventory.goodsReceiptNote, icon: ICONS.grn },
                  {
                    title: 'Goods Issue Note',
                    path: paths.dashboard.storeInventory.goods_issue_note,
                    icon: ICONS.delivery,
                    children: [
                      {
                        title: 'GIN List',
                        path: paths.dashboard.storeInventory.goods_issue_note,
                        icon: ICONS.menuItem,
                      },
                      {
                        title: 'Create GIN',
                        path: paths.dashboard.storeInventory.goods_issue_note_create,
                        icon: ICONS.formAutomation,
                      },
                    ],
                  },
                  {
                    title: 'Internal Transfers',
                    path: paths.dashboard.storeInventory.stock_transfer,
                    icon: ICONS.delivery,
                  },
                  {
                    title: 'Stock Adjustment',
                    path: paths.dashboard.storeInventory.stock_adjustment,
                    icon: ICONS.inventory,
                    children: [
                      {
                        title: 'Adjustment List',
                        path: paths.dashboard.storeInventory.stock_adjustment,
                        icon: ICONS.menuItem,
                      },
                      {
                        title: 'Create Adjustment',
                        path: paths.dashboard.storeInventory.stock_adjustment_create,
                        icon: ICONS.formAutomation,
                      },
                    ],
                  },
                  // { title: 'Location Stock Ledger', path: paths.dashboard.storeInventory.location_stocks, icon: ICONS.inventory },
                  // { title: 'Cycle Counting', path: paths.dashboard.storeInventory.cycleCounting, icon: ICONS.analytics },
                  // { title: 'Returns', path: paths.dashboard.storeInventory.returns, icon: ICONS.menuItem },
                  // { title: 'Batch Transfers', path: paths.dashboard.storeInventory.batchTransfers, icon: ICONS.requisition },
                  {
                    title: 'Scrap Management',
                    path: paths.dashboard.storeInventory.scrapManagement,
                    icon: ICONS.menuItem,
                    children: [
                      {
                        title: 'Scrap List',
                        path: paths.dashboard.storeInventory.scrapManagement,
                        icon: ICONS.menuItem,
                      },
                      {
                        title: 'Create Scrap',
                        path: paths.dashboard.storeInventory.scrapManagement_create,
                        icon: ICONS.formAutomation,
                      },
                    ],
                  },
                  {
                    title: 'Return Management',
                    path: paths.dashboard.storeInventory.returnManagement,
                    icon: ICONS.menuItem,
                    children: [
                      {
                        title: 'Return List',
                        path: paths.dashboard.storeInventory.returnManagement,
                        icon: ICONS.menuItem,
                      },
                      {
                        title: 'Create Return',
                        path: paths.dashboard.storeInventory.returnManagement_create,
                        icon: ICONS.menuItem,
                      },
                      {
                        title: 'Return History',
                        path: paths.dashboard.storeInventory.returnManagement_history,
                        icon: ICONS.menuItem,
                      },
                    ],
                  },
                  // { title: 'Backorders', path: paths.dashboard.storeInventory.backorders, icon: ICONS.documents },
                  // { title: 'Replenishment', path: paths.dashboard.storeInventory.replenishment, icon: ICONS.formAutomation },
                  // { title: 'Dropshipping', path: paths.dashboard.storeInventory.dropshipping, icon: ICONS.delivery },
                  // { title: 'Cross-Docking', path: paths.dashboard.storeInventory.crossDocking, icon: ICONS.delivery },
                  // { title: 'Inventory Log', path: paths.dashboard.storeInventory.operationInventoryLog, icon: ICONS.inventory, children: [{ title: 'History', path: paths.dashboard.storeInventory.operationInventoryLogHistory, icon: ICONS.shift }] },
                ],
              },
              {
                title: 'Inventory Log',
                path: paths.dashboard.storeInventory.inventoryLog,
                icon: ICONS.inventory,
                children: [
                  {
                    title: 'Inventory List',
                    path: paths.dashboard.storeInventory.inventoryLogList,
                    icon: ICONS.menuItem,
                  },
                  {
                    title: 'Analytics',
                    path: paths.dashboard.storeInventory.inventoryLogAnalytics,
                    icon: ICONS.analytics,
                  },
                  {
                    title: 'History',
                    path: paths.dashboard.storeInventory.inventoryLogHistory,
                    icon: ICONS.shift,
                  },
                ],
              },
              {
                title: 'Warehouse & Locations',
                path: paths.dashboard.storeInventory.warehouses,
                icon: ICONS.department,
                children: [
                  {
                    title: 'Office Locations',
                    path: paths.dashboard.storeInventory.officeLocations,
                    icon: ICONS.branch,
                  },
                  {
                    title: 'Warehouses',
                    path: paths.dashboard.storeInventory.warehouses,
                    icon: ICONS.department,
                  },
                  // { title: 'Storage Locations', path: paths.dashboard.storeInventory.storageLocations, icon: ICONS.branch },
                  // { title: 'Putaway Rules', path: paths.dashboard.storeInventory.putawayRules, icon: ICONS.settings },
                  // { title: 'Removal Strategies', path: paths.dashboard.storeInventory.removalStrategies, icon: ICONS.menuItem },
                  // { title: 'Routes & Rules', path: paths.dashboard.storeInventory.routesAndRules, icon: ICONS.requisition },
                  // { title: 'Operation Types', path: paths.dashboard.storeInventory.operationTypes, icon: ICONS.categories },
                ],
              },
              // { title: 'Lots & Traceability', path: paths.dashboard.storeInventory.lotSerialNumbers, icon: ICONS.documents, children: [
              //   { title: 'Lots / Serial Numbers', path: paths.dashboard.storeInventory.lotSerialNumbers, icon: ICONS.documents },
              //   { title: 'Expiry Date Tracking', path: paths.dashboard.storeInventory.expiryDateTracking, icon: ICONS.calendar },
              //   { title: 'Move History', path: paths.dashboard.storeInventory.moveHistory, icon: ICONS.shift },
              //   { title: 'Lot Traceability', path: paths.dashboard.storeInventory.lotTraceability, icon: ICONS.analytics },
              //   { title: 'Product Recalls', path: paths.dashboard.storeInventory.productRecalls, icon: ICONS.notifications },
              // ]},
              {
                title: 'Quality Control',
                path: paths.dashboard.storeInventory.qualityChecks,
                icon: ICONS.approval,
                children: [
                  {
                    title: 'Quality Checks',
                    path: paths.dashboard.storeInventory.qualityChecks,
                    icon: ICONS.approval,
                  },
                  {
                    title: 'Quality Alerts',
                    path: paths.dashboard.storeInventory.qualityAlerts,
                    icon: ICONS.notifications,
                  },
                  {
                    title: 'Control Points',
                    path: paths.dashboard.storeInventory.qualityControlPoints,
                    icon: ICONS.settings,
                  },
                  // { title: 'Quality Teams', path: paths.dashboard.storeInventory.qualityTeams, icon: ICONS.beneficiaries },
                  // { title: 'QC Templates', path: paths.dashboard.storeInventory.qcTemplates, icon: ICONS.documents },
                ],
              },
              // { title: 'Valuation & Costing', path: paths.dashboard.storeInventory.inventoryValuation, icon: ICONS.accounting, children: [
              //   { title: 'Inventory Valuation', path: paths.dashboard.storeInventory.inventoryValuation, icon: ICONS.accounting },
              //   { title: 'Landed Costs', path: paths.dashboard.storeInventory.landedCosts, icon: ICONS.payment },
              //   { title: 'Valuation Methods', path: paths.dashboard.storeInventory.valuationMethods, icon: ICONS.settings },
              //   { title: 'Valuation Layers', path: paths.dashboard.storeInventory.stockValuationLayers, icon: ICONS.analytics },
              // ]},
              {
                title: 'Barcode & Scanning',
                path: paths.dashboard.storeInventory.barcodeScanning,
                icon: ICONS.menuItem,
                children: [
                  {
                    title: 'Barcode Scanning',
                    path: paths.dashboard.storeInventory.barcodeScanning,
                    icon: ICONS.menuItem,
                  },
                  {
                    title: 'Label Printing',
                    path: paths.dashboard.storeInventory.labelPrinting,
                    icon: ICONS.documents,
                  },
                  // { title: 'Mobile Warehouse', path: paths.dashboard.storeInventory.mobileWarehouse, icon: ICONS.external },
                ],
              },
              // { title: 'Reports & Analytics', path: paths.dashboard.storeInventory.stock_reports, icon: ICONS.reports, children: [
              //   { title: 'Inventory Log', path: paths.dashboard.storeInventory.inventoryLog, icon: ICONS.inventory, children: [{ title: 'Inventory List', path: paths.dashboard.storeInventory.inventoryLogList, icon: ICONS.menuItem }, { title: 'Analytics', path: paths.dashboard.storeInventory.inventoryLogAnalytics, icon: ICONS.analytics }, { title: 'History', path: paths.dashboard.storeInventory.inventoryLogHistory, icon: ICONS.shift }] },
              //   { title: 'Stock Reports', path: paths.dashboard.storeInventory.stock_reports, icon: ICONS.reports },
              //   { title: 'Forecasted Stock', path: paths.dashboard.storeInventory.forecastedStock, icon: ICONS.analytics },
              //   { title: 'Stock Aging Report', path: paths.dashboard.storeInventory.stockAgingReport, icon: ICONS.calendar },
              //   { title: 'ABC Analysis', path: paths.dashboard.storeInventory.abcAnalysis, icon: ICONS.analytics },
              //   { title: 'Consumption Report', path: paths.dashboard.storeInventory.consumptionReport, icon: ICONS.reports },
              //   { title: 'Wastage Report', path: paths.dashboard.storeInventory.wastageReport, icon: ICONS.reports },
              //   { title: 'Turnover Analysis', path: paths.dashboard.storeInventory.turnoverAnalysis, icon: ICONS.analytics },
              //   { title: 'Landed Cost Report', path: paths.dashboard.storeInventory.landedCostReport, icon: ICONS.accounting },
              // ]},
              // { title: 'NGO Operations', path: paths.dashboard.storeInventory.donorFundedInventory, icon: ICONS.projects, children: [
              //   { title: 'Donor-Funded Inventory', path: paths.dashboard.storeInventory.donorFundedInventory, icon: ICONS.projects },
              //   { title: 'Field Distribution', path: paths.dashboard.storeInventory.fieldDistribution, icon: ICONS.delivery },
              //   { title: 'Humanitarian Kitting', path: paths.dashboard.storeInventory.humanitarianKitting, icon: ICONS.requisition },
              //   { title: 'Emergency Reserves', path: paths.dashboard.storeInventory.emergencyReserves, icon: ICONS.notifications },
              //   { title: 'Pipeline Tracking', path: paths.dashboard.storeInventory.pipelineTracking, icon: ICONS.shift },
              //   { title: 'Commodity Tracking', path: paths.dashboard.storeInventory.commodityTracking, icon: ICONS.inventory },
              //   { title: 'Waybill Management', path: paths.dashboard.storeInventory.waybillManagement, icon: ICONS.documents },
              //   { title: 'Disposal Management', path: paths.dashboard.storeInventory.disposalManagement, icon: ICONS.menuItem },
              //   { title: 'Loss & Damage Claims', path: paths.dashboard.storeInventory.lossDamageClaims, icon: ICONS.reports },
              //   { title: 'Beneficiary Distribution', path: paths.dashboard.storeInventory.beneficiaryDistribution, icon: ICONS.beneficiaries },
              //   { title: 'Field Warehouse', path: paths.dashboard.storeInventory.fieldWarehouse, icon: ICONS.department },
              //   { title: 'Customs & Import', path: paths.dashboard.storeInventory.customsImportTracking, icon: ICONS.external },
              //   { title: 'Vehicle Dispatch', path: paths.dashboard.storeInventory.vehicleDispatch, icon: ICONS.delivery },
              // ]},
              // { title: 'Approvals', path: paths.dashboard.storeInventory.approvals, icon: ICONS.approval },
              {
                title: 'Settings',
                path: paths.dashboard.storeInventory.warehouseSettings,
                icon: ICONS.settings,
                children: [
                  {
                    title: 'Warehouse Settings',
                    path: paths.dashboard.storeInventory.warehouseSettings,
                    icon: ICONS.settings,
                  },
                  {
                    title: 'Office Settings',
                    path: paths.dashboard.storeInventory.officeSettings,
                    icon: ICONS.settings,
                  },
                  // { title: 'Approval Matrix', path: paths.dashboard.storeInventory.inventoryApprovalMatrix, icon: ICONS.approval },
                  {
                    title: 'Approval Workflow',
                    path: paths.dashboard.storeInventory.approvalWorkflow,
                    icon: ICONS.approval,
                  },
                  // { title: 'Shipping Methods', path: paths.dashboard.storeInventory.shippingMethods, icon: ICONS.delivery },
                  // { title: 'Package Types', path: paths.dashboard.storeInventory.packageTypes, icon: ICONS.categories },
                  // { title: 'Inventory Settings', path: paths.dashboard.storeInventory.inventorySettings, icon: ICONS.settings },
                ],
              },
            ],
          },
        ],
      },

      // ============================================================
      // Settings (Superuser only)
      // ============================================================
      ...(user?.is_superuser
        ? [
          {
            items: [
              {
                title: 'Settings',
                icon: ICONS.settings,
                children: [
                  {
                    title: 'Module Permissions',
                    path: paths.dashboard.settings.modulePermissions,
                    icon: ICONS.lock,
                  },
                ],
              },
            ],
          },
        ]
        : []),
    ]);
  }, [hasPermission, user?.role, user?.is_superuser, canShowWebLogin]);

  return navData;
}

export const navData = decorateNavItems([
  {
    items: [
      {
        title: 'Overview',
        icon: ICONS.dashboard,
        children: [{ title: 'App', path: paths.dashboard.root, icon: ICONS.dashboard }],
      },
    ],
  },
  {
    items: [
      {
        title: 'Management',
        icon: ICONS.mail,
        children: [
          {
            title: 'Mail',
            path: paths.dashboard.mail,
            icon: ICONS.mail,
            info: (
              <Label color="error" variant="inverted">
                +32
              </Label>
            ),
          },
        ],
      },
    ],
  },
  {
    items: [
      {
        title: 'Misc',
        icon: ICONS.menuItem,
        children: [
          {
            title: 'Permission',
            path: paths.dashboard.permission,
            icon: ICONS.lock,
            roles: ['admin', 'manager'],
            caption: 'Only admin can see this item',
          },
          {
            title: 'Level',
            path: '#/dashboard/menu_level',
            icon: ICONS.menuItem,
            children: [
              {
                title: 'Level 1a',
                path: '#/dashboard/menu_level/menu_level_1a',
                children: [
                  { title: 'Level 2a', path: '#/dashboard/menu_level/menu_level_1a/menu_level_2a' },
                  {
                    title: 'Level 2b',
                    path: '#/dashboard/menu_level/menu_level_1a/menu_level_2b',
                    children: [
                      {
                        title: 'Level 3a',
                        path: '#/dashboard/menu_level/menu_level_1a/menu_level_2b/menu_level_3a',
                      },
                      {
                        title: 'Level 3b',
                        path: '#/dashboard/menu_level/menu_level_1a/menu_level_2b/menu_level_3b',
                      },
                    ],
                  },
                ],
              },
              { title: 'Level 1b', path: '#/dashboard/menu_level/menu_level_1b' },
            ],
          },
          { title: 'Disabled', path: '#disabled', icon: ICONS.disabled, disabled: true },
          {
            title: 'Label',
            path: '#label',
            icon: ICONS.label,
            info: (
              <Label
                color="info"
                variant="inverted"
                startIcon={<Iconify icon="solar:bell-bing-bold-duotone" />}
              >
                NEW
              </Label>
            ),
          },
          {
            title: 'Caption',
            path: '#caption',
            icon: ICONS.menuItem,
            caption:
              'Quisque malesuada placerat nisl. In hac habitasse platea dictumst. Cras id dui. Pellentesque commodo eros a enim. Morbi mollis tellus ac sapien.',
          },
          {
            title: 'Params',
            path: '/dashboard/params?id=e99f09a7-dd88-49d5-b1c8-1daf80c2d7b1',
            icon: ICONS.parameter,
          },
          {
            title: 'External link',
            path: 'https://www.google.com/',
            icon: ICONS.external,
            info: <Iconify width={18} icon="prime:external-link" />,
          },
          { title: 'Blank', path: paths.dashboard.blank, icon: ICONS.blank },
        ],
      },
    ],
  },
]);
