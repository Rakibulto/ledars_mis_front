export const GIN_APPROVAL_WORKFLOW_URL =
  '/api/approval-workflows/?module_type=inventory&menu=good_issue_note';

export const NO_WORKFLOW_LEVEL_MESSAGE =
  'Please contact the admin to configure the Approval Workflow properly with level-based permissions from the Approval Workflow settings.';

export function normalizeWorkflow(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  if (Array.isArray(raw.results)) return raw.results[0] ?? null;
  if (raw.id) return raw;
  return null;
}

export function getGinTotalValue(gin) {
  const lines = Array.isArray(gin?.line_items) ? gin.line_items : [];
  if (lines.length > 0) {
    const computed = lines.reduce(
      (sum, item) => sum + Number(item.issued_qty || 0) * Number(item.unit_price || 0),
      0
    );
    if (computed > 0) return computed;
  }
  return Number(gin?.total_value || 0);
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

function getApprovalLog(gin) {
  return Array.isArray(gin?.approval_log) ? gin.approval_log : [];
}

function getStatusLog(gin) {
  return Array.isArray(gin?.status_log) ? gin.status_log : [];
}

function formatActorLabel(name, email) {
  return [name, email].filter(Boolean).join(' • ') || 'Unknown';
}

export function computeGinWorkflowInfo(gin, rawWorkflow, userEmail) {
  const status = String(gin?.status || '').trim();
  const normalizedStatus = status.toLowerCase();
  const isPendingApproval = normalizedStatus === 'pending approval';
  const isApproved = normalizedStatus === 'approved';
  const isIssued = normalizedStatus === 'issued';

  const approvalLog = getApprovalLog(gin);
  const statusLog = getStatusLog(gin);

  const approvalHistory = approvalLog
    .filter((entry) => entry?.action !== 'issue')
    .map((entry) => ({
      label: `${entry.status_from || 'Pending Approval'} → ${entry.status_to || 'Pending Approval'}`,
      actor: formatActorLabel(entry.name, entry.email),
      time: entry.log_time || null,
    }));

  const statusChangeHistory = statusLog.map((entry) => ({
    label: `${entry.status_from || 'Created'} → ${entry.status_to || 'Unknown'}`,
    actor: formatActorLabel(entry.name, entry.email),
    reference: entry.gin_code || gin?.gin_number || null,
  }));

  const issuedByLabel = isIssued
    ? formatActorLabel(gin?.issued_by_name, gin?.issued_by_email) ||
      statusLog
        .filter((entry) => String(entry?.status_to || '').toLowerCase() === 'issued')
        .map((entry) => formatActorLabel(entry.name, entry.email))
        .at(-1) ||
      'Not captured'
    : null;

  const workflow = normalizeWorkflow(rawWorkflow);

  const emptyInfo = {
    matchedLevel: null,
    canApprove: false,
    canIssue: false,
    noMatchWarning: isPendingApproval,
    nextApprover: null,
    approvalProgress: null,
    fullyApproved: isApproved || isIssued,
    levelUsers: [],
    orderedApproval: false,
    alreadyApproved: false,
    approvedNames: [],
    pendingNames: [],
    approvedCount: approvalLog.filter((e) => e?.action !== 'issue').length,
    pendingCount: 0,
    remainingApprovalCount: 0,
    minRequired: 0,
    currentLevelLabel: null,
    currentStatus: status || 'Unknown',
    issuedBy: issuedByLabel,
    approvalHistory,
    statusChangeHistory,
  };

  if (!workflow) {
    return emptyInfo;
  }

  const totalAmount = getGinTotalValue(gin);
  const matchedLevel = findMatchedLevel(workflow, totalAmount);

  if (!matchedLevel) {
    return emptyInfo;
  }

  const alreadyApproved = userEmail
    ? approvalLog.some(
        (entry) =>
          entry?.action !== 'issue' && (entry.email ?? '').toLowerCase() === userEmail.toLowerCase()
      )
    : false;

  const approvedEmails = new Set(
    approvalLog
      .filter((entry) => entry?.action !== 'issue')
      .map((entry) => (entry.email ?? '').toLowerCase())
      .filter(Boolean)
  );
  const approvedNames = approvalLog
    .filter((entry) => entry?.action !== 'issue')
    .map((entry) => entry.name || entry.email || '')
    .filter(Boolean);

  const approvalLevel = Number(gin?.approval_level ?? 0);
  const minRequired = Number(matchedLevel.minimum_approval_required ?? 1);
  const levelUsers = Array.isArray(matchedLevel.level_users) ? matchedLevel.level_users : [];
  const orderedApproval = matchedLevel.level_maintain_require === 'yes';
  const workflowComplete = approvalLevel >= minRequired || isApproved || isIssued;
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
  if (
    userEntry &&
    !isApproved &&
    !isIssued &&
    !workflowComplete &&
    !alreadyApproved &&
    isPendingApproval
  ) {
    if (orderedApproval) {
      canApprove = userEntry.approval_order === approvalLevel + 1;
    } else {
      canApprove = approvalLevel < minRequired;
    }
  }

  const canIssue = Boolean(userEntry && isApproved && !isIssued);

  let nextApprover = null;
  let displayPendingNames = pendingNames;

  if (!workflowComplete && !isIssued) {
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
    canIssue,
    noMatchWarning: false,
    nextApprover: orderedApproval ? nextApprover : nextApprover,
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
    issuedBy: issuedByLabel,
    approvalHistory,
    statusChangeHistory,
  };
}
