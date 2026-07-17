'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest, extractErrorMessage } from 'src/actions/ledars-hook';

// ─── Vendor List (paginated) ─────────────────────────────────────────────────

export function useVendorList({
  page = 1,
  pageSize = 10,
  search = '',
  status = '',
  verification_state = '',
  category = '',
} = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('page_size', pageSize);
  if (search) params.set('search', search);
  if (status && status !== 'all') params.set('status', status);
  if (verification_state && verification_state !== 'all')
    params.set('verification_state', verification_state);
  if (category && category !== 'all') params.set('category', category);
  const url = `${endpoints.procurement_management.vendors_management}?${params.toString()}`;
  return useGetRequest(url);
}

// ─── Vendor Summary ──────────────────────────────────────────────────────────

// ─── Single Vendor Detail ────────────────────────────────────────────────────

export function useVendorDetail(id) {
  const url = id ? endpoints.procurement_management.vendors_management_by_id(id) : null;
  return useGetRequest(url);
}

// ─── Vendor RFQ Invitations ──────────────────────────────────────────────────

export function useVendorRFQInvitations(vendorId) {
  const url = vendorId
    ? `${endpoints.procurement_management.rfq_invitations}?vendor=${vendorId}&page_size=100`
    : null;
  return useGetRequest(url);
}

// ─── Vendor Work Orders ──────────────────────────────────────────────────────

export function useVendorWorkOrders(vendorId) {
  const url = vendorId
    ? `${endpoints.procurement_management.work_orders}?vendor=${vendorId}&page_size=100`
    : null;
  return useGetRequest(url);
}

// ─── Vendor Performance Records ──────────────────────────────────────────────

export function useVendorPerformanceRecords(vendorId) {
  const url = vendorId
    ? `${endpoints.procurement_management.vendor_performance}?supplier=${vendorId}&page_size=100`
    : null;
  return useGetRequest(url);
}

export function useVendorPerformanceSummary(vendorId) {
  const url = vendorId
    ? `${endpoints.procurement_management.vendor_performance_summary}?supplier=${vendorId}`
    : null;
  return useGetRequest(url);
}

// ─── Vendor Create / Update / Delete ────────────────────────────────────────

