export function normalizeCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.results) ? payload.results : [];
}

export function getActivityChipProps(isActive) {
  if (isActive) {
    return { color: 'success', label: 'Active' };
  }

  return { color: 'default', label: 'Inactive' };
}

export function getCoverageChipProps(memberCount) {
  if (memberCount <= 0) {
    return { color: 'error', label: 'No Members' };
  }

  if (memberCount === 1) {
    return { color: 'warning', label: 'Single Reviewer' };
  }

  return { color: 'info', label: `${memberCount} Members` };
}

export function formatMemberNames(memberNames) {
  if (!Array.isArray(memberNames) || !memberNames.length) {
    return 'No members assigned';
  }

  return memberNames.join(', ');
}

export function getTeamAction(isActive, memberCount) {
  if (!isActive) {
    return 'Keep this team out of live inspections until it is reactivated or ownership is reassigned.';
  }

  if (memberCount <= 0) {
    return 'Assign at least one team member before routing inspection work to this team.';
  }

  if (memberCount === 1) {
    return 'Add backup coverage so one absence does not block inspections or escalation.';
  }

  return 'Coverage is healthy enough for live inspection ownership and escalation handling.';
}
