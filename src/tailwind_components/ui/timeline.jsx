import { Clock, Circle, XCircle, CheckCircle } from 'lucide-react';

export function Timeline({ items }) {
  const getIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'current':
        return <Clock className="w-5 h-5 text-primary" />;
      case 'pending':
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };
  const getLineColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success';
      case 'rejected':
        return 'bg-destructive';
      case 'current':
        return 'bg-primary';
      case 'pending':
        return 'bg-border';
    }
  };
  return (
    <div className="space-y-0">
      {items.map((item, index) => (
        <div key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
          {/* Timeline Line */}
          {index < items.length - 1 && (
            <div
              className={`absolute left-[10px] top-8 w-0.5 h-full ${getLineColor(item.status)}`}
            />
          )}

          {/* Icon */}
          <div className="relative z-10 flex-shrink-0 mt-1">{getIcon(item.status)}</div>

          {/* Content */}
          <div className="flex-1 pt-0.5">
            <div className="flex items-start justify-between mb-1">
              <h4 className="font-semibold text-foreground">{item.title}</h4>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                {item.timestamp}
              </span>
            </div>

            {item.description && (
              <p className="text-sm text-muted-foreground mb-1">{item.description}</p>
            )}

            {item.user && (
              <p className="text-sm text-muted-foreground">
                by <span className="font-medium">{item.user}</span>
              </p>
            )}

            {item.comment && (
              <div className="mt-2 p-3 bg-secondary/50 rounded-lg border-l-2 border-primary">
                <p className="text-sm text-foreground italic">"{item.comment}"</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
export function ApprovalTimeline({ approvals }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Approval History</h3>
      <Timeline
        items={approvals.map((approval, index) => ({
          id: `approval-${index}`,
          title: approval.level,
          description: `${approval.approver} - ${approval.role}`,
          user: approval.status !== 'pending' ? approval.approver : undefined,
          timestamp: approval.date || 'Pending',
          status:
            approval.status === 'approved'
              ? 'completed'
              : approval.status === 'rejected'
                ? 'rejected'
                : 'pending',
          comment: approval.comment,
        }))}
      />
    </div>
  );
}
