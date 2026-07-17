const REPORT_DATE = '2026-03-29';

const payablesWorkspaceListeners = new Set();

let payablesWorkspaceVersion = 0;
const payableBillOverrides = new Map();
const payableStatementOverrides = new Map();

function emitPayablesWorkspaceChange() {
  payablesWorkspaceVersion += 1;
  payablesWorkspaceListeners.forEach((listener) => listener());
}

function mergePayableBill(bill) {
  return {
    ...bill,
    ...(payableBillOverrides.get(bill.id) || {}),
  };
}

function mergePayableStatement(statement) {
  return {
    ...statement,
    ...(payableStatementOverrides.get(statement.id) || {}),
  };
}

function prependNote(notes, note) {
  return [note, ...(notes || [])].slice(0, 12);
}

function appendTimelineEvent(timeline, event) {
  return [...(timeline || []), event];
}

export const PAYABLE_SUPPLIERS = [
  {
    id: 'sup-2001',
    code: 'SUP-2001',
    name: 'Northern Medical Supplies',
    email: 'ap@northernmedical.com',
    category: 'Medical',
    paymentTerm: '30 Days',
    owner: 'Tasnia Karim',
    riskLevel: 'medium',
    approvalState: 'approved',
    holdFlags: 1,
    paymentMethod: 'Bank transfer',
    supplierNote: 'Critical vendor for field clinic replenishment.',
  },
  {
    id: 'sup-2002',
    code: 'SUP-2002',
    name: 'Delta Logistics Partners',
    email: 'accounts@deltalogistics.co',
    category: 'Logistics',
    paymentTerm: '45 Days',
    owner: 'Shahidul Alam',
    riskLevel: 'high',
    approvalState: 'review',
    holdFlags: 2,
    paymentMethod: 'Wire',
    supplierNote: 'Three-way match exceptions remain open on freight surcharge lines.',
  },
  {
    id: 'sup-2003',
    code: 'SUP-2003',
    name: 'EduTech Bangladesh',
    email: 'ledger@edutechbd.com',
    category: 'Technology',
    paymentTerm: '15 Days',
    owner: 'Tasnia Karim',
    riskLevel: 'low',
    approvalState: 'approved',
    holdFlags: 0,
    paymentMethod: 'Bank transfer',
    supplierNote: 'Prompt-pay discounts available on recurring software licenses.',
  },
  {
    id: 'sup-2004',
    code: 'SUP-2004',
    name: 'Community Print House',
    email: 'finance@communityprint.org',
    category: 'Services',
    paymentTerm: '30 Days',
    owner: 'Nazmul Hasan',
    riskLevel: 'medium',
    approvalState: 'approved',
    holdFlags: 0,
    paymentMethod: 'Cheque',
    supplierNote: 'Supports donor visibility campaigns and event collateral.',
  },
  {
    id: 'sup-2005',
    code: 'SUP-2005',
    name: 'Green Harvest Catering',
    email: 'ap@greenharvestcatering.com',
    category: 'Operations',
    paymentTerm: '7 Days',
    owner: 'Nazmul Hasan',
    riskLevel: 'medium',
    approvalState: 'pending',
    holdFlags: 1,
    paymentMethod: 'Mobile banking',
    supplierNote: 'Short-cycle field event catering with recurring urgent settlements.',
  },
];

