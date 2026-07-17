export function Card({ children, className = '', hover = false, padding = 'md' }) {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  return (
    <div
      className={`bg-card border border-border rounded-lg ${paddingStyles[padding]} ${hover ? 'hover:shadow-md transition-shadow' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
export function CardHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
export function CardBody({ children }) {
  return <div>{children}</div>;
}
export function CardFooter({ children, className = '' }) {
  return <div className={`mt-4 pt-4 border-t border-border ${className}`}>{children}</div>;
}
