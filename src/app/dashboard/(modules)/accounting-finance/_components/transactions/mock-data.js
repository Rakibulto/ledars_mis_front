export const TRANSACTION_LOCK_DATE = '2026-03-01';

export const MOCK_JOURNALS = [
  { id: 'sales', code: 'SAL', name: 'Sales Journal', type: 'sales' },
  { id: 'purchase', code: 'PUR', name: 'Purchase Journal', type: 'purchase' },
  { id: 'bank', code: 'BNK', name: 'Bank Journal', type: 'bank' },
  { id: 'general', code: 'GEN', name: 'General Journal', type: 'general' },
  { id: 'payroll', code: 'PAY', name: 'Payroll Journal', type: 'general' },
];

export const MOCK_JOURNAL_ENTRIES = [
  {
    id: 'je-2026-031',
    number: 'JE-2026-031',
    date: '2026-03-04',
    journal_id: 'general',
    reference: 'GRANT-REV-MAR',
    narration: 'Grant revenue recognition for March community support tranche.',
    status: 'posted',
    approvalState: 'approved',
    recurring: false,
    locked: true,
    preparedBy: 'Nusrat Jahan',
    reviewer: 'Finance Manager',
    tags: ['month-end', 'grant'],
    attachmentCount: 3,
    lines: [
      {
        description: 'Recognize donor receivable',
        account_id: '1101',
        account_code: '1101',
        account_name: 'Donor Receivables',
        analytic: 'Education Program',
        taxCode: 'N/A',
        debit: 185000,
        credit: 0,
      },
      {
        description: 'Recognize grant revenue',
        account_id: '4101',
        account_code: '4101',
        account_name: 'Grant Revenue',
        analytic: 'Education Program',
        taxCode: 'N/A',
        debit: 0,
        credit: 185000,
      },
    ],
    attachments: [
      { id: 'att-1', name: 'Grant schedule.pdf', type: 'PDF', uploadedAt: '2026-03-03 09:21' },
      { id: 'att-2', name: 'Recognition memo.docx', type: 'DOCX', uploadedAt: '2026-03-03 09:28' },
      { id: 'att-3', name: 'Approval-email.msg', type: 'MSG', uploadedAt: '2026-03-03 09:41' },
    ],
    activity: [
      {
        id: 'act-1',
        type: 'note',
        author: 'Nusrat Jahan',
        time: '03 Mar, 09:10',
        message: 'Prepared based on donor release calendar.',
      },
      {
        id: 'act-2',
        type: 'approval',
        author: 'Finance Manager',
        time: '03 Mar, 10:15',
        message: 'Approved for posting after supporting documents review.',
      },
      {
        id: 'act-3',
        type: 'post',
        author: 'System',
        time: '04 Mar, 08:05',
        message: 'Journal posted to March 2026 period.',
      },
    ],
  },
  {
    id: 'je-2026-032',
    number: 'JE-2026-032',
    date: '2026-03-09',
    journal_id: 'purchase',
    reference: 'MED-SUP-447',
    narration: 'Medical supply accrual pending final vendor confirmation.',
    status: 'draft',
    approvalState: 'pending_review',
    recurring: false,
    locked: false,
    preparedBy: 'Rashed Karim',
    reviewer: 'Procurement Finance',
    tags: ['accrual', 'medical'],
    attachmentCount: 2,
    lines: [
      {
        description: 'Medical supplies expense',
        account_id: '5201',
        account_code: '5201',
        account_name: 'Medical Supplies Expense',
        analytic: 'Health Outreach',
        taxCode: 'VAT-5',
        debit: 94000,
        credit: 0,
      },
      {
        description: 'Input VAT',
        account_id: '1304',
        account_code: '1304',
        account_name: 'Input VAT Recoverable',
        analytic: 'Health Outreach',
        taxCode: 'VAT-5',
        debit: 4700,
        credit: 0,
      },
      {
        description: 'Accrued expenses',
        account_id: '2108',
        account_code: '2108',
        account_name: 'Accrued Expenses',
        analytic: 'Health Outreach',
        taxCode: 'N/A',
        debit: 0,
        credit: 98700,
      },
    ],
    attachments: [
      { id: 'att-4', name: 'PO-447.pdf', type: 'PDF', uploadedAt: '08 Mar, 15:20' },
      { id: 'att-5', name: 'Receiving-note.pdf', type: 'PDF', uploadedAt: '08 Mar, 17:44' },
    ],
    activity: [
      {
        id: 'act-4',
        type: 'note',
        author: 'Rashed Karim',
        time: '08 Mar, 15:52',
        message: 'Waiting for vendor tax invoice before final post.',
      },
      {
        id: 'act-5',
        type: 'task',
        author: 'Procurement Finance',
        time: '08 Mar, 18:05',
        message: 'Check three-way match against GRN and PO.',
      },
    ],
  },
  {
    id: 'je-2026-033',
    number: 'JE-2026-033',
    date: '2026-03-12',
    journal_id: 'bank',
    reference: 'BANK-RECON-033',
    narration: 'Bank fee and forex adjustment prepared from reconciliation queue.',
    status: 'pending',
    approvalState: 'pending_approval',
    recurring: true,
    recurringLabel: 'Monthly bank charges',
    locked: false,
    preparedBy: 'Treasury Analyst',
    reviewer: 'Controller',
    tags: ['bank', 'recurring'],
    attachmentCount: 1,
    lines: [
      {
        description: 'Bank charges expense',
        account_id: '6302',
        account_code: '6302',
        account_name: 'Bank Charges',
        analytic: 'Operations Support',
        taxCode: 'N/A',
        debit: 2800,
        credit: 0,
      },
      {
        description: 'Forex revaluation reserve',
        account_id: '7501',
        account_code: '7501',
        account_name: 'Forex Gain or Loss',
        analytic: 'Operations Support',
        taxCode: 'N/A',
        debit: 1200,
        credit: 0,
      },
      {
        description: 'Operating bank account',
        account_id: '1001',
        account_code: '1001',
        account_name: 'Operating Bank Account',
        analytic: 'Operations Support',
        taxCode: 'N/A',
        debit: 0,
        credit: 4000,
      },
    ],
    attachments: [
      { id: 'att-6', name: 'Mar-bank-statement.csv', type: 'CSV', uploadedAt: '12 Mar, 08:13' },
    ],
    activity: [
      {
        id: 'act-6',
        type: 'note',
        author: 'Treasury Analyst',
        time: '12 Mar, 08:30',
        message: 'Recurring bank charge entry generated from monthly schedule.',
      },
    ],
  },
  {
    id: 'je-2026-034',
    number: 'JE-2026-034',
    date: '2026-03-14',
    journal_id: 'payroll',
    reference: 'PAY-MAR-ACCR',
    narration: 'March payroll accrual including field allowance split by cost center.',
    status: 'draft',
    approvalState: 'needs_changes',
    recurring: true,
    recurringLabel: 'Monthly payroll accrual',
    locked: false,
    preparedBy: 'Payroll Officer',
    reviewer: 'HR Finance Lead',
    tags: ['payroll', 'allocation'],
    attachmentCount: 4,
    lines: [
      {
        description: 'Salary expense - programs',
        account_id: '6101',
        account_code: '6101',
        account_name: 'Salary Expense',
        analytic: 'Education Program',
        taxCode: 'N/A',
        debit: 102000,
        credit: 0,
      },
      {
        description: 'Salary expense - operations',
        account_id: '6101',
        account_code: '6101',
        account_name: 'Salary Expense',
        analytic: 'Operations Support',
        taxCode: 'N/A',
        debit: 48000,
        credit: 0,
      },
      {
        description: 'Payroll liability',
        account_id: '2201',
        account_code: '2201',
        account_name: 'Payroll Liability',
        analytic: 'Shared Services',
        taxCode: 'N/A',
        debit: 0,
        credit: 150000,
      },
    ],
    attachments: [
      { id: 'att-7', name: 'Payroll-register.xlsx', type: 'XLSX', uploadedAt: '14 Mar, 11:20' },
      { id: 'att-8', name: 'Approval-routing.png', type: 'PNG', uploadedAt: '14 Mar, 11:25' },
    ],
    activity: [
      {
        id: 'act-7',
        type: 'comment',
        author: 'HR Finance Lead',
        time: '14 Mar, 12:10',
        message: 'Recheck allowance split between programs and shared services.',
      },
    ],
  },
];

