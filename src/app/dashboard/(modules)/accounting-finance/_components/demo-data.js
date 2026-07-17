import { endpoints } from 'src/utils/axios';

import { PAYABLE_BILLS, PAYABLE_SUPPLIERS } from './payables/mock-data';
import { RECEIVABLE_INVOICES, RECEIVABLE_CUSTOMERS } from './receivables/mock-data';
import { MOCK_JOURNALS, MOCK_VOUCHERS, MOCK_JOURNAL_ENTRIES } from './transactions/mock-data';

const EP = endpoints.accounting;

export const ACCOUNTING_MOCK_ACCOUNT_TYPES = [
  { id: 1, code: 'AST', name: 'Assets', nature: 'asset', category: 'balance_sheet' },
  { id: 2, code: 'LIA', name: 'Liabilities', nature: 'liability', category: 'balance_sheet' },
  { id: 3, code: 'EQT', name: 'Equity', nature: 'equity', category: 'balance_sheet' },
  { id: 4, code: 'INC', name: 'Income', nature: 'income', category: 'profit_loss' },
  { id: 5, code: 'EXP', name: 'Expenses', nature: 'expense', category: 'profit_loss' },
  { id: 6, code: 'BNK', name: 'Bank and Cash', nature: 'asset', category: 'balance_sheet' },
];

export const ACCOUNTING_MOCK_ACCOUNT_GROUPS = [
  { id: 1, code: '1000', name: 'Current Assets' },
  { id: 2, code: '2000', name: 'Current Liabilities' },
  { id: 3, code: '3000', name: 'Equity' },
  { id: 4, code: '4000', name: 'Income' },
  { id: 5, code: '5000', name: 'Program Expenses' },
  { id: 6, code: '6000', name: 'Operating Expenses' },
];

export const ACCOUNTING_MOCK_ACCOUNTS = [
  {
    id: 1,
    code: '1001',
    name: 'Operating Bank Account',
    type_id: 6,
    group_id: 1,
    balance: 265000,
    is_active: true,
  },
  {
    id: 2,
    code: '1101',
    name: 'Donor Receivables',
    type_id: 1,
    group_id: 1,
    balance: 212000,
    is_active: true,
  },
  {
    id: 3,
    code: '1200',
    name: 'Accounts Receivable',
    type_id: 1,
    group_id: 1,
    balance: 97000,
    is_active: true,
  },
  {
    id: 4,
    code: '1304',
    name: 'Input VAT Recoverable',
    type_id: 1,
    group_id: 1,
    balance: 4700,
    is_active: true,
  },
  {
    id: 5,
    code: '2100',
    name: 'Expense Clearing',
    type_id: 2,
    group_id: 2,
    balance: -65400,
    is_active: true,
  },
  {
    id: 6,
    code: '2108',
    name: 'Accrued Expenses',
    type_id: 2,
    group_id: 2,
    balance: -98700,
    is_active: true,
  },
  {
    id: 7,
    code: '2201',
    name: 'Payroll Liability',
    type_id: 2,
    group_id: 2,
    balance: -150000,
    is_active: true,
  },
  {
    id: 8,
    code: '3100',
    name: 'Retained Earnings',
    type_id: 3,
    group_id: 3,
    balance: -184300,
    is_active: true,
  },
  {
    id: 9,
    code: '4101',
    name: 'Grant Revenue',
    type_id: 4,
    group_id: 4,
    balance: -185000,
    is_active: true,
  },
  {
    id: 10,
    code: '4201',
    name: 'Service Revenue',
    type_id: 4,
    group_id: 4,
    balance: -126000,
    is_active: true,
  },
  {
    id: 11,
    code: '5201',
    name: 'Medical Supplies Expense',
    type_id: 5,
    group_id: 5,
    balance: 94000,
    is_active: true,
  },
  {
    id: 12,
    code: '6101',
    name: 'Salary Expense',
    type_id: 5,
    group_id: 6,
    balance: 150000,
    is_active: true,
  },
  {
    id: 13,
    code: '6302',
    name: 'Bank Charges',
    type_id: 5,
    group_id: 6,
    balance: 2800,
    is_active: true,
  },
  {
    id: 14,
    code: '7501',
    name: 'Forex Gain or Loss',
    type_id: 4,
    group_id: 4,
    balance: -1200,
    is_active: true,
  },
];

export const ACCOUNTING_MOCK_ACCOUNT_TAGS = [
  { id: 1, name: 'Fixed Asset', color: '#2563eb' },
  { id: 2, name: 'Program', color: '#16a34a' },
  { id: 3, name: 'Restricted Fund', color: '#f59e0b' },
];

export const ACCOUNTING_MOCK_FISCAL_YEARS = [
  {
    id: 2025,
    name: 'FY 2025',
    status: 'closed',
    closing_date: '2025-12-31',
    closed_by: 'Finance Manager',
    retained_earnings: 148500,
  },
  {
    id: 2026,
    name: 'FY 2026',
    status: 'active',
    closing_date: '2026-12-31',
    closed_by: 'Pending',
    retained_earnings: 184300,
  },
];

export const ACCOUNTING_MOCK_YEAR_END_CLOSINGS = [
  {
    id: 1,
    fiscal_year: 'FY 2024',
    status: 'closed',
    closing_date: '2024-12-31',
    closed_by: 'Rafiq Ahmed',
    retained_earnings: 132800,
  },
  {
    id: 2,
    fiscal_year: 'FY 2025',
    status: 'closed',
    closing_date: '2025-12-31',
    closed_by: 'Nusrat Jahan',
    retained_earnings: 148500,
  },
];

export const ACCOUNTING_MOCK_FISCAL_PERIODS = [
  {
    id: 1,
    fiscal_year_id: 2026,
    name: 'Jan 2026',
    start_date: '2026-01-01',
    end_date: '2026-01-31',
    status: 'closed',
  },
  {
    id: 2,
    fiscal_year_id: 2026,
    name: 'Feb 2026',
    start_date: '2026-02-01',
    end_date: '2026-02-28',
    status: 'closed',
  },
  {
    id: 3,
    fiscal_year_id: 2026,
    name: 'Mar 2026',
    start_date: '2026-03-01',
    end_date: '2026-03-31',
    status: 'active',
  },
  {
    id: 4,
    fiscal_year_id: 2026,
    name: 'Apr 2026',
    start_date: '2026-04-01',
    end_date: '2026-04-30',
    status: 'draft',
  },
];

