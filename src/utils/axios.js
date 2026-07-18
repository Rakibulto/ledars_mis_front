import axios from 'axios';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

const DEFAULT_ERROR_MESSAGE = 'Something went wrong!';

function getErrorMessage(detail) {
  if (!detail) return '';

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => getErrorMessage(item))
      .filter(Boolean)
      .join(' ');
  }

  if (typeof detail === 'object') {
    return Object.entries(detail)
      .map(([key, value]) => {
        const nestedMessage = getErrorMessage(value);
        if (!nestedMessage) return '';
        return key === 'detail' ? nestedMessage : `${key}: ${nestedMessage}`;
      })
      .filter(Boolean)
      .join(' | ');
  }

  return '';
}

function normalizeRequestError(error) {
  if (!error) {
    return {
      detail: DEFAULT_ERROR_MESSAGE,
      message: DEFAULT_ERROR_MESSAGE,
      status_code: null,
    };
  }

  if (error.message && error.detail) {
    return error;
  }

  const responseData = error?.response?.data;
  const detail = responseData?.detail ?? responseData ?? error?.detail ?? error?.message;
  const message = getErrorMessage(detail) || error?.message || DEFAULT_ERROR_MESSAGE;

  if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
    return {
      ...responseData,
      detail: responseData.detail ?? message,
      message,
      status_code: responseData.status_code ?? error?.response?.status ?? null,
    };
  }

  return {
    detail: message,
    message,
    status_code: error?.response?.status ?? null,
  };
}

const axiosOptions = {
  baseURL: CONFIG.serverUrl,
  timeout: 20000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
};

