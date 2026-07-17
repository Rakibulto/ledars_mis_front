import {
  exportCsvFile,
  exportJsonFile,
  exportExcelWorkbook,
  printTransactionPack,
  buildTransactionCsvRows,
  buildTransactionWorkbookData,
} from '../utils';

function normalizeConfig(config) {
  return {
    title: config.title,
    subtitle: config.subtitle || '',
    documentNumber: config.documentNumber || config.title,
    alerts: config.alerts || [],
    summary: config.summary || [],
    sections: config.sections || [],
    tables: config.tables || [],
    controlChecks: config.controlChecks || [],
    referenceLinks: config.referenceLinks || [],
    timeline: config.timeline || [],
    auditTrail: config.auditTrail || [],
    payload: config.payload || {},
  };
}

export function printYearEndPack(config) {
  printTransactionPack(normalizeConfig(config));
}

export function exportYearEndCsv(fileName, config) {
  exportCsvFile(fileName, buildTransactionCsvRows(normalizeConfig(config)));
}

export function exportYearEndExcel(fileName, config) {
  exportExcelWorkbook(fileName, buildTransactionWorkbookData(normalizeConfig(config)));
}

export function exportYearEndJson(fileName, config) {
  exportJsonFile(fileName, {
    title: config.title,
    subtitle: config.subtitle,
    generatedAt: new Date().toISOString(),
    ...config.payload,
  });
}