export const MOCK_CUSTOMERS = [
  {
    id: 'cust-1',
    name: 'UNICEF Regional Office',
    email: 'finance@unicef.org',
    creditLimit: 350000,
    risk: 'low',
  },
  {
    id: 'cust-2',
    name: 'Save The Children',
    email: 'ap@stc.org',
    creditLimit: 240000,
    risk: 'medium',
  },
  {
    id: 'cust-3',
    name: 'BRAC Social Innovation',
    email: 'accounts@brac.net',
    creditLimit: 180000,
    risk: 'high',
  },
];

export const MOCK_INVOICES = [
  {
    id: 'inv-26031',
    number: 'INV-2026-031',
    customer_id: 'cust-1',
    date: '2026-03-02',
    due_date: '2026-03-20',
    status: 'partial',
    dunningStage: 'stage_2',
    recurring: false,
    paymentTerms: 'Net 20',
    servicePeriod: 'March 2026',
    billingOwner: 'Accounts Receivable',
    billingReference: 'SOW-EDU-031',
    subtotal: 128000,
    tax_amount: 6400,
    total: 134400,
    paid_amount: 74400,
    balance_due: 60000,
    creditWarning: false,
    promiseToPay: '2026-03-26',
    lines: [
      {
        description: 'Program management fee',
        quantity: 1,
        unit_price: 78000,
        amount: 78000,
        analytic: 'Education Program',
      },
      {
        description: 'Monitoring and reporting services',
        quantity: 1,
        unit_price: 50000,
        amount: 50000,
        analytic: 'Education Program',
      },
    ],
    allocations: [
      { date: '2026-03-10', amount: 50000, method: 'Bank transfer', reference: 'RCPT-0092' },
      { date: '2026-03-15', amount: 24400, method: 'Offset', reference: 'RCPT-0094' },
    ],
    linkedJournals: ['JE-2026-031', 'JE-2026-033'],
    attachments: [
      { id: 'inv-att-1', name: 'Invoice-PDF.pdf', type: 'PDF' },
      { id: 'inv-att-2', name: 'Donor-contract.pdf', type: 'PDF' },
    ],
    chatter: [
      {
        id: 'chat-1',
        author: 'Accounts Receivable',
        time: '15 Mar, 11:08',
        message: 'Customer confirmed partial settlement and asked for revised statement.',
      },
      {
        id: 'chat-2',
        author: 'Collections Lead',
        time: '17 Mar, 15:40',
        message: 'Stage 2 reminder sent with copy to donor focal point.',
      },
    ],
  },
  {
    id: 'inv-26032',
    number: 'INV-2026-032',
    customer_id: 'cust-2',
    date: '2026-03-08',
    due_date: '2026-03-25',
    status: 'sent',
    dunningStage: 'none',
    recurring: true,
    recurringLabel: 'Monthly monitoring retainer',
    paymentTerms: 'Net 15',
    servicePeriod: 'March 2026',
    billingOwner: 'AR Officer',
    billingReference: 'RET-MAR-2026',
    subtotal: 86000,
    tax_amount: 4300,
    total: 90300,
    paid_amount: 0,
    balance_due: 90300,
    creditWarning: false,
    promiseToPay: null,
    lines: [
      {
        description: 'Monitoring retainer - March',
        quantity: 1,
        unit_price: 86000,
        amount: 86000,
        analytic: 'Operations Support',
      },
    ],
    allocations: [],
    linkedJournals: ['JE-2026-032'],
    attachments: [{ id: 'inv-att-3', name: 'Retainer-SOW.pdf', type: 'PDF' }],
    chatter: [
      {
        id: 'chat-3',
        author: 'AR Officer',
        time: '08 Mar, 14:02',
        message: 'Invoice emailed and shared on partner portal.',
      },
    ],
  },
  {
    id: 'inv-26033',
    number: 'INV-2026-033',
    customer_id: 'cust-3',
    date: '2026-02-14',
    due_date: '2026-03-01',
    status: 'overdue',
    dunningStage: 'stage_3',
    recurring: false,
    paymentTerms: 'Net 15',
    servicePeriod: 'February 2026',
    billingOwner: 'Collections Lead',
    billingReference: 'WS-CAP-033',
    subtotal: 72000,
    tax_amount: 3600,
    total: 75600,
    paid_amount: 0,
    balance_due: 75600,
    creditWarning: true,
    promiseToPay: '2026-03-30',
    lines: [
      {
        description: 'Capacity-building workshop',
        quantity: 3,
        unit_price: 24000,
        amount: 72000,
        analytic: 'Social Innovation',
      },
    ],
    allocations: [],
    linkedJournals: ['JE-2026-030'],
    attachments: [{ id: 'inv-att-4', name: 'Workshop-acceptance.pdf', type: 'PDF' }],
    chatter: [
      {
        id: 'chat-4',
        author: 'Collections Lead',
        time: '21 Mar, 10:11',
        message: 'Escalated to finance director after no reply to stage 2 dunning.',
      },
    ],
  },
];

