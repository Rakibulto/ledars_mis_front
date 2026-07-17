'use client';

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon = null,
  iconPosition = 'left',
  children,
  className = '',
  disabled = false,
  fullWidth = false, // 🔥 new prop
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary',
    outline: 'border-2 border-border bg-transparent hover:bg-secondary focus:ring-primary',
    ghost: 'bg-transparent hover:bg-secondary focus:ring-primary',
    danger:
      'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive',
    success: 'bg-success text-success-foreground hover:bg-success/90 focus:ring-success',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // 🔥 Responsive width control
  const widthClass = fullWidth ? 'w-full' : 'w-full sm:w-auto';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
    </button>
  );
}

// export function Button({
//   variant = 'primary',
//   size = 'md',
//   icon: Icon = null,
//   iconPosition = 'left',
//   children,
//   className = '',
//   disabled = false,
//   ...props
// }) {
//   const baseStyles =
//     'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
//   const variants = {
//     primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
//     secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary',
//     outline: 'border-2 border-border bg-transparent hover:bg-secondary focus:ring-primary',
//     ghost: 'bg-transparent hover:bg-secondary focus:ring-primary',
//     danger:
//       'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive',
//     success: 'bg-success text-success-foreground hover:bg-success/90 focus:ring-success',
//   };
//   const sizes = {
//     sm: 'px-3 py-1.5 text-sm',
//     md: 'px-4 py-2 text-sm',
//     lg: 'px-6 py-3 text-base',
//   };
//   return (
//     <button
//       className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
//       disabled={disabled}
//       {...props}
//     >
//       {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
//       {children}
//       {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
//     </button>
//   );
// }
