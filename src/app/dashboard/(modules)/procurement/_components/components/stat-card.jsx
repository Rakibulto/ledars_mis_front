export function StatCard({ title, value, icon: Icon, trend = null, color = 'blue' }) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3 md:p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-1 leading-tight">{title}</p>
          <p className="text-xl font-semibold text-foreground">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div
          className={`w-8 h-8 rounded-lg shrink-0 ${colorStyles[color]} flex items-center justify-center`}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
