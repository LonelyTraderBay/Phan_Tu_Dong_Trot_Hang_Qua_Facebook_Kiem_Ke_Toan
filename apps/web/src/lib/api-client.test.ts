import { afterEach, describe, expect, it, vi } from 'vitest';

// sendInboxMessage (like every other wrapper in api-client.ts) reads the
// access token / active org straight from browser storage via these two
// modules. Tests run under Node (no `window`), so both always report
// signed-out; stub them to simulate an authenticated session with an active
// org, the same way a logged-in browser tab would behave.
vi.mock('./auth-session', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./auth-session')>();
  return { ...actual, getAccessToken: () => 'test-access-token' };
});

vi.mock('./org-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./org-context')>();
  return {
    ...actual,
    getActiveOrgId: () => '11111111-1111-1111-1111-111111111111',
  };
});

import { apiFetch, sendInboxMessage, updateOrgSettings } from './api-client';

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

describe('sendInboxMessage', () => {
  const originalFetch = global.fetch;
  const CONVERSATION_ID = '33333333-3333-3333-3333-333333333333';

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('POSTs the trimmed text to the conversation messages endpoint and returns the sent message', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            id: 'msg-1',
            conversationId: CONVERSATION_ID,
            direction: 'outbound',
            senderType: 'staff',
            rawType: 'text',
            bodyText: 'Xin chào!',
            providerMessageId: 'mid-1',
            createdAt: '2026-07-28T12:00:00.000Z',
          },
        }),
        { status: 201 },
      ),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const message = await sendInboxMessage(CONVERSATION_ID, 'Xin chào!');

    expect(fetchMock).toHaveBeenCalledWith(
      `http://127.0.0.1:4701/v1/inbox/conversations/${CONVERSATION_ID}/messages`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: 'Xin chào!' }),
      }),
    );
    expect(message).toEqual({
      id: 'msg-1',
      conversationId: CONVERSATION_ID,
      direction: 'outbound',
      senderType: 'staff',
      rawType: 'text',
      bodyText: 'Xin chào!',
      providerMessageId: 'mid-1',
      createdAt: '2026-07-28T12:00:00.000Z',
    });
  });

  it('surfaces the API error message when the send fails', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          type: 'about:blank',
          title: 'Bad Request',
          status: 400,
          detail:
            'Không gửi được tin nhắn — có thể đã quá 24 giờ kể từ tin nhắn cuối của khách, hoặc kênh kết nối gặp sự cố.',
          code: 'message_send_failed',
        }),
        { status: 400 },
      ),
    ) as unknown as typeof fetch;

    await expect(
      sendInboxMessage(CONVERSATION_ID, 'Xin chào!'),
    ).rejects.toMatchObject({
      code: 'message_send_failed',
      message:
        'Không gửi được tin nhắn — có thể đã quá 24 giờ kể từ tin nhắn cuối của khách, hoặc kênh kết nối gặp sự cố.',
    });
  });
});

describe('updateOrgSettings', () => {
  const originalFetch = global.fetch;
  const ORG_ID = '11111111-1111-1111-1111-111111111111';

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('PATCHes /v1/orgs/:orgId/settings with the given patch and returns the updated organization', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          organization: {
            id: ORG_ID,
            name: 'Shop A',
            slug: 'shop-a',
            plan: 'free',
            settingsJson: { auto_confirm: true, ai_replies: false },
            timezone: 'Asia/Ho_Chi_Minh',
            locale: 'vi',
            suspendedAt: null,
            createdAt: '2026-07-24T10:00:00.000Z',
            updatedAt: '2026-07-28T00:00:00.000Z',
          },
        }),
        { status: 200 },
      ),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const organization = await updateOrgSettings(ORG_ID, {
      autoConfirm: true,
      aiReplies: false,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `http://127.0.0.1:4701/v1/orgs/${ORG_ID}/settings`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ autoConfirm: true, aiReplies: false }),
      }),
    );
    expect(organization).toEqual({
      id: ORG_ID,
      name: 'Shop A',
      slug: 'shop-a',
      plan: 'free',
      settingsJson: { auto_confirm: true, ai_replies: false },
      timezone: 'Asia/Ho_Chi_Minh',
      locale: 'vi',
      suspendedAt: null,
      createdAt: '2026-07-24T10:00:00.000Z',
      updatedAt: '2026-07-28T00:00:00.000Z',
    });
  });

  it('surfaces the API error message when the save fails', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          type: 'about:blank',
          title: 'Forbidden',
          status: 403,
          detail: 'Missing permission: org.settings.write',
          code: 'permission_denied',
        }),
        { status: 403 },
      ),
    ) as unknown as typeof fetch;

    await expect(
      updateOrgSettings(ORG_ID, { autoConfirm: true }),
    ).rejects.toMatchObject({
      code: 'permission_denied',
      message: 'Missing permission: org.settings.write',
    });
  });
});
