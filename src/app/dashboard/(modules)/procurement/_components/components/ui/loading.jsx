export function LoadingSpinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };
  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizes[size]} border-primary border-t-transparent rounded-full animate-spin`}
      />
    </div>
  );
}
export function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-8 shadow-2xl text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
export function LoadingCard() {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-secondary rounded w-3/4"></div>
        <div className="h-4 bg-secondary rounded w-1/2"></div>
        <div className="h-4 bg-secondary rounded w-2/3"></div>
      </div>
    </div>
  );
}

/**
 * Full-viewport loading screen.
 * Drop in before your page's return statement whenever primary data is still fetching.
 *
 * @param {string} message - Optional status line shown beneath the spinner.
 */
export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Spinner ring */}
      <div className="relative mb-8">
        {/* Static background track */}
        <div className="w-16 h-16 rounded-full border-[3px] border-muted" />
        {/* Animated foreground ring */}
        <div className="absolute inset-0 w-16 h-16 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
      </div>

      {/* Skeleton shimmer bars — mimic a loading page */}
      <div className="w-64 space-y-3 mb-8">
        <div className="h-3 bg-muted rounded-full animate-pulse" />
        <div className="h-3 bg-muted rounded-full animate-pulse w-4/5" />
        <div className="h-3 bg-muted rounded-full animate-pulse w-3/5" />
        <div className="mt-4 h-2 bg-muted/60 rounded-full animate-pulse w-full" />
        <div className="h-2 bg-muted/60 rounded-full animate-pulse w-5/6" />
      </div>

      {/* Status message */}
      <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">
        {message}
      </p>
    </div>
  );
}