export const ACCOUNTING_MOCK_CUSTOMERS = RECEIVABLE_CUSTOMERS.map((customer, index) => ({
  id: customer.id,
  customer_code: customer.code,
  code: customer.code,
  name: customer.name,
  email: customer.email,
  segment: customer.segment,
  risk_level: customer.riskLevel,
  credit_limit: customer.creditLimit,
  collector: customer.collector,
  balance: RECEIVABLE_INVOICES.filter((invoice) => invoice.customerId === customer.id).reduce(
    (sum, invoice) => sum + (invoice.total - invoice.paidAmount),
    0
  ),
  active: index !== 4,
}));

export const ACCOUNTING_MOCK_VENDORS = PAYABLE_SUPPLIERS.map((supplier) => ({
  id: supplier.id,
  vendor_code: supplier.code,
  code: supplier.code,
  name: supplier.name,
  email: supplier.email,
  category: supplier.category,
  payment_term: supplier.paymentTerm,
  risk_level: supplier.riskLevel,
  owner: supplier.owner,
  balance: PAYABLE_BILLS.filter((bill) => bill.supplierId === supplier.id).reduce(
    (sum, bill) => sum + (bill.total - bill.paidAmount),
    0
  ),
}));

export const ACCOUNTING_MOCK_INVOICES = RECEIVABLE_INVOICES.map((invoice) => {
  const customer = ACCOUNTING_MOCK_CUSTOMERS.find((item) => item.id === invoice.customerId);

  return {
    id: invoice.id,
    invoice_number: invoice.number,
    number: invoice.number,
    customer: invoice.customerId,
    customer_name: customer?.name || 'Customer',
    customer_code: customer?.code || '',
    date: invoice.issueDate,
    invoice_date: invoice.issueDate,
    due_date: invoice.dueDate,
    total: invoice.total,
    total_amount: invoice.total,
    amount_paid: invoice.paidAmount,
    amount_due: invoice.total - invoice.paidAmount,
    status: invoice.status,
    description: invoice.description,
    approval_state: invoice.approvalState,
  };
});

export const ACCOUNTING_MOCK_BILLS = PAYABLE_BILLS.map((bill) => {
  const vendor = ACCOUNTING_MOCK_VENDORS.find((item) => item.id === bill.supplierId);

  return {
    id: bill.id,
    bill_number: bill.number,
    number: bill.number,
    vendor: bill.supplierId,
    vendor_name: vendor?.name || 'Vendor',
    issue_date: bill.issueDate,
    date: bill.issueDate,
    due_date: bill.dueDate,
    total: bill.total,
    total_amount: bill.total,
    amount_paid: bill.paidAmount,
    amount_due: bill.total - bill.paidAmount,
    status: bill.status,
    description: bill.description,
    approval_state: bill.approvalState,
  };
});

export const ACCOUNTING_MOCK_JOURNALS = MOCK_JOURNALS.map((journal, index) => ({
  id: journal.id,
  code: journal.code,
  name: journal.name,
  type: journal.type,
  sequence: index + 1,
  active: true,
}));

export const ACCOUNTING_MOCK_JOURNAL_ENTRIES = MOCK_JOURNAL_ENTRIES.map((entry) => ({
  id: entry.id,
  number: entry.number,
  date: entry.date,
  journal_id: entry.journal_id,
  journal_name:
    ACCOUNTING_MOCK_JOURNALS.find((journal) => journal.id === entry.journal_id)?.name ||
    entry.journal_id,
  reference: entry.reference,
  narration: entry.narration,
  status: entry.status,
  total: entry.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0),
  prepared_by: entry.preparedBy,
}));

export const ACCOUNTING_MOCK_JOURNAL_ITEMS = MOCK_JOURNAL_ENTRIES.flatMap((entry) =>
  entry.lines.map((line, index) => ({
    id: `${entry.id}-line-${index + 1}`,
    journal_entry_id: entry.id,
    journal_entry_number: entry.number,
    date: entry.date,
    description: line.description,
    account_id: line.account_id,
    account_code: line.account_code,
    account_name: line.account_name,
    debit: line.debit,
    credit: line.credit,
    analytic: line.analytic,
  }))
);

export const ACCOUNTING_MOCK_VOUCHERS = MOCK_VOUCHERS.slice(0, 5).map((voucher, index) => ({
  id: voucher.id || `voucher-${index + 1}`,
  voucher_number: voucher.number || voucher.voucher_number || `VCH-2026-0${index + 1}`,
  voucher_type: voucher.type || voucher.voucher_type || 'Journal',
  description:
    voucher.description || voucher.narration || 'Voucher prepared from operational workflow.',
  amount: voucher.amount || voucher.total || 25000 + index * 7500,
  status: voucher.status || 'Draft',
  date: voucher.date || '2026-03-29',
}));

export const ACCOUNTING_MOCK_COST_CENTERS = [
  { id: 1, code: 'CC-EDU', name: 'Education Program', manager: 'Nabila Rahman', active: true },
  { id: 2, code: 'CC-HLT', name: 'Health Outreach', manager: 'Rashed Karim', active: true },
  { id: 3, code: 'CC-OPS', name: 'Operations Support', manager: 'Controller', active: true },
  { id: 4, code: 'CC-HR', name: 'Shared Services', manager: 'HR Finance Lead', active: true },
];

export const ACCOUNTING_MOCK_BUDGETS = [
  {
    id: 1,
    name: 'Health Outreach FY26',
    department: 'Health Outreach',
    fiscal_year: 'FY 2026',
    fiscal_year_id: 2026,
    total_amount: 240000,
    spent_amount: 168000,
    status: 'active',
    cost_center_id: 2,
  },
  {
    id: 2,
    name: 'Education Program FY26',
    department: 'Education Program',
    fiscal_year: 'FY 2026',
    fiscal_year_id: 2026,
    total_amount: 310000,
    spent_amount: 204500,
    status: 'active',
    cost_center_id: 1,
  },
  {
    id: 3,
    name: 'Operations Support FY26',
    department: 'Operations Support',
    fiscal_year: 'FY 2026',
    fiscal_year_id: 2026,
    total_amount: 120000,
    spent_amount: 83500,
    status: 'draft',
    cost_center_id: 3,
  },
];

