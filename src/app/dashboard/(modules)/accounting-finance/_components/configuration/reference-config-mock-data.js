import {
  ACCOUNTING_MOCK_CURRENCIES,
  ACCOUNTING_MOCK_BANK_ACCOUNTS,
  ACCOUNTING_MOCK_EXCHANGE_RATES,
  ACCOUNTING_MOCK_PAYMENT_METHODS,
  ACCOUNTING_MOCK_RECONCILIATION_MODELS,
} from '../demo-data';

const listeners = new Set();

let workspaceVersion = 0;
let sequence = 900;

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const nextId = () => {
  sequence += 1;
  return sequence;
};

const enrichCurrencies = (currencies, exchangeRates) => {
  const baseCurrency = currencies.find((currency) => currency.is_base) || currencies[0] || null;

  return currencies.map((currency) => {
    const latestRate = exchangeRates
      .filter((rate) => rate.to_currency === currency.code || rate.currency_code === currency.code)
      .sort(
        (left, right) =>
          new Date(right.effective_date || right.date) - new Date(left.effective_date || left.date)
      )[0];

    return {
      ...currency,
      is_base: Boolean(currency.is_base || (baseCurrency && currency.id === baseCurrency.id)),
      precision: Number(currency.precision ?? (currency.code === 'JPY' ? 0 : 2)),
      triangulation:
        currency.code === 'EUR'
          ? 'ECB cross-rate'
          : currency.code === 'USD'
            ? 'Donor settlement anchor'
            : 'Base reporting currency',
      exchange_rate: latestRate?.rate || 1,
      lastRateDate: latestRate?.effective_date || latestRate?.date || '—',
      source: latestRate?.source || 'Manual',
      roundingMethod: currency.rounding_method || 'Round half-up',
      gainLossAutomation: currency.gain_loss_automation || 'Monthly unrealized FX revaluation',
    };
  });
};

const enrichPaymentMethods = (methods) =>
  methods.map((method, index) => ({
    ...method,
    feeRule: index % 2 === 0 ? 'No fee' : 'Pass through bank fee',
    exportProfile:
      method.code === 'BANK'
        ? 'SEPA/Bulk bank file'
        : method.code === 'CHEQUE'
          ? 'Controlled cheque run'
          : 'Instant collection feed',
    defaultBehavior:
      method.type === 'inbound' ? 'Apply to open receivable' : 'Require treasury approval',
    bankExportConfig:
      method.bank_export_config ||
      (method.code === 'BANK'
        ? 'ACH XML batch with approval signature'
        : 'Manual settlement route'),
    behaviorChain:
      method.behavior_chain ||
      `${method.journal || 'Journal'} -> ${method.payment_flow || 'Settlement flow'} -> ${method.settlement_days || 0} day release`,
  }));

const enrichBankCashAccounts = (accounts) =>
  accounts.map((account) => {
    const type =
      account.code.startsWith('CASH') || account.bank_name === 'Cash Register' ? 'cash' : 'bank';
    const pendingBalance = Math.round(
      Number(account.balance || 0) * (type === 'bank' ? 0.08 : 0.04)
    );

    return {
      ...account,
      type,
      treasuryDefault: type === 'bank' ? 'Primary disbursement account' : 'Field float account',
      liquidityTag: type === 'bank' ? 'Bank liquidity' : 'Cash on hand',
      pendingBalance,
      availableBalance: Number(account.balance || 0) - pendingBalance,
      reconciliationState:
        type === 'bank' ? (pendingBalance > 10000 ? 'attention' : 'healthy') : 'manual_control',
      reconciliationCadence:
        type === 'bank' ? 'Daily bank-feed reconciliation' : 'Daily cashier close',
      liquidityHorizon:
        pendingBalance > 10000
          ? 'Tight 7-day liquidity horizon'
          : 'Stable 30-day liquidity horizon',
    };
  });

const enrichExchangeRates = (rates, currencies) =>
  rates.map((rate) => ({
    ...rate,
    effective_date: rate.effective_date || rate.date,
    inverseRate: Number(rate.rate) ? Number((1 / Number(rate.rate)).toFixed(6)) : 0,
    varianceFlag: Number(rate.rate) > 125 ? 'watch' : 'stable',
    toSymbol:
      currencies.find((currency) => currency.code === rate.to_currency)?.symbol || rate.to_currency,
    importMode:
      rate.import_mode ||
      (rate.source === 'Treasury Feed' ? 'Automated treasury feed' : 'Manual override'),
    gainLossAutomation:
      rate.gain_loss_automation || 'Auto-post realized and unrealized FX gain/loss',
  }));