export function useVendorMutations() {
  const [isMutating, setIsMutating] = useState(false);

  const createVendor = useCallback(async (data) => {
    setIsMutating(true);
    try {
      const res = await axiosInstance.post(
        endpoints.procurement_management.vendor_management,
        data
      );

      return res.data;
    } catch (error) {
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const updateVendor = useCallback(async (id, data) => {
    setIsMutating(true);
    try {
      const res = await axiosInstance.patch(
        endpoints.procurement_management.vendor_management_by_id(id),
        data
      );

      return res.data;
    } catch (error) {
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const deleteVendor = useCallback(async (id) => {
    setIsMutating(true);
    try {
      const res = await axiosInstance.delete(
        endpoints.procurement_management.vendor_management_by_id(id)
      );

      return res.data;
    } catch (error) {
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, []);

  return { createVendor, updateVendor, deleteVendor, isMutating };
}

// ─── Vendor Categories ───────────────────────────────────────────────────────

export function useVendorCategories({ page = 1, pageSize = 20, search = '' } = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('page_size', pageSize);
  if (search) params.set('search', search);
  const url = `${endpoints.procurement_management.vendor_categories}?${params.toString()}`;
  return useGetRequest(url);
}

export function useVendorCategoryMutations() {
  const [isMutating, setIsMutating] = useState(false);

  const createCategory = useCallback(async (data) => {
    setIsMutating(true);
    try {
      const res = await axiosInstance.post(
        endpoints.procurement_management.vendor_categories,
        data
      );
      await mutate(endpoints.procurement_management.vendor_categories);
      return res.data;
    } catch (error) {
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const updateCategory = useCallback(async (id, data) => {
    setIsMutating(true);
    try {
      const res = await axiosInstance.patch(
        endpoints.procurement_management.vendor_category_by_id(id),
        data
      );
      return res.data;
    } catch (error) {
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const deleteCategory = useCallback(async (id) => {
    setIsMutating(true);
    try {
      const res = await axiosInstance.delete(
        endpoints.procurement_management.vendor_category_by_id(id)
      );
      await mutate(endpoints.procurement_management.vendor_categories);
      return res.data;
    } catch (error) {
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, []);

  return { createCategory, updateCategory, deleteCategory, isMutating };
}

// ─── Vendor Category Mappings ────────────────────────────────────────────────

export function useVendorCategoryMappings({ supplierId = null } = {}) {
  const params = new URLSearchParams();
  if (supplierId) params.set('supplier', supplierId);
  const url = `${endpoints.procurement_management.vendor_category_mappings}?${params.toString()}`;
  return useGetRequest(url);
}

// ─── Vendor Verification ─────────────────────────────────────────────────────

export function useVendorVerifications({ page = 1, pageSize = 10, search = '', status = '' } = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('page_size', pageSize);
  if (search) params.set('search', search);
  if (status && status !== 'all') params.set('status', status);
  const url = `${endpoints.procurement_management.vendor_verifications}?pagination=true&${params.toString()}`;
  return useGetRequest(url);
}

export function useVendorVerificationSummary() {
  return useGetRequest(endpoints.procurement_management.vendor_verification_summary);
}

export function useVendorVerificationMutations() {
  const [isMutating, setIsMutating] = useState(false);

  const getPrefillUser = useCallback(async (id) => {
    const res = await axiosInstance.get(
      endpoints.procurement_management.vendor_verification_prefill(id)
    );
    return res.data;
  }, []);

  const approveVendor = useCallback(async (id) => {
    setIsMutating(true);
    try {
      const res = await axiosInstance.patch(
        endpoints.procurement_management.vendor_verification_approve(id)
      );
      await mutate(endpoints.procurement_management.vendor_verifications);
      await mutate(endpoints.procurement_management.vendor_verification_summary);
      toast.success('Vendor approved successfully');
      return res.data;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const rejectVendor = useCallback(async (id, data) => {
    setIsMutating(true);
    try {
      const res = await axiosInstance.patch(
        endpoints.procurement_management.vendor_verification_reject(id),
        data
      );
      await mutate(endpoints.procurement_management.vendor_verifications);
      await mutate(endpoints.procurement_management.vendor_verification_summary);
      toast.success('Vendor application rejected');
      return res.data;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const reviewDocument = useCallback(async (docId, data) => {
    setIsMutating(true);
    try {
      const res = await axiosInstance.patch(
        endpoints.procurement_management.vendor_document_review(docId),
        data
      );
      return res.data;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, []);

  return { getPrefillUser, approveVendor, rejectVendor, reviewDocument, isMutating };
}

// ─── Vendor Performance ───────────────────────────────────────────────────────

export function useVendorPerformance({
  page = 1,
  pageSize = 10,
  search = '',
  supplierId = null,
  year = null,
} = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('page_size', pageSize);
  if (search) params.set('search', search);
  if (supplierId) params.set('supplier', supplierId);
  if (year) params.set('period_year', year);
  const url = `${endpoints.procurement_management.vendor_performance}?${params.toString()}`;
  return useGetRequest(url);
}

// ─── Vendor Blacklist ─────────────────────────────────────────────────────────

export function useVendorBlacklist({
  page = 1,
  pageSize = 10,
  search = '',
  status = '',
  category = '',
} = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('page_size', pageSize);
  if (search) params.set('search', search);
  if (status && status !== 'all') params.set('status', status);
  if (category && category !== 'all') params.set('category', category);
  const url = `${endpoints.procurement_management.vendor_blacklist}?${params.toString()}`;
  return useGetRequest(url);
}

export function useVendorBlacklistSummary() {
  return useGetRequest(endpoints.procurement_management.vendor_blacklist_summary);
}

export function useVendorBlacklistMutations() {
  const [isMutating, setIsMutating] = useState(false);

  const createBlacklist = useCallback(async (data) => {
    setIsMutating(true);
    try {
      const res = await axiosInstance.post(endpoints.procurement_management.vendor_blacklist, data);
      await mutate(endpoints.procurement_management.vendor_blacklist_summary);
      toast.success('Vendor blacklisted successfully');
      return res.data;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const updateBlacklist = useCallback(async (id, data) => {
    setIsMutating(true);
    try {
      const res = await axiosInstance.patch(
        endpoints.procurement_management.vendor_blacklist_by_id(id),
        data
      );
      return res.data;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, []);

  return { createBlacklist, updateBlacklist, isMutating };
}

// ─── Vendor Enlistment ───────────────────────────────────────────────────────

export function useVendorEnlistment({
  page = 1,
  pageSize = 10,
  search = '',
  status = '',
  category = '',
} = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('page_size', pageSize);
  if (search) params.set('search', search);
  if (status && status !== 'all') params.set('status', status);
  if (category) params.set('category', category);
  const url = `${endpoints.procurement_management.vendor_enlistment}?${params.toString()}`;
  return useGetRequest(url);
}

export function useVendorEnlistmentSummary() {
  return useGetRequest(endpoints.procurement_management.vendor_enlistment_summary);
}

export function useVendorEnlistmentMutations() {
  const [isMutating, setIsMutating] = useState(false);

  const createEnlistment = useCallback(async (data) => {
    setIsMutating(true);
    try {
      const res = await axiosInstance.post(
        endpoints.procurement_management.vendor_enlistment,
        data
      );
      await mutate(endpoints.procurement_management.vendor_enlistment_summary);
      toast.success('Enlistment application submitted');
      return res.data;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const approveEnlistment = useCallback(async (id) => {
    setIsMutating(true);
    try {
      const res = await axiosInstance.patch(
        endpoints.procurement_management.vendor_enlistment_approve(id)
      );
      await mutate(endpoints.procurement_management.vendor_enlistment_summary);
      toast.success('Enlistment approved');
      return res.data;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const rejectEnlistment = useCallback(async (id, data) => {
    setIsMutating(true);
    try {
      const res = await axiosInstance.patch(
        endpoints.procurement_management.vendor_enlistment_reject(id),
        data
      );
      await mutate(endpoints.procurement_management.vendor_enlistment_summary);
      toast.success('Enlistment rejected');
      return res.data;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, []);

  return { createEnlistment, approveEnlistment, rejectEnlistment, isMutating };
}

// ─── Vendor Onboarding ───────────────────────────────────────────────────────

export function useVendorOnboardings({ page = 1, pageSize = 10, search = '', status = '' } = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('page_size', pageSize);
  if (search) params.set('search', search);
  if (status && status !== 'all') params.set('status', status);
  const url = `${endpoints.procurement_management.vendor_onboardings}?${params.toString()}`;
  return useGetRequest(url);
}

// ─── Vendor Evaluations ──────────────────────────────────────────────────────

export function useVendorEvaluations({
  page = 1,
  pageSize = 10,
  search = '',
  supplierId = null,
} = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('page_size', pageSize);
  if (search) params.set('search', search);
  if (supplierId) params.set('supplier', supplierId);
  const url = `${endpoints.procurement_management.vendor_evaluations}?${params.toString()}`;
  return useGetRequest(url);
}

export function useVendorEvaluationMutations() {
  const [isMutating, setIsMutating] = useState(false);

  const createEvaluation = useCallback(async (data) => {
    setIsMutating(true);
    try {
      const res = await axiosInstance.post(
        endpoints.procurement_management.vendor_evaluations,
        data
      );
      toast.success('Evaluation submitted');
      return res.data;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, []);

  return { createEvaluation, isMutating };
}
