const REPORT_DATE = '2026-03-29';

export const RECEIVABLE_COLLECTION_STAGE_ORDER = [
  'Scheduled',
  'Reminder sent',
  'Negotiation',
  'Promise secured',
  'Payment plan draft',
  'Awaiting approval',
  'Escalated',
  'Executive escalation',
  'Executive review',
  'Closed',
];

const receivablesWorkspaceListeners = new Set();

let receivablesWorkspaceVersion = 0;
const receivableInvoiceOverrides = new Map();
const receivableStatementOverrides = new Map();

export const RECEIVABLE_CUSTOMERS = [
  {
    id: 'cust-1001',
    code: 'CUST-1001',
    name: 'Horizon Education Trust',
    email: 'finance@horizontrust.org',
    segment: 'Institutional',
    collector: 'Nabila Rahman',
    creditLimit: 450000,
    riskLevel: 'medium',
    approvalState: 'approved',
    disputeFlags: 1,
    collectionNote: 'Waiting for donor budget release before final settlement.',
  },
  {
    id: 'cust-1002',
    code: 'CUST-1002',
    name: 'Community Health Network',
    email: 'accounts@chn.org',
    segment: 'NGO',
    collector: 'Rafiul Islam',
    creditLimit: 320000,
    riskLevel: 'high',
    approvalState: 'review',
    disputeFlags: 2,
    collectionNote: 'Escalation active after multiple missed promise-to-pay dates.',
  },
  {
    id: 'cust-1003',
    code: 'CUST-1003',
    name: 'Bright Future School',
    email: 'bursar@brightfuture.edu',
    segment: 'Education',
    collector: 'Nabila Rahman',
    creditLimit: 180000,
    riskLevel: 'low',
    approvalState: 'approved',
    disputeFlags: 0,
    collectionNote: 'Routine monthly billing with strong payment discipline.',
  },
  {
    id: 'cust-1004',
    code: 'CUST-1004',
    name: 'ReliefWorks International',
    email: 'grants@reliefworks.org',
    segment: 'Institutional',
    collector: 'Shuvo Das',
    creditLimit: 600000,
    riskLevel: 'medium',
    approvalState: 'approved',
    disputeFlags: 0,
    collectionNote: 'Pending milestone sign-off on one grant invoice.',
  },
  {
    id: 'cust-1005',
    code: 'CUST-1005',
    name: 'Dhaka Social Care Foundation',
    email: 'ledger@dscf.org',
    segment: 'NGO',
    collector: 'Rafiul Islam',
    creditLimit: 250000,
    riskLevel: 'medium',
    approvalState: 'pending',
    disputeFlags: 1,
    collectionNote: 'Payment plan proposed for two aging service invoices.',
  },
];