const enrichReconciliationModels = (models) =>
  models.map((model, index) => ({
    ...model,
    ruleCoverage: index % 2 === 0 ? 'Bank charges and fee lines' : 'Rounding and small differences',
    matchStrategy:
      model.type === 'writeoff'
        ? 'Amount and label exact match'
        : 'Label suggestion with analyst review',
    counterpartDefault: model.account,
    amountRule: model.amount_rule || 'Match amount within tolerance 0.50%',
    textRule: model.text_rule || 'Match label, memo, and partner reference',
    changeVersion: model.change_version || `v1.${index + 1}`,
  }));

let state = {
  currencies: ACCOUNTING_MOCK_CURRENCIES.map((currency, index) => ({
    ...cloneValue(currency),
    is_base: index === 0,
  })),
  exchangeRates: cloneValue(ACCOUNTING_MOCK_EXCHANGE_RATES),
  paymentMethods: cloneValue(ACCOUNTING_MOCK_PAYMENT_METHODS),
  bankCashAccounts: cloneValue(ACCOUNTING_MOCK_BANK_ACCOUNTS),
  reconciliationModels: cloneValue(ACCOUNTING_MOCK_RECONCILIATION_MODELS),
  activity: [
    {
      id: 'cfg-1',
      date: '2026-03-30',
      title: 'USD rate synchronized for donor settlement',
      actor: 'Treasury Analyst',
    },
    {
      id: 'cfg-2',
      date: '2026-03-29',
      title: 'Cheque payment route reviewed for controlled releases',
      actor: 'Finance Controller',
    },
    {
      id: 'cfg-3',
      date: '2026-03-28',
      title: 'Bank charge auto-match rule adjusted for March statement lines',
      actor: 'Reconciliation Lead',
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
  const currencies = enrichCurrencies(currentState.currencies, currentState.exchangeRates);
  const exchangeRates = enrichExchangeRates(currentState.exchangeRates, currencies);
  const paymentMethods = enrichPaymentMethods(currentState.paymentMethods);
  const bankCashAccounts = enrichBankCashAccounts(currentState.bankCashAccounts);
  const reconciliationModels = enrichReconciliationModels(currentState.reconciliationModels);

  const overview = {
    activeCurrencies: currencies.filter((currency) => currency.active !== false).length,
    inactiveCurrencies: currencies.filter((currency) => currency.active === false).length,
    liveRateSources: new Set(exchangeRates.map((rate) => rate.source)).size,
    paymentMethodCount: paymentMethods.length,
    activePaymentMethods: paymentMethods.filter((method) => method.active !== false).length,
    bankAccountCount: bankCashAccounts.filter((account) => account.type === 'bank').length,
    cashAccountCount: bankCashAccounts.filter((account) => account.type === 'cash').length,
    totalLiquidity: bankCashAccounts.reduce(
      (sum, account) => sum + Number(account.balance || 0),
      0
    ),
    pendingLiquidity: bankCashAccounts.reduce(
      (sum, account) => sum + Number(account.pendingBalance || 0),
      0
    ),
    activeReconciliationModels: reconciliationModels.filter((model) => model.active !== false)
      .length,
  };

  const alerts = [];
  if (exchangeRates.some((rate) => rate.varianceFlag === 'watch')) {
    alerts.push({
      id: 'fx-watch',
      severity: 'warning',
      title: 'Exchange rates require treasury review',
      description:
        'At least one configured FX rate is outside the normal operating band and should be confirmed before posting.',
    });
  }
  if (bankCashAccounts.some((account) => account.reconciliationState === 'attention')) {
    alerts.push({
      id: 'bank-attention',
      severity: 'info',
      title: 'Some bank accounts carry elevated pending balances',
      description:
        'Treasury defaults and reconciliation timing should be reviewed before the next close cycle.',
    });
  }
  if (!alerts.length) {
    alerts.push({
      id: 'config-steady',
      severity: 'success',
      title: 'Reference controls are currently balanced',
      description:
        'Currencies, liquidity accounts, payment routes, and reconciliation rules are in a controlled state.',
    });
  }

  return {
    overview,
    alerts,
    currencies,
    exchangeRates,
    paymentMethods,
    bankCashAccounts,
    reconciliationModels,
    activity: cloneValue(currentState.activity),
  };
}

export function subscribeReferenceConfigWorkspace(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getReferenceConfigWorkspaceVersion() {
  return workspaceVersion;
}

export function getReferenceConfigWorkspaceSnapshot() {
  return buildSnapshot(state);
}

export function createCurrency(payload) {
  return updateState((draft) => {
    if (payload.is_base) {
      draft.currencies = draft.currencies.map((currency) => ({ ...currency, is_base: false }));
    }

    const id = nextId();
    draft.currencies.unshift({
      id,
      code: payload.code,
      name: payload.name,
      symbol: payload.symbol,
      active: true,
      is_base: Boolean(payload.is_base),
      precision: Number(payload.precision ?? 2),
      rounding_method: payload.rounding_method,
      gain_loss_automation: payload.gain_loss_automation,
    });

    draft.activity.unshift({
      id: `currency-${id}`,
      date: '2026-03-30',
      title: `${payload.code} currency configured`,
      actor: 'Finance Master Data Lead',
    });
    return { id };
  });
}

export function toggleCurrencyStatus(currencyId) {
  return updateState((draft) => {
    draft.currencies = draft.currencies.map((currency) =>
      String(currency.id) === String(currencyId)
        ? { ...currency, active: !currency.active }
        : currency
    );
    return { id: currencyId };
  });
}

export function syncExchangeRates() {
  return updateState((draft) => {
    draft.exchangeRates = draft.exchangeRates.map((rate) => ({
      ...rate,
      rate: Number((Number(rate.rate) * 1.0025).toFixed(4)),
      date: '2026-03-30',
      effective_date: '2026-03-30',
      source: 'Treasury Feed',
    }));
    draft.activity.unshift({
      id: `fx-sync-${Date.now()}`,
      date: '2026-03-30',
      title: 'FX rates synchronized from treasury feed',
      actor: 'Treasury Analyst',
    });
    return { synced: true };
  });
}

export function createExchangeRate(payload) {
  return updateState((draft) => {
    const id = nextId();
    draft.exchangeRates.unshift({
      id,
      currency:
        draft.currencies.find((currency) => currency.code === payload.to_currency)?.id || null,
      currency_code: payload.to_currency,
      from_currency: payload.from_currency,
      to_currency: payload.to_currency,
      rate: Number(payload.rate),
      date: payload.date,
      effective_date: payload.date,
      source: payload.source || 'Manual',
      import_mode: payload.import_mode,
      gain_loss_automation: payload.gain_loss_automation,
    });
    return { id };
  });
}

export function createPaymentMethod(payload) {
  return updateState((draft) => {
    const id = nextId();
    draft.paymentMethods.unshift({
      id,
      name: payload.name,
      code: payload.code,
      type: payload.type,
      payment_flow: payload.payment_flow,
      journal: payload.journal,
      settlement_days: Number(payload.settlement_days || 0),
      bank_export_config: payload.bank_export_config,
      behavior_chain: payload.behavior_chain,
      active: true,
    });
    return { id };
  });
}

export function togglePaymentMethodStatus(methodId) {
  return updateState((draft) => {
    draft.paymentMethods = draft.paymentMethods.map((method) =>
      String(method.id) === String(methodId) ? { ...method, active: !method.active } : method
    );
    return { id: methodId };
  });
}

export function createBankCashAccount(payload) {
  return updateState((draft) => {
    const id = nextId();
    draft.bankCashAccounts.unshift({
      id,
      code: payload.code,
      name: payload.name,
      balance: Number(payload.balance || 0),
      currency: payload.currency,
      account_number: payload.account_number,
      bank_name: payload.bank_name,
    });
    return { id };
  });
}

export function createReconciliationModel(payload) {
  return updateState((draft) => {
    const id = nextId();
    draft.reconciliationModels.unshift({
      id,
      name: payload.name,
      type: payload.type,
      match_label: payload.match_label,
      match_journal: payload.match_journal,
      account: payload.account,
      tax: payload.tax,
      amount_rule: payload.amount_rule,
      text_rule: payload.text_rule,
      change_version: payload.change_version,
      auto_validate: Boolean(payload.auto_validate),
      active: true,
    });
    return { id };
  });
}

export function toggleReconciliationModelStatus(modelId) {
  return updateState((draft) => {
    draft.reconciliationModels = draft.reconciliationModels.map((model) =>
      String(model.id) === String(modelId) ? { ...model, active: !model.active } : model
    );
    return { id: modelId };
  });
}