export const ACCOUNTING_MOCK_TAXES = [
  { id: 1, name: 'VAT 5%', code: 'VAT-5', rate: 5, type: 'sale', active: true },
  { id: 2, name: 'VAT 7.5%', code: 'VAT-7.5', rate: 7.5, type: 'purchase', active: true },
  { id: 3, name: 'Withholding 2%', code: 'WHT-2', rate: 2, type: 'withholding', active: true },
];

export const ACCOUNTING_MOCK_CURRENCIES = [
  { id: 1, code: 'BDT', name: 'Bangladeshi Taka', symbol: 'BDT', active: true },
  { id: 2, code: 'USD', name: 'US Dollar', symbol: '$', active: true },
  { id: 3, code: 'EUR', name: 'Euro', symbol: 'EUR', active: true },
];

export const ACCOUNTING_MOCK_EXCHANGE_RATES = [
  {
    id: 1,
    currency: 2,
    currency_code: 'USD',
    from_currency: 'BDT',
    to_currency: 'USD',
    rate: 118.25,
    date: '2026-03-29',
    effective_date: '2026-03-29',
    source: 'Bangladesh Bank',
  },
  {
    id: 2,
    currency: 3,
    currency_code: 'EUR',
    from_currency: 'BDT',
    to_currency: 'EUR',
    rate: 129.4,
    date: '2026-03-29',
    effective_date: '2026-03-29',
    source: 'Manual',
  },
];

export const ACCOUNTING_MOCK_BANK_ACCOUNTS = [
  {
    id: 1,
    code: 'BANK-001',
    name: 'Operating Bank Account',
    balance: 265000,
    currency: 'BDT',
    account_number: '001234567890',
    bank_name: 'BRAC Bank',
  },
  {
    id: 2,
    code: 'BANK-USD',
    name: 'Donor USD Account',
    balance: 82000,
    currency: 'USD',
    account_number: '009988776655',
    bank_name: 'Standard Chartered',
  },
  {
    id: 3,
    code: 'CASH-001',
    name: 'Field Cash Float',
    balance: 18500,
    currency: 'BDT',
    account_number: 'CASH-01',
    bank_name: 'Cash Register',
  },
];

export const ACCOUNTING_MOCK_BANK_STATEMENTS = [
  {
    id: 1,
    bank_account_id: 1,
    bank_account_name: 'Operating Bank Account',
    period: 'Mar 2026',
    start_date: '2026-03-01',
    end_date: '2026-03-31',
    statement_date: '2026-03-29',
    opening_balance: 248000,
    closing_balance: 265000,
    imported_lines: 18,
    status: 'imported',
    lines: [
      {
        date: '2026-03-04',
        description: 'Donor installment received',
        reference: 'RCPT-2031',
        amount: 45000,
      },
      {
        date: '2026-03-12',
        description: 'Medical supplies vendor payment',
        reference: 'PAY-8841',
        amount: -18200,
      },
      {
        date: '2026-03-25',
        description: 'Field cash replenishment',
        reference: 'TRF-001',
        amount: -9800,
      },
    ],
  },
  {
    id: 2,
    bank_account_id: 2,
    bank_account_name: 'Donor USD Account',
    period: 'Mar 2026',
    start_date: '2026-03-01',
    end_date: '2026-03-31',
    statement_date: '2026-03-28',
    opening_balance: 80000,
    closing_balance: 82000,
    imported_lines: 11,
    status: 'draft',
    lines: [
      {
        date: '2026-03-08',
        description: 'Grant milestone collection',
        reference: 'INV-AR-004',
        amount: 12000,
      },
      {
        date: '2026-03-21',
        description: 'FX transfer to local account',
        reference: 'TRF-002',
        amount: -10000,
      },
    ],
  },
];

export const ACCOUNTING_MOCK_BANK_RECONCILIATIONS = [
  {
    id: 1,
    bank_account: 1,
    bank_account_name: 'Operating Bank Account',
    period: 'Mar 2026',
    statement_balance: 265000,
    system_balance: 262700,
    difference: 2300,
    status: 'In Progress',
  },
  {
    id: 2,
    bank_account: 2,
    bank_account_name: 'Donor USD Account',
    period: 'Mar 2026',
    statement_balance: 82000,
    system_balance: 82000,
    difference: 0,
    status: 'Completed',
  },
];

export const ACCOUNTING_MOCK_CHECKS = [
  {
    id: 1,
    check_number: 'CHK-1012',
    payee: 'Community Print House',
    amount: 56000,
    issue_date: '2026-03-26',
    status: 'Issued',
  },
  {
    id: 2,
    check_number: 'CHK-1013',
    payee: 'Green Harvest Catering',
    amount: 28500,
    issue_date: '2026-03-30',
    status: 'Prepared',
  },
];

export const ACCOUNTING_MOCK_BANK_TRANSFERS = [
  {
    id: 1,
    reference: 'TRF-001',
    from_account: 'Operating Bank Account',
    to_account: 'Field Cash Float',
    amount: 15000,
    transfer_date: '2026-03-27',
    status: 'Completed',
  },
  {
    id: 2,
    reference: 'TRF-002',
    from_account: 'Donor USD Account',
    to_account: 'Operating Bank Account',
    amount: 12500,
    transfer_date: '2026-03-30',
    status: 'Pending',
  },
];

export const ACCOUNTING_MOCK_PAYMENT_TERMS = [
  {
    id: 1,
    name: 'Immediate',
    code: 'IMM',
    due_days: 0,
    days: 0,
    discount_days: 0,
    discount_percent: 0,
    active: true,
  },
  {
    id: 2,
    name: '15 Days',
    code: 'NET15',
    due_days: 15,
    days: 15,
    discount_days: 5,
    discount_percent: 1.5,
    active: true,
  },
  {
    id: 3,
    name: '30 Days',
    code: 'NET30',
    due_days: 30,
    days: 30,
    discount_days: 10,
    discount_percent: 2,
    active: true,
  },
  {
    id: 4,
    name: '45 Days',
    code: 'NET45',
    due_days: 45,
    days: 45,
    discount_days: 0,
    discount_percent: 0,
    active: true,
  },
];