export const MOCK_VENDORS = [
  {
    id: 'ven-1',
    name: 'HealthServe Supplies Ltd',
    email: 'ap@healthserve.com',
    rating: 'A',
    disputeFlag: false,
  },
  {
    id: 'ven-2',
    name: 'Office Depot Dhaka',
    email: 'finance@officedepot.bd',
    rating: 'B',
    disputeFlag: false,
  },
  {
    id: 'ven-3',
    name: 'Green Logistics',
    email: 'billing@greenlogistics.net',
    rating: 'B',
    disputeFlag: true,
  },
];

export const MOCK_VENDOR_BILLS = [
  {
    id: 'bill-26021',
    number: 'BILL-2026-021',
    supplier_id: 'ven-1',
    date: '2026-03-05',
    due_date: '2026-03-27',
    status: 'received',
    subtotal: 94000,
    tax_amount: 4700,
    total: 98700,
    paid_amount: 0,
    balance_due: 98700,
    matchStatus: '3-way matched',
    disputeFlag: false,
    paymentProposal: 'Next run - 27 Mar',
    approvalRoute: 'Finance Controller',
    supplierInvoiceRef: 'HSV-11984',
    goodsReceiptRef: 'GRN-884',
    lines: [
      {
        description: 'Sterile kits',
        quantity: 120,
        unit_price: 450,
        amount: 54000,
        matched: true,
        analytic: 'Medical Program',
      },
      {
        description: 'Protective gloves',
        quantity: 250,
        unit_price: 160,
        amount: 40000,
        matched: true,
        analytic: 'Medical Program',
      },
    ],
    attachments: [
      { id: 'bill-att-1', name: 'Vendor-invoice.pdf', type: 'PDF' },
      { id: 'bill-att-2', name: 'GRN-884.pdf', type: 'PDF' },
      { id: 'bill-att-3', name: 'PO-447.pdf', type: 'PDF' },
    ],
    linkedJournals: ['JE-2026-032'],
    chatter: [
      {
        id: 'bchat-1',
        author: 'Procurement Finance',
        time: '09 Mar, 11:04',
        message: 'Three-way match confirmed, ready for validation.',
      },
    ],
  },
  {
    id: 'bill-26022',
    number: 'BILL-2026-022',
    supplier_id: 'ven-2',
    date: '2026-03-11',
    due_date: '2026-03-30',
    status: 'draft',
    subtotal: 36200,
    tax_amount: 1810,
    total: 38010,
    paid_amount: 0,
    balance_due: 38010,
    matchStatus: 'Awaiting receipt',
    disputeFlag: false,
    paymentProposal: 'Hold until validation',
    approvalRoute: 'AP Officer',
    supplierInvoiceRef: 'ODD-2331',
    goodsReceiptRef: 'Pending warehouse receipt',
    lines: [
      {
        description: 'Printer cartridges',
        quantity: 10,
        unit_price: 2200,
        amount: 22000,
        matched: false,
        analytic: 'Head Office Admin',
      },
      {
        description: 'Stationery pack',
        quantity: 8,
        unit_price: 1775,
        amount: 14200,
        matched: false,
        analytic: 'Head Office Admin',
      },
    ],
    attachments: [{ id: 'bill-att-4', name: 'Draft-bill.pdf', type: 'PDF' }],
    linkedJournals: [],
    chatter: [
      {
        id: 'bchat-2',
        author: 'AP Officer',
        time: '12 Mar, 09:16',
        message: 'Waiting for goods receipt confirmation from admin store.',
      },
    ],
  },
  {
    id: 'bill-26023',
    number: 'BILL-2026-023',
    supplier_id: 'ven-3',
    date: '2026-02-28',
    due_date: '2026-03-10',
    status: 'overdue',
    subtotal: 51000,
    tax_amount: 2550,
    total: 53550,
    paid_amount: 12000,
    balance_due: 41550,
    matchStatus: 'Disputed quantity',
    disputeFlag: true,
    paymentProposal: 'Blocked',
    approvalRoute: 'Procurement Finance',
    supplierInvoiceRef: 'GL-8872',
    goodsReceiptRef: 'DISPUTED-GRN-221',
    lines: [
      {
        description: 'Field vehicle transport',
        quantity: 15,
        unit_price: 3400,
        amount: 51000,
        matched: false,
        analytic: 'Field Logistics',
      },
    ],
    attachments: [
      { id: 'bill-att-5', name: 'Vendor-bill.pdf', type: 'PDF' },
      { id: 'bill-att-6', name: 'Dispute-note.docx', type: 'DOCX' },
    ],
    linkedJournals: ['JE-2026-029'],
    chatter: [
      {
        id: 'bchat-3',
        author: 'Logistics Lead',
        time: '14 Mar, 13:48',
        message: 'Mileage mismatch disputed with supplier, payment partially withheld.',
      },
    ],
  },
];

