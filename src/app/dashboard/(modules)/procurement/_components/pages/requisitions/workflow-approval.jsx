'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { useMemo, useState, useCallback } from 'react';
import {
  Eye,
  Clock,
  Users,
  XCircle,
  Loader2,
  UserCheck,
  RotateCcw,
  DollarSign,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  usePatchRequest as patchRequest,
} from 'src/actions/ledars-hook';

import { useAuthContext } from 'src/auth/hooks';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody } from '../../components/ui/card';

// Map API status → step number for display
const STATUS_STEP_MAP = {
  'Pending Approval': { step: 1, stepTitle: 'Pending Approval' },
  'Finance Review': { step: 2, stepTitle: 'Finance Review' },
  'Final Approval': { step: 3, stepTitle: 'Final Approval' },
};

// Current level that maps to each status
const STATUS_TO_LEVEL = {
  'Pending Approval': 1,
  'Finance Review': 2,
  'Final Approval': 3,
};

// What status to move to on Approve / Return / Reject per current status
const NEXT_STATUS_MAP = {
  'Pending Approval': { approve: 'Finance Review', return: 'Draft', reject: 'Rejected' },
  'Finance Review': { approve: 'Final Approval', return: 'Pending Approval', reject: 'Rejected' },
  'Final Approval': { approve: 'Approved', return: 'Finance Review', reject: 'Rejected' },
};

const steps = [
  {
    step: 1,
    title: 'Pending Approval',
    icon: null,
    role: 'Finance / Admin',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    step: 2,
    title: 'Finance Review',
    icon: UserCheck,
    role: 'Finance Head / Area Manager',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  {
    step: 3,
    title: 'Final Approval',
    icon: Users,
    role: 'Final Approver',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
];

function daysAgo(dateStr) {
  if (!dateStr) return 0;
  return Math.max(0, Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24)));
}

