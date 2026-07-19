export const GATEWAY_PROJECT_STORAGE_KEY = 'accounts-gateway-ngo-project-id';
export const GATEWAY_PROJECT_CHANGE_EVENT = 'accounts-gateway-project-change';

export function readGatewayProjectId() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(GATEWAY_PROJECT_STORAGE_KEY);
  return raw ? Number(raw) : null;
}

export function notifyGatewayProjectChange(projectId) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(GATEWAY_PROJECT_CHANGE_EVENT, { detail: { projectId } })
  );
}