export const MOCK_CUSTOMER_RECEIPTS = [
  {
    id: 'rcpt-26091',
    number: 'RCPT-2026-091',
    customer_id: 'cust-1',
    date: '2026-03-18',
    method: 'Bank transfer',
    bankAccount: 'Operating Bank Account',
    amount: 50000,
    unappliedAmount: 0,
    status: 'posted',
    allocationStatus: 'fully_allocated',
    reference: 'INV-2026-031',
    collectionOwner: 'Collections Desk',
    remittanceAdvice: 'Bank memo received and matched to donor settlement',
    allocations: [{ invoice_id: 'inv-26031', amount: 50000 }],
    notes: 'Allocated against March donor invoice.',
  },
  {
    id: 'rcpt-26092',
    number: 'RCPT-2026-092',
    customer_id: 'cust-3',
    date: '2026-03-24',
    method: 'Mobile banking',
    bankAccount: 'Collections Clearing',
    amount: 12000,
    unappliedAmount: 12000,
    status: 'draft',
    allocationStatus: 'unallocated',
    reference: 'Advance collection pending matching',
    collectionOwner: 'Receivables Analyst',
    remittanceAdvice: 'Customer mobile transfer screenshot pending invoice reference',
    allocations: [],
    notes: 'Customer sent proof but invoice reference missing.',
  },
  {
    id: 'rcpt-26093',
    number: 'RCPT-2026-093',
    customer_id: 'cust-2',
    date: '2026-03-27',
    method: 'Wire transfer',
    bankAccount: 'Operating Bank Account',
    amount: 30000,
    unappliedAmount: 5900,
    status: 'posted',
    allocationStatus: 'partially_allocated',
    reference: 'INV-2026-032',
    collectionOwner: 'Collections Lead',
    remittanceAdvice: 'Wire transfer credited net of banking charges',
    allocations: [{ invoice_id: 'inv-26032', amount: 24100 }],
    notes: 'Residual amount held for bank fee clarification.',
  },
];