export const RECEIVABLE_INVOICES = [
  {
    id: 'inv-ar-001',
    number: 'INV-AR-001',
    customerId: 'cust-1001',
    issueDate: '2026-01-10',
    dueDate: '2026-02-09',
    total: 120000,
    paidAmount: 80000,
    status: 'overdue',
    approvalState: 'approved',
    followUpStage: 'Negotiation',
    reminderTemplate: 'Grant reminder stage 2',
    escalationRule: 'Escalate to Program Director after 45 overdue days',
    lastContact: '2026-03-24',
    promiseToPay: '2026-04-02',
    paymentPlanEligible: true,
    disputed: true,
    disputeReason: 'Customer asked for support documents on training attendance.',
    description: 'January training services for district coordinators',
    approvalOwner: 'Receivables Lead',
    tags: ['grant', 'training'],
    timeline: [
      {
        label: 'Invoice issued',
        status: 'done',
        tone: 'success',
        time: '10 Jan 2026',
        description: 'Invoice released after service confirmation.',
      },
      {
        label: 'Reminder sent',
        status: 'stage 2',
        tone: 'warning',
        time: '20 Mar 2026',
        description: 'Second reminder email delivered to donor finance team.',
      },
      {
        label: 'Support pack requested',
        status: 'open',
        tone: 'error',
        time: '24 Mar 2026',
        description: 'Customer requested signed attendance sheets.',
      },
    ],
    notes: [
      {
        date: '2026-03-21',
        author: 'Nabila Rahman',
        message: 'Shared revised service completion pack.',
      },
      {
        date: '2026-03-24',
        author: 'Program Office',
        message: 'Uploaded signed attendance evidence.',
      },
    ],
  },
  {
    id: 'inv-ar-002',
    number: 'INV-AR-002',
    customerId: 'cust-1002',
    issueDate: '2025-12-15',
    dueDate: '2026-01-14',
    total: 98000,
    paidAmount: 15000,
    status: 'overdue',
    approvalState: 'escalated',
    followUpStage: 'Escalated',
    reminderTemplate: 'Final demand notice',
    escalationRule: 'Escalate to CFO after 60 overdue days',
    lastContact: '2026-03-27',
    promiseToPay: '',
    paymentPlanEligible: true,
    disputed: true,
    disputeReason: 'Customer disputes two consultancy line items.',
    description: 'Community clinic oversight services',
    approvalOwner: 'Controller',
    tags: ['consultancy', 'escalation'],
    timeline: [
      {
        label: 'Invoice issued',
        status: 'done',
        tone: 'success',
        time: '15 Dec 2025',
        description: 'Invoice posted and emailed.',
      },
      {
        label: 'Escalation notice',
        status: 'critical',
        tone: 'error',
        time: '27 Mar 2026',
        description: 'CFO escalation triggered due to long aging.',
      },
    ],
    notes: [
      {
        date: '2026-03-18',
        author: 'Rafiul Islam',
        message: 'Customer requested meeting on disputed lines.',
      },
      { date: '2026-03-27', author: 'Controller', message: 'Escalated for legal wording review.' },
    ],
  },
  {
    id: 'inv-ar-003',
    number: 'INV-AR-003',
    customerId: 'cust-1003',
    issueDate: '2026-03-01',
    dueDate: '2026-03-31',
    total: 45000,
    paidAmount: 0,
    status: 'sent',
    approvalState: 'approved',
    followUpStage: 'Scheduled',
    reminderTemplate: 'Friendly reminder',
    escalationRule: 'Auto reminder 3 days before due date',
    lastContact: '2026-03-22',
    promiseToPay: '2026-03-31',
    paymentPlanEligible: false,
    disputed: false,
    disputeReason: '',
    description: 'March learning materials subscription',
    approvalOwner: 'Collections Desk',
    tags: ['subscription'],
    timeline: [
      {
        label: 'Invoice issued',
        status: 'done',
        tone: 'success',
        time: '01 Mar 2026',
        description: 'Monthly subscription invoice sent.',
      },
      {
        label: 'Pre-due reminder',
        status: 'queued',
        tone: 'info',
        time: '29 Mar 2026',
        description: 'Reminder queued for send pipeline.',
      },
    ],
    notes: [
      {
        date: '2026-03-22',
        author: 'Collections Desk',
        message: 'Customer confirmed funds are scheduled.',
      },
    ],
  },
  {
    id: 'inv-ar-004',
    number: 'INV-AR-004',
    customerId: 'cust-1004',
    issueDate: '2026-02-18',
    dueDate: '2026-03-19',
    total: 175000,
    paidAmount: 70000,
    status: 'partial',
    approvalState: 'approved',
    followUpStage: 'Promise secured',
    reminderTemplate: 'Milestone completion reminder',
    escalationRule: 'Program Manager follow-up after 15 overdue days',
    lastContact: '2026-03-28',
    promiseToPay: '2026-04-05',
    paymentPlanEligible: true,
    disputed: false,
    disputeReason: '',
    description: 'Milestone billing for nutrition outreach phase 2',
    approvalOwner: 'Shuvo Das',
    tags: ['milestone', 'grant'],
    timeline: [
      {
        label: 'Partial payment received',
        status: 'partial',
        tone: 'warning',
        time: '25 Mar 2026',
        description: 'Customer settled first tranche.',
      },
      {
        label: 'Promise to pay logged',
        status: 'confirmed',
        tone: 'success',
        time: '28 Mar 2026',
        description: 'Balance expected in next disbursement.',
      },
    ],
    notes: [
      {
        date: '2026-03-28',
        author: 'Shuvo Das',
        message: 'Grant manager confirmed next tranche on 5 Apr.',
      },
    ],
  },
  {
    id: 'inv-ar-005',
    number: 'INV-AR-005',
    customerId: 'cust-1005',
    issueDate: '2026-01-25',
    dueDate: '2026-02-24',
    total: 64000,
    paidAmount: 12000,
    status: 'overdue',
    approvalState: 'pending',
    followUpStage: 'Payment plan draft',
    reminderTemplate: 'Installment proposal',
    escalationRule: 'Escalate to finance manager after missed installment',
    lastContact: '2026-03-26',
    promiseToPay: '2026-04-07',
    paymentPlanEligible: true,
    disputed: false,
    disputeReason: '',
    description: 'Case management and reporting support',
    approvalOwner: 'Receivables Lead',
    tags: ['services', 'payment-plan'],
    timeline: [
      {
        label: 'Payment plan drafted',
        status: 'draft',
        tone: 'warning',
        time: '26 Mar 2026',
        description: 'Three-installment proposal shared.',
      },
    ],
    notes: [
      {
        date: '2026-03-26',
        author: 'Rafiul Islam',
        message: 'Customer requested installment option.',
      },
    ],
  },
  {
    id: 'inv-ar-006',
    number: 'INV-AR-006',
    customerId: 'cust-1001',
    issueDate: '2026-03-15',
    dueDate: '2026-04-14',
    total: 82000,
    paidAmount: 0,
    status: 'draft',
    approvalState: 'pending_review',
    followUpStage: 'Awaiting approval',
    reminderTemplate: 'Draft hold',
    escalationRule: 'Do not send until documentation approval',
    lastContact: '',
    promiseToPay: '',
    paymentPlanEligible: false,
    disputed: false,
    disputeReason: '',
    description: 'Supplementary monitoring and evaluation support',
    approvalOwner: 'Billing Supervisor',
    tags: ['draft'],
    timeline: [
      {
        label: 'Draft prepared',
        status: 'review',
        tone: 'info',
        time: '15 Mar 2026',
        description: 'Waiting for internal document approval.',
      },
    ],
    notes: [
      {
        date: '2026-03-16',
        author: 'Billing Supervisor',
        message: 'Pending supporting milestone memo.',
      },
    ],
  },
  {
    id: 'inv-ar-007',
    number: 'INV-AR-007',
    customerId: 'cust-1003',
    issueDate: '2026-02-05',
    dueDate: '2026-03-06',
    total: 38000,
    paidAmount: 38000,
    status: 'paid',
    approvalState: 'approved',
    followUpStage: 'Closed',
    reminderTemplate: 'Receipt acknowledgement',
    escalationRule: 'N/A',
    lastContact: '2026-03-07',
    promiseToPay: '',
    paymentPlanEligible: false,
    disputed: false,
    disputeReason: '',
    description: 'February subscription services',
    approvalOwner: 'Collections Desk',
    tags: ['closed'],
    timeline: [
      {
        label: 'Paid in full',
        status: 'closed',
        tone: 'success',
        time: '07 Mar 2026',
        description: 'Receipt applied and statement updated.',
      },
    ],
    notes: [
      {
        date: '2026-03-07',
        author: 'Collections Desk',
        message: 'Closed after bank receipt confirmation.',
      },
    ],
  },
  {
    id: 'inv-ar-008',
    number: 'INV-AR-008',
    customerId: 'cust-1004',
    issueDate: '2025-11-20',
    dueDate: '2025-12-20',
    total: 142000,
    paidAmount: 0,
    status: 'overdue',
    approvalState: 'escalated',
    followUpStage: 'Executive escalation',
    reminderTemplate: 'Executive escalation pack',
    escalationRule: 'Escalate to Executive Director after 90 overdue days',
    lastContact: '2026-03-25',
    promiseToPay: '',
    paymentPlanEligible: false,
    disputed: true,
    disputeReason: 'Grant amendment not reflected in source PO.',
    description: 'Legacy grant milestone billing',
    approvalOwner: 'Controller',
    tags: ['legacy', 'critical'],
    timeline: [
      {
        label: 'Executive escalation',
        status: 'critical',
        tone: 'error',
        time: '25 Mar 2026',
        description: 'Added to weekly exception review.',
      },
    ],
    notes: [
      {
        date: '2026-03-25',
        author: 'Controller',
        message: 'Track amendment approval before further collection steps.',
      },
    ],
  },
];

