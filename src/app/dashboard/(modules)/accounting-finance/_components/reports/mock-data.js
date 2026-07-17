import {
  ACCOUNTING_MOCK_BILLS,
  ACCOUNTING_MOCK_VENDORS,
  ACCOUNTING_MOCK_ACCOUNTS,
  ACCOUNTING_MOCK_INVOICES,
  ACCOUNTING_MOCK_JOURNALS,
  ACCOUNTING_MOCK_CUSTOMERS,
  ACCOUNTING_MOCK_FISCAL_YEARS,
  ACCOUNTING_MOCK_ACCOUNT_TYPES,
  ACCOUNTING_MOCK_BANK_ACCOUNTS,
  ACCOUNTING_MOCK_JOURNAL_ITEMS,
  ACCOUNTING_MOCK_BANK_STATEMENTS,
  ACCOUNTING_MOCK_JOURNAL_ENTRIES,
} from '../demo-data';

const REPORT_DATE = '2026-03-29';

function toDate(value) {
  return new Date(`${value}T00:00:00`);
}

function withinDateRange(value, fromDate, toDateValue) {
  const date = toDate(value);
  return date >= toDate(fromDate) && date <= toDate(toDateValue);
}

function getAccountType(typeId) {
  return ACCOUNTING_MOCK_ACCOUNT_TYPES.find((type) => type.id === typeId) || null;
}

function buildAccountRecord(account) {
  const type = getAccountType(account.type_id);

  return {
    ...account,
    type,
    typeName: type?.name || 'Unclassified',
    nature: type?.nature || 'asset',
  };
}

export function getReportOverview() {
  const accounts = ACCOUNTING_MOCK_ACCOUNTS.map(buildAccountRecord);
  const bankBalance = ACCOUNTING_MOCK_BANK_ACCOUNTS.reduce(
    (sum, account) => sum + Number(account.balance || 0),
    0
  );
  const openStatementLines = ACCOUNTING_MOCK_BANK_STATEMENTS.reduce(
    (sum, statement) => sum + Number(statement.imported_lines || 0),
    0
  );
  const income = accounts
    .filter((account) => account.nature === 'income')
    .reduce((sum, account) => sum + Math.abs(Number(account.balance || 0)), 0);
  const expenses = accounts
    .filter((account) => account.nature === 'expense')
    .reduce((sum, account) => sum + Math.abs(Number(account.balance || 0)), 0);

  return {
    bankBalance,
    openStatementLines,
    income,
    expenses,
    netResult: income - expenses,
    accountCount: accounts.length,
  };
}

