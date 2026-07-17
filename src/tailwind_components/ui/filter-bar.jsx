import { X, Search } from 'lucide-react';

import { Button } from './button';

export function FilterBar({
  searchPlaceholder = 'Search...',
  onSearch,
  filters = [],
  actions = [],
  activeFiltersCount = 0,
  onClearFilters,
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-4">
        {/* Search */}
        {onSearch && (
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}

        {/* Filters */}
        {filters.length > 0 && (
          <div className="flex items-center gap-3">
            {filters.map((filter, index) => (
              <select
                key={index}
                value={filter.value}
                onChange={(e) => filter.onChange?.(e.target.value)}
                className="px-3 py-2 bg-secondary border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ))}
            {activeFiltersCount > 0 && onClearFilters && (
              <button
                onClick={onClearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
                Clear ({activeFiltersCount})
              </button>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex items-center gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                icon={action.icon}
                onClick={action.onClick}
                size="sm"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
