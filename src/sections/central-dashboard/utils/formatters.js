import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function formatNumber(value) {
  const num = Number(value) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function formatCurrency(value, currency = 'BDT') {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(date) {
  if (!date) return '—';
  return dayjs(date).format('MMM DD, YYYY');
}

export function formatTime(date) {
  if (!date) return '—';
  return dayjs(date).format('hh:mm A');
}

export function formatDateTime(date) {
  if (!date) return '—';
  return dayjs(date).format('MMM DD, YYYY hh:mm A');
}

export function formatRelativeTime(date) {
  if (!date) return 'Just now';
  const d = dayjs(date);
  if (!d.isValid()) return 'Just now';
  return d.fromNow();
}

export function formatPercent(value) {
  const num = Number(value) || 0;
  return `${num.toFixed(1)}%`;
}

export function getGreeting() {
  const hour = dayjs().hour();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}
