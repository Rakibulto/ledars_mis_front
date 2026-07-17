// Accounting utility functions (extracted from demo-data)

// ── Module-level currency state — kept in sync by CurrencyContext via _setCurrencyGlobal ──
let _activeCurrencyCode = 'BDT';
let _exchangeRates = {
  BDT: 1,
  USD: 110,
  EUR: 120,
  GBP: 140,
  JPY: 0.75,
  CAD: 82,
  AUD: 72,
  CHF: 122,
  CNY: 15,
  INR: 1.32,
  SGD: 82,
  HKD: 14,
  AED: 30,
  SAR: 29,
  MYR: 25,
  KRW: 0.083,
  THB: 3.1,
  IDR: 0.0069,
  PKR: 0.39,
  TRY: 3.4,
};

// Called by CurrencyProvider whenever the active currency or rates change
export const _setCurrencyGlobal = (code, rates) => {
  _activeCurrencyCode = code;
  _exchangeRates = rates;
};

const CURRENCY_SYMBOLS = {
  BDT: '৳',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'CA$',
  CHF: 'Fr',
  CNY: '¥',
  INR: '₹',
  SGD: 'S$',
  HKD: 'HK$',
  AED: 'د.إ',
  SAR: '﷼',
  MYR: 'RM',
  KRW: '₩',
  THB: '฿',
  IDR: 'Rp',
  PKR: '₨',
  TRY: '₺',
};

// formatCurrency(amount)              → uses active currency + converts from BDT base
// formatCurrency(amount, 'USD')       → displays in explicit currency (no conversion, existing behaviour)
export const formatCurrency = (amount, currency) => {
  const displayCurrency = currency ?? _activeCurrencyCode;
  let displayAmount = Number(amount || 0);

  // Convert from BDT base to the active currency only when no explicit currency was provided
  if (currency === undefined && displayCurrency !== 'BDT') {
    const toRate = _exchangeRates[displayCurrency] ?? 1;
    displayAmount /= toRate;
  }

  return `${CURRENCY_SYMBOLS[displayCurrency] || displayCurrency}${displayAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const sanitizeExportName = (value, fallback = 'transaction-record') => {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return normalized || fallback;
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const normalizeExportValue = (value) => {
  if (value === undefined || value === null || value === '') return '—';
  if (Array.isArray(value)) return value.map((item) => normalizeExportValue(item)).join(', ');
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if ('label' in value && typeof value.label === 'string') return value.label;
    if ('props' in value && value.props?.children) {
      return normalizeExportValue(value.props.children);
    }
    return JSON.stringify(value);
  }
  return String(value);
};

const csvEscape = (value) => `"${normalizeExportValue(value).replace(/"/g, '""')}"`;

