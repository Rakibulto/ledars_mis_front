import { forwardRef } from 'react';
export const Textarea = forwardRef(
  ({ label, error, helperText, className = '', ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={`w-full px-3 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-vertical ${error ? 'border-destructive focus:ring-destructive' : ''} ${className}`}
        rows={4}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';
