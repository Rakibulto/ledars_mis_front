import { forwardRef } from 'react';
export const Radio = forwardRef(({ label, className = '', ...props }, ref) => (
  <div className="flex items-center gap-2">
    <input
      ref={ref}
      type="radio"
      className={`w-4 h-4 border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0 cursor-pointer ${className}`}
      {...props}
    />
    {label && <label className="text-sm text-foreground cursor-pointer select-none">{label}</label>}
  </div>
));
Radio.displayName = 'Radio';
