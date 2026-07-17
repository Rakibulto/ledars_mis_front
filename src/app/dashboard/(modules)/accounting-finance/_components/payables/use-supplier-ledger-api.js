'use client';

import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

export function useSupplierLedgerApi() {
  // Suppliers come from the procurement vendors API
  const vendorsUrl = `${endpoints.procurement_management.vendors_management}?ordering=-created_at,-id`;
  // Payments come from the accounting supplier-payments API
  const paymentsUrl = `${endpoints.accounting.supplier_payments}?ordering=-date,-id`;

  const { data: rawVendors, isLoading } = useSWR(vendorsUrl, fetcher);
  const { data: rawPayments } = useSWR(paymentsUrl, fetcher);

  const rows = useMemo(() => {
    const vendors = Array.isArray(rawVendors)
      ? rawVendors
      : Array.isArray(rawVendors?.results)
        ? rawVendors.results
        : [];

    const payments = Array.isArray(rawPayments)
      ? rawPayments
      : Array.isArray(rawPayments?.results)
        ? rawPayments.results
        : [];

    // Group payments by vendor ID (SupplierPayment.vendor FK = accounting Vendor id,
    // which mirrors the procurement Supplier id used here)
    const paymentsByVendor = {};
    for (const p of payments) {
      const vid = p.vendor ?? p.supplier_id;
      if (!paymentsByVendor[vid]) paymentsByVendor[vid] = [];
      paymentsByVendor[vid].push(p);
    }

    return [...vendors]
      .sort((left, right) => (Number(right.id) || 0) - (Number(left.id) || 0))
      .map((vendor) => {
        const vendorPayments = paymentsByVendor[vendor.id] || [];
        const latest = vendorPayments[0] || null;

        return {
          id: vendor.id,
          name: vendor.name || vendor.company_name || '',
          code: vendor.vendor_code || vendor.code || '',
          email: vendor.email || '',
          category: vendor.category || '',
          owner: vendor.owner || '',
          holdFlags: 0,
          riskLevel: 'low',
          riskFlags: [],
          billCount: 0,
          overdueBills: 0,
          disputedBills: 0,
          pendingApprovals: 0,
          outstanding: Number(vendor.total_payable ?? vendor.outstanding ?? 0),
          oldestDays: 0,
          lastPaymentDate: latest?.date || null,
          paymentHistoryCount: vendorPayments.length,
          nextPaymentDate: null,
          bills: [],
          latestPaymentId: latest?.id ?? null,
          latestPaymentReference: latest?.payment_number ?? latest?.number ?? null,
          latestPaymentAmount: latest ? Number(latest.amount ?? 0) : null,
          latestPaymentReleaseStatus: latest?.release_status ?? null,
        };
      });
  }, [rawVendors, rawPayments]);

  return { rows, isLoading };
}