const axiosInstance = axios.create(axiosOptions);
export const axiosInstanceBase = axios.create(axiosOptions);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeRequestError(error))
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    const res = await axiosInstance.get(url, { ...config });

    return res.data;
  } catch (error) {
    const normalizedError = normalizeRequestError(error);

    console.error('Failed to fetch:', normalizedError.message, normalizedError, {
      url: Array.isArray(args) ? args[0] : args,
      config: Array.isArray(args) ? args[1] : undefined,
      originalError: error,
    });
    throw normalizedError;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  ip: '/api/device_ip/',
  companyInfo: '/api/company-info/',
  salary: {
    list: '/api/salaries/',
    byId: (id) => `/api/salaries/?employee_id=${id}`,
    update: (id) => `/api/salaries/${id}/`,
  },
  auth: {
    me: '/api/auth/users/me/',
    create: '/api/auth/users/',
    filterByRole: (role1, role2) => `/api/auth/users/?role=${role1}&role=${role2}`,
    updatePassword: (id) => `/api/auth/users/${id}/`,
    signIn: '/api/auth/jwt/create/',
    refresh: '/api/auth/jwt/refresh/',
    updateUser: (id) => `/api/update-user/${id}/`,
    requestPasswordReset: '/api/auth/users/reset_password/',
    resetPasswordConfirm: '/api/auth/users/reset_password_confirm/',
    setPassword: '/api/auth/users/set_password/',
    setUsername: '/api/auth/users/set_username/',
    simpleUsers: '/api/simple-user/',
  },
  beneficiaries: {
    // Endpoints for Beneficiaries Database sub module
    beneficiaries_database: '/api/beneficiary/',
    simple_beneficiaries: '/api/simple-beneficiaries/',
    simple_projects: '/api/simple-project/',
    beneficiary_by_id: (id) => `/api/beneficiary/${id}/`,
    beneficiary_summary: '/api/beneficiary/summary/',
    // Endpoints for Service Delivery sub module
    services_received_history: '/api/services_received_history/',
    service_delivery: '/api/service_deliveries/',
    service_delivery_summary: '/api/service_deliveries/summary/',
    // Endpoints for Case Management sub module
    case_management: '/api/case_files/',
    case_summary: '/api/case_files/summary/',
    // Endpoints for Vulnerability Assessment sub module
    vulnerability_assessment: '/api/assessments/',
    vulnerability_assessment_summary: '/api/assessments/summary/',
    // Endpoints for Impact Measurement sub module
    impact_measurement: '/api/impact_measurements/',
    impact_measurement_summary: '/api/impact_measurements/summary/',
    outcome_indicators: '/api/outcome_indicators/',
    // Endpoints for Household Profiling sub module
    household_profiling: '/api/households/',
    household_profiling_summary: '/api/households/summary/',
    // Endpoints for Referral Management sub module
    referral_management: '/api/referrals/',
    referral_summary: '/api/referrals/summary/',
    // Endpoints for Service Categories
    service_categories: '/api/service_categories/',
    vulnerability_types: '/api/vulnerability_types/',
    // Endpoints for Complaints & Feedback sub module
    complaints_feedback: '/api/complaint_feedback/',
    complaints_feedback_summary: '/api/complaint_feedback/summary/',
    // Endpoints for Exit & Graduation sub module
    exit_graduation: '/api/exit_graduations/',
    exit_graduation_summary: '/api/exit_graduations/summary/',
    // Graduation Criteria
    graduation_criteria: '/api/graduation_criteria/',
    programs: '/api/projects/',
    // Alumni Tracking
    alumni_tracking: '/api/alumni_tracking/',
    // Protection Cases
    protection_cases: '/api/protection_cases/',
    // Consent Records
    consent_records: '/api/consent_records/',
    // Safeguarding Incidents
    safeguarding_incidents: '/api/safeguarding_incidents/',
    // Targeting Criteria
    targeting_criteria: '/api/targeting_criteria/',
    // Needs Assessments
    needs_assessments: '/api/needs_assessments/',
    // Distribution Plans
    distribution_plans: '/api/distribution_plans/',
    // Service Calendar
    service_calendar: '/api/service_calendar/',
    // Case Worker Assignments
    case_worker_assignments: '/api/case_worker_assignments/',
    // Follow-Up Schedules
    follow_up_schedules: '/api/follow_up_schedules/',
    // Satisfaction Surveys
    satisfaction_surveys: '/api/satisfaction_surveys/',
    // Grievance Redressal
    grievance_records: '/api/grievance_records/',
    // Progress Tracking
    progress_tracking: '/api/progress_tracking/',
    // Duplicate Records
    duplicate_records: '/api/duplicate_records/',
    // Donor Reports
    donor_reports: '/api/donor_reports/',
    // Donors
    donors: '/api/donors/',
    donorById: (id) => `/api/donors/${id}/`,
    // Attendance Tracker
    attendance_tracker: '/api/attendance_tracker/',
    // Household Surveys
    household_surveys: '/api/household_surveys/',
    // Eligibility Screening
    eligibility_screening: '/api/eligibility_screening/',
    // Referral Network Partners
    referral_network: '/api/referral_network/',
    // Coverage Areas
    coverage_areas: '/api/coverage_areas/',
    // Beneficiary Settings
    beneficiary_settings: '/api/beneficiary_settings/',
    // Dashboard KPIs
    beneficiary_dashboard_kpis: '/api/beneficiary-dashboard-kpis/',
    // Demographics
    beneficiary_demographics: '/api/beneficiary-demographics/',
    // Analytics (derived from beneficiary summary)
    beneficiary_analytics: '/api/beneficiary-analytics/',
  },
  projects: {
    projects: '/api/projects/',
    projectById: (id) => `/api/projects/${id}/`,
    simple_projects: '/api/simple-project/',
  },
  projectManagements: {
    dashboard: '/api/ngo-project-dashboard/',
    projects: '/api/ngo-projects/',
    projectById: (id) => `/api/ngo-projects/${id}/`,
    exportProjectRoadmapExcel: (id) => `/api/ngo-projects/${id}/export-roadmap-excel/`,
    units: '/api/ngo-project-units/',
    unitById: (id) => `/api/ngo-project-units/${id}/`,
    projectOverview: '/api/ngo-projects/overview/',
    projectOptions: '/api/ngo-projects/options/',
    plans: '/api/ngo-project-plans/',
    planById: (id) => `/api/ngo-project-plans/${id}/`,
    approvePlan: (id) => `/api/ngo-project-plans/${id}/approve/`,
    workItems: '/api/ngo-project-plan-work-items/',
    workItemById: (id) => `/api/ngo-project-plan-work-items/${id}/`,
    approveWorkItem: (id) => `/api/ngo-project-plan-work-items/${id}/approve/`,
    attachments: '/api/ngo-project-plan-attachments/',
    attachmentById: (id) => `/api/ngo-project-plan-attachments/${id}/`,
    expenses: '/api/ngo-project-expenses/',
    expenseAdvances: '/api/ngo-project-advances/',
    expenseById: (id) => `/api/ngo-project-expenses/${id}/`,
    transitionExpense: (id) => `/api/ngo-project-expenses/${id}/transition/`,
    exportExpensePdf: (id) => `/api/ngo-project-expenses/${id}/export-pdf/`,
    exportExpenseExcel: (id) => `/api/ngo-project-expenses/${id}/export-excel/`,
    exportExpensesExcel: '/api/ngo-project-expenses/export-excel/',
    donors: '/api/donors/',
    donorById: (id) => `/api/donors/${id}/`,
    donorLedgers: '/api/donor-ledgers/',
    donorLedgerById: (id) => `/api/donor-ledgers/${id}/`,
  },
  storeInventory: {
    // Core - Items & Products
    items: '/api/items/',
    item_by_id: (id) => `/api/items/${id}/`,
    itemMaster_pagination: (page) => `/api/items/?page=${page}&pagination=true`,
    item_summary: '/api/item_summary/',
    item_category: '/api/categories/',
    item_category_by_id: (id) => `/api/categories/${id}/`,
    products: '/api/products/',
    product_by_id: (id) => `/api/products/${id}/`,
    product_images: (id) => `/api/products/${id}/images/`,
    uom: '/api/uom/',
    uom_by_id: (id) => `/api/uom/${id}/`,

    // Product extras
    product_variants: '/api/product-variants/',
    product_variant_by_id: (id) => `/api/product-variants/${id}/`,
    packaging_types: '/api/packaging-types/',
    packaging_type_by_id: (id) => `/api/packaging-types/${id}/`,
    product_templates: '/api/product-templates/',
    product_template_by_id: (id) => `/api/product-templates/${id}/`,

    // Warehouses & Locations
    warehouses: '/api/warehouses/',
    warehouse_by_id: (id) => `/api/warehouses/${id}/`,
    storage_locations: '/api/storage-locations/',
    storage_location_by_id: (id) => `/api/storage-locations/${id}/`,
    putaway_rules: '/api/putaway-rules/',
    putaway_rule_by_id: (id) => `/api/putaway-rules/${id}/`,
    removal_strategies: '/api/removal-strategies/',
    removal_strategy_by_id: (id) => `/api/removal-strategies/${id}/`,
    operation_types: '/api/operation-types/',
    operation_type_by_id: (id) => `/api/operation-types/${id}/`,
    routes: '/api/routes/',
    route_by_id: (id) => `/api/routes/${id}/`,
    shipping_methods: '/api/shipping-methods/',
    shipping_method_by_id: (id) => `/api/shipping-methods/${id}/`,

    // Operations
    grn: '/api/inventory-grn/',
    grn_by_id: (id) => `/api/inventory-grn/${id}/`,
    backorders: '/api/backorders/',
    backorder_by_id: (id) => `/api/backorders/${id}/`,
    gin: '/api/gin/',
    gin_by_id: (id) => `/api/gin/${id}/`,
    gin_approve: (id) => `/api/gin/${id}/approve/`,
    gin_issue: (id) => `/api/gin/${id}/issue/`,
    stock_adjustment_approval_matrix:
      '/api/approval-matrix/?type=inventory&module=stock_adjustment',
    stock_adjustment_approve: (id) => `/api/stock-adjustments/${id}/approve/`,
    dropshipping: '/api/dropshipping/',
    dropshipping_by_id: (id) => `/api/dropshipping/${id}/`,
    batch_transfers: '/api/batch-transfers/',
    batch_transfer_by_id: (id) => `/api/batch-transfers/${id}/`,
    cross_docking: '/api/cross-docking/',
    cross_docking_by_id: (id) => `/api/cross-docking/${id}/`,
    stock_transfers: '/api/stock-transfers/',
    stock_transfer_by_id: (id) => `/api/stock-transfers/${id}/`,
    internal_transfers: '/api/internal-transfers/',
    internal_transfer_by_id: (id) => `/api/internal-transfers/${id}/`,
    internal_transfer_change_status: (id) => `/api/internal-transfers/${id}/change-status/`,
    internal_transfer_approve: (id) => `/api/internal-transfers/${id}/approve/`,
    internal_transfer_back_receive: (id) => `/api/internal-transfers/${id}/back-receive/`,
    stock_adjustments: '/api/stock-adjustments/',
    stock_adjustment_by_id: (id) => `/api/stock-adjustments/${id}/`,
    stock_in_batch: '/api/stock-in/',
    cycle_counts: '/api/cycle-counts/',
    cycle_count_by_id: (id) => `/api/cycle-counts/${id}/`,
    stock_moves: '/api/stock-moves/',
    stock_move_by_id: (id) => `/api/stock-moves/${id}/`,
    lot_serials: '/api/lot-serials/',
    lot_serial_by_id: (id) => `/api/lot-serials/${id}/`,

    // Quality
    quality_checks: '/api/quality-checks/',
    quality_check_by_id: (id) => `/api/quality-checks/${id}/`,
    quality_alerts: '/api/quality-alerts/',
    quality_alert_by_id: (id) => `/api/quality-alerts/${id}/`,
    quality_control_points: '/api/quality-control-points/',
    quality_control_point_by_id: (id) => `/api/quality-control-points/${id}/`,
    quality_teams: '/api/quality-teams/',
    quality_team_by_id: (id) => `/api/quality-teams/${id}/`,
    qc_templates: '/api/qc-templates/',
    qc_template_by_id: (id) => `/api/qc-templates/${id}/`,

    // Valuation
    inventory_valuations: '/api/inventory-valuations/',
    landed_costs: '/api/landed-costs/',
    landed_cost_by_id: (id) => `/api/landed-costs/${id}/`,

    // Scrap & Returns
    scrap_records: '/api/scrap-records/',
    scrap_record_by_id: (id) => `/api/scrap-records/${id}/`,
    return_records: '/api/return-records/',
    return_record_by_id: (id) => `/api/return-records/${id}/`,

    // Return Management
    return_management: '/api/returns/',
    return_management_by_id: (id) => `/api/returns/${id}/`,
    return_management_submit: (id) => `/api/returns/${id}/submit/`,
    return_management_dispatch: (id) => `/api/returns/${id}/dispatch/`,
    return_management_receive: (id) => `/api/returns/${id}/receive/`,
    return_management_cancel: (id) => `/api/returns/${id}/cancel/`,
    return_lines: '/api/return-lines/',
    return_damage_histories: '/api/return-damage-histories/',

    // Reorder & BOM
    reorder_rules: '/api/reorder-rules/',
    reorder_rule_by_id: (id) => `/api/reorder-rules/${id}/`,
    replenishments: '/api/replenishments/',
    replenishment_by_id: (id) => `/api/replenishments/${id}/`,
    kitting_bom: '/api/kitting-bom/',
    kitting_bom_by_id: (id) => `/api/kitting-bom/${id}/`,

    // NGO Operations
    donor_funded_inventory: '/api/donor-funded-inventory/',
    donor_funded_by_id: (id) => `/api/donor-funded-inventory/${id}/`,
    field_distributions: '/api/field-distributions/',
    field_distribution_by_id: (id) => `/api/field-distributions/${id}/`,
    loss_damage_claims: '/api/loss-damage-claims/',
    loss_damage_claim_by_id: (id) => `/api/loss-damage-claims/${id}/`,
    emergency_reserves: '/api/emergency-reserves/',
    emergency_reserve_by_id: (id) => `/api/emergency-reserves/${id}/`,
    commodity_tracking: '/api/commodity-tracking/',
    commodity_tracking_by_id: (id) => `/api/commodity-tracking/${id}/`,
    pipeline_tracking: '/api/pipeline-tracking/',
    pipeline_tracking_by_id: (id) => `/api/pipeline-tracking/${id}/`,
    customs_import_tracking: '/api/customs-import-tracking/',
    customs_import_tracking_by_id: (id) => `/api/customs-import-tracking/${id}/`,
    humanitarian_kits: '/api/humanitarian-kits/',
    humanitarian_kit_by_id: (id) => `/api/humanitarian-kits/${id}/`,
    disposal_records: '/api/disposal-records/',
    disposal_record_by_id: (id) => `/api/disposal-records/${id}/`,
    vehicle_dispatches: '/api/vehicle-dispatches/',
    vehicle_dispatch_by_id: (id) => `/api/vehicle-dispatches/${id}/`,
    beneficiary_distribution_lists: '/api/beneficiary-distribution-lists/',
    beneficiary_distribution_list_by_id: (id) => `/api/beneficiary-distribution-lists/${id}/`,
    waybills: '/api/waybills/',
    waybill_by_id: (id) => `/api/waybills/${id}/`,
    field_warehouses: '/api/field-warehouses/',
    field_warehouse_by_id: (id) => `/api/field-warehouses/${id}/`,

    // Reports
    inventory_log: '/api/inventory-log/',
    inventory_log_analytics: '/api/inventory-log/analytics/',
    inventory_log_history: '/api/inventory-log/history/',
    abc_analysis: '/api/abc-analysis/',
    forecasted_stock: '/api/forecasted-stock/',
    stock_aging: '/api/stock-aging/',

    // Settings & Dashboard
    inventory_settings: '/api/inventory-settings/',
    inventory_approval_matrix: '/api/approval-matrix/?type=inventory',
    inventory_approval_matrix_create: '/api/approval-matrix/',
    inventory_approval_matrix_by_id: (id) => `/api/approval-matrix/${id}/`,
    inventory_approval_matrix_form_options: '/api/approval-matrix/form-options/',
    // Approval Workflow (standalone new module)
    approval_workflows: '/api/approval-workflows/',
    approval_workflow_by_id: (id) => `/api/approval-workflows/${id}/`,
    approval_workflow_form_options: '/api/approval-workflows/form-options/',
    approval_workflow_toggle_status: (id) => `/api/approval-workflows/${id}/toggle-status/`,
    workflow_users: '/api/workflow-users/',
    dashboard_kpi: '/api/dashboard-kpi/',
    inventory_dashboard_overview: '/api/inventory-dashboard/overview/',
    inventory_office_item_counts: '/api/inventory-dashboard/office-item-counts/',
    inventory_office_stock_detail: '/api/inventory-dashboard/office-stock-detail/',
    location_stocks: '/api/location-stocks/',
    location_stock_by_id: (id) => `/api/location-stocks/${id}/`,

    // Procurement suppliers (backward compat)
    supplier: '/api/supplier/',
    supplier_by_id: (id) => `/api/supplier/${id}/`,
    vendors: '/api/vendors/',
    vendor_by_id: (id) => `/api/vendors/${id}/`,
  },
  procurement: {
    suppliers: '/api/supplier/',
    supplier_by_id: (id) => `/api/supplier/${id}/`,
    supplier_summary: '/api/supplier_summary/',
    purchase_requisitions: '/api/purchase_requisition/',
    purchase_requisition_by_id: (id) => `/api/purchase_requisition/${id}/`,
    items_for_requisition: '/api/item_pr/',
    purchase_requisition_summary: '/api/pr_summary/',
    purchase_orders: '/api/purchase_order/',
    purchase_order_by_id: (id) => `/api/purchase_order/${id}/`,
    purchase_order_summary: '/api/po_summary/',
    items_for_order: '/api/item_po/',
    request_for_quotation: '/api/rfq/',
    request_for_quotation_by_id: (id) => `/api/rfq/${id}/`,
  },
  procurement_management: {
    // Material Requisitions (New endpoints for procurement module)
    requisitions: '/api/material_requisitions/',
    requisitionById: (id) => `/api/material_requisitions/${id}/`,
    requisitionsFormOptions: '/api/material_requisitions/form-options/',
    requisitionsStats: '/api/material_requisitions/stats/',
    requisitionsChangeStatus: (id) => `/api/material_requisitions/${id}/change-status/`,
    donors: '/api/donor_reports/',

    // Material Requisitions (Legacy)
    material_requisitions: '/api/material_requisitions/',
    material_requisitions_by_id: (id) => `/api/material_requisitions/${id}/`,
    material_requisitions_stats: '/api/material_requisitions/stats/',
    material_requisitions_form_options: '/api/material_requisitions/form-options/',
    material_requisitions_change_status: (id) => `/api/material_requisitions/${id}/change-status/`,
    material_items: '/api/material_items/',
    material_items_by_id: (id) => `/api/material_items/${id}/`,
    office_locations: '/api/office_location/',
    office_management: '/api/office_management/',
    office_management_by_id: (id) => `/api/office_management/${id}/`,
    office_staff: '/api/office_staff/',
    office_warehouse: '/api/warehouse/',
    budgets: '/api/budgets/',
    accounts: '/api/accounts/',
    account_codes: '/api/accounts/',
    material_categories: '/api/rfq-category/',
    inventory_items: '/api/material_items/',

    // RFQ
    rfqs: '/api/rfq/',
    rfq_invitations: '/api/rfq_invitation/',

    rfq_by_id: (id) => `/api/rfq/${id}/`,
    rfq_summary: '/api/rfq/summary/',
    rfq_change_status: (id) => `/api/rfq/${id}/change-status/`,
    rfq_categories: '/api/rfq-category/',
    rfq_category_by_id: (id) => `/api/rfq-category/${id}/`,
    rfq_attachments: '/api/rfq_attachments/',

    // Quotations
    quotations: '/api/quotations/',
    quotation_by_id: (id) => `/api/quotations/${id}/`,
    quotation_summary: '/api/quotations/summary/',
    quotation_validation: '/api/quotations/simple-quotation-validation/',
    quotation_items: '/api/quotation-items/',
    quotation_item_by_id: (id) => `/api/quotation-items/${id}/`,
    quotation_openings: '/api/quotation-openings/',
    quotation_opening_by_id: (id) => `/api/quotation-openings/${id}/`,
    vendor_rfq_submissions: '/api/vendor-rfq-submission/',
    vendor_rfq_submission_by_id: (id) => `/api/vendor-rfq-submission/${id}/`,
    vendor_rfq_submission_delete_document: (id, docId) =>
      `/api/vendor-rfq-submission/${id}/documents/${docId}/`,
    quotation_direct_evaluation: '/api/quotations/direct-evaluation/',

    // Comparative Statements
    comparative_statements: '/api/comparative_statements/',
    comparative_statement_by_id: (id) => `/api/comparative_statements/${id}/`,
    comparative_statement_summary: '/api/comparative_statements/summary/',
    comparative_line_items: '/api/comparative_line_items/',
    comparative_line_item_by_id: (id) => `/api/comparative_line_items/${id}/`,

    // Awards
    awards: '/api/awards/',
    award_by_id: (id) => `/api/awards/${id}/`,
    award_summary: '/api/awards/summary/',
    award_history: '/api/awards/history/',
    award_notifications: '/api/award-notifications/',
    award_notification_by_id: (id) => `/api/award-notifications/${id}/`,
    accepted_awards: '/api/awards/?acceptanceStatus=accepted',

    // Work Orders
    work_orders: '/api/work-orders/',
    work_orders_lean: '/api/work-orders/lean/',
    work_order_by_id: (id) => `/api/work-orders/${id}/`,
    work_order_full: (id) => `/api/work-orders/${id}/full/`,
    work_order_summary: '/api/work-orders/summary/',
    work_order_approve: (id) => `/api/work-orders/${id}/approve/`,
    work_order_reject: (id) => `/api/work-orders/${id}/reject/`,
    work_order_send_to_vendor: (id) => `/api/work-orders/${id}/send-to-vendor/`,
    work_order_download_pdf: (id) => `/api/work-orders/${id}/download-pdf/`,
    work_order_download_documents: (id) => `/api/work-orders/${id}/download-documents/`,
    work_order_attachments: '/api/work-order-attachments/',
    work_order_attachment_by_id: (id) => `/api/work-order-attachments/${id}/`,
    work_order_items: '/api/work-order-items/',
    work_order_item_by_id: (id) => `/api/work-order-items/${id}/`,
    vendor_acceptances: '/api/vendor-acceptances/',
    vendor_acceptance_by_id: (id) => `/api/vendor-acceptances/${id}/`,

    // Users (for approver selection)
    aprover_user: '/api/aprover_user/',
    simple_users: '/api/simple-user/',

    // Direct Purchase
    direct_purchases: '/api/direct-purchases/',
    direct_purchase_by_id: (id) => `/api/direct-purchases/${id}/`,
    direct_purchase_summary: '/api/direct-purchases/summary/',
    direct_purchase_approve: (id) => `/api/direct-purchases/${id}/approve/`,
    direct_purchase_reject: (id) => `/api/direct-purchases/${id}/reject/`,
    direct_purchase_items: '/api/direct-purchase-items/',
    shops: '/api/shops/',
    direct_purchase_item_by_id: (id) => `/api/direct-purchase-items/${id}/`,

    // GRN
    grns: '/api/grn/',
    grn_by_id: (id) => `/api/grn/${id}/`,
    grn_summary: '/api/grn/summary/',
    grn_items: '/api/grn-items/',
    grn_item_by_id: (id) => `/api/grn-items/${id}/`,
    grn_verifications: '/api/grn-verifications/',
    grn_verification_by_id: (id) => `/api/grn-verifications/${id}/`,

    // Payment Requisitions
    payment_requisitions: '/api/payment-requisitions/',
    payment_requisition_by_id: (id) => `/api/payment-requisitions/${id}/`,
    payment_requisition_summary: '/api/payment-requisitions/summary/',
    payment_requisition_items: '/api/payment-requisition-items/',
    payment_requisition_item_by_id: (id) => `/api/payment-requisition-items/${id}/`,

    // Treasury
    treasury: '/api/treasury/',
    treasury_by_id: (id) => `/api/treasury/${id}/`,
    treasury_finance_review: '/api/treasury/finance-review/',
    treasury_analytics: '/api/treasury/analytics/',
    treasury_summary: '/api/treasury/analytics/',
    payment_records: '/api/payment-records/',
    payment_record_by_id: (id) => `/api/payment-records/${id}/`,
    payment_timelines: '/api/payment-timelines/',
    payment_timeline_by_id: (id) => `/api/payment-timelines/${id}/`,

    // Vendors
    suppliers: '/api/supplier/',
    supplier_by_id: (id) => `/api/supplier/${id}/`,
    vendors: '/api/supplier/',
    vendor_by_id: (id) => `/api/supplier/${id}/`,
    vendor_categories: '/api/vendor-categories/',
    vendor_category_by_id: (id) => `/api/vendor-categories/${id}/`,
    vendor_category_mappings: '/api/vendor-category-mappings/',
    vendor_category_mapping_by_id: (id) => `/api/vendor-category-mappings/${id}/`,
    vendor_evaluations: '/api/vendor-evaluations/',
    vendor_evaluation_by_id: (id) => `/api/vendor-evaluations/${id}/`,
    vendor_onboardings: '/api/vendor-onboardings/',
    vendor_onboarding_by_id: (id) => `/api/vendor-onboardings/${id}/`,
    vendor_verifications: '/api/vendor-verifications/',
    vendor_verification_by_id: (id) => `/api/vendor-verifications/${id}/`,
    vendor_verification_approve: (id) => `/api/vendor-verifications/${id}/approve/`,
    vendor_verification_reject: (id) => `/api/vendor-verifications/${id}/reject/`,
    vendor_verification_prefill: (id) => `/api/vendor-verifications/${id}/prefill-user/`,
    vendor_verification_summary: '/api/vendor-verifications/summary/',
    vendor_performance: '/api/vendor-performance/',
    vendor_performance_by_id: (id) => `/api/vendor-performance/${id}/`,
    vendor_performance_summary: '/api/vendor-performance/summary/',
    // Vendor Management (full CRUD)
    // vendor_management: '/api/vendor-management/',
    // vendor_management_by_id: (id) => `/api/vendor-management/${id}/`,
    vendor_management_summary: '/api/vendor-management/summary/',
    // Vendor Documents
    vendor_documents: '/api/vendor_documents/',
    vendor_document_by_id: (id) => `/api/vendor_documents/${id}/`,
    vendor_document_review: (id) => `/api/vendor_documents/${id}/`,
    // Vendor Blacklist
    vendor_blacklist: '/api/vendor-blacklist/',
    vendor_blacklist_by_id: (id) => `/api/vendor-blacklist/${id}/`,
    vendor_blacklist_summary: '/api/vendor-blacklist/summary/',
    // Vendor Enlistment
    vendor_enlistment: '/api/vendor-enlistment/',
    vendor_enlistment_by_id: (id) => `/api/vendor-enlistment/${id}/`,
    vendor_enlistment_summary: '/api/vendor-enlistment/summary/',
    vendor_enlistment_approve: (id) => `/api/vendor-enlistment/${id}/approve/`,
    vendor_enlistment_reject: (id) => `/api/vendor-enlistment/${id}/reject/`,
    // Vendor Profiles
    vendor_profiles: '/api/vendor-profiles/',
    vendor_profile_by_id: (id) => `/api/vendor-profiles/${id}/`,

    //  real vendoer managemetn
    item_category: '/api/categories/',
    vendors_management: '/api/vendors/',
    vendors_management_by_id: (id) => `/api/vendors/${id}/`,

    // Notifications
    procurement_notifications: '/api/procurement-notifications/',
    notifications: '/api/procurement-notifications/',
    procurement_notification_by_id: (id) => `/api/procurement-notifications/${id}/`,
    procurement_notifications_unread: '/api/procurement-notifications/unread-count/',
    procurement_notification_mark_read: (id) => `/api/procurement-notifications/${id}/mark-read/`,
    procurement_notifications_mark_all_read: '/api/procurement-notifications/mark-all-read/',

    // Settings
    approval_matrix: '/api/approval-matrix/?type=procurement',
    approval_matrix_by_id: (id) => `/api/approval-matrix/${id}/`,
    approval_matrix_form_options: '/api/approval-matrix/form-options/',
    account_categories: '/api/acc-categories/',
    account_category_by_id: (id) => `/api/acc-categories/${id}/`,
    budget_codes: '/api/budgets/',
    budget_code_by_id: (id) => `/api/budgets/${id}/`,

    // Approval Requests
    approval_requests: '/api/approval_request/',
    approval_request_by_id: (id) => `/api/approval_request/${id}/`,
    approval_history: '/api/approval_history/',
    approval_history_by_id: (id) => `/api/approval_history/${id}/`,
    email_templates: '/api/email-templates/',
    email_template_by_id: (id) => `/api/email-templates/${id}/`,
    procurement_roles: '/api/procurement-roles/',
    procurement_role_by_id: (id) => `/api/procurement-roles/${id}/`,
    procurement_user_roles: '/api/procurement-user-roles/',
    procurement_users: '/api/procurement-user-roles/',
    procurement_user_role_by_id: (id) => `/api/procurement-user-roles/${id}/`,
    notification_settings: '/api/notification-settings/',
    notification_setting_by_id: (id) => `/api/notification-settings/${id}/`,

    // Dashboard & Reports
    procurement_dashboard: '/api/pro_dashboard/',
    report_requisitions: '/api/reports/requisitions/',
    report_rfq: '/api/reports/rfq/',
    report_vendor_participation: '/api/reports/vendor-participation/',
    report_vendor_awards: '/api/reports/vendor-awards/',
    report_work_orders: '/api/reports/work-orders/',
    report_inventory_received: '/api/reports/inventory-received/',
    report_payment_status: '/api/reports/payment-status/',
    report_budget_utilization: '/api/reports/budget-utilization/',

    // Fiscal Year
    fiscal_years: '/api/fiscal-year/',
    fiscal_year_by_id: (id) => `/api/fiscal-year/${id}/`,
    fiscal_year_change_status: (id) => `/api/fiscal-year/${id}/change-status/`,
    fiscal_year_periods: (id) => `/api/fiscal-year/${id}/periods/`,
    accounting_periods: '/api/accounting-periods/',
    accounting_period_by_id: (id) => `/api/accounting-periods/${id}/`,
    accounting_period_close: (id) => `/api/accounting-periods/${id}/close/`,
    accounting_period_reopen: (id) => `/api/accounting-periods/${id}/reopen/`,

    // Currency & Exchange Rates
    currencies: '/api/currencies/',
    currency_by_id: (id) => `/api/currencies/${id}/`,
    currency_set_status: (id) => `/api/currencies/${id}/set-status/`,
    currency_rates: (id) => `/api/currencies/${id}/rates/`,
    exchange_rates: '/api/exchange-rates/',
    exchange_rate_by_id: (id) => `/api/exchange-rates/${id}/`,
    exchange_rates_bulk_update: '/api/exchange-rates/bulk-update/',
  },
  permission: {
    list: '/api/permissions/',
    byId: (id) => `/api/user-permissions/${id}/`,
    setById: (id) => `/api/set-user-permissions/${id}/`,
  },
  permissionGroup: {
    list: '/api/permission-groups/',
    byId: (id) => `/api/permission-groups/${id}/`,
  },
  employee: {
    list: '/api/employees/',
    simple: '/api/employees/simple/',
    details: (id) => `/api/employees/${id}/`,
    supervisor: '/api/supervisors/',
    employeeSupervisor: (id) => `/api/employee/${id}/supervisors/`,
  },
  settings: {
    user_management: '/api/user-management/',
    departments: '/api/departments/',
    departmentById: (id) => `/api/departments/${id}/`,
    designation: '/api/designations/',
    designationById: (id) => `/api/designations/${id}/`,
    branch: '/api/branches/',
    branchById: (id) => `/api/branches/${id}/`,
    grade: '/api/grades/',
    gradeById: (id) => `/api/grades/${id}/`,
    shift: '/api/shifts/',
    shiftById: (id) => `/api/shifts/${id}/`,
    shiftCreate: '/api/shifts/create',
    roles: '/api/user-roles/',
    roleById: (id) => `/api/user-roles/${id}/`,
    leaveGroup: '/api/leave-groups/',
    leaveGroupById: (id) => `/api/leave-groups/${id}/`,
    leavePolicy: '/api/leave-policies/',
    leavePolicyById: (id) => `/api/leave-policies/${id}/`,
    ipList: '/api/pre-approved-ip-list/',
    ipCreate: '/api/pre-approved-ip-create/',
    cutOff: '/api/cutoff-dates/',
    autoCutOff: '/api/auto-cutoff-dates/',
    cutOffById: (id) => `/api/cutoff-dates/${id}/`,
    ipById: (id) => `/api/pre-approved-ip-update-and-delete/${id}/`,
    supervisorLevel: '/api/supervisor-level-list-create/',
    supervisorLevelById: (id) => `/api/supervisor-level-list-create/${id}/`,
    employeeSupervisorLevel: (id) => `/api/employee/${id}/supervisors/`,
    resetPeriod: '/api/leave-reset-periods/',
    resetPeriodById: (id) => `/api/leave-reset-periods/${id}`,
    specialLeavePolicies: '/api/special-leave-policies/',
    specialLeavePoliciesById: (id) => `/api/special-leave-policies/${id}/`,
  },
  attendance: {
    list: '/api/attendance/?pagination=true',
    create: '/api/attendance-create/',
    report: '/api/attendance-report/',
    reportByEmployeeId: (id) => `/api/attendance-report/${id}`,
    reportByDate: (id, startDate, endDate) =>
      `/api/attendance-report/${id}/?start_date=${startDate}&end_date=${endDate}`,
    reportBySupervisor: (id) => `/api/attendance-report/?supervisor=${id}`,
    reportWithSupervisor: (id) => `/api/attendance-report/${id}/?include_supervised=true`,
    byEmployeeId: (id) => `/api/attendance/${id}/?pagination=true`,
    updateDelete: (id) => `/api/attendance-update-delete/${id}/`,
    adjustment: '/api/attendance-adjustment-create/',
    shift: '/api/attendance-for-adjustment/',
    adjustmentUpdate: (id) => `/api/attendance-adjustment-update/${id}/`,
    approval: '/api/attendance_approval_list/',
    approvalBySupervisor: (id) => `/api/attendance_approval_list/?approver_id=${id}`,
    approvalByEmployee: (id) => `/api/attendance_approval_list/?user_id=${id}`,
    approvalById: (id) => `/api/attendance_approval_update/${id}/`,
    updateApproval: (id) => `/api/attendance_approval_update/${id}/`,
    timestamps: (employeeId, date) => `/api/attendance/${employeeId}/?date=${date}`,
    // attendance filter params
    // ?on_leave=true
    // ?absent=true
    // ?present=true
    // ?early_out=true
    // ?late_in=true
  },
  holiday: {
    list: '/api/holidays/',
    details: (id) => `/api/holidays/${id}/`,
  },
  leave: {
    policiesByEmployee: (employeeId) => `/api/employees/${employeeId}/leave-policies/`,
    request: '/api/leave-requests/',
    requestById: (id) => `/api/leave-requests/${id}/`,
    requestByEmployeeId: (employeeId) => `/api/employees/${employeeId}/leave-requests/`,
    requestBySupervisor: (supervisorId) =>
      `api/employees/${supervisorId}/leave-requests/?include_subordinates=true`,
    approval: '/api/leave-approval/',
    approvalByEmployee: (employeeId) => `/api/leave-approval/?approver_id=${employeeId}`,
    approvalByRequestId: (id) => `/api/leave-approval/?leave_request_id=${id}`,
    approvalById: (id) => `/api/leave-approval/${id}/`,
    balance: '/api/leave-balance/',
    balanceByYear: (employeeId, year) => `/api/leave-balance/${employeeId}/?year=${year}`,
    balanceBySupervisor: (supervisorId) =>
      `/api/leave-balance/${supervisorId}/?include_subordinates=true`,
    compensatory: (employeeId, fromDate) =>
      `/api/compensatory-leave/?employee_id=${employeeId}&from_date=${fromDate}`,
  },
  notification: {
    list: '/api/notifications/?pagination=true',
    byUser: (id) => `/api/notifications/?pagination=true&receiver=${id}`,
    byId: (id) => `/api/notifications/${id}/`,
    markAllAsRead: '/api/notifications/mark-all-read/',
  },
  dashboard: {
    all: (startDate, endDate) => `/api/dashboard/?start_date=${startDate}&end_date=${endDate}`,
    byEmployee: (employeeId, startDate, endDate) =>
      `/api/dashboard/employee/${employeeId}/?start_date=${startDate}&end_date=${endDate}`,
    bySupervisor: (supervisorId, startDate, endDate) =>
      `/api/dashboard/supervisor/${supervisorId}/?start_date=${startDate}&end_date=${endDate}`,
  },
  payroll: {
    generate: '/api/payrolls/generate/',
    list: '/api/payrolls/',
    details: (id) => `/api/payrolls/${id}/`,
    lock: '/api/payrolls/lock/',
  },
  todo: {
    root: '/api/todo/todo/',
    list: '/api/todo/todo/',
    summary: '/api/todo/todo/summary/',
    users: '/api/todo/todo/users/',
    byId: (id) => `/api/todo/todo/${id}/`,
    attachments: (id) => `/api/todo/todo/${id}/attachments/`,
    attachmentById: (id, attachmentId) => `/api/todo/todo/${id}/attachments/${attachmentId}/`,
  },

  meetingManagement: {
    meetings: '/api/meeting_management/meetings/',
    meetingById: (id) => `/api/meeting_management/meetings/${id}/`,
    attachments: (meetingId) => `/api/meeting_management/meetings/${meetingId}/attachments/`,
  },

  projectManagementAdvances: {
    list: '/api/ngo-project-advances/',
    detail: (id) => `/api/ngo-project-advances/${id}/`,
  },
  projectManagementsProjects: '/api/ngo-projects/',

  // ── CRM (Leads Management) ──
  crm: {
    leads: '/api/crm/leads/',
    leadById: (id) => `/api/crm/leads/${id}/`,
    followUps: (leadId) => `/api/crm/leads/${leadId}/followups/`,
    followUpById: (leadId, id) => `/api/crm/leads/${leadId}/followups/${id}/`,
  },

  // ── Project Management (ClickUp-style) ──
  pm: {
    // Core Projects (NGO)
    projects: '/api/projects/',
    projectById: (id) => `/api/projects/${id}/`,
    project_activities: '/api/project-activities/',
    project_activity_by_id: (id) => `/api/project-activities/${id}/`,

    // Workspaces
    workspaces: '/api/pm-workspaces/',
    workspace_by_id: (id) => `/api/pm-workspaces/${id}/`,
    workspace_members: '/api/pm-workspace-members/',
    workspace_member_by_id: (id) => `/api/pm-workspace-members/${id}/`,
    workspace_add_member: (id) => `/api/pm-workspaces/${id}/add-member/`,
    workspace_remove_member: (id) => `/api/pm-workspaces/${id}/remove-member/`,

    // Spaces
    spaces: '/api/pm-spaces/',
    space_by_id: (id) => `/api/pm-spaces/${id}/`,
    space_members: '/api/pm-space-members/',
    space_member_by_id: (id) => `/api/pm-space-members/${id}/`,
    space_add_member: (id) => `/api/pm-spaces/${id}/add-member/`,
    space_remove_member: (id) => `/api/pm-spaces/${id}/remove-member/`,

    // Lists
    lists: '/api/pm-lists/',
    list_by_id: (id) => `/api/pm-lists/${id}/`,

    // Statuses
    status_groups: '/api/pm-status-groups/',
    status_group_by_id: (id) => `/api/pm-status-groups/${id}/`,
    statuses: '/api/pm-statuses/',
    status_by_id: (id) => `/api/pm-statuses/${id}/`,

    // Tasks
    tasks: '/api/pm-tasks/',
    task_by_id: (id) => `/api/pm-tasks/${id}/`,
    task_move: (id) => `/api/pm-tasks/${id}/move/`,
    task_bulk_update: '/api/pm-tasks/bulk-update/',
    task_quick_add: '/api/pm-tasks/quick-add/',
    my_tasks: '/api/pm-tasks/my-tasks/',
    task_stats: '/api/pm-tasks/stats/',

    // Task sub-resources
    task_assignees: '/api/pm-task-assignees/',
    task_assignee_by_id: (id) => `/api/pm-task-assignees/${id}/`,
    task_watchers: '/api/pm-task-watchers/',
    task_watcher_by_id: (id) => `/api/pm-task-watchers/${id}/`,
    task_dependencies: '/api/pm-task-dependencies/',
    task_dependency_by_id: (id) => `/api/pm-task-dependencies/${id}/`,
    subtasks: '/api/pm-subtasks/',
    subtask_by_id: (id) => `/api/pm-subtasks/${id}/`,
    checklists: '/api/pm-checklists/',
    checklist_by_id: (id) => `/api/pm-checklists/${id}/`,
    checklist_items: '/api/pm-checklist-items/',
    checklist_item_by_id: (id) => `/api/pm-checklist-items/${id}/`,
    checklist_item_toggle: (id) => `/api/pm-checklist-items/${id}/toggle/`,
    task_attachments: '/api/pm-task-attachments/',
    task_attachment_by_id: (id) => `/api/pm-task-attachments/${id}/`,
    task_comments: '/api/pm-task-comments/',
    task_comment_by_id: (id) => `/api/pm-task-comments/${id}/`,
    task_activity_logs: '/api/pm-task-activity-logs/',

    // Tags
    tags: '/api/pm-tags/',
    tag_by_id: (id) => `/api/pm-tags/${id}/`,
    task_tags: '/api/pm-task-tags/',
    task_tag_by_id: (id) => `/api/pm-task-tags/${id}/`,

    // Sprints
    sprints: '/api/pm-sprints/',
    sprint_by_id: (id) => `/api/pm-sprints/${id}/`,
    sprint_start: (id) => `/api/pm-sprints/${id}/start/`,
    sprint_complete: (id) => `/api/pm-sprints/${id}/complete/`,
    sprint_add_task: (id) => `/api/pm-sprints/${id}/add-task/`,
    sprint_remove_task: (id) => `/api/pm-sprints/${id}/remove-task/`,
    sprint_burndown: (id) => `/api/pm-sprints/${id}/burndown/`,
    sprint_retrospective: (id) => `/api/pm-sprints/${id}/retrospective/`,
    sprint_tasks: '/api/pm-sprint-tasks/',

    // Milestones
    milestones: '/api/pm-milestones/',
    milestone_by_id: (id) => `/api/pm-milestones/${id}/`,
    milestone_add_task: (id) => `/api/pm-milestones/${id}/add-task/`,
    milestone_remove_task: (id) => `/api/pm-milestones/${id}/remove-task/`,

    // Goals
    goals: '/api/pm-goals/',
    goal_by_id: (id) => `/api/pm-goals/${id}/`,
    goal_update_progress: (id) => `/api/pm-goals/${id}/update-progress/`,
    key_results: '/api/pm-key-results/',
    key_result_by_id: (id) => `/api/pm-key-results/${id}/`,
    key_result_update_progress: (id) => `/api/pm-key-results/${id}/update-progress/`,

    // Time Tracking
    time_entries: '/api/pm-time-entries/',
    time_entry_by_id: (id) => `/api/pm-time-entries/${id}/`,
    time_start_timer: '/api/pm-time-entries/start-timer/',
    time_stop_timer: '/api/pm-time-entries/stop-timer/',
    time_my_entries: '/api/pm-time-entries/my-entries/',
    time_timesheets: '/api/pm-time-entries/timesheets/',
    time_reports: '/api/pm-time-entries/reports/',
    time_workload: '/api/pm-time-entries/workload/',

    // Docs
    docs: '/api/pm-docs/',
    doc_by_id: (id) => `/api/pm-docs/${id}/`,

    // Custom Fields
    custom_fields: '/api/pm-custom-fields/',
    custom_field_by_id: (id) => `/api/pm-custom-fields/${id}/`,
    custom_field_options: '/api/pm-custom-field-options/',
    custom_field_option_by_id: (id) => `/api/pm-custom-field-options/${id}/`,
    task_custom_field_values: '/api/pm-task-custom-field-values/',
    task_custom_field_value_by_id: (id) => `/api/pm-task-custom-field-values/${id}/`,

    // Automations
    automations: '/api/pm-automations/',
    automation_by_id: (id) => `/api/pm-automations/${id}/`,
    automation_toggle: (id) => `/api/pm-automations/${id}/toggle/`,
    automation_logs_action: (id) => `/api/pm-automations/${id}/logs/`,
    automation_actions: '/api/pm-automation-actions/',
    automation_action_by_id: (id) => `/api/pm-automation-actions/${id}/`,
    automation_logs: '/api/pm-automation-logs/',

    // Saved Views
    saved_views: '/api/pm-saved-views/',
    saved_view_by_id: (id) => `/api/pm-saved-views/${id}/`,

    // Templates
    templates: '/api/pm-templates/',
    template_by_id: (id) => `/api/pm-templates/${id}/`,
    template_apply: (id) => `/api/pm-templates/${id}/apply/`,

    // Forms
    forms: '/api/pm-forms/',
    form_by_id: (id) => `/api/pm-forms/${id}/`,
    form_fields: '/api/pm-form-fields/',
    form_field_by_id: (id) => `/api/pm-form-fields/${id}/`,
    form_submissions: '/api/pm-form-submissions/',
    form_submission_by_id: (id) => `/api/pm-form-submissions/${id}/`,

    // Whiteboards
    whiteboards: '/api/pm-whiteboards/',
    whiteboard_by_id: (id) => `/api/pm-whiteboards/${id}/`,

    // Dashboards
    dashboards: '/api/pm-dashboards/',
    dashboard_by_id: (id) => `/api/pm-dashboards/${id}/`,
    dashboard_widgets: '/api/pm-dashboard-widgets/',
    dashboard_widget_by_id: (id) => `/api/pm-dashboard-widgets/${id}/`,
    dashboard_stats_overview: '/api/pm-dashboard-stats/overview/',
    dashboard_stats_workload: '/api/pm-dashboard-stats/workload/',

    // Favorites
    favorites: '/api/pm-favorites/',
    favorite_by_id: (id) => `/api/pm-favorites/${id}/`,

    // Notifications
    pm_notifications: '/api/pm-notifications/',
    pm_notification_by_id: (id) => `/api/pm-notifications/${id}/`,
    pm_notification_mark_read: (id) => `/api/pm-notifications/${id}/mark-read/`,
    pm_notification_mark_all_read: '/api/pm-notifications/mark-all-read/',
    pm_notification_unread_count: '/api/pm-notifications/unread-count/',

    // Roles & Permissions
    pm_roles: '/api/pm-roles/',
    pm_role_by_id: (id) => `/api/pm-roles/${id}/`,
    pm_user_roles: '/api/pm-user-roles/',
    pm_user_role_by_id: (id) => `/api/pm-user-roles/${id}/`,
  },

  // ── Final Settlement ──
  finalSettlement: {
    list: '/api/final-settlement/',
    byId: (id) => `/api/final-settlement/${id}/`,
    submit: (id) => `/api/final-settlement/${id}/submit/`,
    sign: (id) => `/api/final-settlement/${id}/sign/`,
    paymentComplete: (id) => `/api/final-settlement/${id}/payment-complete/`,
  },

  // ── Movement Management ──
  movementManagement: {
    list: '/api/movement-management/',
    summary: '/api/movement-management/summary/',
    byId: (id) => `/api/movement-management/${id}/`,
    sign: (id) => `/api/movement-management/${id}/sign/`,
  },

  // ── Provident Fund ──
  providentFund: {
    list: '/api/provident-fund/',
    byId: (id) => `/api/provident-fund/${id}/`,
    sign: (id) => `/api/provident-fund/${id}/sign/`,
  },

  // ── Travel Expense ──
  travelExpense: {
    list: '/api/travel-expense/',
    byId: (id) => `/api/travel-expense/${id}/`,
    sign: (id) => `/api/travel-expense/${id}/sign/`,
    uploadFile: (id) => `/api/travel-expense/${id}/upload_file/`,
    deleteFile: (id, fileId) => `/api/travel-expense/${id}/delete_file/${fileId}/`,
  },

  // ══════════════════════════════════════════════════
  // Accounting & Finance
  // ══════════════════════════════════════════════════
  accounting: {
    // Dashboard
    dashboard: '/api/acc-dashboard/',

    // Chart of Accounts
    account_types: '/api/acc-account-types/',
    account_type_by_id: (id) => `/api/acc-account-types/${id}/`,
    account_groups: '/api/acc-account-groups/',
    account_group_by_id: (id) => `/api/acc-account-groups/${id}/`,
    account_group_tree: '/api/acc-account-groups/tree/',
    accounts: '/api/acc-accounts/',
    account_by_id: (id) => `/api/acc-accounts/${id}/`,
    account_tree: '/api/acc-accounts/tree/',
    account_summary: '/api/acc-accounts/summary/',
    account_seed: '/api/acc-accounts/seed/',
    account_relatable: '/api/acc-accounts/relatable/',
    account_trial_balance: '/api/acc-accounts/trial_balance/',
    account_tags: '/api/acc-account-tags/',
    account_tag_by_id: (id) => `/api/acc-account-tags/${id}/`,

    // Fiscal
    fiscal_years: '/api/acc-fiscal-years/',
    fiscal_year_by_id: (id) => `/api/acc-fiscal-years/${id}/`,
    fiscal_year_generate_periods: (id) => `/api/acc-fiscal-years/${id}/generate_periods/`,
    fiscal_year_close: (id) => `/api/acc-fiscal-years/${id}/close/`,
    fiscal_year_reopen: (id) => `/api/acc-fiscal-years/${id}/reopen/`,
    fiscal_periods: '/api/acc-fiscal-periods/',
    fiscal_period_by_id: (id) => `/api/acc-fiscal-periods/${id}/`,

    // Journals
    journals: '/api/acc-journals/',
    journal_by_id: (id) => `/api/acc-journals/${id}/`,
    journal_seed: '/api/acc-journals/seed/',
    journal_entries: '/api/acc-journal-entries/',
    journal_entry_by_id: (id) => `/api/acc-journal-entries/${id}/`,
    journal_entry_post: (id) => `/api/acc-journal-entries/${id}/post-entry/`,
    journal_entry_cancel: (id) => `/api/acc-journal-entries/${id}/cancel/`,
    journal_items: '/api/acc-journal-items/',
    journal_item_by_id: (id) => `/api/acc-journal-items/${id}/`,
    journal_attachments: '/api/acc-journal-attachments/',
    journal_attachment_by_id: (id) => `/api/acc-journal-attachments/${id}/`,
    recurring_journals: '/api/acc-recurring-journals/',
    recurring_journal_by_id: (id) => `/api/acc-recurring-journals/${id}/`,
    recurring_journal_execute: (id) => `/api/acc-recurring-journals/${id}/execute/`,

    // Vouchers
    vouchers: '/api/acc-vouchers/',
    voucher_by_id: (id) => `/api/acc-vouchers/${id}/`,
    voucher_submit: (id) => `/api/acc-vouchers/${id}/submit-voucher/`,
    voucher_approve: (id) => `/api/acc-vouchers/${id}/approve-voucher/`,
    voucher_reject: (id) => `/api/acc-vouchers/${id}/reject-voucher/`,
    voucher_post: (id) => `/api/acc-vouchers/${id}/post-voucher/`,
    voucher_approvals: '/api/acc-voucher-approvals/',
    voucher_approval_by_id: (id) => `/api/acc-voucher-approvals/${id}/`,
    voucher_attachments: '/api/acc-voucher-attachments/',
    voucher_attachment_by_id: (id) => `/api/acc-voucher-attachments/${id}/`,

    // Payments
    payment_methods: '/api/acc-payment-methods/',
    payment_method_by_id: (id) => `/api/acc-payment-methods/${id}/`,
    payments: '/api/acc-payments/',
    payment_by_id: (id) => `/api/acc-payments/${id}/`,
    payment_allocations: '/api/acc-payment-allocations/',
    payment_allocation_by_id: (id) => `/api/acc-payment-allocations/${id}/`,

    // Banking
    bank_accounts: '/api/acc-bank-accounts/',
    bank_account_by_id: (id) => `/api/acc-bank-accounts/${id}/`,
    bank_account_sync: (id) => `/api/acc-bank-accounts/${id}/sync/`,
    bank_transactions: '/api/acc-bank-transactions/',
    bank_transaction_by_id: (id) => `/api/acc-bank-transactions/${id}/`,
    bank_reconciliations: '/api/acc-bank-reconciliations/',
    bank_reconciliation_by_id: (id) => `/api/acc-bank-reconciliations/${id}/`,
    bank_reconciliation_complete: (id) => `/api/acc-bank-reconciliations/${id}/complete/`,
    cash_registers: '/api/acc-cash-registers/',
    cash_register_by_id: (id) => `/api/acc-cash-registers/${id}/`,
    cash_transactions: '/api/acc-cash-transactions/',
    cash_transaction_by_id: (id) => `/api/acc-cash-transactions/${id}/`,

    // Payables (AP)
    vendors: '/api/acc-vendors/',
    vendor_by_id: (id) => `/api/acc-vendors/${id}/`,
    vendor_outstanding: (id) => `/api/acc-vendors/${id}/outstanding/`,
    bills: '/api/acc-bills/',
    bill_by_id: (id) => `/api/acc-bills/${id}/`,
    bill_approve: (id) => `/api/acc-bills/${id}/approve/`,
    bill_post: (id) => `/api/acc-bills/${id}/post-bill/`,
    bill_register_payment: (id) => `/api/acc-bills/${id}/register-payment/`,
    bill_create_draft: '/api/acc-bills/create-draft/',
    bill_vendors: '/api/acc-bills/vendors/',
    debit_notes: '/api/acc-debit-notes/',
    debit_note_by_id: (id) => `/api/acc-debit-notes/${id}/`,
    debit_note_create_draft: '/api/acc-debit-notes/create-draft/',
    debit_note_vendors: '/api/acc-debit-notes/vendors/',
    debit_note_apply: (id) => `/api/acc-debit-notes/${id}/apply/`,
    vendor_credits: '/api/acc-vendor-credits/',
    vendor_credit_by_id: (id) => `/api/acc-vendor-credits/${id}/`,

    // Receivables (AR)
    customers: '/api/acc-customers/',
    customer_by_id: (id) => `/api/acc-customers/${id}/`,
    customer_outstanding: (id) => `/api/acc-customers/${id}/outstanding/`,
    invoices: '/api/acc-invoices/',
    invoice_by_id: (id) => `/api/acc-invoices/${id}/`,
    invoice_send: (id) => `/api/acc-invoices/${id}/send-invoice/`,
    invoice_post: (id) => `/api/acc-invoices/${id}/post-invoice/`,
    invoice_register_payment: (id) => `/api/acc-invoices/${id}/register-payment/`,
    credit_notes: '/api/acc-credit-notes/',
    credit_note_by_id: (id) => `/api/acc-credit-notes/${id}/`,
    credit_note_apply: (id) => `/api/acc-credit-notes/${id}/apply/`,
    credit_note_create_draft: '/api/acc-credit-notes/create-draft/',
    credit_note_customers: '/api/acc-credit-notes/customers/',

    // Customer Invoice transaction workspace
    customer_invoices: '/api/acc-customer-invoices/',
    customer_invoice_customers: '/api/acc-customer-invoices/customers/',
    customer_invoice_by_id: (id) => `/api/acc-customer-invoices/${id}/`,
    customer_invoice_send: (id) => `/api/acc-customer-invoices/${id}/send/`,
    customer_invoice_post: (id) => `/api/acc-customer-invoices/${id}/post/`,
    customer_invoice_register_payment: (id) => `/api/acc-customer-invoices/${id}/register-payment/`,

    // Workspace transaction pages
    customer_receipts: '/api/acc-customer-receipts/',
    customer_receipt_by_id: (id) => `/api/acc-customer-receipts/${id}/`,
    customer_receipt_customers: '/api/acc-customer-receipts/customers/',
    customer_receipt_allocate: (id) => `/api/acc-customer-receipts/${id}/allocate/`,
    customer_receipt_auto_allocate: (id) => `/api/acc-customer-receipts/${id}/auto-allocate/`,
    customer_receipt_hold: (id) => `/api/acc-customer-receipts/${id}/hold-as-advance/`,
    customer_receipt_write_off: (id) => `/api/acc-customer-receipts/${id}/write-off-residual/`,
    bank_deposits: '/api/acc-bank-deposits/',
    bank_deposit_by_id: (id) => `/api/acc-bank-deposits/${id}/`,
    bank_deposit_reconcile: (id) => `/api/acc-bank-deposits/${id}/reconcile/`,
    supplier_payments: '/api/acc-supplier-payments/',
    supplier_payment_by_id: (id) => `/api/acc-supplier-payments/${id}/`,
    supplier_ledger: '/api/acc-supplier-ledger/',
    supplier_payment_vendors: '/api/acc-supplier-payments/vendors/',
    supplier_payment_payable_bills: '/api/acc-supplier-payments/payable-bills/',
    supplier_payment_release: (id) => `/api/acc-supplier-payments/${id}/release/`,
    supplier_payment_unblock: (id) => `/api/acc-supplier-payments/${id}/unblock/`,

    // Budgets
    budget_categories: '/api/acc-budget-categories/',
    budget_category_by_id: (id) => `/api/acc-budget-categories/${id}/`,
    budgets: '/api/acc-budgets/',
    budget_by_id: (id) => `/api/acc-budgets/${id}/`,
    budget_confirm: (id) => `/api/acc-budgets/${id}/confirm/`,
    budget_validate: (id) => `/api/acc-budgets/${id}/validate-budget/`,
    budget_utilization: (id) => `/api/acc-budgets/${id}/utilization/`,
    budget_check_availability: (id) => `/api/acc-budgets/${id}/check-availability/`,
    budget_approve: (id) => `/api/acc-budgets/${id}/approve/`,
    budget_amend: (id) => `/api/acc-budgets/${id}/amend/`,
    budget_add_line: (id) => `/api/acc-budgets/${id}/add-line/`,
    budget_lines: '/api/acc-budget-lines/',
    budget_line_by_id: (id) => `/api/acc-budget-lines/${id}/`,
    budget_amendments: '/api/acc-budget-amendments/',
    budget_amendment_by_id: (id) => `/api/acc-budget-amendments/${id}/`,
    budget_transfers: '/api/acc-budget-transfers/',
    budget_transfer_by_id: (id) => `/api/acc-budget-transfers/${id}/`,
    budget_transfer_approve: (id) => `/api/acc-budget-transfers/${id}/approve/`,

    // Tax
    tax_groups: '/api/acc-tax-groups/',
    tax_group_by_id: (id) => `/api/acc-tax-groups/${id}/`,
    taxes: '/api/acc-taxes/',
    tax_by_id: (id) => `/api/acc-taxes/${id}/`,
    tax_rules: '/api/acc-tax-rules/',
    tax_rule_by_id: (id) => `/api/acc-tax-rules/${id}/`,
    withholding_taxes: '/api/acc-withholding-taxes/',
    withholding_tax_by_id: (id) => `/api/acc-withholding-taxes/${id}/`,

    // Analytics
    cost_centers: '/api/acc-cost-centers/',
    cost_center_by_id: (id) => `/api/acc-cost-centers/${id}/`,
    analytic_plans: '/api/acc-analytic-plans/',
    analytic_plan_by_id: (id) => `/api/acc-analytic-plans/${id}/`,
    analytic_accounts: '/api/acc-analytic-accounts/',
    analytic_account_by_id: (id) => `/api/acc-analytic-accounts/${id}/`,
    analytic_lines: '/api/acc-analytic-lines/',
    analytic_line_by_id: (id) => `/api/acc-analytic-lines/${id}/`,
    analytic_tags: '/api/acc-analytic-tags/',
    analytic_tag_by_id: (id) => `/api/acc-analytic-tags/${id}/`,

    // Multi-Currency
    currencies: '/api/acc-currencies/',
    currency_by_id: (id) => `/api/acc-currencies/${id}/`,
    exchange_rates: '/api/acc-exchange-rates/',
    exchange_rate_by_id: (id) => `/api/acc-exchange-rates/${id}/`,

    // Reports
    report_templates: '/api/acc-report-templates/',
    report_template_by_id: (id) => `/api/acc-report-templates/${id}/`,
    generated_reports: '/api/acc-generated-reports/',
    generated_report_by_id: (id) => `/api/acc-generated-reports/${id}/`,
    report_generate: '/api/acc-generated-reports/generate/',
    report_trial_balance: '/api/acc-generated-reports/trial-balance/',

    // Settings
    settings: '/api/acc-settings/',
    number_sequences: '/api/acc-number-sequences/',
    number_sequence_by_id: (id) => `/api/acc-number-sequences/${id}/`,
    approval_rules: '/api/acc-approval-rules/',
    approval_rule_by_id: (id) => `/api/acc-approval-rules/${id}/`,
    approval_workflows: '/api/acc-approval-workflows/',
    approval_workflow_by_id: (id) => `/api/acc-approval-workflows/${id}/`,
    audit_logs: '/api/acc-audit-logs/',
    audit_log_by_id: (id) => `/api/acc-audit-logs/${id}/`,
    posting_rules: '/api/acc-posting-rules/',
    posting_rule_by_id: (id) => `/api/acc-posting-rules/${id}/`,
    integration_rules: '/api/acc-integration-rules/',
    integration_rule_by_id: (id) => `/api/acc-integration-rules/${id}/`,
    lock_dates: '/api/acc-lock-dates/',
    lock_date_by_id: (id) => `/api/acc-lock-dates/${id}/`,

    // Assets
    asset_categories: '/api/acc-asset-categories/',
    asset_category_by_id: (id) => `/api/acc-asset-categories/${id}/`,
    assets: '/api/acc-assets/',
    asset_by_id: (id) => `/api/acc-assets/${id}/`,
    asset_start: (id) => `/api/acc-assets/${id}/start/`,
    asset_run_depreciation: (id) => `/api/acc-assets/${id}/run-depreciation/`,
    asset_dispose: (id) => `/api/acc-assets/${id}/dispose/`,
    asset_record_impairment: (id) => `/api/acc-assets/${id}/record-impairment/`,
    asset_transfer: (id) => `/api/acc-assets/${id}/transfer/`,
    asset_recalculate: (id) => `/api/acc-assets/${id}/recalculate/`,
    asset_depreciations: '/api/acc-asset-depreciations/',
    asset_depreciation_by_id: (id) => `/api/acc-asset-depreciations/${id}/`,
    asset_disposals: '/api/acc-asset-disposals/',
    asset_disposal_by_id: (id) => `/api/acc-asset-disposals/${id}/`,
    asset_impairments: '/api/acc-asset-impairments/',
    asset_transfers: '/api/acc-asset-transfers/',

    // Perdium
    perdium: '/api/acc-perdium/',
    perdium_by_id: (id) => `/api/acc-perdium/${id}/`,
    lookup: '/api/acc-perdium/lookup/',

    // Perdium Claims
    perdium_claims: '/api/acc-perdium-claims/',
    perdium_claim_by_id: (id) => `/api/acc-perdium-claims/${id}/`,
    perdium_claim_sign: (id) => `/api/acc-perdium-claims/${id}/sign/`,
    create: '/api/accounting/perdium-claim/',

    // Payment Terms
    payment_terms: '/api/acc-payment-terms/',
    payment_term_by_id: (id) => `/api/acc-payment-terms/${id}/`,

    // Fiscal Positions
    fiscal_positions: '/api/acc-fiscal-positions/',
    fiscal_position_by_id: (id) => `/api/acc-fiscal-positions/${id}/`,

    // Incoterms
    incoterms: '/api/acc-incoterms/',
    incoterm_by_id: (id) => `/api/acc-incoterms/${id}/`,

    // Reconciliation Models
    reconciliation_models: '/api/acc-reconciliation-models/',
    reconciliation_model_by_id: (id) => `/api/acc-reconciliation-models/${id}/`,

    // Bank Statements
    bank_statements: '/api/acc-bank-statements/',
    bank_statement_by_id: (id) => `/api/acc-bank-statements/${id}/`,
    statement_apply_line_action: (id) => `/api/acc-bank-statements/${id}/apply-line-action/`,
    statement_auto_match: (id) => `/api/acc-bank-statements/${id}/auto-match/`,
    statement_finalize: (id) => `/api/acc-bank-statements/${id}/finalize/`,
    bank_statement_lines: '/api/acc-bank-statement-lines/',
    bank_statement_line_by_id: (id) => `/api/acc-bank-statement-lines/${id}/`,

    // Checks
    checks: '/api/acc-checks/',
    check_by_id: (id) => `/api/acc-checks/${id}/`,
    check_update_status: (id) => `/api/acc-checks/${id}/update-status/`,
    check_print: (id) => `/api/acc-checks/${id}/print/`,

    // Bank Transfers
    bank_transfers: '/api/acc-bank-transfers/',
    bank_transfer_by_id: (id) => `/api/acc-bank-transfers/${id}/`,
    transfer_advance_status: (id) => `/api/acc-bank-transfers/${id}/advance-status/`,

    // Deferred Revenue & Expenses
    deferred_revenue: '/api/acc-deferred-revenue/',
    deferred_revenue_by_id: (id) => `/api/acc-deferred-revenue/${id}/`,
    deferred_revenue_create_draft: '/api/acc-deferred-revenue/create-draft/',
    deferred_revenue_recognize: (id) => `/api/acc-deferred-revenue/${id}/recognize/`,
    deferred_expenses: '/api/acc-deferred-expenses/',
    deferred_expense_by_id: (id) => `/api/acc-deferred-expenses/${id}/`,
    deferred_expense_create_draft: '/api/acc-deferred-expenses/create-draft/',
    deferred_expense_recognize: (id) => `/api/acc-deferred-expenses/${id}/recognize/`,

    // Workspace Cash Transactions
    workspace_cash_transactions: '/api/acc-workspace-cash-transactions/',
    workspace_cash_transaction_by_id: (id) => `/api/acc-workspace-cash-transactions/${id}/`,
    workspace_cash_transaction_create: '/api/acc-workspace-cash-transactions/create/',
    workspace_cash_transaction_post: (id) => `/api/acc-workspace-cash-transactions/${id}/post/`,

    // Workspace Contra Entries
    workspace_contra_entries: '/api/acc-workspace-contra-entries/',
    workspace_contra_entry_by_id: (id) => `/api/acc-workspace-contra-entries/${id}/`,
    workspace_contra_entry_create: '/api/acc-workspace-contra-entries/create/',
    workspace_contra_entry_post: (id) => `/api/acc-workspace-contra-entries/${id}/post/`,

    // Workspace Expense Entries
    workspace_expense_entries: '/api/acc-workspace-expense-entries/',
    workspace_expense_entry_by_id: (id) => `/api/acc-workspace-expense-entries/${id}/`,
    workspace_expense_entry_create: '/api/acc-workspace-expense-entries/create/',
    workspace_expense_entry_post: (id) => `/api/acc-workspace-expense-entries/${id}/post/`,

    // Workspace Payroll Entries
    workspace_payroll_entries: '/api/acc-workspace-payroll-entries/',
    workspace_payroll_entry_by_id: (id) => `/api/acc-workspace-payroll-entries/${id}/`,
    workspace_payroll_entry_create: '/api/acc-workspace-payroll-entries/create/',
    workspace_payroll_entry_post: (id) => `/api/acc-workspace-payroll-entries/${id}/post/`,

    // Workspace Inventory Entries
    workspace_inventory_entries: '/api/acc-workspace-inventory-entries/',
    workspace_inventory_entry_by_id: (id) => `/api/acc-workspace-inventory-entries/${id}/`,
    workspace_inventory_entry_create: '/api/acc-workspace-inventory-entries/create/',
    workspace_inventory_entry_post: (id) => `/api/acc-workspace-inventory-entries/${id}/post/`,
  },
};
