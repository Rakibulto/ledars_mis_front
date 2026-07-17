import {
  ACCOUNTING_MOCK_TAXES,
  ACCOUNTING_MOCK_ACCOUNTS,
  ACCOUNTING_MOCK_ACCOUNT_TYPES,
  ACCOUNTING_MOCK_PAYMENT_TERMS,
} from '../demo-data';

const listeners = new Set();

let workspaceVersion = 0;
let sequence = 1200;

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const nextId = () => {
  sequence += 1;
  return sequence;
};

const enrichAccountTypes = (types, accounts) =>
  types.map((type) => {
    const mappedAccounts = accounts.filter(
      (account) => Number(account.type_id || account.account_type) === Number(type.id)
    );

    return {
      ...type,
      postingMode:
        type.category === 'balance_sheet'
          ? 'Continuous balance control'
          : 'Close to retained earnings',
      closeBehavior:
        type.category === 'balance_sheet'
          ? 'Carry forward to opening balances'
          : 'Close at year end',
      controlOwner:
        type.nature === 'asset' || type.nature === 'liability'
          ? 'Controller'
          : 'Finance Business Partner',
      mappedAccountCount: mappedAccounts.length,
      mappedBalance: mappedAccounts.reduce((sum, account) => sum + Number(account.balance || 0), 0),
      defaultPolicy:
        type.nature === 'income'
          ? 'Requires revenue recognition review'
          : 'Standard posting posture',
      active: type.active !== false,
      mappingRule:
        type.mapping_rule ||
        `Default ${type.nature} mapping to ${type.category === 'balance_sheet' ? 'balance sheet' : 'P&L'} presentation`,
      categoryBehavior:
        type.category_behavior ||
        (type.category === 'balance_sheet'
          ? 'Carries balance to next fiscal year'
          : 'Closes to retained earnings automatically'),
    };
  });

const enrichPaymentTerms = (terms) =>
  terms.map((term) => ({
    ...term,
    dueDays: Number(term.due_days ?? term.days ?? 0),
    discountDays: Number(term.discount_days || 0),
    discountPercent: Number(term.discount_percent || 0),
    reminderCadence:
      Number(term.due_days ?? term.days ?? 0) <= 0
        ? 'Immediate confirmation'
        : Number(term.due_days ?? term.days ?? 0) <= 15
          ? '7-day reminder cycle'
          : '14-day reminder cycle',
    approvalWindow:
      Number(term.discount_percent || 0) > 0
        ? 'Treasury discount review required'
        : 'Standard settlement workflow',
    settlementProfile:
      Number(term.due_days ?? term.days ?? 0) > 30
        ? 'Extended supplier financing'
        : 'Standard payable posture',
    active: term.active !== false,
    installmentLogic:
      term.installment_logic ||
      (Number(term.due_days ?? term.days ?? 0) > 30
        ? '30% milestone, 70% final settlement'
        : 'Single settlement installment'),
    earlyPaymentModel:
      Number(term.discount_percent || 0) > 0
        ? 'Cash discount with forfeiture tracking'
        : 'No early payment incentive',
  }));

const enrichTaxes = (taxes) =>
  taxes.map((tax) => {
    const taxType =
      tax.tax_type ||
      (String(tax.type).includes('withholding')
        ? 'withholding'
        : String(tax.type).includes('purchase')
          ? 'input'
          : 'output');

    return {
      ...tax,
      tax_type: taxType,
      reportingBox:
        taxType === 'withholding'
          ? 'Withholding statement'
          : taxType === 'input'
            ? 'Input VAT recovery'
            : 'Output VAT declaration',
      usageScope:
        taxType === 'withholding'
          ? 'Supplier settlements and statutory remittance'
          : taxType === 'input'
            ? 'Purchase bills and expense capture'
            : 'Customer invoicing and sales journals',
      settlementAccount:
        taxType === 'withholding'
          ? 'WHT payable control'
          : taxType === 'input'
            ? 'Input tax recoverable'
            : 'Output tax payable',
      active: tax.active ?? tax.is_active ?? true,
      reportingTags:
        tax.reporting_tags ||
        (taxType === 'withholding'
          ? 'WHT, statutory remittance'
          : taxType === 'input'
            ? 'Input VAT, reclaim'
            : 'Output VAT, sales tax'),
      rateModel:
        tax.rate_model ||
        (taxType === 'withholding'
          ? 'Exclusive single-rate'
          : 'Inclusive or exclusive by document setting'),
      multiRateLogic:
        tax.multi_rate_logic ||
        (Number(tax.rate || 0) > 10 ? 'Standard + surcharge grid' : 'Single rate grid'),
    };
  });

let state = {
  accountTypes: cloneValue(ACCOUNTING_MOCK_ACCOUNT_TYPES),
  paymentTerms: cloneValue(ACCOUNTING_MOCK_PAYMENT_TERMS),
  taxes: cloneValue(ACCOUNTING_MOCK_TAXES),
  activity: [
    {
      id: 'foundation-1',
      date: '2026-03-30',
      title: 'Payment term discount posture reviewed for donor-funded settlements',
      actor: 'Treasury Analyst',
    },
    {
      id: 'foundation-2',
      date: '2026-03-29',
      title: 'Output and input tax reporting boxes aligned to filing pack',
      actor: 'Tax Accountant',
    },
    {
      id: 'foundation-3',
      date: '2026-03-29',
      title: 'Account type close behavior verified with year-end carry-forward rules',
      actor: 'Finance Controller',
    },
  ],
};

