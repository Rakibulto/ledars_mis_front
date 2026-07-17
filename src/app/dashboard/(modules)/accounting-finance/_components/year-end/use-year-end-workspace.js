'use client';

import { useMemo, useSyncExternalStore } from 'react';

import {
  getYearEndAlerts,
  getYearEndPeriods,
  lockYearEndPeriod,
  advanceYearEndStep,
  getYearEndOverview,
  getYearEndAuditTrail,
  reopenYearEndClosing,
  getYearEndFiscalYears,
  getYearEndLockSummary,
  getYearEndLockHistory,
  lockAllYearEndPeriods,
  completeYearEndClosing,
  getYearEndClosingSteps,
  getYearEndReopenStatus,
  validateYearEndClosing,
  getYearEndCloseCalendar,
  getSelectedFiscalYearId,
  selectYearEndFiscalYear,
  getYearEndClosingEntries,
  getYearEndClosingHistory,
  getYearEndOpeningEntries,
  subscribeYearEndWorkspace,
  getYearEndValidationChecks,
  getYearEndWorkspaceVersion,
  publishYearEndOpeningEntries,
  generateYearEndOpeningEntries,
  getYearEndExceptionPermissions,
  updateYearEndExceptionPermission,
} from './mock-data';

const getWorkspaceSnapshot = () => getYearEndWorkspaceVersion();

export function useYearEndWorkspace() {
  const version = useSyncExternalStore(
    subscribeYearEndWorkspace,
    getWorkspaceSnapshot,
    getWorkspaceSnapshot
  );

  return useMemo(() => {
    const selectedFiscalYearId = getSelectedFiscalYearId();

    return {
      version,
      selectedFiscalYearId,
      fiscalYears: getYearEndFiscalYears(),
      overview: getYearEndOverview(selectedFiscalYearId),
      alerts: getYearEndAlerts(selectedFiscalYearId),
      steps: getYearEndClosingSteps(selectedFiscalYearId),
      closingHistory: getYearEndClosingHistory(),
      validation: getYearEndValidationChecks(selectedFiscalYearId),
      closingEntries: getYearEndClosingEntries(selectedFiscalYearId),
      auditTrail: getYearEndAuditTrail(selectedFiscalYearId),
      reopenStatus: getYearEndReopenStatus(selectedFiscalYearId),
      openingBatch: getYearEndOpeningEntries(selectedFiscalYearId),
      periods: getYearEndPeriods(selectedFiscalYearId),
      lockSummary: getYearEndLockSummary(selectedFiscalYearId),
      closeCalendar: getYearEndCloseCalendar(selectedFiscalYearId),
      lockHistory: getYearEndLockHistory(selectedFiscalYearId),
      exceptionPermissions: getYearEndExceptionPermissions(selectedFiscalYearId),
      actions: {
        setFiscalYear: selectYearEndFiscalYear,
        advanceStep: advanceYearEndStep,
        validateClosing: validateYearEndClosing,
        generateOpeningEntries: generateYearEndOpeningEntries,
        publishOpeningEntries: publishYearEndOpeningEntries,
        lockPeriod: lockYearEndPeriod,
        lockAllPeriods: lockAllYearEndPeriods,
        updateExceptionPermission: updateYearEndExceptionPermission,
        reopenClosing: reopenYearEndClosing,
        completeClosing: completeYearEndClosing,
      },
    };
  }, [version]);
}
