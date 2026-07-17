export const SCRAP_APPROVAL_WORKFLOW_URL =
  '/api/approval-workflows/?module_type=inventory&menu=scrap_management';

function normalizeWorkflow(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw.find((wf) => wf?.is_active) ?? raw[0] ?? null;
  if (Array.isArray(raw.results)) {
    return raw.results.find((wf) => wf?.is_active) ?? raw.results[0] ?? null;
  }
  if (raw.id) return raw;
  return null;
}

function getApprovalLog(scrapRecord) {
  return Array.isArray(scrapRecord?.approval_log) ? scrapRecord.approval_log : [];
}

export function computeScrapWorkflowInfo(scrapRecord, rawWorkflow, userEmail) {
  const status = String(scrapRecord?.status || '').trim();
  const normalizedStatus = status.toLowerCase();
  const isPendingApproval = normalizedStatus === 'pending approval';
  const isApproved = normalizedStatus === 'approved';
  const approvalLog = getApprovalLog(scrapRecord);

  const emptyInfo = {
    matchedLevel: null,
    canApprove: false,
    nextApprover: null,
    orderedApproval: false,
    alreadyApproved: false,
    approvedNames: approvalLog.map((entry) => entry.name || entry.email || '').filter(Boolean),
    pendingNames: [],
    eligibleApproverNames: [],
  };

  const workflow = normalizeWorkflow(rawWorkflow);
  const levels = Array.isArray(workflow?.levels) ? workflow.levels : [];
  const matchedLevel = workflow?.is_active ? levels[0] : null;

  if (!matchedLevel) {
    return emptyInfo;
  }

  const levelUsers = Array.isArray(matchedLevel.level_users) ? matchedLevel.level_users : [];
  const approvalLevel = Number(scrapRecord?.approval_level ?? 0);
  const minRequired = Number(matchedLevel.minimum_approval_required ?? 1);
  const orderedApproval = matchedLevel.level_maintain_require === 'yes';
  const workflowComplete = isApproved || approvalLevel >= minRequired;

  const approvedEmails = new Set(
    approvalLog.map((entry) => String(entry.email || '').toLowerCase()).filter(Boolean)
  );

  const eligibleApproverNames = levelUsers
    .map((lu) => lu.user_detail?.full_name || lu.user_detail?.email || '')
    .filter(Boolean);

  const pendingUsers = workflowComplete
    ? []
    : levelUsers.filter((lu) => {
        const email = String(lu.user_detail?.email || '').toLowerCase();
        return email && !approvedEmails.has(email);
      });

  const pendingNames = pendingUsers
    .map((lu) => lu.user_detail?.full_name || lu.user_detail?.email || '')
    .filter(Boolean);

  const currentEmail = String(userEmail || '').toLowerCase();
  const userEntry = currentEmail
    ? levelUsers.find((lu) => String(lu.user_detail?.email || '').toLowerCase() === currentEmail)
    : null;
  const alreadyApproved = currentEmail ? approvedEmails.has(currentEmail) : false;

  let nextApprover = null;
  let displayPendingNames = pendingNames;

  if (!workflowComplete) {
    if (orderedApproval) {
      const nextUser = levelUsers.find((lu) => Number(lu.approval_order) === approvalLevel + 1);
      nextApprover = nextUser?.user_detail?.full_name || nextUser?.user_detail?.email || null;
      displayPendingNames = nextApprover ? [nextApprover] : [];
    } else {
      nextApprover = pendingNames.length ? pendingNames.join(', ') : null;
    }
  }

  let canApprove = false;
  if (userEntry && isPendingApproval && !workflowComplete && !alreadyApproved) {
    canApprove = orderedApproval
      ? Number(userEntry.approval_order) === approvalLevel + 1
      : approvalLevel < minRequired;
  }

  return {
    matchedLevel,
    canApprove,
    nextApprover,
    orderedApproval,
    alreadyApproved,
    approvedNames: emptyInfo.approvedNames,
    pendingNames: displayPendingNames,
    eligibleApproverNames,
  };
}
