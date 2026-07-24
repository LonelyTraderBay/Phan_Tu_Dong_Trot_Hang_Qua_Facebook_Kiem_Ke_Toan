import { describe, expect, it, vi } from 'vitest';

import { AdvisorService } from './advisor.service';

const ORG_ID = '11111111-1111-1111-1111-111111111111';

function createService(
  input: {
    killAiAll?: boolean;
    aiStatus?: number;
    aiBody?: Record<string, unknown>;
  } = {},
) {
  const featureFlags = {
    isEnabled: vi.fn(
      async (key: string) => key === 'kill_ai_all' && input.killAiAll,
    ),
  };
  const aiRuns = {
    writeRun: vi.fn(async (run: Record<string, unknown>) => ({
      aiRun: {
        id: 'run-1',
        ...run,
        createdAt: '2026-07-27T12:00:00.000Z',
      },
    })),
  };
  const fetchFn = vi.fn(async () => ({
    ok: (input.aiStatus ?? 200) >= 200 && (input.aiStatus ?? 200) < 300,
    status: input.aiStatus ?? 200,
    json: async () =>
      input.aiBody ?? {
        suggestionsText: 'Gợi ý bán hàng stub',
        disclaimer: 'Advisor chỉ tư vấn; không auto-post.',
        promptVersion: 'advisor.v1',
        model: 'advisor-stub',
        tokens: { input: 0, output: 0, total: 0 },
        toolsUsed: [{ kind: 'advisor', mode: 'stub' }],
        citations: [{ source: 'sales_aggregates_stub' }],
      },
    text: async () => 'AI failed',
  }));

  return {
    service: new AdvisorService(
      featureFlags as never,
      aiRuns as never,
      fetchFn as never,
      {
        AI_BASE_URL: 'http://ai.local',
        SERVICE_M2M_KEY: 'service-key',
      },
    ),
    featureFlags,
    aiRuns,
    fetchFn,
  };
}

describe('AdvisorService', () => {
  it('calls AI advisor, writes ai_runs as advisor, and returns advise-only response', async () => {
    const { service, fetchFn, aiRuns } = createService();

    const result = await service.suggest({
      orgId: ORG_ID,
      body: { goal: 'Tăng doanh thu cuối tuần' },
    });

    expect(fetchFn).toHaveBeenCalledWith(
      'http://ai.local/internal/v1/ai/advise',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-service-key': 'service-key',
        }),
      }),
    );
    expect(JSON.parse(String(fetchFn.mock.calls[0]?.[1]?.body))).toMatchObject({
      orgId: ORG_ID,
      goal: 'Tăng doanh thu cuối tuần',
    });
    expect(aiRuns.writeRun).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: ORG_ID,
        promptVersion: 'advisor.v1',
        model: 'advisor-stub',
        status: 'succeeded',
        tools: expect.arrayContaining([
          expect.objectContaining({ kind: 'advisor', adviseOnly: true }),
        ]),
      }),
    );
    expect(result).toMatchObject({
      suggestionsText: 'Gợi ý bán hàng stub',
      disclaimer: expect.stringContaining('không auto-post'),
      entitlement: { allowed: true },
    });
  });

  it('does not call AI when kill_ai_all is enabled', async () => {
    const { service, fetchFn, aiRuns } = createService({ killAiAll: true });

    await expect(
      service.suggest({ orgId: ORG_ID, body: {} }),
    ).rejects.toMatchObject({
      response: { code: 'advisor_disabled' },
      status: 503,
    });
    expect(fetchFn).not.toHaveBeenCalled();
    expect(aiRuns.writeRun).not.toHaveBeenCalled();
  });
});