export const MOCK_SUPPLIER_PAYMENTS = [
  {
    id: 'pay-26061',
    number: 'PAY-2026-061',
    supplier_id: 'ven-1',
    date: '2026-03-27',
    method: 'Bank transfer',
    bankAccount: 'Operating Bank Account',
    amount: 45000,
    status: 'posted',
    releaseStatus: 'released',
    paymentRun: 'RUN-MAR-03',
    billRefs: ['BILL-2026-021'],
    approvalRoute: 'Finance Controller',
    settlementReference: 'BANK-REL-061',
    notes: 'Partial settlement released in March run.',
  },
  {
    id: 'pay-26062',
    number: 'PAY-2026-062',
    supplier_id: 'ven-2',
    date: '2026-03-29',
    method: 'Cheque',
    bankAccount: 'AP Clearing',
    amount: 18000,
    status: 'draft',
    releaseStatus: 'queued',
    paymentRun: 'RUN-APR-01',
    billRefs: ['BILL-2026-022'],
    approvalRoute: 'AP Supervisor',
    settlementReference: 'CHQ-HOLD-062',
    notes: 'Waiting validation before release.',
  },
  {
    id: 'pay-26063',
    number: 'PAY-2026-063',
    supplier_id: 'ven-3',
    date: '2026-03-20',
    method: 'Wire transfer',
    bankAccount: 'Operating Bank Account',
    amount: 12000,
    status: 'posted',
    releaseStatus: 'blocked',
    paymentRun: 'RUN-MAR-02',
    billRefs: ['BILL-2026-023'],
    approvalRoute: 'Treasury Manager',
    settlementReference: 'WIRE-BLOCK-063',
    notes: 'Held after dispute escalation on quantity mismatch.',
  },
];

export const MOCK_DEBIT_NOTES = [
  {
    id: 'dn-26011',
    number: 'DN-2026-011',
    supplier_id: 'ven-3',
    bill_ref: 'BILL-2026-023',
    date: '2026-03-22',
    amount: 9500,
    reason: 'Short delivery adjustment',
    status: 'draft',
    applicationStatus: 'pending',
    adjustmentType: 'Short delivery',
    approvalRoute: 'Procurement Finance',
    disputeReference: 'DISP-023-A',
    notes: 'Awaiting supplier acknowledgment before application.',
  },
  {
    id: 'dn-26012',
    number: 'DN-2026-012',
    supplier_id: 'ven-1',
    bill_ref: 'BILL-2026-021',
    date: '2026-03-26',
    amount: 3200,
    reason: 'Rate correction',
    status: 'applied',
    applicationStatus: 'applied',
    adjustmentType: 'Rate correction',
    approvalRoute: 'Finance Controller',
    disputeReference: 'RATE-021',
    notes: 'Applied after supplier accepted revised commercial terms.',
  },
];

export const MOCK_CREDIT_NOTES = [
  {
    id: 'cn-26014',
    number: 'CN-2026-014',
    customer_id: 'cust-3',
    invoice_ref: 'INV-2026-033',
    date: '2026-03-25',
    amount: 5600,
    reason: 'Training session not delivered',
    status: 'draft',
    applicationStatus: 'pending',
    adjustmentType: 'Service reversal',
    approvalRoute: 'Receivables Manager',
    refundReference: 'CR-033-SRV',
    notes: 'Pending confirmation from project lead before offset.',
  },
  {
    id: 'cn-26015',
    number: 'CN-2026-015',
    customer_id: 'cust-1',
    invoice_ref: 'INV-2026-031',
    date: '2026-03-28',
    amount: 2400,
    reason: 'Pricing rebate per amendment',
    status: 'applied',
    applicationStatus: 'applied',
    adjustmentType: 'Pricing rebate',
    approvalRoute: 'Finance Director',
    refundReference: 'REBATE-031',
    notes: 'Applied against amendment-approved rebate schedule.',
  },
];

