import { buildApiHeaders, getActiveOrgId } from './org-context';

const ACCESS_TOKEN_STORAGE_KEY = 'omni.accessToken';

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

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
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
): Promise<T> {
  const auth = getApiAuthContext();
  if (!auth) {
    throw new ApiClientError(
      'missing_auth',
      'Thiếu phiên đăng nhập hoặc tổ chức đang chọn.',
    );
  }

  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(buildApiHeaders(auth))) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
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

export async function getMetaOAuthUrl(): Promise<{ url: string }> {
  return apiFetch<{ url: string }>('/v1/channels/meta/oauth-url');
}