function emitChange() {
  workspaceVersion += 1;
  listeners.forEach((listener) => listener());
}

function updateState(updater) {
  const draft = cloneValue(state);
  const result = updater(draft);
  state = draft;
  emitChange();
  return result;
}

function buildSnapshot(currentState) {
  const accountTypes = enrichAccountTypes(currentState.accountTypes, ACCOUNTING_MOCK_ACCOUNTS);
  const paymentTerms = enrichPaymentTerms(currentState.paymentTerms);
  const taxes = enrichTaxes(currentState.taxes);

  const overview = {
    activeAccountTypes: accountTypes.filter((item) => item.active).length,
    mappedAccounts: accountTypes.reduce((sum, item) => sum + item.mappedAccountCount, 0),
    balanceSheetTypes: accountTypes.filter((item) => item.category === 'balance_sheet').length,
    activePaymentTerms: paymentTerms.filter((item) => item.active).length,
    discountedTerms: paymentTerms.filter((item) => item.discountPercent > 0).length,
    longDatedTerms: paymentTerms.filter((item) => item.dueDays > 30).length,
    activeTaxes: taxes.filter((item) => item.active).length,
    withholdingTaxes: taxes.filter((item) => item.tax_type === 'withholding').length,
    averageTaxRate: taxes.length
      ? Number(
          (taxes.reduce((sum, item) => sum + Number(item.rate || 0), 0) / taxes.length).toFixed(2)
        )
      : 0,
  };

  const alerts = [];

  if (!overview.discountedTerms) {
    alerts.push({
      id: 'payment-discount-gap',
      severity: 'info',
      title: 'No early-settlement incentives are configured',
      description:
        'Supplier discount terms are not represented in the current payment-term control set.',
    });
  }

  if (!overview.withholdingTaxes) {
    alerts.push({
      id: 'withholding-gap',
      severity: 'warning',
      title: 'Withholding coverage is missing',
      description:
        'Statutory supplier withholding will remain manual until a withholding tax rule is configured.',
    });
  }

  if (!alerts.length) {
    alerts.push({
      id: 'foundational-steady',
      severity: 'success',
      title: 'Foundational controls are in a workable state',
      description:
        'Account classification, settlement terms, and tax control settings are ready for operational review.',
    });
  }

  return {
    overview,
    alerts,
    accountTypes,
    paymentTerms,
    taxes,
    activity: cloneValue(currentState.activity),
  };
}

export function subscribeFoundationalConfigWorkspace(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFoundationalConfigWorkspaceVersion() {
  return workspaceVersion;
}

export function getFoundationalConfigWorkspaceSnapshot() {
  return buildSnapshot(state);
}

export function createAccountType(payload) {
  return updateState((draft) => {
    const id = nextId();
    draft.accountTypes.unshift({
      id,
      code: payload.code,
      name: payload.name,
      nature: payload.nature,
      category: payload.category,
      mapping_rule: payload.mapping_rule,
      category_behavior: payload.category_behavior,
      active: true,
    });
    draft.activity.unshift({
      id: `account-type-${id}`,
      date: '2026-03-30',
      title: `${payload.code} account type configured with ${payload.category} close posture`,
      actor: 'Finance Master Data Lead',
    });
    return { id };
  });
}

export function toggleAccountTypeStatus(typeId) {
  return updateState((draft) => {
    draft.accountTypes = draft.accountTypes.map((item) =>
      String(item.id) === String(typeId) ? { ...item, active: !(item.active !== false) } : item
    );
    return { id: typeId };
  });
}

export function createPaymentTerm(payload) {
  return updateState((draft) => {
    const id = nextId();
    draft.paymentTerms.unshift({
      id,
      name: payload.name,
      code: payload.code,
      due_days: Number(payload.due_days || 0),
      days: Number(payload.due_days || 0),
      discount_days: Number(payload.discount_days || 0),
      discount_percent: Number(payload.discount_percent || 0),
      installment_logic: payload.installment_logic,
      active: true,
    });
    draft.activity.unshift({
      id: `payment-term-${id}`,
      date: '2026-03-30',
      title: `${payload.name} payment term added for treasury settlement governance`,
      actor: 'Accounts Payable Lead',
    });
    return { id };
  });
}

export function togglePaymentTermStatus(termId) {
  return updateState((draft) => {
    draft.paymentTerms = draft.paymentTerms.map((item) =>
      String(item.id) === String(termId) ? { ...item, active: !(item.active !== false) } : item
    );
    return { id: termId };
  });
}

export function createTax(payload) {
  return updateState((draft) => {
    const id = nextId();
    draft.taxes.unshift({
      id,
      name: payload.name,
      code: payload.code,
      rate: Number(payload.rate || 0),
      type: payload.type,
      tax_type: payload.tax_type,
      reporting_tags: payload.reporting_tags,
      rate_model: payload.rate_model,
      multi_rate_logic: payload.multi_rate_logic,
      active: true,
    });
    draft.activity.unshift({
      id: `tax-${id}`,
      date: '2026-03-30',
      title: `${payload.code} tax rule created for ${payload.tax_type} filing scope`,
      actor: 'Tax Accountant',
    });
    return { id };
  });
}

export function toggleTaxStatus(taxId) {
  return updateState((draft) => {
    draft.taxes = draft.taxes.map((item) =>
      String(item.id) === String(taxId)
        ? { ...item, active: !(item.active ?? item.is_active ?? true) }
        : item
    );
    return { id: taxId };
  });
}