export const MOCK_VOUCHERS = [
  {
    id: 'vch-26001',
    number: 'VCH-2026-001',
    reference: 'Field office advance settlement',
    voucher_type: 'payment',
    partner_name: 'Dhaka Field Coordination Unit',
    journal_name: 'Cash Journal',
    date: '2026-03-10',
    amount: 12500,
    status: 'draft',
    approval_status: 'pending',
    payment_method_name: 'Cash',
    currency: 'USD',
  },
  {
    id: 'vch-26002',
    number: 'VCH-2026-002',
    reference: 'Supplier invoice adjustment',
    voucher_type: 'journal',
    partner_name: 'Bright Supplies Ltd',
    journal_name: 'Purchase Journal',
    date: '2026-03-12',
    amount: 28400,
    status: 'submitted',
    approval_status: 'in_review',
    payment_method_name: 'Bank Transfer',
    currency: 'USD',
  },
  {
    id: 'vch-26003',
    number: 'VCH-2026-003',
    reference: 'Program disbursement batch',
    voucher_type: 'receipt',
    partner_name: 'Education Access Grant',
    journal_name: 'Bank Journal',
    date: '2026-03-14',
    amount: 64000,
    status: 'approved',
    approval_status: 'approved',
    payment_method_name: 'Wire Transfer',
    currency: 'USD',
  },
  {
    id: 'vch-26004',
    number: 'VCH-2026-004',
    reference: 'Office rent accrual',
    voucher_type: 'journal',
    partner_name: 'City Property Management',
    journal_name: 'Miscellaneous Journal',
    date: '2026-03-18',
    amount: 18750,
    status: 'posted',
    approval_status: 'approved',
    payment_method_name: 'Auto Posting',
    currency: 'USD',
  },
];

export const MOCK_VOUCHER_APPROVALS = [
  {
    id: 'vapp-1',
    voucher_id: 'vch-26001',
    approver_name: 'Finance Manager',
    status: 'pending',
  },
  {
    id: 'vapp-2',
    voucher_id: 'vch-26002',
    approver_name: 'Finance Controller',
    status: 'pending',
  },
  {
    id: 'vapp-3',
    voucher_id: 'vch-26003',
    approver_name: 'Executive Director',
    status: 'approved',
  },
];

export const MOCK_VOUCHER_ATTACHMENTS = [
  { id: 'vatt-1', voucher_id: 'vch-26001' },
  { id: 'vatt-2', voucher_id: 'vch-26002' },
  { id: 'vatt-3', voucher_id: 'vch-26002' },
  { id: 'vatt-4', voucher_id: 'vch-26004' },
];

export const MOCK_BANK_DEPOSITS = [
  {
    id: 'dep-26001',
    number: 'DEP-2026-001',
    date: '2026-03-18',
    description: 'Weekly field collection deposit',
    bankAccount: 'Operating Bank Account',
    source: 'Cash collections',
    amount: 42000,
    status: 'posted',
    reconciliationStatus: 'reconciled',
    depositMethod: 'Counter deposit',
    depositSlipRef: 'SLIP-DEP-001',
    preparedBy: 'Treasury Associate',
  },
  {
    id: 'dep-26002',
    number: 'DEP-2026-002',
    date: '2026-03-26',
    description: 'Partner reimbursement lodged for deposit',
    bankAccount: 'Collections Clearing',
    source: 'Partner reimbursement',
    amount: 18500,
    status: 'draft',
    reconciliationStatus: 'pending',
    depositMethod: 'Cash-in-transit',
    depositSlipRef: 'SLIP-DEP-002',
    preparedBy: 'Finance Officer',
  },
];

export const MOCK_CASH_TRANSACTIONS = [
  {
    id: 'cash-26001',
    number: 'CASH-2026-001',
    date: '2026-03-17',
    description: 'Petty cash replenishment for field office',
    account: 'Petty Cash',
    counterparty: 'Field Office Coxs Bazar',
    amount: 9000,
    direction: 'outflow',
    status: 'posted',
    paymentMethod: 'Cash voucher',
    reference: 'CV-26001',
  },
  {
    id: 'cash-26002',
    number: 'CASH-2026-002',
    date: '2026-03-24',
    description: 'Refund of unused field advance',
    account: 'Petty Cash',
    counterparty: 'Field Office Rangpur',
    amount: 3500,
    direction: 'inflow',
    status: 'draft',
    paymentMethod: 'Manual receipt',
    reference: 'MR-26002',
  },
  {
    id: 'cash-26003',
    number: 'CASH-2026-003',
    date: '2026-03-28',
    description: 'Emergency transport cash expense',
    account: 'Petty Cash',
    counterparty: 'Transport Vendor',
    amount: 2200,
    direction: 'outflow',
    status: 'posted',
    paymentMethod: 'Cash reimbursement',
    reference: 'REIM-26003',
  },
];

export const MOCK_CONTRA_ENTRIES = [
  {
    id: 'contra-26001',
    number: 'CONTRA-2026-001',
    date: '2026-03-19',
    description: 'Transfer from operating bank to petty cash',
    fromAccount: 'Operating Bank Account',
    toAccount: 'Petty Cash',
    amount: 15000,
    status: 'posted',
    transferChannel: 'Cash replenishment',
    treasuryOwner: 'Treasury Associate',
    reference: 'TRF-26001',
  },
  {
    id: 'contra-26002',
    number: 'CONTRA-2026-002',
    date: '2026-03-27',
    description: 'Return surplus cash to operating bank',
    fromAccount: 'Petty Cash',
    toAccount: 'Operating Bank Account',
    amount: 5000,
    status: 'draft',
    transferChannel: 'Cash return',
    treasuryOwner: 'Cash Custodian',
    reference: 'TRF-26002',
  },
];

