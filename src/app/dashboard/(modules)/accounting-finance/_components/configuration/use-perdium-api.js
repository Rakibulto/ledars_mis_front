'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ------------------------------------------------------------
// Enrich a raw backend Perdium into display shape
// ------------------------------------------------------------
function enrichPerdium(perdium) {
  const toNum = (v) => Number(v) || 0;
  const areaTypeDisplay =
    perdium.area_type === 'high' ? 'High Expensive Area' : 'Low Expensive Area';

  return {
    ...perdium,
    areaTypeDisplay,
    gradeDisplay: perdium.grade,
    breakfast: toNum(perdium.breakfast),
    lunch: toNum(perdium.lunch),
    dinner: toNum(perdium.dinner),
    others_expenses: toNum(perdium.others_expenses),
    accommodation: toNum(perdium.accommodation),
    total:
      toNum(perdium.breakfast) +
      toNum(perdium.lunch) +
      toNum(perdium.dinner) +
      toNum(perdium.others_expenses) +
      toNum(perdium.accommodation),
  };
}

// ------------------------------------------------------------
// Hook — drop-in for the perdium slice
// ------------------------------------------------------------
export function usePerdiumApi() {
  const perdiumUrl = endpoints.accounting.perdium;

  const { data: rawPerdiums, isLoading, error } = useSWR(perdiumUrl, fetcher);

  const perdiums = useMemo(() => {
    const list = Array.isArray(rawPerdiums)
      ? rawPerdiums
      : Array.isArray(rawPerdiums?.results)
        ? rawPerdiums.results
        : [];
    return list.map(enrichPerdium);
  }, [rawPerdiums]);

  const overview = useMemo(
    () => ({
      totalPerdiums: perdiums.length,
      activePerdiums: perdiums.filter((p) => p.is_active).length,
      highAreaPerdiums: perdiums.filter((p) => p.area_type === 'high').length,
      lowAreaPerdiums: perdiums.filter((p) => p.area_type === 'low').length,
    }),
    [perdiums]
  );

  // ── Mutations ──────────────────────────────────────────────

  const createPerdium = async (payload) => {
    await axiosInstance.post(perdiumUrl, {
      description: payload.description,
      grade: payload.grade,
      area_type: payload.area_type,
      breakfast: Number(payload.breakfast || 0),
      lunch: Number(payload.lunch || 0),
      dinner: Number(payload.dinner || 0),
      others_expenses: Number(payload.others_expenses || 0),
      accommodation: Number(payload.accommodation || 0),
      is_active: true,
    });
    await mutate(perdiumUrl);
  };

  const updatePerdium = async (id, payload) => {
    await axiosInstance.patch(endpoints.accounting.perdium_by_id(id), {
      description: payload.description,
      grade: payload.grade,
      area_type: payload.area_type,
      breakfast: Number(payload.breakfast || 0),
      lunch: Number(payload.lunch || 0),
      dinner: Number(payload.dinner || 0),
      others_expenses: Number(payload.others_expenses || 0),
      accommodation: Number(payload.accommodation || 0),
    });
    await mutate(perdiumUrl);
  };

  const deletePerdium = async (id) => {
    await axiosInstance.delete(endpoints.accounting.perdium_by_id(id));
    await mutate(perdiumUrl);
  };

  const togglePerdiumStatus = async (id) => {
    const perdium = perdiums.find((p) => String(p.id) === String(id));
    if (!perdium) return;
    await axiosInstance.patch(endpoints.accounting.perdium_by_id(id), {
      is_active: !perdium.is_active,
    });
    await mutate(perdiumUrl);
  };

  return {
    perdiums,
    overview,
    loading: isLoading,
    error,
    actions: {
      createPerdium,
      updatePerdium,
      deletePerdium,
      togglePerdiumStatus,
    },
  };
}
