'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ------------------------------------------------------------
// Map backend ReconciliationModel → display shape the table uses.
// The backend uses `model_type` while the UI column label uses `type`.
// ------------------------------------------------------------
function enrichReconciliationModel(model, index) {
  const type = model.model_type || 'manual';

  // Build human-readable amount rule from backend fields
  let amountRule = 'Match amount within tolerance 0.50%';
  if (model.match_amount) {
    const min = Number(model.match_amount_min || 0);
    const max = Number(model.match_amount_max || 0);
    amountRule =
      model.match_amount === 'between'
        ? `Amount between ${min} and ${max}`
        : `Amount ${model.match_amount} than ${min || max}`;
  }

  // Build text rule from backend match_label + match_label_value
  const labelMode = model.match_label || 'contains';
  const labelValue = model.match_label_value || '';
  const textRule = labelValue ? `Label ${labelMode} "${labelValue}"` : `Label match: ${labelMode}`;

  return {
    ...model,
    // Normalise the type field name
    type,
    active: model.is_active !== false,
    // Resolve FK display names supplied by the serializer
    match_journal: model.journal_name || '—',
    match_label: labelValue || labelMode,
    account: model.account_name || '—',
    counterpartDefault: model.account_name || '—',
    // Derived display fields
    ruleCoverage:
      type === 'writeoff' ? 'Bank charges and fee lines' : 'Rounding and small differences',
    matchStrategy:
      type === 'writeoff' ? 'Amount and label exact match' : 'Label suggestion with analyst review',
    amountRule,
    textRule,
    changeVersion: `v1.${index + 1}`,
  };
}

// ------------------------------------------------------------
// Hook — drop-in for the reconciliationModels slice that
// reconciliation-models.jsx uses via useReferenceConfigWorkspace.
// ------------------------------------------------------------
export function useReconciliationModelsApi() {
  const modelsUrl = endpoints.accounting.reconciliation_models;

  const { data: rawModels, isLoading, error } = useSWR(modelsUrl, fetcher);

  const reconciliationModels = useMemo(() => {
    const list = Array.isArray(rawModels)
      ? rawModels
      : Array.isArray(rawModels?.results)
        ? rawModels.results
        : [];
    return list.map((m, i) => enrichReconciliationModel(m, i));
  }, [rawModels]);

  const overview = useMemo(
    () => ({
      activeReconciliationModels: reconciliationModels.filter((m) => m.active).length,
    }),
    [reconciliationModels]
  );

  // ── Mutations ──────────────────────────────────────────────

  const createReconciliationModel = async (payload) => {
    await axiosInstance.post(modelsUrl, {
      name: payload.name,
      model_type: payload.type || 'manual',
      // Backend match_label is a choice (contains/is/starts_with); default 'contains'
      match_label: payload.match_label ? 'contains' : '',
      match_label_value: payload.match_label || '',
      auto_validate: Boolean(payload.auto_validate),
      is_active: true,
      // match_journal and account are FKs — skip if no numeric ID is supplied
    });
    await mutate(modelsUrl);
  };

  const toggleReconciliationModelStatus = async (modelId) => {
    const model = reconciliationModels.find((m) => String(m.id) === String(modelId));
    if (!model) return;
    await axiosInstance.patch(endpoints.accounting.reconciliation_model_by_id(modelId), {
      is_active: !model.active,
    });
    await mutate(modelsUrl);
  };

  const updateReconciliationModel = async (id, payload) => {
    await axiosInstance.patch(endpoints.accounting.reconciliation_model_by_id(id), {
      name: payload.name,
      model_type: payload.type || 'manual',
      match_label: payload.match_label ? 'contains' : '',
      match_label_value: payload.match_label || '',
      auto_validate: Boolean(payload.auto_validate),
    });
    await mutate(modelsUrl);
  };

  const deleteReconciliationModel = async (id) => {
    await axiosInstance.delete(endpoints.accounting.reconciliation_model_by_id(id));
    await mutate(modelsUrl);
  };

  return {
    reconciliationModels,
    overview,
    loading: isLoading,
    error,
    actions: {
      createReconciliationModel,
      toggleReconciliationModelStatus,
      updateReconciliationModel,
      deleteReconciliationModel,
    },
  };
}