export const MOCK_DEFERRED_EXPENSES = [
  {
    id: 'defexp-26001',
    reference: 'PREPAID-INS-01',
    description: 'Annual insurance premium',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    periods: 12,
    total_amount: 120000,
    recognized_amount: 30000,
    status: 'in_progress',
    monthlyRecognition: 10000,
  },
  {
    id: 'defexp-26002',
    reference: 'PREPAID-RENT-02',
    description: 'Quarterly warehouse rent',
    start_date: '2026-02-01',
    end_date: '2026-04-30',
    periods: 3,
    total_amount: 54000,
    recognized_amount: 36000,
    status: 'in_progress',
    monthlyRecognition: 18000,
  },
  {
    id: 'defexp-26003',
    reference: 'PREPAID-LIC-03',
    description: 'Software license renewal',
    start_date: '2025-10-01',
    end_date: '2026-03-31',
    periods: 6,
    total_amount: 30000,
    recognized_amount: 30000,
    status: 'done',
    monthlyRecognition: 5000,
  },
];

export const MOCK_DEFERRED_REVENUE = [
  {
    id: 'defrev-26001',
    reference: 'UNEARNED-GRANT-01',
    description: 'Advance donor grant receipt',
    start_date: '2026-01-01',
    end_date: '2026-06-30',
    periods: 6,
    total_amount: 300000,
    recognized_amount: 150000,
    status: 'in_progress',
    monthlyRecognition: 50000,
  },
  {
    id: 'defrev-26002',
    reference: 'SERVICE-RET-02',
    description: 'Monitoring retainer received in advance',
    start_date: '2026-03-01',
    end_date: '2026-05-31',
    periods: 3,
    total_amount: 90000,
    recognized_amount: 30000,
    status: 'in_progress',
    monthlyRecognition: 30000,
  },
  {
    id: 'defrev-26003',
    reference: 'TUITION-OLD-03',
    description: 'Completed training revenue deferral',
    start_date: '2025-12-01',
    end_date: '2026-02-28',
    periods: 3,
    total_amount: 45000,
    recognized_amount: 45000,
    status: 'done',
    monthlyRecognition: 15000,
  },
];

export const MOCK_PAYROLL_ENTRIES = [
  {
    id: 'payroll-26001',
    number: 'PAYROLL-2026-001',
    date: '2026-03-14',
    description: 'March salary accrual - education and support teams',
    payrollCycle: 'March 2026',
    employeeCount: 42,
    grossAmount: 150000,
    netAmount: 128000,
    liabilityAmount: 22000,
    status: 'draft',
    periodStart: '2026-03-01',
    periodEnd: '2026-03-31',
    approvalRoute: 'Finance Controller',
    fundingSource: 'Education Grant',
  },
  {
    id: 'payroll-26002',
    number: 'PAYROLL-2026-002',
    date: '2026-02-28',
    description: 'February payroll posted',
    payrollCycle: 'February 2026',
    employeeCount: 41,
    grossAmount: 147500,
    netAmount: 126300,
    liabilityAmount: 21200,
    status: 'posted',
    periodStart: '2026-02-01',
    periodEnd: '2026-02-29',
    approvalRoute: 'Executive Director Approval',
    fundingSource: 'General Fund',
  },
];

export const MOCK_INVENTORY_ENTRIES = [
  {
    id: 'inventry-26001',
    number: 'INVJ-2026-001',
    date: '2026-03-11',
    description: 'Medical supplies received into central store',
    warehouse: 'Central Warehouse',
    category: 'Medical Supplies',
    amount: 98700,
    status: 'draft',
    movementType: 'Receipt',
    itemReference: 'MED-STORE-001',
    quantity: 420,
    unitCost: 235,
    procurementReference: 'GRN-884',
  },
  {
    id: 'inventry-26002',
    number: 'INVJ-2026-002',
    date: '2026-03-22',
    description: 'Inventory consumption booked for outreach camp',
    warehouse: 'Field Warehouse',
    category: 'Consumables',
    amount: 28500,
    status: 'posted',
    movementType: 'Issue',
    itemReference: 'CONS-CAMP-014',
    quantity: 150,
    unitCost: 190,
    procurementReference: 'ISSUE-227',
  },
];

