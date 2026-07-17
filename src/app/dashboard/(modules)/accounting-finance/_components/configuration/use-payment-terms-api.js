'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ------------------------------------------------------------
// Enrich a raw backend PaymentTerm into display shape
// ------------------------------------------------------------
function enrichPaymentTerm(term) {
  const dueDays = Number(term.due_days ?? 0);
  const discountDays = Number(term.discount_days ?? 0);
  const discountPercent = Number(term.discount_percent ?? 0);

  return {
    ...term,
    active: term.is_active !== false,
    // Normalise field names the table uses
    dueDays,
    discountDays,
    discountPercent,
    // Derived display fields
    reminderCadence:
      dueDays <= 0
        ? 'Immediate confirmation'
        : dueDays <= 15
          ? '7-day reminder cycle'
          : '14-day reminder cycle',
    approvalWindow:
      discountPercent > 0 ? 'Treasury discount review required' : 'Standard settlement workflow',
    settlementProfile: dueDays > 30 ? 'Extended supplier financing' : 'Standard payable posture',
    installmentLogic:
      term.description ||
      (dueDays > 30 ? '30% milestone, 70% final settlement' : 'Single settlement installment'),
    earlyPaymentModel:
      discountPercent > 0 ? 'Cash discount with forfeiture tracking' : 'No early payment incentive',
  };
}

// ------------------------------------------------------------
// Hook — drop-in for the payment terms slice
// ------------------------------------------------------------
export function usePaymentTermsApi() {
  const termsUrl = endpoints.accounting.payment_terms;

  const { data: rawTerms, isLoading, error } = useSWR(termsUrl, fetcher);

  const paymentTerms = useMemo(() => {
    const list = Array.isArray(rawTerms)
      ? rawTerms
      : Array.isArray(rawTerms?.results)
        ? rawTerms.results
        : [];
    return list.map(enrichPaymentTerm);
  }, [rawTerms]);

  const overview = useMemo(
    () => ({
      activePaymentTerms: paymentTerms.filter((t) => t.active).length,
      discountedTerms: paymentTerms.filter((t) => t.discountPercent > 0).length,
      longDatedTerms: paymentTerms.filter((t) => t.dueDays > 30).length,
    }),
    [paymentTerms]
  );

  // ── Mutations ──────────────────────────────────────────────

  const createPaymentTerm = async (payload) => {
    await axiosInstance.post(termsUrl, {
      name: payload.name,
      due_days: Number(payload.due_days || 0),
      discount_days: Number(payload.discount_days || 0),
      discount_percent: Number(payload.discount_percent || 0),
      is_active: true,
    });
    await mutate(termsUrl);
  };

  const togglePaymentTermStatus = async (termId) => {
    const term = paymentTerms.find((t) => String(t.id) === String(termId));
    if (!term) return;
    await axiosInstance.patch(endpoints.accounting.payment_term_by_id(termId), {
      is_active: !term.active,
    });
    await mutate(termsUrl);
  };

  const updatePaymentTerm = async (id, payload) => {
    await axiosInstance.patch(endpoints.accounting.payment_term_by_id(id), {
      name: payload.name,
      due_days: Number(payload.due_days || 0),
      discount_days: Number(payload.discount_days || 0),
      discount_percent: Number(payload.discount_percent || 0),
    });
    await mutate(termsUrl);
  };

  const deletePaymentTerm = async (id) => {
    await axiosInstance.delete(endpoints.accounting.payment_term_by_id(id));
    await mutate(termsUrl);
  };

  return {
    paymentTerms,
    overview,
    loading: isLoading,
    error,
    actions: {
      createPaymentTerm,
      togglePaymentTermStatus,
      updatePaymentTerm,
      deletePaymentTerm,
    },
  };
}