export const RECEIVABLE_STATEMENTS = [
  {
    id: 'stmt-001',
    customerId: 'cust-1001',
    periodLabel: 'March 2026 Statement',
    startDate: '2026-03-01',
    endDate: '2026-03-29',
    sentStatus: 'queued',
    approvalState: 'approved',
    disputeNote: 'One invoice remains under document review.',
  },
  {
    id: 'stmt-002',
    customerId: 'cust-1002',
    periodLabel: 'March 2026 Escalation Statement',
    startDate: '2026-03-01',
    endDate: '2026-03-29',
    sentStatus: 'sent',
    approvalState: 'escalated',
    disputeNote: 'Contains disputed consultancy lines under escalation.',
  },
  {
    id: 'stmt-003',
    customerId: 'cust-1004',
    periodLabel: 'Quarter End Statement',
    startDate: '2026-01-01',
    endDate: '2026-03-29',
    sentStatus: 'draft',
    approvalState: 'review',
    disputeNote: 'Milestone documentation pending for one legacy item.',
  },
  {
    id: 'stmt-004',
    customerId: 'cust-1005',
    periodLabel: 'Payment Plan Statement',
    startDate: '2026-03-01',
    endDate: '2026-03-29',
    sentStatus: 'queued',
    approvalState: 'pending',
    disputeNote: 'Statement should reflect upcoming installment proposal.',
  },
];

