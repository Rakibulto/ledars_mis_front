import { mutate } from 'swr';

import { endpoints } from 'src/utils/axios';

export const MOVE_TYPE_OPTIONS = [
  { value: '', label: 'All Move Types' },
  { value: 'Receipt', label: 'Receipt' },
  { value: 'Delivery', label: 'Delivery' },
  { value: 'Transfer', label: 'Transfer' },
  { value: 'Return', label: 'Return' },
  { value: 'Scrap', label: 'Scrap' },
  { value: 'Adjustment', label: 'Adjustment' },
  { value: 'Status Change', label: 'Status Change' },
];

export const FORM_MOVE_TYPE_OPTIONS = MOVE_TYPE_OPTIONS.filter(
  (option) => option.value && option.value !== 'Status Change'
);

export const DIRECTION_OPTIONS = [
  { value: '', label: 'All Directions' },
  { value: 'in', label: 'Inbound' },
  { value: 'out', label: 'Outbound' },
  { value: 'internal', label: 'Internal' },
];

const INVENTORY_LOG_INSIGHT_PREFIXES = [
  endpoints.storeInventory.inventory_log_analytics,
  endpoints.storeInventory.inventory_log_history,
];

export async function revalidateInventoryLogInsights() {
  await Promise.all(
    INVENTORY_LOG_INSIGHT_PREFIXES.map((prefix) =>
      mutate((key) => typeof key === 'string' && key.startsWith(prefix))
    )
  );
}

export function normalizeCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.results) ? payload.results : [];
}

export function formatDate(value) {
  if (!value) {
    return 'Not recorded';
  }

  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) {
    return 'Not recorded';
  }

  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatQuantity(value, uom) {
  const amount = Number(value || 0);
  const formatted = amount.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${formatted}${uom ? ` ${uom}` : ''}`;
}

export function getMoveTypeChipProps(type) {
  switch (
    String(type || '')
      .trim()
      .toLowerCase()
  ) {
    case 'receipt':
      return { color: 'success', label: 'Receipt' };
    case 'delivery':
      return { color: 'warning', label: 'Delivery' };
    case 'transfer':
      return { color: 'info', label: 'Transfer' };
    case 'return':
      return { color: 'secondary', label: 'Return' };
    case 'scrap':
      return { color: 'error', label: 'Scrap' };
    case 'adjustment':
      return { color: 'primary', label: 'Adjustment' };
    case 'status change':
      return { color: 'info', label: 'Status Change' };
    default:
      return { color: 'default', label: type || 'Unknown' };
  }
}

export function getDirectionChipProps(direction) {
  switch (
    String(direction || '')
      .trim()
      .toLowerCase()
  ) {
    case 'in':
      return { color: 'success', label: 'Inbound' };
    case 'out':
      return { color: 'warning', label: 'Outbound' };
    case 'internal':
      return { color: 'info', label: 'Internal' };
    case 'status':
      return { color: 'secondary', label: 'Status' };
    default:
      return { color: 'default', label: direction || 'Unknown' };
  }
}

export function getHistoryStatusChipProps(status) {
  switch (
    String(status || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
  ) {
    case 'stock_in':
      return { color: 'success', label: 'Stock In' };
    case 'stock_out':
      return { color: 'warning', label: 'Stock Out' };
    case 'stock_transfer':
      return { color: 'info', label: 'Stock Transfer' };
    case 'status_change':
      return { color: 'secondary', label: 'Status Change' };
    default:
      return { color: 'default', label: status || 'Unknown' };
  }
}

export function getInventoryDocumentLabel(documentType) {
  switch (
    String(documentType || '')
      .trim()
      .toLowerCase()
  ) {
    case 'gin':
      return 'Goods Issue Note';
    case 'grn':
    case 'procurement_grn':
      return 'Goods Receipt Note';
    case 'stock_transfer':
      return 'Stock Transfer';
    default:
      return 'Linked Document';
  }
}

export function toDateTimeLocalValue(value) {
  if (!value) {
    return '';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  const localDate = new Date(parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60000);

  return localDate.toISOString().slice(0, 16);
}

export function buildInventoryLogQuery({
  baseUrl,
  search,
  moveType,
  direction,
  product,
  doneBy,
  dateFrom,
  dateTo,
  page,
  pageSize = 10,
  pagination,
}) {
  const params = new URLSearchParams();

  params.set('ordering', '-created_at');

  if (search?.trim()) {
    params.set('search', search.trim());
  }

  if (moveType) {
    params.set('move_type', moveType);
  }

  if (direction) {
    params.set('direction', direction);
  }

  if (product) {
    params.set('product', String(product));
  }

  if (doneBy) {
    params.set('done_by', String(doneBy));
  }

  if (dateFrom) {
    params.set('date_from', dateFrom);
  }

  if (dateTo) {
    params.set('date_to', dateTo);
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String(page + 1));
    params.set('page_size', String(pageSize));
  }

  return `${baseUrl}?${params.toString()}`;
}
