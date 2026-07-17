export const STOCK_ADJUSTMENT_APPROVAL_WORKFLOW_URL =
  '/api/approval-workflows/?module_type=inventory&menu=stock_adjustment';

export const NO_WORKFLOW_LEVEL_MESSAGE =
  'Please contact the admin to configure the Approval Workflow properly with level-based permissions from the Approval Workflow settings.';

export function normalizeWorkflow(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  if (Array.isArray(raw.results)) return raw.results[0] ?? null;
  if (raw.id) return raw;
  return null;
}

export function getAdjustmentTotalValue(adjustment) {
  const lines = Array.isArray(adjustment?.lines) ? adjustment.lines : [];
  if (lines.length > 0) {
    const computed = lines.reduce(
      (sum, line) => sum + Math.abs(Number(line.difference || 0)) * Number(line.unit_price || 0),
      0
    );
    if (computed > 0) return computed;
  }
  return Number(adjustment?.total_value || 0);
}

export function findMatchedLevel(workflow, totalAmount) {
  if (!workflow?.is_active) return null;
  const levels = Array.isArray(workflow.levels) ? workflow.levels : [];
  return (
    levels.find((lvl) => {
      const from = Number(lvl.from_amount);
      const to =
        lvl.to_amount !== null && lvl.to_amount !== undefined ? Number(lvl.to_amount) : Infinity;
      return totalAmount >= from && totalAmount <= to;
    }) ?? null
  );
}

function getApprovalLog(adjustment) {
  return Array.isArray(adjustment?.approval_log) ? adjustment.approval_log : [];
}

function getStatusLog(adjustment) {
  return Array.isArray(adjustment?.status_log) ? adjustment.status_log : [];
}

function formatActorLabel(name, email) {
  return [name, email].filter(Boolean).join(' • ') || 'Unknown';
}

export function computeAdjustmentWorkflowInfo(
  adjustment,
  rawWorkflow,
  userEmail,
  { forceUnordered = false } = {}
) {
  const status = String(adjustment?.status || '').trim();
  const normalizedStatus = status.toLowerCase();
  const isPendingApproval = normalizedStatus === 'pending approval';
  const isApproved = normalizedStatus === 'approved';

  const approvalLog = getApprovalLog(adjustment);
  const statusLog = getStatusLog(adjustment);

  const approvalHistory = approvalLog.map((entry) => ({
    label: `${entry.status_from || 'Pending Approval'} → ${entry.status_to || 'Pending Approval'}`,
    actor: formatActorLabel(entry.name, entry.email),
    time: entry.log_time || null,
  }));

  const statusChangeHistory = statusLog.map((entry) => ({
    label: `${entry.status_from || 'Created'} → ${entry.status_to || 'Unknown'}`,
    actor: formatActorLabel(entry.name, entry.email),
    reference: entry.adjustment_code || adjustment?.adjustment_number || null,
  }));

  const workflow = normalizeWorkflow(rawWorkflow);

  const emptyInfo = {
    matchedLevel: null,
    canApprove: false,
    noMatchWarning: isPendingApproval,
    nextApprover: null,
    approvalProgress: null,
    fullyApproved: isApproved,
    levelUsers: [],
    orderedApproval: false,
    alreadyApproved: false,
    approvedNames: [],
    pendingNames: [],
    approvedCount: approvalLog.length,
    pendingCount: 0,
    remainingApprovalCount: 0,
    minRequired: 0,
    currentLevelLabel: null,
    currentStatus: status || 'Unknown',
    eligibleApproverNames: [],
    approvalHistory,
    statusChangeHistory,
  };

  if (!workflow) {
    return emptyInfo;
  }

  const totalAmount = getAdjustmentTotalValue(adjustment);
  const matchedLevel = findMatchedLevel(workflow, totalAmount);

  if (!matchedLevel) {
    return emptyInfo;
  }

  const levelUsers = Array.isArray(matchedLevel.level_users) ? matchedLevel.level_users : [];
  const eligibleApproverNames = levelUsers
    .map((lu) => lu.user_detail?.full_name || lu.user_detail?.email || '')
    .filter(Boolean);

  const alreadyApproved = userEmail
    ? approvalLog.some((entry) => (entry.email ?? '').toLowerCase() === userEmail.toLowerCase())
    : false;

  const approvedEmails = new Set(
    approvalLog.map((entry) => (entry.email ?? '').toLowerCase()).filter(Boolean)
  );
  const approvedNames = approvalLog.map((entry) => entry.name || entry.email || '').filter(Boolean);

  const approvalLevel = Number(adjustment?.approval_level ?? 0);
  const minRequired = Number(matchedLevel.minimum_approval_required ?? 1);
  const orderedApproval = forceUnordered ? false : matchedLevel.level_maintain_require === 'yes';
  const workflowComplete = approvalLevel >= minRequired || isApproved;
  const remainingApprovalCount = workflowComplete ? 0 : Math.max(0, minRequired - approvalLevel);

  const pendingLevelUsers = workflowComplete
    ? []
    : levelUsers.filter((lu) => {
        const email = (lu.user_detail?.email ?? '').toLowerCase();
        return email && !approvedEmails.has(email);
      });

  const pendingNames = pendingLevelUsers
    .map((lu) => lu.user_detail?.full_name || lu.user_detail?.email || '')
    .filter(Boolean);

  const userEntry = userEmail
    ? levelUsers.find(
        (lu) => (lu.user_detail?.email ?? '').toLowerCase() === userEmail.toLowerCase()
      )
    : null;

  let canApprove = false;
  if (userEntry && !isApproved && !workflowComplete && !alreadyApproved && isPendingApproval) {
    if (orderedApproval) {
      canApprove = userEntry.approval_order === approvalLevel + 1;
    } else {
      canApprove = approvalLevel < minRequired;
    }
  }

  let nextApprover = null;
  let displayPendingNames = pendingNames;

  if (!workflowComplete) {
    if (orderedApproval) {
      const nextOrder = approvalLevel + 1;
      const nextUser = levelUsers.find((lu) => lu.approval_order === nextOrder);
      nextApprover = nextUser?.user_detail?.full_name || nextUser?.user_detail?.email || null;
      displayPendingNames = nextApprover ? [nextApprover] : [];
    } else {
      nextApprover = pendingNames.length ? pendingNames.join(', ') : null;
      displayPendingNames = pendingNames;
    }
  }

  return {
    matchedLevel,
    canApprove,
    noMatchWarning: false,
    nextApprover,
    approvalProgress: `${approvalLevel} / ${minRequired}`,
    fullyApproved: workflowComplete,
    levelUsers,
    orderedApproval,
    alreadyApproved,
    approvedNames,
    pendingNames: displayPendingNames,
    approvedCount: approvalLevel,
    pendingCount: displayPendingNames.length,
    remainingApprovalCount,
    minRequired,
    currentLevelLabel: `Level ${matchedLevel.level_number}`,
    currentStatus: status || 'Unknown',
    eligibleApproverNames,
    approvalHistory,
    statusChangeHistory,
  };
}
