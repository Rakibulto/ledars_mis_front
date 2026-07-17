import { toast } from 'sonner';

export function formatCurrency(value) {
  const amount = Number(value || 0);

  return `BDT ${amount.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value) {
  if (!value) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(value));
}

export function getApprovalLineItems(gin) {
  return Array.isArray(gin?.line_items) ? gin.line_items : [];
}

export function createDecisionLineItems(gin) {
  return getApprovalLineItems(gin).map((line, index) => ({
    localId: String(line.id || `${line.product || 'line'}-${line.item_code || index}`),
    id: line.id || null,
    gin: line.gin || gin?.id || null,
    product: line.product ? String(line.product) : '',
    product_name: line.product_name || '',
    item_code: line.item_code || '',
    item_name: line.item_name || line.product_name || '',
    requested_qty: line.requested_qty ?? line.issued_qty ?? '',
    issued_qty: line.issued_qty ?? '',
    unit: line.unit || '',
    unit_price: line.unit_price ?? '',
    remarks: line.remarks || '',
    item_current_quantity: line.item_current_quantity ?? null,
  }));
}

export function normalizeDecisionLineItems(lineItems) {
  if (!Array.isArray(lineItems) || !lineItems.length) {
    toast.error('No line items are available for approval.');
    return null;
  }

  const normalizedLineItems = lineItems.map((line) => ({
    product: Number(line.product || 0),
    item_code: String(line.item_code || '').trim(),
    item_name: String(line.item_name || line.product_name || '').trim(),
    requested_qty: Number(line.issued_qty || 0),
    issued_qty: Number(line.issued_qty || 0),
    unit: String(line.unit || '').trim(),
    unit_price: Number(line.unit_price || 0),
    remarks: String(line.remarks || '').trim() || null,
    item_current_quantity: Number(line.item_current_quantity || 0),
  }));

  const incompleteLine = normalizedLineItems.find(
    (line) => !line.product || !line.item_code || !line.item_name || !line.unit
  );

  if (incompleteLine) {
    toast.error('Each line item must stay linked to an item before approval.');
    return null;
  }

  const invalidQuantity = normalizedLineItems.find((line) => Number(line.issued_qty || 0) <= 0);

  if (invalidQuantity) {
    toast.error('Issued quantity must be greater than zero.');
    return null;
  }

  const exceedsStock = normalizedLineItems.find(
    (line) => Number(line.issued_qty || 0) > Number(line.item_current_quantity || 0)
  );

  if (exceedsStock) {
    toast.error('Issued quantity must be under the current stock for the selected item.');
    return null;
  }

  return normalizedLineItems.map(({ item_current_quantity, ...line }) => line);
}

export const EMPTY_TRANSPORT = {
  transport_person: '',
  transport_phone: '',
  transport_address: '',
  vehicle_number: '',
  dispatch_date: null,
};
