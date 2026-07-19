import dayjs from 'dayjs';

const BORDER = { style: 'thin', color: { argb: 'FF9E9E9E' } };
const ALL_BORDERS = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };

const COLORS = {
  metaLabel: 'FFFFFFFF',
  metaValue: 'FFFFF2CC',
  header: 'FFF0F0F0',
  section: 'FFE8E8E8',
  main: 'FFF5F5F5',
  sub: 'FFFFFFFF',
  actionSection: 'FFFFB74D',
  offDay: 'FFE0E0E0',
  mark: 'FFFF9800',
};

function triggerDownload(buffer, fileName) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function getCellText(cell) {
  if (!cell) return '';
  if (cell.text != null && String(cell.text).trim()) return String(cell.text).trim();
  if (cell.value == null) return '';
  if (typeof cell.value === 'object' && cell.value.richText) {
    return cell.value.richText.map((part) => part.text).join('').trim();
  }
  return String(cell.value).trim();
}

function parseNumber(value) {
  if (value == null || value === '') return null;
  const num = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(num) ? num : null;
}

function formatExportDate(value) {
  if (!value) return '';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD MMMM YYYY') : String(value);
}

function formatMoney(value) {
  if (value == null || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return num;
}

function applyBorder(cell) {
  cell.border = ALL_BORDERS;
}

function fillCell(cell, color) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
}

function styleHeaderCell(cell, options = {}) {
  applyBorder(cell);
  fillCell(cell, options.bg || COLORS.header);
  cell.font = { bold: true, size: options.size || 11 };
  cell.alignment = {
    vertical: 'middle',
    horizontal: options.align || 'center',
    wrapText: true,
  };
}