export const PAYABLE_BILLS = [
  {
    id: 'bill-ap-001',
    number: 'BILL-AP-001',
    supplierId: 'sup-2001',
    issueDate: '2026-02-18',
    dueDate: '2026-03-20',
    total: 164000,
    paidAmount: 40000,
    status: 'partial',
    approvalState: 'approved',
    paymentStage: 'Treasury queue',
    scheduledPaymentDate: '2026-04-01',
    approvalOwner: 'Finance Controller',
    holdReason: '',
    discountEligible: false,
    discountDate: '',
    paymentMethod: 'Bank transfer',
    disputed: false,
    exceptionReason: '',
    description: 'Field clinic medicines and consumables - Lot 3',
    timeline: [
      {
        label: 'Bill received',
        status: 'done',
        tone: 'success',
        time: '18 Feb 2026',
        description: 'Matched against approved PO and GRN.',
      },
      {
        label: 'Partial payment released',
        status: 'partial',
        tone: 'warning',
        time: '22 Mar 2026',
        description: 'Advance settled to clear urgent shipment.',
      },
    ],
    notes: [
      {
        date: '2026-03-22',
        author: 'Treasury',
        message: 'Final tranche held for weekly payment run.',
      },
    ],
  },
  {
    id: 'bill-ap-002',
    number: 'BILL-AP-002',
    supplierId: 'sup-2002',
    issueDate: '2026-01-10',
    dueDate: '2026-02-24',
    total: 98000,
    paidAmount: 0,
    status: 'overdue',
    approvalState: 'review',
    paymentStage: 'Exception review',
    scheduledPaymentDate: '',
    approvalOwner: 'Procurement Lead',
    holdReason: 'Freight surcharge mismatch pending approval memo.',
    discountEligible: false,
    discountDate: '',
    paymentMethod: 'Wire',
    disputed: true,
    exceptionReason: 'Carrier surcharge line exceeds approved RFQ terms.',
    description: 'Emergency freight forwarding for nutrition kits',
    timeline: [
      {
        label: 'Exception flagged',
        status: 'open',
        tone: 'error',
        time: '25 Feb 2026',
        description: 'Invoice exceeds procurement-approved line value.',
      },
      {
        label: 'Vendor clarification',
        status: 'review',
        tone: 'warning',
        time: '27 Mar 2026',
        description: 'Supplier submitted surcharge note for review.',
      },
    ],
    notes: [
      {
        date: '2026-03-27',
        author: 'Shahidul Alam',
        message: 'Awaiting revised approval from logistics director.',
      },
    ],
  },
  {
    id: 'bill-ap-003',
    number: 'BILL-AP-003',
    supplierId: 'sup-2003',
    issueDate: '2026-03-12',
    dueDate: '2026-03-31',
    total: 42000,
    paidAmount: 0,
    status: 'approved',
    approvalState: 'approved',
    paymentStage: 'Discount review',
    scheduledPaymentDate: '2026-03-30',
    approvalOwner: 'AP Desk',
    holdReason: '',
    discountEligible: true,
    discountDate: '2026-03-30',
    paymentMethod: 'Bank transfer',
    disputed: false,
    exceptionReason: '',
    description: 'Annual learning platform license renewal',
    timeline: [
      {
        label: 'Discount captured',
        status: 'queued',
        tone: 'info',
        time: '28 Mar 2026',
        description: 'Scheduled ahead of due date to secure 2% prompt-pay discount.',
      },
    ],
    notes: [{ date: '2026-03-28', author: 'AP Desk', message: 'Ready for early payment release.' }],
  },
  {
    id: 'bill-ap-004',
    number: 'BILL-AP-004',
    supplierId: 'sup-2004',
    issueDate: '2026-02-28',
    dueDate: '2026-03-30',
    total: 56000,
    paidAmount: 56000,
    status: 'paid',
    approvalState: 'approved',
    paymentStage: 'Closed',
    scheduledPaymentDate: '2026-03-26',
    approvalOwner: 'Treasury',
    holdReason: '',
    discountEligible: false,
    discountDate: '',
    paymentMethod: 'Cheque',
    disputed: false,
    exceptionReason: '',
    description: 'Campaign banners and beneficiary event materials',
    timeline: [
      {
        label: 'Paid in full',
        status: 'closed',
        tone: 'success',
        time: '26 Mar 2026',
        description: 'Cheque cleared and supplier confirmed receipt.',
      },
    ],
    notes: [
      { date: '2026-03-26', author: 'Treasury', message: 'Closed during regular cheque run.' },
    ],
  },
  {
    id: 'bill-ap-005',
    number: 'BILL-AP-005',
    supplierId: 'sup-2005',
    issueDate: '2026-03-18',
    dueDate: '2026-03-25',
    total: 28500,
    paidAmount: 0,
    status: 'overdue',
    approvalState: 'pending',
    paymentStage: 'Awaiting approval',
    scheduledPaymentDate: '',
    approvalOwner: 'Program Director',
    holdReason: 'Program event attendance sheet not attached.',
    discountEligible: false,
    discountDate: '',
    paymentMethod: 'Mobile banking',
    disputed: false,
    exceptionReason: '',
    description: 'Field workshop catering and refreshments',
    timeline: [
      {
        label: 'Approval pending',
        status: 'review',
        tone: 'warning',
        time: '24 Mar 2026',
        description: 'Supporting attendance sheet required before payment.',
      },
    ],
    notes: [
      {
        date: '2026-03-24',
        author: 'Nazmul Hasan',
        message: 'Chasing program team for attendance documentation.',
      },
    ],
  },
  {
    id: 'bill-ap-006',
    number: 'BILL-AP-006',
    supplierId: 'sup-2001',
    issueDate: '2025-12-20',
    dueDate: '2026-01-19',
    total: 132000,
    paidAmount: 0,
    status: 'overdue',
    approvalState: 'escalated',
    paymentStage: 'Executive review',
    scheduledPaymentDate: '',
    approvalOwner: 'CFO',
    holdReason: 'Legacy inventory reconciliation pending.',
    discountEligible: false,
    discountDate: '',
    paymentMethod: 'Bank transfer',
    disputed: true,
    exceptionReason: 'Quantity variance between GRN and invoice needs controller sign-off.',
    description: 'Legacy medicine replenishment shipment',
    timeline: [
      {
        label: 'Escalated to CFO',
        status: 'critical',
        tone: 'error',
        time: '21 Mar 2026',
        description: 'Aging exceeded treasury tolerance.',
      },
    ],
    notes: [
      {
        date: '2026-03-21',
        author: 'Finance Controller',
        message: 'Investigating stock variance before settlement.',
      },
    ],
  },
  {
    id: 'bill-ap-007',
    number: 'BILL-AP-007',
    supplierId: 'sup-2003',
    issueDate: '2026-03-25',
    dueDate: '2026-04-09',
    total: 18800,
    paidAmount: 0,
    status: 'posted',
    approvalState: 'approved',
    paymentStage: 'Scheduled',
    scheduledPaymentDate: '2026-04-08',
    approvalOwner: 'AP Desk',
    holdReason: '',
    discountEligible: false,
    discountDate: '',
    paymentMethod: 'Bank transfer',
    disputed: false,
    exceptionReason: '',
    description: 'Supplemental remote classroom licenses',
    timeline: [
      {
        label: 'Added to next payment run',
        status: 'queued',
        tone: 'info',
        time: '29 Mar 2026',
        description: 'Aligned with early April treasury calendar.',
      },
    ],
    notes: [{ date: '2026-03-29', author: 'AP Desk', message: 'No exceptions identified.' }],
  },
  {
    id: 'bill-ap-008',
    number: 'BILL-AP-008',
    supplierId: 'sup-2004',
    issueDate: '2026-03-05',
    dueDate: '2026-04-04',
    total: 34000,
    paidAmount: 10000,
    status: 'partial',
    approvalState: 'approved',
    paymentStage: 'Installment agreed',
    scheduledPaymentDate: '2026-04-03',
    approvalOwner: 'Treasury',
    holdReason: '',
    discountEligible: false,
    discountDate: '',
    paymentMethod: 'Cheque',
    disputed: false,
    exceptionReason: '',
    description: 'District outreach print packs',
    timeline: [
      {
        label: 'Split payment approved',
        status: 'partial',
        tone: 'warning',
        time: '27 Mar 2026',
        description: 'Balance aligned with next donor release.',
      },
    ],
    notes: [
      { date: '2026-03-27', author: 'Treasury', message: 'Supplier accepted staged settlement.' },
    ],
  },
];

