const ACTIVE_ORG_ID_STORAGE_KEY = 'omni.activeOrgId';

let activeOrgId: string | null = null;

export function getActiveOrgId(): string | null {
  if (typeof window === 'undefined') {
    return activeOrgId;
  }

  return window.localStorage.getItem(ACTIVE_ORG_ID_STORAGE_KEY);
}

export function setActiveOrgId(orgId: string | null): void {
  activeOrgId = orgId;

  if (typeof window === 'undefined') {
    return;
  }

  if (orgId === null) {
    window.localStorage.removeItem(ACTIVE_ORG_ID_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(ACTIVE_ORG_ID_STORAGE_KEY, orgId);
}

export function buildApiHeaders(input: {
  accessToken: string;
  orgId: string;
}): Record<string, string> {
  return {
    Authorization: `Bearer ${input.accessToken}`,
    'X-Org-Id': input.orgId,
    'Content-Type': 'application/json',
  };
}