export const MOCK_EXPENSE_ENTRIES = [
  {
    id: 'exp-26001',
    number: 'EXP-2026-001',
    date: '2026-03-13',
    description: 'Travel reimbursement claim batch',
    category: 'Travel and Logistics',
    employee: 'Program Team',
    amount: 16400,
    status: 'submitted',
    costCenter: 'Education',
    approvalRoute: 'Finance Manager',
    reference: 'CLAIM-26001',
  },
  {
    id: 'exp-26002',
    number: 'EXP-2026-002',
    date: '2026-03-25',
    description: 'Field training meal expense',
    category: 'Program Expenses',
    employee: 'Training Unit',
    amount: 8200,
    status: 'posted',
    costCenter: 'Field Support',
    approvalRoute: 'Program Director',
    reference: 'MEAL-26002',
  },
];

export const MOCK_TRANSACTION_ALERTS = [
  {
    id: 'tx-alert-1',
    severity: 'warning',
    title: '5 drafts need posting',
    detail: 'Draft journals and invoices are still open after review deadline.',
  },
  {
    id: 'tx-alert-2',
    severity: 'error',
    title: '1 vendor bill blocked',
    detail: 'Disputed quantity issue is preventing payment scheduling.',
  },
  {
    id: 'tx-alert-3',
    severity: 'info',
    title: 'Recurring entries due',
    detail: 'Two recurring journals should be generated before the period close.',
  },
];

export function getJournalById(id) {
  return MOCK_JOURNALS.find((item) => item.id === id);
}

export function getJournalEntryById(id) {
  return MOCK_JOURNAL_ENTRIES.find((item) => String(item.id) === String(id));
}

export function getCustomerById(id) {
  return MOCK_CUSTOMERS.find((item) => item.id === id);
}

export function getInvoiceById(id) {
  return MOCK_INVOICES.find((item) => String(item.id) === String(id));
}

export function getVendorById(id) {
  return MOCK_VENDORS.find((item) => item.id === id);
}

export function getBillById(id) {
  return MOCK_VENDOR_BILLS.find((item) => String(item.id) === String(id));
}

export function getReceiptById(id) {
  return MOCK_CUSTOMER_RECEIPTS.find((item) => String(item.id) === String(id));
}

export function getSupplierPaymentById(id) {
  return MOCK_SUPPLIER_PAYMENTS.find((item) => String(item.id) === String(id));
}

export function getDebitNoteById(id) {
  return MOCK_DEBIT_NOTES.find((item) => String(item.id) === String(id));
}

export function getCreditNoteById(id) {
  return MOCK_CREDIT_NOTES.find((item) => String(item.id) === String(id));
}

export function getVoucherById(id) {
  return MOCK_VOUCHERS.find((item) => String(item.id) === String(id));
}

export function getVoucherApprovalsById(voucherId) {
  return MOCK_VOUCHER_APPROVALS.filter((item) => String(item.voucher_id) === String(voucherId));
}

export function getVoucherAttachmentsById(voucherId) {
  return MOCK_VOUCHER_ATTACHMENTS.filter((item) => String(item.voucher_id) === String(voucherId));
}

export function getBankDepositById(id) {
  return MOCK_BANK_DEPOSITS.find((item) => String(item.id) === String(id));
}

export function getCashTransactionById(id) {
  return MOCK_CASH_TRANSACTIONS.find((item) => String(item.id) === String(id));
}

export function getContraEntryById(id) {
  return MOCK_CONTRA_ENTRIES.find((item) => String(item.id) === String(id));
}

export function getDeferredExpenseById(id) {
  return MOCK_DEFERRED_EXPENSES.find((item) => String(item.id) === String(id));
}

export function getDeferredRevenueById(id) {
  return MOCK_DEFERRED_REVENUE.find((item) => String(item.id) === String(id));
}

export function getPayrollEntryById(id) {
  return MOCK_PAYROLL_ENTRIES.find((item) => String(item.id) === String(id));
}

export function getInventoryEntryById(id) {
  return MOCK_INVENTORY_ENTRIES.find((item) => String(item.id) === String(id));
}

export function getExpenseEntryById(id) {
  return MOCK_EXPENSE_ENTRIES.find((item) => String(item.id) === String(id));
}

export function getJournalItemById(id) {
  const flattened = MOCK_JOURNAL_ENTRIES.flatMap((entry) =>
    (entry.lines || []).map((line, index) => ({
      id: `${entry.id}--${index}`,
      entry_id: entry.id,
      entry_number: entry.number,
      entry_date: entry.date,
      entry_reference: entry.reference,
      entry_status: entry.status,
      entry_approval_state: entry.approvalState,
      entry_prepared_by: entry.preparedBy,
      entry_reviewer: entry.reviewer,
      entry_journal_id: entry.journal_id,
      ...line,
    }))
  );

  return flattened.find((item) => String(item.id) === String(id));
}

export function getInvoiceByNumber(number) {
  return MOCK_INVOICES.find((item) => String(item.number) === String(number));
}

export function getBillByNumber(number) {
  return MOCK_VENDOR_BILLS.find((item) => String(item.number) === String(number));
}

export function sumLines(lines, key) {
  return (Array.isArray(lines) ? lines : []).reduce(
    (sum, line) => sum + Number(line?.[key] || 0),
    0
  );
}