export const PAYABLE_STATEMENTS = [
  {
    id: 'stmt-ap-001',
    supplierId: 'sup-2001',
    periodLabel: 'March 2026 Supplier Statement',
    startDate: '2026-03-01',
    endDate: '2026-03-29',
    releaseStatus: 'queued',
    approvalState: 'approved',
    reconciliationNote: 'One legacy bill remains under inventory reconciliation.',
    vendorStatementBalance: 258000,
    reconciliationStatus: 'review',
    disputeNote: 'Legacy shipment quantity variance remains open.',
    statementReceivedOn: '2026-03-27',
  },
  {
    id: 'stmt-ap-002',
    supplierId: 'sup-2002',
    periodLabel: 'Exception Review Statement',
    startDate: '2026-03-01',
    endDate: '2026-03-29',
    releaseStatus: 'draft',
    approvalState: 'review',
    reconciliationNote: 'Hold until freight surcharge review is completed.',
    vendorStatementBalance: 101500,
    reconciliationStatus: 'blocked',
    disputeNote: 'Vendor statement includes disputed surcharge line.',
    statementReceivedOn: '2026-03-28',
  },
  {
    id: 'stmt-ap-003',
    supplierId: 'sup-2003',
    periodLabel: 'Quarter-End Payables Statement',
    startDate: '2026-01-01',
    endDate: '2026-03-29',
    releaseStatus: 'released',
    approvalState: 'approved',
    reconciliationNote: 'Statement reflects prompt-pay discount timing.',
    vendorStatementBalance: 60800,
    reconciliationStatus: 'matched',
    disputeNote: '',
    statementReceivedOn: '2026-03-26',
  },
  {
    id: 'stmt-ap-004',
    supplierId: 'sup-2005',
    periodLabel: 'Urgent Catering Statement',
    startDate: '2026-03-01',
    endDate: '2026-03-29',
    releaseStatus: 'queued',
    approvalState: 'pending',
    reconciliationNote: 'Release after workshop attendance documentation is complete.',
    vendorStatementBalance: 28500,
    reconciliationStatus: 'review',
    disputeNote: 'Vendor requested confirmation of event attendance pack.',
    statementReceivedOn: '2026-03-29',
  },
];