function notifyReceivablesWorkspaceListeners() {
  receivablesWorkspaceVersion += 1;
  receivablesWorkspaceListeners.forEach((listener) => listener());
}

function getInvoiceOverride(id) {
  return receivableInvoiceOverrides.get(id) || {};
}

function getStatementOverride(id) {
  return receivableStatementOverrides.get(id) || {};
}

function appendUniqueTimelineEntry(entries, nextEntry) {
  const currentEntries = Array.isArray(entries) ? [...entries] : [];
  return [nextEntry, ...currentEntries].slice(0, 8);
}

function appendUniqueNote(notes, nextNote) {
  const currentNotes = Array.isArray(notes) ? [...notes] : [];
  return [nextNote, ...currentNotes].slice(0, 8);
}

function mergeInvoice(invoice) {
  return {
    ...invoice,
    ...getInvoiceOverride(invoice.id),
  };
}

function mergeStatement(statement) {
  return {
    ...statement,
    ...getStatementOverride(statement.id),
  };
}

function getBaseInvoiceState(id) {
  const invoice = RECEIVABLE_INVOICES.find((item) => item.id === id);
  return invoice ? mergeInvoice(invoice) : null;
}

function getBaseStatementState(id) {
  const statement = RECEIVABLE_STATEMENTS.find((item) => item.id === id);
  return statement ? mergeStatement(statement) : null;
}

function setInvoicePatch(id, patch) {
  const currentInvoice = getBaseInvoiceState(id);
  if (!currentInvoice) return null;

  const nextPatch = typeof patch === 'function' ? patch(currentInvoice) : patch;
  receivableInvoiceOverrides.set(id, {
    ...getInvoiceOverride(id),
    ...nextPatch,
  });
  return getBaseInvoiceState(id);
}

function setStatementPatch(id, patch) {
  const currentStatement = getBaseStatementState(id);
  if (!currentStatement) return null;

  const nextPatch = typeof patch === 'function' ? patch(currentStatement) : patch;
  receivableStatementOverrides.set(id, {
    ...getStatementOverride(id),
    ...nextPatch,
  });
  return getBaseStatementState(id);
}

export function getNextCollectionStage(stage) {
  const currentIndex = RECEIVABLE_COLLECTION_STAGE_ORDER.indexOf(stage);
  if (currentIndex === -1 || currentIndex === RECEIVABLE_COLLECTION_STAGE_ORDER.length - 1) {
    return stage;
  }

  return RECEIVABLE_COLLECTION_STAGE_ORDER[currentIndex + 1];
}

export function subscribeReceivablesWorkspace(listener) {
  receivablesWorkspaceListeners.add(listener);

  return () => {
    receivablesWorkspaceListeners.delete(listener);
  };
}

export function getReceivablesWorkspaceVersion() {
  return receivablesWorkspaceVersion;
}