export const ACCOUNTING_MOCK_PAYMENT_METHODS = [
  {
    id: 1,
    name: 'Bank Transfer',
    code: 'BANK',
    type: 'outbound',
    payment_flow: 'Vendor settlement',
    journal: 'Bank Journal',
    settlement_days: 1,
    active: true,
  },
  {
    id: 2,
    name: 'Cheque',
    code: 'CHEQUE',
    type: 'outbound',
    payment_flow: 'Controlled disbursement',
    journal: 'Cheque Journal',
    settlement_days: 2,
    active: true,
  },
  {
    id: 3,
    name: 'Mobile Banking',
    code: 'MOBILE',
    type: 'inbound',
    payment_flow: 'Customer collection',
    journal: 'Cash Collection',
    settlement_days: 0,
    active: true,
  },
];

export const ACCOUNTING_MOCK_FISCAL_POSITIONS = [
  {
    id: 1,
    name: 'Domestic NGO',
    code: 'DOM-NGO',
    country: 'Bangladesh',
    tax_policy: 'VAT Recoverable',
    tax_mappings: [{ from: 'VAT 7.5%', to: 'VAT 5%' }],
    account_mappings: [{ from: '5201', to: '1304' }],
    auto_apply: true,
    active: true,
  },
  {
    id: 2,
    name: 'International Donor',
    code: 'INT-DONOR',
    country: 'Regional',
    tax_policy: 'Exempt',
    tax_mappings: [{ from: 'VAT 5%', to: 'Exempt' }],
    account_mappings: [{ from: '1200', to: '1101' }],
    auto_apply: false,
    active: true,
  },
];

export const ACCOUNTING_MOCK_INCOTERMS = [
  {
    id: 1,
    code: 'DAP',
    name: 'Delivered at Place',
    description: 'Seller delivers goods ready for unloading at named place.',
    risk_transfer: 'At destination before unloading',
    active: true,
  },
  {
    id: 2,
    code: 'FCA',
    name: 'Free Carrier',
    description: 'Seller hands over goods to carrier at agreed point.',
    risk_transfer: 'When handed to first carrier',
    active: true,
  },
  {
    id: 3,
    code: 'CIP',
    name: 'Carriage and Insurance Paid To',
    description: 'Seller pays carriage and insurance to named destination.',
    risk_transfer: 'When handed to first carrier',
    active: true,
  },
];

export const ACCOUNTING_MOCK_RECONCILIATION_MODELS = [
  {
    id: 1,
    name: 'Bank Charges Auto Match',
    type: 'writeoff',
    match_label: 'BANK CHARGE',
    match_journal: 'Bank Journal',
    account: '6302 - Bank Charges',
    tax: '',
    auto_validate: true,
    active: true,
  },
  {
    id: 2,
    name: 'Small Difference Write-Off',
    type: 'suggestion',
    match_label: 'ROUNDING',
    match_journal: 'Bank Journal',
    account: '6302 - Bank Charges',
    tax: '',
    auto_validate: false,
    active: true,
  },
];

export const ACCOUNTING_MOCK_ASSET_CATEGORIES = [
  {
    id: 1,
    name: 'Vehicles',
    code: 'VEH',
    depreciation_years: 5,
    useful_life: 5,
    depreciation_method: 'straight_line',
    salvage_percent: 10,
    asset_account: '1501 - Vehicles',
  },
  {
    id: 2,
    name: 'IT Equipment',
    code: 'IT',
    depreciation_years: 3,
    useful_life: 3,
    depreciation_method: 'straight_line',
    salvage_percent: 5,
    asset_account: '1502 - IT Equipment',
  },
  {
    id: 3,
    name: 'Medical Equipment',
    code: 'MED',
    depreciation_years: 4,
    useful_life: 4,
    depreciation_method: 'declining_balance',
    salvage_percent: 8,
    asset_account: '1503 - Medical Equipment',
  },
  {
    id: 4,
    name: 'Furniture & Fixtures',
    code: 'FUR',
    depreciation_years: 7,
    useful_life: 7,
    depreciation_method: 'straight_line',
    salvage_percent: 5,
    asset_account: '1504 - Furniture & Fixtures',
  },
];

export const ACCOUNTING_MOCK_ASSETS = [
  {
    id: 1,
    name: 'Toyota Hilux Field Vehicle',
    code: 'AST-001',
    category: 1,
    purchase_cost: 420000,
    current_value: 252000,
    purchase_date: '2024-01-15',
    status: 'active',
  },
  {
    id: 2,
    name: 'Dell Laptops Batch 2025',
    code: 'AST-002',
    category: 2,
    purchase_cost: 180000,
    current_value: 96000,
    purchase_date: '2025-03-10',
    status: 'active',
  },
  {
    id: 3,
    name: 'Clinic Cold Chain Unit',
    code: 'AST-003',
    category: 3,
    purchase_cost: 95000,
    current_value: 71250,
    purchase_date: '2025-06-01',
    status: 'active',
  },
  {
    id: 4,
    name: 'Retired Generator',
    code: 'AST-004',
    category: 1,
    purchase_cost: 64000,
    current_value: 0,
    purchase_date: '2021-05-01',
    status: 'disposed',
  },
  {
    id: 5,
    name: 'Boardroom Conference Furniture Set',
    code: 'AST-005',
    category: 4,
    purchase_cost: 128000,
    current_value: 109714,
    purchase_date: '2025-08-20',
    status: 'active',
  },
  {
    id: 6,
    name: 'Archive Desktop Fleet',
    code: 'AST-006',
    category: 2,
    purchase_cost: 76000,
    current_value: 3800,
    purchase_date: '2022-12-01',
    status: 'fully_depreciated',
  },
];

export const ACCOUNTING_MOCK_ASSET_DEPRECIATIONS = [
  { id: 1, asset_id: 1, depreciation_date: '2026-03-31', amount: 7000, posted: true },
  { id: 2, asset_id: 2, depreciation_date: '2026-03-31', amount: 5000, posted: true },
  { id: 3, asset_id: 3, depreciation_date: '2026-03-31', amount: 1979, posted: false },
];

export const ACCOUNTING_MOCK_ASSET_DISPOSALS = [
  {
    id: 1,
    asset_id: 4,
    disposal_date: '2026-02-11',
    sale_amount: 5000,
    gain_loss: -4500,
    status: 'completed',
  },
];