const downloadBlob = (fileName, blob, extension) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${sanitizeExportName(fileName)}.${extension}`;
  link.click();

  setTimeout(() => {
    URL.revokeObjectURL(link.href);
  }, 0);
};

const sanitizeWorksheetName = (value, fallback = 'Sheet') =>
  String(value || fallback)
    .replace(/[\\/*?:\[\]]/g, ' ')
    .trim()
    .slice(0, 31) || fallback;

export const exportCsvFile = (fileName, rows) => {
  if (typeof window === 'undefined' || !rows?.length) return;

  const columns = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row || {}).forEach((key) => set.add(key));
      return set;
    }, new Set())
  );

  const csv = [
    columns.map(csvEscape).join(','),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(fileName, blob, 'csv');
};

export const buildTransactionWorkbookData = ({
  summary = [],
  sections = [],
  tables = [],
  controlChecks = [],
  referenceLinks = [],
  timeline = [],
  auditTrail = [],
}) => {
  const overviewRows = [
    ...summary.map((item) => ({
      area: 'Summary',
      group: '',
      field: item.label,
      value: normalizeExportValue(item.value),
      note: normalizeExportValue(item.helper),
    })),
    ...sections.flatMap((section) =>
      (section.items || []).map((item) => ({
        area: 'Section',
        group: section.title,
        field: item.label,
        value: normalizeExportValue(item.value),
        note: '',
      }))
    ),
    ...controlChecks.map((check) => ({
      area: 'Control Check',
      group: '',
      field: check.label,
      value: normalizeExportValue(check.value || check.status),
      note: normalizeExportValue(check.description),
    })),
    ...referenceLinks.map((link) => ({
      area: 'Related Record',
      group: '',
      field: link.label,
      value: link.href,
      note: normalizeExportValue(link.description),
    })),
    ...timeline.map((item) => ({
      area: 'Timeline',
      group: '',
      field: item.label,
      value: normalizeExportValue(item.status),
      note: [normalizeExportValue(item.description), normalizeExportValue(item.time)]
        .filter((part) => part && part !== '—')
        .join(' | '),
    })),
    ...auditTrail.map((item) => ({
      area: 'Audit Trail',
      group: '',
      field: normalizeExportValue(item.primary),
      value: normalizeExportValue(item.meta),
      note: normalizeExportValue(item.secondary),
    })),
  ];

  const tableSheets = tables.map((table, index) => ({
    name: sanitizeWorksheetName(table.title, `Table ${index + 1}`),
    columns: (table.columns || []).map((column) => ({
      header: column.label,
      key: column.key,
      width: Math.max(16, String(column.label || '').length + 4),
    })),
    rows: (table.rows || []).map((row) =>
      Object.fromEntries(
        (table.columns || []).map((column) => [column.key, normalizeExportValue(row[column.key])])
      )
    ),
  }));

  return { overviewRows, tableSheets };
};

export const exportExcelWorkbook = async (fileName, workbookData) => {
  if (typeof window === 'undefined') return;

  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GitHub Copilot';
  workbook.created = new Date();

  const overviewSheet = workbook.addWorksheet('Overview');
  const overviewColumns = [
    { header: 'Area', key: 'area', width: 18 },
    { header: 'Group', key: 'group', width: 24 },
    { header: 'Field', key: 'field', width: 28 },
    { header: 'Value', key: 'value', width: 40 },
    { header: 'Note', key: 'note', width: 48 },
  ];
  overviewSheet.columns = overviewColumns;
  (workbookData.overviewRows || []).forEach((row) => overviewSheet.addRow(row));

  [
    overviewSheet,
    ...(workbookData.tableSheets || []).map((sheet) => {
      const worksheet = workbook.addWorksheet(sheet.name);
      worksheet.columns = sheet.columns;
      (sheet.rows || []).forEach((row) => worksheet.addRow(row));
      return worksheet;
    }),
  ].forEach((sheet) => {
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' },
    };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(fileName, blob, 'xlsx');
};

export const buildTransactionCsvRows = ({
  summary = [],
  sections = [],
  tables = [],
  controlChecks = [],
  referenceLinks = [],
  timeline = [],
  auditTrail = [],
}) => {
  const summaryRows = summary.map((item) => ({
    area: 'Summary',
    group: '',
    field: item.label,
    value: normalizeExportValue(item.value),
    note: normalizeExportValue(item.helper),
  }));

  const sectionRows = sections.flatMap((section) =>
    (section.items || []).map((item) => ({
      area: 'Section',
      group: section.title,
      field: item.label,
      value: normalizeExportValue(item.value),
      note: '',
    }))
  );

  const tableRows = tables.flatMap((table) =>
    (table.rows || []).map((row, index) => ({
      area: 'Table',
      group: table.title,
      field: `row-${index + 1}`,
      value: table.columns
        .map((column) => `${column.label}: ${normalizeExportValue(row[column.key])}`)
        .join(' | '),
      note: '',
    }))
  );

  const controlRows = controlChecks.map((check) => ({
    area: 'Control Check',
    group: '',
    field: check.label,
    value: normalizeExportValue(check.value || check.status),
    note: normalizeExportValue(check.description),
  }));

  const linkRows = referenceLinks.map((link) => ({
    area: 'Related Record',
    group: '',
    field: link.label,
    value: link.href,
    note: normalizeExportValue(link.description),
  }));

  const timelineRows = timeline.map((item) => ({
    area: 'Timeline',
    group: '',
    field: item.label,
    value: normalizeExportValue(item.status),
    note: [normalizeExportValue(item.description), normalizeExportValue(item.time)]
      .filter((part) => part && part !== '—')
      .join(' | '),
  }));

  const auditRows = auditTrail.map((item) => ({
    area: 'Audit Trail',
    group: '',
    field: normalizeExportValue(item.primary),
    value: normalizeExportValue(item.meta),
    note: normalizeExportValue(item.secondary),
  }));

  return [
    ...summaryRows,
    ...sectionRows,
    ...tableRows,
    ...controlRows,
    ...linkRows,
    ...timelineRows,
    ...auditRows,
  ];
};

const renderPrintDefinitionList = (title, rows = []) => {
  if (!rows.length) return '';

  return `
    <section class="print-card">
      <h2>${escapeHtml(title)}</h2>
      <div class="print-grid">
        ${rows
          .map(
            (row) => `
            <div class="print-field">
              <div class="print-label">${escapeHtml(row.label)}</div>
              <div class="print-value">${escapeHtml(normalizeExportValue(row.value))}</div>
            </div>
          `
          )
          .join('')}
      </div>
    </section>
  `;
};

const renderPrintTable = (table) => {
  if (!table?.columns?.length) return '';

  return `
    <section class="print-card">
      <h2>${escapeHtml(table.title)}</h2>
      <table>
        <thead>
          <tr>${table.columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${
            (table.rows || []).length
              ? table.rows
                  .map(
                    (row) => `
              <tr>
                ${table.columns
                  .map((column) => `<td>${escapeHtml(normalizeExportValue(row[column.key]))}</td>`)
                  .join('')}
              </tr>
            `
                  )
                  .join('')
              : `<tr><td colspan="${table.columns.length}">No related records available.</td></tr>`
          }
        </tbody>
      </table>
    </section>
  `;
};

export const printTransactionPack = ({
  title,
  documentNumber,
  subtitle,
  alerts = [],
  summary = [],
  sections = [],
  tables = [],
  controlChecks = [],
  referenceLinks = [],
  timeline = [],
  auditTrail = [],
}) => {
  if (typeof window === 'undefined') return;

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');
  if (!printWindow) return;

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(documentNumber || title || 'Transaction pack')}</title>
        <style>
          body { font-family: Georgia, 'Times New Roman', serif; margin: 32px; color: #1f2937; background: #fff; }
          .header { border-bottom: 2px solid #1f2937; padding-bottom: 16px; margin-bottom: 24px; }
          .eyebrow { font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #6b7280; margin-bottom: 6px; }
          h1 { margin: 0; font-size: 28px; }
          .subtitle { margin-top: 8px; color: #4b5563; font-size: 14px; }
          .alert { border-left: 4px solid #9ca3af; background: #f9fafb; padding: 12px 14px; margin-bottom: 12px; }
          .print-card { break-inside: avoid; border: 1px solid #d1d5db; padding: 18px; margin-bottom: 18px; border-radius: 10px; }
          h2 { font-size: 16px; margin: 0 0 14px; }
          .print-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 18px; }
          .print-field { border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
          .print-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 4px; }
          .print-value { font-size: 14px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { border: 1px solid #d1d5db; padding: 8px 10px; vertical-align: top; text-align: left; }
          th { background: #f3f4f6; }
          .meta-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px; }
          .meta-item { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .meta-title { font-size: 12px; font-weight: 700; }
          .meta-body { font-size: 12px; color: #4b5563; }
          @media print {
            body { margin: 16px; }
            .print-card { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <header class="header">
          <div class="eyebrow">Transaction Audit Pack</div>
          <h1>${escapeHtml(documentNumber || title || 'Transaction detail')}</h1>
          <div class="subtitle">${escapeHtml(subtitle || title || '')}</div>
        </header>
        ${alerts
          .map(
            (alert) => `
            <div class="alert">
              <strong>${escapeHtml(alert.title || 'Notice')}</strong><br />
              ${escapeHtml(alert.description || '')}
            </div>
          `
          )
          .join('')}
        ${renderPrintDefinitionList('Summary', summary)}
        ${sections.map((section) => renderPrintDefinitionList(section.title, section.items || [])).join('')}
        ${renderPrintDefinitionList(
          'Control Checks',
          controlChecks.map((check) => ({
            label: check.label,
            value: `${normalizeExportValue(check.value || check.status)} | ${normalizeExportValue(check.description)}`,
          }))
        )}
        ${renderPrintDefinitionList(
          'Related Records',
          referenceLinks.map((link) => ({
            label: link.label,
            value: `${normalizeExportValue(link.description)} | ${link.href}`,
          }))
        )}
        ${renderPrintDefinitionList(
          'Workflow Timeline',
          timeline.map((item) => ({
            label: item.label,
            value: [
              normalizeExportValue(item.status),
              normalizeExportValue(item.description),
              normalizeExportValue(item.time),
            ]
              .filter((part) => part && part !== '—')
              .join(' | '),
          }))
        )}
        ${tables.map((table) => renderPrintTable(table)).join('')}
        ${
          auditTrail.length
            ? `
            <section class="print-card">
              <h2>Audit Trail</h2>
              <div class="meta-list">
                ${auditTrail
                  .map(
                    (item) => `
                    <div class="meta-item">
                      <div class="meta-title">${escapeHtml(normalizeExportValue(item.primary))}</div>
                      <div class="meta-body">${escapeHtml(normalizeExportValue(item.secondary))}</div>
                      <div class="print-value">${escapeHtml(normalizeExportValue(item.meta))}</div>
                    </div>
                  `
                  )
                  .join('')}
              </div>
            </section>
          `
            : ''
        }
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

export const exportJsonFile = (fileName, payload) => {
  if (typeof window === 'undefined') return;

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(fileName, blob, 'json');
};