export function applyReceivableReminderBatch(invoiceIds, options = {}) {
  const timestamp = options.sentAt || REPORT_DATE;

  invoiceIds.forEach((id) => {
    setInvoicePatch(id, (invoice) => ({
      lastContact: timestamp,
      reminderTemplate: options.subject || invoice.reminderTemplate,
      followUpStage:
        invoice.followUpStage === 'Escalated' || invoice.followUpStage === 'Executive escalation'
          ? invoice.followUpStage
          : 'Reminder sent',
      notes: appendUniqueNote(invoice.notes, {
        date: timestamp,
        author: 'Receivables Workspace',
        message: options.note || 'Reminder batch executed from mock workflow.',
      }),
      timeline: appendUniqueTimelineEntry(invoice.timeline, {
        label: 'Reminder batch queued',
        status: 'queued',
        tone: 'info',
        time: timestamp,
        description: options.note || 'Receivable reminder workflow queued from list action.',
      }),
    }));
  });

  notifyReceivablesWorkspaceListeners();
}

export function advanceReceivableCollectionStage(id) {
  const updatedInvoice = setInvoicePatch(id, (invoice) => ({
    followUpStage: getNextCollectionStage(invoice.followUpStage),
    lastContact: REPORT_DATE,
    notes: appendUniqueNote(invoice.notes, {
      date: REPORT_DATE,
      author: 'Collections Desk',
      message: `Stage advanced to ${getNextCollectionStage(invoice.followUpStage)}.`,
    }),
    timeline: appendUniqueTimelineEntry(invoice.timeline, {
      label: 'Collection stage advanced',
      status: getNextCollectionStage(invoice.followUpStage),
      tone: invoice.priority === 'critical' ? 'error' : 'warning',
      time: REPORT_DATE,
      description: `Workflow moved to ${getNextCollectionStage(invoice.followUpStage)}.`,
    }),
  }));

  notifyReceivablesWorkspaceListeners();
  return updatedInvoice;
}

export function applyReceivableCollectionWorkflow(invoiceIds, workflow) {
  invoiceIds.forEach((id) => {
    setInvoicePatch(id, (invoice) => ({
      followUpStage: workflow.stage || invoice.followUpStage,
      reminderTemplate: workflow.template || invoice.reminderTemplate,
      promiseToPay: workflow.promiseToPay || invoice.promiseToPay,
      lastContact: REPORT_DATE,
      notes: appendUniqueNote(invoice.notes, {
        date: REPORT_DATE,
        author: 'Receivables Workflow',
        message:
          workflow.note || `Bulk workflow applied: ${workflow.stage || invoice.followUpStage}.`,
      }),
      timeline: appendUniqueTimelineEntry(invoice.timeline, {
        label: 'Bulk collection workflow',
        status: workflow.stage || invoice.followUpStage,
        tone: workflow.stage === 'Executive review' ? 'error' : 'warning',
        time: REPORT_DATE,
        description: workflow.note || 'Bulk collection workflow applied from queue.',
      }),
    }));
  });

  notifyReceivablesWorkspaceListeners();
}

export function createReceivablePaymentPlan(id, planDraft) {
  const installmentCount = Number(planDraft.installments || 0);
  const updatedInvoice = setInvoicePatch(id, (invoice) => ({
    followUpStage: installmentCount ? `Plan ${installmentCount}x` : 'Payment plan draft',
    promiseToPay: planDraft.startDate || invoice.promiseToPay,
    paymentPlanEligible: false,
    notes: appendUniqueNote(invoice.notes, {
      date: REPORT_DATE,
      author: 'Receivables Lead',
      message: `Payment plan drafted with ${installmentCount || 0} installments starting ${planDraft.startDate}.`,
    }),
    timeline: appendUniqueTimelineEntry(invoice.timeline, {
      label: 'Payment plan drafted',
      status: 'draft',
      tone: 'warning',
      time: REPORT_DATE,
      description: `Installment proposal created with ${installmentCount || 0} installments.`,
    }),
  }));

  notifyReceivablesWorkspaceListeners();
  return updatedInvoice;
}

export function markReceivableStatementSent(id) {
  const updatedStatement = setStatementPatch(id, (statement) => ({
    sentStatus: 'sent',
    disputeNote: statement.disputeCount
      ? statement.disputeNote
      : 'Statement sent from receivables workspace mock pipeline.',
  }));

  notifyReceivablesWorkspaceListeners();
  return updatedStatement;
}

export function queueReceivableStatements(statementIds) {
  statementIds.forEach((id) => {
    setStatementPatch(id, { sentStatus: 'queued' });
  });

  notifyReceivablesWorkspaceListeners();
}