function getSupplierRiskFlags(supplier, bills) {
  const riskFlags = [];

  if (supplier.riskLevel === 'high') riskFlags.push('High risk vendor');
  if (supplier.holdFlags) riskFlags.push(`${supplier.holdFlags} hold flags`);
  if (bills.some((bill) => bill.disputed)) riskFlags.push('Dispute active');
  if (bills.some((bill) => bill.discountEligible && bill.balanceDue > 0))
    riskFlags.push('Discount opportunity');

  return riskFlags;
}

function getLastPaymentDate(bills) {
  return (
    bills
      .filter((bill) => bill.paidAmount > 0)
      .map((bill) => bill.scheduledPaymentDate || bill.dueDate || '')
      .filter(Boolean)
      .sort()
      .at(-1) || 'No payment history'
  );
}

function getDueGroup(bill) {
  if (bill.overdueDays > 0) return 'Overdue now';
  if (bill.dueInDays <= 3) return 'Next 3 days';
  if (bill.dueInDays <= 7) return 'This week';
  return 'Later this cycle';
}

function reportDate(cutoffDate = REPORT_DATE) {
  return new Date(`${cutoffDate}T00:00:00`);
}

export function getSupplierById(id) {
  return PAYABLE_SUPPLIERS.find((supplier) => supplier.id === id) || null;
}

export function getBillById(id) {
  const bill = PAYABLE_BILLS.map(mergePayableBill).find((item) => item.id === id);
  return bill ? enrichBill(bill) : null;
}