export function getReportsHomeCards() {
  return [
    {
      title: 'Trial Balance',
      description:
        'Closing posture, opening balances, and comparative totals across the chart of accounts.',
      hrefKey: 'trialBalance',
      icon: 'solar:calculator-bold-duotone',
      tone: 'info',
    },
    {
      title: 'General Ledger',
      description:
        'Journal-line drill-down with running balance, account focus, and posting references.',
      hrefKey: 'generalLedger',
      icon: 'solar:document-text-bold-duotone',
      tone: 'warning',
    },
    {
      title: 'Account Ledger',
      description: 'Account-by-account exposure with movement counts and reconciliation posture.',
      hrefKey: 'accountLedger',
      icon: 'solar:bill-list-bold-duotone',
      tone: 'success',
    },
    {
      title: 'Balance Sheet',
      description:
        'Statement of financial position with asset, liability, and equity control totals.',
      hrefKey: 'balanceSheet',
      icon: 'solar:scale-bold-duotone',
      tone: 'success',
    },
    {
      title: 'Profit & Loss',
      description: 'Income and expense performance with margin posture and operating highlights.',
      hrefKey: 'profitLoss',
      icon: 'solar:graph-up-bold-duotone',
      tone: 'warning',
    },
    {
      title: 'Cash Flow',
      description:
        'Direct and indirect liquidity view with operating, investing, and financing analysis.',
      hrefKey: 'cashFlow',
      icon: 'solar:wallet-money-bold-duotone',
      tone: 'error',
    },
    {
      title: 'Executive Summary',
      description:
        'Leadership snapshot for net result, cash posture, receivables, payables, and exceptions.',
      hrefKey: 'executiveSummary',
      icon: 'solar:chart-2-bold-duotone',
      tone: 'secondary',
    },
    {
      title: 'Partner Ledgers',
      description:
        'Receivable and payable drill-down paths for customer and supplier statement-style review.',
      hrefKey: 'partnerLedger',
      icon: 'solar:users-group-rounded-bold-duotone',
      tone: 'primary',
    },
    {
      title: 'Journal Report',
      description:
        'Posting register by journal with line counts, review state, and posting references.',
      hrefKey: 'journalReport',
      icon: 'solar:notebook-bookmark-bold-duotone',
      tone: 'info',
    },
    {
      title: 'Customer Ledger',
      description: 'Statement-style customer residual review with overdue and collection posture.',
      hrefKey: 'customerLedger',
      icon: 'solar:user-id-bold-duotone',
      tone: 'primary',
    },
    {
      title: 'Supplier Ledger',
      description:
        'Vendor statement review with overdue settlement and payment linkage visibility.',
      hrefKey: 'supplierLedger',
      icon: 'solar:buildings-3-bold-duotone',
      tone: 'warning',
    },
    {
      title: 'Tax Report',
      description:
        'Tax grid mapping, filing preview, and source document totals for return preparation.',
      hrefKey: 'taxReport',
      icon: 'solar:document-add-bold-duotone',
      tone: 'error',
    },
    {
      title: 'Expense Report',
      description: 'Expense policy, category, and cost-center review against budget posture.',
      hrefKey: 'expenseReport',
      icon: 'solar:card-recive-bold-duotone',
      tone: 'secondary',
    },
    {
      title: 'Cost Center Report',
      description: 'Cost-center utilization, period trends, and budget pressure visibility.',
      hrefKey: 'costCenterReport',
      icon: 'solar:pie-chart-3-bold-duotone',
      tone: 'info',
    },
    {
      title: 'Asset Report',
      description: 'Fixed-asset movement, depreciation, and disposal analysis in one workspace.',
      hrefKey: 'assetReport',
      icon: 'solar:buildings-bold-duotone',
      tone: 'success',
    },
    {
      title: 'Budget Report',
      description: 'Budget hierarchy, variance, version review, and control posture.',
      hrefKey: 'budgetReport',
      icon: 'solar:clipboard-text-bold-duotone',
      tone: 'warning',
    },
    {
      title: 'Analytic Report',
      description: 'Analytic allocation, project exposure, and cost-center distribution review.',
      hrefKey: 'analyticReport',
      icon: 'solar:graph-up-new-bold-duotone',
      tone: 'primary',
    },
    {
      title: 'Tax Audit',
      description: 'Tax source traceability, approval exceptions, and audit trail evidence pack.',
      hrefKey: 'taxAudit',
      icon: 'solar:shield-check-bold-duotone',
      tone: 'error',
    },
    {
      title: 'Consolidated Report',
      description: 'Cross-entity statement review with eliminations and control metrics.',
      hrefKey: 'consolidatedReport',
      icon: 'solar:layers-bold-duotone',
      tone: 'secondary',
    },
  ];
}

function filterAccountsBySearch(accounts, search) {
  if (!search) {
    return accounts;
  }

  const needle = search.toLowerCase();

  return accounts.filter((account) =>
    [account.code, account.name, account.typeName].join(' ').toLowerCase().includes(needle)
  );
}

function getStatementSectionRows(nature, search = '') {
  return filterAccountsBySearch(
    getGeneralLedgerAccounts().filter((account) => account.nature === nature),
    search
  );
}

function groupAccountsByType(accounts) {
  return accounts.reduce((groups, account) => {
    const current = groups[account.typeName] || [];
    return {
      ...groups,
      [account.typeName]: [...current, account],
    };
  }, {});
}