export const ACCOUNTING_MOCK_ANALYTIC_PLANS = [
  {
    id: 1,
    name: 'Projects',
    description: 'Program and donor-funded projects',
    color: '#2563eb',
    active: true,
  },
  {
    id: 2,
    name: 'Departments',
    description: 'Shared service and internal cost centers',
    color: '#16a34a',
    active: true,
  },
  {
    id: 3,
    name: 'Funding Sources',
    description: 'Restricted and unrestricted fund tracking',
    color: '#f59e0b',
    active: true,
  },
];

export const ACCOUNTING_MOCK_ANALYTIC_ACCOUNTS = [
  {
    id: 1,
    code: 'ANA-EDU',
    name: 'Education Program',
    plan_id: 1,
    partner: 'Horizon Education Trust',
    debit: 126000,
    credit: 185000,
    balance: -59000,
    active: true,
  },
  {
    id: 2,
    code: 'ANA-HLT',
    name: 'Health Outreach',
    plan_id: 1,
    partner: 'Community Health Network',
    debit: 94000,
    credit: 42000,
    balance: 52000,
    active: true,
  },
  {
    id: 3,
    code: 'ANA-OPS',
    name: 'Operations Support',
    plan_id: 2,
    partner: 'Internal',
    debit: 52800,
    credit: 1200,
    balance: 51600,
    active: true,
  },
  {
    id: 4,
    code: 'ANA-DSR',
    name: 'Restricted Donor Funds',
    plan_id: 3,
    partner: 'ReliefWorks International',
    debit: 0,
    credit: 175000,
    balance: -175000,
    active: true,
  },
];

export const ACCOUNTING_MOCK_ANALYTIC_ITEMS = [
  {
    id: 1,
    analytic_account_id: 1,
    date: '2026-03-04',
    reference: 'JE-2026-031',
    description: 'Grant revenue recognition',
    general_account: '4101 - Grant Revenue',
    amount: -185000,
  },
  {
    id: 2,
    analytic_account_id: 1,
    date: '2026-03-18',
    reference: 'BUD-EDU',
    description: 'Program coordination costs',
    general_account: '6101 - Salary Expense',
    amount: 126000,
  },
  {
    id: 3,
    analytic_account_id: 2,
    date: '2026-03-09',
    reference: 'JE-2026-032',
    description: 'Medical supplies accrual',
    general_account: '5201 - Medical Supplies Expense',
    amount: 94000,
  },
  {
    id: 4,
    analytic_account_id: 3,
    date: '2026-03-12',
    reference: 'JE-2026-033',
    description: 'Bank fee and forex adjustment',
    general_account: '6302 - Bank Charges',
    amount: 4000,
  },
  {
    id: 5,
    analytic_account_id: 4,
    date: '2026-03-28',
    reference: 'INV-AR-004',
    description: 'Grant milestone billing',
    general_account: '1200 - Accounts Receivable',
    amount: -175000,
  },
];

export const ACCOUNTING_MOCK_REPORT_TEMPLATES = [
  { id: 1, name: 'Board Financial Pack', report_type: 'Executive Summary' },
  { id: 2, name: 'Monthly Management P&L', report_type: 'Profit & Loss' },
  { id: 3, name: 'Donor Cash Position', report_type: 'Cash Flow' },
];

export const ACCOUNTING_MOCK_GENERATED_REPORTS = [
  {
    id: 1,
    name: 'March Trial Balance',
    report_type: 'Trial Balance',
    period: 'Mar 2026',
    status: 'Completed',
    created_at: '2026-03-29T09:30:00',
  },
  {
    id: 2,
    name: 'Q1 Executive Summary',
    report_type: 'Executive Summary',
    period: 'Q1 2026',
    status: 'Generated',
    created_at: '2026-03-29T10:15:00',
  },
  {
    id: 3,
    name: 'Cash Flow Forecast',
    report_type: 'Cash Flow',
    period: 'Apr 2026',
    status: 'Draft',
    created_at: '2026-03-28T16:00:00',
  },
];

export const ACCOUNTING_MOCK_APPROVAL_RULES = [
  {
    id: 1,
    name: 'High Value Vendor Bills',
    module: 'Payables',
    threshold: 100000,
    approvers: ['AP Manager', 'Finance Controller'],
    active: true,
  },
  {
    id: 2,
    name: 'Customer Credit Note Approval',
    module: 'Receivables',
    threshold: 50000,
    approvers: ['AR Lead', 'Controller'],
    active: true,
  },
  {
    id: 3,
    name: 'Journal Manual Posting Review',
    module: 'General Ledger',
    threshold: 0,
    approvers: ['Finance Manager'],
    active: true,
  },
];

export const ACCOUNTING_MOCK_AUDIT_LOGS = [
  {
    id: 1,
    user: 'Nusrat Jahan',
    action: 'Posted journal entry',
    document: 'JE-2026-031',
    timestamp: '2026-03-29T09:02:00',
  },
  {
    id: 2,
    user: 'Tasnia Karim',
    action: 'Approved vendor bill',
    document: 'BILL-AP-003',
    timestamp: '2026-03-29T10:18:00',
  },
  {
    id: 3,
    user: 'Rafiul Islam',
    action: 'Sent customer statement batch',
    document: 'STAT-AR-002',
    timestamp: '2026-03-29T11:04:00',
  },
];

export const ACCOUNTING_MOCK_NUMBER_SEQUENCES = [
  {
    id: 1,
    name: 'Journal Entries',
    document_type: 'Journal Entry',
    prefix: 'JE-2026-',
    current_number: 34,
    next_number: 35,
    padding: 3,
    reset_period: 'yearly',
    active: true,
  },
  {
    id: 2,
    name: 'Customer Invoices',
    document_type: 'Customer Invoice',
    prefix: 'INV-AR-',
    current_number: 7,
    next_number: 8,
    padding: 3,
    reset_period: 'yearly',
    active: true,
  },
  {
    id: 3,
    name: 'Vendor Bills',
    document_type: 'Vendor Bill',
    prefix: 'BILL-AP-',
    current_number: 7,
    next_number: 8,
    padding: 3,
    reset_period: 'yearly',
    active: true,
  },
];

