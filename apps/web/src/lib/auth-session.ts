import { getActiveOrgId, setActiveOrgId } from './org-context';

export const ACCESS_TOKEN_STORAGE_KEY = 'omni.accessToken';
export const ORGANIZATIONS_STORAGE_KEY = 'omni.organizations';
export const SESSION_CHANGED_EVENT = 'omni:session-changed';

export type OrganizationRole = 'owner' | 'cskh' | 'kho';

export type StoredOrganization = {
  id: string;
  name: string;
  slug?: string;
  role?: OrganizationRole;
};

export type StoredSession = {
  accessToken: string;
  organizations: StoredOrganization[];
  activeOrgId: string | null;
};

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function getStoredOrganizations(): StoredOrganization[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(ORGANIZATIONS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return normalizeOrganizations(parsed);
  } catch {
    return [];
  }
}

export function getStoredSession(): StoredSession | null {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    organizations: getStoredOrganizations(),
    activeOrgId: getActiveOrgId(),
  };
}

export function saveSession(input: {
  accessToken: string;
  organizations: StoredOrganization[];
  activeOrgId?: string | null;
}): StoredSession {
  const organizations = normalizeOrganizations(input.organizations);
  const preferredActiveOrgId = input.activeOrgId ?? getActiveOrgId();
  const activeOrgId =
    preferredActiveOrgId &&
    organizations.some((org) => org.id === preferredActiveOrgId)
      ? preferredActiveOrgId
      : organizations[0]?.id ?? null;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, input.accessToken);
    window.localStorage.setItem(
      ORGANIZATIONS_STORAGE_KEY,
      JSON.stringify(organizations),
    );
  }

  setActiveOrgId(activeOrgId);
  notifySessionChanged();

  return {
    accessToken: input.accessToken,
    organizations,
    activeOrgId,
  };
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(ORGANIZATIONS_STORAGE_KEY);
  }

  setActiveOrgId(null);
  notifySessionChanged();
}

export function saveOrganizations(organizations: StoredOrganization[]): void {
  const normalized = normalizeOrganizations(organizations);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      ORGANIZATIONS_STORAGE_KEY,
      JSON.stringify(normalized),
    );
  }

  const activeOrgId = getActiveOrgId();
  if (!activeOrgId || !normalized.some((org) => org.id === activeOrgId)) {
    setActiveOrgId(normalized[0]?.id ?? null);
  }

  notifySessionChanged();
}

export function normalizeOrganizations(input: unknown[]): StoredOrganization[] {
  const organizations = new Map<string, StoredOrganization>();

  for (const item of input) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const row = item as Partial<StoredOrganization>;
    const id = typeof row.id === 'string' ? row.id.trim() : '';
    if (!id) {
      continue;
    }

    const name =
      typeof row.name === 'string' && row.name.trim()
        ? row.name.trim()
        : id;
    const slug =
      typeof row.slug === 'string' && row.slug.trim()
        ? row.slug.trim()
        : undefined;
    const role = isOrganizationRole(row.role) ? row.role : undefined;

    organizations.set(id, {
      id,
      name,
      ...(slug ? { slug } : {}),
      ...(role ? { role } : {}),
    });
  }

  return [...organizations.values()];
}

function isOrganizationRole(role: unknown): role is OrganizationRole {
  return role === 'owner' || role === 'cskh' || role === 'kho';
}

function notifySessionChanged(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}