function getDaysOverdue(dueDate, asOfDate = REPORT_DATE) {
  const diff = Math.floor((toDate(asOfDate) - toDate(dueDate)) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function pickArrayItem(items, seed) {
  if (!items.length) {
    return null;
  }

  return items[Math.abs(seed) % items.length];
}

function derivePartnerLabelFromLine(line) {
  const numericSeed = String(line.journal_entry_id || line.id || '0')
    .replace(/[^0-9]/g, '')
    .split('')
    .reduce((sum, digit) => sum + Number(digit || 0), 0);

  if (['1101', '1200'].includes(line.account_code)) {
    const customer = pickArrayItem(ACCOUNTING_MOCK_CUSTOMERS, numericSeed);
    return customer ? `${customer.code} - ${customer.name}` : 'Receivable partner';
  }

  if (['2100', '2108', '2201'].includes(line.account_code)) {
    const vendor = pickArrayItem(ACCOUNTING_MOCK_VENDORS, numericSeed);
    return vendor ? `${vendor.code} - ${vendor.name}` : 'Payable partner';
  }

  return 'Internal';
}

function deriveReconciliationState(line) {
  if (['1101', '1200', '2100', '2108', '2201'].includes(line.account_code)) {
    const net = Math.abs(Number(line.debit || 0) - Number(line.credit || 0));
    if (net > 25000) {
      return 'review';
    }

    if (net > 0) {
      return 'open';
    }

    return 'matched';
  }

  return 'not-applicable';
}

function buildCustomerLedgerRows(customerId, asOfDate) {
  return ACCOUNTING_MOCK_INVOICES.filter(
    (invoice) => invoice.customer === customerId && toDate(invoice.invoice_date) <= toDate(asOfDate)
  )
    .sort((left, right) => toDate(left.invoice_date) - toDate(right.invoice_date))
    .map((invoice) => ({
      ...invoice,
      debit: Number(invoice.total_amount || 0),
      credit: Number(invoice.amount_paid || 0),
      balance: Number(invoice.amount_due || 0),
      overdueDays: getDaysOverdue(invoice.due_date, asOfDate),
      collectionStatus:
        invoice.status === 'paid'
          ? 'closed'
          : getDaysOverdue(invoice.due_date, asOfDate)
            ? 'follow-up'
            : 'open',
    }));
}

function buildSupplierLedgerRows(vendorId, asOfDate) {
  return ACCOUNTING_MOCK_BILLS.filter(
    (bill) => bill.vendor === vendorId && toDate(bill.issue_date) <= toDate(asOfDate)
  )
    .sort((left, right) => toDate(left.issue_date) - toDate(right.issue_date))
    .map((bill) => ({
      ...bill,
      debit: Number(bill.amount_paid || 0),
      credit: Number(bill.total_amount || 0),
      balance: Number(bill.amount_due || 0),
      overdueDays: getDaysOverdue(bill.due_date, asOfDate),
      paymentStatus:
        bill.status === 'paid'
          ? 'cleared'
          : getDaysOverdue(bill.due_date, asOfDate)
            ? 'due-now'
            : 'scheduled',
    }));
}

export function getTrialBalanceReport({
  fiscalYearId = 2026,
  asOfDate = REPORT_DATE,
  search = '',
} = {}) {
  const rows = filterAccountsBySearch(getGeneralLedgerAccounts(), search)
    .map((account) => {
      const amount = Math.abs(Number(account.balance || 0));
      const isDebit = ['asset', 'expense'].includes(account.nature);

      return {
        ...account,
        debit: isDebit ? amount : 0,
        credit: isDebit ? 0 : amount,
      };
    })
    .filter((row) => row.debit > 0 || row.credit > 0)
    .sort((left, right) => left.code.localeCompare(right.code));

  const totalDebit = rows.reduce((sum, row) => sum + row.debit, 0);
  const totalCredit = rows.reduce((sum, row) => sum + row.credit, 0);
  const difference = totalDebit - totalCredit;
  const fiscalYear =
    ACCOUNTING_MOCK_FISCAL_YEARS.find((year) => String(year.id) === String(fiscalYearId)) || null;

  return {
    fiscalYear,
    fiscalYearId,
    asOfDate,
    rows,
    totals: {
      debit: totalDebit,
      credit: totalCredit,
      difference,
      accounts: rows.length,
    },
    controlStatus: Math.abs(difference) < 0.01 ? 'balanced' : 'review',
  };
}

export function getExecutiveSummaryReport({ asOfDate = REPORT_DATE } = {}) {
  const overview = getReportOverview();
  const customerRows = getPartnerRowsFromCustomers(asOfDate);
  const vendorRows = getPartnerRowsFromVendors(asOfDate);
  const receivables = customerRows.reduce((sum, row) => sum + Number(row.balance || 0), 0);
  const payables = vendorRows.reduce((sum, row) => sum + Math.abs(Number(row.balance || 0)), 0);
  const cashBalance = ACCOUNTING_MOCK_BANK_ACCOUNTS.reduce(
    (sum, account) => sum + Number(account.balance || 0),
    0
  );
  const topCustomerExposure =
    [...customerRows].sort((left, right) => right.balance - left.balance)[0] || null;
  const topSupplierExposure =
    [...vendorRows].sort((left, right) => Math.abs(right.balance) - Math.abs(left.balance))[0] ||
    null;
  const openInvoices = ACCOUNTING_MOCK_INVOICES.filter(
    (invoice) => invoice.status !== 'paid'
  ).length;
  const openBills = ACCOUNTING_MOCK_BILLS.filter((bill) => bill.status !== 'paid').length;

  return {
    asOfDate,
    overview,
    receivables,
    payables,
    cashBalance,
    workingCapital: receivables + cashBalance - payables,
    liquidityCoverage: payables ? (cashBalance / payables) * 100 : 100,
    openInvoices,
    openBills,
    topCustomerExposure,
    topSupplierExposure,
    bankAccounts: ACCOUNTING_MOCK_BANK_ACCOUNTS,
    bankStatements: ACCOUNTING_MOCK_BANK_STATEMENTS,
  };
}

export function getCustomerLedgerReport({
  customerId = 'all',
  asOfDate = REPORT_DATE,
  search = '',
} = {}) {
  const selectedCustomers = ACCOUNTING_MOCK_CUSTOMERS.filter((customer) => {
    if (customerId !== 'all' && String(customer.id) !== String(customerId)) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [customer.code, customer.name, customer.segment, customer.collector]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const customers = selectedCustomers.map((customer) => {
    const ledgerRows = buildCustomerLedgerRows(customer.id, asOfDate);
    const totalInvoiced = ledgerRows.reduce((sum, row) => sum + row.debit, 0);
    const totalCollected = ledgerRows.reduce((sum, row) => sum + row.credit, 0);
    const outstanding = ledgerRows.reduce((sum, row) => sum + row.balance, 0);
    const overdue = ledgerRows
      .filter((row) => row.overdueDays > 0)
      .reduce((sum, row) => sum + row.balance, 0);

    return {
      ...customer,
      ledgerRows,
      totals: {
        invoiced: totalInvoiced,
        collected: totalCollected,
        outstanding,
        overdue,
      },
      collectionStatus: overdue > 0 ? 'follow-up' : 'clear',
    };
  });

  return {
    asOfDate,
    customers,
    totals: {
      invoiced: customers.reduce((sum, customer) => sum + customer.totals.invoiced, 0),
      collected: customers.reduce((sum, customer) => sum + customer.totals.collected, 0),
      outstanding: customers.reduce((sum, customer) => sum + customer.totals.outstanding, 0),
      overdue: customers.reduce((sum, customer) => sum + customer.totals.overdue, 0),
      customers: customers.length,
    },
  };
}

export function getSupplierLedgerReport({
  supplierId = 'all',
  asOfDate = REPORT_DATE,
  search = '',
} = {}) {
  const selectedVendors = ACCOUNTING_MOCK_VENDORS.filter((vendor) => {
    if (supplierId !== 'all' && String(vendor.id) !== String(supplierId)) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [vendor.code, vendor.name, vendor.category, vendor.owner]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const suppliers = selectedVendors.map((vendor) => {
    const ledgerRows = buildSupplierLedgerRows(vendor.id, asOfDate);
    const totalBilled = ledgerRows.reduce((sum, row) => sum + row.credit, 0);
    const totalPaid = ledgerRows.reduce((sum, row) => sum + row.debit, 0);
    const outstanding = ledgerRows.reduce((sum, row) => sum + row.balance, 0);
    const overdue = ledgerRows
      .filter((row) => row.overdueDays > 0)
      .reduce((sum, row) => sum + row.balance, 0);

    return {
      ...vendor,
      ledgerRows,
      totals: {
        billed: totalBilled,
        paid: totalPaid,
        outstanding,
        overdue,
      },
      paymentStatus: overdue > 0 ? 'escalation' : 'clear',
    };
  });

  return {
    asOfDate,
    suppliers,
    totals: {
      billed: suppliers.reduce((sum, supplier) => sum + supplier.totals.billed, 0),
      paid: suppliers.reduce((sum, supplier) => sum + supplier.totals.paid, 0),
      outstanding: suppliers.reduce((sum, supplier) => sum + supplier.totals.outstanding, 0),
      overdue: suppliers.reduce((sum, supplier) => sum + supplier.totals.overdue, 0),
      suppliers: suppliers.length,
    },
  };
}

export function getBalanceSheetReport({ asOfDate = REPORT_DATE, search = '' } = {}) {
  const assets = getStatementSectionRows('asset', search);
  const liabilities = getStatementSectionRows('liability', search);
  const equity = getStatementSectionRows('equity', search);
  const totalAssets = assets.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const totalLiabilities = liabilities.reduce(
    (sum, account) => sum + Number(account.balance || 0),
    0
  );
  const totalEquity = equity.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const balancingGap = totalAssets - totalLiabilitiesAndEquity;

  return {
    asOfDate,
    sections: {
      assets,
      liabilities,
      equity,
    },
    groupedSections: {
      assets: groupAccountsByType(assets),
      liabilities: groupAccountsByType(liabilities),
      equity: groupAccountsByType(equity),
    },
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalLiabilitiesAndEquity,
    netAssets: totalAssets - totalLiabilities,
    balancingGap,
    controlStatus: Math.abs(balancingGap) < 0.01 ? 'balanced' : 'review',
  };
}

export function getProfitLossReport({ asOfDate = REPORT_DATE, search = '' } = {}) {
  const income = getStatementSectionRows('income', search).map((account) => ({
    ...account,
    normalizedBalance: Math.abs(Number(account.balance || 0)),
  }));
  const expenses = getStatementSectionRows('expense', search).map((account) => ({
    ...account,
    normalizedBalance: Math.abs(Number(account.balance || 0)),
  }));
  const totalIncome = income.reduce((sum, account) => sum + account.normalizedBalance, 0);
  const totalExpenses = expenses.reduce((sum, account) => sum + account.normalizedBalance, 0);
  const netProfit = totalIncome - totalExpenses;
  const topExpense =
    expenses.sort((left, right) => right.normalizedBalance - left.normalizedBalance)[0] || null;

  return {
    asOfDate,
    income,
    expenses,
    groupedIncome: groupAccountsByType(income),
    groupedExpenses: groupAccountsByType(expenses),
    totalIncome,
    totalExpenses,
    netProfit,
    operatingMargin: totalIncome ? (netProfit / totalIncome) * 100 : 0,
    costRatio: totalIncome ? (totalExpenses / totalIncome) * 100 : 0,
    topExpense,
  };
}

function getPartnerRowsFromCustomers(asOfDate) {
  return ACCOUNTING_MOCK_CUSTOMERS.map((customer) => {
    const invoices = ACCOUNTING_MOCK_INVOICES.filter(
      (invoice) =>
        invoice.customer === customer.id && toDate(invoice.invoice_date) <= toDate(asOfDate)
    );
    const totalInvoiced = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.total_amount || 0),
      0
    );
    const totalPaid = invoices.reduce((sum, invoice) => sum + Number(invoice.amount_paid || 0), 0);
    const outstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.amount_due || 0), 0);
    const overdueAmount = invoices
      .filter((invoice) => invoice.status !== 'paid' && toDate(invoice.due_date) < toDate(asOfDate))
      .reduce((sum, invoice) => sum + Number(invoice.amount_due || 0), 0);

    const lastDocumentDate = invoices.reduce(
      (latest, invoice) =>
        !latest || invoice.invoice_date > latest ? invoice.invoice_date : latest,
      null
    );

    return {
      id: `customer-${customer.id}`,
      partnerId: customer.id,
      type: 'customer',
      code: customer.code,
      name: customer.name,
      debit: totalInvoiced,
      credit: totalPaid,
      balance: outstanding,
      transactionCount: invoices.length,
      overdueAmount,
      lastDocumentDate,
      riskLevel: customer.risk_level,
      exposureStatus: overdueAmount ? 'collection' : 'clear',
    };
  });
}

function getPartnerRowsFromVendors(asOfDate) {
  return ACCOUNTING_MOCK_VENDORS.map((vendor) => {
    const bills = ACCOUNTING_MOCK_BILLS.filter(
      (bill) => bill.vendor === vendor.id && toDate(bill.issue_date) <= toDate(asOfDate)
    );
    const totalBilled = bills.reduce((sum, bill) => sum + Number(bill.total_amount || 0), 0);
    const totalPaid = bills.reduce((sum, bill) => sum + Number(bill.amount_paid || 0), 0);
    const outstanding = bills.reduce((sum, bill) => sum + Number(bill.amount_due || 0), 0);
    const overdueAmount = bills
      .filter((bill) => bill.status !== 'paid' && toDate(bill.due_date) < toDate(asOfDate))
      .reduce((sum, bill) => sum + Number(bill.amount_due || 0), 0);

    const lastDocumentDate = bills.reduce(
      (latest, bill) => (!latest || bill.issue_date > latest ? bill.issue_date : latest),
      null
    );

    return {
      id: `vendor-${vendor.id}`,
      partnerId: vendor.id,
      type: 'supplier',
      code: vendor.code,
      name: vendor.name,
      debit: totalPaid,
      credit: totalBilled,
      balance: -outstanding,
      transactionCount: bills.length,
      overdueAmount,
      lastDocumentDate,
      riskLevel: vendor.risk_level,
      exposureStatus: overdueAmount ? 'payment-risk' : 'clear',
    };
  });
}

export function getPartnerLedgerReport({
  partnerType = 'all',
  asOfDate = REPORT_DATE,
  search = '',
} = {}) {
  const customers = getPartnerRowsFromCustomers(asOfDate);
  const vendors = getPartnerRowsFromVendors(asOfDate);
  const allRows = [...customers, ...vendors]
    .filter((row) => (partnerType === 'all' ? true : row.type === partnerType))
    .filter((row) => {
      if (!search) {
        return true;
      }

      return [row.code, row.name, row.type, row.riskLevel]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());
    })
    .sort((left, right) => Math.abs(right.balance) - Math.abs(left.balance));

  const rows = allRows.map((row) => ({
    ...row,
    reviewBucket:
      row.overdueAmount > 0
        ? row.type === 'customer'
          ? 'Collection watch'
          : 'Treasury watch'
        : 'Routine review',
    recommendedAction:
      row.overdueAmount > 0
        ? row.type === 'customer'
          ? 'Escalate follow-up and send statement'
          : 'Prioritize payment scheduling and vendor confirmation'
        : 'Keep under routine monthly review',
  }));

  return {
    asOfDate,
    rows,
    totals: {
      debit: rows.reduce((sum, row) => sum + Number(row.debit || 0), 0),
      credit: rows.reduce((sum, row) => sum + Number(row.credit || 0), 0),
      balance: rows.reduce((sum, row) => sum + Number(row.balance || 0), 0),
      overdue: rows.reduce((sum, row) => sum + Number(row.overdueAmount || 0), 0),
      customers: rows.filter((row) => row.type === 'customer').length,
      suppliers: rows.filter((row) => row.type === 'supplier').length,
      highRisk: rows.filter((row) => row.riskLevel === 'high').length,
      activeExposure: rows.filter((row) => row.exposureStatus !== 'clear').length,
    },
    mix: {
      customerOutstanding: rows
        .filter((row) => row.type === 'customer')
        .reduce((sum, row) => sum + Number(row.balance || 0), 0),
      supplierOutstanding: rows
        .filter((row) => row.type === 'supplier')
        .reduce((sum, row) => sum + Math.abs(Number(row.balance || 0)), 0),
      topExposure: rows[0] || null,
    },
  };
}

export function getJournalReport({
  journalId = 'all',
  fromDate = '2026-01-01',
  toDateValue = REPORT_DATE,
  statusFilter = 'all',
  search = '',
} = {}) {
  const rows = ACCOUNTING_MOCK_JOURNAL_ENTRIES.filter((entry) => {
    if (journalId !== 'all' && String(entry.journal_id) !== String(journalId)) {
      return false;
    }

    if (statusFilter !== 'all' && entry.status !== statusFilter) {
      return false;
    }

    if (!withinDateRange(entry.date, fromDate, toDateValue)) {
      return false;
    }

    if (search) {
      const haystack = [entry.number, entry.reference, entry.narration, entry.journal_name]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search.toLowerCase())) {
        return false;
      }
    }

    return true;
  }).map((entry) => {
    const lines = ACCOUNTING_MOCK_JOURNAL_ITEMS.filter(
      (item) => item.journal_entry_id === entry.id
    );
    const partnerMix = [
      ...new Set(lines.map((line) => derivePartnerLabelFromLine(line)).filter(Boolean)),
    ];
    const postingDay = entry.date;

    return {
      ...entry,
      lineCount: lines.length,
      debitTotal: lines.reduce((sum, line) => sum + Number(line.debit || 0), 0),
      creditTotal: lines.reduce((sum, line) => sum + Number(line.credit || 0), 0),
      lineSummary: lines
        .slice(0, 2)
        .map((line) => line.account_code)
        .join(', '),
      reviewState: entry.status === 'posted' ? 'posted' : 'draft-review',
      postingDay,
      partnerMix,
      linesPreview: lines.slice(0, 5).map((line) => ({
        ...line,
        partnerLabel: derivePartnerLabelFromLine(line),
        reconciliationState: deriveReconciliationState(line),
      })),
    };
  });

  const historyByJournal = ACCOUNTING_MOCK_JOURNALS.map((journal) => {
    const journalRows = rows.filter((row) => row.journal_id === journal.id);

    return {
      id: journal.id,
      name: journal.name,
      entries: journalRows.length,
      debit: journalRows.reduce((sum, row) => sum + Number(row.debitTotal || 0), 0),
      credit: journalRows.reduce((sum, row) => sum + Number(row.creditTotal || 0), 0),
      drafts: journalRows.filter((row) => row.status !== 'posted').length,
    };
  }).filter((row) => row.entries > 0);

  return {
    fromDate,
    toDateValue,
    rows,
    journals: ACCOUNTING_MOCK_JOURNALS,
    historyByJournal,
    totals: {
      entries: rows.length,
      debit: rows.reduce((sum, row) => sum + Number(row.debitTotal || 0), 0),
      credit: rows.reduce((sum, row) => sum + Number(row.creditTotal || 0), 0),
      drafts: rows.filter((row) => row.status !== 'posted').length,
    },
  };
}