function isOffDay(year, month, day) {
  const weekday = dayjs(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`).day();
  return weekday === 5 || weekday === 6;
}

function isMarkedCell(cell) {
  if (!cell) return false;
  const text = getCellText(cell).toLowerCase();
  if (text && !['0', '-', '—'].includes(text)) return true;

  const fill = cell.fill;
  if (fill?.type === 'pattern' && fill.fgColor?.argb) {
    const argb = fill.fgColor.argb.toUpperCase();
    const ignored = new Set([
      'FFFFFFFF',
      'FF000000',
      'FFF0F0F0',
      'FFF5F5F5',
      'FFE8E8E8',
      'FFE0E0E0',
      'FFFFF2CC',
    ]);
    if (!ignored.has(argb)) return true;
  }
  return false;
}

function findRowByLabel(worksheet, labels, maxRows = 30) {
  const normalized = labels.map((label) => label.toLowerCase());
  for (let row = 1; row <= maxRows; row += 1) {
    const rowTexts = [];
    worksheet.getRow(row).eachCell({ includeEmpty: true }, (cell, col) => {
      if (col <= 6) rowTexts.push(getCellText(cell).toLowerCase());
    });
    const joined = rowTexts.join(' ');
    if (normalized.every((label) => joined.includes(label))) {
      return row;
    }
  }
  return null;
}

function parseMonthYearFromTitle(text) {
  const match = String(text || '').match(/monthly action plan\s+([a-z]+),?\s*(\d{4})/i);
  if (!match) return null;
  const month = dayjs(`${match[1]} 1, ${match[2]}`).month() + 1;
  const year = Number(match[2]);
  if (!month || !year) return null;
  return { month, year };
}

function groupMarkedDays(year, month, markedDays) {
  const sorted = [...new Set(markedDays)].sort((a, b) => a - b);
  if (!sorted.length) return [];

  const groups = [];
  let current = [sorted[0]];

  for (let index = 1; index < sorted.length; index += 1) {
    const prev = sorted[index - 1];
    const next = sorted[index];
    let onlyOffDaysBetween = true;
    for (let day = prev + 1; day < next; day += 1) {
      if (!isOffDay(year, month, day)) {
        onlyOffDaysBetween = false;
        break;
      }
    }
    if (next === prev + 1 || onlyOffDaysBetween) {
      current.push(next);
    } else {
      groups.push(current);
      current = [next];
    }
  }
  groups.push(current);
  return groups;
}

function periodOverlapsMonth(period, year, month) {
  const start = dayjs(period.start_date);
  const end = dayjs(period.end_date);
  const monthStart = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const monthEnd = monthStart.endOf('month');
  return !(end.isBefore(monthStart, 'day') || start.isAfter(monthEnd, 'day'));
}

function deriveDatesFromPeriods(periods = []) {
  const valid = periods.filter((period) => Number(period.unit_no) > 0);
  if (!valid.length) return { start_date: null, end_date: null };
  const starts = valid.map((period) => period.start_date).sort();
  const ends = valid.map((period) => period.end_date).sort();
  return { start_date: starts[0], end_date: ends[ends.length - 1] };
}

export async function exportExpenditureWorkbook(data, period = 'yearly') {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Expenditure Plan');

  const project = data?.project || {};
  const periods = data?.periods || data?.years || [];
  const rows = data?.rows || [];
  const currency = project.currency || 'BDT';

  sheet.getColumn(1).width = 14;
  sheet.getColumn(2).width = 42;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 12;

  const metaRows = [
    ['Project title', project.title || ''],
    ['Project partner', project.partner || 'LEDARS'],
    [
      'Project period',
      `${formatExportDate(project.start_date)} to ${formatExportDate(project.end_date)}`,
    ],
  ];

  metaRows.forEach((row, index) => {
    const rowIndex = index + 1;
    const labelCell = sheet.getCell(rowIndex, 1);
    const valueCell = sheet.getCell(rowIndex, 2);
    labelCell.value = row[0];
    valueCell.value = row[1];
    styleHeaderCell(labelCell, { align: 'left' });
    applyBorder(valueCell);
    fillCell(valueCell, COLORS.metaValue);
    valueCell.font = { bold: true };
    sheet.mergeCells(rowIndex, 2, rowIndex, 4 + Math.max(periods.length * 3, 1));
  });

  const headerStart = 5;
  const fixedCols = 4;
  const totalCol = fixedCols + periods.length * 3 + 1;

  const topHeader = sheet.getRow(headerStart);
  topHeader.getCell(1).value = 'Budget Code';
  topHeader.getCell(2).value = 'Expenditure items';
  topHeader.getCell(3).value = 'Unit No';
  topHeader.getCell(4).value = 'Unit Cost';
  topHeader.getCell(5).value = `Planned expenditure in national currency (${currency})`;
  topHeader.getCell(totalCol).value = `Total planned expenditure in national currency (${currency})`;

  sheet.mergeCells(headerStart, 1, headerStart + 2, 1);
  sheet.mergeCells(headerStart, 2, headerStart + 2, 2);
  sheet.mergeCells(headerStart, 3, headerStart + 2, 3);
  sheet.mergeCells(headerStart, 4, headerStart + 2, 4);
  sheet.mergeCells(headerStart, 5, headerStart, fixedCols + periods.length * 3);
  sheet.mergeCells(headerStart, totalCol, headerStart + 2, totalCol);

  for (let col = 1; col <= totalCol; col += 1) {
    styleHeaderCell(topHeader.getCell(col));
  }

  const periodHeader = sheet.getRow(headerStart + 1);
  periods.forEach((item, index) => {
    const startCol = fixedCols + index * 3 + 1;
    periodHeader.getCell(startCol).value = item.label;
    sheet.mergeCells(headerStart + 1, startCol, headerStart + 1, startCol + 2);
    for (let col = startCol; col <= startCol + 2; col += 1) {
      styleHeaderCell(periodHeader.getCell(col));
    }
  });

  const subHeader = sheet.getRow(headerStart + 2);
  periods.forEach((item, index) => {
    const startCol = fixedCols + index * 3 + 1;
    subHeader.getCell(startCol).value = 'Unit No.';
    subHeader.getCell(startCol + 1).value = 'Unit cost';
    subHeader.getCell(startCol + 2).value = 'Cost';
    for (let col = startCol; col <= startCol + 2; col += 1) {
      styleHeaderCell(subHeader.getCell(col), { size: 10 });
    }
  });

  let currentRow = headerStart + 3;
  rows.forEach((row) => {
    const excelRow = sheet.getRow(currentRow);
    const isSection = row.row_type === 'section';
    const isMain = row.row_type === 'main';
    const bg = isSection ? COLORS.section : isMain ? COLORS.main : COLORS.sub;

    if (isSection) {
      excelRow.getCell(1).value = row.title;
      sheet.mergeCells(currentRow, 1, currentRow, totalCol);
      for (let col = 1; col <= totalCol; col += 1) {
        const cell = excelRow.getCell(col);
        applyBorder(cell);
        fillCell(cell, bg);
        cell.font = { bold: true };
      }
      currentRow += 1;
      return;
    }

    excelRow.getCell(1).value = row.budget_code || '';
    excelRow.getCell(2).value = row.title || '';
    excelRow.getCell(3).value = formatMoney(row.unit_no);
    excelRow.getCell(4).value = formatMoney(row.unit_cost);

    const splits = row.period_splits || row.year_splits || [];
    splits.forEach((split, index) => {
      const startCol = fixedCols + index * 3 + 1;
      excelRow.getCell(startCol).value = formatMoney(split.unit_no);
      excelRow.getCell(startCol + 1).value = formatMoney(split.unit_cost);
      excelRow.getCell(startCol + 2).value = formatMoney(split.cost);
    });

    excelRow.getCell(totalCol).value = formatMoney(row.total_cost);

    for (let col = 1; col <= totalCol; col += 1) {
      const cell = excelRow.getCell(col);
      applyBorder(cell);
      fillCell(cell, bg);
      if (col >= 3) cell.alignment = { horizontal: 'right', vertical: 'middle' };
      if (isMain) cell.font = { bold: true };
    }
    currentRow += 1;
  });

  const footerRows = [
    ['Total Expenditure', data?.total_expenditure],
    [`Contingency (${data?.contingency_percent ?? 2}%)`, data?.contingency_amount],
    ['Grand total', data?.grand_total],
  ];

  footerRows.forEach(([label, value], index) => {
    const row = sheet.getRow(currentRow + index);
    sheet.mergeCells(currentRow + index, 1, currentRow + index, totalCol - 1);
    row.getCell(1).value = label;
    row.getCell(totalCol).value = formatMoney(value);
    for (let col = 1; col <= totalCol; col += 1) {
      const cell = row.getCell(col);
      applyBorder(cell);
      fillCell(cell, COLORS.header);
      cell.font = { bold: index === footerRows.length - 1 };
      if (col === totalCol) cell.alignment = { horizontal: 'right' };
      if (col === 1) cell.alignment = { horizontal: 'right' };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const slug = (project.code || project.title || 'project').replace(/[^\w-]+/g, '-').slice(0, 40);
  triggerDownload(buffer, `${slug}-expenditure-${period}.xlsx`);
}

export async function exportActionPlanWorkbook(data, year, month) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Action Plan');

  const project = data?.project || {};
  const monthInfo = data?.month || {};
  const rows = data?.rows || [];
  const daysInMonth = monthInfo.days_in_month || dayjs(`${year}-${month}-01`).daysInMonth();
  const offDays = new Set(monthInfo.off_days || monthInfo.weekend_days || []);

  sheet.getColumn(1).width = 8;
  sheet.getColumn(2).width = 42;
  sheet.getColumn(3).width = 10;

  const titleRows = [
    project.organization || 'LEDARS',
    project.location || '',
    project.title || '',
    monthInfo.label ? `Monthly Action Plan ${monthInfo.label}` : `Monthly Action Plan ${dayjs(`${year}-${month}-01`).format('MMMM, YYYY')}`,
  ];

  titleRows.forEach((text, index) => {
    const row = sheet.getRow(index + 1);
    row.getCell(1).value = text;
    sheet.mergeCells(index + 1, 1, index + 1, 3 + daysInMonth + 1);
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(1).font = { bold: index === 0 || index === 3, size: index === 3 ? 13 : 11 };
    row.height = 20;
  });

  const headerRow = 5;
  sheet.getRow(headerRow).getCell(1).value = 'SL';
  sheet.getRow(headerRow).getCell(2).value = 'Name of Activity';
  sheet.getRow(headerRow).getCell(3).value = 'Target';
  sheet.getRow(headerRow).getCell(4).value = 'Dates';
  sheet.getRow(headerRow).getCell(4 + daysInMonth).value = 'Responsible person';

  sheet.mergeCells(headerRow, 1, headerRow + 1, 1);
  sheet.mergeCells(headerRow, 2, headerRow + 1, 2);
  sheet.mergeCells(headerRow, 3, headerRow + 1, 3);
  sheet.mergeCells(headerRow, 4, headerRow, 3 + daysInMonth);
  sheet.mergeCells(headerRow, 4 + daysInMonth, headerRow + 1, 4 + daysInMonth);

  for (let col = 1; col <= 4 + daysInMonth; col += 1) {
    styleHeaderCell(sheet.getRow(headerRow).getCell(col));
  }

  const dayHeader = sheet.getRow(headerRow + 1);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const cell = dayHeader.getCell(3 + day);
    cell.value = day;
    styleHeaderCell(cell, { bg: offDays.has(day) ? COLORS.offDay : COLORS.header });
  }

  let currentRow = headerRow + 2;
  rows.forEach((row) => {
    const excelRow = sheet.getRow(currentRow);
    const isSection = row.row_type === 'section';
    const isMain = row.row_type === 'main';
    const markSet = new Set(row.day_marks || []);
    const bg = isSection ? COLORS.actionSection : isMain ? COLORS.main : COLORS.sub;

    if (isSection) {
      excelRow.getCell(1).value = row.title;
      sheet.mergeCells(currentRow, 1, currentRow, 3 + daysInMonth + 1);
      for (let col = 1; col <= 3 + daysInMonth + 1; col += 1) {
        const cell = excelRow.getCell(col);
        applyBorder(cell);
        fillCell(cell, bg);
        cell.font = { bold: true };
      }
      currentRow += 1;
      return;
    }

    excelRow.getCell(1).value = row.si_no || '';
    excelRow.getCell(2).value = row.title || '';
    excelRow.getCell(3).value = row.target ?? '';
    excelRow.getCell(4 + daysInMonth).value = row.responsible || '';

    for (let day = 1; day <= daysInMonth; day += 1) {
      const cell = excelRow.getCell(3 + day);
      applyBorder(cell);
      if (offDays.has(day)) {
        fillCell(cell, COLORS.offDay);
      } else {
        fillCell(cell, bg);
        if (markSet.has(day)) {
          fillCell(cell, COLORS.mark);
        }
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    [1, 2, 3, 4 + daysInMonth].forEach((col) => {
      const cell = excelRow.getCell(col);
      applyBorder(cell);
      fillCell(cell, bg);
      if (isMain) cell.font = { bold: true };
      if (col === 1 || col === 3) cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    currentRow += 1;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const slug = (project.code || project.title || 'project').replace(/[^\w-]+/g, '-').slice(0, 40);
  triggerDownload(buffer, `${slug}-action-plan-${year}-${String(month).padStart(2, '0')}.xlsx`);
}

export async function parseExpenditureWorkbook(file) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('The uploaded workbook is empty.');

  const headerRow = findRowByLabel(sheet, ['budget code', 'expenditure items']);
  if (!headerRow) throw new Error('Could not find the expenditure table header (Budget Code).');

  const updates = [];
  for (let rowIndex = headerRow + 3; rowIndex <= sheet.rowCount; rowIndex += 1) {
    const row = sheet.getRow(rowIndex);
    const firstCell = getCellText(row.getCell(1)).toLowerCase();
    if (firstCell.includes('total expenditure') || firstCell.includes('grand total')) break;

    const budgetCode = getCellText(row.getCell(1));
    const title = getCellText(row.getCell(2));
    const unitNo = parseNumber(getCellText(row.getCell(3)));
    const unitCost = parseNumber(getCellText(row.getCell(4)));

    if (!budgetCode && !title) continue;
    if (!budgetCode) continue;
    if (budgetCode.toLowerCase().includes('project activities')) continue;

    updates.push({
      serial_code: budgetCode,
      title,
      unit_no: unitNo,
      unit_cost: unitCost,
    });
  }

  if (!updates.length) {
    throw new Error('No expenditure rows with budget codes were found in the uploaded file.');
  }

  return updates;
}

export async function parseActionPlanWorkbook(file, fallbackYear, fallbackMonth) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('The uploaded workbook is empty.');

  let parsedMonthYear = null;
  for (let row = 1; row <= 6; row += 1) {
    const text = getCellText(sheet.getRow(row).getCell(1));
    parsedMonthYear = parseMonthYearFromTitle(text);
    if (parsedMonthYear) break;
  }

  const year = parsedMonthYear?.year || fallbackYear;
  const month = parsedMonthYear?.month || fallbackMonth;
  if (!year || !month) {
    throw new Error('Could not determine the action plan month/year from the uploaded file.');
  }

  const headerRow = findRowByLabel(sheet, ['sl', 'name of activity', 'target']);
  if (!headerRow) throw new Error('Could not find the action plan table header (SL / Name of Activity).');

  const dayHeaderRow = headerRow + 1;
  const dayColumns = [];
  sheet.getRow(dayHeaderRow).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const day = parseNumber(getCellText(cell));
    if (day && day >= 1 && day <= 31) {
      dayColumns.push({ day, col: colNumber });
    }
  });

  if (!dayColumns.length) {
    throw new Error('Could not find day columns (1–31) in the uploaded action plan.');
  }

  const daysInMonth = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).daysInMonth();
  const updates = [];

  for (let rowIndex = dayHeaderRow + 1; rowIndex <= sheet.rowCount; rowIndex += 1) {
    const row = sheet.getRow(rowIndex);
    const serial = getCellText(row.getCell(1));
    const title = getCellText(row.getCell(2));
    const target = parseNumber(getCellText(row.getCell(3)));

    if (!serial && title.toLowerCase().includes('project activities')) continue;
    if (!serial || !String(serial).includes('.')) continue;

    const markedDays = dayColumns
      .filter(({ day }) => day <= daysInMonth && !isOffDay(year, month, day))
      .filter(({ day, col }) => isMarkedCell(row.getCell(col)))
      .map(({ day }) => day);

    if (!markedDays.length) continue;

    updates.push({
      serial_code: serial,
      title,
      target,
      markedDays,
      year,
      month,
    });
  }

  if (!updates.length) {
    throw new Error('No sub-activity rows with distributed day marks were found in the uploaded file.');
  }

  return { year, month, updates };
}

export function buildProjectPlansPayloadForUpdate(rawProject) {
  return (rawProject.plans || []).map((plan, planIndex) => ({
    serial_no: plan.serial_no || planIndex + 1,
    serial_code: plan.serial_code || String(plan.serial_no || planIndex + 1),
    title: plan.title || '',
    description: plan.description || '',
    duration_days: Number(plan.duration_days || 0),
    start_date: plan.start_date || null,
    end_date: plan.end_date || null,
    status: plan.status || 'Pending',
    assigned_user_ids: (plan.assigned_users || []).map((user) => user.id),
    work_items: (plan.work_items || []).map((item, index) => ({
      id: item.id || undefined,
      title: item.title || `Work item ${index + 1}`,
      state: item.state || 'Todo',
      notes: item.notes || '',
      issues: item.issues || '',
      sort_order: item.sort_order || index + 1,
      scheduled_date: item.scheduled_date || null,
      scheduled_end_date: item.scheduled_end_date || null,
      assigned_to: item.assigned_to?.id || item.assigned_to || null,
    })),
    sub_plans: (plan.sub_plans || []).map((sub, subIndex) => ({
      serial_code: sub.serial_code || `${plan.serial_code || planIndex + 1}.${subIndex + 1}`,
      title: sub.title || '',
      start_date: sub.start_date || null,
      end_date: sub.end_date || null,
      unit_type: sub.unit_type || '',
      unit_no: Number(sub.unit_no || 0),
      unit_cost: Number(sub.unit_cost || 0),
      sort_order: sub.sort_order || subIndex + 1,
      assigned_user_ids: (sub.assigned_users || []).map((user) => user.id),
      unit_periods: (sub.unit_periods || []).map((period) => ({
        period_type: 'range',
        start_date: period.start_date,
        end_date: period.end_date,
        unit_no: Number(period.unit_no || 0),
      })),
    })),
  }));
}

export function mergeExpenditureImportIntoProject(rawProject, expenditureUpdates) {
  const updateMap = new Map(
    expenditureUpdates.map((row) => [String(row.serial_code).trim(), row])
  );

  const plans = buildProjectPlansPayloadForUpdate(rawProject).map((plan) => ({
    ...plan,
    sub_plans: plan.sub_plans.map((sub) => {
      const match = updateMap.get(String(sub.serial_code).trim());
      if (!match) return sub;
      return {
        ...sub,
        unit_no: match.unit_no != null ? match.unit_no : sub.unit_no,
        unit_cost: match.unit_cost != null ? match.unit_cost : sub.unit_cost,
      };
    }),
  }));

  return { plans };
}

export function mergeActionPlanImportIntoProject(rawProject, parsedActionPlan) {
  const { year, month, updates } = parsedActionPlan;
  const updateMap = new Map(updates.map((row) => [String(row.serial_code).trim(), row]));
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;

  const plans = buildProjectPlansPayloadForUpdate(rawProject).map((plan) => ({
    ...plan,
    sub_plans: plan.sub_plans.map((sub) => {
      const match = updateMap.get(String(sub.serial_code).trim());
      if (!match) return sub;

      const totalUnits = Number(match.target ?? sub.unit_no ?? 0);
      const markedDays = match.markedDays.filter((day) => !isOffDay(year, month, day));
      if (!totalUnits || !markedDays.length) return sub;

      const groups = groupMarkedDays(year, month, markedDays);
      const remainingPeriods = (sub.unit_periods || []).filter(
        (period) => !periodOverlapsMonth(period, year, month)
      );

      const newPeriods = groups.map((days) => {
        const start = `${monthKey}-${String(days[0]).padStart(2, '0')}`;
        const end = `${monthKey}-${String(days[days.length - 1]).padStart(2, '0')}`;
        const share = days.length / markedDays.length;
        return {
          period_type: 'range',
          start_date: start,
          end_date: end,
          unit_no: Number((totalUnits * share).toFixed(2)),
        };
      });

      const unitPeriods = [...remainingPeriods, ...newPeriods];
      const derived = deriveDatesFromPeriods(unitPeriods);

      return {
        ...sub,
        unit_no: totalUnits,
        start_date: derived.start_date,
        end_date: derived.end_date,
        unit_periods: unitPeriods,
      };
    }),
  }));

  return { plans, year, month };
}
