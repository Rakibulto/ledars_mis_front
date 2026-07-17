'use client';

import { useMemo, useSyncExternalStore } from 'react';

import {
  getDueInvoices,
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

export function useReceivablesWorkspace(cutoffDate) {
  const version = useSyncExternalStore(
    subscribeReceivablesWorkspace,
    getWorkspaceSnapshot,
    getWorkspaceSnapshot
  );

  return useMemo(
    () => ({
      version,
      overview: getReceivablesOverview(cutoffDate),
      alerts: getReceivablesAlerts(cutoffDate),
      customerLedgerRows: getCustomerLedgerRows(cutoffDate),
      agingBuckets: getAgingBuckets(cutoffDate),
      collectionQueue: getCollectionQueue(cutoffDate),
      dueInvoices: getDueInvoices(cutoffDate),
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
    [cutoffDate, version]
  );
}
