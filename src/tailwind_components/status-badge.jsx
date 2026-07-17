export function StatusBadge({ status, children }) {
  const statusStyles = {
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    submitted: 'bg-blue-50 text-blue-700 border-blue-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
    'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
    overdue: 'bg-red-50 text-red-700 border-red-200',
    paid: 'bg-green-50 text-green-700 border-green-200',
    unpaid: 'bg-orange-50 text-orange-700 border-orange-200',
    active: 'bg-green-50 text-green-700 border-green-200',
    inactive: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${statusStyles[status]}`}
    >
      {children || status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
    </span>
  );
}
