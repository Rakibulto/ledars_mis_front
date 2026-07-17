'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ------------------------------------------------------------
// Enrich a raw backend CostCenter record with display fields.
// budgets is the full budgets list to derive utilization.
// allCenters is the full list to resolve parent names.
// ------------------------------------------------------------
function enrichCostCenter(center, budgets, allCenters) {
  const linkedBudgets = budgets.filter((b) => Number(b.cost_center) === Number(center.id));
  const linkedBudgetTotal = linkedBudgets.reduce((sum, b) => sum + Number(b.total_planned || 0), 0);
  const linkedSpentTotal = linkedBudgets.reduce((sum, b) => sum + Number(b.total_actual || 0), 0);
  const budget = linkedBudgets.length ? linkedBudgetTotal : Number(center.budget || 0);
  const spent = linkedBudgets.length ? linkedSpentTotal : Number(center.spent || 0);
  const utilization = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const parentCenter = allCenters.find((c) => Number(c.id) === Number(center.parent));

  return {
    ...center,
    active: center.is_active !== false,
    budget,
    spent,
    utilization,
    reviewState: utilization >= 90 ? 'critical' : utilization >= 70 ? 'watch' : 'healthy',
    driver: linkedBudgets.length
      ? `${linkedBudgets.length} active plan(s)`
      : 'No linked budget plans',
    parentName: center.parent_name || parentCenter?.name || 'Top level',
    hierarchyLabel: center.parent ? 'Child center' : 'Top-level center',
    // Prefer the dedicated manager field, with department kept as a fallback for older records.
    manager: center.manager || center.department_name || '',
    managerOwnership:
      center.manager || center.department_name
        ? `${center.manager || center.department_name} owns approvals and reforecast sign-off`
        : 'Assign owner for approvals',
    budgetLinkage: linkedBudgets.length
      ? `Linked to ${linkedBudgets.length} budget line(s) with actual tracking`
      : 'Awaiting linked budget lines',
  };
}

// ------------------------------------------------------------
// Hook — drop-in replacement for the costCenters slice that
// cost-centers.jsx page needs from usePlanningConfigWorkspace.
// ------------------------------------------------------------
export function useCostCentersApi() {
  const centersUrl = endpoints.accounting.cost_centers;
  const budgetsUrl = endpoints.accounting.budgets;

  const { data: rawCenters, isLoading: centersLoading, error } = useSWR(centersUrl, fetcher);
  const { data: rawBudgets, isLoading: budgetsLoading } = useSWR(budgetsUrl, fetcher);

  const rawCentersList = useMemo(() => {
    if (Array.isArray(rawCenters)) return rawCenters;
    if (Array.isArray(rawCenters?.results)) return rawCenters.results;
    return [];
  }, [rawCenters]);

  const budgets = useMemo(() => {
    if (Array.isArray(rawBudgets)) return rawBudgets;
    if (Array.isArray(rawBudgets?.results)) return rawBudgets.results;
    return [];
  }, [rawBudgets]);

  const costCenters = useMemo(
    () => rawCentersList.map((c) => enrichCostCenter(c, budgets, rawCentersList)),
    [rawCentersList, budgets]
  );

  const overview = useMemo(
    () => ({
      activeCostCenters: costCenters.filter((c) => c.active).length,
      criticalCostCenters: costCenters.filter((c) => c.reviewState === 'critical').length,
      trackedBudget: costCenters.reduce((sum, c) => sum + c.budget, 0),
    }),
    [costCenters]
  );

  // ── Mutations ──────────────────────────────────────────────

  const createCostCenter = async (payload) => {
    const body = {
      code: payload.code,
      name: payload.name,
      manager: payload.manager,
      budget: Number(payload.budget || 0),
      spent: Number(payload.spent || 0),
      is_active: true,
    };
    // Only include parent if a real ID was supplied
    if (payload.parent) body.parent = Number(payload.parent);
    await axiosInstance.post(centersUrl, body);
    await mutate(centersUrl);
  };

  const toggleCostCenterStatus = async (centerId) => {
    const center = costCenters.find((c) => String(c.id) === String(centerId));
    if (!center) return;
    await axiosInstance.patch(endpoints.accounting.cost_center_by_id(centerId), {
      is_active: !center.active,
    });
    await mutate(centersUrl);
  };

  const updateCostCenter = async (id, payload) => {
    const body = {
      code: payload.code,
      name: payload.name,
      manager: payload.manager,
      budget: Number(payload.budget || 0),
    };
    if (payload.parent) body.parent = Number(payload.parent);
    await axiosInstance.patch(endpoints.accounting.cost_center_by_id(id), body);
    await mutate(centersUrl);
  };

  const deleteCostCenter = async (id) => {
    await axiosInstance.delete(endpoints.accounting.cost_center_by_id(id));
    await mutate(centersUrl);
  };

  return {
    costCenters,
    overview,
    loading: centersLoading || budgetsLoading,
    error,
    actions: {
      createCostCenter,
      toggleCostCenterStatus,
      updateCostCenter,
      deleteCostCenter,
    },
  };
}
