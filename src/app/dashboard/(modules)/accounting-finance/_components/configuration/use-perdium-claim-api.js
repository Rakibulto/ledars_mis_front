'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

function enrichClaim(claim) {
  const toNum = (v) => Number(v) || 0;
  return {
    ...claim,
    breakfast_qty: toNum(claim.breakfast_qty),
    breakfast_unit_cost: toNum(claim.breakfast_unit_cost),
    lunch_qty: toNum(claim.lunch_qty),
    lunch_unit_cost: toNum(claim.lunch_unit_cost),
    dinner_qty: toNum(claim.dinner_qty),
    dinner_unit_cost: toNum(claim.dinner_unit_cost),
    accommodation_qty: toNum(claim.accommodation_qty),
    accommodation_unit_cost: toNum(claim.accommodation_unit_cost),
    others_qty: toNum(claim.others_qty),
    others_unit_cost: toNum(claim.others_unit_cost),
    breakfast_total: toNum(claim.breakfast_total),
    lunch_total: toNum(claim.lunch_total),
    dinner_total: toNum(claim.dinner_total),
    accommodation_total: toNum(claim.accommodation_total),
    others_total: toNum(claim.others_total),
    grand_total: toNum(claim.grand_total),
    total_days: toNum(claim.total_days),
  };
}

export function usePerdiumClaimApi() {
  const claimUrl = endpoints.accounting.perdium_claims;

  const { data: rawClaims, isLoading, error } = useSWR(claimUrl, fetcher);

  const loading = isLoading;

  const claims = useMemo(() => {
    const list = Array.isArray(rawClaims)
      ? rawClaims
      : Array.isArray(rawClaims?.results)
        ? rawClaims.results
        : [];
    return list.map(enrichClaim);
  }, [rawClaims]);

  const getClaim = async (id) => {
    const res = await axiosInstance.get(endpoints.accounting.perdium_claim_by_id(id));
    return enrichClaim(res.data);
  };

  const createClaim = async (payload) => {
    const res = await axiosInstance.post(claimUrl, {
      employee_name: payload.employee_name,
      designation: payload.designation,
      grade: payload.grade,
      area_type: payload.area_type,
      purpose_of_travel: payload.purpose_of_travel,
      name_of_project: payload.name_of_project,
      from_date: payload.from_date,
      to_date: payload.to_date,
      total_days: Number(payload.total_days || 0),
      breakfast_qty: Number(payload.breakfast_qty || 0),
      breakfast_unit_cost: Number(payload.breakfast_unit_cost || 0),
      lunch_qty: Number(payload.lunch_qty || 0),
      lunch_unit_cost: Number(payload.lunch_unit_cost || 0),
      dinner_qty: Number(payload.dinner_qty || 0),
      dinner_unit_cost: Number(payload.dinner_unit_cost || 0),
      accommodation_qty: Number(payload.accommodation_qty || 0),
      accommodation_unit_cost: Number(payload.accommodation_unit_cost || 0),
      others_qty: Number(payload.others_qty || 0),
      others_unit_cost: Number(payload.others_unit_cost || 0),
      amount_in_words: payload.amount_in_words || '',
      remarks: payload.remarks || '',
      prepared_by: payload.prepared_by || '',
      reviewed_by: payload.reviewed_by || '',
      finance_by: payload.finance_by || '',
      approved_by: payload.approved_by || '',
      status: 'submitted',
    });
    await mutate(claimUrl);
    return res.data;
  };

  const updateClaim = async (id, payload) => {
    const res = await axiosInstance.patch(endpoints.accounting.perdium_claim_by_id(id), {
      employee_name: payload.employee_name,
      designation: payload.designation,
      grade: payload.grade,
      area_type: payload.area_type,
      purpose_of_travel: payload.purpose_of_travel,
      name_of_project: payload.name_of_project,
      from_date: payload.from_date,
      to_date: payload.to_date,
      total_days: Number(payload.total_days || 0),
      breakfast_qty: Number(payload.breakfast_qty || 0),
      breakfast_unit_cost: Number(payload.breakfast_unit_cost || 0),
      lunch_qty: Number(payload.lunch_qty || 0),
      lunch_unit_cost: Number(payload.lunch_unit_cost || 0),
      dinner_qty: Number(payload.dinner_qty || 0),
      dinner_unit_cost: Number(payload.dinner_unit_cost || 0),
      accommodation_qty: Number(payload.accommodation_qty || 0),
      accommodation_unit_cost: Number(payload.accommodation_unit_cost || 0),
      others_qty: Number(payload.others_qty || 0),
      others_unit_cost: Number(payload.others_unit_cost || 0),
      amount_in_words: payload.amount_in_words || '',
      remarks: payload.remarks || '',
      prepared_by: payload.prepared_by || '',
      reviewed_by: payload.reviewed_by || '',
      finance_by: payload.finance_by || '',
      approved_by: payload.approved_by || '',
    });
    await mutate(claimUrl);
    return res.data;
  };

  const deleteClaim = async (id) => {
    await axiosInstance.delete(endpoints.accounting.perdium_claim_by_id(id));
    await mutate(claimUrl);
  };

  const changeClaimStatus = async (id, status) => {
    const res = await axiosInstance.post(
      `${endpoints.accounting.perdium_claim_by_id(id)}change_status/`,
      { status }
    );
    await mutate(claimUrl);
    return res.data;
  };

  return {
    claims,
    loading,
    error,
    getClaim,
    actions: { createClaim, updateClaim, deleteClaim, changeClaimStatus },
  };

  return {
    claims,
    loading: isLoading,
    error,
    getClaim,
    actions: { createClaim, updateClaim, deleteClaim },
  };
}
