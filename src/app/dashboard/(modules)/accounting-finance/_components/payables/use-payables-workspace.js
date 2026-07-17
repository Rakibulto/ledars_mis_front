'use client';

import { useMemo, useSyncExternalStore } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import {
  getPayablesAlerts,
  getPaymentSchedule,
  getPayablesOverview,
  schedulePayableBatch,
  getSupplierLedgerRows,
  getPayableAgingBuckets,
  queuePayableStatements,
  releasePayableStatement,
  applyPayableBillWorkflow,
  getSupplierStatementList,
  reconcilePayableStatement,
  getPayableStatementPeriods,
  subscribePayablesWorkspace,
  getPayablesWorkspaceVersion,
} from './mock-data';

const getWorkspaceSnapshot = () => getPayablesWorkspaceVersion();

function enrichUnpaidBills(rawBills) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (rawBills ?? []).map((bill) => {
    const dueDate = new Date(bill.due_date);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const overdueDays = diffDays < 0 ? Math.abs(diffDays) : 0;
    const dueInDays = diffDays >= 0 ? diffDays : 0;

    let approvalState = 'review';
    if (['approved', 'posted', 'partial', 'paid'].includes(bill.status)) approvalState = 'approved';
    else if (bill.status === 'pending') approvalState = 'pending';

    let priority = 'scheduled';
    if (overdueDays > 60) priority = 'critical';
    else if (overdueDays > 30) priority = 'high';
    else if (overdueDays > 0) priority = 'urgent';

    let paymentStage = 'Approval queue';
    if (['approved', 'posted'].includes(bill.status)) paymentStage = 'Treasury queue';
    else if (bill.status === 'partial') paymentStage = 'Partial payment';
    else if (bill.status === 'overdue') paymentStage = 'Exception review';

    return {
      id: bill.id,
      number: bill.number || bill.bill_number,
      supplierId: bill.vendor_detail?.id || bill.vendor,
      supplier: bill.vendor_detail ? { name: bill.vendor_detail.name } : { name: '' },
      description: bill.notes || '',
      issueDate: bill.bill_date,
      dueDate: bill.due_date,
      total: Number(bill.total_amount) || 0,
      paidAmount: Number(bill.amount_paid) || 0,
      balanceDue: Number(bill.amount_due || bill.balance_due) || 0,
      status: bill.status,
      approvalState,
      priority,
      paymentStage,
      overdueDays,
      dueInDays,
      holdReason: '',
      disputed: Boolean(bill.dispute_flag),
      scheduledPaymentDate: '',
      paymentMethod: '',
      approvalOwner: '',
      discountEligible: false,
      exceptionReason: bill.dispute_flag ? 'Dispute flagged' : '',
      bucketId: overdueDays === 0 ? 'not-due' : overdueDays <= 30 ? '1-30' : overdueDays <= 60 ? '31-60' : overdueDays <= 90 ? '61-90' : '90-plus',
    };
  });
}

export function usePayablesWorkspace(cutoffDate) {
  const version = useSyncExternalStore(
    subscribePayablesWorkspace,
    getWorkspaceSnapshot,
    getWorkspaceSnapshot
  );

  const { data: rawUnpaid } = useSWR(
    `${endpoints.accounting.bills}unpaid/`,
    fetcher
  );

  const unpaidBills = useMemo(() => {
    const results = rawUnpaid?.results ?? rawUnpaid ?? [];
    return enrichUnpaidBills(results);
  }, [rawUnpaid]);

  return useMemo(
    () => ({
      version,
      overview: getPayablesOverview(cutoffDate),
      alerts: getPayablesAlerts(cutoffDate),
      supplierLedgerRows: getSupplierLedgerRows(cutoffDate),
      agingBuckets: getPayableAgingBuckets(cutoffDate),
      unpaidBills,
      paymentSchedule: getPaymentSchedule(cutoffDate),
      statementList: getSupplierStatementList(cutoffDate),
      statementPeriods: getPayableStatementPeriods(),
      actions: {
        scheduleBill: (id, draft) => axiosInstance.patch(endpoints.accounting.bill_by_id(id), {
          payment_proposal: draft?.proposal || `Scheduled for ${draft?.date || 'next run'} via ${draft?.method || ''}`,
          notes: draft?.note || `Scheduled for ${draft?.date || 'next run'}.`,
        }).then(() => mutate(`${endpoints.accounting.bills}unpaid/`)),
        scheduleBatch: schedulePayableBatch,
        applyBillWorkflow: applyPayableBillWorkflow,
        toggleBillHold: (id, draft) => axiosInstance.patch(endpoints.accounting.bill_by_id(id), {
          payment_proposal: draft?.reason ? `On hold: ${draft.reason}` : '',
          notes: draft?.reason
            ? `Hold applied: ${draft.reason}`
            : 'Hold released.',
        }).then(() => mutate(`${endpoints.accounting.bills}unpaid/`)),
        releaseStatement: releasePayableStatement,
        queueStatements: queuePayableStatements,
        reconcileStatement: reconcilePayableStatement,
      },
    }),
    [cutoffDate, version, unpaidBills]
  );
}