export const ACCOUNTING_MOCK_POSTING_RULES = [
  {
    id: 'rule-100',
    name: 'Grant Revenue Recognition',
    transaction_type: 'invoice',
    debit_account: '1200 - Accounts Receivable',
    credit_account: '4101 - Grant Revenue',
    condition: 'document tagged grant and approved',
    active: true,
    amountBand: 'All amounts',
    previewResult: 'Recognizes grant revenue on approved invoice issue.',
  },
  {
    id: 'rule-101',
    name: 'Medical Supplies Accrual',
    transaction_type: 'expense',
    debit_account: '5201 - Medical Supplies Expense',
    credit_account: '2108 - Accrued Expenses',
    condition: 'goods received before invoice post',
    active: true,
    amountBand: '0-150,000',
    previewResult: 'Accrues operational medical supply costs before vendor invoice posting.',
  },
];

export const ACCOUNTING_MOCK_INTEGRATION_RULES = [
  {
    id: 'int-100',
    name: 'Procurement to Payables',
    description: 'Creates bill staging from approved purchase orders and GRNs.',
    icon: 'solar:cart-5-bold-duotone',
    connected: true,
    syncFrequency: 'Hourly',
    owner: 'Procurement Finance',
    endpoint: 'procurement.approved-orders',
    ruleMode: 'Document mapping',
    mappingSummary: 'PO, GRN, supplier, tax, cost center',
    lastSync: '2026-03-29T11:20:00',
    lastTestStatus: 'passed',
  },
  {
    id: 'int-101',
    name: 'Projects to Receivables',
    description: 'Pushes milestone billing events into donor invoicing queue.',
    icon: 'solar:folder-with-files-bold-duotone',
    connected: true,
    syncFrequency: 'Daily',
    owner: 'Accounts Receivable',
    endpoint: 'projects.billing-events',
    ruleMode: 'Milestone trigger',
    mappingSummary: 'Milestone, customer, contract, service period',
    lastSync: '2026-03-29T08:00:00',
    lastTestStatus: 'warning',
  },
];

export const ACCOUNTING_MOCK_LOCK_DATES = [
  { id: 1, name: 'Soft Lock', type: 'soft', lock_date: '2026-03-25' },
  { id: 2, name: 'Hard Lock', type: 'hard', lock_date: '2026-02-29' },
];

export const ACCOUNTING_MOCK_DASHBOARD = {
  monthly_revenue: [128000, 145000, 166000],
  receivable_aging: [92000, 64000, 31000, 14000],
  payable_aging: [87000, 52000, 28000, 11000],
  cash_balance: 365500,
};

const ACCOUNTING_ENDPOINT_MOCKS = {
  [EP.dashboard]: ACCOUNTING_MOCK_DASHBOARD,
  [EP.account_types]: ACCOUNTING_MOCK_ACCOUNT_TYPES,
  [EP.account_groups]: ACCOUNTING_MOCK_ACCOUNT_GROUPS,
  [EP.accounts]: ACCOUNTING_MOCK_ACCOUNTS,
  [EP.account_tags]: ACCOUNTING_MOCK_ACCOUNT_TAGS,
  [EP.fiscal_years]: ACCOUNTING_MOCK_FISCAL_YEARS,
  [EP.fiscal_periods]: ACCOUNTING_MOCK_FISCAL_PERIODS,
  [EP.journals]: ACCOUNTING_MOCK_JOURNALS,
  [EP.journal_entries]: ACCOUNTING_MOCK_JOURNAL_ENTRIES,
  [EP.journal_items]: ACCOUNTING_MOCK_JOURNAL_ITEMS,
  [EP.vouchers]: ACCOUNTING_MOCK_VOUCHERS,
  [EP.customers]: ACCOUNTING_MOCK_CUSTOMERS,
  [EP.invoices]: ACCOUNTING_MOCK_INVOICES,
  [EP.vendors]: ACCOUNTING_MOCK_VENDORS,
  [EP.bills]: ACCOUNTING_MOCK_BILLS,
  [EP.budgets]: ACCOUNTING_MOCK_BUDGETS,
  [EP.taxes]: ACCOUNTING_MOCK_TAXES,
  [EP.cost_centers]: ACCOUNTING_MOCK_COST_CENTERS,
  [EP.analytic_lines]: ACCOUNTING_MOCK_ANALYTIC_ITEMS,
  [EP.currencies]: ACCOUNTING_MOCK_CURRENCIES,
  [EP.exchange_rates]: ACCOUNTING_MOCK_EXCHANGE_RATES,
  [EP.bank_accounts]: ACCOUNTING_MOCK_BANK_ACCOUNTS,
  [EP.bank_statements]: ACCOUNTING_MOCK_BANK_STATEMENTS,
  [EP.bank_reconciliations]: ACCOUNTING_MOCK_BANK_RECONCILIATIONS,
  [EP.checks]: ACCOUNTING_MOCK_CHECKS,
  [EP.bank_transfers]: ACCOUNTING_MOCK_BANK_TRANSFERS,
  [EP.asset_categories]: ACCOUNTING_MOCK_ASSET_CATEGORIES,
  [EP.assets]: ACCOUNTING_MOCK_ASSETS,
  [EP.asset_depreciations]: ACCOUNTING_MOCK_ASSET_DEPRECIATIONS,
  [EP.asset_disposals]: ACCOUNTING_MOCK_ASSET_DISPOSALS,
  [EP.payment_terms]: ACCOUNTING_MOCK_PAYMENT_TERMS,
  [EP.payment_methods]: ACCOUNTING_MOCK_PAYMENT_METHODS,
  [EP.fiscal_positions]: ACCOUNTING_MOCK_FISCAL_POSITIONS,
  [EP.incoterms]: ACCOUNTING_MOCK_INCOTERMS,
  [EP.reconciliation_models]: ACCOUNTING_MOCK_RECONCILIATION_MODELS,
  [EP.report_templates]: ACCOUNTING_MOCK_REPORT_TEMPLATES,
  [EP.generated_reports]: ACCOUNTING_MOCK_GENERATED_REPORTS,
  [EP.approval_rules]: ACCOUNTING_MOCK_APPROVAL_RULES,
  [EP.audit_logs]: ACCOUNTING_MOCK_AUDIT_LOGS,
  [EP.number_sequences]: ACCOUNTING_MOCK_NUMBER_SEQUENCES,
  [EP.posting_rules]: ACCOUNTING_MOCK_POSTING_RULES,
  [EP.integration_rules]: ACCOUNTING_MOCK_INTEGRATION_RULES,
};

