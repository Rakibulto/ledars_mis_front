import { getAmountInWords } from 'src/utils/amountInWords';

const VOUCHER_TITLES = {
  payment: 'Payment Voucher',
  receipt: 'Receipt Voucher',
  journal: 'Journal Voucher',
  contra: 'Contra Voucher',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatAmount(value) {
  const n = Number(value || 0);
  if (!n) return '';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function resolveAccountLabel(line, accounts = []) {
  if (line.account_code || line.account_name) {
    return `${line.account_code || ''} ${line.account_name || ''}`.trim();
  }
  const acc = accounts.find((a) => String(a.id) === String(line.account));
  if (!acc) return line.description || '—';
  return `${acc.code || ''} ${acc.name || ''}`.trim();
}

function isBankLikeLine(line, accounts = [], bankAccountId = null) {
  if (bankAccountId && String(line.account) === String(bankAccountId)) return true;
  const acc = accounts.find((a) => String(a.id) === String(line.account));
  if (acc?.liquidity_type === 'bank_cash') return true;
  const label = resolveAccountLabel(line, accounts).toLowerCase();
  return /bank|cash/.test(label);
}

function formatBankAccountLabel(bank) {
  if (!bank) return '';
  if (typeof bank === 'string') return bank;
  const parts = [
    bank.name || '',
    bank.bank_name || '',
    bank.account_number ? `A/C ${bank.account_number}` : '',
  ].filter(Boolean);
  const unique = [];
  parts.forEach((p) => {
    if (!unique.length || unique[unique.length - 1] !== p) unique.push(p);
  });
  return unique.join(' — ');
}

/**
 * Build LEDARS-style voucher particulars:
 * - Payment: debit expense/party as Account; non-bank credits as Less; bank credit as through bank
 * - Receipt: credit income as Account; non-bank debits as Less; bank debit as through bank
 * - Journal/Contra: list all lines as particulars
 */
export function buildVoucherPrintModel({
  voucherType = 'payment',
  voucherNumber = '',
  date = '',
  narration = '',
  payee = '',
  project = null,
  lines = [],
  accounts = [],
  bankAccountId = null,
  bankLabel = '',
  bank = null,
  netAmount = null,
}) {
  const filled = (lines || []).filter(
    (l) => l.account && (Number(l.debit) > 0 || Number(l.credit) > 0)
  );

  const accountRows = [];
  const lessRows = [];
  const bankDetails = bank || null;
  let throughBank = formatBankAccountLabel(bank) || bankLabel || '';
  // Always present as a single "Through: Bank A/C - …" line
  if (throughBank && !/^through:/i.test(throughBank)) {
    throughBank = throughBank.replace(/^bank\s*a\/c\s*[-:]?\s*/i, '');
    throughBank = `Through: Bank A/C - ${throughBank}`;
  } else if (!throughBank) {
    throughBank = 'Through: Bank A/C - ';
  }
  let bankLineAmount = 0;

  if (voucherType === 'payment') {
    filled.forEach((line) => {
      const label = resolveAccountLabel(line, accounts);
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;
      const bankish = isBankLikeLine(line, accounts, bankAccountId);
      if (debit > 0 && !bankish) {
        accountRows.push({
          label: line.description ? `${label} — ${line.description}` : label,
          amount: debit,
        });
      } else if (credit > 0 && bankish) {
        bankLineAmount = credit;
        if (!throughBank || throughBank === 'Through: Bank A/C - ') {
          throughBank = `Through: Bank A/C - ${label}`;
        }
      } else if (credit > 0) {
        lessRows.push({
          label: line.description ? `${label} — ${line.description}` : label,
          amount: credit,
        });
      } else if (debit > 0 && bankish) {
        // unusual payment bank debit — still capture
        bankLineAmount = debit;
        if (!throughBank || throughBank === 'Through: Bank A/C - ') throughBank = `Through: Bank A/C - ${label}`;
      }
    });
  } else if (voucherType === 'receipt') {
    filled.forEach((line) => {
      const label = resolveAccountLabel(line, accounts);
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;
      const bankish = isBankLikeLine(line, accounts, bankAccountId);
      if (credit > 0 && !bankish) {
        accountRows.push({
          label: line.description ? `${label} — ${line.description}` : label,
          amount: credit,
        });
      } else if (debit > 0 && bankish) {
        bankLineAmount = debit;
        if (!throughBank || throughBank === 'Through: Bank A/C - ') {
          throughBank = `Through: Bank A/C - ${label}`;
        }
      } else if (debit > 0) {
        lessRows.push({
          label: line.description ? `${label} — ${line.description}` : label,
          amount: debit,
        });
      } else if (credit > 0 && bankish) {
        bankLineAmount = credit;
        if (!throughBank || throughBank === 'Through: Bank A/C - ') throughBank = `Through: Bank A/C - ${label}`;
      }
    });
  } else {
    filled.forEach((line) => {
      const label = resolveAccountLabel(line, accounts);
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;
      const amt = debit || credit;
      accountRows.push({
        label: line.description ? `${label} — ${line.description}` : label,
        amount: amt,
      });
    });
  }

  const gross = accountRows.reduce((s, r) => s + r.amount, 0);
  const lessTotal = lessRows.reduce((s, r) => s + r.amount, 0);
  const computedNet = Math.max(gross - lessTotal, 0);
  // Prefer actual bank movement amount (e.g. 35,000 after VAT/tax)
  const amount =
    bankLineAmount ||
    computedNet ||
    Number(netAmount || 0);

  const projectName = project
    ? `${project.code ? `${project.code} — ` : ''}${project.short_name || project.title || ''}`.trim()
    : '';

  return {
    title: VOUCHER_TITLES[voucherType] || 'Voucher',
    voucherType,
    voucherNumber: voucherNumber || '________',
    date: date || '',
    projectName,
    payee: payee || '',
    narration: narration || '',
    accountRows,
    lessRows,
    throughBank,
    bankDetails,
    amount,
    amountInWords: getAmountInWords(amount) || '________________________________',
  };
}

export function buildVoucherPrintHtml(model) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const accountLines = (model.accountRows || [])
    .map(
      (row, idx) => `
      <tr>
        <td class="lbl">${idx === 0 ? 'Account:' : ''}</td>
        <td class="part">${escapeHtml(row.label)}</td>
        <td class="amt">${escapeHtml(formatAmount(row.amount))}</td>
      </tr>`
    )
    .join('');

  const lessLines = (model.lessRows || [])
    .map(
      (row) => `
      <tr>
        <td class="lbl">Less:</td>
        <td class="part">${escapeHtml(row.label)}</td>
        <td class="amt">${escapeHtml(formatAmount(row.amount))}</td>
      </tr>`
    )
    .join('');

  // Ensure at least two Less blank rows for handwritten use when empty
  const lessBlank =
    !(model.lessRows || []).length
      ? `
      <tr><td class="lbl">Less:</td><td class="part dotted">&nbsp;</td><td class="amt dotted">&nbsp;</td></tr>
      <tr><td class="lbl">Less:</td><td class="part dotted">&nbsp;</td><td class="amt dotted">&nbsp;</td></tr>`
      : model.lessRows.length === 1
        ? `<tr><td class="lbl">Less:</td><td class="part dotted">&nbsp;</td><td class="amt dotted">&nbsp;</td></tr>`
        : '';

  const accountBlank = !(model.accountRows || []).length
    ? `<tr><td class="lbl">Account:</td><td class="part dotted">&nbsp;</td><td class="amt dotted">&nbsp;</td></tr>`
    : '';

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<title>${escapeHtml(model.title)} — ${escapeHtml(model.voucherNumber)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, 'Noto Sans Bengali', sans-serif;
    font-size: 12px;
    color: #000;
    background: #fff;
    padding: 18px 22px;
  }
  .hdr { text-align: center; margin-bottom: 10px; }
  .hdr-inner { display: flex; align-items: center; justify-content: center; gap: 12px; }
  .hdr-logo { width: 56px; height: 56px; object-fit: contain; }
  .hdr-name-img { max-height: 36px; width: auto; object-fit: contain; display: block; margin: 0 auto 2px; }
  .org-full { font-size: 11px; font-weight: 600; margin-top: 2px; }
  .org-addr { font-size: 12px; font-weight: 700; margin-top: 2px; }
  .project { font-size: 12px; font-weight: 700; margin-top: 6px; text-decoration: underline; }
  .title-wrap { text-align: center; margin: 14px 0 12px; }
  .title-pill {
    display: inline-block;
    border: 1.5px solid #000;
    padding: 4px 22px;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.3px;
  }
  .meta {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
    font-size: 12px;
  }
  .meta .field { display: flex; align-items: baseline; gap: 6px; min-width: 42%; }
  .meta .lbl { font-weight: 700; white-space: nowrap; }
  .meta .val {
    flex: 1;
    border-bottom: 1px solid #000;
    min-height: 18px;
    padding: 0 4px;
    font-weight: 600;
  }
  .section-title {
    font-weight: 700;
    font-size: 12px;
    margin: 8px 0 4px;
    border-bottom: 1px solid #000;
    padding-bottom: 2px;
  }
  table.part-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
  }
  table.part-table td {
    vertical-align: bottom;
    padding: 5px 4px;
    border-bottom: 1px dotted #666;
  }
  table.part-table td.lbl { width: 72px; font-weight: 700; border-bottom: none; white-space: nowrap; }
  table.part-table td.part { width: auto; }
  table.part-table td.amt { width: 120px; text-align: right; font-weight: 700; }
  table.part-table td.dotted { border-bottom: 1px dotted #666; min-height: 22px; height: 22px; }
  .net-row {
    display: flex;
    justify-content: flex-end;
    align-items: baseline;
    gap: 10px;
    margin: 8px 0 14px;
    font-weight: 700;
  }
  .net-row .box {
    min-width: 120px;
    border: 1.5px solid #000;
    padding: 4px 8px;
    text-align: right;
  }
  .info-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 10px;
  }
  .info-row .lbl { font-weight: 700; white-space: nowrap; }
  .info-row .fill {
    flex: 1;
    border-bottom: 1px solid #000;
    min-height: 18px;
    padding: 0 4px;
    font-weight: 600;
  }
  .auth {
    display: flex;
    justify-content: space-between;
    gap: 40px;
    margin-top: 40px;
    margin-bottom: 28px;
  }
  .auth .block {
    flex: 1;
    text-align: center;
    max-width: 220px;
  }
  .auth .block:last-child {
    margin-left: auto;
  }
  .auth .line {
    display: block;
    border-top: 1px solid #000;
    padding-top: 4px;
    font-weight: 700;
    margin-top: 48px;
  }
  .sigs {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 40px;
    font-size: 11px;
    font-weight: 700;
  }
  .sigs span {
    flex: 1;
    text-align: center;
    border-top: 1px solid #000;
    padding-top: 6px;
  }
  @media print {
    body { padding: 0; }
    @page { size: A4 portrait; margin: 12mm 14mm; }
  }
</style>
</head><body>
  <div class="hdr">
    <div class="hdr-inner">
      <img class="hdr-logo" src="${baseUrl}/icons/logo.png" alt="" onerror="this.style.display='none'" />
      <div>
        <img class="hdr-name-img" src="${baseUrl}/icons/name_img.png" alt="LEDARS" onerror="this.style.display='none'" />
        <div class="org-full">Local Environment Development and Agricultural Research Society</div>
        <div class="org-addr">Shyamnagar, Satkhira</div>
      </div>
    </div>
    ${model.projectName ? `<div class="project">${escapeHtml(model.projectName)}</div>` : ''}
  </div>

  <div class="title-wrap"><span class="title-pill">${escapeHtml(model.title)}</span></div>

  <div class="meta">
    <div class="field"><span class="lbl">No.</span><span class="val">${escapeHtml(model.voucherNumber)}</span></div>
    <div class="field"><span class="lbl">Date</span><span class="val">${escapeHtml(model.date)}</span></div>
  </div>

  ${model.payee ? `<div class="info-row"><span class="lbl">Payee / Party:</span><span class="fill">${escapeHtml(model.payee)}</span></div>` : ''}

  <div class="section-title">Particulars</div>
  <table class="part-table">
    <tbody>
      ${accountLines || accountBlank}
      ${lessLines}
      ${lessBlank}
    </tbody>
  </table>

  <div class="net-row">
    <span>Amount</span>
    <span class="box">${escapeHtml(formatAmount(model.amount))}</span>
  </div>

  <div class="info-row">
    <span class="lbl"></span>
    <span class="fill">${escapeHtml(model.throughBank || 'Through: Bank A/C - ')}</span>
  </div>
  <div class="info-row">
    <span class="lbl">On account of:</span>
    <span class="fill">${escapeHtml(model.narration || '')}</span>
  </div>
  <div class="info-row">
    <span class="lbl">Amount in words:</span>
    <span class="fill">${escapeHtml(model.amountInWords)}</span>
  </div>

  <div class="auth">
    <div class="block"><span class="line">Receiver's Signature</span></div>
    <div class="block"><span class="line">Authorised Signatory</span></div>
  </div>

  <div class="sigs">
    <span>Prepared by</span>
    <span>Checked by</span>
    <span>Verified by</span>
  </div>
</body></html>`;
}

const PRINT_IFRAME_ID = 'gateway-voucher-print-frame';

/**
 * Print via hidden iframe (no popup window — avoids browser popup blockers).
 * Safe to call after async fetches.
 */
export function printGatewayVoucher(payload) {
  const model = buildVoucherPrintModel(payload);
  const html = buildVoucherPrintHtml(model);

  if (typeof document === 'undefined') {
    throw new Error('Print is only available in the browser.');
  }

  let iframe = document.getElementById(PRINT_IFRAME_ID);
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = PRINT_IFRAME_ID;
    iframe.setAttribute('title', 'Voucher print');
    iframe.setAttribute('aria-hidden', 'true');
    Object.assign(iframe.style, {
      position: 'fixed',
      right: '0',
      bottom: '0',
      width: '0',
      height: '0',
      border: '0',
      opacity: '0',
      pointerEvents: 'none',
    });
    document.body.appendChild(iframe);
  }

  const frameWindow = iframe.contentWindow;
  const frameDoc = frameWindow?.document;
  if (!frameWindow || !frameDoc) {
    throw new Error('Could not prepare print frame.');
  }

  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    try {
      frameWindow.focus();
      frameWindow.print();
    } catch {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    }
  };

  // Wait for images/fonts in the frame when possible
  const images = Array.from(frameDoc.images || []);
  if (images.length) {
    let left = images.length;
    const done = () => {
      left -= 1;
      if (left <= 0) setTimeout(triggerPrint, 50);
    };
    images.forEach((img) => {
      if (img.complete) done();
      else {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });
    setTimeout(triggerPrint, 1200);
  } else {
    setTimeout(triggerPrint, 100);
  }

  return model;
}