export function getJournalReportEntry(id) {
  const entry = ACCOUNTING_MOCK_JOURNAL_ENTRIES.find((e) => String(e.id) === String(id));
  if (!entry) return null;
  const lines = ACCOUNTING_MOCK_JOURNAL_ITEMS.filter((item) => item.journal_entry_id === entry.id);
  const partnerMix = [
    ...new Set(lines.map((line) => derivePartnerLabelFromLine(line)).filter(Boolean)),
  ];
  return {
    ...entry,
    lineCount: lines.length,
    debitTotal: lines.reduce((sum, line) => sum + Number(line.debit || 0), 0),
    creditTotal: lines.reduce((sum, line) => sum + Number(line.credit || 0), 0),
    reviewState: entry.status === 'posted' ? 'posted' : 'draft-review',
    partnerMix,
    linesPreview: lines.map((line) => ({
      ...line,
      partnerLabel: derivePartnerLabelFromLine(line),
      reconciliationState: deriveReconciliationState(line),
    })),
  };
}

export function getGeneralLedgerAccounts() {
  return ACCOUNTING_MOCK_ACCOUNTS.map(buildAccountRecord).sort((left, right) =>
    left.code.localeCompare(right.code)
  );
}

export function getGeneralLedgerReport({
  accountId,
  fromDate = '2026-01-01',
  toDateValue = REPORT_DATE,
  search = '',
}) {
  const accounts = getGeneralLedgerAccounts();
  const selectedAccount =
    accounts.find((account) => account.id === Number(accountId)) || accounts[0] || null;

  if (!selectedAccount) {
    return {
      account: null,
      lines: [],
      openingBalance: 0,
      closingBalance: 0,
      debitTotal: 0,
      creditTotal: 0,
    };
  }

  const allLines = ACCOUNTING_MOCK_JOURNAL_ITEMS.filter(
    (item) => item.account_id === selectedAccount.id
  ).sort((left, right) => left.date.localeCompare(right.date));

  const filteredLines = allLines.filter((line) => {
    if (!withinDateRange(line.date, fromDate, toDateValue)) return false;
    if (search) {
      const haystack = [line.description, line.journal_entry_number, line.account_name]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const movementBeforeRange = allLines
    .filter((line) => toDate(line.date) < toDate(fromDate))
    .reduce((sum, line) => sum + Number(line.debit || 0) - Number(line.credit || 0), 0);

  let runningBalance =
    Number(selectedAccount.balance || 0) -
    movementBeforeRange -
    filteredLines.reduce(
      (sum, line) => sum + Number(line.debit || 0) - Number(line.credit || 0),
      0
    );

  const lines = filteredLines.map((line) => {
    runningBalance += Number(line.debit || 0) - Number(line.credit || 0);

    return {
      ...line,
      runningBalance,
      reference: line.journal_entry_number,
      partnerLabel: derivePartnerLabelFromLine(line),
      reconciliationState: deriveReconciliationState(line),
      journalName:
        ACCOUNTING_MOCK_JOURNAL_ENTRIES.find((entry) => entry.id === line.journal_entry_id)
          ?.journal_name || 'Journal',
    };
  });

  const partnerOptions = [...new Set(lines.map((line) => line.partnerLabel).filter(Boolean))];

  return {
    account: selectedAccount,
    lines,
    partnerOptions,
    openingBalance: lines[0]
      ? lines[0].runningBalance - Number(lines[0].debit || 0) + Number(lines[0].credit || 0)
      : Number(selectedAccount.balance || 0),
    closingBalance: lines.at(-1)?.runningBalance || Number(selectedAccount.balance || 0),
    debitTotal: lines.reduce((sum, line) => sum + Number(line.debit || 0), 0),
    creditTotal: lines.reduce((sum, line) => sum + Number(line.credit || 0), 0),
  };
}

export function getAccountLedgerReport({
  typeFilter = 'all',
  asOfDate = REPORT_DATE,
  search = '',
}) {
  return getGeneralLedgerAccounts()
    .filter((account) =>
      typeFilter === 'all' ? true : String(account.type_id) === String(typeFilter)
    )
    .filter((account) => {
      if (!search) return true;
      return [account.code, account.name, account.typeName]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());
    })
    .map((account) => {
      const lines = ACCOUNTING_MOCK_JOURNAL_ITEMS.filter(
        (item) => item.account_id === account.id && toDate(item.date) <= toDate(asOfDate)
      );

      return {
        ...account,
        movementCount: lines.length,
        debitTotal: lines.reduce((sum, line) => sum + Number(line.debit || 0), 0),
        creditTotal: lines.reduce((sum, line) => sum + Number(line.credit || 0), 0),
        recentLines: lines
          .slice(-4)
          .reverse()
          .map((line) => ({
            ...line,
            partnerLabel: derivePartnerLabelFromLine(line),
            reconciliationState: deriveReconciliationState(line),
          })),
        openItemCount: lines.filter((line) => deriveReconciliationState(line) === 'open').length,
        partnerFocus: [
          ...new Set(
            lines
              .map((line) => derivePartnerLabelFromLine(line))
              .filter((value) => value !== 'Internal')
          ),
        ].slice(0, 3),
        reconciliationState:
          account.nature === 'asset' || account.nature === 'liability'
            ? lines.length > 1
              ? 'review'
              : 'clear'
            : 'not-applicable',
      };
    });
}

export function getCashFlowReport() {
  const operating = [
    { name: 'Cash received from receivables', amount: 118000 },
    { name: 'Cash paid to suppliers', amount: -86400 },
    { name: 'Payroll and operating costs', amount: -54200 },
    { name: 'Tax and bank charges', amount: -9600 },
  ];

  const investing = [
    { name: 'Medical equipment acquisition', amount: -34000 },
    { name: 'Asset disposal proceeds', amount: 7800 },
  ];

  const financing = [
    { name: 'Restricted donor fund drawdown', amount: 45000 },
    { name: 'Internal reserve transfer', amount: -12500 },
  ];

  const operatingTotal = operating.reduce((sum, item) => sum + item.amount, 0);
  const investingTotal = investing.reduce((sum, item) => sum + item.amount, 0);
  const financingTotal = financing.reduce((sum, item) => sum + item.amount, 0);
  const openingBalance =
    ACCOUNTING_MOCK_BANK_ACCOUNTS.reduce((sum, account) => sum + Number(account.balance || 0), 0) -
    74200;
  const closingBalance = openingBalance + operatingTotal + investingTotal + financingTotal;

  return {
    direct: {
      operating,
      investing,
      financing,
    },
    indirect: [
      { name: 'Net result', amount: getReportOverview().netResult },
      { name: 'Depreciation and non-cash charges', amount: 18400 },
      { name: 'Receivables movement', amount: -22000 },
      { name: 'Payables movement', amount: 16300 },
    ],
    openingBalance,
    operatingTotal,
    investingTotal,
    financingTotal,
    netChange: operatingTotal + investingTotal + financingTotal,
    closingBalance,
    liquidityNotes: [
      'Operating cash is positive but pressured by supplier settlement timing.',
      'Investing cash remains negative due to equipment acquisition this cycle.',
      'Financing cash improved after donor fund release late in the month.',
    ],
  };
}

export function getReportFiscalYears() {
  return ACCOUNTING_MOCK_FISCAL_YEARS;
}

export function getReportAccountTypes() {
  return ACCOUNTING_MOCK_ACCOUNT_TYPES;
}