const ACCOUNTING_MOCKS_BY_KEY = {
  analytic_accounts: ACCOUNTING_MOCK_ANALYTIC_ACCOUNTS,
  analytic_plans: ACCOUNTING_MOCK_ANALYTIC_PLANS,
  posting_rules: ACCOUNTING_MOCK_POSTING_RULES,
  integration_rules: ACCOUNTING_MOCK_INTEGRATION_RULES,
  lock_dates: ACCOUNTING_MOCK_LOCK_DATES,
  year_end_closings: ACCOUNTING_MOCK_YEAR_END_CLOSINGS,
};

const ACCOUNTING_MOCK_STORE_INITIAL_STATE = {
  ...Object.fromEntries(
    Object.entries(ACCOUNTING_ENDPOINT_MOCKS).map(([key, value]) => [
      `url:${key}`,
      cloneMockData(value),
    ])
  ),
  ...Object.fromEntries(
    Object.entries(ACCOUNTING_MOCKS_BY_KEY).map(([key, value]) => [
      `key:${key}`,
      cloneMockData(value),
    ])
  ),
};

let accountingMockStore = ACCOUNTING_MOCK_STORE_INITIAL_STATE;

const ACCOUNTING_ACTION_ROUTE_RESOLVERS = [
  {
    pattern: /^\/api\/acc-assets\/([^/]+)\/dispose\/$/,
    resolve: ([, itemId]) => ({ type: 'asset_dispose', storeKey: `url:${EP.assets}`, itemId }),
  },
  {
    pattern: /^\/api\/acc-invoices\/([^/]+)\/send-invoice\/$/,
    resolve: ([, itemId]) => ({ type: 'invoice_send', storeKey: `url:${EP.invoices}`, itemId }),
  },
  {
    pattern: /^\/api\/acc-invoices\/([^/]+)\/register-payment\/$/,
    resolve: ([, itemId]) => ({
      type: 'invoice_register_payment',
      storeKey: `url:${EP.invoices}`,
      itemId,
    }),
  },
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ACCOUNTING_DETAIL_ROUTE_RESOLVERS = Object.keys(ACCOUNTING_ENDPOINT_MOCKS).map(
  (endpoint) => ({
    endpoint,
    storeKey: `url:${endpoint}`,
    pattern: new RegExp(`^${escapeRegExp(endpoint)}([^/]+)/$`, 'u'),
  })
);

function cloneMockData(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

function getMockStoreValue(storeKey) {
  if (!(storeKey in accountingMockStore)) {
    return undefined;
  }

  return accountingMockStore[storeKey];
}

function setMockStoreValue(storeKey, value) {
  accountingMockStore = {
    ...accountingMockStore,
    [storeKey]: value,
  };
}

function resolveAccountingMockStoreKey(url, mockKey) {
  if (mockKey && ACCOUNTING_MOCKS_BY_KEY[mockKey]) {
    return { type: 'collection', storeKey: `key:${mockKey}` };
  }

  if (url && ACCOUNTING_ENDPOINT_MOCKS[url]) {
    return { type: 'collection', storeKey: `url:${url}` };
  }

  if (!url) {
    return null;
  }

  for (const resolver of ACCOUNTING_ACTION_ROUTE_RESOLVERS) {
    const match = url.match(resolver.pattern);

    if (match) {
      return resolver.resolve(match);
    }
  }

  for (const resolver of ACCOUNTING_DETAIL_ROUTE_RESOLVERS) {
    const match = url.match(resolver.pattern);

    if (match) {
      return { type: 'detail', storeKey: resolver.storeKey, itemId: match[1] };
    }
  }

  return null;
}

function getNextMockId(records) {
  return (
    records.reduce((maxId, record) => {
      const numericId = Number(record?.id);
      return Number.isFinite(numericId) ? Math.max(maxId, numericId) : maxId;
    }, 0) + 1
  );
}

function buildAccountingMockRecord(storeKey, payload = {}, records = []) {
  const template = records[0] || {};
  const nextId = payload.id ?? getNextMockId(records);

  switch (storeKey) {
    case `url:${EP.exchange_rates}`:
      return {
        ...template,
        id: nextId,
        currency: template.currency || null,
        currency_code: payload.to_currency || payload.currency_code || template.currency_code || '',
        from_currency: payload.from_currency || 'BDT',
        to_currency: payload.to_currency || payload.currency_code || '',
        rate: Number(payload.rate || 0),
        date: payload.date || new Date().toISOString().slice(0, 10),
        effective_date: payload.date || new Date().toISOString().slice(0, 10),
        source: payload.source || 'Manual',
      };
    case `url:${EP.payment_methods}`:
      return {
        ...template,
        id: nextId,
        active: true,
        journal: payload.journal || template.journal || '-',
        settlement_days: Number(payload.settlement_days ?? template.settlement_days ?? 0),
        ...payload,
      };
    case `url:${EP.fiscal_positions}`:
      return {
        ...template,
        id: nextId,
        code: payload.code || `FP-${String(nextId).padStart(3, '0')}`,
        auto_apply: payload.auto_apply ?? false,
        tax_mappings: payload.tax_mappings || [],
        account_mappings: payload.account_mappings || [],
        active: payload.active ?? true,
        ...payload,
      };
    case `url:${EP.reconciliation_models}`:
      return {
        ...template,
        id: nextId,
        auto_validate: payload.auto_validate ?? false,
        active: payload.active ?? true,
        ...payload,
      };
    case `url:${EP.number_sequences}`:
      const currentNumber =
        payload.current_number !== undefined
          ? Number(payload.current_number || 1)
          : Math.max(Number(payload.next_number || 1) - 1, 0);
      return {
        ...template,
        id: nextId,
        name: payload.document_type || payload.name || template.name,
        document_type: payload.document_type || payload.name || '',
        current_number: currentNumber,
        next_number: Number(payload.next_number || currentNumber + 1),
        reset_period: payload.reset_period || (payload.reset_yearly === false ? 'never' : 'yearly'),
        reset_yearly: payload.reset_yearly ?? payload.reset_period !== 'never',
        current_year: Number(payload.current_year || new Date().getFullYear()),
        active: payload.active ?? true,
        ...payload,
      };
    case `key:analytic_accounts`:
      return {
        ...template,
        id: nextId,
        debit: 0,
        credit: 0,
        balance: 0,
        active: true,
        plan_id: Number(payload.plan_id || 0),
        ...payload,
      };
    case `key:analytic_plans`:
      return {
        ...template,
        id: nextId,
        active: true,
        ...payload,
      };
    default:
      return {
        ...template,
        id: nextId,
        ...payload,
      };
  }
}

function updateAccountingMockRecord(storeKey, existingRecord, payload = {}) {
  if (!existingRecord) {
    return existingRecord;
  }

  const nextRecord = {
    ...existingRecord,
    ...payload,
  };

  if (storeKey === `url:${EP.number_sequences}`) {
    nextRecord.current_number =
      nextRecord.current_number !== undefined
        ? Number(nextRecord.current_number || 0)
        : Math.max(Number(nextRecord.next_number || 1) - 1, 0);
    nextRecord.next_number = Number(nextRecord.next_number || nextRecord.current_number + 1);
    nextRecord.reset_period =
      nextRecord.reset_period || (nextRecord.reset_yearly === false ? 'never' : 'yearly');
  }

  if (storeKey === `url:${EP.exchange_rates}`) {
    nextRecord.rate = Number(nextRecord.rate || 0);
    nextRecord.effective_date = nextRecord.date || nextRecord.effective_date;
  }

  if (storeKey === `key:analytic_accounts`) {
    nextRecord.plan_id = Number(nextRecord.plan_id || 0);
  }

  return nextRecord;
}

export function applyAccountingMockMutation(method, url, payload, mockKey) {
  const target = resolveAccountingMockStoreKey(url, mockKey);

  if (!target) {
    return null;
  }

  const currentValue = getMockStoreValue(target.storeKey);
  const currentRecords = Array.isArray(currentValue) ? currentValue : [];

  if (target.type === 'collection' && method === 'post') {
    const createdRecord = buildAccountingMockRecord(target.storeKey, payload, currentRecords);
    const nextRecords = [createdRecord, ...currentRecords];
    setMockStoreValue(target.storeKey, nextRecords);
    return {
      handled: true,
      data: cloneMockData(createdRecord),
      collection: cloneMockData(nextRecords),
      collectionUrl: target.storeKey.startsWith('url:') ? target.storeKey.slice(4) : undefined,
    };
  }

  if (target.type === 'detail' && (method === 'patch' || method === 'put')) {
    let updatedRecord;
    const nextRecords = currentRecords.map((record) => {
      if (String(record.id) !== String(target.itemId)) {
        return record;
      }

      updatedRecord = updateAccountingMockRecord(target.storeKey, record, payload);
      return updatedRecord;
    });

    setMockStoreValue(target.storeKey, nextRecords);
    return {
      handled: true,
      data: cloneMockData(updatedRecord),
      collection: cloneMockData(nextRecords),
      collectionUrl: target.storeKey.startsWith('url:') ? target.storeKey.slice(4) : undefined,
    };
  }

  if (target.type === 'detail' && method === 'delete') {
    const nextRecords = currentRecords.filter(
      (record) => String(record.id) !== String(target.itemId)
    );
    setMockStoreValue(target.storeKey, nextRecords);
    return {
      handled: true,
      data: {},
      collection: cloneMockData(nextRecords),
      collectionUrl: target.storeKey.startsWith('url:') ? target.storeKey.slice(4) : undefined,
    };
  }

  if (target.type === 'invoice_send' && method === 'post') {
    let updatedRecord;
    const nextRecords = currentRecords.map((record) => {
      if (String(record.id) !== String(target.itemId)) {
        return record;
      }

      updatedRecord = {
        ...record,
        status: 'sent',
        sent_at: new Date().toISOString(),
      };
      return updatedRecord;
    });

    setMockStoreValue(target.storeKey, nextRecords);
    return {
      handled: true,
      data: cloneMockData(updatedRecord),
      collection: cloneMockData(nextRecords),
      collectionUrl: EP.invoices,
    };
  }

  if (target.type === 'invoice_register_payment' && method === 'post') {
    let updatedRecord;
    const nextRecords = currentRecords.map((record) => {
      if (String(record.id) !== String(target.itemId)) {
        return record;
      }

      const nextPaidAmount = Number(record.amount_paid || 0) + Number(payload?.amount || 0);
      const totalAmount = Number(record.total_amount || record.total || 0);
      const remainingAmount = Math.max(totalAmount - nextPaidAmount, 0);

      updatedRecord = {
        ...record,
        amount_paid: nextPaidAmount,
        amount_due: remainingAmount,
        status: remainingAmount === 0 ? 'paid' : 'partial',
        last_payment_reference: payload?.reference || '',
      };
      return updatedRecord;
    });

    setMockStoreValue(target.storeKey, nextRecords);
    return {
      handled: true,
      data: cloneMockData(updatedRecord),
      collection: cloneMockData(nextRecords),
      collectionUrl: EP.invoices,
    };
  }

  if (target.type === 'asset_dispose' && method === 'post') {
    let disposedAsset;
    const nextAssets = currentRecords.map((record) => {
      if (String(record.id) !== String(target.itemId)) {
        return record;
      }

      disposedAsset = {
        ...record,
        status: 'disposed',
        current_value: 0,
        disposal_date: payload?.disposal_date,
      };
      return disposedAsset;
    });

    setMockStoreValue(target.storeKey, nextAssets);

    const disposalStoreKey = `url:${EP.asset_disposals}`;
    const currentDisposals = getMockStoreValue(disposalStoreKey) || [];
    const saleAmount = Number(payload?.sale_amount || 0);
    const disposalRecord = {
      id: getNextMockId(currentDisposals),
      asset_id: Number(target.itemId),
      disposal_date: payload?.disposal_date || new Date().toISOString().slice(0, 10),
      sale_amount: saleAmount,
      gain_loss: saleAmount - Number(disposedAsset?.current_value || 0),
      status: 'completed',
      method: payload?.disposal_method || 'sale',
      notes: payload?.notes || '',
    };
    setMockStoreValue(disposalStoreKey, [disposalRecord, ...currentDisposals]);

    return {
      handled: true,
      data: cloneMockData(disposalRecord),
      collection: cloneMockData(nextAssets),
      collectionUrl: EP.assets,
      extraCollections: {
        [EP.asset_disposals]: cloneMockData(getMockStoreValue(disposalStoreKey)),
      },
    };
  }

  return null;
}

export function getAccountingMockResponse(url, mockKey) {
  const target = resolveAccountingMockStoreKey(url, mockKey);

  if (!target) {
    return undefined;
  }

  return cloneMockData(getMockStoreValue(target.storeKey));
}
