/**
 * Client-side CSV / Excel export helpers for Accounts Gateway reports.
 */

function escapeCsvCell(value) {
  if (value == null) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * @param {string} filename
 * @param {Array<Record<string, any>>} rows - array of objects
 * @param {string[]} [columns] - optional column order; defaults to Object.keys of first row
 */
export function downloadCsv(filename, rows, columns) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) {
    throw new Error('No rows to export.');
  }
  const cols = columns?.length ? columns : Object.keys(list[0]);
  const lines = [
    cols.map(escapeCsvCell).join(','),
    ...list.map((row) => cols.map((c) => escapeCsvCell(row[c])).join(',')),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * @param {string} filename
 * @param {{ name: string, rows: Array<Record<string, any>>, columns?: string[] }[]} sheets
 */
export async function downloadXlsx(filename, sheets) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'LEDARS Accounts Gateway';
  workbook.created = new Date();

  const sheetList = Array.isArray(sheets) ? sheets : [];
  if (!sheetList.length) {
    throw new Error('No sheets to export.');
  }

  sheetList.forEach((sheetDef, idx) => {
    const rows = Array.isArray(sheetDef.rows) ? sheetDef.rows : [];
    const cols =
      sheetDef.columns?.length
        ? sheetDef.columns
        : rows.length
          ? Object.keys(rows[0])
          : ['empty'];
    const sheet = workbook.addWorksheet(sheetDef.name || `Sheet${idx + 1}`);
    sheet.columns = cols.map((key) => ({
      header: key,
      key,
      width: Math.min(Math.max(String(key).length + 4, 12), 36),
    }));
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle' };
    rows.forEach((row) => {
      const out = {};
      cols.forEach((c) => {
        out[c] = row[c] ?? '';
      });
      sheet.addRow(out);
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseDateRangeFromQs(qs) {
  if (!qs) return { dateFrom: '', dateTo: '' };
  const params = new URLSearchParams(qs);
  return {
    dateFrom: params.get('date_from') || '',
    dateTo: params.get('date_to') || '',
  };
}