export function daysPastDue(dueDate, cutoffDate = REPORT_DATE) {
  const diff = reportDate(cutoffDate).getTime() - new Date(`${dueDate}T00:00:00`).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

export function daysUntilDue(dueDate, cutoffDate = REPORT_DATE) {
  const diff = new Date(`${dueDate}T00:00:00`).getTime() - reportDate(cutoffDate).getTime();
  return Math.ceil(diff / 86400000);
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

export function getPriority(bill, cutoffDate = REPORT_DATE) {
  const balanceDue = Math.max(0, bill.total - bill.paidAmount);
  const overdueDays = balanceDue > 0 ? daysPastDue(bill.dueDate, cutoffDate) : 0;
  const dueInDays = balanceDue > 0 ? daysUntilDue(bill.dueDate, cutoffDate) : 0;

  if (bill.holdReason || bill.disputed || overdueDays > 60) return 'critical';
  if (overdueDays > 15) return 'high';
  if (dueInDays <= 7) return 'urgent';
  return 'scheduled';
}

export function enrichBill(bill, cutoffDate = REPORT_DATE) {
  const balanceDue = Math.max(0, bill.total - bill.paidAmount);
  const overdueDays = balanceDue > 0 ? daysPastDue(bill.dueDate, cutoffDate) : 0;
  const bucketId = balanceDue > 0 ? getBucketId(overdueDays) : 'closed';

  return {
    ...bill,
    supplier: getSupplierById(bill.supplierId),
    balanceDue,
    overdueDays,
    dueInDays: balanceDue > 0 ? daysUntilDue(bill.dueDate, cutoffDate) : 0,
    bucketId,
    bucketLabel: bucketId === 'closed' ? 'Closed' : getBucketLabel(bucketId),
    priority: getPriority(bill, cutoffDate),
  };
}

export function getPayableBills(cutoffDate = REPORT_DATE) {
  return PAYABLE_BILLS.map(mergePayableBill).map((bill) => enrichBill(bill, cutoffDate));
}

export function getSupplierLedgerRows(cutoffDate = REPORT_DATE) {
  return PAYABLE_SUPPLIERS.map((supplier) => {
    const bills = getPayableBills(cutoffDate).filter((item) => item.supplierId === supplier.id);
    const outstanding = bills.reduce((sum, item) => sum + item.balanceDue, 0);
    const overdueBills = bills.filter((item) => item.balanceDue > 0 && item.overdueDays > 0);
    const disputedBills = bills.filter((item) => item.disputed).length;
    const blockedBills = bills.filter((item) => item.holdReason || item.disputed).length;

    return {
      ...supplier,
      bills,
      outstanding,
      billCount: bills.filter((item) => item.balanceDue > 0).length,
      totalBilled: bills.reduce((sum, item) => sum + item.total, 0),
      totalPaid: bills.reduce((sum, item) => sum + item.paidAmount, 0),
      overdueBills: overdueBills.length,
      disputedBills,
      blockedBills,
      oldestDays: overdueBills.length
        ? Math.max(...overdueBills.map((item) => item.overdueDays))
        : 0,
      pendingApprovals: bills.filter((item) => item.approvalState !== 'approved').length,
      nextPaymentDate:
        bills.find((item) => item.scheduledPaymentDate)?.scheduledPaymentDate || 'Not scheduled',
      lastPaymentDate: getLastPaymentDate(bills),
      paymentHistoryCount: bills.filter((item) => item.paidAmount > 0).length,
      riskFlags: getSupplierRiskFlags(supplier, bills),
    };
  });
}

export function getPayableAgingBuckets(cutoffDate = REPORT_DATE) {
  const openBills = getPayableBills(cutoffDate).filter((bill) => bill.balanceDue > 0);
  const bucketIds = ['not-due', '1-30', '31-60', '61-90', '90-plus'];

  return bucketIds.map((bucketId) => {
    const bills = openBills.filter((bill) => bill.bucketId === bucketId);
    return {
      id: bucketId,
      label: getBucketLabel(bucketId),
      amount: bills.reduce((sum, bill) => sum + bill.balanceDue, 0),
      count: bills.length,
      approvals: bills.filter((bill) => bill.approvalState !== 'approved').length,
      holds: bills.filter((bill) => bill.holdReason).length,
      disputed: bills.filter((bill) => bill.disputed).length,
      discountEligible: bills.filter((bill) => bill.discountEligible).length,
      blockedSuppliers: new Set(
        bills.filter((bill) => bill.holdReason || bill.disputed).map((bill) => bill.supplierId)
      ).size,
      priorityMix: {
        critical: bills.filter((bill) => bill.priority === 'critical').length,
        high: bills.filter((bill) => bill.priority === 'high').length,
        urgent: bills.filter((bill) => bill.priority === 'urgent').length,
      },
      bills,
    };
  });
}

export function getUnpaidBills(cutoffDate = REPORT_DATE) {
  return getPayableBills(cutoffDate)
    .filter((bill) => bill.balanceDue > 0)
    .sort((left, right) => right.overdueDays - left.overdueDays);
}

export function getPaymentSchedule(cutoffDate = REPORT_DATE) {
  return getPayableBills(cutoffDate)
    .filter((bill) => bill.balanceDue > 0)
    .map((bill) => ({
      ...bill,
      dueGroup: getDueGroup(bill),
      cashForecastBucket:
        bill.overdueDays > 0
          ? 'Catch-up cash need'
          : bill.dueInDays <= 7
            ? 'Near-term liquidity'
            : 'Planned cash run',
    }))
    .sort((left, right) => new Date(left.dueDate) - new Date(right.dueDate));
}

export function getSupplierStatementList(cutoffDate = REPORT_DATE) {
  return PAYABLE_STATEMENTS.map(mergePayableStatement).map((statement) => {
    const bills = getPayableBills(cutoffDate).filter(
      (bill) => bill.supplierId === statement.supplierId
    );
    const openingBalance =
      bills.reduce((sum, bill) => sum + bill.total, 0) -
      bills.reduce((sum, bill) => sum + bill.paidAmount, 0);
    const closingBalance = bills.reduce((sum, bill) => sum + bill.balanceDue, 0);

    return {
      ...statement,
      supplier: getSupplierById(statement.supplierId),
      bills,
      openingBalance,
      closingBalance,
      holdCount: bills.filter((bill) => bill.holdReason).length,
      disputedCount: bills.filter((bill) => bill.disputed).length,
      reconciliationDifference: (statement.vendorStatementBalance || 0) - closingBalance,
    };
  });
}

export function getPayablesOverview(cutoffDate = REPORT_DATE) {
  const bills = getPayableBills(cutoffDate).filter((bill) => bill.balanceDue > 0);
  return {
    outstanding: bills.reduce((sum, bill) => sum + bill.balanceDue, 0),
    overdue: bills
      .filter((bill) => bill.overdueDays > 0)
      .reduce((sum, bill) => sum + bill.balanceDue, 0),
    approvalsWaiting: bills.filter((bill) => bill.approvalState !== 'approved').length,
    holds: bills.filter((bill) => bill.holdReason).length,
  };
}

export function getPayablesAlerts(cutoffDate = REPORT_DATE) {
  const buckets = getPayableAgingBuckets(cutoffDate);
  const overdueCritical = buckets.find((bucket) => bucket.id === '90-plus');

  return [
    {
      id: 'payables-alert-1',
      severity: overdueCritical?.amount ? 'error' : 'info',
      title: 'Legacy vendor liabilities require escalation',
      description: overdueCritical?.amount
        ? `${overdueCritical.count} bills remain above 90 overdue days with ${overdueCritical.holds} active holds.`
        : 'No 90+ day liabilities are open in the current mock set.',
    },
    {
      id: 'payables-alert-2',
      severity: 'warning',
      title: 'Approval queue still blocks urgent disbursements',
      description: `${getPayablesOverview(cutoffDate).approvalsWaiting} open bills still need approval clearance before treasury release.`,
    },
    {
      id: 'payables-alert-3',
      severity: 'info',
      title: 'Prompt-pay opportunities are available this week',
      description: `${getPayableBills(cutoffDate).filter((bill) => bill.discountEligible && bill.balanceDue > 0).length} bills can still capture early-settlement savings.`,
    },
  ];
}

export function getSupplierDetail(id, cutoffDate = REPORT_DATE) {
  const supplier = getSupplierLedgerRows(cutoffDate).find((item) => item.id === id);
  if (!supplier) return null;

  const statements = getSupplierStatementList(cutoffDate).filter(
    (statement) => statement.supplierId === id
  );

  return {
    supplier,
    bills: supplier.bills,
    statements,
    timeline: supplier.bills.flatMap((bill) => bill.timeline).slice(0, 6),
  };
}

export function getBucketDetail(bucketId, cutoffDate = REPORT_DATE) {
  return getPayableAgingBuckets(cutoffDate).find((bucket) => bucket.id === bucketId) || null;
}

export function getStatementDetail(id, cutoffDate = REPORT_DATE) {
  return getSupplierStatementList(cutoffDate).find((statement) => statement.id === id) || null;
}

export function subscribePayablesWorkspace(listener) {
  payablesWorkspaceListeners.add(listener);

  return () => {
    payablesWorkspaceListeners.delete(listener);
  };
}

export function getPayablesWorkspaceVersion() {
  return payablesWorkspaceVersion;
}

export function schedulePayableBill(id, scheduleDraft = {}) {
  const current = getBillById(id);
  if (!current) return;

  payableBillOverrides.set(id, {
    ...payableBillOverrides.get(id),
    scheduledPaymentDate: scheduleDraft.date || current.scheduledPaymentDate || '',
    paymentMethod: scheduleDraft.method || current.paymentMethod,
    paymentStage: scheduleDraft.stage || 'Scheduled',
    paymentProposal:
      scheduleDraft.proposal || current.paymentProposal || 'Standard treasury proposal',
    notes: prependNote(current.notes, {
      date: REPORT_DATE,
      author: 'Treasury Workspace',
      message:
        scheduleDraft.note ||
        `Scheduled for ${scheduleDraft.date || current.scheduledPaymentDate || 'next run'} via ${scheduleDraft.method || current.paymentMethod}.`,
    }),
    timeline: appendTimelineEvent(current.timeline, {
      label: scheduleDraft.stage || 'Treasury rescheduled',
      status: 'queued',
      tone: 'info',
      time: '29 Mar 2026',
      description:
        scheduleDraft.note ||
        `Payment date updated to ${scheduleDraft.date || current.scheduledPaymentDate || 'next available slot'}.`,
    }),
  });

  emitPayablesWorkspaceChange();
}

export function schedulePayableBatch(billIds, scheduleDraft = {}) {
  billIds.forEach((id) => {
    const current = getBillById(id);
    if (!current) return;

    payableBillOverrides.set(id, {
      ...payableBillOverrides.get(id),
      scheduledPaymentDate: scheduleDraft.date || current.scheduledPaymentDate || '',
      paymentMethod: scheduleDraft.method || current.paymentMethod,
      paymentStage: scheduleDraft.stage || 'Batch scheduled',
      paymentProposal: scheduleDraft.proposal || 'Weekly treasury batch',
      notes: prependNote(current.notes, {
        date: REPORT_DATE,
        author: scheduleDraft.owner || 'Treasury Batch',
        message:
          scheduleDraft.note ||
          `Moved into ${scheduleDraft.proposal || 'weekly treasury batch'} for ${scheduleDraft.date || 'next run'}.`,
      }),
      timeline: appendTimelineEvent(current.timeline, {
        label: scheduleDraft.stage || 'Batch scheduled',
        status: 'queued',
        tone: 'info',
        time: '29 Mar 2026',
        description:
          scheduleDraft.note ||
          `Included in ${scheduleDraft.proposal || 'weekly treasury batch'} for ${scheduleDraft.date || 'next run'}.`,
      }),
    });
  });

  emitPayablesWorkspaceChange();
}

export function applyPayableBillWorkflow(billIds, workflow = {}) {
  billIds.forEach((id) => {
    const current = getBillById(id);
    if (!current) return;

    payableBillOverrides.set(id, {
      ...payableBillOverrides.get(id),
      paymentStage: workflow.stage || current.paymentStage,
      approvalState: workflow.approvalState || current.approvalState,
      approvalOwner: workflow.owner || current.approvalOwner,
      scheduledPaymentDate: workflow.date || current.scheduledPaymentDate,
      notes: workflow.note
        ? prependNote(current.notes, {
            date: REPORT_DATE,
            author: workflow.owner || 'Payables Workspace',
            message: workflow.note,
          })
        : current.notes,
      timeline: workflow.note
        ? appendTimelineEvent(current.timeline, {
            label: workflow.stage || 'Workflow updated',
            status: 'review',
            tone: workflow.approvalState === 'approved' ? 'success' : 'warning',
            time: '29 Mar 2026',
            description: workflow.note,
          })
        : current.timeline,
    });
  });

  emitPayablesWorkspaceChange();
}

export function togglePayableBillHold(id, holdDraft = {}) {
  const current = getBillById(id);
  if (!current) return;

  const releasing = !current.holdReason;

  payableBillOverrides.set(id, {
    ...payableBillOverrides.get(id),
    holdReason: releasing ? holdDraft.reason || 'Treasury hold applied from workspace.' : '',
    paymentStage: releasing ? 'On hold' : holdDraft.releaseStage || 'Treasury queue',
    notes: prependNote(current.notes, {
      date: REPORT_DATE,
      author: holdDraft.owner || 'Treasury Workspace',
      message: releasing
        ? holdDraft.reason || 'Payment hold applied pending review.'
        : holdDraft.note || 'Payment hold released and returned to treasury queue.',
    }),
    timeline: appendTimelineEvent(current.timeline, {
      label: releasing ? 'Hold applied' : 'Hold released',
      status: releasing ? 'warning' : 'success',
      tone: releasing ? 'warning' : 'success',
      time: '29 Mar 2026',
      description: releasing
        ? holdDraft.reason || 'Treasury hold applied pending review.'
        : holdDraft.note || 'Payment hold released and returned to treasury queue.',
    }),
  });

  emitPayablesWorkspaceChange();
}

export function releasePayableStatement(id) {
  const current = getStatementDetail(id);
  if (!current) return;

  payableStatementOverrides.set(id, {
    ...payableStatementOverrides.get(id),
    releaseStatus: 'released',
    reconciliationStatus: 'matched',
    reconciliationNote: `${current.reconciliationNote} Release confirmed from payables workspace.`,
  });

  emitPayablesWorkspaceChange();
}

export function queuePayableStatements(statementIds) {
  statementIds.forEach((id) => {
    const current = getStatementDetail(id);
    if (!current) return;

    payableStatementOverrides.set(id, {
      ...payableStatementOverrides.get(id),
      releaseStatus: 'queued',
    });
  });

  emitPayablesWorkspaceChange();
}

export function getPayableStatementPeriods() {
  return [...new Set(getSupplierStatementList().map((statement) => statement.periodLabel))];
}

export function reconcilePayableStatement(id, reconciliation = {}) {
  const current = getStatementDetail(id);
  if (!current) return;

  const vendorStatementBalance = Number(
    reconciliation.vendorStatementBalance ||
      current.vendorStatementBalance ||
      current.closingBalance
  );
  const difference = vendorStatementBalance - current.closingBalance;

  payableStatementOverrides.set(id, {
    ...payableStatementOverrides.get(id),
    vendorStatementBalance,
    reconciliationStatus: Math.abs(difference) < 1 ? 'matched' : reconciliation.status || 'review',
    disputeNote: reconciliation.disputeNote || current.disputeNote,
    reconciliationNote: reconciliation.note || current.reconciliationNote,
  });

  emitPayablesWorkspaceChange();
}
