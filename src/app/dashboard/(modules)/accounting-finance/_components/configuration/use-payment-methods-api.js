'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// Backend `payment_type`: cash / bank / cheque / mobile / other
// Map to UI inbound/outbound for chip colouring and metric counts
function paymentTypeToDirection(paymentType) {
  if (paymentType === 'cash' || paymentType === 'mobile') return 'inbound';
  return 'outbound';
}

// ------------------------------------------------------------
// Enrich a raw backend PaymentMethod into the display shape
// the payment-methods.jsx table expects.
// ------------------------------------------------------------
function enrichPaymentMethod(method, journals, index) {
  const direction = paymentTypeToDirection(method.payment_type);
  const journalObj = journals.find((j) => Number(j.id) === Number(method.journal));

  return {
    ...method,
    active: method.is_active !== false,
    // UI uses `type` for inbound/outbound chip + filter counts
    type: direction,
    payment_flow: direction === 'inbound' ? 'Collection flow' : 'Disbursement flow',
    journal: journalObj?.name || '—',
    settlement_days: 0,
    // Derived display-only fields (mirrors old mock enrichment)
    feeRule: index % 2 === 0 ? 'No fee' : 'Pass through bank fee',
    exportProfile:
      method.payment_type === 'bank'
        ? 'SEPA/Bulk bank file'
        : method.payment_type === 'cheque'
          ? 'Controlled cheque run'
          : 'Instant collection feed',
    defaultBehavior:
      direction === 'inbound' ? 'Apply to open receivable' : 'Require treasury approval',
    bankExportConfig:
      method.payment_type === 'bank'
        ? 'ACH XML batch with approval signature'
        : 'Manual settlement route',
    behaviorChain: `${journalObj?.name || 'Journal'} → ${direction === 'inbound' ? 'Collection' : 'Settlement'} → 0 day release`,
  };
}

// ------------------------------------------------------------
// Hook — drop-in replacement for the paymentMethods slice
// that payment-methods.jsx uses via useReferenceConfigWorkspace.
// ------------------------------------------------------------
export function usePaymentMethodsApi() {
  const methodsUrl = endpoints.accounting.payment_methods;
  const journalsUrl = endpoints.accounting.journals;

  const { data: rawMethods, isLoading: methodsLoading, error } = useSWR(methodsUrl, fetcher);
  const { data: rawJournals, isLoading: journalsLoading } = useSWR(journalsUrl, fetcher);

  const journals = useMemo(() => {
    if (Array.isArray(rawJournals)) return rawJournals;
    if (Array.isArray(rawJournals?.results)) return rawJournals.results;
    return [];
  }, [rawJournals]);

  const paymentMethods = useMemo(() => {
    const list = Array.isArray(rawMethods)
      ? rawMethods
      : Array.isArray(rawMethods?.results)
        ? rawMethods.results
        : [];
    return list.map((m, i) => enrichPaymentMethod(m, journals, i));
  }, [rawMethods, journals]);

  const overview = useMemo(
    () => ({
      paymentMethodCount: paymentMethods.length,
      activePaymentMethods: paymentMethods.filter((m) => m.active).length,
    }),
    [paymentMethods]
  );

  // ── Mutations ──────────────────────────────────────────────

  const createPaymentMethod = async (payload) => {
    // Resolve journal FK from name if provided as text — skip if not numeric
    const body = {
      name: payload.name,
      code: payload.code,
      payment_type: payload.payment_type || 'bank',
      is_active: true,
    };
    // Attempt to find a matching journal by name for the FK
    const matchedJournal = journals.find(
      (j) => j.name.toLowerCase() === (payload.journal || '').toLowerCase()
    );
    if (matchedJournal) body.journal = matchedJournal.id;
    await axiosInstance.post(methodsUrl, body);
    await mutate(methodsUrl);
  };

  const togglePaymentMethodStatus = async (methodId) => {
    const method = paymentMethods.find((m) => String(m.id) === String(methodId));
    if (!method) return;
    await axiosInstance.patch(endpoints.accounting.payment_method_by_id(methodId), {
      is_active: !method.active,
    });
    await mutate(methodsUrl);
  };

  const updatePaymentMethod = async (id, payload) => {
    const body = {
      name: payload.name,
      code: payload.code,
      payment_type: payload.payment_type || 'bank',
    };
    const matchedJournal = journals.find(
      (j) => j.name.toLowerCase() === (payload.journal || '').toLowerCase()
    );
    if (matchedJournal) body.journal = matchedJournal.id;
    await axiosInstance.patch(endpoints.accounting.payment_method_by_id(id), body);
    await mutate(methodsUrl);
  };

  const deletePaymentMethod = async (id) => {
    await axiosInstance.delete(endpoints.accounting.payment_method_by_id(id));
    await mutate(methodsUrl);
  };

  return {
    paymentMethods,
    overview,
    loading: methodsLoading || journalsLoading,
    error,
    actions: {
      createPaymentMethod,
      togglePaymentMethodStatus,
      updatePaymentMethod,
      deletePaymentMethod,
    },
  };
}
