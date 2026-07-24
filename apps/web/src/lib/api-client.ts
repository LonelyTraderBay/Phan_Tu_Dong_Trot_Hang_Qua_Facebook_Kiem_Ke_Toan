import { buildApiHeaders, getActiveOrgId } from './org-context';
import {
  getAccessToken,
  type OrganizationRole,
  type StoredOrganization,
} from './auth-session';

export type ChannelConnection = {
  id: string;
  provider: string;
  externalPageId: string;
  status: 'active' | 'needs_reauth' | 'revoked' | string;
  createdAt: string;
};

export type ApiAuthContext = {
  accessToken: string;
  orgId: string;
};

export type OrganizationMembership = {
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    timezone: string;
    locale: string;
    suspendedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  membership: {
    id: string;
    orgId: string;
    userId: string;
    role: OrganizationRole;
  };
};

export type MembershipInvite = {
  id: string;
  orgId: string;
  email: string;
  role: OrganizationRole;
  expiresAt: string;
  createdAt: string;
};

export class ApiClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3001';
}

export function getApiAuthContext(): ApiAuthContext | null {
  const accessToken = getAccessToken();
  const orgId = getActiveOrgId();

  if (!accessToken || !orgId) {
    return null;
  }

  return { accessToken, orgId };
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options: {
    requireOrg?: boolean;
    accessToken?: string;
  } = {},
): Promise<T> {
  const accessToken = options.accessToken ?? getAccessToken();
  if (!accessToken) {
    throw new ApiClientError(
      'missing_auth',
      'Thiếu phiên đăng nhập.',
    );
  }

  const requireOrg = options.requireOrg ?? true;
  const orgId = getActiveOrgId();
  if (requireOrg && !orgId) {
    throw new ApiClientError('missing_auth', 'Thiếu tổ chức đang chọn.');
  }

  const headers = new Headers(init.headers);
  const defaultHeaders = requireOrg
    ? buildApiHeaders({ accessToken, orgId: orgId as string })
    : {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };

  for (const [key, value] of Object.entries(defaultHeaders)) {
    headers.set(key, headers.get(key) ?? value);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `Yêu cầu API thất bại (${response.status})`;
    let code = 'api_error';

    try {
      const body = (await response.json()) as {
        code?: string;
        message?: string;
      };
      if (body.code) {
        code = body.code;
      }
      if (body.message) {
        message = body.message;
      }
    } catch {
      // Ignore non-JSON error bodies.
    }

    throw new ApiClientError(code, message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function listChannels(): Promise<ChannelConnection[]> {
  return apiFetch<ChannelConnection[]>('/v1/channels');
}

export async function listOrganizations(
  accessToken?: string,
): Promise<OrganizationMembership[]> {
  return apiFetch<OrganizationMembership[]>('/v1/orgs', {}, {
    accessToken,
    requireOrg: false,
  });
}

export function mapOrganizationMemberships(
  memberships: OrganizationMembership[],
): StoredOrganization[] {
  return memberships.map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    role: membership.membership.role,
  }));
}

export async function createInvite(input: {
  orgId: string;
  email: string;
  role: OrganizationRole;
}): Promise<{ invite: MembershipInvite }> {
  return apiFetch<{ invite: MembershipInvite }>(
    `/v1/orgs/${encodeURIComponent(input.orgId)}/invites`,
    {
      method: 'POST',
      body: JSON.stringify({
        email: input.email,
        role: input.role,
      }),
    },
  );
}

export async function getMetaOAuthUrl(): Promise<{ url: string }> {
  return apiFetch<{ url: string }>('/v1/channels/meta/oauth-url');
}

export async function completeMetaOAuth(
  code: string,
  state: string,
): Promise<{ connections: ChannelConnection[] }> {
  return apiFetch<{ connections: ChannelConnection[] }>(
    '/v1/channels/meta/complete',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    },
  );
}
