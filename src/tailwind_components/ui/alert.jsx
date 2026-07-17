import { X, Info, XCircle, AlertCircle, CheckCircle } from 'lucide-react';

export function Alert({ variant = 'info', title, children, onClose }) {
  const variants = {
    info: {
      container: 'bg-info/10 border-info/20 text-info',
      icon: Info,
    },
    success: {
      container: 'bg-success/10 border-success/20 text-success',
      icon: CheckCircle,
    },
    warning: {
      container: 'bg-warning/10 border-warning/20 text-warning',
      icon: AlertCircle,
    },
    danger: {
      container: 'bg-destructive/10 border-destructive/20 text-destructive',
      icon: XCircle,
    },
  };
  const config = variants[variant];
  const Icon = config.icon;
  return (
    <div className={`relative p-4 rounded-lg border ${config.container}`}>
      <div className="flex gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
