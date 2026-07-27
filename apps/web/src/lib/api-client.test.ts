import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './api-client';

describe('apiFetch error handling', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('surfaces the RFC 7807 `detail` field as the error message', async () => {
    // Regression: the API's global error filter
    // (apps/api/src/common/filters/problem-details.filter.ts) always returns
    // { type, title, status, detail, instance, requestId, code } — there is
    // no top-level `message` field in that shape. apiFetch used to only look
    // for `message`, so every API error (org membership, entitlement limits,
    // validation, etc.) was shown to users as a generic, useless
    // "Yêu cầu API thất bại (403)" instead of the real, actionable detail
    // text the server already computed.
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          type: 'about:blank',
          title: 'Forbidden',
          status: 403,
          detail: 'Plan max_pages entitlement would be exceeded',
          instance: '/v1/channels/zalo/connect',
          requestId: 'req-1',
          code: 'max_pages_exceeded',
        }),
        { status: 403 },
      ),
    ) as unknown as typeof fetch;

    await expect(
      apiFetch(
        '/v1/channels/zalo/connect',
        {},
        { accessToken: 'tok', requireOrg: false },
      ),
    ).rejects.toMatchObject({
      message: 'Plan max_pages entitlement would be exceeded',
      code: 'max_pages_exceeded',
    });
  });

  it('falls back to `title` when `detail` is missing', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          instance: '/v1/whatever',
          requestId: 'req-2',
        }),
        { status: 404 },
      ),
    ) as unknown as typeof fetch;

    await expect(
      apiFetch('/v1/whatever', {}, { accessToken: 'tok', requireOrg: false }),
    ).rejects.toMatchObject({ message: 'Not Found' });
  });

  it('falls back to a generic message when the error body has no usable text', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(new Response('', { status: 500 })) as unknown as typeof fetch;

    await expect(
      apiFetch('/v1/whatever', {}, { accessToken: 'tok', requireOrg: false }),
    ).rejects.toMatchObject({ message: 'Yêu cầu API thất bại (500)' });
  });
});