/** Render the list of approvers at a given level with their status badges. */
function ApprovalStepsPanel({ approvalSteps, currentLevel, authUser }) {
  const stepsAtLevel = (approvalSteps ?? []).filter((s) => s.approval_level === currentLevel);
  if (!stepsAtLevel.length) return null;

  const approvalMode = stepsAtLevel[0]?.approval_mode;
  const modeLabel =
    approvalMode === 'any_approver'
      ? 'Independent Approval'
      : approvalMode === 'all_approvers'
        ? 'Unanimous Approval'
        : null;
  const username = authUser?.username?.toLowerCase() ?? '';
  const currentUserStep = authUser
    ? (approvalSteps ?? []).find(
        (step) =>
          step.status === 'Pending' &&
          step.approval_mode === 'any_approver' &&
          (step.approver === authUser.id || step.approver_name?.toLowerCase() === username)
      )
    : null;
  const currentUserLabel = currentUserStep?.approver_name || authUser?.username || 'You';
  let renderSteps = stepsAtLevel;
  if (approvalMode === 'any_approver' && currentUserStep) {
    renderSteps = [currentUserStep];
  }

  let headerLabel = `Level ${currentLevel}`;
  if (approvalMode === 'any_approver') {
    headerLabel = currentUserStep
      ? `Independent Approval — ${currentUserLabel}`
      : 'Independent Approval';
  }

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
        <Users className="w-3 h-3" />
        Approval Matrix — {headerLabel}
        {modeLabel && (
          <span
            className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
              approvalMode === 'any_approver'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {modeLabel}
          </span>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {renderSteps.map((step) => (
          <span
            key={step.id}
            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
              step.status === 'Approved'
                ? 'bg-green-50 border-green-200 text-green-700'
                : step.status === 'Rejected'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : step.status === 'Returned'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}
          >
            {step.status === 'Approved' ? (
              <CheckCircle className="w-3 h-3" />
            ) : step.status === 'Rejected' || step.status === 'Returned' ? (
              <XCircle className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {step.approver_name ?? `Approver #${step.approver}`}
            {step.approver_designation ? ` (${step.approver_designation})` : ''}
            {' — '}
            <strong>{step.status}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

export function WorkflowApproval() {
  const { loading: authLoading, user: authUser } = useAuthContext();
  const [activeStep, setActiveStep] = useState('all');
  const [showQuickAction, setShowQuickAction] = useState(null);
  const [comments, setComments] = useState({}); // { [mrfId]: string }
  const [actionLoading, setActionLoading] = useState(null); // mrfId being actioned
  const [actionError, setActionError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch ALL requisitions in workflow statuses — visible to every authenticated
  // user. Action buttons are shown only to the assigned approver (see userCanAct).
  const listUrl = useMemo(
    () =>
      `${endpoints.procurement_management.requisitions}?pagination=false&workflow_view=true&_r=${refreshKey}`,
    [refreshKey]
  );
  const { data: apiData, loading } = useGetRequest(authLoading ? null : listUrl);

  // Support both paginated and array responses
  const allRequisitions = Array.isArray(apiData)
    ? apiData
    : Array.isArray(apiData?.results)
      ? apiData.results
      : [];

  // Only show items that are in a pending workflow state
  const pendingMRFs = allRequisitions
    .filter((r) =>
      ['Pending Approval', 'Finance Review', 'Final Approval', 'Rejected'].includes(r.status)
    )
    .map((r) => ({
      ...r,
      requester: r.created_by?.username || '—',
      office: r.delivery_location_info?.name || '—',
      category: r.category_name || '—',
      amount: parseFloat(r.total_amount || 0),
      budgetCode: r.budget_code_display?.name || '—',
      dateRequired: r.delivery_date || '—',
      dateSubmitted: r.created_at ? new Date(r.created_at).toLocaleDateString() : '—',
      daysWaiting: daysAgo(r.created_at),
      currentLevel: STATUS_TO_LEVEL[r.status] ?? 1,
      ...(STATUS_STEP_MAP[r.status] || { step: 1, stepTitle: r.status }),
    }));

  /**
   * Returns true if the logged-in user has a Pending step for this MRF
   * at the level that corresponds to its current status.
   * Falls back to true for staff/superusers (they can always act).
   */
  const userCanAct = useCallback(
    (mrf) => {
      if (!authUser) return false;
      if (authUser.is_staff || authUser.is_superuser) return true;
      const mrfSteps = mrf.approval_steps ?? [];
      const pendingSteps = mrfSteps.filter((s) => s.status === 'Pending');
      const isIndependent = pendingSteps.some((s) => s.approval_mode === 'any_approver');
      return pendingSteps.some(
        (s) =>
          s.status === 'Pending' &&
          (s.approver_user_id === authUser.id ||
            s.approver_name === authUser.displayName ||
            s.approver_name === authUser.username ||
            s.approver_name === authUser.employee_name) &&
          (isIndependent || s.approval_level === STATUS_TO_LEVEL[mrf.status])
      );
    },
    [authUser]
  );

  const filtered = (activeStep === 'all' ? pendingMRFs : pendingMRFs.filter((m) => m.step === activeStep))
    .slice()
    .sort((a, b) => a.step - b.step);

  const stats = {
    budgetClearance: pendingMRFs.filter((m) => m.step === 1).length,
    endorsement: pendingMRFs.filter((m) => m.step === 2).length,
    overdue: pendingMRFs.filter((m) => m.daysWaiting > 7).length,
    totalAmount: pendingMRFs.reduce((s, m) => s + m.amount, 0),
  };

  const getStepIcon = (step, rowIndex) => {
    const s = steps.find((x) => x.step === step);
    if (!s) return null;
    return (
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center border text-sm font-bold shrink-0 ${s.color}`}
      >
        {rowIndex + 1}
      </div>
    );
  };

  const handleAction = useCallback(
    async (mrf, actionType) => {
      const nextStatus = NEXT_STATUS_MAP[mrf.status]?.[actionType];
      if (!nextStatus) return;

      const comment = comments[mrf.id] || '';
      if ((actionType === 'return' || actionType === 'reject') && !comment.trim()) {
        setActionError(`Comments are required to ${actionType} an MRF.`);
        return;
      }

      setActionLoading(mrf.id);
      setActionError(null);
      try {
        await patchRequest(endpoints.procurement_management.requisitionsChangeStatus(mrf.id), {
          status: nextStatus,
          action:
            actionType === 'approve'
              ? 'Approved'
              : actionType === 'return'
                ? 'Returned'
                : 'Rejected',
          comments: comment || null,
        });
        setShowQuickAction(null);
        setComments((prev) => ({ ...prev, [mrf.id]: '' }));
        setRefreshKey((k) => k + 1); // refetch list
        mutate(endpoints.procurement_management.requisitions); // update list cache immediately
      } catch (err) {
        setActionError(extractErrorMessage(err) || 'Action failed. Please try again.');
      } finally {
        setActionLoading(null);
      }
    },
    [comments]
  );

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
          Workflow Approval Queue
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          All MRFs pending workflow action. Only assigned approvers can approve, return, or reject.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <StatCard
          title="Pending Approval"
          value={loading ? '…' : stats.budgetClearance}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Finance Review"
          value={loading ? '…' : stats.endorsement}
          icon={UserCheck}
          color="purple"
        />
        <StatCard
          title="Overdue (>7 days)"
          value={loading ? '…' : stats.overdue}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Total Value"
          value={loading ? '…' : `৳${(stats.totalAmount / 100000).toFixed(1)}L`}
          icon={DollarSign}
          color="orange"
        />
      </div>

      {/* Step Filters */}
      <div className="flex flex-wrap gap-2 md:gap-3 mb-4 md:mb-6">
        <Button
          variant={activeStep === 'all' ? 'primary' : 'outline'}
          onClick={() => setActiveStep('all')}
        >
          All Pending ({pendingMRFs.length})
        </Button>
        {steps.map((s) => (
          <Button
            key={s.step}
            variant={activeStep === s.step ? 'primary' : 'outline'}
            onClick={() => setActiveStep(s.step)}
          >
            <span className="inline-flex items-center justify-center w-4 h-4 mr-2 text-xs font-bold">{s.step}</span>
            {s.title} ({pendingMRFs.filter((m) => m.step === s.step).length})
          </Button>
        ))}
      </div>

      {/* Global action error */}
      {actionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-700">{actionError}</p>
          <button
            className="ml-auto text-red-400 hover:text-red-600"
            onClick={() => setActionError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Overdue Alert */}
      {!loading && stats.overdue > 0 && (
        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start sm:items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              {stats.overdue} MRF(s) overdue — pending for more than 7 days
            </p>
            <p className="text-xs text-red-600">
              {pendingMRFs
                .filter((m) => m.daysWaiting > 7)
                .map((m) => m.requisition_no)
                .join(', ')}{' '}
              need immediate attention
            </p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading approval queue…
        </div>
      )}

      {/* Pending MRF Cards */}
      {!loading && (
        <div className="space-y-4">
          {filtered.map((mrf, rowIndex) => {
            const canAct = userCanAct(mrf);
            return (
              <Card
                key={mrf.id}
                className={`transition-all ${mrf.daysWaiting > 7 ? 'border-red-200' : ''}`}
              >
                <CardBody>
                  <div className="flex items-start gap-4">
                    {/* Step Icon */}
                    {getStepIcon(mrf.step, rowIndex)}

                    {/* MRF Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                        <Link
                          href={paths.dashboard.procurement.requisitions.detail(mrf.id)}
                          className="text-base md:text-lg font-mono font-semibold text-primary hover:underline"
                        >
                          {mrf.requisition_no || mrf.id}
                        </Link>
                        <Badge variant={mrf.step === 1 ? 'info' : 'primary'} size="sm">
                          {mrf.stepTitle}
                        </Badge>
                        <Badge
                          variant={
                            mrf.priority === 'Urgent'
                              ? 'danger'
                              : mrf.priority === 'High'
                                ? 'warning'
                                : 'default'
                          }
                          size="sm"
                        >
                          {mrf.priority}
                        </Badge>
                        {mrf.daysWaiting > 7 && (
                          <Badge variant="danger" size="sm">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Overdue ({mrf.daysWaiting} days)
                          </Badge>
                        )}
                        {!canAct && (
                          <Badge variant="default" size="sm" className="text-muted-foreground">
                            View only
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Requester</p>
                          <p className="font-medium text-foreground">{mrf.requester}</p>
                          <p className="text-xs text-muted-foreground">{mrf.office}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Department / Category</p>
                          <p className="text-foreground">{mrf.department_name || '—'}</p>
                          <Badge variant="default" size="sm">
                            {mrf.category}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Budget Code</p>
                          <p className="font-mono text-foreground text-xs truncate max-w-[160px]">
                            {mrf.budgetCode}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Amount / Date Required</p>
                          <p className="font-bold text-primary">৳{mrf.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">By {mrf.dateRequired}</p>
                        </div>
                      </div>

                      {/* Matrix approvers panel */}
                      <ApprovalStepsPanel
                        approvalSteps={mrf.approval_steps}
                        currentLevel={mrf.currentLevel}
                        authUser={authUser}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <Link href={paths.dashboard.procurement.requisitions.detail(mrf.id)}>
                        <Button variant="outline" size="sm" className="w-full whitespace-nowrap">
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </Link>
                      {canAct && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setActionError(null);
                            setShowQuickAction(showQuickAction === mrf.id ? null : mrf.id);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Quick Action
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Panel */}
                  {showQuickAction === mrf.id && canAct && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="grid grid-cols-4 gap-3">
                        <div className="col-span-3">
                          <textarea
                            rows={2}
                            value={comments[mrf.id] || ''}
                            onChange={(e) =>
                              setComments((prev) => ({ ...prev, [mrf.id]: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                            placeholder="Add comments (optional for approval, required for return/reject)…"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            className="w-full"
                            disabled={actionLoading === mrf.id}
                            onClick={() => handleAction(mrf, 'approve')}
                          >
                            {actionLoading === mrf.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            disabled={actionLoading === mrf.id}
                            onClick={() => handleAction(mrf, 'return')}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Return
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="w-full"
                            disabled={actionLoading === mrf.id}
                            onClick={() => handleAction(mrf, 'reject')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-xs text-muted-foreground">
                          Approve → <strong>{NEXT_STATUS_MAP[mrf.status]?.approve}</strong> | Return
                          → <strong>{NEXT_STATUS_MAP[mrf.status]?.return}</strong> | Reject →{' '}
                          <strong>Rejected</strong>
                        </p>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <Card>
          <CardBody>
            <div className="py-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-semibold text-foreground">All Clear!</p>
              <p className="text-muted-foreground">No MRFs pending at this approval level.</p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