export function getReceivableStatementPeriods() {
  return getStatementList().map((statement) => ({
    id: statement.id,
    label: statement.periodLabel,
  }));
}

function reportDate(cutoffDate = REPORT_DATE) {
  return new Date(`${cutoffDate}T00:00:00`);
}

export function getCustomerById(id) {
  return RECEIVABLE_CUSTOMERS.find((customer) => customer.id === id);
}

export function getInvoiceById(id) {
  const invoice = RECEIVABLE_INVOICES.find((item) => item.id === id);
  return invoice ? enrichInvoice(invoice) : null;
}

export function getStatementById(id) {
  const statement = RECEIVABLE_STATEMENTS.find((item) => item.id === id);
  return statement ? mergeStatement(statement) : null;
}

export function daysPastDue(dueDate, cutoffDate = REPORT_DATE) {
  const diff = reportDate(cutoffDate).getTime() - new Date(`${dueDate}T00:00:00`).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

export function getBucketId(days) {
  if (days <= 0) return 'not-due';
  if (days <= 30) return '1-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90-plus';
}

export function getBucketLabel(bucketId) {
  return (
    {
      'not-due': 'Not Due',
      '1-30': '1-30 Days',
      '31-60': '31-60 Days',
      '61-90': '61-90 Days',
      '90-plus': '90+ Days',
    }[bucketId] || bucketId
  );
}

export function getPriority(days, disputed) {
  if (disputed || days > 90) return 'critical';
  if (days > 45) return 'high';
  if (days > 15) return 'medium';
  return 'routine';
}

export function enrichInvoice(invoice, cutoffDate = REPORT_DATE) {
  const balanceDue = Math.max(0, invoice.total - invoice.paidAmount);
  const overdueDays = balanceDue > 0 ? daysPastDue(invoice.dueDate, cutoffDate) : 0;
  const bucketId = balanceDue > 0 ? getBucketId(overdueDays) : 'closed';

  return {
    ...invoice,
    customer: getCustomerById(invoice.customerId),
    balanceDue,
    overdueDays,
    bucketId,
    bucketLabel: bucketId === 'closed' ? 'Closed' : getBucketLabel(bucketId),
    priority: getPriority(overdueDays, invoice.disputed),
  };
}

export function getReceivableInvoices(cutoffDate = REPORT_DATE) {
  return RECEIVABLE_INVOICES.map((invoice) => enrichInvoice(mergeInvoice(invoice), cutoffDate));
}

export function getCustomerLedgerRows(cutoffDate = REPORT_DATE) {
  return RECEIVABLE_CUSTOMERS.map((customer) => {
    const invoices = getReceivableInvoices(cutoffDate).filter(
      (item) => item.customerId === customer.id
    );
    const outstanding = invoices.reduce((sum, item) => sum + item.balanceDue, 0);
    const overdue = invoices.filter((item) => item.balanceDue > 0 && item.overdueDays > 0);
    const oldestDays = overdue.length ? Math.max(...overdue.map((item) => item.overdueDays)) : 0;

    return {
      ...customer,
      invoices,
      openInvoiceCount: invoices.filter((item) => item.balanceDue > 0).length,
      totalInvoiced: invoices.reduce((sum, item) => sum + item.total, 0),
      totalPaid: invoices.reduce((sum, item) => sum + item.paidAmount, 0),
      outstanding,
      overdueInvoices: overdue.length,
      oldestDays,
      nextActionDate: overdue[0]?.promiseToPay || overdue[0]?.lastContact || 'No action scheduled',
      bucketMix: overdue.reduce(
        (acc, item) => ({ ...acc, [item.bucketId]: (acc[item.bucketId] || 0) + item.balanceDue }),
        {}
      ),
    };
  });
}

export function getAgingBuckets(cutoffDate = REPORT_DATE) {
  const invoices = getReceivableInvoices(cutoffDate).filter((item) => item.balanceDue > 0);
  const buckets = ['not-due', '1-30', '31-60', '61-90', '90-plus'].map((bucketId) => {
    const bucketInvoices = invoices.filter((item) => item.bucketId === bucketId);

    return {
      id: bucketId,
      label: getBucketLabel(bucketId),
      amount: bucketInvoices.reduce((sum, item) => sum + item.balanceDue, 0),
      count: bucketInvoices.length,
      approvals: bucketInvoices.filter((item) => item.approvalState !== 'approved').length,
      disputed: bucketInvoices.filter((item) => item.disputed).length,
      invoices: bucketInvoices,
    };
  });

  return buckets;
}

export function getCollectionQueue(cutoffDate = REPORT_DATE) {
  return getReceivableInvoices(cutoffDate)
    .filter((item) => item.balanceDue > 0 && item.status !== 'draft')
    .sort((left, right) => right.overdueDays - left.overdueDays);
}

export function getDueInvoices(cutoffDate = REPORT_DATE) {
  return getReceivableInvoices(cutoffDate)
    .filter((item) => item.balanceDue > 0)
    .sort((left, right) => right.overdueDays - left.overdueDays);
}

export function getStatementList(cutoffDate = REPORT_DATE) {
  return RECEIVABLE_STATEMENTS.map((rawStatement) => {
    const statement = mergeStatement(rawStatement);
    const invoices = getReceivableInvoices(cutoffDate).filter(
      (item) => item.customerId === statement.customerId
    );
    const openingBalance = invoices
      .filter(
        (item) =>
          new Date(`${item.issueDate}T00:00:00`) < new Date(`${statement.startDate}T00:00:00`)
      )
      .reduce((sum, item) => sum + item.balanceDue, 0);
    const closingBalance = invoices.reduce((sum, item) => sum + item.balanceDue, 0);

    return {
      ...statement,
      customer: getCustomerById(statement.customerId),
      invoices,
      openingBalance,
      closingBalance,
      disputedCount: invoices.filter((item) => item.disputed).length,
    };
  });
}

export function getReceivablesOverview(cutoffDate = REPORT_DATE) {
  const invoices = getReceivableInvoices(cutoffDate);
  const openInvoices = invoices.filter((item) => item.balanceDue > 0);
  const customerRows = getCustomerLedgerRows(cutoffDate);

  return {
    outstanding: openInvoices.reduce((sum, item) => sum + item.balanceDue, 0),
    overdue: openInvoices
      .filter((item) => item.overdueDays > 0)
      .reduce((sum, item) => sum + item.balanceDue, 0),
    disputed: openInvoices
      .filter((item) => item.disputed)
      .reduce((sum, item) => sum + item.balanceDue, 0),
    promiseSecured: openInvoices.filter((item) => item.promiseToPay).length,
    approvalsWaiting: openInvoices.filter((item) => item.approvalState !== 'approved').length,
    criticalAccounts: customerRows.filter(
      (item) => item.riskLevel === 'high' || item.disputeFlags > 0
    ).length,
  };
}

export function getReceivablesAlerts(cutoffDate = REPORT_DATE) {
  const dueInvoices = getDueInvoices(cutoffDate);
  const critical = dueInvoices.filter((item) => item.priority === 'critical');
  const approvalQueue = dueInvoices.filter((item) => item.approvalState !== 'approved');

  return [
    {
      id: 'alert-1',
      severity: 'warning',
      title: `${critical.length} critical receivables need escalation`,
      description: 'Executive or controller review should happen before the next collection cycle.',
    },
    {
      id: 'alert-2',
      severity: 'info',
      title: `${approvalQueue.length} receivable items still await approval action`,
      description: 'Statements, payment plans, or disputed invoices are pending review.',
    },
  ];
}

export function getCustomerDetail(id, cutoffDate = REPORT_DATE) {
  const customer = getCustomerById(id);
  if (!customer) return null;

  const invoices = getReceivableInvoices(cutoffDate).filter((item) => item.customerId === id);
  const statements = getStatementList(cutoffDate).filter((item) => item.customerId === id);

  return {
    customer,
    invoices,
    statements,
    outstanding: invoices.reduce((sum, item) => sum + item.balanceDue, 0),
    disputedInvoices: invoices.filter((item) => item.disputed),
    timeline: invoices
      .flatMap((item) =>
        item.timeline.map((entry) => ({
          ...entry,
          description: `${item.number}: ${entry.description}`,
        }))
      )
      .slice(0, 6),
  };
}

export function getBucketDetail(bucketId, cutoffDate = REPORT_DATE) {
  const bucket = getAgingBuckets(cutoffDate).find((item) => item.id === bucketId);
  return bucket || null;
}

export function getStatementDetail(id, cutoffDate = REPORT_DATE) {
  const statement = getStatementList(cutoffDate).find((item) => item.id === id);
  return statement || null;
}
