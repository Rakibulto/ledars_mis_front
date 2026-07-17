'use client';

// ================= CARD =================
export function Card({ children, className = '', hover = false, padding = 'md' }) {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 md:p-6',
    lg: 'p-5 md:p-8',
  };

  return (
    <div
      className={`
        w-full bg-card border border-border rounded-xl
        ${paddingStyles[padding]}
        ${hover ? 'hover:shadow-md transition-all duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// ================= CARD HEADER =================
export function CardHeader({ title, description = null, action = null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
      {/* Left */}
      <div className="flex-1">
        <h3 className="text-sm sm:text-base font-semibold text-foreground">{title}</h3>

        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {/* Right Action */}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ================= CARD BODY =================
export function CardBody({ children, className = '' }) {
  return <div className={`w-full ${className}`}>{children}</div>;
}

// ================= CARD FOOTER =================
export function CardFooter({ children, className = '' }) {
  return (
    <div
      className={`
        mt-4 pt-4 border-t border-border
        flex flex-col sm:flex-row sm:items-center sm:justify-between
        gap-3
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// 'use client';

// export function Card({ children, className = '', hover = false, padding = 'md' }) {
//   const paddingStyles = {
//     none: 'p-0',
//     sm: 'p-3',
//     md: 'p-4',
//     lg: 'p-5',
//   };

//   return (
//     <div
//       className={`bg-card border border-border rounded-lg ${paddingStyles[padding]} ${
//         hover ? 'hover:shadow-sm transition-shadow' : ''
//       } ${className}`}
//     >
//       {children}
//     </div>
//   );
// }

// export function CardHeader({ title, description = null, action = null }) {
//   return (
//     <div className="flex items-start justify-between mb-3 px-4 pt-4 md:px-5 md:pt-4">
//       <div>
//         <h3 className="text-sm font-semibold text-foreground">{title}</h3>
//         {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
//       </div>
//       {action && <div className="shrink-0 ml-3">{action}</div>}
//     </div>
//   );
// }

// export function CardBody({ children }) {
//   return <div className="px-4 pb-4 md:px-5 md:pb-5">{children}</div>;
// }

// export function CardFooter({ children, className = '' }) {
//   return (
//     <div className={`mt-3 pt-3 border-t border-border px-4 pb-4 md:px-5 md:pb-5 ${className}`}>
//       {children}
//     </div>
//   );
// }
