'use client';

import { useMemo, useSyncExternalStore } from 'react';
import useSWR from 'swr';

import { fetcher, endpoints } from 'src/utils/axios';

import {
  getAgingBuckets,
  getStatementList,
  getCollectionQueue,
  getReceivablesAlerts,
  getCustomerLedgerRows,
  getReceivablesOverview,
  queueReceivableStatements,
  createReceivablePaymentPlan,
  markReceivableStatementSent,
  applyReceivableReminderBatch,
  getReceivableStatementPeriods,
  subscribeReceivablesWorkspace,
  getReceivablesWorkspaceVersion,
  advanceReceivableCollectionStage,
  applyReceivableCollectionWorkflow,
} from './mock-data';

const getWorkspaceSnapshot = () => getReceivablesWorkspaceVersion();

function enrichInvoice(inv) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(inv.due_date || inv.date);
  dueDate.setHours(0, 0, 0, 0);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const overdueDays = diffDays < 0 ? Math.abs(diffDays) : 0;

  const balanceDue = Number(inv.balance_due) || 0;
  const isOverdue = overdueDays > 0;
  const isPaid = balanceDue <= 0;

  let priority = 'normal';
  if (isPaid) priority = 'low';
  else if (isOverdue && overdueDays > 60) priority = 'critical';
  else if (isOverdue && overdueDays > 30) priority = 'high';
  else if (isOverdue) priority = 'medium';

  let followUpStage = 'Initial';
  if (isPaid) followUpStage = 'Closed';
  else if (overdueDays > 60) followUpStage = 'Escalation';
  else if (overdueDays > 30) followUpStage = 'Second Reminder';
  else if (overdueDays > 0) followUpStage = 'First Reminder';

  return {
    id: inv.id,
    number: inv.number || inv.invoice_number || `INV-${inv.id}`,
    customerId: inv.customer,
    customer: { name: inv.customer_name || inv.customer_detail?.name || '' },
    customerName: inv.customer_name || inv.customer_detail?.name || '',
    description: inv.description || inv.narration || '',
    date: inv.date || inv.invoice_date,
    dueDate: inv.due_date,
    total: Number(inv.total || inv.total_amount) || 0,
    paidAmount: Number(inv.paid_amount) || 0,
    balanceDue,
    status: inv.status,
    overdueDays,
    priority,
    followUpStage,
    promiseToPay: inv.promise_to_pay || '',
    reminderTemplate: isOverdue ? 'Overdue Reminder' : 'Standard',
    paymentPlanEligible: balanceDue > 0 && overdueDays > 30,
    bucketId:
      overdueDays === 0
        ? 'not-due'
        : overdueDays <= 30
          ? '1-30'
          : overdueDays <= 60
            ? '31-60'
            : overdueDays <= 90
              ? '61-90'
              : '90-plus',
  };
}

export function useReceivablesWorkspace(cutoffDate) {
  const version = useSyncExternalStore(
    subscribeReceivablesWorkspace,
    getWorkspaceSnapshot,
    getWorkspaceSnapshot
  );

  const { data: rawInvoices } = useSWR(endpoints.accounting.customer_invoices, fetcher);

  const allInvoices = useMemo(() => {
    const results = rawInvoices?.results ?? rawInvoices ?? [];
    return results.map(enrichInvoice);
  }, [rawInvoices]);

  const dueInvoices = useMemo(
    () => allInvoices.filter((inv) => inv.balanceDue > 0).sort((a, b) => b.overdueDays - a.overdueDays),
    [allInvoices]
  );

  // Compute customer ledger rows from real invoice data
  const customerLedgerRows = useMemo(() => {
    const customerMap = {};
    allInvoices.forEach((inv) => {
      const custId = inv.customerId;
      if (!customerMap[custId]) {
        customerMap[custId] = { id: custId, name: inv.customerName, invoices: [] };
      }
      customerMap[custId].invoices.push({
        id: inv.id,
        number: inv.number,
        invoice_date: inv.date,
        due_date: inv.dueDate,
        debit: inv.total,
        credit: inv.paidAmount,
        balance: inv.balanceDue,
        overdueDays: inv.overdueDays,
        status: inv.status,
      });
    });
    return Object.values(customerMap).map((c) => ({
      ...c,
      totals: {
        invoiced: c.invoices.reduce((s, i) => s + i.debit, 0),
        collected: c.invoices.reduce((s, i) => s + i.credit, 0),
        outstanding: c.invoices.reduce((s, i) => s + i.balance, 0),
        overdue: c.invoices.filter((i) => i.overdueDays > 0).reduce((s, i) => s + i.balance, 0),
      },
    }));
  }, [allInvoices]);

  // Compute aging buckets from real invoice data
  const agingBuckets = useMemo(() => {
    const bucketIds = ['not-due', '1-30', '31-60', '61-90', '90-plus'];
    const openInvoices = allInvoices.filter((inv) => inv.balanceDue > 0);

    return bucketIds.map((bucketId) => {
      const invoices = openInvoices.filter((inv) => inv.bucketId === bucketId);
      return {
        id: bucketId,
        label: bucketId === 'not-due' ? 'Not due' : bucketId === '90-plus' ? '90+ days' : `${bucketId} days`,
        amount: invoices.reduce((sum, inv) => sum + inv.balanceDue, 0),
        count: invoices.length,
        approvals: 0,
        holds: 0,
        disputed: 0,
        discountEligible: 0,
        blockedSuppliers: 0,
        priorityMix: { critical: 0, high: 0, urgent: 0 },
        bills: invoices,
      };
    });
  }, [allInvoices]);

  return useMemo(
    () => ({
      version,
      overview: getReceivablesOverview(cutoffDate),
      alerts: getReceivablesAlerts(cutoffDate),
      customerLedgerRows,
      agingBuckets,
      collectionQueue: getCollectionQueue(cutoffDate),
      dueInvoices,
      statementList: getStatementList(cutoffDate),
      statementPeriods: getReceivableStatementPeriods(),
      actions: {
        advanceCollectionStage: advanceReceivableCollectionStage,
        applyReminderBatch: applyReceivableReminderBatch,
        applyCollectionWorkflow: applyReceivableCollectionWorkflow,
        createPaymentPlan: createReceivablePaymentPlan,
        queueStatements: queueReceivableStatements,
        markStatementSent: markReceivableStatementSent,
      },
    }),
    [cutoffDate, version, dueInvoices, customerLedgerRows, agingBuckets]
  );
}
